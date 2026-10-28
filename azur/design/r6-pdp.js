/* Runde 15: Produktseite. Hinweis-Kästen nach der Zeichnung des Owners, Größenwahl im Fußball-Stil, die Sporttasche in 3D,
   Animationen für das Plus beim Hinzufügen. */

/* ---------------------------------------------------------------- Hinweise (Kästen mit Linien zu Details am Trikot) */
/* Trikot auf der Produktseite: Brasilien, 330 hoch, links oben bei (498, 110); Details als Anteil der Bildbreite/-höhe */
const HJ = { x: 498, y: 110, h: 330, p: P6[0] }; HJ.w = Math.round(HJ.h * HJ.p.ar);
const CALL6 = [
  { k: 'kragen', t: 'Kragen', d: 'Rundkragen, grün abgesetzt', fx: .5, fy: .135, box: [290, 108, 170, 122] },
  { k: 'signatur', t: 'Signatur', d: 'Azur-Schriftzug auf der Brust', fx: .34, fy: .30, box: [70, 252, 250, 196] },
  { k: 'wappen', t: 'Wappen', d: 'Raute mit fünf Sternen', fx: .67, fy: .29, box: [900, 108, 186, 132] },
  { k: 'stoff', t: 'Stoff', d: 'Feines Muster im Stoff', fx: .70, fy: .86, box: [888, 322, 200, 142] },
].map(c => ({ ...c, px: Math.round(HJ.x + c.fx * HJ.w), py: Math.round(HJ.y + c.fy * HJ.h) }));
const anchor6 = c => {
  const [x, y, w, h] = c.box;
  if (c.px > x + w) return [x + w, y + h / 2]; if (c.px < x) return [x, y + h / 2];
  return c.py > y + h ? [x + w / 2, y + h] : [x + w / 2, y];
};
/* Ausschnitt des Trikots als Lupe: Mitte = Detailpunkt, z-fach vergrößert */
const crop6 = (c, w, h, z = 3.2) => {
  const W = HJ.w * z, H = HJ.h * z;
  return `background-image:url(${HJ.p.img});background-size:${W.toFixed(0)}px ${H.toFixed(0)}px;background-position:${(w / 2 - c.fx * W).toFixed(0)}px ${(h / 2 - c.fy * H).toFixed(0)}px`;
};
const hinPage6 = (over, o = {}) => `<div class="sp pd hin-pd">${H6.bar()}${H6.hd()}
  <div class="pd-g">${H6.img(HJ.p, HJ.h, 'pd-img')}<span class="pd-a l">‹</span><span class="pd-a r">›</span></div>
  <div class="pd-dots"><i class="on"></i><i></i><i></i><i></i></div>
  <div class="pd-i"><b class="nm">${HJ.p.name}</b><span class="pd-p">54,99 €</span>${H6.sizes()}${H6.plus()}</div>${over}</div>`;
const lines6 = (cls = '', path = c => { const [ax, ay] = anchor6(c); return `M${ax} ${ay}L${c.px} ${c.py}`; }, dot = 3) =>
  `<svg class="hl ${cls}" viewBox="0 0 1280 800">${CALL6.map(c => `<path d="${path(c)}"/>${dot ? `<circle cx="${c.px}" cy="${c.py}" r="${dot}"/>` : ''}`).join('')}</svg>`;
const boxes6 = (inner, cls = '') => CALL6.map((c, i) => { const [x, y, w, h] = c.box; return `<div class="hb ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--i:${i}">${inner(c, w, h)}</div>`; }).join('');
const lupe6 = (c, w, h) => `<span class="hz" style="${crop6(c, w, h - 34)};height:${h - 34}px"></span><span class="ht"><b>${c.t}</b> ${c.d}</span>`;
const text6 = c => `<b class="htt">${c.t}</b><span class="htd">${c.d}</span>`;
const HIN6 = [
  { key: 'lupe', name: 'Kästen mit Lupe, gerade Linien', tags: ['wie die Zeichnung'], idea: 'Genau deine Zeichnung: vier Kästen rund ums Trikot, jeder zeigt das Detail vergrößert, eine feine gerade Linie führt zur Stelle am Trikot.',
    css: '', html: () => hinPage6(lines6() + boxes6(lupe6)) },
  { key: 'text', name: 'Nur Text, gerade Linien', tags: ['schlicht'], idea: 'Die gleichen Linien, in den Kästen aber nur ein Wort und eine kurze Zeile. Noch ruhiger.',
    css: '', html: () => { const T = CALL6.map(c => ({ ...c, box: [c.box[0], c.box[1] + c.box[3] / 2 - 32, c.box[2], 64] }));
      return hinPage6(`<svg class="hl" viewBox="0 0 1280 800">${T.map(c => { const [ax, ay] = anchor6(c); return `<path d="M${ax} ${ay}L${c.px} ${c.py}"/><circle cx="${c.px}" cy="${c.py}" r="3"/>`; }).join('')}</svg>` +
        T.map(c => { const [x, y, w, h] = c.box; return `<div class="hb tx" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${text6(c)}</div>`; }).join('')); } },
  { key: 'elbow', name: 'Linien mit Knick', tags: ['technisch'], idea: 'Die Linien laufen erst waagerecht, dann senkrecht, wie in einer technischen Zeichnung. Kästen mit Lupe.',
    css: '', html: () => hinPage6(lines6('', c => { const [ax, ay] = anchor6(c); return `M${ax} ${ay}H${c.px}V${c.py}`; }) + boxes6(lupe6)) },
  { key: 'numbers', name: 'Nummern am Trikot, Liste daneben', tags: ['schlicht'], idea: 'Keine Linien: kleine Nummern sitzen direkt auf dem Trikot, links daneben eine kurze Liste 1 bis 4.',
    css: '', html: () => hinPage6(CALL6.map((c, i) => `<span class="hn" style="left:${c.px - 11}px;top:${c.py - 11}px">${i + 1}</span>`).join('') +
      `<ol class="hlist">${CALL6.map(c => `<li><b>${c.t}</b> ${c.d}</li>`).join('')}</ol>`) },
  { key: 'hover', name: 'Punkte, Kasten beim Darüberfahren', tags: ['Bewegung', 'schlicht'], idea: 'Auf dem Trikot nur kleine Punkte. Erst wenn die Maus darüber ist (oder man tippt), öffnet sich der Kasten mit Linie. Hier läuft es der Reihe nach.',
    css: '', html: () => hinPage6(CALL6.map((c, i) => `<span class="hp" style="left:${c.px - 6}px;top:${c.py - 6}px;--i:${i}"></span>`).join('') +
      lines6('cyc') + boxes6(lupe6, 'cyc')) },
  { key: 'circles', name: 'Runde Lupen', tags: ['wie die Zeichnung'], idea: 'Statt Kästen runde Lupen, die das Detail groß zeigen, mit feiner Linie zum Trikot. Darunter ein Wort.',
    css: '', html: () => hinPage6(lines6('', c => { const [x, y, w, h] = c.box, r = Math.min(w, h - 26) / 2, cx = x + w / 2, cy = y + r, a = Math.atan2(c.py - cy, c.px - cx); return `M${(cx + r * Math.cos(a)).toFixed(0)} ${(cy + r * Math.sin(a)).toFixed(0)}L${c.px} ${c.py}`; }) +
      boxes6((c, w, h) => { const d = Math.min(w, h - 26); return `<span class="hc" style="width:${d}px;height:${d}px;${crop6(c, d, d, 3.6)}"></span><span class="ht c"><b>${c.t}</b></span>`; }, 'rd')) },
  { key: 'dashed', name: 'Gestrichelt mit Ecken', tags: ['technisch'], idea: 'Gestrichelte Linien und Kästen, von denen man nur die Ecken sieht. Leicht und ordentlich.',
    css: '', html: () => hinPage6(lines6('dash') + boxes6(lupe6, 'cn')) },
  { key: 'sides', name: 'Links zwei, rechts zwei', tags: ['ordentlich'], idea: 'Die Kästen stehen sauber in zwei Spalten links und rechts vom Trikot, die Linien gehen waagerecht hinüber.',
    css: '', html: () => { const pos = [[250, 120], [250, 300], [890, 120], [890, 300]]; const L = CALL6.map((c, i) => ({ ...c, box: [pos[i][0] - (i < 2 ? 0 : 0), pos[i][1], 150, 150] }));
      return hinPage6(`<svg class="hl" viewBox="0 0 1280 800">${L.map(c => { const [x, y, w, h] = c.box, ax = c.px > x ? x + w : x, ay = y + h / 2; return `<path d="M${ax} ${ay}H${(ax + c.px) / 2}L${c.px} ${c.py}"/><circle cx="${c.px}" cy="${c.py}" r="3"/>`; }).join('')}</svg>` +
        L.map(c => { const [x, y, w, h] = c.box; return `<div class="hb" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${lupe6(c, w, h)}</div>`; }).join('')); } },
  { key: 'blueprint', name: 'Wie eine Schnittzeichnung', tags: ['technisch'], idea: 'Graue Maßlinien mit kleinen Pfeilen und Nummern 01 bis 04, ohne Kästen. Wie ein Schnittmuster.',
    css: '', html: () => hinPage6(lines6('bp', c => { const [ax, ay] = anchor6(c); return `M${ax} ${ay}L${c.px} ${c.py}`; }, 0) +
      CALL6.map((c, i) => { const [ax, ay] = anchor6(c), left = ax < c.px; return `<span class="hbp" style="${left ? `right:${1280 - ax + 8}px` : `left:${ax + 8}px`};top:${ay - 9}px">0${i + 1} ${c.t}<i>${c.d}</i></span>`; }).join('')) },
  { key: 'hand', name: 'Handschrift wie deine Skizze', tags: ['wie die Zeichnung', 'persönlich'], idea: 'Kurze Notizen in Handschrift mit geschwungenen Pfeilen, als hätte jemand aufs Bild gekritzelt. Schwarz, sonst nichts.',
    css: '', html: () => hinPage6(lines6('hd', c => { const [ax, ay] = anchor6(c), mx = (ax + c.px) / 2, my = Math.min(ay, c.py) - 40; return `M${ax} ${ay}Q${mx} ${my} ${c.px} ${c.py}`; }, 0) +
      CALL6.map(c => { const [x, y, w, h] = c.box; return `<span class="hw" style="left:${x}px;top:${y + h / 2 - 34}px;width:${w}px">${c.t}!<br><small>${c.d}</small></span>`; }).join('')) },
  { key: 'cycle', name: 'Ein Detail nach dem anderen', tags: ['Bewegung'], idea: 'Links ein großer Kasten. Alle paar Sekunden zeigt er das nächste Detail, die Linie springt mit. Wenig auf einmal.',
    css: '', html: () => hinPage6(CALL6.map((c, i) => { const bx = [70, 230, 300, 300], cc = { ...c, box: bx }; const [ax, ay] = anchor6(cc);
      return `<div class="one" style="--i:${i}"><svg class="hl" viewBox="0 0 1280 800"><path d="M${ax} ${ay}L${c.px} ${c.py}"/><circle cx="${c.px}" cy="${c.py}" r="3"/></svg><div class="hb" style="left:70px;top:230px;width:300px;height:300px">${lupe6(c, 300, 300)}</div></div>`; }).join('')) },
  { key: 'strip', name: 'Details als Reihe darunter', tags: ['schlicht'], idea: 'Keine Linien, keine Kästen ums Trikot: unter dem Bild eine Reihe mit vier kleinen Nahaufnahmen und je einem Wort.',
    css: '', html: () => `<div class="sp pd hin-pd">${H6.bar()}${H6.hd()}<div class="pd-g" style="height:300px">${H6.img(HJ.p, 290, 'pd-img')}<span class="pd-a l">‹</span><span class="pd-a r">›</span></div>
      <div class="hstrip">${CALL6.map(c => `<span><i style="${crop6(c, 110, 110, 3)}"></i>${c.t}</span>`).join('')}</div>
      <div class="pd-i" style="margin-top:20px"><b class="nm">${HJ.p.name}</b><span class="pd-p">54,99 €</span>${H6.sizes()}</div></div>` },
];

/* ---------------------------------------------------------------- Größenwahl */
const SZ = ['S', 'M', 'L', 'XL'];
const JSVG = (cls = '') => `<svg class="${cls}" viewBox="0 0 100 100"><path d="M31 14 L43 9 Q50 17 57 9 L69 14 L88 28 L79 41 L71 36 L71 91 L29 91 L29 36 L21 41 L12 28 Z"/></svg>`;
const szPage6 = (picker, o = {}) => `<div class="sp pd szpd">${H6.bar()}${H6.hd()}
  <div class="pd-g" style="height:220px">${o.top || H6.img(P6[o.pi || 0], 200, 'pd-img')}</div>
  <div class="pd-i"><b class="nm">${P6[o.pi || 0].name}</b><span class="pd-p">54,99 €</span><div class="pd-lab">Größe <b data-show>M</b></div>${picker}</div><span class="zcap">Ausschnitt 1,6-fach vergrößert · Größen im Bild antippen</span></div>`;
const grp6 = (cls, item, extra = '') => `<div class="szx ${cls}" data-sz data-sel="M">${extra}${SZ.map(s => `<span data-v="${s}" class="${s === 'M' ? 'on' : ''}">${item(s)}</span>`).join('')}</div>`;
const SZ6 = [
  { key: 'shirts', name: 'Rückennummern', tags: ['Trikot'], idea: 'Jede Größe ist ein kleines Trikot, die Größe steht darauf wie eine Rückennummer. Das gewählte wird schwarz.',
    css: '', html: () => szPage6(grp6('z-shirts', s => `${JSVG()}<b>${s}</b>`)) },
  { key: 'lineup', name: 'Aufstellung: Viererkette', tags: ['Spielfeld'], idea: 'Ein kleines Spielfeld, die vier Größen stehen wie eine Viererkette. Der gewählte Spieler ist ausgefüllt.',
    css: '', html: () => szPage6(grp6('z-lineup', s => `<i></i><b>${s}</b>`, '<em class="pitch"></em>')) },
  { key: 'diamond', name: 'Aufstellung: Raute', tags: ['Spielfeld'], idea: 'Wie das Mittelfeld in Rautenform: S hinten, M und L auf den Seiten, XL vorne. Ein Tipp setzt den Spieler.',
    css: '', html: () => szPage6(grp6('z-diamond', s => `<i></i><b>${s}</b>`, '<em class="pitch"></em>')) },
  { key: 'board', name: 'Auswechseltafel', tags: ['Stadion'], idea: 'Die Größe leuchtet groß auf einer schwarzen Tafel wie bei der Auswechslung. Darunter die vier zum Antippen.',
    css: '', html: () => szPage6(`<div class="z-board"><span data-show>M</span></div>` + grp6('z-plain', s => s)) },
  { key: 'cards', name: 'Schiri-Karten', tags: ['Schiedsrichter'], idea: 'Die Größen sind kleine Karten. Die gewählte wird wie vom Schiri hochgehalten: sie springt hoch und wird schwarz.',
    css: '', html: () => szPage6(grp6('z-cards', s => s)) },
  { key: 'studs', name: 'Stollen', tags: ['Schuh'], idea: 'Jede Größe sitzt in einem runden Stollen wie unter einem Fußballschuh. Gewählt = ausgefüllt.',
    css: '', html: () => szPage6(grp6('z-studs', s => s)) },
  { key: 'balls', name: 'Bälle', tags: ['Ball'], idea: 'Vier kleine Bälle, nur der gewählte bekommt sein Muster und rollt kurz an seinen Platz.',
    css: '', html: () => szPage6(grp6('z-balls', s => `<i>${BALL6}</i><b>${s}</b>`)) },
  { key: 'torwand', name: 'Torwand', tags: ['Spiel'], idea: 'Wie beim Torwandschießen: vier Löcher in einer Wand. In der gewählten Größe steckt der Ball.',
    css: '', html: () => szPage6(grp6('z-torwand', s => `<i><u>${BALL6}</u></i><b>${s}</b>`)) },
  { key: 'zones', name: 'Spielfeld in vier Zonen', tags: ['Spielfeld'], idea: 'Ein langes Spielfeld, in vier Zonen geteilt. Die gewählte Zone wird hellgrau ausgemalt.',
    css: '', html: () => szPage6(grp6('z-zones', s => s)) },
  { key: 'flip', name: 'Klapptafel', tags: ['Stadion', 'Bewegung'], idea: 'Wie die alte Anzeigetafel im Stadion: beim Wechsel klappt die Größe einmal um.',
    css: '', html: () => szPage6(`<div class="z-flip"><span data-show>M</span></div>` + grp6('z-plain', s => s)) },
  { key: 'armband', name: 'Kapitänsbinde', tags: ['Spieler'], idea: 'Die gewählte Größe bekommt eine schwarze Binde wie der Kapitän. Die anderen bleiben grau.',
    css: '', html: () => szPage6(grp6('z-armband', s => s)) },
  { key: 'cones', name: 'Hütchen', tags: ['Training'], idea: 'Vier Trainingshütchen mit der Größe darunter. Das gewählte Hütchen ist schwarz und hüpft kurz.',
    css: '', html: () => szPage6(grp6('z-cones', s => `<i><svg viewBox="0 0 40 40"><path d="M20 4 L32 34 H8 Z"/><path d="M6 34 H34"/></svg></i><b>${s}</b>`)) },
  { key: 'grow', name: 'Trikot wächst mit', tags: ['Info'], idea: 'Über der Auswahl ein Trikot-Umriss, der mit der gewählten Größe größer oder kleiner wird. Man sieht den Unterschied.',
    css: '', html: () => szPage6(grp6('z-plain', s => s), { top: `<div class="z-grow">${JSVG()}</div>` }) },
  { key: 'flag', name: 'Eckfahne', tags: ['Spielfeld'], idea: 'Über die gewählte Größe weht eine kleine Eckfahne. Beim Wechsel wird sie neu eingesteckt.',
    css: '', html: () => szPage6(grp6('z-flag', s => `<i><svg viewBox="0 0 20 30"><path d="M3 29 V2"/><path class="fl" d="M3 2 L17 6 L3 11 Z"/></svg></i><b>${s}</b>`)) },
];

/* ---------------------------------------------------------------- Tasche (Warenkorb-Symbol in 3D) */
/* Dreiviertel-Ansicht einer liegenden Sporttasche: linkes Ende als Ellipse, Körper nach rechts etwas kleiner (Perspektive),
   Reißverschluss oben, zwei Griffe, Nähte rund um den Körper zeigen die Rundung. viewBox 64 x 46. */
const duf6 = (o = {}) => {
  const L = o.L || { cx: 13, cy: 27, rx: 6.5, ry: 12.5 }, R = o.R || { cx: 53, cy: 26, rx: 5.5, ry: 11 };
  const top = (x) => L.cy - L.ry + (x - L.cx) / (R.cx - L.cx) * ((R.cy - R.ry) - (L.cy - L.ry));
  const body = `M${L.cx} ${L.cy - L.ry}L${R.cx} ${R.cy - R.ry}A${R.rx} ${R.ry} 0 0 1 ${R.cx} ${R.cy + R.ry}L${L.cx} ${L.cy + L.ry}`;
  const seam = x => { const f = (x - L.cx) / (R.cx - L.cx), cy = L.cy + f * (R.cy - L.cy), ry = L.ry + f * (R.ry - L.ry), rx = L.rx + f * (R.rx - L.rx); return `M${x} ${(cy - ry).toFixed(1)}A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${x} ${(cy + ry).toFixed(1)}`; };
  const zy = x => top(x) + 3.4;
  return `<svg class="duf ${o.cls || ''}" viewBox="0 0 64 46" aria-hidden="true">
    ${o.shadow === false ? '' : `<ellipse class="sh" cx="34" cy="${L.cy + L.ry + 2}" rx="25" ry="2.4"/>`}
    ${o.strap ? `<path class="strap" d="M${L.cx + 3} ${L.cy - 2}C${L.cx - 1} -3 ${R.cx + 2} -4 ${R.cx - 2} ${R.cy - 2}"/>` : ''}
    <path class="hd2" d="M28.5 ${zy(28.5).toFixed(1)}C28.5 ${o.hh || 2} 42.5 ${o.hh || 2} 42.5 ${zy(42.5).toFixed(1)}"/>
    <path class="bd" d="${body}"/>
    <ellipse class="cap" cx="${L.cx}" cy="${L.cy}" rx="${L.rx}" ry="${L.ry}"/>
    ${o.capInner === false ? '' : `<ellipse class="ci" cx="${L.cx}" cy="${L.cy}" rx="${(L.rx * .52).toFixed(1)}" ry="${(L.ry * .58).toFixed(1)}"/>`}
    ${o.ballCap ? `<path class="pent" d="M${L.cx} ${L.cy - 4}l3 2.4-1.1 3.6h-3.8l-1.1-3.6z"/><path class="ci" d="M${L.cx} ${L.cy - 4}V${L.cy - L.ry}M${L.cx + 3} ${L.cy - 1.6}L${L.cx + L.rx} ${L.cy - 4}M${L.cx - 3} ${L.cy - 1.6}L${L.cx - L.rx} ${L.cy - 4}M${L.cx + 1.9} ${L.cy + 2}L${L.cx + 3.4} ${L.cy + L.ry - 1}M${L.cx - 1.9} ${L.cy + 2}L${L.cx - 3.4} ${L.cy + L.ry - 1}"/>` : ''}
    <path class="sm" d="${seam(20)}"/><path class="sm" d="${seam(46)}"/>
    ${(o.stripes || []).map(x => `<path class="stp" d="${seam(x)}"/>`).join('')}
    <path class="zp" d="M17 ${zy(17).toFixed(1)}L50 ${zy(50).toFixed(1)}"/>${o.open ? `<path class="gap" d="M22 ${zy(22).toFixed(1)}Q33 ${(zy(33) + 4).toFixed(1)} 44 ${zy(44).toFixed(1)}"/>` : ''}
    <rect class="pull" x="43.5" y="${(zy(44) - 0.6).toFixed(1)}" width="2.6" height="4.2" rx=".8"/>
    <path class="hd1" d="M24.5 ${zy(24.5).toFixed(1)}C24.5 ${o.hh ? o.hh - 2 : -1} 39.5 ${o.hh ? o.hh - 2 : -1} 39.5 ${zy(39.5).toFixed(1)}"/>
  </svg>`;
};
const DUF_SIDE = `<svg class="duf side" viewBox="0 0 64 46" aria-hidden="true"><ellipse class="sh" cx="32" cy="42" rx="26" ry="2.2"/>
  <path class="hd2" d="M24 16C24 5 40 5 40 16"/><path class="bd" d="M12 15H52A8.5 12 0 0 1 52 39H12A8.5 12 0 0 1 12 15Z"/>
  <path class="sm" d="M12 15A5 12 0 0 0 12 39M52 15A5 12 0 0 1 52 39"/><path class="zp" d="M14 19H50"/><rect class="pull" x="41" y="17.6" width="2.6" height="4" rx=".8"/>
  <path class="hd1" d="M22 16C22 3 42 3 42 16"/></svg>`;
const DUF_WIRE = `<svg class="duf wire" viewBox="0 0 64 46" aria-hidden="true">
  ${[13, 21, 29, 37, 45, 53].map((x, i) => { const ry = 12.5 - i * .3, rx = 6.5 - i * .2, cy = 27 - i * .2; return i === 0 ? `<ellipse class="cap" cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}"/>` : `<path class="sm" d="M${x} ${(cy - ry).toFixed(1)}A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${x} ${(cy + ry).toFixed(1)}"/>`; }).join('')}
  <path class="bd" d="M13 14.5L53 15M13 39.5L53 37"/><path class="hd1" d="M25 18C25 5 39 5 39 18"/></svg>`;
const bagPage6 = (icon, o = {}) => `<div class="sp bagpd">${H6.bar()}<header class="s-hd">${H6.logo()}<span class="s-bag bg3">${icon}<i class="s-cnt" data-n="1">1</i></span></header>
  <div class="bgbig">${icon}<i class="s-cnt" data-n="1">1</i></div>
  <div class="bgdark"><div class="lgroom"></div><span class="s-bag bg3 dk">${icon}<i class="s-cnt" data-n="1">1</i></span><span class="lgcap">über dem Zimmer</span></div>
  <span class="bgcap">Oben rechts in echter Größe · in der Mitte groß · unten über dem Zimmer</span></div>`;
const BAG6 = [
  { key: 'line3q', name: 'Dreiviertel-Ansicht, Linie', tags: ['3D', 'schlicht'], idea: 'Eine echte Sporttasche von schräg vorne: man sieht das runde Ende, die Rundung, den Reißverschluss und zwei Griffe. Nur Linien.',
    css: '', html: () => bagPage6(duf6()) },
  { key: 'fill3q', name: 'Dreiviertel, schwarz gefüllt', tags: ['3D', 'kräftig'], idea: 'Dieselbe Tasche schwarz gefüllt, Nähte und Reißverschluss in Weiß. Fällt oben rechts klar auf.',
    css: '', html: () => bagPage6(duf6({ cls: 'f' })) },
  { key: 'shade3q', name: 'Dreiviertel mit Schatten', tags: ['3D', 'Volumen'], idea: 'Linien plus weiche graue Schattierung, das Ende etwas dunkler. Wirkt am meisten wie ein echter Gegenstand.',
    css: '', html: () => bagPage6(duf6({ cls: 's' })) },
  { key: 'topview', name: 'Mehr von oben', tags: ['3D'], idea: 'Etwas mehr von oben gesehen: der Reißverschluss liegt mitten auf der Tasche, die Griffe stehen hoch.',
    css: '', html: () => bagPage6(duf6({ L: { cx: 13, cy: 28, rx: 8.5, ry: 11 }, R: { cx: 52, cy: 27, rx: 7.5, ry: 9.8 }, hh: 5 })) },
  { key: 'side', name: 'Klassisch von der Seite', tags: ['flach', 'klar'], idea: 'Die klassische Form von der Seite: lang, runde Enden, zwei Griffe. Weniger 3D, dafür sofort als Sporttasche lesbar.',
    css: '', html: () => bagPage6(DUF_SIDE) },
  { key: 'ballcap', name: 'Ende als Ball', tags: ['3D', 'Fußball'], idea: 'Das runde Ende der Tasche trägt das Muster eines Fußballs. Kleines Detail, macht sie zur Fußballtasche.',
    css: '', html: () => bagPage6(duf6({ ballCap: true, capInner: false })) },
  { key: 'stripes', name: 'Drei Streifen rundherum', tags: ['3D', 'Retro'], idea: 'Retro wie in den 70ern: drei Streifen laufen um die Tasche (ohne Marke).',
    css: '', html: () => bagPage6(duf6({ stripes: [29, 31.5, 34] })) },
  { key: 'strap', name: 'Mit Schultergurt', tags: ['3D'], idea: 'Ein langer Schultergurt spannt sich über die Tasche. Macht die Form sofort eindeutig.',
    css: '', html: () => bagPage6(duf6({ strap: true })) },
  { key: 'open', name: 'Geht auf, Trikot schaut raus', tags: ['3D', 'Bewegung'], idea: 'Ist etwas im Warenkorb, steht der Reißverschluss offen und ein grüner Kragen schaut heraus. Beim Hinzufügen geht sie auf.',
    css: '', html: () => bagPage6(duf6({ open: true, cls: 'op' })) },
  { key: 'tag', name: 'Anhänger mit Zahl', tags: ['3D', 'Bewegung'], idea: 'Die Anzahl steht nicht in einem Punkt, sondern auf einem kleinen Kofferanhänger am Griff, der leicht schaukelt.',
    css: '', html: () => bagPage6(duf6({ cls: 'tg' })) },
  { key: 'wire', name: 'Drahtmodell', tags: ['3D', 'technisch'], idea: 'Nur Ringe entlang der Tasche wie ein 3D-Gitter. Sehr leicht, technisch, passt zur Monospace-Schrift.',
    css: '', html: () => bagPage6(DUF_WIRE) },
  { key: 'tilt', name: 'Dreht sich beim Hinzufügen', tags: ['3D', 'Bewegung'], idea: 'Die Linien-Tasche dreht sich beim Hinzufügen kurz im Raum hin und her, als würde jemand sie anheben.',
    css: '', html: () => bagPage6(duf6({ cls: 'tl' })) },
];

/* ---------------------------------------------------------------- Plus: Animation beim Hinzufügen */
/* Plus in der Mitte bei (640, 600), Tasche oben rechts bei (1225, 62). Ablauf 4,4 s: Maus kommt, klickt bei 28 %, Animation, Tasche zählt 1. */
const plusPage6 = (inner = '', o = {}) => `<div class="sp pl6 ${o.cls || ''}">${H6.bar()}<header class="s-hd">${H6.logo()}<span class="s-bag">${BAG_SVG}<i class="s-cnt" data-n="1">1</i></span></header>
  ${H6.img(P6[o.pi || 0], 240, 'pl-j')}
  <div class="pl-i"><b class="nm">${P6[o.pi || 0].name}</b><span class="pd-p">54,99 €</span><div class="pd-lab">Größe <b>M</b></div>
    <div class="szp"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div></div>
  <span class="pl-btn"><svg class="pl-plus" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg>${inner}</span>${o.outer || ''}<span class="cur"></span><span class="zcap">Produktinfos und Plus doppelt so groß gezeigt</span></div>`;
const CHK = '<svg class="pl-chk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PLUS6 = [
  { key: 'check', name: 'Plus dreht sich zum Haken', tags: ['schlicht'], idea: 'Das Plus dreht sich weg, an seiner Stelle zeichnet sich ein Haken. Nach zwei Sekunden ist wieder das Plus da.', css: '', html: () => plusPage6(CHK, { cls: 'a-check' }) },
  { key: 'spin', name: 'Dreht sich, zeigt die 1', tags: ['Zahl'], idea: 'Das Plus dreht sich einmal ganz und wird zu einer kleinen schwarzen Scheibe mit der Anzahl.', css: '', html: () => plusPage6('<span class="pl-one">1</span>', { cls: 'a-spin' }) },
  { key: 'ball', name: 'Wird zum Ball und fliegt in die Tasche', tags: ['Fußball', 'Bewegung'], idea: 'Das Plus wird zum Ball, der im Bogen oben rechts in die Sporttasche fliegt. Die Tasche hüpft.', css: '', html: () => plusPage6(CHK, { cls: 'a-ball', outer: `<span class="flyx"><span class="flyy"><span class="flys">${BALL6}</span></span></span>` }) },
  { key: 'jersey', name: 'Trikot fliegt in die Tasche', tags: ['Bewegung'], idea: 'Ein kleines Trikot löst sich vom Bild und fliegt im Bogen in die Tasche. Das Plus wird zum Haken.', css: '', html: () => plusPage6(CHK, { cls: 'a-jersey', outer: `<span class="flyx"><span class="flyy"><span class="flys"><img src="${P6[0].img}" alt=""></span></span></span>` }) },
  { key: 'net', name: 'Netz zappelt', tags: ['Fußball'], idea: 'Hinter dem Plus spannt sich kurz ein kleines Tornetz, das wie nach einem Tor zappelt. Dann ein Haken.', css: '', html: () => plusPage6(CHK + '<span class="pl-net"></span>', { cls: 'a-net' }) },
  { key: 'burst', name: 'Kurze Strahlen', tags: ['Freude'], idea: 'Acht feine Striche springen aus dem Plus wie ein kleines Feuerwerk, dann bleibt ein Haken.', css: '', html: () => plusPage6(CHK + `<span class="pl-burst">${Array.from({ length: 8 }, (_, i) => `<i style="--r:${i * 45}deg"></i>`).join('')}</span>`, { cls: 'a-burst' }) },
  { key: 'fill', name: 'Kreis füllt sich', tags: ['schlicht'], idea: 'Um das Plus erscheint ein Kreis, der sich von unten schwarz füllt. Das Zeichen wird weiß und zum Haken.', css: '', html: () => plusPage6(CHK + '<span class="pl-fill"></span>', { cls: 'a-fill' }) },
  { key: 'flip', name: 'Klappt um wie die Anzeigetafel', tags: ['Stadion'], idea: 'Das Plus klappt nach vorne um wie ein Täfelchen der alten Anzeigetafel, dahinter steht die 1.', css: '', html: () => plusPage6('<span class="pl-tile"><b class="fr"><svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg></b><b class="bk">1</b></span>', { cls: 'a-flip' }) },
  { key: 'card', name: 'Schiri zeigt die Karte', tags: ['Schiedsrichter'], idea: 'Aus dem Plus springt eine kleine schwarze Karte mit Haken hoch, wie vom Schiri gezeigt, und verschwindet wieder.', css: '', html: () => plusPage6('<span class="pl-card">✓</span>', { cls: 'a-card' }) },
  { key: 'text', name: 'Wird zu „In der Tasche“', tags: ['Text'], idea: 'Das Plus schrumpft, an seiner Stelle tippt sich kurz „In der Tasche“ ein. Dann wieder das Plus.', css: '', html: () => plusPage6('<span class="pl-txt">In der Tasche</span>', { cls: 'a-text' }) },
  { key: 'line', name: 'Linie schießt zur Tasche', tags: ['Bewegung'], idea: 'Der Querstrich des Plus schießt als Linie quer übers Bild zur Tasche, die Tasche hüpft, die Linie verschwindet.', css: '', html: () => plusPage6(CHK, { cls: 'a-line', outer: '<span class="pl-shot"></span>' }) },
  { key: 'bounce', name: 'Hüpft wie ein Ball', tags: ['Fußball', 'Bewegung'], idea: 'Das Plus hüpft dreimal auf wie ein Ball, jedes Mal etwas niedriger, und landet als Haken.', css: '', html: () => plusPage6(CHK, { cls: 'a-bounce' }) },
  { key: 'ripple', name: 'Kreise wie der Anstoßkreis', tags: ['Fußball'], idea: 'Zwei dünne Kreise laufen vom Plus nach außen, wie der Anstoßkreis, dann ein Haken.', css: '', html: () => plusPage6(CHK + '<span class="pl-rip"></span><span class="pl-rip r2"></span>', { cls: 'a-ripple' }) },
  { key: 'draw', name: 'Wird ausradiert, Haken gezeichnet', tags: ['Handschrift'], idea: 'Das Plus verschwindet Strich für Strich, dann zeichnet sich der Haken wie mit einem Stift.', css: '', html: () => plusPage6(CHK, { cls: 'a-draw' }) },
];

const PDP6_CSS = `
/* Hinweise */
.m6 .hin-pd { height: 800px; }
.m6 .hl { position: absolute; inset: 0; width: 1280px; height: 800px; pointer-events: none; fill: none; stroke: #000; stroke-width: 1; }
.m6 .hl circle { fill: #000; stroke: none; }
.m6 .hl.dash path { stroke-dasharray: 4 4; }
.m6 .hl.bp path { stroke: #9a9a9a; } .m6 .hl.hd path { stroke-width: 1.6; stroke-linecap: round; }
.m6 .hb { position: absolute; display: grid; grid-template-rows: 1fr auto; background: #fff; border: 1px solid #000; }
.m6 .hb .hz { display: block; border-bottom: 1px solid #000; background-repeat: no-repeat; }
.m6 .ht { padding: 8px 10px; font-size: 10px; line-height: 1.35; letter-spacing: .04em; color: #555; }
.m6 .ht b { font-weight: 400; color: #000; text-transform: uppercase; letter-spacing: .08em; margin-right: 4px; }
.m6 .ht.c { text-align: center; padding: 6px 0 0; }
.m6 .hb.tx { display: grid; align-content: center; gap: 4px; padding: 10px 14px; }
.m6 .htt { font-weight: 400; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; } .m6 .htd { font-size: 11px; color: #666; }
.m6 .hb.rd { border: 0; background: none; justify-items: center; grid-template-rows: auto auto; }
.m6 .hc { display: block; border-radius: 50%; border: 1px solid #000; background-repeat: no-repeat; background-color: #fff; }
.m6 .hb.cn { border: 0; background: linear-gradient(#000, #000) 0 0/18px 1px, linear-gradient(#000, #000) 0 0/1px 18px, linear-gradient(#000, #000) 100% 0/18px 1px, linear-gradient(#000, #000) 100% 0/1px 18px,
  linear-gradient(#000, #000) 0 100%/18px 1px, linear-gradient(#000, #000) 0 100%/1px 18px, linear-gradient(#000, #000) 100% 100%/18px 1px, linear-gradient(#000, #000) 100% 100%/1px 18px, #fff; background-repeat: no-repeat; }
.m6 .hb.cn .hz { border: 0; margin: 8px 8px 0; }
.m6 .hn { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #000; color: #fff; font-size: 11px; display: grid; place-items: center; }
.m6 .hlist { position: absolute; left: 90px; top: 180px; width: 300px; margin: 0; padding: 0 0 0 22px; display: grid; gap: 14px; font-size: 11px; color: #555; }
.m6 .hlist b { font-weight: 400; color: #000; text-transform: uppercase; letter-spacing: .08em; margin-right: 6px; }
.m6 .hp { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #000; box-shadow: 0 0 0 4px rgb(0 0 0 / .12); }
.m6 .hl.cyc path, .m6 .hl.cyc circle { opacity: 0; animation: cyc6 8s infinite; }
.m6 .hb.cyc { opacity: 0; animation: cyc6 8s infinite; }
${CALL6.map((c, i) => `.m6 .hl.cyc path:nth-of-type(${i + 1}), .m6 .hl.cyc circle:nth-of-type(${i + 1}) { animation-delay: ${i * 2}s; }`).join('\n')}
.m6 .hb.cyc { animation-delay: calc(var(--i) * 2s); }
@keyframes cyc6 { 0% { opacity: 0; transform: translateY(6px); } 4%, 22% { opacity: 1; transform: none; } 26%, 100% { opacity: 0; } }
.m6 .hbp { position: absolute; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: #000; display: grid; gap: 2px; white-space: nowrap; }
.m6 .hbp i { font-style: normal; text-transform: none; letter-spacing: .02em; color: #888; }
.m6 .hw { position: absolute; font: 700 30px/1 'Caveat', cursive; color: #000; text-align: center; transform: rotate(-3deg); }
.m6 .hw small { font-size: 20px; font-weight: 500; }
.m6 .one { position: absolute; inset: 0; opacity: 0; animation: one6 8s infinite; animation-delay: calc(var(--i) * 2s); }
@keyframes one6 { 0% { opacity: 0; } 3%, 23% { opacity: 1; } 26%, 100% { opacity: 0; } }
.m6 .hstrip { display: flex; justify-content: center; gap: 22px; margin-top: 10px; }
.m6 .hstrip span { display: grid; justify-items: center; gap: 8px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.m6 .hstrip i { width: 110px; height: 110px; background-repeat: no-repeat; background-color: #f6f6f6; }

/* Größenwahl */
.m6 .szpd .pd-i { gap: 12px; scale: 1.6; transform-origin: 50% 0; margin-top: 4px; }
.m6 .zcap, .m6 .pl6 .zcap { position: absolute; left: 40px; bottom: 16px; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: #9a9a9a; }
.m6 .szx { display: flex; gap: 18px; align-items: flex-end; position: relative; }
.m6 .szx > span { display: grid; justify-items: center; gap: 4px; font-size: 13px; color: #767676; cursor: pointer; transition: color .25s, transform .3s cubic-bezier(.3,1.6,.5,1); }
.m6 .szx > span.on { color: #000; }
.m6 .z-plain > span { min-width: 30px; height: 30px; place-items: center; } .m6 .z-plain > span.on { text-decoration: underline; text-underline-offset: 6px; }
.m6 .z-shirts > span { position: relative; width: 52px; height: 52px; place-items: center; }
.m6 .z-shirts svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: #fff; stroke: #bdbdbd; stroke-width: 2; transition: fill .25s, stroke .25s; }
.m6 .z-shirts b { position: relative; font-weight: 400; font-size: 12px; margin-top: 6px; }
.m6 .z-shirts .on svg { fill: #000; stroke: #000; } .m6 .z-shirts .on b { color: #fff; } .m6 .z-shirts .on { transform: translateY(-4px); }
.m6 .z-lineup, .m6 .z-diamond { width: 300px; height: 92px; justify-content: space-around; align-items: center; }
.m6 .pitch { position: absolute; inset: 0; border: 1px solid #cfcfcf; background: linear-gradient(#cfcfcf, #cfcfcf) 50% 0/1px 100% no-repeat; }
.m6 .pitch::after { content: ""; position: absolute; left: 50%; top: 50%; width: 36px; height: 36px; margin: -18px; border: 1px solid #cfcfcf; border-radius: 50%; }
.m6 .z-lineup > span, .m6 .z-diamond > span { position: relative; z-index: 1; }
.m6 .z-lineup i, .m6 .z-diamond i { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #000; background: #fff; transition: background .25s, transform .3s; }
.m6 .z-lineup b, .m6 .z-diamond b { font-weight: 400; font-size: 11px; }
.m6 .z-lineup .on i, .m6 .z-diamond .on i { background: #000; transform: scale(1.2); }
.m6 .z-diamond { display: block; } .m6 .z-diamond > span { position: absolute; }
.m6 .z-diamond > span:nth-of-type(1) { left: 22px; top: 26px; } .m6 .z-diamond > span:nth-of-type(2) { left: 104px; top: 2px; }
.m6 .z-diamond > span:nth-of-type(3) { left: 104px; top: 50px; } .m6 .z-diamond > span:nth-of-type(4) { left: 196px; top: 26px; }
.m6 .z-board { width: 110px; height: 64px; background: #0c0c0c; display: grid; place-items: center; border-radius: 4px; box-shadow: inset 0 0 0 3px #222; }
.m6 .z-board span { font-size: 34px; letter-spacing: .05em; color: #fff; text-shadow: 0 0 8px rgb(255 255 255 / .55);
  -webkit-mask: radial-gradient(circle, #000 1.3px, transparent 1.6px) 0 0/4px 4px; mask: radial-gradient(circle, #000 1.3px, transparent 1.6px) 0 0/4px 4px; }
.m6 .z-cards > span { width: 36px; height: 50px; place-items: center; border: 1.5px solid #c4c4c4; border-radius: 4px; font-size: 12px; transition: all .3s cubic-bezier(.3,1.6,.5,1); }
.m6 .z-cards > span.on { background: #000; border-color: #000; color: #fff; transform: translateY(-12px) rotate(-6deg); }
.m6 .z-studs > span { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid #c4c4c4; place-items: center; box-shadow: inset 0 0 0 5px #fff, inset 0 0 0 6.5px #e3e3e3; }
.m6 .z-studs > span.on { background: #000; border-color: #000; color: #fff; box-shadow: inset 0 0 0 5px #000, inset 0 0 0 6.5px #555; }
.m6 .z-balls i { width: 32px; height: 32px; display: block; transition: transform .5s; } .m6 .z-balls i svg { width: 100%; height: 100%; }
.m6 .z-balls > span:not(.on) i svg * { fill: #fff; stroke: #d0d0d0; } .m6 .z-balls .on i { transform: rotate(360deg); } .m6 .z-balls b { font-weight: 400; font-size: 11px; }
.m6 .z-torwand { padding: 12px 18px; background: #f2f2f2; gap: 14px; }
.m6 .z-torwand i { width: 38px; height: 38px; border-radius: 50%; background: #fff; box-shadow: inset 0 2px 4px rgb(0 0 0 / .25); display: grid; place-items: center; }
.m6 .z-torwand u { width: 26px; height: 26px; opacity: 0; transform: scale(.3); transition: all .35s cubic-bezier(.3,1.6,.5,1); } .m6 .z-torwand u svg { width: 100%; height: 100%; }
.m6 .z-torwand .on u { opacity: 1; transform: none; } .m6 .z-torwand b { font-weight: 400; font-size: 11px; }
.m6 .z-zones { gap: 0; border: 1px solid #000; } .m6 .z-zones > span { width: 72px; height: 44px; place-items: center; border-right: 1px solid #000; transition: background .3s; }
.m6 .z-zones > span:last-child { border-right: 0; } .m6 .z-zones > span.on { background: #ececec; }
.m6 .z-flip { width: 64px; height: 70px; perspective: 300px; } .m6 .z-flip span { display: grid; place-items: center; width: 100%; height: 100%; background: #111; color: #fff; font-size: 34px; border-radius: 4px;
  background-image: linear-gradient(transparent 49%, #000 49% 51%, transparent 51%); animation: flip6 1.3s infinite; transform-origin: 50% 50%; }
@keyframes flip6 { 0% { transform: rotateX(90deg); } 18%, 100% { transform: none; } }
.m6 .z-armband > span { min-width: 44px; height: 30px; place-items: center; border-radius: 15px; transition: all .3s; } .m6 .z-armband > span.on { background: #000; color: #fff; }
.m6 .z-cones i { width: 34px; height: 34px; display: block; transition: transform .3s cubic-bezier(.3,1.6,.5,1); } .m6 .z-cones svg { width: 100%; height: 100%; fill: #fff; stroke: #bdbdbd; stroke-width: 2; stroke-linejoin: round; }
.m6 .z-cones .on svg { fill: #000; stroke: #000; } .m6 .z-cones .on i { transform: translateY(-6px); } .m6 .z-cones b { font-weight: 400; font-size: 11px; }
.m6 .z-grow { height: 220px; display: grid; place-items: center; }
.m6 .z-grow svg { width: 190px; height: 190px; fill: none; stroke: #000; stroke-width: .8; transition: transform .45s cubic-bezier(.3,1.4,.5,1); }
.m6[data-sel="S"] .z-grow svg { transform: scale(.8); } .m6[data-sel="M"] .z-grow svg { transform: scale(.9); } .m6[data-sel="L"] .z-grow svg { transform: scale(1); } .m6[data-sel="XL"] .z-grow svg { transform: scale(1.1); }
.m6 .z-flag i { width: 20px; height: 30px; display: block; opacity: 0; transform: translateY(8px); transition: all .35s; } .m6 .z-flag svg { width: 100%; height: 100%; fill: none; stroke: #000; stroke-width: 1.4; }
.m6 .z-flag .fl { fill: #000; } .m6 .z-flag .on i { opacity: 1; transform: none; } .m6 .z-flag b { font-weight: 400; font-size: 13px; }

/* Tasche */
.m6 .duf { --sw: 1; overflow: visible; fill: none; stroke: #000; stroke-width: calc(1.7px * var(--sw)); stroke-linecap: round; stroke-linejoin: round; }
.m6 .duf .sh { fill: rgb(0 0 0 / .1); stroke: none; } .m6 .duf .bd, .m6 .duf .cap { fill: #fff; } .m6 .duf .ci, .m6 .duf .sm { stroke-width: calc(1.1px * var(--sw)); }
.m6 .duf .hd2 { stroke-width: calc(1.4px * var(--sw)); opacity: .55; } .m6 .duf .pull { fill: #000; stroke: none; } .m6 .duf .zp { stroke-width: calc(1.2px * var(--sw)); stroke-dasharray: 1.6 1.2; }
.m6 .duf .stp, .m6 .duf .strap { stroke-width: calc(1.3px * var(--sw)); } .m6 .duf .pent { fill: #000; stroke: none; }
.m6 .bgbig .duf { --sw: 2.6; } .m6 .bgbig .duf * { vector-effect: non-scaling-stroke; } .m6 .bgbig .duf .zp { stroke-dasharray: 9 7; }
.m6 .duf.f .bd, .m6 .duf.f .cap { fill: #000; } .m6 .duf.f .ci, .m6 .duf.f .sm, .m6 .duf.f .zp { stroke: #fff; } .m6 .duf.f .pull { fill: #fff; }
.m6 .duf.s .bd { fill: #ededed; } .m6 .duf.s .cap { fill: #cdcdcd; } .m6 .duf.s .ci { fill: #b8b8b8; } .m6 .duf.s .sh { fill: rgb(0 0 0 / .18); }
.m6 .duf.op .gap { stroke: #0d5a33; stroke-width: 2.6; } .m6 .duf.side .bd { fill: #fff; } .m6 .duf.wire .bd { fill: none; } .m6 .duf.wire .cap { fill: #fff; }
.m6 .bagpd .s-bag.bg3 { width: 40px; height: 29px; } .m6 .bagpd .s-bag.bg3 .duf { width: 100%; height: 100%; }
.m6 .bgbig { position: absolute; left: 50%; top: 150px; width: 460px; height: 330px; margin-left: -230px; }
.m6 .bgbig .duf { width: 100%; height: 100%; }
.m6 .bgbig .s-cnt { top: 30px; right: 0; transform: scale(2.2); transform-origin: 100% 0; }
.m6 .bgdark { position: absolute; left: 0; right: 0; bottom: 0; height: 120px; overflow: hidden; }
.m6 .bgdark .s-bag { position: absolute; right: 40px; top: 46px; } .m6 .bgdark .duf { stroke: #fff; } .m6 .bgdark .duf .bd, .m6 .bgdark .duf .cap { fill: rgb(0 0 0 / .25); }
.m6 .bgdark .duf .pull, .m6 .bgdark .duf .pent { fill: #fff; } .m6 .bgdark .s-cnt { background: #fff; color: #000; }
.m6 .bgcap { position: absolute; left: 0; right: 0; top: 520px; text-align: center; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #9a9a9a; }
.m6 .bagpd .s-hd .s-bag, .m6 .bgbig { animation: bump6 3.6s infinite; }
@keyframes bump6 { 0%, 60% { transform: none; } 66% { transform: scale(1.18) rotate(-4deg); } 72% { transform: scale(.96); } 78%, 100% { transform: none; } }
.m6 .bgbig { transform-origin: 50% 70%; } .m6 .bgbig { animation-name: bumpBig6; }
@keyframes bumpBig6 { 0%, 60% { transform: none; } 66% { transform: scale(1.05) rotate(-2deg); } 72% { transform: scale(.99); } 78%, 100% { transform: none; } }
.m6 .duf.op .gap { animation: gap6 3.6s infinite; } @keyframes gap6 { 0%, 58% { opacity: 0; } 66%, 100% { opacity: 1; } }
.m6 .duf.tl { animation: tilt6 3.6s infinite; transform-origin: 50% 80%; } @keyframes tilt6 { 0%, 58% { transform: none; } 66% { transform: perspective(200px) rotateY(28deg) rotateX(8deg); } 74% { transform: perspective(200px) rotateY(-18deg); } 82%, 100% { transform: none; } }
.m6 .duf.tg ~ .s-cnt { top: 14px; right: -10px; width: 14px; height: 18px; border-radius: 2px 2px 4px 4px; transform-origin: 50% -6px; animation: swing6 2.4s ease-in-out infinite; }
.m6 .duf.tg ~ .s-cnt::before { content: ""; position: absolute; left: 50%; top: -7px; height: 7px; border-left: 1px solid #000; }
.m6 .bgdark .duf.tg ~ .s-cnt::before { border-color: #fff; }
@keyframes swing6 { 0%, 100% { transform: rotate(8deg); } 50% { transform: rotate(-8deg); } }

/* Plus */
.m6 .pl6 { height: 720px; }
.m6 .pl-j { position: absolute; left: 50%; top: 104px; transform: translateX(-50%); }
.m6 .pl-i { position: absolute; left: 0; right: 0; top: 366px; display: grid; justify-items: center; gap: 8px; scale: 1.5; transform-origin: 50% 0; }
.m6 .pl-btn { position: absolute; left: 618px; top: 578px; width: 44px; height: 44px; display: grid; place-items: center; scale: 2; }
.m6 .pl-btn > svg { position: absolute; left: 11px; top: 11px; width: 22px; height: 22px; fill: none; stroke: #000; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
.m6 .pl-chk { opacity: 0; } .m6 .pl-chk path { stroke-dasharray: 24; stroke-dashoffset: 24; }
.m6 .pl6 .cur { left: 0; top: 0; animation: cur6 4.4s infinite; }
@keyframes cur6 { 0% { transform: translate(900px, 700px); opacity: 0; } 8% { opacity: 1; } 24% { transform: translate(636px, 600px); } 27% { transform: translate(636px, 600px) scale(.8); } 30% { transform: translate(636px, 600px); }
  70% { transform: translate(660px, 640px); opacity: 1; } 84%, 100% { transform: translate(900px, 700px); opacity: 0; } }
.m6 .pl6 .s-cnt { animation: cnt6 4.4s infinite; }
@keyframes cnt6 { 0%, 50% { opacity: 0; transform: scale(.3); } 55% { opacity: 1; transform: scale(1.4); } 60%, 88% { opacity: 1; transform: none; } 95%, 100% { opacity: 0; } }
.m6 .pl6 .s-bag .bagi { animation: bagb6 4.4s infinite; transform-origin: 50% 80%; }
@keyframes bagb6 { 0%, 49% { transform: none; } 53% { transform: scale(1.25) rotate(-6deg); } 58% { transform: scale(.95); } 62%, 100% { transform: none; } }
/* gemeinsam: Plus weg, Haken da (zwischen 30 % und 85 %) */
@keyframes plusOut6 { 0%, 28% { opacity: 1; transform: none; } 34%, 86% { opacity: 0; transform: rotate(90deg) scale(.3); } 92%, 100% { opacity: 1; transform: none; } }
@keyframes chkIn6 { 0%, 34% { opacity: 1; stroke-dashoffset: 24; } 44%, 84% { opacity: 1; stroke-dashoffset: 0; } 90%, 100% { opacity: 0; stroke-dashoffset: 0; } }
.m6 .a-check .pl-plus, .m6 .a-net .pl-plus, .m6 .a-burst .pl-plus, .m6 .a-ripple .pl-plus { animation: plusOut6 4.4s infinite; }
.m6 .a-check .pl-chk, .m6 .a-net .pl-chk, .m6 .a-burst .pl-chk, .m6 .a-ripple .pl-chk, .m6 .a-ball .pl-chk, .m6 .a-jersey .pl-chk, .m6 .a-line .pl-chk { opacity: 1; }
.m6 .a-check .pl-chk path, .m6 .a-net .pl-chk path, .m6 .a-burst .pl-chk path, .m6 .a-ripple .pl-chk path, .m6 .a-ball .pl-chk path, .m6 .a-jersey .pl-chk path, .m6 .a-line .pl-chk path { animation: chkIn6 4.4s infinite; }
.m6 .a-ball .pl-chk path, .m6 .a-jersey .pl-chk path, .m6 .a-line .pl-chk path { animation-name: chkLate6; }
@keyframes chkLate6 { 0%, 50% { stroke-dashoffset: 24; } 58%, 84% { stroke-dashoffset: 0; } 90%, 100% { stroke-dashoffset: 24; } }
.m6 .a-spin .pl-plus { animation: spin6 4.4s infinite; }
@keyframes spin6 { 0%, 28% { transform: none; opacity: 1; } 40% { transform: rotate(360deg) scale(.2); opacity: 0; } 86% { transform: rotate(360deg) scale(.2); opacity: 0; } 92%, 100% { transform: none; opacity: 1; } }
.m6 .pl-one { position: absolute; inset: 6px; border-radius: 50%; background: #000; color: #fff; display: grid; place-items: center; font-size: 15px; opacity: 0; animation: one16 4.4s infinite; }
@keyframes one16 { 0%, 36% { opacity: 0; transform: scale(.2); } 44% { opacity: 1; transform: scale(1.15); } 50%, 84% { opacity: 1; transform: none; } 90%, 100% { opacity: 0; transform: scale(.2); } }
.m6 .flyx { position: absolute; left: 610px; top: 570px; width: 60px; height: 60px; opacity: 0; animation: flyx6 4.4s infinite linear; }
.m6 .flyy, .m6 .flys { display: block; width: 100%; height: 100%; } .m6 .flyy { animation: flyy6 4.4s infinite; } .m6 .flys { animation: flys6 4.4s infinite; }
.m6 .flys svg, .m6 .flys img { display: block; width: 100%; height: 100%; object-fit: contain; }
@keyframes flys6 { 0%, 30% { transform: none; } 50%, 100% { transform: scale(.45); } }
@keyframes flyx6 { 0%, 29% { transform: none; opacity: 0; } 30% { opacity: 1; } 50% { transform: translateX(585px); opacity: 1; } 52%, 100% { transform: translateX(585px); opacity: 0; } }
@keyframes flyy6 { 0%, 29% { transform: none; } 38% { transform: translateY(-400px); animation-timing-function: ease-in; } 50%, 100% { transform: translateY(-538px); } }
.m6 .a-ball .pl-plus, .m6 .a-jersey .pl-plus, .m6 .a-line .pl-plus { animation: plusOut6 4.4s infinite; }
.m6 .a-ball .flys svg { animation: rot6 .5s linear infinite; } @keyframes rot6 { to { transform: rotate(360deg); } }
.m6 .a-jersey .flyx { left: 590px; top: 174px; width: 100px; height: 100px; animation-name: flyxj6; } .m6 .a-jersey .flyy { animation-name: flyyj6; }
@keyframes flyxj6 { 0%, 29% { transform: none; opacity: 0; } 30% { opacity: 1; } 50% { transform: translateX(585px); opacity: 1; } 52%, 100% { transform: translateX(585px); opacity: 0; } }
@keyframes flyyj6 { 0%, 29% { transform: none; } 40% { transform: translateY(-205px); animation-timing-function: ease-in; } 50%, 100% { transform: translateY(-162px); } }
.m6 .a-jersey .flys { animation-name: flysj6; } @keyframes flysj6 { 0%, 30% { transform: none; } 50%, 100% { transform: scale(.3); } }
.m6 .pl-net { position: absolute; inset: -10px -16px; z-index: -1; border: 1px solid #000; background: repeating-linear-gradient(0deg, transparent 0 5px, #bbb 5px 6px), repeating-linear-gradient(90deg, transparent 0 5px, #bbb 5px 6px);
  opacity: 0; animation: net6 4.4s infinite; transform-origin: 50% 0; }
@keyframes net6 { 0%, 28% { opacity: 0; transform: scaleY(.2); } 32% { opacity: 1; transform: scale(1.12, 1.18); } 36% { transform: scale(.96, .92); } 40% { transform: scale(1.04, 1.06); } 44%, 70% { transform: none; opacity: 1; } 78%, 100% { opacity: 0; } }
.m6 .pl-burst i { position: absolute; left: 50%; top: 50%; width: 1.5px; height: 10px; margin: -5px 0 0 -.75px; background: #000; opacity: 0; transform: rotate(var(--r)) translateY(-14px); animation: burst6 4.4s infinite; }
@keyframes burst6 { 0%, 28% { opacity: 0; transform: rotate(var(--r)) translateY(-10px) scaleY(.2); } 32% { opacity: 1; } 42% { opacity: 0; transform: rotate(var(--r)) translateY(-30px) scaleY(1); } 100% { opacity: 0; } }
.m6 .pl-fill { position: absolute; inset: 2px; z-index: -1; border-radius: 50%; border: 1.5px solid #000; background: linear-gradient(#000, #000) 0 100%/100% 0 no-repeat; opacity: 0; animation: fill6 4.4s infinite; }
@keyframes fill6 { 0%, 26% { opacity: 0; background-size: 100% 0; } 30% { opacity: 1; background-size: 100% 0; } 42%, 84% { opacity: 1; background-size: 100% 100%; } 92%, 100% { opacity: 0; background-size: 100% 100%; } }
.m6 .a-fill .pl-plus { animation: fillp6 4.4s infinite; } @keyframes fillp6 { 0%, 34% { stroke: #000; opacity: 1; } 40%, 86% { opacity: 0; } 92%, 100% { opacity: 1; stroke: #000; } }
.m6 .a-fill .pl-chk { opacity: 1; } .m6 .a-fill .pl-chk path { stroke: #fff; animation: chkIn6 4.4s infinite; animation-delay: .2s; }
.m6 .a-flip .pl-plus { display: none; } .m6 .pl-tile { position: absolute; inset: 4px; transform-style: preserve-3d; animation: tile6 4.4s infinite; }
.m6 .pl-tile b { position: absolute; inset: 0; display: grid; place-items: center; backface-visibility: hidden; font-weight: 400; font-size: 16px; }
.m6 .pl-tile .fr svg { width: 22px; height: 22px; fill: none; stroke: #000; stroke-width: 1.6; stroke-linecap: round; } .m6 .pl-tile .bk { background: #000; color: #fff; border-radius: 3px; transform: rotateX(180deg); }
@keyframes tile6 { 0%, 28% { transform: perspective(200px) rotateX(0); } 38%, 84% { transform: perspective(200px) rotateX(180deg); } 94%, 100% { transform: perspective(200px) rotateX(360deg); } }
.m6 .pl-card { position: absolute; left: 10px; top: -6px; width: 26px; height: 36px; background: #000; color: #fff; border-radius: 3px; display: grid; place-items: center; font-size: 14px; opacity: 0; animation: card6 4.4s infinite; transform-origin: 50% 100%; }
@keyframes card6 { 0%, 28% { opacity: 0; transform: translateY(10px) scale(.4); } 34% { opacity: 1; transform: translateY(-26px) rotate(-12deg); } 40%, 70% { opacity: 1; transform: translateY(-22px) rotate(-8deg); } 80%, 100% { opacity: 0; transform: translateY(0) scale(.4); } }
.m6 .a-card .pl-plus { animation: plusOut6 4.4s infinite; }
.m6 .pl-txt { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); white-space: nowrap; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; overflow: hidden; width: 0; animation: txt6 4.4s infinite steps(13, end); }
@keyframes txt6 { 0%, 32% { width: 0; } 46%, 84% { width: 16ch; } 90%, 100% { width: 0; } }
.m6 .a-text .pl-plus { animation: plusOut6 4.4s infinite; }
.m6 .pl-shot { position: absolute; left: 640px; top: 599px; width: 794px; height: 1.5px; background: #000; transform-origin: 0 50%; transform: rotate(-42.55deg) scaleX(0); animation: shot6 4.4s infinite; }
@keyframes shot6 { 0%, 29% { transform: rotate(-42.55deg) scaleX(0); opacity: 1; } 40% { transform: rotate(-42.55deg) scaleX(.97); opacity: 1; } 48% { opacity: 0; } 100% { opacity: 0; } }
.m6 .a-bounce .pl-btn { animation: bnc6 4.4s infinite; }
@keyframes bnc6 { 0%, 28% { transform: none; } 33% { transform: translateY(-46px); animation-timing-function: ease-in; } 38% { transform: none; animation-timing-function: ease-out; } 42% { transform: translateY(-22px); animation-timing-function: ease-in; }
  46% { transform: none; animation-timing-function: ease-out; } 49% { transform: translateY(-8px); animation-timing-function: ease-in; } 52%, 100% { transform: none; } }
.m6 .a-bounce .pl-plus { animation: plusLate6 4.4s infinite; } @keyframes plusLate6 { 0%, 50% { opacity: 1; } 54%, 86% { opacity: 0; } 92%, 100% { opacity: 1; } }
.m6 .a-bounce .pl-chk { opacity: 1; } .m6 .a-bounce .pl-chk path { animation: chkLate6 4.4s infinite; }
.m6 .pl-rip { position: absolute; inset: 0; border-radius: 50%; border: 1px solid #000; opacity: 0; animation: rip6 4.4s infinite; } .m6 .pl-rip.r2 { animation-delay: .25s; }
@keyframes rip6 { 0%, 28% { opacity: 0; transform: scale(.4); } 30% { opacity: 1; } 46%, 100% { opacity: 0; transform: scale(3.2); } }
.m6 .a-draw .pl-plus path { stroke-dasharray: 34; animation: erase6 4.4s infinite; } @keyframes erase6 { 0%, 28% { stroke-dashoffset: 0; } 38%, 86% { stroke-dashoffset: 34; } 94%, 100% { stroke-dashoffset: 0; } }
.m6 .a-draw .pl-chk { opacity: 1; } .m6 .a-draw .pl-chk path { stroke-width: 2.2; animation: chkDraw6 4.4s infinite; }
@keyframes chkDraw6 { 0%, 38% { stroke-dashoffset: 24; } 50%, 84% { stroke-dashoffset: 0; } 90%, 100% { stroke-dashoffset: 24; } }
`;
