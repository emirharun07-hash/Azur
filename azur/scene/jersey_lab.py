"""A quick look at the jerseys alone (Runde 22: the owner's photos of the real shirts): the three national jerseys on
their hangers in a plain studio, rendered front-on, so a new fabric can be judged before the room is rendered again.

    python3 azur/scene/jersey_lab.py real    -> azur/previews/jerseys_real.jpg  (draped anew from assets/jerseys/real)
    python3 azur/scene/jersey_lab.py fit     -> azur/previews/jerseys_fit.jpg   (the frozen drapes in the photos, photo_warp.py)
    python3 azur/scene/jersey_lab.py old     -> azur/previews/jerseys_old.jpg   (the frozen drapes with the shop images)
Env: AZUR_LAB_SAMPLES (64), AZUR_LAB_RES (1600x900)
"""
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import garment

KEYS = ['brasilien', 'deutschland', 'tuerkei']


def photos(kind, k):
    if kind == 'real':
        return (f'{ROOT}/assets/jerseys/real/{k}-vorne.webp', f'{ROOT}/assets/jerseys/real/{k}-hinten.webp')
    if kind == 'fit':                                                        # the photos bent onto the frozen drapes
        return (f'{ROOT}/assets/jerseys/real/{k}-vorne-fit.webp', f'{ROOT}/assets/jerseys/real/{k}-hinten-fit.webp')
    return (f'{ROOT}/assets/jerseys/back/{k}-vorne-v2.webp', f'{ROOT}/assets/jerseys/back/{k}-hinten-v2.webp')


def main(kind):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = int(os.environ.get('AZUR_LAB_SAMPLES', 64)); sc.cycles.use_denoising = True
    w, h = (int(x) for x in os.environ.get('AZUR_LAB_RES', '1600x900').split('x'))
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.view_settings.view_transform = 'AgX'
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.8, 0.8, 0.8, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.15
    if kind == 'real': os.environ['AZUR_RESIM'] = '1'                       # new sewing patterns: drape them anew
    wood = bpy.data.materials.new('hanger'); wood.use_nodes = True
    wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.35, 0.2, 0.1, 1)
    one = os.environ.get('AZUR_LAB_ONE')          # one jersey framed like a shop photo (portrait, close)
    knit = os.path.join(ROOT, '.cache', 'ph', 'tex', 'cotton_jersey')
    knit = next((os.path.join(knit, f) for f in sorted(os.listdir(knit)) if 'nor_gl' in f), None) if os.path.isdir(knit) else None
    for i, k in enumerate([one] if one else KEYS):
        jo, hg = garment.jersey('jersey_' + k, *photos(kind, k), knit_normal=knit, hanger_mat=wood)
        mt = Matrix.Translation((0 if one else (i - 1) * 0.62, 0, 1.9))
        jo.matrix_world = mt; hg.matrix_world = mt
    # backdrop and light
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0.6, 1.5), rotation=(math.pi / 2, 0, 0))
    bd = bpy.context.object; m = bpy.data.materials.new('bd'); m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.75, 0.74, 0.72, 1); bd.data.materials.append(m)
    for loc, en, rot in (((-2.2, -3, 3.2), 260, (math.radians(55), 0, math.radians(-35))), ((2.5, -2.5, 2.0), 90, (math.radians(65), 0, math.radians(45)))):
        bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); l = bpy.context.object; l.data.energy = en; l.data.size = 3
    bpy.ops.object.camera_add(location=(0, -4.2, 1.6), rotation=(math.radians(90), 0, 0)); cam = bpy.context.object
    cam.data.lens = 62; sc.camera = cam
    if one:   # shop-photo framing: the shirt fills a portrait frame, a big soft light from the front
        cam.location = (0, -2.2, 1.55); cam.data.lens = 70
        bpy.ops.object.light_add(type='AREA', location=(0, -2.6, 1.8), rotation=(math.radians(90), 0, 0)); l = bpy.context.object
        l.data.energy = 55; l.data.size = 2.5
    out = os.path.join(ROOT, 'previews', f"jerseys_{kind}{os.environ.get('AZUR_LAB_TAG', '')}.jpg"); os.makedirs(os.path.dirname(out), exist_ok=True)
    sc.render.image_settings.file_format = 'JPEG'; sc.render.filepath = out
    bpy.ops.render.render(write_still=True); print('wrote', out, flush=True)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'real')
