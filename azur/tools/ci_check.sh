#!/bin/sh
# AZUR: leichte Prüfung für GitHub Actions (ohne Browser).
#   sh azur/tools/ci_check.sh
# Env: AZUR_VENV (Python-venv, Standard /tmp/azur-ci-venv)
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE/../.." || exit 2
FAILS=""
fail() { FAILS="${FAILS:+$FAILS, }$1"; }

VENV=${AZUR_VENV:-/tmp/azur-ci-venv}
if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV" || { echo "venv fehlt"; exit 1; }
  "$VENV/bin/pip" install -q pillow "python-liquid==2.3.6" rjsmin || { echo "pip fehlgeschlagen"; exit 1; }
fi
PY=$VENV/bin/python

echo "== build"
if "$PY" azur/tools/build_artifact.py > /tmp/azur-ci-build.log 2>&1 && "$PY" azur/tools/build_theme.py >> /tmp/azur-ci-build.log 2>&1; then
  tail -1 /tmp/azur-ci-build.log
else
  tail -8 /tmp/azur-ci-build.log; fail build
fi

echo "== generierte Dateien aktuell?"
if [ -n "$(git status --porcelain azur/theme)" ]; then
  git status --short azur/theme | head -20
  echo "Generierte Dateien nicht aktuell: bitte build_theme.py laufen lassen und committen"
  fail generiert
fi

echo "== Vollstaendigkeit und JSON"
"$PY" - <<'PYEOF' || fail vollstaendig
import glob, json, os, re, sys

def load(f):
    t = open(f, encoding='utf-8').read()
    t = re.sub(r'^\s*/\*.*?\*/', '', t, count=1, flags=re.S)  # Shopify-Kopfkommentar
    return json.loads(t)
T = 'azur/theme'
bad = []
for f in sorted(glob.glob(T + '/templates/*.json')):
    try:
        d = load(f)
    except Exception as e:
        bad.append('JSON ungueltig: %s (%s)' % (f, e)); continue
    for k, s in (d.get('sections') or {}).items():
        t = s.get('type')
        if t and not os.path.exists('%s/sections/%s.liquid' % (T, t)):
            bad.append('Section fehlt: %s (in %s)' % (t, f))
for f in sorted(glob.glob(T + '/locales/*.json')):
    try:
        load(f)
    except Exception as e:
        bad.append('JSON ungueltig: %s (%s)' % (f, e))
rx = re.compile(r"\{%-?\s*render\s+'([^']+)'")
for f in sorted(glob.glob(T + '/sections/*.liquid') + glob.glob(T + '/snippets/*.liquid') + glob.glob(T + '/layout/*.liquid')):
    for n in rx.findall(open(f, encoding='utf-8').read()):
        if not os.path.exists('%s/snippets/%s.liquid' % (T, n)):
            bad.append('Snippet fehlt: %s (in %s)' % (n, f))
for b in bad:
    print(b)
print('Vollstaendigkeit: %s' % ('FAIL' if bad else 'ok'))
sys.exit(1 if bad else 0)
PYEOF

echo "== feste Pfade in Werkzeugen"
if git grep -n "/home/user" -- ':!azur/tools/ci_check.sh' 'azur/tools/*.sh' 'azur/tools/*.cjs' 'azur/tools/*.py'; then fail pfade; fi

echo "== Zaehler-Verbot"
if grep -rniE "[0-9x}] ?/ ?50|[0-9x}] von 50|noch [0-9]+ (von|stück)" azur/prototype/js azur/theme/sections azur/theme/snippets azur/theme/templates; then fail zaehler; fi

if [ -n "$FAILS" ]; then echo "CI CHECK FAIL ($FAILS)"; exit 1; fi
echo "CI CHECK PASS"
