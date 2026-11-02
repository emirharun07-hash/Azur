#!/usr/bin/env python3
"""Schnitt auf den Beat: baut ein Reel (9:16), bei dem jeder Schnitt genau auf einem Beat der Musik liegt.

Drei Befehle:

  analyze  SONG [--start S] [--dur D]
      Findet Tempo (BPM), alle Beats, die starken Beats (die "Eins" im Takt) und den lautesten Einsatz (Drop).

  auto     SONG CLIPORDNER PLAN.json [--start S] [--dur D] [--beats N]
      Schreibt einen Schnittplan: Clips aus dem Ordner der Reihe nach, jeder N Beats lang.
      Den Plan kann man danach von Hand anpassen (Texte, Reihenfolge, Länge pro Clip).

  render   PLAN.json AUSGABE.mp4
      Baut das Reel. Ergebnis:
        AUSGABE.mp4                mit Musik (zum Ansehen)
        AUSGABE_ohne_musik.mp4     zum Hochladen, Sound dann in Instagram/TikTok wählen
        AUSGABE_schnittliste.txt   wo jeder Schnitt liegt und ab welcher Sekunde der Sound starten muss

Clips dürfen Videos (.mp4, .mov, ...) oder Bilder (.jpg, .png, .webp) sein. Bilder bekommen einen langsamen Zoom.

Plan (JSON), Beispiel:
{
  "audio": "song.mp3",          # Pfad relativ zur Plan-Datei
  "audio_start": 41.86,         # ab dieser Sekunde im Song beginnt das Reel (am besten ein starker Beat)
  "fps": 30,
  "size": [1080, 1920],
  "segments": [
    {"clip": "clips/zimmer.jpg", "beats": 4, "text": "Das ist kein Kinderzimmer.", "zoom": "in"},
    {"clip": "clips/trikot.mp4", "beats": 2, "from": 1.5},
    {"clip": "clips/logo.png",   "beats": 4, "punch": true}
  ]
}

Felder pro Abschnitt: clip (Pflicht), beats (Länge in Beats, Standard 2), from (Startsekunde im Video),
text (Einblendung), zoom ("in", "out" oder "none" für Bilder), punch (kurzer Zoom-Stoß direkt am Schnitt).

Nur kostenlose Werkzeuge: ffmpeg und die Python-Bibliothek librosa (pip install librosa).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"}


def die(msg):
    print("FEHLER: " + msg, file=sys.stderr)
    sys.exit(1)


def need(tool):
    if not shutil.which(tool):
        die(tool + " fehlt. Bitte installieren (kostenlos).")


# ---------------------------------------------------------------- Analyse

def analyse(song, start=0.0, dur=None):
    try:
        import librosa
        import numpy as np
    except ImportError:
        die("librosa fehlt. Installieren mit: pip install librosa")
    y, sr = librosa.load(song, sr=22050, mono=True)
    total = len(y) / sr
    hop = 512
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop, units="frames")
    tempo = float(np.atleast_1d(tempo)[0])
    beats = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop)
    # Beats genauer auf den nächsten Anschlag (Onset-Spitze) setzen, höchstens 40 ms Abstand.
    peaks = librosa.onset.onset_detect(onset_envelope=onset, sr=sr, hop_length=hop, units="time", backtrack=False)
    refined = []
    for b in beats:
        if len(peaks):
            p = peaks[np.argmin(np.abs(peaks - b))]
            refined.append(float(p) if abs(p - b) <= 0.04 else float(b))
        else:
            refined.append(float(b))
    beats = refined
    # Stärke je Beat
    strength = [float(onset[min(len(onset) - 1, int(round(b * sr / hop)))]) for b in beats]
    # Die "Eins" im 4er-Takt: die Phase, auf der die Beats im Schnitt am stärksten sind.
    best_phase, best = 0, -1.0
    for ph in range(4):
        vals = strength[ph::4]
        if vals:
            m = sum(vals) / len(vals)
            if m > best:
                best, best_phase = m, ph
    # Drop: größter Sprung der Lautstärke (2 s Fenster), auf den nächsten Beat gesetzt
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    win = max(1, int(2.0 * sr / hop))
    drop = None
    if len(rms) > 2 * win and beats:
        sm = np.convolve(rms, np.ones(win) / win, mode="same")
        jump = sm[win:] - sm[:-win]
        t = float(librosa.frames_to_time(int(np.argmax(jump)) + win // 2, sr=sr, hop_length=hop))
        di = min(range(len(beats)), key=lambda i: abs(beats[i] - t))
        drop = beats[di]
        # Ein Drop liegt fast immer auf der Eins: Takt danach ausrichten, wenn er deutlich ist.
        if max(jump) > 0.2 * float(np.max(sm)):
            best_phase = di % 4
    downbeats = [b for i, b in enumerate(beats) if i % 4 == best_phase]
    end = total if dur is None else min(total, start + dur)
    sel = [b for b in beats if start - 1e-6 <= b <= end]
    seld = [b for b in downbeats if start - 1e-6 <= b <= end]
    return {"bpm": tempo, "laenge": total, "beats": sel, "starke_beats": seld, "drop": drop,
            "alle_beats": beats}


def cmd_analyze(a):
    r = analyse(a.song, a.start, a.dur)
    print("Tempo: %.1f BPM  (ein Beat = %.3f s)" % (r["bpm"], 60.0 / r["bpm"] if r["bpm"] else 0))
    print("Songlänge: %.2f s" % r["laenge"])
    if r["drop"] is not None:
        print("Lautester Einsatz (Drop): %.2f s" % r["drop"])
    print("Starke Beats (die Eins, gute Startpunkte):")
    print("  " + "  ".join("%.2f" % b for b in r["starke_beats"][:40]))
    print("Alle Beats:")
    print("  " + "  ".join("%.2f" % b for b in r["beats"][:120]))


# ---------------------------------------------------------------- Plan

def cmd_auto(a):
    clips = sorted(f for f in os.listdir(a.ordner)
                   if os.path.splitext(f)[1].lower() in IMAGE_EXT | VIDEO_EXT)
    if not clips:
        die("Keine Clips im Ordner " + a.ordner)
    r = analyse(a.song, 0.0, None)
    start = a.start
    if start is None:
        start = r["drop"] if r["drop"] is not None else (r["starke_beats"][0] if r["starke_beats"] else 0.0)
    beats_after = [b for b in r["alle_beats"] if b > start + 0.05]
    per = a.beats
    n_seg = max(1, int(a.dur / (60.0 / r["bpm"]) / per)) if r["bpm"] else len(clips)
    n_seg = min(n_seg, len(beats_after) // per)
    base = os.path.dirname(os.path.abspath(a.plan))
    segs = []
    for i in range(n_seg):
        c = os.path.join(a.ordner, clips[i % len(clips)])
        segs.append({"clip": os.path.relpath(os.path.abspath(c), base), "beats": per})
    plan = {"audio": os.path.relpath(os.path.abspath(a.song), base), "audio_start": round(start, 3),
            "fps": 30, "size": [1080, 1920], "segments": segs}
    with open(a.plan, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)
    print("Plan geschrieben: %s (%d Abschnitte, Start bei %.2f s, %.1f BPM)" % (a.plan, len(segs), start, r["bpm"]))


# ---------------------------------------------------------------- Rendern

def default_font():
    for pat in ("Inter:style=Black", "Inter:style=ExtraBold", "DejaVu Sans:style=Bold"):
        try:
            p = subprocess.run(["fc-match", "-f", "%{file}", pat], capture_output=True, text=True).stdout.strip()
            if p and os.path.exists(p):
                return p
        except FileNotFoundError:
            break
    return None


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(" ".join(cmd), file=sys.stderr)
        print(p.stderr[-3000:], file=sys.stderr)
        die("ffmpeg ist abgebrochen.")


def wrap(text, width=18):
    out, line = [], ""
    for w in text.split():
        if line and len(line) + 1 + len(w) > width:
            out.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    if line:
        out.append(line)
    return "\n".join(out)


def render_segment(seg, idx, frames, fps, W, H, base, tmp, font):
    src = os.path.join(base, seg["clip"])
    if not os.path.exists(src):
        die("Clip fehlt: " + src)
    ext = os.path.splitext(src)[1].lower()
    out = os.path.join(tmp, "seg%03d.mp4" % idx)
    fill = "scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d" % (W, H, W, H)
    if ext in IMAGE_EXT:
        zoom = seg.get("zoom", "in")
        big = "scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d" % (W * 2, H * 2, W * 2, H * 2)
        if zoom == "out":
            z = "1.12-0.12*on/%d" % max(1, frames)
        elif zoom == "none":
            z = "1"
        else:
            z = "1+0.12*on/%d" % max(1, frames)
        vf = big + ",zoompan=z='%s':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=%dx%d:fps=%d" % (z, W, H, fps)
        inp = ["-loop", "1", "-framerate", str(fps), "-i", src]
    else:
        vf = fill + ",fps=%d" % fps
        inp = ["-ss", "%.3f" % float(seg.get("from", 0.0)), "-i", src]
    if seg.get("punch"):
        # Zoom-Stoß: in den ersten 4 Bildern 8 % größer, dann zurück
        vf += (",scale=w='iw*(1+0.08*max(0,1-n/4))':h='ih*(1+0.08*max(0,1-n/4))':eval=frame"
               ",crop=%d:%d" % (W, H))
    if seg.get("text"):
        if not font:
            die("Keine Schrift gefunden. Bitte --font angeben.")
        fs = int(W * 0.085)
        lines = wrap(seg["text"]).split("\n")
        lh = int(fs * 1.25)
        top = int(H * 0.30 - lh * len(lines) / 2)
        for j, ln in enumerate(lines):
            tf = os.path.join(tmp, "text%03d_%d.txt" % (idx, j))
            with open(tf, "w", encoding="utf-8") as f:
                f.write(ln)
            vf += (",drawtext=fontfile='%s':textfile='%s':fontcolor=white:fontsize=%d"
                   ":shadowcolor=black@0.6:shadowx=0:shadowy=4"
                   ":x=(w-text_w)/2:y=%d") % (font, tf, fs, top + j * lh)
    vf += ",format=yuv420p,setsar=1"
    run(["ffmpeg", "-y", "-loglevel", "error"] + inp +
        ["-vf", vf, "-frames:v", str(frames), "-an", "-r", str(fps),
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", out])
    return out


def cmd_render(a):
    need("ffmpeg")
    with open(a.plan, encoding="utf-8") as f:
        plan = json.load(f)
    base = os.path.dirname(os.path.abspath(a.plan))
    fps = int(plan.get("fps", 30))
    W, H = plan.get("size", [1080, 1920])
    audio = os.path.join(base, plan["audio"])
    start = float(plan.get("audio_start", 0.0))
    r = analyse(audio, 0.0, None)
    beats = [b for b in r["alle_beats"] if b > start + 0.05]
    font = a.font or default_font()

    # Schnittzeiten aus Beats, dann auf ganze Bilder runden (kein Versatz über die Länge)
    cuts = [start]
    k = 0
    for seg in plan["segments"]:
        k += int(seg.get("beats", 2))
        if k - 1 >= len(beats):
            die("Der Song ist ab Sekunde %.2f zu kurz für den Plan." % start)
        cuts.append(beats[k - 1])
    fr = [int(round((c - start) * fps)) for c in cuts]

    tmp = tempfile.mkdtemp(prefix="beatcut_")
    try:
        parts = []
        for i, seg in enumerate(plan["segments"]):
            n = fr[i + 1] - fr[i]
            if n < 2:
                die("Abschnitt %d ist kürzer als 2 Bilder. Mehr Beats geben." % (i + 1))
            print("Abschnitt %2d: %-34s %2d Beats  %5.2f s" % (i + 1, seg["clip"][-34:], seg.get("beats", 2), n / fps))
            parts.append(render_segment(seg, i, n, fps, W, H, base, tmp, font))
        lst = os.path.join(tmp, "list.txt")
        with open(lst, "w") as f:
            for p in parts:
                f.write("file '%s'\n" % p)
        stem = os.path.splitext(a.ausgabe)[0]
        silent = stem + "_ohne_musik.mp4"
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
             "-c", "copy", "-movflags", "+faststart", silent])
        total = fr[-1] / fps
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-ss", "%.3f" % start, "-t", "%.3f" % total,
             "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
             "-af", "afade=t=out:st=%.3f:d=0.4" % max(0, total - 0.4), "-shortest",
             "-movflags", "+faststart", a.ausgabe])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    with open(stem + "_schnittliste.txt", "w", encoding="utf-8") as f:
        f.write("Song: %s\nTempo: %.1f BPM\n" % (os.path.basename(audio), r["bpm"]))
        f.write("Sound in Instagram/TikTok starten bei: %d:%05.2f (Minute:Sekunde)\n" % (start // 60, start % 60))
        f.write("Reel-Länge: %.2f s\n\nSchnitte (Zeit im Reel / Zeit im Song):\n" % total)
        for i, c in enumerate(cuts):
            f.write("  %2d   %6.2f s   /   %6.2f s\n" % (i, fr[i] / fps, c))
    print("Fertig: %s, %s, %s_schnittliste.txt  (%.2f s)" % (a.ausgabe, silent, stem, total))
    print("Sound in der App starten bei %d:%05.2f" % (start // 60, start % 60))


def main():
    ap = argparse.ArgumentParser(description="Reels im Takt der Musik schneiden.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("analyze", help="Beats und Drop finden")
    p.add_argument("song")
    p.add_argument("--start", type=float, default=0.0)
    p.add_argument("--dur", type=float, default=None)
    p.set_defaults(fn=cmd_analyze)
    p = sub.add_parser("auto", help="Schnittplan aus einem Clip-Ordner schreiben")
    p.add_argument("song")
    p.add_argument("ordner")
    p.add_argument("plan")
    p.add_argument("--start", type=float, default=None, help="Startsekunde im Song (Standard: der Drop)")
    p.add_argument("--dur", type=float, default=15.0, help="Gewünschte Reel-Länge in Sekunden")
    p.add_argument("--beats", type=int, default=2, help="Beats pro Clip")
    p.set_defaults(fn=cmd_auto)
    p = sub.add_parser("render", help="Reel nach Plan bauen")
    p.add_argument("plan")
    p.add_argument("ausgabe")
    p.add_argument("--font", default=None, help="Pfad zu einer .ttf/.otf-Schrift")
    p.set_defaults(fn=cmd_render)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
