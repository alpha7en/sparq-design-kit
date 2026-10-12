// Maintainer tool: adds/replaces one illustration background variant `bg=<NAME>` in sparq/bg (SPARQ.2 system page).
// Globals injected by the caller: NAME, SVG, PLACE {x,y,w}  (w = rendered width of the illustration inside the 1080² card)
const sys = figma.root.children.find(p => p.name.startsWith('SPARQ · система'));
const set = sys.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'sparq/bg');
const base = set.children.find(c => c.name === 'bg=dark-orbit');
const old = set.children.find(c => c.name === 'bg=' + NAME); if (old) old.remove();
const v = base.clone(); if (v.parent !== set) set.appendChild(v);
v.name = 'bg=' + NAME;
for (const c of v.children.slice()) c.remove();
const g = figma.createNodeFromSvg(SVG); v.appendChild(g);
g.name = 'bg/illus'; g.rescale(PLACE.w / g.width); g.x = PLACE.x; g.y = PLACE.y;
v.clipsContent = true;
// optional window: the illustration is clipped to PLACE.box {y,h} so it never reaches the header (y<150) or the title zone
if (PLACE.box) {
  const win = figma.createFrame(); win.name = 'bg/illus-window'; win.fills = []; win.clipsContent = true;
  v.appendChild(win); win.resize(1080, PLACE.box.h); win.x = 0; win.y = PLACE.box.y;
  win.appendChild(g); g.x = PLACE.x; g.y = PLACE.y - PLACE.box.y;
  if (PLACE.fade) { // soft top/bottom edge: gradient from the card base colour to transparent
    const f0 = v.fills && v.fills[0]; const c = f0 && f0.color ? f0.color : { r: 0.04, g: 0.04, b: 0.05 };
    for (const top of [true, false]) {
      const r = figma.createRectangle(); win.appendChild(r); r.name = 'bg/illus-fade'; r.resize(1080, PLACE.fade); r.x = 0; r.y = top ? 0 : PLACE.box.h - PLACE.fade;
      r.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: top ? [[0, 1, 0], [-1, 0, 1]] : [[0, -1, 1], [1, 0, 0]], gradientStops: [{ position: 0, color: { ...c, a: 1 } }, { position: 1, color: { ...c, a: 0 } }] }];
    }
  }
}
// grid slot: after the last variant
const others = set.children.filter(c => c !== v);
const last = others.reduce((a, c) => (c.y > a.y || (c.y === a.y && c.x > a.x)) ? c : a, others[0]);
const w = v.width, gap = 40, perRow = 6; const idx = others.length;
v.x = (idx % perRow) * (w + gap); v.y = Math.floor(idx / perRow) * (v.height + gap);
return { id: v.id, name: v.name, setW: Math.round(set.width), setH: Math.round(set.height), illus: [Math.round(g.width), Math.round(g.height)] };
