import {generateDemoData,attendanceSummary,gradeNumber,GRADES} from './data.mjs?v=20261111journeys1';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from './faculty-demo.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {STRAND_SUBJECTS} from './map-strand-explorer.mjs';
import {renderMapStrandExplorer,renderMapStrandProfile} from './map-strand-view.mjs';
import {renderStudentStrandJourney,renderCohortStrandJourney} from './map-strand-journeys-view.mjs';
import {renderFacultyStrandQuickCheck,facultyStrandQuickModel} from './faculty-strand-quickcheck.mjs';
import {MAP_RIT_SUBJECTS,mapRitCurrent,mapRitChange,mapRitChangeLabel,renderMapRitCell,renderMapRitHeader,renderMapRitLegend,renderMapRitProfile,installMapRitHeaderTooltips} from './map-rit-achievement.mjs?v=20261111schemas1';
import {leaderMapSummary,leaderAcademicCoverage,leaderCheckSnapshot,leaderReportBreakdown} from './leader-summary.mjs?v=20261111schemas1';
import {renderLeaderVoiceReview} from './leader-review-signals.mjs?v=20261111mapbands1';
import {universalScreenerFor,renderUniversalScreenerTile} from './universal-screener.mjs';
import {ufliLessonFor,renderUfliLessonTile} from './ufli-demo.mjs?v=20261113workflow1';
import {installSitewideColumnGuides} from './sitewide-column-guides.mjs';
import {polishPresentationMarkup,installPresentationCopy} from './sitewide-ui-copy.mjs';
import {renderFacultyMeasureContext} from './faculty-evidence-context.mjs';
import {renderLeaderUniversalScreener} from './universal-screener-leader.mjs';
import {renderLeaderAcademicActions,LEADER_ACADEMIC_FOCUS} from './leader-academic-actions.mjs?v=20261111journeys1';
import {renderMapJourneyCohort,renderMapJourneyProfile} from './map-journeys-view.mjs?v=20261111uxconsol1';
import {JOURNEY_FALL_WINDOWS,JOURNEY_START_BANDS,JOURNEY_END_BANDS} from './map-journeys-data.mjs?v=20261111uxconsol1';
import {LEADER_FOCUS_VALUES,LEADER_JOURNEY_PRESETS,leaderSectionForTarget,normalizeLeaderView,leaderSavedViewPayload,leaderApplySavedView} from './leader-view-preferences.mjs?v=20261111uxconsol1';
import {renderLeaderSupportSection} from './leader-support-view.mjs';
import {renderLeaderWholeSchool,renderLeaderDivisionDaily,renderLeaderLearnerEvidence,leaderAdvisoryClasses} from './leader-daily-workspaces.mjs?v=20261111uxconsol1';
import {leaderReportSignalSummary} from './report-card-signals.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {matchesSupportStatus,SUPPORT_STATUS_FILTERS} from './learner-support-status.mjs';
import {supportStatusBadges,supportStatusDetails,supportStatusFilterControl} from './learner-support-status-ui.mjs?v=20261112supporttips1';
import {renderLeaderSupportDirectory,leaderSupportDirectoryModel,LEADER_DIRECTORY_INITIAL} from './leader-support-directory.mjs?v=20261112leaderdir1';
import {installSupportTagTooltips} from './support-tag-tooltips.mjs?v=20261112supporttips1';
import {createSSSDemoRecords} from './sss-demo-data.mjs';
import {seedSupportDemo,loadDraftEntries,storeDraftEntries,createDraftEntry} from './support-workspace-data.mjs';
import {renderFacultySupportPanel,renderSSSWorkspace,renderSupportForm} from './support-workspace-ui.mjs';
import {CASE_MANAGERS,REFERRAL_STAGES,STRATEGIES,lastReferralStage} from './sss-leadership-data.mjs';
import {renderSSSLeadershipDashboard,renderSSSProfileNavigation,renderSSSSummary,renderSSSPlans} from './sss-leadership-ui.mjs';
import {renderSSSOverview,renderSSSStudentProfile} from './sss-view.mjs?v=20261111review1';
import {renderStudentPhoto,installStudentPhotoPreview} from './student-photo-preview.mjs?v=20261111photofix2';
import {createExperienceRecords,experienceFor,summarizeExperience,experienceChange,experienceQuestionSummary,EXPERIENCE_WINDOWS,EXPERIENCE_METRICS,METRIC_IDS,experienceEligible} from './experience-data.mjs?v=20261030repair1';
import {experienceDialogContent} from './experience-explain-modal.mjs?v=20261030wall3';
import {decorateEvidencePreviews,installEvidencePreviewController} from './evidence-previews.mjs?v=20261112scroll1';
import {resolveEvidencePreview} from './evidence-preview-context.mjs?v=20261113workflow1';
import {esc} from './v2-ui.mjs';
import {createAcademicDemoRecords,academicFor,academicModesFor,latestAcademic,READING_LEVELS,facultyDemoReport} from './academic-journey-data.mjs?v=20261111schemas1';
import {quartileBand,formatIndex,experienceBand} from './faculty-bands.mjs?v=20261030wall2';
import {leaderExperienceChange,leaderExperienceScale,leaderExperienceLegend,leaderExperienceBandLabel} from './leader-experience-bands.mjs';
import {facultyRosterEvidenceColumns,reportGradeBand,hasLowReportGrade,mypBestFitMarker} from './report-card-signals.mjs?v=20261112mypstar1';
import {renderLeaderReportFollowup} from './leader-report-followup.mjs?v=20261110daily1';
import {renderAcademicProfile,classAcademicCell} from './academic-journey-view.mjs?v=20261112subjects1';
import {renderSubjectGradeTiles} from './subject-grade-tiles.mjs?v=20261112subjects1';
import {everydayEvidenceForGrade,EVERYDAY_VIEW,FOCUSED_VIEW} from './faculty-everyday-columns.mjs?v=20261111mapui3';
import {facultyHeaderInfo,facultyHeaderWidth,facultyRosterTableWidth,facultyEvidenceFamily} from './faculty-roster-headings.mjs?v=20261113workflow1';
import {renderClassEvidencePanel,evidenceModesForGrade,normalizeEvidenceMode,normalizeComparison,evidenceLabel,evidenceValue,evidenceRosterColumn} from './class-evidence.mjs?v=20261113workflow1';
import {createMaiaDemoRecords,maiaDimension,maiaPeriod,renderMaiaFacultyProfile} from './maia-demo.mjs';
import {renderStudentOverview} from './student-daily-overview.mjs?v=20261112subjects1';
import {renderBoard} from './board-map-view.mjs?v=20261029dpaxis1';
import {renderTrendPointDetails} from './board-map-overview.mjs?v=20261029dpaxis1';
import {renderDPPointDetails} from './board-dp-view.mjs?v=20261031dp-default1';
import {renderDPSubjectPointDetails} from './board-dp-subjects.mjs';
import {DP_RECORDS} from './board-dp-data.mjs?v=20261031dp-world1';
import {boardWindowFor,BOARD_DATA} from './board-map-data.mjs';
import {parseBoardHash} from './board-map-links.mjs?v=20261031dp-default1';
import {EXPLORER_DEFAULTS,leaderExplorerModel,renderLeaderStudentExplorer,leaderExplorerExportRows} from './leader-student-explorer.mjs?v=20261113subjects1';
import {exportCsv,visibleDashboardCsv} from './dashboard-export.mjs?v=20261113export1';
const DATA=applyFacultyDemo(generateDemoData()),RECORDS=createExperienceRecords(DATA.students),
 ACADEMIC_RECORDS=createAcademicDemoRecords(DATA.students),
 MAIA_RECORDS=createMaiaDemoRecords(DATA.students),
 SSS_RECORDS=createSSSDemoRecords(DATA.students);
const SUPPORT_SEEDED=seedSupportDemo(DATA.students,SSS_RECORDS);
let SUPPORT_DRAFTS=loadDraftEntries();
const supportEntries=()=>[...SUPPORT_SEEDED.filter(x=>!SUPPORT_DRAFTS.some(d=>d.id===x.id)),...SUPPORT_DRAFTS];
const root=document.getElementById('app');
const supportTipController=installSupportTagTooltips(root);
installMapRitHeaderTooltips(root);
installSitewideColumnGuides(root);
installPresentationCopy(root);
// Scripted jumps respect the same reduced-motion preference as CSS transitions.
const scrollMotion=()=>globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth';
const saved=(k,d)=>{try{return sessionStorage.getItem(k)||d}catch{return d}};
const LEADER_SAVED_KEY='mylearners-demo-leaders-saved-view-v2';
const LEADER_LEGACY_KEY='mylearners-demo-leaders-saved-view-v1';
const savedLeaderView=()=>{
 try{
  const raw=localStorage.getItem(LEADER_SAVED_KEY)||localStorage.getItem(LEADER_LEGACY_KEY);
  return normalizeLeaderView(raw?JSON.parse(raw):null,DATA.classes);
 }catch{return null}
};
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
 division:'All',grade:'All',classId:'',studentId:'',query:'',facultyGradeFilter:'all',facultySupportFilter:'all',metric:'engagement',window:'F26',details:false,checkin:false,
 academicMode:'report',academicSubject:'Mathematics',academicReportYear:'',studentGrade:'G7',
 classEvidence:'report',classMapSubject:'Mathematics',classCompare:'none',classExperienceWindow:'F26',rosterView:EVERYDAY_VIEW,
 maiaDimension:'relationships',maiaWindow:'F26',
 studentReportsOpen:false,studentWellbeingOpen:false,leaderAcademicOpen:false,leaderPatternsOpen:false,
  leaderSupportOpen:false,leaderReportQuery:'',leaderReportMultiple:false,leaderReportExpanded:false,leaderReportThreshold:3,leaderReportOpen:false,
  leaderStudentId:'',leaderReviewFilter:'all',leaderReviewExpanded:false,
  leaderExplorerOpen:false,leaderExplorerFilters:{...EXPLORER_DEFAULTS},
  leaderDirectoryDivision:'All',leaderDirectoryGrade:'All',leaderDirectoryStatus:'has-support',
  leaderDirectoryQuery:'',leaderDirectoryExpanded:false,
  leaderScreenerBand:'all',leaderScreenerGrade:'All',leaderScreenerExpanded:false,
  leaderSection:'follow-up',leaderSaveNotice:'',
  leaderAcademicFocus:'',leaderAcademicGrade:'',leaderAcademicSubject:'',leaderAcademicMultiple:false,leaderAcademicExpanded:false,leaderMapBand:'both',
  journeySubject:'Reading',journeyStart:'auto',journeyEnd:'F26',journeyStartingBand:'both',journeyEndingBand:'average-plus',journeyPathway:'auto',journeyExpanded:false,journeyProfileSubject:'Reading',
  journeyPreset:'rising',journeyAdvancedOpen:false,
  strandSubject:'Reading',strandWindow:'F26',strandGrade:'All',strandBand:'both',strandGoal:'',strandExpanded:false,
  strandProfileSubject:'Reading',strandProfileGoal:'',strandProfileSeason:'fall',
  strandJourneyStart:'auto',strandJourneyEnd:'auto',strandJourneyExpanded:false,strandJourneyCrossOnly:false,
 sssGrade:'All',sssQuery:'',sssStudentId:'',sssOpenGrades:['G3'],sssAcademicOpen:false,
  supportForm:null,supportFilter:'all',supportQuery:'',
  sssManager:'All',sssPanel:'summary',supportBarrier:'All',
 boardWindow:saved('my-board-window-v2','fall2026'),boardSubject:saved('my-board-subject','math'),
 boardDivision:saved('my-board-division','all'),boardGrade:saved('my-board-grade','all'),
 boardView:'overview',boardTrendTerm:'fall',boardTrendFocus:'all',boardTrendRange:'recent',boardOverviewChart:'dp',
 boardMapDetailsOpen:false,boardMapCompareSeasons:false,boardMapGrowthOpen:false,
 boardDpMetric:'average',boardDpScale:'focus',boardDpWorldBasis:'overall',boardDpGlobal:true,
 boardDpYear:String(DP_RECORDS.at(-1).end),boardDpRange:'all',boardDpSubject:'math-aa-sl'};
recallFaculty();
if(state.role==='leader')state.classId='';
let leaderReturnContext=null;
const boardDeepLink=parseBoardHash(globalThis.location?.hash);
if(boardDeepLink&&state.role==='board')Object.assign(state,boardDeepLink);
const safe=(v)=>esc(v??'');
const teacher=()=>DATA.teachers.find(t=>t.id===state.teacher)||DATA.teachers.find(t=>t.id===DEFAULT_TEACHER_ID);
const ownClasses=()=>DATA.classes.filter(c=>teacher().classIds.includes(c.id));
const ownStudents=()=>DATA.students.filter(s=>teacher().classIds.includes(s.classId));
const activeClass=()=>ownClasses().find(c=>c.id===state.classId)||ownClasses()[0];
const leaderDirectoryFilters=()=>({division:state.leaderDirectoryDivision,grade:state.leaderDirectoryGrade,
 status:state.leaderDirectoryStatus,query:state.leaderDirectoryQuery,expanded:state.leaderDirectoryExpanded});
const leaderDirectoryScope=()=>DATA.students.filter(s=>(state.division==='All'||s.division===state.division)&&
 (state.grade==='All'||s.grade===state.grade)&&(!state.classId||s.classId===state.classId));
const previewController=installEvidencePreviewController(root,trigger=>resolveEvidencePreview(trigger,{
 role:state.role,state,data:DATA,academic:ACADEMIC_RECORDS,experience:RECORDS,maia:MAIA_RECORDS,sssRecords:SSS_RECORDS,
 allowedStudentIds:ownStudents().map(s=>s.id),
 allowedClassIds:ownClasses().map(c=>c.id)
}));
const photoPreviewController=installStudentPhotoPreview(root,()=>previewController?.dismiss());
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
 const comparison=change.delta===null?
  (change.previousLabel?'No comparable previous check-in':'First available check-in'):
  leaderExperienceChange(change.delta,change.previousLabel);
 const source=EXPERIENCE_WINDOWS.find(x=>x.key===window)?.label||window;
 const band=experienceBand(sum.value);
 const label=EXPERIENCE_METRICS[id].label;
 const interval=leaderExperienceBandLabel(sum.value);
 return '<article class="metric experience-metric-card'+(band?' index-'+band:'')+'">'+
  '<div class="metric-top"><span class="eyebrow">'+safe(label)+' index</span>'+
  '<span class="tiny">Fictional '+safe(source)+' check-in</span></div>'+
  '<div class="metric-value metric-colour-only" role="img" aria-label="'+safe(label+': '+(interval?.label||'No recorded index band'))+'"></div>'+
  (interval?'<span class="experience-metric-interval">'+safe(interval.colour)+' indicator</span>':'')+
  leaderExperienceScale(sum.value,label)+
  '<p>'+safe(EXPERIENCE_METRICS[id].description)+'</p>'+
  '<div class="metric-foot"><span>'+sum.n+' of '+sum.eligible+' responses</span>'+
  '<span>'+safe(comparison)+'</span></div>'+
  (sum.value===null?'':btn('explain:'+scope+':'+id,'How is this calculated?','quiet'))+'</article>';
}
function info(){return '<div class="notice"><strong>Demonstration preview.</strong> Learners, class assignments, academic records and check-ins are sample data; no live AISG student records or confidential survey responses are included. Experience indices describe learning experiences, not validated learner labels.</div>'}
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
 '<div class="heading-meta"><button type="button" class="sitewide-export-action" data-export-dashboard>Export CSV</button><span class="demo" title="Preview environment: sample learner records">PREVIEW</span><span class="asof">As of '+safe(asOf)+'</span></div></div>';
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
 const reportSubjects=facultyDemoReport(academicFor(ACADEMIC_RECORDS,ss[0]?.id))?.subjects||[];
 const subject=reportSubjects.some(x=>x.subject===state.academicSubject)?
  state.academicSubject:reportSubjects[0]?.subject||'';
 // The everyday view is a deliberately small, grade-aware selection of existing
 // evidence. Focused mode preserves the original single-measure comparison UX.
 const everyday=!across&&state.rosterView===EVERYDAY_VIEW;
 const everydayColumns=everyday?facultyRosterEvidenceColumns(ss,ACADEMIC_RECORDS,everydayEvidenceForGrade(grade)):[];
 const hasAcademicBands=everydayColumns.some(c=>['map','ixl','core','fp','flourishing'].includes(c.kind));
 const hasNumericReports=everydayColumns.some(c=>c.kind==='report'&&ss.some(student=>{const r=facultyDemoReport(academicFor(ACADEMIC_RECORDS,student.id));return reportGradeBand(r?.subjects?.find(x=>x.subject===c.subject)?.value,r?.scale)}));
 const hasExperienceBands=everydayColumns.some(c=>['engagement','belonging'].includes(c.kind));
 // Keep the selected check-in window in the evidence controls and hover details,
 // not repeated in every Faculty roster heading.
 const facultyExperienceHeading=(kind,label)=>kind==='engagement'?'Engagement':
  kind==='belonging'?'Belonging':label;
 const everydayHeading=column=>facultyHeaderInfo(column).display;
 const everydayHeader=(column)=>{
  if(column.kind==='mapRit')return renderMapRitHeader(column.subject).replace('<th ',
   '<th data-faculty-family="'+facultyEvidenceFamily(column)+'" ');
  const info=facultyHeaderInfo(column);
  // Preserve the source subject for saved arrangements; display a shorter
  // teacher-friendly name without changing any underlying report evidence.
  const source=facultyExperienceHeading(column.kind,column.label);
  return '<th scope="col" data-faculty-family="'+facultyEvidenceFamily(column)+
   '" class="faculty-roster-heading'+
   (info.abbreviated?' faculty-subject-abbr':'')+'" title="'+safe(info.full)+
   '" data-full-heading="'+safe(info.full)+'" data-source-heading="'+safe(source)+'">'+
   '<span class="faculty-heading-text'+(info.abbreviated?' is-compact':'')+
   (info.singleWord?' is-single-word':'')+'">'+safe(info.display)+'</span></th>';
 };
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
  if(!['map','ixl','core','fp','flourishing'].includes(column.kind))return null;
  const key=column.kind+'|'+(column.subject||'');
  if(!gradeReferences.has(key))gradeReferences.set(key,gradeCohort.map(s=>evidenceNumeric(s,column)).filter(Number.isFinite));
  return quartileBand(evidenceNumeric(student,column),gradeReferences.get(key),20);
 };
 const everydaySort=(student,column)=>{
  if(column.kind==='attendance')return attendanceSummary(DATA.attendance[student.id]||[]).rate;
  if(column.kind==='mapRit')return mapRitCurrent(DATA.map[student.id]||[],column.subject)?.rit??null;
  if(column.kind==='screener')return universalScreenerFor(student)?.percent??null;
  if(column.kind==='ufli')return ufliLessonFor(student)?.lesson??null;
  if(column.kind==='engagement'||column.kind==='belonging')
   return experienceFor(RECORDS,student.id,column.kind,state.classExperienceWindow)?.value??null;
  if(column.kind==='report'){
   const report=facultyDemoReport(academicFor(ACADEMIC_RECORDS,student.id));
   const item=report?.subjects?.find(x=>x.subject===column.subject);
   return report?.scale==='1–7'&&item?Number(item.value):null;
  }
  return evidenceNumeric(student,column);
 };
 const everydayCell=(student,column)=>{
  if(column.kind==='attendance'){
   const attendance=attendanceSummary(DATA.attendance[student.id]||[]);
   const value=attendance.rate===null||attendance.rate===undefined?'—':fmt(attendance.rate)+'%';
   return '<span class="class-evidence-result"><strong>'+safe(value)+'</strong></span>';
  }
  if(column.kind==='mapRit')return renderMapRitCell(DATA.map[student.id]||[],column.subject,student.id);
  if(column.kind==='ufli'){
   const placement=ufliLessonFor(student);
   if(!placement)return '';
   return '<span class="evidence-cell-layout"><button type="button" class="evidence-cell-open ufli-lesson-open"'+
    ' data-student="'+safe(student.id)+'" data-preview-student="'+safe(student.id)+'"'+
    ' data-evidence-preview="ufli" aria-label="UFLI Foundations demo lesson '+placement.lesson+
    '. '+safe(placement.phase.label)+'. Open '+safe(student.name)+' learner profile">'+
    renderUfliLessonTile(student)+'</button></span>';
  }
  if(column.kind==='screener'){
   const value=universalScreenerFor(student)?.percent;
   return '<span class="evidence-cell-layout"><button type="button" class="evidence-cell-open universal-screener-open"'+
    ' data-student="'+safe(student.id)+'" data-preview-student="'+safe(student.id)+'"'+
    ' data-evidence-preview="universal-screener" aria-label="Universal Screener, demo '+value+
    ' percent. Open '+safe(student.name)+' learner profile">'+
    renderUniversalScreenerTile(student)+'</button></span>';
  }
  if(column.kind==='ixl'){
   const result=latestAcademic(academicFor(ACADEMIC_RECORDS,student.id),'ixl');
   const status=result?.tier==='Above grade'?'above':result?.tier==='On grade'?'on':
    result?.tier==='Below grade'?'below':result?.tier==='Far below grade'?'far-below':'missing';
   const detail=result?
    'Overall diagnostic '+result.value+'; '+(result.tier||'tier unavailable')+
    '; '+(Number.isInteger(result.percentile)?'IXL percentile '+result.percentile:'IXL percentile unavailable'):
    'No completed current IXL diagnostic; missing is not zero';
   return '<span class="evidence-cell-layout"><button type="button" class="evidence-cell-open ixl-diagnostic-open"'+
    ' data-student="'+safe(student.id)+'" data-evidence-value="'+safe(result?.value||'—')+
    '" data-evidence-context="'+safe(detail)+'" aria-label="IXL Math: '+safe(detail)+'. Open learner profile">'+
    '<span class="ixl-diagnostic-tile ixl-tier-'+status+'">'+
    '<strong>'+safe(result?.value||'—')+'</strong>'+
    '<small>'+safe(result?.tier||'Not completed')+'</small></span></button></span>';
  }
  const report=facultyDemoReport(academicFor(ACADEMIC_RECORDS,student.id));
  const entry=column.kind==='report'?report?.subjects?.find(x=>x.subject===column.subject):null;
  const context={...evidenceCtx,mode:column.kind,subject:column.subject||state.academicSubject,
   mapSubject:column.kind==='map'?'Mathematics':state.classMapSubject,
   maiaDimension:column.kind==='flourishing'?'relationships':state.maiaDimension};
  const result=column.kind==='report'?(entry?
   {text:String(entry.value),detail:'2026–27 TEST DATA · NOT ISSUED · '+report.grade+' · '+report.framework,available:true}:
   {text:'—',detail:'No current test subject grade',available:false}):evidenceValue(student,context);
  const quartile=relativeBand(student,column);
  const gradeBand=column.kind==='report'?reportGradeBand(entry?.value,report?.scale):null;
  const inferredBand=column.kind==='engagement'||column.kind==='belonging'?
   experienceBand(experienceFor(RECORDS,student.id,column.kind,state.classExperienceWindow)?.value):
   quartile?.band||null;
  const band=gradeBand||inferredBand;
  const content=column.kind==='report'?
   '<span class="class-evidence-result evidence-report-grade'+(gradeBand?' evidence-heat '+gradeBand:'')+
   (result.available?'':' is-unavailable')+'"><strong>'+safe(result.text)+mypBestFitMarker(entry)+'</strong></span>':
   '<span class="class-evidence-result'+(band?' evidence-heat '+band:'')+
   (result.available?'':' is-unavailable')+'"><strong class="evidence-visually-hidden">'+
   safe(result.available?'Evidence available':'No evidence')+'</strong>'+
   (result.available?'<span class="evidence-band-mark" aria-hidden="true"></span>':
    '<span class="evidence-missing" aria-hidden="true">—</span>')+'</span>';
  const title=safe(column.label+': '+result.text+'. Select to open learner profile');
  const button='<button type="button" class="evidence-cell-open" data-student="'+safe(student.id)+
   '" data-evidence-value="'+safe(result.text)+'" data-evidence-subject="'+safe(column.subject||'')+
   '" data-evidence-context="'+safe(result.detail)+'" aria-label="'+title+'">'+content+'</button>';
  return '<span class="evidence-cell-layout">'+button+'</span>';
 };
 
 const modeLabel=across?'2026–27 demo test report':
  facultyExperienceHeading(mode,evidenceLabel(mode,{...evidenceCtx,subject}));
 const compareLabel=compare==='none'?'':facultyExperienceHeading(
  compare,evidenceLabel(compare,{...evidenceCtx,subject}));
 const query=state.query.trim().toLowerCase();
 const numericEligible=ss.some(s=>facultyDemoReport(academicFor(ACADEMIC_RECORDS,s.id))?.scale==='1–7');
 const mayIncludeProvisional=ss.some(s=>{const n=gradeNumber(s.grade);return n>=6&&n<=10});
 const filterLevel=numericEligible?(state.facultyGradeFilter==='2'?2:state.facultyGradeFilter==='3'?3:null):null;
 const count3=numericEligible?ss.filter(s=>hasLowReportGrade(s,ACADEMIC_RECORDS,3)).length:0;
 const count2=numericEligible?ss.filter(s=>hasLowReportGrade(s,ACADEMIC_RECORDS,2)).length:0;
 const rows=ss.filter(s=>(!query||s.name.toLowerCase().includes(query))&&
  (filterLevel===null||hasLowReportGrade(s,ACADEMIC_RECORDS,filterLevel))&&
  matchesSupportStatus(s,state.facultySupportFilter));
 const concernFilter=across&&numericEligible?
  '<div class="faculty-concern-filter" role="group" aria-label="Filter learners by subject results">'+
  '<span>Show learners</span>'+
  '<button type="button" data-faculty-low-filter="all" aria-pressed="'+(filterLevel===null)+
  '" class="'+(filterLevel===null?'active':'')+'">All learners</button>'+
  '<button type="button" data-faculty-low-filter="3" aria-pressed="'+(filterLevel===3)+
  '" class="'+(filterLevel===3?'active':'')+'" title="Current 2026–27 test grades'+
   (mayIncludeProvisional?', including provisional MYP best-fit results':'')+
   '">3 or below'+(mayIncludeProvisional?'*':'')+' <b>'+count3+'</b></button>'+
  '<button type="button" data-faculty-low-filter="2" aria-pressed="'+(filterLevel===2)+
  '" class="'+(filterLevel===2?'active':'')+'" title="Current 2026–27 test grades'+
   (mayIncludeProvisional?', including provisional MYP best-fit results':'')+
   '">2 or below'+(mayIncludeProvisional?'*':'')+' <b>'+count2+'</b></button>'+
  (mayIncludeProvisional?'<small class="faculty-provisional-note">*Includes provisional MYP best-fit grades when fewer than four criteria are assessed. All values are demo test data, not issued grades.</small>':'')+
  '</div>':'';

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
  const latest=facultyDemoReport(rec);
  const mixSubject=latest?.subjects.find(x=>x.subject==='Mathematics'||x.subject==='Early Mathematics')?.subject
   ||latest?.subjects[0]?.subject||'';
  const academics=across?
   '<span class="roster-mixed-academic">'+evidenceRosterColumn(student,{...evidenceCtx,subject:mixSubject,mode:'report'})+
   (latest?'<small>'+safe(mixSubject)+' · '+safe(latest.year)+' TEST · not issued</small>':'<small>No test grade</small>')+'</span>':
   evidenceRosterColumn(student,{...evidenceCtx,subject,mode});
  const compared=compare==='none'?'':evidenceRosterColumn(student,{...evidenceCtx,subject,mode:compare});
  return {student,attendance:fmt(attendance.rate)+'%',growth:growthText,
   eng:engagement,bel:belonging,everydayCells:everydayColumns.map(column=>everydayCell(student,column)),
   everydaySortValues:everydayColumns.map(column=>everydaySort(student,column)),academics,
   compared,tags:demoTagsForStudent(student),
   sss:SSS_RECORDS.has(student.id)};
 });
 const heading=across?'Students matching “'+safe(state.query.trim())+'”':'My Students';
 const context=(across?rows.length+' of '+ss.length+' assigned students across all classes':
  rows.length+' of '+ss.length+' learners in '+safe(activeClass()?.name||'this class'))+
  ' · 2026–27 synthetic test data · not issued';
 // Honour the visual width of each word instead of forcing arbitrary line
 // breaks. The table scrolls within its own shell if a class has many subjects.
 const rosterMinWidth=facultyRosterTableWidth(everydayColumns);
 const colgroup=everyday?'<colgroup><col class="roster-col-learner" style="width:210px">'+
  '<col class="roster-col-attendance" style="width:122px">'+
  everydayColumns.slice(1).map(column=>'<col class="roster-col-evidence'+
   (column.kind==='ufli'?' roster-col-ufli':'')+
   '" style="width:'+facultyHeaderWidth(column)+'px">').join('')+
  '<col class="roster-col-support" style="width:172px"></colgroup>':'';
 const table='<div class="tablewrap roster-desktop"><table'+
  (everyday?' class="faculty-data-wall" style="--faculty-roster-table-width:'+rosterMinWidth+'px"':'')+
  '>'+colgroup+'<thead><tr><th'+(everyday?' data-faculty-family="identity"':'')+'>Learner</th>'+
  (across?'<th>Class</th>':'')+
  (everyday?everydayColumns.map(everydayHeader).join(''):
   '<th>Attendance</th><th>'+safe(modeLabel)+'</th>'+(compare==='none'?'':'<th>'+safe(compareLabel)+'</th>'))+
  (!everyday&&showMap?MAP_RIT_SUBJECTS.map(renderMapRitHeader).join(''):'')+
  (!everyday&&showSEL?'<th>Engagement</th><th>Belonging</th>':'')+
  '<th'+(everyday?' data-faculty-family="support"':'')+'>Support information</th></tr></thead><tbody>'+
  data.map(x=>'<tr><td'+(everyday?' data-faculty-family="identity"':'')+'><span class="faculty-learner-entry">'+
   renderStudentPhoto(x.student)+
   '<button class="student-link" data-student="'+safe(x.student.id)+
   '">'+safe(x.student.name)+'</button></span></td>'+
   (across?'<td><span class="roster-class-label">'+safe(x.student.classId)+'</span></td>':'')+
   (everyday?x.everydayCells.map((cell,i)=>'<td data-faculty-family="'+
    facultyEvidenceFamily(everydayColumns[i])+'" data-ux-sort-value="'+
    (Number.isFinite(x.everydaySortValues[i])?String(x.everydaySortValues[i]):'')+'">'+cell+'</td>').join(''):
    '<td>'+x.attendance+'</td><td>'+x.academics+'</td>'+(compare==='none'?'':'<td>'+x.compared+'</td>'))+
   (!everyday&&showMap?MAP_RIT_SUBJECTS.map(subject=>'<td>'+renderMapRitCell(DATA.map[x.student.id]||[],subject,x.student.id)+'</td>').join(''):'')+
   (!everyday&&showSEL?'<td>'+x.eng+'</td><td>'+x.bel+'</td>':'')+
   '<td'+(everyday?' data-faculty-family="support"':'')+'><div class="staff-roster-support">'+supportStatusBadges(x.student,{compact:true})+
    '</div></td></tr>').join('')+'</tbody></table></div>';
 const mobile='<div class="roster-mobile">'+data.map(x=>
  '<div class="roster-item">'+renderStudentPhoto(x.student,'mobile')+
  '<button type="button" class="roster-item-main" data-student="'+safe(x.student.id)+
  '" aria-label="Open learner '+safe(x.student.name)+'">'+
  '<span class="roster-item-body"><strong>'+
  safe(x.student.name)+'</strong>'+
  (across?'<span>Class '+safe(x.student.classId)+'</span>':'')+
  (everyday?everydayColumns.map((column,i)=>'<span>'+safe(everydayHeading(column))+': '+
   x.everydayCells[i].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()+'</span>').join(''):
   '<span>'+safe(modeLabel)+': '+x.academics.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()+
   '</span>'+(compare==='none'?'':'<span>'+safe(compareLabel)+': '+
    x.compared.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()+'</span>'))+
  (!everyday?'<span>Attendance '+x.attendance+'</span>'+(!showMap?'':MAP_RIT_SUBJECTS.map(subject=>{
   const row=mapRitCurrent(DATA.map[x.student.id]||[],subject);
   const change=mapRitChange(DATA.map[x.student.id]||[],subject);
   return '<span>MAP '+safe(subject)+' RIT: '+(row?row.rit+' (P'+row.percentile+') · '+mapRitChangeLabel(change.delta):'—')+'</span>';
  }).join('')):'')+
  (!everyday&&experienceEligible(x.student)?'<span>Engagement '+x.eng+' · Belonging '+x.bel+'</span>':'')+
  (supportStatusBadges(x.student,{compact:true,interactive:false})?'<span>'+supportStatusBadges(x.student,{compact:true,interactive:false})+'</span>':'')+
  '</span><span class="roster-arrow" aria-hidden="true">›</span></button></div>').join('')+'</div>';
 return '<section class="roster roster-daily" data-roster-layout="'+(everyday?'everyday':'focused')+
  '" data-faculty-stage="'+(gradeNumber(grade)<=5?'elementary':'secondary')+'" aria-label="'+(across?'Search across assigned students':'My class roster')+'">'+
  '<div class="sectionhead"><div><h2>'+heading+'</h2><span class="tiny">'+context+'</span></div>'+concernFilter+
  supportStatusFilterControl(state.facultySupportFilter)+
  (across?'<button type="button" class="roster-clear-search" data-clear-search>Clear search</button>':'')+'</div>'+
  (options.controls||'')+
  (everyday&&(hasNumericReports||hasAcademicBands||hasExperienceBands)?'<div class="faculty-evidence-legend" aria-label="Understanding evidence colours">'+
  '<strong>'+(hasNumericReports?'Report card grades 1–7':'Assessment and experience indicators')+'</strong>'+
  '<span class="faculty-legend-swatches">'+
  '<span class="faculty-legend-chip band-low">'+(hasNumericReports?'1–3':'Low')+'</span>'+
  '<span class="faculty-legend-chip band-mid-low">'+(hasNumericReports?'4':'Lower')+'</span>'+
  '<span class="faculty-legend-chip band-mid-high">'+(hasNumericReports?'5–6':'Higher')+'</span>'+
  '<span class="faculty-legend-chip band-high">'+(hasNumericReports?'7':'High')+'</span></span>'+
  '<span class="faculty-legend-caption">Reports use fixed grade bands. Other measures are colour-only. Hover or focus for exact data.</span>'+
  '<details><summary>Interpret colours</summary><p>Numeric report TEST grades: 1–3 red, 4 orange, 5–6 light green, 7 dark green. Elementary developmental descriptors are not converted to grades. IXL uses source-style diagnostic tiers with incomplete results shown as missing; MAP RIT uses five separate achievement percentile quintiles; other assessments use fictional same-grade comparisons; experience uses fixed −2 to +2 bands. Grey means missing. A colour is not a learner label.</p></details></div>':'')+
  (everyday&&everydayColumns.some(c=>c.kind==='mapRit')?renderMapRitLegend():'')+
  (everyday?renderFacultyMeasureContext(everydayColumns,DATA.asOf):'')+
  table+mobile+
  (rows.length?'':'<p class="empty-message">'+(filterLevel!==null?'No learners have a subject result of '+filterLevel+' or below in this selection.':'No matching students in your assigned classes. Try a different name.')+'</p>')+
  '<details class="faculty-inquiry-prompt"><summary>From evidence to action</summary>'+
   '<p>Notice a pattern, check the source and date, and consider what more you might need to know. Select a learner to review their context and use the existing classroom response or follow-up tools. Do not draw conclusions from colour alone.</p></details>'+
  '<p class="tiny roster-caption">All subjects show explicitly fictional 2026–27 current-grade examples, not issued report grades. Numeric test outcomes use fixed 1–7 thresholds; Elementary developmental descriptors retain their own wording. MAP RIT uses five achievement percentile bands; IXL Math uses separate diagnostic grade-level tiers, and incomplete tests are missing rather than zero. Other non-report colours use fictional same-grade comparisons or fixed experience bands. Hover for the exact result and reporting context.</p>'+
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
 const header='<div class="profile-head">'+renderStudentPhoto(s,'profile')+
  '<div><div class="eyebrow">'+(studentRole?'MY LEARNING PROFILE':'WHOLE LEARNER PROFILE')+'</div>'+
  '<h1>'+safe(s.name)+'</h1><p>'+safe(s.grade)+' · '+safe(s.classId)+' · '+safe(s.campus)+'</p>'+
  (!studentRole?supportStatusBadges(s):'')+'</div></div>';
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
 const studentCheckinPreview=studentRole&&experienceEligible(s)?
  '<section class="student-checkin-preview" aria-label="My experience of learning">'+
   '<div class="student-checkin-preview-heading"><h2>How I feel about learning</h2>'+
   '<span>'+safe(EXPERIENCE_WINDOWS.find(w=>w.key===state.window)?.label||'Fall 2026')+
   ' · fictional check-in</span></div>'+
   '<div class="student-checkin-preview-grid">'+METRIC_IDS.map(id=>{
    const entry=experienceFor(RECORDS,s.id,id,state.window);
    const value=entry?.value??null;
    const band=experienceBand(value);
    const label=EXPERIENCE_METRICS[id].label;
    return '<article class="student-checkin-preview-tile'+(band?' index-'+band:'')+'">'+
     '<h3>'+safe(label)+'</h3>'+
     '<span class="student-checkin-preview-band" role="img" aria-label="'+safe(label+': '+(band||'not available')+' index band')+'"></span>'+
     leaderExperienceScale(value,label)+
     '<p>'+(entry?'Based on my check-in answers':'No check-in this period')+'</p></article>';
   }).join('')+'</div>'+
   '<p class="student-checkin-preview-note">These colours describe my experience, not my ability or a school grade. More details are below.</p>'+
  '</section>':'';
 const academics=renderAcademicProfile(s,ACADEMIC_RECORDS,studentRole,state.academicReportYear);
 const subjectGrades=renderSubjectGradeTiles(s,ACADEMIC_RECORDS,studentRole);
 if(studentRole){
  return profileStart+header+
   renderStudentOverview(s,ACADEMIC_RECORDS,{
    attendance:DATA.attendance[s.id],mathGrowth:mg,
    reflectionDraft:saved('reflection-'+s.id,'')})+
   subjectGrades+renderMapRitProfile(DATA.map[s.id]||[])+renderMapStrandProfile(DATA.map[s.id]||[],{studentRole:true})+
   renderStudentStrandJourney({student:s,records:DATA.map[s.id]||[],subject:state.strandProfileSubject,
    goalName:state.strandProfileGoal,season:state.strandProfileSeason,studentRole:true})+renderMapJourneyProfile({student:s,records:DATA.map[s.id]||[],subject:state.journeyProfileSubject})+studentCheckinPreview+
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
  kpi('Attendance',fmt(aa.rate)+'%','')+
  '<div class="kpi us-profile-fact"><span>Universal Screener · demo</span>'+renderUniversalScreenerTile(s)+
   '<small>2026–27 · fictional percentage, not a validated cutoff</small></div>'+
  (n>=0&&n<=5?'<div class="kpi ufli-profile-fact"><span>UFLI Foundations · demo lesson</span>'+
   renderUfliLessonTile(s,{compact:true})+'<small>'+safe(ufliLessonFor(s).phase.label)+
   ' · Fictional instructional placement</small></div>':'')+
  (math?kpi('Latest Mathematics report',math.value,issued?'Issued '+safe(issued.year)+
   ' · Grade '+safe(issued.grade)+' · '+safe(issued.framework):''):'')+'</div>';
 const visibleGuidance=tags.filter(t=>t.id==='eal'||t.id==='ss');
 const guidance=supportStatusDetails(s)+'<section class="card academic-next-step"><h2>Classroom Guidance</h2>'+
  (visibleGuidance.length?visibleGuidance.map(t=>'<div class="guide"><strong>'+safe(t.fullName)+'</strong><p>'+
   safe(t.strategies[0])+'</p></div>').join(' '):
  '<p class="muted">No additional classroom guidance tags in this fictional example.</p>')+
  '<p class="tiny">Detailed support plans and confidential records are not included in this public demo.</p></section>';
 return profileStart+header+profileKpis+subjectGrades+renderMapRitProfile(DATA.map[s.id]||[])+
  renderMapStrandProfile(DATA.map[s.id]||[])+
  renderStudentStrandJourney({student:s,records:DATA.map[s.id]||[],subject:state.strandProfileSubject,
   goalName:state.strandProfileGoal,season:state.strandProfileSeason})+
  renderMapJourneyProfile({student:s,records:DATA.map[s.id]||[],subject:state.journeyProfileSubject})+
  academics+wellbeing+maiaFaculty+
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
  const label=safe(EXPERIENCE_METRICS[id].label);
  const detail=sum.value===null?'No check-in':sum.n+'/'+sum.eligible+' responses · How is this calculated?';
  const exact=sum.value===null?'No index available':formatIndex(sum.value)+' on the −2 to +2 index';
  return '<button type="button" class="quick-tile quick-score faculty-index-gauge'+
   (band?' index-'+band:'')+
   '" data-action="explain:faculty:'+id+'" title="'+safe(label+': '+exact)+
   '" aria-label="'+safe(label+': '+exact+'. Select for detail')+'">'+
   '<span>'+label+'</span>'+
   leaderExperienceScale(sum.value,label)+
   '<small>'+detail+'</small></button>';
 };
 const toolbar='<div class="toolbar faculty-toolbar faculty-daily-toolbar">'+
  '<label>My class '+selector('class',cs.map(c=>[c.id,c.name]),state.classId)+'</label>'+
  '<label class="search-label">Find any assigned student'+
   '<input data-query placeholder="Search across all my classes..." value="'+safe(state.query)+
   '" aria-label="Search for a student across all assigned classes"></label>'+
  '<details class="faculty-demo-options"><summary>View options</summary>'+
   '<label class="faculty-demo-picker">Faculty perspective '+
   selector('teacher',DATA.teachers.map(t=>[t.id,t.name]),state.teacher)+'</label></details></div>';
 const summary=searching?'':'<div class="quick-summary faculty-daily-summary">'+
  quickStat('My Class',ss.length,'Learners in '+safe(activeClass()?.name||'this class'))+
  quickStat('Attendance',fmt(meanAttendance)+'%','')+
  (gradeHasCheckins?score('engagement')+score('belonging'):
   '<div class="quick-note">Student-reported experience indices start at Grade 3 in this demo.</div>')+'</div>';
 const lowGradeFilter=ss.some(s=>facultyDemoReport(academicFor(ACADEMIC_RECORDS,s.id))?.scale==='1–7')?
  {total:ss.length,count3:ss.filter(s=>hasLowReportGrade(s,ACADEMIC_RECORDS,3)).length,
   count2:ss.filter(s=>hasLowReportGrade(s,ACADEMIC_RECORDS,2)).length,active:state.facultyGradeFilter}:null;
 const reportControls=searching?'':renderClassEvidencePanel(ss,{
  academic:ACADEMIC_RECORDS,map:DATA.map,experience:RECORDS,maia:MAIA_RECORDS,
  maiaDimension:state.maiaDimension,maiaWindow:state.maiaWindow,
  rosterView:state.rosterView,lowGradeFilter,mode:state.classEvidence,subject:state.academicSubject,
  mapSubject:state.classMapSubject,compare:state.classCompare,window:state.classExperienceWindow});
 // Lead with the student roster and its subject, attendance and MAP evidence.
 // Keep the class summary and MAP strand quick-check available further down.
 return heading('My students','Find a learner, see essential information, or choose a class result.')+
  toolbar+
  roster(searching?ownStudents():ss,{across:searching,controls:reportControls})+
  summary+
  (!searching?renderFacultyStrandQuickCheck({students:ss,map:DATA.map,subject:state.strandSubject,
    band:state.strandBand,window:'F26'}):'')+
  renderMapStrandExplorer({students:searching?ownStudents():ss,map:DATA.map,mode:'faculty',
   subject:state.strandSubject,window:state.strandWindow,grade:state.strandGrade,
   band:state.strandBand,goalName:state.strandGoal,expanded:state.strandExpanded})+
  renderCohortStrandJourney({students:searching?ownStudents():ss,map:DATA.map,
   subject:state.strandSubject,goalName:state.strandGoal,grade:state.strandGrade,
   start:state.strandJourneyStart,end:state.strandJourneyEnd,
   expanded:state.strandJourneyExpanded,crossOnly:state.strandJourneyCrossOnly,mode:'faculty'})+
  info();
}

const explorerFilters=()=>state.leaderExplorerFilters;
const leaderViewNav=()=>'<nav class="leader-explorer-nav" aria-label="Leadership views">'+
 '<button type="button" data-leader-view="overview" aria-pressed="'+(!state.leaderExplorerOpen)+'">Overview</button>'+
 '<button type="button" data-leader-view="explorer" aria-pressed="'+state.leaderExplorerOpen+'">Student Explorer</button></nav>';
function leader(){
 const grades=GRADES;
 const divisions=state.division==='All'?['Elementary','Secondary']:[state.division];
 const group=leaderDirectoryScope();
 const leaderPerson=state.leaderStudentId?(state.leaderExplorerOpen?
  leaderExplorerModel({data:DATA,academic:ACADEMIC_RECORDS,experience:RECORDS,filters:explorerFilters()})
   .rows.find(row=>row.student.id===state.leaderStudentId)?.student||null:
  group.find(s=>s.id===state.leaderStudentId)||null):null;
 if(state.leaderSection==='journeys'&&!group.some(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10))
  state.leaderSection='follow-up';
 if(leaderPerson)return heading('Leadership Overview','Read-only evidence for leadership review.')+
  renderLeaderLearnerEvidence({student:leaderPerson,data:DATA,academic:ACADEMIC_RECORDS,
   records:RECORDS,window:state.window,
   returnLabel:leaderReturnContext?.label||'division review',
   journeyProfile:renderMapJourneyProfile({student:leaderPerson,records:DATA.map[leaderPerson.id]||[],
    subject:state.journeyProfileSubject})})+
  renderMapStrandProfile(DATA.map[leaderPerson.id]||[])+
  renderStudentStrandJourney({student:leaderPerson,records:DATA.map[leaderPerson.id]||[],
   subject:state.strandProfileSubject,goalName:state.strandProfileGoal,
   season:state.strandProfileSeason})+info();

 if(state.leaderExplorerOpen)return heading('Student Explorer',
  'Filter, sort and explore learners with Faculty-style evidence columns.')+
  leaderViewNav()+renderLeaderStudentExplorer({data:DATA,academic:ACADEMIC_RECORDS,
   experience:RECORDS,maia:MAIA_RECORDS,filters:explorerFilters()})+info();
 if(state.division==='All')return heading('Leadership Overview',
  'Begin whole school, choose Elementary or Secondary, then drill down by grade.')+
  leaderViewNav()+renderLeaderWholeSchool({students:DATA.students,data:DATA,academic:ACADEMIC_RECORDS,
   records:RECORDS,sssRecords:SSS_RECORDS,entries:supportEntries(),savedView:savedLeaderView()})+
  renderLeaderUniversalScreener({students:group,scopeLabel:'Whole school',
   bandFilter:state.leaderScreenerBand,gradeFilter:state.leaderScreenerGrade,
   expanded:state.leaderScreenerExpanded})+
  renderLeaderSupportDirectory({students:group,filters:leaderDirectoryFilters(),showDivision:true})+info();
 const classes=leaderAdvisoryClasses(DATA.classes,state.division,state.grade);
 const selectedClass=classes.find(c=>c.id===state.classId);
 const secondaryOnly=group.length>0&&group.every(s=>s.division==='Secondary');
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
   const band=experienceBand(summary.value);
   const interval=leaderExperienceBandLabel(summary.value);
   const metricLabel=EXPERIENCE_METRICS[id].label;
   const comparison=leaderExperienceChange(change.delta,change.previousLabel);
   return '<article class="leader-experience-card'+(band?' index-'+band:'')+'">'+
    '<span class="leader-measure-label">'+safe(metricLabel)+'</span>'+
    '<div class="leader-experience-value leader-colour-only" role="img" aria-label="'+safe(metricLabel+': '+(interval?.label||'No available index band'))+'"></div>'+
    (interval?'<span class="leader-experience-interval">'+safe(interval.colour)+' indicator</span>':'')+
    leaderExperienceScale(summary.value,metricLabel)+
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
 const mapEligible=group.some(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10);
 const dpStudents=group.filter(s=>gradeNumber(s.grade)>=11);
 const dpSignals=leaderReportSignalSummary(dpStudents,ACADEMIC_RECORDS,2);
 const core=leaderCheckSnapshot(group,ACADEMIC_RECORDS,'core');
 const hasCore=group.some(s=>gradeNumber(s.grade)>=0&&gradeNumber(s.grade)<=5);
 const learning='<section class="leader-section" aria-labelledby="leader-learning-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">LEARNING EVIDENCE</div>'+
  '<h2 id="leader-learning-title">Academic patterns</h2></div>'+
  '<span class="leader-period">'+safe(scopeLabel)+' · Fictional evidence · Fall 2026</span></div>'+
  '<div class="leader-learning-grid">'+
  stat('Learners',String(group.length),'Students included in this cohort','Demo roster')+
  (mapEligible?growthTile('MAP Mathematics growth',math)+growthTile('MAP Reading growth',reading):'')+
  (dpStudents.length?stat('DP subject results ≤2',String(dpSignals.flagged),
   'Learners with in-progress Diploma subject results of 2 or below.',
   'Grades 11–12 · simulated, not issued'):'')+
  (hasCore?stat('Literacy check-ins',core.eligible?core.available+' / '+core.eligible:'—',
   'Core Phonics decoding evidence for eligible learners.','K–Grade 5 · simulated'):'')+
  stat('Historical report coverage',reports.rate===null?'—':reports.rate+'%',
   reports.available+' of '+reports.eligible+' learners with an issued historical record.',
   'Simulated previous school years')+'</div>'+quickEvidence+
  '<p class="leader-data-note">'+(mapEligible?
   'MAP growth uses comparable tests for eligible Grades 3–10. It does not measure achievement percentile. ':
   'MAP is not used in this selected grade range. ')+
   'MYP, DP and Elementary report scales are not averaged together. '+
   'The public GitHub dashboard uses fictional results.</p></section>';
 const experienceSection='<section class="leader-section" aria-labelledby="leader-experience-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">STUDENT VOICE</div>'+
  '<h2 id="leader-experience-title">Student Experience</h2>'+
  '<p>Engagement and belonging · '+safe(selectedWindow)+' · response counts included.</p></div>'+
  '<label class="leader-window-select">Check-in period '+
  selector('window',EXPERIENCE_WINDOWS.map(w=>[w.key,w.label]),state.window)+
  '</label></div>'+leaderExperienceLegend()+experience+
  renderLeaderVoiceReview({students:group,records:RECORDS,window:state.window})+
  '<p class="leader-data-note">These indices are on a fixed −2 to +2 scale. '+
  'Interpret trends within the same age-appropriate question set, not as academic results.</p></section>';
 const reportSection=secondaryOnly?
  '<details id="leader-subject-detail" class="leader-detail leader-subject-detail"'+
  (state.leaderReportOpen?' open':'')+' data-leader-panel="report">'+
  '<summary><span><strong>Explore Secondary subject results</strong>'+
  '<small>Review every 2-or-below / 3-or-below result and subject distribution</small></span>'+
  '<span class="leader-detail-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="leader-detail-body">'+
  renderLeaderReportFollowup({students:group,academic:ACADEMIC_RECORDS,
   query:state.leaderReportQuery,multiple:state.leaderReportMultiple,
   expanded:state.leaderReportExpanded,threshold:state.leaderReportThreshold})+
  '</div></details>':'';
 const deepAcademic='<details id="leader-academic-detail" class="leader-detail" data-leader-panel="academics"'+
  (state.leaderAcademicOpen?' open':'')+'>'+
  '<summary><span><strong>Explore assessment coverage and issued reports</strong>'+
  '<small>Grade-eligible assessments · historical records only</small></span>'+
  '<span class="leader-detail-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="leader-detail-body"><h3>Assessment Coverage</h3>'+
  '<p class="leader-inline-note">Each tool uses its own scale. Not collected is different from zero.</p>'+
  '<div class="leader-check-list">'+academicChecks+'</div>'+
  '<h3>Most Recent Issued Report Outcomes</h3>'+reportDetail+'</div></details>';
 const deepPatterns='<details class="leader-detail" data-leader-panel="patterns"'+
  (state.leaderPatternsOpen?' open':'')+'>'+
  '<summary><span><strong>Explore student voice patterns</strong>'+
  '<small>Advisory and grade comparisons · three check-in windows</small></span>'+
  '<span class="leader-detail-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="leader-detail-body"><h3>Patterns by '+
  (state.classId?'selected advisory':state.grade==='All'?'grade':'homeroom')+'</h3>'+
  detailTable+
  '<p class="leader-inline-note">Indices are on the fixed −2 to +2 scale. '+
  'They do not rank learners or indicate academic achievement. '+
  'Only homeroom/advisory cohorts are shown; taught courses are not survey response groups.</p>'+
  '<h3>Over Time</h3>'+trends+'</div></details>';
 const leaderPane=(id,content)=>'<section id="leader-focus-panel-'+id+
  '" class="leader-focus-panel" role="tabpanel" aria-labelledby="leader-focus-tab-'+id+'"'+
  (state.leaderSection===id?'':' hidden')+'>'+content+'</section>';
 return heading('Leadership Overview',
  'Review learners first, then investigate longitudinal, academic and experience evidence.')+
  leaderViewNav()+'<div class="leader-view leader-daily">'+
  '<div class="toolbar leader-controls leader-scope-controls">'+
  '<label>Division '+selector('division',[['All','Whole school'],['Elementary','Elementary'],['Secondary','Secondary']],state.division)+'</label>'+
  '<label>Grade '+selector('grade',[['All','All grades'],...grades.filter(g=>
   divisions.includes(gradeNumber(g)<=5?'Elementary':'Secondary')).map(g=>[g,g==='K'?'Kindergarten':g])],state.grade)+'</label>'+
  '<label>Homeroom / advisory '+selector('leader-class',[['','All homerooms'],...classes.map(c=>[c.id,c.name])],state.classId)+'</label></div>'+
  renderLeaderDivisionDaily({division:state.division,grade:state.grade,students:group,
   allStudents:DATA.students,data:DATA,academic:ACADEMIC_RECORDS,records:RECORDS,
   sssRecords:SSS_RECORDS,entries:supportEntries(),reviewFilter:state.leaderReviewFilter,
   expanded:state.leaderReviewExpanded,savedView:savedLeaderView(),voiceWindow:state.window,
   screenerPanel:renderLeaderUniversalScreener({students:group,scopeLabel,
    bandFilter:state.leaderScreenerBand,gradeFilter:state.leaderScreenerGrade,
    expanded:state.leaderScreenerExpanded}),
   focusSection:state.leaderSection,savedNotice:state.leaderSaveNotice,
   journeyPanel:renderMapJourneyCohort({students:group,map:DATA.map,
    subject:state.journeySubject,
    start:state.journeyStart==='auto'?(state.division==='Elementary'?'F24':'F22'):state.journeyStart,
    end:state.journeyEnd,startingBand:state.journeyStartingBand,
    endingBand:state.journeyEndingBand,
    pathway:state.journeyPathway==='auto'?(state.division==='Elementary'?'all':'cross'):state.journeyPathway,
    expanded:state.journeyExpanded,preset:state.journeyPreset,
    advancedOpen:state.journeyAdvancedOpen}),
   academicPanels:renderMapStrandExplorer({students:group,map:DATA.map,mode:'leader',
    subject:state.strandSubject,window:state.strandWindow,grade:state.strandGrade,
    band:state.strandBand,goalName:state.strandGoal,expanded:state.strandExpanded})+
    renderCohortStrandJourney({students:group,map:DATA.map,mode:'leader',
     subject:state.strandSubject,goalName:state.strandGoal,grade:state.strandGrade,
     start:state.strandJourneyStart,end:state.strandJourneyEnd,
     expanded:state.strandJourneyExpanded,crossOnly:state.strandJourneyCrossOnly})+
    learning+reportSection+deepAcademic,
   academicActions:renderLeaderAcademicActions({students:group,map:DATA.map,academic:ACADEMIC_RECORDS,
    focus:state.leaderAcademicFocus,grade:state.leaderAcademicGrade,
    subject:state.leaderAcademicSubject,multiple:state.leaderAcademicMultiple,
    expanded:state.leaderAcademicExpanded,mapBand:state.leaderMapBand})})+
  leaderPane('experience',experienceSection+deepPatterns)+
  leaderPane('support',renderLeaderSupportSection({students:group,sssRecords:SSS_RECORDS,
   entries:supportEntries(),open:state.leaderSupportOpen})+
   renderLeaderSupportDirectory({students:group,filters:leaderDirectoryFilters(),showDivision:false}))+'</div>'+info();
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
 return heading('My learning','A personal view of my growth, school reports and reflections.')+
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
const resetLeaderAcademicAction=()=>{
 state.leaderAcademicFocus='';state.leaderAcademicGrade='';state.leaderAcademicSubject='';
 state.leaderAcademicMultiple=false;state.leaderAcademicExpanded=false;
 state.leaderMapBand='both';
};
const resetMapJourney=()=>{
 state.journeySubject='Reading';state.journeyStart='auto';state.journeyEnd='F26';
 state.journeyStartingBand='both';state.journeyEndingBand='average-plus';
 state.journeyPathway='auto';state.journeyExpanded=false;
 state.journeyPreset='rising';state.journeyAdvancedOpen=false;
};
/** Keep learner-facing language clear without modifying data, routes or CSS classes.
 * The public demo disclosure stays in the footer and accessibility metadata.
 */
function facultyStudentCopy(markup){
 const rewrite=s=>s.replace(/\bfictional\b/gi,'example')
  .replace(/\bsynthetic\b/gi,'illustrative')
  .replace(/\bmade[ -]up\b/gi,'example')
  .replace(/\bfake\b/gi,'demo');
 return markup.replace(/>([^<>]*)</g,(_match,content)=>'>'+rewrite(content)+'<')
  .replace(/(\b(?:aria-label|alt|title)=")([^"]*)(")/g,
   (_match,prefix,content,suffix)=>prefix+rewrite(content)+suffix);
}
function render(){
 supportTipController.hide(true);
 pinnedChartKey=null;
 const content=state.role==='board'?renderBoard(state):state.role==='leader'?leader():
  state.role==='sss'?sss():state.role==='student'?student():faculty();
 document.body.classList.toggle('board-drawer-open',state.role==='board'&&state.boardView==='explore'&&!!state.boardMapDetailsOpen);
 if(root.dataset)root.dataset.workspace=state.role;
 const view=polishPresentationMarkup(content);
 const dataDisclosure='<details class="sitewide-footer-data" data-preserve-source-copy>'+
  '<summary>About this view</summary>'+
  '<p>This preview environment uses sample learner profiles, classes and assessments for interface evaluation. '+
  'There are no live student records. Historical Board aggregate figures retain their stated evidence sources. '+
  'Do not enter confidential student information in this public site.</p></details>';
 root.innerHTML=polishPresentationMarkup(header())+
  '<main class="container" id="main" tabindex="-1">'+view+'</main>'+
  '<footer class="sitewide-product-footer"><span class="sitewide-footer-identity">AISG My Learners · Learning Intelligence</span>'+
  dataDisclosure+'</footer>'+
  (state.supportForm?polishPresentationMarkup(renderSupportForm(state.supportForm,DATA.userIndex.get(state.supportForm.studentId),SUPPORT_DRAFTS)):'');
 if(state.role==='board'&&state.boardView==='explore'&&state.boardMapDetailsOpen){
  root.querySelector('.board-drawer-close')?.focus({preventScroll:true});
 }
 if(state.role==='board'&&globalThis.window?.innerWidth<700){
  const useDp=(state.boardView==='dp')||(state.boardView==='overview'&&state.boardOverviewChart==='dp');
  const scroller=root.querySelector?.(useDp?'.board-dp-chart-scroll':'.board-trend-scroller');
  if(scroller)scroller.scrollLeft=scroller.scrollWidth;
 }
 previewController?.dismiss();
 photoPreviewController?.dismiss();
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
 const leaderTab=e.target.closest?.('[data-leader-focus]');
 if(leaderTab&&state.role==='leader'&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
  const tabs=[...root.querySelectorAll('.leader-focus-nav [data-leader-focus]')];
  const current=tabs.indexOf(leaderTab);
  if(current>=0&&tabs.length){
   e.preventDefault();
   const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:
    (current+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   tabs[next].click();
   return;
  }
 }
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
 const download=e.target.closest('[data-export-dashboard]');
 if(download){const table=state.role==='leader'&&state.leaderExplorerOpen&&!state.leaderStudentId?
  leaderExplorerExportRows({data:DATA,academic:ACADEMIC_RECORDS,experience:RECORDS,filters:explorerFilters()}):null;
  exportCsv('my-learners-'+state.role+(table?'-student-explorer':'')+'.csv',table?[table.headers,...table.rows]:visibleDashboardCsv(root,ROLE_DISPLAY[state.role]));return;}
 if(state.role==='leader'){
  const nav=e.target.closest('[data-leader-view]');
  if(nav){state.leaderExplorerOpen=nav.dataset.leaderView==='explorer';state.leaderStudentId='';render();globalThis.window?.scrollTo?.(0,0);return}
  if(state.leaderExplorerOpen){
   const ex=e.target.closest('[data-explorer-student]');
   if(ex){const found=leaderExplorerModel({data:DATA,academic:ACADEMIC_RECORDS,experience:RECORDS,filters:explorerFilters()}).rows.find(r=>r.student.id===ex.dataset.explorerStudent);
    if(found){leaderReturnContext={studentId:found.student.id,containerId:'leader-student-explorer',label:'Student Explorer',scrollY:Math.max(0,globalThis.window?.scrollY||0),source:'explorer'};
     state.leaderStudentId=found.student.id;render();globalThis.window?.scrollTo?.(0,0)}return;}
   const sort=e.target.closest('[data-explorer-sort]');
   if(sort){const f=explorerFilters();f.direction=f.sort===sort.dataset.explorerSort&&f.direction==='asc'?'desc':'asc';f.sort=sort.dataset.explorerSort;render();return}
   if(e.target.closest('[data-explorer-direction]')){const f=explorerFilters();f.direction=f.direction==='asc'?'desc':'asc';render();return}
   if(e.target.closest('[data-explorer-reset]')){state.leaderExplorerFilters={...EXPLORER_DEFAULTS};render();return}
  }
 }
 const strandProfileSubject=e.target.closest('[data-map-strand-profile-subject]');
 if(strandProfileSubject&&['faculty','student','leader'].includes(state.role)){
  const subject=strandProfileSubject.dataset.mapStrandProfileSubject;
  if(!STRAND_SUBJECTS.includes(subject))return;
  state.strandProfileSubject=subject;state.strandProfileGoal='';
  render();root.querySelector('[data-map-strand-profile-subject="'+subject+'"]')?.focus?.({preventScroll:true});return;
 }
 const strandProfileSeason=e.target.closest('[data-map-strand-profile-season]');
 if(strandProfileSeason&&['faculty','student','leader'].includes(state.role)){
  state.strandProfileSeason=strandProfileSeason.dataset.mapStrandProfileSeason==='all'?'all':'fall';
  render();root.querySelector('[data-map-strand-profile-season="'+state.strandProfileSeason+'"]')
   ?.focus?.({preventScroll:true});return;
 }
 if(state.role==='faculty'){
  const facultyStrandSubject=e.target.closest('[data-faculty-strand-subject]');
  if(facultyStrandSubject){
   const subject=facultyStrandSubject.dataset.facultyStrandSubject;
   if(!STRAND_SUBJECTS.includes(subject))return;
   state.strandSubject=subject;state.strandGoal='';state.strandWindow='F26';
   state.strandJourneyStart='auto';state.strandJourneyEnd='auto';state.strandJourneyExpanded=false;
   render();root.querySelector('[data-faculty-strand-subject="'+subject+'"]')
    ?.focus?.({preventScroll:true});return;
  }
  const facultyBand=e.target.closest('[data-faculty-strand-band]');
  if(facultyBand){
   const band=facultyBand.dataset.facultyStrandBand;
   if(!['both','low','low-average'].includes(band))return;
   state.strandBand=band;state.strandWindow='F26';state.strandGoal='';
   render();root.querySelector('[data-faculty-strand-band="'+band+'"]')?.focus?.({preventScroll:true});return;
  }
  const facultyGoal=e.target.closest('[data-faculty-strand-goal]');
  if(facultyGoal){
   const target=facultyGoal.dataset.facultyStrandGoal;
   const scope=(activeClass()?.studentIds||[]).map(id=>DATA.userIndex.get(id)).filter(Boolean);
   const quick=facultyStrandQuickModel({students:scope,map:DATA.map,
    subject:state.strandSubject,band:state.strandBand,window:'F26'});
   if(!quick.active.groups.some(g=>g.name===target))return;
   state.strandGoal=target;state.strandWindow='F26';state.strandExpanded=false;
   render();root.querySelector('#map-strand-explorer')?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   root.querySelector('[data-map-strand-filter="goal"]')?.focus?.({preventScroll:true});return;
  }
  if(e.target.closest('[data-faculty-strand-open]')){
   root.querySelector('#map-strand-explorer')?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   root.querySelector('[data-map-strand-filter="subject"]')?.focus?.({preventScroll:true});return;
  }
 }
 if(e.target.closest('[data-map-strand-journey-cross]')&&['leader','faculty'].includes(state.role)){
  state.strandJourneyCrossOnly=!state.strandJourneyCrossOnly;state.strandJourneyExpanded=false;render();
  root.querySelector('[data-map-strand-journey-cross]')?.focus?.({preventScroll:true});return;
 }
 if(e.target.closest('[data-map-strand-journey-expand]')&&['leader','faculty'].includes(state.role)){
  state.strandJourneyExpanded=!state.strandJourneyExpanded;render();
  root.querySelector('[data-map-strand-journey-expand]')?.focus?.({preventScroll:true});return;
 }
 if(e.target.closest('[data-map-strand-expand]')&&['leader','faculty'].includes(state.role)){
  state.strandExpanded=!state.strandExpanded;render();
  root.querySelector('[data-map-strand-expand]')?.focus?.({preventScroll:true});return;
 }
 const journeyProfileSubject=e.target.closest('[data-map-journey-profile-subject]');
 if(journeyProfileSubject&&['leader','faculty','student'].includes(state.role)){
  const subject=journeyProfileSubject.dataset.mapJourneyProfileSubject;
  if(!MAP_RIT_SUBJECTS.includes(subject))return;
  state.journeyProfileSubject=subject;render();
  root.querySelector('[data-map-journey-profile-subject="'+subject+'"]')?.focus?.({preventScroll:true});
  return;
 }
 if(state.role==='leader'){
  if(e.target.closest('[data-leader-directory-jump]')){
   const target=root.querySelector('#leader-support-directory');
   target?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   target?.querySelector?.('[data-leader-directory-filter="status"]')?.focus?.({preventScroll:true});
   return;
  }
  const directoryStudent=e.target.closest('[data-leader-directory-student]');
  if(directoryStudent){
   const id=directoryStudent.dataset.leaderDirectoryStudent;
   const visible=leaderSupportDirectoryModel(leaderDirectoryScope(),leaderDirectoryFilters()).shown;
   const chosen=visible.find(s=>s.id===id);
   if(!chosen)return;
   leaderReturnContext={studentId:chosen.id,containerId:'leader-support-directory',
    label:'Support Student Directory',scrollY:Math.max(0,globalThis.window?.scrollY||0),
    section:state.leaderSection,source:'directory'};
   state.leaderStudentId=chosen.id;
   render();globalThis.window?.scrollTo?.(0,0);return;
  }
  if(e.target.closest('[data-leader-directory-expand]')){
   state.leaderDirectoryExpanded=!state.leaderDirectoryExpanded;render();
   root.querySelector('#leader-support-directory')?.scrollIntoView?.({block:'start',behavior:scrollMotion()});
   return;
  }
  if(e.target.closest('[data-leader-directory-reset]')){
   state.leaderDirectoryDivision='All';state.leaderDirectoryGrade='All';
   state.leaderDirectoryStatus='has-support';state.leaderDirectoryQuery='';
   state.leaderDirectoryExpanded=false;render();
   root.querySelector('[data-leader-directory-filter="status"]')?.focus?.({preventScroll:true});
   return;
  }
  const divisionChoice=e.target.closest('[data-leader-division]');
  if(divisionChoice){
   const next=divisionChoice.dataset.leaderDivision;
   if(!['All','Elementary','Secondary'].includes(next))return;
   state.division=next;state.grade='All';state.classId='';state.leaderStudentId='';
   state.leaderReviewFilter='all';state.leaderReviewExpanded=false;state.leaderReportOpen=false;
   state.leaderSection='follow-up';state.leaderSaveNotice='';
   resetLeaderAcademicAction();resetMapJourney();
   render();globalThis.window?.scrollTo?.(0,0);return;
  }
  const chosenGrade=e.target.closest('[data-leader-grade]');
  if(chosenGrade&&state.division!=='All'){
   const next=chosenGrade.dataset.leaderGrade;
   if(next!=='All'&&(!GRADES.includes(next)||
     (gradeNumber(next)<=5?'Elementary':'Secondary')!==state.division))return;
   state.grade=next;state.classId='';state.leaderStudentId='';
   state.leaderReviewFilter='all';state.leaderReviewExpanded=false;resetLeaderAcademicAction();resetMapJourney();
   render();
   root.querySelector('[data-leader-grade="'+next+'"]')?.focus?.({preventScroll:true});
   globalThis.window?.scrollTo?.(0,0);return;
  }
  if(e.target.closest('[data-leader-save-view]')){
   if(['Elementary','Secondary'].includes(state.division)){
    try{
     localStorage.setItem(LEADER_SAVED_KEY,JSON.stringify(leaderSavedViewPayload(state)));
     state.leaderSaveNotice='Saved on this browser · no student records stored';
    }catch{state.leaderSaveNotice='Browser storage unavailable';}
    render();
    root.querySelector('[data-leader-save-view]')?.focus?.({preventScroll:true});
   }
   return;
  }
  if(e.target.closest('[data-leader-open-saved]')){
   const saved=savedLeaderView();
   if(!saved)return;
   resetLeaderAcademicAction();resetMapJourney();
   leaderApplySavedView(state,saved);
   state.leaderStudentId='';state.leaderSaveNotice='Saved setup restored';
   state.leaderReviewExpanded=false;state.leaderAcademicExpanded=false;state.journeyExpanded=false;
   render();globalThis.window?.scrollTo?.(0,0);return;
  }
  const focusTab=e.target.closest('[data-leader-focus]');
  if(focusTab){
   const next=focusTab.dataset.leaderFocus;
   if(!LEADER_FOCUS_VALUES.includes(next))return;
   if(next==='journeys'&&!DATA.students.some(x=>x.division===state.division&&
     (state.grade==='All'||x.grade===state.grade)&&(!state.classId||x.classId===state.classId)&&
     gradeNumber(x.grade)>=3&&gradeNumber(x.grade)<=10))return;
   state.leaderSection=next;state.leaderSaveNotice='';
   render();
   root.querySelector('[data-leader-focus="'+next+'"]')?.focus?.({preventScroll:true});
   root.querySelector('#leader-focus-panel-'+next)?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   return;
  }
  const journeyPreset=e.target.closest('[data-map-journey-preset]');
  if(journeyPreset){
   const config=LEADER_JOURNEY_PRESETS.find(x=>x.id===journeyPreset.dataset.mapJourneyPreset);
   if(!config)return;
   state.journeyPreset=config.id;
   state.journeyStartingBand=config.startingBand;
   state.journeyEndingBand=config.endingBand;
   state.journeyPathway=state.division==='Elementary'?'all':config.pathway;
   state.journeyStart='auto';state.journeyEnd='F26';
   state.journeyExpanded=false;
   render();
   root.querySelector('[data-map-journey-preset="'+config.id+'"]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-map-journey-refine]')){
   state.journeyAdvancedOpen=!state.journeyAdvancedOpen;
   render();
   root.querySelector('[data-map-journey-refine]')?.focus?.({preventScroll:true});
   return;
  }
  const journeyCell=e.target.closest('[data-map-journey-cell]');
  if(journeyCell&&!journeyCell.disabled){
   const [from,to]=journeyCell.dataset.mapJourneyCell.split('|');
   const allowed=['low','low-average','average','high-average','high'];
   if(!allowed.includes(from)||!allowed.includes(to))return;
   state.journeyStartingBand=from;state.journeyEndingBand=to;state.journeyExpanded=false;
   state.journeyPreset='custom';
   render();
   root.querySelector('#map-journey-students')?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   return;
  }
  const pathway=e.target.closest('[data-map-journey-pathway]');
  if(pathway){
   if(!['all','cross'].includes(pathway.dataset.mapJourneyPathway))return;
   state.journeyPathway=pathway.dataset.mapJourneyPathway;state.journeyExpanded=false;
   state.journeyPreset='custom';
   render();
   root.querySelector('[data-map-journey-pathway="'+state.journeyPathway+'"]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-map-journey-expand]')){
   state.journeyExpanded=!state.journeyExpanded;render();
   root.querySelector('[data-map-journey-expand]')?.focus?.({preventScroll:true});
   return;
  }
  const academicFocus=e.target.closest('[data-leader-academic-focus]');
  if(academicFocus){
   const next=academicFocus.dataset.leaderAcademicFocus;
   if(!LEADER_ACADEMIC_FOCUS.includes(next))return;
   const closing=state.leaderAcademicFocus===next;
   resetLeaderAcademicAction();
   if(!closing)state.leaderAcademicFocus=next;
   state.leaderSection='follow-up';
   render();
   const target=root.querySelector(closing?
    '[data-leader-academic-focus="'+next+'"]':'#leader-academic-results');
   if(!closing)target?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   target?.focus?.({preventScroll:true});
   return;
  }
  const mapBandFilter=e.target.closest('[data-leader-map-band]');
  if(mapBandFilter&&state.leaderAcademicFocus==='map'){
   const band=mapBandFilter.dataset.leaderMapBand;
   if(!['both','low','low-average'].includes(band))return;
   state.leaderMapBand=band;state.leaderAcademicExpanded=false;
   render();
   root.querySelector('[data-leader-map-band="'+band+'"]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-leader-academic-close]')){
   const previous=state.leaderAcademicFocus;
   resetLeaderAcademicAction();render();
   root.querySelector('[data-leader-academic-focus="'+previous+'"]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-leader-academic-multiple]')){
   state.leaderAcademicMultiple=!state.leaderAcademicMultiple;state.leaderAcademicExpanded=false;
   render();root.querySelector('[data-leader-academic-multiple]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-leader-academic-expand]')){
   state.leaderAcademicExpanded=!state.leaderAcademicExpanded;
   render();root.querySelector('[data-leader-academic-expand]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-leader-attendance-focus]')){
   state.leaderSection='follow-up';
   state.leaderReviewFilter=state.division==='Secondary'?'attendance':'all';
   state.leaderReviewExpanded=false;render();
   root.querySelector('#leader-review')?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   return;
  }
  const reviewFilter=e.target.closest('[data-leader-review-filter]');
  if(reviewFilter){
   const requested=reviewFilter.dataset.leaderReviewFilter;
   const allowed=state.division==='Elementary'?['all']:['all','academic2','academic3','attendance'];
   if(!allowed.includes(requested))return;
   state.leaderReviewFilter=requested;state.leaderReviewExpanded=false;
   render();
   root.querySelector('[data-leader-review-filter="'+requested+'"]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-leader-review-expand]')){
   state.leaderReviewExpanded=!state.leaderReviewExpanded;render();return;
  }
  const usBand=e.target.closest('[data-leader-screener-band]');
  if(usBand){
   state.leaderScreenerBand=usBand.dataset.leaderScreenerBand;
   state.leaderScreenerExpanded=false;render();
   root.querySelector('[data-leader-screener-band="'+state.leaderScreenerBand+'"]')?.focus?.({preventScroll:true});
   return;
  }
  if(e.target.closest('[data-leader-screener-expand]')){
   state.leaderScreenerExpanded=!state.leaderScreenerExpanded;render();
   root.querySelector('[data-leader-screener-expand]')?.focus?.({preventScroll:true});return;
  }
  const usStudent=e.target.closest('[data-leader-screener-student]');
  if(usStudent){
   const chosen=DATA.userIndex.get(usStudent.dataset.leaderScreenerStudent);
   if(!chosen||!leaderDirectoryScope().some(s=>s.id===chosen.id))return;
   leaderReturnContext={studentId:chosen.id,containerId:'leader-universal-screener',
    label:'Universal Screener',scrollY:Math.max(0,globalThis.window?.scrollY||0),
    section:state.leaderSection};
   if(state.division==='All'){state.division=chosen.division;state.grade='All';state.classId=''}
   state.leaderStudentId=chosen.id;render();globalThis.window?.scrollTo?.(0,0);return;
  }
  const learner=e.target.closest('[data-leader-student]');
  if(learner){
   const chosen=DATA.userIndex.get(learner.dataset.leaderStudent);
   if(!chosen||state.division==='All'||chosen.division!==state.division||
      (state.grade!=='All'&&chosen.grade!==state.grade)||
      (state.classId&&chosen.classId!==state.classId))return;
   const origins=[
    ['map-strand-cohort','MAP Strand Journeys'],['map-journey-students','MAP Journeys'],['leader-academic-results','Academic Follow-up'],
    ['leader-review','Attendance and learner review'],
    ['leader-experience-review','Student Experience'],
    ['leader-report-followup','Academic Trends'],['leader-map-review','Academic Trends']
   ];
   const origin=origins.find(([id])=>learner.closest?.('#'+id));
   leaderReturnContext={
    studentId:chosen.id,containerId:origin?.[0]||'leader-daily-priorities',
    label:origin?.[1]||'division review',
    scrollY:Math.max(0,globalThis.window?.scrollY||0),
    section:state.leaderSection
   };
   state.leaderStudentId=chosen.id;
   render();globalThis.window?.scrollTo?.(0,0);return;
  }
  if(e.target.closest('[data-leader-back]')){
   const origin=leaderReturnContext;
   state.leaderStudentId='';render();
   const restore=()=>{
    const scope=origin?.containerId?root.querySelector('#'+origin.containerId):root;
    const action=scope?.querySelector?.('[data-explorer-student="'+origin?.studentId+'"]')||
     scope?.querySelector?.('[data-leader-student="'+origin?.studentId+'"]')||
     scope?.querySelector?.('[data-leader-directory-student="'+origin?.studentId+'"]');
    action?.focus?.({preventScroll:true});
    globalThis.window?.scrollTo?.(0,origin?.scrollY||0);
    if(!action)root.querySelector('[data-leader-focus="'+(origin?.section||state.leaderSection)+'"]')
     ?.focus?.({preventScroll:true});
   };
   if(typeof globalThis.window?.requestAnimationFrame==='function')
    globalThis.window.requestAnimationFrame(restore);
   else restore();
   return;
  }
  const jump=e.target.closest('[data-leader-jump]');
  if(jump){
   const id=jump.dataset.leaderJump;
   const section=leaderSectionForTarget(id);
   if(!section)return;
   if(state.leaderSection!==section){state.leaderSection=section;render();}
   const el=root.querySelector('#'+id);
   const panel=el?.closest?.('details.leader-detail');
   if(panel)panel.open=true;
   if(el?.tagName==='DETAILS')el.open=true;
   el?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
   return;
  }
 }
 const facultyLow=e.target.closest('[data-faculty-low-filter]');
 if(facultyLow&&state.role==='faculty'){
  const requested=facultyLow.dataset.facultyLowFilter;
  state.facultyGradeFilter=requested==='2'||requested==='3'?requested:'all';
  render();
  root.querySelector('[data-faculty-low-filter="'+state.facultyGradeFilter+'"]')?.focus({preventScroll:true});
  return;
 }
 const leaderThreshold=e.target.closest('[data-leader-report-threshold]');
 if(leaderThreshold&&state.role==='leader'){
  state.leaderReportThreshold=leaderThreshold.dataset.leaderReportThreshold==='2'?2:3;
  state.leaderReportExpanded=false;
  render();
  root.querySelector('[data-leader-report-threshold="'+state.leaderReportThreshold+'"]')?.focus({preventScroll:true});
  return;
 }
 if(e.target.closest('[data-leader-report-multiple]')&&state.role==='leader'){state.leaderReportMultiple=!state.leaderReportMultiple;state.leaderReportExpanded=false;render();return;}
 if(e.target.closest('[data-leader-report-expand]')&&state.role==='leader'){state.leaderReportExpanded=!state.leaderReportExpanded;render();return;}
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
 if(role.dataset.role==='leader'){
  state.division='All';state.grade='All';state.leaderStudentId='';
  state.leaderReviewFilter='all';state.leaderReviewExpanded=false;
  resetLeaderAcademicAction();resetMapJourney();
 }
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
   root.querySelector('.board-trend-inspector')?.scrollIntoView?.({block:'nearest',behavior:scrollMotion()});
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
   root.querySelector('.board-dp-inspector')?.scrollIntoView?.({block:'nearest',behavior:scrollMotion()});
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
  state.boardView=['overview','explore','dp','climate'].includes(boardView.dataset.boardView)?
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
  if(target.startsWith('subject:'))root.querySelector('#board-dp-subjects')?.scrollIntoView?.({block:'start',behavior:scrollMotion()});
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
  if(allowed.has(id))root.querySelector('#'+id)?.scrollIntoView?.({behavior:scrollMotion(),block:'start'});
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
 const ex=e.target.closest?.('[data-explorer-filter]');
 if(ex&&state.role==='leader'&&state.leaderExplorerOpen){
  const field=ex.dataset.explorerFilter;if(!Object.hasOwn(EXPLORER_DEFAULTS,field))return;
  const f=explorerFilters();f[field]=ex.value;
  if(field==='division'){f.grade='All';f.classId='';f.teacher='all';f.subject='all';f.strand=''}
  if(field==='grade'){f.classId='';f.teacher='all';f.subject='all';f.strand=''}
  if(field==='teacher'||field==='classId'||field==='mapTest')f.strand='';
  render();root.querySelector('[data-explorer-filter="'+field+'"]')?.focus?.({preventScroll:true});return;
 }
 const directoryChoice=e.target.closest?.('[data-leader-directory-filter]');
 if(directoryChoice&&state.role==='leader'){
  const field=directoryChoice.dataset.leaderDirectoryFilter;
  const value=directoryChoice.value;
  if(field==='division'){
   state.leaderDirectoryDivision=['All','Elementary','Secondary'].includes(value)?value:'All';
   state.leaderDirectoryGrade='All';
  }else if(field==='grade'){
   const available=leaderSupportDirectoryModel(leaderDirectoryScope(),{
    ...leaderDirectoryFilters(),grade:'All'}).grades;
   state.leaderDirectoryGrade=value==='All'||available.includes(value)?value:'All';
  }else if(field==='status'){
   state.leaderDirectoryStatus=SUPPORT_STATUS_FILTERS.some(([id])=>id===value)?value:'has-support';
  }else return;
  state.leaderDirectoryExpanded=false;render();
  root.querySelector('[data-leader-directory-filter="'+field+'"]')?.focus?.({preventScroll:true});return;
 }
 const supportSelect=e.target.closest?.('[data-faculty-support-filter]');
 if(supportSelect&&state.role==='faculty'){
  const requested=supportSelect.value;
  state.facultySupportFilter=SUPPORT_STATUS_FILTERS.some(([id])=>id===requested)?requested:'all';
  render();root.querySelector('[data-faculty-support-filter]')?.focus?.({preventScroll:true});return;
 }
 const strandProfileGoal=e.target.closest('[data-map-strand-profile-goal]');
 if(strandProfileGoal&&['leader','faculty','student'].includes(state.role)){
  state.strandProfileGoal=strandProfileGoal.value;render();
  root.querySelector('[data-map-strand-profile-goal]')?.focus?.({preventScroll:true});return;
 }
 const strandJourneyChoice=e.target.closest('[data-map-strand-journey-start],[data-map-strand-journey-end]');
 if(strandJourneyChoice&&['leader','faculty'].includes(state.role)){
  if(strandJourneyChoice.hasAttribute('data-map-strand-journey-start'))
   state.strandJourneyStart=strandJourneyChoice.value;
  else state.strandJourneyEnd=strandJourneyChoice.value;
  state.strandJourneyExpanded=false;render();
  root.querySelector(strandJourneyChoice.hasAttribute('data-map-strand-journey-start')?
   '[data-map-strand-journey-start]':'[data-map-strand-journey-end]')?.focus?.({preventScroll:true});return;
 }
 const strandSelect=e.target.closest('[data-map-strand-filter]');
 if(strandSelect&&['leader','faculty'].includes(state.role)){
  const filter=strandSelect.dataset.mapStrandFilter;
  if(filter==='subject'&&STRAND_SUBJECTS.includes(strandSelect.value)){
   state.strandSubject=strandSelect.value;state.strandGoal='';state.strandGrade='All';
   state.strandJourneyStart='auto';state.strandJourneyEnd='auto';
  }else if(filter==='window'){state.strandWindow=strandSelect.value;state.strandGoal='';
  }else if(filter==='grade'){state.strandGrade=strandSelect.value;state.strandGoal='';
  }else if(filter==='band'){state.strandBand=strandSelect.value;
  }else if(filter==='goal'){state.strandGoal=strandSelect.value;}
  if(filter==='grade'||filter==='goal')state.strandJourneyExpanded=false;
  state.strandExpanded=false;render();
  root.querySelector('[data-map-strand-filter="'+filter+'"]')?.focus?.({preventScroll:true});return;
 }
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
 if(state.role==='leader'){
  const usGrade=e.target.closest('[data-leader-screener-grade]');
  if(usGrade){state.leaderScreenerGrade=usGrade.value;state.leaderScreenerExpanded=false;render();
   root.querySelector('[data-leader-screener-grade]')?.focus?.({preventScroll:true});return}
  const journeyChange=e.target.closest('[data-map-journey-subject],[data-map-journey-starting-window],'+
   '[data-map-journey-comparison-window],[data-map-journey-starting-band],[data-map-journey-current-band]');
  if(journeyChange){
   const data=journeyChange.dataset,falls=JOURNEY_FALL_WINDOWS.map(x=>x.key);
   if('mapJourneySubject' in data&&MAP_RIT_SUBJECTS.includes(journeyChange.value))
    state.journeySubject=journeyChange.value;
   if('mapJourneyStartingWindow' in data&&falls.includes(journeyChange.value))
    state.journeyStart=journeyChange.value;
   if('mapJourneyComparisonWindow' in data&&falls.includes(journeyChange.value))
    state.journeyEnd=journeyChange.value;
   if('mapJourneyStartingBand' in data&&JOURNEY_START_BANDS.includes(journeyChange.value))
    state.journeyStartingBand=journeyChange.value;
   if('mapJourneyCurrentBand' in data&&JOURNEY_END_BANDS.includes(journeyChange.value))
    state.journeyEndingBand=journeyChange.value;
   const start=state.journeyStart==='auto'?(state.division==='Elementary'?'F24':'F22'):state.journeyStart;
   if(falls.indexOf(start)>=falls.indexOf(state.journeyEnd)){
    if('mapJourneyComparisonWindow' in data)state.journeyStart=falls[Math.max(0,falls.indexOf(state.journeyEnd)-1)];
    else state.journeyEnd='F26';
   }
   state.journeyExpanded=false;state.journeyPreset='custom';render();
   const key=Object.keys(data).find(x=>x.startsWith('mapJourney'));
   const attr=key?.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());
   root.querySelector('[data-'+attr+']')?.focus?.({preventScroll:true});
   return;
  }
  const academicGrade=e.target.closest('[data-leader-academic-grade]');
  const academicSubject=e.target.closest('[data-leader-academic-subject]');
  if(academicGrade||academicSubject){
   if(academicGrade)state.leaderAcademicGrade=academicGrade.value;
   if(academicSubject)state.leaderAcademicSubject=academicSubject.value;
   state.leaderAcademicExpanded=false;render();
   root.querySelector(academicGrade?'[data-leader-academic-grade]':
    '[data-leader-academic-subject]')?.focus?.({preventScroll:true});
   return;
  }
 }
 const el=e.target.closest('[data-select]');if(!el)return;const v=el.value;
 if(el.dataset.select==='teacher'){
  state.teacher=v;recallFaculty();state.facultyGradeFilter='all';
  state.studentId='';state.query='';state.facultySupportFilter='all';state.details=false;state.academicReportYear='';
  state.studentReportsOpen=false;state.studentWellbeingOpen=false;
 }
 if(el.dataset.select==='class'){
  state.classId=v;state.studentId='';state.query='';state.details=false;state.facultyGradeFilter='all';state.facultySupportFilter='all';
  state.academicReportYear='';
  if(!academicModesFor(DATA.classIndex.get(v)?.grade).includes(state.academicMode))
   state.academicMode='report';
  state.classEvidence=normalizeEvidenceMode(DATA.classIndex.get(v)?.grade,state.classEvidence);
  state.classCompare=normalizeComparison(DATA.classIndex.get(v)?.grade,state.classEvidence,state.classCompare);
  rememberFaculty();
 }
 if(el.dataset.select==='division'){
  if(!['All','Elementary','Secondary'].includes(v))return;
  state.division=v;state.grade='All';state.classId='';state.details=false;
  state.leaderStudentId='';state.leaderReviewFilter='all';state.leaderReviewExpanded=false;
  state.leaderSection='follow-up';state.leaderSaveNotice='';
  resetLeaderAcademicAction();resetMapJourney();
 }
 if(el.dataset.select==='grade'){
  if(v!=='All'&&!GRADES.includes(v))return;
  if(state.division==='All'&&v!=='All')state.division=gradeNumber(v)<=5?'Elementary':'Secondary';
  state.grade=v;state.classId='';state.details=false;state.leaderStudentId='';
  state.leaderReviewFilter='all';state.leaderReviewExpanded=false;resetLeaderAcademicAction();resetMapJourney();
 }
 if(el.dataset.select==='leader-class'){
  const valid=leaderAdvisoryClasses(DATA.classes,state.division,state.grade);
  if(v&&!valid.some(c=>c.id===v))return;
  state.classId=v;state.details=false;state.leaderStudentId='';
  state.leaderReviewFilter='all';state.leaderReviewExpanded=false;resetLeaderAcademicAction();resetMapJourney();
 }
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
  if(leaderPanel.dataset.leaderPanel==='report')state.leaderReportOpen=leaderPanel.open;
  return;
 }
 const panel=e.target.closest?.('details[data-student-panel]');
 if(!panel||state.role!=='student')return;
 if(panel.dataset.studentPanel==='reports')state.studentReportsOpen=panel.open;
 if(panel.dataset.studentPanel==='wellbeing')state.studentWellbeingOpen=panel.open;
},true);
root.addEventListener('input',e=>{
 if(e.target.matches?.('[data-explorer-search]')&&state.role==='leader'&&state.leaderExplorerOpen){
  const pos=e.target.selectionStart;explorerFilters().query=e.target.value;render();
  const field=root.querySelector('[data-explorer-search]');field?.focus?.({preventScroll:true});if(Number.isInteger(pos))field?.setSelectionRange?.(pos,pos);return;
 }
 if(e.target.matches?.('[data-leader-directory-search]')&&state.role==='leader'){
  const p=e.target.selectionStart;
  state.leaderDirectoryQuery=e.target.value;
  state.leaderDirectoryExpanded=false;render();
  const field=root.querySelector('[data-leader-directory-search]');
  field?.focus?.({preventScroll:true});
  if(Number.isInteger(p))field?.setSelectionRange?.(p,p);return;
 }
 if(e.target.matches?.('[data-leader-report-query]')&&state.role==='leader'){
  const p=e.target.selectionStart;state.leaderReportQuery=e.target.value;state.leaderReportExpanded=false;render();
  const field=root.querySelector('[data-leader-report-query]');field?.focus({preventScroll:true});if(Number.isInteger(p))field?.setSelectionRange(p,p);return;
 }
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
   if(id==='leader'){
    state.division='All';state.grade='All';state.leaderStudentId='';
    state.leaderReviewFilter='all';state.leaderReviewExpanded=false;
   }
  state.query='';state.academicReportYear='';
  if(id==='faculty')recallFaculty();
  if(id==='student'){state.studentReportsOpen=false;state.studentWellbeingOpen=false}
  if(id==='sss'){state.sssStudentId='';state.sssAcademicOpen=false;state.sssPanel='summary'}
  render();globalThis.window?.scrollTo?.(0,0)
 }
})}catch{}
render();
