#!/bin/bash
# Baut AZURTermine-Mac-Installer.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/AZURTermine-Mac-Installer.zip}"
node "$ROOT/scripts/build.js" >/dev/null
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
D="$TMP/AZURTermine"
mkdir -p "$D/app"
cp -R "$ROOT/desktop/main.js" "$ROOT/desktop/preload.js" "$ROOT/desktop/package.json" "$ROOT/desktop/renderer" "$ROOT/desktop/build" "$D/app/"
cp "$ROOT/installer-mac/Installieren.command" "$ROOT/installer-mac/Deinstallieren.command" "$ROOT/installer-mac/LIESMICH.txt" "$D/"
chmod 755 "$D/Installieren.command" "$D/Deinstallieren.command"
rm -f "$OUT"
(cd "$TMP" && zip -qr -X "$OUT" AZURTermine)
echo "$OUT"
