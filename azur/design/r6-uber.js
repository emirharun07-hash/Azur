/* Runde 15, Bereich „Übergang“: 50 Wege vom Zimmer in den Shop. Jeder Entwurf hängt an einer Zahl --p (0 = Zimmer, 1 = Shop),
   die im Swipe-Feld von selbst läuft (Scrollen nachgestellt) oder mit dem Regler / Mausrad bewegt wird. Im echten Shop wäre --p
   der Scroll-Fortschritt über das Zimmer hinweg (das Zimmer bleibt dafür kurz stehen, „sticky“). Bild 1280 x 720 = ein Bildschirm.
   Teile, die das Zimmer in Stücke schneiden, brauchen im Shop ein Standbild des Zimmers beim Scrollen (Aufwand „mittel“). */
const TV6 = (extra = '', o = {}) => `<div class="tv${o.late ? ' late' : ''}"><div class="shop">${H6.page(o.page)}</div><div class="room"></div>${extra}</div>`;
/* die drei Trikots an der Stange im Zimmerbild (x, y oben links, Breite), Ziel = ihr Platz im Raster */
const RAIL6 = [{ x: 652, y: 226, w: 62 }, { x: 707, y: 232, w: 60 }, { x: 760, y: 236, w: 62 }];
const fly6 = (start = i => RAIL6[i]) => P6.map((p, i) => {
  const w1 = Math.round(300 * p.ar), x1 = 240 + i * 400 - w1 / 2, y1 = 150, s = start(i, x1, y1, w1);
  return `<img class="fly" src="${p.img}" alt="" style="--i:${i};--x0:${s.x};--y0:${s.y};--w0:${s.w};--x1:${x1};--y1:${y1};--w1:${w1}">`;
}).join('');
const pieces6 = (cols, rows, cls, extra = () => '') => {
  const w = 1280 / cols, h = 720 / rows; let out = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    out += `<div class="pc6 ${cls} p${r * cols + c}" style="left:${c * w}px;top:${r * h}px;width:${w}px;height:${h}px;background-position:${-c * w}px ${-r * h}px;${extra(c, r)}"></div>`;
  return out;
};
const BALL6 = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#111" stroke-width="3"/><path d="M50 31l18 13-7 21H39l-7-21z" fill="#111"/><path d="M50 31V8M68 44l21-7M61 65l13 19M39 65L26 84M32 44L11 37" stroke="#111" stroke-width="3"/></svg>';
const JERSEY_MASK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M31 14 L43 9 Q50 17 57 9 L69 14 L88 28 L79 41 L71 36 L71 91 L29 91 L29 36 L21 41 L12 28 Z'/%3E%3C/svg%3E";
const WAVE_MASK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 70' preserveAspectRatio='none'%3E%3Cpath d='M0 35 Q90 0 180 35 T360 35 V70 H0Z'/%3E%3C/svg%3E";

const UB_CSS = `
.k-uber { --q: calc(1 - var(--p)); --a1: clamp(0, var(--p) * 2, 1); --a2: clamp(0, var(--p) * 2 - 1, 1); --late: clamp(0, (var(--p) - .7) * 3.4, 1); }
.k-uber .tv { position: absolute; inset: 0; overflow: hidden; background: #fff; }
.k-uber .shop { position: absolute; inset: 0; z-index: 1; background: #fff; }
.k-uber .room { position: absolute; inset: 0; z-index: 2; background: url(img/room.webp) 0 0/1280px 720px; }
.k-uber .pc6 { position: absolute; z-index: 3; background-image: url(img/room.webp); background-size: 1280px 720px; }
.k-uber .ov { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.k-uber .late .shop { z-index: 4; background: transparent; }
.k-uber .late .shop .sp { background: transparent; opacity: var(--late); }
.k-uber .fly { position: absolute; left: 0; top: 0; z-index: 5; height: auto;
  width: calc((var(--w0) + (var(--w1) - var(--w0)) * var(--t, var(--p))) * 1px);
  transform: translate(calc((var(--x0) + (var(--x1) - var(--x0)) * var(--tx, var(--t, var(--p)))) * 1px), calc((var(--y0) + (var(--y1) - var(--y0)) * var(--ty, var(--t, var(--p)))) * 1px))
    rotate(calc((1 - var(--t, var(--p))) * var(--rot, 0deg))); }
`;

const UEBER6 = [
  { key: 'cut', name: 'Wie jetzt: einfach scrollen', tags: ['Vergleich', 'leicht'],
    idea: 'So ist es heute: Das Zimmer rollt nach oben weg, der Shop kommt von unten nach. Zum Vergleich mit den anderen 49.',
    css: `.U-cut .room { transform: translateY(calc(var(--p) * -100%)); } .U-cut .shop { transform: translateY(calc(var(--q) * 100%)); }`,
    html: () => TV6() },
  { key: 'sheet', name: 'Weißes Blatt schiebt sich drüber', tags: ['Scroll', 'leicht'],
    idea: 'Das Zimmer bleibt stehen und wird dunkler. Der weiße Shop schiebt sich wie ein Blatt Papier darüber.',
    css: `.U-sheet .shop { z-index: 3; transform: translateY(calc(var(--q) * 100%)); box-shadow: 0 -24px 60px rgb(0 0 0 / .45); }
      .U-sheet .room { filter: brightness(calc(1 - var(--p) * .6)); }`,
    html: () => TV6() },
  { key: 'sheetround', name: 'Blatt mit runder Kante', tags: ['Scroll', 'leicht'],
    idea: 'Wie eine Karte am Handy: Das Zimmer rückt ein Stück nach hinten, der Shop kommt mit runden Ecken und einem kleinen Griff von unten.',
    css: `.U-sheetround .tv { background: #000; }
      .U-sheetround .shop { z-index: 3; transform: translateY(calc(var(--q) * 100% + var(--q) * 24px)); border-radius: calc(var(--q) * 64px) calc(var(--q) * 64px) 0 0; overflow: hidden; box-shadow: 0 -20px 50px rgb(0 0 0 / .4); }
      .U-sheetround .shop::before { content: ""; position: absolute; z-index: 2; left: 50%; top: 10px; width: 56px; height: 5px; margin-left: -28px; border-radius: 3px; background: #d0d0d0; opacity: var(--q); }
      .U-sheetround .room { transform: scale(calc(1 - var(--p) * .08)); border-radius: calc(var(--p) * 28px); filter: brightness(calc(1 - var(--p) * .55)); }`,
    html: () => TV6() },
  { key: 'fadewhite', name: 'Weißblende', tags: ['Blende', 'leicht'],
    idea: 'Das Zimmer verblasst zu Weiß, danach tauchen Logo, Tasche und Trikots auf. Ruhig und schlicht.',
    css: `.U-fadewhite .room { opacity: calc(1 - var(--a1)); } .U-fadewhite .shop .sp { opacity: var(--a2); }`,
    html: () => TV6() },
  { key: 'iris', name: 'Kreis aus der Mitte', tags: ['Blende', 'leicht'],
    idea: 'Ein weißer Kreis wächst aus der Bildmitte und öffnet den Shop, wie die Blende am Ende eines alten Films.',
    css: `.U-iris .shop { z-index: 3; clip-path: circle(calc(var(--p) * 72%) at 50% 50%); }`,
    html: () => TV6() },
  { key: 'irisball', name: 'Kreis aus dem Ball', tags: ['Fußball', 'leicht'],
    idea: 'Der Kreis wächst genau aus dem Ball auf dem Boden. Erst langsam, dann schnell, als ob der Ball losrollt.',
    css: `.U-irisball .shop { z-index: 3; clip-path: circle(calc(var(--p) * var(--p) * 98%) at 59.8% 80.5%); }`,
    html: () => TV6() },
  { key: 'irisjersey', name: 'Kreis aus dem gelben Trikot', tags: ['Trikot', 'leicht'],
    idea: 'Der Kreis öffnet sich aus dem Trikot an der Stange. Man „geht“ ins Trikot hinein und landet im Shop.',
    css: `.U-irisjersey .shop { z-index: 3; clip-path: circle(calc(var(--p) * 90%) at 53.4% 35.6%); }`,
    html: () => TV6() },
  { key: 'doors', name: 'Schranktüren', tags: ['Teilen', 'mittel'],
    idea: 'Das Zimmer teilt sich in der Mitte. Beide Hälften gleiten zur Seite wie Schiebetüren, dahinter steht der Shop.',
    css: `.U-doors .room { display: none; } .U-doors .pc6 { box-shadow: 0 0 40px rgb(0 0 0 / .35); }
      .U-doors .pc6.p0 { transform: translateX(calc(var(--p) * -101%)); } .U-doors .pc6.p1 { transform: translateX(calc(var(--p) * 101%)); }`,
    html: () => TV6(pieces6(2, 1, 'hf')) },
  { key: 'doors3d', name: 'Spindtüren in 3D', tags: ['Kabine', '3D', 'mittel'],
    idea: 'Wie zwei Spindtüren in der Kabine: Die Hälften klappen nach vorne auf, dahinter hängt der Shop.',
    css: `.U-doors3d .tv { perspective: 1500px; } .U-doors3d .room { display: none; }
      .U-doors3d .pc6 { backface-visibility: hidden; } .U-doors3d .pc6::after { content: ""; position: absolute; inset: 0; background: #000; opacity: calc(var(--p) * .55); }
      .U-doors3d .pc6.p0 { transform-origin: 0 50%; transform: rotateY(calc(var(--p) * -100deg)); }
      .U-doors3d .pc6.p1 { transform-origin: 100% 50%; transform: rotateY(calc(var(--p) * 100deg)); }`,
    html: () => TV6(pieces6(2, 1, 'hf')) },
  { key: 'zoomwin', name: 'Durchs Fenster raus', tags: ['Kamera', 'leicht'],
    idea: 'Die Kamera fliegt ins helle Fenster, alles wird weiß, draußen wartet der Shop.',
    css: `.U-zoomwin .room { transform-origin: 90% 32%; transform: scale(calc(1 + var(--p) * var(--p) * 9)); filter: brightness(calc(1 + var(--p) * 1.6)); opacity: calc(1 - var(--late)); }
      .U-zoomwin .shop .sp { opacity: var(--late); }`,
    html: () => TV6() },
  { key: 'zoomrail', name: 'Kamerafahrt an die Stange', tags: ['Kamera', 'Trikot', 'leicht'],
    idea: 'Die Kamera fährt nah an die Trikots. Kurz bevor alles verschwimmt, stehen die Trikots groß im weißen Shop.',
    css: `.U-zoomrail .room { transform-origin: 57.5% 36%; transform: scale(calc(1 + var(--p) * var(--p) * 5)); opacity: calc(1 - var(--a2)); }
      .U-zoomrail .shop .sp { opacity: var(--a2); } .U-zoomrail .c3 .jz { transform: scale(calc(.55 + var(--a2) * .45)); }`,
    html: () => TV6() },
  { key: 'flyout', name: 'Trikots fliegen von der Stange', tags: ['Trikot', 'Lieblingsidee', 'mittel'],
    idea: 'Die drei Trikots lösen sich von der Stange und fliegen an ihren Platz im Shop. Das Zimmer bleibt zurück und verblasst.',
    css: `.U-flyout .c3 .jz { visibility: hidden; } .U-flyout .room { opacity: calc(1 - var(--a1)); transform: translateY(calc(var(--p) * -12%)); }
      .U-flyout .shop .sp { opacity: calc(var(--a1) * .4 + var(--a2) * .6); }
      .U-flyout .fly { --t: clamp(0, var(--p) * 1.3 - var(--i) * .15, 1); opacity: clamp(0, var(--p) * 8, 1); }`,
    html: () => TV6(fly6()) },
  { key: 'drop', name: 'Trikots fallen rein', tags: ['Trikot', 'mittel'],
    idea: 'Das Zimmer rollt weg, dann fallen die Trikots nacheinander von oben in ihre Felder, leicht schräg, als würden sie vom Bügel rutschen.',
    css: `.U-drop .c3 .jz { visibility: hidden; } .U-drop .room { transform: translateY(calc(var(--a1) * -100%)); }
      .U-drop .shop { transform: translateY(calc((1 - var(--a1)) * 100%)); }
      .U-drop .fly { --t: clamp(0, (var(--p) - .38 - var(--i) * .1) * 2.6, 1); --ty: calc(var(--t) * var(--t)); --rot: calc(14deg - var(--i) * 12deg); }`,
    html: () => TV6(fly6((i, x1, y1, w1) => ({ x: x1, y: -420, w: w1 }))) },
  { key: 'parallax', name: 'Tiefe Ebenen', tags: ['Scroll', 'leicht'],
    idea: 'Das Zimmer bewegt sich langsamer als der Shop und wird dabei dunkler. Die Trikots kommen noch ein Stück schneller hoch.',
    css: `.U-parallax .room { transform: translateY(calc(var(--p) * -40%)) scale(calc(1 + var(--p) * .12)); filter: brightness(calc(1 - var(--p) * .5)); }
      .U-parallax .shop { z-index: 3; transform: translateY(calc(var(--q) * 100%)); } .U-parallax .c3 { transform: translateY(calc(var(--q) * 140px)); }`,
    html: () => TV6() },
  { key: 'tiltback', name: 'Zimmer kippt nach hinten', tags: ['3D', 'leicht'],
    idea: 'Das Zimmer kippt wie eine Klappe nach hinten weg und gibt den Shop frei.',
    css: `.U-tiltback .tv { perspective: 1100px; } .U-tiltback .room { transform-origin: 50% 100%; transform: rotateX(calc(var(--p) * 88deg)); opacity: calc(1 - var(--a2)); }
      .U-tiltback .shop .sp { opacity: var(--a2); }`,
    html: () => TV6() },
  { key: 'pageturn', name: 'Umblättern', tags: ['Magazin', '3D', 'leicht'],
    idea: 'Wie im ANSTOSS-Magazin: Das Zimmer ist eine Seite, die nach links umgeblättert wird. Auf der nächsten Seite steht der Shop.',
    css: `.U-pageturn .tv { perspective: 2000px; } .U-pageturn .room { transform-origin: 0 50%; transform: rotateY(calc(var(--p) * -180deg)); backface-visibility: hidden; }
      .U-pageturn .room::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(0 0 0 / 0), rgb(0 0 0 / .6)); opacity: var(--p); }
      .U-pageturn .shop .sp { opacity: calc(.25 + var(--p) * .75); }`,
    html: () => TV6() },
  { key: 'cardshrink', name: 'Zimmer wird zur Karte', tags: ['Karte', 'leicht'],
    idea: 'Das Zimmer schrumpft zu einer Karte mit runden Ecken und fliegt nach oben weg, der Shop ist schon darunter.',
    css: `.U-cardshrink .room { transform: translateY(calc(var(--a2) * -130%)) scale(calc(1 - var(--a1) * .72)); border-radius: calc(var(--a1) * 60px); box-shadow: 0 30px 60px rgb(0 0 0 / calc(var(--a1) * .35)); }
      .U-cardshrink .shop .sp { opacity: calc(var(--a1) * .3 + var(--a2) * .7); }`,
    html: () => TV6() },
  { key: 'frame', name: 'Zimmer wird zum mittleren Bild', tags: ['Raster', 'leicht'],
    idea: 'Ein weißer Rahmen wächst um das Zimmer, bis es genau so groß ist wie das mittlere Feld. Dann wird daraus das Trikot.',
    css: `.U-frame .room { clip-path: inset(calc(var(--a1) * 150px) calc(var(--a1) * 490px) calc(var(--a1) * 270px) calc(var(--a1) * 490px)); opacity: calc(1 - var(--a2)); }
      .U-frame .shop .sp { opacity: var(--a2); }`,
    html: () => TV6() },
  { key: 'slices', name: 'Streifen fliegen hoch', tags: ['Teilen', 'recent.design', 'mittel'],
    idea: 'Angelehnt an „Thumbnail Grid Transition“ auf recent.design: Das Zimmer zerfällt in acht Streifen, die nacheinander nach oben fliegen.',
    css: `.U-slices .room { display: none; } .U-slices .pc6 { transform: translateY(calc(clamp(0, var(--p) * 1.8 - var(--i) * .1, 1) * -105%)); }`,
    html: () => TV6(pieces6(8, 1, 'sl', c => `--i:${c}`)) },
  { key: 'blinds', name: 'Jalousie', tags: ['Teilen', 'mittel'],
    idea: 'Das Zimmer klappt Lamelle für Lamelle weg wie eine Jalousie, von oben nach unten.',
    css: `.U-blinds .room { display: none; } .U-blinds .pc6 { transform: perspective(900px) rotateX(calc(clamp(0, var(--p) * 1.7 - var(--i) * .06, 1) * -90deg)); }`,
    html: () => TV6(pieces6(1, 12, 'bl', (c, r) => `--i:${r}`)) },
  { key: 'tiles', name: 'Kacheln drehen weg', tags: ['Teilen', 'mittel'],
    idea: 'Das Zimmer zerfällt in Kacheln, die sich von links oben nach rechts unten wegdrehen.',
    css: `.U-tiles .room { display: none; } .U-tiles .pc6 { --k: clamp(0, var(--p) * 2 - var(--d), 1); transform: scale(calc(1 - var(--k))) rotate(calc(var(--k) * 90deg)); }`,
    html: () => TV6(pieces6(8, 5, 'tl', (c, r) => `--d:${((c + r) / 11).toFixed(3)}`)) },
  { key: 'dissolve', name: 'Zerfällt in Pixel', tags: ['Teilen', 'mittel'],
    idea: 'Das Zimmer löst sich in viele kleine Quadrate auf, die zufällig verschwinden. Wie ein altes Videospiel.',
    css: `.U-dissolve .room { display: none; } .U-dissolve .pc6 { opacity: calc(1 - clamp(0, (var(--p) - var(--r) * .8) * 6, 1)); }`,
    html: () => { const r = rnd6(7); return TV6(pieces6(32, 18, 'px', () => `--r:${r().toFixed(3)}`)); } },
  { key: 'dither', name: 'Punkt-Raster', tags: ['Druck', 'recent.design', 'leicht'],
    idea: 'Angelehnt an „Astro Dither“: Weiße Punkte wachsen über das Zimmer wie ein Zeitungsdruck, bis alles weiß ist.',
    css: `.U-dither .dt { background: radial-gradient(circle, #fff calc(var(--p) * 14px), transparent calc(var(--p) * 14px + .6px)) 0 0/18px 18px; }`,
    html: () => TV6('<div class="ov dt"></div>', { late: true }) },
  { key: 'net', name: 'Tornetz', tags: ['Fußball', 'leicht'],
    idea: 'Ein weißes Tornetz fällt von oben über das Zimmer, dann wird alles weiß und der Shop erscheint.',
    css: `.U-net .nt { background: repeating-linear-gradient(45deg, rgb(255 255 255 / .85) 0 2px, transparent 2px 28px), repeating-linear-gradient(-45deg, rgb(255 255 255 / .85) 0 2px, transparent 2px 28px);
        transform: translateY(calc((1 - var(--a1)) * -100%)); } .U-net .wf { background: #fff; opacity: var(--a2); }`,
    html: () => TV6('<div class="ov nt"></div><div class="ov wf"></div>', { late: true }) },
  { key: 'mown', name: 'Rasenstreifen', tags: ['Fußball', 'leicht'],
    idea: 'Wie frisch gemähter Rasen: Streifen in Weiß und Hellgrau kommen abwechselnd von oben und unten, dann wird alles weiß.',
    css: `.U-mown .mw { position: absolute; top: 0; width: 160px; height: 720px; z-index: 3; background: #fff;
        transform: translateY(calc((1 - clamp(0, var(--p) * 1.7 - var(--i) * .08, 1)) * 101% * var(--dir))); }
      .U-mown .mw.alt { background: #efefef; } .U-mown .mw.alt::after { content: ""; position: absolute; inset: 0; background: #fff; opacity: var(--late); }`,
    html: () => TV6(Array.from({ length: 8 }, (_, i) => `<div class="mw${i % 2 ? ' alt' : ''}" style="left:${i * 160}px;--i:${i};--dir:${i % 2 ? 1 : -1}"></div>`).join(''), { late: true }) },
  { key: 'kickoff', name: 'Anstoßkreis', tags: ['Fußball', 'leicht'],
    idea: 'Mittellinie und Anstoßkreis zeichnen sich mit Kreide aufs Zimmer. Dann füllt sich der Kreis weiß und wird zum Shop.',
    css: `.U-kickoff .ko { position: absolute; inset: 0; z-index: 4; fill: none; stroke: #fff; stroke-width: 3; opacity: calc(1 - var(--late)); }
      .U-kickoff .ko circle { stroke-dasharray: 943px; stroke-dashoffset: calc((1 - var(--a1)) * 943px); }
      .U-kickoff .ko line { stroke-dasharray: 1280px; stroke-dashoffset: calc((1 - clamp(0, var(--p) * 3, 1)) * 1280px); }
      .U-kickoff .ko .dot { fill: #fff; stroke: none; }
      .U-kickoff .shop { z-index: 3; clip-path: circle(calc(clamp(0, var(--a2) * 4, 1) * 150px + clamp(0, var(--a2) * 1.3 - .3, 1) * 620px) at 50% 50%); }`,
    html: () => TV6('<svg class="ko" viewBox="0 0 1280 720"><line x1="0" y1="360" x2="1280" y2="360"/><circle cx="640" cy="360" r="150"/><circle class="dot" cx="640" cy="360" r="5"/></svg>') },
  { key: 'touchline', name: 'Seitenlinie', tags: ['Fußball', 'Teilen', 'mittel'],
    idea: 'Eine Kreidelinie zieht quer durchs Zimmer. Dann bricht es an der Linie auf, oben geht es hoch, unten runter.',
    css: `.U-touchline .room { display: none; } .U-touchline .pc6.p0 { transform: translateY(calc(var(--a2) * -101%)); }
      .U-touchline .pc6.p1 { transform: translateY(calc(var(--a2) * 101%)); }
      .U-touchline .tl6 { position: absolute; left: 0; top: 358px; width: 1280px; height: 4px; z-index: 4; background: #fff; transform-origin: 0 50%; transform: scaleX(var(--a1)); opacity: calc(1 - var(--a2)); }`,
    html: () => TV6(pieces6(1, 2, 'vf') + '<div class="tl6"></div>') },
  { key: 'offside', name: 'Abseitslinie', tags: ['Fußball', 'leicht'],
    idea: 'Wie die Linie beim Videobeweis: Eine leuchtende Linie fährt von links nach rechts, hinter ihr ist schon der Shop.',
    css: `.U-offside .shop { z-index: 3; clip-path: inset(0 calc(var(--q) * 100%) 0 0); }
      .U-offside .os { position: absolute; top: 0; bottom: 0; z-index: 4; width: 3px; left: calc(var(--p) * 100% - 1.5px); background: #39ff88; box-shadow: 0 0 18px #39ff88;
        opacity: calc(1 - clamp(0, (var(--p) - .94) * 16, 1)); }`,
    html: () => TV6('<div class="os"></div>') },
  { key: 'clock', name: 'Spieluhr', tags: ['Fußball', 'leicht'],
    idea: 'Ein Zeiger läuft einmal rund wie die Spieluhr. Wo er vorbei ist, steht schon der Shop.',
    css: `.U-clock .shop { z-index: 3; -webkit-mask: conic-gradient(#000 calc(var(--p) * 360deg), transparent 0); mask: conic-gradient(#000 calc(var(--p) * 360deg), transparent 0); }
      .U-clock .hand6 { position: absolute; z-index: 4; left: 639px; top: -540px; width: 2px; height: 900px; background: #fff; mix-blend-mode: difference;
        transform-origin: 50% 100%; transform: rotate(calc(var(--p) * 360deg)); opacity: calc(1 - clamp(0, (var(--p) - .96) * 25, 1)); }`,
    html: () => TV6('<div class="hand6"></div>') },
  { key: 'ballroll', name: 'Ball rollt durchs Bild', tags: ['Fußball', 'leicht'],
    idea: 'Ein Ball rollt von links nach rechts unten durchs Bild und zieht den Shop hinter sich her.',
    css: `.U-ballroll .shop { z-index: 3; clip-path: inset(0 max(0px, calc(1345px - var(--p) * 1400px)) 0 0); }
      .U-ballroll .ball6 { position: absolute; z-index: 4; top: 590px; left: 0; width: 90px; height: 90px; transform: translateX(calc(var(--p) * 1400px - 110px)) rotate(calc(var(--p) * 1080deg)); }
      .U-ballroll .ball6 svg { width: 100%; height: 100%; filter: drop-shadow(0 8px 8px rgb(0 0 0 / .25)); }`,
    html: () => TV6(`<div class="ball6">${BALL6}</div>`) },
  { key: 'logomask', name: 'Durchs Logo', tags: ['Logo', 'leicht'],
    idea: 'Die Azur-Signatur wächst aus der Mitte und ist ein Fenster in den Shop. Am Ende ist alles Shop.',
    css: `.U-logomask .shop { z-index: 3;
        -webkit-mask: url(img/azur-logo-ink.webp) 50% 47% / calc((.02 + var(--p) * var(--p) * var(--p) * 40) * 480px) auto no-repeat, linear-gradient(rgb(0 0 0 / var(--late)) 0 0);
        mask: url(img/azur-logo-ink.webp) 50% 47% / calc((.02 + var(--p) * var(--p) * var(--p) * 40) * 480px) auto no-repeat, linear-gradient(rgb(0 0 0 / var(--late)) 0 0); }`,
    html: () => TV6() },
  { key: 'wordmask', name: 'Das Zimmer in der Schrift', tags: ['Schrift', 'leicht'],
    idea: 'Alles wird weiß, nur im großen Wort TRIKOTS sieht man noch das Zimmer. Dann wird das Wort klein und der Shop ist da.',
    css: `.U-wordmask .wm { position: absolute; inset: 0; z-index: 3; background: rgb(255 255 255 / clamp(0, var(--p) * 3, 1)); }
      .U-wordmask .wm b { position: absolute; inset: 0; display: grid; place-items: center; font: 900 300px/1 'Archivo', sans-serif; font-stretch: 62%;
        background: url(img/room.webp) 0 0/1280px 720px; -webkit-background-clip: text; background-clip: text; color: transparent;
        transform: scale(calc(1 - var(--a2) * .5)); opacity: calc(1 - var(--a2)); }`,
    html: () => TV6('<div class="wm"><b>TRIKOTS</b></div>', { late: true }) },
  { key: 'banner', name: 'Zimmer wird zur Linie', tags: ['Header', 'leicht'],
    idea: 'Das Zimmer wird von oben und unten zusammengedrückt, bis nur ein dünner Streifen unter dem Header bleibt.',
    css: `.U-banner .room { clip-path: inset(calc(var(--a1) * 94px) 0 calc(var(--a1) * 622px) 0); opacity: calc(1 - var(--a2) * .85); }
      .U-banner .shop .sp { opacity: var(--a2); }`,
    html: () => TV6() },
  { key: 'polaroid', name: 'Foto wird weggelegt', tags: ['Foto', 'leicht'],
    idea: 'Das Zimmer bekommt einen weißen Rand wie ein Sofortbild, wird kleiner und wird schräg zur Seite gelegt.',
    css: `.U-polaroid .room { background-size: cover; background-position: center; border: calc(var(--a1) * 26px) solid #fff; border-bottom-width: calc(var(--a1) * 90px);
        transform: translate(calc(var(--a2) * -150%), calc(var(--a2) * 30%)) rotate(calc(var(--a1) * -5deg - var(--a2) * 20deg)) scale(calc(1 - var(--a1) * .5));
        box-shadow: 0 20px 50px rgb(0 0 0 / calc(var(--a1) * .4)); }
      .U-polaroid .shop .sp { opacity: calc(.15 + var(--p) * .85); }`,
    html: () => TV6() },
  { key: 'sticker', name: 'Sticker abziehen', tags: ['Sammelalbum', 'leicht'],
    idea: 'Wie ein Sticker im Sammelalbum: Das Zimmer wird von der rechten unteren Ecke abgezogen, darunter klebt der Shop.',
    css: `.U-sticker .room { -webkit-mask: linear-gradient(135deg, #000 calc((1 - var(--p)) * 100%), transparent 0); mask: linear-gradient(135deg, #000 calc((1 - var(--p)) * 100%), transparent 0); }
      .U-sticker .flap6 { background: linear-gradient(135deg, #d8d8d8, #fbfbfb 60%, #e2e2e2);
        -webkit-mask: linear-gradient(135deg, transparent calc((1 - var(--p)) * 100% - var(--p) * 22%), #000 0 calc((1 - var(--p)) * 100%), transparent 0);
        mask: linear-gradient(135deg, transparent calc((1 - var(--p)) * 100% - var(--p) * 22%), #000 0 calc((1 - var(--p)) * 100%), transparent 0); }`,
    html: () => TV6('<div class="ov flap6"></div>') },
  { key: 'deal', name: 'Karte wird ausgeteilt', tags: ['Karte', 'leicht'],
    idea: 'Der Shop kommt wie eine Karte schräg von rechts ins Bild und legt sich über das Zimmer.',
    css: `.U-deal .shop { z-index: 3; transform-origin: 100% 100%; transform: translateX(calc(var(--q) * 115%)) rotate(calc(var(--q) * 14deg)); box-shadow: -20px 20px 60px rgb(0 0 0 / .35); }
      .U-deal .room { filter: brightness(calc(1 - var(--p) * .5)); }`,
    html: () => TV6() },
  { key: 'sideways', name: 'Seitwärts in den Laden', tags: ['Scroll', 'leicht'],
    idea: 'Man scrollt nach unten, aber das Bild fährt nach links: Neben dem Zimmer liegt der Shop wie der nächste Raum.',
    css: `.U-sideways .room { transform: translateX(calc(var(--p) * -100%)); } .U-sideways .shop { transform: translateX(calc(var(--q) * 100%)); }`,
    html: () => TV6() },
  { key: 'diorama', name: 'Zimmer als Modell', tags: ['3D', 'leicht'],
    idea: 'Das Zimmer wird klein und kippt leicht wie ein Modell auf dem Tisch, dann fährt es nach oben weg.',
    css: `.U-diorama .tv { perspective: 1600px; }
      .U-diorama .room { transform: translateY(calc(var(--a2) * -140%)) rotateX(calc(var(--a1) * 26deg)) rotateZ(calc(var(--a1) * -4deg)) scale(calc(1 - var(--a1) * .58));
        box-shadow: 0 calc(var(--a1) * 26px) 0 #3a302a, 0 calc(var(--a1) * 70px) 90px rgb(0 0 0 / calc(var(--a1) * .4)); }
      .U-diorama .shop .sp { opacity: calc(var(--a1) * .2 + var(--a2) * .8); }`,
    html: () => TV6() },
  { key: 'blurfocus', name: 'Schärfe wandert', tags: ['Kamera', 'leicht'],
    idea: 'Das Zimmer wird unscharf, der Shop wird scharf, wie wenn eine Kamera den Fokus umstellt.',
    css: `.U-blurfocus .room { filter: blur(calc(var(--p) * 26px)); opacity: calc(1 - var(--a2)); }
      .U-blurfocus .shop { z-index: 3; background: rgb(255 255 255 / var(--p)); } .U-blurfocus .shop .sp { background: transparent; filter: blur(calc(var(--q) * 14px)); opacity: var(--p); }`,
    html: () => TV6() },
  { key: 'bw', name: 'Schwarz-Weiß, dann Weiß', tags: ['Farbe', 'leicht'],
    idea: 'Das Zimmer verliert seine Farben, wird hell und geht in das Weiß des Shops über. Passt zum schlichten Shop.',
    css: `.U-bw .room { filter: grayscale(var(--a1)) brightness(calc(1 + var(--a2) * 2)); }
      .U-bw .tv::after { content: ""; position: absolute; inset: 0; z-index: 2; background: #fff; opacity: var(--a2); }`,
    html: () => TV6('', { late: true }) },
  { key: 'wave', name: 'Welle', tags: ['Scroll', 'leicht'],
    idea: 'Der Shop steigt mit einer weichen Wellenkante von unten auf, die Welle läuft dabei seitlich mit.',
    css: `.U-wave .shop { z-index: 3; top: -70px; bottom: auto; height: 790px; padding-top: 70px; background: transparent; transform: translateY(calc(var(--q) * 100%));
        -webkit-mask: url("${WAVE_MASK}") calc(var(--p) * -900px) 0/360px 70px repeat-x, linear-gradient(#000 0 0) 0 69px/100% 100% no-repeat;
        mask: url("${WAVE_MASK}") calc(var(--p) * -900px) 0/360px 70px repeat-x, linear-gradient(#000 0 0) 0 69px/100% 100% no-repeat; }
      .U-wave .shop::before { content: ""; position: absolute; inset: 0; background: #fff; z-index: -1; }`,
    html: () => TV6() },
  { key: 'jerseymask', name: 'Durchs Trikot', tags: ['Trikot', 'leicht'],
    idea: 'Ein Trikot-Umriss wächst aus der Mitte. Durch ihn sieht man den Shop, bis er das ganze Bild füllt.',
    css: `.U-jerseymask .shop { z-index: 3;
        -webkit-mask: url("${JERSEY_MASK}") 50% 48% / calc((.04 + var(--p) * var(--p) * var(--p) * 7.5) * 720px) auto no-repeat;
        mask: url("${JERSEY_MASK}") 50% 48% / calc((.04 + var(--p) * var(--p) * var(--p) * 7.5) * 720px) auto no-repeat; }`,
    html: () => TV6() },
  { key: 'tobag', name: 'Ab in die Tasche', tags: ['Warenkorb', 'leicht'],
    idea: 'Das Zimmer schrumpft und fliegt in die Sporttasche oben rechts. Die Tasche hüpft kurz, der Shop ist da.',
    css: `.U-tobag .room { transform-origin: 1225px 62px; transform: scale(calc(1 - var(--p) * .985)); border-radius: calc(var(--p) * 300px); opacity: calc(1 - clamp(0, (var(--p) - .9) * 10, 1)); }
      .U-tobag .s-bag { transform: scale(calc(1 + clamp(0, (var(--p) - .86) * 12, 1) * (1 - clamp(0, (var(--p) - .95) * 20, 1)) * .4)); }`,
    html: () => TV6() },
  { key: 'tunnel', name: 'Spielertunnel', tags: ['Fußball', 'Licht', 'leicht'],
    idea: 'Wie der Gang aus der Kabine aufs Feld: Erst wird es dunkel, vorne ist ein helles Licht, dann steht man im weißen Shop.',
    css: `.U-tunnel .tn { background: radial-gradient(ellipse at 50% 50%, transparent calc((1 - var(--a1)) * 75%), #000 calc((1 - var(--a1)) * 75% + 12%)); }
      .U-tunnel .tn2 { background: radial-gradient(circle at 50% 50%, #fff calc(var(--a2) * 110%), transparent calc(var(--a2) * 110% + 8%)); opacity: var(--a1); }`,
    html: () => TV6('<div class="ov tn"></div><div class="ov tn2"></div>', { late: true }) },
  { key: 'floodlight', name: 'Flutlicht an', tags: ['Licht', 'leicht'],
    idea: 'Oben gehen zwei Flutlichter an, das Zimmer wird immer heller, bis nur noch Weiß und der Shop da sind.',
    css: `.U-floodlight .room { filter: brightness(calc(1 + var(--a1) * 2.5)) saturate(calc(1 - var(--a1) * .7)); }
      .U-floodlight .fl1 { background: radial-gradient(ellipse 45% 70% at 18% -10%, #fff, transparent 70%), radial-gradient(ellipse 45% 70% at 82% -10%, #fff, transparent 70%); opacity: var(--a1); }
      .U-floodlight .fl2 { background: #fff; opacity: var(--a2); }`,
    html: () => TV6('<div class="ov fl1"></div><div class="ov fl2"></div>', { late: true }) },
  { key: 'pitchview', name: 'Von oben aufs Feld', tags: ['Fußball', 'Raster', 'mittel'],
    idea: 'Das Zimmer kippt weg und hellgraue Spielfeld-Linien zeichnen sich. Aus den Linien werden die Trennlinien zwischen den Trikots.',
    css: `.U-pitchview .tv { perspective: 1200px; } .U-pitchview .room { transform-origin: 50% 100%; transform: rotateX(calc(var(--a1) * 70deg)); opacity: calc(1 - var(--a1)); }
      .U-pitchview .pv { position: absolute; inset: 0; z-index: 3; fill: none; stroke: #cfcfcf; stroke-width: 2; opacity: calc(var(--a1) * (1 - var(--a2))); }
      .U-pitchview .pv * { stroke-dasharray: 3200px; stroke-dashoffset: calc((1 - var(--a1)) * 3200px); }
      .U-pitchview .dv { position: absolute; z-index: 3; top: 150px; height: 360px; width: 1px; background: #e6e6e6; opacity: var(--a2); }
      .U-pitchview .shop .sp { opacity: var(--a2); }`,
    html: () => TV6('<svg class="pv" viewBox="0 0 1280 720"><rect x="140" y="110" width="1000" height="520"/><line x1="640" y1="110" x2="640" y2="630"/><circle cx="640" cy="370" r="80"/><rect x="140" y="250" width="140" height="240"/><rect x="1000" y="250" width="140" height="240"/></svg><i class="dv" style="left:440px"></i><i class="dv" style="left:840px"></i>') },
  { key: 'split3', name: 'Aus drei Teilen werden drei Trikots', tags: ['Raster', 'Teilen', 'mittel'],
    idea: 'Das Zimmer teilt sich in drei Spalten. Jede Spalte schrumpft in das Feld eines Trikots und wird zu ihm.',
    css: `.U-split3 .room { display: none; } .U-split3 .shop .sp { opacity: var(--a2); }
      .U-split3 .s3 { position: absolute; inset: 0; z-index: 3; background: url(img/room.webp) 0 0/1280px 720px; opacity: calc(1 - var(--a2));
        clip-path: inset(calc(var(--a1) * 150px) calc((var(--r0) + (var(--r1) - var(--r0)) * var(--a1)) * 1px) calc(var(--a1) * 270px) calc((var(--l0) + (var(--l1) - var(--l0)) * var(--a1)) * 1px)); }`,
    html: () => TV6([0, 1, 2].map(i => { const w = 1280 / 3, cx = 240 + i * 400; return `<div class="s3" style="--l0:${(i * w).toFixed(1)};--r0:${(1280 - (i + 1) * w).toFixed(1)};--l1:${cx - 150};--r1:${1280 - cx - 150}"></div>`; }).join('')) },
  { key: 'logoshrink', name: 'Neon-Logo wandert nach oben links', tags: ['Logo', 'leicht'],
    idea: 'Das Zimmer wird dunkel, nur das leuchtende Azur bleibt groß in der Mitte. Dann wird es klein, schwarz und setzt sich oben links in den Header.',
    css: `.U-logoshrink .s-hd .s-logo { visibility: hidden; } .U-logoshrink .lk { background: #000; opacity: calc(var(--a1) * .9); } .U-logoshrink .lw { background: #fff; opacity: var(--a2); }
      .U-logoshrink .lg6 { position: absolute; left: 0; top: 0; z-index: 5; height: auto; width: calc((640 - 593.5 * var(--a2)) * 1px);
        transform: translate(calc((320 - 280 * var(--a2)) * 1px), calc((208 - 157 * var(--a2)) * 1px)); }
      .U-logoshrink .lg6.p { opacity: calc(var(--a1) * (1 - var(--a2))); filter: drop-shadow(0 0 22px #3fd6f0); } .U-logoshrink .lg6.i { opacity: var(--a2); }
      .U-logoshrink .shop { z-index: 4; background: transparent; } .U-logoshrink .shop .sp { background: transparent; opacity: var(--a2); }`,
    html: () => TV6('<div class="ov lk"></div><div class="ov lw"></div><img class="lg6 p" src="img/azur-logo-paper.webp" alt=""><img class="lg6 i" src="img/azur-logo-ink.webp" alt="">') },
  { key: 'ministicky', name: 'Zimmer als kleines Fenster', tags: ['Navigation', 'leicht'],
    idea: 'Das Zimmer schrumpft in ein kleines Fenster unten rechts und bleibt dort. Ein Klick darauf bringt dich zurück ins Zimmer.',
    css: `.U-ministicky .room { transform-origin: 1252px 692px; transform: scale(calc(1 - var(--p) * .8)); border-radius: calc(var(--p) * 60px); box-shadow: 0 16px 40px rgb(0 0 0 / calc(var(--p) * .35)); }
      .U-ministicky .mlab { position: absolute; z-index: 5; right: 28px; top: 516px; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; opacity: var(--late); }`,
    html: () => TV6('<span class="mlab">↑ Zurück ins Zimmer</span>') },
  { key: 'tvwipe', name: 'TV-Wiederholung', tags: ['Fernsehen', 'leicht'],
    idea: 'Wie vor einer Zeitlupe im Fernsehen: Ein schräger schwarzer Balken mit dem Logo wischt durchs Bild, dahinter ist der Shop.',
    css: `.U-tvwipe { --x: calc((1700 - var(--p) * 2300) * 1px); }
      .U-tvwipe .shop { z-index: 3; clip-path: polygon(calc(var(--x) + 90px) 0, 100% 0, 100% 100%, calc(var(--x) - 90px) 100%); }
      .U-tvwipe .tvb { position: absolute; z-index: 5; top: -40px; height: 800px; width: 340px; left: calc(var(--x) - 170px); background: #000; transform: skewX(-14deg); display: grid; place-items: center; }
      .U-tvwipe .tvb img { width: 170px; transform: skewX(14deg); }`,
    html: () => TV6('<div class="tvb"><img src="img/azur-logo-paper.webp" alt=""></div>') },
];
