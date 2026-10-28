"""Runde 16: the cart icon as a real 3D sports duffle bag, rendered in Blender (Cycles) on a transparent background.

    python3 azur/design/render_bag.py [variant ...]     -> azur/design/img/bag-<variant>.webp (and -sm, 96 px high)

A soft barrel duffle: a cylinder lying along x (1.0 long, 0.5 across) with a flattened bottom, bevelled and subdivided;
end panels and a piping ring by material (|x| near the ends), a zipper along the top with a pull, two carry handles
(one anchored on the front, one on the back, meeting over the zipper), optionally a shoulder strap, three stripes or the
Azur signature (shrink-wrapped onto the front). Studio light, a shadow catcher for a soft ground shadow, camera 3/4 from
the front left so one end panel shows.
"""
import math
import os
import sys

import bpy
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'img')

# body, end panels, handles/zipper, stripes, decal ('paper' white / 'ink' black / None), shoulder strap
VARIANTS = {
    'black': dict(body=(.008, .008, .009), ends=(.05, .05, .052), trim=(.004, .004, .004), decal='paper'),
    'white': dict(body=(.62, .60, .56), ends=(.40, .39, .37), trim=(.008, .008, .008), decal='ink'),
    'contrast': dict(body=(.008, .008, .009), ends=(.62, .60, .56), trim=(.006, .006, .006), decal='paper'),
    'stripes': dict(body=(.008, .008, .009), ends=(.05, .05, .052), trim=(.006, .006, .006), stripes=(.62, .60, .56)),
    'strap': dict(body=(.008, .008, .009), ends=(.05, .05, .052), trim=(.006, .006, .006), decal='paper', strap=True),
    'grey': dict(body=(.20, .20, .20), ends=(.016, .016, .017), trim=(.006, .006, .006), decal='paper'),
}


def principled(name, color, rough=.85, sheen=.4):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Specular IOR Level'].default_value = .3
    if 'Sheen Weight' in b.inputs: b.inputs['Sheen Weight'].default_value = sheen
    return m


def body_material(v):
    """fabric; end panels where |x| > 0.43, optional stripes around the middle (object coordinates)"""
    m = bpy.data.materials.new('body'); m.use_nodes = True
    nt = m.node_tree; n = nt.nodes; L = nt.links
    b = n['Principled BSDF']; b.inputs['Roughness'].default_value = .8; b.inputs['Specular IOR Level'].default_value = .12
    if 'Sheen Weight' in b.inputs: b.inputs['Sheen Weight'].default_value = .1
    tc = n.new('ShaderNodeTexCoord'); sep = n.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    ax = n.new('ShaderNodeMath'); ax.operation = 'ABSOLUTE'; L.new(sep.outputs['X'], ax.inputs[0])
    ends = n.new('ShaderNodeMath'); ends.operation = 'GREATER_THAN'; ends.inputs[1].default_value = .455; L.new(ax.outputs[0], ends.inputs[0])
    mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*v['body'], 1); mix.inputs['B'].default_value = (*v['ends'], 1)
    L.new(ends.outputs[0], mix.inputs['Factor'])
    col = mix.outputs['Result']
    if v.get('stripes'):
        # three bands: |x - c| < 0.018 for c in (-0.07, 0, 0.07)
        acc = None
        for c in (-.07, 0, .07):
            sub = n.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'; sub.inputs[1].default_value = c; L.new(sep.outputs['X'], sub.inputs[0])
            ab = n.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; L.new(sub.outputs[0], ab.inputs[0])
            lt = n.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .018; L.new(ab.outputs[0], lt.inputs[0])
            if acc is None: acc = lt
            else:
                mx = n.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; L.new(acc.outputs[0], mx.inputs[0]); L.new(lt.outputs[0], mx.inputs[1]); acc = mx
        m2 = n.new('ShaderNodeMix'); m2.data_type = 'RGBA'; L.new(col, m2.inputs['A']); m2.inputs['B'].default_value = (*v['stripes'], 1)
        L.new(acc.outputs[0], m2.inputs['Factor']); col = m2.outputs['Result']
    L.new(col, b.inputs['Base Color'])
    return m


def tube(name, pts, depth, mat):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = depth; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for p, co in zip(sp.bezier_points, pts):
        p.co = co; p.handle_left_type = p.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(name, cu); ob.data.materials.append(mat); bpy.context.collection.objects.link(ob)
    return ob


def build(v):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 96; sc.cycles.use_denoising = True
    sc.render.film_transparent = True; sc.render.resolution_x = 900; sc.render.resolution_y = 700
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .12

    # body: a barrel lying along x, bottom flattened
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.25, depth=1.0, rotation=(0, math.pi / 2, 0)); body = bpy.context.object; body.name = 'body'
    bpy.ops.object.transform_apply(rotation=True)
    for vx in body.data.vertices:
        vx.co.z = max(vx.co.z, -.19)
    bv = body.modifiers.new('bevel', 'BEVEL'); bv.width = .07; bv.segments = 5; bv.limit_method = 'ANGLE'
    ss = body.modifiers.new('sub', 'SUBSURF'); ss.levels = ss.render_levels = 2
    bpy.ops.object.shade_smooth(); body.data.materials.append(body_material(v))
    top = .245

    trim = principled('trim', v['trim'], .6, .1)
    # zipper along the top, with a pull
    tube('zip', [(-.40, 0, top), (0, 0, top + .002), (.40, 0, top)], .008, trim)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(.26, -.03, top + .004), rotation=(math.radians(-25), 0, 0)); pull = bpy.context.object
    pull.scale = (.016, .05, .006); pull.data.materials.append(trim)
    # two carry handles: anchored low on the front and on the back, meeting over the zipper
    for s in (-1, 1):
        tube('handle', [(-.17, s * .245, .05), (-.15, s * .2, .31), (-.07, s * .06, .43), (.07, s * .06, .43), (.15, s * .2, .31), (.17, s * .245, .05)], .017, trim)
    if v.get('strap'):
        tube('strap', [(-.5, 0, .02), (-.36, 0, .58), (.36, 0, .58), (.5, 0, .02)], .012, trim)
    if v.get('decal'):
        img = bpy.data.images.load(os.path.join(OUT, f"azur-logo-{v['decal']}.webp"))
        m = bpy.data.materials.new('decal'); m.use_nodes = True
        nt = m.node_tree; n = nt.nodes; b = n['Principled BSDF']
        tex = n.new('ShaderNodeTexImage'); tex.image = img
        nt.links.new(tex.outputs['Color'], b.inputs['Base Color']); nt.links.new(tex.outputs['Alpha'], b.inputs['Alpha'])
        b.inputs['Roughness'].default_value = .7
        bpy.ops.mesh.primitive_plane_add(size=1, location=(.02, -.27, -.03), rotation=(math.pi / 2, 0, 0)); d = bpy.context.object
        d.scale = (.26, .123, 1); bpy.ops.object.transform_apply(scale=True)
        sd = d.modifiers.new('sub', 'SUBSURF'); sd.subdivision_type = 'SIMPLE'; sd.levels = sd.render_levels = 4
        sw = d.modifiers.new('wrap', 'SHRINKWRAP'); sw.target = body; sw.offset = .003
        d.data.materials.append(m)

    # ground shadow only
    bpy.ops.mesh.primitive_plane_add(size=2.2, location=(0, 0, -.19)); g = bpy.context.object; g.is_shadow_catcher = True

    # studio light
    def area(loc, energy, size, rot):
        bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); l = bpy.context.object; l.data.energy = energy; l.data.size = size
    area((-1.6, -1.8, 2.2), 130, 2.4, (math.radians(50), 0, math.radians(-40)))
    area((2.0, -1.2, 1.0), 40, 2.0, (math.radians(70), 0, math.radians(55)))
    area((0.4, 2.2, 1.6), 110, 1.6, (math.radians(-55), 0, math.radians(170)))

    bpy.ops.object.camera_add(location=(-1.6, -1.55, .95)); cam = bpy.context.object; sc.camera = cam
    cam.data.lens = 55
    tgt = bpy.data.objects.new('t', None); tgt.location = (0, 0, .02); sc.collection.objects.link(tgt)
    c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'


def render(key):
    build(VARIANTS[key])
    png = os.path.join(OUT, f'bag-{key}.png')
    bpy.context.scene.render.filepath = png; bpy.ops.render.render(write_still=True)
    im = Image.open(png).convert('RGBA')
    # the shadow catcher leaves a faint veil over the whole plane: drop the faintest alpha so only the soft shadow under the bag stays
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a < 22 else round((a - 22) * 255 / 233)))
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a < 14 else a))
    box = im.getchannel('A').point(lambda a: 255 if a > 6 else 0).getbbox()
    im = im.crop(box); pad = 8
    canvas = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad)); canvas.paste(im, (pad, pad))
    canvas.save(os.path.join(OUT, f'bag-{key}.webp'), quality=90)
    sm = canvas.resize((round(canvas.width * 96 / canvas.height), 96), Image.LANCZOS); sm.save(os.path.join(OUT, f'bag-{key}-sm.webp'), quality=92)
    os.remove(png)
    print(key, canvas.size, flush=True)


if __name__ == '__main__':
    for k in (sys.argv[1:] or VARIANTS):
        render(k)
