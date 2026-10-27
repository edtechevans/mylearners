/** AISG Board MAP: one readable comparison window with optional side-by-side
 * seasons. Each metric is a real grade-average RIT difference. Missing values
 * remain missing. The UI calls them "MAP score points" for non-specialists.
 */
import {BOARD_DATA,BOARD_SUBJECTS,boardRows,boardWindowFor} from './board-map-data.mjs';
const titles={math:'Mathematics',reading:'Reading',language:'Language Usage'};
const escape=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const icon={
 math:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 8h10M8 12h2m4 0h2M8 16h2m4 0h2"/>',
 reading:'<path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-1 9-1V6c-3-1-6-1-9 1Zm0 0v13"/>',
 language:'<path d="M20 11.5a7 7 0 0 1-7 7H9l-5 3v-5a7 7 0 1 1 16-5Z"/><path d="M8 11h8M8 14h5"/>'
};
const iconSVG=subject=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" aria-hidden="true">'+icon[subject]+'</svg>';
const round1=n=>Math.round((n+Number.EPSILON)*10)/10;
export function compareGradeMeans(window,subject,benchmark,division='all',grade='all'){
 if(!['us','earcos'].includes(benchmark)||!titles[subject]||!BOARD_DATA[window])return null;
 const rows=boardRows(window,subject,division,grade);
 const valid=rows.filter(r=>Number.isFinite(r.aisg)&&Number.isFinite(r[benchmark]));
 const count=valid.length,total=rows.length;
 return {value:count?round1(valid.reduce((sum,r)=>sum+(r.aisg-r[benchmark]),0)/count):null,
  count,total,gradeNums:valid.map(r=>r.grade),complete:count===total&&count>0,subject,benchmark,window};
}
export const gapText=gap=>!gap||gap.value===null?'—':(gap.value>0?'+':'')+gap.value.toFixed(1)+' MAP pts';
export function gapExplanation(result){
 if(!result||!result.count)return 'Not available for this testing window';
 if(result.count===1)return 'Grade '+result.gradeNums[0]+' average difference';
 const base='Average across '+result.count+' grades';
 return result.complete?base:base+' · '+result.count+' of '+result.total+' comparable';
}
function miniCard(result,label){
 const missing=result.value===null;
 return '<div class="board-comparison-mini'+(missing?' unavailable':'')+'">'+
 '<span class="board-comparison-mini-label">'+label+'</span>'+
 '<strong class="board-comparison-mini-value">'+gapText(result)+'</strong>'+
 '<span class="board-comparison-mini-detail">'+escape(gapExplanation(result))+'</span></div>';
}
function windowTiles(window,selectedWindow,selectedSubject,division){
 const period=BOARD_DATA[window].label;
 return '<section class="board-comparison-window" aria-label="'+escape(period)+' subject comparisons">'+
 '<div class="board-comparison-window-head"><span class="board-window-icon" aria-hidden="true">'+
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7 2v6m10-6v6M4 11h16"/></svg></span>'+
 '<div><h3>'+escape(period)+'</h3><p>Choose a subject to explore how individual grades compare</p></div></div>'+
 '<div class="board-comparison-subjects">'+BOARD_SUBJECTS.map(({id})=>{
  const us=compareGradeMeans(window,id,'us',division);
  const earcos=compareGradeMeans(window,id,'earcos',division);
  const active=window===selectedWindow&&selectedSubject===id;
  return '<button class="board-comparison-subject board-comparison-'+id+(active?' is-selected':'')+
   '" type="button" data-board-tile-window="'+window+'" data-board-tile-subject="'+id+
   '" aria-pressed="'+active+'" title="Explore grades in '+escape(titles[id])+' · '+escape(period)+'"'+
   ' aria-label="'+escape('Explore '+titles[id]+' in '+period+'. Average difference versus U.S. schools '+gapText(us)+
   '; versus EARCOS regional schools '+gapText(earcos))+'.">'+
   '<span class="board-comparison-subject-head"><span class="board-comparison-icon">'+iconSVG(id)+
   '</span><strong>'+escape(titles[id])+'</strong><span class="board-tile-action" aria-hidden="true">↗</span></span>'+
   '<span class="board-comparison-pair">'+miniCard(us,'vs U.S. schools')+
   miniCard(earcos,'vs regional schools (EARCOS)')+'</span>'+
   '<span class="board-tile-hint">Explore grades <span aria-hidden="true">›</span></span></button>';
 }).join('')+'</div></section>';
}
export function renderMapComparisonTiles({schoolYear,selectedWindow,selectedSubject='math',division='all',compareSeasons=false}={}){
 const year=Number(schoolYear);
 if(!Number.isInteger(year)||year<2000||year>2100)return '';
 const seasons=['fall','spring'].map(season=>boardWindowFor(year,season)).filter(Boolean);
 const validWindow=seasons.includes(selectedWindow)?selectedWindow:seasons[0];
 const windows=compareSeasons&&seasons.length>1?seasons:validWindow?[validWindow]:[];
 const area=division==='elementary'?'Elementary · Grades 3–5':division==='secondary'?'Secondary · Grades 6–10':'Grades 3–10';
 return '<section class="board-comparison-display" aria-label="MAP achievement comparison tiles">'+
 '<div class="board-comparison-intro"><div><span class="eyebrow">MAP ACHIEVEMENT</span>'+
 '<h2>How does AISG compare?</h2>'+
 '<p>'+escape(area)+' · Average MAP score-point difference from U.S. and regional schools</p></div>'+
 (seasons.length>1?'<button type="button" class="board-compare-toggle" data-board-compare-seasons aria-pressed="'+!!compareSeasons+'">'+
 (compareSeasons?'Show one testing window':'Compare Fall & Spring')+'</button>':'')+'</div>'+
 windows.map(w=>windowTiles(w,validWindow,selectedSubject,division)).join('')+
 '<details class="board-details board-understanding"><summary>What do these numbers mean? <span>+</span></summary>'+
 '<p>Each grade has an AISG average MAP score. We compare it with the corresponding average for U.S. schools and EARCOS regional schools, then average the available grade differences equally. MAP score points are also called RIT points.</p>'+
 '<p>A positive difference means the AISG grade average is higher; it does not mean every student is ahead. Small differences may not be meaningful. A dash (—) means comparison data is unavailable, not zero.</p>'+
 '<p>Older U.S. comparisons may use different norm editions, so historical gaps should not be assumed to be directly equivalent.</p></details>'+
 '</section>';
}
