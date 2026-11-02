# Kamerafahrten für Reels (Plan, Stand 02.11.2026)

Echte Kamerafahrten aus der Blender-Szene (`azur/scene/`), extra für Reels und TikToks: Hochformat 9:16, ruhig, mit
Bewegungsunschärfe. Fotoecht, kostenlos, und Wappen, Logo und Schrift bleiben genau so, wie sie sind.

**Noch nichts davon ist gerendert.** Das ist nur der Plan.

## Bevor gerendert wird

- **Rendern ist gestoppt (Owner):** `azur/render_request.json` sagt „kein Rendern, bis die Trikots per 3D-Scan neu
  kommen“ (Pause bis 27.12.2026). Die Fahrten zeigen die Trikots groß, also erst mit den neuen Trikots rendern.
- **Die Szene gehört dem Chat „Shopify Shop Benachrichtigungsseite“.** Neue Fahrten kommen als eigenes Skript
  (`azur/scene/render_reels.py`, noch nicht geschrieben), das die Szene nur liest. Die Fahrten für die Website
  (`render_moves.py`) bleiben unverändert. Den Render-Auftrag stellt nur ein Chat, nach Absprache.
- **Rechenzeit:** Auf dem PC des Owners (AMD RX 6750 XT) etwa 35 s pro Bild bei 1920×1080, bei 1080×1920 ähnlich.
  30 Bilder pro Sekunde. 1 s Video ≈ 18 min, 5 s ≈ 1,5 h. Für Zeitlupe (Speed-Ramps im Schnitt) mit 60 Bildern pro Sekunde rendern,
  das dauert doppelt so lang.

## Die Fahrten

| Nr. | Name | Was man sieht | Länge | Licht | Wichtig |
|---|---|---|---|---|---|
| K1 | **Tür auf** | Aus dem dunklen Flur durch die Tür ins Zimmer, langsam bis zum Kleiderständer | 5 s | Abend | ★★★ |
| K2 | **Der Ständer** | Seitliche Fahrt am Ständer entlang, ein Trikot nach dem anderen zieht vorbei (passt auf Beats) | 6 s, 60 fps | Abend | ★★★ |
| K3 | **Ein Land** | Halbe Runde um ein einzelnes Trikot am Bügel, Wappen nah. Je Land eine: Türkei, Deutschland, Brasilien, dann 030, 069 | je 4 s, 60 fps | Abend | ★★★ |
| K4 | **Neon an** | Nah am Neon-Logo im Dunkeln, das Logo flackert an, das Zimmer wird sichtbar | 3 s | Nacht | ★★ |
| K5 | **Nächster Drop** | Langsam auf den verdeckten Kleidersack zu, bis das Bild schwarz wird | 4 s | Nacht | ★★ |
| K6 | **ANSTOSS** | Von oben auf das Magazin im Bett, leichte Drehung | 4 s | Morgen | ★ |
| K7 | **Tag zu Nacht** | Feste Kamera auf das ganze Zimmer, Licht läuft von Morgen bis Nacht | 6 s | alle | ★★★ |

**K7 braucht kein neues Rendern.** Die Lichtpässe des Zimmers liegen schon im Repo
(`azur/prototype/assets/scene3/views/room/`). Das Video kann in der Cloud gemischt werden, so wie die Website es tut.
Wegen der Trikots gilt aber auch hier: erst mit den neuen Trikots, oder als Probe, wenn der Owner Ja sagt.

**Rechenzeit gesamt:** K1 (1,5 h) + K2 (3,5 h) + K3 (5 × 2,3 h ≈ 12 h) + K4 (1 h) + K5 (1,2 h) + K6 (1,2 h)
≈ 20 h, also 2–3 Nächte. Reihenfolge: K1, K2, K3 Türkei, dann der Rest.

## Dazu ohne Rendern

- **Website-Aufnahmen** (in der Cloud, automatisch): das echte Zimmer auf azurclothing.com im Handyformat, Tippen auf ein
  Trikot, Produktansicht, „In den Warenkorb“. Als ruhige Bildfolge aufgenommen, nicht als ruckelige Bildschirmaufnahme.
- **Echte Clips mit den Muster-Trikots** (dreht ihr): Trikot vom Bügel nehmen, anziehen, Straße, Bolzplatz.
  Übergang „Hand vor die Kamera“ oder „Wurf aus dem Bild“ verbindet echte Clips mit den Fahrten aus dem Zimmer.

## Wie es automatisch läuft (später)

1. Claude schreibt die Fahrten in `render_reels.py` und, nach Absprache, den Auftrag in `render_request.json`.
2. Der PC des Owners rendert nachts und schickt die Videos zurück ins Repo (wie bei den Website-Fahrten).
3. Claude schneidet daraus im Takt der Musik (`azur/content/tools/beat_cut.py`) und gibt die fertigen Reels im Chat.
4. Der Owner wählt den Sound in der App und postet.
