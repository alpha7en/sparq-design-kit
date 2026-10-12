// SPARQ Studio · maintainer: export variables + styles of the current file (raw format for tools/build-design.mjs)
const cols = await figma.variables.getLocalVariableCollectionsAsync(); const cn = {}; cols.forEach(c => cn[c.id] = c);
const byId = {}; for (const v of await figma.variables.getLocalVariablesAsync()) byId[v.id] = v;
const vars = [];
for (const v of Object.values(byId)) { const c = cn[v.variableCollectionId]; const values = {};
  for (const m of c.modes) { let val = v.valuesByMode[m.modeId]; if (val && val.type === 'VARIABLE_ALIAS') val = { alias: byId[val.id] ? byId[val.id].name : null }; values[m.name] = val; }
  vars.push({ collection: c.name, name: v.name, type: v.resolvedType, scopes: v.scopes, description: v.description, values }); }
const textStyles = (await figma.getLocalTextStylesAsync()).map(s => ({ name: s.name, family: s.fontName.family, style: s.fontName.style, size: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, paragraphSpacing: s.paragraphSpacing, textCase: s.textCase, description: s.description }));
const effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => ({ name: s.name, effects: s.effects }));
const paintStyles = (await figma.getLocalPaintStylesAsync()).map(s => ({ name: s.name, paints: s.paints }));
return { variables: vars, textStyles, effectStyles, paintStyles };
