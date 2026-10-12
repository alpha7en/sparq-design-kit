
const res=[];
const bb=n=>n.absoluteBoundingBox||n.absoluteRenderBounds;
const vis=n=>n.visible!==false;
const hasPaint=n=>{const f=(n.fills&&n.fills!==figma.mixed?n.fills:[]).some(p=>p.visible!==false&&(p.opacity===undefined||p.opacity>0.02));const s=(n.strokes||[]).some(p=>p.visible!==false);return f||s;};
const texts=[],boxes=[];
const walk=(n,anc)=>{ if(!vis(n))return; 
  if(n.type==='TEXT'){texts.push({n,anc});}
  else if((n.type==='FRAME'||n.type==='RECTANGLE'||n.type==='ELLIPSE')&&n!==anc[0]){const b=bb(n); if(b&&b.width>24&&b.height>16&&hasPaint(n))boxes.push({n,anc});}
  if('children' in n && n.type!=='INSTANCE') n.children.forEach(c=>walk(c,anc.concat([n])));
};
const I=(a,b)=>{const x=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),y=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);return (x>0&&y>0)?{x,y}:null;};
const inside=(a,b,t)=>a.x>=b.x-t&&a.y>=b.y-t&&a.x+a.width<=b.x+b.width+t&&a.y+a.height<=b.y+b.height+t;
audit=async(slide)=>{
 texts.length=0;boxes.length=0;res.length=0;
 slide.children.forEach(c=>walk(c,[slide]));
 const sb=bb(slide);
 const nm=(n)=>n.name+'['+(n.characters?n.characters.slice(0,22).replace(/\n/g,' '):'')+']';
 // text outside slide
 for(const {n} of texts){const b=bb(n); if(!inside(b,sb,1)) res.push('OUT-OF-SLIDE '+nm(n)+' '+Math.round(b.x-sb.x)+','+Math.round(b.y-sb.y)+' '+Math.round(b.width)+'x'+Math.round(b.height));}
 // text-text overlap
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=bb(texts[i].n),b=bb(texts[j].n);const o=I(a,b); if(o&&o.x>2&&o.y>3) res.push('TEXT×TEXT '+nm(texts[i].n)+' ~ '+nm(texts[j].n)+' ov '+Math.round(o.x)+'x'+Math.round(o.y));}
 // text vs box
 for(const {n:t,anc:ta} of texts){const b=bb(t); for(const {n:bx} of boxes){ const c=bb(bx); const o=I(b,c); if(!o)continue; if(o.x<=2||o.y<=2)continue; if(inside(b,c,2))continue; const isAnc=ta.includes(bx);
   // partial
   res.push((isAnc?'OVERFLOW ':'CROSS ')+nm(t)+' vs '+bx.name+' ('+Math.round(c.width)+'x'+Math.round(c.height)+') textBox '+Math.round(b.x-c.x)+','+Math.round(b.y-c.y)+' '+Math.round(b.width)+'x'+Math.round(b.height));}}
 // mid-word wrap check
 for(const {n} of texts){ if(n.textAutoResize==='WIDTH_AND_HEIGHT')continue; const words=n.characters.split(/[ \n\t]+/).flatMap(w=>w.replace(/-/g,'-\u0001').split('\u0001')).filter(w=>w&&w.length>5); if(!words.length)continue; 
   let longest=words.sort((a,b)=>b.length-a.length)[0];
   const t=figma.createText(); t.fontName=n.fontName===figma.mixed?n.getRangeFontName(0,1):n.fontName; t.fontSize=n.fontSize===figma.mixed?n.getRangeFontSize(0,1):n.fontSize; t.letterSpacing=n.letterSpacing===figma.mixed?{value:0,unit:'PIXELS'}:n.letterSpacing; t.characters=longest; t.textAutoResize='WIDTH_AND_HEIGHT'; const w=t.width; t.remove();
   if(w>n.width+1) res.push('MIDWORD '+nm(n)+' word "'+longest+'" '+Math.round(w)+'>'+Math.round(n.width));}
 // sibling box partial overlap
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const A=boxes[i],B=boxes[j]; if(A.anc.includes(B.n)||B.anc.includes(A.n))continue;if(['orbit','interference'].includes(A.n.name)||['orbit','interference'].includes(B.n.name))continue; const a=bb(A.n),b=bb(B.n); const o=I(a,b); if(!o||o.x<6||o.y<6)continue; if(inside(a,b,2)||inside(b,a,2))continue; res.push('BOX×BOX '+A.n.name+' ~ '+B.n.name+' ov '+Math.round(o.x)+'x'+Math.round(o.y));}

 // tight vertical gaps between texts overlapping horizontally
 for(let i=0;i<texts.length;i++)for(let j=0;j<texts.length;j++){if(i===j)continue;const a=bb(texts[i].n),b=bb(texts[j].n);const ox=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x);if(ox<Math.min(a.width,b.width)*0.3||ox<20)continue;const gap=b.y-(a.y+a.height);if(gap>=-1&&gap<10&&a.y<b.y&&a.height>40)res.push('TIGHT '+nm(texts[i].n)+' / '+nm(texts[j].n)+' gap '+Math.round(gap));}
 // text near bottom/right edge of a containing box
 for(const {n:t,anc:ta} of texts){const b=bb(t);for(const {n:bx} of boxes){if(!ta.includes(bx))continue;const c=bb(bx);if(c.height<90||c.width<150)continue;const bot=c.y+c.height-(b.y+b.height);const rgt=c.x+c.width-(b.x+b.width);if(bot>=0&&bot<10&&b.height>14)res.push('EDGE-B '+nm(t)+' in '+bx.name+' pad '+Math.round(bot));if(rgt>=0&&rgt<14&&t.textAutoResize!=='WIDTH_AND_HEIGHT')res.push('EDGE-R '+nm(t)+' in '+bx.name+' pad '+Math.round(rgt));}}
 // text crossing thin lines
 const lines=[];const walk2=(n)=>{if(n.visible===false)return;if((n.type==='RECTANGLE'||n.type==='LINE'||n.type==='VECTOR')&&n.name!=='bg/grain'){const b=bb(n);if(b&&(b.height<=3||b.width<=3)&&(b.width>40||b.height>40))lines.push({n,b})}if('children' in n&&n.type!=='INSTANCE')n.children.forEach(walk2)};slide.children.forEach(walk2);
 for(const {n:t} of texts){const b=bb(t);for(const {n:l,b:c} of lines){const ox=Math.min(b.x+b.width,c.x+c.width)-Math.max(b.x,c.x);const oy=Math.min(b.y+b.height,c.y+c.height)-Math.max(b.y,c.y);if(ox<8||oy<0)continue;if(c.height<=3){if(c.y>b.y+4&&c.y<b.y+b.height-4&&ox>20)res.push('LINE×TEXT '+nm(t)+' by '+l.name+' y '+Math.round(c.y-b.y)+'/'+Math.round(b.height));}else if(c.width<=3){if(c.x>b.x+4&&c.x<b.x+b.width-4&&oy>14)res.push('VLINE×TEXT '+nm(t)+' by '+l.name);}}}
 // text too close to non-ancestor decorative line/shape edge (touching)
 const shapes=[];const walk3=(n)=>{if(n.visible===false)return;if(['VECTOR','RECTANGLE','ELLIPSE','LINE'].includes(n.type)&&n.name!=='bg/grain'){const b=bb(n);if(b&&(b.width>=1||b.height>=1))shapes.push({n,b})}if('children' in n&&n.type!=='INSTANCE')n.children.forEach(walk3)};slide.children.forEach(walk3);
 for(const {n:t,anc:ta} of texts){const b=bb(t);for(const {n:s,b:c} of shapes){if(ta.includes(s))continue;if(s.type==='RECTANGLE'&&c.width>200&&c.height>60)continue;if(s.type==='ELLIPSE'&&c.width>120)continue;
  const ox=Math.min(b.x+b.width,c.x+c.width)-Math.max(b.x,c.x);const oy=Math.min(b.y+b.height,c.y+c.height)-Math.max(b.y,c.y);
  const gx=ox>0?0:-ox,gy=oy>0?0:-oy;const d=Math.hypot(gx,gy);
  if(d>0&&d<4&&(ox>0||oy>0)&&(c.width<=3||c.height<=3||s.type==='VECTOR'))res.push('TOUCH '+nm(t)+' ~ '+s.name+' gap '+Math.round(d));}}
 // inner<outer: gap between filled/stroked sibling blocks must be >= their inner padding
 const walkG=(n)=>{if(n.visible===false)return;if('children' in n&&n.layoutMode&&n.layoutMode!=='NONE'&&n.type==='FRAME'){const ch=n.children.filter(c=>c.type==='FRAME'&&c.visible!==false&&c.layoutPositioning!=='ABSOLUTE'&&((c.fills&&c.fills!==figma.mixed&&c.fills.some(f=>f.visible!==false&&(f.opacity===undefined||f.opacity>.04)))||(c.strokes&&c.strokes.length)));
   if(ch.length>=2){const pads=ch.map(c=>Math.min(c.paddingTop,c.paddingBottom,c.paddingLeft,c.paddingRight)).filter(p=>p>0);const mp=pads.length?Math.min(...pads):0;if(mp>0&&n.itemSpacing<mp&&ch.every(c=>c.height>50))res.push('GAP<PAD '+n.name+' gap '+n.itemSpacing+' < pad '+mp)}}
  if('children' in n)n.children.forEach(walkG)};slide.children.forEach(walkG);
 return res.slice();
};