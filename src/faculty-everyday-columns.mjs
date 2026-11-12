/** My Learners | Faculty everyday roster.
 * Grade-aware evidence measures, including three MAP RIT subjects for G3–G10,
 * separate from Learner and permission-controlled Support information.
 * A teacher can switch to the existing focused evidence/comparison view.
 */
import {gradeNumber} from './data.mjs';
const COLUMN=Object.freeze({
 attendance:{id:'attendance',label:'Attendance',kind:'attendance'},
 math:{id:'math',label:'Mathematics · last issued',kind:'report',subject:'Mathematics'},
 earlyMath:{id:'earlyMath',label:'Early Mathematics · last issued',kind:'report',subject:'Early Mathematics'},
 earlyLiteracy:{id:'earlyLiteracy',label:'Early Literacy · last issued',kind:'report',subject:'Early Literacy'},
 earlyInquiry:{id:'earlyInquiry',label:'Inquiry & Play · last issued',kind:'report',subject:'Inquiry & Play'},
 mapReading:{id:'mapReading',label:'MAP Reading RIT',kind:'mapRit',subject:'Reading'},
 mapMathematics:{id:'mapMathematics',label:'MAP Math RIT',kind:'mapRit',subject:'Mathematics'},
 mapLanguage:{id:'mapLanguage',label:'MAP Language Usage RIT',kind:'mapRit',subject:'Language Usage'},
 engagement:{id:'engagement',label:'Engagement · check-in',kind:'engagement'},
 belonging:{id:'belonging',label:'Belonging · check-in',kind:'belonging'},
 core:{id:'core',label:'Core Phonics',kind:'core'},
 fp:{id:'fp',label:'F&P Reading',kind:'fp'},
 ixl:{id:'ixl',label:'IXL Math',kind:'ixl'},
 maia:{id:'maia',label:'Maia · Relationships',kind:'flourishing'},
 screener:{id:'screener',label:'Universal Screener',kind:'screener'},
 ufli:{id:'ufli',label:'UFLI Lesson',kind:'ufli'}
});
export function everydayEvidenceForGrade(grade){
 const n=gradeNumber(grade);
 const base=n<0?[COLUMN.attendance,COLUMN.earlyMath,COLUMN.earlyLiteracy,COLUMN.earlyInquiry]:
  n===0?[COLUMN.attendance,COLUMN.math,COLUMN.core,COLUMN.fp]:
  n<=2?[COLUMN.attendance,COLUMN.math,COLUMN.core,COLUMN.fp,COLUMN.ixl]:
  n<=10?[COLUMN.attendance,COLUMN.mapReading,COLUMN.mapMathematics,COLUMN.mapLanguage,COLUMN.ixl,COLUMN.engagement,COLUMN.belonging]:
  [COLUMN.attendance,COLUMN.math,COLUMN.engagement,COLUMN.belonging,COLUMN.maia];
 return n>=0&&n<=5?[base[0],COLUMN.screener,COLUMN.ufli,...base.slice(1)]:
  [base[0],COLUMN.screener,...base.slice(1)];
}
export const EVERYDAY_VIEW='everyday';
export const FOCUSED_VIEW='focused';
export function validRosterView(value){return value===FOCUSED_VIEW?FOCUSED_VIEW:EVERYDAY_VIEW}
