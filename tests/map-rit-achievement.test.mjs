import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {MAP_RIT_SUBJECTS,MAP_RIT_WINDOWS,mapRitBand,mapRitCurrent,mapRitHistory,renderMapRitHeader,renderMapRitCell,renderMapRitProfile,renderMapRitTooltip} from '../src/map-rit-achievement.mjs';
const data=generateDemoData();

test('Five NWEA-style achievement quintiles have exact percentile boundaries',()=>{
 for(const [p,key] of [[1,'low'],[20,'low'],[21,'low-average'],[40,'low-average'],[41,'average'],[60,'average'],[61,'high-average'],[80,'high-average'],[81,'high'],[99,'high']])
  assert.equal(mapRitBand(p)?.key,key);
 for(const invalid of [-1,0,100,null,undefined,20.5,'85'])assert.equal(mapRitBand(invalid),null);
});
test('Three RIT subjects replace the everyday MAP Math growth column',()=>{
 const cols=everydayEvidenceForGrade('G7');
 assert.deepEqual(cols.filter(c=>c.kind==='mapRit').map(c=>c.subject),MAP_RIT_SUBJECTS);
 assert.ok(!cols.some(c=>c.label==='MAP Mathematics growth'||c.kind==='map'));
 assert.ok(everydayEvidenceForGrade('G2').every(c=>c.kind!=='mapRit'));
 assert.ok(everydayEvidenceForGrade('G11').every(c=>c.kind!=='mapRit'));
});
test('Current RIT tiles show the score, and band is based on percentile',()=>{
 const student=data.students.find(s=>s.grade==='G7'&&data.map[s.id].some(r=>r.key==='F26'));
 for(const subject of MAP_RIT_SUBJECTS){
  const current=mapRitCurrent(data.map[student.id],subject);
  assert.ok(current&&Number.isInteger(current.rit));
  const html=renderMapRitCell(data.map[student.id],subject,student.id);
  assert.match(html,new RegExp('>'+current.rit+'</strong>'));
  assert.match(html,new RegExp('map-rit-'+mapRitBand(current.percentile).key));
  assert.match(html,/data-student=/);
  assert.match(html,/Spring 2026/);
 }
});
test('Missing test windows stay missing, and four requested windows remain ordered',()=>{
 assert.deepEqual(MAP_RIT_WINDOWS.map(w=>w.key),['S25','F25','S26','F26']);
 const missing=data.students.find(s=>data.map[s.id].length&&!data.map[s.id].some(r=>r.key==='F26'));
 assert.ok(missing);
 assert.equal(mapRitCurrent(data.map[missing.id],'Mathematics'),null);
 assert.match(renderMapRitCell(data.map[missing.id],'Mathematics',missing.id),/No F26 test/);
 assert.equal(mapRitHistory(data.map[missing.id],'Mathematics').at(-1).record,null);
});
test('Headers and learner profiles explain five bands and four periods',()=>{
 assert.match(renderMapRitHeader('Language Usage'),/data-map-rit-subject="Language Usage"/);
 const help=renderMapRitTooltip('Language Usage');
 for(const term of ['Low Average','High Average','81–99'])assert.ok(help.includes(term));
 const student=data.students.find(s=>s.grade==='G7');
 const profile=renderMapRitProfile(data.map[student.id]);
 for(const subject of MAP_RIT_SUBJECTS)assert.ok(profile.includes('MAP '+subject));
 for(const w of MAP_RIT_WINDOWS)assert.ok(profile.includes(w.label));
 assert.match(profile,/FICTIONAL MAP DATA/);
 assert.equal(renderMapRitProfile(data.map[data.students.find(s=>s.grade==='G1').id]),'');
});
