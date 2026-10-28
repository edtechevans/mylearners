/** Presentation for the fictional, session-only Student Support Hub. */
import {SUPPORT_TYPES,SUPPORT_AS_OF,supportForStudent,supportActions} from './support-workspace-data.mjs';
import {esc} from './v2-ui.mjs';

const clean=v=>esc(String(v??''));
const d=value=>{if(!value)return 'Not scheduled';const [y,m,day]=value.split('-').map(Number);
 return Number.isFinite(y)&&m&&day?new Date(Date.UTC(y,m-1,day)).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Not scheduled'};
const label=(name,value,type='text',hint='')=>
 '<label class="support-field"><span>'+name+'</span><input type="'+type+'" name="'+value+
 '"'+(type==='date'?' value="'+SUPPORT_AS_OF+'"':'')+' placeholder="'+clean(hint)+'"></label>';
const textField=(name,key,hint='')=>'<label class="support-field"><span>'+name+
 '</span><textarea name="'+key+'" rows="3" placeholder="'+clean(hint)+'"></textarea></label>';
const selectField=(name,key,choices)=>'<label class="support-field"><span>'+name+
 '</span><select name="'+key+'">'+choices.map(x=>'<option value="'+clean(x)+'">'+clean(x)+'</option>').join('')+'</select></label>';
const typePill=x=>'<span class="support-type support-type-'+clean(x.type)+'">'+clean(SUPPORT_TYPES[x.type]||'Case Note')+'</span>';
const statusPill=x=>['Active','Open','Under review','Completed'].includes(x.status)?
 '<span class="support-status '+(x.status==='Completed'?'is-complete':'')+'">'+clean(x.status)+'</span>':'';
const allowedTypes=Object.entries(SUPPORT_TYPES);
const showDetail=(name,value)=>value?'<div class="support-entry-detail"><strong>'+clean(name)+'</strong><p>'+clean(value)+'</p></div>':'';
const detailKeys=[
 ['category','Category'],['strengths','Student Strengths'],['barriers','Identified Barriers'],
 ['studentNeeds','Learning Access Needs'],['evidence','Evidence Reviewed'],
 ['previous','Previous Strategies'],['supports','Recommended Supports'],
 ['classroom','Classroom Recommendations'],['accommodations','Accommodations'],
 ['goals','Goals & Targets'],['services','Services Involved'],['progress','Progress Monitoring'],
 ['participants','Participants'],['actionItems','Action Items'],['nextStep','Next Steps'],
 ['owner','Person Responsible']
];
function entryCard(x,role){
 const own=x.source==='session';
 return '<article class="support-entry">'+
  '<div class="support-entry-meta">'+typePill(x)+statusPill(x)+
  (x.visibility==='restricted'?'<span class="support-private">Restricted example</span>':'<span class="support-shared">Shared with faculty</span>')+
  '<time datetime="'+clean(x.date)+'">'+d(x.date)+'</time></div>'+
  '<details class="support-entry-expand"><summary><span><strong>'+clean(x.title)+'</strong>'+
  '<small>'+clean(x.author)+' · '+clean(x.summary).slice(0,155)+(x.summary.length>155?'…':'')+
  '</small></span><span class="support-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="support-entry-body"><p>'+clean(x.summary)+'</p>'+
  '<div class="support-entry-fields">'+detailKeys.map(([k,label])=>showDetail(label,x[k])).join('')+'</div>'+
  (x.reviewDate?'<p class="support-review-caption">Review / due date · '+d(x.reviewDate)+'</p>':'')+
  '<div class="support-entry-actions">'+
  (x.type==='action'&&role==='sss'?'<button class="support-small-button" data-support-toggle="'+clean(x.id)+'">'+
    (x.status==='Completed'?'Reopen Action':'Mark Complete')+'</button>':'')+
  (own?'<button class="support-small-button" data-support-edit="'+clean(x.id)+'">Edit Demo Entry</button>'+
   '<button class="support-small-button support-danger" data-support-delete="'+clean(x.id)+'">Delete Demo Entry</button>':'')+
  '</div></div></details></article>';
}
const newButton=(id,type,title,primary=false)=>'<button type="button" class="support-new '+(primary?'primary':'')+
 '" data-support-new="'+clean(id)+'" data-support-type="'+clean(type)+'">'+
 (primary?'+ ':'')+clean(title)+'</button>';

export function renderFacultySupportPanel(student,entries,record){
 const shared=supportForStudent(entries,student.id,'faculty');
 const plan=shared.find(x=>x.type==='plan'&&x.status==='Active');
 const updates=shared.filter(x=>x.type==='note').slice(0,3);
 return '<section class="card support-faculty" id="faculty-student-support" aria-labelledby="faculty-support-heading">'+
  '<div class="support-section-head"><div><div class="eyebrow">COORDINATED CLASSROOM SUPPORT · DEMO</div>'+
  '<h2 id="faculty-support-heading">Student Support</h2>'+
  '<p>Classroom strategies and shared updates for this fictional learner.</p></div>'+
  newButton(student.id,'note','Add Classroom Note',true)+'</div>'+
  '<div class="support-faculty-grid"><article class="support-brief"><span class="support-caption">Current Classroom Approach</span>'+
  '<strong>'+(plan?clean(plan.title):'Universal classroom strategies')+'</strong>'+
  '<p>'+(plan?clean(plan.accommodations):'Responsive instruction, clear routines and feedback support classroom access.')+'</p>'+
  (record?'<small>Next team review · '+d(record.reviewDate)+'</small>':'<small>No current specialist plan in this fictional example</small>')+'</article>'+
  '<article class="support-brief"><span class="support-caption">Shared Support Updates</span>'+
  (updates.length?updates.map(x=>'<div class="support-faculty-update"><strong>'+clean(x.title)+'</strong>'+
   '<small>'+d(x.date)+'</small><p>'+clean(x.summary)+'</p></div>').join(''):
   '<p>No shared updates yet. Add a brief classroom note when useful.</p>')+'</article></div>'+
  '<p class="support-demo-caption">Fictional examples only. Restricted casework is not shown in Faculty. Notes entered here remain only in this browser session.</p></section>';
}
export function renderSupportDashboard(data,sssRecords,entries,students){
 const totals=supportActions(entries,students,sssRecords);
 const number=(title,value,caption)=>'<div class="support-dashboard-stat"><span>'+clean(title)+'</span>'+
 '<strong>'+value+'</strong><small>'+clean(caption)+'</small></div>';
 return '<div class="support-dashboard-metrics">'+
  number('Students Supported',totals.learners,'Fictional programme cohort')+
  number('Reviews Due',totals.reviews,'Through 27 Nov 2026')+
  number('Open Actions',totals.actions,'Pending demo follow-ups')+
  number('Active Plans',totals.plans,'Illustrative learning plans')+'</div>';
}
export function renderSSSWorkspace(student,entries,record,filter='all',query=''){
 const all=supportForStudent(entries,student.id);
 const plan=all.find(x=>x.type==='plan'&&x.status==='Active');
 const actions=all.filter(x=>x.type==='action');
 const open=actions.filter(x=>x.status==='Open');
 const f=['all',...Object.keys(SUPPORT_TYPES)].includes(filter)?filter:'all';
 const filtered=all.filter(x=>(f==='all'||x.type===f)&&(!query||
  [x.title,x.summary,x.author,x.category,x.owner].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase()))));
 return '<section class="support-workspace" aria-labelledby="support-workspace-title">'+
  '<div class="support-section-head"><div><div class="eyebrow">ONE LEARNER · CONNECTED SUPPORT</div>'+
  '<h2 id="support-workspace-title">Student Support Workspace</h2>'+
  '<p>Fictional support records, action ownership and a shared review cycle.</p></div>'+
  newButton(student.id,'note','New Entry',true)+'</div>'+
  '<div class="support-workspace-overview"><article class="support-brief"><span class="support-caption">Active Support Plan</span>'+
  '<strong>'+(plan?clean(plan.title):'No active plan in demo')+'</strong>'+
  '<p>'+(plan?clean(plan.summary):'Use New Entry to add a sample plan.')+'</p>'+
  '<small>Case Manager · '+clean(record?.caseManager||'SSS Demonstration Team')+'</small></article>'+
  '<article class="support-brief"><span class="support-caption">Goals & Review</span>'+
  '<strong>'+(plan?clean(plan.goals):'Set a learning access goal')+'</strong>'+
  '<p>Next review · '+d(record?.reviewDate)+'</p>'+
  '<small>Support Level · '+clean(record?.level||'Tier 1')+'</small></article>'+
  '<article class="support-brief"><span class="support-caption">Follow-up Actions</span>'+
  '<strong>'+open.length+' open of '+actions.length+' actions</strong>'+
  '<p>'+(open[0]?clean(open[0].summary):'No outstanding actions in this example.')+'</p>'+
  '<small>'+(open[0]?'Due '+d(open[0].reviewDate):'Review status recorded in timeline')+'</small></article></div>'+
  '<div class="support-flow" aria-label="Collaborative student support cycle">'+
  ['Identify','Plan','Support','Review'].map((word,i)=>'<span>'+(i+1)+' · '+word+'</span>').join('')+'</div>'+
  '<div class="support-timeline-header"><div><h3>Support History</h3>'+
  '<p>Search case notes, meetings, referrals, communication and plans.</p></div>'+
  '<div class="support-quick-add">'+
  allowedTypes.filter(([id])=>id!=='note').map(([id,name])=>newButton(student.id,id,'+ '+name)).join('')+
  '</div></div>'+
  '<div class="support-timeline-filters"><label>Entry Type<select data-support-filter>'+
  '<option value="all">All Entries</option>'+allowedTypes.map(([id,name])=>'<option value="'+id+'"'+(f===id?' selected':'')+'>'+name+'</option>').join('')+'</select></label>'+
  '<label>Search History<input type="search" data-support-query value="'+clean(query)+'" placeholder="Search support history…"></label></div>'+
  '<div class="support-timeline">'+
  (filtered.length?filtered.map(x=>entryCard(x,'sss')).join(''):
  '<div class="support-empty">No matching entries. Try a different search or create a new demo record.</div>')+
  '</div><p class="support-demo-caption">Demonstration only: invented entries and dates. New entries and action changes stay in this browser session. No actual notifications, files or external records are created.</p></section>';
}

const options=(choices,current)=>choices.map(x=>'<option value="'+clean(x[0])+'"'+(x[0]===current?' selected':'')+'>'+clean(x[1])+'</option>').join('');
const fieldsByType={
 note:()=>selectField('Note Type','category',['Classroom Observation','Positive Progress','Strategy Review','General Note'])+
  textField('Next Step (Optional)','nextStep','What should happen next?'),
 referral:()=>textField('Student Strengths','strengths','What is working well?')+
  selectField('Concern Category','category',['Learning Access','Academic','Engagement','Social-Emotional','Language Development'])+
  textField('Evidence Reviewed','evidence','What evidence has been considered?')+
  textField('Previous Strategies Attempted','previous','What has already been tried?')+
  textField('Recommended Next Step','nextStep','Suggested next action'),
 meeting:()=>selectField('Meeting Type','category',['Initial SST Meeting','Progress Review','Support Planning','Transition Review'])+
  label('Participants','participants','text','Staff participating in this meeting')+
  textField('Identified Barriers to Learning','barriers')+
  textField('Student Needs','studentNeeds','What does the learner need to access learning?')+
  textField('Recommended Supports','supports')+
  textField('Classroom Recommendations','classroom')+
  textField('Action Items','actionItems')+
  label('Person Responsible','owner','text','Assigned staff role')+
  textField('Caregiver Communication Summary','nextStep','If relevant, document a summary'),
 plan:()=>textField('Accommodations','accommodations','Approved classroom approaches')+
  textField('Goals & Targets','goals','Specific and reviewable goal')+
  textField('Services Involved','services')+
  textField('Progress Monitoring','progress','How will progress be reviewed?'),
 communication:()=>selectField('Communication Method','category',['Phone','Email','Meeting','Other'])+
  label('Person Communicating','owner','text','Staff role')+
  textField('Agreed Next Steps','nextStep'),
 action:()=>label('Assigned To','owner','text','Staff role or team')+
  textField('Action Details','actionItems','Describe the agreed follow-up'),
 review:()=>selectField('Team Decision','decision',['Continue','Adapt','Intensify','Fade Support'])+
  textField('Evidence Reviewed','evidence','What evidence supports the decision?'),
 voice:()=>textField('What Helps Me Learn','learnerHelps','A strength or helpful condition, in the learner’s words')+
  textField('What Feels Difficult','learnerHard','A barrier to access described by the learner')+
  textField('What I Would Like to Try','learnerTry','An approach the learner would like adults to consider')
};
export function renderSupportForm(form,student,entries){
 if(!form||!student)return '';
 const type=SUPPORT_TYPES[form.type]?form.type:'note';
 const existing=form.id?entries.find(x=>x.id===form.id&&x.source==='session'):null;
 const active=existing?.type||type;
 const role=form.role==='faculty'?'faculty':'sss';
 const choices=role==='faculty'?[['note','Classroom Note']]:Object.entries(SUPPORT_TYPES);

 return '<div class="support-overlay" data-support-overlay>'+
  '<div class="support-dialog" role="dialog" aria-modal="true" aria-labelledby="support-dialog-title" tabindex="-1">'+
  '<div class="support-dialog-top"><div><span class="eyebrow">MY LEARNERS · FICTIONAL CASEWORK</span>'+
  '<h2 id="support-dialog-title">'+(existing?'Edit Demo Entry':'Add Student Support Entry')+'</h2>'+
  '<p>'+clean(student.name)+' · '+clean(student.grade)+' · '+clean(student.classId)+'</p></div>'+
  '<button type="button" class="support-close" aria-label="Close entry form" data-support-cancel>×</button></div>'+
  '<form data-support-form data-support-student="'+clean(student.id)+'" data-support-role="'+role+'">'+
  '<div class="support-dialog-body"><div class="support-dialog-notice">Demo only · Use invented information. '+
  'This public site does not accept real student casework, notify staff or upload attachments.</div>'+
  '<div class="support-form-row"><label class="support-field"><span>Entry Type</span>'+
  '<select data-support-form-type name="type">'+options(choices,active)+'</select></label>'+
  '<label class="support-field"><span>Date</span><input type="date" name="date" value="'+clean(existing?.date||SUPPORT_AS_OF)+'" required></label></div>'+
  '<label class="support-field"><span>Title</span><input type="text" name="title" maxlength="160" required value="'+clean(existing?.title||'')+'" placeholder="'+clean(SUPPORT_TYPES[active])+'"></label>'+
  '<label class="support-field"><span>'+({note:'Classroom Note',referral:'Summary of Concern',meeting:'Meeting Summary',
    plan:'Learner Profile & Support Focus',communication:'Communication Summary',action:'Action Summary',review:'Intervention Review Summary',voice:'Learner Perspective Summary'}[active])+
  '</span><textarea name="summary" maxlength="2000" rows="4" required placeholder="Record factual, strengths-based information…">'+
  clean(existing?.summary||'')+'</textarea></label>'+
  '<div class="support-form-specific">'+fieldsByType[active]()+'</div>'+
  '<div class="support-form-row"><label class="support-field"><span>Review / Due Date (Optional)</span>'+
  '<input type="date" name="reviewDate" value="'+clean(existing?.reviewDate||'')+'"></label>'+
  (role==='sss'?'<label class="support-field"><span>Visibility (Demo)</span>'+
  '<select name="visibility">'+options([['restricted','SSS Only · Restricted'],['shared','Share Classroom Summary with Faculty']],existing?.visibility||'restricted')+
  '</select></label>':'<input type="hidden" name="visibility" value="shared">')+'</div>'+
  '<p class="support-form-footnote">Only shared entries appear in the fictional Faculty profile. '+
  'Role switching is a visual preview, not real authorisation. No email notifications are sent.</p></div>'+
  '<div class="support-dialog-footer"><button type="button" class="support-new" data-support-cancel>Cancel</button>'+
  '<button type="submit" class="support-new primary">Save Demo Entry</button></div>'+
  '</form></div></div>';
}
