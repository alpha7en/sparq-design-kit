"""Builds section 09 «шаблоны каруселей» of the SPARQ.2 system page from the single source
plugins/sparq-studio/skills/sparq-cards/examples/carousel-templates.jsonl (via the dev harness on :9301).
Usage: python3 tools/figma/build-templates.py <SPARQ.2 fileKey>"""
import json, subprocess, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'plugins/sparq-studio/skills/sparq-cards/examples/carousel-templates.jsonl')
FK = sys.argv[1]
def call(name, args):
    r = subprocess.run(['curl', '-s', '-m', '280', '-X', 'POST', 'localhost:9301', '-d', '@-'], input=json.dumps({"name": name, "arguments": args}, ensure_ascii=False).encode(), capture_output=True).stdout.decode()
    try: return json.loads(r)
    except Exception: return {"error": r[:400]}
T = [json.loads(l) for l in open(SRC) if l.strip()]
ids = {}
for k, t in enumerate(T, 1):
    slug = 'TPL%d' % k
    call("sparq_run", {"fileKey": FK, "kit": "none", "code": "for(const p of figma.root.children.slice())if(p.name==='P·tpl %s')p.remove();return 1" % slug})
    got = []
    for i in range(0, len(t['cards']), 3):
        d = call("sparq_cards", {"fileKey": FK, "slug": slug, "date": "tpl", "cards": t['cards'][i:i + 3]})
        if 'error' in d: print(slug, 'ERR', d['error'][:300]); continue
        for j, c in enumerate(d['cards']):
            got.append(c['id'])
            notes = [n for n in (c.get('notes') or []) if not n.startswith('кегль') and not n.startswith('фон')]
            if notes or c.get('issues'): print(slug, i + j + 1, notes, c.get('issues'))
        for o in d['lint']['out']: print(slug, 'lint', o['n'], o['issues'][:2])
    ids[k] = got
    print(t['template'], len(got))
meta = [{"title": t['template'], "note": t['note'], "ids": ids[k]} for k, t in enumerate(T, 1)]
js = r'''const M=%s;await figma.loadAllPagesAsync();const sys=figma.root.children.find(p=>p.name.startsWith('SPARQ · система'));await figma.setCurrentPageAsync(sys);
let sec=sys.children.find(c=>c.type==='SECTION'&&c.name.startsWith('09'));for(const c of sec.children.slice())c.remove();sec.name='09 · шаблоны каруселей ('+M.length+', собраны из examples/carousel-templates.jsonl)';
let y=80;for(const m of M){const wrap=figma.createFrame();wrap.name=m.title;wrap.fills=[];wrap.layoutMode='VERTICAL';wrap.itemSpacing=28;wrap.primaryAxisSizingMode='AUTO';wrap.counterAxisSizingMode='AUTO';wrap.clipsContent=false;sec.appendChild(wrap);wrap.x=80;wrap.y=y;
 await O.K.T(wrap,m.title,'sparq/body-strong','td',{});await O.K.T(wrap,m.note,'sparq/label','td2',{});const row=figma.createFrame();row.name='карусель';row.fills=[];row.layoutMode='HORIZONTAL';row.itemSpacing=60;row.primaryAxisSizingMode='AUTO';row.counterAxisSizingMode='AUTO';row.clipsContent=false;wrap.appendChild(row);
 for(const id of m.ids){const nd=await figma.getNodeByIdAsync(id);if(nd)row.appendChild(nd)}y+=wrap.height+140}
sec.resizeWithoutConstraints(Math.max(...sec.children.map(c=>c.x+c.width))+80,y+80);
for(const p of figma.root.children.slice())if(/^P·tpl TPL\d+$/.test(p.name))p.remove();return {templates:M.length,section:sec.id}''' % json.dumps(meta, ensure_ascii=False)
print(call("sparq_run", {"fileKey": FK, "kit": "cards", "code": js}))
