#!/bin/bash
# AZUR Termine entfernen. Deine Einträge bleiben in ~/Library/Application Support/AZUR Termine (und in eurer Cloud).
APP_NAME="AZUR Termine"
pkill -f "$APP_NAME.app/Contents/MacOS/" 2>/dev/null || true
sleep 0.5
rm -rf "$HOME/Applications/$APP_NAME.app"
printf '\n  AZUR Termine wurde entfernt.\n'
printf '  Deine Einträge liegen weiterhin in: ~/Library/Application Support/%s\n\n' "$APP_NAME"
