/* AZUR room: the still images a phone shows first (W4, A.config.stills), one per time of day.
   Serves the built page (tools/build_artifact.py -> azur/.cache/publish) as tools/test_room.cjs does, opens it as a phone
   (view rail_m), loads the full light passes and sets the clock to morning, day, evening and night in turn. For each it
   waits until the state's patches are in and the passes are mixed, then reads the mixed plate itself (no overlays, no
   parallax, no crop: the app lays the still where the canvas draws) and writes it as WebP, 1080 px wide (Pillow from
   /tmp/azur-venv), lowering the quality until it is at most 150 KB (not below q60; the value goes into stills.json).

   Usage:  node azur/tools/make_stills.cjs [publishDir] [outDir]        (defaults: azur/.cache/publish, azur/.cache/stills)
   Env:    PLAYWRIGHT, CHROMIUM as test_room.cjs; PYTHON (default /tmp/azur-venv/bin/python); PORT (default: any free one)
           STILL_HOURS='morning=7.8,day=13,evening=20,night=1' (reference-day hours, as the design panel's clock)
   The stills are not part of the repository or of the theme: D7 uploads them as Files (azr8-stills-still-<state>.webp)
   and sets A.config.stills in sections/azur-room.liquid. */
const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const pw = require(process.env.PLAYWRIGHT || (fs.existsSync('/opt/node-tools/node_modules/playwright') ? '/opt/node-tools/node_modules/playwright' : 'playwright'));
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '.cache', 'publish'));
const OUT = path.resolve(process.argv[3] || path.join(__dirname, '..', '.cache', 'stills'));
const PY = process.env.PYTHON || '/tmp/azur-venv/bin/python';
const WIDTH = 1080, MAX_BYTES = 150 * 1024, Q_START = 90, Q_MIN = 60;
const HOURS = Object.fromEntries((process.env.STILL_HOURS || 'morning=7.8,day=13,evening=20,night=1').split(',').map(x => x.split('=')).map(([k, v]) => [k.trim(), +v]));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary' };

function serve() {
  const page = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
    + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + '</body></html>';
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/' || u === '/_test.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(page); }
    const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(+process.env.PORT || 0, '127.0.0.1', () => r(srv)));
}

/* PNG (full plate) -> WebP 1080 wide, quality lowered in steps of 5 until it fits; prints "quality bytes width height". */
const PY_ENCODE = `
import sys, io
from PIL import Image
src, dst, width, max_bytes, q, q_min = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
im = Image.open(src).convert('RGB')
im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
while True:
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
    if b.tell() <= max_bytes or q <= q_min: break
    q = max(q_min, q - 5)
open(dst, 'wb').write(b.getvalue())
print(q, b.tell(), im.width, im.height)
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/_test.html?stills=`;   // the page as without stills
  const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
  const b = await pw.chromium.launch({ executablePath: exe, args: ['--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { view: 'rail_m', width: WIDTH, maxBytes: MAX_BYTES, made: new Date().toISOString().slice(0, 10), states: {} };
  let fails = 0;
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => { fails++; console.log('page error: ' + e.message); });
    await p.goto(url);
    await p.waitForFunction(() => window.AZUR && AZUR.app && AZUR.app.running && AZUR.app.viewKey === 'rail_m', null, { timeout: 60000 });
    // the full plates (the page starts on the small copies)
    const tier = await p.evaluate(async () => { const c = AZUR.app.comp, v = c.view; if (v.tier !== 'full') await c.upgrade(v, 'full'); await v.chain; return { tier: v.tier, w: v.texW, h: v.texH, plate: v.platePx }; });
    console.log('passes:', JSON.stringify(tier));
    out.plate = tier.plate;
    for (const [state, h] of Object.entries(HOURS)) {
      await p.evaluate(h => { AZUR.light.overrides.timeHours = h; AZUR.app.lightDirty = true; }, h);
      await p.waitForFunction(() => !AZUR.app.stateBusy && AZUR.app.dayState === AZUR.app.stateNow(), null, { timeout: 30000 });
      const got = await p.evaluate(async () => {
        const a = AZUR.app, c = a.comp, v = c.view, gl = c.gl;
        await v.chain;                                    // this state's rectangles are in the passes
        const l = AZUR.light.current();
        v.litKey = null; c.mix(l, v);                     // mixed now, at exactly this light
        const w = v.litW, h = v.litH, px = new Uint8Array(w * h * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, c.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, v.lit, 0);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);   // the mix stores the plate top row first
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(px.buffer), w, h), 0, 0);
        return { state: a.dayState, patched: !!v.patched, tier: v.tier, w, h, phase: l.phase, png: cv.toDataURL('image/png').split(',')[1] };
      });
      if (got.state !== state) { fails++; console.log(`FAIL ${state}: the clock at ${h} gives ${got.state}`); continue; }
      const tmp = path.join(OUT, `_still-${state}.png`), dst = path.join(OUT, `still-${state}.webp`);
      fs.writeFileSync(tmp, Buffer.from(got.png, 'base64'));
      const [q, bytes, w, hh] = execFileSync(PY, ['-I', '-c', PY_ENCODE, tmp, dst, WIDTH, MAX_BYTES, Q_START, Q_MIN].map(String)).toString().trim().split(' ').map(Number);
      fs.unlinkSync(tmp);
      out.states[state] = { hours: h, phase: got.phase, patched: got.patched, quality: q, bytes, size: [w, hh], from: [got.w, got.h], file: `still-${state}.webp` };
      if (bytes > MAX_BYTES) console.log(`NOTE ${state}: ${bytes} bytes at q${q} (over ${MAX_BYTES})`);
      console.log(`${state}: ${h} h (${got.phase}${got.patched ? ', state patches' : ''}) -> ${w}x${hh} q${q} ${(bytes / 1024).toFixed(1)} KB`);
    }
    fs.writeFileSync(path.join(OUT, 'stills.json'), JSON.stringify(out, null, 1) + '\n');
    console.log('written:', OUT);
  } catch (e) { fails++; console.log('FAIL ' + e.message.split('\n')[0]); }
  await b.close(); srv.close();
  process.exit(fails ? 1 : 0);
})();
