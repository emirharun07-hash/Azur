/* AZUR — app: views, camera moves, pointer, phones, window, header, loop.
   Desktop starts in the room (establishing shot). A click on a jersey opens its product view right away (half the
   page the jersey to turn and zoom, half the page to buy); hovering shows a small label. The bed and the rail light
   up in white when the pointer is on them and take the camera there; white dots invite the click. The magazine on
   the duvet opens ANSTOSS. Phones start at the rail and swipe along it. The room follows the visitor's clock:
   light passes mix by the hour, and the things in the room change with the time of day. */
(function () {
  const A = window.AZUR = window.AZUR || {};
  const $ = (s, r = document) => r.querySelector(s);
  const fetchJSON = url => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const getJSON = p => (A.config.inline && A.config.inline[p]) ? Promise.resolve(A.config.inline[p]) : fetchJSON(A.url(p));
  const lin2srgb = c => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  const DEPTH = { near: 0.4, far: 6.5 };
  const CAM_DEPTH = 0.1;     // Runde 20: how far near things lift over the first screen of scrolling (uv, see frame())

  class App {
    async init() {
      const cfg = A.config;
      this.root = $('#azur'); this.stage = $('.azur-stage'); this.world = $('.azur-world');
      this.canvas = $('.azur-canvas'); this.fallbackImg = $('.azur-fallback'); this.layer = $('.azur-layer');
      this.snap = $('.azur-snap'); this.snapCtx = this.snap.getContext('2d');
      this.reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
      this.reduced = this.reducedQuery.matches;
      this.isMobile = matchMedia(cfg.mobileQuery).matches;
      this.coarse = matchMedia('(pointer: coarse)').matches;      // touch screens (phones, iPads): lighter drawing
      this.root.classList.toggle('is-mobile', this.isMobile);
      this.applyPalette();

      // the room through the day: jerseys on real hangers in the renders, hover outlines, states by the hour
      const base = cfg.assetBase;
      [this.views, this.passes, this.moves, this.outside] = await Promise.all([getJSON(base + 'views.json'), getJSON(base + 'passes.json'),
        getJSON(base.replace(/views\/$/, 'moves/') + 'moves.json'), getJSON(base.replace(/views\/$/, 'outside/') + 'outside.json')]);
      this.comp = new A.Compositor(this.canvas);
      this.comp.viewsData = this.views; this.comp.onChange = () => this.kick();
      this.root.classList.toggle('no-webgl', !this.comp.ok);
      this.glowAmt = [0, 0, 0]; this.region = null;
      this.dayState = this.stateNow();
      this.comp.state = this.dayState; this.root.dataset.state = this.dayState;
      this.rail = new A.Rail(this.layer, A.products, this);
      this.drop = new A.Drop(this.layer, this);
      this.shop = new A.Shop(this);
      this.mag = A.Mag ? new A.Mag(this) : null;
      this.depthMaps = {};
      this.parallax = [0, 0]; this.parallaxTarget = [0, 0];
      this.pan = 0.5; this.panVel = 0;
      this.light = A.light.current();
      this.buildChrome();
      if (cfg.shopify) this.bindScrollAway();
      this.bindPointer(); this.bindKeys();
      // phones fire resize while the address bar comes and goes during a scroll: at most once a frame, and only when
      // the stage really changed size (the room is 100svh, so mostly it did not)
      let rq = false;
      window.addEventListener('resize', () => {
        if (rq) return; rq = true;
        requestAnimationFrame(() => {
          rq = false; const k = this.stage.clientWidth + 'x' + this.stage.clientHeight + '@' + this.dpr();
          if (k !== this.sizeKey) { this.sizeKey = k; this.resize(); }
        });
      });
      // the room counts as gone once less than a sixth of it shows (a strip behind the header is not worth drawing)
      if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => {
        this.offscreen = !en.isIntersecting || en.intersectionRatio < 0.15;
        if (this.video && this.offscreen && !this.video.paused) {
          this.clipEnded(this.video);                                  // never leave the boy frozen mid-run
        }
        if (!this.offscreen) this.kick();
      }, { threshold: [0, 0.15] }).observe(this.root);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
      this.reducedQuery.addEventListener && this.reducedQuery.addEventListener('change', e => { this.reduced = e.matches; });
      if (A.Panel) this.panel = new A.Panel(this);

      const start = this.isMobile ? cfg.startView.mobile : cfg.startView.desktop;
      await this.enterView(start);
      this.root.classList.add('is-ready');
      this.lastT = performance.now(); this.lightAt = 0; this.running = true;
      this.light = A.light.current(); this.rail.applyLight(this.light); this.applyAmbient();
      requestAnimationFrame(t => this.frame(t));
      setTimeout(() => this.showHint(), this.reduced ? 200 : 1600);
      const up = v => v && v.upgrade && v.upgrade();
      setTimeout(() => this.atRoom(() => up(this.comp.view)), 900);   // published builds start on smaller copies
      // other views load in the background so camera moves never wait (each view is 8 textures: phones load on demand,
      // desktops skip the phone plate). Runde 20: only while the visitor is at the room, not once they scrolled to the shop
      if (!this.isMobile) setTimeout(() => this.atRoom(() => Object.keys(cfg.views).forEach(k => k !== start && k !== 'rail_m' && this.comp.load(k, this.passes, false).then(() => { this.loadDepth(k); setTimeout(() => this.atRoom(() => up(this.comp.cache[k])), 1500); }))), 2500);
      setTimeout(() => this.atRoom(() => this.preloadMoves()), 6000);
      this.handleHash();
      window.addEventListener('hashchange', () => this.handleHash());    // links inside the page (#bett, #anstoss, a jersey)
    }

    /* Background downloads (sharper copies, the other views, the flights) only while the room is on screen: someone who
       scrolled on to the shop does not need them; they start once the visitor is back at the top. */
    atRoom(fn) { if (!this.diving) fn(); else setTimeout(() => this.atRoom(fn), 2000); }

    /* ---------------------------------------------------------------- times of day */
    stateNow() {
      const o = A.light.overrides, d = new Date();
      const h = o && o.timeHours != null ? o.timeHours : d.getHours() + d.getMinutes() / 60;
      const list = A.config.dayStates || []; let st = list.length ? list[list.length - 1].state : 'day';
      list.forEach(e => { if (h >= e.from) st = e.state; });
      return st;
    }
    /* The room changes while it is open (or the design panel's clock moves): the change crossfades. */
    async changeState(st) {
      if (st === this.dayState || this.stateBusy) return;
      this.stateBusy = true; this.dayState = st; this.root.dataset.state = st;
      const fade = !this.reduced && !this.busy && this.comp.ok && this.root.classList.contains('is-ready');
      if (fade) {
        this.comp.render(this.light); this.comp.snapshotInto(this.snapCtx);
        Object.assign(this.snap.style, { transform: '', filter: '', opacity: '1' }); this.snap.hidden = false;
      }
      await this.comp.setState(st);
      this.comp.render(this.light); this.placeChrome(); this.setTease(); this.kick();
      if (fade) { await this.snap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-in-out' }).finished.catch(() => { }); this.snap.hidden = true; }
      this.stateBusy = false;
      if (this.root.classList.contains('is-ready')) this.atRoom(() => this.preloadMoves());      // the flights of this time of day
    }

    /* The line under the bed view: at night the magazine has slid off the duvet onto the floor. */
    setTease() {
      const c = A.config.copy, night = this.dayState === 'night';
      if (this.tease) this.tease.textContent = night && c.bedTeaseNight ? c.bedTeaseNight : c.bedTease;
    }

    applyPalette() {
      if (A.config.shopify) return;                   // the theme CSS carries palette A, scoped to the room
      const p = A.config.palettes[A.config.palette], r = document.documentElement.style;
      r.setProperty('--glow', p.glow); r.setProperty('--highlight', p.highlight); r.setProperty('--ink', p.ink); r.setProperty('--night', p.night);
    }

    /* ---------------------------------------------------------------- views */
    /* View data; a chosen-garment view ('rail@2') is its rail view with that garment where the pull move left it. */
    viewData(key) {
      if (this.views[key]) return this.views[key];
      const [base, idx] = key.split('@'), bv = this.views[base] || {};
      if (idx == null) return bv;
      const mv = this.moves && this.moves[`${base}-${key}`], last = mv && mv.track && mv.track[mv.track.length - 1];
      const slots = (bv.slots || []).slice();
      if (last && last.slots && last.slots[+idx]) slots[+idx] = last.slots[+idx];
      return Object.assign({}, bv, { slots });
    }

    async enterView(key) {
      const prevBase = (this.viewKey || '').split('@')[0];
      this.viewKey = key;
      this.useClip(key);
      const v = this.viewData(key);
      const mode = await this.comp.load(key, this.passes);
      if (this.comp.view && !this.comp.view.size && v.res) this.comp.view.size = v.res.slice();   // plate not rendered yet: keep its geometry
      // a view loaded on demand (phones, narrow windows: no background loading) swaps its small copies for sharp ones too
      const cv = this.comp.view; if (cv && cv.upgrade) setTimeout(() => cv.upgrade && cv.upgrade(), 600);
      this.root.dataset.view = key; this.root.dataset.mode = mode;
      this.fallbackImg.hidden = !(mode === 'beauty' && !this.comp.ok);
      if (!this.comp.ok && mode === 'beauty') this.fallbackImg.src = A.url(A.config.assetBase + key + '/beauty.webp');
      this.root.classList.toggle('is-missing', mode === 'none');
      await this.loadDepth(key);
      const slots = v.slots || [];
      const avgDepth = slots.length ? slots.reduce((s, x) => s + x.depth, 0) / slots.length : 2.5;
      this.comp.focus = this.encDepth(avgDepth);
      if (!(key.startsWith('rail_m') && prevBase === 'rail_m')) this.pan = key.startsWith('rail_m') ? 0.38 : 0.5;
      this.rail.layout(key, v, this.comp);
      this.rail.setSelected(-1); this.rail.setHover(-1);
      this.drop.close();
      this.updateChips();
      this.resize();
    }

    /* Fake camera move: the current frame pushes toward the target and blurs, the next view settles in. */
    async go(to, opts = {}) {
      if (this.busy) {                     // a flight is on: the newest wish waits for it to land (the magazine asked
        this.nextGo = to; await this.flight;   // for mid-flight, a chip clicked during a move); older wishes are dropped
        if (this.nextGo !== to) return;
        this.nextGo = null; return this.go(to, opts);
      }
      if (to === this.viewKey) { if (opts.select != null) this.select(opts.select); return; }
      const fromBase = this.viewKey.split('@')[0];
      if (this.viewKey.includes('@') && to !== fromBase && !to.startsWith(fromBase + '@')) {
        this.rail.setSelected(-1); this.root.classList.remove('has-selection');
        await this.go(fromBase);                                   // hang the garment back first
        return this.go(to, opts);
      }
      this.busy = true; this.hideHint();
      let land; this.flight = new Promise(r => { land = r; });
      try { await this.fly(to, opts); }
      finally {                                       // a failed load must never leave the room stuck in flight
        this.busy = false; land();
        this.root.classList.remove('is-loading', 'is-flying'); this.layer.classList.remove('is-moving');
      }
      if (opts.select != null) setTimeout(() => this.select(opts.select), this.reduced ? 0 : 120);
      this.kick();
    }

    /* The camera move itself (go() keeps one at a time). */
    async fly(to, opts) {
      const from = this.viewKey, back = to === 'room';
      const focus = opts.focus || [this.stage.clientWidth / 2, this.stage.clientHeight / 2];
      const slow = setTimeout(() => this.root.classList.add('is-loading'), 250);   // a view not loaded yet (phones load on demand)
      await this.comp.load(to, this.passes, false);
      clearTimeout(slow); this.root.classList.remove('is-loading');
      const mv = this.findMove(from, to);
      if (mv && !this.reduced) {
        await this.playMove(mv, to);
      } else if (!this.reduced && from.split('@')[0] === to.split('@')[0]) {
        // a garment taken off / put back without rendered frames yet: a short crossfade
        this.comp.render(this.light); this.comp.snapshotInto(this.snapCtx);
        Object.assign(this.snap.style, { transform: '', filter: '', opacity: '1' }); this.snap.hidden = false;
        await this.enterView(to); this.comp.render(this.light);
        await this.snap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' }).finished.catch(() => { });
        this.snap.hidden = true;
      } else if (this.reduced) {
        await this.enterView(to);
        this.world.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
      } else await this.blendMove(to, back, focus, from.split('@')[0]);
    }

    /* Change of view without rendered frames (round 9, the default): the room's own picture carries the move, so the
       light never changes with the view. The next view gets ready under a still copy of this one (all the work done
       while nothing moves), then only transform and opacity animate: the copy zooms toward the target and fades, the
       new view settles from a little closer (forward) or further in (back). Nothing scales below the stage, no blur. */
    async blendMove(to, back, focus, fromBase) {
      const m = A.config.motion.pan, W = this.stage.clientWidth;
      this.comp.render(this.light); this.comp.snapshotInto(this.snapCtx);
      Object.assign(this.snap.style, { transform: '', filter: '', opacity: '1', transformOrigin: `${focus[0]}px ${focus[1]}px` });
      this.snap.hidden = false; this.layer.classList.add('is-moving'); this.root.classList.add('is-flying');   // labels wait for the landing
      await this.enterView(to); this.comp.render(this.light);
      // back in the room: it pulls back from where the view we come from sits in it (its dot)
      const dot = back && this.dots && this.dots[fromBase === 'rail_m' ? 'rail' : fromBase];
      const at = dot && !dot.hidden ? [parseFloat(dot.style.left), parseFloat(dot.style.top)] : focus;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // the new view is on screen under the copy
      this.comp.hold = true;
      // forward the copy accelerates toward the target (ease-in) and dissolves while it moves fastest; back it drifts
      // a little and dissolves early, while the room pulls back from the spot we come from (ease-out)
      const dx = (back ? 1 : -1) * m.drift * (focus[0] - W / 2), opt = e => ({ duration: m.ms, easing: e, fill: 'forwards' });
      const anims = [
        this.snap.animate([{ transform: 'none' }, { transform: `translate3d(${dx.toFixed(1)}px,0,0) scale(${back ? m.settle : m.zoom})` }],
          opt(back ? 'cubic-bezier(.2,.6,.3,1)' : 'cubic-bezier(.55,0,.85,.45)')),
        this.snap.animate(back ? [{ opacity: 1 }, { opacity: 1, offset: 0.12, easing: 'ease-in-out' }, { opacity: 0, offset: 0.6 }, { opacity: 0 }]
          : [{ opacity: 1 }, { opacity: 1, offset: 0.32, easing: 'ease-in-out' }, { opacity: 0, offset: 0.78 }, { opacity: 0 }], opt('linear'))];
      this.world.style.transformOrigin = `${at[0]}px ${at[1]}px`;
      anims.push(this.world.animate([{ transform: `scale(${back ? m.back : m.settle})` }, { transform: 'none' }], opt('cubic-bezier(.2,.6,.25,1)')));
      await Promise.all(anims.map(x => x.finished)).catch(() => { });
      anims.forEach(x => x.cancel());
      this.snap.hidden = true; this.world.style.transformOrigin = '';
      this.comp.hold = false; this.layer.classList.remove('is-moving'); this.root.classList.remove('is-flying');
    }

    /* ---------------------------------------------------------------- rendered camera flights (flights: 'video')
       scene/render_moves.py: 60 frames a second with motion blur, <set>.mp4/.webm forward and <set>_r the way back.
       One set for the hour (day, golden hour or night), graded to the views at both ends; only that set loads. */
    flightPrefix(name) {
      const m = this.moves[name], have = v => (m.variants || []).includes(v);
      if (Math.min(1, (this.light.night - 0.08) / 0.7) > 0.5 && have('night')) return 'n';
      return this.dayState === 'evening' && have('evening') ? 'e' : have('day') ? 'f' : have('night') ? 'n' : null;
    }
    moveVideo(name, pre, rev) {
      const key = `${name}:${pre}${rev ? '_r' : ''}`; this.moveVids = this.moveVids || {};
      if (!this.moveVids[key]) {
        const base = A.config.assetBase.replace(/views\/$/, 'moves/') + name + '/' + pre + (rev ? '_r' : '');
        const vid = document.createElement('video');
        Object.assign(vid, { muted: true, playsInline: true, preload: 'auto' });
        vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true');
        [[base + '.mp4', 'video/mp4'], [base + '.webm', 'video/webm']].forEach(([f, t]) => {
          const so = document.createElement('source'); so.src = A.url(f); so.type = t; vid.appendChild(so); });
        Object.assign(vid.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0', maxWidth: 'none' });
        vid.load(); this.moveVids[key] = vid;
      }
      return this.moveVids[key];
    }
    videoReady(vid) {
      if (!vid || vid.error) return false;
      if (vid.readyState >= 4) return true;
      try { return vid.readyState >= 2 && vid.buffered.length > 0 && vid.duration > 0 && vid.buffered.end(vid.buffered.length - 1) >= vid.duration - 0.05; }
      catch (e) { return false; }
    }
    flightLayer() {
      if (!this.flightBox) {
        const box = document.createElement('div'); box.className = 'azur-flight'; box.hidden = true; box.setAttribute('aria-hidden', 'true');
        Object.assign(box.style, { position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '30', pointerEvents: 'none' });
        const tint = document.createElement('div');
        Object.assign(tint.style, { position: 'absolute', inset: '0', mixBlendMode: 'multiply', backgroundColor: 'rgb(255,255,255)' });
        box.appendChild(tint); this.snap.after(box); this.flightBox = box; this.flightTint = tint;
      }
      return this.flightBox;
    }
    preloadMoves() {
      if (A.config.flights !== 'video') return;
      Object.keys(this.moves || {}).forEach(name => {
        if (this.isMobile !== name.startsWith('rail_m-') || !this.moves[name].video) return;
        const pre = this.flightPrefix(name);
        if (pre) { this.moveVideo(name, pre, false); this.moveVideo(name, pre, true); }
      });
    }
    findMove(from, to) {
      if (A.config.flights !== 'video') return null;
      const ready = name => {
        const m = this.moves && this.moves[name]; if (!m || !m.video) return false;
        const pre = this.flightPrefix(name);
        return !!pre && this.videoReady(this.moveVideo(name, pre, name !== `${from}-${to}`));
      };
      if (ready(`${from}-${to}`)) return { name: `${from}-${to}`, reverse: false };
      if (ready(`${to}-${from}`)) return { name: `${to}-${from}`, reverse: true };
      return null;
    }
    async playMove(mv, to) {
      const m = this.moves[mv.name], pre = this.flightPrefix(mv.name), vid = this.moveVideo(mv.name, pre, mv.reverse);
      const box = this.flightLayer(), tint = this.flightTint;
      const W = this.stage.clientWidth, H = this.stage.clientHeight;
      // the plates' crop: cover the stage, pan, overscan (as playMove's cover())
      const vw = vid.videoWidth || m.res[0], vh = vid.videoHeight || m.res[1];
      const os = 1 / (1 + (this.comp.overscan || 0)), pan = this.comp.pan, ia = vw / vh, ca = W / H;
      let sw = vw, sh = vh; if (ca > ia) sh = sw / ca; else sw = sh * ca; sw *= os; sh *= os;
      const sx = (vw - sw) * pan, sy = (vh - sh) / 2, k = W / sw;
      Object.assign(vid.style, { width: vw * k + 'px', height: vh * k + 'px', transform: `translate3d(${-sx * k}px,${-sy * k}px,0)` });
      if (vid.parentNode !== box) box.insertBefore(vid, tint);
      // the light: graded at both ends to the views as the compositor shows them now (round 6), from the average colour
      // of the first and last frames (moves.json); brightness lifts, a multiplied tint sets the colour
      const ends = (m.ends || {})[pre] || {}, mS = mv.reverse ? ends.last : ends.first, mE = mv.reverse ? ends.first : ends.last;
      const gainOf = (vm, fm) => vm && fm ? vm.map((x, i) => Math.min(2.5, Math.max(0.3, (x + 1e-3) / (fm[i] + 1e-3)))) : null;
      const from = this.comp.view && this.comp.view.key;
      const gS = gainOf(from && this.comp.meanColor(from, this.light), mS), gE = gainOf(this.comp.meanColor(to, this.light), mE) || gS || [1, 1, 1];
      const g0 = gS || gE;
      this.moveGrade = { start: gS, end: gE };          // for tests (tools/test_room.cjs)
      const look = g => { const gm = Math.max(1, g[0], g[1], g[2]);
        return [`brightness(${gm.toFixed(3)})`, `rgb(${g.map(x => Math.round(Math.min(1, x / gm) * 255)).join(',')})`]; };
      const [f0, t0] = look(g0), [f1, t1] = look(gE);
      vid.style.filter = f0; tint.style.backgroundColor = t0;
      try { vid.pause(); if (vid.currentTime > 0.001) vid.currentTime = 0; } catch (e) { }
      box.hidden = false;
      await box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => { });
      this.covered = true; this.comp.hold = true;         // the room under the video needs no drawing meanwhile
      const dur = Math.max(200, ((vid.duration && isFinite(vid.duration)) ? vid.duration : m.frames / (m.fps || 60)) * 1000);
      let anims = [];
      const ended = new Promise(res => { vid.onended = res; setTimeout(res, dur + 2000); });
      try {
        await vid.play();
        anims = [vid.animate([{ filter: f0 }, { filter: f1 }], { duration: dur, fill: 'forwards' }),
                 tint.animate([{ backgroundColor: t0 }, { backgroundColor: t1 }], { duration: dur, fill: 'forwards' })];
        await ended;
      } catch (e) { }                                     // no playback (a blocked autoplay): land without the flight
      this.covered = false; this.comp.hold = false;
      await this.enterView(to);
      this.comp.render(this.light);
      await box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => { });
      box.hidden = true; box.getAnimations().forEach(a => a.cancel()); anims.forEach(a => a.cancel());
      vid.onended = null; vid.pause(); try { vid.currentTime = 0; } catch (e) { }
    }
    updateChips() {
      this.chips.querySelectorAll('button').forEach(b => {
        const vk = this.viewKey.split('@')[0];
        const on = b.dataset.view === vk || (b.dataset.view === 'rail' && vk === 'rail_m');
        b.setAttribute('aria-current', on ? 'true' : 'false');
      });
      this.tease.classList.toggle('is-on', this.viewKey === 'bed');
      this.setRegion(null);
    }

    /* ---------------------------------------------------------------- selection + products */
    /* A jersey taken off the rail (its posed view 'rail@i', when rendered) with its line underneath; -1 hangs it back. */
    async select(i) {
      const railKey = this.isMobile ? 'rail_m' : 'rail';
      this.hideHint();
      if (i >= 0 && this.viewKey === 'room') {
        const rect = this.rail.garmentRect(i);
        return this.go(railKey, { select: i, focus: rect ? [rect.left + rect.width / 2, rect.top + rect.height * 0.4] : null });
      }
      if (this.busy) return;
      let target = i >= 0 ? `${railKey}@${i}` : railKey;
      const ps = this.passes && this.passes[target];
      if (i >= 0 && !(ps && Object.keys(ps).length >= 7)) target = railKey;   // pose not rendered yet: select on the rail as it hangs
      if (this.viewKey === target && (target.includes('@') || this.rail.selected === i)) return;
      this.rail.setSelected(-1); this.rail.setHover(-1); this.root.classList.remove('has-selection');
      if (i < 0) this.drop.close();                                   // the drop card goes with its selection (no view change here)
      if (i >= 0 && this.viewKey !== railKey) await this.go(railKey);      // another one is out: hang it back first
      if (i >= 0 && railKey === 'rail_m') { const sp = this.panFor(i); if (sp != null) await this.panTo(sp); }   // phones: centre it first
      await this.go(target);
      if (i >= 0 && this.viewKey === target) { this.rail.setSelected(i); this.root.classList.add('has-selection'); }
      this.kick();
    }
    panTo(target, ms = 320) {
      return new Promise(res => {
        const p0 = this.pan, t0 = performance.now();
        const step = now => {
          const t = this.reduced ? 1 : Math.min(1, (now - t0) / ms), e = t * t * (3 - 2 * t);
          this.pan = p0 + (target - p0) * e; this.snapPan = this.pan; this.kick();
          if (t < 1) requestAnimationFrame(step); else { this.snapPan = target; res(); }
        };
        requestAnimationFrame(step);
      });
    }
    /* Garment under a stage point: reads the rendered id mask of the current view. -1 = none. */
    garmentAt(x, y) {
      const cv = this.comp.view; if (!cv) return -1;
      // a posed view (rail@i) reads its rail's mask for the garments still hanging; the posed one is found by its box
      const posed = cv.key.includes('@'), v = posed ? this.comp.cache[cv.key.split('@')[0]] : cv;
      if (posed) {
        const sel = this.rail.selected, p = this.rail.px && this.rail.px[sel];
        if (p && x > p.x - p.w * 0.62 && x < p.x + p.w * 0.62 && y > p.y - p.h * 0.05 && y < p.y + p.h * 1.15) return sel;
      }
      if (!v || !v.idsImg) return -1;
      if (!v.idsData) {
        const im = v.idsImg, c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        v.idsData = { w: c.width, h: c.height, data: g.getImageData(0, 0, c.width, c.height).data };
      }
      const d = v.idsData, [ox, oy, zx, zy] = this.comp.map;
      let u = ox + x / this.comp.cssW * zx, w = oy + y / this.comp.cssH * zy;
      const dep = this.depthAt(u, w), f = this.comp.focus || 0.6;      // the same parallax shift the shader applies
      u += this.parallax[0] * (dep - f); w += this.parallax[1] * (dep - f);
      const px = Math.floor(u * d.w), py = Math.floor(w * d.h);
      if (px < 0 || py < 0 || px >= d.w || py >= d.h) return -1;
      const id = Math.round(d.data[(py * d.w + px) * 4] / 32);
      return id >= 1 && id <= A.products.length ? id - 1 : -1;
    }
    onGarmentClick(i) {
      if (this.dragMoved) return;
      const p = A.products[i]; if (!p) return;
      this.rail.kickGarment(i, A.config.motion.sway.clickKick);
      if (p.type === 'product') {                                  // straight to the product view
        this.hideHint();
        if (this.rail.selected >= 0 && !this.viewKey.includes('@')) {   // the drop card was open: it closes behind the product
          this.rail.setSelected(-1); this.root.classList.remove('has-selection'); this.drop.close();
        }
        return this.openProduct(i);
      }
      if (this.viewKey !== 'room' && this.rail.selected === i) return this.select(-1);
      this.select(i);
    }
    onHover(i) {
      if (i >= 0) this.hideHint();
      if (i >= 0 && !this.isMobile) {
        const k = (this.viewKey === 'room' ? 'rail' : this.viewKey.split('@')[0]) + '@' + i;
        if (!this.comp.cache[k] && this.passes[k] && Object.keys(this.passes[k]).length >= 7) this.comp.load(k, this.passes, false);
      }
      this.stage.classList.toggle('is-pointing', i >= 0);
      this.kick();
    }
    /* ANSTOSS: from anywhere, walk to the bed first (toward its dot), then the magazine opens out of its place on the
       duvet (its dot). */
    async openMag() {
      if (!this.mag || this.mag.isOpen) return;
      if (this.viewKey !== 'bed') {
        await this.go('bed', this.viewKey === 'room' ? { focus: this.dotAt('bed') } : {});
        this.placeChrome();
      }
      const d = this.dots && this.dots.mag;
      this.mag.open(d && !d.hidden ? d.getBoundingClientRect() : null);
    }
    /* Centre of a target's white dot on the stage (CSS px), or undefined when it does not show. */
    dotAt(t) {
      const d = this.dots && this.dots[t];
      return d && !d.hidden ? [parseFloat(d.style.left), parseFloat(d.style.top)] : undefined;
    }
    showOnRail(i) { return this.select(i); }
    openProduct(i) {
      const p = A.products[i]; if (!p) return;
      this.shop.open(p, this.rail.garmentRect(i));
    }
    /* "Weiter umsehen" after the bag: back to the rail, where everything waves once. */
    async keepLooking() {
      if (this.isMobile) { if (this.viewKey !== 'rail_m') await this.go('rail_m'); }
      else if (this.viewKey === 'bed') await this.go('room');
      setTimeout(() => { this.rail.wave(); this.kick(); }, 250);
    }
    afterProductClose() { const s = this.rail.selected; if (s >= 0) this.rail.items[s].hit.focus({ preventScroll: true }); }
    setWorldDim(d = 1, blur = 0) {
      this.dimTarget = d;
      this.canvas.style.filter = blur ? `blur(${blur}px)` : '';
      this.fallbackImg.style.filter = this.canvas.style.filter;
      this.kick();
    }
    /* the sports bag (cart) shows once something is in it */
    setCartCount(n) {
      this.cartCount = n;
      if (this.bagBtn) { this.bagBtn.hidden = !(n > 0); const c = this.bagBtn.querySelector('.azur-head__count'); if (c) c.textContent = n; }
    }
    bumpCart() {
      if (!this.bagBtn) return;
      this.bagBtn.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-5px) rotate(-8deg)', offset: 0.35 },
        { transform: 'translateY(0) rotate(4deg)', offset: 0.7 }, { transform: 'none' }], { duration: 620, easing: 'ease-out' });
    }

    /* ---------------------------------------------------------------- depth (same values the shader sees) */
    encDepth(metres) { return lin2srgb(Math.max(0, Math.min(1, (DEPTH.far - metres) / (DEPTH.far - DEPTH.near)))); }
    async loadDepth(key) {
      if (this.depthMaps[key] !== undefined) return;
      this.depthMaps[key] = null;
      const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = A.url(A.config.assetBase + key.split('@')[0] + '/depth.png'); });
      if (!im) return;
      const c = document.createElement('canvas'); const w = 200, h = Math.round(200 * im.naturalHeight / im.naturalWidth);
      c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h);
      this.depthMaps[key] = { w, h, data: x.getImageData(0, 0, w, h).data };
    }
    depthAt(u, v, metres) {
      if (metres != null) return this.encDepth(metres);
      const d = this.depthMaps[this.viewKey];
      if (!d) return this.comp.focus || 0.6;
      const x = Math.max(0, Math.min(d.w - 1, Math.round(u * (d.w - 1)))), y = Math.max(0, Math.min(d.h - 1, Math.round(v * (d.h - 1))));
      return d.data[(y * d.w + x) * 4] / 255;
    }

    /* ---------------------------------------------------------------- chrome: header, view chips, hint, bed, window */
    buildChrome() {
      const c = A.config.copy;
      // header over the room: nothing but the sports bag (once something is in it) and three glowing dots for the menu;
      // the logo only shows, dimmed, behind the product view and the magazine (it takes you back into the room)
      const head = $('.azur-head');
      this.bagBtn = head && head.querySelector('.azur-head__bag');
      if (this.bagBtn && !A.config.shopify) this.bagBtn.addEventListener('click', () => this.shop.toggleCart());   // Shopify: the theme's drawer ([data-cart-open])
      this.setCartCount(A.store && A.store.cartCount || 0);
      // Shopify: the theme's cart drawer rewrites every [data-cart-count] (the bag's too) when lines change there;
      // the bag follows that number, and the cart is asked again when the visitor comes back to the tab
      const cnt = this.bagBtn && this.bagBtn.querySelector('.azur-head__count');
      if (cnt && 'MutationObserver' in window) new MutationObserver(() => {
        const n = parseInt(cnt.textContent, 10) || 0; if (n !== this.cartCount) { this.cartCount = n; this.bagBtn.hidden = !(n > 0); }
      }).observe(cnt, { childList: true, characterData: true, subtree: true });
      if (A.config.shopify) document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
        fetch(root + 'cart.js', { headers: { Accept: 'application/json' } }).then(r => r.json()).then(c => this.setCartCount(c.item_count)).catch(() => { });
      });
      this.menuBtn = head && head.querySelector('.azur-head__dots'); this.menu = head && head.querySelector('.azur-menu');
      if (this.menuBtn && this.menu) {
        this.menuBtn.addEventListener('click', e => { e.stopPropagation(); this.toggleMenu(); });
        document.addEventListener('click', e => { if (!this.menu.hidden && !e.target.closest('.azur-menu, .azur-head__dots')) this.toggleMenu(false); });
      }
      const ghost = $('.azur-ghost');
      if (ghost) {   // it shows above the product view and the magazine (appended to <body>): it must live there too
        const wrap = ghost.parentElement && ghost.parentElement.tagName === 'NAV' ? ghost.parentElement : ghost;
        if (wrap.parentElement !== document.body) document.body.appendChild(wrap);
      }
      if (ghost) ghost.addEventListener('click', e => {
        e.preventDefault();
        if (this.shop.pdp.classList.contains('is-on')) this.shop.close();
        if (this.mag && this.mag.isOpen) this.mag.close();
      });
      document.querySelectorAll('.azur-head [data-go], [data-azur-go]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault(); const t = a.dataset.go || a.dataset.azurGo;
        this.toggleMenu(false);
        if (A.config.shopify) this.root.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth' });
        if (t === 'rail') this.go(this.isMobile ? 'rail_m' : 'rail'); else if (t === 'mag') this.openMag(); else this.go(t);
      }));
      // white dots on what can be visited from here (bed, rail, magazine); hover lights its outline
      this.dotBox = document.createElement('div'); this.dotBox.className = 'azur-dots'; this.layer.after(this.dotBox);
      this.dots = {};
      [['bed', c.goBed], ['rail', c.goRail], ['mag', c.magSpot]].forEach(([t, label]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'azur-dot azur-dot--' + t; b.dataset.target = t;
        b.setAttribute('aria-label', label); b.hidden = true;
        b.addEventListener('click', e => { e.stopPropagation(); this.goTarget(t); });
        b.addEventListener('pointerenter', () => this.setRegion(t, true)); b.addEventListener('pointerleave', () => this.setRegion(null));
        b.addEventListener('focus', () => this.setRegion(t, true)); b.addEventListener('blur', () => this.setRegion(null));
        this.dotBox.appendChild(b); this.dots[t] = b;
      });
      this.goLabel = document.createElement('p'); this.goLabel.className = 'azur-bedlabel azur-golabel'; this.goLabel.setAttribute('aria-hidden', 'true');
      this.dotBox.appendChild(this.goLabel);
      this.chips = $('.azur-views');
      this.chips.addEventListener('click', e => {
        const b = e.target.closest('button[data-view]'); if (!b) return;
        let v = b.dataset.view; if (v === 'rail' && this.isMobile) v = 'rail_m';
        this.go(v);
      });
      this.hint = $('.azur-hint'); this.hint.textContent = this.isMobile ? c.hintMobile : c.hintDesktop;
      this.tease = $('.azur-tease'); this.setTease();
      // behind the window glass (the compositor masks it in): for each window a clip rendered from that camera, a boy
      // running past on the lawn with his ball (outside/<view>.mp4); it rests on its first frame (nobody there) and
      // plays now and then.
      if (this.comp.ok) {
        const mk = files => {
          const vid = document.createElement('video');
          Object.assign(vid, { muted: true, playsInline: true, preload: 'none' });   // fetched when a window shows it
          vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true');
          files.forEach(([f, t]) => { const so = document.createElement('source'); so.src = A.url(f); so.type = t; vid.appendChild(so); });
          Object.assign(vid.style, { position: 'absolute', width: '2px', height: '2px', opacity: '0', pointerEvents: 'none', left: '0', top: '0' });
          this.root.appendChild(vid); return vid;
        };
        const ob = A.config.assetBase.replace(/views\/$/, 'outside/');
        this.clips = {};
        Object.entries(this.outside || {}).forEach(([k, c]) => {
          if (!c || !c.box) return;
          const vid = this.clips[k] = mk([[ob + k + '.webm', 'video/webm'], [ob + k + '.mp4', 'video/mp4']]);
          vid.addEventListener('ended', () => this.clipEnded(vid));
        });
        if (Object.keys(this.clips).length) { this.useClip(this.viewKey || 'room'); this.scheduleClip(6000 + Math.random() * 6000); }
      }
      this.initSound();
    }
    /* Shopify (round 9): scrolling from the room down into the shop. The shop slides over the room like a sheet (its
       shadow: sections/azur-room.liquid); the room stays a little behind, shrinks a touch and darkens. Only transform
       and opacity of the stage change: the section keeps its box, so the theme header still sees where the room ends,
       and once the room is out of the window the IntersectionObserver stops its drawing as before. */
    /* Runde 20 (owner): scrolling down, a camera goes down in the room and dips through a black plane to the jerseys.
       The room stays (sticky) and slides up slower than the page (.azur-world: 0.75 of the first screen, no zoom); like
       a camera that sinks, near things (floor, bed, rail) also lift more than the far wall (the pointer's depth
       parallax, vertical and driven by the scroll: frame() reads scrollY each frame, CAM_DEPTH). The slide is a CSS
       scroll-driven animation where the browser has them (azur-room.liquid), so it runs with the scroll itself; else
       the scroll handler moves it. The plane (.azur-fall: a low sandy edge, black long enough to fill the window once,
       the same edge mirrored into white, then white room for the jerseys) scrolls with the page. The scroll handler
       only reads scrollY against offsets measured on resize (no layout while scrolling) and sets the classes: html.azur-
       diving hides the room's hints, chips and dots, html.azur-light gives the header dark type over the white,
       html.azur-past makes it solid (azur.js listens for `azur-hero`); while the plane covers the room it is not drawn. */
    bindScrollAway() {
      const html = document.documentElement, fall = this.root.parentElement.querySelector('.azur-fall');
      if (!fall) return;
      const black = fall.querySelector('.azur-fall__grad'), end = fall.querySelector('.azur-fall__dust--end');
      const slideByCss = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
      const f = this.fall = {};
      const measure = () => {
        const y = window.scrollY;
        f.vh = window.innerHeight || 1; f.black = black.getBoundingClientRect().top + y; f.end = end.getBoundingClientRect().bottom + y;
        update();
      };
      const flag = (c, on) => { if (html.classList.contains(c) !== on) { html.classList.toggle(c, on); return true; } return false; };
      const update = () => {
        const y = window.scrollY, hb = parseFloat(html.style.getPropertyValue('--header-bottom')) || 0;
        this.diving = y > 4; flag('azur-diving', this.diving);
        flag('azur-light', f.end - y - hb / 2 < 40);       // the mirrored edge is mostly white in its lower half
        if (flag('azur-past', f.end - y <= hb + 1)) window.dispatchEvent(new Event('azur-hero'));
        const away = f.black - y <= 0;
        if (away !== this.away) { this.away = away; if (!away) this.kick(); }
        if (!slideByCss && !this.reduced && !away) this.world.style.translate = `0 ${-Math.round(0.75 * Math.min(y, f.vh))}px`;
      };
      window.addEventListener('scroll', update, { passive: true });
      let mq = false;
      window.addEventListener('resize', () => { if (!mq) { mq = true; requestAnimationFrame(() => { mq = false; measure(); }); } });
      window.addEventListener('load', measure); measure();
    }

    /* ---------------------------------------------------------------- outside the window (round 4) */
    useClip(key) {        // the clip made for this view's window (none for the phones' rail and the bed)
      if (!this.clips) return;
      const k = (key || '').split('@')[0], vid = this.clips[k] || null, c = this.outside && this.outside[k];
      if (this.video && this.video !== vid && !this.video.paused) { this.video.pause(); this.video.currentTime = 0; }
      this.video = vid; this.comp.video = vid; this.comp.clipBox = vid ? c.box : null; this.comp.videoUp = false;
      if (vid && vid.preload !== 'auto') { vid.preload = 'auto'; vid.load(); }
    }
    scheduleClip(ms) {
      clearTimeout(this.clipTimer);
      this.clipTimer = setTimeout(() => this.playClip(), ms);
    }
    playClip() {
      const vid = this.video, c = this.comp;
      const quiet = !vid || this.reduced || document.hidden || this.offscreen || this.busy || c.winAmt < 0.5
        || (this.mag && this.mag.isOpen) || this.shop.pdp.classList.contains('is-on');
      if (quiet) { this.scheduleClip(9000 + Math.random() * 6000); return; }      // not now: look again soon
      vid.currentTime = 0;
      vid.play().then(() => {
        const k = Object.keys(this.clips).find(x => this.clips[x] === vid), kick = this.outside[k] && this.outside[k].kick;
        if (kick != null) setTimeout(() => { if (!vid.paused) this.kickSound(1); }, Math.max(0, kick - vid.currentTime) * 1000);
      }).catch(() => this.scheduleClip(20000));
      this.kick();
    }
    clipEnded(vid) {      // back on the empty lawn until the next time
      vid.pause(); vid.currentTime = 0; this.comp.videoUp = false; this.kick();
      this.scheduleClip(25000 + Math.random() * 45000);
    }

    /* Sound (round 4): a ball kicked outside, quiet and muffled by the window. Browsers allow sound only after the
       visitor's first click, tap or key; the speaker in the header switches it off (remembered). Now and then, while it
       is light outside, someone kicks a ball out of sight too. */
    initSound() {
      try { this.soundOn = localStorage.getItem('azur-sound') !== 'off'; } catch (e) { this.soundOn = true; }
      const btn = $('.azur-head__sound');
      const sync = () => { if (!btn) return; btn.setAttribute('aria-pressed', String(this.soundOn)); btn.setAttribute('aria-label', this.soundOn ? 'Ton aus' : 'Ton an'); };
      if (btn) {
        btn.hidden = false; sync();
        btn.addEventListener('click', e => {
          e.stopPropagation(); this.soundOn = !this.soundOn; sync(); this.unlockAudio();
          try { localStorage.setItem('azur-sound', this.soundOn ? 'on' : 'off'); } catch (err) { }
          if (this.soundOn) this.kickSound(0.6);
        });
      }
      const unlock = () => this.unlockAudio();
      ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { once: true, passive: true }));
      const far = () => {
        this.farTimer = setTimeout(far, 45000 + Math.random() * 75000);
        if (!document.hidden && !this.offscreen && this.light && this.light.window > 0.6 && !(this.video && !this.video.paused)) this.kickSound(0.45);
      };
      this.farTimer = setTimeout(far, 30000 + Math.random() * 40000);
    }
    unlockAudio() {
      if (!this.soundOn) return;
      try {
        this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
        if (this.audio.state === 'suspended') this.audio.resume();
      } catch (e) { }
    }
    kickSound(vol) {
      const ac = this.audio; if (!this.soundOn || !ac || ac.state !== 'running' || document.hidden) return;
      const t = ac.currentTime + 0.01, out = ac.createGain(); out.gain.value = 0.2 * vol;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;      // through the window
      out.connect(lp); lp.connect(ac.destination);
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';           // the thump of the ball
      o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.13);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22);
      const len = Math.floor(ac.sampleRate * 0.05), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);  // the slap of the boot
      const n = ac.createBufferSource(); n.buffer = buf;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
      const ng = ac.createGain(); ng.gain.value = 0.7; n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t);
      const dl = ac.createDelay(); dl.delayTime.value = 0.11; const eg = ac.createGain(); eg.gain.value = 0.16;   // off the house fronts
      lp.connect(dl); dl.connect(eg); eg.connect(ac.destination);
    }
    placeChrome() { this.placeDots(); }

    /* ---------------------------------------------------------------- outlines, dots, menu */
    toggleMenu(on) {
      if (!this.menu) return;
      const open = on == null ? this.menu.hidden : on;
      this.menu.hidden = !open; this.menuBtn.setAttribute('aria-expanded', String(open));
      this.root.classList.toggle('menu-open', open);
      if (open) { const f = this.menu.querySelector('a, button'); if (f) f.focus({ preventScroll: true }); }
    }
    targets() { return A.config.targets[this.viewKey.split('@')[0]] || []; }
    /* Which outline region (bed, rail, magazine) is at a stage point: masks.png R, G, B (half size). */
    regionAt(x, y) {
      const cv = this.comp.view, t = this.targets(); if (!cv || !cv.masksImg || !t.length) return null;
      const d = this.masksData(cv); if (!d) return null;
      let [u, w] = this.comp.toPlate(x, y);
      const dep = this.depthAt(u, w), f = this.comp.focus || 0.6;
      u += this.parallax[0] * (dep - f); w += this.parallax[1] * (dep - f);
      const px = Math.floor(u * d.w), py = Math.floor(w * d.h);
      if (px < 0 || py < 0 || px >= d.w || py >= d.h) return null;
      const i = (py * d.w + px) * 4, r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];
      if (b > 127 && t.includes('mag')) return 'mag';
      if (r > 127 && t.includes('bed')) return 'bed';
      if (g > 127 && t.includes('rail')) return 'rail';
      return null;
    }
    masksData(cv) {
      if (cv.masksData) return cv.masksData;
      const im = cv.masksImg; if (!im || !im.naturalWidth) return null;
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
      const d = { w: c.width, h: c.height, data: g.getImageData(0, 0, c.width, c.height).data };
      // where each region's dot sits: the bed and the magazine at their middle, the rail near its top (the bar)
      d.anchors = {};
      ['bed', 'rail', 'mag'].forEach((t, ch) => {
        let n = 0, sx = 0, sy = 0, y0 = d.h, y1 = -1;
        for (let y = 0; y < d.h; y += 2) for (let x = 0; x < d.w; x += 2) if (d.data[(y * d.w + x) * 4 + ch] > 127) { n++; sx += x; sy += y; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (n < 12) return;
        let ax = sx / n, ay = t === 'rail' ? y0 + (y1 - y0) * 0.04 : sy / n;
        // snap onto the region (a concave shape's middle can fall outside it)
        let best = null, bd = 1e12;
        for (let y = 0; y < d.h; y += 2) for (let x = 0; x < d.w; x += 2) if (d.data[(y * d.w + x) * 4 + ch] > 127) {
          const dd = (x - ax) ** 2 + (y - ay) ** 2; if (dd < bd) { bd = dd; best = [x, y]; } }
        if (best) d.anchors[t] = [(best[0] + 0.5) / d.w, (best[1] + 0.5) / d.h];
      });
      cv.masksData = d; return d;
    }
    setRegion(t, fromDot) {
      if (t === this.region && !fromDot) return;
      this.region = t;
      this.stage.classList.toggle('is-going', !!t);
      const el = this.goLabel; if (!el) return;
      // at the bed, the bed means ANSTOSS (the magazine on it): its label shows at the magazine's dot
      const lt = t === 'bed' && this.viewKey.split('@')[0] === 'bed' ? 'mag' : t;
      const c = A.config.copy, dot = lt && this.dots[lt];
      if (lt && dot && !dot.hidden) {
        el.textContent = lt === 'bed' ? c.goBed : lt === 'rail' ? c.goRail : c.magSpot;
        el.style.left = dot.style.left; el.style.top = (parseFloat(dot.style.top) - 18) + 'px';
        el.classList.add('is-on');
      } else el.classList.remove('is-on');
      this.kick();
    }
    goTarget(t) {
      this.setRegion(null);
      const dot = this.dots[t], r = dot && dot.getBoundingClientRect(), focus = r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : null;
      if (t === 'bed' && this.viewKey.split('@')[0] === 'bed') this.openMag();
      else if (t === 'bed') this.go('bed', { focus });
      else if (t === 'rail') this.go(this.isMobile ? 'rail_m' : 'rail', { focus });
      else if (t === 'mag') this.openMag();
    }
    placeDots() {
      if (!this.dots) return;
      const cv = this.comp.view, t = this.targets(), d = cv && cv.masksImg ? this.masksData(cv) : null;
      Object.entries(this.dots).forEach(([k, b]) => {
        // no dot for the place you are already at (the bed in the bed view): it still glows and answers a click
        const a = d && t.includes(k) && k !== this.viewKey.split('@')[0] && d.anchors[k];
        b.hidden = !a; if (!a) return;
        const p = this.comp.toScreen(a[0], a[1], this.depthAt(a[0], a[1]));
        const W = this.stage.clientWidth, H = this.stage.clientHeight;
        if (p[0] < 24 || p[1] < 24 || p[0] > W - 24 || p[1] > H - 24) { b.hidden = true; return; }
        b.style.left = p[0].toFixed(1) + 'px'; b.style.top = p[1].toFixed(1) + 'px';
      });
    }

    /* phones: the pan value that puts garment i in the middle of the screen, and the garment nearest the middle */
    panSpan() { return this.stage.clientWidth * (1 / this.comp.map[2] - 1) || 1; }
    panFor(i) {
      const p = this.rail.px && this.rail.px[i]; if (!p) return null;
      return Math.max(0, Math.min(1, this.pan + (p.x - this.stage.clientWidth / 2) / this.panSpan()));
    }
    nearestGarment() {
      const px = this.rail.px || [], mid = this.stage.clientWidth / 2;
      let best = -1, bd = 1e9;
      px.forEach((p, i) => { if (p && Math.abs(p.x - mid) < bd) { bd = Math.abs(p.x - mid); best = i; } });
      return best;
    }

    showHint() {
      if (this.hintDone) return;
      const p = this.rail.px && this.rail.px.filter(Boolean);
      if (p && p.length) {
        const x = (p[0].x + p[p.length - 1].x) / 2, y = Math.max(...p.map(q => q.y + q.h)) + 18;
        this.hint.style.transform = `translate3d(${x.toFixed(0)}px, ${Math.min(y, this.stage.clientHeight - 70).toFixed(0)}px, 0) translateX(-50%)`;
      }
      this.hint.classList.add('is-on');
      this.hintTimer = setTimeout(() => this.hideHint(), 11000);
    }
    hideHint() { if (this.hintDone) return; this.hintDone = true; this.hint.classList.remove('is-on'); clearTimeout(this.hintTimer); }

    /* ---------------------------------------------------------------- pointer, swipe, keys */
    bindPointer() {
      const st = this.stage;
      let last = null, down = null;
      st.addEventListener('pointermove', e => {
        const r = st.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        const now = performance.now();
        const vx = last ? (x - last.x) / Math.max(8, now - last.t) * 1000 : 0;
        last = { x, y, t: now };
        if (e.pointerType !== 'touch') {
          this.parallaxTarget = [(x / r.width - 0.5) * 2, (y / r.height - 0.5) * 2];
          this.rail.pointerMove(x, y, vx);
          if (!e.target.closest('.azur-dot')) this.setRegion(this.rail.hover >= 0 ? null : this.regionAt(x, y));
        }
        if (down && this.viewKey === 'rail_m') {
          const dx = x - down.x;
          if (Math.abs(dx) > 6) this.dragMoved = true;
          const span = this.panSpan(), raw = down.pan - dx / span;
          // rubber band past the ends
          this.pan = Math.max(-0.05, Math.min(1.05, raw < 0 ? raw * 0.25 : raw > 1 ? 1 + (raw - 1) * 0.25 : raw));
          this.panVel = -vx / span;
          this.rail.panImpulse(vx);
          this.kick();
        }
      });
      st.addEventListener('pointerleave', () => { this.parallaxTarget = [0, 0]; this.rail.pointerLeave(); this.setRegion(null); last = null; });
      st.addEventListener('pointerdown', e => {
        if (e.target.closest('.azur-drop, .azur-info, .azur-views, .azur-head')) return;
        const r = st.getBoundingClientRect();
        down = { x: e.clientX - r.left, pan: this.pan }; this.dragMoved = false;
        this.dragging = true; this.snapPan = null; this.panVel = 0;
      });
      window.addEventListener('pointerup', () => { down = null; this.dragging = false; setTimeout(() => { this.dragMoved = false; }, 0); });
      window.addEventListener('pointercancel', () => { down = null; this.dragging = false; this.dragMoved = false; });
      // phones: tilt the room very slightly with a slow drift instead of a pointer
      if (this.isMobile) this.parallaxTarget = [0, 0];
      // click on the empty room deselects
      st.addEventListener('click', e => {
        if (this.dragMoved || e.target.closest('.azur-drop, .azur-info, .azur-views, .azur-head, .azur-panel, .azur-dot')) return;
        const r = st.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, id = this.garmentAt(x, y);
        if (id >= 0) return this.onGarmentClick(id);
        const reg = this.regionAt(x, y);
        if (reg) return this.goTarget(reg);
        if (this.viewKey.includes('@') || this.rail.selected >= 0) this.select(-1);
      });
    }

    bindKeys() {
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          if (this.menu && !this.menu.hidden) { this.toggleMenu(false); return this.menuBtn.focus(); }
          if (this.shop.pdp.classList.contains('is-on')) return this.shop.close();
          if (this.shop.drawer && this.shop.drawer.classList.contains('is-on')) return this.shop.toggleCart(false);
          if (this.drop.card.classList.contains('is-on')) { this.drop.hideCard(); return this.select(-1); }
          if (this.rail.selected >= 0) return this.select(-1);
          if (this.viewKey !== 'room' && !this.isMobile) return this.go('room');
        }
      });
    }

    handleHash() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (!h) return;
      const i = A.products.findIndex(p => p.handle === h);
      // a jersey's link opens its product view, as a click on it does; the drop goes to the rail
      if (i >= 0 && A.products[i].type === 'product') this.openProduct(i);
      else if (i >= 0) this.go(this.isMobile ? 'rail_m' : 'rail', { select: i });
      else if (h === 'bett') this.go('bed');
      else if (h === 'anstoss') this.openMag();
      else if (h === 'azur-drop' && /customer_posted=true/.test(location.search)) this.drop.confirm('');   // back from Shopify's bot check
    }

    /* ---------------------------------------------------------------- loop */
    resize() {
      this.comp.pan = this.pan;
      this.comp.layout(this.stage.clientWidth, this.stage.clientHeight, this.dpr());
      this.rail.place(); this.placeChrome();
      this.dirty = true; this.kick();
    }
    kick() { this.dirty = true; }
    // phones draw at 1.5x at most: sharp enough for photos, a third fewer pixels than 2x
    dpr() { return Math.min(window.devicePixelRatio || 1, this.isMobile || this.coarse ? 1.5 : 2); }   // Runde 21: tablets too

    frame(t) {
      const dt = Math.min(0.05, (t - this.lastT) / 1000); this.lastT = t;
      if (document.hidden || this.offscreen || this.covered || this.away) { requestAnimationFrame(tt => this.frame(tt)); return; }
      const cfg = A.config;
      // light: follow the clock once a second (or the design panel), but only redraw when it visibly changed
      if (t - this.lightAt > 1000 || this.lightDirty) {
        this.lightAt = t; this.lightDirty = false;
        const l = A.light.current(), sig = [l.exposure, l.window, l.night, ...l.sky].map(v => v.toFixed(3)).join();
        this.light = l;
        if (sig !== this.lightSig) { this.lightSig = sig; this.rail.applyLight(l); this.applyAmbient(); this.dirty = true; }
        const st = this.stateNow(); if (st !== this.dayState) this.changeState(st);
      }
      // parallax eases toward the pointer (phones have none: a room that sways on its own costs battery and feels laggy)
      const vc = cfg.views[this.viewKey] || {}, k = this.reduced ? 0 : (vc.parallax || 0.01) * cfg.motion.intensity;
      const tx = this.parallaxTarget[0], ty = this.parallaxTarget[1];
      const e = 1 - Math.exp(-dt * cfg.motion.parallaxEase);      // the same glide at 60, 120 or 144 Hz
      const nx = this.parallax[0] + (-tx * k - this.parallax[0]) * e, ny = this.parallax[1] + (-ty * k * 0.6 - this.parallax[1]) * e;
      const pmove = Math.abs(nx - this.parallax[0]) + Math.abs(ny - this.parallax[1]) > 1e-6;
      // + the scroll's camera (Runde 20): near things lift more than the wall over the first screen of scrolling
      const sp = this.fall && !this.reduced && !this.coarse ? Math.round(Math.min(1, window.scrollY / this.fall.vh) * CAM_DEPTH * 2000) / 2000 : 0;
      if (sp !== this.scrollPar) { this.scrollPar = sp; this.dirty = true; }
      this.parallax = [nx, ny]; this.comp.parallax = sp ? [nx, ny + sp] : this.parallax;
      // phones: momentum after a swipe along the rail, then the rail settles with a garment in the middle
      if (this.viewKey === 'rail_m' && !this.dragging) {
        const W = this.stage.clientWidth;
        if (Math.abs(this.panVel) > 0.05 && !this.reduced && this.pan >= 0 && this.pan <= 1) {
          const p = this.pan + this.panVel * dt, c = Math.max(0, Math.min(1, p));
          if (c !== p) this.panVel *= -0.25;                      // soft stop at the ends
          this.pan = c; this.panVel *= Math.pow(0.05, dt); this.snapPan = null;
          this.rail.panImpulse(-this.panVel * W); this.dirty = true;
        } else {
          this.panVel = 0;
          if (this.snapPan == null) this.snapPan = this.panFor(this.rail.selected >= 0 ? this.rail.selected : this.nearestGarment());
          const d = this.snapPan == null ? 0 : this.snapPan - this.pan;
          if (Math.abs(d) > 2e-4) {
            const step = this.reduced ? d : d * Math.min(1, dt * 7);
            this.pan += step; this.rail.panImpulse(-(step / Math.max(dt, 1e-3)) * W * 0.6); this.dirty = true;
          }
        }
      }
      if (this.comp.pan !== this.pan) { this.comp.pan = this.pan; this.comp.layout(this.stage.clientWidth, this.stage.clientHeight, this.dpr()); this.dirty = true; }
      // selection dims the room smoothly
      const dT = this.dimTarget == null ? 1 : this.dimTarget;
      if (Math.abs(this.comp.dim - dT) > 0.002) { this.comp.dim += (dT - this.comp.dim) * Math.min(1, dt * 6); this.dirty = true; }
      this.stepRoom(dt);
      if ((pmove || this.dirty) && !this.diving) { this.rail.place(); this.placeChrome(); }   // hidden while the page scrolls away
      const swaying = this.rail.step(dt, this.reduced);
      this.applySway(t, swaying);
      if ((this.dirty || pmove) && !this.covered) { this.comp.render(this.light); this.dirty = false; }
      requestAnimationFrame(tt => this.frame(tt));
    }

    /* Hover outlines, the hovered jersey's light, the window and its clip. */
    stepRoom(dt) {
      const c = this.comp, h = this.rail.hover;
      // hover outlines fade in and out
      const S = (A.config.outline || {}).strength || 0.9, ease = Math.min(1, dt * ((A.config.outline || {}).ease || 9));
      const want = ['bed', 'rail', 'mag'].map(k => this.region === k ? S : 0);
      let glowCh = false;
      want.forEach((w, k) => { const n = this.glowAmt[k] + (w - this.glowAmt[k]) * ease;
        if (Math.abs(n - w) < 2e-3) { if (this.glowAmt[k] !== w) glowCh = true; this.glowAmt[k] = w; } else { this.glowAmt[k] = n; glowCh = true; } });
      if (glowCh) { c.setGlow(this.glowAmt.slice()); this.dirty = true; }
      if (h >= 0) c.hover = h + 1;
      const target = h >= 0 && !this.viewKey.includes('@') ? 1 : 0;
      const ha = c.hoverAmt + (target - c.hoverAmt) * Math.min(1, dt * 9);
      if (Math.abs(ha - c.hoverAmt) > 1e-3) { c.hoverAmt = ha; this.dirty = true; } else c.hoverAmt = target;
      const vid = this.video, hasWin = c.view && c.view.win;
      const wa = hasWin ? Math.max(0, Math.min(1, (this.light.window - 0.35) / 0.5)) : 0;
      if (Math.abs(wa - c.winAmt) > 1e-3) { c.winAmt += (wa - c.winAmt) * Math.min(1, dt * 3); this.dirty = true; }
      if (c.videoUp && c.vidMix < 1) { c.vidMix = this.reduced ? 1 : Math.min(1, c.vidMix + dt * 2.5); this.dirty = true; }   // a late clip fades in
      if (!vid) return;
      // the boy's clip plays when scheduled (playClip); the room rests behind the magazine and the product view
      const resting = (this.mag && this.mag.isOpen) || this.shop.pdp.classList.contains('is-on');
      if (!vid.paused) { if (resting || document.hidden || c.winAmt < 0.05) this.clipEnded(vid); else this.dirty = true; }
    }

    /* The rail's pendulums bend the rendered plate (compositor sway). Idle breathing renders at 30 fps,
       a swinging jersey at full rate; nothing moves behind the product view or the magazine. */
    applySway(t, swaying) {
      const cv = this.comp.view; if (!cv || !this.comp.ok) return;
      if (!cv.swayA && cv.idsImg && !cv.swayTried) {
        cv.swayTried = true;
        (window.requestIdleCallback || (f => setTimeout(f, 60)))(() => { this.comp.buildSway(cv, A.products.length); this.kick(); });
      }
      if (!cv.swayA) return;
      const covered = this.shop.pdp.classList.contains('is-on') || (this.mag && this.mag.isOpen) || this.busy;
      const v = this.viewData(this.viewKey), hooks = (v.slots || []).map(x => x && x.hook);
      this.comp.setSway(hooks, this.rail.swayAng || [], this.rail.swayRip || []);
      this.comp.time = t / 1000;
      const idle = !this.reduced && A.config.motion.sway.idleDeg > 0;
      // one render per frame: the frame loop draws once when dirty (drawing here as well doubled the work)
      // Runde 21: no idle sway while the page scrolls away (the room moves anyway; the iPad lagged)
      if (!covered && (swaying || (idle && !this.diving && t - (this.swayAt || 0) > 33))) { this.swayAt = t; this.dirty = true; }
    }

    /* UI follows the room's light: labels switch to night styling after dusk. */
    applyAmbient() {
      const s = this.light, r = this.root;
      r.style.setProperty('--night-amt', s.night.toFixed(3));
      r.classList.toggle('is-night', s.night > 0.5);
      if (this.comp) {   // the clip outside follows the daylight a little (it was rendered on a bright afternoon)
        const sk = s.sky, g = c => Math.min(1.05, 0.2 + 0.85 * c);   // dusk turns it dark and blue
        const warm = Array.isArray(s.sunLow) ? Math.min(1, (s.sunLow[0] || 0)) : 0;
        this.comp.videoGrade = [g(sk[0]) * (1 + 0.06 * warm), g(sk[1]) * (0.98 - 0.02 * warm), g(sk[2]) * (0.95 - 0.1 * warm)];
      }
      if (this.panel) this.panel.sync(s);
    }
  }

  A.App = App;
  const boot = () => { A.app = new App(); A.app.init().catch(err => { console.error(err); document.documentElement.classList.add('azur-error'); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
