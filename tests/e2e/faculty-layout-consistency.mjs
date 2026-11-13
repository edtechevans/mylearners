/** Browser-measured Faculty visual QA; all data are fictional.
 * Chrome 100% (1440 CSS px) and 125%-equivalent (1152 CSS px).
 * Real screenshots + a machine-readable report saved into qa-artifacts/.
 */
import {mkdir,writeFile} from 'node:fs/promises';
const ROOT=process.env.MY_LEARNERS_URL||'http://127.0.0.1:8765/';
const CDP=process.env.CHROME_DEBUG_URL||'http://127.0.0.1:9239';
const OUT=process.env.QA_OUTPUT||'qa-artifacts';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(value,message)=>{if(!value)throw Error(message)};
let tabs;
for(let i=0;i<65;i++){
 try{tabs=await(await fetch(CDP+'/json/list')).json();if(tabs.length)break}catch{}
 await sleep(250);
}
const page=tabs?.find(tab=>tab.type==='page');
check(page?.webSocketDebuggerUrl,'Chrome DevTools endpoint unavailable');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
 ws.addEventListener('open',resolve,{once:true});
 ws.addEventListener('error',reject,{once:true});
});
const jobs=new Map();let id=0;const report=[];
ws.addEventListener('message',event=>{
 const result=JSON.parse(event.data);
 if(!result.id||!jobs.has(result.id))return;
 const job=jobs.get(result.id);jobs.delete(result.id);
 if(result.error)job.reject(Error(result.error.message));
 else job.resolve(result.result||{});
});
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const current=++id;jobs.set(current,{resolve,reject});
 ws.send(JSON.stringify({id:current,method,params}));
});
async function evaluate(expression){
 const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
 return r.result?.value;
}
async function screenshot(name){
 const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 await writeFile(OUT+'/faculty-consistency-'+name+'.png',Buffer.from(shot.data,'base64'));
}
const selectInPage=async grade=>{
 const {generateDemoData}=await import('./src/data.mjs');
 const {applyFacultyDemo}=await import('./src/faculty-demo.mjs');
 const demo=applyFacultyDemo(generateDemoData());
 const chosen=demo.classes.find(c=>c.grade===grade);
 if(!chosen)return {error:'No '+grade+' class'};
 const teacher=document.querySelector('[data-select="teacher"]');
 if(!teacher)return {error:'Teacher selector missing'};
 teacher.value=chosen.teacherId;
 teacher.dispatchEvent(new Event('change',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,110));
 const select=document.querySelector('[data-select="class"]');
 if(!select||![...select.options].some(option=>option.value===chosen.id))
  return {error:'Class '+chosen.id+' unavailable after teacher switch'};
 select.value=chosen.id;
 select.dispatchEvent(new Event('change',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,230));
 return {grade,classId:chosen.id,selected:document.querySelector('[data-select="class"]')?.value};
};
async function selectClass(grade){
 const s=await evaluate('('+selectInPage.toString()+')('+JSON.stringify(grade)+')');
 check(!s?.error,grade+': '+(s?.error||'no selection'));
 check(s.classId===s.selected,grade+': class selection changed');
 return s;
}
const auditInPage=()=>{
 const table=document.querySelector('.roster-daily[data-roster-layout="everyday"] table.faculty-data-wall');
 if(!table)return {error:'Faculty Everyday table missing'};
 const scroller=table.closest('.tablewrap.roster-desktop');
 const heads=[...table.querySelectorAll('thead th')].filter(x=>!x.hasAttribute('data-ux-column-hidden'));
 const row=[...table.querySelectorAll('tbody tr')].find(x=>!x.hidden);
 const cards=[...(row?.querySelectorAll(
  '.class-evidence-result,.map-rit-tile,.map-rit-missing,.ixl-diagnostic-tile,.us-tile,.ufli-lesson-tile'
 )||[])].filter(el=>el.getBoundingClientRect().width>0);
 const heights=cards.map(el=>+el.getBoundingClientRect().height.toFixed(1));
 const centers=cards.map(el=>{
  const box=el.getBoundingClientRect();return +(box.top+box.height/2).toFixed(1);
 });
 const singles=heads.flatMap(th=>[...th.querySelectorAll('.faculty-heading-text.is-single-word')]).map(el=>{
  const th=el.closest('th'),r=el.getBoundingClientRect(),style=getComputedStyle(el);
  return {text:el.textContent.trim(),width:r.width,height:r.height,
   available:th.getBoundingClientRect().width-22,lineHeight:parseFloat(style.lineHeight)};
 });
 const tracks=[...table.querySelectorAll('colgroup col')].filter(col=>
  !col.hasAttribute('data-ux-column-hidden')).map(col=>Number.parseFloat(col.style.width)||0);
 const cue=document.querySelector('.roster-daily .faculty-scroll-hint');
 const jump=cue?.querySelector('.faculty-jump-select');
 const context=document.querySelector('.roster-daily .faculty-data-context');
 const tabActions=[...table.querySelectorAll(
  'tbody button.student-link,tbody button.evidence-cell-open,tbody button.map-rit-tile'
 )].filter(btn=>btn.getBoundingClientRect().height>0);
 return {
  cols:heads.length,rows:table.querySelectorAll('tbody tr').length,
  overflow:document.documentElement.scrollWidth-innerWidth,
  scrollerClient:scroller.clientWidth,scrollerWidth:scroller.scrollWidth,
  cueVisible:!!cue&&!cue.hidden,
  cueAbove:!!cue&&cue.getBoundingClientRect().bottom<=scroller.getBoundingClientRect().top+2,
  cueSticky:!!cue&&getComputedStyle(cue).position==='sticky',
  firstLearnerY:row?Math.round(row.getBoundingClientRect().top):null,
  jumpOptions:jump?.options.length||0,
  gridActions:tabActions.length,
  gridTabStops:tabActions.filter(btn=>btn.tabIndex===0).length,
  contextSummary:context?.querySelector('summary')?.textContent.trim()||'',
  contextSource:context?.textContent.includes('Source')||false,
  ufliCollapsed:!!document.querySelector('details.ufli-roster-legend:not([open])'),
  tableWidth:Math.round(table.getBoundingClientRect().width),
  declaredWidth:parseFloat(getComputedStyle(table).getPropertyValue('--faculty-roster-table-width')),
  trackSum:Math.round(tracks.reduce((a,b)=>a+b,0)),
  tileHeights:heights,tileCenters:centers,
  headerHeights:heads.map(th=>+th.getBoundingClientRect().height.toFixed(1)),
  singles,groupStarts:heads.filter(th=>th.hasAttribute('data-faculty-group-start')).length,
  familyTags:heads.every(th=>!!th.dataset.facultyFamily),
  guidedHeaders:heads.filter(th=>th.dataset.columnGuideReady==='yes').length,
  plainHeaderNames:heads.every(th=>!th.textContent.includes('ⓘ')),
  previewBadge:document.querySelector('.heading-meta .demo')?.textContent.trim()||'',
  aboutSource:!!document.querySelector('footer .sitewide-footer-data summary'),
  repeatedPrototypeCopy:/\b(fictional|synthetic|demonstration|demo)\b/i.test(
    document.querySelector('main.container')?.innerText||''),
  noWordBreak:heads.every(th=>{const s=getComputedStyle(th);return s.wordBreak==='normal'&&s.overflowWrap==='normal'}),
  cssLoaded:[...document.querySelectorAll('link[rel=stylesheet]')].some(
   link=>link.href.includes('faculty-ui-consistency.css')&&!!link.sheet)
 };
};
async function audit(grade,width,label){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 const selected=await selectClass(grade);
 await evaluate('window.scrollTo(0,0)');
 await sleep(55);
 const r=await evaluate('('+auditInPage.toString()+')()');
 const guide=await evaluate('('+guidanceInPage.toString()+')()');
 check(!r?.error,grade+': '+r?.error);
 check(guide.screener?.visible&&guide.screener.bands===4,grade+': screener header guidance missing');
 if(grade==='K'||grade==='G2'||grade==='G5')
  check(guide.lesson?.visible&&guide.lesson.bands===4,grade+': UFLI header guidance missing');
 if(grade==='G7'||grade==='G10')
  check(guide.experience?.visible&&guide.experience.bands===4,grade+': experience header guidance missing');
 if(grade==='G12')
  check(guide.report?.visible&&guide.report.bands===4,grade+': subject grade header guidance missing');
 check(r.cssLoaded,grade+': new CSS missing');
 check(r.cols>=5&&r.rows>=1,grade+': roster missing evidence rows');
 check(r.overflow<=5,grade+': body overflows by '+r.overflow+'px');
 check(r.familyTags&&r.groupStarts>=2,grade+': missing dynamic evidence groups');
 check(r.guidedHeaders===r.cols&&r.plainHeaderNames,
  grade+': each column needs CSS-only guidance without changing text');
 check(r.previewBadge==='PREVIEW'&&r.aboutSource,
  grade+': shared provenance controls missing');
 check(!r.repeatedPrototypeCopy,grade+': repeated prototype wording remains visible');
 check(r.tileHeights.length>=3,grade+': missing styled tiles');
 check(Math.max(...r.tileHeights)-Math.min(...r.tileHeights)<=1.5,
  grade+': tile heights differ '+JSON.stringify(r.tileHeights));
 check(Math.max(...r.tileCenters)-Math.min(...r.tileCenters)<=3.5,
  grade+': tile alignment differs '+JSON.stringify(r.tileCenters));
 check(Math.max(...r.headerHeights)-Math.min(...r.headerHeights)<=2,grade+': header heights differ');
 check(r.noWordBreak&&r.singles.every(s=>s.width<=s.available+3&&s.height<=s.lineHeight+5),
  grade+': broken word in a heading '+JSON.stringify(r.singles));
 check(Math.abs(r.tableWidth-r.trackSum)<=8,grade+': unused table width '+r.tableWidth+' vs '+r.trackSum);
 check(r.scrollerWidth<=r.scrollerClient+8||r.cueVisible,grade+': horizontal scroll cue missing');
 check(r.cueAbove&&r.cueSticky,grade+': navigation is not sticky above the table');
 check(r.jumpOptions>=2,grade+': no direct learner jump');
 check(r.gridActions>=3&&r.gridTabStops===1,
  grade+': expected exactly one tabbable data-cell action; found '+r.gridTabStops+' / '+r.gridActions);
 check(r.contextSummary.includes('Screener: simulated %')&&r.contextSource,
  grade+': demo screening source context missing. Summary='+JSON.stringify(r.contextSummary)+', source='+r.contextSource);
 if(grade==='K'||grade==='G2'||grade==='G5')
  check(r.ufliCollapsed,grade+': UFLI legend should begin collapsed');
 if(width===1440&&['PK3','K','G2'].includes(grade))
  check(r.firstLearnerY<=660,grade+': first learner still too far down ('+r.firstLearnerY+'px)');
 await screenshot(grade.toLowerCase()+'-'+label);
 report.push({grade,viewport:width,selected,...r,guidance:guide});
 console.log('PASS '+grade+' '+label+' '+r.cols+' cols / '+r.tileHeights.length+' tiles / width '+r.tableWidth);
}
const guidanceInPage=()=>{
 const ths=[...document.querySelectorAll('.faculty-data-wall thead th')];
 const screener=ths.find(th=>th.dataset.facultyFamily==='screener');
 const experience=ths.find(th=>th.dataset.facultyFamily==='experience');
 const report=ths.find(th=>th.dataset.facultyFamily==='report');
 const lessons=ths.find(th=>th.dataset.facultyFamily==='lesson');
 const sample=th=>{
  if(!th)return null;
  th.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,composed:true}));
  const popup=document.getElementById('sitewide-column-guide');
  const result={visible:!!popup&&!popup.hidden,
   bands:popup?.querySelectorAll('.column-guide-band').length||0,
   title:popup?.querySelector('.column-guide-title strong')?.textContent.trim()||'',
   note:popup?.textContent||'',nativeTitle:!!th.getAttribute('title'),
   headingText:th.textContent.trim()};
  th.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}));
  return result;
 };
 return {screener:sample(screener),report:sample(report),
  lesson:sample(lessons),experience:sample(experience)};
};
const interactionInPage=async()=>{
 const table=document.querySelector('table.faculty-data-wall');
 const width=()=>Number.parseFloat(getComputedStyle(table).getPropertyValue('--faculty-roster-table-width'));
 const original=width(),controls=document.querySelector('.ux-faculty-table-controls');
 const links=[...table.querySelectorAll('tbody tr button.student-link')]
  .filter(el=>getComputedStyle(el.closest('tr')).display!=='none');
 const first=links[0],second=links[1],last=links.at(-1);
 if(!first||!second||!last)return {error:'No learner links for keyboard test'};
 first.focus();
 first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
 const downFocus=document.activeElement===second;
 const jump=document.querySelector('.faculty-jump-select');
 if(!jump)return {error:'Quick learner select missing'};
 jump.value=last.dataset.student;
 jump.dispatchEvent(new Event('change',{bubbles:true}));
 const jumpFocus=document.activeElement===last;
 const box=controls?.querySelector('[data-ux-column="2"]');
 if(!box)return {error:'Column control unavailable'};
 box.checked=false;box.dispatchEvent(new Event('change',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,90));
 const reduced=width(),hidden=table.querySelector('thead th[data-ux-origin="2"]')?.hasAttribute('data-ux-column-hidden');
 const mover=controls.querySelector('[data-ux-move-right="1"]');
 if(!mover)return {error:'Column move control unavailable'};
 mover.click();
 await new Promise(resolve=>setTimeout(resolve,90));
 const order=[...table.querySelectorAll('thead th')].slice(0,4).map(th=>th.dataset.uxOrigin);
 const target=table.querySelector('tbody tr td[data-ux-origin="3"] button');
 target?.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));
 const active=table.querySelectorAll('thead th[data-faculty-active-column]').length;
 controls.querySelector('[data-ux-restore-columns]')?.click();
 await new Promise(resolve=>setTimeout(resolve,120));
 const restored=width();
 const cue=document.querySelector('.faculty-scroll-hint');
 const scroller=document.querySelector('.roster-desktop.tablewrap');
 const before=scroller.scrollLeft;
 cue?.querySelector('[data-faculty-scroll="right"]')?.click();
 await new Promise(resolve=>setTimeout(resolve,450));
 return {original,reduced,hidden,order,active,restored,before,after:scroller.scrollLeft,
  downFocus,jumpFocus};
};
await mkdir(OUT,{recursive:true});
try{
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:ROOT+'#/faculty'});
 let ready=false;
 for(let i=0;i<80;i++){
  ready=await evaluate("!!document.querySelector('.roster-daily .faculty-data-wall')").catch(()=>false);
  if(ready)break;await sleep(100);
 }
 check(ready,'Faculty landing did not render');
 for(const [width,label] of [[1440,'100pct'],[1152,'125pct-equiv']]){
  for(const grade of ['PK3','K','G2','G5','G7','G10','G12'])
   await audit(grade,width,label);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await selectClass('G7');
 const actions=await evaluate('('+interactionInPage.toString()+')()');
 check(!actions.error,actions.error||'Interaction audit failed');
 check(actions.hidden&&actions.reduced<actions.original-40,'Hidden column did not reduce table width');
 check(actions.downFocus,'ArrowDown did not move to the next learner');
 check(actions.jumpFocus,'Jump-to-learner did not focus the selected learner');
 check(actions.order[1]!=='1','Reorder did not move the first evidence column');
 check(actions.active>=1,'Hover did not identify a column');
 check(Math.abs(actions.restored-actions.original)<=3,'Restore default changed total width');
 check(actions.after>actions.before+40,'Scroll control did not move the table');
 report.push({type:'interaction',...actions});
 await screenshot('myp-interactions');
 await writeFile(OUT+'/faculty-consistency-report.json',JSON.stringify(report,null,2));
 console.log('PASS Faculty consistency: seven class levels at 100% and 125%-equivalent; interactions');
}catch(error){
 await writeFile(OUT+'/faculty-consistency-report.json',JSON.stringify({error:String(error),cases:report},null,2));
 console.error('FACULTY CONSISTENCY FAILED: '+String(error));
 process.exitCode=1;
}finally{
 ws.close();
}
