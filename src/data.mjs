/** AISG My Learners — deterministic, entirely fictional demonstration records. */
export const SCHOOL_YEAR = '2026–27';
export const AS_OF = '2026-10-08';
export const GRADES = ['PK3','PK4','K',...Array.from({length:12},(_,i)=>`G${i+1}`)];
export const WINDOWS = [
  {key:'F24',label:'Fall 2024',date:'2024-09-18',gradeOffset:-2},
  {key:'S25',label:'Spring 2025',date:'2025-04-23',gradeOffset:-2},
  {key:'F25',label:'Fall 2025',date:'2025-09-17',gradeOffset:-1},
  {key:'S26',label:'Spring 2026',date:'2026-04-22',gradeOffset:-1},
  {key:'F26',label:'Fall 2026',date:'2026-09-16',gradeOffset:0}
];
const FIRST = ['Amelia','Leo','Sofia','Liam','Olivia','Noah','Maya','Ethan','Isla','Aiden','Ella','Daniel','Aria','Benjamin','Chloe','Lucas','Zoe','James','Lily','Henry','Ava','Oscar','Hana','Milo','Emilia','Oliver','Ruby','Theo','Naomi','Isaac','Freya','Samuel','Luna','Felix','Grace','Aaron','Jasmine','Max','Nora','Ryan','Evelyn','Arthur','Ivy','Finn','Kai','Sara','Alex','Mina','Mateo','Nina','Emily','Julian','Anika','Hugo','Mei','Yuna','Aisha','Adam','Clara','Yuki','Jun','Elena','Priya','Hassan','Nadia','Haruto','Nikhil','Jiho','Minseo','Wei','Xinyi','Jia','Haoran','Zihan','Yichen','Jinhui','Tianyi','Rina','An','Yujin','Yue','Ari','Sora','Sienna','Rei','Amir','Sana','Sara','Iris','Ayden','Ming','Xiaoyu','Tao','Ling','Yara','Marcus'];
const LAST = ['Chen','Wang','Li','Zhang','Liu','Huang','Zhao','Wu','Lin','Zhou','Tan','Yang','Xu','Sun','Guo','Zhu','Hu','Deng','Gao','He','Kim','Park','Lee','Choi','Jung','Kang','Nguyen','Tran','Lim','Tanaka','Sato','Suzuki','Yamamoto','Ito','Takahashi','Singh','Patel','Sharma','Khan','Rahman','Ahmed','Miller','Evans','Smith','Williams','Brown','Wilson','Taylor','Anderson','Martin','Davis','Clark','Thomas','Garcia','Lopez','Rodriguez','Hernandez','Dubois','Moreau','Muller','Schmidt','Weber','Novak','Rossi','Costa','Silva','Almeida','Nielsen','Larsen','Jones','Morgan','Bennett','Walker'];
const LANGUAGES = ['English','Mandarin Chinese','Korean','Japanese','Cantonese','Hindi','Spanish','French','German','Arabic','Vietnamese','Portuguese'];
const SUPPORTS = [
  {title:'Visual explanations',detail:'Pair spoken instructions with diagrams, examples and clear written steps.',kind:'Learning strategy'},
  {title:'Chunked instructions',detail:'Break multistep work into manageable stages and check understanding.',kind:'Learning strategy'},
  {title:'Language scaffolding',detail:'Pre-teach essential vocabulary and allow rehearsal before whole-class sharing.',kind:'Language support'},
  {title:'Flexible response options',detail:'Offer a choice of approved ways to demonstrate understanding.',kind:'Learning strategy'},
  {title:'Additional processing time',detail:'Allow approved additional time to process and respond to instructions.',kind:'Classroom accommodation'},
  {title:'Assistive reading tools',detail:'Allow agreed text-to-speech tools during eligible activities.',kind:'Classroom accommodation'},
  {title:'Movement and reset breaks',detail:'Offer agreed brief movement breaks within the classroom routine.',kind:'Classroom accommodation'},
  {title:'Preferential seating',detail:'Seat in a location that supports access to instruction and participation.',kind:'Classroom accommodation'}
];
const SUBJECTS_E=['Literacy','Mathematics','Inquiry'];
const SUBJECTS_S=['Mathematics','Language & Literature','Individuals & Societies','Sciences','Design'];
export function hash(v){let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const gradeNumber=g=>g==='PK3'?-2:g==='PK4'?-1:g==='K'?0:Number(g.slice(1));
export const gradeDisplay=g=>g[0]==='G'?`Grade ${g.slice(1)}`:g==='K'?'Kindergarten':g;
export const division=g=>gradeNumber(g)<=5?'Elementary':'Secondary';
export const campus=g=>gradeNumber(g)<=5?'Ersha Island':'Science Park';
function dateIso(d){return d.toISOString().slice(0,10)}
const dayList=(()=>{const dates=[];let d=new Date('2026-08-10T12:00:00Z');const end=new Date('2026-10-08T12:00:00Z');for(;d<=end;d.setUTCDate(d.getUTCDate()+1)){if(d.getUTCDay()>0&&d.getUTCDay()<6&&!['2026-10-01','2026-10-02','2026-10-05','2026-10-06'].includes(dateIso(d)))dates.push(dateIso(d))}return dates})();
function attendanceFor(id){const r=rng(hash(`${id}-attendance`));const frag=(hash(id)%19===0)?0.15:(hash(id)%13===0)?0.085:0.025;return dayList.map(date=>{const u=r();const state=u<frag?'absent':u<frag+0.04?'late':'present';return {date,status:state,excused:state==='absent'&&r()>0.3,unit:'day'}})}
export function attendanceSummary(events){const abs=events.filter(e=>e.status==='absent').length;const late=events.filter(e=>e.status==='late').length;const present=events.length-abs;return {total:events.length,present,absences:abs,lates:late,rate:events.length?Math.round(present*1000/events.length)/10:null}}
function mapFor(id,grade,subj,scenario){const n=gradeNumber(grade);if(n<3||n>10)return [];const r=rng(hash(`${id}-${subj}-map`));const variance=Math.round((r()-.5)*29);const base = subj==='Mathematics'?172:subj==='Reading'?168:170;
const recent=base+n*5.9+variance;const slope=scenario==='high'?8:scenario==='flat'?1.5:scenario==='dip'?-0.5:4.2+r()*2.5;
const eligible=WINDOWS.filter(w=>n+w.gradeOffset>=3&&n+w.gradeOffset<=10);
const start=recent-slope*(eligible.length-1);
return eligible.map((w,j)=>{const rit=Math.round(clamp(start+j*slope+(r()-.5)*4,130,285));const percentile=clamp(Math.round(50+(rit-(base+(n+w.gradeOffset)*5.9))*2.15),1,99);const projection=j?Math.round(clamp(3+(10-n)*.17,2,8)):null;return {key:w.key,window:w.label,date:w.date,subject:subj,rit,percentile,projection,simulated:true,status:'valid'}})
}
function assessmentFor(id,g){const r=rng(hash(`${id}-assessment`));const n=gradeNumber(g);const subjects=n<=5?SUBJECTS_E:SUBJECTS_S;const titles=n<=5?['Learning evidence','Unit reflection','Skills check','Inquiry performance task','Learning conversation']:['Unit summative','Research task','Criterion assessment','Knowledge application','Reflection task'];const rows=[];for(let i=0;i<7;i++){const score=r();const subject=subjects[i%subjects.length];const day=Number(String(10+i*3).slice(-2))+1;const date=`2026-09-${String(Math.min(day,29)).padStart(2,'0')}`;
rows.push({id:`${id}-AS-${i}`,subject,title:titles[i%titles.length],date,status:score<.09?'Missing':score<.17?'Pending':'Published',scale:n<=5?'developmental':n<=10?'MYP':'DP',outcome:n<=5?['Emerging','Developing','Applying','Extending'][Math.floor(score*4)]:n<=10?`${clamp(Math.round(score*8),1,8)} / 8`:`${clamp(Math.round(score*7),1,7)} / 7`,feedback:i%3===0?'Feedback available':null});}
return rows.sort((a,b)=>b.date.localeCompare(a.date))}
function supportFor(id){const r=rng(hash(`${id}-support`));if(r()>.26)return [];const a=SUPPORTS[Math.floor(r()*SUPPORTS.length)];const b=r()>.64?SUPPORTS[Math.floor(r()*SUPPORTS.length)]:null;return [a,...(b&&b.title!==a.title?[b]:[])];}
const SPECIAL = [
  {id:'persona-eal',name:'Alex Morgan',role:'EAL Specialist',classIds:['G3-A','G4-B','G7-A'],roleDescription:'Demonstration specialist'},
  {id:'persona-inclusion',name:'Morgan Ellis',role:'Learning Inclusion',classIds:['G2-C','G5-D','G8-A'],roleDescription:'Demonstration specialist'},
  {id:'persona-leader',name:'Taylor Jordan',role:'Divisional Leader',classIds:['G6-A','G6-B','G6-C','G6-D','G7-A','G7-B','G7-C','G7-D'],roleDescription:'Demonstration leadership'}
];
export function generateDemoData(){
const classes=[];const teachers=[];const students=[];const attendance={};const map={};const assessments={};const support={};
let serial=0;
for(const grade of GRADES){const n=gradeNumber(grade);for(const section of ['A','B','C','D']){
const classId=`${grade}-${section}`;const teacherId=`T-${classId}`;
const teacherName=`${FIRST[(hash(teacherId+'first')%FIRST.length)]} ${LAST[hash(teacherId+'last')%LAST.length]}`;
const teacher={id:teacherId,name:teacherName,role:n<=5?'Homeroom Teacher':'Subject / Advisory Teacher',roleDescription:n<=5?'Elementary homeroom':'Secondary teaching group',division:division(grade),campus:campus(grade),classIds:[classId]};teachers.push(teacher);
classes.push({id:classId,name:`${gradeDisplay(grade)} · ${section}`,grade,section,teacherId,division:division(grade),campus:campus(grade),studentIds:[]});
for(let seat=0;seat<20;seat++){
serial++;const id=`DEMO-${String(serial).padStart(4,'0')}`;const r=rng(hash(`${id}-identity`));
const first=FIRST[Math.floor(r()*FIRST.length)],last=LAST[Math.floor(r()*LAST.length)];const age=n+5;const year=2026-age;const dob=`${year}-${String(1+Math.floor(r()*12)).padStart(2,'0')}-${String(1+Math.floor(r()*27)).padStart(2,'0')}`;const years=1+Math.floor(r()*Math.min(7,age));const primary=LANGUAGES[Math.floor(r()*LANGUAGES.length)];const secondary=r()>.35?LANGUAGES[Math.floor(r()*LANGUAGES.length)]:null;const scenario=serial%23===0?'high':serial%29===0?'flat':serial%39===0?'dip':'typical';
const student={id,first,last,name:`${first} ${last}`,preferred:r()>.93?first.slice(0,3):null,grade,classId,age,dateOfBirth:dob,homeroom:classId,campus:campus(grade),division:division(grade),primaryLanguage:primary,otherLanguages:secondary&&secondary!==primary?[secondary]:[],yearsAtAISG:years,enrolledDate:`${2026-years}-08-15`,eal:r()>.80,scenario,portraitSeed:hash(`${id}-${first}-${last}`),status:serial%83===0?'New to AISG':'Enrolled'};
students.push(student);classes[classes.length-1].studentIds.push(id);attendance[id]=attendanceFor(id);assessments[id]=assessmentFor(id,grade);support[id]=supportFor(id);
if(n>=3&&n<=10){map[id]=['Mathematics','Reading','Language Usage'].flatMap(s=>mapFor(id,grade,s,scenario));if(serial%31===0)map[id]=map[id].filter(x=>x.key!=='F26');}else map[id]=[];
}
}}
const userIndex=new Map(students.map(s=>[s.id,s]));const classIndex=new Map(classes.map(c=>[c.id,c]));
return {students,teachers:[...teachers,...SPECIAL],classes,attendance,map,assessments,support,userIndex,classIndex,schoolYear:SCHOOL_YEAR,asOf:AS_OF,generated:true};
}
export function getTeacherStudents(data,t){const set=new Set(t.classIds);return data.students.filter(s=>set.has(s.classId))}
export function classAttendance(data,ids){const avg=ids.reduce((sum,id)=>sum+(attendanceSummary(data.attendance[id]).rate||0),0);return ids.length?Math.round(avg/ids.length*10)/10:null}
export const formatPct=n=>n===null?'Not available':`${n.toFixed(1)}%`;
