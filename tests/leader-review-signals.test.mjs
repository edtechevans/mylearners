import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {leaderVoiceReview,leaderMapRedReview,renderLeaderVoiceReview,renderLeaderMapRedReview,
 VOICE_REVIEW_THRESHOLD,MAP_REVIEW_BAND} from '../src/leader-review-signals.mjs';

const demo=generateDemoData(),records=createExperienceRecords(demo.students);
const fictional=(id,grade='G7',division='Secondary')=>({id,grade,division,name:'Test '+id,classId:grade+'-A'});
const testMap=(subject,percentile,rit=210,key='F26')=>({
 subject,key,window:key==='F26'?'Fall 2026':'Spring 2026',
 date:key==='F26'?'2026-09-14':'2026-04-22',
 rit,percentile,status:'valid',simulated:true
});
test('Review rules are separate: voice index ≤0, MAP Low achievement band percentile 1–20',()=>{
 assert.equal(VOICE_REVIEW_THRESHOLD,0);
 assert.equal(MAP_REVIEW_BAND,'low');
 const a=fictional('a'),b=fictional('b'),c=fictional('c'),d=fictional('d'),e=fictional('e','G2','Elementary');
 const voice=new Map([
  ['a',{F26:{engagement:{value:0},belonging:{value:1.33}}}],
  ['b',{F26:{engagement:{value:-0.33},belonging:{value:-1}}}],
  ['c',{F26:{engagement:{value:0.67},belonging:{value:0.33}}}],
  ['d',{F26:{engagement:{value:1},belonging:null}}],
  ['e',{F26:{engagement:{value:-2},belonging:{value:-2}}}]
 ]);
 const review=leaderVoiceReview([a,b,c,d,e],voice);
 assert.equal(review.eligible,4);
 assert.equal(review.responded,4);
 assert.equal(review.engagementLow,2);
 assert.equal(review.belongingLow,1);
 assert.equal(review.bothLow,1);
 assert.deepEqual(review.rows.map(x=>x.student.id),['a','b']);
 assert.equal(review.rows.find(x=>x.student.id==='a').engagement,0);
 assert.ok(!review.rows.some(x=>x.student.id==='d'),'Missing belonging is not zero');
 const html=renderLeaderVoiceReview({students:[a,b,c,d,e],records:voice});
 assert.match(html,/data-leader-student="a"/);
 assert.match(html,/Both measures ≤0/);
 assert.match(html,/0 or below/);
 assert.doesNotMatch(html,/data-leader-student="e"/,'Grade 2 is outside student voice assessment');
});
test('MAP flags current 1–20 inclusive by subject, never RIT or earlier test alone',()=>{
 const a=fictional('a'),b=fictional('b'),c=fictional('c'),d=fictional('d'),e=fictional('e','G12');
 const map={
  a:[testMap('Mathematics',20,240),testMap('Reading',21,185),
     testMap('Language Usage',1,190)],
  b:[testMap('Mathematics',40,190),testMap('Reading',80,230)],
  c:[testMap('Reading',2,180,'S26')],
  d:[{...testMap('Reading',10,190),status:'invalid'}],
  e:[testMap('Mathematics',1,180)]
 };
 const r=leaderMapRedReview([a,b,c,d,e],map);
 assert.equal(r.eligible,4);assert.equal(r.tested,2);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].student.id,'a');
 assert.equal(r.rows[0].red.length,2);
 assert.equal(r.subjectCounts.Mathematics,1);
 assert.equal(r.subjectCounts.Reading,0);
 assert.equal(r.subjectCounts['Language Usage'],1);
 assert.ok(!r.rows.some(x=>x.student.id==='e'),'DP Grade 12 excluded');
 const html=renderLeaderMapRedReview({students:[a,b,c,d,e],map});
 assert.match(html,/1st–20th percentile/);
 assert.match(html,/240 RIT · P20/);
 assert.match(html,/190 RIT · P1/);
 assert.doesNotMatch(html,/185 RIT · P21/);
 assert.match(html,/data-leader-student="a"/);
});
test('Voice review follows selected check-in period and ignores missing results',()=>{
 const a=fictional('a'),b=fictional('b'),m=new Map([
  ['a',{S26:{engagement:{value:0},belonging:{value:1}},
         F26:{engagement:{value:1.67},belonging:{value:1.67}}}],
  ['b',{F26:{engagement:{value:-1},belonging:{value:-1}}}]
 ]);
 assert.deepEqual(leaderVoiceReview([a,b],m,'S26').rows.map(x=>x.student.id),['a']);
 assert.deepEqual(leaderVoiceReview([a,b],m,'F26').rows.map(x=>x.student.id),['b']);
 assert.match(renderLeaderVoiceReview({students:[a,b],records:m,window:'S26'}),/Spring 2026/);
});
test('Live fictional demo results align with scope and preserve coverage',()=>{
 const sec=demo.students.filter(s=>s.division==='Secondary'&&s.grade==='G7');
 const voice=leaderVoiceReview(sec,records,'F26');
 const map=leaderMapRedReview(sec,demo.map);
 assert.equal(voice.eligible,sec.length);
 assert.equal(map.eligible,sec.length);
 assert.ok(voice.responded<=voice.eligible);
 assert.ok(map.tested<=map.eligible);
 assert.ok(voice.rows.every(x=>sec.includes(x.student)));
 assert.ok(map.rows.every(x=>sec.includes(x.student)&&x.red.every(y=>y.percentile>=1&&y.percentile<=20)));
 assert.ok(!renderLeaderVoiceReview({students:demo.students.filter(s=>s.grade==='G1'),records}));
 assert.ok(!renderLeaderMapRedReview({students:demo.students.filter(s=>s.grade==='G12'),map:demo.map}));
});
test('Results escape fictional names before rendering and never expose combined learner scores',()=>{
 const student={...fictional('special'),name:'<b>Test & Sample</b>'};
 const voice=new Map([[student.id,{F26:{engagement:{value:0},belonging:{value:0}}}]]);
 const html=renderLeaderVoiceReview({students:[student],records:voice});
 assert.match(html,/&lt;b&gt;Test &amp; Sample&lt;\/b&gt;/);
 assert.doesNotMatch(html,/<b>Test &/);
 assert.doesNotMatch(html,/risk score:|automated referral score/i);
});
