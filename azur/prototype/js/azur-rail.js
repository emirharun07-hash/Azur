/* AZUR — the garment rail. The jerseys are part of the rendered room (scene3); this layer keeps what sits on top of
   them: a keyboard target over each jersey, the hover label, the line under a chosen one, and the pendulum each jersey
   swings on (the compositor bends the plate by those angles). The pointer finds jerseys by the rendered id mask. */
(function () {
  const A = window.AZUR = window.AZUR || {};

  class Garment {
    constructor(product, index) {
      this.p = product; this.i = index;
      this.theta = 0; this.omega = 0; this.rip = 0; this.phase = index * 1.7;
      const label = product.type === 'drop' ? `${product.name}. ${product.description}` : `${product.name}, ${A.formatPrice(product.price)}`;
      this.el = document.createElement('li');
      this.el.className = 'azur-g';
      this.el.innerHTML = `<button class="azur-g__hit" type="button" aria-label="${label}" data-index="${index}"></button>`;
      this.hit = this.el.firstElementChild;
    }
  }

  class Rail {
    constructor(root, products, app) {
      this.app = app; this.root = root;
      this.list = document.createElement('ul');
      this.list.className = 'azur-rail'; this.list.setAttribute('aria-label', 'Trikots am Kleiderständer');
      root.appendChild(this.list);
      this.items = products.map((p, i) => new Garment(p, i));
      this.items.forEach(g => this.list.appendChild(g.el));
      this.hover = -1; this.selected = -1; this.view = null; this.geom = []; this.t = 0;
      this.pointer = { x: -1e4, y: -1e4, vx: 0, inside: false };
      this.label = document.createElement('div'); this.label.className = 'azur-label'; this.label.setAttribute('aria-hidden', 'true');
      root.appendChild(this.label);
      this.info = document.createElement('div'); this.info.className = 'azur-info'; this.info.setAttribute('role', 'region'); this.info.setAttribute('aria-live', 'polite');
      root.appendChild(this.info);
      this.bind();
    }

    bind() {
      this.list.addEventListener('click', e => {
        const b = e.target.closest('.azur-g__hit'); if (b) this.app.onGarmentClick(+b.dataset.index);
      });
      this.list.addEventListener('focusin', e => {
        const b = e.target.closest('.azur-g__hit'); if (b) this.setHover(+b.dataset.index, true);
      });
      this.list.addEventListener('focusout', () => { if (!this.pointer.inside) this.setHover(-1); });
      this.list.addEventListener('keydown', e => {
        const b = e.target.closest('.azur-g__hit'); if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
        e.preventDefault();
        const j = Math.max(0, Math.min(this.items.length - 1, +b.dataset.index + (e.key === 'ArrowRight' ? 1 : -1)));
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
      const slots = (viewData && viewData.slots) || [], scale = (A.config.views[viewKey] || {}).garmentScale || 1;
      this.geom = this.items.map((g, i) => slots[i] ? { top: slots[i].top, bottom: slots[i].bottom, depthM: slots[i].depth, scale } : null);
      this.place();
    }

    /* Screen boxes of the jerseys (resize, pan, parallax); the keyboard targets sit on them (focus ring in place). */
    place() {
      const comp = this.comp; if (!comp || !comp.cssW) return;
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
        ? `<span class="azur-label__name">${p.name}</span><span class="azur-label__meta">${p.description}</span><span class="azur-label__cta">Ansehen</span>`
        : `<span class="azur-label__name">${p.name}</span><span class="azur-label__meta">${A.formatPrice(p.price)}</span><span class="azur-label__cta">${A.config.copy.view}</span>`;
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
        <span class="azur-info__name">${p.name}</span>
        <span class="azur-info__price">${A.formatPrice(p.price)}</span>
        <a class="azur-info__cta" href="${p.productUrl}" data-action="view">${c.viewJersey} <span aria-hidden="true">→</span></a>
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
        if (Math.abs(g.omega) > 0.02 || Math.abs(g.theta) > 0.01 || g.rip > 0.05) moving = true;
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
})();
