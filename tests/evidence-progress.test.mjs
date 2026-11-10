import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor} from '../src/academic-journey-data.mjs';
import {createExperienceRecords,experienceFor} from '../src/experience-data.mjs';
import {createMaiaDemoRecords} from '../src/maia-demo.mjs';
import {reportProgress,issuedReportProgress,academicCheckinProgress,mapProgress,
 experienceProgress,groupExperienceProgress,maiaProgress} from '../src/evidence-progress.mjs';

const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const experience=createExperienceRecords(data.students);
const maia=createMaiaDemoRecords(data.students);
const g=grade=>data.students.filter(s=>s.grade===grade);
test('report preview shows same subject and same programme only, newest year last',()=>{
 const s=g('G9').find(s=>{
  const record=academicFor(academic,s.id);
  return record.reports.some(r=>r.framework==='IB MYP'&&
   r.subjects.some(x=>x.subject==='Mathematics'));
 });
 assert.ok(s);
 const rec=academicFor(academic,s.id);
 const view=reportProgress(rec,'Mathematics');
 assert.equal(view.points.at(-1).label,'2026–27');
 assert.equal(view.points.at(-1).value,
  rec.workingReport.subjects.find(x=>x.subject==='Mathematics').value);
 assert.ok(view.points.length>=2);
 assert.ok(view.points.every(x=>/^202[3-6]–2[4-7]$/.test(x.label)));
 assert.ok(!JSON.stringify(view).includes('TEST DATA'));
 const six=g('G6')[0];
 assert.equal(reportProgress(academicFor(academic,six.id),'Mathematics').points.length,1,
  'No G5 developmental descriptor may be compared against an MYP number');
 const eleven=g('G11')[0];
 assert.equal(reportProgress(academicFor(academic,eleven.id),'Mathematics').points.length,1,
  'MYP and DP must remain separate even when both display 1–7');
});
test('historical profile hover stops at selected issued report year',()=>{
 const s=g('G9').find(x=>academicFor(academic,x.id).reports.length>0);
 const rec=academicFor(academic,s.id);
 const current=rec.reports[0];
 const x=issuedReportProgress(rec,'Mathematics',current.year);
 assert.equal(x.points.at(-1).label,current.year);
 assert.ok(x.points.every(v=>v.label!=='2026–27'));
});
test('IXL, Core and F&P use their own existing windows and do not invent levels',()=>{
 for(const [grade,mode] of [['G7','ixl'],['G4','core'],['G4','fp']]){
  const student=g(grade).find(s=>academicFor(academic,s.id)[mode].length>=2);
  assert.ok(student,mode);
  const rec=academicFor(academic,student.id);
  const view=academicCheckinProgress(rec,mode);
  assert.equal(view.points.at(-1).label,rec[mode].at(-1).date);
  if(mode==='fp')assert.equal(view.change,null,'letter levels are not numeric grade points');
  else assert.ok(view.change&&view.change.from);
 }
});
test('MAP mini-history uses valid chronological RIT scores, not quartile labels',()=>{
 const s=g('G7').find(s=>Array.isArray(data.map[s.id])&&
  data.map[s.id].some(r=>r.key==='F26'&&r.subject==='Mathematics'));
 assert.ok(s);
 const view=mapProgress(data.map[s.id],'Mathematics');
 assert.equal(view.points.at(-1).label,'Fall 2026');
 assert.equal(view.points.at(-1).value,
  String(data.map[s.id].find(r=>r.key==='F26'&&r.subject==='Mathematics').rit));
 assert.ok(view.change?.value.endsWith(' RIT'));
 assert.ok(!JSON.stringify(view).includes('Q1'));
 assert.equal(mapProgress([], 'Mathematics').points.length,0);
});
test('individual and group check-ins use real previous windows and two decimals',()=>{
 const s=g('G7').find(s=>experienceFor(experience,s.id,'engagement','F26')&&
  experienceFor(experience,s.id,'engagement','S26'));
 assert.ok(s);
 const individual=experienceProgress(experience,s.id,'engagement','F26');
 assert.equal(individual.points.at(-1).label,'Fall 2026');
 assert.match(individual.points.at(-1).value,/^[+-]?\d+\.\d{2}$/);
 assert.ok(individual.change?.from);
 const group=groupExperienceProgress(experience,g('G7'),'belonging','F26');
 assert.ok(group.points.length>=2);
 const early=experienceProgress(experience,s.id,'engagement','F25');
 assert.ok(early.points.length<=1);
});
test('Maia dimension trends are separate from student experience indices',()=>{
 const s=g('G7').find(s=>maiaProgress(maia,s.id,'relationships').points.length===2);
 assert.ok(s);
 const trend=maiaProgress(maia,s.id,'relationships');
 assert.equal(trend.points.at(-1).label,'Fall 2026');
 assert.ok(trend.points.at(-1).value.endsWith(' / 10'));
 assert.ok(trend.change?.value.endsWith(' points'));
});
