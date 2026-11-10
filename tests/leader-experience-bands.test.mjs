import test from 'node:test';
import assert from 'node:assert/strict';
import {experienceBand} from '../src/faculty-bands.mjs';
import {LEADER_EXPERIENCE_BANDS,leaderExperiencePosition,leaderExperienceChange,
 leaderExperienceBandLabel,leaderExperienceScale,leaderExperienceLegend}
 from '../src/leader-experience-bands.mjs';

test('Leaders reuse fixed experience index intervals, not report-card grade bands',()=>{
 const points=[[-2,'band-low'],[-1.01,'band-low'],[-1,'band-mid-low'],
  [-0.01,'band-mid-low'],[0,'band-mid-high'],[0.6,'band-mid-high'],
  [0.96,'band-mid-high'],[1,'band-high'],[2,'band-high']];
 for(const [score,band] of points){
  assert.equal(experienceBand(score),band);
  assert.equal(leaderExperienceBandLabel(score)?.band,band);
 }
 for(const unavailable of [NaN,Infinity,-Infinity,-2.01,2.01,null])
  assert.equal(leaderExperienceBandLabel(unavailable),null);
 assert.equal(LEADER_EXPERIENCE_BANDS.length,4);
});
test('Gauge position reflects exact value on -2 to +2, including endpoints',()=>{
 assert.equal(leaderExperiencePosition(-2),0);
 assert.equal(leaderExperiencePosition(-1),25);
 assert.equal(leaderExperiencePosition(0),50);
 assert.equal(leaderExperiencePosition(.6),65);
 assert.equal(leaderExperiencePosition(1),75);
 assert.equal(leaderExperiencePosition(2),100);
 assert.equal(leaderExperiencePosition(null),null);
});
test('Comparisons are legible signed two-decimal values, never binary floating artifacts',()=>{
 assert.equal(leaderExperienceChange(.14999999999999997,'Spring 2026'),'+0.15 index points vs Spring 2026');
 assert.equal(leaderExperienceChange(.09999999999999998,'Spring 2026'),'+0.10 index points vs Spring 2026');
 assert.equal(leaderExperienceChange(-.24000000000000002,'Spring 2026'),'-0.24 index points vs Spring 2026');
 assert.equal(leaderExperienceChange(-.00000000000000002,'Spring 2026'),'0.00 index points vs Spring 2026');
 assert.equal(leaderExperienceChange(null,'Spring 2026'),'No earlier comparable check-in');
});
test('Each gauge displays four accessible colour segments and value marker',()=>{
 const html=leaderExperienceScale(.6,'Engagement');
 for(const {band} of LEADER_EXPERIENCE_BANDS)assert.match(html,new RegExp('class="'+band+'"'));
 assert.match(html,/role="img" aria-label="Engagement: \+0.60/);
 assert.match(html,/leader-experience-marker" style="left:65.00%"/);
 const absent=leaderExperienceScale(null,'Belonging');
 assert.match(absent,/is-missing/);
 assert.doesNotMatch(absent,/leader-experience-marker/);
 assert.match(leaderExperienceLegend(),/not report-card grades/);
});
