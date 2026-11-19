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
