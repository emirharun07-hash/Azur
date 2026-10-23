/* Runde 16 (Stimmen r7): Stechen für Übergang, Hinweise und Anordnung (die Ja-Karten aus r6) und zwei neue Bereiche:
   Größenwahl leiser als in r6 (alle 14 waren Nein: jetzt die schlichte Reihe S M L XL mit kleinen Fußball-Zeichen) und die
   Sporttasche neu: sechs echte 3D-Bilder aus Blender (render_bag.py) und sechs Zeichnungen in derselben Form. */

/* ---------------------------------------------------------------- Größenwahl: schlicht, mit einem kleinen Fußball-Detail */
/* feste Breite je Größe (44 px), damit Ball, Kreis, Strich usw. per data-sel zur gewählten Größe gleiten können */
const SZ7_POS = { S: 0, M: 1, L: 2, XL: 3 };
const szRow7 = (cls, inner = s => s, extra = '') => `<div class="z7 ${cls}" data-sz data-sel="M">${extra}${SZ.map(s => `<span data-v="${s}" class="${s === 'M' ? 'on' : ''}">${inner(s)}</span>`).join('')}</div>`;
const BALL_MINI = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#fff" stroke="#000" stroke-width="1.6"/><path d="M10 6l3.4 2.5-1.3 4h-4.2l-1.3-4z" fill="#000"/></svg>';
const SZ7 = [
  { key: 'now', name: 'Wie jetzt: Unterstrich', tags: ['Vergleich'], idea: 'So ist es heute: graue Buchstaben, die gewählte Größe schwarz und unterstrichen. Zum Vergleich.',
    css: '', html: () => szPage6(szRow7('z7-under')) },
  { key: 'ballunder', name: 'Ball statt Unterstrich', tags: ['Ball', 'Bewegung'], idea: 'Unter der gewählten Größe liegt ein kleiner Ball. Wählst du eine andere, rollt er hinüber und dreht sich dabei.',
    css: '', html: () => szPage6(szRow7('z7-ball', s => s, `<i class="z7-mark">${BALL_MINI}</i>`)) },
  { key: 'spot', name: 'Elfmeterpunkt', tags: ['ganz leise'], idea: 'Statt eines Strichs nur ein kleiner Punkt unter der gewählten Größe, wie der Elfmeterpunkt. Er gleitet mit.',
    css: '', html: () => szPage6(szRow7('z7-spot', s => s, '<i class="z7-mark"></i>')) },
  { key: 'circle', name: 'Mittelkreis wandert', tags: ['Spielfeld'], idea: 'Eine feine Mittellinie läuft durch die Größen, um die gewählte liegt der Anstoßkreis und gleitet zur nächsten.',
    css: '', html: () => szPage6(szRow7('z7-circle', s => `<b>${s}</b>`, '<i class="z7-line"></i><i class="z7-mark"></i>')) },
  { key: 'goal', name: 'Im Tor', tags: ['Tor'], idea: 'Die gewählte Größe steht in einem feinen Tor aus zwei Pfosten und Latte, mit einem Hauch Netz dahinter.',
    css: '', html: () => szPage6(szRow7('z7-goal', s => s, '<i class="z7-mark"></i>')) },
  { key: 'number', name: 'Rückennummer-Schrift', tags: ['Trikot'], idea: 'Die Größen in der breiten, fetten Schrift einer Rückennummer. Die gewählte voll schwarz, die anderen nur als Umriss.',
    css: '', html: () => szPage6(szRow7('z7-number')) },
  { key: 'score', name: 'Anzeigetafel-Zeile', tags: ['Stadion'], idea: 'Die vier Größen in einer Zeile wie auf der Anzeigetafel, die gewählte schwarz hinterlegt mit weißer Schrift.',
    css: '', html: () => szPage6(szRow7('z7-score')) },
  { key: 'dotball', name: 'Punkt wird zum Ball', tags: ['Ball'], idea: 'Über jeder Größe ein kleiner grauer Punkt. Der Punkt über der gewählten Größe wird zum Ball.',
    css: '', html: () => szPage6(szRow7('z7-dot', s => `<i>${BALL_MINI}</i><b>${s}</b>`)) },
  { key: 'chalk', name: 'Kreidestrich', tags: ['Taktiktafel'], idea: 'Die gewählte Größe wird mit einem leicht krummen Strich unterstrichen, wie mit Kreide auf der Taktiktafel.',
    css: '', html: () => szPage6(szRow7('z7-chalk', s => `${s}<svg viewBox="0 0 40 8" preserveAspectRatio="none"><path d="M2 5 C10 2 18 7 26 4 S36 3 38 5"/></svg>`)) },
  { key: 'backline', name: 'Viererkette, ganz klein', tags: ['Spielfeld'], idea: 'Über den Buchstaben eine dünne Linie mit vier kleinen Spielern. Der Spieler über der gewählten Größe ist ausgefüllt.',
    css: '', html: () => szPage6(szRow7('z7-back', s => `<i></i><b>${s}</b>`, '<em class="z7-line"></em>')) },
  { key: 'bignum', name: 'Große Nummer dahinter', tags: ['Trikot'], idea: 'Die gewählte Größe steht groß und blass hinter der Reihe, wie die Nummer auf dem Rücken. Die Reihe selbst bleibt schlicht.',
    css: '', html: () => szPage6(`<div class="z7-bigwrap"><b class="z7-big" data-show>M</b>${szRow7('z7-under')}</div>`) },
  { key: 'pass', name: 'Strich als Pass', tags: ['Bewegung'], idea: 'Der Unterstrich fliegt beim Wechsel wie ein Pass zur neuen Größe, schießt ein Stück darüber hinaus und federt zurück.',
    css: '', html: () => szPage6(szRow7('z7-pass', s => s, '<i class="z7-mark"></i>')) },
];

/* ---------------------------------------------------------------- Tasche: 3D-Bilder aus Blender und passende Zeichnungen */
/* Zeichnung in der Form der 3D-Tasche: liegendes Fass, linkes Ende sichtbar, flacher Boden, zwei Griffe vorne und hinten
   verankert, die sich über dem Reißverschluss treffen. viewBox 64 x 48. */
const duf7 = (o = {}) => `<svg class="duf7 ${o.cls || ''}" viewBox="0 0 64 48" aria-hidden="true">
  <ellipse class="sh" cx="35" cy="44.2" rx="26" ry="2.2"/>
  <path class="hd2" d="M29.5 18 C29 -4 46 -5 45.5 18.5"/>
  ${o.strap ? '<path class="strap" d="M12 20 C14 -4 54 -6 58 20"/>' : ''}
  <path class="bd" d="M17 13.5 L54 15.5 A8 13 0 0 1 56.5 40 L17 42.5"/>
  <path class="cap" d="M17 13.5 A10 14.5 0 0 0 17 42.5 A10 14.5 0 0 0 17 13.5 Z"/>
  <path class="ci" d="M17 17 A7 11 0 0 0 17 39 A7 11 0 0 0 17 17 Z"/>
  ${o.stripes ? '<path class="stp" d="M33 14.4 A9 13 0 0 1 33 41.6 M36 14.6 A9 13 0 0 1 36 41.4 M39 14.8 A9 13 0 0 1 39 41.2"/>' : ''}
  <path class="zp" d="M22 16.5 L52 18"/><rect class="pull" x="45" y="16.6" width="3.4" height="2.4" rx=".8"/>
  ${o.ball ? `<g class="peek"><circle cx="34" cy="16.4" r="4.2"/><path d="M34 14.2l1.7 1.2-.6 2h-2.2l-.6-2z"/></g>` : ''}
  <path class="hd1" d="M26 32 C24 -8 45 -9 43 32"/>
  ${o.tag ? '<rect class="tagbox" x="44" y="22" width="9" height="11" rx="1.4"/>' : ''}
</svg>`;
const bagImg7 = (k, cls = '') => `<img class="bimg ${cls}" src="img/bag-${k}-sm.webp" alt="">`;
const bagPage7 = (small, big, onRoom, o = {}) => `<div class="sp bag7">${H6.bar()}<header class="s-hd">${H6.logo()}<span class="s-bag b7">${small}<i class="s-cnt" data-n="1">1</i></span></header>
  <div class="b7big">${big}</div>
  <div class="bgdark"><div class="lgroom"></div><header class="s-hd">${H6.logo('paper')}<span class="s-bag b7 dk">${onRoom}<i class="s-cnt" data-n="1">1</i></span></header><span class="lgcap">über dem Zimmer</span></div>
  <span class="bgcap">Oben rechts in echter Größe · in der Mitte groß · unten über dem Zimmer</span></div>`;
const R = (k, room = 'white') => bagPage7(bagImg7(k), `<img class="bbig" src="img/bag-${k}.webp" alt="">`, bagImg7(room));
const BAG7 = [
  { key: 'r-black', name: '3D: schwarz mit Signatur', tags: ['3D-Bild', 'Blender'], idea: 'Eine echte, gerenderte Sporttasche: schwarz, weich gepolstert, zwei Griffe, Reißverschluss, die Azur-Signatur in Weiß an der Seite. Über dem dunklen Zimmer dieselbe Tasche in Weiß.',
    css: '', html: () => R('black') },
  { key: 'r-white', name: '3D: weiß', tags: ['3D-Bild', 'Blender'], idea: 'Dieselbe Tasche in Weiß mit schwarzen Griffen und schwarzer Signatur. Ruhiger auf der weißen Seite.',
    css: '', html: () => R('white') },
  { key: 'r-contrast', name: '3D: schwarz, helle Enden', tags: ['3D-Bild', 'Blender'], idea: 'Schwarze Tasche mit cremefarbenen Seitenteilen. Die runden Enden zeigen sofort die Form einer Sporttasche.',
    css: '', html: () => R('contrast') },
  { key: 'r-stripes', name: '3D: drei Streifen', tags: ['3D-Bild', 'Retro'], idea: 'Schwarz mit drei hellen Streifen rundherum, wie eine Tasche aus den 70ern (ohne Marke).',
    css: '', html: () => R('stripes') },
  { key: 'r-strap', name: '3D: mit Schultergurt', tags: ['3D-Bild', 'Blender'], idea: 'Wie die schwarze, dazu ein langer Schultergurt über die ganze Länge.',
    css: '', html: () => R('strap') },
  { key: 'r-grey', name: '3D: grau, schwarze Enden', tags: ['3D-Bild', 'Blender'], idea: 'Graue Tasche mit schwarzen Seitenteilen und weißer Signatur. Etwas leichter als ganz schwarz.',
    css: '', html: () => R('grey') },
  { key: 's-line', name: 'Zeichnung: Linie', tags: ['Zeichnung', 'schlicht'], idea: 'Die Form der 3D-Tasche als feine Linie: rundes Ende vorne, flacher Boden, die Griffe von vorne und hinten treffen sich oben.',
    css: '', html: () => bagPage7(duf7(), duf7(), duf7({ cls: 'dk' })) },
  { key: 's-fill', name: 'Zeichnung: schwarz gefüllt', tags: ['Zeichnung', 'kräftig'], idea: 'Dieselbe Zeichnung schwarz gefüllt, Nähte und Reißverschluss weiß. Klar erkennbar auch ganz klein.',
    css: '', html: () => bagPage7(duf7({ cls: 'f' }), duf7({ cls: 'f' }), duf7({ cls: 'dk' })) },
  { key: 's-two', name: 'Zeichnung: zweifarbig', tags: ['Zeichnung'], idea: 'Körper schwarz, das runde Ende weiß. So sieht man die Rundung auch klein sofort.',
    css: '', html: () => bagPage7(duf7({ cls: 'two' }), duf7({ cls: 'two' }), duf7({ cls: 'dk' })) },
  { key: 's-strap', name: 'Zeichnung: mit Gurt', tags: ['Zeichnung'], idea: 'Die Linien-Tasche mit Schultergurt, der sich über alles spannt.',
    css: '', html: () => bagPage7(duf7({ strap: true }), duf7({ strap: true }), duf7({ strap: true, cls: 'dk' })) },
  { key: 's-ball', name: 'Zeichnung: Ball schaut raus', tags: ['Zeichnung', 'Fußball'], idea: 'Ist etwas im Warenkorb, steht der Reißverschluss offen und ein Ball schaut heraus.',
    css: '', html: () => bagPage7(duf7({ ball: true }), duf7({ ball: true }), duf7({ ball: true, cls: 'dk' })) },
  { key: 's-stripes', name: 'Zeichnung: drei Streifen', tags: ['Zeichnung', 'Retro'], idea: 'Die gefüllte Tasche mit drei weißen Streifen rundherum, passend zur 3D-Version mit Streifen.',
    css: '', html: () => bagPage7(duf7({ cls: 'f', stripes: true }), duf7({ cls: 'f', stripes: true }), duf7({ cls: 'dk', stripes: true })) },
];

const R7_CSS = `
/* Größenwahl r7 */
.m6 .z7 { position: relative; display: flex; gap: 10px; align-items: flex-end; }
.m6 .z7 > span { position: relative; z-index: 1; width: 44px; height: 30px; display: grid; place-items: center; font-size: 13px; color: #767676; cursor: pointer; transition: color .25s; }
.m6 .z7 > span.on { color: #000; }
.m6 .z7-mark { position: absolute; left: 0; pointer-events: none; transition: translate .45s cubic-bezier(.3, 1.3, .5, 1), rotate .45s; }
${Object.entries(SZ7_POS).map(([s, i]) => `.m6 .z7[data-sel="${s}"] .z7-mark { translate: ${i * 54}px 0; rotate: ${i * 180}deg; }`).join('\n')}
.m6 .z7-under > span.on { text-decoration: underline; text-underline-offset: 6px; }
.m6 .z7-ball { padding-bottom: 14px; } .m6 .z7-ball .z7-mark { bottom: 0; width: 44px; height: 11px; display: grid; place-items: center; } .m6 .z7-ball .z7-mark svg { width: 11px; height: 11px; }
.m6 .z7-spot { padding-bottom: 10px; } .m6 .z7-spot .z7-mark { bottom: 0; left: 19.5px; width: 5px; height: 5px; border-radius: 50%; background: #000; rotate: none !important; }
.m6 .z7-circle { padding: 8px 0; } .m6 .z7-circle .z7-line { position: absolute; left: -10px; right: -10px; top: 50%; border-top: 1px solid #cfcfcf; }
.m6 .z7-circle > span b { font-weight: 400; background: #fff; padding: 0 3px; }
.m6 .z7-circle .z7-mark { top: 50%; left: 4px; width: 36px; height: 36px; margin-top: -18px; border: 1px solid #000; border-radius: 50%; rotate: none !important; }
.m6 .z7-goal .z7-mark { bottom: -2px; left: 2px; width: 40px; height: 32px; border: 1.5px solid #000; border-bottom: 0; rotate: none !important;
  background: repeating-linear-gradient(45deg, transparent 0 4px, #eee 4px 5px), repeating-linear-gradient(-45deg, transparent 0 4px, #eee 4px 5px); }
.m6 .z7-number > span { font: 900 22px/1 'Archivo', sans-serif; font-stretch: 75%; color: transparent; -webkit-text-stroke: 1px #9a9a9a; }
.m6 .z7-number > span.on { color: #000; -webkit-text-stroke: 1px #000; }
.m6 .z7-score { gap: 0; border: 1px solid #000; } .m6 .z7-score > span { border-right: 1px solid #000; color: #000; }
.m6 .z7-score > span:last-child { border-right: 0; } .m6 .z7-score > span.on { background: #000; color: #fff; }
.m6 .z7-dot > span { height: 44px; align-content: end; gap: 6px; } .m6 .z7-dot i { width: 12px; height: 12px; display: block; }
.m6 .z7-dot i svg { width: 100%; height: 100%; transition: transform .4s; } .m6 .z7-dot > span:not(.on) i svg * { fill: #d4d4d4; stroke: #d4d4d4; }
.m6 .z7-dot > span:not(.on) i svg path { fill: #d4d4d4; } .m6 .z7-dot > span:not(.on) i svg { transform: scale(.5); } .m6 .z7-dot .on i svg { transform: rotate(180deg); }
.m6 .z7-dot b { font-weight: 400; }
.m6 .z7-chalk > span { flex-direction: column; } .m6 .z7-chalk svg { width: 34px; height: 7px; fill: none; stroke: #000; stroke-width: 1.6; stroke-linecap: round; opacity: 0; }
.m6 .z7-chalk svg path { stroke-dasharray: 44; stroke-dashoffset: 44; transition: stroke-dashoffset .5s ease; } .m6 .z7-chalk .on svg { opacity: 1; } .m6 .z7-chalk .on svg path { stroke-dashoffset: 0; }
.m6 .z7-back > span { height: 46px; align-content: end; gap: 8px; } .m6 .z7-back .z7-line { position: absolute; left: -6px; right: -6px; top: 7px; border-top: 1px solid #d6d6d6; }
.m6 .z7-back i { width: 9px; height: 9px; border-radius: 50%; border: 1px solid #000; background: #fff; transition: background .25s; } .m6 .z7-back .on i { background: #000; }
.m6 .z7-back b { font-weight: 400; }
.m6 .z7-bigwrap { position: relative; display: grid; place-items: center; }
.m6 .z7-big { position: absolute; z-index: 0; font: 900 120px/1 'Archivo', sans-serif; font-stretch: 62%; color: #f0f0f0; top: -54px; transition: opacity .3s; }
.m6 .z7-pass { padding-bottom: 8px; } .m6 .z7-pass .z7-mark { bottom: 2px; left: 10px; width: 24px; height: 1.5px; background: #000; rotate: none !important;
  transition: translate .5s cubic-bezier(.34, 1.8, .5, 1); }

/* Tasche r7 */
.m6 .bag7 .s-bag.b7 { width: 44px; height: 32px; display: grid; place-items: center; }
.m6 .bag7 .s-bag.b7 .bimg { max-width: 44px; max-height: 32px; width: auto; height: auto; }
.m6 .bag7 .s-bag.b7 .duf7 { width: 44px; height: 33px; }
.m6 .b7big { position: absolute; left: 50%; top: 120px; width: 560px; height: 380px; margin-left: -280px; display: grid; place-items: center; }
.m6 .b7big .bbig { max-width: 100%; max-height: 100%; }
.m6 .b7big .duf7 { width: 100%; height: 100%; }
.m6 .duf7 { overflow: visible; fill: none; stroke: #000; stroke-width: 1.8px; stroke-linecap: round; stroke-linejoin: round; }
.m6 .b7big .duf7 * { vector-effect: non-scaling-stroke; } .m6 .b7big .duf7 { stroke-width: 4px; }
.m6 .duf7 .sh { fill: rgb(0 0 0 / .1); stroke: none; } .m6 .duf7 .bd, .m6 .duf7 .cap { fill: #fff; } .m6 .duf7 .ci { stroke-width: 1.1px; }
.m6 .duf7 .hd2 { opacity: .55; } .m6 .duf7 .zp { stroke-dasharray: 1.6 1.4; stroke-width: 1.2px; } .m6 .duf7 .pull { fill: #000; stroke: none; }
.m6 .b7big .duf7 .zp { stroke-dasharray: 10 8; stroke-width: 2.4px; } .m6 .b7big .duf7 .ci { stroke-width: 2.4px; }
.m6 .duf7 .peek circle { fill: #fff; } .m6 .duf7 .peek path { fill: #000; stroke: none; } .m6 .duf7 .stp { stroke-width: 1.4px; }
.m6 .duf7.f .bd, .m6 .duf7.f .cap { fill: #000; } .m6 .duf7.f .ci, .m6 .duf7.f .zp, .m6 .duf7.f .stp { stroke: #fff; } .m6 .duf7.f .pull { fill: #fff; }
.m6 .duf7.two .bd { fill: #000; } .m6 .duf7.two .cap { fill: #fff; } .m6 .duf7.two .zp { stroke: #fff; } .m6 .duf7.two .pull { fill: #fff; }
.m6 .duf7.dk { stroke: #fff; } .m6 .duf7.dk .bd, .m6 .duf7.dk .cap { fill: rgb(0 0 0 / .3); } .m6 .duf7.dk .pull, .m6 .duf7.dk .peek path { fill: #fff; } .m6 .duf7.dk .peek circle { fill: none; }
.m6 .bag7 .bgdark { height: 130px; } .m6 .bag7 .bgdark .s-hd { position: relative; }
.m6 .bag7 .bgdark .s-cnt { background: #fff; color: #000; }
.m6 .bag7 .s-hd .s-bag, .m6 .b7big { animation: bump6 3.6s infinite; } .m6 .b7big { animation-name: bumpBig6; transform-origin: 50% 70%; }
`;
