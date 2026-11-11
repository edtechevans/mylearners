import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,gradeNumber} from '../src/data.mjs';
import {createAcademicDemoRecords,academicFor,latestAcademic} from '../src/academic-journey-data.mjs';
import {mapRitBand,mapRitChange,renderMapRitProfile,renderMapRitExportDetails} from '../src/map-rit-achievement.mjs';
import {mapCourseSubject} from '../src/source-export-adapters.mjs';
const data=generateDemoData();
const academic=createAcademicDemoRecords(data.students);

test('Fictional MAP records align with Course/Goal and achievement-quintile fields',()=>{
 for(const student of data.students){
  const n=gradeNumber(student.grade),rows=data.map[student.id]||[];
  if(n<3||n>10){assert.equal(rows.length,0);continue}
  for(const row of rows){
   assert.equal(mapCourseSubject(row.course),row.subject);
   assert.equal(row.achievementQuintile,mapRitBand(row.percentile).key);
   assert.ok(row.goals.length>=3&&row.goals.length<=4);
   for(const goal of row.goals){
    assert.ok(goal.name&&Number.isInteger(goal.rit));
    assert.ok(['Low','LoAvg','Avg','HiAvg','High'].includes(goal.adjective));
   }
   assert.equal(row.simulated,true);
  }
 }
});
test('Fictional current Fall annual growth remains separate from Spring-to-Fall tile change',()=>{
 const student=data.students.find(s=>s.grade==='G7'&&data.map[s.id].some(x=>x.key==='F26'));
 const math=data.map[student.id].filter(x=>x.subject==='Mathematics');
 const fall=math.find(x=>x.key==='F26');
 const earlierFall=math.find(x=>x.key==='F25');
 const spring=math.find(x=>x.key==='S26');
 assert.ok(fall&&spring&&earlierFall);
 assert.equal(fall.growth.fallToFall.observed,fall.rit-earlierFall.rit);
 assert.equal(mapRitChange(math,'Mathematics').delta,fall.rit-spring.rit);
 assert.match(renderMapRitExportDetails(math),/Fall-to-Fall growth/);
 assert.match(renderMapRitExportDetails(math),/MAP goal areas/);
 assert.match(renderMapRitProfile(data.map[student.id]),/Literary Text/);
});
test('Imported current-only MAP can display reported Fall-to-Fall observed growth without inventing history',()=>{
 const current={key:'F26',window:'Fall 2026',date:'2026-09-18',subject:'Reading',
  rit:224,percentile:73,status:'valid',
  growth:{fallToFall:{observed:11,projected:7,conditionalGrowthPercentile:83}},
  goals:[{name:'Vocabulary',rit:230,adjective:'High'}]};
 const change=mapRitChange([current],'Reading');
 assert.equal(change.previous,null);
 assert.equal(change.delta,11);
 assert.equal(change.source,'reported');
 assert.equal(change.comparison,'Fall to Fall');
 const html=renderMapRitProfile([current]);
 assert.match(html,/reported Fall-to-Fall/);
 assert.match(html,/growth percentile P83/);
 assert.match(html,/Vocabulary/);
 assert.match(html,/No Fall 2026 assessment/);
});
test('Synthetic IXL includes completed and non-completed export-shaped diagnostic records',()=>{
 let completed=0,missing=0;
 for(const student of data.students){
  const n=gradeNumber(student.grade),rows=academicFor(academic,student.id).ixl;
  if(n<1||n>10){assert.equal(rows.length,0);continue}
  assert.ok(rows.length>=1);
  const latest=rows.at(-1);
  if(latest.status==='not-completed'){
   missing++;
   assert.equal(latest.level,null);
   assert.equal(latest.percentile,null);
   assert.equal(latestAcademic(academicFor(academic,student.id),'ixl'),null);
  }else{
   completed++;
   const current=latestAcademic(academicFor(academic,student.id),'ixl');
   assert.equal(current.value,latest.scoreLabel);
   assert.ok(Number.isFinite(current.scaleScore));
   assert.ok(Number.isInteger(current.percentile));
   assert.ok(current.tier);
   assert.ok(current.domains.length>=3);
   assert.ok(current.domains.every(x=>x.score!==null&&x.tier));
  }
 }
 assert.ok(completed>100);
 assert.ok(missing>100);
 const g7=data.students.filter(s=>s.grade==='G7');
 assert.ok(g7.some(s=>!latestAcademic(academicFor(academic,s.id),'ixl')));
 assert.ok(g7.some(s=>latestAcademic(academicFor(academic,s.id),'ixl')));
});
test('Fictional records only: synthetic IDs are unrelated to any import fixture',()=>{
 assert.ok(data.students.every(s=>/^DEMO-\d{4}$/.test(s.id)));
 assert.ok(!data.students.some(s=>s.id==='STUDENT-REAL'));
});
