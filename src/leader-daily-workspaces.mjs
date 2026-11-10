/** Leadership workflows over fictional records; no automated learner risk score. */
import {attendanceSummary,gradeNumber,gradeDisplay,GRADES} from './data.mjs';
import {academicFor,facultyDemoReport,academicModesFor} from './academic-journey-data.mjs';
import {leaderMapSummary,leaderCheckSnapshot} from './leader-summary.mjs';
import {studentSupportLeadershipSummary} from './leader-support-summary.mjs';
import {summarizeExperience,experienceChange,experienceEligible} from './experience-data.mjs';
import {leaderExperienceScale} from './leader-experience-bands.mjs';
import {reportProgress,mapProgress,academicCheckinProgress} from './evidence-progress.mjs';
import {esc} from './v2-ui.mjs';

const safe=v=>esc(String(v??''));
const n=v=>Number.isFinite(v)?v.toFixed(1):'—';
const display=g=>g==='K'?'Kindergarten':g.startsWith('PK')?g:'Grade '+g.slice(1);
export const ATTENDANCE_REVIEW_THRESHOLD=90;

export function leaderAttendanceReview(students,data,threshold=ATTENDANCE_REVIEW_THRESHOLD){
 const all=(students||[]).map(student=>{
  const events=data.attendance[student.id]||[];
  return {student,...attendanceSummary(events),last:events.at(-1)?.date||null};
 }).filter(x=>x.total&&Number.isFinite(x.rate));
 return {eligible:all.length,
  flagged:all.filter(x=>x.rate<threshold).sort((a,b)=>a.student.name.localeCompare(b.student.name)),
  average:all.length?Number((all.reduce((v,x)=>v+x.rate,0)/all.length).toFixed(1)):null,
  latest:all.map(x=>x.last).filter(Boolean).sort().at(-1)||'2026-10-08'};
}
export function leaderAcademicReview(students,academic){
 const results=(students||[]).filter(s=>gradeNumber(s.grade)>=6).map(student=>{
  const report=facultyDemoReport(academicFor(academic,student.id));
  if(!report||report.scale!=='1–7')return null;
  const outcomes=report.subjects.map(x=>({subject:x.subject,score:Number(x.value)}))
   .filter(x=>Number.isInteger(x.score)&&x.score>=1&&x.score<=7);
  return {student,report,outcomes,
   at2:outcomes.filter(x=>x.score<=2),at3:outcomes.filter(x=>x.score<=3)};
 }).filter(Boolean);
 return {all:results,at2:results.filter(x=>x.at2.length),at3:results.filter(x=>x.at3.length)};
}
export function leaderVoice(students,records,window='F26'){
 return ['engagement','belonging'].map(metric=>{
  const scope=(students||[]).filter(experienceEligible);
  const current=summarizeExperience(records,scope,metric,window);
  const comparison=experienceChange(records,scope,metric,window);
  return {metric,value:current.value,n:current.n,eligible:current.eligible,
   delta:comparison.delta,prior:comparison.previousLabel};
 });
}
/** Preserve homeroom/advisory cohorts; taught subject classes are not a survey cohort. */
export function leaderAdvisoryClasses(classes,division,grade='All'){
 return (classes||[]).filter(c=>c.division===division&&(grade==='All'||c.grade===grade)&&(
  /^G\d+-[A-D]$/.test(c.id)||/^PK\d?-[A-D]$/.test(c.id)||/^K-[A-D]$/.test(c.id)||
  /homeroom|advisory/i.test(c.name)||/^\d{1,2}[A-Z]{2}$/.test(c.id)));
}
function source(label,detail){
 return '<span class="leader-daily-source"><strong>'+safe(label)+'</strong><small>'+safe(detail)+'</small></span>';
}
function priority(label,value,description,tone,link,sourceText){
 return '<article class="leader-daily-priority '+safe(tone)+'"><div class="leader-daily-priority-head">'+
  '<h3>'+safe(label)+'</h3><strong>'+safe(value)+'</strong></div><p>'+safe(description)+'</p>'+
  '<small>'+safe(sourceText)+'</small>'+
  (link?'<button type="button" data-leader-jump="'+safe(link)+'">Review evidence <span aria-hidden="true">→</span></button>':'')+
  '</article>';
}
function divisionChoice(name,students,opts){
 const isSecondary=name==='Secondary',attendance=leaderAttendanceReview(students,opts.data),
  academics=leaderAcademicReview(students,opts.academic),
  support=studentSupportLeadershipSummary(students,opts.sssRecords,opts.entries);
 const literacy=leaderCheckSnapshot(students,opts.academic,'core');
 return '<button class="leader-division-choice '+name.toLowerCase()+'" data-leader-division="'+name+
  '" type="button"><span class="leader-division-eyebrow">'+
  (isSecondary?'SCIENCE PARK · GRADES 6–12':'ERSHA · EARLY YEARS–GRADE 5')+'</span>'+
  '<strong>'+name+'</strong><span class="leader-division-description">'+
  (isSecondary?'Subject evidence, attendance, learner review and follow-through':
   'Literacy, early learning, belonging, attendance and coordinated support')+'</span>'+
  '<span class="leader-choice-facts"><span><b>'+students.length+'</b> learners</span>'+
  '<span><b>'+attendance.flagged.length+'</b> attendance checks</span>'+
  '<span><b>'+(isSecondary?academics.at2.length:literacy.available)+'</b> '+
  (isSecondary?'subject result ≤2':'literacy check-ins')+'</span>'+
  '<span><b>'+(support.suppressed?'—':support.actionOpen)+'</b> open support actions</span></span>'+
  '<span class="leader-choice-go">Open '+name+' workspace <span aria-hidden="true">→</span></span></button>';
}
function voiceOverview(students,records,name){
 const values=leaderVoice(students,records);
 return '<article class="leader-school-voice"><h3>'+safe(name)+'</h3>'+
  '<p>Interpret within this division; Elementary and Secondary questions differ.</p>'+
  values.map(row=>'<div class="leader-school-voice-measure"><div><strong>'+
   safe(row.metric==='engagement'?'Engagement':'Belonging')+'</strong><span>'+
   (Number.isFinite(row.value)?row.value.toFixed(2):'—')+'</span></div>'+
   leaderExperienceScale(row.value,row.metric)+'</div>').join('')+
  '<small>'+values[0].n+' of '+values[0].eligible+
  ' responses · Fall 2026 · fictional −2 to +2 index</small></article>';
}
export function renderLeaderWholeSchool({students,data,academic,records,sssRecords,entries,savedView}){
 const elementary=students.filter(s=>s.division==='Elementary'),
  secondary=students.filter(s=>s.division==='Secondary');
 const attendance=leaderAttendanceReview(students,data),
  support=studentSupportLeadershipSummary(students,sssRecords,entries),
  academics=leaderAcademicReview(secondary,academic);
 const opts={data,academic,sssRecords,entries};
 return '<div class="leader-view leader-daily leader-schoolwide">'+
  '<section class="leader-welcome" aria-labelledby="leader-welcome-title">'+
   '<div class="leader-daily-eyebrow">WHOLE SCHOOL · START HERE</div>'+
   '<h2 id="leader-welcome-title">What deserves leadership attention today?</h2>'+
   '<p>Choose a division to see daily priorities, then drill into a grade and learner evidence. '+
   'The schoolwide view stays aggregated; it does not rank or label children.</p>'+
   '<div class="leader-daily-sources">'+
    source('DEMONSTRATION','Roster, academic, experience and support data are simulated')+
    source('NOT LIVE','Each measure retains its own source and evidence date')+'</div>'+
   (savedView?'<button type="button" class="leader-saved-open" data-leader-open-saved>'+
    'Open saved view: '+safe(savedView.division)+(savedView.grade!=='All'?' · '+safe(display(savedView.grade)):'')+
    ' <span aria-hidden="true">→</span></button>':'')+
  '</section>'+
  '<section class="leader-daily-section" aria-labelledby="leader-division-title">'+
   '<div class="leader-daily-sectionhead"><div><span>CHOOSE A WORKSPACE</span>'+
    '<h2 id="leader-division-title">Different divisions, different priorities</h2></div></div>'+
   '<div class="leader-division-grid">'+
    divisionChoice('Elementary',elementary,opts)+divisionChoice('Secondary',secondary,opts)+'</div></section>'+
  '<section class="leader-daily-section" aria-labelledby="leader-pulse-title">'+
   '<div class="leader-daily-sectionhead"><div><span>WHOLE-SCHOOL OPERATIONAL PULSE</span>'+
    '<h2 id="leader-pulse-title">What to look into</h2></div>'+
    '<p>Counts prompt professional inquiry, not automatic decisions.</p></div>'+
   '<div class="leader-daily-grid">'+
    priority('Learners included',students.length,'Across both divisions.','neutral',null,'Fictional roster · 8 Oct 2026')+
    priority('Attendance checks',attendance.flagged.length,'Below an illustrative 90% review threshold.',
     'amber',null,'Demo attendance · through '+attendance.latest)+
    priority('Secondary subjects ≤2',academics.at2.length,
     'One or more numeric results of 2 or below.','red',null,'Simulated 2026–27 in-progress report results')+
    priority('Open support actions',support.suppressed?'—':support.actionOpen,
     'Across a fictional coordinated support cycle.','blue',null,'Support cycle · 28 Oct 2026')+
   '</div></section>'+
  '<section class="leader-daily-section" aria-label="Student experience by division">'+
   '<div class="leader-daily-sectionhead"><div><span>STUDENT VOICE</span>'+
    '<h2>Different questions, separate interpretations</h2></div></div>'+
   '<div class="leader-school-voice-grid">'+
    voiceOverview(elementary,records,'Elementary · Grades 3–5')+
    voiceOverview(secondary,records,'Secondary · Grades 6–12')+'</div></section>'+
  '<p class="leader-daily-disclaimer">Public GitHub demonstration only. No real learner, '+
   'case or confidential survey records are included. Select a division to investigate evidence.</p></div>';
}
