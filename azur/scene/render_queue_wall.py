"""AZUR render queue for the wall (scene4): light passes, depth, hover masks, click IDs, views.json v2 and the
empty-frame variants. The jerseys hang flat in shadow boxes behind glass on the back wall (build_room_wall.py,
frame.py); nothing is taken off a rail any more and nothing swings.

It reuses render_queue.py (import render_queue as rq) and replaces only what the wall changes: set, cameras, the
three picture spots (pass 'spot'), slots from the frames, the groups for masks and IDs, and the variants
(spec D1, chapters 3-6). render_queue.py itself stays as it was: AZUR_SET=scene3 renders the rail as before.

Usage:  python azur/scene/render_queue_wall.py [--push] [--out DIR] [room rail bed rail_m]
        --push    commit every finished output and push it (off by default: nothing goes to git)
        --out     write the views somewhere else (a test set); default azur/prototype/assets/scene4/views
        views     only these views (default all four)
Env:    AZUR_GPU=1            render on the graphics chip, CPU otherwise
        AZUR_QUEUE_FAST=1     test set: 960 px wide (rail_m 540 x 600), 8 samples; default out azur/.cache/queue_test
        AZUR_QUEUE_DRY=1      dry run: everything but bpy.ops.render.render (scene, cameras, visibility, views.json),
                              plus dry_renders.json (what would be rendered) and plan.json (job count, time estimate)
        AZUR_QUEUE_NO_GIT=1   never touch git, even with --push
        AZUR_BLEND            use this .blend instead of azur/.cache/azur_room_scene4.blend
        AZUR_CACHE            Poly Haven downloads (as build_room.py), default azur/.cache/ph
Every job is skipped when its output exists (variants: when passes.json marks them complete), so a stopped run
goes on where it stopped. Nothing here reads azur/render_request.json into a path or a command.
"""
import os, sys, json, time, subprocess
os.environ['AZUR_SET'] = 'scene4'          # before the import: render_queue derives OUT, BLEND, EXR and HI from it
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
import render_queue as rq
import frame                                 # the wall's numbers (sizes, planes); object names are the contract

# ------------------------------------------------------------------ arguments and switches
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
PUSH = '--push' in ARGS
OUT_ARG = None
if '--out' in ARGS:
    i = ARGS.index('--out')
    if i + 1 >= len(ARGS): raise SystemExit('--out needs a folder')
    OUT_ARG = os.path.abspath(ARGS[i + 1]); del ARGS[i:i + 2]
ONLY = [a for a in ARGS if not a.startswith('--')]
FAST = bool(os.environ.get('AZUR_QUEUE_FAST'))
DRY = bool(os.environ.get('AZUR_QUEUE_DRY'))
FAST_SCALE = 0.3                             # 3200 -> 960 px (the test set the browser work builds on)

SET = 'scene4'
OUT = OUT_ARG or (os.path.join(rq.ROOT, '.cache', 'queue_test') if FAST else os.path.join(rq.ROOT, 'prototype', 'assets', SET, 'views'))
BLEND = os.environ.get('AZUR_BLEND') or os.path.join(rq.ROOT, '.cache', f'azur_room_{SET}.blend')
EXR = OUT.rstrip('/\\') + '_exr' if (FAST or OUT_ARG) else os.path.join(rq.ROOT, '.cache', 'exr', SET)
LOG = os.path.join(rq.ROOT, '.cache', 'queue_wall.log')
NO_GIT = bool(os.environ.get('AZUR_QUEUE_NO_GIT')) or not PUSH or DRY or FAST
if PUSH and NO_GIT: print('--push ignored: AZUR_QUEUE_NO_GIT, AZUR_QUEUE_DRY or AZUR_QUEUE_FAST is set', flush=True)
if PUSH and not NO_GIT and os.path.relpath(OUT, rq.REPO).startswith('..'):
    raise SystemExit('--push only for outputs inside the repository (not with --out elsewhere)')
for k in ONLY:
    if k not in ('room', 'rail', 'bed', 'rail_m'): raise SystemExit(f'unknown view {k!r} (room, rail, bed, rail_m)')
if not rq.HI: raise SystemExit('scene4 renders at the high resolution only')

# ------------------------------------------------------------------ views (spec chapter 3)
KEYS = frame.KEYS                            # brasilien, deutschland, drop: slot order, left to right
JERSEY_KEYS = frame.JERSEY_KEYS
VIEWS = {
    'room':   dict(rq.VIEWS['room']),                                              # unchanged
    'rail':   dict(loc=(1.35, 0.95, 1.42), target=(1.35, 4.0, 1.36), lens=28, res=(3200, 1800)),         # "Wand"
    'bed':    dict(rq.VIEWS['bed']),                                               # unchanged
    'rail_m': dict(loc=(1.35, 1.30, 1.38), target=(1.35, 4.0, 1.34), lens=21, res=(1800, 2000), fit='VERTICAL', sensor=24),
}
FOCUS = Vector((1.35, frame.JERSEY_Y, frame.JERSEY_Z))   # depth of field: sharp on the jerseys in the frames
GARMENT_PREFIX = ('jersey_', 'glass_', 'frame_', 'plaque_')
MASK_GROUPS = {
    'bed': rq.MASK_GROUPS['bed'],
    'rail': ('frame_*', 'glass_*', 'jersey_*', 'plaque_*'),     # channel and name stay: G = the wall
    'mag': rq.MASK_GROUPS['mag'],
}
INNER_Y = 3.988                              # plane of the opening in views.json (spec chapter 4)
FLOOR_UNDER_RAIL = (1.35, 3.85, 0.0)
# empty-frame variants (spec chapter 5): which jerseys are taken out
VARIANTS = {'leer_brasilien': ('brasilien',), 'leer_deutschland': ('deutschland',), 'leer_beide': ('brasilien', 'deutschland')}
VARIANT_VIEWS = ('room', 'rail', 'rail_m')
VARIANT_PAD = 12                             # px around the frame's box: the region rendered with a border
VARIANT_RECTS = 2                            # at most this many rectangles per variant

# hand everything over to render_queue: its functions read these module globals when they run
rq.SET, rq.OUT, rq.BLEND, rq.EXR, rq.LOG = SET, OUT, BLEND, EXR, LOG
rq.FAST, rq.NO_GIT, rq.ONLY = FAST, NO_GIT, ONLY
rq.VIEWS, rq.FOCUS, rq.GARMENT_PREFIX, rq.MASK_GROUPS = VIEWS, FOCUS, GARMENT_PREFIX, MASK_GROUPS
log = rq.log


# ------------------------------------------------------------------ dry run: everything but the render itself
class DryRender(Exception):
    pass


DRY_RENDERS = []


def _dry_record(sc, path, job=None):
    r = sc.render
    border = [round(r.border_min_x, 4), round(1 - r.border_max_y, 4), round(r.border_max_x, 4), round(1 - r.border_min_y, 4)] if r.use_border else [0, 0, 1, 1]
    rec = dict(job=job, path=os.path.relpath(path, OUT), res=[r.resolution_x, r.resolution_y], border=border,
               samples=sc.cycles.samples, override=bool(sc.view_layers[0].material_override),
               hidden=sorted(o.name for o in bpy.data.objects if o.name.startswith(('jersey_', 'glass_')) and o.hide_render),
               lights=sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT' and not o.hide_render),
               camera=[round(c, 3) for c in sc.camera.location])
    DRY_RENDERS.append(rec)
    return rec


_rq_render_to = rq.render_to


def render_to(sc, path):
    if DRY:
        _dry_record(sc, path); raise DryRender(path)
    return _rq_render_to(sc, path)


# ------------------------------------------------------------------ scene
def ensure_assets():
    """As render_queue.ensure_assets, but where build_room.py looks for them (AZUR_CACHE)."""
    import fetch_assets as fa
    ph = os.environ.get('AZUR_CACHE', os.path.join(rq.ROOT, '.cache', 'ph'))
    if not os.path.exists(os.path.join(ph, 'tex', 'white_plaster_02', f'white_plaster_02_Diffuse_{fa.TEX_RES}.jpg')) \
       or not os.path.exists(os.path.join(ph, 'models', 'boombox', f'boombox_{fa.MODEL_RES}.gltf')):
        subprocess.run([sys.executable, os.path.join(rq.HERE, 'fetch_assets.py')], check=True)


def ensure_blend():
    ensure_assets()
    if os.path.exists(BLEND): return
    log('building the wall scene (no saved .blend found)')
    out = os.path.dirname(os.path.abspath(BLEND)); os.makedirs(out, exist_ok=True)
    subprocess.run([sys.executable, os.path.join(rq.HERE, 'build_room_wall.py'), '--', 'build', out, 'all', BLEND], check=True)


def spots():
    return [o for o in bpy.data.objects if o.type == 'LIGHT' and o.name.startswith('L_spot')]


_rq_open_scene = rq.open_scene


def open_scene():
    """render_queue's scene setup (desk lamp, street light, ceiling light, visibility); the three picture spots
    L_spot_<key> come with the .blend (build_room_wall.py), nothing is made from the old spot_can."""
    sc = _rq_open_scene()
    have = sorted(o.name for o in spots())
    want = sorted('L_spot_' + k for k in KEYS)
    if have != want: raise SystemExit(f'the .blend is not the wall scene: spots {have}, expected {want}')
    missing = [n for k in KEYS for n in ('frame_' + k, 'glass_' + k, 'plaque_' + k) if n not in bpy.data.objects]
    missing += ['jersey_' + k for k in JERSEY_KEYS if 'jersey_' + k not in bpy.data.objects]
    if missing: raise SystemExit(f'the .blend lacks {missing}')
    return sc


def set_view(sc, key):
    v = VIEWS[key]; cam = sc.camera; cd = cam.data
    cam.location = v['loc']; cd.lens = v['lens']
    cam.rotation_euler = (Vector(v['target']) - Vector(v['loc'])).to_track_quat('-Z', 'Y').to_euler()
    cd.sensor_fit = v.get('fit', 'AUTO')
    if 'sensor' in v: cd.sensor_height = v['sensor']
    else: cd.sensor_width = 36
    cd.dof.focus_distance = (FOCUS - Vector(v['loc'])).length
    rx, ry = v['res']
    if FAST: rx, ry = round(rx * FAST_SCALE), round(ry * FAST_SCALE)
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    sc.render.resolution_percentage = 100


_rq_lights_off, _rq_set_pass = rq.lights_off, rq.set_pass


def lights_off(sc):
    _rq_lights_off(sc)
    for o in spots(): o.hide_render = True


def set_pass(sc, p):
    """render_queue's passes; 'spot' turns on all three picture spots (white, at their .blend energies) and nothing else."""
    if p != 'spot': return _rq_set_pass(sc, p)
    lights_off(sc)
    for o in spots(): o.hide_render = False; o.data.color = (1, 1, 1)


# ------------------------------------------------------------------ slots from the frames (views.json v2)
def bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]


def wall_rects():
    """Per key: outer edge, opening and plaque face as (x0, x1, z0, z1) plus their planes, read from the scene.
    The opening is the pane less its rabbet (frame.py: pane = opening + 5 mm per side, 0.3 mm gap)."""
    out = {}
    for k in KEYS:
        lo, hi = bbox([bpy.data.objects['frame_' + k]])
        glo, ghi = bbox([bpy.data.objects['glass_' + k]])
        plo, phi = bbox([bpy.data.objects['plaque_' + k]])
        g = frame.RABBET - frame.EPS
        out[k] = dict(outer=(lo[0], hi[0], lo[2], hi[2]), outer_y=lo[1],
                      inner=(glo[0] + g, ghi[0] - g, glo[2] + g, ghi[2] - g),
                      plaque=(plo[0], phi[0], plo[2], phi[2]), plaque_y=plo[1])
    return out


def wall_slots(sc, cam, rects=None):
    """The three slots as views.json v2 needs them (spec chapter 4), plus the old fields derived from the opening."""
    rects = rects or wall_rects()

    def uv(p):
        c = world_to_camera_view(sc, cam, Vector(p)); return [round(c.x, 4), round(1 - c.y, 4), round(c.z, 3)]

    def quad(r, y):          # clockwise from the top left as seen from the room
        x0, x1, z0, z1 = r
        return [uv((x0, y, z1))[:2], uv((x1, y, z1))[:2], uv((x1, y, z0))[:2], uv((x0, y, z0))[:2]]
    slots = []
    for k in KEYS:
        R = rects[k]; x0, x1, z0, z1 = R['outer']
        inner = quad(R['inner'], INNER_Y)
        ix0, ix1, iz0, iz1 = R['inner']; mx = (ix0 + ix1) / 2
        top, bottom = uv((mx, INNER_Y, iz1))[:2], uv((mx, INNER_Y, iz0))[:2]
        width = round(((inner[1][0] - inner[0][0]) + (inner[2][0] - inner[3][0])) / 2, 4)
        slots.append(dict(key=k, frame=quad(R['outer'], R['outer_y']), inner=inner, plaque=quad(R['plaque'], R['plaque_y']),
                          depth=uv(((x0 + x1) / 2, frame.JERSEY_Y, (z0 + z1) / 2))[2],
                          hook=top, top=top, bottom=bottom, width=width))
    return slots


def project_slots(sc, cam):
    """render_queue.project_slots for the wall (for a later render_moves): slots and the neon sign."""
    neon = bpy.data.objects['neon_plate']; npt = [neon.matrix_world @ Vector(c) for c in neon.bound_box]
    c = world_to_camera_view(sc, cam, Vector((sum(p.x for p in npt) / 8, min(p.y for p in npt), sum(p.z for p in npt) / 8)))
    return wall_slots(sc, cam), [round(c.x, 4), round(1 - c.y, 4)]


def job_projections(sc):
    """views.json v2: per view res, slots (frame, inner, plaque, depth + the old hook/top/bottom/width), rail,
    floor_under_rail, window, bed, neon, magazine(_night). u, v from the top left, 0..1."""
    path = os.path.join(OUT, 'views.json')
    data = json.load(open(path)) if os.path.exists(path) else {}
    data['version'] = 2
    rects = wall_rects()
    glass = bpy.data.objects['glass']; gp = [glass.matrix_world @ Vector(c) for c in glass.bound_box]
    neon = bpy.data.objects['neon_plate']; npt = [neon.matrix_world @ Vector(c) for c in neon.bound_box]
    mag = bpy.data.objects.get('magazine'); magn = bpy.data.objects.get('magazine_night')
    for key in VIEWS:
        set_view(sc, key); bpy.context.view_layer.update(); cam = sc.camera

        def uv(p):
            c = world_to_camera_view(sc, cam, Vector(p)); return [round(c.x, 4), round(1 - c.y, 4), round(c.z, 3)]
        bl, dr = rects[KEYS[0]], rects[KEYS[-1]]
        bed = [uv((x, y, 0.55)) for x, y in ((0.02, -0.25), (0.98, -0.25), (0.98, 2.03), (0.02, 2.03))]
        data[key] = dict(
            res=list(VIEWS[key]['res']), slots=wall_slots(sc, cam, rects),
            rail=[uv((bl['outer'][0], bl['outer_y'], bl['outer'][3]))[:2], uv((dr['outer'][1], dr['outer_y'], dr['outer'][3]))[:2]],
            window=[uv((min(p.x for p in gp), y, z))[:2] for y, z in ((min(p.y for p in gp), max(p.z for p in gp)), (max(p.y for p in gp), max(p.z for p in gp)),
                                                                      (max(p.y for p in gp), min(p.z for p in gp)), (min(p.y for p in gp), min(p.z for p in gp)))],
            bed=[b[:2] for b in bed],
            neon=uv((sum(p.x for p in npt) / 8, min(p.y for p in npt), sum(p.z for p in npt) / 8))[:2],
            floor_under_rail=uv(FLOOR_UNDER_RAIL)[:2],
        )
        if mag: data[key]['magazine'] = rq.magazine_corners(mag, uv)
        if magn: data[key]['magazine_night'] = rq.magazine_corners(magn, uv)
    os.makedirs(OUT, exist_ok=True)
    json.dump(data, open(path, 'w'), indent=1)
    return [path]


# ------------------------------------------------------------------ groups for IDs and masks
def garment_groups():
    """Per slot (brasilien, deutschland, drop): (None, the objects of that frame). render_queue.job_ids colours
    slot i as (i + 1) * 32; the pane and the plaque count to the slot, so the empty frame stays clickable."""
    groups = []
    for k in KEYS:
        objs = [o for o in bpy.data.objects if o.name == 'frame_' + k or o.name.startswith('frame_' + k + '.')
                or o.name in ('glass_' + k, 'jersey_' + k, 'plaque_' + k)]
        groups.append((None, objs))
    return groups


_rq_job_depth = rq.job_depth


def job_depth(sc, key):
    """render_queue.job_depth without the panes (they would hide the jerseys' depth)."""
    panes = [o for o in bpy.data.objects if o.name.startswith('glass_')]
    saved = [(o, o.hide_render) for o in panes]
    for o in panes: o.hide_render = True
    try: return _rq_job_depth(sc, key)
    finally:
        for o, h in saved: o.hide_render = h


def _gone(*a, **k):
    raise RuntimeError('not part of the wall: nothing is taken off a rail, there is no bag or hanger')


# ------------------------------------------------------------------ empty-frame variants (spec chapter 5)
def px_box(sc, objs):
    """Pixel box (x0, y0, x1, y1 from the top left) of the objects, grown by VARIANT_PAD px; None if out of the frame."""
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    b = rq.frame_box(sc, objs, 0.0)
    if b is None: return None
    return (max(0, int(b[0] * rx) - VARIANT_PAD), max(0, int(b[1] * ry) - VARIANT_PAD),
            min(rx, int(np.ceil(b[2] * rx)) + VARIANT_PAD), min(ry, int(np.ceil(b[3] * ry)) + VARIANT_PAD))


def rects_meet(a, b):
    return any(r[0] < s[2] and s[0] < r[2] and r[1] < s[3] and s[1] < r[3] for r in a for s in b)


def state_region(sc, key, state):
    """The pixel region job_state renders for a state (used when the state is not rendered yet: dry run)."""
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    objs = rq.state_objects(state)
    if any(o.name == 'hall_light_area' for o in objs): return [[0, 0, rx, ry]]
    b = rq.frame_box(sc, objs, 0.12, [rq.SUN[p] for p in rq.STATE_PASSES[state] if p in rq.SUN])
    return [] if b is None else [[int(b[0] * rx), int(b[1] * ry), int(np.ceil(b[2] * rx)), int(np.ceil(b[3] * ry))]]


def variant_states(sc, view, meta, rects):
    """'day' and every state whose patches meet the variant's rectangles (heute: night everywhere, evening in room
    and rail_m): there a state patch shows both jerseys, so the variant needs its own patch in that state's light."""
    out = ['day']
    for st in ('morning', 'evening', 'night'):
        s = meta.get('states', {}).get(view, {}).get(st)
        srects = s['rects'] if s and s.get('complete') else state_region(sc, view, st)
        if rects_meet(rects, srects): out.append(st)
    return out


def hide_jerseys(keys):
    for k in keys: bpy.data.objects['jersey_' + k].hide_render = True


def render_variant_pass(sc, view, keys, state, p, box, exr, job):
    set_view(sc, view); rq.render_settings(sc, 'pass'); rq.restore_visibility()
    if state != 'day': rq.set_state(state)
    hide_jerseys(keys); set_pass(sc, p); rq.neon_quality(sc, p)
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    r = sc.render; r.use_border = True; r.use_crop_to_border = False
    r.border_min_x, r.border_max_x = box[0] / rx, box[2] / rx; r.border_min_y, r.border_max_y = 1 - box[3] / ry, 1 - box[1] / ry
    if DRY:
        _dry_record(sc, exr, job); sc.render.use_border = False; return 0
    tmp = exr.replace('.exr', '_tmp.exr'); secs = _rq_render_to(sc, tmp); os.replace(tmp, exr)
    sc.render.use_border = False
    rq.stop_if_superseded()
    return secs


def diff_rects(changed, X0, Y0, X1, Y1):
    """As job_state: rectangles around what changed (label, pad 12, merge), at most VARIANT_RECTS of them.
    `changed` covers the region X0..X1, Y0..Y1 only; the rectangles come back in picture pixels."""
    from scipy import ndimage as ndi
    union = ndi.binary_opening(changed, iterations=1)
    lab, n = ndi.label(ndi.binary_dilation(union, iterations=14))
    pad = 12
    boxes = [[max(X0, X0 + s_[1].start - pad), max(Y0, Y0 + s_[0].start - pad), min(X1, X0 + s_[1].stop + pad), min(Y1, Y0 + s_[0].stop + pad)]
             for s_ in ndi.find_objects(lab) if s_ is not None and (s_[1].stop - s_[1].start) * (s_[0].stop - s_[0].start) > 400]
    boxes = rq.merge_boxes(boxes, 24); gap = 40
    while len(boxes) > VARIANT_RECTS: boxes = rq.merge_boxes(boxes, gap); gap *= 2
    return [[int(c) for c in b] for b in boxes]


def job_variant(sc, view, name, meta):
    """One empty-frame variant of one view: the jersey(s) hidden, the frame's box (+12 px) rendered for the day
    passes and for every state whose patches meet it, compared with the day pass, the rectangles that differ stored
    as <view>/var_<name>/<state>/<pass>_<n>.webp with the day pass's scale (passes.json 'variants')."""
    keys = VARIANTS[name]
    vs = meta.setdefault('variants', {}).setdefault(view, {})
    if vs.get(name, {}).get('complete'): return None
    mpath = os.path.join(OUT, 'passes.json')
    set_view(sc, view); bpy.context.view_layer.update()
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    groups = dict(zip(KEYS, (objs for _, objs in garment_groups())))
    box = px_box(sc, [o for k in keys for o in groups[k] if o.name.startswith('frame_')])
    entry = dict(keys=list(keys), res=[rx, ry])
    if box is None:
        entry.update(complete=True); vs[name] = entry
        if not DRY: json.dump(meta, open(mpath, 'w'), indent=1)
        log('variant', view, name, 'the frame is not in the picture'); return None if DRY else [mpath]
    e = 10      # the denoiser sees less at the region's edge: patches stay this far inside (as job_state)
    X0, X1 = box[0] + (e if box[0] > 0 else 0), box[2] - (e if box[2] < rx else 0)
    Y0, Y1 = box[1] + (e if box[1] > 0 else 0), box[3] - (e if box[3] < ry else 0)
    edir = os.path.join(EXR, view); os.makedirs(edir, exist_ok=True)
    job = f'variant {view} {name}'
    secs_all = 0
    if DRY:
        for st in variant_states(sc, view, meta, [[X0, Y0, X1, Y1]]):
            for p in (rq.PASSES if st == 'day' else rq.STATE_PASSES[st]):
                render_variant_pass(sc, view, keys, st, p, box, os.path.join(edir, f'var_{name}_{st}_{p}.exr'), job)
        rq.restore_visibility(); log('dry', job, 'region', box); return None
    missing = [p for p in rq.PASSES if p not in meta.get(view, {})]
    if missing: raise RuntimeError(f'{job}: day passes {missing} first')
    from scipy import ndimage as ndi
    # day: what changes against the day pass decides the rectangles
    crops, changed = {}, np.zeros((Y1 - Y0, X1 - X0), bool)
    for p in rq.PASSES:
        exr = os.path.join(edir, f'var_{name}_day_{p}.exr')
        if not os.path.exists(exr): secs_all += render_variant_pass(sc, view, keys, 'day', p, box, exr, job)
        a = rq.read_exr(exr)[Y0:Y1, X0:X1]; b = rq.read_exr(rq.day_exr(sc, view, p, meta))[Y0:Y1, X0:X1]
        scale = meta[view][p]
        d = np.abs(rq.encode_rgb(a, scale).astype(np.int16) - rq.encode_rgb(b, scale).astype(np.int16)).max(-1)
        changed |= ndi.uniform_filter(d.astype(np.float32), 3) > 2.5          # more than ~3 codes: a real change
        crops[p] = a
    rects = diff_rects(changed, X0, Y0, X1, Y1)
    states = variant_states(sc, view, meta, rects) if rects else ['day']
    out = []

    def store(st, renders):
        for p, a in renders.items():
            for i, (x0, y0, x1, y1) in enumerate(rects):
                dst = os.path.join(OUT, view, f'var_{name}', st, f'{p}_{i}.webp')
                rq.save_webp(rq.encode_rgb(a[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0], meta[view][p]), dst, rq.pass_quality(p)); out.append(dst)
        entry[st] = dict(rects=rects, passes=list(renders))
    store('day', crops)
    for st in states[1:]:
        renders = {}
        for p in rq.STATE_PASSES[st]:
            exr = os.path.join(edir, f'var_{name}_{st}_{p}.exr')
            if not os.path.exists(exr): secs_all += render_variant_pass(sc, view, keys, st, p, box, exr, job)
            renders[p] = rq.read_exr(exr)[Y0:Y1, X0:X1]
        store(st, renders)
    entry['complete'] = True; vs[name] = entry
    json.dump(meta, open(mpath, 'w'), indent=1)
    for st in states:
        for p in (rq.PASSES if st == 'day' else rq.STATE_PASSES[st]):
            f = os.path.join(edir, f'var_{name}_{st}_{p}.exr')
            if os.path.exists(f): os.remove(f)
    area = sum((b[2] - b[0]) * (b[3] - b[1]) for b in rects) / (rx * ry)
    log('variant', view, name, len(rects), f'patches, {area:.1%} of the picture,', 'states', states, round(secs_all), 's')
    return out + [mpath]


def job_variants(sc, view, meta):
    """All three variants of one view (spec: job_variants(sc, view))."""
    out = []
    for name in VARIANTS: out += job_variant(sc, view, name, meta) or []
    return out or None


# ------------------------------------------------------------------ plan: how many renders, how long on the PC
PASS_MIN = 40.0                     # minutes per full 3200 px pass on the owner's PC (render_status.json: 25-100)
NEON_FACTOR = 2.4                   # the neon pass (8192 samples): about 100 minutes
SMALL_MIN = {'masks': 1.0, 'ids': 0.5, 'window': 1.0, 'depth': 0.5}      # few samples
BEAUTY_MIN = 40.0


def plan(sc, views):
    """Every render the queue makes, with the share of the picture it covers, and a rough time for the PC."""
    rows = []
    for v in views:
        rows += [('masks', v, 'day', '', 1.0), ('masks', v, 'night', '', 1.0), ('depth', v, 'day', '', 1.0)]
        if v != 'bed': rows += [('ids', v, 'day', '', 1.0), ('window', v, 'day', '', 1.0)]
        rows += [('pass', v, 'day', p, 1.0) for p in rq.PASSES] + [('beauty', v, 'day', '', 1.0)]
    for v in views:
        set_view(sc, v); bpy.context.view_layer.update(); rx, ry = sc.render.resolution_x, sc.render.resolution_y
        for st in ('evening', 'night', 'morning'):
            reg = state_region(sc, v, st)
            f = sum((r[2] - r[0]) * (r[3] - r[1]) for r in reg) / (rx * ry)
            if f > 0: rows += [('state', v, st, p, round(f, 4)) for p in rq.STATE_PASSES[st]]
        if v not in VARIANT_VIEWS: continue
        groups = dict(zip(KEYS, (objs for _, objs in garment_groups())))
        for name, keys in VARIANTS.items():
            box = px_box(sc, [o for k in keys for o in groups[k] if o.name.startswith('frame_')])
            if box is None: continue
            f = (box[2] - box[0]) * (box[3] - box[1]) / (rx * ry)
            for st in variant_states(sc, v, {}, [list(box)]):
                rows += [('variant ' + name, v, st, p, round(f, 4)) for p in (rq.PASSES if st == 'day' else rq.STATE_PASSES[st])]

    def minutes(kind, p, f):
        if kind in SMALL_MIN: return SMALL_MIN[kind]
        if kind == 'beauty': return BEAUTY_MIN
        full = PASS_MIN * (NEON_FACTOR if p == 'neon' else 1.0)
        return full * f + (0.0 if f >= 1 else 1.5)          # a border render still loads the scene (about 1-2 min)
    tot = {}
    for kind, v, st, p, f in rows:
        k = kind.split()[0]; t = tot.setdefault(k, [0, 0.0]); t[0] += 1; t[1] += minutes(kind, p, f)
    return dict(renders=len(rows), hours=round(sum(t[1] for t in tot.values()) / 60, 1),
                by_kind={k: dict(renders=n, hours=round(m / 60, 1)) for k, (n, m) in tot.items()},
                assumptions=f'{PASS_MIN:.0f} min per full pass, neon x{NEON_FACTOR}, beauty {BEAUTY_MIN:.0f} min, border renders by area + 1.5 min',
                rows=[dict(kind=k, view=v, state=s, light=p, share=f) for k, v, s, p, f in rows])


# ------------------------------------------------------------------ hand the wall's functions to render_queue
rq.render_to, rq.ensure_blend, rq.ensure_assets, rq.open_scene, rq.set_view = render_to, ensure_blend, ensure_assets, open_scene, set_view
rq.lights_off, rq.set_pass, rq.garment_groups, rq.project_slots, rq.job_projections = lights_off, set_pass, garment_groups, project_slots, job_projections
rq.job_depth = job_depth
rq.job_bag_sprite = rq.job_hanger_sprite = rq.job_selected = rq.job_beauty_at = rq.pose_garment = _gone


def git_save(paths, message):
    if not NO_GIT: rq.git_save(paths, message)


def main():
    # no hand-over to the watch mode: that would start render_queue.py (scene3) for the current render request
    ensure_blend()
    sc = open_scene()
    meta_path = os.path.join(OUT, 'passes.json')
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    views = [v for v in VIEWS if not ONLY or v in ONLY]
    log('wall queue', SET, 'out', OUT, 'views', views, 'fast' if FAST else 'full', 'dry' if DRY else '', 'git' if not NO_GIT else 'no git')
    jobs = [('projections', lambda: job_projections(sc))]
    # quick ones first (hover and click areas), then the day passes, the fallback stills, the times of day, the variants
    for v in views:
        jobs += [(f'masks {v}', (lambda v=v: rq.job_masks(sc, v))), (f'masks {v} night', (lambda v=v: rq.job_masks(sc, v, 'night')))]
        if v != 'bed': jobs += [(f'ids {v}', (lambda v=v: rq.job_ids(sc, v))), (f'window {v}', (lambda v=v: rq.job_window(sc, v)))]
        jobs += [(f'depth {v}', (lambda v=v: job_depth(sc, v)))]
    for v in [x for x in ('room', 'rail', 'bed', 'rail_m') if x in views]:
        jobs += [(f'pass {v} {p}', (lambda v=v, p=p: rq.job_pass(sc, v, p, meta))) for p in rq.PASSES]
    jobs += [(f'beauty {v}', (lambda v=v: rq.job_beauty(sc, v))) for v in views]
    for v in [x for x in ('room', 'bed', 'rail', 'rail_m') if x in views]:
        jobs += [(f'state {v} {st}', (lambda v=v, st=st: rq.job_state(sc, v, st, meta))) for st in ('evening', 'night', 'morning')]
    for v in [x for x in VARIANT_VIEWS if x in views]:
        jobs += [(f'variant {v} {n}', (lambda v=v, n=n: job_variant(sc, v, n, meta))) for n in VARIANTS]
    if DRY:
        pl = plan(sc, views); os.makedirs(OUT, exist_ok=True)
        json.dump(pl, open(os.path.join(OUT, 'plan.json'), 'w'), indent=1)
        log('plan:', pl['renders'], 'renders, about', pl['hours'], 'h on the PC', {k: v['renders'] for k, v in pl['by_kind'].items()})
        rq.restore_visibility()
    failed = []
    for name, fn in jobs:
        rq.stop_if_superseded()
        try:
            rq.restore_visibility()
            out = fn()
            if out: git_save(out, f'AZUR render (wall): {name}')
        except DryRender as d:
            DRY_RENDERS[-1]['job'] = name
            log('dry', name, '->', os.path.relpath(str(d), OUT))
            sc = open_scene()                       # the job stopped half way (materials swapped): start clean
        except Exception as e:
            import traceback; log('FAILED', name, e); log(traceback.format_exc()); failed.append(name)
            sc = open_scene()
    if DRY:
        json.dump(DRY_RENDERS, open(os.path.join(OUT, 'dry_renders.json'), 'w'), indent=1)
    elif not NO_GIT:
        rq.git_push(force=True)
    log('wall queue finished' + (f' with {len(failed)} failed jobs: ' + ', '.join(failed) if failed else ''))
    if failed: sys.exit(1)


if __name__ == '__main__':
    main()
