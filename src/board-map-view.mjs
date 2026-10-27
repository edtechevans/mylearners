/** AISG MAP Board: a deliberately consistent comparison surface for every window.
 * The four KPIs, two-series grade chart and exact-figures table never change
 * layout. Missing values are shown as "—" without inferring zero.
 */
import {BOARD_DATA,BOARD_SUBJECTS,BOARD_GRADE_LIST,BOARD_SCHOOL_YEARS,
 BOARD_METHODS,boardRows,boardSummary,boardWindowFor} from './board-map-data.mjs';
import {esc} from './v2-ui.mjs';
import {renderBoardOverview} from './board-map-overview.mjs';
import {renderBoardDP} from './board-dp-view.mjs';
const safe=v=>esc(v??'');
const n1=n=>Number.isFinite(n)?Number(n).toFixed(1):'—';
const diff=n=>Number.isFinite(n)?(n>0?'+':'')+Number(n).toFixed(1):'—';
const pct=(n,d)=>d?Math.round(n/d*100)+'%':'—';
const sourceLabel=v=>v==='us'?'U.S. norm':'EARCOS mean';
const option=(val,title,current)=>'<option value="'+safe(val)+'"'+(String(val)===String(current)?' selected':'')+'>'+safe(title)+'</option>';
function segmented(kind,options,selected){
 return '<div class="board-segmented" role="group" aria-label="'+(kind==='subject'?'MAP subject':'Fall or Spring window')+'">'+
 options.map(o=>'<button type="button" '+(kind==='subject'?'data-board-subject':'data-board-window')+'="'+safe(o.id)+'"'+
 (o.disabled?' disabled title="Not yet available"':'')+
 ' class="'+(o.id===selected?'active':'')+'" aria-pressed="'+(o.id===selected?'true':'false')+'">'+safe(o.label)+'</button>').join('')+'</div>';
}
function indicator(label,value,detail){
 return '<article class="board-indicator'+(value==='—'?' is-unavailable':'')+'"><span class="board-indicator-label">'+safe(label)+'</span>'+
 '<strong>'+safe(value)+'</strong><span class="board-indicator-detail">'+safe(detail)+'</span></article>';
}
function difference(row,benchmark){
 if(!Number.isFinite(row.aisg)||!Number.isFinite(row[benchmark]))return null;
 return row.aisg-row[benchmark];
}
function comparisonSeries(row,benchmark){
 const value=difference(row,benchmark);
 const isDirectional=benchmark==='us'&&row.aboveUsMean===true;
 const source=benchmark==='us'?'us':'earcos';
 let track='',result='—';
 if(Number.isFinite(value)){
  const abs=Math.min(40,Math.abs(value)),width=Math.max(0.7,abs/40*50);
  const left=value<0?50-width:50;
  track='<i class="board-bar-fill '+source+'" style="left:'+left.toFixed(2)+'%;width:'+width.toFixed(2)+'%"></i>';
  result=diff(value);
 }else if(isDirectional){
  track='<span class="board-direction-label">Above norm</span>';
  result='Above';
 }
 return '<div class="board-bar-series"><span class="board-bar-name">'+(benchmark==='us'?'U.S.':'EARCOS')+'</span>'+
 '<div class="board-bar-track'+(value===null?' board-bar-no-value':'')+'" role="img" aria-label="Grade '+
 row.grade+', '+sourceLabel(benchmark)+': '+(value===null?(isDirectional?'above reference, exact RIT gap unavailable':'data not available'):diff(value)+' RIT points')+'">'+
 '<i class="board-bar-zero"></i>'+track+'</div>'+
 '<strong class="board-bar-value'+(value!==null&&value<0?' below':'')+(isDirectional?' directional':'')+'">'+safe(result)+'</strong></div>';
}
function gradeComparison(rows,summary){
 const showEarcos=summary.earcosAvailable>0;
 return '<section class="board-panel board-chart-panel'+(!showEarcos?' board-us-only':'')+'">'+
 '<div class="board-chart-top"><div><span class="eyebrow">GRADE-LEVEL ACHIEVEMENT</span>'+
 '<h2>'+(!showEarcos?'AISG compared with U.S. school norms':'AISG compared with U.S. and EARCOS')+'</h2>'+
 '<p>Differences in mean RIT points. Right of zero = AISG above the comparison average.</p>'+
 '</div><div class="board-legend"><span><i class="board-dot us"></i>U.S. norm</span>'+
 (showEarcos?'<span><i class="board-dot earcos"></i>EARCOS mean</span>':'')+'</div></div>'+
 '<div class="board-axis"><span>Below reference</span><span>0 RIT</span><span>Above reference</span></div>'+
 '<div class="board-grade-plot">'+rows.map(r=>'<div class="board-grade-row"><div class="board-grade-name">Grade '+r.grade+'</div>'+
 '<div class="board-grade-series">'+comparisonSeries(r,'us')+
 (showEarcos?comparisonSeries(r,'earcos'):'')+'</div></div>').join('')+'</div>'+
 (!showEarcos?'<div class="board-not-available"><strong>EARCOS —</strong><span>Not available for this testing window; no regional comparison is inferred.</span></div>':'')+
 '<p class="board-chart-caption">Each bar shows the AISG grade mean minus the published grade reference. — means missing, not zero. Different grade snapshots do not measure individual growth.</p></section>';
}
function growthCell(row){
 return Number.isFinite(row.growthEligible)&&row.growthEligible>0?
 pct(row.growthMet,row.growthEligible)+' ('+row.growthMet+'/'+row.growthEligible+')':'—';
}
function exactTable(rows,summary){
 const directionOnly=summary.source?.evidence==='direction-only';
 return '<details class="board-details board-figures"><summary>View exact grade-level results <span>+</span></summary>'+
 '<div class="tablewrap"><table class="board-table"><thead><tr>'+
 '<th>Grade</th><th>AISG mean RIT</th><th>U.S. mean RIT</th><th>EARCOS mean RIT</th>'+
 '<th>Gap vs U.S.</th><th>Gap vs EARCOS</th><th>Meeting projected growth</th></tr></thead><tbody>'+
 rows.map(r=>'<tr><td>G'+r.grade+'</td><td><strong>'+n1(r.aisg)+'</strong>'+(Number.isInteger(r.n)?'<small class="board-count-note">n='+r.n+'</small>':'')+'</td>'+
 '<td>'+n1(r.us)+'</td><td>'+n1(r.earcos)+'</td>'+
 '<td>'+(directionOnly&&r.aboveUsMean?'Above':diff(difference(r,'us')))+'</td>'+
 '<td>'+diff(difference(r,'earcos'))+'</td><td>'+growthCell(r)+'</td></tr>').join('')+
 '</tbody></table></div><p class="board-table-note">Every testing window uses the same columns. A dash indicates data not provided or not applicable, never zero. The reported student growth rate only exists for matched Spring 2026 Mathematics and Reading records.</p></details>';
}
function sourceDetails(window){
 const source=BOARD_DATA[window];
 const description=window==='fall2026'?BOARD_METHODS.fall2026:
  window==='spring2026'?BOARD_METHODS.spring:
  window==='fall2025'?BOARD_METHODS.fall:BOARD_METHODS.history;
 return '<details class="board-details board-source"><summary>Sources, definitions and missing data <span>+</span></summary>'+
 '<p><strong>Source:</strong> '+safe(source.source)+'</p>'+
 (source.usNormType==='2025-school'?'<p><a href="https://www.nwea.org/resource-center/fact-sheet/87992/MAP-Growth-2025-norms-quick-reference_NWEA_onesheet.pdf" target="_blank" rel="noopener noreferrer">NWEA 2025 Norms quick reference · school achievement norms, page 3</a></p>':'')+
 (source.usNormType==='historical-unverified'?'<p><strong>Historical U.S. comparison:</strong> archived reference mean; the norm type and edition could not be confirmed. Do not treat older U.S. gaps as a consistent national trend.</p>':'')+
 '<p>'+safe(description)+'</p>'+
 '<p>'+safe(BOARD_METHODS.achievement)+'</p>'+
 '<p>'+safe(BOARD_METHODS.growth)+'</p>'+
 '<p>'+safe(BOARD_METHODS.missing)+'</p>'+
 '<p>'+safe(BOARD_METHODS.caution)+'</p></details>';
}
function schoolwideHighlight(window){
 if(window!=='fall2026')return '';
 const s=BOARD_DATA.fall2026.schoolwide;
 return '<aside class="board-schoolwide-fact"><span class="eyebrow">FALL 2026 · SCHOOLWIDE HIGHLIGHTS · NOT FILTERED</span>'+
 '<div class="board-schoolwide-inner"><div><strong>'+s.aboveUSComparisons+' / '+s.totalComparisons+'</strong>'+
 '<span>Grade-subject averages above U.S. norms (Math, Reading, Language Usage)</span></div>'+
 '<div><strong>'+s.returningGrowthInOneOrMoreAreasPct+'%</strong>'+
 '<span>Returning students with growth in at least one MAP area</span></div></div>'+
 '<p>AISG also reported exceeding projected group growth in all three subjects. These schoolwide findings do not change when you select a division or grade.</p></aside>';
}
export function renderBoard(state){
 const active=BOARD_DATA[state.boardWindow]?state.boardWindow:'fall2026';
 const source=BOARD_DATA[active];
 const selectedSubject=BOARD_SUBJECTS.some(s=>s.id===state.boardSubject)?state.boardSubject:'math';
 const selectedDiv=['all','elementary','secondary'].includes(state.boardDivision)?state.boardDivision:'all';
 const selectedYear=active.startsWith('spring')?Number(active.slice(6))-1:Number(active.slice(4));
 const allowed=BOARD_GRADE_LIST.filter(g=>selectedDiv==='all'||selectedDiv==='elementary'&&g<=5||selectedDiv==='secondary'&&g>=6);
 const selectedGrade=state.boardGrade==='all'||allowed.includes(Number(state.boardGrade))?state.boardGrade:'all';
 const rows=boardRows(active,selectedSubject,selectedDiv,selectedGrade);
 const summary=boardSummary(active,selectedSubject,selectedDiv,selectedGrade);
 const subjectName=BOARD_SUBJECTS.find(s=>s.id===selectedSubject).label;
 const fallKey=boardWindowFor(selectedYear,'fall');
 const springKey=boardWindowFor(selectedYear,'spring');
 const seasonTabs=[{id:fallKey||'unavailable-fall',label:'Fall',disabled:!fallKey},
                   {id:springKey||'unavailable-spring',label:'Spring',disabled:!springKey}];
 const area=selectedGrade!=='all'?'Grade '+selectedGrade:selectedDiv==='all'?'All tested grades (G3–10)':
  selectedDiv==='elementary'?'Elementary · Grades 3–5':'Secondary · Grades 6–10';
 const eu=summary.earcosAvailable,us=summary.usAvailable,total=summary.gradeCount;
 const eLabel=eu?summary.aboveEarcos+' / '+eu:'—';
 const eNote=eu?eu===total?'Of '+total+' comparable grade averages':
  eu+' of '+total+' grades have a usable EARCOS average':'EARCOS data not available for this selection';
 const usNote=us?us+' of '+total+' grades with a reported U.S. comparison':'U.S. comparison not available';
 const matched=summary.growthEligible;
 const metrics=[
  ['Grades above U.S. norm',us?summary.aboveUS+' / '+us:'—',usNote],
  ['Grades above EARCOS mean',eLabel,eNote],
  ['Avg grade gap vs U.S.',summary.gapUS===null?'—':diff(summary.gapUS)+' RIT',
   summary.gapUS===null?'Exact RIT means unavailable':'Unweighted mean of '+total+' grade-level gaps'],
  ['Meeting projected growth',summary.growthPct===null?'—':summary.growthPct+'%',
   matched?'Of '+matched+' matched students · Spring-to-Spring':'Matched subject growth not available']
 ];
 const normIsSchool=source.usNormType==='2025-school';
 const note=(normIsSchool?
  'U.S. reference: NWEA 2025 '+(active.startsWith('spring')?'Spring':'Fall')+
  ' SCHOOL achievement norms, matching grade-mean comparisons. ':
  'U.S. reference: archived grade mean; norm type/edition not independently verified. ')+
  (active==='fall2026'?'EARCOS Fall 2026 comparison unavailable (—). ':
   active==='spring2026'?'EARCOS Spring 2026 values from supplied regional report. ':
   'EARCOS mean matches the reported testing season. ')+
  'Grade mean gaps describe achievement, not individual student growth.';
 const explore=state.boardView==='explore',diploma=state.boardView==='dp';
 const header='<section class="board-view">'+
 '<div class="heading board-heading"><div><div class="eyebrow">AISG · BOARD · NWEA MAP GROWTH</div>'+
 '<h1>Learning outcomes over time</h1><p>MAP achievement and growth, alongside Diploma Programme outcomes.</p></div>'+
 '<div class="board-provenance-badge"><strong>AISG AGGREGATED DATA</strong><small>No student records</small></div></div>'+
 '<div class="board-nav-row"><nav class="board-nav-tabs" aria-label="Board dashboard sections">'+
 '<button type="button" data-board-view="overview" aria-current="'+(!explore?'page':'false')+'" class="'+(!explore?'active':'')+'">Overview</button>'+
 '<button type="button" data-board-view="explore" aria-current="'+(explore?'page':'false')+'" class="'+(explore?'active':'')+'">MAP by Year</button>'+
 '<button type="button" data-board-view="dp" aria-current="'+(diploma?'page':'false')+'" class="'+(diploma?'active':'')+'">IB Diploma</button>'+
 '</nav><div class="board-share-area"><button type="button" class="board-copy-link" data-board-share="true" aria-label="Copy link to this Board view">Copy link to this view</button>'+
 '<span class="board-share-feedback" id="board-share-feedback" role="status" aria-live="polite"></span></div></div>';
 if(diploma)return header+renderBoardDP(state)+'</section>';
 if(!explore)return header+renderBoardOverview(state)+'</section>';
 return header+
 '<div class="board-controls">'+
 '<div class="board-control-group"><span class="board-filter-label">Subject</span>'+
 segmented('subject',BOARD_SUBJECTS,selectedSubject)+'</div>'+
 '<div class="board-control-group"><span class="board-filter-label">School year</span>'+
 '<select class="board-year-picker" data-board-select="year" aria-label="MAP school year">'+
 BOARD_SCHOOL_YEARS.map(y=>option(y,y+'–'+String((y+1)%100).padStart(2,'0'),selectedYear)).join('')+'</select></div>'+
 '<div class="board-control-group"><span class="board-filter-label">Window</span>'+
 segmented('window',seasonTabs,active)+'</div>'+
 '<div class="board-filter-selects"><label>Division <select data-board-select="division" aria-label="Board MAP division">'+
 option('all','All tested grades (G3–10)',selectedDiv)+option('elementary','Elementary',selectedDiv)+option('secondary','Secondary',selectedDiv)+'</select></label>'+
 '<label>Grade <select data-board-select="grade" aria-label="Board MAP grade">'+
 option('all','All grades',selectedGrade)+allowed.map(g=>option(String(g),'Grade '+g,selectedGrade)).join('')+'</select></label></div></div>'+
 '<div class="board-context"><strong>'+safe(subjectName)+' · '+safe(source.label)+'</strong><span>'+safe(area)+'</span></div>'+
 '<div class="board-stats">'+metrics.map(m=>indicator(...m)).join('')+'</div>'+
 '<p class="board-benchmark-note">'+safe(note)+'</p>'+
 (active==='fall2026'?'<p class="board-source-date">AISG NWEA student report snapshot: 20 September 2026 · Aggregates only · Latest dashboard update: 27 October 2026</p>':'')+
 gradeComparison(rows,summary)+schoolwideHighlight(active)+exactTable(rows,summary)+sourceDetails(active)+
 '</section>';
}
