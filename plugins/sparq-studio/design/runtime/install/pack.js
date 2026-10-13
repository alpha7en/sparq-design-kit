// Lays out the installed component library in readable rows grouped by kind (tags · backgrounds · cards · charts · icons).
// Skips curated pages (they contain sections) — the SPARQ.2 source page is arranged by hand.
await figma.loadAllPagesAsync();
const page = figma.root.children.find(p => p.name === PAGE_NAME);
if (!page) return { packed: 0, reason: 'no page' };
if (page.children.some(c => c.type === 'SECTION')) { page.setPluginData('libVersion', LIB_VERSION); return { packed: 0, reason: 'curated page (has sections)' }; }
const ORDER = ['sparq/tag', 'sparq/mark', 'sparq/rubric', 'sparq/series', 'sparq/topic', 'sparq/country', 'sparq/status', 'sparq/meta', 'sparq/bg', 'sparq/card/title', 'sparq/card/body', 'sparq/slot/', 'sparq/chart/', 'sparq/icon-plate', 'sparq/icon/'];
const rank = n => { const i = ORDER.findIndex(p => n.startsWith(p)); return i < 0 ? 99 : i; };
const sets = page.children.filter(c => (c.type === 'COMPONENT_SET' || c.type === 'COMPONENT') && c.name.startsWith('sparq/'))
  .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
const MAXW = 12000, GAP = 120;
let x = 0, y = 0, rowH = 0, last = -1;
for (const s of sets) {
  const r = rank(s.name);
  if (x > 0 && (r !== last || x + s.width > MAXW)) { x = 0; y += rowH + (r !== last ? GAP * 3 : GAP); rowH = 0; }
  s.x = x; s.y = y; x += s.width + GAP; rowH = Math.max(rowH, s.height); last = r;
}
const bottom = y + rowH;
// anything else on the page (notes, pasted frames) goes below the library, keeping its own arrangement
const others = page.children.filter(c => !sets.includes(c));
if (others.length) { const top = Math.min(...others.map(c => c.y)); const dy = bottom + 600 - top; if (dy > 0) for (const c of others) c.y += dy; }
if (MARK) page.setPluginData('libVersion', LIB_VERSION);
return { packed: sets.length, height: Math.round(bottom) };
