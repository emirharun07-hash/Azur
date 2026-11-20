/* AZUR — the garment rail. The jerseys are part of the rendered room (scene3); this layer keeps what sits on top of
   them: a keyboard target over each jersey, the hover label, the line under a chosen one, and the pendulum each jersey
   swings on (the compositor bends the plate by those angles). The pointer finds jerseys by the rendered id mask.
   Z1: a museum plaque next to each jersey (name, price, "Limitiert auf 50 Stück" or "vergeben"); an empty product
   field of the section comes as { type: 'gone' } and keeps its place on the rail, but is no target at all. */
(function () {
  const A = window.AZUR = window.AZUR || {};

  /* Z1 plaques. With slot.plaque (views.json v2: four points of the plaque in the render) the plaque sits on its
     centre. Without it (scene3: jerseys on the rail, they overlap, so there is no room beside them) it hangs below
     the jersey, a little to the right: the middle of its top edge at the hem (slot.bottom) moved dx jersey widths
     (slot.width, in u) to the right and dy jersey heights down.
     Only in these views; elsewhere (the room's long shot) they are too small and the drop line speaks for them. */
  const PLAQUE_AT = { rail: { dx: 0.06, dy: 0.035 }, rail_m: { dx: 0.04, dy: 0.03 } };
  /* Two plaques that touch (phones): the left one steps aside to the lower left, by PLAQUE_SHIFT px to the left and
     the tallest plaque's height plus PLAQUE_GAP down, so it is clear of both neighbours. Checked from right to left;
     a plaque next to one that already stepped down stays: a zigzag of two rows, never a staircase. */
  const PLAQUE_GAP = 6, PLAQUE_SHIFT = 10;
  const plaqueName = name => String(name || '').replace(/\s*\bTrikot\b\s*/gi, ' ').replace(/\s+/g, ' ').trim();

  /* D5: the wall (A.config.wall, A.wallOn = mode 'mockup'). A free-standing wall in front of the rendered rail hides it;
     three shadowbox frames hang on it (these keys), drawn in HTML and set onto the render's perspective by a CSS
     homography (four corners from comp.toScreen). Nothing swings; the frames are the targets, not the id mask. */
  const WALL_KEYS = ['brasilien', 'deutschland', 'drop'];
  const WALL_PX = { product: [410, 480], drop: [310, 370] };      // base size of a frame in CSS px (2 mm a pixel)
  /* The projective map of the rectangle 0..w x 0..h onto the quad p (four screen points clockwise from the top-left):
     x = (a s + b t + c) / (g s + h t + 1) with s, t from 0 to 1 (Heckbert's square-to-quad). */
  function quadCoef(p) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    let g = 0, h = 0;
    if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) { const den = dx1 * dy2 - dx2 * dy1 || 1e-9; g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den; }
    return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h];
  }
  function quadMatrix(w, h, p) {   // CSS matrix3d is column-major; the element needs transform-origin 0 0
    const [a, b, c, d, e, f, g, k] = quadCoef(p), n = x => +x.toFixed(6);
    return `matrix3d(${n(a / w)},${n(d / w)},0,${n(g / w)},${n(b / h)},${n(e / h)},0,${n(k / h)},0,0,1,0,${n(c)},${n(f)},0,1)`;
  }
  function inQuad(x, y, q) {
    let inside = false;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const [xi, yi] = q[i], [xj, yj] = q[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  /* A point of the quad q at (s, t) in 0..1 (bilinear: close enough for the snapshot drawing). */
  const quadAt = (q, s, t) => lerp2(lerp2(q[0], q[1], s), lerp2(q[3], q[2], s), t);

  class Wall {
    constructor(rail) {
      this.rail = rail; this.geo = null; this.quad = null; this.color = null;
      const el = this.el = document.createElement('div');
      el.className = 'azur-wall'; el.setAttribute('aria-hidden', 'true'); el.hidden = true;
      el.innerHTML = '<div class="azur-wall__floor"></div><div class="azur-wall__face"><span class="azur-wall__shade"></span></div><div class="azur-wall__cap"></div>';
      [this.floor, this.face, this.cap] = el.children;
      rail.root.insertBefore(el, rail.list);
    }
    layout(geo) {
      this.geo = geo; this.el.hidden = !geo; if (!geo) { this.quad = null; return; }
      this.faceH = Math.round(1000 * geo.top / 2.48);   // the face's base box keeps the wall's proportions (2.48 m wide)
      this.face.style.height = this.faceH + 'px';
      this.cap.hidden = !geo.cap; this.floor.hidden = !geo.floor;
    }
    place(comp, d) {
      const g = this.geo; if (!g || !comp.cssW) return;
      const S = q => q.map(p => comp.toScreen(p[0], p[1], d));
      this.quad = S(g.partition);
      this.face.style.transform = quadMatrix(1000, this.faceH, this.quad);
      if (g.cap) this.cap.style.transform = quadMatrix(1000, 24, S(g.cap));
      if (g.floor) this.floor.style.transform = quadMatrix(1000, 130, S(g.floor));
    }
    contains(x, y) { return !!this.quad && inQuad(x, y, this.quad); }

    /* The camera moves and the light changes crossfade from a still copy of the canvas, which has no HTML in it: the
       wall and its frames are drawn into that copy (flat colours, the jerseys as images), so the old rail never
       flashes. k: canvas pixels per CSS pixel. */
    paintInto(ctx, k) {
      if (!this.quad || this.el.hidden) return;
      const col = this.color || { bins: [[0.62, 0.6, 0.57]], tint: [0.8, 0.78, 0.75] };
      const rgb = c => `rgb(${c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`;
      const poly = q => { ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k))); ctx.closePath(); };
      ctx.save();
      const q = this.quad, l = quadAt(q, 0, 0.5), r = quadAt(q, 1, 0.5);
      const grad = ctx.createLinearGradient(l[0] * k, l[1] * k, r[0] * k, r[1] * k), n = col.bins.length;
      col.bins.forEach((b, j) => grad.addColorStop(n > 1 ? j / (n - 1) : 0, rgb(b)));
      poly(q); ctx.fillStyle = grad; ctx.fill();
      const rail = this.rail;
      rail.items.forEach((g, i) => {
        const p = rail.px && rail.px[i]; if (!p || !p.quad || !g.wall) return;
        const f = p.quad, inner = [quadAt(f, 0.05, 0.043), quadAt(f, 0.95, 0.043), quadAt(f, 0.95, 0.957), quadAt(f, 0.05, 0.957)];
        poly(f); ctx.fillStyle = '#121212'; ctx.fill();
        poly(inner); ctx.fillStyle = g.p.type === 'drop' ? '#0d1117' : '#192430'; ctx.fill();
        const im = g.shirt;
        if (im && im.complete && im.naturalWidth && !g.taken) {
          // the jersey: 84 % of the inner height, centred; an affine map from three corners of its box
          const ih = 0.84, iw = ih * (im.naturalWidth / im.naturalHeight) * (WALL_PX.product[1] / WALL_PX.product[0]) * 0.914 / 0.9;
          const s0 = 0.5 - iw / 2, t0 = 0.08;
          const o = quadAt(inner, s0, t0), ax = quadAt(inner, s0 + iw, t0), ay = quadAt(inner, s0, t0 + ih);
          ctx.save();
          ctx.setTransform((ax[0] - o[0]) * k / im.naturalWidth, (ax[1] - o[1]) * k / im.naturalWidth, (ay[0] - o[0]) * k / im.naturalHeight, (ay[1] - o[1]) * k / im.naturalHeight, o[0] * k, o[1] * k);
          ctx.drawImage(im, 0, 0); ctx.restore();
        }
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; poly(inner); ctx.fillStyle = rgb(col.tint); ctx.fill(); ctx.restore();
      });
      ctx.restore();
    }
  }

  class Garment {
    constructor(product, index) {
      this.p = product; this.i = index;
      this.theta = 0; this.omega = 0; this.rip = 0; this.phase = index * 1.7;
      this.gone = product.type === 'gone';
      this.el = document.createElement('li');
      this.el.className = 'azur-g';
      this.hit = null; this.plaque = null;
      if (this.gone) { this.el.hidden = true; return; }   // an empty product field: keeps its place, nothing to press
      const c = A.config.copy, taken = product.type === 'product' && product.available === false;
      const label = product.type === 'drop' ? `${product.name}. ${product.description}`
        : `${product.name}, ${A.formatPrice(product.price)}${taken ? ', ' + (c.taken || 'vergeben') : ''}`;
      // D5: on the wall a jersey is a frame behind glass; a jersey that is gone leaves its frame empty
      this.wall = !!(A.wallOn && WALL_KEYS.includes(product.key)); this.taken = taken;
      const img = this.wall && product.type === 'product' && !taken && ((A.config.wall || {}).images || {})[product.key];
      const frame = this.wall ? `<span class="azur-wf" aria-hidden="true"><span class="azur-wf__cone"></span><span class="azur-wf__box"><span class="azur-wf__felt"></span>${img ? `<img class="azur-wf__shirt" src="${A.esc(A.url(img))}" alt="" decoding="async" draggable="false">` : ''}<span class="azur-wf__light"></span><span class="azur-wf__glass"></span></span></span>` : '';
      this.el.innerHTML = `<button class="azur-g__hit" type="button" aria-label="${A.esc(label)}" data-index="${index}">${frame}</button>`;
      this.hit = this.el.firstElementChild;
      this.shirt = this.hit.querySelector('.azur-wf__shirt');
      if (this.wall) this.el.classList.add('is-wall', product.type === 'drop' ? 'is-drop' : 'is-product', ...(taken ? ['is-taken'] : []));
      if ((product.type !== 'product' && !this.wall) || A.config.plaques === false) return;
      // the plaque: the button above already says all of it to a screen reader
      const pl = this.plaque = document.createElement('div');
      pl.className = 'azur-plaque' + (taken ? ' is-taken' : '') + (this.wall ? ' is-wall' : ''); pl.dataset.index = index; pl.setAttribute('aria-hidden', 'true');
      const line = (cls, text) => { if (!text) return; const e = document.createElement('span'); e.className = 'azur-plaque__' + cls; e.textContent = text; pl.appendChild(e); };
      line('name', plaqueName(product.name));
      if (product.type === 'product') {
        line('price', A.formatPrice(product.price));
        line('note', taken ? (c.taken || 'vergeben') : product.limited);
      }
      this.el.appendChild(pl);
    }
  }

  class Rail {
    constructor(root, products, app) {
      this.app = app; this.root = root;
      this.list = document.createElement('ul');
      this.list.className = 'azur-rail'; this.list.setAttribute('aria-label', A.config.copy.railLabel || 'Trikots am Kleiderständer');
      root.appendChild(this.list);
      this.wall = A.wallOn ? new Wall(this) : null; this.wallGeo = null;
      this.items = products.map((p, i) => new Garment(p, i));
      this.items.forEach(g => this.list.appendChild(g.el));
      this.hover = -1; this.selected = -1; this.view = null; this.geom = []; this.t = 0;
      this.pointer = { x: -1e4, y: -1e4, vx: 0, inside: false };
      this.label = document.createElement('div'); this.label.className = 'azur-label'; this.label.setAttribute('aria-hidden', 'true');
      root.appendChild(this.label);
      this.info = document.createElement('div'); this.info.className = 'azur-info'; this.info.setAttribute('role', 'region'); this.info.setAttribute('aria-live', 'polite');
      root.appendChild(this.info);
      this.bind();
      this.guardGone();
    }

    /* An empty product field (type 'gone') is still a jersey in the render and in its id mask. The app reads the mask
       (garmentAt); here its answer is filtered, so such a jersey gets no hover, no click and no selection. */
    guardGone() {
      const app = this.app, items = this.items;
      if (!items.some(g => g.gone) || typeof app.garmentAt !== 'function') return;
      const read = app.garmentAt;
      app.garmentAt = function (x, y) {
        const i = read.call(this, x, y);
        return i >= 0 && items[i] && items[i].gone ? -1 : i;
      };
    }

    bind() {
      this.list.addEventListener('click', e => {
        const b = e.target.closest('.azur-g__hit, .azur-plaque'); if (!b) return;
        // the stage would read the room under it as well (a frame on the wall is a real target too)
        if (b.classList.contains('azur-plaque') || this.wallGeo) e.stopPropagation();
        this.app.onGarmentClick(+b.dataset.index);
      });
      this.list.addEventListener('focusin', e => {
        const b = e.target.closest('.azur-g__hit'); if (b) this.setHover(+b.dataset.index, true);
      });
      this.list.addEventListener('focusout', () => { if (!this.pointer.inside) this.setHover(-1); });
      this.list.addEventListener('keydown', e => {
        const b = e.target.closest('.azur-g__hit'); if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        let j = +b.dataset.index + step;
        while (this.items[j] && !this.items[j].hit) j += step;      // empty places are skipped
        if (!this.items[j]) return;
        this.items[j].hit.focus();
        if (this.selected >= 0 && this.view !== 'room') this.app.select(j);
      });
      this.info.addEventListener('click', e => {
        const a = e.target.closest('[data-action]'); if (!a) return;
        e.preventDefault();
        if (a.dataset.action === 'view') this.app.openProduct(this.selected);
        if (a.dataset.action === 'back') this.app.select(-1);
      });
    }

    /* The jerseys of a view: their projected hangers (views.json slots). */
    layout(viewKey, viewData, comp) {
      this.view = viewKey; this.viewData = viewData; this.comp = comp;
      this.root.classList.toggle('is-room', viewKey === 'room');
      this.root.classList.toggle('is-mobile', viewKey === 'rail_m');
      const base = String(viewKey || '').split('@')[0];
      this.plaqueAt = PLAQUE_AT[base] || null;
      this.root.classList.toggle('has-plaques', !!this.plaqueAt);
      // D5: the views with a wall (room, rail, rail_m): the frames instead of the rendered jerseys
      const wg = this.wall && A.config.wall && A.config.wall[base];
      this.wallGeo = wg && wg.frames ? wg : null;
      this.root.classList.toggle('is-walled', !!this.wallGeo);
      if (this.wall) this.wall.layout(this.wallGeo);
      if (this.wallGeo) {
        this.geom = this.items.map(g => {
          const f = g.wall && !g.gone && this.wallGeo.frames[g.p.key];
          return f ? { wall: true, frame: f.frame, plaque: f.plaque, depthM: f.depth } : null;
        });
        this.items.forEach(g => { g.plSize = null; });
        this.place(); return;
      }
      const slots = (viewData && viewData.slots) || [], scale = (A.config.views[viewKey] || {}).garmentScale || 1;
      // views.json v2 names its slots (key): then a jersey finds its own; scene3 slots go by order
      const named = slots.some(s => s && s.key);
      this.geom = this.items.map((g, i) => {
        const s = named ? slots.find(x => x && x.key === g.p.key) : slots[i];
        return s && !g.gone ? { top: s.top, bottom: s.bottom, width: s.width, plaque: s.plaque, depthM: s.depth, scale } : null;
      });
      this.items.forEach(g => { g.plSize = null; });                // fonts and texts may have changed: measure again
      this.place();
    }

    /* Screen boxes of the jerseys (resize, pan, parallax); the keyboard targets sit on them (focus ring in place). */
    place() {
      const comp = this.comp; if (!comp || !comp.cssW) return;
      if (this.wallGeo) return this.placeWall(comp);
      this.px = this.geom.map((g, i) => {
        if (!g) return null;
        const d = this.app.depthAt(g.top[0], g.top[1], g.depthM);
        const top = comp.toScreen(g.top[0], g.top[1], d), bot = comp.toScreen(g.bottom[0], g.bottom[1], d);
        const h = Math.max(20, bot[1] - top[1]) * g.scale, w = h * (this.items[i].p.imageAspect || 0.9);
        return { x: top[0], y: top[1], w, h };
      });
      this.items.forEach((g, i) => {
        const p = this.px[i]; g.el.hidden = !p; if (!p) return;
        // the jerseys overlap on the rail: the ring is as wide as the step to the nearest neighbour
        const near = [this.px[i - 1], this.px[i + 1]].filter(Boolean).map(q => Math.abs(q.x - p.x));
        const w = Math.min(p.w, near.length ? Math.min(...near) * 1.05 : p.w);
        Object.assign(g.el.style, { width: w + 'px', height: p.h + 'px', transform: `translate3d(${(p.x - w / 2).toFixed(1)}px, ${p.y.toFixed(1)}px, 0)` });
        if (g.wall && g.hit) Object.assign(g.hit.style, { width: '', height: '', transform: '' });
        g.origin = [p.x - w / 2, p.y];
      });
      this.placePlaques();
    }

    /* D5: the wall and its frames on the screen. px[i]: the frame's box (x its middle, y its top) and its quad. */
    placeWall(comp) {
      const app = this.app;
      this.wall.place(comp, app.encDepth(this.wallGeo.depth));
      this.px = this.geom.map(g => {
        if (!g) return null;
        const d = app.encDepth(g.depthM), q = g.frame.map(p => comp.toScreen(p[0], p[1], d));
        const xs = q.map(p => p[0]), ys = q.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        return { x: (x0 + x1) / 2, y: y0, w: x1 - x0, h: y1 - y0, quad: q, d };
      });
      this.items.forEach((g, i) => {
        const p = this.px[i]; g.el.hidden = !p; if (!p) return;
        Object.assign(g.el.style, { width: '0px', height: '0px', transform: 'none' });
        g.origin = [0, 0];
        const [W, H] = WALL_PX[g.p.type === 'drop' ? 'drop' : 'product'];
        Object.assign(g.hit.style, { width: W + 'px', height: H + 'px', transform: quadMatrix(W, H, p.quad) });
      });
      this.placePlaques();
    }

    /* The plaques: on the screen like the jerseys (parallax, swipe), but they do not swing. */
    placePlaques() {
      const comp = this.comp, at = this.plaqueAt;
      if (!at) return;
      if (this.wallGeo) {          // D5: on the wall each plaque has its place under its frame (right-aligned with it)
        this.items.forEach((g, i) => {
          const geo = this.geom[i], el = g.plaque, p = this.px && this.px[i];
          if (!el || !geo || !p || !geo.plaque) return;
          const q = geo.plaque.map(pt => comp.toScreen(pt[0], pt[1], p.d));
          if (!g.plSize || !g.plSize.w) g.plSize = { w: el.offsetWidth, h: el.offsetHeight };
          const x = Math.max(q[1][0], q[2][0]) - g.plSize.w, y = Math.min(q[0][1], q[1][1]);
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        });
        return;
      }
      const boxes = [];
      this.items.forEach((g, i) => {
        const geo = this.geom[i], el = g.plaque;
        if (!el || !geo || !this.px[i]) return;
        const d = this.app.depthAt(geo.top[0], geo.top[1], geo.depthM);
        let x, y, centred = false;   // x: middle of the plaque, y: its top (centred: its middle)
        if (geo.plaque && geo.plaque.length >= 4) {
          const u = geo.plaque.reduce((s, q) => s + q[0], 0) / geo.plaque.length, v = geo.plaque.reduce((s, q) => s + q[1], 0) / geo.plaque.length;
          [x, y] = comp.toScreen(u, v, d); centred = true;
        } else {
          const wU = geo.width || 0.2, hV = geo.bottom[1] - geo.top[1];
          [x, y] = comp.toScreen(geo.bottom[0] + at.dx * wU, geo.bottom[1] + at.dy * hV, d);
        }
        if (!g.plSize || !g.plSize.w) g.plSize = { w: el.offsetWidth, h: el.offsetHeight };
        const { w, h } = g.plSize;
        x -= w / 2; if (centred) y -= h / 2;
        boxes.push({ g, x, y, w, h });
      });
      // two that touch: the left one steps aside to the lower left (see PLAQUE_GAP)
      boxes.sort((a, b) => a.x - b.x);
      const rowH = Math.max(0, ...boxes.map(q => q.h));
      for (let k = boxes.length - 2; k >= 0; k--) {
        const a = boxes[k], b = boxes[k + 1];
        if (b.down) continue;
        const over = a.x + a.w + PLAQUE_GAP - b.x;
        if (over > 0 && a.y < b.y + b.h && b.y < a.y + a.h) { a.x -= PLAQUE_SHIFT; a.y = b.y + rowH + PLAQUE_GAP; a.down = true; }
      }
      boxes.forEach(({ g, x, y }) => {
        g.plaque.style.transform = `translate3d(${(x - g.origin[0]).toFixed(1)}px, ${(y - g.origin[1]).toFixed(1)}px, 0)`;
      });
    }

    setHover(i, fromKeyboard) {
      if (i === this.hover) return;
      const prev = this.hover; this.hover = i;
      const sw = A.config.motion.sway, mi = A.config.motion.intensity * A.config.interactionStrength;
      if (prev >= 0 && this.items[prev]) this.items[prev].omega += sw.leaveKick * mi * (Math.random() > 0.5 ? 1 : -1);
      if (i >= 0 && this.items[i]) this.items[i].omega -= sw.hoverKick * mi * Math.sign(this.pointer.vx || 1);
      this.app.onHover(i, fromKeyboard);
      this.updateLabel();
    }

    setSelected(i) {
      this.selected = i;
      this.items.forEach((g, j) => g.el.classList.toggle('is-selected', j === i));
      if (i >= 0) this.items[i].omega += A.config.motion.sway.selectKick * A.config.motion.intensity;
      this.updateInfo();
      this.updateLabel();
    }

    /* Pointer from the app (CSS px inside the stage): the jersey under it from the rendered id mask. */
    pointerMove(x, y, vx) {
      this.pointer.x = x; this.pointer.y = y; this.pointer.vx = vx;
      if (!this.px || !this.px.length) return;
      const id = this.app.garmentAt(x, y), sw = A.config.motion.sway;
      this.pointer.inside = id >= 0;
      // brushing past a jersey sets it swinging
      if (id >= 0 && this.items[id]) this.items[id].omega += Math.max(-600, Math.min(600, vx)) * sw.brush * A.config.motion.intensity * A.config.interactionStrength;
      this.setHover(id);
    }
    pointerLeave() { this.pointer.inside = false; this.pointer.x = -1e4; this.setHover(-1); }

    /* Pan velocity on phones: the whole rail swings against the motion. */
    panImpulse(v) {
      const mi = A.config.motion.intensity * A.config.interactionStrength;
      this.items.forEach(g => (g.omega -= v * A.config.motion.sway.panImpulse * mi));
    }

    updateLabel() {
      const i = this.hover === this.selected && this.view !== 'room' ? -1 : this.hover, el = this.label;
      if (i < 0 || !this.items[i] || !this.px || !this.px[i]) { el.classList.remove('is-on'); return; }
      const p = this.items[i].p;
      el.innerHTML = p.type === 'drop'
        ? `<span class="azur-label__name">${A.esc(p.name)}</span><span class="azur-label__meta">${A.esc(p.description)}</span><span class="azur-label__cta">${A.config.copy.view || 'Ansehen'}</span>`
        : `<span class="azur-label__name">${A.esc(p.name)}</span><span class="azur-label__meta">${A.esc(A.formatPrice(p.price))}</span><span class="azur-label__cta">${A.config.copy.view}</span>`;
      el.classList.add('is-on');
      this.labelFor = i;
    }

    updateInfo() {
      const i = this.selected, el = this.info, c = A.config.copy;
      if (i < 0 || this.view === 'room') { el.classList.remove('is-on'); el.innerHTML = ''; return; }
      const p = this.items[i].p;
      if (p.type === 'drop') { el.classList.remove('is-on'); el.innerHTML = ''; this.app.drop.open(); return; }
      this.app.drop.close();
      el.innerHTML = `
        <span class="azur-info__n">${String(i + 1).padStart(2, '0')}</span>
        <span class="azur-info__name">${A.esc(p.name)}</span>
        <span class="azur-info__price">${A.esc(A.formatPrice(p.price))}</span>
        <a class="azur-info__cta" href="${A.esc(p.productUrl)}" data-action="view">${c.viewJersey} <span aria-hidden="true">→</span></a>
        <button class="azur-info__back" type="button" data-action="back">${c.putBack}</button>`;
      el.classList.add('is-on');
    }

    /* A push on one jersey (a click, a hover): it swings, its neighbours a little (they touch on the rail). */
    kickGarment(i, degPerS) {
      const sw = A.config.motion.sway, g = this.items[i]; if (!g) return;
      const dir = Math.sign(this.pointer.vx || (Math.random() - 0.5)) || 1, mi = A.config.motion.intensity * A.config.interactionStrength;
      g.omega += degPerS * dir * mi;
      [i - 1, i + 1].forEach(j => { if (this.items[j]) this.items[j].omega += degPerS * dir * sw.neighbour * mi; });
    }
    /* Everything on the rail waves once, left to right (after something went into the bag: there is more). */
    wave() {
      this.items.forEach((g, i) => setTimeout(() => this.kickGarment(i, A.config.motion.sway.hoverKick), 90 * i));
    }

    /* Pendulums: angle (rad) and cloth ripple (plate px) per jersey for the compositor, the label and the info line
       on their jerseys. Returns true while something swings. */
    step(dt, reduced) {
      this.t += dt;
      if (this.wallGeo) {          // D5: a frame on a wall does not swing
        this.items.forEach(g => { g.theta = 0; g.omega = 0; g.rip = 0; });
        if (this.swayAng) { this.swayAng.fill(0); this.swayRip.fill(0); }
        this.positionOverlays();
        return false;
      }
      const sw = A.config.motion.sway, mi = A.config.motion.intensity * A.config.interactionStrength, n = this.items.length;
      if (!this.swayAng) { this.swayAng = new Array(n).fill(0); this.swayRip = new Array(n).fill(0); }
      let moving = false;
      this.items.forEach((g, i) => {
        if (reduced) { g.theta = 0; g.omega = 0; g.rip = 0; this.swayAng[i] = 0; this.swayRip[i] = 0; return; }
        const acc = -sw.stiffness * g.theta - sw.damping * g.omega;
        g.omega = Math.max(-40, Math.min(40, g.omega + acc * dt)); g.theta += g.omega * dt;
        if (Math.abs(g.theta) > sw.maxDeg) { g.theta = Math.sign(g.theta) * sw.maxDeg; g.omega *= -0.3; }
        const idle = sw.idleDeg * mi * Math.sin(this.t * 1.13 + g.phase) * (0.55 + 0.45 * Math.sin(this.t * 0.31 + g.phase * 2.3));
        const ripT = (i === this.hover ? sw.ripple : 0) + Math.min(sw.ripple * 1.5, Math.abs(g.omega) * 0.5);
        g.rip += (ripT * mi - g.rip) * Math.min(1, dt * 3);
        this.swayAng[i] = (g.theta + idle) * Math.PI / 180; this.swayRip[i] = g.rip;
        if (Math.abs(g.omega) > 0.05 || Math.abs(g.theta) > 0.02 || g.rip > 0.05) moving = true;   // below that the cloth moves less than a pixel
      });
      this.positionOverlays();
      return moving;
    }

    positionOverlays() {
      const i = this.labelFor, H = this.app.stage.clientHeight;
      if (this.label.classList.contains('is-on') && this.px && this.px[i]) {
        const p = this.px[i];
        this.label.style.transform = `translate3d(${(p.x + p.w * 0.3).toFixed(1)}px, ${(p.y + p.h * 0.12).toFixed(1)}px, 0)`;
      }
      const s = this.selected;
      if (s >= 0 && this.px && this.px[s]) {
        const p = this.px[s];
        const bottom = Math.min(H - 96, p.y + p.h + 14), W = this.app.stage.clientWidth, half = this.info.offsetWidth / 2;
        const x = Math.max(16 + half, Math.min(W - 16 - half, p.x));      // the jersey at the edge keeps its line on screen
        this.info.style.transform = `translate3d(${x.toFixed(1)}px, ${bottom.toFixed(1)}px, 0) translateX(-50%)`;
        this.app.drop.position(p.x, p.y + p.h * 0.18, p);
      }
    }

    /* The focus glow follows the palette. */
    applyLight() { this.root.style.setProperty('--glow', A.config.palettes[A.config.palette].glow); }

    garmentRect(i) {
      const p = this.px && this.px[i]; if (!p) return null;
      const s = this.app.stage.getBoundingClientRect();
      return { left: s.left + p.x - p.w / 2, top: s.top + p.y, width: p.w, height: p.h, right: s.left + p.x + p.w / 2, bottom: s.top + p.y + p.h };
    }
  }

  A.Rail = Rail;
  A.inQuad = inQuad;
})();
