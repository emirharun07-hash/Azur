#!/bin/bash
# AZUR Termine – Installer für macOS
# Nimmt die offizielle Electron-Laufzeit (vom Kampagnen Board, falls schon geladen, sonst von GitHub),
# baut daraus "AZUR Termine.app" in ~/Applications (Programme) und startet sie.
set -euo pipefail

ELECTRON_VERSION="33.4.11"
APP_NAME="AZUR Termine"
HERE="$(cd "$(dirname "$0")" && pwd)"
SOURCE="$HERE/app"
DEST_DIR="$HOME/Applications"
APP="$DEST_DIR/$APP_NAME.app"
ARCH="$(uname -m)"; [ "$ARCH" = "arm64" ] || ARCH="x64"
ZIPNAME="electron-v$ELECTRON_VERSION-darwin-$ARCH.zip"
URL="https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/$ZIPNAME"
CACHE="$HOME/Library/Caches/AZURTermine"
ZIP="$CACHE/$ZIPNAME"
KB_ZIP="$HOME/Library/Caches/KampagnenBoard/$ZIPNAME"

step() { printf '\n  > %s\n' "$1"; }

printf '\n  AZUR Termine wird installiert ...\n  ---------------------------------\n'

if [ ! -f "$SOURCE/package.json" ]; then
  echo "  Der Ordner 'app' fehlt. Bitte die ZIP-Datei zuerst komplett entpacken (Doppelklick auf die ZIP)."
  exit 1
fi

step "Laufende App beenden"
pkill -f "$APP_NAME.app/Contents/MacOS/" 2>/dev/null || true
sleep 0.5

mkdir -p "$CACHE" "$DEST_DIR"
if [ ! -s "$ZIP" ]; then
  if [ -s "$KB_ZIP" ]; then
    step "Electron vom Kampagnen Board übernehmen"
    cp "$KB_ZIP" "$ZIP"
  else
    step "Electron $ELECTRON_VERSION ($ARCH) herunterladen, ca. 100 MB, nur beim ersten Mal ..."
    curl -fL --progress-bar -o "$ZIP.part" "$URL"
    mv "$ZIP.part" "$ZIP"
  fi
fi

step "App zusammenbauen"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ditto -x -k "$ZIP" "$TMP"
rm -rf "$APP"
mv "$TMP/Electron.app" "$APP"

RES="$APP/Contents/Resources"
PLIST="$APP/Contents/Info.plist"
rm -f "$RES/default_app.asar"
cp -R "$SOURCE" "$RES/app"
cp "$SOURCE/build/icon.icns" "$RES/electron.icns"

plutil -replace CFBundleName        -string "$APP_NAME"          "$PLIST"
plutil -replace CFBundleDisplayName -string "$APP_NAME"          "$PLIST"
plutil -replace CFBundleIdentifier  -string "com.azur.termine"   "$PLIST"

step "Lokal signieren"
xattr -cr "$APP"
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
touch "$APP"

step "Starten"
open "$APP"

printf '\n  Fertig! "AZUR Termine" liegt in deinem Programme-Ordner:\n'
printf '  %s\n' "$APP"
printf '  Tipp: Im Dock mit Rechtsklick > Optionen > "Im Dock behalten" anheften.\n\n'
