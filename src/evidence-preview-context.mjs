/** Role-scoped evidence preview descriptions. Read-only, no persistence or analysis.
 * Produces short factual summaries from the same example records already in the app.
 */
import {attendanceSummary,gradeNumber} from './data.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {mapRitBand,mapRitChange,mapRitDisplaySubject} from './map-rit-achievement.mjs';
import {academicFor,latestAcademic,facultyDemoReport} from './academic-journey-data.mjs';
import {experienceFor,EXPERIENCE_WINDOWS} from './experience-data.mjs';
import {buildExperienceQuestionPreview} from './experience-question-preview.mjs';
import {reportProgress,issuedReportProgress,academicCheckinProgress,mapProgress,experienceProgress,groupExperienceProgress,maiaProgress} from './evidence-progress.mjs?v=20261111schemas1';
import {MAIA_DEFAULT_DIMENSION} from './maia-demo.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {PREVIEW_GUIDE,makePreview} from './evidence-previews.mjs?v=20261111checkin4';
const tidy=v=>String(v??'').replace(/\s+/g,' ').trim();
const value=v=>v===undefined||v===null||v===''?'Not available':String(v);
const fmtDate=(v)=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'See assessment record';
const t=(node,selector)=>tidy(node?.querySelector?.(selector)?.textContent);
const compact=(title,subtitle,trend,kind='academic',fallback='')=>makePreview({
 title,subtitle,kind,trend,
 rows:trend?.points?.length?[]:(fallback?[['Current',fallback]]:[])
});
const facultyGroup=ctx=>{
 const classes=ctx.data.classes.filter(c=>ctx.allowedClassIds?.includes(c.id));
 const current=classes.find(c=>c.id===ctx.state.classId)||classes[0];
 return (current?.studentIds||[]).map(id=>ctx.data.userIndex.get(id)).filter(Boolean);
};
const leaderGroup=(ctx,groupLabel='')=>{
 const state=ctx.state;
 const division=state.division||'All',gradeSelection=state.grade||'All';
 const divisions=division==='All'?['Elementary','Secondary']:[division];
 const selected=ctx.data.students.filter(s=>divisions.includes(s.division)&&
  (gradeSelection==='All'||s.grade===gradeSelection)&&
  (!state.classId||s.classId===state.classId));
 if(!groupLabel)return selected;
 const label=groupLabel.trim();
 const matchedGrade=label.match(/^Grade\s+(\d+)$/i);
 const grade=matchedGrade?'G'+matchedGrade[1]:label;
 const byGrade=selected.filter(s=>s.grade===grade);
 if(byGrade.length)return byGrade;
 const matchingClass=ctx.data.classes.find(c=>c.name===label||c.id===label);
 const byClass=matchingClass?selected.filter(s=>s.classId===matchingClass.id):[];
 return byClass.length?byClass:selected;
};
function simpleGuide(key,contextLabel='',displayed=''){
 const guide=PREVIEW_GUIDE[key]||PREVIEW_GUIDE.report;
 return makePreview({title:guide.label,subtitle:contextLabel||guide.source,
  rows:displayed?[['Displayed result',displayed]]:[],
  note:guide.description,kind:key==='engagement'||key==='belonging'?'experience':'academic'});
}
function learner(id,ctx){
 const student=ctx.data.userIndex.get(id);
 if(!student)return null;
 if(ctx.role==='faculty'&&!ctx.allowedStudentIds.includes(id))return null;
 if(ctx.role==='student'&&ctx.state.studentId!==id)return null;
 if(ctx.role==='sss'&&!ctx.sssRecords.has(id))return null;
 if(!['faculty','student','sss'].includes(ctx.role))return null;
 return student;
}
function studentPreview(student,ctx,specialist=false){
 const att=attendanceSummary(ctx.data.attendance[student.id]||[]);
 const rec=academicFor(ctx.academic,student.id);
 const issued=rec?.reports?.[0];
 const math=issued?.subjects?.find(x=>['Mathematics','Early Mathematics'].includes(x.subject));
 const map=gradeNumber(student.grade)>=3&&gradeNumber(student.grade)<=10?
  latestMapGrowth(ctx.data.map[student.id]||[]):null;
 const rows=[
  ['Class',value(student.classId)],
  ['Attendance',att.rate===null?'Not available':att.rate+'%'],
  ['Last issued Mathematics',math?math.value+' · '+issued.year:'No issued result']
 ];
 if(map?.status==='comparable')rows.push(['MAP Mathematics growth',(map.actual>=0?'+':'')+map.actual+' RIT']);
 const note=specialist?'Demonstration SSS programme membership. This preview contains no confidential case notes.':
  'Demonstration student evidence. Select the learner to view sources, full dates and details.';
 return makePreview({title:student.name,subtitle:student.grade+' · Quick evidence preview',rows,note,kind:specialist?'support':'academic'});
}
function facultyMetric(trigger,ctx){
 const label=tidy(trigger.textContent).toLowerCase();
 const key=label.includes('engagement')?'engagement':label.includes('belonging')?'belonging':
  label.includes('attendance')?'attendance':'coverage';
 const classId=ctx.state.classId;
 const classes=ctx.data.classes.filter(c=>ctx.allowedClassIds.includes(c.id));
 const selected=classes.find(c=>c.id===classId)||classes[0];
 const ss=(selected?.studentIds||[]).map(id=>ctx.data.userIndex.get(id)).filter(Boolean);
 const headline=t(trigger,'strong');
 const guide=PREVIEW_GUIDE[key];
 return makePreview({title:guide.label,subtitle:selected?.name||'Current class',
  rows:[['Displayed',headline],['School year','2026–27']],
  note:guide.description+(key==='engagement'||key==='belonging'?' Select to inspect the three-question breakdown.':''),
  kind:key==='engagement'||key==='belonging'?'experience':'academic'});
}
function cardDetails(target,ctx,kind){
 if(kind==='student-tile'||kind==='academic-card'){
  const person=learner(ctx.state.studentId,ctx);
  const academic=person?academicFor(ctx.academic,person.id):null;
  if(academic){
   if(kind==='student-tile'&&target.matches?.('.student-today-celebrate')){
    const subject=t(target,'.student-today-title');
    return compact(subject,person.name,
     issuedReportProgress(academic,subject,academic.reports?.[0]?.year),'academic',
     t(target,'.student-today-score')||'—');
   }
   const label=(t(target,'h3')||t(target,'.student-today-title')||'').toLowerCase();
   const mode=label.includes('ixl')||label.includes('mathematics check-in')?'ixl':
    label.includes('phonics')||label.includes('reading skills check-in')?'core':
    label.includes('f&p')||label.includes('reading text level')?'fp':null;
   if(mode)return compact(PREVIEW_GUIDE[mode].label,person.name,
    academicCheckinProgress(academic,mode),'academic','—');
   if(label.includes('map')&&person)return compact('MAP Mathematics',person.name,
    mapProgress(ctx.data.map[person.id]||[],'Mathematics'),'academic','—');
  }
 }

 const title=t(target,'h3')||t(target,'h4')||t(target,'.student-today-title')||
  t(target,'.leader-stat-heading span')||t(target,'.leader-measure-label')||
  t(target,'.leader-support-metric span')||t(target,'.board-strength-eyebrow')||
  t(target,'.board-indicator-label')||t(target,'.board-dp-graphic-label')||
  t(target,'.sss-evidence-tile > span')||t(target,'.support-progress-stats small')||
  t(target,'.academic-evidence-top h3')||tidy(target.dataset.previewTag)||'Evidence';
 const headline=t(target,'.student-today-score')||t(target,'.leader-stat > strong')||
  t(target,'.leader-support-metric > strong')||t(target,'.board-strength-number')||
  t(target,'.board-dp-graphic-value')||t(target,'.leader-experience-value')||
  t(target,'.academic-evidence-primary strong')||t(target,'strong')||
  t(target,'.sss-evidence-tile strong');
 const text=tidy(target.textContent);
 const lower=title.toLowerCase();
 const guideKey=lower.includes('belonging')?'belonging':
  lower.includes('engagement')?'engagement':
  lower.includes('map')&&lower.includes('growth')?'mapgrowth':
  lower.includes('map')?'map':
  lower.includes('attendance')?'attendance':
  lower.includes('phonics')?'core':
  lower.includes('ixl')?'ixl':
  lower.includes('f&p')||lower.includes('reading level')?'fp':
  lower.includes('maia')?'flourishing':
  lower.includes('wida')?'wida':
  lower.includes('pass rate')||lower.includes('diploma')?'ibdp':
  lower.includes('support')||lower.includes('review')||lower.includes('follow')?'review':
  lower.includes('coverage')?'coverage':'report';
 const guide=PREVIEW_GUIDE[guideKey];
 if(kind==='support-summary'){
  return makePreview({title,subtitle:'Fictional, restricted SSS workspace',
   rows:headline?[['Displayed',headline]]:[],
   note:'Preview only the visible record heading. Open the authorised support record for any notes or plans.',
   kind:'support'});
 }
 const subtitle=ctx.role==='board'?'Schoolwide':ctx.role==='student'?'My learning':
  ctx.role==='leader'?'Selected learners':ctx.role==='sss'?'Support':'Class view';
 const dataContext=t(target,'.leader-stat > p')||
  t(target,'.leader-support-metric small')||t(target,'.board-dp-graphic-note')||
  t(target,'.student-today-tile > small')||t(target,'.sss-evidence-tile > small')||
  t(target,'.board-strength-caption')||'';
 const chartMeaning=kind==='leader-monitor'?(target.getAttribute?.('aria-label')||''):'';
 const status='';
 // A data-point hover is a glanceable value, not an assessment explainer.
 // Methodology remains accessible through the existing explicit help controls.
 return makePreview({title:chartMeaning||title,subtitle,
  rows:headline?[['Current',headline]]:[],
  status,kind:ctx.role==='board'?'board':ctx.role==='sss'?'support':
   guideKey==='engagement'||guideKey==='belonging'?'experience':'academic'});
}
function experienceQuestions(ctx,students,metric,window,scopeLabel,individual=false){
 const detail=buildExperienceQuestionPreview(ctx.experience,students,metric,window,{scopeLabel,individual});
 const trend=individual&&students?.length===1?
  experienceProgress(ctx.experience,students[0].id,metric,window):
  groupExperienceProgress(ctx.experience,students,metric,window);
 return detail?makePreview({title:detail.title,subtitle:scopeLabel,kind:'experience',trend,experienceDetail:detail}):null;
}
export function resolveEvidencePreview(trigger,ctx){
 if(!trigger?.dataset||!ctx?.data)return null;
 const kind=trigger.dataset.evidencePreview;
 const id=trigger.dataset.previewStudent;
 const person=id?learner(id,ctx):null;
 if(id&&!person)return null;
 if(kind==='student'||kind==='sss-person'){
  const student=person||learner(trigger.dataset.sssStudent,ctx);
  return student?studentPreview(student,ctx,kind==='sss-person'):null;
 }
 if(kind==='experience-summary'){
  if(ctx.role!=='faculty')return null;
  const metric=tidy(trigger.textContent).toLowerCase().includes('belonging')?'belonging':'engagement';
  return experienceQuestions(ctx,facultyGroup(ctx),metric,'F26','My class');
 }
 if(kind==='class-evidence-experience'){
  if(ctx.role!=='faculty')return null;
  return experienceQuestions(ctx,facultyGroup(ctx),trigger.dataset.previewMeasure,
   ctx.state.classExperienceWindow||'F26','My class');
 }
 if(kind==='personal-experience'){
  if(!['student','faculty'].includes(ctx.role))return null;
  const person=learner(ctx.state.studentId,ctx);
  return person?experienceQuestions(ctx,[person],trigger.dataset.previewMeasure,
   ctx.state.window||'F26',person.name,true):null;
 }
 if(kind==='leader-index'){
  if(ctx.role!=='leader')return null;
  const scope=trigger.dataset.previewGroup||'Selected group';
  return experienceQuestions(ctx,leaderGroup(ctx,scope),trigger.dataset.previewMeasure,
   ctx.state.window||'F26',scope);
 }
 if(kind==='leader-experience'){
  if(ctx.role!=='leader')return null;
  const metric=t(trigger,'.leader-measure-label').toLowerCase().includes('belonging')?'belonging':'engagement';
  const action=trigger.querySelector?.('[data-action^="explain:"]')?.dataset.action||'';
  const scope=action.split(':')[1]||'leader';
  let students=leaderGroup(ctx);
  if(scope==='elementary'||scope==='secondary')
   students=students.filter(s=>s.division===(scope==='elementary'?'Elementary':'Secondary'));
  const name=scope==='elementary'?'Elementary':scope==='secondary'?'Secondary':'Selected learners';
  return experienceQuestions(ctx,students,metric,ctx.state.window||'F26',name);
 }
 if(kind==='leader-school-voice'){
  if(ctx.role!=='leader')return null;
  const division=trigger.dataset.previewGroup;
  if(!['Elementary','Secondary'].includes(division))return null;
  const students=ctx.data.students.filter(s=>s.division===division);
  return experienceQuestions(ctx,students,trigger.dataset.previewMeasure,'F26',division);
 }
 if(kind==='leader-profile-voice'||kind==='leader-followup-voice'){
  if(ctx.role!=='leader')return null;
  const id=kind==='leader-profile-voice'?ctx.state.leaderStudentId:trigger.dataset.previewLeaderStudent;
  const person=id?ctx.data.userIndex.get(id):null;
  return person?experienceQuestions(ctx,[person],trigger.dataset.previewMeasure,
   ctx.state.window||'F26',person.name,true):null;
 }
 if(kind==='leader-trend'){
  if(ctx.role!=='leader')return null;
  const scope=trigger.dataset.previewGroup;
  let students=leaderGroup(ctx);
  if(scope==='Elementary'||scope==='Secondary')students=students.filter(s=>s.division===scope);
  return experienceQuestions(ctx,students,trigger.dataset.previewMeasure,
   trigger.dataset.previewWindow||'F26',scope||'Selected learners');
 }
 if(kind==='sss-experience'){
  if(ctx.role!=='sss')return null;
  const person=learner(ctx.state.sssStudentId,ctx);
  return person?experienceQuestions(ctx,[person],trigger.dataset.previewMeasure,
   'F26',person.name,true):null;
 }
 if(kind==='experience-cell'){
  const metric=trigger.dataset.previewMeasure;
  if(!person||!ctx.experience||!['engagement','belonging'].includes(metric))return null;
  return experienceQuestions(ctx,[person],metric,
   trigger.dataset.previewWindow||ctx.state.classExperienceWindow||'F26',person.name,true);
 }
 if(kind==='map-rit'){
  if(!person)return null;
  const subject=trigger.dataset.previewSubject||'Mathematics';
  const records=ctx.data.map[person.id]||[];
  const {current,previous}=mapRitChange(records,subject);
  const band=mapRitBand(current?.percentile);
  const percentile=Number.isInteger(current?.percentile)?
   'P'+current.percentile+(band?' · '+band.label:''):'Not available';
  return makePreview({
   title:'MAP '+mapRitDisplaySubject(subject)+' RIT',
   subtitle:person.name+' · Fall 2026 · Fictional',
   trend:current?mapProgress(records,subject):null,
   rows:current?[
    ['Achievement percentile',percentile],
    ...(!previous?[['Previous assessment','Not available']]:[])
   ]:[['Fall 2026','No assessment recorded']],
   note:current?
    'Colour shows the achievement percentile band. RIT change compares valid tests in the same subject; it is not a growth percentile.':
    'No score is available for this testing window. Missing is not zero.',
   kind:'academic'
  });
 }
 if(kind==='academic'||kind==='attendance'||kind==='map'){
  if(!person)return null;
  const academic=academicFor(ctx.academic,person.id);
  if(kind==='attendance'){
   const att=attendanceSummary(ctx.data.attendance[person.id]||[]);
   return compact('Attendance',person.name,null,'academic',
    att.rate===null?'—':att.rate+'%');
  }
  if(kind==='map'){
   const subject=trigger.dataset.previewSubject||'Mathematics';
   return compact('MAP '+subject,person.name,
    mapProgress(ctx.data.map[person.id]||[],subject),'academic','—');
  }
  const mode=trigger.dataset.previewMeasure||'report';
  const subject=trigger.dataset.evidenceSubject||ctx.state.academicSubject||'Mathematics';
  if(mode==='report'){
   const original=tidy(trigger.dataset.evidenceDetail||'');
   return makePreview({title:subject,subtitle:person.name,kind:'academic',
    trend:reportProgress(academic,subject),
    rows:original?[['Displayed result',t(trigger,'strong')||'—']]:[],
    note:original});
  }
  if(mode==='ixl'){
   const latest=latestAcademic(academic,'ixl');
   const rows=latest?[
    ['Overall math score',String(latest.scoreLabel||latest.level)],
    ['Overall scale score',Number.isFinite(latest.scaleScore)?latest.scaleScore.toFixed(2):'—'],
    ['Grade-level tier',latest.tier||'Not classified'],
    ['IXL diagnostic percentile',Number.isInteger(latest.percentile)?'P'+latest.percentile:'—'],
    ...(latest.domains||[]).slice(0,3).map(d=>[d.name,
     String(d.scoreLabel??d.score??'—')+(d.tier?' · '+d.tier:'')])
   ]:[['Current diagnostic','Not completed or unavailable']];
   return makePreview({title:'IXL Math Diagnostic',subtitle:person.name+' · Fictional',
    trend:academicCheckinProgress(academic,'ixl'),rows,
    note:'Overall diagnostic score, scale score, grade-level tier and percentile are separate IXL fields. These do not use MAP RIT bands. Missing diagnostics are not zero.',
    kind:'academic'});
  }
  if(['core','fp'].includes(mode))
   return compact(PREVIEW_GUIDE[mode].label,person.name,
    academicCheckinProgress(academic,mode),'academic','—');
  if(mode==='flourishing'){
   const dimension=ctx.state.maiaDimension||MAIA_DEFAULT_DIMENSION;
   return compact('Maia · '+dimension,person.name,
    maiaProgress(ctx.maia,person.id,dimension,ctx.state.maiaWindow||'F26'),'experience','—');
  }
  return compact(PREVIEW_GUIDE[mode]?.label||'Assessment',person.name,null,'academic',
   value(trigger.dataset.evidenceValue));
 }
 if(kind==='leader-assessment'&&ctx.role==='leader'){
  const row=trigger.closest?.('tr[data-preview-student]');
  const id=row?.dataset.previewStudent;
  const student=id?ctx.data.userIndex.get(id):null;
  if(student){
   const subject=t(trigger,'span')||t(trigger,'strong');
   return compact(subject,student.name,
    reportProgress(academicFor(ctx.academic,student.id),subject),'academic','—');
  }
 }
 if(kind==='tag'){
  const tag=tidy(trigger.dataset.previewTag||trigger.textContent);
  const safeTitle=tag||'Support indicator';
  return makePreview({title:safeTitle,subtitle:'Demonstration classroom indicator',
    note:'This is a demonstration-only category marker, not a diagnosis or safeguarding label. Detailed support information is restricted to authorised personnel.',
    kind:'support'});
 }
 if(kind==='issued'){
  const student=learner(ctx.state.studentId,ctx);
  if(!student)return null;
  const subject=t(trigger,'span')||'Subject';
  const year=t(trigger.closest?.('.academic-profile'),'.academic-report-meta strong');
  return compact(subject,student.name,
   issuedReportProgress(academicFor(ctx.academic,student.id),subject,year),
   'academic',t(trigger,'strong')||'—');
 }
 if(kind==='method'){
  const id=trigger.dataset.experienceExplain||'';
  const key=id||(/belonging/i.test(trigger.textContent)?'belonging':'engagement');
  return simpleGuide(key,'Demonstration student check-in','');
 }
 if(kind==='missing'){
  return makePreview({title:'No result available',subtitle:'Missing is not zero',
   note:'This assessment has no available result for the selected learner and period. It is not a score of zero.',
   kind:'academic'});
 }
 if(kind==='definition'){
  const help=tidy(trigger.parentElement?.textContent||'');
  return makePreview({title:'About this measure',subtitle:'Read the full details by expanding this section',
   note:help.slice(0,220),kind:'academic'});
 }
 if(kind==='monitor-point'){
  const week=Number(trigger.dataset.previewWeek);
  const circles=[...(trigger.closest?.('svg')?.querySelectorAll?.('circle[data-preview-week]')||[])];
  const points=circles.map(x=>({
   week:Number(x.dataset.previewWeek),observed:Number(x.dataset.previewObserved)
  })).filter(x=>Number.isFinite(x.week)&&Number.isFinite(x.observed)&&x.week<=week)
   .sort((a,b)=>a.week-b.week).slice(-3);
  const last=points.at(-1),before=points.at(-2);
  return compact('Weekly observations','',{
   points:points.map(x=>({label:'Week '+x.week,value:x.observed+' / 5'})),
   change:last&&before?{value:(last.observed-before.observed>0?'+':'')+
    (last.observed-before.observed)+' observed',from:'Week '+before.week}:null
  },'support',value(trigger.dataset.previewObserved)+' / 5');
 }
 if(kind==='wida'){
  return simpleGuide('wida','SSS screening example',t(trigger,'strong'));
 }
 if(kind==='monitor-stat'){
  return makePreview({title:tidy(trigger.querySelector('small')?.textContent)||'Monitoring measure',
   subtitle:'Demonstration intervention series',rows:[['Displayed',t(trigger,'strong')]],
   note:'The displayed opportunity count is part of a example weekly monitoring example. The chart uses its own scale and target.',
   kind:'support'});
 }
 if(kind==='attendance-scope'){
  return simpleGuide('attendance','Demonstration attendance',tidy(trigger.textContent));
 }
 if(kind==='student-tile'||kind==='academic-card'||kind==='sss-evidence'||kind==='support-summary'||
    kind==='leader-stat'||kind==='leader-check'||kind==='leader-support'||kind==='leader-monitor'||
    kind==='leader-assessment'||kind==='leader-experience'||kind==='board-card'||
    kind==='board-dp'||kind==='board-index'||kind==='board-map'){
  return cardDetails(trigger,ctx,kind);
 }
 return null;
}
