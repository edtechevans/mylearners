/** Leaders' report-card inquiry list. Read-only fictional student evidence. */
import {leaderReportSignalSummary,reportGradeBand} from './report-card-signals.mjs';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const pill=(x,scale)=>{
 const band=reportGradeBand(x.value,scale)||'';
 return '<span class="leader-report-subject"><span>'+esc(x.subject)+'</span>'+
  '<b class="report-grade-chip '+band+'">'+esc(x.value)+'</b></span>';
};
export function renderLeaderReportFollowup({students,academic,scope='secondary',
 query='',multiple=false,expanded=false}={}){
 const all=students||[];
 const secondaryAvailable=all.some(s=>s.division==='Secondary');
 const secondary=scope==='secondary'&&secondaryAvailable;
 const scoped=secondary?all.filter(s=>s.division==='Secondary'):all;
 const summary=leaderReportSignalSummary(scoped,academic);
 const q=String(query||'').trim().toLocaleLowerCase();
 const matching=summary.rows.filter(x=>
  (!multiple||x.low.length>=2)&&(!q||
   [x.student.name,x.student.grade,x.student.classId,
    ...x.low.map(s=>s.subject)].join(' ').toLocaleLowerCase().includes(q)));
 const shown=expanded?matching:matching.slice(0,12);
 const scopeButton=(id,label)=>'<button type="button" data-leader-report-scope="'+id+
  '" aria-pressed="'+(secondary?(id==='secondary'):(id==='all'))+'">'+label+'</button>';
 const table=shown.length?
  '<div class="leader-report-tablewrap"><table class="leader-report-roster"><thead><tr>'+
  '<th scope="col">Learner</th><th scope="col">Current class</th>'+
  '<th scope="col">Test subjects graded 1–3</th><th scope="col">Count</th>'+
  '<th scope="col">Test report</th></tr></thead><tbody>'+
  shown.map(x=>'<tr><th scope="row"><strong>'+esc(x.student.name)+'</strong></th>'+
   '<td>'+esc(x.student.grade)+' · '+esc(x.student.classId)+'</td>'+
   '<td><div class="leader-report-subjects">'+x.low.map(item=>pill(item,x.report.scale)).join('')+'</div>'+
   '<details class="leader-report-all"><summary>All '+x.outcomes.length+
   ' test subjects</summary><div class="leader-report-subjects">'+
   x.outcomes.map(item=>pill(item,x.report.scale)).join('')+'</div></details></td>'+
   '<td data-ux-sort-value="'+x.low.length+'"><strong>'+x.low.length+'</strong></td>'+
   '<td><strong>'+esc(x.report.year)+'</strong><small>'+esc(x.report.grade)+
   ' · '+esc(x.report.framework)+'</small></td></tr>').join('')+
  '</tbody></table></div>':
  '<p class="leader-report-empty">'+(summary.numericReports?
    'No learners match the current review filters.':
    'No numeric 1–7 test report grades apply to this selection. '+
    'Elementary test reports use developmental descriptors and are not converted into numbers.')+'</p>';
 return '<section class="leader-section leader-report-followup" aria-labelledby="leader-report-followup-title">'+
  '<div class="leader-sectionhead"><div><div class="eyebrow">REPORT CARD INQUIRY</div>'+
  '<h2 id="leader-report-followup-title">Grades 3 and below</h2>'+
  '<p>Find learners with one or more grades of 1–3 across their current-year synthetic report subjects.</p></div>'+
  '<span class="leader-period">2026–27 TEST GRADES · Not issued</span></div>'+
  '<div class="leader-report-topline"><div class="leader-report-count">'+
  '<strong>'+summary.flagged+'</strong><span>learners to review</span></div>'+
  '<div class="leader-report-count"><strong>'+summary.lowSubjectResults+
  '</strong><span>subject results at 3 or below</span></div>'+
  '<div class="leader-report-coverage"><strong>'+summary.numericReports+' / '+summary.selected+
  '</strong><span>learners with complete 1–7 test grades in this selection</span></div></div>'+
  '<div class="leader-report-toolbar"><div class="leader-report-scope" role="group" aria-label="Report review scope">'+
  scopeButton('secondary','Secondary focus')+scopeButton('all','All selected')+'</div>'+
  '<label class="leader-report-search">Find a learner or subject<input type="search" data-leader-report-query '+
  'value="'+esc(query)+'" placeholder="Name, class or subject" aria-label="Search report follow-up learners"></label>'+
  '<button class="leader-report-multiple" type="button" data-leader-report-multiple aria-pressed="'+multiple+'">'+
  'Two or more subjects</button></div>'+
  '<p class="leader-report-list-count">'+matching.length+' matching learners'+
  (matching.length>shown.length?' · first '+shown.length+' shown':'')+'</p>'+
  table+
  (matching.length>12?'<button class="leader-report-expand" type="button" data-leader-report-expand>'+
   (expanded?'Show first 12':'Show all '+matching.length+' learners')+'</button>':'')+
  '<p class="leader-data-note">This is a prompt to examine learning evidence, not an automatic risk label. '+
  'Only synthetic 2026–27 current-grade test results are used for each learner; '+
  'Elementary developmental descriptors are not treated as 1–7 grades. '+
  'Test subjects and the reporting period are shown; these are not issued results and programme scales are never averaged. '+
  'Student names and results in this public demo are fictional.</p></section>';
}
