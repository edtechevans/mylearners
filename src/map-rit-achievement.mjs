/** MAP RIT achievement presentation for AISG My Learners' fictional demo records.
 * The five NWEA-style colours derive from achievement PERCENTILE, never RIT cutoffs.
 * Synthetic percentiles are for visual demonstration, not official NWEA norm lookups.
 */
import {subjectMapRecords} from './map-growth.mjs';

export const MAP_RIT_SUBJECTS=Object.freeze(['Reading','Mathematics','Language Usage']);
export const MAP_RIT_WINDOWS=Object.freeze([
 {key:'S25',label:'Spring 2025'},
 {key:'F25',label:'Fall 2025'},
 {key:'S26',label:'Spring 2026'},
 {key:'F26',label:'Fall 2026'}
]);
export const MAP_RIT_BANDS=Object.freeze([
 {key:'low',label:'Low',from:1,to:20,colour:'Red'},
 {key:'low-average',label:'Low Average',from:21,to:40,colour:'Orange'},
 {key:'average',label:'Average',from:41,to:60,colour:'Yellow'},
 {key:'high-average',label:'High Average',from:61,to:80,colour:'Green'},
 {key:'high',label:'High',from:81,to:99,colour:'Blue'}
]);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const validSubject=subject=>MAP_RIT_SUBJECTS.includes(subject);
export function mapRitBand(percentile){
 if(!Number.isInteger(percentile)||percentile<1||percentile>99)return null;
 return MAP_RIT_BANDS.find(b=>percentile>=b.from&&percentile<=b.to)||null;
}
export function mapRitCurrent(records,subject,window='F26'){
 if(!validSubject(subject))return null;
 return subjectMapRecords(records,subject).find(r=>r.key===window)||null;
}
export function mapRitHistory(records,subject){
 const indexed=new Map((validSubject(subject)?subjectMapRecords(records,subject):[]).map(r=>[r.key,r]));
 return MAP_RIT_WINDOWS.map(w=>({...w,record:indexed.get(w.key)||null}));
}
/** Actual point change from the most recent earlier valid same-subject test.
 * Never interpret a RIT-point change as an NWEA growth percentile or projection.
 * Missing current or earlier tests have no growth value.
 */
export function mapRitChange(records,subject,window='F26'){
 const ordered=validSubject(subject)?subjectMapRecords(records,subject):[];
 const current=ordered.find(r=>r.key===window)||null;
 const previous=current?ordered.filter(r=>r.date<current.date).at(-1)||null:null;
 return {current,previous,delta:current&&previous?current.rit-previous.rit:null};
}
export function mapRitChangeLabel(delta){
 return Number.isFinite(delta)?(delta>0?'+':'')+delta+' RIT':'No prior test';
}
export const mapRitDisplaySubject=subject=>subject==='Mathematics'?'Math':subject;
const subjectTitle=subject=>'MAP '+mapRitDisplaySubject(subject)+' RIT';
const pText=p=>Number.isInteger(p)?'P'+p:'Percentile unavailable';
export function renderMapRitHeader(subject){
 return '<th scope="col" class="map-rit-th" data-map-rit-subject="'+esc(subject)+
 '" aria-label="'+esc(subjectTitle(subject)+'. Hover or focus for percentile interpretation')+'">'+
 '<span class="map-rit-head-stack"><span class="map-rit-head-overline">MAP </span>'+
 '<span class="map-rit-head-subject">'+esc(mapRitDisplaySubject(subject))+'</span></span></th>';
}
export function renderMapRitCell(records,subject,studentId){
 const {current,previous,delta}=mapRitChange(records,subject);
 if(!current)return '<span class="map-rit-missing" data-student="'+esc(studentId)+
 '" data-map-rit-subject="'+esc(subject)+'"><strong>—</strong><small>No F26 test</small></span>';
 const band=mapRitBand(current.percentile);
 const growth=mapRitChangeLabel(delta);
 const comparison=previous?' since '+previous.window:'; no previous comparable test';
 return '<button type="button" class="map-rit-tile '+(band?'map-rit-'+band.key:'map-rit-unclassified')+
 '" data-student="'+esc(studentId)+'" data-map-rit-subject="'+esc(subject)+
 '" aria-label="'+esc(subjectTitle(subject)+': Fall 2026 '+current.rit+' RIT; '+growth+comparison+
 '; percentile rank '+(Number.isInteger(current.percentile)?current.percentile:'unavailable')+
 (band?', '+band.label:'')+'. Open learner profile for four testing windows.')+'">'+
 '<strong class="map-rit-score">'+esc(current.rit)+'</strong>'+
 '<span class="map-rit-growth '+(delta===null?'map-rit-growth-missing':
 delta>0?'map-rit-growth-up':delta<0?'map-rit-growth-down':'map-rit-growth-flat')+'">'+
 esc(growth)+'</span></button>';
}
const bandsHighFirst=MAP_RIT_BANDS.slice().reverse();
function bandRows(){
 return bandsHighFirst.map(b=>'<div class="map-rit-band-row"><i class="map-rit-swatch map-rit-'+b.key+
 '" aria-hidden="true"></i><strong>'+esc(b.label)+'</strong><span>'+b.from+'–'+b.to+
 ' percentile</span></div>').join('');
}
export function renderMapRitTooltip(subject){
 return '<div class="map-rit-tooltip-heading"><strong>'+esc(subjectTitle(subject))+'</strong>'+
 '<small>Achievement interpretation</small></div>'+
 '<p>The large number is the RIT score. The signed number underneath (e.g. +7 RIT) is the change since the most recent earlier valid test in the same subject. It is not a projected growth figure. Colour represents the achievement percentile band for that grade and term.</p>'+
 '<div class="map-rit-band-list">'+bandRows()+'</div>'+
 '<p class="map-rit-tooltip-note">NWEA-style quintiles; all displayed scores and percentiles are fictional, not calculated from official NWEA norms.</p>';
}
export function renderMapRitLegend(){
 return '<details class="map-rit-inline-legend"><summary><span class="map-rit-legend-dots" aria-hidden="true">'+
 bandsHighFirst.map(b=>'<i class="map-rit-'+b.key+'"></i>').join('')+
 '</span>MAP RIT colours · percentile guide</summary><div class="map-rit-inline-legend-body">'+
 '<p><strong>Large number = current RIT.</strong> The number beneath shows the RIT-point change from the most recent earlier valid test. The five background colours use achievement percentiles, not RIT cutoffs or growth. No previous test means no change can be calculated.</p>'+
 '<div class="map-rit-band-list">'+bandRows()+'</div><small>All MAP results in this demonstration are fictional.</small></div></details>';
}
function historyScore(record,delta){
 if(!record)return '<span class="map-rit-history-empty">—</span>';
 const band=mapRitBand(record.percentile);
 return '<span class="map-rit-history-value '+(band?'map-rit-'+band.key:'map-rit-unclassified')+'">'+
 '<span class="map-rit-history-score"><strong>'+esc(record.rit)+'</strong><small>'+esc(pText(record.percentile))+'</small></span>'+
 '<span class="map-rit-history-growth">'+esc(mapRitChangeLabel(delta))+'</span></span>';
}
export function renderMapRitProfile(records){
 if(!MAP_RIT_SUBJECTS.some(subject=>subjectMapRecords(records,subject).length))return '';
 const current=MAP_RIT_SUBJECTS.map(subject=>({subject,record:mapRitCurrent(records,subject)}));
 return '<section class="map-rit-profile" aria-label="MAP achievement RIT and score history">'+
 '<div class="map-rit-profile-heading"><div><span>MAP GROWTH ASSESSMENT</span>'+
 '<h2>RIT achievement across subjects</h2><p>Fall 2026 RIT scores and change since each subject’s previous valid test.</p></div>'+
 '<span class="map-rit-fictional">FICTIONAL MAP DATA</span></div>'+
 '<div class="map-rit-profile-grid">'+current.map(({subject,record})=>{
  const band=mapRitBand(record?.percentile);
  const change=mapRitChange(records,subject);
  return '<article class="map-rit-profile-subject '+(band?'map-rit-'+band.key:'map-rit-unclassified')+'">'+
   '<span>MAP '+esc(mapRitDisplaySubject(subject))+'</span><strong>'+(record?esc(record.rit):'—')+'</strong>'+
   (record?'<span class="map-rit-profile-growth">'+esc(mapRitChangeLabel(change.delta))+
    (change.previous?'<small>since '+esc(change.previous.window)+'</small>':'')+'</span>':'')+
   '<small>'+(record?esc(pText(record.percentile)+' · '+(band?.label||'Not classified')):'No Fall 2026 assessment')+
   '</small></article>';
 }).join('')+'</div>'+
 '<details class="map-rit-history"><summary>View MAP RIT history · Fall 2026 + three earlier windows</summary>'+
 '<div class="map-rit-history-scroll"><table><thead><tr><th scope="col">Test window</th>'+
 MAP_RIT_SUBJECTS.map(s=>'<th scope="col">'+esc(mapRitDisplaySubject(s))+'</th>').join('')+
 '</tr></thead><tbody>'+MAP_RIT_WINDOWS.slice().reverse().map(w=>
  '<tr><th scope="row">'+esc(w.label)+'</th>'+MAP_RIT_SUBJECTS.map(s=>{
   const match=mapRitHistory(records,s).find(row=>row.key===w.key);
   return '<td>'+historyScore(match?.record||null,mapRitChange(records,s,w.key).delta)+'</td>';
  }).join('')+'</tr>'
 ).join('')+'</tbody></table></div>'+
 '<p class="map-rit-history-note">The signed change is the difference from the most recent earlier valid assessment in that subject; the previous test may be outside these four displayed windows. This is observed RIT-point change, not projected growth or growth percentile. Colours use synthetic achievement percentiles, not fixed RIT-score thresholds. Missing tests and missing comparisons remain unavailable. No actual student records or official NWEA norm calculations are used.</p>'+
 '</details></section>';
}
/** Fixed-position tooltip escapes the horizontally scrolling Faculty roster. */
export function installMapRitHeaderTooltips(root){
 if(!root||typeof document==='undefined'||typeof document.createElement!=='function'||typeof document.body?.appendChild!=='function')return;
 // Create the floating panel only on first real header hover/focus.
 // This also keeps non-browser app consumers and test harnesses unaffected.
 let popup=null;
 let active=null;
 const ensurePopup=()=>{
  if(popup)return popup;
  popup=document.createElement('div');
  popup.id='map-rit-floating-tooltip';
  popup.className='map-rit-floating-tooltip';
  popup.hidden=true;
  document.body.appendChild(popup);
  return popup;
 };
 const hide=()=>{
  if(active)active.querySelector('[data-ux-sort]')?.removeAttribute('aria-describedby');
  active=null;if(popup)popup.hidden=true;
 };
 const show=th=>{
  if(!th||th===active)return;
  hide();
  active=th;
  ensurePopup();
  popup.innerHTML=renderMapRitTooltip(th.dataset.mapRitSubject||'Reading');
  popup.hidden=false;
  const rect=th.getBoundingClientRect(),box=popup.getBoundingClientRect();
  const maxLeft=Math.max(12,window.innerWidth-box.width-12);
  popup.style.left=Math.max(12,Math.min(maxLeft,rect.left+rect.width/2-box.width/2))+'px';
  const below=rect.bottom+10;
  popup.style.top=(below+box.height+12<window.innerHeight?below:Math.max(12,rect.top-box.height-10))+'px';
  th.querySelector('[data-ux-sort]')?.setAttribute('aria-describedby',popup.id);
 };
 root.addEventListener('mouseover',e=>{
  const th=e.target.closest?.('th[data-map-rit-subject]');
  if(th)show(th);
 });
 root.addEventListener('mouseout',e=>{
  if(active&&!active.contains(e.relatedTarget))hide();
 });
 root.addEventListener('focusin',e=>{
  const th=e.target.closest?.('th[data-map-rit-subject]');
  if(th)show(th);
 });
 root.addEventListener('focusout',e=>{
  if(active&&!active.contains(e.relatedTarget))hide();
 });
 root.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
 document.addEventListener?.('scroll',hide,{capture:true,passive:true});
 window.addEventListener('resize',hide);
}