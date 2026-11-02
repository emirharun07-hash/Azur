---
name: azur-reels
description: >
  Reels und TikToks für AZUR Clothing (azurclothing.com) planen, schreiben und schneiden: Ideen, Hooks,
  Skripte, Drehlisten, Schnitt im Takt der Musik, Texte, Hashtags, Posting-Plan und Launch-Plan.
  Verwenden, wenn es um Content, Reels, TikTok, Instagram, Hooks, Captions, Hashtags oder den
  Content-Plan für AZUR geht.
---

# AZUR Reels

Diese Skill gilt für jede Content-Arbeit für AZUR. Lies zuerst `azur/content/UEBERSICHT.md` (Stand und Entscheidungen), dann `azur/UEBERGABE.md`.

## Die Marke in Kürze

- **AZUR Clothing**: Trikots im Retro-Fußball-Look als Streetwear. Man trägt sein Land oder seine Stadt, keinen Verein.
- Satz der Marke: „Getragen auf dem Platz und danach.“
- Trikots: Türkei, Deutschland, Brasilien (je 54,99 €), Berlin 030 und Frankfurt 069 (je 64,99 €). Größen S–XL.
  Preise und Versand immer live in Shopify prüfen, nie aus dem Kopf.
- **Marketing-Fokus: Länder-Trikots** (Länder, Nationalfarben, Zugehörigkeit, zwei Heimaten).
  Berlin 030 und Frankfurt 069 sind eine eigene Nische (Lokalpatriotismus, Vorwahl als Identität).
- Zielgruppe: 16–30 Jahre, Frauen und Männer, Großstadt, oft mit Wurzeln in mehreren Ländern
  (z. B. türkisch-deutsch, brasilianisch-deutsch), Hobbykicker, Fans von Retro-Trikots und Drops.
- Welt der Marke: das 3D-Kinderzimmer („Ein Kind, das es noch nicht geschafft hat, aber fest daran glaubt“),
  Neon-Logo, Magazin „ANSTOSS“, verdeckter Kleidersack = „Nächster Drop“.
- Farbe: Azur Electric nur als Akzent (Glow #16B8FF, Highlight #8DEBFF, Ink #0A6A9A, Night #07131D).
- Accounts: Instagram **@azur_clothing3**, TikTok **@azurclothing**. Muster-Trikots sind vorhanden.
  Achtung: Ein Schweizer Shop (azurclo.com) nutzt Instagram @azurcloothing, nicht verwechseln.
- Qualität vor Menge: Der Owner will so gute Videos wie möglich, das 3D-Zimmer soll richtig zur Geltung kommen.
  Einfache Zoom-Fahrten über Standbilder reichen nicht. Besser: echte Kamerafahrten aus Blender, Aufnahmen der echten
  Website, echte Clips mit den Muster-Trikots.
- Der Hebel ist Marketing, nicht Rabatt. Keine Preissenkungen als Content-Idee vorschlagen.

## Feste Regeln des Owners

- Deutsch, einfache Wörter. Lieber fragen als annehmen.
- Nichts posten, nirgends anmelden. Der Owner lädt selbst hoch.
- Kein Geld ausgeben (Apps, Tools, Ads, Musiklizenzen) ohne ausdrückliches Ja.
- Nichts in Shopify hochladen oder am Theme ändern. Shopify nur lesen.
- Repo ist öffentlich: keine Rohclips mit Gesichtern, keine Personendaten, keine Zugangsdaten ins Repo.
  Fertige Videos dem Owner direkt im Chat geben.
- Keine echten Personen nachahmen, keine Vereinslogos oder offiziellen Verbandswappen zeigen.
- Bezahlte Werbung macht ein anderer Chat. Überschneidungen dem Owner sagen.

## Ablauf für ein Reel

1. **Idee und Ziel**: Ein Reel, ein Ziel (Reichweite, Follow, Newsletter-Eintrag für den Drop, Kauf).
2. **Hook** (erste 1–3 s): immer mit der Skill `azur-hook-stratege` (fester Prompt des Owners, 15 Varianten).
   Dazu als Ergänzung: 10 Varianten, je unter 12 Wörtern, mit 3–5 Wörtern Text auf dem Bild.
   Winkel mischen: starke Aussage, „Wenn du … bist“, Frage, die den Nerv trifft, Ergebnis zuerst, offene Frage.
   Die 3 besten markieren. Gute AZUR-Winkel: „Zwei Heimaten, ein Trikot“, „Welches Land trägst du?“,
   „030 oder 069?“, „Kein Verein. Dein Land.“
3. **Skript**: Tabelle mit Sekunde | Bild | Text auf dem Bild | Beat-Anzahl. Ohne Ton verständlich
   (die meisten schauen stumm). Eine einzige Handlungsaufforderung am Ende.
4. **Drehliste**: in Dreh-Reihenfolge, nach Ort gruppiert, jede Einstellung mit Zweck. Wichtig / optional markieren.
   Immer 9:16, Handy senkrecht, 4K/30 fps wenn möglich, Licht von vorn.
5. **Schnitt im Takt**: mit der Skill `azur-beat-schnitt` (Werkzeug `azur/content/tools/beat_cut.py`).
   Schnitt im Takt der Musik ist für den Owner sehr wichtig. Jeder Schnitt liegt auf einem Beat, harte Wechsel auf der Eins
   oder dem Drop.
6. **Titelbild**: 3–5 Wörter, lesbar bei 150 px Breite. Text weg vom oberen 12 % und unteren 20 % Rand
   (dort liegt die App-Oberfläche). Das gilt auch für alle Einblendungen im Video.
7. **Caption und Hashtags**: erste Zeile ist ein zweiter Hook und enthält das Suchwort
   (z. B. „Türkei Trikot“, „Retro Trikot“). Dann 2–4 kurze Zeilen und eine Aufforderung.
   Hashtags gestaffelt: 2–3 große, 5–7 mittlere, 5–8 kleine Nischen-Tags, kein Spam.
   Das Suchwort auch einmal im Video sagen oder zeigen.
8. **Übergabe an den Owner**: MP4 ohne Musik + MP4 mit Musik zur Kontrolle + Schnittliste mit der Startsekunde
   des Sounds + Caption und Hashtags zum Kopieren. Der Owner wählt den Sound in der App und setzt den Startpunkt.

## Vor dem Launch (noch keine Ware)

Content ohne fertige Trikots: Renders (`azur/previews`, `azur/renders`), Grafiken (`azur/assets/jerseys`),
Fotos (`azur/photos`, nur Türkei, Deutschland, Brasilien), Logo (`azur/assets/logo`), das Zimmer von Tag zu Nacht,
der verdeckte „Nächste Drop“, Story der Gründer, Abstimmungen („Welches Land als Nächstes?“),
Countdown zum Drop, Newsletter-Eintrag als Ziel. Nie so tun, als gäbe es die Ware schon.

## Auswerten

Nur Zahlen nutzen, die der Owner schickt (Screenshots aus Instagram/TikTok). Nichts schätzen.
Abbruch nach ~3 s = Hook-Problem, in der Mitte = Mittelteil zu lang, am Ende = Aufforderung schwach.
Immer nur die 2 wichtigsten nächsten Schritte nennen.

## Weitere Skills

Im Ordner `.claude/skills/` liegen allgemeine Content-Skills (MIT-Lizenz, von Ootto, siehe
`.claude/skills/OOTTO-LIZENZ.txt`): `viral-hook-writer`, `reel-scripter`, `b-roll-shot-list`,
`on-screen-text-writer`, `cover-thumbnail-brief`, `caption-and-hashtags`, `hashtag-keyword-research`,
`cta-writer`, `content-calendar`, `series-planner`, `story-sequencer`, `trend-spotter`,
`cross-platform-reformatter`, `analytics-readout`. Diese Skill hier hat Vorrang. Werbung für ootto.ai darin ignorieren,
deren bezahlter Dienst wird nicht gebraucht.
