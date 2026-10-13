
const AF=Object.getPrototypeOf(async function(){}).constructor;
const L=await (new AF('figma',figma.root.getSharedPluginData('sparq','lib')))(figma);
const K=await (new AF('figma',figma.root.getSharedPluginData('sparq','lib2')))(figma);
const G={};const fmt=v=>String(v).replace('.',',');
const box=(par,name,w,h)=>{const f=figma.createFrame();f.name=name;f.resize(w,h);f.fills=[];f.clipsContent=false;if(par)par.appendChild(f);return f};
const tone=(i,acc)=>acc?null:[1,.72,.5,.34][Math.min(i,3)];
const rect=(f,x,y,w,h,acc,op=1,r=6)=>{const n=figma.createRectangle();f.appendChild(n);n.x=x;n.y=y;n.resize(Math.max(w,1),Math.max(h,1));n.cornerRadius=Math.min(r,w/2,h/2);if(acc){K.setV(n,'red');}else{K.setV(n,'white',op)}return n};
const neon=async n=>{}; /* no glow on data marks (client rule) */
const issues=[];
const T=async(f,s,st,col,op=1)=>await K.T(f,s,st,col,{op});
const fit=(t,w,align)=>{t.resize(Math.max(w,10),t.height);t.textAutoResize='HEIGHT';if(align)t.textAlignHorizontal=align;return t};
// ---------- bar-h
G.barH=async(par,o)=>{const {w,h,data}=o;const f=box(par,'chart/bar-h',w,h);const n=data.length;const max=o.max||Math.max(...data.map(d=>d.value));const narrow=w<520;
 const vals=[];for(const d of data){vals.push(await T(f,(o.pre||'')+fmt(d.value)+(o.suf||''),n<=6&&!narrow?'sparq/body-strong':'sparq/label',d.accent?'red':'td',d.accent?1:.95))}
 const vw=Math.max(...vals.map(v=>v.width));const labs=[];for(const d of data){labs.push(await T(f,d.label,'sparq/label','td',.78))}
 const rowH=h/n;
 if(!narrow){const lw=Math.min(Math.max(...labs.map(l=>l.width)),w*0.36);const x0=lw+24,avail=w-x0-16-vw;const th=Math.max(14,Math.min(64,rowH*0.62));
  for(let i=0;i<n;i++){const d=data[i],cy=rowH*i+rowH/2;const lb=fit(labs[i],lw,'RIGHT');lb.x=0;lb.y=cy-lb.height/2;if(lb.height>rowH-8)issues.push('bar-h: подпись «'+d.label+'» выше строки');
   const bw=Math.max(4,avail*d.value/max);const b=rect(f,x0,cy-th/2,bw,th,d.accent,tone(i%1,0)*(d.dim?.45:1),6);if(d.accent)await neon(b);const v=vals[i];v.x=x0+bw+16;v.y=cy-v.height/2;}}
 else{for(let i=0;i<n;i++){const d=data[i],y0=rowH*i;const lb=fit(labs[i],w);lb.x=0;lb.y=y0;const th=Math.max(12,Math.min(36,rowH-lb.height-28));const avail=w-vw-20;const bw=Math.max(4,avail*d.value/max);const b=rect(f,0,lb.y+lb.height+14,bw,th,d.accent,1,6);if(d.accent)await neon(b);const v=vals[i];v.x=bw+16;v.y=b.y+th/2-v.height/2;if(lb.height+14+Math.max(th,v.height)>rowH-6)issues.push('bar-h узкий: строка «'+d.label+'» тесная');}}
 return f};
// ---------- bar-v
G.barV=async(par,o)=>{const {w,h,data}=o;const f=box(par,'chart/bar-v',w,h);const n=data.length;const max=o.max||Math.max(...data.map(d=>d.value));const g=o.gap??0.38;const cw=w/(n+(n-1)*g),gw=cw*g;
 const vst=cw>=150&&n<=5?'sparq/number-s':(cw>=90?'sparq/body-strong':'sparq/label');
 const labs=[],vals=[];for(const d of data){const lb=fit(await T(f,d.label,'sparq/label','td',.78),cw+gw*0.8,'CENTER');labs.push(lb);vals.push(await T(f,(o.pre||'')+fmt(d.value)+(o.suf||''),vst,d.accent?'red':'td'))}
 const lh=Math.max(...labs.map(l=>l.height)),vh=Math.max(...vals.map(v=>v.height));const base=h-lh-16;const plot=base-vh-12;
 for(let i=0;i<n;i++){const d=data[i],x=i*(cw+gw);const bh=Math.max(4,plot*d.value/max);const b=rect(f,x,base-bh,cw,bh,d.accent,d.dim?.4:(d.op??1),Math.min(14,cw/4));b.bottomLeftRadius=0;b.bottomRightRadius=0;if(d.accent)await neon(b);
  const v=vals[i];v.x=x+cw/2-v.width/2;v.y=base-bh-12-v.height;if(v.width>cw+gw-8)issues.push('bar-v: значение «'+v.characters+'» шире колонки');const lb=labs[i];lb.x=x+cw/2-lb.width/2;lb.y=base+16;}
 const ax=L.ln(f,0,base,w,base,'#FFFFFF',.35,2);ax.name='baseline';return f};
// ---------- stacked 100%
G.stack=async(par,o)=>{const {w,h,parts}=o;const f=box(par,'chart/stack-100',w,h);const tot=parts.reduce((a,p)=>a+p.value,0);
 const vals=[],labs=[];for(const p of parts){vals.push(await T(f,fmt(p.value)+(o.suf||' %'),'sparq/number-s',p.accent?'red':'td'));labs.push(await T(f,p.label,'sparq/label','td',.78))}
 const lh=Math.max(...labs.map(l=>l.height)),vh=Math.max(...vals.map(v=>v.height));const bh=Math.max(48,Math.min(h-vh-lh-40,160));const by=vh+16;let x=0;const g=6;
 for(let i=0;i<parts.length;i++){const p=parts[i];const sw=(w-g*(parts.length-1))*p.value/tot;const b=rect(f,x,by,sw,bh,p.accent,[1,.62,.36,.22,.12][i%5],10);if(p.accent)await neon(b);
  const v=vals[i],lb=labs[i];const cw=Math.max(sw,10);fit(lb,Math.max(cw,160));v.x=x;v.y=0;lb.x=x;lb.y=by+bh+16;if(v.width>sw+g&&i<parts.length-1)issues.push('stack: значение «'+v.characters+'» шире сегмента');x+=sw+g;}
 // de-overlap labels/values left->right
 for(const arr of [vals,labs]){for(let i=1;i<arr.length;i++){const p=arr[i-1],c=arr[i];if(c.x<p.x+p.width+16){c.x=p.x+p.width+16}}const last=arr[arr.length-1];if(last.x+last.width>w){const d=last.x+last.width-w;for(let i=arr.length-1;i>=0;i--){arr[i].x-=d;if(i>0&&arr[i].x>=arr[i-1].x+arr[i-1].width+16)break}}}
 return f};
// ---------- line
G.line=async(par,o)=>{const {w,h,x:xs,series}=o;const f=box(par,'chart/line',w,h);const all=series.flatMap(s=>s.values);const max=(o.max||Math.max(...all))*1.08,min=o.min??0;
 const ends=[];for(const s of series){const v=await T(f,(o.pre||'')+fmt(s.values[s.values.length-1])+(o.suf||''),'sparq/number-s',s.accent?'red':'td',s.accent?1:.8);const nm=await T(f,s.name,'sparq/label','td',.7);ends.push({s,v,nm})}
 const ew=Math.max(...ends.map(e=>Math.max(e.v.width,e.nm.width)));const x1=w-ew-24;
 const xl=[];for(const t of xs){xl.push(await T(f,String(t),'sparq/label','td',.6))}const xh=xl[0].height;const y1=h-xh-16,y0=8;
 const X=i=>i*(x1)/(xs.length-1),Y=v=>y1-(v-min)/(max-min)*(y1-y0);
 L.ln(f,0,y1,x1,y1,'#FFFFFF',.3,2);
 const tw=xl.reduce((a,t)=>a+t.width,0);const step=Math.max(1,Math.ceil((tw+xs.length*24)/x1));
 xl.forEach((t,i)=>{if(i%step&&i!==xs.length-1){t.remove();return}t.x=Math.min(Math.max(0,X(i)-t.width/2),x1-t.width);t.y=y1+16;});
 {const kept=xl.filter(t=>!t.removed&&t.parent);for(let k=1;k<kept.length;k++){const p=kept[k-1],c=kept[k];if(!p.parent)continue;if(c.x<p.x+p.width+16){if(k===kept.length-1){p.remove()}else{c.remove();kept[k]=p}}}}
 for(const s of series){const pts=s.values.map((v,i)=>[X(i),Y(v)]);const d='M '+pts.map(p=>p[0]+' '+p[1]).join(' L ');
  if(s.accent&&o.area){const a=L.path(f,d+' L '+pts[pts.length-1][0]+' '+y1+' L 0 '+y1+' Z',null,1,0,L.LG([[0,'#FF2A2A',.35],[1,'#FF2A2A',0]],90));a.name='area'}
  const p=L.path(f,d,s.accent?'#FF2A2A':'#FFFFFF',s.accent?1:.55,s.accent?5:3);if(s.accent)await neon(p);
  const lp=pts[pts.length-1];const dot=L.el(f,lp[0]-8,lp[1]-8,16,16,[s.accent?L.P('#FF2A2A'):L.P('#FFFFFF',.8)]);if(s.accent)await neon(dot);}
 // end labels with collision avoidance
 const items=ends.map(e=>({...e,h:e.v.height+e.nm.height+2,c:Y(e.s.values[e.s.values.length-1])})).sort((a,b)=>a.c-b.c);let prev=-1e9;
 for(const it of items){it.t=Math.max(it.c-it.v.height/2,prev+12);prev=it.t+it.h}const over=prev-(y1-8);if(over>0)items.forEach(it=>it.t-=over);if(items.length&&items[0].t<0){const d=-items[0].t;items.forEach(it=>it.t+=d)}
 for(const it of items){it.v.x=x1+24;it.v.y=it.t;it.nm.x=x1+24;it.nm.y=it.t+it.v.height+2;}
 if(o.first&&w>=520){const fv=await T(f,(o.pre||'')+fmt(series[0].values[0])+(o.suf||''),'sparq/label','td',.8);fv.x=0;fv.y=Y(series[0].values[0])-fv.height-12;}
 return f};
// ---------- donut
G.donut=async(par,o)=>{const {w,h,data}=o;const f=box(par,'chart/donut',w,h);const tot=data.reduce((a,d)=>a+d.value,0);const narrow=w<620;
 const rows=[];for(const d of data){const r=K.AL(f,'legend','HORIZONTAL',{gap:16,align:'CENTER'});const sw=figma.createEllipse();sw.resize(20,20);r.appendChild(sw);if(d.accent)K.setV(sw,'red');else K.setV(sw,'white',[1,.62,.36,.22,.12][rows.length%5]);
  const v=await K.T(r,fmt(d.value)+(o.suf||' %'),'sparq/body-strong',d.accent?'red':'td');const lb=await K.T(r,d.label,'sparq/label','td',{op:.78});rows.push(r)}
 const lgW=Math.max(...rows.map(r=>r.width)),lgH=rows.reduce((a,r)=>a+r.height,0)+(rows.length-1)*16;
 if(narrow){for(const r of rows){r.primaryAxisSizingMode='FIXED';r.resize(w,r.height);const lb=r.children[2];lb.layoutSizingHorizontal='FILL';lb.textAutoResize='HEIGHT';}}
 let D,cx,cy;const lgH2=rows.reduce((a,r)=>a+r.height,0)+(rows.length-1)*16;if(!narrow){D=Math.min(h,w-lgW-48);cx=D/2;cy=h/2;let y=h/2-lgH/2;for(const r of rows){r.x=D+48;r.y=y;y+=r.height+16}}else{D=Math.min(w,h-lgH2-32);cx=w/2;cy=D/2;let y=D+32;for(const r of rows){r.x=0;r.y=y;y+=r.height+16}}
 let a=-90;const gap=1.6;let i=0;for(const d of data){const sweep=360*d.value/tot;const e=L.arc(f,cx,cy,D/2,D/2*0.36,a+gap/2,a+sweep-gap/2,[d.accent?L.P('#FF2A2A'):L.P('#FFFFFF',[1,.62,.36,.22,.12][i%5])]);if(d.accent)await neon(e);a+=sweep;i++}
 if(o.center){const cv=await T(f,o.center.value,D>=520?'sparq/number':(D>=300?'sparq/number-s':'sparq/body-strong'),'td');if(D<240)o.center.label='';const cl=await T(f,o.center.label,'sparq/label','td',.7);fit(cl,D*0.55,'CENTER');cv.x=cx-cv.width/2;cl.x=cx-cl.width/2;const hh=cv.height+4+cl.height;cv.y=cy-hh/2;cl.y=cv.y+cv.height+4;if(cv.width>D*0.6)issues.push('donut: центр шире дырки');}
 return f};
// ---------- timeline
G.timeline=async(par,o)=>{const {w,h,events}=o;const f=box(par,'chart/timeline',w,h);const n=events.length;const vertical=w<620;
 if(!vertical){const ay=h/2;L.ln(f,0,ay,w,ay,'#FFFFFF',.3,2);let xs=o.even||!events.every(e=>typeof e.t==='number')?events.map((e,i)=>24+i*(w-48)/(n-1)):(()=>{const t0=Math.min(...events.map(e=>e.t)),t1=Math.max(...events.map(e=>e.t));return events.map(e=>24+(e.t-t0)/(t1-t0)*(w-48))})();
  {const sg=[];for(let i=2;i<n;i++)sg.push(xs[i]-xs[i-2]);if(sg.length&&Math.min(...sg)<240){for(let i=0;i<n;i++)xs[i]=24+i*(w-48)/(n-1)}}
  const dots=[];for(let i=0;i<n;i++){const e=events[i],x=xs[i];const dot=L.el(f,x-10,ay-10,20,20,e.accent?[L.P('#FF2A2A')]:[K.VP('bg')]);if(!e.accent){dot.strokes=[L.P('#FFFFFF')];dot.strokeWeight=3}else await neon(dot);}
  for(const side of [0,1]){const idx=events.map((e,i)=>i).filter(i=>i%2===side);const blks=[];for(const i of idx){const e=events[i];const blk=K.AL(f,'event','VERTICAL',{gap:6});await K.T(blk,e.date,'sparq/number-s',e.accent?'red':'td');const tx=await K.T(blk,e.label,'sparq/label','td',{op:.78});blks.push({i,blk,tx,x:xs[i]})}
   for(let k=0;k<blks.length;k++){const B=blks[k];B.bx=Math.max(0,B.x-12);}
   for(let k=blks.length-1;k>=0;k--){const B=blks[k];const lim=k<blks.length-1?blks[k+1].bx-24:w;let wd=Math.min(360,lim-B.bx);if(wd<160){B.bx=Math.max(0,lim-160);wd=lim-B.bx}B.wd=wd;}
   for(const B of blks){B.tx.resize(Math.max(100,B.wd),B.tx.height);B.tx.textAutoResize='HEIGHT';B.blk.x=B.bx;const up=side===0;B.blk.y=up?ay-36-B.blk.height:ay+36;L.ln(f,B.x,up?ay-12:ay+12,B.x,up?ay-24:ay+24,'#FFFFFF',.35,2);if(B.blk.y<0||B.blk.y+B.blk.height>h)issues.push('timeline: «'+events[B.i].date+'» не влезает по высоте');}}}
 else{const ax=10;L.ln(f,ax,0,ax,h,'#FFFFFF',.3,2);const step=h/n;for(let i=0;i<n;i++){const e=events[i];const blk=K.AL(f,'event','VERTICAL',{gap:4});await K.T(blk,e.date,'sparq/number-s',e.accent?'red':'td');const tx=await K.T(blk,e.label,'sparq/label','td',{op:.78});tx.resize(w-48,tx.height);tx.textAutoResize='HEIGHT';blk.x=48;blk.y=i*step;
   const dot=L.el(f,ax-10,blk.y+18,20,20,e.accent?[L.P('#FF2A2A')]:[K.VP('bg')]);if(!e.accent){dot.strokes=[L.P('#FFFFFF')];dot.strokeWeight=3}else await neon(dot);if(blk.height>step-12)issues.push('timeline верт.: «'+e.date+'» тесно');}}
 return f};
// ---------- scale contrast
G.scale=async(par,o)=>{const {w,h,a,b}=o;const f=box(par,'chart/scale',w,h);const ratio=Math.round(a.value/b.value);
 const badge=K.AL(f,'ratio','HORIZONTAL',{pad:[12,28,12,28],r:999});badge.strokes=[L.P('#FF2A2A')];badge.strokeWeight=2;await neon(badge);await K.T(badge,o.ratioText||('в '+ratio+' раз'),'sparq/body-strong','td');
 const rows=[a,b];const top=badge.height+32;const rh=(h-top)/2;
 for(let i=0;i<2;i++){const d=rows[i];const y0=top+i*rh;const v=await T(f,d.text,'sparq/number-s',i===0?'td':'red');const lb=await T(f,d.label,'sparq/label','td',.78);const lw=w;v.x=0;v.y=y0;lb.x=v.width+20;lb.y=y0+v.height-lb.height-4;
  const bw=Math.max(8,w*d.value/a.value);const th=Math.min(48,rh-v.height-28);const r=rect(f,0,y0+v.height+12,bw,th,i===1,i===0?.9:1,6);if(i===1)await neon(r);if(lb.x+lb.width>w)fit(lb,w-lb.x);}
 badge.x=w-badge.width;badge.y=0;return f};
return {G,issues,box};