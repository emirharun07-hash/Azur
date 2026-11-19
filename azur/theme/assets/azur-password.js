/* Passwortseite: Wecker bis zum Start (Drop 1). Ohne gültiges Datum oder bei Vergangenheit bleibt der Block ausgeblendet.
   Wert aus der Einstellung launch_at, Format 2027-01-15T18:00, Zeit wie in Deutschland (fest +01:00, siehe Info-Text im Theme-Editor). */
(function () {
  'use strict';
  var box = document.querySelector('[data-launch]');
  if (!box) return;
  var raw = (box.getAttribute('data-launch') || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return;
  var target = new Date(raw + ':00+01:00');
  var end = target.getTime();
  if (isNaN(end) || end <= Date.now()) return;

  var cells = {};
  ['d', 'h', 'm', 's'].forEach(function (k) { cells[k] = box.querySelector('[data-clock="' + k + '"]'); });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pad(n, len) { var s = String(n); while (s.length < len) s = '0' + s; return s; }
  function set(k, text) {
    var el = cells[k];
    if (!el) return;
    if (el.textContent !== text) el.textContent = text;
    el.setAttribute('data-ghost', new Array(text.length + 1).join('8'));
  }

  var timer = null;
  function tick() {
    var left = Math.floor((end - Date.now()) / 1000);
    if (left <= 0) { box.hidden = true; if (timer) clearInterval(timer); return; }
    set('d', pad(Math.floor(left / 86400), 2));
    set('h', pad(Math.floor(left % 86400 / 3600), 2));
    set('m', pad(Math.floor(left % 3600 / 60), 2));
    set('s', reduce ? '--' : pad(left % 60, 2));
  }

  var start = box.querySelector('[data-clock-start]');
  var tpl = box.getAttribute('data-start-text') || '';
  if (start && tpl) {
    var lang = document.documentElement.lang || 'de';
    var loc = /^de/i.test(lang) ? 'de-DE' : 'en-GB';
    try {
      var d = new Intl.DateTimeFormat(loc, { timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(target);
      var t = new Intl.DateTimeFormat(loc, { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false }).format(target);
      start.textContent = tpl.replace('%DATE%', d).replace('%TIME%', t);
    } catch (e) { /* Intl fehlt: Text bleibt weg, der Wecker läuft trotzdem */ }
  }

  tick();
  box.hidden = false;
  timer = setInterval(tick, reduce ? 60000 : 1000);
})();
