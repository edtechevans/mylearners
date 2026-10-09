/** Shared badge and guidance UI for fictional student support indicators. */
import {demoTagsForStudent} from './learner-tags.mjs';
import {icon,esc} from './v2-ui.mjs?v=tags1';

/** ctx=roster, cards or profile. Outside the profile chips open the support tab.
 * Within the profile chips select the matching guidance card.
 */
export function supportTagChips(student,where='roster'){
 const tags=demoTagsForStudent(student);
 if(!tags.length)return where==='roster'?'<span class="learner-tags-empty">—</span>':'';
 const buttons=tags.map(tag=>{
  const action=where==='profile'
   ?' data-view-support="'+esc(tag.id)+'"'
   :' data-open-student="'+esc(student.id)+'" data-target-tab="support" data-tag-focus="'+esc(tag.id)+'"';
  return '<button type="button" class="learner-support-chip tag-'+esc(tag.id)+'"'+action+
   ' aria-label="View '+esc(tag.fullName)+' guidance for '+esc(student.name)+'" title="'+esc(tag.fullName)+'">'+
   esc(tag.label)+'</button>';
 }).join('');
 return '<div class="learner-support-chips '+(where==='profile'?'in-profile':'')+
  '" role="group" aria-label="Fictional classroom support indicators">'+buttons+'</div>';
}
export function taggedSupportDetail(student,focusTag=''){
 const tags=demoTagsForStudent(student);
 if(!tags.length)return '<section class="v2-card v2-card-roomy learner-support-section">'+
  '<span class="v2-eyebrow">SUPPORT INDICATORS</span><h2>No support tags in this demonstration</h2>'+
  '<p>No additional tags are assigned to this fictional learner. This does not confirm the absence of learning or support needs.</p></section>';
 return '<section class="v2-card v2-card-roomy learner-support-section">'+
 '<div class="v2-card-head"><div><span class="v2-eyebrow">STUDENT SUPPORT · DEMONSTRATION</span>'+
 '<h2>Support indicators & classroom guidance</h2>'+
 '<p>These fictional tags help demonstrate quick access to practical, teacher-relevant information.</p></div>'+
 '<span class="v2-mini-count">'+tags.length+' '+(tags.length===1?'tag':'tags')+'</span></div>'+
 '<div class="learner-tag-explainer">'+icon('info',16)+
 ' Select a tag on the class roster or learner profile to jump to its guidance here. No diagnoses, medical histories or confidential plans are shown.</div>'+
 '<div class="learner-support-details">'+tags.map(tag=>{
  const selected=tag.id===focusTag;
  return '<article class="learner-support-detail '+(selected?'selected ':'')+
   'detail-'+esc(tag.id)+'" data-support-detail="'+esc(tag.id)+'" tabindex="-1">'+
   '<div class="learner-support-detail-head"><span class="learner-support-static-tag tag-'+esc(tag.id)+'">'+esc(tag.label)+'</span>'+
   '<h3>'+esc(tag.fullName)+'</h3></div>'+
   '<p class="learner-support-summary">'+esc(tag.summary)+'</p>'+
   '<h4>Useful classroom approaches</h4><ul>'+tag.strategies.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+
   '<p class="learner-support-source">'+icon('file-text',14)+' '+esc(tag.source)+'</p>'+
   (tag.restricted?'<p class="learner-support-restricted">'+icon('lock',14)+
    ' Detailed health, behavioural, counselling or safeguarding records are not available in this public demo.</p>':'')+
   '</article>';
 }).join('')+'</div></section>';
}
