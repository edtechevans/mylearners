/**
 * AISG Board historic Overview. Trends count G3–G10 grade means above
 * same-season EARCOS means; they are group snapshots, NOT student growth.
 * Board-only module. No student identifiers.
 */
import {BOARD_DATA,BOARD_SUBJECTS,boardSummary,BOARD_METHODS} from './board-map-data.mjs';
const SUBJECT_KEYS=['math','reading','language'];
const NAME={math:'Mathematics',reading:'Reading',language:'Language Usage'};
const COLOR={math:'#176c94',reading:'#a65d29',language:'#7755a4'};
const yearsBySeason=Object.freeze({
 fall:Array.from({length:13},(_,i)=>2014+i),
 spring:Array.from({length:12},(_,i)=>2015+i)
});
const code=(season,year)=>season+year;
const safe=(x)=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export function gradeBreakdown(season,year,subject){
 if(!['fall','spring'].includes(season)||!SUBJECT_KEYS.includes(subject))return null;
 const window=code(season,Number(year));
 const rows=BOARD_DATA[window]?.subjects?.[subject];
 if(!rows)return null;
 const all=rows.map(r=>{
  const compared=Number.isFinite(r.aisg)&&Number.isFinite(r.earcos);
  return {grade:r.grade,status:compared?(r.aisg>r.earcos?'above':'below'):'unavailable',
   difference:compared?Math.round((r.aisg-r.earcos)*10)/10:null};
 });
 const compared=all.filter(r=>r.status!=='unavailable').length;
 return {year:Number(year),season,subject,label:(season==='fall'?'Fall ':'Spring ')+year,
  above:all.filter(r=>r.status==='above').map(r=>r.grade),
  notAbove:all.filter(r=>r.status==='below').map(r=>r.grade),
  missing:all.filter(r=>r.status==='unavailable').map(r=>r.grade),
  grades:all,compared,complete:compared===8};
}
function yearValue(season,year,subject){
 const result=gradeBreakdown(season,year,subject);
 return result?.complete?result.above.length:null;
}
export function historicalTrend(season='fall'){
 const term=season==='spring'?'spring':'fall';
 return yearsBySeason[term].map(year=>({
  year,math:yearValue(term,year,'math'),
  reading:yearValue(term,year,'reading'),
  language:yearValue(term,year,'language')
 }));
}
const visible=v=>Number.isInteger(v)?String(v):'—';
const pathSegments=(data,key,point)=>{
 const lines=[];let current=[];
 for(let i=0;i<data.length;i++){
  const value=data[i][key];
  if(!Number.isInteger(value)){if(current.length){lines.push(current);current=[]}continue}
  current.push(point(data[i],value));
 }
 if(current.length)lines.push(current);
 return lines.map(segment=>segment.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+','+y.toFixed(1)).join(' '));
};
function chartSvg(data,selected,season){
 const width=980,height=326,left=55,right=34,top=43,bottom=258;
 const xStep=(width-left-right)/Math.max(1,data.length-1);
 const point=(i,n)=>[left+xStep*i,bottom-(n/8)*(bottom-top)];
 const offset={math:-20,reading:0,language:20}; // separate coincident series
 const seriesKeys=SUBJECT_KEYS.includes(selected)?[selected]:SUBJECT_KEYS;
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
 const series=seriesKeys.map(key=>{
  const paths=pathSegments(data.map((x,i)=>({...x,i})),key,(r,v)=>{
   const [x,y]=point(r.i,v);return [x+offset[key],y];
  })
   .map(d=>'<path d="'+d+'" fill="none" stroke="'+COLOR[key]+
    '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const markers=data.map((r,i)=>{
   const v=r[key];if(!Number.isInteger(v))return '';
   const info=gradeBreakdown(season,r.year,key);
   const [rawX,y]=point(i,v),x=rawX+offset[key],label=NAME[key], above=info.above.map(g=>'G'+g).join(', ')||'none';
   const notAbove=info.notAbove.map(g=>'G'+g).join(', ')||'none';
   const description=label+', '+info.label+': '+v+' of 8 grade averages above EARCOS. '+
    'Above: '+above+'. Not above: '+notAbove+'. Hover, focus or select for grades.';
   const labelText=selected==='all'?'':'<text x="'+x.toFixed(1)+'" y="'+(y+(key==='math'?-16:18)).toFixed(1)+
    '" text-anchor="middle" class="board-trend-value" fill="'+COLOR[key]+'">'+v+'</text>';
   return '<g class="board-trend-point" role="button" tabindex="0" focusable="true"'+
    ' data-board-point="'+season+':'+r.year+':'+key+'" aria-label="'+safe(description)+'">'+
    '<circle class="board-point-hit" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="14" fill="transparent"/>'+
    '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="7.6" fill="'+COLOR[key]+
    '" stroke="white" stroke-width="2.4"><title>'+safe(description)+'</title></circle>'+
    labelText+'</g>';
  }).join('');
  return '<g class="board-trend-series" data-board-series="'+key+'">'+paths+markers+'</g>';
 }).join('');
 const labels=selected==='all'?'Mathematics, Reading and Language Usage':NAME[selected];
 return '<svg class="board-trend-svg" viewBox="0 0 '+width+' '+height+'" role="group"'+
 ' aria-label="Grades 3 to 10 above EARCOS averages across '+season+' testing windows for '+labels+
 '. Hover or focus data points to show grade-level details." xmlns="http://www.w3.org/2000/svg">'+
 '<text x="'+left+'" y="19" class="board-trend-axislabel">Grades above EARCOS / 8</text>'+
 horizontal+series+ticks+
 '<text x="'+(width-right)+'" y="317" text-anchor="end" class="board-trend-year">Assessment year</text></svg>';
}
const tabButton=(name,label,current,attr)=>
 '<button type="button" '+attr+'="'+name+'" aria-pressed="'+(name===current?'true':'false')+
 '" class="'+(name===current?'active':'')+'">'+safe(label)+'</button>';
function trendStats(data,key){
 const valid=data.map(r=>r[key]).filter(Number.isInteger);
 return valid.length?{min:Math.min(...valid),max:Math.max(...valid),n:valid.length}:null;
}
function chartSummary(data,season,keys){
 const ranges=keys.map(k=>{const s=trendStats(data,k);return s?NAME[k]+' '+s.min+'–'+s.max:' '+NAME[k]+' unavailable'}).join('; ');
 return '<p class="board-overview-insight"><strong>What this tells us:</strong> Mathematics has generally been strong relative to EARCOS; Reading and Language Usage vary more. Across comparable '+
 (season==='fall'?'Fall':'Spring')+' windows, grades above EARCOS ranged from '+safe(ranges)+'. '+
 '<strong>Inquiry:</strong> Which grades show recurring differences, and what other evidence would help explain them? These are achievement snapshots, not individual student growth.</p>';
}
function chartTable(data,season){
 return '<details class="board-details board-overview-table"><summary>View the annual values <span>+</span></summary>'+
 '<div class="tablewrap"><table class="board-table"><thead><tr><th>Assessment window</th>'+
 SUBJECT_KEYS.map(key=>'<th>'+safe(NAME[key])+' · grades above EARCOS</th>').join('')+
 '</tr></thead><tbody>'+
 data.map(row=>'<tr><td>'+(season==='fall'?'Fall ':'Spring ')+row.year+'</td>'+
 SUBJECT_KEYS.map(key=>'<td>'+visible(row[key])+'</td>').join('')+'</tr>').join('')+
 '</tbody></table></div><p class="board-table-note">— means the window lacks all eight comparable grade results. A count is not a percentage of students. Hover or focus chart points to see exactly which grades are included.</p></details>';
}
const subjectChips=values=>
 '<div class="board-overview-three-metrics">'+
 SUBJECT_KEYS.map(key=>'<span class="board-overview-subject"><small>'+NAME[key]+'</small><strong>'+values[key]+'</strong></span>').join('')+
 '</div>';
const bigCard=(eyebrow,topline,values,note,action,buttonLabel)=>
 '<button type="button" class="board-overview-card" data-board-go="'+action+'" aria-label="'+buttonLabel+'">'+
 '<span class="eyebrow">'+eyebrow+'</span><strong class="board-card-headline">'+topline+'</strong>'+
 subjectChips(values)+
 '<span class="board-overview-card-note">'+note+'</span>'+
 '<span class="board-overview-card-link">Explore results <span aria-hidden="true">›</span></span></button>';

export function renderTrendPointDetails(pointKey){
 const m=/^(fall|spring):(\d{4}):(math|reading|language)$/.exec(String(pointKey||''));
 if(!m)return '<p>Choose a historical data point to see the grades included.</p>';
 const info=gradeBreakdown(m[1],Number(m[2]),m[3]);
 if(!info||!info.complete)return '<p>No complete EARCOS grade-level comparison is available for this selection.</p>';
 const title=NAME[info.subject]+' · '+info.label;
 return '<div class="board-trend-inspector-head"><div><span class="eyebrow">GRADES INCLUDED IN THIS POINT</span>'+
 '<h3>'+safe(title)+'</h3><p>'+info.above.length+' of '+info.compared+
 ' grade averages above EARCOS · G3–G10</p></div>'+
 '<strong>'+info.above.length+' / '+info.compared+'</strong></div>'+
 '<div class="board-trend-grade-chips">'+info.grades.map(item=>
 '<span class="board-trend-grade '+(item.status==='above'?'is-above':item.status==='below'?'is-below':'is-missing')+
 '" aria-label="Grade '+item.grade+(item.status==='above'?' above EARCOS':item.status==='below'?' not above EARCOS':' unavailable')+
 '"><b>G'+item.grade+'</b><small>'+(item.status==='above'?'Above':item.status==='below'?'Not above':'—')+'</small>'+
 (item.difference===null?'':'<em>'+(item.difference>0?'+':'')+item.difference.toFixed(1)+' RIT</em>')+'</span>').join('')+
 '</div><p class="board-trend-inspector-note">Signed differences are AISG mean minus EARCOS mean. Small margins alone do not prove a meaningful difference; these are averages, not individual student results.</p>';
}
export function renderBoardOverview(state){
 const season=state.boardTrendTerm==='spring'?'spring':'fall';
 const rawFocus=state.boardTrendFocus==='both'?'all':state.boardTrendFocus;
 const focus=['all',...SUBJECT_KEYS].includes(rawFocus)?rawFocus:'all';
 const data=historicalTrend(season);
 const selectedKeys=focus==='all'?SUBJECT_KEYS:[focus];
 const nWindows=data.filter(r=>selectedKeys.every(k=>r[k]!==null)).length;
 const mostRecent=season==='fall'?'Fall 2025':'Spring 2026';
 return '<div class="board-overview">'+
 '<div class="board-overview-intro"><div><span class="eyebrow">THE BIG PICTURE</span>'+
 '<h2>How are our learners doing over time?</h2>'+
 '<p>Start with the latest evidence, then explore how AISG compares across grades and years.</p></div>'+
 '<span class="board-overview-source">MAP · Grades 3–10 · Aggregated results</span></div>'+
 '<div class="board-overview-cards">'+
 bigCard('Achievement · Fall 2026','24 / 24', {math:'8 / 8',reading:'8 / 8',language:'8 / 8'},
 'Grade averages above the NWEA U.S. school norm. Exact AISG and U.S. RIT means are now available.','fall2026:math',
 'Explore Fall 2026 Mathematics against U.S. school norms')+
 bigCard('Regional comparison · Spring 2026','EARCOS',{math:'6 / 8',reading:'3 / 8',language:'3 / 8'},
 'Grades whose averages exceeded their EARCOS comparison mean.','spring2026:math',
 'Explore Spring 2026 Mathematics compared with EARCOS')+
 bigCard('Matched growth · Spring 2026','Projected growth',{math:'71%',reading:'62%',language:'—'},
 'Math and Reading: matched students meeting projected growth. Language Usage data not supplied.','spring2026:reading',
 'Explore Spring 2026 Reading matched projected growth')+'</div>'+
 '<section class="board-panel board-historical-chart" aria-labelledby="board-trend-heading">'+
 '<div class="board-overview-charthead"><div><span class="eyebrow">HISTORICAL COMPARISON</span>'+
 '<h2 id="board-trend-heading">Our position relative to EARCOS</h2>'+
 '<p>Number of AISG grade averages above the EARCOS mean · Grades 3–10</p></div>'+
 '<div class="board-overview-filterarea"><div class="board-overview-control"><span>Window</span>'+
 '<div class="board-segmented">'+tabButton('fall','Fall',season,'data-board-trend')+
 tabButton('spring','Spring',season,'data-board-trend')+'</div></div>'+
 '<div class="board-overview-control"><span>Show</span>'+
 '<div class="board-segmented">'+tabButton('all','All three',focus,'data-board-focus')+
 tabButton('math','Math',focus,'data-board-focus')+
 tabButton('reading','Reading',focus,'data-board-focus')+
 tabButton('language','Language',focus,'data-board-focus')+'</div></div></div></div>'+
 '<div class="board-overview-chartmeta"><span class="board-trend-series-legend">'+
 selectedKeys.map(key=>'<span><i class="board-dot '+key+'"></i> '+NAME[key]+'</span>').join('')+
 '</span><span>'+nWindows+' fully comparable '+(season==='fall'?'Fall':'Spring')+
 ' windows · latest '+mostRecent+'</span></div>'+
 '<p class="board-mobile-swipe">Swipe for earlier years; tap a point for grade-by-grade RIT differences.</p>'+
 '<div class="board-trend-scroller" tabindex="0" aria-label="Scroll horizontally to inspect historical comparison chart">'+
 chartSvg(data,focus,season)+'</div>'+
 '<div class="board-floating-tooltip" role="tooltip" hidden></div>'+
 '<section class="board-trend-inspector" aria-live="polite" aria-atomic="true"><p><strong>Explore the grade differences.</strong> Hover to open a tile by your pointer, or select a point to keep the grade details visible below.</p></section>'+
 chartSummary(data,season,selectedKeys)+chartTable(data,season)+
 '</section>'+
 '<section class="board-dp-preview"><div><span class="eyebrow">BEYOND MAP · GRADUATION OUTCOMES</span>'+
 '<h3>IB Diploma results are now available</h3>'+
 '<p>Explore reported average Diploma points and pass rates over seven school years, separately from MAP.</p></div>'+
 '<button type="button" data-board-view="dp" class="board-action-primary">Explore IB Diploma ›</button></section>'+
 '<div class="board-overview-next"><div><strong>Want to investigate a particular result?</strong>'+
 '<p>Explore one subject, year, division or grade, with exact RIT means where available.</p></div>'+
 '<button class="board-action-primary" type="button" data-board-view="explore">Explore by Year <span aria-hidden="true">›</span></button></div>'+
 '<p class="board-overview-method">Reading the trends: points count grade averages that exceeded EARCOS; they are not the percentage of students above the benchmark and not individual student growth. Norm editions and cohorts can differ. Missing EARCOS windows are not treated as zero. '+BOARD_METHODS.missing+'</p>'+
 '</div>';
}
