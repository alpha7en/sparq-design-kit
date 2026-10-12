// SPARQ Studio · slide DSL (runs in the Figma plugin sandbox, needs K from kit.js)
// D.build(spec) creates or rebuilds one 1920×1080 slide from a JSON spec.
// The spec language is documented for the model in skills/sparq-deck/references/dsl.md.
// Contract: body ends with `return D;`

const W = 1920, H = 1080, X = 96, CW = 1728, LIMIT = 1000;
const D = { K, issues: [], later: [] }; // later: size-dependent fixes run after the whole slide is laid out
const IW = new WeakMap(); // inner width per frame (Figma nodes are not extensible)
const iw = n => (n && IW.get(n)) || CW;
const warn = (msg) => D.issues.push(msg);

// ---------- helpers ----------
const inAL = n => n && n.layoutMode && n.layoutMode !== 'NONE';
const sizeW = (node, w, par) => {
  if (w === undefined || w === 'fill') { if (inAL(par)) node.layoutSizingHorizontal = 'FILL'; return; }
  if (w === 'hug') { if (inAL(par)) node.layoutSizingHorizontal = 'HUG'; return; }
  let px = w;
  if (typeof w === 'string' && w.endsWith('%')) px = Math.round(parseFloat(w) / 100 * iw(par));
  node.resize(px, node.height); if (inAL(par)) node.layoutSizingHorizontal = 'FIXED';
};

const flip = T => K.T(!T.dark);
const MARK_COLOR = (T, kind) => kind === 'none' ? T.t3 : T.accent;

// ---------- blocks ----------
const B = {};
const build = async (par, b, ctx) => {
  if (b === null || b === undefined) return null;
  if (typeof b === 'string') b = { type: 'text', text: b };
  const fn = B[b.type];
  if (!fn) throw new Error('unknown block type "' + b.type + '". Known: ' + Object.keys(B).join(', '));
  const node = await fn(par, b, ctx);
  if (node && b.name) node.name = b.name;
  if (node && b.grow && inAL(par)) { if (par.layoutMode === 'VERTICAL') node.layoutSizingVertical = 'FILL'; else node.layoutSizingHorizontal = 'FILL'; }
  return node;
};
D.block = build;

B.text = async (par, b, { T }) => {
  const t = await K.t(par, b.text, b.style || 'body', K.color(T, b.color), { align: b.align });
  if (b.w) sizeW(t, b.w, par);
  return t;
};
B.kicker = async (par, b, { T }) => K.t(par, String(b.text).toUpperCase(), 'kicker', K.color(T, b.color || 'muted'), { hug: true, name: 'kicker' });
B.heading = async (par, b, { T }) => {
  const style = { s: 'heading-s', m: 'heading', l: 'title-s' }[b.size || 's'];
  if (!b.icon) return K.t(par, b.text, style, K.color(T, b.color));
  const r = K.f(par, { name: 'heading', dir: 'HORIZONTAL', gap: 16, alignC: 'CENTER' }); K.fillW(r);
  K.iconBox(r, b.icon, b.iconSize || 40, T.accentText); await K.t(r, b.text, style, K.color(T, b.color));
  return r;
};
B.rule = async (par, b, { T }) => K.rule(par, b.strong ? T.t3 : T.ln, b.strong ? 2 : 1);
B.spacer = async (par, b) => K.sp(par, b.h || 16, !!b.grow);

B.row = async (par, b, ctx) => {
  const r = K.f(par, { name: b.name || 'row', dir: 'HORIZONTAL', gap: b.gap ?? 48, alignC: { top: 'MIN', center: 'CENTER', bottom: 'MAX' }[b.align || 'top'] });
  if (inAL(par)) K.fillW(r); else { r.resize(CW, r.height); r.primaryAxisSizingMode = 'FIXED'; }
  IW.set(r, iw(par));
  const items = b.items.map(it => typeof it === 'string' ? { type: 'text', text: it } : it);
  const gaps = (b.gap ?? 48) * (items.length - 1); const avail = iw(r) - gaps;
  const px = w => typeof w === 'number' ? w : (typeof w === 'string' && w.endsWith('%') ? Math.round(parseFloat(w) / 100 * avail) : null);
  const fixed = items.reduce((a, it) => a + (px(it.w) || 0), 0); const nFill = items.filter(it => px(it.w) === null && it.w !== 'hug').length;
  const fillW = nFill ? Math.floor((avail - fixed) / nFill) : 0;
  for (const item of items) {
    const target = px(item.w) ?? (item.w === 'hug' ? null : fillW);
    const node = await build(r, { ...item, w: undefined }, { ...ctx, w: target || undefined });
    if (!node) continue;
    if (item.w === 'hug') node.layoutSizingHorizontal = 'HUG';
    else if (px(item.w) !== null) { node.resize(px(item.w), node.height); node.layoutSizingHorizontal = 'FIXED'; }
    else node.layoutSizingHorizontal = 'FILL';
    if (target) IW.set(node, target);
  }
  // spacing between cards is never smaller than their inner padding ("inner < outer")
  const cardPad = Math.max(0, ...r.children.filter(c => c.type === 'FRAME' && /^card\//.test(c.name)).map(c => c.paddingLeft));
  if (cardPad && r.itemSpacing < cardPad) r.itemSpacing = cardPad;
  // rows of columns: align the k-th child across columns (card tops and list tops line up)
  const cols = r.children.filter(c => c.type === 'FRAME' && c.name === 'col');
  if (b.grid !== false && cols.length > 1 && cols.length === r.children.length && cols.every(c => c.children.length === cols[0].children.length)) {
    for (let k = 0; k < cols[0].children.length - 1; k++) {
      const hs = cols.map(c => c.children[k].height); const h = Math.max(...hs);
      cols.forEach(c => { const ch = c.children[k]; if (ch.type === 'FRAME' && ch.height < h) { ch.layoutSizingVertical = 'FIXED'; ch.resize(ch.width, h); } });
    }
  }
  if (b.equal !== false && b.align !== 'center') D.equalize(r);
  return r;
};
B.col = async (par, b, ctx) => {
  const c = K.f(par, { name: b.name || 'col', dir: 'VERTICAL', gap: b.gap ?? 24 });
  if (inAL(par)) K.fillW(c);
  if (ctx.w) IW.set(c, ctx.w);
  for (const it of b.items) await build(c, it, ctx);
  return c;
};
// Equal heights for the direct frame children of a row (cards side by side).
D.equalize = (row) => {
  const kids = row.children.filter(c => c.type === 'FRAME');
  if (kids.length < 2) return;
  const h = Math.max(...kids.map(c => c.height));
  row.layoutSizingVertical = 'FIXED'; row.resize(row.width, h);
  for (const c of kids) c.layoutSizingVertical = 'FILL';
};

const CARD = {
  raised: T => ({ fill: T.card, stroke: T.cardLn }),
  inverse: T => ({ fill: T.inv }),
  outline: T => ({ stroke: T.t3, sw: 1.5 }),
  dashed: T => ({ stroke: T.t3, sw: 1.5, dash: [6, 6] }),
  plain: () => ({}),
};
B.card = async (par, b, ctx) => {
  const v = b.variant || 'raised';
  const st = (CARD[v] || CARD.raised)(ctx.T);
  const pad = b.pad ?? (v === 'plain' ? 0 : [32, 36, 32, 36]);
  const c = K.f(par, { name: b.name || 'card/' + v, dir: 'VERTICAL', gap: b.gap ?? 16, pad, r: v === 'plain' ? 0 : (b.r ?? 20), ...st });
  if (inAL(par)) K.fillW(c);
  if (b.rail) { c.clipsContent = true; const r = figma.createRectangle(); c.appendChild(r); r.layoutPositioning = 'ABSOLUTE'; r.resize(4000, 4); r.x = 0; r.y = 0; K.S(r, 'fills', [K.P(ctx.T.accent)]); r.name = 'rail'; r.constraints = { horizontal: 'STRETCH', vertical: 'MIN' }; }
  const padLR = Array.isArray(pad) ? (pad.length === 4 ? pad[1] + pad[3] : pad[1] * 2) : pad * 2;
  const inner = { ...(v === 'inverse' ? { ...ctx, T: flip(ctx.T) } : ctx), w: ctx.w ? ctx.w - padLR : undefined };
  if (inner.w) IW.set(c, inner.w);
  if (b.kicker) await B.kicker(c, { text: b.kicker }, inner);
  if (b.title) await B.heading(c, { text: b.title, icon: b.icon, size: b.titleSize || 's' }, inner);
  for (const it of b.items || []) await build(c, it, inner);
  return c;
};
B.banner = async (par, b, { T }) => {
  const r = K.f(par, { name: 'banner', dir: 'HORIZONTAL', gap: 20, alignC: 'CENTER', ...(b.variant === 'card' ? { pad: [22, 32, 22, 32], r: 16, fill: T.card, stroke: T.cardLn } : {}) });
  if (inAL(par)) K.fillW(r);
  if (b.variant === 'card') K.dot(r, T.accent, 12); else { const rl = figma.createRectangle(); r.appendChild(rl); rl.resize(4, 10); K.S(rl, 'fills', [K.P(T.accent)]); rl.cornerRadius = 2; rl.layoutSizingVertical = 'FILL'; rl.name = 'rail'; }
  const t = await K.t(r, b.text, b.style || 'body', T.tc); t.layoutSizingHorizontal = 'FILL';
  return r;
};

// list with markers: icon | ket | num | dot | arrow | check | none
B.list = async (par, b, { T }) => {
  const L = K.f(par, { name: 'list', dir: 'VERTICAL', gap: 0 }); if (inAL(par)) K.fillW(L);
  const style = b.size || 'body-s'; const marker = b.marker || (b.items.some(i => i && i.icon) ? 'icon' : 'ket');
  const div = b.dividers !== false; const py = b.pad ?? 16;
  if (div && b.topRule !== false) K.rule(L, b.strongTop ? T.t3 : T.ln, b.strongTop ? 2 : 1);
  let i = 0;
  for (const raw of b.items) {
    const it = typeof raw === 'string' ? { text: raw } : raw; i++;
    const r = K.f(L, { name: 'item', dir: 'HORIZONTAL', gap: 18, pad: [py, 0, py, 0], alignC: marker === 'icon' ? 'CENTER' : 'BASELINE' }); K.fillW(r);
    if (b.grow) r.layoutSizingVertical = 'FILL', r.counterAxisAlignItems = 'CENTER';
    const mcol = b.markerColor ? K.color(T, b.markerColor) : null;
    if (marker === 'icon') K.iconBox(r, it.icon || 'check', b.iconSize || 36, mcol || T.accentText);
    else if (marker === 'ket') await K.t(r, '|' + i + '⟩', 'label', mcol || T.t3, { w: 52, raw: true });
    else if (marker === 'num') await K.t(r, String(i), 'heading-s', mcol || T.accentText, { w: 40, raw: true });
    else if (marker === 'arrow') await K.t(r, '→', 'body-s-strong', mcol || T.accentText, { hug: true, raw: true });
    else if (marker === 'dot') { const w = K.box(r, 12, 30, 'dot'); w.counterAxisAlignItems = 'CENTER'; K.dot(w, mcol || T.accent, 8); }
    else if (marker === 'check') K.iconBox(r, 'check', 32, mcol || T.accentText);
    const col = K.f(r, { name: 'text', dir: 'VERTICAL', gap: 4 }); col.layoutSizingHorizontal = 'FILL';
    await K.t(col, it.text, style, T.tc);
    if (it.sub) await K.t(col, it.sub, b.subStyle || 'body-xs', T.t2);
    if (div) K.rule(L, T.lns);
  }
  return L;
};
// "было → стало" pairs
B.compare = async (par, b, { T }) => {
  const L = K.f(par, { name: 'compare', dir: 'VERTICAL', gap: 0 }); if (inAL(par)) K.fillW(L);
  for (const it of b.items) {
    const r = K.f(L, { name: 'pair', dir: 'VERTICAL', gap: 8, pad: [b.pad ?? 20, 0, b.pad ?? 20, 0] }); K.fillW(r); K.edges(r, T.ln, { top: 1 });
    if (b.grow) { r.layoutSizingVertical = 'FILL'; r.primaryAxisAlignItems = 'CENTER'; }
    await K.t(r, it.from, b.fromStyle || 'body-s', T.t3);
    const l = K.f(r, { dir: 'HORIZONTAL', gap: 14, alignC: 'BASELINE' }); K.fillW(l);
    await K.t(l, '→', 'body-s-strong', T.accentText, { hug: true, raw: true }); await K.t(l, it.to, b.toStyle || 'body-s-strong', T.tc);
  }
  return L;
};
B.chips = async (par, b, { T }) => {
  const w = K.f(par, { name: 'chips', dir: 'HORIZONTAL', gap: 10, wrap: true }); if (inAL(par)) K.fillW(w);
  (b.items || []).forEach(() => {});
  let i = 0;
  for (const label of b.items) {
    const hot = (b.hot || []).includes(i++);
    const c = K.f(w, { name: 'chip', dir: 'HORIZONTAL', pad: [6, 14, 6, 14], r: 999, alignC: 'CENTER', ...(hot ? { fill: T.accentDeep } : { stroke: T.ln, sw: 1 }) });
    await K.t(c, label, 'label', hot ? 'text/on-accent' : T.t2, { hug: true });
  }
  return w;
};
B.badge = async (par, b, { T }) => {
  const c = K.f(par, { name: 'badge', dir: 'HORIZONTAL', pad: [6, 16, 6, 16], r: 999, alignC: 'CENTER', alignM: 'CENTER', ...(b.hot ? { fill: T.accentDeep } : { stroke: T.t2, sw: 1.5 }) });
  await K.t(c, b.text, 'label', b.hot ? 'text/on-accent' : T.tc, { hug: true }); return c;
};
B.quote = async (par, b, { T }) => {
  const r = K.f(par, { name: 'quote', dir: 'HORIZONTAL', gap: 18 }); if (inAL(par)) K.fillW(r);
  const rl = figma.createRectangle(); r.appendChild(rl); rl.resize(3, 10); K.S(rl, 'fills', [K.P(T.t3)]); rl.layoutSizingVertical = 'FILL';
  const c = K.f(r, { dir: 'VERTICAL', gap: 6 }); c.layoutSizingHorizontal = 'FILL';
  await K.t(c, '«' + b.text.replace(/^«|»$/g, '') + '»', b.style || 'body-s', T.tc);
  if (b.who) await K.t(c, b.who, 'note', T.t3);
  return r;
};

// ---------- numbers & small infographics ----------
const NUM = { xl: 'number', l: 'number-m', m: 'number-s', s: 'heading' };
B.kpi = async (par, b, ctx) => {
  const { T } = ctx;
  const side = b.viz && (b.viz.type === 'donut' || b.viz.type === 'icon');
  const k = K.f(par, { name: 'kpi', dir: side ? 'HORIZONTAL' : 'VERTICAL', gap: side ? 24 : 10, alignC: side ? 'CENTER' : 'MIN' });
  if (inAL(par)) K.fillW(k);
  if (side) {
    const sz = b.viz.size || 96;
    if (b.viz.type === 'donut') K.donut(k, b.viz.pct, sz, T.accent, T.track, b.viz.stroke || 12);
    else { const w = K.box(k, sz, sz, 'ring'); w.cornerRadius = sz / 2; K.S(w, 'strokes', [K.P(T.t3)]); w.strokeWeight = 1.5; K.icon(w, b.viz.icon, sz * 0.46, T.tc); }
  }
  const c = side ? K.f(k, { dir: 'VERTICAL', gap: 10 }) : k; if (side) c.layoutSizingHorizontal = 'FILL';
  if (b.icon && !side) K.iconBox(c, b.icon, 40, T.accentText);
  if (b.value !== undefined && b.value !== '') { const nt = await K.t(c, b.value, NUM[b.size || 'l'], K.color(T, b.color), { hug: true, raw: true }); nt.characters = nt.characters.replace(/ /g, '\u00A0'); nt.name = 'value'; }
  const v = b.viz;
  if (v && v.type === 'stack') {
    const total = v.parts.reduce((a, p) => a + p.v, 0); const wpx = v.w || 360;
    const sb = K.f(c, { name: 'stack', dir: 'HORIZONTAL', gap: 3 });
    const cols = [T.tc, 'data/2', T.accent, 'data/3', 'data/4'];
    v.parts.forEach((p, i) => { K.f(sb, { w: Math.max(6, Math.round(wpx * p.v / total) - 3), h: 14, fill: p.color || cols[i % cols.length] }); });
    if (v.parts.some(p => p.label)) { const lb = K.f(c, { dir: 'HORIZONTAL', gap: 14 }); for (const p of v.parts) await K.t(lb, p.label, 'note', T.t3, { hug: true }); }
  } else if (v && v.type === 'people') {
    const pr = K.f(c, { name: 'people', dir: 'HORIZONTAL', gap: 10 });
    for (let i = 0; i < (v.of || 5); i++) { const w = K.box(pr, 34, 34, 'p'); K.icon(w, 'user', 34, i < (v.hit || 1) ? T.accentText : T.t3); }
  } else if (v && v.type === 'scale') {
    const sc = K.f(c, { name: 'scale', dir: 'HORIZONTAL', gap: 6 }); sc.resize(v.w || 520, sc.height); if (inAL(c)) { sc.layoutSizingHorizontal = 'FIXED'; sc.layoutSizingVertical = 'HUG'; }
    for (let i = 1; i <= (v.of || 9); i++) {
      const cc = K.f(sc, { dir: 'VERTICAL', gap: 6 }); cc.layoutSizingHorizontal = 'FILL';
      const seg = K.f(cc, { h: 16, r: 3 }); seg.layoutSizingHorizontal = 'FILL';
      if (i <= v.at) K.S(seg, 'fills', [K.P(i === v.at ? T.accent : T.t2)]); else { K.S(seg, 'strokes', [K.P(T.t3)]); seg.strokeWeight = 1; }
      await K.t(cc, String(i), 'note', i === v.at ? T.accentText : T.t3, { hug: true, raw: true });
    }
  } else if (v && v.type === 'bar') {
    const tr = K.f(c, { name: 'bar', dir: 'HORIZONTAL', w: v.w || 360, h: 14, fill: T.track, r: 7 });
    K.f(tr, { w: Math.max(6, Math.round((v.w || 360) * v.pct / 100)), h: 14, fill: T.accent, r: 7 });
  }
  if (b.caption) await K.t(c, b.caption, b.captionStyle || 'body-xs', T.t2);
  return k;
};
B.kpis = async (par, b, ctx) => {
  const dir = b.dir === 'col' ? 'VERTICAL' : 'HORIZONTAL';
  const g = K.f(par, { name: 'kpis', dir, gap: b.gap ?? (dir === 'HORIZONTAL' ? 48 : 0) }); if (inAL(par)) K.fillW(g);
  let i = 0;
  for (const it of b.items) {
    const wrap = K.f(g, { name: 'kpi-cell', dir: 'VERTICAL', gap: 0, pad: dir === 'VERTICAL' ? [b.pad ?? 20, 0, b.pad ?? 20, 0] : [0, 0, 0, i && b.dividers ? 32 : 0] });
    if (dir === 'HORIZONTAL') wrap.layoutSizingHorizontal = 'FILL'; else { K.fillW(wrap); if (b.dividers !== false) K.edges(wrap, i ? ctx.T.ln : ctx.T.t3, { top: i ? 1 : 2 }); if (b.grow) { wrap.layoutSizingVertical = 'FILL'; wrap.primaryAxisAlignItems = 'CENTER'; } }
    if (dir === 'HORIZONTAL' && i && b.dividers) K.edges(wrap, ctx.T.ln, { left: 1 });
    await B.kpi(wrap, it, ctx); i++;
  }
  return g;
};
B.donut = async (par, b, { T }) => { const d = K.donut(par, b.pct, b.size || 120, K.color(T, b.color || 'accent') === T.accentText ? T.accent : T.accent, T.track, b.stroke || 14); return d; };
B.scale = async (par, b, ctx) => B.kpi(par, { value: b.value || '', caption: b.caption, size: 's', viz: { type: 'scale', of: b.of || 9, at: b.at, w: b.w } }, ctx);

// horizontal bars with labels (data from the brief, not invented)
B.bars = async (par, b, { T }) => {
  const L = K.f(par, { name: 'bars', dir: 'VERTICAL', gap: 0 }); if (inAL(par)) K.fillW(L);
  const max = b.max || Math.max(...b.items.map(i => i.v)); const fills = [];
  for (const it of b.items) {
    const r = K.f(L, { name: 'bar-row', dir: 'HORIZONTAL', gap: 24, pad: [14, 0, 14, 0], alignC: 'CENTER' }); K.fillW(r); K.edges(r, T.lns, { top: 1 });
    await K.t(r, it.label, b.labelStyle || 'body-s', T.tc, { w: b.labelW || 300 });
    const tr = K.f(r, { name: 'track', dir: 'HORIZONTAL', h: 24, alignC: 'CENTER' }); tr.layoutSizingHorizontal = 'FILL';
    const bar = K.f(tr, { w: 10, h: 24, r: 4, fill: it.accent ? T.accent : (T.dark ? 'data/2' : 'data-light/2') }); fills.push([tr, bar, it.v / max]);
    await K.t(r, it.display || (String(it.v) + (b.suffix || '')), b.valueStyle || 'heading-s', T.tc, { hug: true, raw: true });
  }
  D.later.push(() => { for (const [tr, bar, k] of fills) bar.resize(Math.max(6, Math.round(tr.width * k)), 24); });
  return L;
};
// funnel: number | bar over caption
B.funnel = async (par, b, { T }) => {
  const L = K.f(par, { name: 'funnel', dir: 'VERTICAL', gap: 0 }); if (inAL(par)) K.fillW(L);
  const max = Math.max(...b.items.map(i => i.v)); const fills = [];
  for (const it of b.items) {
    const r = K.f(L, { name: 'stage', dir: 'HORIZONTAL', gap: 24, pad: [b.pad ?? 22, 0, b.pad ?? 22, 0], alignC: 'CENTER' }); K.fillW(r); K.edges(r, T.lns, { top: 1 });
    await K.t(r, String(it.display || it.v), 'number-s', T.tc, { w: b.numW || 160, raw: true });
    const c = K.f(r, { dir: 'VERTICAL', gap: 10 }); c.layoutSizingHorizontal = 'FILL';
    const tr = K.f(c, { name: 'track', dir: 'HORIZONTAL' }); tr.layoutSizingHorizontal = 'FILL';
    const bar = K.f(tr, { w: 10, h: 26, r: 4, fill: it.accent ? T.accent : (T.dark ? 'data/2' : 'data-light/2') }); fills.push([tr, bar, it.v / max]);
    await K.t(c, it.label, 'body-s', T.t2);
  }
  D.later.push(() => { for (const [tr, bar, k] of fills) bar.resize(Math.max(8, Math.round(tr.width * k * (b.barShare || 0.9))), 26); });
  return L;
};
// ---------- tables ----------
// cols: [{label, sub?, w?}] (first column = row labels); rows: [[cell…]]; cell = "text" | {mark:'full'|'half'|'none', text?}
B.table = async (par, b, ctx) => {
  const { T } = ctx; const hl = b.highlight; const dark = flip(T.dark ? K.T(false) : K.T(false)); const HT = K.T(true);
  const tb = K.f(par, { name: 'table', dir: 'VERTICAL', gap: 0 }); if (inAL(par)) K.fillW(tb);
  const n = b.cols.length; const total = ctx.w || iw(par);
  const fixed = b.cols.reduce((a, c) => a + (c.w || 0), 0); const free = b.cols.filter(c => !c.w).length;
  const widths = b.cols.map(c => c.w || Math.floor((total - fixed) / free));
  const size = b.size || 'body-s'; const py = b.pad ?? 8;
  const cell = (row, i, pad) => { const c = K.f(row, { name: 'cell', dir: 'HORIZONTAL', gap: 10, pad: pad || [py, 14, py, 14], alignC: 'CENTER', w: widths[i] }); c.layoutAlign = 'STRETCH'; if (i === hl) K.S(c, 'fills', [K.P(HT.bg)]); return c; };
  const hr = K.f(tb, { name: 'head', dir: 'HORIZONTAL' }); K.fillW(hr);
  for (let i = 0; i < n; i++) {
    const c = cell(hr, i, [16, 14, 12, i === 0 ? 0 : 14]); c.layoutMode = 'VERTICAL'; c.itemSpacing = 0; c.counterAxisAlignItems = 'MIN'; c.primaryAxisAlignItems = 'MAX'; c.layoutSizingHorizontal = 'FIXED'; c.resize(widths[i], c.height); c.layoutAlign = 'STRETCH';
    const col = b.cols[i];
    if (col.label) await K.t(c, col.label, 'body-s-strong', i === hl ? HT.tc : T.tc);
    if (col.sub) await K.t(c, col.sub, 'note', i === hl ? HT.t3 : T.t3);
    if (i === hl) { c.topLeftRadius = 16; c.topRightRadius = 16; }
  }
  K.rule(tb, T.t2, 2);
  for (let r = 0; r < b.rows.length; r++) {
    const row = K.f(tb, { name: 'row', dir: 'HORIZONTAL' }); K.fillW(row);
    for (let i = 0; i < n; i++) {
      const raw = b.rows[r][i]; const v = typeof raw === 'object' && raw !== null ? raw : { text: raw };
      const c = cell(row, i, i === 0 ? [py, 14, py, 0] : undefined); const TT = i === hl ? HT : T;
      if (v.mark) { const m = K.box(c, 22, 38, 'mk'); K.mk(m, v.mark, v.mark === 'none' ? TT.t3 : (i === hl ? TT.accent : TT.tc), 22); }
      if (v.text) await K.t(c, v.text, i === 0 ? 'body-s-strong' : (i === hl ? 'body-s-strong' : size), TT.tc);
      else if (!v.mark) c.itemSpacing = 0;
      if (i === hl && r === b.rows.length - 1) { c.bottomLeftRadius = 16; c.bottomRightRadius = 16; }
    }
    if (r < b.rows.length - 1) K.rule(tb, T.ln);
  }
  return tb;
};
B.legend = async (par, b, { T }) => {
  const lg = K.f(par, { name: 'legend', dir: 'HORIZONTAL', gap: 28, alignC: 'CENTER' });
  for (const it of b.items || [{ mark: 'full', text: 'есть' }, { mark: 'half', text: 'частично или в работе' }, { mark: 'none', text: 'нет' }]) {
    const r = K.f(lg, { dir: 'HORIZONTAL', gap: 10, alignC: 'CENTER' }); K.mk(r, it.mark, T.tc, 22); await K.t(r, it.text, 'note', T.t2, { hug: true });
  }
  return lg;
};

// ---------- process / time ----------
B.steps = async (par, b, ctx) => {
  const { T } = ctx;
  const r = K.f(par, { name: 'steps', dir: 'HORIZONTAL', gap: 0, alignC: 'MIN' }); if (inAL(par)) K.fillW(r);
  const n = b.items.length; const arrows = b.arrows !== false;
  for (let i = 0; i < n; i++) {
    const it = b.items[i]; const core = !!it.core; const TT = core ? flip(T) : T;
    const c = K.f(r, { name: 'step', dir: 'VERTICAL', gap: 12, pad: [24, 24, 24, 24], r: 20, fill: core ? T.inv : T.card, stroke: core ? undefined : T.cardLn, sw: 1 });
    c.layoutSizingHorizontal = 'FILL';
    if (core && b.coreWider !== false) { const share = (iw(par) - (arrows ? 40 * (n - 1) : 0)) / (n + 0.4); c.resize(Math.round(share * 1.4), c.height); c.layoutSizingHorizontal = 'FIXED'; }
    if (it.icon) K.iconBox(c, it.icon, 44, TT.accentText); else await K.t(c, '|' + (i + 1) + '⟩', 'label', TT.t3, { hug: true, raw: true });
    await K.t(c, it.title, 'heading-s', TT.tc);
    if (it.text) await K.t(c, it.text, 'body-xs', TT.t2);
    if (arrows && i < n - 1) { const a = K.f(r, { name: 'arrow', dir: 'VERTICAL', w: 40, alignM: 'CENTER', alignC: 'CENTER' }); a.layoutSizingVertical = 'FILL'; await K.t(a, '→', 'heading-s', T.t3, { hug: true, raw: true }); }
  }
  D.equalize(r);
  return r;
};
B.timeline = async (par, b, ctx) => {
  const { T } = ctx;
  const tl = K.f(par, { name: 'timeline', dir: 'HORIZONTAL', gap: 0 }); if (inAL(par)) K.fillW(tl);
  const n = b.items.length; const cards = [];
  for (let i = 0; i < n; i++) {
    const it = b.items[i]; const now = !!it.now; const TT = now ? flip(T) : T;
    const m = K.f(tl, { name: 'milestone', dir: 'VERTICAL', gap: 0, pad: [0, i < n - 1 ? 24 : 0, 0, 0] }); m.layoutSizingHorizontal = 'FILL';
    await K.t(m, String(it.date).toUpperCase(), 'label', now ? T.accentText : T.t2, { name: 'label' });
    K.sp(m, 14);
    const rail = K.f(m, { name: 'rail', dir: 'HORIZONTAL', alignC: 'CENTER' }); K.fillW(rail);
    const e = figma.createEllipse(); rail.appendChild(e); e.resize(22, 22);
    if (now) K.S(e, 'fills', [K.P(T.accent)]); else { e.fills = []; K.S(e, 'strokes', [K.P(T.tc)]); e.strokeWeight = 2.5; e.strokeAlign = 'INSIDE'; }
    if (i < n - 1) { const l = figma.createRectangle(); rail.appendChild(l); l.resize(10, 2); K.S(l, 'fills', [K.P(T.t2, .5)]); l.layoutSizingHorizontal = 'FILL'; }
    K.sp(m, 18);
    const c = K.f(m, { name: 'card', dir: 'VERTICAL', gap: 0, pad: [26, 22, 26, 22], r: 20, fill: now ? T.inv : T.card, stroke: now ? undefined : T.cardLn, sw: 1 }); K.fillW(c); cards.push(c);
    const h = K.f(c, { dir: 'HORIZONTAL', gap: 16, alignM: 'SPACE_BETWEEN', alignC: 'MIN' }); K.fillW(h);
    const ht = await K.t(h, it.title, 'heading-s', TT.tc); ht.layoutSizingHorizontal = 'FILL';
    if (it.icon) K.iconBox(h, it.icon, 36, TT.accentText);
    K.sp(c, 10);
    for (const s of it.items || []) {
      K.rule(c, TT.ln); const r = K.f(c, { dir: 'HORIZONTAL', gap: 12, pad: [14, 0, 14, 0], alignC: 'BASELINE' }); K.fillW(r);
      const w = K.box(r, 12, 30, 'dot'); K.dot(w, T.accent, 8); await K.t(r, s, 'body-xs', TT.tc);
    }
  }
  const hh = Math.max(...cards.map(c => c.height)); cards.forEach(c => { c.layoutSizingVertical = 'FIXED'; c.resize(c.width, hh); });
  if (b.phases) {
    const wrap = K.f(par, { name: 'phases', dir: 'HORIZONTAL', gap: 24, wrap: true }); if (inAL(par)) K.fillW(wrap);
    for (const p of b.phases) { const c = K.f(wrap, { dir: 'HORIZONTAL', pad: [8, 18, 8, 18], r: 999, stroke: T.t2, sw: 1 }); await K.t(c, p, 'label', T.tc, { hug: true }); }
  }
  return tl;
};

// ---------- people & images (image bytes are injected by the server) ----------
B.image = async (par, b, { T, w: cw }) => {
  const w = b.w || cw || (IW.get(par) || 560), h = b.h || Math.round(w / (b.ratio || (b.crop ? b.crop[2] / b.crop[3] : (b.size ? b.size[0] / b.size[1] : 1.6))));
  const col = K.f(par, { name: 'image', dir: 'VERTICAL', gap: 20 });
  if (b.frame === 'browser') {
    const fr = K.f(col, { name: 'browser', dir: 'VERTICAL', r: 16, fill: T.dark ? 'bg/dark-raised' : 'prim/white', stroke: T.cardLn, sw: 1.5, w }); fr.clipsContent = true;
    const bar = K.f(fr, { name: 'bar', dir: 'HORIZONTAL', gap: 8, pad: [0, 16, 0, 16], alignC: 'CENTER', h: 36, fill: T.dark ? 'line/on-dark' : 'bg/light-alt' }); K.fillW(bar);
    for (let i = 0; i < 3; i++) K.dot(bar, T.dark ? 'text/on-dark-3' : 'prim/milk-500', 10);
    K.image(fr, b.b64, w, h, { crop: b.crop, size: b.size, name: 'screen' });
  } else K.image(col, b.b64, w, h, { crop: b.crop, size: b.size, r: b.frame === 'round' ? Math.min(w, h) / 2 : (b.r ?? 16) });
  if (b.title) await K.t(col, b.title, 'heading-s', T.tc);
  if (b.text) await K.t(col, b.text, 'body-s', T.t2);
  if (b.w && inAL(par)) col.layoutSizingHorizontal = 'HUG';
  return col;
};
B.people = async (par, b, { T }) => {
  const r = K.f(par, { name: 'people', dir: 'HORIZONTAL', gap: b.gap ?? 24 }); if (inAL(par)) K.fillW(r);
  const ps = b.photo || 176;
  for (const p of b.items) {
    const c = K.f(r, { name: 'person', dir: 'VERTICAL', gap: 8 }); c.layoutSizingHorizontal = 'FILL';
    if (p.b64) { const ph = K.box(c, ps, ps, 'photo'); ph.cornerRadius = ps / 2; ph.clipsContent = true; K.S(ph, 'strokes', [K.P(T.ln)]); ph.strokeWeight = 2; K.image(ph, p.b64, ps, ps, { crop: p.crop, size: p.size }); }
    K.sp(c, 8);
    await K.t(c, p.name, 'body-s-strong', T.tc);
    if (p.role) await K.t(c, p.role, 'label', T.accentText);
    if (p.text) await K.t(c, p.text, 'body-xs', T.t2);
  }
  return r;
};
B.contact = async (par, b, { T }) => {
  const L = K.f(par, { name: 'contacts', dir: 'VERTICAL', gap: 0 }); if (inAL(par)) K.fillW(L);
  K.rule(L, T.t3, 2);
  for (const p of b.items) {
    const r = K.f(L, { name: 'contact', dir: 'HORIZONTAL', gap: 32, pad: [32, 0, 32, 0], alignC: 'CENTER' }); K.fillW(r);
    if (p.b64) { const ph = K.box(r, 152, 152, 'photo'); ph.cornerRadius = 76; ph.clipsContent = true; K.S(ph, 'strokes', [K.P(T.ln)]); ph.strokeWeight = 2; K.image(ph, p.b64, 152, 152, { crop: p.crop, size: p.size }); }
    const c = K.f(r, { dir: 'VERTICAL', gap: 8 }); c.layoutSizingHorizontal = 'FILL';
    await K.t(c, p.name, 'heading-s', T.tc); if (p.role) await K.t(c, p.role, 'label', T.accentText);
    for (const l of p.lines || []) { const x = K.f(c, { dir: 'HORIZONTAL', gap: 12, alignC: 'CENTER' }); if (l.icon) K.iconBox(x, l.icon, 32, T.t2); await K.t(x, l.text, 'body', T.tc, { hug: true, raw: true }); }
    K.rule(L, T.ln);
  }
  return L;
};
B.field = async (par, b, { T, w: cw }) => {
  const w = cw || iw(par); const f = K.field(par, w, b.h || 200, T.tc, { op: b.op || (T.dark ? 0.2 : 0.22), step: 24 });
  if (inAL(par)) { f.layoutSizingHorizontal = 'FILL'; if (b.grow !== false) f.layoutSizingVertical = 'FILL'; }
  return f;
};
B.strip = async (par, b, ctx) => {
  const r = K.f(par, { name: 'strip', dir: 'HORIZONTAL', gap: b.gap ?? 48 }); if (inAL(par)) K.fillW(r);
  for (const it of b.items) {
    const c = K.f(r, { name: 'cell', dir: 'VERTICAL', gap: 0, pad: [14, 0, 0, 0] }); c.layoutSizingHorizontal = 'FILL';
    if (b.rules !== false) K.edges(c, ctx.T.t3, { top: 2 });
    await build(c, it, ctx);
  }
  return r;
};

// ---------- slide shell & layouts ----------
D.shell = async (slide, spec, T) => {
  const cfg = K.config();
  slide.fills = []; K.S(slide, 'fills', [K.P(T.bg)]);
  const hd = K.f(slide, { name: 'header', dir: 'HORIZONTAL', x: X, y: 48, w: CW, alignC: 'CENTER', alignM: 'SPACE_BETWEEN' });
  const left = K.f(hd, { name: 'brand', dir: 'HORIZONTAL', gap: 24, alignC: 'CENTER' });
  const logoSvg = figma.root.getSharedPluginData(K.NS, T.dark ? 'logo-dark' : 'logo-light') || figma.root.getSharedPluginData(K.NS, 'logo');
  if (logoSvg && spec.logo !== false) { const n = figma.createNodeFromSvg(logoSvg); left.appendChild(n); n.name = 'logo/client'; n.rescale((cfg.logoH || 38) / n.height); if (!figma.root.getSharedPluginData(K.NS, T.dark ? 'logo-dark' : 'logo-light')) for (const v of n.findAll(x => 'fills' in x && x.fills.length)) K.S(v, 'fills', [K.P(T.tc)]); }
  else if (spec.logo !== false && cfg.sparqMark !== false) K.mark(left, 36, T.tc);
  if (spec.chapter) { const p = K.f(left, { name: 'chapter', dir: 'HORIZONTAL', gap: 10, pad: [8, 16, 8, 14], r: 999, fill: T.card, alignC: 'CENTER' }); K.dot(p, T.accent, 8); await K.t(p, spec.chapter, 'kicker', T.t2, { hug: true }); }
  const total = spec.total || cfg.total;
  if (spec.n && cfg.counter !== 'none') await K.t(hd, cfg.counter === 'plain' ? String(spec.n) : '|' + spec.n + (total ? '/' + total : '') + '⟩', 'label', T.t2, { hug: true, raw: true, name: 'counter' });
  let y = 128;
  let titleNode = null;
  if (spec.title) { const t = await K.t(slide, spec.title, spec.titleStyle || 'title', T.tc, { w: CW, name: 'title' }); t.x = X; t.y = y; titleNode = t; }
  if (spec.aside) { // small block at the right end of the title line (legend, badge, chips)
    const a = K.f(slide, { name: 'aside', dir: 'HORIZONTAL', gap: 16, alignC: 'CENTER' });
    await build(a, spec.aside, { T });
    a.x = X + CW - a.width; a.y = 128 + 32 - a.height / 2;
    if (titleNode) titleNode.resize(CW - a.width - 48, titleNode.height);
  }
  if (titleNode) y += titleNode.height;
  if (spec.lead) { const l = await K.t(slide, spec.lead, spec.leadStyle || 'lead', T.t2, { w: CW, name: 'lead' }); l.x = X; l.y = y + 14; y = l.y + l.height; }
  let limit = LIMIT;
  if (spec.foot) { const f = await K.t(slide, spec.foot, 'note', T.t3, { w: CW, name: 'footnote' }); f.x = X; f.y = 1048 - f.height; limit = f.y - 28; }
  return { top: Math.max(spec.lead ? 0 : 224, y + 40), limit };
};

const L = {};
L.content = async (slide, spec, T) => {
  const { top, limit } = await D.shell(slide, spec, T);
  const avail = limit - top;
  const root = K.f(slide, { name: 'content', dir: 'VERTICAL', gap: spec.gap ?? 28, x: X, y: top, w: CW });
  IW.set(root, CW);
  const hasGrow = JSON.stringify(spec.body || []).includes('"grow":true');
  if (hasGrow || spec.fill) { root.primaryAxisSizingMode = 'FIXED'; root.resize(CW, avail); }
  const items = Array.isArray(spec.body) ? spec.body : [spec.body];
  for (const it of items) await build(root, it, { T });
  if (spec.fill) { // stretch the tallest block to the bottom limit (cards grow, fields/spacers with grow absorb the space)
    const main = root.children.slice().sort((a, b) => b.height - a.height)[0];
    if (main && main.type === 'FRAME') { main.layoutSizingVertical = 'FILL'; if (main.layoutMode === 'HORIZONTAL') for (const c of main.children) if (c.type === 'FRAME') c.layoutSizingVertical = 'FILL'; }
  }
  const bottom = root.y + root.height;
  if (root.height > avail + 1 || bottom > limit + 1) warn('overflow: content ends at y=' + Math.round(bottom) + ', limit ' + Math.round(limit) + ' (' + Math.round(bottom - limit) + ' px over) — shorten text or split the slide; never shrink fonts below the styles');
  else if (!hasGrow && !spec.fill && limit - bottom > 170) warn('empty bottom: ' + Math.round(limit - bottom) + ' px free below content — add a visual, enlarge spacing (pad), or set "grow" on a list/card');
  return root;
};
// Cover: brand top-left, kicker + big name + subtitle on the left, illustration right, meta rows bottom-left.
L.cover = async (slide, spec, T) => {
  slide.fills = []; K.S(slide, 'fills', [K.P(T.bg)]);
  const logoSvg = figma.root.getSharedPluginData(K.NS, 'logo-dark') || figma.root.getSharedPluginData(K.NS, 'logo');
  if (logoSvg) { const n = figma.createNodeFromSvg(logoSvg); slide.appendChild(n); n.name = 'logo/client'; n.rescale(38 / n.height); n.x = X; n.y = 48; }
  if (spec.illus !== 'none') await D.illus[spec.illus || 'circuit'](slide, T);
  const col = K.f(slide, { name: 'titleblock', dir: 'VERTICAL', gap: 0, x: X, y: spec.titleY || 230, w: 820 });
  if (spec.kicker) { await K.t(col, spec.kicker, 'title-s', T.t2); K.sp(col, 36); }
  const nm = await K.t(col, spec.title, 'cover', T.tc); if (spec.titleSize) nm.fontSize = spec.titleSize;
  K.sp(col, 32);
  if (spec.subtitle) { const rl = K.f(col, { dir: 'HORIZONTAL', gap: 20 }); K.fillW(rl); const r = figma.createRectangle(); rl.appendChild(r); r.resize(4, 10); K.S(r, 'fills', [K.P(T.accent)]); r.layoutSizingVertical = 'FILL'; const c = K.f(rl, { dir: 'VERTICAL' }); c.layoutSizingHorizontal = 'FILL'; await K.t(c, spec.subtitle, 'lead', T.tc); }
  if (spec.meta) {
    const info = K.f(slide, { name: 'meta', dir: 'VERTICAL', gap: 0, x: X, y: 800, w: 820 });
    for (const m of spec.meta) { K.rule(info, T.lns); const r = K.f(info, { dir: 'HORIZONTAL', gap: 24, pad: [12, 0, 12, 0], alignC: 'CENTER' }); K.fillW(r); await K.t(r, m.k, 'label', T.t3, { w: 220 }); await K.t(r, m.v, 'body-s', T.tc); }
    info.y = 1032 - info.height;
  }
  if (spec.mark !== false) { const mk = K.mark(slide, 52, T.tc); mk.x = W - X - mk.width; mk.y = H - 56 - 52; }
  return col;
};
// Chapter entry: big number + title, lead, "в главе" list, illustration right.
L.chapter = async (slide, spec, T) => {
  await D.shell(slide, { ...spec, title: undefined, lead: undefined, aside: undefined }, T);
  const col = K.f(slide, { name: 'chapter', dir: 'VERTICAL', gap: 0, x: X, y: 180, w: 840 });
  if (spec.chapterN !== undefined) { await K.t(col, '|' + spec.chapterN + '⟩', 'number', T.accentText, { hug: true, raw: true }); K.sp(col, 24); }
  await K.t(col, spec.title, 'chapter', T.tc); K.sp(col, 24);
  if (spec.lead) { await K.t(col, spec.lead, 'lead', T.t2); K.sp(col, 32); }
  if (spec.items) await B.list(col, { items: spec.items, marker: 'ket', size: 'body-s' }, { T });
  if (spec.illus !== 'none') await D.illus[spec.illus || 'bloch'](slide, T);
  return col;
};

// ---------- illustrations (decorative, right half) ----------
D.illus = {};
D.illus.circuit = async (slide, T) => {
  const il = figma.createFrame(); slide.appendChild(il); il.name = 'illus/circuit'; il.fills = []; il.resize(960, 1080); il.x = 960; il.y = 0; il.clipsContent = true;
  const ys = [330, 450, 570, 690]; const X0 = 130; const ln = T.ln; const fg = T.tc; const red = T.accent;
  const line = (x0, y0, x1, y1, c, w = 2) => { const v = figma.createVector(); il.appendChild(v); v.vectorPaths = [{ windingRule: 'NONE', data: `M ${x0} ${y0} L ${x1} ${y1}` }]; v.fills = []; K.S(v, 'strokes', [K.P(c)]); v.strokeWeight = w; v.strokeCap = 'ROUND'; return v; };
  const dot = (x, y, d, c) => { const e = figma.createEllipse(); il.appendChild(e); e.resize(d, d); e.x = x - d / 2; e.y = y - d / 2; K.S(e, 'fills', [K.P(c)]); };
  const ring = (x, y, d, c, w = 2) => { const e = figma.createEllipse(); il.appendChild(e); e.resize(d, d); e.x = x - d / 2; e.y = y - d / 2; e.fills = []; K.S(e, 'strokes', [K.P(c)]); e.strokeWeight = w; };
  const target = (x, y, c, w = 2) => { ring(x, y, 52, c, w); line(x, y - 26, x, y + 26, c, w); line(x - 26, y, x + 26, y, c, w); };
  for (let i = 0; i < 4; i++) { line(X0, ys[i], 960, ys[i], ln, 1); await K.t(il, 'q' + i + '  |0⟩', 'label', T.t3, { x: 20, y: ys[i] - 15, raw: true }); }
  const g = figma.createFrame(); il.appendChild(g); g.resize(72, 72); g.x = 214; g.y = ys[0] - 36; g.cornerRadius = 12; K.S(g, 'fills', [K.P(T.card)]); K.S(g, 'strokes', [K.P(T.t3)]); g.strokeWeight = 1.5; g.name = 'gate/H';
  const h = await K.t(g, 'H', 'heading', fg, { hug: true, raw: true }); h.x = Math.round((72 - h.width) / 2); h.y = Math.round((72 - h.height) / 2);
  line(420, ys[0], 420, ys[1], fg); dot(420, ys[0], 18, fg); target(420, ys[1], fg);
  line(580, ys[1], 580, ys[2], fg); dot(580, ys[1], 18, fg); target(580, ys[2], fg);
  line(750, ys[0], 750, ys[3], red, 2.5); dot(750, ys[0], 20, red); dot(750, ys[1], 20, red); target(750, ys[3], red, 2.5);
  for (let i = 0; i < 4; i++) ring(860, ys[i], 48, T.t2);
  for (const [x, t] of [[250, 't1'], [420, 't2'], [580, 't3'], [750, 't4']]) await K.t(il, t, 'label', T.t3, { x: x - 12, y: ys[0] - 90, raw: true });
  return il;
};
D.illus.bloch = async (slide, T) => {
  const il = figma.createFrame(); slide.appendChild(il); il.name = 'illus/bloch'; il.fills = []; il.resize(900, 1080); il.x = 1020; il.y = 0; il.clipsContent = true;
  const cx = 470, cy = 540, R = 330;
  const e = (w, h, c, sw, dash) => { const n = figma.createEllipse(); il.appendChild(n); n.resize(w, h); n.x = cx - w / 2; n.y = cy - h / 2; n.fills = []; K.S(n, 'strokes', [K.P(c)]); n.strokeWeight = sw; if (dash) n.dashPattern = dash; return n; };
  e(R * 2, R * 2, T.t3, 1.5); e(R * 2, R * 0.7, T.ln, 1.5, [6, 8]); e(R * 0.7, R * 2, T.ln, 1);
  const v = figma.createVector(); il.appendChild(v); const tx = cx + R * 0.55, ty = cy - R * 0.62; v.vectorPaths = [{ windingRule: 'NONE', data: `M ${cx} ${cy} L ${tx} ${ty}` }]; v.fills = []; K.S(v, 'strokes', [K.P(T.accent)]); v.strokeWeight = 3; v.strokeCap = 'ROUND';
  const d = figma.createEllipse(); il.appendChild(d); d.resize(22, 22); d.x = tx - 11; d.y = ty - 11; K.S(d, 'fills', [K.P(T.accent)]);
  const o = figma.createEllipse(); il.appendChild(o); o.resize(10, 10); o.x = cx - 5; o.y = cy - 5; K.S(o, 'fills', [K.P(T.tc)]);
  await K.t(il, '|0⟩', 'label', T.t3, { x: cx - 18, y: cy - R - 44, raw: true }); await K.t(il, '|1⟩', 'label', T.t3, { x: cx - 18, y: cy + R + 14, raw: true });
  return il;
};

// ---------- entry point ----------
D.build = async (spec) => {
  D.issues = []; D.later = [];
  if (!spec.key) throw new Error('slide spec needs "key" (e.g. "S05") — it makes rebuilds idempotent');
  const T = K.T(spec.theme !== 'light');
  await K.deckPage();
  const slide = K.slide(spec.key, { title: spec.title });
  slide.setSharedPluginData(K.NS, 'spec', JSON.stringify(spec).slice(0, 90000));
  const layout = L[spec.layout || 'content'];
  if (!layout) throw new Error('unknown layout "' + spec.layout + '". Known: ' + Object.keys(L).join(', '));
  await layout(slide, spec, T);
  for (const f of D.later) f();
  if (spec.decor) for (const d of spec.decor) {
    if (d.type === 'field') { const f = K.field(slide, d.w, d.h, T.tc, { op: d.op || 0.17, step: d.step || 24 }); f.x = d.x; f.y = d.y; }
  }
  slide.setSharedPluginData(K.NS, 'texts', JSON.stringify(K.textsOf(slide)));
  return { id: slide.id, key: spec.key, issues: D.issues.slice() };
};
// Compare the slide's current texts with what the engine produced last time.
D.manualEdits = async (key) => {
  await K.deckPage();
  const s = K.findSlide(key); if (!s) return null;
  const before = JSON.parse(s.getSharedPluginData(K.NS, 'texts') || 'null'); if (!before) return null;
  const now = K.textsOf(s); const norm = x => x.replace(/\u00A0/g, ' ');
  const B = new Set(before.map(norm)), N = new Set(now.map(norm));
  const removed = before.map(norm).filter(x => !N.has(x)), added = now.map(norm).filter(x => !B.has(x));
  return removed.length || added.length ? { removed, added } : null;
};
D.layouts = () => Object.keys(L);
D.blocks = () => Object.keys(B);
return D;
