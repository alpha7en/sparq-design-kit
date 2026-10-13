// Maintainer tool: duo title card — two clean portrait windows, quiet background, no glass plate.
const sys = figma.root.children.find(p => p.name.startsWith('SPARQ · система'));
const set = sys.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'sparq/card/title');
const v = set.children.find(c => c.name === 'kind=duo, tone=dark');
const bgs = sys.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'sparq/bg');
v.findOne(n => n.name === 'bg').swapComponent(bgs.children.find(c => c.name === 'bg=dark-ticks'));
const L = v.findOne(n => n.name === 'photo-left'), R = v.findOne(n => n.name === 'photo-right');
for (const [p, x] of [[L, 72], [R, 552]]) { p.resize(456, 600); p.x = x; p.y = 184; }
const g = v.findOne(n => n.name === 'glass'); g.fills = []; g.effects = []; g.strokes = []; g.paddingLeft = g.paddingRight = 0; g.paddingTop = 24; g.paddingBottom = 0;
return { ok: true };
