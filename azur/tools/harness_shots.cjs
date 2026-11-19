/* AZUR: screenshots of the test shop (tools/theme_harness.py) at 1440 and 390 wide, plus shots.json with the checks.

   Usage:  node azur/tools/harness_shots.cjs <base-url> <output-dir> <path> [<path> ...]
   Env:    PLAYWRIGHT=<path to the playwright module>  CHROMIUM=<path to chrome>   (defaults: the cloud container's)
   Per path: <name>_1440.png and <name>_390.png (name = path with / turned into _, "/" = "home"), fullPage false.
   shots.json: per page the HTTP status, the page errors, the transferred bytes and whether AZUR.app.running (if window.AZUR exists).
   Exit code 1 on HTTP != 200 or a page error. */
const fs = require('fs'), path = require('path');
const pw = require(process.env.PLAYWRIGHT || (fs.existsSync('/opt/node-tools/node_modules/playwright') ? '/opt/node-tools/node_modules/playwright' : 'playwright'));
const [base, outDir, ...paths] = process.argv.slice(2);
if (!base || !outDir || !paths.length) { console.error('usage: node harness_shots.cjs <base-url> <output-dir> <path> [<path> ...]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
const VIEWS = [['1440', { viewport: { width: 1440, height: 810 } }], ['390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]];
const nameOf = p => (p === '/' ? 'home' : p.replace(/^\/+/, '').replace(/[^A-Za-z0-9._-]+/g, '_')) || 'home';

(async () => {
  const b = await pw.chromium.launch({ executablePath: exe, args: ['--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const report = []; let bad = 0;
  for (const pth of paths) {
    for (const [w, opts] of VIEWS) {
      const entry = { path: pth, width: Number(w), status: null, pageErrors: [], bytes: 0, running: null };
      const ctx = await b.newContext({ deviceScaleFactor: 1, ...opts }), p = await ctx.newPage();
      p.on('pageerror', e => entry.pageErrors.push(String(e.message).split('\n')[0]));
      const pending = [];
      p.on('response', r => pending.push(r.body().then(x => { entry.bytes += x.length; }).catch(() => { })));
      try {
        const r = await p.goto(base.replace(/\/$/, '') + pth, { waitUntil: 'load', timeout: 60000 });
        entry.status = r ? r.status() : null;
        await p.waitForTimeout(5000);
        entry.running = await p.evaluate(() => (window.AZUR ? !!(AZUR.app && AZUR.app.running) : null)).catch(() => null);
        await p.screenshot({ path: path.join(outDir, `${nameOf(pth)}_${w}.png`), fullPage: false });
      } catch (e) { entry.pageErrors.push('navigation: ' + String(e.message).split('\n')[0]); }
      await Promise.all(pending);
      if (entry.status !== 200 || entry.pageErrors.length) bad++;
      report.push(entry); await ctx.close();
    }
  }
  await b.close();
  fs.writeFileSync(path.join(outDir, 'shots.json'), JSON.stringify(report, null, 2));
  for (const e of report) console.log(`${e.status} ${e.path} @${e.width} errors=${e.pageErrors.length} bytes=${e.bytes} running=${e.running}`);
  console.log(bad ? `${bad} page(s) with problems` : 'shots ok');
  process.exit(bad ? 1 : 0);
})();
