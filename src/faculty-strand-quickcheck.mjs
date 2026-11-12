/** Faculty's compact class-level MAP goal-area entry point. Scoped by caller. */
import {mapStrandExplorerModel,STRAND_SUBJECTS,STRAND_BAND_OPTIONS} from './map-strand-explorer.mjs';
import {esc} from './v2-ui.mjs';
const safe=x=>esc(String(x??''));
export function facultyStrandQuickModel({students=[],map={},subject='Reading',band='both',window='F26'}={}){
 const selected=STRAND_SUBJECTS.includes(subject)?subject:'Reading';
 const filter=['both','low','low-average'].includes(band)?band:'both';
 const subjects=STRAND_SUBJECTS.map(s=>{
  const model=mapStrandExplorerModel({students,map,subject:s,window,band:filter});
  const groups=model.groups.slice().sort((a,b)=>b.members.length-a.members.length||b.low-a.low);
  return {subject:s,tested:model.tested,eligible:model.eligible,
   flagged:model.matched,totalGoals:model.flaggedGoalResults,groups};
 });
 const active=subjects.find(s=>s.subject===selected)||subjects[0];
 return {subject:selected,band:filter,window,subjects,active,
  available:subjects.some(s=>s.eligible>0)};
}
export function renderFacultyStrandQuickCheck(options={}){
 const m=facultyStrandQuickModel(options);
 if(!m.available)return '';
 const buttons=m.subjects.map(s=>'<button type="button" data-faculty-strand-subject="'+safe(s.subject)+
  '" class="faculty-strand-subject'+(s.subject===m.subject?' active':'')+'" aria-pressed="'+(s.subject===m.subject)+
  '" aria-label="'+safe(s.subject+': '+s.flagged+' of '+s.tested+' assessed students match')+'">'+
  '<span>'+safe(s.subject)+'</span><strong>'+s.flagged+' <small>/ '+s.tested+'</small></strong>'+
  '<em>Students to review</em></button>').join('');
 const focus=m.active.groups.slice(0,4);
 const bands=[['both','Low + Low Average'],['low','Low'],['low-average','Low Average']];
 return '<section class="faculty-strand-quick" id="faculty-strand-quick" aria-label="Quick MAP strand check">'+
  '<div class="faculty-strand-quick-header"><div><span>MAP · CLASSROOM SNAPSHOT</span>'+
  '<h2>Quick strand check</h2><p>Spot goal-area patterns in your selected class, then open the detailed explorer or a student profile.</p></div>'+
  '<button type="button" data-faculty-strand-open>Open Strand Explorer →</button></div>'+
  '<div class="faculty-strand-subjects" role="group" aria-label="MAP subjects">'+buttons+'</div>'+
  '<div class="faculty-strand-detail"><div class="faculty-strand-detail-heading"><strong>Most common '+safe(m.subject)+' focus areas</strong>'+
  '<div class="faculty-strand-band-buttons" role="group" aria-label="Filter MAP goal descriptors">'+
  bands.map(([key,label])=>'<button type="button" data-faculty-strand-band="'+key+
   '" aria-pressed="'+(m.band===key)+'" class="'+(m.band===key?'active':'')+'">'+safe(label)+'</button>').join('')+'</div></div>'+
  (focus.length?'<div class="faculty-strand-focus-list">'+focus.map(g=>
   '<button type="button" data-faculty-strand-goal="'+safe(g.name)+'" aria-label="'+safe(
    'Explore '+g.name+' with '+g.members.length+' students in '+g.grade)+'">'+
   '<span class="faculty-strand-focus-name">'+safe(g.name)+'<small>'+safe(g.grade)+
   ' · '+g.low+' Low · '+g.lowAverage+' Low Average</small></span>'+
   '<strong>'+g.members.length+' learners</strong><span aria-hidden="true">→</span></button>').join('')+'</div>':
   '<p class="faculty-strand-quick-empty">No matching goal-area descriptors for this class and selection.</p>')+
   '<p>Counts reflect distinct students by subject, not a diagnosis or a percentile for individual strands. Only your assigned learners appear here. Results are synthetic in this public preview.</p>'+
   '</div></section>';
}
