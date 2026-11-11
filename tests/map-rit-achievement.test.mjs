import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {MAP_RIT_SUBJECTS,MAP_RIT_WINDOWS,mapRitBand,mapRitCurrent,mapRitChange,mapRitChangeLabel,mapRitHistory,renderMapRitHeader,renderMapRitCell,renderMapRitProfile,renderMapRitTooltip} from '../src/map-rit-achievement.mjs';
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
  assert.match(html,/since Spring 2026/);
  assert.doesNotMatch(html, /map-rit-percentile| title=/);
  assert.match(html, /aria-label="MAP /);
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
 const mathHeader=renderMapRitHeader('Mathematics');
 assert.match(mathHeader,/>Math<\/span>/);
 assert.doesNotMatch(mathHeader,/\stitle=/);
 assert.doesNotMatch(mathHeader,/map-rit-head-unit/);
 const help=renderMapRitTooltip('Language Usage');
 for(const term of ['Low Average','High Average','81–99'])assert.ok(help.includes(term));
 const student=data.students.find(s=>s.grade==='G7');
 const profile=renderMapRitProfile(data.map[student.id]);
 for(const subject of MAP_RIT_SUBJECTS)assert.ok(profile.includes('MAP '+(subject==='Mathematics'?'Math':subject)));
 for(const w of MAP_RIT_WINDOWS)assert.ok(profile.includes(w.label));
 assert.match(profile,/FICTIONAL MAP DATA/);
 assert.equal(renderMapRitProfile(data.map[data.students.find(s=>s.grade==='G1').id]),'');
});

test('Each MAP RIT score shows observed growth since the latest earlier valid same-subject test',()=>{
 const a={subject:'Reading',window:'Spring 2026',key:'S26',date:'2026-04-22',rit:211,percentile:50,status:'valid',simulated:true};
 const b={subject:'Reading',window:'Fall 2026',key:'F26',date:'2026-09-16',rit:218,percentile:85,status:'valid',simulated:true};
 const rows=[a,b];
 const result=mapRitChange(rows,'Reading');
 assert.equal(result.current.rit,218);
 assert.equal(result.previous.rit,211);
 assert.equal(result.delta,7);
 assert.equal(mapRitChangeLabel(result.delta),'+7 RIT');
 const html=renderMapRitCell(rows,'Reading','DEMO-test');
 assert.match(html,/map-rit-high/,'Achievement colour comes from percentile 85');
 assert.match(html,/<strong class="map-rit-score">218<\/strong>/);
 assert.match(html,/<span class="map-rit-growth map-rit-growth-up">\+7 RIT<\/span>/);
 assert.doesNotMatch(html,/P85|title=|map-rit-percentile/);
 assert.match(html,/percentile rank 85/);
 assert.match(html,/since Spring 2026/);
 const profile=renderMapRitProfile(rows);
 assert.match(profile,/map-rit-profile-growth/);
 assert.match(profile,/\+7 RIT/);
 assert.match(profile,/since Spring 2026/);
 assert.match(profile,/map-rit-history-growth/);
});
test('Negative, flat and missing comparisons are explicit and never filled with fake growth',()=>{
 const first={subject:'Mathematics',window:'Spring 2026',key:'S26',date:'2026-04-22',rit:222,percentile:45,status:'valid',simulated:true};
 const negative={subject:'Mathematics',window:'Fall 2026',key:'F26',date:'2026-09-16',rit:220,percentile:45,status:'valid',simulated:true};
 assert.equal(mapRitChangeLabel(mapRitChange([first,negative],'Mathematics').delta),'-2 RIT');
 assert.match(renderMapRitCell([first,negative],'Mathematics','X'),/>-2 RIT<\/span>/);
 assert.equal(mapRitChangeLabel(mapRitChange([first,{...negative,rit:222}],'Mathematics').delta),'0 RIT');
 assert.equal(mapRitChangeLabel(mapRitChange([negative],'Mathematics').delta),'No prior test');
 assert.match(renderMapRitCell([negative],'Mathematics','X'),/No prior test/);
 assert.equal(mapRitChange([first],'Mathematics').delta,null,'Missing fall test is not a zero change');
 assert.match(renderMapRitCell([first],'Mathematics','X'),/No F26 test/);
 const mixed=[{...first,subject:'Reading'},negative];
 assert.equal(mapRitChange(mixed,'Mathematics').delta,null,'Cannot compare scores across subjects');
});
