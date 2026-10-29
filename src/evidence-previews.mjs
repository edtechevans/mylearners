/** My Learners | Evidence previews (presentation only).
 * No new scores, no remote calls, no stored student data.
 * Data is supplied by the active role's authorised presentation context.
 */
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export const PREVIEW_GUIDE=Object.freeze({
 report:{label:'Issued school report',description:'A subject result from an issued report, not a current-year grade. Interpret only within the named programme and reporting scale.',source:'Previously issued school report'},
 map:{label:'MAP growth',description:'Observed RIT-point change between valid, comparable assessments. It is not a percentile or an achievement grade.',source:'Fictional MAP assessments'},
 ixl:{label:'IXL Mathematics',description:'A diagnostic level, not an IXL SmartScore, a percentage or a report-card grade.',source:'Fictional IXL diagnostic'},
 core:{label:'Core Phonics',description:'An illustrative decoding check. The displayed items are not an official CORE Phonics Survey total.',source:'Fictional classroom check'},
 fp:{label:'F&P reading',description:'A reading text-complexity level, not a grade, percentage or complete measure of a reader.',source:'Fictional reading check'},
 engagement:{label:'Engagement',description:'Three student check-in items are converted to points (0, 33, 67, 100). The score is an exploratory index out of 100, not a percentage of students agreeing.',source:'Fictional student check-in'},
 belonging:{label:'Belonging',description:'Three student check-in items are converted to points (0, 33, 67, 100). The score is an exploratory index out of 100, not a validated measure or label.',source:'Fictional student check-in'},
 attendance:{label:'Attendance',description:'Attendance for the specified recording window. A percentage must be understood with its date window and eligible attendance opportunities.',source:'Fictional attendance register'},
 flourishing:{label:'Maia flourishing example',description:'Illustrative PERMA dimension on a 0–10 display scale. Not an official Maia scoring specification and never combined with Engagement or Belonging.',source:'Fictional Maia-style example'},
 wida:{label:'WIDA screening',description:'The English proficiency level is on a 1.0–6.0 scale, separate from grades and academic scores. Use the source screening context.',source:'Fictional language screening'},
 sss:{label:'Student Support Services',description:'A programme membership marker, not a diagnosis, medical record or safeguarding status. Further details require explicit authorisation.',source:'Fictional support roster'},
 coverage:{label:'Data coverage',description:'Available records divided by the eligible population for the selected measure. Missing information is never counted as a score of zero.',source:'Displayed evidence population'},
 mapgrowth:{label:'MAP growth summary',description:'Percentage of learners with comparable MAP tests meeting the illustrative growth target, not a percentile or official NWEA projection.',source:'Fictional MAP growth'},
 review:{label:'Support review',description:'A scheduled review date or recorded follow-up status; not evidence of an intervention effect.',source:'Fictional support record'},
 ibdp:{label:'IB Diploma result',description:'A graduating-cohort outcome. A Diploma average uses the 0–45 point scale; a pass rate uses the eligible full-Diploma candidate denominator.',source:'Aggregated school examination statistics'}
});
export function makePreview({title='',subtitle='',rows=[],note='',status='',kind='neutral'}={}){
 return {title:clean(title),subtitle:clean(subtitle),rows:(rows||[]).filter(x=>x&&x[0]).slice(0,5).map(([key,val])=>[clean(key),clean(val)]),
  note:clean(note),status:clean(status),kind:['neutral','academic','experience','support','board'].includes(kind)?kind:'neutral'};
}
export function previewMarkup(p){
 if(!p)return '';
 return '<div class="evidence-preview-inner evidence-preview-'+esc(p.kind||'neutral')+'">'+
 '<div class="evidence-preview-head"><strong>'+esc(p.title)+'</strong>'+
 (p.subtitle?'<span>'+esc(p.subtitle)+'</span>':'')+'</div>'+
 (p.rows?.length?'<dl>'+p.rows.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>':'')+
 (p.status?'<div class="evidence-preview-status">'+esc(p.status)+'</div>':'')+
 (p.note?'<p>'+esc(p.note)+'</p>':'')+
 '</div>';
}
export function hasPreviewMarker(node){return !!node?.closest?.('[data-evidence-preview]')}
function iconButton(kind,id,title){
 const btn=document.createElement('button');
 btn.type='button';btn.className='evidence-preview-trigger';btn.dataset.evidencePreview=kind;
 if(id)btn.dataset.previewStudent=id;
 btn.setAttribute('aria-label','Preview '+title);
 btn.setAttribute('title','Preview information');
 btn.textContent='ⓘ';
 return btn;
}
function addInfoAfter(target,kind,id,label){
 if(!target||target.parentElement?.querySelector?.(':scope > .evidence-preview-trigger'))return;
 target.insertAdjacentElement?.('afterend',iconButton(kind,id,label));
}
function mark(node,kind){
 if(!node||node.dataset?.evidencePreview)return;
 node.dataset.evidencePreview=kind;
 if(node.tagName!=='BUTTON'&&node.tagName!=='A'&&node.tagName!=='CIRCLE'&&node.tagName!=='G'){
  node.setAttribute?.('tabindex','0');
 }
}
function guideKey(label){
 const s=clean(label).toLowerCase();
 if(/belonging/.test(s))return 'belonging';
 if(/engagement/.test(s))return 'engagement';
 if(/map.*growth|rit change/.test(s))return 'map';
 if(/ixl/.test(s))return 'ixl';
 if(/phonics/.test(s))return 'core';
 if(/f&p|fountas|pinnell/.test(s))return 'fp';
 if(/maia|flourishing/.test(s))return 'flourishing';
 if(/attendance/.test(s))return 'attendance';
 if(/wida/.test(s))return 'wida';
 if(/coverage|records available/.test(s))return 'coverage';
 if(/support|follow-up|review/.test(s))return 'review';
 if(/diploma|ibdp|pass rate/.test(s))return 'ibdp';
 return 'report';
}
/** Add read-only preview hooks to existing visual elements.
 * Deliberately skips editable fields, forms and sensitive free-text notes.
 * Idempotent for every re-render of the active dashboard.
 */
export function decorateEvidencePreviews(root,role){
 if(!root||typeof root.querySelectorAll!=='function')return;
 const q=(sel)=>[...root.querySelectorAll(sel)];
 if(role==='faculty'){
  for(const btn of q('.roster-desktop tbody .student-link[data-student]'))addInfoAfter(btn,'student',btn.dataset.student,clean(btn.textContent));
  for(const tr of q('.roster-desktop tbody tr')){
   const id=tr.querySelector('.student-link[data-student]')?.dataset.student;
   if(!id)continue;
   const heads=[...tr.closest('table').querySelectorAll('thead th')].map(x=>clean(x.textContent).toLowerCase());
   [...tr.cells].forEach((cell,i)=>{
    if(i===0)return;
    const h=heads[i]||'';
    if(h.includes('attendance'))addInfoAfter(cell.querySelector('.academic-roster-value')||cell.lastElementChild||null,'attendance',id,'attendance');
    if(h.includes('map math growth'))addInfoAfter(cell.querySelector('.academic-roster-value')||cell.lastElementChild||null,'map',id,'MAP growth');
    if((h.includes('report')||h.includes('map')||h.includes('ixl')||h.includes('phonics')||h.includes('f&p'))&&!cell.querySelector('.experience-cell-help')){
     const kind=guideKey(h);
     const icon=iconButton('academic',id,h);
     icon.dataset.previewMeasure=kind;
     cell.appendChild(icon);
    }
    if(h==='support information'){
     cell.querySelectorAll('.pill').forEach(pill=>{
      pill.dataset.evidencePreview='tag';pill.dataset.previewTag=clean(pill.textContent);
      pill.setAttribute('tabindex','0');
     });
    }
   });
  }
  for(const button of q('.quick-summary .quick-score'))mark(button,'method');
  for(const result of q('.academic-profile .academic-subject-result'))mark(result,'issued');
  for(const result of q('.academic-profile .academic-evidence-card'))mark(result,'academic-card');
 }
 if(role==='student'){
  for(const result of q('.student-today-celebrate,.student-today-progress'))mark(result,'student-tile');
  for(const result of q('.academic-profile .academic-subject-result'))mark(result,'issued');
  for(const result of q('.academic-profile .academic-evidence-card'))mark(result,'academic-card');
  for(const result of q('.student-landing-foot strong'))mark(result,'attendance-scope');
 }
 if(role==='sss'){
  // SSS case notes, diagnoses and narrative records are intentionally excluded.
  for(const b of q('.sss-roster-row[data-sss-student]'))mark(b,'sss-person');
  for(const e of q('.sss-evidence-tile'))mark(e,'sss-evidence');
  for(const e of q('.support-progress-stats > div'))mark(e,'monitor-stat');
  for(const e of q('.support-summary-grid .support-snapshot-card'))mark(e,'support-summary');
  for(const e of q('.sss-wida-composite,.sss-wida-domain'))mark(e,'wida');
  for(const e of q('.support-progress-chart circle[data-preview-week]'))mark(e,'monitor-point');
 }
 if(role==='leader'){
  for(const e of q('.leader-stat'))mark(e,'leader-stat');
  for(const e of q('.leader-evidence-item'))mark(e,'leader-check');
  for(const e of q('.leader-support-metric'))mark(e,'leader-support');
  for(const e of q('.leader-support-track'))mark(e,'leader-monitor');
  for(const e of q('.leader-report-subject,.leader-check-row'))mark(e,'leader-assessment');
  for(const e of q('.leader-experience-card'))mark(e,'leader-experience');
 }
 if(role==='board'){
  for(const e of q('.board-strength-card,.board-overview-card'))mark(e,'board-card');
  for(const e of q('.board-dp-graphic-tile,.board-dp-evidence-item'))mark(e,'board-dp');
  for(const e of q('.board-indicator'))mark(e,'board-index');
  for(const e of q('.board-comparison-subject'))mark(e,'board-map');
  // Chart points already have a working richer hover/pin inspector: avoid a second popover.
 }
 for(const e of q('.academic-roster-empty'))mark(e,'missing');
 for(const e of q('.class-evidence-methodology summary,.academic-evidence-help summary'))mark(e,'definition');
 for(const e of q('.experience-detail-link,[data-experience-explain]'))mark(e,'method');
}
/** Desktop and keyboard preview controller. Detailed popups are separate click actions.
 * On touch, tapping an info icon pins the preview; the main row's original navigation remains.
 */
export function installEvidencePreviewController(root,resolve){
 if(!root?.addEventListener||typeof resolve!=='function')return {dismiss(){}};
 let popup=null,anchor=null,showTimer=null,hideTimer=null,pinned=false;
 const clearTimers=()=>{if(showTimer!==null)clearTimeout(showTimer);if(hideTimer!==null)clearTimeout(hideTimer);showTimer=hideTimer=null};
 const dismiss=()=>{
  clearTimers();
  if(popup){popup.remove();popup=null}
  if(anchor?.removeAttribute)anchor.removeAttribute('aria-describedby');
  anchor=null;pinned=false;
 };
 const ensure=()=>{
  if(popup)return popup;
  if(!document.createElement||!document.body?.appendChild)return null;
  popup=document.createElement('div');popup.className='evidence-preview-popup';
  popup.id='evidence-preview-active';popup.setAttribute('role','tooltip');
  popup.addEventListener('pointerenter',()=>{if(hideTimer!==null)clearTimeout(hideTimer);hideTimer=null});
  popup.addEventListener('pointerleave',()=>{if(!pinned)scheduleHide()});
  document.body.appendChild(popup);
  return popup;
 };
 const position=()=>{
  if(!popup||!anchor?.getBoundingClientRect)return;
  const r=anchor.getBoundingClientRect(),w=popup.offsetWidth||300,h=popup.offsetHeight||180;
  const vw=window.innerWidth||1440,vh=window.innerHeight||900;
  const left=Math.max(10,Math.min(vw-w-12,r.left+r.width/2-w/2));
  const y=r.bottom+10+h>vh?r.top-h-10:r.bottom+10;
  popup.style.left=Math.max(8,left)+'px';
  popup.style.top=Math.max(8,Math.min(vh-h-8,y))+'px';
 };
 const display=target=>{
  const item=resolve(target);
  if(!item||!item.title){dismiss();return}
  clearTimers();
  if(anchor&&anchor!==target)anchor.removeAttribute('aria-describedby');
  anchor=target;
  const el=ensure();if(!el)return;
  el.innerHTML=previewMarkup(item);
  target.setAttribute?.('aria-describedby',el.id);
  position();
 };
 function scheduleHide(){
  if(hideTimer!==null)clearTimeout(hideTimer);
  hideTimer=setTimeout(()=>{if(!pinned)dismiss()},180);
 }
 const scheduleShow=(target,immediate=false)=>{
  if(!target||pinned&&anchor!==target)return;
  if(showTimer!==null)clearTimeout(showTimer);
  if(hideTimer!==null)clearTimeout(hideTimer);
  hideTimer=null;
  if(immediate){display(target);return}
  showTimer=setTimeout(()=>display(target),340);
 };
 const parent=e=>e.target?.closest?.('[data-evidence-preview]')||null;
 root.addEventListener('pointerover',e=>{
  if(e.pointerType==='touch')return;
  const trigger=parent(e);
  if(trigger)scheduleShow(trigger);
 });
 root.addEventListener('pointerout',e=>{
  const trigger=parent(e);
  if(trigger&&!trigger.contains?.(e.relatedTarget)&&!pinned)scheduleHide();
 });
 root.addEventListener('focusin',e=>{const trigger=parent(e);if(trigger)scheduleShow(trigger,true)});
 root.addEventListener('focusout',e=>{if(parent(e)&&!pinned)scheduleHide()});
 root.addEventListener('click',e=>{
  const trigger=parent(e);
  if(!trigger||!trigger.matches?.('.evidence-preview-trigger'))return;
  e.preventDefault();e.stopPropagation();
  if(anchor===trigger&&pinned){dismiss();return}
  pinned=true;display(trigger);
 });
 document.addEventListener?.('pointerdown',e=>{
  if(popup&&!popup.contains(e.target)&&!anchor?.contains?.(e.target))dismiss();
 });
 document.addEventListener?.('keydown',e=>{
  if(e.key==='Escape'&&popup){dismiss()}
 });
 window.addEventListener?.('resize',position);
 window.addEventListener?.('scroll',()=>{if(popup&&!pinned)dismiss();else position()},true);
 return {dismiss,refresh:position};
}
