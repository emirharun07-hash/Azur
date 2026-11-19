"""Trikot-Bilder ohne Schulter-/Aermelstreifen und ohne Brust-Emblem (nur Darstellung).

Liest  azur/assets/jerseys/real/<name>-fit.webp   (bleibt unveraendert)
Schreibt azur/assets/jerseys/clean/<name>.webp    (2400x2400 RGBA, Alpha 1:1 vom Original)

Ablauf je Bild:
  1. Maske: in den Streifen-Bereichen (Polygone REGIONS) werden dunkle Pixel erkannt und per
     Closing zu einem geschlossenen Band zusammengefasst (Luecken zwischen den Streifen mit drin);
     das Emblem (Polygone CRESTS) wird ganz maskiert. Kragen, Buendchen, AZUR-Schriftzug liegen
     ausserhalb der Polygone und bleiben unangetastet.
  2. Grundton: cv2.inpaint (TELEA) und davon nur der Tiefpass (Helligkeitsverlauf).
  3. Stoffstruktur: Hochpass (Bild minus Gauss) aus einer ungestoerten Nachbarflaeche, kachelweise
     per Rand-Abgleich gesucht (verschoben oder gespiegelt), weich ueberlappend aufaddiert.
  4. Weiche Einblendung (Maskenrand FEATHER px), Alpha exakt vom Original.

Aufruf: python azur/tools/clean_jersey.py [--debug DIR] [name ...]
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'jerseys', 'real')
DST = os.path.join(ROOT, 'assets', 'jerseys', 'clean')

FEATHER = 16          # weicher Maskenrand in px (12-20)
TILE, STEP = 112, 72  # Kachelgroesse / Schritt fuer die Struktur-Suche
SEARCH = 420          # max. Verschiebung der Quellflaeche in px


def mirror(poly, cx=1200):
    return [(2 * cx - x, y) for x, y in poly]


# ---------------------------------------------------------------------------------------------
# Masken-Koordinaten (Bildkoordinaten 2400x2400). 'dark': Schwelle fuer Streifenfarbe
# (Brasilien: Rotkanal, Deutschland: Helligkeit). Werte darunter = Streifen.
# ---------------------------------------------------------------------------------------------
BV_L = [(930, 270), (930, 392), (820, 480), (690, 530), (610, 640), (580, 800), (575, 1074),
        (500, 1052), (372, 1018), (330, 980), (380, 640), (470, 470), (640, 360), (800, 290)]
BH_L = [(1002, 306), (1002, 348), (945, 412), (910, 490), (720, 540), (640, 610), (600, 800), (590, 1088),
        (480, 1055), (372, 1023), (330, 980), (380, 640), (470, 470), (640, 360), (800, 290), (870, 290),
        (925, 301)]
BV_R = [(1487, 280), (1485, 362), (1479, 382), (1500, 420)] + mirror(BV_L)[2:]
BH_R = [(1408, 306), (1408, 330)] + mirror(BH_L)[2:]
DV_L = [(946, 295), (946, 360), (940, 420), (820, 455), (700, 485), (580, 545), (520, 620), (500, 815), (380, 815),
        (330, 790), (380, 560), (470, 470), (640, 380), (820, 300), (900, 280)]
DV_R = [(1497, 295), (1497, 420), (1600, 470), (1720, 500), (1820, 560), (1880, 640), (1900, 815), (1995, 815),
        (2060, 790), (2000, 560), (1850, 420), (1700, 350), (1560, 285)]
DH_L = [(970, 285), (970, 330), (880, 430), (720, 520), (560, 560), (500, 640), (470, 815), (380, 815),
        (330, 790), (380, 560), (470, 470), (640, 380), (820, 300), (900, 280)]
DH_R = [(1418, 285), (1418, 330), (1520, 440), (1700, 500), (1860, 600), (1900, 700), (1915, 815), (2000, 815),
        (2060, 790), (2000, 560), (1850, 420), (1700, 350), (1550, 280), (1480, 275)]

TORSO = [(720, 480), (1680, 480), (1680, 1500), (720, 1500)]  # Rumpf-Flaeche zwischen den Aermelnaehten

CONFIG = {
    'brasilien-vorne': dict(
        mode='red', dark=150, sigma=8, pale=75,
        regions=[BV_L, BV_R],
        crests=[[(1290, 600), (1450, 600), (1458, 700), (1455, 775), (1365, 870), (1280, 775), (1282, 700)]],
    ),
    'brasilien-hinten': dict(
        mode='red', dark=150, sigma=8, pale=75,
        regions=[BH_L, BH_R],
        crests=[],
    ),
    'deutschland-vorne': dict(
        mode='lum', dark=110, sigma=16, crest_sigma=40,
        regions=[DV_L, DV_R],
        crests=[[(1370, 580), (1530, 580), (1535, 700), (1528, 790), (1450, 830), (1372, 790), (1365, 700)]],
    ),
    'deutschland-hinten': dict(
        mode='lum', dark=110, sigma=16,
        regions=[DH_L, DH_R],
        crests=[],
    ),
}


def poly_mask(shape, polys):
    m = np.zeros(shape, np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.array(p, np.int32)], 1)
    return m.astype(bool)


def disk(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def dark_value(rgb, cfg):
    if cfg['mode'] == 'red':
        return rgb[..., 0].astype(np.float32)
    return rgb.astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)


def build_mask(rgb, alpha, cfg):
    h, w = alpha.shape
    region = poly_mask((h, w), cfg['regions'])
    val = dark_value(rgb, cfg)
    dark = (val < cfg['dark']) & (alpha > 0) & region
    dark = ndimage.binary_opening(dark, structure=disk(1))
    band = cv2.morphologyEx(dark.astype(np.uint8), cv2.MORPH_CLOSE, disk(22)).astype(bool)
    band = ndimage.binary_fill_holes(band)
    # Band bis an den Silhouettenrand ziehen (der aeusserste Streifen liegt direkt am Rand)
    edge = (alpha < 255) & (alpha > 0)
    near_edge = cv2.dilate(band.astype(np.uint8), disk(14)).astype(bool) & cv2.dilate(edge.astype(np.uint8), disk(10)).astype(bool)
    band = (cv2.dilate(band.astype(np.uint8), disk(5)).astype(bool) | near_edge) & region
    crest = poly_mask((h, w), cfg['crests'])
    return (band | crest) & (alpha > 0)


def integral_bad(bad):
    return np.pad(bad.astype(np.int32), ((1, 0), (1, 0))).cumsum(0).cumsum(1)


def box_has_bad(ii, y0, x0, y1, x1):
    return ii[y1, x1] - ii[y0, x1] - ii[y1, x0] + ii[y0, x0] > 0


def texture_fill(hp, mask, good, known, rng=SEARCH):
    """Hochpass-Struktur fuer die Maske aus ungestoerten Nachbarflaechen (Kacheln, ueberlappend)."""
    h, w = mask.shape
    acc = np.zeros(hp.shape, np.float32)
    wsum = np.zeros((h, w), np.float32)
    win1 = np.hanning(TILE + 2)[1:-1].astype(np.float32)
    win = np.outer(win1, win1) + 1e-3
    sources = [(hp, integral_bad(~good)), (hp[:, ::-1].copy(), integral_bad(~good[:, ::-1]))]
    pad = 18
    ys, xs = np.where(mask)
    y_lo, y_hi, x_lo, x_hi = ys.min(), ys.max(), xs.min(), xs.max()
    cand = [(dy, dx) for dy in range(-rng, rng + 1, 18) for dx in range(-rng, rng + 1, 18)]
    for ty in range(max(0, y_lo - TILE // 2), y_hi + 1, STEP):
        for tx in range(max(0, x_lo - TILE // 2), x_hi + 1, STEP):
            y0, x0 = ty, tx
            y1, x1 = min(h, ty + TILE), min(w, tx + TILE)
            tm = mask[y0:y1, x0:x1]
            if not tm.any():
                continue
            # Rand-Ring der Kachel: bekannte Pixel, an denen die Quelle passen muss
            Y0, X0, Y1, X1 = max(0, y0 - pad), max(0, x0 - pad), min(h, y1 + pad), min(w, x1 + pad)
            ring = known[Y0:Y1, X0:X1].copy()
            ring[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] &= ~mask[y0:y1, x0:x1]
            target = hp[Y0:Y1, X0:X1]
            best = None
            for si, (S, ii) in enumerate(sources):
                def score(dy, dx):
                    sy0, sx0, sy1, sx1 = Y0 + dy, X0 + dx, Y1 + dy, X1 + dx
                    if sy0 < 0 or sx0 < 0 or sy1 > h or sx1 > w or box_has_bad(ii, sy0, sx0, sy1, sx1):
                        return None
                    if ring.sum() < 50:
                        return 1e-3 * (abs(dy) + abs(dx))
                    d = (S[sy0:sy1, sx0:sx1] - target)[ring]
                    return float((d * d).mean()) * (1 + 0.0004 * (abs(dy) + abs(dx)))
                for dy, dx in cand:
                    s = score(dy, dx)
                    if s is not None and (best is None or s < best[0]):
                        best = (s, si, dy, dx)
                if best is not None and best[1] == si:
                    _, _, by, bx = best
                    for dy in range(by - 15, by + 16, 3):
                        for dx in range(bx - 15, bx + 16, 3):
                            s = score(dy, dx)
                            if s is not None and s < best[0]:
                                best = (s, si, dy, dx)
            if best is None:
                continue
            _, si, dy, dx = best
            S = sources[si][0]
            wt = win[:y1 - y0, :x1 - x0]
            acc[y0:y1, x0:x1] += S[y0 + dy:y1 + dy, x0 + dx:x1 + dx] * wt[..., None]
            wsum[y0:y1, x0:x1] += wt
    out = acc / np.maximum(wsum, 1e-6)[..., None]
    return out, wsum > 0


def clean(name, debug=None):
    cfg = CONFIG[name]
    im = np.array(Image.open(os.path.join(SRC, name + '-fit.webp')).convert('RGBA'))
    rgb, alpha = im[..., :3].copy(), im[..., 3].copy()
    mask = build_mask(rgb, alpha, cfg)
    # Fremdfarbe ausserhalb der Maske (Kragen, Buendchen, Schriftzug): nie als Quelle verwenden
    foreign = (dark_value(rgb, cfg) < cfg['dark'] + 30) & ~mask
    if 'pale' in cfg:  # helle Streifen-Zwischenraeume (Brasilien) nicht als Farbquelle
        foreign |= (rgb[..., 2] > cfg['pale']) & (alpha > 0) & ~mask & poly_mask(alpha.shape, cfg['regions'])
    foreign = cv2.dilate(foreign.astype(np.uint8), disk(6)).astype(bool)

    # 1) Grundton: Inpaint (Quelle nur voll deckender, ungestoerter Stoff)
    inp_mask = (cv2.dilate(mask.astype(np.uint8), disk(10)).astype(bool) | foreign | (alpha < 255)).astype(np.uint8)  # Saum um die Streifen nicht als Farbquelle
    base = cv2.inpaint(rgb, inp_mask, 5, cv2.INPAINT_TELEA).astype(np.float32)

    # 2) Struktur: Hochpass aus Nachbarflaechen (Streifen und Emblem getrennt, eigener Tiefpass-Radius)
    f = rgb.astype(np.float32)
    ff = np.where(((alpha == 255) & ~foreign & ~mask)[..., None], f, base)  # Rand/Fremdfarbe neutralisieren
    protect = poly_mask(alpha.shape, cfg['regions']) & ~mask  # Restflaeche der Streifenbereiche meiden
    collar = poly_mask(alpha.shape, [[(860, 200), (1540, 200), (1540, 470), (860, 470)]])
    crest = poly_mask(alpha.shape, cfg['crests']) & mask
    fill = f.copy()
    for part, sigma in ((mask & ~crest, cfg['sigma']), (crest, cfg.get('crest_sigma', cfg['sigma']))):
        if not part.any():
            continue
        lp = cv2.GaussianBlur(base, (0, 0), sigma)
        hp = ff - cv2.GaussianBlur(ff, (0, 0), sigma)
        tmask = cv2.dilate(part.astype(np.uint8), disk(FEATHER)).astype(bool)
        halo = max(30, int(2 * sigma))  # Quelle weit genug weg von geflickten/fremden Stellen (Hochpass-Reichweite)
        good = (cv2.erode((alpha == 255).astype(np.uint8), disk(halo)) > 0) & ~protect & ~collar
        good &= ~cv2.dilate((mask | foreign).astype(np.uint8), disk(halo)).astype(bool)
        if part is crest:  # Emblem: Stoff nur vom Rumpf nehmen (Aermel sind glatter, anderes Muster)
            good &= poly_mask(alpha.shape, [TORSO])
        tex, ok = texture_fill(hp, tmask, good, (alpha == 255) & ~cv2.dilate(mask.astype(np.uint8), disk(FEATHER)).astype(bool) & ~foreign)
        fill[tmask] = (lp + np.where(ok[..., None], tex, 0))[tmask]

    # 3) weich einblenden, Alpha 1:1
    soft = cv2.GaussianBlur(cv2.dilate(mask.astype(np.uint8), disk(FEATHER // 2)).astype(np.float32), (0, 0), FEATHER / 2.5)
    soft = np.where(mask, 1.0, soft)
    soft[cv2.dilate(mask.astype(np.uint8), disk(FEATHER)) == 0] = 0
    soft[(dark_value(rgb, cfg) < cfg['dark']) & ~mask] = 0  # harte Kante zu Kragen/Buendchen behalten
    out = f * (1 - soft[..., None]) + fill * soft[..., None]
    res = np.dstack([np.clip(np.round(out), 0, 255).astype(np.uint8), alpha])
    os.makedirs(DST, exist_ok=True)
    Image.fromarray(res, 'RGBA').save(os.path.join(DST, name + '.webp'), 'WEBP', lossless=True, quality=80, method=4, exact=True)  # verlustfrei: Pixel ausserhalb der Maske bleiben 1:1 (q95 verlustbehaftet wich bis 88 ab)
    if debug:
        os.makedirs(debug, exist_ok=True)
        np.save(os.path.join(debug, name + '-touch.npy'), soft > 0)
        ov = im.copy()
        ov[mask, :3] = (ov[mask, :3] * 0.4 + np.array([255, 0, 255]) * 0.6).astype(np.uint8)
        for p in cfg['regions'] + cfg['crests']:
            cv2.polylines(ov, [np.array(p, np.int32)], True, (0, 0, 255, 255), 3)
        Image.fromarray(ov).resize((1200, 1200)).save(os.path.join(debug, 'maske-' + name + '.png'))
    print(name, 'maske px', int(mask.sum()))


if __name__ == '__main__':
    args = sys.argv[1:]
    debug = None
    if '--debug' in args:
        i = args.index('--debug'); debug = args[i + 1]; del args[i:i + 2]
    for n in args or list(CONFIG):
        clean(n, debug)
