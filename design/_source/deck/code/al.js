
const {VP,S}=L;
const AL={};
AL.f=(par,o={})=>{const f=figma.createFrame();par.appendChild(f);f.name=o.name||'f';f.fills=[];f.clipsContent=false;
 f.layoutMode=o.dir||'VERTICAL';f.itemSpacing=o.gap||0;const p=o.pad===undefined?0:o.pad;const pp=Array.isArray(p)?p:[p,p,p,p];[f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft]=pp;
 f.primaryAxisSizingMode='AUTO';f.counterAxisSizingMode='AUTO';
 if(o.alignC)f.counterAxisAlignItems=o.alignC;if(o.alignM)f.primaryAxisAlignItems=o.alignM;
 if(o.fill)S(f,'fills',[VP(o.fill,o.fillOp||1)]);if(o.r!==undefined)f.cornerRadius=o.r;
 if(o.stroke){S(f,'strokes',[VP(o.stroke,o.strokeOp||1)]);f.strokeWeight=o.sw||1;f.strokeAlign='INSIDE';if(o.dash)f.dashPattern=o.dash}
 if(o.wrap){f.layoutWrap='WRAP';f.counterAxisSpacing=o.gap||0}
 if(o.w!==undefined){f.layoutSizingHorizontal='FIXED';f.resize(o.w,f.height)}
 if(o.h!==undefined){f.layoutSizingVertical='FIXED';f.resize(f.width,o.h)}
 if(o.x!==undefined){f.x=o.x;f.y=o.y}
 return f};
AL.fillW=(n)=>{n.layoutSizingHorizontal='FILL';return n};
AL.fillH=(n)=>{n.layoutSizingVertical='FILL';return n};
AL.t=async(par,chars,style,color,o={})=>{const t=figma.createText();par.appendChild(t);await t.setTextStyleIdAsync(L.TS(style).id);t.characters=chars;S(t,'fills',[VP(color||'text/on-dark')]);t.textAutoResize='HEIGHT';if(o.name)t.name=o.name;if(o.align)t.textAlignHorizontal=o.align;if(o.fixedW){t.textAutoResize='HEIGHT';t.resize(o.fixedW,t.height)}else if(o.hug){t.textAutoResize='WIDTH_AND_HEIGHT'}else{t.layoutSizingHorizontal='FILL'}return t};
AL.chip=async(par,label,o={})=>{const c=AL.f(par,{name:'chip',dir:'HORIZONTAL',pad:[5,12,5,12],r:999,alignC:'CENTER',stroke:o.hot?'text/on-dark':'line/on-dark',sw:o.hot?1.5:1});if(o.dash)c.dashPattern=[4,4];await AL.t(c,label,'note',o.hot?'text/on-dark':'text/on-dark-2',{hug:true});return c};
AL.chips=async(par,arr,gap=8)=>{const w=AL.f(par,{name:'chips',dir:'HORIZONTAL',gap,wrap:true});w.layoutSizingHorizontal='FILL';for(const a of arr){const [l,o]=Array.isArray(a)?a:[a,{}];await AL.chip(w,l,o)}return w};
AL.hair=(par,c='line/on-dark')=>{const h=figma.createRectangle();par.appendChild(h);h.resize(10,1);S(h,'fills',[VP(c)]);h.layoutSizingHorizontal='FILL';h.layoutSizingVertical='FIXED';h.name='hair';return h};
AL.kpi=async(par,num,cap,o={})=>{const k=AL.f(par,{name:'kpi',dir:'VERTICAL',gap:o.gap??6,pad:[o.pt??14,0,0,0]});if(!o.nohair){/*rule via stroke top*/ }
 const r=AL.hair(k,'text/on-dark-3');await AL.t(k,num,o.style||'number-m','text/on-dark');await AL.t(k,cap,'label','text/on-dark-2');return k};
AL.card=(par,o={})=>AL.f(par,{name:o.name||'card',dir:'VERTICAL',gap:o.gap??16,pad:o.pad??32,r:o.r??20,fill:o.fill||'bg/dark-raised',stroke:o.stroke||'line/on-dark',sw:o.sw||1,...o});
AL.rail=(par,color='accent/primary')=>{const r=figma.createRectangle();par.appendChild(r);r.resize(4,10);S(r,'fills',[VP(color)]);r.cornerRadius=2;r.layoutSizingVertical='FILL';r.layoutSizingHorizontal='FIXED';r.name='rail';return r};
AL.take=async(par,text,o={})=>{const w=AL.f(par,{name:'takeaway',dir:'HORIZONTAL',gap:20,});w.layoutSizingHorizontal='FILL';AL.rail(w,o.color||'accent/primary');const c=AL.f(w,{dir:'VERTICAL'});c.layoutSizingHorizontal='FILL';await AL.t(c,text,o.style||'body-strong','text/on-dark');return w};
AL.logos=async(par,items,o={})=>{const row=AL.f(par,{name:'logos',dir:'HORIZONTAL',gap:o.gap||22,alignC:'CENTER'});for(const it of items){if(it.startsWith('t:')){const t=await AL.t(row,it.slice(2),'body-s-strong','text/on-dark',{hug:true});t.letterSpacing={value:8,unit:'PERCENT'};t.name='wordmark'}else{const n=L2.logo(row,it,L2.HH[it]||28,'text/on-dark',{op:.95})}}return row};
AL.slideRoot=(slide,o={})=>{const r=AL.f(slide,{name:'content',dir:o.dir||'VERTICAL',gap:o.gap||24,x:o.x??96,y:o.y??232,w:o.w??1728,h:o.h??752});return r};
AL.list=async(par,items,o={})=>{const c=AL.f(par,{name:'list',dir:'VERTICAL'});AL.fillW(c);AL.hair(c,'text/on-dark-3');for(let i=0;i<items.length;i++){const r=AL.f(c,{dir:'HORIZONTAL',gap:20,pad:[o.py??16,0,o.py??16,0],alignC:'MIN'});AL.fillW(r);await AL.t(r,'|'+(i+1)+'⟩','label','text/on-dark-3',{fixedW:44});await AL.t(r,items[i],o.style||'body-s','text/on-dark');AL.hair(c)}return c};
AL.sp=(par,h=8,grow=false)=>{const f=AL.f(par,{name:'spacer',h});if(grow)f.layoutSizingVertical='FILL';return f};
AL.table=async(par,o)=>{const light=!!o.light;const tc=light?'text/on-light':'text/on-dark',t2=light?'text/on-light-2':'text/on-dark-2',t3=light?'text/on-light-2':'text/on-dark-3',ln=light?'line/on-light':'line/on-dark';
 const T=AL.f(par,{name:o.name||'table',dir:'VERTICAL'});AL.fillW(T);
 const mkRow=(cells,style,color,pad)=>{const r=AL.f(T,{name:'row',dir:'HORIZONTAL',gap:o.gap||24,pad:[pad,0,pad,0],alignC:o.valign||'CENTER'});AL.fillW(r);return r};
 const hr=mkRow(o.head,'kicker',t3,0);hr.paddingBottom=12;
 for(let i=0;i<o.head.length;i++){const c=await AL.t(hr,o.head[i],'kicker',t3,{fixedW:o.cols[i]});if(o.cols[i]===0){c.layoutSizingHorizontal='FILL'}}
 const top=figma.createRectangle();T.appendChild(top);top.resize(10,2);L.S(top,'fills',[L.VP(light?'text/on-light':'text/on-dark-3')]);top.layoutSizingHorizontal='FILL';top.layoutSizingVertical='FIXED';top.name='rule';
 const rows=[];
 for(const row of o.rows){const r=mkRow(row,'',tc,o.py||16);if(row.__hl){r.fills=[];L.S(r,'fills',[L.VP(light?'bg/light-alt':'bg/dark-raised')])}
  for(let i=0;i<row.length;i++){const c=row[i];const spec=typeof c==='string'?{t:c}:c;
   if(spec.node){await spec.node(r);continue}
   const t=await AL.t(r,spec.t,spec.style||(i===0?'body-s-strong':'body-s'),spec.color||(i===0?tc:t2===undefined?tc:tc),{fixedW:o.cols[i]});if(o.cols[i]===0)t.layoutSizingHorizontal='FILL'}
  AL.hair(T,ln);rows.push(r)}
 return {T,rows}};
AL.mk=async(par,kind,size=36,color='text/on-dark')=>{const f=figma.createFrame();par.appendChild(f);f.name='mark';f.fills=[];f.layoutMode='NONE';f.resize(size+4,size+4);f.layoutSizingHorizontal='FIXED';f.layoutSizingVertical='FIXED';await L2.mark(f,kind,2,2,size,color);return f};
return AL;