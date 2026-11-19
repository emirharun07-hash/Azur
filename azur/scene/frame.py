"""AZUR wall (scene4): shadow-box frames on the back wall, a jersey laid flat inside each, museum glass in front,
a blank plaque under each frame and a ceiling track with one picture spot per frame.

All sizes come from the wall specification (D1, chapters 1-2); object names are the contract with the render queue
(render_queue_wall.py) and the browser:
    frame_<key>, frame_<key>.felt, frame_<key>.clips   moulding (lacquered wood), felt backboard and reveal, acrylic clips
    glass_<key>        the pane            jersey_<key>     the shirt (brasilien, deutschland)
    plaque_<key>       blank label board   picture_light_<key>, picture_track    the spots' housings, the ceiling track
    L_spot_<key>       the spot light (pass 'spot': render_queue turns every L_spot* on together)
Coordinates as in build_room.py: x 0..3.4 left to right, back wall at y = 4.0, z up, metres.
Nothing here draws from the `random` module (build_room's stream stays as it was).
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
KEYS = ('brasilien', 'deutschland', 'drop')
JERSEY_KEYS = ('brasilien', 'deutschland')

# ---------------------------------------------------------------- the specification's numbers
FRAMES = {   # outer edge and opening (x0, x1, z0, z1) on the wall, plaque face (x0, x1, z0, z1)
    'brasilien':   dict(cx=0.53, outer=(0.12, 0.94, 0.97, 1.93), inner=(0.16, 0.90, 1.01, 1.89), plaque=(0.76, 0.94, 0.81, 0.92)),
    'deutschland': dict(cx=1.45, outer=(1.04, 1.86, 0.97, 1.93), inner=(1.08, 1.82, 1.01, 1.89), plaque=(1.68, 1.86, 0.81, 0.92)),
    'drop':        dict(cx=2.27, outer=(1.96, 2.58, 1.08, 1.82), inner=(2.00, 2.54, 1.12, 1.78), plaque=(2.40, 2.58, 0.92, 1.03)),
}
WALL_Y = 4.0
FRONT_Y = 3.910          # front of the moulding
LIP_Y = 3.915            # back of the front lip = front of the pane (the pane sits in a 5 mm rabbet)
GLASS_Y = (3.915, 3.918)
BOARD_Y = 3.990          # felt backboard face
BACK_Y = 3.999           # back of the box: 1 mm off the wall (a shared face plane renders black patches)
RABBET = 0.005           # pane = opening + 5 mm per side
JERSEY_Y, JERSEY_Z, JERSEY_H = 3.975, 1.45, 0.74
PLAQUE_Y = (3.984, 3.990)
TRACK = dict(x0=0.35, x1=2.45, y=3.44, z0=2.47, z1=2.50)
SPOT_AT_Z, AIM_Y, AIM_Z = 2.44, 3.97, 1.45
SPOT_ENERGY = {'brasilien': 30.0, 'deutschland': 30.0, 'drop': 10.0}     # W; D3 may tune +-50 % (see WAND.md)
SPOT = dict(size=56.0, blend=0.40, radius=0.03, color=(1.0, 1.0, 1.0))
EPS = 0.0003             # gap between parts that would otherwise share a face plane


def _link(o):
    bpy.context.scene.collection.objects.link(o); return o


def _obj(name, bm, mats):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    return _link(bpy.data.objects.new(name, me))


# ---------------------------------------------------------------- materials
def _principled(name, color, rough, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m


def materials(paper=None):
    """The wall's own materials (paper: build_room's M['paper'] for the plaques)."""
    M = {}
    M['lacquer'] = _principled('frame_lacquer', (0.02, 0.02, 0.022), 0.45, Metallic=0.0)
    # dark blue felt, AZUR's night colour; a fine noise as fibre bump so the spot shows it is fabric
    f = _principled('frame_felt', (0.010, 0.018, 0.030), 0.95, **{'Sheen Weight': 0.3, 'Sheen Roughness': 0.5})
    nt = f.node_tree; N = nt.nodes; b = N['Principled BSDF']
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900.0; nz.inputs['Detail'].default_value = 6.0
    tc = N.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = 0.25; bu.inputs['Distance'].default_value = 0.0004
    nt.links.new(nz.outputs['Fac'], bu.inputs['Height']); nt.links.new(bu.outputs['Normal'], b.inputs['Normal'])
    M['felt'] = f
    # museum glass: Fresnel(1.5) mix of transparent and a faint glossy; the spot passes straight through
    g = bpy.data.materials.new('museum_glass'); g.use_nodes = True; nt = g.node_tree; N = nt.nodes
    for n in [n for n in N if n.type == 'BSDF_PRINCIPLED']: N.remove(n)
    out = next(n for n in N if n.type == 'OUTPUT_MATERIAL')
    fr = N.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.5
    tr = N.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (1, 1, 1, 1)
    gl = N.new('ShaderNodeBsdfGlossy'); gl.inputs['Color'].default_value = (1, 1, 1, 1); gl.inputs['Roughness'].default_value = 0.04
    mx = N.new('ShaderNodeMixShader')
    nt.links.new(fr.outputs['Fac'], mx.inputs['Fac']); nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(gl.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
    M['glass'] = g
    M['acrylic'] = _principled('clip_acrylic', (1, 1, 1), 0.05, **{'Transmission Weight': 1.0, 'IOR': 1.49})
    M['paper'] = paper or _principled('plaque_paper', (0.86, 0.82, 0.72), 0.8, **{'Sheen Weight': 0.1})
    M['brass'] = _principled('plaque_brass', (0.80, 0.62, 0.36), 0.32, Metallic=1.0)
    M['black'] = _principled('picture_light_black', (0.015, 0.015, 0.016), 0.4, Metallic=0.3)
    return M


# ---------------------------------------------------------------- geometry helpers (bmesh, world coordinates)
def _ring(bm, outer, inner, y0, y1):
    """A closed rectangular ring solid in the wall plane (x, z), from y0 (room side) to y1. Returns its edges."""
    def loop(r, y):
        x0, x1, z0, z1 = r
        return [bm.verts.new(p) for p in ((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1))]
    of, inf, ob, ib = loop(outer, y0), loop(inner, y0), loop(outer, y1), loop(inner, y1)
    faces = []
    for i in range(4):
        j = (i + 1) % 4
        faces += [bm.faces.new((of[i], of[j], inf[j], inf[i])), bm.faces.new((ob[i], ib[i], ib[j], ob[j])),
                  bm.faces.new((of[i], ob[i], ob[j], of[j])), bm.faces.new((inf[i], inf[j], ib[j], ib[i]))]
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return of, inf, ob, ib, faces


def _slab(bm, r, y0, y1):
    x0, x1, z0, z1 = r
    res = bmesh.ops.create_cube(bm, size=1.0)
    for v in res['verts']:
        v.co = Vector((x0 if v.co.x < 0 else x1, y0 if v.co.y < 0 else y1, z0 if v.co.z < 0 else z1))
    return res['verts']


def _chamfer(bm, verts, width):
    """A one-segment chamfer on every edge between the given verts."""
    vs = set(verts)
    edges = [e for e in bm.edges if e.verts[0] in vs and e.verts[1] in vs]
    if edges: bmesh.ops.bevel(bm, geom=edges, offset=width, segments=1, affect='EDGES', profile=0.5, clamp_overlap=True)


def _cyl(bm, p0, p1, r, seg=24, cap_far=True):
    """Cylinder from p0 to p1 (radius r). cap_far=False leaves the end at p1 open (a lamp's mouth)."""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=d.length)
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ rot, verts=res['verts'])
    if not cap_far:
        far = [f for f in bm.faces if len(f.verts) == seg and all(v in res['verts'] for v in f.verts)
               and (f.calc_center_median() - p1).length < r * 0.5]
        bmesh.ops.delete(bm, geom=far, context='FACES_ONLY')
    return res['verts']


def _grow(r, d):
    x0, x1, z0, z1 = r
    return (x0 - d, x1 + d, z0 - d, z1 + d)


# ---------------------------------------------------------------- the frame
def _profile(bm, loops):
    """A closed ring solid swept from a cross-section: loops = [(rect, y), ...] around the profile, in order."""
    L = []
    for (x0, x1, z0, z1), y in loops:
        L.append([bm.verts.new(p) for p in ((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1))])
    faces = []
    for a in range(len(L)):
        A, B = L[a], L[(a + 1) % len(L)]
        for i in range(4):
            j = (i + 1) % 4
            faces.append(bm.faces.new((A[i], A[j], B[j], B[i])))
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return L


def _edges_between(bm, a, b):
    sa, sb = set(a), set(b)
    return [e for e in bm.edges if (e.verts[0] in sa and e.verts[1] in sb) or (e.verts[1] in sa and e.verts[0] in sb)]


def shadowbox(key, M):
    """Moulding (front lip + box sides with a rabbet for the pane), felt reveal and backboard, the pane."""
    F = FRAMES[key]; outer, inner = F['outer'], F['inner']; rab = _grow(inner, RABBET)
    bm = bmesh.new()
    # cross-section of the moulding, one L-shaped profile all round: the 4 cm lip in front, the box sides behind it
    L = _profile(bm, [(outer, FRONT_Y), (inner, FRONT_Y), (inner, LIP_Y), (rab, LIP_Y), (rab, BACK_Y), (outer, BACK_Y)])
    edges = []
    for lp in (L[0], L[1]):                                          # the front edges, outside and inside
        edges += [e for e in bm.edges if e.verts[0] in lp and e.verts[1] in lp and e not in edges
                  and abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-9 and
                  (abs(e.verts[0].co.x - e.verts[1].co.x) < 1e-9 or abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-9)]
    edges += [e for e in _edges_between(bm, L[0], L[5]) if (e.verts[0].co.xz - e.verts[1].co.xz).length < 1e-9]   # outer corners
    bmesh.ops.bevel(bm, geom=list(set(edges)), offset=0.002, segments=1, affect='EDGES', profile=0.5, clamp_overlap=True)
    fr = _obj('frame_' + key, bm, [M['lacquer']])
    # felt: the reveal lines the box sides from behind the pane to the backboard, the backboard closes the box
    bm = bmesh.new()
    _ring(bm, _grow(rab, -EPS), inner, GLASS_Y[1] + EPS, BOARD_Y)
    _slab(bm, _grow(rab, -EPS), BOARD_Y + EPS, BACK_Y)
    felt = _obj('frame_' + key + '.felt', bm, [M['felt']])
    bm = bmesh.new()
    _slab(bm, _grow(rab, -EPS), GLASS_Y[0] + EPS, GLASS_Y[1])
    gl = _obj('glass_' + key, bm, [M['glass']])
    gl.visible_shadow = False                    # the spot falls through; at most a faint sheen
    for o in (fr, felt, gl):
        for p in o.data.polygons: p.use_smooth = False
    return fr, felt, gl


# ---------------------------------------------------------------- the jersey, laid flat
def _smooth01(t):
    t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)


def relief_map(src_png, dst_png, sigma=18.0):
    """High-pass luminance of the picture as a height map (as build_room_duo.py): weave, raised pattern, print edges."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    a = np.asarray(Image.open(src_png).convert('RGB'), dtype=np.float32) / 255.0
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    fine = lum - ndimage.gaussian_filter(lum, sigma)
    s = float(np.percentile(np.abs(fine), 99.5)) + 1e-6
    h = np.clip(0.5 + 0.5 * fine / s, 0.0, 1.0)
    Image.fromarray((h * 65535).astype(np.uint16)).save(dst_png)
    return dst_png


def add_relief(o, strength=0.55, distance=0.0012):
    """The relief map on top of the knit normal map (build_room_duo.py, same values)."""
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
        b.inputs['Roughness'].default_value = 0.55; b.inputs['Sheen Weight'].default_value = 0.45


def jersey(key, front_path, back_path, knit_normal=None, tex_dir=None):
    """The shirt laid flat: garment.panels' closed shell from the picture outline, only 1 cm thick, soft folds
    (at most +-8 mm), the sleeves bent 5-10 mm toward the glass. Centre at (frame x, 3.975, 1.45)."""
    import garment
    name = 'jersey_' + key
    tex_dir = tex_dir or os.path.join(ROOT, '.cache', 'jersey_tex_wall')   # not jersey_tex: scene3 keeps its own crops
    o, info = garment.panels(name, front_path, back_path, h=JERSEY_H, cell=0.012, depth=0.010, tex_dir=tex_dir)
    o['front'], o['back'] = info['front'], info['back']
    w, h, bw = info['w'], info['h'], info['body_w']
    for v in o.data.vertices:
        x, t = v.co.x, min(1.0, max(0.0, -v.co.z / h))        # t: 0 collar .. 1 hem
        fold = 0.0035 * math.sin(x * 11.0 + 0.6) * math.sin(t * 7.0 + 1.1) + 0.0018 * math.sin(x * 23.0 - t * 5.0 + 2.0)
        chest = -0.0022 * max(0.0, 1 - (2 * x / bw) ** 2) * math.sin(math.pi * t)          # a little fuller at the chest
        sleeve = _smooth01((abs(x) - bw / 2) / max(w / 2 - bw / 2, 1e-3))
        v.co.y += fold + chest - 0.008 * sleeve                                              # sleeves toward the glass
    o.data.update()
    garment.materials(o, name, knit_normal)
    add_relief(o, 0.55, 0.0012)
    sub = o.modifiers.new('sub', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
    sol = o.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.0015; sol.offset = 1
    o.location = (FRAMES[key]['cx'], JERSEY_Y, JERSEY_Z + h / 2)
    bpy.context.view_layer.update()
    return o, info


def clips(key, jo, info, M):
    """Two clear acrylic clips at the shoulders: a disc (12 mm, 4 mm high) over the fabric edge on a pin beside the
    outline back to the backboard (the pin never passes through the shirt, so the empty frame still shows them)."""
    mw = jo.matrix_world; pts = [mw @ v.co for v in jo.data.vertices]
    cx = FRAMES[key]['cx']; bw = info['body_w']
    bm = bmesh.new()
    for s in (-1, 1):
        xs = cx + s * 0.38 * bw
        near = [p for p in pts if abs(p.x - xs) < 0.008]
        top = max(p.z for p in near)                                   # the shoulder line there
        foot = [p for p in pts if abs(p.x - xs) < 0.007 and p.z > top - 0.007]
        yfront = min(p.y for p in foot)
        dc = Vector((xs, 0, top + 0.0005)); pc = Vector((xs, 0, top + 0.004))
        _cyl(bm, (dc.x, yfront - 0.003 - 0.004, dc.z), (dc.x, yfront - 0.003, dc.z), 0.006, seg=24)
        _cyl(bm, (pc.x, yfront - 0.0035, pc.z), (pc.x, BOARD_Y + 0.0004, pc.z), 0.0015, seg=12)
    o = _obj('frame_' + key + '.clips', bm, [M['acrylic']])
    for p in o.data.polygons: p.use_smooth = True
    return o


# ---------------------------------------------------------------- plaque, track, spots
def plaque(key, M):
    """Blank label board 0.18 x 0.11 x 6 mm on four 10 mm brass standoffs; the browser writes on it."""
    x0, x1, z0, z1 = FRAMES[key]['plaque']
    bm = bmesh.new()
    vs = _slab(bm, (x0, x1, z0, z1), PLAQUE_Y[0], PLAQUE_Y[1])
    _chamfer(bm, vs, 0.001)
    nb = len(bm.faces)
    for xx in (x0 + 0.02, x1 - 0.02):
        for zz in (z0 + 0.02, z1 - 0.02):
            _cyl(bm, (xx, PLAQUE_Y[1], zz), (xx, WALL_Y - 0.0005, zz), 0.004, seg=16)
    bm.faces.ensure_lookup_table()
    for i, f in enumerate(bm.faces): f.material_index = 0 if i < nb else 1
    o = _obj('plaque_' + key, bm, [M['paper'], M['brass']])
    return o


def track(M):
    bm = bmesh.new()
    vs = _slab(bm, (TRACK['x0'], TRACK['x1'], TRACK['z0'], TRACK['z1'] - 0.0005), TRACK['y'] - 0.015, TRACK['y'] + 0.015)
    _chamfer(bm, vs, 0.002)
    return _obj('picture_track', bm, [M['black']])


def picture_light(key, M, tr):
    """Housing (6 cm, 10 cm long, open at the mouth) on a short stem under the track, aimed at the frame centre, and
    its SPOT light just in front of the mouth. The housing hangs from the track (one fixture: parented to it)."""
    cx = FRAMES[key]['cx']
    aim = Vector((cx, AIM_Y, AIM_Z))
    pivot = Vector((cx, TRACK['y'], SPOT_AT_Z + 0.015))       # back end of the can just under the track (z 2.47)
    d = (aim - pivot).normalized()
    mouth = pivot + d * 0.10
    bm = bmesh.new()
    _cyl(bm, pivot, mouth, 0.03, seg=32, cap_far=False)
    _cyl(bm, (cx, TRACK['y'], TRACK['z0'] + 0.002), pivot + Vector((0, 0, 0.002)), 0.007, seg=16)
    o = _obj('picture_light_' + key, bm, [M['black']])
    sol = o.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.0015; sol.offset = -1
    for p in o.data.polygons: p.use_smooth = True
    o.parent = tr; o.matrix_parent_inverse = tr.matrix_world.inverted()
    L = bpy.data.lights.new('L_spot_' + key, 'SPOT')
    L.energy = SPOT_ENERGY[key]; L.spot_size = math.radians(SPOT['size']); L.spot_blend = SPOT['blend']
    L.shadow_soft_size = SPOT['radius']; L.color = SPOT['color']
    lo = _link(bpy.data.objects.new('L_spot_' + key, L))
    lo.location = mouth + d * (SPOT['radius'] + 0.002)          # the light's sphere just outside the housing
    lo.rotation_euler = (aim - lo.location).to_track_quat('-Z', 'Y').to_euler()
    lo.visible_camera = False
    return o, lo


# ---------------------------------------------------------------- everything
def build_wall(assets_dir, paper=None, knit_normal=None):
    """Build the three frames with their jerseys, plaques and spots. Returns {name: object}."""
    M = materials(paper)
    made = {}
    tr = track(M); made[tr.name] = tr
    for key in KEYS:
        for o in shadowbox(key, M): made[o.name] = o
        if key in JERSEY_KEYS:
            jo, info = jersey(key, f'{assets_dir}/jerseys/clean/{key}-vorne.webp', f'{assets_dir}/jerseys/clean/{key}-hinten.webp', knit_normal)
            made[jo.name] = jo
            c = clips(key, jo, info, M); made[c.name] = c
            print(f'wall {key}: jersey {info["w"]:.3f} x {info["h"]:.2f} m, body {info["body_w"]:.3f} m, {len(jo.data.vertices)} vertices', flush=True)
        p = plaque(key, M); made[p.name] = p
        h, lo = picture_light(key, M, tr); made[h.name] = h; made[lo.name] = lo
    return made
