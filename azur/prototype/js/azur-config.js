/* AZUR — scene configuration.
   Everything that is art direction lives here: palette, views, motion, light over the day, copy.
   The other scripts only read from AZUR.config, so motion and look can change without touching logic. */
window.AZUR = window.AZUR || {};

AZUR.config = {
  assetBase: 'assets/scene3/views/',   // the renders (round 3 on): light passes, masks, depth per view
  neonGlow: 1.4,            // round 4: strength of the sign's soft glow (neon_glow.webp, added with the neon light)
  neonCore: 4.0,            // the tubes' cores this much brighter (the stored neon pass stops below them: white-hot core)
  flights: 'blend',         // change of view: 'blend' zooms the room's own picture into the next view (round 9: always the
                            // room's light); 'video' plays the rendered flights (round 7: their light can differ from the room's)
  gpuViews: 2,              // views that keep their light passes on the GPU (the others upload again when needed)

  /* Accent systems. A is the chosen one; the others stay switchable in the design panel. */
  palettes: {
    A: { name: 'Azur Electric',  glow: '#16B8FF', highlight: '#8DEBFF', ink: '#0A6A9A', night: '#07131D' },
    B: { name: 'Stadium Cobalt', glow: '#315CFF', highlight: '#A8C7FF', ink: '#2747D8', night: '#0A0D14' },
    C: { name: 'Acid Pitch',     glow: '#B7FF00', highlight: '#D9FF75', ink: '#466400', night: '#0B100A' },
    D: { name: 'Silver Neon',    glow: '#00E5FF', highlight: '#D7DCE2', ink: '#3D4651', night: '#090A0C' },
    E: { name: 'Night Claret',   glow: '#FF3568', highlight: '#FF8DA8', ink: '#C21A4C', night: '#12090D' },
    F: { name: 'Sunset Orange',  glow: '#FF7038', highlight: '#FFC36A', ink: '#A9441A', night: '#16100C' }
  },
  palette: 'A',

  /* Views = camera positions rendered in Blender (scene/render_queue.py). Positions of hangers, window and
     bed come from assets/views/views.json; the values here are art direction on top of that. */
  views: {
    // round 7 (the owner: "zu wackelig"): half the parallax; the room shifts gently instead of bending at depth edges
    room:   { label: 'Zimmer', parallax: 0.005, focus: 0.55, garmentScale: 1.0,
              bedHotspot: [[0.20, 0.83], [0.46, 0.79], [0.53, 1.0], [0.18, 1.0]] },
    rail:   { label: 'Ständer', parallax: 0.006, focus: 0.62, garmentScale: 1.0 },
    bed:    { label: 'Bett', parallax: 0.005, focus: 0.5, ids: false, window: false },
                // round 6: no view has its own exposure any more (the bed had +0.5 stops, -0.8 at night): one light for all
    rail_m: { label: 'Ständer', parallax: 0.004, focus: 0.62, garmentScale: 1.0, swipe: true }
  },
  startView: { desktop: 'room', mobile: 'rail_m' },
  /* Hover outlines (scene3 glow.png) and the white dots that invite a click: where each view can go. */
  targets: {
    room: ['bed', 'rail'],
    rail: ['bed'],
    bed: ['mag', 'bed', 'rail'],   // Runde 12: the bed glows and answers a click here too (it opens ANSTOSS, which lies on it)
    rail_m: []
  },
  outline: { strength: 0.95, ease: 9 },

  /* D5: the wall (interim, until the new renders): a free-standing wall in front of the old rail (scene3), three
     shadowbox frames on it (Brasilien, Deutschland, the next drop), drawn as HTML over the rendered room.
     mode: 'aus' (default) | 'mockup'; the theme sets it (section setting wall_mode), ?wall=mockup overrides it for tests.
     Geometry: plate uv (0..1 from the top-left), four points clockwise from the top-left, from the camera model of
     D1 (work/D1/geometrie.py, interim): the wall stands at y 2.65 m, x 0.52..3.00 m, up to top (m; lower than in D1 so
     the neon sign stays free); frames on it with their plaque, depth in metres for the parallax.
     sample: a strip of bare back wall in this view (plate uv: u0, v0, u1, v1) whose colour the wall takes. */
  wall: {
    mode: 'aus',
    images: { brasilien: 'assets/products/wall/brasilien.webp', deutschland: 'assets/products/wall/deutschland.webp' },
    // the room view with the wall reads as a free-standing partition in the middle of the room (D5 check): on desktop
    // the visit starts at the wall; the room stays one click away. null keeps startView.desktop.
    startDesktop: 'rail',
    albedo: 0.78,             // display brightness of the back wall in full daylight: the frames' light is the wall's / this
    room: {
      top: 1.80, depth: 2.871, sample: [0.47, 0.455, 0.62, 0.49],
      partition: [[0.3843, 0.2144], [0.8046, 0.2435], [0.7203, 0.7036], [0.411, 0.6039]],
      cap: [[0.3888, 0.2125], [0.8008, 0.2405], [0.8046, 0.2435], [0.3843, 0.2144]],
      floor: [[0.3986, 0.5999], [0.7385, 0.7095], [0.7497, 0.7754], [0.3776, 0.6431]],
      frames: {
        brasilien:   { frame: [[0.3878, 0.2367], [0.5065, 0.2466], [0.5056, 0.4926], [0.4033, 0.4686]], plaque: [[0.4844, 0.492], [0.5075, 0.4975], [0.5074, 0.5205], [0.4847, 0.5147]], depth: 2.896 },
        deutschland: { frame: [[0.516, 0.2474], [0.6567, 0.2592], [0.6317, 0.5222], [0.5136, 0.4945]], plaque: [[0.604, 0.5204], [0.6307, 0.5268], [0.6284, 0.5509], [0.6022, 0.5443]], depth: 2.679 },
        drop:        { frame: [[0.6643, 0.2955], [0.7864, 0.3082], [0.7482, 0.5215], [0.6436, 0.4985]], plaque: [[0.7133, 0.5196], [0.744, 0.5265], [0.7394, 0.5526], [0.7093, 0.5455]], depth: 2.487 }
      }
    },
    rail: {
      top: 1.72, depth: 1.964, sample: [0.12, 0.74, 0.55, 0.86],
      partition: [[-0.0487, 0.205], [0.8229, 0.2166], [0.8029, 1.2046], [-0.0127, 1.2489]],
      frames: {
        brasilien:   { frame: [[0.0377, 0.2249], [0.3128, 0.2282], [0.3192, 0.7729], [0.0538, 0.7792]], plaque: [[0.268, 0.7907], [0.3237, 0.7893], [0.3244, 0.8475], [0.2689, 0.8491]], depth: 1.858 },
        deutschland: { frame: [[0.3326, 0.2285], [0.5973, 0.2316], [0.594, 0.7663], [0.3383, 0.7724]], plaque: [[0.5367, 0.784], [0.5905, 0.7826], [0.5901, 0.8398], [0.5365, 0.8414]], depth: 1.894 },
        drop:        { frame: [[0.6158, 0.2949], [0.8087, 0.2964], [0.8008, 0.7027], [0.6128, 0.7065]], plaque: [[0.7387, 0.7219], [0.7913, 0.7207], [0.7902, 0.7776], [0.7379, 0.7789]], depth: 1.925 }
      }
    },
    rail_m: {
      top: 1.68, depth: 1.519, sample: [0.05, 0.68, 0.72, 0.78], parallax: 0,
      partition: [[-0.3027, 0.2165], [1.2648, 0.2165], [1.2007, 1.1131], [-0.2355, 1.1131]],
      frames: {
        brasilien:   { frame: [[0.0333, 0.2929], [0.3549, 0.2929], [0.3594, 0.6266], [0.0479, 0.6266]], plaque: [[0.2989, 0.6358], [0.3647, 0.6358], [0.3652, 0.6713], [0.2996, 0.6713]], depth: 1.439 },
        deutschland: { frame: [[0.3784, 0.2929], [0.7, 0.2929], [0.6937, 0.6266], [0.3822, 0.6266]], plaque: [[0.6206, 0.6358], [0.6865, 0.6358], [0.6858, 0.6713], [0.6202, 0.6713]], depth: 1.439 },
        drop:        { frame: [[0.7227, 0.3322], [0.965, 0.3322], [0.9537, 0.5894], [0.7173, 0.5894]], plaque: [[0.8705, 0.6001], [0.9366, 0.6001], [0.9351, 0.6358], [0.8693, 0.6358]], depth: 1.439 }
      }
    }
  },

  /* The room through the day, on the visitor's clock (hours). Night: he is asleep; morning: the duvet thrown back;
     day: he is out (fewer things on the floor); evening: the school bag is back. */
  dayStates: [{ from: 6.5, state: 'morning' }, { from: 9, state: 'day' }, { from: 17, state: 'evening' }, { from: 23, state: 'night' }],
  mobileQuery: '(max-width: 760px), (pointer: coarse) and (max-width: 1024px) and (orientation: portrait)',

  /* Motion. Durations in ms, pendulums in degrees and degrees per second. Tweak freely. */
  motion: {
    intensity: 1.0,           // global multiplier (design panel)
    /* the jerseys in the render swing on their hooks (degrees, per second); ripple = cloth wave in plate px.
       Round 7: calmer, no jelly: no cloth ripple, no idle breathing, a small swing that settles quickly; the jerseys
       only move when touched (hover, brush, click, chosen, the phone rail panning) */
    sway: { stiffness: 9, damping: 2.6, maxDeg: 1.6, hoverKick: 1.4, leaveKick: 0.6, brush: 0.00015, clickKick: 3.0, selectKick: 14,
            panImpulse: 0.0108, idleDeg: 0, ripple: 0, neighbour: 0.3 },
    // change of view ('blend'): this view zooms toward the next one and fades; the next settles from a little closer
    pan: { ms: 950, zoom: 1.6, drift: 0.05, settle: 1.06, back: 1.2 },
    parallaxEase: 3.5         // how fast the room follows the pointer (per second; round 7: by time, not per frame)
  },
  interactionStrength: 1.0,

  /* Light over the day. Each key: hour, then linear RGB weights for every rendered light pass.
     The browser mixes the passes (sky, sun_low, sun_high, neon, lamp, ceiling, street) with these weights.
     exposure is in stops (the approved stills use 2.65). neon is a scalar; its colour is the palette glow. */
  daylight: [
    { h: 0.0,  sky: [0.012, 0.016, 0.034], sunLow: 0, sunHigh: 0, neon: 1.05, lamp: 0.0,  ceiling: 0.0,  spot: 0.5, street: 0.3,  exposure: 3.0, window: 0.15, garment: [0.28, 0.0, 0.42] },
    { h: 5.2,  sky: [0.05, 0.065, 0.12],   sunLow: 0, sunHigh: 0, neon: 0.95, lamp: 0.0,  ceiling: 0.0,  spot: 0.35, street: 0.24, exposure: 2.95, window: 0.35, garment: [0.42, 0.0, 0.36] },
    { h: 6.4,  sky: [0.42, 0.46, 0.6],     sunLow: 0, sunHigh: 0, neon: 0.55, lamp: 0.0,  ceiling: 0.0,  spot: 0.25, street: 0.15, exposure: 2.8, window: 0.75, garment: [0.66, 0.02, 0.25] },
    { h: 8.5,  sky: [0.9, 0.9, 0.92],      sunLow: 0, sunHigh: [0.25, 0.24, 0.22], neon: 0.12, lamp: 0, ceiling: 0, spot: 0.3, street: 0, exposure: 2.75, window: 1, garment: [0.92, 0.0, 0.06] },
    { h: 12.5, sky: [1.0, 1.0, 1.0],       sunLow: 0, sunHigh: [0.75, 0.72, 0.66], neon: 0.08, lamp: 0, ceiling: 0, spot: 0.3, street: 0, exposure: 2.65, window: 1, garment: [0.98, 0.0, 0.0] },
    { h: 16.0, sky: [1.0, 0.97, 0.92],     sunLow: [0.35, 0.27, 0.18], sunHigh: [0.3, 0.27, 0.22], neon: 0.12, lamp: 0, ceiling: 0, spot: 0.35, street: 0, exposure: 2.65, window: 1, garment: [0.95, 0.12, 0.0] },
    { h: 18.4, sky: [1.0, 0.86, 0.72],     sunLow: [1.0, 0.6, 0.33], sunHigh: 0, neon: 0.35, lamp: 0, ceiling: 0, spot: 0.45, street: 0, exposure: 2.65, window: 1, garment: [0.92, 0.32, 0.0] },
    { h: 19.6, sky: [0.62, 0.45, 0.42],    sunLow: [0.85, 0.36, 0.14], sunHigh: 0, neon: 0.75, lamp: 0.25, ceiling: 0, spot: 0.6, street: 0, exposure: 2.85, window: 0.8, garment: [0.78, 0.4, 0.05] },
    { h: 20.6, sky: [0.17, 0.22, 0.42],    sunLow: 0, sunHigh: 0, neon: 1.0, lamp: 0.75, ceiling: 0.0, spot: 0.7, street: 0.15, exposure: 2.95, window: 0.55, garment: [0.48, 0.12, 0.3] },
    { h: 22.3, sky: [0.04, 0.055, 0.11],   sunLow: 0, sunHigh: 0, neon: 1.05, lamp: 0.85, ceiling: 0.0, spot: 0.7, street: 0.3, exposure: 3.0, window: 0.25, garment: [0.32, 0.04, 0.36] },
    { h: 23.0, sky: [0.02, 0.028, 0.06],   sunLow: 0, sunHigh: 0, neon: 1.05, lamp: 0.0,  ceiling: 0.0, spot: 0.55, street: 0.3, exposure: 3.0, window: 0.18, garment: [0.3, 0.0, 0.4] },   // lights out
    { h: 24.0, sky: [0.012, 0.016, 0.034], sunLow: 0, sunHigh: 0, neon: 1.05, lamp: 0.0,  ceiling: 0.0,  spot: 0.5, street: 0.3,  exposure: 3.0, window: 0.15, garment: [0.28, 0.0, 0.42] }
  ],
  lampTint: [1.0, 0.62, 0.32],        // warm bulb in the desk lamp
  ceilingTint: [1.0, 0.86, 0.68],
  streetTint: [0.95, 0.84, 0.7],    // LED street lamp, slightly warm
  spotTint: [1.0, 0.82, 0.62],      // ceiling spot over the rail (scene2): warm, shows the jerseys
  /* Germany-typical sun times (shifted by season, see azur-light.js); no geolocation needed. */
  location: { lat: 51.2, lon: 10.4 },

  /* Labels and copy (customer facing = German). */
  copy: {
    hintDesktop: 'Wähle ein Trikot',
    hintMobile: 'Tippe auf ein Trikot',
    view: 'Ansehen',
    viewJersey: 'Trikot ansehen',
    putBack: 'Zurückhängen',
    backToRoom: 'Zurück ins Zimmer',
    room: 'Zimmer', rail: 'Ständer', bed: 'Bett',
    chooseSize: 'Größe wählen',
    addToCart: 'In den Warenkorb',
    added: 'Im Warenkorb',
    cart: 'Warenkorb', checkout: 'Zur Kasse', emptyCart: 'Dein Warenkorb ist leer.',
    total: 'Summe', inclVat: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    nav: ['Shop', 'Kollektion', 'Über uns'],
    dropTitle: 'Nächster Drop',
    dropText: 'Noch unter Verschluss.',
    dropPlaceholder: 'Deine E-Mail-Adresse',
    dropButton: 'Benachrichtige mich',
    dropLegal: 'Mit der Anmeldung erhältst du E-Mails von AZUR zu neuen Drops. Abmeldung jederzeit möglich.',
    dropDone: 'Du bist dabei.',
    dropDoneText: 'Wir melden uns, bevor der Drop live geht.',
    dropInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    bedTease: 'Psst. Blätter mal im Heft auf der Decke.',
    bedTeaseNight: 'Psst. Das Heft ist vom Bett gerutscht. Blätter mal rein.',   // at night it lies on the floor
    magSpot: 'ANSTOSS lesen',
    mag: {
      label: 'ANSTOSS, Ausgabe 01. Das Heft von AZUR',
      prev: 'Zurückblättern', next: 'Weiterblättern', close: 'Heft zuklappen',
      coverWord: 'Titel', backWord: 'Rückseite',
      issue: 'Ausgabe 01 · Das Heft von AZUR',
      coverAlt: 'Zwei Kinder spielen Fußball im Morgennebel, einer im Fallrückzieher, einer im Tor.',
      coverLines: ['Zwei Städte.', 'Drei Länder.', 'Ein Zimmer.'],
      coverSticker: 'Mit Lookbook: alle Trikots',
      editorialKicker: 'Editorial',
      editorialHead: 'Anstoß.',
      editorialLead: 'Poster an der Wand, der Ball unterm Bett, das Trikot für morgen schon rausgelegt. So fängt es an.',
      about: ['Wir nehmen Farben und Zeichen von Ländern und Städten und setzen sie auf ein reduziertes Trikot.',
              'Embleme und die Azur-Signatur auf der Brust. Getragen auf dem Platz und danach.'],
      sign: 'Emir & Talha',
      signNote: 'Emir Kilic und Talha Zaffar, Gründer von AZUR',
      storyAlt: 'Ein Spieler im roten Shirt schießt einen Ball über eine sonnige Wiese.',
      storyQuote: 'Getragen auf dem Platz und danach.',
      lookKicker: 'Lookbook',
      tocKicker: 'In diesem Heft',
      toRail: 'Am Ständer ansehen', toProduct: 'Ansehen', toShop: 'Im Shop',
      /* pages: null = the default issue (cover, editorial, photo, all jerseys, drop, back); see azur-mag.js */
      pages: null,
      dropKicker: 'Vorschau',
      dropHead: 'Nächster Drop',
      dropText: 'Am Ständer hängt noch etwas unter der Hülle. Noch unter Verschluss. Trag dich ein, dann erfährst du es zuerst.',
      toDrop: 'Zur Hülle am Ständer',
      bye: 'Bis zum nächsten Anstoß.',
      credits: 'Fotos: sasint, Negative Space (CC0)'
    },
    roomHint: 'Klick auf den Ständer oder aufs Bett',
    goBed: 'Zum Bett', goRail: 'Zum Ständer',
    menu: 'Menü', menuClose: 'Menü schließen', bag: 'Sporttasche (Warenkorb)',
    menuLinks: [['Shop', 'rail'], ['Kollektion', 'rail'], ['Über uns', 'mag'], ['Zimmer', 'room']],
    shipTo: 'Noch {x} bis zum kostenlosen Versand',
    shipFree: 'Versand ist kostenlos',
    keepLooking: 'Weiter umsehen', toCart: 'Zur Tasche',
    openInShop: 'Im Shop öffnen',
    /* D5: only with the wall on (A.config.wall.mode 'mockup'): these replace the rail's words above */
    wall: {
      rail: 'Wand', railLabel: 'Trikots an der Wand', putBack: 'Schließen',
      roomHint: 'Klick auf die Wand oder aufs Bett', goRail: 'Zur Wand',
      altRoom: 'Ein Kinderzimmer mit Fußballpostern. An der Wand hängen zwei AZUR-Trikots in Rahmen hinter Glas, darüber ein AZUR-Neonschild.',
      mag: {
        toRail: 'An der Wand ansehen',
        dropText: 'Ein Rahmen an der Wand ist noch leer. Noch unter Verschluss. Trag dich ein, dann erfährst du es zuerst.',
        toDrop: 'Zum leeren Rahmen'
      }
    },
    prototypeNote: 'Prototyp · Warenkorb und Anmeldung sind simuliert'
  }
};

/* Paths are written as in the prototype ('assets/scene2/views/rail/sky.webp'). In Shopify the section sets
   AZUR.config.urlMap (renders in Content > Files, logos in the theme's assets) and AZUR.config.inline (the JSON). */
AZUR.url = p => (AZUR.config.urlMap ? AZUR.config.urlMap(p) : p);


/* Escapes text before it goes into innerHTML (product names and descriptions come from the shop). */
AZUR.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
