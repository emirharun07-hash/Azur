# Übergabe für eine neue Sitzung (Stand 06.11.2026)

Eine neue Claude-Sitzung sieht den alten Chat nicht. Sie weiß nur, was in diesem Repo steht. Diese Datei fasst
das Wichtigste zusammen. Die Einzelheiten zu jeder Runde stehen in `azur/STATUS.md`, die Idee in `azur/BRIEF.md`.

## Die Marke

- **AZUR Clothing**, Shopify-Shop **azurclothing.com** (intern `5vpchz-hd.myshopify.com`), Euro, Deutschland.
- Gründer: Emir (schreibt mit Claude, „Owner“) und Talha.
- **Produkte** (alle aktiv, Größen S–XL):

  | Trikot | Preis | Adresse |
  |---|---|---|
  | Türkei | 54,99 € | `/products/turkei-trikot-azur-collection` |
  | Deutschland | 54,99 € | `/products/deutschland-trikot-azur-collection` |
  | Brasilien | 54,99 € | `/products/brasilien-trikot-azur-collection` |
  | Berlin 030 | 64,99 € | `/products/berlin-trikot-azur-collection` |
  | Frankfurt 069 | 64,99 € | `/products/frankfurt-trikot-azur-collection` |

  Versand in Deutschland 1,99 € (Express 9,99 €), ab 79,99 € kostenlos (seit Runde 33, 2.11.; vorher 90 €). EU,
  Schweiz, UK und USA haben eigene Preise, ebenfalls kostenlos ab 79,99 in der Währung des Markts. Die Städtetrikots sind nicht mehr auf der Startseite, sie haben
  eine eigene Seite (Runde 19).
- **Idee:** Trikots im Retro-Fußball-Look als Streetwear. Man trägt sein Land oder seine Stadt, keinen Verein.
  Satz der Marke: „Getragen auf dem Platz und danach.“
- **Website:** Die Startseite ist ein echtes, in 3D gerendertes Kinderzimmer. Die Trikots am Kleiderständer sind der
  Shop. Darunter kommt die normale Seite mit den Trikots als Karten. Im Bett liegt das Magazin „ANSTOSS“. Neue Teile
  kommen als limitierte **Drops**, über den Newsletter erfährt man sie zuerst.
- **Alleinstellungsmerkmal** (aus dem Uni-Pitch, Oktober 2026):
  - Identität statt Verein.
  - Mode statt Fanartikel.
  - 55–65 € statt rund 90–100 € für ein offizielles Trikot.
  - Einkaufen als Erlebnis im Zimmer.
  - Knappheit durch Drops.
- **Zielgruppen** (aus dem Uni-Pitch):
  - 16–30 Jahre, Frauen und Männer, vor allem in Großstädten.
  - Menschen mit Wurzeln in mehreren Ländern, zum Beispiel türkisch- oder brasilianisch-deutsch.
  - Lokalpatrioten aus Berlin und Frankfurt.
  - Hobbykicker.
  - Fans von Retro-Trikots, Streetwear und Drops.
  - Verkauf direkt an Endkunden (B2C). Start in Deutschland.

## Stand am 06.11.2026

- **Live-Theme** ist „Azur Zimmer Runde 33 – Versand ab 79,99 (Entwurf)“,
  `gid://shopify/OnlineStoreTheme/210859917651` (am 6.11. geprüft). Der Owner hat es selbst veröffentlicht. Es gibt
  15 Themes, Shopify erlaubt 20.
- **Preis offen:** Claude hat 49,99 € statt 54,99 € für die Ländertrikots empfohlen. Der Owner hat noch nicht
  entschieden. Wenn ja: Preise in Shopify, den SEO-Text „Ab 54,99 €“ (nur im Entwurfs-Theme) und die
  Gründungs-Excel anpassen.
- **Der Shop ist mit Passwort geschlossen** (am 4.11.2026 geprüft und vom Owner bestätigt): `/` und die
  Produktseiten leiten auf `/password` um. Am 29.10. war er kurz offen. Verkauf ist erst ab etwa Januar 2027
  geplant. Nicht selbst ändern.
- **Was Suchmaschinen sehen** (am 29.10. von außen geprüft):
  - Titel der Startseite: „Azur – Trikots aus Berlin: Berlin 030, Frankfurt 069“. Die Beschreibung nennt auch
    die Ländertrikots. Beide kommen aus Shopify → Onlineshop → Einstellungen; ohne Eintrag dort aus den
    Theme-Einstellungen (`layout/theme.liquid`).
  - Ein Vorschaubild für geteilte Links ist da (og:image, 1200×630).
  - `sitemap.xml` ist erreichbar, und `robots.txt` erlaubt Suchmaschinen.
  - Die Produkte haben keine eigenen SEO-Titel oder -Beschreibungen; Shopify nimmt dann den Produkttext.
  - Es gibt kein Meta-Pixel und kein Google-Tag (Facebook Conversions API ist aus).
  - Auf der Startseite gibt es keinen Link zu Instagram oder TikTok.
  - Eine Websuche nach „azurclothing“ fand am 29.10. nur andere Marken mit dem Namen Azur, zum Beispiel ein
    Modelabel aus Marseille und Azur Fit aus Toronto. Den Shop fand sie nicht. „Azur“ allein ist also ein
    umkämpfter Name; „Azur Clothing“ oder „Azur Trikot“ sind leichter zu gewinnen.

## Regeln des Owners

- **Sprache:**
  - Auf Deutsch antworten, mit einfachen Wörtern.
  - Lieber fragen als Annahmen treffen.
  - Regelmäßig kurz sagen, was gerade passiert.
- **Live-Theme:** Das Live-Theme wird nie direkt geändert. Änderungen kommen in eine Kopie (`themeDuplicate` vom
  Live-Theme), und der Owner veröffentlicht selbst. Themes löschen geht über die Schnittstelle nicht.
- **Shop-Passwort:** Das Passwort des Shops, also ob der Shop offen oder zu ist, wird nie von Claude geändert.
- **Geheimes und Geld:**
  - Keine Passwörter oder Schlüssel im Chat oder im Repo. Das Repo ist öffentlich lesbar.
  - Nichts, was Geld kostet (Werbebudget, Apps, Abos), ohne ausdrückliche Zusage des Owners.
  - In Konten wie Meta oder Google klickt der Owner selbst; Claude erklärt Schritt für Schritt.
- **Mehrere Sitzungen gleichzeitig:**
  - Nur eine Sitzung lädt etwas in Shopify hoch: ab 6.11.2026 die Sitzung „Azur Shop & Theme“. Die anderen
    Azur-Sitzungen (Werbung & Google, Gründung & Controlling, Content) lesen in Shopify nur.
  - Keine Fragen als Auswahl-Dialog stellen; der Owner will normale Fragen im Text.
  - Vor jedem Push `git pull --rebase`.
  - Keine zerstörerischen Git-Befehle.

## Wo was liegt

- **Repo:** `emirharun07-hash/Azur` (hieß früher `S-per-Lig-Fantasy-Manager`, alte Links leiten weiter). Der Ordner
  auf dem PC des Owners heißt noch `S-per-Lig-Fantasy-Manager`, so bleibt es. Achtung: Das Repo
  `azur-shopify-theme` hat mit Azur nichts zu tun. Es ist der alte Name von `kilic.berlin` (leer).
- **Branches:** Der Startzweig ist `main`. Der neueste Stand liegt im Arbeitszweig
  `claude/shopify-notification-signup-o5avym`; `main` hinkt hinterher. Diesen Zweig nicht löschen, der PC des Owners
  rendert darüber.
- **Ordner:** Alle Ordner stehen in der Tabelle in `README.md`. Die wichtigsten:
  - `azur/theme/`: das Shopify-Theme.
  - `azur/prototype/`: Quellcode des Zimmers.
  - `azur/tools/`: Bauen, Testen, Rendern.
  - `azur/kampagnen-board/`: Arbeitsfläche für Kampagnen, App für Windows und Mac sowie eine claude.ai-Fassung.
  - `azur/admin/`: Texte direkt auf der Website bearbeiten.
  - `azur/assets/logo/`: das Logo.
    - Groß: `azur-logo-gross-schwarz.png` und `azur-logo-gross-creme.png`, 6000 × 3035 px, durchsichtiger Hintergrund.
    - Als Vektor: `azur-logo.svg`.
    - Das ist vom 480-px-Original nachgezeichnet. Eine Originaldatei vom Designer gibt es im Repo nicht.
- **Theme-Dateien hochladen:** `themeFilesUpsert` mit `{type: URL, value:
  "https://raw.githubusercontent.com/emirharun07-hash/Azur/<volle 40-stellige Commit-ID>/azur/theme/<Datei>"}`
  (eine kurze ID gibt 404). Danach die MD5 aus `theme { files { checksumMd5 } }` mit `md5sum` vergleichen.
- **Lokal testen:** `cd azur && python3 tools/theme_harness.py 8770`. Nach Änderungen am Zimmer zuerst
  `python3 tools/build_theme.py`.
- **Shopify-Verbindung:** Wenn der Connector „neu anmelden“ meldet, verbindet der Owner Shopify in den claude.ai-
  Einstellungen neu; danach geht es oft im selben Chat weiter.

## Offen

- **Rückgabe im Kundenkonto und Widerrufsbutton** (5.11.2026, vor dem Start erledigen):
  - Geprüft: Neue Kundenkonten sind aktiv (Login mit E-Mail-Code). Der Footer-Link „Bestellungen und Rücksendungen“
    führt dorthin. Rückgaberegel: 14 Tage ab Lieferung des letzten Artikels, auf Werktag verlängert.
  - Owner schaltet ein: Einstellungen > Kundenkonten > Rückgabe und Stornieren durch Kunden. Dazu Stornierung
    „bis der Artikel versendet ist“ unter Einstellungen > Richtlinien. Ob der Schalter schon an ist, sieht Claude
    über die Schnittstelle nicht.
  - Nicht automatisch: Genehmigen, Rücksendeetikett (Shopify macht in DE keins, also hochladen oder DHL-Retourenportal)
    und Erstatten. Mails an den Kunden kommen automatisch.
  - Pflicht seit 19.06.2026: Button „Vertrag widerrufen“, ohne Login, mit Formular, „Widerruf bestätigen“ und
    sofortiger Eingangsbestätigung per Mail. Die Rückgabe im Kundenkonto reicht dafür nicht, weil sie ein Login braucht.
    Lösung offen (App oder eigener Bau). Die Widerrufsbelehrung prüfen lassen.
- **Verpackungsregister LUCID** (4.11.2026): Die Trikots kommen aus dem Ausland, jedes in einer Plastiktüte.
  Damit ist Azur sehr wahrscheinlich für diese Tüten zuständig (seit 12.08.2026 EU-Verpackungsverordnung).
  - Zu tun: in LUCID registrieren (kostenlos), einen Vertrag mit einem Systembetreiber schließen (kostet etwas)
    und die Mengen in LUCID melden. Das muss vor dem ersten verschickten Paket erledigt sein.
  - Name wie beim Finanzamt und bei PayPal. Markennamen „Azur“ und der Firmenname (Verpackung ist neutral).
  - Stand 4.11.: In LUCID registriert, Registrierungsnummer DE1483502731285 (steht ohnehin im öffentlichen
    Register). Unternehmensname dort: „Azur“. Das ist richtig: Nicht eingetragene GbRs geben laut LUCID ihre
    Geschäftsbezeichnung an, und die ist laut Gewerbeanmeldung „Azur“. Verkauf ist erst ab etwa Januar 2027 geplant, darum
    den Systemvertrag im Dezember für 2027 abschließen und danach die Mengen in LUCID melden. Der Shop ist
    bis dahin mit Passwort zu. Wird er früher geöffnet, braucht es den Vertrag schon vor dem ersten Paket.
  - Lieferant sitzt in China und hat nichts gemeldet; das ist normal, Azur ist als Importeur zuständig.
    Geplant: die durchsichtige Tüte bleibt, darum kommt eine eigene Versandtüte oder ein Karton (noch nicht
    entschieden). Zu melden: alles, was beim Kunden ankommt, und am sichersten auch die großen
    Lieferkartons aus China, die Azur auspackt.
  - Kosten (Vergleich vom 15.10.2026, Lizenzjahr 2027, netto, plus 19 % MwSt): EASY-LIZE 28,90 €, activate by
    Reclay 37,05 €, VerpackGo 44,84 €. Für Azur zählt vor allem die Grundgebühr.
  - Erinnerung für den Owner am 21.12.2026, 10 Uhr, in der Sitzung „Azur Shop & Theme“ (am 6.11. dorthin verlegt).
  - Der Owner macht das selbst; Claude erklärt.
- **Fast gleicher Name: azurclo.com** (am 1.11.2026 geprüft). Ein Shopify-Shop aus der Schweiz (CHF, Deutsch) mit
  Streetwear: Hoodies, Jogger, Shorts, Shirt und Trainingsanzug für 30–60 CHF, 7 Produkte. Er nennt sich „Azur“
  (Seitentitel), „Azurclo“ und im Newsletter-Text „Azurclothing“. Instagram heißt @azurcloothing, TikTok
  @www.azurclo.com. Das Impressum ist leer, und im Schweizer Handelsregister (Zefix) gibt es keinen Eintrag zu
  „Azurclo“. **Die sind älter als wir**: Ihre Domain gibt es seit 12.04.2025, Produkte seit 19.10.2025. Unser
  Shopify-Shop besteht seit 16.09.2026, unsere Domain azurclothing.com seit 29.09.2026. Für Suche und Werbung sind
  sie ein direkter Konkurrent um „Azur Clothing“. Die Markenregister (DPMA, EUIPO/TMview, Swissreg) für „Azur“ in
  Klasse 25 sind noch nicht geprüft; TMview blockt Abfragen aus der Cloud. Der Owner prüft das, am besten mit einem
  Markenanwalt, bevor Geld in Werbung oder Marke fließt.
- Absturz am Handy beim Bett und im Heft (Runde 27, 31.10.): Der Owner veröffentlicht den Entwurf und testet auf
  echtem iPhone und Android (siehe STATUS „Runde 27“).
- Der Owner testet die Ansichts-Knöpfe „Bett, Zimmer, Ständer“ auf echtem iPad, iPhone und Android (in 26b
  repariert, siehe STATUS „Runde 26b“).
- Code vereinfachen: Die Übergangsvarianten `?ad=jetzt` und `?ad=blende` und der Gleit-Code können raus, wenn der
  Owner die Kamerafahrt auf echten Geräten bestätigt.
- Das Rendern auf dem PC des Owners ist gerade aus.

## Startpunkt für das Thema Werbung und Google

Der Wunsch des Owners vom 29.10.: „Wenn jemand Azur oder Azurclothing eingibt, soll unsere Website kommen“, und über
Meta Ads sprechen. Noch nichts davon ist eingerichtet. Ideen zum Prüfen, nicht entschieden:

- **Meta Ads und Google-Suche sind zwei verschiedene Dinge.** Meta Ads zeigen Werbung auf Instagram und Facebook.
  Sie ändern nicht, was bei Google erscheint.
- **Bei Google gefunden werden, kostenlos:**
  1. Den Shop in der Google Search Console anmelden und die Sitemap einreichen.
  2. Titel und Beschreibung der Startseite so schreiben, dass „AZUR Clothing“ darin steht.
  3. Instagram und andere Profile mit der Website verlinken.
- **Bei Google sofort ganz oben, gegen Geld:** eine Google-Ads-Kampagne auf den eigenen Markennamen.
- **Meta:**
  - Die Shopify-App „Facebook & Instagram“ verbindet Meta-Pixel, Conversions API und Produktkatalog.
  - Die Domain wird im Meta Business Manager bestätigt.
  - Für Tracking in Deutschland braucht es vorher eine Cookie-Einwilligung (DSGVO), zum Beispiel über Shopifys
    eigenes Cookie-Banner.
- **Zuerst fragen:**
  - Gibt es schon ein Instagram- oder TikTok-Profil, eine Meta Business Suite oder ein Werbekonto?
  - Welches Budget ist geplant?
  - Wann geht der Shop auf? (Stand 4.11.: zu, Verkauf ab etwa Januar 2027.)

## Content: Reels und TikToks (eigener Chat, Stand 02.11.2026)

Alles zu Content steht in **`azur/content/UEBERSICHT.md`**: Ziel, Accounts (Instagram @azur_clothing3, TikTok
@azurclothing), Entscheidungen des Owners, Ablauf (Drehtag mit Muster-Trikots, dann ein Monat Higgsfield Plus,
Blender-Kamerafahrten, Schnitt im Takt der Musik), Ideen mit dem 3D-Zimmer und offene Punkte. Skills dafür liegen in
`.claude/skills/` (`azur-reels`, `azur-hook-stratege`, `azur-beat-schnitt`). Kamerafahrten für Reels werden mit dem
Chat abgestimmt, der die Szene und die Render-Aufträge macht.
