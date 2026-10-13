# Native 1080² cover illustrations (vector SVG). Zone: below the header (y ≥ 140), above the title (y ≤ 580), right side.
import math, random, sys, os
W = 1080
FROST, MUTED, RED = '#C6D0DC', '#94A3B8', '#FF2A2A'
def svg(body, defs=''):
    return f'<svg width="{W}" height="{W}" viewBox="0 0 {W} {W}" fill="none" xmlns="http://www.w3.org/2000/svg"><defs>{defs}</defs>{body}</svg>'
def ell(cx, cy, rx, ry, stroke='white', op=0.3, w=1.5, dash=None, rot=0):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" stroke="{stroke}" stroke-opacity="{op}" stroke-width="{w}"{d}{t}/>'
def sphere():
    cx, cy, r = 720, 350, 228
    b = [ell(cx, cy, r + 32, r + 32, 'white', 0.10, 1.5)]
    b.append(ell(cx, cy, r, r, FROST, 0.75, 2))
    for k, op in ((0.42, 0.26), (0.78, 0.16)):
        b.append(ell(cx, cy, r * k, r, 'white', op, 1.5))
    b.append(f'<path d="M {cx-r} {cy} A {r} {r*0.26} 0 0 0 {cx+r} {cy}" stroke="white" stroke-opacity="0.45" stroke-width="1.5"/>')
    b.append(f'<path d="M {cx-r} {cy} A {r} {r*0.26} 0 0 1 {cx+r} {cy}" stroke="white" stroke-opacity="0.22" stroke-width="1.5" stroke-dasharray="6 8"/>')
    b.append(f'<line x1="{cx}" y1="{cy-r-50}" x2="{cx}" y2="{cy+r+30}" stroke="white" stroke-opacity="0.22" stroke-width="1.5"/>')
    px, py = cx + 0.6 * r, cy - 0.58 * r
    b.append(f'<line x1="{px}" y1="{py}" x2="{px}" y2="{cy+0.14*r}" stroke="white" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="5 7"/>')
    b.append(f'<line x1="{cx}" y1="{cy}" x2="{px}" y2="{cy+0.14*r}" stroke="white" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="5 7"/>')
    b.append(f'<line x1="{cx}" y1="{cy}" x2="{px}" y2="{py}" stroke="{RED}" stroke-width="4" stroke-linecap="round"/>')
    b.append(f'<circle cx="{px}" cy="{py}" r="6" fill="white"/><circle cx="{cx}" cy="{cy}" r="4" fill="white" fill-opacity="0.8"/>')
    return svg(''.join(b))
def atom():
    cx, cy = 720, 365
    b = [ell(cx, cy, rr, rr, 'white', op, 1.2) for rr, op in ((95, .16), (135, .13), (175, .1), (215, .07))]
    for rot, red in ((0, False), (60, True), (-60, False)):
        b.append(ell(cx, cy, 215, 70, RED if red else 'white', 0.9 if red else 0.5, 2.5 if red else 2, rot=rot))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="13" fill="white"/>')
    for ang, rot in ((40, 0), (200, -60)):
        a = math.radians(ang); x0, y0 = 215 * math.cos(a), 70 * math.sin(a); t = math.radians(rot)
        x, y = cx + x0 * math.cos(t) - y0 * math.sin(t), cy + x0 * math.sin(t) + y0 * math.cos(t)
        b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="white"/>')
    return svg(''.join(b))
def barcode():
    random.seed(7)
    cx, cy, r = 770, 360, 215
    top, bot = 160, 560
    defs = '<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="0.22" stop-color="white" stop-opacity="1"/><stop offset="0.78" stop-color="white" stop-opacity="1"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>'
    b = []
    x = 330.0
    while x < cx:
        w = random.choice((1, 1, 1.5, 2, 2.5))
        op = 0.10 + 0.45 * max(0, (x - 330) / (cx - 330)) ** 1.4
        if x < cx - r:
            y1, y2 = top, bot
            b.append(f'<rect x="{x:.1f}" y="{y1}" width="{w}" height="{y2-y1}" fill="url(#fade)" fill-opacity="{op:.2f}"/>')
        else:
            h = math.sqrt(max(r * r - (x - cx) ** 2, 0))
            b.append(f'<rect x="{x:.1f}" y="{cy-h:.1f}" width="{w}" height="{2*h:.1f}" fill="white" fill-opacity="{op:.2f}"/>')
        x += w + random.choice((5, 7, 9, 12))
    for k in range(0, 9):
        rx = r * math.cos(math.radians(k * 10))
        b.append(f'<path d="M {cx} {cy-r} A {rx:.1f} {r} 0 0 1 {cx} {cy+r}" stroke="white" stroke-opacity="{0.55 - k*0.04:.2f}" stroke-width="1.5"/>')
    for lat in (-50, -25, 0, 25, 50):
        yy = cy + r * math.sin(math.radians(lat)); rx = r * math.cos(math.radians(lat))
        b.append(f'<path d="M {cx} {yy-0.18*rx:.1f} A {rx:.1f} {0.18*rx:.1f} 0 0 1 {cx} {yy+0.18*rx:.1f}" stroke="white" stroke-opacity="0.3" stroke-width="1.2"/>')
    b.append(f'<path d="M {cx} {cy-r} A {r} {r} 0 0 1 {cx} {cy+r}" stroke="{FROST}" stroke-opacity="0.8" stroke-width="2"/>')
    return svg(''.join(b), defs)
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for n, f in (('cover-sphere', sphere), ('cover-atom', atom), ('cover-barcode', barcode)):
        open(os.path.join(out, n + '.svg'), 'w').write(f())
    print('ok')
