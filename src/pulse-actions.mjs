/** Teacher-owned, entirely local DEMONSTRATION notes/actions.
 * This is NOT a production MTSS, counselling, safeguarding or intervention record.
 * The only persisted values are synthetic demo actions and group edits.
 * School use requires an authorised backend, SSO, audit controls and retention policy.
 */
import {hash} from './data.mjs';
export const ACTION_STATUSES=['open','revisit','completed'];
export const ACTION_STAGE_LABELS={open:'Notice & respond',revisit:'Ready to revisit',completed:'Reviewed'};
const ACTION_KEY='aisg-mylearners-v2-actions-';
const GROUP_KEY='aisg-mylearners-v2-groups-';
function demoStorage(){try{return globalThis.localStorage}catch{return null}}
export const storageAvailable=()=>{try{const x=globalThis.localStorage;const k='aisg-storage-test';x.setItem(k,'1');x.removeItem(k);return true}catch{return false}};
const clean=(x,max=240)=>String(x??'').trim().slice(0,max);
function safeRead(storage,key){try{const x=storage?.getItem(key);return x?JSON.parse(x):null}catch{return null}}
function safeWrite(storage,key,value){try{storage?.setItem(key,JSON.stringify(value));return true}catch{return false}}
const keyFor=teacherId=>ACTION_KEY+teacherId;
function initialActions(teacher,classes){
 const first=classes.find(c=>teacher.classIds.includes(c.id));
 if(!first)return [];
 return [
  {id:'seed-'+teacher.id+'-1',teacherId:teacher.id,classId:first.id,studentId:'',
   title:'Revisit recent reasoning evidence',evidence:'Demo formative check · 7 Oct 2026',
   strategy:'Use modelling, partner explanation and a quick check for understanding.',
   status:'revisit',due:'2026-10-09',outcome:'',
   created:'2026-10-07',updated:'2026-10-08',demoSeed:true},
  {id:'seed-'+teacher.id+'-2',teacherId:teacher.id,classId:first.id,studentId:'',
   title:'Check outstanding practice responses',evidence:'Demo assignment statuses · 7 Oct 2026',
   strategy:'Ask learners about missing evidence and offer a supported route to completion.',
   status:'open',due:'2026-10-12',outcome:'',
   created:'2026-10-08',updated:'2026-10-08',demoSeed:true}
 ];
}
function validAction(a,teacherId){
 return a&&typeof a==='object'&&a.teacherId===teacherId&&typeof a.title==='string'&&typeof a.id==='string'&&ACTION_STATUSES.includes(a.status);
}
export function loadActions(teacher,classes,storage=demoStorage()){
 const saved=safeRead(storage,keyFor(teacher.id));
 if(Array.isArray(saved))return saved.filter(a=>validAction(a,teacher.id)).slice(0,250);
 return initialActions(teacher,classes);
}
export function writeActions(teacher,rows,storage=demoStorage()){
 const valid=rows.filter(x=>validAction(x,teacher.id)).slice(0,250);
 safeWrite(storage,keyFor(teacher.id),valid);
 return valid;
}
export function createAction(teacher,classes,draft,storage=demoStorage()){
 const allowed=new Set(teacher.classIds);
 if(!allowed.has(draft.classId))throw Error('Class is outside fictional teacher scope');
 const group=classes.find(c=>c.id===draft.classId);
 if(draft.studentId&&!group?.studentIds?.includes(draft.studentId))throw Error('Learner is outside this fictional teaching group');
 const title=clean(draft.title,130),strategy=clean(draft.strategy,500);
 if(!title||!strategy)throw Error('Give the response a title and a brief instructional action');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(draft.due||'')))throw Error('Select a valid follow-up date');
 const previous=loadActions(teacher,classes,storage);
 const id='ACT-'+hash(teacher.id+'|'+Date.now()+'|'+Math.random()).toString(36).toUpperCase();
 const item={id,teacherId:teacher.id,classId:draft.classId,
   studentId:clean(draft.studentId,30),title,strategy,
   evidence:clean(draft.evidence||'Teacher-created demonstration follow-up',180),
   status:'open',due:draft.due,outcome:'',created:'2026-10-08',updated:'2026-10-08',demoSeed:false};
 writeActions(teacher,[item,...previous],storage);
 return item;
}
export function updateAction(teacher,classes,id,changes,storage=demoStorage()){
 const previous=loadActions(teacher,classes,storage);
 const index=previous.findIndex(x=>x.id===id);
 if(index<0)throw Error('Action not found for this teacher');
 const original=previous[index];
 const next={...original,updated:'2026-10-08'};
 if('status' in changes&&ACTION_STATUSES.includes(changes.status))next.status=changes.status;
 if('outcome' in changes)next.outcome=clean(changes.outcome,600);
 if('strategy' in changes)next.strategy=clean(changes.strategy,500);
 if('due' in changes&&/^\d{4}-\d{2}-\d{2}$/.test(String(changes.due)))next.due=changes.due;
 previous[index]=next;writeActions(teacher,previous,storage);return next;
}
export function removeAction(teacher,classes,id,storage=demoStorage()){
 const previous=loadActions(teacher,classes,storage);
 const filtered=previous.filter(x=>x.id!==id);
 writeActions(teacher,filtered,storage);return filtered.length<previous.length;
}
export function actionCounts(rows){
 return {open:rows.filter(a=>a.status==='open').length,
   revisit:rows.filter(a=>a.status==='revisit').length,
   completed:rows.filter(a=>a.status==='completed').length,
   total:rows.length};
}
export function saveGroupOverrides(teacherId,classId,assignments,storage=demoStorage()){
 const cleanMap=Object.fromEntries(Object.entries(assignments||{}).filter(([student,group])=>
   /^DEMO-\d{4}$/.test(student)&&['revisit','developing','secure','extend'].includes(group)));
 safeWrite(storage,GROUP_KEY+teacherId+'-'+classId,cleanMap);return cleanMap;
}
export function readGroupOverrides(teacherId,classId,storage=demoStorage()){
 const x=safeRead(storage,GROUP_KEY+teacherId+'-'+classId);
 return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
}
export function resetPersonaDemo(teacher,storage=demoStorage()){
 try{
  storage?.removeItem(keyFor(teacher.id));
  for(const c of teacher.classIds)storage?.removeItem(GROUP_KEY+teacher.id+'-'+c);
 }catch{}
}
