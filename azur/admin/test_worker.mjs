/* Admin server test in Miniflare with a stand-in Shopify: login, tokens, the bar, product HTML cleaning, lockout.
   Run: npm i miniflare@4 (any folder), then node azur/admin/test_worker.mjs from there (NODE_PATH not needed with a local install). */
import { Miniflare } from 'miniflare';
import fs from 'fs';
const calls = [];
const mf = new Miniflare({
  modules: true, script: fs.readFileSync(new URL('./worker.js', import.meta.url), 'utf8'), compatibilityDate: '2026-08-01',
  bindings: { SHOP: 'testshop', ALLOWED_ORIGINS: 'https://azurclothing.com', SHOPIFY_CLIENT_ID: 'cid', SHOPIFY_CLIENT_SECRET: 'csec',
    ADMIN_1: 'Emir:richtig-langes-passwort', ADMIN_2: 'Partner:anderes-passwort-123', SESSION_KEY: 'x'.repeat(40) },
  outboundService: async req => {
    const u = new URL(req.url), b = await req.text(); calls.push([u.pathname, b]);
    if (u.pathname.endsWith('/oauth/access_token')) return new Response(JSON.stringify({ access_token: 'shpat_test', expires_in: 86399 }), { headers: { 'Content-Type': 'application/json' } });
    const q = JSON.parse(b);
    if (q.query.includes('shop { id }')) return Response.json({ data: { shop: { id: 'gid://shopify/Shop/1' } } });
    if (q.query.includes('metafieldsSet')) return Response.json({ data: { metafieldsSet: { userErrors: [] } } });
    if (q.query.includes('productUpdate')) return Response.json({ data: { productUpdate: { product: { id: q.variables.p.id }, userErrors: [] } } });
    return new Response('?', { status: 500 });
  }
});
const O = { Origin: 'https://azurclothing.com', 'Content-Type': 'application/json' };
const ok = (c, m) => console.log((c ? 'OK   ' : 'FAIL ') + m);
let r = await mf.dispatchFetch('http://w/login', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }); ok(r.status === 403, 'preflight from other origin refused');
r = await mf.dispatchFetch('http://w/login', { method: 'OPTIONS', headers: { Origin: 'https://azurclothing.com' } }); ok(r.status === 204 && r.headers.get('access-control-allow-origin') === 'https://azurclothing.com', 'preflight from the shop');
r = await mf.dispatchFetch('http://w/login', { method: 'POST', headers: O, body: JSON.stringify({ user: 'emir', password: 'falsch' }) }); ok(r.status === 401, 'wrong password 401');
r = await mf.dispatchFetch('http://w/login', { method: 'POST', headers: O, body: JSON.stringify({ user: ' EMIR ', password: 'richtig-langes-passwort' }) });
const j = await r.json(); ok(r.status === 200 && j.token && j.user === 'Emir', 'login (name case-insensitive) ' + r.status);
const A = { ...O, Authorization: 'Bearer ' + j.token };
r = await mf.dispatchFetch('http://w/me', { headers: A }); ok(r.status === 200 && (await r.json()).user === 'Emir', '/me with token');
r = await mf.dispatchFetch('http://w/me', { headers: { ...O, Authorization: 'Bearer ' + j.token.replace(/.$/, c => c === 'A' ? 'B' : 'A') } }); ok(r.status === 401, 'tampered token 401');
const forged = Buffer.from(JSON.stringify({ user: 'Emir', exp: Date.now() + 9e9 })).toString('base64url') + '.' + j.token.split('.')[1];
r = await mf.dispatchFetch('http://w/me', { headers: { ...O, Authorization: 'Bearer ' + forged } }); ok(r.status === 401, 'forged payload 401');
r = await mf.dispatchFetch('http://w/bar', { method: 'POST', headers: O, body: JSON.stringify({ text: 'x' }) }); ok(r.status === 401, 'bar without login 401');
r = await mf.dispatchFetch('http://w/bar', { method: 'POST', headers: A, body: JSON.stringify({ text: '  Versand 3 Tage \n\n Europa   5 Tage\n' }) });
const bar = await r.json(); ok(r.status === 200 && bar.text === 'Versand 3 Tage\nEuropa 5 Tage', 'bar saved: ' + JSON.stringify(bar.text));
const mset = calls.find(c => c[1].includes('metafieldsSet')); ok(mset && JSON.parse(mset[1]).variables.m[0].ownerId === 'gid://shopify/Shop/1', 'metafieldsSet on the shop');
ok(calls.some(c => c[0].endsWith('/oauth/access_token') && c[1].includes('grant_type=client_credentials')), 'client credentials grant used');
r = await mf.dispatchFetch('http://w/product', { method: 'POST', headers: A, body: JSON.stringify({ id: 'gid://shopify/Product/10885924946259', descriptionHtml: '<p onclick="x()">Retro <b>Polokragen</b><script>alert(1)</script></p><div style="color:red">Text</div><a href="javascript:alert(1)">böse</a><a href="https://azurclothing.com" target=_blank>gut</a><img src=x onerror=alert(1)>' }) });
const pj = await r.json(); ok(r.status === 200, 'product saved'); console.log('     cleaned: ' + pj.descriptionHtml);
ok(!/script|onclick|onerror|javascript|<img|<div|style/.test(pj.descriptionHtml), 'no scripts, handlers, bad links, images');
const tokCalls = calls.filter(c => c[0].endsWith('/oauth/access_token')).length; ok(tokCalls === 1, 'Shopify token cached (' + tokCalls + ' requests)');
for (let i = 0; i < 5; i++) await mf.dispatchFetch('http://w/login', { method: 'POST', headers: O, body: JSON.stringify({ user: 'x', password: 'y' }) });
r = await mf.dispatchFetch('http://w/login', { method: 'POST', headers: O, body: JSON.stringify({ user: 'emir', password: 'richtig-langes-passwort' }) }); ok(r.status === 429, 'after 5 wrong logins: wait (' + r.status + ')');
await mf.dispose();
