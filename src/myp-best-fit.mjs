/** MYP current best-fit grading for partial criterion evidence.
 *
 * Applies to current G6-G10 subject evidence only. Missing criteria are ignored,
 * never converted to zero. Criterion scores are whole numbers from 0-8.
 */
export const MYP_CRITERIA=Object.freeze(['A','B','C','D']);
export const MYP_GRADE_BOUNDARIES=Object.freeze([
 {grade:1,min:1,max:5},
 {grade:2,min:6,max:9},
 {grade:3,min:10,max:14},
 {grade:4,min:15,max:18},
 {grade:5,min:19,max:23},
 {grade:6,min:24,max:27},
 {grade:7,min:28,max:32}
]);

function criterionScore(value){
 const raw=value&&typeof value==='object'?'score' in value?value.score:null:value;
 if(raw===null||raw===undefined||String(raw).trim()==='')return null;
 const n=Number(raw);
 return Number.isInteger(n)&&n>=0&&n<=8?n:null;
}
function criterionSource(criteria){
 if(Array.isArray(criteria))return criteria.slice(0,4);
 if(criteria&&typeof criteria==='object')return MYP_CRITERIA.map(key=>criteria[key]);
 return [];
}
export function mypBestFit(criteria){
 const scores=criterionSource(criteria).map(criterionScore).filter(value=>value!==null);
 const criteriaCount=scores.length;
 if(!criteriaCount)return {
  grade:null,projectedTotal:null,criteriaCount:0,complete:false,provisional:false,scores:[]
 };
 const sum=scores.reduce((total,value)=>total+value,0);
 const projectedTotal=Math.max(0,Math.min(32,Math.round(sum/criteriaCount*4)));
 const grade=projectedTotal===0?null:
  MYP_GRADE_BOUNDARIES.find(boundary=>
   projectedTotal>=boundary.min&&projectedTotal<=boundary.max)?.grade??null;
 return {
  grade,projectedTotal,criteriaCount,
  complete:criteriaCount===4,provisional:criteriaCount<4,scores
 };
}
