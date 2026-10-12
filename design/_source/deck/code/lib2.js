
const {VP,S}=L;
const G={m:96,col:122,g:24};G.X=i=>G.m+i*(G.col+G.g);G.W=n=>n*G.col+(n-1)*G.g;
const L2={G};
L2.rect=(par,o)=>{const r=figma.createRectangle();par.appendChild(r);r.resize(Math.max(o.w,0.01),Math.max(o.h,0.01));r.x=o.x||0;r.y=o.y||0;if(o.fill)S(r,'fills',[VP(o.fill,o.op||1)]);else r.fills=[];if(o.stroke){S(r,'strokes',[VP(o.stroke,o.sop||1)]);r.strokeWeight=o.sw||1.5;r.strokeAlign='INSIDE';if(o.dash)r.dashPattern=o.dash}if(o.r!==undefined)r.cornerRadius=o.r;r.name=o.name||'rect';return r};
L2.path=(par,d,o={})=>{const v=figma.createVector();par.appendChild(v);v.vectorPaths=[{windingRule:'NONE',data:d}];if(o.fill){S(v,'fills',[VP(o.fill,o.fop||1)])}else v.fills=[];if(o.c!==null){S(v,'strokes',[VP(o.c||'text/on-dark-2',o.op||1)]);v.strokeWeight=o.w||2;v.strokeCap='ROUND';v.strokeJoin='ROUND';if(o.dash)v.dashPattern=o.dash}v.name=o.name||'path';return v};
L2.ell=async(par,x,y,d,o={})=>{const e=figma.createEllipse();par.appendChild(e);e.resize(d,o.h||d);e.x=x;e.y=y;if(o.fill)S(e,'fills',[VP(o.fill,o.fop||1)]);else e.fills=[];if(o.stroke){S(e,'strokes',[VP(o.stroke,o.sop||1)]);e.strokeWeight=o.sw||2;e.strokeAlign='INSIDE';if(o.dash)e.dashPattern=o.dash}if(o.fx)await e.setEffectStyleIdAsync(L.ES(o.fx).id);e.name=o.name||'ellipse';return e};
L2.arc=(cx,cy,r,a0,a1)=>{const pt=a=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];let d='';const n=Math.max(1,Math.ceil(Math.abs(a1-a0)/45));const step=(a1-a0)/n;for(let i=0;i<n;i++){const s=a0+i*step,e=s+step;const k=4/3*Math.tan((e-s)*Math.PI/180/4);const [x0,y0]=pt(s),[x1,y1]=pt(e);const t0=[-Math.sin(s*Math.PI/180),Math.cos(s*Math.PI/180)],t1=[-Math.sin(e*Math.PI/180),Math.cos(e*Math.PI/180)];if(i===0)d+='M '+x0+' '+y0;d+=' C '+(x0+k*r*t0[0])+' '+(y0+k*r*t0[1])+' '+(x1-k*r*t1[0])+' '+(y1-k*r*t1[1])+' '+x1+' '+y1}return d};
L2.pl=(pts)=>'M '+pts.map(p=>p[0]+' '+p[1]).join(' L ');
L2.hair=(par,x,y,w,o={})=>L2.rect(par,{x,y,w,h:o.h||1,fill:o.c||'line/on-dark',op:o.op||1,name:'hair'});
L2.vhair=(par,x,y,h,o={})=>L2.rect(par,{x,y,w:1,h,fill:o.c||'line/on-dark',op:o.op||1,name:'vhair'});
L2.reset=(slide)=>{slide.children.slice().forEach(c=>c.remove())};
L2.slide=(id)=>figma.getSlideGrid().flat().find(s=>s.id===id);L2.all=()=>figma.getSlideGrid().flat();
L2.frame=(par,o)=>L.box(par,o);

L2.mark=async(par,kind,x,y,d=20,c='text/on-dark')=>{
 if(kind==='now'){await L2.ell(par,x,y,d,{fill:c,name:'now'});}
 else if(kind==='mid'){await L2.ell(par,x,y,d,{stroke:c,sw:2,name:'mid'});const h=figma.createEllipse();par.appendChild(h);h.resize(d,d);h.x=x;h.y=y;L.S(h,'fills',[L.VP(c)]);h.arcData={startingAngle:Math.PI/2,endingAngle:Math.PI*1.5,innerRadius:0};h.name='mid-half';}
 else if(kind==='far'){await L2.ell(par,x,y,d,{stroke:c,sw:2,name:'far'});}
};
L2.arrow=(par,x,y,len,c='text/on-dark-3',w=1.5)=>{L2.path(par,L2.pl([[x,y],[x+len,y]]),{w,c});L2.path(par,L2.pl([[x+len-8,y-6],[x+len,y],[x+len-8,y+6]]),{w,c});};
L2.ketlabel=async(par,n,x,y,c='text/on-dark-3')=>L.txt(par,'|'+n+'⟩','label',c,{x,y});

L2.newSlide=()=>{const sl=figma.createSlide();const all=figma.currentPage.findAll(n=>n.type==='SLIDE');const g=figma.getSlideGrid()[0];const nw=all.filter(x=>!g.includes(x));figma.setSlideGrid([g.concat(nw)]);return sl};

L2.logo=(par,key,h=32,color='text/on-dark',o={})=>{const raw=figma.root.getSharedPluginData('x5r','logo_'+key);if(!raw)throw new Error('no logo '+key);
 let svg=raw.startsWith('S|')?'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="'+raw.slice(2)+'"/></svg>':raw;
 // measure
 const tmp=figma.createNodeFromSvg(svg);figma.currentPage.appendChild(tmp);
 const nb=tmp.absoluteBoundingBox;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const leaf=(x)=>{if('children' in x&&x.children.length){x.children.forEach(leaf);return}const q=x.absoluteBoundingBox;if(!q||q.width<=0||q.height<=0)return;x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x+q.width);y1=Math.max(y1,q.y+q.height)};leaf(tmp);
 const W=tmp.width,H=tmp.height;tmp.remove();
 const vbm=svg.match(/viewBox="([^"]+)"/);let vx=0,vy=0,vw=W,vh=H;if(vbm){[vx,vy,vw,vh]=vbm[1].split(/[\s,]+/).map(Number)}
 const k=W/vw;const nvx=vx+(x0-nb.x)/k,nvy=vy+(y0-nb.y)/k,nvw=(x1-x0)/k,nvh=(y1-y0)/k;
 svg=svg.replace(/\swidth="[^"]*"/,'').replace(/\sheight="[^"]*"/,'').replace(/\sviewBox="[^"]*"/,'');
 svg=svg.replace('<svg','<svg width="'+(x1-x0)+'" height="'+(y1-y0)+'" viewBox="'+nvx+' '+nvy+' '+nvw+' '+nvh+'"');
 const n=figma.createNodeFromSvg(svg);par.appendChild(n);n.name='logo/'+key;
 const walk=(x)=>{if(['VECTOR','ELLIPSE','RECTANGLE','POLYGON','STAR','BOOLEAN_OPERATION'].includes(x.type)){L.S(x,'fills',[L.VP(color,o.op||1)]);x.strokes=[]}if('children' in x)x.children.forEach(walk)};walk(n);
 n.rescale(h/n.height);
 if(o.x!==undefined){n.x=o.x;n.y=o.y}return n};
L2.HH={toshiba:18,aisin:22,magnit:26,vtb:24,beeline:24,rzd:28,dwave:30,fujitsu:26,bmw:34,mediamarkt:30,wellsfargo:30,fraunhofer:30,albertheijn:30,tesco:24};
L2.clearLogos=(c)=>{for(const n of c.children.slice())if(n.name.startsWith('logo/')||n.name==='wordmark')n.remove()};
L2.logoStrip=async(card,items,y,o={})=>{const pad=o.pad||28,gap=o.gap||24,right=o.right!==false;const ns=[];
 for(const it of items){let n;if(it.startsWith('t:')){n=await L.txt(card,it.slice(2),'body-s-strong','text/on-dark',{});n.letterSpacing={value:8,unit:'PERCENT'};n.name='wordmark'}else{n=L2.logo(card,it,L2.HH[it]||28,'text/on-dark',{op:.95})}ns.push(n)}
 const H=Math.max(...ns.map(n=>n.height));const tot=ns.reduce((a,n)=>a+n.width,0)+gap*(ns.length-1);let x=right?card.width-pad-tot:pad;
 for(const n of ns){n.x=x;n.y=y+(H-n.height)/2;x+=n.width+gap}};
L2.field=async(par,x,y,w,h,o={})=>{const f=L.box(par,{name:'field/interference',x,y,w,h});f.clipsContent=true;
 const cs=o.centers||[[w*0.32,h*0.55],[w*0.68,h*0.45]];const step=o.step||26,n=Math.ceil(Math.hypot(w,h)/step);
 for(const [cx,cy] of cs){for(let i=1;i<=n;i++){const r=i*step;const e=figma.createEllipse();f.appendChild(e);e.resize(r*2,r*2);e.x=cx-r;e.y=cy-r;e.fills=[];L.S(e,'strokes',[L.VP('text/on-dark',(o.op||0.16)*(1-i/(n*1.15)))]);e.strokeWeight=1;e.name='ring';}
  const d=figma.createEllipse();f.appendChild(d);d.resize(8,8);d.x=cx-4;d.y=cy-4;L.S(d,'fills',[L.VP('text/on-dark',.7)]);d.name='source';}
 return f};
L2.ket=async(par,txt,o={})=>{const size=o.size||56,sw=o.sw||4,col=o.color||'text/on-dark-3';
 const row=figma.createFrame();par.appendChild(row);row.name='ket';row.fills=[];row.layoutMode='HORIZONTAL';row.itemSpacing=o.gap||8;row.counterAxisAlignItems='CENTER';row.primaryAxisSizingMode='AUTO';row.counterAxisSizingMode='AUTO';
 const h=Math.round(size*1.0);
 const bar=figma.createRectangle();row.appendChild(bar);bar.resize(sw,h);L.S(bar,'fills',[L.VP(col)]);bar.cornerRadius=sw/2;bar.name='bra';
 const t=await L.txt(row,txt,o.style||'number-m',col,{});t.name='ket-text';
 const w=Math.round(h*0.34);const ang=figma.createVector();row.appendChild(ang);ang.vectorPaths=[{windingRule:'NONE',data:'M 0 0 L '+w+' '+(h/2)+' L 0 '+h}];ang.fills=[];L.S(ang,'strokes',[L.VP(col)]);ang.strokeWeight=sw;ang.strokeCap='ROUND';ang.strokeJoin='ROUND';ang.name='ket-angle';
 return row};
return L2;