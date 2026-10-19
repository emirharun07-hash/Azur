/* ==========================================================================
   AZUR — Theme-Skript
   Warenkorb (Shopify Cart API + Section Rendering), Menü, Kartenansicht vorne/hinten,
   Größenfilter, Produktgalerie, Kaufformular.
   Ohne JavaScript funktionieren alle Links und Formulare normal (Warenkorbseite /cart).
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  // Gemerkte Größe: nur Komfort, darf fehlen (privates Fenster, gesperrter Speicher).
  // Gelesen und gespeichert wird nur mit Einwilligung in „Präferenzen“ (Shopify Customer Privacy API,
  // Cookie-Banner unter Einstellungen → Kundendatenschutz). Ohne API oder ohne Zustimmung: nichts.
  const privacy = () => window.Shopify && window.Shopify.customerPrivacy;
  const mayRemember = () => {
    try { return Boolean(privacy() && privacy().preferencesProcessingAllowed()); } catch (e) { return false; }
  };
  const memory = {
    get() {
      if (!mayRemember()) return null;
      try { return window.localStorage.getItem('azur:size'); } catch (e) { return null; }
    },
    set(value) {
      if (!mayRemember()) return;
      try {
        if (value) window.localStorage.setItem('azur:size', value);
        else window.localStorage.removeItem('azur:size');
      } catch (e) { /* ohne Speicher weiter */ }
    },
  };
  // Einwilligung zurückgezogen: gemerkte Größe löschen
  document.addEventListener('visitorConsentCollected', (e) => {
    if (e.detail && e.detail.preferencesAllowed === false) {
      try { window.localStorage.removeItem('azur:size'); } catch (err) { /* ohne Speicher weiter */ }
    }
  });
  // Die API lädt Shopify nach; Vorauswahl erst ausführen, wenn sie da ist (oder sofort, wenn es sie nicht gibt)
  function withPrivacy(fn) {
    if (privacy() || !(window.Shopify && window.Shopify.loadFeatures)) return fn();
    window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], () => fn());
  }

  /* ---- Dialoge: Fokus halten, Hintergrund sperren -------------------------- */
  let openLayer = null;
  let returnFocus = null;

  function trapFocus(e) {
    if (!openLayer || e.key !== 'Tab') return;
    const items = $$(FOCUSABLE, openLayer).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', trapFocus);

  /* ---- Warenkorb ----------------------------------------------------------- */
  const drawer = $('[data-drawer]');
  const SECTION = 'cart-drawer';

  async function cartRequest(path, body) {
    const res = await fetch(root + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.assign({ sections: SECTION, sections_url: window.location.pathname }, body)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status >= 400) {
      const msg = data.description || data.message || 'Das hat nicht geklappt (' + res.status + ').';
      throw new Error(msg);
    }
    return data;
  }

  async function fetchDrawer() {
    const res = await fetch(root + '?sections=' + SECTION, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Warenkorb konnte nicht geladen werden.');
    return res.json();
  }

  // Tauscht den Inhalt der Seitenleiste gegen frisch gerenderte Liquid-Ausgabe
  function applyDrawer(sections) {
    if (!drawer || !sections || !sections[SECTION]) return;
    const doc = new DOMParser().parseFromString(sections[SECTION], 'text/html');
    const fresh = $('[data-cart-content]', doc);
    const current = $('[data-cart-content]', drawer);
    if (!fresh || !current) return;
    current.replaceWith(fresh);
    const count = fresh.dataset.count || '0';
    $$('[data-cart-count]').forEach((el) => (el.textContent = count));
  }

  function setStatus(text) {
    const el = drawer && $('[data-cart-status]', drawer);
    if (el) el.textContent = text || '';
  }
  function setError(text) {
    const el = drawer && $('[data-cart-error]', drawer);
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  }

  function openDrawer(trigger) {
    if (!drawer) return;
    closeMenu();
    returnFocus = trigger || document.activeElement;
    drawer.hidden = false;
    openLayer = drawer;
    document.documentElement.classList.add('is-locked');
    // Erst sichtbar schalten, Layout erzwingen, dann einschieben (Transition greift)
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    $('[data-cart-close].drawer__close', drawer).focus();
  }

  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    const done = () => {
      drawer.hidden = true;
      setStatus('');
      setError('');
    };
    if (calm.matches) done();
    else window.setTimeout(done, 240);
    openLayer = null;
    document.documentElement.classList.remove('is-locked');
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  }

  async function addToCart(variantId, label) {
    const data = await cartRequest('cart/add.js', { items: [{ id: Number(variantId), quantity: 1 }] });
    applyDrawer(data.sections);
    setError('');
    setStatus(label ? label + ' liegt im Warenkorb.' : 'Liegt im Warenkorb.');
    return data;
  }

  async function changeLine(key, quantity, which) {
    const content = $('[data-cart-content]', drawer);
    content.classList.add('is-busy');
    setStatus('');
    try {
      const data = await cartRequest('cart/change.js', { id: key, quantity: quantity });
      applyDrawer(data.sections);
      setError('');
      if (quantity === 0) setStatus('Artikel entfernt.');
      // Fokus auf denselben Knopf in der neu gerenderten Zeile, sonst auf "Schließen"
      const line = $('[data-line="' + CSS.escape(key) + '"]', drawer);
      const again = line && which && $('[aria-label="' + which + '"]', line);
      (again && !again.disabled ? again : $('.drawer__close', drawer)).focus();
    } catch (err) {
      setError(err.message);
      $('[data-cart-content]', drawer).classList.remove('is-busy');
    }
  }

  if (drawer) {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-cart-open]');
      if (opener) {
        e.preventDefault();
        openDrawer(opener);
        fetchDrawer().then(applyDrawer).catch((err) => setError(err.message));
        return;
      }
      if (e.target.closest('[data-cart-close]')) {
        closeDrawer();
        return;
      }
      const qty = e.target.closest('[data-qty]');
      if (qty && drawer.contains(qty) && !qty.disabled) {
        const line = qty.closest('[data-line]');
        if (line) changeLine(line.dataset.line, Number(qty.dataset.qty), qty.getAttribute('aria-label'));
      }
    });
  }

  /* ---- Menü (mobil) -------------------------------------------------------- */
  const menu = $('[data-menu]');
  const menuBtn = $('[data-menu-toggle]');

  function openMenu() {
    if (!menu || !menuBtn) return;
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    $('[data-menu-label]', menuBtn).textContent = 'Schließen';
    document.documentElement.classList.add('is-locked');
    openLayer = $('.header');
    returnFocus = menuBtn;
  }
  function closeMenu(restore) {
    if (!menu || !menuBtn || menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    $('[data-menu-label]', menuBtn).textContent = 'Menü';
    document.documentElement.classList.remove('is-locked');
    openLayer = null;
    if (restore) menuBtn.focus();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu(true)));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeMenu();
    });
    // Beim Wechsel auf Desktop-Breite schließen
    window.matchMedia('(min-width: 75em)').addEventListener('change', (e) => {
      if (e.matches) closeMenu();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (drawer && !drawer.hidden) closeDrawer();
    else if (menu && !menu.hidden) closeMenu(true);
  });

  /* ---- Header: Unterkante für Menü und Support-Leiste; Startseite durchsichtig über dem Einstieg ---- */
  const header = $('[data-header]');
  const hero = $('[data-hero]');
  if (header) {
    let queued = false;
    const update = () => {
      queued = false;
      const bottom = header.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty('--header-bottom', Math.round(bottom) + 'px');
      // fest, sobald der Einstieg nicht mehr hinter dem ganzen Header liegt
      if (header.classList.contains('header--overlay')) {
        header.classList.toggle('is-solid', !hero || hero.getBoundingClientRect().bottom <= bottom + 1);
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
  }

  /* ---- Produktkarte: vorne / hinten ---------------------------------------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view-btn]');
    if (!btn) return;
    const card = btn.closest('.card');
    const view = btn.dataset.viewBtn;
    card.dataset.view = view;
    $$('[data-view-btn]', card).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
  });

  /* ---- Shop: Größenfilter -------------------------------------------------- */
  $$('[data-collection]').forEach((el) => {
    const form = $('[data-filter]', el);
    const grid = $('[data-filter-grid]', el);
    if (!form || !grid) return;
    const status = $('[data-filter-status]', el);
    const empty = $('[data-filter-empty]', el);
    const cards = $$('.card', grid);

    function apply(value) {
      let shown = 0;
      cards.forEach((card) => {
        const sizes = (card.dataset.sizes || '').split(',');
        const match = !value || sizes.includes(value);
        card.hidden = !match;
        if (match) shown += 1;
        $$('.card__sizes [data-size]', card).forEach((s) => {
          if (s.tagName === 'S') return;
          if (value && s.dataset.size === value) s.dataset.state = 'pick';
          else delete s.dataset.state;
        });
      });
      status.textContent = (shown === 1 ? '1 Trikot' : shown + ' Trikots') + (value ? ' in Größe ' + value : '');
      empty.hidden = shown > 0;
      $('[data-filter-size]', empty).textContent = value;
    }

    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('change', (e) => {
      if (e.target.name !== 'size') return;
      memory.set(e.target.value || null);
      apply(e.target.value);
    });
    $('[data-filter-reset]', el).addEventListener('click', () => {
      $('input[name="size"][value=""]', form).checked = true;
      memory.set(null);
      apply('');
      $('input[name="size"][value=""]', form).focus();
    });

    withPrivacy(() => {
      const mine = memory.get();
      const radio = mine && $$('input[name="size"]', form).find((r) => r.value === mine);
      if (radio) {
        radio.checked = true;
        apply(mine);
      }
    });
  });

  /* ---- Produktseite: Galerie ----------------------------------------------- */
  $$('[data-gallery]').forEach((gallery) => {
    const track = $('[data-track]', gallery);
    const thumbs = $$('[data-go]', gallery);
    const now = $('[data-gallery-now]', gallery);
    if (!track) return;
    const slides = $$('.gallery__slide', track);
    let active = 0;

    function mark(i) {
      active = i;
      thumbs.forEach((t, j) => (i === j ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
      if (now) now.textContent = String(i + 1).padStart(2, '0');
    }
    function go(i) {
      const target = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: target * track.clientWidth, behavior: calm.matches ? 'auto' : 'smooth' });
      mark(target);
    }

    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i !== active) mark(i);
      });
    }, { passive: true });
    thumbs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.go))));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    });
    window.addEventListener('resize', () => track.scrollTo({ left: active * track.clientWidth }));
  });

  /* ---- Produktseite: Kaufen ------------------------------------------------ */
  $$('[data-product]').forEach((el) => {
    const form = $('[data-buy]', el);
    if (!form) return;
    const btn = $('[data-buy-btn]', form);
    const label = $('[data-buy-label]', form);
    const error = $('[data-buy-error]', form);
    const status = $('[data-buy-status]', form);
    const picked = $('[data-size-picked]', form);
    const fieldset = $('[data-sizes-picker]', form);
    const priceEl = $('[data-price]', el);
    const radios = $$('input[name="id"]', form);
    const title = el.dataset.productLabel || ($('.pdp__title', el) || {}).textContent;
    const productLabel = title ? title.replace(/\s+/g, ' ').trim() : '';
    const baseLabel = label ? label.textContent : '';
    if (!radios.length || radios.every((r) => r.disabled)) return;

    form.noValidate = true; // eigene Fehlermeldung statt Browser-Blase

    function showError(text) {
      error.textContent = text || '';
      error.hidden = !text;
      fieldset.classList.toggle('is-invalid', Boolean(text));
    }
    function choose(radio) {
      if (picked) picked.textContent = radio ? radio.dataset.size : '';
      if (radio && priceEl && radio.dataset.price) {
        priceEl.textContent = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(radio.dataset.price) / 100);
      }
    }

    // Gemerkte Größe vorwählen, wenn verfügbar (und erlaubt)
    const checked = radios.find((r) => r.checked);
    choose(checked || null);
    withPrivacy(() => {
      const mine = memory.get();
      const remembered = !radios.some((r) => r.checked) && mine && radios.find((r) => r.dataset.size === mine && !r.disabled);
      if (remembered) {
        remembered.checked = true;
        choose(remembered);
      }
    });

    form.addEventListener('change', (e) => {
      if (e.target.name !== 'id') return;
      memory.set(e.target.dataset.size);
      showError('');
      choose(e.target);
    });

    form.addEventListener('submit', async (e) => {
      const radio = radios.find((r) => r.checked);
      if (!radio) {
        e.preventDefault();
        showError('Bitte wähle zuerst eine Größe.');
        const first = radios.find((r) => !r.disabled);
        if (first) first.focus();
        return;
      }
      if (!drawer) return; // ohne Seitenleiste normal an /cart/add senden
      e.preventDefault();
      showError('');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      label.textContent = 'Wird hinzugefügt …';
      try {
        await addToCart(radio.value, productLabel + ', Größe ' + radio.dataset.size);
        status.textContent = 'Hinzugefügt: ' + productLabel + ', Größe ' + radio.dataset.size + '.';
        label.textContent = 'Hinzugefügt';
        btn.classList.add('is-done');
        openDrawer(btn);
        window.setTimeout(() => {
          label.textContent = baseLabel;
          btn.classList.remove('is-done');
        }, 2400);
      } catch (err) {
        label.textContent = baseLabel;
        showError(err.message);
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
    });
  });

  /* ---- Produktseite: feste Kaufleiste (Handy) ------------------------------ */
  // Erscheint, sobald der eigentliche Warenkorb-Button nicht im Bild ist. Größe und Preis laufen mit dem Formular mit.
  $$('[data-buybar]').forEach((bar) => {
    const scope = bar.closest('[data-product]');
    const form = scope && $('[data-buy]', scope);
    const main = form && $('[data-buy-btn]', form);
    if (!form || !main || !('IntersectionObserver' in window)) return;
    const select = $('[data-buybar-size]', bar);
    const add = $('[data-buybar-add]', bar);
    const price = $('[data-buybar-price]', bar);
    const mainPrice = $('[data-price]', scope);
    const radios = $$('input[name="id"]', form);
    bar.hidden = false;

    const sync = () => {
      const r = radios.find((x) => x.checked);
      select.value = r ? r.value : '';
      if (price && mainPrice) price.textContent = mainPrice.textContent;
    };
    form.addEventListener('change', (e) => { if (e.target.name === 'id') sync(); });
    select.addEventListener('change', () => {
      const r = radios.find((x) => x.value === select.value);
      if (!r) return;
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    });
    add.addEventListener('click', () => {
      if (!select.value) {
        select.focus();
        try { select.showPicker(); } catch (e) { /* ältere Browser: Fokus reicht */ }
        return;
      }
      if (form.requestSubmit) form.requestSubmit();
      else main.click();
    });
    withPrivacy(() => window.setTimeout(sync, 0));
    // erst wenn der Kaufknopf ganz zu sehen ist, verschwindet die Leiste (angeschnitten zählt als nicht sichtbar)
    new IntersectionObserver(([entry]) => bar.classList.toggle('is-shown', entry.intersectionRatio < 0.99), { threshold: [0, 0.99] }).observe(main);
  });

  /* ---- Produktseite: Bild vergrößern --------------------------------------- */
  const zoom = $('[data-zoom-dialog]');
  if (zoom && typeof zoom.showModal === 'function') {
    const img = $('[data-zoom-img]', zoom);
    const pane = img.parentElement;
    img.addEventListener('load', () => {
      pane.scrollLeft = (pane.scrollWidth - pane.clientWidth) / 2;
      pane.scrollTop = (pane.scrollHeight - pane.clientHeight) / 2;
    });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-zoom]');
      if (!btn) return;
      img.src = btn.dataset.zoom;
      img.alt = btn.dataset.zoomAlt || '';
      zoom.showModal();
    });
    $('[data-zoom-close]', zoom).addEventListener('click', () => zoom.close());
    zoom.addEventListener('click', (e) => { if (e.target === zoom) zoom.close(); });
  }
})();
