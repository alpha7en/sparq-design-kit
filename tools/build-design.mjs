#!/usr/bin/env node
// SPARQ Studio · build sealed design bundles from raw Figma exports in design/_source/.
// Output: design/tokens/{deck,cards}.json, design/icons/deck.json, design/runtime/cards/*.js, design/runtime/deck/mark.svg
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'design/_source');
const j = p => JSON.parse(readFileSync(join(SRC, p), 'utf8'));
const out = (p, data) => { const f = join(ROOT, 'design', p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data)); console.log('wrote', p, (typeof data === 'string' ? data.length : JSON.stringify(data).length), 'bytes'); };

const tsOut = (s, rename) => ({ name: rename(s.name), family: s.family, style: s.style, size: s.size, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, ...(s.paragraphSpacing ? { paragraphSpacing: s.paragraphSpacing } : {}), ...(s.textCase && s.textCase !== 'ORIGINAL' ? { textCase: s.textCase } : {}), ...(s.description ? { description: s.description } : {}) });

// ---------- deck (presentations 1920×1080) ----------
{
  const vars = j('deck/variables.json'); // [{collection,name,type,value}]
  const map = { 'x5/color': 'deck/color', 'x5/size': 'deck/size' };
  const cols = {};
  for (const v of vars) {
    const c = map[v.collection]; if (!c) continue;
    cols[c] = cols[c] || { name: c, modes: ['base'], vars: [] };
    const val = v.value && v.value.alias ? { alias: c + '::' + v.value.alias } : v.value;
    cols[c].vars.push({ name: v.name, type: v.type, values: { base: val } });
  }
  const textStyles = j('deck/text-styles.json').filter(s => s.name.startsWith('x5/')).map(s => tsOut(s, n => 'deck/' + n.slice(3)));
  const effectStyles = j('deck/effect-styles.json').map(s => ({ name: 'deck/' + s.name.slice(3), effects: s.effects }));
  const paintStyles = j('deck/paint-styles.json').map(s => ({ name: 'deck/' + s.name.slice(3), paints: s.paints }));
  out('tokens/deck.json', { kit: 'deck', collections: Object.values(cols), textStyles, effectStyles, paintStyles });

  // icons: arena (product UI set) + sparq report set + own set → one {name: svg} map
  const arena = JSON.parse(readFileSync(join(SRC, 'deck/code/icons_arena.txt'), 'utf8'));
  const wrap = body => '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' + body.replace(/ SL/g, ' stroke-linecap="round" stroke-linejoin="round"') + '</svg>';
  const sparq = JSON.parse(readFileSync(join(SRC, 'deck/code/icons_sparq.txt'), 'utf8'));
  const own = JSON.parse(readFileSync(join(SRC, 'deck/code/icons_own.txt'), 'utf8'));
  const icons = { ...Object.fromEntries(Object.entries(sparq).map(([k, v]) => ['q-' + k, wrap(v)])), ...Object.fromEntries(Object.entries(own).map(([k, v]) => ['q-' + k, wrap(v)])), ...arena };
  out('icons/deck.json', icons);
  out('runtime/deck/mark.svg', readFileSync(join(SRC, 'deck/code/marksvg.js'), 'utf8'));
}

// ---------- cards (Telegram 1:1, system from SPARQ.2 framework) ----------
{
  const vars = j('cards/tokens/variables.json'); // [{collection,name,type,values:{mode:val}}]
  const keep = ['sparq/color', 'sparq/size'];
  const cols = {};
  for (const v of vars) {
    if (!keep.includes(v.collection)) continue;
    const modes = Object.keys(v.values);
    cols[v.collection] = cols[v.collection] || { name: v.collection, modes, vars: [] };
    const values = {};
    for (const [m, x] of Object.entries(v.values)) values[m] = x && x.alias ? { alias: v.collection + '::' + x.alias } : x;
    cols[v.collection].vars.push({ name: v.name, type: v.type, scopes: v.scopes, ...(v.description ? { description: v.description } : {}), values });
  }
  const textStyles = j('cards/tokens/text-styles.json').filter(s => s.name.startsWith('sparq/')).map(s => tsOut(s, n => n));
  const effectStyles = j('cards/tokens/effect-styles.json').filter(s => s.name.startsWith('sparq/'));
  const paintStyles = j('cards/tokens/paint-styles.json').filter(s => s.name.startsWith('sparq/'));
  out('tokens/cards.json', { kit: 'cards', collections: Object.values(cols), textStyles, effectStyles, paintStyles });
  mkdirSync(join(ROOT, 'design/runtime/cards'), { recursive: true });
  for (const f of readdirSync(join(SRC, 'cards/code'))) copyFileSync(join(SRC, 'cards/code', f), join(ROOT, 'design/runtime/cards', f));
  console.log('copied cards runtime');
}
