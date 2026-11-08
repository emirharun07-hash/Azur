#!/usr/bin/env python3
"""Eigene Fotos und Videos für die Skill "generate" (Blotato, kie.ai) vorbereiten.

Die Skill "generate" animiert nur Standbilder, die eine Online-Adresse (hosted_url) haben. Dieses Werkzeug macht aus
euren eigenen Fotos und Clips genau solche Standbilder: exakt 1080x1920, hochgeladen zu kie.ai, mit der Begleitdatei
(.json), die animate.sh erwartet. Danach geht wie gewohnt:

    animate.sh <ausgabe.png> "<Bewegung>" pro 10

Befehle:

  still  FOTO   [--name N] [--fit crop|pad]
      Foto auf 1080x1920 bringen und hochladen.
      crop = mittig zuschneiden (Standard), pad = nichts abschneiden, Rand mit unscharfem Hintergrund füllen
      (gut, wenn sonst das Trikot angeschnitten würde).

  frame  VIDEO  --zeit S [--name N] [--fit crop|pad]
      Ein Bild aus einem eigenen Clip (bei Sekunde S) nehmen, auf 1080x1920 bringen und hochladen.
      So wird ein echter Moment vom Drehtag der Startpunkt für ein KI-Video.

  upload DATEI  [--name N]
      Beliebige Datei hochladen (z. B. ein Video für Modelle, die ein Video als Eingabe nehmen) und die Adresse ausgeben.

Hochladen kostet nichts. Kosten entstehen erst beim Erzeugen (animate.sh / draft-image.sh), dort mit Preis-Abfrage.
Hochgeladene Dateien löscht kie.ai nach 24 Stunden. Also erst hochladen, wenn direkt danach animiert wird.

Schlüssel: KIE_API_KEY aus der Umgebung, sonst aus der .env der Skill "generate" (wird nie ausgegeben).
In der Claude-Cloud setzt der Netzwerk-Proxy den echten Schlüssel ein; dort reicht ein Platzhalter.
Ausgabeordner: GENERATIONS_DIR, sonst ~/faceless/generations (derselbe wie bei "generate").
"""
import argparse
import datetime
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

UPLOAD_URL = "https://kieai.redpandaai.co/api/file-stream-upload"
W, H = 1080, 1920


def die(msg):
    print("FEHLER: " + msg, file=sys.stderr)
    sys.exit(1)


def load_key():
    key = os.environ.get("KIE_API_KEY", "").strip()
    if key:
        return key
    pats = [os.path.expanduser("~/.claude/plugins/**/skills/generate/.env"),
            os.path.expanduser("~/.claude/skills/generate/.env")]
    for pat in pats:
        for env in glob.glob(pat, recursive=True):
            with open(env, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("KIE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val and val != "your_kie_key_here":
                            return val
    die("Kein KIE_API_KEY gefunden. In die .env der Skill 'generate' eintragen oder als Umgebungsvariable setzen.")


def out_dir():
    d = os.environ.get("GENERATIONS_DIR") or os.path.expanduser("~/faceless/generations")
    os.makedirs(d, exist_ok=True)
    return d


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(p.stderr[-2000:], file=sys.stderr)
        die("Befehl fehlgeschlagen: " + cmd[0])
    return p.stdout


def to_portrait(src, dst, fit, at=None):
    """Bild (oder Videobild bei Sekunde `at`) exakt auf 1080x1920 bringen, als PNG."""
    if not shutil.which("ffmpeg"):
        die("ffmpeg fehlt.")
    if fit == "pad":
        vf = ("split[a][b];"
              "[a]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,boxblur=40:2,eq=brightness=-0.08[bg];"
              "[b]scale=%d:%d:force_original_aspect_ratio=decrease[fg];"
              "[bg][fg]overlay=(W-w)/2:(H-h)/2") % (W, H, W, H, W, H)
    else:
        vf = "scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d" % (W, H, W, H)
    cmd = ["ffmpeg", "-y", "-v", "error"]
    if at is not None:
        cmd += ["-ss", "%.3f" % at]
    cmd += ["-i", src, "-frames:v", "1", "-filter_complex", vf, dst]
    run(cmd)
    dims = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                "-of", "csv=p=0", dst]).strip()
    if dims != "%d,%d" % (W, H):
        die("Bild ist %s statt %dx%d." % (dims, W, H))


def upload(path, name):
    key = load_key()
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".cfg") as cfg:
        # Schlüssel über eine Config-Datei an curl geben, damit er nicht in der Prozessliste steht
        cfg.write('header = "Authorization: Bearer %s"\n' % key.replace('"', ''))
        cfg_path = cfg.name
    try:
        out = run(["curl", "-s", "-m", "300", "-K", cfg_path, "-X", "POST", UPLOAD_URL,
                   "-F", "file=@%s" % path, "-F", "uploadPath=azur", "-F", "fileName=%s" % name])
    finally:
        os.unlink(cfg_path)
    try:
        resp = json.loads(out)
    except ValueError:
        die("Unerwartete Antwort von kie.ai: " + out[:300])
    data = resp.get("data") or {}
    url = data.get("downloadUrl") or data.get("fileUrl") or ""
    if not resp.get("success", True) or not url:
        die("Hochladen fehlgeschlagen: " + out[:300])
    return url


def write_sidecar(png, url, source, kind):
    iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    side = os.path.splitext(png)[0] + ".json"
    with open(side, "w", encoding="utf-8") as f:
        json.dump({"model": "eigenes-" + kind, "type": "image", "prompt": "", "source_file": os.path.basename(source),
                   "params": {"aspect_ratio": "9:16", "width": W, "height": H}, "hosted_url": url,
                   "cost_credits": 0, "cost_usd": 0, "created": iso}, f, indent=2, ensure_ascii=False)
    return side


def stamp():
    return datetime.datetime.now().strftime("%Y%m%d-%H%M%S")


def cmd_still(a, at=None, kind="foto"):
    if not os.path.exists(a.datei):
        die("Datei fehlt: " + a.datei)
    base = (a.name or os.path.splitext(os.path.basename(a.datei))[0]) + "_" + stamp()
    png = os.path.join(out_dir(), base + ".png")
    to_portrait(a.datei, png, a.fit, at)
    print("Bild bereit: %s (1080x1920, %s)" % (png, a.fit))
    if a.nur_lokal:
        print("Nicht hochgeladen (--nur-lokal).")
        return
    url = upload(png, base + ".png")
    side = write_sidecar(png, url, a.datei, kind)
    print("Hochgeladen (24 h gültig): " + url)
    print("Begleitdatei: " + side)
    print("Weiter mit: animate.sh %s \"<Bewegung>\" pro 10" % png)


def cmd_frame(a):
    cmd_still(a, at=a.zeit, kind="clip")


def cmd_upload(a):
    if not os.path.exists(a.datei):
        die("Datei fehlt: " + a.datei)
    name = a.name or os.path.basename(a.datei)
    url = upload(a.datei, name)
    print("Hochgeladen (24 h gültig): " + url)


def main():
    ap = argparse.ArgumentParser(description="Eigene Fotos/Clips für 'generate' (kie.ai) vorbereiten.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for nm, fn in (("still", cmd_still), ("frame", cmd_frame)):
        p = sub.add_parser(nm)
        p.add_argument("datei")
        p.add_argument("--name")
        p.add_argument("--fit", choices=["crop", "pad"], default="crop")
        p.add_argument("--nur-lokal", action="store_true", help="nur 1080x1920-Bild bauen, nicht hochladen")
        if nm == "frame":
            p.add_argument("--zeit", type=float, required=True, help="Sekunde im Clip")
        p.set_defaults(fn=fn)
    p = sub.add_parser("upload")
    p.add_argument("datei")
    p.add_argument("--name")
    p.set_defaults(fn=cmd_upload)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
