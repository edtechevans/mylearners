/**
 * Faculty class homepage: one evidence selector, one roster column.
 * Every displayed number comes from existing, synthetic demo records.
 * Maia Flourishing examples are synthetic PERMA dimension values, not an official export.
 * Core Phonics and F&P reading are limited to Kindergarten–Grade 5.
 */
import {academicModesFor,academicFor,latestAcademic,academicCoverage} from './academic-journey-data.mjs';
import {latestMapGrowth,MAP_SUBJECTS} from './map-growth.mjs';
import {experienceEligible,summarizeExperience,experienceFor,EXPERIENCE_WINDOWS} from './experience-data.mjs';
import {gradeNumber} from './data.mjs';
import {MAIA_DIMENSIONS,MAIA_PERIODS,MAIA_DEFAULT_DIMENSION,maiaEligible,maiaDimension,maiaPeriod,maiaValue,maiaClassSummary} from './maia-demo.mjs';
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
const pending=new Set();
export function evidenceModesForGrade(grade){
 const n=gradeNumber(grade),academic=academicModesFor(grade);
 return EVIDENCE_MODES.filter(m=>
  academic.includes(m.id)||
  (m.id==='map'&&n>=3&&n<=10)||
  ((m.id==='engagement'||m.id==='belonging')&&n>=3)||
  (m.id==='flourishing'&&n>=6&&n<=12)
 ).map(m=>m.id);
}
export function normalizeEvidenceMode(grade,selected){
 return evidenceModesForGrade(grade).includes(selected)?selected:'report';
}
/** Do not compare the same view with itself or show measures outside this grade. */
export function normalizeComparison(grade,primary,compare='none'){
 return compare!==primary&&evidenceModesForGrade(grade).includes(compare)?compare:'none';
}
/** Each source has its own label and unit; never combine incompatible scores. */
export function evidenceLabel(mode,{subject='Mathematics',mapSubject='Mathematics',window='F26',maiaDimension:dim=MAIA_DEFAULT_DIMENSION,maiaWindow='F26'}={}){
 const period=EXPERIENCE_WINDOWS.find(x=>x.key===window)?.label||'Fall 2026';
 if(mode==='flourishing')return 'Maia · '+(MAIA_DIMENSIONS.find(x=>x.key===maiaDimension(dim))?.label||'Relationships')+' · '+(MAIA_PERIODS.find(x=>x.key===maiaPeriod(maiaWindow))?.label||'Fall 2026');
 if(mode==='report')return 'Report · '+subject;
 if(mode==='map')return 'MAP '+mapSubject+' growth';
 if(mode==='engagement'||mode==='belonging')return labels[mode]+' · '+period;
 return labels[mode]||'Learning evidence';
}
function reportSubject(students,academic,subject){
 const report=academicFor(academic,students[0]?.id).reports?.[0];
 const choices=report?.subjects||[];
 return choices.some(s=>s.subject===subject)?subject:choices[0]?.subject||'';
}
export function evidenceValue(student,{mode='report',academic,map,experience,maia,maiaDimension:dim=MAIA_DEFAULT_DIMENSION,maiaWindow='F26',subject='Mathematics',mapSubject='Mathematics',window='F26'}){
 if(mode==='flourishing'){
  if(!maiaEligible(student))return {text:'—',detail:'Secondary only',available:false};
  const value=maiaValue(maia,student.id,dim,maiaWindow);
  return value===null?{text:'—',detail:'No example response',available:false}:
   {text:value.toFixed(1)+' / 10',detail:(MAIA_PERIODS.find(x=>x.key===maiaPeriod(maiaWindow))?.label||'Fall 2026')+' · illustrative PERMA value',available:true};
 }
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
  return entry?{text:String(entry.value)+' / 100',detail:(EXPERIENCE_WINDOWS.find(x=>x.key===window)?.label||window)+' · check-in index',available:true}:
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
 engagement:'Fictional AISG-style check-in index out of 100, not a percentage. Maia uses a separate fictional PERMA example and different scale.',
 belonging:'Fictional AISG-style check-in index out of 100, not a percentage. Maia uses a separate fictional PERMA example and different scale.',
 flourishing:'Synthetic MaiaLearning-style PERMA dimensions. The 0–10 display scale is illustrative, NOT confirmed Maia scoring. This is not a real Maia export, benchmark, diagnosis or combined wellbeing score.'
};
export function renderClassEvidencePanel(students,{
 academic,map,experience,maia,mode='report',compare='none',subject='Mathematics',mapSubject='Mathematics',window='F26',maiaDimension:dim=MAIA_DEFAULT_DIMENSION,maiaWindow='F26'
}={}){
 const grade=students[0]?.grade||'';
 const modes=evidenceModesForGrade(grade);
 const selected=normalizeEvidenceMode(grade,mode);
 const paired=normalizeComparison(grade,selected,compare);
 const selectedWindow=EXPERIENCE_WINDOWS.some(w=>w.key===window)?window:'F26';
 const recentWindow=EXPERIENCE_WINDOWS.find(w=>w.key===selectedWindow)?.label||'Fall 2026';
 const chosenSubject=reportSubject(students,academic,subject);
 const subjects=academicFor(academic,students[0]?.id).reports?.[0]?.subjects||[];
 const sample=academicFor(academic,students[0]?.id).reports?.[0];
 const ctx={academic,map,experience,maia,subject:chosenSubject,mapSubject,window:selectedWindow,maiaDimension:dim,maiaWindow};
 const tabs=['Learning','Experience'].map(category=>{
  const group=EVIDENCE_MODES.filter(m=>m.category===category&&modes.includes(m.id));
  if(!group.length)return '';
  return '<div class="class-evidence-tab-group"><span class="class-evidence-group-label">'+category+'</span>'+
   '<div class="class-evidence-tabs" role="group" aria-label="'+category+' evidence">'+
   group.map(m=>'<button type="button" data-class-evidence="'+m.id+'" aria-pressed="'+(selected===m.id)+
   '" class="'+(selected===m.id?'active':'')+'">'+esc(m.label)+'</button>').join('')+
   '</div></div>';
 }).join('');
 const countFor=mode=>{
  const coverage=students.filter(s=>evidenceValue(s,{...ctx,mode}).available).length;
  const eligible=mode==='flourishing'?students.filter(maiaEligible).length:pending.has(mode)?0:mode==='report'?academicCoverage(students,academic,'report',chosenSubject).eligible:
   students.filter(s=>mode==='map'?(gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10):
    (mode==='engagement'||mode==='belonging')?experienceEligible(s):
     academicModesFor(s.grade).includes(mode)).length;
  if(mode==='flourishing'){
   const result=maiaClassSummary(students,maia,dim,maiaWindow);
   return '<strong>'+(result.average===null?'—':result.average.toFixed(1)+' / 10')+'</strong>'+
    '<span>'+result.available+' of '+result.eligible+' fictional responses · '+esc(MAIA_PERIODS.find(w=>w.key===maiaPeriod(maiaWindow))?.label||'Fall 2026')+'</span>';
  }
  if(pending.has(mode))return '<strong>Not connected</strong><span>No student results available in this demonstration</span>';
  if(mode==='engagement'||mode==='belonging'){
   const result=summarizeExperience(experience,students,mode,selectedWindow);
   return '<strong>'+(result.value===null?'—':result.value+' / 100')+'</strong>'+
    '<span>'+result.n+' of '+result.eligible+' check-ins · '+esc(recentWindow)+'</span>';
  }
  return '<strong>'+coverage+' of '+eligible+'</strong><span>learners with evidence'+
   (mode==='report'&&sample?' · '+esc(sample.year)+' · '+esc(sample.grade)+' (last issued)':'')+
   (mode==='map'?' · Fall 2026':'')+'</span>';
 };
 const summary=mode=>'<div class="class-evidence-selected"><span>'+esc(evidenceLabel(mode,ctx))+
  '</span>'+countFor(mode)+'</div>';
 const compareSelect='<label class="class-evidence-filter class-compare-filter">Compare with '+
  '<select data-class-compare aria-label="Compare roster evidence with">'+
  '<option value="none"'+(paired==='none'?' selected':'')+'>None · one measure</option>'+
  EVIDENCE_MODES.filter(m=>modes.includes(m.id)&&m.id!==selected).map(m=>
   '<option value="'+m.id+'"'+(paired===m.id?' selected':'')+'>'+esc(m.label)+'</option>').join('')+
  '</select></label>';
 const displayed=[selected,...(paired==='none'?[]:[paired])];
 const filters=[];
 if(displayed.includes('report')&&subjects.length){
  filters.push('<label class="class-evidence-filter">Report subject <select data-academic-subject aria-label="Report card subject">'+
   subjects.map(s=>'<option value="'+esc(s.subject)+'"'+(s.subject===chosenSubject?' selected':'')+'>'+
    esc(s.subject)+'</option>').join('')+'</select></label>');
 }
 if(displayed.includes('map')){
  filters.push('<label class="class-evidence-filter">MAP subject <select data-map-subject aria-label="MAP growth subject">'+
   MAP_SUBJECTS.map(x=>'<option value="'+esc(x)+'"'+(mapSubject===x?' selected':'')+'>'+esc(x)+'</option>').join('')+
   '</select></label>');
 }
 if(displayed.includes('flourishing')){
  filters.push('<label class="class-evidence-filter">Maia dimension <select data-maia-dimension aria-label="Maia PERMA dimension">'+
   MAIA_DIMENSIONS.map(d=>'<option value="'+d.key+'"'+(d.key===maiaDimension(dim)?' selected':'')+'>'+esc(d.label)+'</option>').join('')+'</select></label>');
  filters.push('<label class="class-evidence-filter">Maia window <select data-maia-window aria-label="Maia assessment window">'+
   MAIA_PERIODS.map(w=>'<option value="'+w.key+'"'+(w.key===maiaPeriod(maiaWindow)?' selected':'')+'>'+esc(w.label)+'</option>').join('')+'</select></label>');
 }
 if(displayed.some(id=>id==='engagement'||id==='belonging')){
  filters.push('<label class="class-evidence-filter">Check-in period <select data-class-window aria-label="Student check-in period">'+
   EXPERIENCE_WINDOWS.map(w=>'<option value="'+w.key+'"'+(w.key===selectedWindow?' selected':'')+'>'+esc(w.label)+'</option>').join('')+
   '</select></label>');
 }
 const breakdown=selected==='report'?
  '<details class="class-evidence-breakdown"><summary>View class results breakdown</summary>'+
  reportBreakdown(students,academic,chosenSubject)+'</details>':'';
 const note=displayed.includes('flourishing')?
  '<p class="class-evidence-secondary"><strong>Fictional Maia example · Secondary only.</strong> Five PERMA dimensions on an illustrative 0–10 display scale. No official Maia score fields or scoring scale verified; no personal records are used.</p>':
  (selected==='engagement'||selected==='belonging')?
  '<p class="class-evidence-secondary">Maia-style PERMA examples are available separately in Secondary classes; the two measures use different instruments and scales.</p>':'';
 return '<section class="class-evidence-panel" aria-label="Select learning and wellbeing evidence for the class roster">'+
  '<div class="class-evidence-heading"><div><span class="academic-eyebrow">CLASS DATA</span>'+
  '<h3>Learning &amp; wellbeing evidence</h3><p>Choose a measure. Compare two columns if useful.</p></div></div>'+
  '<div class="class-evidence-navigation">'+tabs+'</div>'+
  '<div class="class-evidence-controls">'+compareSelect+(filters.length?
   '<div class="class-evidence-filter-row">'+filters.join('')+'</div>':'')+'</div>'+
  '<div class="class-evidence-selection'+(paired!=='none'?' has-comparison':'')+'">'+
  summary(selected)+(paired!=='none'?summary(paired):'')+'</div>'+
  (paired!=='none'?'<p class="class-evidence-comparison-note">Two measures shown separately, with their own units and dates. No combined score.</p>':'')+
  '<p class="class-evidence-help">'+esc(modeHelp[selected])+'</p>'+note+breakdown+
  '</section>';
}
