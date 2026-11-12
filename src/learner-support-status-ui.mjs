/** Compact, consistent support-status UI for staff-facing demo workspaces. */
import {supportStatusForStudent,SUPPORT_STATUS_FILTERS,supportStatusCounts} from './learner-support-status.mjs';
import {esc} from './v2-ui.mjs';

const DEMO_NOTE='Demonstration reference only. Confirm meanings and actions with the authorised school team.';
const EAL_DESCRIPTIONS=Object.freeze({
 'eal-e1':'Emergent 1 is an English-language development stage in the EAL reference. It does not describe subject ability or a learning difficulty.',
 'eal-e2':'Emergent 2 is an English-language development stage in the EAL reference. It does not describe subject ability or a learning difficulty.',
 'eal-i3':'Intermediate 3 is an English-language development stage in the EAL reference. It is distinct from Learning Support tiers.',
 'eal-i4':'Intermediate 4 is an English-language development stage in the EAL reference. It is distinct from Learning Support tiers.',
 'eal-a5':'Advanced 5 is an English-language development stage in the EAL reference. It is not an academic grade.',
 'eal-monitor-y1':'First year of EAL monitoring in this reference. Monitoring is recorded separately from active EAL development stages.',
 'eal-monitor-y2':'Second year of EAL monitoring in this reference. Confirm the monitoring and exit criteria with the EAL team.',
 'eal-exited':'Previously received EAL support and is marked Exited in this example. This is not an active EAL placement.'
});
const SST_DESCRIPTIONS=Object.freeze({
 'sst-monitoring':'SST monitoring reference: the team is reviewing learning access and classroom strategies. Monitoring alone does not mean a formal intervention plan exists.',
 'sst-intervention':'Targeted intervention reference. Review the agreed strategy, goal and progress evidence in the authorised support record.',
 'sst-plan':'Indicates an SST/RTI support plan reference. A documented plan is different from receiving an intervention without a plan.',
 'sst-soc':'SOC is retained as an original reference code. Its school-specific definition has not been confirmed, so no status or action should be inferred.'
});
/** Explanations are about the reference labels, never about a real student. */
export function supportBadgeContext(badge,status=null){
 if(!badge)return null;
 let description='';
 if(badge.id==='learning')
  description='Learning Support is indicated in this demonstration. Classroom adjustments should be checked against the authorised team guidance.';
 else if(badge.id.startsWith('tier-'))
  description='A Learning Support tier reference (Tier '+badge.id.slice(5)+'). It is not a measure of learner ability; consult the school\'s tier definitions for service details.';
 else if(EAL_DESCRIPTIONS[badge.id])description=EAL_DESCRIPTIONS[badge.id];
 else if(SST_DESCRIPTIONS[badge.id])description=SST_DESCRIPTIONS[badge.id];
 else description='Additional learner support reference. Confirm its intended meaning with the relevant school team.';
 const duration=badge.id==='learning'&&status?.duration?
  ' Example support duration: '+status.duration+'.':'';
 const note=badge.id==='sst-soc'?
  'Definition pending · original code preserved for reference.':DEMO_NOTE;
 return {title:badge.fullName,description:description+duration,note};
}
export function legacyBadgeContext(tag){
 if(!tag)return null;
 const restricted=tag.restricted;
 return {
  title:tag.fullName,
  description:tag.summary,
  note:restricted?'Restricted category: use authorised school systems for any individual instructions. No confidential details appear in this demo.':DEMO_NOTE
 };
}
function tipBadge(label,context,classes='',interactive=true){
 if(!context)return '';
 const spoken=context.title+'. '+context.description+' '+context.note;
 return '<span class="support-status-badge has-context '+esc(classes)+
  '" data-support-tip="1" data-support-tip-title="'+esc(context.title)+
  '" data-support-tip-description="'+esc(context.description)+
  '" data-support-tip-note="'+esc(context.note)+
  '" aria-label="'+esc(spoken)+'"'+
  (interactive?' role="button" tabindex="0"':'')+'>'+esc(label)+'</span>';
}
/** interactive=false avoids focusable descendants inside whole-row buttons. */
export function supportStatusBadges(student,{compact=false,interactive=true}={}){
 const status=supportStatusForStudent(student);
 if(!status)return '';
 return '<span class="support-status-badges'+(compact?' is-compact':'')+
  '" aria-label="Illustrative support references">'+status.badges.map(b=>
   tipBadge(b.label,supportBadgeContext(b,status),
    'status-'+b.variant+' group-'+b.group,interactive)).join('')+'</span>';
}
/** Legacy IEP, Medical and Behavioural badges are retained without duplicating EAL/SS. */
export function legacySupportBadges(tags=[],{interactive=true}={}){
 return (tags||[]).filter(t=>['iep','medical','behavioural'].includes(t.id))
  .map(t=>tipBadge(t.label,legacyBadgeContext(t),'group-legacy legacy-'+t.id,interactive)).join('');
}
export function supportStatusDetails(student){
 const s=supportStatusForStudent(student);
 if(!s)return '';
 const line=(label,value)=>'<div class="support-status-detail-row"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';
 const eal={e1:'Emergent 1',e2:'Emergent 2',i3:'Intermediate 3',
  i4:'Intermediate 4',a5:'Advanced 5','monitor-y1':'Monitor Year 1',
  'monitor-y2':'Monitor Year 2',exited:'Exited','not-needed':'Not Needed'};
 const sst={ 'sst-monitoring':'SST Monitor','sst-intervention':'Targeted Intervention',
  'sst-plan':'SST/RTI Intervention Plan','sst-soc':'SOC (definition pending)'};
 return '<section class="support-status-profile" aria-label="Support reference summary">'+
  '<div class="support-status-profile-head"><div><span class="support-status-eyebrow">SUPPORT REFERENCES</span>'+
  '<h3>Learning, EAL & SST</h3></div><span class="support-status-demo-mark">Demo examples</span></div>'+
  '<div class="support-status-detail-grid">'+
  '<div><h4>Learning Support</h4>'+
  line('Support',s.hasLearning?'Learning Support':'Not indicated')+
  (s.tier?line('Tier','Tier '+s.tier):'')+
  (s.duration?line('Support duration',s.duration):'')+'</div>'+
  '<div><h4>EAL</h4>'+line('Language support stage',eal[s.eal]||'Not recorded')+'</div>'+
  '<div><h4>Student Support / SST</h4>'+
  (s.sst.length?s.sst.map(k=>line('Reference',sst[k]||k)).join(''):
   line('Reference','Not indicated'))+'</div></div>'+
  '<p class="support-status-footnote">Illustrative identifiers only. EAL is language development, not a learning difficulty. '+
  'These labels do not establish eligibility, diagnosis or actual support. Detailed records belong in authorised school systems.</p>'+
  '</section>';
}
export function supportStatusFilterControl(value='all',attr='data-faculty-support-filter'){
 return '<label class="support-status-filter-label">Support / EAL / SST '+
  '<select '+attr+' aria-label="Filter learners by support and EAL status">'+
  SUPPORT_STATUS_FILTERS.map(([id,label])=>'<option value="'+esc(id)+'"'+
   (value===id?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>';
}
export function supportStatusSummaryTiles(students){
 const c=supportStatusCounts(students);
 const tile=(label,n)=>'<span class="support-status-summary-tile" title="Demo cohort only">'+
  '<span>'+esc(label)+'</span><strong>'+n+'</strong></span>';
 return '<div class="support-status-summary" aria-label="Illustrative support status counts">'+
  tile('Learning Support',c.learning)+tile('Active EAL',c.ealActive)+
  tile('EAL monitoring',c.ealMonitoring)+tile('SST monitoring',c.sstMonitoring)+
  tile('Intervention',c.intervention)+tile('Support plans',c.supportPlan)+
  '</div>';
}
