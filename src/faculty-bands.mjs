/** Consistent data-wall bands. Academic quartiles describe fictional same-grade cohorts,
 * never official norms. Survey bands are fixed numeric intervals, never quartiles. */
export const BAND_KEYS=Object.freeze(['band-low','band-mid-low','band-mid-high','band-high']);
export function experienceBand(value){
 if(!Number.isFinite(value)||value< -2||value>2)return null;
 return value< -1?BAND_KEYS[0]:value<0?BAND_KEYS[1]:value<1?BAND_KEYS[2]:BAND_KEYS[3];
}
export function formatIndex(value){
 return Number.isFinite(value)?(value>0?'+':'')+value.toFixed(2):'—';
}
export function quartileBand(value,cohortValues,minimum=20){
 if(!Number.isFinite(value)||!Array.isArray(cohortValues))return null;
 const sorted=cohortValues.filter(Number.isFinite).sort((a,b)=>a-b);
 if(sorted.length<minimum)return null;
 const lower=sorted.filter(n=>n<value).length,ties=sorted.filter(n=>n===value).length;
 if(!ties)return null;
 const midrank=(lower+ties/2)/sorted.length;
 const q=Math.max(1,Math.min(4,Math.ceil(midrank*4)));
 return {band:BAND_KEYS[q-1],label:'Q'+q,quartile:q,count:sorted.length};
}
