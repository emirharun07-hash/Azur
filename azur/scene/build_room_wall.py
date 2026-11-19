# AZUR bedroom, scene4 "Wand": the live room (build_room.py) without the garment rail, hangers, drop bag and tag;
# instead three shadow-box frames on the back wall (frame.py): Brasilien and Deutschland laid flat behind museum glass,
# a third, empty and darker frame for the next drop, a blank plaque under each and a ceiling track with one spot each.
# Spec: D1 "AZUR Wand - Spezifikation" (sizes, object names, cameras); operating notes in WAND.md.
#
# build_room.py stays untouched: this script reads it, swaps or cuts a few passages (each must match exactly once, so a
# changed original fails loudly instead of silently), runs the build, moves what the wall displaces, adds the wall.
# The global random stream is drawn exactly as before, so everything built after the rail stays where scene3 has it.
#
# Usage: python scene/build_room_wall.py -- <preview|final|build> <out_dir> [views=rail,room | all] [save.blend]
#   build: build and save the .blend only (default <out_dir>/azur_room_scene4.blend), no render
# Needs the bpy module (Blender 5.x) with numpy, pillow and scipy, and the Poly Haven assets (scene/fetch_assets.py).
import os, sys, math, time
HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['preview', os.path.join(HERE, '..', 'renders', 'wall')]
MODE, OUT_DIR = argv[0], argv[1]
if MODE not in ('preview', 'final', 'build'): raise SystemExit(f'mode must be preview, final or build, not {MODE!r}')
ALL_VIEWS = ('room', 'rail', 'bed', 'rail_m')
VIEW_KEYS = (argv[2] if len(argv) > 2 else 'rail,room').split(',')
if VIEW_KEYS == ['all']: VIEW_KEYS = list(ALL_VIEWS)
BLEND = argv[3] if len(argv) > 3 else (os.path.join(OUT_DIR, 'azur_room_scene4.blend') if MODE == 'build' else None)
NEON_X = 1.45                                  # was 1.76: over the middle frame, its cable clear of the drop frame
MEDAL_HOOK = (2.625, 3.80, 1.44)               # on the shelf's left side, ribbons toward -x (spec z 1.30: the medals
                                               # would reach into the first encyclopedia, which sticks 2.7 cm out of the shelf)
POSTER_AT = (0.0075, 2.86, 1.70)               # the stadium poster goes to the left wall (the jersey poster's place)

SWAPS = [
    ("NEON = dict(x=1.76, z=2.22,", f"NEON = dict(x={NEON_X}, z=2.22,"),
    # the photo collage that is built and thrown away again must draw as before: its hole stays where the sign was
    ("neon_hole = (NEON['x'] - 0.37, NEON['x'] + 0.37, NEON['z'] - 0.17, H)", "neon_hole = (1.76 - 0.37, 1.76 + 0.37, NEON['z'] - 0.17, H)"),
    ("sp = cable.splines.new('BEZIER'); sp.bezier_points.add(2)\n"
     "for i, p in enumerate([(NEON['x'] + 0.28, D - 0.03, NEON['z'] - 0.14), (NEON['x'] + 0.55, D - 0.012, NEON['z'] - 0.5), (NEON['x'] + 0.95, D - 0.006, 0.3)]):",
     "sp = cable.splines.new('BEZIER'); sp.bezier_points.add(3)\n"
     "for i, p in enumerate([(1.73, D - 0.03, 2.08), (2.30, D - 0.012, 2.02), (2.66, D - 0.006, 1.97), (2.66, D - 0.006, 0.30)]):"),
    # the medals: remember what the two calls make, they are moved to the shelf below
    ("medal(RAIL['x0'], RAIL['y'] - 0.016, RAIL['z'] - 0.03, 0.21, (0.06, 0.12, 0.45), 'gold')",
     "_medals0 = set(bpy.data.objects)\nmedal(RAIL['x0'], RAIL['y'] - 0.016, RAIL['z'] - 0.03, 0.21, (0.06, 0.12, 0.45), 'gold')"),
    ("medal(RAIL['x0'] + 0.008, RAIL['y'] - 0.02, RAIL['z'] - 0.035, 0.26, (0.7, 0.05, 0.08), 'silver')",
     "medal(RAIL['x0'] + 0.008, RAIL['y'] - 0.02, RAIL['z'] - 0.035, 0.26, (0.7, 0.05, 0.08), 'silver')\n"
     "MEDALS = [o.name for o in set(bpy.data.objects) - _medals0]"),
]
CUTS = [   # (first line, last line, replacement): the passage from first to last line inclusive
    # the old ceiling spot (the track with three spots replaces it)
    ("# ceiling spot aimed at the rail (lights the jerseys; its light is its own pass, so the prototype can dose it)",
     "cyl('spot_can', Vector(SPOT['loc']) - _d * 0.02, Vector(SPOT['loc']) + _d * 0.09, 0.032, M['rod'], verts=24)", ""),
    # the garment rail (rz, ry, r stay defined)
    ("for x in (RAIL['x0'], RAIL['x1']):\n    cyl('upright',",
     "cyl('bar', (RAIL['x0'] - 0.03, ry, rz), (RAIL['x1'] + 0.03, ry, rz), r, M['chrome'])", ""),
    # jerseys on hangers, the drop bag, its zip, the tag and its string: the only draw from `random` in this passage
    # is hanger()'s one random.uniform per jersey, drawn here the same way
    ("meta = json.load(open(A + '/jerseys/meta.json'))",
     "cyl('string', (tagm @ Vector((0, 0, 0.07))), (mt @ Vector((0.0, -0.02, 0.05))), 0.0008, M['paper'], verts=6)",
     "for _k in JERSEYS: random.uniform(-0.04, 0.04)   # hanger() drew this once per jersey"),
    # the jersey poster shows the real shirt with stripes and crest: it goes (calm() kept it out of the random stream)
    ("# 2 the jersey poster: 5:7 between two wooden hanger rails on a string, left wall above the desk",
     "    cyl('poster_string', (0.013, tcy + side * (TW / 2 - 0.03), tcz + TH / 2 + 0.012), (0.009, tcy, nail[2] - 0.003), 0.0011, M['paper'], verts=6)", ""),
]
STOP = "if BLEND: bpy.ops.wm.save_as_mainfile(filepath=BLEND)"   # build only: the wall, lights and render follow below

src = open(os.path.join(HERE, 'build_room.py'), encoding='utf-8').read()
for old, new in SWAPS:
    n = src.count(old)
    if n != 1: raise SystemExit(f'build_room.py changed: expected one "{old[:90]}", found {n}')
    src = src.replace(old, new)
for first, last, new in CUTS:
    n1, n2 = src.count(first), src.count(last)
    if n1 != 1 or n2 != 1: raise SystemExit(f'build_room.py changed: expected one "{first[:70]}" ({n1}) and one "{last[:70]}" ({n2})')
    i, j = src.index(first), src.index(last) + len(last)
    if j <= i: raise SystemExit(f'build_room.py changed: "{last[:70]}" before "{first[:70]}"')
    src = src[:i] + new + src[j:]
if src.count(STOP) != 1: raise SystemExit('build_room.py changed: no single save line')
src = src[:src.index(STOP)]
G = {'__file__': os.path.join(HERE, 'build_room.py'), '__name__': 'build_room'}
sys.path.insert(0, HERE)
sys.argv = [sys.argv[0], '--', 'preview', os.devnull]       # what build_room.py reads (its own render part is cut off)
t0 = time.time()
exec(compile(src, G['__file__'], 'exec'), G)

import bpy
from mathutils import Vector, Matrix
import frame
sc = bpy.context.scene
bpy.context.view_layer.update()
D = G['D']

# ---------------------------------------------------------------- what the wall displaces
def move(names, T):
    for n in names:
        o = bpy.data.objects[n]; o.matrix_world = T @ o.matrix_world
# stadium poster and its frame parts: back wall (centre x 0.70, z 2.08) -> left wall, turned 90 degrees to face +x
# (the wall point behind the old centre goes to the left wall; the print, 7.5 mm off the wall, lands at POSTER_AT)
T = Matrix.Translation((0.0, POSTER_AT[1], POSTER_AT[2])) @ Matrix.Rotation(math.radians(90), 4, 'Z') @ Matrix.Translation((-0.70, -D, -2.08))
move([o.name for o in bpy.data.objects if o.name == 'poster_stadium' or o.name.startswith('poster_frame_')], T)
# medals: from the rail's upright to a hook on the shelf's left side, turned to face -x
RAIL = G['RAIL']
T = Matrix.Translation((MEDAL_HOOK[0] + 0.016, MEDAL_HOOK[1], MEDAL_HOOK[2])) @ Matrix.Rotation(math.radians(-90), 4, 'Z') \
    @ Matrix.Translation((-RAIL['x0'], -RAIL['y'], -(RAIL['z'] - 0.03)))
move(G['MEDALS'], T)
# the window frame is called frame_b/t/l/r: frame_* now means the wall frames (masks, IDs)
for s in 'btlr':
    if 'frame_' + s in bpy.data.objects: bpy.data.objects['frame_' + s].name = 'window_frame_' + s
# whatever of the rail might be left (nothing should be: the passages are cut): remove by prefix, then make sure
gone = [o.name for o in bpy.data.objects if o.name.startswith(('hook', 'hanger', 'drop_', 'zip', 'tag', 'string', 'jersey_',
        'spot_', 'poster_trikot', 'poster_rail_', 'poster_nail', 'poster_string'))]
for n in gone: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
if gone: print('removed leftovers', gone, flush=True)

# ---------------------------------------------------------------- the wall
KNIT = G['tex_paths']('cotton_jersey')['nor_gl']
made = frame.build_wall(G['A'], knit_normal=KNIT)
bpy.context.view_layer.update()
for o in made.values():
    if 'azur_state' in o: del o['azur_state']
names = {o.name for o in bpy.data.objects}
want = ['picture_track'] + [f'{p}_{k}' for k in frame.KEYS for p in ('frame', 'glass', 'plaque', 'picture_light', 'L_spot')] \
       + [f'jersey_{k}' for k in frame.JERSEY_KEYS]
missing = [n for n in want if n not in names]
stale = [n for n in names if n.startswith(('hook', 'hanger', 'drop_', 'tag', 'string', 'zip'))]
if missing or stale: raise SystemExit(f'wall incomplete: missing {missing}, left over {stale}')
print('BUILD_SECONDS', round(time.time() - t0, 1), flush=True)

# ---------------------------------------------------------------- cameras (spec chapter 3)
VIEWS = {
    'room':   dict(loc=(2.1, 0.0, 2.15), target=(1.2, 3.1, 0.45), lens=15, res=(3200, 1800)),
    'rail':   dict(loc=(1.35, 0.95, 1.42), target=(1.35, 4.0, 1.36), lens=28, res=(3200, 1800)),
    'bed':    dict(loc=(1.55, 0.35, 1.35), target=(0.45, 1.50, 0.48), lens=26, res=(3200, 1800)),
    'rail_m': dict(loc=(1.35, 1.30, 1.38), target=(1.35, 4.0, 1.34), lens=21, res=(1800, 2000), sensor=24, fit='VERTICAL'),
}
FOCUS = (1.35, 3.975, 1.45)
cam = sc.camera; cd = cam.data
def use_view(k, scale=1.0):
    v = VIEWS[k]
    cam.location = v['loc']; cd.lens = v['lens']; cd.sensor_width = v.get('sensor', 36); cd.sensor_fit = v.get('fit', 'AUTO')
    cam.rotation_euler = (Vector(v['target']) - Vector(v['loc'])).to_track_quat('-Z', 'Y').to_euler()
    cd.dof.use_dof = True; cd.dof.aperture_fstop = 4.0; cd.dof.focus_distance = (Vector(FOCUS) - Vector(v['loc'])).length
    sc.render.resolution_x, sc.render.resolution_y = (round(v['res'][0] * scale), round(v['res'][1] * scale))
    sc.render.resolution_percentage = 100
use_view('rail')
if BLEND:
    os.makedirs(os.path.dirname(os.path.abspath(BLEND)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    print('SAVED', BLEND, flush=True)
if MODE == 'build': sys.exit(0)

# ---------------------------------------------------------------- the time of day: 'day' (golden hour, as build_room_duo)
def state_visible(o, state):
    tags = str(o.get('azur_state', '')).split()
    if not tags: return True
    return state in tags or (any(t.startswith('!') for t in tags) and '!' + state not in tags)
for o in bpy.data.objects:
    if 'azur_state' in o: o.hide_render = not state_visible(o, 'day')
w = sc.world.node_tree.nodes
w['Background'].inputs['Strength'].default_value = 2.2
for n in w:
    if n.type == 'MIX': n.inputs[7].default_value = (1.0, 0.86, 0.72, 1)
s = bpy.data.objects['sun']; s.hide_render = False; s.data.energy = 3.0; s.data.color = (1.0, 0.60, 0.33)
s.rotation_euler = Vector((-1.0, 0.22, -0.12)).normalized().to_track_quat('-Z', 'Y').to_euler()
nb = bpy.data.materials['neon_tube'].node_tree.nodes['Principled BSDF']
nb.inputs['Emission Color'].default_value = (0.086, 0.722, 1.0, 1); nb.inputs['Emission Strength'].default_value = 1.6
bpy.data.objects['ceiling_light'].data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0
# the three spots stay at their .blend energies (frame.SPOT_ENERGY): this still shows the 'spot' pass at weight 1

# ---------------------------------------------------------------- render settings
cy = sc.cycles; r = sc.render
cy.device = 'CPU'; cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'; cy.denoising_prefilter = 'ACCURATE'
try: cy.denoising_quality = 'HIGH'
except Exception: pass
cy.max_bounces = 12; cy.diffuse_bounces = 8; cy.glossy_bounces = 6; cy.transmission_bounces = 10; cy.blur_glossy = 0.2
cy.transparent_max_bounces = 16
if MODE == 'final':
    SCALE, cy.samples, cy.adaptive_threshold, cy.adaptive_min_samples = 0.6, 640, 0.006, 64      # 1920 x 1080
else:
    SCALE, cy.samples, cy.adaptive_threshold = 0.3, 64, 0.03                                     # 960 x 540
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGB'; r.image_settings.color_depth = '8'
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
sc.view_settings.exposure = 2.65
os.makedirs(OUT_DIR, exist_ok=True)
for k in VIEW_KEYS:
    use_view(k, SCALE)
    r.filepath = os.path.join(OUT_DIR, f'{k}_{MODE}.png')
    t1 = time.time(); bpy.ops.render.render(write_still=True)
    print('RENDER_SECONDS', k, round(time.time() - t1, 1), flush=True)
