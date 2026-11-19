# Theme-Dateien nach Shopify Files hochladen

`python azur/tools/upload_files.py` (= `--dry-run`) zeigt, was hochgeladen würde, und schreibt `azur/.cache/upload_plan.json`.
`--upload` lädt nichts hoch (Exit 2). Hochladen macht die Haupt-Session mit ihren Shopify-Werkzeugen.

## Ablauf (Haupt-Session)
Quelle: `upload_plan.json` (Felder `filename`, `local`, `size`, `mimeType`). Max. 250 Dateien je `fileCreate`-Aufruf (laut shopify.dev).

1. `stagedUploadsCreate` (Admin GraphQL), je Datei ein Eintrag in `input`:
   `filename`, `mimeType`, `fileSize` (String, Bytes), `httpMethod: POST`, `resource`.
   - `resource` für Bilder/Dateien: `FILE` [PRÜFEN: die Doku-Seite zeigt nur PRODUCT_IMAGE, VIDEO, MODEL_3D, COLLECTION_IMAGE, SHOP_IMAGE, URL_REDIRECT_IMPORT; vollständige Liste steht im Enum `StagedUploadTargetGenerateUploadResource`]. `.mp4/.webm`: `VIDEO`; `.glb`: `MODEL_3D`.
   - Rückgabe: `stagedTargets { url resourceUrl parameters { name value } }`, `userErrors { field message }`. Schlägt ein Ziel fehl, sind `url`/`resourceUrl` null und der Grund steht in `userErrors`.
2. Datei per HTTP-POST (multipart) an `url`, alle `parameters` als Formularfelder, die Datei als letztes Feld [PRÜFEN: Name des Dateifelds].
3. `fileCreate` mit `files: [{ originalSource: <resourceUrl>, contentType, filename, alt? }]`.
   - `contentType`: `IMAGE` oder `FILE` (Doku-Beispiele); Video/3D: [PRÜFEN].
   - `filename` = Dateiname aus `files.json` (`azr8-…`), damit der Name in Shopify gleich bleibt [PRÜFEN: ob Shopify Namen/Endung ändert].
   - Rückgabe: `files { id fileStatus }`, `userErrors`. Nötiger Zugriff: `write_files` (oder `write_themes`/`write_images`).
4. Warten, bis `fileStatus` = `READY` (Verarbeitung ist asynchron; Abfrage per `node(id:)`). Weitere Statuswerte [PRÜFEN].
5. Danach braucht das Theme die raw.githubusercontent-Links nicht mehr; die Dateien heißen in Shopify gleich (`azr8-…`). [PRÜFEN: genaue Umstellung der Liquid-Links, Aufgabe der Haupt-Session.]

## Hinweise
- Keine Zugangsdaten im Repo, kein Token im Skript.
- Fehlende lokale Dateien (`FEHLT lokal`) vor dem Upload klären.
