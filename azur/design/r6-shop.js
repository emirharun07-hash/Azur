/* Runde 15: Logo-Platz, Karten im FIFA-Stil, Anordnung der Trikots, Größe der Trikots. Alles auf der weißen Shop-Seite. */
const [B6, D6, T6] = P6;
const cells6 = (list, o = {}) => list.map(([p, x, y, s]) => H6.cell(p, x, y, s || 300, o)).join('');
const row6 = (y = 150, s = 300) => cells6(P6.map((p, i) => [p, 240 + i * 400, y, s]));

/* ---------------------------------------------------------------- Logo */
/* unten ein Streifen: derselbe Header über dem Zimmer (Startseite) */
const logoPage6 = (hd, o = {}) => `<div class="sp">${o.bar === false ? '' : H6.bar()}${hd('ink')}${o.body || row6(o.y || 150, o.s || 280)}</div>
  <div class="lgband"><div class="lgroom"></div>${hd('paper')}<span class="lgcap">So über dem Zimmer</span></div>`;
const hdl6 = (cls, inner) => tone => `<header class="s-hd lg ${cls}">${inner(tone)}</header>`;
const bag6 = () => H6.bag(0);
const LOGO6 = [
  { key: 'now', name: 'Wie jetzt: klein links', tags: ['Vergleich'], idea: 'So ist es heute: die Signatur klein oben links, die Tasche rechts. Zum Vergleich.',
    css: '', html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6())) },
  { key: 'left32', name: 'Links, etwas größer', tags: ['links'], idea: 'Gleicher Platz, die Signatur aber gut ein Drittel größer. Fällt mehr auf, bleibt ruhig.',
    css: '.L-left32 .s-logo { height: 32px; }', html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6())) },
  { key: 'left48', name: 'Links, groß', tags: ['links', 'auffällig'], idea: 'Die Signatur doppelt so groß, der Header etwas höher. Die Marke steht klar im Vordergrund.',
    css: '.L-left48 .s-hd { height: 100px; } .L-left48 .s-logo { height: 48px; }', html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6()), { y: 170 }) },
  { key: 'center', name: 'Mitte, klein', tags: ['Mitte'], idea: 'Wie bei vielen Modeshops: die Signatur genau in der Mitte, die Tasche rechts. Links bleibt frei.',
    css: '.L-center .s-hd .s-logo { position: absolute; left: 50%; transform: translateX(-50%); } .L-center .s-hd { justify-content: flex-end; }',
    html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6())) },
  { key: 'center40', name: 'Mitte, groß', tags: ['Mitte', 'auffällig'], idea: 'Die Signatur groß in der Mitte über den Trikots, wie ein Titel. Die Tasche rechts daneben.',
    css: '.L-center40 .s-hd { height: 96px; justify-content: flex-end; } .L-center40 .s-hd .s-logo { position: absolute; left: 50%; transform: translateX(-50%); height: 42px; }',
    html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6()), { y: 170 }) },
  { key: 'abovebar', name: 'Ganz oben, über der Leiste', tags: ['Mitte'], idea: 'Die Signatur steht als Erstes ganz oben in der Mitte, die graue Leiste mit Rückgabe und Versand kommt darunter.',
    css: '.L-abovebar .s-hd { height: 76px; justify-content: flex-end; } .L-abovebar .s-hd .s-logo { position: absolute; left: 50%; transform: translateX(-50%); height: 30px; } .L-abovebar .s-bar { height: 26px; border-top: 1px solid #eee; }',
    html: () => `<div class="sp">${hdl6('', t => H6.logo(t) + bag6())('ink')}${H6.bar()}${row6(160, 280)}</div><div class="lgband"><div class="lgroom"></div>${hdl6('', t => H6.logo(t) + bag6())('paper')}<span class="lgcap">So über dem Zimmer</span></div>` },
  { key: 'gridleft', name: 'Bündig mit dem ersten Trikot', tags: ['links', 'Raster'], idea: 'Die Signatur steht genau über der linken Kante des ersten Trikots. Logo und Raster bilden eine Linie.',
    css: '.L-gridleft .s-hd { padding-left: 125px; padding-right: 125px; } .L-gridleft .s-logo { height: 26px; }', html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6())) },
  { key: 'title', name: 'Groß über den Trikots, Header leer', tags: ['Mitte', 'auffällig'], idea: 'Oben steht nur die Tasche. Die Signatur ist groß über den Trikots, als Titel der Seite, und scrollt mit.',
    css: '.L-title .s-hd { justify-content: flex-end; } .L-title .ttl { position: absolute; left: 50%; top: 104px; transform: translateX(-50%); height: 70px; width: auto; }',
    html: () => logoPage6(t => `<header class="s-hd lg">${bag6()}</header>`, { body: `<img class="ttl" src="img/azur-logo-ink.webp" alt="">${row6(200, 260)}` }) },
  { key: 'vertical', name: 'Senkrecht am linken Rand', tags: ['links', 'ungewöhnlich'], idea: 'Die Signatur steht hochkant am linken Rand und bleibt beim Scrollen dort, wie ein Etikett an der Seite.',
    css: '.L-vertical .s-hd { justify-content: flex-end; } .L-vertical .vlogo { position: absolute; left: 6px; top: 300px; height: 30px; width: auto; transform: rotate(-90deg); transform-origin: 50% 50%; }',
    html: () => logoPage6(t => `<header class="s-hd lg">${bag6()}</header><img class="vlogo" src="img/azur-logo-${t}.webp" alt="">`) },
  { key: 'box', name: 'Im schwarzen Feld', tags: ['links', 'auffällig'], idea: 'Die Signatur in Weiß auf einem kleinen schwarzen Feld in der Ecke, wie ein Aufnäher. Sticht auf Weiß klar heraus.',
    css: '.L-box .s-hd { padding-left: 0; } .L-box .lbx { width: 96px; height: 64px; background: #000; display: grid; place-items: center; } .L-box .lbx .s-logo { height: 24px; } .L-box .lgband .lbx { background: #fff; }',
    html: () => logoPage6(t => `<header class="s-hd lg"><span class="lbx">${H6.logo(t === 'ink' ? 'paper' : 'ink')}</span>${bag6()}</header>`) },
  { key: 'bottomleft', name: 'Unten links in der Ecke', tags: ['links', 'ungewöhnlich'], idea: 'Oben nur die Tasche. Die Signatur sitzt fest unten links und bleibt dort beim Scrollen, wie eine Unterschrift auf einem Bild.',
    css: '.L-bottomleft .s-hd { justify-content: flex-end; } .L-bottomleft .sp .blg { position: absolute; left: 40px; bottom: 170px; height: 30px; width: auto; } .L-bottomleft .lgband .blg { position: absolute; left: 40px; bottom: 16px; height: 26px; }',
    html: () => logoPage6(t => `<header class="s-hd lg">${bag6()}</header><img class="blg" src="img/azur-logo-${t}.webp" alt="">`) },
  { key: 'shrink', name: 'Mitte groß, beim Scrollen klein links', tags: ['Bewegung'], idea: 'Beim Öffnen steht die Signatur groß in der Mitte. Sobald man scrollt, wird sie klein und rutscht nach links in den Header.',
    css: `.L-shrink .s-hd { justify-content: flex-end; } .L-shrink .s-hd .s-logo { position: absolute; left: 40px; top: 21px; height: 22px; transform-origin: 0 0; animation: lgShrink 4.6s ease-in-out infinite; }
      @keyframes lgShrink { 0%, 25% { transform: translate(560px, 6px) scale(2.2); } 55%, 90% { transform: none; } 100% { transform: translate(560px, 6px) scale(2.2); } }`,
    html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6()), { y: 180 }) },
  { key: 'margin', name: 'Links mit viel Luft', tags: ['links', 'ruhig'], idea: 'Etwas größer und mit deutlich mehr Abstand zum Rand und nach oben. Wirkt teurer und ruhiger.',
    css: '.L-margin .s-hd { height: 96px; padding: 0 76px; } .L-margin .s-logo { height: 28px; }', html: () => logoPage6(hdl6('', t => H6.logo(t) + bag6()), { y: 170 }) },
];

/* ---------------------------------------------------------------- Karte (FIFA-Stil) */
const FC_PATH = 'M34 0H266C270 18 282 30 300 32V352C300 370 290 380 272 386L150 420 28 386C10 380 0 370 0 352V32C18 30 30 18 34 0Z';
const FLAG6 = {
  brasilien: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#169b3a"/><path d="M15 2.5 27 10 15 17.5 3 10z" fill="#f8d81a"/><circle cx="15" cy="10" r="4.2" fill="#1d3f94"/></svg>',
  deutschland: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#111"/><rect y="6.7" width="30" height="6.6" fill="#d8141e"/><rect y="13.3" width="30" height="6.7" fill="#f6c400"/></svg>',
  tuerkei: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#d8141e"/><circle cx="12" cy="10" r="5" fill="#fff"/><circle cx="13.3" cy="10" r="4" fill="#d8141e"/><path d="M18.6 10l3.6-1.2-2.2 3.1V8.1l2.2 3.1z" fill="#fff"/></svg>',
};
/* Karte 300 x 420: oben links Kürzel, Trikot, Name, unten die Größen; die Varianten färben und rahmen nur */
const fcard6 = (p, o = {}) => `<div class="fc ${o.cls || ''}" style="${o.st || ''}">
  <svg class="fc-sh" viewBox="0 0 300 420" preserveAspectRatio="none"><path d="${FC_PATH}"/></svg>
  <div class="fc-in">${o.top ? o.top(p) : `<span class="fc-code">${p.code}</span>`}
    <div class="fc-j">${H6.img(p, 200)}</div><b class="fc-nm">${p.name}</b>${o.foot ? o.foot(p) : '<span class="fc-sz">S · M · L · XL</span>'}</div></div>`;
const cardPage6 = (o = {}) => `<div class="sp">${H6.bar()}${H6.hd()}<div class="fcrow">${P6.map(p => fcard6(p, o)).join('')}</div></div>`;
const KARTE6 = [
  { key: 'line', name: 'Feine Linie in Kartenform', tags: ['schlicht'], idea: 'Nur eine dünne schwarze Linie in der Form einer FIFA-Karte, innen weiß. Oben links das Länderkürzel, unten die Größen.',
    css: '', html: () => cardPage6({ cls: 'v-line' }) },
  { key: 'grey', name: 'Hellgraue Fläche', tags: ['schlicht'], idea: 'Keine Linie, nur eine sehr helle graue Fläche in Kartenform. Das Trikot liegt darauf wie auf einem Sockel.',
    css: '', html: () => cardPage6({ cls: 'v-grey' }) },
  { key: 'gold', name: 'Gold wie im Spiel', tags: ['FIFA', 'auffällig'], idea: 'Der Klassiker: goldene Karte mit weichem Verlauf. Am nächsten am Original, aber bunter als der Rest der Seite.',
    css: '', html: () => cardPage6({ cls: 'v-gold' }) },
  { key: 'silver', name: 'Silber', tags: ['FIFA'], idea: 'Silberne Karte mit leichtem Glanz. Erinnert ans Spiel und passt besser zu Schwarz-Weiß als Gold.',
    css: '', html: () => cardPage6({ cls: 'v-silver' }) },
  { key: 'black', name: 'Schwarze Karte', tags: ['auffällig'], idea: 'Schwarze Karte mit weißer Schrift. Die Trikots leuchten darauf, stark auf der weißen Seite.',
    css: '', html: () => cardPage6({ cls: 'v-black' }) },
  { key: 'tint', name: 'Hauch der Landesfarbe', tags: ['Farbe'], idea: 'Jede Karte hat einen sehr hellen Ton aus der Trikotfarbe: gelblich, grau, rötlich. Sonst alles weiß.',
    css: '', html: () => `<div class="sp">${H6.bar()}${H6.hd()}<div class="fcrow">${P6.map(p => fcard6(p, { cls: 'v-tint', st: `--tint:${p.c1}` })).join('')}</div></div>` },
  { key: 'stats', name: 'Werte wie im Spiel', tags: ['FIFA', 'Info'], idea: 'Unten stehen statt Spielerwerten echte Angaben in zwei Spalten: Preis, Größen, Schnitt und Land.',
    css: '', html: () => cardPage6({ cls: 'v-line v-stats', foot: () => '<span class="fc-st"><i><b>54,99</b> Preis</i><i><b>S–XL</b> Größen</i><i><b>Regular</b> Schnitt</i><i><b>Retro</b> Stil</i></span>' }) },
  { key: 'dial', name: 'Vorwahl als große Zahl', tags: ['FIFA', 'Idee'], idea: 'Wo im Spiel die Stärke steht, steht die Ländervorwahl: +55, +49, +90. Darunter das Kürzel und die Flagge, wie bei den Städtetrikots mit 069 und 030.',
    css: '', html: () => cardPage6({ cls: 'v-line v-dial', top: p => `<span class="fc-dial"><b>${p.dial}</b><i>${p.code}</i>${FLAG6[p.id]}</span>` }) },
  { key: 'octagon', name: 'Ecken abgeschnitten', tags: ['schlicht'], idea: 'Eine einfachere Kartenform: ein Rechteck mit schräg abgeschnittenen Ecken, feine Linie.',
    css: '', html: () => cardPage6({ cls: 'v-oct' }) },
  { key: 'holo', name: 'Glanz beim Darüberfahren', tags: ['Bewegung', 'FIFA'], idea: 'Eine weiße Karte, über die ein heller Schimmer zieht, wie bei einer seltenen Karte. Im Shop nur beim Darüberfahren.',
    css: '', html: () => cardPage6({ cls: 'v-line v-holo' }) },
  { key: 'double', name: 'Doppelte Linie', tags: ['schlicht'], idea: 'Zwei feine Linien mit etwas Abstand, wie der Rahmen einer besonderen Karte.',
    css: '', html: () => cardPage6({ cls: 'v-line v-double' }) },
  { key: 'corners', name: 'Nur die Ecken', tags: ['schlicht'], idea: 'Keine ganze Karte, nur vier Ecken wie bei einem Sucher. Ganz leicht, die Kartenform ahnt man.',
    css: '', html: () => cardPage6({ cls: 'v-corners' }) },
  { key: 'lift', name: 'Weiß mit Schatten', tags: ['Bewegung'], idea: 'Weiße Karten mit weichem Schatten. Die Karte unter der Maus hebt sich etwas an (hier die mittlere).',
    css: '', html: () => cardPage6({ cls: 'v-lift' }) },
  { key: 'panini', name: 'Sticker aus dem Album', tags: ['Sammelalbum'], idea: 'Wie Sticker: weißer Rand, abgerundete Ecken, leicht schief geklebt, bei einem löst sich eine Ecke.',
    css: '', html: () => cardPage6({ cls: 'v-panini' }) },
  { key: 'flag', name: 'Feine Linie mit Flagge', tags: ['Farbe'], idea: 'Die feine Kartenlinie, oben links eine kleine Flagge statt des Kürzels. Etwas Farbe, aber sparsam.',
    css: '', html: () => cardPage6({ cls: 'v-line', top: p => `<span class="fc-flag">${FLAG6[p.id]}<i>${p.code}</i></span>` }) },
  { key: 'rare', name: 'Feine Streifen', tags: ['FIFA'], idea: 'Hellgraue Karte mit sehr feinen schrägen Streifen, wie das Muster seltener Karten. Schwarz-weiß.',
    css: '', html: () => cardPage6({ cls: 'v-line v-rare' }) },
];

/* ---------------------------------------------------------------- Anordnung */
const N6 = { B: B6, D: D6, T: T6 };
const ordPage6 = body => `<div class="sp sp9">${H6.bar()}${H6.hd()}${body}</div>`;
const rowOf6 = (seq, y = 200, s = 280) => cells6([...seq].map((k, i) => [N6[k], 240 + i * 400, y, s]));
const triDown6 = (top, bottom, s = 270) => cells6([[N6[top[0]], 440, 130, s], [N6[top[1]], 840, 130, s], [N6[bottom], 640, 500, s]]);
const triUp6 = (top, bottom, s = 270) => cells6([[N6[top], 640, 130, s], [N6[bottom[0]], 440, 500, s], [N6[bottom[1]], 840, 500, s]]);
const ordName = seq => [...seq].map(k => N6[k].name).join(' · ');
const ORD6 = [
  ...['BDT', 'TDB', 'DBT', 'BTD', 'DTB', 'TBD'].map(seq => ({ key: 'row' + seq, name: 'Reihe: ' + ordName(seq), tags: ['Reihe'],
    idea: `Alle drei in einer Reihe, von links nach rechts: ${ordName(seq)}.${seq === 'BDT' ? ' So ist es heute.' : ''}`, css: '', html: () => ordPage6(rowOf6(seq)) })),
  ...[['BD', 'T'], ['BT', 'D'], ['DT', 'B']].map(([t, b]) => ({ key: 'tri' + t + b, name: `Dreieck: oben ${ordName(t)}, unten ${N6[b].name}`, tags: ['Dreieck', '2 oben, 1 unten'],
    idea: `Zwei oben, eins mittig darunter: oben ${ordName(t)}, unten ${N6[b].name}.`, css: '', html: () => ordPage6(triDown6(t, b)) })),
  ...[['D', 'BT'], ['B', 'DT'], ['T', 'BD']].map(([t, b]) => ({ key: 'pyr' + t + b, name: `Dreieck: oben ${N6[t].name}, unten ${ordName(b)}`, tags: ['Dreieck', '1 oben, 2 unten'],
    idea: `Umgedreht: eins oben in der Mitte, zwei darunter. Oben ${N6[t].name}, unten ${ordName(b)}.`, css: '', html: () => ordPage6(triUp6(t, b)) })),
  { key: 'podium', name: 'Siegertreppchen', tags: ['Reihe', 'Fußball'], idea: 'Wie bei der Siegerehrung: das mittlere Trikot steht höher, die beiden anderen etwas tiefer.',
    css: '', html: () => ordPage6(cells6([[B6, 240, 290, 280], [D6, 640, 160, 280], [T6, 1040, 290, 280]])) },
  { key: 'zigzag', name: 'Versetzt', tags: ['Reihe'], idea: 'Die Mitte steht tiefer als die Seiten, die Reihe bekommt einen kleinen Knick.',
    css: '', html: () => ordPage6(cells6([[B6, 240, 150, 280], [D6, 640, 320, 280], [T6, 1040, 150, 280]])) },
  { key: 'bigmid', name: 'Mitte groß, Seiten klein', tags: ['Reihe'], idea: 'Das mittlere Trikot ist groß, links und rechts zwei kleinere. Gut, wenn eins besonders zählen soll.',
    css: '', html: () => ordPage6(cells6([[B6, 230, 260, 230], [D6, 640, 160, 400], [T6, 1050, 260, 230]])) },
];

/* ---------------------------------------------------------------- Größe */
const GR6 = [
  ...[['xs', 'Sehr klein', 170, 'Viel Weiß, die Trikots wirken wie kleine Bilder in einer Galerie.'], ['s', 'Klein', 220, 'Etwas kleiner als heute, mehr Luft drumherum.'],
    ['m', 'Mittel (wie jetzt)', 300, 'So groß wie heute auf dem Computer.'], ['l', 'Groß', 360, 'Die Trikots füllen die Breite fast aus, wenig Abstand.'],
    ['xl', 'Sehr groß', 400, 'Die drei stoßen fast aneinander, die Trikots stehen im Mittelpunkt.']].map(([k, n, s, idea]) => ({
    key: 'row' + k, name: 'Reihe · ' + n, tags: ['Reihe', `${s} px`], idea: idea + ' Bei Karten wächst die Karte mit.',
    css: '', html: () => ordPage6(cells6(P6.map((p, i) => [p, 240 + i * 400, Math.max(110, 330 - s * .62), s]))) })),
  ...[['s', 'Klein', 220], ['m', 'Mittel', 290], ['l', 'Groß', 340]].map(([k, n, s]) => ({
    key: 'tri' + k, name: 'Dreieck · ' + n, tags: ['Dreieck', `${s} px`], idea: 'Zwei oben, eins darunter, in dieser Größe. Je größer, desto mehr muss man scrollen.',
    css: '', html: () => ordPage6(cells6([[B6, 640 - s * .72, 110, s], [D6, 640 + s * .72, 110, s], [T6, 640, 110 + s + 50, s]])) })),
];

const SHOP6_CSS = `
.m6 .sp9 { height: 900px; }
.m6 .lgband { position: absolute; left: 0; right: 0; bottom: 0; height: 150px; overflow: hidden; color: #fff; }
.m6 .lgroom { position: absolute; inset: 0; background: url(img/room.webp) center 30%/1280px auto; filter: brightness(.8); }
.m6 .lgband .s-hd { position: relative; }
.m6 .lgband .s-bag .bagi { stroke: #fff; } .m6 .lgband .s-bag .bagi .bl { fill: #fff; } .m6 .lgband .s-bag .bagi .ln { fill: #000; }
.m6 .lgcap { position: absolute; right: 40px; bottom: 14px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: rgb(255 255 255 / .75); }
.m6 .fcrow { position: absolute; left: 0; right: 0; top: 130px; display: flex; justify-content: center; gap: 50px; }
.m6 .fc { position: relative; width: 300px; height: 420px; }
.m6 .fc-sh { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; fill: #fff; stroke: none; }
.m6 .fc-in { position: absolute; inset: 0; display: grid; justify-items: center; align-content: start; padding: 26px 26px 0; }
.m6 .fc-code { justify-self: start; font-size: 12px; letter-spacing: .1em; }
.m6 .fc-j { height: 214px; display: grid; place-items: center; margin-top: 4px; }
.m6 .fc-nm { font-weight: 400; font-size: 14px; letter-spacing: .1em; text-transform: uppercase; margin-top: 18px; padding-top: 12px; border-top: 1px solid currentColor; min-width: 150px; text-align: center; }
.m6 .fc-sz { margin-top: 12px; font-size: 10.5px; letter-spacing: .1em; color: #767676; }
.m6 .v-line .fc-sh { stroke: #000; stroke-width: 1.2; vector-effect: non-scaling-stroke; }
.m6 .v-grey .fc-sh { fill: #f2f2f2; }
.m6 .v-gold { background: linear-gradient(160deg, #f7e6a6, #d9b45a 42%, #f3de96 68%, #c69f45); clip-path: path('${FC_PATH}'); }
.m6 .v-silver { background: linear-gradient(160deg, #f4f4f4, #c9ccd0 42%, #eef0f2 68%, #b2b6bb); clip-path: path('${FC_PATH}'); }
.m6 .v-black { background: #111; color: #fff; clip-path: path('${FC_PATH}'); } .m6 .v-black .fc-sz { color: #9a9a9a; }
.m6 .v-gold .fc-sh, .m6 .v-silver .fc-sh, .m6 .v-black .fc-sh { display: none; }
.m6 .v-tint { background: color-mix(in srgb, var(--tint) 16%, #fff); clip-path: path('${FC_PATH}'); } .m6 .v-tint .fc-sh { display: none; }
.m6 .v-stats .fc-j { height: 180px; } .m6 .v-stats .fc-nm { margin-top: 12px; }
.m6 .fc-st { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 26px; margin-top: 12px; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: #767676; }
.m6 .fc-st i { font-style: normal; } .m6 .fc-st b { font-weight: 400; color: #000; margin-right: 6px; }
.m6 .fc-dial { justify-self: start; display: grid; justify-items: center; gap: 2px; margin-bottom: -46px; position: relative; z-index: 1; }
.m6 .fc-dial b { font-weight: 400; font-size: 30px; line-height: 1; letter-spacing: 0; } .m6 .fc-dial i { font-style: normal; font-size: 11px; letter-spacing: .1em; }
.m6 .fc-dial svg, .m6 .fc-flag svg { width: 26px; height: 17px; margin-top: 4px; }
.m6 .v-dial .fc-j { margin-left: 30px; }
.m6 .fc-flag { justify-self: start; display: flex; gap: 8px; align-items: center; font-size: 11px; letter-spacing: .1em; } .m6 .fc-flag i { font-style: normal; } .m6 .fc-flag svg { margin: 0; }
.m6 .v-oct .fc-sh { display: none; } .m6 .v-oct { background: #000; clip-path: polygon(26px 0, 274px 0, 300px 26px, 300px 394px, 274px 420px, 26px 420px, 0 394px, 0 26px); }
.m6 .v-oct::before { content: ""; position: absolute; inset: 1.2px; background: #fff; clip-path: polygon(25.5px 0, 272.5px 0, 297.6px 25.5px, 297.6px 392px, 272.5px 417.6px, 25.5px 417.6px, 0 392px, 0 25.5px); }
.m6 .v-holo { overflow: hidden; clip-path: path('${FC_PATH}'); }
.m6 .v-holo::after { content: ""; position: absolute; inset: -40% -60%; background: linear-gradient(105deg, transparent 40%, rgb(190 220 255 / .55) 47%, rgb(255 230 250 / .6) 50%, rgb(210 255 230 / .5) 53%, transparent 60%); animation: holo6 3.2s ease-in-out infinite; }
@keyframes holo6 { 0% { transform: translateX(-45%); } 60%, 100% { transform: translateX(45%); } }
.m6 .v-double::after { content: ""; position: absolute; inset: 9px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420' preserveAspectRatio='none'%3E%3Cpath d='${FC_PATH}' fill='none' stroke='%23000' stroke-width='1.3' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E"); background-size: 100% 100%; pointer-events: none; }
.m6 .v-corners .fc-sh { display: none; }
.m6 .v-corners::before { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(#000, #000) 0 0/30px 1.5px, linear-gradient(#000, #000) 0 0/1.5px 30px, linear-gradient(#000, #000) 100% 0/30px 1.5px, linear-gradient(#000, #000) 100% 0/1.5px 30px,
    linear-gradient(#000, #000) 0 100%/30px 1.5px, linear-gradient(#000, #000) 0 100%/1.5px 30px, linear-gradient(#000, #000) 100% 100%/30px 1.5px, linear-gradient(#000, #000) 100% 100%/1.5px 30px; background-repeat: no-repeat; }
.m6 .v-lift .fc-sh { filter: drop-shadow(0 10px 18px rgb(0 0 0 / .12)); } .m6 .fcrow .v-lift:nth-child(2) { transform: translateY(-14px); } .m6 .fcrow .v-lift:nth-child(2) .fc-sh { filter: drop-shadow(0 26px 30px rgb(0 0 0 / .2)); }
.m6 .v-panini .fc-sh { display: none; } .m6 .v-panini { background: #fff; border-radius: 14px; box-shadow: 0 0 0 1px #e3e3e3, 0 8px 16px rgb(0 0 0 / .08); }
.m6 .v-panini .fc-in { inset: 12px; border-radius: 8px; background: #f6f6f6; padding: 18px 18px 0; }
.m6 .fcrow .v-panini:nth-child(1) { transform: rotate(-2.5deg); } .m6 .fcrow .v-panini:nth-child(3) { transform: rotate(2deg); }
.m6 .fcrow .v-panini:nth-child(3)::after { content: ""; position: absolute; right: 0; bottom: 0; width: 46px; height: 46px; background: linear-gradient(135deg, #fff 50%, #dcdcdc 50%); border-radius: 0 0 14px 0; box-shadow: -3px -3px 6px rgb(0 0 0 / .08); }
.m6 .v-rare::before { content: ""; position: absolute; inset: 0; clip-path: path('${FC_PATH}'); background: repeating-linear-gradient(-55deg, #f1f1f1 0 2px, #fafafa 2px 7px); }
.m6 .v-rare .fc-sh { fill: none; position: absolute; z-index: 1; }
`;
