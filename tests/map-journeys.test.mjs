import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,MAP_LONG_WINDOWS,gradeNumber} from '../src/data.mjs';
import {MAP_RIT_BANDS} from '../src/map-rit-achievement.mjs';
import {JOURNEY_FALL_WINDOWS,journeyStudentHistory,journeyBandIncludes,
 mapJourneyCohort,mapJourneyTransition} from '../src/map-journeys-data.mjs';
import {renderMapJourneyCohort,renderMapJourneyProfile,renderMapJourneyChart} from '../src/map-journeys-view.mjs';
const data=generateDemoData();
const g8=data.students.filter(s=>s.grade==='G8');
const secondary=data.students.filter(s=>s.division==='Secondary');
const student=(id,grade='G8')=>({id,grade,division:'Secondary',classId:grade+'-A',name:'Fictional '+id,portraitSeed:id});
const row=(subject,key,p,grade,rit=200)=>({
 subject,key,window:'Fall 20'+key.slice(1),date:'20'+key.slice(1)+'-09-16',
 gradeAtTest:grade,rit,percentile:p,status:'valid',simulated:true
});
test('Synthetic longitudinal MAP records include earlier Fall windows and no tests before student enrolment',()=>{
 assert.deepEqual(JOURNEY_FALL_WINDOWS.map(x=>x.key),
  ['F20','F21','F22','F23','F24','F25','F26']);
 assert.equal(MAP_LONG_WINDOWS.filter(x=>x.key.startsWith('F')).length,7);
 const enrolled=data.students.filter(s=>s.grade==='G8'&&s.yearsAtAISG>=6);
 assert.ok(enrolled.length>0,'Some synthetic Grade 8 learners are enrolled by Grade 3');
 const example=enrolled.find(s=>journeyStudentHistory(s,data.map[s.id],'Reading').some(h=>h.key==='F21'));
 assert.ok(example,'A Grade 8 learner should have a fictional Grade 3 Fall RIT result');
 const history=journeyStudentHistory(example,data.map[example.id],'Reading');
 const f21=history.find(h=>h.key==='F21'),f26=history.find(h=>h.key==='F26');
 assert.equal(f21.grade,'G3');assert.equal(f26.grade,'G8');
 assert.ok(history.every(h=>h.date>=example.enrolledDate));
 assert.ok(history.every(h=>h.percentile>=1&&h.percentile<=99));
 const recent=data.students.find(s=>s.grade==='G8'&&s.yearsAtAISG<=2);
 assert.ok(recent);
 assert.ok(!journeyStudentHistory(recent,data.map[recent.id],'Reading').some(h=>h.key==='F21'),
  'Recently enrolled learners must not acquire fictional pre-enrolment test results');
});
test('Each student matches only their own same-subject Fall history with valid classification',()=>{
 for(const s of g8.slice(0,25)){
  const history=journeyStudentHistory(s,data.map[s.id],'Reading');
  assert.equal(new Set(history.map(x=>x.key)).size,history.length);
  assert.ok(history.every(x=>x.record.subject==='Reading'&&x.key.startsWith('F')));
  assert.ok(history.every(x=>MAP_RIT_BANDS.some(b=>b.key===x.band)));
  assert.ok(history.every(x=>x.grade===null||gradeNumber(x.grade)>=3));
 }
});
test('Transition matrix counts unique learners and excludes missing paired tests',()=>{
 const model=mapJourneyCohort({students:secondary,map:data.map,subject:'Reading',
  start:'F22',end:'F26',pathway:'cross',startingBand:'both',endingBand:'average-plus'});
 assert.ok(model.matched>0,'The fictional Secondary cohort has matched Elementary→Secondary results');
 assert.ok(model.crossAvailable>=model.matched);
 assert.equal(model.matchedRows.length,model.matched);
 assert.equal(new Set(model.matchedRows.map(x=>x.student.id)).size,model.matched);
 assert.equal(model.cohort.length,Object.values(model.destinations).reduce((a,b)=>a+b,0));
 const matrixSum=Object.values(model.matrix).reduce((n,row)=>n+Object.values(row).reduce((x,y)=>x+y,0),0);
 assert.equal(matrixSum,model.matched);
 assert.ok(model.selected.every(x=>['low','low-average'].includes(x.from.band)));
 assert.ok(model.selected.every(x=>['average','high-average','high'].includes(x.to.band)));
 assert.ok(model.selected.every(x=>gradeNumber(x.from.grade)<=5&&gradeNumber(x.to.grade)>=6));
 assert.equal(model.eligible,secondary.filter(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10).length);
 assert.equal(model.eligible-model.allMatched,model.missingPair);
});
test('Five-by-five transition cells open exact matched learners without double counting',()=>{
 const a=student('DEMO-9001'),b=student('DEMO-9002'),c=student('DEMO-9003'),d=student('DEMO-9004');
 const rows={
 'DEMO-9001':[row('Reading','F22',20,'G4',180),row('Reading','F26',41,'G8',224)],
 'DEMO-9002':[row('Reading','F22',21,'G4',184),row('Reading','F26',60,'G8',225)],
 'DEMO-9003':[row('Reading','F22',39,'G4',190),row('Reading','F26',61,'G8',230)],
 'DEMO-9004':[row('Reading','F22',20,'G4',184)]
 };
 const model=mapJourneyCohort({students:[a,b,c,d],map:rows,subject:'Reading',
  start:'F22',end:'F26',pathway:'cross',startingBand:'both'});
 assert.equal(model.matched,3);
 assert.equal(model.missingPair,1);
 assert.equal(model.cohort.length,3);
 assert.equal(model.matrix.low.average,1);
 assert.equal(model.matrix['low-average'].average,1);
 assert.equal(model.matrix['low-average']['high-average'],1);
 assert.deepEqual(mapJourneyTransition(model,'low','average').map(x=>x.student.id),['DEMO-9001']);
 assert.deepEqual(mapJourneyTransition(model,'low-average','average').map(x=>x.student.id),['DEMO-9002']);
 assert.equal(mapJourneyTransition(model,'low','high').length,0);
 const narrowed=mapJourneyCohort({students:[a,b,c,d],map:rows,subject:'Reading',
  start:'F22',end:'F26',pathway:'cross',startingBand:'low',endingBand:'average'});
 assert.equal(narrowed.selected.length,1);
 assert.equal(narrowed.selected[0].student.id,'DEMO-9001');
 assert.equal(journeyBandIncludes('average-plus','low','end'),false);
 assert.equal(journeyBandIncludes('average-plus','average','end'),true);
});
test('Cohort controls, coloured transition cells, matched rows and accessible learner actions render',()=>{
 const selected=secondary.filter(s=>['G7','G8','G9'].includes(s.grade));
 const html=renderMapJourneyCohort({students:selected,map:data.map,subject:'Reading',
  start:'F22',end:'F26',pathway:'cross',startingBand:'both',endingBand:'average-plus'});
 assert.match(html,/id="leader-map-journeys"/);
 for(const field of ['subject','starting-window','comparison-window','starting-band','current-band'])
  assert.ok(html.includes('data-map-journey-'+field),'Missing '+field+' control');
 assert.match(html,/data-map-journey-cell="low\|average"/);
 assert.match(html,/data-map-journey-pathway="cross" aria-pressed="true"/);
 assert.match(html,/data-map-journey-pathway="all" aria-pressed="false"/);
 assert.match(html,/map-journey-cohort-grid/);
 assert.match(html,/Matched students/);
 assert.match(html,/Average\+ at comparison/);
 assert.match(html,/Refine comparison/);
 assert.match(html,/data-map-journey-preset="rising"/);
 assert.match(html,/FICTIONAL DATA/);
 assert.match(html,/Only students with both assessments contribute to movement percentages/);
 assert.match(html,/not<\/strong> RIT growth/);
 assert.match(html,/data-leader-student=/);
 assert.doesNotMatch(html,/https?:\/\/.+(?:csv|xlsx)/i,'Do not link any source data file');
});
test('Longitudinal learner chart is coloured by achievement percentile, not RIT or growth norm',()=>{
 const learner=g8.find(s=>journeyStudentHistory(s,data.map[s.id],'Reading').length>=3);
 assert.ok(learner);
 const history=journeyStudentHistory(learner,data.map[learner.id],'Reading');
 const svg=renderMapJourneyChart(learner,history);
 assert.match(svg,/role="img" aria-label="MAP achievement percentile/);
 assert.match(svg,/<path d=" M /);
 assert.match(svg,/stroke="#234c69"/);
 assert.match(svg,/<circle /);
 assert.match(svg,/Secondary/);
 assert.match(svg,/>2024<\/text>/);
 const html=renderMapJourneyProfile({student:learner,records:data.map[learner.id],subject:'Reading'});
 assert.match(html,/My MAP Journey/);
 assert.match(html,/data-map-journey-profile-subject="Mathematics"/);
 assert.match(html,/Fall MAP achievement results/);
 assert.match(html,/Percentile-rank points, not RIT growth/);
 const missing=renderMapJourneyProfile({student:learner,records:[],subject:'Reading'});
 assert.equal(missing,'');
});
test('Cohort and profile do not display students outside the scoped list',()=>{
 const selection=secondary.filter(s=>s.grade==='G8').slice(0,20);
 const html=renderMapJourneyCohort({students:selection,map:data.map,start:'F22',end:'F26',
  pathway:'cross',startingBand:'all',endingBand:'all',expanded:true});
 const ids=[...html.matchAll(/data-leader-student="(DEMO-\d+)"/g)].map(x=>x[1]);
 assert.ok(ids.every(id=>selection.some(s=>s.id===id)));
 assert.ok(!ids.some(id=>data.students.find(s=>s.id===id)?.grade==='G7'));
 assert.equal(renderMapJourneyCohort({students:data.students.filter(s=>s.grade==='G12'),map:data.map}),'');
});
