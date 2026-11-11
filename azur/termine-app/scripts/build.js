#!/usr/bin/env node
// Baut aus src/ die beiden Fassungen von AZUR Termine:
//   artifact/index.html   eine Datei für claude.ai (Daten in der claude.ai-Datenbank)
//   desktop/renderer/     Oberfläche der App für Windows und Mac (Daten auf dem Computer oder in eurer Cloud)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const read = (n) => fs.readFileSync(path.join(SRC, n), 'utf8');

// AZUR-Logo (ein Pfad, in der Schriftfarbe gezeichnet), aus azur/assets/logo/azur-logo.svg
const svg = fs.readFileSync(path.join(ROOT, '..', 'assets', 'logo', 'azur-logo.svg'), 'utf8');
const d = /<path[^>]*\sd="([^"]+)"/.exec(svg)[1];
const box = /viewBox="([^"]+)"/.exec(svg)[1];
const small = d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(parseFloat(n) * 10) / 10)).replace(/\s+/g, ' ').trim();
const logo = `<svg viewBox="${box}" role="img" aria-label="AZUR"><path fill="currentColor" fill-rule="evenodd" d="${small}"/></svg>`;

const css = read('ui.css').trim();
const markup = read('ui.html').trim().replace('<!--LOGO-->', logo);
const ui = read('ui.js').trim();

// claude.ai: alles in einer Datei
const artifact = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AZUR Termine</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body data-view="liste">
${markup}
<script>
${read('store-claude.js').trim()}
</script>
<script>
${ui}
</script>
</body>
</html>
`;
fs.mkdirSync(path.join(ROOT, 'artifact'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifact', 'index.html'), artifact);

// App für Windows und Mac
const out = path.join(ROOT, 'desktop', 'renderer');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'fonts'))) fs.copyFileSync(path.join(SRC, 'fonts', f), path.join(out, 'fonts', f));
const fonts = `/* Archivo (SIL Open Font License 1.1), lokal mitgeliefert */
@font-face { font-family: "Archivo"; font-style: normal; font-weight: 100 900; font-stretch: 62% 125%; font-display: swap;
  src: url("fonts/archivo-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: "Archivo"; font-style: normal; font-weight: 100 900; font-stretch: 62% 125%; font-display: swap;
  src: url("fonts/archivo-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF; }
`;
const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'setup.sql'), 'utf8');
const desk = read('store-desktop.js');
if (!desk.includes('/*SETUP_SQL*/""')) throw new Error('SQL-Platzhalter fehlt');
fs.writeFileSync(path.join(out, 'ui.css'), fonts + '\n' + css + '\n');
fs.writeFileSync(path.join(out, 'ui.js'), ui + '\n');
fs.writeFileSync(path.join(out, 'store-desktop.js'), desk.replace('/*SETUP_SQL*/""', JSON.stringify(sql)));
fs.copyFileSync(path.join(ROOT, 'desktop', 'vendor', 'supabase.js'), path.join(out, 'supabase.js'));
fs.writeFileSync(path.join(out, 'index.html'), `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src https: wss: http://127.0.0.1:*">
<title>AZUR Termine</title>
<link rel="stylesheet" href="ui.css">
</head>
<body data-view="liste">
${markup}
<script src="supabase.js"></script>
<script src="store-desktop.js"></script>
<script src="ui.js"></script>
</body>
</html>
`);
console.log('gebaut: artifact/index.html (' + artifact.length + ' Zeichen) und desktop/renderer/');
