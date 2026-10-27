/** Native, responsive Board MAP comparison tiles.
 * Calculations use actual grade-mean RIT differences. Each displayed number
 * is the unweighted mean across the stated comparable grades. Partial
 * coverage is labelled; missing references never become zero.
 */
import {BOARD_DATA,BOARD_SUBJECTS,BOARD_GRADE_LIST,boardRows,boardWindowFor} from './board-map-data.mjs';

const titles={math:'Mathematics',reading:'Reading',language:'Language Usage'};
const escape=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const icon={
 math:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 8h10M8 12h2m4 0h2M8 16h2m4 0h2"/>',
 reading:'<path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1Zm0 0v13"/>',
 language:'<path d="M20 11.5a7 7 0 0 1-7 7H9l-5 3v-5a7 7 0 1 1 16-5Z"/><path d="M8 11h8M8 14h5"/>'
};
const iconSVG=subject=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" aria-hidden="true">'+icon[subject]+'</svg>';
const round1=n=>Math.round((n+Number.EPSILON)*10)/10;
export function compareGradeMeans(window,subject,benchmark,division='all',grade='all'){
 if(!['us','earcos'].includes(benchmark)||!titles[subject]||!BOARD_DATA[window])return null;
 const rows=boardRows(window,subject,division,grade);
 const valid=rows.filter(r=>Number.isFinite(r.aisg)&&Number.isFinite(r[benchmark]));
 const gradeNums=valid.map(r=>r.grade);
 const count=valid.length,total=rows.length;
 const value=count?round1(valid.reduce((total,r)=>total+(r.aisg-r[benchmark]),0)/count):null;
 return {value,count,total,gradeNums,complete:count===total&&count>0,
  subject,benchmark,window};
}
export const gapText=gap=>!gap||gap.value===null?'—':
 (gap.value>0?'+':'')+gap.value.toFixed(1)+' RIT';
export function gapExplanation(result,selectedGrade='all'){
 if(!result||result.count===0)return 'Comparison not available for this window';
 if(result.count===1)return 'Grade '+result.gradeNums[0]+' mean difference';
 const base='Unweighted mean of '+result.count+' grade-level gaps';
 return result.complete?base:base+' · partial ('+result.count+' of '+result.total+')';
}
function miniCard(result,label,grade){
 const unavailable=result.value===null;
 const description=gapExplanation(result,grade);
 return '<div class="board-comparison-mini'+(unavailable?' unavailable':'')+'">'+
 '<div class="board-comparison-mini-label">'+label+'</div>'+
 '<strong class="board-comparison-mini-value">'+gapText(result)+'</strong>'+
 '<span class="board-comparison-mini-detail">'+escape(description)+'</span></div>';
}
export function renderMapComparisonTiles({schoolYear,selectedWindow,selectedSubject='math',division='all',grade='all'}={}){
 const year=Number(schoolYear);
 if(!Number.isInteger(year)||year<2000||year>2100)return '';
 const seasons=['fall','spring'].map(season=>boardWindowFor(year,season)).filter(Boolean);
 const gradeLabel=grade!=='all'?'Grade '+grade:division==='elementary'?'Elementary · G3–5':
  division==='secondary'?'Secondary · G6–10':'All tested grades · G3–10';
 const years=year+'–'+String((year+1)%100).padStart(2,'0');
 const content=seasons.map(window=>{
  const period=BOARD_DATA[window].label;
  return '<section class="board-comparison-window" aria-label="'+escape(period)+' subject comparisons">'+
   '<div class="board-comparison-window-head"><div><span class="board-window-icon" aria-hidden="true">'+
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7 2v6m10-6v6M4 11h16"/></svg></span></div>'+
   '<div><h3>'+escape(period)+'</h3>'+
   '<p>AISG grade-average RIT differences compared with U.S. and EARCOS means</p></div>'+
   (window===selectedWindow?'<span class="board-window-current">Selected window</span>':'')+'</div>'+
   '<div class="board-comparison-subjects">'+BOARD_SUBJECTS.map(s=>{
    const subject=s.id;
    const us=compareGradeMeans(window,subject,'us',division,grade);
    const earcos=compareGradeMeans(window,subject,'earcos',division,grade);
    const active=window===selectedWindow&&selectedSubject===subject;
    return '<button class="board-comparison-subject board-comparison-'+subject+(active?' is-selected':'')+
     '" type="button" data-board-tile-window="'+window+'" data-board-tile-subject="'+subject+
     '" aria-pressed="'+(active?'true':'false')+'" aria-label="'+escape('Explore '+titles[subject]+', '+period+
     ', '+gradeLabel+'. Gap versus U.S. '+gapText(us)+'. Gap versus EARCOS '+gapText(earcos))+'">'+
     '<div class="board-comparison-subject-head">'+
     '<span class="board-comparison-icon">'+iconSVG(subject)+'</span>'+
     '<strong>'+escape(titles[subject])+'</strong>'+
     '<span class="board-tile-action" aria-hidden="true">↗</span></div>'+
     '<div class="board-comparison-pair">'+
     miniCard(us,'Avg grade gap vs U.S.',grade)+
     miniCard(earcos,'Avg grade gap vs EARCOS',grade)+'</div>'+
     '</button>';
   }).join('')+'</div></section>';
 }).join('');
 return '<section class="board-comparison-display" aria-label="MAP benchmark comparison tiles">'+
  '<div class="board-comparison-intro"><div><span class="eyebrow">MAP · ACHIEVEMENT COMPARISONS</span>'+
  '<h2>MAP comparison tiles</h2>'+
  '<p>'+escape(years)+' · '+escape(gradeLabel)+' · Choose a subject to explore its grades</p></div>'+
  '<span class="board-comparison-basis">Unweighted grade-level RIT differences</span></div>'+
  (content||'<p>No testing windows are available for this school year.</p>')+
  '<p class="board-comparison-footnote">A positive gap means the AISG grade mean is higher than the comparison mean; it does not mean every student is above that benchmark. A dash (—) means unavailable, never zero. Historical U.S. norm editions may differ.</p>'+
  '</section>';
}
