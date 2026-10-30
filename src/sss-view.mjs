/** Read-only, completely fictional Student Support Services experience.
 * Shared student / academic / attendance / MAP / check-in models are passed in
 * by the main app; the only new records are synthetic membership and WIDA examples.
 * This file must never render genuine intervention notes, diagnoses or identifiers.
 */
import {experienceBand} from './faculty-bands.mjs?v=20261030wall2';
import {GRADES,attendanceSummary,gradeNumber} from './data.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {sssCohort,sssRecordFor} from './sss-demo-data.mjs';
import {managerFor} from './sss-leadership-data.mjs';
import {academicFor,latestAcademic} from './academic-journey-data.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {experienceFor,experienceEligible} from './experience-data.mjs';
import {renderAcademicProfile} from './academic-journey-view.mjs?v=20261028titles1';

const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const date=v=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return 'Not available';
 return new Date(v+'T12:00:00Z').toLocaleDateString('en-GB',{
  day:'numeric',month:'short',year:'numeric',timeZone:'UTC'
 });
};
const gradeTitle=grade=>grade==='K'?'Kindergarten':
 grade==='PK3'?'Pre-K 3':grade==='PK4'?'Pre-K 4':
 grade.startsWith('G')?'Grade '+grade.slice(1):grade;
const check=(record,mode)=>{
 const r=record?.[mode]?.at(-1);
 if(!r)return null;
 return {label:r.date||'',value:mode==='ixl'?String(r.level):
  mode==='core'?r.correct+'/'+r.assessed:r.level};
};
const mathReport=record=>{
 const report=record?.reports?.[0];
 const maths=report?.subjects.find(s=>['Mathematics','Early Mathematics'].includes(s.subject));
 return maths?{value:maths.value,detail:maths.subject+' · '+report.year+' ('+report.grade+')'}:null;
};
const literacyReport=record=>{
 const report=record?.reports?.[0];
 const literacy=report?.subjects.find(s=>['Early Literacy','English Language Arts','Language & Literature'].includes(s.subject));
 return literacy?{value:literacy.value,detail:literacy.subject+' · '+report.year+' ('+report.grade+')'}:null;
};
const growth=map=>map?.status==='comparable'?(map.actual>0?'+':'')+map.actual+' RIT':'—';
const serviceChips=record=>(record?.services||[]).map(s=>
 '<span class="sss-service">'+esc(s)+'</span>').join('');
const supportChips=student=>demoTagsForStudent(student)
 .filter(t=>!t.restricted).map(t=>'<span class="sss-support-flag" title="'+esc(t.fullName)+
 ' — fictional">'+esc(t.label)+'</span>').join('');
const actionBack='<button type="button" class="sss-back" data-sss-back>← Back to SSS learners</button>';

function studentRow(student,record,academics){
 const issued=mathReport(academicFor(academics,student.id));
 const evidence=issued?'<strong>'+esc(issued.value)+'</strong><small>'+
  esc(issued.detail)+'</small>':'<small>No issued Mathematics report yet</small>';
 const wida=record.wida?'<strong>'+record.wida.compositeLevel.toFixed(1)+
  ' <small>/ 6.0</small></strong><small>'+esc(record.wida.compositeLabel)+
  ' · '+date(record.wida.date)+'</small>':'<span class="sss-not-applicable">—</span>';
 return '<button type="button" class="sss-roster-row" data-sss-student="'+esc(student.id)+
  '" aria-label="Open SSS example for '+esc(student.name)+', '+esc(gradeTitle(student.grade))+'">'+
  '<span class="sss-roster-name"><strong>'+esc(student.last+', '+student.first)+'</strong>'+
  '<small>'+esc(student.classId)+' · '+esc(student.campus)+' · '+esc(managerFor(student))+'</small></span>'+
  '<span class="sss-roster-service">'+serviceChips(record)+
  '<span class="sss-roster-flags">'+supportChips(student)+'</span></span>'+
  '<span class="sss-roster-result">'+evidence+'</span>'+
  '<span class="sss-roster-wida">'+wida+'</span>'+
  '<span class="sss-roster-review"><span>'+date(record.reviewDate)+'</span>'+
  '<span class="sss-row-chevron" aria-hidden="true">›</span></span></button>';
}
function gradeGroup(students,grade,records,academics,open,collapsible=true){
 const rows=students.map(student=>studentRow(student,records.get(student.id),academics)).join('');
 const table='<div class="sss-roster-table" role="group" aria-label="'+esc(gradeTitle(grade))+
  ' students alphabetically by surname">'+
  '<div class="sss-roster-columns" aria-hidden="true"><span>Student · A–Z by surname</span>'+
  '<span>Support stream / flags</span><span>Last issued Mathematics</span>'+
  '<span>WIDA Screener</span><span>Next review</span></div>'+rows+'</div>';
 const title='<span class="sss-grade-heading">'+esc(gradeTitle(grade))+
  '<span class="sss-grade-count">'+students.length+' learners</span></span>';
 if(!collapsible)return '<section class="sss-grade-section"><h2>'+title+'</h2>'+table+'</section>';
 return '<details class="sss-grade-section" data-sss-grade-panel="'+esc(grade)+'"'+
  (open?' open':'')+'><summary>'+title+
  '<span class="sss-grade-chevron" aria-hidden="true">⌄</span></summary>'+
  table+'</details>';
}

export function renderSSSOverview({data,academicRecords,sssRecords,grade='All',query='',openGrades=[],caseManager='All'}){
 const cohort=sssCohort(data.students,sssRecords);
 const selected=sssCohort(data.students,sssRecords,grade,query).filter(s=>caseManager==='All'||managerFor(s)===caseManager);
 const counts={
  language:selected.filter(s=>sssRecords.get(s.id).services.includes('EAL')).length,
  learning:selected.filter(s=>sssRecords.get(s.id).services.includes('Learning Support')).length,
  wida:selected.filter(s=>sssRecords.get(s.id).wida!==null).length
 };
 const gradeChoices=GRADES.filter(g=>cohort.some(s=>s.grade===g));
 const choice=(g,label)=>'<option value="'+esc(g)+'"'+(grade===g?' selected':'')+'>'+esc(label)+'</option>';
 const picker='<div class="sss-filters"><label>Grade level<select data-select="sss-grade" aria-label="SSS grade level">'+
  choice('All','All grades')+gradeChoices.map(g=>
   choice(g,gradeTitle(g)+' · '+cohort.filter(s=>s.grade===g).length)).join('')+
  '</select></label><label>Find a learner<input type="search" data-sss-query '+
  'aria-label="Find learner in SSS demo cohort" placeholder="Search name…" value="'+esc(query)+'"></label></div>';
 const quick=(label,n,detail)=>'<div class="sss-number"><span>'+esc(label)+'</span>'+
  '<strong>'+n+'</strong><small>'+esc(detail)+'</small></div>';
 const overview='<div class="sss-overview"><div class="sss-brief"><div class="eyebrow">TEAM WORKSPACE · DEMO</div>'+
  '<h2>Support starts with the whole learner.</h2><p>Find the right student, review shared evidence and see '+
  'illustrative support approaches without opening multiple dashboards.</p></div>'+
  '<div class="sss-count-grid">'+
  quick('In this view',selected.length,'Of '+cohort.length+' fictional SSS learners')+
  quick('EAL stream',counts.language,'Students with illustrative language support')+
  quick('Learning Support',counts.learning,'Students with illustrative learning support')+
  quick('WIDA examples',counts.wida,'Elementary language screening samples')+
  '</div></div>';
 const groups=gradeChoices.filter(g=>selected.some(s=>s.grade===g)).map(g=>{
  const students=selected.filter(s=>s.grade===g);
  return gradeGroup(students,g,sssRecords,academicRecords,!!query||openGrades.includes(g),grade==='All');
 }).join('');
 const empty='<section class="sss-empty"><h3>No Matching SSS Learners</h3>'+
  '<p>Try another grade or clear the name search. Only fictional programme members appear here.</p></section>';
 return '<div class="sss-view">'+
  '<div class="sss-boundary"><strong>Prototype, not an authorised SSS system.</strong> All names, programme flags, '+
  'plans and WIDA scores are fictional. The tab is visible in this public demo; staff-only '+
  'access will require school SSO and server-enforced permissions.</div>'+
  overview+
  '<section class="sss-roster" aria-label="Fictional Student Support Services roster">'+
  '<div class="sss-section-head"><div><div class="eyebrow">PROGRAMME ROSTER</div>'+
  '<h2>My SSS Learners</h2><p>Sorted by grade, then surname A–Z. Only students '+
  'in the fictional SSS cohort are shown.</p></div></div>'+picker+
  (groups||empty)+
  '<p class="sss-footnote">EAL, SS and IEP tags are illustrative classroom signals. '+
  'They do not independently establish support eligibility. Medical and behavioural '+
  'flags do not automatically assign SSS membership.</p></section></div>';
}
function evidenceTile(title,value,detail){
 return '<div class="sss-evidence-tile"><span>'+esc(title)+'</span>'+
  '<strong>'+esc(value)+'</strong><small>'+esc(detail)+'</small></div>';
}
function renderWida(record){
 if(!record)return '<div class="sss-wida-empty">No fictional WIDA Screener example is attached '+
  'to this learner. WIDA is shown only for eligible Elementary students '+
  'in the EAL stream.</div>';
 const labels={Listening:'Listening',Reading:'Reading',Speaking:'Speaking',Writing:'Writing'};
 const columns=record.domains.map(row=>{
  const width=Math.round(row.level/6*100);
  return '<div class="sss-wida-domain" role="group" aria-label="'+esc(row.name)+
   ' proficiency level '+row.level.toFixed(1)+' out of 6.0">'+
   '<span class="sss-wida-label">'+esc(labels[row.name]||row.name)+'</span>'+
   '<div class="sss-wida-track" aria-hidden="true"><span style="width:'+width+'%"></span></div>'+
   '<strong>'+row.level.toFixed(1)+'</strong></div>';
 }).join('');
 return '<div class="sss-wida"><div class="sss-wida-intro"><div><span class="eyebrow">ENGLISH LANGUAGE PROFICIENCY</span>'+
  '<h3>WIDA Screening Snapshot</h3><p>'+esc(record.measure)+' · '+esc(record.format)+
  ' · '+date(record.date)+'</p></div>'+
  '<div class="sss-wida-composite"><span>'+esc(record.compositeLabel)+' composite</span>'+
  '<strong>'+record.compositeLevel.toFixed(1)+' <small>/ 6.0</small></strong></div></div>'+
  '<div class="sss-wida-domain-list">'+columns+'</div>'+
  '<p class="sss-footnote">Illustrative WIDA proficiency levels (1.0–6.0), not real score reports. '+
  'This is a one-time screening example, not a language-growth trend. '+
  'Composite scores are fictional examples, not calculated from these displayed domain levels. '+
  'Use actual WIDA reports, student language samples and team judgement for decisions; '+
  'no automatic identification or exit threshold is applied.</p></div>';
}

export function renderSSSStudentProfile({
 data,academicRecords,experienceRecords,sssRecords,studentId,reportYear='',academicOpen=false,supportWorkspace='',panel='evidence',
  tabNavigation='',summaryWorkspace='',plansWorkspace=''
}){
 const record=sssRecordFor(sssRecords,studentId);
 const student=record?data.userIndex.get(studentId):null;
 if(!student)return '<div class="sss-view">'+actionBack+
  '<section class="sss-empty"><h2>No SSS Record Available</h2>'+
  '<p>Only members of the fictional SSS programme can be opened in this prototype.</p></section></div>';
 const academic=academicFor(academicRecords,student.id);
 const attendance=attendanceSummary(data.attendance[student.id]||[]);
 const math=mathReport(academic),literacy=literacyReport(academic);
 const mathMap=latestMapGrowth(data.map[student.id]||[],'Mathematics');
 const readMap=latestMapGrowth(data.map[student.id]||[],'Reading');
 const n=gradeNumber(student.grade);
 const latestReading=check(academic,'fp');
 const core=check(academic,'core');
 const ixl=check(academic,'ixl');
 const showWida=record.wida!==null;
 const measures=[
  evidenceTile('Attendance',attendance.rate===null?'—':attendance.rate+'%',
    'Through 8 Oct 2026 · shared Faculty record'),
  evidenceTile('Latest Mathematics report',math?.value||'—',math?.detail||'No completed report'),
  evidenceTile('Latest literacy report',literacy?.value||'—',literacy?.detail||'No completed report')
 ];
 if(n>=3&&n<=10){
  measures.push(evidenceTile('MAP Mathematics growth',growth(mathMap),
   mathMap.status==='comparable'?'Observed RIT change · fictional MAP tests':'No comparable tests'));
  measures.push(evidenceTile('MAP Reading growth',growth(readMap),
   readMap.status==='comparable'?'Observed RIT change · fictional MAP tests':'No comparable tests'));
 }
 if(ixl)measures.push(evidenceTile('IXL Mathematics',ixl.value,'Diagnostic level · '+ixl.label));
 if(core)measures.push(evidenceTile('Core Phonics',core.value,'Fictional 50-item decoding check · '+core.label));
 if(latestReading)measures.push(evidenceTile('F&P text level',latestReading.value,
  'Illustrative reading complexity · '+latestReading.label));
 const studentExperience=experienceEligible(student)?
  '<section class="sss-profile-section"><div class="sss-section-head"><div>'+
   '<div class="eyebrow">STUDENT VOICE</div><h2>Learning Experience</h2>'+
   '<p>Fall 2026 check-in indices, not grades or diagnostic indicators.</p></div></div>'+
   '<div class="sss-experience-summary">'+['engagement','belonging'].map(id=>{
    const value=experienceFor(experienceRecords,student.id,id,'F26')?.value;
    return '<div class="sss-experience-with-help'+(Number.isFinite(value)?' index-'+experienceBand(value):'')+'">'+
     evidenceTile(id==='engagement'?'Engagement':'Belonging',
      value===undefined?'—':(value>0?'+':'')+value.toFixed(2)+' (−2 to +2)','Fictional Fall 2026 student check-in')+
     '<button type="button" class="experience-detail-link" data-experience-explain="'+id+
     '" data-experience-scope="sss" data-experience-student="'+esc(student.id)+
     '" data-experience-window="F26">ⓘ How is this calculated?</button></div>';
   }).join('')+'</div></section>':'';
 const learningTags=demoTagsForStudent(student).filter(tag=>!tag.restricted);
 const restricted=demoTagsForStudent(student).filter(tag=>tag.restricted);
 const strategies='<section class="sss-profile-section"><div class="sss-section-head"><div>'+
  '<div class="eyebrow">COLLABORATIVE SUPPORT</div><h2>Classroom Approaches</h2>'+
  '<p>Shared teacher-facing examples; authorised plans remain in approved school systems.</p>'+
  '</div></div><div class="sss-approach-grid">'+
  '<article><strong>Illustrative coordination focus</strong><p>'+esc(record.focus.strategy)+'</p></article>'+
  learningTags.map(tag=>'<article><strong>'+esc(tag.fullName)+'</strong>'+
   '<p>'+esc(tag.strategies[0])+'</p></article>').join('')+
  '</div>'+(restricted.length?'<p class="sss-footnote">Other fictional guidance indicators: '+
   restricted.map(t=>esc(t.label)).join(', ')+'. Any actual medical, safeguarding, behaviour or '+
   'counselling plans must remain in their own permission-controlled systems.</p>':'')+
  '<p class="sss-footnote">New entries remain only in this browser session. Do not enter real student information. '+
  'This is a fictional design demonstration.</p></section>';
 return '<div class="sss-view sss-student-view">'+
  actionBack+
  '<div class="sss-profile-hero"><div><div class="eyebrow">SSS LEARNER · FICTIONAL DEMO</div>'+
  '<h2>'+esc(student.name)+'</h2><p>'+esc(gradeTitle(student.grade))+
  ' · '+esc(student.classId)+' · '+esc(student.campus)+'</p>'+
  '<div class="sss-profile-tags">'+serviceChips(record)+supportChips(student)+'</div></div>'+
  '<span class="sss-private-label">Demonstration only · no real support plan</span></div>'+
   tabNavigation+
   (panel==='summary'?summaryWorkspace:panel==='plans'?plansWorkspace:panel==='history'?supportWorkspace:'')+
   (panel==='evidence'?'<div class="sss-profile-summary"><article class="sss-brief-card">'+
  '<span class="eyebrow">TEAM FOCUS</span><h3>'+esc(record.focus.title)+'</h3>'+
  '<p>'+esc(record.focus.goal)+'</p><small>Illustrative focus — not an individual learning plan</small></article>'+
  '<article class="sss-brief-card"><span class="eyebrow">COORDINATION</span>'+
  '<h3>Shared Review Rhythm</h3><dl><div><dt>Last example review</dt><dd>'+
  date(record.lastReviewed)+'</dd></div><div><dt>Next example review</dt><dd>'+
  date(record.reviewDate)+'</dd></div></dl>'+
  '<small>Dates are simulated; no real meetings are scheduled.</small></article>'+
  '<article class="sss-brief-card"><span class="eyebrow">LANGUAGE CONTEXT</span>'+
  '<h3>Learning Through Languages</h3><p>Recorded language in demo: '+
  esc(student.primaryLanguage||'Not provided')+'</p>'+
  '<small>Language background is not a disability or a measure of ability.</small></article></div>'+
  (showWida?'<section class="sss-profile-section">'+renderWida(record.wida)+'</section>':'')+
  '<section class="sss-profile-section"><div class="sss-section-head"><div>'+
  '<div class="eyebrow">SHARED EVIDENCE</div><h2>Learning Snapshot</h2>'+
  '<p>The same academic and learning data shown in Faculty and Student profiles.</p>'+
  '</div></div><div class="sss-evidence-grid">'+measures.join('')+'</div>'+
  '<p class="sss-footnote">Report-card outcomes are previously issued. '+
  'MAP uses RIT-point changes; IXL levels, phonics checks and F&P text levels '+
  'are separate measures, not percentages or interchangeable benchmarks.</p></section>'+
  studentExperience+
  strategies+
  '<details class="sss-detail" data-sss-detail="academics"'+
  (academicOpen?' open':'')+'>'+
  '<summary><span><strong>Open full academic history</strong>'+
  '<small>Issued subjects, IXL Mathematics, reading and phonics history where applicable</small>'+
  '</span><span aria-hidden="true">⌄</span></summary>'+
  '<div class="sss-detail-body">'+renderAcademicProfile(student,academicRecords,false,reportYear)+
  '</div></details>':'')+
  '<div class="sss-boundary sss-profile-boundary"><strong>Future restricted SSS view.</strong> '+
  'Staff must be assigned to this programme and learner before accessing any real information. '+
  'Authentication, server-side row permissions, audit logs and approved source-system links '+
  'are required before handling student records.</div></div>';
}
