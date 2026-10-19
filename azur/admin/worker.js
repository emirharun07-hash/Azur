/* AZUR admin: a small server (Cloudflare Worker) between the shop's own pages and the Shopify Admin API, so the two
   owners can change texts right on the website (product descriptions, the running bar on top) without the Shopify
   admin. The Shopify credentials live only here (Worker secrets), never in the website.

   POST /login    {user, password}              -> {token, user, exp}   (12 h, signed; wrong password: 401 after a pause)
   GET  /me       Authorization: Bearer <token> -> {user, exp}
   POST /bar      {text}                         -> shop metafield azur.announcement (one message per line)
   POST /product  {id, descriptionHtml}          -> productUpdate (HTML cleaned to a short allow-list)

   Secrets (wrangler secret put ...): SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET (Dev Dashboard app, client credentials
   grant), ADMIN_1 and ADMIN_2 ("name:password"), SESSION_KEY (a long random string).
   Vars (wrangler.toml): SHOP (the *.myshopify.com subdomain), ALLOWED_ORIGINS (comma separated). */

const API_VERSION = '2026-07';
const TOKEN_HOURS = 12;
const enc = new TextEncoder();

let shopToken = null;          // Admin API access token from the client credentials grant (valid 24 h)
let shopGid = null;
const failures = new Map();    // ip -> {n, until}: a slower answer after wrong passwords (per worker instance)

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '600', Vary: 'Origin' }
      : {};
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });
    if (req.method === 'OPTIONS') return new Response(null, { status: allowed.includes(origin) ? 204 : 403, headers: cors });
    if (!allowed.includes(origin)) return reply(403, { error: 'origin' });

    const path = new URL(req.url).pathname;
    try {
      if (path === '/login' && req.method === 'POST') return reply(...await login(req, env));
      const user = await verify(req.headers.get('Authorization'), env);
      if (!user) return reply(401, { error: 'login' });
      if (path === '/me') return reply(200, user);
      if (path === '/bar' && req.method === 'POST') return reply(...await saveBar(await body(req), env, user));
      if (path === '/product' && req.method === 'POST') return reply(...await saveProduct(await body(req), env, user));
      return reply(404, { error: 'not found' });
    } catch (e) {
      console.error(e);
      return reply(500, { error: 'server', message: String(e.message || e).slice(0, 300) });
    }
  }
};

async function body(req) {
  const text = await req.text();
  if (text.length > 100000) throw new Error('too large');
  return JSON.parse(text || '{}');
}

/* ------------------------------------------------------------------ login and session tokens */
async function login(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || '?', now = Date.now(), f = failures.get(ip);
  if (f && f.until > now) return [429, { error: 'wait', seconds: Math.ceil((f.until - now) / 1000) }];
  const { user = '', password = '' } = await body(req);
  const accounts = [env.ADMIN_1, env.ADMIN_2].filter(s => s && s.indexOf(':') > 0).map(s => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; });
  let ok = null;
  for (const [name, pass] of accounts) {                   // compare all, in constant time per pair
    if (await same(name.toLowerCase(), String(user).trim().toLowerCase()) & await same(pass, String(password))) ok = name;
  }
  if (!ok) {
    const n = (f ? f.n : 0) + 1;
    failures.set(ip, { n, until: n >= 5 ? now + 60000 * Math.min(30, n - 4) : 0 });
    await new Promise(r => setTimeout(r, 600));
    return [401, { error: 'login' }];
  }
  failures.delete(ip);
  const exp = now + TOKEN_HOURS * 3600e3;
  const payload = b64(enc.encode(JSON.stringify({ user: ok, exp })));
  return [200, { token: payload + '.' + await sign(payload, env), user: ok, exp }];
}
async function verify(header, env) {
  const m = /^Bearer (.+)\.(.+)$/.exec(header || ''); if (!m) return null;
  if (!await same(await sign(m[1], env), m[2])) return null;
  const data = JSON.parse(new TextDecoder().decode(unb64(m[1])));
  return data.exp > Date.now() ? data : null;
}
async function sign(payload, env) {
  if (!env.SESSION_KEY || env.SESSION_KEY.length < 24) throw new Error('SESSION_KEY missing or too short');
  const key = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload))));
}
async function same(a, b) {         // equal-time compare through hashes (no length leak)
  const [x, y] = await Promise.all([a, b].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0 ? 1 : 0;
}
const b64 = u => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

/* ------------------------------------------------------------------ Shopify Admin API */
async function accessToken(env) {
  if (shopToken && shopToken.exp > Date.now() + 60000) return shopToken.value;
  const res = await fetch(`https://${env.SHOP}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET, grant_type: 'client_credentials' })
  });
  if (!res.ok) throw new Error('Shopify token: ' + res.status + ' ' + (await res.text()).slice(0, 200));
  const t = await res.json();
  shopToken = { value: t.access_token, exp: Date.now() + (t.expires_in || 86399) * 1000 };
  return shopToken.value;
}
async function admin(env, query, variables) {
  const res = await fetch(`https://${env.SHOP}.myshopify.com/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await accessToken(env) },
    body: JSON.stringify({ query, variables })
  });
  const out = await res.json();
  if (out.errors) throw new Error(JSON.stringify(out.errors).slice(0, 300));
  return out.data;
}

/* ------------------------------------------------------------------ what can be edited */
async function saveBar({ text }, env, user) {
  if (typeof text !== 'string') return [400, { error: 'text' }];
  const lines = text.split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 12).map(s => s.slice(0, 120));
  if (!shopGid) shopGid = (await admin(env, '{ shop { id } }')).shop.id;
  const d = await admin(env, `mutation($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { field message } } }`,
    { m: [{ ownerId: shopGid, namespace: 'azur', key: 'announcement', type: 'multi_line_text_field', value: lines.join('\n') }] });
  const errs = d.metafieldsSet.userErrors;
  if (errs.length) return [422, { error: 'shopify', messages: errs.map(e => e.message) }];
  console.log(`bar by ${user.user}: ${lines.length} lines`);
  return [200, { ok: true, text: lines.join('\n') }];
}

async function saveProduct({ id, descriptionHtml }, env, user) {
  const num = String(id || '').replace(/\D/g, '');
  if (!num || typeof descriptionHtml !== 'string') return [400, { error: 'input' }];
  const html = await clean(descriptionHtml);
  const d = await admin(env, `mutation($p: ProductUpdateInput!) { productUpdate(product: $p) { product { id } userErrors { field message } } }`,
    { p: { id: 'gid://shopify/Product/' + num, descriptionHtml: html } });
  const errs = d.productUpdate.userErrors;
  if (errs.length) return [422, { error: 'shopify', messages: errs.map(e => e.message) }];
  console.log(`product ${num} by ${user.user}`);
  return [200, { ok: true, descriptionHtml: html }];
}

/* Product descriptions: what the editor sends goes through a short allow-list (paragraphs, line breaks, bold,
   italic, lists, links to http(s)/mailto); everything else keeps only its text. */
const KEEP = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a']);
async function clean(html) {
  const rw = new HTMLRewriter()
    .on('script, style, iframe, object, embed, template, noscript', { element: el => el.remove() })
    .on('*', { element: el => {
      const tag = el.tagName.toLowerCase();
      if (!KEEP.has(tag)) { el.removeAndKeepContent(); return; }
      const href = tag === 'a' ? (el.getAttribute('href') || '') : '';
      for (const [name] of [...el.attributes]) el.removeAttribute(name);
      if (tag === 'a') {
        if (/^(https?:|mailto:)/i.test(href.trim())) { el.setAttribute('href', href.trim()); el.setAttribute('rel', 'noopener'); }
        else el.removeAndKeepContent();
      }
    } });
  const out = await rw.transform(new Response(html.slice(0, 20000), { headers: { 'Content-Type': 'text/html' } })).text();
  return out.replace(/<!--[\s\S]*?-->/g, '').trim();
}
