/** Public-demo faculty directory adapter.
 * Real AISG faculty names and PLC groupings originate from the 2026-27
 * WORKING directory in My Observations. Every student and teacher-class
 * connection below is an invented demonstration relationship.
 * Never use these mappings as an SIS or HR roster.
 */
import {FACULTY_PLCS,FACULTY_NAMES} from './staff.mjs';
import {hash,gradeNumber,GRADES} from './data.mjs';

export const DEFAULT_TEACHER_NAME='Zach Navarro';
export const facultyId=name=>'FAC-'+hash(name).toString(36).toUpperCase();
export const DEFAULT_TEACHER_ID=facultyId(DEFAULT_TEACHER_NAME);
const sections=['A','B','C','D'];
const secondaryGroup={
 A:'Secondary Mathematics',
 B:'Secondary Language & Literature',
 C:'Secondary Science',
 D:'Secondary Individuals & Societies'
};
function leadName(grade,section){
 const n=gradeNumber(grade),preK=grade==='PK3'||grade==='PK4';
 const plc=preK?'Pre-Kindergarten':grade==='K'?'Kindergarten':n<=5?'Grade '+n:secondaryGroup[section];
 const names=FACULTY_PLCS[plc];
 if(!names?.length)throw Error('Faculty PLC missing: '+plc);
 const offset=preK?(grade==='PK4'?4:0):n>=6?n-7:0;
 return names[((offset+sections.indexOf(section))%names.length+names.length)%names.length];
}
function demoTeacher(name){
 const plcs=Object.entries(FACULTY_PLCS).filter(([,people])=>people.includes(name)).map(([p])=>p);
 const primaryPlc=plcs[0]||'Unassigned';
 const secondary=plcs.some(p=>p.startsWith('Secondary'));
 const isClassroom=primaryPlc==='Pre-Kindergarten'||primaryPlc==='Kindergarten'||/^Grade [1-5]$/.test(primaryPlc);
 return {
  id:facultyId(name),name,plcs,primaryPlc,
  role:isClassroom?'Homeroom Teacher':secondary?'Secondary Faculty':'Elementary Specialist / Support',
  roleDescription:primaryPlc+' · fictional teaching groups',
  division:secondary?'Secondary':'Elementary',
  campus:secondary?'Science Park':'Ersha Island',
  classIds:[],facultySource:'AISG My Observations working PLC roster',
  assignmentsFictional:true
 };
}
/** Mutates only the synthetic data's teacher personas and demo class leads.
 * Student identities, histories and all records remain unchanged and fictional.
 */
export function applyFacultyDemo(data){
 const teachers=FACULTY_NAMES.map(demoTeacher);
 const byName=new Map(teachers.map(t=>[t.name,t]));
 const byId=new Map(teachers.map(t=>[t.id,t]));
 for(const c of data.classes){
  const name=leadName(c.grade,c.section);
  const t=byName.get(name);
  if(!t)throw Error('Demo lead missing for '+c.id);
  c.teacherId=t.id;
  t.classIds.push(c.id);
 }
 // Give each additional specialist/subject faculty member a few SIMULATED
 // cohorts for demonstration, without asserting an actual AISG timetable.
 for(const t of teachers){
  // Every secondary demo persona has several subject-appropriate cohorts,
  // including teachers who already lead one fictional homeroom/section.
  const target=t.division==='Secondary'?4:t.classIds.length?1:2;
  if(t.classIds.length>=target)continue;
  const preferredSection=Object.entries(secondaryGroup).find(([,plc])=>t.plcs.includes(plc))?.[0];
  let eligible=data.classes.filter(c=>c.division===t.division &&
    (t.division!=='Secondary'||!preferredSection||c.section===preferredSection));
  if(eligible.length<target)eligible=data.classes.filter(c=>c.division===t.division);
  const chosen=new Set(t.classIds);
  for(let j=0;t.classIds.length<target&&j<eligible.length*2;j++){
   let k=(hash('fictional-'+t.id+'-'+j)+j*17)%eligible.length;
   while(chosen.has(eligible[k].id))k=(k+1)%eligible.length;
   chosen.add(eligible[k].id);t.classIds.push(eligible[k].id);
  }
 }
 for(const t of teachers)t.classIds.sort((a,b)=>{
  const grade=s=>s.slice(0,s.lastIndexOf('-'));
  return GRADES.indexOf(grade(a))-GRADES.indexOf(grade(b))||a.localeCompare(b);
 });
 data.teachers=teachers;
 data.staffDirectorySource='My Observations · 2026–27 working PLC roster';
 data.classAssignmentsFictional=true;
 if(!byId.has(DEFAULT_TEACHER_ID))throw Error('Default demo teacher missing');
 return data;
}
