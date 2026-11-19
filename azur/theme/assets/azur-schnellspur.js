/* AZUR W1 Schnellspur: Kauf in 2 Tipps (Größe, „In die Tasche“). Klein, ohne Abhängigkeit zum Zimmer.
   Ohne JavaScript sendet das Formular normal an /cart/add. Mit JavaScript: /cart/add.js mit sections=cart-drawer,
   dann öffnet sich der vorhandene Warenkorb (azur.js: Klick auf [data-cart-open]). Texte kommen aus Liquid (data-ss-*). */
(function () {
  'use strict';
  var page = document.querySelector('[data-ss]');
  if (!page) return;
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  // Bilder: Punkte scrollen die Bildleiste, statt die Seite springen zu lassen
  var track = page.querySelector('[data-ss-track]');
  var dots = Array.prototype.slice.call(page.querySelectorAll('[data-ss-dot]'));
  if (track && dots.length) {
    var mark = function (i) {
      dots.forEach(function (d, j) { if (i === j) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    };
    dots.forEach(function (d) {
      d.addEventListener('click', function (e) {
        e.preventDefault();
        var i = Number(d.dataset.ssDot);
        track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
        mark(i);
      });
    });
    var raf = 0;
    track.addEventListener('scroll', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { mark(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))); });
    }, { passive: true });
  }

  var form = page.querySelector('[data-ss-form]');
  if (!form) return;
  var btn = form.querySelector('[data-ss-add]');
  var label = form.querySelector('[data-ss-label]');
  var error = form.querySelector('[data-ss-error]');
  var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="id"]'));
  var baseLabel = label ? label.textContent : '';

  function picked() {
    for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i];
    return null;
  }
  function sync() {
    var r = picked();
    btn.disabled = !r;
    form.classList.toggle('is-picked', Boolean(r));
  }
  function showError(text) {
    error.textContent = text || '';
    error.hidden = !text;
  }
  sync();
  form.addEventListener('change', function () { showError(''); sync(); });

  // Warenkorb-Inhalt aus der Antwort einsetzen (wie azur.js), dann den Warenkorb öffnen
  function applyDrawer(html) {
    var drawer = document.querySelector('[data-drawer]');
    if (!drawer || !html) return;
    var fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-cart-content]');
    var current = drawer.querySelector('[data-cart-content]');
    if (!fresh || !current) return;
    current.replaceWith(fresh);
    var count = fresh.dataset.count || '0';
    Array.prototype.forEach.call(document.querySelectorAll('[data-cart-count]'), function (el) {
      el.textContent = count;
      if (el.dataset.count !== undefined) el.dataset.count = count;
    });
  }

  form.addEventListener('submit', function (e) {
    var r = picked();
    var opener = document.querySelector('[data-cart-open]');
    if (!r || !opener || !window.fetch) return; // ohne Warenkorb-Leiste: normal senden
    e.preventDefault();
    showError('');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    if (label) label.textContent = page.dataset.ssAdding || baseLabel;
    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(r.value), quantity: 1 }], sections: 'cart-drawer', sections_url: window.location.pathname })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || data.status >= 400) throw new Error(data.description || data.message || page.dataset.ssFailed || '');
          return data;
        });
      })
      .then(function (data) {
        applyDrawer(data.sections && data.sections['cart-drawer']);
        opener.click();
      })
      .catch(function (err) { showError(err.message || page.dataset.ssFailed); })
      .then(function () {
        if (label) label.textContent = baseLabel;
        btn.removeAttribute('aria-busy');
        sync();
      });
  });
})();
