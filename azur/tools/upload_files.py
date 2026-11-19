#!/usr/bin/env python3
"""Plan fuer den Upload der Theme-Dateien (files.json) nach Shopify Files.

--dry-run (Standard): Tabelle + Summen, schreibt azur/.cache/upload_plan.json. Kein Netz.
--upload: laedt NICHTS hoch (Haupt-Session macht das, siehe UPLOAD-FILES.md). Exit 2.
Keine Zugangsdaten, kein Token.
"""
import argparse, json, mimetypes, os, sys
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # .../azur
THEME = os.path.join(ROOT, 'theme')
CACHE = os.path.join(ROOT, '.cache')
MIME = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.exr': 'image/x-exr'}


def files_map():  # gleiche Regel wie theme_harness.files_map()
    out = {}
    for e in json.load(open(os.path.join(THEME, 'files.json'))):
        u = e['url'].split('/azur/', 1)[1]
        out[e['filename']] = os.path.join(ROOT, unquote(u))
    return out


def human(n):
    for u in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or u == 'GB':
            return f'{n:.0f} B' if u == 'B' else f'{n:.1f} {u}'
        n /= 1024


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group()
    g.add_argument('--dry-run', action='store_true', help='Standard')
    g.add_argument('--upload', action='store_true')
    a = ap.parse_args()
    if a.upload:
        print('Hochladen macht die Haupt-Session. Dieses Skript lädt nichts hoch.')
        sys.exit(2)
    rows, total, missing = [], 0, 0
    for name, path in files_map().items():
        ok = os.path.isfile(path)
        size = os.path.getsize(path) if ok else 0
        ext = os.path.splitext(name)[1].lower()
        mime = MIME.get(ext) or mimetypes.guess_type(name)[0] or 'application/octet-stream'
        total += size
        missing += (not ok)
        rows.append({'filename': name, 'local': os.path.relpath(path, ROOT), 'exists': ok, 'size': size,
                     'mimeType': mime, 'action': 'würde hochladen' if ok else 'FEHLT lokal'})
    w = max([len(r['filename']) for r in rows] + [8])
    print(f"{'Dateiname':<{w}} | lokal | {'Größe':>9} | {'MIME':<16} | Aktion")
    for r in rows:
        print(f"{r['filename']:<{w}} | {'ja  ' if r['exists'] else 'NEIN'}  | {human(r['size']):>9} | {r['mimeType']:<16} | {r['action']}")
    print(f"\nDateien: {len(rows)} · vorhanden: {len(rows)-missing} · fehlend: {missing} · Gesamtgröße: {human(total)} ({total} Bytes)")
    os.makedirs(CACHE, exist_ok=True)
    json.dump({'files': rows, 'count': len(rows), 'missing': missing, 'total_bytes': total},
              open(os.path.join(CACHE, 'upload_plan.json'), 'w'), indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
