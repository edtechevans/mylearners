/** Low-tab-count, arrow-key Faculty roster navigation.
 * Native HTML tables and button actions are preserved. One data-cell action
 * is in the Tab order; arrow/Home/End move within visible cells and rows.
 */
const CANDIDATE='button.student-link,button.evidence-cell-open,button.map-rit-tile';
const onScreen=element=>element&&!element.hidden&&!element.classList.contains('ux-hidden')&&
 !element.hasAttribute('data-ux-column-hidden')&&getComputedStyle(element).display!=='none';
export function installFacultyGridNavigation(table){
 if(!table||table.dataset.facultyGridNavigation==='true')return null;
 table.dataset.facultyGridNavigation='true';
 table.setAttribute('aria-describedby','faculty-roster-grid-help');
 let active=null;
 const cellsForRow=row=>[...row.cells].filter(onScreen).map(cell=>({
  cell,button:cell.querySelector(CANDIDATE)
 })).filter(item=>item.button&&onScreen(item.button));
 const rows=()=>[...table.tBodies[0]?.rows||[]].filter(onScreen).map(row=>({
  row,items:cellsForRow(row)
 })).filter(entry=>entry.items.length);
 const all=()=>rows().flatMap(row=>row.items.map(x=>x.button));
 function activate(button,{focus=false}={}){
  if(!button)return false;
  const list=all();
  if(!list.includes(button))return false;
  if(active!==button)for(const item of list)item.tabIndex=item===button?0:-1;
  else if(button.tabIndex!==0)button.tabIndex=0;
  active=button;
  if(focus){
   button.focus({preventScroll:true});
   button.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  return true;
 }
 function refresh(){
  const list=all();
  if(!list.length){active=null;return}
  if(!list.includes(active))active=list[0];
  for(const button of list)button.tabIndex=button===active?0:-1;
 }
 function focusLearner(id){
  const record=rows().find(({row})=>row.querySelector('button.student-link')?.dataset.student===id);
  const button=record?.row.querySelector('button.student-link')||record?.items[0]?.button;
  return activate(button,{focus:true});
 }
 const visibleLearners=()=>rows().map(({row})=>{
  const link=row.querySelector('button.student-link');
  return link?{id:link.dataset.student,name:link.textContent.trim()}:null;
 }).filter(Boolean);
 table.addEventListener('focusin',event=>{
  const button=event.target.closest?.(CANDIDATE);
  if(button&&table.contains(button))activate(button);
 });
 table.addEventListener('click',event=>{
  const button=event.target.closest?.(CANDIDATE);
  if(button&&table.contains(button))activate(button);
 });
 table.addEventListener('keydown',event=>{
  const button=event.target.closest?.(CANDIDATE);
  if(!button||!table.contains(button))return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  if(event.altKey||event.metaKey||event.shiftKey)return;
  const collection=rows(),r=collection.findIndex(({items})=>items.some(x=>x.button===button));
  if(r<0)return;
  const items=collection[r].items,at=items.findIndex(x=>x.button===button);
  if(at<0)return;
  let target=null;
  if(event.key==='Home')target=event.ctrlKey?collection[0].items[0]?.button:items[0]?.button;
  else if(event.key==='End')target=event.ctrlKey?collection.at(-1).items.at(-1)?.button:items.at(-1)?.button;
  else if(!event.ctrlKey){
   if(event.key==='ArrowLeft')target=items[Math.max(0,at-1)]?.button;
   if(event.key==='ArrowRight')target=items[Math.min(items.length-1,at+1)]?.button;
   if(event.key==='ArrowUp'||event.key==='ArrowDown'){
    const next=collection[Math.max(0,Math.min(collection.length-1,r+(event.key==='ArrowDown'?1:-1)))];
    const sourceCell=items[at].cell.cellIndex;
    target=next.items.reduce((best,x)=>Math.abs(x.cell.cellIndex-sourceCell)<
      Math.abs((best?.cell.cellIndex??999)-sourceCell)?x:best,null)?.button;
   }
  }
  if(!target)return;
  event.preventDefault();
  activate(target,{focus:true});
 });
 refresh();
 return {refresh,focusLearner,visibleLearners,focusFirst:()=>activate(all()[0],{focus:true})};
}
