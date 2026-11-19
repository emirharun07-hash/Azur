#!/usr/bin/env node
// Misst Ladegewicht und Tempo je Seite (Handy 390x844), ungedrosselt und gedrosselt (4G, CPU x4).
// Aufruf: node azur/tools/measure_weight.cjs <basis-url> <ausgabe.json> <pfad> [<pfad> ...]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');

const TYPES = ['html', 'css', 'js', 'image', 'font', 'video', 'other'];
function typeOf(url, ct, rt) {
  ct = (ct || '').toLowerCase();
  if (rt === 'document' || ct.includes('text/html')) return 'html';
  if (ct.includes('css') || rt === 'stylesheet') return 'css';
  if (ct.includes('javascript') || ct.includes('ecmascript') || rt === 'script') return 'js';
  if (ct.startsWith('image/') || rt === 'image') return 'image';
  if (ct.includes('font') || /\.(woff2?|ttf|otf)(\?|$)/.test(url) || rt === 'font') return 'font';
  if (ct.startsWith('video/') || ct.startsWith('audio/') || rt === 'media') return 'video';
  return 'other';
}
const emptyBy = () => Object.fromEntries(TYPES.map((t) => [t, 0]));

async function run(browser, base, path, throttled) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (throttled) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 170,
      downloadThroughput: (9 * 1000 * 1000) / 8, uploadThroughput: (1.5 * 1000 * 1000) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  const files = [];
  let t0 = Date.now();
  const pending = [];
  page.on('response', (resp) => {
    const p = (async () => {
      const req = resp.request();
      const url = resp.url();
      const h = resp.headers();
      let bytes = 0;
      try { bytes = (await resp.body()).length; }
      catch (e) { bytes = parseInt(h['content-length'] || '0', 10) || 0; }
      files.push({
        url, bytes, type: typeOf(url, h['content-type'], req.resourceType()),
        t: Date.now() - t0, status: resp.status(),
      });
    })();
    pending.push(p);
  });
  await page.addInitScript(() => {
    window.__m = { lcp: null, running: null };
    try {
      new PerformanceObserver((l) => {
        const e = l.getEntries(); const last = e[e.length - 1];
        window.__m.lcp = { t: last.startTime, el: last.element ? last.element.tagName : null, url: last.url || null };
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
    const t = setInterval(() => {
      if (window.AZUR && AZUR.app && AZUR.app.running) { window.__m.running = performance.now(); clearInterval(t); }
    }, 50);
  });
  let loadT = null;
  page.on('load', () => { loadT = Date.now() - t0; });
  t0 = Date.now();
  try { await page.goto(base + path, { waitUntil: 'load', timeout: 120000 }); }
  catch (e) { /* weiter mit dem, was da ist */ }
  if (loadT === null) loadT = Date.now() - t0;
  await Promise.allSettled(pending.slice());
  const snap = (limit) => {
    const by = emptyBy(); let n = 0, total = 0;
    for (const f of files) if (limit === null || f.t <= limit) { by[f.type] += f.bytes; n++; total += f.bytes; }
    return { bytes: total, requests: n, by_type: by };
  };
  const atLoad = snap(loadT);
  const wait5 = Math.max(0, 5000 - (Date.now() - t0));
  await page.waitForTimeout(wait5);
  await Promise.allSettled(pending.slice());
  const at5 = snap(5000);
  const wait10 = Math.max(0, 10000 - (Date.now() - t0));
  await page.waitForTimeout(wait10);
  await Promise.allSettled(pending.slice());
  const all = snap(null);
  const m = await page.evaluate(() => window.__m).catch(() => ({}));
  const top = files.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 10)
    .map((f) => ({ url: f.url.replace(/^https?:\/\/[^/]+/, ''), bytes: f.bytes, type: f.type }));
  await ctx.close();
  return {
    throttled, load_ms: loadT, bytes_until_load: atLoad, bytes_in_5s: at5, bytes_total_10s: all,
    lcp_ms: m && m.lcp ? Math.round(m.lcp.t) : null, lcp_element: m && m.lcp ? (m.lcp.url || m.lcp.el) : null,
    app_running_ms: m && m.running ? Math.round(m.running) : null, top10: top,
  };
}

(async () => {
  const [base, out, ...paths] = process.argv.slice(2);
  if (!base || !out || !paths.length) {
    console.error('Aufruf: node measure_weight.cjs <basis-url> <ausgabe.json> <pfad> [<pfad> ...]');
    process.exit(2);
  }
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const result = {};
  for (const p of paths) {
    result[p] = {};
    for (const throttled of [false, true]) {
      const r = await run(browser, base, p, throttled);
      result[p][throttled ? 'throttled' : 'free'] = r;
      console.log(p, throttled ? 'gedrosselt' : 'frei', 'load', (r.bytes_until_load.bytes / 1024).toFixed(0) + 'KB',
        '5s', (r.bytes_in_5s.bytes / 1024).toFixed(0) + 'KB', 'lcp', r.lcp_ms, 'running', r.app_running_ms);
    }
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
})();
