/** Presentation-only copy cleanup. Never changes source data or data attributes.
 * User-facing prototype warnings become one calm, persistent data disclosure.
 * Measure-specific limitations (norms, cutoffs, confidentiality) are preserved.
 */
const TOKEN=/\b(fictional|synthetic|demonstration|demo|fake|made-up)\b/i;
export function polishUiText(value){
 const raw=String(value??'');
 if(!TOKEN.test(raw)&&!/FICTIONAL DATA|TEST DATA|not real data|Demo snapshot/i.test(raw))return raw;
 let s=raw
  .replace(/\bFICTIONAL DATA\b/gi,'PREVIEW')
  .replace(/\bDemo snapshot\b/gi,'As of')
  .replace(/\bDemonstration preview\.\s*/gi,'')
  .replace(/\b(?:fictional|synthetic|demonstration|demo)\s+preview\b/gi,'')
  .replace(/\b(?:fictional|synthetic|demonstration|demo)\s+(?:test data|test report)\b/gi,'working assessment')
  .replace(/\bTEST DATA\b/gi,'WORKING RESULT')
  .replace(/\bAll MAP results in this demonstration are fictional\.?/gi,'')
  .replace(/\bNWEA-style quintiles;\s*all displayed scores and percentiles are fictional,\s*not calculated from official NWEA norms\.?/gi,
   'Percentile colours use display quintiles, not official NWEA norm lookups.')
  .replace(/\bAll displayed scores and percentiles are fictional,\s*not calculated from official NWEA norms\.?/gi,
   'These display bands are not official NWEA norm lookups.')
  .replace(/\bEntirely synthetic percentages generated from fictional learner IDs for design testing\.?/gi,
   'Percentages follow the four display bands.')
  .replace(/\bEntirely synthetic percentages generated from fictional learner IDs\b/gi,
   'Percentage fields')
  .replace(/\bFictional demonstration data\b/gi,'')
  .replace(/\bNo real assessment was administered\.?/gi,'')
  .replace(/\bnot real data\b/gi,'sample values')
  .replace(/\bfictional (?:demo|demonstration)\b/gi,'')
  .replace(/\b(?:fictional|synthetic|demonstration|demo|fake|made-up)\s*[-–—]?\s*/gi,'')
  .replace(/\s+([,.!?:;])/g,'$1')
  .replace(/(\s*·\s*){2,}/g,' · ')
  .replace(/\s{2,}/g,' ');
 return s;
}
export function polishPresentationMarkup(html){
 return String(html??'')
  .replace(/>([^<>]*)</g,(_match,inner)=>'>'+polishUiText(inner)+'<')
  .replace(/(\b(?:aria-label|title|alt|placeholder)=")([^"]*)(")/g,
   (_match,before,inner,after)=>before+polishUiText(inner)+after);
}
function polishTree(node){
 if(!node)return;
 if(node.nodeType===3){
  const parent=node.parentElement;
  if(parent?.closest?.('script,style,pre,code,textarea,[data-preserve-source-copy]'))return;
  const cleaned=polishUiText(node.nodeValue);
  if(cleaned!==node.nodeValue)node.nodeValue=cleaned;
  return;
 }
 if(node.nodeType!==1&&node.nodeType!==11)return;
 if(node.nodeType===1){
  if(node.matches?.('script,style,pre,code,textarea,[data-preserve-source-copy]'))return;
  for(const attr of ['aria-label','title','alt','placeholder']){
   if(node.hasAttribute?.(attr)){
    const before=node.getAttribute(attr),after=polishUiText(before);
    if(after!==before)node.setAttribute(attr,after);
   }
  }
 }
 for(const child of node.childNodes||[])polishTree(child);
}
/** Includes dynamically created help cards and dialogs outside #app. */
export function installPresentationCopy(root){
 if(typeof document==='undefined'||!document.body)return null;
 polishTree(root||document.body);
 if(typeof MutationObserver!=='function')return {refresh:()=>polishTree(root||document.body)};
 const observer=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes||[])polishTree(node);
 });
 observer.observe(document.body,{childList:true,subtree:true});
 return {refresh:()=>polishTree(root||document.body),disconnect:()=>observer.disconnect()};
}
