/** Fictional Leaders' review cues. Never creates a learner risk rating or
 * combines wellbeing indices with achievement, grades or attendance.
 * Person-level lists must be rendered only inside the role-scoped Leaders division workspace.
 */
import {gradeNumber} from './data.mjs';
import {experienceEligible,experienceFor,EXPERIENCE_WINDOWS} from './experience-data.mjs';
import {MAP_RIT_SUBJECTS,mapRitBand,mapRitCurrent,mapRitDisplaySubject} from './map-rit-achievement.mjs';
import {renderStudentPhoto} from './student-photo-preview.mjs?v=20261111photo1';

export const VOICE_REVIEW_THRESHOLD=0;
export const MAP_REVIEW_BAND='low';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byGradeName=(a,b)=>gradeNumber(a.student.grade)-gradeNumber(b.student.grade)||
 a.student.name.localeCompare(b.student.name);
const index=v=>Number.isFinite(v)?v.toFixed(2):'—';
const windowLabel=key=>EXPERIENCE_WINDOWS.find(x=>x.key===key)?.label||'Selected check-in';
const gradeLabel=student=>student.grade==='K'?'K':student.grade;

/** Review when engagement OR belonging is 0 or below.
 * One missing index is never treated as zero, and eligibility starts in Grade 3.
 */
export function leaderVoiceReview(students,records,window='F26',threshold=VOICE_REVIEW_THRESHOLD){
 const cohort=(students||[]).filter(experienceEligible);
 const measured=cohort.map(student=>{
  const engagement=experienceFor(records,student.id,'engagement',window)?.value;
  const belonging=experienceFor(records,student.id,'belonging',window)?.value;
  const e=Number.isFinite(engagement)?engagement:null;
  const b=Number.isFinite(belonging)?belonging:null;
  const lowEngagement=e!==null&&e<=threshold;
  const lowBelonging=b!==null&&b<=threshold;
  return {student,engagement:e,belonging:b,lowEngagement,lowBelonging,
   both:lowEngagement&&lowBelonging};
 });
 const rows=measured.filter(x=>x.lowEngagement||x.lowBelonging).sort(byGradeName);
 return {
  window,threshold,eligible:cohort.length,
  responded:measured.filter(x=>x.engagement!==null||x.belonging!==null).length,
  engagementAvailable:measured.filter(x=>x.engagement!==null).length,
  belongingAvailable:measured.filter(x=>x.belonging!==null).length,
  engagementLow:measured.filter(x=>x.lowEngagement).length,
  belongingLow:measured.filter(x=>x.lowBelonging).length,
  bothLow:measured.filter(x=>x.both).length,
  rows
 };
}
/** Achievement band selection uses the NWEA-style quintiles (not RIT cutoffs).
 * A learner with one Red and one Orange subject appears only ONCE in "both".
 * Missing / unclassified assessments are excluded from every count.
 * Preserve the original Red-only wrapper for the existing deeper review.
 */
export const MAP_REVIEW_SELECTIONS=Object.freeze(['both','low','low-average']);
export function leaderMapBandReview(students,mapByStudent,window='F26',selection='both'){
 const chosen=MAP_REVIEW_SELECTIONS.includes(selection)?selection:'both';
 const cohort=(students||[]).filter(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10);
 const measured=cohort.map(student=>{
  const values=MAP_RIT_SUBJECTS.map(subject=>{
   const record=mapRitCurrent(mapByStudent?.[student.id]||[],subject,window);
   return record?{subject,rit:record.rit,percentile:record.percentile,
    band:mapRitBand(record.percentile)?.key||null}:null;
  }).filter(Boolean);
  const red=values.filter(x=>x.band==='low');
  const orange=values.filter(x=>x.band==='low-average');
  const hits=chosen==='low'?red:chosen==='low-average'?orange:[...red,...orange];
  return {student,results:values,red,orange,hits};
 });
 const rows=measured.filter(x=>x.hits.length).sort(byGradeName);
 return {window,selection:chosen,eligible:cohort.length,
  tested:measured.filter(x=>x.results.length).length,
  threeSubjects:measured.filter(x=>x.results.length===3).length,
  bandCounts:{
   red:measured.filter(x=>x.red.length).length,
   orange:measured.filter(x=>x.orange.length).length,
   both:measured.filter(x=>x.red.length||x.orange.length).length
  },
  subjectCounts:Object.fromEntries(MAP_RIT_SUBJECTS.map(subject=>
   [subject,rows.filter(x=>x.hits.some(t=>t.subject===subject)).length])),
  rows
 };
}
export function leaderMapRedReview(students,mapByStudent,window='F26'){
 return leaderMapBandReview(students,mapByStudent,window,'low');
}
function reviewList(items,render,kind){
 return '<ul class="leader-followup-list '+kind+'">'+items.map(row=>'<li class="leader-followup-item">'+
  '<div class="leader-followup-person">'+renderStudentPhoto(row.student,'leader')+
  '<div class="leader-followup-person-text"><strong>'+safe(row.student.name)+'</strong>'+
  '<small>'+safe(gradeLabel(row.student))+' · '+safe(row.student.classId||'Homeroom not specified')+'</small></div></div>'+
  render(row)+
  '<button type="button" class="leader-followup-open" data-leader-student="'+safe(row.student.id)+
  '" aria-label="Review evidence for '+safe(row.student.name)+'">Review learner <span aria-hidden="true">→</span></button>'+
 '</li>').join('')+'</ul>';
}
const voiceCell=(label,v,low)=>'<span class="leader-followup-index'+(low?' is-low':'')+'">'+
 '<small>'+safe(label)+'</small><strong>'+index(v)+'</strong></span>';
const voiceRow=row=>'<div class="leader-followup-evidence">'+
 voiceCell('Engagement',row.engagement,row.lowEngagement)+
 voiceCell('Belonging',row.belonging,row.lowBelonging)+
 (row.both?'<span class="leader-followup-both">Both measures ≤0</span>':'')+'</div>';
const mapRow=row=>'<div class="leader-followup-evidence leader-map-flags">'+
 row.red.map(result=>'<span class="leader-map-low-chip" title="Low achievement percentile band">'+
 '<strong>'+safe(mapRitDisplaySubject(result.subject))+'</strong>'+
 '<span>'+safe(result.rit)+' RIT · P'+safe(result.percentile)+'</span></span>').join('')+
 '</div>';
function rowsWithDisclosure(rows,render,kind){
 const visible=rows.slice(0,6),rest=rows.slice(6);
 return reviewList(visible,render,kind)+
  (rest.length?'<details class="leader-followup-more"><summary>Show remaining '+rest.length+
   ' learners</summary>'+reviewList(rest,render,kind)+'</details>':'');
}
export function renderLeaderVoiceReview({students,records,window='F26'}){
 const result=leaderVoiceReview(students,records,window);
 if(!result.eligible)return '';
 const count=result.rows.length;
 return '<section id="leader-experience-review" class="leader-followup-panel" aria-labelledby="leader-experience-review-title">'+
 '<div class="leader-followup-head"><div><span>STUDENT EXPERIENCE · LEARNER FOLLOW-UP</span>'+
 '<h3 id="leader-experience-review-title">Students to review</h3>'+
 '<p>Engagement or Belonging at 0 or below · '+safe(windowLabel(window))+'</p></div>'+
 '<strong class="leader-followup-total" aria-label="'+count+' learners to review">'+count+'</strong></div>'+
 '<div class="leader-followup-facts"><span><b>'+result.engagementLow+'</b> Engagement ≤0</span>'+
 '<span><b>'+result.belongingLow+'</b> Belonging ≤0</span>'+
 '<span><b>'+result.bothLow+'</b> Both</span>'+
 '<span>'+result.responded+' / '+result.eligible+' with a check-in</span></div>'+
 (count?rowsWithDisclosure(result.rows,voiceRow,'voice'):
  '<p class="leader-followup-empty">No available student indices in this selection are 0 or below. Missing responses are not treated as positive scores.</p>')+
 '<p class="leader-followup-caution">A low self-reported index is a prompt for a conversation, not a diagnosis, risk score or automatic referral. Review the specific questions, previous windows and learner context before deciding on support. All results here are fictional.</p></section>';
}
export function renderLeaderMapRedReview({students,map,window='F26'}){
 const result=leaderMapRedReview(students,map,window);
 if(!result.eligible)return '';
 const count=result.rows.length;
 return '<section id="leader-map-review" class="leader-followup-panel map" aria-labelledby="leader-map-review-title">'+
 '<div class="leader-followup-head"><div><span>MAP ACHIEVEMENT · LEARNER FOLLOW-UP</span>'+
 '<h3 id="leader-map-review-title">Students in the red percentile band</h3>'+
 '<p>One or more MAP subjects in the 1st–20th percentile · Fall 2026</p></div>'+
 '<strong class="leader-followup-total" aria-label="'+count+' learners with a Low achievement percentile">'+count+'</strong></div>'+
 '<div class="leader-followup-facts"><span><b>'+result.subjectCounts.Reading+'</b> Reading</span>'+
 '<span><b>'+result.subjectCounts.Mathematics+'</b> Math</span>'+
 '<span><b>'+result.subjectCounts['Language Usage']+'</b> Language Usage</span>'+
 '<span>'+result.tested+' / '+result.eligible+' with a current MAP test</span></div>'+
 (count?rowsWithDisclosure(result.rows,mapRow,'map'):
  '<p class="leader-followup-empty">No students with available Fall 2026 results are in the Low MAP achievement band for this selection. Missing tests are not classified.</p>')+
 '<p class="leader-followup-caution">Red represents the reported achievement percentile for that subject and term, not a fixed RIT cutoff, growth measure or permanent learner label. Check prior windows, learning strands and assessment conditions before deciding on a response. All results here are fictional.</p></section>';
}
