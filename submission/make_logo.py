#!/usr/bin/env python3
"""SettleNow logo v3 — 1024x1024 PNG. Flat dark bg, clean layered mark, safe for circle-crop."""
from PIL import Image, ImageDraw, ImageFont
import os

S = 1024
BG = (8, 15, 18, 255)
CARD = (15, 28, 33, 255)
MINT = (94, 234, 212)
MINT_D = (45, 178, 168)
LAV = (167, 139, 250)
GREY = (104, 124, 134)
WHITE = (240, 248, 247)

img = Image.new("RGBA", (S, S), BG)          # full-bleed, uniform, no transparency
d = ImageDraw.Draw(img)

# ---- document ----
dx0, dy0, dx1, dy1 = 200, 190, 566, 596
d.rounded_rectangle([dx0, dy0, dx1, dy1], radius=40, fill=CARD)

# folded top-right corner, then stroke the border ON TOP so the join is clean
fold = 88
d.polygon([(dx1 - fold, dy0 + 1), (dx1 - 1, dy0 + 1), (dx1 - 1, dy0 + fold)], fill=MINT)
d.rounded_rectangle([dx0, dy0, dx1, dy1], radius=40, outline=MINT, width=9)

# ledger line items
for i, w in enumerate([250, 214, 232]):
    y = dy0 + 104 + i * 48
    d.rounded_rectangle([dx0 + 48, y, dx0 + 48 + w, y + 16], radius=8, fill=GREY)

# amount line (mint) + ascending bars above it
ay = dy0 + 300
d.rounded_rectangle([dx0 + 48, ay, dx0 + 188, ay + 28], radius=14, fill=MINT)
for i, bh in enumerate([40, 66, 92, 118]):
    x = dx0 + 58 + i * 29
    col = MINT if i == 3 else MINT_D
    d.rounded_rectangle([x, ay - 16 - bh, x + 19, ay - 16], radius=9, fill=col)

# ---- gradient coin, with a dark gutter so the layering reads as intentional ----
c_cx, c_cy, c_r = 640, 556, 148
d.ellipse([c_cx - c_r - 17, c_cy - c_r - 17, c_cx + c_r + 17, c_cy + c_r + 17], fill=BG)
grad = Image.new("RGBA", (c_r * 2, c_r * 2), (0, 0, 0, 0))
gdr = ImageDraw.Draw(grad)
for y in range(c_r * 2):
    t = y / (c_r * 2 - 1)
    gdr.line([(0, y), (c_r * 2, y)], fill=(
        int(MINT[0] + (LAV[0] - MINT[0]) * t),
        int(MINT[1] + (LAV[1] - MINT[1]) * t),
        int(MINT[2] + (LAV[2] - MINT[2]) * t), 255))
mask = Image.new("L", (c_r * 2, c_r * 2), 0)
ImageDraw.Draw(mask).ellipse([0, 0, c_r * 2 - 1, c_r * 2 - 1], fill=255)
img.paste(grad, (c_cx - c_r, c_cy - c_r), mask)
d = ImageDraw.Draw(img)

# dark arrow on the coin, pointing left into the invoice = advance funded
sl, sr = c_cx - 28, c_cx + 68
d.rounded_rectangle([sl, c_cy - 16, sr, c_cy + 16], radius=8, fill=BG)
d.polygon([(c_cx - 88, c_cy), (sl + 6, c_cy - 42), (sl + 6, c_cy + 42)], fill=BG)

# ---- wordmark + rule (width matched to the text) ----
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 92)
except Exception:
    font = ImageFont.load_default()
txt = "SettleNow"
bb = d.textbbox((0, 0), txt, font=font)
tw = bb[2] - bb[0]
tx = (S - tw) // 2
d.text((tx, 700), txt, font=font, fill=WHITE)
d.rounded_rectangle([tx, 826, tx + tw, 834], radius=4, fill=MINT)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "settlenow-logo.png")
img.convert("RGB").save(out, "PNG")
print("wrote", out, os.path.getsize(out), "bytes")
