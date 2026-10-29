/** Board-only IB Diploma outcomes; distinct from MAP grades and growth. */
import {DP_RECORDS,DP_GRADE12_PATHWAYS,DP_METRICS,DP_METHODS,dpMetricSeries,dpPoint,dpParticipation,dpPassCount} from './board-dp-data.mjs?v=20261028exam1';
import {renderDiplomaSubjectSection} from './board-dp-subjects.mjs';
const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const metricMeta=id=>DP_METRICS.find(m=>m.id===id)||DP_METRICS[0];
const valueText=(v,metric)=>v===null||v===undefined?'—':metric==='passRate'?v+'%':
 (Math.round(v*10)===v*10?v.toFixed(1):v.toFixed(2));
const points=v=>Number.isFinite(v)?valueText(v,'average'):'—';
const percentage=v=>Number.isFinite(v)?(Math.round(v*10)/10).toString()+'%':'—';
const delta=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?(a-b>=0?'+':'')+valueText(a-b,'average'):'—';
const count=(v)=>Number.isFinite(v)?String(v):'—';
const mini=(label,value,note)=>'<span class="board-dp-evidence-item"><span>'+safe(label)+'</span><strong>'+safe(value)+'</strong><small>'+safe(note)+'</small></span>';
function dpRangeHighlight(metric){
 const values=DP_RECORDS.map(r=>r[metric]).filter(Number.isFinite);
 if(!values.length)return '';
 const low=Math.min(...values),high=Math.max(...values),n=values.length;
 const v=metric==='average'?low.toFixed(1)+'–'+high.toFixed(1)+' <small>/ 45</small>':
  low.toFixed(0)+'–'+high.toFixed(0)+'<small>%</small>';
 const label=metric==='average'?'Annual Diploma score range':'Reported pass-rate range';
 return '<div class="board-chart-range-annotation" role="note">'+
 '<span class="board-chart-range-icon" aria-hidden="true">↗</span>'+
 '<div><span class="board-chart-range-title">'+label+'</span>'+
 '<strong>'+v+'</strong>'+
 '<small>Across '+n+' recorded graduating years · cohorts differ</small></div></div>';
}

export function renderDPPointDetails(key){
 const match=/^(average|passRate):(\d{4})$/.exec(String(key||''));
 const item=match?dpPoint(match[2],match[1]):null;
 if(!item)return '<p>Select a year to see the school outcome.</p>';
 const {row,metric,value,label,worldValue}=item;
 return '<div class="board-dp-point-title"><div><span class="eyebrow">IB DIPLOMA · '+safe(row.year)+'</span>'+
 '<h3>'+safe(label)+'</h3></div><strong>'+valueText(value,metric)+(metric==='average'?'<small> / 45</small>':'')+'</strong></div>'+
 (Number.isFinite(worldValue)?'<p class="board-dp-global-point">Global IB · '+valueText(worldValue,metric)+
  (metric==='average'?' / 45':'')+' · AISG '+(metric==='average'?delta(value,worldValue):
  percentage(value-worldValue)+' pts')+' versus global</p>':
  '<p>Global comparison not supplied for this measure and year.</p>')+
 (row.candidates?'<p>'+row.passes+' Diploma awards from '+row.candidates+' full Diploma candidates.</p>':'')+

 (row.covid?'<p class="board-dp-caveat">'+safe(row.covid)+'</p>':'')+
 '<p class="board-dp-point-footnote">Annual graduating cohorts differ; participation and qualification measures are not interchangeable.</p>';
}
function dpLineChart(metric,{range='all',selectedYear=null,compareWorld=false}={}){
 const meta=metricMeta(metric),all=dpMetricSeries(metric);
 const items=range==='recent'?all.slice(-3):all;
 const width=920,height=330,left=58,right=28,top=75,bottom=257,max=meta.max;
 const xp=i=>left+(width-left-right)*(i/Math.max(1,items.length-1));
 const yp=n=>bottom-(n/max)*(bottom-top);
 const pathFor=(field,color,dashed=false)=>{
  const segments=[];let current=[];
  items.forEach((r,i)=>{
   if(!Number.isFinite(r[field])){if(current.length){segments.push(current);current=[]}}
   else current.push([xp(i),yp(r[field])]);
  });if(current.length)segments.push(current);
  return segments.map(segment=>'<path d="'+segment.map(([a,b],i)=>(i?'L':'M')+a.toFixed(1)+' '+b.toFixed(1)).join(' ')+
   '" fill="none" stroke="'+color+'" stroke-width="'+(dashed?'2.6':'3.3')+'" stroke-linecap="round" stroke-linejoin="round"'+
   (dashed?' stroke-dasharray="7 7"':'')+'/>').join('');
 };
 const lines=pathFor('value','#176397')+(compareWorld?pathFor('worldValue','#13847c',true):'');
 const worldPoints=compareWorld?items.map((r,i)=>Number.isFinite(r.worldValue)?
  '<circle class="board-dp-world-point" cx="'+xp(i)+'" cy="'+yp(r.worldValue)+'" r="4.6" fill="#13847c" stroke="#fff" stroke-width="1.4"/>' : '').join(''):'';
 const ticks=[0,.25,.5,.75,1].map(frac=>{
  const val=Math.round(max*frac),y=yp(val);
  return '<line class="board-trend-grid" x1="'+left+'" y1="'+y+'" x2="'+(width-right)+'" y2="'+y+'"/>'+
   '<text class="board-trend-tick" x="'+(left-13)+'" y="'+(y+4)+'" text-anchor="end">'+(metric==='passRate'?val+'%':val)+'</text>';
 }).join('');
 const marks=items.map((r,i)=>{
  const xx=xp(i),selected=Number(selectedYear)===r.end;
  const title='<text class="board-trend-year" text-anchor="middle" x="'+xx.toFixed(1)+'" y="294">'+r.year+'</text>';
  if(!Number.isFinite(r.value))return title;
  const yy=yp(r.value);
  return '<g class="board-dp-point'+(selected?' is-selected':'')+'" data-board-dp-point="'+metric+':'+r.end+'" tabindex="0" role="button"'+
   ' aria-label="'+safe(r.year+', AISG '+meta.label+': '+valueText(r.value,metric)+(r.provisional?', as previously reported':'')+'. Select to see the year.')+'">'+
   '<circle class="board-dp-point-hit" cx="'+xx+'" cy="'+yy+'" r="17" fill="transparent"/>'+
   (selected?'<circle class="board-dp-selected-ring" cx="'+xx+'" cy="'+yy+'" r="12.8" fill="none" stroke="#72a8c4" stroke-width="4" opacity=".55"/>':'')+
   '<circle class="board-dp-point-mark" cx="'+xx+'" cy="'+yy+'" r="6.3" fill="'+'#176397'+'" stroke="#fff" stroke-width="2"/>'+
   '<text x="'+xx+'" y="'+(yy-19)+'" text-anchor="middle" class="board-trend-value" fill="#176397">'+valueText(r.value,metric)+'</text></g>'+title;
 }).join('');
 return '<svg class="board-dp-svg" viewBox="0 0 '+width+' '+height+'" role="group" aria-label="'+safe(meta.label)+
  ' by AISG graduating year'+(compareWorld?', with global IB reference':'')+'. Full chart scale." xmlns="http://www.w3.org/2000/svg">'+
  '<text class="board-trend-axislabel" x="'+left+'" y="22">'+safe(meta.label)+(metric==='average'?' · out of 45':' · percentage')+'</text>'+
  ticks+lines+worldPoints+marks+'</svg>';
}
function dpOutcomesTable(){
 return '<details class="board-details board-dp-table"><summary>Detailed results by graduating year <span>+</span></summary>'+
 '<p>School results and selected global references are listed separately. Dashes indicate missing—not zero—values. Exam candidates and Grade 12 pathways have different denominators.</p>'+
 '<div class="tablewrap"><table class="board-table board-dp-detail-table"><thead><tr>'+
 '<th>Class</th><th>AISG average /45</th><th>World average</th><th>AISG minus world</th>'+
 '<th>Diploma pass</th><th>World pass</th><th>Candidates / cohort</th><th>Diplomas awarded</th>'+
 '<th>35+ points</th><th>Bilingual</th><th>Mean subject grade</th><th>Mean core</th><th>Highest /45</th><th>Source context</th></tr></thead><tbody>'+
 DP_RECORDS.map(r=>'<tr><td>'+r.end+'</td><td>'+points(r.average)+'</td>'+
 '<td>'+points(r.worldAverage)+'</td><td>'+delta(r.average,r.worldAverage)+'</td>'+
 '<td>'+percentage(r.passRate)+'</td><td>'+percentage(r.worldPassRate)+'</td>'+
 '<td>'+(r.candidates?(r.candidates+(Number.isFinite(r.cohort)?' / '+r.cohort:'')):'—')+'</td>'+
 '<td>'+count(r.passes)+'</td>'+
 '<td>'+(r.highCount?r.highCount+' / '+r.highDenominator:'—')+'</td>'+
 '<td>'+(r.bilingualCount?r.bilingualCount+(r.bilingualDenominator?' / '+r.bilingualDenominator:''):'—')+'</td>'+
 '<td>'+points(r.meanGrade)+'</td><td>'+points(r.corePoints)+'</td>'+
 '<td>'+count(r.highScore)+'</td><td>'+(r.covid?'School summary · COVID adjustments':'IB school report')+'</td></tr>').join('')+
 '</tbody></table></div>'+
 '<p class="board-dp-caveat">'+safe(DP_METHODS.discrepancy2024)+'</p>'+
 '<p class="board-dp-caveat">'+safe(DP_METHODS.discrepancy2023)+'</p>'+
 '</details>';
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
 const comparison=state.boardDpGlobal!==false;
 const verified=DP_RECORDS.filter(r=>Number.isFinite(r.average));
 const meets34=verified.filter(r=>r.average>=34).length;
 const detailNote='Different graduating cohorts each year; these are not matched student growth scores.';
 const worldAvg=selected.worldAverage;
 const worldPass=selected.worldPassRate;
 const international='<div class="board-dp-world-strip" aria-label="International Diploma comparisons">'+
  mini('World IB average',points(worldAvg)+' /45',
   Number.isFinite(worldAvg)?'AISG '+delta(selected.average,worldAvg)+' points vs world':'No comparable global average')+
  mini('World Diploma pass rate',percentage(worldPass),
   Number.isFinite(worldPass)?'AISG '+percentage(selected.passRate-worldPass).replace('%',' percentage points')+' vs world':'Global pass-rate result unavailable for this year')+
  mini('Full Diploma candidates',selected.candidates?
    selected.candidates+(Number.isFinite(selected.cohort)?' / '+selected.cohort:''):'—',
    selected.candidates?(Number.isFinite(selected.cohort)?dpParticipation(selected)+'% of graduating class':'Graduating-class size unavailable'):
     'Examination candidate count unavailable')+
  '</div>';
 const achievements='<details class="board-details board-dp-achievement"><summary>More about this cohort <span>+</span></summary>'+
  '<div class="board-dp-extra-grid">'+
  mini('35+ Diploma points',selected.highCount?
   selected.highCount+' / '+selected.highDenominator:'—',selected.highCount?'Denominator as recorded':'Not available')+
  mini('Bilingual Diplomas',selected.bilingualCount?
   String(selected.bilingualCount):'—',selected.bilingualCount?'Count from school summary':'Not available')+
  mini('Highest Diploma score',count(selected.highScore), 'Out of 45')+
  mini('Mean subject grade',points(selected.meanGrade),'Diploma recipients where supplied')+
  mini('Mean core points',points(selected.corePoints),'Theory of Knowledge and Extended Essay')+
  '</div></details>';
 return '<section class="board-dp board-dp-simplified">'+
 '<div class="board-dp-intro"><div><span class="eyebrow">GRADUATION OUTCOMES · IB DIPLOMA PROGRAMME</span>'+
 '<h2>IB Diploma Results</h2><p>School outcomes alongside the global IB reference, with cohort context.</p></div>'+
 '<label class="board-dp-year-simple">Graduating class <select data-board-dp-select="year" aria-label="Diploma school year">'+
 [...DP_RECORDS].reverse().map(r=>option(r.end,String(r.end),end)).join('')+'</select></label></div>'+
 '<section class="board-dp-comparison-panel"><div class="board-dp-panel-heading"><div>'+
 '<span class="eyebrow">DIPLOMA OUTCOMES · CLASS OF '+end+'</span>'+
 '<h3>Diploma at a Glance</h3><p>Each number describes the selected graduating cohort.</p></div>'+
 '</div>'+
 '<div class="board-dp-graphic-grid">'+
 outcomeTile('average','AISG average Diploma score',valueText(selected.average,'average'),'/45',
   'Class of '+end)+
 outcomeTile('pass','AISG Diploma pass rate',valueText(selected.passRate,'passRate'),'',
   (dpPassCount(selected)?dpPassCount(selected)+' candidates':'School reported rate'))+
 outcomeTile('consistency','Consistent outcomes',meets34+' / '+verified.length,'years',
   'Recorded school-summary years averaging at least 34 / 45')+'</div>'+
 international+
 '<p class="board-dp-graphic-footnote">'+
 'AISG Class of '+end+' Diploma outcomes are drawn from the school examination statistics summary. '+
 'Global values: school summary (2023–2025); IB published May 2026 world mean.</p></section>'+
 renderDiplomaSubjectSection(state)+
 '<section class="board-panel board-dp-panel"><div class="board-dp-chart-top"><div>'+
 '<span class="eyebrow">HISTORICAL OUTCOMES</span>'+
 '<h3>'+(metric==='average'?'Diploma Average Points':'Diploma Pass Rate')+' Over Time</h3>'+
 '<p>Nine graduating years · '+safe(detailNote)+'</p></div>'+
 '<div class="board-segmented" role="group" aria-label="Select Diploma history measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(metric==='average')+
 '" class="'+(metric==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(metric==='passRate')+
 '" class="'+(metric==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 '<div class="board-dp-trend-controls"><span class="board-dp-legend"><i class="board-dp-key-aisg"></i>AISG'+
 (comparison?'<i class="board-dp-key-world"></i>World IB':'')+'</span>'+
 '<button type="button" class="board-dp-global-toggle" data-board-dp-global aria-pressed="'+comparison+'">'+
 (comparison?'Show AISG only':'Compare with world')+'</button></div>'+
 dpRangeHighlight(metric)+
 '<p class="board-dp-swipe">Select a year on the chart to inspect its school outcome and available global comparison.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Explore Diploma outcomes by school year">'+
 dpLineChart(metric,{selectedYear:end,compareWorld:comparison})+'</div>'+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p>Hover or select a year to inspect its outcome.</p></div>'+
 '<p class="board-chart-caption">Full 0–45 point or 0–100% scale. Dashed world line begins only when a global reference is available. The 2020–22 years had COVID-related assessment adjustments.</p></section>'+
 achievements+
 dpPathways()+
 dpOutcomesTable()+
 '<details class="board-details board-dp-method"><summary>Understanding Diploma results <span>+</span></summary>'+
 '<p>'+safe(DP_METHODS.quality)+'</p><p>'+safe(DP_METHODS.limits)+'</p>'+
 '<p>'+safe(DP_METHODS.comparison)+'</p><p>'+safe(DP_METHODS.covid)+'</p>'+
 '<p>'+safe(DP_METHODS.discrepancy)+'</p><p>'+safe(DP_METHODS.pathways)+'</p>'+
 '<p>'+safe(DP_METHODS.boundary)+'</p>'+
 '<p>IB published May 2026 world average: <a href="https://ibo.org/news/news-list/more-than-209000-ib-students-worldwide-receive-their-dp-and-cp-results/" target="_blank" rel="noopener noreferrer">IB official results announcement</a>.</p>'+
 '</details></section>';
}

/** One concise historical visual shared with the Board's Overview. */
export function renderDPOverviewTrend(state){
 const selected=state.boardDpMetric==='passRate'?'passRate':'average';
 return '<div class="board-dp-overview-trend">'+
 '<div class="board-dp-chart-top"><div><span class="eyebrow">GRADUATION OUTCOMES · IB DIPLOMA</span>'+
 '<h2>Diploma Outcomes Over Time</h2>'+
 '<p>Nine graduating years · '+(selected==='average'?'Average Diploma points out of 45':'Diploma pass rate as a percentage')+'</p></div>'+
 '<div class="board-segmented" role="group" aria-label="IB Diploma historical measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(selected==='average')+'" class="'+(selected==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(selected==='passRate')+'" class="'+(selected==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 dpRangeHighlight(selected)+
 '<p class="board-dp-swipe">Swipe for earlier graduation years. Tap a point for its value.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Scroll to inspect Diploma outcomes">'+dpLineChart(selected,{compareWorld:true})+'</div>'+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p>Select a year to understand its reported outcome.</p></div>'+
 '<div class="board-overview-chartfoot"><span>Diploma results follow AISG school statistics through May 2026. Different graduating cohorts must not be treated as MAP student growth.</span>'+
 '<button type="button" data-board-view="dp" class="board-inline-link">Explore IB Diploma details ›</button></div>'+
 '</div>';
}
