/* AZUR — product page over the room and the cart.
   The product view opens over the room right from a click on a jersey: the jersey's shop photo large in the middle
   (Runde 16: no more 3D model, it looked crumpled), on a background in the jersey's colour, the sizes beside it. After a size goes into the bag,
   the page shows how far it is to free shipping and offers to keep looking. Prototype: a simulated cart. Shopify
   (A.config.shopify): the real cart (/cart/add.js, /cart.js) and the theme's own cart drawer; checkout is Shopify's. */
(function () {
  const A = window.AZUR = window.AZUR || {};

  /* where each size stands on the pitch (percent of width, height): the liked line-up for S, M, L, XL, a spread otherwise */
  const FORMATION = { 3: [[24, 68], [76, 68], [50, 26]], 4: [[22, 72], [50, 61], [78, 72], [50, 25]], 5: [[18, 74], [40, 60], [60, 60], [82, 74], [50, 24]],
    6: [[16, 76], [38, 62], [62, 62], [84, 76], [32, 26], [68, 26]] };
  const pitchSpot = (n, i) => (FORMATION[n] || [])[i] || [12 + (i % 4) * 25, i < 4 ? 70 : 28];

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
        <div class="azur-pdp__stage">
          <img class="azur-pdp__img" alt="">
        </div>
        <div class="azur-pdp__story">
          <p class="azur-pdp__fit"></p>
          <p class="azur-pdp__desc"></p>
          <a class="azur-pdp__shop" target="_blank" rel="noopener">${c.openInShop || c.toProductPage || 'Im Shop öffnen'} <span aria-hidden="true">↗</span></a>
        </div>
        <fieldset class="azur-pdp__sizes">
          <legend>Deine Größe</legend>
          <div class="azur-pdp__sizerow azur-pitch"><span class="azur-pitch__box is-top"></span><span class="azur-pitch__box is-bottom"></span></div>
        </fieldset>
        <div class="azur-pdp__buy">
          <p class="azur-pdp__name"><span class="azur-pdp__price"></span></p>
          <p class="azur-pdp__ship">${A.store.shipping}</p>
          <button class="azur-pdp__add" type="button" data-act="add" disabled>${c.chooseSize}</button>
          <p class="azur-pdp__error" role="alert" hidden></p>
        </div>
        <div class="azur-pdp__after" role="status" hidden>
          <p class="azur-pdp__shipnow"></p>
          <div class="azur-pdp__bar" aria-hidden="true"><i></i><b></b></div>
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
        <header class="azur-cart__head"><h2>${c.cart}</h2><button type="button" class="azur-cart__close" aria-label="Schließen">×</button></header>
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
        if (t.dataset.act === 'more') { this.close(); this.app.keepLooking(); }
        if (t.dataset.act === 'cart') { this.close(); this.toggleCart(true); }
      });
      this.pdp.addEventListener('change', e => {
        if (e.target.name === 'azur-size') {
          this.size = e.target.value;
          const b = this.pdp.querySelector('.azur-pdp__add');
          b.disabled = false; b.textContent = A.config.copy.addToCart; b.classList.remove('is-done');
          this.pdp.querySelector('.azur-pdp__after').hidden = true;
        }
      });
      // Escape closes the product view only (the room's own Escape would also fly back to the room); Tab stays inside it
      this.pdp.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.stopPropagation(); this.close(); return; }
        if (e.key !== 'Tab') return;
        const f = [...this.pdp.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')]
          .filter(x => x.getClientRects().length && !x.closest('[hidden]'));
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
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

    open(product, fromRect) {
      if (!product || product.type !== 'product') return;
      if (!this.pdp.classList.contains('is-on')) this.returnFocus = document.activeElement;   // back there on close
      this.product = product; this.size = null;
      const q = s => this.pdp.querySelector(s);
      // the name is the city or country alone ("Frankfurt"), without " Trikot" and the dialling code
      const giant = product.name.replace(/\s*Trikot$/i, '').replace(/\s+\d{2,4}$/, '');
      q('.azur-pdp__title').textContent = giant; q('.azur-pdp__title').style.setProperty('--len', Math.max(5, giant.length));
      q('.azur-pdp__price').textContent = A.formatPrice(product.price);   // Runde 12: no tax note next to the price (footer, cart, checkout)
      // background, text and button in the jersey's colours (the palettes are tokens in the theme's azur.css, see azur-room.css)
      const tone = { frankfurt: 'ffm', berlin: 'ber', brasilien: 'bra', deutschland: 'ger', tuerkei: 'tur' }[product.key];
      if (tone) this.pdp.dataset.tone = tone; else delete this.pdp.dataset.tone;
      q('.azur-pdp__fit').textContent = product.fit || '';
      q('.azur-pdp__desc').textContent = product.description;
      q('.azur-pdp__shop').href = product.productUrl;      // Shopify: the real product page
      const img = q('.azur-pdp__img'); img.src = product.image; img.alt = product.name;
      q('.azur-pdp__after').hidden = true;
      // die Größen als Spieler: Aufstellung auf dem Feld (breit), auf dem Handy in einer Reihe (--hx)
      const n = product.variants.length;
      q('.azur-pdp__sizerow').querySelectorAll('.azur-pl').forEach(el => el.remove());
      q('.azur-pdp__sizerow').insertAdjacentHTML('beforeend', product.variants.map((v, i) => {
        const [x, y] = pitchSpot(n, i), hx = n > 1 ? 12 + i * 76 / (n - 1) : 50;
        return `<label class="azur-pl" style="--x:${x}%;--y:${y}%;--hx:${hx.toFixed(1)}%"><input type="radio" name="azur-size" value="${v.id}" data-size="${v.title}" ${v.available ? '' : 'disabled'}><span>${v.title}</span></label>`;
      }).join(''));
      q('.azur-pdp__error').hidden = true;
      const add = q('.azur-pdp__add'); add.disabled = true; add.textContent = A.config.copy.chooseSize; add.classList.remove('is-done');
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
      try { history.replaceState(null, '', '#' + product.handle); } catch (e) { }
    }

    close() {
      if (!this.pdp.classList.contains('is-on')) return;
      this.pdp.classList.remove('is-on');
      document.documentElement.classList.remove('azur-pdp-open');
      this.app.setWorldDim();
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
      const back = this.returnFocus; this.returnFocus = null;
      if (back && back !== document.body && back.isConnected && back.getClientRects().length) back.focus({ preventScroll: true });
      else this.app.afterProductClose();
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
      this.showAfter(this.cart.reduce((s, l) => s + l.price * l.qty, 0));
      setTimeout(() => this.toggleCart(true), this.app.reduced ? 0 : 500);     // „Warenkorb gleitet herein“
    }

    /* After the bag: how far to free shipping (A.store.freeShippingFrom, euros), keep looking or go to the bag. */
    showAfter(total) {
      const c = A.config.copy, from = Number(A.store && A.store.freeShippingFrom) || 0, box = this.pdp.querySelector('.azur-pdp__after');
      const ship = box.querySelector('.azur-pdp__shipnow'), bar = box.querySelector('.azur-pdp__bar');
      if (from > 0) {
        const left = Math.max(0, from - total);
        ship.textContent = left > 0.004 ? c.shipTo.replace('{x}', A.formatPrice(left)) : c.shipFree + ' ✓';
        bar.hidden = false; bar.style.setProperty('--p', '0');
        requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--p', Math.min(1, total / from).toFixed(3))));
      } else { ship.textContent = c.added + ' ✓'; bar.hidden = true; }
      box.hidden = false;
    }

    async addLive(v) {
      const b = this.pdp.querySelector('.azur-pdp__add'), err = this.pdp.querySelector('.azur-pdp__error'), c = A.config.copy;
      const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
      b.disabled = true; b.textContent = c.adding || 'Wird hinzugefügt …'; err.hidden = true;
      try {
        const res = await fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: Number(v.id), quantity: 1 }] }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status >= 400) throw new Error(data.description || data.message || 'Das hat nicht geklappt.');
        b.textContent = c.added; b.classList.add('is-done');
        const cart = await fetch(root + 'cart.js', { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => null);
        if (cart) { this.app.setCartCount(cart.item_count); this.showAfter(cart.total_price / 100); }
        else this.showAfter(0);
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
          <img src="${l.image}" alt="">
          <div><p class="azur-cart__name">${l.name}</p><p class="azur-cart__meta">Größe ${l.size} · ${l.qty} ×</p></div>
          <p class="azur-cart__price">${A.formatPrice(l.price * l.qty)}</p>
          <button type="button" data-remove="${i}" aria-label="${l.name} entfernen">Entfernen</button>
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
