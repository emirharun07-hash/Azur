/* AZUR — Texte direkt auf der Website ändern (nur für die zwei Admins). Lädt nur mit #admin in der Adresse oder nach
   einem Login (snippets/azur-admin.liquid). Spricht mit dem Admin-Server (azur/admin/worker.js, Cloudflare Worker), der
   allein den Shopify-Zugang hat; hier liegt nur ein Login-Token (12 h) im Browser.
   Bearbeitbar: das Laufband oben (eine Meldung pro Zeile) und auf Produktseiten die Beschreibung. */
(function () {
  'use strict';
  const API = (window.AZUR_ADMIN_API || '').replace(/\/$/, '');
  const KEY = 'azur-admin';
  const $ = (s, r) => (r || document).querySelector(s);
  const store = {
    get() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.exp > Date.now() ? v : null; } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch (e) { /* ohne Speicher: nur diese Seite */ } }
  };
  let session = store.get(), editing = false;

  const css = `
  .azad{position:fixed;left:16px;bottom:16px;z-index:2147483000;font:500 14px/1.4 Archivo,system-ui,sans-serif;color:#121212}
  .azad *{box-sizing:border-box;border-radius:0}
  .azad__pill{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;background:#121212;color:#f3f0ea;border:0;cursor:pointer;
    font:700 12px/1 Archivo,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 8px 24px rgb(0 0 0/.25)}
  .azad__pill i{width:8px;height:8px;background:#9a9a9a}.azad.is-in .azad__pill i{background:#2fae5c}
  .azad__panel{width:min(360px,calc(100vw - 32px));margin-top:8px;background:#f3f0ea;border:1px solid #121212;box-shadow:0 18px 40px rgb(0 0 0/.25);padding:16px;display:grid;gap:12px}
  .azad__panel[hidden]{display:none}
  .azad h2{margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
  .azad label{display:grid;gap:4px;font-size:12px;font-weight:600}
  .azad input,.azad textarea{width:100%;font:400 14px/1.4 Archivo,system-ui,sans-serif;padding:10px;border:1px solid #121212;background:#fff;color:#121212}
  .azad textarea{min-height:120px;resize:vertical}
  .azad button.azad__btn{min-height:44px;padding:0 14px;border:1px solid #121212;background:#121212;color:#f3f0ea;font:700 12px/1 Archivo,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .azad button.azad__btn--ghost{background:transparent;color:#121212}
  .azad button:disabled{opacity:.45;cursor:not-allowed}
  .azad__row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}
  .azad__msg{margin:0;font-size:12px;min-height:1.4em}.azad__msg.is-err{color:#b3261e}
  .azad__hint{margin:0;font-size:12px;color:#5c5b57}
  [data-azur-edit].azad-on{outline:2px dashed #1f5fd6;outline-offset:6px;min-height:3em;cursor:text}
  [data-azur-edit].azad-on:focus{outline-style:solid}`;

  const root = document.createElement('div');
  root.className = 'azad';
  root.innerHTML = `<style>${css}</style>
    <button class="azad__pill" type="button" aria-expanded="false" aria-controls="azad-panel"><i aria-hidden="true"></i>AZUR Admin</button>
    <section class="azad__panel" id="azad-panel" aria-label="Admin" hidden></section>`;
  document.body.appendChild(root);
  const pill = $('.azad__pill', root), panel = $('.azad__panel', root);

  const toggle = open => {
    open = open == null ? panel.hidden : open;
    panel.hidden = !open; pill.setAttribute('aria-expanded', String(open));
    if (open) { const f = $('input, textarea, button', panel); if (f) f.focus(); }
  };
  pill.addEventListener('click', () => toggle());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden && root.contains(document.activeElement)) { toggle(false); pill.focus(); } });

  async function call(path, body) {
    const res = await fetch(API + path, {
      method: body ? 'POST' : 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, session ? { Authorization: 'Bearer ' + session.token } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/login') { logout('Bitte neu anmelden (Sitzung abgelaufen).'); throw new Error('login'); }
    if (!res.ok) throw new Error(data.messages ? data.messages.join(' ') : data.error === 'wait' ? `Zu viele Versuche, bitte ${data.seconds} s warten.` : data.error === 'login' ? 'Name oder Passwort stimmt nicht.' : 'Fehler ' + res.status);
    return data;
  }
  const say = (text, err) => { const m = $('.azad__msg', panel); if (m) { m.textContent = text || ''; m.classList.toggle('is-err', !!err); } };

  function logout(note) {
    session = null; store.set(null); setEditing(false); render(); if (note) say(note, true);
  }

  /* ---- Bearbeiten: Produktbeschreibung direkt im Text, Laufband im Panel ---- */
  const fields = () => Array.from(document.querySelectorAll('[data-azur-edit]'));
  function setEditing(on) {
    editing = on;
    fields().forEach(el => {
      el.contentEditable = on ? 'true' : 'false';
      el.classList.toggle('azad-on', on);
      if (on) { el.dataset.azadStart = el.innerHTML; const d = el.closest('details'); if (d) { d.hidden = false; d.open = true; } }
      if (!on) el.removeAttribute('contenteditable');
    });
  }
  // Einfügen nur als Text (keine fremden Formate aus Word oder Webseiten)
  document.addEventListener('paste', e => {
    const el = e.target.closest && e.target.closest('[data-azur-edit].azad-on'); if (!el) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });

  function render() {
    root.classList.toggle('is-in', !!session);
    if (!API || /CHANGE-ME/.test(API)) {
      panel.innerHTML = `<h2>AZUR Admin</h2><p class="azad__hint">Der Admin-Server ist noch nicht eingetragen (snippets/azur-admin.liquid, siehe azur/admin/ANLEITUNG.md).</p>`;
      return;
    }
    if (!session) {
      panel.innerHTML = `<h2>Anmelden</h2>
        <form class="azad__form" novalidate>
          <label>Name<input name="user" autocomplete="username" required></label>
          <label>Passwort<input name="password" type="password" autocomplete="current-password" required></label>
          <div class="azad__row"><button class="azad__btn" type="submit">Anmelden</button></div>
        </form><p class="azad__msg" role="status"></p>`;
      $('form', panel).addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target, btn = $('button', f); btn.disabled = true; say('');
        try {
          session = await call('/login', { user: f.user.value, password: f.password.value });
          store.set(session); render(); say('Angemeldet.');
        } catch (err) { say(err.message, true); btn.disabled = false; }
      });
      return;
    }
    const bar = document.querySelector('[data-azur-bar]');
    const product = fields().find(el => el.dataset.azurEdit === 'product');
    panel.innerHTML = `<div class="azad__row"><h2>Angemeldet: ${esc(session.user)}</h2><button class="azad__btn azad__btn--ghost" type="button" data-out>Abmelden</button></div>
      <label>Laufband oben (eine Meldung pro Zeile)<textarea data-bar>${esc(bar ? bar.dataset.azurBar : '')}</textarea></label>
      <div class="azad__row"><button class="azad__btn" type="button" data-save-bar>Laufband speichern</button></div>
      ${product ? `<div class="azad__row"><button class="azad__btn azad__btn--ghost" type="button" data-edit aria-pressed="${editing}">${editing ? 'Bearbeiten beenden' : 'Beschreibung bearbeiten'}</button>
        <button class="azad__btn" type="button" data-save-product ${editing ? '' : 'disabled'}>Beschreibung speichern</button></div>
        <p class="azad__hint">Im Text klicken und schreiben. Strg+B fett, Strg+I kursiv. Eingefügtes wird zu reinem Text.</p>` : ''}
      <p class="azad__msg" role="status"></p>`;
    $('[data-out]', panel).addEventListener('click', () => logout());
    $('[data-save-bar]', panel).addEventListener('click', async e => {
      const btn = e.currentTarget; btn.disabled = true; say('Speichere …');
      try {
        const r = await call('/bar', { text: $('[data-bar]', panel).value });
        if (bar) bar.dataset.azurBar = r.text;
        say('Laufband gespeichert. Nach dem Neuladen läuft es so.');
      } catch (err) { if (err.message !== 'login') say(err.message, true); }
      btn.disabled = false;
    });
    if (product) {
      $('[data-edit]', panel).addEventListener('click', () => { setEditing(!editing); render(); if (editing) product.focus(); });
      $('[data-save-product]', panel).addEventListener('click', async e => {
        const btn = e.currentTarget; btn.disabled = true; say('Speichere …');
        try {
          const r = await call('/product', { id: product.dataset.productId, descriptionHtml: product.innerHTML });
          product.innerHTML = r.descriptionHtml; product.dataset.azadStart = r.descriptionHtml;
          say('Beschreibung gespeichert.');
        } catch (err) { if (err.message !== 'login') say(err.message, true); }
        btn.disabled = false;
      });
    }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ungespeicherte Beschreibung: beim Verlassen nachfragen
  window.addEventListener('beforeunload', e => {
    if (editing && fields().some(el => el.innerHTML !== el.dataset.azadStart)) { e.preventDefault(); e.returnValue = ''; }
  });

  render();
  if (/(^|[#&?])admin\b/.test(location.hash + location.search) && !session) toggle(true);
  if (session) call('/me').catch(() => { });   // abgelaufenes Token früh bemerken
})();
