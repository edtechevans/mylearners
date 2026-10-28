/** Executive-level Student Support section. Fictional counts only, no case details. */
import {studentSupportLeadershipSummary} from './leader-support-summary.mjs';
import {esc} from './v2-ui.mjs';
const safe=v=>esc(String(v??''));
const n=(value)=>Number.isFinite(value)?value.toLocaleString('en-GB'):'—';
const percent=value=>value===null||value===undefined?'—':value+'%';
const bar=(name,value,detail)=>'<div class="leader-support-bar-row">'+
 '<div class="leader-support-bar-head"><strong>'+safe(name)+'</strong>'+
 '<span>'+safe(detail)+'</span></div>'+
 '<div class="leader-support-track" role="img" aria-label="'+safe(name)+': '+safe(detail)+'">'+
 '<i style="width:'+Math.max(0,Math.min(100,value||0))+'%"></i></div></div>';

export function renderLeaderSupportSection({students,sssRecords,entries,open=false}){
 const metrics=studentSupportLeadershipSummary(students,sssRecords,entries);
 const {suppressed,cohort,scopeSize}=metrics;
 const metric=(label,value,context)=>'<article class="leader-support-metric"><span>'+safe(label)+'</span>'+
  '<strong>'+safe(value)+'</strong><small>'+safe(context)+'</small></article>';
 if(!scopeSize)return '<section class="leader-section leader-support" aria-label="Student Support">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">COORDINATED SUPPORT</div>'+
  '<h2>Student Support</h2><p>No fictional learners match this selection.</p></div></div></section>';
 if(suppressed)return '<section class="leader-section leader-support" aria-label="Student Support">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">COORDINATED SUPPORT</div>'+
  '<h2>Student Support</h2><p>Schoolwide patterns in support, access and follow-through.</p></div>'+
  '<span class="leader-period">Fictional SSS records · Oct 2026</span></div>'+
  '<p class="leader-support-private">This selection is too small for a meaningful aggregate Student Support summary. '+
  'Choose a wider grade, division or schoolwide view. No individual student cases are shown here.</p></section>';
 const headline='<div class="leader-support-kpis">'+
  metric('Learners Receiving Support',n(cohort),
   cohort+' of '+scopeSize+' selected learners · '+percent(metrics.cohortRate)+' in illustrative SSS cohort')+
  metric('Upcoming Reviews',n(metrics.reviewsDue),'Within next 30 days · of '+cohort+' supported')+
  metric('Follow-ups Completed',percent(metrics.actionCompletionRate),
   metrics.actionCompleted+' of '+metrics.actionTotal+' recorded actions · '+metrics.actionOpen+' remain open')+
  metric('Monitoring at Sample Target',percent(metrics.atTargetRate),
   metrics.atTarget+' of '+metrics.monitored+' illustrative progress series')+
  '</div>';
 const weekly='<div class="leader-support-subpanel"><h3>Intervention Monitoring</h3>'+
  '<p>Percentage of fictional short-cycle series meeting their own example goal, by monitoring week.</p>'+
  '<div class="leader-support-weeks">'+metrics.weekly.map(item=>
   '<div class="leader-support-week"><span>Week '+item.week+'</span>'+
   '<div class="leader-support-track" role="img" aria-label="Week '+item.week+': '+
   percent(item.share)+' of '+item.available+' monitored series meeting their sample target">'+
   '<i style="width:'+Math.max(0,Math.min(100,item.share||0))+'%"></i></div>'+
   '<strong>'+percent(item.share)+'</strong></div>').join('')+'</div>'+
  '<small>Illustrative observations only, not a validated effect of intervention or a comparison of learner ability. '+
  'Each series uses its own explicitly stated measure and sample goal.</small></div>';
 const stages=metrics.referralStages.filter(x=>x.count>0);
 const process='<div class="leader-support-subpanel"><h3>Review & Referral Cycle</h3>'+
  '<div class="leader-support-process-list">'+
  '<div><span>Referrals awaiting team consideration</span><strong>'+metrics.referralPending+' / '+metrics.referralTotal+'</strong></div>'+
  '<div><span>Action items still open</span><strong>'+metrics.actionOpen+' / '+metrics.actionTotal+'</strong></div>'+
  '<div><span>Intervention review decisions recorded</span><strong>'+metrics.reviewDecisions+'</strong></div></div>'+
  (stages.length?'<h4>Illustrative Referral Stages</h4>'+
   '<div class="leader-support-stages">'+stages.map(x=>
    '<div><span>'+safe(x.stage)+'</span><strong>'+x.count+'</strong></div>').join('')+'</div>':
   '<p>No referral examples in this selected group.</p>')+
  '</div>';
 const evidence='<div class="leader-support-subpanel"><h3>Support Record Coverage</h3>'+
  '<p>How completely the fictional SSS support cycle is documented—not a measure of instructional quality.</p>'+
  metrics.readiness.map(x=>bar(x.label,x.rate,x.count+' of '+x.denominator+' supported learners · '+percent(x.rate))).join('')+'</div>';
 const pathways='<div class="leader-support-subpanel"><h3>Support Pathways</h3>'+
  '<p>Service membership in the fictional SSS cohort. A learner may be part of more than one stream.</p>'+
  metrics.streamCounts.map(x=>bar(x.label,Math.round(100*x.count/cohort),
   x.count+' of '+cohort+' supported learners')).join('')+'</div>';
 const division=metrics.divisions.length?'<div class="leader-support-subpanel leader-support-wide">'+
  '<h3>Elementary & Secondary</h3>'+
  '<p>Division-level context shown only for sufficiently large selections.</p>'+
  '<div class="leader-support-division-grid">'+metrics.divisions.map(x=>
   '<article><strong>'+safe(x.name)+'</strong>'+
    (x.suppressed?'<p>Small-group data not shown.</p>':
    '<p>'+x.cohort+' of '+x.scopeSize+' learners in this fictional SSS cohort</p>'+
    '<dl><div><dt>Reviews due</dt><dd>'+x.reviewsDue+'</dd></div>'+
    '<div><dt>Actions completed</dt><dd>'+percent(x.actionCompletionRate)+'</dd></div>'+
    '<div><dt>Series at sample target</dt><dd>'+x.atTarget+' / '+x.monitored+'</dd></div></dl>')+
   '</article>').join('')+'</div></div>':'';
 const questions='<div class="leader-support-inquiry"><h3>Questions for Leadership Inquiry</h3><ul>'+
  metrics.inquiry.map(q=>'<li>'+safe(q)+'</li>').join('')+'</ul></div>';
 return '<section class="leader-section leader-support" aria-labelledby="leader-support-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">COORDINATED SUPPORT</div>'+
  '<h2 id="leader-support-title">Student Support</h2>'+
  '<p>Support coverage, follow-through and progress-monitoring context.</p></div>'+
  '<span class="leader-period">Fictional support cycle · 28 Oct 2026</span></div>'+
  headline+
  '<p class="leader-support-caption">Counts reflect the division, grade and class filters above. '+
  'The SSS cohort is synthetic and separate from classroom support tags. No individual notes or case identities are exposed.</p>'+
  '<details class="leader-detail leader-support-detail" data-leader-panel="support"'+(open?' open':'')+'>'+
  '<summary><span><strong>Explore support processes & progress</strong>'+
  '<small>Referral stages · monitoring series · documentation coverage · division patterns</small></span>'+
  '<span class="leader-detail-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="leader-detail-body"><div class="leader-support-deep-grid">'+weekly+process+evidence+pathways+division+
  '<div class="leader-support-wide">'+questions+'</div></div>'+
  '<p class="leader-support-disclaimer">Interpretation: These figures describe fictional operational records, '+
  'not safeguarding, diagnoses, treatment, intervention effectiveness or genuine AISG performance. '+
  'Leadership uses aggregates only; case management and personal notes remain in the SSS demo view.</p>'+
  '</div></details></section>';
}
