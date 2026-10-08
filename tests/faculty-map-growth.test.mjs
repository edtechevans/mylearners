import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,attendanceSummary} from '../src/data.mjs';
import {applyFacultyDemo,facultyId,DEFAULT_TEACHER_ID} from '../src/faculty-demo.mjs';
import {FACULTY_NAMES,FACULTY_PLCS} from '../src/staff.mjs';
import {MAP_SUBJECTS,subjectMapRecords,latestMapGrowth,mapGrowthSeries,mapGrowthSummary,growthFormat} from '../src/map-growth.mjs';
import {renderGrowthCell,renderGrowthProfile} from '../src/map-growth-ui.mjs';

const d=applyFacultyDemo(generateDemoData());
test('faculty selector uses 115 Observations working roster names without importing evaluation data',()=>{
 const directory=new Set(Object.values(FACULTY_PLCS).flat());
 assert.equal(FACULTY_NAMES.length,115);
 assert.equal(directory.size,115);
 assert.equal(d.teachers.length,115);
 assert.equal(new Set(d.teachers.map(t=>t.name)).size,115);
 assert.deepEqual(new Set(d.teachers.map(t=>t.name)),directory);
 assert.ok(d.teachers.every(t=>t.assignmentsFictional===true&&t.classIds.length>0));
 assert.ok(d.teachers.every(t=>!('observation' in t)&&!('email' in t)&&!('rating' in t)));
 assert.ok(!d.teachers.some(t=>t.name==='Silky Vyas'||t.name==='Santisha Sonilal'));
});
test('working PLC affiliations inform fictional classroom leads while all students remain synthetic',()=>{
 assert.equal(d.students.length,1200);
 assert.equal(d.classes.length,60);
 assert.equal(d.classAssignmentsFictional,true);
 for(const c of d.classes){
  const staff=d.teachers.find(t=>t.id===c.teacherId);
  assert.ok(staff,'No demo faculty lead for '+c.id);
  assert.ok(staff.classIds.includes(c.id));
  assert.equal(c.studentIds.length,20);
  if(c.grade==='PK3'||c.grade==='PK4')assert.ok(staff.plcs.includes('Pre-Kindergarten'));
  else if(c.grade==='K')assert.ok(staff.plcs.includes('Kindergarten'));
  else if(['G1','G2','G3','G4','G5'].includes(c.grade))assert.ok(staff.plcs.includes('Grade '+c.grade.slice(1)));
  else if(c.section==='A')assert.ok(staff.plcs.includes('Secondary Mathematics'));
 }
 assert.equal(d.classIndex.get('G7-A').teacherId,facultyId('Zach Navarro'));
 assert.equal(d.defaultTeacherId,undefined);
 assert.equal(DEFAULT_TEACHER_ID,facultyId('Zach Navarro'));
 assert.ok(d.students.every(s=>s.id.startsWith('DEMO-')));
});
test('MAP growth calculations use comparable prior results and simulated projected points',()=>{
 const student=d.userIndex.get('DEMO-0721');
 assert.equal(student.grade,'G7');
 const math=subjectMapRecords(d.map[student.id],'Mathematics');
 assert.ok(math.length>2);
 const grow=latestMapGrowth(d.map[student.id],'Mathematics');
 assert.equal(grow.status,'comparable');
 assert.equal(grow.actual,grow.current.rit-grow.previous.rit);
 assert.equal(grow.projected,grow.current.projection);
 assert.equal(grow.delta,grow.actual-grow.projected);
 assert.equal(grow.met,grow.actual>=grow.projected);
 assert.ok(/^[+\-]?\d+$/.test(growthFormat(grow.actual)));
 const series=mapGrowthSeries(d.map[student.id],'Mathematics');
 assert.equal(series.length,math.length-1);
 for(const term of series)assert.equal(term.actual,term.currentRit-term.previousRit);
});
test('MAP eligibility, first tests and missing current results do not invent growth',()=>{
 assert.equal(latestMapGrowth(d.map['DEMO-0001']).status,'not-assessed');
 const grade3=d.students.find(s=>s.grade==='G3');
 const g=latestMapGrowth(d.map[grade3.id],'Mathematics');
 assert.equal(g.status,'no-comparison');
 assert.equal(g.actual,null);
 const missing=d.students.find(s=>d.map[s.id].length>0&&!d.map[s.id].some(r=>r.key==='F26'));
 assert.ok(missing);
 const absent=latestMapGrowth(d.map[missing.id],'Mathematics');
 assert.equal(absent.status,'missing-current');
 assert.equal(absent.actual,null);
});
test('MAP class and school comparison denominators exclude missing results and first tests',()=>{
 const ids=d.students.filter(s=>s.grade==='G7').map(s=>s.id);
 const summary=mapGrowthSummary(ids,d.map);
 assert.ok(summary.comparable>0);
 assert.ok(summary.met>=0&&summary.met<=summary.comparable);
 assert.equal(summary.rate,Math.round(summary.met/summary.comparable*100));
 const noMap=d.students.filter(s=>s.grade==='PK3').map(s=>s.id);
 const empty=mapGrowthSummary(noMap,d.map);
 assert.equal(empty.comparable,0);
 assert.equal(empty.rate,null);
});
test('MAP profile foregrounds observed/projection growth and keeps RIT in collapsed detail',()=>{
 const rows=d.map['DEMO-0721'];
 const html=renderGrowthProfile(rows,'Mathematics',()=>'<svg><polyline/></svg>');
 assert.match(html,/Observed MAP growth/);
 assert.match(html,/Difference from projection/);
 assert.match(html,/Growth across testing windows/);
 assert.match(html,/<details class="rit-details">/);
 assert.ok(html.indexOf('Observed MAP growth')<html.indexOf('Latest available RIT'));
 const roster=renderGrowthCell(rows);
 assert.match(roster,/pts/);
 assert.match(roster,/projected/);
});
