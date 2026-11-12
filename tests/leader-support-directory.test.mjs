import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData,GRADES} from '../src/data.mjs';
import {supportStatusForStudent,matchesSupportStatus} from '../src/learner-support-status.mjs';
import {
 leaderSupportDirectoryModel,renderLeaderSupportDirectory,LEADER_DIRECTORY_PAGE_SIZE,
 leaderDirectoryOptions
} from '../src/leader-support-directory.mjs';
import {demoTagsForStudent} from '../src/learner-tags.mjs';

const students=generateDemoData().students;
const supported=students.filter(s=>matchesSupportStatus(s,'has-support'));
const defaults=()=>leaderSupportDirectoryModel(students,{});
test('directory starts with supported demo learners, sorted by grade and surname',()=>{
 const result=defaults();
 assert.ok(result.total>LEADER_DIRECTORY_PAGE_SIZE);
 assert.equal(result.total,supported.length);
 assert.equal(result.shown.length,LEADER_DIRECTORY_PAGE_SIZE);
 assert.equal(result.counts.learners,result.total);
 assert.ok(result.shown.every(s=>supportStatusForStudent(s)));
 assert.ok(result.matches.every(s=>matchesSupportStatus(s,'has-support')));
 const grades=result.matches.map(s=>GRADES.indexOf(s.grade));
 assert.deepEqual(grades,grades.slice().sort((a,b)=>a-b));
 const all=leaderSupportDirectoryModel(students,{expanded:true});
 assert.equal(all.shown.length,supported.length);
 assert.equal(all.total,defaults().total);
});
test('leaders can filter division, grade, tier, EAL, SST and search in combination',()=>{
 const division=leaderSupportDirectoryModel(students,{division:'Secondary'});
 assert.ok(division.matches.length>0);
 assert.ok(division.matches.every(s=>s.division==='Secondary'));
 const grade=division.grades.find(g=>students.some(s=>s.division==='Secondary'&&s.grade===g));
 assert.ok(grade);
 const gradeRows=leaderSupportDirectoryModel(students,{division:'Secondary',grade});
 assert.ok(gradeRows.matches.every(s=>s.grade===grade&&s.division==='Secondary'));
 for(const status of ['learning','tier-1','tier-2','tier-3','sst-monitoring',
  'sst-intervention','sst-plan','eal-active','eal-monitor-y1','eal-exited']){
  const filtered=leaderSupportDirectoryModel(students,{status,expanded:true});
  assert.ok(filtered.matches.length>0,status+' should have synthetic examples');
  assert.ok(filtered.matches.every(s=>matchesSupportStatus(s,status)));
 }
 const name=division.matches[0].name;
 const q=leaderSupportDirectoryModel(students,{division:'Secondary',query:name.toUpperCase()});
 assert.ok(q.matches.length>=1);
 assert.ok(q.matches.every(s=>s.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())));
 const impossible=leaderSupportDirectoryModel(students,{division:'Elementary',grade:'G12'});
 assert.equal(impossible.grade,'All','invalid division-grade pairing is normalized');
});
test('directory uses one support status per record and does not surface retired labels',()=>{
 const html=renderLeaderSupportDirectory({students,filters:{}});
 assert.match(html,/Support Student Directory/);
 assert.match(html,/data-leader-directory-search/);
 assert.match(html,/data-leader-directory-filter="division"/);
 assert.match(html,/data-leader-directory-filter="grade"/);
 assert.match(html,/data-leader-directory-filter="status"/);
 assert.match(html,/data-leader-directory-student="DEMO-/);
 assert.match(html,/data-leader-directory-expand/);
 assert.match(html,/Show all/);
 assert.doesNotMatch(html,/>IEP<|>Medical<|>Behavioural</);
 assert.doesNotMatch(html,/legacy-medical|legacy-iep|legacy-behavioural/);
 const narrower=renderLeaderSupportDirectory({students,filters:{grade:'G7',status:'tier-2'},showDivision:false});
 assert.doesNotMatch(narrower,/data-leader-directory-filter="division"/);
 assert.match(narrower,/value="G7" selected/);
 assert.match(narrower,/value="tier-2" selected/);
 assert.match(narrower,/View profile/);
});
test('directory refuses non-demo and forged student records',()=>{
 const forged=[...students,{...students[0],id:'REAL-123',name:'Private Child'}];
 const result=leaderSupportDirectoryModel(forged,{status:'all',expanded:true});
 assert.equal(result.total,students.length);
 assert.ok(!result.matches.some(s=>s.name==='Private Child'));
 assert.doesNotMatch(renderLeaderSupportDirectory({students:forged,filters:{query:'Private'}}),/Private Child/);
});
test('active dashboards suppress IEP, Medical, Behavioural tags while keeping other support information',()=>{
 const app=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
 const sss=readFileSync(new URL('../src/sss-view.mjs',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(app,/visibleGuidance=tags\.filter\(t=>t\.id==='eal'\|\|t\.id==='ss'\)/);
 assert.doesNotMatch(app,/legacySupportBadges\(x\.tags\)/);
 assert.match(sss,/learningTags=demoTagsForStudent\(student\)\.filter\(tag=>tag\.id==='eal'\|\|tag\.id==='ss'\)/);
 assert.doesNotMatch(sss,/Other fictional guidance indicators:/);
 assert.match(app,/renderLeaderSupportDirectory\(\{students:group,filters:leaderDirectoryFilters\(\),showDivision:true\}\)/);
 assert.match(app,/renderLeaderSupportDirectory\(\{students:group,filters:leaderDirectoryFilters\(\),showDivision:false\}\)/);
 assert.match(index,/leader-support-directory\.css/);
 // Synthetic legacy flags remain in the test-only adapter so removing them
 // from the dashboard does not irreversibly delete reference options.
 assert.ok(students.some(s=>demoTagsForStudent(s).some(t=>t.id==='iep')));
});
test('filter options include a clear default and every option is available to Leaders',()=>{
 const ids=leaderDirectoryOptions.map(x=>x[0]);
 assert.ok(ids.includes('has-support')&&ids.includes('tier-3')&&ids.includes('eal-monitor-y2'));
 assert.equal(ids.length,new Set(ids).size);
});
