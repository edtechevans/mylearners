import {generateDemoData,attendanceSummary,gradeNumber,GRADES} from './data.mjs';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from './faculty-demo.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {portrait} from './portraits.mjs';
import {createExperienceRecords,experienceFor,summarizeExperience,experienceChange,experienceQuestionSummary,EXPERIENCE_WINDOWS,EXPERIENCE_METRICS,METRIC_IDS,experienceEligible} from './experience-data.mjs';
import {esc} from './v2-ui.mjs';
const DATA=applyFacultyDemo(generateDemoData()),RECORDS=createExperienceRecords(DATA.students);
const root=document.getElementById('app');
const saved=(k,d)=>{try{return sessionStorage.getItem(k)||d}catch{return d}};
const state={role:saved('my-role','faculty'),teacher:saved('my-teacher',DEFAULT_TEACHER_ID),division:'All',grade:'All',classId:'',studentId:'',query:'',metric:'engagement',window:'F26',details:false,checkin:false};
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
function metricCard(ss,id,window='F26'){
 const sum=summarizeExperience(RECORDS,ss,id,window),ch=experienceChange(RECORDS,ss,id),diff=ch.delta;
 return '<article class="metric"><div class="metric-top"><span class="eyebrow">'+safe(EXPERIENCE_METRICS[id].label)+' index</span><span class="tiny">AISG demo measure</span></div><div class="metric-value">'+fmt(sum.value)+'<span>/100</span></div><div class="meter"><i style="width:'+(sum.value??0)+'%;background:var(--'+(id==='engagement'?'teal':'violet')+')"></i></div><p>'+safe(EXPERIENCE_METRICS[id].description)+'</p><div class="metric-foot"><span>'+sum.n+' of '+sum.eligible+' check-ins</span><span>'+(diff===null?'No comparison':(diff>0?'+':'')+diff+' vs Spring')+'</span></div>'+btn('explain:'+id,'How is this calculated?','quiet')+'</article>';
}
function info(){return '<div class="notice"><strong>Demonstration only.</strong> All learners, assessments, survey-style check-ins and class assignments are fictional. Actual confidential climate-survey responses are not linked to students. The indices are exploratory AISG-created descriptions, not validated scores or labels.</div>'}
function header(){return '<header class="top"><div class="brand"><img src="assets/aisg-logo.webp" alt="AISG logo"><div><strong>My Learners</strong><span>Understand the whole learner</span></div></div><div class="roles"><span class="roles-label">DEMO VIEW</span>'+['faculty','student','leader'].map(r=>'<button data-role="'+r+'" aria-pressed="'+(state.role===r)+'" class="'+(state.role===r?'selected':'')+'">'+r[0].toUpperCase()+r.slice(1)+'</button>').join('')+'</div></header>'}
function heading(title,desc){return '<div class="heading"><div><div class="eyebrow">AISG · 2026–27</div><h1>'+safe(title)+'</h1><p>'+safe(desc)+'</p></div><span class="demo">FICTIONAL DATA</span></div>'}
function selector(id,options,selected){return '<select data-select="'+id+'" aria-label="'+safe(id)+'">'+options.map(x=>opt(x[0],x[1],selected)).join('')+'</select>'}
function scoreExplanation(id,ss,student){
 const entry=student?experienceFor(RECORDS,student.id,id,state.window):null;
 const qs=entry?.items||experienceQuestionSummary(RECORDS,ss,id,state.window);
 const s=student?{value:entry?.value,n:entry?1:0,eligible:1}:summarizeExperience(RECORDS,ss,id,state.window);
 return '<section class="explain"><div class="row-between"><div><span class="eyebrow">TRANSPARENT INDICATOR</span><h2>Understanding '+safe(EXPERIENCE_METRICS[id].label)+'</h2></div>'+btn('close','Close ×','quiet')+'</div><p>The index is the mean of three student responses converted to points: Strongly disagree = 0, Disagree = 33, Agree = 67, Strongly agree = 100. A 60/100 is an average of item values, <strong>not</strong> 60% agreement or a grade.</p><div class="explain-number">'+fmt(s.value)+'<small>/100</small><span> · '+s.n+' of '+s.eligible+' respondents</span></div><div class="explain-items">'+qs.map((q,i)=>'<div><span>'+safe(q.question)+'</span><strong>'+fmt(student?q.points:q.value)+'/100</strong>'+(student?'<small>'+safe(q.label)+'</small>':'<small>'+fmt(q.favorable)+'% agree or strongly agree · n='+q.n+'</small>')+'</div>').join('')+'</div><p class="tiny">This is a descriptive, non-diagnostic demo measure. Check the underlying responses and context before drawing conclusions. Never use it to rank or label learners.</p></section>';
}
function metrics(ss,student){return '<div class="metrics">'+METRIC_IDS.map(id=>metricCard(student?[student]:ss,id,state.window)).join('')+'</div>'+(state.details?scoreExplanation(state.details,ss,student):'')}
function roster(ss){return '<div class="sectionhead"><h2>My students</h2><input data-query placeholder="Find a student..." value="'+safe(state.query)+'" aria-label="Search my learners"></div><div class="tablewrap"><table><thead><tr><th>Learner</th><th>Grade</th><th>Engagement</th><th>Belonging</th><th>Attendance</th><th>MAP Math growth</th><th>Classroom guidance</th></tr></thead><tbody>'+ss.filter(s=>s.name.toLowerCase().includes(state.query.toLowerCase())).map(s=>{
 const e=experienceFor(RECORDS,s.id,'engagement'),b=experienceFor(RECORDS,s.id,'belonging'),a=attendanceSummary(DATA.attendance[s.id]),g=latestMapGrowth(DATA.map[s.id]||[]);
 return '<tr><td><button class="student-link" data-student="'+s.id+'"><img src="'+portrait(s.portraitSeed)+'" alt="">'+safe(s.name)+'</button></td><td>'+safe(s.grade)+'</td><td>'+fmt(e?.value)+'</td><td>'+fmt(b?.value)+'</td><td>'+fmt(a.rate)+'%</td><td>'+(g.status==='comparable'?(g.actual>=0?'+':'')+g.actual+' RIT':'—')+'</td><td>'+demoTagsForStudent(s).map(t=>pill(t.label)).join(' ')+'</td></tr>'
 }).join('')+'</tbody></table></div>'}
function learnerProfile(s,studentRole=false){
 if(!s)return '<section class="card">Select a learner to begin.</section>';
 const aa=attendanceSummary(DATA.attendance[s.id]||[]),mg=latestMapGrowth(DATA.map[s.id]||[]),tags=demoTagsForStudent(s);
 const academics=(DATA.assessments[s.id]||[]).filter(x=>x.status==='Published').slice(0,3);
 return '<div class="row-between"><button class="back" data-action="'+(studentRole?'studenthome':'back')+'">← '+(studentRole?'My dashboard':'Back to my class')+'</button></div><div class="profile-head"><img src="'+portrait(s.portraitSeed)+'" alt="Fictional portrait"><div><div class="eyebrow">WHOLE LEARNER PROFILE</div><h1>'+safe(s.name)+'</h1><p>'+safe(s.grade)+' · '+safe(s.classId)+' · '+safe(s.campus)+'</p></div></div>'+
 '<div class="kpis">'+kpi('Attendance',fmt(aa.rate)+'%','Term-to-date presence')+kpi('MAP Mathematics growth',mg.status==='comparable'?(mg.actual>=0?'+':'')+mg.actual:'—',mg.status==='comparable'?'RIT points · projected '+fmt(mg.projected):'No comparable result')+kpi('Latest academic snapshot',academics[0]?.outcome||'—',safe(academics[0]?.subject||'No published assessment'))+'</div>'+
 '<div class="sectionhead"><h2>'+ (studentRole?'How I experience learning':'Student experience')+'</h2><span class="tiny">Student-reported · fictional check-ins</span></div>'+metrics([s],s)+
 '<div class="two-col"><section class="card"><h2>Academic overview</h2><p class="muted">The latest published outcomes, not a running list of formative evidence.</p>'+academics.map(a=>'<div class="listrow"><span>'+safe(a.subject)+'</span><strong>'+safe(a.outcome)+'</strong></div>').join('')+'<p class="tiny">MAP achievement is not the same as growth. RIT change and illustrative projection are shown separately.</p></section>'+
 '<section class="card"><h2>'+(studentRole?'My next step':'Classroom guidance')+'</h2>'+(studentRole?'<p>What could help me feel more connected and engaged in learning?</p><label class="label">My reflection (this browser only)</label><textarea id="reflection" placeholder="One thing that helps me learn is...">'+safe(saved('reflection-'+s.id,''))+'</textarea>'+btn('save-reflection','Save my draft','primary')+'<p class="tiny" id="save-status">A private browser demonstration, not submitted to school.</p>':
 (tags.length?tags.map(t=>'<div class="guide"><strong>'+safe(t.fullName)+'</strong><p>'+safe(t.strategies[0])+'</p></div>').join(''):'<p class="muted">No additional classroom support tags in this fictional example.</p>')+'<p class="tiny">Detailed plans and medical or safeguarding records are not included in this public demo.</p>')+'</section></div>';
}
function faculty(){
 const cs=ownClasses();if(!cs.some(c=>c.id===state.classId))state.classId=cs[0]?.id||'';
 const ss=(activeClass()?.studentIds||[]).map(id=>DATA.userIndex.get(id));const selected=ss.find(s=>s.id===state.studentId);
 if(selected)return learnerProfile(selected);
 return heading('Your students, in one place.','Academic progress, attendance, classroom guidance and student experience — without the extra noise.')+
 '<div class="toolbar"><label>Faculty demo '+selector('teacher',DATA.teachers.map(t=>[t.id,t.name]),state.teacher)+'</label><label>Teaching group '+selector('class',cs.map(c=>[c.id,c.name]),state.classId)+'</label></div>'+
 '<div class="kpis">'+kpi('Students in class',ss.length,'Fictional class roster')+kpi('Average attendance',fmt(avg(ss.map(s=>attendanceSummary(DATA.attendance[s.id]).rate)))+'%','Term-to-date attendance')+kpi('Experience check-ins',eligible(ss).filter(s=>!!experienceFor(RECORDS,s.id,'engagement')).length,'Of '+eligible(ss).length+' eligible learners')+'</div>'+
 '<div class="sectionhead"><h2>Class experience</h2><span class="tiny">Select an index to see how it is calculated</span></div>'+metrics(ss)+roster(ss)+info();
}
function leader(){
 const grades=GRADES.filter(x=>gradeNumber(x)>=3);
 const divisions=state.division==='All'?['Elementary','Secondary']:[state.division];
 const group=DATA.students.filter(s=>experienceEligible(s)&&divisions.includes(s.division)&&(state.grade==='All'||s.grade===state.grade)&&(!state.classId||s.classId===state.classId));
 const options=DATA.classes.filter(c=>divisions.includes(c.division)&&(state.grade==='All'||c.grade===state.grade));
 const groups=state.classId?[]:(state.grade==='All'?grades.filter(g=>group.some(s=>s.grade===g)).map(g=>[g,group.filter(s=>s.grade===g)]):options.map(c=>[c.name,group.filter(s=>s.classId===c.id)]));
 return heading('Where are experiences improving?','Explore grade-level and divisional patterns, response coverage and changes over time.')+
 '<div class="toolbar"><label>Division '+selector('division',[['All','Whole School'],['Elementary','Elementary'],['Secondary','Secondary']],state.division)+'</label><label>Grade '+selector('grade',[['All','All Grades'],...grades.filter(g=>divisions.includes(gradeNumber(g)<=5?'Elementary':'Secondary')).map(g=>[g,g])],state.grade)+'</label><label>Class (fictional) '+selector('leader-class',[['','All classes'],...options.map(c=>[c.id,c.name])],state.classId)+'</label></div>'+
 '<div class="kpis">'+kpi('Students in selected group',group.length,'Grades 3–12 · fictional profiles')+kpi('Check-in participation',eligible(group).filter(s=>!!experienceFor(RECORDS,s.id,'engagement',state.window)).length,'Of '+group.length+' eligible students')+kpi('School-year context','2026–27','Three simulated check-ins')+'</div>'+
 '<div class="sectionhead"><h2>Student experience</h2><label>Window '+selector('window',EXPERIENCE_WINDOWS.map(w=>[w.key,w.label]),state.window)+'</label></div>'+metrics(group)+
 '<section class="card"><div class="row-between"><h2>Patterns by '+(state.grade==='All'?'grade':'class')+'</h2><span class="tiny">View counts alongside scores</span></div><div class="tablewrap"><table><thead><tr><th>Group</th><th>Students</th><th>Responses</th><th>Engagement</th><th>Belonging</th></tr></thead><tbody>'+groups.map(([name,ss])=>{
 const e=summarizeExperience(RECORDS,ss,'engagement',state.window),b=summarizeExperience(RECORDS,ss,'belonging',state.window);
 return '<tr><td>'+safe(name)+'</td><td>'+ss.length+'</td><td>'+e.n+'/'+e.eligible+'</td><td>'+fmt(e.value)+'</td><td>'+fmt(b.value)+'</td></tr>'
 }).join('')+'</tbody></table></div><p class="tiny">Compare these descriptive patterns with other evidence. Group-level changes do not prove individual growth. Demo class drilldowns are fictional and must be governed carefully in production.</p></section>'+
 '<section class="card"><h2>Over time</h2><div class="trend">'+EXPERIENCE_WINDOWS.map(w=>'<div><span>'+w.label+'</span><strong>'+fmt(summarizeExperience(RECORDS,group,'engagement',w.key).value)+' engagement</strong><strong>'+fmt(summarizeExperience(RECORDS,group,'belonging',w.key).value)+' belonging</strong></div>').join('')+'</div></section>'+info();
}
function student(){
 const ss=DATA.students.filter(experienceEligible),chosen=ss.find(s=>s.id===state.studentId)||ss.find(s=>s.id==='DEMO-0721')||ss[0];
 if(!state.studentId)state.studentId=chosen?.id||'';
 return heading('My learning, my story.','Explore what is going well, what is changing and what support might help.')+
 '<div class="toolbar"><label>Student demo '+selector('student',ss.map(s=>[s.id,s.name+' · '+s.grade]),state.studentId)+'</label></div>'+learnerProfile(chosen,true)+info();
}
function render(){
 const content=state.role==='leader'?leader():state.role==='student'?student():faculty();
 root.innerHTML=header()+'<main class="container" id="main">'+content+'</main><footer>My Learners · AISG demonstration · No actual student survey, health or support data</footer>';
 try{sessionStorage.setItem('my-role',state.role);sessionStorage.setItem('my-teacher',state.teacher)}catch{}
}
root.addEventListener('click',e=>{
 const role=e.target.closest('[data-role]');if(role){state.role=role.dataset.role;state.details=false;state.studentId='';state.classId='';render();return}
 const b=e.target.closest('[data-action]');if(b){const a=b.dataset.action;if(a.startsWith('explain:')){state.details=a.split(':')[1]}else if(a==='close')state.details=false;else if(a==='back'){state.studentId='';state.details=false}else if(a==='studenthome'){state.details=false}else if(a==='save-reflection'){const t=document.querySelector('#reflection');try{sessionStorage.setItem('reflection-'+state.studentId,t?.value||'')}catch{}document.querySelector('#save-status').textContent='Draft saved in this browser session only.';return}render();return}
 const link=e.target.closest('[data-student]');if(link){state.studentId=link.dataset.student;state.details=false;render();window.scrollTo(0,0)}
});
root.addEventListener('change',e=>{
 const el=e.target.closest('[data-select]');if(!el)return;const v=el.value;
 if(el.dataset.select==='teacher'){state.teacher=v;state.classId='';state.studentId=''}
 if(el.dataset.select==='class'){state.classId=v;state.studentId=''}
 if(el.dataset.select==='division'){state.division=v;state.grade='All';state.classId=''}
 if(el.dataset.select==='grade'){state.grade=v;state.classId=''}
 if(el.dataset.select==='leader-class')state.classId=v;
 if(el.dataset.select==='student'){state.studentId=v;state.details=false}
 if(el.dataset.select==='window')state.window=v;
 render()
});
root.addEventListener('input',e=>{if(e.target.matches('[data-query]')){const p=e.target.selectionStart;state.query=e.target.value;render();const input=document.querySelector('[data-query]');input?.focus();input?.setSelectionRange(p,p)}});
render();
