
const vars=await figma.variables.getLocalVariablesAsync();
const VAR=n=>{const v=vars.find(x=>x.name===n);if(!v)throw new Error('no var '+n);return v};
const VP=(n,op=1)=>{let p=figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',VAR(n));if(op!==1)p={...p,opacity:op};return p};
const tstyles=await figma.getLocalTextStylesAsync();const estyles=await figma.getLocalEffectStylesAsync();const pstyles=await figma.getLocalPaintStylesAsync();
globalThis.__fl=globalThis.__fl||new Set();const LF=async f=>{const k=f.family+'|'+f.style;if(globalThis.__fl.has(k))return;await figma.loadFontAsync(f);globalThis.__fl.add(k)};for(const s of tstyles){if(s.name.startsWith('x5/'))await LF(s.fontName)}
await LF({family:'Onest',style:'SemiBold'});await LF({family:'Unbounded',style:'Bold'});
const TS=n=>{const s=tstyles.find(x=>x.name==='x5/'+n);if(!s)throw new Error('no style '+n);return s};
const ES=n=>estyles.find(x=>x.name==='x5/fx/'+n);const PS=n=>pstyles.find(x=>x.name==='x5/'+n);
const S=(node,prop,paints)=>{node[prop]=paints;node[prop]=node[prop].map((p,i)=>({...p,opacity:paints[i]&&paints[i].opacity!==undefined?paints[i].opacity:1}));return node};
const L={VP,VAR,TS,ES,PS,S};
L.txt=async(parent,chars,style,color='text/on-dark',o={})=>{const t=figma.createText();parent.appendChild(t);await t.setTextStyleIdAsync(TS(style).id);t.characters=chars;S(t,'fills',[VP(color,o.op||1)]);if(o.w){t.textAutoResize='HEIGHT';t.resize(o.w,t.height)}else t.textAutoResize='WIDTH_AND_HEIGHT';if(o.align)t.textAlignHorizontal=o.align;if(o.name)t.name=o.name;if(o.x!==undefined){t.x=o.x;t.y=o.y}if(o.fill&&parent.layoutMode&&parent.layoutMode!=='NONE')t.layoutSizingHorizontal='FILL';return t};
L.bold=async(t,frags,strongStyle='body-strong')=>{const s=TS(strongStyle);for(const fr of frags){let i=t.characters.indexOf(fr);while(i>=0){await t.setRangeTextStyleIdAsync(i,i+fr.length,s.id);i=t.characters.indexOf(fr,i+fr.length)}}};
L.color=(t,frags,color)=>{for(const fr of frags){let i=t.characters.indexOf(fr);while(i>=0){t.setRangeFills(i,i+fr.length,[VP(color)]);i=t.characters.indexOf(fr,i+fr.length)}}};
L.box=(parent,o={})=>{const f=figma.createFrame();parent.appendChild(f);f.name=o.name||'box';S(f,'fills',o.fill?[VP(o.fill,o.fillOp||1)]:[]);f.clipsContent=false;if(o.dir){f.layoutMode=o.dir;f.itemSpacing=o.gap||0;const p=o.pad||0;const pp=Array.isArray(p)?p:[p,p,p,p];[f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft]=pp;f.primaryAxisSizingMode=o.mainFixed?'FIXED':'AUTO';f.counterAxisSizingMode=o.crossFixed?'FIXED':'AUTO';if(o.alignC)f.counterAxisAlignItems=o.alignC;if(o.alignM)f.primaryAxisAlignItems=o.alignM}if(o.w||o.h)f.resize(o.w||f.width||10,o.h||f.height||10);if(o.r!==undefined)f.cornerRadius=o.r;if(o.stroke){S(f,'strokes',[VP(o.stroke,o.strokeOp||1)]);f.strokeWeight=o.sw||1;f.strokeAlign='INSIDE'}if(o.x!==undefined){f.x=o.x;f.y=o.y}return f};
L.glass=async(parent,o={})=>{const f=L.box(parent,{dir:'VERTICAL',gap:o.gap??16,pad:o.pad??32,r:o.r??24,...o});const light=o.light;await f.setFillStyleIdAsync(PS(light?'glass-light/fill':'glass/fill').id);await f.setStrokeStyleIdAsync(PS(light?'glass-light/stroke':'glass/stroke').id);f.strokeWeight=1;f.strokeAlign='INSIDE';if(!light)await f.setEffectStyleIdAsync(ES('glass').id);return f};
L.mark=(parent,size=40,color='text/on-dark')=>{const n=figma.createNodeFromSvg(figma.root.getSharedPluginData('x5r','marksvg'));parent.appendChild(n);n.rescale(size/76);n.name='sparq/mark';for(const v of n.findAll(x=>x.type==='VECTOR'))S(v,'fills',[VP(color)]);return n};
L.dot=(parent,kind,d=18)=>{if(kind==='mid'){const g=L.box(parent,{name:'horizon/mid',w:d,h:d});const e=figma.createEllipse();g.appendChild(e);e.resize(d,d);e.fills=[];S(e,'strokes',[VP('horizon/now')]);e.strokeWeight=Math.max(2,Math.round(d/8));e.strokeAlign='INSIDE';const h=figma.createEllipse();g.appendChild(h);h.resize(d,d);S(h,'fills',[VP('horizon/now')]);h.arcData={startingAngle:Math.PI/2,endingAngle:Math.PI*1.5,innerRadius:0};return g}const e=figma.createEllipse();parent.appendChild(e);e.resize(d,d);e.name='horizon/'+kind;if(kind==='now'){S(e,'fills',[VP('horizon/now')])}else{e.fills=[];S(e,'strokes',[VP(L.farColor||'text/on-dark-3')]);e.strokeWeight=Math.max(2,Math.round(d/8));e.strokeAlign='INSIDE'}return e};
L.pill=async(parent,label,o={})=>{const f=L.box(parent,{name:'tab',dir:'HORIZONTAL',gap:10,pad:[8,16,8,14],r:999,fill:o.fill||'bg/dark-raised',alignC:'CENTER',stroke:o.stroke,strokeOp:o.strokeOp});if(o.dot!==false){const d=figma.createEllipse();f.appendChild(d);d.resize(8,8);S(d,'fills',[VP(o.dotColor||'accent/primary')])}await L.txt(f,label,'kicker',o.color||'text/on-dark-2');return f};
L.bg=async(slide,theme='dark')=>{S(slide,'fills',[VP(theme==='light'?'bg/light':'bg/dark')]);const r=figma.createRectangle();slide.appendChild(r);r.name='bg/grain';r.resize(1920,1080);S(r,'fills',[VP(theme==='light'?'bg/light':'bg/dark')]);await r.setEffectStyleIdAsync(ES(theme==='light'?'grain-light':'grain').id);r.locked=true;return r};
L.shell=async(slide,o)=>{const dark=o.theme!=='light';await L.bg(slide,o.theme||'dark');const tc=dark?'text/on-dark':'text/on-light';const t2=dark?'text/on-dark-2':'text/on-light-2';
 const top=L.box(slide,{name:'header',x:96,y:56,w:1728,h:36});
 if(o.chapter){const p=await L.pill(top,o.chapter,{fill:dark?'bg/dark-raised':'bg/light-alt',color:t2});p.x=0;p.y=0}
 const c=await L.txt(top,'|'+o.n+'/'+o.total+'⟩','label',t2,{name:'counter'});c.x=1728-c.width;c.y=6;
 let y=o.titleY||128;
 if(o.title){const t=await L.txt(slide,o.title,o.titleStyle||'title',tc,{w:o.titleW||1500,name:'title',x:96,y});y+=t.height+20}
 if(o.lead){const l=await L.txt(slide,o.lead,o.leadStyle||'lead',t2,{w:o.leadW||1320,name:'lead',x:96,y});y+=l.height}
 if(o.foot){const f=await L.txt(slide,o.foot,'note',dark?'text/on-dark-3':'text/on-light-2',{w:1500,name:'footnote',x:96,y:1000});f.y=1080-36-f.height}
 return {y:Math.max(248,y+48),tc,t2,dark}};
L.icon=(parent,name,size=40,color='text/on-dark')=>{const A=JSON.parse(figma.root.getSharedPluginData('x5r','icons_sparq'));const B=JSON.parse(figma.root.getSharedPluginData('x5r','icons_own'));const body=(A[name]||B[name]);if(!body)throw new Error('no icon '+name);const svg='<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">'+body.replace(/ SL/g,' stroke-linecap="round" stroke-linejoin="round"')+'</svg>';const n=figma.createNodeFromSvg(svg);parent.appendChild(n);n.name='icon/'+name;n.rescale(size/48);for(const v of n.findAll(x=>x.type==='VECTOR'||x.type==='ELLIPSE')){if(v.strokes&&v.strokes.length)S(v,'strokes',[VP(color)]);if(v.fills&&v.fills.length){const c=v.fills[0].color;if(c&&c.r>0.5)S(v,'fills',[VP(color)]);else S(v,'fills',[VP('bg/dark')])}}return n};
L.matrix=async(slide,o)=>{const light=o.theme==='light';const tc=light?'text/on-light':'text/on-dark',t2=light?'text/on-light-2':'text/on-dark-2',ln=light?'line/on-light':'line/on-dark';L.farColor=light?'text/on-light-2':'text/on-dark-3';
 const W=o.widths;const tb=L.box(slide,{name:'matrix',dir:'VERTICAL',gap:0,x:o.x,y:o.y});
 const hr=L.box(tb,{dir:'HORIZONTAL',pad:[0,0,12,0],alignC:'MAX'});
 for(let i=0;i<o.head.length;i++){const c=L.box(hr,{dir:'HORIZONTAL',w:W[i],h:44,alignC:'MAX',alignM:i>=2&&i<o.head.length-1?'CENTER':(i===o.head.length-1?'MAX':'MIN')});c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.resize(W[i],44);await L.txt(c,o.head[i],'label',t2,{w:i>=2?W[i]:undefined,align:i>=2&&i<o.head.length-1?'CENTER':(i===o.head.length-1?'RIGHT':'LEFT')})}
 L.box(tb,{w:W.reduce((a,b)=>a+b,0),h:2,fill:light?'text/on-light':'text/on-dark-3'});
 let prevG=null;
 for(const row of o.rows){const [g,task,star,cells,page]=row;const newG=g!==prevG;if(newG&&prevG!==null)L.box(tb,{w:W.reduce((a,b)=>a+b,0),h:1,fill:ln});
  const rw=L.box(tb,{dir:'HORIZONTAL',alignC:'CENTER',pad:[0,0,0,0]});
  const gc=L.box(rw,{dir:'HORIZONTAL',w:W[0],h:o.rh,alignC:'CENTER'});gc.primaryAxisSizingMode='FIXED';gc.counterAxisSizingMode='FIXED';gc.resize(W[0],o.rh);if(newG)await L.txt(gc,g,'label',t2,{w:W[0]-12});
  const tcn=L.box(rw,{dir:'HORIZONTAL',gap:10,w:W[1],h:o.rh,alignC:'CENTER'});tcn.primaryAxisSizingMode='FIXED';tcn.counterAxisSizingMode='FIXED';tcn.resize(W[1],o.rh);
  if(star){const b=L.box(tcn,{w:4,h:22,fill:'accent/primary',r:2})}
  await L.txt(tcn,task,star?'body-s-strong':'body-s',tc,{w:W[1]-(star?14:0)});
  for(let i=0;i<cells.length;i++){const c=L.box(rw,{dir:'HORIZONTAL',w:W[i+2],h:o.rh,alignC:'CENTER',alignM:'CENTER'});c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.resize(W[i+2],o.rh);if(cells[i])L.dot(c,cells[i],20)}
  const pc=L.box(rw,{dir:'HORIZONTAL',w:W[W.length-1],h:o.rh,alignC:'CENTER',alignM:'MAX'});pc.primaryAxisSizingMode='FIXED';pc.counterAxisSizingMode='FIXED';pc.resize(W[W.length-1],o.rh);await L.txt(pc,page,'label',t2);
  prevG=g;}
 return tb};
L.landscape=async(parent,o)=>{const W=o.w,H=o.h,k=W/824,kh=H/520;const ill=L.box(parent,{name:'illus/landscape',x:o.x,y:o.y,w:W,h:H});
const pts=[[0,120],[90,250],[170,180],[260,330],[350,230],[450,470],[560,300],[660,360],[760,200],[824,150]].map(p=>[p[0]*k,p[1]*kh]);
let d='M '+pts[0][0]+' '+pts[0][1];for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i];const mx=(x0+x1)/2;d+=' C '+mx+' '+y0+' '+mx+' '+y1+' '+x1+' '+y1}
for(let i=0;i<=5;i++){const ln=L.box(ill,{x:0,y:i*H/5,w:W,h:1,fill:'line/on-dark-soft'})}
const v=figma.createVector();ill.appendChild(v);v.vectorPaths=[{windingRule:'NONE',data:d}];v.fills=[];S(v,'strokes',[VP('text/on-dark-2')]);v.strokeWeight=2;v.name='curve';
const dot=async(x,y,red,label)=>{x*=k;y*=kh;const e=figma.createEllipse();ill.appendChild(e);const D=red?22:14;e.resize(D,D);e.x=x-D/2;e.y=y-D-2;if(red){S(e,'fills',[VP('accent/primary')]);await e.setEffectStyleIdAsync(ES('neon-strong').id)}else{e.fills=[];S(e,'strokes',[VP('text/on-dark-2')]);e.strokeWeight=2}if(label)await L.txt(ill,label,'label',red?'text/on-dark':'text/on-dark-3',{x:x-70,y:y+14,w:140,align:'CENTER'})};
await dot(90,250,false,'');await dot(260,330,false,o.labels?'локальный минимум':'');await dot(660,360,false,'');await dot(450,470,true,o.labels?'решение':'');
const tv=figma.createVector();ill.appendChild(tv);tv.vectorPaths=[{windingRule:'NONE',data:'M '+270*k+' '+300*kh+' C '+320*k+' '+250*kh+' '+400*k+' '+330*kh+' '+440*k+' '+440*kh}];tv.fills=[];S(tv,'strokes',[VP('accent/primary')]);tv.strokeWeight=2;tv.dashPattern=[6,6];
if(o.labels){await L.txt(ill,'туннелирование','label','text/on-dark-3',{x:250*k,y:200*kh});await L.txt(ill,'энергия решения ↓','note','text/on-dark-3',{x:0,y:-28})}
return ill};
return L;