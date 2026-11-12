/** My Learners | Evidence previews (presentation only).
 * No new scores, no remote calls, no stored student data.
 * Data is supplied by the active role's authorised presentation context.
 */
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export const PREVIEW_GUIDE=Object.freeze({
 report:{label:'Issued school report',description:'A subject result from an issued report, not a current-year grade. Interpret only within the named programme and reporting scale.',source:'Previously issued school report'},
 map:{label:'MAP growth',description:'Observed RIT-point change between valid, comparable assessments. It is not a percentile or an achievement grade.',source:'Demonstration MAP assessments'},
 ixl:{label:'IXL Mathematics',description:'A diagnostic level, not an IXL SmartScore, a percentage or a report-card grade.',source:'Demonstration IXL diagnostic'},
 core:{label:'Core Phonics',description:'An illustrative decoding check. The displayed items are not an official CORE Phonics Survey total.',source:'Demonstration classroom check'},
 fp:{label:'F&P reading',description:'A reading text-complexity level, not a grade, percentage or complete measure of a reader.',source:'Demonstration reading check'},
 engagement:{label:'Engagement',description:'Three student check-in responses are scored −2, −1, +1 or +2 and averaged. This exploratory index is not a percentage or achievement measure.',source:'Demonstration student check-in'},
 belonging:{label:'Belonging',description:'Three student check-in responses are scored −2, −1, +1 or +2 and averaged. This exploratory index is not a validated measure or learner label.',source:'Demonstration student check-in'},
 attendance:{label:'Attendance',description:'Attendance for the specified recording window. A percentage must be understood with its date window and eligible attendance opportunities.',source:'Demonstration attendance register'},
 flourishing:{label:'Maia flourishing example',description:'Illustrative PERMA dimension on a 0–10 display scale. Not an official Maia scoring specification and never combined with Engagement or Belonging.',source:'Demonstration Maia-style example'},
 wida:{label:'WIDA screening',description:'The English proficiency level is on a 1.0–6.0 scale, separate from grades and academic scores. Use the source screening context.',source:'Demonstration language screening'},
 sss:{label:'Student Support Services',description:'A programme membership marker, not a diagnosis, medical record or safeguarding status. Further details require explicit authorisation.',source:'Demonstration support roster'},
 coverage:{label:'Data coverage',description:'Available records divided by the eligible population for the selected measure. Missing information is never counted as a score of zero.',source:'Displayed evidence population'},
 mapgrowth:{label:'MAP growth summary',description:'Percentage of learners with comparable MAP tests meeting the illustrative growth target, not a percentile or official NWEA projection.',source:'Demonstration MAP growth'},
 review:{label:'Support review',description:'A scheduled review date or recorded follow-up status; not evidence of an intervention effect.',source:'Demonstration support record'},
 ibdp:{label:'IB Diploma result',description:'A graduating-cohort outcome. A Diploma average uses the 0–45 point scale; a pass rate uses the eligible full-Diploma candidate denominator.',source:'Aggregated school examination statistics'}
});
export function makePreview({title='',subtitle='',rows=[],note='',status='',kind='neutral',trend=null,experienceDetail=null}={}){
 const points=Array.isArray(trend?.points)?trend.points.filter(x=>x&&x.label&&x.value!==undefined&&x.value!==null)
  .slice(-3).map(x=>({label:clean(x.label),value:clean(x.value),provisional:x.provisional===true})):[];
 const change=trend?.change&&points.length>=2?{
  value:clean(trend.change.value),from:clean(trend.change.from)}:null;
 return {title:clean(title),subtitle:clean(subtitle),
  rows:(rows||[]).filter(x=>x&&x[0]).slice(0,5).map(([key,val])=>[clean(key),clean(val)]),
  trend:points.length?{points,change}:null,
  note:clean(note),status:clean(status),experienceDetail,
  kind:['neutral','academic','experience','support','board'].includes(kind)?kind:'neutral'};
}
const indexLabel=value=>Number.isFinite(value)?(value>0?'+':'')+Number(value).toFixed(2):'—';
function questionDetailMarkup(detail){
 const mixed=detail.groups?.length>1;
 const header='<div class="evidence-preview-answer-head"><span>'+esc(detail.windowLabel)+
  '</span><strong>'+(mixed?'Separate question sets':indexLabel(detail.value)+' index')+
  '</strong><small>'+(detail.individual?(detail.n?'Individual response':'No response recorded'):
   detail.n+' of '+detail.eligible+' students responded')+'</small></div>';
 const groups=(detail.groups||[]).map(group=>{
  const cohort=detail.individual?'':'<div class="evidence-preview-cohort"><strong>'+
   esc(group.label)+' · '+indexLabel(group.value)+'</strong><span>'+
   group.n+' of '+group.eligible+' responded</span></div>';
  return '<section class="evidence-preview-question-group">'+cohort+
   (group.questions||[]).map((q,i)=>{
    const answer=detail.individual?
     '<div class="evidence-preview-answer">Response: <strong>'+esc(q.label)+
     '</strong><span>'+(Number.isFinite(q.points)?(q.points>0?'+':'')+q.points+' points':'No score')+'</span></div>':
     '<div class="evidence-preview-question-summary"><strong>'+
     (Number.isFinite(q.favorable)?q.favorable+'% positive':'No responses')+
     '</strong><span>'+q.n+' responses</span></div>'+
     (q.n?'<div class="evidence-preview-choices">'+(q.choices||[]).map((choice,j)=>
      '<div class="evidence-preview-choice response-'+j+'"><span>'+esc(choice.label)+
      '</span><strong>'+choice.count+'</strong></div>').join('')+'</div>':'');
    return '<div class="evidence-preview-question"><div class="evidence-preview-question-label"><b>'+
     (i+1)+'.</b><span>'+esc(q.question)+'</span></div>'+answer+'</div>';
   }).join('')+'</section>';
 }).join('');
 return '<div class="evidence-preview-questions" aria-label="Question-level answers">'+header+groups+
  '<p class="evidence-preview-method">Strongly disagree −2 · Disagree −1 · Agree +1 · Strongly agree +2. '+
  (detail.individual?'Index = average of three answers.':'Group index = average of student indices.')+
  ' Fictional check-in responses only.</p></div>';
}
export function previewMarkup(p){
 if(!p)return '';
 return '<div class="evidence-preview-inner evidence-preview-'+esc(p.kind||'neutral')+'">'+
 '<div class="evidence-preview-head"><strong>'+esc(p.title)+'</strong>'+
 (p.subtitle?'<span>'+esc(p.subtitle)+'</span>':'')+'</div>'+
 (p.trend?.points?.length?
  '<div class="evidence-preview-progress" aria-label="Results over time">'+
  '<div class="evidence-preview-periods" role="list">'+p.trend.points.map((point,i)=>
   '<div class="evidence-preview-period'+(i===p.trend.points.length-1?' is-current':'')+
   '" role="listitem"><small>'+esc(point.label)+'</small><strong>'+esc(point.value)+
   (point.provisional?'<sup class="myp-best-fit-marker" title="Current Best Fit: fewer than 4 MYP criteria assessed" aria-label=" provisional best fit">*</sup>':'')+
   '</strong></div>'
  ).join('')+'</div>'+
  (p.trend.change?'<div class="evidence-preview-change"><strong>'+esc(p.trend.change.value)+
   '</strong><span>vs '+esc(p.trend.change.from)+'</span></div>':'')+'</div>':'')+
 (p.rows?.length?'<dl>'+p.rows.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>':'')+
 (p.status?'<div class="evidence-preview-status">'+esc(p.status)+'</div>':'')+
  (p.experienceDetail?questionDetailMarkup(p.experienceDetail):'')+
 (p.note?'<p>'+esc(p.note)+'</p>':'')+
 '</div>';
}
export function hasPreviewMarker(node){return !!node?.closest?.('[data-evidence-preview]')}
function mark(node,kind){
 if(!node)return;
 // The native browser title competes with the richer preview (two overlapping
 // tooltips). Keep button accessible names; the shared card is the sole tooltip.
 node.removeAttribute?.('title');
 if(node.querySelector?.('title')&&node.matches?.('circle[data-preview-week]'))
  node.querySelector('title').remove();
 if(node.dataset?.evidencePreview)return;
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
  // Values and learner links provide previews directly; no extra info buttons.
  for(const btn of q('.roster-desktop tbody .student-link[data-student]')){
   mark(btn,'student');
   btn.dataset.previewStudent=btn.dataset.student;
  }
  for(const tr of q('.roster-desktop tbody tr')){
   const id=tr.querySelector('.student-link[data-student]')?.dataset.student;
   if(!id)continue;
   const heads=[...tr.closest('table').querySelectorAll('thead th')].map(x=>clean(x.textContent).toLowerCase());
   [...tr.cells].forEach((cell,i)=>{
    if(i===0)return;
    const heading=heads[i]||'';
    if(heading==='support information'){
     cell.querySelectorAll('.pill').forEach(pill=>{
      pill.dataset.evidencePreview='tag';
      pill.dataset.previewTag=clean(pill.textContent);
      pill.setAttribute('tabindex','0');
     });
     return;
    }
    // MAP RIT tiles share this one white evidence preview, with percentile details.
    // Never mark the containing cell as a second competing hover target.
    const rit=cell.querySelector('.map-rit-tile,.map-rit-missing');
    if(rit){
     mark(rit,'map-rit');
     rit.dataset.previewStudent=id;
     rit.dataset.previewSubject=rit.dataset.mapRitSubject||'Mathematics';
     return;
    }
    const kind=guideKey(heading);
    const isExperience=kind==='engagement'||kind==='belonging';
    const isAttendance=kind==='attendance';
    const isAcademic=/map|ixl|report|phonics|f&p|mathematics|literacy|inquiry|reading|flourishing/i.test(heading)||
      !!cell.querySelector('.evidence-cell-open[data-evidence-subject]:not([data-evidence-subject=""])');
    if(!isExperience&&!isAttendance&&!isAcademic)return;
    const target=cell.querySelector('.evidence-cell-open')||
     cell.querySelector('.class-evidence-result')||cell.querySelector('.roster-mixed-academic')||cell;
    mark(target,isExperience?'experience-cell':isAttendance?'attendance':kind==='map'?'map':'academic');
    target.dataset.previewStudent=id;
    target.dataset.previewMeasure=kind;
    if(isExperience){
     // Date-free Faculty headings should not force the hover card back to
     // Fall 2026: the resolver reads the active selected window from state.
     if(heading.includes('spring 2026'))target.dataset.previewWindow='S26';
     else if(heading.includes('fall 2025'))target.dataset.previewWindow='F25';
     else if(heading.includes('fall 2026'))target.dataset.previewWindow='F26';
     else delete target.dataset.previewWindow;
    }else if(kind==='map'){
     target.dataset.previewSubject=heading.includes('reading')?'Reading':
      heading.includes('language usage')?'Language Usage':'Mathematics';
    }
    const band=clean(cell.querySelector('.evidence-heat strong')?.textContent);
    if(/^Q[1-4]$/.test(band))target.dataset.previewBand=band;
   });
  }
  for(const button of q('.quick-summary .quick-score'))mark(button,'experience-summary');
  for(const e of q('.class-evidence-selected')){
   const label=clean(e.querySelector('span')?.textContent).toLowerCase();
   const metric=label.includes('belonging')?'belonging':label.includes('engagement')?'engagement':null;
   if(metric){mark(e,'class-evidence-experience');e.dataset.previewMeasure=metric}
  }
  for(const result of q('.academic-profile .academic-subject-result'))mark(result,'issued');
  for(const result of q('.academic-profile .academic-evidence-card'))mark(result,'academic-card');
  for(const result of q('.profile-head + .kpis .kpi'))mark(result,'academic-card');
  for(const result of q('.student-wellbeing-content .experience-metric-card,.metrics .experience-metric-card')){
   mark(result,'personal-experience');
   const h=clean(result.querySelector('.metric-top .eyebrow')?.textContent).toLowerCase();
   result.dataset.previewMeasure=h.includes('belonging')?'belonging':'engagement';
  }
 }
 if(role==='student'){
  for(const result of q('.student-today-celebrate,.student-today-progress'))mark(result,'student-tile');
  for(const result of q('.student-checkin-preview-tile,.student-wellbeing-content .experience-metric-card')){
   mark(result,'personal-experience');
   result.dataset.previewMeasure=clean(result.querySelector('h3,.metric-top .eyebrow')?.textContent)
    .toLowerCase().includes('belonging')?'belonging':'engagement';
  }
  for(const result of q('.academic-profile .academic-subject-result'))mark(result,'issued');
  for(const result of q('.academic-profile .academic-evidence-card'))mark(result,'academic-card');
  for(const result of q('.student-landing-foot strong'))mark(result,'attendance-scope');
 }
 if(role==='sss'){
  // SSS case notes, diagnoses and narrative records are intentionally excluded.
  for(const b of q('.sss-roster-row[data-sss-student]'))mark(b,'sss-person');
  for(const e of q('.sss-evidence-tile'))mark(e,'sss-evidence');
  for(const e of q('.sss-experience-with-help .sss-evidence-tile')){
   mark(e,'sss-experience');e.dataset.evidencePreview='sss-experience';
   e.dataset.previewMeasure=clean(e.textContent).toLowerCase().includes('belonging')?'belonging':'engagement';
  }
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
  for(const e of q('.leader-school-voice-measure')){
   mark(e,'leader-school-voice');
   e.dataset.previewMeasure=clean(e.querySelector('strong')?.textContent).toLowerCase().includes('belonging')?'belonging':'engagement';
   e.dataset.previewGroup=clean(e.closest('.leader-school-voice')?.querySelector('h3')?.textContent).startsWith('Elementary')?'Elementary':'Secondary';
  }
  for(const e of q('.leader-profile-voice')){
   mark(e,'leader-profile-voice');
   e.dataset.previewMeasure=clean(e.querySelector('strong')?.textContent).toLowerCase().includes('belonging')?'belonging':'engagement';
  }
  for(const e of q('.leader-followup-index')){
   mark(e,'leader-followup-voice');
   e.dataset.previewMeasure=clean(e.querySelector('small')?.textContent).toLowerCase().includes('belonging')?'belonging':'engagement';
   e.dataset.previewLeaderStudent=e.closest('.leader-followup-item')?.querySelector('[data-leader-student]')?.dataset.leaderStudent||'';
  }
  for(const e of q('.leader-trend-period > span')){
   mark(e,'leader-trend');e.dataset.previewMeasure=clean(e.textContent).toLowerCase().includes('belonging')?'belonging':'engagement';
   e.dataset.previewGroup=clean(e.closest('.leader-trend-group')?.querySelector('h4')?.textContent);
   const period=clean(e.closest('.leader-trend-period')?.querySelector('strong')?.textContent);
   e.dataset.previewWindow=period==='Fall 2025'?'F25':period==='Spring 2026'?'S26':'F26';
  }
 }
 if(role==='board'){
  for(const e of q('.board-strength-card,.board-overview-card'))mark(e,'board-card');
  for(const e of q('.board-dp-graphic-card,.board-dp-evidence-item'))mark(e,'board-dp');
  for(const e of q('.board-indicator'))mark(e,'board-index');
  for(const e of q('.board-comparison-subject'))mark(e,'board-map');
  // Chart points already have a working richer hover/pin inspector: avoid a second popover.
 }
 for(const e of q('.academic-roster-empty'))mark(e,'missing');
 for(const e of q('.class-evidence-methodology summary,.academic-evidence-help summary'))mark(e,'definition');
 for(const e of q('.experience-detail-link,[data-experience-explain]'))mark(e,'method');
}
/** Desktop and keyboard preview controller. Detailed popups are separate click actions.
 * On touch, tapping a noninteractive value pins the preview; learner buttons still navigate.
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
  if(!trigger)return;
  const coarsePointer=!!globalThis.matchMedia?.('(pointer: coarse)')?.matches;
  // First touch explains a coloured cell; a second touch opens the learner.
  // stopImmediatePropagation prevents the app's delegated navigation on tap one.
  if(coarsePointer&&trigger.matches?.('.evidence-cell-open')){
   if(anchor===trigger&&pinned){dismiss();return}
   e.preventDefault();e.stopImmediatePropagation?.();
   pinned=true;display(trigger);return;
  }
  // Keep real navigation and form controls working normally on all devices.
  if(!coarsePointer||trigger.matches?.('button,a,summary')||
   e.target.closest?.('button,a,summary,input,select,textarea'))return;
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
