/** Accessible colour context for the fictional Leaders' student-experience index.
 * Use the exact existing -2 to +2 intervals; never infer academic proficiency.
 */
import {experienceBand,formatIndex} from './faculty-bands.mjs';
export const LEADER_EXPERIENCE_BANDS=Object.freeze([
 {band:'band-low',label:'−2 to below −1',short:'−2 to −1',colour:'Red'},
 {band:'band-mid-low',label:'−1 to below 0',short:'−1 to 0',colour:'Orange'},
 {band:'band-mid-high',label:'0 to below +1',short:'0 to +1',colour:'Light green'},
 {band:'band-high',label:'+1 to +2',short:'+1 to +2',colour:'Dark green'}
]);
export function leaderExperiencePosition(value){
 if(!Number.isFinite(value)||value< -2||value>2)return null;
 return Math.max(0,Math.min(100,(value+2)*25));
}
export function leaderExperienceChange(delta,previousLabel){
 if(!Number.isFinite(delta))return 'No earlier comparable check-in';
 const amount=Number(delta.toFixed(2));
 const prefix=amount>0?'+':'';
 return prefix+amount.toFixed(2)+' index points vs '+(previousLabel||'previous check-in');
}
export function leaderExperienceBandLabel(value){
 const band=experienceBand(value);
 return LEADER_EXPERIENCE_BANDS.find(x=>x.band===band)||null;
}
export function leaderExperienceScale(value,metric){
 const position=leaderExperiencePosition(value);
 const exact=Number.isFinite(value)?formatIndex(value):'No available check-in';
 const band=leaderExperienceBandLabel(value);
 const description=metric+': '+exact+' on the −2 to +2 index'+
  (band?'; '+band.colour+', '+band.label:'; no current index');
 return '<div class="leader-experience-scale'+(position===null?' is-missing':'')+
  '" role="img" aria-label="'+description+'">'+
  '<div class="leader-experience-segments" aria-hidden="true">'+
  LEADER_EXPERIENCE_BANDS.map(item=>'<span class="'+item.band+'"></span>').join('')+
  (position===null?'':'<span class="leader-experience-marker" style="left:'+position.toFixed(2)+'%"></span>')+
  '</div></div>';
}
export function leaderExperienceLegend(){
 return '<div class="leader-experience-legend" aria-label="Four fixed student-experience index bands">'+
  '<span class="leader-experience-legend-title">Index colours (−2 to +2)</span>'+
  LEADER_EXPERIENCE_BANDS.map(item=>'<span class="leader-experience-legend-item">'+
   '<span class="leader-experience-legend-swatch '+item.band+'" aria-hidden="true"></span>'+
   '<span>'+item.short+'</span></span>').join('')+
  '<span class="leader-experience-legend-note">Fixed index intervals · not report-card grades</span></div>';
}
