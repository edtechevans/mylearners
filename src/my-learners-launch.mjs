/**
 * AISG | My Learners — streamlined first-release application.
 * Read-only synthetic demonstration. Faculty names are real; all student data,
 * teaching assignments, photos, assessment and attendance are fictional.
 * Advanced Pulse/Actions prototypes are retained separately but NOT loaded here.
 */
import {generateDemoData} from './data.mjs';
import {applyFacultyDemo,DEFAULT_TEACHER_ID} from './faculty-demo.mjs';
import {buildPulseData,DEMO_DAY} from './pulse-data.mjs';
import {TAG_IDS} from './learner-tags.mjs';
import {renderLaunchHome,renderLaunchClass} from './first-release-pages.mjs';
import {renderLearners,renderGrowth,renderStudent} from './v2-pages.mjs';
import {icon,esc,initials,prettyDate} from './v2-ui.mjs';

export const APP_VERSION='2.1-first-release';
export const data=applyFacultyDemo(generateDemoData());
const pulse=buildPulseData(data);
const storage=(()=>{try{return globalThis.localStorage}catch{return null}})();
const session=(()=>{try{return globalThis.sessionStorage}catch{return null}})();
const saved=k=>{try{return storage?.getItem(k)||''}catch{return ''}};
const persist=(k,v)=>{try{storage?.setItem(k,v)}catch{}};
const readSession=()=>{try{return JSON.parse(session?.getItem('aisg-first-release-nav')||'null')||{}}catch{return {}}};
const teacherId=data.teachers.some(t=>t.id===saved('aisg-v2-faculty'))?saved('aisg-v2-faculty'):DEFAULT_TEACHER_ID;
const settings=readSession().teacherId===teacherId?readSession():{};
const validOrigin=x=>x?.teacherId===teacherId&&typeof x.hash==='string'&&x.hash.startsWith('#/');
export const state={
 teacherId,classId:settings.classId||saved('aisg-v2-class')||'',
 rosterFilter:['all','attendance','support',...TAG_IDS].includes(settings.rosterFilter)?settings.rosterFilter:'all',
 rosterQuery:settings.rosterQuery||'',learnerQuery:settings.learnerQuery||'',
 studentClassFilter:settings.studentClassFilter||'all',
 studentTab:'overview',supportFocus:'',subject:settings.subject||'Mathematics',
 returnContext:validOrigin(settings.returnContext)?settings.returnContext:null,
 classOrigin:validOrigin(settings.classOrigin)?settings.classOrigin:null,
 mobile:false,pendingFocus:''
};
const app=globalThis.document?.getElementById('app');
const routes=[{id:'home',label:'Home',icon:'home'}, {id:'class',label:'My Classes',icon:'layers'},
 {id:'learners',label:'My Learners',icon:'users'}, {id:'growth',label:'MAP Growth',icon:'chart'}];
export function teacher(){return data.teachers.find(t=>t.id===state.teacherId)||data.teachers.find(t=>t.id===DEFAULT_TEACHER_ID)}
export function classes(){const permitted=new Set(teacher().classIds);return data.classes.filter(c=>permitted.has(c.id))}
export function students(){const permitted=new Set(teacher().classIds);return data.students.filter(s=>permitted.has(s.classId))}
export function currentClass(){const available=classes();return available.find(c=>c.id===state.classId)||available[0]||null}
export function context(){return {teacher:teacher(),classes:classes(),students:students(),currentClass:currentClass(),
 data,pulse,state,actions:[],insights:[],activeInsight:null,editingAction:null}}
function saveNavigation(){
 try{session?.setItem('aisg-first-release-nav',JSON.stringify({
  teacherId:state.teacherId,classId:state.classId,rosterFilter:state.rosterFilter,
  rosterQuery:state.rosterQuery,learnerQuery:state.learnerQuery,
  studentClassFilter:state.studentClassFilter,subject:state.subject,
  returnContext:state.returnContext,classOrigin:state.classOrigin
 }))}catch{}
}
function route(){
 const p=String(globalThis.location?.hash||'').replace(/^#\/?/,'');
 const [seg,id,tab,focus]=p.split('/');
 if(seg==='student'&&id)return {page:'student',id,tab:['overview','learning','map','attendance','support'].includes(tab)?tab:'overview',focusTag:tab==='support'&&TAG_IDS.includes(focus)?focus:''};
 if(seg==='class')return {page:'class',id:id||''};
 if(seg==='today'||seg==='actions'||!seg)return {page:'home'};
 if(routes.some(r=>r.id===seg))return {page:seg};
 return {page:'home'};
}
function personaOptions(current){
 return ['Elementary','Secondary'].map(div=>{
  const names=data.teachers.filter(t=>t.division===div).sort((a,b)=>a.name.localeCompare(b.name,'en'));
  return '<optgroup label="'+esc(div)+' faculty · working roster">'+names.map(t=>
   '<option value="'+esc(t.id)+'" '+(t.id===current?'selected':'')+'>'+esc(t.name)+' · '+esc(t.primaryPlc)+'</option>').join('')+'</optgroup>';
 }).join('');
}
function sidebar(p,ctx){
 return '<aside class="v2-sidebar '+(state.mobile?'open':'')+'">'+
 '<div class="v2-brand"><img src="./assets/aisg-logo.webp" alt="American International School of Guangzhou"/>'+
 '<div class="v2-brand-title"><b>My Learners</b><span>STUDENT INFORMATION</span></div></div>'+
 '<div class="v2-nav-caption">MY WORKSPACE</div><nav aria-label="Primary navigation" class="v2-nav">'+routes.map(n=>
 '<button class="v2-nav-item '+(p.page===n.id?'active':'')+'" data-nav="'+n.id+
 '" aria-current="'+(p.page===n.id?'page':'false')+'">'+icon(n.icon,18)+'<span>'+n.label+'</span></button>').join('')+'</nav>'+
 '<div class="v2-side-bottom"><div class="v2-side-demo"><span class="v2-demo-mark">'+icon('shield',16)+' DEMONSTRATION</span>'+
 '<p>Real faculty names. Fictional classes, learner information and illustrations. No live SIS or LMS connections.</p></div>'+
 '<div class="v2-small-footer">AISG · My Learners<br/>First-release demonstration</div></div></aside>';
}
function header(p,ctx){
 const label=p.page==='student'?'Learner profile':routes.find(x=>x.id===p.page)?.label||'Home';
 return '<header class="v2-topbar"><div class="v2-top-left"><button class="v2-mobile-menu" data-menu="1" aria-label="Toggle navigation">'+icon('menu',19)+'</button>'+
 '<span class="v2-breadcrumb">AISG <span>›</span> <strong>'+esc(label)+'</strong></span></div>'+
 '<div class="v2-top-actions"><form id="v2-global-search-form" class="v2-global-search" role="search">'+
 '<input id="v2-global-search" name="query" placeholder="Find a learner..." aria-label="Find a learner by name or ID"/>'+
 '<button type="submit" aria-label="Search learners">'+icon('search',17)+'</button></form>'+
 '<button class="v2-compact-search" type="button" data-search-route="1" aria-label="Find a learner">'+icon('search',19)+'</button>'+
 '<span class="v2-faculty-avatar">'+esc(initials(ctx.teacher.name))+'</span>'+
 '<label class="v2-persona-label"><span class="v2-visually-hidden">Demo teacher</span><select id="v2-faculty" aria-label="Select AISG faculty demo persona">'+personaOptions(ctx.teacher.id)+'</select></label>'+
 '<span class="v2-demo-tag">DEMO</span></div></header>';
}
function footer(){
 return '<footer class="v2-footer"><span>My Learners · Academic Year 2026–27 · Demo records '+prettyDate(DEMO_DAY)+'</span>'+
 '<span>Faculty names: My Observations working directory · All student records and class assignments fictional</span>'+
 '<span>GitHub Pages public demonstration · No real learner information</span></footer>';
}
function pageContent(p,ctx){
 if(p.page==='home')return renderLaunchHome(ctx);
 if(p.page==='class')return renderLaunchClass(ctx);
 if(p.page==='learners')return renderLearners(ctx);
 if(p.page==='growth')return renderGrowth(ctx);
 return renderStudent(ctx,p.id);
}
export function render(){
 if(!app)return;
 const previous=globalThis.document?.activeElement;
 const input=previous?.id;
 let caret=null;try{caret=previous?.selectionStart}catch{}
 const focusTab=state.pendingFocus;
 const p=route();
 if(p.page==='student'){state.studentTab=p.tab;state.supportFocus=p.focusTag||'';}
 if(p.page==='class'&&p.id&&classes().some(c=>c.id===p.id))state.classId=p.id;
 const ctx=context(),body=pageContent(p,ctx);
 app.innerHTML='<div class="v2-app first-release"><div class="v2-brand-stripe"></div>'+
 '<button type="button" class="v2-skip-link" data-skip-main="1">Skip to main content</button>'+
 (state.mobile?'<div class="v2-mobile-shade" data-menu="1"></div>':'')+
 sidebar(p,ctx)+'<div class="v2-workspace">'+header(p,ctx)+
 '<main class="v2-main" id="main-content" tabindex="-1">'+body+footer()+'</main></div></div>';
 saveNavigation();
 if(['v2-roster-search','v2-learner-search'].includes(input)){
  const next=globalThis.document?.getElementById?.(input);
  if(next){next.focus?.();if(typeof caret==='number')next.setSelectionRange?.(caret,caret)}
 }else if(focusTab){
  app.querySelector?.(focusTab)?.focus?.();state.pendingFocus='';
 }
}
function go(page,id='',tab='',focusTag=''){
 state.mobile=false;
 const hash='#/'+page+(id?'/'+id:'')+(page==='student'&&tab&&tab!=='overview'?'/'+tab:'')+
  (page==='student'&&tab==='support'&&TAG_IDS.includes(focusTag)?'/'+focusTag:'');
 if(globalThis.location.hash===hash)render();else globalThis.location.hash=hash;
 try{globalThis.window?.scrollTo?.({top:0,behavior:'instant'})}catch{}
}
function openClass(id,from){
 if(!classes().some(c=>c.id===id))return;
 state.classOrigin=from?.page==='growth'?{teacherId:state.teacherId,page:'growth',hash:'#/growth'}:null;
 if(state.classId!==id){state.rosterFilter='all';state.rosterQuery=''}
 state.classId=id;persist('aisg-v2-class',id);go('class',id);
}
function openStudent(id,tab='overview',focusTag=''){
 if(!students().some(s=>s.id===id))return;
 const p=route();
 state.returnContext={teacherId:state.teacherId,page:p.page,hash:globalThis.location.hash||'#/home',
  classId:state.classId,rosterFilter:state.rosterFilter,rosterQuery:state.rosterQuery,
  learnerQuery:state.learnerQuery,studentClassFilter:state.studentClassFilter,subject:state.subject};
 state.studentTab=tab;state.supportFocus=TAG_IDS.includes(focusTag)?focusTag:'';
 if(state.supportFocus)state.pendingFocus='[data-support-detail="'+state.supportFocus+'"]';
 go('student',id,tab,state.supportFocus);
}
function returnProfile(){
 const x=state.returnContext;
 if(!x||x.teacherId!==state.teacherId)return go('learners');
 state.classId=x.classId||state.classId;state.rosterFilter=x.rosterFilter||'all';
 state.rosterQuery=x.rosterQuery||'';state.learnerQuery=x.learnerQuery||'';
 state.studentClassFilter=x.studentClassFilter||'all';state.subject=x.subject||'Mathematics';
 const hash=x.hash;
 if(globalThis.location.hash===hash)render();else globalThis.location.hash=hash;
}
function onclick(event){
 const e=event.target;if(!e?.closest)return;let b;
 if((b=e.closest('[data-skip-main]'))){app?.querySelector?.('#main-content')?.focus?.();return}
 if((b=e.closest('[data-menu]'))){state.mobile=!state.mobile;render();return}
 if((b=e.closest('[data-search-route]'))){state.learnerQuery='';go('learners');return}
 if((b=e.closest('[data-return-profile]'))){returnProfile();return}
 if((b=e.closest('[data-return-class]'))){state.classOrigin=null;go('growth');return}
 if((b=e.closest('[data-nav]'))){
  const dest=b.dataset.nav==='classes'?'class':b.dataset.nav;
  if(!routes.some(r=>r.id===dest))return;
  if(dest==='class'){state.classOrigin=null;go('class',currentClass()?.id)}
  else go(dest);return;
 }
 if((b=e.closest('[data-open-class]'))){openClass(b.dataset.openClass,route());return}
 if((b=e.closest('[data-open-student]'))){openStudent(b.dataset.openStudent,b.dataset.targetTab||'overview',b.dataset.tagFocus||'');return}
 if((b=e.closest('[data-view-support]'))){
  const tag=b.dataset.viewSupport;
  if(TAG_IDS.includes(tag)){
   state.supportFocus=tag;state.pendingFocus='[data-support-detail="'+tag+'"]';
   go('student',route().id,'support',tag);
  }
  return;
 }
 if((b=e.closest('[data-student-tab]'))){
  state.studentTab=b.dataset.studentTab;
  state.pendingFocus='[data-student-tab="'+state.studentTab+'"]';
  go('student',route().id,state.studentTab);return;
 }
 if((b=e.closest('[data-subject]'))){state.subject=b.dataset.subject;render();return}
 if((b=e.closest('[data-roster-filter]'))){state.rosterFilter=b.dataset.rosterFilter;render();return}
}
function onChange(event){
 const el=event.target;
 if(el.id==='v2-faculty'){
  if(!data.teachers.some(t=>t.id===el.value))return;
  state.teacherId=el.value;state.classId='';state.rosterQuery='';state.rosterFilter='all';
  state.learnerQuery='';state.studentClassFilter='all';state.returnContext=null;state.classOrigin=null;
  persist('aisg-v2-faculty',el.value);persist('aisg-v2-class','');go('home');return;
 }
 if(el.id==='v2-class-select'){
  openClass(el.value,route());return;
 }
 if(el.id==='v2-learner-class'){state.studentClassFilter=el.value;render();return}
 if(el.id==='v2-support-filter'){
  state.rosterFilter=TAG_IDS.includes(el.value)?el.value:'all';render();return;
 }
 if(el.id==='v2-subject-select'){state.subject=el.value;render();return}
}
function onInput(event){
 if(event.target.id==='v2-roster-search'){state.rosterQuery=event.target.value;render()}
 if(event.target.id==='v2-learner-search'){state.learnerQuery=event.target.value;render()}
}
function onSubmit(event){
 if(event.target?.getAttribute?.('id')!=='v2-global-search-form')return;
 event.preventDefault();
 const form=event.target;
 state.learnerQuery=form?.elements?.namedItem?.('query')?.value?.trim()||'';
 state.studentClassFilter='all';go('learners');
}
function keydown(event){
 if(event.key==='Escape'&&state.mobile){state.mobile=false;render();return}
 if(event.key==='/'&&['BODY','MAIN'].includes(event.target?.tagName)&&!event.metaKey&&!event.ctrlKey){
  const input=app?.querySelector?.('#v2-global-search')||app?.querySelector?.('#v2-learner-search');
  if(input){event.preventDefault();input.focus()};return
 }
 if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)&&event.target?.dataset?.studentTab){
  const tabs=['overview','learning','map','attendance','support'],i=tabs.indexOf(event.target.dataset.studentTab);
  const next=event.key==='Home'?0:event.key==='End'?4:(i+(event.key==='ArrowRight'?1:4))%5;
  event.preventDefault();state.studentTab=tabs[next];state.pendingFocus='[data-student-tab="'+tabs[next]+'"]';
  go('student',route().id,tabs[next]);
 }
}
export function wire(){
 if(!app)return;
 app.addEventListener('click',onclick);app.addEventListener('change',onChange);
 app.addEventListener('input',onInput);app.addEventListener('submit',onSubmit);
 globalThis.window?.addEventListener?.('hashchange',()=>{state.mobile=false;render()});
 globalThis.window?.addEventListener?.('keydown',keydown);
 render();
}
wire();