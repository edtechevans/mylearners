/** Leader Academic Follow-up: one-click role-scoped fictional learner lists.
 * This module does not persist review decisions, assign risk scores or combine
 * MAP achievement with subject grades. The caller MUST supply the already-
 * permitted division/grade/homeroom cohort; never render on schoolwide view.
 */
import {gradeNumber} from './data.mjs';
import {MAP_RIT_SUBJECTS,mapRitDisplaySubject} from './map-rit-achievement.mjs';
import {leaderMapBandReview,MAP_REVIEW_SELECTIONS} from './leader-review-signals.mjs?v=20261111mapbands1';
import {leaderReportSignalSummary,mypBestFitMarker} from './report-card-signals.mjs';
import {renderStudentPhoto} from './student-photo-preview.mjs?v=20261111photo1';
import {esc} from './v2-ui.mjs';

const safe=v=>esc(String(v??''));
const gradeText=v=>v==='K'?'K':v;
const gradeOrder=(a,b)=>gradeNumber(a)-gradeNumber(b);
export const LEADER_ACADEMIC_FOCUS=Object.freeze(['map','subjects']);

export function leaderAcademicActionModel(students,map,academic,mapBand='both'){
 const inScope=students||[];
 return {
  map:leaderMapBandReview(inScope,map,'F26',mapBand),
  subjects:leaderReportSignalSummary(inScope,academic,2),
  selected:inScope.length
 };
}
const actionCard=({kind,count,title,description,foot,active})=>
 '<button type="button" class="leader-academic-action '+kind+(active?' is-active':'')+
 '" data-leader-academic-focus="'+kind+'" aria-expanded="'+(active?'true':'false')+
 '" aria-controls="leader-academic-results" aria-label="Show '+count+' '+safe(title)+'">'+
 '<span class="leader-academic-action-top"><small>'+(kind==='map'?'MAP ACHIEVEMENT':'SUBJECT RESULTS')+
 '</small><strong>'+count+'</strong></span>'+
 '<span class="leader-academic-action-title">'+safe(title)+'</span>'+
 '<span class="leader-academic-action-desc">'+safe(description)+'</span>'+
 '<span class="leader-academic-action-footer"><span>'+safe(foot)+'</span>'+
 '<span class="leader-academic-action-view">View students <span aria-hidden="true">↗</span></span></span></button>';

const rowIdentity=student=>'<div class="leader-academic-person">'+
 renderStudentPhoto(student,'leader')+
 '<div><strong>'+safe(student.name)+'</strong>'+
 '<small>'+safe(gradeText(student.grade))+' · '+safe(student.classId||'Homeroom not specified')+'</small></div></div>';
const chip=(title,detail,kind,marker='')=>'<span class="leader-academic-evidence-chip '+kind+'"><b>'+
 safe(title)+'</b><span>'+safe(detail)+marker+'</span></span>';
const rowHtml=(entry,kind)=>{
 const subjectBadges=kind==='map'?
  entry.hits.map(x=>chip(mapRitDisplaySubject(x.subject),
   x.rit+' RIT · P'+x.percentile+' · '+(x.band==='low'?'Low':'Low Average'),
   x.band==='low'?'map map-low':'map map-low-average')):
  entry.low.map(x=>chip(x.subject,String(x.value)+' / 7','subject',mypBestFitMarker(x)));
 return '<li class="leader-academic-row">'+rowIdentity(entry.student)+
  '<div class="leader-academic-row-evidence">'+subjectBadges.join('')+'</div>'+
  '<button type="button" class="leader-academic-open" data-leader-student="'+
   safe(entry.student.id)+'" aria-label="Open learner profile for '+safe(entry.student.name)+
  '">Open learner <span aria-hidden="true">→</span></button></li>';
};
const select=(name,items,value,label)=>'<label>'+safe(label)+
 '<select data-leader-academic-'+name+' aria-label="'+safe(label)+'">'+
 items.map(([v,title])=>'<option value="'+safe(v)+'"'+(v===value?' selected':'')+'>'+
 safe(title)+'</option>').join('')+'</select></label>';

export function renderLeaderAcademicActions({
 students,map,academic,focus='',grade='',subject='',multiple=false,expanded=false,mapBand='both'
}={}){
 const selectedBand=MAP_REVIEW_SELECTIONS.includes(mapBand)?mapBand:'both';
 const model=leaderAcademicActionModel(students,map,academic,selectedBand);
 const hasMap=model.map.eligible>0;
 const hasReports=model.subjects.numericReports>0||
  (students||[]).some(s=>gradeNumber(s.grade)>=6&&gradeNumber(s.grade)<=12);
 if(!hasMap&&!hasReports)return '';
 const validFocus=focus==='map'&&hasMap?'map':focus==='subjects'&&hasReports?'subjects':'';
 const cards=[
  ...(hasMap?[actionCard({kind:'map',count:model.map.rows.length,
   title:'Students in MAP Low / Low Average',
   description:'Red P1–20 · Orange P21–40 · '+(selectedBand==='both'?'Both bands':
    selectedBand==='low'?'Red only':'Orange only'),
   foot:'Red '+model.map.bandCounts.red+' · Orange '+model.map.bandCounts.orange+
    ' · '+model.map.tested+' of '+model.map.eligible+' tested',
   active:validFocus==='map'})]:[]),
  ...(hasReports?[actionCard({kind:'subjects',count:model.subjects.flagged,
   title:'Students with subject results ≤2',
   description:'At least one numeric subject result of 2 or below',
   foot:model.subjects.numericReports+' of '+model.subjects.selected+' with numeric test results',
   active:validFocus==='subjects'})]:[])
 ];
 let detail='<section id="leader-academic-results" class="leader-academic-results" hidden></section>';
 if(validFocus){
  const rows=validFocus==='map'?model.map.rows:model.subjects.rows;
  const grades=[...new Set(rows.map(x=>x.student.grade))].sort(gradeOrder);
  const subjects=validFocus==='map'?MAP_RIT_SUBJECTS:
   [...new Set(rows.flatMap(x=>x.low.map(y=>y.subject)))].sort();
  const gradeValue=grades.includes(grade)?grade:'';
  const subjectValue=subjects.includes(subject)?subject:'';
  const matched=rows.filter(x=>{
   const hits=validFocus==='map'?x.hits:x.low;
   return (!gradeValue||x.student.grade===gradeValue)&&
    (!subjectValue||hits.some(z=>z.subject===subjectValue))&&
    (!multiple||hits.length>=2);
  });
  const shown=expanded?matched:matched.slice(0,12);
  const mapBandLabel=selectedBand==='both'?'Red + Orange (P1–40)':
   selectedBand==='low'?'Low · Red (P1–20)':'Low Average · Orange (P21–40)';
  const title=validFocus==='map'?'MAP achievement — '+mapBandLabel:'Subject results ≤2 — student list';
  const mapBandFilters=validFocus==='map'?
   '<div class="leader-map-band-filters" role="group" aria-label="Filter MAP achievement percentile bands">'+
   [
    ['both','Red + Orange','P1–40',model.map.bandCounts.both],
    ['low','Low · Red','P1–20',model.map.bandCounts.red],
    ['low-average','Low Average · Orange','P21–40',model.map.bandCounts.orange]
   ].map(([key,label,range,count])=>
    '<button type="button" class="leader-map-band-select '+(key==='both'?'both':key==='low'?'red':'orange')+
    (selectedBand===key?' is-active':'')+'" data-leader-map-band="'+key+'" aria-pressed="'+
    (selectedBand===key?'true':'false')+'" aria-label="'+safe(label)+' '+safe(range)+
    '; '+count+' learners">'+
    '<span class="leader-map-band-indicator" aria-hidden="true"></span>'+
    '<span class="leader-map-band-text"><strong>'+safe(label)+'</strong><small>'+safe(range)+'</small></span>'+
    '<b>'+count+'</b></button>').join('')+'</div>':'';

  detail='<section id="leader-academic-results" class="leader-academic-results" tabindex="-1"'+
   ' aria-labelledby="leader-academic-results-title">'+
   '<div class="leader-academic-results-head"><div><span>IN SCOPE · FICTIONAL LEARNERS</span>'+
   '<h3 id="leader-academic-results-title">'+safe(title)+'</h3>'+
   '<p>'+(validFocus==='map'?
    'Fall 2026 MAP Reading, Math or Language Usage achievement percentiles. Red is P1–20, Orange is P21–40.':
    'In-progress 2026–27 numeric subject results of 2 or below (MYP/DP, 1–7 scale).')+
   '</p></div><button type="button" class="leader-academic-close" data-leader-academic-close'+
   ' aria-label="Close academic student list">Close <span aria-hidden="true">×</span></button></div>'+
   mapBandFilters+
   '<div class="leader-academic-filters" role="group" aria-label="Filter academic review students">'+
   select('grade',[['','All grades'],...grades.map(g=>[g,gradeText(g)])],gradeValue,'Grade')+
   select('subject',[['','All subjects'],...subjects.map(x=>[x,mapRitDisplaySubject(x)])],
    subjectValue,'Subject')+
   '<button type="button" data-leader-academic-multiple aria-pressed="'+(multiple?'true':'false')+
   '">2+ affected subjects</button></div>'+
   '<p class="leader-academic-count" aria-live="polite"><strong>'+matched.length+
   '</strong> learners match'+(matched.length>shown.length?
    ' · first '+shown.length+' displayed':'')+'</p>'+
   (shown.length?'<ul class="leader-academic-list">'+shown.map(x=>rowHtml(x,validFocus)).join('')+'</ul>':
    '<p class="leader-academic-empty">No available results match these filters. Missing assessments are not treated as low scores.</p>')+
   (matched.length>12?'<button type="button" class="leader-academic-expand" data-leader-academic-expand>'+
    (expanded?'Show first 12':'Show all '+matched.length+' learners')+'</button>':'')+
   '<p class="leader-academic-note">'+(validFocus==='map'?
    'Red means Low (P1–20); Orange means Low Average (P21–40). Combined is the unique number of learners in either band, not the sum of the separate counts. These are achievement percentiles, not growth percentiles or universal RIT cutoffs.':
    'These are simulated current-year subject results, not issued reports or an overall learner grade.')+
    ' Review the learner’s context and prior windows before deciding on support. This demo uses fictional student data.</p>'+
   '</section>';
 }
 return '<div class="leader-academic-actions" aria-label="Academic Follow-up">'+
  '<div class="leader-academic-actions-heading"><div><span>ACADEMIC FOLLOW-UP</span>'+
  '<h3>Find learners who may need a closer look</h3></div>'+
  '<p>Select a card to open the matching student list immediately.</p></div>'+
  '<div class="leader-academic-action-grid'+(cards.length===1?' only-one':'')+'">'+cards.join('')+'</div>'+
  (hasMap?'<div class="leader-journeys-entry"><span>How have these same students moved between achievement bands over their years at school?</span>'+
   '<button type="button" data-leader-jump="leader-map-journeys">Explore MAP Journeys <span aria-hidden="true">→</span></button></div>':'')+
  detail+'</div>';
}
