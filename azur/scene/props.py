"""Round 7: the boots and the backpack in detail; round 8: brighter boots and a modern ball (build_room.py places them).

boot()      A football boot on a late-sixties cut (the owner's round 7 reference: the boot with the side stripe and
            flat laces), in round 8's bright colours (the owner's reference: a modern boot in aqua with neon accents):
            an aqua upper on a curved last, a side stripe of our own shape (even width, rounded ends, stitched; no
            maker's stripe) fading from neon yellow to coral, white flat laces criss-crossed over the tongue through
            punched eyelets, a padded collar, the foot opening lined navy, a white sole plate with twelve long blue
            studs, and a small navy AZUR script (the brand's own logo) on the forefoot's sides. No other name or mark.
backpack()  After the owner's reference (a minimalist leather backpack, 30 x 16 x 47 cm): a tall soft leather box with
            a rounded top, a brass zip over the top and down both sides, a seam and a zipped pocket on the front, a
            leather top handle, padded shoulder straps with brass buckles. Navy-blue leather (the bag stays blue).
ball()      A glossy modern match ball (the owner's reference: white with bold swirls): four curved panels, blue swooshes
            with small stars, red and green ones, pressed-in seams. The print is made in ball_texture(); no text.

Everything is built from functions with bmesh; nothing here touches the random module (build_room's random stream,
and with it the rest of the room, stays as it was).
"""
import math, os
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

LINK = None          # build_room.py sets its link(); standalone tests link into the scene collection
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))     # azur/
CACHE = os.path.join(ROOT, '.cache', 'props')                          # generated textures (ball, logo)


def link(o):
    if LINK: LINK(o)
    else: bpy.context.scene.collection.objects.link(o)
    return o


def spline(tab, t):
    """Cubic Hermite through (t, value) pairs (Catmull-Rom tangents): smooth profiles without flat spots."""
    ts = [p[0] for p in tab]; vs = [p[1] for p in tab]; n = len(tab)
    t = min(max(t, ts[0]), ts[-1])
    i = 0
    while i < n - 2 and t > ts[i + 1]: i += 1
    def m(k):
        if k == 0: return (vs[1] - vs[0]) / (ts[1] - ts[0])
        if k == n - 1: return (vs[-1] - vs[-2]) / (ts[-1] - ts[-2])
        return (vs[k + 1] - vs[k - 1]) / (ts[k + 1] - ts[k - 1])
    h = ts[i + 1] - ts[i]; s = (t - ts[i]) / h
    return ((2 * s ** 3 - 3 * s ** 2 + 1) * vs[i] + (s ** 3 - 2 * s ** 2 + s) * h * m(i)
            + (-2 * s ** 3 + 3 * s ** 2) * vs[i + 1] + (s ** 3 - s ** 2) * h * m(i + 1))


def sgnpow(x, p): return math.copysign(abs(x) ** p, x)


def catmull(pts, n):
    """n points along a Catmull-Rom curve through pts (Vectors)."""
    P = [pts[0] + (pts[0] - pts[1])] + list(pts) + [pts[-1] + (pts[-1] - pts[-2])]
    out = []
    for k in range(n):
        u = k / (n - 1) * (len(pts) - 1); i = min(int(u), len(pts) - 2); s = u - i
        p0, p1, p2, p3 = P[i], P[i + 1], P[i + 2], P[i + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s ** 3))
    return out


# ---------------------------------------------------------------- materials
def _mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes, nt.links, nt.nodes['Principled BSDF']


def plain(name, col, rough=0.5, **kw):
    m, nt, N, L, b = _mat(name)
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m


def leather(name, col, rough=0.3, coat=0.4, grain=900.0, crease=55.0, bump=0.25, seams=None, seam_col=(0.036, 0.034, 0.031)):
    """Leather: a fine pebble grain (Voronoi) and soft creases (noise) as bump, the shine a little uneven.
    seams: optional list of (axis, a, b, c) lines a + b*u^2 = axis value in object space (u = the other horizontal
    axis), drawn as a stitched groove: [('y', y0, k, None)] gives y = y0 + k*x^2."""
    m, nt, N, L, b = _mat(name)
    tc = N.new('ShaderNodeTexCoord')
    vo = N.new('ShaderNodeTexVoronoi'); vo.feature = 'F1'; vo.inputs['Scale'].default_value = grain
    L.new(tc.outputs['Object'], vo.inputs['Vector'])
    no = N.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = crease; no.inputs['Detail'].default_value = 3.0
    L.new(tc.outputs['Object'], no.inputs['Vector'])
    h = N.new('ShaderNodeMath'); h.operation = 'MULTIPLY_ADD'
    L.new(vo.outputs['Distance'], h.inputs[0]); h.inputs[1].default_value = 0.35; L.new(no.outputs['Fac'], h.inputs[2])
    height = h.outputs[0]
    col_out = None
    if seams:
        sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
        line = None
        for axis, a0, k, _ in seams:
            other = sep.outputs['X'] if axis == 'y' else sep.outputs['Y']
            here = sep.outputs['Y'] if axis == 'y' else sep.outputs['X']
            sq = N.new('ShaderNodeMath'); sq.operation = 'MULTIPLY'; L.new(other, sq.inputs[0]); L.new(other, sq.inputs[1])
            ln = N.new('ShaderNodeMath'); ln.operation = 'MULTIPLY_ADD'; L.new(sq.outputs[0], ln.inputs[0]); ln.inputs[1].default_value = k; ln.inputs[2].default_value = a0
            d = N.new('ShaderNodeMath'); d.operation = 'SUBTRACT'; L.new(here, d.inputs[0]); L.new(ln.outputs[0], d.inputs[1])
            ad = N.new('ShaderNodeMath'); ad.operation = 'ABSOLUTE'; L.new(d.outputs[0], ad.inputs[0])
            near = N.new('ShaderNodeMath'); near.operation = 'LESS_THAN'; L.new(ad.outputs[0], near.inputs[0]); near.inputs[1].default_value = 0.0007
            # dashes along the seam (3 mm stitches)
            dash = N.new('ShaderNodeMath'); dash.operation = 'MULTIPLY'; L.new(other, dash.inputs[0]); dash.inputs[1].default_value = 330.0
            fr = N.new('ShaderNodeMath'); fr.operation = 'FRACT'; L.new(dash.outputs[0], fr.inputs[0])
            on = N.new('ShaderNodeMath'); on.operation = 'LESS_THAN'; L.new(fr.outputs[0], on.inputs[0]); on.inputs[1].default_value = 0.62
            st = N.new('ShaderNodeMath'); st.operation = 'MULTIPLY'; L.new(near.outputs[0], st.inputs[0]); L.new(on.outputs[0], st.inputs[1])
            if line is None: line = st.outputs[0]
            else:
                mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; L.new(line, mx.inputs[0]); L.new(st.outputs[0], mx.inputs[1]); line = mx.outputs[0]
        mixc = N.new('ShaderNodeMix'); mixc.data_type = 'RGBA'
        mixc.inputs[6].default_value = (*col, 1); mixc.inputs[7].default_value = (*seam_col, 1)
        L.new(line, mixc.inputs['Factor']); col_out = mixc.outputs[2]
        hl = N.new('ShaderNodeMath'); hl.operation = 'MULTIPLY_ADD'; L.new(line, hl.inputs[0]); hl.inputs[1].default_value = 0.6; L.new(height, hl.inputs[2])
        height = hl.outputs[0]
    if col_out is not None: L.new(col_out, b.inputs['Base Color'])
    else: b.inputs['Base Color'].default_value = (*col, 1)
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.0006
    L.new(height, bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    rr = N.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = rough * 0.75; rr.inputs['To Max'].default_value = rough * 1.3
    L.new(no.outputs['Fac'], rr.inputs['Value']); L.new(rr.outputs['Result'], b.inputs['Roughness'])
    b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.16
    return m


def stitched(name, col, thread, rough=0.45, edges=(0.13, 0.87), period=0.0034, coat=0.15, col2=None, grad=(0.0, 1.0)):
    """A leather band with stitches along both edges, from its UVs (u: metres along, v: 0..1 across).
    col2: the band fades from col to col2 along the object's y, from grad[0] to grad[1] (round 8: the boots' stripe)."""
    m, nt, N, L, b = _mat(name)
    uv = N.new('ShaderNodeUVMap'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(uv.outputs['UV'], sep.inputs[0])
    line = None
    for e in edges:
        d = N.new('ShaderNodeMath'); d.operation = 'SUBTRACT'; L.new(sep.outputs['Y'], d.inputs[0]); d.inputs[1].default_value = e
        ad = N.new('ShaderNodeMath'); ad.operation = 'ABSOLUTE'; L.new(d.outputs[0], ad.inputs[0])
        near = N.new('ShaderNodeMath'); near.operation = 'LESS_THAN'; L.new(ad.outputs[0], near.inputs[0]); near.inputs[1].default_value = 0.045
        line = near.outputs[0] if line is None else _max(N, L, line, near.outputs[0])
    dash = N.new('ShaderNodeMath'); dash.operation = 'DIVIDE'; L.new(sep.outputs['X'], dash.inputs[0]); dash.inputs[1].default_value = period
    fr = N.new('ShaderNodeMath'); fr.operation = 'FRACT'; L.new(dash.outputs[0], fr.inputs[0])
    on = N.new('ShaderNodeMath'); on.operation = 'LESS_THAN'; L.new(fr.outputs[0], on.inputs[0]); on.inputs[1].default_value = 0.6
    st = N.new('ShaderNodeMath'); st.operation = 'MULTIPLY'; L.new(line, st.inputs[0]); L.new(on.outputs[0], st.inputs[1])
    mixc = N.new('ShaderNodeMix'); mixc.data_type = 'RGBA'; mixc.inputs[6].default_value = (*col, 1); mixc.inputs[7].default_value = (*thread, 1)
    tc = N.new('ShaderNodeTexCoord')
    if col2 is not None:
        so = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], so.inputs[0])
        gr = N.new('ShaderNodeMapRange'); gr.interpolation_type = 'SMOOTHSTEP'
        gr.inputs['From Min'].default_value, gr.inputs['From Max'].default_value = grad
        L.new(so.outputs['Y'], gr.inputs['Value'])
        mg = N.new('ShaderNodeMix'); mg.data_type = 'RGBA'; mg.inputs[6].default_value = (*col, 1); mg.inputs[7].default_value = (*col2, 1)
        L.new(gr.outputs['Result'], mg.inputs['Factor']); L.new(mg.outputs[2], mixc.inputs[6])
    L.new(st.outputs[0], mixc.inputs['Factor']); L.new(mixc.outputs[2], b.inputs['Base Color'])
    no = N.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 420.0
    L.new(tc.outputs['Object'], no.inputs['Vector'])
    hh = N.new('ShaderNodeMath'); hh.operation = 'MULTIPLY_ADD'; L.new(st.outputs[0], hh.inputs[0]); hh.inputs[1].default_value = 0.8; L.new(no.outputs['Fac'], hh.inputs[2])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.3; bp.inputs['Distance'].default_value = 0.0005
    L.new(hh.outputs[0], bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = rough; b.inputs['Coat Weight'].default_value = coat
    return m


def _max(N, L, a, b_):
    mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; L.new(a, mx.inputs[0]); L.new(b_, mx.inputs[1]); return mx.outputs[0]


def _math(N, L, op, a, b_=None, c=None):
    """A Math node: a, b_, c are sockets or numbers."""
    n = N.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b_, c)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: L.new(v, n.inputs[i])
    return n.outputs[0]


def logo_image():
    """The brand's script logo (azur/prototype/assets/brand), as a PNG Blender reads everywhere."""
    out = os.path.join(CACHE, 'logo_ink.png')
    if not os.path.exists(out):
        from PIL import Image
        os.makedirs(CACHE, exist_ok=True)
        Image.open(os.path.join(ROOT, 'prototype', 'assets', 'brand', 'azur-logo-ink.webp')).convert('RGBA').save(out)
    img = bpy.data.images.load(out, check_existing=True); img.colorspace_settings.name = 'Non-Color'
    return img


def decal(m, img, y, z, w, col, flip=1.0):
    """Print img (its alpha) on both sides of a part, projected along x in object space: centred at (y, z), w wide,
    upright and readable from either side (flip=-1 for a part mirrored by its parent's scale)."""
    nt = m.node_tree; N, L = nt.nodes, nt.links; b = N['Principled BSDF']
    h = w * img.size[1] / img.size[0]
    tc = N.new('ShaderNodeTexCoord')
    sp = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sp.inputs[0])
    sn = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Normal'], sn.inputs[0])
    side = _math(N, L, 'MULTIPLY', _math(N, L, 'SIGN', sp.outputs['X']), flip)
    u = _math(N, L, 'MULTIPLY_ADD', _math(N, L, 'MULTIPLY', _math(N, L, 'SUBTRACT', sp.outputs['Y'], y), side), 1.0 / w, 0.5)
    v = _math(N, L, 'MULTIPLY_ADD', _math(N, L, 'SUBTRACT', sp.outputs['Z'], z), 1.0 / h, 0.5)
    cb = N.new('ShaderNodeCombineXYZ'); L.new(u, cb.inputs[0]); L.new(v, cb.inputs[1])
    tex = N.new('ShaderNodeTexImage'); tex.image = img; tex.extension = 'CLIP'; tex.interpolation = 'Cubic'
    L.new(cb.outputs[0], tex.inputs['Vector'])
    facing = N.new('ShaderNodeMapRange'); facing.interpolation_type = 'SMOOTHSTEP'
    facing.inputs['From Min'].default_value = 0.35; facing.inputs['From Max'].default_value = 0.6
    L.new(_math(N, L, 'ABSOLUTE', sn.outputs['X']), facing.inputs['Value'])
    fac = _math(N, L, 'MULTIPLY', tex.outputs['Alpha'], facing.outputs['Result'])
    mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    bc = b.inputs['Base Color']
    if bc.links: L.new(bc.links[0].from_socket, mx.inputs[6])
    else: mx.inputs[6].default_value = bc.default_value[:]
    mx.inputs[7].default_value = (*col, 1); L.new(fac, mx.inputs['Factor']); L.new(mx.outputs[2], bc)
    return m


def zip_teeth(name, metal=(0.80, 0.56, 0.26)):
    """Brass zip teeth along a ribbon's u (metres)."""
    m, nt, N, L, b = _mat(name)
    uv = N.new('ShaderNodeUVMap'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(uv.outputs['UV'], sep.inputs[0])
    d = N.new('ShaderNodeMath'); d.operation = 'DIVIDE'; L.new(sep.outputs['X'], d.inputs[0]); d.inputs[1].default_value = 0.0026
    fr = N.new('ShaderNodeMath'); fr.operation = 'PINGPONG'; L.new(d.outputs[0], fr.inputs[0]); fr.inputs[1].default_value = 0.5
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.8; bp.inputs['Distance'].default_value = 0.0008
    L.new(fr.outputs[0], bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Base Color'].default_value = (*metal, 1); b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.32
    return m


# ---------------------------------------------------------------- mesh helpers
def grid_object(name, rows, close_v=False, uv=None, smooth=True):
    """rows: along u, each a list (along v) of points -> a quad grid. uv(i, j) -> (u, v) for a UV map."""
    nu, nv = len(rows), len(rows[0])
    verts = [tuple(p) for r in rows for p in r]
    faces = []
    for i in range(nu - 1):
        for j in range(nv if close_v else nv - 1):
            j1 = (j + 1) % nv
            faces.append((i * nv + j, i * nv + j1, (i + 1) * nv + j1, (i + 1) * nv + j))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    if uv:
        lay = me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index; lay.data[li].uv = uv(*divmod(vi, nv))
    if smooth: me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    return link(bpy.data.objects.new(name, me))


def flip_toward(o, direction):
    """Make an open sheet's normals face roughly along direction (its winding depends on how it was built)."""
    me = o.data
    avg = sum((p.normal for p in me.polygons), Vector())
    if avg.dot(Vector(direction)) < 0: me.flip_normals()


def ribbon(name, path, width, normals, mat, thick=0.0, v_steps=2, offset=0.0):
    """A flat band along path (Vectors), lying in the plane given by normals (one per point or one for all)."""
    rows = []; length = [0.0]
    for k in range(1, len(path)): length.append(length[-1] + (path[k] - path[k - 1]).length)
    for k, p in enumerate(path):
        t = (path[min(k + 1, len(path) - 1)] - path[max(k - 1, 0)]).normalized()
        n = (normals[k] if isinstance(normals, list) else Vector(normals)).normalized()
        side = n.cross(t).normalized()
        w = width[k] if isinstance(width, list) else width
        rows.append([p + n * offset + side * (w * (j / (v_steps - 1) - 0.5)) for j in range(v_steps)])
    o = grid_object(name, rows, uv=lambda i, j: (length[i], j / (v_steps - 1)))
    n0 = normals[len(path) // 2] if isinstance(normals, list) else Vector(normals)
    flip_toward(o, n0)
    if thick:
        so = o.modifiers.new('sol', 'SOLIDIFY'); so.thickness = thick; so.offset = -1
    o.data.materials.append(mat)
    return o


def cast(bvh, origin, direction):
    hit = bvh.ray_cast(Vector(origin), Vector(direction).normalized())
    return (hit[0], hit[1]) if hit[0] is not None else (None, None)


def apply_modifiers(o):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data; o.modifiers.clear(); o.data = me
    if old.users == 0: bpy.data.meshes.remove(old)


def bvh_of(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_basis)
    t = BVHTree.FromBMesh(bm); bm.free(); return t


# ---------------------------------------------------------------- the boot
L_BOOT, Y0 = 0.285, -0.125            # last length (a size 42), heel end
ZC = 0.0175                           # cross-section centre; the upper's flat bottom sits in the sole plate
HW = [(0.0, 0.0255), (0.08, 0.0325), (0.20, 0.0335), (0.32, 0.0345), (0.44, 0.0385), (0.56, 0.0432), (0.68, 0.0458),
      (0.80, 0.0446), (0.90, 0.0395), (0.96, 0.031), (1.0, 0.021)]      # half width of the last
HT = [(0.0, 0.068), (0.07, 0.070), (0.16, 0.064), (0.26, 0.0595), (0.36, 0.0645), (0.44, 0.0655), (0.56, 0.0565),
      (0.68, 0.0455), (0.80, 0.0355), (0.90, 0.0285), (1.0, 0.0225)]     # top of the closed last (the collar is cut)
CAP_H, CAP_T = 0.085, 0.075           # heel and toe rounding (in t)
EYELETS = [0.425 + k * 0.052 for k in range(6)]
THROAT = 0.0075                       # half width of the lace slot
RISE = 1.2                            # round 8: the upper 20 % higher above ZC (the owner: the boots looked flat)
STUD_TIP = -0.0125                    # round 8: longer studs (round 7: -0.0085)


def risen(z): return ZC + (z - ZC) * RISE


def last_hw(t):
    w = spline(HW, t)
    if t < CAP_H: w *= math.sqrt(max(0.0, 1 - ((CAP_H - t) / CAP_H) ** 2))
    if t > 1 - CAP_T: w *= math.sqrt(max(0.0, 1 - ((t - (1 - CAP_T)) / CAP_T) ** 2))
    return max(w, 0.0012)


def last_h(t):
    h = risen(spline(HT, t))
    if t < 0.03: h -= 0.006 * ((0.03 - t) / 0.03) ** 2                 # the heel's top edge rolls over
    if t > 1 - CAP_T: h = ZC + (h - ZC) * max(0.15, math.sqrt(max(0.0, 1 - ((t - (1 - CAP_T)) / CAP_T) ** 2)) ** 0.7)
    return h


def last_cx(t):                       # the forefoot turns in a little (a real last is not straight)
    return 0.0065 * max(0.0, (t - 0.4) / 0.6) ** 1.6


def boot_y(t): return Y0 + t * L_BOOT


def boot_body(name, mat):
    nt_, N = 72, 44
    bm = bmesh.new(); rings = []
    for i in range(nt_):
        t = 0.5 - 0.5 * math.cos(math.pi * i / (nt_ - 1))          # rings closer together at heel and toe
        hw, h, cx, y = last_hw(t), last_h(t), last_cx(t), boot_y(t)
        q = 0.70 + 0.20 * t                                          # firmer at the heel, round toward the toe
        ring = []
        for j in range(N):
            a = 2 * math.pi * j / N - math.pi / 2
            ca, sa = math.cos(a), math.sin(a)
            if sa >= 0:
                x = hw * sgnpow(ca, 0.72) * (1 - 0.16 * sa * sa); z = ZC + (h - ZC) * sgnpow(sa, q)   # walls lean in
            else:
                x = hw * sgnpow(ca, 0.22); z = ZC + 0.0075 * sgnpow(sa, 0.35)
            ring.append(bm.verts.new((cx + x, y, z)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for j in range(N):
            bm.faces.new((r0[j], r0[(j + 1) % N], r1[(j + 1) % N], r1[j]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.data.materials.append(mat)
    return o


def opening_hw(t):
    """Half width of the cut in plan: the foot opening (heel to tongue) and the lace slot in front of it."""
    w = 0.0
    ta, tb = 0.028, 0.392
    if ta < t < tb: w = 0.0298 * math.sin(math.pi * (t - ta) / (tb - ta)) ** 0.5
    tc, td, r = 0.36, 0.705, 0.012
    if tc < t < td:
        s = THROAT
        if t > td - r: s *= math.sqrt(max(0.0, 1 - ((t - (td - r)) / r) ** 2))
        w = max(w, s)
    return w


def opening_floor(t):
    """Depth of the cut: down to the insole in the foot opening, a shallow slot (tongue below) in front."""
    deep, shallow = 0.031, last_h(t) - 0.0105
    s = min(1.0, max(0.0, (t - 0.355) / 0.06)); s = s * s * (3 - 2 * s)
    return deep + (shallow - deep) * s


def cutter(name, mat):
    rows = []
    n = 90
    for i in range(n):
        t = 0.026 + (0.707 - 0.026) * i / (n - 1)
        w = max(opening_hw(t), 0.0004); cx, y, zf = last_cx(t), boot_y(t), opening_floor(t)
        rows.append([Vector((cx - w, y, 0.25)), Vector((cx - w, y, zf)), Vector((cx + w, y, zf)), Vector((cx + w, y, 0.25))])
    bm = bmesh.new()
    vs = [[bm.verts.new(p) for p in r] for r in rows]
    for r0, r1 in zip(vs, vs[1:]):
        for j in range(4):
            bm.faces.new((r0[j], r0[(j + 1) % 4], r1[(j + 1) % 4], r1[j]))
    bm.faces.new(list(reversed(vs[0]))); bm.faces.new(vs[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.data.materials.append(mat)
    return o


def boot(name, loc, rot, tilt=0.0, mirror=False, lace_ends='floor'):
    """One boot. Local frame: heel at -y, toe at +y, stud tips at z = STUD_TIP (build_room puts the root on the
    floor). Returns the root empty."""
    # round 8 (the owner: brighter, after a modern boot in aqua with neon accents): an aqua upper, the stripe fading
    # from neon yellow at the heel to coral at the front, white laces and sole plate, blue studs, and a small navy
    # AZUR script (the brand's own logo) on the outsides of the forefoot. Linear colours.
    aqua, navy = (0.11, 0.56, 0.62), (0.012, 0.025, 0.09)
    upper = leather(name + '_leather', aqua, rough=0.34, coat=0.3, grain=1300.0, crease=60.0, bump=0.16,
                    seams=[('y', boot_y(0.745), -9.0, None), ('y', boot_y(0.13), 6.0, None)], seam_col=(0.03, 0.20, 0.24))
    decal(upper, logo_image(), boot_y(0.59), risen(0.0285), 0.032, navy, flip=-1.0 if mirror else 1.0)
    collar_m = leather(name + '_collar', (0.06, 0.38, 0.43), rough=0.55, coat=0.08, grain=1600.0, bump=0.35)
    lining = plain(name + '_lining', navy, rough=0.9, **{'Sheen Weight': 0.3})
    sole_m = plain(name + '_sole', (0.80, 0.81, 0.80), rough=0.36, **{'Coat Weight': 0.2})
    stud_m = plain(name + '_stud', (0.015, 0.06, 0.52), rough=0.4, **{'Coat Weight': 0.2})
    stripe_m = stitched(name + '_stripe', (0.62, 1.0, 0.0), navy, rough=0.32, coat=0.3,
                        col2=(1.0, 0.07, 0.02), grad=(-0.10, 0.02))
    lace_m = plain(name + '_lace', (0.80, 0.80, 0.78), rough=0.75, **{'Sheen Weight': 0.15})
    hole_m = plain(name + '_eyelet', navy, rough=0.6)
    parts = []

    body = boot_body(name, upper)
    full = bvh_of(body)                                   # the closed last: the top surface for laces and collar
    cut = cutter(name + '_cut', lining)
    bo = body.modifiers.new('cut', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut
    if hasattr(bo, 'solver'): bo.solver = 'EXACT'
    if hasattr(bo, 'material_mode'): bo.material_mode = 'TRANSFER'
    apply_modifiers(body)
    bpy.data.objects.remove(cut, do_unlink=True)
    body.data.polygons.foreach_set('use_smooth', [True] * len(body.data.polygons))
    if hasattr(body.data, 'set_sharp_from_angle'): body.data.set_sharp_from_angle(angle=math.radians(48))
    parts.append(body)
    cutb = bvh_of(body)

    # padded collar around the foot opening (the rim of the cut, from the slot on one side round the heel to the other)
    rim = []
    ts = [0.375 - (0.375 - 0.03) * k / 40 for k in range(41)]
    for side in (1, -1):
        seq = ts if side == 1 else list(reversed(ts))
        for t in seq:
            w = opening_hw(t); x = last_cx(t) + side * w; y = boot_y(t)
            p, _ = cast(full, (x, y, 0.3), (0, 0, -1))
            if p is not None: rim.append(Vector((x - side * 0.0012, y + (0.0012 if t < 0.05 else 0), p.z - 0.0006)))
    rim = catmull(rim[::2], 80)
    cv = bpy.data.curves.new(name + '_collar', 'CURVE'); cv.dimensions = '3D'; cv.bevel_depth = 0.0042; cv.bevel_resolution = 4
    sp = cv.splines.new('POLY'); sp.points.add(len(rim) - 1)
    for k, p in enumerate(rim): sp.points[k].co = (*p, 1)
    co = link(bpy.data.objects.new(name + '_collar', cv)); co.data.materials.append(collar_m); parts.append(co)

    # tongue: under the laces in the slot, standing up out of the opening in front of the ankle
    rows = []
    tt = [0.318 + (0.708 - 0.318) * k / 39 for k in range(40)]
    for t in tt:
        w = 0.0168
        if t < 0.345: w *= math.sqrt(max(0.05, 1 - ((0.345 - t) / 0.027) ** 2))
        base = last_h(max(t, 0.40)) - 0.0078
        rise = max(0.0, 0.40 - t) * 0.30
        row = []
        for j in range(7):
            u = (j / 6 - 0.5) * 2
            row.append(Vector((last_cx(t) + u * w, boot_y(t) - rise * 0.25, base + rise - 0.0035 * u * u)))
        rows.append(row)
    tg = grid_object(name + '_tongue', rows); flip_toward(tg, (0, 0, 1))
    so = tg.modifiers.new('sol', 'SOLIDIFY'); so.thickness = 0.0042; so.offset = -1
    tg.modifiers.new('sub', 'SUBSURF').levels = 1
    tg.data.materials.append(collar_m); parts.append(tg)

    # eyelets either side of the slot, laces criss-crossed through them, a bow at the top
    holes = {}
    for k, t in enumerate(EYELETS):
        for side in (-1, 1):
            x = last_cx(t) + side * (THROAT + 0.0088); y = boot_y(t)
            p, n = cast(cutb, (x, y, 0.3), (0, 0, -1))
            if p is None: continue
            holes[(k, side)] = (p, n)
            bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.0021, depth=0.0007, location=p + n * 0.0002)
            e = bpy.context.object; e.name = name + '_eyelet'; e.rotation_euler = n.to_track_quat('Z', 'Y').to_euler()
            e.data.materials.append(hole_m); parts.append(e)

    def top_z(x, y):
        p, n = cast(full, (x, y, 0.3), (0, 0, -1))
        return (p.z, n) if p is not None else (ZC, Vector((0, 0, 1)))

    def lace_segment(a, b_, lift, steps=12):
        pa, na = holes[a]; pb, nb = holes[b_]
        path, norms = [], []
        for s in range(steps):
            u = s / (steps - 1); p = pa.lerp(pb, u)
            z, n = top_z(p.x, p.y)
            z = max(p.z, z) + lift * math.sin(math.pi * u) ** 0.6 + 0.0009
            path.append(Vector((p.x, p.y, z))); norms.append(n)
        return ribbon(name + '_lace', path, 0.0056, norms, lace_m, thick=0.0012)

    if (0, -1) in holes and (0, 1) in holes: parts.append(lace_segment((0, -1), (0, 1), 0.0016))
    for k in range(len(EYELETS) - 1):
        if all(h in holes for h in ((k, -1), (k + 1, 1), (k, 1), (k + 1, -1))):
            parts.append(lace_segment((k, -1), (k + 1, 1), 0.0030))
            parts.append(lace_segment((k, 1), (k + 1, -1), 0.0018))
    kt = len(EYELETS) - 1
    if (kt, -1) in holes and (kt, 1) in holes:
        kp = (holes[(kt, -1)][0] + holes[(kt, 1)][0]) / 2
        kz, kn = top_z(kp.x, kp.y)
        knot = Vector((kp.x, kp.y, kz + 0.0035))
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.0048, location=knot)
        kb = bpy.context.object; kb.name = name + '_knot'; kb.scale = (1.0, 0.75, 0.55); bpy.ops.object.shade_smooth()
        kb.data.materials.append(lace_m); parts.append(kb)
        for side in (-1, 1):                              # the two loops of the bow, lying on the instep
            loop = []
            for s in range(25):
                a = 2 * math.pi * s / 24
                lx = 0.016 * (1 - math.cos(a)) * 0.5; ly = 0.0075 * math.sin(a)
                ang = math.radians(200 if side < 0 else -20)
                dx = lx * math.cos(ang) - ly * math.sin(ang); dy = lx * math.sin(ang) + ly * math.cos(ang)
                x, y = knot.x + dx, knot.y + dy
                z, _ = top_z(x, y)
                loop.append(Vector((x, y, max(z + 0.0018, knot.z - 0.004 + 0.004 * math.sin(a / 2)))))
            parts.append(ribbon(name + '_bow', loop, 0.0052, (0, 0, 1), lace_m, thick=0.0011))
        for side in (-1, 1):                              # the two ends: over the side, down onto the floor
            hw = last_hw(0.66)
            if lace_ends == 'floor':
                ctrl = [knot, knot + Vector((side * 0.010, 0.004, 0.0)), Vector((last_cx(0.68) + side * (hw * 0.80), knot.y + 0.010, risen(0.046))),
                        Vector((last_cx(0.70) + side * (hw + 0.005), knot.y + 0.016, 0.018)),
                        Vector((last_cx(0.72) + side * (hw + 0.014), knot.y + 0.024 + 0.010 * side, STUD_TIP + 0.0017)),
                        Vector((last_cx(0.74) + side * (hw + 0.022), knot.y + 0.030 + 0.016 * side, STUD_TIP + 0.0017))]
            else:
                ctrl = [knot, knot + Vector((side * 0.010, 0.004, 0.0)), Vector((last_cx(0.68) + side * (hw * 0.80), knot.y + 0.012, risen(0.045))),
                        Vector((last_cx(0.70) + side * (hw + 0.004), knot.y + 0.020, risen(0.030)))]
            path = catmull(ctrl, 28)
            norms = []
            for p in path:                                # lying on the instep, then on the side, then on the floor
                up = min(1.0, max(0.0, (p.z - 0.03) / 0.02)) + min(1.0, max(0.0, (0.004 - p.z) / 0.008))
                norms.append((Vector((side, 0, 0)) * (1 - min(1.0, up)) + Vector((0, 0, 1)) * min(1.0, up)).normalized())
            parts.append(ribbon(name + '_laceend', path, 0.0055, norms, lace_m, thick=0.0010))

    # the side stripe (both sides): even width, rounded ends, stitched along its edges
    C = [Vector((0, y, risen(z))) for y, z in ((-0.113, 0.0285), (-0.084, 0.0272), (-0.050, 0.0292), (-0.016, 0.0362),
                                               (0.010, 0.0468), (0.027, 0.0560))]
    cl = catmull(C, 46); W = 0.0132
    for side in (-1, 1):
        rows = []; length = [0.0]
        for k in range(1, len(cl)): length.append(length[-1] + (cl[k] - cl[k - 1]).length)
        for k, c in enumerate(cl):
            tan = (cl[min(k + 1, len(cl) - 1)] - cl[max(k - 1, 0)]).normalized()
            nrm = Vector((0, -tan.z, tan.y))
            s = length[k] / length[-1]; e = 0.06
            wk = W * (math.sqrt(max(0.0, 1 - ((e - s) / e) ** 2)) if s < e else math.sqrt(max(0.0, 1 - ((s - (1 - e)) / e) ** 2)) if s > 1 - e else 1.0)
            wk = max(wk, W * 0.08)
            row = []
            for j in range(5):
                q = c + nrm * (wk * (j / 4 - 0.5))
                t = (q.y - Y0) / L_BOOT
                p, n = cast(cutb, (last_cx(t) + side * 0.2, q.y, q.z), (-side, 0, 0))
                row.append(p + n * 0.0009 if p is not None else Vector((last_cx(t) + side * last_hw(t), q.y, q.z)))
            rows.append(row)
        sg = grid_object(name + '_stripe', rows, uv=lambda i, j: (length[i], j / 4))
        flip_toward(sg, (side, 0, 0))
        so = sg.modifiers.new('sol', 'SOLIDIFY'); so.thickness = 0.0008; so.offset = -1
        sg.data.materials.append(stripe_m); parts.append(sg)

    # sole plate (white, its rim shows all round) and twelve studs (round 8: longer, two more down the middle)
    outline = []
    for k in range(64):
        t = k / 63; outline.append((last_cx(t) + last_hw(t) + 0.0017, boot_y(t)))
    outline += [(last_cx(t) - last_hw(t) - 0.0017, boot_y(t)) for t in [k / 63 for k in range(63, -1, -1)]]
    bm = bmesh.new()
    vb = [bm.verts.new((x, y, 0.004)) for x, y in outline]
    vt = [bm.verts.new((x, y, 0.0112)) for x, y in outline]
    for k in range(len(outline)):
        k1 = (k + 1) % len(outline)
        bm.faces.new((vb[k], vb[k1], vt[k1], vt[k]))
    bm.faces.new(list(reversed(vb))); bm.faces.new(vt)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    sharp = [e for e in bm.edges if len(e.link_faces) == 2 and abs(e.link_faces[0].normal.dot(e.link_faces[1].normal)) < 0.5]
    bmesh.ops.bevel(bm, geom=sharp + list({v for e in sharp for v in e.verts}), offset=0.0016, segments=3, affect='EDGES', profile=0.5)
    me = bpy.data.meshes.new(name + '_sole'); bm.to_mesh(me); bm.free()
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    so_ = link(bpy.data.objects.new(name + '_sole', me)); so_.data.materials.append(sole_m); parts.append(so_)
    for sx, t in [(-0.024, 0.60), (0.024, 0.60), (-0.0295, 0.74), (0.0295, 0.74), (-0.020, 0.88), (0.020, 0.88),
                  (0.0, 0.67), (0.0, 0.81), (-0.019, 0.075), (0.019, 0.075), (-0.021, 0.215), (0.021, 0.215)]:
        x, y = last_cx(t) + sx, boot_y(t)
        bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.0080, radius2=0.0044, depth=0.004 - STUD_TIP, location=(x, y, (0.004 + STUD_TIP) / 2))
        st = bpy.context.object; st.name = name + '_stud'; st.rotation_euler = (math.pi, 0, 0)
        bv = st.modifiers.new('bev', 'BEVEL'); bv.width = 0.0012; bv.segments = 2
        bpy.ops.object.shade_smooth(); st.data.materials.append(stud_m); parts.append(st)
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.0099, depth=0.0016, location=(x, y, 0.0036))
        wa = bpy.context.object; wa.name = name + '_studbase'; bpy.ops.object.shade_smooth(); wa.data.materials.append(stud_m); parts.append(wa)

    root = link(bpy.data.objects.new(name + '_root', None))
    for o in parts: o.parent = root
    root.location = loc; root.rotation_euler = (0, tilt, rot)
    if mirror: root.scale = (-1, 1, 1)
    return root


# ---------------------------------------------------------------- the backpack
BW, BD, BH = 0.30, 0.16, 0.465


def pack_ring(z, n=64, ex=4.0):
    A, B = BW / 2, BD / 2
    Rb, Rf, Rs = 0.016, 0.072, 0.036
    a, b = A, B
    if z < Rb:
        s = (Rb - z) / Rb; d = Rb * (1 - math.sqrt(max(0.0, 1 - s * s))); a -= d; b -= d
    sf = min(1.0, max(0.0, (z - (BH - Rf)) / Rf)); b -= Rf * (1 - math.sqrt(max(0.0, 1 - sf * sf)))
    ss = min(1.0, max(0.0, (z - (BH - Rs)) / Rs)); a -= Rs * (1 - math.sqrt(max(0.0, 1 - ss * ss)))
    pts = []
    for k in range(n):
        th = 2 * math.pi * k / n
        x = a * sgnpow(math.cos(th), 2 / ex); y = b * sgnpow(math.sin(th), 2 / ex)
        pts.append((x, y))
    return pts


def soften(x, y, z):
    """A soft leather bag, not a box: the front and back belly out, the top sinks a little, a few creases."""
    A, B = BW / 2, BD / 2
    fx = max(0.0, 1 - (x / A) ** 2)
    fy = (abs(y) / B) ** 3
    belly = (0.017 if y < 0 else 0.011) * fx * math.sin(math.pi * min(1.0, z / BH)) ** 0.8 * fy
    y += math.copysign(belly, y)
    z -= 0.028 * fx * max(0.0, (z - 0.68 * BH) / (0.32 * BH)) ** 1.4 * (1 - (y / B) ** 2 * 0.35)
    # soft leather: horizontal creases low on the panels, a few diagonal ones, the sides pinch in a little
    crease = (0.0030 * math.sin(z * 34 + x * 6 + 0.8) * math.sin(x * 15 + 1.3) * max(0.0, 1 - z / (0.6 * BH))
              + 0.0020 * math.sin((x + z) * 27 + 2.1) * math.sin(z * 13) + 0.0010 * math.sin(x * 47 - z * 23))
    y += math.copysign(crease * (0.4 + 0.6 * fy), y)
    fs = (abs(x) / A) ** 4
    x -= math.copysign(0.008 * fs * math.sin(math.pi * min(1.0, z / BH)) * (1 - (y / B) ** 2), x)
    x += 0.010 * (z / BH) ** 2                      # the top slumps to one side
    return x, y, z


def backpack(name, loc, rot, col=(0.011, 0.031, 0.095)):
    front_m = _front_material(name + '_front', col)
    brass = plain(name + '_brass', (0.80, 0.56, 0.26), rough=0.3, Metallic=1.0)
    teeth = zip_teeth(name + '_teeth')
    tape = plain(name + '_tape', (col[0] * 0.7, col[1] * 0.7, col[2] * 0.7), rough=0.85, **{'Sheen Weight': 0.3})
    strap_m = stitched(name + '_strap', col, (0.10, 0.11, 0.14), rough=0.4, coat=0.2)
    parts = []

    nz = 56
    zs = [BH * (0.5 - 0.5 * math.cos(math.pi * k / (nz - 1))) for k in range(nz)]
    bm = bmesh.new(); rings = []
    for z in zs:
        rings.append([bm.verts.new(soften(x, y, z)) for x, y in pack_ring(z)])
    n = len(rings[0])
    for r0, r1 in zip(rings, rings[1:]):
        for j in range(n): bm.faces.new((r0[j], r0[(j + 1) % n], r1[(j + 1) % n], r1[j]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    body = link(bpy.data.objects.new(name, me))
    body.data.materials.append(front_m)
    sub = body.modifiers.new('sub', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
    parts.append(body)
    bv = bvh_of(body)

    # the main zip: up one side near the front edge, over the top, down the other side
    yz = -BD / 2 + 0.021
    path, norms = [], []
    centre = Vector((0, yz, BH * 0.52))
    for k in range(121):
        th = math.radians(-140 + 280 * k / 120)
        d = Vector((math.sin(th), 0, math.cos(th)))
        p, nn = cast(bv, centre + d * 0.6, -d)
        if p is None or p.z < 0.075: continue
        path.append(p); norms.append(nn)
    if len(path) > 4:
        parts.append(ribbon(name + '_tape', path, 0.013, norms, tape, thick=0.0012, offset=0.0006))
        parts.append(ribbon(name + '_zip', path, 0.0046, norms, teeth, thick=0.0016, offset=0.0016))
        top = max(range(len(path)), key=lambda k: path[k].z)
        for dk in (-3, 3):                                    # two sliders meeting at the top, pulls hanging forward
            k = max(1, min(len(path) - 2, top + dk))
            p, nn = path[k], norms[k]; tan = (path[k + 1] - path[k - 1]).normalized()
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=p + nn * 0.004)
            sl = bpy.context.object; sl.name = name + '_slider'; sl.scale = (0.011, 0.0065, 0.004)
            sl.rotation_euler = Matrix((tan, nn.cross(tan), nn)).transposed().to_euler()
            bvl = sl.modifiers.new('bev', 'BEVEL'); bvl.width = 0.0015; bvl.segments = 2
            sl.data.materials.append(brass); parts.append(sl)
            pull = []
            for s_ in range(6):                           # a short leather pull lying over the rounded front edge
                q, qn = cast(bv, p + tan * 0.004 * (1 if dk > 0 else -1) + Vector((0, -0.0045 * s_, 0.3)), (0, 0, -1))
                if q is None: break
                pull.append(q + qn * 0.003)
            if len(pull) >= 3:
                parts.append(ribbon(name + '_pull', catmull(pull, 10), 0.0085, nn, strap_m, thick=0.0022))

    # front: zipped pocket a little below the seam
    zp = BH * 0.50; xs = [-0.088 + 0.166 * k / 30 for k in range(31)]
    zpath, znorm = [], []
    for x in xs:
        p, nn = cast(bv, (x, -0.5, zp), (0, 1, 0))
        if p is not None: zpath.append(p); znorm.append(nn)
    if len(zpath) > 4:
        parts.append(ribbon(name + '_pocketzip', zpath, 0.0042, znorm, teeth, thick=0.0012, offset=0.0007))
        p, nn = zpath[-1], znorm[-1]
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=p + nn * 0.003)
        sl = bpy.context.object; sl.name = name + '_slider'; sl.scale = (0.010, 0.004, 0.0062); sl.data.materials.append(brass); parts.append(sl)
        tab = [p + nn * 0.004 + Vector((0.004, 0, -0.002)), p + nn * 0.005 + Vector((0.006, 0, -0.016)), p + nn * 0.004 + Vector((0.006, 0, -0.028))]
        parts.append(ribbon(name + '_pull', catmull(tab, 8), 0.0085, (0, -1, 0), strap_m, thick=0.0025))

    # top handle: a leather strap arching up from two stitched tabs
    hp, hn = [], []
    for k, (x, up) in enumerate([(-0.042, 0.0), (-0.036, 0.034), (-0.018, 0.060), (0.0, 0.066), (0.018, 0.060), (0.036, 0.034), (0.042, 0.0)]):
        p, _ = cast(bv, (x, 0.012, 1.0), (0, 0, -1))
        z = (p.z if p is not None else BH) - 0.002
        hp.append(Vector((x, 0.012, z + up)))
    hpath = catmull(hp, 30)
    hn = []
    for k, p in enumerate(hpath):
        tan = (hpath[min(k + 1, len(hpath) - 1)] - hpath[max(k - 1, 0)]).normalized()
        hn.append(tan.cross(Vector((0, 1, 0))).normalized())
    parts.append(ribbon(name + '_handle', hpath, 0.024, hn, strap_m, thick=0.0062))
    for x in (-0.042, 0.042):
        p, nn = cast(bv, (x, 0.012, 1.0), (0, 0, -1))
        if p is None: continue
        parts.append(ribbon(name + '_tab', [p + Vector((-0.016 if x < 0 else 0.016, 0, 0.0)), p, p + Vector((0.012 if x < 0 else -0.012, 0, 0))],
                            0.030, nn, strap_m, thick=0.0025, offset=0.0008))

    # shoulder straps on the back: padded from the top, webbing to brass buckles at the bottom corners
    for side in (-1, 1):
        ctrl = [Vector((side * 0.024, BD / 2 - 0.004, BH - 0.045)), Vector((side * 0.045, BD / 2 + 0.024, BH - 0.15)),
                Vector((side * 0.080, BD / 2 + 0.034, BH - 0.27)), Vector((side * 0.105, BD / 2 + 0.026, 0.12)),
                Vector((side * (BW / 2 - 0.028), BD / 2 + 0.004, 0.040))]
        sp_ = catmull(ctrl, 40)
        pad, web = sp_[:30], sp_[28:]
        wpad = [0.034 + 0.024 * math.sin(math.pi * min(1.0, k / 26)) ** 0.6 for k in range(len(pad))]
        parts.append(ribbon(name + '_strap', pad, wpad, (0, 1, 0), strap_m, thick=0.0095))
        parts.append(ribbon(name + '_webbing', web, 0.024, (0, 1, 0), strap_m, thick=0.003))
        b0 = web[len(web) // 2]
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=b0 + Vector((0, 0.004, 0)))
        bk = bpy.context.object; bk.name = name + '_buckle'; bk.scale = (0.030, 0.003, 0.020)
        tan = (web[len(web) // 2 + 1] - web[len(web) // 2 - 1]).normalized()
        bk.rotation_euler = (0, math.atan2(tan.x, tan.z) * -1, 0)
        bvl = bk.modifiers.new('bev', 'BEVEL'); bvl.width = 0.002; bvl.segments = 2
        bk.data.materials.append(brass); parts.append(bk)

    root = link(bpy.data.objects.new(name + '_root', None))
    for o in parts: o.parent = root
    root.location = loc; root.rotation_euler = (0, 0, rot)
    return root


def _front_material(name, col):
    """The bag's leather with the front panel seam (a stitched groove across the front at 61 % of the height)."""
    m = leather(name, col, rough=0.34, coat=0.22, grain=650.0, crease=24.0, bump=0.45)
    nt = m.node_tree; N, L = nt.nodes, nt.links; b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    # only on the front (y < 0)
    fr = N.new('ShaderNodeMath'); fr.operation = 'LESS_THAN'; L.new(sep.outputs['Y'], fr.inputs[0]); fr.inputs[1].default_value = -BD / 2 + 0.02
    lines = []
    for z0, w in ((BH * 0.61, 0.0011), (BH * 0.61 - 0.006, 0.0005)):
        d = N.new('ShaderNodeMath'); d.operation = 'SUBTRACT'; L.new(sep.outputs['Z'], d.inputs[0]); d.inputs[1].default_value = z0
        ad = N.new('ShaderNodeMath'); ad.operation = 'ABSOLUTE'; L.new(d.outputs[0], ad.inputs[0])
        near = N.new('ShaderNodeMath'); near.operation = 'LESS_THAN'; L.new(ad.outputs[0], near.inputs[0]); near.inputs[1].default_value = w
        lines.append(near.outputs[0])
    groove = N.new('ShaderNodeMath'); groove.operation = 'MULTIPLY'; L.new(lines[0], groove.inputs[0]); L.new(fr.outputs[0], groove.inputs[1])
    dash = N.new('ShaderNodeMath'); dash.operation = 'MULTIPLY'; L.new(sep.outputs['X'], dash.inputs[0]); dash.inputs[1].default_value = 300.0
    df = N.new('ShaderNodeMath'); df.operation = 'FRACT'; L.new(dash.outputs[0], df.inputs[0])
    on = N.new('ShaderNodeMath'); on.operation = 'LESS_THAN'; L.new(df.outputs[0], on.inputs[0]); on.inputs[1].default_value = 0.6
    st = N.new('ShaderNodeMath'); st.operation = 'MULTIPLY'; L.new(lines[1], st.inputs[0]); L.new(on.outputs[0], st.inputs[1])
    st2 = N.new('ShaderNodeMath'); st2.operation = 'MULTIPLY'; L.new(st.outputs[0], st2.inputs[0]); L.new(fr.outputs[0], st2.inputs[1])
    # darken the groove, lighten the stitches a touch, and dent the bump
    base = b.inputs['Base Color'].links[0].from_socket if b.inputs['Base Color'].links else None
    mix1 = N.new('ShaderNodeMix'); mix1.data_type = 'RGBA'
    if base: L.new(base, mix1.inputs[6])
    else: mix1.inputs[6].default_value = (*col, 1)
    mix1.inputs[7].default_value = (col[0] * 0.35, col[1] * 0.35, col[2] * 0.35, 1); L.new(groove.outputs[0], mix1.inputs['Factor'])
    mix2 = N.new('ShaderNodeMix'); mix2.data_type = 'RGBA'; L.new(mix1.outputs[2], mix2.inputs[6])
    mix2.inputs[7].default_value = (col[0] * 1.8 + 0.02, col[1] * 1.8 + 0.02, col[2] * 1.6 + 0.02, 1); L.new(st2.outputs[0], mix2.inputs['Factor'])
    L.new(mix2.outputs[2], b.inputs['Base Color'])
    bump = N['Bump']; hsrc = bump.inputs['Height'].links[0].from_socket
    dent = N.new('ShaderNodeMath'); dent.operation = 'MULTIPLY_ADD'; L.new(groove.outputs[0], dent.inputs[0]); dent.inputs[1].default_value = -2.0; L.new(hsrc, dent.inputs[2])
    L.new(dent.outputs[0], bump.inputs['Height'])
    return m


# ---------------------------------------------------------------- the ball (round 8)
BALL_R = 0.111                        # a size 5 ball


def ball_texture(res=2048):
    """The ball's print as an equirectangular map (colour and height), made here so no image is needed: four panels
    (tetrahedral, like a modern match ball) with curved seams, each with two colour swooshes on white that swell
    and thin around it (blue with small stars, red, green), the seams pressed in. No text, no marks.
    Returns (colour path, height path) in the props cache."""
    import numpy as np
    from PIL import Image
    os.makedirs(CACHE, exist_ok=True)
    pc, ph = os.path.join(CACHE, 'ball_col.png'), os.path.join(CACHE, 'ball_h.png')
    W, H = res, res // 2
    lon = (np.arange(W) + 0.5) / W * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(H) + 0.5) / H * np.pi
    LON, LAT = np.meshgrid(lon, lat)
    d = np.stack([np.cos(LAT) * np.cos(LON), np.cos(LAT) * np.sin(LON), np.sin(LAT)], -1)
    # the panels' seams curve: classify a twisted copy of the sphere
    a = 1.1 * d[..., 2]
    dw = np.stack([d[..., 0] * np.cos(a) - d[..., 1] * np.sin(a), d[..., 0] * np.sin(a) + d[..., 1] * np.cos(a), d[..., 2]], -1)
    C = np.array([(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)], float) / math.sqrt(3)
    dots = dw @ C.T
    order = np.sort(dots, -1)
    k = np.argmax(dots, -1)
    m = order[..., -1] - order[..., -2]                     # 0 on a seam, 4/3 in a panel's middle
    E1 = np.cross(C, np.array([0.3, 0.5, 0.8])); E1 /= np.linalg.norm(E1, axis=1, keepdims=True)
    E2 = np.cross(C, E1)
    th = np.arctan2(np.einsum('hwc,hwc->hw', dw, E2[k]), np.einsum('hwc,hwc->hw', dw, E1[k]))
    phase = np.array([0.0, 2.1, 4.0, 5.3])[k]
    sw = lambda x: (0.5 + 0.5 * np.sin(x)) ** 2
    t1 = 0.16 + 0.68 * sw(th + phase)                       # the outer swoosh hugs the seams
    t2 = 0.06 + 0.34 * sw(th + phase + 2.6)                 # the inner one, out of step with it
    g0, gap = 0.035, 0.03
    aa = 0.006
    step = lambda x: np.clip(x / aa + 0.5, 0.0, 1.0)
    band1 = step(m - g0) * step(g0 + t1 - m)
    band2 = step(m - (g0 + t1 + gap)) * step(g0 + t1 + gap + t2 - m)
    white = np.array([0.95, 0.95, 0.93])
    blue, red, green, star = np.array([0.04, 0.20, 0.72]), np.array([0.84, 0.06, 0.12]), np.array([0.03, 0.52, 0.22]), np.array([0.45, 0.64, 1.0])
    first = np.stack([blue, red, green, blue])[k]
    second = np.stack([red, green, blue, green])[k]
    col = white * (1 - band1[..., None]) + first * band1[..., None]
    col = col * (1 - band2[..., None]) + second * band2[..., None]
    # small five-point stars on the blue swooshes (points spread evenly over the ball)
    n = 240; i = np.arange(n) + 0.5
    zz = 1 - 2 * i / n; rr = np.sqrt(1 - zz * zz); ph_ = np.pi * (3 - math.sqrt(5)) * i
    S = np.stack([rr * np.cos(ph_), rr * np.sin(ph_), zz], -1)
    Sa = np.cross(S, np.array([0.0, 0.0, 1.0]) + 1e-3); Sa /= np.linalg.norm(Sa, axis=1, keepdims=True); Sb = np.cross(S, Sa)
    starm = np.zeros((H, W))
    isblue = (k == 0) | (k == 3)
    for r0 in range(0, H, 64):
        dd = d[r0:r0 + 64].reshape(-1, 3).astype(np.float32)
        j = np.argmax(dd @ S.T.astype(np.float32), -1)
        x = np.einsum('pc,pc->p', dd, Sa[j]); y = np.einsum('pc,pc->p', dd, Sb[j])
        r = np.hypot(x, y); f = np.arctan2(y, x)
        R = 0.034 * (0.42 + 0.58 * ((1 + np.cos(5 * f)) / 2) ** 2.5)
        starm[r0:r0 + 64] = np.clip((R - r) / 0.004 + 0.5, 0, 1).reshape(-1, W)
    starm *= band1 * isblue
    col = col * (1 - starm[..., None]) + star * starm[..., None]
    # height: the seams pressed in, the swooshes a hair proud of the white
    h = np.clip(m / 0.03, 0, 1) ** 0.6 * 0.8 + 0.12 * band1 + 0.08 * band2
    Image.fromarray((np.clip(col, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB').save(pc)
    Image.fromarray((np.clip(h, 0, 1) * 65535 + 0.5).astype(np.uint16)).save(ph)
    return pc, ph


def ball(name, loc, rot=(0.0, 0.0, 0.0)):
    """A glossy modern match ball with the print from ball_texture(), mapped by direction (no UV seams to hide).
    loc is its centre; rot (radians, xyz) turns the print toward the camera. Returns the object."""
    pc, ph = ball_texture()
    m, nt, N, L, b = _mat(name)
    tc = N.new('ShaderNodeTexCoord')
    nv = N.new('ShaderNodeVectorMath'); nv.operation = 'NORMALIZE'; L.new(tc.outputs['Object'], nv.inputs[0])
    sp = N.new('ShaderNodeSeparateXYZ'); L.new(nv.outputs['Vector'], sp.inputs[0])
    u = _math(N, L, 'MULTIPLY_ADD', _math(N, L, 'ARCTAN2', sp.outputs['Y'], sp.outputs['X']), 1 / (2 * math.pi), 0.5)
    v = _math(N, L, 'MULTIPLY_ADD', _math(N, L, 'ARCSINE', sp.outputs['Z']), 1 / math.pi, 0.5)
    cb = N.new('ShaderNodeCombineXYZ'); L.new(u, cb.inputs[0]); L.new(v, cb.inputs[1])
    ic = N.new('ShaderNodeTexImage'); ic.image = bpy.data.images.load(pc, check_existing=True); ic.extension = 'REPEAT'
    ih = N.new('ShaderNodeTexImage'); ih.image = bpy.data.images.load(ph, check_existing=True); ih.extension = 'REPEAT'
    ih.image.colorspace_settings.name = 'Non-Color'
    for t in (ic, ih): L.new(cb.outputs[0], t.inputs['Vector'])
    L.new(ic.outputs['Color'], b.inputs['Base Color'])
    # the cover's fine texture (tiny dimples) on top of the seams
    vo = N.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 900.0; L.new(tc.outputs['Object'], vo.inputs['Vector'])
    hh = _math(N, L, 'MULTIPLY_ADD', vo.outputs['Distance'], 0.08, ih.outputs['Color'])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.5; bp.inputs['Distance'].default_value = 0.0012
    L.new(hh, bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = 0.4
    b.inputs['Coat Weight'].default_value = 0.55; b.inputs['Coat Roughness'].default_value = 0.14
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=BALL_R, location=loc)
    o = bpy.context.object; o.name = name; bpy.ops.object.shade_smooth()
    o.scale = (1.0, 1.0, 0.985)                       # it sits a little on the floor
    o.rotation_euler = rot
    o.data.materials.append(m)
    return o
