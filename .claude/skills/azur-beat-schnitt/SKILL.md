---
name: azur-beat-schnitt
description: >
  Reels für AZUR im Takt der Musik schneiden: Beats und Drop eines Songs finden, Clips und Bilder genau auf die
  Beats schneiden, Text einblenden, MP4 mit und ohne Musik plus Schnittliste ausgeben. Verwenden bei
  "im Takt schneiden", "auf den Beat", "Reel schneiden", "Video bauen", "Teaser aus den Renders".
---

# Schnitt auf den Beat

Werkzeug: `azur/content/tools/beat_cut.py` (nur kostenlose Werkzeuge: ffmpeg + librosa).

## Einmal vorbereiten

```bash
which ffmpeg || echo "ffmpeg fehlt"
python3 -c "import librosa" 2>/dev/null || pip install librosa
```

Arbeitsdateien (Song, Clips, Ergebnis) immer im Scratchpad oder einem Ordner außerhalb des Repos ablegen,
nie ins öffentliche Repo.

## Ablauf

1. **Song analysieren**
   `python3 azur/content/tools/beat_cut.py analyze song.mp3`
   Zeigt BPM, alle Beats, die starken Beats (die Eins) und den Drop.
   Für Trend-Sounds: Der Owner schickt den Ausschnitt, den Instagram/TikTok spielt (Bildschirmaufnahme reicht;
   Audio daraus mit `ffmpeg -i aufnahme.mp4 -vn -ac 2 song.wav`).

2. **Plan schreiben**
   `python3 azur/content/tools/beat_cut.py auto song.mp3 clips/ plan.json --dur 15 --beats 2`
   Startet standardmäßig am Drop. Danach den Plan von Hand verbessern:
   - Ruhige Bilder (Zimmer, Logo) 4 Beats, schnelle Wechsel 1–2 Beats.
   - Vor dem Drop länger, ab dem Drop schneller.
   - Großer Wechsel (z. B. verdeckter Sack → Trikot) genau auf der Eins oder dem Drop.
   - `text` nur kurze Zeilen (max. ~7 Wörter), `punch: true` für einen Zoom-Stoß am Schnitt,
     `from` für die Startsekunde in einem Video, `zoom` ("in"/"out"/"none") für Bilder.

3. **Rendern**
   `python3 azur/content/tools/beat_cut.py render plan.json reel.mp4`
   Ergebnis: `reel.mp4` (mit Musik), `reel_ohne_musik.mp4`, `reel_schnittliste.txt`.

4. **Prüfen, bevor es zum Owner geht**
   - Schnitte: `ffmpeg -i reel_ohne_musik.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*"`
     und mit der Schnittliste vergleichen.
   - Einzelbilder ansehen (`ffmpeg -ss 1.0 -i reel.mp4 -frames:v 1 bild.jpg`, dann mit Read öffnen):
     Text lesbar, nicht im oberen 12 % / unteren 20 % Rand, nichts abgeschnitten.

5. **Übergeben** mit SendUserFile: beide MP4 und die Schnittliste. Dazu dem Owner sagen:
   „In Instagram/TikTok das Video ohne Musik hochladen, denselben Sound wählen und den Start auf
   Minute:Sekunde aus der Schnittliste setzen.“

## Grenzen

- Musik aus der Instagram-/TikTok-Bibliothek darf nicht fest ins Video. Deshalb die Version ohne Musik hochladen.
- Eigene Musik nur, wenn sie frei nutzbar ist und der Owner sie ausgesucht hat. Nichts kaufen ohne Ja.
- Effekte, die viel Gefühl brauchen (Speed-Ramps, Masken), sind in CapCut schneller. Dann dem Owner die
  Beat-Zeiten aus der Schnittliste geben, damit der Schnitt dort auch auf dem Takt liegt.
