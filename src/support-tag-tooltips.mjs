/** Shared, viewport-safe support badge tooltips for the public demo.
 * No private source calls. Text is always written with textContent.
 */
const BADGE='[data-support-tip]';
const clamp=(n,min,max)=>Math.min(Math.max(n,min),Math.max(min,max));

/** Pure positioning helper, tested at narrow and viewport-edge boundaries. */
export function positionSupportTooltip(anchor,box,viewport){
 const margin=12,gap=10;
 const width=Math.min(box.width,Math.max(0,viewport.width-margin*2));
 const left=clamp(anchor.left+anchor.width/2-width/2,margin,viewport.width-width-margin);
 const below=viewport.height-anchor.bottom>=box.height+gap+margin ||
  anchor.top<box.height+gap+margin;
 const top=below?
  clamp(anchor.bottom+gap,margin,viewport.height-box.height-margin):
  clamp(anchor.top-box.height-gap,margin,viewport.height-box.height-margin);
 return {left:Math.round(left),top:Math.round(top),placement:below?'below':'above'};
}

export function installSupportTagTooltips(root){
 if(!root?.addEventListener)return {hide(){}};
 let tooltip=null,active=null,pinned=false;
 const getBadge=target=>target?.closest?.(BADGE)||null;
 const ensure=()=>{
  if(tooltip)return tooltip;
  const doc=globalThis.document;
  if(!doc?.createElement||!doc.body?.appendChild)return null;
  tooltip=doc.createElement('div');
  tooltip.className='support-tag-tooltip';
  tooltip.id='support-tag-tooltip';
  tooltip.setAttribute('role','tooltip');
  tooltip.setAttribute('data-placement','below');
  tooltip.hidden=true;
  for(const [name,tag] of [['heading','strong'],['description','p'],['note','small']]){
   const el=doc.createElement(tag);
   el.className='support-tag-tooltip-'+name;
   tooltip.appendChild(el);
  }
  doc.body.appendChild(tooltip);
  return tooltip;
 };
 const hide=(force=false)=>{
  if(pinned&&!force)return;
  if(active?.removeAttribute){
   active.removeAttribute('aria-describedby');
   active.removeAttribute('aria-expanded');
  }
  active=null;pinned=false;
  if(tooltip)tooltip.hidden=true;
 };
 const show=(badge,lock=false)=>{
  if(!badge||!badge.isConnected)return;
  const element=ensure();
  if(!element)return;
  if(active&&active!==badge)hide(true);
  active=badge;pinned=lock;
  const parts=[
   badge.dataset.supportTipTitle||'Support reference',
   badge.dataset.supportTipDescription||'',
   badge.dataset.supportTipNote||''
  ];
  for(const [i,part] of [...element.children].entries())part.textContent=parts[i];
  element.hidden=false;
  element.style.visibility='hidden';
  element.style.left='0px';element.style.top='0px';
  const rect=badge.getBoundingClientRect(),bounds=element.getBoundingClientRect();
  const viewport={
   width:globalThis.window?.innerWidth||globalThis.document?.documentElement?.clientWidth||1024,
   height:globalThis.window?.innerHeight||globalThis.document?.documentElement?.clientHeight||768
  };
  const p=positionSupportTooltip(rect,bounds,viewport);
  element.style.left=p.left+'px';element.style.top=p.top+'px';
  element.dataset.placement=p.placement;
  element.style.visibility='visible';
  badge.setAttribute?.('aria-describedby',element.id);
  if(lock)badge.setAttribute?.('aria-expanded','true');
 };
 // Mouse hover and keyboard focus both display the same explanation.
 root.addEventListener('pointerover',event=>{
  if(event.pointerType&&event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
  const badge=getBadge(event.target);
  if(badge&&!pinned)show(badge);
 });
 root.addEventListener('pointerout',event=>{
  const badge=getBadge(event.target);
  if(badge===active&&!badge.contains?.(event.relatedTarget))hide();
 });
 root.addEventListener('focusin',event=>{
  const badge=getBadge(event.target);
  if(badge&&!pinned)show(badge);
 });
 root.addEventListener('focusout',event=>{
  if(getBadge(event.target)===active)hide();
 });
 // Capture allows touch taps on badges inside a roster-row button to explain
 // the status instead of unexpectedly opening a learner profile.
 root.addEventListener('click',event=>{
  const badge=getBadge(event.target);
  if(!badge){hide(true);return;}
  if(active===badge&&pinned)hide(true);else show(badge,true);
  event.preventDefault?.();
  event.stopPropagation?.();
 },true);
 root.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&active){hide(true);return;}
  const badge=getBadge(event.target);
  if(badge&&(event.key==='Enter'||event.key===' ')){
   event.preventDefault?.();
   if(active===badge&&pinned)hide(true);else show(badge,true);
  }
 },true);
 root.addEventListener('scroll',()=>hide(true),true);
 globalThis.window?.addEventListener?.('scroll',()=>hide(true),true);
 globalThis.window?.addEventListener?.('resize',()=>hide(true));
 return {hide};
}
