const {VP,S}=L;
const GP={N:18};
GP.T=(dark)=>dark?{dark:true,bg:'bg/dark',tc:'text/on-dark',t2:'text/on-dark-2',t3:'text/on-dark-3',ln:'line/on-dark',lns:'line/on-dark-soft',card:'bg/dark-raised',cardLn:'line/on-dark',inv:'bg/light',invTc:'text/on-light',invT2:'text/on-light-2',invLn:'line/on-light'}:{dark:false,bg:'bg/light',tc:'text/on-light',t2:'text/on-light-2',t3:'text/on-light-2',ln:'line/on-light',lns:'line/on-light',card:'prim/white',cardLn:'line/on-light',inv:'bg/dark',invTc:'text/on-dark',invT2:'text/on-dark-2',invLn:'line/on-dark'};
GP.newSlide=()=>{const sl=figma.createSlide();const flat=figma.getSlideGrid().flat();const all=figma.currentPage.findAll(n=>n.type==='SLIDE');const nw=all.filter(x=>!flat.includes(x));figma.setSlideGrid([flat.concat(nw)]);return sl};
GP.logo=(par,white,h=36)=>{const svg=figma.root.getSharedPluginData('x5r',white?'gpb_white':'gpb_black');const n=figma.createNodeFromSvg(svg);par.appendChild(n);n.name='logo/gazprombank-tech';n.rescale(h/n.height);return n};
GP.mark=(par,size,color)=>L.mark(par,size,color);
GP.shell=async(sl,o)=>{const T=GP.T(!o.light);sl.fills=[];S(sl,'fills',[VP(T.bg)]);
 const hd=AL.f(sl,{name:'header',dir:'HORIZONTAL',x:96,y:48,w:1728,alignC:'CENTER',alignM:'SPACE_BETWEEN'});hd.layoutSizingVertical='HUG';
 if(!o.nologo)GP.logo(hd,T.dark,38);else{const sp=AL.f(hd,{name:'sp',w:10,h:10})}
 const c=await AL.t(hd,'|'+o.n+'/'+GP.N+'⟩','label',T.t2,{hug:true,name:'counter'});
 let y=o.titleY||128;let tb=y;
 if(o.title){const t=await AL.t(sl,o.title,o.titleStyle||'title',T.tc,{fixedW:o.titleW||1728,name:'title'});t.x=96;t.y=y;tb=y+t.height}
 if(o.foot){const f=await AL.t(sl,o.foot,'note',T.t3,{fixedW:o.footW||1728,name:'footnote'});f.x=96;f.y=1048-f.height}
 return {T,top:Math.max(232,tb+40)}};
GP.f=AL.f;
GP.card=(par,T,o={})=>AL.f(par,{name:o.name||'card',dir:o.dir||'VERTICAL',gap:o.gap??16,pad:o.pad??32,r:o.r??20,fill:o.fill||T.card,stroke:o.stroke||T.cardLn,sw:o.sw||1,...o});
GP.txt=(par,chars,style,color,o={})=>AL.t(par,chars,style,color,o);
// text with bold lead: "**Жирное.** остальное" -> two ranges in one text node
GP.rich=async(par,chars,color,o={})=>{const m=chars.match(/^\*\*(.+?)\*\*\s*(.*)$/s);let lead=m?m[1]:'',rest=m?m[2]:chars;const full=m?lead+' '+rest:chars;const t=await AL.t(par,full,o.style||'body',color,o);if(m){await t.setRangeTextStyleIdAsync(0,lead.length,L.TS(o.strong||'body-strong').id)}return t};
GP.rule=(par,color,h=1,fixedW)=>{const r=figma.createRectangle();par.appendChild(r);r.resize(fixedW||10,h);S(r,'fills',[VP(color)]);r.layoutSizingHorizontal=fixedW?'FIXED':'FILL';r.layoutSizingVertical='FIXED';r.name='rule';return r};
GP.rail=AL.rail;
// ket index chip "|1⟩"
GP.ket=async(par,n,color,o={})=>{const t=await AL.t(par,'|'+n+'⟩','label',color,{hug:true,name:'ket'});return t};
GP.dot=(par,color,d=12)=>{const e=figma.createEllipse();par.appendChild(e);e.resize(d,d);S(e,'fills',[VP(color)]);e.name='dot';return e};
// interference field with colour
GP.field=(par,x,y,w,h,color,o={})=>{const f=L.box(par,{name:'field/interference',x,y,w,h});f.clipsContent=true;const cs=o.centers||[[w*0.32,h*0.55],[w*0.68,h*0.45]];const step=o.step||26,n=Math.ceil(Math.hypot(w,h)/step);
 for(const [cx,cy] of cs){for(let i=1;i<=n;i++){const r=i*step;const e=figma.createEllipse();f.appendChild(e);e.resize(r*2,r*2);e.x=cx-r;e.y=cy-r;e.fills=[];S(e,'strokes',[VP(color,(o.op||0.16)*(1-i/(n*1.15)))]);e.strokeWeight=1;e.name='ring'}
 const d=figma.createEllipse();f.appendChild(d);d.resize(8,8);d.x=cx-4;d.y=cy-4;S(d,'fills',[VP(color,.7)]);d.name='source'}
 return f};
// markers ● ◐ — as drawn shapes (vector, no font dependency)
GP.mk=(par,kind,color,d=22)=>{const g=figma.createFrame();par.appendChild(g);g.name='mk/'+kind;g.fills=[];g.layoutMode='NONE';g.resize(d,d);g.clipsContent=false;
 if(kind==='none'){const l=figma.createRectangle();g.appendChild(l);l.resize(d*0.6,2);l.x=d*0.2;l.y=d/2-1;S(l,'fills',[VP(color,.7)]);return g}
 const e=figma.createEllipse();g.appendChild(e);e.resize(d,d);
 if(kind==='full'){S(e,'fills',[VP(color)])}
 else{e.fills=[];S(e,'strokes',[VP(color)]);e.strokeWeight=2;e.strokeAlign='INSIDE';const h=figma.createEllipse();g.appendChild(h);h.resize(d,d);S(h,'fills',[VP(color)]);h.arcData={startingAngle:Math.PI/2,endingAngle:Math.PI*1.5,innerRadius:0}}
 return g};
GP.img=async(par,name,w,h,o={})=>{const buf=await (await fetch('http://localhost:9230/'+name)).arrayBuffer();const im=figma.createImage(new Uint8Array(buf));const r=figma.createRectangle();par.appendChild(r);r.resize(w,h);r.fills=[{type:'IMAGE',imageHash:im.hash,scaleMode:o.mode||'FILL'}];r.name=o.name||name;if(o.r!==undefined)r.cornerRadius=o.r;return r};
GP.ic=(par,name,size=40,color='text/on-dark',sw)=>{const A=JSON.parse(figma.root.getSharedPluginData('x5r','icons_arena'));const svg=A[name];if(!svg)throw new Error('no icon '+name);const n=figma.createNodeFromSvg(svg);par.appendChild(n);n.name='icon/'+name;n.rescale(size/24);for(const v of n.findAll(x=>'strokes' in x)){if(v.strokes&&v.strokes.length){S(v,'strokes',[VP(color)]);if(sw)v.strokeWeight=sw}if(v.fills&&v.fills.length&&v.type!=='FRAME'){S(v,'fills',[VP(color)])}}return n};
GP.donut=(par,pct,size,color,track,sw=14)=>{const f=figma.createFrame();par.appendChild(f);f.name='donut';f.fills=[];f.resize(size,size);f.layoutMode='NONE';f.clipsContent=false;const t=figma.createEllipse();f.appendChild(t);t.resize(size,size);t.fills=[];S(t,'strokes',[VP(track)]);t.strokeWeight=sw;t.strokeAlign='INSIDE';const a=figma.createEllipse();f.appendChild(a);a.resize(size,size);a.fills=[];S(a,'strokes',[VP(color)]);a.strokeWeight=sw;a.strokeAlign='INSIDE';a.arcData={startingAngle:-Math.PI/2,endingAngle:-Math.PI/2+2*Math.PI*pct/100,innerRadius:1-(sw*2/size)};
 // arc as stroked ring: use fill instead
 a.strokes=[];S(a,'fills',[VP(color)]);t.strokes=[];t.arcData={startingAngle:0,endingAngle:2*Math.PI,innerRadius:1-(sw*2/size)};S(t,'fills',[VP(track)]);return f};
return GP;
