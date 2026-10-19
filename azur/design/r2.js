/* Design round 2: one layout per card, one neutral palette (colours get their own round).
   Product view: variations of the three liked in round 1 (match programme, ticket, magazine) and two crossovers.
   Shop page: 30 new concepts (round 1's ten were all turned down). Helpers (sizes, cta, ship, trust, ...) come from
   swipe.html and are only called when a card is drawn. */
const PDP2 = [
  /* ------------------------------------------------------------ match programme */
  { key: 'pspread', fam: 'Spielprogramm', name: 'Aufgeschlagenes Heft', idea: 'Das Stadionheft liegt aufgeschlagen über dem Zimmer: links das Trikot als Titelseite, rechts die Aufstellung mit Größen, Preis und Kaufen.',
    tags: ['Original aus Runde 1', 'Größen als Aufstellung', 'Lieferzeit', 'Vertrauen'],
    css: `.L-pspread .book{position:absolute;inset:44px 70px;display:grid;grid-template-columns:1fr 1fr;box-shadow:0 40px 80px rgb(0 0 0/.45);background:var(--surf)}
      .L-pspread .book::after{content:"";position:absolute;left:50%;top:0;bottom:0;width:40px;margin-left:-20px;background:linear-gradient(90deg,transparent,rgb(0 0 0/.12),transparent)}
      .L-pspread .lp{background:var(--ink);color:var(--bg);padding:34px;display:grid;grid-template-rows:auto 1fr auto}
      .L-pspread .mast{font-family:'Libre Bodoni',serif;font-style:italic;font-size:34px;display:flex;justify-content:space-between;align-items:baseline}
      .L-pspread .mast span{font-family:'Martian Mono',monospace;font-style:normal;font-size:11px;letter-spacing:.12em}
      .L-pspread .lp img{height:460px;justify-self:center;align-self:center}.L-pspread .lp h1{font-size:76px}.L-pspread .lp h1 em{color:var(--bg);opacity:.55}
      .L-pspread .rp{padding:38px 44px;display:flex;flex-direction:column;gap:14px}
      .L-pspread .rp h2{font-family:'Libre Bodoni',serif;text-transform:none;font-size:38px;font-weight:700;font-stretch:100%}
      .L-pspread .line{display:grid;grid-template-columns:44px 1fr auto;gap:10px;padding:9px 6px;border-bottom:1px dashed var(--line);font-size:14px}
      .L-pspread .line b{font-family:'Martian Mono',monospace}.L-pspread .line.on{background:var(--surf2)}`,
    html: p => `<div class="bgroom"></div><div class="book"><div class="lp"><div class="mast">Azur Programm <span>Saison 26/27 · Nr. 01</span></div><img class="shadow" src="${p.img}" alt=""><h1>${title(p)}</h1></div>
      <div class="rp"><span class="eyebrow">Seite 2 · Aufstellung</span><h2>Wähl deine Nummer</h2>
      ${['S', 'M', 'L', 'XL'].map((s, i) => `<div class="line ${s === 'M' ? 'on' : ''}"><b>${[7, 9, 10, 11][i]}</b><span>Größe ${s}</span><span>${s === 'M' ? 'gewählt' : 'verfügbar'}</span></div>`).join('')}
      <div class="row"><span class="lab">Eintritt</span><span class="price">${eur(p.price)}</span></div>${cta(p, 'Jetzt sichern')}${ship()}${trust()}</div></div>` },

  { key: 'pcover', fam: 'Spielprogramm', name: 'Titelseite', idea: 'Die ganze Ansicht ist das Cover der aktuellen Ausgabe: großer Heftkopf, das Trikot als Titelbild, Coverzeilen, ein runder Preis-Stempel. Rechts eine schmale Bestellspalte.',
    tags: ['Cover statt Produktfoto', 'Preis-Stempel', 'Bestellspalte rechts', 'Lieferzeit als Coverzeile'],
    css: `.L-pcover .cv{position:absolute;inset:0;display:grid;grid-template-columns:1fr 380px;background:var(--surf)}
      .L-pcover .front{position:relative;padding:38px 54px;overflow:hidden;border-right:2px solid var(--ink)}
      .L-pcover .mast{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:8px solid var(--ink);padding-bottom:12px}
      .L-pcover .mast b{font-size:118px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.78}
      .L-pcover .mast span{font-family:'Martian Mono',monospace;font-size:12px;text-align:right;line-height:1.7}
      .L-pcover .front img{position:absolute;left:60%;top:180px;translate:-50% 0;height:540px}
      .L-pcover .lines{position:absolute;left:54px;bottom:50px;display:grid;gap:10px;max-width:250px;z-index:2}
      .L-pcover .lines span{font-weight:800;font-stretch:70%;font-size:28px;text-transform:uppercase;line-height:.95}.L-pcover .lines i{font-style:normal;color:var(--acc)}
      .L-pcover .stamp{position:absolute;right:58px;top:200px;width:156px;height:156px;border-radius:50%;background:var(--acc);color:var(--accInk);display:grid;place-content:center;text-align:center;
        font-weight:900;font-stretch:62%;font-size:34px;line-height:.9;rotate:12deg}.L-pcover .stamp small{font-size:15px;letter-spacing:.1em}
      .L-pcover .side{padding:40px 30px;display:flex;flex-direction:column;gap:16px}.L-pcover .side h2{font-size:52px}`,
    html: p => `<div class="cv"><div class="front"><div class="mast"><b>Programm</b><span>AZUR · Saison 26/27<br>Ausgabe 01</span></div><img class="shadow" src="${p.img}" alt="">
      <div class="lines"><span><i>Im Porträt:</i> ${p.name}${p.city ? ' ' + p.code : ''}</span><span>Größen S bis XL</span><span>In ca. 3 Werktagen bei dir</span></div><div class="stamp"><small>NUR</small>${eur(p.price)}</div></div>
      <div class="side"><span class="eyebrow">Bestellen</span><h2>${title(p)}</h2><p class="desc">${desc(p)}</p><div class="row"><span class="lab">Größe</span>${guide()}</div>${sizes()}${cta(p)}${ship()}${trust()}</div></div>` },

  { key: 'pteam', fam: 'Spielprogramm', name: 'Mannschaftsaufstellung', idea: 'Wie die Aufstellungsseite im Heft: die Größen stehen als Spieler auf einem gezeichneten Feld, die gewählte Größe ist markiert. Daneben das Trikot und Kaufen.',
    tags: ['Größen als Aufstellung', 'Gezeichnetes Feld', 'Spielerisch', 'Lieferzeit'],
    css: `.L-pteam .wrap{position:absolute;inset:44px 70px;display:grid;grid-template-columns:440px 1fr;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.42)}
      .L-pteam .im{display:grid;place-items:center;background:var(--surf2)}.L-pteam .im img{height:540px}
      .L-pteam .rp{padding:34px 40px;display:flex;flex-direction:column;gap:14px}.L-pteam .rp h2{font-size:50px}
      .L-pteam .pitch{position:relative;height:300px;border:2px solid var(--ink);margin-top:4px}
      .L-pteam .pitch::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:2px solid var(--ink)}
      .L-pteam .pitch::after{content:"";position:absolute;left:50%;top:50%;width:90px;height:90px;margin:-45px;border:2px solid var(--ink);border-radius:50%}
      .L-pteam .box{position:absolute;left:30%;right:30%;height:56px;border:2px solid var(--ink)}.L-pteam .box.t{top:-2px;border-top:0}.L-pteam .box.b{bottom:-2px;border-bottom:0}
      .L-pteam .pl{position:absolute;width:66px;height:66px;margin:-33px;border-radius:50%;background:var(--bg);border:2px solid var(--ink);display:grid;place-items:center;font-weight:900;font-size:20px;z-index:1}
      .L-pteam .pl.on{background:var(--acc);border-color:var(--acc);color:var(--accInk);box-shadow:0 0 0 6px color-mix(in srgb,var(--acc) 25%,transparent)}
      .L-pteam .pl small{position:absolute;bottom:-20px;font-family:'Martian Mono',monospace;font-size:10px;font-weight:400;color:var(--mut);white-space:nowrap}`,
    html: p => `<div class="bgroom"></div><div class="wrap"><div class="im"><img class="shadow" src="${p.img}" alt=""></div><div class="rp"><span class="eyebrow">Seite 4 · Aufstellung</span><h2>${title(p)}</h2>
      <div class="pitch"><span class="box t"></span><span class="box b"></span>
      ${[['S', 22, 72], ['M', 50, 64], ['L', 78, 72], ['XL', 50, 26]].map(([s, x, y]) => `<span class="pl ${s === 'M' ? 'on' : ''}" style="left:${x}%;top:${y}%">${s}<small>${s === 'M' ? 'aufgestellt' : 'frei'}</small></span>`).join('')}</div>
      <div class="row" style="margin-top:14px"><span class="lab">Aufgestellt: Größe M</span>${guide()}</div><div class="row"><span class="price">${eur(p.price)}</span></div>${cta(p, 'Aufstellen')}${ship()}</div></div>` },

  { key: 'pinfo', fam: 'Spielprogramm', name: 'Spieltag-Infos', idea: 'Die rechte Heftseite ist die Info-Tafel zum Spieltag: Anstoß ist die Lieferzeit, Spielort der Versand, Nachspielzeit die Rückgabe. Links eine große Nummer und das Trikot.',
    tags: ['Infos als Spieltag', 'Klare Tabelle', 'Rückgabe sichtbar', 'Große Nummer'],
    css: `.L-pinfo .book{position:absolute;inset:44px 70px;display:grid;grid-template-columns:1fr 1fr;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.45)}
      .L-pinfo .lp{position:relative;overflow:hidden;background:var(--surf2)}.L-pinfo .num{position:absolute;left:24px;top:-10px;font-size:300px;font-weight:900;font-stretch:62%;line-height:1;color:var(--ink);opacity:.1}
      .L-pinfo .lp img{position:absolute;left:50%;bottom:30px;translate:-50% 0;height:520px}.L-pinfo .lp .eyebrow{position:absolute;left:30px;bottom:24px}
      .L-pinfo .rp{padding:36px 42px;display:flex;flex-direction:column;gap:14px}.L-pinfo .rp h2{font-size:54px}
      .L-pinfo table{width:100%;border-collapse:collapse;font-size:14px}.L-pinfo td{padding:10px 0;border-bottom:1px solid var(--line)}.L-pinfo td:first-child{font-family:'Martian Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);width:150px}
      .L-pinfo td b{font-size:15px}`,
    html: p => `<div class="bgroom"></div><div class="book"><div class="lp"><span class="num">${p.city ? p.code : '01'}</span><img class="shadow" src="${p.img}" alt=""><span class="eyebrow">Heimspiel · Ausgabe 01</span></div>
      <div class="rp"><span class="eyebrow">Spieltag-Infos</span><h2>${title(p)}</h2><table>
      <tr><td>Anstoß</td><td><b>Lieferung in ca. 3 Werktagen</b></td></tr><tr><td>Spielort</td><td><b>Deutschland und EU</b>, ab 90 € versandkostenfrei</td></tr>
      <tr><td>Nachspielzeit</td><td><b>14 Tage Rückgabe</b>, Rückversand kostenlos</td></tr><tr><td>Startelf</td><td>${sizes()}</td></tr><tr><td>Eintritt</td><td><span class="price">${eur(p.price)}</span></td></tr></table>${cta(p)}</div></div>` },

  { key: 'pindex', fam: 'Spielprogramm', name: 'Inhaltsverzeichnis', idea: 'Rechts das Inhaltsverzeichnis des Hefts mit Seitenzahlen und Punktlinien. Der Kapitel-Eintrag „Größe wählen“ ist aufgeklappt und enthält alles zum Kaufen.',
    tags: ['Typografisch', 'Alles in einem Blick', 'Aufklappbar', 'Ruhig'],
    css: `.L-pindex .pg{position:absolute;inset:44px 70px;display:grid;grid-template-columns:500px 1fr;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.45)}
      .L-pindex .im{display:grid;place-items:center;border-right:1px solid var(--line)}.L-pindex .im img{height:560px}
      .L-pindex .toc{padding:40px 46px;display:flex;flex-direction:column;gap:6px}.L-pindex .toc h2{font-family:'Libre Bodoni',serif;font-size:44px;text-transform:none;font-stretch:100%;margin-bottom:10px}
      .L-pindex .it{display:flex;align-items:baseline;gap:10px;font-size:17px;font-weight:700;padding:8px 0}.L-pindex .it i{flex:1;border-bottom:2px dotted var(--line);transform:translateY(-4px)}
      .L-pindex .it b{font-family:'Martian Mono',monospace;font-size:13px}.L-pindex .it span:first-child{font-family:'Martian Mono',monospace;font-size:12px;color:var(--mut);width:28px}
      .L-pindex .open{border:1.5px solid var(--ink);padding:16px 18px;display:grid;gap:12px;margin:4px 0 8px}`,
    html: p => `<div class="bgroom"></div><div class="pg"><div class="im"><img class="shadow" src="${p.img}" alt=""></div><div class="toc"><span class="eyebrow">Azur Programm · Inhalt</span><h2>${p.name}${p.city ? ' ' + p.code : ''}</h2>
      <div class="it"><span>01</span>Das Trikot<i></i><b>S. 2</b></div><div class="it"><span>02</span>Größe wählen<i></i><b>S. 4</b></div>
      <div class="open"><div class="row"><span class="price">${eur(p.price)}</span>${guide()}</div>${sizes()}${cta(p)}</div>
      <div class="it"><span>03</span>Versand: ca. 3 Werktage, ab 90 € gratis<i></i><b>S. 6</b></div><div class="it"><span>04</span>14 Tage Rückgabe, Rückversand gratis<i></i><b>S. 7</b></div><div class="it"><span>05</span>Passt dazu<i></i><b>S. 8</b></div></div></div>` },

  { key: 'pfold', fam: 'Spielprogramm', name: 'Faltblatt', idea: 'Ein dreiteiliges Faltheft: in der Mitte das Trikot, links die Geschichte dazu, rechts klappt die Bestellseite leicht auf, als würde man sie gerade öffnen.',
    tags: ['Räumlich', 'Geschichte und Kauf getrennt', 'Aufklapp-Gefühl', 'Lieferzeit'],
    css: `.L-pfold .fold{position:absolute;left:70px;right:70px;top:60px;bottom:60px;display:grid;grid-template-columns:290px 1fr 380px;perspective:1800px}
      .L-pfold .pn{background:var(--surf);box-shadow:0 30px 60px rgb(0 0 0/.4);padding:34px 30px;display:flex;flex-direction:column;gap:14px}
      .L-pfold .a{transform:rotateY(12deg);transform-origin:right;background:var(--surf2)}.L-pfold .c{transform:rotateY(-9deg);transform-origin:left}
      .L-pfold .b{display:grid;place-items:center;position:relative}.L-pfold .b img{height:560px}.L-pfold .b h1{position:absolute;bottom:26px;left:30px;font-size:64px}
      .L-pfold .a p{font-family:'Libre Bodoni',serif;font-size:19px;line-height:1.45}.L-pfold .a p::first-letter{font-size:58px;float:left;line-height:.8;padding:6px 8px 0 0;font-weight:700}`,
    html: p => `<div class="bgroom"></div><div class="fold"><div class="pn a"><span class="eyebrow">Die Geschichte</span><p>${desc(p)} Aus einem Kinderzimmer voller Poster, für jeden Tag und jeden Platz.</p><span class="hand" style="font-size:26px">Seite umblättern →</span></div>
      <div class="pn b"><img class="shadow" src="${p.img}" alt=""><h1>${title(p)}</h1></div>
      <div class="pn c"><span class="eyebrow">Bestellseite</span><span class="price" style="font-size:28px">${eur(p.price)}</span><div class="row"><span class="lab">Größe</span>${guide()}</div>${sizes()}${cta(p)}${ship()}</div></div>` },

  { key: 'p1970', fam: 'Spielprogramm', name: '70er-Heft', idea: 'Ein Programmheft wie aus den 70ern: Rasterpunkte, grobe Druckfarbe, eine riesige runde Nummer, fette Schrift. Unten ein Kasten zum Bestellen wie eine alte Anzeige.',
    tags: ['Retro-Druck', 'Rasterpunkte', 'Große Nummer', 'Anzeigen-Kasten'],
    css: `.L-p1970 .pg{position:absolute;inset:0;background:var(--bg);overflow:hidden}
      .L-p1970 .dots{position:absolute;inset:0;background:radial-gradient(circle,var(--ink) 1.6px,transparent 2px) 0 0/12px 12px;opacity:.12}
      .L-p1970 .disc{position:absolute;left:60px;top:60px;width:330px;height:330px;border-radius:50%;background:var(--acc);color:var(--accInk);display:grid;place-content:center;text-align:center}
      .L-p1970 .disc b{font-size:150px;font-weight:900;font-stretch:62%;line-height:.8}.L-p1970 .disc span{font-family:'Martian Mono',monospace;font-size:12px;letter-spacing:.2em}
      .L-p1970 img.j{position:absolute;left:330px;top:40px;height:600px;filter:grayscale(.15) contrast(1.1) drop-shadow(10px 10px 0 var(--ink))}
      .L-p1970 h1{position:absolute;left:60px;bottom:250px;font-size:120px;font-weight:900}.L-p1970 h1 em{color:var(--acc)}
      .L-p1970 .ad{position:absolute;right:60px;top:60px;bottom:60px;width:360px;border:6px solid var(--ink);background:var(--surf);padding:26px;display:flex;flex-direction:column;gap:14px}
      .L-p1970 .ad h2{font-size:44px;font-weight:900}.L-p1970 .ad .cta{border:3px solid var(--ink)}
      .L-p1970 .foot{position:absolute;left:60px;bottom:60px;width:620px;font-family:'Libre Bodoni',serif;font-size:20px;line-height:1.4}`,
    html: p => `<div class="pg"><div class="dots"></div><div class="disc"><span>AUSGABE</span><b>${p.city ? p.code.slice(1) : '01'}</b><span>SAISON 26/27</span></div><img class="j" src="${p.img}" alt=""><h1>${title(p)}</h1>
      <p class="foot">${desc(p)}</p><div class="ad"><span class="eyebrow">Jetzt bestellen</span><h2>Dein Trikot für ${eur(p.price)}</h2>${sizes()}${cta(p, 'Bestellen')}${ship()}${trust()}</div></div>` },

  { key: 'pmini', fam: 'Spielprogramm', name: 'Modernes Cover', idea: 'Ein reduziertes, modernes Heftcover: feines Raster aus Linien, die Nummer riesig und dünn, das Trikot klein und genau gesetzt. Kaufen in einer ruhigen Spalte.',
    tags: ['Minimal', 'Viel Weißraum', 'Feine Linien', 'Hochwertig'],
    css: `.L-pmini .pg{position:absolute;inset:0;background:var(--surf);display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(8,1fr)}
      .L-pmini .pg i{border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
      .L-pmini .num{position:absolute;left:60px;top:40px;font-size:380px;font-weight:200;font-stretch:62%;line-height:.8;letter-spacing:-.02em}
      .L-pmini .j{position:absolute;left:420px;top:150px;height:440px}.L-pmini .meta{position:absolute;left:60px;bottom:50px;font-family:'Martian Mono',monospace;font-size:12px;line-height:1.8}
      .L-pmini .col{position:absolute;right:0;top:0;bottom:0;width:400px;background:var(--bg);border-left:1px solid var(--ink);padding:50px 40px;display:flex;flex-direction:column;gap:16px}
      .L-pmini .col h2{font-size:46px;font-weight:600}`,
    html: p => `<div class="pg">${'<i></i>'.repeat(96)}</div><div class="num">${p.city ? p.code : p.code}</div><img class="j shadow" src="${p.img}" alt="">
      <div class="meta">AZUR PROGRAMM<br>AUSGABE 01 · SAISON 26/27<br>${p.name.toUpperCase()}</div>
      <div class="col"><span class="eyebrow">${p.city ? 'Städte' : 'Länder'} · Retro</span><h2>${title(p)}</h2><span class="price">${eur(p.price)}</span><p class="desc">${desc(p)}</p>${sizes()}${cta(p)}${ship()}</div>` },

  /* ------------------------------------------------------------ ticket */
  { key: 'tclassic', fam: 'Ticket', name: 'Eintrittskarte', idea: 'Das Trikot als Eintrittskarte über dem Zimmer: Größe als Block, Lieferung als Anstoß, Preis und Kaufen auf dem Abriss.',
    tags: ['Original aus Runde 1', 'Klarer Abriss', 'Lieferzeit', 'Vertrauen'],
    css: `.L-tclassic .tk{position:absolute;left:100px;right:100px;top:150px;height:440px;display:grid;grid-template-columns:330px 1fr 250px;background:var(--surf);border-radius:18px;box-shadow:0 40px 80px rgb(0 0 0/.45)}
      .L-tclassic .tk::before,.L-tclassic .tk::after{content:"";position:absolute;right:236px;width:28px;height:28px;border-radius:50%;background:#1b1a19}.L-tclassic .tk::before{top:-14px}.L-tclassic .tk::after{bottom:-14px}
      .L-tclassic .im{background:var(--surf2);border-radius:18px 0 0 18px;display:grid;place-items:center}.L-tclassic .im img{height:360px}
      .L-tclassic .fd{padding:34px 36px;display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:18px 26px}.L-tclassic .fd h1{grid-column:1/-1;font-size:62px}
      .L-tclassic .f{display:grid;gap:6px}.L-tclassic .f b{font-size:16px}.L-tclassic .stub{border-left:2px dashed var(--line);padding:34px 26px;display:flex;flex-direction:column;gap:14px;justify-content:space-between}
      .L-tclassic .stub .cta{flex-direction:column;justify-content:center;gap:4px;height:auto;padding:12px 16px}.L-tclassic .stub .price{font-size:30px}
      .L-tclassic .bc{height:60px;background:repeating-linear-gradient(90deg,var(--ink) 0 2px,transparent 2px 5px,var(--ink) 5px 6px,transparent 6px 9px)}
      .L-tclassic .foot{position:absolute;left:0;right:0;bottom:120px;display:flex;justify-content:center}.L-tclassic .foot .trust{color:#e9e6df}.L-tclassic .foot .trust li::before{color:#fff}`,
    html: p => `<div class="bgroom"></div><div class="tk"><div class="im"><img src="${p.img}" alt=""></div><div class="fd"><h1>${title(p)}</h1>
      <div class="f"><span class="lab">Block · Größe</span>${sizes()}</div><div class="f"><span class="lab">Anstoß · Lieferung</span><b>ca. 3 Werktage</b><span class="desc">ab 90 € versandkostenfrei</span></div>
      <div class="f" style="grid-column:1/-1"><span class="lab">Spiel</span><span class="desc">${desc(p)}</span></div></div>
      <div class="stub"><span class="lab">Eintritt</span><div class="price">${eur(p.price)}</div><div class="bc"></div>${cta(p, 'Ticket lösen')}</div></div><div class="foot">${trust()}</div>` },

  { key: 'tvert', fam: 'Ticket', name: 'Hochformat-Ticket', idea: 'Links das Trikot groß im Zimmerlicht, rechts ein hohes Ticket im Hochformat. Unten an der Perforation der Abriss mit Preis und Kaufen.',
    tags: ['Trikot groß', 'Abriss unten', 'Klare Reihenfolge', 'Lieferzeit'],
    css: `.L-tvert img.j{position:absolute;left:110px;top:70px;height:660px}
      .L-tvert .tk{position:absolute;right:120px;top:50px;width:400px;height:700px;background:var(--surf);border-radius:16px;box-shadow:0 40px 80px rgb(0 0 0/.5);display:grid;grid-template-rows:1fr auto}
      .L-tvert .top{padding:34px 32px;display:flex;flex-direction:column;gap:14px}.L-tvert .top h1{font-size:60px}
      .L-tvert .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.L-tvert .grid div{display:grid;gap:4px}.L-tvert .grid b{font-size:15px}
      .L-tvert .stub{position:relative;border-top:2px dashed var(--line);padding:22px 32px 28px;display:grid;gap:12px}
      .L-tvert .stub::before,.L-tvert .stub::after{content:"";position:absolute;top:-15px;width:28px;height:28px;border-radius:50%;background:#1b1a19}.L-tvert .stub::before{left:-14px}.L-tvert .stub::after{right:-14px}`,
    html: p => `<div class="bgroom"></div><img class="j shadow" src="${p.img}" alt=""><div class="tk"><div class="top"><span class="eyebrow">Azur · Eintrittskarte</span><h1>${title(p)}</h1>
      <div class="grid"><div><span class="lab">Anstoß</span><b>ca. 3 Werktage</b></div><div><span class="lab">Spielort</span><b>DE · EU</b></div><div><span class="lab">Nachspielzeit</span><b>14 Tage Rückgabe</b></div><div><span class="lab">Schnitt</span><b>Retro</b></div></div>
      <span class="lab">Block · Größe</span>${sizes()}</div><div class="stub"><div class="row"><span class="lab">Eintritt</span><span class="price" style="font-size:26px">${eur(p.price)}</span></div>${cta(p, 'Ticket lösen')}${ship()}</div></div>` },

  { key: 'tseason', fam: 'Ticket', name: 'Dauerkarte', idea: 'Das Trikot als Dauerkarte im Kartenformat mit Chip und Saison-Aufdruck, leicht schräg gelegt. Daneben eine klare Bestellspalte.',
    tags: ['Karte statt Papier', 'Sammel-Gefühl', 'Bestellspalte', 'Modern'],
    css: `.L-tseason .card{position:absolute;left:110px;top:150px;width:640px;height:400px;border-radius:26px;background:linear-gradient(135deg,var(--ink),#3a3d44);color:var(--bg);rotate:-6deg;box-shadow:0 40px 80px rgb(0 0 0/.55);overflow:hidden}
      .L-tseason .card img{position:absolute;right:-30px;bottom:-60px;height:430px;rotate:6deg}
      .L-tseason .chip{position:absolute;left:44px;top:120px;width:70px;height:54px;border-radius:10px;background:linear-gradient(135deg,#d8c48a,#a8925a)}
      .L-tseason .card .k{position:absolute;left:44px;top:36px;font-family:'Martian Mono',monospace;font-size:13px;letter-spacing:.2em}
      .L-tseason .card h1{position:absolute;left:44px;bottom:44px;font-size:64px;color:var(--bg)}.L-tseason .card h1 em{color:var(--bg);opacity:.6}
      .L-tseason .card .no{position:absolute;left:44px;top:200px;font-family:'Martian Mono',monospace;font-size:18px;letter-spacing:.18em}
      .L-tseason .col{position:absolute;right:90px;top:120px;width:380px;background:var(--surf);padding:30px;display:flex;flex-direction:column;gap:14px;box-shadow:0 30px 60px rgb(0 0 0/.35)}`,
    html: p => `<div class="bgroom"></div><div class="card"><span class="k">DAUERKARTE · SAISON 26/27</span><span class="chip"></span><span class="no">AZUR ${p.city ? p.code : p.code} 0001</span><img src="${p.img}" alt=""><h1>${title(p)}</h1></div>
      <div class="col"><span class="eyebrow">Deine Karte für jeden Spieltag</span><span class="price" style="font-size:28px">${eur(p.price)}</span><div class="row"><span class="lab">Größe</span>${guide()}</div>${sizes()}${cta(p)}${ship()}${trust()}</div>` },

  { key: 'tseat', fam: 'Ticket', name: 'Platzwahl', idea: 'Die Größen als Blöcke rund um ein Spielfeld wie beim Ticketkauf im Stadion. Der gewählte Block leuchtet, rechts die Zusammenfassung mit Preis und Kaufen.',
    tags: ['Größe als Platzwahl', 'Spielerisch', 'Zusammenfassung', 'Lieferzeit'],
    css: `.L-tseat .wrap{position:absolute;inset:40px 60px;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.42);display:grid;grid-template-columns:1fr 360px}
      .L-tseat .map{position:relative;padding:40px}.L-tseat .field{position:absolute;left:180px;right:180px;top:220px;bottom:220px;border:2px solid var(--ink);display:grid;place-items:center}
      .L-tseat .field img{height:230px}.L-tseat .blk{position:absolute;border:2px solid var(--ink);display:grid;place-items:center;font-weight:900;font-size:26px;font-stretch:70%;background:var(--bg)}
      .L-tseat .blk small{display:block;font-family:'Martian Mono',monospace;font-size:10px;font-weight:400;letter-spacing:.08em;text-align:center}
      .L-tseat .blk.on{background:var(--acc);border-color:var(--acc);color:var(--accInk)}.L-tseat .sum{border-left:1px solid var(--line);padding:36px 30px;display:flex;flex-direction:column;gap:14px}
      .L-tseat .sum h2{font-size:46px}.L-tseat .t{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:8px 0;font-size:14px}`,
    html: p => `<div class="bgroom"></div><div class="wrap"><div class="map"><span class="eyebrow">Block wählen = Größe wählen</span><div class="field"><img class="shadow" src="${p.img}" alt=""></div>
      <div class="blk" style="left:180px;right:180px;top:110px;height:90px">S<small>Gegengerade</small></div><div class="blk on" style="left:180px;right:180px;bottom:110px;height:90px">M<small>Haupttribüne · gewählt</small></div>
      <div class="blk" style="left:40px;width:120px;top:220px;bottom:220px">L<small>Nordkurve</small></div><div class="blk" style="right:40px;width:120px;top:220px;bottom:220px">XL<small>Südkurve</small></div></div>
      <div class="sum"><span class="eyebrow">Deine Auswahl</span><h2>${title(p)}</h2><div class="t"><span>Block</span><b>M · Haupttribüne</b></div><div class="t"><span>Anstoß</span><b>ca. 3 Werktage</b></div><div class="t"><span>Rückgabe</span><b>14 Tage</b></div>
      <div class="row"><span class="lab">Summe</span><span class="price">${eur(p.price)}</span></div>${cta(p, 'Platz sichern')}${ship()}</div></div>` },

  { key: 'tstack', fam: 'Ticket', name: 'Ticket-Stapel', idea: 'Das gewählte Ticket liegt oben auf einem kleinen Stapel, darunter schauen die Tickets der anderen Trikots hervor. Hinweis: mit einem zweiten Ticket ist der Versand gratis.',
    tags: ['Zweites Trikot', 'Gratisversand-Anreiz', 'Ticket-Look', 'Passt dazu'],
    css: `.L-tstack .st{position:absolute;left:120px;top:110px;width:760px;height:420px}
      .L-tstack .tt{position:absolute;inset:0;background:var(--surf);border-radius:16px;box-shadow:0 20px 40px rgb(0 0 0/.35);display:grid;grid-template-columns:280px 1fr 220px;overflow:hidden}
      .L-tstack .tt.b1{rotate:-5deg;translate:-30px 26px;filter:brightness(.9)}.L-tstack .tt.b2{rotate:4deg;translate:30px 34px;filter:brightness(.82)}
      .L-tstack .tt .im{background:var(--surf2);display:grid;place-items:center}.L-tstack .tt .im img{height:320px}.L-tstack .tt .fd{padding:30px;display:flex;flex-direction:column;gap:12px}.L-tstack .tt h1{font-size:54px}
      .L-tstack .tt .stub{border-left:2px dashed var(--line);padding:30px 22px;display:flex;flex-direction:column;gap:12px;justify-content:center}.L-tstack .tt .stub .cta{flex-direction:column;justify-content:center;gap:4px;height:auto;padding:12px}
      .L-tstack .nudge{position:absolute;left:120px;right:400px;bottom:60px;background:var(--surf);padding:20px 26px;display:flex;gap:20px;align-items:center;box-shadow:0 20px 40px rgb(0 0 0/.3)}
      .L-tstack .nudge .ups{flex:1}.L-tstack .side{position:absolute;right:90px;top:120px;width:260px;color:#eee;display:grid;gap:14px}.L-tstack .side .trust{color:#ddd}`,
    html: p => { const o = others(p, 2); return `<div class="bgroom"></div><div class="st"><div class="tt b2"><div class="im"><img src="${o[1].img}" alt=""></div></div><div class="tt b1"><div class="im"><img src="${o[0].img}" alt=""></div></div>
      <div class="tt"><div class="im"><img src="${p.img}" alt=""></div><div class="fd"><span class="eyebrow">Eintrittskarte</span><h1>${title(p)}</h1><span class="lab">Block · Größe</span>${sizes()}</div>
      <div class="stub"><span class="price" style="font-size:26px">${eur(p.price)}</span>${cta(p, 'Lösen')}</div></div></div>
      <div class="nudge"><div style="width:220px;display:grid;gap:6px"><b>Zweites Ticket dazu?</b><span class="desc">Ab 90 € ist der Versand gratis.</span></div>${ups(p)}</div>
      <div class="side">${ship().replace('class="ship"', 'class="ship" style="color:#ddd"')}${trust()}</div>`; } },

  { key: 'tgate', fam: 'Ticket', name: 'Drehkreuz', idea: 'Oben ein Plakat wie zum Spiel: das Trikot groß, darunter wie ein Spielankündigungstext. Unten eine dunkle Einlass-Leiste wie am Drehkreuz: Größe wählen, Preis, „Einlass“.',
    tags: ['Plakat-Look', 'Kaufleiste unten', 'Einfach', 'Lieferzeit'],
    css: `.L-tgate .poster{position:absolute;inset:0 0 150px 0;background:var(--surf);overflow:hidden}
      .L-tgate .poster img{position:absolute;right:120px;top:20px;height:600px}.L-tgate .poster h1{position:absolute;left:80px;top:90px;font-size:150px;font-weight:900}
      .L-tgate .poster .vs{position:absolute;left:84px;top:360px;font-family:'Libre Bodoni',serif;font-size:30px;font-style:italic;max-width:520px;line-height:1.3}
      .L-tgate .poster .k{position:absolute;left:84px;top:60px;font-family:'Martian Mono',monospace;font-size:13px;letter-spacing:.2em}
      .L-tgate .gate{position:absolute;left:0;right:0;bottom:0;height:150px;background:var(--ink);color:var(--bg);display:flex;align-items:center;gap:40px;padding:0 80px}
      .L-tgate .gate .sz span{background:transparent;color:var(--bg);border-color:#555}.L-tgate .gate .sz span.on{background:var(--bg);color:var(--ink)}
      .L-tgate .gate .cta{margin-left:auto;width:320px;height:70px;font-size:22px}.L-tgate .gate .price{font-size:30px}
      .L-tgate .scan{width:110px;height:60px;background:repeating-linear-gradient(90deg,var(--bg) 0 2px,transparent 2px 5px,var(--bg) 5px 6px,transparent 6px 9px)}`,
    html: p => `<div class="poster"><span class="k">AZUR PRÄSENTIERT · HEIMSPIEL</span><h1>${title(p)}</h1><p class="vs">${desc(p)}<br><span class="desc" style="font-family:Archivo;font-style:normal;font-size:15px">Anstoß: ca. 3 Werktage nach Bestellung · 14 Tage Rückgabe</span></p><img class="shadow" src="${p.img}" alt=""></div>
      <div class="gate"><span class="scan"></span>${sizes()}<span class="price">${eur(p.price)}</span>${cta(p, 'Einlass →')}</div>` },

  { key: 'tbooth', fam: 'Ticket', name: 'Kassenhäuschen', idea: 'Ein Kassenhäuschen am Stadion: oben das Schild „Kasse“, im Fenster das Trikot, darunter die Preistafel mit den Größen als Kategorien und der Kauf am Tresen.',
    tags: ['Stadion-Ort', 'Preistafel', 'Größen als Kategorien', 'Spielerisch'],
    css: `.L-tbooth .bo{position:absolute;left:230px;right:230px;top:40px;bottom:40px;background:var(--surf);border:10px solid var(--ink);box-shadow:0 40px 80px rgb(0 0 0/.5)}
      .L-tbooth .sign{height:84px;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-size:56px;font-weight:900;font-stretch:62%;letter-spacing:.2em}
      .L-tbooth .win{position:relative;height:330px;margin:24px 40px 0;border:6px solid var(--ink);background:linear-gradient(160deg,var(--surf2),var(--bg));display:grid;place-items:center;overflow:hidden}
      .L-tbooth .win img{height:300px}.L-tbooth .win::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 40%,rgb(255 255 255/.35) 46%,transparent 52%)}
      .L-tbooth .board{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:22px 40px}.L-tbooth .cat{display:grid;gap:4px}.L-tbooth .cat div{display:flex;justify-content:space-between;font-family:'Martian Mono',monospace;font-size:13px;border-bottom:1px dotted var(--line);padding:4px 0}
      .L-tbooth .cat div.on{font-weight:700;color:var(--acc)}.L-tbooth .counter{display:grid;gap:10px}.L-tbooth h2{font-size:42px}`,
    html: p => `<div class="bgroom"></div><div class="bo"><div class="sign">KASSE</div><div class="win"><img class="shadow" src="${p.img}" alt=""></div><div class="board">
      <div class="cat"><span class="lab">Kategorien (Größen)</span>${['S', 'M', 'L', 'XL'].map(s => `<div class="${s === 'M' ? 'on' : ''}"><span>Kat. ${s}${s === 'M' ? ' ✓' : ''}</span><span>${eur(p.price)}</span></div>`).join('')}</div>
      <div class="counter"><h2>${title(p)}</h2>${cta(p)}${ship()}</div></div></div>` },

  { key: 'tpaper', fam: 'Ticket', name: 'Altes Papierticket', idea: 'Ein altes, gedrucktes Papierticket mit Zackenrand, laufender Nummer und Stempel. Groß und mittig, das Trikot als Bild auf dem Ticket, der Kauf auf dem Kontrollabschnitt.',
    tags: ['Vintage', 'Stempel', 'Laufende Nummer', 'Kontrollabschnitt'],
    css: `.L-tpaper .tk{position:absolute;left:120px;right:120px;top:120px;height:540px;background:#efe6d2;color:#2a2318;display:grid;grid-template-columns:1fr 300px;box-shadow:0 40px 80px rgb(0 0 0/.5);
  }
      .L-tpaper .tk::after{content:"";position:absolute;left:-9px;right:-9px;top:0;bottom:0;pointer-events:none;
        background:radial-gradient(circle 9px at 9px 13px,#1b1a19 96%,transparent) left top/18px 26px repeat-y,radial-gradient(circle 9px at 9px 13px,#1b1a19 96%,transparent) right top/18px 26px repeat-y}
      .L-tpaper .tk::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgb(0 0 0/.03) 0 2px,transparent 2px 5px);pointer-events:none}
      .L-tpaper .main{position:relative;padding:36px 44px;border-right:3px dotted #8a7a5c}.L-tpaper .main h1{font-size:84px;color:#2a2318;font-weight:900}.L-tpaper .main h1 em{color:#9b2a1e}
      .L-tpaper .main img{position:absolute;right:30px;bottom:20px;height:400px;filter:sepia(.25)}.L-tpaper .no{font-family:'Martian Mono',monospace;font-size:13px;letter-spacing:.2em}
      .L-tpaper .rows{display:grid;gap:8px;margin-top:26px;font-family:'Martian Mono',monospace;font-size:13px;max-width:330px}.L-tpaper .rows div{display:flex;justify-content:space-between;border-bottom:1px solid #b9a982;padding-bottom:6px}
      .L-tpaper .stamp{position:absolute;left:330px;top:250px;border:4px solid #9b2a1e;color:#9b2a1e;padding:6px 14px;font-weight:900;font-size:30px;font-stretch:70%;rotate:-14deg;opacity:.8}
      .L-tpaper .ctrl{padding:36px 28px;display:flex;flex-direction:column;gap:14px}.L-tpaper .ctrl .sz span{background:transparent;border-color:#8a7a5c;color:#2a2318}.L-tpaper .ctrl .sz span.on{background:#2a2318;color:#efe6d2}
      .L-tpaper .ctrl .cta{background:#2a2318;color:#efe6d2}`,
    html: p => `<div class="bgroom"></div><div class="tk"><div class="main"><span class="no">EINTRITTSKARTE · NR. 000${p.city ? p.code : '101'}</span><h1>${title(p)}</h1>
      <div class="rows"><div><span>BLOCK</span><span>GRÖSSE M</span></div><div><span>ANSTOSS</span><span>CA. 3 WERKTAGE</span></div><div><span>RÜCKGABE</span><span>14 TAGE</span></div></div>
      <span class="stamp">GÜLTIG</span><img src="${p.img}" alt=""></div><div class="ctrl"><span class="no">KONTROLL-ABSCHNITT</span><span class="price" style="font-size:30px">${eur(p.price)}</span>${sizes()}${cta(p, 'Lösen')}<span class="desc" style="color:#5b4f3a">Ab 90 € versandkostenfrei.</span></div></div>` },

  /* ------------------------------------------------------------ magazine */
  { key: 'mclassic', fam: 'Magazin', name: 'Modemagazin', idea: 'Der Name riesig quer über die Seite, das Trikot davor, Text in Spalten. Unten eine feste Kaufleiste, die immer sichtbar bleibt.',
    tags: ['Original aus Runde 1', 'Feste Kaufleiste', 'Mode statt Fanartikel', 'Storytelling'],
    css: `.m.L-mclassic{background:var(--bg)}.L-mclassic .big{position:absolute;left:0;right:0;top:40px;text-align:center;font-size:250px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.85;letter-spacing:-.01em}
      .L-mclassic .im{position:absolute;left:50%;top:120px;translate:-50% 0;height:540px}.L-mclassic .colL{position:absolute;left:70px;top:330px;width:300px;display:grid;gap:12px}
      .L-mclassic .colR{position:absolute;right:70px;top:330px;width:280px;display:grid;gap:10px;font-size:13px}.L-mclassic .colR div{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:8px}
      .L-mclassic .bar2{position:absolute;left:40px;right:40px;bottom:30px;height:84px;background:var(--surf);border-radius:var(--r);display:grid;grid-template-columns:1.2fr 1fr 1fr 1.2fr;align-items:center;gap:26px;padding:0 26px;box-shadow:0 20px 40px rgb(0 0 0/.18)}
      .L-mclassic .bar2 h3{font-size:30px}`,
    html: p => `<div class="big">${p.name}</div><img class="im shadow" src="${p.img}" alt=""><div class="colL"><span class="eyebrow">Ausgabe 01 · ${p.city ? 'Die Stadt auf dem Rücken' : 'Retro-Länder'}</span>
      <p style="font-size:17px;line-height:1.5">${desc(p)} Getragen auf dem Platz und danach.</p><span class="hand" style="font-size:26px">für jeden Tag, nicht nur Spieltag</span></div>
      <div class="colR"><div><span>Schnitt</span><b>Retro, gerade</b></div><div><span>Kragen</span><b>${p.city ? 'Polo' : 'Rund'}</b></div><div><span>Rückgabe</span><b>14 Tage</b></div><div><span>Versand DE</span><b>ca. 3 Werktage</b></div></div>
      <div class="bar2"><div><h3>${title(p)}</h3><div class="price">${eur(p.price)}</div></div>${sizes()}${ship()}${cta(p)}</div>` },

  { key: 'mcover', fam: 'Magazin', name: 'Heft-Cover', idea: 'Das Trikot als Coverstar des Azur-Magazins ANSTOSS, mit Heftkopf, Coverzeilen und Barcode. Der Preis klebt als Aufkleber auf dem Cover, rechts die Bestellspalte.',
    tags: ['Marke: ANSTOSS', 'Coverstar', 'Preis-Aufkleber', 'Bestellspalte'],
    css: `.L-mcover .cv{position:absolute;left:150px;top:30px;width:560px;height:740px;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.5);overflow:hidden}
      .L-mcover .cv b.mh{position:absolute;left:26px;right:26px;top:16px;font-size:132px;font-weight:900;font-stretch:62%;line-height:.85;letter-spacing:.01em;text-align:center}
      .L-mcover .cv img{position:absolute;left:62%;top:160px;translate:-50% 0;height:470px}.L-mcover .cv .cl{position:absolute;left:26px;top:180px;width:170px;display:grid;gap:12px;z-index:2}
      .L-mcover .cv .cl span{font-weight:800;font-stretch:70%;font-size:22px;text-transform:uppercase;line-height:1}.L-mcover .cv .cl i{display:block;font-style:normal;font-family:'Martian Mono',monospace;font-size:10px;font-weight:400;letter-spacing:.08em;color:var(--mut)}
      .L-mcover .cv h1{position:absolute;left:26px;bottom:40px;font-size:70px;z-index:2}.L-mcover .bar{position:absolute;right:26px;bottom:30px;width:110px;height:56px;background:#fff;padding:6px}
      .L-mcover .bar i{display:block;height:100%;background:repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 4px,#111 4px 5px,transparent 5px 8px)}
      .L-mcover .stk{position:absolute;right:30px;top:220px;width:130px;height:130px;border-radius:50%;background:var(--acc);color:var(--accInk);display:grid;place-content:center;text-align:center;font-weight:900;font-stretch:62%;font-size:28px;line-height:.95;rotate:-10deg}
      .L-mcover .col{position:absolute;right:120px;top:120px;width:360px;background:var(--surf);padding:30px;display:flex;flex-direction:column;gap:14px;box-shadow:0 30px 60px rgb(0 0 0/.35)}`,
    html: p => `<div class="bgroom"></div><div class="cv"><b class="mh">ANSTOSS</b><div class="cl"><span>Die Stadt auf dem Rücken<i>Seite 12</i></span><span>Größen S bis XL<i>Seite 18</i></span><span>In 3 Tagen bei dir<i>Seite 20</i></span></div>
      <img class="shadow" src="${p.img}" alt=""><h1>${title(p)}</h1><span class="bar"><i></i></span><span class="stk">${eur(p.price)}</span></div>
      <div class="col"><span class="eyebrow">Das Trikot vom Cover</span><h2 style="font-size:40px">${title(p)}</h2>${sizes()}${cta(p)}${ship()}${trust()}</div>` },

  { key: 'mspread', fam: 'Magazin', name: 'Doppelseite', idea: 'Eine Modestrecke über zwei Seiten: links ein großes Bild aus dem Zimmer mit dem Trikot, rechts der Artikel mit Initiale und einem umrandeten Info-Kasten zum Kaufen.',
    tags: ['Großes Bild', 'Artikel', 'Info-Kasten', 'Hochwertig'],
    css: `.L-mspread .sp{position:absolute;inset:36px 60px;display:grid;grid-template-columns:1fr 1fr;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.45)}
      .L-mspread .ph{position:relative;background:url(img/rail.webp) center/cover;overflow:hidden}.L-mspread .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 60%,rgb(0 0 0/.5))}
      .L-mspread .ph img{position:absolute;left:50%;bottom:20px;translate:-50% 0;height:470px;z-index:1}.L-mspread .ph span{position:absolute;left:24px;bottom:18px;color:#fff;font-family:'Martian Mono',monospace;font-size:10px;z-index:2}
      .L-mspread .ar{padding:40px 46px;display:flex;flex-direction:column;gap:14px}.L-mspread .ar h2{font-family:'Libre Bodoni',serif;font-size:50px;text-transform:none;font-stretch:100%;font-weight:700;line-height:1}
      .L-mspread .ar p{font-family:'Libre Bodoni',serif;font-size:17px;line-height:1.5;columns:2;column-gap:26px}.L-mspread .ar p::first-letter{float:left;font-size:60px;line-height:.8;padding:6px 8px 0 0;font-weight:700}
      .L-mspread .box{border:2px solid var(--ink);padding:18px;display:grid;gap:12px;margin-top:auto}`,
    html: p => `<div class="bgroom"></div><div class="sp"><div class="ph"><img class="shadow" src="${p.img}" alt=""><span>FOTO: DAS ZIMMER</span></div>
      <div class="ar"><span class="eyebrow">Modestrecke · Ausgabe 01</span><h2>${p.name}${p.city ? ' ' + p.code : ''}: getragen auf dem Platz und danach</h2>
      <p>${desc(p)} Ein Schnitt, der nicht nach Fanartikel aussieht, sondern nach etwas, das man jeden Tag trägt. Gewaschen, gebügelt, bereit für den Bolzplatz hinter dem Haus.</p>
      <div class="box"><div class="row"><b>${title(p)}</b><span class="price">${eur(p.price)}</span></div>${sizes()}${cta(p)}${ship()}</div></div></div>` },

  { key: 'mpaper', fam: 'Magazin', name: 'Sportzeitung', idea: 'Eine Titelseite wie eine Sportzeitung: großer Zeitungskopf, Schlagzeile, Spalten, ein Foto. Die Größen und der Preis stehen im Kasten „Tabelle“, darunter Kaufen.',
    tags: ['Zeitungs-Look', 'Schlagzeile', 'Tabelle-Kasten', 'Witzig'],
    css: `.L-mpaper .np{position:absolute;inset:30px 80px;background:#f6f3ea;color:#151515;box-shadow:0 40px 80px rgb(0 0 0/.45);padding:26px 36px;display:grid;grid-template-rows:auto auto 1fr;gap:14px}
      .L-mpaper .mh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px double #151515;padding-bottom:8px}.L-mpaper .mh b{font-family:'Libre Bodoni',serif;font-size:62px;font-style:italic}
      .L-mpaper .mh span{font-family:'Martian Mono',monospace;font-size:11px;text-align:right}.L-mpaper h1{font-size:78px;font-weight:900;color:#151515}.L-mpaper h1 em{color:#151515}
      .L-mpaper .body{display:grid;grid-template-columns:1fr 1fr 360px;gap:26px}.L-mpaper .body p{font-family:'Libre Bodoni',serif;font-size:15px;line-height:1.5;columns:1}
      .L-mpaper .ph{background:#e6e1d4;display:grid;place-items:center}.L-mpaper .ph img{height:330px;filter:grayscale(1) contrast(1.1)}
      .L-mpaper .tab{border:2px solid #151515;padding:14px;display:grid;gap:10px}.L-mpaper .tab h3{font-size:24px;border-bottom:2px solid #151515;padding-bottom:6px}
      .L-mpaper .tab .cta{background:#151515;color:#f6f3ea}.L-mpaper .tab .sz span{background:transparent;color:#151515;border-color:#999}.L-mpaper .tab .sz span.on{background:#151515;color:#f6f3ea}`,
    html: p => `<div class="bgroom"></div><div class="np"><div class="mh"><b>Azur Sport</b><span>AUSGABE 01 · MONTAG<br>PREIS: SIEHE TABELLE</span></div><h1>${p.name}${p.city ? ' ' + p.code : ''} ab sofort zu haben</h1>
      <div class="body"><p><b>Frankfurt/Berlin.</b> ${desc(p)} Erste Stimmen loben den Schnitt: gerade, retro, alltagstauglich. Geliefert wird in Deutschland in rund drei Werktagen, ab 90 € ohne Versandkosten.</p>
      <div class="ph"><img src="${p.img}" alt=""></div><div class="tab"><h3>Tabelle</h3><div class="row"><span>Preis</span><b>${eur(p.price)}</b></div><div class="row"><span>Rückgabe</span><b>14 Tage</b></div>${sizes()}${cta(p)}</div></div></div>` },

  { key: 'mdetail', fam: 'Magazin', name: 'Detailstrecke', idea: 'Drei Nahaufnahmen nebeneinander wie in einem Modeheft (Kragen, Signatur, Saum) mit kleinen Bildunterschriften. Darunter Name groß und eine Kaufleiste.',
    tags: ['Material zeigen', 'Nahaufnahmen', 'Vertrauen durch Details', 'Kaufleiste'],
    css: `.m.L-mdetail{background:var(--bg)}.L-mdetail .crops{position:absolute;left:60px;right:60px;top:50px;height:440px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
      .L-mdetail .crop{position:relative;background-color:var(--surf2);background-repeat:no-repeat;overflow:hidden}.L-mdetail .crop span{position:absolute;left:14px;bottom:12px;font-family:'Martian Mono',monospace;font-size:11px;background:var(--bg);padding:4px 8px}
      .L-mdetail h1{position:absolute;left:60px;top:520px;font-size:110px}.L-mdetail .bar2{position:absolute;left:60px;right:60px;bottom:40px;height:90px;border-top:2px solid var(--ink);display:grid;grid-template-columns:1fr auto auto 300px;gap:30px;align-items:center}`,
    html: p => `<div class="crops"><div class="crop" style="background-image:url(${p.img});background-size:300%;background-position:50% 2%"><span>01 · Kragen</span></div>
      <div class="crop" style="background-image:url(${p.img});background-size:340%;background-position:22% 32%"><span>02 · Signatur</span></div>
      <div class="crop" style="background-image:url(${p.img});background-size:300%;background-position:99% 26%"><span>03 · Ärmel</span></div></div><h1>${title(p)}</h1>
      <div class="bar2"><p class="desc">${desc(p)}</p>${sizes()}<span class="price">${eur(p.price)}</span>${cta(p)}</div>` },

  { key: 'mzine', fam: 'Magazin', name: 'Fanzine', idea: 'Ein selbstgemachtes Fanzine: ausgeschnittenes Trikot mit weißem Rand, Klebestreifen, handschriftliche Notizen, ein Preis als Stempel. Kaufen als großer Aufkleber.',
    tags: ['Handgemacht', 'Persönlich', 'Jung', 'Aufkleber-Kauf'],
    css: `.m.L-mzine{background:#d8cdb6}.L-mzine::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgb(255 255 255/.25),transparent 60%)}
      .L-mzine .cut{position:absolute;left:150px;top:80px;height:600px;rotate:-4deg;filter:drop-shadow(0 0 0 #fff) drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(10px 16px 14px rgb(0 0 0/.35))}
      .L-mzine .tape{position:absolute;width:150px;height:38px;background:rgb(255 255 240/.6);box-shadow:0 1px 3px rgb(0 0 0/.15)}
      .L-mzine h1{position:absolute;left:640px;top:90px;font-size:110px;font-weight:900;color:#151515;background:#fff;padding:6px 14px;rotate:2deg}.L-mzine h1 em{color:#151515}
      .L-mzine .note{position:absolute;font-family:'Caveat',cursive;font-size:30px;color:#151515;line-height:1.1}
      .L-mzine .stamp{position:absolute;left:660px;top:300px;border:4px solid #b4241a;color:#b4241a;border-radius:50%;width:170px;height:170px;display:grid;place-content:center;text-align:center;font-weight:900;font-size:30px;font-stretch:70%;rotate:-12deg}
      .L-mzine .buy{position:absolute;right:90px;bottom:80px;width:380px;background:#fff;padding:24px;rotate:1.5deg;display:grid;gap:12px;box-shadow:6px 8px 0 #151515}
      .L-mzine .buy .cta{background:#151515;color:#fff}`,
    html: p => `<img class="cut" src="${p.img}" alt=""><span class="tape" style="left:180px;top:90px;rotate:-24deg"></span><span class="tape" style="left:440px;top:620px;rotate:18deg"></span>
      <h1>${title(p)}</h1><span class="note" style="left:650px;top:220px">„trag ich auch zur Schule“</span><span class="note" style="left:880px;top:330px">S bis XL, in 3 Tagen da →</span>
      <span class="stamp">${eur(p.price)}</span><div class="buy">${sizes()}${cta(p, 'Hol ich mir')}${ship()}</div>` },

  /* ------------------------------------------------------------ crossovers */
  { key: 'xprogtix', fam: 'Mischform', name: 'Heft mit Ticket', idea: 'Das aufgeschlagene Stadionheft, aus dem unten rechts ein Ticket als Lesezeichen ragt. Auf dem Ticket stehen Preis und Kaufen.',
    tags: ['Spielprogramm + Ticket', 'Lesezeichen-Kauf', 'Storytelling', 'Lieferzeit'],
    css: `.L-xprogtix .book{position:absolute;inset:44px 90px 70px;display:grid;grid-template-columns:1fr 1fr;background:var(--surf);box-shadow:0 40px 80px rgb(0 0 0/.45)}
      .L-xprogtix .lp{display:grid;place-items:center;background:var(--surf2)}.L-xprogtix .lp img{height:520px}
      .L-xprogtix .rp{padding:38px 44px;display:flex;flex-direction:column;gap:14px}.L-xprogtix .rp h2{font-family:'Libre Bodoni',serif;font-size:46px;text-transform:none;font-stretch:100%;font-weight:700}
      .L-xprogtix .rp p{font-family:'Libre Bodoni',serif;font-size:17px;line-height:1.5}
      .L-xprogtix .tix{position:absolute;right:60px;bottom:30px;width:440px;height:170px;background:var(--acc);color:var(--accInk);border-radius:12px;rotate:-6deg;display:grid;grid-template-columns:1fr 150px;box-shadow:0 20px 40px rgb(0 0 0/.4)}
      .L-xprogtix .tix>div{padding:18px 20px;display:grid;gap:8px;align-content:center}.L-xprogtix .tix>div+div{border-left:2px dashed rgb(255 255 255/.5)}
      .L-xprogtix .tix .sz span{min-width:38px;height:34px;font-size:12px;background:transparent;border-color:rgb(255 255 255/.5);color:#fff}.L-xprogtix .tix .sz span.on{background:#fff;color:var(--acc)}
      .L-xprogtix .tix b{font-size:26px;font-family:'Martian Mono',monospace}.L-xprogtix .tix .go{background:#fff;color:var(--acc);font-weight:800;text-transform:uppercase;font-size:13px;padding:10px;text-align:center;letter-spacing:.06em}`,
    html: p => `<div class="bgroom"></div><div class="book"><div class="lp"><img class="shadow" src="${p.img}" alt=""></div><div class="rp"><span class="eyebrow">Azur Programm · Seite 3</span><h2>${p.name}${p.city ? ' ' + p.code : ''}</h2>
      <p>${desc(p)} Dein Ticket steckt schon im Heft.</p>${ship()}${trust()}</div></div>
      <div class="tix"><div><span class="lab" style="color:#fff">Block · Größe</span>${sizes()}</div><div><b>${eur(p.price)}</b><span class="go">Lösen →</span></div></div>` },

  { key: 'xmagcoupon', fam: 'Mischform', name: 'Magazin mit Bestellcoupon', idea: 'Eine Magazinseite mit Artikel und großem Foto. Unten rechts ein gestrichelter Coupon mit Schere, wie früher zum Ausschneiden: Größe, Preis, Kaufen.',
    tags: ['Magazin + Coupon', 'Retro-Bestellung', 'Klarer Kaufbereich', 'Lieferzeit'],
    css: `.m.L-xmagcoupon{background:var(--surf)}.L-xmagcoupon .ph{position:absolute;left:60px;top:50px;width:560px;height:700px;background:var(--surf2);display:grid;place-items:center}.L-xmagcoupon .ph img{height:620px}
      .L-xmagcoupon .ar{position:absolute;left:680px;top:60px;right:70px;display:grid;gap:14px}.L-xmagcoupon .ar h2{font-family:'Libre Bodoni',serif;font-size:56px;text-transform:none;font-stretch:100%;font-weight:700;line-height:1}
      .L-xmagcoupon .ar p{font-family:'Libre Bodoni',serif;font-size:17px;line-height:1.5}
      .L-xmagcoupon .cp{position:absolute;right:70px;bottom:50px;width:520px;border:3px dashed var(--ink);padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;background:var(--bg)}
      .L-xmagcoupon .cp::before{content:"✂";position:absolute;left:-14px;top:-20px;font-size:26px;background:var(--surf);padding:0 4px}.L-xmagcoupon .cp .cta{grid-column:1/-1}`,
    html: p => `<div class="ph"><img class="shadow" src="${p.img}" alt=""></div><div class="ar"><span class="eyebrow">ANSTOSS · Ausgabe 01</span><h2>Das Trikot, das nicht nach Fanshop aussieht</h2>
      <p>${desc(p)} Retro-Schnitt, gerade geschnitten, für den Platz und den Alltag.</p></div>
      <div class="cp"><div><span class="lab">Bestellcoupon</span><h3 style="font-size:30px">${title(p)}</h3></div><div style="text-align:right"><span class="price" style="font-size:26px">${eur(p.price)}</span>${ship()}</div>${sizes()}<span class="desc">14 Tage Rückgabe, Rückversand gratis</span>${cta(p, 'Coupon einlösen')}</div>` },
];

const nm = q => q.name + (q.city ? ' ' + q.code : '');
const shopTop = () => marquee() + header(false);
const SHOP2 = [
  { key: 'herodrop', name: 'Neuer Drop zuerst', idea: 'Oben ein großes Bild des aktuellen Drops mit einem klaren Knopf, darunter die zwei Stadt-Trikots groß und die Länder kleiner. Eine eindeutige Hauptaktion pro Bildschirm.',
    tags: ['Klare Hauptaktion', 'Neuheit zuerst', 'Groß und ruhig', 'Gratis-Versand'],
    css: `.S-herodrop .hero{position:relative;height:470px;background:url(img/rail.webp) center 40%/cover}.S-herodrop .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgb(0 0 0/.7),transparent 70%)}
      .S-herodrop .hero div{position:absolute;left:60px;bottom:60px;z-index:1;color:#fff;display:grid;gap:16px}.S-herodrop .hero h2{font-size:110px;color:#fff}
      .S-herodrop .two{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:34px 60px 0}.S-herodrop .three{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:30px 60px}`,
    html: () => `${shopTop()}<div class="hero"><div><span class="eyebrow" style="color:#ddd">Drop 01 · jetzt erhältlich</span><h2>Zwei Städte.</h2><span class="btn" style="width:max-content">Frankfurt und Berlin ansehen</span></div></div>
      <div class="two">${PRODUCTS.slice(0, 2).map(q => pcard(q, 330, { badge: 'Neu', qa: true })).join('')}</div><div class="three">${PRODUCTS.slice(2).map(q => pcard(q, 220)).join('')}</div>` },

  { key: 'splitsl', name: 'Städte | Länder', idea: 'Der Bildschirm ist in zwei Hälften geteilt: links die Stadt-Trikots, rechts die Länder-Trikots. Jede Hälfte mit eigener Überschrift und eigenem Knopf. Sofort klar, was es gibt.',
    tags: ['Zwei Welten', 'Schnelle Orientierung', 'Einfach', 'Mobil stapelbar'],
    css: `.S-splitsl .sp{display:grid;grid-template-columns:1fr 1fr;height:1154px}.S-splitsl .h{padding:40px;display:flex;flex-direction:column;gap:24px}.S-splitsl .h+.h{background:var(--surf2);border-left:1px solid var(--line)}
      .S-splitsl h2{font-size:120px}.S-splitsl .g{display:grid;grid-template-columns:1fr 1fr;gap:18px}.S-splitsl .g3{display:grid;grid-template-columns:1fr 1fr;gap:18px}`,
    html: () => `${shopTop()}<div class="sp"><div class="h"><span class="eyebrow">Die Vorwahl auf dem Rücken</span><h2>Städte</h2><div class="g">${PRODUCTS.slice(0, 2).map(q => pcard(q, 420, { qa: true })).join('')}</div><span class="btn ghost" style="width:max-content">Alle Städte</span></div>
      <div class="h"><span class="eyebrow">Retro-Schnitte</span><h2>Länder</h2><div class="g3">${PRODUCTS.slice(2).map(q => pcard(q, 250)).join('')}<div style="border:1.5px dashed var(--line);display:grid;place-items:center;text-align:center;padding:20px" class="desc">Weitere Länder<br>im nächsten Drop</div></div></div></div>` },

  { key: 'hrail', name: 'Horizontale Reihe', idea: 'Alle Trikots in einer großen, seitlich scrollbaren Reihe mit riesigen Nummern davor, wie die Kleiderstange im Zimmer, nur aufgeräumt. Pfeile und ein Fortschrittsbalken zeigen, wie viele noch kommen.',
    tags: ['Wie die Kleiderstange', 'Wischen auf dem Handy', 'Große Nummern', 'Fortschritt'],
    css: `.S-hrail .hd2{display:flex;align-items:flex-end;justify-content:space-between;padding:50px 60px 20px}.S-hrail h2{font-size:90px}
      .S-hrail .strip{display:flex;gap:26px;padding:0 60px;overflow:hidden}.S-hrail .it{flex:none;width:420px;display:grid;gap:12px;position:relative}
      .S-hrail .it .n{position:absolute;left:-6px;top:-40px;font-size:150px;font-weight:900;font-stretch:62%;color:var(--ink);opacity:.08;line-height:1}
      .S-hrail .it .ph{height:520px;background:var(--surf2);display:grid;place-items:center}.S-hrail .it .ph img{height:440px}.S-hrail .arr{display:flex;gap:10px}
      .S-hrail .arr span{width:54px;height:54px;border:1.5px solid var(--ink);display:grid;place-items:center;font-size:22px}.S-hrail .prog{margin:30px 60px;height:3px;background:var(--line)}.S-hrail .prog i{display:block;width:40%;height:100%;background:var(--ink)}`,
    html: () => `${shopTop()}<div class="hd2"><div><span class="eyebrow">Die Kollektion · 5 Trikots</span><h2>Die Stange</h2></div><div class="arr"><span>←</span><span>→</span></div></div>
      <div class="strip">${PRODUCTS.map((q, i) => `<div class="it"><span class="n">0${i + 1}</span><div class="ph"><img src="${q.img}" alt=""></div><div class="row"><b>${nm(q)}</b><span class="price" style="font-size:15px">${eur(q.price)}</span></div><span class="btn ghost" style="height:42px">In den Warenkorb</span></div>`).join('')}</div>
      <div class="prog"><i></i></div><div class="trustrow" style="margin:0 60px"><div><b>ca. 3 Werktage</b>Lieferung in Deutschland</div><div><b>ab 90 € gratis</b>Versand in Deutschland</div><div><b>14 Tage</b>Rückgabe</div><div><b>Rückversand</b>kostenlos</div></div>` },

  { key: 'bento', name: 'Bento-Raster', idea: 'Ein Raster aus unterschiedlich großen Kacheln wie bei modernen Marken: Trikots, dazwischen Kacheln für Gratis-Versand, Größentabelle, Drop-Anmeldung und das Magazin. Alles auf einen Blick.',
    tags: ['Modern', 'Service zwischen Produkten', 'Viel auf einem Bildschirm', 'Drop-Anmeldung'],
    css: `.S-bento .g{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:260px;gap:16px;padding:30px 40px}
      .S-bento .t{background:var(--surf2);padding:20px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
      .S-bento .t img{position:absolute;right:10px;bottom:0;height:88%}.S-bento .t.big img{height:92%;right:40px}.S-bento .t b{font-size:16px;position:relative}.S-bento .t .price{position:relative;font-size:15px}
      .S-bento .t.ink{background:var(--ink);color:var(--bg)}.S-bento .t.acc{background:var(--acc);color:var(--accInk)}.S-bento .t h3{font-size:46px;position:relative}`,
    html: () => { const [f, b, br, d, t] = PRODUCTS; return `${shopTop()}<div class="g">
      <div class="t big" style="grid-column:span 2;grid-row:span 2"><span class="eyebrow">Drop 01</span><h3>${nm(f)}</h3><img src="${f.img}" alt=""><span class="btn" style="width:max-content;position:relative">${eur(f.price)} · Ansehen</span></div>
      <div class="t"><b>${nm(b)}</b><img src="${b.img}" alt=""><span class="price">${eur(b.price)}</span></div><div class="t acc"><h3>Ab 90 € gratis</h3><span>Versand in Deutschland, ca. 3 Werktage</span></div>
      <div class="t ink"><span class="eyebrow" style="color:#aaa">Größentabelle</span><h3>S bis XL</h3><span>Retro-Schnitt, gerade. Im Zweifel eine Nummer größer.</span></div><div class="t"><b>${nm(br)}</b><img src="${br.img}" alt=""><span class="price">${eur(br.price)}</span></div>
      <div class="t"><b>${nm(d)}</b><img src="${d.img}" alt=""><span class="price">${eur(d.price)}</span></div><div class="t" style="grid-column:span 2;background:url(img/cover.webp) center/cover;color:#fff"><h3>ANSTOSS lesen</h3><span>Das Heft zur Kollektion</span></div>
      <div class="t"><b>${nm(t)}</b><img src="${t.img}" alt=""><span class="price">${eur(t.price)}</span></div><div class="t" style="grid-column:span 2"><b>Nächster Drop per Mail</b><span class="desc">Eine Mail, wenn neue Städte kommen. Kein Spam.</span><span class="btn ghost" style="width:max-content">Eintragen</span></div><div class="t ink"><h3>14 Tage</h3><span>Rückgabe, Rückversand gratis</span></div></div>` } },

  { key: 'index', name: 'Index-Liste', idea: 'Eine rein typografische Liste aller Trikots in großen Zeilen: Name, Vorwahl, Größen, Preis. Über der aktiven Zeile schwebt das Trikotbild. Wirkt wie eine Designmarke.',
    tags: ['Typografisch', 'Sehr ruhig', 'Bild beim Drüberfahren', 'Schnell zu lesen'],
    css: `.S-index .ls{padding:40px 60px}.S-index .r{display:grid;grid-template-columns:70px 1fr 160px 220px 140px;align-items:center;border-bottom:1px solid var(--ink);height:150px;position:relative}
      .S-index .r b{font-size:96px;font-weight:800;font-stretch:62%;text-transform:uppercase;line-height:1}.S-index .r span{font-family:'Martian Mono',monospace;font-size:13px}
      .S-index .r.on{color:var(--acc)}.S-index .r.on b{color:var(--acc)}.S-index .r img{position:absolute;left:520px;top:-90px;height:320px;z-index:2;filter:drop-shadow(0 20px 30px rgb(0 0 0/.3))}
      .S-index .hd3{display:grid;grid-template-columns:70px 1fr 160px 220px 140px;font-family:'Martian Mono',monospace;font-size:11px;color:var(--mut);letter-spacing:.1em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid var(--ink)}`,
    html: () => `${shopTop()}<div class="ls"><div class="hd3"><span>Nr.</span><span>Trikot</span><span>Kennung</span><span>Größen</span><span>Preis</span></div>
      ${PRODUCTS.map((q, i) => `<div class="r ${i === 1 ? 'on' : ''}"><span>0${i + 1}</span><b>${q.name}</b><span>${q.code}</span><span>S · M · L · XL</span><span>${eur(q.price)}</span>${i === 1 ? `<img src="${q.img}" alt="">` : ''}</div>`).join('')}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:30px">${ship()}<span class="btn">Alle ansehen</span></div></div>` },

  { key: 'compare', name: 'Vergleichstabelle', idea: 'Alle Trikots nebeneinander in einer Vergleichstabelle: Bild oben, darunter Schnitt, Kragen, Größen, Preis und je ein Kaufen-Knopf. Hilft beim Entscheiden statt nur Anschauen.',
    tags: ['Entscheidungshilfe', 'Alles vergleichbar', 'Kauf in der Spalte', 'Ehrliche Fakten'],
    css: `.S-compare .tb{margin:40px 50px;display:grid;grid-template-columns:200px repeat(5,minmax(0,1fr));border-top:2px solid var(--ink)}
      .S-compare .c{padding:14px 12px;border-bottom:1px solid var(--line);font-size:14px;display:flex;align-items:center}.S-compare .c.l{font-family:'Martian Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
      .S-compare .c.im{height:300px;justify-content:center;background:var(--surf2);border-right:1px solid var(--bg)}.S-compare .c.im img{max-width:100%;max-height:250px}.S-compare .c.nm{font-weight:800;font-size:22px;font-stretch:70%;text-transform:uppercase}
      .S-compare h2{font-size:80px;padding:40px 50px 0}`,
    html: () => `${shopTop()}<h2>Welches passt zu dir?</h2><div class="tb"><div class="c l"></div>${PRODUCTS.map(q => `<div class="c im"><img src="${q.img}" alt=""></div>`).join('')}
      <div class="c l">Trikot</div>${PRODUCTS.map(q => `<div class="c nm">${nm(q)}</div>`).join('')}<div class="c l">Art</div>${PRODUCTS.map(q => `<div class="c">${q.city ? 'Stadt' : 'Land'}</div>`).join('')}
      <div class="c l">Kragen</div>${PRODUCTS.map(q => `<div class="c">${q.city ? 'Polokragen' : 'Rundkragen'}</div>`).join('')}<div class="c l">Schnitt</div>${PRODUCTS.map(() => `<div class="c">Retro, gerade</div>`).join('')}
      <div class="c l">Größen</div>${PRODUCTS.map(() => `<div class="c">S – XL</div>`).join('')}<div class="c l">Preis</div>${PRODUCTS.map(q => `<div class="c"><span class="price" style="font-size:16px">${eur(q.price)}</span></div>`).join('')}
      <div class="c l"></div>${PRODUCTS.map(() => `<div class="c"><span class="btn" style="height:40px;padding:0 14px;font-size:12px">Kaufen</span></div>`).join('')}</div><div style="padding:0 50px">${ship()}</div>` },

  { key: 'shopthelook', name: 'Shop the Look', idea: 'Ein großes Bild aus dem Zimmer mit kleinen Plus-Punkten auf den Trikots. Rechts daneben die markierten Trikots als Liste mit Preis und Kaufen. Verbindet Zimmer und Shop direkt.',
    tags: ['Zimmer im Shop', 'Kauf-Punkte im Bild', 'Liste daneben', 'Stimmung'],
    css: `.S-shopthelook .wrap{display:grid;grid-template-columns:1fr 380px;height:1154px}.S-shopthelook .img{position:relative;background:url(img/rail.webp) center/cover}
      .S-shopthelook .dot{position:absolute;width:34px;height:34px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-weight:800;box-shadow:0 0 0 8px rgb(255 255 255/.3)}
      .S-shopthelook .dot.on{background:var(--acc);color:#fff}.S-shopthelook .tip{position:absolute;left:330px;top:520px;background:#fff;color:#111;padding:12px 16px;display:grid;gap:4px;font-size:13px}
      .S-shopthelook .list{padding:34px 28px;display:flex;flex-direction:column;gap:14px;background:var(--surf)}.S-shopthelook .li{display:grid;grid-template-columns:80px 1fr;gap:14px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px}
      .S-shopthelook .li img{width:80px;height:80px;object-fit:contain;background:var(--surf2)}`,
    html: () => `${shopTop()}<div class="wrap"><div class="img">${[[22, 42], [32, 42], [42, 42], [52, 42], [64, 44]].map(([x, y], i) => `<span class="dot ${i === 1 ? 'on' : ''}" style="left:${x}%;top:${y}%">+</span>`).join('')}
      <div class="tip"><b>${nm(PRODUCTS[1])}</b><span>${eur(PRODUCTS[1].price)} · In den Warenkorb →</span></div></div>
      <div class="list"><span class="eyebrow">Im Bild</span><h3 style="font-size:40px">Shop the Look</h3>${PRODUCTS.map(q => `<div class="li"><img src="${q.img}" alt=""><div><b>${nm(q)}</b><div class="row"><span class="price" style="font-size:14px">${eur(q.price)}</span><span class="guide">+ Warenkorb</span></div></div></div>`).join('')}${ship()}</div></div>` },

  { key: 'stories', name: 'Geschichten', idea: 'Jedes Trikot bekommt einen eigenen Abschnitt mit kurzer Geschichte: warum diese Stadt, was die Vorwahl bedeutet. Bild und Text wechseln die Seite, Kaufen steht direkt beim Text.',
    tags: ['Storytelling', 'Ein Trikot pro Abschnitt', 'Kauf beim Text', 'Emotional'],
    css: `.S-stories .st{display:grid;grid-template-columns:1fr 1fr;height:384px;border-bottom:1px solid var(--line)}.S-stories .st.rev .im{order:2}
      .S-stories .im{background:var(--surf2);display:grid;place-items:center;position:relative;overflow:hidden}.S-stories .im img{height:340px}.S-stories .im b{position:absolute;left:24px;top:10px;font-size:160px;font-weight:900;font-stretch:62%;opacity:.08;line-height:1}
      .S-stories .tx{padding:44px 60px;display:flex;flex-direction:column;gap:14px;justify-content:center}.S-stories h3{font-size:58px}.S-stories p{font-family:'Libre Bodoni',serif;font-size:18px;line-height:1.45;max-width:460px}`,
    html: () => `${shopTop()}${PRODUCTS.slice(0, 3).map((q, i) => `<div class="st ${i % 2 ? 'rev' : ''}"><div class="im"><b>${q.code}</b><img src="${q.img}" alt=""></div><div class="tx"><span class="eyebrow">Kapitel 0${i + 1}</span><h3>${nm(q)}</h3>
      <p>${q.city ? `Die ${q.code} steht für eine Stadt, nicht für einen Verein. Für alle, die da groß geworden sind.` : `Ein Retro-Schnitt in den Farben von ${q.name}. Für Turniersommer und Bolzplatz.`}</p><div style="display:flex;gap:16px;align-items:center"><span class="btn">${eur(q.price)} · Kaufen</span><span class="guide">Mehr lesen</span></div></div></div>`).join('')}` },

  { key: 'classic', name: 'Klassischer Shop', idea: 'Der bewährte Aufbau großer Modeshops: links Filter (Art, Größe, Preis), oben Sortierung und Anzahl, rechts ein Raster mit Schnell-in-den-Warenkorb. Sehr vertraut, wenig Lernaufwand.',
    tags: ['Bewährt', 'Filter links', 'Schnellkauf', 'Für viele Produkte'],
    css: `.S-classic .wrap{display:grid;grid-template-columns:240px 1fr;gap:40px;padding:34px 50px}.S-classic .f{display:grid;gap:22px;align-content:start}.S-classic .f h4{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.08em}
      .S-classic .f label{display:flex;gap:10px;align-items:center;font-size:14px;padding:4px 0}.S-classic .f label i{width:16px;height:16px;border:1.5px solid var(--ink)}.S-classic .f label i.on{background:var(--ink)}
      .S-classic .top2{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.S-classic .g{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}`,
    html: () => `${shopTop()}<div class="wrap"><div class="f"><h2 style="font-size:54px">Trikots</h2><div><h4>Art</h4><label><i class="on"></i>Städte (2)</label><label><i class="on"></i>Länder (3)</label></div>
      <div><h4>Größe</h4><div class="chips"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div></div><div><h4>Preis</h4><label><i></i>bis 55 €</label><label><i></i>bis 65 €</label></div>${ship()}</div>
      <div><div class="top2"><span class="desc">5 Trikots in Größe M</span><span class="chips"><span class="on">Neu zuerst</span><span>Preis</span></span></div><div class="g">${PRODUCTS.map((q, i) => pcard(q, 330, { badge: i < 2 ? 'Neu' : '', qa: i === 0 })).join('')}</div></div></div>` },

  { key: 'cats', name: 'Kategorien zuerst', idea: 'Erst die großen Türen: vier riesige Kacheln für Städte, Länder, Drops und das Magazin. Darunter eine kurze Reihe „Gerade beliebt“. Gut, wenn das Sortiment wächst.',
    tags: ['Wachstum', 'Große Türen', 'Schnelle Wege', 'Magazin eingebunden'],
    css: `.S-cats .g{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:30px 40px}.S-cats .t{position:relative;height:380px;background:var(--surf2);overflow:hidden;display:flex;align-items:flex-end;padding:26px}
      .S-cats .t h3{font-size:90px;position:relative;z-index:1}.S-cats .t img{position:absolute;right:30px;top:20px;height:340px}.S-cats .t span{position:absolute;right:26px;bottom:26px;font-size:30px;z-index:1}
      .S-cats .row3{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:0 40px}`,
    html: () => `${shopTop()}<div class="g"><div class="t"><img src="${PRODUCTS[0].img}" alt=""><h3>Städte</h3><span>→</span></div><div class="t"><img src="${PRODUCTS[2].img}" alt=""><h3>Länder</h3><span>→</span></div>
      <div class="t" style="background:var(--ink);color:var(--bg)"><h3>Drops</h3><span>→</span></div><div class="t" style="background:url(img/cover.webp) center/cover;color:#fff"><h3>Magazin</h3><span>→</span></div></div>
      <div style="padding:6px 40px 14px" class="row"><span class="eyebrow">Gerade beliebt</span>${ship()}</div><div class="row3">${PRODUCTS.map(q => pcard(q, 160)).join('')}</div>` },

  { key: 'tactic', name: 'Taktiktafel', idea: 'Die Trikots stehen als Spieler auf einer Taktiktafel in Aufstellung. Antippen zeigt Name und Preis, rechts eine Legende mit allen Trikots und Kaufen.',
    tags: ['Fußball-Idee', 'Spielerisch', 'Legende rechts', 'Merkt man sich'],
    css: `.S-tactic .wrap{display:grid;grid-template-columns:1fr 360px;gap:30px;padding:30px 40px}.S-tactic .board{position:relative;height:1060px;background:#2b2f2c;border:10px solid #8a6a46}
      .S-tactic .board i{position:absolute;border:2px solid rgb(255 255 255/.7)}.S-tactic .pl{position:absolute;display:grid;justify-items:center;gap:4px;translate:-50% -50%}
      .S-tactic .pl img{height:150px;filter:drop-shadow(0 8px 10px rgb(0 0 0/.5))}.S-tactic .pl span{background:#fff;color:#111;font-size:12px;font-weight:800;padding:3px 8px}
      .S-tactic .leg{display:flex;flex-direction:column;gap:12px}.S-tactic .leg div{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;border-bottom:1px solid var(--line);padding:10px 0}`,
    html: () => `${shopTop()}<div class="wrap"><div class="board"><i style="left:0;right:0;top:50%"></i><i style="left:50%;top:50%;width:160px;height:160px;margin:-80px;border-radius:50%"></i><i style="left:25%;right:25%;top:-2px;height:140px"></i><i style="left:25%;right:25%;bottom:-2px;height:140px"></i>
      ${[[50, 18], [24, 45], [76, 45], [36, 75], [64, 75]].map(([x, y], i) => `<div class="pl" style="left:${x}%;top:${y}%"><img src="${PRODUCTS[i].img}" alt=""><span>${i + 1} · ${nm(PRODUCTS[i])}</span></div>`).join('')}</div>
      <div class="leg"><span class="eyebrow">Aufstellung</span><h3 style="font-size:46px">Die Startelf</h3>${PRODUCTS.map((q, i) => `<div><b>${i + 1}</b><span>${nm(q)}</span><span class="price" style="font-size:14px">${eur(q.price)}</span></div>`).join('')}<span class="btn">Alle in den Kader</span>${ship()}</div></div>` },

  { key: 'cards', name: 'Spielerkarten', idea: 'Jedes Trikot als Sammelkarte wie in Fußball-Spielen: großes Bild, Name, ein paar Eigenschaften und der Preis als Wert. Junge Zielgruppe erkennt das sofort.',
    tags: ['Sammelkarten', 'Junge Zielgruppe', 'Auffällig', 'Echte Eigenschaften'],
    css: `.S-cards .g{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;padding:60px 50px}.S-cards .cd{height:430px;background:linear-gradient(160deg,#e9d9a8,#b8954a);clip-path:polygon(50% 0,100% 8%,100% 92%,50% 100%,0 92%,0 8%);padding:34px 18px;display:grid;grid-template-rows:auto 1fr auto;text-align:center;color:#2a2010}
      .S-cards .cd.s{background:linear-gradient(160deg,#e3e5ea,#9aa1ad)}.S-cards .cd img{height:200px;justify-self:center}.S-cards .cd b{font-size:24px;font-weight:900;font-stretch:62%;text-transform:uppercase}
      .S-cards .cd .at{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;font-family:'Martian Mono',monospace;font-size:10px;text-align:left}.S-cards .val{font-size:30px;font-weight:900;font-stretch:62%}
      .S-cards h2{font-size:90px;padding:40px 50px 0}`,
    html: () => `${shopTop()}<h2>Sammel deine Stadt</h2><div class="g">${PRODUCTS.map(q => `<div class="cd ${q.city ? '' : 's'}"><div><span class="val">${q.code}</span></div><div style="display:grid;align-content:center;gap:8px"><img src="${q.img}" alt=""><b>${q.name}</b></div>
      <div class="at"><span>ART ${q.city ? 'STADT' : 'LAND'}</span><span>KRAGEN ${q.city ? 'POLO' : 'RUND'}</span><span>GRÖSSE S–XL</span><span>WERT ${eur(q.price)}</span></div></div>`).join('')}</div>
      <div style="display:flex;justify-content:center;gap:20px;align-items:center"><span class="btn">Karte ziehen = Trikot ansehen</span>${ship()}</div>` },

  { key: 'ticker', name: 'Live-Ticker', idea: 'Die Shopseite als Liveticker: eine Zeitleiste mit Einträgen wie „Drop 01 ist live“ oder „Berlin 030 wieder in M da“, jeder Eintrag mit Trikot und Kaufen. Fühlt sich lebendig an.',
    tags: ['Lebendig', 'Neuigkeiten', 'Echte Ereignisse', 'Kauf im Eintrag'],
    css: `.S-ticker .wrap{display:grid;grid-template-columns:1fr 340px;gap:40px;padding:34px 60px}.S-ticker .tl{position:relative;padding-left:120px;display:grid;gap:20px}
      .S-ticker .tl::before{content:"";position:absolute;left:90px;top:0;bottom:0;width:2px;background:var(--line)}.S-ticker .e{position:relative;background:var(--surf);padding:20px;display:grid;grid-template-columns:150px 1fr auto;gap:20px;align-items:center}
      .S-ticker .e .t{position:absolute;left:-120px;top:22px;font-family:'Martian Mono',monospace;font-size:13px;width:80px;text-align:right}.S-ticker .e::before{content:"";position:absolute;left:-36px;top:24px;width:12px;height:12px;border-radius:50%;background:var(--acc)}
      .S-ticker .e img{height:140px;justify-self:center}.S-ticker .e h4{margin:0;font-size:22px;font-weight:800}.S-ticker .side{display:grid;gap:14px;align-content:start}`,
    html: () => `${shopTop()}<div class="wrap"><div class="tl"><h2 style="font-size:80px">Ticker</h2>
      ${[['12:00', 'Drop 01 ist live', 0], ['11:30', 'Berlin 030: schwarz, Polokragen', 1], ['Gestern', 'Drei Länder im Retro-Schnitt', 2], ['Gestern', 'Deutschland, weiß wie früher', 3]].map(([t, h, i]) => `<div class="e"><span class="t">${t}</span><img src="${PRODUCTS[i].img}" alt=""><div><h4>${h}</h4><span class="desc">${nm(PRODUCTS[i])} · ${eur(PRODUCTS[i].price)}</span></div><span class="btn" style="height:42px">Kaufen</span></div>`).join('')}</div>
      <div class="side"><span class="eyebrow">Nicht verpassen</span><h3 style="font-size:36px">Ticker per Mail</h3><span class="desc">Nur wenn ein neuer Drop kommt.</span><span class="btn ghost">Eintragen</span>${ship()}${trust()}</div></div>` },

  { key: 'museum', name: 'Vitrinen', idea: 'Wie in einem Fußballmuseum: jedes Trikot in einer eigenen Vitrine auf einem Sockel, mit kleinem Schild darunter (Name, Herkunft, Preis). Sehr hochwertig und ruhig.',
    tags: ['Hochwertig', 'Ausstellung', 'Kleine Schilder', 'Viel Raum'],
    css: `.m.S-museum{background:#e9e7e2}.S-museum .g{display:grid;grid-template-columns:repeat(3,1fr);gap:60px 50px;padding:60px 90px}.S-museum .v{display:grid;justify-items:center;gap:0}
      .S-museum .case{width:100%;height:330px;background:linear-gradient(180deg,rgb(255 255 255/.7),rgb(255 255 255/.25));border:1px solid rgb(0 0 0/.12);display:grid;place-items:center;box-shadow:inset 0 0 40px rgb(255 255 255/.6)}
      .S-museum .case img{height:280px}.S-museum .plinth{width:100%;height:60px;background:#d9d6cf;border:1px solid rgb(0 0 0/.1)}.S-museum .lb{margin-top:14px;background:#fff;padding:10px 14px;font-size:12px;display:grid;gap:2px;text-align:center;min-width:200px}`,
    html: () => `${shopTop()}<div style="padding:40px 90px 0" class="row"><h2 style="font-size:80px">Die Sammlung</h2><span class="desc">5 Stücke · ${'Lieferung ca. 3 Werktage'}</span></div><div class="g">${PRODUCTS.map(q => `<div class="v"><div class="case"><img src="${q.img}" alt=""></div><div class="plinth"></div>
      <div class="lb"><b>${nm(q)}</b><span>${q.city ? 'Stadt-Trikot · Polokragen' : 'Länder-Trikot · Retro'}</span><span style="font-family:'Martian Mono',monospace">${eur(q.price)} · ansehen →</span></div></div>`).join('')}<div class="v" style="align-self:center"><span class="btn">Zum Shop-Raster</span></div></div>` },

  { key: 'maghome', name: 'Magazin-Startseite', idea: 'Die Shopseite als Startseite eines Magazins: eine große Titelgeschichte zum aktuellen Drop, daneben Artikel-Teaser. Jeder Artikel führt zu einem Trikot und hat einen kleinen Kaufen-Link.',
    tags: ['Magazin-Familie', 'Inhalt verkauft', 'Artikel mit Produkt', 'Lange Verweildauer'],
    css: `.S-maghome .g{display:grid;grid-template-columns:2fr 1fr;gap:30px;padding:34px 50px}.S-maghome .lead{position:relative;height:640px;background:url(img/room.webp) center/cover;display:flex;align-items:flex-end;padding:34px;color:#fff}
      .S-maghome .lead::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 40%,rgb(0 0 0/.75))}.S-maghome .lead div{position:relative;z-index:1;display:grid;gap:12px}
      .S-maghome .lead h2{font-family:'Libre Bodoni',serif;font-size:62px;text-transform:none;font-stretch:100%;color:#fff;line-height:1}
      .S-maghome .art{display:grid;grid-template-columns:110px 1fr;gap:14px;border-bottom:1px solid var(--line);padding-bottom:16px}.S-maghome .art img{width:110px;height:110px;object-fit:contain;background:var(--surf2)}
      .S-maghome .art h4{font-family:'Libre Bodoni',serif;font-size:20px;margin:0 0 6px}.S-maghome .side{display:grid;gap:16px;align-content:start}
      .S-maghome .row4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:0 50px}`,
    html: () => `${shopTop()}<div class="g"><div class="lead"><div><span class="eyebrow" style="color:#ddd">Titelgeschichte</span><h2>Zwei Städte, ein Zimmer: so entstand Drop 01</h2><span class="btn" style="width:max-content">Lesen und Trikots ansehen</span></div></div>
      <div class="side"><span class="eyebrow">Mehr aus dem Heft</span>${PRODUCTS.slice(1, 5).map(q => `<div class="art"><img src="${q.img}" alt=""><div><h4>${q.city ? 'Warum die ' + q.code + '?' : q.name + ': der Sommer, in dem alles anfing'}</h4><span class="guide">${nm(q)} · ${eur(q.price)} · kaufen</span></div></div>`).join('')}</div></div>
      <div class="row4">${PRODUCTS.slice(0, 4).map(q => pcard(q, 200)).join('')}</div>` },

  { key: 'newspaper', name: 'Sportzeitung', idea: 'Die Shopseite als Titelseite einer Sportzeitung: Zeitungskopf, große Schlagzeile, Spalten, Fotos der Trikots wie Spielfotos, Preise in einer „Tabelle“ am Rand.',
    tags: ['Magazin-Familie', 'Zeitungs-Look', 'Witzig', 'Tabelle mit Preisen'],
    css: `.S-newspaper .np{margin:26px 40px;background:#f6f3ea;color:#151515;padding:26px 34px;border:1px solid #ccc}.S-newspaper .mh{text-align:center;border-bottom:5px double #151515;padding-bottom:10px}
      .S-newspaper .mh b{font-family:'Libre Bodoni',serif;font-size:96px;font-style:italic;display:block;line-height:1}.S-newspaper .mh span{font-family:'Martian Mono',monospace;font-size:11px}
      .S-newspaper h2{font-size:84px;color:#151515;text-align:center;margin:18px 0}.S-newspaper .cols{display:grid;grid-template-columns:1.4fr 1fr 300px;gap:26px}
      .S-newspaper .ph{background:#e6e1d4;display:grid;place-items:center;height:420px}.S-newspaper .ph img{height:380px;filter:grayscale(1) contrast(1.1)}
      .S-newspaper p{font-family:'Libre Bodoni',serif;font-size:15px;line-height:1.5}.S-newspaper .tab{border:2px solid #151515;padding:12px}.S-newspaper .tab div{display:flex;justify-content:space-between;border-bottom:1px solid #bbb;padding:7px 0;font-size:14px}`,
    html: () => `${shopTop()}<div class="np"><div class="mh"><b>Azur Sport</b><span>AUSGABE 01 · SONDERAUSGABE ZUM DROP</span></div><h2>Fünf Trikots, ab sofort im Laden</h2>
      <div class="cols"><div class="ph"><img src="${PRODUCTS[0].img}" alt=""></div><div><p><b>Frankfurt.</b> Zwei Städte, drei Länder, ein Schnitt: gerade, retro, alltagstauglich. Die Vorwahl auf dem Rücken, die Signatur auf der Brust. Geliefert wird in rund drei Werktagen, ab 90 € ohne Versandkosten.</p>
      <div class="ph" style="height:200px;margin-top:14px"><img src="${PRODUCTS[1].img}" alt="" style="height:180px"></div></div>
      <div class="tab"><b style="font-size:22px">Tabelle</b>${PRODUCTS.map((q, i) => `<div><span>${i + 1}. ${nm(q)}</span><b>${eur(q.price)}</b></div>`).join('')}<span class="btn" style="margin-top:12px;background:#151515">Zum Shop</span></div></div></div>` },

  { key: 'zine', name: 'Fanzine', idea: 'Die ganze Shopseite wie ein selbstgemachtes Fanzine: ausgeschnittene Trikots, Klebestreifen, handgeschriebene Preise und Pfeile. Persönlich, jung und mit Humor.',
    tags: ['Handgemacht', 'Jung', 'Humor', 'Unverwechselbar'],
    css: `.m.S-zine{background:#d8cdb6}.S-zine .it{position:absolute;display:grid;justify-items:center}.S-zine .it img{height:300px;filter:drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(8px 12px 10px rgb(0 0 0/.3))}
      .S-zine .it span{font-family:'Caveat',cursive;font-size:32px;color:#151515;margin-top:4px}.S-zine .tape{position:absolute;width:130px;height:34px;background:rgb(255 255 240/.6)}
      .S-zine h2{position:absolute;left:60px;top:120px;background:#151515;color:#fff;font-size:100px;padding:6px 18px;rotate:-2deg}.S-zine .note{position:absolute;font-family:'Caveat',cursive;font-size:30px;color:#b4241a}`,
    html: () => `${shopTop()}<h2>Neu im Heft!</h2>${PRODUCTS.map((q, i) => { const pos = [[90, 300, -6], [470, 260, 4], [860, 330, -3], [230, 720, 5], [640, 760, -4]][i]; return `<div class="it" style="left:${pos[0]}px;top:${pos[1]}px;rotate:${pos[2]}deg"><img src="${q.img}" alt=""><span>${nm(q)} · ${eur(q.price)}</span></div>`; }).join('')}
      <span class="tape" style="left:150px;top:300px;rotate:-20deg"></span><span class="tape" style="left:900px;top:320px;rotate:16deg"></span><span class="note" style="left:1010px;top:760px">alle S bis XL<br>in 3 Tagen da!</span><span class="note" style="left:1030px;top:200px">→ antippen = kaufen</span>` },

  { key: 'slides', name: 'Ein Trikot pro Bildschirm', idea: 'Jedes Trikot füllt einen ganzen Bildschirm: riesiger Name, großes Bild, Preis und Kaufen. Beim Scrollen rastet das nächste ein, Punkte rechts zeigen, wo man ist.',
    tags: ['Große Bühne', 'Einrasten beim Scrollen', 'Fokus', 'Mobil stark'],
    css: `.S-slides .sl{position:relative;height:1154px;background:var(--surf2);overflow:hidden}.S-slides .sl h2{position:absolute;left:60px;top:60px;font-size:240px}
      .S-slides .sl img{position:absolute;right:120px;top:150px;height:820px}.S-slides .sl .buy{position:absolute;left:60px;bottom:80px;display:grid;gap:16px;width:440px}
      .S-slides .dots{position:absolute;right:40px;top:50%;translate:0 -50%;display:grid;gap:12px}.S-slides .dots i{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--ink)}.S-slides .dots i.on{background:var(--ink)}
      .S-slides .next{position:absolute;left:60px;bottom:24px;font-family:'Martian Mono',monospace;font-size:12px;color:var(--mut)}`,
    html: () => { const q = PRODUCTS[0]; return `${shopTop()}<div class="sl"><h2>${q.name}</h2><img class="shadow" src="${q.img}" alt=""><div class="buy"><span class="eyebrow">01 / 05 · ${q.city ? 'Stadt' : 'Land'}</span><p class="desc" style="font-size:17px">${desc(q)}</p>${sizes()}${cta(q)}${ship()}</div>
      <div class="dots"><i class="on"></i><i></i><i></i><i></i><i></i></div><span class="next">↓ Weiter: ${nm(PRODUCTS[1])}</span></div>`; } },

  { key: 'swiss', name: 'Swiss-Raster', idea: 'Streng gerastert wie klassisches Schweizer Design: dünne Linien, Nummern, viel Weißraum, kleine Bilder in festen Feldern. Sachlich und sehr erwachsen.',
    tags: ['Sachlich', 'Feines Raster', 'Erwachsen', 'Gut lesbar'],
    css: `.S-swiss .g{display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid var(--ink);margin:40px 50px}.S-swiss .c{border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:16px;min-height:200px;display:flex;flex-direction:column;justify-content:space-between}
      .S-swiss .c:nth-child(6n){border-right:0}.S-swiss .c img{height:220px;align-self:center}.S-swiss .c .n{font-family:'Martian Mono',monospace;font-size:11px}.S-swiss .c h3{font-size:70px;font-weight:500}
      .S-swiss .c.big{grid-column:span 3}.S-swiss .c.w2{grid-column:span 2}`,
    html: () => `${shopTop()}<div class="g"><div class="c big"><span class="n">AZUR · KOLLEKTION 01</span><h3>Fünf Trikots.<br>Ein Schnitt.</h3></div><div class="c"><span class="n">Lieferung</span><b>ca. 3 Werktage</b></div><div class="c"><span class="n">Versand</span><b>ab 90 € gratis</b></div><div class="c"><span class="n">Rückgabe</span><b>14 Tage</b></div>
      ${PRODUCTS.map((q, i) => `<div class="c w2" style="min-height:360px"><span class="n">0${i + 1} — ${q.code}</span><img src="${q.img}" alt=""><div class="row"><b>${nm(q)}</b><span class="price" style="font-size:14px">${eur(q.price)}</span></div></div>`).join('')}
      <div class="c w2" style="min-height:360px;justify-content:center"><span class="btn">Alle Trikots</span></div></div>` },

  { key: 'brutal', name: 'Brutalistisch', idea: 'Roh und laut: dicke Rahmen, sichtbares Raster, große Großbuchstaben, Schreibmaschinenschrift. Bewusst unpoliert, passt zur kantigen Schrift des Shops.',
    tags: ['Laut', 'Dicke Rahmen', 'Kantig', 'Streetwear-Gefühl'],
    css: `.S-brutal .g{display:grid;grid-template-columns:repeat(3,1fr);border:4px solid var(--ink);margin:30px 40px}.S-brutal .c{border:2px solid var(--ink);padding:18px;display:grid;gap:10px;align-content:start}
      .S-brutal .c img{height:260px;justify-self:center}.S-brutal h2{font-size:150px;font-weight:900;padding:30px 40px 0;line-height:.85}.S-brutal .c b{font-family:'Martian Mono',monospace;font-size:18px;text-transform:uppercase}
      .S-brutal .c .x{background:var(--ink);color:var(--bg);font-family:'Martian Mono',monospace;font-size:14px;padding:12px;text-align:center;text-transform:uppercase}.S-brutal .c.inv{background:var(--ink);color:var(--bg)}`,
    html: () => `${shopTop()}<h2>TRIKOTS<br>KEINE FANARTIKEL</h2><div class="g">${PRODUCTS.map(q => `<div class="c"><img src="${q.img}" alt=""><b>${nm(q)}</b><span style="font-family:'Martian Mono',monospace">${eur(q.price)} / S–XL</span><span class="x">[ IN DEN WARENKORB ]</span></div>`).join('')}
      <div class="c inv"><b>VERSAND</b><span style="font-family:'Martian Mono',monospace;font-size:14px;line-height:1.7">DE CA. 3 WERKTAGE<br>AB 90 € GRATIS<br>14 TAGE RÜCKGABE</span></div></div>` },

  { key: 'polaroid', name: 'Fotowand', idea: 'Die Trikots als Polaroids an einer Pinnwand mit Reißzwecken und Bildunterschrift in Handschrift, wie über dem Schreibtisch im Zimmer. Nah am Zimmer-Gefühl.',
    tags: ['Wie im Zimmer', 'Persönlich', 'Handschrift', 'Warm'],
    css: `.m.S-polaroid{background:#c9a97c}.S-polaroid::before{content:"";position:absolute;inset:0;background:radial-gradient(circle,rgb(0 0 0/.08) 1px,transparent 1.5px) 0 0/8px 8px}
      .S-polaroid .pl{position:absolute;width:300px;background:#fbfaf6;padding:16px 16px 50px;box-shadow:0 14px 26px rgb(0 0 0/.3)}.S-polaroid .pl div{height:280px;background:#e9e4da;display:grid;place-items:center}
      .S-polaroid .pl img{height:250px}.S-polaroid .pl span{position:absolute;left:18px;bottom:10px;font-family:'Caveat',cursive;font-size:26px;color:#222}.S-polaroid .pin{position:absolute;left:50%;top:-8px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#c0392b;box-shadow:0 2px 3px rgb(0 0 0/.4)}
      .S-polaroid h2{position:absolute;left:60px;top:110px;font-family:'Caveat',cursive;font-size:90px;text-transform:none;color:#222;font-weight:700}`,
    html: () => `${shopTop()}<h2>Meine Trikots</h2>${PRODUCTS.map((q, i) => { const pos = [[80, 260, -4], [460, 220, 3], [840, 270, -2], [260, 700, 4], [660, 690, -5]][i]; return `<div class="pl" style="left:${pos[0]}px;top:${pos[1]}px;rotate:${pos[2]}deg"><span class="pin"></span><div><img src="${q.img}" alt=""></div><span>${nm(q)} – ${eur(q.price)}</span></div>`; }).join('')}
      <div style="position:absolute;right:60px;bottom:60px;background:#fbfaf6;padding:20px;width:300px;display:grid;gap:10px;rotate:2deg"><b>Ein Foto antippen = kaufen</b>${ship()}</div>` },

  { key: 'map', name: 'Karte', idea: 'Eine gezeichnete Karte: Deutschland mit Stecknadeln für Frankfurt und Berlin, daneben eine Weltleiste mit den Ländern. Jede Nadel öffnet das Trikot. Zeigt, dass weitere Städte folgen.',
    tags: ['Entdecken', 'Städte auf der Karte', 'Wachstum sichtbar', 'Lokaler Stolz'],
    css: `.S-map .wrap{display:grid;grid-template-columns:1fr 420px;gap:30px;padding:30px 50px}.S-map .de{position:relative;height:1060px;background:var(--surf2)}
      .S-map .de svg{position:absolute;inset:40px}.S-map .pin{position:absolute;display:grid;gap:6px;justify-items:center;translate:-50% -100%}.S-map .pin i{width:22px;height:22px;border-radius:50% 50% 50% 0;rotate:-45deg;background:var(--acc)}
      .S-map .pin .cardm{background:var(--bg);padding:10px;display:grid;grid-template-columns:70px auto;gap:10px;align-items:center;box-shadow:0 10px 20px rgb(0 0 0/.15);font-size:13px}.S-map .pin img{width:70px;height:70px;object-fit:contain}
      .S-map .pin.soon i{background:var(--line)}.S-map .side{display:grid;gap:14px;align-content:start}.S-map .w{display:grid;grid-template-columns:90px 1fr auto;gap:12px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px}.S-map .w img{width:90px;height:90px;object-fit:contain}`,
    html: () => `${shopTop()}<div class="wrap"><div class="de"><svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" width="100%" height="100%"><path d="M38 4 L58 6 L66 14 L72 30 L80 36 L84 54 L78 70 L82 84 L72 98 L64 118 L44 124 L30 116 L22 98 L14 86 L18 66 L12 50 L20 34 L30 26 Z" fill="var(--bg)" stroke="var(--ink)" stroke-width=".6"/></svg>
      <div class="pin" style="left:38%;top:58%"><div class="cardm"><img src="${PRODUCTS[0].img}" alt=""><span><b>Frankfurt 069</b><br>${eur(PRODUCTS[0].price)}</span></div><i></i></div>
      <div class="pin" style="left:68%;top:32%"><div class="cardm"><img src="${PRODUCTS[1].img}" alt=""><span><b>Berlin 030</b><br>${eur(PRODUCTS[1].price)}</span></div><i></i></div>
      <div class="pin soon" style="left:56%;top:76%"><span class="desc" style="background:var(--bg);padding:4px 8px">nächste Stadt?</span><i></i></div><div class="pin soon" style="left:30%;top:22%"><span class="desc" style="background:var(--bg);padding:4px 8px">nächste Stadt?</span><i></i></div></div>
      <div class="side"><span class="eyebrow">Und in der Welt</span><h3 style="font-size:46px">Länder</h3>${PRODUCTS.slice(2).map(q => `<div class="w"><img src="${q.img}" alt=""><b>${q.name}</b><span class="price" style="font-size:14px">${eur(q.price)}</span></div>`).join('')}<span class="btn ghost">Stadt vorschlagen</span>${ship()}</div></div>` },

  { key: 'finder', name: 'Trikot-Finder', idea: 'Oben drei kurze Fragen (Stadt oder Land? Welche Größe? Polo- oder Rundkragen?), darunter sofort die passenden Trikots. Hilft bei der Entscheidung statt nur zu zeigen.',
    tags: ['Beratung', 'Weniger Auswahl-Stress', 'Größe gleich dabei', 'Hohe Kaufquote'],
    css: `.S-finder .q{margin:34px 50px;background:var(--ink);color:var(--bg);padding:30px 34px;display:grid;grid-template-columns:repeat(3,1fr);gap:30px}.S-finder .q h2{grid-column:1/-1;font-size:60px;color:var(--bg)}
      .S-finder .q .chips span{border-color:#555;color:var(--bg)}.S-finder .q .chips span.on{background:var(--bg);color:var(--ink)}.S-finder .q b{display:block;margin-bottom:10px;font-size:14px}
      .S-finder .res{padding:0 50px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.S-finder .hint2{padding:0 50px 16px;font-size:15px}`,
    html: () => `${shopTop()}<div class="q"><h2>Finde dein Trikot</h2><div><b>1. Stadt oder Land?</b><div class="chips"><span class="on">Stadt</span><span>Land</span><span>Egal</span></div></div>
      <div><b>2. Deine Größe</b><div class="chips"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div></div><div><b>3. Kragen</b><div class="chips"><span class="on">Polo</span><span>Rund</span></div></div></div>
      <p class="hint2"><b>2 Trikots passen</b> · in Größe M lieferbar · ca. 3 Werktage</p><div class="res">${PRODUCTS.slice(0, 2).map(q => pcard(q, 420, { qa: true })).join('')}<div style="background:var(--surf2);padding:24px;display:grid;gap:12px;align-content:center"><b>Beide nehmen?</b><span class="desc">Zusammen über 90 €: Versand gratis.</span><span class="btn">Beide in den Warenkorb</span></div></div>` },

  { key: 'bundle', name: 'Zweierpack', idea: 'Oben zwei leere Plätze „Dein Zweierpack“, darunter alle Trikots zum Hineinziehen. Sobald zwei gewählt sind: Versand gratis. Macht den Gratis-Versand zum Spiel.',
    tags: ['Mehr pro Bestellung', 'Gratis-Versand-Anreiz', 'Spielerisch', 'Ehrlich'],
    css: `.S-bundle .pk{margin:34px 50px;background:var(--surf);border:2px solid var(--ink);padding:26px;display:grid;grid-template-columns:1fr 1fr 360px;gap:22px;align-items:center}
      .S-bundle .slot{height:260px;border:2px dashed var(--line);display:grid;place-items:center;background:var(--bg)}.S-bundle .slot img{height:220px}.S-bundle .slot.full{border-style:solid;border-color:var(--ink)}
      .S-bundle .sum{display:grid;gap:12px}.S-bundle .g{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;padding:0 50px}.S-bundle .g .pc .ph{outline:0}`,
    html: () => `${shopTop()}<div class="pk"><div class="slot full"><img src="${PRODUCTS[0].img}" alt=""></div><div class="slot"><span class="desc">+ zweites Trikot wählen</span></div><div class="sum"><span class="eyebrow">Dein Zweierpack</span><h3 style="font-size:40px">Noch 1 Trikot</h3>
      ${fsbar(PRODUCTS[0])}<span class="btn">Zum Warenkorb</span></div></div><div style="padding:0 50px 14px"><b>Trikot hinzufügen</b></div><div class="g">${PRODUCTS.map(q => pcard(q, 240, { qa: true })).join('')}</div>` },

  { key: 'roomlist', name: 'Zimmer + Liste', idea: 'Links bleibt ein Bild des Zimmers stehen, die Trikots darin sind nummeriert. Rechts die Liste dazu: Fährt man über einen Eintrag, leuchtet das Trikot im Bild. Der Übergang vom Zimmer in den Shop wird nahtlos.',
    tags: ['Nahtlos aus dem Zimmer', 'Nummern im Bild', 'Liste rechts', 'Wiedererkennung'],
    css: `.S-roomlist .wrap{display:grid;grid-template-columns:1.2fr 1fr;height:1154px}.S-roomlist .im{position:relative;background:url(img/rail.webp) center/cover}
      .S-roomlist .im b{position:absolute;width:40px;height:40px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-size:15px}.S-roomlist .im b.on{background:var(--acc);color:#fff;box-shadow:0 0 0 10px rgb(31 95 191/.3)}
      .S-roomlist .ls{padding:40px;display:flex;flex-direction:column;gap:10px}.S-roomlist .li{display:grid;grid-template-columns:40px 100px 1fr auto;gap:16px;align-items:center;padding:12px;border-bottom:1px solid var(--line)}
      .S-roomlist .li.on{background:var(--surf2)}.S-roomlist .li img{width:100px;height:100px;object-fit:contain}.S-roomlist .li span:first-child{font-family:'Martian Mono',monospace}`,
    html: () => `${shopTop()}<div class="wrap"><div class="im">${[[23, 40], [33, 40], [43, 40], [53, 40], [65, 42]].map(([x, y], i) => `<b class="${i === 2 ? 'on' : ''}" style="left:${x}%;top:${y}%">${i + 1}</b>`).join('')}</div>
      <div class="ls"><span class="eyebrow">Am Kleiderständer</span><h2 style="font-size:70px">Was im Zimmer hängt</h2>${PRODUCTS.map((q, i) => `<div class="li ${i === 2 ? 'on' : ''}"><span>0${i + 1}</span><img src="${q.img}" alt=""><b>${nm(q)}</b><span class="price" style="font-size:14px">${eur(q.price)}</span></div>`).join('')}<span class="btn" style="margin-top:12px">Ausgewähltes kaufen</span>${ship()}</div></div>` },

  { key: 'catalog', name: 'Versandkatalog', idea: 'Wie ein Versandhauskatalog aus den 90ern: Bestellnummern, Größen-Kästchen, kleine Beschreibungstexte und ein Bestellschein-Kasten. Retro und sehr klar beim Kauf.',
    tags: ['Retro 90er', 'Bestellnummern', 'Bestellschein', 'Witzig und klar'],
    css: `.S-catalog .pg{margin:30px 40px;background:#fff;border:1px solid #ccc;display:grid;grid-template-columns:1fr 1fr;gap:0}.S-catalog .it{border:1px solid #ddd;padding:20px;display:grid;grid-template-columns:200px 1fr;gap:16px}
      .S-catalog .it img{height:220px;justify-self:center}.S-catalog .it .no{font-family:'Martian Mono',monospace;font-size:12px;background:#ffe600;color:#111;padding:2px 6px;width:max-content}
      .S-catalog .it h4{margin:6px 0;font-size:24px;font-weight:900;font-stretch:70%;text-transform:uppercase}.S-catalog .it .pr{font-size:34px;font-weight:900;color:#c00;font-stretch:70%}
      .S-catalog .boxes{display:flex;gap:4px}.S-catalog .boxes i{width:30px;height:26px;border:1.5px solid #111;display:grid;place-items:center;font-style:normal;font-size:11px}
      .S-catalog .order{grid-column:1/-1;background:#ffe600;color:#111;padding:20px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;border-top:3px solid #111}`,
    html: () => `${shopTop()}<div class="pg">${PRODUCTS.slice(0, 4).map((q, i) => `<div class="it"><img src="${q.img}" alt=""><div><span class="no">Best.-Nr. ${q.code}-0${i + 1}</span><h4>${nm(q)} Trikot</h4><p class="desc">${q.city ? 'Polokragen, Vorwahl auf dem Rücken.' : 'Retro-Schnitt, Rundkragen.'} Lieferzeit ca. 3 Werktage.</p>
      <div class="boxes" style="margin:10px 0">${['S', 'M', 'L', 'XL'].map(s => `<i>${s}</i>`).join('')}</div><span class="pr">${eur(q.price)}</span></div></div>`).join('')}
      <div class="order"><span><b>Bestellschein</b> · ab 90 € versandkostenfrei · 14 Tage Rückgabe</span><span class="btn" style="background:#111">Jetzt bestellen</span></div></div>` },

  { key: 'boxoffice', name: 'Vorverkauf', idea: 'Die Shopseite als Ticket-Vorverkauf: jedes Trikot ist ein Ticket für sein „Spiel“, untereinander wie Spieltermine. Rechts „Tickets“ mit Größe und Kaufen. Führt die Ticket-Idee der Produktansicht weiter.',
    tags: ['Ticket-Familie', 'Liste wie Spieltermine', 'Kauf in der Zeile', 'Wiedererkennung'],
    css: `.S-boxoffice .ls{padding:34px 50px;display:grid;gap:16px}.S-boxoffice .tk{display:grid;grid-template-columns:200px 1fr 220px 240px;background:var(--surf);border-radius:14px;height:170px;align-items:center;position:relative}
      .S-boxoffice .tk img{height:150px;justify-self:center}.S-boxoffice .tk h3{font-size:46px}.S-boxoffice .tk .d{font-family:'Martian Mono',monospace;font-size:12px;color:var(--mut)}
      .S-boxoffice .tk .stub{height:100%;border-left:2px dashed var(--line);display:grid;place-content:center;gap:8px;padding:0 20px}.S-boxoffice .tk .stub .btn{height:42px}`,
    html: () => `${shopTop()}<div class="ls"><div class="row"><h2 style="font-size:80px">Vorverkauf</h2><span class="desc">Alle Spiele · Größen S–XL · ca. 3 Werktage</span></div>
      ${PRODUCTS.map((q, i) => `<div class="tk"><img src="${q.img}" alt=""><div><span class="d">SPIEL 0${i + 1} · ${q.city ? 'HEIMSPIEL ' + q.code : 'LÄNDERSPIEL'}</span><h3>${nm(q)}</h3></div><div class="d">Block S · M · L · XL<br>Anstoß: ca. 3 Werktage</div><div class="stub"><span class="price">${eur(q.price)}</span><span class="btn">Ticket lösen</span></div></div>`).join('')}</div>` },

  { key: 'studio', name: 'TV-Studio', idea: 'Wie ein Sportstudio im Fernsehen: das Trikot auf der großen Studiowand, davor ein Moderationspult mit Preis und Kaufen, unten eine Laufschrift mit den anderen Trikots.',
    tags: ['Show', 'Auffällig', 'Ein Trikot im Fokus', 'Laufschrift unten'],
    css: `.S-studio .set{position:relative;height:1154px;background:radial-gradient(ellipse at 50% 30%,#3b4250,#11141a)}.S-studio .wall{position:absolute;left:180px;right:180px;top:60px;height:560px;background:#0b0d12;border:8px solid #2a2f3a;display:grid;place-items:center}
      .S-studio .wall img{height:500px}.S-studio .wall h2{position:absolute;left:30px;bottom:24px;color:#fff;font-size:70px}.S-studio .desk{position:absolute;left:300px;right:300px;top:680px;height:220px;background:linear-gradient(#e8e5de,#bdb8ad);clip-path:polygon(6% 0,94% 0,100% 100%,0 100%);display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px;padding:0 120px}
      .S-studio .lower{position:absolute;left:0;right:0;bottom:120px;height:70px;background:var(--acc);color:#fff;display:flex;align-items:center;gap:40px;padding:0 40px;font-weight:800;text-transform:uppercase;font-stretch:75%;font-size:20px;white-space:nowrap;overflow:hidden}`,
    html: () => { const q = PRODUCTS[1]; return `${shopTop()}<div class="set"><div class="wall"><img src="${q.img}" alt=""><h2>${title(q)}</h2></div><div class="desk"><div><span class="eyebrow" style="color:#333">Heute im Studio</span><div class="price" style="font-size:34px;color:#111">${eur(q.price)}</div></div><span class="btn">In den Warenkorb</span></div>
      <div class="lower">${PRODUCTS.map(o => `<span>${nm(o)} · ${eur(o.price)}</span>`).join('<span>✦</span>')}</div></div>`; } },

  { key: 'scarf', name: 'Fanschals', idea: 'Jedes Trikot bekommt eine Zeile wie ein gestrickter Fanschal: der Name groß im Strick-Look über die ganze Breite, am Ende das Trikot mit Preis. Stadion-Gefühl, ohne Kitsch.',
    tags: ['Stadion-Gefühl', 'Volle Breite', 'Typografisch', 'Merkt man sich'],
    css: `.S-scarf .ls{padding:34px 0;display:grid;gap:18px}.S-scarf .sc{position:relative;height:190px;display:grid;grid-template-columns:1fr 280px;align-items:center;background:var(--ink);color:var(--bg)}
      .S-scarf .sc::before,.S-scarf .sc::after{content:"";position:absolute;left:0;right:280px;height:14px;background:repeating-linear-gradient(90deg,var(--bg) 0 10px,transparent 10px 20px)}.S-scarf .sc::before{top:12px}.S-scarf .sc::after{bottom:12px}
      .S-scarf .sc b{font-size:110px;font-weight:900;font-stretch:62%;text-transform:uppercase;letter-spacing:.12em;text-align:center}.S-scarf .sc .end{height:100%;background:var(--surf);color:var(--ink);display:grid;grid-template-columns:120px 1fr;align-items:center;gap:10px;padding:0 16px}
      .S-scarf .sc .end img{width:120px;height:150px;object-fit:contain}.S-scarf .sc.alt{background:var(--acc)}`,
    html: () => `${shopTop()}<div class="ls">${PRODUCTS.map((q, i) => `<div class="sc ${i % 2 ? 'alt' : ''}"><b>${q.name} ${q.city ? q.code : ''}</b><div class="end"><img src="${q.img}" alt=""><div style="display:grid;gap:6px"><span class="price" style="font-size:16px">${eur(q.price)}</span><span class="btn" style="height:38px;font-size:12px">Kaufen</span></div></div></div>`).join('')}</div>` },

  { key: 'rows', name: 'Laufzeilen', idea: 'Jedes Trikot ist eine riesige Textzeile über die volle Breite, die langsam durchläuft. Fährt man darüber, bleibt sie stehen und Bild, Preis und Kaufen erscheinen. Laut und modern.',
    tags: ['Riesige Schrift', 'Bewegung', 'Bild beim Drüberfahren', 'Modern'],
    css: `.S-rows .r{position:relative;height:200px;border-bottom:1px solid var(--ink);display:flex;align-items:center;white-space:nowrap;overflow:hidden}
      .S-rows .r b{font-size:180px;font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:1;padding-left:40px;color:transparent;-webkit-text-stroke:2px var(--ink)}
      .S-rows .r.on b{color:var(--ink);-webkit-text-stroke:0}.S-rows .r .pop{position:absolute;right:120px;top:50%;transform:translateY(-50%);display:grid;grid-template-columns:170px 200px;gap:20px;align-items:center;background:var(--surf);padding:10px 16px;box-shadow:0 20px 40px rgb(0 0 0/.2);z-index:2}
      .S-rows .r .pop img{width:170px;height:170px;object-fit:contain}`,
    html: () => `${shopTop()}${PRODUCTS.map((q, i) => `<div class="r ${i === 1 ? 'on' : ''}"><b>${q.name} ${q.code} · ${q.name} ${q.code}</b>${i === 1 ? `<div class="pop"><img src="${q.img}" alt=""><div style="display:grid;gap:10px"><span class="price">${eur(q.price)}</span>${sizes()}<span class="btn">Kaufen</span></div></div>` : ''}</div>`).join('')}<div style="padding:20px 40px">${ship()}</div>` },
];
