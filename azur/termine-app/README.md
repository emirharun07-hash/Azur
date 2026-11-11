# AZUR Termine

Termine und Deadlines für die zwei Inhaber: eintragen, sehen, abhaken, ändern. Liste (das Nächste oben,
Überfälliges rot) und drei Monate. Ein Klick auf einen Tag zeigt, was dort fällig ist. Jeder Eintrag lässt sich
in den Kalender übernehmen (Google Kalender oder Kalenderdatei mit Erinnerung am Tag davor und am Tag selbst).

Es gibt zwei Fassungen aus demselben Code:

| Fassung | Speicherung | Gemeinsam |
|---|---|---|
| **App für Windows und Mac** (`desktop/`) | auf dem Computer oder in eurer eigenen Supabase-Cloud | automatisch über das Kampagnen Board, sonst Einladungscode |
| **claude.ai** (`artifact/index.html`) | claude.ai-Datenbank des Artifacts | „Teilen“ in claude.ai |

Die beiden Fassungen haben **getrennte Daten**.

## Cloud

Die App nutzt dieselbe Tabelle `kb_docs` wie das Kampagnen Board (`../kampagnen-board/supabase/setup.sql`).
Die Termine liegen dort in eigenen Zeilen: `path = "azur-termine/<id>"`, `parent = "azur-termine"`.
Das Kampagnen Board liest nur `boards/…` und sieht sie nicht.

Ist das Kampagnen Board auf demselben Computer mit einer Cloud verbunden, übernimmt die App diese Verbindung beim
ersten Start (aus `Kampagnen Board/settings.json` im App-Datenordner). Der Einladungscode hat dasselbe Format (`KB1.…`)
und gilt für beide Apps. Schlüssel und Adressen gehören nie in dieses Repository.

Ein Eintrag: `{ title, date: "JJJJ-MM-TT", time: "HH:MM" | "", kind: "termin" | "deadline",
who: "emir" | "talha" | "beide", note, done, doneAt, createdAt, updatedAt }`.

## Aufbau

```
src/                     gemeinsamer Code
  ui.html, ui.css, ui.js Oberfläche (Liste, Monate, Tag, Eintrag, Kalenderdatei)
  store-claude.js        claude.ai (db, downloads, user)
  store-desktop.js       App: auf dem Computer oder Cloud, Dialog „Gemeinsam nutzen“
  fonts/                 Archivo (SIL Open Font License 1.1), für die App mitgeliefert
desktop/                 Electron-Hauptprozess (Fenster groß und klein), Preload, Symbole, vendor/supabase.js
installer-win/           Installieren.bat, Deinstallieren.bat, setup/*.ps1, LIESMICH.txt
installer-mac/           Installieren.command, Deinstallieren.command, LIESMICH.txt
supabase/setup.sql       einmalige Einrichtung der Cloud (gleiche Tabelle wie beim Kampagnen Board)
scripts/build.js         baut artifact/index.html und desktop/renderer/
scripts/make-icons.js    zeichnet die App-Symbole (aus ../assets/logo/azur-logo.svg)
scripts/make-installer-zip.sh, make-installer-zip-mac.sh   bauen die Installer-ZIPs
test/                    Tests: claude.ai-Fassung im Browser, App in Electron mit Ersatz-Cloud
```

## Entwickeln

```bash
node scripts/build.js                     # beide Fassungen bauen
cd desktop && npm install && npm start    # App lokal starten
./scripts/make-installer-zip.sh           # AZURTermine-Windows-Installer.zip
./scripts/make-installer-zip-mac.sh       # AZURTermine-Mac-Installer.zip
NODE_PATH=$(npm root -g) node test/artifact.test.js
NODE_PATH=$(npm root -g) xvfb-run -a node test/desktop.test.js
```

Die Installer laden die offizielle Electron-Laufzeit (33.4.11, wie das Kampagnen Board) und nehmen sie vom
Kampagnen Board, wenn sie dort schon liegt. Daten: Windows `%APPDATA%\AZUR Termine`, Mac
`~/Library/Application Support/AZUR Termine` (`data.json`, `settings.json`, `window.json`).
