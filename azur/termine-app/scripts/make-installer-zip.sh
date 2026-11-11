#!/bin/bash
# Baut AZURTermine-Windows-Installer.zip (Windows-Dateien mit CRLF; .bat in cp850, .ps1 und .txt in UTF-8 mit BOM)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/AZURTermine-Windows-Installer.zip}"
node "$ROOT/scripts/build.js" >/dev/null
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
D="$TMP/AZURTermine"
mkdir -p "$D/app"
cp -R "$ROOT/desktop/main.js" "$ROOT/desktop/preload.js" "$ROOT/desktop/package.json" "$ROOT/desktop/renderer" "$ROOT/desktop/build" "$D/app/"
python3 - "$ROOT/installer-win" "$D" <<'PY'
import sys, pathlib
src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
for f in src.rglob('*'):
    if f.is_dir(): continue
    rel = f.relative_to(src); out = dst / rel; out.parent.mkdir(parents=True, exist_ok=True)
    text = f.read_text(encoding='utf-8').replace('\r\n', '\n').replace('\n', '\r\n')
    enc = 'cp850' if f.suffix == '.bat' else 'utf-8-sig'
    out.write_bytes(text.encode(enc))
PY
rm -f "$OUT"
(cd "$TMP" && zip -qr -X "$OUT" AZURTermine)
echo "$OUT"
