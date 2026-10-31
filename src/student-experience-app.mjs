import {generateDemoData,attendanceSummary,gradeNumber,GRADES} from './data.mjs';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from './faculty-demo.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {leaderMapSummary,leaderAcademicCoverage,leaderCheckSnapshot,leaderReportBreakdown} from './leader-summary.mjs';
import {renderLeaderSupportSection} from './leader-support-view.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {createSSSDemoRecords} from './sss-demo-data.mjs';
import {seedSupportDemo,loadDraftEntries,storeDraftEntries,createDraftEntry} from './support-workspace-data.mjs';
import {renderFacultySupportPanel,renderSSSWorkspace,renderSupportForm} from './support-workspace-ui.mjs';
import {CASE_MANAGERS,REFERRAL_STAGES,STRATEGIES,lastReferralStage} from './sss-leadership-data.mjs';
import {renderSSSLeadershipDashboard,renderSSSProfileNavigation,renderSSSSummary,renderSSSPlans} from './sss-leadership-ui.mjs';
import {renderSSSOverview,renderSSSStudentProfile} from './sss-view.mjs?v=20261030wall3';
import {portrait} from './portraits.mjs';
import {createExperienceRecords,experienceFor,summarizeExperience,experienceChange,experienceQuestionSummary,EXPERIENCE_WINDOWS,EXPERIENCE_METRICS,METRIC_IDS,experienceEligible} from './experience-data.mjs?v=20261030repair1';
import {experienceDialogContent} from './experience-explain-modal.mjs?v=20261030wall3';
import {decorateEvidencePreviews,installEvidencePreviewController} from './evidence-previews.mjs?v=20261031v3';
import {resolveEvidencePreview} from './evidence-preview-context.mjs?v=20261030hover1';
import {esc} from './v2-ui.mjs';
import {createAcademicDemoRecords,academicFor,academicModesFor,latestAcademic,READING_LEVELS} from './academic-journey-data.mjs';
import {quartileBand,formatIndex,experienceBand} from './faculty-bands.mjs?v=20261030wall2';
import {renderAcademicProfile,classAcademicCell} from './academic-journey-view.mjs?v=20261028titles1';
import {everydayEvidenceForGrade,EVERYDAY_VIEW,FOCUSED_VIEW} from './faculty-everyday-columns.mjs?v=20261030wall1';
import {renderClassEvidencePanel,evidenceModesForGrade,normalizeEvidenceMode,normalizeComparison,evidenceLabel,evidenceValue,evidenceRosterColumn} from './class-evidence.mjs?v=20261031v2';
import {createMaiaDemoRecords,maiaDimension,maiaPeriod,renderMaiaFacultyProfile} from './maia-demo.mjs';
import {renderStudentOverview} from './student-daily-overview.mjs?v=20261028titles1';
import {renderBoard} from './board-map-view.mjs?v=20261029dpaxis1';
import {renderTrendPointDetails} from './board-map-overview.mjs?v=20261029dpaxis1';
import {renderDPPointDetails} from './board-dp-view.mjs?v=20261031dp-audit1';
import {renderDPSubjectPointDetails} from './board-dp-subjects.mjs';
import {DP_RECORDS} from './board-dp-data.mjs?v=20261029verifiedglobal1';
import {boardWindowFor,BOARD_DATA} from './board-map-data.mjs';
import {parseBoardHash} from './board-map-links.mjs?v=20261029dpaxis1';
const DATA=applyFacultyDemo(generateDemoData()),RECORDS=createExperienceRecords(DATA.students),
 ACADEMIC_RECORDS=createAcademicDemoRecords(DATA.students),
 MAIA_RECORDS=createMaiaDemoRecords(DATA.students),
 SSS_RECORDS=createSSSDemoRecords(DATA.students);
const SUPPORT_SEEDED=seedSupportDemo(DATA.students,SSS_RECORDS);
let SUPPORT_DRAFTS=loadDraftEntries();
const supportEntries=()=>[...SUPPORT_SEEDED.filter(x=>!SUPPORT_DRAFTS.some(d=>d.id===x.id)),...SUPPORT_DRAFTS];
const root=document.getElementById('app');
const saved=(k,d)=>{try{return sessionStorage.getItem(k)||d}catch{return d}};
const facultyPref=(teacherId,field,fallback='')=>{
 try{return localStorage.getItem('mylearners-demo-'+teacherId+'-'+field)||fallback}catch{return fallback}
};
const rememberFaculty=()=>{
 try{
  localStorage.setItem('mylearners-demo-'+state.teacher+'-class',state.classId);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-mode',state.academicMode);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-evidence',state.classEvidence);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-compare',state.classCompare);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-checkin',state.classExperienceWindow);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-maia-dimension',state.maiaDimension);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-maia-window',state.maiaWindow);
  localStorage.setItem('mylearners-demo-'+state.teacher+'-subject',state.academicSubject)
 }catch{}
};
const recallFaculty=()=>{
 state.classId=facultyPref(state.teacher,'class','');
 state.academicMode=facultyPref(state.teacher,'mode','report');
 state.classEvidence=facultyPref(state.teacher,'evidence','report');
 state.classCompare=facultyPref(state.teacher,'compare','none');
 state.classExperienceWindow=facultyPref(state.teacher,'checkin','F26');
 state.maiaDimension=maiaDimension(facultyPref(state.teacher,'maia-dimension','relationships'));
 state.maiaWindow=maiaPeriod(facultyPref(state.teacher,'maia-window','F26'));
 state.academicSubject=facultyPref(state.teacher,'subject','Mathematics');
};
const ROLE_IDS=['faculty','student','sss','leader','board'];
const initialHash=String(globalThis.location?.hash||'').replace(/^#\//,'').split('?')[0];
const initialRole=ROLE_IDS.includes(initialHash)?initialHash:saved('my-role','faculty');
const state={role:ROLE_IDS.includes(initialRole)?initialRole:'faculty',
 teacher:saved('my-teacher',DEFAULT_TEACHER_ID),
 division:'All',grade:'All',classId:'',studentId:'',query:'',metric:'engagement',window:'F26',details:false,checkin:false,
 academicMode:'report',academicSubject:'Mathematics',academicReportYear:'',studentGrade:'G7',
 classEvidence:'report',classMapSubject:'Mathematics',classCompare:'none',classExperienceWindow:'F26',rosterView:EVERYDAY_VIEW,
 maiaDimension:'relationships',maiaWindow:'F26',
 studentReportsOpen:false,studentWellbeingOpen:false,leaderAcademicOpen:false,leaderPatternsOpen:false,
  leaderSupportOpen:false,
 sssGrade:'All',sssQuery:'',sssStudentId:'',sssOpenGrades:['G3'],sssAcademicOpen:false,
  supportForm:null,supportFilter:'all',supportQuery:'',
  sssManager:'All',sssPanel:'summary',supportBarrier:'All',
 boardWindow:saved('my-board-window-v2','fall2026'),boardSubject:saved('my-board-subject','math'),
 boardDivision:saved('my-board-division','all'),boardGrade:saved('my-board-grade','all'),
 boardView:'overview',boardTrendTerm:'fall',boardTrendFocus:'all',boardTrendRange:'recent',boardOverviewChart:'dp',
 boardMapDetailsOpen:false,boardMapCompareSeasons:false,boardMapGrowthOpen:false,
 boardDpMetric:'passRate',boardDpScale:'focus',boardDpWorldBasis:'recipients',boardDpGlobal:true,
 boardDpYear:String(DP_RECORDS.at(-1).end),boardDpRange:'all',boardDpSubject:'math-aa-sl'};
recallFaculty();
if(state.role==='leader')state.classId='';
const boardDeepLink=parseBoardHash(globalThis.location?.hash);
if(boardDeepLink&&state.role==='board')Object.assign(state,boardDeepLink);
const safe=(v)=>esc(v??'');
const teacher=()=>DATA.teachers.find(t=>t.id===state.teacher)||DATA.teachers.find(t=>t.id===DEFAULT_TEACHER_ID);
const ownClasses=()=>DATA.classes.filter(c=>teacher().classIds.includes(c.id));
const ownStudents=()=>DATA.students.filter(s=>teacher().classIds.includes(s.classId));
const activeClass=()=>ownClasses().find(c=>c.id===state.classId)||ownClasses()[0];
const previewController=installEvidencePreviewController(root,trigger=>resolveEvidencePreview(trigger,{
 role:state.role,state,data:DATA,academic:ACADEMIC_RECORDS,experience:RECORDS,sssRecords:SSS_RECORDS,
 allowedStudentIds:ownStudents().map(s=>s.id),
 allowedClassIds:ownClasses().map(c=>c.id)
}));
const fmt=v=>v===null||v===undefined?'—':v;
const avg=(arr)=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):null;
const eligible=ss=>ss.filter(experienceEligible);
const opt=(value,label,current)=>'<option value="'+safe(value)+'"'+(value===current?' selected':'')+'>'+safe(label)+'</option>';
const btn=(action,label,kind='')=>'<button class="action '+kind+'" data-action="'+action+'">'+label+'</button>';
const pill=(txt)=>'<span class="pill">'+safe(txt)+'</span>';
const kpi=(label,value,detail,action='')=>'<article class="kpi"><div class="eyebrow">'+safe(label)+'</div><strong>'+fmt(value)+'</strong><div class="muted">'+detail+'</div>'+(action?btn(action,'Explore →','quiet'):'')+'</article>';
function metricCard(ss,id,window='F26',scope='main'){
 const sum=summarizeExperience(RECORDS,ss,id,window);
 const change=experienceChange(RECORDS,ss,id,window);
 const comparison=change.delta===null?(change.previousLabel?'No comparable previous check-in':'First available check-in'):
   (change.delta>0?'+':'')+change.delta+' vs '+change.previousLabel;
 const source=EXPERIENCE_WINDOWS.find(x=>x.key===window)?.label||window;
 const band=experienceBand(sum.value);
 return '<article class="metric"><div class="metric-top"><span class="eyebrow">'+safe(EXPERIENCE_METRICS[id].label)+' index</span><span class="tiny">Fictional '+safe(source)+' check-in</span></div>'+
 '<div class="metric-value'+(band?' index-'+band:'')+'">'+(Number.isFinite(sum.value)?sum.value.toFixed(2):'—')+'</div>'+
 (sum.value===null?'<div class="meter experience-index-meter is-missing" aria-label="No check-in responses"></div>':
 '<div class="meter experience-index-meter" role="img" aria-label="Four-band index from minus two to plus two"><i style="left:'+((sum.value+2)/4*100).toFixed(1)+'%"></i></div>')+
 '<p>'+safe(EXPERIENCE_METRICS[id].description)+'</p><div class="metric-foot"><span>'+sum.n+' of '+sum.eligible+' responses</span><span>'+safe(comparison)+'</span></div>'+
 (sum.value===null?'':btn('explain:'+scope+':'+id,'How is this calculated?','quiet'))+'</article>';
}
function info(){return '<div class="notice"><strong>Demonstration only.</strong> Learners, report cards, IXL Mathematics levels, Core Phonics checks, F&P text levels, assessment history, survey-style check-ins and class assignments are all fictional. No actual AISG learner results or confidential climate-survey responses are used. Experience indices are exploratory descriptions, not validated scores or labels.</div>'}
const ROLE_DISPLAY=Object.freeze({faculty:'Faculty',student:'Student',sss:'SSS',leader:'Leaders',board:'Board'});
const ROLE_DESCRIPTION=Object.freeze({
 faculty:'Faculty dashboard',
 student:'Student dashboard',
 sss:'Student Support Services (SSS) demonstration dashboard',
 leader:'Leaders dashboard',
 board:'Board dashboard'
});
function header(){
 return '<button type="button" class="skip-link" data-skip-main>Skip to main content</button>'+
 '<header class="top"><div class="brand"><span class="brand-emblem"><img src="assets/aisg-logo.webp" alt="AISG logo"></span>'+
 '<div><span class="brand-kicker">AISG / LEARNING INTELLIGENCE</span><strong>My Learners</strong><span class="brand-tagline">Engagement for All</span></div></div>'+
 '<nav class="roles" aria-label="Dashboard views"><span class="roles-label">WORKSPACES</span>'+
 ROLE_IDS.map(r=>'<button type="button" data-role="'+r+'" aria-pressed="'+(state.role===r)+
 '" aria-label="Open '+ROLE_DESCRIPTION[r]+'" title="'+ROLE_DESCRIPTION[r]+
 '" class="'+(state.role===r?'selected':'')+'">'+ROLE_DISPLAY[r]+'</button>').join('')+
 '</nav></header>';
}
function heading(title,desc){
 const asOf=new Date(DATA.asOf+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
 return '<div class="heading"><div><div class="eyebrow">AISG · 2026–27</div><h1>'+safe(title)+'</h1><p>'+safe(desc)+'</p></div>'+
 '<div class="heading-meta"><span class="demo">FICTIONAL DATA</span><span class="asof">Demo snapshot: '+safe(asOf)+'</span></div></div>';
}
function selector(id,options,selected){return '<select data-select="'+id+'" aria-label="'+safe(id)+'">'+options.map(x=>opt(x[0],x[1],selected)).join('')+'</select>'}
function scoreExplanation(id,ss,student){
 const entry=student?experienceFor(RECORDS,student.id,id,state.window):null;
 const qs=entry?.items||experienceQuestionSummary(RECORDS,ss,id,state.window);
 const summary=student?{value:entry?.value,n:entry?1:0,eligible:1}:summarizeExperience(RECORDS,ss,id,state.window);
 const windowLabel=EXPERIENCE_WINDOWS.find(w=>w.key===state.window)?.label||state.window;
 return '<section class="explain" id="score-explanation"><div class="row-between"><div><span class="eyebrow">HOW THIS INDEX WORKS</span><h2>Understanding '+safe(EXPERIENCE_METRICS[id].label)+'</h2></div>'+btn('close','Close ×','quiet')+'</div>'+
 '<p class="score-source">Source: fictional '+safe(windowLabel)+' student check-in · '+summary.n+' of '+summary.eligible+' responses</p>'+
 '<p>Responses are scored: <strong>Strongly disagree −2</strong> · <strong>Disagree −1</strong> · <strong>Agree +1</strong> · <strong>Strongly agree +2</strong>. The index is their mean, rounded to two decimals. Zero is an average, not a selectable response. It is <strong>not</strong> a percentage of students agreeing, an achievement score, or a label.</p>'+
 '<div class="explain-number">'+(Number.isFinite(summary.value)?summary.value.toFixed(2):'—')+'</div>'+
 '<div class="explain-items">'+qs.map(q=>'<div><span>'+safe(q.question)+'</span><strong>'+fmt(student?q.points:q.value)+(student?'':'')+(student||q.value!==null?' / +2':'')+'</strong>'+
 (student?'<small>My response: '+safe(q.label)+'</small>':'<small>'+fmt(q.favorable)+'% agree or strongly agree · '+q.n+' responses</small>')+'</div>').join('')+'</div>'+
 '<p class="tiny">This is an exploratory AISG-created indicator, not a validated measurement. Use the underlying responses and wider context to understand the experience, never to rank students.</p></section>';
}
function metrics(ss,student,scope='main'){
 if(!eligible(ss).length)return '<p class="not-collected">Student experience indices are not collected for PK–Grade 2 in this demonstration.</p>';
 return '<div class="metrics">'+METRIC_IDS.map(id=>metricCard(student?[student]:ss,id,state.window,scope)).join('')+'</div>';
}
function roster(ss,options={}){
 const across=!!options.across;
 const grade=ss[0]?.grade||activeClass()?.grade||'';
 const allowed=academicModesFor(grade);
 const mode=across?'report':normalizeEvidenceMode(grade,state.classEvidence);
 const compare=across?'none':normalizeComparison(grade,mode,state.classCompare);
 const evidenceCtx={academic:ACADEMIC_RECORDS,map:DATA.map,
  experience:RECORDS,maia:MAIA_RECORDS,maiaDimension:state.maiaDimension,maiaWindow:state.maiaWindow,
  subject:state.academicSubject,mapSubject:state.classMapSubject,
  window:state.classExperienceWindow};
 const reportSubjects=academicFor(ACADEMIC_RECORDS,ss[0]?.id).reports?.[0]?.subjects||[];
 const subject=reportSubjects.some(x=>x.subject===state.academicSubject)?
  state.academicSubject:reportSubjects[0]?.subject||'';
 // The everyday view is a deliberately small, grade-aware selection of existing
 // evidence. Focused mode preserves the original single-measure comparison UX.
 const everyday=!across&&state.rosterView===EVERYDAY_VIEW;
 const everydayColumns=everyday?everydayEvidenceForGrade(grade):[];
 const hasAcademicBands=everydayColumns.some(c=>['map','ixl','core','fp'].includes(c.kind));
 const hasExperienceBands=everydayColumns.some(c=>['engagement','belonging'].includes(c.kind));
 const checkinLabel=EXPERIENCE_WINDOWS.find(w=>w.key===state.classExperienceWindow)?.label||'Fall 2026';
 const everydayHeading=column=>column.kind==='engagement'||column.kind==='belonging'?
  (column.kind==='engagement'?'Engagement':'Belonging')+' · '+checkinLabel:column.label;
 const gradeCohort=DATA.students.filter(s=>s.grade===grade);
 const gradeReferences=new Map();
 const evidenceNumeric=(s,column)=>{
  const result=evidenceValue(s,{...evidenceCtx,mode:column.kind,subject:column.subject||'Mathematics',mapSubject:'Mathematics'});
  if(!result.available)return null;
  if(column.kind==='fp'){const level=READING_LEVELS.indexOf(result.text);return level>=0?level:null}
  const value=Number.parseFloat(result.text);
  return Number.isFinite(value)?value:null;
 };
 const relativeBand=(student,column)=>{
  if(!['map','ixl','core','fp'].includes(column.kind))return null;
  const key=column.kind+'|'+(column.subject||'');
  if(!gradeReferences.has(key))gradeReferences.set(key,gradeCohort.map(s=>evidenceNumeric(s,column)).filter(Number.isFinite));
  return quartileBand(evidenceNumeric(student,column),gradeReferences.get(key),20);
 };
 const everydaySort=(student,column)=>{
  if(column.kind==='attendance')return attendanceSummary(DATA.attendance[student.id]||[]).rate;
  if(column.kind==='engagement'||column.kind==='belonging')
   return experienceFor(RECORDS,student.id,column.kind,state.classExperienceWindow)?.value??null;
  return evidenceNumeric(student,column);
 };
 const everydayCell=(student,column)=>{
  if(column.kind==='attendance'){
   const attendance=attendanceSummary(DATA.attendance[student.id]||[]);
   const value=attendance.rate===null||attendance.rate===undefined?'—':fmt(attendance.rate)+'%';
   return '<span class="class-evidence-result"><strong>'+safe(value)+'</strong><small>Through 8 Oct 2026</small></span>';
  }
  const reports=academicFor(ACADEMIC_RECORDS,student.id).reports?.[0]?.subjects||[];
  const subject=column.kind==='report'&&(column.id==='math'&&
   !reports.some(x=>x.subject==='Mathematics')&&reports.some(x=>x.subject==='Early Mathematics'))?
   'Early Mathematics':column.subject||state.academicSubject;
  const context={...evidenceCtx,mode:column.kind,subject,
   mapSubject:column.kind==='map'?'Mathematics':state.classMapSubject,
   maiaDimension:column.kind==='flourishing'?'relationships':state.maiaDimension};
  const result=evidenceValue(student,context);
  const quartile=relativeBand(student,column);
  const content=quartile?
   '<span class="class-evidence-result evidence-heat '+quartile.band+'"><strong>'+quartile.label+
   '</strong><small>'+safe(result.text)+'</small></span>':evidenceRosterColumn(student,context);
  const isExperience=column.kind==='engagement'||column.kind==='belonging';
  const windowIndex=EXPERIENCE_WINDOWS.findIndex(w=>w.key===state.classExperienceWindow);
  const prior=windowIndex>0&&isExperience?
   experienceFor(RECORDS,student.id,column.kind,EXPERIENCE_WINDOWS[windowIndex-1].key):null;
  const current=isExperience?experienceFor(RECORDS,student.id,column.kind,state.classExperienceWindow):null;
  const change=prior&&current?Math.round((current.value-prior.value)*100)/100:null;
  const trend=change===null?'':change>0?'↑':change<0?'↓':'→';
  const detail=quartile?
   column.label+': '+quartile.label+' among '+quartile.count+
   ' same-grade fictional demo results; actual result '+result.text+'. This is not an official norm.':
   column.label+': '+result.text+'. '+result.detail+
   (isExperience?'. Fixed four-band −2 to +2 index.':'');
  const trendDetail=change===null?'':'. Change since '+EXPERIENCE_WINDOWS[windowIndex-1].label+': '+formatIndex(change);
  const title=safe(detail+trendDetail+'. Select to open learner profile');
  const button='<button type="button" class="evidence-cell-open" data-student="'+safe(student.id)+
   '" aria-label="'+title+'">'+content+
   (trend?'<span class="evidence-trend" aria-hidden="true">'+trend+'</span>':'')+'</button>';
  return '<span class="evidence-cell-layout">'+button+'</span>';
 };

 const modeLabel=across?'Last issued report':evidenceLabel(mode,{...evidenceCtx,subject});
 const compareLabel=compare==='none'?'':evidenceLabel(compare,{...evidenceCtx,subject});
 const query=state.query.trim().toLowerCase();
 const rows=ss.filter(s=>!query||s.name.toLowerCase().includes(query));
 const showMap=across&&rows.some(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10);
 const showSEL=across&&rows.some(s=>experienceEligible(s));
 const data=rows.map(student=>{
  const engagement=experienceEligible(student)?fmt(experienceFor(RECORDS,student.id,'engagement')?.value):'—';
  const belonging=experienceEligible(student)?fmt(experienceFor(RECORDS,student.id,'belonging')?.value):'—';
  const attendance=attendanceSummary(DATA.attendance[student.id]);
  const growth=latestMapGrowth(DATA.map[student.id]||[]);
  const eligibleMap=gradeNumber(student.grade)>=3&&gradeNumber(student.grade)<=10;
  const growthText=eligibleMap?(growth.status==='comparable'?(growth.actual>=0?'+':'')+growth.actual+' RIT':'Not yet comparable'):'—';
  const rec=academicFor(ACADEMIC_RECORDS,student.id);
  const latest=rec.reports?.[0]||null;
  const mixSubject=latest?.subjects.find(x=>x.subject==='Mathematics'||x.subject==='Early Mathematics')?.subject
   ||latest?.subjects[0]?.subject||'';
  const academics=across?
   '<span class="roster-mixed-academic">'+classAcademicCell(student,ACADEMIC_RECORDS,'report',mixSubject)+
   (latest?'<small>'+safe(mixSubject)+' · '+safe(latest.year)+' ('+safe(latest.grade)+')</small>':'<small>No issued report</small>')+'</span>':
   evidenceRosterColumn(student,{...evidenceCtx,subject,mode});
  const compared=compare==='none'?'':evidenceRosterColumn(student,{...evidenceCtx,subject,mode:compare});
  return {student,attendance:fmt(attendance.rate)+'%',growth:growthText,
   eng:engagement,bel:belonging,everydayCells:everydayColumns.map(column=>everydayCell(student,column)),
   everydaySortValues:everydayColumns.map(column=>everydaySort(student,column)),academics,
   compared,tags:demoTagsForStudent(student),
   sss:SSS_RECORDS.has(student.id)};
 });
 const heading=across?'Students matching “'+safe(state.query.trim())+'”':'My Students';
 const context=across?rows.length+' of '+ss.length+' assigned students across all classes':
  rows.length+' of '+ss.length+' learners in '+safe(activeClass()?.name||'this class');
 const evidenceColWidth=(53/Math.max(1,everydayColumns.length-1)).toFixed(4);
 const colgroup=everyday?'<colgroup><col class="roster-col-learner"><col class="roster-col-attendance">'+
  everydayColumns.slice(1).map(()=>'<col class="roster-col-evidence" style="width:'+evidenceColWidth+'%">').join('')+
  '<col class="roster-col-support"></colgroup>':'';
 const table='<div class="tablewrap roster-desktop"><table'+(everyday?' class="faculty-data-wall"':'')+'>'+colgroup+'<thead><tr><th>Learner</th>'+
  (across?'<th>Class</th>':'')+
  (everyday?everydayColumns.map(column=>'<th>'+safe(everydayHeading(column))+'</th>').join(''):
   '<th>Attendance</th><th>'+safe(modeLabel)+'</th>'+(compare==='none'?'':'<th>'+safe(compareLabel)+'</th>'))+
  (!everyday&&showMap?'<th>MAP Math growth</th>':'')+
  (!everyday&&showSEL?'<th>Engagement</th><th>Belonging</th>':'')+
  '<th>Support information</th></tr></thead><tbody>'+
  data.map(x=>'<tr><td><button class="student-link" data-student="'+x.student.id+
   '"><img src="'+portrait(x.student.portraitSeed)+'" alt="">'+safe(x.student.name)+'</button></td>'+
   (across?'<td><span class="roster-class-label">'+safe(x.student.classId)+'</span></td>':'')+
   (everyday?x.everydayCells.map((cell,i)=>'<td data-ux-sort-value="'+
    (Number.isFinite(x.everydaySortValues[i])?String(x.everydaySortValues[i]):'')+'">'+cell+'</td>').join(''):
    '<td>'+x.attendance+'</td><td>'+x.academics+'</td>'+(compare==='none'?'':'<td>'+x.compared+'</td>'))+
   (!everyday&&showMap?'<td>'+safe(x.growth)+'</td>':'')+
   (!everyday&&showSEL?'<td>'+x.eng+'</td><td>'+x.bel+'</td>':'')+
   '<td>'+(x.sss?'<span class="pill sss-faculty-indicator" title="Fictional SSS programme membership">SSS</span> ':'')+
    x.tags.map(t=>pill(t.label)).join(' ')+'</td></tr>').join('')+'</tbody></table></div>';
 const mobile='<div class="roster-mobile">'+data.map(x=>
  '<button class="roster-item" data-student="'+x.student.id+'" aria-label="Open learner '+safe(x.student.name)+'">'+
  '<img src="'+portrait(x.student.portraitSeed)+'" alt=""><span class="roster-item-body"><strong>'+
  safe(x.student.name)+'</strong>'+
  (across?'<span>Class '+safe(x.student.classId)+'</span>':'')+
  (everyday?everydayColumns.map((column,i)=>'<span>'+safe(everydayHeading(column))+': '+
   x.everydayCells[i].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()+'</span>').join(''):
   '<span>'+safe(modeLabel)+': '+x.academics.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()+
   '</span>'+(compare==='none'?'':'<span>'+safe(compareLabel)+': '+
    x.compared.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()+'</span>'))+
  (!everyday?'<span>Attendance '+x.attendance+(showMap?' · MAP '+safe(x.growth):'')+'</span>':'')+
  (!everyday&&experienceEligible(x.student)?'<span>Engagement '+x.eng+' · Belonging '+x.bel+'</span>':'')+
  (x.sss?'<span>SSS programme · demonstration</span>':'')+
  '</span><span class="roster-arrow" aria-hidden="true">›</span></button>').join('')+'</div>';
 return '<section class="roster roster-daily" data-roster-layout="'+(everyday?'everyday':'focused')+'" aria-label="'+(across?'Search across assigned students':'My class roster')+'">'+
  '<div class="sectionhead"><div><h2>'+heading+'</h2><span class="tiny">'+context+'</span></div>'+
  (across?'<button type="button" class="roster-clear-search" data-clear-search>Clear search</button>':'')+'</div>'+
  (options.controls||'')+
  (everyday&&(hasAcademicBands||hasExperienceBands)?'<div class="faculty-evidence-legend" aria-label="Understanding the evidence colours">'+
   '<strong>'+(hasAcademicBands?'Four academic evidence bands':'Four fixed experience bands')+'</strong>'+
   '<span class="faculty-legend-swatches">'+
   '<span class="faculty-legend-chip band-low">'+(hasAcademicBands?'Q1':'−2')+'</span>'+
   '<span class="faculty-legend-chip band-mid-low">'+(hasAcademicBands?'Q2':'−1')+'</span>'+
   '<span class="faculty-legend-chip band-mid-high">'+(hasAcademicBands?'Q3':'0')+'</span>'+
   '<span class="faculty-legend-chip band-high">'+(hasAcademicBands?'Q4':'+1')+'</span></span>'+
   '<span class="faculty-legend-caption">'+(hasAcademicBands?
     'Academic: relative same-grade demo quartiles'+(hasExperienceBands?' · Experience: fixed −2 to +2 bands':''):
     'Student experience: fixed −2 to +2 index ranges, not quartiles')+'</span>'+
   '<details><summary>Interpret colours</summary><p>MAP and IXL bands compare learners within the same fictional grade cohort, not official NWEA or IXL benchmarks. Engagement and Belonging use four fixed ranges from −2 to +2. Missing evidence is grey. A colour describes evidence, never a child.</p></details></div>':'')+
  table+mobile+
  (rows.length?'':'<p class="empty-message">No matching students in your assigned classes. Try a different name.</p>')+
  '<details class="faculty-inquiry-prompt"><summary>From evidence to action</summary>'+
   '<p>Notice a pattern, check the source and date, and consider what more you might need to know. Select a learner to review their context and use the existing classroom response or follow-up tools. Do not draw conclusions from colour alone.</p></details>'+
  '<p class="tiny roster-caption">Sources and windows vary. Academic quartiles compare fictional same-grade cohorts with at least 20 results, not official norms. Student voice uses fixed index ranges. Select a learner to review the source, date, programme and history.</p>'+
  '</section>';
}

function learnerProfile(s,studentRole=false){
 if(!s)return '<section class="card">Select a learner to begin.</section>';
 const aa=attendanceSummary(DATA.attendance[s.id]||[]),
  mg=latestMapGrowth(DATA.map[s.id]||[]),tags=demoTagsForStudent(s);
 const rec=academicFor(ACADEMIC_RECORDS,s.id);
 const issued=rec.reports?.[0];
 const math=issued?.subjects.find(x=>x.subject==='Mathematics'||x.subject==='Early Mathematics')||null;
 const n=gradeNumber(s.grade);
 const mapApplicable=n>=3&&n<=10;
 const profileStart=studentRole?'':'<div class="row-between"><button class="back" data-action="back">← Back to my students</button></div>';
 const header='<div class="profile-head"><img src="'+portrait(s.portraitSeed)+'" alt="Fictional portrait">'+
  '<div><div class="eyebrow">'+(studentRole?'MY LEARNING PROFILE':'WHOLE LEARNER PROFILE')+'</div>'+
  '<h1>'+safe(s.name)+'</h1><p>'+safe(s.grade)+' · '+safe(s.classId)+' · '+safe(s.campus)+'</p>'+
  (!studentRole&&SSS_RECORDS.has(s.id)?'<span class="sss-faculty-profile-tag">SSS · fictional cohort</span>':'')+'</div></div>';
 const history=studentRole&&experienceEligible(s)?
  '<section class="card student-checkin-history"><h3>How My Check-ins Have Changed</h3><div class="trend">'+
  EXPERIENCE_WINDOWS.map(w=>{
   const e=experienceFor(RECORDS,s.id,'engagement',w.key)?.value;
   const b=experienceFor(RECORDS,s.id,'belonging',w.key)?.value;
   return '<div><span>'+w.label+'</span><strong>Engagement '+fmt(e)+'</strong>'+
    '<strong>Belonging '+fmt(b)+'</strong></div>';
  }).join('')+'</div><p class="tiny">My check-ins describe my experience of learning, not my ability or a school grade.</p></section>':'';
 const maiaFaculty=studentRole?'':renderMaiaFacultyProfile(s,MAIA_RECORDS);
 const wellbeing=experienceEligible(s)?
  '<div class="sectionhead"><h2>'+(studentRole?'How I feel about learning':'Student Experience')+
  '</h2><span class="tiny">Fictional Fall 2026 check-ins</span></div>'+
  metrics([s],s,studentRole?'student':'profile')+history:
  '<p class="academic-early-checkin-note">Student engagement and belonging check-ins begin in Grade 3 in this demonstration.</p>';
 const academics=renderAcademicProfile(s,ACADEMIC_RECORDS,studentRole,state.academicReportYear);
 if(studentRole){
  return profileStart+header+
   renderStudentOverview(s,ACADEMIC_RECORDS,{
    attendance:DATA.attendance[s.id],mathGrowth:mg,
    reflectionDraft:saved('reflection-'+s.id,'')})+
   '<details class="student-detail-section" data-student-panel="reports" id="student-reports"'+
    (state.studentReportsOpen?' open':'')+'>'+
   '<summary><span class="student-panel-symbol" aria-hidden="true">▤</span>'+
   '<span><strong>My school reports and skills</strong>'+
   '<small>Subjects, mathematics and reading check-ins · up to three report years</small></span>'+
   '<span class="student-panel-chevron" aria-hidden="true">⌄</span></summary>'+
   academics+'</details>'+
   (experienceEligible(s)?
    '<details class="student-detail-section" data-student-panel="wellbeing" id="student-wellbeing"'+
     (state.studentWellbeingOpen?' open':'')+'>'+
    '<summary><span class="student-panel-symbol" aria-hidden="true">♡</span>'+
    '<span><strong>How I experience learning</strong>'+
    '<small>Engagement, belonging and my past check-ins</small></span>'+
    '<span class="student-panel-chevron" aria-hidden="true">⌄</span></summary>'+
    '<div class="student-wellbeing-content">'+wellbeing+'</div></details>':
    '<p class="academic-early-checkin-note">Student engagement and belonging check-ins begin in Grade 3 in this demo.</p>');
 }
 const profileKpis='<div class="kpis profile-kpis">'+
  kpi('Attendance',fmt(aa.rate)+'%','Through 8 Oct 2026')+
  (mapApplicable?kpi('MAP Mathematics growth',mg.status==='comparable'?
   (mg.actual>=0?'+':'')+mg.actual:'—',
   mg.status==='comparable'?'RIT points · latest comparable MAP tests':'Not yet comparable'):'')+
  (math?kpi('Latest Mathematics report',math.value,issued?'Issued '+safe(issued.year)+
   ' · Grade '+safe(issued.grade)+' · '+safe(issued.framework):''):'')+'</div>';
 const guidance='<section class="card academic-next-step"><h2>Classroom Guidance</h2>'+
  (tags.length?tags.map(t=>'<div class="guide"><strong>'+safe(t.fullName)+'</strong><p>'+
   safe(t.strategies[0])+'</p></div>').join(' '):
  '<p class="muted">No additional classroom guidance tags in this fictional example.</p>')+
  '<p class="tiny">Detailed support plans and confidential records are not included in this public demo.</p></section>';
 return profileStart+header+profileKpis+academics+wellbeing+maiaFaculty+
   renderFacultySupportPanel(s,supportEntries(),SSS_RECORDS.get(s.id))+guidance;
}

function quickStat(label,value,detail,action='',band=''){
 return (action?'<button type="button" data-action="'+safe(action)+'" class="quick-tile quick-score'+(band?' '+safe(band):'')+'">':'<div class="quick-tile'+(band?' '+safe(band):'')+'">')+
 '<span>'+safe(label)+'</span><strong>'+fmt(value)+'</strong><small>'+detail+'</small>'+(action?'</button>':'</div>');
}
function faculty(){
 const cs=ownClasses();
 if(!cs.some(c=>c.id===state.classId))state.classId=cs[0]?.id||'';
 const ss=(activeClass()?.studentIds||[]).map(id=>DATA.userIndex.get(id));
 const selected=ownStudents().find(s=>s.id===state.studentId);
 if(selected)return learnerProfile(selected);
 const searching=!!state.query.trim();
 const meanAttendance=avg(ss.map(s=>attendanceSummary(DATA.attendance[s.id]).rate));
 const gradeHasCheckins=eligible(ss).length>0;
 const score=id=>{
  const sum=summarizeExperience(RECORDS,ss,id);
  const band=experienceBand(sum.value);
  return quickStat(EXPERIENCE_METRICS[id].label,Number.isFinite(sum.value)?sum.value.toFixed(2):'—',
   sum.value===null?'No check-in':sum.n+'/'+sum.eligible+' responses · How is this calculated?',
   sum.value===null?'':'explain:faculty:'+id,band?'index-'+band:'');
 };
 const toolbar='<div class="toolbar faculty-toolbar faculty-daily-toolbar">'+
  '<label>My class '+selector('class',cs.map(c=>[c.id,c.name]),state.classId)+'</label>'+
  '<label class="search-label">Find any assigned student'+
   '<input data-query placeholder="Search across all my classes..." value="'+safe(state.query)+
   '" aria-label="Search for a student across all assigned classes"></label>'+
  '<details class="faculty-demo-options"><summary>Demo controls</summary>'+
   '<label class="faculty-demo-picker">Faculty demo '+
   selector('teacher',DATA.teachers.map(t=>[t.id,t.name]),state.teacher)+'</label></details></div>';
 const summary=searching?'':'<div class="quick-summary faculty-daily-summary">'+
  quickStat('My Class',ss.length,'Learners in '+safe(activeClass()?.name||'this class'))+
  quickStat('Attendance',fmt(meanAttendance)+'%','Through 8 Oct 2026')+
  (gradeHasCheckins?score('engagement')+score('belonging'):
   '<div class="quick-note">Student-reported experience indices start at Grade 3 in this demo.</div>')+'</div>';
 const reportControls=searching?'':renderClassEvidencePanel(ss,{
  academic:ACADEMIC_RECORDS,map:DATA.map,experience:RECORDS,maia:MAIA_RECORDS,
  maiaDimension:state.maiaDimension,maiaWindow:state.maiaWindow,
  rosterView:state.rosterView,mode:state.classEvidence,subject:state.academicSubject,
  mapSubject:state.classMapSubject,compare:state.classCompare,window:state.classExperienceWindow});
 return heading('My students','Find a learner, see essential information, or choose a class result.')+
  toolbar+summary+
  roster(searching?ownStudents():ss,{across:searching,controls:reportControls})+
  info();
}

function leader(){
 const grades=GRADES;
 const divisions=state.division==='All'?['Elementary','Secondary']:[state.division];
 const group=DATA.students.filter(s=>divisions.includes(s.division)&&
  (state.grade==='All'||s.grade===state.grade)&&(!state.classId||s.classId===state.classId));
 const classes=DATA.classes.filter(c=>divisions.includes(c.division)&&
  (state.grade==='All'||c.grade===state.grade));
 const selectedClass=classes.find(c=>c.id===state.classId);
 const scopeLabel=selectedClass?.name||
  (state.grade!=='All'?
   (state.grade==='K'?'Kindergarten':
    state.grade.startsWith('PK')?'Pre-K '+state.grade.slice(2):
    state.grade.startsWith('G')?'Grade '+state.grade.slice(1):state.grade):
   state.division==='All'?'Whole school':state.division);
 const rows=state.classId?[[selectedClass?.name||state.classId,group]]:
  state.grade==='All'?grades.filter(g=>group.some(s=>s.grade===g))
   .map(g=>[g,group.filter(s=>s.grade===g)]):
   classes.map(c=>[c.name,group.filter(s=>s.classId===c.id)]);
 const math=leaderMapSummary(group,DATA.map,'Mathematics');
 const reading=leaderMapSummary(group,DATA.map,'Reading');
 const reports=leaderAcademicCoverage(group,ACADEMIC_RECORDS,'report');
 const checkedDivisions=new Set(group.filter(experienceEligible).map(s=>s.division));
 const splitExperience=checkedDivisions.size>1;
 const selectedWindow=EXPERIENCE_WINDOWS.find(w=>w.key===state.window)?.label||'Fall 2026';
 const stat=(title,value,detail,meta)=>'<article class="leader-stat">'+
  '<div class="leader-stat-heading"><span>'+safe(title)+'</span>'+
  '<small>'+safe(meta)+'</small></div><strong>'+safe(value)+'</strong>'+
  '<p>'+safe(detail)+'</p></article>';
 const growthTile=(name,measure)=>stat(name,measure.rate===null?'—':measure.rate+'%',
  measure.rate===null?'No comparable MAP tests for this selection.':
  measure.met+' of '+measure.compared+' with comparable tests met the illustrative growth target.',
  'MAP · Grades 3–10');
 const experienceBlock=(ss,scope,title,subtitle)=>{
  const available=ss.filter(experienceEligible);
  const titleRow=title?'<div class="leader-experience-heading"><h3>'+safe(title)+'</h3>'+
    '<span>'+safe(subtitle)+'</span></div>':'';
  if(!available.length)return '<section class="leader-experience-group">'+titleRow+
   '<p class="leader-empty">Student experience check-ins begin in Grade 3; none are available for this selection.</p></section>';
  const cards=METRIC_IDS.map(id=>{
   const summary=summarizeExperience(RECORDS,ss,id,state.window);
   const change=experienceChange(RECORDS,ss,id,state.window);
   const comparison=change.delta===null?'No earlier comparable check-in':
    (change.delta>0?'+':'')+change.delta+' index points vs '+change.previousLabel;
   return '<article class="leader-experience-card'+(experienceBand(summary.value)?' index-'+experienceBand(summary.value):'')+'"><span class="leader-measure-label">'+
    safe(EXPERIENCE_METRICS[id].label)+'</span><div class="leader-experience-value">'+
    (Number.isFinite(summary.value)?summary.value.toFixed(2):'—')+'</div>'+
    '<p class="leader-experience-change">'+safe(comparison)+'</p>'+
    '<p class="leader-experience-count">'+summary.n+' of '+summary.eligible+
    ' eligible students responded</p>'+
    (summary.value===null?'':btn('explain:'+scope+':'+id,'How calculated','quiet'))+
    '</article>';
  }).join('');
  return '<section class="leader-experience-group">'+titleRow+
   '<div class="leader-experience-pair">'+cards+'</div></section>';
 };
 const experience=splitExperience?
  '<div class="leader-experience-sections">'+
  experienceBlock(group.filter(s=>s.division==='Elementary'),'elementary',
   'Elementary','Grades 3–5 · age-appropriate questions')+
  experienceBlock(group.filter(s=>s.division==='Secondary'),'secondary',
   'Secondary','Grades 6–12 · age-appropriate questions')+'</div>':
  experienceBlock(group,'leader','','');
 const checkConfig=[
  {mode:'ixl',name:'IXL Mathematics',grades:'Grades 1–10',description:'Diagnostic level, not a SmartScore or percentage'},
  {mode:'core',name:'Core Phonics',grades:'K–Grade 5',description:'Illustrative 50-item decoding check'},
  {mode:'fp',name:'F&P reading',grades:'K–Grade 5',description:'Text complexity level, not a grade or percentage'}
 ];
 const quickChecks=checkConfig.map(check=>({
  label:check.name,coverage:leaderAcademicCoverage(group,ACADEMIC_RECORDS,check.mode)
 })).filter(check=>check.coverage.eligible>0);
 const quickEvidence=quickChecks.length?
  '<div class="leader-evidence-strip" role="group" aria-label="Additional academic assessment availability">'+
   '<div class="leader-evidence-intro"><strong>Other learning checks</strong>'+
   '<span>Records available / eligible · demo</span></div>'+
   '<div class="leader-evidence-items">'+quickChecks.map(check=>
    '<span class="leader-evidence-item"><b>'+safe(check.label)+'</b>'+
    '<span>'+check.coverage.available+' / '+check.coverage.eligible+'</span></span>'
   ).join('')+'</div></div>':'';
 const academicChecks=checkConfig.map(check=>{
  const snapshot=leaderCheckSnapshot(group,ACADEMIC_RECORDS,check.mode);
  const coverage=snapshot.eligible?
   snapshot.available+' of '+snapshot.eligible+' eligible learners have a check-in':
   'Not used in this selected grade range';
  const typical=snapshot.typical?
   '<span class="leader-check-typical">'+safe(snapshot.typical)+' · Fall 2026 ('+
    snapshot.recent+' results)</span>':'';
  return '<div class="leader-check-row"><div><strong>'+safe(check.name)+'</strong>'+
   '<span>'+safe(check.grades)+' · '+safe(check.description)+'</span></div>'+
   '<div class="leader-check-evidence"><b>'+safe(coverage)+'</b>'+typical+'</div></div>';
 }).join('');
 const reportMix=leaderReportBreakdown(group,ACADEMIC_RECORDS);
 const reportDetail=reportMix===null?
  '<p class="leader-inline-note">Select one grade or class above to see issued report outcomes. '+
  'Developmental descriptors and 1–7 grades are never combined into a schoolwide average.</p>':
  !reportMix.rows.length?
  '<p class="leader-inline-note">No issued reports are available yet for this fictional grade group.</p>':
  '<p class="leader-report-context">Latest issued '+safe(reportMix.year)+' · '+
   safe(reportMix.issuedGrade)+' · '+safe(reportMix.framework)+' · '+
   reportMix.included+' reports on the same scale'+
   (reportMix.excluded?' ('+reportMix.excluded+' others have a different report context)':'')+'</p>'+
  '<div class="leader-report-subjects">'+reportMix.rows.map(row=>
   '<div class="leader-report-subject"><strong>'+safe(row.subject)+'</strong>'+
   '<div class="leader-report-values">'+row.values.filter(item=>item.count>0).map(item=>
    '<span>'+safe(item.value)+' <b>'+item.count+'</b></span>').join('')+
   '</div></div>').join('')+'</div>'+
  '<p class="leader-inline-note">Counts describe the last issued report, not current 2026–27 grades. '+
  'Outcomes are only comparable within the same year, grade and programme.</p>';
 const detailTable='<div class="tablewrap leader-pattern-table"><table><thead><tr>'+
  '<th scope="col">Group</th><th scope="col">Learners</th>'+
  '<th scope="col">Responses (G3+)</th>'+
  '<th scope="col">Engagement index</th><th scope="col">Belonging index</th>'+
  '</tr></thead><tbody>'+rows.map(([name,ss])=>{
   const e=summarizeExperience(RECORDS,ss,'engagement',state.window);
   const b=summarizeExperience(RECORDS,ss,'belonging',state.window);
   return '<tr><th scope="row">'+safe(name)+'</th><td>'+ss.length+
    '</td><td>'+(e.eligible?e.n+' / '+e.eligible:'Not collected')+
    '</td><td tabindex="0" data-evidence-preview="leader-index" data-preview-measure="engagement" data-preview-group="'+safe(name)+'">'+fmt(e.value)+'</td>'+
   '<td tabindex="0" data-evidence-preview="leader-index" data-preview-measure="belonging" data-preview-group="'+safe(name)+'">'+fmt(b.value)+'</td></tr>';
  }).join('')+'</tbody></table></div>';
 const trendFor=(ss,title)=>'<div class="leader-trend-group"><h4>'+safe(title)+'</h4>'+
  '<div class="leader-trend-grid">'+EXPERIENCE_WINDOWS.map(w=>{
   const e=summarizeExperience(RECORDS,ss,'engagement',w.key);
   const b=summarizeExperience(RECORDS,ss,'belonging',w.key);
   return '<div class="leader-trend-period"><strong>'+safe(w.label)+'</strong>'+
    '<span>Engagement <b>'+fmt(e.value)+'</b></span>'+
    '<span>Belonging <b>'+fmt(b.value)+'</b></span>'+
    '<small>'+e.n+' of '+e.eligible+' responses</small></div>';
  }).join('')+'</div></div>';
 const trends=splitExperience?
  trendFor(group.filter(s=>s.division==='Elementary'),'Elementary')+
  trendFor(group.filter(s=>s.division==='Secondary'),'Secondary'):
  trendFor(group,'Selected group');
 return heading('Leadership Overview','Growth, learning evidence and student experience. Choose a division, grade or class.')+
  '<div class="leader-view">'+
  '<div class="toolbar leader-controls"><label>Division '+
  selector('division',[['All','Whole school'],['Elementary','Elementary'],['Secondary','Secondary']],state.division)+
  '</label><label>Grade '+selector('grade',[['All','All grades'],...grades.filter(g=>
   divisions.includes(gradeNumber(g)<=5?'Elementary':'Secondary')).map(g=>[g,g==='K'?'Kindergarten':g])],state.grade)+
  '</label><label>Class '+selector('leader-class',[['','All classes'],...classes.map(c=>[c.id,c.name])],state.classId)+
  '</label></div>'+
  '<section class="leader-section" aria-labelledby="leader-learning-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">LEARNING SNAPSHOT</div>'+
  '<h2 id="leader-learning-title">At a Glance</h2></div>'+
  '<span class="leader-period">'+safe(scopeLabel)+' · Fictional data · Fall 2026</span></div>'+
  '<div class="leader-learning-grid">'+
  stat('Learners',String(group.length),'Students included in this selection','Demo cohort')+
  growthTile('MAP Mathematics growth',math)+
  growthTile('MAP Reading growth',reading)+
  stat('Report card coverage',reports.rate===null?'—':reports.rate+'%',
   reports.available+' of '+reports.eligible+' learners have a previously issued report.',
   'Previous school years')+'</div>'+quickEvidence+
  '<p class="leader-data-note">MAP growth compares learners with valid, comparable tests to '+
  'illustrative projected growth. It is not an achievement percentile or an official NWEA projection. '+
  'MAP is shown for Grades 3–10 only.</p></section>'+
  '<section class="leader-section" aria-labelledby="leader-experience-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">STUDENT VOICE</div>'+
  '<h2 id="leader-experience-title">Student Experience</h2>'+
  '<p>Engagement and belonging · '+safe(selectedWindow)+' · response counts included.</p></div>'+
  '<label class="leader-window-select">Check-in period '+
  selector('window',EXPERIENCE_WINDOWS.map(w=>[w.key,w.label]),state.window)+
  '</label></div>'+experience+
  (splitExperience?'<p class="leader-data-note">Elementary and Secondary students answer different questions; their indices are intentionally shown separately.</p>':'')+
  '</section>'+
  renderLeaderSupportSection({students:group,sssRecords:SSS_RECORDS,entries:supportEntries(),open:state.leaderSupportOpen})+
  '<details class="leader-detail" data-leader-panel="academics"'+
  (state.leaderAcademicOpen?' open':'')+'>'+
  '<summary><span><strong>Explore academic evidence</strong>'+
  '<small>Historical subject reports and assessment details</small></span>'+
  '<span class="leader-detail-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="leader-detail-body"><h3>Assessment Coverage</h3>'+
  '<p class="leader-inline-note">Each measure has its own scale and grade range. '+
  'Only eligible learners are counted.</p>'+
  '<div class="leader-check-list">'+academicChecks+'</div>'+
  '<h3>Most Recent Issued Report Outcomes</h3>'+reportDetail+'</div></details>'+
  '<details class="leader-detail" data-leader-panel="patterns"'+
  (state.leaderPatternsOpen?' open':'')+'>'+
  '<summary><span><strong>Explore experience patterns</strong>'+
  '<small>Grade or class comparisons and three check-in windows</small></span>'+
  '<span class="leader-detail-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="leader-detail-body"><h3>Patterns by '+
  (state.classId?'selected class':state.grade==='All'?'grade':'class')+'</h3>'+
  detailTable+
  '<p class="leader-inline-note">Indices are out of 100, based on fictional student check-ins. '+
  'They do not rank learners or indicate academic achievement.</p>'+
  '<h3>Over Time</h3>'+trends+'</div></details></div>'+info();
}
function sss(){
 const banner=heading('Student Support Services',
  'Coordinated interventions, timely reviews and learner-centred decisions. All records are fictional.');
 if(state.sssStudentId){
  const student=DATA.userIndex.get(state.sssStudentId),record=SSS_RECORDS.get(state.sssStudentId);
  const entries=supportEntries();
  return banner+renderSSSStudentProfile({
   data:DATA,academicRecords:ACADEMIC_RECORDS,experienceRecords:RECORDS,
   sssRecords:SSS_RECORDS,studentId:state.sssStudentId,
   reportYear:state.academicReportYear,academicOpen:state.sssAcademicOpen,
   panel:state.sssPanel,tabNavigation:renderSSSProfileNavigation(state.sssPanel),
   summaryWorkspace:renderSSSSummary(student,record,entries),
   plansWorkspace:renderSSSPlans(student,record,entries,state.supportBarrier),
   supportWorkspace:renderSSSWorkspace(student,entries,record,state.supportFilter,state.supportQuery)
  })+info();
 }
 const cohort=DATA.students.filter(x=>SSS_RECORDS.has(x.id));
 return banner+renderSSSLeadershipDashboard(cohort,SSS_RECORDS,supportEntries(),state.sssManager)+renderSSSOverview({
  data:DATA,academicRecords:ACADEMIC_RECORDS,sssRecords:SSS_RECORDS,
  grade:state.sssGrade,query:state.sssQuery,openGrades:state.sssOpenGrades,caseManager:state.sssManager
 })+info();
}

function student(){
 const grades=GRADES;
 const current=grades.includes(state.studentGrade)?state.studentGrade:'G7';
 const ss=DATA.students.filter(s=>s.grade===current);
 const chosen=ss.find(s=>s.id===state.studentId)||ss[0];
 if(chosen&&!ss.some(x=>x.id===state.studentId))state.studentId=chosen.id;
 return heading('My Learning, My Story.','Explore my school reports, skills and wellbeing in one place.')+
 '<div class="toolbar academic-student-picker"><label>Demo grade '+selector('student-grade',
 grades.map(g=>[g,g==='K'?'Kindergarten':g]),current)+'</label>'+
 '<label>Student demo '+selector('student',ss.map(s=>[s.id,s.name]),state.studentId)+'</label></div>'+
 learnerProfile(chosen,true)+info();
}

let experienceDialog=null,experienceReturnFocus=null;
function experienceScope(trigger,action=''){
 const parts=action.startsWith('explain:')?action.split(':'):[];
 const metric=trigger.dataset.experienceExplain||parts.at(-1);
 if(!METRIC_IDS.includes(metric))return null;
 const scope=trigger.dataset.experienceScope||parts[1]||state.role;
 const preferred=trigger.dataset.experienceWindow||
  (scope==='faculty'||scope==='sss'?'F26':state.window);
 const windowKey=EXPERIENCE_WINDOWS.some(w=>w.key===preferred)?preferred:'F26';
 const windowLabel=EXPERIENCE_WINDOWS.find(w=>w.key===windowKey).label;
 let students=[],person=null,scopeLabel='';
 const studentId=trigger.dataset.experienceStudent||
  (scope==='profile'||scope==='student'?state.studentId:
   scope==='sss'?state.sssStudentId:'');
 if(studentId){
  const found=DATA.userIndex.get(studentId);
  const permitted=found&&(state.role==='faculty'&&ownStudents().some(s=>s.id===studentId)||
    state.role==='student'&&state.studentId===studentId||
    state.role==='sss'&&SSS_RECORDS.has(studentId));
  if(!permitted)return null;
  person=found;students=[found];scopeLabel=found.name+' · '+found.grade;
 }else if(state.role==='faculty'){
  students=(activeClass()?.studentIds||[]).map(id=>DATA.userIndex.get(id)).filter(Boolean);
  scopeLabel=activeClass()?.name||'Selected class';
 }else if(state.role==='leader'){
  const divisions=state.division==='All'?['Elementary','Secondary']:[state.division];
  students=DATA.students.filter(s=>divisions.includes(s.division)&&
   (state.grade==='All'||s.grade===state.grade)&&
   (!state.classId||s.classId===state.classId));
  if(scope==='elementary')students=students.filter(s=>s.division==='Elementary');
  if(scope==='secondary')students=students.filter(s=>s.division==='Secondary');
  const namedGroup=trigger.dataset.experienceGroup;
  if(namedGroup){
   const gradeMatches=students.filter(s=>s.grade===namedGroup);
   const classMatch=DATA.classes.find(c=>c.name===namedGroup);
   students=gradeMatches.length?gradeMatches:
    classMatch?students.filter(s=>s.classId===classMatch.id):[];
   scopeLabel=namedGroup;
  }else scopeLabel=scope==='elementary'?'Elementary':scope==='secondary'?'Secondary':
   state.classId?DATA.classes.find(c=>c.id===state.classId)?.name||'Selected class':
   state.grade!=='All'?state.grade:state.division==='All'?'Whole school':state.division;
 }else return null;
 // Elementary and Secondary wording differs. Never blend different question sets.
 if(students.some(s=>s.division==='Elementary')&&
    students.some(s=>s.division==='Secondary')&&!person)return null;
 const entry=person?experienceFor(RECORDS,person.id,metric,windowKey):null;
 const summary=person?{value:entry?.value??null,n:entry?1:0,eligible:1}:
  summarizeExperience(RECORDS,students,metric,windowKey);
 const questions=person?entry?.items||[]:
  experienceQuestionSummary(RECORDS,students,metric,windowKey);
 return {metric,scopeLabel,windowLabel,summary,questions,individual:!!person};
}
function openExperienceExplanation(trigger,action=''){
 const context=experienceScope(trigger,action);
 if(!context)return;
 const previousDialog=experienceDialog;
 if(previousDialog){previousDialog.close();previousDialog.remove()}
 experienceReturnFocus=trigger;
 const dialog=document.createElement('dialog');
 dialog.className='experience-dialog';
 dialog.setAttribute('aria-labelledby','experience-dialog-title');
 dialog.setAttribute('aria-describedby','experience-dialog-desc');
 dialog.innerHTML=experienceDialogContent(context);
 dialog.addEventListener('click',event=>{
  if(event.target===dialog||event.target.closest('[data-experience-close]'))dialog.close();
 });
 dialog.addEventListener('close',()=>{
  dialog.remove();if(experienceDialog===dialog)experienceDialog=null;
  if(experienceReturnFocus?.isConnected)experienceReturnFocus.focus({preventScroll:true});
 });
 document.body.appendChild(dialog);
 experienceDialog=dialog;
 dialog.showModal();
 dialog.querySelector('.experience-modal-close')?.focus({preventScroll:true});
}
let pinnedChartKey=null;
function render(){
 pinnedChartKey=null;
 const content=state.role==='board'?renderBoard(state):state.role==='leader'?leader():
  state.role==='sss'?sss():state.role==='student'?student():faculty();
 document.body.classList.toggle('board-drawer-open',state.role==='board'&&state.boardView==='explore'&&!!state.boardMapDetailsOpen);
 if(root.dataset)root.dataset.workspace=state.role;
 root.innerHTML=header()+'<main class="container" id="main" tabindex="-1">'+content+'</main><footer>'+
 (state.role==='board'?'AISG Board · Aggregated MAP and IB Diploma outcomes · No individual student scores published':
 'My Learners demonstration · Learners, assessments and student check-ins fictional')+
 '</footer>'+(state.supportForm?renderSupportForm(state.supportForm,DATA.userIndex.get(state.supportForm.studentId),SUPPORT_DRAFTS):'');
 if(state.role==='board'&&state.boardView==='explore'&&state.boardMapDetailsOpen){
  root.querySelector('.board-drawer-close')?.focus({preventScroll:true});
 }
 if(state.role==='board'&&globalThis.window?.innerWidth<700){
  const useDp=(state.boardView==='dp')||(state.boardView==='overview'&&state.boardOverviewChart==='dp');
  const scroller=root.querySelector?.(useDp?'.board-dp-chart-scroll':'.board-trend-scroller');
  if(scroller)scroller.scrollLeft=scroller.scrollWidth;
 }
 previewController?.dismiss();
 decorateEvidencePreviews(root,state.role);
 try{sessionStorage.setItem('my-role',state.role);sessionStorage.setItem('my-teacher',state.teacher);
 sessionStorage.setItem('my-board-window-v2',state.boardWindow);sessionStorage.setItem('my-board-subject',state.boardSubject);
 sessionStorage.setItem('my-board-division',state.boardDivision);sessionStorage.setItem('my-board-grade',state.boardGrade)}catch{}
}
function showBoardPoint(point){
 const key=point?.dataset?.boardPoint;
 const inspector=root.querySelector('.board-trend-inspector');
 if(!inspector||!key||pinnedChartKey&&pinnedChartKey!==key)return;
 if(inspector.dataset.activePoint!==key){
  inspector.innerHTML=renderTrendPointDetails(key);
  inspector.dataset.activePoint=key;
  root.querySelectorAll('.board-trend-point.is-active').forEach(x=>x.classList.remove('is-active'));
  point.classList.add('is-active');
 }
}
function showDPPoint(point){
 const key=point?.dataset?.boardDpPoint,inspector=root.querySelector('.board-dp-inspector');
 if(!inspector||!key||pinnedChartKey&&pinnedChartKey!==key)return;
 if(inspector.dataset.activePoint!==key){
  inspector.innerHTML=renderDPPointDetails(key,state.boardDpWorldBasis);
  inspector.dataset.activePoint=key;
  root.querySelectorAll('.board-dp-point.is-active').forEach(x=>x.classList.remove('is-active'));
  point.classList.add('is-active');
 }
}
function pinChartPoint(point){
 const dp=!!point?.dataset?.boardDpPoint;
 const key=dp?point?.dataset?.boardDpPoint:point?.dataset?.boardPoint;
 const inspector=root.querySelector(dp?'.board-dp-inspector':'.board-trend-inspector');
 if(!key||!inspector)return;
 if(pinnedChartKey===key){
  pinnedChartKey=null;
  inspector.classList.remove('is-pinned');
  inspector.querySelector('.board-pin-controls')?.remove();
  root.querySelectorAll('.board-trend-point.is-pinned,.board-dp-point.is-pinned').forEach(n=>n.classList.remove('is-pinned'));
  return;
 }
 pinnedChartKey=null;
 if(dp)showDPPoint(point);else showBoardPoint(point);
 pinnedChartKey=key;
 inspector.classList.add('is-pinned');
 root.querySelectorAll('.board-trend-point.is-pinned,.board-dp-point.is-pinned').forEach(n=>n.classList.remove('is-pinned'));
 point.classList.add('is-pinned');
 inspector.insertAdjacentHTML('beforeend',
 '<div class="board-pin-controls"><span>Selection pinned for closer inspection</span>'+
 '<button type="button" data-board-unpin>Unpin ×</button></div>');
}
function unpinChartPoint(){
 pinnedChartKey=null;
 root.querySelectorAll('.board-trend-inspector.is-pinned,.board-dp-inspector.is-pinned')
  .forEach(n=>{n.classList.remove('is-pinned');n.querySelector('.board-pin-controls')?.remove()});
 root.querySelectorAll('.board-trend-point.is-pinned,.board-dp-point.is-pinned')
  .forEach(n=>n.classList.remove('is-pinned'));
}
function closeBoardDrawer(){
 if(state.role!=='board'||state.boardView!=='explore'||!state.boardMapDetailsOpen)return;
 const window=state.boardWindow,subject=state.boardSubject;
 state.boardMapDetailsOpen=false;state.boardGrade='all';
 render();
 root.querySelector('[data-board-tile-window="'+window+'"][data-board-tile-subject="'+subject+'"]')
  ?.focus({preventScroll:true});
}
function placeBoardFloat(point,e){
 const tooltip=root.querySelector('.board-floating-tooltip');
 if(!tooltip||!point)return;
 const subject=point.dataset.boardDpSubjectPoint;
 const dp=!!point.dataset.boardDpPoint||!!point.dataset.boardDpWorldPoint;
 const key=subject||point.dataset.boardDpPoint||point.dataset.boardDpWorldPoint||point.dataset.boardPoint;
 if(!key)return;
 const tooltipKey=(subject?'subject:':dp?'dp:':'map:')+key;
 if(tooltip.dataset.activePoint!==tooltipKey){
  tooltip.innerHTML=subject?renderDPSubjectPointDetails(key):dp?renderDPPointDetails(key,state.boardDpWorldBasis):renderTrendPointDetails(key);
  tooltip.dataset.activePoint=tooltipKey;
 }
 tooltip.hidden=false;
 const rect=point.getBoundingClientRect();
 const x=Number.isFinite(e?.clientX)&&e.clientX>0?e.clientX:rect.left+rect.width/2;
 const y=Number.isFinite(e?.clientY)&&e.clientY>0?e.clientY:rect.top;
 const width=tooltip.offsetWidth||370,height=tooltip.offsetHeight||230;
 const maxX=Math.max(10,window.innerWidth-width-14);
 const maxY=Math.max(10,window.innerHeight-height-14);
 const left=Math.min(maxX,Math.max(10,x+19));
 const desiredTop=y+18+height>window.innerHeight?y-height-18:y+18;
 tooltip.style.left=left+'px';
 tooltip.style.top=Math.min(maxY,Math.max(10,desiredTop))+'px';
}
function hideBoardFloat(){
 const tooltip=root.querySelector('.board-floating-tooltip');
 if(tooltip){tooltip.hidden=true;tooltip.dataset.activePoint=''}
}
root.addEventListener('pointerover',e=>{
 if(state.role!=='board')return;
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point],[data-board-dp-world-point],[data-board-dp-subject-point]');
 if(!point)return;
 if(e.pointerType==='mouse'||e.pointerType==='pen'){placeBoardFloat(point,e);return}
 // Touch users select a point; keyboard users retain the inline inspector.

});
root.addEventListener('pointermove',e=>{
 if(state.role!=='board'||(e.pointerType!=='mouse'&&e.pointerType!=='pen'))return;
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point],[data-board-dp-world-point],[data-board-dp-subject-point]');
 if(point)placeBoardFloat(point,e);
});
root.addEventListener('pointerout',e=>{
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point],[data-board-dp-world-point],[data-board-dp-subject-point]');
 if(point&&!point.contains(e.relatedTarget))hideBoardFloat();
});
root.addEventListener('focusin',e=>{
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point],[data-board-dp-world-point],[data-board-dp-subject-point]');
 if(point&&state.role==='board'){
  if(point.dataset.boardPoint&&state.boardView==='overview')showBoardPoint(point);
  if(point.dataset.boardDpPoint&&(state.boardView==='dp'||(state.boardView==='overview'&&state.boardOverviewChart==='dp')))showDPPoint(point);
  placeBoardFloat(point);
 }
});
root.addEventListener('focusout',e=>{
 if(e.target.closest?.('[data-board-point],[data-board-dp-point],[data-board-dp-world-point],[data-board-dp-subject-point]'))hideBoardFloat();
});
root.addEventListener('keydown',e=>{
 const drawer=root.querySelector('.board-map-drawer[aria-modal="true"]');
 if(drawer){
  if(e.key==='Escape'){e.preventDefault();closeBoardDrawer();return}
  if(e.key==='Tab'){
   const focusables=[...drawer.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],summary')]
    .filter(el=>el.getClientRects().length);
   if(focusables.length){
    const first=focusables[0],last=focusables.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();return}
    if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();return}
   }
  }
  return;
 }
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point],[data-board-dp-world-point],[data-board-dp-subject-point]');
 if(point&&(e.key==='Enter'||e.key===' ')){
  e.preventDefault();
  if(point.dataset.boardDpSubjectPoint||point.dataset.boardDpWorldPoint){placeBoardFloat(point);return}
  if(point.dataset.boardDpPoint){point.click();return}
  pinChartPoint(point);placeBoardFloat(point);
 }
 if(e.key==='Escape'){hideBoardFloat();if(pinnedChartKey)unpinChartPoint()}
});
root.addEventListener('click',e=>{
 const skip=e.target.closest('[data-skip-main]');
 if(skip){
  const main=root.querySelector('#main');
  main?.focus({preventScroll:true});
  main?.scrollIntoView?.({block:'start'});
  return;
 }
 if(e.target.closest('[data-support-cancel]')||e.target.matches?.('[data-support-overlay]')){state.supportForm=null;render();return}
 const sn=e.target.closest('[data-support-new]');
 if(sn&&['faculty','sss'].includes(state.role)){
  const id=sn.dataset.supportNew;
  if(!DATA.userIndex.has(id)||(state.role==='faculty'&&!ownStudents().some(s=>s.id===id))||
     (state.role==='sss'&&!SSS_RECORDS.has(id)))return;
  state.supportForm={studentId:id,type:state.role==='faculty'?'note':sn.dataset.supportType,role:state.role};
  render();root.querySelector('.support-dialog input[name="title"]')?.focus();return;
 }
 const se=e.target.closest('[data-support-edit]');
 if(se&&state.role==='sss'){
  const item=SUPPORT_DRAFTS.find(x=>x.id===se.dataset.supportEdit&&x.studentId===state.sssStudentId);
  if(item){state.supportForm={studentId:item.studentId,type:item.type,id:item.id,role:'sss'};render()}return;
 }
 const sd=e.target.closest('[data-support-delete]');
 if(sd&&state.role==='sss'){
  SUPPORT_DRAFTS=SUPPORT_DRAFTS.filter(x=>x.id!==sd.dataset.supportDelete);
  storeDraftEntries(SUPPORT_DRAFTS);render();return;
 }
 const st=e.target.closest('[data-support-toggle]');
 if(st&&state.role==='sss'){
  const item=supportEntries().find(x=>x.id===st.dataset.supportToggle&&x.studentId===state.sssStudentId&&x.type==='action');
  if(item){SUPPORT_DRAFTS=[...SUPPORT_DRAFTS.filter(x=>x.id!==item.id),{...item,status:item.status==='Completed'?'Open':'Completed',source:'session'}];storeDraftEntries(SUPPORT_DRAFTS);render()}return;
 }
 const sssNavigation=e.target.closest('[data-sss-panel]');
 if(sssNavigation&&state.role==='sss'&&state.sssStudentId){
  const next=sssNavigation.dataset.sssPanel;
  if(['summary','plans','history','evidence'].includes(next)){
   state.sssPanel=next;render();
   root.querySelector('[data-sss-panel="'+next+'"]')?.focus?.({preventScroll:true});
  }
  return;
 }
 const leadOpen=e.target.closest('[data-sss-open]');
 if(leadOpen&&state.role==='sss'){
  const id=leadOpen.dataset.sssOpen;
  if(!SSS_RECORDS.has(id))return;
  state.sssStudentId=id;state.sssPanel=leadOpen.dataset.sssOpenPanel||'summary';
  state.supportQuery='';state.supportFilter='all';render();
  globalThis.window?.scrollTo?.(0,0);return;
 }
 const referralNext=e.target.closest('[data-support-referral-next]');
 if(referralNext&&state.role==='sss'&&state.sssStudentId){
  const item=supportEntries().find(x=>x.id===referralNext.dataset.supportReferralNext&&
   x.type==='referral'&&x.studentId===state.sssStudentId);
  if(!item)return;
  const index=REFERRAL_STAGES.indexOf(lastReferralStage(item));
  if(index<0||index>=REFERRAL_STAGES.length-1)return;
  const next=REFERRAL_STAGES[index+1];
  SUPPORT_DRAFTS=[...SUPPORT_DRAFTS.filter(x=>x.id!==item.id),
   {...item,source:'session',status:next,referralStage:next}];
  storeDraftEntries(SUPPORT_DRAFTS);render();return;
 }
 const strategyAdd=e.target.closest('[data-support-use-strategy]');
 if(strategyAdd&&state.role==='sss'&&state.sssStudentId){
  const strategy=STRATEGIES.find(x=>x.id===strategyAdd.dataset.supportUseStrategy);
  if(!strategy||strategyAdd.dataset.supportStrategyStudent!==state.sssStudentId)return;
  const entry=createDraftEntry({
   type:'note',date:'2026-10-28',title:'Classroom strategy · '+strategy.title,
   summary:strategy.how,category:'Strategy Review',nextStep:strategy.check,
   visibility:'shared'
  },state.sssStudentId,'sss');
  SUPPORT_DRAFTS=[...SUPPORT_DRAFTS,entry];storeDraftEntries(SUPPORT_DRAFTS);render();return;
 }
 const printBrief=e.target.closest('[data-support-print]');
 if(printBrief&&state.role==='sss'){globalThis.window?.print?.();return}
 const sssStudent=e.target.closest('[data-sss-student]');
 if(sssStudent&&state.role==='sss'){
  const id=sssStudent.dataset.sssStudent;
  if(!SSS_RECORDS.has(id))return;
  state.sssStudentId=id;state.sssAcademicOpen=false;state.sssPanel='summary';
  state.academicReportYear='';render();
  globalThis.window?.scrollTo?.(0,0);
  return;
 }
 const sssBack=e.target.closest('[data-sss-back]');
 if(sssBack&&state.role==='sss'){
  state.sssStudentId='';state.sssAcademicOpen=false;
  state.academicReportYear='';render();
  globalThis.window?.scrollTo?.(0,0);
  return;
 }
 const rosterToggle=e.target.closest('[data-roster-view]');
 if(rosterToggle&&state.role==='faculty'){
  state.rosterView=rosterToggle.dataset.rosterView===FOCUSED_VIEW?FOCUSED_VIEW:EVERYDAY_VIEW;
  render();root.querySelector('[data-roster-view="'+state.rosterView+'"]')?.focus({preventScroll:true});
  return;
 }
 const evidenceTab=e.target.closest('[data-class-evidence]');
 if(evidenceTab&&state.role==='faculty'){
  const next=evidenceTab.dataset.classEvidence;
  if(!evidenceModesForGrade(activeClass()?.grade||'').includes(next))return;
  state.classEvidence=next;
  state.rosterView=FOCUSED_VIEW;
  state.classCompare=normalizeComparison(activeClass()?.grade||'',next,state.classCompare);
  rememberFaculty();render();
  root.querySelector('[data-class-evidence="'+next+'"]')?.focus({preventScroll:true});
  return;
 }
 const academicMode=e.target.closest('[data-academic-mode]');
 if(academicMode){
  const options=academicModesFor(activeClass()?.grade||'');
  if(state.role==='faculty'&&options.includes(academicMode.dataset.academicMode)){
   state.academicMode=academicMode.dataset.academicMode;
   rememberFaculty();
   render();
   root.querySelector('[data-academic-mode="'+state.academicMode+'"]')?.focus({preventScroll:true});
  }
  return;
 }
 const reportYear=e.target.closest('[data-academic-report-year]');
 if(reportYear&&['faculty','student','sss'].includes(state.role)){
  state.academicReportYear=reportYear.dataset.academicReportYear;
  render();
  root.querySelector('[data-academic-report-year="'+state.academicReportYear+'"]')?.focus({preventScroll:true});
  return;
 }
 const clearSearch=e.target.closest('[data-clear-search]');
 if(clearSearch&&state.role==='faculty'){
  state.query='';state.details=false;render();
  root.querySelector('[data-query]')?.focus({preventScroll:true});return;
 }
 const role=e.target.closest('[data-role]');if(role){if(!ROLE_IDS.includes(role.dataset.role))return;
 if(role.dataset.role==='board')state.boardView='overview';
 if(role.dataset.role==='student'&&state.studentId)state.studentGrade=DATA.userIndex.get(state.studentId)?.grade||'G7';
 state.role=role.dataset.role;state.details=false;state.studentId='';state.classId='';state.query='';state.academicReportYear='';
 if(state.role==='faculty')recallFaculty();
 if(state.role==='student'){state.studentReportsOpen=false;state.studentWellbeingOpen=false}
 if(state.role==='sss'){state.sssStudentId='';state.sssAcademicOpen=false;state.sssPanel='summary'}
 if(globalThis.location?.hash!=='#/'+state.role)globalThis.location.hash='#/'+state.role;
 render();
 root.querySelector('[data-role="'+state.role+'"]')?.focus({preventScroll:true});
 globalThis.window?.scrollTo?.(0,0);
 return}
 const point=e.target.closest('[data-board-point]');
 if(point){pinChartPoint(point);
  if(e.detail>0&&window.matchMedia?.('(pointer: coarse)').matches)
   root.querySelector('.board-trend-inspector')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  return;
 }
 const standalonePoint=e.target.closest('[data-board-dp-subject-point],[data-board-dp-world-point]');
 if(standalonePoint&&state.role==='board'){
  placeBoardFloat(standalonePoint,e);
  return;
 }
 const dpPoint=e.target.closest('[data-board-dp-point]');
 if(dpPoint){
  const [metric,year]=String(dpPoint.dataset.boardDpPoint||'').split(':');
  if(state.boardView==='dp'&&DP_RECORDS.some(row=>row.end===Number(year))){
   state.boardDpYear=String(year);
   if(state.boardDpRange==='recent'&&!DP_RECORDS.slice(-3).some(row=>row.end===Number(year)))
    state.boardDpRange='all';
   render();
   const selected=root.querySelector('[data-board-dp-point="'+metric+':'+year+'"]');
   if(selected)pinChartPoint(selected);
  }else pinChartPoint(dpPoint);
  if(e.detail>0&&window.matchMedia?.('(pointer: coarse)').matches)
   root.querySelector('.board-dp-inspector')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  return;
 }
 const comparisonTile=e.target.closest('[data-board-tile-window][data-board-tile-subject]');
 if(comparisonTile){
  const windowId=comparisonTile.dataset.boardTileWindow,subject=comparisonTile.dataset.boardTileSubject;
  if(BOARD_DATA[windowId]&&['math','reading','language'].includes(subject)){
   if(state.boardWindow!==windowId||state.boardSubject!==subject)state.boardGrade='all';
   state.boardWindow=windowId;state.boardSubject=subject;
   state.boardMapDetailsOpen=true;state.boardMapGrowthOpen=false;
   render();
   root.querySelector('.board-drawer-close')?.focus({preventScroll:true});
  }
  return;
 }
 const closeDetails=e.target.closest('[data-board-close-details]');
 if(closeDetails){closeBoardDrawer();return}
 const unpin=e.target.closest('[data-board-unpin]');
 if(unpin){unpinChartPoint();return}
 const dismissGrowth=e.target.closest('[data-board-dismiss-growth]');
 if(dismissGrowth){state.boardMapGrowthOpen=false;render();return}
 const compare=e.target.closest('[data-board-compare-seasons]');
 if(compare){state.boardMapCompareSeasons=!state.boardMapCompareSeasons;render();return}
 const timeRange=e.target.closest('[data-board-trend-range]');
 if(timeRange){state.boardTrendRange=timeRange.dataset.boardTrendRange==='all'?'all':'recent';render();return}
 const boardView=e.target.closest('[data-board-view]');
 if(boardView){
  state.boardView=['overview','explore','dp'].includes(boardView.dataset.boardView)?
  boardView.dataset.boardView:'overview';
  render();globalThis.window?.scrollTo?.(0,0);return;
 }
 const dpGo=e.target.closest('[data-board-dp-go]');
 if(dpGo){
  state.boardView='dp';
  const target=String(dpGo.dataset.boardDpGo||'');
  if(target.startsWith('subject:')){
   state.boardDpSubject=target.slice(8);
   state.boardDpMetric='passRate';
  }else state.boardDpMetric=target==='passRate'?'passRate':'average';
  render();
  if(target.startsWith('subject:'))root.querySelector('#board-dp-subjects')?.scrollIntoView?.({block:'start',behavior:'smooth'});
  else globalThis.window?.scrollTo?.(0,0);
  return;
 }
 const boardChart=e.target.closest('[data-board-overview-chart]');
 if(boardChart){
  state.boardOverviewChart=boardChart.dataset.boardOverviewChart==='dp'?'dp':'map';
  render();return;
 }
 const boardGo=e.target.closest('[data-board-go]');
 if(boardGo){
  const [windowId,subject]=String(boardGo.dataset.boardGo).split(':');
  if(BOARD_DATA[windowId]&&['math','reading','language','growth'].includes(subject)){
   state.boardWindow=windowId;
   state.boardSubject=subject==='growth'?'math':subject;
   state.boardDivision='all';state.boardGrade='all';state.boardView='explore';
   state.boardMapGrowthOpen=subject==='growth';
   state.boardMapDetailsOpen=subject!=='growth';
   state.boardMapCompareSeasons=false;
   render();globalThis.window?.scrollTo?.(0,0);
  }
  return;
 }
 const scaleChoice=e.target.closest('[data-board-dp-scale]');
 if(scaleChoice&&state.role==='board'){
  state.boardDpScale=scaleChoice.dataset.boardDpScale==='full'?'full':'focus';
  render();
  root.querySelector('[data-board-dp-scale="'+state.boardDpScale+'"]')?.focus({preventScroll:true});
  return;
 }
 const basisToggle=e.target.closest('[data-board-dp-basis]');
 if(basisToggle&&state.role==='board'){
  state.boardDpWorldBasis=basisToggle.dataset.boardDpBasis==='overall'?'overall':'recipients';
  render();root.querySelector('[data-board-dp-basis="'+state.boardDpWorldBasis+'"]')?.focus({preventScroll:true});
  return;
 }
 const worldToggle=e.target.closest('[data-board-dp-global]');
 if(worldToggle&&state.role==='board'){state.boardDpGlobal=state.boardDpGlobal===false;render();return;}
 const boardJump=e.target.closest('[data-board-dp-jump]');
 if(boardJump&&state.role==='board'){
  const allowed=new Set(['board-dp-outcomes','board-dp-subjects','board-dp-history']);
  const id=boardJump.dataset.boardDpJump;
  if(allowed.has(id))root.querySelector('#'+id)?.scrollIntoView?.({behavior:'smooth',block:'start'});
  return;
 }
 const dpCourse=e.target.closest('[data-board-dp-subject]');
 if(dpCourse&&state.role==='board'){
  state.boardDpSubject=dpCourse.dataset.boardDpSubject;
  render();
  root.querySelector('[data-board-dp-subject="'+state.boardDpSubject+'"]')?.focus({preventScroll:true});
  return;
 }
 const dpMetric=e.target.closest('[data-board-dp-metric]');
 if(dpMetric){state.boardDpMetric=dpMetric.dataset.boardDpMetric==='passRate'?'passRate':'average';render();return;}
 const boardTerm=e.target.closest('[data-board-trend]');
 if(boardTerm){state.boardTrendTerm=boardTerm.dataset.boardTrend==='spring'?'spring':'fall';render();return}
 const boardFocus=e.target.closest('[data-board-focus]');
 if(boardFocus){
  state.boardTrendFocus=['all','math','reading','language'].includes(boardFocus.dataset.boardFocus)?
   boardFocus.dataset.boardFocus:'all';render();return
 }
 const boardSubject=e.target.closest('[data-board-subject]');
 if(boardSubject){state.boardSubject=boardSubject.dataset.boardSubject;render();return}
 const boardWindow=e.target.closest('[data-board-window]');
 if(boardWindow){state.boardWindow=boardWindow.dataset.boardWindow;render();return}
 const explain=e.target.closest('[data-experience-explain]');
 if(explain){openExperienceExplanation(explain);return}
 const b=e.target.closest('[data-action]');if(b){const a=b.dataset.action;if(a.startsWith('explain:')){openExperienceExplanation(b,a);return}else if(a==='close')state.details=false;else if(a==='back'){state.studentId='';state.details=false}else if(a==='save-reflection'){const t=document.querySelector('#reflection');try{sessionStorage.setItem('reflection-'+state.studentId,t?.value||'')}catch{}document.querySelector('#save-status').textContent='Draft saved in this browser session only.';return}render();return}
 const link=e.target.closest('[data-student]');if(link){state.studentId=link.dataset.student;state.details=false;state.academicReportYear='';render();window.scrollTo(0,0)}
});
root.addEventListener('change',e=>{
 const manager=e.target.closest('[data-sss-manager]');
 if(manager&&state.role==='sss'){
  state.sssManager=CASE_MANAGERS.includes(manager.value)?manager.value:'All';render();return;
 }
 const barrier=e.target.closest('[data-support-barrier]');
 if(barrier&&state.role==='sss'){
  state.supportBarrier=barrier.value;render();return;
 }
 const supportType=e.target.closest('[data-support-form-type]');
 if(supportType&&state.supportForm){state.supportForm.type=supportType.value;render();return}
 const supportFilter=e.target.closest('[data-support-filter]');
 if(supportFilter&&state.role==='sss'){state.supportFilter=supportFilter.value;render();return}
 const compareSelect=e.target.closest('[data-class-compare]');
 if(compareSelect&&state.role==='faculty'){
  const grade=activeClass()?.grade||'';
  state.classCompare=normalizeComparison(grade,
   normalizeEvidenceMode(grade,state.classEvidence),compareSelect.value);
  rememberFaculty();render();
  root.querySelector('[data-class-compare]')?.focus({preventScroll:true});
  return;
 }
 const classWindow=e.target.closest('[data-class-window]');
 if(classWindow&&state.role==='faculty'){
  if(EXPERIENCE_WINDOWS.some(w=>w.key===classWindow.value)){
   state.classExperienceWindow=classWindow.value;rememberFaculty();render();
   root.querySelector('[data-class-window]')?.focus({preventScroll:true});
  }
  return;
 }
 const maiaDimSelect=e.target.closest('[data-maia-dimension]');
 if(maiaDimSelect&&state.role==='faculty'){
  state.maiaDimension=maiaDimension(maiaDimSelect.value);
  rememberFaculty();render();
  root.querySelector('[data-maia-dimension]')?.focus({preventScroll:true});
  return;
 }
 const maiaWindowSelect=e.target.closest('[data-maia-window]');
 if(maiaWindowSelect&&state.role==='faculty'){
  state.maiaWindow=maiaPeriod(maiaWindowSelect.value);
  rememberFaculty();render();
  root.querySelector('[data-maia-window]')?.focus({preventScroll:true});
  return;
 }
 const mapSelect=e.target.closest('[data-map-subject]');
 if(mapSelect&&state.role==='faculty'){
  if(['Mathematics','Reading','Language Usage'].includes(mapSelect.value)){
   state.classMapSubject=mapSelect.value;render();
   root.querySelector('[data-map-subject]')?.focus({preventScroll:true});
  }
  return;
 }
 const subjectSelect=e.target.closest('[data-academic-subject]');
 if(subjectSelect&&state.role==='faculty'){
  state.academicSubject=subjectSelect.value;rememberFaculty();render();
  root.querySelector('[data-academic-subject]')?.focus({preventScroll:true});return;
 }
 const dpSelect=e.target.closest('[data-board-dp-select]');
 if(dpSelect){
  if(dpSelect.dataset.boardDpSelect==='year'){
   const valid=DP_RECORDS.some(r=>String(r.end)===dpSelect.value);
   if(valid){
    state.boardDpYear=dpSelect.value;
    if(state.boardDpRange==='recent'&&!DP_RECORDS.slice(-3).some(r=>String(r.end)===dpSelect.value))
     state.boardDpRange='all';
   }
  }
  if(dpSelect.dataset.boardDpSelect==='range'&&['all','recent'].includes(dpSelect.value)){
   state.boardDpRange=dpSelect.value;
   if(state.boardDpRange==='recent'&&!DP_RECORDS.slice(-3).some(r=>String(r.end)===String(state.boardDpYear)))
    state.boardDpYear=String(DP_RECORDS.at(-1).end);
  }
  render();return;
 }
 const boardSelect=e.target.closest('[data-board-select]');
 if(boardSelect){
  if(boardSelect.dataset.boardSelect==='division'){state.boardDivision=boardSelect.value;state.boardGrade='all'}
  if(boardSelect.dataset.boardSelect==='grade')state.boardGrade=boardSelect.value;
  if(boardSelect.dataset.boardSelect==='year'){
   const previousSeason=state.boardWindow.startsWith('spring')?'spring':'fall';
   state.boardWindow=boardWindowFor(boardSelect.value,previousSeason)||
    boardWindowFor(boardSelect.value,'fall')||state.boardWindow;
  }
  render();
  if(boardSelect.dataset.boardSelect==='grade')root.querySelector('[data-board-select="grade"]')?.focus({preventScroll:true});
  return;
 }
 const el=e.target.closest('[data-select]');if(!el)return;const v=el.value;
 if(el.dataset.select==='teacher'){
  state.teacher=v;recallFaculty();
  state.studentId='';state.query='';state.details=false;state.academicReportYear='';
  state.studentReportsOpen=false;state.studentWellbeingOpen=false;
 }
 if(el.dataset.select==='class'){
  state.classId=v;state.studentId='';state.query='';state.details=false;
  state.academicReportYear='';
  if(!academicModesFor(DATA.classIndex.get(v)?.grade).includes(state.academicMode))
   state.academicMode='report';
  state.classEvidence=normalizeEvidenceMode(DATA.classIndex.get(v)?.grade,state.classEvidence);
  state.classCompare=normalizeComparison(DATA.classIndex.get(v)?.grade,state.classEvidence,state.classCompare);
  rememberFaculty();
 }
 if(el.dataset.select==='division'){state.division=v;state.grade='All';state.classId='';state.details=false}
 if(el.dataset.select==='grade'){state.grade=v;state.classId='';state.details=false}
 if(el.dataset.select==='leader-class'){state.classId=v;state.details=false}
 if(el.dataset.select==='sss-grade'&&state.role==='sss'){
  state.sssGrade=v;state.sssStudentId='';
  if(v!=='All'&&!state.sssOpenGrades.includes(v))state.sssOpenGrades.push(v);
 }
 if(el.dataset.select==='student'){state.studentId=v;state.details=false;state.academicReportYear='';
  state.studentGrade=DATA.userIndex.get(v)?.grade||state.studentGrade;
  state.studentReportsOpen=false;state.studentWellbeingOpen=false;}
 if(el.dataset.select==='student-grade'){
  state.studentGrade=v;state.studentId=DATA.students.find(s=>s.grade===v)?.id||'';
  state.academicReportYear='';state.details=false;
  state.studentReportsOpen=false;state.studentWellbeingOpen=false;
 }
 if(el.dataset.select==='window'){state.window=v;state.details=false}
 render()
});
root.addEventListener('submit',e=>{
 if(e.target.matches?.('[data-support-review-form]')&&state.role==='sss'){
  e.preventDefault();
  const id=e.target.dataset.supportStudent;
  if(id!==state.sssStudentId||!SSS_RECORDS.has(id))return;
  const values=Object.fromEntries(new FormData(e.target).entries());
  if(!['Continue','Adapt','Intensify','Fade Support'].includes(values.decision)||
   !String(values.summary||'').trim())return;
  const entry=createDraftEntry({
   type:'review',date:'2026-10-28',title:'Collaborative Intervention Review',
   summary:values.summary,decision:values.decision,visibility:'restricted',
   reviewDate:SSS_RECORDS.get(id).reviewDate
  },id,'sss');
  SUPPORT_DRAFTS.push(entry);storeDraftEntries(SUPPORT_DRAFTS);render();return;
 }
 if(!e.target.matches?.('[data-support-form]'))return;
 e.preventDefault();const form=e.target,role=form.dataset.supportRole,id=form.dataset.supportStudent;
 if(!DATA.userIndex.has(id)||(role==='faculty'&&!ownStudents().some(s=>s.id===id))||(role==='sss'&&!SSS_RECORDS.has(id)))return;
 const values=Object.fromEntries(new FormData(form).entries());
 if(!String(values.title||'').trim()||!String(values.summary||'').trim())return;
 const next=createDraftEntry(values,id,role,state.supportForm?.id||'');
 if(!next)return;
 SUPPORT_DRAFTS=[...SUPPORT_DRAFTS.filter(x=>x.id!==next.id),next];
 storeDraftEntries(SUPPORT_DRAFTS);state.supportForm=null;render();
});
root.addEventListener('toggle',e=>{
 if(state.role==='sss'){
  const gradePanel=e.target.closest?.('details[data-sss-grade-panel]');
  if(gradePanel){
   const grade=gradePanel.dataset.sssGradePanel;
   if(gradePanel.open&&!state.sssOpenGrades.includes(grade))state.sssOpenGrades.push(grade);
   if(!gradePanel.open)state.sssOpenGrades=state.sssOpenGrades.filter(x=>x!==grade);
   return;
  }
  const academics=e.target.closest?.('details[data-sss-detail]');
  if(academics){
   if(academics.dataset.sssDetail==='academics')state.sssAcademicOpen=academics.open;
   return;
  }
 }
 const leaderPanel=e.target.closest?.('details[data-leader-panel]');
 if(leaderPanel&&state.role==='leader'){
  if(leaderPanel.dataset.leaderPanel==='academics')state.leaderAcademicOpen=leaderPanel.open;
   if(leaderPanel.dataset.leaderPanel==='support')state.leaderSupportOpen=leaderPanel.open;
  if(leaderPanel.dataset.leaderPanel==='patterns')state.leaderPatternsOpen=leaderPanel.open;
  return;
 }
 const panel=e.target.closest?.('details[data-student-panel]');
 if(!panel||state.role!=='student')return;
 if(panel.dataset.studentPanel==='reports')state.studentReportsOpen=panel.open;
 if(panel.dataset.studentPanel==='wellbeing')state.studentWellbeingOpen=panel.open;
},true);
root.addEventListener('input',e=>{
 if(e.target.matches('[data-support-query]')&&state.role==='sss'){
  const p=e.target.selectionStart;state.supportQuery=e.target.value;render();
  const field=root.querySelector('[data-support-query]');field?.focus({preventScroll:true});
  if(Number.isInteger(p))field?.setSelectionRange(p,p);return;
 }
 if(e.target.matches('[data-sss-query]')&&state.role==='sss'){
  const p=e.target.selectionStart;
  state.sssQuery=e.target.value;
  render();
  const field=root.querySelector('[data-sss-query]');
  field?.focus({preventScroll:true});
  if(Number.isInteger(p))field?.setSelectionRange(p,p);
  return;
 }
 if(e.target.matches('[data-query]')){const p=e.target.selectionStart;state.query=e.target.value;render();const input=document.querySelector('[data-query]');input?.focus();input?.setSelectionRange(p,p)}});
try{globalThis.window?.addEventListener?.('hashchange',()=>{
 const hash=String(globalThis.location?.hash||'');
 const id=hash.replace(/^#\//,'').split('?')[0];
 const boardLink=parseBoardHash(hash);
 if(boardLink){
  const changed=state.role!=='board'||Object.entries(boardLink).some(([key,value])=>state[key]!==value);
  if(changed){state.role='board';Object.assign(state,boardLink);render()}
 }else if(ROLE_IDS.includes(id)&&state.role!==id){
  // Route navigation and browser history must behave like selecting a dashboard.
  // Otherwise a previously opened Student profile can unexpectedly replace the
  // Faculty roster when arriving via a hash link or Back/Forward navigation.
  state.role=id;state.details=false;state.studentId='';state.classId='';
  state.query='';state.academicReportYear='';
  if(id==='faculty')recallFaculty();
  if(id==='student'){state.studentReportsOpen=false;state.studentWellbeingOpen=false}
  if(id==='sss'){state.sssStudentId='';state.sssAcademicOpen=false;state.sssPanel='summary'}
  render();globalThis.window?.scrollTo?.(0,0)
 }
})}catch{}
render();
