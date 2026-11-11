/**
 * Chrome-rendered usability walkthrough for all My Learners dashboards.
 * Uses Chrome DevTools Protocol and Node 22. Saves actual PNG screenshots.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const ROOT=process.env.MY_LEARNERS_URL||'http://127.0.0.1:8765/';
const CDP=process.env.CHROME_DEBUG_URL||'http://127.0.0.1:9229';
const OUT=process.env.QA_OUTPUT||'qa-artifacts';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,message)=>{if(!ok)throw Error(message)};
async function connect(){
 let tabs;
 for(let i=0;i<60;i++){
  try{tabs=await(await fetch(CDP+'/json/list')).json();if(tabs.length)break}catch{}
  await sleep(350);
 }
 assert(tabs?.[0]?.webSocketDebuggerUrl,'Chrome DevTools endpoint unavailable');
 const ws=new WebSocket((tabs.find(t=>t.type==='page')||tabs[0]).webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});
 });
 let seq=0;const pending=new Map(),exceptions=[];
 ws.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params?.exceptionDetails?.text||'Uncaught error');
  if(!m.id)return;
  const p=pending.get(m.id);if(!p)return;pending.delete(m.id);
  if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result||{});
 });
 function command(method,params={}){
  const id=++seq;
  return new Promise((resolve,reject)=>{
   pending.set(id,{resolve,reject});
   ws.send(JSON.stringify({id,method,params}));
  });
 }
 await command('Page.enable');await command('Runtime.enable');
 return {command,exceptions,close:()=>ws.close()};
}
const client=await connect();
const cases=[];let failed=false;
async function evaluate(js){
 const r=await client.command('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Browser evaluation failed');
 return r.result?.value;
}
async function viewport(width,height){
 await client.command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
}
async function navigate(route,selector){
 // An SPA does not necessarily reload when navigating to its current hash.
 // Force a fresh document for repeated role journeys so division state cannot
 // leak from the previous screenshot scenario.
 const target='#/'+route;
 const same=await evaluate('location.hash==='+JSON.stringify(target)).catch(()=>false);
 if(same)await client.command('Page.reload',{ignoreCache:true});
 else await client.command('Page.navigate',{url:ROOT+target});
 for(let i=0;i<100;i++){
  const ready=await evaluate("document.readyState==='complete'&&!!document.querySelector("+JSON.stringify(selector)+")").catch(()=>false);
  if(ready){await sleep(250);return}
  await sleep(100);
 }
 throw Error('Route '+route+' did not render '+selector);
}
async function click(selector){
 const js="(function(){const e=document.querySelector("+JSON.stringify(selector)+");if(!e)return false;e.click();return true})()";
 assert(await evaluate(js),'Missing clickable element '+selector);
 await sleep(200);
}
async function screenshot(name){
 const shot=await client.command('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 await writeFile(path.join(OUT,name+'.png'),Buffer.from(shot.data,'base64'));
}
const inspect='('+function(){
 const $=s=>document.querySelector(s);
 const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 const nav=$('.top'),main=$('#main'),heading=$('.heading h1')||$('.board-heading h1')||$('.profile-head h1');
 const rail=nav?getComputedStyle(nav).position:'none';
 const buttons=[...document.querySelectorAll('.roles [data-role]')];
 const navRect=nav&&rect(nav),mainRect=main&&rect(main);
 const labels=buttons.map(b=>({name:b.textContent.trim(),r:rect(b)}));
 const wide=innerWidth>=1180&&!document.querySelector('#app.board-presentation-mode');
 const headingRect=heading&&rect(heading);
 const overlap=wide&&navRect&&headingRect&&headingRect.top>=0?headingRect.top<navRect.bottom-6:false;
 const clipped=labels.some(x=>x.r.left<0||x.r.right>innerWidth+1||x.r.top<0||x.r.bottom>innerHeight+1);
 const cards=[...document.querySelectorAll('.board-overview-cards .board-overview-card')].map(rect);
 const collisions=cards.some((r,i)=>cards.slice(i+1).some(s=>
  Math.min(r.right,s.right)-Math.max(r.left,s.left)>8&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>8));
 const visible=heading&&rect(heading).width>0&&rect(heading).top>=-1;
 const stylesheet=[...document.querySelectorAll('link[rel=stylesheet]')].some(x=>x.href.includes('clarity-design.css')&&x.sheet);
 const paletteLoaded=[...document.querySelectorAll('link[rel=stylesheet]')].some(x=>x.href.includes('sitewide-palette.css')&&x.sheet);
 const visionLoaded=[...document.querySelectorAll('link[rel=stylesheet]')].some(x=>x.href.includes('vision-ui.css')&&x.sheet);
 const headerFill=nav?getComputedStyle(nav).backgroundImage:'none';
 const tiles=[...document.querySelectorAll(
  '.faculty-daily-summary>.quick-tile,.leader-learning-grid>.leader-stat,.leader-daily-grid>.leader-daily-priority,'+
  '.sss-count-grid>.sss-number,.student-landing-grid>.student-today-tile,'+
  '.board-strength-grid>.board-strength-card'
 )].map(e=>({r:rect(e),fill:getComputedStyle(e).backgroundImage,ring:getComputedStyle(e,'::before').content}));
 const tileOverlaps=tiles.some((a,i)=>tiles.slice(i+1).some(b=>
   Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>8&&
   Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>8));
 const shadeCount=new Set(tiles.map(x=>x.fill)).size;
 return {role:document.querySelector('.roles [aria-pressed=true]')?.textContent.trim()||'',
  viewport:{width:innerWidth,height:innerHeight},navigationPosition:rail,
  canvas:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,
  mainRect,navRect,navButtons:labels.map(x=>x.name),
  horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
  navClipped:clipped,overlappingNavigation:overlap,overlappingBoardCards:collisions,
  visibleHeading:!!visible,clarityLoaded:!!stylesheet,paletteLoaded,visionLoaded,headerFill,
  tileCount:tiles.length,tileShadeCount:shadeCount,tileOverlaps,
  tileRingsRemoved:tiles.every(x=>x.ring==='none'||x.ring==='normal'),
  headings:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()).slice(0,2),
  focusables:[...document.querySelectorAll('button,select,input,[href]')].filter(e=>e.getBoundingClientRect().width>0).length
 };
}.toString()+')()';
async function run(name,route,selector,width,height,interaction){
 const record={name,route,width,height};
 try{
  await viewport(width,height);await navigate(route,selector);
  if(interaction)await interaction();
  Object.assign(record,await evaluate(inspect));await screenshot(name);
  assert(record.clarityLoaded,'Clarity stylesheet did not load');
  assert(record.paletteLoaded,'Shared evidence palette did not load');
  assert(record.visionLoaded,'Vision design system did not load');
  if(/^(faculty|student|sss|leader)-\d+x\d+$/.test(name)){
   const brand=await evaluate("(function(){const h=document.querySelector('.heading'),link=[...document.querySelectorAll('link[rel=stylesheet]')].find(x=>x.href.includes('aisg-board-inspired-sitewide.css'));if(!h)return {exists:false};const c=getComputedStyle(h),title=h.querySelector('h1'),badge=h.querySelector('.heading-meta .demo'),r=h.getBoundingClientRect();return {exists:true,loaded:!!link?.sheet,background:c.backgroundImage,titleColor:title?getComputedStyle(title).color:null,badgeColor:badge?getComputedStyle(badge).color:null,width:r.width,left:r.left,right:r.right,height:r.height,columns:c.gridTemplateColumns}})()");
   assert(brand.exists&&brand.loaded,'Sitewide branded cover must render for '+name);
   assert(brand.background.includes('rgb(11, 43, 68)')&&brand.background.includes('rgb(167, 31, 53)'),
    'Cover must use Board navy and crimson on '+name);
   assert(brand.titleColor==='rgb(255, 255, 255)'&&brand.badgeColor==='rgb(255, 255, 255)',
    'Title and demo badge need readable contrast on '+name);
   assert(brand.right<=width+2&&brand.left>=-2,'Branded cover must fit viewport on '+name);
   const compactLoaded=await evaluate("!![...document.querySelectorAll('link[rel=stylesheet]')].find(x=>x.href.includes('compact-headers-microinteractions.css')&&x.sheet)");
   assert(compactLoaded,'Compact operational stylesheet must load for '+name);
   if(width>=1180){
    assert(brand.height<=118,'Daily '+name+' banner must be under 118px; got '+brand.height);
    if(name.startsWith('faculty-'))assert(brand.height<=105,'Faculty banner should preserve roster space');
   }

   if(name.startsWith('faculty-')&&width>=1180)assert(brand.height<=139,'Faculty cover must keep first learner rows visible');
   if(width<=850)assert(brand.columns.trim().split(' ').length===1,
    'Mobile cover should stack title and provenance rather than squeeze columns');
  }

  if(/^(faculty|student|sss|leader|board)-\d+x\d+$/.test(name)){
   assert(record.tileCount>=3,'Expected at least three high-level summary tiles in '+name);
   assert(record.tileRingsRemoved,'Legacy decorative rings should not appear on tiles');
   assert(!record.tileOverlaps,'Summary tiles should not overlap');
  }
  if(name.startsWith('board-dp-')&&interaction)
   assert(record.headings.some(Boolean),'Board page heading must remain present after section navigation');
  else assert(record.visibleHeading,'Heading is not visible');
  assert(!record.overlappingNavigation,'Global navigation obscures the workspace heading');
  assert(!record.navClipped,'Navigation contains offscreen buttons');
  assert(!record.overlappingBoardCards,'Board overview cards overlap');
  if(record.horizontalOverflow>4){
   const offenders=await evaluate("Array.from(document.querySelectorAll('body *')).map(e=>({selector:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().replace(/\\s+/g,'.'):'') ,right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth})).filter(e=>e.right>innerWidth+6).sort((a,b)=>b.right-a.right).slice(0,14)");
   console.log('OVERFLOW DIAGNOSTICS '+name+' '+JSON.stringify(offenders));
  }
  assert(record.horizontalOverflow<=4,'Document overflows horizontally by '+record.horizontalOverflow+'px');
  assert(record.focusables>=5,'No working interactive controls found');
  if(width>=1180)assert(record.navigationPosition==='fixed','Desktop product masthead must remain fixed');
  if(width<1180)assert(record.navigationPosition!=='fixed','Responsive masthead should remain in document flow');
  assert(record.headerFill.includes('linear-gradient')&&record.headerFill.includes('rgb(11, 38, 62)')&&
   (record.headerFill.includes('rgb(120, 28, 50)')||record.headerFill.includes('rgb(103, 32, 56)')),
   'AISG masthead must display both navy and red, including responsive layouts');
  assert(record.font.includes('Noto Sans'),'Noto Sans design system missing');
  record.status='pass';
 }catch(e){failed=true;record.status='fail';record.error=String(e.message||e)}
 cases.push(record);
 console.log(record.status.toUpperCase()+' '+name+' '+width+'x'+height+
  ' overflow='+(record.horizontalOverflow??'?')+(record.error?' - '+record.error:''));
}
await mkdir(OUT,{recursive:true});
try{
 for(const [width,height] of [[1440,900],[1280,800],[1920,1080],[960,850]]){
  const screen=width+'x'+height;
  for(const [role,selector] of [
   ['faculty','.faculty-daily-toolbar'],['student','.student-landing'],
   ['sss','.sss-overview'],['leader','.leader-division-grid'],['board','.board-view']
  ])await run(role+'-'+screen,role,selector,width,height);
 }
 // Daily-workspace acceptance: users should reach actionable content without scrolling.
 await run('compact-leader-landing-1440','leader','.leader-division-grid',1440,900,async()=>{
  const a=await evaluate("(function(){const welcome=document.querySelector('.leader-welcome')?.getBoundingClientRect(),cards=document.querySelector('.leader-division-grid')?.getBoundingClientRect();return {welcome:welcome?.height,cardsTop:cards?.top}})()");
  assert(a.welcome<=165,'Leader welcome still too tall: '+a.welcome);
  assert(a.cardsTop<=570,'Division choices need to start higher on desktop: '+a.cardsTop);
 });
 await run('compact-leader-priorities-1440','leader','.leader-division-grid',1440,900,async()=>{
  await click('[data-leader-division="Secondary"]');
  const a=await evaluate("(function(){const header=document.querySelector('.leader-division-hero')?.getBoundingClientRect(),section=document.querySelector('#leader-daily-priorities')?.getBoundingClientRect(),grade=document.querySelector('.leader-grade-bar');return {hero:header?.height,attentionTop:section?.top,gradeChoices:grade?.querySelectorAll('button').length}})()");
  assert(a.hero<=220,'Secondary context block still too tall: '+a.hero);
  assert(a.attentionTop<=750,'Secondary attention tiles must begin within first desktop screen: '+a.attentionTop);
  assert(a.gradeChoices>=8,'Compaction must keep Grades 6–12 controls');
 });
 await run('microinteraction-motion-preference-1440','leader','.leader-division-grid',1440,900,async()=>{
  const normal=await evaluate("getComputedStyle(document.querySelector('.leader-division-choice')).transitionDuration");
  assert(normal.includes('0.12s'),'Leader division cards need brief tactile transitions');
  try{
   await client.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   const reduced=await evaluate("getComputedStyle(document.querySelector('.leader-division-choice')).transitionDuration");
   assert(reduced.split(',').every(x=>x.trim()==='0s'),
    'Reduced motion must remove these transitions: '+reduced);
  }finally{
   await client.command('Emulation.setEmulatedMedia',{features:[]});
  }
 });
 // Design-system acceptance: chart-first storytelling and learner rows above fold.
 await run('design-board-chart-first-1440','board','.board-historical-chart',1440,900,async()=>{
  const a=await evaluate("(function(){const x=document.querySelector('.board-historical-chart').getBoundingClientRect();const y=document.querySelector('.board-strength-grid').getBoundingClientRect();return {chart:x.top,cards:y.top,css:[...document.querySelectorAll('link[rel=stylesheet]')].some(l=>l.href.includes('design-system-refinement.css')&&l.sheet)}})()");
  assert(a.css,'Sitewide token layer must load after the brand theme');
  assert(a.chart<a.cards,'The historic IB Diploma graph must precede celebratory cards');
  assert(a.chart<850,'Historical evidence should begin within the first desktop viewport');
 });
 await run('design-faculty-rows-1440','faculty','.faculty-data-wall',1440,900,async()=>{
  const a=await evaluate("(function(){const rows=[...document.querySelectorAll('.faculty-data-wall tbody tr')];const time=document.querySelector('.heading-meta .asof');return {visible:rows.filter(r=>r.getBoundingClientRect().top<innerHeight).length,color:getComputedStyle(time).color,font:parseFloat(getComputedStyle(time).fontSize),cols:getComputedStyle(document.querySelector('.faculty-daily-toolbar')).gridTemplateColumns}})()");
  assert(a.visible>=3,'The initial Faculty viewport should show at least three learners');
  assert(a.color==='rgb(255, 226, 230)','Branded Faculty metadata must remain legible on the deep red panel');
  assert(a.font>=12,'Timestamp text must be at least 12px');
  assert(a.cols.split(' ').length>=3,'Faculty controls should align on one desktop toolbar row');
 });
 // Mobile reflow is checked without penalising intentionally scrollable
 // workspace navigation or independent horizontal evidence tables.
 for(const width of [390,768]){
  const height=width===390?844:1024;
  for(const [role,selector] of [['faculty','.faculty-daily-toolbar'],
   ['student','.student-landing'],['sss','.support-leadership'],
   ['leader','.leader-division-grid'],['board','.board-view']]){
   await viewport(width,height);
   await navigate(role,selector);
   const a=await evaluate("(function(){const role=document.querySelector('#app')?.dataset.workspace;const nav=document.querySelector('.top nav.roles');const m=document.querySelector('#main');return {role,overflow:document.documentElement.scrollWidth-innerWidth,mainWidth:m?.getBoundingClientRect().width,navScroll:nav?.scrollWidth,navWidth:nav?.clientWidth,loaded:[...document.querySelectorAll('link[rel=stylesheet]')].some(l=>l.href.includes('design-system-refinement.css')&&l.sheet)}})()");
   assert(a.role===role,'Mobile role view must remain accessible');
   assert(a.loaded,'Mobile view must load the canonical design tokens');
   assert(a.mainWidth>width*.7,'Mobile content must not collapse');
   if(role!=='board'){
    const compact=await evaluate("(function(){const h=document.querySelector('.heading');const b=h?.getBoundingClientRect();const styles=h?getComputedStyle(h):null;return {height:b?.height||0,columns:styles?.gridTemplateColumns||''}})()");
    assert(compact.height>0&&compact.height<=180,
     'Operational mobile banner should remain compact: '+role+' '+width+'px '+compact.height);
    assert(compact.columns.trim().split(' ').length===1,
     'Mobile title and provenance must stack cleanly: '+role);
   }

   assert(a.overflow<=4,'Mobile page has unexpected horizontal overflow: '+role+' '+width+'px '+a.overflow);
   await screenshot('design-'+role+'-'+width);
   cases.push({name:'design-'+role+'-'+width,route:role,width,height,status:'pass'});
   console.log('PASS design-'+role+'-'+width+' overflow='+a.overflow);
  }
 }
 // New interaction coverage: actual hover, keyboard, click and role-bound previews.
 await viewport(1440,900);
 await navigate('faculty','.roster-desktop .student-link');
 const studentPreviewCount=await evaluate('document.querySelectorAll(".roster-desktop [data-evidence-preview=student]").length');
 assert(studentPreviewCount>=10,'Faculty learner preview affordances missing');
 const beforePreviewHash=await evaluate('location.hash');
 const visiblePreview=await evaluate("(async()=>{const a=document.querySelector('.roster-desktop [data-evidence-preview=student]');a.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));await new Promise(r=>setTimeout(r,470));const p=document.querySelector('.evidence-preview-popup');return !!p&&p.textContent.includes('Attendance')&&p.textContent.includes('Mathematics')})()");
 assert(visiblePreview,'Hover must reveal a concise learner evidence preview');
 assert((await evaluate('location.hash'))===beforePreviewHash,'Hover must not change navigation');
 const keyboardDismiss=await evaluate("(async()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await new Promise(r=>setTimeout(r,70));return !document.querySelector('.evidence-preview-popup')})()");
 assert(keyboardDismiss,'Escape must close preview');
 const iconCount=await evaluate('document.querySelectorAll(".roster-desktop .evidence-preview-trigger,.roster-desktop .experience-cell-help").length');
 assert(iconCount===0,'Faculty data cells must not contain separate information icons');
 const hoverValue=await evaluate("(async()=>{const a=document.querySelector('.roster-desktop .evidence-cell-open[data-evidence-preview=experience-cell]');if(!a)return false;a.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));await new Promise(r=>setTimeout(r,470));const p=document.querySelector('.evidence-preview-popup');return !!p&&!!p.querySelector('.evidence-preview-periods')&&p.textContent.includes('Fall 2026')&&!p.textContent.includes('student check-in responses')&&!p.textContent.includes('synthetic')&&!a.hasAttribute('title')})()");
 assert(hoverValue,'Experience hover must show concise prior check-in windows without context or duplicate browser tooltip');
 const hoverReport=await evaluate("(async()=>{const a=document.querySelector('.faculty-data-wall .evidence-cell-open[data-evidence-preview=academic][data-evidence-subject=\"Mathematics\"]');if(!a)return false;a.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));await new Promise(r=>setTimeout(r,470));const p=document.querySelector('.evidence-preview-popup');return !!p&&p.querySelectorAll('.evidence-preview-period').length>=2&&!!p.querySelector('.evidence-preview-period.is-current')&&!p.textContent.includes('Assessment context')&&!p.textContent.includes('TEST DATA')&&!p.textContent.includes('NOT ISSUED')&&!a.hasAttribute('title')})()"); 
 assert(hoverReport,'Faculty report hover must show previous comparable grades and no synthetic text or native tooltip');
 await click('.roster-desktop .evidence-cell-open[data-evidence-preview="experience-cell"]');
 assert(await evaluate('!!document.querySelector(".profile-head")'),'Clicking a value must still open its learner profile');
 await navigate('sss','.sss-overview');
 assert(await evaluate('document.querySelectorAll(".sss-roster-row[data-evidence-preview=sss-person]").length>0'),
  'SSS needs role-scoped roster preview targets');
 const privateContent=await evaluate("(async()=>{const a=document.querySelector('.sss-roster-row[data-evidence-preview=sss-person]');a.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));await new Promise(r=>setTimeout(r,50));return document.querySelector('.evidence-preview-popup')?.textContent||''})()");
 assert(privateContent.includes('Fictional')&&!privateContent.includes('case notes:'),'SSS preview must not include case-note narrative');
 await navigate('leader','.leader-division-grid');
  assert(await evaluate('document.querySelectorAll(".leader-division-choice").length===2'),
   'Whole-school Leaders need Elementary and Secondary navigation');
  assert(await evaluate('document.querySelectorAll(".leader-daily-grid .leader-daily-priority").length===4'),
   'Whole-school landing needs the operational pulse');
  await navigate('board','.board-view');
 assert(await evaluate('document.querySelectorAll("[data-evidence-preview=board-card]").length>=3'),
  'Board result cards need concise previews');
 console.log('PASS evidence previews: Faculty pointer, Escape, click, SSS, Leaders and Board');
 await run('board-landing-average-overall-1440','board','.board-dp-overview-trend',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.board-dp-overview-trend [data-board-dp-metric=average]')?.getAttribute('aria-pressed')==='true'"),
    'Unparameterized Board should land on average Diploma points, not pass rates');
   assert(await evaluate("document.querySelector('.board-dp-overview-trend [data-board-dp-basis=overall]')?.getAttribute('aria-pressed')==='true'"),
    'World overall should be the initial comparison when opening Board');
   assert(await evaluate("document.querySelectorAll('.board-dp-overview-trend .board-dp-world-point').length===10"),
    'Worldwide overall decade should contain exactly May 2017–2026');
   assert(await evaluate("document.querySelector('.board-dp-overview-trend .board-dp-svg')?.textContent.includes('30.88')"),
    'Default worldwide overall trend must show the published 2026 30.88');
   assert(await evaluate("!!document.querySelector('.board-dp-overview-trend .board-dp-population-note')"),
    'Different AISG/world candidate populations must be explicitly disclosed');
  });
 await run('board-dp-default-average-overall-1440','board?view=dp','.board-dp',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.board-dp [data-board-dp-metric=average]')?.getAttribute('aria-pressed')==='true'"),
    'Dedicated Diploma view should open on average points');
   assert(await evaluate("document.querySelector('.board-dp [data-board-dp-basis=overall]')?.getAttribute('aria-pressed')==='true'"),
    'Dedicated Diploma view should default to world overall');
   assert(await evaluate("document.querySelectorAll('.board-dp .board-dp-world-point').length===10"),
    'Worldwide overall graph contains ten verified years');
   await click('[data-board-dp-basis=recipients]');
   assert(await evaluate("document.querySelector('[data-board-dp-basis=recipients]')?.getAttribute('aria-pressed')==='true'"),
    'Teachers and leaders can still switch to matched Diploma-recipient results');
   assert(await evaluate("!!document.querySelector('.board-dp-matched-gaps')"),
    'Only matched recipient scores should produce calculated differences');
  });
 await run('aisg-red-navy-student-1440','student','.student-landing-grid',1440,900,
  async()=>{
   const bg=await evaluate("getComputedStyle(document.querySelector('.student-save-goal')).backgroundColor");
   assert(bg==='rgb(167, 31, 53)',
    'The student reflection action should now use AISG red rather than unrelated purple');
   assert(await evaluate("getComputedStyle(document.querySelector('.student-today-goal .student-symbol')).color==='rgb(167, 31, 53)'"),
    'The reflection icon should use the same red identity');
  });
 await run('faculty-experience-scales-1440','faculty','.faculty-daily-summary',1440,900,
  async()=>{
   const result=await evaluate("(function(){const cards=[...document.querySelectorAll('.faculty-daily-summary .faculty-index-gauge')];return {count:cards.length,bands:cards.map(x=>x.querySelectorAll('.leader-experience-segments>span:not(.leader-experience-marker)').length),markers:cards.map(x=>!!x.querySelector('.leader-experience-marker')),dots:cards.map(x=>!!x.querySelector('.faculty-summary-colour-mark')),clicks:cards.map(x=>x.dataset.action||''),fills:cards.map(x=>getComputedStyle(x).backgroundColor)}})()");
   assert(result.count===2&&result.bands.every(n=>n===4)&&result.markers.every(Boolean),
    'Faculty Engagement and Belonging must show a four-colour scale');
   assert(result.dots.every(v=>!v)&&result.clicks.every(x=>x.startsWith('explain:faculty:')),
    'Faculty summary must remain colour-only and retain explanation actions');
   assert(result.fills.every(x=>x!=='rgb(255, 255, 255)'),
    'Faculty check-in tiles need band-specific soft background colours');
  });
 await run('student-experience-scales-1440','student','.student-checkin-preview',1440,900,
  async()=>{
   const result=await evaluate("(function(){const compact=[...document.querySelectorAll('.student-checkin-preview-tile')],personal=[...document.querySelectorAll('.student-wellbeing-content .experience-metric-card')],first=[...document.querySelectorAll('.student-landing-grid .student-today-tile')];return {compact:compact.length,personal:personal.length,learning:first.length,gauges:[...compact,...personal].map(e=>e.querySelectorAll('.leader-experience-segments>span:not(.leader-experience-marker)').length),markers:[...compact,...personal].map(e=>!!e.querySelector('.leader-experience-marker')),fills:compact.map(e=>getComputedStyle(e).backgroundColor)}})()");
   assert(result.compact===2&&result.personal===2&&result.learning===3,
    'Student landing must retain three learning tiles and show two personal check-ins');
   assert(result.gauges.every(n=>n===4)&&result.markers.every(Boolean),
    'Student summary and detailed check-ins need the same four-band index scale');
   assert(result.fills.every(x=>x!=='rgb(255, 255, 255)'),
    'Student personal experience tiles need band-specific background tints');
  });
 await run('aisg-red-navy-board-1440','board','.board-heading',1440,900,
  async()=>{
   const theme=await evaluate("(function(){const app=document.querySelector('#app');const nav=document.querySelector('.top');const active=nav?.querySelector('.roles button.selected');const hero=document.querySelector('.board-heading');const first=document.querySelector('.board-strength-card');const second=document.querySelector('.board-strength-card:nth-child(2)');const label=document.querySelector('.board-nav-tabs button.active');return {workspace:app?.dataset.workspace,nav:getComputedStyle(nav).backgroundImage,active:getComputedStyle(active).backgroundColor,hero:getComputedStyle(hero).backgroundImage,featured:getComputedStyle(first).backgroundImage,secondBorder:getComputedStyle(second).borderTopColor,label:getComputedStyle(label).color,styleLoaded:[...document.querySelectorAll('link[rel=stylesheet]')].some(x=>x.href.includes('aisg-brand-duotone.css')&&x.sheet)}})()");
   assert(theme.styleLoaded,'AISG final red/navy brand stylesheet must load');
   assert(theme.workspace==='board','Correct role should be themed');
   assert(theme.nav.includes('rgb(120, 28, 50)')&&theme.nav.includes('rgb(11, 38, 62)'),
    'Masthead needs both AISG deep red and navy');
   assert(theme.active==='rgb(167, 31, 53)','Board selected workspace should be AISG crimson');
   assert(theme.hero.includes('rgb(167, 31, 53)')&&theme.hero.includes('rgb(11, 43, 68)'),
    'Board cover must feature a clear red/navy brand split');
   assert(theme.featured.includes('rgb(181, 44, 67)'),
    'Board featured editorial card should have its own crimson identity');
   assert(theme.secondBorder==='rgb(167, 31, 53)','Board secondary editorial card needs a crimson accent');
   assert(theme.label==='rgb(167, 31, 53)','Selected Board tab should use brand red');
  });
 await run('board-map-1440','board?view=explore&window=fall2026&subject=math','.board-controls',1440,900);
 await run('board-dp-1440','board?view=dp&metric=average','.board-dp',1440,900);
 await run('board-dp-focused-average-axis-1440','board?view=dp&metric=average&world=recipients','.board-dp',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.board-dp-svg')?.getAttribute('aria-label')?.includes('Focused y-axis 30 to 40')"),
    'Average-point chart should default to a clearly labelled 30–40 axis');
   assert(await evaluate("Array.from(document.querySelectorAll('.board-dp-svg .board-trend-tick')).map(x=>x.textContent).join('|')==='30|32|34|36|38|40'"),
    'Focused graph should explicitly mark 30, 32, 34, 36, 38, 40');
   assert(await evaluate("document.querySelector('.board-dp-scale-note')?.textContent.includes('not zero')"),
    'Focused chart must disclose the nonzero baseline');
   await click('[data-board-dp-scale="full"]');
   assert(await evaluate("document.querySelector('.board-dp-svg')?.getAttribute('aria-label')?.includes('Full y-axis from 0 to 45')"),
    'Full 0–45 scale should be available');
   assert(await evaluate("document.querySelector('[data-board-dp-scale=full]')?.getAttribute('aria-pressed')==='true'"),
    'Full-scale control should update');
   await click('[data-board-dp-scale="focus"]');
   assert(await evaluate("document.querySelector('.board-dp-svg')?.getAttribute('aria-label')?.includes('Focused y-axis 30 to 40')"),
    'Focused scale should be reversible');
   assert(await evaluate("document.querySelectorAll('[data-board-dp-point]').length===11"),
    'All eleven AISG values must remain available in both modes');
  });
 await run('board-overview-focused-average-axis-1440','board?view=overview&chart=dp&metric=average&world=recipients','.board-dp-overview-trend',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.board-dp-svg')?.getAttribute('aria-label')?.includes('Focused y-axis 30 to 40')"),
    'Board Overview should use the same focused average-points scale');
   await click('[data-board-dp-scale="full"]');
   assert(await evaluate("document.querySelector('.board-dp-svg')?.getAttribute('aria-label')?.includes('Full y-axis from 0 to 45')"),
    'Overview full-scale toggle should work');
  });

 await run('board-dp-world-population-1440','board?view=dp&metric=average&world=overall','.board-dp',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('[data-board-dp-basis=overall]')?.getAttribute('aria-pressed')==='true'"),
    'Board link should restore the official overall Diploma-results comparison');
   assert(await evaluate("document.querySelectorAll('.board-dp-world-point').length===10"),
    'Overall worldwide comparison should show the 2017–2026 decade');
   assert(await evaluate("document.querySelector('.board-dp-svg')?.textContent.includes('32.98')"),
    'Final 2021 global overall figure must be 32.98, not 32.97');
   assert(await evaluate("document.querySelector('.board-dp-svg')?.textContent.includes('30.88')"),
    'Overall May 2026 worldwide average must be 30.88');
   assert(await evaluate("!!document.querySelector('.board-dp-population-note')"),
    'Cross-population comparison must disclose its different denominators');
   assert(await evaluate("!document.querySelector('.board-dp-matched-gaps')"),
    'Cross-population comparison must not invent matched gaps');
   await click('[data-board-dp-basis=recipients]');
   assert(await evaluate("document.querySelector('[data-board-dp-basis=recipients]')?.getAttribute('aria-pressed')==='true'"),
    'Board toggle must return to worldwide Diploma recipients');
   assert(await evaluate("!!document.querySelector('.board-dp-matched-gaps')"),
    'Matched recipient comparison must show properly grounded score differences');
  });
 await run('board-dp-global-2025-1440','board?view=dp&metric=average&world=recipients','.board-dp',1440,900,
  async()=>{
   const select=await evaluate("(function(){const s=document.querySelector('[data-board-dp-select=\"year\"]');s.value='2025';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(select,'DP graduation year selector missing');await sleep(180);
   assert(await evaluate("document.querySelector('.board-dp-comparison-panel')?.textContent.includes('34')"),
    '2025 official AISG Diploma mean is 34');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('32.8')"),
    'The 2025 world Diploma-recipient average must be 32.8, not a rounded 33');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('42 / 51')"),
    'Cohort participation should use 42 of 51');
   assert(await evaluate("document.querySelectorAll('.board-dp-world-point').length>=3"),
    'World chart line should include comparable years');
   await click('[data-board-dp-global]');
   assert(await evaluate("document.querySelectorAll('.board-dp-world-point').length===0"),
    'World comparison toggle did not remove world series');
   await click('[data-board-dp-global]');
   assert(await evaluate("document.querySelectorAll('.board-dp-world-point').length>=3"),
    'World comparison toggle did not restore world series');
  });
 await run('board-dp-2017-navigation-1440','board?view=dp&metric=passRate','.board-dp',1440,900,
  async()=>{
   assert(await evaluate("document.querySelectorAll('[data-board-dp-jump]').length===3"),'Board navigation should offer three section jumps');
   const sections=await evaluate("Array.from(document.querySelectorAll('#board-dp-outcomes,#board-dp-history,#board-dp-subjects')).map(x=>x.id).join('|')");
   assert(sections==='board-dp-outcomes|board-dp-history|board-dp-subjects',
    'Historical Diploma chart should sit directly below At a Glance, before subject results');
   const jumpOrder=await evaluate("Array.from(document.querySelectorAll('[data-board-dp-jump]')).map(x=>x.dataset.boardDpJump).join('|')");
   assert(jumpOrder===sections,'Diploma navigation should follow the reordered sections');
   assert(await evaluate("Array.from(document.querySelectorAll('[data-board-dp-select=year] option')).some(o=>o.value==='2016')"),'May 2016 must be selectable');
   const chosen=await evaluate("(function(){const s=document.querySelector('[data-board-dp-select=year]');s.value='2017';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(chosen,'2017 should be selectable');await sleep(180);
   assert(await evaluate("document.querySelector('.board-dp-comparison-panel')?.textContent.includes('98%')"),'2017 award rate should be 98%');
   assert(await evaluate("document.querySelector('.board-dp-comparison-panel')?.textContent.includes('59/60')"),'2017 source denominator should be 59/60');
   await click('[data-board-dp-jump="board-dp-subjects"]');
   assert(await evaluate("document.querySelector('#board-dp-subjects')!==null"),'Subject section should remain available');
  });
 await run('board-dp-subjects-1440','board?view=dp&metric=average','.dp-subject-section',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.dp-subject-section')?.textContent.includes('Where AISG Students Stand Out')"),'Subject highlights missing');
   assert(await evaluate("document.querySelectorAll('[data-board-dp-subject]').length===13"),'Thirteen courses should be available');
   assert(await evaluate("document.querySelector('.dp-subject-highlight-value')?.textContent.includes('11 / 11')"),'English A HL highlight must show 11 of 11 May sessions above worldwide');
   await click('.dp-subject-more summary');
   await click('[data-board-dp-subject="chemistry-hl"]');
   assert(await evaluate("document.querySelector('.dp-subject-detail h4')?.textContent==='Chemistry HL'"),'Chemistry course should select');
   assert(await evaluate("document.querySelector('.dp-subject-detail')?.textContent.includes('5.33')"),'Chemistry 2026 AISG grade not displayed');
   await click('[data-board-dp-subject="physics-hl"]');
   assert(await evaluate("document.querySelector('.dp-subject-score-row')?.textContent.includes('-0.32')"),'Negative comparison years must remain visible');
   await click('[data-board-dp-subject="math-aa-sl"]');
   assert(await evaluate("document.querySelector('.dp-subject-detail')?.textContent.includes('6 / 6')"),'Mathematics six-year positive comparison missing');
  });
 await run('board-dp-hover-points-1440','board?view=dp&metric=average','.dp-subject-section',1440,900,
  async()=>{
   const subject=await evaluate("(function(){const pt=document.querySelector('[data-board-dp-subject-point=\"math-aa-sl:2026:school\"]');if(!pt)return false;pt.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse',clientX:700,clientY:390}));return true})()");
   assert(subject,'Subject chart must expose hoverable AISG markers');
   assert(await evaluate("document.querySelector('.board-floating-tooltip:not([hidden])')?.textContent.includes('AISG student subject entries: 25')"),'Subject hover must display AISG candidate count');
   assert(await evaluate("document.querySelector('.board-floating-tooltip:not([hidden])')?.textContent.includes('5.52')"),'Subject hover must display exact AISG grade');
   const world=await evaluate("(function(){const pt=document.querySelector('[data-board-dp-subject-point=\"math-aa-sl:2026:world\"]');pt.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse',clientX:710,clientY:380}));return !!pt})()");
   assert(world,'Subject worldwide point must respond');
   assert(await evaluate("document.querySelector('.board-floating-tooltip:not([hidden])')?.textContent.includes('4.46')"),'Worldwide course grade must appear');
   const cohort=await evaluate("(function(){const pt=document.querySelector('[data-board-dp-world-point=\"average:2026\"]');pt.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse',clientX:840,clientY:540}));return !!pt})()");
   assert(cohort,'World Diploma trend point must be hoverable');
   assert(await evaluate("document.querySelector('.board-floating-tooltip:not([hidden])')?.textContent.includes('56 Diploma/retake candidates')"),'World point hover must show AISG cohort size');
  });
 await run('board-dp-2026-pass-hover-1440','board?view=dp&metric=passRate','.board-dp',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('83%')"),'Rounded 2026 global pass rate should be 83% on summary');
   const hovered=await evaluate("(function(){const pt=document.querySelector('[data-board-dp-world-point=\"passRate:2026\"]');pt.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse',clientX:810,clientY:430}));return !!pt})()");
   assert(hovered,'2026 global pass line point missing');
   assert(await evaluate("document.querySelector('.board-floating-tooltip:not([hidden])')?.textContent.includes('82.6%')"),'Exact official 2026 global pass rate must appear on hover');
  });
 await run('board-dp-2026-provenance-1440','board?view=dp&metric=average','.board-dp',1440,900,
  async()=>{
   const select=await evaluate("(function(){const s=document.querySelector('[data-board-dp-select=\"year\"]');s.value='2026';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(select,'Could not select Class of 2026');await sleep(170);
   assert(await evaluate("!document.querySelector('.board-dp-status')"),
    'The Board must not show a confirmation status badge');
   assert(await evaluate("document.querySelector('.board-dp-graphic-footnote')?.textContent.includes('IB School Statistics')"),
    'Source provenance for 2026 must remain accessible');
   assert(await evaluate("!document.querySelector('.board-dp')?.textContent.includes('confirmation pending')"),
    'Board dashboard must not show confirmation-pending wording');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('33')"),
    'Matched 2026 world Diploma-recipient average must show 33');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('56')"),
    'The official 2026 IB Diploma candidate denominator must be visible');
  });

 await run('faculty-everyday-columns-default-1440','faculty','.roster-daily[data-roster-layout="everyday"]',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.roster-daily[data-roster-layout=everyday]')!==null"),
    'Faculty should open with everyday evidence visible');
   const headers=await evaluate("Array.from(document.querySelectorAll('.roster-daily thead th')).map(th=>th.textContent.trim())");
    for(const expected of ['Learner','Attendance','MAP Reading','MAP Math','MAP Language Usage','IXL Math','Engagement','Belonging','Support information'])
    assert(headers.some(h=>h.includes(expected)),'Missing default evidence: '+expected);
   assert(headers.includes('Engagement')&&headers.includes('Belonging'),
    'Everyday Faculty headings must omit the repeated check-in date');
   assert(!headers.some(h=>/^(Engagement|Belonging).*2026/.test(h)),
    'No testing window should appear in those table headings');
   assert(!headers.some(h=>h.includes('MAP Mathematics growth')),'Old MAP Mathematics growth column should be removed from everyday roster');
    const mapTiles=await evaluate("(function(){return [...document.querySelectorAll('.faculty-data-wall tbody tr')].map(tr=>[...tr.querySelectorAll('button.map-rit-tile')].map(tile=>({score:tile.querySelector('.map-rit-score')?.textContent,change:tile.querySelector('.map-rit-growth')?.textContent,hasPill:!!tile.querySelector('.map-rit-percentile'),hasTitle:tile.hasAttribute('title'),preview:tile.dataset.evidencePreview})))})()");
    assert(mapTiles.length>=15&&mapTiles.some(row=>row.length===3),'Grade 7 students should show three MAP RIT subject tiles');
    assert(mapTiles.flat().every(tile=>/^\d{3}$/.test(tile.score)&&
     (/^[+\-]?\d+ RIT$/.test(tile.change)||tile.change==='No prior test')&&
     !tile.hasPill&&!tile.hasTitle&&tile.preview==='map-rit'),
     'MAP tiles must show RIT and growth, while percentile moves to one white hover preview');
    assert(headers.length>=12&&headers.some(h=>h.trim()==='Language & Literature'),'Expected subject names without Report prefixes');
   assert(await evaluate("document.querySelector('.roster-daily').getBoundingClientRect().top<innerHeight-80"),
    'The Faculty data wall should begin within the first viewport');
   assert(await evaluate("(function(){const row=document.querySelector('.faculty-data-wall tbody tr');return !!row&&row.getBoundingClientRect().top<innerHeight-55})()"),
    'At least the first learner row should appear within the desktop viewport');
   assert(await evaluate("document.querySelector('.top .brand-kicker')?.textContent.includes('LEARNING INTELLIGENCE')"),
    'The new product identity should be readable');

   assert(await evaluate("!!document.querySelector('.class-evidence-advanced:not([open])')"),
    'Everyday evidence options should begin collapsed');
   assert(await evaluate("!!document.querySelector('.faculty-demo-options:not([open])')"),
    'Demo staff selection should be secondary');
   assert(await evaluate("!!document.querySelector('.ux-faculty-table-controls:not([open])')"),
    'Table filters and saved views should not compete with the data wall');
   assert(await evaluate("!!document.querySelector('.faculty-evidence-legend')"),
    'Four evidence bands need a clear interpretation legend');
   assert(await evaluate("getComputedStyle(document.querySelector('.faculty-data-wall tbody td:first-child')).position==='sticky'"),
    'Learner names should stay visible during horizontal scrolling');
   assert(await evaluate("document.querySelectorAll('.faculty-data-wall tbody td[data-ux-sort-value]').length>=80"),
    'Evidence cells must provide raw values for sorting');
    const numericSort=await evaluate("(function(){const hs=[...document.querySelectorAll('.faculty-data-wall thead th')];const h=hs.find(th=>th.dataset.mapRitSubject==='Mathematics');if(!h)return false;const ix=Number(h.dataset.uxOrigin);const btn=h.querySelector('[data-ux-sort]');if(!btn)return false;btn.click();const v=[...document.querySelectorAll('.faculty-data-wall tbody tr')].map(tr=>[...tr.cells].find(td=>Number(td.dataset.uxOrigin)===ix)?.getAttribute('data-ux-sort-value')).filter(x=>x!==null&&x!=='').map(Number);return v.length>5&&v.every((n,i)=>i===0||n>=v[i-1])})()");
    assert(numericSort,'MAP Math RIT must sort by raw RIT score rather than colour or growth');

   assert(await evaluate("document.querySelectorAll('.roster-daily tbody .class-evidence-result').length>=20"),
    'Everyday columns should show per-learner values without extra clicks');
   const geometry=await evaluate("(function(){const row=document.querySelector('.roster-daily[data-roster-layout=everyday] tbody tr');if(!row)return [];return [...row.cells].slice(2,-1).map(td=>{const r=td.querySelector('.evidence-cell-open .class-evidence-result')?.getBoundingClientRect();return r?{width:r.width,height:r.height,top:r.top}:null}).filter(Boolean)})()");
    assert(geometry.length>=10,'Grade 7 must align current subject and non-MAP evidence tiles; the three MAP RIT tiles are checked separately above');
   for(const key of ['width','height','top'])assert(
    Math.max(...geometry.map(r=>r[key]))-Math.min(...geometry.map(r=>r[key]))<2,
    'Everyday evidence tiles must align in '+key);
   const cards=await evaluate("Array.from(document.querySelectorAll('.faculty-daily-summary>.quick-tile[class*=index-band-]')).map(e=>({noVisibleNumber:!e.querySelector('strong'),segments:e.querySelectorAll('.leader-experience-segments>span:not(.leader-experience-marker)').length,marker:!!e.querySelector('.leader-experience-marker')}))");
   assert(cards.length===2,'Engagement and Belonging summaries need value-driven colour bands');
   assert(cards.every(x=>x.noVisibleNumber&&x.segments===4&&x.marker),
    'Faculty summary should display four-colour scales without visible index numbers');

   const filterPlacement=await evaluate("(function(){const panel=document.querySelector('.class-evidence-panel');const f=panel?.querySelector(':scope > .faculty-concern-filter');const r=f?.getBoundingClientRect();return {inPanel:!!f,visible:!!r&&r.width>200&&r.height>25&&getComputedStyle(f).display!=='none',nearSwitch:!!f?.previousElementSibling?.classList.contains('class-roster-view-switch'),top:r?.top,firstRow:document.querySelector('.faculty-data-wall tbody tr')?.getBoundingClientRect().top}})()");
   assert(filterPlacement.inPanel&&filterPlacement.visible&&filterPlacement.nearSwitch,
    '3 or below filter must be visible beside everyday/focused controls, not in a hidden heading');
   assert(filterPlacement.top<filterPlacement.firstRow,
    'Faculty filter should be encountered before the learner rows');
   assert(await evaluate("document.querySelectorAll('.faculty-data-wall [data-ux-drag]').length>=8"),
    'Subject headings need drag handles');
   assert(await evaluate("document.querySelectorAll('.faculty-data-wall [data-ux-resize]').length>=8"),
    'Subject headings need resize handles');
   await click('[data-ux-customize-columns]');
   assert(await evaluate("(function(){const d=document.querySelector('.ux-faculty-table-controls');return !!d?.open&&!!d.querySelector('.ux-columns-menu')?.open})()"),
    'Arrange columns shortcut must open the editable column list');
   const moved=await evaluate("(function(){const t=document.querySelector('.faculty-data-wall'),a=t.querySelector('[data-ux-drag=\"2\"]'),b=t.querySelector('thead th[data-ux-origin=\"4\"]');if(!a||!b)return false;const before=t.querySelector('tbody tr td[data-ux-origin=\"2\"]').textContent;const d=new DataTransfer();a.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:d}));b.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:d}));b.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:d,clientX:b.getBoundingClientRect().right-2}));const h=[...t.querySelectorAll('thead th')].map(x=>x.dataset.uxOrigin),r=[...t.querySelector('tbody tr').cells].map(x=>x.dataset.uxOrigin);return h.indexOf('2')>h.indexOf('4')&&h.join(',')===r.join(',')&&t.querySelector('tbody tr td[data-ux-origin=\"2\"]').textContent===before})()");
   assert(moved,'Dragging a heading must also move its corresponding subject grades');
   await click('[data-ux-move-left="2"]');
   const compact=await evaluate("(function(){const e=document.querySelector('[data-ux-column-width=\"2\"]');e.value='compact';e.dispatchEvent(new Event('change',{bubbles:true}));return document.querySelector('.faculty-data-wall col[data-ux-origin=\"2\"]')?.style.width==='96px'})()");
   assert(compact,'Compact width preset must shrink the selected subject');
   const hidden=await evaluate("(function(){const e=document.querySelector('[data-ux-column=\"3\"]');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));return document.querySelector('.faculty-data-wall th[data-ux-origin=\"3\"]')?.hasAttribute('data-ux-column-hidden')})()");
   assert(hidden,'Subject hide option must remove the subject from the visible table');
   assert(await evaluate("(function(){const k=document.querySelector('.ux-table-shell[data-ux-table-key]')?.dataset.uxTableKey;const p=JSON.parse(localStorage.getItem('mylearners-faculty-columns-v1')||'{}')[k];return !!p&&p.hidden.includes(3)&&p.widths['2']===96})()"),
    'Faculty arrangement should persist on this device');
   await click('[data-ux-restore-columns]');
   assert(await evaluate("(function(){const t=document.querySelector('.faculty-data-wall'),h=[...t.querySelectorAll('thead th')].map(x=>Number(x.dataset.uxOrigin));return h.every((x,i)=>x===i)&&!t.querySelector('[data-ux-column-hidden]')})()"),
    'Restore default columns must undo drag, sizing and hiding');
   await evaluate("(function(){const e=document.querySelector('.ux-faculty-table-controls');if(e)e.open=false;window.scrollTo({top:0,behavior:'instant'})})()");
   const baselineCount=await evaluate("document.querySelectorAll('.roster-daily tbody .student-link').length");
   assert(await evaluate("!!document.querySelector('.class-evidence-panel [data-faculty-low-filter=\"3\"]')&&!!document.querySelector('.class-evidence-panel [data-faculty-low-filter=\"2\"]')"),
    'Both 3 or below and 2 or below must be visible in Faculty');
   await click('[data-faculty-low-filter="3"]');
   assert(await evaluate("document.querySelector('[data-faculty-low-filter=\"3\"]')?.getAttribute('aria-pressed')==='true'"),
    'Faculty 3 or below should activate');
   assert(await evaluate("getComputedStyle(document.querySelector('.class-evidence-panel [data-faculty-low-filter=\"3\"]')).backgroundColor==='rgb(228, 161, 95)'"),
    'Selected 3 or below control should be orange');
   const count3=await evaluate("document.querySelectorAll('.roster-daily tbody .student-link').length");
   assert(count3>0&&count3<=baselineCount,'3 or below should select a subset');
   await click('[data-faculty-low-filter="2"]');
   assert(await evaluate("document.querySelector('[data-faculty-low-filter=\"2\"]')?.getAttribute('aria-pressed')==='true'"),
    'Faculty 2 or below should activate');
   assert(await evaluate("getComputedStyle(document.querySelector('.class-evidence-panel [data-faculty-low-filter=\"2\"]')).backgroundColor==='rgb(166, 55, 63)'"),
    'Selected 2 or below control should be red');
   const count2=await evaluate("document.querySelectorAll('.roster-daily tbody .student-link').length");
   assert(count2>0&&count2<=count3,'2 or below must be a subset of 3 or below');
   await click('[data-faculty-low-filter="all"]');
   assert(await evaluate("document.querySelectorAll('.roster-daily tbody .student-link').length")===baselineCount,
    'All learners should be restored');
    await click('[data-roster-view="focused"]');
   assert(await evaluate("document.querySelector('.roster-daily')?.dataset.rosterLayout==='focused'"),
    'Focused evidence mode should remain available');
   await click('[data-roster-view="everyday"]');
   assert(await evaluate("document.querySelector('.roster-daily')?.dataset.rosterLayout==='everyday'"),
    'Teacher should be able to return to everyday measures');
  });
 await run('faculty-touch-evidence-960','faculty','.roster-daily[data-roster-layout="everyday"]',960,850,
  async()=>{
   const journey=await evaluate("(function(){const cell=document.querySelector('.roster-desktop .evidence-cell-open[data-evidence-preview=experience-cell]');if(!cell)return {error:'no cell'};const original=window.matchMedia;window.matchMedia=function(q){return q==='(pointer: coarse)'?{matches:true}:original.call(window,q)};try{cell.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const preview=!!document.querySelector('.evidence-preview-popup')&&!document.querySelector('.profile-head');cell.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const profile=!!document.querySelector('.profile-head');return {preview,profile}}finally{window.matchMedia=original}})()");
   assert(journey.preview,'First touch should reveal the check-in explanation without navigating');
   assert(journey.profile,'Second touch should open the learner profile');
   await click('[data-action="back"]');
   assert(await evaluate("!!document.querySelector('.roster-daily')"),
    'Returning from a touch preview should preserve the Faculty class view');
  });
 await run('faculty-profile-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{await click('.student-link');assert(await evaluate("!!document.querySelector('.profile-head')"),'Faculty profile did not open')});
 await run('sss-profile-1440','sss','.sss-overview',1440,900,
  async()=>{await click('[data-sss-student]');assert(await evaluate("!!document.querySelector('[data-sss-back]')"),'SSS detail did not open')});
 await run('student-reports-1440','student','.student-landing',1440,900,
  async()=>{await click('[data-student-panel="reports"] summary');
   assert(await evaluate("document.querySelector('[data-student-panel=\"reports\"]')?.open===true"),'Report card detail did not expand')});
 await run('leader-experience-colours-1440','leader','.leader-school-voice-grid',1440,900,
  async()=>{
   const v=await evaluate("(function(){const cards=[...document.querySelectorAll('.leader-school-voice')];return {groups:cards.length,gauges:cards.map(c=>c.querySelectorAll('.leader-experience-scale').length),segments:cards.map(c=>[...c.querySelectorAll('.leader-experience-segments')].map(x=>x.querySelectorAll('span:not(.leader-experience-marker)').length)),markers:cards.map(c=>c.querySelectorAll('.leader-experience-marker').length)}})()");
   const pulseOrder=await evaluate("[...document.querySelectorAll('.leader-schoolwide .leader-daily-grid .leader-daily-priority h3')].map(el=>el.textContent)");
   assert(pulseOrder.join('|')==='Secondary subjects ≤2|Attendance checks|Student Experience to review|Open support actions',
    'Whole-school Leaders pulse must prioritise academics, attendance and student experience');
   assert(v.groups===2&&v.gauges.every(n=>n===2),'Whole-school landing must keep division survey questions separate');
   assert(v.segments.every(row=>row.every(n=>n===4))&&v.markers.every(n=>n===2),
    'Both divisions need accessible red-to-green scales for each index');
  });
 await run('faculty-photo-confirmation-1440','faculty','.roster-desktop .student-photo-trigger',1440,900,
  async()=>{
   const result=await evaluate("(async()=>{const b=document.querySelector('.roster-desktop .student-photo-trigger');if(!b)return {error:'missing photo'};b.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));await new Promise(r=>setTimeout(r,180));const p=document.querySelector('.student-photo-preview:not([hidden])'),r=p?.getBoundingClientRect();return {shown:!!p,name:b.dataset.photoName,caption:p?.querySelector('figcaption strong')?.textContent,src:b.querySelector('img')?.src,largeSrc:p?.querySelector('img')?.src,within:!!r&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,otherEvidence:!!document.querySelector('.evidence-preview-popup')}})()");
   assert(result.shown&&result.caption===result.name&&result.largeSrc===result.src,
    'Hovering the learner portrait should enlarge the exact same picture with their name below');
   assert(result.within&&!result.otherEvidence,
    'Floating portrait must stay in viewport and not compete with the academic evidence popup');
   const before=await evaluate('location.hash');
   await click('.roster-desktop .student-photo-trigger');
   assert(await evaluate("!!document.querySelector('.student-photo-preview:not([hidden])')"),
    'Click should pin the image for touch and keyboard users');
   assert((await evaluate('location.hash'))===before&&!await evaluate("!!document.querySelector('.profile-head')"),
    'Inspecting a photo must not navigate to the learner profile');
   await click('.roster-desktop .student-link');
   assert(await evaluate("!!document.querySelector('.profile-head .student-photo-trigger')"),
    'Learner profile should retain the photo enlargement control');
  });
 await run('faculty-photo-touch-390','faculty','.roster-mobile .student-photo-trigger',390,820,
  async()=>{
   await click('.roster-mobile .student-photo-trigger');
   assert(await evaluate("!!document.querySelector('.student-photo-preview:not([hidden])')"),
    'Tap should enlarge the portrait on mobile');
   assert(await evaluate("!document.querySelector('.profile-head')"),
    'Tapping the portrait must not open the learner');
   await click('.roster-mobile .roster-item-main[data-student]');
   assert(await evaluate("!!document.querySelector('.profile-head')"),
    'The separate mobile learner-name/action should still open the learner profile');
  });
 await run('leader-photo-confirmation-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   assert(await evaluate("document.querySelectorAll('.leader-review-table .student-photo-trigger').length>=6"),
    'The Leaders daily learner queue should include portrait thumbnails');
   await click('[data-leader-academic-focus="map"]');
   assert(await evaluate("document.querySelectorAll('.leader-academic-row .student-photo-trigger').length>=1"),
    'Academic Follow-up MAP list should include enlargable student photographs');
   const name=await evaluate("document.querySelector('.leader-academic-row .student-photo-trigger')?.dataset.photoName");
   await click('.leader-academic-row .student-photo-trigger');
   const portraitDebug=await evaluate("(function(){const p=document.querySelector('.student-photo-preview'),t=document.querySelector('.leader-academic-row .student-photo-trigger');return {expected:t?.dataset.photoName,found:p?.querySelector('figcaption strong')?.textContent,hidden:p?.hidden,visible:!!document.querySelector('.student-photo-preview:not([hidden])'),present:!!p,html:p?.outerHTML?.slice(0,600),trigger:t?.outerHTML?.slice(0,350)}})()");
   assert(portraitDebug.found===name&&portraitDebug.visible,
    'Leaders should see the exact learner name below the enlarged photo. Details: '+JSON.stringify(portraitDebug));
   assert(await evaluate("!document.querySelector('.leader-learner-profile')"),
    'Opening a portrait must not accidentally navigate');
   await click('.leader-academic-row [data-leader-student]');
   assert(await evaluate("!!document.querySelector('.leader-learner-profile .student-photo-trigger')"),
    'Leader profile should also have an enlargable portrait');
   assert(await evaluate("document.querySelector('[data-leader-back]')?.textContent.includes('Academic Follow-up')"),
    'Return action should name the exact originating list');
   await click('[data-leader-back]');
   assert(await evaluate("!!document.querySelector('#leader-academic-results:not([hidden])')"),
    'Returning from learner profile must preserve the active filtered list');
  });
 await run('leader-secondary-daily-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   assert(await evaluate("!!document.querySelector('.leader-academic-action.subjects')&&!!document.querySelector('.leader-review-table')"),
    'Secondary daily screen needs visible subject concerns and a learner review queue');
   assert(await evaluate("document.querySelectorAll('[data-leader-grade]').length>=8"),
    'Secondary needs Grades 6–12 drilldowns');
   const order=await evaluate("(function(){const sections=[...document.querySelectorAll('#leader-learning-title,#leader-review,#leader-experience-title')];const cards=[...document.querySelectorAll('#leader-daily-priorities .leader-daily-grid .leader-priority-label')].map(x=>x.textContent.trim());return {sections:sections.map(x=>x.id),cards}})()");
   assert(order.sections.join('|')==='leader-learning-title|leader-review|leader-experience-title',
    'Academics section must be before Attendance review and Engagement/Belonging, regardless of division');
   assert(order.cards.join('|')==='Attendance checks|Student Experience to review|Open support actions',
    'Daily summary must follow the same leadership priority order');
   assert(await evaluate("!!document.querySelector('#leader-experience-review')&&!!document.querySelector('[data-leader-academic-focus=map]')"),
    'Student Experience and MAP achievement lists must have direct visible entry points');
   assert(await evaluate("!!document.querySelector('[data-leader-jump=leader-experience-review]')&&!!document.querySelector('[data-leader-academic-focus=map]')"),
    'MAP and student voice review should both have direct accessible actions');
   assert(await evaluate("!document.querySelector('.leader-daily-source')?.textContent.includes('through')"),
    'Attendance date captions should not be needed in the Leadership tile summaries');
   const review=await evaluate("(function(){const v=document.querySelector('#leader-experience-review');return {voice:!!v&&v.textContent.includes('0 or below'),links:[...document.querySelectorAll('.leader-followup-open')].length,validVoice:[...v.querySelectorAll('.leader-followup-item')].every(row=>!!row.querySelector('.leader-followup-index.is-low'))}})()");
   assert(review.voice&&review.validVoice,
    'Experience review must still use the independent ≤0 index threshold');
   await click('[data-leader-jump="leader-experience-review"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-experience')?.hidden"),
    'Student Experience card must activate the correct focused panel');
   if(review.links){
    const target=await evaluate("document.querySelector('.leader-followup-panel [data-leader-student]')?.dataset.leaderStudent");
    if(target){
     await click('.leader-followup-panel [data-leader-student]');
     assert(await evaluate("!!document.querySelector('.leader-learner-profile')"),
      'A review cue must open that same learner in the read-only Leaders profile');
     await click('[data-leader-back]');
    }
   }
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-academic-one-click-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   const cards=await evaluate("(function(){return [...document.querySelectorAll('.leader-academic-action')].map(x=>({kind:x.dataset.leaderAcademicFocus,expanded:x.getAttribute('aria-expanded'),count:x.querySelector('.leader-academic-action-top strong')?.textContent}))})()");
   assert(cards.map(x=>x.kind).join('|')==='map|subjects'&&cards.every(x=>x.expanded==='false'),
    'Academic Follow-up must offer both MAP Low and subject ≤2 as the first two actions');
   assert(await evaluate("document.querySelector('.leader-academic-actions')?.compareDocumentPosition(document.querySelector('.leader-daily-grid'))&Node.DOCUMENT_POSITION_FOLLOWING"),
    'Academic actions must appear before attendance and student voice tiles');
   await click('[data-leader-academic-focus="map"]');
   assert(await evaluate("document.querySelector('#leader-academic-results:not([hidden])')?.textContent.includes('MAP achievement — Red + Orange')"),
    'Single MAP card click should immediately open the combined Red and Orange student list');
   assert(await evaluate("document.querySelector('.leader-academic-row .student-photo-trigger')&&document.querySelector('.leader-academic-row [data-leader-student]')"),
    'Rapid MAP list must include photos and profile actions');
   const check=()=>evaluate("(function(){const t=[...document.querySelectorAll('#leader-academic-results .leader-academic-evidence-chip span')];const p=t.map(x=>Number(x.textContent.match(/P(\\d+)/)?.[1]));return {p,orange:document.querySelectorAll('#leader-academic-results .leader-academic-evidence-chip.map-low-average').length,red:document.querySelectorAll('#leader-academic-results .leader-academic-evidence-chip.map-low:not(.map-low-average)').length,ids:[...document.querySelectorAll('#leader-academic-results [data-leader-student]')].map(x=>x.dataset.leaderStudent)}})()");
   const combined=await check();
   assert(combined.p.length>0&&combined.p.every(p=>p>=1&&p<=40)&&combined.orange>0&&combined.red>0,
    'Combined MAP list must include both Red P1–20 and Orange P21–40 with distinct chips');
   assert(new Set(combined.ids).size===combined.ids.length,'Combined list must never duplicate a student');
   const bands=await evaluate("(function(){return [...document.querySelectorAll('[data-leader-map-band]')].map(x=>({band:x.dataset.leaderMapBand,pressed:x.getAttribute('aria-pressed'),count:Number(x.querySelector('b')?.textContent)}))})()");
   assert(bands.length===3&&bands[0].band==='both'&&bands[0].pressed==='true',
    'MAP band filter must provide Both, Red and Orange selections');
   assert(bands[0].count<=bands[1].count+bands[2].count,
    'Combined count is unique students, not sum of independent band counts');
   await click('[data-leader-map-band="low-average"]');
   const orange=await check();
   assert(orange.p.length>0&&orange.p.every(p=>p>=21&&p<=40)&&orange.red===0,
    'Orange selection must show only P21–40 Low Average MAP achievement');
   assert(await evaluate("document.querySelector('[data-leader-map-band=low-average]')?.getAttribute('aria-pressed')==='true'"),
    'Orange band button must reflect its selected state');
   await click('[data-leader-map-band="low"]');
   const red=await check();
   assert(red.p.length>0&&red.p.every(p=>p>=1&&p<=20)&&red.orange===0,
    'Red selection must show only P1–20 Low MAP achievement');
   await click('[data-leader-map-band="both"]');
   const again=await check();
   assert(again.orange>0&&again.red>0,
    'Selecting Both must restore red and orange MAP chips together');
   await click('[data-leader-academic-focus="subjects"]');
   assert(await evaluate("document.querySelector('#leader-academic-results:not([hidden])')?.textContent.includes('Subject results ≤2')"),
    'Switching to subject review should show the ≤2 learner list without opening another panel');
   const grades=await evaluate("Array.from(document.querySelectorAll('#leader-academic-results .leader-academic-evidence-chip span')).map(x=>x.textContent)");
   assert(grades.length>0&&grades.every(v=>Number(v.match(/(\d+)\s*\/\s*7/)?.[1])<=2),
    'Subject action must only display numeric 1–7 grades at or below 2');
   await click('[data-leader-academic-multiple]');
   assert(await evaluate("document.querySelector('[data-leader-academic-multiple]')?.getAttribute('aria-pressed')==='true'"),
    'Two-or-more-subjects filter must work');
   const firstGrade=await evaluate("document.querySelector('[data-leader-academic-grade]')?.options?.[1]?.value||''");
   if(firstGrade){
    await evaluate("(function(){const s=document.querySelector('[data-leader-academic-grade]');s.value=Array.from(s.options).find(o=>o.value)?.value||'';s.dispatchEvent(new Event('change',{bubbles:true}))})()");
    assert(await evaluate("!!document.querySelector('#leader-academic-results')"),
     'Grade selection must preserve direct Academic Follow-up');
   }
   await click('[data-leader-academic-close]');
   assert(await evaluate("document.querySelector('#leader-academic-results')?.hidden===true"),
    'Close should collapse the focus without leaving the divisional workspace');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-map-journeys-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   assert(await evaluate("!!document.querySelector('[data-leader-jump=leader-map-journeys]')"),
    'Academic Follow-up should provide a MAP Journeys entry point');
   await click('[data-leader-jump=leader-map-journeys]');
   assert(await evaluate("!!document.querySelector('#leader-map-journeys')&&document.querySelector('#map-journeys-title')?.textContent.includes('MAP Journeys')"),
    'MAP Journeys must open as an integrated Leaders section');
   const initial=await evaluate("(function(){const root=document.querySelector('#leader-map-journeys');const controls=[...root.querySelectorAll('.map-journey-filters select')].map(x=>x.value);const summary=[...root.querySelectorAll('.map-journey-kpis>div strong')].map(x=>Number(x.textContent));const matrix=[...root.querySelectorAll('.map-journey-matrix tbody .map-journey-matrix-cell')].map(x=>Number(x.textContent));return {controls,summary,matrix,rows:root.querySelectorAll('.map-journey-student-list li').length,names:root.textContent.includes('FICTIONAL DATA')}})()");
   assert(initial.controls.join('|')==='Reading|F22|F26|both|average-plus',
    'Default journey should compare like-for-like Fall tests across Elementary and Secondary');
   assert(initial.summary[0]>0&&initial.matrix.reduce((a,b)=>a+b,0)===initial.summary[0],
    'Transition matrix total must equal matched learners, with no duplicates');
   assert(initial.summary[1]>=initial.summary[3]&&initial.names,
    'Starting cohort and selected transition counts must use fictional matched learners');
   const activeCell=await evaluate("document.querySelector('#leader-map-journeys .map-journey-matrix-cell:not([disabled])')?.dataset.mapJourneyCell");
   assert(activeCell,'At least one transition cell should be populated in the fictional cohort');
   await click('[data-map-journey-cell="'+activeCell+'"]');
   const afterCell=await evaluate("(function(){const [from,to]=document.querySelector('.map-journey-matrix-cell.is-active')?.dataset.mapJourneyCell.split('|')||[];return {from,to,start:document.querySelector('[data-map-journey-starting-band]')?.value,end:document.querySelector('[data-map-journey-current-band]')?.value,visible:document.querySelectorAll('.map-journey-student-list li').length}})()");
   assert(afterCell.from===afterCell.start&&afterCell.to===afterCell.end&&afterCell.visible>0,
    'Clicking a transition cell must filter exactly to those matched students');
   assert(await evaluate("!!document.querySelector('.map-journey-open[data-leader-student]')"),
    'Transition list needs direct learner-profile actions');
   await click('.map-journey-open[data-leader-student]');
   assert(await evaluate("!!document.querySelector('.leader-learner-profile .map-journey-profile')"),
    'Student journey must be visible in the individual Leaders profile');
   assert(await evaluate("!!document.querySelector('.leader-learner-profile .map-journey-chart[role=img]')"),
    'Student journey should display an accessible percentile trajectory graph');
   await click('[data-map-journey-profile-subject="Mathematics"]');
   assert(await evaluate("document.querySelector('[data-map-journey-profile-subject=Mathematics]')?.getAttribute('aria-pressed')==='true'"),
    'Individual journey subject tabs must switch without leaving the learner');
   await click('[data-leader-back]');
   assert(await evaluate("!!document.querySelector('#leader-map-journeys')"),
    'Returning to Leaders should preserve the cohort journey area');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-map-journeys-mobile-390','leader','.leader-division-grid',390,820,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   await click('[data-leader-jump="leader-map-journeys"]');
   assert(await evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
    'MAP Journeys must not add page-wide horizontal overflow on mobile');
   assert(await evaluate("!!document.querySelector('.map-journey-matrix-scroll')&&!!document.querySelector('[data-map-journey-pathway]')"),
    'Mobile should provide a scrollable matrix and grade-pathway filters');
   await click('[data-map-journey-refine]');
   assert(await evaluate("!document.querySelector('#map-journey-advanced')?.hidden"),
    'Advanced comparison controls should become visible only when requested');
   await click('[data-map-journey-pathway="all"]');
   assert(await evaluate("document.querySelector('[data-map-journey-pathway=all]')?.getAttribute('aria-pressed')==='true'"),
    'All grades pathway must be selectable');
   await evaluate("(function(){const el=document.querySelector('[data-map-journey-subject]');el.value='Mathematics';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
   assert(await evaluate("document.querySelector('[data-map-journey-subject]')?.value==='Mathematics'"),
    'MAP subject selection must update the cohort model');
   assert(await evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
    'Changing MAP journey filters must keep the mobile page within the viewport');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-focus-tabs-and-saved-context-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   let tabs=await evaluate("(function(){const buttons=[...document.querySelectorAll('.leader-focus-nav [role=tab]')];return {labels:buttons.map(x=>x.textContent.trim()),selected:buttons.filter(x=>x.getAttribute('aria-selected')==='true').map(x=>x.dataset.leaderFocus),panels:[...document.querySelectorAll('.leader-focus-panel')].filter(x=>!x.hidden).map(x=>x.id)}})()");
   assert(tabs.labels.join('|')==='Follow-up|MAP Journeys|Academic Trends|Student Experience|Support'&&
    tabs.selected.join('|')==='follow-up'&&tabs.panels.join('|')==='leader-focus-panel-follow-up',
    'Default Leaders page must show one focused follow-up panel with five clear navigation tabs');
   assert(await evaluate("document.querySelector('.leader-source-details')?.open===false"),
    'Metadata belongs in an expandable Evidence sources and dates group');
   await click('[data-leader-focus="journeys"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-journeys')?.hidden&&document.querySelector('#leader-focus-panel-follow-up')?.hidden"),
    'Journeys tab should show the historical view without a second long attendance page');
   assert(await evaluate("document.querySelector('.map-journey-active-context')?.textContent.includes('Reading')"),
    'Active MAP comparison context must stay visible when advanced controls are hidden');
   await click('[data-map-journey-preset="continuing"]');
   assert(await evaluate("document.querySelector('[data-map-journey-current-band]')?.value==='below-average'"),
    'Preset for learners staying in lower bands should select P1–40 destination');
   await click('[data-map-journey-refine]');
   assert(await evaluate("document.querySelector('#map-journey-advanced')?.hidden===false"),
    'Advanced MAP controls should open only on demand');
   await evaluate("(function(){const s=document.querySelector('[data-map-journey-subject]');s.value='Mathematics';s.dispatchEvent(new Event('change',{bubbles:true}))})()");
   assert(await evaluate("document.querySelector('[data-map-journey-subject]')?.value==='Mathematics'"),
    'Refined subject should persist in a custom MAP journey');
   await click('[data-leader-save-view]');
   assert(await evaluate("document.querySelector('.leader-save-view [role=status]')?.textContent.includes('Saved')"),
    'Save should confirm that only presentation and filter preferences were stored');
   await click('[data-leader-division="All"]');
   await click('[data-leader-open-saved]');
   assert(await evaluate("document.querySelector('[data-leader-focus=journeys]')?.getAttribute('aria-selected')==='true'"),
    'Reopen saved layout should restore the selected investigation tab');
   assert(await evaluate("document.querySelector('[data-map-journey-subject]')?.value==='Mathematics'"),
    'Reopen saved layout should restore the MAP subject, not merely grade and division');
   assert(await evaluate("document.querySelector('[data-map-journey-current-band]')?.value==='below-average'"),
    'Reopen saved layout should restore the longitudinal comparison band');
   await click('[data-leader-focus="academics"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-academics')?.hidden&&document.querySelector('#leader-focus-panel-journeys')?.hidden"),
    'Academic Trends should be independently navigable');
   await click('[data-leader-focus="experience"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-experience')?.hidden"),
    'Student Experience data should have its own focused panel');
   await click('[data-leader-focus="support"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-support')?.hidden"),
    'Support processes should have their own focused panel');
   await click('[data-leader-focus="follow-up"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-follow-up')?.hidden"),
    'Follow-up must return to actionable student and attendance lists');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-clickable-priorities-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   const tileCheck=await evaluate("(function(){const b=[...document.querySelectorAll('#leader-daily-priorities .leader-daily-grid .leader-daily-priority')];return {length:b.length,buttons:b.every(x=>x.tagName==='BUTTON'),nested:b.some(x=>x.querySelector('button')),legacy:b.some(x=>x.textContent.includes('Review evidence'))}})()");
   assert(tileCheck.length===3&&tileCheck.buttons&&!tileCheck.nested&&!tileCheck.legacy,
    'Attendance, voice and support tiles must be full accessible buttons without Review evidence links');
   await click('[data-leader-attendance-focus]');
   assert(await evaluate("document.querySelector('[data-leader-review-filter=attendance]')?.getAttribute('aria-pressed')==='true'"),
    'Clicking the whole attendance tile should open its filtered learner review');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-academic-touch-390','leader','.leader-division-grid',390,820,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   await click('[data-leader-academic-focus="map"]');
   const result=await evaluate("(function(){const box=document.querySelector('#leader-academic-results'),r=box?.getBoundingClientRect();return {visible:box&&!box.hidden,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,top:r?.top}})()");
   assert(result.visible&&result.scrollWidth<=result.viewport+2,
    'Mobile MAP review must open directly without horizontal page overflow');
   await click('[data-leader-map-band="low-average"]');
   assert(await evaluate("document.querySelector('[data-leader-map-band=low-average]')?.getAttribute('aria-pressed')==='true'"),
    'Mobile should support the Orange Low Average band filter');
   assert(await evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
    'Mobile MAP band controls must not cause horizontal overflow');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-filter-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   await click('[data-leader-grade="G7"]');
   assert(await evaluate("document.querySelector('.leader-division-hero h2')?.textContent.includes('Grade 7')"),
    'Grade 7 drilldown must change scope');
   await click('[data-leader-focus="academics"]');
   assert(await evaluate("!document.querySelector('#leader-focus-panel-academics')?.hidden"),
    'Academic Trends tab should show detailed subject evidence');
   assert(await evaluate("!!document.querySelector('.leader-report-followup')"),
    'Secondary detailed subject review must remain available');
   assert(await evaluate("document.querySelectorAll('.leader-report-legend-chip').length===4"),
    'Report legend needs all four fixed outcome colours');
   await click('[data-leader-panel="report"] summary');
   await click('[data-leader-report-threshold="2"]');
   assert(await evaluate("document.querySelector('.leader-report-followup h2')?.textContent.includes('2 or below')"),
    'Secondary detailed review should support 2 or below');
   await click('[data-leader-report-threshold="3"]');
   assert(await evaluate("document.querySelector('.leader-report-followup h2')?.textContent.includes('3 or below')"),
    'Secondary detailed review should support 3 or below');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-dp-grade12-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Secondary"]');
   await click('[data-leader-grade="G12"]');
   await click('[data-leader-focus="academics"]');
   const v=await evaluate("(function(){const cards=[...document.querySelectorAll('.leader-learning-grid .leader-stat')];return {dp:cards.some(x=>x.textContent.includes('DP subject results')),map:cards.some(x=>x.textContent.includes('MAP')),queue:!!document.querySelector('[data-leader-review-filter=academic2]')}})()");
   assert(v.dp&&!v.map&&v.queue,'Grade 12 needs DP evidence, not unavailable MAP cards');
   await click('[data-leader-focus="follow-up"]');
   await click('[data-leader-review-filter="academic2"]');
   await click('[data-leader-student]');
   assert(await evaluate("!!document.querySelector('.leader-learner-profile')"),
    'Review should navigate to permitted read-only learner evidence');
   assert(await evaluate("!document.querySelector('[data-support-new]')&&!document.querySelector('[data-sss-student]')"),
    'Leaders should not expose protected casework controls');
   await click('[data-leader-back]');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('leader-elementary-1440','leader','.leader-division-grid',1440,900,
  async()=>{
   await click('[data-leader-division="Elementary"]');
   const sections=await evaluate("[...document.querySelectorAll('#leader-learning-title,#leader-review,#leader-experience-title')].map(el=>el.id)");
   assert(sections.join('|')==='leader-learning-title|leader-review|leader-experience-title',
    'Elementary should also follow Academics → Attendance → Student Experience');
   assert(await evaluate("!!document.querySelector('.leader-daily-priority.blue')&&!document.querySelector('[data-leader-review-filter=academic2]')"),
    'Elementary must have an age-appropriate literacy lens instead of Secondary thresholds');
   await click('[data-leader-grade="G4"]');
   assert(await evaluate("document.querySelector('.leader-division-hero h2')?.textContent.includes('Grade 4')"),
    'Elementary grade drilldown should work');
   await click('[data-leader-save-view]');
   await click('[data-leader-division="All"]');
   assert(await evaluate("!!document.querySelector('[data-leader-open-saved]')"),
    'Saved leadership view should be available by explicit action');
   await click('[data-leader-open-saved]');
   assert(await evaluate("document.querySelector('.leader-division-hero h2')?.textContent.includes('Grade 4')"),
    'Saved view should restore selected division and grade');
   await evaluate('window.scrollTo(0,0)');
  });
 await run('faculty-map-tab-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="map"]');
   assert(await evaluate("document.querySelector('[data-class-evidence=\"map\"]')?.getAttribute('aria-pressed')==='true'"),
    'MAP evidence tab not active');
   assert(await evaluate("!!document.querySelector('[data-map-subject]')"),
    'MAP subject picker missing');
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('MAP Mathematics growth')"),
    'Roster not showing selected MAP measure');
   const changed=await evaluate("(function(){const s=document.querySelector('[data-map-subject]');s.value='Reading';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(changed,'MAP Reading could not be selected');await sleep(140);
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('MAP Reading growth')"),
    'Roster MAP subject change not applied');
  });
 await run('faculty-engagement-tab-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="engagement"]');
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('Engagement')"),
    'Engagement tab did not update roster');
   assert(await evaluate("document.querySelector('.class-evidence-panel')?.textContent.includes('Maia-style PERMA examples')"),
    'Maia context missing');
  });
 await run('faculty-belonging-tab-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="belonging"]');
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('Belonging')"),
    'Belonging tab did not update roster');
  });
 await run('faculty-maia-perma-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="flourishing"]');
   assert(await evaluate("!!document.querySelector('[data-maia-dimension]')"),
    'Maia domain selector missing');
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('Maia · Relationships · Fall 2026')"),
    'Maia Relationships example not shown in roster');
   assert(await evaluate("document.querySelector('.roster-daily tbody')?.textContent.includes('illustrative PERMA value')"),
    'Synthetic per-student Maia dimension values missing');
   assert(await evaluate("document.querySelector('.class-evidence-panel')?.textContent.includes('Fictional Maia example')"),
    'Synthetic vendor example disclosure missing');
   const ok=await evaluate("(function(){const s=document.querySelector('[data-maia-dimension]');s.value='meaning';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(ok,'Could not change Maia PERMA domain');await sleep(140);
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('Maia · Meaning')"),
    'Maia dimension change did not reach roster');
  });
 await run('faculty-maia-comparison-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="map"]');
   const ok=await evaluate("(function(){const s=document.querySelector('[data-class-compare]');s.value='flourishing';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(ok,'Maia comparison selector unavailable');await sleep(160);
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('MAP')&&document.querySelector('.roster-daily thead')?.textContent.includes('Maia')"),
    'MAP and Maia should appear as separate columns');
   assert(await evaluate("!!document.querySelector('[data-maia-window]')&&!!document.querySelector('[data-maia-dimension]')"),
    'Maia comparison dimension/time selectors unavailable');
  });
 await run('faculty-maia-profile-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('.student-link');
   assert(await evaluate("!!document.querySelector('[data-maia-profile]')"),
    'Secondary learner profile missing Maia dimensions');
   await click('[data-maia-profile] summary');
   assert(await evaluate("document.querySelector('[data-maia-profile]')?.open===true"),
    'Maia dimension details did not expand');
   assert(await evaluate("document.querySelectorAll('.maia-dimension').length===5"),
    'Five PERMA domain values required');
   await click('[data-action="back"]');
   assert(await evaluate("!!document.querySelector('.faculty-daily-toolbar')"),'Back to Faculty class roster failed');
  });
 await run('faculty-elementary-only-evidence-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   assert(await evaluate("!document.querySelector('[data-class-evidence=\"commoncore\"]')"),
    'Common Core must not appear in any class');
   assert(await evaluate("!document.querySelector('[data-class-evidence=\"core\"]')"),
    'Core Phonics must not appear for Grade 7');
   assert(await evaluate("!document.querySelector('[data-class-evidence=\"fp\"]')"),
    'F&P Reading must not appear for Grade 7');
  });

 await run('faculty-side-by-side-map-belonging-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="map"]');
   const chosen=await evaluate("(function(){const s=document.querySelector('[data-class-compare]');if(!s)return false;s.value='belonging';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(chosen,'Compare with selector missing');
   await sleep(150);
   assert(await evaluate("document.querySelectorAll('.roster-daily thead th').length===5"),
    'Expected learner, attendance, MAP, belonging, support columns');
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('MAP')&&document.querySelector('.roster-daily thead')?.textContent.includes('Belonging')"),
    'Both selected measures must appear as independent roster columns');
   assert(await evaluate("document.querySelectorAll('.class-evidence-selection.has-comparison .class-evidence-selected').length===2"),
    'Two measure coverage summaries should be visible');
  });
 await run('faculty-checkin-period-compare-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-class-evidence="engagement"]');
   const chosen=await evaluate("(function(){const s=document.querySelector('[data-class-compare]');if(!s)return false;s.value='belonging';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(chosen,'Cannot choose a second wellbeing measure');
   const period=await evaluate("(function(){const s=document.querySelector('[data-class-window]');if(!s)return false;s.value='S26';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(period,'Check-in period picker missing');
   await sleep(160);
   const focusedHeaders=await evaluate("Array.from(document.querySelectorAll('.roster-daily thead th')).map(th=>th.textContent.trim())");
   assert(focusedHeaders.includes('Engagement')&&focusedHeaders.includes('Belonging'),
    'Focused Faculty headers should show measure names only, without repeated dates');
   assert(!focusedHeaders.some(h=>h.includes('Spring 2026')),
    'The selected check-in window belongs in the controls, not column headings');
   assert(await evaluate("document.querySelector('[data-class-window]')?.value==='S26'&&document.querySelector('.class-evidence-selection')?.textContent.includes('Spring 2026')"),
    'The selected Spring window must remain clearly visible in Faculty evidence controls');
   assert(await evaluate("Array.from(document.querySelectorAll('.roster-daily [data-evidence-preview=experience-cell]')).every(el=>!el.hasAttribute('data-preview-window'))"),
    'Hover previews must derive the chosen window from Faculty state rather than fixed heading text');
   assert(await evaluate("document.querySelector('.roster-daily tbody')?.textContent.includes('Spring 2026')"),
    'Comparison cells should show their source period');
  });
 await run('faculty-grade-12-fixed-bands-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{
   await click('[data-roster-view="everyday"]');
   const changed=await evaluate("(function(){const s=document.querySelector('[data-select=class]');if(!s)return false;s.value='G12-A';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(changed,'A Secondary Grade 12 demo class must be selectable');
   await sleep(190);
   const legend=await evaluate("document.querySelector('.faculty-evidence-legend')?.textContent||''");
    assert(legend.includes('Report card grades 1–7')&&legend.includes('Other measures are colour-only'),'Grade 12 should distinguish numeric reports from experience indices');
   assert(!legend.includes('Q1'),'Grade 12 should not be told its experience index uses academic quartiles');
   const grade12Headings=await evaluate("Array.from(document.querySelectorAll('.roster-daily thead th')).map(th=>th.textContent.trim())");
   assert(grade12Headings.includes('Engagement')&&grade12Headings.includes('Belonging'),
    'Grade 12 must use the same compact experience column headings');
  });
 await run('faculty-one-measure-reset-960','faculty','.faculty-daily-toolbar',960,850,
  async()=>{
   const switched=await evaluate("(function(){const s=document.querySelector('[data-class-compare]');if(!s)return false;s.value='none';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(switched,'Cannot turn comparison off');
   await sleep(150);
   assert(await evaluate("!document.querySelector('.class-evidence-selection.has-comparison')"),
    'Default view should return to one simple measure');
  });
}finally{
 await writeFile(path.join(OUT,'walkthrough-report.json'),JSON.stringify({
  executedAt:new Date().toISOString(),root:ROOT,cases,browserExceptions:client.exceptions
 },null,2));
 client.close();
}
console.log('COMPLETE '+cases.filter(c=>c.status==='pass').length+'/'+cases.length+
 ' screenshot checks passed; browser exceptions='+client.exceptions.length);
if(client.exceptions.length){for(const e of client.exceptions.slice(0,10))console.warn(e);failed=true}
if(failed)process.exitCode=1;
