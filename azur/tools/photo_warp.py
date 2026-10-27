"""Lay the real jersey photos onto the frozen jerseys (Runde 22). The cloth jerseys in the room (scene/frozen/*.glb)
were sewn from the shop's product images and their UVs belong to those outlines; the owner's photos are flat lays
(sleeves straight out). Each photo is bent onto the old outline with a thin-plate spline through matching points found
on both outlines: collar edges, shoulder tips, the outer sleeve corners, the armpits and the hem corners (collar and shoulders measured from the hem's width), plus a few
inside the body, so the old drape keeps its shape and only the fabric changes.

    python3 azur/tools/photo_warp.py tuerkei brasilien deutschland
        in:  assets/jerseys/real/<key>-<side>.webp (photo_textures.py), assets/jerseys/back/<key>-<side>-v2.webp
        out: assets/jerseys/real/<key>-<side>-fit.webp (the old canvas and alpha, the photo's fabric)
             .cache/photo_warp/<key>-<side>-points.jpg (the points on both, for checking)
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def outline(alpha):
    m = (alpha > 128).astype(np.uint8)
    c = max(cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)
    return m, c[:, 0, :]


def landmarks(alpha):
    """points in a fixed order on a T-shirt outline (image coordinates)"""
    m, c = outline(alpha)
    x0, y0, w, h = cv2.boundingRect(c)
    cx = x0 + w / 2
    hull = cv2.convexHull(c.reshape(-1, 1, 2), returnPoints=False)
    defects = cv2.convexityDefects(c.reshape(-1, 1, 2), hull)
    pts = {}
    # armpits: the deepest dents left and right of the middle, below the top fifth
    for side, sel in (('l', lambda p: p[0] < cx - w * 0.12), ('r', lambda p: p[0] > cx + w * 0.12)):
        best = None
        for s, e, f, d in defects[:, 0]:
            p = c[f]
            if sel(p) and p[1] > y0 + h * 0.15 and p[1] < y0 + h * 0.75 and (best is None or d > best[0]): best = (d, p)
        pts['arm_' + side] = best[1]
    # hem corners: lowest points in the outer fifths of the body width at the bottom
    yb = c[:, 1].max()
    low = c[c[:, 1] > yb - h * 0.06]
    pts['hem_l'] = low[np.argmin(low[:, 0])]; pts['hem_r'] = low[np.argmax(low[:, 0])]
    # collar and shoulders by the same rule on both outlines: measured from the hem's width and middle
    bw = pts['hem_r'][0] - pts['hem_l'][0]; mx = (pts['hem_r'][0] + pts['hem_l'][0]) / 2
    def top_at(x):
        x = int(round(min(max(x, 0), m.shape[1] - 1))); col = np.nonzero(m[:, x])[0]
        return np.array([x, col.min() if len(col) else y0])
    pts['neck_l'], pts['neck_r'] = top_at(mx - bw * 0.2), top_at(mx + bw * 0.2)
    pts['shoulder_l'], pts['shoulder_r'] = top_at(mx - bw * 0.46), top_at(mx + bw * 0.46)
    pts['neck_c'] = top_at(mx)
    # sleeve ends: walk the outline from the shoulder to the armpit (the way that does not pass the neck); the cuff is
    # the stretch farthest out from the shoulder-armpit line, its first and last points are the cuff's corners. (The
    # outermost point alone is the upper corner on a flat lay and the lower one on a hanging sleeve.)
    n = len(c)
    near = lambda p: int(np.argmin(((c - p) ** 2).sum(1)))
    neck_i = near(pts['neck_c'])
    for side in 'lr':
        i0, i1 = near(pts['shoulder_' + side]), near(pts['arm_' + side])
        fwd = [(i0 + t) % n for t in range(((i1 - i0) % n) + 1)]
        bwd = [(i0 - t) % n for t in range(((i0 - i1) % n) + 1)]
        path = fwd if neck_i not in fwd else bwd
        P0, P1 = c[path[0]].astype(float), c[path[-1]].astype(float)
        d = np.abs(np.cross(P1 - P0, c[path] - P0)) / max(np.linalg.norm(P1 - P0), 1)
        far = np.nonzero(d > d.max() * 0.85)[0]
        pts['cuff_up_' + side], pts['cuff_lo_' + side] = c[path[far[0]]], c[path[far[-1]]]
        pts['tip_' + side] = c[path[int((far[0] + far[-1]) / 2)]]
        # along the sleeve's top (shoulder to cuff) and its underside (cuff to armpit), so the sleeve cannot drift
        for j, t in enumerate((0.33, 0.66)):
            pts[f'stop{j}_' + side] = c[path[int(far[0] * t)]]
            pts[f'sbot{j}_' + side] = c[path[int(far[-1] + (len(path) - 1 - far[-1]) * t)]]
    keys = ['neck_c', 'neck_l', 'neck_r', 'shoulder_l', 'shoulder_r', 'cuff_up_l', 'cuff_up_r', 'tip_l', 'tip_r', 'cuff_lo_l', 'cuff_lo_r',
            'arm_l', 'arm_r', 'hem_l', 'hem_r', 'stop0_l', 'stop0_r', 'stop1_l', 'stop1_r', 'sbot0_l', 'sbot0_r', 'sbot1_l', 'sbot1_r']
    P = np.array([pts[k] for k in keys], float)
    # inside the body: a grid between armpits and hem, and the chest between the neck and the armpits
    al, ar, hl, hr = P[11], P[12], P[13], P[14]
    inner = []
    for t in (0.0, 0.5, 1.0):
        L, R = al + (hl - al) * t, ar + (hr - ar) * t
        for u in (0.25, 0.5, 0.75): inner.append(L + (R - L) * u)
    nm = (P[1] + P[2]) / 2; chest = (al + ar) / 2
    inner += [nm + (chest - nm) * 0.5, (P[1] + al) / 2, (P[2] + ar) / 2]
    return np.vstack([P, inner])


SHOP_SLEEVES = {'brasilien', 'deutschland'}   # printed stripes and cuffs: the shop image's sleeves are cleaner than bent photo


def warp(src_rgba, dst_rgba, shop_sleeves=False):
    src, dst = np.asarray(src_rgba), np.asarray(dst_rgba)
    ps, pd = landmarks(src[..., 3]), landmarks(dst[..., 3])
    H, W = dst.shape[:2]
    gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
    f = RBFInterpolator(pd, ps, kernel='thin_plate_spline', smoothing=1.0)
    step = 8                                   # the map on a coarse grid, then smoothly up to every pixel
    cy, cx = np.mgrid[0:H:step, 0:W:step]
    mp = f(np.c_[cx.ravel(), cy.ravel()]).reshape(cy.shape[0], cy.shape[1], 2).astype(np.float32)
    mx = cv2.resize(mp[..., 0], (W, H), interpolation=cv2.INTER_CUBIC); my = cv2.resize(mp[..., 1], (W, H), interpolation=cv2.INTER_CUBIC)
    # the photo's own edge colour beyond its outline (no floor), then sampled through the map
    from scipy import ndimage
    from scipy import ndimage as nd
    a = ~nd.binary_erosion(src[..., 3] > 240, iterations=6)      # the edge's colour from inside: no floor in the fringe
    _, idx = ndimage.distance_transform_edt(a, return_indices=True)
    filled = src[..., :3][idx[0], idx[1]]
    rgb = cv2.remap(filled, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # brightness and colour of the bent photo matched to the shop image over the body's middle, so the parts taken from
    # the shop image (collar, sleeves) meet it without an edge (the photos were taken in a dim, warm room)
    body_mid = (dst[..., 3] > 200)
    y_s, x_s = np.nonzero(body_mid); ry = np.percentile(y_s, [45, 80]).astype(int); rx = np.percentile(x_s, [35, 65]).astype(int)
    pm = np.median(rgb[ry[0]:ry[1], rx[0]:rx[1]].reshape(-1, 3).astype(np.float32), 0)
    dm = np.median(dst[ry[0]:ry[1], rx[0]:rx[1], :3].reshape(-1, 3).astype(np.float32), 0)
    rgb = np.clip(rgb.astype(np.float32) * np.clip((dm + 1) / (pm + 1), 0.8, 1.45), 0, 255)
    # the collar stays the shop image's: it shows the collar in 3D (with its inside), the flat photo cannot; the design
    # is the same. An ellipse around the neck, feathered.
    hl, hr, nc = pd[13], pd[14], pd[0]
    bw = hr[0] - hl[0]; ys = np.nonzero(dst[..., 3] > 128)[0]; hh = ys.max() - ys.min()
    ex, ey = bw * 0.26, hh * 0.11
    k = np.clip(1.6 - np.sqrt(((gx - nc[0]) / ex) ** 2 + ((gy - nc[1]) / ey) ** 2), 0, 1)[..., None] ** 1.5
    if shop_sleeves:
        # the sleeves (outside the body: shoulder - armpit - hem on each side) from the shop image as well
        body = np.array([pd[3], pd[11], pd[13], pd[14], pd[12], pd[4]], np.int32)
        bm = np.zeros((H, W), np.uint8); cv2.fillPoly(bm, [body], 1)
        bm = cv2.dilate(bm, np.ones((5, 5), np.uint8))
        sl = cv2.GaussianBlur((1 - bm).astype(np.float32), (0, 0), 4)[..., None]
        k = np.maximum(k, sl)
    rgb = (rgb * (1 - k) + dst[..., :3] * k).astype(np.uint8)
    out = np.dstack([rgb, dst[..., 3]])
    return Image.fromarray(out, 'RGBA'), ps, pd


def dots(im, pts, col):
    v = cv2.cvtColor(np.asarray(im.convert('RGB')), cv2.COLOR_RGB2BGR).copy()
    for i, (x, y) in enumerate(pts):
        cv2.circle(v, (int(x), int(y)), 9, col, -1); cv2.putText(v, str(i), (int(x) + 10, int(y)), cv2.FONT_HERSHEY_SIMPLEX, 1.0, col, 2)
    return v


def main(keys):
    dbg = os.path.join(HERE, '.cache', 'photo_warp'); os.makedirs(dbg, exist_ok=True)
    for k in keys:
        for side in ('vorne', 'hinten'):
            src = Image.open(os.path.join(HERE, 'assets', 'jerseys', 'real', f'{k}-{side}.webp')).convert('RGBA')
            dst = Image.open(os.path.join(HERE, 'assets', 'jerseys', 'back', f'{k}-{side}-v2.webp')).convert('RGBA')
            out, ps, pd = warp(src, dst, k in SHOP_SLEEVES)
            out.save(os.path.join(HERE, 'assets', 'jerseys', 'real', f'{k}-{side}-fit.webp'), quality=92)
            a, b = dots(src, ps, (0, 0, 255)), dots(dst, pd, (255, 0, 0))
            hh = 700; a = cv2.resize(a, (round(a.shape[1] * hh / a.shape[0]), hh)); b = cv2.resize(b, (round(b.shape[1] * hh / b.shape[0]), hh))
            c = cv2.cvtColor(np.asarray(out.convert('RGB')), cv2.COLOR_RGB2BGR); c = cv2.resize(c, (round(c.shape[1] * hh / c.shape[0]), hh))
            cv2.imwrite(os.path.join(dbg, f'{k}-{side}-points.jpg'), np.hstack([a, b, c]))
            print(k, side, 'ok', flush=True)


if __name__ == '__main__':
    main(sys.argv[1:] or ['tuerkei', 'brasilien', 'deutschland'])
