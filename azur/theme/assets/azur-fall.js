/* AZUR Startseite (Runde 26): der Weg vom Zimmer hinunter in den Shop.
   Bis Runde 25 lag das in azur-room.js und lief erst, wenn das Zimmer geladen war; jetzt eigenständig und klein.
   - misst, wo das Zimmer endet (--azur-end: so weit gescrollt ist das Zimmer ganz weg),
   - setzt am <html> azur-diving (Seite hat oben verlassen), azur-light (heller Grund hinter dem Header: dunkle Schrift),
     azur-past (Übergang fertig, Header fest; azur.js hört auf `azur-hero`) und azur-away (Zimmer nicht mehr zu sehen;
     das Zimmer hört auf `azur-fall` und zeichnet dann nicht),
   - färbt die Browserleiste (theme-color) dunkel über dem Zimmer, weiß im Shop,
   - und je nach Variante (data-azs, aus snippets/azur-variants.liquid): glide = nach dem Loslassen gleitet die Seite
     von selbst ganz ins Zimmer oder ganz zu den Trikots (Stand Runde 25), native = der Browser scrollt ganz normal
     (die Wahl des Owners, auf allen Geräten).
   Die Bewegung selbst (Zimmer bleibt zurück, Blende, Trikots steigen) macht CSS mit dem Scrollen (sections/azur-room.liquid);
   wo der Browser das nicht kann, liefert dieses Skript --azur-t (0 im Zimmer, 1 im Shop). */
(() => {
  const html = document.documentElement;
  const mark = document.querySelector('.azur-fall');
  if (!mark) return;
  const F = window.AZUR_FALL = { end: 1, vh: 1, t: 0 };
  const mm = q => (window.matchMedia ? matchMedia(q) : { matches: false });
  const reduce = mm('(prefers-reduced-motion: reduce)');
  const byCss = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
  if (!byCss) html.classList.add('azur-slide-js');
  const meta = document.querySelector('meta[name="theme-color"]');
  const mode = () => (reduce.matches ? 'native' : html.getAttribute('data-azs') || 'glide');

  const flag = (c, on) => {
    if (html.classList.contains(c) === on) return false;
    html.classList.toggle(c, on); return true;
  };
  const update = () => {
    const y = window.scrollY, end = F.end, hb = parseFloat(html.style.getPropertyValue('--header-bottom')) || 0;
    const t = F.t = Math.min(1, Math.max(0, y / end));
    // Blende und Kamera: der Grund wird schon über dem Zimmer hell; sonst erst, wenn das Blatt den Header erreicht
    const fade = /^(blende|kamera)$/.test(html.getAttribute('data-azt'));
    let moved = flag('azur-diving', y > 4);
    if (flag('azur-light', fade ? t > 0.6 || end - y - hb / 2 < 40 : end - y - hb / 2 < 40) && meta) {
      meta.setAttribute('content', html.classList.contains('azur-light') ? '#ffffff' : '#0b0b0c');
    }
    if (flag('azur-past', end - y <= hb + 1)) window.dispatchEvent(new Event('azur-hero'));
    moved = flag('azur-away', y >= end - 1) || moved;
    if (moved) window.dispatchEvent(new Event('azur-fall'));
    if (!byCss) html.style.setProperty('--azur-t', t.toFixed(3));
  };
  const measure = () => {
    F.vh = window.innerHeight || 1;
    // das Blatt überlappt den Fuß des Zimmers um seine Lippe (negativer Rand); ein kurzer Shop auf einem hohen
    // Tablet endet vorher
    const lip = -parseFloat(getComputedStyle(mark).marginTop) || 0;
    const end = Math.max(1, Math.round(Math.min(mark.getBoundingClientRect().top + window.scrollY + lip, html.scrollHeight - F.vh)));
    if (end !== F.end) { F.end = end; html.style.setProperty('--azur-end', end + 'px'); }
    update();
  };

  /* glide (Runde 25): wo die Seite zwischen Zimmer (0) und Shop (end) liegen bleibt, gleitet sie von selbst weiter.
     Hinunter reicht ein kurzes Stück; hinauf geht es erst zurück ins Zimmer, wenn man weit hineinzieht, sonst gleitet
     sie zurück zu den Trikots. Eine Berührung, das Mausrad oder eine Taste hält das Gleiten an. */
  const GO_DOWN = 90, GO_UP = 0.4;
  let lastY = window.scrollY, dir = 0, touching = false, glide = 0, idle = 0;
  const stopGlide = () => { if (glide) { cancelAnimationFrame(glide); glide = 0; } };
  const glideTo = top => {
    stopGlide();
    const y0 = window.scrollY, d = top - y0;
    if (Math.abs(d) < 2) { window.scrollTo(0, top); return; }
    const dur = Math.min(950, 560 + Math.abs(d) * 0.4), t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      window.scrollTo(0, Math.round(y0 + d * e));
      glide = k < 1 ? requestAnimationFrame(step) : 0;
    };
    glide = requestAnimationFrame(step);
  };
  const settle = () => {
    if (touching || glide || mode() !== 'glide') return;
    const y = window.scrollY, end = F.end;
    if (y <= 1 || y >= end - 1) return;
    glideTo(dir >= 0 ? (y > Math.min(0.1 * end, GO_DOWN) ? end : 0) : (y < end * (1 - GO_UP) ? 0 : end));
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (y !== lastY && !glide) dir = y > lastY ? 1 : -1;
    lastY = y; update();
    clearTimeout(idle); if (!glide && !touching) idle = setTimeout(settle, 110);
  };
  const release = () => { touching = false; clearTimeout(idle); idle = setTimeout(settle, 110); };
  window.addEventListener('scroll', onScroll, { passive: true });
  if ('onscrollend' in window) window.addEventListener('scrollend', () => { clearTimeout(idle); if (!glide && !touching) idle = setTimeout(settle, 30); });
  window.addEventListener('touchstart', () => { touching = true; stopGlide(); }, { passive: true });
  window.addEventListener('touchend', release, { passive: true });
  window.addEventListener('touchcancel', release, { passive: true });     // Runde 26: sonst blieb touching hängen
  window.addEventListener('wheel', stopGlide, { passive: true });
  window.addEventListener('keydown', stopGlide);

  let mq = false;
  const remeasure = () => { if (!mq) { mq = true; requestAnimationFrame(() => { mq = false; measure(); }); } };
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', measure);
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);
  measure();
  if (meta) meta.setAttribute('content', html.classList.contains('azur-light') ? '#ffffff' : '#0b0b0c');
})();
