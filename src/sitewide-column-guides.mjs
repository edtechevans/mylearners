/** Accessible column-source guidance for every My Learners workspace.
 * A SINGLE floating tooltip renders above scrolling tables without changing
 * the source cells, column order, sort keys, or permission scope.
 * It does not invent a legend when no colour scale is defined.
 */
import {SCREENER_BANDS} from './universal-screener.mjs';
import {UFLI_GROUPS} from './ufli-demo.mjs';
import {MAP_RIT_BANDS} from './map-rit-achievement.mjs';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const gradeColours=['#a6373f','#e4a15f','#a6bd88','#246b4f'];
const gradeRows=[
 {label:'1–3',range:'Developing priority',colour:gradeColours[0]},
 {label:'4',range:'Approaching expected range',colour:gradeColours[1]},
 {label:'5–6',range:'Secure / strong',colour:gradeColours[2]},
 {label:'7',range:'Highest MYP grade band',colour:gradeColours[3]}
];
const experienceRows=[
 {label:'−2 to below −1',range:'Lower index',colour:gradeColours[0]},
 {label:'−1 to below 0',range:'Below zero',colour:gradeColours[1]},
 {label:'0 to below +1',range:'Above zero',colour:gradeColours[2]},
 {label:'+1 to +2',range:'Upper index',colour:gradeColours[3]}
];
const mapRows=MAP_RIT_BANDS.toReversed().map(b=>({
 label:b.label,range:b.from+'–'+b.to+' percentile',
 colour:({low:'#8b1d25','low-average':'#f39a20',average:'#f7c817',
 'high-average':'#098348',high:'#435ca5'})[b.key]
}));
const screenerRows=SCREENER_BANDS.map(b=>({label:b.label,range:'Percentage band',colour:b.colour}));
const lessonRows=UFLI_GROUPS.map(b=>({
 label:b.start+'–'+b.end,range:b.label,colour:b.color
}));
const spec=(title,subtitle,description,rows=[],note='')=>({title,subtitle,description,rows,note});
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
export function classifyColumnGuide({label='',source='',family='',stage='',role=''}={}){
 const full=clean(source||label);
 const name=full.toLowerCase(), fam=clean(family).toLowerCase();
 const subject=(full||'Subject').replace(/\s+·.*$/,'');
 if(fam==='screener'||/universal screener|screener\s*%/.test(name))
  return spec('Universal Screener','Percentage bands',
   'The figure is a percentage. The four colour bands group displayed values; they are not validated screening benchmarks or a diagnosis.',
   screenerRows,'The percentage is not an MYP grade. Use the source assessment and school-defined thresholds when working with verified results.');
 if(fam==='lesson'||/\bufli\b/.test(name))
  return spec('UFLI Foundations','Lesson sequence',
   'The lesson code identifies a place in the UFLI Foundations scope and sequence. The four colours group lesson ranges, not reading attainment.',
   lessonRows,'The published sequence covers K–2. A lesson placement does not independently establish mastery or reading level.');
 if(/map/.test(name)&&/growth|progress|change/.test(name))
  return spec('MAP Growth','Observed RIT change',
   'Growth is the RIT-point difference between comparable assessments. A positive change is not the same thing as an achievement percentile.',
   [],'Review the test window, subject, percentile and projected growth separately.');
 if(/map/.test(name)&&/reading|math|language|rit|percentile/.test(name))
  return spec(full||'MAP RIT','Achievement percentile',
   'The large number is the RIT score; the signed change underneath is observed RIT-point growth. Colour follows the achievement percentile, not the RIT score itself.',
   mapRows,'These display quintiles are not a substitute for official NWEA norms.');
 if(fam==='experience'||/engagement|belonging/.test(name))
  return spec(/belonging/.test(name)?'Belonging':'Engagement',
   'Student check-in index · −2 to +2',
   'Three statements are scored Strongly disagree −2, Disagree −1, Agree +1, and Strongly agree +2. The index is the average, not the percentage agreeing.',
   experienceRows,'This exploratory index describes reported experience, not academic attainment or a student label.');
 if(fam==='attendance'||/attendance|absen(?:ce|t)|present/.test(name))
  return spec('Attendance','Attendance percentage',
   'Attendance is the percentage of eligible recorded opportunities attended in the selected period.',
   [],'Check the window and number of opportunities. Missing attendance records are not scored as absences.');
 if(/ixl/.test(name))
  return spec('IXL Mathematics','Diagnostic level',
   'The value indicates an IXL diagnostic level. The colour and secondary text describe its grade-level tier: Above grade, On grade, Below grade or Far below grade.',
   [],'This is not an IXL SmartScore, a report-card grade or a standard percentage. Incomplete diagnostics display as missing.');
 if(/core phonics|phonics|decod/.test(name))
  return spec('Core Phonics','Decoding evidence',
   'A reading and phonics check indicates progress on assessed decoding skills. A count depends on the assessment instrument and items administered.',
   [],'Interpret the count in the context of the instrument; this is not a universal grade or reading level.');
 if(/f&p|fountas|pinnell/.test(name))
  return spec('F&P Reading','Text level',
   'Letters indicate levels in a text-complexity sequence, not numerical percentages or school grades.',
   [],'Use alongside comprehension, fluency and other reading evidence; a text level is not a measure of the whole reader.');
 if(/maia|flourishing|perma/.test(name))
  return spec('Flourishing','PERMA dimension',
   'This display uses an illustrative 0–10 dimension scale for relationships or other aspects of flourishing.',
   [],'Do not combine it numerically with Engagement/Belonging or treat it as a diagnosis.');
 if(/\bwida\b/.test(name))
  return spec('WIDA','English-language proficiency',
   'WIDA proficiency uses a 1.0–6.0 scale. It is separate from academic grades and subject assessments.',
   [],'Interpret within the relevant language domain and testing date.');
 if(fam==='report'||/report.*(?:math|science|arts|language|individual)|\bsubject grade\b|grade band/.test(name)){
  if(stage==='early'||/early literacy|early mathematics|inquiry|creative arts|physical development/.test(name))
   return spec(subject,'Developmental progress',
    'Elementary developmental descriptors are programme-specific and are not converted into MYP grades.',
    [],'Review the descriptor and its supporting learning evidence. No 1–7 colour scale applies.');
  return spec(subject,'Current subject result · 1–7',
   'The coloured number uses four fixed subject-grade groups. An asterisk on an MYP result indicates a provisional best fit from fewer than four assessed criteria.',
   gradeRows,'In-progress results are not final issued school reports. Grade bands do not apply to screening, MAP or student experience.');
 }
 if(/support|learning support|eal|sst|intervention|case manager/.test(name)||fam==='support')
  return spec(full||'Support information','Student support',
   'Support markers show recorded services or follow-up information in the permitted view.',
   [],'These are categorical indicators, not attainment colours, risk scores or diagnoses. Open authorised details for context.');
 if(/learner|student|name|advisor/.test(name))
  return spec(full||'Learner','Learner identity',
   'Use the learner name to open a profile and review evidence across the available sources.',
   [],'Information shown depends on your workspace and permissions.');
 if(/class|homeroom|course|teacher|grade level|division/.test(name))
  return spec(full||'Class and grade','School grouping',
   'This column identifies the selected teaching group, programme, division or grade.',
   [],'It is a grouping, not a performance measure.');
 if(/coverage|responded|response|eligible|count|total|cohort/.test(name))
  return spec(full||'Evidence coverage','Participation and count',
   'Counts and response rates should be read against the eligible population and the selected date window.',
   [],'Missing responses are not equivalent to a negative response or a score of zero.');
 if(/year|date|period|term|window/.test(name))
  return spec(full||'Reporting window','Date context',
   'This is the reporting, assessment or follow-up period associated with the displayed value.',
   [],'Compare results only when the dates, populations and measures are consistent.');
 return spec(full||'Column information','How to read this column',
  'This column provides a source-specific value or label for the current selection. Select a row to see more detail where available.',
  [],'There is no universal colour threshold for this field. Refer to the measure’s own scale and source context.');
}
export function renderColumnGuide(guide){
 if(!guide)return '';
 const rows=guide.rows?.length?
  '<div class="column-guide-bands" role="list">'+guide.rows.map(r=>
   '<div role="listitem" class="column-guide-band">'+
   '<i class="column-guide-swatch" style="background:'+r.colour+'" aria-hidden="true"></i>'+
   '<strong>'+escapeHtml(r.label)+'</strong><span>'+escapeHtml(r.range)+'</span></div>').join('')+'</div>':'';
 return '<div class="column-guide-title"><strong>'+escapeHtml(guide.title)+'</strong>'+
  '<small>'+escapeHtml(guide.subtitle)+'</small></div>'+
  '<p>'+escapeHtml(guide.description)+'</p>'+rows+
  (guide.note?'<p class="column-guide-note">'+escapeHtml(guide.note)+'</p>':'');
}
/** Called once; delegates to dynamically rendered tables across five roles. */
export function installSitewideColumnGuides(root){
 if(!root||typeof root.addEventListener!=='function'||typeof document==='undefined'||
  !document.body?.appendChild||typeof document.createElement!=='function')return null;
 let active=null,popup=null;
 const getHeader=target=>target?.closest?.('th');
 const eligible=th=>th&&root.contains(th)&&!!th.closest('thead')&&
  !th.hasAttribute('data-map-rit-subject'); // Existing MAP popup is richer.
 const visible=th=>th&&!th.hasAttribute('data-ux-column-hidden')&&
  th.getBoundingClientRect?.().width>0;
 const ensure=()=>{
  if(popup)return popup;
  popup=document.createElement('div');
  popup.id='sitewide-column-guide';
  popup.className='sitewide-column-guide';
  popup.setAttribute('role','tooltip');popup.hidden=true;
  document.body.appendChild(popup);return popup;
 };
 function hide(){
  if(active)active.querySelector('[data-ux-sort]')?.removeAttribute('aria-describedby');
  active=null;if(popup)popup.hidden=true;
 }
 function decorate(){
  for(const th of root.querySelectorAll('thead th')){
   if(!visible(th))continue;
   if(th.dataset.columnGuideReady==='yes')continue;
   th.dataset.columnGuideReady='yes';
   // No extra tab stop: the header’s existing sort button provides keyboard focus.
   if(!th.hasAttribute('data-map-rit-subject')){
    const icon=document.createElement('span');
    icon.className='column-guide-indicator';icon.setAttribute('aria-hidden','true');
    icon.textContent='ⓘ';th.appendChild(icon);
   }
   th.removeAttribute('title');
   th.querySelector('[data-ux-sort]')?.removeAttribute('title');
  }
 }
 const show=th=>{
  if(!eligible(th)||!visible(th)||active===th)return;
  hide();active=th;
  const p=ensure();
  const label=th.dataset.fullHeading||th.dataset.sourceHeading||
   th.querySelector('.ux-sort-button')?.textContent||th.textContent;
  const family=th.dataset.facultyFamily||'';
  const stage=th.closest('[data-faculty-stage]')?.dataset.facultyStage||'';
  const role=root.dataset?.workspace||'faculty';
  p.innerHTML=renderColumnGuide(classifyColumnGuide({label,source:th.dataset.sourceHeading||th.dataset.fullHeading||'',family,stage,role}));
  p.hidden=false;
  const rect=th.getBoundingClientRect(),box=p.getBoundingClientRect();
  const ww=window.innerWidth||1024,hh=window.innerHeight||768;
  const left=Math.max(10,Math.min(ww-box.width-10,rect.left+rect.width/2-box.width/2));
  const top=rect.bottom+10+box.height<=hh-10?rect.bottom+10:
   Math.max(10,rect.top-box.height-10);
  p.style.left=Math.round(left)+'px';p.style.top=Math.round(top)+'px';
  th.querySelector('[data-ux-sort]')?.setAttribute('aria-describedby',p.id);
 };
 root.addEventListener('mouseover',e=>{const th=getHeader(e.target);if(eligible(th))show(th)});
 root.addEventListener('mouseout',e=>{if(active&&!active.contains(e.relatedTarget))hide()});
 root.addEventListener('focusin',e=>{const th=getHeader(e.target);if(eligible(th))show(th)});
 root.addEventListener('focusout',e=>{if(active&&!active.contains(e.relatedTarget))hide()});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
 root.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'){const th=getHeader(e.target);if(eligible(th))show(th)}
 });
 document.addEventListener?.('scroll',hide,{capture:true,passive:true});
 window.addEventListener?.('resize',hide);
 if(typeof MutationObserver==='function'){
  const observer=new MutationObserver(()=>{decorate();if(active&&!active.isConnected)hide()});
  observer.observe(root,{subtree:true,childList:true});
 }
 decorate();
 return {decorate,hide};
}
