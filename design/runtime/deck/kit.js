// SPARQ Studio · deck kit (runs in the Figma plugin sandbox)
// Low-level helpers shared by the slide DSL: tokens, text, auto-layout frames,
// icons, markers, images, slide lookup. Everything is namespaced to the deck/*
// variables and text styles so it can live next to the cards system in one file.
// Contract: this module body ends with `return K;`

const NS = 'sparqdeck';
const COLLS = ['deck/color', 'deck/size'];
const _vars = {};
{
  const ids = new Set((await figma.variables.getLocalVariableCollectionsAsync()).filter(c => COLLS.includes(c.name)).map(c => c.id));
  for (const v of await figma.variables.getLocalVariablesAsync()) if (ids.has(v.variableCollectionId)) _vars[v.name] = v;
}
const _ts = {};
for (const s of await figma.getLocalTextStylesAsync()) if (s.name.startsWith('deck/')) _ts[s.name.slice(5)] = s;
if (!Object.keys(_ts).length) throw new Error('SPARQ deck kit is not installed in this file — run sparq_setup_file {kit:"deck"} first');

globalThis.__sqFonts = globalThis.__sqFonts || new Set();
const loadFont = async f => { const k = f.family + '|' + f.style; if (globalThis.__sqFonts.has(k)) return; await figma.loadFontAsync(f); globalThis.__sqFonts.add(k); };
for (const s of Object.values(_ts)) await loadFont(s.fontName);

const K = { NS };
K.V = n => { const v = _vars[n]; if (!v) throw new Error('no deck variable ' + n); return v; };
K.P = (n, op = 1) => { let p = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', K.V(n)); if (op !== 1) p = { ...p, opacity: op }; return p; };
// Variable-bound paints lose opacity on first assignment — assign twice.
K.S = (node, prop, paints) => { node[prop] = []; node[prop] = paints; node[prop] = node[prop].map((p, i) => ({ ...p, opacity: paints[i] && paints[i].opacity !== undefined ? paints[i].opacity : 1 })); return node; };
K.TS = n => { const s = _ts[n]; if (!s) throw new Error('no deck text style ' + n); return s; };

// ---------- themes ----------
K.T = dark => dark
  ? { dark: true, bg: 'bg/dark', tc: 'text/on-dark', t2: 'text/on-dark-2', t3: 'text/on-dark-3', ln: 'line/on-dark', lns: 'line/on-dark-soft', card: 'bg/dark-raised', cardLn: 'line/on-dark', inv: 'bg/light', invTc: 'text/on-light', invT2: 'text/on-light-2', invLn: 'line/on-light', accent: 'accent/primary', accentText: 'accent/text', accentDeep: 'accent/deep', track: 'line/on-dark' }
  : { dark: false, bg: 'bg/light', tc: 'text/on-light', t2: 'text/on-light-2', t3: 'text/on-light-2', ln: 'line/on-light', lns: 'line/on-light', card: 'prim/white', cardLn: 'line/on-light', inv: 'bg/dark', invTc: 'text/on-dark', invT2: 'text/on-dark-2', invLn: 'line/on-dark', accent: 'accent/primary', accentText: 'accent/deep', accentDeep: 'accent/deep', track: 'line/on-light' };
K.color = (T, c) => ({ primary: T.tc, secondary: T.t2, muted: T.t3, accent: T.accentText, deep: T.accentDeep, inverse: T.invTc })[c] || c || T.tc;

// ---------- typography ----------
const NBSP = ' ';
const SHORT = /(^|[\s«(„"])(в|к|с|о|у|и|а|я|на|по|от|до|за|из|во|со|не|ни|но|же|ли|бы|для|при|как|что|или|об|под|над|без|из-за|это|все|всё|его|её|их)\s(?=\S)/gi;
K.typo = s => {
  if (!s || typeof s !== 'string') return s;
  let t = s.replace(/ -- /g, ' — ').replace(/(\d) - (\d)/g, '$1–$2');
  t = t.replace(SHORT, (m, a, w) => a + w + NBSP);
  t = t.replace(SHORT, (m, a, w) => a + w + NBSP); // twice: chains like «и в»
  t = t.replace(/ —/g, NBSP + '—').replace(/ ·/g, NBSP + '·').replace(/(\d) (%|₽|млн|млрд|тыс\.)/g, '$1' + NBSP + '$2');
  t = t.replace(/(\d) (\d{3})/g, '$1' + NBSP + '$2');
  return t;
};
// "**bold** rest" → { text, bold:[[s,e]] }
K.rich = s => {
  const out = []; let text = ''; const re = /\*\*(.+?)\*\*/g; let last = 0, m;
  while ((m = re.exec(s))) { text += s.slice(last, m.index); out.push([text.length, text.length + m[1].length]); text += m[1]; last = re.lastIndex; }
  text += s.slice(last); return { text, bold: out };
};
const STRONG = { body: 'body-strong', 'body-s': 'body-s-strong', 'body-xs': 'body-xs-strong', lead: 'body-strong' };

// ---------- frames ----------
K.f = (par, o = {}) => {
  const f = figma.createFrame(); par.appendChild(f); f.name = o.name || 'f'; f.fills = []; f.clipsContent = !!o.clip;
  f.layoutMode = o.dir || 'VERTICAL'; f.itemSpacing = o.gap || 0;
  const p = o.pad === undefined ? 0 : o.pad; const pp = Array.isArray(p) ? (p.length === 2 ? [p[0], p[1], p[0], p[1]] : p) : [p, p, p, p];
  [f.paddingTop, f.paddingRight, f.paddingBottom, f.paddingLeft] = pp;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (o.alignC) f.counterAxisAlignItems = o.alignC; if (o.alignM) f.primaryAxisAlignItems = o.alignM;
  if (o.fill) K.S(f, 'fills', [K.P(o.fill, o.fillOp || 1)]);
  if (o.r !== undefined) f.cornerRadius = o.r;
  if (o.stroke) { K.S(f, 'strokes', [K.P(o.stroke, o.strokeOp || 1)]); f.strokeWeight = o.sw || 1; f.strokeAlign = 'INSIDE'; if (o.dash) f.dashPattern = o.dash; }
  if (o.wrap) { f.layoutWrap = 'WRAP'; f.counterAxisSpacing = o.cgap ?? o.gap ?? 0; }
  if (o.w !== undefined) { f.resize(o.w, f.height); if (par.layoutMode && par.layoutMode !== 'NONE') f.layoutSizingHorizontal = 'FIXED'; else f.counterAxisSizingMode = f.layoutMode === 'VERTICAL' ? 'FIXED' : f.counterAxisSizingMode, f.primaryAxisSizingMode = f.layoutMode === 'HORIZONTAL' ? 'FIXED' : f.primaryAxisSizingMode; }
  if (o.h !== undefined) { f.resize(f.width, o.h); if (par.layoutMode && par.layoutMode !== 'NONE') f.layoutSizingVertical = 'FIXED'; else if (f.layoutMode === 'VERTICAL') f.primaryAxisSizingMode = 'FIXED'; else f.counterAxisSizingMode = 'FIXED'; }
  if (o.x !== undefined) { f.x = o.x; f.y = o.y; }
  return f;
};
K.fillW = n => { n.layoutSizingHorizontal = 'FILL'; return n; };
K.fillH = n => { n.layoutSizingVertical = 'FILL'; return n; };
K.edges = (f, color, w = { top: 1 }) => { f.strokes = []; K.S(f, 'strokes', [K.P(color)]); f.strokeTopWeight = w.top || 0; f.strokeBottomWeight = w.bottom || 0; f.strokeLeftWeight = w.left || 0; f.strokeRightWeight = w.right || 0; f.strokeAlign = 'INSIDE'; return f; };

// text: o.hug | o.w (fixed) | default FILL inside auto-layout
K.t = async (par, chars, style, color, o = {}) => {
  const t = figma.createText(); par.appendChild(t);
  await t.setTextStyleIdAsync(K.TS(style).id);
  const r = K.rich(o.raw ? chars : K.typo(String(chars)));
  t.characters = r.text;
  if (r.bold.length) { const sid = K.TS(o.strong || STRONG[style] || style).id; for (const [s, e] of r.bold) await t.setRangeTextStyleIdAsync(s, e, sid); }
  K.S(t, 'fills', [K.P(color, o.op || 1)]);
  if (o.name) t.name = o.name; if (o.align) t.textAlignHorizontal = o.align;
  const inAL = par.layoutMode && par.layoutMode !== 'NONE';
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); if (inAL) t.layoutSizingHorizontal = 'FIXED'; }
  else if (o.hug || !inAL) t.textAutoResize = 'WIDTH_AND_HEIGHT';
  else { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; }
  if (o.x !== undefined) { t.x = o.x; t.y = o.y; }
  return t;
};
K.rule = (par, color, h = 1) => { const r = figma.createRectangle(); par.appendChild(r); r.resize(10, h); K.S(r, 'fills', [K.P(color)]); r.layoutSizingHorizontal = 'FILL'; r.layoutSizingVertical = 'FIXED'; r.name = 'rule'; return r; };
K.sp = (par, h = 8, grow = false) => { const f = K.f(par, { name: 'spacer', h }); if (grow) f.layoutSizingVertical = 'FILL'; return f; };
K.dot = (par, color, d = 12) => { const e = figma.createEllipse(); par.appendChild(e); e.resize(d, d); K.S(e, 'fills', [K.P(color)]); e.name = 'dot'; return e; };
K.box = (par, w, h, name = 'box') => { const f = K.f(par, { name, w, h, alignC: 'CENTER', alignM: 'CENTER' }); if (par.layoutMode && par.layoutMode !== 'NONE') { f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'FIXED'; } return f; };

// ---------- icons ----------
let _icons = null;
K.iconNames = () => { if (!_icons) _icons = JSON.parse(figma.root.getSharedPluginData(NS, 'icons') || '{}'); return Object.keys(_icons); };
K.icon = (par, name, size = 40, color = 'text/on-dark') => {
  if (!_icons) _icons = JSON.parse(figma.root.getSharedPluginData(NS, 'icons') || '{}');
  const svg = _icons[name]; if (!svg) throw new Error('no icon "' + name + '" — see sparq catalog icons');
  const n = figma.createNodeFromSvg(svg); par.appendChild(n); n.name = 'icon/' + name;
  const k = size / Math.max(n.width, n.height); n.rescale(k);
  for (const v of n.findAll(x => 'strokes' in x)) {
    if (v.strokes && v.strokes.length) K.S(v, 'strokes', [K.P(color)]);
    if (v.fills && v.fills.length && v.type !== 'FRAME') { const c = v.fills[0].color; if (!c || c.r + c.g + c.b > 1.2) K.S(v, 'fills', [K.P(color)]); }
  }
  return n;
};
K.iconBox = (par, name, size, color) => { const b = K.box(par, size, size, 'ic'); K.icon(b, name, size, color); return b; };

// ---------- markers & small viz ----------
K.mk = (par, kind, color, d = 22) => {
  const g = figma.createFrame(); par.appendChild(g); g.name = 'mk/' + kind; g.fills = []; g.layoutMode = 'NONE'; g.resize(d, d); g.clipsContent = false;
  if (kind === 'none') { const l = figma.createRectangle(); g.appendChild(l); l.resize(d * 0.6, 2); l.x = d * 0.2; l.y = d / 2 - 1; K.S(l, 'fills', [K.P(color, .7)]); return g; }
  const e = figma.createEllipse(); g.appendChild(e); e.resize(d, d);
  if (kind === 'full') K.S(e, 'fills', [K.P(color)]);
  else { e.fills = []; K.S(e, 'strokes', [K.P(color)]); e.strokeWeight = 2; e.strokeAlign = 'INSIDE'; const h = figma.createEllipse(); g.appendChild(h); h.resize(d, d); K.S(h, 'fills', [K.P(color)]); h.arcData = { startingAngle: Math.PI / 2, endingAngle: Math.PI * 1.5, innerRadius: 0 }; }
  return g;
};
K.donut = (par, pct, size, color, track, sw = 12) => {
  const f = figma.createFrame(); par.appendChild(f); f.name = 'donut'; f.fills = []; f.layoutMode = 'NONE'; f.resize(size, size); f.clipsContent = false;
  const ir = 1 - (sw * 2 / size);
  const t = figma.createEllipse(); f.appendChild(t); t.resize(size, size); t.arcData = { startingAngle: 0, endingAngle: 2 * Math.PI, innerRadius: ir }; K.S(t, 'fills', [K.P(track)]);
  if (pct > 0) { const a = figma.createEllipse(); f.appendChild(a); a.resize(size, size); a.arcData = { startingAngle: -Math.PI / 2, endingAngle: -Math.PI / 2 + 2 * Math.PI * Math.min(pct, 100) / 100, innerRadius: ir }; K.S(a, 'fills', [K.P(color)]); }
  if (par.layoutMode && par.layoutMode !== 'NONE') { f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'FIXED'; }
  return f;
};
// interference field — decorative rings; only for genuinely free zones
K.field = (par, w, h, color, o = {}) => {
  const f = figma.createFrame(); par.appendChild(f); f.name = 'decor/field'; f.fills = []; f.clipsContent = true; f.resize(w, h);
  const cs = o.centers || [[w * 0.32, h * 0.55], [w * 0.68, h * 0.45]]; const step = o.step || 24; const n = Math.ceil(Math.hypot(w, h) / step);
  for (const [cx, cy] of cs) {
    for (let i = 1; i <= n; i++) { const r = i * step; const e = figma.createEllipse(); f.appendChild(e); e.resize(r * 2, r * 2); e.x = cx - r; e.y = cy - r; e.fills = []; K.S(e, 'strokes', [K.P(color, (o.op || 0.16) * (1 - i / (n * 1.15)))]); e.strokeWeight = 1; e.name = 'ring'; }
    const d = figma.createEllipse(); f.appendChild(d); d.resize(8, d.height); d.resize(8, 8); d.x = cx - 4; d.y = cy - 4; K.S(d, 'fills', [K.P(color, .7)]); d.name = 'source';
  }
  return f;
};
K.mark = (par, size, color) => { // SPARQ mark (logo glyph)
  const svg = figma.root.getSharedPluginData(NS, 'mark'); const n = figma.createNodeFromSvg(svg); par.appendChild(n); n.name = 'sparq/mark';
  n.rescale(size / n.height); for (const v of n.findAll(x => x.type === 'VECTOR')) K.S(v, 'fills', [K.P(color)]); return n;
};

// ---------- images (bytes are injected by the server as base64) ----------
K.image = (par, b64, w, h, o = {}) => {
  const im = figma.createImage(figma.base64Decode(b64));
  const r = figma.createRectangle(); par.appendChild(r); r.resize(w, h); r.name = o.name || 'image';
  const paint = { type: 'IMAGE', imageHash: im.hash, scaleMode: 'FILL' };
  if (o.crop && o.size) { // crop = [x,y,w,h] in source pixels, size = [W,H] of the source image
    const [cx, cy, cw, ch] = o.crop, [W, H] = o.size;
    paint.scaleMode = 'CROP'; paint.imageTransform = [[cw / W, 0, cx / W], [0, ch / H, cy / H]];
  }
  r.fills = [paint]; if (o.r !== undefined) r.cornerRadius = o.r;
  if (par.layoutMode && par.layoutMode !== 'NONE') { r.layoutSizingHorizontal = 'FIXED'; r.layoutSizingVertical = 'FIXED'; }
  return r;
};

// ---------- slides ----------
K.isSlides = figma.editorType === 'slides';
K.allSlides = () => K.isSlides ? figma.getSlideGrid().flat() : (figma.currentPage.findChildren(n => n.type === 'FRAME' && n.getSharedPluginData(NS, 'key')));
K.findSlide = key => K.allSlides().find(s => s.getSharedPluginData(NS, 'key') === key) || null;
K.slide = (key, o = {}) => {
  let s = K.findSlide(key);
  if (!s) {
    if (K.isSlides) {
      s = figma.createSlide(); const flat = figma.getSlideGrid().flat(); const all = figma.currentPage.findAll(n => n.type === 'SLIDE'); const nw = all.filter(x => !flat.includes(x));
      figma.setSlideGrid([flat.concat(nw)]);
    } else {
      s = figma.createFrame(); s.resize(1920, 1080); figma.currentPage.appendChild(s);
      const others = K.allSlides(); const maxX = others.reduce((m, x) => Math.max(m, x.x + x.width), -120); s.x = maxX + 120; s.y = 0;
    }
    s.setSharedPluginData(NS, 'key', key);
  }
  if (!K.isSlides) s.name = key + (o.title ? ' · ' + o.title : '');
  s.children.slice().forEach(c => c.remove());
  return s;
};
// keep slides ordered by key (S01, S02, …)
K.sortSlides = () => {
  const all = K.allSlides().slice().sort((a, b) => a.getSharedPluginData(NS, 'key').localeCompare(b.getSharedPluginData(NS, 'key'), 'en', { numeric: true }));
  if (K.isSlides) figma.setSlideGrid([all]);
  else { let x = 0; for (const s of all) { s.x = x; s.y = 0; x += s.width + 120; } }
  return all.length;
};
K.config = () => JSON.parse(figma.root.getSharedPluginData(NS, 'config') || '{}');
// Design files keep the deck on its own page; Slides files use the slide grid.
K.deckPage = async () => {
  if (K.isSlides) return figma.currentPage;
  await figma.loadAllPagesAsync();
  const name = K.config().page || 'SPARQ · презентация';
  let p = figma.root.children.find(x => x.name === name);
  if (!p) { p = figma.createPage(); p.name = name; }
  if (figma.currentPage !== p) await figma.setCurrentPageAsync(p);
  return p;
};
// Texts as the engine left them — used to detect manual edits before a rebuild.
K.textsOf = s => s.findAll(n => n.type === 'TEXT' && n.visible !== false).map(t => t.characters);

return K;
