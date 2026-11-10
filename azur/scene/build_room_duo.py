# AZUR bedroom, Runde 34 "duo": the live room (build_room.py) with only Brasilien and Deutschland on a shorter rail,
# plus the covered "Nächster Drop" bag. The jerseys get more surface detail: a relief map taken from the owner's
# photos (jacquard leaves, raised pattern, print edges catch the light), on top of the knit normal map.
#
# build_room.py stays untouched: this script reads it, swaps a few lines (each must match exactly once, so a changed
# original fails loudly instead of silently), runs the build, then lights and renders one golden-hour still per view.
#
# Usage: python scene/build_room_duo.py -- <preview|final> <out_dir> [views=room,rail] [save.blend]
# Needs the bpy module (Blender 5.x) with numpy, pillow and scipy, and the Poly Haven assets (scene/fetch_assets.py).
import os, sys, math, time

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['preview', os.path.join(HERE, '..', 'renders', 'duo')]
MODE, OUT_DIR = argv[0], argv[1]
VIEW_KEYS = (argv[2] if len(argv) > 2 else 'room,rail').split(',')
BLEND = argv[3] if len(argv) > 3 else None

RAIL_X0, RAIL_X1 = 1.04, 2.70                 # was 0.76 .. 2.76 for five jerseys
XS = [1.30, 1.85, 2.42]                       # Brasilien, Deutschland, drop bag (hook x on the bar)
CENTRE = (1.86, 2.95, 1.22)                   # middle of the garments: spot aim and focus

SWAPS = [
    ("JERSEYS = ['frankfurt', 'berlin', 'brasilien', 'deutschland', 'tuerkei']",
     "JERSEYS = ['brasilien', 'deutschland']"),
    ("RAIL = dict(x0=0.76, x1=2.76,", f"RAIL = dict(x0={RAIL_X0}, x1={RAIL_X1},"),
    ("FAN = math.radians(25)", "FAN = math.radians(18)"),        # with two shirts each one turns more toward the room
    ("xs = [x_first + i * step for i in range(len(JERSEYS))] + [x_bag]", f"xs = {XS!r}"),
]
STOP = "if BLEND: bpy.ops.wm.save_as_mainfile(filepath=BLEND)"   # build only: lights and render are done below

src = open(os.path.join(HERE, 'build_room.py'), encoding='utf-8').read()
for old, new in SWAPS:
    n = src.count(old)
    if n != 1: raise SystemExit(f'build_room.py changed: expected one "{old}", found {n}')
    src = src.replace(old, new)
if src.count(STOP) != 1: raise SystemExit('build_room.py changed: no single save line')
src = src[:src.index(STOP)]

G = {'__file__': os.path.join(HERE, 'build_room.py'), '__name__': 'build_room'}
sys.path.insert(0, HERE)
sys.argv = [sys.argv[0], '--', 'preview', os.devnull]       # what build_room.py reads (its own render part is cut off)
t0 = time.time()
exec(compile(src, G['__file__'], 'exec'), G)
print('BUILD_SECONDS', round(time.time() - t0, 1), flush=True)

import bpy
from mathutils import Vector
sc = bpy.context.scene


# ---------------------------------------------------------------- jersey relief from the photos
def relief_map(src_png, dst_png, sigma=18.0):
    """High-pass luminance of the photo as a height map: the fabric's own pattern, without the big light gradients."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    a = np.asarray(Image.open(src_png).convert('RGB'), dtype=np.float32) / 255.0
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    fine = lum - ndimage.gaussian_filter(lum, sigma)                  # weave, jacquard leaves, raised pattern
    s = float(np.percentile(np.abs(fine), 99.5)) + 1e-6
    h = np.clip(0.5 + 0.5 * fine / s, 0.0, 1.0)
    Image.fromarray((h * 65535).astype(np.uint16)).save(dst_png)
    return dst_png


def add_relief(o, strength=0.55, distance=0.0012):
    for m in o.data.materials:
        nt = m.node_tree; N = nt.nodes; L = nt.links; b = N['Principled BSDF']
        col = next(l.from_node for l in nt.links if l.to_socket == b.inputs['Base Color'])
        path = bpy.path.abspath(col.image.filepath)
        dst = relief_map(path, path[:-4] + '_relief.png')
        hi = N.new('ShaderNodeTexImage'); hi.image = bpy.data.images.load(dst, check_existing=True)
        hi.image.colorspace_settings.name = 'Non-Color'; hi.interpolation = 'Cubic'; hi.extension = 'EXTEND'
        bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = strength; bump.inputs['Distance'].default_value = distance
        L.new(hi.outputs['Color'], bump.inputs['Height'])
        knit = next((l.from_socket for l in nt.links if l.to_socket == b.inputs['Normal']), None)
        if knit: L.new(knit, bump.inputs['Normal'])
        L.new(bump.outputs['Normal'], b.inputs['Normal'])
        # polyester: a touch smoother and with a faint sheen along the folds
        b.inputs['Roughness'].default_value = 0.55; b.inputs['Sheen Weight'].default_value = 0.45
        print('relief', o.name, m.name, os.path.basename(dst), flush=True)


for o in [o for o in bpy.data.objects if o.type == 'MESH' and o.name in ('jersey_brasilien', 'jersey_deutschland')]:
    add_relief(o)

# ---------------------------------------------------------------- extra lights (as render_queue.open_scene adds them)
L = bpy.data.lights.new('L_spot', 'SPOT'); L.energy = 60.0; L.spot_size = math.radians(72); L.spot_blend = 0.85; L.shadow_soft_size = 0.05
spot = bpy.data.objects.new('L_spot', L); sc.collection.objects.link(spot)
can = bpy.data.objects['spot_can']; c = sum((can.matrix_world @ Vector(v) for v in can.bound_box), Vector()) / 8
aim = Vector(CENTRE); spot.location = c + (aim - c).normalized() * 0.1
spot.rotation_euler = (aim - c).to_track_quat('-Z', 'Y').to_euler()


# ---------------------------------------------------------------- the time of day: 'day' (golden hour, as the beauty plates)
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
spot.data.energy = 22.0; spot.data.color = (1.0, 0.93, 0.84)          # a soft warm spot on the rail, the sun does the rest

# ---------------------------------------------------------------- render settings and views
cy = sc.cycles; r = sc.render
cy.device = 'CPU'; cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'; cy.denoising_prefilter = 'ACCURATE'
try: cy.denoising_quality = 'HIGH'
except Exception: pass
cy.max_bounces = 12; cy.diffuse_bounces = 8; cy.glossy_bounces = 6; cy.transmission_bounces = 10; cy.blur_glossy = 0.2
if MODE == 'final':
    RES, cy.samples, cy.adaptive_threshold, cy.adaptive_min_samples = (1920, 1080), 640, 0.006, 64
else:
    RES, cy.samples, cy.adaptive_threshold = (960, 540), 64, 0.03
r.resolution_x, r.resolution_y = RES; r.resolution_percentage = 100
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGB'; r.image_settings.color_depth = '8'
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
sc.view_settings.exposure = 2.65

VIEWS = {
    'room': dict(loc=(2.1, 0.0, 2.15), target=(1.2, 3.1, 0.45), lens=15, fstop=4.0),   # the live site's room plate
    'rail': dict(loc=(1.86, 0.95, 1.36), target=(1.86, 3.6, 1.14), lens=30, fstop=4.0), # closer: the two jerseys
}
cam = sc.camera; cd = cam.data
if BLEND: bpy.ops.wm.save_as_mainfile(filepath=BLEND)
os.makedirs(OUT_DIR, exist_ok=True)
for k in VIEW_KEYS:
    v = VIEWS[k]
    cam.location = v['loc']; cd.lens = v['lens']; cd.sensor_width = 36; cd.sensor_fit = 'AUTO'
    cam.rotation_euler = (Vector(v['target']) - Vector(v['loc'])).to_track_quat('-Z', 'Y').to_euler()
    cd.dof.use_dof = True; cd.dof.aperture_fstop = v['fstop']; cd.dof.focus_distance = (Vector(CENTRE) - Vector(v['loc'])).length
    r.filepath = os.path.join(OUT_DIR, f'{k}_{MODE}.png')
    t1 = time.time(); bpy.ops.render.render(write_still=True)
    print('RENDER_SECONDS', k, round(time.time() - t1, 1), flush=True)
