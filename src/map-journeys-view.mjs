/** MAP Journeys presentation. SVG and all lists are deterministic, local and
 * read-only; learner IDs come only from the currently authorised caller scope.
 */
import {MAP_RIT_BANDS,MAP_RIT_SUBJECTS,mapRitDisplaySubject} from './map-rit-achievement.mjs';
import {JOURNEY_FALL_WINDOWS,JOURNEY_START_BANDS,JOURNEY_END_BANDS,
 JOURNEY_PALETTE,mapJourneyCohort,journeyStudentHistory} from './map-journeys-data.mjs';
import {renderStudentPhoto} from './student-photo-preview.mjs';
import {esc} from './v2-ui.mjs';
const safe=x=>esc(String(x??''));
const bandName=key=>MAP_RIT_BANDS.find(b=>b.key===key)?.label||'Unavailable';
const bandColour=key=>JOURNEY_PALETTE[key]||'#728494';
const labelStart=key=>({
 both:'Low or Low Average',low:'Low', 'low-average':'Low Average',
 average:'Average','high-average':'High Average',high:'High',all:'All bands'
}[key]||'Low or Low Average');
const labelEnd=key=>({
 'average-plus':'Average or higher',average:'Average',high:'High',
 'high-average':'High Average',low:'Low','low-average':'Low Average',
 all:'All bands'
}[key]||'Average or higher');
const choices=(name,options,value)=>'<label>'+safe(name)+
 '<select data-map-journey-'+name.toLowerCase().replaceAll(' ','-')+' aria-label="'+safe(name)+'">'+
 options.map(([k,v])=>'<option value="'+safe(k)+'"'+(k===value?' selected':'')+'>'+safe(v)+'</option>').join('')+
 '</select></label>';
const bandMark=(entry,term)=>'<span class="map-journey-score '+safe(entry.band)+'">'+
 '<small>'+safe(term)+' · '+safe(entry.grade||'Grade not recorded')+'</small>'+
 '<strong>P'+entry.percentile+'</strong>'+
 '<span>'+safe(entry.bandLabel)+' · '+entry.rit+' RIT</span></span>';
const pct=(n,total)=>total?Math.round(n/total*100):0;
export function renderMapJourneyCohort({
 students,map,subject='Reading',start='F22',end='F26',startingBand='both',
 endingBand='average-plus',pathway='cross',expanded=false
}={}){
 const m=mapJourneyCohort({students,map,subject,start,end,startingBand,endingBand,pathway});
 if(!m.eligible)return '';
 const first=JOURNEY_FALL_WINDOWS.find(w=>w.key===m.start);
 const last=JOURNEY_FALL_WINDOWS.find(w=>w.key===m.end);
 const windowOptions=JOURNEY_FALL_WINDOWS.map(w=>[w.key,w.label]);
 const bandOptions=JOURNEY_START_BANDS.map(k=>[k,labelStart(k)]);
 const endOptions=JOURNEY_END_BANDS.map(k=>[k,labelEnd(k)]);
 const sourcePathway=m.pathway==='cross'?'Elementary → Secondary only':'All matched grade pathways';
 const bars=MAP_RIT_BANDS.map(b=>'<div class="map-journey-outcome-row">'+
  '<span class="map-journey-outcome-label"><i style="background:'+bandColour(b.key)+
  '" aria-hidden="true"></i>'+safe(b.label)+'</span>'+
  '<span class="map-journey-outcome-track" aria-hidden="true"><span style="width:'+
  pct(m.destinations[b.key],m.cohort.length)+'%;background:'+bandColour(b.key)+'"></span></span>'+
  '<strong>'+m.destinations[b.key]+'</strong></div>').join('');
 const matrix='<div class="map-journey-matrix-scroll"><table class="map-journey-matrix">'+
  '<caption>Matched learner transitions by achievement percentile band. Select a number to inspect those learners.</caption>'+
  '<thead><tr><th scope="col">Starting band ↓ / Latest band →</th>'+
  MAP_RIT_BANDS.map(b=>'<th scope="col"><span class="map-journey-matrix-head '+b.key+'">'+safe(b.label)+'</span></th>').join('')+
  '<th scope="col">Total</th></tr></thead><tbody>'+
  MAP_RIT_BANDS.map(from=>{
   const count=MAP_RIT_BANDS.reduce((a,to)=>a+m.matrix[from.key][to.key],0);
   return '<tr><th scope="row"><span class="map-journey-matrix-head '+from.key+'">'+
    safe(from.label)+'</span></th>'+
    MAP_RIT_BANDS.map(to=>{
     const n=m.matrix[from.key][to.key];
     const active=m.startingBand===from.key&&m.endingBand===to.key;
     return '<td><button type="button" data-map-journey-cell="'+safe(from.key)+'|'+safe(to.key)+
      '"'+(n?'':' disabled')+' class="map-journey-matrix-cell'+(active?' is-active':'')+
      '" aria-label="'+n+' learners: '+safe(from.label)+' to '+safe(to.label)+
      '. Show matching students">'+n+'</button></td>';
    }).join('')+
    '<td><strong>'+count+'</strong></td></tr>';
  }).join('')+'</tbody>'+
  '<tfoot><tr><th scope="row">Total</th>'+
  MAP_RIT_BANDS.map(to=>'<td>'+MAP_RIT_BANDS.reduce((n,from)=>n+m.matrix[from.key][to.key],0)+'</td>').join('')+
  '<td>'+m.matched+'</td></tr></tfoot></table></div>';
 const visible=expanded?m.selected:m.selected.slice(0,10);
 const rows='<div class="map-journey-students" id="map-journey-students">'+
  '<div class="map-journey-results-heading"><div><strong>Matched learners</strong>'+
  '<p>'+safe(labelStart(m.startingBand))+' → '+safe(labelEnd(m.endingBand))+
  ' · '+safe(m.subject)+' · '+safe(first?.label)+' to '+safe(last?.label)+'</p></div>'+
  '<span>'+m.selected.length+' learners</span></div>'+
  (visible.length?'<ul class="map-journey-student-list">'+visible.map(entry=>
   '<li><div class="map-journey-student-person">'+renderStudentPhoto(entry.student,'leader')+
   '<span><strong>'+safe(entry.student.name)+'</strong>'+
   '<small>'+safe(entry.student.grade)+' · '+safe(entry.student.classId)+'</small></span></div>'+
   '<div class="map-journey-student-evidence">'+bandMark(entry.from,first.label)+
    '<span class="map-journey-to" aria-hidden="true">→</span>'+
    bandMark(entry.to,last.label)+'</div>'+
   '<button type="button" data-leader-student="'+safe(entry.student.id)+
   '" class="map-journey-open" aria-label="Open longitudinal learner profile for '+safe(entry.student.name)+
   '">View learner <span aria-hidden="true">→</span></button></li>'
  ).join('')+'</ul>':
   '<p class="map-journey-no-results">No learners have both assessments within these two achievement selections. Try a different starting year, band or comparison period. Missing earlier results are never interpreted as Low.</p>')+
  (m.selected.length>10?'<button type="button" data-map-journey-expand class="map-journey-expand">'+
   (expanded?'Show first 10':'Show all '+m.selected.length+' learners')+'</button>':'')+
  '</div>';
 return '<section id="leader-map-journeys" class="map-journeys" aria-labelledby="map-journeys-title">'+
  '<div class="map-journeys-title"><div><span>LONGITUDINAL LEARNING EVIDENCE</span>'+
   '<h2 id="map-journeys-title">MAP Journeys</h2>'+
   '<p>Follow the same fictional learners from earlier grades into their current achievement bands.</p></div>'+
   '<span class="map-journeys-demo">FICTIONAL DATA</span></div>'+
  '<div class="map-journey-filters" role="group" aria-label="MAP Journeys controls">'+
  choices('Subject',MAP_RIT_SUBJECTS.map(s=>[s,mapRitDisplaySubject(s)]),m.subject)+
  choices('Starting window',windowOptions.filter(w=>w[0]!==JOURNEY_FALL_WINDOWS.at(-1).key),m.start)+
  choices('Comparison window',windowOptions.filter(w=>w[0]!==JOURNEY_FALL_WINDOWS[0].key),m.end)+
  choices('Starting band',bandOptions,m.startingBand)+
  choices('Current band',endOptions,m.endingBand)+'</div>'+
  '<div class="map-journey-pathways" role="group" aria-label="Grade transition scope">'+
   [['cross','Elementary → Secondary'],['all','All grade pathways']].map(([k,label])=>
    '<button type="button" data-map-journey-pathway="'+k+'" aria-pressed="'+
    (k===m.pathway?'true':'false')+'">'+safe(label)+(k==='cross'?' · '+m.crossAvailable:'')+'</button>'
   ).join('')+'</div>'+
  '<div class="map-journey-kpis">'+
   '<div><small>Matched tests</small><strong>'+m.matched+'</strong>'+
    '<span>'+safe(first?.label)+' and '+safe(last?.label)+'</span></div>'+
   '<div><small>Starting cohort</small><strong>'+m.cohort.length+'</strong>'+
    '<span>'+safe(labelStart(m.startingBand))+'</span></div>'+
   '<div><small>Now Average or higher</small><strong>'+m.endedAveragePlus+'</strong>'+
    '<span>'+(m.averagePlusPct===null?'No matched cohort':m.averagePlusPct+'% of starting cohort')+'</span></div>'+
   '<div><small>Selected transition</small><strong>'+m.selected.length+'</strong>'+
    '<span>'+safe(labelEnd(m.endingBand))+'</span></div>'+
  '</div>'+
  '<p class="map-journey-coverage">'+m.withStart+' with a starting result · '+
   m.withEnd+' with a comparison result · '+m.matched+' matched ('+safe(sourcePathway)+
   ') · '+m.missingPair+' missing at least one window in the selected scope. '+
   'Only matched students contribute to movement percentages.</p>'+
  '<div class="map-journey-cohort-grid">'+
   '<section class="map-journey-outcomes"><h3>Where the starting cohort is now</h3>'+
    '<p>Achievement bands in '+safe(last?.label)+' for '+m.cohort.length+' matched learners.</p>'+
    bars+'</section>'+
   '<section class="map-journey-transitions"><h3>Achievement-band transitions</h3>'+
   '<p>Select any populated cell to open those students in the list below.</p>'+
   matrix+'</section></div>'+rows+
  '<p class="map-journey-footnote">Achievement percentiles compare a student with the relevant national norm group. A change in percentile is <strong>not</strong> RIT growth or proof of school impact. Seasons and MAP subjects are held constant; student entry, mobility and absent tests can change the matched cohort. This public demonstration uses independently generated fictional results.</p>'+
 '</section>';
}

/** Grade/season-aware SVG. Coloured horizontal backgrounds communicate
 * NWEA-style achievement classifications; points show exact percentiles.
 */
export function renderMapJourneyChart(student,history){
 if(!student||!history?.length)return '';
 const windows=JOURNEY_FALL_WINDOWS.filter(w=>w.year>=Math.min(...history.map(h=>h.year))&&
  w.year<=Math.max(...history.map(h=>h.year)));
 if(!windows.length)return '';
 const width=820,height=268,left=54,right=23,top=24,bottom=55;
 const plotW=width-left-right,plotH=height-top-bottom;
 const x=key=>left+(windows.findIndex(w=>w.key===key)/
  Math.max(1,windows.length-1))*plotW;
 const y=p=>top+(100-p)/100*plotH;
 const byKey=new Map(history.map(h=>[h.key,h]));
 const layers=MAP_RIT_BANDS.map(b=>'<rect x="'+left+'" y="'+y(b.to+1)+
  '" width="'+plotW+'" height="'+(y(b.from-1)-y(b.to+1))+
  '" fill="'+bandColour(b.key)+'" fill-opacity=".105"></rect>').join('');
 const grid=[0,20,40,60,80,100].map(p=>
  '<line x1="'+left+'" y1="'+y(p)+'" x2="'+(width-right)+
  '" y2="'+y(p)+'" stroke="#d3e0e7" stroke-width=".8"></line>'+
  '<text x="'+(left-11)+'" y="'+(y(p)+4)+'" text-anchor="end" fill="#628092" font-size="11">'+p+'</text>'
 ).join('');
 let d='',prevPresent=false;
 for(const w of windows){
  const item=byKey.get(w.key);
  if(!item){prevPresent=false;continue}
  d+=(prevPresent?' L ':' M ')+x(w.key).toFixed(1)+' '+y(item.percentile).toFixed(1);
  prevPresent=true;
 }
 const secondary=history.find(h=>Number(h.grade?.slice(1))>=6);
 const threshold=secondary?'<line x1="'+x(secondary.key)+'" y1="'+top+'" x2="'+x(secondary.key)+
  '" y2="'+(top+plotH)+'" stroke="#6c889b" stroke-width="1.2" stroke-dasharray="5,4"></line>'+
  '<text x="'+Math.min(width-right-3,x(secondary.key)+6)+'" y="'+(top+12)+
  '" fill="#53748a" font-size="10">Secondary</text>':'';
 const marks=windows.map(w=>{
  const p=byKey.get(w.key);
  return '<text x="'+x(w.key)+'" y="'+(height-29)+'" text-anchor="middle" font-size="11" fill="#52758c">'+
   w.year+'</text>'+
   (p?'<text x="'+x(w.key)+'" y="'+(height-13)+'" text-anchor="middle" font-size="10" fill="#7a8d99">'+
    safe(p.grade||'')+'</text>'+
    '<circle cx="'+x(w.key)+'" cy="'+y(p.percentile)+'" r="6" fill="'+bandColour(p.band)+
    '" stroke="#fff" stroke-width="2.5"><title>'+safe(p.window+' · '+(p.grade||'Grade unavailable')+
     ' · P'+p.percentile+' ('+p.bandLabel+') · '+p.rit+' RIT')+'</title></circle>':'');
 }).join('');
 const alt='MAP achievement percentile in '+history[0].window+' P'+history[0].percentile+
  ' through '+history.at(-1).window+' P'+history.at(-1).percentile+
  ', '+history.length+' available fall windows';
 return '<svg class="map-journey-chart" viewBox="0 0 '+width+' '+height+
  '" role="img" aria-label="'+safe(alt)+'" preserveAspectRatio="xMidYMid meet">'+
  '<rect x="'+left+'" y="'+top+'" width="'+plotW+'" height="'+plotH+'" fill="#fbfdfe"></rect>'+
  layers+grid+threshold+
  '<path d="'+d+'" stroke="#234c69" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>'+
  marks+'</svg>';
}
export function renderMapJourneyProfile({student,records,subject='Reading'}={}){
 if(!student)return '';
 const options=MAP_RIT_SUBJECTS.map(s=>'<button type="button" data-map-journey-profile-subject="'+safe(s)+
  '" aria-pressed="'+(s===subject?'true':'false')+'">'+safe(mapRitDisplaySubject(s))+'</button>').join('');
 const history=journeyStudentHistory(student,records||[],subject);
 if(!history.length&&!(records||[]).length)return '';
 const earliest=history[0],latest=history.at(-1);
 const summary=earliest&&latest?'<div class="map-journey-profile-stats">'+
  '<div><small>First recorded Fall</small><strong>'+safe(earliest.window)+'</strong>'+
   '<span>'+safe(earliest.grade||'Grade unavailable')+' · P'+earliest.percentile+' · '+safe(earliest.bandLabel)+'</span></div>'+
  '<div><small>Latest recorded Fall</small><strong>'+safe(latest.window)+'</strong>'+
   '<span>'+safe(latest.grade||'Grade unavailable')+' · P'+latest.percentile+' · '+safe(latest.bandLabel)+'</span></div>'+
  '<div><small>Change in percentile rank</small><strong>'+
    (history.length>1?(latest.percentile-earliest.percentile>0?'+':'')+
     (latest.percentile-earliest.percentile):'—')+'</strong>'+
   '<span>'+ (history.length>1?'Percentile-rank points, not RIT growth':'Only one Fall result')+'</span></div></div>':
  '<p class="map-journey-no-results">No valid Fall MAP percentile is available for this subject.</p>';
 const table=history.length?'<div class="map-journey-history-scroll"><table><caption>Available Fall MAP achievement results</caption>'+
  '<thead><tr><th scope="col">Fall term</th><th scope="col">Grade</th>'+
  '<th scope="col">RIT</th><th scope="col">Achievement</th><th scope="col">Band</th></tr></thead><tbody>'+
  history.map(x=>'<tr><th scope="row">'+safe(x.window)+'</th><td>'+safe(x.grade||'Unknown')+
   '</td><td>'+x.rit+'</td><td>P'+x.percentile+'</td>'+
   '<td><span class="map-journey-band-pill '+safe(x.band)+'">'+safe(x.bandLabel)+'</span></td></tr>').join('')+
  '</tbody></table></div>':'';
 return '<section class="map-journey-profile" aria-labelledby="map-journey-personal-title">'+
  '<div class="map-journey-profile-heading"><div><span>LONGITUDINAL MAP ACHIEVEMENT</span>'+
  '<h2 id="map-journey-personal-title">My MAP Journey</h2>'+
  '<p>Same-season Fall percentiles, across available grades and years.</p></div>'+
  '<span>FICTIONAL DATA</span></div>'+
  '<div class="map-journey-subject-buttons" role="group" aria-label="Choose subject for MAP Journey">'+
  options+'</div>'+summary+
  (history.length?renderMapJourneyChart(student,history)+table:'')+
  '<p class="map-journey-footnote">The achievement percentile shows relative standing in the relevant grade/term norms. It is not a RIT score or growth percentile. Missing terms are not filled in, and comparisons cannot establish why a learner moved between bands. All results here are fictional.</p></section>';
}
