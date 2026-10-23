/* ==========================================================================
   AZUR — Theme-Skript
   Warenkorb (Shopify Cart API + Section Rendering), Header, Anmeldung, Produktgalerie (Pfeile, Punkte),
   Kaufformular, Feld „Nächster Drop“.
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
    // Ball und Balken rollen vom bisherigen Stand aus weiter (azur.css, „Ball rollt zum Gratis-Versand“)
    const before = $('.freeship__bar > span', current);
    const bar = $('.freeship__bar', fresh);
    if (before && bar) bar.style.setProperty('--from', before.style.width);
    current.replaceWith(fresh);
    const count = fresh.dataset.count || '0';
    const more = Number(count) > Number(($('[data-cart-count]') || {}).textContent || 0);
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      if (el.dataset.count !== undefined) el.dataset.count = count;
    });
    // die Sporttasche wackelt kurz, wenn etwas dazukommt (wie früher im Zimmer)
    const bag = $('.header__cart .bag3d');
    if (more && bag && bag.animate && !calm.matches) {
      bag.animate([{ transform: 'none' }, { transform: 'translateY(-4px) rotate(-8deg)', offset: 0.35 },
        { transform: 'translateY(0) rotate(4deg)', offset: 0.7 }, { transform: 'none' }], { duration: 620, easing: 'ease-out' });
    }
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && !drawer.hidden) closeDrawer();
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
        // Runde 17: auf der Startseite meldet das Zimmer selbst, wann der Übergang fertig ist (html.azur-past)
        header.classList.toggle('is-solid', !hero || document.documentElement.classList.contains('azur-past') || hero.getBoundingClientRect().bottom <= bottom + 1);
      }
      // schmal, sobald die Leiste oben weggescrollt ist
      header.classList.toggle('is-compact', window.scrollY > 48);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('azur-hero', queue);      // das Zimmer meldet das Ende seines Übergangs
    header.addEventListener('transitionend', queue); // Unterkante nach dem Schrumpfen neu messen
  }

  /* ---- Anmeldung (Runde 12): Adresse vor dem Absenden prüfen, Fehler direkt unter dem Feld ------------- */
  $$('form.signup').forEach((form) => {
    const input = $('[data-signup-email]', form);
    const error = $('[data-signup-error]', form);
    if (!input || !error) return;
    form.noValidate = true;
    const show = (text) => {
      error.textContent = text;
      error.hidden = !text;
      input.setAttribute('aria-invalid', String(Boolean(text)));
    };
    form.addEventListener('submit', (e) => {
      const value = input.value.trim();
      let text = '';
      if (!value) text = 'Bitte gib deine E-Mail-Adresse ein.';
      else if (!input.checkValidity() || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value)) text = 'Diese Adresse ist nicht vollständig, z. B. name@beispiel.de.';
      if (text) {
        e.preventDefault();
        show(text);
        input.focus();
      }
    });
    input.addEventListener('input', () => { if (!error.hidden) show(''); });
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
    // Runde 13: Pfeile links und rechts (am Ende geht es wieder von vorn los)
    const prev = $('[data-gallery-prev]', gallery);
    const next = $('[data-gallery-next]', gallery);
    if (prev) prev.addEventListener('click', () => go(active === 0 ? slides.length - 1 : active - 1));
    if (next) next.addEventListener('click', () => go(active === slides.length - 1 ? 0 : active + 1));
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
        const data = await addToCart(radio.value, productLabel + ', Größe ' + radio.dataset.size);
        status.textContent = 'Hinzugefügt: ' + productLabel + ', Größe ' + radio.dataset.size + '.';
        label.textContent = 'Hinzugefügt';
        // Runde 17: das Plus dreht sich zur Anzahl dieser Größe im Warenkorb, dann gleitet der Warenkorb herein
        const line = data && data.items && data.items.find((i) => String(i.variant_id || i.id) === String(radio.value));
        btn.dataset.qty = line && line.quantity ? line.quantity : 1;
        btn.classList.add('is-done');
        window.setTimeout(() => openDrawer(btn), calm.matches ? 0 : 750);
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
