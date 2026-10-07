#!/usr/bin/env python3
"""Build settlenow-pitch.mp4: narrated pitch cards (PIL) + Sonia TTS -> ffmpeg."""
import asyncio, os, subprocess, textwrap
import edge_tts
from PIL import Image, ImageDraw, ImageFont

OUT = "/home/star/settlenow/video"
FF = "/home/star/.hermes/tools/ffmpeg-9.0.1-linux-x64/bin/ffmpeg"
FP = "/home/star/.hermes/tools/ffmpeg-9.0.1-linux-x64/bin/ffprobe"
W, H = 1280, 720
VOICE = "en-GB-SoniaNeural"
BG = (9, 14, 20)
TEAL = (45, 212, 191)
WHITE = (240, 244, 248)
DIM = (148, 163, 184)
GOLD = (250, 204, 21)
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
os.makedirs(OUT, exist_ok=True)

# (name, kicker, title, color, body, footer, narration)
SEGS = [
    ("p1-title", "SETTLENOW · COLOSSEUM WORLD'S FAIR · NARRATED PITCH",
     "Get paid in seconds, not months.", TEAL,
     ["invoice-advance vaults for small suppliers",
      "narrated version — no founder-on-camera footage"],
     "SettleNow · Solana + Tempo · Payments & Remittance",
     "Hi, I'm team SettleNow, and this is SettleNow. "
     "This is a narrated pitch, not a camera recording. "
     "I'm building one narrow thing: getting a small supplier paid in seconds instead of months."),
    ("p2-problem", "THE PROBLEM",
     "The work is done. The money isn't.", WHITE,
     ["net-30 to net-90 terms starve small suppliers",
      "cash-flow timing kills more suppliers than lack of demand",
      "factoring is built for five figures and up",
      "a 485 dollar invoice is not worth a factor's time"],
     "the supplier waits 30 to 90 days — or borrows expensively",
     "Here is the problem. If you run a small business and you invoice a bigger client, "
     "you wait thirty to ninety days. That gap is the most common reason small suppliers fail. "
     "The work is done, the client is good for the money, and the business still cannot make payroll. "
     "Factoring exists, but it is paper, phone calls, and opaque rates, built for five and six figure invoices. "
     "A four hundred eighty-five dollar invoice is not worth a factor's time, so that supplier just waits."),
    ("p3-product", "THE PRODUCT",
     "Upload. Quote. Advance. Pay-link.", TEAL,
     ["upload the invoice, get a transparent deterministic quote",
      "roughly 90 percent of face value lands in USDC in seconds",
      "1.5 percent fee · 500 dollar pilot cap",
      "share a pay-link — repayment closes the vault itself"],
     "per-invoice escrow vault · Solana PDA · Tempo settlement",
     "SettleNow makes that invoice viable. Upload it, and get a transparent quote: "
     "roughly ninety percent of face value, with a one point five percent fee, "
     "and the advance lands in U S D C in seconds. "
     "Each invoice gets its own escrow vault, and you send your client a pay-link. "
     "When they pay, the vault closes itself and the remainder settles automatically."),
    ("p4-why", "WHY THIS TEAM",
     "The small ticket IS the market.", GOLD,
     ["designed around the supplier factoring ignores",
      "sub-cent settlement makes sub-500 dollar advances viable",
      "quote is a published pure function — verifiable before committing",
      "zero setup demo: no wallet, no keys, no login"],
     "programmatic escrow replaces the factoring back office",
     "Why me? I treated this as a business, not just a build. "
     "I picked the exact customer: the supplier whose invoice is too small to factor. "
     "And I designed the unit economics around them: near-free settlement, programmatic escrow, "
     "and a quote that is a published pure function, so nobody has to ask what the rate is until they are already committed. "
     "The demo is live right now with zero setup: no wallet, no keys, no login."),
    ("p5-close", "SETTLENOW",
     "The cost of a small advance has collapsed.", TEAL,
     ["live demo — clickable end to end in about 60 seconds",
      "deterministic quote engine · tested fee math",
      "built for the suppliers traditional factoring ignores"],
     "SettleNow · narrated pitch · Colosseum World's Fair",
     "I built SettleNow because the cost of administering a small advance has collapsed, "
     "and that is what turns an unserved market into a served one. "
     "Have a look at the live demo. Thank you."),
]

def card(name, kicker, title, color, lines, footer):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 10], fill=color)
    d.rectangle([0, H - 10, W, H], fill=color)
    fk = ImageFont.truetype(FB, 28)
    ft = ImageFont.truetype(FB, 72)
    fb = ImageFont.truetype(FR, 34)
    ff = ImageFont.truetype(FR, 24)
    y = 60
    for kln in textwrap.wrap(kicker, width=60):
        bb = d.textbbox((0, 0), kln, font=fk)
        d.text(((W-(bb[2]-bb[0]))/2, y), kln, font=fk, fill=color)
        y += 44
    y += 10
    for ln in textwrap.wrap(title, width=28):
        bb = d.textbbox((0, 0), ln, font=ft)
        d.text(((W-(bb[2]-bb[0]))/2, y), ln, font=ft, fill=color)
        y += 90
    y += 15
    for ln in lines:
        for wln in textwrap.wrap(ln, width=54):
            bb = d.textbbox((0, 0), wln, font=fb)
            if y + 50 > H - 70: break
            d.text(((W-(bb[2]-bb[0]))/2, y), wln, font=fb, fill=WHITE)
            y += 50
    bb = d.textbbox((0, 0), footer, font=ff)
    d.text(((W-(bb[2]-bb[0]))/2, H-55), footer, font=ff, fill=DIM)
    p = f"{OUT}/{name}.png"
    img.save(p); print("card", p, flush=True)
    return p

async def narrate(name, text):
    p = f"{OUT}/{name}.mp3"
    await edge_tts.Communicate(text, VOICE).save(p)
    print("tts", p, flush=True)
    return p

def dur(path):
    r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True)
    return float(r.stdout.strip())

async def main():
    segs, total = [], 0.0
    for name, kicker, title, color, lines, footer, narr in SEGS:
        png = card(name, kicker, title, color, lines, footer)
        mp3 = await narrate(name, narr)
        a = dur(mp3) + 0.8
        seg = f"{OUT}/{name}.mp4"
        subprocess.run([FF, "-y", "-v", "error", "-loop", "1", "-i", png,
            "-i", mp3, "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-t", f"{a:.2f}", "-shortest", seg], check=True)
        total += a; segs.append(seg)
        print(f"seg {seg} {a:.1f}s", flush=True)
    lst = f"{OUT}/pitch_concat.txt"
    open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
    final = f"{OUT}/settlenow-pitch.mp4"
    subprocess.run([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0",
        "-i", lst, "-c", "copy", final], check=True)
    print(f"FINAL {final} ~{total:.0f}s", flush=True)

asyncio.run(main())
