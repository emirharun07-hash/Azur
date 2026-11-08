# Content für AZUR: Überblick (Stand 02.11.2026)

Diese Datei fasst alles zusammen, was im Chat „Content erstellen“ (Reels und TikToks) besprochen und entschieden wurde.
Jede Claude-Sitzung, die an Content arbeitet, liest zuerst diese Datei.

## Ziel

Reichweite auf Instagram und TikTok von null aufbauen. Fokus: **Länder-Trikots** (Land, Nationalfarben,
Zugehörigkeit). Berlin 030 und Frankfurt 069 sind eine eigene Nische. Der Hebel ist Marketing, keine frühen Rabatte.
Der Owner will **so gute Videos wie möglich**, und das 3D-Zimmer soll richtig zur Geltung kommen.

## Stand

- **Accounts:** Instagram **@azur_clothing3**, TikTok **@azurclothing**. Nicht verwechseln mit dem Schweizer Shop
  azurclo.com (Instagram @azurcloothing, TikTok @www.azurclo.com).
- **Muster-Trikots** sind da. Die Bestellung der Ware (ca. 150 Trikots aus China) steht noch aus.
- **Noch keine Reels gemacht** (Owner: „jetzt noch keine Reels“). Das Test-Video aus Standbildern war nur Technik
  und hat dem Owner nicht gefallen. Zoom-Fahrten über Standbilder nicht mehr verwenden.
- **Rendern auf dem PC des Owners ist gestoppt bis 27.12.2026.** Die Trikots kommen per 3D-Scan neu
  (`azur/render_request.json`).

## Entscheidungen des Owners

1. **Schnitt im Takt der Musik ist sehr, sehr wichtig.** Jeder Schnitt liegt auf einem Beat.
2. **Alles soll dauerhaft bleiben** (Repo und Claude), nicht nur in einer Sitzung.
3. **Hooks** immer mit dem festen Prompt des Owners: Skill `azur-hook-stratege`.
4. **Ablauf für Material:** Erst ein großer Drehtag mit den Muster-Trikots (viele Videos und Fotos, viele Winkel,
   anlehnen, Fußball spielen, Alltag). Danach **ein Monat Higgsfield Plus (ca. 59 €)**, gut vorbereitet und voll
   ausgenutzt. Vieles wird selbst gedreht, KI nur für Szenen, die man nicht filmen kann.
5. **ootto.ai wird nicht gebraucht.** Die Skills sind kostenlos im Repo, posten macht der Owner selbst.
6. Der Owner postet selbst. Claude postet nicht, meldet sich nirgends an und gibt kein Geld aus.
7. **KI direkt aus Claude (08.11.):** Plugin „generate“ von Blotato ist im Repo eingetragen (`.claude/settings.json`,
   lädt in jeder Sitzung). Bezahlt über kie.ai pro Nutzung (10-s-Video 1080p ca. 0,70 $). Dazu das eigene Werkzeug
   `azur/content/tools/kie_medien.py` für **eigene Fotos und Clips** als Startbild. Anleitung: Skill `azur-ki-video`.
   Noch offen: kie.ai-Konto und Guthaben (kauft der Owner), Schlüssel sicher hinterlegen. Vorschlag: nach dem Drehtag
   mit 5–10 $ bei kie.ai testen, dann zwischen kie.ai und Higgsfield Plus entscheiden.

## Wie ein gutes AZUR-Video entsteht

Mischung, grob: **70–80 % selbst gedreht**, **10–20 % aus dem 3D-Zimmer** (Blender), **5–10 % KI** als Wow-Moment.

1. **Drehtag** (kostenlos): jede Szene als Video (Hochformat, 4K, 60 fps für Zeitlupe) und als scharfes Foto.
   Übergänge gleich mitdrehen (Hand vor die Kamera, Ball ins Bild, Trikot über den Kopf, schneller Schwenk).
   Wer zu sehen ist, gibt eine kurze schriftliche Zustimmung zur Nutzung für Werbung (z. B. per WhatsApp).
2. **Auswahl**: Owner schickt die besten Clips und Fotos. Claude wählt 10–15 KI-Szenen und schreibt die Prompts vorab.
3. **Higgsfield Plus, 1 Monat**: nur die vorbereitete Liste abarbeiten. Grob 35–80 Clips möglich, ca. 15–25 richtig gute.
   Achtung: KI verformt oft Wappen, Halbmond, Adler, Schrift und „030/069“. Trikot-Nahaufnahmen deshalb echt drehen
   oder aus Blender.
4. **Kamerafahrten aus Blender** (kostenlos, fotoecht): Plan in `azur/content/KAMERAFAHRTEN.md`.
5. **Website-Aufnahmen** (kostenlos, automatisch in der Cloud): das echte Zimmer auf azurclothing.com im Handyformat.
6. **Schnitt im Takt** mit `azur/content/tools/beat_cut.py` (Skill `azur-beat-schnitt`).
   Version ohne Musik hochladen, denselben Sound in der App wählen, Startsekunde aus der Schnittliste setzen.
   So bleibt der Trend-Sound für die Reichweite und der Schnitt sitzt.

## Ideen mit dem 3D-Zimmer (noch nicht ausgewählt)

| Nr. | Idee | Wie |
|---|---|---|
| 1 | **Vom Kinderzimmer auf den Platz**: Kamera fliegt zum Ständer, Hand greift Trikot, Schnitt beim Überziehen, echter Freund auf dem Bolzplatz | Blender + echt |
| 2 | **Das Poster wird lebendig**: euer Foto als Poster an der Wand, Kamera fliegt hinein, wird euer echtes Video | Blender + echt |
| 3 | **Dein Land leuchtet**: Licht im Zimmer wechselt auf jeden Beat in Nationalfarben | Blender (evtl. aus vorhandenen Lichtbildern) |
| 4 | **Durchs Fenster in die Stadt** (030/069): Kamera fliegt aus dem Fenster, echte Straße in Berlin/Frankfurt | Blender + echt |
| 5 | **Nachts lebt das Zimmer**: Neon geht an, Trikots bewegen sich leicht | Blender + KI |
| 6 | **Du bist im Zimmer**: echter Freund steht im 3D-Zimmer, nimmt ein Trikot | KI (Higgsfield) |
| 7 | **Der Drop kommt**: Countdown, Kleidersack öffnet sich | Blender / KI |
| 8 | **Dieser Shop ist ein Kinderzimmer**: Aufnahme der echten Website | kostenlos, automatisch |
| 9 | **ANSTOSS**: Magazin im Bett, auf dem Cover seid ihr | Blender + Foto |

Nötige Aufnahmen am Drehtag dafür: Trikot über den Kopf ziehen (1), Fotos fürs Poster (2), Straßen in Berlin und
Frankfurt (4), Ganzkörper-Fotos für die KI (6), Cover-Foto (9).

## Higgsfield in Kürze (Stand Okt. 2026, Preise schwanken)

- Starter ca. 15–19 $ / Monat, ca. 200–270 Credits, meist 720p, nur ausgewählte Modelle. Für AZUR zu wenig.
- Plus ca. 49–59 $ / Monat, ca. 1.000–1.200 Credits, bessere Modelle und Auflösung. **Das ist der Plan.**
- Credits verfallen am Monatsende. Gewerbliche Nutzung vor dem Kauf auf higgsfield.ai prüfen.
- Kauft der Owner selbst, erst nach dem Drehtag und der Auswahl.

## Wo was liegt

| Was | Wo |
|---|---|
| Dieser Überblick | `azur/content/UEBERSICHT.md` |
| Regeln, Marke, Ablauf für ein Reel | `.claude/skills/azur-reels/SKILL.md` |
| Fester Hook-Prompt des Owners | `.claude/skills/azur-hook-stratege/SKILL.md` |
| Schnitt im Takt (Anleitung + Werkzeug) | `.claude/skills/azur-beat-schnitt/SKILL.md`, `azur/content/tools/beat_cut.py` |
| Plan Kamerafahrten | `azur/content/KAMERAFAHRTEN.md` |
| KI-Bilder/-Videos, auch aus eigenen Fotos (Blotato „generate“ + kie.ai) | `.claude/skills/azur-ki-video/SKILL.md`, `azur/content/tools/kie_medien.py`, Plugin in `.claude/settings.json` |
| Allgemeine Content-Skills (MIT, Ootto) | `.claude/skills/<name>/` |

Claude Code lädt alles in `.claude/skills/` automatisch, wenn dieses Repo offen ist. Für normale claude.ai-Chats
gibt es dieselben Skills als ZIP zum Hochladen (Einstellungen → Skills).

**Das Repo ist öffentlich.** Keine Rohclips, Fotos von Personen, Songs, Zugangsdaten oder Personendaten hineinlegen.
Fertige Videos gibt Claude dem Owner direkt im Chat.

## Abgrenzung zu den anderen Chats

- **„Shopify Shop Benachrichtigungsseite“**: Theme, 3D-Zimmer, Blender-Szene, Render-Aufträge, Shopify-Uploads.
  Kamerafahrten für Reels werden mit diesem Chat abgestimmt, bevor ein Render-Auftrag gestellt wird.
  Offen dort: Instagram-Link im Footer ist leer.
- **„Azur Werbung & Google“**: bezahlte Werbung. Gute Reels können dort später als Anzeigen dienen
  (dafür die Zustimmung der gezeigten Personen).
- **„Azur Gründung & Controlling“**: Formalitäten, Kalkulation. Kosten für Higgsfield dort einplanen.

## Offen

1. Drehplan für den Drehtag (braucht: wie viele Leute, welche Orte, welches Handy).
2. Welche Ideen (1–9) umgesetzt werden.
3. Kamerafahrten: bis 27.12. warten oder vorher eine Probe mit den alten Trikots.
4. Content-Plan und Launch-Plan (wann die Ware kommt, ist noch offen).
5. Das Beispiel-Video, das der Owner zeigen wollte, ist noch nicht angekommen.
6. Marke „AZUR“ ist nicht angemeldet (siehe `azur/UEBERGABE.md`, „Offen“).
