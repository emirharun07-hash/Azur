/* AZUR Termine on claude.ai: entries live in the artifact's shared database (collection "termine"). */
window.TermineStore = function () {
  "use strict";
  function waitClaude() {
    return new Promise(done => {
      let n = 0;
      (function look() {
        const c = window.claude;
        if (c && typeof c.use === "function") done(c);
        else if (++n > 40) done(null);
        else setTimeout(look, 100);
      })();
    });
  }

  /* a .zip that holds one stored file: used when a bare .ics may not be saved here */
  const enc = new TextEncoder();
  function crc32(u) {
    let c = -1;
    for (let i = 0; i < u.length; i++) { c ^= u[i]; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; }
    return ~c >>> 0;
  }
  function zipOne(name, text) {
    const data = enc.encode(text), fn = enc.encode(name), crc = crc32(data), d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const out = new Uint8Array(30 + fn.length + data.length + 46 + fn.length + 22), v = new DataView(out.buffer);
    let p = 0;
    v.setUint32(p, 0x04034b50, true); v.setUint16(p + 4, 20, true); v.setUint16(p + 6, 0x0800, true);
    v.setUint16(p + 10, time, true); v.setUint16(p + 12, date, true); v.setUint32(p + 14, crc, true);
    v.setUint32(p + 18, data.length, true); v.setUint32(p + 22, data.length, true); v.setUint16(p + 26, fn.length, true);
    out.set(fn, p + 30); out.set(data, p + 30 + fn.length);
    p += 30 + fn.length + data.length;
    const cd = p;
    v.setUint32(p, 0x02014b50, true); v.setUint16(p + 4, 20, true); v.setUint16(p + 6, 20, true); v.setUint16(p + 8, 0x0800, true);
    v.setUint16(p + 12, time, true); v.setUint16(p + 14, date, true); v.setUint32(p + 16, crc, true);
    v.setUint32(p + 20, data.length, true); v.setUint32(p + 24, data.length, true); v.setUint16(p + 28, fn.length, true);
    v.setUint32(p + 42, 0, true);
    out.set(fn, p + 46);
    p += 46 + fn.length;
    v.setUint32(p, 0x06054b50, true); v.setUint16(p + 8, 1, true); v.setUint16(p + 10, 1, true);
    v.setUint32(p + 12, p - cd, true); v.setUint32(p + 16, cd, true);
    return out;
  }

  return waitClaude().then(claude => {
    if (!claude) return null;
    const use = name => { try { return Promise.resolve(claude.use(name)).catch(() => null); } catch (e) { return Promise.resolve(null); } };
    return Promise.all([use("db"), use("downloads"), use("user")]).then(([db, dl, user]) => {
      if (!db) return null;
      const col = db.collection("termine");
      let icsRefused = false;

      function saveCalendar(name, ics) {
        const asZip = () => dl.save({ filename: name + ".zip", data: zipOne(name + ".ics", ics) })
          .then(() => ({ msg: "Die Kalenderdatei steckt in einer ZIP-Datei. Öffne erst die ZIP, dann die Datei darin.", info: true }));
        const first = icsRefused ? asZip() : dl.save({ filename: name + ".ics", data: ics }).then(() => ({ msg: "" }), err => {
          if (!err || err.code !== "rejected_extension") throw err;
          icsRefused = true;
          return asZip();
        });
        return first.catch(err => {
          const code = err && err.code;
          if (code === "declined") return { msg: "" };
          if (code === "rate_limited") return { msg: "Bitte kurz warten und noch einmal versuchen." };
          return { msg: "Die Datei konnte hier nicht gespeichert werden." };
        });
      }

      function subscribe(next, status) {
        let staleT = 0, retries = 0, loaded = false;
        const arm = () => {
          if (!staleT) staleT = setTimeout(() => {
            staleT = 0;
            status({ state: "stale", label: "Nicht aktuell", note: loaded ? "Keine Verbindung. Der Stand kann alt sein." : "Die Daten sind noch nicht erreichbar. Die App versucht es weiter." });
          }, 10000);
        };
        const go = () => {
          arm();
          col.onSnapshot(snap => {
            const entries = [];
            for (const d of snap.docs) if (d.exists) entries.push({ id: d.id, data: d.data() });
            loaded = true; retries = 0;
            if (snap.metadata && snap.metadata.fromCache) arm();
            else { clearTimeout(staleT); staleT = 0; status({ state: "ok", label: "Aktuell" }); }
            next({ entries: entries });
          }, err => {
            clearTimeout(staleT); staleT = 0;
            if (err && err.code === "unavailable" && retries < 3) {
              status({ state: "stale", label: "Nicht aktuell", note: "Keine Verbindung. Der Stand kann alt sein." });
              setTimeout(go, [3000, 10000, 30000][retries++]);
            } else status({ state: "off", label: "Nicht verbunden", note: "Die Daten sind gerade nicht erreichbar. Bitte später noch einmal öffnen." });
          });
        };
        go();
      }

      return {
        kind: "claude",
        calendarLabel: "Kalenderdatei",
        canWrite: () => user ? user.can("data.write") : null,
        subscribe: subscribe,
        newId: () => col.doc().id,
        create: (id, data) => col.doc(id).set(data),
        update: (id, patch) => col.doc(id).update(patch),
        remove: id => col.doc(id).delete(),
        saveCalendar: dl ? saveCalendar : null
      };
    });
  });
};
