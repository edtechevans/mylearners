import test from 'node:test';
import assert from 'node:assert/strict';
import {DIPLOMA_SUBJECTS,dpSubject,dpSubjectDetails,renderDiplomaSubjectSection,renderDPSubjectPointDetails} from '../src/board-dp-subjects.mjs';
import {DP_RECORDS} from '../src/board-dp-data.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';

test('All subject data belongs to AISG and spans the offered May examination years through 2016 with distinct HL/SL rows',()=>{
 assert.equal(DIPLOMA_SUBJECTS.length,13);
 for(const subject of DIPLOMA_SUBJECTS){
  assert.ok(subject.rows.length>=5&&subject.rows.length<=11,subject.id);
  assert.deepEqual(subject.rows.map(r=>r.year),Array.from({length:subject.rows.length},(_,i)=>subject.rows[0].year+i),subject.id);
  assert.ok(subject.rows[0].year>=2016&&subject.rows.at(-1).year<=2026,subject.id);
  assert.ok(subject.rows.every(r=>Number.isInteger(r.n)&&r.n>=1&&r.n<=100));
  assert.ok(subject.rows.every(r=>r.school>=1&&r.school<=7&&r.world>=1&&r.world<=7));
  assert.ok(subject.name.includes(' HL')||subject.name.includes(' SL'));
 }
});
test('2026 highlights quote exact AISG/world course averages and entry counts',()=>{
 const h=dpSubjectDetails('math-aa-sl');
 assert.equal(h.current.n,25);assert.equal(h.current.school,5.52);assert.equal(h.current.world,4.46);
 assert.equal(h.gap,1.06);assert.equal(h.above,6);
 const e=dpSubjectDetails('english-hl');
 assert.equal(e.current.n,17);assert.equal(e.gap,0.57);assert.equal(e.above,11);
 const b=dpSubjectDetails('biology-hl');
 assert.equal(b.current.n,16);assert.equal(b.gap,0.57);assert.equal(b.above,10);
});
test('Less favorable subject years are retained and no inflated subject-wide performance claim is made',()=>{
 const chemistry=dpSubjectDetails('chemistry-hl');
 assert.equal(chemistry.current.school,5.33);
 assert.equal(chemistry.current.world,4.95);
 assert.equal(chemistry.yearChange,1.14);
 assert.equal(chemistry.above,7);
 const physics=dpSubjectDetails('physics-hl');
 assert.ok(physics.gap<0);assert.equal(physics.above,9);
 const english=dpSubjectDetails('english-sl');
 assert.equal(english.above,6);
});
test('Official 2026 IB cohort totals are used and former 2024 pass discrepancy is reconciled',()=>{
 const current=DP_RECORDS.find(r=>r.end===2026);
 assert.deepEqual([current.candidates,current.passes,current.highScore,current.meanGrade],[56,52,43,5.35]);
 assert.equal(current.passRate,93);
 const y24=DP_RECORDS.find(r=>r.end===2024);
 assert.deepEqual([y24.candidates,y24.passes,y24.passRate],[38,35,92]);
});
test('Board subject explorer shows fully accessible 2016–2026 trends and source methodology',()=>{
 const html=renderDiplomaSubjectSection({boardDpSubject:'chemistry-hl'});
 for(const word of ['Where AISG Students Stand Out','English A HL','Biology HL','Mathematics AA SL',
  'Chemistry HL','2016','2026','Worldwide IB','data-board-dp-subject','candidate counts',
  'school 001832','subject entries','Year-by-year figures'])
  assert.ok(html.includes(word),word);
 assert.match(html,/aria-pressed="true"/);
 assert.match(html,/data-board-dp-subject-point="chemistry-hl:2016:school"/);
 assert.match(html,/data-board-dp-subject-point="chemistry-hl:2026:world"/);
 assert.match(renderDPSubjectPointDetails('biology-hl:2026:school'),/AISG student subject entries:<\/strong> 16/);
 assert.match(renderDPSubjectPointDetails('biology-hl:2026:world'),/Worldwide average grade:<\/strong> 4\.49/);
 assert.match(html,/5\.33/);
 assert.match(html,/\+0\.38/);
 assert.match(html,/full zero-to-seven scale/);
 assert.equal((html.match(/<tr/g)||[]).length,12);
});
test('Legacy Mathematics courses are separate from the AA and AI courses',()=>{
 const old=dpSubject('math-legacy-hl'),newer=dpSubject('math-aa-hl');
 assert.deepEqual(old.rows.map(x=>x.year),[2016,2017,2018,2019,2020]);
 assert.deepEqual(newer.rows.map(x=>x.year),[2021,2022,2023,2024,2025,2026]);
 assert.equal(dpSubjectDetails('visual-arts-hl').above,11);
});
test('Board deep links preserve selected course only when valid',()=>{
 const hash=boardHash({boardView:'dp',boardDpMetric:'average',boardDpSubject:'english-hl'});
 assert.match(hash,/course=english-hl/);
 assert.equal(parseBoardHash(hash).boardDpSubject,'english-hl');
 assert.equal(parseBoardHash('#/board?view=dp&course=bad').boardDpSubject,'math-aa-sl');
 assert.equal(dpSubject('bad').id,'math-aa-sl');
 assert.equal(boardHash({boardView:'dp',boardDpMetric:'average'}),'#/board?view=dp&metric=average');
});
test('No student names or identifiers are contained in public subject aggregates',()=>{
 const raw=JSON.stringify(DIPLOMA_SUBJECTS);
 assert.doesNotMatch(raw,/studentid|dob|dateofbirth|@aisgz|learner name|student email/i);
});
