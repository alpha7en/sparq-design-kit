
const H=h=>{h=h.replace('#','');return{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255}};
const P=(h,o=1)=>({type:'SOLID',color:H(h),opacity:o});
const RG=(stops,cx=.5,cy=.5,s=1)=>({type:'GRADIENT_RADIAL',gradientTransform:[[1/s,0,cx-0.5/s],[0,1/s,cy-0.5/s]],gradientStops:stops.map(([p,h,a])=>({position:p,color:{...H(h),a}}))});
const LG=(stops,angle=90)=>{const t=angle*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return{type:'GRADIENT_LINEAR',gradientTransform:[[c,s,0.5-0.5*c-0.5*s],[-s,c,0.5+0.5*s-0.5*c]],gradientStops:stops.map(([p,h,a])=>({position:p,color:{...H(h),a}}))}};
const styles={};for(const s of await figma.getLocalTextStylesAsync())styles[s.name]=s;
const fr=(par,name,w,h,x=0,y=0,fills=[])=>{const f=figma.createFrame();f.name=name;f.resize(w,h);f.x=x;f.y=y;f.fills=fills;f.clipsContent=true;if(par)par.appendChild(f);return f};
const rc=(par,x,y,w,h,fills,r=0)=>{const n=figma.createRectangle();n.resize(w,h);n.x=x;n.y=y;n.fills=fills;n.cornerRadius=r;par.appendChild(n);return n};
const el=(par,x,y,w,h,fills)=>{const n=figma.createEllipse();n.resize(w,h);n.x=x;n.y=y;n.fills=fills;par.appendChild(n);return n};
const arc=(par,cx,cy,r,th,a0,a1,fills)=>{const n=figma.createEllipse();n.resize(2*r,2*r);n.x=cx-r;n.y=cy-r;n.arcData={startingAngle:a0*Math.PI/180,endingAngle:a1*Math.PI/180,innerRadius:(r-th)/r};n.fills=fills;par.appendChild(n);return n};
const ln=(par,x1,y1,x2,y2,h,o=1,w=2)=>{const v=figma.createVector();v.vectorPaths=[{windingRule:'NONE',data:'M '+x1+' '+y1+' L '+x2+' '+y2}];v.strokes=[P(h,o)];v.strokeWeight=w;v.strokeCap='ROUND';v.fills=[];par.appendChild(v);return v};
const path=(par,d,h,o=1,w=2,fill)=>{const v=figma.createVector();v.vectorPaths=[{windingRule:'NONZERO',data:d}];v.strokes=h?[P(h,o)]:[];v.strokeWeight=w;v.strokeJoin='ROUND';v.strokeCap='ROUND';v.fills=fill?[fill]:[];par.appendChild(v);return v};
const tx=async(par,s,st,h,x,y,w,o=1)=>{const t=figma.createText();const S=styles[st];await figma.loadFontAsync(S.fontName);await t.setTextStyleIdAsync(S.id);t.characters=s;t.fills=[P(h,o)];par.appendChild(t);t.x=x;t.y=y;if(w){t.resize(w,t.height);t.textAutoResize='HEIGHT'}return t};
const bold=async(t,word,st='sparq/body-strong')=>{const i=t.characters.indexOf(word);if(i<0)return;const S=styles[st];await figma.loadFontAsync(S.fontName);t.setRangeFontName(i,i+word.length,S.fontName)};
const glow=(n,h,r,a=.8,sp=0)=>{n.effects=[...(n.effects||[]),{type:'DROP_SHADOW',color:{...H(h),a},offset:{x:0,y:0},radius:r,spread:sp,visible:true,blendMode:'NORMAL'}]};
const blur=(n,r)=>{n.effects=[...(n.effects||[]),{type:'LAYER_BLUR',radius:r,visible:true}]};
const bgblur=(n,r)=>{n.effects=[...(n.effects||[]),{type:'BACKGROUND_BLUR',radius:r,visible:true}]};
const noise=(n,a=.07,size=1.2,den=.6)=>{n.effects=[...(n.effects||[]),{type:'NOISE',noiseType:'MONOTONE',noiseSize:size,density:den,color:{r:1,g:1,b:1,a},visible:true}]};
const comp=async id=>(await figma.getNodeByIdAsync(id));

const deco=async(c,k)=>{
 if(k==='haze'){rc(c,0,0,1080,1080,[RG([[0,'#7A0000',.42],[1,'#09090B',0]],1,0,1.1)]);for(let i=0;i<=44;i++){const h=i%5===0?26:12;ln(c,72+i*21.3,1060-h,72+i*21.3,1060,'#FFFFFF',.22,2)}}
 if(k==='circuit'){rc(c,0,0,1080,1080,[RG([[0,'#4A0000',.5],[1,'#09090B',0]],0,1,1)]);for(const d of ['M 1080 560 L 1050 590 L 1050 760','M 1080 820 L 1080 820'])path(c,d,'#FF3B3B',.35,2);for(const [x,y] of [[1050,760]]){const e=el(c,x-8,y-8,16,16,[P('#FF2A2A')]);glow(e,'#FF0000',14,.8)}}
 if(k==='ring'){const a=arc(c,1040,-40,360,100,20,170,[P('#CC0000')]);blur(a,70);a.opacity=.6;}
 if(k==='dots'){c.fills=[LG([[0,'#141418',1],[1,'#09090B',1]],90)];}
 if(k==='frost'){c.fills=[LG([[0,'#F4F3EF',1],[1,'#E3E7EE',1]],90)];const o=el(c,820,-300,560,560,[P('#E00000')]);blur(o,150);o.opacity=.45;}
 noise(c,k==='frost'?0:.05);
 if(k==='frost')c.effects=[{type:'NOISE',noiseType:'MONOTONE',noiseSize:1.2,density:.5,color:{r:0,g:0,b:0,a:.06},visible:true}];
};
const card=async(par,name,x,y,k,o)=>{const dark=k!=='frost';const c=fr(par,name,1080,1080,x,y,[P(dark?'#09090B':'#F2F1ED')]);await deco(c,k);const ink=dark?'#FFFFFF':'#0B0B0D';
 const T=await tx(c,o.title,'sparq/title',ink,72,72,820);await tx(c,o.n||'|3/7⟩','sparq/badge',ink,930,86);
 let yy=T.y+T.height+32; if(o.text){const t=await tx(c,o.text,'sparq/body',ink,72,yy,936,dark?.92:1);for(const b of (o.bold||[]))await bold(t,b);yy=t.y+t.height+40;}
 if(o.src)await tx(c,o.src,'sparq/note',ink,72,1008-34,936,.55);
 return {c,ink,dark,top:yy,bottom:o.src?950:1008};};
const rich=async(par,str,st,stS,h,x,y,w,o=1)=>{const parts=str.split('**');let plain='',ranges=[];parts.forEach((p,i)=>{if(i%2){ranges.push([plain.length,plain.length+p.length])}plain+=p});const t=await tx(par,plain,st,h,x,y,w,o);const S=styles[stS];await figma.loadFontAsync(S.fontName);for(const [a,b] of ranges)t.setRangeFontName(a,b,S.fontName);return t};
const head2=async(c,title,n,ink)=>{const T=await tx(c,title,'sparq/title',ink,72,72,820);await tx(c,n,'sparq/badge',ink,930,86);return T.y+T.height+28};
return {rich,head2,deco,card,H,P,RG,LG,styles,fr,rc,el,arc,ln,path,tx,bold,glow,blur,bgblur,comp,noise};