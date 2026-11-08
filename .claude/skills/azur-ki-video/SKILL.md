---
name: azur-ki-video
description: >
  KI-Bilder und KI-Videos für AZUR erzeugen, auch aus EIGENEN Fotos und Clips (Muster-Trikots, Drehtag):
  über die Skill "generate" von Blotato (kie.ai, Seedance, Nano Banana, GPT Image) plus das Werkzeug
  azur/content/tools/kie_medien.py. Verwenden bei "KI-Video", "animieren", "aus meinem Foto ein Video",
  "generate", "Seedance", "kie.ai".
---

# KI-Video für AZUR (mit eigenen Bildern und Clips)

## Bausteine

- **Skill `generate`** (Plugin `blotato@blotato-skills`, wird über `.claude/settings.json` in jeder Sitzung geladen):
  Standbild entwerfen (`draft-image.sh`), Standbild animieren (`animate.sh`), Guthaben (`balance.sh`).
  Bezahlt über kie.ai. Lies vor jeder Erzeugung ihre `SKILL.md` und die Modell-Datei in `models/`.
- **Eigene Medien**: `azur/content/tools/kie_medien.py`
  - `still FOTO [--fit crop|pad]`: eigenes Foto exakt auf 1080x1920 bringen, zu kie.ai hochladen, Begleitdatei schreiben.
  - `frame VIDEO --zeit S`: ein Bild aus einem eigenen Clip als Startbild.
  - `upload DATEI`: beliebige Datei hochladen (z. B. Video für Modelle mit Video-Eingabe).
  - `--nur-lokal`: nur das 1080x1920-Bild bauen, nichts hochladen (zum Ansehen vorab).
  Danach: `animate.sh <bild.png> "<Bewegung>" pro 10`.

## Regeln (gehen vor den Regeln von `generate`)

1. **Kein Cent ohne Ja des Owners.** Vor jeder bezahlten Erzeugung Preis nennen und auf ein ausdrückliches Ja warten,
   jedes Mal. Guthaben bei kie.ai kauft nur der Owner.
2. **Schlüssel nie in Chat oder Repo.** In der Claude-Cloud über `request_credential` für die Hosts `api.kie.ai`
   und `kieai.redpandaai.co` (Upload) als Bearer-Token speichern lassen. In der `.env` der Skill steht dann nur ein
   Platzhalter, der Proxy setzt den echten Schlüssel ein. Am PC des Owners trägt er den Schlüssel selbst in die `.env` ein.
3. **Personen:** Fotos von Menschen nur hochladen, wenn diese zugestimmt haben. kie.ai löscht Uploads nach 24 Stunden.
4. **Trikot-Details schützen:** KI verformt Wappen, Halbmond, Adler, Schrift, „030“/„069“. Darum:
   - bevorzugt eigene Fotos als Startbild (`still`/`frame`), nicht von der KI gezeichnete Trikots;
   - `--fit pad`, wenn sonst das Trikot angeschnitten würde;
   - ruhige Bewegung im Prompt („slow push in, subtle motion, keep the jersey crest, logo and text unchanged“);
   - Ergebnis Bild für Bild prüfen (Einzelbilder mit ffmpeg ziehen und ansehen). Verformtes Wappen = nicht verwenden.
5. **Ausgaben nicht ins Repo** (öffentlich). Ordner: `GENERATIONS_DIR` (Standard `~/faceless/generations`),
   in der Cloud besser im Scratchpad. Fertiges dem Owner per Datei im Chat geben.
6. **Posten** macht der Owner. Das Weiterreichen an Blotato zum Planen nur, wenn er es ausdrücklich will
   (Blotato-Publishing ist ein eigener, bezahlter Dienst).
7. Danach im Takt schneiden mit `azur-beat-schnitt`.

## Kosten (laut Blotato, Stand Nov. 2026, vor dem Kauf prüfen)

1 Credit ≈ 0,5 Cent. Standbild ca. 10 Credits (~0,05 $). Video Seedance 1.0 Pro 1080p: 14 Credits/s,
10 s ≈ 140 Credits (~0,70 $). Lite: 10 Credits/s. Seedance 2.5 nur auf ausdrücklichen Wunsch, Preis live prüfen.
Laut Blotato verfällt kie.ai-Guthaben nicht.
