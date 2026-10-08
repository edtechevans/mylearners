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
const storage=(()=>{try{return globalThis.localStorage}catch{return null}})();
const navStorage=(()=>{try{return globalThis.sessionStorage}catch{return null}})();
const NAV_KEY='aisg-v2-navigation-context';
function readNavigation(){try{return JSON.parse(navStorage?.getItem(NAV_KEY)||'null')||{}}catch{return {}}}
const navDraft=readNavigation();
function preserveNavigation(){
 try{navStorage?.setItem(NAV_KEY,JSON.stringify({teacherId:state.teacherId,
  classId:state.classId,rosterFilter:state.rosterFilter,classMode:state.classMode,
  rosterQuery:state.rosterQuery,learnerQuery:state.learnerQuery,
  studentClassFilter:state.studentClassFilter,subject:state.subject,
  actionFilter:state.actionFilter,returnContext:state.returnContext,
  classOrigin:state.classOrigin,actionOrigin:state.actionOrigin}))}catch{}
}
function getSaved(key){try{return storage?.getItem(key)}catch{return null}}
function setSaved(key,value){try{storage?.setItem(key,value)}catch{}}
const activeId=getSaved('aisg-v2-faculty');
const firstFaculty=data.teachers.find(t=>t.id===activeId)?.id||DEFAULT_TEACHER_ID;
const savedView=navDraft.teacherId===firstFaculty?navDraft:{};
const validOrigin=x=>x&&x.teacherId===firstFaculty&&typeof x.hash==='string'&&x.hash.startsWith('#/');
export const state={
 teacherId:firstFaculty,classId:savedView.classId||getSaved('aisg-v2-class')||'',
 route:'today',rosterFilter:savedView.rosterFilter||'all',classMode:savedView.classMode||'roster',
 rosterQuery:savedView.rosterQuery||'',learnerQuery:savedView.learnerQuery||'',
 studentClassFilter:savedView.studentClassFilter||'all',studentTab:'overview',subject:savedView.subject||'Mathematics',
 actionFilter:savedView.actionFilter||'all',actionModal:false,editingActionId:'',
 returnContext:validOrigin(savedView.returnContext)?savedView.returnContext:null,
 classOrigin:validOrigin(savedView.classOrigin)?savedView.classOrigin:null,
 actionOrigin:validOrigin(savedView.actionOrigin)?savedView.actionOrigin:null,
 toast:'',dialogOpener:null,pendingFocus:'',
 modalClassId:'',modalStudentId:'',modalTitle:'',modalStrategy:'',modalEvidence:'',modalDue:'2026-10-12',
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
 if(seg[0]==='student'&&seg[1])return {page:'student',id:seg[1],tab:['overview','learning','map','attendance','support'].includes(seg[2])?seg[2]:'overview'};
 if(seg[0]==='class')return {page:'class',id:seg[1]||''};
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
 '<p>Real AISG faculty names; all demo class assignments and student records are fictional. No live school system is connected.</p></div>'+
 '<div class="v2-small-footer">My Learners · Version 2.0<br/>Understanding → action → learning</div></div></aside>';
}
function topbar(p,ctx){
 const label=p.page==='student'?'Learner profile':tabs.find(t=>t.id===p.page)?.label||'Today';
 return '<header class="v2-topbar"><div class="v2-top-left"><button class="v2-mobile-menu" data-menu="1" aria-label="Toggle navigation">'+icon('menu',19)+'</button>'+
 '<span class="v2-breadcrumb">AISG <span>›</span> <strong>'+esc(label)+'</strong></span></div>'+
 '<div class="v2-top-actions"><form id="v2-global-search-form" class="v2-global-search" role="search"><input id="v2-global-search" name="query" placeholder="Find a learner..." aria-label="Find a learner by name or ID"/>'+
 '<button type="submit" aria-label="Search learners">'+icon('search',17)+'</button></form>'+
 '<button class="v2-compact-search" type="button" data-search-route="1" aria-label="Find a learner">'+icon('search',19)+'</button>'+
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
 if(p.page==='student')state.studentTab=p.tab;
 if(p.page==='class'&&p.id&&classes().some(c=>c.id===p.id))state.classId=p.id;
 const focusSel=previously?.getAttribute?.('data-group-student')?
  '[data-group-student="'+previously.getAttribute('data-group-student')+'"]':
  previously?.getAttribute?.('data-roster-filter')?'[data-roster-filter="'+previously.getAttribute('data-roster-filter')+'"]':
  previously?.getAttribute?.('data-student-tab')?'[data-student-tab="'+previously.getAttribute('data-student-tab')+'"]':
  previously?.getAttribute?.('data-class-mode')?'[data-class-mode="'+previously.getAttribute('data-class-mode')+'"]':null;
 const focusedModalName=previously?.closest?.('.v2-modal')?.contains(previously)?previously.getAttribute('name'):null;
 const ctx=context();
 const body=actualPage(p,ctx);
 app.innerHTML='<div class="v2-app"><div class="v2-brand-stripe"></div><button type="button" class="v2-skip-link" data-skip-main="1">Skip to main content</button>'+
 (state.mobile?'<div class="v2-mobile-shade" data-menu="1"></div>':'')+
 sidebar(p,ctx)+'<div class="v2-workspace"'+(state.actionModal||state.editingActionId||state.insightId?' inert aria-hidden="true"':'')+'>'+topbar(p,ctx)+
 '<main class="v2-main" id="main-content" tabindex="-1">'+body+foot()+'</main></div>'+
 renderInsightDrawer(ctx)+renderActionModal(ctx)+
 (state.toast?'<div class="v2-toast" role="status">'+icon('check',16)+' '+esc(state.toast)+' <button data-dismiss-toast="1" aria-label="Dismiss notification">'+icon('close',14)+'</button></div>':'')+'</div>';
 globalThis.document?.body?.classList?.toggle?.('v2-dialog-open',Boolean(state.actionModal||state.editingActionId||state.insightId));
 preserveNavigation();
 if(active==='v2-roster-search'||active==='v2-learner-search'){
  const restored=globalThis.document.getElementById(active);
  if(restored){restored.focus();if(typeof caret==='number'&&restored.setSelectionRange)restored.setSelectionRange(caret,caret)}
 }
 const activeDialog=app.querySelector?.('.v2-modal, .v2-drawer');
 if(activeDialog){
  const target=(focusedModalName&&activeDialog.querySelector('[name="'+focusedModalName+'"]'))||
   activeDialog.querySelector('.v2-form-error')||activeDialog.querySelector('input:not([type=hidden]), textarea, select, button');
  target?.focus?.();
 }else if(state.pendingFocus){app.querySelector?.(state.pendingFocus)?.focus?.();state.pendingFocus='';}
 else if(focusSel)app.querySelector?.(focusSel)?.focus?.();
}
function rememberOrigin(){
 const p=route();
 state.returnContext={teacherId:state.teacherId,page:p.page,hash:globalThis.location.hash||'#/today',
  classId:state.classId,classMode:state.classMode,rosterFilter:state.rosterFilter,
  rosterQuery:state.rosterQuery,learnerQuery:state.learnerQuery,
  studentClassFilter:state.studentClassFilter,subject:state.subject,
  scrollY:globalThis.window?.scrollY||0};
 preserveNavigation();
}
function restoreContext(origin){
 if(!origin||origin.teacherId!==state.teacherId)return false;
 for(const k of ['classId','classMode','rosterFilter','rosterQuery','learnerQuery','studentClassFilter','subject'])
  if(origin[k]!==undefined)state[k]=origin[k];
 const dest=origin.hash||'#/learners';
 state.toast='Returned to your previous view';
 if(globalThis.location.hash===dest)render();else globalThis.location.hash=dest;
 if(origin.scrollY>0&&globalThis.window?.requestAnimationFrame)
  globalThis.window.requestAnimationFrame(()=>globalThis.window.scrollTo?.(0,origin.scrollY));
 preserveNavigation();
 return true;
}
function returnToOrigin(kind){
 const origin=kind==='class'?state.classOrigin:kind==='actions'?state.actionOrigin:state.returnContext;
 if(!restoreContext(origin))go(kind==='class'?'growth':kind==='actions'?'class':'learners',kind==='actions'?currentClass()?.id:'');
}
function dismissToast(){state.toast='';render()}
function go(page,id='',tab=''){
 state.insightId='';state.mobile=false;
 const hash='#/'+page+(id?'/'+id:'')+(page==='student'&&tab&&tab!=='overview'?'/'+tab:'');
 if(globalThis.location.hash===hash)render();else globalThis.location.hash=hash;
 try{globalThis.window.scrollTo({top:0,behavior:'instant'})}catch{}
}
function setCurrentClass(id){
 if(!classes().some(c=>c.id===id))return;
 if(state.classId!==id){state.classMode='roster';state.rosterFilter='all';state.rosterQuery=''}
 state.classId=id;setSaved('aisg-v2-class',id);preserveNavigation();
}
function openCreate(trigger){
 const id=trigger?.dataset?.createAction;
 const s=trigger?.dataset?.actionStudent||'';
 state.dialogOpener=globalThis.document?.activeElement?.getAttribute?.('data-create-action')||'';
 if(route().page!=='actions'){state.actionOrigin={teacherId:state.teacherId,page:route().page,hash:globalThis.location.hash||'#/today',classId:state.classId}}
 state.actionModal=true;state.editingActionId='';state.modalClassId=id||currentClass()?.id||'';
 state.modalStudentId=s;state.modalTitle='';state.modalEvidence=trigger?.dataset?.actionEvidence||'Teacher reflection · demo';
 state.modalStrategy='';state.modalDue='2026-10-12';state.formError='';render();
}
function closeModal(){
 state.actionModal=false;state.editingActionId='';state.formError='';render();
 const trigger=state.dialogOpener?app?.querySelector?.('[data-create-action="'+state.dialogOpener+'"]'):null;
 (trigger||app?.querySelector?.('[data-nav="actions"]'))?.focus?.();
}
function openInsight(id){state.insightId=id;state.actionModal=false;render()}
function closeInsight(){const prev=state.insightId;state.insightId='';render();app?.querySelector?.('[data-insight="'+prev+'"]')?.focus?.()}
function actionFromInsight(id){
 const insight=context().insights.find(x=>x.id===id);if(!insight)return;
 state.insightId='';state.editingActionId='';state.actionModal=true;
 state.modalClassId=insight.classId;state.modalStudentId='';
 state.modalTitle=insight.title;state.modalEvidence=insight.source;
 state.modalStrategy='Investigate the evidence with learners and try a purposeful adjustment in the next lesson.';
 state.modalDue='2026-10-12';state.formError='';render();
}
function clickHandler(event){
 const target=event.target;if(!target||typeof target.closest!=='function')return;
 let el;
 if((el=target.closest('[data-skip-main]'))){app?.querySelector?.('#main-content')?.focus?.();return}
 if((el=target.closest('[data-menu]'))){state.mobile=!state.mobile;render();return}
 if((el=target.closest('[data-close-modal]'))){closeModal();return}
 if((el=target.closest('[data-close-insight]'))){closeInsight();return}
 if((el=target.closest('[data-dismiss-toast]'))){dismissToast();return}
 if((el=target.closest('[data-return-profile]'))){returnToOrigin('profile');return}
 if((el=target.closest('[data-return-class]'))){returnToOrigin('class');return}
 if((el=target.closest('[data-return-actions]'))){returnToOrigin('actions');return}
 if((el=target.closest('[data-search-route]'))){state.learnerQuery='';go('learners');globalThis.window?.requestAnimationFrame?.(()=>app?.querySelector?.('#v2-learner-search')?.focus?.());return}
 if((el=target.closest('[data-nav]'))){
  const dest=el.dataset.nav==='classes'?'class':el.dataset.nav;
  if(dest==='class')state.classOrigin=null;
  go(dest,dest==='class'?currentClass()?.id:'');return
 }
 if((el=target.closest('[data-open-class]'))){
  const from=route();
  if(['growth','today','actions'].includes(from.page))state.classOrigin={teacherId:state.teacherId,page:from.page,hash:globalThis.location.hash||'#/today',classId:state.classId};
  setCurrentClass(el.dataset.openClass);go('class',el.dataset.openClass);return
 }
 if((el=target.closest('[data-open-student]'))){
  rememberOrigin();state.studentTab=el.dataset.targetTab||'overview';
  go('student',el.dataset.openStudent,state.studentTab);return
 }
 if((el=target.closest('[data-student-tab]'))){state.studentTab=el.dataset.studentTab;state.pendingFocus='[data-student-tab="'+state.studentTab+'"]';go('student',route().id,state.studentTab);return}
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
  if(typeof globalThis.window?.confirm==='function'&&!globalThis.window.confirm('Reset your demo grouping adjustments for this class?'))return;
  const cid=el.dataset.resetGroups;saveGroupOverrides(teacher().id,cid,{});
  state.toast='Group suggestions reset';render();return
 }
}
function changeHandler(event){
 const target=event.target;
 if(target.id==='v2-faculty'){
  if(!data.teachers.some(t=>t.id===target.value))return;
  state.teacherId=target.value;setSaved('aisg-v2-faculty',target.value);
  state.classId='';setSaved('aisg-v2-class','');state.studentClassFilter='all';
  state.rosterQuery='';state.learnerQuery='';state.classMode='roster';state.insightId='';state.studentTab='overview';
  state.returnContext=null;state.classOrigin=null;state.actionOrigin=null;state.toast='Teacher demonstration switched';
  go('today');return;
 }
 if(target.id==='v2-class-select'){
  setCurrentClass(target.value);go('class',target.value);return;
 }
 if(target.id==='v2-learner-class'){
  state.studentClassFilter=target.value;render();return;
 }
 if(target.name==='classId'&&target.closest?.('#v2-create-form')){
  const form=target.closest('form');
  state.modalClassId=target.value;
  state.modalStudentId='';
  state.modalTitle=form?.elements?.namedItem?.('title')?.value||state.modalTitle;
  state.modalStrategy=form?.elements?.namedItem?.('strategy')?.value||state.modalStrategy;
  state.modalEvidence=form?.elements?.namedItem?.('evidence')?.value||state.modalEvidence;
  state.modalDue=form?.elements?.namedItem?.('due')?.value||state.modalDue;
  render();return;
 }
 if(target.id==='v2-subject-select'){
  state.subject=target.value;render();return;
 }
 if(target.dataset?.groupStudent){
  const studentId=target.dataset.groupStudent,classId=target.dataset.groupClass;
  const c=data.classIndex.get(classId);
  if(!c||!teacher().classIds.includes(classId)||!c.studentIds.includes(studentId))return;
  const previous=readGroupOverrides(teacher().id,classId);
  previous[studentId]=target.value;saveGroupOverrides(teacher().id,classId,previous);
  state.toast='Group updated and saved in this browser';render();return;
 }
}
function inputHandler(event){
 const target=event.target;
 if(target.id==='v2-roster-search'){state.rosterQuery=target.value;render();return}
 if(target.id==='v2-learner-search'){state.learnerQuery=target.value;render();return}
}
function keyHandler(event){
 if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)&&event.target?.dataset?.studentTab){
  const keys=['overview','learning','map','attendance','support'];
  const index=keys.indexOf(event.target.dataset.studentTab);
  const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(index+(event.key==='ArrowRight'?1:keys.length-1))%keys.length;
  event.preventDefault();state.studentTab=keys[next];state.pendingFocus='[data-student-tab="'+keys[next]+'"]';go('student',route().id,state.studentTab);return
 }
 if(event.key==='Tab'&&(state.actionModal||state.editingActionId||state.insightId)){
  const dialog=app?.querySelector?.('.v2-modal,.v2-drawer');
  const enabled=[...(dialog?.querySelectorAll('button:not([disabled]),input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')||[])]
   .filter(el=>el.getBoundingClientRect().width>0);
  if(enabled.length){
   const first=enabled[0],last=enabled.at(-1);
   if(event.shiftKey&&globalThis.document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&globalThis.document.activeElement===last){event.preventDefault();first.focus()}
  }
 }
 if(event.key==='Escape'){
  if(state.actionModal||state.editingActionId)closeModal();
  else if(state.insightId){closeInsight();}
  else if(state.mobile){state.mobile=false;render()}
 }
 if(event.key==='/'&&['BODY','MAIN'].includes(event.target?.tagName)&&!event.ctrlKey&&!event.metaKey){
  const search=app?.querySelector?.('#v2-global-search')||app?.querySelector?.('#v2-learner-search');
  if(search){event.preventDefault();search.focus()}
 }
}
function formValue(form,name){
 const el=form.elements?.namedItem?.(name)||form.querySelector?.('[name="'+name+'"]');
 return el?.value??'';
}
function submitHandler(event){
 if(event.target?.id==='v2-global-search-form'){
  event.preventDefault();state.learnerQuery=formValue(event.target,'query').trim();
  state.studentClassFilter='all';go('learners');return;
 }
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
  }catch(error){
   const form=event.target;
   for(const [field,key] of [['classId','modalClassId'],['studentId','modalStudentId'],['title','modalTitle'],
    ['strategy','modalStrategy'],['evidence','modalEvidence'],['due','modalDue']])state[key]=formValue(form,field);
   state.formError=error.message||'Unable to save this demo action';render()
  }
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