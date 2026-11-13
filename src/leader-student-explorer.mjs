/** Leaders' Student Explorer. Uses only the existing synthetic My Learners cohort.
 * Keep MAP achievement percentiles separate from source-supplied goal descriptors.
 */
import {GRADES,gradeNumber,attendanceSummary} from './data.mjs';
import {MAP_RIT_SUBJECTS,MAP_RIT_BANDS,mapRitCurrent,mapRitBand,renderMapRitCell,renderMapRitLegend} from './map-rit-achievement.mjs';
import {strandBand,strandBandLabel} from './map-strand-explorer.mjs';
import {everydayEvidenceForGrade} from './faculty-everyday-columns.mjs';
import {academicFor,facultyDemoReport,latestAcademic,reportSubjectsFor} from './academic-journey-data.mjs';
import {facultyHeaderInfo} from './faculty-roster-headings.mjs';
import {evidenceValue} from './class-evidence.mjs';
import {reportGradeBand,mypBestFitMarker} from './report-card-signals.mjs';
import {supportStatusForStudent} from './learner-support-status.mjs';
import {supportStatusBadges} from './learner-support-status-ui.mjs';
import {experienceFor} from './experience-data.mjs';
import {experienceBand} from './faculty-bands.mjs';
import {renderUniversalScreenerTile} from './universal-screener.mjs';
import {renderUfliLessonTile} from './ufli-demo.mjs';
import {renderStudentPhoto} from './student-photo-preview.mjs';
import {esc} from './v2-ui.mjs';

export const EXPLORER_DEFAULTS=Object.freeze({
 division:'All',grade:'All',classId:'',teacher:'all',subject:'all',gradeFilter:'all',
 eal:'all',learning:'all',mapTest:'all',strand:'',band:'all',
 strandBand:'all',query:'',sort:'name',direction:'asc'
});
export const EXPLORER_PAGE_SIZE=80;
const BANDS=['low','low-average','average','high-average','high'];
const s=v=>esc(String(v??''));
const choice=(value,label,selected)=>'<option value="'+s(value)+'"'+(value===selected?' selected':'')+'>'+s(label)+'</option>';
const select=(label,key,values,selected)=>'<label class="explorer-field"><span>'+s(label)+'</span><select data-explorer-filter="'+s(key)+'" aria-label="'+s(label)+'">'+values.map(x=>choice(x[0],x[1],selected)).join('')+'</select></label>';
const gradeIndex=g=>GRADES.indexOf(g)<0?GRADES.length:GRADES.indexOf(g);
const bandOrder=key=>BANDS.indexOf(key)<0?null:BANDS.indexOf(key)+1;
const letterGrade=g=>g==='K'?'Kindergarten':g;
const teacherFor=(data,c)=>data.teachers.find(t=>t.id===c?.teacherId);
const isActiveEal=x=>['e1','e2','i3','i4','a5'].includes(x);
const isMonitoredEal=x=>x==='monitor-y1'||x==='monitor-y2';
const cleanFilter=(filters={})=>({...EXPLORER_DEFAULTS,...filters});
const validSort=(value,subjects)=>['name','grade','class','teacher','attendance','subject',
 'map:Reading','map:Mathematics','map:Language Usage','mapBand','strandRit','strandBand'].includes(value)||
 (String(value||'').startsWith('report:')&&subjects.includes(String(value).slice(7)));
const activeBand=(value,band)=>band==='both'?['low','low-average'].includes(value):band==='all'||value===band;
const reportFor=(academic,id)=>facultyDemoReport(academicFor(academic,id));
const gradeLabel=g=>g==='K'?'Kindergarten':g;
const shortMapSubject=subject=>subject==='Mathematics'?'Math':subject==='Language Usage'?'Language':subject;
const shortDescriptor=value=>({Emerging:'Emerg.',Developing:'Dev.',Applying:'Apply',Extending:'Extend'})[value]||value;
const currentGoals=(records,mapTest,goalName,descriptor)=>{
 const tests=mapTest==='all'?MAP_RIT_SUBJECTS:[mapTest];
 return tests.flatMap(subject=>{
  const test=records[subject];
  return (test?.goals||[]).filter(goal=>
   (!goalName||goal.name===goalName)&&Number.isFinite(goal.rit)&&
   (descriptor==='all'||activeBand(strandBand(goal),descriptor))
  ).map(goal=>({subject,goal,band:strandBand(goal)}));
 });
};
const achievementMatches=(records,mapTest,band)=>{
 const tests=mapTest==='all'?MAP_RIT_SUBJECTS:[mapTest];
 return tests.map(subject=>({subject,record:records[subject],
  band:mapRitBand(records[subject]?.percentile)})).filter(entry=>
   !!entry.record&&!!entry.band&&activeBand(entry.band.key,band));
};
export function explorerActiveFilters(filters={}){
 const f=cleanFilter(filters);
 return Object.keys(EXPLORER_DEFAULTS).filter(key=>!['query','sort','direction'].includes(key)&&
  f[key]!==EXPLORER_DEFAULTS[key]);
}

export function leaderExplorerModel({data,academic,experience,filters={}}){
 const f=cleanFilter(filters);
 const division=['All','Elementary','Secondary'].includes(f.division)?f.division:'All';
 const grade=GRADES.includes(f.grade)&&(division==='All'||(gradeNumber(f.grade)<=5?'Elementary':'Secondary')===division)?f.grade:'All';
 const classes=data.classes.filter(c=>(division==='All'||c.division===division)&&
  (grade==='All'||c.grade===grade));
 const teachers=data.teachers.filter(t=>classes.some(c=>t.classIds.includes(c.id)))
  .sort((a,b)=>a.name.localeCompare(b.name));
 const availableGrades=GRADES.filter(g=>data.classes.some(c=>c.grade===g&&(division==='All'||c.division===division)));
 const mapTest=MAP_RIT_SUBJECTS.includes(f.mapTest)?f.mapTest:'all';
 const availableSubjects=[...new Set(classes.flatMap(c=>c.studentIds)
  .map(id=>reportFor(academic,id)).filter(Boolean).flatMap(r=>r.subjects.map(x=>x.subject)))].sort();
 const candidateStudents=data.students.filter(student=>
  (division==='All'||student.division===division)&&
  (grade==='All'||student.grade===grade)&&
  (!f.classId||student.classId===f.classId)&&
  (f.teacher==='all'||data.teachers.some(t=>t.id===f.teacher&&t.classIds.includes(student.classId))));
 const goalNames=[...new Set(candidateStudents.flatMap(student=>{
  if(mapTest==='all')return [];
  const record=mapRitCurrent(data.map[student.id]||[],mapTest);
  return (record?.goals||[]).map(g=>g.name);
 }))].sort();
 const goalName=mapTest!=='all'&&goalNames.includes(f.strand)?f.strand:'';
 const query=String(f.query||'').trim().toLocaleLowerCase();
 const mapped=candidateStudents.map(student=>{
  const cls=data.classIndex?.get(student.classId)||data.classes.find(c=>c.id===student.classId);
  const assigned=data.teachers.find(t=>t.id===f.teacher);
  const teacher=assigned?.classIds.includes(student.classId)?assigned:teacherFor(data,cls);
  const report=reportFor(academic,student.id);
  const reportItem=f.subject!=='all'?report?.subjects.find(x=>x.subject===f.subject):
   report?.subjects.find(x=>x.subject==='Mathematics'||x.subject==='Early Mathematics')||report?.subjects[0];
  const map=Object.fromEntries(MAP_RIT_SUBJECTS.map(subject=>[subject,mapRitCurrent(data.map[student.id]||[],subject)]));
  const focus=mapTest==='all'?null:map[mapTest];
  const goalHits=currentGoals(map,mapTest,goalName,f.strandBand);
  const allGoalHits=currentGoals(map,mapTest,goalName,'all');
  const goal=goalHits[0]?.goal||allGoalHits[0]?.goal||null;
  const bandHits=achievementMatches(map,mapTest,f.band);
  const allBandHits=achievementMatches(map,mapTest,'all');
  const support=supportStatusForStudent(student);
  const attendance=attendanceSummary(data.attendance[student.id]||[]).rate;
  const e=experienceFor(experience,student.id,'engagement')?.value??null;
  const b=experienceFor(experience,student.id,'belonging')?.value??null;
  return {student,teacher,report,reportItem,map,focus,goal,goalHits,allGoalHits,bandHits,allBandHits,
   support,attendance,engagementBand:experienceBand(e),belongingBand:experienceBand(b)};
 });
 const rows=mapped.filter(row=>{
  if(query&&![row.student.name,row.student.id,row.student.grade,row.student.classId,row.teacher?.name]
   .some(v=>String(v||'').toLocaleLowerCase().includes(query)))return false;
  if(f.subject!=='all'&&!row.reportItem)return false;
  if(f.gradeFilter!=='all'){
   const subjects=f.subject==='all'?row.report?.subjects||[]:row.reportItem?[row.reportItem]:[];
   const match=subjects.some(item=>{
    if(f.gradeFilter==='missing')return item.value==null||String(item.value).trim()==='';
    if(row.report?.scale==='1–7'){
     const n=Number(item.value);
     return Number.isInteger(n)&&n>=1&&n<=7&&
      (f.gradeFilter==='numeric-2'&&n<=2||f.gradeFilter==='numeric-3'&&n<=3);
    }
    return f.gradeFilter==='emerging'&&item.value==='Emerging'||
     f.gradeFilter==='developing'&&item.value==='Developing';
   });
   if(!match)return false;
  }
  const eal=row.support?.eal||'not-needed';
  if(f.eal==='active'&&!isActiveEal(eal))return false;
  if(f.eal==='monitor'&&!isMonitoredEal(eal))return false;
  if(f.eal==='exited'&&eal!=='exited')return false;
  if(f.eal==='none'&&eal!=='not-needed')return false;
  if(f.learning==='yes'&&!row.support?.hasLearning)return false;
  if(f.learning==='no'&&row.support?.hasLearning)return false;
  if((goalName||f.strandBand!=='all')&&!row.goalHits.length)return false;
  if(f.band!=='all'&&!row.bandHits.length)return false;
  return true;
 });
 const sort=validSort(f.sort,availableSubjects)?f.sort:'name',direction=f.direction==='desc'?-1:1;
 const valueFor=(row,key)=>{
  if(key==='name')return row.student.name||[row.student.first,row.student.last].filter(Boolean).join(' ');
  if(key==='grade')return gradeIndex(row.student.grade);
  if(key==='class')return row.student.classId;
  if(key==='teacher')return row.teacher?.name||null;
  if(key==='attendance')return row.attendance;
  if(key==='subject')return row.reportItem?.value==null?null:row.report?.scale==='1–7'?Number(row.reportItem.value):row.reportItem.value;
  if(key.startsWith('report:')){
   const item=row.report?.subjects.find(entry=>entry.subject===key.slice(7));
   return item?.value==null?null:row.report?.scale==='1–7'?Number(item.value):item.value;
  }
  if(key.startsWith('map:'))return row.map[key.slice(4)]?.rit??null;
  if(key==='mapBand')return row.bandHits.length?Math.min(...row.bandHits.map(h=>bandOrder(h.band.key))):null;
  if(key==='strandRit')return row.goalHits[0]?.goal.rit??null;
  if(key==='strandBand')return row.goalHits[0]?bandOrder(row.goalHits[0].band):null;
  return row.student.name;
 };
 rows.sort((a,b)=>{
  const av=valueFor(a,sort),bv=valueFor(b,sort);
  if(av==null&&bv!=null)return 1;
  if(bv==null&&av!=null)return -1;
  let result=0;
  if(typeof av==='number'&&typeof bv==='number')result=av-bv;
  else result=String(av??'').localeCompare(String(bv??''),undefined,{numeric:true});
  return direction*result||gradeIndex(a.student.grade)-gradeIndex(b.student.grade)||
   a.student.name.localeCompare(b.student.name)||a.student.id.localeCompare(b.student.id);
 });
 return {rows,scope:candidateStudents.length,total:rows.length,division,grade,classes,teachers,
  grades:availableGrades,subjects:availableSubjects,goalNames,mapTest,goalName,sort,direction,
  shown:rows};
}
function evidenceBand(value,name){
 const label=value==='band-low'?'Low':value==='band-mid-low'?'Lower':value==='band-mid-high'?'Higher':value==='band-high'?'High':'Not available';
 return '<span class="explorer-experience '+s(value||'is-missing')+'" role="img" aria-label="'+s(name+': '+label+' experience index band')+'" title="'+s(name+' · '+label+' index band')+'"><span aria-hidden="true"></span></span>';
}
function reportCell(row,subject){
 const item=row.report?.subjects.find(x=>x.subject===subject)||null;
 if(!item)return '<span class="explorer-empty">—</span>';
 const band=reportGradeBand(item.value,row.report?.scale);
 return '<span class="explorer-grade'+(band?' evidence-heat '+s(band):' explorer-descriptor')+
  '" title="'+s(subject+' · '+item.value+' · '+row.report.year+(item.provisional?' · provisional best fit':'')+' example report')+'">'+
  '<strong>'+s(item.value)+mypBestFitMarker(item)+'</strong></span>';
}
const COMPACT_SUBJECT_LABELS=Object.freeze({
 'Early Literacy':'Literacy','Early Mathematics':'Math','Inquiry & Play':'Inquiry',
 'Creative Arts':'Arts','Physical Development':'PE',
 'English Language Arts':'ELA','Mathematics':'Math','Science':'Science',
 'Social Studies':'Social','Arts':'Arts','Physical Education':'PE',
 'Language & Literature':'L&L','Sciences':'Science',
 'Individuals & Societies':'I&S','Language Acquisition':'LA',
 'Physical & Health Education':'PHE','Arts / Elective':'Arts',
 'Design':'Design'
});
function schoolSubjectsCell(row){
 if(!row.report?.subjects.length)return '<span class="explorer-empty">No subject evidence</span>';
 return '<div class="explorer-subject-chip-list" aria-label="Subject grades for '+s(row.student.name)+'">'+
  row.report.subjects.map(item=>{
   const band=reportGradeBand(item.value,row.report.scale);
   const value=shortDescriptor(String(item.value??'—'));
   const label=COMPACT_SUBJECT_LABELS[item.subject]||item.subject;
   return '<span class="explorer-subject-chip '+(band?'evidence-heat '+s(band):'explorer-descriptor')+
     '" title="'+s(item.subject+' · '+String(item.value??'Not assessed')+(item.provisional?' · provisional best fit':''))+'">'+
    '<span>'+s(label)+'</span><strong>'+s(value)+mypBestFitMarker(item)+'</strong></span>';
  }).join('')+'</div>';
}
function schoolMapCell(row){
 const tests=row.allBandHits;
 if(!tests.length)return '<span class="explorer-empty">No current MAP assessment</span>';
 return '<div class="explorer-map-chip-list">'+tests.map(hit=>
  '<span class="explorer-map-chip map-rit-'+s(hit.band.key)+'" title="'+
   s('MAP '+hit.subject+' · '+hit.record.rit+' RIT · P'+hit.record.percentile+' · '+hit.band.label)+'">'+
   '<strong>'+s(shortMapSubject(hit.subject))+' '+s(hit.record.rit)+'</strong>'+
   '<small>'+s(hit.band.label)+'</small></span>').join('')+'</div>';
}
function bandMatchesCell(row,filters){
 const hits=filters.band==='all'?row.allBandHits:row.bandHits;
 if(!hits.length)return '<span class="explorer-empty">No matching test</span>';
 return '<div class="explorer-match-chips">'+hits.map(hit=>
  '<span class="explorer-band map-rit-'+s(hit.band.key)+'" title="'+
  s(hit.subject+': P'+hit.record.percentile+', '+hit.band.label)+'">'+
  s(shortMapSubject(hit.subject)+' · '+hit.band.label)+'</span>').join('')+'</div>';
}
function strandMatchesCell(row){
 if(!row.goalHits.length)return '<span class="explorer-empty">No matching strand</span>';
 return '<div class="explorer-match-chips">'+row.goalHits.slice(0,2).map(hit=>
  '<span class="explorer-strand-rit" title="'+s(hit.subject+' · '+hit.goal.name+' · '+hit.goal.rit+
    ' RIT · '+strandBandLabel(hit.band))+'">'+
   '<strong>'+s(shortMapSubject(hit.subject))+'</strong> '+
   s(hit.goal.name)+' · '+s(hit.goal.rit)+' <small>'+s(strandBandLabel(hit.band))+'</small></span>'
 ).join('')+
 (row.goalHits.length>2?'<span class="explorer-hit-count" title="'+s(row.goalHits.slice(2).map(hit=>
   hit.subject+': '+hit.goal.name+' ('+strandBandLabel(hit.band)+')').join('; '))+'">+'+
   (row.goalHits.length-2)+' more</span>':'')+'</div>';
}
function evidenceCell(row,column,ctx){
 const student=row.student,kind=column.kind;
 if(kind==='attendance')return '<strong class="explorer-attendance">'+(row.attendance==null?'—':s(row.attendance)+'%')+'</strong>';
 if(kind==='report')return reportCell(row,column.subject);
 if(kind==='schoolSubjects')return schoolSubjectsCell(row);
 if(kind==='mapSummary')return schoolMapCell(row);
 if(kind==='mapRit')return renderMapRitCell(ctx.data.map[student.id]||[],column.subject,student.id)
  .replaceAll('data-student=','data-explorer-student=').replaceAll('<button ', '<button tabindex="-1" ');
 if(kind==='engagement')return evidenceBand(row.engagementBand,'Engagement');
 if(kind==='belonging')return evidenceBand(row.belongingBand,'Belonging');
 if(kind==='screener')return renderUniversalScreenerTile(student).replaceAll('<button ', '<button tabindex="-1" ');
 if(kind==='ufli')return renderUfliLessonTile(student).replaceAll('<button ', '<button tabindex="-1" ');
 if(kind==='ixl'){
  const result=latestAcademic(academicFor(ctx.academic,student.id),'ixl');
  const status=result?.tier==='Above grade'?'above':result?.tier==='On grade'?'on':
   result?.tier==='Below grade'?'below':result?.tier==='Far below grade'?'far-below':'missing';
  return '<span class="ixl-diagnostic-tile ixl-tier-'+status+'" title="'+s(result?.tier||'No diagnostic')+'"><strong>'+s(result?.value??'—')+'</strong><small>'+s(result?.tier||'Not completed')+'</small></span>';
 }
 const result=evidenceValue(student,{mode:kind,academic:ctx.academic,map:ctx.data.map,
  experience:ctx.experience,maia:ctx.maia,subject:column.subject||'Mathematics',
  mapSubject:'Mathematics',window:'F26'});
 return '<span class="explorer-evidence-value" title="'+s(result.detail)+'">'+s(result.available?result.text:'—')+'</span>';
}
/** Report columns use the identical 2026-27 subject definitions as Faculty.
 * Filters narrow learners, never compress the report to one selected subject.
 * When a specific grade is chosen, use its exact curriculum columns.
 */
export function explorerColumns({grade='All',division='All',data}){
 const relevant=grade!=='All'?[grade]:GRADES.filter(g=>
  data.students.some(student=>student.grade===g&&(division==='All'||student.division===division)));
 const reportSubjects=[...new Set(relevant.flatMap(reportSubjectsFor))];
 const subjectColumns=reportSubjects.map(subject=>({
  kind:'report',id:'report:'+subject,label:subject,subject
 }));
 if(grade==='All')return [
  {kind:'attendance',id:'attendance',label:'Attendance'},
  {kind:'schoolSubjects',id:'subjects-compact',label:'Subject grades'},
  {kind:'mapSummary',id:'map-compact',label:'MAP RIT / band'},
  {kind:'engagement',id:'engagement',label:'Engagement'},
  {kind:'belonging',id:'belonging',label:'Belonging'}
 ];
 const base=everydayEvidenceForGrade(grade);
 return [base.find(c=>c.kind==='attendance'),...subjectColumns,
  ...base.filter(c=>c.kind!=='attendance'&&c.kind!=='report')];
}
function labelFor(column){
 if(column.kind==='mapRit')return 'MAP '+(column.subject==='Mathematics'?'Math':column.subject==='Language Usage'?'Language':column.subject);
 if(column.kind==='report')return facultyHeaderInfo(column).display;
 return column.label;
}
export function renderLeaderStudentExplorer({data,academic,experience,maia,filters={},filtersOpen=false}){
 const f=cleanFilter(filters),model=leaderExplorerModel({data,academic,experience,filters:f});
 const columns=explorerColumns({grade:model.grade,division:model.division,data});
 const active=explorerActiveFilters(f);
 const showMapBand=f.band!=='all'||(f.mapTest!=='all'&&model.grade!=='All');
 const showStrand=f.strandBand!=='all'||!!model.goalName;
 const sortButton=(key,label)=>'<button type="button" class="explorer-sort" data-explorer-sort="'+s(key)+
  '" aria-label="Sort by '+s(label)+'" aria-pressed="'+(model.sort===key)+'">'+s(label)+
  '<span aria-hidden="true">'+(model.sort===key?(model.direction===1?' ↑':' ↓'):' ↕')+'</span></button>';
 const rows=model.shown.map((row,index)=>{
  const cells=columns.map(c=>'<td data-explorer-col="'+s(c.kind)+'">'+
   evidenceCell(row,c,{data,academic,experience,maia})+'</td>').join('');
  const bandMarkup=showMapBand?'<td data-explorer-col="mapBand">'+bandMatchesCell(row,f)+'</td>':'';
  const strandMarkup=showStrand?'<td data-explorer-col="strand">'+strandMatchesCell(row)+'</td>':'';
  return '<tr><th scope="row"><span class="faculty-learner-entry">'+renderStudentPhoto(row.student)+
   '<button type="button" tabindex="'+(index===0?'0':'-1')+'" class="student-link" data-explorer-student="'+s(row.student.id)+'">'+s(row.student.name)+'</button></span></th>'+
   '<td>'+s(row.student.grade)+'</td><td>'+s(row.student.classId)+'</td>'+
   '<td class="explorer-teacher">'+s(row.teacher?.name||'—')+'</td>'+cells+
   bandMarkup+strandMarkup+
   '<td><div class="staff-roster-support">'+supportStatusBadges(row.student,{compact:true,interactive:false})+'</div></td></tr>';
 }).join('');
 const classes=model.classes;
 const teacherChoices=[['all','All teachers'],...model.teachers.map(t=>[t.id,t.name])];
 const mapChoices=[['all','All MAP tests'],...MAP_RIT_SUBJECTS.map(test=>[test,test])];
 const bandChoices=[['all','All percentile bands'],['both','Low + Low Average'],
  ...MAP_RIT_BANDS.map(b=>[b.key,b.label+' · P'+b.from+'–'+b.to])];
 const headerChoices=[['name','Learner'],['grade','Grade'],['class','Class'],['teacher','Teacher'],
  ['attendance','Attendance'],['subject','Selected subject'],
  ...columns.filter(c=>c.kind==='report').map(c=>['report:'+c.subject,c.subject]),
  ...MAP_RIT_SUBJECTS.map(test=>['map:'+test,'MAP '+test+' RIT']),
  ['mapBand','MAP achievement band'],['strandRit','Strand RIT'],['strandBand','Strand descriptor']];
 const activeNames=active.map(key=>{
  if(key==='division')return f.division;
  if(key==='grade')return f.grade;
  if(key==='subject')return 'Subject: '+f.subject;
  if(key==='gradeFilter')return 'Grade threshold: '+f.gradeFilter;
  if(key==='mapTest')return 'MAP '+f.mapTest;
  if(key==='band')return 'MAP band: '+f.band;
  if(key==='strandBand')return 'Strand band: '+f.strandBand;
  if(key==='strand')return 'MAP strand: '+f.strand;
  if(key==='eal')return 'EAL: '+f.eal;
  if(key==='learning')return 'Learning Support: '+f.learning;
  if(key==='teacher')return 'Teacher: '+(model.teachers.find(t=>t.id===f.teacher)?.name||f.teacher);
  if(key==='classId')return 'Class: '+f.classId;
  return key;
 });
 const gradeChoices=[['All','All grades'],...model.grades.map(g=>[g,gradeLabel(g)])];
 return '<section id="leader-student-explorer" class="leader-student-explorer roster-daily" aria-label="Leaders Student Explorer">'+
  '<div class="explorer-toolbar" aria-label="Student Explorer search and filters">'+
   '<label class="explorer-field explorer-search"><span>Find student</span>'+
    '<input type="search" data-explorer-search value="'+s(f.query)+'" placeholder="Search name, ID or class" aria-label="Find student"></label>'+
   select('Division','division',[['All','Whole school'],['Elementary','Elementary'],['Secondary','Secondary']],f.division)+
   select('Grade','grade',gradeChoices,model.grade)+
   '<button type="button" class="explorer-secondary explorer-filters-toggle" data-explorer-toggle-filters aria-expanded="'+
     (filtersOpen?'true':'false')+'" aria-controls="explorer-advanced-filters">Filters'+
     (active.length?' ('+active.length+')':'')+' <span aria-hidden="true">'+(filtersOpen?'▴':'▾')+'</span></button>'+
   '<strong class="explorer-count" aria-live="polite">'+model.total+' <small>learners</small></strong>'+
  '</div>'+
  '<div class="explorer-advanced-filter-grid" id="explorer-advanced-filters"'+(filtersOpen?'':' hidden')+'>'+
   select('Class / homeroom','classId',[['','All classes'],...classes.map(c=>[c.id,c.name])],f.classId)+
   select('Teacher / advisor','teacher',teacherChoices,f.teacher)+
   select('Subject','subject',[['all','Any subject'],...model.subjects.map(subject=>[subject,subject])],f.subject)+
   select('Subject grade / descriptor','gradeFilter',[['all','All results'],
     ['numeric-2','Numeric grade 2 or below (MYP / DP)'],
     ['numeric-3','Numeric grade 3 or below (MYP / DP)'],
     ['emerging','Emerging (Elementary)'],['developing','Developing (Elementary)'],
     ['missing','Missing subject result']],f.gradeFilter)+
   select('EAL','eal',[['all','All EAL statuses'],['active','Active EAL'],
     ['monitor','EAL monitoring'],['exited','Exited'],['none','No EAL']],f.eal)+
   select('Learning Support','learning',[['all','All learners'],['yes','With support'],['no','No support flag']],f.learning)+
   select('MAP test','mapTest',mapChoices,f.mapTest)+
   select('MAP strand','strand',[['','Any strand'],...model.goalNames.map(name=>[name,name])],model.goalName)+
   select('MAP percentile band','band',bandChoices,f.band)+
   select('MAP strand descriptor','strandBand',[['all','Any strand band'],['both','Low + Low Average'],
    ...MAP_RIT_BANDS.map(b=>[b.key,b.label])],f.strandBand)+
   '<p class="explorer-filter-help">A strand descriptor without a named strand searches <strong>any matching goal</strong> in the selected MAP test. When all tests are selected, any MAP subject can match. Numeric grades apply only to MYP/DP; developmental descriptors apply only to Elementary.</p>'+
  '</div>'+
  (activeNames.length?'<div class="explorer-active-filters" aria-label="Active filters">'+
    activeNames.map(name=>'<span>'+s(name)+'</span>').join('')+
    '<button type="button" data-explorer-reset>Clear filters</button></div>':'')+
  '<div class="explorer-actions">'+
   '<div class="explorer-action-sort">'+
    select('Sort by','sort',headerChoices,model.sort)+
    '<button type="button" class="explorer-secondary" data-explorer-direction aria-label="Reverse sorting">'+
      (model.direction===1?'Ascending ↑':'Descending ↓')+'</button></div>'+
   '<div class="explorer-action-right">'+
    '<span class="explorer-roster-context">'+(model.grade==='All'?
       'All learners · subjects shown per student':'Grade-specific Faculty subject columns')+'</span>'+
    '<button type="button" class="explorer-secondary" data-explorer-reset>Reset</button>'+
    '<button type="button" class="explorer-primary" data-export-dashboard>Export CSV</button>'+
    '<button type="button" class="explorer-scroll-arrow" data-explorer-scroll="-1" aria-label="Scroll table left">←</button>'+
    '<button type="button" class="explorer-scroll-arrow" data-explorer-scroll="1" aria-label="Scroll table right">→</button>'+
   '</div></div>'+
  '<div class="tablewrap explorer-scroll" tabindex="0" aria-label="Scrollable Student Explorer roster">'+
    '<table class="faculty-data-wall explorer-table" aria-label="Filtered learners and evidence">'+
      '<thead><tr><th scope="col">'+sortButton('name','Learner')+'</th>'+
       '<th scope="col">'+sortButton('grade','Grade')+'</th>'+
       '<th scope="col">'+sortButton('class','Class')+'</th>'+
       '<th scope="col">'+sortButton('teacher','Advisor')+'</th>'+
       columns.map(c=>'<th scope="col"'+(c.kind==='report'?' data-explorer-group="report"':'')+
         (c.kind==='mapRit'?' data-map-rit-subject="'+s(c.subject)+'"':'')+
         (c.kind==='report'?' title="'+s(c.subject)+'" data-source-heading="'+s(c.subject)+'"':'')+'>'+
         sortButton(c.kind==='mapRit'?'map:'+c.subject:c.kind==='attendance'?'attendance':
          c.kind==='report'?'report:'+c.subject:c.kind,labelFor(c))+'</th>').join('')+
       (showMapBand?'<th scope="col">'+sortButton('mapBand','MAP band match')+'</th>':'')+
       (showStrand?'<th scope="col">'+sortButton('strandRit','Matching MAP strand')+'</th>':'')+
       '<th scope="col">Support information</th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table></div>'+
  (!rows?'<p class="explorer-empty-state">No learners match these filters. Try broadening a band, strand, or support criterion.</p>':'')+
  '<div class="explorer-footer"><span>All '+model.total+' matching learners are included in this view and CSV export. Open a name for the learner profile; use ↑ / ↓ on a selected name to move between learners.</span>'+
   renderMapRitLegend()+'</div>'+
  '</section>';
}
export function leaderExplorerExportRows({data,academic,experience,filters={}}){
 const model=leaderExplorerModel({data,academic,experience,filters});
 const subjectCols=model.grade==='All'?
  [...new Set(GRADES.filter(g=>data.students.some(student=>
   student.grade===g&&(model.division==='All'||student.division===model.division)))
   .flatMap(reportSubjectsFor))].map(subject=>({subject})):
  explorerColumns({grade:model.grade,division:model.division,data}).filter(c=>c.kind==='report');
 const cols=['Student','Demo ID','Division','Grade','Class','Teacher','Subject','Subject result','Attendance %',
  ...subjectCols.map(c=>'Subject grade · '+c.subject),
  ...MAP_RIT_SUBJECTS.flatMap(test=>['MAP '+test+' RIT','MAP '+test+' percentile','MAP '+test+' band']),
  'Selected MAP test','MAP achievement band','MAP strand','Strand Goal RIT','Strand descriptor',
  'EAL status','Learning Support','Engagement band','Belonging band'];
 const result=model.rows.map(row=>{
  const band=mapRitBand(row.focus?.percentile);
  return [row.student.name,row.student.id,row.student.division,row.student.grade,row.student.classId,
   row.teacher?.name||'',row.reportItem?.subject||'',row.reportItem?.value||'',row.attendance??'',
   ...subjectCols.map(c=>row.report?.subjects.find(item=>item.subject===c.subject)?.value??''),
   ...MAP_RIT_SUBJECTS.flatMap(test=>{const r=row.map[test],b=mapRitBand(r?.percentile);
    return [r?.rit??'',r?.percentile??'',b?.label||'']}),
   model.mapTest,band?.label||'',model.goalName,row.goal?.rit??'',strandBandLabel(strandBand(row.goal)),
   row.support?.eal||'',row.support?.hasLearning?'Yes':'No',row.engagementBand||'',row.belongingBand||''];
 });
 return {headers:cols,rows:result,count:model.total};
}
