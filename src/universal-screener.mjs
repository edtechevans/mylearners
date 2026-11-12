/** Synthetic demo-only Universal Screener, not real assessment data. */
import {hash,rng} from './data.mjs';
export const SCREENER_BANDS=Object.freeze([
 {key:'low',min:0,max:24,label:'0–24%',colour:'#a6373f',ink:'#ffffff'},
 {key:'mid-low',min:25,max:49,label:'25–49%',colour:'#e4a15f',ink:'#172f38'},
 {key:'mid-high',min:50,max:74,label:'50–74%',colour:'#a6bd88',ink:'#172f38'},
 {key:'high',min:75,max:100,label:'75–100%',colour:'#246b4f',ink:'#ffffff'}
]);
export const SCREENER_BAND_KEYS=Object.freeze(['all',...SCREENER_BANDS.map(x=>x.key)]);
export const SCREENER_PAGE_SIZE=18;
export function universalScreenerPercent(student){
 const id=typeof student==='string'?student:student?.id;
 if(typeof id!=='string'||!id)return null;
 return Math.floor(rng(hash('AISG-universal-screener-demo-v1|'+id))()*101);
}
export function universalScreenerBand(percent){
 if(!Number.isInteger(percent)||percent<0||percent>100)return null;
 return SCREENER_BANDS.find(x=>percent>=x.min&&percent<=x.max)||null;
}
export function universalScreenerFor(student){
 const percent=universalScreenerPercent(student),band=universalScreenerBand(percent);
 return band?{percent,band:band.key,label:band.label,isDemo:true}:null;
}
export function renderUniversalScreenerTile(student,{compact=false}={}){
 const record=universalScreenerFor(student);
 if(!record)return '<span class="us-tile us-missing">—</span>';
 return '<span class="us-tile us-band-'+record.band+(compact?' us-compact':'')+
  '" aria-label="Universal Screener '+record.percent+' percent, synthetic demonstration">'+
  '<strong>'+record.percent+'%</strong></span>';
}
export function universalScreenerSummary(students){
 const entries=(students||[]).map(student=>({student,...universalScreenerFor(student)}))
  .filter(x=>Number.isInteger(x.percent));
 return {total:(students||[]).length,available:entries.length,
  average:entries.length?Math.round(entries.reduce((sum,x)=>sum+x.percent,0)/entries.length):null,
  counts:Object.fromEntries(SCREENER_BANDS.map(b=>[b.key,entries.filter(x=>x.band===b.key).length])),
  entries};
}
