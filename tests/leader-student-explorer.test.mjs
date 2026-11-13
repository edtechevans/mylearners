import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {createMaiaDemoRecords} from '../src/maia-demo.mjs';
import {mapRitBand} from '../src/map-rit-achievement.mjs';
import {EXPLORER_DEFAULTS,explorerColumns,leaderExplorerModel,renderLeaderStudentExplorer,leaderExplorerExportRows} from '../src/leader-student-explorer.mjs';
import {csvContent} from '../src/dashboard-export.mjs';

const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const experience=createExperienceRecords(data.students);
const maia=createMaiaDemoRecords(data.students);
const model=filters=>leaderExplorerModel({data,academic,experience,filters});
test('Explorer starts with every school learner, A-Z by displayed name, without pagination',()=>{
 const result=model(EXPLORER_DEFAULTS);
 assert.equal(result.total,data.students.length);
 assert.equal(result.rows.length,result.total);
 assert.equal(result.shown.length,result.total);
 assert.equal(result.total,new Set(result.rows.map(row=>row.student.id)).size);
 for(let i=1;i<result.rows.length;i++)
  assert.ok(result.rows[i-1].student.name.localeCompare(result.rows[i].student.name,undefined,{numeric:true})<=0,
   'every learner should appear in alphabetical display-name order');
 const csv=leaderExplorerExportRows({data,academic,experience,filters:EXPLORER_DEFAULTS});
 assert.equal(csv.count,result.total);
 assert.equal(csv.rows.length,result.total);
 assert.ok(csv.headers.includes('MAP Mathematics percentile'));
});
test('Explorer filters grade, division, teacher, class, EAL and Learning Support',()=>{
 for(const division of ['Elementary','Secondary']){
  const filtered=model({division});
  assert.ok(filtered.total>0);
  assert.ok(filtered.rows.every(r=>r.student.division===division));
 }
 const grade=model({division:'Secondary',grade:'G7'});
 assert.ok(grade.total>0&&grade.rows.every(r=>r.student.grade==='G7'));
 const sample=data.teachers.find(t=>t.classIds.length);
 const teachers=model({teacher:sample.id});
 assert.ok(teachers.rows.length>0);
 assert.ok(teachers.rows.every(r=>sample.classIds.includes(r.student.classId)));
 const cls=data.classes.find(c=>c.grade==='G7');
 const group=model({classId:cls.id});
 assert.ok(group.rows.length>0&&group.rows.every(r=>r.student.classId===cls.id));
 assert.ok(model({eal:'active'}).rows.every(r=>['e1','e2','i3','i4','a5'].includes(r.support.eal)));
 assert.ok(model({learning:'yes'}).rows.every(r=>r.support?.hasLearning));
 assert.ok(model({learning:'no'}).rows.every(r=>!r.support?.hasLearning));
});
test('MAP achievement filtering uses percentile bands and strand descriptors independently',()=>{
 const low=model({mapTest:'Reading',band:'low'});
 assert.ok(low.total>0);
 assert.ok(low.rows.every(r=>mapRitBand(r.focus?.percentile)?.key==='low'));
 const both=model({mapTest:'Mathematics',band:'both'});
 assert.ok(both.total>=model({mapTest:'Mathematics',band:'low'}).total);
 assert.ok(both.rows.every(r=>['low','low-average'].includes(mapRitBand(r.focus?.percentile)?.key)));
 const base=model({grade:'G7',mapTest:'Reading'});
 const goal=base.goalNames[0];
 assert.ok(goal);
 const byGoal=model({grade:'G7',mapTest:'Reading',strand:goal});
 assert.ok(byGoal.total>0);
 assert.ok(byGoal.rows.every(r=>r.goal?.name===goal));
 const banded=model({grade:'G7',mapTest:'Reading',strand:goal,strandBand:'low'});
 assert.ok(banded.rows.every(r=>['Low','low'].includes(r.goal?.adjective)));
});
test('MAP RIT and strand RIT sorting preserve numeric values and missing results sort last',()=>{
 const filter={mapTest:'Reading',sort:'map:Reading',direction:'asc'};
 const sorted=model(filter).rows.map(r=>r.map.Reading?.rit??null);
 const nonmissing=sorted.filter(v=>v!==null);
 assert.deepEqual(nonmissing,nonmissing.slice().sort((a,b)=>a-b));
 assert.ok(model({...filter,direction:'desc'}).rows[0].map.Reading.rit>=nonmissing[0]);
});
test('Rendered Explorer has controls, MAP percentile tiles, exact grade-aware columns and export',()=>{
 const html=renderLeaderStudentExplorer({data,academic,experience,maia,filters:{grade:'G7',mapTest:'Mathematics'}});
 for(const key of ['division','grade','classId','teacher','subject','gradeFilter','eal','learning','mapTest','strand','band','strandBand'])
  assert.match(html,new RegExp('data-explorer-filter="'+key+'"'));
 assert.match(html,/data-explorer-student=/);
 assert.match(html,/data-export-dashboard/);
 assert.match(html,/MAP Math/);
 assert.match(html,/map-rit-(low|low-average|average|high-average|high)/);
 assert.match(html,/data-explorer-sort=/);
 assert.doesNotMatch(html,/>IEP<|>Medical<|>Behavioural</);
});
test('Schoolwide subjects use compact per-learner chips; G7 still has eight Faculty grade columns',()=>{
 const school=explorerColumns({grade:'All',division:'All',data});
 assert.equal(school.filter(c=>c.kind==='report').length,0);
 assert.ok(school.some(c=>c.kind==='schoolSubjects'));
 assert.ok(school.some(c=>c.kind==='mapSummary'));
 const allHtml=renderLeaderStudentExplorer({data,academic,experience,maia});
 assert.match(allHtml,/explorer-subject-chip-list/);
 assert.match(allHtml,/data-explorer-toggle-filters/);
 assert.match(allHtml,/explorer-advanced-filter-grid/);
 assert.match(allHtml,/id="explorer-advanced-filters" hidden/);
 assert.doesNotMatch(allHtml,/data-source-heading=/);
 const csv=leaderExplorerExportRows({data,academic,experience});
 assert.ok(csv.headers.includes('Subject grade · Early Literacy'));
 assert.ok(csv.headers.includes('Subject grade · Language & Literature'));
 assert.ok(csv.headers.includes('Subject grade · Mathematics'));
 assert.ok(csv.rows.length===data.students.length);
 const seven=explorerColumns({grade:'G7',division:'Secondary',data})
  .filter(c=>c.kind==='report').map(c=>c.subject);
 assert.deepEqual(seven,['Language & Literature','Mathematics','Sciences','Individuals & Societies',
  'Language Acquisition','Design','Arts','Physical & Health Education']);
 const html=renderLeaderStudentExplorer({data,academic,experience,maia,filters:{grade:'G7'}});
 for(const heading of ['L&amp;L','Math','Sciences','I&amp;S','LA','Design','VPA','PHE']){
  assert.ok(html.includes(heading),heading+' should appear as a Faculty-style subject heading');
 }
 assert.match(html,/explorer-grade evidence-heat band-(low|mid-low|mid-high|high)/);
 assert.match(html,/myp-best-fit-marker/);
});
test('Filtering removes nonmatching learners without dropping their other subject grade columns',()=>{
 const base=renderLeaderStudentExplorer({data,academic,experience,maia,filters:{grade:'G7'}});
 const narrow=model({grade:'G7',subject:'Mathematics',eal:'active'});
 assert.ok(narrow.total>0);
 assert.ok(narrow.rows.every(r=>r.student.grade==='G7'&&['e1','e2','i3','i4','a5'].includes(r.support?.eal)));
 const narrowed=renderLeaderStudentExplorer({data,academic,experience,maia,
  filters:{grade:'G7',subject:'Mathematics',eal:'active'}});
 for(const subject of ['Language & Literature','Sciences','Individuals & Societies','Design','Mathematics']){
  const key='data-source-heading="'+subject.replaceAll('&','&amp;')+'"';
  assert.ok(base.includes(key));
  assert.ok(narrowed.includes(key));
 }
 assert.equal((narrowed.match(/<tr><th scope="row">/g)||[]).length,narrow.total);
});
test('Subject-grade sorting and CSV export preserve every grade in the corresponding column',()=>{
 const sorted=model({grade:'G7',sort:'report:Mathematics'}).rows;
 const grades=sorted.map(row=>Number(row.report.subjects.find(item=>item.subject==='Mathematics').value));
 assert.deepEqual(grades,[...grades].sort((a,b)=>a-b));
 const selected={division:'Secondary',grade:'G7',eal:'active'};
 const source=model(selected);
 const csv=leaderExplorerExportRows({data,academic,experience,filters:selected});
 const mathIndex=csv.headers.indexOf('Subject grade · Mathematics');
 const sciencesIndex=csv.headers.indexOf('Subject grade · Sciences');
 assert.ok(mathIndex>=0&&sciencesIndex>=0);
 assert.equal(csv.rows.length,source.total);
 source.rows.forEach((row,i)=>{
  assert.equal(csv.rows[i][mathIndex],row.report.subjects.find(item=>item.subject==='Mathematics')?.value);
  assert.equal(csv.rows[i][sciencesIndex],row.report.subjects.find(item=>item.subject==='Sciences')?.value);
 });
});
test('Selecting a strand descriptor with no named strand finds matching MAP goal results',()=>{
 for(const testName of ['Reading','Mathematics','Language Usage']){
  const low=model({mapTest:testName,strandBand:'low'});
  assert.ok(low.total>0,testName+' should find low goal results');
  assert.ok(low.rows.every(r=>r.goalHits.length>0&&r.goalHits.every(hit=>hit.subject===testName&&hit.band==='low')));
  const rendered=renderLeaderStudentExplorer({data,academic,experience,maia,filters:{mapTest:testName,strandBand:'low'}});
  assert.match(rendered,/Matching MAP strand/);
  assert.match(rendered,/explorer-strand-rit/);
 }
 const any=model({mapTest:'all',strandBand:'both'});
 assert.ok(any.total>0);
 assert.ok(any.rows.every(r=>r.goalHits.some(h=>['low','low-average'].includes(h.band))));
});
test('All MAP test low-band results show which MAP subject actually matched',()=>{
 const low=model({mapTest:'all',band:'low'});
 assert.ok(low.total>0);
 assert.ok(low.rows.every(r=>r.bandHits.length>0&&r.bandHits.every(h=>h.band.key==='low')));
 const html=renderLeaderStudentExplorer({data,academic,experience,maia,filters:{mapTest:'all',band:'low'}});
 assert.match(html,/MAP band match/);
 assert.match(html,/explorer-band map-rit-low/);
 assert.match(html,/(Math|Reading|Language) · Low/);
});
test('Numeric subject thresholds and Elementary descriptors do not mix scales',()=>{
 const two=model({grade:'G7',subject:'Mathematics',gradeFilter:'numeric-2'});
 assert.ok(two.total>0);
 assert.ok(two.rows.every(r=>r.report.scale==='1–7'&&Number(r.reportItem.value)<=2));
 const any=model({grade:'G7',gradeFilter:'numeric-3'});
 assert.ok(any.total>=two.total);
 assert.ok(any.rows.every(r=>r.report?.subjects.some(item=>Number(item.value)<=3)));
 const early=model({grade:'G2',gradeFilter:'emerging'});
 assert.ok(early.total>0);
 assert.ok(early.rows.every(r=>r.report?.scale!=='1–7'&&r.report.subjects.some(item=>item.value==='Emerging')));
 assert.equal(model({grade:'G2',gradeFilter:'numeric-2'}).total,0);
});
test('Full-school roster exposes a single learner tab stop and retains all names',()=>{
 const html=renderLeaderStudentExplorer({data,academic,experience,maia});
 assert.equal((html.match(/class="student-link" data-explorer-student=/g)||[]).length,data.students.length);
 assert.equal((html.match(/tabindex="0" class="student-link"/g)||[]).length,1);
});
test('App wires Explorer and colour-only headline indices without surfacing raw index numbers',()=>{
 const code=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(code,/renderLeaderStudentExplorer/);
 assert.match(code,/leaderExplorerExportRows/);
 assert.match(code,/sitewide-export-action/);
 assert.doesNotMatch(code,/kpi\('MAP Mathematics growth'/);
 assert.match(html,/leader-student-explorer\.css/);
});
test('CSV encodes quoted values and prevents spreadsheet formula injection',()=>{
 const csv=csvContent([['Student','Expression'],['A, B','=1+1'],['X "Y"','safe']]);
 assert.match(csv,/"A, B","'=1\+1"/);
 assert.match(csv,/"X ""Y""","safe"/);
});
