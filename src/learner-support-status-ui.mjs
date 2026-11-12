/** Compact, consistent support-status presentation for staff-only demo workspaces. */
import {supportStatusForStudent,SUPPORT_STATUS_FILTERS,supportStatusCounts} from './learner-support-status.mjs';
import {esc} from './v2-ui.mjs';

export function supportStatusBadges(student,{compact=false}={}){
 const status=supportStatusForStudent(student);
 if(!status)return '';
 return '<span class="support-status-badges'+(compact?' is-compact':'')+
  '" aria-label="Illustrative support references">'+status.badges.map(b=>
   '<span class="support-status-badge status-'+esc(b.variant)+' group-'+esc(b.group)+
   '" title="'+esc(b.fullName)+' · demonstration only">'+esc(b.label)+'</span>').join('')+
  '</span>';
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
 const tile=(label,n,filter)=>'<span class="support-status-summary-tile" title="Demo cohort only">'+
  '<span>'+esc(label)+'</span><strong>'+n+'</strong></span>';
 return '<div class="support-status-summary" aria-label="Illustrative support status counts">'+
  tile('Learning Support',c.learning)+tile('Active EAL',c.ealActive)+
  tile('EAL monitoring',c.ealMonitoring)+tile('SST monitoring',c.sstMonitoring)+
  tile('Intervention',c.intervention)+tile('Support plans',c.supportPlan)+
  '</div>';
}
