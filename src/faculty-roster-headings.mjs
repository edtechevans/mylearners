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
 if(info.abbreviated)return 100;
 if(column?.kind==='engagement')return 148;
 if(column?.kind==='belonging')return 138;
 if(column?.kind==='screener')return 142;
 if(column?.kind==='ufli')return 110;
 if(column?.kind==='mapRit')return 126;
 if(column?.kind==='ixl')return 122;
 if(column?.kind==='flourishing')return 135;
 if(column?.kind==='core'||column?.kind==='fp')return 122;
 if(column?.kind==='report')return 132;
 return 122;
}
export function facultyRosterTableWidth(columns){
 const learner=210,attendance=facultyHeaderWidth({kind:'attendance'}),support=172;
 return Math.max(1200,learner+attendance+support+
  (columns||[]).filter((_,i)=>i>0).reduce((sum,column)=>sum+facultyHeaderWidth(column),0));
}
