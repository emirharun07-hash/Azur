"""Whole theme pages for the local harness (Runde 12): the real header, footer with the sign-up, the shop (collection)
and the product page, rendered from azur/theme with python-liquid and the theme's own snippets.

Shopify-only tags are rewritten before rendering ({% form %} becomes a plain <form>, {% paginate %} is dropped,
form.posted_successfully? reads as form.ok), Shopify filters are small stand-ins, and the shop's data are the live
settings (config/settings_data.json values) and the five jerseys. Used by theme_harness.py:

    /                          room, player cards, footer
    /collections/trikots       the shop
    /products/<handle>         a product page
    ?signup=ok | ?signup=error the sign-up form after sending (success or error state)
"""
import html, json, os, re

from liquid import BaseLoader, Environment
from liquid.loader import TemplateSource

HERE = os.path.dirname(os.path.abspath(__file__))
THEME = os.path.join(os.path.dirname(HERE), 'theme')

# the live theme settings (config/settings_data.json "current") plus the schema defaults the shop leaves unset
SETTINGS = {
    'shipping_cost': 'in Deutschland 1,99 €, ab 90 € kostenlos',
    'support_email': 'kontakt@azurclothing.com',
    'tax_note': 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    'returns_note': '14 Tage Rückgabe, kostenloser Rückversand',
    'free_shipping_threshold': 90,
    'shipping_page_handle': 'versand-widerrufsrecht',
    'legal_pages': 'contact,impressum,agb,datenschutzerklarung,versand-widerrufsrecht',
    'filter_sizes': 'S,M,L,XL',
    'size_chart': '',
    'delivery_days': '',
    'product_meta': ('berlin-trikot-azur-collection | 030 | ber | Schwarz / Creme / Bordeaux |\n'
                     'frankfurt-trikot-azur-collection | 069 | ffm | Creme / Dunkelgrün / Gold |\n'
                     'turkei-trikot-azur-collection | TUR | tur | Rot / Weiß | Kökler. Birlik. Azim. Gelecek.\n'
                     'deutschland-trikot-azur-collection | GER | ger | Weiß / Schwarz |\n'
                     'brasilien-trikot-azur-collection | BRA | bra | Gelb / Grün |'),
}

JERSEYS = [  # handle, title, price (cents), image key, variant ids
    ('frankfurt-trikot-azur-collection', 'Frankfurt 069 Trikot', 6499, 'frankfurt', [55081072722259, 55081072755027, 55081072787795, 55081072820563]),
    ('berlin-trikot-azur-collection', 'Berlin 030 Trikot', 6499, 'berlin', [55083930026323, 55083930059091, 55083930091859, 55083930124627]),
    ('brasilien-trikot-azur-collection', 'Brasilien Trikot', 5499, 'brasilien', [1, 2, 3, 4]),
    ('deutschland-trikot-azur-collection', 'Deutschland Trikot', 5499, 'deutschland', [5, 6, 7, 8]),
    ('turkei-trikot-azur-collection', 'Türkei Trikot', 5499, 'tuerkei', [9, 10, 11, 12]),
]


def media(img, alt):
    return {'media_type': 'image', 'alt': alt, 'url': f'/proto/assets/products/{img}.webp', 'aspect_ratio': 0.9}


def product(handle, title, price, img, vids):
    variants = [{'id': v, 'title': s, 'option1': s, 'available': s != 'XL', 'price': price} for v, s in zip(vids, ['S', 'M', 'L', 'XL'])]
    front = media(img, f'{title} Vorderseite')
    back = media(img, f'{title} Rückseite')   # stand-in for a second photo (gallery arrows and dots)
    return {'id': vids[0] * 7, 'handle': handle, 'title': title, 'price': price, 'url': '/products/' + handle, 'available': True,
            'description': f'<p>{title}. Polokragen, Azur-Signatur auf der Brust.</p>', 'featured_image': front, 'featured_media': front,
            'media': [front, back], 'images': [front, back], 'options': ['Größe'], 'variants': variants, 'selected_variant': None,
            'selected_or_first_available_variant': variants[0], 'collections': [{'handle': 'trikots'}],
            'metafields': {'custom': {}}, 'tags': []}


PRODUCTS = [product(*j) for j in JERSEYS]
for i, p in enumerate(PRODUCTS):
    p['collections'] = [{'handle': 'trikots'}, {'handle': 'staedtetrikots' if i < 2 else 'nationaltrikots'}]
BY_HANDLE = {p['handle']: p for p in PRODUCTS}


def preprocess(src):
    src = re.sub(r'{% schema %}.*?{% endschema %}', '', src, flags=re.S)
    src = src.replace('form.posted_successfully?', 'form.ok')
    # {% form 'customer', id: x, class: 'y' %} -> <form>, keeping the id and class expressions
    def form_open(m):
        args = m.group(2)
        fid = re.search(r"id:\s*([\w.'\"-]+)", args); cls = re.search(r"class:\s*'([^']*)'", args)
        out = '<form method="post" action="/contact"'
        if fid: out += ' id="{{ ' + fid.group(1) + ' }}"'
        if cls: out += f' class="{cls.group(1)}"'
        if "data-buy" in args: out += ' data-buy'
        return out + '>'
    src = re.sub(r"{%-?\s*form\s+'(\w+)'(.*?)-?%}", form_open, src)
    src = re.sub(r'{%-?\s*endform\s*-?%}', '</form>', src)
    src = re.sub(r'{%-?\s*paginate .*? -?%}', '', src)
    src = re.sub(r'{%-?\s*endpaginate\s*-?%}', '', src)
    return src


class ThemeLoader(BaseLoader):
    def get_source(self, env, template_name, *, context=None, **kwargs):
        path = os.path.join(THEME, 'snippets', template_name + '.liquid')
        return TemplateSource(preprocess(open(path, encoding='utf-8').read()), path, None, None)


def money(v):
    return ('%.2f' % (int(v or 0) / 100)).replace('.', ',')


def image_tag(url, **kw):
    attrs = ''.join(f' {k}="{html.escape(str(v))}"' for k, v in kw.items() if k in ('class', 'alt', 'loading'))
    if 'alt' not in kw: attrs += ' alt=""'
    return f'<img src="{url}"{attrs}>'


def env():
    e = Environment(loader=ThemeLoader())
    e.filters['asset_url'] = lambda v: '/theme/assets/' + v
    e.filters['file_url'] = lambda v: '/files/' + v
    e.filters['json'] = lambda v: json.dumps(v, ensure_ascii=False)
    e.filters['stylesheet_tag'] = lambda v: f'<link href="{v}" rel="stylesheet">'
    e.filters['image_url'] = lambda v, width=None: (v or {}).get('url', '') if isinstance(v, dict) else str(v or '')
    e.filters['image_tag'] = image_tag
    e.filters['money_without_currency'] = money
    e.filters['money'] = lambda v: money(v) + ' €'
    e.filters['handleize'] = lambda v: re.sub(r'[^a-z0-9]+', '-', str(v).lower()).strip('-')
    e.filters['placeholder_svg_tag'] = lambda v, cls='': f'<svg class="{cls}"></svg>'
    e.filters['default_pagination'] = lambda v, **kw: ''
    e.filters['structured_data'] = lambda v: ''
    e.filters['newline_to_br'] = lambda v: str(v or '').replace('\n', '<br />\n')
    return e


ENV = env()


def ctx(**extra):
    pages = {h: {'url': f'/pages/{h}', 'title': t} for h, t in (('contact', 'Kontakt'), ('impressum', 'Impressum'), ('agb', 'AGB'),
             ('datenschutzerklarung', 'Datenschutzerklärung'), ('versand-widerrufsrecht', 'Versand und Widerruf'), ('ueber-azur', 'Über Azur'))}
    trikots = {'handle': 'trikots', 'url': '/collections/trikots', 'title': 'Trikots', 'products': PRODUCTS, 'products_count': len(PRODUCTS), 'description': ''}
    national = {'handle': 'nationaltrikots', 'url': '/collections/nationaltrikots', 'title': 'Nationaltrikots', 'products': PRODUCTS[2:], 'products_count': 3}
    cities = {'handle': 'staedtetrikots', 'url': '/collections/staedtetrikots', 'title': 'Städtetrikots', 'products': PRODUCTS[:2], 'products_count': 2}
    settings = dict(SETTINGS, main_collection=trikots, nav_collection=national, about_page=pages['ueber-azur'],
                    feature_product_1=BY_HANDLE['berlin-trikot-azur-collection'], feature_product_2=BY_HANDLE['frankfurt-trikot-azur-collection'])
    c = {'settings': settings, 'pages': pages, 'collections': {'all': trikots, 'trikots': trikots, 'staedtetrikots': cities, 'nationaltrikots': national},
         'shop': {'name': 'Azur', 'customer_accounts_enabled': True, 'enabled_payment_types': ['paypal', 'visa', 'master'],
                  'privacy_policy': {'url': '/policies/privacy-policy'}, 'policies': [], 'metafields': {'azur': {'announcement': {'value': ''}}}},
         'routes': {'root_url': '/', 'search_url': '/search', 'account_url': '/account', 'cart_url': '/cart', 'cart_add_url': '/cart/add'},
         'cart': {'item_count': 0, 'currency': {'symbol': '€', 'iso_code': 'EUR'}, 'total_price': 0, 'items': []},
         'request': {'design_mode': False}, 'template': {'name': 'index', 'suffix': ''}, 'form': {'ok': False, 'errors': None}}
    c.update(extra)
    return c


def section(name, settings=None, **extra):
    src = open(os.path.join(THEME, 'sections', name + '.liquid'), encoding='utf-8').read()
    m = re.search(r'{% schema %}(.*?){% endschema %}', src, re.S)
    schema = json.loads(m.group(1)) if m else {'settings': []}
    s = {x['id']: x.get('default', '') for x in schema.get('settings', []) if 'id' in x}   # Liquid: unset = blank
    s.update(settings or {})
    c = ctx(**extra); c['section'] = {'settings': s, 'id': name, 'blocks': []}
    return ENV.from_string(preprocess(src)).render(**c)


class FormErrors(list):
    """Shopify's form.errors: iterates over the field names, .messages and .translated_fields map them to text"""
    def __init__(self, fields):
        super().__init__(f for f, _, _ in fields)
        self.maps = {'messages': {f: m for f, _, m in fields}, 'translated_fields': {f: t for f, t, _ in fields}}

    def __getitem__(self, key):
        return self.maps[key] if isinstance(key, str) else super().__getitem__(key)


def signup_state(query):
    if 'signup=ok' in query: return {'ok': True, 'errors': None}
    if 'signup=error' in query: return {'ok': False, 'errors': FormErrors([('email', 'E-Mail', 'ist ungültig.')])}
    return {'ok': False, 'errors': None}


def render_header(**page):
    return section('header', **dict({'collection': {'handle': ''}, 'product': None}, **page))


def chrome(template, body, query='', cart_count=0, drawer='', **page):
    """bar, header, page body, footer and cart drawer, like layout/theme.liquid"""
    form = signup_state(query)
    cart = dict(ctx()['cart'], item_count=cart_count)
    t = {'name': template, 'suffix': ''}
    bar = section('announcement', template=t)
    header = render_header(template=t, cart=cart, **page)
    footer = section('footer', template=t, form=form)
    return f"""<!doctype html><html lang="de" class="js"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Harness {template}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Caveat:wght@500;700&display=swap">
<style>@font-face{{font-family:"Martian Mono";font-style:normal;font-weight:300 600;font-stretch:75% 112.5%;src:url(/theme/assets/azur-martian-mono.woff2) format("woff2")}}</style>
<link rel="stylesheet" href="/theme/assets/azur.css">
<script>window.Shopify = {{ routes: {{ root: '/' }} }};</script>
</head><body class="template-{template}">
<div class="shopify-section section-bar" id="shopify-section-announcement">{bar}</div>
<div class="shopify-section section-header" id="shopify-section-header">{header}</div>
<main id="inhalt" tabindex="-1">{body}</main>
<div class="shopify-section" id="shopify-section-footer">{footer}</div>
<div class="shopify-section section-cart-drawer" id="shopify-section-cart-drawer">{drawer}</div>
<script src="/theme/assets/azur.js" defer></script>
</body></html>"""


def collection_page(query='', drawer='', cart_count=0, handle='trikots'):
    coll = ctx()['collections'].get(handle) or ctx()['collections']['trikots']
    # python-liquid does not treat an unset collection setting as blank: an empty handle stands in for Shopify's nil
    body = '<div class="shopify-section">' + section('main-collection', {'hide': {'handle': ''}, 'countries': {'handle': ''}}, template={'name': 'collection', 'suffix': ''}, collection=coll) + '</div>'
    return chrome('collection', body, query, cart_count, drawer, collection=coll)


def product_page(handle, query='', drawer='', cart_count=0):
    p = BY_HANDLE.get(handle) or PRODUCTS[0]
    body = '<div class="shopify-section">' + section('main-product', template={'name': 'product', 'suffix': ''}, product=p) + '</div>'
    return chrome('product', body, query, cart_count, drawer, product=p)
