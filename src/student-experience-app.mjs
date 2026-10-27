import {generateDemoData,attendanceSummary,gradeNumber,GRADES} from './data.mjs';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from './faculty-demo.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {portrait} from './portraits.mjs';
import {createExperienceRecords,experienceFor,summarizeExperience,experienceChange,experienceQuestionSummary,EXPERIENCE_WINDOWS,EXPERIENCE_METRICS,METRIC_IDS,experienceEligible} from './experience-data.mjs';
import {esc} from './v2-ui.mjs';
import {renderBoard} from './board-map-view.mjs';
import {renderTrendPointDetails} from './board-map-overview.mjs';
import {renderDPPointDetails} from './board-dp-view.mjs';
import {DP_RECORDS} from './board-dp-data.mjs';
import {boardWindowFor,BOARD_DATA} from './board-map-data.mjs';
import {parseBoardHash,boardShareUrl} from './board-map-links.mjs';
const DATA=applyFacultyDemo(generateDemoData()),RECORDS=createExperienceRecords(DATA.students);
const root=document.getElementById('app');
const saved=(k,d)=>{try{return sessionStorage.getItem(k)||d}catch{return d}};
const ROLE_IDS=['faculty','student','leader','board'];
const initialHash=String(globalThis.location?.hash||'').replace(/^#\//,'').split('?')[0];
const initialRole=ROLE_IDS.includes(initialHash)?initialHash:saved('my-role','faculty');
const state={role:ROLE_IDS.includes(initialRole)?initialRole:'faculty',
 teacher:saved('my-teacher',DEFAULT_TEACHER_ID),
 division:'All',grade:'All',classId:'',studentId:'',query:'',metric:'engagement',window:'F26',details:false,checkin:false,
 boardWindow:saved('my-board-window-v2','fall2026'),boardSubject:saved('my-board-subject','math'),
 boardDivision:saved('my-board-division','all'),boardGrade:saved('my-board-grade','all'),
 boardView:'overview',boardTrendTerm:'fall',boardTrendFocus:'all',boardTrendRange:'recent',boardOverviewChart:'map',
 boardMapDetailsOpen:false,boardMapCompareSeasons:false,boardMapGrowthOpen:false,boardPresentation:false,
 boardDpMetric:'average',
 boardDpYear:String(DP_RECORDS.at(-1).end),boardDpRange:'all'};
const boardDeepLink=parseBoardHash(globalThis.location?.hash);
if(boardDeepLink&&state.role==='board')Object.assign(state,boardDeepLink);
const safe=(v)=>esc(v??'');
const teacher=()=>DATA.teachers.find(t=>t.id===state.teacher)||DATA.teachers.find(t=>t.id===DEFAULT_TEACHER_ID);
const ownClasses=()=>DATA.classes.filter(c=>teacher().classIds.includes(c.id));
const ownStudents=()=>DATA.students.filter(s=>teacher().classIds.includes(s.classId));
const activeClass=()=>ownClasses().find(c=>c.id===state.classId)||ownClasses()[0];
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
 return '<article class="metric"><div class="metric-top"><span class="eyebrow">'+safe(EXPERIENCE_METRICS[id].label)+' index</span><span class="tiny">Fictional '+safe(source)+' check-in</span></div>'+
 '<div class="metric-value">'+fmt(sum.value)+(sum.value===null?'':'<span>/100</span>')+'</div>'+
 '<div class="meter"><i style="width:'+(sum.value??0)+'%;background:var(--'+(id==='engagement'?'teal':'violet')+')"></i></div>'+
 '<p>'+safe(EXPERIENCE_METRICS[id].description)+'</p><div class="metric-foot"><span>'+sum.n+' of '+sum.eligible+' responses</span><span>'+safe(comparison)+'</span></div>'+
 (sum.value===null?'':btn('explain:'+scope+':'+id,'How is this calculated?','quiet'))+'</article>';
}
function info(){return '<div class="notice"><strong>Demonstration only.</strong> All learners, assessments, survey-style check-ins and class assignments are fictional. Actual confidential climate-survey responses are not linked to students. The indices are exploratory AISG-created descriptions, not validated scores or labels.</div>'}
function header(){return '<header class="top"><div class="brand"><img src="assets/aisg-logo.webp" alt="AISG logo"><div><strong>My Learners</strong><span>Understand the whole learner</span></div></div><div class="roles"><span class="roles-label">VIEW</span>'+ROLE_IDS.map(r=>'<button data-role="'+r+'" aria-pressed="'+(state.role===r)+'" class="'+(state.role===r?'selected':'')+'">'+r[0].toUpperCase()+r.slice(1)+'</button>').join('')+'</div></header>'}
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
 '<p>Three responses are converted into points: <strong>Strongly disagree 0</strong> · <strong>Disagree 33</strong> · <strong>Agree 67</strong> · <strong>Strongly agree 100</strong>. The index is their average, rounded to a whole number. It is <strong>not</strong> a percentage of students agreeing, an achievement score, or a label.</p>'+
 '<div class="explain-number">'+fmt(summary.value)+(summary.value===null?'':'<small>/100</small>')+'</div>'+
 '<div class="explain-items">'+qs.map(q=>'<div><span>'+safe(q.question)+'</span><strong>'+fmt(student?q.points:q.value)+(student?'':'')+(student||q.value!==null?'/100':'')+'</strong>'+
 (student?'<small>My response: '+safe(q.label)+'</small>':'<small>'+fmt(q.favorable)+'% agree or strongly agree · '+q.n+' responses</small>')+'</div>').join('')+'</div>'+
 '<p class="tiny">This is an exploratory AISG-created indicator, not a validated measurement. Use the underlying responses and wider context to understand the experience, never to rank students.</p></section>';
}
function metrics(ss,student,scope='main'){
 if(!eligible(ss).length)return '<p class="not-collected">Student experience indices are not collected for PK–Grade 2 in this demonstration.</p>';
 const detail=METRIC_IDS.find(id=>state.details===scope+':'+id);
 return '<div class="metrics">'+METRIC_IDS.map(id=>metricCard(student?[student]:ss,id,state.window,scope)).join('')+'</div>'+
 (detail?scoreExplanation(detail,ss,student):'');
}
function roster(ss){
 const rows=ss.filter(s=>s.name.toLowerCase().includes(state.query.trim().toLowerCase()));
 const data=rows.map(s=>{
  const e=experienceFor(RECORDS,s.id,'engagement'),b=experienceFor(RECORDS,s.id,'belonging'),
    a=attendanceSummary(DATA.attendance[s.id]),g=latestMapGrowth(DATA.map[s.id]||[]);
  const growth=g.status==='comparable'?(g.actual>=0?'+':'')+g.actual+' RIT':'Not assessed';
  return {s,eng:fmt(e?.value),bel:fmt(b?.value),attendance:fmt(a.rate)+'%',growth,
    tags:demoTagsForStudent(s)};
 });
 return '<section class="roster"><div class="sectionhead"><h2>My students</h2><span class="tiny">'+rows.length+' of '+ss.length+' learners</span></div>'+
 '<div class="tablewrap roster-desktop"><table><thead><tr><th>Learner</th><th>Attendance</th><th>MAP Math growth</th><th>Engagement</th><th>Belonging</th><th>Classroom guidance</th></tr></thead><tbody>'+
 data.map(x=>'<tr><td><button class="student-link" data-student="'+x.s.id+'"><img src="'+portrait(x.s.portraitSeed)+'" alt="">'+safe(x.s.name)+'</button></td><td>'+x.attendance+'</td><td>'+safe(x.growth)+'</td><td>'+x.eng+'</td><td>'+x.bel+'</td><td>'+x.tags.map(t=>pill(t.label)).join(' ')+'</td></tr>').join('')+'</tbody></table></div>'+
 '<div class="roster-mobile">'+data.map(x=>'<button class="roster-item" data-student="'+x.s.id+'" aria-label="Open learner '+safe(x.s.name)+'"><img src="'+portrait(x.s.portraitSeed)+'" alt=""><span class="roster-item-body"><strong>'+safe(x.s.name)+'</strong><span>Attendance '+x.attendance+' · MAP '+safe(x.growth)+'</span>'+(experienceEligible(x.s)?'<span>Engagement '+x.eng+' · Belonging '+x.bel+'</span>':'')+'</span><span class="roster-arrow" aria-hidden="true">›</span></button>').join('')+'</div>'+
 (rows.length?'':'<p class="empty-message">No students match that search.</p>')+
 '<p class="tiny roster-caption">MAP = change in RIT points where a comparable test exists. Experience measures are fictional student-reported check-ins. Select a learner to see more.</p></section>';
}
function learnerProfile(s,studentRole=false){
 if(!s)return '<section class="card">Select a learner to begin.</section>';
 const aa=attendanceSummary(DATA.attendance[s.id]||[]),mg=latestMapGrowth(DATA.map[s.id]||[]),tags=demoTagsForStudent(s);
 const academics=(DATA.assessments[s.id]||[]).filter(x=>x.status==='Published').slice(0,3);
 const profileStart=(studentRole?'':'<div class="row-between"><button class="back" data-action="back">← Back to my class</button></div>');
 const history=studentRole?'<section class="card"><h2>My check-ins over time</h2><div class="trend">'+EXPERIENCE_WINDOWS.map(w=>{
  const e=experienceFor(RECORDS,s.id,'engagement',w.key)?.value;
  const b=experienceFor(RECORDS,s.id,'belonging',w.key)?.value;
  return '<div><span>'+w.label+'</span><strong>Engagement '+fmt(e)+'</strong><strong>Belonging '+fmt(b)+'</strong></div>';
 }).join('')+'</div><p class="tiny">These fictional check-ins describe my experience, not my ability or my grade.</p></section>':'';
 return profileStart+
 '<div class="profile-head"><img src="'+portrait(s.portraitSeed)+'" alt="Fictional portrait"><div><div class="eyebrow">WHOLE LEARNER PROFILE</div><h1>'+safe(s.name)+'</h1><p>'+safe(s.grade)+' · '+safe(s.classId)+' · '+safe(s.campus)+'</p></div></div>'+
 '<div class="kpis profile-kpis">'+kpi('Attendance',fmt(aa.rate)+'%','Recorded through '+safe(DATA.asOf))+kpi('MAP Mathematics growth',mg.status==='comparable'?(mg.actual>=0?'+':'')+mg.actual:'—',mg.status==='comparable'?'RIT points · projected '+fmt(mg.projected):'No comparable test')+kpi('Latest academic outcome',academics[0]?.outcome||'—',safe(academics[0]?.subject||'No published outcome'))+'</div>'+
 '<div class="sectionhead"><h2>'+(studentRole?'How I experience learning':'Student experience')+'</h2><span class="tiny">Fictional Fall 2026 check-ins</span></div>'+metrics([s],s,studentRole?'student':'profile')+history+
 '<div class="two-col"><section class="card"><h2>Academic overview</h2><p class="muted">Latest published outcomes.</p>'+academics.map(a=>'<div class="listrow"><span>'+safe(a.subject)+'</span><strong>'+safe(a.outcome)+'</strong></div>').join('')+'<p class="tiny">MAP achievement (RIT) and growth (change in RIT) are different measures.</p></section>'+
 '<section class="card"><h2>'+(studentRole?'My next step':'Classroom guidance')+'</h2>'+(studentRole?'<p>What could help me feel more connected and engaged in learning?</p><label class="label" for="reflection">My reflection (this browser only)</label><textarea id="reflection" placeholder="One thing that helps me learn is...">'+safe(saved('reflection-'+s.id,''))+'</textarea>'+btn('save-reflection','Save my draft','primary')+'<p class="tiny" id="save-status">A private browser demonstration, not submitted to school.</p>':
 (tags.length?tags.map(t=>'<div class="guide"><strong>'+safe(t.fullName)+'</strong><p>'+safe(t.strategies[0])+'</p></div>').join(''):'<p class="muted">No additional classroom guidance tags in this fictional example.</p>')+'<p class="tiny">Detailed support plans and confidential records are not included in this public demo.</p>')+'</section></div>';
}
function quickStat(label,value,detail,action=''){
 return (action?'<button type="button" data-action="'+safe(action)+'" class="quick-tile quick-score">':'<div class="quick-tile">')+
 '<span>'+safe(label)+'</span><strong>'+fmt(value)+'</strong><small>'+detail+'</small>'+(action?'</button>':'</div>');
}
function faculty(){
 const cs=ownClasses();if(!cs.some(c=>c.id===state.classId))state.classId=cs[0]?.id||'';
 const ss=(activeClass()?.studentIds||[]).map(id=>DATA.userIndex.get(id));
 const selected=ss.find(s=>s.id===state.studentId);
 if(selected)return learnerProfile(selected);
 const meanAttendance=avg(ss.map(s=>attendanceSummary(DATA.attendance[s.id]).rate));
 const gradeHasCheckins=eligible(ss).length>0;
 const score=id=>{
  const sum=summarizeExperience(RECORDS,ss,id);
  return quickStat(EXPERIENCE_METRICS[id].label,fmt(sum.value)+(sum.value===null?'':' / 100'),
   sum.value===null?'No check-in':sum.n+'/'+sum.eligible+' responses · How is this calculated?',
   sum.value===null?'':'explain:faculty:'+id);
 };
 return heading('Your students, in one place.','Select a class or find a learner. Everything else is one click away.')+
 '<div class="toolbar faculty-toolbar"><label>My class '+selector('class',cs.map(c=>[c.id,c.name]),state.classId)+'</label>'+
 '<label class="search-label">Find a student<input data-query placeholder="Search by name..." value="'+safe(state.query)+'" aria-label="Find a student in this class"></label>'+
 '<label>Faculty demo '+selector('teacher',DATA.teachers.map(t=>[t.id,t.name]),state.teacher)+'</label></div>'+
 '<div class="quick-summary">'+quickStat('Students',ss.length,'In this class')+
 quickStat('Attendance',fmt(meanAttendance)+'%','Recorded through 8 Oct 2026')+
 (gradeHasCheckins?score('engagement')+score('belonging'):'<div class="quick-note">Student-reported engagement and belonging indices are not collected for PK–Grade 2 in this demo.</div>')+'</div>'+
 (typeof state.details==='string'&&state.details.startsWith('faculty:')?scoreExplanation(state.details.split(':')[1],ss,null):'')+
 roster(ss)+info();
}
function leader(){
 const grades=GRADES.filter(x=>gradeNumber(x)>=3);
 const divisions=state.division==='All'?['Elementary','Secondary']:[state.division];
 const group=DATA.students.filter(s=>experienceEligible(s)&&divisions.includes(s.division)&&
   (state.grade==='All'||s.grade===state.grade)&&(!state.classId||s.classId===state.classId));
 const options=DATA.classes.filter(c=>divisions.includes(c.division)&&(state.grade==='All'||c.grade===state.grade));
 const selectedClass=options.find(c=>c.id===state.classId);
 const groups=state.classId?[[selectedClass?.name||state.classId,group]]:
  (state.grade==='All'?grades.filter(g=>group.some(s=>s.grade===g)).map(g=>[g,group.filter(s=>s.grade===g)]):
   options.map(c=>[c.name,group.filter(s=>s.classId===c.id)]));
 const splitSchool=state.division==='All'&&state.grade==='All'&&!state.classId;
 const panels=splitSchool?['Elementary','Secondary'].map(div=>{
  const ss=group.filter(s=>s.division===div);
  return '<div class="sectionhead"><h2>'+div+' student experience</h2><span class="tiny">'+(div==='Elementary'?'Grades 3–5':'Grades 6–12')+' · different age-appropriate questions</span></div>'+
   metrics(ss,null,div.toLowerCase());
 }).join(''):metrics(group,null,'leader');
 const trendFor=(ss,label)=>'<section class="card"><h2>'+safe(label)+'</h2><div class="trend">'+EXPERIENCE_WINDOWS.map(w=>{
  const e=summarizeExperience(RECORDS,ss,'engagement',w.key),b=summarizeExperience(RECORDS,ss,'belonging',w.key);
  return '<div><span>'+w.label+'</span><strong>Engagement '+fmt(e.value)+'</strong><strong>Belonging '+fmt(b.value)+'</strong><small>Responses '+e.n+'/'+e.eligible+'</small></div>';
 }).join('')+'</div></section>';
 return heading('Where are experiences improving?','Choose a division or grade to see patterns and changes, with response counts alongside every index.')+
 '<div class="toolbar"><label>Division '+selector('division',[['All','Whole School'],['Elementary','Elementary'],['Secondary','Secondary']],state.division)+'</label>'+
 '<label>Grade '+selector('grade',[['All','All Grades'],...grades.filter(g=>divisions.includes(gradeNumber(g)<=5?'Elementary':'Secondary')).map(g=>[g,g])],state.grade)+'</label>'+
 '<label>Class (fictional) '+selector('leader-class',[['','All classes'],...options.map(c=>[c.id,c.name])],state.classId)+'</label></div>'+
 '<div class="kpis leader-kpis">'+kpi('Students in selected group',group.length,'Grades 3–12 · fictional profiles')+
 kpi('Responses',group.filter(s=>!!experienceFor(RECORDS,s.id,'engagement',state.window)).length,'Of '+group.length+' eligible students')+
 kpi('Survey window',EXPERIENCE_WINDOWS.find(w=>w.key===state.window)?.label||'—','Simulated student check-in')+'</div>'+
 '<div class="sectionhead"><h2>'+ (splitSchool?'Divisional experience':'Student experience')+'</h2><label>Window '+selector('window',EXPERIENCE_WINDOWS.map(w=>[w.key,w.label]),state.window)+'</label></div>'+
 panels+(splitSchool?'<p class="tiny">Elementary and Secondary indices use different questions. They are shown separately rather than combined into one schoolwide score.</p>':'')+
 '<section class="card"><div class="row-between"><h2>Patterns by '+(state.classId?'selected class':state.grade==='All'?'grade':'class')+'</h2><span class="tiny">Scores out of 100 · show response counts</span></div>'+
 '<div class="tablewrap"><table><thead><tr><th>Group</th><th>Students</th><th>Responses</th><th>Engagement</th><th>Belonging</th></tr></thead><tbody>'+
 groups.map(([name,ss])=>{const e=summarizeExperience(RECORDS,ss,'engagement',state.window),b=summarizeExperience(RECORDS,ss,'belonging',state.window);
 return '<tr><td>'+safe(name)+'</td><td>'+ss.length+'</td><td>'+e.n+'/'+e.eligible+'</td><td>'+fmt(e.value)+'</td><td>'+fmt(b.value)+'</td></tr>'}).join('')+
 '</tbody></table></div><p class="tiny">These are patterns in fictional student self-reports, not individual progress or labels. Use other classroom and learning evidence before deciding what to change.</p></section>'+
 (splitSchool?trendFor(group.filter(s=>s.division==='Elementary'),'Elementary · over time')+trendFor(group.filter(s=>s.division==='Secondary'),'Secondary · over time'):trendFor(group,'Over time'))+info();
}
function student(){
 const ss=DATA.students.filter(experienceEligible);
 const chosen=ss.find(s=>s.id===state.studentId)||ss.find(s=>s.id==='DEMO-0721')||ss[0];
 if(!state.studentId)state.studentId=chosen?.id||'';
 return heading('My learning, my story.','Explore my progress, what is going well and what might help.')+
 '<div class="toolbar"><label>Student demo '+selector('student',ss.map(s=>[s.id,s.name+' · '+s.grade]),state.studentId)+'</label></div>'+
 learnerProfile(chosen,true)+info();
}
function render(){
 const content=state.role==='board'?renderBoard(state):state.role==='leader'?leader():state.role==='student'?student():faculty();
 root.classList.toggle('board-presentation-mode',state.role==='board'&&!!state.boardPresentation);
 root.innerHTML=header()+'<main class="container" id="main">'+content+'</main><footer>'+
 (state.role==='board'?'AISG Board · Aggregated MAP and IB Diploma outcomes · No individual student scores published':
 'My Learners demonstration · Learners, assessments and student check-ins fictional')+
 '</footer>';
 if(state.role==='board'&&globalThis.window?.innerWidth<700){
  const useDp=(state.boardView==='dp')||(state.boardView==='overview'&&state.boardOverviewChart==='dp');
  const scroller=root.querySelector?.(useDp?'.board-dp-chart-scroll':'.board-trend-scroller');
  if(scroller)scroller.scrollLeft=scroller.scrollWidth;
 }
 try{sessionStorage.setItem('my-role',state.role);sessionStorage.setItem('my-teacher',state.teacher);
 sessionStorage.setItem('my-board-window-v2',state.boardWindow);sessionStorage.setItem('my-board-subject',state.boardSubject);
 sessionStorage.setItem('my-board-division',state.boardDivision);sessionStorage.setItem('my-board-grade',state.boardGrade)}catch{}
}
function showBoardPoint(point){
 const key=point?.dataset?.boardPoint;
 const inspector=root.querySelector('.board-trend-inspector');
 if(!inspector||!key)return;
 if(inspector.dataset.activePoint!==key){
  inspector.innerHTML=renderTrendPointDetails(key);
  inspector.dataset.activePoint=key;
  root.querySelectorAll('.board-trend-point.is-active').forEach(x=>x.classList.remove('is-active'));
  point.classList.add('is-active');
 }
}
function showDPPoint(point){
 const key=point?.dataset?.boardDpPoint,inspector=root.querySelector('.board-dp-inspector');
 if(!inspector||!key)return;
 if(inspector.dataset.activePoint!==key){
  inspector.innerHTML=renderDPPointDetails(key);
  inspector.dataset.activePoint=key;
  root.querySelectorAll('.board-dp-point.is-active').forEach(x=>x.classList.remove('is-active'));
  point.classList.add('is-active');
 }
}
function placeBoardFloat(point,e){
 const tooltip=root.querySelector('.board-floating-tooltip');
 if(!tooltip||!point)return;
 const dp=!!point.dataset.boardDpPoint;
 const key=dp?point.dataset.boardDpPoint:point.dataset.boardPoint;
 if(!key)return;
 if(tooltip.dataset.activePoint!==key){
  tooltip.innerHTML=dp?renderDPPointDetails(key):renderTrendPointDetails(key);
  tooltip.dataset.activePoint=key;
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
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point]');
 if(!point)return;
 if(e.pointerType==='mouse'||e.pointerType==='pen'){placeBoardFloat(point,e);return}
 // Touch users select a point; keyboard users retain the inline inspector.

});
root.addEventListener('pointermove',e=>{
 if(state.role!=='board'||(e.pointerType!=='mouse'&&e.pointerType!=='pen'))return;
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point]');
 if(point)placeBoardFloat(point,e);
});
root.addEventListener('pointerout',e=>{
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point]');
 if(point&&!point.contains(e.relatedTarget))hideBoardFloat();
});
root.addEventListener('focusin',e=>{
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point]');
 if(point&&state.role==='board'){
  if(point.dataset.boardPoint&&state.boardView==='overview')showBoardPoint(point);
  if(point.dataset.boardDpPoint&&(state.boardView==='dp'||(state.boardView==='overview'&&state.boardOverviewChart==='dp')))showDPPoint(point);
  placeBoardFloat(point);
 }
});
root.addEventListener('focusout',e=>{
 if(e.target.closest?.('[data-board-point],[data-board-dp-point]'))hideBoardFloat();
});
root.addEventListener('keydown',e=>{
 const point=e.target.closest?.('[data-board-point],[data-board-dp-point]');
 if(point&&(e.key==='Enter'||e.key===' ')){
  e.preventDefault();
  if(point.dataset.boardPoint)showBoardPoint(point);
  if(point.dataset.boardDpPoint)showDPPoint(point);
  placeBoardFloat(point);
 }
 if(e.key==='Escape')hideBoardFloat();
});
root.addEventListener('click',e=>{
 const role=e.target.closest('[data-role]');if(role){if(!ROLE_IDS.includes(role.dataset.role))return;
 if(role.dataset.role==='board')state.boardView='overview';
 state.role=role.dataset.role;state.details=false;state.studentId='';state.classId='';state.query='';
 if(globalThis.location?.hash!=='#/'+state.role)globalThis.location.hash='#/'+state.role;
 render();return}
 const point=e.target.closest('[data-board-point]');
 if(point){showBoardPoint(point);
  if(e.detail>0&&window.matchMedia?.('(pointer: coarse)').matches)
   root.querySelector('.board-trend-inspector')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
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
   if(selected)showDPPoint(selected);
  }else showDPPoint(dpPoint);
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
   root.querySelector('#board-map-detail')?.scrollIntoView?.({block:'start',behavior:'smooth'});
  }
  return;
 }
 const presentation=e.target.closest('[data-board-presentation]');
 if(presentation){
  state.boardPresentation=!state.boardPresentation;
  try{globalThis.history?.replaceState?.(null,'',boardShareUrl(globalThis.location,state))}catch{}
  render();return;
 }
 const closeDetails=e.target.closest('[data-board-close-details]');
 if(closeDetails){state.boardMapDetailsOpen=false;state.boardGrade='all';render();return}
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
  state.boardDpMetric=dpGo.dataset.boardDpGo==='passRate'?'passRate':'average';
  render();globalThis.window?.scrollTo?.(0,0);return;
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
 const dpMetric=e.target.closest('[data-board-dp-metric]');
 if(dpMetric){state.boardDpMetric=dpMetric.dataset.boardDpMetric==='passRate'?'passRate':'average';render();return;}
 const boardTerm=e.target.closest('[data-board-trend]');
 if(boardTerm){state.boardTrendTerm=boardTerm.dataset.boardTrend==='spring'?'spring':'fall';render();return}
 const boardFocus=e.target.closest('[data-board-focus]');
 if(boardFocus){
  state.boardTrendFocus=['all','math','reading','language'].includes(boardFocus.dataset.boardFocus)?
   boardFocus.dataset.boardFocus:'all';render();return
 }
 const share=e.target.closest('[data-board-share]');
 if(share){
  const url=boardShareUrl(globalThis.location,state);
  const status=document.getElementById('board-share-feedback');
  const say=(message)=>{if(status)status.textContent=message};
  const copy=(async()=>{
   try{if(!globalThis.navigator?.clipboard?.writeText)throw Error('Clipboard API unavailable');
    await globalThis.navigator.clipboard.writeText(url);say('Link copied');return;
   }catch{}
   const field=document.createElement('textarea');
   field.value=url;field.setAttribute('readonly','true');
   field.style.position='fixed';field.style.opacity='0';
   document.body.appendChild(field);field.select();
   let copied=false;try{copied=document.execCommand('copy')}catch{}
   field.remove();
   if(copied){say('Link copied');return}
   if(status){status.textContent='Copy this link: '+url;status.setAttribute('title',url)}
  })();void copy;return;
 }
 const boardSubject=e.target.closest('[data-board-subject]');
 if(boardSubject){state.boardSubject=boardSubject.dataset.boardSubject;render();return}
 const boardWindow=e.target.closest('[data-board-window]');
 if(boardWindow){state.boardWindow=boardWindow.dataset.boardWindow;render();return}
 const b=e.target.closest('[data-action]');if(b){const a=b.dataset.action;if(a.startsWith('explain:')){state.details=a.slice('explain:'.length)}else if(a==='close')state.details=false;else if(a==='back'){state.studentId='';state.details=false}else if(a==='save-reflection'){const t=document.querySelector('#reflection');try{sessionStorage.setItem('reflection-'+state.studentId,t?.value||'')}catch{}document.querySelector('#save-status').textContent='Draft saved in this browser session only.';return}render();return}
 const link=e.target.closest('[data-student]');if(link){state.studentId=link.dataset.student;state.details=false;render();window.scrollTo(0,0)}
});
root.addEventListener('change',e=>{
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
  render();return;
 }
 const el=e.target.closest('[data-select]');if(!el)return;const v=el.value;
 if(el.dataset.select==='teacher'){state.teacher=v;state.classId='';state.studentId='';state.query='';state.details=false}
 if(el.dataset.select==='class'){state.classId=v;state.studentId='';state.query='';state.details=false}
 if(el.dataset.select==='division'){state.division=v;state.grade='All';state.classId='';state.details=false}
 if(el.dataset.select==='grade'){state.grade=v;state.classId='';state.details=false}
 if(el.dataset.select==='leader-class'){state.classId=v;state.details=false}
 if(el.dataset.select==='student'){state.studentId=v;state.details=false}
 if(el.dataset.select==='window'){state.window=v;state.details=false}
 render()
});
root.addEventListener('input',e=>{if(e.target.matches('[data-query]')){const p=e.target.selectionStart;state.query=e.target.value;render();const input=document.querySelector('[data-query]');input?.focus();input?.setSelectionRange(p,p)}});
try{globalThis.window?.addEventListener?.('hashchange',()=>{
 const hash=String(globalThis.location?.hash||'');
 const id=hash.replace(/^#\//,'').split('?')[0];
 const boardLink=parseBoardHash(hash);
 if(boardLink){
  const changed=state.role!=='board'||Object.entries(boardLink).some(([key,value])=>state[key]!==value);
  if(changed){state.role='board';Object.assign(state,boardLink);render()}
 }else if(ROLE_IDS.includes(id)&&state.role!==id){state.role=id;render()}
})}catch{}
render();
