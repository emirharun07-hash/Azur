// Testet die App für Windows und Mac (Electron) unter Linux: lokal speichern, kleines Fenster, Kalender,
// Verbinden per Einladungscode und automatisch über das Kampagnen Board. Die Cloud ist ein kleiner Ersatz-Server,
// der die Supabase-Schnittstelle nachbildet (ohne Live-Kanal, die App fragt dann alle 5 Sekunden nach).
// Start: cd desktop && npm install && cd .. && node scripts/build.js && NODE_PATH=$(npm root -g) xvfb-run -a node test/desktop.test.js
const { _electron } = require('playwright');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DESK = path.join(ROOT, 'desktop');
const EXE = process.env.ELECTRON_PATH || require(path.join(DESK, 'node_modules', 'electron'));
const OUT = process.env.TEST_OUT || path.join(os.tmpdir(), 'termine-test');
fs.mkdirSync(OUT, { recursive: true });

const fail = [];
const ok = (cond, label) => { console.log((cond ? 'PASS ' : 'FAIL ') + label); if (!cond) fail.push(label); };

/* ---------- Ersatz für Supabase (PostgREST: kb_docs) ---------- */
const rows = new Map();
let down = false;
const server = http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Expose-Headers': 'Content-Range' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const u = new URL(req.url, 'http://x');
  if (down || !u.pathname.startsWith('/rest/v1/kb_docs')) { res.writeHead(down ? 503 : 404, cors); return res.end(down ? '{"message":"down"}' : ''); }
  if (req.headers.apikey !== 'test-key') { res.writeHead(401, { ...cors, 'Content-Type': 'application/json' }); return res.end('{"message":"Invalid API key"}'); }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const json = (code, data) => { res.writeHead(code, { ...cors, 'Content-Type': 'application/json' }); res.end(data === undefined ? '' : JSON.stringify(data)); };
    const eq = (k) => { const v = u.searchParams.get(k); return v && v.startsWith('eq.') ? v.slice(3) : null; };
    if (req.method === 'GET') {
      let list = [...rows.values()];
      const parent = eq('parent'); if (parent) list = list.filter((r) => r.parent === parent);
      const off = +(u.searchParams.get('offset') || 0), lim = +(u.searchParams.get('limit') || 1000);
      list = list.slice(off, off + lim);
      const cols = (u.searchParams.get('select') || '*').split(',');
      return json(200, list.map((r) => cols[0] === '*' ? r : Object.fromEntries(cols.map((c) => [c, r[c]]))));
    }
    if (req.method === 'POST') {
      const data = JSON.parse(body || '[]');
      for (const r of Array.isArray(data) ? data : [data]) rows.set(r.path, r);
      return json(201);
    }
    if (req.method === 'DELETE') { rows.delete(eq('path')); return json(204); }
    json(405, { message: 'nicht unterstützt' });
  });
});
server.on('upgrade', (_req, socket) => socket.destroy()); // kein Live-Kanal

const invite = (url, key) => 'KB1.' + Buffer.from(JSON.stringify({ u: url, k: key })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function launch(home) {
  const app = await _electron.launch({
    executablePath: EXE,
    args: ['--no-sandbox', DESK],
    env: { ...process.env, XDG_CONFIG_HOME: path.join(home, 'config'), TMPDIR: path.join(home, 'tmp'), TERMINE_TEST: '1', LANG: 'de_DE.UTF-8' },
  });
  const page = await app.firstWindow();
  page.on('pageerror', (e) => { console.log('page error:', e.message); fail.push('pageerror: ' + e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !/websocket|realtime|ERR_CONNECTION|Failed to load resource/i.test(m.text())) { console.log('console error:', m.text()); fail.push('console: ' + m.text()); } });
  await page.waitForSelector('#sync[data-state="local"], #sync[data-state="ok"], #sync[data-state="stale"]', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  return { app, page };
}
const winInfo = (app) => app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; return { b: w.getBounds(), top: w.isAlwaysOnTop() }; });

async function addEntry(page, title, date) {
  await page.click('#add');
  await page.fill('#f-title', title);
  await page.fill('#f-date', date);
  await page.click('#save');
  await page.waitForSelector('#dlg-entry:not([open])', { state: 'attached' });
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const URL_ = 'http://127.0.0.1:' + server.address().port;
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'termine-desk-'));

  /* ---------- A: nur auf diesem Computer ---------- */
  const homeA = path.join(base, 'a');
  fs.mkdirSync(path.join(homeA, 'tmp'), { recursive: true });
  let { app, page } = await launch(homeA);
  ok((await page.locator('#sync').innerText()).trim() === 'Nur auf diesem PC', 'local: status says only on this computer');
  ok(await page.locator('#mini').isVisible(), 'local: "Klein" button visible');
  ok(await page.locator('#open-share').isVisible(), 'local: "Gemeinsam nutzen" offered');
  ok(await page.evaluate(() => document.fonts.check('700 16px "Archivo"')), 'local: bundled Archivo font loads');
  await addEntry(page, 'LUCID Probe', '2026-12-21');
  ok(await page.locator('.row', { hasText: 'LUCID Probe' }).count() === 1, 'local: new entry shows');
  await page.screenshot({ path: path.join(OUT, 'desk-app.png') });

  // Kalender öffnen
  await page.locator('.row', { hasText: 'LUCID Probe' }).locator('.row__main').click();
  ok((await page.locator('#cal-file').innerText()) === 'Im Kalender öffnen', 'local: calendar button label');
  await page.click('#cal-file');
  await page.waitForSelector('#entry-msg:not([hidden])');
  const ics = fs.readFileSync(path.join(homeA, 'tmp', 'AZUR Termine', 'azur-termin-2026-12-21.ics'), 'utf8');
  ok(/SUMMARY:LUCID Probe/.test(ics) && /DTSTART;VALUE=DATE:20261221/.test(ics), 'local: .ics written for the calendar');
  await page.click('#cancel');

  // kleines Fenster
  const before = await winInfo(app);
  await page.click('#mini');
  await page.waitForTimeout(400);
  const small = await winInfo(app);
  ok(small.b.width === 360 && small.b.height === 540 && small.top, 'mini: 360x540 and always on top: ' + JSON.stringify(small));
  ok(await page.evaluate(() => document.body.classList.contains('compact')), 'mini: compact layout');
  ok((await page.locator('#mini').innerText()) === 'Groß', 'mini: button now says "Groß"');
  await page.screenshot({ path: path.join(OUT, 'desk-mini.png') });
  await page.click('#mini');
  await page.waitForTimeout(400);
  const back = await winInfo(app);
  ok(back.b.width === before.b.width && back.b.height === before.b.height && !back.top, 'mini: back to the big window');
  await page.click('#mini');
  await page.waitForTimeout(300);
  await app.close();

  // Neustart: Eintrag und kleines Fenster bleiben
  ({ app, page } = await launch(homeA));
  ok(await page.locator('.row', { hasText: 'LUCID Probe' }).count() === 1, 'restart: entry still there');
  const again = await winInfo(app);
  ok(again.b.width === 360 && again.top, 'restart: opens small again');
  await page.click('#mini');
  await page.waitForTimeout(300);

  /* ---------- B: verbinden per Einladungscode, Einträge mitnehmen ---------- */
  await page.click('#open-share');
  ok(await page.locator('#sh-move').isChecked(), 'share: "mitnehmen" offered and ticked');
  await page.fill('#sh-in', 'KB1.kaputt');
  await page.click('#dlg-share .btn--primary');
  ok(/unvollständig/.test(await page.locator('#dlg-share .msg').innerText()), 'share: broken code explained');
  await page.fill('#sh-in', invite(URL_, 'falsch'));
  await page.click('#dlg-share .btn--primary');
  await page.waitForFunction(() => /Schlüssel passt nicht/.test(document.querySelector('#dlg-share .msg').textContent));
  ok(true, 'share: wrong key explained');
  await page.screenshot({ path: path.join(OUT, 'desk-share.png') });
  await page.fill('#sh-in', invite(URL_, 'test-key'));
  await Promise.all([page.waitForEvent('load'), page.click('#dlg-share .btn--primary')]);
  await page.waitForSelector('#sync[data-state="ok"]', { timeout: 15000 });
  ok((await page.locator('#sync').innerText()).trim() === 'Gemeinsam', 'cloud: status says shared');
  ok([...rows.values()].some((r) => r.parent === 'azur-termine' && r.data.title === 'LUCID Probe'), 'cloud: local entry moved into the cloud');
  ok(await page.locator('.row', { hasText: 'LUCID Probe' }).count() === 1, 'cloud: entry shows after connecting');
  await addEntry(page, 'Neu in der Cloud', '2026-12-01');
  const r1 = [...rows.values()].find((r) => r.data.title === 'Neu in der Cloud');
  ok(r1 && r1.path.startsWith('azur-termine/') && r1.data.who === 'beide', 'cloud: new entry stored as azur-termine/<id>');
  await page.locator('.row', { hasText: 'Neu in der Cloud' }).locator('.check').click();
  await page.waitForTimeout(300);
  ok(rows.get(r1.path).data.done === true && rows.get(r1.path).data.title === 'Neu in der Cloud', 'cloud: tick keeps the other fields');
  await page.click('#open-share');
  const code = await page.inputValue('#sh-code');
  ok(code === invite(URL_, 'test-key'), 'cloud: shows the same invite code');
  await page.click('#dlg-share .btn--primary');
  await app.close();

  /* ---------- C: zweiter Computer, verbindet sich von selbst über das Kampagnen Board ---------- */
  const homeC = path.join(base, 'c');
  fs.mkdirSync(path.join(homeC, 'config', 'Kampagnen Board'), { recursive: true });
  fs.mkdirSync(path.join(homeC, 'tmp'), { recursive: true });
  fs.writeFileSync(path.join(homeC, 'config', 'Kampagnen Board', 'settings.json'), JSON.stringify({ me: { name: 'X' }, cloud: { url: URL_, key: 'test-key' } }));
  ({ app, page } = await launch(homeC));
  await page.waitForSelector('#sync[data-state="ok"]', { timeout: 15000 });
  ok(await page.locator('.row', { hasText: 'LUCID Probe' }).count() === 1, 'auto: connected through the Kampagnen Board, sees the entries');
  // Änderung vom anderen Computer kommt an
  rows.set('azur-termine/fremd1', { path: 'azur-termine/fremd1', parent: 'azur-termine', data: { title: 'Vom anderen Computer', date: '2026-11-20', time: '', kind: 'termin', who: 'talha', note: '', done: false }, updated_at: new Date().toISOString() });
  await page.waitForSelector('.row:has-text("Vom anderen Computer")', { timeout: 12000 });
  ok(true, 'auto: change from the other computer shows up');
  // Zeilen des Kampagnen Boards stören nicht
  rows.set('boards/b1', { path: 'boards/b1', parent: 'boards', data: { name: 'Board' }, updated_at: new Date().toISOString() });
  await page.waitForTimeout(5500);
  ok(await page.locator('.row').count() === 2, 'auto: Kampagnen Board rows are ignored');
  await page.click('#open-share');
  ok(/vom Kampagnen Board/.test(await page.locator('#share-box').innerText()), 'auto: dialog names where the connection comes from');
  await page.click('#dlg-share .btn--primary');

  // Cloud weg
  down = true;
  await page.waitForSelector('#sync[data-state="stale"]', { timeout: 12000 });
  ok(/Keine Verbindung zu eurer Cloud/.test(await page.locator('#notice').innerText()), 'down: notice explains it');
  await page.screenshot({ path: path.join(OUT, 'desk-down.png') });
  down = false;
  await page.waitForSelector('#sync[data-state="ok"]', { timeout: 12000 });
  ok(true, 'down: comes back by itself');

  // trennen
  await page.click('#open-share');
  await page.click('#share-box .link--late');
  await Promise.all([page.waitForEvent('load'), page.click('#sh-off-yes')]);
  await page.waitForSelector('#sync[data-state="local"]', { timeout: 15000 });
  ok(true, 'disconnect: back to this computer only, no auto-connect again');
  await app.close();

  server.close();
  console.log(fail.length ? '\nFAILED: ' + fail.length : '\nALL PASSED');
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
