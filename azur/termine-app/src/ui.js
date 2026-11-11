/* AZUR Termine: the screen. Data comes from window.TermineStore() (claude.ai, this computer, or your own cloud). */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  function put(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(k => put(el, k)); return; }
    el.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function h(tag, attrs) {
    const el = document.createElement(tag);
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (let i = 2; i < arguments.length; i++) put(el, arguments[i]);
    return el;
  }

  /* ---------- dates (plain YYYY-MM-DD strings, weeks start on Monday) ---------- */
  const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const WD_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const pad = n => String(n).padStart(2, "0");
  const ymd = (y, m, d) => y + "-" + pad(m) + "-" + pad(d);
  const parse = s => { const p = s.split("-").map(Number); return { y: p[0], m: p[1], d: p[2] }; };
  const utcMs = s => { const p = parse(s); return Date.UTC(p.y, p.m - 1, p.d); };
  const todayStr = () => { const n = new Date(); return ymd(n.getFullYear(), n.getMonth() + 1, n.getDate()); };
  const addDays = (s, n) => { const t = new Date(utcMs(s) + n * 864e5); return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
  const diffDays = (a, b) => Math.round((utcMs(a) - utcMs(b)) / 864e5);
  const weekday = s => new Date(utcMs(s)).getUTCDay();
  const validDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
  const fmtDate = s => { const p = parse(s); return WD[weekday(s)] + ", " + pad(p.d) + "." + pad(p.m) + "." + p.y; };
  const fmtLong = s => { const p = parse(s); return WD_LONG[weekday(s)] + ", " + p.d + ". " + MON[p.m - 1] + " " + p.y; };
  const nowIso = () => new Date().toISOString();

  /* ---------- state ---------- */
  const WHO = { emir: "Emir", talha: "Talha", beide: "Beide" };
  const KIND = { termin: "Termin", deadline: "Deadline" };
  const state = {
    entries: [], loaded: false, noStore: false, readOnly: false, mini: false,
    status: { state: "load", label: "Lädt", note: "" },
    who: "alle", showDone: false, view: "liste", monthShift: 0, today: todayStr()
  };
  let store = null, editing = null, dayOpen = null, toastT = 0;
  let known = new Map();
  const flash = new Set(), mine = new Map(), chains = new Map();

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem("azur-termine") || "{}");
      if (p.who === "emir" || p.who === "talha") state.who = p.who;
      state.showDone = p.showDone === true;
      if (p.view === "monate") state.view = "monate";
    } catch (e) { /* no storage: defaults */ }
  }
  function savePrefs() {
    try { localStorage.setItem("azur-termine", JSON.stringify({ who: state.who, showDone: state.showDone, view: state.view })); } catch (e) { /* ignore */ }
  }

  /* stored data is untrusted: keep only well-formed entries */
  function clean(id, d) {
    if (!d || typeof d !== "object" || !validDate(d.date)) return null;
    return {
      id: id,
      title: typeof d.title === "string" && d.title.trim() ? d.title.trim().slice(0, 200) : "Ohne Titel",
      date: d.date,
      time: typeof d.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(d.time) ? d.time : "",
      kind: d.kind === "deadline" ? "deadline" : "termin",
      who: d.who === "emir" || d.who === "talha" ? d.who : "beide",
      note: typeof d.note === "string" ? d.note.slice(0, 4000) : "",
      done: d.done === true
    };
  }
  const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.title.localeCompare(b.title, "de");
  const visible = () => state.entries.filter(e => state.who === "alle" || e.who === state.who || e.who === "beide");

  function countOf(e) {
    if (e.done) return { state: "done", num: "", unit: "erledigt", title: "Erledigt" };
    const n = diffDays(e.date, state.today);
    if (n < 0) return { state: "late", num: String(-n), unit: n === -1 ? "Tag" : "Tage", extra: " zu spät", title: "Seit " + (-n) + (n === -1 ? " Tag" : " Tagen") + " überfällig" };
    if (n === 0) return { state: "today", num: "", unit: "heute", title: "Heute" };
    if (n === 1) return { state: "open", num: "", unit: "morgen", title: "Morgen" };
    return { state: "open", num: String(n), unit: "Tage", title: "Noch " + n + " Tage" };
  }

  /* ---------- render ---------- */
  function render() {
    document.body.dataset.view = state.view;
    for (const b of document.querySelectorAll("#views button")) b.setAttribute("aria-pressed", String(b.dataset.view === state.view));
    for (const b of document.querySelectorAll("#who button")) b.setAttribute("aria-pressed", String(b.dataset.who === state.who));
    $("#show-done").checked = state.showDone;
    renderSync(); renderSum(); renderList(); renderMonths();
    if (dayOpen && $("#dlg-day").open) renderDay();
  }

  function renderSync() {
    const s = state.status, el = $("#sync");
    el.dataset.state = s.state; el.title = s.label; el.lastElementChild.textContent = s.label;
  }

  function renderSum() {
    const el = $("#sum");
    if (!state.loaded) { el.replaceChildren(); return; }
    const open = visible().filter(e => !e.done), late = open.filter(e => e.date < state.today).length;
    el.replaceChildren(h("b", null, String(open.length)), " offen");
    if (late) put(el, [" · ", h("span", { class: "late" }, late + " überfällig")]);
  }

  function rowEl(e) {
    const c = countOf(e);
    return h("li", { class: "row is-" + c.state + (flash.has(e.id) ? " is-fresh" : "") },
      h("button", { class: "check", type: "button", disabled: state.readOnly, "aria-pressed": String(e.done), "aria-label": (e.done ? "Wieder öffnen: " : "Abhaken: ") + e.title, onclick: () => toggle(e) }, h("i")),
      h("button", { class: "row__main", type: "button", onclick: () => openEntry(e) },
        h("span", { class: "row__title" }, e.title),
        h("span", { class: "row__meta" },
          h("span", null, fmtDate(e.date) + (e.time ? " · " + e.time + " Uhr" : "")),
          h("span", { class: "x" }, h("i", { class: "m " + e.kind }), KIND[e.kind]),
          h("span", { class: "x" }, WHO[e.who])),
        e.note ? h("span", { class: "row__note" }, e.note) : null),
      h("span", { class: "row__count", title: c.title }, c.num ? h("b", null, c.num) : null,
        h("span", { class: c.num ? null : "chip" }, c.unit, c.extra ? h("span", { class: "x-long" }, c.extra) : null)));
  }

  function secEl(s) {
    return h("section", { class: "sec" + (s.tone ? " sec--" + s.tone : "") },
      h("h2", { class: "sec__h" }, s.title, h("span", null, String(s.items.length))),
      h("ul", null, s.items.map(rowEl)));
  }

  function renderList() {
    const box = $("#list"), notice = $("#notice"), st = state.status.state;
    let note = "";
    if (state.noStore) note = "Hier gibt es keine Verbindung zu den Daten. Öffne die Seite in Claude und melde dich an.";
    else if (state.status.note) note = state.status.note;
    else if (state.readOnly) note = "Du kannst hier nur lesen, nichts ändern.";
    notice.hidden = !note; notice.textContent = note;
    if (!state.loaded) { box.replaceChildren(state.noStore || st === "stale" || st === "off" ? "" : h("p", { class: "empty" }, "Lädt …")); return; }

    const today = state.today, all = visible(), open = all.filter(e => !e.done).sort(byDate), lim = addDays(today, 7), secs = [];
    const late = open.filter(e => e.date < today), now = open.filter(e => e.date === today);
    const week = open.filter(e => e.date > today && e.date <= lim);
    if (late.length) secs.push({ title: "Überfällig", tone: "late", items: late });
    if (now.length) secs.push({ title: "Heute", items: now });
    if (week.length) secs.push({ title: "Nächste 7 Tage", items: week });
    let cur = null;
    for (const e of open) {
      if (e.date <= lim) continue;
      const key = e.date.slice(0, 7);
      if (!cur || cur.key !== key) { const p = parse(e.date); cur = { key: key, title: MON[p.m - 1] + " " + p.y, items: [] }; secs.push(cur); }
      cur.items.push(e);
    }
    if (state.showDone) {
      const done = all.filter(e => e.done).sort((a, b) => byDate(b, a));
      if (done.length) secs.push({ title: "Erledigt", items: done });
    }
    if (secs.length) { box.replaceChildren.apply(box, secs.map(secEl)); return; }
    const name = state.who === "alle" ? "" : " für " + WHO[state.who];
    const text = !state.entries.length ? "Noch keine Einträge. Mit „+ Neu“ legst du den ersten an."
      : all.length ? "Alles erledigt" + name + "." : "Keine Einträge" + name + ".";
    box.replaceChildren(h("p", { class: "empty" }, text));
  }

  function dayMap() {
    const map = new Map();
    for (const e of visible()) { if (!map.has(e.date)) map.set(e.date, []); map.get(e.date).push(e); }
    return map;
  }

  function monthEl(y, m, map) {
    const first = ymd(y, m, 1), lead = (weekday(first) + 6) % 7, days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const grid = h("div", { class: "grid" }, ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(w => h("span", { class: "wd", "aria-hidden": "true" }, w)));
    for (let i = 0; i < lead; i++) put(grid, h("span", { class: "day" }));
    for (let d = 1; d <= days; d++) {
      const date = ymd(y, m, d);
      const list = (map.get(date) || []).filter(e => state.showDone || !e.done).sort(byDate);
      const cls = "day" + (date === state.today ? " is-today" : date < state.today ? " is-past" : "") + (list.length ? " has" : "");
      put(grid, h("button", {
        class: cls, type: "button",
        "aria-label": fmtLong(date) + (list.length ? ", " + list.length + (list.length === 1 ? " Eintrag" : " Einträge") : ""),
        title: list.map(e => e.title).join("\n") || null,
        onclick: () => openDay(date)
      },
        h("span", { class: "n" }, String(d)),
        h("span", { class: "marks" },
          list.slice(0, 3).map(e => h("i", { class: "m " + e.kind + (e.done ? " done" : e.date < state.today ? " late" : "") })),
          list.length > 3 ? h("i", { class: "more" }, "+") : null)));
    }
    for (let i = (7 - (lead + days) % 7) % 7; i > 0; i--) put(grid, h("span", { class: "day" }));
    return h("section", { class: "month" }, h("h3", null, MON[m - 1] + " " + y), grid);
  }

  function renderMonths() {
    const t = parse(state.today), map = dayMap(), out = [];
    for (let i = 0; i < 3; i++) {
      const idx = t.y * 12 + (t.m - 1) + state.monthShift + i;
      out.push(monthEl(Math.floor(idx / 12), idx % 12 + 1, map));
    }
    const box = $("#months");
    box.replaceChildren.apply(box, out);
    $("#m-today").disabled = state.monthShift === 0;
  }

  /* ---------- day dialog: everything due that day ---------- */
  const dayEntries = date => visible().filter(e => e.date === date).sort(byDate);
  function renderDay() {
    const list = dayEntries(dayOpen);
    $("#day-h").textContent = fmtLong(dayOpen);
    $("#day-list").replaceChildren(list.length ? h("ul", null, list.map(rowEl)) : h("p", { class: "empty" }, "An diesem Tag ist nichts fällig."));
  }
  function openDay(date) { dayOpen = date; renderDay(); $("#dlg-day").showModal(); $("#day-h").focus(); }

  /* ---------- entry dialog ---------- */
  const form = $("#entry-form"), fTitle = $("#f-title"), fDate = $("#f-date"), fTime = $("#f-time"), fNote = $("#f-note");
  function setMsg(t, info) { const m = $("#entry-msg"); m.textContent = t; m.hidden = !t; m.classList.toggle("msg--info", !!info); }
  function syncTimeClear() { $("#time-clear").hidden = !fTime.value; }

  function openEntry(e) {
    if ($("#dlg-day").open) $("#dlg-day").close();
    editing = e && e.id ? e : null;
    form.reset();
    $("#entry-h").textContent = editing ? "Eintrag ändern" : "Neuer Eintrag";
    fTitle.value = editing ? e.title : "";
    fDate.value = (e && e.date) || state.today;
    fTime.value = editing ? e.time : "";
    form.elements.kind.value = editing ? e.kind : "termin";
    form.elements.who.value = editing ? e.who : state.who === "alle" ? "beide" : state.who;
    fNote.value = editing ? e.note : "";
    $("#cal-box").hidden = !editing;
    $("#del").hidden = !editing;
    $("#del-confirm").hidden = true;
    setMsg(""); syncTimeClear(); busy(false); syncCalLink();
    $("#dlg-entry").showModal();
    (editing ? $("#entry-h") : fTitle).focus();
  }

  function readForm(quiet) {
    const title = fTitle.value.trim();
    if (!title) { if (!quiet) { fTitle.value = ""; fTitle.reportValidity(); } return null; }
    if (!validDate(fDate.value)) { if (!quiet) setMsg("Bitte ein Datum wählen."); return null; }
    return {
      title: title.slice(0, 140),
      date: fDate.value,
      time: /^\d\d:\d\d/.test(fTime.value) ? fTime.value.slice(0, 5) : "",
      kind: form.elements.kind.value === "deadline" ? "deadline" : "termin",
      who: form.elements.who.value === "emir" || form.elements.who.value === "talha" ? form.elements.who.value : "beide",
      note: fNote.value.trim()
    };
  }
  function busy(on) { $("#save").disabled = on; $("#save").textContent = on ? "Speichert …" : "Speichern"; }

  /* one write at a time per entry; one retry when the store is briefly away */
  function write(id, fn) {
    mine.set(id, Date.now());
    const run = () => fn().catch(err => {
      if (!err || err.code !== "unavailable") throw err;
      return new Promise(r => setTimeout(r, 500 + Math.random() * 900)).then(fn);
    });
    const next = (chains.get(id) || Promise.resolve()).then(run, run);
    chains.set(id, next.catch(() => {}));
    return next.then(() => { mine.set(id, Date.now()); });
  }
  const isMine = id => (mine.get(id) || 0) > Date.now() - 8000;

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    if (!store || state.readOnly) return;
    const v = readForm(false);
    if (!v) return;
    setMsg(""); busy(true);
    let job;
    if (editing) {
      const id = editing.id;
      job = write(id, () => store.update(id, Object.assign({}, v, { updatedAt: nowIso() })));
    } else {
      const id = store.newId(), t = nowIso();
      job = write(id, () => store.create(id, Object.assign({}, v, { done: false, doneAt: null, createdAt: t, updatedAt: t })));
    }
    job.then(() => { $("#dlg-entry").close(); }, () => {
      setMsg(editing ? "Speichern hat nicht geklappt. Vielleicht wurde der Eintrag gerade gelöscht. Bitte noch einmal versuchen." : "Speichern hat nicht geklappt. Bitte noch einmal versuchen.");
    }).then(() => busy(false));
  });

  function toggle(e) {
    if (!store || state.readOnly) return;
    const done = !e.done;
    write(e.id, () => store.update(e.id, { done: done, doneAt: done ? nowIso() : null, updatedAt: nowIso() })).then(() => {
      if (done) toast("Erledigt: " + e.title, "Rückgängig", () => toggle(Object.assign({}, e, { done: true })));
      else hideToast();
    }, () => toast("Das hat nicht geklappt. Bitte noch einmal versuchen."));
  }

  $("#del").addEventListener("click", () => { $("#del").hidden = true; $("#del-confirm").hidden = false; $("#del-no").focus(); });
  $("#del-no").addEventListener("click", () => { $("#del-confirm").hidden = true; $("#del").hidden = false; });
  $("#del-yes").addEventListener("click", () => {
    if (!store || !editing) return;
    const id = editing.id;
    write(id, () => store.remove(id)).then(() => { $("#dlg-entry").close(); toast("Eintrag gelöscht."); },
      () => setMsg("Löschen hat nicht geklappt. Bitte noch einmal versuchen."));
  });

  /* ---------- calendar: Google link and .ics file ---------- */
  const enc = new TextEncoder();
  const stampUtc = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  function span(e) {
    if (e.time) {
      const p = parse(e.date), t = e.time.split(":").map(Number), s = new Date(p.y, p.m - 1, p.d, t[0], t[1], 0);
      return { allDay: false, a: stampUtc(s), b: stampUtc(new Date(s.getTime() + 36e5)) };
    }
    return { allDay: true, a: e.date.replace(/-/g, ""), b: addDays(e.date, 1).replace(/-/g, "") };
  }
  const calSummary = e => (e.kind === "deadline" ? "Deadline: " : "") + e.title;
  const calDetails = e => [e.note, "Zuständig: " + WHO[e.who], "Aus AZUR Termine"].filter(Boolean).join("\n");
  function googleUrl(e) {
    const s = span(e), q = new URLSearchParams({ action: "TEMPLATE", text: calSummary(e), details: calDetails(e), dates: s.a + "/" + s.b });
    return "https://calendar.google.com/calendar/render?" + q.toString();
  }
  const icsText = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
  function fold(line) {
    let out = "", cur = "", n = 0, lim = 75;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (n + b > lim) { out += cur + "\r\n "; cur = ""; n = 0; lim = 74; }
      cur += ch; n += b;
    }
    return out + cur;
  }
  /* reminders: the day before and on the day (all-day: 9:00 both days; with a time: 1 day and 1 hour before) */
  function icsFile(list) {
    const now = stampUtc(new Date()), L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AZUR//Termine//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    for (const e of list) {
      const s = span(e), sum = icsText(calSummary(e));
      L.push("BEGIN:VEVENT", "UID:" + e.id + "@azur-termine", "DTSTAMP:" + now);
      if (s.allDay) L.push("DTSTART;VALUE=DATE:" + s.a, "DTEND;VALUE=DATE:" + s.b); else L.push("DTSTART:" + s.a, "DTEND:" + s.b);
      L.push("SUMMARY:" + sum, "DESCRIPTION:" + icsText(calDetails(e)));
      for (const t of s.allDay ? ["-PT15H", "PT9H"] : ["-P1D", "-PT1H"]) L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + sum, "TRIGGER:" + t, "END:VALARM");
      L.push("END:VEVENT");
    }
    L.push("END:VCALENDAR");
    return L.map(fold).join("\r\n") + "\r\n";
  }
  function saveCalendar(name, list, say) {
    if (!store || !store.saveCalendar) return;
    Promise.resolve(store.saveCalendar(name, icsFile(list))).then(r => say((r && r.msg) || "", r && r.info), () => say("Die Datei konnte hier nicht gespeichert werden."));
  }
  function calEntry() { return editing ? Object.assign({}, editing, readForm(true) || {}) : null; }
  function syncCalLink() { const e = calEntry(); if (e) $("#cal-google").href = googleUrl(e); }
  form.addEventListener("input", () => { syncTimeClear(); syncCalLink(); });
  form.addEventListener("change", () => { syncTimeClear(); syncCalLink(); });
  $("#time-clear").addEventListener("click", () => { fTime.value = ""; syncTimeClear(); syncCalLink(); });
  $("#cal-file").addEventListener("click", () => { const e = calEntry(); if (e) saveCalendar("azur-termin-" + e.date, [e], setMsg); });
  $("#export-all").addEventListener("click", () => {
    const open = state.entries.filter(e => !e.done).sort(byDate);
    if (!open.length) { toast("Es gibt keine offenen Einträge."); return; }
    saveCalendar("azur-termine", open, t => { if (t) toast(t); });
  });

  /* ---------- toast ---------- */
  function hideToast() { clearTimeout(toastT); $("#toast").hidden = true; }
  function toast(text, label, fn) {
    clearTimeout(toastT);
    $("#toast-text").textContent = text;
    const b = $("#toast-act");
    b.hidden = !label; b.textContent = label || "";
    b.onclick = label ? () => { hideToast(); fn(); } : null;
    $("#toast").hidden = false;
    toastT = setTimeout(hideToast, 7000);
  }

  /* ---------- small window ---------- */
  const smallQuery = window.matchMedia("(max-height: 500px), (max-width: 340px)");
  function syncCompact() {
    document.body.classList.toggle("compact", smallQuery.matches || state.mini);
    const b = $("#mini");
    b.textContent = state.mini ? "Groß" : "Klein";
    b.title = state.mini ? "Wieder großes Fenster" : "Kleines Fenster, bleibt vor allen anderen";
  }
  if (smallQuery.addEventListener) smallQuery.addEventListener("change", syncCompact);

  /* ---------- wiring ---------- */
  function wire() {
    $("#views").addEventListener("click", ev => { const b = ev.target.closest("button"); if (b) { state.view = b.dataset.view; savePrefs(); render(); } });
    $("#who").addEventListener("click", ev => { const b = ev.target.closest("button"); if (b) { state.who = b.dataset.who; savePrefs(); render(); } });
    $("#show-done").addEventListener("change", ev => { state.showDone = ev.target.checked; savePrefs(); render(); });
    $("#add").addEventListener("click", () => openEntry(null));
    $("#m-prev").addEventListener("click", () => { state.monthShift--; renderMonths(); });
    $("#m-next").addEventListener("click", () => { state.monthShift++; renderMonths(); });
    $("#m-today").addEventListener("click", () => { state.monthShift = 0; renderMonths(); });
    $("#cancel").addEventListener("click", () => $("#dlg-entry").close());
    $("#day-close").addEventListener("click", () => $("#dlg-day").close());
    $("#day-add").addEventListener("click", () => openEntry({ date: dayOpen }));
    $("#mini").addEventListener("click", () => {
      if (!store || !store.setMini) return;
      Promise.resolve(store.setMini(!state.mini)).then(v => { state.mini = !!v; syncCompact(); }, () => {});
    });
    $("#open-share").addEventListener("click", () => {
      if (!store || !store.shareUI) return;
      const dlg = $("#dlg-share"), box = $("#share-box");
      box.replaceChildren();
      store.shareUI(box, () => dlg.close());
      dlg.showModal();
      const head = box.querySelector("h2"); if (head) { head.tabIndex = -1; head.focus(); }
    });
    for (const d of document.querySelectorAll("dialog")) d.addEventListener("click", ev => { if (ev.target === d) d.close(); });
    const tick = () => { const t = todayStr(); if (t !== state.today) { state.today = t; render(); } };
    setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
  }

  /* ---------- data ---------- */
  function onData(snap) {
    const list = [], next = new Map();
    for (const d of snap.entries || []) {
      const e = clean(d.id, d.data);
      if (!e) continue;
      list.push(e);
      const key = JSON.stringify(e);
      next.set(e.id, key);
      if (state.loaded && known.get(e.id) !== key && !isMine(e.id)) flash.add(e.id);
    }
    known = next;
    state.entries = list; state.loaded = true;
    render();
    flash.clear();
  }
  function onStatus(s) { state.status = Object.assign({ note: "" }, s); render(); }

  function connect(st) {
    if (!st) { state.noStore = true; state.status = { state: "off", label: "Nicht verbunden", note: "" }; render(); return; }
    store = st;
    const cls = document.body.classList;
    cls.toggle("desk", !!st.desktop);
    cls.toggle("can-export", !!st.saveCalendar);
    cls.toggle("can-share", !!st.shareUI);
    if (st.calendarLabel) $("#cal-file").textContent = st.calendarLabel;
    if (st.calendarHint) $("#cal-hint").textContent = st.calendarHint;
    if (st.getMini) Promise.resolve(st.getMini()).then(v => { state.mini = !!v; syncCompact(); }, () => {});
    if (st.onMini) st.onMini(v => { state.mini = !!v; syncCompact(); });
    Promise.resolve(st.canWrite ? st.canWrite() : true).then(ok => {
      if (ok === false) { state.readOnly = true; cls.add("readonly"); render(); }
    }, () => {});
    st.subscribe(onData, onStatus);
  }

  function start(saved) {
    loadPrefs();
    if (saved && typeof saved === "object") {
      if (saved.view === "liste" || saved.view === "monate") state.view = saved.view;
      if (saved.who === "alle" || saved.who === "emir" || saved.who === "talha") state.who = saved.who;
      if (typeof saved.showDone === "boolean") state.showDone = saved.showDone;
      if (Number.isInteger(saved.monthShift)) state.monthShift = saved.monthShift;
    }
    wire(); syncCompact(); render();
    let made;
    try { made = typeof window.TermineStore === "function" ? window.TermineStore() : null; } catch (e) { made = null; }
    Promise.resolve(made).then(connect, () => connect(null));
  }

  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === "function") hot.snapshot(() => ({ view: state.view, who: state.who, showDone: state.showDone, monthShift: state.monthShift }));
  if (hot && typeof hot.ready === "function") hot.ready(start); else start((hot && hot.data) || {});
})();
