# Render-Beobachter: sicher testen

Der Beobachter (`render_on_windows.ps1 watch`) holt von GitHub nur noch `azur/render_request.json`. Er führt nur Code aus, der schon auf dem PC liegt, und fragt am PC nach („Diese Aenderungen uebernehmen? (ja/nein)“), wenn sich `azur/tools` oder `azur/scene` auf GitHub geändert haben. Unbekannte Werte in der Auftragsdatei führen zum Abbruch, ohne dass etwas gelöscht oder gestartet wird.

Test am PC, bevor der Beobachter wieder läuft (PowerShell im Repo-Ordner, Beobachter aus):

1. `git status` zeigt keine eigenen Änderungen. Dann den neuen Stand einmal selbst holen und ansehen: `git fetch origin` und `git diff HEAD origin/claude/shopify-notification-signup-o5avym -- azur/tools`, danach `git merge --ff-only origin/claude/shopify-notification-signup-o5avym`.
2. Python-Umgebung aktivieren: `. azur\.venv\Scripts\Activate.ps1`
3. Testkopie anlegen: `New-Item -ItemType Directory -Force azur\.cache | Out-Null; Set-Content azur\.cache\test_request.json '{"id":"sicherheitstest-1","set":"..\\..","rebuild":true,"jobs":["preview"]}'`
4. Merken, was da ist: `(Get-ChildItem -Recurse azur\prototype\assets).Count`
5. Prüfen: `powershell -ExecutionPolicy Bypass -File azur\tools\render_step.ps1 -Offline -RequestFile azur\.cache\test_request.json` (`-Offline`: nichts wird hochgeladen)
6. Erwartet: „Auftrag abgelehnt: Feld set ist ungueltig …“. Kein Rendern, Zahl aus Schritt 4 unverändert.
7. Gleich mit `"set":"scene3; rm"`, `"id":"a/../b"` und `"jobs":["room;calc"]` wiederholen: jedes Mal „Auftrag abgelehnt“.
8. Danach `git checkout -- azur/render_status.json` (der Test schreibt dort „abgelehnt“) und `Remove-Item azur\.cache\test_request.json`.
9. Erst wenn alle Tests abbrechen, den Beobachter wieder starten: `powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 watch`.
10. Fragt das Fenster später „Diese Aenderungen uebernehmen?“, nur mit `ja` antworten, wenn du die Änderung selbst angestoßen hast.
