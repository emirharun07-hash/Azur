# Wand (scene4): Trikots in Rahmen statt Kleiderstange

Aufruf (bpy-Modul Blender 5.x, `AZUR_CACHE` wie bei `build_room.py`):
`python azur/scene/build_room_wall.py -- <preview|final|build> <out_dir> [rail,room | all] [save.blend]`
`build` baut nur und speichert die .blend (ohne Angabe `<out_dir>/azur_room_scene4.blend`), `preview` 960×540/64 Samples, `final` 1920×1080/640.

Anders als `build_room.py` (das unverändert bleibt und per Text-Tausch ausgeführt wird; jede Stelle muss genau einmal passen):
- weg: Kleiderstange, Bügel, Trikots am Haken, Drop-Hülle, Anhänger, alter Deckenstrahler `spot_*`, Trikotposter. Zufallsstrom bleibt gleich.
- neu (`frame.py`): drei Schattenboxen an der Rückwand, flach liegende Trikots aus `assets/jerseys/clean/`, Museumsglas, blanke Schilder, Deckenschiene mit drei Strahlern.
- verschoben: Neon x 1,76 → 1,45 mit neuem Kabelweg hinter das Regal; Stadionposter an die linke Wand (0,0075; 2,86; 1,70);
  Medaillen an die linke Regalseite, Haken (2,625; 3,80; **1,44**) statt z 1,30 (sonst stecken sie im ersten Lexikonband).
- Fensterrahmen heißen jetzt `window_frame_b/t/l/r` (`frame_*` gehört den Wandrahmen).

Objekte (`<key>` = brasilien, deutschland, drop): `frame_<key>` (Leiste), `frame_<key>.felt` (Leibung + Backboard),
`frame_<key>.clips` (Acryl-Klammern, nicht bei drop), `glass_<key>`, `jersey_<key>` (nicht drop), `plaque_<key>`,
`picture_light_<key>` (an `picture_track` geparentet), `picture_track`, `L_spot_<key>` (SPOT, 56°, Blend 0,40, Radius 0,03, weiß).
Spot-Energie nach Vorschau festgelegt: brasilien 30 W, deutschland 30 W, drop 10 W (`frame.SPOT_ENERGY`). Kein Objekt hat `azur_state`.

## Rendern (scene4, `render_queue_wall.py`)
Eigene Queue für die Wand. Sie nutzt `render_queue.py` (das unverändert bleibt; `AZUR_SET=scene3` rendert den Ständer wie bisher) und
ersetzt nur Satz, Kameras (`rail`/`rail_m` gerade auf die Wand, Spezifikation Kap. 3), die drei Spots im Pass `spot`, `views.json` v2
(Rahmen, Öffnung, Schild, Tiefe je Slot plus die alten Felder `hook/top/bottom/width`, `rail`, `floor_under_rail`), Masken/IDs über die
Rahmen-Gruppen und die Varianten mit leeren Rahmen. Bügel-, Hüllen- und Herausnehm-Jobs gibt es nicht mehr.

Am PC (Windows, PowerShell im Repo-Ordner; der Beobachter `render_on_windows.ps1 watch` ist dabei AUS, er startet nur die alte Queue):
```powershell
. azur\.venv\Scripts\Activate.ps1
$env:AZUR_GPU = "1"
python azur\scene\render_queue_wall.py                 # alles; nur einzelne Ansichten: ... render_queue_wall.py rail rail_m
```
- Fehlt `azur\.cache\azur_room_scene4.blend`, baut die Queue sie zuerst (`build_room_wall.py -- build`, ca. 2 Minuten). Nach einer
  Änderung an `build_room_wall.py` oder `frame.py` die .blend löschen, dann wird sie neu gebaut (schon fertige Bilder bleiben liegen und
  passen dann nicht mehr: den Ordner `azur\prototype\assets\scene4\views` vorher leeren).
- Git: ohne Schalter wird nichts committet und nichts gepusht. `--push` committet jede fertige Datei und pusht alle 2 Minuten (wie die
  alte Queue). Mit `AZUR_QUEUE_NO_GIT=1` bleibt Git auch mit `--push` aus.
- Probelauf ohne Rendern: `$env:AZUR_QUEUE_DRY = "1"; $env:AZUR_QUEUE_FAST = "1"` → schreibt nach `azur\.cache\queue_test` nur
  `views.json`, `dry_renders.json` (was gerendert würde, mit Lichtern und ausgeblendeten Objekten) und `plan.json` (Jobs, Zeit).
  Kleiner Testsatz mit Rendern (960 px, 8 Samples): nur `AZUR_QUEUE_FAST=1`, Ausgabe dann nach `azur\.cache\queue_test` oder `--out <Ordner>`.

Was entsteht (`azur/prototype/assets/scene4/views/`):
- `views.json` (`"version": 2`), `passes.json` (Skalen je Pass, `states`, `variants`)
- je Ansicht `room`, `rail`, `bed`, `rail_m`: 8 Licht-Pässe `sky, sun_low, sun_high, neon, lamp, ceiling, street, spot` (.webp),
  `beauty.webp`, `depth.png`, `masks.png`/`glow.png` (+ `_night`), außer `bed`: `ids.png` (Rahmen 32/64/96, Glas und Schild zählen dazu),
  `window.png`
- Zeit-Ausschnitte `<ansicht>/<zustand>/<pass>_<n>.webp` (`evening`, `night`, `morning`, nur wo sie im Bild etwas ändern)
- Varianten für `room`, `rail`, `rail_m`: `<ansicht>/var_leer_brasilien|var_leer_deutschland|var_leer_beide/<zustand>/<pass>_<n>.webp`
  (Trikot ausgeblendet, leerer Rahmen bleibt; `day` mit allen Pässen, dazu jeder Zustand, dessen Ausschnitte den Rahmen treffen –
  heute `night`)
- Die linearen Tag-Pässe bleiben als EXR in `azur\.cache\exr\scene4` (für Zustände und Varianten nötig, nicht löschen, bis alles fertig ist).

Umfang (Probelauf `plan.json`): 202 Renders = 32 volle Pässe, 4 Beauty, 18 kleine Karten, 40 Zeit-Ausschnitte, 108 Varianten-Ausschnitte
(jeder 1–10 % des Bildes). Bei 25–100 Minuten je vollem 3200-px-Pass (Neon am längsten) grob **60–70 Stunden** am PC, davon ca. 25 h Pässe,
25 h Zeit-Ausschnitte (die Nacht hat das Flurlicht: ganzes Bild), 14 h Varianten.

Abbrechen und fortsetzen: Strg+C (oder Fenster schließen). Neu starten mit demselben Befehl: fertige Dateien werden übersprungen,
Zustände und Varianten, die in `passes.json` als `complete` stehen, auch; schon gerenderte EXR-Stücke eines halben Ausschnitts werden
wiederverwendet. Fehlgeschlagene Jobs stehen am Ende im Log (`azur\.cache\queue_wall.log`), der Lauf endet dann mit Code 1.
