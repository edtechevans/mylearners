/** Transparent, non-diagnostic Student Experience explanation.
 * Pure HTML renderer: the application supplies the actual selected learners and period.
 * This never fetches data, changes a score, or infers educational recommendations.
 */
const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const fmt=value=>Number.isFinite(value)?String(value):'—';
const bound=value=>Math.max(0,Math.min(100,Number(value)||0));
export function experienceDialogContent({metric='engagement',scopeLabel='Selected learners',
 windowLabel='Fall 2026',summary={value:null,n:0,eligible:0},questions=[],individual=false}={}){
 if(!['engagement','belonging'].includes(metric))throw Error('Unknown student-experience measure');
 const label=metric==='engagement'?'Engagement':'Belonging';
 const color=metric==='engagement'?'engagement':'belonging';
 const coverage=(individual?'Individual fictional check-in':fmt(summary.n)+' of '+fmt(summary.eligible)+' eligible learners responded');
 const basis=individual?'The learner index is the rounded mean of the three question scores.':
  'Each learner receives the rounded mean of their three question scores. The group index is the rounded mean of those learner indices.';
 const cards=questions.map((q,index)=>{
  const points=individual?q.points:q.value;
  const num=Number.isFinite(points)?fmt(points)+' / 100':'Not available';
  const extra=individual?
   '<span class="experience-answer">Response: '+esc(q.label||'Not recorded')+'</span>':
   '<span class="experience-answer">'+(Number.isFinite(q.favorable)?fmt(q.favorable)+'% answered Agree or Strongly agree':'No responses')+
   ' · '+fmt(q.n)+' responses</span>';
  return '<li class="experience-question">'+
   '<div class="experience-question-head"><span><b>'+String(index+1)+'.</b> '+esc(q.question)+'</span>'+
   '<strong>'+num+'</strong></div>'+
   '<div class="experience-progress" aria-hidden="true"><span style="width:'+bound(points)+'%"></span></div>'+
   extra+'</li>';
 }).join('');
 return '<div class="experience-modal-top">'+
  '<div><span class="experience-eyebrow">STUDENT EXPERIENCE · MEASURE EXPLAINED</span>'+
  '<h2 id="experience-dialog-title">How '+label+' Is Calculated</h2>'+
  '<p id="experience-dialog-desc">A transparent breakdown of the fictional '+esc(windowLabel)+' check-in.</p></div>'+
  '<button type="button" class="experience-modal-close" data-experience-close aria-label="Close explanation">×</button></div>'+
  '<div class="experience-modal-content '+color+'">'+
  '<div class="experience-score-band"><div><span class="experience-score-label">'+label+' index</span>'+
  '<div class="experience-score">'+fmt(summary.value)+'<small> / 100</small></div></div>'+
  '<div class="experience-score-context"><strong>'+esc(scopeLabel)+'</strong>'+
  '<span>'+esc(windowLabel)+'</span><span>'+coverage+'</span></div></div>'+
  '<h3>How the number is calculated</h3>'+
  '<p>Students respond to <strong>three statements</strong> about '+(metric==='engagement'?
  'interest, participation and engagement in learning.':'feeling welcome, respected and supported at school.')+'</p>'+
  '<div class="experience-scale" aria-label="Response points">'+
   '<span>Strongly disagree<b>0</b></span><span>Disagree<b>33</b></span>'+
   '<span>Agree<b>67</b></span><span>Strongly agree<b>100</b></span></div>'+
  '<p><strong>Calculation:</strong> '+basis+' Results are rounded to whole numbers.</p>'+
  '<h3>Breakdown by question</h3>'+
  '<ol class="experience-questions">'+cards+'</ol>'+
  '<p class="experience-method-note">Question scores are displayed as rounded values. Group scores use the individual indices, so averaging the displayed question scores might differ by one point because of rounding.</p>'+
  '<div class="experience-warning"><strong>Important:</strong> '+label+' is an exploratory, AISG-created check-in index. It is <strong>not</strong> the percentage of students agreeing, a grade, a validated wellbeing assessment, or a label for a learner. The question wording differs between Elementary and Secondary; compare like with like.</div>'+
  '<div class="experience-modal-foot"><span>Fictional demonstration data · Grades 3–12 only</span>'+
  '<button type="button" data-experience-close class="experience-done">Done</button></div>'+
  '</div>';
}
