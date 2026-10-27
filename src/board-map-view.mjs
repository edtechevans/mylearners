/**
 * Lightweight Board-facing MAP interface. School-level aggregates only.
 * All controls live in the existing My Learners role switch.
 */
import {BOARD_DATA,BOARD_WINDOWS,BOARD_SUBJECTS,BOARD_GRADE_LIST,BOARD_METHODS,boardRows,boardSummary} from './board-map-data.mjs';
import {esc} from './v2-ui.mjs';

const safe=v=>esc(v??'');
const fmtRit=n=>Number.isFinite(n)?n.toFixed(1):'—';
const fmtGap=n=>Number.isFinite(n)?(n>0?'+':'')+n.toFixed(1):'—';
const formatWindow=id=>BOARD_DATA[id]?.label||'';
const pct=(num,den)=>den?Math.round(100*num/den)+'%':'—';

function segmented(kind,options,current){
 return '<div class="board-segmented" role="group" aria-label="'+(kind==='subject'?'Subject':'Assessment window')+'">'+
 options.map(o=>'<button type="button" data-board-'+kind+'="'+safe(o.id)+'" class="'+(o.id===current?'active':'')+'" aria-pressed="'+(o.id===current?'true':'false')+'">'+safe(o.label)+'</button>').join('')+
 '</div>';
}
const option=(value,label,selected)=>'<option value="'+safe(value)+'"'+(String(value)===String(selected)?' selected':'')+'>'+safe(label)+'</option>';
const indicator=(label,value,description)=>'<article class="board-indicator"><span class="board-indicator-label">'+safe(label)+'</span>'+
 '<strong>'+safe(value)+'</strong><span class="board-indicator-detail">'+safe(description)+'</span></article>';
function singleBar(label,value,source){
 const abs=Math.min(40,Math.abs(value)),w=Math.max(0.8,abs/40*50);
 const left=value<0?50-w:50;
 return '<div class="board-bar-series"><span class="board-bar-name">'+safe(label)+'</span>'+
 '<div class="board-bar-track" role="img" aria-label="AISG '+safe(label)+' gap '+fmtGap(value)+' RIT points">'+
 '<i class="board-bar-zero"></i><i class="board-bar-fill '+safe(source)+'" style="left:'+left.toFixed(2)+'%;width:'+w.toFixed(2)+'%"></i></div>'+
 '<strong class="board-bar-value '+(value<0?'below':'')+'">'+fmtGap(value)+'</strong></div>';
}
function gapChart(rows,hasEarcos){
 if(!rows.length)return '<p class="board-empty">No MAP results for this selection.</p>';
 return '<section class="board-panel board-chart-panel"><div class="board-chart-top"><div><span class="eyebrow">GRADE-LEVEL ACHIEVEMENT</span>'+
 '<h2>How AISG compares</h2><p>AISG mean RIT minus benchmark mean RIT. Right of zero is above the reference.</p></div>'+
 '<div class="board-legend"><span><i class="board-dot us"></i>U.S. norm</span>'+(hasEarcos?'<span><i class="board-dot earcos"></i>EARCOS schools</span>':'')+'</div></div>'+
 '<div class="board-axis"><span>Below reference</span><span>0 RIT</span><span>Above reference</span></div>'+
 '<div class="board-grade-plot">'+rows.map(r=>
 '<div class="board-grade-row"><div class="board-grade-name">Grade '+r.grade+'</div><div class="board-grade-series">'+
 singleBar('U.S.',r.aisg-r.us,'us')+(hasEarcos?singleBar('EARCOS',r.aisg-r.earcos,'earcos'):'')+
 '</div></div>').join('')+'</div>'+
 '<p class="board-chart-caption">Each grade is a different cohort. These are differences in achievement level, not measures of student growth.</p></section>';
}

function fall2026Status(rows,subjectLabel){
 return '<section class="board-panel board-status-panel"><div class="board-chart-top"><div>'+
 '<span class="eyebrow">FALL 2026 · GRADE-LEVEL ACHIEVEMENT</span>'+
 '<h2>Above U.S. school norms</h2>'+
 '<p>Every listed grade\'s '+safe(subjectLabel)+' average exceeded its U.S. school norm. The summary reports the direction, not how many RIT points above.</p>'+
 '</div></div><div class="board-status-grid">'+rows.map(r=>'<div class="board-status-item"><strong>Grade '+r.grade+'</strong>'+
 '<span><i aria-hidden="true">✓</i> Above U.S. norm</span></div>').join('')+'</div>'+
 '<p class="board-chart-caption">Above U.S. norm means the grade average was higher; it does not mean every student scored above the norm. Exact grade means were not included in the Fall 2026 summary.</p></section>';
}
function fall2026SummaryStrip(){
 const data=BOARD_DATA.fall2026.schoolwide;
 return '<aside class="board-schoolwide-fact"><strong>'+data.returningGrowthInOneOrMoreAreasPct+'% of returning students grew in at least one MAP area</strong>'+
 '<span>Schoolwide across Mathematics, Reading and Language Usage. This result is not specific to the selected subject, division or grade.</span>'+
 '<span>AISG also reported exceeding projected group growth in all three subjects.</span></aside>';
}

function boardTable(rows,hasEarcos,window){
 const fall=window==='fall2025';
 return '<details class="board-details"><summary>View exact grade-level RIT figures <span>+</span></summary>'+
 '<div class="tablewrap"><table class="board-table"><thead><tr><th>Grade</th><th>AISG mean RIT</th><th>U.S. mean RIT</th>'+
 (hasEarcos?'<th>EARCOS mean RIT</th>':'<th>Students assessed</th>')+
 (fall?'<th>Students above U.S.</th><th>Students above EARCOS</th>':'<th>Students above U.S.</th><th>Meeting projected growth</th>')+
 '</tr></thead><tbody>'+
 rows.map(r=>'<tr><td>G'+r.grade+'</td><td><strong>'+fmtRit(r.aisg)+'</strong></td><td>'+fmtRit(r.us)+'</td>'+
 (hasEarcos?'<td>'+fmtRit(r.earcos)+'</td>':'<td>'+r.n+'</td>')+
 (fall?'<td>'+r.aboveUsPct+'%</td><td>'+r.aboveEarcosPct+'%</td>':
 '<td>'+pct(r.aboveUsN,r.n)+' ('+r.aboveUsN+'/'+r.n+')</td><td>'+(r.growthEligible?pct(r.growthMet,r.growthEligible)+' ('+r.growthMet+'/'+r.growthEligible+')':'Not available')+'</td>')+
 '</tr>').join('')+'</tbody></table></div>'+
 '<p class="board-table-note">'+(fall?'Above-reference percentages are the per-grade student figures supplied in the Fall 2025 AISG summary; the underlying Fall counts were not available.':'Spring assessed counts reflect one selected test per learner; spring-to-spring growth uses only matched students with projected growth available.')+'</p></details>';
}
function provenance(window){
 const isFall2025=window==='fall2025',isFall2026=window==='fall2026';
 return '<details class="board-details board-source"><summary>Sources and how to interpret these results <span>+</span></summary>'+
 '<p><strong>Source:</strong> '+safe(BOARD_DATA[window].source)+'</p>'+
 (isFall2026?'':'<p>'+safe(BOARD_METHODS.achievement)+'</p>')+
 '<p>'+safe(isFall2026?BOARD_METHODS.fall2026:(isFall2025?BOARD_METHODS.fall:BOARD_METHODS.spring))+'</p>'+
 (!isFall2026&&!isFall2025?'<p>'+safe(BOARD_METHODS.growth)+'</p>':'')+
 '<p>'+safe(BOARD_METHODS.caution)+'</p></details>';
}
export function renderBoard(state){
 const window=BOARD_DATA[state.boardWindow]?state.boardWindow:'fall2026';
 const subject=['math','reading'].includes(state.boardSubject)?state.boardSubject:'math';
 const div=['all','elementary','secondary'].includes(state.boardDivision)?state.boardDivision:'all';
 const allowed=BOARD_GRADE_LIST.filter(g=>div==='all'||(div==='elementary'?g<=5:g>=6));
 const grade=state.boardGrade==='all'||allowed.includes(Number(state.boardGrade))?state.boardGrade:'all';
 const summary=boardSummary(window,subject,div,grade),rows=summary.rows;
 const isSpring=window==='spring2026',isFall2026=window==='fall2026',subjectName=BOARD_SUBJECTS.find(x=>x.id===subject).label;
 const area=div==='all'?'Grades 3–10':div==='elementary'?'Elementary · Grades 3–5':'Secondary · Grades 6–10';
 const metrics=isFall2026?[
  ['Grades above U.S. mean',summary.aboveUS+' / '+summary.gradeCount,
   'Selected '+subjectName+' grades · directional comparison'],
  ['Scope of available results','Grades 3–10','Grade means reported above U.S. norms; exact scores not supplied']
 ]:isSpring?[
  ['Grades above U.S. mean',summary.aboveUS+' / '+summary.gradeCount,'AISG grade mean RIT exceeds U.S. grade reference'],
  ['Students above U.S. mean',pct(summary.aboveUsN,summary.tested),summary.aboveUsN+' of '+summary.tested+' tested learners'],
  ['Projected growth met',summary.growthPct===null?'—':summary.growthPct+'%',summary.growthPct===null?'No matched spring-to-spring cohort':summary.growthMet+' of '+summary.growthEligible+' matched students'],
  ['Average grade gap vs U.S.',fmtGap(summary.gapUS)+' RIT','Mean of selected grade-level RIT differences']
 ]:[
  ['Grades above U.S. mean',summary.aboveUS+' / '+summary.gradeCount,'AISG mean above U.S. mean in selected grades'],
  ['Grades above EARCOS mean',summary.aboveEarcos+' / '+summary.gradeCount,'AISG mean above EARCOS mean in selected grades'],
  ['Average grade gap vs U.S.',fmtGap(summary.gapUS)+' RIT','Mean of selected grade-level RIT differences'],
  ['Average grade gap vs EARCOS',fmtGap(summary.gapEarcos)+' RIT','Mean of selected grade-level RIT differences']
 ];
 return '<section class="board-view">'+
 '<div class="heading board-heading"><div><div class="eyebrow">AISG · BOARD VIEW · NWEA MAP GROWTH</div>'+
 '<h1>Achievement &amp; growth</h1><p>Mathematics and Reading. Simple, grade-level evidence of achievement against relevant benchmarks, and matched growth where available.</p></div>'+
 '<div class="board-provenance-badge"><strong>ACTUAL AISG AGGREGATES</strong><small>No student records</small></div></div>'+
 '<div class="board-controls"><div class="board-control-group"><span class="board-filter-label">Subject</span>'+
 segmented('subject',BOARD_SUBJECTS,subject)+'</div>'+
 '<div class="board-control-group"><span class="board-filter-label">Assessment window</span>'+
 segmented('window',BOARD_WINDOWS,window)+'</div>'+
 '<div class="board-filter-selects"><label>Division <select data-board-select="division" aria-label="Board MAP division">'+
 option('all','Whole school',div)+option('elementary','Elementary',div)+option('secondary','Secondary',div)+'</select></label>'+
 '<label>Grade <select data-board-select="grade" aria-label="Board MAP grade">'+
 option('all','All grades',grade)+allowed.map(g=>option(String(g),'Grade '+g,grade)).join('')+'</select></label></div></div>'+
 '<div class="board-context"><strong>'+safe(subjectName)+' · '+safe(formatWindow(window))+'</strong><span>'+safe(area)+'</span></div>'+
 '<div class="board-stats">'+metrics.map(m=>indicator(...m)).join('')+'</div>'+
 (isFall2026?'<p class="board-benchmark-note">Fall 2026 results are summary-level only: exact RIT averages, grade-specific growth rates and an EARCOS comparison were not supplied.</p>':
 (!isSpring?'<p class="board-benchmark-note">U.S. and EARCOS benchmarks are from the same Fall 2025 testing window.</p>':
 '<p class="board-benchmark-note">EARCOS Spring 2026 grade norms were not supplied, so no EARCOS comparison is shown for this window. Projected growth refers to matched Spring 2025 → Spring 2026 students.</p>'))+
 (isFall2026?fall2026Status(rows,subjectName)+fall2026SummaryStrip():
 gapChart(rows,summary.hasEarcos)+boardTable(rows,summary.hasEarcos,window))+
 provenance(window)+
 '</section>';
}
