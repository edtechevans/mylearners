/** AISG synthetic SSS leadership, intervention, referral and learner-voice presentation. */
import {esc} from './v2-ui.mjs';
import {SUPPORT_AS_OF,supportForStudent} from './support-workspace-data.mjs';
import {CASE_MANAGERS,REFERRAL_STAGES,REVIEW_DECISIONS,STRATEGIES,managerFor,tierFor,
 interventionFor,supportLeadership,learnerPerspective,lastReferralStage,supportInquiry} from './sss-leadership-data.mjs';
const e=value=>esc(String(value??''));
const fmt=value=>{if(!value)return 'Not scheduled';const [y,m,d]=value.split('-').map(Number);
 return new Date(Date.UTC(y,m-1,d)).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});};
const pill=(value)=>'<span class="support-mini-pill">'+e(value)+'</span>';
const action=(studentId,tab,text)=>'<button type="button" class="support-small-button" data-sss-panel="'+tab+'" data-sss-target="'+e(studentId)+'">'+e(text)+'</button>';
const open=(id,tab,text)=>'<button type="button" class="support-small-button" data-sss-open="'+e(id)+'" data-sss-open-panel="'+tab+'">'+e(text)+' →</button>';

export function renderSSSLeadershipDashboard(students,records,entries,selectedManager='All'){
 const m=supportLeadership(students,records,entries,selectedManager);
 const stats=[
  ['Students Supported',m.selected.length,'Fictional active cohort'],
  ['Reviews Due',m.due.length,'By 27 Nov 2026'],
  ['Open Actions',m.pending.length,'Follow-up ownership'],
  ['Referrals Pending',m.referrals.length,'Awaiting team decisions'],
  ['At Sample Target',m.monitoring.atTarget,'Of '+m.monitoring.monitored+' illustrative intervention series']
 ];
 const metric=([title,value,foot])=>'<div class="support-lead-metric"><span>'+e(title)+'</span>'+
  '<strong>'+value+'</strong><small>'+e(foot)+'</small></div>';
 const queue=(title,items,description,max=4)=>'<div class="support-queue"><div class="support-queue-top">'+
  '<div><h3>'+e(title)+'</h3><p>'+e(description)+'</p></div><strong>'+items.length+'</strong></div>'+
  (items.length?items.slice(0,max).map(x=>'<div class="support-queue-item"><div>'+
   '<b>'+e(x.student.name)+'</b><small>'+e(x.detail)+'</small></div>'+open(x.student.id,x.panel,'Open')+'</div>').join(''):
  '<p class="support-queue-empty">No matching items in this demonstration selection.</p>')+'</div>';
 const due=m.due.slice().sort((a,b)=>records.get(a.id).reviewDate.localeCompare(records.get(b.id).reviewDate))
  .map(s=>({student:s,detail:fmt(records.get(s.id).reviewDate)+' · '+e(managerFor(s)),panel:'plans'}));
 const actions=m.pending.map(x=>({student:students.find(s=>s.id===x.studentId),detail:(x.owner||'Case manager')+' · '+fmt(x.reviewDate),panel:'history'}))
  .filter(x=>x.student);
 const referrals=m.referrals.map(x=>({student:students.find(s=>s.id===x.studentId),detail:lastReferralStage(x)+' · '+fmt(x.date),panel:'plans'}))
  .filter(x=>x.student);
 return '<section class="support-leadership" aria-label="SSS leadership overview">'+
  '<div class="support-section-head"><div><div class="eyebrow">SSS TEAM · FICTIONAL CASELOAD</div>'+
  '<h2>What Needs Our Attention?</h2><p>Decisions and follow-up, not another data collection screen.</p></div>'+
  '<label class="support-lead-manager">Case Manager<select data-sss-manager>'+
  '<option value="All">All Case Managers</option>'+CASE_MANAGERS.map(c=>'<option'+(selectedManager===c?' selected':'')+' value="'+e(c)+'">'+e(c)+'</option>').join('')+
  '</select></label></div>'+
  '<div class="support-lead-metrics">'+stats.map(metric).join('')+'</div>'+
  '<div class="support-queue-grid">'+
  queue('Upcoming Reviews',due,'Plans due for a collaborative check-in')+
  queue('Open Follow-ups',actions,'Actions needing an owner update')+
  queue('Referrals for Discussion',referrals,'Review evidence and agree the next stage')+
  '</div><p class="support-demo-caption">Counts are generated entirely from fictional records. They change as demo actions and referral stages are updated in this session. These are workflow indicators, not judgements of students or support quality.</p></section>';
}
export function renderSSSProfileNavigation(active='summary'){
 const tabs=[['summary','Summary','30-second view'],['plans','Plans & Progress','Monitor impact'],['history','Support History','Case notes'],['evidence','Learning Evidence','Academic context']];
 return '<nav class="support-profile-tabs" aria-label="SSS student profile sections">'+tabs.map(([id,name,description])=>
  '<button type="button" data-sss-panel="'+id+'" aria-current="'+(active===id?'page':'false')+
  '" class="'+(active===id?'is-active':'')+'"><strong>'+name+'</strong><small>'+description+'</small></button>').join('')+'</nav>';
}
export function renderSSSSummary(student,record,entries){
 const all=supportForStudent(entries,student.id);
 const plan=all.find(x=>x.type==='plan'&&x.status==='Active');
 const actionItems=all.filter(x=>x.type==='action'&&x.status==='Open');
 const referral=all.find(x=>x.type==='referral');
 const view=learnerPerspective(student,entries);
 const questions=supportInquiry(student,new Map([[student.id,record]]),entries);
 const card=(caption,headline,body)=>'<article class="support-snapshot-card"><span>'+e(caption)+'</span>'+
  '<strong>'+e(headline)+'</strong><p>'+e(body)+'</p></article>';
 return '<section class="support-summary-panel">'+
  '<div class="support-section-head"><div><div class="eyebrow">30-SECOND TEAM BRIEF</div><h2>What Matters Right Now</h2>'+
  '<p>Strengths, access, current support and the next conversation.</p></div>'+
  '<button type="button" class="support-new primary" data-support-new="'+e(student.id)+'" data-support-type="note">+ Add Case Note</button></div>'+
  '<div class="support-summary-grid">'+
  card('Coordinating Support',managerFor(student),tierFor(student)+' · Next review '+fmt(record.reviewDate))+
  card('Current Learning Focus',record.focus.title,record.focus.goal)+
  card('Active Classroom Approach',plan?.title||'Universal supports',plan?.accommodations||record.focus.strategy)+
  card('Immediate Follow-up',actionItems.length+' open actions',actionItems[0]?.summary||'No actions currently outstanding')+
  '</div>'+
  '<div class="support-summary-bottom"><article class="support-voice-summary"><h3>Learner Perspective</h3>'+
  '<p><b>What helps:</b> '+e(view.helps)+'</p><p><b>What to try:</b> '+e(view.try)+'</p>'+
  '<small>'+e(view.source)+'</small>'+action(student.id,'plans','See Learner Voice')+'</article>'+
  '<article class="support-voice-summary"><h3>Next Team Discussion</h3>'+
  (questions.length?'<ul>'+questions.map(q=>'<li>'+e(q)+'</li>').join('')+'</ul>':
   '<p>Review current strategies with the learner and classroom team.</p>')+
  (referral?'<small>Referral stage: '+e(lastReferralStage(referral))+'</small>':'')+
  action(student.id,'plans','View Intervention & Referral')+'</article></div>'+
  '<p class="support-demo-caption">All information is synthetic. Suggestions are inquiry prompts, not automated diagnoses or recommendations about real learners.</p></section>';
}
const scale=(value,min,max,low,high)=>low+(value-min)/(max-min)*(high-low);
function graph(iv){
 const w=660,h=195,x0=48,x1=630,y0=153,y1=26;
 const xp=i=>scale(i,0,5,x0,x1),yp=n=>scale(n,0,5,y0,y1);
 const pts=iv.observations.map((row,i)=>xp(i).toFixed(1)+','+yp(row.observed).toFixed(1)).join(' ');
 const grid=[0,1,2,3,4,5].map(n=>'<line x1="'+x0+'" x2="'+x1+'" y1="'+yp(n)+'" y2="'+yp(n)+
  '" stroke="#dfe9ee"/><text x="30" y="'+(yp(n)+4)+'" font-size="11" fill="#617687" text-anchor="end">'+n+'</text>').join('');
 const labels=iv.observations.map((r,i)=>'<text x="'+xp(i)+'" y="177" font-size="11" fill="#587386" text-anchor="middle">W'+r.week+'</text>').join('');
 return '<svg class="support-progress-chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+e(iv.title)+
  ': baseline '+iv.baseline+', latest '+iv.latest+', target '+iv.target+' of 5 across six weeks">'+
  grid+'<line x1="'+x0+'" x2="'+x1+'" y1="'+yp(iv.target)+'" y2="'+yp(iv.target)+
  '" stroke="#8f4552" stroke-width="2" stroke-dasharray="6 5"/>'+
  '<polyline fill="none" stroke="#156b86" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="'+pts+'"/>'+
  iv.observations.map((r,i)=>'<circle cx="'+xp(i)+'" cy="'+yp(r.observed)+'" r="4" fill="#156b86"/>').join('')+
  labels+'</svg>';
}
function renderProgress(student,record,entries){
 const iv=interventionFor(student,new Map([[student.id,record]]),entries);
 if(!iv)return '';
 return '<section class="support-intervention"><div class="support-section-head"><div>'+
  '<div class="eyebrow">INTERVENTION MONITORING · DEMO</div><h3>'+e(iv.title)+'</h3>'+
  '<p>'+e(iv.measure)+' · through '+fmt(iv.measuredThrough)+'</p></div>'+
  '<span class="support-mini-pill">Review '+fmt(iv.reviewDate)+'</span></div>'+
  '<div class="support-progress-stats">'+[['Baseline',iv.baseline],['Latest',iv.latest],['Target',iv.target]].map(
  ([k,v])=>'<div><small>'+k+'</small><strong>'+v+' / 5</strong></div>').join('')+'</div>'+
  graph(iv)+
  '<div class="support-progress-legend"><span><i></i> Observed successes</span>'+
  '<span><i class="is-target"></i> Target</span></div>'+
  '<p class="support-small-note">Illustrative weekly observations. The measure and opportunities are held constant; it is not an official assessment, causal estimate or prediction. Example delivery check: '+iv.fidelity+'% of planned sessions recorded.</p>'+
  '<div class="support-strategy-note"><b>Current Support</b><p>'+e(iv.strategy.how)+'</p>'+
  '<small>TLF: '+e(iv.strategy.facet)+' · UDL: '+e(iv.strategy.udl)+'</small></div>'+
  (iv.decision?'<p class="support-decision-record"><b>Latest Team Decision: '+e(iv.decision)+
   '</b><span>'+e(iv.reviewNote)+'</span></p>':'')+
  '<form data-support-review-form data-support-student="'+e(student.id)+'" class="support-review-form">'+
  '<label>Decision at Review<select name="decision" required>'+REVIEW_DECISIONS.map(x=>
   '<option value="'+e(x)+'"'+(iv.decision===x?' selected':'')+'>'+e(x)+'</option>').join('')+'</select></label>'+
  '<label>Evidence & Rationale<textarea name="summary" rows="2" maxlength="1200" required placeholder="What evidence informed this collaborative decision?"></textarea></label>'+
  '<button type="submit" class="support-new primary">Record Review Decision (Demo)</button></form></section>';
}
function renderReferrals(student,entries){
 const all=supportForStudent(entries,student.id).filter(x=>x.type==='referral');
 return '<section class="support-referrals"><div class="support-section-head"><div><h3>Referral Journey</h3>'+
  '<p>Transparent next steps and team-owned decisions.</p></div>'+
  '<button type="button" class="support-new" data-support-new="'+e(student.id)+'" data-support-type="referral">+ SST Referral</button></div>'+
  '<div class="support-referral-stages">'+REFERRAL_STAGES.map((stage,i)=>
    '<span>'+(i+1)+' · '+e(stage)+'</span>').join('')+'</div>'+
  (all.length?all.map(x=>{const stage=lastReferralStage(x),index=REFERRAL_STAGES.indexOf(stage);
   return '<article class="support-referral-card"><div><strong>'+e(x.title)+'</strong>'+
     '<small>'+fmt(x.date)+' · '+e(x.author)+'</small><p>'+e(x.summary)+'</p>'+
     '<span class="support-mini-pill">Stage: '+e(stage)+'</span></div>'+
     (index<4?'<button type="button" class="support-small-button" data-support-referral-next="'+e(x.id)+'">'+
       'Move to '+e(REFERRAL_STAGES[index+1])+'</button>':'<span class="support-mini-pill">Closed cycle</span>')+
     '</article>';}).join(''):'<p class="support-empty">No sample referral recorded for this learner.</p>')+
  '<p class="support-small-note">Demonstration transitions are recorded within this browser session. In a real system, formal decisions would require role permissions and an audit trail.</p></section>';
}
function renderVoice(student,entries){
 const p=learnerPerspective(student,entries);
 const comms=supportForStudent(entries,student.id).filter(x=>x.type==='communication').slice(0,1);
 return '<section class="support-learner-voice"><div class="support-section-head"><div><h3>Student & Caregiver Voice</h3>'+
  '<p>Understand the learner and family perspective before choosing support.</p></div>'+
  '<button type="button" class="support-new" data-support-new="'+e(student.id)+'" data-support-type="voice">+ Learner Perspective</button></div>'+
  '<div class="support-voice-grid"><article><small>What Helps Me Learn</small><p>'+e(p.helps)+'</p></article>'+
  '<article><small>What Feels Difficult</small><p>'+e(p.hard)+'</p></article>'+
  '<article><small>What I Would Like to Try</small><p>'+e(p.try)+'</p></article></div>'+
  '<div class="support-voice-footer"><span>Student voice: '+e(p.source)+'</span>'+
  '<span>Caregiver: '+e(comms[0]?.summary||'No fictional caregiver communication yet')+'</span>'+
  '<button type="button" class="support-small-button" data-support-new="'+e(student.id)+'" data-support-type="communication">Record Caregiver Communication</button></div></section>';
}
function renderStrategies(student,selected){
 const options=['All',...new Set(STRATEGIES.map(x=>x.barrier))];
 const shown=STRATEGIES.filter(x=>selected==='All'||x.barrier===selected);
 return '<section class="support-strategy-library"><div class="support-section-head"><div>'+
  '<div class="eyebrow">TLF · UDL · MTSS</div><h3>Classroom Strategy Library</h3>'+
  '<p>Select a learning barrier, then record a strategy for the classroom team to consider.</p></div>'+
  '<label class="support-lead-manager">Access Barrier<select data-support-barrier>'+
  options.map(x=>'<option value="'+e(x)+'"'+(selected===x?' selected':'')+'>'+e(x)+'</option>').join('')+
  '</select></label></div><div class="support-library-grid">'+shown.map(x=>
  '<article><small>'+e(x.barrier)+'</small><h4>'+e(x.title)+'</h4><p>'+e(x.how)+'</p>'+
  '<div>'+pill('TLF · '+x.facet)+pill('UDL · '+x.udl)+'</div>'+
  '<p class="support-library-check"><b>Evidence to review:</b> '+e(x.check)+'</p>'+
  '<button type="button" class="support-small-button" data-support-use-strategy="'+e(x.id)+
   '" data-support-strategy-student="'+e(student.id)+'">Add Shared Strategy to Demo Notes</button></article>').join('')+'</div>'+
  '<p class="support-small-note">These are illustrative approaches for professional consideration, not prescribed interventions. UDL domains are broad design connections, not clinical classifications.</p></section>';
}
function renderMeetingPrep(student,record,entries){
 const plan=supportForStudent(entries,student.id).find(x=>x.type==='plan'&&x.status==='Active');
 const actions=supportForStudent(entries,student.id).filter(x=>x.type==='action'&&x.status==='Open');
 const iv=interventionFor(student,new Map([[student.id,record]]),entries);
 const voice=learnerPerspective(student,entries);
 const referral=supportForStudent(entries,student.id).find(x=>x.type==='referral');
 return '<details class="support-meeting-prep"><summary><strong>Meeting Preparation Brief</strong>'+
 '<small>Existing evidence assembled in one printable view</small></summary>'+
 '<div class="support-briefprint"><h3>SST Discussion Brief · Fictional Demo</h3><p><b>Learner:</b> '+e(student.name)+
 ' · '+e(student.grade)+' · <b>Case manager:</b> '+e(managerFor(student))+
 ' · <b>Review:</b> '+fmt(record.reviewDate)+'</p>'+
 '<dl><dt>Strengths and Access Focus</dt><dd>'+e(record.focus.goal)+'</dd>'+
 '<dt>Current Plan / Classroom Strategies</dt><dd>'+e(plan?.accommodations||record.focus.strategy)+'</dd>'+
 '<dt>Monitoring Evidence</dt><dd>'+e(iv.title)+' — '+iv.baseline+' to '+iv.latest+' / 5 across six sample observations; target '+iv.target+' / 5</dd>'+
 '<dt>Outstanding Actions</dt><dd>'+e(actions.map(x=>x.summary).join('; ')||'None recorded')+'</dd>'+
 '<dt>Learner Perspective</dt><dd>'+e(voice.helps)+' '+e(voice.try)+'</dd>'+
 '<dt>Referral Status</dt><dd>'+e(referral?lastReferralStage(referral):'No referral in this example')+'</dd>'+
 '<dt>Decision for Discussion</dt><dd>Continue, adapt, intensify or fade support based on the full evidence and team judgement.</dd></dl></div>'+
 '<button type="button" class="support-new" data-support-print>Print Brief</button></details>';
}
export function renderSSSPlans(student,record,entries,strategyFilter='All'){
 return '<section class="support-plans-panel"><div class="support-section-head"><div><div class="eyebrow">ONE COORDINATED SUPPORT CYCLE</div>'+
 '<h2>Plans, Progress & Team Decisions</h2><p>Review what is being delivered, what has changed, and what to do next.</p></div>'+
 '<button type="button" class="support-new primary" data-support-new="'+e(student.id)+'" data-support-type="plan">+ Support Plan</button></div>'+
 renderProgress(student,record,entries)+renderReferrals(student,entries)+
 renderMeetingPrep(student,record,entries)+renderVoice(student,entries)+renderStrategies(student,strategyFilter)+'</section>';
}
