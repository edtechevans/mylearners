/** Growth-first presentation for fictional MAP records.
 * The change in RIT points is the growth measure. Latest RIT and percentiles
 * remain accessible below as context, never the primary headline.
 */
import {MAP_SUBJECTS,latestMapGrowth,mapGrowthSeries,subjectMapRecords,growthFormat} from './map-growth.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const signed=n=>n===null||n===undefined?'N/A':growthFormat(n);
const dateShort=s=>s.replace('Fall ','F').replace('Spring ','S');
function context(g){
 if(g.delta===null)return 'Projection unavailable';
 if(g.delta>0)return signed(g.delta)+' points above projection';
 if(g.delta<0)return Math.abs(g.delta)+' points below projection';
 return 'Matched projected growth';
}
export function renderGrowthCell(records){
 const g=latestMapGrowth(records,'Mathematics');
 if(g.status==='not-assessed')return '<span class="chip neutral">Not assessed</span>';
 if(g.status==='missing-current')return '<span class="chip neutral">No Fall result</span>';
 if(g.status==='no-comparison')return '<span class="chip neutral">No prior MAP test</span>';
 return '<span class="growth-roster">'+
   '<span class="chip '+(g.met?'good':'blue')+'">'+esc(signed(g.actual))+' pts</span>'+
   '<small class="roster-growth-note">'+(g.projected===null?'Projection unavailable':'vs '+esc(signed(g.projected))+' projected')+'</small>'+
   '</span>';
}
function growthComparison(records){
 const all=records.slice(-4);
 if(!all.length)return '<div class="empty"><strong>No comparable MAP testing windows</strong><p>Growth needs two valid tests for the same subject.</p></div>';
 const scale=Math.max(8,...all.map(p=>Math.max(Math.abs(p.actual),p.projected||0)));
 return '<div class="growth-legend"><span><i class="growth-dot actual"></i>Observed growth</span><span><i class="growth-dot projected"></i>Illustrative projection</span></div>'+
 '<div class="growth-period-list" role="list">'+all.map(p=>{
  const observedWidth=Math.max(0,p.actual)/scale*100;
  const projectedWidth=Math.max(0,p.projected||0)/scale*100;
  return '<div class="growth-period" role="listitem" aria-label="'+esc(p.from+' to '+p.to+': observed growth '+p.actual+', projected growth '+(p.projected??'not available'))+'">'+
    '<div class="growth-period-name">'+esc(dateShort(p.from))+' → '+esc(dateShort(p.to))+'</div>'+
    '<div class="growth-period-bars"><div class="growth-track"><span class="growth-fill actual" style="width:'+observedWidth.toFixed(2)+'%"></span></div>'+
    '<div class="growth-track"><span class="growth-fill projected" style="width:'+projectedWidth.toFixed(2)+'%"></span></div></div>'+
    '<div class="growth-period-values"><strong>'+esc(signed(p.actual))+'</strong><span>'+(p.projected===null?'N/A':esc(signed(p.projected)))+'</span></div>'+
   '</div>';
 }).join('')+'</div>'+
 '<p class="note">All values are fictional RIT-point changes between valid testing windows. Negative observed growth is shown numerically; the bars depict positive change only.</p>';
}
export function renderGrowthProfile(records,subject,ritChart){
 const all=records||[];
 if(!all.length)return '<section class="card panel"><h3 class="section-title">MAP Growth</h3><div class="empty"><strong>MAP not assessed</strong><p>No simulated MAP results are provided for this learner at this grade level.</p></div></section>';
 const ordered=subjectMapRecords(all,subject);
 const latest=ordered.at(-1);
 const current=latestMapGrowth(all,subject);
 const periods=mapGrowthSeries(all,subject);
 const lastPeriod=periods.at(-1);
 const comparison=current.status==='comparable'?current:lastPeriod;
 const latestLabel=comparison&&'from' in comparison?comparison.from+' → '+comparison.to:current.previous?current.previous.window+' → '+current.current.window:'No comparable window';
 const activeLabel=current.status==='missing-current'?
  '<div class="growth-notice">Fall 2026 is unavailable. Any growth below is from the latest earlier comparable window, not the current testing window.</div>':'';
 const options='<div class="subject-switch" role="group" aria-label="MAP subject">'+
  MAP_SUBJECTS.map(s=>'<button type="button" class="'+(s===subject?'active':'')+'" data-subject="'+esc(s)+'" aria-pressed="'+(s===subject)+'">'+esc(s)+'</button>').join('')+'</div>';
 const observed=comparison?.actual??null;
 const projected=comparison?.projected??null;
 const delta=comparison?.delta??null;
 const growthHeadline=observed===null?'No growth comparison':signed(observed)+' <small>RIT points</small>';
 const statusText=observed===null?'A previous comparable assessment is needed to calculate growth.':
  context({delta});
 const projectionHtml=projected===null?'Not available':signed(projected);
 const varianceHtml=delta===null?'Not available':signed(delta);
 const newest=latest;
 const outcome= '<div class="growth-summary">'+
  '<div class="growth-main"><span class="growth-eyebrow">Observed MAP growth</span><div class="growth-amount">'+growthHeadline+'</div><p>'+esc(latestLabel)+'</p></div>'+
  '<div class="growth-secondary"><span>Illustrative projected growth</span><strong>'+esc(projectionHtml)+'</strong><small>RIT points · same testing interval</small></div>'+
  '<div class="growth-secondary"><span>Difference from projection</span><strong>'+esc(varianceHtml)+'</strong><small>RIT points · observed minus projected</small></div></div>'+
  '<p class="growth-takeaway">'+esc(statusText)+'</p>';
 const ritContext=latest?'<details class="rit-details"><summary>Explore underlying RIT achievement and score history <span>Supporting evidence</span></summary>'+
  '<div class="map-metrics"><div class="tile"><small>Latest available RIT</small><strong>'+esc(latest.rit)+'</strong></div>'+
  '<div class="tile"><small>Achievement percentile (simulated)</small><strong>'+esc(latest.percentile)+'</strong></div>'+
  '<div class="tile"><small>Test window</small><strong class="rit-window">'+esc(latest.window)+'</strong></div></div>'+
  ritChart(ordered)+'</details>':'';
 return '<section class="card panel map-growth-page">'+
  '<div class="panel-head"><div><h3 class="section-title">MAP Growth — Progress Over Time</h3><p class="section-small">Start with growth. Explore achievement and RIT history when useful.</p></div><span class="demo-badge">SIMULATED MAP</span></div>'+
  '<p class="growth-intro">How much has this learner grown since the previous comparable MAP assessment, and how does that compare with the illustrative projection?</p>'+
  options+activeLabel+
  (ordered.length?outcome+'<div class="growth-history"><h4>Growth across testing windows</h4><p class="section-small">Observed versus projected changes, with each interval clearly labelled.</p>'+growthComparison(periods)+'</div>'+ritContext:
   '<div class="empty"><strong>No '+esc(subject)+' results</strong><p>This subject has no simulated assessment records.</p></div>')+
  '<div class="help-box"><strong>Growth first, interpretation second</strong><p>MAP growth is the change in RIT points between comparable tests. A growth projection is a point of reference, not a judgement about the learner. Classroom evidence and student context remain essential.</p></div>'+
  '<p class="note">All achievement percentiles, growth figures and projections are simulated, not official NWEA norms. No genuine student data is included.</p>'+
  '</section>';
}
