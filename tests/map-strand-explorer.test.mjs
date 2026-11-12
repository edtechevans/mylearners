import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {mapStrandExplorerModel,strandBand,strandGoalHistory,
 comparableGoalTest,latestStrandAssessment} from '../src/map-strand-explorer.mjs';
import {renderMapStrandProfile,renderMapStrandExplorer} from '../src/map-strand-view.mjs';
const fake=(id,name,grade='G7')=>({id,name,grade});
const goal=(name,adjective='Low',rit=200)=>({name,adjective,rit});
const record=(key,goals,{subject='Reading',date='2026-09-16',testName='Growth: Reading Version 3'}={})=>
 ({key,window:key==='F26'?'Fall 2026':'Fall 2025',date,course:'Reading',testName,
  subject,status:'valid',rit:213,percentile:25,goals});
const students=[fake('DEMO-A','Ada Example'),fake('DEMO-B','Ben Example'),fake('DEMO-C','Cam Example','G6')];
const map={
 'DEMO-A':[record('F25',[goal('Literary Text', 'Low',192)],{date:'2025-09-16'}),
           record('F26',[goal('Literary Text','Low',202),goal('Vocabulary','HiAvg',222)])],
 'DEMO-B':[record('F26',[goal('Literary Text','LoAvg',210)])],
 'DEMO-C':[record('F26',[goal('Literary Text','Low',180)])]
};
test('goal descriptor comes from exported Adjective, never percentiles or RIT thresholds',()=>{
 assert.equal(strandBand(goal('Test','Low',270)),'low');
 assert.equal(strandBand(goal('Test','LoAvg',120)),'low-average');
 assert.equal(strandBand(goal('Test','HiAvg',230)),'high-average');
 assert.equal(strandBand({name:'Test',rit:150}),null);
});
test('matching pupils deduplicated, but goal results and grade-specific groups retained',()=>{
 const m=mapStrandExplorerModel({students,map,subject:'Reading',window:'F26'});
 assert.equal(m.eligible,3);
 assert.equal(m.tested,3);
 assert.equal(m.matched,3);
 assert.equal(m.flaggedGoalResults,3);
 assert.equal(m.groups.length,2);
 assert.equal(m.groups.find(g=>g.grade==='G7').members.length,2);
 assert.equal(m.groups.find(g=>g.grade==='G6').members.length,1);
});
test('band and goal filters work within scope; missing assessments are not low',()=>{
 const m=mapStrandExplorerModel({students:[...students,fake('DEMO-D','Dee Example')],map,
  band:'low',goalName:'Literary Text',grade:'G7'});
 assert.equal(m.matched,1);
 assert.equal(m.tested,2);
 assert.equal(m.withoutGoals,1);
 assert.equal(m.rows[0].student.id,'DEMO-A');
 const all=mapStrandExplorerModel({students,map,band:'all',goalName:'Vocabulary'});
 assert.equal(all.matched,1);
 assert.equal(all.rows[0].hits[0].band,'high-average');
});
test('goal history compares only identical test versions and goal names',()=>{
 const a=map['DEMO-A'];
 assert.equal(strandGoalHistory(a,'Reading','Literary Text',a[1]).delta,10);
 const variant=record('F26',[goal('Literary Text','Low',201)],{testName:'Changed Test Version'});
 assert.equal(comparableGoalTest(a[0],variant),false);
 assert.equal(strandGoalHistory([a[0],variant],'Reading','Literary Text',variant).delta,null);
 assert.equal(latestStrandAssessment([a[0],variant],'Reading').key,'F26');
});
test('profile and explorer render synthetic results and actionable controls',()=>{
 const profile=renderMapStrandProfile(map['DEMO-A'],{studentRole:true});
 assert.match(profile,/My MAP learning areas/);
 assert.match(profile,/Literary Text/);
 assert.match(profile,/\+10 RIT/);
 const explorer=renderMapStrandExplorer({students,map,subject:'Reading',window:'F26'});
 assert.match(explorer,/MAP Strand Explorer/);
 assert.match(explorer,/data-map-strand-filter="goal"/);
 assert.match(explorer,/data-leader-student="DEMO-A"/);
 assert.match(explorer,/Potential teaching groups/);
});
