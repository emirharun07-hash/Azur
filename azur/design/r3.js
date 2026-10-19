/* Design round 3 (owner alone; the partner joins in the last round).
   Product view and shop page: the round-2 likes again (to compare) plus mixes of them.
   Animation: live demos of motion for the shop (hover, buying, sizes, page build-up, bar).
   Colour: palettes on one fixed composite (shop grid + product panel), contrast checked.
   Uses the helpers of swipe.html and r2.js (nm, shopTop); only called when a card is drawn. */

const pitch = (sel = 'M', o = {}) => `<div class="pm${o.h ? ' h' : ''}" style="${o.style || ''}"><span class="bx t"></span><span class="bx b"></span>${(o.pos || (o.h ? [['S', 18, 50], ['M', 39, 50], ['L', 61, 50], ['XL', 82, 50]] : [['S', 22, 72], ['M', 50, 62], ['L', 78, 72], ['XL', 50, 26]])).map(([s, x, y]) => `<span class="pl${s === sel ? ' on' : ''}" style="left:${x}%;top:${y}%">${s}</span>`).join('')}</div>`;
const stadium = (sel = 'M', o = {}) => `<div class="st" style="${o.style || ''}"><div class="f">${o.inner || ''}</div>${[['S', 'sT', 'Gegengerade'], ['M', 'sB', 'Haupttribüne'], ['L', 'sL', 'Nord'], ['XL', 'sR', 'Süd']].map(([s, k, n]) => `<div class="b ${k}${s === sel ? ' on' : ''}"><b>${s}</b>${o.labels === false ? '' : `<small>${n}</small>`}</div>`).join('')}</div>`;
const scan = () => `<span class="scan3"></span>`;
const card3 = (q, h = 400, o = {}) => `<div class="cd3 ${q.city ? '' : 's'} ${o.cls || ''}" style="height:${h}px"><div class="top"><span class="val">${q.code}</span><span class="kd">${q.city ? 'Stadt' : 'Land'}</span></div><img src="${q.img}" alt=""><b>${q.name}</b><div class="at"><span>KRAGEN ${q.city ? 'POLO' : 'RUND'}</span><span>GRÖSSEN S–XL</span></div><div class="vl">${eur(q.price)}</div></div>`;
const phone = (label, inner) => `<div class="phw"><span class="lab">${label}</span><div class="ph3"><div class="pst"></div>${inner}</div></div>`;
const phead = () => `<div class="pmq">Versand DE ca. 3 Werktage ✦ ab 90 € gratis</div><div class="phd"><img src="${logo(false)}" alt="Azur"><span>Warenkorb <b>1</b></span></div>`;
const fitName = (s, w, max) => Math.min(max, Math.floor(w / (s.length * 0.43)));

const BASE3 = `
.m .pm{--pmc:var(--ink);--pmf:var(--bg);position:relative;border:2px solid var(--pmc)}
.m .pm::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:2px solid var(--pmc)}
.m .pm::after{content:"";position:absolute;left:50%;top:50%;width:26%;aspect-ratio:1;translate:-50% -50%;border:2px solid var(--pmc);border-radius:50%}
.m .pm .bx{position:absolute;left:28%;right:28%;height:16%;border:2px solid var(--pmc)}.m .pm .bx.t{top:-2px;border-top:0}.m .pm .bx.b{bottom:-2px;border-bottom:0}
.m .pm.h::before{left:50%;right:auto;top:0;bottom:0;border-top:0;border-left:2px solid var(--pmc)}.m .pm.h::after{width:auto;height:34%}
.m .pm.h .bx{left:auto;right:auto;top:26%;bottom:26%;height:auto;width:9%}.m .pm.h .bx.t{left:-2px;border:2px solid var(--pmc);border-left:0}.m .pm.h .bx.b{right:-2px;border:2px solid var(--pmc);border-right:0}
.m .pm .pl{position:absolute;width:var(--pl,52px);height:var(--pl,52px);translate:-50% -50%;border-radius:50%;background:var(--pmf);color:var(--pmc);border:2px solid var(--pmc);display:grid;place-items:center;font-weight:900;font-size:calc(var(--pl,52px)*.34);z-index:1}
.m .pm .pl.on{background:var(--acc);border-color:var(--acc);color:var(--accInk);box-shadow:0 0 0 5px color-mix(in srgb,var(--acc) 28%,transparent)}
.m .st{--stc:var(--ink);--stf:var(--bg);position:relative}.m .st .f{position:absolute;left:24%;right:24%;top:27%;bottom:27%;border:2px solid var(--stc);display:grid;place-items:center;overflow:hidden}
.m .st .b{position:absolute;border:2px solid var(--stc);background:var(--stf);color:var(--stc);display:grid;place-content:center;text-align:center;line-height:1}
.m .st .b b{font-weight:900;font-stretch:70%;font-size:22px}.m .st .b small{font-family:'Martian Mono',monospace;font-size:9px;letter-spacing:.04em;margin-top:3px}
.m .st .sT{left:24%;right:24%;top:0;height:22%}.m .st .sB{left:24%;right:24%;bottom:0;height:22%}.m .st .sL{left:0;width:20%;top:27%;bottom:27%}.m .st .sR{right:0;width:20%;top:27%;bottom:27%}
.m .st .b.on{background:var(--acc);border-color:var(--acc);color:var(--accInk)}
.m .scan3{flex:none;width:110px;height:60px;background:repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 5px,currentColor 5px 6px,transparent 6px 9px)}
.m .cd3{clip-path:polygon(50% 0,100% 7%,100% 93%,50% 100%,0 93%,0 7%);background:linear-gradient(160deg,#e9d9a8,#b8954a);color:#2a2010;padding:30px 20px 34px;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto auto;justify-items:center;text-align:center;gap:6px}
.m .cd3.s{background:linear-gradient(160deg,#eceef2,#9aa1ad)}.m .cd3 .top{display:flex;justify-content:space-between;align-items:baseline;width:100%;padding:0 6px}
.m .cd3 .val{font-size:30px;font-weight:900;font-stretch:62%}.m .cd3 .kd{font-family:'Martian Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.m .cd3 img{width:86%;height:100%;object-fit:contain;min-height:0}.m .cd3 b{font-size:24px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:1}
.m .cd3 .at{display:flex;gap:12px;font-family:'Martian Mono',monospace;font-size:9.5px}.m .cd3 .vl{font-family:'Martian Mono',monospace;font-weight:600;font-size:16px}
.m .phones{position:absolute;inset:0;display:flex;justify-content:center;align-items:center;gap:56px;background:var(--surf2)}
.m .phw{display:grid;gap:12px;justify-items:center}.m .ph3{position:relative;width:330px;height:690px;border-radius:44px;border:10px solid #111;background:var(--bg);overflow:hidden;box-shadow:0 30px 60px rgb(0 0 0/.25);font-size:13px}
.m .ph3 .pst{height:26px;background:var(--bg)}.m .ph3 .pmq{height:22px;display:flex;align-items:center;justify-content:center;background:var(--ink);color:var(--bg);font-family:'Martian Mono',monospace;font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.m .ph3 .phd{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid var(--line)}.m .ph3 .phd img{height:18px}
.m .ph3 .phd span{font-weight:700;font-size:12px}.m .ph3 .phd b{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:9px;background:var(--acc);color:var(--accInk);font-size:10px;margin-left:4px}
.m .ph3 .sz{gap:6px}.m .ph3 .sz span{min-width:0;flex:1;height:36px;font-size:13px}.m .ph3 .cta{height:46px;font-size:14px;padding:0 16px}.m .ph3 .ship{font-size:11px}
.m .ph3 .sbar{position:absolute;left:0;right:0;bottom:0;padding:12px 14px 18px;background:var(--surf);border-top:1px solid var(--line);display:grid;gap:10px;box-shadow:0 -10px 24px rgb(0 0 0/.08)}
`;

/* ================================================================ product view */
const PDP3_NEW = {
  mlineup: { key: 'mlineup', fam: 'Mischung', name: 'Modemagazin + Aufstellung', idea: 'Dein Modemagazin mit dem riesigen Namen. Die Größe wählst du aber auf einer kleinen Aufstellung rechts neben dem Trikot. Unten bleibt die feste Kaufleiste.',
    tags: ['Modemagazin', 'Aufstellung', 'Feste Kaufleiste', 'Lieferzeit'],
    css: `.m.L-mlineup{background:var(--bg)}.L-mlineup .big{position:absolute;left:0;right:0;top:36px;text-align:center;font-size:240px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.85}
      .L-mlineup .im{position:absolute;left:50%;top:120px;translate:-50% 0;height:520px}.L-mlineup .colL{position:absolute;left:70px;top:330px;width:290px;display:grid;gap:12px}
      .L-mlineup .side{position:absolute;right:76px;top:300px;width:250px;display:grid;gap:10px}.L-mlineup .pm{height:260px}
      .L-mlineup .bar2{position:absolute;left:40px;right:40px;bottom:30px;height:84px;background:var(--surf);border-radius:var(--r);display:grid;grid-template-columns:1.2fr 1.5fr 1.1fr;align-items:center;gap:26px;padding:0 26px;box-shadow:0 20px 40px rgb(0 0 0/.18)}.L-mlineup .bar2 h3{font-size:30px}`,
    html: p => `<div class="big">${p.name}</div><img class="im shadow" src="${p.img}" alt=""><div class="colL"><span class="eyebrow">Ausgabe 01 · Aufstellung</span><p style="font-size:17px;line-height:1.5">${desc(p)}</p><span class="hand" style="font-size:26px">tipp auf deine Größe</span></div>
      <div class="side"><span class="lab">Deine Größe</span>${pitch('M')}<div class="row"><span class="lab">Aufgestellt: M</span>${guide()}</div></div>
      <div class="bar2"><div><h3>${title(p)}</h3><div class="price">${eur(p.price)}</div></div>${ship()}${cta(p)}</div>` },

  mseat: { key: 'mseat', fam: 'Mischung', name: 'Modemagazin + Platzwahl', idea: 'Wieder das Modemagazin, rechts aber ein kleiner Stadionplan: jeder Block ist eine Größe. Die feste Kaufleiste unten fasst deine Wahl zusammen.',
    tags: ['Modemagazin', 'Platzwahl', 'Feste Kaufleiste', 'Zusammenfassung'],
    css: `.m.L-mseat{background:var(--bg)}.L-mseat .big{position:absolute;left:0;right:0;top:36px;text-align:center;font-size:240px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.85}
      .L-mseat .im{position:absolute;left:50%;top:120px;translate:-50% 0;height:520px}.L-mseat .colL{position:absolute;left:70px;top:330px;width:290px;display:grid;gap:12px}
      .L-mseat .side{position:absolute;right:66px;top:300px;width:270px;display:grid;gap:10px}.L-mseat .st{height:220px}
      .L-mseat .bar2{position:absolute;left:40px;right:40px;bottom:30px;height:84px;background:var(--surf);border-radius:var(--r);display:grid;grid-template-columns:1.2fr 1.1fr 1.2fr 1.1fr;align-items:center;gap:26px;padding:0 26px;box-shadow:0 20px 40px rgb(0 0 0/.18)}.L-mseat .bar2 h3{font-size:30px}`,
    html: p => `<div class="big">${p.name}</div><img class="im shadow" src="${p.img}" alt=""><div class="colL"><span class="eyebrow">Ausgabe 01 · Platzwahl</span><p style="font-size:17px;line-height:1.5">${desc(p)}</p><span class="hand" style="font-size:26px">such dir deinen Block</span></div>
      <div class="side"><span class="lab">Block = Größe</span>${stadium('M')}<div class="row"><span class="lab">Gewählt: M · Haupttribüne</span></div>${guide()}</div>
      <div class="bar2"><div><h3>${title(p)}</h3><div class="price">${eur(p.price)}</div></div><div class="lab" style="line-height:1.6">Block M<br>Anstoß ca. 3 Werktage</div>${ship()}${cta(p, 'Platz sichern')}</div>` },

  glineup: { key: 'glineup', fam: 'Mischung', name: 'Drehkreuz + Aufstellung', idea: 'Das Plakat vom Drehkreuz bleibt. In der dunklen Einlass-Leiste unten stehen die Größen aber als Spieler auf einem kleinen Feld.',
    tags: ['Plakat-Look', 'Aufstellung', 'Kaufleiste unten', 'Lieferzeit'],
    css: `.L-glineup .poster{position:absolute;inset:0 0 170px 0;background:var(--surf);overflow:hidden}.L-glineup .poster img{position:absolute;right:130px;top:24px;height:580px}
      .L-glineup .poster h1{position:absolute;left:80px;top:96px;font-size:120px;font-weight:900}.L-glineup .poster .k{position:absolute;left:84px;top:62px;font-family:'Martian Mono',monospace;font-size:13px;letter-spacing:.2em}
      .L-glineup .poster .vs{position:absolute;left:84px;top:340px;font-family:'Libre Bodoni',serif;font-size:28px;font-style:italic;max-width:470px;line-height:1.3}
      .L-glineup .gate{position:absolute;left:0;right:0;bottom:0;height:170px;background:var(--ink);color:var(--bg);display:flex;align-items:center;gap:34px;padding:0 70px}
      .L-glineup .gate .pm{--pmc:var(--bg);--pmf:var(--ink);--pl:44px;width:360px;height:120px;flex:none}.L-glineup .gate .price{font-size:30px}.L-glineup .gate .cta{margin-left:auto;width:300px;height:70px;font-size:22px}`,
    html: p => `<div class="poster"><span class="k">AZUR PRÄSENTIERT · HEIMSPIEL</span><h1>${p.name}<br><em>${p.code}</em></h1><p class="vs">${desc(p)}<br><span class="desc" style="font-family:Archivo;font-style:normal;font-size:15px">Anstoß: ca. 3 Werktage nach Bestellung · 14 Tage Rückgabe</span></p><img class="shadow" src="${p.img}" alt=""></div>
      <div class="gate">${scan()}${pitch('M', { h: true })}<div style="display:grid;gap:6px"><span class="lab" style="color:inherit;opacity:.7">Aufgestellt: M</span><span class="price">${eur(p.price)}</span></div>${cta(p, 'Einlass →')}</div>` },

  gseat: { key: 'gseat', fam: 'Mischung', name: 'Drehkreuz + Platzwahl', idea: 'Gleiches Plakat, aber in der Einlass-Leiste wählst du deinen Block im Stadion. So kannst du direkt mit „Drehkreuz + Aufstellung“ vergleichen.',
    tags: ['Plakat-Look', 'Platzwahl', 'Kaufleiste unten', 'Zusammenfassung'],
    css: `.L-gseat .poster{position:absolute;inset:0 0 170px 0;background:var(--surf);overflow:hidden}.L-gseat .poster img{position:absolute;right:130px;top:24px;height:580px}
      .L-gseat .poster h1{position:absolute;left:80px;top:96px;font-size:120px;font-weight:900}.L-gseat .poster .k{position:absolute;left:84px;top:62px;font-family:'Martian Mono',monospace;font-size:13px;letter-spacing:.2em}
      .L-gseat .poster .vs{position:absolute;left:84px;top:340px;font-family:'Libre Bodoni',serif;font-size:28px;font-style:italic;max-width:470px;line-height:1.3}
      .L-gseat .gate{position:absolute;left:0;right:0;bottom:0;height:170px;background:var(--ink);color:var(--bg);display:flex;align-items:center;gap:34px;padding:0 70px}
      .L-gseat .gate .st{--stc:var(--bg);--stf:var(--ink);width:230px;height:136px;flex:none}.L-gseat .gate .st .b b{font-size:16px}
      .L-gseat .gate .price{font-size:30px}.L-gseat .gate .cta{margin-left:auto;width:320px;height:70px;font-size:20px}`,
    html: p => `<div class="poster"><span class="k">AZUR PRÄSENTIERT · HEIMSPIEL</span><h1>${p.name}<br><em>${p.code}</em></h1><p class="vs">${desc(p)}<br><span class="desc" style="font-family:Archivo;font-style:normal;font-size:15px">Anstoß: ca. 3 Werktage nach Bestellung · 14 Tage Rückgabe</span></p><img class="shadow" src="${p.img}" alt=""></div>
      <div class="gate">${scan()}${stadium('M', { labels: false })}<div style="display:grid;gap:6px"><span class="lab" style="color:inherit;opacity:.7">Block M · Haupttribüne</span><span class="price">${eur(p.price)}</span></div>${cta(p, 'Platz sichern')}</div>` },

  mgate: { key: 'mgate', fam: 'Mischung', name: 'Modemagazin + Einlass-Leiste', idea: 'Oben das Modemagazin, unten statt der hellen Kaufleiste die dunkle Einlass-Leiste vom Drehkreuz über die ganze Breite. Die zwei Favoriten in einem.',
    tags: ['Modemagazin', 'Drehkreuz', 'Volle Breite', 'Einfach'],
    css: `.m.L-mgate{background:var(--bg)}.L-mgate .big{position:absolute;left:0;right:0;top:30px;text-align:center;font-size:240px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.85}
      .L-mgate .im{position:absolute;left:50%;top:110px;translate:-50% 0;height:510px}.L-mgate .colL{position:absolute;left:70px;top:310px;width:300px;display:grid;gap:12px}
      .L-mgate .colR{position:absolute;right:70px;top:310px;width:280px;display:grid;gap:10px;font-size:13px}.L-mgate .colR div{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:8px}
      .L-mgate .gate{position:absolute;left:0;right:0;bottom:0;height:140px;background:var(--ink);color:var(--bg);display:flex;align-items:center;gap:36px;padding:0 70px}
      .L-mgate .gate .sz span{background:transparent;color:var(--bg);border-color:color-mix(in srgb,var(--bg) 35%,transparent)}.L-mgate .gate .sz span.on{background:var(--bg);color:var(--ink)}
      .L-mgate .gate h3{font-size:30px}.L-mgate .gate .cta{margin-left:auto;width:300px;height:66px;font-size:20px}`,
    html: p => `<div class="big">${p.name}</div><img class="im shadow" src="${p.img}" alt=""><div class="colL"><span class="eyebrow">Ausgabe 01 · ${p.city ? 'Die Stadt auf dem Rücken' : 'Retro-Länder'}</span><p style="font-size:17px;line-height:1.5">${desc(p)}</p><span class="hand" style="font-size:26px">für jeden Tag, nicht nur Spieltag</span></div>
      <div class="colR"><div><span>Kragen</span><b>${p.city ? 'Polo' : 'Rund'}</b></div><div><span>Rückgabe</span><b>14 Tage</b></div><div><span>Versand DE</span><b>ca. 3 Werktage</b></div><div><span>Ab 90 €</span><b>versandkostenfrei</b></div></div>
      <div class="gate">${scan()}<div style="display:grid;gap:4px"><h3>${title(p)}</h3><span class="price">${eur(p.price)}</span></div>${sizes()}${cta(p, 'Einlass →')}</div>` },

  lineupbig: { key: 'lineupbig', fam: 'Mischung', name: 'Aufstellung als Bühne', idea: 'Das Spielfeld ist die ganze linke Seite, das Trikot liegt groß im Mittelkreis, die Größen stehen als Spieler drumherum. Rechts eine ruhige Kaufspalte.',
    tags: ['Aufstellung groß', 'Spielerisch', 'Ruhige Kaufspalte', 'Lieferzeit'],
    css: `.m.L-lineupbig{background:var(--bg)}.L-lineupbig .pm{position:absolute;left:150px;top:46px;width:540px;height:708px;--pl:74px}.L-lineupbig .pm::after{width:44%}
      .L-lineupbig .im{position:absolute;left:420px;top:400px;translate:-50% -50%;height:380px;z-index:1}
      .L-lineupbig .rp{position:absolute;right:0;top:0;bottom:0;width:430px;background:var(--surf);padding:60px 46px;display:flex;flex-direction:column;gap:16px;border-left:1px solid var(--line)}.L-lineupbig .rp h2{font-size:54px}`,
    html: p => `${pitch('M', { pos: [['S', 17, 80], ['M', 50, 90], ['L', 83, 80], ['XL', 50, 10]] })}<img class="im shadow" src="${p.img}" alt="">
      <div class="rp"><span class="eyebrow">Seite 4 · Aufstellung</span><h2>${title(p)}</h2><p class="desc">${desc(p)}</p><span class="price">${eur(p.price)}</span><div class="row"><span class="lab">Aufgestellt: Größe M</span>${guide()}</div>${cta(p, 'Aufstellen')}${ship()}${trust()}</div>` },

  stadium: { key: 'stadium', fam: 'Mischung', name: 'Stadionplan rund', idea: 'Ein großer Stadionplan von oben mit runden Ecken, das Trikot auf dem Rasen. Rechts deine Karte mit Abriss: Block, Anstoß, Rückgabe, Preis.',
    tags: ['Platzwahl groß', 'Ticket mit Abriss', 'Zusammenfassung', 'Lieferzeit'],
    css: `.m.L-stadium{background:var(--surf2)}.L-stadium .st{position:absolute;left:70px;top:60px;width:700px;height:680px}
      .L-stadium .st .b{border-radius:6px}.L-stadium .st .sT{border-radius:120px 120px 6px 6px}.L-stadium .st .sB{border-radius:6px 6px 120px 120px}
      .L-stadium .st .b b{font-size:40px}.L-stadium .st .b small{font-size:12px}.L-stadium .st .f{border-radius:10px;background:var(--surf)}.L-stadium .st .f img{height:300px}
      .L-stadium .tk{position:absolute;right:60px;top:90px;width:390px;bottom:90px;background:var(--surf);padding:40px 36px;display:flex;flex-direction:column;gap:12px;box-shadow:0 30px 60px rgb(0 0 0/.18)}
      .L-stadium .tk::before{content:"";position:absolute;left:0;right:0;bottom:150px;border-top:2px dashed var(--line)}.L-stadium .tk h2{font-size:44px}
      .L-stadium .tk .t{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:7px 0;font-size:14px}.L-stadium .tk .cta{margin-top:auto}`,
    html: p => `${stadium('M', { inner: `<img class="shadow" src="${p.img}" alt="">` })}<div class="tk"><span class="eyebrow">Deine Karte</span><h2>${title(p)}</h2>
      <div class="t"><span>Block</span><b>M · Haupttribüne</b></div><div class="t"><span>Anstoß</span><b>ca. 3 Werktage</b></div><div class="t"><span>Rückgabe</span><b>14 Tage</b></div><div class="t"><span>Preis</span><b class="price" style="font-size:16px">${eur(p.price)}</b></div>${guide()}${cta(p, 'Platz sichern')}${ship()}</div>` },

  mlook: { key: 'mlook', fam: 'Mischung', name: 'Modemagazin Lookbook', idea: 'Wie eine Seite aus einem Modeheft: der Name senkrecht am Rand, das Trikot groß, daneben ein Ausschnitt vom Wappen. Rechts Text und Kaufen in einer Spalte.',
    tags: ['Modemagazin', 'Detail-Ausschnitt', 'Ruhig', 'Mode statt Fanartikel'],
    css: `.m.L-mlook{background:var(--bg)}.L-mlook .vert{position:absolute;left:30px;top:0;bottom:0;writing-mode:vertical-rl;rotate:180deg;font-size:150px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.85;text-align:center}
      .L-mlook .main{position:absolute;left:200px;top:50px;width:470px;height:700px;background:var(--surf2);display:grid;place-items:center}.L-mlook .main img{height:560px}
      .L-mlook .det{position:absolute;left:700px;top:50px;width:180px;height:220px;background:var(--surf2);overflow:hidden}.L-mlook .det img{position:absolute;width:640px;left:-345px;top:-112px}
      .L-mlook .det2{position:absolute;left:700px;top:290px;width:180px;font-family:'Libre Bodoni',serif;font-style:italic;font-size:19px;line-height:1.35}
      .L-mlook .rp{position:absolute;right:56px;top:50px;width:320px;display:flex;flex-direction:column;gap:16px}.L-mlook .rp h2{font-size:46px}`,
    html: p => `<div class="vert">${p.name}</div><div class="main"><img class="shadow" src="${p.img}" alt=""></div><div class="det"><img src="${p.img}" alt=""></div><p class="det2">„${p.city ? 'Die Vorwahl auf dem Rücken, die Stadt auf der Brust.' : 'Retro-Schnitt in den Farben von ' + p.name + '.'}“</p>
      <div class="rp"><span class="eyebrow">Ausgabe 01 · Lookbook</span><h2>${title(p)}</h2><p class="desc">${desc(p)}</p><span class="price">${eur(p.price)}</span>${sizes()}${guide()}${cta(p)}${ship()}${trust()}</div>` },

  phonepdp: { key: 'phonepdp', fam: 'Handy', name: 'Auf dem Handy', idea: 'Die meisten kaufen auf dem Handy. So sähen Modemagazin, Aufstellung und Drehkreuz dort aus: Kaufen bleibt immer unten im Daumenbereich.',
    tags: ['Handy', 'Kaufen im Daumenbereich', 'Vergleich', 'Drei Favoriten'],
    css: `.L-phonepdp .mg .nmb{font-weight:900;font-stretch:62%;text-transform:uppercase;text-align:center;line-height:.85;margin-top:12px}.L-phonepdp .mg img{display:block;height:300px;margin:-18px auto 0}
      .L-phonepdp .mg p{padding:0 18px;color:var(--mut);font-size:12px;line-height:1.45}.L-phonepdp .pt h3{font-size:30px;padding:14px 18px 0}.L-phonepdp .pt img{display:block;height:220px;margin:4px auto}
      .L-phonepdp .pt .pm{--pl:40px;margin:0 18px;height:96px}.L-phonepdp .gt .po{background:var(--surf);height:440px;position:relative;overflow:hidden}
      .L-phonepdp .gt .po h3{position:absolute;left:18px;top:34px;font-size:52px}.L-phonepdp .gt .po img{position:absolute;right:-30px;top:150px;height:280px}
      .L-phonepdp .gt .po .k{position:absolute;left:18px;top:14px;font-family:'Martian Mono',monospace;font-size:9px;letter-spacing:.18em}
      .L-phonepdp .sbar.gt{background:var(--ink);color:var(--bg);border:0}.L-phonepdp .gt .sz span{background:transparent;color:var(--bg);border-color:color-mix(in srgb,var(--bg) 35%,transparent)}.L-phonepdp .gt .sz span.on{background:var(--bg);color:var(--ink)}`,
    html: p => `<div class="phones">
      ${phone('Modemagazin', `${phead()}<div class="mg"><div class="nmb" style="font-size:${fitName(p.name, 300, 86)}px">${p.name}</div><img class="shadow" src="${p.img}" alt=""><p>${desc(p)}</p></div><div class="sbar"><div class="row"><b>${title(p)}</b><span class="price" style="font-size:15px">${eur(p.price)}</span></div>${sizes()}${cta(p)}</div>`)}
      ${phone('Aufstellung', `${phead()}<div class="pt"><h3>${title(p)}</h3><img class="shadow" src="${p.img}" alt="">${pitch('M', { h: true })}</div><div class="sbar"><div class="row"><span class="lab">Aufgestellt: M</span><span class="price" style="font-size:15px">${eur(p.price)}</span></div>${cta(p, 'Aufstellen')}${ship()}</div>`)}
      ${phone('Drehkreuz', `${phead()}<div class="gt"><div class="po"><span class="k">HEIMSPIEL</span><h3>${p.name}<br><em>${p.code}</em></h3><img class="shadow" src="${p.img}" alt=""></div></div><div class="sbar gt">${sizes()}<div class="row"><span class="price" style="font-size:18px">${eur(p.price)}</span><span class="lab" style="color:inherit;opacity:.7">ca. 3 Werktage</span></div>${cta(p, 'Einlass →')}</div>`)}
    </div>` },
};
const pick2 = (list, keys, fam) => keys.map(k => ({ ...list.find(l => l.key === k), fam }));
const PDP3 = [
  PDP3_NEW.mgate, ...pick2(PDP2, ['mclassic'], 'Original aus Runde 2'), PDP3_NEW.mlineup, PDP3_NEW.mseat, PDP3_NEW.mlook,
  ...pick2(PDP2, ['tgate'], 'Original aus Runde 2'), PDP3_NEW.glineup, PDP3_NEW.gseat,
  ...pick2(PDP2, ['pteam'], 'Original aus Runde 2'), PDP3_NEW.lineupbig, ...pick2(PDP2, ['tseat'], 'Original aus Runde 2'), PDP3_NEW.stadium,
  PDP3_NEW.phonepdp,
];

/* ================================================================ shop page */
const filters3 = () => `<div><h4>Art</h4><label><i class="on"></i>Städte (2)</label><label><i class="on"></i>Länder (3)</label></div><div><h4>Größe</h4><div class="chips"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div></div><div><h4>Preis</h4><label><i></i>bis 55 €</label><label><i></i>bis 65 €</label></div>`;
const filtersCSS = k => `.S-${k} .wrap{display:grid;grid-template-columns:230px 1fr;gap:40px;padding:34px 50px}.S-${k} .f{display:grid;gap:22px;align-content:start}.S-${k} .f h4{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.08em}
  .S-${k} .f label{display:flex;gap:10px;align-items:center;font-size:14px;padding:4px 0}.S-${k} .f label i{width:16px;height:16px;border:1.5px solid var(--ink)}.S-${k} .f label i.on{background:var(--ink)}
  .S-${k} .top2{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}`;
const chipsBar = (n = 5) => `<div class="fl"><div class="chips"><span class="on">Alle</span><span>Städte (2)</span><span>Länder (3)</span></div><span class="sep"></span><div class="chips"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div><span class="desc" style="margin-left:auto">${n} Trikots · Neu zuerst ▾</span></div>`;
const chipsCSS = k => `.S-${k} .hd2{display:flex;align-items:flex-end;justify-content:space-between;padding:44px 60px 18px}.S-${k} h2{font-size:80px}
  .S-${k} .fl{display:flex;align-items:center;gap:22px;padding:0 60px 24px;border-bottom:1px solid var(--line);margin-bottom:28px}.S-${k} .fl .sep{width:1px;height:28px;background:var(--line)}
  .S-${k} .promo{background:var(--ink);color:var(--bg);display:grid;align-content:center;gap:14px;padding:34px;border-radius:var(--r)}.S-${k} .promo h3{font-size:46px}.S-${k} .promo p{opacity:.75;font-size:14px;line-height:1.5}`;
const promo = () => `<div class="promo"><span class="eyebrow" style="color:inherit;opacity:.7">Versand</span><h3>Zwei Trikots, Versand gratis</h3><p>Ab 90 € liefern wir in Deutschland versandkostenfrei. Mit zwei Trikots bist du immer drüber.</p></div>`;
const trustRow = (m = '0 60px') => `<div class="trustrow" style="margin:${m}"><div><b>ca. 3 Werktage</b>Lieferung in Deutschland</div><div><b>ab 90 € gratis</b>Versand in Deutschland</div><div><b>14 Tage</b>Rückgabe</div><div><b>Rückversand</b>kostenlos</div></div>`;
const hangerSVG = `<svg viewBox="0 0 200 70" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><path d="M100 32c0-8 12-9 12-18a12 12 0 1 0-24 0"/><path d="M100 32 10 64h180z"/></svg>`;

const SHOP3_NEW = {
  classiccards: { key: 'classiccards', fam: 'Mischung', name: 'Klassisch + Spielerkarten', idea: 'Der klassische Aufbau mit Filtern links, im Raster aber die Spielerkarten statt normaler Produktbilder. Unter jeder Karte direkt „In den Warenkorb“.',
    tags: ['Filter links', 'Sammelkarten', 'Schnellkauf', 'Vertraut + auffällig'],
    css: `${filtersCSS('classiccards')}.S-classiccards .g{display:grid;grid-template-columns:repeat(3,1fr);gap:26px 22px}.S-classiccards .it{display:grid;gap:10px}
      .S-classiccards .it .btn{height:40px;font-size:12px;justify-content:center}.S-classiccards .info{border:1.5px dashed var(--line);display:grid;align-content:center;gap:12px;padding:28px}`,
    html: () => `${shopTop()}<div class="wrap"><div class="f"><h2 style="font-size:54px">Trikots</h2>${filters3()}${ship()}</div><div><div class="top2"><span class="desc">5 Trikots in Größe M</span><span class="chips"><span class="on">Neu zuerst</span><span>Preis</span></span></div>
      <div class="g">${PRODUCTS.map(q => `<div class="it">${card3(q, 410)}<span class="btn ghost">In den Warenkorb</span></div>`).join('')}<div class="info"><span class="eyebrow">Hilfe</span><h3 style="font-size:34px">Welche Größe?</h3><p class="desc">Alle Trikots gibt es von S bis XL.</p>${guide()}${trust()}</div></div></div></div>` },

  railcards: { key: 'railcards', fam: 'Mischung', name: 'Reihe + Spielerkarten', idea: 'Die horizontale Reihe mit den großen Nummern, darin aber die Spielerkarten. Auf dem Handy wischt man durch die Karten wie durch ein Sammelalbum.',
    tags: ['Wie die Kleiderstange', 'Sammelkarten', 'Wischen', 'Große Nummern'],
    css: `.S-railcards .hd2{display:flex;align-items:flex-end;justify-content:space-between;padding:50px 60px 24px}.S-railcards h2{font-size:90px}
      .S-railcards .strip{display:flex;gap:30px;padding:56px 60px 0;overflow:hidden}.S-railcards .it{flex:none;width:340px;display:grid;gap:12px;position:relative}
      .S-railcards .it .n{position:absolute;left:-10px;top:-60px;font-size:140px;font-weight:900;font-stretch:62%;opacity:.09;line-height:1}.S-railcards .cd3{position:relative}
      .S-railcards .arr{display:flex;gap:10px}.S-railcards .arr span{width:54px;height:54px;border:1.5px solid var(--ink);display:grid;place-items:center;font-size:22px}
      .S-railcards .prog{margin:34px 60px;height:3px;background:var(--line)}.S-railcards .prog i{display:block;width:60%;height:100%;background:var(--ink)}`,
    html: () => `${shopTop()}<div class="hd2"><div><span class="eyebrow">Die Kollektion · 5 Karten</span><h2>Deine Karten</h2></div><div class="arr"><span>←</span><span>→</span></div></div>
      <div class="strip">${PRODUCTS.map((q, i) => `<div class="it"><span class="n">0${i + 1}</span>${card3(q, 500)}<div class="row"><span class="price" style="font-size:15px">${eur(q.price)}</span><span class="btn ghost" style="height:42px">In den Warenkorb</span></div></div>`).join('')}</div>
      <div class="prog"><i></i></div>${trustRow()}` },

  classicnum: { key: 'classicnum', fam: 'Mischung', name: 'Klassisch + große Nummern', idea: 'Der klassische Shop, aber jedes Trikot bekommt eine große, blasse Nummer hinter sich wie in der horizontalen Reihe. Ruhig und trotzdem mit Charakter.',
    tags: ['Filter links', 'Große Nummern', 'Schnellkauf', 'Ruhig'],
    css: `${filtersCSS('classicnum')}.S-classicnum .g{display:grid;grid-template-columns:repeat(3,1fr);gap:30px 22px}.S-classicnum .it{display:grid;gap:8px}
      .S-classicnum .it .ph{position:relative;height:370px;background:var(--surf2);display:grid;place-items:center;overflow:hidden;border-radius:var(--r)}.S-classicnum .it .ph img{position:relative;width:80%;height:84%;object-fit:contain}
      .S-classicnum .it .n{position:absolute;left:10px;top:-14px;font-size:190px;font-weight:900;font-stretch:62%;line-height:1;opacity:.09}
      .S-classicnum .it .qa{position:absolute;left:10px;right:10px;bottom:10px;height:40px;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-stretch:80%;border-radius:var(--r)}`,
    html: () => `${shopTop()}<div class="wrap"><div class="f"><h2 style="font-size:54px">Trikots</h2>${filters3()}${ship()}</div><div><div class="top2"><span class="desc">5 Trikots in Größe M</span><span class="chips"><span class="on">Neu zuerst</span><span>Preis</span></span></div>
      <div class="g">${PRODUCTS.map((q, i) => `<div class="it"><div class="ph"><span class="n">0${i + 1}</span><img src="${q.img}" alt="">${i === 0 ? '<span class="qa">+ Schnell in den Warenkorb</span>' : ''}</div><div class="row"><b>${nm(q)} Trikot</b><span class="price" style="font-size:14px">${eur(q.price)}</span></div></div>`).join('')}
      <div style="border:1.5px dashed var(--line);display:grid;align-content:center;gap:12px;padding:28px"><h3 style="font-size:34px">Welche Größe?</h3><p class="desc">Alle Trikots von S bis XL.</p>${guide()}</div></div></div></div>` },

  chipgrid: { key: 'chipgrid', fam: 'Mischung', name: 'Klassisch, Filter oben', idea: 'Kritisch gesehen: Für fünf Trikots ist eine Filterspalte zu viel. Hier stehen die Filter als Knöpfe oben, das Raster bekommt die ganze Breite und größere Bilder. Wächst trotzdem mit.',
    tags: ['Filter als Knöpfe', 'Größere Bilder', 'Schnellkauf', 'Gratis-Versand-Kachel'],
    css: `${chipsCSS('chipgrid')}.S-chipgrid .g{display:grid;grid-template-columns:repeat(3,1fr);gap:30px 26px;padding:0 60px}`,
    html: () => `${shopTop()}<div class="hd2"><div><span class="eyebrow">Die Kollektion</span><h2>Trikots</h2></div>${ship()}</div>${chipsBar()}
      <div class="g">${PRODUCTS.map((q, i) => pcard(q, 380, { badge: i < 2 ? 'Neu' : '', qa: i === 0 })).join('')}${promo()}</div>` },

  hanger: { key: 'hanger', fam: 'Mischung', name: 'An der Kleiderstange', idea: 'Die horizontale Reihe als echte Stange: die Trikots hängen auf Bügeln, an jedem baumelt ein Preisschild mit „+“. Verbindet den Shop direkt mit der Stange im Zimmer.',
    tags: ['Wie im Zimmer', 'Preisschilder', 'Wischen', 'Große Nummern'],
    css: `.S-hanger .hd2{display:flex;align-items:flex-end;justify-content:space-between;padding:50px 60px 10px}.S-hanger h2{font-size:90px}
      .S-hanger .arr{display:flex;gap:10px}.S-hanger .arr span{width:54px;height:54px;border:1.5px solid var(--ink);display:grid;place-items:center;font-size:22px}
      .S-hanger .pole{position:relative;margin-top:40px;height:640px;overflow:hidden}.S-hanger .pole::before{content:"";position:absolute;left:30px;right:30px;top:20px;height:8px;border-radius:4px;background:linear-gradient(#a3a3a3,#5a5a5a);z-index:2}
      .S-hanger .row3{position:absolute;left:50px;top:0;display:flex;gap:40px}.S-hanger .hg{position:relative;width:300px;height:620px}
      .S-hanger .hg svg{position:absolute;left:50%;top:6px;width:190px;translate:-50% 0;color:#6a6a6a;z-index:3}
      .S-hanger .hg img{position:absolute;left:50%;top:54px;width:300px;height:360px;object-fit:contain;translate:-50% 0}
      .S-hanger .hg .n{position:absolute;left:-4px;top:330px;font-size:120px;font-weight:900;font-stretch:62%;opacity:.09;line-height:1}
      .S-hanger .tag{position:absolute;right:12px;top:330px;width:140px;background:var(--surf);border:1px solid var(--line);padding:12px 14px 14px;rotate:6deg;display:grid;gap:4px;font-size:13px;box-shadow:0 8px 16px rgb(0 0 0/.1);z-index:2}
      .S-hanger .tag::before{content:"";position:absolute;left:50%;top:-44px;height:44px;border-left:1.5px solid var(--mut)}.S-hanger .tag::after{content:"";position:absolute;left:50%;top:6px;width:8px;height:8px;margin-left:-4px;border-radius:50%;border:1.5px solid var(--mut)}
      .S-hanger .tag .plus{white-space:nowrap;justify-self:start;margin-top:4px;padding:6px 10px;background:var(--acc);color:var(--accInk);font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
      .S-hanger .hg .nm2{position:absolute;left:0;right:0;top:450px;text-align:center;font-weight:800;font-stretch:70%;text-transform:uppercase;font-size:24px}
      .S-hanger .prog{margin:0 60px 30px;height:3px;background:var(--line)}.S-hanger .prog i{display:block;width:55%;height:100%;background:var(--ink)}`,
    html: () => `${shopTop()}<div class="hd2"><div><span class="eyebrow">Die Stange · 5 Trikots</span><h2>Frisch aufgehängt</h2></div><div class="arr"><span>←</span><span>→</span></div></div>
      <div class="pole"><div class="row3">${PRODUCTS.map((q, i) => `<div class="hg">${hangerSVG}<img class="shadow" src="${q.img}" alt=""><span class="n">0${i + 1}</span><div class="tag"><b>${nm(q)}</b><span class="price" style="font-size:14px">${eur(q.price)}</span><span class="plus">+ Warenkorb</span></div><div class="nm2">${nm(q)}</div></div>`).join('')}</div></div>
      <div class="prog"><i></i></div>${trustRow()}` },

  tworails: { key: 'tworails', fam: 'Mischung', name: 'Zwei Reihen: Städte und Länder', idea: 'Zwei horizontale Reihen untereinander: oben die Städte groß, darunter die Länder. Klar getrennt, jede Reihe kann später wachsen und seitlich wischen.',
    tags: ['Klar sortiert', 'Große Nummern', 'Wächst mit', 'Wischen'],
    css: `.S-tworails .sec{padding:34px 60px 6px}.S-tworails .sh{display:flex;align-items:baseline;gap:18px;margin-bottom:18px}.S-tworails .sh h2{font-size:70px}
      .S-tworails .rw{display:flex;gap:26px}.S-tworails .it{display:grid;gap:10px}.S-tworails .it .ph{position:relative;background:var(--surf2);display:grid;place-items:center;overflow:hidden;border-radius:var(--r)}
      .S-tworails .it .ph img{position:relative}.S-tworails .it .n{position:absolute;left:14px;top:-16px;font-size:170px;font-weight:900;font-stretch:62%;opacity:.09;line-height:1}`,
    html: () => {
      const it = (q, i, w, h) => `<div class="it" style="width:${w}px"><div class="ph" style="height:${h}px"><span class="n">0${i + 1}</span><img class="shadow" src="${q.img}" alt="" style="height:${Math.round(h * 0.86)}px"></div><div class="row"><b>${nm(q)} Trikot</b><span class="row" style="gap:14px"><span class="price" style="font-size:14px">${eur(q.price)}</span><span class="guide">+ Warenkorb</span></span></div></div>`;
      return `${shopTop()}<div class="sec"><div class="sh"><h2>Städte</h2><span class="lab">2 Trikots · Polokragen</span></div><div class="rw">${PRODUCTS.filter(q => q.city).map((q, i) => it(q, i, 567, 320)).join('')}</div></div>
        <div class="sec"><div class="sh"><h2>Länder</h2><span class="lab">3 Trikots · Retro-Schnitt</span></div><div class="rw">${PRODUCTS.filter(q => !q.city).map((q, i) => it(q, i + 2, 369, 260)).join('')}</div></div><div style="height:30px"></div>${trustRow()}`;
    } },

  album: { key: 'album', fam: 'Mischung', name: 'Sammelalbum', idea: 'Die Spielerkarten kleben wie Sticker auf einer Albumseite, leicht schief. Unter jeder Karte Preis und Warenkorb. Der leere Platz fragt, welches Trikot ihr euch wünscht.',
    tags: ['Sammelkarten', 'Nostalgie', 'Wunsch-Feld', 'Junge Zielgruppe'],
    css: `.m.S-album{background:var(--surf2)}.S-album .pg{margin:34px 70px;background:var(--surf);padding:36px 50px 40px;box-shadow:0 20px 50px rgb(0 0 0/.12)}
      .S-album .hd3{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:26px}.S-album h2{font-size:72px}
      .S-album .g{display:grid;grid-template-columns:repeat(3,1fr);gap:30px 40px;justify-items:center}.S-album .slot{display:grid;gap:12px;width:250px}
      .S-album .wr{filter:drop-shadow(0 8px 10px rgb(0 0 0/.18))}.S-album .empty{width:250px;height:340px;border:2px dashed var(--line);display:grid;align-content:center;justify-items:center;text-align:center;gap:10px;padding:20px}`,
    html: () => `${shopTop()}<div class="pg"><div class="hd3"><div><span class="eyebrow">Album · Seite 1</span><h2>Städte und Länder</h2></div>${ship()}</div>
      <div class="g">${PRODUCTS.map((q, i) => `<div class="slot"><div class="wr" style="rotate:${[-2.5, 1.8, -1.2, 2.4, -2][i]}deg">${card3(q, 340)}</div><div class="row"><span class="price" style="font-size:14px">${eur(q.price)}</span><span class="guide">In den Warenkorb</span></div></div>`).join('')}
      <div class="slot"><div class="empty"><b style="font-size:20px">Dein Trikot fehlt?</b><p class="desc">Schreib uns, welche Stadt oder welches Land du dir wünschst.</p><span class="guide">Wunsch schicken</span></div></div></div></div>` },

  cardflip: { key: 'cardflip', fam: 'Mischung', name: 'Spielerkarten mit Rückseite', idea: 'Die Spielerkarten aus Runde 2. Fährt man drüber oder tippt drauf, dreht sich die Karte um: hinten Größe und Warenkorb. Kaufen ohne die Seite zu wechseln.',
    tags: ['Sammelkarten', 'Kaufen auf der Karte', 'Spielerisch', 'Schnell'],
    css: `.S-cardflip h2{font-size:90px;padding:46px 50px 0}.S-cardflip .g{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;padding:46px 50px 34px}
      .S-cardflip .bk{height:430px;clip-path:polygon(50% 0,100% 7%,100% 93%,50% 100%,0 93%,0 7%);background:var(--ink);color:var(--bg);padding:40px 18px;display:grid;align-content:center;justify-items:center;gap:14px;text-align:center}
      .S-cardflip .bk b{font-size:28px;font-weight:900;font-stretch:62%;text-transform:uppercase}.S-cardflip .bk .sz{gap:4px}
      .S-cardflip .bk .sz span{min-width:0;width:40px;height:36px;padding:0;background:transparent;color:var(--bg);border-color:color-mix(in srgb,var(--bg) 40%,transparent);font-size:12px}.S-cardflip .bk .sz span.on{background:var(--bg);color:var(--ink)}
      .S-cardflip .bk .btn{height:40px;font-size:12px;padding:0 12px}.S-cardflip .hint2{display:flex;justify-content:center;gap:30px;align-items:center;padding-bottom:34px}`,
    html: () => `${shopTop()}<h2>Dreh die Karte um</h2><div class="g">${PRODUCTS.map((q, i) => i === 1 ? `<div class="bk"><span class="lab" style="color:inherit;opacity:.7">Rückseite</span><b>${nm(q)}</b><span class="price" style="font-size:16px">${eur(q.price)}</span>${sizes()}<span class="btn">+ Warenkorb</span><span class="lab" style="color:inherit;opacity:.7">ca. 3 Werktage</span></div>` : card3(q, 430)).join('')}</div>
      <div class="hint2"><span class="lab">Drüberfahren oder antippen dreht die Karte</span>${ship()}</div>${trustRow('0 50px')}` },

  quicksize: { key: 'quicksize', fam: 'Mischung', name: 'Größe direkt auf der Karte', idea: 'Wie der klassische Shop mit Filtern oben, aber unter jedem Trikot stehen die Größen als Knöpfe. Ein Tipp auf die Größe legt es in den Warenkorb: ein Schritt weniger.',
    tags: ['Ein Klick weniger', 'Filter als Knöpfe', 'Größen sichtbar', 'Gratis-Versand-Kachel'],
    css: `${chipsCSS('quicksize')}.S-quicksize .g{display:grid;grid-template-columns:repeat(3,1fr);gap:30px 26px;padding:0 60px}.S-quicksize .it{display:grid;gap:10px}
      .S-quicksize .it .ph{height:320px;background:var(--surf2);display:grid;place-items:center;border-radius:var(--r)}.S-quicksize .it .ph img{width:78%;height:86%;object-fit:contain}
      .S-quicksize .qs{display:grid;grid-template-columns:repeat(4,1fr) 1.6fr;gap:6px}.S-quicksize .qs span{height:38px;border:1.5px solid var(--line);display:grid;place-items:center;font-weight:700;font-size:13px;border-radius:var(--r)}
      .S-quicksize .qs span.on{border-color:var(--ink);background:var(--ink);color:var(--bg)}.S-quicksize .qs span.add{background:var(--acc);border-color:var(--acc);color:var(--accInk);font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:800}`,
    html: () => `${shopTop()}<div class="hd2"><div><span class="eyebrow">Die Kollektion</span><h2>Trikots</h2></div>${ship()}</div>${chipsBar()}
      <div class="g">${PRODUCTS.map((q, i) => `<div class="it"><div class="ph"><img src="${q.img}" alt=""></div><div class="row"><b>${nm(q)} Trikot</b><span class="price" style="font-size:14px">${eur(q.price)}</span></div><div class="qs">${['S', 'M', 'L', 'XL'].map(s => `<span class="${i === 0 && s === 'M' ? 'on' : ''}">${s}</span>`).join('')}<span class="add">+ Warenkorb</span></div></div>`).join('')}${promo()}</div>` },

  phoneshop: { key: 'phoneshop', fam: 'Handy', name: 'Auf dem Handy', idea: 'So sähen die Shop-Favoriten auf dem Handy aus: Klassisch mit Filterknöpfen, die Reihe mit Spielerkarten zum Wischen und die Größen direkt auf der Karte.',
    tags: ['Handy', 'Vergleich', 'Wischen', 'Ein Klick weniger'],
    css: `.S-phoneshop .phones{gap:24px}.S-phoneshop .phw{zoom:1.22}.S-phoneshop .ph3 h3{font-size:34px;padding:14px 16px 10px}.S-phoneshop .ph3 .chips{padding:0 16px 12px;gap:6px}.S-phoneshop .ph3 .chips span{padding:6px 10px;font-size:11px}
      .S-phoneshop .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px 12px;padding:0 16px}.S-phoneshop .g2 .pc .ph{height:160px !important}.S-phoneshop .g2 .pc .nm{font-size:11px;flex-direction:column;gap:2px}
      .S-phoneshop .g2 .pc .qa{height:30px;font-size:9px;left:6px;right:6px;bottom:6px}
      .S-phoneshop .rl{display:flex;gap:14px;padding:30px 16px 14px;overflow:hidden}.S-phoneshop .rl .cd3{flex:none;width:220px;padding:24px 14px 28px}.S-phoneshop .rl .cd3 b{font-size:20px}
      .S-phoneshop .prog{margin:4px 16px 16px;height:3px;background:var(--line)}.S-phoneshop .prog i{display:block;width:30%;height:100%;background:var(--ink)}
      .S-phoneshop .q2{display:grid;gap:6px}.S-phoneshop .q2 .ph{height:140px;background:var(--surf2);display:grid;place-items:center}.S-phoneshop .q2 .ph img{height:120px}
      .S-phoneshop .q2 b{font-size:11px}.S-phoneshop .q2 .qs{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}.S-phoneshop .q2 .qs span{height:26px;border:1.5px solid var(--line);display:grid;place-items:center;font-size:10px;font-weight:700}
      .S-phoneshop .q2 .qs span.on{background:var(--acc);border-color:var(--acc);color:var(--accInk)}`,
    html: () => `<div class="phones">
      ${phone('Klassisch, Filter oben', `${phead()}<h3>Trikots</h3><div class="chips"><span class="on">Alle</span><span>Städte</span><span>Länder</span><span>M</span></div><div class="g2">${PRODUCTS.slice(0, 4).map((q, i) => pcard(q, 160, { qa: i === 0 })).join('')}</div>`)}
      ${phone('Reihe mit Karten', `${phead()}<h3>Deine Karten</h3><div class="rl">${PRODUCTS.slice(0, 3).map(q => card3(q, 330)).join('')}</div><div class="prog"><i></i></div><div style="padding:0 16px;display:grid;gap:10px"><span class="btn" style="justify-content:center">In den Warenkorb</span>${ship()}</div>`)}
      ${phone('Größe auf der Karte', `${phead()}<h3>Trikots</h3><div class="chips"><span class="on">Alle</span><span>Städte</span><span>Länder</span></div><div class="g2">${PRODUCTS.slice(0, 4).map((q, i) => `<div class="q2"><div class="ph"><img src="${q.img}" alt=""></div><b>${nm(q)} · ${eur(q.price)}</b><div class="qs">${['S', 'M', 'L', 'XL'].map(s => `<span class="${i === 1 && s === 'L' ? 'on' : ''}">${s}</span>`).join('')}</div></div>`).join('')}</div>`)}
    </div>` },
};
const SHOP3 = [
  SHOP3_NEW.classiccards, ...pick2(SHOP2, ['classic'], 'Original aus Runde 2'), SHOP3_NEW.chipgrid, SHOP3_NEW.quicksize, SHOP3_NEW.classicnum,
  ...pick2(SHOP2, ['hrail'], 'Original aus Runde 2'), SHOP3_NEW.hanger, SHOP3_NEW.tworails, SHOP3_NEW.railcards,
  ...pick2(SHOP2, ['cards'], 'Original aus Runde 2'), SHOP3_NEW.cardflip, SHOP3_NEW.album,
  SHOP3_NEW.phoneshop,
];

/* ================================================================ animation (live demos, one loop = 4.5 s) */
const cur = (x, y, click) => `<i class="cur${click ? ' ck' : ''}" style="--x:${x}px;--y:${y}px"></i>${click ? `<i class="rip" style="left:${x + 6}px;top:${y + 3}px"></i>` : ''}`;
const hdr3 = (n = 1) => `<header class="hd"><img class="logo" src="${logo(false)}" alt="Azur"><nav><span>Trikots</span><span>Drops</span><span>Magazin</span><span>Über uns</span></nav><div class="hd-r"><span>Suche</span><span>Konto</span><span class="bag">Warenkorb <b class="cnt"><i>${n}</i><i>${n + 1}</i></b></span></div></header>`;
const grid3 = (o = {}) => `${hdr3(1)}${o.top || ''}<div class="sc3"${o.style ? ` style="${o.style}"` : ''}>${PRODUCTS.slice(0, 3).map((q, i) => (o.card ? o.card(q, i) : pcard(q, o.h || 340, { qa: o.qa && i === 1, badge: i === 0 ? 'Neu' : '' }))).join('')}</div>`;
const buy = (p, o = {}) => `${hdr3(o.n ?? 0)}<div class="bp"><div class="bi">${o.img || `<img class="shadow" src="${p.img}" alt="">`}</div><div class="br"><span class="eyebrow">Trikot · ${p.city ? 'Städte' : 'Länder'}</span><h2>${title(p)}</h2><span class="price">${eur(p.price)}</span>${o.pick ?? sizes()}${o.cta ?? cta(p)}${o.extra || ''}${ship()}</div></div>`;
const CTA_AT = [1044, 344];
const flap = txt => `<div class="fb">${[...txt].map((ch, i) => { const r = 'AZURBX0469KMTSLE'; const col = [r[(i * 3) % 16], r[(i * 7 + 2) % 16], r[(i * 5 + 5) % 16], ch === ' ' ? '&nbsp;' : ch]; return `<span class="tl"><span class="cl" style="animation-delay:${(i * 0.05).toFixed(2)}s">${col.map(c => `<i>${c}</i>`).join('')}</span></span>`; }).join('')}</div>`;
const MSGS = ['Versand in Deutschland ca. 3 Werktage', 'Ab 90 € versandkostenfrei', '14 Tage Rückgabe', 'Kostenloser Rückversand'];

const ABASE = `
.m.anim{height:800px;background:var(--bg)}.anim .sc3{position:absolute;left:0;right:0;top:130px;display:grid;grid-template-columns:repeat(3,300px);justify-content:center;gap:40px}
.m.anim .cur{position:absolute;left:0;top:0;width:30px;height:30px;z-index:30;pointer-events:none;transform:translate(1180px,760px);animation:a-hover 4.5s infinite;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 2.5l13 10-6 1 3.5 7-2.6 1.3-3.5-7L5 19.5z' fill='%23111' stroke='%23fff' stroke-width='1.6' stroke-linejoin='round'/%3E%3C/svg%3E") 0 0/contain no-repeat}
.m.anim .cur.ck{animation-name:a-click}.m.anim .rip{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:var(--ink);opacity:0;z-index:29;pointer-events:none;animation:a-rip 4.5s infinite}
@keyframes a-hover{0%{transform:translate(1180px,760px)}22%,72%{transform:translate(var(--x),var(--y))}92%,100%{transform:translate(1180px,760px)}}
@keyframes a-click{0%{transform:translate(1180px,760px)}22%{transform:translate(var(--x),var(--y))}25%{transform:translate(var(--x),var(--y)) scale(.8)}28%,72%{transform:translate(var(--x),var(--y))}92%,100%{transform:translate(1180px,760px)}}
@keyframes a-rip{0%,24%{opacity:0;transform:scale(.2)}26%{opacity:.3}36%,100%{opacity:0;transform:scale(1.5)}}
@keyframes a-out{0%,26%{opacity:1}30%,76%{opacity:0}82%,100%{opacity:1}}
@keyframes a-in{0%,30%{opacity:0;transform:translateY(6px)}34%,74%{opacity:1;transform:none}78%,100%{opacity:0;transform:none}}
@keyframes a-stg{0%,8%{opacity:0;transform:translateY(28px)}20%,82%{opacity:1;transform:none}92%,100%{opacity:0;transform:none}}
@keyframes a-mq{to{transform:translateX(-50%)}}
.m.anim .bp{position:absolute;left:0;right:0;top:54px;bottom:0;display:grid;grid-template-columns:1fr 460px}
.m.anim .bp .bi{position:relative;display:grid;place-items:center;background:var(--surf2);overflow:hidden}.m.anim .bp .bi>img{height:560px}
.m.anim .bp .br{padding:60px 50px;display:flex;flex-direction:column;gap:18px}.m.anim .bp h2{font-size:56px}
.m.anim .hd .bag b.cnt{display:block;overflow:hidden;line-height:20px;text-align:center;padding:0 6px}.m.anim .hd .bag b.cnt i{display:block;font-style:normal;height:20px}
.m.anim .swap{display:grid}.m.anim .swap>span{grid-area:1/1}.m.anim .swap .o1{animation:a-out 4.5s infinite}.m.anim .swap .o2{opacity:0;animation:a-in 4.5s infinite}
`;

const ANIM3 = [
  { key: 'lift', fam: 'Produktkarte', name: 'Leicht anheben', idea: 'Fährt man über ein Trikot, hebt sich das Bild ein paar Pixel und bekommt Schatten. Ruhig und bewährt, in einer Viertelsekunde.',
    tags: ['Drüberfahren', 'Dezent', 'Standard', '0,25 s'],
    css: `.A-lift .sc3 .pc:nth-child(2) .ph{animation:a-lift 4.5s infinite}@keyframes a-lift{0%,22%{transform:none;box-shadow:0 0 0 rgb(0 0 0/0)}28%,72%{transform:translateY(-8px);box-shadow:0 22px 34px rgb(0 0 0/.18)}78%,100%{transform:none;box-shadow:0 0 0 rgb(0 0 0/0)}}`,
    html: () => `${grid3()}${cur(634, 297)}` },
  { key: 'swing', fam: 'Produktkarte', name: 'Schwingt am Bügel', idea: 'Wie an der Kleiderstange im Zimmer: das Trikot schwingt kurz am Bügel, wenn man drüberfährt, und kommt zur Ruhe. Verbindet Shop und Zimmer.',
    tags: ['Drüberfahren', 'Wie im Zimmer', 'Verspielt', '1 s'],
    css: `.A-swing .sc3 .pc .ph::before{content:"";position:absolute;top:8px;left:50%;width:16px;height:16px;margin-left:-8px;border:2.5px solid var(--mut);border-bottom-color:transparent;border-left-color:transparent;border-radius:50%;rotate:-45deg}
      .A-swing .sc3 .pc:nth-child(2) .ph img{transform-origin:50% 0;animation:a-swing 4.5s infinite}
      @keyframes a-swing{0%,22%{rotate:0deg}30%{rotate:5deg}39%{rotate:-3.5deg}48%{rotate:2.2deg}57%{rotate:-1.2deg}65%{rotate:.5deg}72%,100%{rotate:0deg}}`,
    html: () => `${grid3()}${cur(634, 297)}` },
  { key: 'flip', fam: 'Produktkarte', name: 'Karte dreht sich um', idea: 'Die Karte dreht sich beim Drüberfahren (auf dem Handy beim Antippen) und zeigt hinten Größe und Warenkorb. Passt zu den Spielerkarten.',
    tags: ['Drüberfahren', 'Kaufen auf der Karte', 'Spielerkarten', '0,4 s'],
    css: `.A-flip .fl{perspective:1400px;display:grid;gap:8px}.A-flip .fl .in{position:relative;height:340px;transform-style:preserve-3d;animation:a-flip 4.5s infinite}
      .A-flip .fl .fr,.A-flip .fl .bk{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
      .A-flip .fl .bk{transform:rotateY(180deg);background:var(--ink);color:var(--bg);border-radius:var(--r);display:grid;align-content:center;justify-items:center;gap:16px;padding:20px}
      .A-flip .fl .bk b{font-size:30px;font-weight:900;font-stretch:62%;text-transform:uppercase}.A-flip .fl .bk .sz span{min-width:44px;background:transparent;color:var(--bg);border-color:color-mix(in srgb,var(--bg) 40%,transparent)}.A-flip .fl .bk .sz span.on{background:var(--bg);color:var(--ink)}
      @keyframes a-flip{0%,22%{transform:rotateY(0)}32%,72%{transform:rotateY(180deg)}82%,100%{transform:rotateY(0)}}`,
    html: () => `${grid3({ card: (q, i) => i === 1 ? `<div class="pc fl"><div class="in"><div class="ph fr"><img src="${q.img}" alt=""></div><div class="bk"><b>${nm(q)}</b>${sizes()}<span class="btn">+ In den Warenkorb</span><span class="lab" style="color:inherit;opacity:.7">ca. 3 Werktage</span></div></div><div class="nm"><span>${nm(q)} Trikot</span><span>${eur(q.price)}</span></div></div>` : pcard(q, 340) })}${cur(634, 297)}` },
  { key: 'zoom', fam: 'Produktkarte', name: 'Bild zoomt hinein', idea: 'Beim Drüberfahren zoomt das Bild sanft ins Trikot, der Rahmen bleibt gleich. Man sieht Stoff und Details etwas näher.',
    tags: ['Drüberfahren', 'Details', 'Dezent', '0,3 s'],
    css: `.A-zoom .sc3 .pc:nth-child(2) .ph img{animation:a-zoom 4.5s infinite}@keyframes a-zoom{0%,22%{scale:1}30%,72%{scale:1.13}80%,100%{scale:1}}`,
    html: () => `${grid3()}${cur(634, 297)}` },
  { key: 'qa', fam: 'Produktkarte', name: 'Schnellkauf fährt hoch', idea: 'Beim Drüberfahren gleitet unten im Bild eine Leiste „Schnell in den Warenkorb“ hoch. Kaufen, ohne die Produktseite zu öffnen.',
    tags: ['Drüberfahren', 'Schnellkauf', 'Bewährt', '0,25 s'],
    css: `.A-qa .sc3 .pc:nth-child(2) .qa{animation:a-qa 4.5s infinite}@keyframes a-qa{0%,22%{transform:translateY(64px);opacity:0}28%,72%{transform:none;opacity:1}78%,100%{transform:translateY(64px);opacity:0}}`,
    html: () => `${grid3({ qa: true })}${cur(634, 297)}` },

  { key: 'fly', fam: 'Kaufen', name: 'Fliegt in den Warenkorb', idea: 'Nach dem Klick fliegt ein kleines Bild des Trikots im Bogen zum Warenkorb oben rechts, die Zahl springt auf 1. Man sieht sofort, wo es gelandet ist.',
    tags: ['Klick auf Kaufen', 'Klare Rückmeldung', 'Bekannt', '0,6 s'],
    css: `.A-fly .flyer{position:absolute;left:142px;top:147px;width:536px;height:560px;object-fit:contain;transform-origin:0 0;opacity:0;z-index:25;animation:a-fly 4.5s infinite}
      @keyframes a-fly{0%,26%{opacity:0;transform:none}27%{opacity:1;transform:none}40%{opacity:1;transform:translate(520px,-110px) scale(.32)}52%{opacity:.9;transform:translate(1076px,-131px) scale(.045)}54%,100%{opacity:0;transform:translate(1076px,-131px) scale(.045)}}
      .A-fly .hd .bag b.cnt i{animation:a-cnt 4.5s infinite}@keyframes a-cnt{0%,52%{transform:none}55%,92%{transform:translateY(-20px)}96%,100%{transform:none}}
      .A-fly .hd .bag b.cnt{animation:a-bump 4.5s infinite}@keyframes a-bump{0%,52%{scale:1}56%{scale:1.4}61%,100%{scale:1}}`,
    html: p => `${buy(p)}<img class="flyer" src="${p.img}" alt="">${cur(...CTA_AT, true)}` },
  { key: 'check', fam: 'Kaufen', name: 'Knopf wird zum Haken', idea: 'Der Knopf füllt sich kurz und zeigt dann „Im Warenkorb ✓“, darunter erscheint eine Zeile mit „Zur Kasse“. Ruhig, eindeutig, ohne Bewegung quer über die Seite.',
    tags: ['Klick auf Kaufen', 'Ruhig', 'Zur Kasse sichtbar', '0,4 s'],
    css: `.A-check .ck{position:relative;overflow:hidden}.A-check .ck s{position:absolute;inset:0;background:var(--ink);transform:scaleX(0);transform-origin:left;animation:a-ckf 4.5s infinite}
      .A-check .ck>span{position:relative;z-index:1;animation:a-out 4.5s infinite}.A-check .ck .l2{position:absolute;inset:0;display:grid;place-items:center;z-index:2;color:var(--bg);opacity:0;animation:a-in 4.5s infinite}
      @keyframes a-ckf{0%,25%{transform:scaleX(0)}33%,74%{transform:scaleX(1)}80%,100%{transform:scaleX(0)}}
      .A-check .toast{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;background:var(--surf2);font-size:13px;border-radius:var(--r);opacity:0;animation:a-in 4.5s infinite}`,
    html: p => `${buy(p, { cta: `<div class="cta ck"><span>In den Warenkorb</span><span class="cta-p">${eur(p.price)}</span><i class="l2">✓ Im Warenkorb</i><s></s></div>`, extra: `<div class="toast"><span>✓ ${nm(p)} · M liegt im Warenkorb</span><b>Zur Kasse →</b></div>` })}${cur(...CTA_AT, true)}` },
  { key: 'tear', fam: 'Kaufen', name: 'Ticket-Abriss', idea: 'Der Kaufen-Knopf ist ein Ticket. Beim Klick reißt der Abschnitt ab und fällt weg, auf dem Ticket steht „Im Warenkorb“. Passt zu Drehkreuz und Platzwahl.',
    tags: ['Klick auf Kaufen', 'Ticket-Thema', 'Merkt man sich', '0,7 s'],
    css: `.A-tear .tkt{position:relative;display:flex;height:64px}.A-tear .tkt .mn{flex:1;background:var(--acc);color:var(--accInk);display:grid;place-items:center;font-weight:800;text-transform:uppercase;letter-spacing:.05em;font-stretch:75%;font-size:16px;border-radius:var(--r) 0 0 var(--r)}
      .A-tear .tkt .mn>span{grid-area:1/1}.A-tear .tkt .t1{animation:a-out 4.5s infinite}.A-tear .tkt .t2{opacity:0;animation:a-in 4.5s infinite}
      .A-tear .tkt .sb{width:84px;background:var(--acc);color:var(--accInk);border-left:2px dashed color-mix(in srgb,var(--accInk) 60%,transparent);display:grid;place-items:center;text-align:center;font-family:'Martian Mono',monospace;font-size:11px;line-height:1.4;border-radius:0 var(--r) var(--r) 0;transform-origin:0 100%;animation:a-tear 4.5s infinite}
      @keyframes a-tear{0%,25%{transform:none;opacity:1}30%{transform:rotate(9deg);opacity:1}50%{transform:translate(30px,170px) rotate(40deg);opacity:0}51%,84%{opacity:0;transform:none}92%,100%{opacity:1;transform:none}}`,
    html: p => `${buy(p, { cta: `<div class="tkt"><div class="mn"><span class="t1">In den Warenkorb · ${eur(p.price)}</span><span class="t2">✓ Im Warenkorb</span></div><div class="sb">AZUR<br>M</div></div>` })}${cur(1182, 348, true)}` },
  { key: 'stamp', fam: 'Kaufen', name: 'Stempel auf das Trikot', idea: 'Nach dem Klick landet ein runder Stempel „Im Warenkorb“ auf dem Trikotbild, das Bild ruckt kurz wie beim Abstempeln. Wie ein Eintrittsstempel.',
    tags: ['Klick auf Kaufen', 'Stadion-Gefühl', 'Auffällig', '0,3 s'],
    css: `.A-stamp .bi>img{animation:a-shake 4.5s infinite}@keyframes a-shake{0%,30%{transform:none}31.5%{transform:translate(2px,3px)}33%,100%{transform:none}}
      .A-stamp .stp{position:absolute;left:50%;top:50%;width:250px;height:250px;margin:-125px 0 0 -125px;border:7px double var(--acc);color:var(--acc);border-radius:50%;display:grid;place-content:center;text-align:center;gap:8px;font-weight:900;font-stretch:62%;text-transform:uppercase;font-size:42px;line-height:.9;opacity:0;rotate:-14deg;animation:a-stamp 4.5s infinite;background:color-mix(in srgb,var(--surf) 88%,transparent);box-shadow:0 10px 30px rgb(0 0 0/.25)}
      .A-stamp .stp small{font-family:'Martian Mono',monospace;font-size:12px;letter-spacing:.2em;font-weight:600}
      @keyframes a-stamp{0%,26%{opacity:0;transform:scale(1.8)}31%{opacity:1;transform:scale(.94)}34%,74%{opacity:1;transform:scale(1)}82%,100%{opacity:0;transform:scale(1)}}`,
    html: p => `${buy(p, { img: `<img class="shadow" src="${p.img}" alt=""><div class="stp"><span>Im<br>Warenkorb</span><small>★ AZUR ★</small></div>` })}${cur(...CTA_AT, true)}` },
  { key: 'drawer', fam: 'Kaufen', name: 'Warenkorb gleitet herein', idea: 'Nach dem Klick gleitet rechts der Warenkorb herein: das Trikot, wie viel bis zum Gratis-Versand fehlt (Balken füllt sich) und „Zur Kasse“. Man kann sofort weiter.',
    tags: ['Klick auf Kaufen', 'Gratis-Versand-Balken', 'Zur Kasse', '0,35 s'],
    css: `.A-drawer .dim{position:absolute;inset:0;background:rgb(0 0 0/.4);opacity:0;z-index:20;animation:a-dim 4.5s infinite}
      .A-drawer .dr{position:absolute;right:0;top:0;bottom:0;width:440px;background:var(--surf);z-index:21;padding:34px 30px;display:flex;flex-direction:column;gap:18px;transform:translateX(105%);animation:a-dr 4.5s infinite;box-shadow:-20px 0 50px rgb(0 0 0/.2)}
      .A-drawer .dr h3{font-size:34px}.A-drawer .li{display:grid;grid-template-columns:90px 1fr auto;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
      .A-drawer .li img{width:90px;height:90px;object-fit:contain;background:var(--surf2)}.A-drawer .li div{display:grid;gap:4px}
      .A-drawer .fs3{display:grid;gap:8px;font-size:13px;color:var(--mut)}.A-drawer .fs3 b{color:var(--ink)}.A-drawer .fs3 i{display:block;height:6px;background:var(--line);border-radius:6px;overflow:hidden}
      .A-drawer .fs3 s{display:block;height:100%;width:var(--w);background:var(--acc);transform-origin:left;animation:a-fill 4.5s infinite}
      @keyframes a-dim{0%,27%{opacity:0}35%,74%{opacity:1}82%,100%{opacity:0}}@keyframes a-dr{0%,27%{transform:translateX(105%)}36%,74%{transform:none}83%,100%{transform:translateX(105%)}}
      @keyframes a-fill{0%,36%{transform:scaleX(0)}48%,100%{transform:scaleX(1)}}`,
    html: p => `${buy(p)}<div class="dim"></div><aside class="dr"><div class="row"><h3>Warenkorb (1)</h3><span>✕</span></div><div class="li"><img src="${p.img}" alt=""><div><b>${nm(p)} Trikot</b><span class="desc">Größe M</span></div><span class="price" style="font-size:15px">${eur(p.price)}</span></div>
      <div class="fs3"><p>Noch <b>${eur(90 - p.price)}</b> bis zum Gratis-Versand</p><i><s style="--w:${(p.price / 90 * 100).toFixed(1)}%"></s></i></div>${cta(p, 'Zur Kasse')}<span class="guide" style="text-align:center">Weiter einkaufen</span></aside>${cur(...CTA_AT, true)}` },
  { key: 'ball', fam: 'Kaufen', name: 'Ball rollt zum Gratis-Versand', idea: 'Unter dem Kaufen-Knopf zeigt ein Balken, wie viel bis zum Gratis-Versand fehlt. Legt man ein zweites Trikot dazu, rollt ein Ball bis ans Ende: „Versand gratis ✓“. Stimmt immer, ist echt.',
    tags: ['Zweites Trikot', 'Gratis-Versand', 'Fußball-Detail', 'Ehrlich'],
    css: `.A-ball .fb3{display:grid;gap:10px;padding:16px;background:var(--surf2);border-radius:var(--r)}.A-ball .fb3 p{display:grid;font-size:13px;color:var(--mut)}.A-ball .fb3 p span{grid-area:1/1}.A-ball .fb3 b{color:var(--ink)}
      .A-ball .t1{animation:a-out2 4.5s infinite}.A-ball .t2{opacity:0;animation:a-in2 4.5s infinite}
      @keyframes a-out2{0%,34%{opacity:1}40%,78%{opacity:0}84%,100%{opacity:1}}@keyframes a-in2{0%,46%{opacity:0}52%,78%{opacity:1}84%,100%{opacity:0}}
      .A-ball .tr{position:relative;height:8px;background:var(--line);border-radius:8px;margin:8px 0}
      .A-ball .fl{position:absolute;inset:0;background:var(--acc);border-radius:8px;transform-origin:left;transform:scaleX(var(--w));animation:a-bfill 4.5s infinite}
      .A-ball .ball{position:absolute;top:50%;left:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:1.5px solid #111;transform:translateX(calc(var(--w) * 328px));animation:a-ball 4.5s infinite;
        background:radial-gradient(circle at 50% 50%,#111 0 5px,transparent 5.5px),radial-gradient(circle at 50% 0,#111 0 4px,transparent 4.5px),radial-gradient(circle at 0 60%,#111 0 4px,transparent 4.5px),radial-gradient(circle at 100% 60%,#111 0 4px,transparent 4.5px),radial-gradient(circle at 25% 100%,#111 0 4px,transparent 4.5px),radial-gradient(circle at 75% 100%,#111 0 4px,transparent 4.5px),#fff}
      @keyframes a-bfill{0%,30%{transform:scaleX(var(--w))}52%,78%{transform:scaleX(1)}86%,100%{transform:scaleX(var(--w))}}
      @keyframes a-ball{0%,30%{transform:translateX(calc(var(--w) * 328px)) rotate(0deg)}52%,78%{transform:translateX(328px) rotate(540deg)}86%,100%{transform:translateX(calc(var(--w) * 328px)) rotate(0deg)}}
      .A-ball .up{display:grid;grid-template-columns:54px 1fr auto;gap:12px;align-items:center;font-size:12px}.A-ball .up img{width:54px;height:54px;object-fit:contain;background:var(--surf)}
      .A-ball .add{padding:9px 12px;border:1.5px solid var(--ink);font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.06em;border-radius:var(--r)}`,
    html: p => { const q = PRODUCTS.find(x => x.id !== p.id && !x.city); const w = (p.price / 90).toFixed(3);
      return `${buy(p, { n: 1, extra: `<div class="fb3" style="--w:${w}"><p><span class="t1">Noch <b>${eur(90 - p.price)}</b> bis zum Gratis-Versand</span><span class="t2"><b>Versand gratis ✓</b> · zusammen ${eur(p.price + q.price)}</span></p><div class="tr"><i class="fl"></i><i class="ball"></i></div><div class="up"><img src="${q.img}" alt=""><span><b>${nm(q)}</b><br>${eur(q.price)}</span><span class="add">+ Dazu</span></div></div>` })}${cur(1173, 495, true)}`; } },

  { key: 'lpick', fam: 'Größe wählen', name: 'Spieler wird aufgestellt', idea: 'Für die Aufstellung: tippt man eine Größe an, springt der Spieler kurz hoch und leuchtet, der vorherige wird wieder frei. Oben wechselt „Aufgestellt: L“.',
    tags: ['Größe', 'Aufstellung', 'Spielerisch', '0,3 s'],
    css: `.A-lpick .pkw{display:grid;gap:8px}.A-lpick .pm .pl:nth-child(4){animation:a-plOff 4.5s infinite}.A-lpick .pm .pl:nth-child(5){animation:a-plOn 4.5s infinite}
      @keyframes a-plOff{0%,25%,84%,100%{background:var(--acc);border-color:var(--acc);color:var(--accInk);box-shadow:0 0 0 5px color-mix(in srgb,var(--acc) 28%,transparent)}30%,78%{background:var(--pmf);border-color:var(--pmc);color:var(--pmc);box-shadow:0 0 0 0 transparent}}
      @keyframes a-plOn{0%,25%,84%,100%{background:var(--pmf);border-color:var(--pmc);color:var(--pmc);box-shadow:0 0 0 0 transparent;scale:1}29%{scale:1.22}33%,78%{background:var(--acc);border-color:var(--acc);color:var(--accInk);box-shadow:0 0 0 5px color-mix(in srgb,var(--acc) 28%,transparent);scale:1}}`,
    html: p => `${buy(p, { pick: `<div class="pkw"><span class="lab swap"><span class="o1">Aufgestellt: M</span><span class="o2">Aufgestellt: L</span></span>${pitch('M', { style: 'width:330px;height:210px' })}</div>`, cta: cta(p, 'Aufstellen') })}${cur(1121, 430, true)}` },
  { key: 'spick', fam: 'Größe wählen', name: 'Block leuchtet auf', idea: 'Für die Platzwahl: klickt man einen Block an, füllt er sich mit Farbe und die Zusammenfassung wechselt auf „Block L · Nord“. Wie beim Ticketkauf.',
    tags: ['Größe', 'Platzwahl', 'Ticket-Thema', '0,3 s'],
    css: `.A-spick .pkw{display:grid;gap:8px}.A-spick .st .sB{animation:a-bOff 4.5s infinite}.A-spick .st .sL{animation:a-bOn 4.5s infinite}
      @keyframes a-bOff{0%,25%,84%,100%{background:var(--acc);border-color:var(--acc);color:var(--accInk)}30%,78%{background:var(--stf);border-color:var(--stc);color:var(--stc)}}
      @keyframes a-bOn{0%,25%,84%,100%{background:var(--stf);border-color:var(--stc);color:var(--stc)}30%,78%{background:var(--acc);border-color:var(--acc);color:var(--accInk)}}`,
    html: p => `${buy(p, { pick: `<div class="pkw"><span class="lab swap"><span class="o1">Block M · Haupttribüne</span><span class="o2">Block L · Nord</span></span>${stadium('M', { style: 'width:340px;height:230px' })}</div>`, cta: cta(p, 'Platz sichern') })}${cur(898, 394, true)}` },

  { key: 'stagger', fam: 'Seitenaufbau', name: 'Nacheinander einblenden', idea: 'Beim Runterscrollen erscheinen Überschrift und Trikots kurz nacheinander von unten. Gibt der Seite Rhythmus, ohne aufzuhalten.',
    tags: ['Beim Scrollen', 'Dezent', 'Bewährt', '0,5 s'],
    css: `.A-stagger .sc3 .pc{animation:a-stg 4.5s infinite both}.A-stagger .sc3 .pc:nth-child(2){animation-delay:.12s}.A-stagger .sc3 .pc:nth-child(3){animation-delay:.24s}
      .A-stagger .ttl{position:absolute;left:150px;top:72px;font-size:44px;animation:a-stg 4.5s infinite both}.A-stagger .sc3{top:140px}`,
    html: () => grid3({ top: '<h2 class="ttl">Trikots</h2>', h: 320 }) },
  { key: 'numbers', fam: 'Seitenaufbau', name: 'Nummern schieben sich rein', idea: 'Für die Reihe mit großen Nummern: beim Scrollen schieben sich 01, 02, 03 von unten ins Bild, die Trikots folgen. Wie Rückennummern, die aufgerufen werden.',
    tags: ['Beim Scrollen', 'Große Nummern', 'Reihe', '0,6 s'],
    css: `.A-numbers .sc3{top:200px}.A-numbers .it{position:relative}.A-numbers .nw{position:absolute;left:-14px;top:-108px;height:132px;overflow:hidden}
      .A-numbers .n{display:block;font-size:150px;font-weight:900;font-stretch:62%;line-height:1;opacity:.14;animation:a-num 4.5s infinite both}
      .A-numbers .it:nth-child(2) .n{animation-delay:.1s}.A-numbers .it:nth-child(3) .n{animation-delay:.2s}
      .A-numbers .pc{position:relative;animation:a-stg 4.5s infinite both;animation-delay:.15s}.A-numbers .it:nth-child(2) .pc{animation-delay:.25s}.A-numbers .it:nth-child(3) .pc{animation-delay:.35s}
      @keyframes a-num{0%,6%{transform:translateY(100%)}20%,84%{transform:none}94%,100%{transform:translateY(100%)}}`,
    html: () => grid3({ card: (q, i) => `<div class="it"><span class="nw"><span class="n">0${i + 1}</span></span>${pcard(q, 320)}</div>` }) },
  { key: 'flap', fam: 'Seitenaufbau', name: 'Anzeigetafel', idea: 'Überschriften und neue Trikots erscheinen wie auf einer alten Stadion- oder Bahnhofstafel: die Buchstaben klappen kurz durch und bleiben stehen.',
    tags: ['Überschrift', 'Stadion-Gefühl', 'Merkt man sich', '1 s'],
    css: `.A-flap .fb{position:absolute;left:0;right:0;top:78px;display:flex;justify-content:center;gap:4px}
      .A-flap .tl{position:relative;width:50px;height:72px;background:var(--ink);color:var(--bg);border-radius:4px;overflow:hidden}.A-flap .tl::after{content:"";position:absolute;left:0;right:0;top:50%;border-top:2px solid var(--bg);opacity:.25}
      .A-flap .cl{display:block;animation:a-flapc 4.5s infinite both;animation-timing-function:steps(1,end)}.A-flap .cl i{display:grid;place-items:center;height:72px;font-style:normal;font-weight:800;font-size:46px;font-stretch:70%}
      @keyframes a-flapc{0%{transform:translateY(0)}6%{transform:translateY(-72px)}12%{transform:translateY(-144px)}18%,88%{transform:translateY(-216px)}100%{transform:translateY(0)}}
      .A-flap .sc3{top:200px}`,
    html: p => grid3({ top: flap(`NEU: ${nm(p).toUpperCase()}`), h: 300 }) },
  { key: 'bigmq', fam: 'Seitenaufbau', name: 'Riesige Laufzeile', idea: 'Über den Trikots läuft langsam eine riesige Zeile mit den Namen durch. Laut und modern, bewegt sich aber ruhig und gleichmäßig.',
    tags: ['Dauerhaft', 'Riesige Schrift', 'Modern', 'Langsam'],
    css: `.A-bigmq .bm{position:absolute;left:0;right:0;top:84px;height:200px;overflow:hidden;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);display:flex;align-items:center}
      .A-bigmq .tr{display:flex;align-items:center;white-space:nowrap;animation:a-mq 16s linear infinite}.A-bigmq .tr span{font-size:150px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:1;color:transparent;-webkit-text-stroke:2px var(--ink);padding:0 30px}
      .A-bigmq .tr i{font-style:normal;font-size:60px;color:var(--acc)}`,
    html: () => { const t = PRODUCTS.map(q => `<span>${nm(q)}</span><i>✦</i>`).join(''); return grid3({ top: `<div class="bm"><div class="tr">${t}${t}</div></div>`, h: 280, style: 'top:320px' }); } },
  { key: 'replay', fam: 'Seitenaufbau', name: 'TV-Wiederholung', idea: 'Beim Wechsel vom Shop in eine Produktansicht wischt ein blaues Band mit dem Azur-Logo über das Bild wie bei einer Wiederholung im Fernsehen.',
    tags: ['Seitenwechsel', 'Fußball im TV', 'Auffällig', '0,6 s'],
    css: `.A-replay .lb{position:absolute;inset:0;background:var(--bg);z-index:5;clip-path:inset(0 100% 0 0);animation:a-clip 4.5s linear infinite}
      @keyframes a-clip{0%,24%{clip-path:inset(0 100% 0 0)}33%,62%{clip-path:inset(0 0 0 0)}71%,100%{clip-path:inset(0 0 0 100%)}}
      .A-replay .wp{position:absolute;top:-10%;bottom:-10%;left:0;width:400px;background:var(--acc);display:grid;place-items:center;z-index:10;transform:translateX(-540px) skewX(-14deg);animation:a-wipe 4.5s linear infinite}
      .A-replay .wp img{height:64px;transform:skewX(14deg)}
      @keyframes a-wipe{0%,22%{transform:translateX(-540px) skewX(-14deg)}35%{transform:translateX(1400px) skewX(-14deg)}35.1%,60%{transform:translateX(-540px) skewX(-14deg)}73%{transform:translateX(1400px) skewX(-14deg)}73.1%,100%{transform:translateX(-540px) skewX(-14deg)}}`,
    html: p => `${grid3()}<div class="lb">${buy(p)}</div><div class="wp"><img src="${logo(true)}" alt=""></div>` },

  { key: 'float', fam: 'Produktbild', name: 'Trikot schwebt leicht', idea: 'In der Produktansicht schwebt das Trikot ganz langsam auf und ab, der Schatten darunter atmet mit. Lebendig, aber nicht ablenkend.',
    tags: ['Dauerhaft', 'Produktansicht', 'Ruhig', '4 s Takt'],
    css: `.A-float .bi>img{animation:a-float 4s ease-in-out infinite;position:relative;z-index:1}@keyframes a-float{0%,100%{transform:translateY(8px)}50%{transform:translateY(-10px)}}
      .A-float .bi::after{content:"";position:absolute;bottom:62px;left:50%;width:320px;height:30px;margin-left:-160px;border-radius:50%;background:rgb(0 0 0/.22);filter:blur(10px);animation:a-fsh 4s ease-in-out infinite}
      @keyframes a-fsh{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.6}}`,
    html: p => buy(p, { img: `<img src="${p.img}" alt="">` }) },

  { key: 'mqnow', fam: 'Laufband', name: 'Laufband ruhig (so ist es jetzt)', idea: 'So ist es gerade eingebaut: das Laufband läuft gleichmäßig durch, beim Runterscrollen wird die Kopfzeile schmaler. Zum Vergleich mit der nächsten Karte.',
    tags: ['Jetziger Stand', 'Dauerhaft', 'Ruhig', 'Schmale Kopfzeile'],
    css: `.A-mqnow .mq3{position:absolute;left:0;right:0;top:0;height:32px;background:var(--ink);color:var(--bg);overflow:hidden;display:flex;align-items:center;z-index:3;font-family:'Martian Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
      .A-mqnow .mq3 .tr{display:flex;gap:22px;white-space:nowrap;animation:a-mq 24s linear infinite;padding-left:22px}.A-mqnow .mq3 .tr i{font-style:normal;color:var(--acc)}
      .A-mqnow .hd{position:absolute;left:0;right:0;top:32px;z-index:3;height:64px;animation:a-hd 4.5s infinite}.A-mqnow .hd .logo{animation:a-lg 4.5s infinite}
      @keyframes a-hd{0%,25%{height:64px}35%,75%{height:48px}85%,100%{height:64px}}@keyframes a-lg{0%,25%{height:26px}35%,75%{height:20px}85%,100%{height:26px}}
      .A-mqnow .pg{position:absolute;left:0;right:0;top:96px;animation:a-pg 4.5s infinite}@keyframes a-pg{0%,20%{transform:none}40%,70%{transform:translateY(-330px)}90%,100%{transform:none}}
      .A-mqnow .rm{height:380px;background:url(img/room.webp) center/cover}.A-mqnow .pg .sc3{position:static;margin-top:40px}`,
    html: () => { const t = [...MSGS, ...MSGS].map(s => `<span>${s}</span><i>✦</i>`).join(''); return `<div class="mq3"><div class="tr">${t}${t}</div></div>${hdr3(1)}<div class="pg"><div class="rm"></div><div class="sc3">${PRODUCTS.slice(0, 3).map(q => pcard(q, 300)).join('')}</div></div>`; } },
  { key: 'mqflip', fam: 'Laufband', name: 'Laufband blättert', idea: 'Statt durchzulaufen zeigt das Laufband eine Meldung nach der anderen und blättert alle zwei Sekunden nach oben weiter. Leichter zu lesen, ruhiger.',
    tags: ['Dauerhaft', 'Leichter lesbar', 'Ruhig', 'Alle 2 s'],
    css: `.A-mqflip .mqf{height:32px;background:var(--ink);color:var(--bg);overflow:hidden;display:flex;justify-content:center;font-family:'Martian Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
      .A-mqflip .mqf .tr{display:flex;flex-direction:column;animation:a-roll 10s infinite}.A-mqflip .mqf span{height:32px;display:grid;place-items:center;flex:none}
      .A-mqflip .zv{position:absolute;left:190px;right:190px;top:560px;display:grid;gap:10px;justify-items:center}.A-mqflip .zv .mqf{width:100%;height:72px;font-size:24px}.A-mqflip .zv .mqf span{height:72px}
      .A-mqflip .sc3{top:130px}
      @keyframes a-roll{0%,18%{transform:translateY(0)}22%,43%{transform:translateY(-20%)}47%,68%{transform:translateY(-40%)}72%,93%{transform:translateY(-60%)}97%,100%{transform:translateY(-80%)}}`,
    html: () => { const bar = `<div class="mqf"><div class="tr">${[...MSGS, MSGS[0]].map(s => `<span>${s}</span>`).join('')}</div></div>`; return `${bar}${hdr3(1)}<div class="sc3">${PRODUCTS.slice(0, 3).map(q => pcard(q, 260)).join('')}</div><div class="zv"><span class="lab">Das Laufband vergrößert</span>${bar}</div>`; } },
];

/* ================================================================ colour (one fixed composite, the palette changes) */
const PAL3 = [
  { key: 'paper', name: 'Papier & Azurblau', idea: 'Die jetzige Grundlage: warmes Papierweiß, fast schwarze Schrift, Azurblau für Knöpfe und Akzente. Passt zum Namen und zum Neonschild im Zimmer.', tags: ['Hell', 'Jetziger Stand', 'Blau wie der Name', 'Ruhig'],
    pal: { bg: '#f3f0ea', surf: '#fbfaf6', surf2: '#e9e4da', ink: '#16181b', mut: '#66635c', line: '#d6cfc2', acc: '#1f5fbf', accInk: '#ffffff', hand: '#1f5fbf' } },
  { key: 'night', dark: true, name: 'Nachtspiel', idea: 'Dunkles Nachtblau wie das Zimmer am Abend, die Knöpfe leuchten im Neonblau des Schilds. Der Übergang vom Zimmer in den Shop wird fast unsichtbar.', tags: ['Dunkel', 'Neon wie im Zimmer', 'Abend-Stimmung', 'Auffällig'],
    pal: { bg: '#07131d', surf: '#0d2130', surf2: '#13293a', ink: '#eef3f6', mut: '#9fb2c0', line: '#23394b', acc: '#16b8ff', accInk: '#07131d', hand: '#8debff' } },
  { key: 'flood', dark: true, name: 'Flutlicht', idea: 'Fast schwarz wie ein Stadion bei Nacht, Gelb wie das Flutlicht für Knöpfe und Hinweise. Sehr sportlich, sehr klar, der Kaufen-Knopf springt sofort ins Auge.', tags: ['Dunkel', 'Stadion bei Nacht', 'Starker Kontrast', 'Sportlich'],
    pal: { bg: '#111214', surf: '#1b1c1f', surf2: '#24262a', ink: '#f5f3ea', mut: '#a9a79f', line: '#33353a', acc: '#ffd400', accInk: '#111111', hand: '#ffd400' } },
  { key: 'pitch', name: 'Rasen', idea: 'Papierweiß mit tiefem Rasengrün. Klassisch englisch, wirkt hochwertig und ruhig, wie ein alter Vereinsshop.', tags: ['Hell', 'Grün', 'Klassisch', 'Hochwertig'],
    pal: { bg: '#f1efe6', surf: '#fbfaf5', surf2: '#e3e1d3', ink: '#13201a', mut: '#5b625e', line: '#d3d2c3', acc: '#1d5c3a', accInk: '#ffffff', hand: '#1d5c3a' } },
  { key: 'ash', name: 'Ascheplatz', idea: 'Die rotbraune Asche vom Bolzplatz um die Ecke, dazu cremige Kalklinien. Sehr deutsch, sehr Kindheit, warm und eigen.', tags: ['Hell', 'Bolzplatz', 'Warm', 'Eigen'],
    pal: { bg: '#f1e8de', surf: '#fbf6f0', surf2: '#e5d6c6', ink: '#2a1a12', mut: '#6c584a', line: '#dcc8b5', acc: '#a8441f', accInk: '#ffffff', hand: '#a8441f' } },
  { key: 'prog70', name: 'Programmheft 70er', idea: 'Senfgelbes Papier, Orange und ein tiefes Blau wie in alten Stadionheften. Retro mit Absicht, passt zum Spielprogramm-Gedanken.', tags: ['Hell', 'Retro', 'Warm', 'Drei Farben'],
    pal: { bg: '#f2e3bf', surf: '#faf1da', surf2: '#e6d2a3', ink: '#2b1d12', mut: '#665134', line: '#d8c08c', acc: '#c4461c', accInk: '#ffffff', hand: '#1f4e79' } },
  { key: 'news', name: 'Sportzeitung', idea: 'Graues Zeitungspapier, schwarze Schrift und ein kräftiges Rot wie die Schlagzeilen am Montag nach dem Spiel.', tags: ['Hell', 'Zeitung', 'Kräftiges Rot', 'Laut'],
    pal: { bg: '#ebe9e3', surf: '#f7f6f2', surf2: '#dedbd2', ink: '#111111', mut: '#5a5853', line: '#cfccc3', acc: '#d0021b', accInk: '#ffffff', hand: '#d0021b' } },
  { key: 'mono', name: 'Schwarz-Weiß', idea: 'Nur Schwarz und Weiß. Die Trikots bringen die ganze Farbe mit, die Seite tritt komplett zurück. Wie ein Modelabel.', tags: ['Hell', 'Minimal', 'Trikots im Mittelpunkt', 'Mode'],
    pal: { bg: '#ffffff', surf: '#ffffff', surf2: '#f1f1f1', ink: '#000000', mut: '#5a5a5a', line: '#dddddd', acc: '#000000', accInk: '#ffffff', hand: '#000000' } },
  { key: 'chalk', dark: true, name: 'Taktiktafel', idea: 'Dunkelgrün wie die Tafel in der Kabine, Schrift wie Kreide, Hinweise in Kreidegelb. Passt zur Aufstellung.', tags: ['Dunkel', 'Kabine', 'Aufstellung', 'Eigen'],
    pal: { bg: '#1d2b25', surf: '#24352d', surf2: '#2c4037', ink: '#f1efe6', mut: '#b3beb6', line: '#3c5248', acc: '#f1efe6', accInk: '#1d2b25', hand: '#f2d16b' } },
  { key: 'club', name: 'Vereinsheim', idea: 'Creme, dunkles Vereinsgrün und Gold für Kleinigkeiten wie die Handschrift. Wirkt wie ein Traditionsverein, edel ohne kitschig zu sein.', tags: ['Hell', 'Tradition', 'Grün + Gold', 'Edel'],
    pal: { bg: '#f3eee4', surf: '#fbf8f1', surf2: '#e6dfcf', ink: '#0f2a20', mut: '#5b635b', line: '#d8cfbd', acc: '#0f3d2e', accInk: '#f3e2b0', hand: '#8f6716' } },
  { key: 'bordeaux', name: 'Bordeaux', idea: 'Helles Creme mit dunklem Weinrot. Erwachsen und modisch, erinnert an alte Auswärtstrikots.', tags: ['Hell', 'Weinrot', 'Modisch', 'Erwachsen'],
    pal: { bg: '#f4efe9', surf: '#fcfaf7', surf2: '#e8ded5', ink: '#1e1416', mut: '#675a5c', line: '#dccfc6', acc: '#6e1f2f', accInk: '#ffffff', hand: '#6e1f2f' } },
  { key: 'navy', name: 'Marine & Creme', idea: 'Creme und tiefes Marineblau, ein Hauch Rot in der Handschrift. Zeitlos wie ein Matrosenhemd, ruhiger als das Azurblau.', tags: ['Hell', 'Marine', 'Zeitlos', 'Ruhig'],
    pal: { bg: '#f4efe3', surf: '#fcf9f2', surf2: '#e7e0d0', ink: '#0e1a2b', mut: '#596070', line: '#d8d0bf', acc: '#0e1a2b', accInk: '#f4efe3', hand: '#c8102e' } },
  { key: 'sky', name: 'Himmelblau', idea: 'Ein ganz helles Himmelblau als Grund, Marineblau für Schrift und Knöpfe. Frisch und sommerlich, erinnert an Sonntag auf dem Platz.', tags: ['Hell', 'Blau', 'Frisch', 'Sommer'],
    pal: { bg: '#e8f1f7', surf: '#f7fbfd', surf2: '#d6e6f1', ink: '#0f2240', mut: '#4d6074', line: '#c3d6e4', acc: '#13294b', accInk: '#ffffff', hand: '#1f5fbf' } },
  { key: 'concrete', name: 'Beton & Signalorange', idea: 'Grauer Stadionbeton und Signalorange wie Absperrband und Ordnerwesten. Urban und laut, der Kaufen-Knopf ist nicht zu übersehen.', tags: ['Hell', 'Urban', 'Orange', 'Laut'],
    pal: { bg: '#e3e2de', surf: '#f0efec', surf2: '#d4d3ce', ink: '#1b1b1b', mut: '#53514d', line: '#c6c4be', acc: '#e04a12', accInk: '#111111', hand: '#b5380a' } },
  { key: 'wood', dark: true, name: 'Holz & Neon', idea: 'Das dunkle Holz vom Schreibtisch im Zimmer als Grund, Neonblau vom Schild für Knöpfe. Warm und dunkel zugleich, sehr nah am Zimmer.', tags: ['Dunkel', 'Wie im Zimmer', 'Warm', 'Neon'],
    pal: { bg: '#241a13', surf: '#30241b', surf2: '#3b2c21', ink: '#f3eee6', mut: '#c1b29f', line: '#4a392c', acc: '#16b8ff', accInk: '#07131d', hand: '#8debff' } },
  { key: 'ticket', name: 'Ticketrosa', idea: 'Das blasse Rosa alter Eintrittskarten mit kräftigem Rot. Ungewöhnlich für Fußball, gerade deshalb eigen. Passt zu Drehkreuz und Platzwahl.', tags: ['Hell', 'Ticket', 'Ungewöhnlich', 'Rot'],
    pal: { bg: '#f7e6e3', surf: '#fdf5f3', surf2: '#efd5d0', ink: '#1a1414', mut: '#665250', line: '#e3c6c0', acc: '#b5122b', accInk: '#ffffff', hand: '#b5122b' } },
  { key: 'olive', name: 'Olive & Ecru', idea: 'Naturweiß und Olivgrün, gedeckt wie Vintage-Trainingsjacken. Sehr modisch, weniger Fanartikel.', tags: ['Hell', 'Gedeckt', 'Vintage', 'Mode'],
    pal: { bg: '#efeadb', surf: '#f9f6ec', surf2: '#e2dcc7', ink: '#1d1f14', mut: '#5c5d4c', line: '#d4cdb4', acc: '#4b5320', accInk: '#ffffff', hand: '#4b5320' } },
  { key: 'summer', name: 'Sommerturnier', idea: 'Sand, Petrol und Terrakotta wie ein Strandturnier im August. Warm, freundlich, ein bisschen Urlaub.', tags: ['Hell', 'Warm', 'Freundlich', 'Zwei Akzente'],
    pal: { bg: '#f5ead7', surf: '#fcf6ea', surf2: '#ead9bd', ink: '#1d2324', mut: '#5b5a52', line: '#ddcaa8', acc: '#12706b', accInk: '#ffffff', hand: '#b84e27' } },
  { key: 'azure', dark: true, name: 'Azur pur', idea: 'Die ganze Seite in kräftigem Azurblau, Schrift weiß, Knöpfe weiß mit blauer Schrift, Gelb für die Handschrift. Mutig und sofort wiedererkennbar.', tags: ['Farbig', 'Blau als Fläche', 'Mutig', 'Wiedererkennbar'],
    pal: { bg: '#1d4fa3', surf: '#2358b0', surf2: '#2a62bd', ink: '#ffffff', mut: '#d2def3', line: '#4a76c2', acc: '#ffffff', accInk: '#1d4fa3', hand: '#ffd400' } },
];
const SWATCH = [['bg', 'Hintergrund'], ['surf', 'Fläche'], ['ink', 'Schrift'], ['mut', 'Nebentext'], ['acc', 'Knopf / Akzent'], ['hand', 'Handschrift']];
const CBASE = `
.m.color{height:800px}.m.color .cm-room{height:84px;background:linear-gradient(to bottom,rgb(0 0 0/0) 15%,var(--bg)),url(img/room.webp) center 88%/1280px auto}
.m.color .cmb{display:grid;grid-template-columns:1fr 470px;height:510px}.m.color .cl{padding:26px 40px;display:grid;gap:18px;align-content:start}.m.color .cl h2{font-size:56px}
.m.color .cg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.m.color .cr{background:var(--surf);border-left:1px solid var(--line);padding:26px 36px;display:flex;flex-direction:column;gap:12px}.m.color .cr h2{font-size:44px}
.m.color .sw{position:absolute;left:0;right:0;bottom:0;height:116px;display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid var(--line);background:var(--bg)}
.m.color .sw div{display:grid;grid-template-columns:44px 1fr;gap:2px 12px;align-content:center;padding:0 20px;font-size:12px;border-right:1px solid var(--line)}
.m.color .sw i{grid-row:span 2;width:44px;height:44px;border-radius:50%;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent)}.m.color .sw b{font-weight:700;align-self:end}.m.color .sw span{font-family:'Martian Mono',monospace;font-size:10.5px;color:var(--mut);align-self:start}
`;
const COLOR3 = PAL3.map(x => ({ ...x, fam: x.dark ? 'Dunkel' : 'Hell', pal: { ...x.pal, r: '2px' }, css: '',
  html: p => `<div class="cm-room"></div>${marquee()}${header(!!x.dark)}<div class="cmb"><div class="cl"><div class="row"><h2>Trikots</h2><div class="chips"><span class="on">Alle</span><span>Städte</span><span>Länder</span></div></div>
    <div class="cg">${PRODUCTS.slice(0, 3).map((q, i) => pcard(q, 250, { badge: i === 0 ? 'Neu' : '', qa: i === 1 })).join('')}</div></div>
    <div class="cr"><span class="eyebrow">Trikot · ${p.city ? 'Städte' : 'Länder'}</span><h2>${title(p)}</h2><span class="price">${eur(p.price)}</span>${sizes()}${cta(p)}${fsbar(p)}${ship()}<span class="hand" style="font-size:24px">für jeden Tag, nicht nur Spieltag</span></div></div>
    <div class="sw">${SWATCH.map(([k, n]) => `<div><i style="background:${x.pal[k]}"></i><b>${n}</b><span>${x.pal[k].toUpperCase()}</span></div>`).join('')}</div>` }));

const R3_CSS = [BASE3, ABASE, CBASE].join('\n');
