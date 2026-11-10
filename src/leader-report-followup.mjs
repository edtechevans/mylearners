/** Secondary-only report-grade inquiry, using read-only fictional test data. */
import {leaderReportSignalSummary,reportGradeBand} from './report-card-signals.mjs';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const BANDS=Object.freeze([
 {name:'3 or below',css:'band-low'},
 {name:'4',css:'band-mid-low'},
 {name:'5–6',css:'band-mid-high'},
 {name:'7',css:'band-high'}
]);
const pill=(x,scale)=>{
 const band=reportGradeBand(x.value,scale)||'';
 return '<span class="leader-report-subject"><span>'+esc(x.subject)+'</span>'+
  '<b class="report-grade-chip '+band+'">'+esc(x.value)+'</b></span>';
};
const distribution=(outcomes,scale)=>{
 const counts=BANDS.map(b=>outcomes.filter(item=>reportGradeBand(item.value,scale)===b.css).length);
 const description=BANDS.map((b,i)=>b.name+': '+counts[i]).join('; ');
 return '<div class="leader-report-fourband" role="group" aria-label="'+esc('Subject outcomes: '+description)+'">'+
  BANDS.map((b,i)=>'<span class="leader-report-band-count '+b.css+
   (counts[i]?'':' is-empty')+'" title="'+esc(b.name+': '+counts[i]+' subjects')+
   '" aria-label="'+esc(b.name+': '+counts[i]+' subjects')+'">'+counts[i]+'</span>').join('')+
  '</div>';
};
export function renderLeaderReportFollowup({students,academic,query='',multiple=false,expanded=false,threshold=3}={}){
 const activeThreshold=threshold===2?2:3;
 const summary3=leaderReportSignalSummary(students||[],academic,3);
 const summary2=leaderReportSignalSummary(students||[],academic,2);
 const summary=activeThreshold===2?summary2:summary3;
 const thresholdLabel=activeThreshold+' or below';
 const q=String(query||'').trim().toLocaleLowerCase();
 const matching=summary.rows.filter(x=>
  (!multiple||x.low.length>=2)&&(!q||
   [x.student.name,x.student.grade,x.student.classId,
    ...x.low.map(item=>item.subject)].join(' ').toLocaleLowerCase().includes(q)));
 const shown=expanded?matching:matching.slice(0,12);
 const legend='<div class="leader-report-legend" role="group" aria-label="Report subject colour key">'+
  '<strong>Subject result colours</strong>'+
  BANDS.map(b=>'<span class="leader-report-legend-chip '+b.css+'">'+esc(b.name)+'</span>').join('')+
  '<small>Numbers in each learner profile follow this order</small></div>';
 const table=shown.length?
  '<div class="leader-report-tablewrap"><table class="leader-report-roster"><thead><tr>'+
  '<th scope="col">Learner</th><th scope="col">Current class</th>'+
  '<th scope="col">Subjects at '+thresholdLabel+'</th><th scope="col">Total</th>'+
  '<th scope="col">All subject results</th><th scope="col">Test period</th>'+
  '</tr></thead><tbody>'+
  shown.map(x=>'<tr data-preview-student="'+esc(x.student.id)+'"><th scope="row"><strong>'+esc(x.student.name)+'</strong></th>'+
   '<td>'+esc(x.student.grade)+' · '+esc(x.student.classId)+'</td>'+
   '<td><div class="leader-report-subjects">'+x.low.map(item=>pill(item,x.report.scale)).join('')+'</div>'+
   '<details class="leader-report-all"><summary>View all '+x.outcomes.length+
   ' subjects</summary><div class="leader-report-subjects">'+
   x.outcomes.map(item=>pill(item,x.report.scale)).join('')+'</div></details></td>'+
   '<td data-ux-sort-value="'+x.low.length+'"><strong>'+x.low.length+'</strong></td>'+
   '<td>'+distribution(x.outcomes,x.report.scale)+'</td>'+
   '<td><strong>'+esc(x.report.year)+'</strong><small>'+esc(x.report.grade)+
   ' · '+esc(x.report.framework)+'</small></td></tr>').join('')+
  '</tbody></table></div>':
  '<p class="leader-report-empty">'+(summary.numericReports?
   'No learners match the current review filters.':
   'No numeric 1–7 test grades are available for this selection.')+'</p>';
 return '<section class="leader-section leader-report-followup" aria-labelledby="leader-report-followup-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">SECONDARY · SUBJECT RESULTS</div>'+
  '<h2 id="leader-report-followup-title">Students with '+thresholdLabel+'</h2>'+
  '<p>Find learners with at least one subject result of '+thresholdLabel+' in the 2026–27 test dataset.</p></div>'+
  '<span class="leader-period">2026–27 TEST DATA · Not issued</span></div>'+
  '<div class="leader-report-topline"><div class="leader-report-count">'+
  '<strong>'+summary.flagged+'</strong><span>learners to review</span></div>'+
  '<div class="leader-report-count"><strong>'+summary.lowSubjectResults+
  '</strong><span>subject results at '+thresholdLabel+'</span></div>'+
  '<div class="leader-report-coverage"><strong>'+summary.numericReports+' / '+summary.selected+
  '</strong><span>learners with complete numeric test data</span></div></div>'+
  legend+
  '<div class="leader-report-toolbar">'+
  '<div class="leader-report-thresholds" role="group" aria-label="Filter subject result threshold">'+
  '<button type="button" data-leader-report-threshold="3" aria-pressed="'+(activeThreshold===3)+
  '">3 or below <b>'+summary3.flagged+'</b></button>'+
  '<button type="button" data-leader-report-threshold="2" aria-pressed="'+(activeThreshold===2)+
  '">2 or below <b>'+summary2.flagged+'</b></button></div>'+
  '<label class="leader-report-search">Find a learner or subject<input type="search" data-leader-report-query '+
  'value="'+esc(query)+'" placeholder="Name, class or subject" aria-label="Search learners by name, class or subject"></label>'+
  '<button class="leader-report-multiple" type="button" data-leader-report-multiple aria-pressed="'+multiple+'">'+
  'Two or more subjects at '+thresholdLabel+'</button></div>'+
  '<p class="leader-report-list-count">'+matching.length+' matching learners'+
  (matching.length>shown.length?' · first '+shown.length+' shown':'')+'</p>'+
  table+
  (matching.length>12?'<button class="leader-report-expand" type="button" data-leader-report-expand>'+
   (expanded?'Show first 12':'Show all '+matching.length+' learners')+'</button>':'')+
  '<p class="leader-data-note">This section is available when a Secondary division, grade or class is selected. '+
  'Colours describe subject results, not learners. All results are synthetic 2026–27 examples, '+
  'not issued grades. Earlier historical reports remain separate.</p></section>';
}
