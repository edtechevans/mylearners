/**
 * AISG | My Learners 2.0 — teacher-first, actionable, demo-only web application.
 * Public GitHub Pages must never receive real student data.
 */
import {generateDemoData} from './data.mjs';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from './faculty-demo.mjs';
import {buildPulseData,pulseForClass,classInsights,DEMO_DAY} from './pulse-data.mjs';
import {loadActions,createAction,updateAction,removeAction,saveGroupOverrides,
 readGroupOverrides,resetPersonaDemo} from './pulse-actions.mjs';
import {renderToday,renderClass,renderLearners,renderGrowth,renderStudent,
 renderActions,renderInsightDrawer,renderActionModal} from './v2-pages.mjs';
import {icon,esc,initials,prettyDate} from './v2-ui.mjs';

export const APP_VERSION='2.0-demo';
export const data=applyFacultyDemo(generateDemoData());
export const pulse=buildPulseData(data);
const storage=globalThis.localStorage;
function getSaved(key){try{return storage?.getItem(key)}catch{return null}}
function setSaved(key,value){try{storage?.setItem(key,value)}catch{}}
const activeId=getSaved('aisg-v2-faculty');
const firstFaculty=data.teachers.find(t=>t.id===activeId)?.id||DEFAULT_TEACHER_ID;
export const state={
 teacherId:firstFaculty,classId:getSaved('aisg-v2-class')||'',
 route:'today',rosterFilter:'all',classMode:'roster',studentQuery:'',
 studentClassFilter:'all',studentTab:'overview',subject:'Mathematics',
 actionFilter:'all',actionModal:false,editingActionId:'',
 modalClassId:'',modalStudentId:'',modalTitle:'',modalStrategy:'',modalEvidence:'',
 formError:'',insightId:'',mobile:false
};
const app=globalThis.document?.getElementById('app');
export function teacher(){
 return data.teachers.find(t=>t.id===state.teacherId)||data.teachers.find(t=>t.id===DEFAULT_TEACHER_ID);
}
export function classes(){
 const set=new Set(teacher().classIds);
 return data.classes.filter(c=>set.has(c.id));
}
export function students(){
 const set=new Set(teacher().classIds);
 return data.students.filter(s=>set.has(s.classId));
}
export function currentClass(){
 const available=classes();
 return available.find(c=>c.id===state.classId)||available[0]||null;
}
export function context(){
 const t=teacher(),cls=classes(),s=students();
 const insights=cls.flatMap(c=>classInsights(pulseForClass(data,pulse,c)));
 return {teacher:t,classes:cls,students:s,currentClass:currentClass(),
  data,pulse,state,actions:loadActions(t,data.classes),insights,
  activeInsight:insights.find(x=>x.id===state.insightId)||null,
  editingAction:loadActions(t,data.classes).find(x=>x.id===state.editingActionId)||null};
}
const tabs=[
 {id:'today',label:'Today',icon:'home'},
 {id:'class',label:'Class Pulse',icon:'layers'},
 {id:'learners',label:'My Learners',icon:'users'},
 {id:'growth',label:'Growth & Evidence',icon:'chart'},
 {id:'actions',label:'My Actions',icon:'clipboard'}
];
function personaOptions(selected){
 return ['Elementary','Secondary'].map(div=>{
  const people=data.teachers.filter(t=>t.division===div).sort((a,b)=>a.name.localeCompare(b.name,'en'));
  return '<optgroup label="'+esc(div)+' · My Observations working faculty list">'+people.map(t=>
   '<option value="'+esc(t.id)+'" '+(t.id===selected?'selected':'')+'>'+esc(t.name)+' · '+esc(t.primaryPlc)+'</option>').join('')+'</optgroup>';
 }).join('');
}
function route(){
 const p=String(globalThis.location?.hash||'').replace(/^#\/?/,'');
 const seg=p.split('/');
 if(seg[0]==='student'&&seg[1])return {page:'student',id:seg[1]};
 if(tabs.some(x=>x.id===seg[0]))return {page:seg[0],id:''};
 return {page:'today',id:''};
}
function sidebar(p,ctx){
 return '<aside class="v2-sidebar '+(state.mobile?'open':'')+'">'+
 '<div class="v2-brand"><img src="./assets/aisg-logo.webp" alt="American International School of Guangzhou"/><div class="v2-brand-title"><b>My Learners</b><span>THE LEARNING PULSE</span></div></div>'+
 '<div class="v2-nav-caption">YOUR WORKSPACE</div><nav aria-label="Primary navigation" class="v2-nav">'+tabs.map(t=>
 '<button class="v2-nav-item '+(p.page===t.id?'active':'')+'" data-nav="'+t.id+'" aria-current="'+(p.page===t.id?'page':'false')+'">'+icon(t.icon,18)+'<span>'+t.label+'</span>'+
 (t.id==='actions'&&ctx.actions.filter(a=>a.status==='revisit').length?'<span class="v2-nav-counter">'+ctx.actions.filter(a=>a.status==='revisit').length+'</span>':'')+'</button>').join('')+'</nav>'+
 '<div class="v2-side-bottom"><div class="v2-side-demo"><span class="v2-demo-mark">'+icon('shield',16)+' DEMONSTRATION</span>'+
 '<p>Actual AISG faculty names, fictional student data, fictional assignments. No live school system is connected.</p></div>'+
 '<div class="v2-small-footer">My Learners · Version 2.0<br/>Understanding → action → learning</div></div></aside>';
}
function topbar(p,ctx){
 const label=p.page==='student'?'Learner profile':tabs.find(t=>t.id===p.page)?.label||'Today';
 return '<header class="v2-topbar"><div class="v2-top-left"><button class="v2-mobile-menu" data-menu="1" aria-label="Toggle navigation">'+icon('menu',19)+'</button>'+
 '<span class="v2-breadcrumb">AISG <span>›</span> <strong>'+esc(label)+'</strong></span></div>'+
 '<div class="v2-top-actions"><label class="v2-global-search">'+icon('search',16)+'<input id="v2-global-search" placeholder="Find a learner..." aria-label="Find a learner"/></label>'+
 '<span class="v2-faculty-avatar">'+esc(initials(ctx.teacher.name))+'</span>'+
 '<label class="v2-persona-label"><span class="v2-visually-hidden">Demonstration teacher</span><select id="v2-faculty" aria-label="Select AISG faculty demonstration persona">'+personaOptions(ctx.teacher.id)+'</select></label>'+
 '<span class="v2-demo-tag">DEMO</span></div></header>';
}
function foot(){
 return '<footer class="v2-footer"><span>AISG | My Learners · Demo date: '+prettyDate(DEMO_DAY)+'</span>'+
 '<span>Staff names: My Observations working directory · All students, assignments, actions and insights: fictional</span>'+
 '<span>No secure access controls or live integrations on GitHub Pages</span></footer>';
}
function actualPage(p,ctx){
 if(p.page==='today')return renderToday(ctx);
 if(p.page==='class')return renderClass(ctx);
 if(p.page==='learners')return renderLearners(ctx);
 if(p.page==='growth')return renderGrowth(ctx);
 if(p.page==='actions')return renderActions(ctx);
 return renderStudent(ctx,p.id);
}
export function render(){
 if(!app)return;
 const previously=globalThis.document.activeElement;
 const active=previously?.id||'';
 let caret=null;
 try{caret=previously?.selectionStart}catch{}
 const p=route();state.route=p.page;
 const ctx=context();
 const body=actualPage(p,ctx);
 app.innerHTML='<div class="v2-app"><div class="v2-brand-stripe"></div>'+
 (state.mobile?'<div class="v2-mobile-shade" data-menu="1"></div>':'')+
 sidebar(p,ctx)+'<div class="v2-workspace">'+topbar(p,ctx)+
 '<main class="v2-main" id="main-content">'+body+foot()+'</main></div>'+
 renderInsightDrawer(ctx)+renderActionModal(ctx)+'</div>';
 if(active==='v2-roster-search'||active==='v2-learner-search'){
  const restored=globalThis.document.getElementById(active);
  if(restored){restored.focus();if(typeof caret==='number'&&restored.setSelectionRange)restored.setSelectionRange(caret,caret)}
 }
}
function go(page,id=''){
 state.insightId='';state.mobile=false;
 const hash='#/'+page+(id?'/'+id:'');
 if(globalThis.location.hash===hash)render();else globalThis.location.hash=hash;
 try{globalThis.window.scrollTo({top:0,behavior:'instant'})}catch{}
}
function setCurrentClass(id){
 if(!classes().some(c=>c.id===id))return;
 state.classId=id;setSaved('aisg-v2-class',id);state.classMode='roster';state.rosterFilter='all';state.studentQuery='';
}
function openCreate(trigger){
 const id=trigger?.dataset?.createAction;
 const s=trigger?.dataset?.actionStudent||'';
 state.actionModal=true;state.editingActionId='';state.modalClassId=id||currentClass()?.id||'';
 state.modalStudentId=s;state.modalTitle='';state.modalEvidence=trigger?.dataset?.actionEvidence||'Teacher reflection · demo';
 state.modalStrategy='';state.formError='';render();
}
function closeModal(){
 state.actionModal=false;state.editingActionId='';state.formError='';render();
}
function openInsight(id){state.insightId=id;state.actionModal=false;render()}
function actionFromInsight(id){
 const insight=context().insights.find(x=>x.id===id);if(!insight)return;
 state.insightId='';state.editingActionId='';state.actionModal=true;
 state.modalClassId=insight.classId;state.modalStudentId='';
 state.modalTitle=insight.title;state.modalEvidence=insight.source;
 state.modalStrategy='Investigate the evidence with learners and try a purposeful adjustment in the next lesson.';
 state.formError='';render();
}
function clickHandler(event){
 const target=event.target;if(!target||typeof target.closest!=='function')return;
 let el;
 if((el=target.closest('[data-menu]'))){state.mobile=!state.mobile;render();return}
 if((el=target.closest('[data-close-modal]'))){closeModal();return}
 if((el=target.closest('[data-close-insight]'))){state.insightId='';render();return}
 if((el=target.closest('[data-nav]'))){state.studentQuery='';state.studentTab='overview';go(el.dataset.nav);return}
 if((el=target.closest('[data-open-class]'))){setCurrentClass(el.dataset.openClass);go('class');return}
 if((el=target.closest('[data-open-student]'))){state.studentTab=el.dataset.targetTab||'overview';go('student',el.dataset.openStudent);return}
 if((el=target.closest('[data-student-tab]'))){state.studentTab=el.dataset.studentTab;render();return}
 if((el=target.closest('[data-subject]'))){state.subject=el.dataset.subject;render();return}
 if((el=target.closest('[data-class-mode]'))){state.classMode=el.dataset.classMode;render();return}
 if((el=target.closest('[data-roster-filter]'))){state.rosterFilter=el.dataset.rosterFilter;render();return}
 if((el=target.closest('[data-action-filter]'))){state.actionFilter=el.dataset.actionFilter;render();return}
 if((el=target.closest('[data-insight-action]'))){actionFromInsight(el.dataset.insightAction);return}
 if((el=target.closest('[data-insight]'))){openInsight(el.dataset.insight);return}
 if((el=target.closest('[data-create-action]'))){openCreate(el);return}
 if((el=target.closest('[data-review-action]'))){
  state.editingActionId=el.dataset.reviewAction;state.actionModal=true;state.formError='';render();return
 }
 if((el=target.closest('[data-delete-action]'))){
  if(typeof globalThis.window?.confirm==='function'&&!globalThis.window.confirm('Remove this fictional follow-up?'))return;
  removeAction(teacher(),data.classes,el.dataset.deleteAction);render();return
 }
 if((el=target.closest('[data-reset-groups]'))){
  const cid=el.dataset.resetGroups;saveGroupOverrides(teacher().id,cid,{});render();return
 }
}
function changeHandler(event){
 const target=event.target;
 if(target.id==='v2-faculty'){
  if(!data.teachers.some(t=>t.id===target.value))return;
  state.teacherId=target.value;setSaved('aisg-v2-faculty',target.value);
  state.classId='';setSaved('aisg-v2-class','');state.studentClassFilter='all';
  state.studentQuery='';state.classMode='roster';state.insightId='';state.studentTab='overview';go('today');return;
 }
 if(target.id==='v2-class-select'){
  setCurrentClass(target.value);render();return;
 }
 if(target.id==='v2-learner-class'){
  state.studentClassFilter=target.value;render();return;
 }
 if(target.id==='v2-subject-select'){
  state.subject=target.value;render();return;
 }
 if(target.dataset?.groupStudent){
  const studentId=target.dataset.groupStudent,classId=target.dataset.groupClass;
  const c=data.classIndex.get(classId);
  if(!c||!teacher().classIds.includes(classId)||!c.studentIds.includes(studentId))return;
  const previous=readGroupOverrides(teacher().id,classId);
  previous[studentId]=target.value;saveGroupOverrides(teacher().id,classId,previous);render();return;
 }
}
function inputHandler(event){
 const target=event.target;
 if(['v2-roster-search','v2-learner-search'].includes(target.id)){
  state.studentQuery=target.value;render();return;
 }
}
function keyHandler(event){
 if(event.key==='Escape'){
  if(state.actionModal||state.editingActionId)closeModal();
  else if(state.insightId){state.insightId='';render();}
  else if(state.mobile){state.mobile=false;render()}
 }
 if(event.key==='Enter'&&event.target.id==='v2-global-search'){
  state.studentQuery=event.target.value;state.studentClassFilter='all';go('learners');
 }
}
function formValue(form,name){
 const el=form.elements?.namedItem?.(name)||form.querySelector?.('[name="'+name+'"]');
 return el?.value??'';
}
function submitHandler(event){
 if(event.target?.id==='v2-create-form'){
  event.preventDefault();
  try{
   const form=event.target;
   createAction(teacher(),data.classes,{
    classId:formValue(form,'classId'),
    studentId:formValue(form,'studentId'),
    title:formValue(form,'title'),strategy:formValue(form,'strategy'),
    due:formValue(form,'due'),evidence:formValue(form,'evidence')
   });
   state.actionModal=false;state.editingActionId='';state.formError='';go('actions');
  }catch(error){state.formError=error.message||'Unable to save this demo action';render()}
  return;
 }
 if(event.target?.id==='v2-review-form'){
  event.preventDefault();
  try{
   const form=event.target;
   updateAction(teacher(),data.classes,formValue(form,'id'),{
    strategy:formValue(form,'strategy'),status:formValue(form,'status'),
    outcome:formValue(form,'outcome'),due:formValue(form,'due')
   });
   state.actionModal=false;state.editingActionId='';state.formError='';go('actions');
  }catch(error){state.formError=error.message||'Unable to review';render()}
 }
}
export function wire(){
 if(!app)return;
 app.addEventListener('click',clickHandler);
 app.addEventListener('change',changeHandler);
 app.addEventListener('input',inputHandler);
 app.addEventListener('submit',submitHandler);
 globalThis.window?.addEventListener?.('hashchange',()=>{state.mobile=false;render()});
 globalThis.window?.addEventListener?.('keydown',keyHandler);
 render();
}
wire();