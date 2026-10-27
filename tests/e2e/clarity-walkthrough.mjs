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
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'Browser evaluation failed');
 return r.result?.value;
}
async function viewport(width,height){
 await client.command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
}
async function navigate(route,selector){
 await client.command('Page.navigate',{url:ROOT+'#/'+route});
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
 const overlap=wide&&navRect&&mainRect?mainRect.left<navRect.right-4:false;
 const clipped=labels.some(x=>x.r.left<0||x.r.right>innerWidth+1||x.r.top<0||x.r.bottom>innerHeight+1);
 const cards=[...document.querySelectorAll('.board-overview-cards .board-overview-card')].map(rect);
 const collisions=cards.some((r,i)=>cards.slice(i+1).some(s=>
  Math.min(r.right,s.right)-Math.max(r.left,s.left)>8&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>8));
 const visible=heading&&rect(heading).width>0&&rect(heading).top>=-1;
 const stylesheet=[...document.querySelectorAll('link[rel=stylesheet]')].some(x=>x.href.includes('clarity-design.css')&&x.sheet);
 return {role:document.querySelector('.roles [aria-pressed=true]')?.textContent.trim()||'',
  viewport:{width:innerWidth,height:innerHeight},navigationPosition:rail,
  canvas:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,
  mainRect,navRect,navButtons:labels.map(x=>x.name),
  horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
  navClipped:clipped,overlappingNavigation:overlap,overlappingBoardCards:collisions,
  visibleHeading:!!visible,clarityLoaded:!!stylesheet,
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
  assert(record.visibleHeading,'Heading is not visible');
  assert(!record.overlappingNavigation,'Sidebar overlaps dashboard content');
  assert(!record.navClipped,'Navigation contains offscreen buttons');
  assert(!record.overlappingBoardCards,'Board overview cards overlap');
  assert(record.horizontalOverflow<=4,'Document overflows horizontally by '+record.horizontalOverflow+'px');
  assert(record.focusables>=5,'No working interactive controls found');
  if(width>=1180)assert(record.navigationPosition==='fixed','Desktop side rail not fixed');
  if(width<1180)assert(record.navigationPosition!=='fixed','Compact navigation is a sidebar');
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
   ['sss','.sss-overview'],['leader','.leader-learning-grid'],['board','.board-view']
  ])await run(role+'-'+screen,role,selector,width,height);
 }
 await run('board-map-1440','board?view=explore&window=fall2026&subject=math','.board-controls',1440,900);
 await run('board-dp-1440','board?view=dp&metric=average','.board-dp',1440,900);
 await run('board-dp-global-2025-1440','board?view=dp&metric=average','.board-dp',1440,900,
  async()=>{
   const select=await evaluate("(function(){const s=document.querySelector('[data-board-dp-select=\"year\"]');s.value='2025';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(select,'DP graduation year selector missing');await sleep(180);
   assert(await evaluate("document.querySelector('.board-dp-comparison-panel')?.textContent.includes('33.66')"),
    'The authoritative Class of 2025 average must be 33.66');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('30.58')"),
    'The 2025 world Diploma average should be visible');
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
 await run('board-dp-2026-provenance-1440','board?view=dp&metric=average','.board-dp',1440,900,
  async()=>{
   assert(await evaluate("document.querySelector('.board-dp-status')?.textContent.includes('confirmation pending')"),
    '2026 AISG school results must remain clearly unconfirmed');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('30.88')"),
    'May 2026 world average from IB not visible');
   assert(await evaluate("document.querySelector('.board-dp-world-strip')?.textContent.includes('2026 examination cohort not confirmed')"),
    'No 2026 examination denominator can be invented');
  });

 await run('faculty-profile-1440','faculty','.faculty-daily-toolbar',1440,900,
  async()=>{await click('.student-link');assert(await evaluate("!!document.querySelector('.profile-head')"),'Faculty profile did not open')});
 await run('sss-profile-1440','sss','.sss-overview',1440,900,
  async()=>{await click('[data-sss-student]');assert(await evaluate("!!document.querySelector('[data-sss-back]')"),'SSS detail did not open')});
 await run('student-reports-1440','student','.student-landing',1440,900,
  async()=>{await click('[data-student-panel="reports"] summary');
   assert(await evaluate("document.querySelector('[data-student-panel=\"reports\"]')?.open===true"),'Report card detail did not expand')});
 await run('leader-filter-1440','leader','.leader-learning-grid',1440,900,
  async()=>{const ok=await evaluate("(function(){const s=document.querySelector('[data-select=\"grade\"]');if(!s)return false;s.value='G7';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
   assert(ok,'Grade filter missing');await sleep(150);
   assert(await evaluate("document.querySelector('.leader-period')?.textContent.includes('Grade 7')"),'Grade filter did not update')});
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
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('Engagement · Spring 2026')"),
    'Selected check-in period not shown in first column');
   assert(await evaluate("document.querySelector('.roster-daily thead')?.textContent.includes('Belonging · Spring 2026')"),
    'Selected check-in period not shown in second column');
   assert(await evaluate("document.querySelector('.roster-daily tbody')?.textContent.includes('Spring 2026')"),
    'Comparison cells should show their source period');
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
