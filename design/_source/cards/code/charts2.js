
const AF=Object.getPrototypeOf(async function(){}).constructor;
const base=await (new AF('figma',figma.root.getSharedPluginData('sparq','charts')))(figma);const {G,issues,box}=base;
const L=await (new AF('figma',figma.root.getSharedPluginData('sparq','lib')))(figma);
const K=await (new AF('figma',figma.root.getSharedPluginData('sparq','lib2')))(figma);
const fmt=v=>String(v).replace('.',',');const T=async(f,s,st,col,op=1)=>await K.T(f,s,st,col,{op});
const fit=(t,w,al)=>{t.resize(Math.max(w,10),t.height);t.textAutoResize='HEIGHT';if(al)t.textAlignHorizontal=al;return t};
const neon=async n=>{await K.fx(n,'neon')};const W=(op)=>L.P('#FFFFFF',op);const R=()=>L.P('#FF2A2A');
const stackLabels=(labs,y0,y1,gap=12)=>{let prev=-1e9;for(const l of labs){l.t=Math.max(l.c-l.h/2,prev+gap,y0);prev=l.t+l.h}let over=prev-y1;if(over>0){for(let i=labs.length-1;i>=0&&over>0;i--){labs[i].t-=over;if(i>0){const g=labs[i].t-(labs[i-1].t+labs[i-1].h)-gap;over=g<0?-g:0}}}};
// sankey
G.sankey=async(par,o)=>{const {w,h,src,dst,flows}=o;const f=box(par,'chart/sankey',w,h);const tot=src.reduce((a,s)=>a+s.v,0);const gapR=34,gapL=70,nw=14;
 const sl=[];for(const s of src){const v=await T(f,fmt(s.v),'sparq/number-s',s.accent?'red':'td');const n=await T(f,s.n,'sparq/label','td',.75);sl.push({v,n})}
 const lw=Math.max(...sl.map(x=>Math.max(x.v.width,x.n.width)));const xL=lw+28;
 const compact=h<520;const dl=[];for(const d of dst){const v=await T(f,fmt(d.v),'sparq/body-strong','td');const n=await T(f,d.n,'sparq/label','td',.75);dl.push({v,n})}
 const rw=compact?Math.min(420,Math.max(...dl.map(x=>x.v.width+14+x.n.width))):Math.min(300,Math.max(...dl.map(x=>Math.max(x.v.width,x.n.width))));const xR=w-rw-24-nw;
 const k=(h-gapR*(dst.length-1))/tot;let y=0;src.forEach(s=>{s.h=s.v*k});const lh=src.reduce((a,s)=>a+s.h,0)+gapL*(src.length-1);y=(h-lh)/2;src.forEach(s=>{s.y=y;s.cur=y;y+=s.h+gapL});
 y=0;dst.forEach(d=>{d.h=Math.max(d.v*k,4);d.y=y;d.cur=y;y+=d.h+gapR});
 for(const [a,b,v] of flows){const S=src[a],D=dst[b],hh=Math.max(v*k,4);const sy=S.cur,dy=D.cur;S.cur+=v*k;D.cur+=hh;const mx=(xL+nw+xR)/2;const p=L.path(f,'M '+(xL+nw)+' '+sy+' C '+mx+' '+sy+' '+mx+' '+dy+' '+xR+' '+dy+' L '+xR+' '+(dy+hh)+' C '+mx+' '+(dy+hh)+' '+mx+' '+(sy+hh)+' '+(xL+nw)+' '+(sy+hh)+' Z',null,1,0,S.accent?L.P('#FF2A2A',.42):W(.26));p.name='flow'}
 for(let i=0;i<src.length;i++){const S=src[i];const r=L.rc(f,xL,S.y,nw,S.h,[S.accent?R():W(1)]);if(S.accent)await neon(r);const {v,n}=sl[i];const bh=v.height+4+n.height;v.x=0;n.x=0;v.y=S.y+S.h/2-bh/2;n.y=v.y+v.height+4;}
 const labs=[];for(let i=0;i<dst.length;i++){const D=dst[i];L.rc(f,xR,D.y,nw,D.h,[W(.9)]);const {v,n}=dl[i];fit(n,rw);labs.push({v,n,h:v.height+2+n.height,c:D.y+D.h/2})}
 if(compact){for(const l of labs){l.n.textAutoResize='WIDTH_AND_HEIGHT';const room=w-(xR+nw+24)-l.v.width-14;if(l.n.width>room)fit(l.n,room);l.h=Math.max(l.v.height,l.n.height)}}stackLabels(labs,0,h);if(labs.length&&labs[0].t<0){const d=-labs[0].t;labs.forEach(l=>l.t+=d)}for(const l of labs){l.v.x=xR+nw+24;l.v.y=l.t;if(compact){l.n.x=l.v.x+l.v.width+14;if(l.n.x+l.n.width>w){fit(l.n,w-l.n.x)}l.n.y=l.t+Math.max(0,(l.v.height-l.n.height)/2)}else{l.n.x=xR+nw+24;l.n.y=l.t+l.v.height+2}}
 return f};
// pyramid
G.pyramid=async(par,o)=>{const {w,h,tiers}=o;const f=box(par,'chart/pyramid',w,h);const n=tiers.length,gap=16;const pw=Math.min(w*0.5,h*1.1);const th=(h-gap*(n-1))/n;const cx=pw/2;
 for(let i=0;i<n;i++){const t=tiers[i];const ty=i*(th+gap);const wt=pw*(ty)/h,wb=pw*(ty+th)/h;const p=L.path(f,'M '+(cx-wt/2)+' '+ty+' L '+(cx+wt/2)+' '+ty+' L '+(cx+wb/2)+' '+(ty+th)+' L '+(cx-wb/2)+' '+(ty+th)+' Z',null,1,0,t.accent?R():W([.9,.6,.38,.24][i%4]));if(t.accent)await neon(p);
  const num=await T(f,t.n,th>=110?'sparq/number':'sparq/number-s',t.accent||i>=2?'td':'tl');num.x=cx-num.width/2;num.y=ty+th-num.height-Math.max(4,th*0.06);
  const lx=pw+56;const a=await T(f,t.t,'sparq/body-strong','td');const b=await T(f,t.cs,'sparq/label','td',.75);fit(a,w-lx);fit(b,w-lx);const hh=a.height+6+b.height;a.x=b.x=lx;a.y=ty+th/2-hh/2;b.y=a.y+a.height+6;
  const edge=cx+(wt+wb)/4;L.ln(f,edge+20,ty+th/2,lx-20,ty+th/2,'#FFFFFF',.3,2);if(hh>th+gap)issues.push('pyramid: подпись яруса «'+t.t+'» выше яруса');}
 return f};
// funnel
G.funnel=async(par,o)=>{const {w,h,stages}=o;const f=box(par,'chart/funnel',w,h);const n=stages.length,gap=14;const max=Math.max(...stages.map(s=>s.v));const fw=Math.min(w*0.58,w-440);const sh=(h-gap*(n-1))/n;
 for(let i=0;i<n;i++){const s=stages[i];const y=i*(sh+gap);const bw=Math.max(sh*1.2,fw*s.v/max);const x=(fw-bw)/2;const r=L.rc(f,x,y,bw,sh,[s.accent?R():W([1,.7,.45,.3][i%4])],Math.min(16,sh/3));if(s.accent)await neon(r);
  const v=await T(f,fmt(s.v),sh>=90?'sparq/number-s':'sparq/body-strong',s.accent||i>=2?'td':'tl');v.x=fw/2-v.width/2;v.y=y+sh/2-v.height/2;
  const lb=await T(f,s.label,sh<100?'sparq/body-dense':'sparq/body','td',.9);fit(lb,w-fw-48);lb.x=fw+48;lb.y=y+sh/2-lb.height/2;if(lb.height>sh)issues.push('funnel: подпись «'+s.label+'» выше ступени');}
 return f};
// waffle
G.waffle=async(par,o)=>{const {w,h,value}=o;const f=box(par,'chart/waffle',w,h);const narrow=w<620;const g=narrow?6:8;
 const hero=await T(f,fmt(value)+' %','sparq/number','red');const desc=await T(f,o.label,'sparq/body','td',.92);const leg=await T(f,'1 квадрат = 1 %','sparq/note','td',.6);
 let side,ox,oy;if(!narrow){side=Math.min(h,w-hero.width-56);ox=w-side;oy=(h-side)/2;const hw=ox-48;fit(desc,hw);hero.x=0;hero.y=oy;desc.x=0;desc.y=hero.y+hero.height+12;leg.x=0;leg.y=oy+side-leg.height;if(hero.width>hw)issues.push('waffle: герой шире колонки');}
 else{fit(desc,w);const tH=hero.height+12+desc.height+24;side=Math.min(w,h-tH-leg.height-16);ox=(w-side)/2;oy=0;hero.x=0;hero.y=side+24;desc.x=0;desc.y=hero.y+hero.height+12;leg.x=0;leg.y=desc.y+desc.height+16;}
 const cell=(side-9*g)/10;for(let i=0;i<100;i++){const r=Math.floor(i/10),c=i%10;const x=ox+c*(cell+g),y=oy+r*(cell+g);L.rc(f,x,y,cell,cell,[W(.13)],Math.min(6,cell/5));
  if(i<Math.floor(value))L.rc(f,x,y,cell,cell,[R()],Math.min(6,cell/5));else if(i===Math.floor(value)&&value%1)L.rc(f,x,y,cell*(value%1),cell,[R()],Math.min(6,cell/5));}
 return f};
// treemap (slice by sum halves)
G.treemap=async(par,o)=>{const {w,h,items}=o;const f=box(par,'chart/treemap',w,h);const g=10;const sorted=items.slice().sort((a,b)=>b.v-a.v);
 const lay=(arr,x,y,ww,hh)=>{if(arr.length===1){arr[0].r=[x,y,ww,hh];return}const tot=arr.reduce((a,b)=>a+b.v,0);let acc=0,k=0;while(k<arr.length-1&&acc+arr[k].v<=tot/2){acc+=arr[k].v;k++}if(k===0){acc=arr[0].v;k=1}const A=arr.slice(0,k),B=arr.slice(k);const fr=acc/tot;
  if(ww>=hh){const w1=(ww-g)*fr;lay(A,x,y,w1,hh);lay(B,x+w1+g,y,ww-w1-g,hh)}else{const h1=(hh-g)*fr;lay(A,x,y,ww,h1);lay(B,x,y+h1+g,ww,hh-h1-g)}};
 const wordsFit=async(txt,maxW)=>{for(const wd of txt.split(/\s+/)){const t=await T(f,wd,'sparq/label','td');const ww=t.width;t.remove();if(ww>maxW)return false}return true};
 lay(sorted,0,0,w,h);const bad=[];for(const it of sorted){if(!(await wordsFit(it.label,it.r[2]-48))||it.r[3]<170)bad.push(it)}
 let legH=0;if(bad.length){legH=bad.length*(w<620?90:44)+16;lay(sorted,0,0,w,h-legH);}
 let i=0;for(const it of sorted){const [x,y,ww,hh]=it.r;const fill=it.accent?R():W([1,.62,.36,.22,.14][i%5]);it.fill=fill;const dark=!it.accent&&i<2;const r=L.rc(f,x,y,ww,hh,[fill],16);if(it.accent)await neon(r);
  const v=await T(f,fmt(it.v),ww>=260&&hh>=180?'sparq/number-s':'sparq/body-strong',dark?'tl':'td');v.x=x+24;v.y=y+24;if(!bad.includes(it)){const lb=await T(f,it.label,'sparq/label',dark?'tl':'td',.85);fit(lb,ww-48);lb.x=x+24;lb.y=v.y+v.height+8;if(lb.y+lb.height>y+hh-16)issues.push('treemap: «'+it.label+'» не влезает в плитку')}if(v.width>ww-32)issues.push('treemap: значение шире плитки');i++}
 if(bad.length){let ly=h-legH+16;for(const it of bad){const sw=L.rc(f,0,ly+6,20,20,[it.fill],4);const row=await T(f,fmt(it.v)+' — '+it.label,'sparq/label','td',.85);fit(row,w-36);row.x=36;row.y=ly;ly+=row.height+10}}
 return f};
// flow 2->1
G.flow=async(par,o)=>{const {w,h,inputs,output}=o;const f=box(par,'chart/flow',w,h);
 const boxN=async(x,y,bw,bh,a,b,acc)=>{const r=L.rc(f,x,y,bw,bh,acc?[K.VP('bg')]:[W(.06)],24);r.strokes=[acc?R():W(.4)];r.strokeWeight=acc?3:1.5;if(acc)await neon(r);const t1=await T(f,a,'sparq/body-strong','td');const t2=b?await T(f,b,'sparq/label','td',.72):null;fit(t1,bw-56);if(t2)fit(t2,bw-56);const hh=t1.height+(t2?6+t2.height:0);t1.x=x+28;t1.y=y+bh/2-hh/2;if(t2){t2.x=x+28;t2.y=t1.y+t1.height+6}};
 const n=inputs.length;const bw=Math.min(340,w*0.36),bh=Math.min(140,(h-24*(n-1))/n);const ys=inputs.map((_,i)=>i*(h-bh)/(Math.max(1,n-1)));if(n===1)ys[0]=(h-bh)/2;
 for(let i=0;i<n;i++)await boxN(0,ys[i],bw,bh,inputs[i].a,inputs[i].b,false);
 const ow=Math.min(380,w*0.38),oh=Math.min(170,h*0.5);const ox=w-ow,oy=h/2-oh/2;await boxN(ox,oy,ow,oh,output.a,output.b,true);
 const bx=bw+(ox-bw)*0.45;const mid=h/2;for(const y of ys)L.path(f,'M '+(bw+16)+' '+(y+bh/2)+' L '+bx+' '+(y+bh/2)+' L '+bx+' '+mid,'#FFFFFF',.6,3);
 L.path(f,'M '+(bx+24)+' '+mid+' L '+(ox-34)+' '+mid,'#FFFFFF',.6,3);L.path(f,'M '+(ox-38)+' '+(mid-11)+' L '+(ox-16)+' '+mid+' L '+(ox-38)+' '+(mid+11)+' Z',null,1,0,W(.6));
 const pl=L.el(f,bx-22,mid-22,44,44,[K.VP('bg')]);pl.strokes=[W(.6)];pl.strokeWeight=3;const plus=await T(f,'+','sparq/body-strong','td');plus.x=bx-plus.width/2;plus.y=mid-plus.height/2;
 if(o.caption){const cp=await T(f,o.caption,'sparq/note','td',.7);fit(cp,ow);cp.x=ox;cp.y=oy+oh+16;if(cp.y+cp.height>h)cp.y=oy-16-cp.height;}
 return f};
// chain
G.chain=async(par,o)=>{const {w,h,cols}=o;const f=box(par,'chart/chain',w,h);const nc=cols.length,cg=40;const cw=(w-cg*(nc-1))/nc;
 for(let i=0;i<nc;i++){const col=cols[i];const x=i*(cw+cg);const hd=await T(f,col.name,'sparq/number-s',col.accent?'red':'td');hd.x=x;hd.y=0;const n=col.steps.length,gp=28;const top=hd.height+20;const bh=Math.min(170,(h-top-gp*(n-1))/n);
  for(let j=0;j<n;j++){const s=col.steps[j];const y=top+j*(bh+gp);const r=L.rc(f,x,y,cw,bh,s.ok?[W(.08)]:[],20);r.strokes=[s.ok?W(.3):R()];r.strokeWeight=s.ok?1.5:2.5;if(!s.ok){r.dashPattern=[12,10];}
   const a=await T(f,s.a,'sparq/body-dense-strong',s.ok?'td':'red');fit(a,cw-56);let hh=a.height;let b;if(s.b){b=await T(f,s.b,'sparq/label','td',.72);fit(b,cw-56);hh+=4+b.height}a.x=x+28;a.y=y+bh/2-hh/2;if(b){b.x=x+28;b.y=a.y+a.height+4}
   if(hh>bh-24)issues.push('chain: «'+s.a+'» тесно');if(j<n-1)L.ln(f,x+44,y+bh+8,x+44,y+bh+gp-8,s.ok&&col.steps[j+1].ok?'#FFFFFF':'#FF2A2A',.6,3);}}
 return f};
// hub
G.hub=async(par,o)=>{const {w,h,center,nodes}=o;const f=box(par,'chart/hub',w,h);const cx=w/2,cy=h/2;const R0=Math.min(130,h*0.2);
 const c=L.el(f,cx-R0,cy-R0,2*R0,2*R0,[R()]);await neon(c);const ring=L.el(f,cx-R0-16,cy-R0-16,2*R0+32,2*R0+32,[]);ring.strokes=[L.P('#FF2A2A',.5)];ring.strokeWeight=2;
 const a=await T(f,center.a,'sparq/number-s','td');const b=await T(f,center.b,'sparq/label','td');fit(b,2*R0-24,'CENTER');a.x=cx-a.width/2;b.x=cx-b.width/2;const hh=a.height+4+b.height;a.y=cy-hh/2;b.y=a.y+a.height+4;
 const n=nodes.length,half=Math.ceil(n/2);const tw=Math.min(320,(w-2*R0)/2-80);
 for(let i=0;i<n;i++){const left=i<half;const k=left?i:i-half;const cnt=left?half:n-half;const ry=cnt===1?cy:k*(h-1)/(cnt-1);const nd=nodes[i];
  const t1=await T(f,nd.a,'sparq/body-strong','td');const t2=await T(f,nd.b,'sparq/label','td',.7);fit(t1,tw,left?'RIGHT':'LEFT');fit(t2,tw,left?'RIGHT':'LEFT');const bh=t1.height+4+t2.height;let ty=Math.min(Math.max(ry-bh/2,0),h-bh);
  const tx=left?0:w-tw;t1.x=t2.x=tx;t1.y=ty;t2.y=ty+t1.height+4;const dx=left?tw+28:w-tw-28,dy=ty+bh/2;const dot=L.el(f,dx-8,dy-8,16,16,[W(1)]);
  const ang=Math.atan2(dy-cy,dx-cx);L.ln(f,cx+Math.cos(ang)*(R0+30),cy+Math.sin(ang)*(R0+30),dx-Math.cos(ang)*16,dy-Math.sin(ang)*16,'#FFFFFF',.35,2);}
 return f};
// matrix
G.matrix=async(par,o)=>{const {w,h}=o;const f=box(par,'chart/matrix',w,h);const ax=[];for(const t of [o.yl[0],o.yl[1],o.xl[0],o.xl[1]])ax.push(await T(f,t,'sparq/note','td',.7));
 const top=ax[0].height+16,bot=h-ax[1].height-16;const cx=w/2,cy=(top+bot)/2;L.ln(f,0,cy,w,cy,'#FFFFFF',.3,2);L.ln(f,cx,top,cx,bot,'#FFFFFF',.3,2);
 ax[0].x=cx-ax[0].width/2;ax[0].y=0;ax[1].x=cx-ax[1].width/2;ax[1].y=bot+16;ax[2].x=0;ax[2].y=cy+12;ax[3].x=w-ax[3].width;ax[3].y=cy+12;
 const qw=w/2-48,qh=(bot-top)/2-ax[2].height-36;
 for(const cl of o.clusters){const x0=cl.qx>0?cx+28:28,y0=cl.qy>0?cy+ax[2].height+28:top+20;const blk=K.AL(f,'cluster','VERTICAL',{pad:[24,28,24,28],r:28,gap:6});await K.glass(blk);if(cl.accent){blk.strokes=[R()];blk.strokeWeight=2.5}
  await K.T(blk,cl.big,'sparq/number-s','td');const r=await K.T(blk,cl.rest,'sparq/body','td',{op:.88});r.resize(Math.min(qw,520)-56,r.height);r.textAutoResize='HEIGHT';blk.x=x0;blk.y=y0;if(blk.height>qh+ax[2].height+20)issues.push('matrix: кластер «'+cl.big+'» выше четверти');}
 return f};
// ---------- v1.1 · формы из практики поста «Gemini 4» (без неона на марках данных)
// красный текст < 44 px — яркий #FF2A2A (переменная accent/primary тёмнее, 5:1 на чёрном не даёт)
const TR=async(f,s,st,col,op=1)=>{if(col!=='red')return await T(f,s,st,col,op);const t=await T(f,s,st,'td',op);t.fills=[R()];return t};
const RR=(f,x,y,w,h,acc,op=1,r=6)=>L.rc(f,x,y,Math.max(w,1),Math.max(h,1),[acc?R():W(op)],Math.min(r,w/2,h/2));
const dash=(f,x1,y,x2,hex,op=.6)=>{for(let x=x1;x<x2;x+=22)L.ln(f,x,y,Math.min(x+12,x2),y,hex,op,3)};
// strip: N одинаковых ячеек, часть выделена — «сколько раз повторяется блок»
G.strip=async(par,o)=>{const {w,h,count,accent=[],label}=o;const f=box(par,'chart/strip',w,h);const gap=10;const cols=o.cols||Math.min(count,14);const rows=Math.ceil(count/cols);const cw=(w-gap*(cols-1))/cols;const lb=label?await TR(f,label,'sparq/label','td',.85):null;const lh=lb?lb.height+20:0;const ch=Math.min(cw,(h-lh-gap*(rows-1))/rows);
 for(let i=0;i<count;i++){const r=Math.floor(i/cols),c=i%cols;RR(f,c*(cw+gap),r*(ch+gap),cw,ch,accent.includes(i),accent.includes(i)?1:.45,6)}
 if(lb){fit(lb,w);lb.x=0;lb.y=rows*(ch+gap)-gap+20;if(lb.y+lb.height>h+1)issues.push('strip: подпись не влезает')}
 if(ch<28)issues.push('strip: ячейки < 28 px — меньше count или cols');return f};
// areas: прямоугольники по сторонам (ширина × высота), одинаковая площадь = «столько же, но иначе»
G.areas=async(par,o)=>{const {w,h,items}=o;const f=box(par,'chart/areas',w,h);const n=items.length,gap=36;const cw=(w-gap*(n-1))/n;const maxW=Math.max(...items.map(i=>i.w)),maxH=Math.max(...items.map(i=>i.h));const heads=[],notes=[];
 for(const it of items){heads.push(await TR(f,it.label,'sparq/label',it.accent?'red':'td'));notes.push(it.note?await TR(f,it.note,'sparq/number-s',it.accent?'red':'td'):null)}
 const hh=Math.max(...heads.map(x=>x.height))+14,nh=Math.max(0,...notes.map(x=>x?x.height+10:0));const ph=h-hh-nh;
 items.forEach((it,i)=>{const x=i*(cw+gap),rw=cw*it.w/maxW,rh=ph*it.h/maxH;RR(f,x,hh+ph-rh,rw,rh,it.accent,it.accent?1:.5,10);fit(heads[i],cw);heads[i].x=x;heads[i].y=0;if(notes[i]){fit(notes[i],cw);notes[i].x=x;notes[i].y=hh+ph+10}});return f};
// steps: нумерованные шаги, замкнутые в круг (loop:true) — «как устроен цикл»
G.steps=async(par,o)=>{const {w,h,items,loop}=o;const f=box(par,'chart/steps',w,h);const n=items.length;const rowH=h/n;const lx=loop?72:0;const d=Math.min(56,rowH-14);
 const nums=[],txs=[];for(let i=0;i<n;i++){nums.push(await TR(f,String(i+1),'sparq/body-strong',items[i].accent?'ta':'td'));txs.push(await TR(f,items[i].text,'sparq/body',items[i].accent?'red':'td'))}
 for(let i=0;i<n;i++){const it=items[i],cy=rowH*i+rowH/2;L.el(f,lx,cy-d/2,d,d,it.accent?[R()]:[W(.18)]);const nn=nums[i];nn.x=lx+d/2-nn.width/2;nn.y=cy-nn.height/2;f.appendChild(nn);
  const tx=fit(txs[i],w-lx-d-28);tx.x=lx+d+24;tx.y=cy-tx.height/2;if(tx.height>rowH-6)issues.push('steps: шаг '+(i+1)+' выше строки');if(i<n-1)L.ln(f,lx+d/2,cy+d/2+4,lx+d/2,cy+rowH-d/2-4,'#FFFFFF',.3,2)}
 if(loop){const y0=rowH/2,y1=h-rowH/2,x=lx-36;L.ln(f,lx,y1,x,y1,'#FF2A2A',.9,3);L.ln(f,x,y1,x,y0,'#FF2A2A',.9,3);L.ln(f,x,y0,lx-4,y0,'#FF2A2A',.9,3);L.ln(f,lx-16,y0-9,lx-4,y0,'#FF2A2A',.9,3);L.ln(f,lx-16,y0+9,lx-4,y0,'#FF2A2A',.9,3)}return f};
// stepLine: ступенчатая линия «лучшее достигнутое» от нуля + пунктир порога
G.stepLine=async(par,o)=>{const {w,h,points,threshold,suf=''}=o;const f=box(par,'chart/step-line',w,h);const max=o.max||Math.max(...points.map(p=>p.v),threshold?threshold.value:0)*1.05;const pl=0,pb=64,pr=0,pt=40;const W0=w-pl-pr,H0=h-pb-pt;const t0=Math.min(...points.map(p=>p.t)),t1=Math.max(...points.map(p=>p.t));
 const X=t=>pl+(t-t0)/(t1-t0)*W0,Y=v=>pt+H0*(1-v/max);L.ln(f,0,pt+H0,w,pt+H0,'#FFFFFF',.35,2);
 for(let i=0;i<points.length;i++){const p=points[i],x=X(p.t),y=Y(p.v);const x2=i<points.length-1?X(points[i+1].t):x;L.ln(f,x,y,x2,y,'#FFFFFF',.9,4);if(i<points.length-1)L.ln(f,x2,y,x2,Y(points[i+1].v),'#FFFFFF',.9,4)}
 if(threshold){const y=Y(threshold.value);dash(f,0,y,w,'#FF2A2A',.85);const tl=await TR(f,threshold.label,'sparq/label','red');tl.x=8;tl.y=Math.max(0,y-tl.height-8)}
 for(let i=0;i<points.length;i++){const p=points[i];if(!p.label)continue;const x=X(p.t),y=Y(p.v);L.el(f,x-9,y-9,18,18,p.accent?[R()]:[W(1)]);const lb=await TR(f,p.label,'sparq/body-strong',p.accent?'red':'td');lb.x=Math.min(Math.max(0,x-lb.width/2),w-lb.width);lb.y=(p.below??(threshold&&p.v<threshold.value))?y+16:y-16-lb.height}
 for(const a of (o.axis||[])){const x=X(a.t);const lb=await TR(f,a.label,'sparq/label','td',.7);lb.x=Math.min(Math.max(0,x-lb.width/2),w-lb.width);lb.y=pt+H0+14}return f};
// reduction: полосы «было → стало»: закрашена оставшаяся доля, срезанная — контур; conditional → пунктир
G.reduction=async(par,o)=>{const {w,h,rows}=o;const f=box(par,'chart/reduction',w,h);const n=rows.length,rowH=h/n;const labs=[],vals=[];for(const r of rows){labs.push(await TR(f,r.label,'sparq/label','td',.85));vals.push(await TR(f,r.cutText||'−'+Math.round((1-r.to/r.from)*100)+' %','sparq/body-strong',r.accent?'red':'td'))}
 const lw=Math.min(Math.max(...labs.map(l=>l.width)),w*.34);const x0=lw+24;const bw=w-x0-170;const th=Math.max(20,Math.min(52,rowH*.5));
 for(let i=0;i<n;i++){const r=rows[i],cy=rowH*i+rowH/2;const lb=fit(labs[i],lw,'RIGHT');lb.x=0;lb.y=cy-lb.height/2;const kept=bw*r.to/r.from;
  RR(f,x0,cy-th/2,kept,th,r.accent,r.accent?1:.7,6);const cut=L.rc(f,x0+kept,cy-th/2,bw-kept,th,[],6);cut.strokes=[r.accent?R():W(.5)];cut.strokeWeight=2;if(r.conditional)cut.dashPattern=[8,6];
  vals[i].x=x0+bw+18;vals[i].y=cy-vals[i].height/2}return f};
return {G,issues,box};