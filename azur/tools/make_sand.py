"""The sandy edge of the scroll transition (sections/azur-room.liquid, .azur-fall__dust): black grains on transparent,
few at the top, denser downwards, solid black in the last rows; soft grains (each one with its own opacity) at 1:1 so
they stay fine. Runde 19 (owner): lower and less harsh than the first version; Runde 20 (owner): lower and softer still
(the darkening comes mostly from a smooth wash under it, the grains are faint and only give it a sandy texture).

    python3 azur/tools/make_sand.py      -> azur/theme/assets/azur-sand.png (512 x 80, tiles horizontally)
"""
import os
import random

from PIL import Image

W, H, SOLID = 512, 80, 3
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'theme', 'assets', 'azur-sand.png')


def main():
    rnd = random.Random(19)
    im = Image.new('RGBA', (W, H)); px = im.load()
    for y in range(H):
        t = min(1.0, y / (H - SOLID))
        d = t * t * (3 - 2 * t)                      # density: smoothstep from 0 to 1
        for x in range(W):
            if y >= H - SOLID or rnd.random() < d:
                a = 255 if y >= H - SOLID else int(255 * (0.2 + 0.55 * d) * rnd.uniform(0.6, 1.0))
                px[x, y] = (0, 0, 0, max(0, a))
    im.save(OUT, optimize=True)
    print(OUT, os.path.getsize(OUT))


if __name__ == '__main__':
    main()
