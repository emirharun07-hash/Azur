"""AZUR test shop (Runde 33 / H1): a local stand-in for the Shopify storefront that renders azur/theme as it is.

    python azur/tools/theme_harness.py [port]          -> http://127.0.0.1:8770/   (python-liquid 2.3.6)

The rendering is in theme_pages.py (templates/*.json in the layout, schema defaults, translations, stand-ins).

Pages      /   /collections/<handle>   /products/<handle>[?variant=<id>]   /password   /cart   /pages/<handle>
           /search   /checkout (stand-in)   unknown handles -> templates/404.json with status 404
Query      ?view=<suffix>     templates/<name>.<suffix>.json (products and pages; pages also use their template_suffix)
           ?locale=en or /en/<path>   English texts (locales/en.json + locales/_neu/*.en.json)
           ?fx=<NAME>         test data tools/fixtures/<NAME>.json, kept in the cookie azur_fx; ?fx= (empty) clears it
           ?signup=ok|error   ?customer_posted=true   ?contact_posted=true   ?pw=error   form states
           ?sections=a,b      Section Rendering API (JSON) on any page
Cart       GET /cart.js   POST /cart/add.js /cart/change.js /cart/update.js /cart/clear.js (JSON or form, "sections"
           in the answer when asked)   POST /cart/add, /cart (forms, redirect)   GET /cart/change?line=&quantity=, /cart/clear
           One cart per fixture, started from the fixture's "cart". Stock is checked like Shopify (422 + description).
Forms      POST /contact -> azur/.cache/theme_live/last_contact_post.txt, back with ?customer_posted=true
           POST /password -> /
Files      /theme/<path>  /proto/<path>  /files/<Shopify file name> (via theme/files.json)  /live/<path>
A request never answers 500: whatever fails is written into the page as "HARNESS: <reason>" and logged here.
"""
import http.server, json, os, re, socketserver, sys, threading, traceback
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, quote, unquote, urlencode

import theme_pages as pages

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
THEME = os.path.join(ROOT, 'theme')
PROTO = os.path.join(ROOT, 'prototype')
LIVE = os.path.join(ROOT, '.cache', 'theme_live')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
LOCK = threading.Lock()

# assets the repo does not have, served from the prototype (real files, no new pictures)
ASSET_FALLBACK = {'campaign-frankfurt.webp': os.path.join(PROTO, 'assets', 'products', 'frankfurt.webp'),
                  'campaign-detail.jpg': os.path.join(PROTO, 'assets', 'products', 'frankfurt.webp'),
                  'share.jpg': os.path.join(PROTO, 'assets', 'products', 'frankfurt.webp')}
TYPES = {'.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
         '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
         '.mp4': 'video/mp4', '.webm': 'video/webm', '.html': 'text/html; charset=utf-8', '.glb': 'model/gltf-binary',
         '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.avif': 'image/avif', '.gif': 'image/gif'}


def files_map():
    """Shopify file name -> local path (upload_files.py builds the same map)"""
    out = {}
    try:
        for e in json.load(open(os.path.join(THEME, 'files.json'))):
            u = e['url'].split('/azur/', 1)[1]
            out[e['filename']] = os.path.join(ROOT, unquote(u))
    except (OSError, ValueError, KeyError, IndexError) as err:
        print(f'HARNESS: files.json: {err}', file=sys.stderr, flush=True)
    return out


FILES = files_map()


class Handler(http.server.BaseHTTPRequestHandler):
    carts = {}          # fixture name@mtime ('' = none) -> [{'id': variant id, 'quantity': n}] (a changed fixture starts afresh)
    protocol_version = 'HTTP/1.0'

    # ------------------------------------------------------------ request state
    def parse(self):
        raw_path, _, query = self.path.partition('?')
        path = unquote(raw_path)
        q = parse_qs(query, keep_blank_values=True)
        locale = 'de'
        if path == '/en' or path.startswith('/en/'):
            locale, path = 'en', path[3:] or '/'
        if q.get('locale', [''])[0] in pages.LOCALES:
            locale = q['locale'][0]
        cookie = SimpleCookie(self.headers.get('Cookie') or '')
        fx = cookie['azur_fx'].value if 'azur_fx' in cookie else ''
        self.set_fx = None
        if 'fx' in q:
            fx = q['fx'][0]
            self.set_fx = fx
        self.route, self.query, self.q, self.locale, self.fx = path, query, q, locale, fx
        self.fixture = {}
        self.fx_error = ''
        if fx:
            try:
                self.fixture = pages.load_fixture(fx)
            except Exception as err:  # noqa: BLE001
                self.fx_error = pages.harness_error(f'fixture {fx}', err)
        self.store = pages.Store(self.fixture)

    def lines(self):
        fpath = os.path.join(pages.FIXTURES, self.fx + '.json')
        key = f'{self.fx}@{os.path.getmtime(fpath)}' if self.fx and not self.fx_error and os.path.exists(fpath) else self.fx
        with LOCK:
            if key not in Handler.carts:
                start = []
                for ln in self.fixture.get('cart') or []:
                    p = self.store.by_handle.get(ln.get('handle'))
                    v = next((v for v in (p or {}).get('variants', []) if v['title'] == ln.get('size')), None)
                    if v:
                        start.append({'id': v['id'], 'quantity': int(ln.get('qty', 1))})
                    else:
                        print(f'HARNESS: fixture cart line {ln} not found', file=sys.stderr, flush=True)
                Handler.carts[key] = start
            return Handler.carts[key]

    # ------------------------------------------------------------ answers
    def send(self, code, body, ctype='text/html; charset=utf-8', headers=None):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store' if not ctype.startswith(('image/', 'font/', 'video/')) else 'max-age=60')
        if self.set_fx is not None:
            self.send_header('Set-Cookie', f'azur_fx={self.set_fx}; Path=/' + ('' if self.set_fx else '; Max-Age=0'))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def send_json(self, data, code=200):
        self.send(code, json.dumps(data, ensure_ascii=False), 'application/json; charset=utf-8')

    def redirect(self, to):
        self.send(302, b'', 'text/plain', {'Location': to})

    def prefix(self):
        return '' if self.locale == 'de' else '/' + self.locale

    def page(self, name, suffix='', extra=None, code=200):
        html = pages.render_page(self.store, self.lines(), name, suffix, self.route, self.query, self.locale, extra)
        if self.fx_error:
            note = f'<div style="background:#fee;padding:4px">{self.fx_error}</div>'
            html = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + note, html, count=1) if '<body' in html else note + html
        self.send(code, html)

    def not_found(self):
        self.page('404', code=404)

    def sections(self, ids, name='index', suffix='', extra=None):
        out = pages.render_sections(self.store, self.lines(), ids, name, suffix, self.route, self.query, self.locale)
        self.send_json(out)

    # ------------------------------------------------------------ routes
    def page_for(self, route):
        """(template name, suffix, extra globals) for a storefront path, or None"""
        parts = [p for p in route.split('/') if p]
        view = self.q.get('view', [''])[0]
        if not parts:
            return 'index', '', {}
        if parts[0] == 'collections':
            if len(parts) == 1:
                return 'list-collections', '', {}
            c = self.store.collections.get(parts[1])
            if not c:
                return None
            if len(parts) > 3 and parts[2] == 'products':
                parts = ['products', parts[3]]
            else:
                return 'collection', view or c.get('template_suffix', ''), {'collection': c, 'page_title': c['title']}
        if parts[0] == 'products' and len(parts) > 1:
            p = self.store.by_handle.get(parts[1])
            if not p:
                return None
            p = dict(p)
            vid = self.q.get('variant', [''])[0]
            sel = next((v for v in p['variants'] if str(v['id']) == vid), None)
            if sel:
                p['selected_variant'] = sel
                p['selected_or_first_available_variant'] = sel
                p['variants'] = [dict(v, selected=v is sel) for v in p['variants']]
            return 'product', view or p.get('template_suffix', ''), {'product': p, 'page_title': p['title'],
                                                                     'page_description': re.sub(r'<[^>]+>', '', p['description'])}
        if parts[0] == 'pages' and len(parts) > 1:
            pg = self.store.pages.get(parts[1])
            if not pg:
                return None
            return 'page', view or pg.get('template_suffix', ''), {'page': pg, 'page_title': pg['title']}
        if parts == ['cart']:
            return 'cart', view, {'page_title': 'Warenkorb'}
        if parts == ['password']:
            return 'password', '', {}
        if parts == ['search']:
            terms = self.q.get('q', [''])[0]
            hits = [p for p in self.store.products if terms and terms.lower() in p['title'].lower()]
            return 'search', '', {'search': {'performed': bool(terms), 'terms': terms, 'results': hits, 'results_count': len(hits), 'types': ['product']}}
        return None

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            self.parse()
            self.get()
        except BrokenPipeError:
            pass
        except Exception as err:  # noqa: BLE001  (never a 500)
            traceback.print_exc()
            try:
                self.send(200, f'<!doctype html><meta charset="utf-8"><pre>{pages.harness_error(self.path, err)}</pre>')
            except Exception:  # noqa: BLE001
                pass

    def do_POST(self):
        try:
            self.parse()
            n = int(self.headers.get('Content-Length') or 0)
            self.body = self.rfile.read(n)
            self.post()
        except BrokenPipeError:
            pass
        except Exception as err:  # noqa: BLE001
            traceback.print_exc()
            try:
                self.send_json({'status': 422, 'message': 'HARNESS', 'description': pages.harness_error(self.path, err)}, 422)
            except Exception:  # noqa: BLE001
                pass

    def get(self):
        r = self.route
        if r.startswith(('/theme/', '/proto/', '/files/', '/live/', '/theme_live_assets/')) or r in ('/favicon.ico',):
            return self.static(r)
        if r == '/cart.js':
            return self.send_json(self.store.cart_json(self.lines()))
        if r == '/cart/change':
            return self.change_line(self.q.get('line', ['0'])[0], self.q.get('quantity', ['0'])[0], redirect=True)
        if r == '/cart/clear':
            self.lines().clear()
            return self.redirect(self.prefix() + '/cart')
        if r == '/checkout' or r.startswith('/checkouts'):
            return self.send(200, '<!doctype html><meta charset="utf-8"><title>Kasse (Stellvertreter)</title>'
                                  '<p>Kasse von Shopify (Stellvertreter im Test-Shop).</p><p><a href="/cart">Zurück zum Warenkorb</a></p>')
        target = self.page_for(r)
        if 'sections' in self.q:
            ids = [s for s in self.q['sections'][0].split(',') if s]
            name, suffix, extra = target or ('index', '', {})
            return self.sections(ids, name, suffix, extra)
        if target is None:
            return self.not_found()
        name, suffix, extra = target
        self.page(name, suffix, extra)

    # ------------------------------------------------------------ cart
    def form(self):
        ctype = self.headers.get('Content-Type') or ''
        if 'json' in ctype:
            return json.loads(self.body or b'{}')
        if 'multipart/form-data' in ctype:
            import cgi  # noqa: PLC0415  (python 3.11 still has it)
            env = {'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': ctype, 'CONTENT_LENGTH': str(len(self.body))}
            import io  # noqa: PLC0415
            fs = cgi.FieldStorage(fp=io.BytesIO(self.body), environ=env, keep_blank_values=True)
            return {k: fs.getfirst(k) for k in fs.keys()}
        return {k: v[0] for k, v in parse_qs(self.body.decode('utf-8', 'replace'), keep_blank_values=True).items()}

    def sections_for(self, req):
        want = req.get('sections')
        if not want:
            return None
        ids = want if isinstance(want, list) else [s for s in str(want).split(',') if s]
        return pages.render_sections(self.store, self.lines(), ids, 'index', '', req.get('sections_url') or '/', '', self.locale)

    def error(self, msg, code=422):
        self.send_json({'status': code, 'message': 'Cart Error', 'description': msg}, code)

    def add(self, req):
        items = req.get('items') or [{'id': req.get('id'), 'quantity': req.get('quantity', 1)}]
        lines = self.lines()
        added = []
        for it in items:
            try:
                vid, qty = int(it.get('id')), int(it.get('quantity') or 1)
            except (TypeError, ValueError):
                return self.error('Ungültige Variante.', 400)
            hit = self.store.by_variant.get(vid)
            if not hit:
                return self.error('Produkt nicht gefunden.', 404)
            p, v = hit
            have = next((ln for ln in lines if ln['id'] == vid), None)
            total = qty + (have['quantity'] if have else 0)
            if not v['available']:
                return self.error(f"{p['title']} - {v['title']} ist ausverkauft.")
            if total > v['inventory_quantity']:
                return self.error(f"Du kannst nur {v['inventory_quantity']} Stück von {p['title']} - {v['title']} in den Warenkorb legen.")
            with LOCK:
                if have:
                    have['quantity'] = total
                else:
                    lines.append({'id': vid, 'quantity': qty})
            added.append({'id': vid, 'quantity': qty})
        return added

    def change_line(self, line, quantity, key=None, redirect=False):
        lines = self.lines()
        try:
            qty = int(quantity)
        except (TypeError, ValueError):
            qty = 0
        idx = None
        if key is not None:
            vid = str(key).split(':')[0]
            idx = next((i for i, ln in enumerate(lines) if str(ln['id']) == vid), None)
        elif str(line).isdigit() and 0 < int(line) <= len(lines):
            idx = int(line) - 1
        if idx is not None:
            hit = self.store.by_variant.get(lines[idx]['id'])
            if hit and qty > hit[1]['inventory_quantity']:
                qty = hit[1]['inventory_quantity']
            with LOCK:
                if qty <= 0:
                    lines.pop(idx)
                else:
                    lines[idx]['quantity'] = qty
        if redirect:
            return self.redirect(self.prefix() + '/cart')
        return idx is not None

    def post(self):
        r = self.route
        if r in ('/cart/add.js', '/cart/add'):
            req = self.form()
            added = self.add(req)
            if added is None:
                return
            if r == '/cart/add':
                return self.redirect(self.prefix() + '/cart')
            c = self.store.cart_json(self.lines())
            items = [i for i in c['items'] if any(a['id'] == i['id'] for a in added)]
            out = items[0] if len(items) == 1 and not req.get('items') else {'items': items}
            secs = self.sections_for(req)
            if secs is not None:
                out['sections'] = secs
            return self.send_json(out)
        if r in ('/cart/change.js', '/cart/change'):
            req = self.form()
            self.change_line(req.get('line'), req.get('quantity', 0), key=req.get('id') if req.get('id') and not req.get('line') else None)
            if r == '/cart/change':
                return self.redirect(self.prefix() + '/cart')
            out = self.store.cart_json(self.lines())
            secs = self.sections_for(req)
            if secs is not None:
                out['sections'] = secs
            return self.send_json(out)
        if r in ('/cart/update.js', '/cart/update', '/cart'):
            req = self.form()
            upd = req.get('updates') or {}
            if not upd:  # form fields updates[<key>] / updates[]
                upd = {k[8:-1]: v for k, v in req.items() if k.startswith('updates[') and k.endswith(']')}
            for k, v in (upd.items() if isinstance(upd, dict) else enumerate(upd, 1)):
                if isinstance(k, int):
                    self.change_line(k, v)
                else:
                    self.change_line(None, v, key=k)
            if r != '/cart/update.js':
                return self.redirect('/checkout' if 'checkout' in req else self.prefix() + '/cart')
            out = self.store.cart_json(self.lines())
            secs = self.sections_for(req)
            if secs is not None:
                out['sections'] = secs
            return self.send_json(out)
        if r in ('/cart/clear.js', '/cart/clear'):
            self.lines().clear()
            return self.send_json(self.store.cart_json(self.lines())) if r.endswith('.js') else self.redirect(self.prefix() + '/cart')
        if r == '/contact':
            os.makedirs(LIVE, exist_ok=True)
            open(os.path.join(LIVE, 'last_contact_post.txt'), 'wb').write(self.body)
            req = self.form()
            back = (self.headers.get('Referer') or self.prefix() + '/').split('#')[0].split('//', 1)[-1]
            back = '/' + back.split('/', 1)[1] if '/' in back else '/'
            sep = '&' if '?' in back else '?'
            flag = 'contact_posted=true' if req.get('form_type') == 'contact' else 'customer_posted=true'
            return self.redirect(back + sep + flag)
        if r == '/password':
            return self.redirect(self.prefix() + '/')
        self.error('Not found', 404)

    # ------------------------------------------------------------ files
    def static(self, r):
        path = None
        if r.startswith('/theme/assets/'):
            name = r[len('/theme/assets/'):]
            path = os.path.join(THEME, 'assets', name)
            if not os.path.exists(path):
                if name.startswith('azur-logo'):
                    path = os.path.join(PROTO, 'assets', 'brand', name)
                elif name in ASSET_FALLBACK:
                    path = ASSET_FALLBACK[name]
        elif r.startswith('/theme/'):
            path = os.path.join(THEME, r[7:])
        elif r.startswith('/proto/'):
            path = os.path.join(PROTO, r[7:])
        elif r.startswith('/live/'):
            path = os.path.join(LIVE, r[6:])
        elif r.startswith('/theme_live_assets/'):
            path = os.path.join(PROTO, 'assets', 'brand', r[19:])
        elif r.startswith('/files/'):
            path = FILES.get(r[7:])
        if path:
            real = os.path.realpath(path)
            if not real.startswith(os.path.realpath(ROOT) + os.sep):
                path = None
        if not path or not os.path.isfile(path):
            return self.send(404, b'not found', 'text/plain')
        ext = os.path.splitext(path)[1].lower()
        with open(path, 'rb') as fh:
            self.send(200, fh.read(), TYPES.get(ext, 'application/octet-stream'))

    def log_message(self, fmt, *a):
        if a and str(a[1]).startswith(('4', '5')) and str(a[1]) != '404':
            sys.stderr.write('%s %s\n' % (self.address_string(), fmt % a))


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    with Server(('127.0.0.1', PORT), Handler) as s:
        print(f'harness on http://127.0.0.1:{PORT}/', flush=True)
        s.serve_forever()
