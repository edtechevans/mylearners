/** Visible academic evidence for the My Learners fictional Faculty / Student demo.
 * All figures come from one deterministic source; no genuine student records.
 */
import {academicModesFor,academicFor,latestAcademic,academicCoverage,ACADEMIC_MODES} from './academic-journey-data.mjs';

const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const modeMeta=id=>ACADEMIC_MODES.find(m=>m.id===id)||ACADEMIC_MODES[0];
const formatOutcome=(record,mode,subject='Mathematics')=>{
 const item=latestAcademic(record,mode,subject);
 return item?item.value:'—';
};
const renderReportOptions=(reports,chosen)=>{
 const selected=reports.some(report=>report.year===chosen)?chosen:reports[0]?.year;
 return '<div class="academic-report-years" role="group" aria-label="Select an issued school report">'+
 reports.map(report=>'<button type="button" data-academic-report-year="'+esc(report.year)+'"'+
 ' class="'+(report.year===selected?'active':'')+'" aria-pressed="'+(report.year===selected)+'"'+
 ' aria-label="Report card '+esc(report.year)+', '+esc(report.grade)+'">'+
 '<strong>'+esc(report.year)+'</strong><span>'+esc(report.grade)+'</span></button>').join('')+
 '</div>';
};
const bandClass=(value,scale)=>{
 if(scale!=='descriptors')return 'scale-number';
 return value==='Extending'?'scale-extended':value==='Applying'?'scale-applying':
  value==='Developing'?'scale-developing':'scale-emerging';
};
export function classAcademicCell(student,records,mode='report',subject='Mathematics'){
 const item=latestAcademic(academicFor(records,student.id),mode,subject);
 if(!item)return '<span class="academic-roster-empty" title="No result available">—</span>';
 const value=item.value;
 const valueClass=mode==='report'?' '+bandClass(value,item.scale):'';
 return '<span class="academic-roster-value academic-roster-'+esc(mode)+valueClass+'"'+
 ' title="'+esc(modeMeta(mode).label+' · '+item.label+(mode==='report'?' · '+subject:'')+
 ': '+value)+'">'+esc(value)+'</span>';
}
export function renderClassAcademicPanel(students,records,mode='report',subject='Mathematics',options={}){
 const grade=students[0]?.grade||'';
 const allowed=academicModesFor(grade);
 const selectedMode=allowed.includes(mode)?mode:'report';
 const reportSubjects=academicFor(records,students[0]?.id).reports?.[0]?.subjects||[];
 const selectedSubject=reportSubjects.some(s=>s.subject===subject)?subject:reportSubjects[0]?.subject||'';
 const coverage=academicCoverage(students,records,selectedMode,selectedSubject);
 const recent=academicFor(records,students[0]?.id);
 const sample=latestAcademic(recent,selectedMode,selectedSubject);
 const latestDate=selectedMode==='report'?
  (recent.reports?.[0]?recent.reports[0].year+' · '+recent.reports[0].grade+' (last issued)':'no issued report'):
  sample?.label||'no recorded check-in';
 const note=selectedMode==='report'?
  'Choose a subject to see each learner’s most recent issued report result. Open a learner for up to three report years.':
  selectedMode==='ixl'?
  'IXL Mathematics diagnostic levels—not SmartScores, grades or percentages. Open a learner to see recent check-ins.':
  selectedMode==='core'?
  'Illustrative 50-item decoding check; not an official Core Phonics Survey total. Open a learner for context.':
  'F&P letters refer to text complexity, not a grade, percentile or overall reading ability.';
 const distribution=selectedMode==='report'?
  (selectedSubject?renderReportDistribution(students,records,selectedSubject):
   '<p class="academic-no-data">No completed reports yet for this class.</p>'):'';
 if(options.compact){
  const controls=allowed.map(id=>'<button type="button" data-academic-mode="'+id+
    '" aria-pressed="'+(selectedMode===id)+'" class="'+(selectedMode===id?'active':'')+
    ' academic-mode-'+id+'">'+esc(modeMeta(id).short)+'</button>').join('');
  return '<section class="academic-class-panel academic-class-compact" aria-label="Choose the academic evidence in the class roster">'+
   '<div class="academic-compact-heading"><div><span class="academic-eyebrow">ACADEMIC EVIDENCE</span>'+
   '<h3>Show in my roster</h3></div>'+
   '<span class="academic-compact-freshness">'+esc(latestDate)+'</span></div>'+
   '<div class="academic-compact-actions"><div class="academic-mode-tabs" role="group" aria-label="Choose academic result">'+
   controls+'</div>'+
   (selectedMode==='report'&&reportSubjects.length?
    '<label class="academic-subject-picker">Subject <select data-academic-subject aria-label="Report card subject">'+
    reportSubjects.map(entry=>'<option value="'+esc(entry.subject)+'"'+
    (entry.subject===selectedSubject?' selected':'')+'>'+esc(entry.subject)+'</option>').join('')+'</select></label>':'')+
   '</div>'+
   '<details class="academic-class-breakdown"><summary>Class results breakdown <span>('+coverage.available+
   ' of '+coverage.eligible+' learners)</span></summary>'+
   (distribution||'<p class="academic-guidance">'+esc(note)+'</p>')+'</details>'+
   '<p class="academic-compact-footnote">'+esc(note)+'</p></section>';
 }
 return '<section class="academic-class-panel" aria-label="Class academic snapshots">'+
 '<div class="academic-class-heading"><div><span class="academic-eyebrow">SUBJECT RESULTS · CLASS VIEW</span>'+
 '<h2>Academic snapshot</h2><p>Choose the evidence you need. Student-level detail stays one click away.</p></div>'+
 '<span class="academic-demo-mark">Fictional examples</span></div>'+
 '<div class="academic-mode-tabs" role="group" aria-label="Select academic evidence displayed in roster">'+
 allowed.map(id=>'<button type="button" data-academic-mode="'+id+'" aria-pressed="'+(selectedMode===id)+
 '" class="'+(selectedMode===id?'active':'')+' academic-mode-'+id+'">'+esc(modeMeta(id).short)+'</button>').join('')+
 '</div>'+
 '<div class="academic-class-context"><div><span class="academic-context-eyebrow">'+
 esc(modeMeta(selectedMode).label)+' · '+esc(latestDate)+'</span>'+
 '<strong>'+coverage.available+' <small>of '+coverage.eligible+' learners with a result</small></strong></div>'+
 (selectedMode==='report'&&reportSubjects.length?
 '<label class="academic-subject-picker">Subject <select data-academic-subject aria-label="Report card subject">'+
 reportSubjects.map(entry=>'<option value="'+esc(entry.subject)+'"'+
 (entry.subject===selectedSubject?' selected':'')+'>'+esc(entry.subject)+'</option>').join('')+
 '</select></label>':'')+'</div>'+
 (distribution||'')+
 '<p class="academic-guidance">'+esc(note)+'</p></section>';
}
function renderReportDistribution(students,records,subject){
 const count=new Map();
 for(const student of students){
  const item=latestAcademic(academicFor(records,student.id),'report',subject);
  if(item)count.set(item.value,(count.get(item.value)||0)+1);
 }
 if(!count.size)return '<p class="academic-no-data">No completed reports yet for this class.</p>';
 const keys=['Emerging','Developing','Applying','Extending','1','2','3','4','5','6','7']
  .filter(k=>count.has(k));
 const total=keys.reduce((n,key)=>n+count.get(key),0);
 return '<div class="academic-distribution" aria-label="Number of learners by most recent report outcome">'+
 '<span class="academic-distribution-label">Class outcomes · '+esc(subject)+'</span>'+
 '<div class="academic-distribution-track" role="img" aria-label="'+
 esc(keys.map(key=>key+': '+count.get(key)).join('; '))+'">'+
 keys.map(key=>'<span class="academic-distribution-segment '+bandClass(key,keys[0].length>1?'descriptors':'1–7')+
 '" style="width:'+(count.get(key)/total*100).toFixed(2)+'%"></span>').join('')+'</div>'+
 '<div class="academic-distribution-key">'+keys.map(key=>
 '<span><i class="'+bandClass(key,keys[0].length>1?'descriptors':'1–7')+'"></i>'+esc(key)+
 ' <b>'+count.get(key)+'</b></span>').join('')+'</div></div>';
}
function showProgressTimeline(items,kind){
 return '<div class="academic-journey-timeline" role="list" aria-label="Recent fictional check-ins">'+
 items.map((item,i)=>{
  const value=kind==='ixl'?item.level:kind==='core'?item.correct+'/50':'Level '+item.level;
  return '<div class="academic-journey-moment'+(i===items.length-1?' is-latest':'')+'" role="listitem">'+
   '<span class="academic-journey-node" aria-hidden="true"></span>'+
   '<small>'+esc(item.date)+'</small><strong>'+esc(value)+'</strong></div>';
 }).join('')+'</div>';
}
function evidenceCard(record,kind,studentRole=false){
 const items=record[kind]||[];
 if(!items.length)return '';
 const recent=items.at(-1),prev=items.at(-2);
 const definitions={
  ixl:{title:'IXL Mathematics',eyebrow:'MATHS DIAGNOSTIC · G1–10',value:String(recent.level),
   unit:'diagnostic level',help:'A fictional IXL Mathematics diagnostic level (0–1300), not a SmartScore or a percentage. A difference between check-ins is not a report-card grade.'},
  core:{title:'Core Phonics',eyebrow:'DECODING SKILLS · K–G5',value:recent.correct+' / '+recent.assessed,
   unit:'items demonstrated',help:'A fictional 50-item classroom decoding check, shown to illustrate how Core Phonics evidence could appear. Not an official CORE Phonics Survey total or norm.'},
  fp:{title:'F&P Reading',eyebrow:'TEXT LEVEL · K–G5',value:recent.level,
   unit:'text level',help:'A fictional Fountas & Pinnell reading text level (A–Z+). Letters describe text complexity and do not measure the whole reader or equal a grade.'}
 };
 const meta=definitions[kind];
 const delta=kind==='ixl'&&prev?'Change since previous check-in: '+(recent.level-prev.level>0?'+':'')+(recent.level-prev.level)+' level points':
  kind==='core'&&prev?'Change since previous check-in: '+(recent.correct-prev.correct>0?'+':'')+(recent.correct-prev.correct)+' items':
  'Use other reading evidence alongside this snapshot';
 return '<article class="academic-evidence-card academic-evidence-'+kind+'">'+
 '<div class="academic-evidence-top"><span class="academic-evidence-symbol" aria-hidden="true">'+
 (kind==='ixl'?'∑':kind==='core'?'Aa':'↗')+'</span>'+
 '<div><span class="academic-eyebrow">'+esc(meta.eyebrow)+'</span><h3>'+esc(meta.title)+'</h3></div></div>'+
 '<div class="academic-evidence-primary"><strong>'+esc(meta.value)+'</strong><span>'+esc(meta.unit)+'</span></div>'+
 '<p class="academic-evidence-delta">'+esc(delta)+'</p>'+
 showProgressTimeline(items,kind)+
 '<details class="academic-evidence-help"><summary>What does this mean?</summary><p>'+esc(meta.help)+'</p></details></article>';
}
export function renderAcademicProfile(student,records,studentRole=false,selectedYear=''){
 const record=academicFor(records,student.id);
 const reports=record.reports||[];
 const year=reports.find(r=>r.year===selectedYear)||reports[0]||null;
 const available=['ixl','core','fp'].filter(kind=>record[kind]?.length);
 const title=studentRole?'My school reports':'Report card grades';
 const evidenceHeading=studentRole?'My maths and reading journey':'Maths and reading evidence';
 const sectionLabel=studentRole?'MY ACHIEVEMENT & PROGRESS':'ACADEMIC EVIDENCE';
 const selected=year?.subjects||[];
 return '<section class="academic-profile" aria-label="Student academic report cards and skills evidence">'+
 '<header class="academic-profile-heading"><div><span class="academic-eyebrow">'+sectionLabel+'</span>'+
 '<h2>'+title+'</h2><p>Recent issued report cards, organised by school year and subject.</p></div>'+
 '<span class="academic-demo-mark">Fictional demonstration</span></header>'+
 (reports.length?
  renderReportOptions(reports,year?.year)+
  '<div class="academic-report-meta"><strong>'+esc(year.year)+'</strong><span>'+esc(year.grade)+
  ' · '+esc(year.framework)+'</span><span>Final issued report · demonstration</span></div>'+
  '<div class="academic-subject-grid">'+selected.map(item=>
    '<div class="academic-subject-result"><span>'+esc(item.subject)+'</span>'+
    '<strong class="'+bandClass(item.value,item.scale)+'">'+esc(item.value)+'</strong></div>').join('')+'</div>'+
  '<p class="academic-report-note">'+(year.scale==='descriptors'?
  'Learning descriptors indicate a stage of development, not a percentage.':
  'Subject outcomes use a 1–7 scale within this programme.')+
  ' Reporting frameworks may change as students move between school divisions. Scores and descriptors must not be averaged or compared directly across programmes.</p>':
  '<div class="academic-no-data"><strong>No issued reports yet.</strong> Completed report cards will appear here when available. Current-year grades are not presented as final results.</div>')+
 (available.length?'<section class="academic-skill-section"><div><span class="academic-eyebrow">RECENT CHECK-INS</span>'+
 '<h2>'+evidenceHeading+'</h2><p>Separate measures that help us notice progress—not a combined score.</p></div>'+
 '<div class="academic-evidence-grid">'+available.map(kind=>evidenceCard(record,kind,studentRole)).join('')+'</div></section>':
 '<p class="academic-skill-none">IXL Mathematics diagnostic: Grades 1–10. Core Phonics and F&P reading levels: Kindergarten–Grade 5. No other measures are shown outside their eligible grades.</p>')+
 '</section>';
}
