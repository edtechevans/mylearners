/** Shareable, validated Board-only deep links; other My Learners views unchanged. */
import {BOARD_DATA,BOARD_GRADE_LIST} from './board-map-data.mjs';
import {DP_RECORDS} from './board-dp-data.mjs';
import {DIPLOMA_SUBJECTS,DP_SUBJECT_DEFAULT} from './board-dp-subjects.mjs';
const views=new Set(['overview','explore','dp']);
const subjects=new Set(['math','reading','language']);
const divisions=new Set(['all','elementary','secondary']);
const trends=new Set(['fall','spring']);
const focuses=new Set(['all','math','reading','language']);
const dpMetrics=new Set(['average','passRate']);
const dpScales=new Set(['focus','full']);
const dpWorldBases=new Set(['recipients','overall']);
const dpYears=new Set(DP_RECORDS.map(r=>String(r.end)));
const dpCourses=new Set(DIPLOMA_SUBJECTS.map(s=>s.id));
const dpRanges=new Set(['all','recent']);
const currentDpYear=String(DP_RECORDS.at(-1).end);
const clean=(value,accepted,fallback)=>accepted.has(value)?value:fallback;
export function parseBoardHash(hash){
 const value=String(hash||'').replace(/^#\/?/,'');
 if(!/^board(?:\?|$)/.test(value))return null;
 const index=value.indexOf('?');
 const params=new URLSearchParams(index<0?'':value.slice(index+1));
 const division=clean(params.get('division'),divisions,'all');
 const grade=params.get('grade');
 const gradeInt=Number(grade);
 const validGrade=grade&&BOARD_GRADE_LIST.includes(gradeInt)&&
  (division==='all'||division==='elementary'&&gradeInt<=5||division==='secondary'&&gradeInt>=6);
 const window=params.get('window');
 return {
  boardView:clean(params.get('view'),views,'overview'),
  boardOverviewChart:params.get('chart')==='map'?'map':'dp',
  boardDpMetric:clean(params.get('metric'),dpMetrics,'average'),
  boardDpScale:clean(params.get('scale'),dpScales,'focus'),
  boardDpWorldBasis:clean(params.get('world'),dpWorldBases,'overall'),
  boardDpSubject:clean(params.get('course'),dpCourses,DP_SUBJECT_DEFAULT),
  boardDpYear:clean(params.get('year'),dpYears,currentDpYear),
  boardDpRange:clean(params.get('range'),dpRanges,'all'),
  boardTrendTerm:clean(params.get('term'),trends,'fall'),
  boardTrendRange:params.get('history')==='all'?'all':'recent',
  boardMapDetailsOpen:params.get('details')==='1'||!!validGrade,
  boardMapCompareSeasons:params.get('compare')==='1',
  boardMapGrowthOpen:params.get('growth')==='1',
  boardTrendFocus:params.get('focus')==='both'?'all':clean(params.get('focus'),focuses,'all'),
  boardWindow:window&&BOARD_DATA[window]?window:'fall2026',
  boardSubject:clean(params.get('subject'),subjects,'math'),
  boardDivision:division,boardGrade:validGrade?String(gradeInt):'all'
 };
}
export function boardHash(state){
 const params=new URLSearchParams();
 const view=clean(state.boardView,views,'overview');
 params.set('view',view);
 if(view==='dp'){
  params.set('metric',clean(state.boardDpMetric,dpMetrics,'average'));
  if(state.boardDpScale==='full')params.set('scale','full');
  if(dpWorldBases.has(state.boardDpWorldBasis))params.set('world',state.boardDpWorldBasis);
  if(dpCourses.has(state.boardDpSubject)&&state.boardDpSubject!==DP_SUBJECT_DEFAULT)params.set('course',state.boardDpSubject);
  const year=String(state.boardDpYear??currentDpYear);
  if(dpYears.has(year)&&year!==currentDpYear)params.set('year',year);
  if(state.boardDpRange==='recent')params.set('range','recent');
 }else if(view==='overview'){
  if(state.boardOverviewChart==='dp'){
   params.set('chart','dp');
   params.set('metric',clean(state.boardDpMetric,dpMetrics,'average'));
   if(state.boardDpScale==='full')params.set('scale','full');
   if(dpWorldBases.has(state.boardDpWorldBasis))params.set('world',state.boardDpWorldBasis);
  }else{
   params.set('term',clean(state.boardTrendTerm,trends,'fall'));
   params.set('focus',clean(state.boardTrendFocus,focuses,'all'));
   if(state.boardTrendRange==='all')params.set('history','all');
  }
 }else{
  params.set('window',BOARD_DATA[state.boardWindow]?state.boardWindow:'fall2026');
  params.set('subject',clean(state.boardSubject,subjects,'math'));
  params.set('division',clean(state.boardDivision,divisions,'all'));
  const grade=String(state.boardGrade||'all');
  params.set('grade',BOARD_GRADE_LIST.includes(Number(grade))?grade:'all');
  if(state.boardMapDetailsOpen)params.set('details','1');
  if(state.boardMapCompareSeasons)params.set('compare','1');
  if(state.boardMapGrowthOpen)params.set('growth','1');
 }
 return '#/board?'+params.toString();
}
export function boardShareUrl(location,state){
 const origin=String(location?.origin||''),pathname=String(location?.pathname||'/'),
  search=String(location?.search||'');
 return origin+pathname+search+boardHash(state);
}
