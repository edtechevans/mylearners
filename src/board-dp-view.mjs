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
function dpLineChart(metric,{range='all',selectedYear=null}={}){
 const meta=metricMeta(metric),all=dpMetricSeries(metric);
 const items=range==='recent'?all.slice(-3):all;
 const width=860,height=320,left=56,right=24,top=70,bottom=255,max=meta.max;
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
  const x=xp(i),selected=Number(selectedYear)===r.end;
  const label='<text class="board-trend-year" text-anchor="middle" x="'+x.toFixed(1)+'" y="292">'+r.year+'</text>';
  if(r.value===null)return label;
  const y=yp(r.value);
  return '<g class="board-dp-point'+(selected?' is-selected':'')+'" data-board-dp-point="'+metric+':'+r.end+'" tabindex="0" role="button"'+
   ' aria-label="'+safe(r.year+', '+meta.label+': '+valueText(r.value,metric)+(metric==='average'?' of 45 points':'')+'. Select for an explanation.')+'">'+
   '<circle class="board-dp-point-hit" cx="'+x+'" cy="'+y+'" r="18" fill="transparent"/>'+
   (selected?'<circle class="board-dp-selected-ring" cx="'+x+'" cy="'+y+'" r="12.8" fill="none" stroke="#72a8c4" stroke-width="4" opacity=".55"/>':'')+
   '<circle class="board-dp-point-mark" cx="'+x+'" cy="'+y+'" r="6.7" fill="#176397" stroke="#fff" stroke-width="2"/>'+
   '<text x="'+x+'" y="'+(y-17)+'" text-anchor="middle" class="board-trend-value" fill="#176397">'+valueText(r.value,metric)+'</text></g>'+label;
 }).join('');
 return '<svg class="board-dp-svg" viewBox="0 0 '+width+' '+height+'" role="group" aria-label="'+safe(meta.label)+
 ' by AISG school year. Point values are visible and interactive." xmlns="http://www.w3.org/2000/svg">'+
 '<text class="board-trend-axislabel" x="'+left+'" y="22">'+safe(meta.label)+(metric==='average'?' · out of 45':' · percentage')+'</text>'+
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
function diplomaIcon(type){
 const content={
  average:'<circle cx="12" cy="8" r="5"/><path d="M8 13 6 21l6-3 6 3-2-8M12 5v6m-3-3h6"/>',
  pass:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 12v5c4 3 8 3 12 0v-5M22 9v7"/>',
  pathways:'<rect x="4" y="12" width="4" height="8" rx=".7"/><rect x="10" y="8" width="4" height="12" rx=".7"/><rect x="16" y="4" width="4" height="16" rx=".7"/>',
  consistency:'<path d="M3 12.5 9 18l12-13"/><circle cx="12" cy="12" r="10"/>'
 };
 return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+content[type]+'</svg>';
}
function outcomeTile(type,label,value,unit,note){
 return '<article class="board-dp-graphic-card board-dp-graphic-'+type+'">'+
  '<span class="board-dp-graphic-icon">'+diplomaIcon(type)+'</span>'+
  '<div class="board-dp-graphic-info">'+
  '<span class="board-dp-graphic-label">'+safe(label)+'</span>'+
  '<strong class="board-dp-graphic-value">'+safe(value)+(unit?'<small>'+safe(unit)+'</small>':'')+'</strong>'+
  '<span class="board-dp-graphic-note">'+safe(note)+'</span>'+
  '</div></article>';
}
const option=(value,label,selected)=>'<option value="'+safe(value)+'"'+
 (String(value)===String(selected)?' selected':'')+'>'+safe(label)+'</option>';
export function renderBoardDP(state){
 const metric=state.boardDpMetric==='passRate'?'passRate':'average';
 const end=DP_RECORDS.some(r=>r.end===Number(state.boardDpYear))?Number(state.boardDpYear):DP_RECORDS.at(-1).end;
 const selected=DP_RECORDS.find(r=>r.end===end);
 const meets34=DP_RECORDS.filter(r=>Number.isFinite(r.average)&&r.average>=34).length;
 const available=DP_RECORDS.filter(r=>Number.isFinite(r.average)).length;
 const confirmation=selected.verify?' · final result confirmation pending':'';
 const detailNote='Different graduating cohorts each year. These figures do not track the same learners.';
 return '<section class="board-dp board-dp-simplified">'+
 '<div class="board-dp-intro"><div><span class="eyebrow">GRADUATION OUTCOMES · IB DIPLOMA PROGRAMME</span>'+
 '<h2>IB Diploma results</h2><p>What are our learners achieving at graduation?</p></div>'+
 '<label class="board-dp-year-simple">School year <select data-board-dp-select="year" aria-label="Diploma school year">'+
 [...DP_RECORDS].reverse().map(r=>option(r.end,r.year,end)).join('')+'</select></label></div>'+
 '<section class="board-dp-comparison-panel"><div class="board-dp-panel-heading"><div>'+
 '<span class="eyebrow">DIPLOMA OUTCOMES · '+safe(selected.year)+'</span>'+
 '<h3>Diploma at a glance</h3><p>Reported outcomes for the selected graduating year.</p></div></div>'+
 '<div class="board-dp-graphic-grid">'+
 outcomeTile('average','Average Diploma score',valueText(selected.average,'average'),'/45',
   'Average points awarded'+confirmation)+
 outcomeTile('pass','Diploma pass rate',valueText(selected.passRate,'passRate'),'',
   selected.passRate===null?'No result available for this year':'Learners awarded the full Diploma'+confirmation)+
 outcomeTile('consistency','Consistent results',meets34+' / '+available,'years',
   'Annual average of at least 34 / 45, since 2019–20')+'</div>'+
 '<p class="board-dp-graphic-footnote">The first two measures reflect '+safe(selected.year)+
 '. The consistency indicator covers all '+available+' reported graduating years. Results for 2025–26 are awaiting final confirmation.</p></section>'+
 '<section class="board-panel board-dp-panel"><div class="board-dp-chart-top"><div>'+
 '<span class="eyebrow">HISTORICAL OUTCOMES</span>'+
 '<h3>'+(metric==='average'?'Average Diploma points':'Diploma pass rate')+' over time</h3>'+
 '<p>Seven graduating years · '+safe(detailNote)+'</p></div>'+
 '<div class="board-segmented" role="group" aria-label="Select Diploma history measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(metric==='average')+
 '" class="'+(metric==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(metric==='passRate')+
 '" class="'+(metric==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 '<p class="board-dp-swipe">Select a year on the chart to see its result above.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Explore Diploma outcomes by school year">'+
 dpLineChart(metric,{range:'all',selectedYear:end})+'</div>'+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p>Hover or select a year to see the result and what it means.</p></div>'+
 '<p class="board-chart-caption">Scores are measured out of 45 points, or as a percentage awarded the full Diploma. The full scale avoids exaggerating small annual differences.</p></section>'+
 dpPathways()+
 dpOutcomesTable()+
 '<details class="board-details board-dp-method"><summary>Understanding Diploma results <span>+</span></summary>'+
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
