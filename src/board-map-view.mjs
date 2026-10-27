/** AISG MAP Board: a deliberately consistent comparison surface for every window.
 * The four KPIs, two-series grade chart and exact-figures table never change
 * layout. Missing values are shown as "—" without inferring zero.
 */
import {BOARD_DATA,BOARD_SUBJECTS,BOARD_GRADE_LIST,BOARD_SCHOOL_YEARS,
 BOARD_METHODS,boardRows,boardSummary,boardWindowFor} from './board-map-data.mjs';
import {esc} from './v2-ui.mjs';
import {renderBoardOverview} from './board-map-overview.mjs';
import {renderBoardDP} from './board-dp-view.mjs';
import {renderMapComparisonTiles} from './board-comparison-tiles.mjs';
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
 '<p>Differences in average MAP score points. Right of zero means AISG is above the comparison average.</p>'+
 '</div><div class="board-legend"><span><i class="board-dot us"></i>U.S. norm</span>'+
 (showEarcos?'<span><i class="board-dot earcos"></i>EARCOS mean</span>':'')+'</div></div>'+
 '<div class="board-axis"><span>Below comparison</span><span>0 MAP pts</span><span>Above comparison</span></div>'+
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
 const info=BOARD_DATA[window];
 const description=window==='fall2026'?BOARD_METHODS.fall2026:
  window==='spring2026'?BOARD_METHODS.spring:
  window==='fall2025'?BOARD_METHODS.fall:BOARD_METHODS.history;
 const benchmark=info.usNormType==='2025-school'?
  'U.S. comparison: NWEA 2025 school-achievement norms, season-matched to the selected MAP window.':
  'Historical U.S. comparison: norm population and edition not confirmed; avoid comparing benchmark gaps between editions.';
 return '<details class="board-details board-source"><summary>How to interpret these results <span>+</span></summary>'+
 '<p><strong>Benchmark:</strong> '+safe(benchmark)+'</p>'+
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
 const selectedSubject=BOARD_SUBJECTS.some(x=>x.id===state.boardSubject)?state.boardSubject:'math';
 const division=['all','elementary','secondary'].includes(state.boardDivision)?state.boardDivision:'all';
 const year=active.startsWith('spring')?Number(active.slice(6))-1:Number(active.slice(4));
 const fall=boardWindowFor(year,'fall'),spring=boardWindowFor(year,'spring');
 const options=[{id:fall||'unavailable-fall',label:'Fall',disabled:!fall},
                {id:spring||'unavailable-spring',label:'Spring',disabled:!spring}];
 const allowed=BOARD_GRADE_LIST.filter(g=>division==='all'||division==='elementary'&&g<=5||division==='secondary'&&g>=6);
 const selectedGrade=state.boardGrade==='all'||allowed.includes(Number(state.boardGrade))?state.boardGrade:'all';
 const rows=boardRows(active,selectedSubject,division,selectedGrade);
 const summary=boardSummary(active,selectedSubject,division,selectedGrade);
 const name=BOARD_SUBJECTS.find(x=>x.id===selectedSubject).label;
 const explore=state.boardView==='explore',diploma=state.boardView==='dp';
 const header='<section class="board-view">'+
 '<div class="heading board-heading"><div><div class="eyebrow">AISG · BOARD · LEARNING EVIDENCE</div>'+
 '<h1>Learning outcomes over time</h1><p>MAP achievement and growth, alongside Diploma Programme outcomes.</p></div>'+
 '<div class="board-provenance-badge"><strong>AISG AGGREGATED DATA</strong><small>No student records</small></div></div>'+
 '<div class="board-nav-row"><nav class="board-nav-tabs" aria-label="Board dashboard sections">'+
 '<button type="button" data-board-view="overview" aria-current="'+(!explore&&!diploma?'page':'false')+'" class="'+(!explore&&!diploma?'active':'')+'">Overview</button>'+
 '<button type="button" data-board-view="explore" aria-current="'+explore+'" class="'+(explore?'active':'')+'">MAP</button>'+
 '<button type="button" data-board-view="dp" aria-current="'+diploma+'" class="'+(diploma?'active':'')+'">IB Diploma</button>'+
 '</nav><div class="board-share-area">'+
 '<button type="button" class="board-presentation-button" data-board-presentation aria-pressed="'+!!state.boardPresentation+'">'+
 (state.boardPresentation?'Exit presentation':'Presentation view')+'</button>'+
 '<button type="button" class="board-copy-link" data-board-share="true" aria-label="Copy link to this Board view">Copy link</button>'+
 '<span class="board-share-feedback" id="board-share-feedback" role="status" aria-live="polite"></span></div></div>';
 if(diploma)return header+renderBoardDP(state)+'</section>';
 if(!explore)return header+renderBoardOverview(state)+'</section>';
 const filters='<div class="board-controls board-simple-controls">'+
 '<div class="board-control-group"><span class="board-filter-label">School year</span>'+
 '<select class="board-year-picker" data-board-select="year" aria-label="MAP school year">'+
 BOARD_SCHOOL_YEARS.map(y=>option(y,y+'–'+String((y+1)%100).padStart(2,'0'),year)).join('')+'</select></div>'+
 '<div class="board-control-group"><span class="board-filter-label">Testing window</span>'+
 segmented('window',options,active)+'</div>'+
 '<div class="board-filter-selects"><label>School division <select data-board-select="division" aria-label="Board MAP division">'+
 option('all','All tested grades (G3–10)',division)+
 option('elementary','Elementary (G3–5)',division)+
 option('secondary','Secondary (G6–10)',division)+'</select></label></div></div>';
 const growth=state.boardMapGrowthOpen?
 '<section class="board-growth-explainer"><div><span class="eyebrow">MAP · STUDENT GROWTH</span>'+
 '<h2>95% of returning students grew in at least one MAP area</h2>'+
 '<p>Fall 2026 schoolwide finding. It measures whether a returning student improved in <em>one or more</em> subject areas, not the percentage reaching projected growth and not the proportion above U.S. norms. This figure is schoolwide and is not filtered by division or grade.</p></div>'+
 '<button type="button" data-board-dismiss-growth aria-label="Close growth explanation">Close</button></section>':'';
 const details=state.boardMapDetailsOpen?
 '<section class="board-map-drilldown" id="board-map-detail" tabindex="-1">'+
 '<div class="board-map-drilldown-heading"><div><span class="eyebrow">EXPLORE THE GRADES</span>'+
 '<h2>'+safe(name)+' · '+safe(BOARD_DATA[active].label)+'</h2>'+
 '<p>See where individual grade averages sit relative to U.S. and regional schools.</p></div>'+
 '<button type="button" class="board-close-drilldown" data-board-close-details>Close details ×</button></div>'+
 '<div class="board-map-grade-controls"><label>Grade <select data-board-select="grade" aria-label="Board MAP grade">'+
 option('all','All grades in selection',selectedGrade)+allowed.map(g=>option(String(g),'Grade '+g,selectedGrade)).join('')+
 '</select></label></div>'+
 gradeComparison(rows,summary)+
 (summary.growthPct!==null?'<p class="board-matched-growth"><strong>Matched student growth:</strong> '+
 summary.growthPct+'% of eligible students met projected growth in this subject, based on Spring-to-Spring comparisons. This is distinct from achievement.</p>':'')+
 exactTable(rows,summary)+sourceDetails(active)+
 '</section>':
 '<div class="board-choose-prompt" aria-live="polite"><strong>Want to look more closely?</strong> Select Mathematics, Reading or Language Usage above to explore individual grades.</div>';
 return header+filters+growth+
 renderMapComparisonTiles({schoolYear:year,selectedWindow:active,
  selectedSubject:state.boardMapDetailsOpen?selectedSubject:'',
  division,compareSeasons:!!state.boardMapCompareSeasons})+
 details+'</section>';
}
