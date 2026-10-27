import test from 'node:test';
import assert from 'node:assert/strict';
import {GRADES,gradeNumber,generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor,academicModesFor,academicCoverage,latestAcademic,
 REPORT_PERIODS,ACADEMIC_CHECKINS,PRIMARY_DESCRIPTORS,READING_LEVELS} from '../src/academic-journey-data.mjs';
import {renderAcademicProfile,renderClassAcademicPanel,classAcademicCell} from '../src/academic-journey-view.mjs';
const DATA=applyFacultyDemo(generateDemoData());
const records=createAcademicDemoRecords(DATA.students);
const grade=g=>DATA.students.filter(s=>s.grade===g);
const first=g=>grade(g)[0];

test('All 1,200 fictional learners have one internally consistent record, never real identifiers',()=>{
 assert.equal(records.size,1200);
 assert.equal(new Set([...records.keys()]).size,1200);
 assert.ok([...records.keys()].every(id=>/^DEMO-\d{4}$/.test(id)));
 const serialized=JSON.stringify([...records.values()]);
 assert.doesNotMatch(serialized,/@aisgz\.org|StudentID|@gmail\.com|dateOfBirth|auth_token|School Report PDF|\.xlsx|\.csv/);
 assert.equal(REPORT_PERIODS.length,3);
 assert.equal(ACADEMIC_CHECKINS.length,3);
});
test('Grade eligibility is exactly IXL G1–10 and Core Phonics/F&P K–5',()=>{
 assert.equal(academicModesFor('PK3').join(','),'report');
 assert.equal(academicModesFor('PK4').join(','),'report');
 assert.equal(academicModesFor('K').join(','),'report,core,fp');
 assert.equal(academicModesFor('G1').join(','),'report,ixl,core,fp');
 assert.equal(academicModesFor('G5').join(','),'report,ixl,core,fp');
 assert.equal(academicModesFor('G6').join(','),'report,ixl');
 assert.equal(academicModesFor('G10').join(','),'report,ixl');
 assert.equal(academicModesFor('G11').join(','),'report');
 assert.equal(academicModesFor('G12').join(','),'report');
 let ixls=0,cores=0,fps=0;
 for(const student of DATA.students){
  const n=gradeNumber(student.grade),rec=academicFor(records,student.id);
  assert.equal(rec.ixl.length>0,n>=1&&n<=10,student.id);
  assert.equal(rec.core.length>0,n>=0&&n<=5,student.id);
  assert.equal(rec.fp.length>0,n>=0&&n<=5,student.id);
  if(rec.ixl.length)ixls++;
  if(rec.core.length)cores++;
  if(rec.fp.length)fps++;
 }
 assert.deepEqual([ixls,cores,fps],[800,480,480]);
});
test('Every report year is completed, within enrolment, aligned to the correct prior grade',()=>{
 const years=['2025–26','2024–25','2023–24'];
 for(const student of DATA.students){
  const rec=academicFor(records,student.id);
  assert.ok(rec.reports.length<=3);
  assert.ok(rec.reports.every(r=>years.includes(r.year)&&r.end<=2026));
  assert.deepEqual(rec.reports.map(r=>r.end),[...rec.reports.map(r=>r.end)].sort((a,b)=>b-a));
  for(const report of rec.reports){
   assert.ok(report.issued&&report.simulated);
   assert.ok(Number(student.enrolledDate.slice(0,4))<=report.end-1);
   assert.equal(GRADES.indexOf(report.grade),GRADES.indexOf(student.grade)-(2027-report.end));
   assert.ok(report.subjects.length>=5,report.year+'/'+student.grade);
   for(const item of report.subjects){
    assert.equal(item.framework,report.framework);
    assert.equal(item.scale,report.scale);
    if(report.scale==='descriptors')assert.ok(PRIMARY_DESCRIPTORS.includes(item.value));
    else assert.ok(/^[1-7]$/.test(item.value));
   }
  }
 }
 assert.equal(academicFor(records,first('PK3').id).reports.length,0,'No invented issued reports for PK3');
 const six=academicFor(records,first('G6').id).reports[0];
 assert.equal(six.grade,'G5');
 assert.equal(six.framework,'Elementary learning continuum');
 const seven=academicFor(records,first('G7').id).reports[0];
 assert.equal(seven.framework,'IB MYP');
 const twelve=academicFor(records,first('G12').id).reports[0];
 assert.equal(twelve.framework,'IB Diploma');
});
test('IXL snapshots are diagnostic-style levels, Core is item counts and F&P is a text letter',()=>{
 for(const student of DATA.students){
  const rec=academicFor(records,student.id);
  for(const item of rec.ixl){
   assert.ok(item.level>=80&&item.level<=1150&&Number.isInteger(item.level));
   assert.ok(item.year<=2026&&item.year>=2024&&item.measure.includes('diagnostic level'));
  }
  for(const item of rec.core){
   assert.equal(item.assessed,50);
   assert.ok(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<=50);
   assert.ok(item.measure.includes('not a published CORE Phonics total'));
  }
  for(const item of rec.fp){
   assert.ok(READING_LEVELS.includes(item.level));
   assert.match(item.measure,/not a grade or percentile/);
  }
 }
 assert.equal(latestAcademic(academicFor(records,first('K').id),'ixl'),null);
 assert.ok(latestAcademic(academicFor(records,first('K').id),'core'));
 assert.ok(latestAcademic(academicFor(records,first('G1').id),'ixl'));
 assert.equal(latestAcademic(academicFor(records,first('G11').id),'core'),null);
});
test('Report-card subject selection changes teacher roster values from the same source',()=>{
 const g3=grade('G3');
 const report=academicFor(records,g3[0].id).reports[0];
 const math=latestAcademic(academicFor(records,g3[0].id),'report','Mathematics');
 const science=latestAcademic(academicFor(records,g3[0].id),'report','Science');
 assert.ok(report.subjects.some(x=>x.subject==='Mathematics'));
 assert.ok(report.subjects.some(x=>x.subject==='Science'));
 assert.ok(math&&science);
 const mathCell=classAcademicCell(g3[0],records,'report','Mathematics');
 const sciCell=classAcademicCell(g3[0],records,'report','Science');
 assert.match(mathCell,new RegExp(math.value));
 assert.match(sciCell,new RegExp(science.value));
 assert.match(mathCell,/academic-roster-report/);
 const html=renderClassAcademicPanel(g3,records,'report','Science');
 assert.match(html,/academic-class-panel/);
 assert.match(html,/data-academic-subject/);
 assert.match(html,/option value="Science" selected/);
 assert.match(html,/Academic snapshot/);
 assert.match(html,/80 <small>of 80 learners with a result/);
 assert.match(html,/academic-distribution-track/);
 assert.match(html,/data-academic-mode="ixl"/);
 assert.match(html,/data-academic-mode="core"/);
 assert.match(html,/data-academic-mode="fp"/);
});
test('Every grade and fictional class has a valid class snapshot; no ineligible tabs',()=>{
 for(const cls of DATA.classes){
  const students=cls.studentIds.map(id=>DATA.userIndex.get(id));
  const modes=academicModesFor(cls.grade);
  const html=renderClassAcademicPanel(students,records,'report','Mathematics');
  assert.match(html,/academic-class-panel/);
  assert.equal((html.match(/data-academic-mode="/g)||[]).length,modes.length);
  if(cls.grade==='K'){
   assert.doesNotMatch(html,/data-academic-mode="ixl"/);
   assert.match(html,/data-academic-mode="fp"/);
  }
  if(cls.grade==='G12')assert.doesNotMatch(html,/data-academic-mode="core"/);
  if(cls.grade==='PK3')assert.match(html,/No completed reports yet|No completed reports yet/);
 }
});
test('Student profile displays all latest report subjects and 2–3 year history where eligible',()=>{
 for(const g of ['PK3','PK4','K','G1','G2','G3','G5','G6','G10','G11','G12']){
  const student=first(g);
  const rec=academicFor(records,student.id);
  const html=renderAcademicProfile(student,records,true);
  assert.match(html,/My school reports/);
  assert.match(html,/Fictional demonstration/);
  assert.equal((html.match(/data-academic-report-year="/g)||[]).length,rec.reports.length,g);
  if(rec.reports.length){
   for(const subject of rec.reports[0].subjects)assert.ok(html.includes(subject.subject.replaceAll('&','&amp;')),g+': '+subject.subject);
   assert.match(html,/Reporting frameworks may change/);
  }else assert.match(html,/No issued reports yet/);
  if(gradeNumber(g)>=1&&gradeNumber(g)<=10)assert.match(html,/IXL Mathematics/);
  if(gradeNumber(g)>=0&&gradeNumber(g)<=5){
   assert.match(html,/Core Phonics/);
   assert.match(html,/F&amp;P Reading|F&P Reading/);
  }
  assert.doesNotMatch(html,/\.csv|\.xlsx|@aisgz\.org|No real students/i);
 }
});
test('Selected historical report year re-renders year-specific subject list, not current-year grades',()=>{
 const student=first('G12');
 const rec=academicFor(records,student.id);
 const oldest=rec.reports.at(-1);
 const html=renderAcademicProfile(student,records,false,oldest.year);
 assert.match(html,/Report card grades/);
 assert.match(html,new RegExp('class="academic-report-meta"><strong>'+oldest.year));
 assert.match(html,new RegExp(oldest.framework));
 assert.match(html,new RegExp(oldest.grade));
 assert.equal((html.match(/class="academic-subject-result"/g)||[]).length,oldest.subjects.length);
 assert.match(html,/not be averaged or compared directly across programmes/);
});
test('Class coverage counts reconcile, without replacing missing values with zeros',()=>{
 for(const g of ['K','G3','G7','G11']){
  const ss=grade(g),allowed=academicModesFor(g);
  for(const mode of allowed){
   const subject=academicFor(records,ss[0].id).reports[0]?.subjects[0]?.subject||'Mathematics';
   const cov=academicCoverage(ss,records,mode,subject);
   assert.equal(cov.eligible,80);
   assert.ok(cov.available>0&&cov.available<=80);
  }
 }
 const p3=academicCoverage(grade('PK3'),records,'report','Early Literacy');
 assert.equal(p3.available,0);
});
