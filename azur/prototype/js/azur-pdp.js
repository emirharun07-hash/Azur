/* AZUR — the room's product view outside the room (Runde 19, owner: clicking a jersey anywhere is exactly like clicking it
   in the room). Homepage: the cards under the room open the room's own view (A.app.shop, this file is the end of
   assets/azur-room.js). Shop and product pages: assets/azur-pdp.js (azur-config.js, the page's products from
   snippets/azur-pdp-setup.liquid, azur-shop.js, this file) builds the same view with a small stand-in for the room.
   On a product page the view is the page: it is open from the start and closing it goes back (or to the shop). */
(function () {
  const A = window.AZUR = window.AZUR || {};
  const handleOf = a => { const m = (a.getAttribute('href') || '').match(/\/products\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
  const find = h => (A.products || []).find(p => p.type === 'product' && p.handle === h);
  let own = null;
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.card__link');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const shop = own || (A.app && A.app.shop), p = shop && find(handleOf(a));
    if (!p) return;                                        // the room still loading, or a jersey it does not know: the product page
    e.preventDefault();
    const img = a.querySelector('.card__img');
    shop.open(p, img ? img.getBoundingClientRect() : null, {});
  });
  if (document.getElementById('azur') || !A.Shop || !A.config || !A.config.shopify) return;   // the room brings its own view
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  own = new A.Shop({ reduced, setWorldDim() { }, keepLooking() { }, afterProductClose() { }, bumpCart() { }, setCartCount() { } });
  const page = A.pdp && A.pdp.page && find(A.pdp.page);
  if (!page) return;
  const leave = () => {
    let ref = null; try { ref = document.referrer ? new URL(document.referrer) : null; } catch (e) { }
    if (ref && ref.origin === location.origin && ref.pathname !== location.pathname && history.length > 1) history.back();
    else location.href = A.pdp.shop || '/';
  };
  own.pdp.classList.add('is-page');
  own.open(page, null, { page: true, closed: leave });
  document.documentElement.classList.add('azur-pdp-page');
})();
