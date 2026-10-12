// SPARQ Studio · maintainer tool
// Serialises every COMPONENT / COMPONENT_SET on a page into a JSON snapshot that
// design/runtime/install.js can rebuild in any other file (no Figma library needed).
// Runs inside the Figma plugin sandbox. Inputs (globals injected by the caller):
//   PAGE_PREFIX  – page name prefix of the system page
//   SECTIONS     – optional array of section-name prefixes to include (null = all)
// Returns the snapshot object.

await figma.loadAllPagesAsync();
const page = figma.root.children.find(p => p.name.startsWith(PAGE_PREFIX));
if (!page) throw new Error('page not found: ' + PAGE_PREFIX);
await page.loadAsync();

const varName = {};
for (const v of await figma.variables.getLocalVariablesAsync()) {
  const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  varName[v.id] = col.name + '::' + v.name;
}
const styleName = {};
for (const s of [...await figma.getLocalTextStylesAsync(), ...await figma.getLocalPaintStylesAsync(), ...await figma.getLocalEffectStylesAsync()]) styleName[s.id] = s.name;

const refOf = (comp) => {
  if (!comp) return null;
  if (comp.parent && comp.parent.type === 'COMPONENT_SET') return { set: comp.parent.name, v: comp.name };
  return { c: comp.name };
};
const r2 = x => Math.round(x * 100) / 100;
const col = c => c ? { r: r2(c.r * 255) / 255, g: r2(c.g * 255) / 255, b: r2(c.b * 255) / 255, ...(c.a !== undefined ? { a: r2(c.a) } : {}) } : c;

const paint = p => {
  const o = { type: p.type };
  if (p.visible === false) o.visible = false;
  if (p.opacity !== undefined && p.opacity !== 1) o.opacity = r2(p.opacity);
  if (p.blendMode && p.blendMode !== 'NORMAL') o.blendMode = p.blendMode;
  if (p.type === 'SOLID') { o.color = col(p.color); if (p.boundVariables && p.boundVariables.color) o.var = varName[p.boundVariables.color.id]; }
  else if (p.type.startsWith('GRADIENT')) { o.gradientTransform = p.gradientTransform.map(r => r.map(r2)); o.gradientStops = p.gradientStops.map(s => ({ position: r2(s.position), color: col(s.color) })); }
  else if (p.type === 'IMAGE') { o.scaleMode = p.scaleMode; o.imageHash = p.imageHash; }
  return o;
};
const paints = arr => (arr === figma.mixed || !arr) ? null : arr.map(paint);
const effects = arr => arr.map(e => { const o = { ...e }; if (o.color) o.color = col(o.color); delete o.boundVariables; return o; });

const SKIP_LAYOUT = new Set();
async function ser(n, inComponentRoot) {
  const o = { t: n.type, n: n.name };
  if (n.visible === false) o.vis = false;
  if (n.opacity !== undefined && n.opacity !== 1) o.op = r2(n.opacity);
  if (n.blendMode && n.blendMode !== 'PASS_THROUGH' && n.blendMode !== 'NORMAL') o.bm = n.blendMode;
  if (n.isMask) { o.mask = true; o.maskType = n.maskType; }
  o.w = r2(n.width); o.h = r2(n.height);
  const rt = n.relativeTransform; o.tf = [[r2(rt[0][0]), r2(rt[0][1]), r2(rt[0][2])], [r2(rt[1][0]), r2(rt[1][1]), r2(rt[1][2])]];
  if (n.constraints) o.cons = n.constraints;
  if (n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE') {
    o.lp = n.layoutPositioning; o.la = n.layoutAlign; o.lg = n.layoutGrow;
    try { o.lsh = n.layoutSizingHorizontal; o.lsv = n.layoutSizingVertical; } catch (e) {}
  }
  for (const k of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (n[k] !== null && n[k] !== undefined) o[k] = n[k];
  if ('fills' in n) { const f = paints(n.fills); if (f) o.fills = f; else o.fillsMixed = true; if (n.fillStyleId && typeof n.fillStyleId === 'string') o.fillStyle = styleName[n.fillStyleId]; }
  if ('strokes' in n && n.strokes.length) {
    o.strokes = paints(n.strokes); o.sw = n.strokeWeight === figma.mixed ? null : n.strokeWeight; o.sa = n.strokeAlign;
    if (n.strokeStyleId) o.strokeStyle = styleName[n.strokeStyleId];
    if ('strokeTopWeight' in n && n.strokeWeight === figma.mixed) o.swi = [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight];
    if (n.dashPattern && n.dashPattern.length) o.dash = n.dashPattern;
    if (n.strokeCap && n.strokeCap !== figma.mixed && n.strokeCap !== 'NONE') o.cap = n.strokeCap;
    if (n.strokeJoin && n.strokeJoin !== figma.mixed && n.strokeJoin !== 'MITER') o.join = n.strokeJoin;
  }
  if ('effects' in n && n.effects.length) { o.fx = effects(n.effects); if (n.effectStyleId) o.fxStyle = styleName[n.effectStyleId]; }
  if ('cornerRadius' in n) {
    if (n.cornerRadius === figma.mixed) o.cri = [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius];
    else if (n.cornerRadius) o.cr = n.cornerRadius;
  }
  if ('clipsContent' in n) o.clip = n.clipsContent;
  if (n.boundVariables) {
    const bv = {};
    for (const [k, v] of Object.entries(n.boundVariables)) {
      if (k === 'fills' || k === 'strokes' || k === 'effects' || k === 'textRangeFills') continue;
      if (v && v.id) bv[k] = varName[v.id];
    }
    if (Object.keys(bv).length) o.bv = bv;
  }
  if (n.componentPropertyReferences && Object.keys(n.componentPropertyReferences).length) o.pref = n.componentPropertyReferences;
  if ('layoutMode' in n && n.layoutMode !== 'NONE' && n.type !== 'INSTANCE') {
    o.al = { m: n.layoutMode, pas: n.primaryAxisSizingMode, cas: n.counterAxisSizingMode, pai: n.primaryAxisAlignItems, cai: n.counterAxisAlignItems, gap: n.itemSpacing, pad: [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft] };
    if (n.layoutWrap === 'WRAP') { o.al.wrap = true; o.al.cgap = n.counterAxisSpacing; }
    if (n.itemReverseZIndex) o.al.rz = true;
    if (n.strokesIncludedInLayout) o.al.sil = true;
  }
  if (n.type === 'TEXT') {
    o.chars = n.characters;
    o.tah = n.textAlignHorizontal; o.tav = n.textAlignVertical; o.tar = n.textAutoResize;
    if (n.textTruncation === 'ENDING') { o.trunc = true; o.maxLines = n.maxLines; }
    const segs = n.getStyledTextSegments(['fontName', 'fontSize', 'textStyleId', 'fills', 'letterSpacing', 'lineHeight', 'textCase', 'textDecoration', 'fillStyleId']);
    o.segs = segs.map(s => {
      const g = { s: s.start, e: s.end, font: s.fontName, size: s.fontSize, ls: s.letterSpacing, lh: s.lineHeight };
      if (s.textCase !== 'ORIGINAL') g.tc = s.textCase;
      if (s.textDecoration !== 'NONE') g.td = s.textDecoration;
      if (s.textStyleId) g.style = styleName[s.textStyleId];
      g.fills = s.fills.map(paint);
      if (s.fillStyleId) g.fillStyle = styleName[s.fillStyleId];
      return g;
    });
    if (n.paragraphSpacing) o.ps = n.paragraphSpacing;
  }
  if (n.type === 'ELLIPSE' && n.arcData && (n.arcData.startingAngle !== 0 || Math.abs(n.arcData.endingAngle - 2 * Math.PI) > 1e-6 || n.arcData.innerRadius)) o.arc = n.arcData;
  if (n.type === 'VECTOR') { o.vn = n.vectorNetwork; o.hm = n.handleMirroring === figma.mixed ? null : n.handleMirroring; }
  if (n.type === 'INSTANCE') {
    o.ref = refOf(await n.getMainComponentAsync());
    const props = {};
    for (const [k, v] of Object.entries(n.componentProperties)) {
      const name = k.split('#')[0];
      if (v.type === 'VARIANT') continue;
      props[name] = v.type === 'INSTANCE_SWAP' ? { swap: null } : v.value;
    }
    o.props = props;
    // Overrides on nested nodes: record per-path the values of overridden fields we can re-apply.
    const ov = [];
    for (const item of n.overrides) {
      const node = item.id === n.id ? n : n.findOne(x => x.id === item.id);
      if (!node || node === n) continue;
      const path = []; let p = node; while (p && p !== n) { path.unshift(p.parent.children.indexOf(p)); p = p.parent; }
      const rec = { path, f: {} };
      for (const fld of item.overriddenFields) {
        if (fld === 'characters' && node.type === 'TEXT') rec.f.characters = node.characters;
        else if (fld === 'visible') rec.f.visible = node.visible;
        else if (fld === 'opacity') rec.f.opacity = node.opacity;
        else if (fld === 'fills' && node.fills !== figma.mixed) rec.f.fills = node.fills.map(paint);
        else if (fld === 'strokes') rec.f.strokes = node.strokes.map(paint);
        else if (fld === 'name') rec.f.name = node.name;
        else if (fld === 'textStyleId' && node.textStyleId && node.textStyleId !== figma.mixed) rec.f.textStyle = styleName[node.textStyleId];
      }
      if (Object.keys(rec.f).length) ov.push(rec);
    }
    if (ov.length) o.ov = ov;
    return o; // children of instances are produced by the main component
  }
  if ('children' in n) { o.ch = []; for (const c of n.children) o.ch.push(await ser(c)); }
  return o;
}

// Resolve INSTANCE_SWAP values (component ids) to refs once, async-safe.
async function swapRefs(snap, node) {
  if (node.type === 'INSTANCE') {
    for (const [k, v] of Object.entries(node.componentProperties)) {
      if (v.type !== 'INSTANCE_SWAP') continue;
      const c = await figma.getNodeByIdAsync(v.value);
      snap.props[k.split('#')[0]] = { swap: refOf(c) };
    }
    return;
  }
  if ('children' in node && snap.ch) for (let i = 0; i < node.children.length; i++) await swapRefs(snap.ch[i], node.children[i]);
}

const defs = async (owner) => {
  const out = {};
  for (const [k, d] of Object.entries(owner.componentPropertyDefinitions || {})) {
    const name = k.split('#')[0];
    const o = { type: d.type };
    if (d.type === 'VARIANT') o.options = d.variantOptions;
    else if (d.type === 'INSTANCE_SWAP') { const c = await figma.getNodeByIdAsync(d.defaultValue); o.def = refOf(c); o.pref = (d.preferredValues || []).length; }
    else o.def = d.defaultValue;
    out[name] = o;
  }
  return out;
};
const depsOf = (snap, acc) => { if (snap.ref) acc.add(snap.ref.set || snap.ref.c); if (snap.props) for (const v of Object.values(snap.props)) if (v && v.swap && v.swap.set) acc.add(v.swap.set); else if (v && v.swap && v.swap.c) acc.add(v.swap.c); (snap.ch || []).forEach(c => depsOf(c, acc)); return acc; };

const items = [];
const inSections = n => { if (!SECTIONS) return true; let p = n; while (p.parent && p.parent.type !== 'PAGE') p = p.parent; return SECTIONS.some(s => p.name.startsWith(s)); };
const owners = page.findAll(n => (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET')) && inSections(n));
for (const ow of owners) {
  const sec = (() => { let p = ow; while (p.parent && p.parent.type !== 'PAGE') p = p.parent; return p.name; })();
  const entry = { kind: ow.type === 'COMPONENT_SET' ? 'set' : 'component', name: ow.name, section: sec, desc: ow.description || '', props: await defs(ow), x: r2(ow.x), y: r2(ow.y) };
  const comps = ow.type === 'COMPONENT_SET' ? ow.children : [ow];
  entry.variants = [];
  for (const c of comps) {
    const s = await ser(c, true);
    await swapRefs(s, c);
    s.desc = c.description || '';
    entry.variants.push(s);
  }
  if (ow.type === 'COMPONENT_SET') entry.setFrame = { w: r2(ow.width), h: r2(ow.height), al: ow.layoutMode !== 'NONE' ? { m: ow.layoutMode, gap: ow.itemSpacing, pad: [ow.paddingTop, ow.paddingRight, ow.paddingBottom, ow.paddingLeft], wrap: ow.layoutWrap === 'WRAP', cgap: ow.counterAxisSpacing } : null, fills: paints(ow.fills), strokes: paints(ow.strokes), cr: ow.cornerRadius === figma.mixed ? 0 : ow.cornerRadius };
  entry.deps = [...entry.variants.reduce((a, v) => depsOf(v, a), new Set())].filter(d => d !== ow.name);
  items.push(entry);
}
// topological order
const byName = Object.fromEntries(items.map(i => [i.name, i]));
const done = new Set(), order = [];
const visit = (i, stack = new Set()) => { if (done.has(i.name)) return; if (stack.has(i.name)) return; stack.add(i.name); for (const d of i.deps) if (byName[d]) visit(byName[d], stack); done.add(i.name); order.push(i); };
items.forEach(i => visit(i));
return { format: 'sparq-library/1', source: { file: figma.root.name, page: page.name, at: new Date().toISOString() }, items: order };
