// Maintainer tool: background clean-up after client review 2026-10-13.
const sys = figma.root.children.find(p => p.name.startsWith('SPARQ · система'));
const set = sys.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'sparq/bg');
const v = n => set.children.find(c => c.name === 'bg=' + n);
const log = [];
// 1. no glow blob around the orbit vector
for (const x of v('cover-orbit').findAll(n => n.name === 'bg/vector')) { x.effects = []; log.push('orbit glow off'); }
// 2. lone dots on quiet backgrounds — removed («точка лишняя», «одинокая точка»)
for (const name of ['dark-orbit', 'dark-crosshair', 'dark-dots', 'dark-wires', 'dark-circuit']) {
  for (const x of v(name).findAll(n => n.type === 'ELLIPSE' && n.width <= 20 && n.height <= 20)) { x.remove(); log.push(name + ' dot'); }
}
// 3. supremat: red disc → thin red ring, plank quieter
const sup = v('cover-supremat');
for (const c of sup.findAll(n => n.name === 'bg/circle')) { c.fills = []; c.strokes = [{ type: 'SOLID', color: { r: 1, g: 0.165, b: 0.165 } }]; c.strokeWeight = 3; c.effects = []; log.push('supremat circle → ring'); }
for (const p of sup.findAll(n => n.name === 'bg/plank')) { p.opacity = 0.16; log.push('plank quiet'); }
// 4. not backgrounds: infographic pieces and the empty field
for (const name of ['cover-landscape', 'cover-contours', 'cover-network', 'dark-field']) { const x = v(name); if (x) { x.remove(); log.push('removed ' + name); } }
return log;
