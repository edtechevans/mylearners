/**
 * Faculty class homepage: one evidence selector, one roster column.
 * Every displayed number comes from existing, synthetic demo records.
 * Maia Flourishing is a not-connected integration placeholder.
 * Core Phonics and F&P reading are limited to Kindergarten–Grade 5.
 */
import {academicModesFor,academicFor,latestAcademic,academicCoverage} from './academic-journey-data.mjs';
import {latestMapGrowth,MAP_SUBJECTS} from './map-growth.mjs';
import {experienceEligible,summarizeExperience,experienceFor,EXPERIENCE_WINDOWS} from './experience-data.mjs';
import {gradeNumber} from './data.mjs';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const EVIDENCE_MODES=Object.freeze([
 {id:'report',label:'Report card',category:'Learning'},
 {id:'map',label:'MAP growth',category:'Learning'},
 {id:'ixl',label:'IXL Math',category:'Learning'},
 {id:'core',label:'Core Phonics',category:'Learning'},
 {id:'fp',label:'F&P reading',category:'Learning'},
 {id:'engagement',label:'Engagement',category:'Experience'},
 {id:'belonging',label:'Belonging',category:'Experience'},
 {id:'flourishing',label:'Maia Flourishing',category:'Experience'}
]);
const labels=Object.fromEntries(EVIDENCE_MODES.map(x=>[x.id,x.label]));
const pending=new Set(['flourishing']);
export function evidenceModesForGrade(grade){
 const n=gradeNumber(grade),academic=academicModesFor(grade);
 return EVIDENCE_MODES.filter(m=>
  academic.includes(m.id)||
  (m.id==='map'&&n>=3&&n<=10)||
  ((m.id==='engagement'||m.id==='belonging'||m.id==='flourishing')&&n>=3)
 ).map(m=>m.id);
}
export function normalizeEvidenceMode(grade,selected){
 return evidenceModesForGrade(grade).includes(selected)?selected:'report';
}
function reportSubject(students,academic,subject){
 const report=academicFor(academic,students[0]?.id).reports?.[0];
 const choices=report?.subjects||[];
 return choices.some(s=>s.subject===subject)?subject:choices[0]?.subject||'';
}
export function evidenceValue(student,{mode='report',academic,map,experience,subject='Mathematics',mapSubject='Mathematics',window='F26'}){
 if(pending.has(mode))return {text:'—',detail:'Source not connected',available:false};
 if(mode==='map'){
  if(!evidenceModesForGrade(student.grade).includes('map'))return {text:'—',detail:'Not assessed for grade',available:false};
  const result=latestMapGrowth(map[student.id]||[],mapSubject);
  if(result.status!=='comparable')
   return {text:'—',detail:result.current?'No comparable prior result':'No current result',available:false};
  return {text:(result.actual>=0?'+':'')+result.actual+' RIT',
   detail:result.projected===null?'Projection not available':
    result.met?'Met illustrative projection':'Below illustrative projection',available:true};
 }
 if(mode==='engagement'||mode==='belonging'){
  const entry=experienceEligible(student)?experienceFor(experience,student.id,mode,window):null;
  return entry?{text:String(entry.value)+' / 100',detail:'Exploratory check-in index',available:true}:
   {text:'—',detail:'No check-in',available:false};
 }
 if(!academicModesFor(student.grade).includes(mode))
  return {text:'—',detail:'Not assessed for grade',available:false};
 const value=latestAcademic(academicFor(academic,student.id),mode,subject);
 return value?{text:String(value.value),detail:mode==='report'?'Last issued report · '+value.label:
  mode==='ixl'?'Diagnostic level · '+value.label:
  mode==='core'?'Mock items · '+value.label:'Text level · '+value.label,available:true}:
  {text:'—',detail:'No recorded result',available:false};
}
export function evidenceRosterColumn(student,ctx){
 const result=evidenceValue(student,ctx);
 return '<span class="class-evidence-result'+(result.available?'':' is-unavailable')+'">'+
  '<strong>'+esc(result.text)+'</strong><small>'+esc(result.detail)+'</small></span>';
}
function reportBreakdown(students,academic,subject){
 const groups=new Map();
 for(const student of students){
  const report=academicFor(academic,student.id).reports?.[0];
  const item=report?.subjects.find(s=>s.subject===subject);
  if(!item)continue;
  const key=[report.year,report.grade,report.framework,report.scale].join('·');
  if(!groups.has(key))groups.set(key,{name:key,counts:new Map(),total:0});
  const group=groups.get(key);
  group.counts.set(item.value,(group.counts.get(item.value)||0)+1);
  group.total++;
 }
 if(!groups.size)return '<p>No previously issued results for this subject.</p>';
 return [...groups.values()].map(g=>
  '<div class="class-evidence-distribution"><strong>'+esc(g.name)+'</strong>'+
  '<span>'+g.total+' learners</span><div class="class-evidence-outcomes">'+
  [...g.counts.entries()].sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'en',{numeric:true}))
   .map(([value,n])=>'<span>'+esc(value)+' <b>'+n+'</b></span>').join('')+
  '</div></div>').join('');
}
const modeHelp={
 report:'Previous issued results only; the subject and prior school year are shown. Report scales are never averaged across programmes.',
 map:'Observed RIT change between comparable tests. Projection figures in this demonstration are illustrative, not official NWEA norms.',
 ixl:'Illustrative IXL Mathematics diagnostic levels, not SmartScores, percentages or report-card grades.',
 core:'Fictional 50-item classroom decoding checks; not an official CORE Phonics Survey total or benchmark.',
 fp:'Fictional Fountas & Pinnell text levels describe text complexity, not a percentage, grade or a measure of the whole reader.',
 engagement:'Fictional AISG-style student check-in index out of 100. Not a percentage or validated score. Maia Flourishing can provide separate context once connected.',
 belonging:'Fictional AISG-style student check-in index out of 100. Not a percentage or validated score. Maia Flourishing can provide separate context once connected.',
 flourishing:'MaiaLearning Flourishing is a PERMA-based wellbeing assessment. It is a separate instrument, not an engagement or belonging score. No Maia results are connected to this public demonstration.'
};
export function renderClassEvidencePanel(students,{academic,map,experience,mode='report',subject='Mathematics',mapSubject='Mathematics',window='F26'}={}){
 const grade=students[0]?.grade||'';
 const availableModes=evidenceModesForGrade(grade);
 const selected=normalizeEvidenceMode(grade,mode);
 const chosenSubject=reportSubject(students,academic,subject);
 const subjects=academicFor(academic,students[0]?.id).reports?.[0]?.subjects||[];
 const sample=academicFor(academic,students[0]?.id).reports?.[0];
 const recentWindow=EXPERIENCE_WINDOWS.find(w=>w.key===window)?.label||window;
 const ctx={academic,map,experience,mode:selected,subject:chosenSubject,mapSubject,window};
 const coverage=students.map(s=>evidenceValue(s,ctx)).filter(v=>v.available).length;
 const eligible=pending.has(selected)?0:selected==='report'?academicCoverage(students,academic,'report',chosenSubject).eligible:
  students.filter(s=>selected==='map'?(gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10):
   (selected==='engagement'||selected==='belonging')?experienceEligible(s):
    academicModesFor(s.grade).includes(selected)).length;
 const summary=(selected==='engagement'||selected==='belonging')?
  summarizeExperience(experience,students,selected,window):null;
 const modeTabs=EVIDENCE_MODES.filter(m=>availableModes.includes(m.id));
 const tabGroups=['Learning','Experience'].map(category=>{
  const group=modeTabs.filter(m=>m.category===category);
  if(!group.length)return '';
  return '<div class="class-evidence-tab-group"><span class="class-evidence-group-label">'+category+'</span>'+
   '<div class="class-evidence-tabs" role="group" aria-label="'+category+' evidence">'+
   group.map(m=>'<button type="button" data-class-evidence="'+m.id+'" aria-pressed="'+(selected===m.id)+
   '" class="'+(selected===m.id?'active':'')+'">'+esc(m.label)+'</button>').join('')+
   '</div></div>';
 }).join('');
 const options=selected==='report'&&subjects.length?
  '<label class="class-evidence-filter">Subject <select data-academic-subject aria-label="Report card subject">'+
  subjects.map(s=>'<option value="'+esc(s.subject)+'"'+(s.subject===chosenSubject?' selected':'')+'>'+esc(s.subject)+'</option>').join('')+'</select></label>':
  selected==='map'?
  '<label class="class-evidence-filter">MAP subject <select data-map-subject aria-label="MAP growth subject">'+
  MAP_SUBJECTS.map(x=>'<option value="'+esc(x)+'"'+(mapSubject===x?' selected':'')+'>'+esc(x)+'</option>').join('')+
  '</select></label>':'';
 const total=selected==='engagement'||selected==='belonging'?
  '<strong>'+ (summary?.value===null?'—':summary.value+' / 100')+'</strong>'+
  '<span>'+summary.n+' of '+summary.eligible+' student check-ins · '+esc(recentWindow)+'</span>':
  pending.has(selected)?
  '<strong>Not connected</strong><span>No student results available in this demonstration</span>':
  '<strong>'+coverage+' of '+eligible+'</strong><span>learners with evidence'+
  (selected==='report'&&sample?' · '+esc(sample.year)+' · '+esc(sample.grade)+' (last issued)':'')+
  (selected==='map'?' · Fall 2026':'')+'</span>';
 const details=selected==='report'?
  '<details class="class-evidence-breakdown"><summary>View class results breakdown</summary>'+
  reportBreakdown(students,academic,chosenSubject)+'</details>':'';
 const note=(selected==='engagement'||selected==='belonging')?
  '<p class="class-evidence-secondary">MaiaLearning Flourishing: not connected. Its PERMA dimensions would be separate context, not a substitute for this index.</p>':'';
 return '<section class="class-evidence-panel" aria-label="Select learning and wellbeing evidence for the class roster">'+
  '<div class="class-evidence-heading"><div><span class="academic-eyebrow">CLASS VIEW</span>'+
  '<h3>Learning &amp; wellbeing evidence</h3><p>Choose one measure to show in your roster.</p></div>'+
  '</div>'+
  '<div class="class-evidence-navigation">'+tabGroups+'</div>'+
  '<div class="class-evidence-selection"><div class="class-evidence-selected">'+
  '<span>'+esc(labels[selected])+'</span>'+total+'</div>'+options+'</div>'+
  '<p class="class-evidence-help">'+esc(modeHelp[selected])+'</p>'+note+details+
  '</section>';
}
