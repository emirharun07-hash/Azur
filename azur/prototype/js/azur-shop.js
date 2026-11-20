/* AZUR — product page over the room and the cart.
   The product view opens over the room right from a click on a jersey: the jersey's shop photo large in the middle
   (Runde 16: no more 3D model, it looked crumpled), on a background in the jersey's colour, the sizes beside it. After a size goes into the bag,
   the page shows how far it is to free shipping and offers to keep looking. Prototype: a simulated cart. Shopify
   (A.config.shopify): the real cart (/cart/add.js, /cart.js) and the theme's own cart drawer; checkout is Shopify's.
   P1 (Produktansicht): all photos (dots, arrows, swipe, ←/→), „Limitiert“ under the name, a size chart sheet, shipping /
   delivery / returns under the button, „Material & Pflege“ and „Produktsicherheit“, a direct checkout under the button
   (Shopify's own button from a hidden product form, else a link via /cart/add.js), the payment logos and a quiet line
   „Dazu: …“. The extra data comes from snippets/azur-product-json.liquid (product.extra, A.pdp.shared); without it the
   view stays as before (one photo, the shipping line). */
(function () {
  const A = window.AZUR = window.AZUR || {};

  /* where each size stands on the pitch (percent of width, height): the liked line-up for S, M, L, XL, a spread otherwise */
  const FORMATION = { 3: [[24, 68], [76, 68], [50, 26]], 4: [[22, 72], [50, 61], [78, 72], [50, 25]], 5: [[18, 74], [40, 60], [60, 60], [82, 74], [50, 24]],
    6: [[16, 76], [38, 62], [62, 62], [84, 76], [32, 26], [68, 26]] };
  const pitchSpot = (n, i) => (FORMATION[n] || [])[i] || [12 + (i % 4) * 25, i < 4 ? 70 : 28];

  /* P1 texts (German defaults; the theme sets A.config.copy.* for other languages, see texte-en.json of P1) */
  const P1 = { sizeChart: 'Größentabelle', closeSheet: 'Größentabelle schließen', materialCare: 'Material & Pflege', safety: 'Produktsicherheit',
    material: 'Material', care: 'Pflege', maker: 'Hersteller / Verantwortlicher', contact: 'Kontakt', directCheckout: 'Direkt zur Kasse',
    chooseSizeFirst: 'Erst Größe wählen', pairWith: 'Dazu: {name}', pairFree: '2 Trikots = Versand frei', images: 'Bilder',
    prevImage: 'Vorheriges Bild', nextImage: 'Nächstes Bild', limited: 'Limitiert auf 50 Stück' };
  /* P2 texts (German defaults; texte-en.json of P2) */
  Object.assign(P1, { upsellFree: '+ {price} · Versand dann frei', upsellSize: 'Größe wählen', upsellAdded: 'Liegt im Warenkorb.' });
  /* P3 texts (German defaults; texte-en.json of P3). Scarcity without numbers: only the flags „low“ (stock 1 to 3) and „taken“. */
  Object.assign(P1, { lowFew: 'nur noch wenige', lowLine: 'Größe {size}: nur noch wenige', takenSr: '{size}, vergeben', notifyTitle: 'Größe {size} ist vergeben.',
    notifyButton: 'Bescheid sagen', notifyMail: 'E-Mail', notifyDone: 'Wir schreiben dir beim nächsten Drop.' });
  const tx = k => { const c = A.config && A.config.copy; return c && c[k] != null ? c[k] : P1[k]; };
  const shopRoot = () => (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
  /* what Tab can reach: one stop per radio group (the checked one, else the first), nothing hidden, inert or folded away */
  const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), summary, select:not([disabled]), textarea:not([disabled]), iframe, [tabindex="0"]';
  const tabStops = root => {
    const seen = new Set();
    return [...root.querySelectorAll(FOCUSABLE)].filter(x => {
      if (!x.getClientRects().length || x.closest('[hidden], [inert]')) return false;
      const d = x.closest('details'); if (d && !d.open && !(x.tagName === 'SUMMARY' && x.parentElement === d)) return false;
      if (x.type === 'radio' && x.name) {
        if (seen.has(x.name)) return false;
        const group = [...root.querySelectorAll(`input[type="radio"][name="${x.name}"]:not([disabled])`)];
        const pick = group.find(r => r.checked) || group[0];
        if (pick !== x) return false;
        seen.add(x.name);
      }
      return true;
    });
  };

  class Shop {
    constructor(app) {
      this.app = app; this.live = !!A.config.shopify; this.cart = this.live ? [] : this.load();
      const c = A.config.copy;
      this.pdp = document.createElement('section');
      this.pdp.className = 'azur-pdp'; this.pdp.setAttribute('role', 'dialog'); this.pdp.setAttribute('aria-modal', 'true'); this.pdp.setAttribute('aria-labelledby', 'azur-pdp-title');
      // Runde 10 (Design-Finale): „Modemagazin + Aufstellung“. Der Name groß über der Seite, das Trikot davor,
      // links Schnitt und Beschreibung, rechts die Größen als Spieler auf einem kleinen Feld, unten eine feste Kaufleiste.
      // Runde 16: Grund in der Trikotfarbe, Name kleiner, weniger Text (kein Pfad, Hinweise, Pflegezeile, Zurück-Link, Name in der Leiste).
      this.pdp.innerHTML = `
        <button class="azur-pdp__x" type="button" data-act="close" aria-label="${c.backToRoom}"><span aria-hidden="true">×</span></button>
        <h1 class="azur-pdp__title" id="azur-pdp-title"></h1>
        <p class="azur-pdp__limited" hidden></p>
        <div class="azur-pdp__stage">
          <div class="azur-pdp__track" tabindex="0" role="group" aria-label="${tx('images')}"></div>
          <button class="azur-pdp__arrow is-prev" type="button" data-act="prev" aria-label="${tx('prevImage')}"><span aria-hidden="true">‹</span></button>
          <button class="azur-pdp__arrow is-next" type="button" data-act="next" aria-label="${tx('nextImage')}"><span aria-hidden="true">›</span></button>
          <div class="azur-pdp__dots" role="group" aria-label="${tx('images')}"></div>
        </div>
        <div class="azur-pdp__story">
          <p class="azur-pdp__fit"></p>
          <p class="azur-pdp__desc"></p>
          <details class="azur-pdp__more" data-more="care" hidden><summary>${tx('materialCare')}</summary><dl></dl></details>
          <details class="azur-pdp__more" data-more="gpsr" hidden><summary>${tx('safety')}</summary><dl></dl></details>
          <p class="azur-pdp__pair" hidden></p>
          <a class="azur-pdp__shop" target="_blank" rel="noopener">${c.openInShop || c.toProductPage || 'Im Shop öffnen'} <span aria-hidden="true">↗</span></a>
        </div>
        <fieldset class="azur-pdp__sizes">
          <legend>${A.config.copy.yourSize || 'Deine Größe'}</legend>
          <button class="azur-pdp__chart" type="button" data-act="chart" aria-haspopup="dialog" aria-expanded="false" hidden>${tx('sizeChart')}</button>
          <div class="azur-pdp__sizerow azur-pitch"><span class="azur-pitch__box is-top"></span><span class="azur-pitch__box is-bottom"></span></div>
          <p class="azur-pdp__lowline" role="status" hidden></p>
          <form class="azur-pdp__notify" novalidate hidden>
            <p class="azur-pdp__notifytitle"></p>
            <div class="azur-pdp__notifyrow">
              <label class="azur-sr" for="azur-pdp-notify-mail">${tx('notifyMail')}</label>
              <input id="azur-pdp-notify-mail" type="email" name="contact[email]" autocomplete="email" inputmode="email" spellcheck="false" placeholder="${c.dropPlaceholder || ''}" required>
              <button type="submit">${tx('notifyButton')}</button>
            </div>
            <p class="azur-pdp__notifyerr" role="alert" hidden></p>
            <p class="azur-pdp__notifylegal">${c.dropLegal || ''}</p>
          </form>
          <p class="azur-pdp__notifydone" role="status" hidden></p>
        </fieldset>
        <div class="azur-pdp__aside" hidden><ul class="azur-pdp__lines"></ul><div class="azur-pdp__pay"></div></div>
        <div class="azur-pdp__buy">
          <p class="azur-pdp__name"><span class="azur-pdp__price"></span></p>
          <p class="azur-pdp__ship">${A.store.shipping || ''}</p>
          <ul class="azur-pdp__lines" hidden></ul>
          <div class="azur-pdp__ctas">
            <button class="azur-pdp__add" type="button" data-act="add" disabled>${c.chooseSize}</button>
            <div class="azur-pdp__direct" hidden></div>
            <div class="azur-pdp__pay" hidden></div>
          </div>
          <p class="azur-pdp__error" role="alert" hidden></p>
        </div>
        <div class="azur-pdp__sheet" role="dialog" aria-modal="true" aria-labelledby="azur-pdp-sheet-title" hidden>
          <div class="azur-pdp__sheethead">
            <h2 id="azur-pdp-sheet-title">${tx('sizeChart')}</h2>
            <button type="button" data-act="sheet-close" aria-label="${tx('closeSheet')}"><span aria-hidden="true">×</span></button>
          </div>
          <div class="azur-pdp__sheetbody"></div>
        </div>
        <div class="azur-pdp__after" role="status" hidden>
          <p class="azur-pdp__shipnow"></p>
          <div class="azur-pdp__bar" aria-hidden="true"><i></i><b></b></div>
          <div class="azur-pdp__upsell" hidden></div>
          <div class="azur-pdp__acts2">
            <button type="button" data-act="more">${c.keepLooking}</button>
            <button type="button" ${this.live ? 'data-cart-open' : 'data-act="cart"'}>${c.toCart}</button>
          </div>
        </div>`;
      document.body.appendChild(this.pdp);
      if (this.live) { this.drawer = null; this.bind(); return; }      // the theme's cart drawer takes over

      this.drawer = document.createElement('aside');
      this.drawer.className = 'azur-cart'; this.drawer.setAttribute('aria-label', c.cart); this.drawer.setAttribute('aria-hidden', 'true');
      this.drawer.innerHTML = `
        <header class="azur-cart__head"><h2>${c.cart}</h2><button type="button" class="azur-cart__close" aria-label="${c.close || 'Schließen'}">×</button></header>
        <ul class="azur-cart__list"></ul>
        <footer class="azur-cart__foot">
          <p class="azur-cart__total"><span>${c.total}</span><strong></strong></p>
          <p class="azur-cart__vat">${c.inclVat} · ${A.store.shipping}</p>
          <button type="button" class="azur-cart__checkout">${c.checkout}</button>
          <p class="azur-cart__note">${c.prototypeNote}</p>
        </footer>`;
      this.drawer.inert = true;                       // closed: nothing in it takes focus
      document.body.appendChild(this.drawer);
      this.bind(); this.renderCart();
    }

    bind() {
      this.pdp.addEventListener('click', e => {
        const t = e.target.closest('[data-act]'); if (!t) return;
        if (t.dataset.act === 'close') this.close();
        if (t.dataset.act === 'add') this.add();
        if (t.dataset.act === 'more') { const f = this.from; this.close(); if (!f) this.app.keepLooking(); }
        if (t.dataset.act === 'cart') { this.close(); this.toggleCart(true); }
        if (t.dataset.act === 'prev') this.go(this.gi - 1);
        if (t.dataset.act === 'next') this.go(this.gi + 1);
        if (t.dataset.act === 'dot') this.go(+t.dataset.i);
        if (t.dataset.act === 'chart') this.sheet(this.pdp.querySelector('.azur-pdp__sheet').hidden);
        if (t.dataset.act === 'sheet-close') this.sheet(false);
        if (t.dataset.act === 'direct') this.direct(e);
        if (t.dataset.act === 'upsell') this.upsellAdd(t);
        if (t.dataset.act === 'notify') this.notifyOpen(t.dataset.size, t.dataset.variant, t);
        if (t.dataset.act === 'pair' && this.pairWith) { this.open(this.pairWith, null, this.from); }
      });
      // the photos: the dots follow the swipe; ←/→ on the photos
      const track = this.pdp.querySelector('.azur-pdp__track');
      let raf = 0;
      track.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; const w = track.clientWidth || 1; this.markImage(Math.round(track.scrollLeft / w)); });
      }, { passive: true });
      this.pdp.querySelector('.azur-pdp__stage').addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (!(this.media && this.media.length > 1)) return;
        e.preventDefault(); this.go(this.gi + (e.key === 'ArrowRight' ? 1 : -1));
      });
      this.pdp.querySelector('.azur-pdp__notify').addEventListener('submit', e => { e.preventDefault(); this.notifySend(); });
      this.pdp.addEventListener('change', e => {
        if (e.target.name === 'azur-size') {
          this.size = e.target.value;
          this.sizeNote(e.target.dataset.size, this.lowIds.has(String(e.target.value)));
          const b = this.pdp.querySelector('.azur-pdp__add');
          b.disabled = false; b.textContent = A.config.copy.addToCart; b.classList.remove('is-done');
          this.pdp.querySelector('.azur-pdp__after').hidden = true;
          this.directReady(true);
        }
      });
      // Escape closes the product view only (the room's own Escape would also fly back to the room); Tab stays inside it.
      // With the size chart open, Escape closes only the chart and Tab stays in the chart.
      this.pdp.addEventListener('keydown', e => {
        const sheet = this.pdp.querySelector('.azur-pdp__sheet');
        if (e.key === 'Escape') { e.stopPropagation(); if (!sheet.hidden) this.sheet(false); else this.close(); return; }
        if (e.key !== 'Tab') return;
        const f = tabStops(sheet.hidden ? this.pdp : sheet);
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
      });
      if (!this.drawer) return;
      this.drawer.querySelector('.azur-cart__close').addEventListener('click', () => this.toggleCart(false));
      this.drawer.addEventListener('click', e => {
        const r = e.target.closest('[data-remove]'); if (!r) return;
        this.cart.splice(+r.dataset.remove, 1); this.save(); this.renderCart();
      });
      this.drawer.querySelector('.azur-cart__checkout').addEventListener('click', e => {
        e.currentTarget.textContent = 'Im Prototyp ohne Kasse'; setTimeout(() => { e.target.textContent = A.config.copy.checkout; }, 1800);
      });
    }

    /* from: null when the room opens it; outside the room (Runde 19, azur-pdp.js) { page, closed }: page = the view is the
       product page itself, closed = what happens after closing (the product page goes back) */
    open(product, fromRect, from) {
      if (!product || product.type !== 'product') return;
      if (!this.pdp.classList.contains('is-on')) this.returnFocus = document.activeElement;   // back there on close
      this.product = product; this.size = null; this.from = from || null;
      const q = s => this.pdp.querySelector(s);
      const x = product.extra || {};                                     // P1: snippets/azur-product-json.liquid
      this.sheet(false, true); this.pdp.scrollTop = 0;
      q('.azur-pdp__x').setAttribute('aria-label', from ? A.config.copy.close || 'Schließen' : A.config.copy.backToRoom);
      // the name is the city or country alone ("Frankfurt"), without " Trikot" and the dialling code
      const giant = product.name.replace(/\s*Trikot$/i, '').replace(/\s+\d{2,4}$/, '');
      q('.azur-pdp__title').textContent = giant; q('.azur-pdp__title').style.setProperty('--len', Math.max(5, giant.length));
      q('.azur-pdp__price').textContent = A.formatPrice(product.price);   // Runde 12: no tax note next to the price (footer, cart, checkout)
      // background, text and button in the jersey's colours (the palettes are tokens in the theme's azur.css, see azur-room.css)
      const tone = product.tone || { frankfurt: 'ffm', berlin: 'ber', brasilien: 'bra', deutschland: 'ger', tuerkei: 'tur' }[product.key];
      if (tone) this.pdp.dataset.tone = tone; else delete this.pdp.dataset.tone;
      q('.azur-pdp__fit').textContent = product.fit || '';
      q('.azur-pdp__desc').textContent = product.description;
      q('.azur-pdp__shop').href = product.productUrl;      // Shopify: the real product page
      q('.azur-pdp__shop').hidden = !!(from && from.page);
      // „Limitiert auf 50 Stück“ under the name: the room's text (product.limited), else the snippet's, else the default; empty = no line
      const lim = product.limited != null ? product.limited : x.limited != null ? x.limited : tx('limited');
      q('.azur-pdp__limited').textContent = lim || ''; q('.azur-pdp__limited').hidden = !lim;
      this.gallery(product, x);
      const img = q('.azur-pdp__img');
      this.details(x);
      this.lines(x);
      this.pair(product);
      q('.azur-pdp__after').hidden = true;
      // die Größen als Spieler: Aufstellung auf dem Feld (breit), auf dem Handy in einer Reihe (--hx)
      const n = product.variants.length;
      q('.azur-pdp__sizerow').querySelectorAll('.azur-pl').forEach(el => el.remove());
      // P3: „low“ = stock 1 to 3 (a flag per size from the room, or the ids in extra.low; never a number). A taken size is a
      // button, not a radio: it cannot be chosen, but it can be tapped for „Bescheid sagen“.
      this.lowIds = new Set(product.variants.filter(v => v.available && (v.low === true || (x.low || []).map(String).includes(String(v.id)))).map(v => String(v.id)));
      this.notifyClose(); this.sizeNote(null);
      q('.azur-pdp__sizerow').insertAdjacentHTML('beforeend', product.variants.map((v, i) => {
        const [x, y] = pitchSpot(n, i), hx = n > 1 ? 12 + i * 76 / (n - 1) : 50, pos = `style="--x:${x}%;--y:${y}%;--hx:${hx.toFixed(1)}%"`;
        if (!v.available) return `<span class="azur-pl is-taken" ${pos}><button type="button" data-act="notify" data-size="${A.esc(v.title)}" data-variant="${A.esc(v.id)}" aria-disabled="true" aria-haspopup="true" aria-label="${A.esc(String(tx('takenSr')).replace('{size}', v.title))}"><span aria-hidden="true">${A.esc(v.title)}</span></button></span>`;
        const dot = this.lowIds.has(String(v.id)) ? `<i class="azur-pl__dot" role="img" aria-label="${A.esc(tx('lowFew'))}"></i>` : '';
        return `<label class="azur-pl" ${pos}><input type="radio" name="azur-size" value="${A.esc(v.id)}" data-size="${A.esc(v.title)}"><span>${A.esc(v.title)}</span>${dot}</label>`;
      }).join(''));
      q('.azur-pdp__error').hidden = true;
      const add = q('.azur-pdp__add'); add.disabled = true; add.textContent = A.config.copy.chooseSize; add.classList.remove('is-done');
      this.directSetup(product);
      this.pdp.style.setProperty('--accent', product.accent || '#333');
      this.pdp.classList.add('is-on');
      this.app.setWorldDim(0.42, 10);
      document.documentElement.classList.add('azur-pdp-open');
      // the jersey flies from the rail into the page (FLIP)
      if (fromRect && !this.app.reduced) {
        const fly = () => {
          const to = img.getBoundingClientRect();
          if (!to.height || !fromRect.height) return;
          const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2);
          const dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2);
          const s = fromRect.height / to.height;
          img.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.9 }, { transform: 'none', opacity: 1 }],
            { duration: 780, easing: 'cubic-bezier(.2,.8,.2,1)' });
        };
        if (img.complete && img.naturalHeight) requestAnimationFrame(fly); else img.addEventListener('load', () => requestAnimationFrame(fly), { once: true });
      }
      setTimeout(() => q('.azur-pdp__x').focus({ preventScroll: true }), 50);
      if (!(from && from.page)) try { history.replaceState(null, '', '#' + product.handle); } catch (e) { }
    }

    close() {
      if (!this.pdp.classList.contains('is-on')) return;
      this.pdp.classList.remove('is-on');
      this.sheet(false, true); this.formHome();
      document.documentElement.classList.remove('azur-pdp-open');
      this.app.setWorldDim();
      const f = this.from; this.from = null;
      if (!(f && f.page)) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
      const back = this.returnFocus; this.returnFocus = null;
      if (back && back !== document.body && back.isConnected && back.getClientRects().length) back.focus({ preventScroll: true });
      else if (!f) this.app.afterProductClose();
      if (f && f.closed) f.closed();
    }

    /* P3: under the sizes, for the CHOSEN size only: „Größe M: nur noch wenige“. Empty / null = no line. */
    sizeNote(size, low) {
      const n = this.pdp.querySelector('.azur-pdp__lowline');
      n.textContent = size && low ? String(tx('lowLine')).replace('{size}', size) : ''; n.hidden = !(size && low);
      if (size) this.notifyClose();                     // choosing a size closes the „vergeben“ form
    }

    /* P3: a taken size was tapped: a small form (e-mail + button) in the view. It posts the same customer form as the drop
       sign-up (tags „newsletter, drops, bescheid-<key>-<size>“). */
    notifyOpen(size, variant, btn) {
      const f = this.pdp.querySelector('.azur-pdp__notify'), done = this.pdp.querySelector('.azur-pdp__notifydone');
      this.size = null; this.directReady && this.directReady(false);
      this.pdp.querySelectorAll('input[name="azur-size"]').forEach(r => { r.checked = false; });
      const b = this.pdp.querySelector('.azur-pdp__add'); b.disabled = true; b.textContent = A.config.copy.chooseSize;
      this.sizeNote(null);
      this.notifyFor = size; done.hidden = true; done.textContent = '';
      f.querySelector('.azur-pdp__notifytitle').textContent = String(tx('notifyTitle')).replace('{size}', size);
      f.querySelector('.azur-pdp__notifyerr').hidden = true;
      f.hidden = false; this.pdp.querySelector('.azur-pdp__sizes').classList.add('is-notify');
      this.pdp.querySelectorAll('.azur-pl.is-taken button').forEach(x => x.classList.toggle('is-on', x === btn));
      f.querySelector('input').focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 860px)').matches) f.scrollIntoView({ block: 'center', behavior: this.app.reduced ? 'auto' : 'smooth' });   // not under the buy bar
    }
    notifyClose() {
      const f = this.pdp.querySelector('.azur-pdp__notify'); if (!f) return;
      f.hidden = true; this.notifyFor = null;
      this.pdp.querySelector('.azur-pdp__sizes').classList.remove('is-notify');
      this.pdp.querySelector('.azur-pdp__notifydone').hidden = true;
      this.pdp.querySelectorAll('.azur-pl.is-taken button.is-on').forEach(x => x.classList.remove('is-on'));
    }
    async notifySend() {
      const f = this.pdp.querySelector('.azur-pdp__notify'), err = f.querySelector('.azur-pdp__notifyerr'), c = A.config.copy;
      const mail = f.querySelector('input').value.trim(), size = this.notifyFor;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { err.textContent = c.dropInvalid || ''; err.hidden = false; return; }
      err.hidden = true;
      const tag = 'bescheid-' + (this.product.key || this.product.handle || 'trikot') + '-' + String(size).toLowerCase().replace(/[^a-z0-9]+/g, '');
      const btn = f.querySelector('button'); btn.disabled = true;
      try {
        if (A.config.shopify) await this.postContact(mail, 'newsletter, drops, ' + tag);
        const done = this.pdp.querySelector('.azur-pdp__notifydone');
        done.textContent = tx('notifyDone'); done.hidden = false; f.hidden = true; f.reset();
      } catch (x) { err.textContent = x.message; err.hidden = false; }
      finally { btn.disabled = false; }
    }
    /* same customer form as the drop sign-up (azur-drop.js postLive, snippets/signup-form.liquid); a small copy here because
       the product view also runs on pages without the room (azur-pdp.js bundle has no azur-drop.js) */
    async postContact(mail, tags) {
      const fields = { form_type: 'customer', utf8: '✓', 'contact[email]': mail, 'contact[tags]': tags };
      const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      const res = await fetch(shopRoot() + 'contact', { method: 'POST', body: fd, credentials: 'same-origin' });
      if (/challenge/.test(res.url)) {             // Shopify wants a bot check: post the form normally
        const f = document.createElement('form'); f.method = 'post'; f.action = shopRoot() + 'contact'; f.hidden = true;
        Object.entries(fields).forEach(([k, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); });
        document.body.appendChild(f); f.submit(); return;
      }
      if (!res.ok) throw new Error(A.config.copy.dropFailed || 'Das hat nicht geklappt. Bitte versuch es gleich noch einmal.');
    }

    /* P1: the photos. media [{src, alt, w, h}] from the snippet; without it the one shop photo. The first loads at once,
       the others lazily; dots and arrows only with more than one. */
    gallery(product, x) {
      const list = (x.media && x.media.length ? x.media : product.media && product.media.length ? product.media : [{ src: product.image, alt: product.name }])
        .filter(m => m && m.src);
      this.media = list; this.gi = 0;
      const stage = this.pdp.querySelector('.azur-pdp__stage'), track = stage.querySelector('.azur-pdp__track'), dots = stage.querySelector('.azur-pdp__dots');
      const alts = list.map(m => m.alt || product.name || '');
      track.innerHTML = list.map((m, i) => `<div class="azur-pdp__slide"><img class="azur-pdp__img" src="${A.esc(m.src)}" alt="${A.esc(alts[i])}"${m.w ? ` width="${+m.w}"` : ''}${m.h ? ` height="${+m.h}"` : ''}${i ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async"></div>`).join('');
      dots.innerHTML = list.length > 1 ? list.map((m, i) => {
        const same = alts.filter(a => a === alts[i]).length > 1;
        return `<button type="button" data-act="dot" data-i="${i}" aria-label="${A.esc(same ? `${alts[i]} (${i + 1})` : alts[i])}"${i ? '' : ' aria-current="true"'}></button>`;
      }).join('') : '';
      stage.classList.toggle('is-single', list.length < 2);
      track.tabIndex = list.length > 1 ? 0 : -1;
      track.scrollLeft = 0;
      this.markImage(0);
    }

    go(i) {
      const n = (this.media || []).length; if (n < 2) return;
      i = (i + n) % n;
      const track = this.pdp.querySelector('.azur-pdp__track');
      track.scrollTo({ left: i * track.clientWidth, behavior: this.app.reduced ? 'auto' : 'smooth' });
      this.markImage(i);
    }

    markImage(i) {
      const n = (this.media || []).length; if (!n) return;
      this.gi = Math.max(0, Math.min(n - 1, i));
      this.pdp.querySelectorAll('.azur-pdp__dots button').forEach((d, k) => { if (k === this.gi) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    }

    /* P1: „Material & Pflege“, „Produktsicherheit“ and the size chart; whatever is empty is not shown */
    details(x) {
      const fill = (key, rows) => {
        const d = this.pdp.querySelector(`.azur-pdp__more[data-more="${key}"]`), dl = d.querySelector('dl');
        dl.replaceChildren();
        rows.forEach(([k, v]) => {
          if (!v || !String(v).trim()) return;
          const dt = document.createElement('dt'), dd = document.createElement('dd');
          dt.textContent = k; dd.textContent = String(v).trim(); dl.append(dt, dd);
        });
        d.open = false; d.hidden = !dl.children.length;
      };
      fill('care', [[tx('material'), x.material], [tx('care'), x.care]]);
      fill('gpsr', [[tx('maker'), x.gpsr && x.gpsr.maker], [tx('contact'), x.gpsr && x.gpsr.contact]]);
      const chart = this.pdp.querySelector('.azur-pdp__chart');
      this.pdp.querySelector('.azur-pdp__sheetbody').innerHTML = x.sizeTable || '';   // HTML from the theme (escaped there)
      chart.hidden = !x.sizeTable;
    }

    /* the size chart: a small sheet in the view; Escape or × closes only the sheet */
    sheet(on, quiet) {
      const sh = this.pdp.querySelector('.azur-pdp__sheet'), chart = this.pdp.querySelector('.azur-pdp__chart');
      if (on && chart.hidden) return;
      if (!on && sh.hidden) return;
      sh.hidden = !on; chart.setAttribute('aria-expanded', String(!!on));
      this.pdp.classList.toggle('has-sheet', !!on);
      if (on) setTimeout(() => sh.querySelector('[data-act="sheet-close"]').focus({ preventScroll: true }), 30);
      else if (!quiet) chart.focus({ preventScroll: true });
    }

    /* P1: shipping, delivery time and returns under the button, the payment logos (A.pdp.shared or product.extra.shared,
       HTML from the theme). Without them the old shipping line stays. */
    lines(x) {
      const sh = (A.pdp && A.pdp.shared) || x.shared || {};
      const rows = ['ship', 'time', 'returns'].filter(k => sh[k] && String(sh[k]).trim())
        .map(k => `<li data-line="${k}">${sh[k]}</li>`).join('');
      this.pdp.querySelectorAll('.azur-pdp__lines').forEach(u => { u.innerHTML = rows; u.hidden = !rows; });
      const ship = this.pdp.querySelector('.azur-pdp__ship'); ship.hidden = !!rows || !ship.textContent.trim();
      const pay = sh.pay && String(sh.pay).trim() ? sh.pay : '';
      this.pdp.querySelectorAll('.azur-pdp__pay').forEach(u => { u.innerHTML = pay; u.hidden = !pay; });
      this.pdp.querySelector('.azur-pdp__aside').hidden = !(rows || pay);
      this.pdp.classList.toggle('has-lines', !!rows);
    }

    /* P1: direct checkout under „In den Warenkorb“. Shopify's own button needs a real product form: the page renders one
       per jersey, hidden (snippets/azur-pdp-setup.liquid, [data-azur-buy]); it moves in here while the view is open and
       its id field follows the size. Without a form (the homepage): a link that puts the size in the cart and goes to
       the checkout. Until a size is chosen the button is visibly off („Erst Größe wählen“). */
    directSetup(product) {
      this.formHome();
      const slot = this.pdp.querySelector('.azur-pdp__direct'); slot.replaceChildren();
      if (!(product.variants || []).some(v => v.available) || product.available === false) { slot.hidden = true; return; }
      let form = null;
      try { form = document.querySelector(`.azur-pdp-forms [data-azur-buy="${(window.CSS && CSS.escape) ? CSS.escape(product.handle) : product.handle}"]`); } catch (e) { }
      if (form) { this.form = form; this.formFrom = form.parentNode; slot.appendChild(form); }
      else {
        const a = document.createElement('a');
        a.className = 'azur-pdp__go'; a.href = shopRoot() + 'checkout'; a.dataset.act = 'direct'; a.textContent = tx('directCheckout');
        slot.appendChild(a);
      }
      const wait = document.createElement('span'); wait.className = 'azur-pdp__wait'; wait.textContent = tx('chooseSizeFirst');
      slot.appendChild(wait);
      slot.hidden = false; this.directReady(false);
    }

    directReady(on) {
      const slot = this.pdp.querySelector('.azur-pdp__direct'); if (slot.hidden) return;
      slot.classList.toggle('is-wait', !on); slot.inert = !on;
      if (!on) slot.setAttribute('aria-hidden', 'true'); else slot.removeAttribute('aria-hidden');
      const id = this.form && this.form.querySelector('input[name="id"]');
      if (id && on && this.size) id.value = this.size;
    }

    formHome() {
      if (this.form && this.formFrom && this.formFrom.isConnected) this.formFrom.appendChild(this.form);
      this.form = null; this.formFrom = null;
    }

    async direct(e) {
      e.preventDefault();
      if (!this.product || !this.size) return;
      if (!this.live) { this.add(); return; }                         // prototype: the simulated cart
      const a = e.target.closest('a'), err = this.pdp.querySelector('.azur-pdp__error'), root = shopRoot();
      if (a.getAttribute('aria-busy') === 'true') return;
      a.setAttribute('aria-busy', 'true'); err.hidden = true;
      try {
        const res = await fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: Number(this.size), quantity: 1 }] }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status >= 400) throw new Error(data.description || data.message || A.config.copy.failed || 'Das hat nicht geklappt.');
        location.href = root + 'checkout';
      } catch (er) { err.textContent = er.message; err.hidden = false; a.removeAttribute('aria-busy'); }
    }

    /* P1: a quiet line with another available jersey („Dazu: …“, plus „2 Trikots = Versand frei“ when two of them
       cross the free shipping line). A tap switches the view; on a product page it is the other product page. */
    pair(product) {
      const box = this.pdp.querySelector('.azur-pdp__pair'); box.replaceChildren(); box.hidden = true; this.pairWith = null;
      const ok = p => p && p.type === 'product' && p !== product && p.handle !== product.handle && p.available !== false
        && (p.variants || []).some(v => v.available);
      const other = (A.products || []).find(ok); if (!other) return;
      const from = Number(A.store && A.store.freeShippingFrom) || 0, price = Number(product.price) || 0, op = Number(other.price) || 0;
      const free = from > 0 && price > 0 && op > 0 && price < from && price + op >= from;
      const page = !!(this.from && this.from.page);
      const el = document.createElement(page ? 'a' : 'button');
      el.className = 'azur-pdp__pairlink';
      if (page) el.href = other.productUrl || '#'; else { el.type = 'button'; el.dataset.act = 'pair'; }
      if (other.image) { const im = document.createElement('img'); im.src = other.image; im.alt = ''; im.width = 44; im.height = 44; im.loading = 'lazy'; im.decoding = 'async'; el.appendChild(im); }
      const t = document.createElement('span'), [pre, post] = String(tx('pairWith')).split('{name}'), b = document.createElement('b');
      b.textContent = other.name;
      t.append(pre || '', b, post || '');
      if (free) { const f = document.createElement('span'); f.className = 'azur-pdp__pairfree'; f.textContent = ' · ' + tx('pairFree'); t.appendChild(f); }
      el.appendChild(t); box.appendChild(el); box.hidden = false;
      this.pairWith = other;
    }

    add() {
      if (!this.product || !this.size) return;
      const v = this.product.variants.find(x => String(x.id) === String(this.size));
      if (this.live) return this.addLive(v);
      const line = this.cart.find(l => l.variant === v.id);
      if (line) line.qty += 1; else this.cart.push({ variant: v.id, key: this.product.key, name: this.product.name, size: v.title, price: this.product.price, image: this.product.image, qty: 1 });
      this.save(); this.renderCart();
      const b = this.pdp.querySelector('.azur-pdp__add'); b.textContent = A.config.copy.added; b.classList.add('is-done');
      this.app.bumpCart();
      this.showAfter(this.cart.reduce((s, l) => s + l.price * l.qty, 0), this.cart.reduce((s, l) => s + l.qty, 0));
      setTimeout(() => this.toggleCart(true), this.app.reduced ? 0 : 500);     // „Warenkorb gleitet herein“
    }

    /* After the bag: how far to free shipping (A.store.freeShippingFrom, euros), keep looking or go to the bag. */
    showAfter(total, count) {
      const c = A.config.copy, from = Number(A.store && A.store.freeShippingFrom) || 0, box = this.pdp.querySelector('.azur-pdp__after');
      const ship = box.querySelector('.azur-pdp__shipnow'), bar = box.querySelector('.azur-pdp__bar');
      if (from > 0) {
        const left = Math.max(0, from - total);
        ship.textContent = left > 0.004 ? c.shipTo.replace('{x}', A.formatPrice(left)) : c.shipFree + ' ✓';
        bar.hidden = false; bar.style.setProperty('--p', '0');
        requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--p', Math.min(1, total / from).toFixed(3))));
      } else { ship.textContent = c.added + ' ✓'; bar.hidden = true; }
      this.upsell(total, count);
      box.hidden = false;
    }

    /* P2: after the bag, the other jersey in small (picture, name, sizes, „+ price · shipping free then“). Only while exactly one
       jersey lies in the bag, the other one is available and the free shipping line is not reached yet. No pop-up: it sits in the
       „after“ box above the two buttons, which stay where they are. No discount, no set price. */
    upsell(total, count) {
      const box = this.pdp.querySelector('.azur-pdp__upsell'); box.replaceChildren(); box.hidden = true; this.upsellFor = null;
      const from = Number(A.store && A.store.freeShippingFrom) || 0, p = this.product;
      if (!p || !(from > 0) || !(total < from) || Number(count) !== 1) return;
      const other = (A.products || []).find(o => o && o.type === 'product' && o.handle !== p.handle && o.key !== p.key && o.available !== false
        && (o.variants || []).some(v => v.available));
      if (!other) return;
      this.upsellFor = other;
      const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
      const head = el('div', 'azur-pdp__upsellhead');
      if (other.image) { const im = el('img'); im.src = other.image; im.alt = ''; im.width = 40; im.height = 40; im.loading = 'lazy'; im.decoding = 'async'; head.appendChild(im); }
      const t = el('p', 'azur-pdp__upselltext'), b = el('b', null, other.name);
      t.append(b, el('span', null, String(tx('upsellFree')).replace('{price}', A.formatPrice(other.price))));
      head.appendChild(t);
      const sizes = el('div', 'azur-pdp__upsellsizes'); sizes.setAttribute('role', 'group'); sizes.setAttribute('aria-label', tx('upsellSize') + ': ' + other.name);
      (other.variants || []).forEach(v => {
        const x = el('button', null, v.title); x.type = 'button'; x.dataset.act = 'upsell'; x.dataset.variant = v.id;
        if (!v.available) x.disabled = true;
        sizes.appendChild(x);
      });
      box.append(head, sizes); box.hidden = false;
    }

    async upsellAdd(btn) {
      const other = this.upsellFor, id = btn.dataset.variant, box = this.pdp.querySelector('.azur-pdp__upsell');
      if (!other || !id) return;
      const err = this.pdp.querySelector('.azur-pdp__error');
      box.querySelectorAll('button').forEach(x => { x.disabled = true; }); box.setAttribute('aria-busy', 'true');
      try {
        if (this.live) {
          const root = shopRoot();
          const res = await fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ items: [{ id: Number(id), quantity: 1 }] }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.status >= 400) throw new Error(data.description || data.message || A.config.copy.failed || 'Das hat nicht geklappt.');
          const cart = await fetch(root + 'cart.js', { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => null);
          if (cart) { this.app.setCartCount(cart.item_count); this.showAfter(cart.total_price / 100, cart.item_count); }
          else { box.hidden = true; }
          document.dispatchEvent(new CustomEvent('azur:cart-changed', { detail: cart }));
        } else {
          const v = other.variants.find(x => String(x.id) === String(id));
          this.cart.push({ variant: v.id, key: other.key, name: other.name, size: v.title, price: other.price, image: other.image, qty: 1 });
          this.save(); this.renderCart();
          this.showAfter(this.cart.reduce((s, l) => s + l.price * l.qty, 0), this.cart.reduce((s, l) => s + l.qty, 0));
        }
        this.app.bumpCart();
        const more = this.pdp.querySelector('[data-act="more"]'); if (more) more.focus({ preventScroll: true });
      } catch (e) {
        err.textContent = e.message; err.hidden = false;
        box.querySelectorAll('button').forEach((x, i) => { x.disabled = !(other.variants[i] && other.variants[i].available); });
      } finally { box.removeAttribute('aria-busy'); }
    }

    async addLive(v) {
      const b = this.pdp.querySelector('.azur-pdp__add'), err = this.pdp.querySelector('.azur-pdp__error'), c = A.config.copy;
      const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
      b.disabled = true; b.textContent = c.adding || 'Wird hinzugefügt …'; err.hidden = true;
      try {
        const res = await fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: Number(v.id), quantity: 1 }] }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status >= 400) throw new Error(data.description || data.message || A.config.copy.failed || 'Das hat nicht geklappt.');
        b.textContent = c.added; b.classList.add('is-done');
        const cart = await fetch(root + 'cart.js', { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => null);
        if (cart) { this.app.setCartCount(cart.item_count); this.showAfter(cart.total_price / 100, cart.item_count); }
        else this.showAfter(0, 0);
        this.app.bumpCart();
        document.dispatchEvent(new CustomEvent('azur:cart-changed', { detail: cart }));   // themes can refresh their own count
        // „Warenkorb gleitet herein“: the theme's drawer (its opener in the after box loads it fresh and keeps the focus here)
        setTimeout(() => { const o = this.pdp.querySelector('.azur-pdp__after [data-cart-open]'); if (o && this.pdp.classList.contains('is-on')) o.click(); }, this.app.reduced ? 0 : 500);
      } catch (e) {
        err.textContent = e.message; err.hidden = false;
        b.textContent = c.addToCart;
      } finally { b.disabled = false; }
    }

    renderCart() {
      const list = this.drawer.querySelector('.azur-cart__list');
      if (!this.cart.length) list.innerHTML = `<li class="azur-cart__empty">${A.config.copy.emptyCart}</li>`;
      else list.innerHTML = this.cart.map((l, i) => `
        <li class="azur-cart__line">
          <img src="${A.esc(l.image)}" alt="">
          <div><p class="azur-cart__name">${A.esc(l.name)}</p><p class="azur-cart__meta">${A.config.copy.size || 'Größe'} ${A.esc(l.size)} · ${l.qty} ×</p></div>
          <p class="azur-cart__price">${A.esc(A.formatPrice(l.price * l.qty))}</p>
          <button type="button" data-remove="${i}" aria-label="${A.esc(l.name)} entfernen">Entfernen</button>
        </li>`).join('');
      const total = this.cart.reduce((s, l) => s + l.price * l.qty, 0);
      this.drawer.querySelector('.azur-cart__total strong').textContent = A.formatPrice(total);
      this.app.setCartCount(this.cart.reduce((s, l) => s + l.qty, 0));
    }

    toggleCart(on) {
      if (!this.drawer) {           // Shopify: the theme's drawer (its opener, or our bag carries data-cart-open)
        const o = document.querySelector('[data-cart-open]'); const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
        if (on !== false) { if (o) o.click(); else location.href = root + 'cart'; }
        return;
      }
      const open = on == null ? !this.drawer.classList.contains('is-on') : on;
      this.drawer.classList.toggle('is-on', open); this.drawer.setAttribute('aria-hidden', String(!open)); this.drawer.inert = !open;
      if (open) this.drawer.querySelector('.azur-cart__close').focus({ preventScroll: true });
    }

    load() { try { return JSON.parse(localStorage.getItem('azur-cart') || '[]'); } catch (e) { return []; } }
    save() { try { localStorage.setItem('azur-cart', JSON.stringify(this.cart)); } catch (e) { } }
  }

  A.Shop = Shop;
})();
