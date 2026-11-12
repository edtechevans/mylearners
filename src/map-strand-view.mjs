/** HTML views for synthetic MAP strands (read-only). */
import {STRAND_SUBJECTS,strandBand,strandBandLabel,latestStrandAssessment,strandGoalHistory,mapStrandExplorerModel,STRAND_BAND_OPTIONS} from './map-strand-explorer.mjs';
import {esc} from './v2-ui.mjs';
const safe=x=>esc(String(x??''));
const swatch=band=>'map-strand-'+(band||'missing');
const score=x=>Number.isFinite(x)?String(x):'—';
export function renderMapStrandProfile(records,{studentRole=false}={}){
 const subjects=STRAND_SUBJECTS.map(subject=>({subject,record:latestStrandAssessment(records||[],subject)})).filter(x=>x.record);
 if(!subjects.length)return '';
 const tiles=subjects.map(({subject,record})=>{
  const low=(record.goals||[]).filter(g=>['low','low-average'].includes(strandBand(g))).length;
  return '<article class="map-strand-subject"><div class="map-strand-subject-head"><span>MAP '+safe(subject)+'</span>'+
    '<strong>'+score(record.goals?.length)+' goal areas</strong></div>'+
    '<small>'+safe(record.window||'Most recent test')+' · '+low+' Low / Low Average</small>'+
    '<div class="map-strand-goals">'+(record.goals||[]).map(goal=>{
     const band=strandBand(goal);
     const history=strandGoalHistory(records,subject,goal.name,record);
     return '<div class="map-strand-goal '+swatch(band)+'">'+
      '<div><strong>'+safe(goal.name)+'</strong><small>'+safe(strandBandLabel(band))+
      (history.delta!==null?' · '+(history.delta>0?'+':'')+history.delta+' RIT vs earlier comparable test':'')+'</small></div>'+
      '<div class="map-strand-goal-value"><b>'+score(goal.rit)+'</b><small>Goal RIT</small></div></div>';
    }).join('')+'</div></article>';
 }).join('');
 return '<section class="map-strand-profile" aria-label="MAP goal-area strands">'+
  '<div class="map-strand-section-head"><div><span>MAP STRAND EXPLORER</span><h2>'+ (studentRole?'My MAP learning areas':'MAP strengths and instructional focus')+'</h2>'+
  '<p>Each goal area is reported separately. Explore current achievement descriptors and comparable changes where available.</p></div>'+
  '<span class="map-strand-demo">DEMO SCORES</span></div>'+
  '<div class="map-strand-subject-grid">'+tiles+'</div>'+
  '<p class="map-strand-foot">Goal-area labels Low / Low Average are MAP-provided descriptors, not individual goal percentiles. Goal RIT is not an overall subject RIT. Interpret with the test version, instruction, and multiple sources of evidence; changes appear only for comparable forms.</p></section>';
}
export function renderMapStrandExplorer({
 students=[],map={},subject='Reading',window='F26',band='both',goalName='',grade='All',expanded=false,mode='leader'
}={}){
 const m=mapStrandExplorerModel({students,map,subject,window,band,goalName,grade});
 const pageSize=15;
 const visible=expanded?m.rows:m.rows.slice(0,pageSize);
 const select=(field,opts,value,label)=>'<label>'+safe(label)+'<select data-map-strand-filter="'+field+'" aria-label="'+safe(label)+'">'+
  opts.map(([key,text])=>'<option value="'+safe(key)+'"'+(key===value?' selected':'')+'>'+safe(text)+'</option>').join('')+'</select></label>';
 const grades=[...new Set(students.filter(s=>/^G(?:[3-9]|10)$/.test(s.grade)).map(s=>s.grade))].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));
 const groups=m.groups.slice(0,16);
 const rows=visible.map(({student,record,hits})=>'<li class="map-strand-learner-row"><div><strong>'+safe(student.name)+'</strong><small>'+
  safe(student.grade)+' · '+safe(record.window)+'</small></div><div class="map-strand-learner-hits">'+
  hits.map(g=>'<span class="map-strand-chip '+swatch(g.band)+'" title="'+safe(g.name)+'">'+safe(g.name)+
   ' · '+score(g.rit)+' RIT · '+safe(strandBandLabel(g.band))+'</span>').join('')+'</div>'+
  '<button type="button" data-'+(mode==='leader'?'leader-student':'student')+'="'+safe(student.id)+'">Open learner →</button></li>').join('');
 return '<section class="map-strand-explorer" id="map-strand-explorer" aria-label="MAP strand explorer">'+
 '<div class="map-strand-section-head"><div><span>MAP GOAL AREAS · INSTRUCTIONAL INQUIRY</span>'+
 '<h2>MAP Strand Explorer</h2><p>Find learners sharing an instructional area, then review their full learning context.</p></div>'+
 '<span class="map-strand-demo">SYNTHETIC DEMO</span></div>'+
 '<div class="map-strand-filters">'+
 select('subject',STRAND_SUBJECTS.map(s=>[s,s]),m.subject,'Subject')+
 select('window',m.windows.map(w=>[w.key,w.label]),m.window,'Test window')+
 select('grade',[['All','All grades'],...grades.map(g=>[g,g])],m.grade,'Grade')+
 select('band',STRAND_BAND_OPTIONS.map(b=>[b.value,b.label]),m.band,'MAP goal descriptor')+
 select('goal',[['','All strands'],...m.goalNames.map(n=>[n,n])],m.goalName,'Goal area')+
 '</div><div class="map-strand-stat-grid">'+
 '<div><small>Eligible learners in scope</small><strong>'+m.eligible+'</strong></div>'+
 '<div><small>With goal-area results</small><strong>'+m.tested+'</strong></div>'+
 '<div><small>Matching learners</small><strong>'+m.matched+'</strong></div>'+
 '<div><small>Matching goal-area results</small><strong>'+m.flaggedGoalResults+'</strong></div></div>'+
 '<div class="map-strand-group-section"><div class="map-strand-subheading"><h3>Potential teaching groups</h3>'+
 '<p>Grouped by grade, exact MAP goal name and assessment version — for review, not automatic assignment.</p></div>'+
 (groups.length?'<div class="map-strand-group-grid">'+groups.map(g=>'<article><span>'+safe(g.grade)+' · '+g.members.length+' learners</span>'+
 '<strong>'+safe(g.name)+'</strong><small>'+g.low+' Low · '+g.lowAverage+' Low Average</small></article>').join('')+'</div>':
 '<p class="map-strand-empty">No goal-area results match these filters.</p>')+'</div>'+
 '<div class="map-strand-roster"><div class="map-strand-subheading"><h3>Students to review</h3><p>'+m.matched+' match'+
 (m.matched>visible.length?' · showing first '+visible.length:'')+'</p></div>'+
 (visible.length?'<ul>'+rows+'</ul>':'<p class="map-strand-empty">No student results available in this selection. Missing assessments are not treated as low.</p>')+
 (m.matched>pageSize?'<button type="button" data-map-strand-expand aria-expanded="'+expanded+'">'+
 (expanded?'Show first '+pageSize:'Show all '+m.matched+' students')+'</button>':'')+'</div>'+
 '<p class="map-strand-foot">Goal descriptors are source-provided classifications, not per-strand percentile ranks. Students are counted once in learner totals, but may appear in several goal groups. Different tests, grade levels or goal labels are not silently combined. This public preview uses fictional student results only.</p></section>';
}
