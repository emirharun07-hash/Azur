// Testet artifact/index.html (claude.ai-Fassung) mit einem Ersatz für die Claude-Laufzeit (db, downloads, user).
// Start: NODE_PATH=$(npm root -g) node test/artifact.test.js
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const page_url = "file://" + path.join(root, "artifact/index.html");
const out = process.env.TEST_OUT || path.join(require("os").tmpdir(), "termine-test");
fs.mkdirSync(out, { recursive: true });

const mock = () => {
  const pad = n => String(n).padStart(2, "0");
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  const store = new Map(Object.entries({
    lucid: { title: "LUCID: Vertrag mit Systembetreiber für 2027 abschließen", date: "2026-12-21", time: "10:00", kind: "deadline", who: "beide", note: "Verpackungsregister. Danach die Mengen melden.", done: false },
    late1: { title: "Musterlieferung prüfen", date: day(-3), time: "", kind: "termin", who: "emir", note: "", done: false },
    today1: { title: "Call mit der Druckerei", date: day(0), time: "14:30", kind: "termin", who: "talha", note: "", done: false },
    tom1: { title: "Fotos für den Drop auswählen", date: day(1), time: "", kind: "deadline", who: "emir", note: "", done: false },
    week1: { title: "Größentabelle fertig machen, mit allen Maßen in Zentimetern und einem langen Titel zum Umbrechen", date: day(5), time: "", kind: "termin", who: "beide", note: "", done: false },
    jan1: { title: "Testeintrag im Januar", date: "2027-01-15", time: "", kind: "deadline", who: "beide", note: "", done: false },
    done1: { title: "Logo-Datei schicken", date: day(-10), time: "", kind: "termin", who: "talha", note: "", done: true },
    broken: { title: "kaputt", date: "kein Datum" }
  }));
  let prev = new Map();
  const subs = new Set();
  const snap = () => {
    const ids = [...store.keys()].sort();
    const docs = ids.map(id => { const data = JSON.parse(JSON.stringify(store.get(id))); return { id, exists: true, data: () => data }; });
    const now = new Map(ids.map(id => [id, JSON.stringify(store.get(id))]));
    const changes = [];
    for (const [id, v] of now) if (!prev.has(id)) changes.push({ type: "added", doc: docs.find(d => d.id === id) }); else if (prev.get(id) !== v) changes.push({ type: "modified", doc: docs.find(d => d.id === id) });
    for (const id of prev.keys()) if (!now.has(id)) changes.push({ type: "removed", doc: { id, exists: true, data: () => ({}) } });
    prev = now;
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => changes, metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const emit = () => { const s = snap(); subs.forEach(fn => fn(s)); };
  const later = fn => new Promise((res, rej) => setTimeout(() => { try { res(fn()); } catch (e) { rej(e); } }, 20));
  window.__saves = [];
  window.__store = store;
  window.__remote = (id, data) => { store.set(id, Object.assign({}, store.get(id) || {}, data)); emit(); };
  const db = {
    collection(p) {
      return {
        path: p,
        doc(id) {
          id = id || "n" + Math.random().toString(36).slice(2, 10);
          return {
            id, path: p + "/" + id,
            set: data => later(() => { store.set(id, JSON.parse(JSON.stringify(data))); emit(); }),
            update: data => later(() => { if (!store.has(id)) throw { code: "invalid_argument", message: "no such doc" }; store.set(id, Object.assign({}, store.get(id), JSON.parse(JSON.stringify(data)))); emit(); }),
            delete: () => later(() => { store.delete(id); emit(); })
          };
        },
        onSnapshot(next) { subs.add(next); setTimeout(() => next(snap()), 60); return () => subs.delete(next); }
      };
    }
  };
  const downloads = {
    save: req => later(() => {
      const bytes = typeof req.data === "string" ? Array.from(new TextEncoder().encode(req.data)) : Array.from(req.data);
      window.__saves.push({ filename: req.filename, bytes });
      if (/\.ics$/.test(req.filename)) throw { code: "rejected_extension", message: "not on the list" };
      return { status: "saved" };
    })
  };
  const user = { can: async () => true };
  window.claude = { use: async name => ({ db, downloads, user })[name] || null };
};

const fail = [];
const ok = (cond, label) => { console.log((cond ? "PASS " : "FAIL ") + label); if (!cond) fail.push(label); };

(async () => {
  const browser = await chromium.launch();
  const open = async (opts) => {
    const ctx = await browser.newContext(Object.assign({ deviceScaleFactor: 1, locale: "de-DE", timezoneId: "Europe/Berlin" }, opts));
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error") { console.log("console error:", m.text()); fail.push("console: " + m.text()); } });
    page.on("pageerror", e => { console.log("page error:", e.message); fail.push("pageerror: " + e.message); });
    page.on("requestfailed", r => console.log("request failed:", r.url().slice(0, 90), r.failure() && r.failure().errorText));
    await page.addInitScript(mock);
    await page.goto(page_url);
    await page.waitForSelector(".row");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    return page;
  };

  // ---------- desktop, light ----------
  let page = await open({ viewport: { width: 1280, height: 860 }, colorScheme: "light" });
  console.log("font loaded:", await page.evaluate(() => document.fonts.check('700 16px "Archivo"')));
  await page.screenshot({ path: path.join(out, "desk-light.png") });
  ok(await page.locator(".row").count() === 6, "six open entries listed (done and broken hidden)");
  ok((await page.locator("#sum").innerText()).replace(/\s+/g, " ") === "6 offen · 1 überfällig", "summary line: " + await page.locator("#sum").innerText());
  ok(await page.locator("#sync").getAttribute("data-state") === "ok", "sync shows up to date");
  ok(await page.locator(".month").count() === 3, "three months shown");
  ok(await page.locator("#export-all").isVisible(), "calendar export offered when downloads exist");

  // new entry
  await page.click("#add");
  await page.fill("#f-title", "Probe-Eintrag");
  await page.fill("#f-date", "2026-12-01");
  await page.fill("#f-time", "09:15");
  await page.locator('label:has(#f-kind-deadline)').click();
  await page.locator('label:has(#f-who-emir)').click();
  await page.fill("#f-note", "Zeile eins\nZeile zwei; mit, Zeichen");
  await page.screenshot({ path: path.join(out, "dialog-new.png") });
  await page.click("#save");
  await page.waitForSelector("#dlg-entry:not([open])", { state: "attached" });
  const probe = page.locator(".row", { hasText: "Probe-Eintrag" });
  ok(await probe.count() === 1, "new entry appears in the list");
  ok(/Di, 01\.12\.2026 · 09:15 Uhr/.test(await probe.innerText()), "new entry shows date and time: " + (await probe.locator(".row__meta").innerText()).replace(/\s+/g, " "));
  const saved = await page.evaluate(() => [...window.__store.values()].find(d => d.title === "Probe-Eintrag"));
  ok(saved.kind === "deadline" && saved.who === "emir" && saved.done === false && saved.time === "09:15", "stored fields are right");

  // tick off, undo
  await probe.locator(".check").click();
  await page.waitForSelector(".toast:not([hidden])");
  ok(await page.locator(".row", { hasText: "Probe-Eintrag" }).count() === 0, "ticked entry leaves the open list");
  ok(/Erledigt: Probe-Eintrag/.test(await page.locator("#toast").innerText()), "toast names the entry");
  await page.click("#toast-act");
  await page.waitForSelector(".row:has-text('Probe-Eintrag')");
  ok(true, "undo brings it back");

  // edit + calendar
  await page.locator(".row", { hasText: "Probe-Eintrag" }).locator(".row__main").click();
  ok(await page.locator("#entry-h").innerText() === "Eintrag ändern", "edit dialog opens");
  const href = await page.locator("#cal-google").getAttribute("href");
  ok(/^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/.test(href) && /dates=20261201T081500Z%2F20261201T091500Z/.test(href), "google link carries the time in UTC: " + href.slice(0, 160));
  await page.click("#cal-file");
  await page.waitForSelector("#entry-msg:not([hidden])");
  ok(/ZIP/.test(await page.locator("#entry-msg").innerText()), "zip hint shown after the .ics is refused");
  await page.screenshot({ path: path.join(out, "dialog-edit.png") });
  const saves = await page.evaluate(() => window.__saves);
  ok(saves.length === 2 && /\.ics$/.test(saves[0].filename) && /\.zip$/.test(saves[1].filename), "tries .ics first, then .zip: " + saves.map(s => s.filename).join(", "));
  fs.writeFileSync(path.join(out, "one.ics"), Buffer.from(saves[0].bytes));
  fs.writeFileSync(path.join(out, "one.zip"), Buffer.from(saves[1].bytes));
  await page.fill("#f-title", "Probe-Eintrag geändert");
  await page.click("#save");
  await page.waitForSelector("#dlg-entry:not([open])", { state: "attached" });
  ok(await page.locator(".row", { hasText: "Probe-Eintrag geändert" }).count() === 1, "edit is saved");

  // delete
  await page.locator(".row", { hasText: "Probe-Eintrag geändert" }).locator(".row__main").click();
  await page.click("#del");
  await page.click("#del-yes");
  await page.waitForSelector("#dlg-entry:not([open])", { state: "attached" });
  ok(await page.locator(".row", { hasText: "Probe-Eintrag" }).count() === 0, "delete removes it");

  // change from the other device
  await page.waitForTimeout(8200);
  await page.evaluate(() => window.__remote("lucid", { title: "LUCID: von Talha geändert" }));
  ok(await page.locator(".row.is-fresh", { hasText: "von Talha geändert" }).count() === 1, "remote change shows and is highlighted");
  await page.evaluate(() => window.__remote("neu-remote", { title: "Neu von Talha", date: "2026-11-30", time: "", kind: "termin", who: "talha", note: "", done: false }));
  ok(await page.locator(".row", { hasText: "Neu von Talha" }).count() === 1, "remote new entry shows");

  // filter + done
  await page.click('#who button[data-who="emir"]');
  ok(await page.locator(".row", { hasText: "Call mit der Druckerei" }).count() === 0 && await page.locator(".row", { hasText: "LUCID" }).count() === 1, "filter Emir hides Talha's, keeps 'Beide'");
  await page.click('#who button[data-who="alle"]');
  await page.check("#show-done");
  ok(await page.locator(".row.is-done", { hasText: "Logo-Datei" }).count() === 1, "done entries can be shown");
  await page.uncheck("#show-done");

  // months
  await page.locator('button.day[aria-label^="Montag, 21. Dezember 2026"]').click();
  ok(await page.locator("#dlg-day[open] .row").count() === 1, "day with an entry opens the day sheet");
  await page.click("#day-add");
  ok(await page.inputValue("#f-date") === "2026-12-21", "new entry from the day sheet has that date");
  await page.click("#cancel");
  await page.locator('button.day[aria-label^="Dienstag, 22. Dezember 2026"]').click();
  ok(await page.locator("#dlg-day[open]").count() === 1 && /nichts fällig/.test(await page.locator("#day-list").innerText()) && (await page.locator("#day-h").innerText()) === "Dienstag, 22. Dezember 2026", "empty day opens the day sheet and says nothing is due");
  await page.screenshot({ path: path.join(out, "day-empty.png") });
  await page.click("#day-add");
  ok(await page.inputValue("#f-date") === "2026-12-22", "new entry from an empty day has that date");
  await page.click("#cancel");
  await page.locator('button.day[aria-label^="Montag, 21. Dezember 2026"]').click();
  await page.screenshot({ path: path.join(out, "day-full.png") });
  await page.click("#day-close");
  await page.click("#m-next");
  ok((await page.locator(".month h3").first().innerText()) === "Dezember 2026", "pager moves one month");
  await page.click("#m-today");

  // export all
  await page.evaluate(() => { window.__saves = []; });
  await page.click("#export-all");
  await page.waitForFunction(() => window.__saves.length >= 1);
  const all = await page.evaluate(() => window.__saves);
  fs.writeFileSync(path.join(out, "all.zip"), Buffer.from(all[all.length - 1].bytes));
  ok(/azur-termine\.zip$/.test(all[all.length - 1].filename), "export of all open entries saved as " + all[all.length - 1].filename);
  await page.context().close();

  // ---------- desktop, dark ----------
  page = await open({ viewport: { width: 1280, height: 860 }, colorScheme: "dark" });
  await page.screenshot({ path: path.join(out, "desk-dark.png") });
  await page.context().close();

  // ---------- phone ----------
  page = await open({ viewport: { width: 390, height: 844 }, colorScheme: "light", hasTouch: true, isMobile: true });
  await page.screenshot({ path: path.join(out, "phone-list.png") });
  await page.click('#views button[data-view="monate"]');
  await page.screenshot({ path: path.join(out, "phone-months.png"), fullPage: true });
  await page.click('#views button[data-view="liste"]');
  await page.click("#add");
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(out, "phone-dialog.png") });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "phone: no sideways scroll");
  await page.context().close();

  // ---------- small window ----------
  page = await open({ viewport: { width: 320, height: 440 }, colorScheme: "light" });
  await page.screenshot({ path: path.join(out, "mini.png") });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "small window: no sideways scroll");
  await page.context().close();
  page = await open({ viewport: { width: 260, height: 380 }, colorScheme: "dark" });
  await page.screenshot({ path: path.join(out, "mini-260.png") });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "260px window: no sideways scroll");
  await page.context().close();

  // ---------- tablet ----------
  page = await open({ viewport: { width: 760, height: 900 }, colorScheme: "light" });
  await page.click('#views button[data-view="monate"]');
  await page.screenshot({ path: path.join(out, "tablet-months.png") });
  await page.context().close();

  // ---------- no runtime at all ----------
  const ctx = await browser.newContext({ viewport: { width: 390, height: 600 } });
  page = await ctx.newPage();
  await page.goto(page_url);
  await page.waitForSelector("#notice:not([hidden])", { timeout: 8000 });
  ok(/keine Verbindung zu den Daten/.test(await page.locator("#notice").innerText()), "without the runtime the page says so");
  await ctx.close();

  await browser.close();
  console.log(fail.length ? "\nFAILED: " + fail.length : "\nALL PASSED");
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
