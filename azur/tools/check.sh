#!/bin/sh
# AZUR: one command checks the whole theme.
#   sh azur/tools/check.sh <output-dir>
# Builds, starts the test shop (theme_harness.py), takes screenshots, runs test_room.cjs, searches for forbidden words,
# a stock counter and private data. Last line: CHECK PASS or CHECK FAIL (<reasons>).
# Env: AZUR_VENV (python venv, default /tmp/azur-venv), CHROMIUM, PLAYWRIGHT (see harness_shots.cjs), BASE_REF (git ref for the private-data diff)
# Extra paths for the screenshots: azur/tools/check_paths.txt (one path per line).

START=$(date +%s)
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../.." && pwd)
cd "$REPO" || exit 2
OUT=${1:-}
[ -n "$OUT" ] || { echo "usage: sh azur/tools/check.sh <output-dir>"; exit 2; }
mkdir -p "$OUT" || exit 2
OUT=$(cd "$OUT" && pwd)
FAILS=""
fail() { case " $FAILS " in *" $1 "*) ;; *) FAILS="${FAILS:+$FAILS, }$1" ;; esac; }

# Known prototype faults: test_room.cjs lines (FAIL <name prefix>) that are tolerated, one per line. They are NOT weakened in the test.
KNOWN_FAIL='keyboard: Tab and Shift+Tab stay inside the product view
logo: a click closes the product view'

# a. python environment
VENV=${AZUR_VENV:-/tmp/azur-venv}
PY=$VENV/bin/python
if [ ! -x "$PY" ]; then
  uv venv --python 3.11 "$VENV" -q && uv pip install -q --python "$PY" pillow "python-liquid==2.3.6" || { echo "venv could not be created"; echo "CHECK FAIL (build)"; exit 1; }
fi

# b. build
echo "== build"
if "$PY" azur/tools/build_artifact.py > "$OUT/build.log" 2>&1 && "$PY" azur/tools/build_theme.py >> "$OUT/build.log" 2>&1; then
  tail -1 "$OUT/build.log"
else
  tail -5 "$OUT/build.log"; fail build
fi

# c. test shop on a free port
PORT=8771
while [ "$PORT" -lt 8800 ]; do
  if curl -s --noproxy '*' -o /dev/null --max-time 1 "http://127.0.0.1:$PORT/" 2>/dev/null; then PORT=$((PORT + 1)); else break; fi
done
HPID=""
cleanup() { [ -n "$HPID" ] && kill "$HPID" 2>/dev/null; }
trap cleanup EXIT INT TERM
mkdir -p azur/.cache/theme_live
echo "== harness on port $PORT"
(cd azur/tools && exec "$PY" theme_harness.py "$PORT" > "$OUT/harness.log" 2>&1) &
HPID=$!
UP=0; I=0
while [ "$I" -lt 20 ]; do
  CODE=$(curl -s --noproxy '*' -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:$PORT/" 2>/dev/null)
  if [ "$CODE" = "200" ]; then UP=1; break; fi
  I=$((I + 1)); sleep 1
done
if [ "$UP" != 1 ]; then echo "harness did not answer 200 within 20 s"; fail harness; fi

# d. screenshots
if [ "$UP" = 1 ]; then
  echo "== screenshots"
  PATHS="/ /collections/trikots /products/brasilien-trikot-azur-collection /products/deutschland-trikot-azur-collection"
  if [ -f azur/tools/check_paths.txt ]; then
    for X in $(grep -v '^[[:space:]]*$' azur/tools/check_paths.txt | grep -v '^[[:space:]]*#'); do
      case " $PATHS " in *" $X "*) ;; *) PATHS="$PATHS $X" ;; esac
    done
  fi
  # the test shop writes what it cannot render into the page: "HARNESS: …" and "translation missing: …"
  : > "$OUT/harness_notes.txt"
  for X in $PATHS "/?locale=en"; do
    curl -s --noproxy '*' --max-time 20 "http://127.0.0.1:$PORT$X" | grep -oE "HARNESS: [^<]*|translation missing: [^<\"]*" | sort -u | sed "s|^|$X  |" >> "$OUT/harness_notes.txt"
  done
  if [ -s "$OUT/harness_notes.txt" ]; then echo "HARNESS-NOTES: $(wc -l < "$OUT/harness_notes.txt" | tr -d ' ') (siehe harness_notes.txt)"; fail harness; else rm -f "$OUT/harness_notes.txt"; fi
  # shellcheck disable=SC2086
  node azur/tools/harness_shots.cjs "http://127.0.0.1:$PORT" "$OUT/shots" $PATHS > "$OUT/shots.log" 2>&1
  SRC=$?
  tail -3 "$OUT/shots.log"
  { [ "$SRC" = 0 ] && [ -f "$OUT/shots/shots.json" ]; } || fail shots
fi

# e. browser test of the room
echo "== test_room"
mkdir -p "$OUT/room"
node azur/tools/test_room.cjs azur/.cache/publish "$OUT/room" > "$OUT/room.log" 2>&1
tail -3 "$OUT/room.log"
if ! grep -q "^all passed\|^[0-9]* failed" "$OUT/room.log"; then fail room; fi
grep "^FAIL" "$OUT/room.log" > "$OUT/room_fails.txt" 2>/dev/null
if [ -s "$OUT/room_fails.txt" ]; then
  : > "$OUT/room_known.txt"
  while IFS= read -r L; do
    NAME=${L#FAIL }
    KNOWN=0
    OLDIFS=$IFS; IFS='
'
    for K in $KNOWN_FAIL; do case "$NAME" in "$K"*) KNOWN=1 ;; esac; done
    IFS=$OLDIFS
    if [ "$KNOWN" = 1 ]; then echo "$L" >> "$OUT/room_known.txt"; else fail room; fi
  done < "$OUT/room_fails.txt"
  [ -s "$OUT/room_known.txt" ] && echo "KNOWN_FAIL tolerated: $(wc -l < "$OUT/room_known.txt")"
fi

# f. forbidden words (report only)
grep -rniE "streifenbesatz|wappen|adler|sterne|inkl\. mwst|retro" azur/prototype/js azur/prototype/index.html azur/theme/sections azur/theme/snippets azur/theme/templates azur/theme/locales > "$OUT/woerter.txt" 2>/dev/null
echo "WOERTER: $(wc -l < "$OUT/woerter.txt" | tr -d ' ')"

# g. stock counter ban
if grep -rniE "[0-9x}] ?/ ?50|[0-9x}] von 50|noch [0-9]+ (von|stück)" azur/prototype/js azur/theme/sections azur/theme/snippets azur/theme/templates > "$OUT/zaehler.txt" 2>/dev/null; then
  echo "ZAEHLER: $(wc -l < "$OUT/zaehler.txt" | tr -d ' ') Treffer"; fail zaehler
else
  rm -f "$OUT/zaehler.txt"
fi

# h. private data in the diff against the main session's branch (only file:line is written, never the found text)
BASE=${BASE_REF:-}
if [ -z "$BASE" ]; then
  for R in origin/claude/shopify-notification-signup-o5avym claude/shopify-notification-signup-o5avym HEAD; do
    if git rev-parse --verify -q "$R" > /dev/null 2>&1; then BASE=$R; break; fi
  done
fi
PRIV='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}|\b[0-9]{5} [A-ZÄÖÜ][a-zäöü]+|C:\\Users|shp(at|ss)_|IBAN|DE[0-9]{9}'
EXCL=':(exclude)azur/tools/check.sh :(exclude)azur/.cache :(exclude)azur/theme/files :(exclude)azur/theme/files.json :(exclude)azur/theme/assets/azur-room.js :(exclude)azur/theme/assets/azur-pdp.js :(exclude)azur/theme/assets/azur-room.css :(exclude)azur/theme/snippets/azur-room-data.liquid'
: > "$OUT/privat.txt"
# shellcheck disable=SC2086
git diff "$BASE" --unified=0 -- . $EXCL 2>/dev/null | awk '
  /^\+\+\+ /{ f=substr($0,7); next }
  /^@@/{ match($0,/\+[0-9]+/); n=substr($0,RSTART+1,RLENGTH-1)+0; next }
  /^\+/{ print f ":" n "\t" substr($0,2); n++ }' > "$OUT/.added.tsv"
# untracked files count as added, too
for F in $(git ls-files -o --exclude-standard -- azur ':(exclude)azur/.cache' ':(exclude)azur/tools/check.sh' 2>/dev/null); do
  [ -f "$F" ] && awk -v f="$F" '{ print f ":" NR "\t" $0 }' "$F" >> "$OUT/.added.tsv" 2>/dev/null
done
cut -f2- "$OUT/.added.tsv" | grep -nE "$PRIV" | while IFS=: read -r N REST; do
  case "$REST" in *kontakt@azurclothing.com*|*noreply@anthropic.com*) continue ;; esac
  # a line with only allowed addresses is fine; any other hit is written as file:line
  sed -n "${N}p" "$OUT/.added.tsv" | cut -f1
done > "$OUT/privat.txt"
rm -f "$OUT/.added.tsv"
if [ -s "$OUT/privat.txt" ]; then echo "PRIVAT: $(wc -l < "$OUT/privat.txt" | tr -d ' ') Treffer (siehe privat.txt)"; fail privat; fi

# i. status
git status --short > "$OUT/status.txt" 2>&1

# j. result
END=$(date +%s)
echo "(dauer $((END - START)) s)"
if [ -n "$FAILS" ]; then echo "CHECK FAIL ($FAILS)"; exit 1; fi
echo "CHECK PASS"
exit 0
