"""AZUR camera moves: pre-rendered flights between views, replacing the prototype's fake pans.

Renders room -> rail and room -> bed as image sequences (the way back plays them reversed).
The garments are part of the frames (scene2: they are real 3D garments in the room). Each frame's projected hanger
positions are stored in moves.json (track) for labels. Pull moves take one garment off the rail toward the camera.
Two light variants per move: 'day' (the approved golden-hour look, graded toward the clock in the browser)
and 'night' (the 22:30 mix of the light passes: night sky, neon, desk lamp, street light). The browser
crossfades them by how dark it is. Day frames of every move render first, so a usable set exists early.

Usage:  python3 azur/scene/render_moves.py              (all moves, resumable)
        python3 azur/scene/render_moves.py room-rail    (one move)
Env:    AZUR_MOVES_FPS=60  AZUR_MOVES_FRAMES=72  AZUR_MOVES_SAMPLES=128  AZUR_MOVES_RES=1920x1080  AZUR_MOVES_OUT=<dir> (tests)
Round 7: scene3 moves render 72 frames (1.2 s at 60 fps) with motion blur and become videos: <variant>.mp4/.webm and
<variant>_r.mp4/.webm (the way back) per move; moves.json has the average colour of the first and last frames.
On the owner's PC about 35 s a frame, ~45 min per move and variant.

scene3: no pull moves (a click opens the product view right away); three variants that match the times of day, each
with that state's objects: 'day' (midday light, also used in the morning), 'evening' (golden hour) and 'night'.
"""
import os, sys, json, math, time, subprocess
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_queue as rq   # reuses scene loading, views, light setup and git saving

# round 7 (the owner: "zu wackelig, nicht flüssig genug"): 60 frames a second with motion blur, one calm path (the
# position eases along a straight line, the view turns by slerp, the lens zooms evenly), the frames encoded as video
# (H.264 + VP9, forward and reversed: smooth, hardware-decoded playback, lighter than image strips). The PNG frames
# stay on this machine (.cache/moves); only the videos and moves.json go up.
FPS = int(os.environ.get('AZUR_MOVES_FPS', 60 if rq.HI else 30))
FRAMES = int(os.environ.get('AZUR_MOVES_FRAMES', round(1.2 * FPS)))
SAMPLES = int(os.environ.get('AZUR_MOVES_SAMPLES', 128 if rq.HI else 48))   # round 5: 48 smeared in the shade
RES = tuple(int(x) for x in os.environ.get('AZUR_MOVES_RES', '1920x1080' if rq.HI else '1280x720').split('x'))
VARIANTS = ('day', 'evening', 'night') if rq.HI else ('day', 'night')
STATE_OF = {'day': 'day', 'evening': 'evening', 'night': 'night'}
OUT = os.environ.get('AZUR_MOVES_OUT') or os.path.join(rq.ROOT, 'prototype', 'assets', rq.SET, 'moves')
FRAMES_DIR = os.environ.get('AZUR_MOVES_FRAMES_DIR') or os.path.join(rq.ROOT, '.cache', 'moves', rq.SET)
PULL_FRAMES = int(os.environ.get('AZUR_PULL_FRAMES', 14))
MOVES = {
    'room-rail': dict(a='room', b='rail', lift=0.0),     # round 7: no rise mid-flight (the doorway camera is high already)
    'room-bed':  dict(a='room', b='bed', lift=0.0),
}
# a chosen garment is taken off the rail toward the camera (camera stays): 'rail-rail@2' = view rail to view rail@2
PULL_RES = {'rail': (1280, 720), 'rail_m': (720, 800)}
for _v in ('rail', 'rail_m') if not rq.HI else ():
    for _i in range(6):
        MOVES[f'{_v}-{_v}@{_i}'] = dict(a=_v, b=f'{_v}@{_i}', pull=(_v, _i))


def ease(t):          # smooth start and stop
    return t * t * t * (t * (6 * t - 15) + 10)


def view_quat(v):
    V = rq.VIEWS[v]
    return (Vector(V['target']) - Vector(V['loc'])).to_track_quat('-Z', 'Y')


def camera_at(a, b, t, lift):
    """One easing for everything: the camera glides from view a to view b, turns by slerp and zooms evenly (the
    lens on a log scale). Round 6 and before: the eye led the body and the lens changed linearly, the picture swam."""
    A, B = rq.VIEWS[a], rq.VIEWS[b]
    e = ease(t)
    loc = Vector(A['loc']).lerp(Vector(B['loc']), e) + Vector((0, 0, lift * math.sin(math.pi * e)))
    rot = view_quat(a).slerp(view_quat(b), e)
    lens = A['lens'] * (B['lens'] / A['lens']) ** e
    return loc, rot, lens


def srgb2lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


GLOW = [srgb2lin(int('16B8FF'[i:i + 2], 16) / 255) for i in (0, 2, 4)]   # palette A glow, as the browser mixes the neon pass


def light_variant(sc, variant):
    """Same light rig as render_queue's passes, mixed with the prototype's daylight weights."""
    rq.render_settings(sc, 'beauty'); rq.lights_off(sc)
    sc.cycles.samples = SAMPLES; sc.cycles.adaptive_threshold = 0.02 if rq.HI else 0.04
    bg = sc.world.node_tree.nodes['Background'].inputs['Strength']
    nb = bpy.data.materials['neon_tube'].node_tree.nodes['Principled BSDF']
    if variant == 'day' and rq.HI:        # azur-config.js daylight key h 12.5
        bg.default_value = 2.2; rq.world_tint(sc, (1.0, 1.0, 1.0))
        s = bpy.data.objects['sun']; s.hide_render = False; s.data.energy = 3.0 * 0.75; s.data.color = (1.0, 0.96, 0.88)
        s.rotation_euler = Vector(rq.SUN['sun_high']).normalized().to_track_quat('-Z', 'Y').to_euler()
        nb.inputs['Emission Color'].default_value = (*[g * 0.08 for g in GLOW], 1); nb.inputs['Emission Strength'].default_value = 1.6
        sc.view_settings.exposure = 2.65
        if 'L_spot' in bpy.data.objects:
            P = bpy.data.objects['L_spot']; P.hide_render = False; P.data.energy = 60.0 * 0.3; P.data.color = (1.0, 0.82, 0.62)
    elif variant in ('day', 'evening'):   # golden hour, the approved stills
        bg.default_value = 2.2; rq.world_tint(sc, (1.0, 0.86, 0.72))
        s = bpy.data.objects['sun']; s.hide_render = False; s.data.energy = 3.0; s.data.color = (1.0, 0.60, 0.33)
        s.rotation_euler = Vector(rq.SUN['sun_low']).normalized().to_track_quat('-Z', 'Y').to_euler()
        nb.inputs['Emission Color'].default_value = (0.086, 0.722, 1.0, 1); nb.inputs['Emission Strength'].default_value = 1.6
        sc.view_settings.exposure = 2.65
        if 'L_spot' in bpy.data.objects:
            P = bpy.data.objects['L_spot']; P.hide_render = False; P.data.energy = 60.0 * 0.35; P.data.color = (1.0, 0.82, 0.62)
    else:                         # azur-config.js daylight key h 22.3 (scene3: h 0, he is asleep, the desk lamp is off)
        bg.default_value = 2.2; rq.world_tint(sc, (0.012, 0.016, 0.034) if rq.HI else (0.04, 0.055, 0.11))
        nb.inputs['Emission Color'].default_value = (*[g * 1.05 for g in GLOW], 1); nb.inputs['Emission Strength'].default_value = 1.6
        L = bpy.data.objects['L_lamp']; L.hide_render = rq.HI; L.data.energy = 18.0 * 0.85; L.data.color = (1.0, 0.62, 0.32)
        S = bpy.data.objects['L_street']; S.hide_render = False; S.data.energy = 2600.0 * 0.3; S.data.color = (0.95, 0.84, 0.7)
        H = bpy.data.objects.get('L_hall')        # shown by set_state('night'); same dose as in the street pass
        if H: H.data.energy = rq.HALL_W * 0.3; H.data.color = (0.95, 0.84, 0.7)
        sc.view_settings.exposure = 3.0
        if 'L_spot' in bpy.data.objects:
            P = bpy.data.objects['L_spot']; P.hide_render = False; P.data.energy = 60.0 * (0.5 if rq.HI else 0.7); P.data.color = (1.0, 0.82, 0.62)


def drop_objects():
    """The covered drop garment: bag, tag, string, zip and its own hanger and hook."""
    bag_x = bpy.data.objects['drop_bag'].matrix_world.translation.x
    keep = ('drop_', 'tag', 'tagtext', 'string', 'zip')
    return [o for o in rq.garments() if o.name.startswith(keep) or (o.name.startswith(('hanger', 'hook')) and abs(o.matrix_world.translation.x - bag_x) < 0.05)]


def drop_box(sc, cam, objs):
    from bpy_extras.object_utils import world_to_camera_view
    pts = [world_to_camera_view(sc, cam, o.matrix_world @ Vector(c)) for o in objs for c in o.bound_box]
    xs = [p.x for p in pts]; ys = [1 - p.y for p in pts]
    return [round(min(xs), 4), round(min(ys), 4), round(max(xs), 4), round(max(ys), 4)]


def frame_mean(png):
    """Average colour of a frame as the browser reads it (sRGB 0..1 at ~400 px): grades the flight to the views."""
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(png).convert('RGB').resize((400, 225), Image.BILINEAR), dtype=np.float64) / 255.0
    return [round(float(x), 5) for x in a.reshape(-1, 3).mean(0)]


def encode(src_dir, prefix, base):
    """PNG frames -> <base>.mp4/.webm and the way back <base>_r.mp4/.webm."""
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe(); src = os.path.join(src_dir, prefix + '%03d.png'); out = []
    for rev in (False, True):
        vf = ('reverse,' if rev else '') + 'format=yuv420p'
        b = base + ('_r' if rev else '')
        subprocess.run([ff, '-nostdin', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', src, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow',
                        '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', b + '.mp4'], check=True, stdin=subprocess.DEVNULL)
        subprocess.run([ff, '-nostdin', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', src, '-vf', vf, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p',
                        '-b:v', '0', '-crf', '31', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', b + '.webm'], check=True, stdin=subprocess.DEVNULL)
        out += [b + '.mp4', b + '.webm']
    return out


def keyframe_camera(sc, cam, spec, frames):
    """The whole path as keyframes (one per frame, linear between): Cycles takes the motion blur from it."""
    prefs = bpy.context.preferences.edit; keep = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = 'LINEAR'
    cam.animation_data_clear(); cam.data.animation_data_clear()
    cam.rotation_mode = 'QUATERNION'
    for i in range(frames):
        loc, rot, lens = camera_at(spec['a'], spec['b'], i / (frames - 1), spec['lift'])
        cam.location = loc; cam.rotation_quaternion = rot; cam.data.lens = lens
        cam.keyframe_insert('location', frame=i); cam.keyframe_insert('rotation_quaternion', frame=i)
        cam.data.keyframe_insert('lens', frame=i)
    prefs.keyframe_new_interpolation_type = keep
    sc.render.fps = FPS; sc.frame_start, sc.frame_end = 0, frames - 1


def render_move(sc, name, spec, variant):
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    prefix = {'day': 'f', 'night': 'n', 'evening': 'e'}[variant]
    light_variant(sc, variant)
    if rq.HI: rq.restore_visibility(); rq.set_state(STATE_OF[variant])
    drops = [o for o in drop_objects() if not rq.BASE_HIDE.get(o.name)]
    pull = spec.get('pull')
    frames = PULL_FRAMES if pull else FRAMES
    if pull:
        rq.set_view(sc, pull[0]); res = PULL_RES[pull[0]]
    else:
        res = RES
    sc.render.resolution_x, sc.render.resolution_y = res
    cam = sc.camera; cd = cam.data
    video = not pull
    if video:
        cd.sensor_fit = 'AUTO'; cd.sensor_width = 36
        keyframe_camera(sc, cam, spec, frames)
        sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5
        sc.cycles.seed = 0; sc.cycles.use_animated_seed = False      # the same noise every frame: the denoiser holds still
        fdir = os.path.join(FRAMES_DIR, name); os.makedirs(fdir, exist_ok=True)
        base = os.path.join(d, prefix)
        # a file left empty by an interrupted encode does not count (round 7: f_r.webm came up with 0 bytes)
        done = all(os.path.exists(base + x) and os.path.getsize(base + x) > 1000 for x in ('.mp4', '.webm', '_r.mp4', '_r.webm'))
    saved = []; track = []; t0 = time.time()
    for i in range(frames):
        t = i / (frames - 1)
        posed = None
        if pull:
            posed = rq.pose_garment(pull[0], pull[1], rq.ease(t))
            dst = os.path.join(d, f'{prefix}{i:03d}.webp')
        else:
            sc.frame_set(i)
            cd.dof.focus_distance = (rq.FOCUS - cam.matrix_world.translation).length
            dst = os.path.join(fdir, f'{prefix}{i:03d}.png')
        bpy.context.view_layer.update()
        slots, neon = rq.project_slots(sc, cam); track.append(dict(slots=slots, neon=neon, drop=drop_box(sc, cam, drops)))
        if (video and done) or os.path.exists(dst):
            if posed: rq.unpose(posed)
            continue
        png = dst.replace('.webp', '.png')
        try: secs = rq.render_to(sc, png)
        finally:
            if posed: rq.unpose(posed)
        if pull:
            rq.to_webp(png, dst, q=88 if rq.HI else 80); saved.append(dst)
        rq.stop_if_superseded()
        rq.log('move', name, variant, i, secs, 's')
        if pull and len(saved) >= 6:
            rq.git_save(saved, f'AZUR move {name} ({variant}): frames up to {i}'); saved = []
        elif video and (i + 1) % 12 == 0:                 # progress for the cloud (the frames stay here)
            pj = os.path.join(OUT, 'progress.json')
            json.dump(dict(move=name, variant=variant, frame=i + 1, of=frames, minutes=round((time.time() - t0) / 60, 1)), open(pj, 'w'))
            rq.git_save([pj], f'AZUR move {name} ({variant}): {i + 1} of {frames} frames')
    meta = os.path.join(OUT, 'moves.json')
    m = json.load(open(meta)) if os.path.exists(meta) else {}
    e = m.setdefault(name, {})
    e.update(from_=spec['a'], to=spec['b'], frames=frames, fps=FPS if video else 30, res=list(res), track=track)
    if pull: e['kind'] = 'pull'
    if video:
        if not done: saved += encode(fdir, prefix, base)
        e['video'] = True
        e.setdefault('ends', {})[prefix] = dict(first=frame_mean(os.path.join(fdir, f'{prefix}000.png')),
                                                last=frame_mean(os.path.join(fdir, f'{prefix}{frames - 1:03d}.png')))
        cam.animation_data_clear(); cd.animation_data_clear(); cam.rotation_mode = 'XYZ'
        sc.render.use_motion_blur = False
    e['variants'] = sorted(set(e.get('variants', [])) | {variant})
    json.dump(m, open(meta, 'w'), indent=1)
    rq.git_save(saved + [meta], f'AZUR move {name} ({variant}): complete')


def main():
    rq.hand_over_to_watch_v2()
    rq.ensure_blend()
    sc = rq.open_scene()
    names = [n for n in MOVES if not rq.ONLY or n in rq.ONLY]
    for variant in VARIANTS:
        for n in names:
            rq.restore_visibility()
            render_move(sc, n, MOVES[n], variant)
    rq.git_push(force=True)
    rq.log('moves finished')


if __name__ == '__main__':
    main()
