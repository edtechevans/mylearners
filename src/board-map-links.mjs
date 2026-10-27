/** Shareable, validated Board-only deep links; other My Learners views unchanged. */
import {BOARD_DATA,BOARD_GRADE_LIST} from './board-map-data.mjs';
const views=new Set(['overview','explore']);
const subjects=new Set(['math','reading','language']);
const divisions=new Set(['all','elementary','secondary']);
const trends=new Set(['fall','spring']);
const focuses=new Set(['both','math','reading']);
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
  boardTrendTerm:clean(params.get('term'),trends,'fall'),
  boardTrendFocus:clean(params.get('focus'),focuses,'both'),
  boardWindow:window&&BOARD_DATA[window]?window:'fall2026',
  boardSubject:clean(params.get('subject'),subjects,'math'),
  boardDivision:division,boardGrade:validGrade?String(gradeInt):'all'
 };
}
export function boardHash(state){
 const params=new URLSearchParams();
 const view=clean(state.boardView,views,'overview');
 params.set('view',view);
 if(view==='overview'){
  params.set('term',clean(state.boardTrendTerm,trends,'fall'));
  params.set('focus',clean(state.boardTrendFocus,focuses,'both'));
 }else{
  params.set('window',BOARD_DATA[state.boardWindow]?state.boardWindow:'fall2026');
  params.set('subject',clean(state.boardSubject,subjects,'math'));
  params.set('division',clean(state.boardDivision,divisions,'all'));
  const grade=String(state.boardGrade||'all');
  params.set('grade',BOARD_GRADE_LIST.includes(Number(grade))?grade:'all');
 }
 return '#/board?'+params.toString();
}
export function boardShareUrl(location,state){
 const origin=String(location?.origin||''),pathname=String(location?.pathname||'/'),
  search=String(location?.search||'');
 return origin+pathname+search+boardHash(state);
}
