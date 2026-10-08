import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,gradeNumber} from '../src/data.mjs';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from '../src/faculty-demo.mjs';
import {buildPulseData,pulseForClass,classInsights,flexibleGroups,teacherSchedule,
 studentTimeline,todayStatus,DEMO_DAY} from '../src/pulse-data.mjs';
import {renderToday,renderClass,renderLearners,renderGrowth,renderStudent,
 renderActions,renderInsightDrawer,renderActionModal} from '../src/v2-pages.mjs';
import {loadActions,createAction,updateAction,removeAction,readGroupOverrides,
 saveGroupOverrides,resetPersonaDemo,actionCounts} from '../src/pulse-actions.mjs';
import {FACULTY_NAMES} from '../src/staff.mjs';

const d=applyFacultyDemo(generateDemoData());
const pulse=buildPulseData(d);
const teacher=d.teachers.find(x=>x.id===DEFAULT_TEACHER_ID);
const classes=d.classes.filter(c=>teacher.classIds.includes(c.id));
const students=d.students.filter(s=>classes.some(c=>c.id===s.classId));
const c=classes.find(x=>x.id==='G7-A')||classes[0];
const store=new Map();
const storage={
 getItem(k){return store.has(k)?store.get(k):null},
 setItem(k,v){store.set(k,String(v))},
 removeItem(k){store.delete(k)}
};
function ctx(overrides={}){
 return {teacher,classes,students,currentClass:c,data:d,pulse,
  actions:loadActions(teacher,d.classes,storage),state:{
   rosterFilter:'all',classMode:'roster',studentQuery:'',studentClassFilter:'all',
   subject:'Mathematics',studentTab:'overview',actionFilter:'all',
   actionModal:false,editingActionId:'',formError:'',modalClassId:'',modalStudentId:'',
   modalTitle:'',modalStrategy:'',modalEvidence:'',...overrides
  },activeInsight:null,editingAction:null};
}
test('all demo students and real-named teacher roles stay synthetic and correctly scoped',()=>{
 assert.equal(FACULTY_NAMES.length,115);
 assert.equal(d.students.length,1200);
 assert.equal(d.classes.length,60);
 assert.ok(d.teachers.every(t=>t.assignmentsFictional===true));
 assert.ok(d.students.every(s=>s.id.startsWith('DEMO-')));
 assert.ok(pulse.isSynthetic);
 for(const schoolClass of d.classes){
  assert.equal(schoolClass.studentIds.length,20);
  assert.ok(schoolClass.studentIds.every(id=>pulse.byStudent[id]));
  assert.ok(pulse.voiceByClass[schoolClass.id]);
 }
});
test('daily evidence derived from fictional student classes and attendance events',()=>{
 assert.equal(DEMO_DAY,'2026-10-08');
 const cp=pulseForClass(d,pulse,c);
 assert.equal(cp.rows.length,20);
 assert.equal(cp.attendance.present+cp.attendance.late+cp.attendance.absent+cp.attendance.notRecorded,20);
 assert.equal(Object.values(cp.levels).reduce((a,n)=>a+n,0),20);
 assert.equal(cp.missing+cp.pending+cp.rows.filter(r=>r.evidence.task.status==='Submitted').length,20);
 assert.ok(classInsights(cp).every(x=>x.classId===c.id&&x.source&&x.metric&&x.description));
 assert.equal(flexibleGroups(cp).reduce((n,g)=>n+g.learners.length,0),20);
 assert.equal(teacherSchedule(d,teacher).date,DEMO_DAY);
 const timeline=studentTimeline(d,pulse,cp.students[0]);
 assert.ok(timeline.length>=3);
 assert.equal(timeline[0].date,'2026-10-08');
 assert.equal(todayStatus(d,cp.students[0].id).date,DEMO_DAY);
});
test('daily home, class pulse and learning evidence pages render useful information',()=>{
 const today=renderToday(ctx());
 assert.match(today,/Today’s Learning Pulse/);
 assert.match(today,/PREPARE FOR YOUR NEXT LESSON/);
 assert.match(today,/Signals for your next lesson/);
 assert.match(today,/Notice → Respond → Revisit/);
 assert.match(today,/FOLLOW-UP ACTIONS<\/span><strong>2<\/strong>/);
 assert.doesNotMatch(today,/http:\/\/localhost/);
 const cls=renderClass(ctx());
 assert.match(cls,/Class Pulse/);
 assert.match(cls,/Learner matrix/);
 assert.match(cls,/MAP growth/);
 assert.match(cls,/STUDENT VOICE/);
 assert.match(cls,/formative/i);
 const people=renderLearners(ctx());
 assert.match(people,/My Learners/);
 assert.match(people,/DEMO-0721/);
});
test('class filtering, temporary groups and programme-appropriate MAP states',()=>{
 const learn=renderClass(ctx({rosterFilter:'revisit'}));
 assert.match(learn,/Revisit \/ practise/);
 const groups=renderClass(ctx({classMode:'groups'}));
 assert.match(groups,/temporary, editable/);
 assert.match(groups,/Reset suggestions/);
 const growth=renderGrowth(ctx());
 assert.match(growth,/Progress before position/);
 assert.match(growth,/Growth by teaching group/);
 const early=d.teachers.find(t=>t.primaryPlc==='Pre-Kindergarten');
 const eclasses=d.classes.filter(c=>early.classIds.includes(c.id));
 const ectx={...ctx(),teacher:early,classes:eclasses,currentClass:eclasses[0],
   students:d.students.filter(s=>eclasses.some(c=>c.id===s.classId))};
 const noMap=renderGrowth(ectx);
 assert.match(noMap,/Learning evidence that fits the age and programme/);
});
test('learner view shows timeline, MAP growth and safe classroom support',()=>{
 const p=ctx();
 const profile=renderStudent(p,'DEMO-0721');
 assert.match(profile,/Connected evidence/i);
 assert.match(profile,/Recent learning timeline/);
 assert.match(profile,/FICTIONAL LEARNER PROFILE/);
 const m=renderStudent(ctx({studentTab:'map'}),'DEMO-0721');
 assert.match(m,/Observed MAP growth/);
 assert.match(m,/Explore underlying RIT achievement/);
 const s=renderStudent(ctx({studentTab:'support'}),'DEMO-0721');
 assert.match(s,/Practical guidance/);
 assert.match(s,/Full medical, counselling and safeguarding records never appear here/);
 assert.match(renderStudent(ctx(),'DEMO-0001'),/Outside current demo scope/);
});
test('actions support local persistence, teacher ownership and revisiting learning',()=>{
 resetPersonaDemo(teacher,storage);
 const seeds=loadActions(teacher,d.classes,storage);
 assert.equal(seeds.length,2);
 assert.equal(actionCounts(seeds).revisit,1);
 const action=createAction(teacher,d.classes,{classId:c.id,
  title:'Check explanations',strategy:'Use peer examples and ask students to explain their reasoning.',
  due:'2026-10-12',evidence:'Demo formative check'},storage);
 assert.equal(action.teacherId,teacher.id);
 const changed=updateAction(teacher,d.classes,action.id,{
  outcome:'Learners demonstrated understanding in follow-up examples.',
  status:'completed'},storage);
 assert.equal(changed.status,'completed');
 assert.match(changed.outcome,/Learners demonstrated/);
 assert.equal(loadActions(teacher,d.classes,storage).length,3);
 assert.ok(removeAction(teacher,d.classes,action.id,storage));
 assert.equal(loadActions(teacher,d.classes,storage).length,2);
 const other=d.teachers.find(t=>t.id!==teacher.id&&!t.classIds.includes(c.id));
 assert.ok(other);
 assert.throws(()=>createAction(other,d.classes,{classId:c.id,title:'Disallowed',strategy:'Nope',due:'2026-10-12'},storage),/outside/);
});
test('manual flexible-group assignments persist only for the current persona',()=>{
 const first=c.studentIds[0];
 assert.deepEqual(readGroupOverrides(teacher.id,c.id,storage),{});
 saveGroupOverrides(teacher.id,c.id,{[first]:'extend'},storage);
 assert.equal(readGroupOverrides(teacher.id,c.id,storage)[first],'extend');
 const other=d.teachers.find(t=>t.id!==teacher.id);
 assert.deepEqual(readGroupOverrides(other.id,c.id,storage),{});
 resetPersonaDemo(teacher,storage);
 assert.deepEqual(readGroupOverrides(teacher.id,c.id,storage),{});
});
test('actions and evidence drawer are visibly evidence-based and demo only',()=>{
 const p=ctx();
 const actions=renderActions(p);
 assert.match(actions,/Notice → Respond → Revisit/);
 assert.match(actions,/saved only in this browser/);
 const ci=classInsights(pulseForClass(d,pulse,c))[0];
 const drawer=renderInsightDrawer({...p,activeInsight:ci});
 assert.match(drawer,/WHY THIS APPEARS/);
 assert.match(drawer,/DECISION RULE/);
 assert.match(drawer,/not an AI-generated judgement/);
 const modal=renderActionModal({...p,state:{...p.state,actionModal:true,modalClassId:c.id}});
 assert.match(modal,/v2-create-form/);
 assert.match(modal,/do not use actual student information/i);
});