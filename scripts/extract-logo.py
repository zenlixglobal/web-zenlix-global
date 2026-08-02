#!/usr/bin/env python3
"""
Regenerate the derived logo assets from public/zenlix-icon.png.

The supplied artwork is a gold line-art monogram sitting on a flat navy plate
(~rgb(19,42,73)) — a few shades off the site navy (#0a1b33), so used directly
it reads as a visible block in the header. Red-minus-blue separates gold from
navy almost perfectly, so that drives the alpha ramp; partially-covered edge
pixels are then un-mixed against the known background colour, which is what
stops a navy fringe surviving onto a different backdrop.

Only needed if the source logo changes.

    pip install Pillow
    python3 scripts/extract-logo.py

Writes:
    public/zenlix-mark.png     384px transparent  — header, drawer, footer, admin
    public/zenlix-mark-og.png  128px transparent  — social share card
    src/app/icon.png           256px on navy      — favicon
    src/app/apple-icon.png     180px on navy      — iOS home screen
"""

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "zenlix-icon.png"

BG = (19, 42, 73)  # the plate colour baked into the source
NAVY = (10, 27, 51, 255)  # --color-navy-900
LO, HI = -15.0, 70.0  # R-B ramp: background -> gold


def key_out_background(im: Image.Image) -> Image.Image:
    w, h = im.size
    src = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _ = src[x, y]
            a = (float(r - b) - LO) / (HI - LO)
            a = 0.0 if a < 0.0 else (1.0 if a > 1.0 else a)
            a = min(1.0, a * 1.18)  # keep mid-tone strokes solid
            if a <= 0.004:
                continue
            fg = []
            for ch, bgc in zip((r, g, b), BG):
                v = (ch - (1.0 - a) * bgc) / a
                fg.append(0 if v < 0 else (255 if v > 255 else int(round(v))))
            dst[x, y] = (fg[0], fg[1], fg[2], int(round(a * 255)))
    return out


def square_crop(im: Image.Image, size: int) -> Image.Image:
    """Tight-crop to visible content, centre on a square, resize.

    The crop also drops the stray sparkle sitting below the mark in the
    original artwork.
    """
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 40:
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)

    mark = im.crop((minx, miny, maxx + 1, maxy + 1))
    mw, mh = mark.size
    side = int(max(mw, mh) * 1.06)  # small breathing margin
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(mark, ((side - mw) // 2, (side - mh) // 2), mark)
    return canvas.resize((size, size), Image.LANCZOS)


def on_navy_plate(mark: Image.Image, size: int) -> Image.Image:
    """Favicons need their own background to stay legible in browser chrome."""
    plate = Image.new("RGBA", (size, size), NAVY)
    inset = int(size * 0.86)
    thumb = mark.resize((inset, inset), Image.LANCZOS)
    plate.paste(thumb, ((size - inset) // 2, (size - inset) // 2), thumb)
    return plate


def write(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  {path.relative_to(ROOT)}  {img.size[0]}px  "
          f"{os.path.getsize(path) / 1024:.0f} KB")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source artwork not found: {SRC}")

    print(f"Reading {SRC.relative_to(ROOT)}")
    mark = square_crop(key_out_background(Image.open(SRC).convert("RGBA")), 512)

    write(mark.resize((384, 384), Image.LANCZOS), ROOT / "public/zenlix-mark.png")
    write(mark.resize((128, 128), Image.LANCZOS), ROOT / "public/zenlix-mark-og.png")
    write(on_navy_plate(mark, 256), ROOT / "src/app/icon.png")
    write(on_navy_plate(mark, 180), ROOT / "src/app/apple-icon.png")


if __name__ == "__main__":
    main()
