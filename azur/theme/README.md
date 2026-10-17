# AZUR theme files (Phase 2)

Files for the Shopify theme **"Azur Zimmer Runde 7 (Entwurf)"** (`gid://shopify/OnlineStoreTheme/209492050259`, a copy
of the live theme "Azur Zimmer Runde 6 (Entwurf)" `208975364435`, which the owner published after round 6).
Only these files are added or changed in the copy; everything else stays the live theme's. (Round 6: Files azr6-, the
live theme; round 5: Files azr5-, draft 208914973011; round 4: Files azr4-; 4.1: draft 208843571539, superseded.)

| File | What |
|---|---|
| `sections/azur-room.liquid` | the room as the first homepage section (markup, products from Shopify, settings) |
| `snippets/azur-room-data.liquid` | views / light passes / camera moves (generated) |
| `assets/azur-room.js`, `assets/azur-room.css` | the room (generated from `azur/prototype/js`, `azur/prototype/css`) |
| `assets/azur-martian-mono.woff2`, `assets/azur-caveat.woff2` | self-hosted fonts (SIL OFL) |
| `templates/index.json` | homepage: room, then the existing sections (the old campaign hero is disabled, not deleted) |
| `files/` + `files.json` | renders (3200 wide), 2400 and 1200 wide copies, jersey models (GLB), outside clips and flight videos (mp4 + webm, both ways) for Content > Files (`azr7-…`, round 7), fetched by Shopify from this repo |

Editable in the theme editor (section "AZUR Zimmer"): products per hook, drop text, care note, free shipping from (€),
the menu behind the three dots, and the ANSTOSS pages as blocks "Heftseite" (no blocks = the default issue).

Rebuild after changing the prototype: `python3 azur/tools/build_artifact.py` (copies the flight videos, half-size copies), then
`python3 azur/tools/build_theme.py`. Test locally: `python3 azur/tools/theme_harness.py` (http://127.0.0.1:8770/).
