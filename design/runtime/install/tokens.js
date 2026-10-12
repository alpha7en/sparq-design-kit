// SPARQ Studio · token installer (Figma plugin sandbox)
// Input global: TOK = { collections:[{name, modes:[..], vars:[{name,type,scopes?,values:{mode: value | {alias:'Collection::name'}}}]}],
//                       textStyles:[{name,family,style,size,lineHeight,letterSpacing,paragraphSpacing?,textCase?}],
//                       effectStyles:[{name,effects}], paintStyles:[{name,paints}] }
// Idempotent: updates existing collections/variables/styles by name. Returns counts.
// Optional globals: PHASE ('vars' | 'styles' | 'all'), FROM/TO (text-style slice) — fonts load slowly the first time, so the server runs styles in chunks.

const __phase = typeof PHASE === 'undefined' ? 'all' : PHASE;
const out = { collections: 0, variables: 0, textStyles: 0, effectStyles: 0, paintStyles: 0, fontsMissing: [] };
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const byKey = {};
for (const v of allVars) { const c = cols.find(x => x.id === v.variableCollectionId); if (c) byKey[c.name + '::' + v.name] = v; }

const pending = [];
for (const C of (__phase === 'styles' ? [] : TOK.collections || [])) {
  let col = cols.find(c => c.name === C.name);
  if (!col) { col = figma.variables.createVariableCollection(C.name); out.collections++; }
  // modes
  const modeId = {};
  C.modes.forEach((m, i) => {
    let md = col.modes.find(x => x.name === m);
    if (!md && i === 0 && col.modes.length === 1 && !col.variableIds.length) { col.renameMode(col.modes[0].modeId, m); md = col.modes[0]; }
    if (!md) { const id = col.addMode(m); md = { modeId: id, name: m }; }
    modeId[m] = md.modeId;
  });
  for (const V of C.vars) {
    const key = C.name + '::' + V.name;
    let v = byKey[key];
    if (!v) { v = figma.variables.createVariable(V.name, col, V.type); byKey[key] = v; out.variables++; }
    if (V.scopes) try { v.scopes = V.scopes; } catch (e) {}
    if (V.description) v.description = V.description;
    for (const [m, val] of Object.entries(V.values)) {
      if (val && typeof val === 'object' && val.alias) pending.push([v, modeId[m], val.alias]);
      else v.setValueForMode(modeId[m], val);
    }
  }
}
for (const [v, mid, alias] of pending) {
  const t = byKey[alias] || Object.entries(byKey).find(([k]) => k.endsWith('::' + alias.split('::').pop()))?.[1];
  if (t) v.setValueForMode(mid, { type: 'VARIABLE_ALIAS', id: t.id });
}

const ts = await figma.getLocalTextStylesAsync();
const __ts = (__phase === 'vars' ? [] : TOK.textStyles || []).slice(typeof FROM === 'undefined' ? 0 : FROM, typeof TO === 'undefined' ? undefined : TO);
for (const S of __ts) {
  try { await figma.loadFontAsync({ family: S.family, style: S.style }); } catch (e) { out.fontsMissing.push(S.family + ' ' + S.style); continue; }
  let s = ts.find(x => x.name === S.name);
  if (!s) { s = figma.createTextStyle(); s.name = S.name; out.textStyles++; }
  s.fontName = { family: S.family, style: S.style }; s.fontSize = S.size;
  if (S.lineHeight) s.lineHeight = S.lineHeight;
  if (S.letterSpacing) s.letterSpacing = S.letterSpacing;
  if (S.paragraphSpacing) s.paragraphSpacing = S.paragraphSpacing;
  if (S.textCase && S.textCase !== 'ORIGINAL') s.textCase = S.textCase;
  if (S.description) s.description = S.description;
}
const es = await figma.getLocalEffectStylesAsync();
for (const S of (__phase === 'styles' && typeof FROM !== 'undefined' && FROM > 0 ? [] : __phase === 'vars' ? [] : TOK.effectStyles || [])) {
  let s = es.find(x => x.name === S.name);
  if (!s) { s = figma.createEffectStyle(); s.name = S.name; out.effectStyles++; }
  s.effects = S.effects.map(e => { const o = { ...e }; delete o.boundVariables; return o; });
}
const ps = await figma.getLocalPaintStylesAsync();
for (const S of (__phase === 'styles' && typeof FROM !== 'undefined' && FROM > 0 ? [] : __phase === 'vars' ? [] : TOK.paintStyles || [])) {
  let s = ps.find(x => x.name === S.name);
  if (!s) { s = figma.createPaintStyle(); s.name = S.name; out.paintStyles++; }
  s.paints = S.paints.map(p => { const o = { ...p }; delete o.boundVariables; return o; });
}
out.fontsMissing = [...new Set(out.fontsMissing)];
return out;
