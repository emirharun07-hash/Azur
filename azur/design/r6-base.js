/* Runde 15 (Stimmen r6): gemeinsame Bausteine der Entwürfe im Stil der Seite seit Runde 13 (yeezy.com):
   Weiß, Schwarz, eine Monospace-Schrift. Jeder Entwurf ist ein 1280 px breites Bild, das ins Swipe-Feld skaliert wird.
   Ein Entwurf: { key, name, idea, tags, css, html(P) }; css ist auf .<Bereichs-Id>-<key> beschränkt. */
const P6 = [
  { id: 'brasilien', name: 'Brasilien', code: 'BRA', dial: '+55', img: 'img/brasilien.webp', ar: 551 / 640, c1: '#f4cf1d', c2: '#0d5a33' },
  { id: 'deutschland', name: 'Deutschland', code: 'GER', dial: '+49', img: 'img/deutschland.webp', ar: 579 / 640, c1: '#f2f2f0', c2: '#111111' },
  { id: 'tuerkei', name: 'Türkei', code: 'TUR', dial: '+90', img: 'img/tuerkei.webp', ar: 591 / 640, c1: '#c8101a', c2: '#ffffff' },
];
const BAG_SVG = '<svg class="bagi" viewBox="0 0 48 40" aria-hidden="true"><path d="M15 14 C15 5 33 5 33 14"/><rect x="4" y="13" width="40" height="22" rx="10"/><path class="st" d="M5 24 H43"/><circle class="bl" cx="35" cy="24" r="5.2"/><path class="ln" d="M35 19.6 l3 2.4 -1.2 3.6 h-3.6 l-1.2-3.6z"/></svg>';
const H6 = {
  bar: () => '<div class="s-bar">14 Tage kostenlose Rückgabe · Versand ab 90 € kostenlos</div>',
  logo: (tone = 'ink', cls = '') => `<img class="s-logo ${cls}" src="img/azur-logo-${tone}.webp" alt="">`,
  bag: (n = 0, inner = BAG_SVG) => `<span class="s-bag">${inner}<i class="s-cnt" data-n="${n}">${n}</i></span>`,
  hd: (o = {}) => `<header class="s-hd ${o.cls || ''}">${o.logo === false ? '<span></span>' : H6.logo(o.tone)}${H6.bag(o.n || 0, o.bag)}</header>`,
  img: (p, h, cls = '', st = '') => `<img class="jz ${cls}" src="${p.img}" alt="" style="height:${h}px;width:${Math.round(h * p.ar)}px;${st}">`,
  /* eine Spalte im Raster: Trikot in einem quadratischen Feld, darunter der Name */
  cell: (p, x, y, s = 300, o = {}) => `<div class="c3 ${o.cls || ''}" style="left:${x - s / 2}px;top:${y}px;width:${s}px;${o.st || ''}"><div class="c3i" style="height:${s}px">${H6.img(p, Math.round(s * (o.fill || 1)))}</div><b class="nm">${p.name}</b></div>`,
  /* die Shop-Seite wie jetzt: Leiste, Header, drei Trikots in einer Reihe */
  page: (o = {}) => `<div class="sp">${H6.bar()}${H6.hd(o)}${P6.map((p, i) => H6.cell(p, 240 + i * 400, 150)).join('')}</div>`,
  /* Produktseite wie jetzt (Mitte): großes Bild, Pfeile, Punkte, Name, Preis, Größen, + */
  pdp: (p, o = {}) => `<div class="sp pd">${H6.bar()}${H6.hd({ n: o.n || 0 })}
    <div class="pd-g">${H6.img(p, o.h || 330, 'pd-img')}<span class="pd-a l">‹</span><span class="pd-a r">›</span></div>
    <div class="pd-dots"><i class="on"></i><i></i><i></i><i></i></div>
    <div class="pd-i"><b class="nm">${p.name}</b><span class="pd-p">54,99 €</span>${o.sizes === undefined ? H6.sizes() : o.sizes}${o.plus === undefined ? H6.plus() : o.plus}</div></div>`,
  sizes: (sel = 'M') => `<div class="pd-lab">Größe <b data-show>${sel}</b></div><div class="szp" data-sz data-sel="${sel}">${['S', 'M', 'L', 'XL'].map(s => `<span data-v="${s}" class="${s === sel ? 'on' : ''}">${s}</span>`).join('')}</div>`,
  plus: (cls = '') => `<span class="pd-plus ${cls}"><svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg></span>`,
};
/* deterministischer Zufall für Kachel-Reihenfolgen */
function rnd6(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const R6_CSS = `
.m6 { position: relative; width: 1280px; overflow: hidden; background: #fff; color: #000; font-family: 'Martian Mono', ui-monospace, monospace;
  font-stretch: 87.5%; font-size: 13px; line-height: 1.5; letter-spacing: .02em; }
.m6 * { box-sizing: border-box; }
.m6 img { display: block; max-width: none; }
.m6 .sp { position: relative; height: 720px; background: #fff; }
.m6 .s-bar { height: 30px; display: grid; place-items: center; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #767676; }
.m6 .s-hd { position: relative; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.m6 .s-logo { height: 22px; width: auto; }
.m6 .s-bag { position: relative; display: block; width: 30px; height: 26px; }
.m6 .s-bag .bagi { width: 100%; height: 100%; fill: none; stroke: #000; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
.m6 .s-bag .bagi .st { stroke-width: 1.4; opacity: .7; } .m6 .s-bag .bagi .bl { fill: #000; stroke: none; } .m6 .s-bag .bagi .ln { fill: #fff; stroke: none; }
.m6 .s-cnt { position: absolute; top: -5px; right: -7px; min-width: 15px; height: 15px; padding: 0 3px; border-radius: 8px; background: #000; color: #fff;
  font-style: normal; font-size: 9px; line-height: 15px; text-align: center; }
.m6 .s-cnt[data-n="0"] { opacity: 0; }
.m6 .c3 { position: absolute; display: grid; justify-items: center; gap: 22px; }
.m6 .c3i { width: 100%; display: grid; place-items: center; }
.m6 .nm { font-weight: 400; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; text-align: center; white-space: nowrap; }
.m6 .pd-g { position: relative; height: 350px; display: grid; place-items: center; margin-top: 6px; }
.m6 .pd-a { position: absolute; top: 150px; font-size: 26px; line-height: 1; color: #000; }
.m6 .pd-a.l { left: 380px; } .m6 .pd-a.r { right: 380px; }
.m6 .pd-dots { display: flex; gap: 14px; justify-content: center; margin: 16px 0 18px; }
.m6 .pd-dots i { width: 5px; height: 5px; border-radius: 50%; background: #c4c4c4; } .m6 .pd-dots i.on { background: #000; }
.m6 .pd-i { display: grid; justify-items: center; gap: 12px; }
.m6 .pd-p { font-size: 14px; }
.m6 .pd-lab { font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: #767676; margin-top: 6px; }
.m6 .pd-lab b { font-weight: 400; color: #000; margin-left: 8px; }
.m6 .szp { display: flex; gap: 22px; }
.m6 .szp span { min-width: 30px; height: 30px; display: grid; place-items: center; font-size: 13px; color: #767676; cursor: pointer; transition: color .2s, background .2s, transform .25s; }
.m6 .szp span.on { color: #000; text-decoration: underline; text-underline-offset: 6px; }
.m6 .pd-plus { position: relative; width: 44px; height: 44px; display: grid; place-items: center; margin-top: 4px; }
.m6 .pd-plus svg { width: 22px; height: 22px; fill: none; stroke: #000; stroke-width: 1.6; stroke-linecap: round; overflow: visible; }
.m6 .cur { position: absolute; z-index: 20; width: 22px; height: 22px; pointer-events: none; }
.m6 .cur::before { content: ""; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 3l14 9-6.5 1.4L16 20l-2.6 1.2-3.5-6.6L5 19z' fill='%23000' stroke='%23fff' stroke-width='1.3'/%3E%3C/svg%3E") 0 0/contain no-repeat; }
`;
