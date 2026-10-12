// SPARQ Studio · component library installer (Figma plugin sandbox)
// Rebuilds component sets from a snapshot (tools/figma/snapshot-library.js) on a page of the
// current file, with variants, component properties, nested instances, style/variable bindings.
// Globals: ITEMS (snapshot items, dependency-ordered), PAGE_NAME, REPLACE (bool), BUDGET_MS (optional)
// Works in time slices: stops after BUDGET_MS and remembers a half-built set in page plugin data,
// so the server can call it again with the remaining items.
// Returns { installed:[names], skipped:[names], warnings:[], done:bool }

await figma.loadAllPagesAsync();
let page = figma.root.children.find(p => p.name === PAGE_NAME);
if (!page) { page = figma.createPage(); page.name = PAGE_NAME; }
await page.loadAsync();
const warnings = [];
const W = m => { if (warnings.length < 60) warnings.push(m); };

// lookups in the target file
const vars = {}; { const cn = {}; for (const c of await figma.variables.getLocalVariableCollectionsAsync()) cn[c.id] = c.name; for (const v of await figma.variables.getLocalVariablesAsync()) vars[cn[v.variableCollectionId] + '::' + v.name] = v; }
const styles = {}; for (const s of [...await figma.getLocalTextStylesAsync(), ...await figma.getLocalPaintStylesAsync(), ...await figma.getLocalEffectStylesAsync()]) styles[s.name] = s;
const fonts = new Set(); const loadFont = async f => { const k = f.family + '|' + f.style; if (fonts.has(k)) return; try { await figma.loadFontAsync(f); } catch (e) { W('font missing: ' + k); } fonts.add(k); };

const owners = {}; // name -> COMPONENT_SET | COMPONENT
for (const n of page.findAll(x => x.type === 'COMPONENT_SET' || (x.type === 'COMPONENT' && x.parent.type !== 'COMPONENT_SET'))) owners[n.name] = n;
const resolve = ref => {
  if (!ref) return null;
  if (ref.set) { const s = owners[ref.set]; if (!s) return null; return s.children.find(c => c.name === ref.v) || s.defaultVariant || null; }
  return owners[ref.c] || null;
};

const paintOf = p => {
  const o = { type: p.type };
  if (p.visible === false) o.visible = false;
  if (p.blendMode) o.blendMode = p.blendMode;
  if (p.type === 'SOLID') { o.color = { r: p.color.r, g: p.color.g, b: p.color.b }; o.opacity = p.opacity ?? 1; }
  else if (p.type.startsWith('GRADIENT')) { o.gradientTransform = p.gradientTransform; o.gradientStops = p.gradientStops; o.opacity = p.opacity ?? 1; }
  else return null;
  if (p.var && vars[p.var]) { const op = o.opacity; const b = figma.variables.setBoundVariableForPaint(o, 'color', vars[p.var]); return { ...b, opacity: op }; }
  return o;
};
const paintsOf = arr => (arr || []).map(paintOf).filter(Boolean);
const setPaints = (n, prop, arr) => { const ps = paintsOf(arr); n[prop] = ps; n[prop] = n[prop].map((p, i) => ({ ...p, opacity: ps[i].opacity ?? 1 })); };

async function make(s, parent) {
  let n;
  switch (s.t) {
    case 'COMPONENT': n = figma.createComponent(); break;
    case 'FRAME': n = figma.createFrame(); break;
    case 'RECTANGLE': n = figma.createRectangle(); break;
    case 'ELLIPSE': n = figma.createEllipse(); break;
    case 'TEXT': n = figma.createText(); break;
    case 'VECTOR': n = figma.createVector(); break;
    case 'LINE': n = figma.createLine(); break;
    case 'INSTANCE': {
      const main = resolve(s.ref);
      if (!main) { W('missing main for instance ' + s.n + ' → ' + JSON.stringify(s.ref)); n = figma.createFrame(); n.fills = []; break; }
      n = main.createInstance(); break;
    }
    default: W('unsupported node ' + s.t + ' ' + s.n); n = figma.createFrame(); n.fills = [];
  }
  if (parent) parent.appendChild(n);
  n.name = s.n;
  if (s.t === 'VECTOR') { try { await n.setVectorNetworkAsync(s.vn); } catch (e) { W('vector ' + s.n + ': ' + e.message); } if (s.hm) try { n.handleMirroring = s.hm; } catch (e) {} }
  if (s.t === 'TEXT') {
    const f0 = s.segs[0].font; await loadFont(f0); for (const g of s.segs) await loadFont(g.font);
    n.fontName = f0; n.characters = s.chars;
    for (const g of s.segs) {
      if (g.style && styles[g.style]) await n.setRangeTextStyleIdAsync(g.s, g.e, styles[g.style].id);
      else { n.setRangeFontName(g.s, g.e, g.font); n.setRangeFontSize(g.s, g.e, g.size); n.setRangeLetterSpacing(g.s, g.e, g.ls); n.setRangeLineHeight(g.s, g.e, g.lh); }
      if (g.tc) n.setRangeTextCase(g.s, g.e, g.tc);
      if (g.td) n.setRangeTextDecoration(g.s, g.e, g.td);
      if (g.fillStyle && styles[g.fillStyle]) await n.setRangeFillStyleIdAsync(g.s, g.e, styles[g.fillStyle].id);
      else { const ps = paintsOf(g.fills); n.setRangeFills(g.s, g.e, ps); }
    }
    n.textAlignHorizontal = s.tah; n.textAlignVertical = s.tav;
    if (s.ps) n.paragraphSpacing = s.ps;
    if (s.trunc) { n.textTruncation = 'ENDING'; n.maxLines = s.maxLines; }
  }
  if (s.t !== 'INSTANCE') {
    if ('fills' in n && s.fills && s.t !== 'TEXT') { if (s.fillStyle && styles[s.fillStyle]) await n.setFillStyleIdAsync(styles[s.fillStyle].id); else setPaints(n, 'fills', s.fills); }
    else if ('fills' in n && !s.fills && s.t !== 'TEXT' && !s.fillsMixed) n.fills = [];
    if (s.strokes) {
      if (s.strokeStyle && styles[s.strokeStyle]) await n.setStrokeStyleIdAsync(styles[s.strokeStyle].id); else setPaints(n, 'strokes', s.strokes);
      if (s.sw !== null && s.sw !== undefined) n.strokeWeight = s.sw;
      if (s.swi) { [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight] = s.swi; }
      if (s.sa) n.strokeAlign = s.sa; if (s.dash) n.dashPattern = s.dash; if (s.cap) try { n.strokeCap = s.cap; } catch (e) {} if (s.join) n.strokeJoin = s.join;
    }
    if (s.fx) { if (s.fxStyle && styles[s.fxStyle]) await n.setEffectStyleIdAsync(styles[s.fxStyle].id); else n.effects = s.fx; }
    if (s.cr) n.cornerRadius = s.cr; if (s.cri) [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius] = s.cri;
    if ('clipsContent' in n && s.clip !== undefined) n.clipsContent = s.clip;
    if (s.arc) n.arcData = s.arc;
    if (s.mask) { n.isMask = true; if (s.maskType) try { n.maskType = s.maskType; } catch (e) {} }
  }
  if (s.op !== undefined) n.opacity = s.op;
  if (s.bm) try { n.blendMode = s.bm; } catch (e) {}
  // size before children so constraints behave; texts sized after characters
  if (s.t === 'TEXT') { n.textAutoResize = s.tar === 'TRUNCATE' ? 'NONE' : s.tar; if (s.tar === 'NONE' || s.tar === 'TRUNCATE') n.resize(Math.max(s.w, .01), Math.max(s.h, .01)); else if (s.tar === 'HEIGHT') n.resize(Math.max(s.w, .01), n.height); }
  else if (s.t !== 'VECTOR') { try { n.resize(Math.max(s.w, .01), Math.max(s.h, .01)); } catch (e) {} }
  // children
  if (s.ch && s.t !== 'INSTANCE') for (const c of s.ch) await make(c, n);
  // own auto-layout after children exist
  if (s.al) {
    n.layoutMode = s.al.m; n.primaryAxisAlignItems = s.al.pai; n.counterAxisAlignItems = s.al.cai; n.itemSpacing = s.al.gap;
    [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft] = s.al.pad;
    if (s.al.wrap) { n.layoutWrap = 'WRAP'; n.counterAxisSpacing = s.al.cgap; }
    if (s.al.rz) n.itemReverseZIndex = true; if (s.al.sil) n.strokesIncludedInLayout = true;
    // children layout props
    s.ch && s.ch.forEach((c, i) => {
      const k = n.children[i]; if (!k) return;
      if (c.lp === 'ABSOLUTE') { k.layoutPositioning = 'ABSOLUTE'; k.relativeTransform = c.tf; if (c.cons) k.constraints = c.cons; return; }
      if (c.la) k.layoutAlign = c.la; if (c.lg !== undefined) k.layoutGrow = c.lg;
      try { if (c.lsh) k.layoutSizingHorizontal = c.lsh; if (c.lsv) k.layoutSizingVertical = c.lsv; } catch (e) {}
    });
    try { n.resize(Math.max(s.w, .01), Math.max(s.h, .01)); } catch (e) {}
    n.primaryAxisSizingMode = s.al.pas; n.counterAxisSizingMode = s.al.cas;
  } else if (s.ch && s.t !== 'INSTANCE') {
    s.ch.forEach((c, i) => { const k = n.children[i]; if (!k) return; k.relativeTransform = c.tf; if (c.cons) try { k.constraints = c.cons; } catch (e) {} });
  }
  for (const k of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (s[k] !== undefined) try { n[k] = s[k]; } catch (e) {}
  if (s.bv) for (const [f, vn] of Object.entries(s.bv)) { if (vars[vn]) try { n.setBoundVariable(f, vars[vn]); } catch (e) {} }
  return n;
}

// apply instance props & overrides once the whole tree exists (props need component keys)
async function finishInstances(s, n) {
  if (s.t === 'INSTANCE' && n.type === 'INSTANCE') {
    const props = {};
    for (const [k, def] of Object.entries(n.componentProperties)) {
      const base = k.split('#')[0]; if (!(base in (s.props || {}))) continue;
      const v = s.props[base];
      if (def.type === 'INSTANCE_SWAP') { const c = v && v.swap ? resolve(v.swap) : null; if (c) props[k] = c.id; }
      else if (def.type !== 'VARIANT') props[k] = v;
    }
    try { if (Object.keys(props).length) n.setProperties(props); } catch (e) { W('props ' + s.n + ': ' + e.message); }
    for (const o of s.ov || []) {
      let t = n; for (const i of o.path) { t = t && t.children ? t.children[i] : null; }
      if (!t) continue;
      try {
        if (o.f.textStyle && t.type === 'TEXT' && styles[o.f.textStyle]) { await loadFont(styles[o.f.textStyle].fontName); await t.setTextStyleIdAsync(styles[o.f.textStyle].id); }
        if (o.f.characters !== undefined && t.type === 'TEXT') { const fn = t.fontName === figma.mixed ? t.getRangeFontName(0, 1) : t.fontName; await loadFont(fn); t.characters = o.f.characters; }
        if (o.f.visible !== undefined) t.visible = o.f.visible;
        if (o.f.opacity !== undefined) t.opacity = o.f.opacity;
        if (o.f.fills) setPaints(t, 'fills', o.f.fills);
        if (o.f.strokes) setPaints(t, 'strokes', o.f.strokes);
        if (o.f.name) t.name = o.f.name;
      } catch (e) { W('override ' + s.n + ': ' + e.message); }
    }
    if (s.vis === false) n.visible = false;
    return;
  }
  if (s.ch && 'children' in n) for (let i = 0; i < s.ch.length; i++) if (n.children[i]) await finishInstances(s.ch[i], n.children[i]);
}
// bind component properties to nodes inside a component (after properties exist)
function bindRefs(s, n, keyOf) {
  if (s.pref && s.t !== 'COMPONENT') {
    const refs = {};
    for (const [field, oldKey] of Object.entries(s.pref)) { const nk = keyOf[oldKey.split('#')[0]]; if (nk) refs[field] = nk; }
    try { if (Object.keys(refs).length) n.componentPropertyReferences = refs; } catch (e) { W('bind ' + s.n + ': ' + e.message); }
  }
  if (s.ch && s.t !== 'INSTANCE' && 'children' in n) s.ch.forEach((c, i) => n.children[i] && bindRefs(c, n.children[i], keyOf));
}

const installed = [], skipped = [];
const START = Date.now(); const BUDGET = typeof BUDGET_MS === 'undefined' ? 20000 : BUDGET_MS;
let state = JSON.parse(page.getPluginData('install') || 'null');
// orphan variants from an interrupted run (root-level components named like variants, not in state)
for (const c of page.children.slice()) if (c.type === 'COMPONENT' && c.name.includes('=') && !(state && state.ids.includes(c.id))) c.remove();
for (const it of ITEMS) {
  const resuming = state && state.name === it.name;
  if (owners[it.name] && !resuming) { if (!REPLACE) { skipped.push(it.name); continue; } owners[it.name].remove(); delete owners[it.name]; }
  let comps = [];
  if (resuming) for (const id of state.ids) { const n = await figma.getNodeByIdAsync(id); if (n) comps.push(n); }
  for (let i = comps.length; i < it.variants.length; i++) {
    if (Date.now() - START > BUDGET) { page.setPluginData('install', JSON.stringify({ name: it.name, ids: comps.map(c => c.id) })); return { installed, skipped, warnings, done: false, pending: it.name, at: i + '/' + it.variants.length }; }
    const v = it.variants[i]; const c = await make(v, page); if (v.desc) c.description = v.desc; c.x = -20000; c.y = i * 10; comps.push(c);
  }
  page.setPluginData('install', ''); state = null;
  let owner;
  if (it.kind === 'set') {
    owner = figma.combineAsVariants(comps, page); owner.name = it.name;
    const sf = it.setFrame || {};
    if (sf.al) { owner.layoutMode = sf.al.m; owner.itemSpacing = sf.al.gap; [owner.paddingTop, owner.paddingRight, owner.paddingBottom, owner.paddingLeft] = sf.al.pad; if (sf.al.wrap) { owner.layoutWrap = 'WRAP'; owner.counterAxisSpacing = sf.al.cgap; } owner.primaryAxisSizingMode = 'AUTO'; owner.counterAxisSizingMode = 'AUTO'; }
    else { it.variants.forEach((v, i) => { comps[i].x = v.tf[0][2]; comps[i].y = v.tf[1][2]; }); owner.resizeWithoutConstraints(Math.max(sf.w || owner.width, 10), Math.max(sf.h || owner.height, 10)); }
    if (sf.fills) setPaints(owner, 'fills', sf.fills); if (sf.strokes && sf.strokes.length) { setPaints(owner, 'strokes', sf.strokes); owner.strokeWeight = 1; }
    if (sf.cr) owner.cornerRadius = sf.cr;
  } else owner = comps[0];
  if (it.desc) owner.description = it.desc;
  const keyOf = {};
  for (const [name, d] of Object.entries(it.props || {})) {
    if (d.type === 'VARIANT') continue;
    try {
      if (d.type === 'INSTANCE_SWAP') { const c = resolve(d.def); if (!c) { W('swap default missing ' + it.name + '.' + name); continue; } keyOf[name] = owner.addComponentProperty(name, 'INSTANCE_SWAP', c.id); }
      else keyOf[name] = owner.addComponentProperty(name, d.type, d.def);
    } catch (e) { W('prop ' + it.name + '.' + name + ': ' + e.message); }
  }
  comps.forEach((c, i) => bindRefs(it.variants[i], c, keyOf));
  for (let i = 0; i < comps.length; i++) await finishInstances(it.variants[i], comps[i]);
  owners[it.name] = owner;
  // place sets in rows under the existing content (readable for humans)
  const bottom = page.children.filter(c => c !== owner && c.x > -10000).reduce((m, c) => Math.max(m, c.y + c.height), -200);
  const lastRow = page.children.filter(c => c !== owner && c.x > -10000 && c.y + c.height > bottom - 1);
  const rowRight = lastRow.reduce((m, c) => Math.max(m, c.x + c.width), -160);
  if (rowRight + 160 + owner.width < 9000 && lastRow.length) { const top = Math.min(...lastRow.map(c => c.y)); owner.x = rowRight + 160; owner.y = top; }
  else { owner.x = 0; owner.y = bottom + 200; }
  installed.push(it.name);
  if (Date.now() - START > BUDGET) return { installed, skipped, warnings, done: false };
}
return { installed, skipped, warnings, done: true, page: page.id };
