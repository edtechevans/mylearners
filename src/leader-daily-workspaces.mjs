/** Leadership workflows over fictional records; no automated learner risk score. */
import {attendanceSummary,gradeNumber,gradeDisplay,GRADES} from './data.mjs';
import {academicFor,facultyDemoReport,academicModesFor} from './academic-journey-data.mjs';
import {leaderMapSummary,leaderCheckSnapshot} from './leader-summary.mjs';
import {studentSupportLeadershipSummary} from './leader-support-summary.mjs';
import {supportStatusBadges,supportStatusDetails} from './learner-support-status-ui.mjs?v=20261112supporttips1';
import {summarizeExperience,experienceChange,experienceEligible,EXPERIENCE_WINDOWS} from './experience-data.mjs';
import {leaderVoiceReview,leaderMapRedReview} from './leader-review-signals.mjs';
import {leaderExperienceScale,leaderExperienceBandLabel} from './leader-experience-bands.mjs';
import {reportProgress,mapProgress,academicCheckinProgress} from './evidence-progress.mjs';
import {esc} from './v2-ui.mjs';
import {renderMapRitProfile,mapRitCurrent,mapRitBand} from './map-rit-achievement.mjs';
import {renderStudentPhoto} from './student-photo-preview.mjs?v=20261111photo1';
import {renderUniversalScreenerTile} from './universal-screener.mjs';
import {mypBestFitMarker} from './report-card-signals.mjs';

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
  const outcomes=report.subjects.map(x=>({...x,score:Number(x.value)}))
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
 if(link){
  const action=link==='leader-review'?'data-leader-attendance-focus':
   'data-leader-jump="'+safe(link)+'"';
  return '<button type="button" class="leader-daily-priority is-actionable '+safe(tone)+
   '" '+action+' aria-label="Open '+safe(label)+': '+safe(value)+'. '+safe(description)+'">'+
   '<span class="leader-daily-priority-head"><span class="leader-priority-label">'+
   safe(label)+'</span><strong>'+safe(value)+'</strong></span>'+
   '<span class="leader-priority-description">'+safe(description)+'</span>'+
   '<small>'+safe(sourceText)+'</small>'+
   '<span class="leader-priority-arrow" aria-hidden="true">↗</span></button>';
 }
 return '<article class="leader-daily-priority '+safe(tone)+'"><div class="leader-daily-priority-head">'+
  '<h3>'+safe(label)+'</h3><strong>'+safe(value)+'</strong></div><p>'+safe(description)+
  '</p><small>'+safe(sourceText)+'</small></article>';
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
  (isSecondary?'Subject evidence, attendance, student experience and follow-through':
   'Literacy and early learning, attendance, belonging and coordinated support')+'</span>'+
  '<span class="leader-choice-facts"><span><b>'+(isSecondary?academics.at2.length:literacy.available)+'</b> '+
  (isSecondary?'subject result ≤2':'literacy check-ins')+'</span>'+
  '<span><b>'+attendance.flagged.length+'</b> attendance checks</span>'+
  '<span><b>'+students.length+'</b> learners</span>'+
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
  academics=leaderAcademicReview(secondary,academic),
  experience=leaderVoiceReview(students,records,'F26');
 const opts={data,academic,sssRecords,entries};
 return '<div class="leader-view leader-daily leader-schoolwide">'+
  '<section class="leader-welcome" aria-labelledby="leader-welcome-title">'+
   '<div class="leader-daily-eyebrow">WHOLE SCHOOL · START HERE</div>'+
   '<h2 id="leader-welcome-title">What deserves leadership attention today?</h2>'+
   '<p>Choose a division to see daily priorities, then drill into a grade and learner evidence. '+
   'The overview stays aggregated; use the separate Support Student Directory to explore individual fictional examples.</p>'+
   '<label class="leader-school-division-select">Division <select data-select="division" aria-label="Choose leadership division">'+
    '<option value="All" selected>Whole school</option><option value="Elementary">Elementary</option>'+
    '<option value="Secondary">Secondary</option></select></label>'+
   '<div class="leader-daily-sources">'+
    source('DEMONSTRATION','Roster, academic, experience and support data are simulated')+
    source('NOT LIVE','Each measure retains its own source and evidence date')+'</div>'+ 
   '<button type="button" class="leader-directory-cta" data-leader-directory-jump>'+ 
   'Browse Support Student Directory <span aria-hidden="true">→</span></button>'+
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
    '<p>Academics · Attendance · Student Experience · '+students.length+
    ' fictional learners. Counts prompt professional inquiry, not automatic decisions.</p></div>'+
   '<div class="leader-daily-grid">'+
    priority('Secondary subjects ≤2',academics.at2.length,
     'One or more numeric results of 2 or below.','red',null,'Simulated 2026–27 in-progress report results')+
    priority('Attendance checks',attendance.flagged.length,'Below an illustrative 90% review threshold.',
     'amber',null,'Simulated attendance')+
    priority('Student Experience to review',experience.rows.length,
     'Engagement or Belonging index at 0 or below; missing scores excluded.',
     'neutral',null,'Fall 2026 · age-specific student voice')+
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
   'case or confidential survey records are included. Choose a division for detailed evidence or browse the separate fictional support directory below.</p></div>';
}

export function leaderReviewQueue(students,data,academic,filter='all',expanded=false,isSecondary=true){
 const attendance=leaderAttendanceReview(students,data);
 const byAttendance=new Map(attendance.flagged.map(x=>[x.student.id,x]));
 const academics=leaderAcademicReview(students,academic);
 const byAcademic=new Map(academics.all.map(x=>[x.student.id,x]));
 const eligible=(students||[]).map(student=>({
  student,attendance:byAttendance.get(student.id)||null,academic:byAcademic.get(student.id)||null
 })).filter(x=>{
  if(!isSecondary)return !!x.attendance;
  if(filter==='academic2')return !!x.academic?.at2.length;
  if(filter==='academic3')return !!x.academic?.at3.length;
  if(filter==='attendance')return !!x.attendance;
  return !!x.attendance||!!x.academic?.at3.length;
 }).sort((a,b)=>gradeNumber(a.student.grade)-gradeNumber(b.student.grade)||
  a.student.name.localeCompare(b.student.name));
 return {total:eligible.length,shown:expanded?eligible:eligible.slice(0,10),
  academic2:academics.at2.length,academic3:academics.at3.length,
  attendance:attendance.flagged.length};
}
function gradesBar(division,grade,allStudents){
 const grades=GRADES.filter(g=>(gradeNumber(g)<=5?'Elementary':'Secondary')===division&&
  allStudents.some(s=>s.grade===g));
 return '<nav class="leader-grade-bar" aria-label="Drill down by grade"><strong>Choose a grade</strong>'+
  '<button type="button" data-leader-grade="All" aria-pressed="'+(grade==='All')+'">All grades</button>'+
  grades.map(g=>'<button type="button" data-leader-grade="'+safe(g)+'" aria-pressed="'+(g===grade)+'">'+
   safe(g==='K'?'K':g)+'</button>').join('')+'</nav>';
}
function concernsEvidence(x,isSecondary){
 const pieces=[];
 if(isSecondary&&x.academic){
  const low=x.academic.at2.length?x.academic.at2:x.academic.at3;
  if(low.length){
   pieces.push(low.slice(0,3).map(row=>
    safe(row.subject)+' <b class="leader-grade-flag '+(row.score<=2?'red':'orange')+'">'+
    row.score+mypBestFitMarker(row)+'</b>').join(' · ')+(low.length>3?' +'+(low.length-3)+' more':''));
  }
 }
 if(x.attendance)pieces.push('Attendance '+n(x.attendance.rate)+'%');
 return pieces.join('<span class="leader-review-separator"> • </span>');
}
export function renderLeaderDivisionDaily({division,grade,students,allStudents,data,
 academic,records,sssRecords,entries,reviewFilter='all',expanded=false,savedView=null,
 voiceWindow='F26',academicPanels='',journeyPanel='',academicActions='',
 focusSection='follow-up',savedNotice='',screenerPanel=''}){
 const secondary=division==='Secondary',
  attendance=leaderAttendanceReview(students,data),
  academics=leaderAcademicReview(students,academic),
  support=studentSupportLeadershipSummary(students,sssRecords,entries),
  voice=leaderVoice(students,records);
 const queue=leaderReviewQueue(students,data,academic,reviewFilter,expanded,secondary);
 const voiceReview=leaderVoiceReview(students,records,voiceWindow);
 const hasMap=students.some(st=>gradeNumber(st.grade)>=3&&gradeNumber(st.grade)<=10);
 const focusTabs=[['follow-up','Follow-up'],...(hasMap?[['journeys','MAP Journeys']]:[]),
  ['academics','Academic Trends'],['experience','Student Experience'],['support','Support']];
 const currentFocus=focusTabs.some(t=>t[0]===focusSection)?focusSection:'follow-up';
 const panel=(id,content)=>'<section id="leader-focus-panel-'+id+
  '" class="leader-focus-panel" role="tabpanel" aria-labelledby="leader-focus-tab-'+id+'"'+
  (currentFocus===id?'':' hidden')+'>'+content+'</section>';
 const delta=voice.map(x=>x.delta).filter(Number.isFinite);
 const change=delta.length?Math.min(...delta):null;
 const supportCount=support.suppressed?'—':support.actionOpen;
 const gradeLabel=grade==='All'?division:display(grade);
 const focus=secondary?'Secondary daily lens':'Elementary daily lens';
 const literacy=leaderCheckSnapshot(students,academic,'core');
 const phi=leaderCheckSnapshot(students,academic,'fp');
 const literacyCount=students.filter(s=>gradeNumber(s.grade)>=0&&gradeNumber(s.grade)<=5)
  .filter(s=>(academicFor(academic,s.id).core||[]).length>0).length;
 const headline=secondary?
  priority('Subject results ≤2',academics.at2.length,'Learners with one or more numeric results of 2 or below.',
   'red','leader-report-followup-title','2026–27 simulated, in progress and not issued'):
  priority('Literacy checks',literacyCount,
   'Core Phonics checks available for eligible Kindergarten–Grade 5 learners.',
   'blue','leader-academic-detail','Fall 2026 simulated decoding checks');
 const lens=secondary?
  'Subject reviews, attendance patterns, Student Experience and coordinated follow-through.':
  'Attendance, literacy progress, age-appropriate student voice and coordinated support.';
 const buttons=secondary?[['all','All evidence'],['academic2','2 or below'],['academic3','3 or below'],['attendance','Attendance']]:
  [['all','Attendance review']];
 const body=queue.shown.map(x=>{
  const issue=x.academic?.at2.length?'Subject result ≤2':x.academic?.at3.length?
   'Subject result ≤3':'Attendance';
  return '<tr><th scope="row"><span class="leader-review-identity">'+
   renderStudentPhoto(x.student,'leader')+
   '<span><button class="leader-student-open" type="button" data-leader-student="'+
   safe(x.student.id)+'">'+safe(x.student.name)+'</button>'+
   '<small>'+safe(display(x.student.grade))+'</small></span></span></th>'+
   '<td><span class="leader-review-kind '+(x.academic?.at2.length?'severe':'')+'">'+
    safe(secondary?issue:'Attendance check')+'</span></td>'+
   '<td>'+concernsEvidence(x,secondary)+'</td>'+
   '<td><button type="button" class="leader-review-open" data-leader-student="'+safe(x.student.id)+'">'+
    'Review evidence <span aria-hidden="true">→</span></button></td></tr>';
 }).join('');
 return '<div class="leader-daily-workspace">'+
  '<section class="leader-division-hero">'+
   '<nav class="leader-breadcrumbs" aria-label="Leadership location"><button type="button" data-leader-division="All">'+
    'Whole school</button><span aria-hidden="true">/</span>'+
    '<button type="button" data-leader-division="'+safe(division)+'">'+safe(division)+'</button>'+
    (grade==='All'?'':'<span aria-hidden="true">/</span><strong>'+safe(display(grade))+'</strong>')+'</nav>'+
   '<div class="leader-division-hero-row"><div><div class="leader-daily-eyebrow">'+safe(focus)+'</div>'+
    '<h2>'+safe(gradeLabel)+' · priorities and progress</h2><p>'+safe(lens)+'</p></div>'+
    '<div class="leader-save-view"><button data-leader-save-view type="button">Save this setup</button>'+
    (savedView?'<small>Saved: '+safe(savedView.division)+
      (savedView.grade!=='All'?' · '+safe(display(savedView.grade)):'')+
      ' · '+safe(focusTabs.find(t=>t[0]===savedView.section)?.[1]||'Follow-up')+'</small>':'')+
    '<small role="status" aria-live="polite">'+safe(savedNotice)+'</small>'+
    '</div></div>'+
   gradesBar(division,grade,allStudents)+
   '<details class="leader-source-details"><summary>Evidence sources and dates</summary>'+
   '<div class="leader-daily-sources">'+
    source('SUBJECTS','2026–27 demo · not issued')+
    source('ATTENDANCE','Demo attendance')+
    source('STUDENT VOICE','Fall 2026 simulated')+
    source('SUPPORT','Synthetic · 28 Oct 2026')+
   '</div></details></section>'+
  '<section id="leader-daily-priorities" class="leader-daily-section" aria-labelledby="leader-daily-priorities-title">'+
   '<div class="leader-daily-sectionhead"><div><span>START HERE</span>'+
    '<h2 id="leader-daily-priorities-title">Needs attention</h2></div>'+
    '<p>'+students.length+' learners in scope · not an automated risk ranking</p></div>'+
   academicActions+
   '<div class="leader-daily-grid'+(secondary?' leader-operational-grid':'')+'">'+
    (secondary?'':headline)+
    priority('Attendance checks',attendance.flagged.length,'Below the illustrative 90% review threshold.',
     'amber','leader-review','Simulated attendance')+
    priority('Student Experience to review',voiceReview.rows.length,
     'Engagement or Belonging at or below 0 in the selected check-in.',
     'green','leader-experience-review','Selected fictional check-in · −2 to +2')+
    priority('Open support actions',supportCount,support.suppressed?
     'Small-group summary suppressed. Expand scope.':'Open follow-ups in the fictional support cycle.',
     'blue','leader-support-title','Demo SSS cycle · 28 Oct 2026')+
   '</div>'+
   (Number.isFinite(change)?'<p class="leader-summary-change">Student Experience change: '+
    (change>0?'+':'')+change.toFixed(2)+' index points in the least-improved measure. '+
    '<button type="button" data-leader-jump="leader-experience-title">Explore trend</button></p>':'')+
   '<p class="leader-daily-note">'+safe(secondary?
    (students.some(s=>gradeNumber(s.grade)>=11)?
     'Grades 11–12 use DP subject evidence; MAP and IXL end at Grade 10. MYP and DP results are not combined into a grade average.':
     'MAP applies to eligible Grades 6–10. MYP Current Best Fit uses only criteria assessed so far; missing criteria are not counted. Current subject results are not issued reports.'):
    'Elementary report descriptors are not 1–7 grades. Literacy checks must be interpreted within grade and programme.')+
    '</p></section>'+
  screenerPanel+
  '<nav class="leader-focus-nav" role="tablist" aria-label="Explore Leadership evidence">'+
   focusTabs.map(([id,label])=>
    '<button type="button" role="tab" id="leader-focus-tab-'+id+'" data-leader-focus="'+id+
    '" aria-selected="'+(currentFocus===id)+'" aria-controls="leader-focus-panel-'+id+'"'+
    (currentFocus===id?' tabindex="0"':' tabindex="-1"')+'>'+safe(label)+'</button>'
   ).join('')+'</nav>'+
  panel('journeys',journeyPanel)+panel('academics',academicPanels)+
  '<section id="leader-focus-panel-follow-up" class="leader-focus-panel" role="tabpanel"'+
  ' aria-labelledby="leader-focus-tab-follow-up"'+(currentFocus==='follow-up'?'':' hidden')+'>'+
  '<section id="leader-review" class="leader-daily-section leader-review-section" aria-labelledby="leader-review-title">'+
   '<div class="leader-daily-sectionhead"><div><span>LEARNER REVIEW · READ ONLY</span>'+
    '<h2 id="leader-review-title">'+(secondary?'Attendance and learner review':'Attendance and early learning review')+
    '</h2></div><p>Select a learner to see the evidence and comparable prior windows.</p></div>'+
   '<div class="leader-review-toolbar" role="group" aria-label="Evidence review filters">'+
    buttons.map(([id,label])=>'<button type="button" data-leader-review-filter="'+id+
     '" aria-pressed="'+(reviewFilter===id)+'">'+label+
     (id==='academic2'?'<b>'+queue.academic2+'</b>':id==='academic3'?'<b>'+queue.academic3+'</b>':
      id==='attendance'?'<b>'+queue.attendance+'</b>':'')+'</button>').join('')+
   '</div><p class="leader-review-count">'+queue.total+' learners match'+
    (queue.total>queue.shown.length?' · first '+queue.shown.length+' displayed':'')+
    '. Results are not a combined learner risk score.</p>'+
   (body?'<div class="leader-review-scroll"><table class="leader-review-table">'+
    '<thead><tr><th scope="col">Learner</th><th scope="col">Review lens</th>'+
     '<th scope="col">Evidence</th><th scope="col">Action</th></tr></thead>'+
    '<tbody>'+body+'</tbody></table></div>':
    '<p class="leader-review-empty">No learners match this particular evidence filter. '+
    'This does not imply the absence of other learning or wellbeing needs.</p>')+
   (queue.total>10?'<button class="leader-review-expand" data-leader-review-expand type="button">'+
    (expanded?'Show first 10':'Show all '+queue.total+' matching learners')+'</button>':'')+
   '<p class="leader-review-footnote">The 90% attendance threshold is illustrative, not an official AISG intervention rule. '+
   'No confidential support cases or safeguarding records are shown. Record actual decisions in authorised systems.</p>'+
  '</section>'+
  '</section>'+
  '</div>';
}

function miniSeries(points){
 if(!points?.length)return '<span class="leader-no-history">No earlier comparable window</span>';
 return '<div class="leader-mini-series">'+points.map((x,i)=>
  '<span class="'+(i===points.length-1?'current':'')+'"><small>'+safe(x.label)+'</small>'+
   '<b>'+safe(x.value)+(x.provisional?mypBestFitMarker({mypBestFit:true,provisional:true}):'')+'</b></span>').join('')+'</div>';
}
export function renderLeaderLearnerEvidence({student,data,academic,records,window='F26',journeyProfile='',returnLabel='division review'}){
 const a=academicFor(academic,student.id),report=facultyDemoReport(a);
 const events=data.attendance[student.id]||[],att=attendanceSummary(events);
 const numeric=report?.scale==='1–7';
 const grades=(report?.subjects||[]).map(row=>{
  const score=Number(row.value);
  const band=numeric&&Number.isInteger(score)&&score<=2?'red':
   numeric&&Number.isInteger(score)&&score===3?'orange':'';
  const fitNote=row.mypBestFit?
   '<small class="leader-best-fit-note" title="Missing criteria are not counted.">'+
    safe((row.provisional?'Current Best Fit':'MYP Grade')+' · '+row.assessedCriteria+
     '/4 criteria · '+row.projectedCriteriaTotal+'/32')+'</small>':'';
  return '<article class="leader-profile-subject"><div><strong>'+safe(row.subject)+'</strong>'+
   '<span class="leader-profile-grade '+band+'">'+safe(row.value)+mypBestFitMarker(row)+'</span></div>'+
   fitNote+miniSeries(reportProgress(a,row.subject).points)+'</article>';
 }).join('');
 const other=academicModesFor(student.grade).filter(mode=>['core','fp','ixl'].includes(mode))
  .map(mode=>'<div class="leader-profile-assessment"><strong>'+safe(
   mode==='core'?'Core Phonics':mode==='fp'?'F&P reading':'IXL Mathematics')+'</strong>'+
   miniSeries(academicCheckinProgress(a,mode).points)+'</div>').join('');
 const map=gradeNumber(student.grade)>=3&&gradeNumber(student.grade)<=10?
  ['Mathematics','Reading'].map(subject=>
   '<div class="leader-profile-assessment '+(mapRitBand(mapRitCurrent(data.map[student.id]||[],subject)?.percentile)?'map-rit-'+mapRitBand(mapRitCurrent(data.map[student.id]||[],subject)?.percentile).key:'map-rit-unclassified')+'"><strong>MAP '+safe(subject)+'</strong>'+
    miniSeries(mapProgress(data.map[student.id]||[],subject).points)+'</div>').join(''):'';
 const voice=experienceEligible(student)?['engagement','belonging'].map(metric=>{
  const score=summarizeExperience(records,[student],metric,window).value;
  return '<article class="leader-profile-voice"><strong>'+safe(metric==='engagement'?'Engagement':'Belonging')+
   '</strong><span class="leader-voice-colour" role="img" aria-label="'+safe(metric+': '+(leaderExperienceBandLabel(score)?.label||'No recorded band'))+'"></span>'+
   leaderExperienceScale(score,metric)+'</article>';
 }).join(''):'';
 return '<div class="leader-daily leader-learner-profile">'+
  '<div class="leader-profile-header"><button type="button" data-leader-back>← Back to '+safe(returnLabel)+'</button>'+
   '<span>READ-ONLY · FICTIONAL EVIDENCE</span></div>'+
   '<div class="leader-profile-identity">'+renderStudentPhoto(student,'profile')+
   '<div class="leader-profile-identity-text">'+
   '<div class="leader-daily-eyebrow">'+safe(student.division)+' / '+safe(display(student.grade))+'</div>'+
   '<h2>'+safe(student.name)+'</h2>'+supportStatusBadges(student)+'<p>See the evidence in context before choosing a response. '+
    'A result or absence pattern is not a judgement about a learner.</p></div></div>'+
   '<div class="leader-profile-facts"><div><span>Homeroom</span><strong>'+safe(student.classId)+'</strong></div>'+
    '<div><span>Attendance</span><strong>'+n(att.rate)+'%</strong></div>'+
    '<div class="us-profile-fact"><span>Universal Screener · demo</span>'+
     renderUniversalScreenerTile(student,{compact:true})+
     '<small>Synthetic 0–100% result</small></div>'+
    '<div><span>Current subject results</span><strong>'+safe(report?.year||'Unavailable')+'</strong>'+
     '<small>'+safe(numeric?'1–7 in progress · not issued':'Developmental descriptors · simulated')+'</small></div></div>'+
   supportStatusDetails(student)+'<section><div class="leader-daily-sectionhead"><div><span>SUBJECT RESULTS</span>'+
    '<h3>Current evidence and comparable previous windows</h3></div></div>'+
    '<div class="leader-profile-subjects">'+grades+'</div></section>'+
   (map||other?'<section><div class="leader-daily-sectionhead"><div><span>ASSESSMENT WINDOWS</span>'+
    '<h3>Progress by measure</h3></div></div>'+
    '<div class="leader-profile-assessments">'+map+other+'</div></section>':'')+
   renderMapRitProfile(data.map[student.id]||[])+journeyProfile+
   (voice?'<section><div class="leader-daily-sectionhead"><div><span>STUDENT VOICE</span>'+
    '<h3>Personal check-in indices</h3></div>'+
    '<p>'+safe(EXPERIENCE_WINDOWS.find(x=>x.key===window)?.label||'Selected check-in')+'</p></div>'+
    '<div class="leader-profile-voices">'+voice+'</div></section>':'')+
   '<div class="leader-daily-disclaimer">These records are synthetic. Reports and assessment tools use different '+
    'scales and dates. Support casework, confidential notes and safeguarding data are not displayed. '+
    'Follow-up actions must be recorded in an authorised school system.</div></div>';
}
