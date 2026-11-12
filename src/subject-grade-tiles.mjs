/** Compact current-year subject snapshots shared by Faculty and Student profiles.
 * Visuals reuse the exact numeric grade bands already used by the roster.
 * MYP 1-3 criterion results are a best-fit projection, never an issued grade.
 */
import {gradeNumber} from './data.mjs';
import {academicFor,facultyDemoReport} from './academic-journey-data.mjs';
import {MYP_CRITERIA,mypBestFit} from './myp-best-fit.mjs';
import {reportGradeBand} from './report-card-signals.mjs';

const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const validScore=value=>value===null||value===undefined||String(value).trim()===''?null:
  Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=8?Number(value):null;

function gradeDetails(item,isMyp){
 if(!isMyp)return {value:item.value??null,projected:false,count:null,criteria:[]};
 const byCriterion=new Map((item.criteria||[]).map(x=>[x.criterion,validScore(x.score)]));
 const criteria=MYP_CRITERIA.map(key=>({key,score:byCriterion.get(key)??null}));
 const fit=mypBestFit(criteria.map(x=>x.score));
 return {value:fit.grade===null?null:String(fit.grade),
  projected:fit.provisional&&fit.grade!==null,count:fit.criteriaCount,criteria};
}
function precedingIssued(record,current,subject){
 return (record.reports||[]).filter(r=>r.issued===true&&r.framework===current.framework&&r.scale===current.scale)
  .map(r=>({report:r,item:r.subjects.find(x=>x.subject===subject)}))
  .find(x=>x.item&&x.item.value!==null&&x.item.value!==undefined)||null;
}
function marker(projected){
 return projected?'<sup class="myp-best-fit-marker sg-asterisk" aria-label=" projected grade" title="Projected from fewer than four assessed MYP criteria">*</sup>':'';
}
function criteriaMarkup(details){
 if(!details.criteria.length)return '';
 return '<div class="sg-criteria" role="group" aria-label="Current MYP criteria, each scored out of eight">'+
  details.criteria.map(x=>'<div class="sg-criterion'+(x.score===null?' is-missing':'')+'"'+
   ' aria-label="Criterion '+x.key+': '+(x.score===null?'not yet assessed':x.score+' out of 8')+'">'+
   '<span>'+x.key+'</span><strong>'+(x.score===null?'—':x.score)+'</strong></div>').join('')+
  '</div><div class="sg-coverage" aria-label="'+details.count+' of four criteria assessed">'+
  '<span class="sg-coverage-bar" aria-hidden="true">'+details.criteria.map(x=>
   '<i class="'+(x.score===null?'':'is-assessed')+'"></i>').join('')+'</span>'+
  '<span>'+details.count+'/4 criteria assessed</span></div>';
}
function subjectCard(item,record,working,isMyp){
 const details=gradeDetails(item,isMyp);
 const grade=details.value===null||String(details.value).trim()===''?'—':String(details.value);
 const band=reportGradeBand(details.value,working.scale)||'sg-neutral';
 const previous=precedingIssued(record,working,item.subject);
 const status=details.projected?'Projected grade':isMyp&&details.count===4?'Current best fit':'Current result';
 const previousMarkup=previous?
  '<div class="sg-comparison"><span>Last issued · '+esc(previous.report.year)+'</span>'+
  '<strong>'+esc(previous.item.value)+'</strong><span aria-hidden="true">→</span>'+
  '<span>Current</span><strong>'+esc(grade)+marker(details.projected)+'</strong></div>':
  '<div class="sg-comparison sg-comparison-empty">No comparable earlier subject report</div>';
 return '<article class="sg-card '+band+'">'+
  '<div class="sg-card-head"><h3>'+esc(item.subject)+'</h3>'+
  '<div class="sg-grade-box" aria-label="'+esc(item.subject)+': '+esc(grade)+(details.projected?', projected':'')+'">'+
  '<strong>'+esc(grade)+marker(details.projected)+'</strong>'+
  '<small>'+esc(status)+'</small></div></div>'+
  criteriaMarkup(details)+
  (!isMyp?'<p class="sg-current-context">'+esc(working.framework)+' · '+esc(working.grade)+'</p>':'')+
  previousMarkup+'</article>';
}
export function renderSubjectGradeTiles(student,records,studentRole=false){
 const record=academicFor(records,student?.id);
 const working=facultyDemoReport(record);
 if(!working?.subjects?.length)return '';
 const n=gradeNumber(student.grade);
 const isMyp=n>=6&&n<=10&&working.framework==='IB MYP';
 const numeric=working.scale==='1–7';
 return '<section class="sg-section" aria-label="'+(studentRole?'My current subject grades':'Current subject grades and progress')+'">'+
  '<div class="sg-heading"><div><span class="sg-eyebrow">'+
  (studentRole?'MY LEARNING':'ACADEMIC OVERVIEW')+'</span>'+
  '<h2>'+(studentRole?'My subjects & progress':'Subject grades & progress')+'</h2>'+
  '<p>'+esc(working.year)+' · '+esc(working.framework)+
  ' · Current-year assessment snapshot (not an issued report)</p></div>'+
  (numeric?'<div class="sg-band-legend" aria-label="Subject grade bands">'+
   '<span class="sg-legend-title">GRADE BANDS</span>'+
   '<span class="sg-legend band-low">1–3</span>'+
   '<span class="sg-legend band-mid-low">4</span>'+
   '<span class="sg-legend band-mid-high">5–6</span>'+
   '<span class="sg-legend band-high">7</span></div>':'')+
  '</div><div class="sg-grid">'+
  working.subjects.map(item=>subjectCard(item,record,working,isMyp)).join('')+'</div>'+
  (isMyp?'<p class="sg-note"><strong>* Projected grade.</strong> For Grades 6–10, when only one, two or three MYP criteria have been assessed, the available criterion scores are scaled to a total out of 32 and converted to a whole-number 1–7 best fit. Missing criteria are not treated as zero. Four assessed criteria have no asterisk. These are not final report grades.</p>':
   '<p class="sg-note">Current-year results are shown separately from previously issued report cards. Programme grading scales are not interchangeable.</p>')+
  '</section>';
}
