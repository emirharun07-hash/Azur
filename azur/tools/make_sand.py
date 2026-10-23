"""The sandy edge of the scroll transition (sections/azur-room.liquid, .azur-fall__dust): black grains on transparent,
few at the top, denser downwards, solid black in the last rows; soft grains (each one with its own opacity) at 1:1 so
they stay fine. Runde 19 (owner): lower and less harsh than the first version.

    python3 azur/tools/make_sand.py      -> azur/theme/assets/azur-sand.png (512 x 140, tiles horizontally)
"""
import os
import random

from PIL import Image

W, H, SOLID = 512, 140, 6
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'theme', 'assets', 'azur-sand.png')


def main():
    rnd = random.Random(19)
    im = Image.new('RGBA', (W, H)); px = im.load()
    for y in range(H):
        t = min(1.0, y / (H - SOLID))
        d = t * t * (3 - 2 * t)                      # density: smoothstep from 0 to 1
        for x in range(W):
            if y >= H - SOLID or rnd.random() < d:
                a = 255 if y >= H - SOLID else int(255 * min(1.0, 0.35 + 0.65 * d + rnd.uniform(-0.15, 0.15)))
                px[x, y] = (0, 0, 0, max(0, a))
    im.save(OUT, optimize=True)
    print(OUT, os.path.getsize(OUT))


if __name__ == '__main__':
    main()
