# AZUR bedroom — status

Read this first when resuming work. The full creative brief is in `BRIEF.md`.

## Where we are

**Phase 1 (Claude Artifact prototype)**. Shopify implementation (Phase 2) starts only after explicit approval.

| Step | State |
|---|---|
| Palette chosen | Done: A, Azur Electric (Glow #16B8FF, Highlight #8DEBFF, Ink #0A6A9A, Night #07131D) |
| 3D toolchain | Done: Blender 5.0.1 via `pip install bpy==5.0.1` (Python 3.11), Cycles on CPU |
| Assets | Done: jerseys from Shopify, AZUR logo from the live theme, 23 CC0 poster photos, Poly Haven textures/models/HDRI |
| First still (golden hour) | Done: `renders/still_golden_hour.png`, approved as a direction on 2026-10-06 |
| Scene round 2 | Done: pillow, folded-back duvet, magazine, desk corner with lamp and chair, boots, training bag, medals, pennant, black garment bag with AZUR print and zip, flush ceiling light, neon double tubes for thick strokes |
| Camera options | Rendered: presets A–F plus bed detail G in `scene/build_room.py` (`CAMS`). Owner decides later; bed is out of frame in most angles, so a layout change (bed against the left poster wall) is proposed |
| Views + light passes | **Done** (04:32 UTC): beauty plates, depth maps, hanger + drop sprites, all 7 light passes for room / rail / rail_m / bed. Checked in the browser across the day and published (artifact version 8) |
| Interactive prototype | **Published**: https://claude.ai/artifact/B4j6WH1yNHNeEG6rJLJ2Sy (code in `prototype/`, config in `prototype/js/azur-config.js`) |
| Real camera moves | **Done and live** (artifact version 12, 09:20 UTC): room → rail and room → bed (and back), each with a day and a night set; garments fly along. Phones and rail ↔ bed keep the fake move |
| Bed fix | **Done in the scene, re-rendering**: the duvet looked lumpy and grey. Now it is simulated the way it happens (head edge pulled back on a hook, then let go): a thrown-back sky-blue duvet with soft folds, the white pillow free. Bed camera unchanged. Room and bed plates/passes are re-rendered with the new `.cache/azur_room.blend`; rail views do not show the bed and stay valid |

## Owner feedback on the first still (2026-10-06)

- Likes the idea and the first design. Posters, rail, window, ball, rug and trophy work well.
- The bed tells no story: fix it (crumpled duvet, pillow, things on the bed).
- Jerseys overlapping is fine: you hover through them, details only on click (small info with a link to the product).
- Garment bag: free to redesign. Logo correction in the neon: yes.
- Add more storytelling objects.
- Realistic style is right for now (may change later). The time of day must follow the visitor's clock.
- Camera may change later (bed barely visible, jerseys slightly too far). Keep the camera configurable or show several angles.
- Animation details may still change: build motion fully parameterised.
- Interaction inspiration accepted (see `refs/NOTES.md`).

## Owner decisions (2026-10-07, night)

- Start view: the room (camera B = view `room`). Clicking a jersey moves the camera to the rail (`rail`, closer and higher than C) and opens that jersey in one step. Clicking the bed moves to the bed view (`bed`).
- Fake camera moves for now; **real rendered moves must follow later**.
- Phones start at the rail (`rail_m`), swipe along it, garments swing with the swipe.
- Bed: easter egg comes later (decided 2026-10-07 afternoon, owner left it to us: the magazine, see below).
- Overlapping jerseys are fine; details only on click.

## Scene 2 (owner feedback 2026-10-07: jerseys looked pasted in)

- Jerseys are real 3D garments in the renders now: a thin fabric shell built from the shop's front and back photos
  (`jersey_mesh` in `build_room.py`), hooks only (the wooden bar sits inside). New: double window with mullion, gaskets,
  aluminium handles, roller-shutter cover and belt winder; linen curtain; lofted football boots; ceiling spot over the
  rail (its own light pass `spot`); magazine cover flat.
- Render set `prototype/assets/scene2/` (`AZUR_SET`, default scene2; old set stays in `assets/views` until scene2 is live):
  views room / rail / rail_m / bed with garments (beauty, depth, 8 passes), `ids.png` (which garment is where: hover and
  click), `window.png` (where the outside shows), chosen-garment views `rail@i` / `rail_m@i` (garment taken off the rail
  toward the camera, 8 passes each), moves room→rail / room→bed and pull moves `rail-rail@i`, day + night.
- Outside the window: real footage of kids playing on a Bolzplatz (Mixkit, free licence: https://mixkit.co/free-stock-video/young-boy-scoring-free-kick-goal-6652/),
  cut into a seamless 6.6 s loop: `prototype/assets/scene2/outside/bolzplatz.mp4`; shown through the window mask by the compositor.
- Rendering: the owner's PC (`powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1`, about 1.5 h).
  Views and passes took about 20 s per image; a chosen-garment view (beauty + 8 passes) about 2.5 min.
- Prototype scene2 mode (`cfg.plateGarments`, switched on when `assets/scene2/views/passes.json` exists): garments are in
  the plate; hover/click read `ids.png`; clicking takes the garment off the rail (`rail@i`, pull move when rendered, a
  crossfade otherwise; a garment whose `rail@i` is not rendered yet is selected on the rail as it hangs). The window
  video is graded by the sky colour and fades out after dusk; it pauses while the magazine is open.
- Bed easter egg: the magazine **ANSTOSS** on the duvet (`prototype/js/azur-mag.js`, copy in `azur-config.js` → `copy.mag`).
  Hotspot from `views.json` → `bed.magazine` (projected by `job_projections`), a small glint, label "ANSTOSS lesen".
  Opens a flip book: cover (CC0 photo "Children Football", sasint), editorial with the shop's own "Über Azur" text and a
  clickable contents list, photo page, one lookbook page per jersey ("Am Ständer ansehen" walks to it, "Im Shop" opens the
  product), the drop teaser (goes to the covered garment) and a back cover. Desktop: spreads turning on the spine; phones:
  one page at a time. Header "Über uns" and `#anstoss` open it too. Founder names (Impressum, unpublished) are left out on purpose.
- Publishing: `python3 azur/tools/build_artifact.py` assembles `azur/.cache/publish/` (page + `files.json`); move frames
  are packed into strips there (an artifact version holds at most 511 files).

## Phase 2: Shopify (started 2026-10-07 evening, owner approved: "Kannst du all das in Shopify reinmachen?")

- (Since 2026-10-07 22:14 UTC this theme is live; round 3 is in "Azur Zimmer Runde 3 (Entwurf)" `208772268371`, see below.)
- Draft theme **"Azur Zimmer (Entwurf)"** `gid://shopify/OnlineStoreTheme/208669016403` (copy of the live theme
  "Azur Drops + Teaser" `208428204371`, which stays untouched). Preview (logged into the admin, or after the storefront
  password): https://azurclothing.com/?preview_theme_id=208669016403 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/208669016403/editor
- In the draft: `sections/azur-room.liquid` (room = first homepage section under the overlay header, products from the
  section settings, real cart via /cart/add.js + the theme drawer, drop sign-up via the customer form, tags newsletter,
  drops), `snippets/azur-room-data.liquid`, `assets/azur-room.js|css`, fonts, `templates/index.json` (room, then the
  existing sections; the campaign hero is disabled, not deleted). Source: `azur/theme/` (see its README).
- Renders: 226 files in Content > Files, names `azr1-…` (all READY). Shopify fetched them from this public repo.
- Not testable from the cloud: the storefront is password-protected. Local stand-in: `tools/theme_harness.py`.
- Publishing the draft (making it live) is the owner's step in the admin, after the preview looks right.

## Round 3 (owner feedback 2026-10-07 evening, after the Shopify draft): plan and decisions

Owner decisions: PDP shows a real 3D jersey in the browser (rotate + zoom; light model, own tiny WebGL viewer);
night = teen only suggested (body shape under the duvet, hair on the pillow, an arm out); after add-to-cart only the
free-shipping hint (real rule: free in DE from 90 €); the new minimal header only over the room (rest of the shop keeps
the theme header). Later the owner may deliver 3D scans of the jerseys: keep the jersey source swappable.
Renders run on the owner's PC through `render_on_windows.ps1 watch` (see "Round 3: where it stands").

Scene (build_room.py, new set `scene3`):
1. jerseys = cloth-simulated shell from the shop photos over a real wooden hanger (hook out of the collar)
2. rail no longer inside the desk; pens rest on the desk; neon sign cleaner (day: glass tubes, night: glow)
3. messy teen bed; time-of-day states as patches: night (sleeping teen), morning (crumpled duvet, alarm),
   day (tidier, kid outside), evening (school bag, books on the floor)
4. masks: object mask (bed / rail / magazine) for white hover outlines; clean plates without garments (sway)
5. renders 2400 px wide (1600 copies for small screens); less quantization (neon lossless)
6. export a light jersey model per product for the PDP viewer
Web: chips Bett | Zimmer | Ständer; white outline glow + white glint dots (bed, rail, magazine); jerseys sway (shader,
ids mask over the clean plate); click on a jersey opens the PDP at once (hover info stays); PDP 3D viewer + shop link;
shipping progress after add; header over the room: no logo (logo dimmed top-left only behind overlays), bag icon
(visible when the cart has items), other links behind three glowing white dots; magazine pages as data (Shopify
section blocks); fix the room staying blurred after closing the PDP (selection blur in plate mode).

## Round 3: where it stands (2026-10-07, 23:05 UTC)

Built and pushed:
- Scene `scene3` (build_room.py + garment.py): cloth-draped jerseys on wooden hangers, rail out of the desk (x 0.76–2.76),
  neon centred over it (x 1.76), messier duvet, pens resting on the desk, states tagged `azur_state`
  (morning: pyjama + phone; evening/night: school bag, exercise books, pencil case; night: duvet over a sleeping shape,
  a socked foot, the magazine slid onto the floor; hoodie over the chair always).
- Pipeline (render_queue.py): 2400×1350 plates (rail_m 1800×2000), 384 samples, encoding with more codes in the dark
  (ENC_REF 1.5, webp q94, neon q97), masks.png/glow.png (+ _night) for hover outlines, times of day as patches
  (`passes.json` → `states[view][state] = {rects, passes, res}`, files `<view>/<state>/<pass>_<n>.webp`, rendered
  only around the changed objects + sun shadows, compared with the kept day EXRs), no posed `@i` views, no pulls.
  render_moves.py: variants day (midday) / evening (golden hour) / night (lamp off), each with its state's objects.
  export_models.py: one GLB per jersey (shell + hanger + hook, ~250–310 KB). render_preview.py: quick looks.
- PC watch mode v2: `render_on_windows.ps1 watch` runs `tools/render_step.ps1` every 2 min (re-read each round),
  reports to `azur/render_status.json`, request fields `id, set, rebuild, redo, jobs`; a newer request stops a stale
  run. Scripts started by an old copy hand over to v2 by themselves (new window, old one closes).
- Web (prototype): white outlines + dots (bed, rail, magazine), swaying jerseys (pendulums bend the plate around the
  hooks), click → product view with the 3D jersey (azur-viewer.js), shipping progress after add + "Weiter umsehen",
  header = sports bag (when the cart has items) + three glowing dots, ghost logo behind overlays, states with crossfade,
  chips Bett | Zimmer | Ständer, magazine pages as data (Shopify blocks "Heftseite"), half-size first load (`_lo`).
- Shopify section updated (not yet pushed to the draft theme): new header, menu (link list), free shipping setting,
  magazine blocks, Files prefix `azr2-`.

Running (2026-10-08 20:25 UTC): the PC is back in watch mode v2 and works on r3-5 (HIP, RX 6750 XT): preview and
models done in 4 min (clean drapes, Türkei visible, pens in the cup, hoodie on the chair, states visible), queue
running. It had not slept overnight: it finished r3-1's states and moves by 05:49 local, but its pushes failed from
01:19 on; those commits arrived with the watch start (they are replaced by r3-5). Earlier note:
Running: nothing since 01:18 local (the PC went to sleep during r3-1, after all day passes and stills). Request r3-5
waits on the branch (replaces r3-4, which never started): rebuild (cleanly draped jerseys, drop bag with more room, pens
in the cup instead of floating, hoodie shaped over the chair back, masks without the footballs), preview, models, all
plates, times of day, moves. Start on the PC: `git pull origin <branch>` then
`powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 watch`.
Artifact version 17 (2026-10-08 ~03:20 UTC): round 3 interim with the PC's r3-1 plates (old pens/hoodie, no state
patches, no moves yet), jersey models exported in the cloud (GLBs base64-wrapped as .glb.json: artifacts do not serve .glb).

Bug round (2026-10-08 morning, owner: "the Deutschland jersey is buggy, once clicked I cannot get out or look at others"):
- 3D viewer froze after the first product view (stop() left a cancelled frame id, kick() then never drew again): every
  later jersey showed the first one opened. Fixed; canvas cleared before a new model, shared downloads, resize redraw.
- Drop card (Nächster Drop) did not close with its × or Escape on the rendered rail, and it sat over the jerseys left of
  the bag. Fixed (closes with its selection; placed right of the bag); hover keeps working while it is open.
- Product view: visible × button, Escape no longer also flies back to the room, page behind does not scroll; jersey
  links (#handle, also in-page) open the product view. Regression test: 16 checks (desktop + phone) pass.
- The Deutschland jersey itself was crumpled (rail plates and 3D model): a one-cell notch under the arm in its pattern
  got pulled shut by the outline relaxation and tangled the shell. garment.py closes such notches, and since the cloth
  solver is chaotic (one cell more or less tangled Berlin instead), every drape is now checked (width, depth, length)
  and re-run with a slightly different grid/pressure until it passes (`garment.RETRIES`, settings in `garment.TUNE`).
- Rail: jerseys 0.29 m apart, the drop bag at x 2.54 and narrower (0.58 m), turned a bit more: it hid half of Türkei.
  Checked with a cloud preview (960×540, 24 samples): all five jerseys visible, Deutschland clean, all drapes pass on
  the first try in the rebuilt scene.
- Artifact version 18 = these web fixes on the interim plates; version 19 adds the re-draped jersey models (cloud export).
- `node azur/tools/test_room.cjs [publishDir] [shotDir]`: browser regression test of the built page (desktop + phone,
  product views, 3D models, drop card, links, cart, menu, chips, magazine, times of day, keyboard, no WebGL).
- 08:10 UTC check (PC still silent): the add button collapsed to a 2 px line after adding (flex column squeezing) →
  fixed (artifact v20); the header bag now follows the theme drawer's cart count (artifact v21, theme harness checked).
- 09:10 UTC check (PC still silent): keyboard use fixed (focus back to the jersey after the product view, Tab trapped in
  it, hidden cart/drop panels inert); no-WebGL and reduced-motion paths checked; test now 54 checks (artifact v22).
- 10:10 UTC check (PC still silent): the room was composited twice per frame (sway + frame loop) → once; the room and
  its window video rest behind the product view (artifact v23). Phone swipe along the rail and the drop card checked.
- 11:10 UTC check (PC still silent): depth and window maps carried Blender's dither noise and did not compress
  (5.2 MB for all views); `scene/maps.py` tidies them (0.35 MB), the pipeline renders maps without dither and tidies
  them too. Phones no longer fetch or decode the window video (no window in that view). Data before the first
  picture: desktop 2.84 -> 1.54 MB, phone 3.60 -> 1.72 MB (artifact v24).
- 12:10 UTC check (PC still silent): accessibility audit (axe-core) of room, product view and magazine: only the
  dimmed logo outside a landmark → in a nav; it was also an invisible Tab stop (now hidden while unused) and, in the
  prototype page, sat under the product view so it could not be clicked (moved to <body> by the app). 0 violations
  now (artifact v25).
- 13:10 UTC check (PC still silent): responsive sweep over six screen sizes. On 320 px phones the product view ran
  past the screen (title's longest word) and the drop card stuck out 6 px; both fixed, Regie button off the chips
  (artifact v26). Landscape phone, tablets, laptop and wide screens were already fine.
- 14:10 UTC check (PC still silent): the Shopify build in the theme harness (desktop + phone): axe clean for our
  markup (the one finding is the harness's stand-in announcement bar), theme header hidden over the room, product
  view with 3D model and shop link, logo hides again after closing. Nothing to fix.
- 15:10 UTC check (PC still silent): dry run of the whole r3-5 pipeline in the cloud at tiny size (AZUR_QUEUE_FAST:
  all four views with passes, masks, ids, window, depth, beauty and the evening/night/morning patches; the camera moves
  room-rail and room-bed in day/evening/night; all preview shots): no errors. The page tested against that output for
  the first time with real state patches and moves: patches go in and out with the clock (night masks at night), the
  moves play both ways by day and by night, no errors. The PC run should go through.
- 16:10 UTC check (PC still silent): evening flights use their own frames; the clock changing while a flight starts
  (both use the snapshot canvas) ends consistent: right state, right view, snapshot gone, no errors.
- 17:10 UTC check (PC still silent): while the PC renders a rebuilt set, the branch is half empty for hours.
  `tools/assets_check.py` now stops build_artifact.py and build_theme.py (exit 2, with the list of what is missing)
  when a view, pass, map or model is missing, so no half-empty page or theme gets published in that window
  (AZUR_ALLOW_PARTIAL=1 builds anyway).

## Round 3 done (2026-10-08, 22:00-23:00 UTC)

- PC run r3-5 (rebuilt scene, preview, models, all passes and state patches, moves): 20:20-21:59 UTC, complete
  (`tools/assets_check.py`: complete). Jerseys clean (Deutschland too), Türkei visible beside the drop bag.
- Web: `go()` no longer drops a view change asked for during a flight (it lands, then takes the latest target); night
  tease points at the magazine; the product title wraps inside its column while Archivo is still loading.
  `test_room.cjs`: all passed. **Artifact version 28** (same URL) = final round 3.
- Shopify: the owner published "Azur Zimmer (Entwurf)" `208669016403` on 2026-10-07 22:14 UTC, so it is the **live
  theme** now (round 2, `azr1-` files) and stays untouched. Round 3 went into a fresh copy of it:
  **"Azur Zimmer Runde 3 (Entwurf)" `gid://shopify/OnlineStoreTheme/208772268371`** (unpublished):
  `sections/azur-room.liquid`, `snippets/azur-room-data.liquid`, `assets/azur-room.js|css` (checksums match the repo;
  `templates/index.json` and the fonts were already identical). Preview:
  https://azurclothing.com/?preview_theme_id=208772268371 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/208772268371/editor
- Files: 200 `azr2-` files in Content > Files, all READY, uploaded as generic files. The CDN re-encodes WebP for the
  browser (PSNR 47 dB, invisible) and keeps masks pixel-exact and models byte-exact.
- Theme harness (desktop + phone): room, rail, bed, product views (Deutschland, Türkei, Frankfurt) open and close,
  no errors (only the harness's own missing favicon). The harness has no Archivo (the live theme self-hosts it), so
  titles show in a wider fallback there.
- Publishing "Azur Zimmer Runde 3 (Entwurf)" is the owner's step. The `azr1-` files are still used by the live theme;
  remove them only after round 3 is live.

## Round 4 (owner feedback 2026-10-09 ~01:00 local, worked through the night in the cloud: the PC is off)

Owner's list: a boy (max two) running past the window now and then instead of a whole team, a kick sound once in a
while, natural perspective; the kid in bed readable (not his head); the room follows the clock (sports bag gone in
the day, pyjama on the floor); jerseys unchanged until 3D scans arrive; logic errors (chair in the desk); keep the
school backpack; the LED logo grainy with an odd glow (shape is fine); the three dots stacked vertically; lighter
on every device without losing quality.

- Jerseys frozen: `scene/frozen/<key>.glb` (the PC's r3-5 drapes) load instead of a new cloth simulation
  (`garment.frozen`, AZUR_RESIM=1 simulates again); textures are the panel crops the UVs were made for.
- Room through the day (`build_room.py` tags): day = he is out (no sports bag, boots or backpack; the pyjama still on
  the floor); morning = bag, boots, backpack, phone on the duvet; evening/night = back (books and pencil case out).
  Night: a readable sleeper under a softer duvet pulled over his head, a warm hallway light through the door ajar
  (`L_hall`, rendered in the street pass, night only, `render_queue.HALL_W`).
- Scene check: `scene/check_scene.py` lists objects that stick into each other. Fixed: chair in the desk legs, boots
  in the duvet on the floor, ball and backpack in the scarf, books under the chair, sock in the foot board.
- Cloud patch (`scene/cloud_patch.py`): compares the round 3 scene (`.cache/azur_room_scene3_r3cloud.blend`) with the
  new one, renders only the changed regions of the day passes and merges them (feathered, same encoding), renders
  the sign again with 512 samples over its whole region (the grain), the time-of-day patches against the new day plates, masks and depth.
  Originals are backed up in `.cache/r4/orig`, progress in `.cache/r4/done.json` and `patch.log` (resumable).
- Neon glow: `scene/glow.py` makes a smooth bloom from the neon pass (`<view>/neon_glow.webp`, quarter size); the
  compositor adds it with the neon light (`config.neonGlow` gain).
- Compositor (performance): the passes are mixed and tone-mapped into one texture only when the light changes; each
  frame reads that texture (was 8 passes + AgX per pixel per frame). Off-screen views give their pass textures back
  to the GPU (`config.gpuViews`, 2). The outdoor clip uploads a frame only when it advances.
- Outside (`scene/outside.py`): a lawn and hedge below the window (park HDRI behind), a boy built from soft shapes
  with a procedural run cycle and a ball he dribbles and kicks, rendered through each window (room, rail) as a short
  clip (`assets/scene3/outside/<view>.mp4|webm`, `outside.json`). The page rests on the first frame (nobody there)
  and plays it every 25-70 s in daylight; a synthesized kick sound (Web Audio) at the kick, and now and then one out
  of sight. Speaker button in the header (`.azur-head__sound`, remembered).
- Menu dots stacked vertically. Shopify Files prefix `azr3-` (round 4).
- 2026-10-09 07:23 UTC the owner asked to finish on the PC: the cloud patch run stopped (bed night, rail and rail_m
  times of day were still open) and the PC renders round 4 in full (request `r4-1`: rebuild, preview, export, queue,
  glow, outside, moves). `render_step.ps1` (watch v3) knows the jobs `glow` and `outside`; on the PC the neon pass gets
  1024 samples (`render_queue.NEON_SAMPLES`), night patches cover the whole picture (the hallway light), the night has
  no lamp patch (off from 23:00), the outside clip 128 samples. The camera flights are on again (`config.realMoves`).
  `cloud_patch.py`, `despeckle.py` stay for a cloud-only round.
- r4-2 (PC): the hallway light 2 W instead of 25 (the duvet next to the door was white at night); the bed view gets
  `views.bed.exposureNight` (-0.8) and the camera flights ease the views' own exposure in (`azur-app.js playMove`).
- Outside clip (cloud): the park HDRI through the window instead of a modelled lawn (the lawn looked turquoise); the
  boy and his shadow are rendered on a shadow catcher with transparent film and laid over one background render
  (`outside.py background/over`, no glass: seen through the pane the catcher is a white wall); darker clothes, soft sun.
- Quality (owner 09.10. midday: "grainy, worse than yesterday, fine small but not big; the sign is still not better"):
  the bright passes (sun, neon, lamp, spot, street, ceiling) sat at the flat top of the Reinhard curve, where one code
  of WebP noise is a big step in light (coloured dots in the sun, a flat grainy sign); r4-2 scaled the sun passes down
  instead, which put the lit jerseys into the bottom codes (coloured grain everywhere). Now `render_queue.LOG_PASSES`
  are stored on a log curve (`LOG_K` 8000, negative scale in passes.json, decoded in the compositor's `dec`; the top
  code at `LOG_TOP` times the pass's median: sun 400, neon 1500, others 800, brighter shows white anyway): about
  3.5-4.5 % of light per code from the room's shade to the sun patch and the tube. (r4-3 put the top at the maximum:
  the neon pass's room, 1/10000 of the tubes, fell into the bottom codes; r4-4 replaced it, re-encoding the passes
  already rendered at 3200 from their kept EXRs.) The desktop views render 3200x1800 (were 2400x1350: soft on
  HiDPI/full screen); `build_artifact.low_copies` makes lo/ (1200) and md/ (2400, passes.json `_md`) copies and the
  compositor loads md unless the canvas shows more than 2600 plate pixels (`platePxNeeded`), then the full plates.
  Shopify Files prefix `azr4-`. PC request `r4-4` (queue + glow): done 2026-10-09 13:27 UTC (1 h 47 min).
- Browser: the neon tubes' cores get their heat back (`config.neonCore` 4: the log-stored pass stops at 1500x its
  median), the neon glow is computed again from the log-encoded pass (`glow.py`).
- Published 2026-10-09 ~14:00 UTC: artifact v32 (https://claude.ai/artifact/B4j6WH1yNHNeEG6rJLJ2Sy), Shopify Files
  `azr4-` (254, READY), draft theme "Azur Zimmer Runde 4 (Entwurf)" `gid://shopify/OnlineStoreTheme/208797204819`
  (a copy of the live theme 208669016403; section, data snippet, js and css upserted, checksums match). Publishing
  the draft is the owner's step. The shop stays password-protected (owner's setting, not touched).
- Open: the jerseys (3D scans from the owner later); the camera flights are 1600 wide (round 4 renders, not 3200).
- Fix 2026-10-09 evening: views loaded on demand (phones, and any window up to 760 CSS px, e.g. the artifact beside
  the Claude sidebar, which switches the page to its phone layout) never left their 1200 px copies: soft and blocky when
  shown larger. `enterView` now starts the upgrade for every view. Artifact v33. The owner had published draft
  208797204819 (now the live theme), so the fix went into a new copy "Azur Zimmer Runde 4.1 (Entwurf)"
  `gid://shopify/OnlineStoreTheme/208843571539` (assets/azur-room.js upserted, checksum matches); publishing it is
  the owner's step.

## Round 5: render quality (owner 2026-10-09 evening: "fine small, bad on my 1920x1080 monitor")

- The main cause was the web fix above (artifact v33, draft 4.1). The owner still wanted the render upgrades:
- Scene (`build_room.py`): painted walls and ceiling (albedo 0.68 / 0.74 instead of mid grey, `pbr(albedo=, vary=)`:
  the plaster texture keeps its relief but not its blotches), so the room has no black areas and the neon lights the
  wall. Window frame, sashes, gaskets, sill, bed sides, skirting and chair back no longer overlap in a shared face
  plane (secondary rays started inside the other box: black squares in the window corners, a dark sill; check with
  `overlaps`-style box tests before adding parts). New: radiator valve and thermostat, two sockets.
- Assets (`fetch_assets.py`): textures 4k, models 2k (`TEX_RES`, `MODEL_RES`; `build_room` falls back to 2k / 1k).
- Render (`render_queue.py`): beauty and passes 1024 samples, noise threshold 0.005, neon 2048, denoiser set
  explicitly (albedo + normal, accurate, high), more bounces; flights 1920x1080 at 128 samples
  (`render_moves.py`); the outside clip at full size, 256 samples, VP9 crf 30 (`outside.py`).
- Web: the mixed plate is mipmapped and sampled with `textureGrad` (clean when shown smaller than 3200).
- PC watch: a request cut short (PC switched off) resumes without rebuild and skips finished jobs
  (`render_step.ps1`: `render_request_started.txt`, `render_request_jobs_done.txt`; r5-1 itself began under the
  old script, so if it is cut short, push r5-2 with the same jobs and no rebuild). The status file's log is plain
  text again (it was ~4000 lines of PowerShell file notes).
- PC request `r5-1` (scene3, rebuild): the full-quality test still `previews/room_day.jpg` (3200, 9.5 min on the
  RX 6750 XT) came in 2026-10-09 21:38 UTC: window corners clean, room much brighter. The PC slept from 01:13 to
  13:18 local (no uploads); restarted, it resumed at queue (`render_step.ps1` now also recognises a request begun
  under the old script from its own commits). Timings on the RX 6750 XT: a 3200 pass 6-10 min, a state 15-40 min
  (night is full frame: the hallway light), flights ~20 min per move and light.
- r5-1's outside job reused round 4's small frames from `.cache` (20 s, clip 150x200). `outside.py` now stamps the
  frame folder (size, box, samples, ground, scene time) and drops frames of another stamp; request `r5-2` (outside,
  then the remaining flights) rendered the clip at 404x532 / 348x1022. Done 2026-10-10 21:39 UTC.
- Browser check at 1920x1080 (11:00, 18:30, 19:30, 23:30; room, bed, rail): about 1.5x brighter at every hour, the
  shadows lifted most, nothing clipped; the exposures stay as they were.
- Compositor fix: state patches on the 2400/1200 copies could end one pixel past the texture (rounding), and WebGL
  dropped the whole upload (some evening/night lights missing on most screens). `Compositor.rectIn` clamps them.
  `test_room.cjs` waits for a flight to land (2.5-5.5 s in software GL). 59 checks pass. The page fragment declares
  UTF-8 (a plain file server showed 'BlÃ¤tter').
- Published 2026-10-10 ~22:20 UTC: artifact v36 (https://claude.ai/artifact/B4j6WH1yNHNeEG6rJLJ2Sy; v34 removed the
  unused round 2 files, the artifact holds 302 files), Shopify Files `azr5-` (276, all READY, from commit 0e8b0d5),
  draft theme **"Azur Zimmer Runde 5 (Entwurf)" `gid://shopify/OnlineStoreTheme/208914973011`** (a copy of the live
  theme 208797204819; section, data snippet and js upserted, checksums match; css and index.json were identical).
  Preview: https://azurclothing.com/?preview_theme_id=208914973011 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/208914973011/editor. Publishing it is the owner's step; the shop
  stays password-protected. Draft 4.1 (208843571539) is superseded by it.

## Round 6 (owner 2026-10-10 night: boots, ball, backpack; the bed and the magazine easier to see; the light the same
## in every view; fewer, larger posters)

- Light (browser, committed 1208a2b): no view has its own exposure any more (the bed had +0.5 stops, -0.8 at night).
  The camera flights carry the light of their set (noon / golden hour / night) and were about twice as bright as the
  views on screen; `playMove` now grades each flight to the views as the compositor shows them at this hour
  (`Compositor.meanColor`: mixes a cached view, reads a ~400 px mip level; frames averaged alike), start to the view
  it leaves, end to the view it lands on, matched on the displayed average. Measured room <-> bed at 8, 11, 19, 23:30:
  last flight frame vs view after landing within 1-4 %. In Blender every light is global already (passes, not per
  camera). After r6 renders: check the day/night balance with the global daylight keys only (the bed view by day is
  ~20 % darker than it was with its own +0.5, at night brighter where the hallway light falls).
- Wall: the collage is built and removed (random stream unchanged, the rest of the room stays put); three posters
  from `scene/make_posters.py` (JPGs in `assets/posters_r6`, Archivo SIL OFL fetched to `.cache/fonts`): framed 2:1
  stadium above the rail left of the sign, 5:7 jersey poster on hanger rails above the desk, square goalkeeper print
  "ZU NULL." taped above the bed's foot end (placed by projection: whole in the room view, out of the bed view).
- Boots (next to the ball) and the backpack (navy, on the rug) are in every state; the ball stays.
- Magazine: 23 x 31 cm sheet on the flattest part of the duvet the bed view sees whole (ray-cast search), resting on
  the folds' tops and bridging the creases; its top face carries the cover the browser opens (`magazin.jpg`:
  masthead, issue, cover lines, sticker). At night a flat copy on the floor.
- Room camera: from high in the doorway, loc (2.1, 0, 2.15) -> (1.2, 3.1, 0.45), 15 mm (was above the bed's head,
  where the bed hardly showed). Tried 9 positions (scratchpad r6/cams); the far corner hid the window.
- PC request `r6-1` (rebuild, all jobs) pushed 2026-10-10 23:36 UTC.
- PC run: `r6-1` from 2026-10-11 ~04:30 UTC (test still in full quality, previews, models, queue). At the owner's
  request a 2 h pause: `render_step.ps1` learned `pause_until_unix` (a request held back until then; the running one
  stops between two renders like for any newer request). `r6-2` (no rebuild; queue, glow, outside, moves; everything
  rendered is skipped) replaced r6-1 at 13:57 UTC; the owner ended the pause early, r6-2 ran 14:17-17:48 UTC, no errors.
  The rail's evening and morning states no longer differ from day in that view (boots and backpack are in every state).
- Checks: browser at 7:30, 11, 19, 23:30 in room, bed, rail (one light for all views; by day room ~52, bed ~41, rail
  ~69 of 255 on screen; at night the hallway light makes the bed view the brightest, global keys left as they were);
  flights land within 1-2 % of the view at 11, 19 and 23:30; `test_room.cjs` all passed.
- Published 2026-10-11 ~18:10 UTC: artifact v38 (https://claude.ai/artifact/B4j6WH1yNHNeEG6rJLJ2Sy, 267 files; the
  47 rail morning/evening patches of round 5 removed), Shopify Files `azr6-` (241, all READY, from commit ce706df),
  draft theme **"Azur Zimmer Runde 6 (Entwurf)" `gid://shopify/OnlineStoreTheme/208975364435`** (a copy of the live
  theme, now Runde 5 208914973011; section, data snippet and js upserted, checksums match; css and index.json were
  identical). Preview: https://azurclothing.com/?preview_theme_id=208975364435 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/208975364435/editor. Publishing it is the owner's step; the shop
  stays password-protected.

## Round 7 (owner 2026-10-15: everything too shaky and not smooth; more detail on the boots and the backpack)

- Flights (`scene/render_moves.py`): 60 frames a second (72 frames, 1.2 s) with Cycles motion blur (the camera is
  keyframed per frame, shutter 0.5) and a fixed noise seed; one calm path: the position eases along a straight line
  (no rise), the view turns by quaternion slerp, the lens changes on a log scale (round 6: the eye led the body and the
  lens changed linearly, the picture swam). Frames stay on the PC (`.cache/moves/<set>`, cleared on a rebuild); each
  move and light set becomes `<f|e|n>.mp4/.webm` plus `_r` (the way back), moves.json gets `video: true` and the
  average colour of the first and last frames (`ends`). Progress: `moves/progress.json` every 12 frames.
- Browser: `playVideoMove` plays the video in a layer over the stage with the plates' crop (pan, overscan), graded at
  both ends to the views (round 6 light rule) with a CSS brightness and a multiplied tint, animated over the flight.
  The set for the hour (day / golden hour / night) preloads 6 s after the start and when the time of day changes;
  a flight whose video is not buffered yet falls back to the soft blend. `build_artifact.py` and `build_theme.py`
  copy the videos (no strips).
- Live view: half the parallax (follows the pointer by time, frame-rate independent), no cloth ripple, no idle sway
  (it re-rendered at 30 fps), a smaller swing that settles faster; jerseys only move when touched.
- Boots (`scene/props.py`): a late-sixties leather boot after the owner's reference (the black boot with the white
  side stripe and brown laces): a lofted last with the foot opening and lace slot cut by a boolean (lined dark), padded
  collar, tongue, punched eyelets, flat brown laces criss-crossed with a bow (one boot's ends on the floor), stitched
  vamp and heel seams, a cream side stripe of our own shape (even width, rounded ends, stitched; not the maker's stripe,
  no name, no signature), a cream sole plate with ten screw-in studs.
- Backpack (`scene/props.py`): after the owner's reference (Jafferjees "IST", 30 x 16 x 47 cm): a soft navy-blue
  leather box with a rounded top, brass zip over the top and down both sides with two pulls, a stitched seam and a
  zipped pocket on the front, a leather top handle, padded shoulder straps with brass buckles; it stands on the rug.
- Nothing in props.py uses `random`, so the rest of the room builds exactly as before.
- PC run: `r7-1` (rebuild, all jobs) 2026-10-15/17. ffmpeg on the PC stopped at "Enter command:" (it read the
  PowerShell console): every ffmpeg call now has `-nostdin` and no stdin; a video under 1 KB no longer counts as done.
  Flights 2026-10-17 12:08-16:01 UTC, about 37 min each (72 frames x ~36 s), no errors.
- Checks: every flight video has 72 frames (mp4, webm, both ways); in the browser the video set for the hour preloads
  (readyState 4) and plays to the end at 12, 19 and 23 h, room -> bed -> room -> rail -> room; mid-flight frames match
  the views at both ends; `test_room.cjs` all passed.
- Published 2026-10-17 ~17:20 UTC: artifact v40 (https://claude.ai/artifact/B4j6WH1yNHNeEG6rJLJ2Sy, 283 files; the 48
  move strips of round 6 removed, 24 flight videos added), Shopify Files `azr7-` (257, all READY, from commit e7ca6f2),
  draft theme **"Azur Zimmer Runde 7 (Entwurf)" `gid://shopify/OnlineStoreTheme/209492050259`** (a copy of the live
  theme, now Runde 6 208975364435; section (Files prefix azr7-), data snippet and js upserted, checksums match; css,
  fonts and index.json were identical). Preview: https://azurclothing.com/?preview_theme_id=209492050259 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/209492050259/editor. Publishing it is the owner's step; the shop
  stays password-protected.

## Round 8 (owner 2026-10-17: the ball should stand out; brighter boots with a subtle AZUR; then: studs, not flat)

- Ball (`scene/props.py` `ball()`, `ball_texture()`): replaces the worn football at the same spot. A glossy modern match
  ball, after the owner's reference (white with bold swirls): four curved panels (tetrahedral, seams twisted), on each
  two colour swooshes that swell and thin around it (blue with small stars, red, green), seams pressed in, a fine
  dimpled cover. The print is generated with numpy at build time (`.cache/props/ball_col.png`, `ball_h.png`, mapped by
  direction, no UV seams). No text, no marks. Turned so the doorway camera sees mostly blue and red.
- Boots (`boot()`): the round 7 cut in bright colours after the owner's reference (a modern aqua boot with neon
  accents): aqua upper, the stripe fading from neon yellow (heel) to coral (front), white laces and sole plate, navy
  lining, and the brand's script logo small in navy on the forefoot's sides (a decal from
  `prototype/assets/brand/azur-logo-ink.webp`, readable from both sides and on the mirrored boot). After the owner's
  second note (r8-1 replaced by r8-2): the upper 20 % higher (`RISE`), twelve longer blue studs (tips at -12.5 mm), and
  the second boot lies on its side with the sole and studs turned to the doorway camera; both rest on the floor by
  their vertices (`rest_exact`).
- PC run: `r8-1` started 2026-10-17 19:53 UTC and was replaced by `r8-2` (rebuild, all jobs) at 23:02 UTC; r8-2 ran
  23:08-14:46 UTC (queue 23:32-09:38, flights 10:10-14:46), no errors.
- Checks: the full-quality test still (ball, boots, studs); 24 flight videos with 72 frames each; flights play to the
  end at 12, 19 and 23 h; `test_room.cjs` all passed.
- Published 2026-10-18 ~16:00 UTC: artifact v42 (https://claude.ai/artifact/B4j6WH1yNHNeEG6rJLJ2Sy, 258 files; 25 morning
  state patches of round 7 that the new scene no longer needs removed), Shopify Files `azr8-` (232, all READY, from
  commit c5f60c5), draft theme **"Azur Zimmer Runde 8 (Entwurf)" `gid://shopify/OnlineStoreTheme/209556078931`** (a copy
  of the live theme, now Runde 7 209492050259; section (Files prefix azr8-), data snippet and js upserted, checksums
  match; css, fonts and index.json were identical). Preview: https://azurclothing.com/?preview_theme_id=209556078931 ·
  editor: https://admin.shopify.com/store/5vpchz-hd/themes/209556078931/editor. Publishing it is the owner's step; the
  shop stays password-protected.

## Round 9 (owner 2026-10-19: design rounds, a running bar on top, a slimmer header, the light jump at the bed, the
## white flash at the window, lag at a change of view, cleaner motion, a nicer way down into the shop, admin editing)

- Design round 1 (swipe tool): `azur/design/swipe.html`, artifact https://claude.ai/artifact/ASxoX7hgSL2FbYLiFxcajH
  (50 product views + 50 shop pages as HTML/CSS mocks; Ja / Nein / Super per owner in the artifact db `votes/<uid>`,
  localStorage fallback). Next rounds build on the likes and stars.
- Design round 2 (artifact v2 of the swipe tool, `azur/design/r2.js`): owner feedback on round 1 was that colour
  variants are not new designs and that the palette gets its own round. So every card is now its own layout in one
  neutral palette: 24 product views built from his three favourite families (match programme, ticket, magazine, plus
  two crossovers) and 30 new shop-page concepts. Votes go to `votes/<uid>.r2` next to `r1`.
- Owner's round-2 likes (no stars): product view Aufstellung (pteam), Platzwahl (tseat), Drehkreuz (tgate),
  Modemagazin (mclassic); shop Horizontale Reihe (hrail), Klassischer Shop (classic), Spielerkarten (cards).
- Design round 3 (artifact v3, `azur/design/r3.js`, votes `r3`), owner alone; the partner joins only in the last round:
  - product view 13: the four likes again plus mixes (magazine + lineup / seat map / turnstile bar, turnstile +
    lineup / seat map, lineup as stage, round stadium plan, magazine lookbook) and a phone card;
  - shop 13: the three likes plus mixes (classic + cards, filters as chips, sizes on the card, classic + big numbers,
    real clothes rail with hangers and price tags, two rails cities/countries, cards rail, flip cards, sticker album)
    and a phone card;
  - animation 21 (new tab): live CSS demos in a 4.5 s loop with a moving cursor: card hover (lift, swing on the hanger,
    flip, zoom, quick add), buying (fly to bag, button to tick, ticket tear, stamp, cart drawer, ball rolls to free
    shipping), size pick (lineup, seat block), page build-up (stagger, numbers, split-flap board, big marquee, TV
    replay wipe), product image float, top bar (current marquee vs. one message at a time). Paused under reduced
    motion until "Neu abspielen";
  - colour 19 (new tab): one fixed composite (room strip, bar, header, grid, product panel, swatches) in 19
    palettes; text, muted text, button text and button edge checked against WCAG contrast (AA or better).
- Owner's round-3 likes: product view mclassic, mlineup, mseat, glineup, gseat; shop classiccards, quicksize,
  railcards, cards, cardflip, phoneshop; animation lift, check, tear, drawer, ball, lpick, spick, stagger, flap (this is
  the animation set, no further animation round); colour only Flutlicht ("too few, almost all meh": 12 of 19 were
  cream + one accent on a plain generic page).
- Design round 4 (artifact v4, `azur/design/r4.js`, votes `r4`), owner alone, stars pick the finalists:
  product view 8 (the five likes + magazine with the dark bar and lineup / seat map, magazine with lineup in the light
  bar), shop 9 (the six likes + cards with sizes, classic + cards + sizes, card rail + sizes); colour 41 (the liked
  Flutlicht + 40 new, bolder: 11 more floodlight variants, 8 dark with another light, 10 colour-as-surface, 11 light
  but bold), each shown on the favourites (player-card shop under the room strip, magazine + lineup product view, a
  detail strip with button, sizes, badge, free-shipping bar, handwriting) with swatches. New palette variables: `bar`,
  `barInk`, `barStar` (top bar), `cd1a/cd1b/cd1i`, `cd2a/cd2b/cd2i` (player card colours), `bgimg`; all 41 pass the
  contrast check (text and muted text AA, button text AA, button edge 3:1).
- Owner: if round 4 is the last round, only the partner votes. Round 4 is now the final (artifact v5, `PARTNER_ONLY`):
  the partner votes alone and sees no other votes. (v5 showed the owner only a grid without voting; the owner wanted
  the swipe cards back for everyone, so v6 swipes for every viewer again. The owner does not vote this round, so any
  r4 votes, also under the owner's account, count as the partner's.) The nine liked animations are back as a deck for the partner; card
  texts are neutral (no "your yes from round 3"). The partner needs the page shared with a role that may take part
  (not view or comment only), otherwise the page says so.
- Final results (r4, voted by the partner on the owner's account, all 67 cards, no stars): product view yes mlineup,
  glineup; shop yes cardsize, cardflip, classiccardsize, classiccards, quicksize, phoneshop; animation yes lift, flap,
  lpick, check, drawer, ball (no: stagger, spick, tear) = the animation set; colour yes floodneon, floodamber, floodbar,
  floodcone, floodlight, turf, whiteyellow.
- Tie-break "Stechen" (artifact v7, `azur/design/r5.js`, votes `r5`, the partner again): only those yes cards (the
  phone card left out); swipe as before, no = out, yes = stays, passes repeat with the yes cards until one is left,
  a star wins at once, undo also on the winner screen. Vote values in r5: -1 out, 1 in this pass, 2 winner,
  `pass_<deck>` = pass number.
- Open, owner asked to be reminded: the room transition (Überblendung vs. rendered camera flight) and the 30-minute
  admin setup (`azur/admin/ANLEITUNG.md`).
- Live theme files now in the repo (`azur/theme/layout/theme.liquid`, `sections/announcement.liquid`, `sections/header.liquid`,
  `assets/azur.css`, `assets/azur.js`), imported unchanged first (md5 checked), then changed:
  - announcement: messages one per line (textarea with defaults), a seamless marquee (40 px/s, setting), pause
    button, stops on hover/focus and off screen; reduced motion shows the first message still.
  - header: `is-compact` after 48 px of scroll (64 -> 48 px desktop, 56 -> 48 px phone, smaller logo); the section's
    margin grows by what the header loses, so nothing below moves.
- Room (`prototype/js`, rebuilt into the theme):
  - light jump at the bed: the rendered flights carry their own light (e.g. 18:30 a sun patch on the wall the room
    view does not have; the frames are 1.3-1.8x brighter on average). Measured end frame vs. landed view: mean abs
    difference 11-45 levels, up to 77 in a region. Default now `flights: 'blend'`: the room's own picture zooms toward
    the target and dissolves into the next view (made ready under a still copy first; only transform/opacity).
    The flights stay selectable: section setting "Übergang", Regie panel "Ortswechsel".
  - lag: only 2 views keep their 8 light passes on the GPU; the third view's passes were uploaded at the click (plus
    two read-backs for the flight grade): 1-2.3 s long tasks in the software browser. Now every view keeps its mixed
    picture, passes come back one per idle moment, background loads and sharper copies upload in idle time, the
    flight grade's means are cached: no long task over 0.1 s at a change of view.
  - window flash: while the boy's clip seeks to its start (play, end) it had no frame and the plate's hazy glass showed
    for a few frames. The last frame now stays; a clip that arrives after the room fades in.
  - Shopify scroll into the shop: the shop slides over the room like a sheet (shadow); the room stays behind, shrinks
    to 95 % and darkens (transform/opacity on the stage only).
- Admin editing on the website (`azur/admin/`): a Cloudflare Worker holds the Shopify access (Dev Dashboard app,
  client credentials grant: admin-created custom apps can no longer be made) and two logins from secrets; signed
  12 h tokens, lockout after 5 misses, CORS to the shop. It writes the bar to the shop metafield `azur.announcement`
  (definition created 2026-10-19) and product descriptions through `productUpdate` with an HTML allow-list. Theme:
  `snippets/azur-admin.liquid` (loads `assets/azur-admin.js` only with `#admin` or a signed-in session; the worker
  URL goes into `admin_api` there), the bar reads the metafield first, the product description is editable in
  place. Tested: `azur/admin/test_worker.mjs` (Miniflare, 15 checks) and an end-to-end browser run. **Open: the
  owners set it up (`azur/admin/ANLEITUNG.md`), then the worker URL goes into the snippet.**
- Code cleanup (room): the paths before scene3 removed (DOM jerseys, sprites, frame flights, drawn hotspots, the CSS
  kid, the Bolzplatz loop, scene2 detection): about 1,200 lines; keyboard targets now sit on their jerseys; the
  magazine opens out of its dot. Theme and shop code follow after the design decisions.
- No new renders this round: Shopify Files stay `azr8-` (the two Bolzplatz files are no longer used).
- Published 2026-10-19: artifact v43 (code only), draft theme **"Azur Zimmer Runde 9 (Entwurf)"
  `gid://shopify/OnlineStoreTheme/209608147283`** (copy of the live Runde 8 209556078931; room section, room js/css,
  announcement, azur.css, azur.js upserted from commit 8bbaed2; then layout, announcement, main-product, admin snippet
  and js from eb6f051 and the cleaned room from bfc8fb7, checksums match); artifact v44 (code only). Preview:
  https://azurclothing.com/?preview_theme_id=209608147283 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/209608147283/editor. Publishing it is the owner's step.

## Round 10 (the winners of the design final, partner's tie-break 2026-10-20)

- Winners: product view "Modemagazin + Aufstellung" (mlineup), shop "Spielerkarten mit Rückseite" (cardflip), colour
  "Kunstrasen-Neon" (turf), animations lift, flap (split-flap headings), lpick (player steps up), check (button to
  tick), drawer (cart slides in), ball (ball rolls along the free-shipping bar).
- The owner had published Runde 9 meanwhile (MAIN = 209608147283). New draft **"Azur Zimmer Runde 10 (Entwurf)"
  `gid://shopify/OnlineStoreTheme/209757995347`** (themeDuplicate of MAIN), files upserted from commit d1ef3db, checksums
  match: assets/azur.css, azur.js, azur-room.css, azur-room.js, sections/azur-cards.liquid (new), cart-drawer.liquid
  and footer.liquid (imported unchanged from MAIN first, md5 checked, then changed), templates/index.json (section
  "cards" after the room, the old "products" section disabled, not deleted). Preview:
  https://azurclothing.com/?preview_theme_id=209757995347 · editor:
  https://admin.shopify.com/store/5vpchz-hd/themes/209757995347/editor. Publishing it is the owner's step.
- Colour: tokens in azur.css (paper #0a0f0b, surface #121a14, plate #19231b, ink #eef5ee, grey text #9fb1a2, line
  #233026, accent #39ff88 on #062b14); solid buttons, the free-shipping bar and the done state use the accent; the
  formerly black areas (password page, dark drops, campaign dark) use `--c-deep`; header and footer show the light
  signature; `color-scheme: dark`.
- Room product view (prototype/js/azur-shop.js + css, rebuilt with build_theme.build_js/build_css only): the name
  (city or country alone) huge across the top, the 3D jersey in front, story left, sizes as players on a pitch right
  (a row of players on phones, under the jersey), a buy bar at the bottom; after the bag the button turns to a tick,
  the theme's drawer slides in over the view (z-index 120; the after box's opener carries data-cart-open so focus
  returns into the view), the after box shows the ball on the free-shipping bar.
- Player cards (sections/azur-cards.liquid, azur.js "Spielerkarten"): front is a link (no JS) / flip button (JS);
  back: sizes as radios, add to cart via the drawer's Section Rendering, tick, then the drawer slides in; one card
  open at a time; Escape flips back; reduced motion swaps without 3D. The heading flaps letter by letter on first
  view (data-flap, aria-label keeps the text).
- Tested in the local harness (azur/tools/theme_harness.py now renders the cards, the real drawer and azur.js):
  desktop 1440 and phone 390, add from the room and from a card, no errors.
- Not yet: the standalone product page (/products/…) keeps its layout (new colours only).

## Runde 26b (owner 2026-10-29, after the choice: "Mach das Wischprinzip vom PC auch für iPad und Handy")

- **Owner's picks** (artifact db `picks/<id>`): transition kept jetzt, blende, kamera, favourite **kamera**; phone
  scrolling kept only **nativ**; logo kept **gross** and **leiste**, then chose **gross** ("Groß").
- **Built**: one transition on every device. `snippets/azur-variants.liquid` no longer tells PC from touch:
  `data-azt` = `ad` (default kamera, jetzt and blende stay reachable for comparison), `data-azs` = native (glide only
  with `?ad=jetzt`). Removed: `am`, `ax`, the swipe mode in `azur-fall.js`, the looks blatt, schlicht, leicht and the
  logos jetzt, mitte, schwebend.
- **Logo gross** is now the plain header rule in `assets/azur.css` (2.1rem / 2.6rem from 48em, 1.7rem / 2rem when the
  header turns compact; tap area 48–64 px, links to `/`); `?al=` and `data-al` are gone, old addresses just ignore it.
- **Fixed on the way**: the room's lower edge showed as a hard line in the first fifth of the transition (PC too):
  the mist above the sheet now covers fully from the start and only grows in height (`scaleY`, compositor only),
  and overlaps the sheet by 1px (a hairline showed at DSF 2).
- **Tests** (harness): PC fast wheel 1374/0, one notch stays where it is (native); old addresses (`?am=schwung&al=mitte&ad=blatt`)
  fall back to kamera/gross; phones 320, 390, 430 and iPad 820×1180 / 1180×820 scroll natively without errors; reduced
  motion everywhere; phone with CPU ×4 no worse than the accepted nativ state; no seam rows in the frames.
- **Shopify draft**: "Azur Zimmer Runde 26 (Entwurf)", gid://shopify/OnlineStoreTheme/210545869139, a themeDuplicate of
  MAIN (Runde 25, its six files checked equal to f1e7df7 first) plus the six changed files from 278efae (URL upload
  from raw.githubusercontent.com, all MD5 checked equal). Preview: https://azurclothing.com/?preview_theme_id=210545869139
  (shop stays behind its password). `config/preview` on the choice page is left unset: its links name variants that
  are gone. The owner then published it: Runde 26 (210545869139) is MAIN.
- **View buttons** (owner after publishing: "die Tasten „Bett, Zimmer, Ständer" funktioniert nicht mehr. Wenn man
  raufklickt passiert einfach nichts"): they did work, but slowly. A view not on the GPU yet had to wait for a quiet
  moment before each texture strip was uploaded, and the tap itself counts as input, so the camera move started only
  after 5–10 s. Now `fly()` marks the view it waits for (`comp.rush`). `idle(v)` lets that view's strips go up at once,
  one strip per task, while background loads still wait. Harness (software GL): loading takes 0.7–1.7 s (was 2.3–5.8 s);
  the transition and scroll tests and the phone with CPU ×4 run without errors. Commit f7ec215.
- **Shopify draft for the fix**: "Azur Zimmer Runde 26b (Entwurf)", gid://shopify/OnlineStoreTheme/210548228435, a
  themeDuplicate of MAIN (its `azur-room.js` checked equal to 278efae first) plus `assets/azur-room.js` from f7ec215
  (URL upload, MD5 checked equal, as are azur-fall.js, azur.css and azur-variants.liquid). Preview:
  https://azurclothing.com/?preview_theme_id=210548228435 (17 of 20 themes).

## Runde 26 (owner 2026-10-29: desktop transition, phone hang, BRA/GER/TUR labels, white areas on phones, logo, a Tinder-style choice)

Runde 25 (gid://shopify/OnlineStoreTheme/210487050579) is MAIN. Nothing of this round is in a Shopify theme yet: the Shopify
connector needs signing in again, and GitHub refuses the push (403, Claude GitHub App not installed for `azur`), so
commits fdba5cc and 29cb224 are local only until access is back.

- **Fixed in every variant**: the phone hang (big room textures were uploaded in one go and blocked the main thread for
  up to ~1 s each; now in small slices and only while nobody swipes; the sound starts on a tap, not on a swipe);
  BRA/GER/TUR sit inside the card at every size; dark page and browser bar over the room, no white under the
  sliding toolbars (`theme-color` follows `azur-light`); iPhone landscape keeps logo and bag next to the notch.
- **New** `assets/azur-fall.js`: the way from the room into the shop, separate from `azur-room.js` and running before
  the room has loaded. Modes from `data-azs`: glide (Runde 25), swipe (phone: one swipe takes you all the way),
  native. `prefers-reduced-motion` always gives native.
- **Variants** (`snippets/azur-variants.liquid`, URL params, until 26b): `ad` PC transition jetzt|blende|blatt|kamera|schlicht,
  `am` phone scrolling jetzt|nativ|schlicht|schwung, `al` logo jetzt|gross|mitte|leiste|schwebend, `ax=d|m` forces
  PC or phone mode.
- **Choice page** (Tinder style, not in the shop): https://claude.ai/artifact/6ZauCfjzk6SppfUSx2hnDu, built from
  rendered frames (scratchpad `r26/`). Picks land in the artifact db at `picks/<user id>` (`r26`: `ad:kamera` → 1/-1,
  `fav:ad` → favourite); `config/preview` `{theme}` turns on the shop links without a republish.
- **Tests** (harness, Chromium): fast wheel down/up on PC lands on 1374/0 in all transitions; one wheel notch glides
  to the shop (801) with jetzt, stays at 100 with reduced motion; phones 320×568, 375×667, 430×932 without errors;
  schwung goes to the shop on one swipe, a short swipe up from the shop goes back to the jerseys (noted as a con).
- **Browser limits** (iOS 26 Safari): the bar tint comes from fixed elements and the page background, not
  reliably from `theme-color` (WebKit bugs 301756 and 305546, see Ben Frain's write-up); the rubber-band overscroll
  shows the `html` background, which is why it is dark now.
- **Next**: the owner's picks → build only the winners into a new draft (themeDuplicate of MAIN, upload the 6 theme
  files), then #52 simplify.

## Runde 22b (owner 2026-10-27: the real jerseys in the room, best quality, days of rendering are fine)
- Photos of the real national jerseys (azur/photos/<key>/vorne, hinten, detail-logo, detail-wappen; HEIC converted).
  City jerseys keep the shop images (owner: no photos for them, they stay in the room and on their page).
- Pipeline: tools/photo_cutout.py (rembg u2net, hang tag cut by a row opening, floor rows under the hem dropped,
  3200 px) -> tools/photo_textures.py (colour matched to the shop image on coloured pixels only, 3000 px) ->
  tools/photo_warp.py (thin-plate spline from landmarks on both outlines onto the shop image's outline at 2x = 2400 px:
  hem corners, armpits by convexity defects, cuff corners by walking shoulder->armpit, collar/shoulders from the hem
  width, inner grid; brightness matched to the shop image; collar from the shop image (3D inside); Brasilien and
  Deutschland sleeves from the shop image (printed stripes); Türkei chest nudged 2.5 % down) -> assets/jerseys/real/
  <key>-<side>-fit.webp, used by build_room.py JERSEY_PHOTOS for the three national keys with the frozen drapes (UVs
  belong to the shop outline). A new cloth drape from the flat lays looked boxy (sleeves out): not used.
- Owner: the jerseys should hang calmer, only slightly 3D, and sway on hover: garment.frozen() presses the drape's
  depth to 0.55 (AZUR_JERSEY_FLAT). scene/jersey_lab.py renders the three in a studio (old / real / fit).
- Quality (owner: "150000 %"): render_queue SAMPLES 4096 (sprite 512), NOISE 0.0015, neon 8192 at 0.001, bounces
  16/12/8/12, adaptive min 256, no glossy blur; moves 512 samples at 0.006; outside 1024 at 0.006.
- PC request r22-2 (rebuild, preview:full,room_day, preview, queue, glow, outside, moves). After it: check the test
  still, then build_artifact/build_theme with a new Files prefix (azr9-), upload, new draft theme.

## Runde 22 (owner 2026-10-26: iPad lags, iPhone cannot scroll, transition too long)
The owner published Runde 21 (MAIN 210150687059). New draft "Azur Zimmer Runde 22 (Entwurf)"
`gid://shopify/OnlineStoreTheme/210231624019`. Preview: https://azurclothing.com/?preview_theme_id=210231624019
- iPhone: `.is-mobile .azur-stage` had touch-action: none (for swiping along the rail), so a touch on the full-screen
  room could never scroll the page. Now pan-y: horizontal swipes still pan the rail (tested with CDP touch events),
  vertical ones scroll.
- iPad Pro lag: touch devices (`this.coarse`, pointer: coarse) draw at dpr <= 1.5 and skip the depth camera while
  scrolling (the CSS slide stays); the idle sway pauses on all devices while html.azur-diving.
- Shorter: black 70svh (was 105), white before the jerseys 20svh (was 30), slide range 0-90vh. Commit 11b5586.

## Runde 21 (owner 2026-10-25: a performance checklist, "guck selber ob es Sinn ergibt")
The owner published Runde 20 (MAIN = "Azur Zimmer Runde 20 (Entwurf)" 210046550355). New draft "Azur Zimmer Runde 21
(Entwurf)" `gid://shopify/OnlineStoreTheme/210150687059` (copy of MAIN). Preview:
https://azurclothing.com/?preview_theme_id=210150687059
- The list: cache API responses, load balancer, DB index, compress images, cache expensive queries, N+1 queries,
  debounce input handlers, code splitting, CDN, server-side caching, pagination, compress API payloads, unnecessary
  re-renders, minify JS/CSS, lazy loading, defer scripts, unused dependencies, DB connection pooling.
- Not ours (Shopify runs the servers): load balancer, DB index/N+1/pooling, server/query caching, CDN. Checked on the
  live CDN (/cdn/shop/t/36/assets/...): theme assets come minified, Brotli-compressed, cache-control 1 year (azur.css
  69 KB -> 9.9 KB on the wire, azur-room.js 177 -> 36 KB). Already in place: layout defers azur.js, fonts self-hosted
  and preloaded, no third-party scripts, azur-admin.js only on #admin, room renders as WebP in lo -> md -> full tiers,
  collection paginated by 24, card images lazy, cart.js fetches only on actions.
- Done (commit bcd48cd): background downloads (md upgrade, the other views, flight videos) only while the visitor is
  at the room (`atRoom`, re-checked every 2 s): scrolling straight to the shop loads 3.4 instead of 6.2 MB in 10 s;
  resize handled at most once a frame and only when the stage size or dpr changed (phones fire resize while the
  address bar moves); azur-sand.webp (lossless, 19 KB) instead of the PNG (33 KB; the PNG stays unused in the theme).
- Left as is: the idle jersey sway redraws the room at ~30 fps (a design choice; it stops while covered, offscreen, in
  the product view or the magazine); code splitting (36 KB Brotli for the whole room is small).

## Runde 20 (owner 2026-10-23: the fall again, as a gradient)
The owner published Runde 19 (MAIN = "Azur Zimmer Runde 19 (Entwurf)" 210037637459) and deleted old drafts (15 themes).
New draft "Azur Zimmer Runde 20 (Entwurf)" `gid://shopify/OnlineStoreTheme/210046550355` (copy of MAIN). Preview:
https://azurclothing.com/?preview_theme_id=210046550355
- Owner on Runde 19's fall: no real room at the jerseys (back to plain white as before), the room must not zoom, the
  sandy top part was too high and too harsh, black jumped to grey with two visible lines; the change may take longer
  (scrolling 1-3 times is fine: leave the room, go through the floor, come out at the jerseys).
- Built (commit 01997e2): room sticky, no zoom or veil; `.azur-fall` = `__dust` (140 px, soft grains from
  tools/make_sand.py -> assets/azur-sand.png 512x140, over a light black wash) + `__grad` (115svh: black for 22 %, then
  20 eased stops in perceptual lightness to white, one element so no seams, grain fading out by 90 %). No catch-up
  speed, no white room, no card overlap or shadows. bindScrollAway: azur-diving on any scroll, azur-light at 62 % of the
  gradient under the header, azur-past when its white end passes the header, no drawing once it covers the window.
- Checked in the harness on desktop, iPad and phone (10 scroll steps each): no errors.
- Owner, second look: the start must be lower and less harsh, and it was not fully black (the grain over the black,
  screen blend, lifted it to dark grey); the length is good. Commit 2bfede3: sand edge 80 px (a smooth wash does the
  darkening, grains faint, make_sand.py 512x80), black now 35 % of the gradient and without grain (measured 0,0,0),
  grain only in the grey (45-90 %), the gradient 60 px taller so the total stays the same; azur-light at 70 %.
- Owner, third look: black should go further down, top and bottom equally short (the change to white was too long),
  and the room should move like a camera going down in the room, hitting the black plane and going under. Commit
  47e9269: bindScrollAway slides .azur-world up at half the scroll speed (style.translate, no zoom; not with reduced
  motion; stops while the plane covers the room), the plane comes at full speed; the gradient is black until 120 px
  before its end (one fully black screen), then 12 eased stops to white in 120 px (grain only there); total unchanged.
  azur-light when the header's middle is within the last 60 px.
- Owner, fourth look ("viel besser"): more camera, and the sandy harshness of the top edge also at the bottom. Commit
  e1cca1d: the room slides up at 0.6 of the scroll and gets depth: `this.scrollPar` (0 -> 0.06 over one screen) is
  added to the compositor's vertical parallax in frame(), so near things (floor, bed, rail) lift more than the wall;
  the plane is now dust (80 px) + plain black (115svh - 20 px) + the same dust mirrored over white
  (`.azur-fall__dust--end`, scaleY(-1), texture shifted); total unchanged. The room's white dots hide while scrolling.
- Owner, fifth look: it lagged, even more camera, and black still showed above the jerseys. Commit 20ebe50: the
  room's slide is a CSS scroll-driven animation (`azur-cam`, animation-timeline: scroll(root), range 0-100vh,
  translate 0 -> -75vh) where supported (Chrome, Edge, Safari 26), the script moves it only elsewhere; the scroll
  handler only compares scrollY with offsets measured on load/resize (no layout reads while scrolling); frame()
  reads scrollY for the depth (CAM_DEPTH 0.1, was 0.06) and skips placing the hidden hints/dots while diving;
  black 105svh, then the mirrored edge and 30svh white (`.azur-fall__white`) before the jerseys.

## Runde 19 (owner 2026-10-23: through the floor into a white room, city page, the room's product view everywhere)
The owner published Runde 18 (MAIN = "Azur Zimmer Runde 18 (Entwurf)" 209996054867). New draft "Azur Zimmer Runde 19
(Entwurf)" `gid://shopify/OnlineStoreTheme/210037637459` (copy of MAIN). Preview:
https://azurclothing.com/?preview_theme_id=210037637459 . The store now has 20 themes (Shopify's limit): before the next
copy the owner has to delete old drafts in the admin (theme deletion is blocked for us).
- Owner: the gradient took too long; it should feel like falling through the floor into a new, all white room ("zeig mir
  mal eine Vorschau, dann fixe ich nach und nach"). Built (commit 514d8a5, azur-room.liquid + azur-app.js bindScrollAway):
  the room stays (sticky) and the camera dives to the floor (`--azur-dive` on #azur: .azur-world scales 1 -> 2.5 toward 90 %
  height, a black veil to .75); `.azur-fall` comes up faster than the page scrolls (margin -45svh, translate eased by
  `--azur-fall`), so the fall is ~0.55 screen + 220 px grains (azur-sand.png at 768x220) + 28svh black slab (faint layers,
  grain); then `.azur-fall__room`, a white room in one-point perspective (ceiling with a lamp, side walls, back wall,
  floor; `--bx/--bt/--bb`, narrower on phones) that settles as it arrives (`--azur-land`, scale 1.25 -> 1); the cards
  section is pulled up 58svh so the cards stand in it (soft floor shadows). html.azur-diving hides the room's hints/chips,
  azur-light over the white room, azur-past once it is 30 % past; the room stops drawing while the slab covers it.
- Owner: city jerseys back, but on their own page, separate from the country jerseys (commit 5bb1325):
  main-collection shows the "Städte" collection's own jerseys (setting `hide`, default staedtetrikots; the other pages
  still leave them out), a "Länder · Städte" switch on top (setting `countries`, default nationaltrikots); azur-cards
  (homepage) has a link "Städtetrikots →" under the grid (settings `more`, `more_label`). Two cards sit centred.
- Owner: clicking a jersey outside the room must be exactly like in the room (commit a0379d5): homepage cards open the
  room's own view (A.app.shop; the bar stays hidden while it is open); shop/city pages load assets/azur-pdp.js
  (azur-config.js + azur-shop.js + prototype/js/azur-pdp.js, built by build_theme.py) with the page's jerseys from
  snippets/azur-pdp-setup.liquid / azur-pdp-item.liquid (tone from "Produkt-Codes", fit from custom.fit or the room's
  defaults); the product page opens that view as the page (old page hidden under it, shown after 4 s without JS),
  closing goes back or to the jersey's collection. azur-shop.js open(product, rect, from): "Schließen" instead of
  "Zurück ins Zimmer", no room moves outside the room. The Runde 17 product-page extras (notes, gallery, spinning
  plus) are no longer visible (the page is the room's view now); they are still in main-product.liquid.
- Checked in the harness: desktop + phone, fall at 10 steps, shop/city/product/homepage clicks, add to cart opens the
  drawer, close/Escape, product page closes back to the shop: no errors.
- Store data: the collection "Städtetrikots" was not published to the Onlineshop (its page 404'd and Liquid could not see
  it); published it 2026-10-23 (publishablePublish, Onlineshop). Until Runde 19 is published, the live Runde 18 theme
  shows "Hier ist gerade nichts" on that page (its shop hides the city collection everywhere).

## Runde 18 (owner 2026-10-23: a new scroll transition, "ich schau es mir erstmal an")
Draft theme "Azur Zimmer Runde 18 (Entwurf)" `gid://shopify/OnlineStoreTheme/209996054867` (copy of the unpublished Runde 17
draft, so Runde 17 keeps the neon-logo transition for comparison; MAIN is still Runde 16). Preview:
https://azurclothing.com/?preview_theme_id=209996054867
- Owner: scrolling down, a black gradient appears that starts sandy, gets lighter downwards to white, then the shop.
- Built (commit ac26e00): the room stays sticky; after it in azur-room.liquid a `.azur-fade` slides up over it:
  `__sand` 360 px of black grains thinning upwards (assets/azur-sand.png, 512x180 shown at 2x, pixelated), then `__grad`
  110svh black -> white with a light grain (screen blend) in its dark half; the cards follow directly. The neon flight, the
  200svh section and the cards overlap of Runde 17 are gone.
- azur-app.js bindScrollAway: html.azur-light (dark header type) once the gradient under the header is lighter than ~45 %,
  html.azur-past (solid header) when the white end passes the header, html.azur-away + no drawing while the gradient fully
  covers the window (also hides the phones' fixed hint/labels, which otherwise stayed over the shop).
- Checked in the harness on desktop and phone at 8 scroll steps: no errors.

## Runde 17 (owner 2026-10-23: the winners of the design rounds r6/r7 built in)
Draft theme "Azur Zimmer Runde 17 (Entwurf)" `gid://shopify/OnlineStoreTheme/209994580307` (copy of MAIN = Runde 16, which the
owner published). Preview: https://azurclothing.com/?preview_theme_id=209994580307
- r7 votes: Übergang U48 (neon logo flies top left), Hinweise H09 (blueprint), Anordnung A13 (podium), Größenwahl Z21 (as is),
  Tasche T21 + T22 + T28 yes (no star): built T21 = the black 3D bag, the white one over the room (so T22 is in too).
  From r6: Karte K01 (fine line), Größe G02 (small), Plus X02 (spins, shows the number), Logo L01 (as is).
- Grid (homepage + shop, snippets/product-card.liquid): FIFA-shaped card in a fine black line (path as in the swipe mock),
  code top left (BRA/GER/TUR from "Produkt-Codes"), jersey, name over a rule, the available sizes; card max 16.5rem; from
  48em three per row and the middle one of each row 3rem higher (podium).
- Product page: "+" spins away into a black disc with the quantity of that size in the cart (data-qty from /cart/add.js),
  the drawer slides in 0.75 s later. Notes ("Hinweise am Trikot", a textarea of the product section: handle | x % | y % |
  title | text, defaults for the three national jerseys measured on the real 1200 px front photos): grey lines from
  notes left/right to the spots on the first (front) image, positioned in the square image with container units;
  phones: numbered dots + a list under the gallery. Texts only what the photos/alt texts show (embroidered per alt text).
- Transition (azur-app.js bindScrollAway + azur-room.liquid CSS): the room's section is 200svh, the room sticky; over one
  screen it goes dark, the neon AZUR (paper logo with a cyan glow) stays large, then white and the ink signature flies into
  the header logo's place; the cards section overlaps by 40svh so the jerseys rise during the second half. html classes
  azur-moving / azur-light / azur-past (azur.js makes the header solid on azur-past, event `azur-hero`). Reduced motion: off.
- Cart icon: assets/azur-bag-ink.webp / azur-bag-paper.webp (from azur/design/render_bag.py), shown like the logos
  (paper over the room); the old sportbag SVG and its CSS are gone.
- Checked in the harness: desktop/iPad/phone, homepage transition at 0/30/55/80/100/140 % on desktop and phone, product
  page plus + drawer, notes on desktop and phone, shop page, room product view and adding from the room: no errors.

## Runde 16 (owner 2026-10-23: the room's product view)
Draft theme "Azur Zimmer Runde 16 (Entwurf)" `gid://shopify/OnlineStoreTheme/209988976979` (copy of MAIN = Runde 15, which the
owner published). Preview: https://azurclothing.com/?preview_theme_id=209988976979
- Owner's r6 votes (all 154 cards, no stars): Übergang U32 wordmask, U33 banner, U47 split3, U48 logoshrink; Logo L01 (as is);
  Karte K01 line; Anordnung A01 (row as is), A13 podium; Größe G02 small; Hinweise H02 text, H03 elbow, H08 sides, H09
  blueprint; Plus X02 spin; Größenwahl and Tasche: all no. Not built in yet (asked the owner: tie-break or my pick; a new
  round for size picker and bag).
- Room product view (prototype/js/azur-shop.js, css/azur-room.css, rebuilt into the theme): background, text and button in
  the jersey's colours (`--tone-<key>`, `-ink`, `-acc`, `-acc-ink` in azur.css replace the faint `--tint-*`; fallbacks in
  azur-room.css for the prototype); the flat shop photo large in the middle instead of the 3D model (it looked crumpled;
  azur-viewer.js deleted, the GLBs in prototype/assets/scene3/models are no longer used by the web); the name smaller
  (max 120 px desktop, 72 px phone) and above the jersey instead of behind it; less text (no path, size hint, care line,
  back link, "Noch niemand aufgestellt", name in the buy bar); the room section's "Pflegehinweis" setting is gone.
  Checked in the harness on desktop, iPad and phone (all five jerseys, no errors), adding from the room opens the drawer.
- Swipe round r7 (artifact v9 of https://claude.ai/artifact/ASxoX7hgSL2FbYLiFxcajH, votes `votes/<uid>.r7`): tie-break
  ("Stechen", per deck now: -1 out, 1 in this pass, 2 winner, `pass_<deck>`) on the r6 yes cards with their r6 ids (Übergang
  U32/U33/U47/U48, Hinweise H02/H03/H08/H09, Anordnung A01/A13); new decks numbered from 21: Größenwahl Z21-Z32 (the plain
  row S M L XL with a small football detail: ball/spot/centre circle/goal/back-number type/scoreboard/chalk/back line/big
  number/pass, `azur/design/r7.js`) and Tasche T21-T32 (six real 3D renders from Blender, `azur/design/render_bag.py`:
  barrel duffle, flat bottom, handles anchored front and back, end panels by material, Azur signature shrink-wrapped on
  the side, shadow catcher; plus six drawings of the same shape). Over the room the dark bags are shown in white.

## Runde 15 (owner 2026-10-21 night, 11 points; worked through the night, hourly self check-in `trig_01D2dJhLJ4L4axHkqu5PPaNi`)
Draft theme "Azur Zimmer Runde 15 (Entwurf)" `gid://shopify/OnlineStoreTheme/209879302483` (copy of MAIN = Runde 14, which
the owner published). Preview: https://azurclothing.com/?preview_theme_id=209879302483
- Done in the theme (commit cceab26): 1. STADT / LAND gone from the header (logo left, bag right); 3. city jerseys out of
  the homepage grid (index.json) and the shop page (main-collection hides the collection in its "Ausblenden" setting,
  empty = Städtetrikots); the "Nächster Drop" field removed (markup, settings, CSS, JS).
- Open, ask the owner: the two city jerseys still exist as products (direct links, search) and hang in the room render
  (clickable there; hiding them needs a PC re-render, the room maps hangers by index). Set them to draft in the admin?
- **Reminder for later (owner, point 9): the model photos will show kids standing on grass. On the plain white site that
  green will stand out strongly; plan the product/model photo areas for it, but only bring it up once those photos
  arrive and it becomes relevant.**
- Swipe round published 2026-10-22 night: artifact v8 of https://claude.ai/artifact/ASxoX7hgSL2FbYLiFxcajH (same db, votes
  `votes/<uid>.r6`, -1 no / 1 yes / 2 star; the owner votes alone). Code: `azur/design/swipe.html` (tool, no more r2-r5
  scripts), `r6-base.js` (Yeezy-style shop pieces), `r6-uber.js`, `r6-shop.js`, `r6-pdp.js`. 144 cards in 9 decks:
  - Übergang U01-U50: room -> shop, each a CSS function of `--p` (0 room, 1 shop) that plays by itself (5.6 s loop), with a
    slider and the mouse wheel to scrub; in the theme `--p` would be the scroll progress over a sticky room. Pieces that cut
    the room (doors, slices, blinds, tiles, pixels, touchline, three columns) need a still of the room at scroll start.
    Ideas from recent.design: Thumbnail Grid Transition (slices), Astro Dither (dot raster).
  - Logo L01-L13 (position/size, each with a strip of the same header over the room), Karte K01-K16 (FIFA-style card frames,
    300 x 420, shield path in `FC_PATH`; K08 puts the dialling code +55/+49/+90 where FIFA has the rating), Anordnung
    A01-A15 (6 row orders, 3 triangles 2 over 1, 3 triangles 1 over 2, podium, zigzag, big middle), Größe G01-G08 (row
    170-400 px, triangle 220-340 px).
  - Hinweise H01-H12: the owner's drawing (boxes around the jersey with lines to collar, signature, crest, fabric; loupe
    crops of the product image). Texts are placeholders read off the Brasilien image; in the theme they should come from
    product metafields the owner fills in.
  - Größenwahl Z01-Z14 (clickable in the mock, cycles by itself), Tasche T01-T12 (3/4-view duffle bag SVG `duf6()` with
    end cap, seams, zipper, two handles; real size, large, and over the room), Plus X01-X14 (cursor clicks the "+" in a
    4.4 s loop, bag count goes to 1).
- Tests (local, `?sheet=<deck>&p=<0..1>[&live=1]` shows a whole deck at once): no console errors, swipe/undo/scrub/size
  click work on desktop 1440 and phone 390, no horizontal scroll (the host adds the viewport meta; local tests inject it).
- Next: read the owner's r6 votes with ArtifactData (`votes` collection), build the winners into a new draft.

## Round 13 (the shop in the style of yeezy.com, 2026-10-21)
Draft "Azur Zimmer Runde 14 (Entwurf)" `gid://shopify/OnlineStoreTheme/209876386131`, preview
https://azurclothing.com/?preview_theme_id=209876386131 (the owner published Runde 13 = sports bag + drop card; this is the
copy of it with the changes below, md5 checked). The owner sent two screenshots of yeezy.com (the site
itself blocks our requests) and asked for it 1:1 on the shop, not in the room. Owner's answers: grid instead of the player cards,
STADT / LAND in the middle, logo and bar kept small, the sports bag stays (small, black).
- Palette: white #fff, black text, grey #767676 / #c4c4c4 (unselected menu word), black buy; the dark set (--d-*, --d-paper)
  keeps the room, its product view (now in the dark-scope list) and the password page Anthrazit & Neon.
- Type: Martian Mono everywhere in the shop (self-hosted asset, @font-face + preload in layout/theme.liquid), small, quiet
  capitals; Archivo only in the room.
- Header: logo left (home), STADT (staedtetrikots) / LAND (nationaltrikots; header settings city/land) centred, the selected one
  black and the other grey (also on a product of that collection), sports bag right. Menu button, search, account, Support
  popover gone (all in the footer).
- Home grid (sections/azur-cards.liquid, name kept so the homepage keeps it) and shop page (main-collection): product-card
  = jersey free on white + name only, 3 / 2 / 1 per row; sixth field "Nächster Drop" (<details>, dashed jersey, sign-up opens
  below; opens again after Shopify's reload). Size filter, lineup sizes, player cards, flip, big-view dialog, flap headings removed.
- Product page: one centred image with ‹ › (wraps) and dots, then name, price, sizes as plain words, "+" (sr label "In den
  Warenkorb", ✓ when added), shipping/returns small; facts and description below. Sticky phone buy bar removed.
- Dead code removed: menu/filter/buybar/cards/jbox/flap JS, header/menu/support/card/filter CSS.

## Round 12 (one site, neutral colour vote, static bar, bed fix, bigger cards, 2026-10-21)
Draft theme "Azur Zimmer Runde 12 (Entwurf)" `gid://shopify/OnlineStoreTheme/209835884883` (copy of MAIN = Runde 10, which the
owner published). Preview: https://azurclothing.com/?preview_theme_id=209835884883
- Colour vote (8 neutral palettes, swipe page, now deleted): the owner liked only "Anthrazit & Neon" (paper #1c1d1f, surface
  #242628, plate #2c2e31, ink #f1eee8, accent stays #39ff88). It is the one token block at the top of assets/azur.css
  (incl. --c-scheme, --logo-ink/--logo-paper, the dark set --c-deep/--d-*); theme-color meta #1c1d1f.
- Tokens: every colour of shop and room comes from that block; dark areas (password page, dark sections, the room) remap the
  tokens to the dark set (`:is(.campaign--dark, .template-password, .drops--dark)`); the room's overlays use --u-* = theme tokens.
- One site: the shop's header lies over the room (transparent, light text; solid while the room's product view is open, which
  now opens under the header, z 45); the room's bag, dots and menu are gone (only the sound switch, under the header); one type
  family (Martian Mono dropped, Caveat only for the signature inside ANSTOSS); square buttons and label type as in the shop.
- Logo: header and footer render both signatures, the palette shows one (it was invisible on shop and product pages: no way
  home). Shop page: "← Zurück zur Startseite"; product crumbs start with "Startseite".
- Bar: static, "14 Tage kostenlose Rückgabe · Versand ab 90 € kostenlos" (section default; marquee JS/CSS removed).
- §19 note: gone next to the price (product page, room product view, which wrongly said "inkl. MwSt."); stays in footer and cart.
  Checkout and order mail: admin steps (no API), see the chat of 2026-10-21.
- Sign-up (snippets/signup-form.liquid, used in footer, password page, drops page): visible label, field and button the same
  height, error under the field (client check in azur.js + Shopify's), success box with a tick; footer teaser image off.
- Bed: in the bed view the bed is a target again (glow, pointer, click opens ANSTOSS; no dot there, the label shows at the
  magazine's dot). Cause: config.targets.bed lacked 'bed'.
- Jersey tint: --tint-ffm/ber/bra/ger/tur; [data-tone] mixes 12 % of the greyed colour into the background (room product view,
  product page, turned card).
- Cards: 1 per row on phones, 2 from 480 px (iPad), 3 from 1200 px, card max 22 rem; a click on an empty spot of the back turns
  it over; magnifier + "Groß ansehen" open a dialog (front/back, ×, Esc, click beside). Pitch next to the jersey, 360 px, 64 px players.
- The owner published Runde 12 (now MAIN) and deleted old drafts (rounds 4-8). The follow-up below is in the new draft
  "Azur Zimmer Runde 13 (Entwurf)" `gid://shopify/OnlineStoreTheme/209841750355`
  (preview https://azurclothing.com/?preview_theme_id=209841750355), md5 checked.
- Follow-up (owner): cart icon = the room's old sports bag, in the header on every page (count as a neon dot, bump on add);
  sixth card "Nächster Drop" (dark card, dashed jersey with "?", back = sign-up; opens on its back after Shopify's reload),
  so desktop shows 3+3; cards up to 26 rem, larger type (name ~31 px on desktop, code, meta, price, back).
- Harness: real header/footer, /collections/trikots, /products/<handle>, ?signup=ok|error, ?palette=creme|anthrazit
  (azur/tools/theme_pages.py); the live snippets the pages need are now in azur/theme/snippets (unchanged copies).

## Round 11 (smoother, bar only in the shop, ideas from basement.studio, 2026-10-20)
- Marquee bar: on the homepage with the room it no longer sits above the room (the room fills the whole screen). It slides
  down under the header once the header turns solid (the shop starts) and only runs then (CSS in sections/azur-room.liquid,
  keyed on `.header--overlay.is-solid`; without JS it stays in the flow as before). Restyled dark with a hairline and
  accent text.
- Smoothness (azur-app.js): the light check once a second only redraws when a quantized light signature changes; no more
  idle drift on phones (the room swayed by itself and redrew ~16x a second); the room counts as offscreen below 15%
  visible (it kept drawing as a strip behind the header); phones draw at 1.5x pixel ratio at most (`dpr()`); the rail's
  pendulums count as resting below sub-pixel motion. Measured in the harness (swiftshader): phone idle renders 82 -> 17
  per 5 s, phone scroll p95 frame 483 -> 67 ms, renders behind the shop 60 -> 0 per 3 s; desktop scroll p95 483 -> 300 ms.
- Player cards: hairline grid cells with a number (01..10), superscript count after the heading, hover shadow as its own
  layer that only fades (no filter: drop-shadow repaint).
- Dead code: room JS/CSS scan found nothing unused (azur-dot--* are built by string); the duplicate .freeship__bar rule
  was merged.

## Rough timings (this machine: 4 CPU cores, no GPU)

- Preview render 960×540: about 1.5 min (incl. cloth simulation)
- Final render 1920×1080, 256 samples: about 16 min
- Full pass set (about 20–30 renders): 6–8 hours in the background

## How to resume

```bash
pip install bpy==5.0.1 pillow scikit-image imageio-ffmpeg
python3 azur/scene/fetch_assets.py            # Poly Haven assets into azur/.cache/ph
python3 azur/scene/build_room.py -- preview azur/renders/preview.png azur/.cache/azur_room.blend
python3 azur/scene/build_room.py -- final azur/renders/still.png '' A      # 4th arg: camera preset(s), e.g. A,B,F
```

Rendering on the owner's machines (estimates from Blender Open Data medians vs. tonight's cloud timings):
- PC: Ryzen 7 5800X + Radeon RX 6750 XT 12 GB (HIP): **measured 2026-10-07: rail plate 17.9 s (cloud CPU 545 s, about 30x)**.
  Full re-render of tonight's set would take about 20-25 min there. Set up and working (owner's PowerShell, private git identity).
  `powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 [all|moves|queue]` (needs Git for Windows
  and a current AMD driver; untested so far). Preferred: private machine, so the GitHub login works.
- MacBook Air M5 (Metal, fanless, throttles under long load): full re-render ~60-90 min. `sh azur/tools/render_on_mac.sh`.
  Its git is tied to a work account, uploads failed on 2026-10-07.
- Cloud (4 Xeon vCPU, no GPU): full re-render ~8 h.
Both scripts install everything on the first run, render with `AZUR_GPU=1`, skip finished outputs and commit/push like
the cloud queue. Never render the same job on two machines at once. A local machine rebuilds the scene itself; the cloth
(duvet, scarf) may differ very slightly from the cloud build, so re-render whole views or whole move sets there.

Local test of the prototype: `cd azur/prototype && python3 -m http.server 8765`, then `sh azur/tools/mkdev.sh` wraps index.html into `_dev.html`; run Chromium with `--no-proxy-server`.

Headless Chromium tests run against local servers only (`--no-proxy-server`); never skip certificate checks to
reach outside pages.
