/** Faculty Everyday header presentation. Underlying subject IDs and grades are untouched.
 * Only teacher-facing roster labels are abbreviated; exact source subjects
 * remain available for sorting, filtering, exports and saved column layouts.
 */
export const FACULTY_SUBJECT_SHORT_NAMES=Object.freeze({
 'Language & Literature':Object.freeze({short:'L&L',full:'Language & Literature'}),
 'Language Acquisition':Object.freeze({short:'LA',full:'Language Acquisition'}),
 'Mathematics':Object.freeze({short:'Math',full:'Mathematics'}),
 'Individuals & Societies':Object.freeze({short:'I&S',full:'Individuals & Societies'}),
 'Physical & Health Education':Object.freeze({short:'PHE',full:'Physical & Health Education'}),
 'Arts':Object.freeze({short:'VPA',full:'Visual & Performing Arts'})
});
export function facultyHeaderInfo(column){
 const original=String(column?.label||column?.subject||'');
 const subject=String(column?.subject||'');
 const alias=column?.kind==='report'?FACULTY_SUBJECT_SHORT_NAMES[subject]:null;
 const display=alias?.short||
  (column?.kind==='engagement'?'Engagement':
   column?.kind==='belonging'?'Belonging':original);
 const full=alias?.full||(column?.kind==='engagement'?'Engagement':
  column?.kind==='belonging'?'Belonging':original);
 return {display,full,original,abbreviated:!!alias,
  singleWord:!/\s/.test(display)};
}
/** Reserve space for one full word, the sorting arrow and the draggable grip.
 * Columns may still be manually resized or reordered by Faculty.
 */
export function facultyHeaderWidth(column){
 const info=facultyHeaderInfo(column);
 if(column?.kind==='attendance')return 122;
 if(info.abbreviated)return 110;
 if(column?.kind==='engagement'||column?.kind==='belonging')return 146;
 if(column?.kind==='screener')return 140;
 if(column?.kind==='ufli')return 116;
 if(column?.kind==='mapRit')return 126;
 if(column?.kind==='ixl')return 126;
 if(column?.kind==='flourishing')return 132;
 if(column?.kind==='core'||column?.kind==='fp')return 126;
 if(column?.kind==='report')return 132;
 return 122;
}
export function facultyRosterTableWidth(columns){
 const learner=210,attendance=facultyHeaderWidth({kind:'attendance'}),support=172;
 return Math.max(1200,learner+attendance+support+
  (columns||[]).filter((_,i)=>i>0).reduce((sum,column)=>sum+facultyHeaderWidth(column),0));
}


/** Header/source grouping is a visual guide only; no metric or scoring changes. */
export function facultyEvidenceFamily(column){
 const kind=String(column?.kind||'');
 if(kind==='attendance')return 'attendance';
 if(kind==='report')return 'report';
 if(['map','mapRit','ixl','core','fp','flourishing'].includes(kind))return 'assessment';
 if(kind==='screener')return 'screener';
 if(kind==='ufli')return 'lesson';
 if(kind==='engagement'||kind==='belonging')return 'experience';
 if(kind==='support')return 'support';
 return kind==='identity'?'identity':'other';
}
/** Recompute subtle boundaries from the current visible order; source column
 * identifiers never change, even after teacher drag/reorder/hide actions. */
export function facultyGroupTransitions(families,order,hidden=[]){
 const hiddenSet=new Set(hidden||[]);
 let previous=null;
 const starts=[];
 for(const index of order||[]){
  if(hiddenSet.has(index))continue;
  const family=families?.[index]||'other';
  if(previous!==null&&family!==previous)starts.push(index);
  previous=family;
 }
 return starts;
}
/** Never keep a 1400px default table after a teacher hides most columns.
 * User-selected widths contribute to the total; a modest lower bound protects
 * the learner column when only a few measures remain. */
export function facultyVisibleTableWidth(tracks,hidden=[],minimum=640){
 const hiddenSet=new Set(hidden||[]);
 const total=(tracks||[]).reduce((sum,width,index)=>
  hiddenSet.has(index)?sum:sum+(Number.isFinite(Number(width))&&Number(width)>0?
   Number(width):124),0);
 return Math.max(minimum,Math.ceil(total));
}
