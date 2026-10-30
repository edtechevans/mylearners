/** My Learners | Faculty everyday roster.
 * Exactly four or five existing, age-appropriate evidence measures by grade,
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
 map:{id:'map',label:'MAP Mathematics growth',kind:'map',subject:'Mathematics'},
 engagement:{id:'engagement',label:'Engagement · check-in',kind:'engagement'},
 belonging:{id:'belonging',label:'Belonging · check-in',kind:'belonging'},
 core:{id:'core',label:'Core Phonics',kind:'core'},
 fp:{id:'fp',label:'F&P Reading',kind:'fp'},
 ixl:{id:'ixl',label:'IXL Mathematics',kind:'ixl'},
 maia:{id:'maia',label:'Maia · Relationships',kind:'flourishing'}
});
export function everydayEvidenceForGrade(grade){
 const n=gradeNumber(grade);
 if(n<0)return [COLUMN.attendance,COLUMN.earlyMath,COLUMN.earlyLiteracy,COLUMN.earlyInquiry];
 if(n===0)return [COLUMN.attendance,COLUMN.math,COLUMN.core,COLUMN.fp];
 if(n<=2)return [COLUMN.attendance,COLUMN.math,COLUMN.core,COLUMN.fp,COLUMN.ixl];
 if(n<=10)return [COLUMN.attendance,COLUMN.map,COLUMN.ixl,COLUMN.engagement,COLUMN.belonging];
 return [COLUMN.attendance,COLUMN.math,COLUMN.engagement,COLUMN.belonging,COLUMN.maia];
}
export const EVERYDAY_VIEW='everyday';
export const FOCUSED_VIEW='focused';
export function validRosterView(value){return value===FOCUSED_VIEW?FOCUSED_VIEW:EVERYDAY_VIEW}
