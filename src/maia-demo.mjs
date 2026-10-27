/** 
 * MaiaLearning Flourishing UI prototype: entirely synthetic, NOT a vendor export.
 * MaiaLearning documents PERMA domains but not the export scale in public docs.
 * The illustrative 0-10 scale is a UI design choice, NOT verified official scoring.
 * NO real data, sensitive records, responses, benchmarks, classifications or risk flags.
 */
import {hash,rng,clamp,gradeNumber} from './data.mjs';
export const MAIA_PERIODS=Object.freeze([
 {key:'F25',label:'Fall 2025',date:'2025-09-24'},
 {key:'F26',label:'Fall 2026',date:'2026-09-24'}
]);
export const MAIA_DIMENSIONS=Object.freeze([
 {key:'positive',label:'Positive Emotion',short:'Positive emotion'},
 {key:'engagement',label:'Engagement',short:'Engagement'},
 {key:'relationships',label:'Relationships',short:'Relationships'},
 {key:'meaning',label:'Meaning',short:'Meaning'},
 {key:'accomplishment',label:'Accomplishment',short:'Accomplishment'}
]);
export const MAIA_DEFAULT_DIMENSION='relationships';
export const maiaEligible=s=>!!s&&gradeNumber(s.grade)>=6&&gradeNumber(s.grade)<=12;
export const maiaDimension=id=>MAIA_DIMENSIONS.some(x=>x.key===id)?id:MAIA_DEFAULT_DIMENSION;
export const maiaPeriod=id=>MAIA_PERIODS.some(x=>x.key===id)?id:'F26';
const round1=n=>Math.round(n*10)/10;
export function createMaiaDemoRecords(students){
 const records=new Map();
 for(const s of students||[]){
  if(!/^DEMO-\d{4}$/.test(s.id))throw Error('Maia demo accepts fictional student IDs only');
  if(!maiaEligible(s))continue;
  const periods={};
  for(const period of MAIA_PERIODS){
   // The Grade 6 cohort was in Elementary the previous year.
   if(period.key==='F25'&&gradeNumber(s.grade)===6)continue;
   // Demonstrate incomplete uptake, with consistent deterministic missing rows.
   if(hash(s.id+'-maia-participation-'+period.key)%17===0)continue;
   const strengths=rng(hash(s.id+'-maia-personal'));
   const personal=4.8+strengths()*3.2;
   const dimensions={};
   for(const [idx,dim] of MAIA_DIMENSIONS.entries()){
    const variance=rng(hash(s.id+'-maia-'+dim.key+'-'+period.key))();
    const shift=period.key==='F26'?.2:-.15;
    const offset=(idx===2?.25:idx===4?.1:0);
    dimensions[dim.key]=round1(clamp(personal+(variance-.5)*3.25+shift+offset,1.0,9.6));
   }
   periods[period.key]={date:period.date,label:period.label,dimensions,
    source:'Synthetic example based on documented PERMA domains',scale:'illustrative 0-10',simulated:true};
  }
  records.set(s.id,periods);
 }
 return records;
}
export const maiaFor=(records,id,period='F26')=>records?.get(id)?.[maiaPeriod(period)]||null;
export const maiaValue=(records,id,dimension=MAIA_DEFAULT_DIMENSION,period='F26')=>{
 const row=maiaFor(records,id,period);
 const val=row?.dimensions[maiaDimension(dimension)];
 return Number.isFinite(val)?val:null;
};
export function maiaClassSummary(students,records,dimension=MAIA_DEFAULT_DIMENSION,period='F26'){
 const eligible=(students||[]).filter(maiaEligible);
 const values=eligible.map(s=>maiaValue(records,s.id,dimension,period)).filter(Number.isFinite);
 return {eligible:eligible.length,available:values.length,
  average:values.length?round1(values.reduce((a,b)=>a+b,0)/values.length):null};
}
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function renderMaiaFacultyProfile(student,records){
 if(!maiaEligible(student))return '';
 const latest=maiaFor(records,student.id,'F26');
 const earlier=maiaFor(records,student.id,'F25');
 return '<details class="maia-profile" data-maia-profile>'+
  '<summary><strong>MaiaLearning · Flourishing (PERMA)</strong><small>Fictional example · Fall 2026 · View five dimensions</small></summary>'+
  '<div class="maia-profile-content"><p class="maia-disclaimer">Illustrative PERMA dimension values on a demo 0–10 display scale. Not MaiaLearning official scores, cutoffs or clinical measures.</p>'+
  (latest?'<div class="maia-dimension-grid">'+MAIA_DIMENSIONS.map(dim=>{
    const v=latest.dimensions[dim.key];
    const previous=earlier?.dimensions[dim.key];
    return '<div class="maia-dimension"><div class="maia-dimension-heading"><span>'+esc(dim.label)+'</span><strong>'+v.toFixed(1)+' / 10</strong></div>'+
     '<div class="maia-meter"><span style="width:'+(v*10)+'%"></span></div>'+
     '<small>Fall 2026'+(Number.isFinite(previous)?' · Fall 2025: '+previous.toFixed(1):'')+'</small></div>';
   }).join('')+'</div>':
   '<p>No example response for this collection window.</p>')+
  '<p class="maia-disclaimer">The published MaiaLearning description confirms the PERMA model, but exact export columns and scoring have not been verified. This section uses fictional Secondary learners only.</p>'+
  '</div></details>';
}
