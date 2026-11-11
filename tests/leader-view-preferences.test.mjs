import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {LEADER_FOCUS_SECTIONS,LEADER_JOURNEY_PRESETS,leaderSectionForTarget,
 normalizeLeaderView,leaderSavedViewPayload,leaderApplySavedView} from '../src/leader-view-preferences.mjs';
const data=generateDemoData(),classes=data.classes;
test('Five focused Leaders destinations are stable and route legacy deep links safely',()=>{
 assert.deepEqual(LEADER_FOCUS_SECTIONS.map(x=>x[0]),
  ['follow-up','journeys','academics','experience','support']);
 for(const [id,expected] of [
  ['leader-map-journeys','journeys'],['leader-learning-title','academics'],
  ['leader-academic-detail','academics'],['leader-review','follow-up'],
  ['leader-academic-results','follow-up'],['leader-experience-review','experience'],
  ['leader-support-title','support']
 ])assert.equal(leaderSectionForTarget(id),expected);
 assert.equal(leaderSectionForTarget('bad-unknown-target'),null);
});
test('MAP presets correspond to distinct questions and do not blend growth with achievement',()=>{
 assert.equal(LEADER_JOURNEY_PRESETS.length,3);
 assert.deepEqual(LEADER_JOURNEY_PRESETS.map(x=>x.id),['rising','continuing','all']);
 assert.equal(LEADER_JOURNEY_PRESETS[0].startingBand,'both');
 assert.equal(LEADER_JOURNEY_PRESETS[0].endingBand,'average-plus');
 assert.equal(LEADER_JOURNEY_PRESETS[1].endingBand,'below-average');
 assert.equal(LEADER_JOURNEY_PRESETS[2].startingBand,'all');
});
test('Saved Leaders setup roundtrips active section, MAP bands, filters, years and homeroom',()=>{
 const c=classes.find(x=>x.grade==='G7');
 assert.ok(c);
 const state={division:'Secondary',grade:'G7',classId:c.id,leaderSection:'journeys',
  leaderAcademicFocus:'map',leaderAcademicGrade:'G7',
  leaderAcademicSubject:'Reading',leaderAcademicMultiple:true,leaderMapBand:'low-average',
  leaderReviewFilter:'attendance',window:'F25',
  journeySubject:'Mathematics',journeyStart:'F22',journeyEnd:'F26',
  journeyStartingBand:'both',journeyEndingBand:'below-average',
  journeyPathway:'cross',journeyPreset:'custom',journeyAdvancedOpen:true,
  journeyProfileSubject:'Language Usage',leaderStudentId:'DEMO-0001',
  supportForm:{studentId:'DEMO-0001'},studentId:'DEMO-0001'};
 const stored=leaderSavedViewPayload(state);
 assert.equal(Object.hasOwn(stored,'leaderStudentId'),false);
 assert.equal(Object.hasOwn(stored,'supportForm'),false);
 assert.equal(Object.hasOwn(stored,'studentId'),false);
 const parsed=normalizeLeaderView(JSON.parse(JSON.stringify(stored)),classes);
 assert.ok(parsed);
 assert.equal(parsed.section,'journeys');
 assert.equal(parsed.classId,c.id);
 assert.equal(parsed.mapBand,'low-average');
 assert.equal(parsed.journeyEndingBand,'below-average');
 assert.equal(parsed.journeyPreset,'custom');
 const restored={leaderStudentId:''};
 leaderApplySavedView(restored,parsed);
 assert.equal(restored.leaderSection,'journeys');
 assert.equal(restored.window,'F25');
 assert.equal(restored.journeySubject,'Mathematics');
 assert.equal(restored.journeyAdvancedOpen,true);
 assert.equal(restored.leaderStudentId,'');
});
test('Saved setup rejects unknown grade/division, unexpected field values and wrong homeroom scope',()=>{
 assert.equal(normalizeLeaderView({division:'Secondary',grade:'G4'},classes),null);
 assert.equal(normalizeLeaderView({division:'All',grade:'G7'},classes),null);
 const bad=normalizeLeaderView({
  division:'Secondary',grade:'G7',classId:classes.find(x=>x.grade==='G4').id,
  section:'admin',journeySubject:'Physics',journeyEndingBand:'outside',
  mapBand:'none',academicFocus:'confidential',journeyStart:'unknown',
  journeyAdvancedOpen:'yes',studentId:'SECRET_STUDENT_ID'
 },classes);
 assert.equal(bad.classId,'');
 assert.equal(bad.section,'follow-up');
 assert.equal(bad.mapBand,'both');
 assert.equal(bad.academicFocus,'');
 assert.equal(bad.journeySubject,'Reading');
 assert.equal(bad.journeyEndingBand,'average-plus');
 assert.equal(bad.journeyAdvancedOpen,false);
 assert.equal(Object.hasOwn(bad,'studentId'),false);
 const legacy=normalizeLeaderView({division:'Elementary',grade:'G4'},classes);
 assert.equal(legacy.grade,'G4');
 assert.equal(legacy.section,'follow-up');
});
