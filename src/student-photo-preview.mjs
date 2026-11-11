/** Portrait-only preview used across Faculty, Student and Leaders.
 * Demonstration portraits are existing locally generated vector illustrations.
 * No lookup, remote fetch, facial recognition or additional learner data.
 */
import {portrait} from './portraits.mjs';
import {esc} from './v2-ui.mjs';

export function renderStudentPhoto(student,size='small'){
 if(!student)return '';
 const name=String(student.name||'Learner');
 const grade=String(student.grade||'');
 const klass=String(student.classId||'');
 const src=portrait(student.portraitSeed||student.id||name);
 const mode=['small','mobile','leader','profile'].includes(size)?size:'small';
 return '<button type="button" class="student-photo-trigger photo-'+mode+
  '" data-photo-preview="'+esc(student.id||'')+'" data-photo-name="'+esc(name)+
  '" data-photo-grade="'+esc(grade)+'" data-photo-class="'+esc(klass)+
  '" aria-label="Enlarge portrait of '+esc(name)+'">'+
  '<img loading="lazy" decoding="async" src="'+esc(src)+'" alt=""></button>';
}

/** Keep an enlarged 5:6 portrait inside the window, including scrollable tables. */
export function photoPreviewPosition(rect,popup,viewport){
 const w=Math.max(0,Number(popup.width)||0),h=Math.max(0,Number(popup.height)||0);
 const vw=Math.max(0,Number(viewport.width)||0),vh=Math.max(0,Number(viewport.height)||0),pad=12;
 const maxLeft=Math.max(pad,vw-w-pad);
 const left=Math.max(pad,Math.min(maxLeft,rect.left+rect.width/2-w/2));
 const below=rect.bottom+10,above=rect.top-h-10;
 const top=below+h+pad<=vh?below:above>=pad?above:
  Math.max(pad,Math.min(Math.max(pad,vh-h-pad),below));
 return {left:Math.round(left),top:Math.round(top)};
}

/** One shared floating white card (never clipped by a table or scroll container).
 * Hover, focus, Enter, Space and touch tap all work. Photo-only interaction does
 * not navigate; a separate learner-name button continues to open the profile.
 */
export function installStudentPhotoPreview(root,onOpen=()=>{}){
 if(!root||typeof document==='undefined')return {dismiss:()=>{}};
 let popup=null,active=null,pinned=false,showTimer=null;
 const cancel=()=>{if(showTimer!==null){clearTimeout(showTimer);showTimer=null}};
 const ensure=()=>{
  if(popup)return popup;
  if(typeof document.createElement!=='function'||!document.body?.appendChild)return null;
  popup=document.createElement('div');
  popup.id='student-photo-preview-active';
  popup.className='student-photo-preview';
  popup.setAttribute('role','tooltip');
  popup.hidden=true;
  document.body.appendChild(popup);
  return popup;
 };
 const position=()=>{
  if(!popup||popup.hidden||!active?.isConnected)return;
  const p=photoPreviewPosition(active.getBoundingClientRect(),popup.getBoundingClientRect(),
   {width:window.innerWidth,height:window.innerHeight});
  popup.style.left=p.left+'px';popup.style.top=p.top+'px';
 };
 const dismiss=()=>{
  cancel();if(active)active.removeAttribute('aria-describedby');
  active=null;pinned=false;
  if(popup)popup.hidden=true;
 };
 const show=node=>{
  if(!node||!root.contains(node))return;
  const p=ensure();
  if(!p)return;
  if(active&&active!==node)active.removeAttribute('aria-describedby');
  active=node;
  onOpen?.();
  const name=node.dataset.photoName||'Learner';
  const grade=node.dataset.photoGrade||'';
  const klass=node.dataset.photoClass||'';
  const existing=node.querySelector('img');
  const source=existing?.currentSrc||existing?.src||'';
  // Only show an image already visible in the current role-scoped page.
  p.innerHTML='<figure><img src="'+esc(source)+'" alt="Enlarged fictional portrait of '+esc(name)+
   '"><figcaption><strong>'+esc(name)+'</strong>'+
   (grade?'<small>'+esc(grade)+(klass?' · '+esc(klass):'')+'</small>':'')+
   '</figcaption></figure>';
  p.hidden=false;
  node.setAttribute('aria-describedby',p.id);
  position();
 };
 const fromEvent=e=>e.target?.closest?.('.student-photo-trigger[data-photo-preview]')||null;
 const schedule=node=>{
  if(pinned||!node)return;
  cancel();
  showTimer=setTimeout(()=>{showTimer=null;show(node)},110);
 };
 root.addEventListener('pointerover',e=>{
  if(e.pointerType==='touch')return;
  const node=fromEvent(e);if(node&&node!==active)schedule(node);
 });
 root.addEventListener('pointerout',e=>{
  const node=fromEvent(e);
  if(node&&!node.contains(e.relatedTarget)){
   cancel();if(active===node&&!pinned)dismiss();
  }
 });
 root.addEventListener('focusin',e=>{
  const node=fromEvent(e);if(node){cancel();show(node)}
 });
 root.addEventListener('focusout',e=>{
  const node=fromEvent(e);
  if(node&&!node.contains(e.relatedTarget)&&!pinned)dismiss();
 });
 // Capture prevents a photo tap from triggering the parent dashboard's
 // delegated "open learner" handler. Name/buttons still navigate normally.
 root.addEventListener('click',e=>{
  const node=fromEvent(e);if(!node)return;
  e.preventDefault();e.stopImmediatePropagation?.();
  if(active===node&&pinned){dismiss();return}
  cancel();show(node);pinned=true;
 },true);
 document.addEventListener?.('pointerdown',e=>{
  if(active&&!active.contains(e.target)&&!popup?.contains(e.target))dismiss();
 });
 document.addEventListener?.('keydown',e=>{if(e.key==='Escape'&&active)dismiss()});
 document.addEventListener?.('scroll',()=>{if(active)dismiss()},{capture:true,passive:true});
 window.addEventListener?.('resize',position);
 return {dismiss};
}
