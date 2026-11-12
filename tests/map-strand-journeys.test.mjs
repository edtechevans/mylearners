import test from 'node:test';
import assert from 'node:assert/strict';
import {
 studentStrandJourney,strandCohortJourney,strandTransitionStatus,
 comparableStrandForms,recordedGrade,strandStage
} from '../src/map-strand-journeys.mjs';
import {renderStudentStrandJourney,renderCohortStrandJourney} from '../src/map-strand-journeys-view.mjs';
import {facultyStrandQuickModel,renderFacultyStrandQuickCheck} from '../src/faculty-strand-quickcheck.mjs';
import {indexAssessmentExports,normalizeNweaAssessment} from '../src/source-export-adapters.mjs';
const fake=(id,grade='G7')=>({id,name:'Demo '+id,grade,classId:grade+'-A'});
const goal=(name,adjective,rit)=>({name,adjective,rit});
const rec=(key,grade,adjective,rit,{subject='Reading',name='Vocabulary',form='Reading Form A'}={})=>({
 key,window:key.replace(/^F/,'Fall 20').replace(/^S/,'Spring 20'),date:'20'+key.slice(1)+'-09-16',
 gradeAtTest:grade,subject,course:subject==='Mathematics'?'Math K-12':subject,
 testName:form,status:'valid',rit:210,percentile:40,goals:[goal(name,adjective,rit)]
});
const students=[fake('DEMO-A'),fake('DEMO-B'),fake('DEMO-C'),fake('DEMO-D'),fake('DEMO-E','G4'),fake('DEMO-F')];
const map={
 'DEMO-A':[rec('F22','G3','Low',179),rec('F24','G5','LoAvg',188),rec('F25','G6','Avg',195),rec('F26','G7','HiAvg',207)],
 'DEMO-B':[rec('F22','G3','Low',171),rec('F26','G7','LoAvg',194)],
 'DEMO-C':[rec('F22','G3','HiAvg',210),rec('F26','G7','Low',188)],
 'DEMO-D':[rec('F22','G3','Low',179),rec('F26','G7','Avg',205,{form:'Reading Form B'})],
 'DEMO-E':[rec('F26','G4','Avg',199)],
 'DEMO-F':[rec('F25','G6','Low',182),rec('F26','G7','Avg',196)]
};
test('Student MAP strand chronology detects recorded Elementary -> Secondary handoff',()=>{
 const m=studentStrandJourney({student:students[0],records:map['DEMO-A'],subject:'Reading'});
 assert.equal(m.steps.length,4);
 assert.equal(m.handoff.from.grade,'G5');
 assert.equal(m.handoff.to.grade,'G6');
 assert.equal(m.goalName,'Vocabulary');
 assert.equal(m.steps.at(-1).delta,12);
 assert.equal(m.first.grade,'G3');
 assert.equal(m.last.grade,'G7');
 assert.equal(m.status,'moved-beyond-low');
});
test('History never claims comparability across versions or mathematics stage boundary',()=>{
 const model=studentStrandJourney({student:students[3],records:map['DEMO-D']});
 assert.equal(model.status,'version-break');
 assert.equal(model.steps[1].delta,null);
 assert.equal(model.steps[1].versionBreak,true);
 const m1=rec('F22','G5','Low',182,{subject:'Mathematics',name:'Geometry',form:'Math K-12'});
 const m2=rec('F26','G7','Avg',206,{subject:'Mathematics',name:'Geometry',form:'Math K-12'});
 assert.equal(comparableStrandForms(m1,m2,'Mathematics'),false);
 assert.equal(strandTransitionStatus(goal('x','Low',100),goal('x','Avg',180)),'not-classified');
 assert.equal(recordedGrade({grade:'G7'}),null);
 assert.equal(strandStage('G5'),'Elementary');
 assert.equal(strandStage('G6'),'Secondary');
});
test('Cohort snapshots preserve denominators and paired outcome types',()=>{
 const m=strandCohortJourney({students,map,subject:'Reading',goalName:'Vocabulary',start:'F22',end:'F26'});
 assert.equal(m.scope,6);
 assert.equal(m.paired,4);
 assert.equal(m.compared,3);
 assert.equal(m.crossStage,4);
 assert.equal(m.missingPair,2);
 assert.equal(m.statuses['moved-beyond-low'],1);
 assert.equal(m.statuses['continued-low'],1);
 assert.equal(m.statuses['entered-low'],1);
 assert.equal(m.statuses['version-break'],1);
 assert.equal(m.timeline.find(x=>x.key==='F22').assessed,4);
 assert.equal(m.timeline.find(x=>x.key==='F26').assessed,6);
 assert.equal(m.rows[0].student.id,'DEMO-A');
});
test('Cohort with one Fall assessment cannot fabricate same-window growth or a paired journey',()=>{
 const m=strandCohortJourney({students:[students[4]],map});
 assert.equal(m.windows.length,1);
 assert.equal(m.start,'');
 assert.equal(m.end,'F26');
 assert.equal(m.paired,0);
 assert.equal(m.compared,0);
 assert.equal(m.missingPair,1);
});
test('Student history surfaces both Fall checkpoints and all windows without guessing grades',()=>{
 const spring={...rec('S26','G6','Avg',193),date:'2026-04-22',window:'Spring 2026'};
 const base=map['DEMO-A'];
 const falls=studentStrandJourney({records:[...base,spring],season:'fall'});
 const all=studentStrandJourney({records:[...base,spring],season:'all'});
 assert.equal(falls.steps.length,4);
 assert.equal(all.steps.length,5);
 const withoutGrade=rec('F26',null,'Low',170);
 delete withoutGrade.gradeAtTest;
 assert.equal(studentStrandJourney({records:[withoutGrade]}).steps[0].stage,null);
});
test('Faculty quick-check respects assigned cohort and gives meaningful single-click focus',()=>{
 const scope=[students[0],students[1],students[4]];
 const m=facultyStrandQuickModel({students:scope,map,subject:'Reading'});
 assert.equal(m.active.subject,'Reading');
 assert.equal(m.active.tested,3);
 assert.equal(m.active.flagged,1);
 assert.equal(m.active.groups[0].name,'Vocabulary');
 const html=renderFacultyStrandQuickCheck({students:scope,map,subject:'Reading'});
 assert.match(html,/Quick strand check/);
 assert.match(html,/data-faculty-strand-goal="Vocabulary"/);
 assert.match(html,/data-faculty-strand-open/);
 assert.doesNotMatch(html,/DEMO-C/);
 assert.equal(renderFacultyStrandQuickCheck({students:[fake('DEMO-K','K')],map}), '');
});
test('Per-learner and class pathways contain meaningful controls and explicit caveats',()=>{
 const html=renderStudentStrandJourney({student:students[0],records:map['DEMO-A']});
 assert.match(html,/Elementary → Secondary/);
 assert.match(html,/data-map-strand-profile-goal/);
 assert.match(html,/data-map-strand-profile-subject="Mathematics"/);
 assert.match(html,/Fall checkpoints/);
 const cohort=renderCohortStrandJourney({students,map,goalName:'Vocabulary',mode:'faculty'});
 assert.match(cohort,/data-map-strand-journey-start/);
 assert.match(cohort,/data-map-strand-journey-end/);
 assert.match(cohort,/data-student="DEMO-A"/);
 assert.match(cohort,/Each percentage has its own assessed denominator/);
});
test('Generic export grade-at-test enrichment uses matching term roster only',()=>{
 const assessment={
  StudentID:'DEMO-X',Course:'Reading',Subject:'Language Arts',
  TermName:'Fall 2022-2023',TestStartDate:'09/16/2022',
  TestRITScore:'188',TestPercentile:'24',TestName:'Reading Form A',
  Goal1Name:'Vocabulary',Goal1RitScore:'174',Goal1Adjective:'Low'
 };
 assert.equal(normalizeNweaAssessment(assessment).gradeAtTest,null);
 const student={StudentID:'DEMO-X',Grade:'7',StudentFirstName:'Demo',StudentLastName:'Learner'};
 const a=indexAssessmentExports({students:[student],map:[assessment]});
 assert.equal(a.mapByStudent['DEMO-X'][0].gradeAtTest,null);
 const b=indexAssessmentExports({students:[student],map:[assessment],termRosters:{F22:{'DEMO-X':'G3'}}});
 assert.equal(b.mapByStudent['DEMO-X'][0].gradeAtTest,'G3');
 assert.equal(b.students[0].grade,'G7');
 assert.equal(normalizeNweaAssessment({...assessment,GradeAtTest:'5'}).gradeAtTest,'G5');
});
