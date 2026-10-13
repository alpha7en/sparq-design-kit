// Maintainer tool: neon-arc cover variants (arc from the side, from a corner, «horizon» arc), no vignette, quieter halo.
const sys = figma.root.children.find(p => p.name.startsWith('SPARQ · система'));
const set = sys.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'sparq/bg');
const deg = d => d * Math.PI / 180;
const POS = {
  side:    { cx: 1130, cy: 430, k: 1.0,  a: [125, 228] },
  corner:  { cx: 1090, cy: 90,  k: 1.25, a: [100, 168] },
  horizon: { cx: 540,  cy: -330, k: 2.4, a: [22, 158] },
};
const out = [];
for (const baseName of ['cover-ring', 'cover-red-ring']) {
  const base = set.children.find(c => c.name === 'bg=' + baseName);
  for (const v of base.findAll(n => n.name === 'bg/vignette')) v.remove();
  for (const s of base.findAll(n => n.name === 'bg/ring-soft')) s.opacity = 0.32;
  for (const [pos, p] of Object.entries(POS)) {
    const name = 'bg=' + baseName + '-' + pos;
    const old = set.children.find(c => c.name === name); if (old) old.remove();
    const v = base.clone(); if (v.parent !== set) set.appendChild(v); v.name = name; v.clipsContent = true;
    for (const e of v.children.filter(c => c.type === 'ELLIPSE' && c.arcData)) {
      const R = (e.width / 2) * p.k; e.resize(2 * R, 2 * R); e.x = p.cx - R; e.y = p.cy - R;
      e.arcData = { startingAngle: deg(p.a[0]), endingAngle: deg(p.a[1]), innerRadius: 1 - (1 - e.arcData.innerRadius) / p.k };
    }
    if (pos === 'horizon') for (const s of v.findAll(n => n.name === 'bg/ring-soft')) s.visible = false;
    out.push(v.name + ' ' + v.id);
  }
}
return out;
