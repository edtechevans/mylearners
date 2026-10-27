/** Student-facing beginning of My Learners: three understandable questions,
 * not a learner version of a staff data table. All data are fictional.
 */
import {gradeNumber,attendanceSummary} from './data.mjs';
import {academicFor} from './academic-journey-data.mjs';
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const isNumeric=s=>/^[1-7]$/.test(String(s));
function resultToRecognise(record){
 const report=record.reports?.[0];
 if(!report)return {name:'My learning',value:'',detail:'My first school report will appear after it is issued.',date:'No issued report yet'};
 const rank=v=>isNumeric(v)?Number(v):['Emerging','Developing','Applying','Extending'].indexOf(v)+1;
 const item=[...report.subjects].sort((a,b)=>rank(b.value)-rank(a.value))[0];
 return {name:item?.subject||'My learning',value:item?.value||'—',
  detail:'One result from my last issued school report',date:report.year+' · '+report.grade};
}
function recentCheckin(record,growth){
 for(const kind of ['ixl','core','fp']){
  const list=record[kind]||[];
  if(!list.length)continue;
  const latest=list.at(-1),previous=list.at(-2);
  if(kind==='ixl'){
   const delta=previous?latest.level-previous.level:null;
   return {title:'Mathematics check-in',
    value:delta!==null?(delta>0?'+':'')+delta+' points':String(latest.level),
    detail:delta!==null?'Change in IXL diagnostic level (not a grade)':'Latest IXL diagnostic level',
    date:latest.date};
  }
  if(kind==='core'){
   const delta=previous?latest.correct-previous.correct:null;
   return {title:'Reading skills check-in',
    value:delta!==null?(delta>0?'+':'')+delta+' items':latest.correct+'/50',
    detail:delta!==null?'Change in a fictional 50-item decoding check':'Latest fictional 50-item decoding check',
    date:latest.date};
  }
  if(kind==='fp')
   return {title:'Reading text level',value:'Level '+latest.level,
    detail:previous?'Earlier check: Level '+previous.level+' · not a grade':'Illustrative F&P text level · not a grade',date:latest.date};
 }
 if(gradeNumber(growth?.grade||'')>=3&&gradeNumber(growth?.grade||'')<=10&&growth?.status==='comparable')
  return {title:'MAP Mathematics growth',value:(growth.actual>=0?'+':'')+growth.actual+' RIT',
   detail:'Maths score-point change between comparable MAP tests',date:'Latest eligible MAP tests'};
 return {title:'My learning journey',value:'Keep exploring',
  detail:'My subject reports and learning evidence are available below.',date:'Recent learning'};
}
export function renderStudentOverview(student,records,{attendance,mathGrowth,reflectionDraft=''}={}){
 const n=gradeNumber(student.grade);
 const early=n<=2,primary=n>=3&&n<=5;
 const style=early?'early':primary?'primary':'secondary';
 const record=academicFor(records,student.id);
 const celebrate=resultToRecognise(record);
 const progress=recentCheckin(record,{...mathGrowth,grade:student.grade});
 const as=attendanceSummary(attendance||[]);
 const intro=early?'My learning, one step at a time.':
  primary?'Here is something I have learned—and how I am growing.':
  'A quick picture of achievement, recent progress and my next step.';
 const labels=early?['What I learned','My reading or maths','Something I want to try']:
 primary?['Something I did well','How I am growing','My next step']:
 ['A result to recognise','Recent learning progress','My next step'];
 return '<section class="student-landing student-stage-'+style+'" aria-label="My learning today">'+
  '<div class="student-landing-intro"><div><span class="student-overline">MY LEARNING TODAY</span>'+
  '<h2>Hello, '+esc(student.first)+'!</h2><p>'+esc(intro)+'</p></div>'+
  '<span class="student-demo-label">Fictional learning example</span></div>'+
  '<div class="student-landing-grid">'+
  '<article class="student-today-tile student-today-celebrate">'+
  '<span class="student-today-kicker"><span class="student-symbol" aria-hidden="true">✦</span>'+esc(labels[0])+'</span>'+
  '<strong class="student-today-title">'+esc(celebrate.name)+'</strong>'+
  (celebrate.value?'<span class="student-today-score">'+esc(celebrate.value)+'</span>':'')+
  '<p>'+esc(celebrate.detail)+'</p><small>'+esc(celebrate.date)+'</small></article>'+
  '<article class="student-today-tile student-today-progress">'+
  '<span class="student-today-kicker"><span class="student-symbol" aria-hidden="true">↗</span>'+esc(labels[1])+'</span>'+
  '<strong class="student-today-title">'+esc(progress.title)+'</strong>'+
  '<span class="student-today-score">'+esc(progress.value)+'</span>'+
  '<p>'+esc(progress.detail)+'</p><small>'+esc(progress.date)+'</small></article>'+
  '<section class="student-today-tile student-today-goal" aria-label="'+esc(labels[2])+'">'+
  '<span class="student-today-kicker"><span class="student-symbol" aria-hidden="true">◎</span>'+esc(labels[2])+'</span>'+
  '<label class="student-goal-label" for="reflection">'+
  esc(early?'I want to practise…':primary?'One thing I want to work on…':'One meaningful next step for my learning')+
  '</label>'+
  '<textarea id="reflection" rows="3" placeholder="'+esc(early?'I want to try...':'Something I want to practise is...')+'">'+
  esc(reflectionDraft)+'</textarea>'+
  '<div class="student-goal-actions"><button type="button" class="student-save-goal" data-action="save-reflection">Save my thought</button>'+
  '<span id="save-status" aria-live="polite">Saved only in this browser session</span></div></section>'+
  '</div>'+
  '<div class="student-landing-foot"><span>Attendance in the demo: <strong>'+esc(as.rate===null?'—':as.rate+'%')+
  '</strong> · through 8 Oct 2026</span><span>My numbers describe my learning, not my worth.</span></div>'+
  '</section>';
}
