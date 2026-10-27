"""Cut the real jerseys out of the owner's photos (azur/photos/<key>/vorne.jpg, hinten.jpg) with rembg's u2net (the
classic model separated shirt from floor and blanket best, dark collars and cuffs included). A hang tag on a thin
strap at the collar is cut off: a morphological opening breaks the strap, the largest piece is the shirt, and the
original soft edge is kept wherever the shirt is. The shirt is then turned so its hem is level.

    python3 azur/tools/photo_cutout.py tuerkei [out_dir]       -> <out>/<key>-vorne.png, <key>-hinten.png (RGBA)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_SESSION = None


def cutout(path, size=2400):
    global _SESSION
    from rembg import new_session, remove
    _SESSION = _SESSION or new_session('u2net')
    im = Image.open(path).convert('RGB'); im.thumbnail((size, size), Image.LANCZOS)
    out = remove(im, session=_SESSION, post_process_mask=True)
    a = np.asarray(out.getchannel('A')).astype(np.float32) / 255
    m = a > 0.5
    W = m.shape[1]
    # a hang tag is narrow and stands up from the collar: an opening along the rows removes everything narrower than
    # about 7 % of the width (sleeves, body and hem are much wider), the largest piece is the shirt
    k = round(W * 0.07) | 1
    core = ndimage.binary_opening(m, structure=np.ones((1, k), bool))
    lab, n = ndimage.label(core)
    if n: core = lab == (np.argmax(ndimage.sum(core, lab, range(1, n + 1))) + 1)
    keep = ndimage.binary_dilation(core, iterations=3)
    # floor or blanket seen under the hem: from the bottom up, rows that are mostly not the shirt's colour go
    rgb = np.asarray(im).astype(np.float32)
    ys, xs = np.nonzero(core); cy, cx = int(ys.mean()), int(xs.mean())
    ref = np.median(rgb[cy - 40:cy + 40, cx - 40:cx + 40].reshape(-1, 3), 0)
    close = np.linalg.norm(rgb - ref, axis=2) < 70
    for y in range(ys.max(), cy, -1):
        row = keep[y]
        if row.sum() and (close[y] & row).sum() / row.sum() > 0.45: break
        keep[y] = False
    a = a * keep
    rgba = np.dstack([np.asarray(im), (a * 255).astype(np.uint8)])
    res = Image.fromarray(rgba, 'RGBA')
    return res.crop(res.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())


if __name__ == '__main__':
    key = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '.cache', 'photo_cut')
    os.makedirs(out, exist_ok=True)
    for side in ('vorne', 'hinten'):
        r = cutout(os.path.join(HERE, 'photos', key, side + '.jpg'))
        r.save(os.path.join(out, f'{key}-{side}.png')); print(key, side, r.size, flush=True)
