/**
 * My Learners 2.0 — entirely synthetic DAILY teaching evidence.
 * The source model is intentionally deterministic and never reads real learner data.
 */
import {hash, rng, gradeNumber, attendanceSummary} from './data.mjs';
import {latestMapGrowth} from './map-growth.mjs';
export const DEMO_DAY = '2026-10-08';
export const DEMO_PREVIOUS = '2026-10-07';
export const DAILY_PROVENANCE = Object.freeze({
  attendance:'PowerSchool-like demonstration events · 8 Oct 2026',
  assessments:'ManageBac-like demonstration formative checks · 7 Oct 2026',
  assignments:'ManageBac-like demonstration submission statuses · 7 Oct 2026',
  voice:'Illustrative aggregated learner pulse · 30 Sep 2026',
  map:'Synthetic MAP Growth records · Fall 2026'
});
const ELEMENTARY_SKILLS=['Using evidence in explanations','Reading for meaning','Representing mathematical ideas','Communicating a strategy'];
const SECONDARY_SKILLS=['Explaining and justifying reasoning','Interpreting evidence and sources','Applying concepts in unfamiliar contexts','Communicating with precision'];
const EARLY_SKILLS=['Expressing ideas through play','Noticing and describing patterns','Connecting sounds and symbols','Exploring with others'];
export const SKILL_STATES=[
  {id:'revisit',label:'Revisit with support',short:'Revisit'},
  {id:'developing',label:'Developing evidence',short:'Developing'},
  {id:'secure',label:'Evidence of understanding',short:'Secure'},
  {id:'extend',label:'Ready for extension',short:'Extend'}
];
export const GROUP_LABELS={
  revisit:'Revisit together',developing:'Practise & explain',
  secure:'Apply independently',extend:'Extend & transfer'
};
export const GRADE_BANDS={
  early:'PK3–Kindergarten',elementary:'Grades 1–5',
  secondary:'Grades 6–10',upper:'Grades 11–12'
};
export function gradeBand(g){
 const n=gradeNumber(g);return n<=0?'early':n<=5?'elementary':n<=10?'secondary':'upper';
}
export function skillsForGrade(g){
 const n=gradeNumber(g);return n<=0?EARLY_SKILLS:n<=5?ELEMENTARY_SKILLS:SECONDARY_SKILLS;
}
export function classFocus(c){
 const n=gradeNumber(c.grade);
 if(n<=0)return ['Exploration & communication','Learning through stories','Working with others','Patterns through play'][c.section.charCodeAt(0)-65];
 if(n<=5)return ['Reading meaning','Mathematical representations','Inquiry and explanation','Language in learning'][c.section.charCodeAt(0)-65];
 return ['Relationships & reasoning','Language, evidence & interpretation','Scientific inquiry','Perspectives & explanation'][c.section.charCodeAt(0)-65];
}
function evidenceFor(student){
 const r=rng(hash('aisg-pulse-'+student.id));
 const skills=skillsForGrade(student.grade);
 const chosen=skills[hash(student.id+'skill')%skills.length];
 const level=Math.floor(r()*4);
 const previous=Math.max(0,Math.min(3,level+(r()<.25?-1:r()<.65?0:1)));
 const submitted=r()<.10?'Missing':r()<.21?'Awaiting submission':'Submitted';
 const voice=r()<.22?null:2+Math.floor(r()*4);
 return {
  studentId:student.id,skill:chosen,
  formative:{level,previous,recorded:'2026-10-07',source:'Demo formative check',type:'Criteria / skill evidence'},
  task:{id:student.classId+'-TASK',title:classFocus({grade:student.grade,section:student.classId.split('-').at(-1)})+' · practice check',
    due:'2026-10-07',status:submitted,source:'Demo assignment'},
  voice:voice===null?null:{score:voice,question:'I understand what I am learning and why',recorded:'2026-09-30'},
  classroomNext:level===0?'Model and revisit':level===1?'Guided practice':level===2?'Apply independently':'Extend through transfer'
 };
}
export function buildPulseData(data){
 const byStudent=Object.create(null);
 for(const s of data.students)byStudent[s.id]=evidenceFor(s);
 const voiceByClass=Object.create(null);
 for(const c of data.classes){
   const responses=c.studentIds.map(id=>byStudent[id].voice).filter(Boolean);
   const count=responses.length;
   const positive=responses.filter(v=>v.score>=4).length;
   voiceByClass[c.id]={count,cohort:c.studentIds.length,
     positive:count>=10?Math.round(100*positive/count):null,
     question:'I understand what I am learning and why',
     date:'2026-09-30',suppressed:count<10};
 }
 return {byStudent,voiceByClass,asOf:DEMO_DAY,isSynthetic:true,source:'Locally generated, deterministic school-day demonstration'};
}
export function todayStatus(data,studentId,date=DEMO_DAY){
 const row=(data.attendance[studentId]||[]).find(e=>e.date===date);
 if(!row)return {status:'not-recorded',label:'Not recorded',date};
 const labels={present:'Present',late:'Late',absent:row.excused?'Excused absence':'Absence'};
 return {...row,label:labels[row.status]||'Not recorded'};
}
export function pulseForClass(data,pulse,c,date=DEMO_DAY){
 const students=c.studentIds.map(id=>data.userIndex.get(id)).filter(Boolean);
 const rows=students.map(s=>{
   const signal=pulse.byStudent[s.id];
   return {student:s,evidence:signal,attendance:todayStatus(data,s.id,date),
     supportCount:(data.support[s.id]||[]).length,
     map:latestMapGrowth(data.map[s.id]||[],'Mathematics')};
 });
 const count=(f)=>rows.filter(f).length;
 const levels=Object.fromEntries(SKILL_STATES.map(x=>[x.id,0]));
 for(const row of rows)levels[SKILL_STATES[row.evidence.formative.level].id]++;
 const attendance={present:count(r=>r.attendance.status==='present'),
   late:count(r=>r.attendance.status==='late'),absent:count(r=>r.attendance.status==='absent'),
   notRecorded:count(r=>r.attendance.status==='not-recorded')};
 return {c,rows,students,levels,
   absent:attendance.absent,late:attendance.late,attendance,
   missing:count(r=>r.evidence.task.status==='Missing'),
   pending:count(r=>r.evidence.task.status==='Awaiting submission'),
   revisit:levels.revisit,developing:levels.developing,extend:levels.extend,
   support:count(r=>r.supportCount>0),
   voice:pulse.voiceByClass[c.id],
   latestEvidence:'2026-10-07',
   observedDate:date,activeSkill:skillsForGrade(c.grade)[hash(c.id+'focus')%skillsForGrade(c.grade).length]
 };
}
export function classInsights(classPulse){
 const p=classPulse;
 const result=[];
 const push=(id,type,title,description,metric,source,target,priority='normal')=>
   result.push({id:p.c.id+'-'+id,classId:p.c.id,type,title,description,metric,source,
     target,priority,updated:source.includes('attendance')?'2026-10-08':'2026-10-07'});
 if(p.revisit+p.developing>=5)push('formative','learning','Revisit a recent learning check',
   'Review '+(p.revisit+p.developing)+' individual formative records before planning flexible practice.',
   String(p.revisit+p.developing)+' learners',
   'Demo formative check · 7 Oct 2026','class/'+p.c.id,'high');
 if(p.missing+p.pending>=2)push('submissions','completion','Check recent assignment responses',
   (p.missing+p.pending)+' responses are missing or awaiting submission. Confirm what happened before following up.',
   String(p.missing+p.pending)+' responses',
   'Demo assignment statuses · 7 Oct 2026','class/'+p.c.id,'normal');
 if(p.absent+p.late>0)push('attendance','participation','Review today’s attendance changes',
   p.absent+' absent and '+p.late+' late recorded today. Consider missed learning, without assuming the reason.',
   String(p.absent+p.late)+' attendance updates',
   'Demo daily attendance · 8 Oct 2026','class/'+p.c.id,'normal');
 if(p.extend>=3)push('extension','challenge','Plan worthwhile extension',
   p.extend+' learners showed evidence of secure transfer or readiness for further challenge in a recent check.',
   String(p.extend)+' opportunities',
   'Demo formative check · 7 Oct 2026','class/'+p.c.id,'normal');
 if(!p.voice.suppressed&&p.voice.positive<65)push('voice','student voice','Ask what would make learning clearer',
   'The class-level voice pulse suggests an opportunity for a brief, supportive conversation. Responses are aggregated.',
   p.voice.positive+'% positive',
   'Illustrative aggregated student voice · 30 Sep 2026','class/'+p.c.id,'normal');
 return result;
}
export function flexibleGroups(classPulse){
 const groups=SKILL_STATES.map((level,i)=>({
   id:level.id,label:GROUP_LABELS[level.id],description:[
     'Re-model and discuss the idea together.','Practise with guided examples and feedback.',
     'Apply understanding in a new task.','Deepen thinking with an authentic transfer challenge.'
   ][i],learners:[],type:'temporary formative group'
 }));
 for(const row of classPulse.rows)groups[row.evidence.formative.level].learners.push(row.student);
 return groups;
}
export function teacherSchedule(data,teacher){
 const times=['08:10','09:15','10:35','12:30','13:45','14:45'];
 const classes=data.classes.filter(c=>teacher.classIds.includes(c.id));
 const own=classes.slice(0,Math.min(5,classes.length));
 const currentIndex=Math.min(1,own.length-1);
 return {lessons:own.map((c,i)=>({
   id:'LESSON-'+teacher.id+'-'+i,time:times[i],ends:['09:00','10:05','11:25','13:20','14:35','15:35'][i],
   c,focus:classFocus(c),source:'Fictional demo schedule'})),
   nextLesson:own[Math.max(0,currentIndex)]||null,
   nextIndex:currentIndex,date:DEMO_DAY};
}
export function studentTimeline(data,pulse,s){
 const p=pulse.byStudent[s.id];const events=[
   {id:'att-'+s.id,date:'2026-10-08',kind:'attendance',title:todayStatus(data,s.id).label,
     description:'Demo attendance check',source:DAILY_PROVENANCE.attendance},
   {id:'form-'+s.id,date:p.formative.recorded,kind:'formative',
     title:SKILL_STATES[p.formative.level].label,description:p.skill,source:DAILY_PROVENANCE.assessments},
   {id:'task-'+s.id,date:p.task.due,kind:'assignment',title:p.task.status,
     description:p.task.title,source:DAILY_PROVENANCE.assignments}
 ];
 const map=data.map[s.id]||[];
 const latest=map.filter(x=>x.key==='F26'&&x.subject==='Mathematics')[0];
 if(latest)events.push({id:'map-'+s.id,date:latest.date,kind:'growth',
   title:'Fall MAP assessment',description:'Growth evidence is available in Growth & Evidence.',source:DAILY_PROVENANCE.map});
 return events.sort((a,b)=>b.date.localeCompare(a.date));
}
export function classRecentWork(classPulse){
 return {title:classFocus(classPulse.c)+' · practice check',date:'2026-10-07',
   submitted:classPulse.rows.filter(r=>r.evidence.task.status==='Submitted').length,
   pending:classPulse.pending,missing:classPulse.missing,
   breakdown:SKILL_STATES.map((x,i)=>({...x,count:classPulse.rows.filter(r=>r.evidence.formative.level===i).length}))};
}
export function attendanceTrend(data,student){
 const events=data.attendance[student.id]||[];
 const days=events.slice(-10),rate=attendanceSummary(days).rate;
 return {lastTenDays:days.length,rate,absent:days.filter(e=>e.status==='absent').length,
   late:days.filter(e=>e.status==='late').length};
}