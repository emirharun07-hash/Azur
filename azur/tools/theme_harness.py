"""Local stand-in for the Shopify storefront, to test the room section before it goes into the draft theme.

    python3 azur/tools/theme_harness.py [port]      -> http://127.0.0.1:8770/

Renders sections/azur-room.liquid with python-liquid (Shopify filters stubbed), wraps it in the live theme's page
structure (the real announcement bar, overlay header, #inhalt, cart drawer) with the theme's CSS (azur/theme/assets/azur.css), serves the renders under /files/ with their Shopify Files names, and answers
POST /cart/add.js and POST /contact like Shopify does (enough for the room's cart and drop sign-up).
Round 10: below the room the player cards (sections/azur-cards.liquid), the real cart drawer (sections/cart-drawer.liquid,
also via ?sections=cart-drawer and the sections field of /cart/add.js) and the theme's own azur.js.
Round 12: the real header and footer (with the sign-up), and /collections/trikots and /products/<handle> as whole pages
(theme_pages.py). ?signup=ok|error shows the sign-up after sending.
"""
import http.server, json, os, re, socketserver, sys
from liquid import Environment, DictLoader
import theme_pages as pages

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
THEME = os.path.join(ROOT, 'theme')
PROTO = os.path.join(ROOT, 'prototype')
LIVE = os.path.join(ROOT, '.cache', 'theme_live')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8770

PRODUCTS = [  # as Shopify's Liquid product objects would show them (ids and handles from the shop)
    (10885924946259, 'frankfurt-trikot-azur-collection', 'Frankfurt 069 Trikot', 6499, 'frankfurt', [55081072722259, 55081072755027, 55081072787795, 55081072820563]),
    (10886281167187, 'berlin-trikot-azur-collection', 'Berlin 030 Trikot', 6499, 'berlin', [55083930026323, 55083930059091, 55083930091859, 55083930124627]),
    (10876882387283, 'brasilien-trikot-azur-collection', 'Brasilien Trikot', 5499, 'brasilien', [1, 2, 3, 4]),
    (10876882190675, 'deutschland-trikot-azur-collection', 'Deutschland Trikot', 5499, 'deutschland', [5, 6, 7, 8]),
    (10876882026835, 'turkei-trikot-azur-collection', 'Türkei Trikot', 5499, 'tuerkei', [9, 10, 11, 12]),
]


def product(pid, handle, title, price, img, vids):
    return {'id': pid, 'handle': handle, 'title': title, 'price': price, 'url': '/products/' + handle,
            'description': f'<p>{title}. Polokragen, Azur-Signatur auf der Brust.</p>',
            'featured_image': {'url': f'/proto/assets/products/{img}.webp', 'aspect_ratio': 0.9},
            'featured_media': {'url': f'/proto/assets/products/{img}.webp', 'alt': title}, 'media': [{'url': f'/proto/assets/products/{img}.webp', 'alt': title, 'media_type': 'image'}],
            'variants': [{'id': v, 'title': s, 'available': s != 'XL'} for v, s in zip(vids, ['S', 'M', 'L', 'XL'])]}


def render_section():
    src = open(os.path.join(THEME, 'sections', 'azur-room.liquid')).read()
    schema = json.loads(re.search(r'{% schema %}(.*?){% endschema %}', src, re.S).group(1))
    src = re.sub(r'{% schema %}.*?{% endschema %}', '', src, flags=re.S)
    env = Environment(loader=DictLoader({'azur-room-data': open(os.path.join(THEME, 'snippets', 'azur-room-data.liquid')).read()}))
    env.filters['asset_url'] = lambda v: '/theme/assets/' + v
    env.filters['file_url'] = lambda v: '/files/' + v + '?v=1'
    env.filters['json'] = lambda v: json.dumps(v, ensure_ascii=False)
    env.filters['stylesheet_tag'] = lambda v: f'<link href="{v}" rel="stylesheet" type="text/css" media="all" />'
    env.filters['image_url'] = lambda v, width=None: (v or {}).get('url', '')
    settings = {s['id']: s.get('default') for s in schema['settings'] if 'id' in s}
    for i, p in enumerate(PRODUCTS, 1): settings[f'product_{i}'] = product(*p)
    links = [{'title': t, 'url': u} for t, u in (('Berlin 030', '/collections/berlin'), ('Frankfurt 069', '/collections/frankfurt'), ('Shop', '/collections/all'), ('Über Azur', '/pages/ueber-uns'))]
    ctx = {'section': {'settings': settings, 'id': 'room', 'blocks': []}, 'shop': {'name': 'Azur', 'customer_accounts_enabled': True},
           'cart': {'currency': {'iso_code': 'EUR'}, 'item_count': len(Handler.cart)},
           'linklists': {'main-menu': {'links': links}}, 'routes': {'root_url': '/', 'account_url': '/account'},
           'settings': {'shipping_cost': 'in Deutschland 1,99 €, ab 90 € kostenlos'}}
    return env.from_string(src).render(**ctx)


FREE_FROM = 90


def snippet_env():
    """python-liquid with stand-ins for the theme snippets and Shopify filters the cards and the drawer use."""
    by_handle = {p[1]: p for p in PRODUCTS}
    codes = {'frankfurt': '069', 'berlin': '030', 'brasilien': 'BRA', 'deutschland': 'GER', 'tuerkei': 'TUR'}

    def label(handle):
        p = by_handle[handle]; name = p[2].replace(' Trikot', ''); return name
    snippets = {
        'product-field': "{% if field == 'code' %}{{ product.code }}{% else %}{{ product.label }}{% endif %}",
        'product-image': '<img class="{{ class }}" src="{{ product.featured_image.url }}" alt="" loading="lazy">',
        'price': '{{ amount | money }}',
        'shipping-line': 'Versand in Deutschland 1,99 €, ab 90 € kostenlos',
        'payment-types': 'PayPal, Karte',
    }
    env = Environment(loader=DictLoader(snippets))
    env.filters['money'] = lambda v: ('%.2f' % (int(v or 0) / 100)).replace('.', ',') + ' €'
    env.filters['image_url'] = lambda v, width=None: (v or {}).get('url', '') if isinstance(v, dict) else str(v or '')
    env.filters['image_tag'] = lambda v, **kw: f'<img src="{v}" alt="">'
    return env, label, codes


def cards_product(p):
    pid, handle, title, price, img, vids = p
    d = product(*p); d['label'] = title.replace(' Trikot', ''); d['code'] = {'frankfurt': '069', 'berlin': '030', 'brasilien': 'BRA', 'deutschland': 'GER', 'tuerkei': 'TUR'}[img]
    d['options'] = ['Größe']
    d['variants'] = [{'id': v, 'title': s, 'option1': s, 'available': s != 'XL'} for v, s in zip(vids, ['S', 'M', 'L', 'XL'])]
    return d


def render_cards(query=''):
    # the real snippets (product-field, product-image, price, signup-form) via theme_pages
    # Runde 15: only the national jerseys, like templates/index.json
    return pages.section('azur-cards', {'products': pages.PRODUCTS[2:]}, form=pages.signup_state(query))


def render_drawer():
    src = open(os.path.join(THEME, 'sections', 'cart-drawer.liquid')).read()
    src = re.sub(r'{% schema %}.*?{% endschema %}', '', src, flags=re.S)
    env, _, _ = snippet_env()
    by_vid = {v: p for p in PRODUCTS for v in p[5]}
    items, total = [], 0
    for it in Handler.cart:
        p = by_vid.get(int(it['id'])); q = int(it.get('quantity', 1))
        if not p: continue
        cp = cards_product(p); size = next(v['title'] for v in cp['variants'] if v['id'] == int(it['id']))
        items.append({'key': f"{it['id']}:x", 'url': cp['url'], 'image': cp['featured_image']['url'], 'product': cp, 'variant': {'option1': size}, 'quantity': q, 'final_line_price': p[3] * q})
        total += p[3] * q
    cart = {'item_count': sum(i['quantity'] for i in items), 'items': items, 'total_price': total}
    return env.from_string(src).render(cart=cart, settings={'free_shipping_threshold': FREE_FROM, 'tax_note': pages.SETTINGS['tax_note'], 'main_collection': {'url': '/collections/trikots'}},
                                       routes={'cart_url': '/cart'}, collections={'all': {'url': '/collections/all'}})


def render_bar():
    src = open(os.path.join(THEME, 'sections', 'announcement.liquid')).read()
    schema = json.loads(re.search(r'{% schema %}(.*?){% endschema %}', src, re.S).group(1))
    src = re.sub(r'{% schema %}.*?{% endschema %}', '', src, flags=re.S)
    env = Environment()
    env.filters['newline_to_br'] = lambda v: (v or '').replace('\n', '<br />\n')
    settings = {s['id']: s.get('default') or '' for s in schema['settings'] if 'id' in s}
    return env.from_string(src).render(section={'settings': settings}, settings={'shipping_cost': 'in Deutschland 1,99 €, ab 90 € kostenlos'},
                                       shop={'metafields': {'azur': {'announcement': {'value': ''}}}})


PAGE = """<!doctype html><html lang="de" class="js"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Harness</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Caveat:wght@500;700&family=Martian+Mono:wght@400;600&display=swap">
<style>@font-face{font-family:"Martian Mono";font-style:normal;font-weight:300 600;font-stretch:75% 112.5%;src:url(/theme/assets/azur-martian-mono.woff2) format("woff2")}</style>
<link rel="stylesheet" href="/theme/assets/azur.css">
<script>window.Shopify = { routes: { root: '/' } };</script>
</head><body class="template-index">
<div class="shopify-section section-bar">__BAR__</div>
<div class="shopify-section section-header" id="shopify-section-header">__HEADER__</div>
<main id="inhalt" tabindex="-1">
  <div class="shopify-section section-azur-room">__SECTION__</div>
  <div class="shopify-section section-azur-cards">__CARDS__</div>
</main>
<div class="shopify-section" id="shopify-section-footer">__FOOTER__</div>
<div class="shopify-section section-cart-drawer" id="shopify-section-cart-drawer">__DRAWER__</div>
<script src="/theme/assets/azur.js" defer></script>
</body></html>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    cart = []

    def translate_path(self, path):
        path = path.split('?')[0]
        if path.startswith('/theme/assets/azur-logo'): return os.path.join(PROTO, 'assets', 'brand', path[14:])
        if path == '/cart.js': return '/nonexistent'
        if path.startswith('/theme/'): return os.path.join(THEME, path[7:])
        if path.startswith('/proto/'): return os.path.join(PROTO, path[7:])
        if path.startswith('/live/'): return os.path.join(LIVE, path[6:])
        if path.startswith('/theme_live_assets/'): return os.path.join(PROTO, 'assets', 'brand', path[19:])
        if path.startswith('/files/'): return FILES.get(path[7:], '/nonexistent')
        return super().translate_path(path)

    def do_GET(self):
        if self.path.split('?')[0] == '/cart.js':      # what Shopify's cart.js answers (enough for count and total)
            total = sum(int(i.get('quantity', 1)) * 6499 for i in Handler.cart)
            body = json.dumps({'item_count': sum(int(i.get('quantity', 1)) for i in Handler.cart), 'total_price': total}).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers()
            self.wfile.write(body); return
        if self.path.split('?')[0] == '/' and 'sections=cart-drawer' in self.path:     # Section Rendering API
            body = json.dumps({'cart-drawer': render_drawer()}).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers()
            self.wfile.write(body); return
        route, _, query = self.path.partition('?')
        if route in ('/', '/index.html') or route.startswith('/collections/') or route.startswith('/products/'):
            cart = {'item_count': len(Handler.cart), 'currency': {'symbol': '€', 'iso_code': 'EUR'}}
            if route.startswith('/collections/'):
                page = pages.collection_page(query, render_drawer(), len(Handler.cart), route.split('/')[2])
            elif route.startswith('/products/'):
                page = pages.product_page(route.split('/')[2], query, render_drawer(), len(Handler.cart))
            else:
                t = {'name': 'index', 'suffix': ''}
                page = (PAGE.replace('__BAR__', render_bar()).replace('__SECTION__', render_section())
                        .replace('__HEADER__', pages.render_header(template=t, cart=cart))
                        .replace('__FOOTER__', pages.section('footer', template=t, form=pages.signup_state(query)))
                        .replace('__CARDS__', render_cards(query)).replace('__DRAWER__', render_drawer()))
            body = page.encode()
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(body))); self.end_headers()
            self.wfile.write(body); return
        return super().do_GET()

    def do_POST(self):
        n = int(self.headers.get('Content-Length') or 0); raw = self.rfile.read(n)
        if self.path.startswith('/cart/add.js'):
            req = json.loads(raw or b'{}'); items = req.get('items', [])
            Handler.cart += items
            out = {'items': items}
            if 'cart-drawer' in str(req.get('sections', '')): out['sections'] = {'cart-drawer': render_drawer()}
            body = json.dumps(out).encode(); self.send_response(200); self.send_header('Content-Type', 'application/json')
        elif self.path.startswith('/contact'):
            open(os.path.join(LIVE, 'last_contact_post.txt'), 'wb').write(raw)
            body = b'<html>ok</html>'; self.send_response(200); self.send_header('Content-Type', 'text/html')
        else:
            body = b'{}'; self.send_response(404)
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def log_message(self, *a): pass


def files_map():
    out = {}
    for e in json.load(open(os.path.join(THEME, 'files.json'))):
        u = e['url'].split('/azur/', 1)[1]
        from urllib.parse import unquote
        out[e['filename']] = os.path.join(ROOT, unquote(u))
    return out


FILES = files_map()
if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), Handler) as s:
        print(f'harness on http://127.0.0.1:{PORT}/', flush=True); s.serve_forever()
