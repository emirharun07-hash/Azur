"""The real jerseys as fabric for the room (Runde 22): the cut-outs from photo_cutout.py, colour-corrected and saved
as the photos the cloth jerseys are sewn from (scene/build_room.py JERSEY_PHOTOS, scene/garment.py).

The owner photographed indoors under warm light; each shot is scaled per channel so the shirt's main colour matches
the shop's product image of the same jersey (assets/jerseys/back/<key>-vorne-v2.webp): the shop's colour is the
intended one. Gains are kept between 0.7 and 1.7 and act on coloured pixels only (white prints and collars stay white).

    python3 azur/tools/photo_textures.py tuerkei brasilien deutschland
        -> azur/assets/jerseys/real/<key>-vorne.webp, <key>-hinten.webp (RGBA, at most 1600 px)
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(HERE, '.cache', 'photo_cut')
OUT = os.path.join(HERE, 'assets', 'jerseys', 'real')


def main_colour(rgba):
    """median colour of the shirt's middle (logos and trims stay out of it)"""
    a = np.asarray(rgba).astype(np.float32); m = a[..., 3] > 200
    ys, xs = np.nonzero(m); y0, y1 = np.percentile(ys, [45, 80]); x0, x1 = np.percentile(xs, [30, 70])
    box = a[int(y0):int(y1), int(x0):int(x1)]; box = box[box[..., 3] > 200]
    return np.median(box[:, :3], 0)


def main(keys):
    os.makedirs(OUT, exist_ok=True)
    for k in keys:
        ref = main_colour(Image.open(os.path.join(HERE, 'assets', 'jerseys', 'back', f'{k}-vorne-v2.webp')).convert('RGBA'))
        for side in ('vorne', 'hinten'):
            im = Image.open(os.path.join(CUT, f'{k}-{side}.png')).convert('RGBA')
            gain = np.clip((ref + 1) / (main_colour(im) + 1), 0.7, 1.7)
            a = np.asarray(im).astype(np.float32)
            rgb = a[..., :3]; mx = rgb.max(2, keepdims=True)
            sat = np.clip((mx - rgb.min(2, keepdims=True)) / np.maximum(mx, 1) * 1.6, 0, 1)   # white stays white
            a[..., :3] = np.clip(rgb * (1 + (gain - 1) * sat), 0, 255)
            out = Image.fromarray(a.astype(np.uint8), 'RGBA'); out.thumbnail((1600, 1600), Image.LANCZOS)
            out.save(os.path.join(OUT, f'{k}-{side}.webp'), quality=92)
            print(k, side, out.size, 'gain', np.round(gain, 2), flush=True)


if __name__ == '__main__':
    main(sys.argv[1:] or ['tuerkei', 'brasilien', 'deutschland'])
