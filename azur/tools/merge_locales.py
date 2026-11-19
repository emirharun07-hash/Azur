"""Merges the locale fragments of parallel work into the theme's locale files.

    python azur/tools/merge_locales.py            merge azur/theme/locales/_neu/<ID>.de.json -> de.default.json,
                                                  <ID>.en.json -> en.json, then delete the merged fragments
    python azur/tools/merge_locales.py --check    only check (nothing is written or deleted)
    --dir <locales folder>                        another folder than azur/theme/locales (for tests)

Rules: deep merge; an existing key is never overwritten. A key that exists with another value (in the target file
or in an earlier fragment) is a conflict: the script names it and stops without writing anything (exit 1).
The same key with the same value is fine. The leading /* … */ comment, indent 2 and the key order stay; new keys are
appended at the end of their object. The theme (theme_pages.py) already reads the fragments before they are merged.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOCALES = os.path.join(os.path.dirname(HERE), 'theme', 'locales')
NEU = os.path.join(LOCALES, '_neu')
TARGETS = {'de': 'de.default.json', 'en': 'en.json'}


def split(text):
    """(leading comment incl. its line break, data)"""
    m = re.match(r'\s*/\*.*?\*/\s*', text, re.S)
    head = m.group(0) if m else ''
    return head, json.loads(text[len(head):])


def dump(head, data):
    return head + json.dumps(data, ensure_ascii=False, indent=2) + '\n'


def merge(base, extra, path, conflicts, origin):
    for k, v in extra.items():
        key = f'{path}.{k}' if path else k
        if k not in base:
            base[k] = v
        elif isinstance(base[k], dict) and isinstance(v, dict):
            merge(base[k], v, key, conflicts, origin)
        elif base[k] != v:
            conflicts.append(f'{key} ({origin})')


def main(argv):
    global LOCALES, NEU
    check = '--check' in argv
    if '--dir' in argv:
        LOCALES = os.path.abspath(argv[argv.index('--dir') + 1])
        NEU = os.path.join(LOCALES, '_neu')
    frags = sorted(f for f in os.listdir(NEU) if f.endswith('.json')) if os.path.isdir(NEU) else []
    bad = [f for f in frags if not re.fullmatch(r'[\w.-]+\.(de|en)\.json', f)]
    if bad:
        print('Fragmente mit falschem Namen (erwartet <ID>.de.json oder <ID>.en.json): ' + ', '.join(bad))
        return 1
    errors, out, used = [], {}, []
    for loc, target in TARGETS.items():
        tpath = os.path.join(LOCALES, target)
        text = open(tpath, encoding='utf-8').read()
        try:
            head, data = split(text)
        except ValueError as err:
            errors.append(f'{target}: kein gültiges JSON ({err})')
            continue
        if dump(head, data) != text:
            print(f'Hinweis: {target} ist nicht im Format indent 2 / ensure_ascii=False; nach dem Mischen ist es das.')
        for f in (x for x in frags if x.endswith(f'.{loc}.json')):
            try:
                _, frag = split(open(os.path.join(NEU, f), encoding='utf-8').read())
            except ValueError as err:
                errors.append(f'{f}: kein gültiges JSON ({err})')
                continue
            conflicts = []
            merge(data, frag, '', conflicts, f)
            errors += [f'Konflikt {loc}: {c} gibt es schon mit anderem Wert' for c in conflicts]
            used.append(f)
        out[tpath] = dump(head, data)
    for e in errors:
        print(e)
    if errors:
        print('NICHTS GEMISCHT')
        return 1
    if check:
        print(f'OK: {len(frags)} Fragment(e), keine Konflikte (nur geprüft)')
        return 0
    if not frags:
        print('OK: keine Fragmente')
        return 0
    for tpath, text in out.items():
        with open(tpath, 'w', encoding='utf-8') as fh:
            fh.write(text)
    for f in used:
        os.remove(os.path.join(NEU, f))
    print(f'OK: {len(used)} Fragment(e) gemischt und gelöscht')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
