# AZUR

Code und Material für den Shop **AZUR Clothing** (azurclothing.com, Shopify).

Die Startseite ist ein echtes, in 3D gerendertes Kinderzimmer voller Fußball. Die Trikots am Kleiderständer sind der
Shop: Ein Klick öffnet das Trikot, „Größe wählen“ legt es in den echten Warenkorb. Darunter folgt die normale Seite mit
allen Trikots im FIFA-Karten-Design.

## Was liegt wo

Alles liegt im Ordner [`azur/`](azur):

| Ordner / Datei | Inhalt |
|---|---|
| `azur/UEBERGABE.md` | Zuerst lesen in einer neuen Sitzung: Marke, Produkte, Stand, Regeln des Owners, offene Punkte |
| `azur/BRIEF.md` | Die Idee und die festen Entscheidungen (Farben, Texte, Stil) |
| `azur/STATUS.md` | Stand der Arbeit, Entscheidungen des Owners, Runde für Runde |
| `azur/theme/` | Das Shopify-Theme (Sections, Snippets, CSS, JS), so wie es in den Shop hochgeladen wird |
| `azur/prototype/` | Quellcode des Zimmers (WebGL, Licht, Kamerafahrten, Produktansicht). `azur/tools/build_theme.py` baut daraus die Theme-Dateien |
| `azur/scene/` | Die 3D-Szene in Blender (Zimmer, Trikots, Licht) und die Render-Warteschlange |
| `azur/tools/` | Bauen, Testen und Rendern (z. B. `render_on_windows.ps1` für den PC) |
| `azur/render_request.json` | Render-Auftrag für den PC; `azur/render_status.json` meldet den Fortschritt zurück |
| `azur/kampagnen-board/` | Kampagnen Board: gemeinsame Arbeitsfläche für die Kampagnen (App für Windows und Mac mit eigener Cloud, dazu eine claude.ai-Fassung). Anleitung in der README dort |
| `azur/admin/` | Kleiner Worker für die Textbearbeitung direkt auf der Website (Anleitung in `ANLEITUNG.md`) |
| `azur/design/` | Design-Runden (Vorschläge zum Durchwischen) |
| `azur/previews/`, `azur/renders/`, `azur/refs/`, `azur/photos/` | Testbilder, Renders, Referenzen, Produktfotos |

## Wie gearbeitet wird

1. **Rendern** passiert auf dem PC des Owners: `azur/tools/render_step.ps1` liest `azur/render_request.json`, rendert
   und schickt die Bilder zurück in dieses Repo.
2. **Theme bauen:** `python3 azur/tools/build_theme.py` erzeugt aus `azur/prototype/` die Dateien in `azur/theme/`.
3. **Testen:** `python3 azur/tools/theme_harness.py 8770` startet die Startseite lokal (Desktop, iPad und iPhone werden
   im Browser durchgespielt).
4. **In den Shop:** Änderungen kommen immer in einen **Entwurf** (Kopie des Live-Themes) und nie direkt ins Live-Theme.
   Veröffentlichen macht der Owner selbst.

## Regeln

- Das Live-Theme wird nie direkt geändert.
- Der Shop bleibt mit Passwort geschlossen, bis der Owner ihn öffnet.
- Keine Passwörter oder Schlüssel in dieses Repo.

