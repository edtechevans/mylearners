/**
 * Historical Board overview: an accessible story, not a second reporting system.
 * Trends count G3–G10 grade means above season-matched EARCOS grade means.
 * They are schoolwide achievement snapshots, NEVER individual student growth.
 *
 * Stand-alone presentation logic; receives the same read-only state used by
 * the existing Board Explore by Year interface.
 */
import {BOARD_DATA,boardSummary,BOARD_METHODS} from './board-map-data.mjs';

const color={math:'#176c94',reading:'#a65d29'};
const yearsBySeason=Object.freeze({
 fall:Array.from({length:13},(_,i)=>2014+i),
 spring:Array.from({length:12},(_,i)=>2015+i)
});
function windowFor(season,year){return season+year}
function yearResult(season,year,subject){
 const window=windowFor(season,year),record=BOARD_DATA[window];
 if(!record)return null;
 const r=boardSummary(window,subject);
 return r.gradeCount===8&&r.earcosAvailable===8?r.aboveEarcos:null;
}
export function historicalTrend(season='fall'){
 const term=season==='spring'?'spring':'fall';
 return yearsBySeason[term].map(year=>({
  year,
  math:yearResult(term,year,'math'),
  reading:yearResult(term,year,'reading')
 }));
}
const visible=v=>Number.isInteger(v)?String(v):'—';
const pathSegments=(data,key,point)=>{
 const lines=[];let current=[];
 for(let i=0;i<data.length;i++){
  const value=data[i][key];
  if(!Number.isInteger(value)){
   if(current.length){lines.push(current);current=[]}
   continue;
  }
  current.push(point(data[i],value));
 }
 if(current.length)lines.push(current);
 return lines.map(segment=>segment.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+','+y.toFixed(1)).join(' '));
};
function chartSvg(data,selected){
 const width=980,height=326,left=55,right=34,top=43,bottom=258;
 const xStep=(width-left-right)/Math.max(1,data.length-1);
 const point=(i,n)=>[left+xStep*i,bottom-(n/8)*(bottom-top)];
 const selectedKeys=selected==='math'||selected==='reading'?[selected]:['math','reading'];
 const horizontal=[0,2,4,6,8].map(y=>{
  const yPx=point(0,y)[1].toFixed(1);
  return '<line x1="'+left+'" y1="'+yPx+'" x2="'+(width-right)+'" y2="'+yPx+
   '" class="board-trend-grid"/><text x="'+(left-16)+'" y="'+(Number(yPx)+4)+
   '" class="board-trend-tick" text-anchor="end">'+y+'</text>';
 }).join('');
 const ticks=data.map((r,i)=>{
  const x=point(i,0)[0];
  return '<text x="'+x.toFixed(1)+'" y="293" text-anchor="middle" class="board-trend-year">'+r.year+'</text>';
 }).join('');
 const series=selectedKeys.map(key=>{
  const paths=pathSegments(data.map((x,i)=>({...x,i})),key,(r,v)=>point(r.i,v))
    .map(d=>'<path d="'+d+'" fill="none" stroke="'+color[key]+'" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const circles=data.map((r,i)=>{
   const v=r[key];if(!Number.isInteger(v))return '';
   const [x,y]=point(i,v);
   const yLabel=y+(key==='math'?-15:20);
   const label=key==='math'?'Mathematics':'Reading';
   return '<g><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+
    '" r="5.8" fill="'+color[key]+'" stroke="white" stroke-width="2.3">'+
    '<title>'+label+', '+r.year+': '+v+' of 8 grade averages above EARCOS</title></circle>'+
    '<text x="'+x.toFixed(1)+'" y="'+yLabel.toFixed(1)+
    '" text-anchor="middle" class="board-trend-value" fill="'+color[key]+'">'+v+'</text></g>';
  }).join('');
  return '<g class="board-trend-series" data-board-series="'+key+'">'+paths+circles+'</g>';
 }).join('');
 return '<svg class="board-trend-svg" viewBox="0 0 '+width+' '+height+'" role="img" '+
 'aria-label="Number of AISG Grades 3 to 10 above EARCOS grade averages across '+data.length+
 ' historical '+(data[0]?.year||'')+' to '+(data.at(-1)?.year||'')+' '+(selected==='both'?'Mathematics and Reading':selected)+' '+(data.length?'assessment windows':'')+'." '+
 'xmlns="http://www.w3.org/2000/svg">'+
 '<text x="'+left+'" y="19" class="board-trend-axislabel">Grades above EARCOS / 8</text>'+
 horizontal+series+ticks+
 '<text x="'+(width-right)+'" y="317" text-anchor="end" class="board-trend-year">Assessment year</text></svg>';
}
const tabButton=(name,label,current,attr)=>
 '<button type="button" '+attr+'="'+name+'" aria-pressed="'+(name===current?'true':'false')+
 '" class="'+(name===current?'active':'')+'">'+label+'</button>';

function trendStats(data,key){
 const valid=data.map(r=>r[key]).filter(Number.isInteger);
 return valid.length?{min:Math.min(...valid),max:Math.max(...valid),n:valid.length}:null;
}
function chartSummary(data,season){
 const math=trendStats(data,'math'),reading=trendStats(data,'reading');
 return '<p class="board-overview-insight"><strong>What this tells us:</strong> '+
 (math&&reading?'Across comparable '+(season==='fall'?'Fall':'Spring')+' windows, Mathematics was above the EARCOS grade mean in '+
 math.min+'–'+math.max+' of eight grades; Reading ranged from '+reading.min+'–'+reading.max+'. ':
 'Some periods lack complete comparable benchmarks. ')+
 'These are repeated grade-level achievement snapshots, <strong>not</strong> growth for the same students.</p>';
}
function chartTable(data,season){
 return '<details class="board-details board-overview-table"><summary>View the annual values <span>+</span></summary>'+
 '<div class="tablewrap"><table class="board-table"><thead><tr><th>Assessment window</th>'+
 '<th>Mathematics · grades above EARCOS</th><th>Reading · grades above EARCOS</th></tr></thead><tbody>'+
 data.map(row=>'<tr><td>'+ (season==='fall'?'Fall ':'Spring ')+row.year+'</td><td>'+
 visible(row.math)+'</td><td>'+visible(row.reading)+'</td></tr>').join('')+
 '</tbody></table></div><p class="board-table-note">— means that this window lacks a complete set of eight comparable grade results. Numbers refer to grade means, not student percentages.</p></details>';
}
const bigCard=(eyebrow,window,value,note,action,buttonLabel)=>
 '<button type="button" class="board-overview-card" data-board-go="'+action+'" aria-label="'+buttonLabel+'">'+
 '<span class="eyebrow">'+eyebrow+'</span><strong>'+value+'</strong>'+
 '<span class="board-overview-card-note">'+note+'</span><span class="board-overview-card-link">Explore results <span aria-hidden="true">›</span></span>'+
 '</button>';

export function renderBoardOverview(state){
 const season=state.boardTrendTerm==='spring'?'spring':'fall';
 const focus=['both','math','reading'].includes(state.boardTrendFocus)?state.boardTrendFocus:'both';
 const data=historicalTrend(season);
 const selectedKeys=focus==='both'?['math','reading']:[focus];
 const nWindows=data.filter(r=>selectedKeys.every(k=>r[k]!==null)).length;
 const mostRecent=season==='fall'?'Fall 2025':'Spring 2026';
 return '<div class="board-overview">'+
 '<div class="board-overview-intro"><div><span class="eyebrow">THE BIG PICTURE</span>'+
 '<h2>How are our learners doing over time?</h2>'+
 '<p>Start with the latest evidence, then explore how AISG compares across grades and years.</p></div>'+
 '<span class="board-overview-source">MAP · Grades 3–10 · Aggregated results</span></div>'+
 '<div class="board-overview-cards">'+
 bigCard('Latest achievement · Fall 2026','Fall 2026','24 / 24',
 'Grade-subject means above U.S. norms across Mathematics, Reading and Language Usage.','fall2026:math',
 'Explore Fall 2026 Mathematics')+
 bigCard('Latest regional comparison · Spring 2026','Spring 2026','6 / 8 · 3 / 8',
 'Math and Reading grade means above EARCOS, respectively.','spring2026:math',
 'Explore Spring 2026 Mathematics compared with EARCOS')+
 bigCard('Matched projected growth · Spring 2026','Spring 2026','71% · 62%',
 'Students meeting their Math and Reading projected growth, respectively, among matched eligible learners.','spring2026:reading',
 'Explore Spring 2026 Reading matched growth')+'</div>'+
 '<section class="board-panel board-historical-chart" aria-labelledby="board-trend-heading">'+
 '<div class="board-overview-charthead"><div><span class="eyebrow">HISTORICAL COMPARISON</span>'+
 '<h2 id="board-trend-heading">Our position relative to EARCOS</h2>'+
 '<p>Number of AISG grade averages above the EARCOS mean · Grades 3–10</p></div>'+
 '<div class="board-overview-filterarea"><div class="board-overview-control"><span>Window</span>'+
 '<div class="board-segmented">'+
 tabButton('fall','Fall',season,'data-board-trend')+
 tabButton('spring','Spring',season,'data-board-trend')+'</div></div>'+
 '<div class="board-overview-control"><span>Show</span>'+
 '<div class="board-segmented">'+tabButton('both','Both',focus,'data-board-focus')+
 tabButton('math','Math',focus,'data-board-focus')+
 tabButton('reading','Reading',focus,'data-board-focus')+'</div></div></div></div>'+
 '<div class="board-overview-chartmeta"><span class="board-trend-series-legend">'+
 (selectedKeys.includes('math')?'<span><i class="board-dot math"></i> Mathematics</span>':'')+
 (selectedKeys.includes('reading')?'<span><i class="board-dot reading"></i> Reading</span>':'')+
 '</span><span>'+nWindows+' complete '+(season==='fall'?'Fall':'Spring')+
 ' comparison windows · latest '+mostRecent+'</span></div>'+
 '<p class="board-mobile-swipe">Swipe the chart horizontally to see all years.</p>'+
 '<div class="board-trend-scroller" tabindex="0" aria-label="Scroll horizontally to inspect historical comparison chart">'+
 chartSvg(data,focus)+'</div>'+
 chartSummary(data,season)+
 chartTable(data,season)+
 '</section>'+
 '<div class="board-overview-next"><div><strong>Want to investigate a particular result?</strong>'+
 '<p>Explore one subject, year, division or grade, with exact RIT means where available.</p></div>'+
 '<button class="board-action-primary" type="button" data-board-view="explore">Explore by Year <span aria-hidden="true">›</span></button></div>'+
 '<p class="board-overview-method">Reading the trends: a point shows how many grade averages exceeded EARCOS in that assessment window. This is not the percentage of students above EARCOS and not individual student growth. Different cohorts and norm editions limit comparisons over long periods. Missing EARCOS windows are not plotted as zero. '+BOARD_METHODS.missing+'</p>'+
 '</div>';
}
