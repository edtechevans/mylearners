/** Read-only chronological MAP strand presentation (fictional demo). */
import {STRAND_SUBJECTS,strandBandLabel} from './map-strand-explorer.mjs';
import {studentStrandJourney,strandCohortJourney,STRAND_STATUS_LABEL} from './map-strand-journeys.mjs';
import {esc} from './v2-ui.mjs';
const safe=x=>esc(String(x??''));
const dash=n=>Number.isFinite(n)?String(n):'—';
const signed=n=>Number.isFinite(n)?(n>0?'+':'')+n:'—';
const chip=(band,label)=>'<span class="strand-journey-band '+(band?'map-strand-'+safe(band):'')+'">'+
 safe(label||strandBandLabel(band))+'</span>';
const choose=(name,opts,selected,label)=>'<label>'+safe(label)+'<select data-'+name+' aria-label="'+safe(label)+'">'+
 opts.map(([v,t])=>'<option value="'+safe(v)+'"'+(selected===v?' selected':'')+'>'+safe(t)+'</option>').join('')+'</select></label>';
export function renderStudentStrandJourney({
 student=null,records=[],subject='Reading',goalName='',season='fall',studentRole=false
}={}){
 const m=studentStrandJourney({student,records,subject,goalName,season});
 if(!m.steps.length)return '';
 const subjectNav=STRAND_SUBJECTS.map(s=>'<button type="button" data-map-strand-profile-subject="'+safe(s)+
 '" class="'+(m.subject===s?'active':'')+'" aria-pressed="'+(m.subject===s)+'">'+safe(s)+'</button>').join('');
 const milestone=m.handoff?
  '<div class="strand-journey-handoff"><strong>Elementary → Secondary</strong><span>'+
  safe((m.handoff.from.grade||'Grade unavailable')+' '+m.handoff.from.window+
  ' to '+(m.handoff.to.grade||'Grade unavailable')+' '+m.handoff.to.window)+
  '</span><small>Observed transition between recorded grade-at-test values.</small></div>':'';
 const selectedGoal=choose('map-strand-profile-goal',
  m.goals.map(g=>[g,g]),m.goalName,'Goal area');
 const steps=m.steps.map((p,i)=>{
  const readable=p.goal?strandBandLabel(p.band):'Not reported in this test';
  const track=i===0?'First recorded window':
   p.versionBreak?'Assessment form changed · do not calculate a RIT change':
   p.delta!==null?'Change from earlier comparable goal result: '+signed(p.delta)+' RIT':
   'No comparable earlier score';
  const stage=p.stage?safe(p.stage):'Stage not recorded';
  const stepNote=p.grade?'<b>'+safe(p.grade)+'</b>':'<b>Grade unavailable</b>';
  return '<li class="strand-journey-step">'+
   '<span class="strand-journey-dot" aria-hidden="true"></span>'+
   '<div class="strand-journey-step-head"><span>'+safe(p.window)+'</span>'+stepNote+'</div>'+
   '<small>'+stage+'</small>'+
   '<div class="strand-journey-result">'+(p.goal?chip(p.band):chip(null,'Not assessed'))+
    '<strong>'+dash(p.goal?.rit)+'</strong><small>Goal RIT</small></div>'+
   '<p>'+safe(track)+'</p>'+
   '<span class="strand-journey-form" title="'+safe(p.version)+'">Form: '+safe(p.version)+'</span></li>';
 }).join('');
 return '<section class="map-strand-journey-profile" aria-label="Longitudinal MAP strand review">'+
  '<div class="map-strand-section-head"><div><span>MAP OVER TIME · GOAL AREAS</span>'+
  '<h2>'+(studentRole?'How my MAP strands have changed':'MAP strand history')+'</h2>'+
  '<p>Review the same goal area across recorded tests; changes in assessment forms are flagged.</p></div>'+
  '<span class="map-strand-demo">SYNTHETIC DEMO</span></div>'+
  '<div class="strand-journey-subject-tabs" role="group" aria-label="MAP strand subject">'+subjectNav+'</div>'+
  '<div class="strand-journey-controls">'+selectedGoal+
  '<div class="strand-journey-season" role="group" aria-label="History windows">'+
  [['fall','Fall checkpoints'],['all','All testing windows']].map(([value,label])=>
   '<button type="button" data-map-strand-profile-season="'+value+'" aria-pressed="'+(m.season===value)+
   '" class="'+(m.season===value?'active':'')+'">'+label+'</button>').join('')+'</div></div>'+
  '<div class="strand-journey-summary"><span><strong>'+m.matchedWindows+'</strong> goal results</span>'+
  (m.first&&m.last&&m.first.key!==m.last.key?
   '<span><strong>'+safe(STRAND_STATUS_LABEL[m.status]||'Comparison unavailable')+'</strong>'+
   (m.status==='version-break'?' · No comparable overall RIT change':' · Descriptor pattern')+'</span>':'')+
  '</div>'+milestone+
  '<div class="strand-journey-scroll" tabindex="0" aria-label="Scrollable strand history timeline">'+
  '<ol class="strand-journey-timeline">'+steps+'</ol></div>'+
  '<p class="map-strand-foot">A student moving from Low to Average describes changing grade/term-relative descriptors; it is not an official growth percentile. A RIT difference is calculated only across the same named goal and comparable assessment forms. Missing results are not zero, and an Elementary–Secondary handoff is shown only with explicit grade-at-test metadata.</p>'+
  '</section>';
}
export function renderCohortStrandJourney({
 students=[],map={},subject='Reading',goalName='',grade='All',
 start='auto',end='auto',expanded=false,mode='leader'
}={}){
 const m=strandCohortJourney({students,map,subject,goalName,grade,start,end});
 if(!m.windows.length)return '';
 const current=Object.fromEntries(m.windows.map(w=>[w.key,w.label]));
 const optionList=m.windows.map(w=>[w.key,w.label]);
 const label=STRAND_STATUS_LABEL;
 const metrics=[
  ['Comparable paired results',m.compared,'Same goal · compatible test forms'],
  ['Moved beyond Low / LoAvg',m.statuses['moved-beyond-low'],'Recorded descriptor shift'],
  ['Low / LoAvg in both',m.statuses['continued-low'],'Potential continued support'],
  ['Elementary → Secondary',m.crossStage,'Observed grade-at-test movement']
 ];
 const stats='<div class="strand-journey-kpis">'+metrics.map(([key,value,detail])=>
  '<div><span>'+safe(key)+'</span><strong>'+value+'</strong><small>'+safe(detail)+'</small></div>').join('')+'</div>';
 const bars=m.timeline.map(w=>'<div class="strand-journey-window">'+
  '<span>'+safe(w.label)+'</span>'+
  '<div class="strand-journey-window-bar" role="img" aria-label="'+safe(w.label+': '+
  (w.lowShare===null?'no goal area scores':w.lowShare+' percent Low or Low Average among '+w.assessed+' assessed students'))+'">'+
  '<i style="width:'+(w.lowShare||0)+'%"></i></div>'+
  '<strong>'+(w.lowShare===null?'—':w.lowShare+'%')+'</strong>'+
  '<small>'+w.assessed+' goal results</small></div>').join('');
 const rows=expanded?m.rows:m.rows.slice(0,12);
 const td=(value,klass='')=>'<td'+(klass?' class="'+klass+'"':'')+'>'+value+'</td>';
 const content=rows.map(p=>'<tr><th scope="row"><strong>'+safe(p.student.name)+
  '</strong><small>'+safe(p.student.grade)+'</small></th>'+
  td(safe(p.fromGrade||'—')+' · '+chip(p.from.band))+
  td(safe(p.toGrade||'—')+' · '+chip(p.to.band))+
  td('<strong>'+safe(label[p.status]||'Not classified')+'</strong>'+
   (p.delta!==null?'<small>'+signed(p.delta)+' goal RIT</small>':
    p.status==='version-break'?'<small>Forms or math stage differ</small>':'')+
   (p.isCross?'<small>Elementary → Secondary</small>':''),'strand-journey-status')+
  td('<button type="button" data-'+(mode==='leader'?'leader-student':'student')+'="'+safe(p.student.id)+
    '">Open learner →</button>')+'</tr>').join('');
 const result='<div class="strand-journey-table-wrap"><table class="strand-journey-table">'+
  '<thead><tr><th scope="col">Learner</th><th scope="col">'+safe(current[m.start]||m.start)+
  '</th><th scope="col">'+safe(current[m.end]||m.end)+
  '</th><th scope="col">Pattern</th><th scope="col">Profile</th></tr></thead>'+
  '<tbody>'+content+'</tbody></table></div>';
 return '<section class="map-strand-cohort" id="map-strand-cohort" aria-label="MAP strand pathways over time">'+
  '<div class="map-strand-section-head"><div><span>HISTORICAL REVIEW · STRAND PATHWAYS</span>'+
  '<h2>How are these learning areas changing?</h2>'+
  '<p>Follow the same students and exact goal area across Fall MAP windows, including Elementary–Secondary transitions when recorded.</p></div>'+
  '<span class="map-strand-demo">DEMO HISTORY</span></div>'+
  '<div class="strand-journey-cohort-focus"><strong>Goal area:</strong> '+safe(m.goalName||'No recorded goals')+
  '<small>To switch goals, use the Goal area filter in MAP Strand Explorer above.</small></div>'+
  '<div class="strand-journey-window-controls">'+
  choose('map-strand-journey-start',optionList,m.start,'Starting Fall window')+
  choose('map-strand-journey-end',optionList,m.end,'Comparison Fall window')+'</div>'+
  stats+
  '<div class="strand-journey-trend-heading"><h3>Low / Low Average share by testing window</h3>'+
  '<p>Each percentage has its own assessed denominator. It is a cohort snapshot, not individual student growth.</p></div>'+
  '<div class="strand-journey-window-list">'+bars+'</div>'+
  '<div class="strand-journey-trend-heading"><h3>Matched student journeys</h3>'+
  '<p>'+m.paired+' paired records · '+m.compared+' comparable · '+m.missingPair+
  ' without both named-goal results · '+m.statuses['version-break']+
  ' with form / stage change</p></div>'+
  (rows.length?result:'<p class="map-strand-empty">No students have goal-area results in both chosen Fall windows. Try another pair of windows.</p>')+
  (m.rows.length>12?'<button type="button" class="strand-journey-expand" data-map-strand-journey-expand aria-expanded="'+
   expanded+'">'+(expanded?'Show first 12':'Show all '+m.rows.length+' matched students')+'</button>':'')+
  '<p class="map-strand-foot">Only the same exact goal heading and compatible test forms can be treated as a comparable strand series. Mathematics across Elementary–Secondary stage changes remains non-comparable without an approved crosswalk. Grade transitions require grade-at-test data; the source AssessmentResults export alone may not provide it. Public demo: synthetic records only.</p></section>';
}
