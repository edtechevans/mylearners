/** Board-only IB Diploma outcomes; distinct from MAP grades and growth. */
import {DP_RECORDS,DP_GRADE12_PATHWAYS,DP_METRICS,DP_METHODS,dpMetricSeries,dpPoint,dpParticipation,dpPassCount} from './board-dp-data.mjs?v=20261031dp-world1';
import {renderDiplomaSubjectSection} from './board-dp-subjects.mjs';
const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const metricMeta=id=>DP_METRICS.find(m=>m.id===id)||DP_METRICS[0];
const valueText=(v,metric)=>v===null||v===undefined?'—':metric==='passRate'?v+'%':
 (Math.round(v*10)===v*10?v.toFixed(1):v.toFixed(2));
const points=v=>Number.isFinite(v)?valueText(v,'average'):'—';
const percentage=v=>Number.isFinite(v)?(Math.round(v*10)/10).toString()+'%':'—';
const delta=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?(a-b>=0?'+':'')+valueText(a-b,'average'):'—';
const count=(v)=>Number.isFinite(v)?String(v):'—';
const headlinePoints=v=>Number.isFinite(v)?String(Math.round(v)):'—';
const mini=(label,value,note)=>'<span class="board-dp-evidence-item"><span>'+safe(label)+'</span><strong>'+safe(value)+'</strong><small>'+safe(note)+'</small></span>';
function matchedGlobalGaps(){
 const rows=DP_RECORDS.filter(r=>Number.isFinite(r.worldAwardedAverage));
 const above=rows.filter(r=>r.average>r.worldAwardedAverage).length;
 return '<div class="board-dp-matched-gaps" aria-label="AISG versus worldwide Diploma-recipient averages by May session">'+
 '<div class="board-dp-matched-intro"><strong>'+above+' of '+rows.length+' May sessions above the worldwide Diploma-recipient average</strong>'+
 '<small>Difference in published Diploma-recipient mean scores · AISG minus global · points out of 45. Published AISG means are rounded by the IB.</small></div>'+
 '<div class="board-dp-gaps-grid" role="list">'+rows.map(r=>'<span role="listitem" class="board-dp-gap'+
 (r.average>=r.worldAwardedAverage?' is-above':' is-below')+'"><small>'+r.end+'</small><strong>'+
 delta(r.average,r.worldAwardedAverage)+'</strong></span>').join('')+'</div></div>';
}


/** The focused axis improves discriminability without implying a zero baseline.
 * Full-scale view remains a single click away and is supported in deep links. */
const basisName=basis=>basis==='overall'?'all Diploma/retake results':'Diploma recipients only';
function dpWorldBasisControls(metric,basis='recipients'){
 if(metric!=='average')return '';
 return '<div class="board-dp-basis-control" role="group" aria-label="Worldwide Diploma comparison population">'+
 '<span>World series</span>'+
 '<button type="button" data-board-dp-basis="recipients" aria-pressed="'+(basis!=='overall')+
 '" class="'+(basis!=='overall'?'active':'')+'">Diploma recipients</button>'+
 '<button type="button" data-board-dp-basis="overall" aria-pressed="'+(basis==='overall')+
 '" class="'+(basis==='overall'?'active':'')+'">All DP results</button></div>';
}
function dpScaleControls(metric,scale='focus',worldBasis='recipients'){
 if(metric!=='average')return '';
 const mode=scale==='full'?'full':'focus';
 return '<div class="board-dp-scale-control" role="group" aria-label="Diploma average score chart scale">'+
 '<span class="board-dp-scale-label">Chart scale</span>'+
 '<button type="button" data-board-dp-scale="focus" aria-pressed="'+(mode==='focus')+
 '" class="'+(mode==='focus'?'active':'')+'">Focused · '+(worldBasis==='overall'?'20–40':'30–40')+'</button>'+
 '<button type="button" data-board-dp-scale="full" aria-pressed="'+(mode==='full')+
 '" class="'+(mode==='full'?'active':'')+'">Full · 0–45</button></div>';
}
const dpScaleNote=(metric,scale='focus',worldBasis='recipients')=>metric==='average'?
 '<p class="board-dp-scale-note" role="note">'+
 (scale==='full'?'Full Diploma scoring scale displayed (0–45).':
 'Focused axis begins at <strong>'+(worldBasis==='overall'?'20':'30')+', not zero</strong> ('+
 (worldBasis==='overall'?'20–40':'30–40')+' out of 45). This magnifies visible differences; switch to Full scale for context.')+
 ' The reported scores do not change with the axis or reference population.</p>':'';

function dpRangeHighlight(metric){
 const values=DP_RECORDS.map(r=>r[metric]).filter(Number.isFinite);
 if(!values.length)return '';
 const low=Math.min(...values),high=Math.max(...values),n=values.length;
 const v=metric==='average'?low.toFixed(1)+'–'+high.toFixed(1)+' <small>/ 45</small>':
  low.toFixed(0)+'–'+high.toFixed(0)+'<small>%</small>';
 const label=metric==='average'?'Annual Diploma score range':'Diploma award-rate range';
 return '<div class="board-chart-range-annotation" role="note">'+
 '<span class="board-chart-range-icon" aria-hidden="true">↗</span>'+
 '<div><span class="board-chart-range-title">'+label+'</span>'+
 '<strong>'+v+'</strong>'+
 '<small>Across '+n+' recorded graduating years · cohorts differ</small></div></div>';
}

export function renderDPPointDetails(key,worldBasis='recipients'){
 const match=/^(average|passRate):(\d{4})$/.exec(String(key||''));
 const item=match?dpPoint(match[2],match[1],worldBasis):null;
 if(!item)return '<p>Select a year to see the school outcome.</p>';
 const {row,metric,value,label,worldValue}=item;
 return '<div class="board-dp-point-title"><div><span class="eyebrow">IB DIPLOMA · '+safe(row.year)+'</span>'+
 '<h3>'+safe(label)+'</h3></div><strong>'+valueText(value,metric)+(metric==='average'?'<small> / 45</small>':'')+'</strong></div>'+
 (Number.isFinite(worldValue)?'<p class="board-dp-global-point">'+
  (metric==='average'?(worldBasis==='overall'?
   'World all Diploma/retake results · '+worldValue.toFixed(2)+' / 45 · broader than AISG Diploma recipients; not a matched score gap':
   'World Diploma recipients · '+valueText(worldValue,metric)+' / 45 · matched recipient category · AISG '+delta(value,worldValue)+' points'):
   'World Diploma award rate · '+valueText(worldValue,metric)+' · AISG '+percentage(value-worldValue)+' percentage points higher')+'</p>':
  '<p>Worldwide comparison unavailable for this earlier year or measure.</p>')+
 (metric==='average'&&Number.isFinite(row.worldAverage)&&Number.isFinite(row.worldAwardedAverage)?
  '<p class="board-dp-global-point"><strong>Other worldwide reference:</strong> '+
   (worldBasis==='overall'?'Diploma recipients '+valueText(row.worldAwardedAverage,'average'):
    'All Diploma/retake results '+row.worldAverage.toFixed(2))+' / 45.</p>':'')+
 (row.candidates?'<p><strong>AISG candidate count:</strong> '+row.candidates+' Diploma/retake candidates · '+row.passes+' Diplomas awarded.</p>':'')+
 (Number.isFinite(row.meanGrade)?'<p><strong>AISG mean subject grade:</strong> '+row.meanGrade.toFixed(2)+' / 7 (Diploma awardees).</p>':'')+

 (row.covid?'<p class="board-dp-caveat">'+safe(row.covid)+'</p>':'')+
 '<p class="board-dp-point-footnote">Annual graduating cohorts differ; participation and qualification measures are not interchangeable.</p>';
}
function dpLineChart(metric,{range='all',selectedYear=null,compareWorld=false,scale='focus',worldBasis='recipients'}={}){
 const meta=metricMeta(metric),all=dpMetricSeries(metric,worldBasis);
 const scoped=metric==='average'&&worldBasis==='overall'&&compareWorld?all.filter(r=>r.end>=2017):all;
 const items=range==='recent'?scoped.slice(-3):scoped;
 const width=920,height=330,left=58,right=28,top=75,bottom=257;
 const availableValues=items.flatMap(r=>[r.value,...(compareWorld?[r.worldValue]:[])]).filter(Number.isFinite);
 const focusMin=worldBasis==='overall'?20:30;
 const focus=metric==='average'&&scale!=='full'&&availableValues.every(n=>n>=focusMin&&n<=40);
 const min=focus?focusMin:0,max=focus?40:meta.max;
 const xp=i=>left+(width-left-right)*(i/Math.max(1,items.length-1));
 const yp=n=>bottom-((n-min)/(max-min))*(bottom-top);
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
 const lines=pathFor('value','#173d60')+(compareWorld?pathFor('worldValue','#b3444b',true):'');
 const worldPoints=compareWorld?items.map((r,i)=>Number.isFinite(r.worldValue)?
  '<g class="board-dp-world-hover" data-board-dp-world-point="'+metric+':'+r.end+
  '" role="button" tabindex="0" aria-label="'+safe(r.year+', World IB '+meta.label+
  ' '+valueText(r.worldValue,metric)+'. '+(metric==='average'&&worldBasis==='overall'?
    'Includes unsuccessful Diploma candidates; not a matched cohort.':'Hover or focus for details.'))+'">'+
  '<circle cx="'+xp(i)+'" cy="'+yp(r.worldValue)+'" r="15" fill="transparent"/>'+
  '<circle class="board-dp-world-point" cx="'+xp(i)+'" cy="'+yp(r.worldValue)+'" r="4.6" fill="#b3444b" stroke="#fff" stroke-width="1.4"/>'+
  '<text class="board-dp-world-value" text-anchor="middle" x="'+xp(i)+'" y="'+(yp(r.worldValue)+21)+'">'+
  (metric==='average'?r.worldValue.toFixed(worldBasis==='overall'?2:1):Math.round(r.worldValue)+'%')+'</text></g>':'').join(''):'';
 const tickValues=focus?(worldBasis==='overall'?[20,25,30,35,40]:[30,32,34,36,38,40]):
  [0,.25,.5,.75,1].map(frac=>Math.round(max*frac));
 const ticks=tickValues.map(val=>{
  const y=yp(val);
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
   '<text x="'+xx+'" y="'+(yy-19)+'" text-anchor="middle" class="board-trend-value" fill="#176397">'+(metric==='average'?headlinePoints(r.value):Math.round(r.value)+'%')+'</text></g>'+title;
 }).join('');
 return '<svg class="board-dp-svg" viewBox="0 0 '+width+' '+height+'" role="group" aria-label="'+safe(meta.label)+
  ' by AISG graduating year'+(compareWorld?', with global IB reference':'')+
  '. '+(focus?'Focused y-axis '+focusMin+' to 40, truncated above zero.':'Full y-axis from 0 to '+max+'.')+'" xmlns="http://www.w3.org/2000/svg">'+
  '<text class="board-trend-axislabel" x="'+left+'" y="22">'+safe(meta.label)+(metric==='average'?' · out of 45':' · percentage')+'</text>'+
  '<text class="board-dp-axis-mode" text-anchor="end" x="'+(width-right)+'" y="22">'+
  (focus?'FOCUSED AXIS · '+focusMin+'–40 (NOT ZERO-BASED)':'FULL AXIS · 0–'+max)+'</text>'+
  ticks+lines+worldPoints+marks+'</svg>';
}
function dpOutcomesTable(){
 return '<details class="board-details board-dp-table"><summary>Detailed results by graduating year <span>+</span></summary>'+
 '<p>Two world averages are shown separately: <strong>Diploma recipients</strong> (same award category as AISG) and <strong>all Diploma/retake results</strong> (includes unsuccessful Diploma candidates). Score gaps use only matched Diploma recipients. Missing results are dashes, not zeros.</p>'+
 '<div class="tablewrap"><table class="board-table board-dp-detail-table"><thead><tr>'+
 '<th>Class</th><th>AISG recipients /45</th><th>World recipients /45</th><th>Matched gap</th><th>World overall /45</th>'+
 '<th>Diploma pass</th><th>World pass</th><th>Candidates / cohort</th><th>Diplomas awarded</th>'+
 '<th>35+ points</th><th>Bilingual</th><th>Mean subject grade</th><th>Mean core</th><th>Highest /45</th><th>Source context</th></tr></thead><tbody>'+
 DP_RECORDS.map(r=>'<tr><td>'+r.end+'</td><td>'+points(r.average)+'</td>'+
 '<td>'+points(r.worldAwardedAverage)+'</td><td>'+delta(r.average,r.worldAwardedAverage)+'</td>'+
 '<td>'+points(r.worldAverage)+'</td>'+
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
 const worldBasis=state.boardDpWorldBasis==='recipients'?'recipients':'overall';
 const verified=DP_RECORDS.filter(r=>Number.isFinite(r.average));
 const highAwardYears=verified.filter(r=>r.passRate>=90).length;
 const detailNote='Different graduating cohorts each year; these are not matched student growth scores.';
 const worldAvg=selected.worldAwardedAverage;
 const worldOverall=selected.worldAverage;
 const worldPass=selected.worldPassRate;
 const international='<div class="board-dp-world-strip" aria-label="International Diploma comparisons">'+
  mini('World all DP results',Number.isFinite(worldOverall)?worldOverall.toFixed(2)+' /45':'—',
   'All Diploma/retake results · includes candidates not awarded the Diploma')+
  mini('World Diploma recipients',Number.isFinite(worldAvg)?points(worldAvg)+' /45':'—',
   Number.isFinite(worldAvg)?'Same award category as AISG · matched AISG '+delta(selected.average,worldAvg)+' points':'Recipient-only global mean unavailable for this year')+
  mini('World Diploma pass rate',Number.isFinite(worldPass)?Math.round(worldPass)+'%':'—',
   Number.isFinite(worldPass)?'AISG '+percentage(selected.passRate-worldPass).replace('%',' percentage points')+' vs world':'Global pass-rate result unavailable for this year')+
  mini('Diploma/retake candidates',selected.candidates?
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
 '<h2>IB Diploma Results</h2><p>Choose a year to highlight Diploma outcomes. Subject comparisons below always show their available years.</p></div>'+
 '<label class="board-dp-year-simple">Spotlight year <select data-board-dp-select="year" aria-label="Diploma school year">'+
 [...DP_RECORDS].reverse().map(r=>option(r.end,String(r.end),end)).join('')+'</select></label></div>'+
 '<nav class="board-dp-section-nav" aria-label="Diploma page sections">'+
 '<button type="button" data-board-dp-jump="board-dp-outcomes">Annual outcomes</button>'+ 
 '<button type="button" data-board-dp-jump="board-dp-history">History since 2016</button>'+
 '<button type="button" data-board-dp-jump="board-dp-subjects">Subject results</button></nav>'+ 
 '<section id="board-dp-outcomes" class="board-dp-comparison-panel"><div class="board-dp-panel-heading"><div>'+
 '<span class="eyebrow">DIPLOMA OUTCOMES · CLASS OF '+end+'</span>'+
 '<h3>Diploma at a Glance</h3><p>Two measures describe the selected May cohort; the third shows consistency across 2016–2026.</p></div>'+
 '</div>'+
 '<div class="board-dp-graphic-grid">'+
 outcomeTile('average','AISG average Diploma score',headlinePoints(selected.average),'/45',
   'Class of '+end)+
 outcomeTile('pass','AISG Diploma pass rate',valueText(selected.passRate,'passRate'),'',
   (dpPassCount(selected)?dpPassCount(selected)+' candidates':'School reported rate'))+
 outcomeTile('consistency','Long-term Diploma success',highAwardYears+' / '+verified.length,'years',
   'May sessions awarding Diplomas to at least 90% of candidates')+'</div>'+
 international+
 '<p class="board-dp-graphic-footnote">'+
 'AISG May '+end+' Diploma awards and averages are sourced from official IB School Statistics (school 001832). '+
 'Two worldwide means are available: <strong>Diploma recipients</strong> (matched award category) and <strong>all Diploma/retake results</strong> (wider population). The overall series provides context, not a like-for-like AISG score gap. May 2026 world data are provisional; earlier years use IB final bulletins. The final May 2021 worldwide overall mean is 32.98. AISG school averages are IB-published rounded figures.</p></section>'+
 '<section id="board-dp-history" class="board-panel board-dp-panel"><div class="board-dp-chart-top"><div>'+
 '<span class="eyebrow">HISTORICAL OUTCOMES</span>'+
 '<h3>'+(metric==='average'?'Diploma Average Points':'Diploma Pass Rate')+' Over Time</h3>'+
 '<p>'+DP_RECORDS.length+' graduating years ('+DP_RECORDS[0].end+'–'+DP_RECORDS.at(-1).end+') · '+safe(detailNote)+'</p></div>'+
 '<div class="board-segmented" role="group" aria-label="Select Diploma history measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(metric==='average')+
 '" class="'+(metric==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(metric==='passRate')+
 '" class="'+(metric==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 '<div class="board-dp-trend-controls"><span class="board-dp-legend"><i class="board-dp-key-aisg"></i>AISG recipients'+
 (comparison?'<i class="board-dp-key-world"></i>World IB · '+(metric==='average'?basisName(worldBasis):'Diploma award rate'):'')+'</span>'+
 '<div class="board-dp-chart-actions">'+dpWorldBasisControls(metric,worldBasis)+dpScaleControls(metric,state.boardDpScale,worldBasis)+
 '<button type="button" class="board-dp-global-toggle" data-board-dp-global aria-pressed="'+comparison+'">'+
 (comparison?'Show AISG only':'Compare with world')+'</button></div></div>'+
 dpRangeHighlight(metric)+
 '<p class="board-dp-swipe">Hover or focus an AISG or world point to see precise scores and AISG candidate counts. Select an AISG year to inspect its outcome.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Explore Diploma outcomes by school year">'+
 dpLineChart(metric,{selectedYear:end,compareWorld:comparison,scale:state.boardDpScale,worldBasis})+'</div>'+
 dpScaleNote(metric,state.boardDpScale,worldBasis)+
 (metric==='average'&&comparison&&worldBasis==='recipients'?matchedGlobalGaps():'')+
 (metric==='average'&&comparison&&worldBasis==='overall'?
  '<p class="board-dp-population-note"><strong>Different populations:</strong> AISG average covers Diploma recipients; the world overall average includes Diploma/retake candidates who did not receive a Diploma. This is context, not a matched school gap. Select “Diploma recipients” for like-category comparison.</p>':'')+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p>Hover or select a year to inspect its outcome.</p></div>'+
 '<p class="board-chart-caption">Average-point charts label the focused axis, with full 0–45 available. Pass rates use 0–100%. Worldwide averages use the <strong>selected population</strong>. Only the recipient-matched category produces calculated score gaps. The 2020–22 sessions had altered assessment arrangements.</p></section>'+ renderDiplomaSubjectSection(state)+

 achievements+
 dpPathways()+
 dpOutcomesTable()+
 '<details class="board-details board-dp-method"><summary>Understanding Diploma results <span>+</span></summary>'+
 '<p>'+safe(DP_METHODS.quality)+'</p><p>'+safe(DP_METHODS.limits)+'</p>'+
 '<p>'+safe(DP_METHODS.comparison)+'</p><p>'+safe(DP_METHODS.covid)+'</p>'+
 '<p>'+safe(DP_METHODS.discrepancy)+'</p><p>'+safe(DP_METHODS.pathways)+'</p>'+
 '<p>'+safe(DP_METHODS.boundary)+'</p>'+
 '<p>IB 2026 worldwide DP mean: 30.88 points · <a href="https://ibo.org/news/news-list/more-than-209000-ib-students-worldwide-receive-their-dp-and-cp-results/" target="_blank" rel="noopener noreferrer">IB July 2026 announcement</a>. Worldwide Diploma pass rate: 82.6% · <a href="https://ibo.org/about-the-ib/facts-and-figures/statistical-bulletins/diploma-programme-and-career-related-programme-statistical-bulletin/" target="_blank" rel="noopener noreferrer">IB May 2026 statistical bulletin</a>.</p>'+
 '</details></section>';
}

/** One concise historical visual shared with the Board's Overview. */
export function renderDPOverviewTrend(state){
 const selected=state.boardDpMetric==='passRate'?'passRate':'average';
 const worldBasis=state.boardDpWorldBasis==='recipients'?'recipients':'overall';
 return '<div class="board-dp-overview-trend">'+
 '<div class="board-dp-chart-top"><div><span class="eyebrow">GRADUATION OUTCOMES · IB DIPLOMA</span>'+
 '<h2>Diploma Outcomes Over Time</h2>'+
 '<p>'+DP_RECORDS.length+' AISG graduating years · '+(selected==='average'?'World IB '+basisName(worldBasis)+' · points out of 45':'AISG vs worldwide Diploma award rates · percentage')+'</p></div>'+
 '<div class="board-segmented" role="group" aria-label="IB Diploma historical measure">'+
 '<button type="button" data-board-dp-metric="average" aria-pressed="'+(selected==='average')+'" class="'+(selected==='average'?'active':'')+'">Average points</button>'+
 '<button type="button" data-board-dp-metric="passRate" aria-pressed="'+(selected==='passRate')+'" class="'+(selected==='passRate'?'active':'')+'">Pass rate</button></div></div>'+
 dpRangeHighlight(selected)+
 (selected==='average'?'<div class="board-dp-overview-scale">'+dpWorldBasisControls(selected,worldBasis)+dpScaleControls(selected,state.boardDpScale,worldBasis)+'</div>':'')+
 '<div class="board-dp-overview-legend" role="note"><span><i class="board-dp-key-aisg"></i> AISG Diploma recipients</span><span><i class="board-dp-key-world"></i> World IB · '+(selected==='average'?basisName(worldBasis):'Diploma awards')+'</span>'+
 '<small>'+(selected==='average'?(worldBasis==='overall'?
  'Worldwide overall average includes unsuccessful Diploma/retake candidates; AISG average is recipients only.':
  'Same awarded-Diploma category; 2016 worldwide recipient-only mean unavailable.'):'Worldwide Diploma award rate; all eleven May sessions.')+'</small></div>'+
 '<p class="board-dp-swipe">Hover or focus any plotted point for precise AISG/world data and AISG candidate counts.</p>'+
 '<div class="board-dp-chart-scroll" tabindex="0" aria-label="Scroll to inspect Diploma outcomes">'+dpLineChart(selected,{compareWorld:true,scale:state.boardDpScale,worldBasis})+'</div>'+
 dpScaleNote(selected,state.boardDpScale,worldBasis)+
 (selected==='average'&&worldBasis==='recipients'?matchedGlobalGaps():'')+
 (selected==='average'&&worldBasis==='overall'?
  '<p class="board-dp-population-note">Context only: AISG average covers Diploma recipients; the worldwide overall average includes Diploma/retake candidates not awarded a Diploma. Select “Diploma recipients” for a matched award-category comparison.</p>':'')+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<div class="board-dp-inspector" aria-live="polite"><p>Select a year to understand its reported outcome.</p></div>'+
 '<div class="board-overview-chartfoot"><span>Official AISG 001832 school statistics and world IB bulletins · school May 2016–2026; overall world reference May 2017–2026. The 2016 recipient-only world mean is unavailable. The final May 2021 worldwide overall score is 32.98.</span>'+
 '<button type="button" data-board-view="dp" class="board-inline-link">Explore IB Diploma details ›</button></div>'+
 '</div>';
}
