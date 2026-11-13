/** Focused Leaders > Student Explorer real-Chrome usability audit.
 * Uses generated DEMO data only. Scenarios represent roles, not human testimony.
 * Intended as a review artifact on an isolated branch; it never alters student data.
 */
import {mkdir,writeFile} from 'node:fs/promises';

const CDP=process.env.CHROME_DEBUG_URL||'http://127.0.0.1:9248';
const BASE=process.env.MY_LEARNERS_URL||'http://127.0.0.1:8765/';
const OUT=process.env.QA_OUTPUT||'qa-artifacts';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(ok,message)=>{if(!ok)throw Error(message)};

let pages;
for(let n=0;n<75;n++){
 try{pages=await(await fetch(CDP+'/json/list')).json();if(pages.some(t=>t.type==='page'))break}catch{}
 await sleep(250);
}
const page=pages?.find(t=>t.type==='page');
check(page?.webSocketDebuggerUrl,'No Chrome debugger page');
const socket=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
 socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});
});
let seq=0;const pending=new Map(),exceptions=[];
socket.addEventListener('message',e=>{
 const msg=JSON.parse(e.data);
 if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params?.exceptionDetails?.text||'Uncaught browser error');
 const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);
 if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result||{});
});
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
});
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
const evalJS=async expression=>{
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
 return r.result?.value;
};
const expr=fn=>'('+fn.toString()+')()';
async function waitFor(selector,ms=28000){
 const start=Date.now();
 while(Date.now()-start<ms){
  if(await evalJS('!!document.querySelector('+JSON.stringify(selector)+')').catch(()=>false))return true;
  await sleep(120);
 }
 throw Error('Element not found: '+selector);
}
async function click(selector){
 const result=await evalJS('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)return false;el.click();return true})()');
 check(result,'Missing button '+selector);await sleep(200);
}
async function choose(field,value){
 const result=await evalJS('(()=>{const el=document.querySelector('+JSON.stringify('[data-explorer-filter="'+field+'"]')+');if(!el)return "missing";if(!Array.from(el.options).some(o=>o.value==='+JSON.stringify(value)+'))return "option-missing";el.value='+JSON.stringify(value)+';el.dispatchEvent(new Event("change",{bubbles:true}));return "ok"})()');
 check(result==='ok','Filter '+field+' selection '+value+' failed: '+result);await sleep(160);
}
const info=()=>evalJS(expr(function(){
 const root=document.querySelector('#leader-student-explorer');
 const table=root?.querySelector('table'),scroll=root?.querySelector('.explorer-scroll');
 const rows=[...(root?.querySelectorAll('tbody tr')||[])];
 const subjects=[...(root?.querySelectorAll('[data-source-heading]')||[])].map(el=>el.dataset.sourceHeading);
 const headers=[...(root?.querySelectorAll('thead th')||[])].map(el=>el.textContent.trim());
 const r=scroll?.getBoundingClientRect();
 const tiles=[...(root?.querySelectorAll('td[data-explorer-col="report"] .explorer-grade')||[])];
 const missing=[...(root?.querySelectorAll('td[data-explorer-col="report"] .explorer-empty')||[])].length;
 const checkins=[...(root?.querySelectorAll('.explorer-experience')||[])];
 const top=rows[0]?.getBoundingClientRect();
 return {
  total:Number((root?.querySelector('.explorer-count')?.textContent||'0').match(/\d+/)?.[0]||0),
  renderedRows:rows.length,
  columns:headers.length,subjects,firstFive:rows.slice(0,5).map(el=>el.querySelector('.student-link')?.textContent?.trim()),
  lastFive:rows.slice(-5).map(el=>el.querySelector('.student-link')?.textContent?.trim()),
  headerPreview:headers.slice(0,18),
  scrollWidth:scroll?.scrollWidth,clientWidth:scroll?.clientWidth,
  tableWidth:Math.round(table?.getBoundingClientRect().width||0),
  scrollingRatio:scroll?.clientWidth?+(scroll.scrollWidth/scroll.clientWidth).toFixed(2):null,
  visibleReportColumns:subjects.filter(subject=>{
   const th=root.querySelector('th[data-source-heading="'+CSS.escape(subject)+'"]');
   if(!th)return false;
   const rect=th.getBoundingClientRect();return rect.left>=r.left&&rect.right<=r.right;
  }),
  reportTiles:tiles.length,missingCells:missing,
  reportMissingRate:tiles.length+missing?+(missing/(tiles.length+missing)).toFixed(3):null,
  gradeBands:Object.fromEntries(['low','mid-low','mid-high','high'].map(b=>[b,root.querySelectorAll('.explorer-grade.band-'+b).length])),
  keyboardStops:[...(root?.querySelectorAll('tbody button,a[href],input,select')||[])].filter(el=>el.tabIndex>=0).length,
  keyboardCandidates:root?.querySelectorAll('tbody button')?.length||0,
  compactSubjectChips:root?.querySelectorAll('.explorer-subject-chip')?.length||0,
  quickFilters:root?.querySelectorAll('.explorer-toolbar [data-explorer-filter]')?.length||0,
  advancedCollapsed:!!root?.querySelector('#explorer-advanced-filters[hidden]'),
  filters:root?.querySelectorAll('[data-explorer-filter]')?.length,
  firstRowY:Math.round(top?.top||0),containerY:Math.round(r?.top||0),
  documentOverflow:document.documentElement.scrollWidth-window.innerWidth,
  checkins:checkins.length,checkinsWithoutVisibleText:checkins.filter(el=>!el.textContent.trim()).length,
  noResults:!!root?.querySelector('.explorer-empty-state'),
  gradeSelected:root?.querySelector('[data-explorer-filter="grade"]')?.value,
  divisionSelected:root?.querySelector('[data-explorer-filter="division"]')?.value,
  subjectSelected:root?.querySelector('[data-explorer-filter="subject"]')?.value
 };
}));
async function viewport(width,height=900){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await sleep(200);
}
async function screenshot(name){
 const snap=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 await writeFile(OUT+'/leader-audit-'+name+'.png',Buffer.from(snap.data,'base64'));
}
const cases=[],findings=[];
async function scenario(role,task,run){
 const start=Date.now();let result,success=true,error;
 try{result=await run()}catch(e){success=false;error=String(e?.message||e)}
 cases.push({role,task,status:success?'completed':'error',durationMs:Date.now()-start,...(result||{}),...(error?{error}:{})});
 console.log('LEADER_TASK '+JSON.stringify(cases.at(-1)));
}
async function finding(level,title,evidence){
 findings.push({level,title,evidence});console.log('LEADER_FINDING '+JSON.stringify(findings.at(-1)));
}
await mkdir(OUT,{recursive:true});
try{
 await viewport(1440);
 const start=Date.now();
 await send('Page.navigate',{url:BASE+'#/leader'});
 await waitFor('[data-leader-view="explorer"]');
 await click('[data-leader-view="explorer"]');
 await waitFor('#leader-student-explorer table');
 await sleep(200);
 await scenario('Head of School','Land on all students, scan alphabetical schoolwide results',async()=>{
  const result=await info();
  const names=await evalJS(expr(()=>[...document.querySelectorAll('#leader-student-explorer .student-link')].map(el=>el.textContent.trim())));
  const sorted=names.every((name,i)=>i===0||names[i-1].localeCompare(name,undefined,{numeric:true})<=0);
  if(!sorted)await finding('high','Initial school roster is not A-Z',names.slice(0,15));
  if(result.renderedRows!==result.total)await finding('high','Roster omits some initial learners',result);
  if(result.compactSubjectChips===0)await finding('high','Schoolwide compact subject grade chips did not render',
   {missingRate:result.reportMissingRate,subjectCols:result.subjects.length});
  if(result.keyboardStops>90)await finding('high','The all-school table still creates excessive keyboard tab stops',result.keyboardStops);
  if(result.firstRowY>845)await finding('high','First learner is still below the fold on desktop',result.firstRowY);
  if(!result.advancedCollapsed)await finding('medium','Advanced filters are expanded on initial load',result);
  if(result.scrollingRatio>2.1)await finding('medium','Whole-school table still requires substantial sideways navigation',
   {ratio:result.scrollingRatio,width:result.tableWidth,subjectCols:result.subjects.length});
  await screenshot('schoolwide-1440');
  return {initialRenderMs:Date.now()-start,sorted,...result};
 });
 await scenario('Head of School','Find a named learner using search (whole-school)',async()=>{
  const target=await evalJS("document.querySelector('#leader-student-explorer tbody .student-link')?.textContent.trim()");
  const query=target?.split(' ')[0]||'Alex';
  const duration=await evalJS('(()=>{let e=document.querySelector("[data-explorer-search]");const t=performance.now();e.value='+JSON.stringify(query)+';e.dispatchEvent(new Event("input",{bubbles:true}));return +(performance.now()-t).toFixed(1)})()');
  await sleep(250);
  const r=await info();
  const hasTarget=await evalJS('!![...document.querySelectorAll("#leader-student-explorer tbody .student-link")].find(e=>e.textContent.trim()==='+JSON.stringify(target)+')');
  if(!hasTarget||r.noResults)await finding('high','Search excluded an exact matching student',{target,query,r});
  return {target,query,searchRenderMs:duration,found:hasTarget,total:r.total};
 });
 await click('[data-explorer-reset]');
 await scenario('Secondary Principal','Filter Grade 7, retain all eight MYP grades and sort Mathematics',async()=>{
  await choose('division','Secondary');await choose('grade','G7');
  const r=await info();
  if(r.subjects.length!==8)await finding('high','Grade 7 does not have all eight Faculty subject columns',r.subjects);
  const selected=await evalJS("document.querySelector('[data-explorer-filter=\"sort\"]')?.value");
  await choose('sort','report:Mathematics');
  const sorted=await evalJS(expr(function(){
   const values=[...document.querySelectorAll('#leader-student-explorer tbody tr')].map(row=>{
    const cells=[...row.querySelectorAll('td[data-explorer-col="report"]')];
    return Number(cells[1]?.textContent.trim().replace('*',''));
   }).filter(Number.isFinite);
   return {values:values.slice(0,12),sorted:values.every((value,i)=>!i||values[i-1]<=value)};
  }));
  if(!sorted.sorted)await finding('high','Mathematics grade sort does not order the roster',sorted);
  await screenshot('secondary-G7');
  return {previousSort:selected,...r,mathSort:sorted};
 });
 await scenario('Secondary Principal','Filter mathematics subject, then EAL and Learning Support; keep all grade columns',async()=>{
  await choose('subject','Mathematics');await choose('eal','active');await choose('learning','yes');
  const r=await info();
  const allSubjects=r.subjects.length===8;
  if(!allSubjects)await finding('high','Combined filters dropped subject-grade columns',r);
  await screenshot('secondary-support-filters');
  return {allSubjects,...r};
 });
 await scenario('Secondary Principal','Open student profile and return to the same filtered result set',async()=>{
  const before=await info();
  const selected=await evalJS("document.querySelector('#leader-student-explorer tbody .student-link')?.textContent.trim()");
  if(!selected)return {skipped:'No Grade 7 learner matches all filters'};
  await click('#leader-student-explorer tbody .student-link');
  const profile=await evalJS('!!document.querySelector(".leader-learner-profile")');
  const back=await evalJS('document.querySelector("[data-leader-back]")?.textContent.trim()');
  if(!profile)await finding('high','Clicking a learner did not open a leader profile',{selected});
  if(profile)await click('[data-leader-back]');
  const after=await info();
  const kept=before.total===after.total&&after.subjectSelected==='Mathematics'&&after.gradeSelected==='G7';
  if(!kept)await finding('high','Profile return loses Student Explorer filters',{before,after});
  return {selected,profileOpened:profile,backText:back,filtersKept:kept,before:before.total,after:after.total};
 });
 await click('[data-explorer-reset]');
 await scenario('Elementary Principal','Find G2 students and keep their development descriptors',async()=>{
  await choose('division','Elementary');await choose('grade','G2');
  const r=await info();
  const descriptorCount=await evalJS('document.querySelectorAll("#leader-student-explorer .explorer-descriptor").length');
  if(!descriptorCount)await finding('high','Elementary subject descriptors are not rendered',r);
  await screenshot('elementary-G2');
  return {descriptors:descriptorCount,...r};
 });
 await scenario('Student Support Leader','Identify learners with Low MAP goal areas without choosing a named strand first',async()=>{
  await click('[data-explorer-reset]');
  await choose('mapTest','Reading');
  await choose('strandBand','low');
  const r=await info();
  if(r.total===0)await finding('high','Low MAP strand descriptor filter returns zero unless the exact strand is chosen',
   {mapTest:'Reading',strandBand:'low',total:r.total});
  return r;
 });
 await scenario('Learning Leader','Check MAP percentile band when all MAP tests are selected',async()=>{
  await click('[data-explorer-reset]');
  await choose('mapTest','all');
  await choose('band','low');
  const r=await info();
  const text=await evalJS("document.querySelector('#leader-student-explorer tbody .explorer-band')?.textContent.trim()");
  if(r.total>0&&text==='—')await finding('medium','MAP band filter returns learners while the matching MAP band column displays a dash',
   {mapTest:'all',band:'low',count:r.total,firstBand:text});
  return {firstDisplayedBand:text,...r};
 });
 await scenario('DP Coordinator','G12 subject-grade review without MAP test data',async()=>{
  await click('[data-explorer-reset]');
  await choose('division','Secondary');await choose('grade','G12');
  const r=await info();
  const grades=await evalJS('document.querySelectorAll("#leader-student-explorer tbody .explorer-grade.band-high").length');
  await screenshot('secondary-G12');
  return {highestGradeTiles:grades,...r};
 });
 await scenario('Head of School','Export filtered G12 CSV with full subject columns',async()=>{
  await evalJS(expr(function(){
   document.addEventListener('click',event=>{
    const el=event.target;
    if(el.tagName!=='A'||!el.download)return;
    event.preventDefault();
    window.__auditExportName=el.download;
    window.__auditExport=fetch(el.href).then(res=>res.text()).then(text=>{
     const lines=text.replace(/^\ufeff/,'').trimEnd().split(/\r?\n/);
     return {file:el.download,rows:lines.length-1,head:lines[0].slice(0,320),
      includesMath:lines[0].includes('Subject grade · Mathematics'),includesLanguage:lines[0].includes('Subject grade · Language & Literature')};
    });
   },true);
  }));
  await click('#leader-student-explorer [data-export-dashboard]');
  const out=await evalJS('window.__auditExport');
  const r=await info();
  if(out.rows!==r.total||!out.includesMath)
   await finding('high','Filtered export lacks subject columns or contains incorrect learner count',{out,expected:r.total});
  return {export:out,filteredTotal:r.total};
 });
 await scenario('Mobile Leader','Check 390px screen and horizontal subject navigation',async()=>{
  await viewport(390,844);await sleep(350);
  const r=await info();
  const toolbar=await evalJS(expr(function(){
   const left=document.querySelector('#leader-student-explorer [data-explorer-scroll="-1"]');
   const right=document.querySelector('#leader-student-explorer [data-explorer-scroll="1"]');
   const sc=document.querySelector('#leader-student-explorer .explorer-scroll');
   return {left:!!left,right:!!right,before:sc?.scrollLeft||0,screen:innerWidth};
  }));
  await click('#leader-student-explorer [data-explorer-scroll="1"]');
  const after=await evalJS('document.querySelector("#leader-student-explorer .explorer-scroll")?.scrollLeft');
  if(after<=toolbar.before)await finding('medium','Horizontal column buttons do not move table on mobile',{toolbar,after});
  if(r.documentOverflow>4)await finding('high','Student Explorer leaks horizontal overflow into page',r.documentOverflow);
  await screenshot('mobile-G12');
  return {toolbar,after,...r};
 });
}catch(e){
 findings.push({level:'blocker',title:'Audit harness could not finish',evidence:String(e?.stack||e)});
}
const report={area:'Leaders > Student Explorer',source:'Release regression with synthetic DEMO data; not actual staff feedback',
 date:'2026-11-13',viewport:'Chrome 1440x900 / 390x844',scenarios:cases,
 findings,unhandledExceptions:exceptions};
await writeFile(OUT+'/student-explorer-leader-audit.json',JSON.stringify(report,null,2));
console.log('LEADER_AUDIT_SUMMARY '+JSON.stringify({scenarios:cases.length,finished:cases.filter(c=>c.status==='completed').length,
 findings,exceptions:exceptions.length}));
socket.close();
if(cases.length<10||cases.some(c=>c.status==='error')||findings.some(f=>f.level==='high'||f.level==='blocker'))process.exitCode=1;
