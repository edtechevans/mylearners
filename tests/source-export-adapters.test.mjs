import test from 'node:test';
import assert from 'node:assert/strict';
import {
 SOURCE_FIELDS,csvNumber,csvDate,csvGrade,mapTerm,mapCourseSubject,
 normalizeNweaStudent,normalizeNweaAssessment,normalizeIxlDiagnostic,
 indexAssessmentExports
} from '../src/source-export-adapters.mjs';

const student=(id='DEMO-0001',grade='7')=>({
 StudentID:id,StudentFirstName:'Fictional',StudentLastName:'Learner',
 Grade:grade,StudentGender:'F'
});
const testRow=(course='Reading',id='DEMO-0001')=>({
 StudentID:id,Subject:course==='Math K-12'?'Mathematics':'Language Arts',
 Course:course,TermName:'Fall 2026-2027',TestStartDate:'09/18/2026',
 TestStartTime:'09:35:00',TestID:'FAKE-TEST-A',
 TestRITScore:'218',TestPercentile:'43',AchievementQuintile:'Avg',
 GrowthMeasureYN:'TRUE',FallToFallProjectedGrowth:'5',
 FallToFallObservedGrowth:'7',FallToFallObservedGrowthSE:'3.2',
 FallToFallMetProjectedGrowth:'Yes*',FallToFallConditionalGrowthPercentile:'69',
 FallToFallGrowthQuintile:'HiAvg',
 Goal1Name:'Literary Text',Goal1RitScore:'210',Goal1Range:'202-218',Goal1Adjective:'Avg',
 Goal2Name:'Informational Text',Goal2RitScore:'219',Goal2Adjective:'HiAvg',
 Goal3Name:'Vocabulary',Goal3RitScore:'216',Goal3Adjective:'Avg'
});
const ixlRow=(score='420',id='DEMO-0001')=>({
 ID:id,Grade:'7','Date of completion':score==='--'?'--':'(10/06/2026)',
 'Overall math score':score,
 'Overall math scale score':score==='--'?'--':'196.42',
 'Overall math tier':score==='--'?'--':'On grade',
 'Overall math percentile':score==='--'?'--':'58',
 'Geometry score':score==='--'?'--':'430',
 'Geometry tier':score==='--'?'--':'Above grade',
 'Geometry percentile':score==='--'?'--':'64',
 'Statistics and Probability score':'N/A',
 'Statistics and Probability tier':'N/A',
 'Statistics and Probability percentile':'N/A'
});
test('Export schemas describe only generic headers, never names or school rows',()=>{
 assert.ok(SOURCE_FIELDS.map.includes('Course'));
 assert.ok(SOURCE_FIELDS.map.includes('AchievementQuintile'));
 assert.ok(SOURCE_FIELDS.ixl.includes('Overall math tier'));
});
test('MAP Course determines Reading vs Language Usage even though both subjects say Language Arts',()=>{
 const reading=normalizeNweaAssessment(testRow('Reading'));
 const language=normalizeNweaAssessment(testRow('Language Usage'));
 const math=normalizeNweaAssessment(testRow('Math K-12'));
 assert.equal(reading.subject,'Reading');
 assert.equal(language.subject,'Language Usage');
 assert.equal(math.subject,'Mathematics');
 assert.equal(mapCourseSubject('','Language Arts'),null);
 assert.equal(mapCourseSubject('','Mathematics'),'Mathematics');
 assert.equal(reading.key,'F26');
 assert.equal(reading.window,'Fall 2026');
 assert.equal(reading.percentile,43);
 assert.equal(reading.achievementQuintile,'average');
 assert.equal(reading.percentileMismatch,false);
});
test('MAP official growth and goal strands survive normalization without confusing achievement quintiles',()=>{
 const normalized=normalizeNweaAssessment(testRow());
 assert.equal(normalized.growth.fallToFall.observed,7);
 assert.equal(normalized.growth.fallToFall.projected,5);
 assert.equal(normalized.growth.fallToFall.conditionalGrowthPercentile,69);
 assert.equal(normalized.growth.fallToFall.growthQuintile,'HiAvg');
 assert.equal(normalized.growth.fallToFall.met,true);
 assert.equal(normalized.growth.fallToFall.metFlagged,true);
 assert.equal(normalized.goals.length,3);
 assert.equal(normalized.goals[0].rit,210);
 assert.equal(normalized.goals[0].range,'202-218');
 assert.equal(normalized.goals[0].adjective,'Avg');
 assert.equal(normalizeNweaAssessment({...testRow(),TestRITScore:'--'}),null);
 const withoutGrowth=normalizeNweaAssessment({...testRow(),
  FallToFallProjectedGrowth:'',FallToFallObservedGrowth:'',
  FallToFallConditionalGrowthPercentile:''});
 assert.equal(withoutGrowth.growth.fallToFall,null);
});
test('IXL has distinct diagnostic score, scale score, tier and percentile; -- is never zero',()=>{
 const valid=normalizeIxlDiagnostic(ixlRow());
 assert.equal(valid.completed,true);
 assert.equal(valid.level,420);
 assert.equal(valid.scoreLabel,'420');
 assert.equal(valid.scaleScore,196.42);
 assert.equal(valid.tier,'On grade');
 assert.equal(valid.percentile,58);
 assert.deepEqual(valid.domains.map(x=>x.name),['Geometry']);
 const missing=normalizeIxlDiagnostic(ixlRow('--'));
 assert.equal(missing.completed,false);
 assert.equal(missing.level,null);
 assert.equal(missing.percentile,null);
 assert.equal(missing.domains.length,0);
 const cap=normalizeIxlDiagnostic(ixlRow('1,200+'));
 assert.equal(cap.level,1200);
 assert.equal(cap.scoreLabel,'1,200+');
 assert.equal(cap.atLeast,true);
 assert.equal(csvNumber('1,200+'),null);
 assert.equal(csvNumber('--'),null);
});
test('StudentID joins NWEA roster and tests to IXL ID, keeps missing and excludes unmatched',()=>{
 const idx=indexAssessmentExports({
  students:[student('DEMO-0001','7'),student('DEMO-0002','1')],
  map:[
   testRow('Reading'),{...testRow('Reading'),TestStartTime:'13:00:00',TestID:'FAKE-TEST-B',
    TestRITScore:'221'},
   testRow('Language Usage'),
   testRow('Math K-12'),
   testRow('Reading','DEMO-9999')],
  ixl:[ixlRow('420'),ixlRow('--','DEMO-0002'),ixlRow('250','DEMO-9999')]
 });
 assert.equal(idx.coverage.roster,2);
 assert.equal(idx.coverage.mapLearners,1);
 assert.equal(idx.coverage.ixlCompleted,1);
 assert.equal(idx.coverage.duplicateTests,1);
 assert.equal(idx.coverage.unmatchedMap,1);
 assert.equal(idx.coverage.unmatchedIxl,1);
 assert.equal(idx.mapByStudent['DEMO-0001'].length,3);
 assert.equal(idx.mapByStudent['DEMO-0001'].find(x=>x.subject==='Reading').rit,221);
 assert.deepEqual(idx.mapByStudent['DEMO-0002'],[]);
 assert.equal(idx.ixlByStudent['DEMO-0002'].completed,false);
 assert.equal(idx.students[0].grade,'G7');
});
test('School-year and date conversion do not manufacture prior windows',()=>{
 assert.deepEqual(mapTerm('Fall 2026-2027'),{key:'F26',label:'Fall 2026',year:2026});
 assert.equal(mapTerm('Spring 2025-2026').key,'S25');
 assert.equal(csvGrade('01'),'G1');
 assert.equal(csvDate('(10/06/2026)'),'2026-10-06');
 assert.equal(csvDate('09/18/2026'),'2026-09-18');
 assert.equal(csvDate('02/30/2026'),null);
 const idx=indexAssessmentExports({students:[student()],map:[testRow()]});
 assert.deepEqual(idx.mapByStudent['DEMO-0001'].map(x=>x.key),['F26']);
});
