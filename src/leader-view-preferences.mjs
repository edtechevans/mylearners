/** Leaders UI choices and saved layout validation.
 * Persist presentation/filter preferences only; never student IDs, personal
 * evidence, interventions or untrusted free-text filters.
 */
import {GRADES,gradeNumber} from './data.mjs?v=20261111journeys1';
import {JOURNEY_FALL_WINDOWS,JOURNEY_START_BANDS,JOURNEY_END_BANDS} from './map-journeys-data.mjs?v=20261111uxconsol1';
import {MAP_RIT_SUBJECTS} from './map-rit-achievement.mjs?v=20261111schemas1';

export const LEADER_FOCUS_SECTIONS=Object.freeze([
 ['follow-up','Follow-up'],['journeys','MAP Journeys'],
 ['academics','Academic Trends'],['experience','Student Experience'],
 ['support','Support']
]);
export const LEADER_FOCUS_VALUES=Object.freeze(LEADER_FOCUS_SECTIONS.map(x=>x[0]));
export const LEADER_JOURNEY_PRESETS=Object.freeze([
 {id:'rising',label:'Moving into Average+',description:'Low / Low Average → Average or above',
  startingBand:'both',endingBand:'average-plus',pathway:'cross'},
 {id:'continuing',label:'Still in lower bands',description:'Low / Low Average → Low / Low Average',
  startingBand:'both',endingBand:'below-average',pathway:'cross'},
 {id:'all',label:'All movements',description:'All achievement-band transitions',
  startingBand:'all',endingBand:'all',pathway:'all'}
]);
const allowed=(value,values,fallback)=>values.includes(value)?value:fallback;
const FALL_KEYS=JOURNEY_FALL_WINDOWS.map(w=>w.key);
const defaults=Object.freeze({
 section:'follow-up',grade:'All',classId:'',
 academicFocus:'',academicGrade:'',academicSubject:'',academicMultiple:false,
 mapBand:'both',reviewFilter:'all',voiceWindow:'F26',
 journeySubject:'Reading',journeyStart:'auto',journeyEnd:'F26',
 journeyStartingBand:'both',journeyEndingBand:'average-plus',
 journeyPathway:'auto',journeyPreset:'rising',journeyAdvancedOpen:false,
 journeyProfileSubject:'Reading'
});
export function leaderSectionForTarget(id){
 if(id==='leader-map-journeys')return 'journeys';
 if(['leader-learning-title','leader-academic-detail','leader-subject-detail',
  'leader-report-followup-title','leader-map-review'].includes(id))return 'academics';
 if(['leader-experience-title','leader-experience-review'].includes(id))return 'experience';
 if(id==='leader-support-title')return 'support';
 if(['leader-review','leader-academic-results'].includes(id))return 'follow-up';
 return null;
}
export function normalizeLeaderView(raw,classes=[]){
 if(!raw||!['Elementary','Secondary'].includes(raw.division))return null;
 const division=raw.division;
 const grade=raw.grade==='All'||raw.grade===undefined?'All':raw.grade;
 if(grade!=='All'&&(!GRADES.includes(grade)||
  (gradeNumber(grade)<=5?'Elementary':'Secondary')!==division))return null;
 const classId=typeof raw.classId==='string'&&
  classes.some(c=>c.id===raw.classId&&
   (grade==='All'||c.grade===grade)&&
   (gradeNumber(c.grade)<=5?'Elementary':'Secondary')===division)?
  raw.classId:'';
 const section=allowed(raw.section,LEADER_FOCUS_VALUES,'follow-up');
 const journeyStart=allowed(raw.journeyStart,['auto',...FALL_KEYS],'auto');
 const journeyEnd=allowed(raw.journeyEnd,FALL_KEYS,'F26');
 const effectiveStart=journeyStart==='auto'?(division==='Elementary'?'F24':'F22'):journeyStart;
 return {
  division,grade,classId,section,
  academicFocus:allowed(raw.academicFocus,['','map','subjects'],''),
  academicGrade:allowed(raw.academicGrade,['',...GRADES],''),
  academicSubject:allowed(raw.academicSubject,['',...MAP_RIT_SUBJECTS],''),
  academicMultiple:raw.academicMultiple===true,
  mapBand:allowed(raw.mapBand,['both','low','low-average'],'both'),
  reviewFilter:allowed(raw.reviewFilter,['all','attendance','academic2','academic3'],'all'),
  voiceWindow:allowed(raw.voiceWindow,['F25','S26','F26'],'F26'),
  journeySubject:allowed(raw.journeySubject,MAP_RIT_SUBJECTS,'Reading'),
  journeyStart:FALL_KEYS.indexOf(effectiveStart)<FALL_KEYS.indexOf(journeyEnd)?journeyStart:'auto',
  journeyEnd,
  journeyStartingBand:allowed(raw.journeyStartingBand,JOURNEY_START_BANDS,'both'),
  journeyEndingBand:allowed(raw.journeyEndingBand,JOURNEY_END_BANDS,'average-plus'),
  journeyPathway:allowed(raw.journeyPathway,['auto','cross','all'],'auto'),
  journeyPreset:allowed(raw.journeyPreset,[...LEADER_JOURNEY_PRESETS.map(x=>x.id),'custom'],'rising'),
  journeyAdvancedOpen:raw.journeyAdvancedOpen===true,
  journeyProfileSubject:allowed(raw.journeyProfileSubject,MAP_RIT_SUBJECTS,'Reading')
 };
}
export function leaderSavedViewPayload(state){
 return {
  division:state.division,grade:state.grade,classId:state.classId||'',
  section:state.leaderSection||'follow-up',
  academicFocus:state.leaderAcademicFocus||'',
  academicGrade:state.leaderAcademicGrade||'',
  academicSubject:state.leaderAcademicSubject||'',
  academicMultiple:state.leaderAcademicMultiple===true,
  mapBand:state.leaderMapBand||'both',
  reviewFilter:state.leaderReviewFilter||'all',
  voiceWindow:state.window||'F26',
  journeySubject:state.journeySubject||'Reading',
  journeyStart:state.journeyStart||'auto',
  journeyEnd:state.journeyEnd||'F26',
  journeyStartingBand:state.journeyStartingBand||'both',
  journeyEndingBand:state.journeyEndingBand||'average-plus',
  journeyPathway:state.journeyPathway||'auto',
  journeyPreset:state.journeyPreset||'rising',
  journeyAdvancedOpen:state.journeyAdvancedOpen===true,
  journeyProfileSubject:state.journeyProfileSubject||'Reading'
 };
}
export function leaderApplySavedView(state,view){
 if(!view)return state;
 Object.assign(state,{
  division:view.division,grade:view.grade,classId:view.classId,
  leaderSection:view.section,
  leaderAcademicFocus:view.academicFocus,
  leaderAcademicGrade:view.academicGrade,
  leaderAcademicSubject:view.academicSubject,
  leaderAcademicMultiple:view.academicMultiple,
  leaderMapBand:view.mapBand,
  leaderReviewFilter:view.reviewFilter,
  window:view.voiceWindow,
  journeySubject:view.journeySubject,
  journeyStart:view.journeyStart,
  journeyEnd:view.journeyEnd,
  journeyStartingBand:view.journeyStartingBand,
  journeyEndingBand:view.journeyEndingBand,
  journeyPathway:view.journeyPathway,
  journeyPreset:view.journeyPreset,
  journeyAdvancedOpen:view.journeyAdvancedOpen,
  journeyProfileSubject:view.journeyProfileSubject
 });
 return state;
}
