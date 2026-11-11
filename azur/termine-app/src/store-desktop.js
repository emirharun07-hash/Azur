/* AZUR Termine as an app for Windows and Mac.
   Entries live either on this computer (data.json) or in your own Supabase cloud, in the table kb_docs that the
   Kampagnen Board also uses (rows "azur-termine/<id>"). If the Kampagnen Board on this computer is already
   connected to a cloud, the app takes that connection over by itself. */
const TERMINE_SETUP_SQL = /*SETUP_SQL*/"";

window.TermineStore = async function () {
  "use strict";
  const D = window.desktop;
  const info = await D.info();
  const settings = (await D.getSettings()) || {};
  const device = info.platform === "darwin" ? "Mac" : "PC";
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  if (!settings.cloud && !settings.noAutoCloud) {
    const kb = await D.kbCloud();
    if (kb && kb.url && kb.key) { settings.cloud = { url: kb.url, key: kb.key, from: "kampagnen-board" }; await D.setSettings(settings); }
  }

  const base = {
    desktop: true,
    calendarLabel: "Im Kalender öffnen",
    calendarHint: "Öffnet den Eintrag in deinem Kalender (Apple Kalender oder Outlook). Dort nur noch bestätigen. Der Kalender erinnert dich am Tag davor und am Tag selbst.",
    canWrite: () => true,
    newId: newId,
    saveCalendar: (name, text) => D.openCalendar(name, text).then(err => err
      ? { msg: "Der Kalender ließ sich nicht öffnen: " + err }
      : { msg: "Der Kalender öffnet sich. Dort den Eintrag bestätigen.", info: true }),
    getMini: () => D.getMini(),
    setMini: on => D.setMini(on),
    onMini: fn => D.onMini(fn),
    shareUI: (box, close) => shareUI(box, close)
  };

  let localDocs = null;
  const store = settings.cloud && settings.cloud.url && settings.cloud.key
    ? cloudStore(settings.cloud)
    : localStore(await D.loadLocal());
  return Object.assign(store, base);

  /* ---------- on this computer ---------- */
  function localStore(saved) {
    const docs = saved && saved.entries && typeof saved.entries === "object" ? saved.entries : {};
    localDocs = docs;
    let next = null;
    const emit = () => { if (next) next({ entries: Object.keys(docs).map(id => ({ id: id, data: docs[id] })) }); };
    const persist = () => D.saveLocal(JSON.stringify({ entries: docs }));
    return {
      kind: "local",
      subscribe(cb, status) { next = cb; status({ state: "local", label: "Nur auf diesem " + device }); emit(); },
      create: async (id, data) => { docs[id] = JSON.parse(JSON.stringify(data)); await persist(); emit(); },
      update: async (id, patch) => {
        if (!docs[id]) throw { code: "invalid_argument", message: "Eintrag fehlt" };
        docs[id] = Object.assign({}, docs[id], JSON.parse(JSON.stringify(patch))); await persist(); emit();
      },
      remove: async id => { delete docs[id]; await persist(); emit(); }
    };
  }

  /* ---------- your own cloud (Supabase) ---------- */
  function cloudStore(cfg) {
    const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false, autoRefreshToken: false } });
    const TABLE = "kb_docs", PARENT = "azur-termine", PREFIX = PARENT + "/";
    let cache = new Map(), next = null, status = () => {}, reach = null, live = false, emitted = false;
    const emit = () => { if (next) next({ entries: [...cache].map(([id, data]) => ({ id: id, data: data })) }); };
    const report = () => {
      if (reach === null) status({ state: "load", label: "Verbindet" });
      else if (reach === false) status({ state: "stale", label: "Keine Verbindung", note: "Keine Verbindung zu eurer Cloud. Der Stand kann alt sein. Prüfe das Internet. Geht das Internet, schläft vielleicht die Cloud: Die kostenlose Cloud schläft nach einer Woche ohne Nutzung ein. Dann auf supabase.com anmelden und das Projekt wieder starten." });
      else status({ state: "ok", label: "Gemeinsam" });
    };
    const setReach = v => { if (reach !== v) { reach = v; report(); } };

    async function load() {
      const out = new Map();
      let from = 0;
      for (;;) {
        const { data, error } = await sb.from(TABLE).select("path,data").eq("parent", PARENT).range(from, from + 999);
        if (error) throw error;
        for (const r of data) out.set(r.path.slice(PREFIX.length), r.data);
        if (data.length < 1000) break;
        from += 1000;
      }
      return out;
    }
    let loading = null;
    function refresh() {
      if (loading) return loading;
      loading = load().then(fresh => {
        const same = fresh.size === cache.size && JSON.stringify([...fresh]) === JSON.stringify([...cache]);
        cache = fresh; setReach(true);
        if (!same || !emitted) { emitted = true; emit(); }
      }, () => setReach(false)).then(() => { loading = null; });
      return loading;
    }

    // changes from the other person, live; if the network blocks that, ask every 5 seconds
    sb.channel("azur-termine")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, p => {
        const row = p.eventType === "DELETE" ? p.old : p.new;
        if (!row || typeof row.path !== "string" || !row.path.startsWith(PREFIX)) return;
        const id = row.path.slice(PREFIX.length);
        if (p.eventType === "DELETE") cache.delete(id); else cache.set(id, row.data);
        emit();
      })
      .subscribe(st => {
        if (st === "SUBSCRIBED") { if (!live) { live = true; refresh(); } }
        if (st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED") live = false;
      });
    setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60000);
    setInterval(() => { if (!live && document.visibilityState === "visible") refresh(); }, 5000);
    window.addEventListener("focus", () => refresh());

    async function put(id, data) {
      const { error } = await sb.from(TABLE).upsert({ path: PREFIX + id, parent: PARENT, data: data, updated_at: new Date().toISOString() });
      if (error) { setReach(false); refresh(); throw { code: "unavailable", message: error.message }; }
      setReach(true);
    }
    return {
      kind: "cloud",
      subscribe(cb, st) { next = cb; status = st; report(); refresh(); },
      async create(id, data) { const d = JSON.parse(JSON.stringify(data)); cache.set(id, d); emit(); await put(id, d); },
      async update(id, patch) {
        if (!cache.has(id)) throw { code: "invalid_argument", message: "Eintrag fehlt" };
        const d = Object.assign({}, cache.get(id), JSON.parse(JSON.stringify(patch)));
        cache.set(id, d); emit(); await put(id, d);
      },
      async remove(id) {
        cache.delete(id); emit();
        const { error } = await sb.from(TABLE).delete().eq("path", PREFIX + id);
        if (error) { setReach(false); refresh(); throw { code: "unavailable", message: error.message }; }
      }
    };
  }

  /* ---------- "Gemeinsam nutzen": connect, invite code, disconnect ---------- */
  function shareUI(box, close) {
    const cloud = settings.cloud && settings.cloud.url ? settings.cloud : null;
    const h = (tag, attrs, ...kids) => {
      const el = document.createElement(tag);
      for (const k in attrs || {}) { if (attrs[k] == null || attrs[k] === false) continue; if (k === "class") el.className = attrs[k]; else el.setAttribute(k, attrs[k] === true ? "" : attrs[k]); }
      for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
      return el;
    };
    const err = h("p", { class: "msg", role: "alert", hidden: true });
    const fail = t => { err.textContent = t; err.hidden = false; };
    box.replaceChildren();

    if (cloud) {
      let host = "";
      try { host = new URL(cloud.url).hostname.split(".")[0]; } catch (e) { /* keep empty */ }
      const code = h("input", { type: "text", id: "sh-code", readonly: true, value: encodeInvite(cloud.url, cloud.key), "aria-label": "Einladungscode" });
      const copyBtn = h("button", { type: "button", class: "btn" }, "Kopieren");
      const off = h("button", { type: "button", class: "link link--late" }, "Verbindung trennen");
      const ask = h("span", { class: "confirm", hidden: true }, "Wirklich trennen? ",
        h("button", { type: "button", class: "link link--late", id: "sh-off-yes" }, "Ja, trennen"), " ",
        h("button", { type: "button", class: "link", id: "sh-off-no" }, "Nein"));
      const done = h("button", { type: "button", class: "btn btn--primary" }, "Fertig");
      box.append(
        h("h2", null, "Gemeinsam nutzen"),
        h("p", { class: "ok-line" }, h("span", null, "Verbunden mit eurer Cloud ", h("b", null, host || "Supabase"), ". Alle mit dieser Verbindung sehen dieselben Einträge.")),
        cloud.from === "kampagnen-board" ? h("p", { class: "hint" }, "Die Verbindung kommt vom Kampagnen Board auf diesem " + device + ".") : null,
        h("div", { class: "field" }, h("span", null, "Einladungscode"), h("div", { class: "inline" }, code, copyBtn)),
        h("p", { class: "hint" }, "Ist das Kampagnen Board bei der anderen Person schon mit eurer Cloud verbunden, verbindet sich die App dort von selbst. Sonst gib ihr diesen Code. Nur an Leute geben, denen du vertraust."),
        err,
        h("div", { class: "actions" }, off, ask, h("span", { class: "grow" }), done));
      copyBtn.onclick = () => D.copy(code.value).then(() => { copyBtn.textContent = "Kopiert"; setTimeout(() => { copyBtn.textContent = "Kopieren"; }, 1600); });
      done.onclick = close;
      off.onclick = () => { off.hidden = true; ask.hidden = false; };
      ask.querySelector("#sh-off-no").onclick = () => { ask.hidden = true; off.hidden = false; };
      ask.querySelector("#sh-off-yes").onclick = async () => {
        delete settings.cloud; settings.noAutoCloud = true;
        await D.setSettings(settings);
        location.reload();
      };
      return;
    }

    const hasLocal = localDocs && Object.keys(localDocs).length > 0;
    const codeIn = h("input", { type: "text", id: "sh-in", placeholder: "KB1.…", autocomplete: "off", spellcheck: "false" });
    const urlIn = h("input", { type: "text", id: "sh-url", placeholder: "https://xyz.supabase.co", autocomplete: "off", spellcheck: "false" });
    const keyIn = h("input", { type: "text", id: "sh-key", placeholder: "eyJhbGciOi…", autocomplete: "off", spellcheck: "false" });
    const move = h("input", { type: "checkbox", id: "sh-move", checked: true });
    const sqlBtn = h("button", { type: "button", class: "btn btn--quiet" }, "SQL kopieren");
    const go = h("button", { type: "button", class: "btn btn--primary" }, "Verbinden");
    const cancel = h("button", { type: "button", class: "btn" }, "Abbrechen");
    box.append(
      h("h2", null, "Gemeinsam nutzen"),
      h("p", null, "Im Moment speichert die App nur auf diesem " + device + ". Mit eurer Cloud seht ihr beide dieselben Einträge."),
      h("label", { class: "field", for: "sh-in" }, h("span", null, "Einladungscode"), codeIn),
      h("p", { class: "hint" }, "Den Code zeigt das Kampagnen Board unter „Teilen“. Oder die andere Person kopiert ihn hier in der App unter „Gemeinsam nutzen“."),
      h("details", { class: "more-box" }, h("summary", null, "Noch keine Cloud? So richtest du eine ein"),
        h("div", null,
          h("ol", { class: "steps" },
            h("li", null, "Auf supabase.com kostenlos anmelden und ein neues Projekt anlegen (Region Frankfurt)."),
            h("li", null, "Links „SQL Editor“ öffnen, das SQL einfügen und auf „Run“ klicken. ", sqlBtn),
            h("li", null, "Unter „Project Settings“, „API“ die Project URL und den „anon public“-Schlüssel hier einfügen.")),
          h("label", { class: "field", for: "sh-url" }, h("span", null, "Project URL"), urlIn),
          h("label", { class: "field", for: "sh-key" }, h("span", null, "anon public key"), keyIn))),
      hasLocal ? h("label", { class: "tick", for: "sh-move" }, move, h("span", null, "Einträge von diesem " + device + " mitnehmen")) : null,
      err,
      h("div", { class: "actions" }, h("span", { class: "grow" }), cancel, go));
    sqlBtn.onclick = () => D.copy(TERMINE_SETUP_SQL).then(() => { sqlBtn.textContent = "Kopiert"; setTimeout(() => { sqlBtn.textContent = "SQL kopieren"; }, 1600); });
    cancel.onclick = close;
    go.onclick = async () => {
      err.hidden = true;
      let cfg;
      if (urlIn.value.trim() || keyIn.value.trim()) {
        let url = urlIn.value.trim().replace(/\/+$/, "");
        if (url && !/^https?:\/\//.test(url)) url = "https://" + url;
        cfg = { url: url, key: keyIn.value.trim() };
        if (!cfg.url || !cfg.key) return fail("Bitte Project URL und Schlüssel eintragen.");
      } else {
        cfg = decodeInvite(codeIn.value);
        if (!cfg) return fail(codeIn.value.trim() ? "Der Code ist unvollständig. Kopiere ihn bitte ganz, er beginnt mit KB1." : "Bitte den Einladungscode einfügen.");
      }
      go.disabled = true; go.textContent = "Prüft …";
      const problem = await check(cfg);
      if (problem) { fail(problem); go.disabled = false; go.textContent = "Verbinden"; return; }
      if (hasLocal && move.checked) {
        go.textContent = "Überträgt …";
        const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
        const rows = Object.keys(localDocs).map(id => ({ path: "azur-termine/" + id, parent: "azur-termine", data: localDocs[id], updated_at: new Date().toISOString() }));
        const { error } = await sb.from("kb_docs").upsert(rows);
        if (error) { fail("Übertragen hat nicht geklappt: " + error.message); go.disabled = false; go.textContent = "Verbinden"; return; }
      }
      settings.cloud = { url: cfg.url, key: cfg.key, from: "code" };
      delete settings.noAutoCloud;
      await D.setSettings(settings);
      location.reload();
    };
  }

  async function check(cfg) {
    try {
      const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
      const { error } = await sb.from("kb_docs").select("path").limit(1);
      if (!error) return null;
      const m = String(error.message || "");
      if (/relation|does not exist|schema cache/i.test(m)) return "In der Cloud fehlt die Tabelle. Bitte Schritt 2 (SQL ausführen) machen.";
      if (/fetch|network|Load failed/i.test(m)) return "Keine Verbindung. Prüfe die Project URL (endet auf .supabase.co) und das Internet.";
      if (/Invalid API key|JWT|apikey/i.test(m)) return "Der Schlüssel passt nicht. Nimm den „anon public“-Schlüssel aus „Project Settings“, „API“.";
      return "Verbindung fehlgeschlagen: " + m;
    } catch (e) {
      return "Keine Verbindung. Prüfe die Project URL (beginnt mit https:// und endet auf .supabase.co).";
    }
  }
  /* same code format as the Kampagnen Board, so one code works for both apps */
  function encodeInvite(url, key) {
    return "KB1." + btoa(unescape(encodeURIComponent(JSON.stringify({ u: url, k: key })))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeInvite(code) {
    try {
      const s = String(code).trim().replace(/^KB1\./, "").replace(/-/g, "+").replace(/_/g, "/");
      const o = JSON.parse(decodeURIComponent(escape(atob(s))));
      return o.u && o.k ? { url: o.u, key: o.k } : null;
    } catch (e) { return null; }
  }
};
