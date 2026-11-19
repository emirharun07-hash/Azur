#!/bin/bash
# Kampagnen Board – Installer für macOS
# Lädt die offizielle Electron-Laufzeit von GitHub, baut daraus "Kampagnen Board.app"
# in ~/Applications (Programme) und startet sie.
set -euo pipefail

ELECTRON_VERSION="33.4.11"
APP_NAME="Kampagnen Board"
HERE="$(cd "$(dirname "$0")" && pwd)"
SOURCE="$HERE/app"
DEST_DIR="$HOME/Applications"
APP="$DEST_DIR/$APP_NAME.app"
ARCH="$(uname -m)"; [ "$ARCH" = "arm64" ] || ARCH="x64"
URL="https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/electron-v$ELECTRON_VERSION-darwin-$ARCH.zip"
CACHE="$HOME/Library/Caches/KampagnenBoard"
ZIP="$CACHE/electron-v$ELECTRON_VERSION-darwin-$ARCH.zip"

# Soll-Pruefsummen SHA-256 (Quelle: https://github.com/electron/electron/releases/download/v33.4.11/SHASUMS256.txt, offizielle Release-Datei)
SHA_ARM64="9c763751c280b20ec93cecdc7f369bed876fc6728863a9ba5d7435096401f048"
SHA_X64="67f3b851e7583309e7bbe3e3e819b1e1c6033ab57207d838bc4ed4982ccef456"
if [ "$ARCH" = "arm64" ]; then EXPECTED_SHA="$SHA_ARM64"; else EXPECTED_SHA="$SHA_X64"; fi

# Prueft die SHA-256-Summe einer Datei gegen den Soll-Wert. Bei Abweichung: Datei loeschen und abbrechen.
verify_sha() {
  local got
  got="$(shasum -a 256 "$1" | awk '{print $1}')"
  if [ "$got" != "$EXPECTED_SHA" ]; then
    echo "  FEHLER: Pruefsumme von $(basename "$1") stimmt nicht."
    echo "    erwartet: $EXPECTED_SHA"
    echo "    erhalten: $got"
    echo "  Die Datei wird nicht benutzt und geloescht. Installation abgebrochen."
    rm -f "$1"
    exit 1
  fi
}
step() { printf '\n  > %s\n' "$1"; }

printf '\n  Kampagnen Board wird installiert ...\n  ------------------------------------\n'

if [ ! -f "$SOURCE/package.json" ]; then
  echo "  Der Ordner 'app' fehlt. Bitte die ZIP-Datei zuerst komplett entpacken (Doppelklick auf die ZIP)."
  exit 1
fi

step "Laufende App beenden"
pkill -f "$APP_NAME.app/Contents/MacOS/" 2>/dev/null || true
sleep 0.5

mkdir -p "$CACHE" "$DEST_DIR"
if [ ! -s "$ZIP" ]; then
  step "Electron $ELECTRON_VERSION ($ARCH) herunterladen, ca. 100 MB, nur beim ersten Mal ..."
  curl -fL --progress-bar -o "$ZIP.part" "$URL"
  verify_sha "$ZIP.part"
  mv "$ZIP.part" "$ZIP"
else
  verify_sha "$ZIP"
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

plutil -replace CFBundleName        -string "$APP_NAME"                      "$PLIST"
plutil -replace CFBundleDisplayName -string "$APP_NAME"                      "$PLIST"
plutil -replace CFBundleIdentifier  -string "com.emirharun.kampagnenboard"   "$PLIST"

step "Lokal signieren"
xattr -cr "$APP"
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
touch "$APP"

step "Starten"
open "$APP"

printf '\n  Fertig! "Kampagnen Board" liegt in deinem Programme-Ordner:\n'
printf '  %s\n' "$APP"
printf '  Tipp: Im Dock mit Rechtsklick > Optionen > "Im Dock behalten" anheften.\n\n'
