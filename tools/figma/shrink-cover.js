// Maintainer tool: scale a cover's art towards the top-right corner so it stays above the title zone (NAMES, K injected)
const set = figma.root.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'sparq/bg');
const out = [];
for (const name of NAMES) {
  const v = set.children.find(c => c.name === 'bg=' + name); if (!v) continue;
  if (v.getPluginData('shrunk')) { out.push(name + ' already'); continue; }
  for (const c of v.children) { if (/clear|vignette/.test(c.name)) continue; const x = c.x, y = c.y; c.rescale(K); c.x = 1080 - (1080 - x) * K - 24; c.y = y * K + 40; }
  v.clipsContent = true; v.setPluginData('shrunk', String(K)); out.push(name);
}
return out;
