"""The test shop's engine (Runde 33 / H1): renders azur/theme the way Shopify does, with python-liquid 2.3.6.

Used by theme_harness.py (the HTTP server). Nothing in here knows a single section by name: a page is
templates/<name>.json (order, sections, blocks, schema defaults) inside layout/<layout>.liquid, the static
{% section %}s of the layout take their settings from tools/harness_settings.json ("sections").

Data
  settings  config/settings_schema.json defaults <- tools/harness_settings.json <- fixture "settings"
  products  the five jerseys (Frankfurt, Berlin, Brasilien, Deutschland, Türkei). Stock without a fixture:
            Brasilien and Deutschland S 8, M 17, L 15, XL 10; the others S/M/L 10, XL 0 (sold out, as before).
  fixture   tools/fixtures/<NAME>.json, see tools/fixtures/README.md (stock, metafields, images, only, cart, shop, pages)
  texts     filter t: locales/de.default.json (en.json for English) plus every fragment locales/_neu/*.de.json
            (*.en.json). Placeholders {{ x }}, plural keys (one/other with count). Missing -> "translation missing: de.<key>".

Stand-ins for what python-liquid does not know (kept small on purpose)
  tags      {% form 'product'|'contact'|'customer'|'storefront_password'|… %} -> plain <form> (with form.errors and
            form.posted_successfully? from ?signup=ok|error, ?customer_posted=true, ?contact_posted=true, ?pw=error)
            {% paginate x by n %} -> one page (paginate.pages = 1)    {% section 'x' %} -> static section
            {% sections 'x' %} -> HARNESS note    {% style %} -> <style>    {% javascript %} / {% stylesheet %} -> dropped
            {% layout %} -> read for .liquid templates    {% schema %} -> read for the defaults, not output
  filters   t, money, money_with_currency, money_without_currency, money_without_trailing_zeros, json, asset_url,
            asset_img_url, file_url, file_img_url, image_url, img_url, image_tag, img_tag, stylesheet_tag, script_tag,
            payment_type_svg_tag (<svg class="payment-icon" data-type="…">), payment_button (disabled stand-in
            button), placeholder_svg_tag, default_pagination (empty), structured_data ({}), handleize, handle,
            link_to, url_for_type, within, default_errors, pluralize, weight_with_unit, time_tag, font_face (empty),
            font_url, product_img_url, color_* (value as is), highlight, md5, sha256, camelize
  objects   shop, settings, routes, request (locale, design_mode false, path), localization, cart, collections,
            all_products, pages, linklists, product, collection, page, template, search, blog/article (empty),
            content_for_header (fonts + window.Shopify), content_for_additional_checkout_buttons (empty)
Errors: a node python-liquid cannot render is replaced by the text "HARNESS: <file>:<line> <reason>" and logged.
"""
import hashlib, html, json, os, re, sys, threading, time

from liquid import BaseLoader, Environment
from liquid.ast import BlockNode
from liquid.builtin.expressions.primitive import Blank, Empty
from liquid.exceptions import LiquidInterrupt, StopRender
from liquid.loader import TemplateSource
from liquid.output import NullIO
from liquid.template import BoundTemplate
from liquid.undefined import Undefined

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
THEME = os.path.join(ROOT, 'theme')
FIXTURES = os.path.join(HERE, 'fixtures')
HARNESS_SETTINGS = os.path.join(HERE, 'harness_settings.json')
LOCALES = ('de', 'en')

REQ = threading.local()          # per request: locale, store, errors, forms


# ---------------------------------------------------------------- Liquid semantics like Shopify: nil == blank
def _blank_eq(self, other):
    if other is None or other is False or isinstance(other, Undefined):
        return True
    if isinstance(other, str) and (not other or other.isspace()):
        return True
    if isinstance(other, (list, dict, tuple)) and not other:
        return True
    return isinstance(other, (Blank, Empty))


Blank.__eq__ = _blank_eq
Blank.__hash__ = lambda self: 0


class ShopifyUndefined(Undefined):
    def __eq__(self, other):
        return isinstance(other, (Undefined, Blank, Empty)) or other is None

    __hash__ = Undefined.__hash__ if Undefined.__hash__ else (lambda self: 0)

    def __str__(self):
        return ''


# ---------------------------------------------------------------- errors: never a 500, the reason goes into the page
def harness_error(where, err):
    msg = f'HARNESS: {where} {type(err).__name__}: {str(err).splitlines()[0] if str(err) else ""}'.strip()
    errs = getattr(REQ, 'errors', None)
    if errs is not None:
        errs.append(msg)
    print(msg, file=sys.stderr, flush=True)
    return html.escape(msg, quote=False)


def _where(node):
    tok = getattr(node, 'token', None)
    src = getattr(tok, 'source', '') if tok else ''
    line = src.count('\n', 0, getattr(tok, 'start', 0)) + 1 if src else '?'
    return f'{getattr(REQ, "file", "?")}:{line}'


def _render_nodes(nodes, context, buffer, partial_raise=False):
    n = 0
    for node in nodes:
        try:
            n += node.render(context, buffer) or 0
        except (LiquidInterrupt, StopRender):
            raise
        except Exception as err:  # noqa: BLE001  (any failure of one node stays local)
            buffer.write(harness_error(_where(node), err))
    return n


def _block_render(self, context, buffer):
    if context.env.suppress_blank_control_flow_blocks and self.blank:
        _render_nodes(self.nodes, context, NullIO())
        return 0
    return _render_nodes(self.nodes, context, buffer)


BlockNode.render_to_output = _block_render


class HarnessTemplate(BoundTemplate):
    def render_with_context(self, context, buffer, *args, partial=False, block_scope=False, **kwargs):
        namespace = self.make_partial_namespace(partial, dict(*args, **kwargs))
        prev = getattr(REQ, 'file', '?')
        if self.name:
            REQ.file = self.name
        try:
            with context.extend(namespace=namespace):
                for node in self.nodes:
                    try:
                        node.render(context, buffer)
                    except LiquidInterrupt:
                        if partial and not block_scope:
                            raise
                    except StopRender:
                        break
                    except Exception as err:  # noqa: BLE001
                        buffer.write(harness_error(_where(node), err))
        finally:
            REQ.file = prev


# ---------------------------------------------------------------- files
def read_json(path):
    """JSON with an optional leading /* … */ comment (Shopify's templates and locales)"""
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'^\s*/\*.*?\*/', '', s, count=1, flags=re.S)
    return json.loads(s)


def deep_add(base, extra, origin='', conflicts=None):
    """adds the keys of extra that base does not have (base wins)"""
    for k, v in extra.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            deep_add(base[k], v, origin + k + '.', conflicts)
        elif k in base:
            if conflicts is not None and base[k] != v:
                conflicts.append(origin + k)
        else:
            base[k] = v
    return base


_LOC_CACHE = {}


def translations(locale):
    base = 'de.default.json' if locale == 'de' else f'{locale}.json'
    files = [os.path.join(THEME, 'locales', base)]
    neu = os.path.join(THEME, 'locales', '_neu')
    if os.path.isdir(neu):
        files += sorted(os.path.join(neu, f) for f in os.listdir(neu) if f.endswith(f'.{locale}.json'))
    key = tuple((f, os.path.getmtime(f)) for f in files if os.path.exists(f))
    if _LOC_CACHE.get(locale, (None,))[0] == key:
        return _LOC_CACHE[locale][1]
    data = {}
    for f in files:
        if not os.path.exists(f):
            continue
        try:
            conflicts = []
            deep_add(data, read_json(f), '', conflicts)
            for c in conflicts:
                print(f'HARNESS: {os.path.basename(f)} would overwrite {locale}.{c} (ignored)', file=sys.stderr, flush=True)
        except Exception as err:  # noqa: BLE001
            print(f'HARNESS: {f}: {err}', file=sys.stderr, flush=True)
    _LOC_CACHE[locale] = (key, data)
    return data


def split_schema(src):
    m = re.search(r'{%-?\s*schema\s*-?%}(.*?){%-?\s*endschema\s*-?%}', src, re.S)
    schema = {}
    if m:
        try:
            schema = json.loads(m.group(1))
        except ValueError as err:
            schema = {'_error': str(err)}
    return re.sub(r'{%-?\s*schema\s*-?%}.*?{%-?\s*endschema\s*-?%}', '', src, flags=re.S), schema


# ---------------------------------------------------------------- Shopify tags rewritten before parsing
FORM_ACTIONS = {'product': '/cart/add', 'contact': '/contact#contact_form', 'customer': '/contact#contact_form',
                'storefront_password': '/password', 'create_customer': '/account', 'customer_login': '/account/login',
                'localization': '/localization', 'cart': '/cart', 'new_comment': '/blogs/comments'}


def preprocess(src):
    src, _ = split_schema(src)
    src = src.replace('form.posted_successfully?', 'form.posted_successfully')
    # python-liquid reads these words as keywords even after a dot (section.settings.limit): bracket them
    kw = re.compile(r"(?<=[\w\]])\.(limit|offset|reversed|cols|with|as|and|or|contains|in)\b(?!\s*:)")
    src = re.sub(r'{[{%].*?[}%]}', lambda m: kw.sub(r"['\1']", m.group(0)), src, flags=re.S)

    def form_open(m):
        kind, args = m.group(1), m.group(2)
        fid = re.search(r"\bid:\s*([\w.'\"\[\]-]+)", args)
        cls = re.search(r"\bclass:\s*([\w.'\"\[\]-]+)", args)
        out = "{%- assign form = __forms['" + kind + "'] -%}"
        out += f'<form method="post" action="{FORM_ACTIONS.get(kind, "/" + kind)}" accept-charset="UTF-8"'
        if fid: out += ' id="{{ ' + fid.group(1) + ' }}"'
        if cls: out += ' class="{{ ' + cls.group(1) + ' }}"'
        for d in re.findall(r"\b(data-[\w-]+):", args):
            out += ' ' + d
        if kind == 'product': out += ' enctype="multipart/form-data"'
        out += f'><input type="hidden" name="form_type" value="{kind}"><input type="hidden" name="utf8" value="✓">'
        return out
    src = re.sub(r"{%-?\s*form\s+'(\w+)'(.*?)-?%}", form_open, src, flags=re.S)
    src = re.sub(r'{%-?\s*endform\s*-?%}', '</form>', src)
    src = re.sub(r'{%-?\s*paginate\s+.*?-?%}', '{%- assign paginate = __paginate -%}', src, flags=re.S)
    src = re.sub(r'{%-?\s*endpaginate\s*-?%}', '', src)
    src = re.sub(r"{%-?\s*section\s+'([\w-]+)'\s*-?%}", r'<!--HARNESS-SECTION:\1-->', src)
    src = re.sub(r"{%-?\s*sections\s+'([\w-]+)'\s*-?%}", r'HARNESS: section group \1 is not supported', src)
    src = re.sub(r'{%-?\s*style\s*-?%}', '<style>', src)
    src = re.sub(r'{%-?\s*endstyle\s*-?%}', '</style>', src)
    src = re.sub(r'{%-?\s*(javascript|stylesheet)\s*-?%}.*?{%-?\s*end\1\s*-?%}', '', src, flags=re.S)
    src = re.sub(r'{%-?\s*layout\s+[^%]*-?%}', '', src)
    return src


class ThemeLoader(BaseLoader):
    def get_source(self, env, template_name, *, context=None, **kwargs):
        path = os.path.join(THEME, 'snippets', template_name + '.liquid')
        if not os.path.exists(path):
            from liquid.exceptions import TemplateNotFoundError  # noqa: PLC0415
            raise TemplateNotFoundError(f'snippet {template_name} not found')
        mtime = os.path.getmtime(path)
        return TemplateSource(preprocess(open(path, encoding='utf-8').read()), path, lambda: os.path.getmtime(path) == mtime, None)


# ---------------------------------------------------------------- filters
def money(v):
    try:
        cents = int(round(float(v or 0)))
    except (TypeError, ValueError):
        return ''
    s = f'{cents / 100:,.2f}'.replace(',', ' ').replace('.', ',').replace(' ', '.')
    return s


def translate(key, **kw):
    loc = getattr(REQ, 'locale', 'de')
    node = translations(loc)
    for part in str(key).split('.'):
        node = node.get(part) if isinstance(node, dict) else None
        if node is None:
            break
    if isinstance(node, dict) and 'count' in kw:
        n = kw.get('count')
        node = node.get('zero' if n == 0 and 'zero' in node else ('one' if n == 1 else 'other'), node.get('other'))
    if not isinstance(node, str):
        if getattr(REQ, 'errors', None) is not None:
            REQ.errors.append(f'translation missing: {loc}.{key}')
        return f'translation missing: {loc}.{key}'
    return re.sub(r'{{\s*(\w+)\s*}}', lambda m: str(kw[m.group(1)]) if m.group(1) in kw and kw[m.group(1)] is not None else m.group(0), node)


def to_url(v):
    if isinstance(v, dict):
        return v.get('url') or v.get('src') or ''
    if isinstance(v, Undefined) or v is None:
        return ''
    return str(v)


def image_tag(url, **kw):
    attrs = []
    for k, v in kw.items():
        if k in ('widths', 'preload') or v is None or isinstance(v, Undefined):
            continue
        attrs.append(f' {k}="{html.escape(str(v))}"')
    if 'alt' not in kw:
        attrs.append(' alt=""')
    return f'<img src="{html.escape(to_url(url))}"{"".join(attrs)}>'


def to_json(v):
    def conv(o):
        if isinstance(o, Undefined): return None
        return str(o)
    if isinstance(v, Undefined):
        return 'null'
    return json.dumps(v, ensure_ascii=False, default=conv)


def asset_url(v):
    return '/theme/assets/' + str(v)


def make_env():
    e = Environment(loader=ThemeLoader(), undefined=ShopifyUndefined, strict_filters=True)
    e.template_class = HarnessTemplate
    f = e.filters
    f['t'] = translate
    f['translate'] = translate
    f['money'] = lambda v: money(v) + ' €'
    f['money_with_currency'] = lambda v: money(v) + ' € EUR'
    f['money_without_currency'] = money
    f['money_without_trailing_zeros'] = lambda v: money(v).replace(',00', '') + ' €'
    f['json'] = to_json
    f['asset_url'] = asset_url
    f['asset_img_url'] = lambda v, *a, **k: asset_url(v)
    f['file_url'] = lambda v: '/files/' + str(v) + '?v=1'
    f['file_img_url'] = lambda v, *a, **k: '/files/' + str(v)
    f['image_url'] = lambda v, *a, **k: to_url(v)
    f['img_url'] = lambda v, *a, **k: to_url(v)
    f['product_img_url'] = lambda v, *a, **k: to_url(v)
    f['image_tag'] = image_tag
    f['img_tag'] = lambda v, alt='', cls='': f'<img src="{html.escape(to_url(v))}" alt="{html.escape(str(alt))}" class="{cls}">'
    f['stylesheet_tag'] = lambda v, **k: f'<link href="{v}" rel="stylesheet" type="text/css" media="all" />'
    f['script_tag'] = lambda v: f'<script src="{v}" type="text/javascript"></script>'
    f['payment_type_svg_tag'] = lambda v, **k: f'<svg class="payment-icon{(" " + k["class"]) if k.get("class") else ""}" data-type="{html.escape(str(v))}" width="38" height="24" role="img" aria-label="{html.escape(str(v))}"></svg>'
    f['payment_button'] = lambda v, *a, **k: '<button class="shopify-payment-button__button" type="button" disabled>Direkt kaufen (Stellvertreter)</button>'
    f['placeholder_svg_tag'] = lambda v, cls='': f'<svg class="{cls}" data-placeholder="{v}" viewBox="0 0 10 10"></svg>'
    f['default_pagination'] = lambda v, **k: ''
    f['structured_data'] = lambda v: '{}'
    f['handleize'] = f['handle'] = lambda v: re.sub(r'[^a-z0-9]+', '-', str(v or '').lower()).strip('-')
    f['camelize'] = lambda v: ''.join(w.capitalize() for w in re.split(r'[^A-Za-z0-9]+', str(v or '')))
    f['link_to'] = lambda v, url='', title='': f'<a href="{url}" title="{title}">{v}</a>'
    f['url_for_type'] = lambda v: '/collections/types?q=' + str(v)
    f['url_for_vendor'] = lambda v: '/collections/vendors?q=' + str(v)
    f['within'] = lambda v, coll=None: str(v)
    f['default_errors'] = lambda v: ' '.join(str(x) for x in (v or [])) if not isinstance(v, Undefined) else ''
    f['pluralize'] = lambda n, one, other: one if n == 1 else other
    f['weight_with_unit'] = lambda v, *a: f'{(v or 0) / 1000:g} kg'.replace('.', ',')
    f['time_tag'] = lambda v, *a, **k: f'<time>{v}</time>'
    f['font_face'] = lambda v, **k: ''
    f['font_url'] = lambda v, *a: ''
    f['font_modify'] = lambda v, *a: v
    for c in ('color_to_rgb', 'color_to_hsl', 'color_to_hex', 'color_modify', 'color_lighten', 'color_darken',
              'color_saturate', 'color_desaturate', 'color_mix', 'color_brightness', 'color_contrast'):
        f[c] = lambda v, *a, **k: v
    f['highlight'] = lambda v, *a: v
    f['md5'] = lambda v: hashlib.md5(str(v).encode()).hexdigest()
    f['sha256'] = lambda v: hashlib.sha256(str(v).encode()).hexdigest()
    f['newline_to_br'] = lambda v: '' if v is None or isinstance(v, Undefined) else str(v).replace('\r\n', '\n').replace('\n', '<br />\n')
    return e


ENV = make_env()
_TPL_CACHE = {}


def parse_file(path):
    """(template, schema) of a section / layout / .liquid template, cached by mtime"""
    mtime = os.path.getmtime(path)
    hit = _TPL_CACHE.get(path)
    if hit and hit[0] == mtime:
        return hit[1], hit[2]
    raw = open(path, encoding='utf-8').read()
    _, schema = split_schema(raw)
    tpl = ENV.from_string(preprocess(raw), name=os.path.relpath(path, THEME))
    _TPL_CACHE[path] = (mtime, tpl, schema)
    return tpl, schema


# ---------------------------------------------------------------- the shop's data
JERSEYS = [  # handle, title, price (cents), image key, variant ids, kind
    ('frankfurt-trikot-azur-collection', 'Frankfurt 069 Trikot', 6499, 'frankfurt', [55081072722259, 55081072755027, 55081072787795, 55081072820563], 'staedtetrikots'),
    ('berlin-trikot-azur-collection', 'Berlin 030 Trikot', 6499, 'berlin', [55083930026323, 55083930059091, 55083930091859, 55083930124627], 'staedtetrikots'),
    ('brasilien-trikot-azur-collection', 'Brasilien Trikot', 5499, 'brasilien', [1, 2, 3, 4], 'nationaltrikots'),
    ('deutschland-trikot-azur-collection', 'Deutschland Trikot', 5499, 'deutschland', [5, 6, 7, 8], 'nationaltrikots'),
    ('turkei-trikot-azur-collection', 'Türkei Trikot', 5499, 'tuerkei', [9, 10, 11, 12], 'nationaltrikots'),
]
PRODUCT_IDS = {'frankfurt-trikot-azur-collection': 10885924946259, 'berlin-trikot-azur-collection': 10886281167187,
               'brasilien-trikot-azur-collection': 10876882387283, 'deutschland-trikot-azur-collection': 10876882190675,
               'turkei-trikot-azur-collection': 10876882026835}
SIZES = ['S', 'M', 'L', 'XL']
DEFAULT_STOCK = {'brasilien-trikot-azur-collection': {'S': 8, 'M': 17, 'L': 15, 'XL': 10},
                 'deutschland-trikot-azur-collection': {'S': 8, 'M': 17, 'L': 15, 'XL': 10}}
OTHER_STOCK = {'S': 10, 'M': 10, 'L': 10, 'XL': 0}
VIEW_ALTS = ['Vorderseite', 'Rückseite', 'Detail Kragen', 'Seitenansicht', '3/4 Ansicht', 'Detail Saum']
PAGES = [('contact', 'Kontakt', 'contact'), ('impressum', 'Impressum', ''), ('agb', 'AGB', ''),
         ('datenschutzerklarung', 'Datenschutzerklärung', ''), ('versand-widerrufsrecht', 'Versand & Widerrufsrecht', ''),
         ('ueber-azur', 'Über Azur', 'about'), ('drops', 'Drops', 'drops')]
POLICIES = [('privacy_policy', 'privacy-policy', 'Datenschutzerklärung'), ('refund_policy', 'refund-policy', 'Rückerstattungsrichtlinie'),
            ('shipping_policy', 'shipping-policy', 'Versandrichtlinie'), ('terms_of_service', 'terms-of-service', 'Allgemeine Geschäftsbedingungen'),
            ('legal_notice', 'legal-notice', 'Impressum'), ('contact_information', 'contact-information', 'Kontaktinformationen')]
MENUS = {'main-menu': [('Startseite', '/'), ('Katalog', '/collections/all'), ('Kontakt', '/pages/contact')],
         'footer': [('Suche', '/search'), ('Deine Datenschutz-Einstellungen', '/pages/data-sharing-opt-out')]}


def load_fixture(name):
    if not name:
        return {}
    if not re.fullmatch(r'[\w.-]+', name):
        raise ValueError(f'fixture name {name!r}')
    path = os.path.join(FIXTURES, name + '.json')
    return read_json(path)


def media(img, alt, n):
    return {'id': 900000 + n, 'media_type': 'image', 'alt': alt, 'url': f'/proto/assets/products/{img}.webp', 'src': f'/proto/assets/products/{img}.webp',
            'aspect_ratio': 0.9, 'width': 1800, 'height': 2000, 'position': n, 'preview_image': {'url': f'/proto/assets/products/{img}.webp', 'aspect_ratio': 0.9}}


def wrap_metafields(mf):
    out = {}
    for ns, fields in (mf or {}).items():
        out[ns] = {}
        for k, v in (fields or {}).items():
            if isinstance(v, dict) and 'value' in v:
                out[ns][k] = v
            else:
                out[ns][k] = {'value': v, 'type': 'multi_line_text_field' if isinstance(v, str) and '\n' in v else 'single_line_text_field'}
    return out


def build_product(handle, title, price, img, vids, kind, fx):
    stock = dict(DEFAULT_STOCK.get(handle, OTHER_STOCK))
    stock.update((fx or {}).get('inventory') or {})
    price = int((fx or {}).get('price', price))
    title = (fx or {}).get('title', title)
    pid = PRODUCT_IDS[handle]
    variants = []
    for i, (v, s) in enumerate(zip(vids, SIZES)):
        q = int(stock.get(s, 0))
        variants.append({'id': v, 'title': s, 'option1': s, 'option2': None, 'option3': None, 'options': [s], 'name': f'{title} - {s}',
                         'price': price, 'compare_at_price': None, 'available': q > 0, 'inventory_quantity': q,
                         'inventory_management': 'shopify', 'inventory_policy': 'deny', 'sku': f'AZ-{img[:3].upper()}-{s}',
                         'url': f'/products/{handle}?variant={v}', 'requires_shipping': True, 'taxable': False, 'position': i + 1,
                         'product_id': pid, 'featured_image': None, 'featured_media': None, 'selected': False, 'weight': 250})
    n = int((fx or {}).get('media', 2))
    imgs = [media(img, f'{title} {VIEW_ALTS[i % len(VIEW_ALTS)]}', i + 1) for i in range(max(n, 0))]
    first = next((v for v in variants if v['available']), variants[0])
    p = {'id': pid, 'handle': handle, 'title': title, 'price': price, 'price_min': price, 'price_max': price, 'price_varies': False,
         'compare_at_price': None, 'compare_at_price_max': None, 'url': '/products/' + handle, 'type': 'Trikot', 'vendor': 'Azur',
         'available': any(v['available'] for v in variants),
         'description': (fx or {}).get('description', f'<p>{title}: Produktbeschreibung aus Shopify (im Test-Shop ein Platzhalter).</p>'),
         'content': '', 'featured_image': imgs[0] if imgs else None, 'featured_media': imgs[0] if imgs else None,
         'media': imgs, 'images': imgs, 'options': ['Größe'], 'variants': variants, 'selected_variant': None,
         'selected_or_first_available_variant': first, 'first_available_variant': first, 'has_only_default_variant': False,
         'options_with_values': [{'name': 'Größe', 'position': 1, 'values': SIZES[:len(variants)], 'selected_value': None}],
         'options_by_name': {'größe': {'name': 'Größe', 'values': SIZES[:len(variants)]}},
         'collections': [{'handle': 'trikots', 'url': '/collections/trikots', 'title': 'Trikots'},
                         {'handle': kind, 'url': '/collections/' + kind, 'title': 'Städtetrikots' if kind == 'staedtetrikots' else 'Nationaltrikots'}],
         'metafields': wrap_metafields(dict({'custom': {}}, **((fx or {}).get('metafields') or {}))),
         'tags': list((fx or {}).get('tags', [])), 'template_suffix': (fx or {}).get('template_suffix', ''),
         'requires_selling_plan': False, 'selling_plan_groups': [], 'gift_card?': False, 'published_at': '2026-01-01T10:00:00+01:00',
         'created_at': '2026-01-01T10:00:00+01:00'}
    for v in variants:
        v['featured_image'] = v['featured_media'] = p['featured_image']
    return p


def schema_defaults(settings_schema):
    out = {}
    for x in settings_schema or []:
        if 'id' in x:
            out[x['id']] = x.get('default')
    return out


def theme_schema():
    try:
        groups = read_json(os.path.join(THEME, 'config', 'settings_schema.json'))
    except Exception as err:  # noqa: BLE001
        print(f'HARNESS: settings_schema.json: {err}', file=sys.stderr, flush=True)
        return []
    return [s for g in groups for s in g.get('settings', [])]


class Store:
    """everything a page sees, for one request (fixture applied)"""

    def __init__(self, fixture=None):
        fx = fixture or {}
        self.fx = fx
        pfx = fx.get('products') or {}
        only = fx.get('only')
        self.products = [build_product(*j, pfx.get(j[0])) for j in JERSEYS if not only or j[0] in only]
        self.by_handle = {p['handle']: p for p in self.products}
        self.by_variant = {v['id']: (p, v) for p in self.products for v in p['variants']}

        def coll(handle, title, prods):
            return {'id': abs(hash(handle)) % 10 ** 9, 'handle': handle, 'url': '/collections/' + handle, 'title': title, 'products': prods,
                    'products_count': len(prods), 'all_products_count': len(prods), 'description': '', 'image': None, 'featured_image': None,
                    'filters': [], 'sort_options': [], 'sort_by': '', 'default_sort_by': 'manual', 'template_suffix': '', 'all_tags': [], 'tags': []}
        self.collections = {
            'all': coll('all', 'Alle Produkte', self.products),
            'trikots': coll('trikots', 'Trikots', self.products),
            'staedtetrikots': coll('staedtetrikots', 'Städtetrikots', [p for p in self.products if p['collections'][1]['handle'] == 'staedtetrikots']),
            'nationaltrikots': coll('nationaltrikots', 'Nationaltrikots', [p for p in self.products if p['collections'][1]['handle'] == 'nationaltrikots']),
        }
        self.pages = {}
        for h, t, suf in PAGES:
            self.pages[h] = {'id': abs(hash(h)) % 10 ** 9, 'handle': h, 'title': t, 'url': '/pages/' + h, 'template_suffix': suf,
                             'content': '<p>(Seiteninhalt aus Shopify; im Test-Shop nur ein Platzhalter)</p>', 'author': 'Azur',
                             'published_at': '2026-01-01T10:00:00+01:00', 'metafields': {}}
        for h, pg in (fx.get('pages') or {}).items():
            if pg is None:
                self.pages.pop(h, None)
                continue
            base = self.pages.get(h, {'id': abs(hash(h)) % 10 ** 9, 'handle': h, 'url': '/pages/' + h, 'template_suffix': '',
                                      'author': 'Azur', 'published_at': '2026-01-01T10:00:00+01:00', 'metafields': {}})
            self.pages[h] = dict(base, **pg)

        # settings: schema defaults <- harness_settings.json <- fixture
        self.schema = theme_schema()
        raw = schema_defaults(self.schema)
        hs = {}
        try:
            hs = read_json(HARNESS_SETTINGS)
        except FileNotFoundError:
            pass
        except Exception as err:  # noqa: BLE001
            print(f'HARNESS: harness_settings.json: {err}', file=sys.stderr, flush=True)
        self.static_sections = dict(hs.get('sections') or {})
        raw.update({k: v for k, v in hs.items() if k != 'sections' and not k.startswith('_')})
        fs = dict(fx.get('settings') or {})
        for name, sec in (fs.pop('sections', None) or {}).items():
            cur = self.static_sections.setdefault(name, {'type': name, 'settings': {}})
            cur['settings'] = dict(cur.get('settings') or {}, **(sec.get('settings') or {}))
        raw.update(fs)
        types = {s['id']: s['type'] for s in self.schema if 'id' in s}
        self.settings = {k: self.resolve(types.get(k), v) for k, v in raw.items()}

        payments = (fx.get('shop') or {}).get('enabled_payment_types', ['paypal', 'visa', 'master'])
        policies = {k: {'title': t, 'url': '/policies/' + h, 'handle': h, 'body': ''} for k, h, t in POLICIES}
        self.shop = dict({'name': 'Azur', 'email': 'kontakt@azurclothing.com', 'url': 'http://127.0.0.1', 'domain': '127.0.0.1',
                          'secure_url': 'http://127.0.0.1', 'permanent_domain': 'azur-harness.myshopify.com', 'currency': 'EUR',
                          'money_format': '{{amount_with_comma_separator}} €', 'money_with_currency_format': '{{amount_with_comma_separator}} € EUR',
                          'customer_accounts_enabled': True, 'customer_accounts_optional': True, 'password_message': '',
                          'enabled_payment_types': payments, 'locale': 'de', 'description': '', 'brand': {}, 'types': ['Trikot'], 'vendors': ['Azur'],
                          'products_count': len(self.products), 'collections_count': len(self.collections),
                          'policies': list(policies.values()), 'metafields': {'azur': {'announcement': {'value': ''}}},
                          'published_locales': [{'iso_code': 'de', 'name': 'Deutsch', 'primary': True}, {'iso_code': 'en', 'name': 'English', 'primary': False}]},
                         **policies)
        for k, v in (fx.get('shop') or {}).items():
            if k == 'metafields':
                self.shop['metafields'] = dict(self.shop['metafields'], **wrap_metafields(v))
            else:
                self.shop[k] = v

    def resolve(self, typ, v):
        """a setting value as Liquid sees it (handles become objects, unset objects become nil)"""
        if typ == 'product':
            return self.by_handle.get(v) if isinstance(v, str) else (v or None)
        if typ == 'product_list':
            return [self.by_handle[h] for h in (v or []) if h in self.by_handle]
        if typ == 'collection':
            return self.collections.get(v) if isinstance(v, str) else (v or None)
        if typ == 'collection_list':
            return [self.collections[h] for h in (v or []) if h in self.collections]
        if typ == 'page':
            return self.pages.get(v) if isinstance(v, str) else (v or None)
        if typ in ('image_picker', 'video', 'video_url', 'metaobject', 'blog', 'article'):
            if isinstance(v, str) and v:
                url = v if v.startswith('/') else '/files/' + v.replace('shopify://shop_images/', '')
                return {'url': url, 'src': url, 'alt': '', 'aspect_ratio': 1, 'width': 1000, 'height': 1000}
            return v or None
        if typ == 'checkbox':
            return bool(v)
        if typ in ('number', 'range') and isinstance(v, str) and v.strip():
            try:
                return float(v) if '.' in v else int(v)
            except ValueError:
                return v
        return v

    # ---- cart
    def cart(self, lines):
        items, total = [], 0
        for n, ln in enumerate(lines, 1):
            hit = self.by_variant.get(int(ln['id']))
            if not hit:
                continue
            p, v = hit
            q = int(ln['quantity'])
            items.append({'id': v['id'], 'key': f"{v['id']}:harness", 'variant_id': v['id'], 'product_id': p['id'], 'handle': p['handle'],
                          'title': f"{p['title']} - {v['title']}", 'product_title': p['title'], 'variant_title': v['title'],
                          'quantity': q, 'price': v['price'], 'original_price': v['price'], 'final_price': v['price'],
                          'line_price': v['price'] * q, 'original_line_price': v['price'] * q, 'final_line_price': v['price'] * q,
                          'url': v['url'], 'image': (p['featured_image'] or {}).get('url'), 'featured_image': p['featured_image'],
                          'product': p, 'variant': v, 'options_with_values': [{'name': 'Größe', 'value': v['title']}],
                          'url_to_remove': f'/cart/change?line={n}&quantity=0', 'line_level_discount_allocations': [],
                          'discounts': [], 'properties': {}, 'requires_shipping': True, 'sku': v['sku'], 'vendor': 'Azur'})
            total += v['price'] * q
        return {'item_count': sum(i['quantity'] for i in items), 'items': items, 'total_price': total, 'items_subtotal_price': total,
                'original_total_price': total, 'total_discount': 0, 'currency': {'iso_code': 'EUR', 'symbol': '€'}, 'requires_shipping': bool(items),
                'note': '', 'attributes': {}, 'cart_level_discount_applications': [], 'discount_applications': [], 'token': 'harness', 'empty?': not items}

    def cart_json(self, lines):
        c = self.cart(lines)
        out = {k: v for k, v in c.items() if k not in ('items', 'empty?')}
        out['currency'] = 'EUR'
        out['items'] = [{k: v for k, v in i.items() if k not in ('product', 'variant', 'featured_image', 'url_to_remove')} for i in c['items']]
        return out


# ---------------------------------------------------------------- rendering
class FormErrors(list):
    """Shopify's form.errors: iterates over the field names, .messages and .translated_fields map them to text"""
    def __init__(self, fields):
        super().__init__(f for f, _, _ in fields)
        self.maps = {'messages': {f: m for f, _, m in fields}, 'translated_fields': {f: t for f, t, _ in fields}}

    def __getitem__(self, key):
        return self.maps[key] if isinstance(key, str) else super().__getitem__(key)


def forms_state(query):
    q = query or ''
    ok = 'signup=ok' in q or 'customer_posted=true' in q
    err = FormErrors([('email', 'E-Mail', 'ist ungültig.')]) if 'signup=error' in q else None
    plain = {'posted_successfully': False, 'errors': None}
    return {'customer': {'posted_successfully': ok, 'errors': err},
            'contact': {'posted_successfully': ok or 'contact_posted=true' in q, 'errors': err},
            'storefront_password': {'posted_successfully': False, 'errors': FormErrors([('form', '', 'Falsches Passwort')]) if 'pw=error' in q else None},
            'product': plain, 'create_customer': plain, 'customer_login': plain, 'localization': plain, 'cart': plain, 'new_comment': plain}


def globals_for(store, lines, template, path, query, locale, extra=None):
    root = '/' if locale == 'de' else f'/{locale}'
    pre = '' if locale == 'de' else f'/{locale}'
    routes = {'root_url': root, 'cart_url': pre + '/cart', 'cart_add_url': pre + '/cart/add', 'cart_change_url': pre + '/cart/change',
              'cart_update_url': pre + '/cart/update', 'cart_clear_url': pre + '/cart/clear', 'collections_url': pre + '/collections',
              'all_products_collection_url': pre + '/collections/all', 'search_url': pre + '/search', 'predictive_search_url': pre + '/search/suggest',
              'product_recommendations_url': pre + '/recommendations/products', 'account_url': pre + '/account',
              'account_login_url': pre + '/account/login', 'account_logout_url': pre + '/account/logout',
              'account_register_url': pre + '/account/register', 'account_addresses_url': pre + '/account/addresses'}
    langs = [{'iso_code': 'de', 'endonym_name': 'Deutsch', 'name': 'Deutsch', 'root_url': '/', 'primary': True},
             {'iso_code': 'en', 'endonym_name': 'English', 'name': 'English', 'root_url': '/en', 'primary': False}]
    cur = next(lg for lg in langs if lg['iso_code'] == locale) if locale in ('de', 'en') else langs[0]
    country = {'iso_code': 'DE', 'name': 'Deutschland', 'currency': {'iso_code': 'EUR', 'symbol': '€', 'name': 'Euro'}, 'available_languages': langs}
    g = {
        'settings': store.settings, 'shop': store.shop, 'routes': routes,
        'request': {'locale': cur, 'design_mode': False, 'visual_preview_mode': False, 'path': path, 'host': '127.0.0.1',
                    'origin': 'http://127.0.0.1', 'page_type': template['name']},
        'localization': {'language': cur, 'available_languages': langs, 'country': country, 'available_countries': [country], 'market': {'handle': 'de', 'id': 1}},
        'cart': store.cart(lines), 'collections': store.collections, 'all_products': store.by_handle, 'pages': store.pages,
        'linklists': {h: {'handle': h, 'title': h, 'links': [{'title': t, 'url': u, 'active': u == path, 'current': u == path, 'links': []} for t, u in ls]}
                      for h, ls in MENUS.items()},
        'template': template, 'canonical_url': 'http://127.0.0.1' + path, 'page_title': store.shop['name'], 'page_description': '',
        'current_tags': None, 'current_page': 1, 'handle': '', 'additional_checkout_buttons': False,
        'content_for_additional_checkout_buttons': '', 'customer': None, 'scripts': {}, 'powered_by_link': '',
        'search': {'performed': False, 'results': [], 'results_count': 0, 'terms': '', 'types': []},
        'blogs': {}, 'articles': {}, 'blog': None, 'article': None, 'recommendations': {'performed': False, 'products': [], 'products_count': 0},
        'images': {}, 'page_image': None, 'predictive_search': {'performed': False},
        '__forms': forms_state(query), '__paginate': {'pages': 1, 'current_page': 1, 'items': 0, 'page_size': 24, 'parts': [], 'previous': None, 'next': None},
        'form': {'posted_successfully': False, 'errors': None},
    }
    g.update(extra or {})
    return g


def section_object(store, sid, data, schema):
    s = schema_defaults(schema.get('settings'))
    s.update((data or {}).get('settings') or {})
    types = {x['id']: x['type'] for x in schema.get('settings', []) if 'id' in x}
    s = {k: store.resolve(types.get(k), v) for k, v in s.items()}
    bschemas = {b.get('type'): b for b in schema.get('blocks', []) or []}
    blocks = []
    raw_blocks = (data or {}).get('blocks') or {}
    order = (data or {}).get('block_order') or list(raw_blocks)
    for bid in order:
        b = raw_blocks.get(bid)
        if not b or b.get('disabled'):
            continue
        bs = bschemas.get(b.get('type'), {})
        bset = schema_defaults(bs.get('settings'))
        bset.update(b.get('settings') or {})
        btypes = {x['id']: x['type'] for x in bs.get('settings', []) if 'id' in x}
        blocks.append({'id': bid, 'type': b.get('type'), 'settings': {k: store.resolve(btypes.get(k), v) for k, v in bset.items()},
                       'shopify_attributes': f'data-shopify-editor-block="{bid}"'})
    return {'id': sid, 'settings': s, 'blocks': blocks, 'index': 1, 'location': 'template'}


def render_section(store, g, sid, data, dom_id=None):
    """one section in its <div class="shopify-section"> wrapper, like Shopify's output"""
    typ = (data or {}).get('type', sid)
    path = os.path.join(THEME, 'sections', typ + '.liquid')
    dom_id = dom_id or sid
    if not os.path.exists(path):
        return f'<div id="shopify-section-{dom_id}" class="shopify-section">{harness_error("sections/" + typ + ".liquid", FileNotFoundError("section file missing"))}</div>'
    try:
        tpl, schema = parse_file(path)
    except Exception as err:  # noqa: BLE001
        return f'<div id="shopify-section-{dom_id}" class="shopify-section">{harness_error("sections/" + typ + ".liquid", err)}</div>'
    cls = ('shopify-section ' + schema.get('class', '')).strip()
    ctx = dict(g, section=section_object(store, dom_id, data, schema))
    try:
        body = tpl.render(**ctx)
    except Exception as err:  # noqa: BLE001
        body = harness_error('sections/' + typ + '.liquid', err)
    tag = schema.get('tag', 'div')
    return f'<{tag} id="shopify-section-{dom_id}" class="{cls}">{body}</{tag}>'


def static_section(store, g, name):
    data = store.static_sections.get(name) or {'type': name, 'settings': {}}
    return render_section(store, g, name, dict(data, type=data.get('type', name)), dom_id=name)


def load_template(name, suffix):
    """('json'|'liquid', data, used_name, note) for templates/<name>[.<suffix>]"""
    note = ''
    for cand in ([f'{name}.{suffix}'] if suffix else []) + [name]:
        for ext in ('json', 'liquid'):
            p = os.path.join(THEME, 'templates', f'{cand}.{ext}')
            if os.path.exists(p):
                if suffix and cand == name:
                    note = f'HARNESS: templates/{name}.{suffix} fehlt, templates/{name} genommen'
                    print(note, file=sys.stderr, flush=True)
                return ext, (read_json(p) if ext == 'json' else p), cand, note
    return None, None, name, f'HARNESS: templates/{name} fehlt'


def render_page(store, lines, name, suffix, path, query, locale, extra=None):
    """the whole page: template sections in the layout, static sections of the layout"""
    REQ.errors = []
    REQ.locale = locale
    kind, data, used, note = load_template(name, suffix)
    template = {'name': name, 'suffix': used.split('.', 1)[1] if '.' in used else None, 'directory': None}
    g = globals_for(store, lines, template, path, query, locale, extra)
    layout = 'theme'
    content = ''
    if kind == 'json':
        layout = data.get('layout', 'theme')
        tid = 'template--harness__'
        for sid in data.get('order', []):
            sec = data['sections'].get(sid)
            if not sec or sec.get('disabled'):
                continue
            content += render_section(store, g, sid, sec, dom_id=tid + sid)
    elif kind == 'liquid':
        raw = open(data, encoding='utf-8').read()
        m = re.search(r"{%-?\s*layout\s+(none|'([\w-]+)')\s*-?%}", raw)
        if m:
            layout = m.group(2) or None
        try:
            tpl, _ = parse_file(data)
            content = tpl.render(**g)
        except Exception as err:  # noqa: BLE001
            content = harness_error(os.path.relpath(data, THEME), err)
    else:
        content = note
        note = ''
    if note:
        content = f'<!-- {note} -->' + content
    if not layout:
        return content
    lpath = os.path.join(THEME, 'layout', layout + '.liquid')
    if not os.path.exists(lpath):
        lpath = os.path.join(THEME, 'layout', 'theme.liquid')
    try:
        tpl, _ = parse_file(lpath)
        out = tpl.render(**dict(g, content_for_layout=content, content_for_header=content_for_header(locale)))
    except Exception as err:  # noqa: BLE001
        out = harness_error('layout/' + layout + '.liquid', err) + content
    return re.sub(r'<!--HARNESS-SECTION:([\w-]+)-->', lambda m: static_section(store, g, m.group(1)), out)


def render_sections(store, lines, ids, name, suffix, path, query, locale):
    """Section Rendering API: {id: html} for static sections and the sections of the page's template"""
    REQ.errors = []
    REQ.locale = locale
    kind, data, used, _ = load_template(name, suffix)
    template = {'name': name, 'suffix': None, 'directory': None}
    g = globals_for(store, lines, template, path, query, locale)
    out = {}
    tsecs = data.get('sections', {}) if kind == 'json' else {}
    for sid in ids:
        key = sid.split('__')[-1]
        if key in tsecs:
            out[sid] = render_section(store, g, key, tsecs[key], dom_id=sid)
        elif os.path.exists(os.path.join(THEME, 'sections', key + '.liquid')):
            out[sid] = static_section(store, g, key)
        else:
            out[sid] = None
    return out


def content_for_header(locale):
    root = '/' if locale == 'de' else f'/{locale}/'
    return ('<!-- content_for_header (Stellvertreter) -->\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap">\n'
            f'<script>window.Shopify = window.Shopify || {{}}; Shopify.routes = {{ root: {json.dumps(root)} }}; Shopify.locale = {json.dumps(locale)}; '
            'Shopify.currency = { active: "EUR", rate: "1.0" }; Shopify.country = "DE"; Shopify.shop = "azur-harness.myshopify.com";</script>')
