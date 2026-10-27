/** Board-only IB Diploma outcomes; distinct from MAP grades and growth. */
import {DP_RECORDS,DP_GRADE12_PATHWAYS,DP_METRICS,DP_METHODS,dpMetricSeries,dpPoint} from './board-dp-data.mjs';
const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const metricMeta=id=>DP_METRICS.find(m=>m.id===id)||DP_METRICS[0];
const valueText=(v,metric)=>v===null?'—':metric==='passRate'?v+'%':v.toFixed(1);
export function renderDPPointDetails(key){
 const match=/^(average|passRate):(\d{4})$/.exec(String(key||''));
 const item=match?dpPoint(match[2],match[1]):null;
 if(!item)return '<p>Select a year to see the reported outcome.</p>';
 const {row,metric,value,label}=item;
 const format=valueText(value,metric);
 return '<div class="board-dp-point-title"><div><span class="eyebrow">REPORTED IB DIPLOMA OUTCOME</span>'+
 '<h3>'+safe(row.year)+' · '+safe(label)+'</h3></div><strong>'+format+(metric==='average'?'<small> / 45</small>':'')+'</strong></div>'+
 '<p>Reported school outcome for '+safe(row.year)+'.</p>'+
 (row.verify?'<p class="board-dp-caveat">Latest reported result · confirmation against final IB examination outcomes is pending.</p>':'')+
 '<p class="board-dp-point-footnote">'+(metric==='passRate'?
 'Diploma pass rate is based on Diploma awards; a consistent examination-candidate denominator is not available.':
 'Average Diploma points are school-reported final results. Different graduating cohorts contribute each year.')+'</p>';
}
function dpLineChart(metric){
 const meta=metricMeta(metric),items=dpMetricSeries(metric);
 const width=860,height=285,left=56,right=24,top=26,bottom=224,max=meta.max;
 const xp=i=>left+(width-left-right)*(i/(items.length-1));
 const yp=n=>bottom-(n/max)*(bottom-top);
 const lineSegments=[];let current=[];
 items.forEach((r,i)=>{if(r.value===null){if(current.length){lineSegments.push(current);current=[]}}else current.push([xp(i),yp(r.value)])});
 if(current.length)lineSegments.push(current);
 const paths=lineSegments.map(segment=>'<path class="board-dp-chart-line" d="'+segment.map(([x,y],i)=>
 (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ')+'" fill="none" stroke="#176397" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>').join('');
 const ticks=[0,.25,.5,.75,1].map(r=>{
  const value=Math.round(max*r),y=yp(value);
  return '<line class="board-trend-grid" x1="'+left+'" y1="'+y+'" x2="'+(width-right)+'" y2="'+y+'"/>'+
   '<text class="board-trend-tick" x="'+(left-13)+'" y="'+(y+4)+'" text-anchor="end">'+
   (metric==='passRate'?value+'%':value)+'</text>';
 }).join('');
 const points=items.map((r,i)=>{
  const x=xp(i),label='<text class="board-trend-year" text-anchor="middle" x="'+x.toFixed(1)+'" y="255">'+r.year+'</text>';
  if(r.value===null)return label;
  const y=yp(r.value);
  return '<g class="board-dp-point" data-board-dp-point="'+metric+':'+r.end+'" tabindex="0" role="button"'+
   ' aria-label="'+safe(r.year+', '+meta.label+': '+valueText(r.value,metric)+(metric==='average'?' of 45 points':'')+'. Select for an explanation.')+'">'+
   '<circle class="board-dp-point-hit" cx="'+x+'" cy="'+y+'" r="18" fill="transparent"/>'+
   '<circle class="board-dp-point-mark" cx="'+x+'" cy="'+y+'" r="6.7" fill="#176397" stroke="#fff" stroke-width="2"/>'+
   '<text x="'+x+'" y="'+(y-17)+'" text-anchor="middle" class="board-trend-value" fill="#176397">'+valueText(r.value,metric)+'</text></g>'+label;
 }).join('');
 return '<svg class="board-dp-svg" viewBox="0 0 '+width+' '+height+'" role="group" aria-label="'+safe(meta.label)+
 ' by AISG school year. Point values are visible and interactive." xmlns="http://www.w3.org/2000/svg">'+
 '<text class="board-trend-axislabel" x="'+left+'" y="15">'+safe(meta.label)+(metric==='average'?' · out of 45':' · percentage')+'</text>'+
 ticks+paths+points+'</svg>';
}
function dpOutcomesTable(){
 return '<details class="board-details board-dp-table"><summary>View all recorded Diploma outcomes <span>+</span></summary>'+
 '<div class="tablewrap"><table class="board-table"><thead><tr><th>School year</th><th>Average Diploma points / 45</th><th>Diploma pass rate</th><th>Verification</th></tr></thead><tbody>'+
 DP_RECORDS.map(r=>'<tr><td>'+safe(r.year)+'</td><td>'+valueText(r.average,'average')+'</td>'+
 '<td>'+valueText(r.passRate,'passRate')+'</td><td>'+(r.verify?'Confirmation pending':'Recorded')+'</td></tr>').join('')+
 '</tbody></table></div></details>';
}
function dpPathways(){
 return '<details class="board-details board-dp-pathways"><summary>Explore Grade 12 Diploma pathways <span>+</span></summary>'+
 '<p>Pathway participation is separate from Diploma examinations. These counts describe Grade 12 enrollment in different pathways, not examination candidature.</p>'+
 '<div class="tablewrap"><table class="board-table"><thead><tr><th>School year</th><th>Full Diploma pathway</th><th>DP courses pathway</th><th>AISG pathway</th></tr></thead><tbody>'+
 DP_GRADE12_PATHWAYS.map(r=>'<tr><td>'+safe(r.year)+'</td><td>'+r.full+'</td><td>'+r.courses+'</td><td>'+r.aisg+'</td></tr>').join('')+
 '</tbody></table></div><p class="board-dp-caveat">'+safe(DP_METHODS.discrepancy)+'</p></details>';
}
export function renderBoardDP(state){
 const selected=state.boardDpMetric==='passRate'?'passRate':'average';
 const latest=DP_RECORDS.at(-1);
 const formattedMetric=selected==='passRate'?'Pass rate':'Average score';
 return '<section class="board-dp"><div class="board-dp-intro"><div>'+
 '<span class="eyebrow">GRADUATION OUTCOMES · IB DIPLOMA PROGRAMME</span>'+
 '<h2>IB Diploma outcomes over time</h2>'+
 '<p>Reported Diploma results across graduating cohorts, separate from Grades 3–10 MAP achievement.</p></div>'+
 '<span class="board-dp-origin">Historical school-reported outcomes · through 2025–26</span></div>'+
 '<div class="board-dp-tiles">'+
 '<div class="board-dp-tile"><span>Latest reported average · '+safe(latest.year)+'</span><strong>'+valueText(latest.average,'average')+' <small>/ 45</small></strong><small>Reported Diploma points · final confirmation pending</small></div>'+
 '<div class="board-dp-tile"><span>Latest reported pass rate · '+safe(latest.year)+'</span><strong>'+valueText(latest.passRate,'passRate')+'</strong><small>Candidate denominator not supplied</small></div>'+
 '<div class="board-dp-tile"><span>Grade 12 full DP pathway · '+safe(latest.year)+'</span><strong>56 <small>learners</small></strong><small>Pathway enrolment, not exam candidature</small></div></div>'+
 '<div class="board-dp-alert"><strong>About these figures:</strong> '+safe(DP_METHODS.current)+' Candidate counts are not reliably available, so pass counts are not inferred.</div>'+
 '<section class="board-panel board-dp-panel"><div class="board-dp-chart-top"><div><span class="eyebrow">REPORTED YEARLY OUTCOMES</span>'+
 '<h3>'+formattedMetric+' by school year</h3><p>Hover, tap or keyboard-focus a year for the reported outcome and explanation.</p></div>'+
 '<div class="board-segmented" role="group" aria-label="IB Diploma measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(selected==='average')+'" class="'+(selected==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(selected==='passRate')+'" class="'+(selected==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 '<p class="board-dp-swipe">Most recent years shown first on phones · swipe to see earlier cohorts.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Scroll to inspect annual Diploma outcomes">'+dpLineChart(selected)+'</div>'+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p><strong>Select a year</strong> to understand its reported result.</p></div>'+
 '<p class="board-chart-caption">Scores are on the 0–45 Diploma point scale; pass rates are on the 0–100% scale. The chart deliberately uses the full scale rather than exaggerating small year-on-year variations. No world average is inferred.</p></section>'+
 dpOutcomesTable()+dpPathways()+
 '<details class="board-details board-dp-method"><summary>Data definitions and limitations <span>+</span></summary>'+
 '<p>'+safe(DP_METHODS.quality)+'</p><p>'+safe(DP_METHODS.limits)+'</p>'+
 '<p>'+safe(DP_METHODS.discrepancy)+'</p><p>'+safe(DP_METHODS.pathways)+'</p>'+
 '<p>'+safe(DP_METHODS.boundary)+'</p></details></section>';
}


/** One concise historical visual shared with the Board's Overview. */
export function renderDPOverviewTrend(state){
 const selected=state.boardDpMetric==='passRate'?'passRate':'average';
 return '<div class="board-dp-overview-trend">'+
 '<div class="board-dp-chart-top"><div><span class="eyebrow">GRADUATION OUTCOMES · IB DIPLOMA</span>'+
 '<h2>Diploma outcomes over time</h2>'+
 '<p>Seven graduating years · '+(selected==='average'?'Average Diploma points out of 45':'Diploma pass rate as a percentage')+'</p></div>'+
 '<div class="board-segmented" role="group" aria-label="IB Diploma historical measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(selected==='average')+'" class="'+(selected==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(selected==='passRate')+'" class="'+(selected==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 '<p class="board-dp-swipe">Swipe for earlier graduation years. Tap a point for its value.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Scroll to inspect Diploma outcomes">'+dpLineChart(selected)+'</div>'+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p>Select a year to understand its reported outcome.</p></div>'+
 '<div class="board-overview-chartfoot"><span>2025–26 results await final confirmation. Graduating cohorts are distinct from MAP grade cohorts.</span>'+
 '<button type="button" data-board-view="dp" class="board-inline-link">Explore IB Diploma details ›</button></div>'+
 '</div>';
}
