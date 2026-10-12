
const AF=Object.getPrototypeOf(async function(){}).constructor;
const L=await (new AF('figma',figma.root.getSharedPluginData('sparq','lib')))(figma);
const K=await (new AF('figma',figma.root.getSharedPluginData('sparq','lib2')))(figma);
const pg=figma.currentPage;
const bgSet=pg.findOne(n=>n.type==='COMPONENT_SET'&&n.name==='sparq/bg');const BG=k=>bgSet.children.find(c=>c.name==='bg='+k);
const tagSet=pg.findOne(n=>n.type==='COMPONENT_SET'&&n.name==='sparq/tag');const TAG=(s,t)=>tagSet.children.find(c=>c.name==='style='+s+', tone='+t);
const slotSet=pg.findOne(n=>n.type==='COMPONENT_SET'&&n.name==='sparq/slot/graphic');const SLOT=s=>slotSet&&slotSet.children.find(c=>c.name==='size='+s);
const SAMPLE={title:'ловушка размеров',s:'Государственные инвестиции в квантовые программы достигли **$55 млрд**. Сравнивать эти числа напрямую нельзя.',
 m:'Государственные инвестиции в квантовые программы достигли **$55 млрд**, и их разброс огромный. Прямо сравнивать эти числа нельзя: они отражают не потенциал, а тип государственного участия. Китай вкладывает больше всех, но большая часть идёт в инфраструктуру, а не в исследования.',
 g:'Государственные инвестиции достигли **$55 млрд**, но сравнивать их напрямую нельзя: они отражают не потенциал, а тип участия государства.',
 l:'требование гибрида основано на реальной истории стандартизации **NIST**. В 2022, на четвёртом раунде отбора, два кандидата в постквантовые стандарты были полностью сломаны.\n**Rainbow** — секретный ключ восстановлен исследователем IBM **за 53 часа на обычном ноутбуке**.\n**SIKE** — ключ восстановлен **за час на одном ядре процессора 2013 года**, техникой на основе **теоремы 1997 года**.\nтри из четырёх оставшихся кандидатов опирались на новые математические предположения, сложность которых не до конца изучена. Эта логика и лежит в основе позиции **ANSSI и BSI**.'};
const ink=tone=>tone==='light'?'tl':'td';const ink2=tone=>tone==='light'?'tl2':'td2';
const shell=async(name,bgk,tone,o={})=>{const c=figma.createComponent();c.name=name;c.resize(1080,1080);c.layoutMode='VERTICAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.paddingTop=c.paddingBottom=c.paddingLeft=c.paddingRight=72;c.itemSpacing=o.gap??32;c.clipsContent=true;c.fills=[K.VP('bg')];
 const b=BG(bgk).createInstance();c.appendChild(b);b.name='bg';b.layoutPositioning='ABSOLUTE';b.x=0;b.y=0;b.constraints={horizontal:'SCALE',vertical:'SCALE'};b.locked=true;
 const props={};
 if(!o.noHead){const h=K.AL(c,'head','HORIZONTAL',{gap:40});h.layoutSizingHorizontal='FILL';h.counterAxisAlignItems='MIN';
  if(o.kicker){const tg=TAG(tone==='light'?'glass':'glass',tone==='light'?'light':'dark').createInstance();h.appendChild(tg);tg.name='kicker';}
  else{const t=await K.T(h,o.title||SAMPLE.title,o.titleStyle||'sparq/caption',ink(tone),{name:'title'});t.layoutSizingHorizontal='FILL';t.textAutoResize='HEIGHT';props.title=t;}
  if(o.kicker){const sp=K.AL(h,'spacer','HORIZONTAL');sp.layoutGrow=1;}
  const n=await K.T(h,'|2/7⟩','sparq/badge',ink(tone),{name:'counter'});props.counter=n;}
 return {c,props};};
const body=async(par,txt,tone,st='sparq/body',stS='sparq/body-strong')=>{const t=await K.T(par,txt,st,ink(tone),{fill:true,name:'text',op:tone==='light'?1:.92});await K.RICH(t,stS);if(st==='sparq/body-dense'){t.paragraphSpacing=14}else{t.paragraphSpacing=18}return t};
const spacer=par=>{const s=K.AL(par,'spacer','VERTICAL');s.layoutSizingHorizontal='FILL';s.layoutGrow=1;return s};
const footer=async(c,tone)=>{const f=await K.T(c,'источник: ‹название, год›','sparq/note',ink(tone),{fill:true,name:'source',op:.6});return f};
const expose=(c,props)=>{const map={};for(const k in props){const n=props[k];if(n.type==='TEXT'){const key=c.addComponentProperty(k,'TEXT',n.characters);n.componentPropertyReferences={characters:key};}}};
return {L,K,pg,BG,TAG,SLOT,SAMPLE,ink,ink2,shell,body,spacer,footer,expose};