/** Role-scoped evidence preview descriptions. Read-only, no persistence or analysis.
 * Produces short factual summaries from the same fictional records already in the app.
 */
import {attendanceSummary,gradeNumber} from './data.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {academicFor,latestAcademic} from './academic-journey-data.mjs';
import {experienceFor} from './experience-data.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';
import {PREVIEW_GUIDE,makePreview} from './evidence-previews.mjs';
const tidy=v=>String(v??'').replace(/\s+/g,' ').trim();
const value=v=>v===undefined||v===null||v===''?'Not available':String(v);
const fmtDate=(v)=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'See assessment record';
const t=(node,selector)=>tidy(node?.querySelector?.(selector)?.textContent);
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
  ['Attendance',att.rate===null?'Not available':att.rate+'% · through 8 Oct 2026'],
  ['Last issued Mathematics',math?math.value+' · '+issued.year:'No issued result']
 ];
 if(map?.status==='comparable')rows.push(['MAP Mathematics growth',(map.actual>=0?'+':'')+map.actual+' RIT']);
 const note=specialist?'Fictional SSS programme membership. This preview contains no confidential case notes.':
  'Fictional student evidence. Select the learner to view sources, full dates and details.';
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
 const subtitle=ctx.role==='board'?'Aggregated school results · reporting period shown in card':
  ctx.role==='leader'?'Current leader selection · fictional data':
  ctx.role==='student'?'My fictional learning example':
  ctx.role==='sss'?'Fictional, authorised learner evidence':'Fictional classroom evidence';
 const dataContext=t(target,'.leader-stat > p')||
  t(target,'.leader-support-metric small')||t(target,'.board-dp-graphic-note')||
  t(target,'.student-today-tile > small')||t(target,'.sss-evidence-tile > small')||
  t(target,'.board-strength-caption')||'';
 const chartMeaning=kind==='leader-monitor'?(target.getAttribute?.('aria-label')||''):'';
 const status=ctx.role==='board'&&/unconfirmed|verification pending|confirmation pending/.test(text.toLowerCase())?
  'Confirmation pending — do not use as a verified Board result.':'';
 const note=guide.description+
  (ctx.role==='board'?' Compare only like-for-like cohorts and testing windows.':
   ctx.role==='leader'?' Counts and eligibility depend on the selected division, grade and class.':'');
 return makePreview({title:chartMeaning||title,subtitle,rows:[...(headline?[['Displayed',headline]]:[]),...(dataContext?[['Evidence context',dataContext]]:[])],
   status,note,kind:ctx.role==='board'?'board':ctx.role==='sss'?'support':
   guideKey==='engagement'||guideKey==='belonging'?'experience':'academic'});
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
 if(kind==='academic'||kind==='attendance'||kind==='map'){
  const name=person?.name||'Learner';
  const academic=academicFor(ctx.academic,person.id);
  if(kind==='attendance'){
   const att=attendanceSummary(ctx.data.attendance[person.id]||[]);
   return makePreview({title:'Attendance · '+name,subtitle:'Fictional school attendance register',
    rows:[['Recorded rate',att.rate===null?'Not available':att.rate+'%'],
      ['Recording period','Through 8 Oct 2026']],
    note:PREVIEW_GUIDE.attendance.description,kind:'academic'});
  }
  if(kind==='map'){
   const m=latestMapGrowth(ctx.data.map[person.id]||[]);
   return makePreview({title:'MAP Mathematics · '+name,subtitle:'Fictional comparable testing windows',
    rows:[['Observed change',m.status==='comparable'?(m.actual>=0?'+':'')+m.actual+' RIT':'Not comparable']],
    note:PREVIEW_GUIDE.map.description,kind:'academic'});
  }
  const mode=trigger.dataset.previewMeasure||'report';
  const subject=ctx.state.academicSubject||'Mathematics';
  const latest=latestAcademic(academic,mode,subject);
  return makePreview({title:PREVIEW_GUIDE[mode]?.label||'Academic result',subtitle:name,
   rows:[['Displayed result',value(latest?.value)],['Subject',mode==='report'?subject:PREVIEW_GUIDE[mode]?.label||'Assessment'],
     ['Assessment context',latest?.label||'No eligible result']],
   note:(PREVIEW_GUIDE[mode]||PREVIEW_GUIDE.report).description,kind:'academic'});
 }
 if(kind==='tag'){
  const tag=tidy(trigger.dataset.previewTag||trigger.textContent);
  const safeTitle=tag||'Support indicator';
  return makePreview({title:safeTitle,subtitle:'Fictional classroom indicator',
    note:'This is a demonstration-only category marker, not a diagnosis or safeguarding label. Detailed support information is restricted to authorised personnel.',
    kind:'support'});
 }
 if(kind==='issued'){
  const parent=trigger.closest('.academic-profile');
  const year=t(parent,'.academic-report-meta strong');
  const scale=t(parent,'.academic-report-meta span');
  return makePreview({title:t(trigger,'span')||'Issued result',subtitle:year+' · '+scale,
   rows:[['Issued value',t(trigger,'strong')||'Not available']],
   note:PREVIEW_GUIDE.report.description,kind:'academic'});
 }
 if(kind==='method'){
  const id=trigger.dataset.experienceExplain||'';
  const key=id||(/belonging/i.test(trigger.textContent)?'belonging':'engagement');
  return simpleGuide(key,'Fictional student check-in','');
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
  const week=trigger.dataset.previewWeek;
  const observed=trigger.dataset.previewObserved;
  const target=trigger.dataset.previewTarget;
  return makePreview({title:'Intervention monitoring · Week '+value(week),
   subtitle:'Fictional weekly observation',rows:[
    ['Observed',value(observed)+' / 5 opportunities'],
    ['Example target',value(target)+' / 5 opportunities'],
    ['Week',value(week)]],
   note:'Observed values are examples, not diagnostic evidence or an estimate of intervention effectiveness.',
   kind:'support'});
 }
 if(kind==='wida'){
  return simpleGuide('wida','SSS screening example',t(trigger,'strong'));
 }
 if(kind==='monitor-stat'){
  return makePreview({title:tidy(trigger.querySelector('small')?.textContent)||'Monitoring measure',
   subtitle:'Fictional intervention series',rows:[['Displayed',t(trigger,'strong')]],
   note:'The displayed opportunity count is part of a fictional weekly monitoring example. The chart uses its own scale and target.',
   kind:'support'});
 }
 if(kind==='attendance-scope'){
  return simpleGuide('attendance','Fictional attendance · through 8 Oct 2026',tidy(trigger.textContent));
 }
 if(kind==='student-tile'||kind==='academic-card'||kind==='sss-evidence'||kind==='support-summary'||
    kind==='leader-stat'||kind==='leader-check'||kind==='leader-support'||kind==='leader-monitor'||
    kind==='leader-assessment'||kind==='leader-experience'||kind==='board-card'||
    kind==='board-dp'||kind==='board-index'||kind==='board-map'){
  return cardDetails(trigger,ctx,kind);
 }
 return null;
}
