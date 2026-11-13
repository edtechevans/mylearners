/** CSV exports for the current authorised dashboard view.
 * The public site contains only synthetic learner records. No data is uploaded.
 */
export function csvValue(value){
 const text=String(value??'').replace(/\r?\n/g,' ').trim();
 const safe=/^[=+\-@\t\r]/.test(text)?"'"+text:text;
 return '"'+safe.replace(/"/g,'""')+'"';
}
export function csvContent(rows){
 return '\ufeff'+rows.map(row=>row.map(csvValue).join(',')).join('\r\n')+'\r\n';
}
export function exportCsv(filename,rows,doc=globalThis.document){
 if(!doc||!Array.isArray(rows)||!rows.length)return false;
 const blob=new Blob([csvContent(rows)],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const link=doc.createElement('a');
 link.href=url;link.download=filename.replace(/[^A-Za-z0-9_.-]/g,'_');
 link.style.display='none';doc.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
 return true;
}
const visible=el=>!!el&&!!el.getClientRects?.().length&&!el.closest?.('[hidden]');
const flat=el=>String(el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();
/** Exports what the current dashboard actually displays, not hidden cohorts. */
export function visibleDashboardCsv(root,workspace){
 const main=root.querySelector('#main');
 const rows=[['My Learners dashboard',workspace],['Export scope','Currently visible tables and summary tiles']];
 const tables=[...(main?.querySelectorAll('table')||[])].filter(visible);
 tables.forEach((table,index)=>{
  const title=table.closest('section,article')?.querySelector('h2,h3')?.textContent?.trim()||'Table '+(index+1);
  rows.push([],['Table',title]);
  for(const tr of table.querySelectorAll('tr')){
   if(!visible(tr))continue;
   const cells=[...tr.querySelectorAll(':scope > th, :scope > td')].map(cell=>{
    const label=flat(cell);
    // Faculty's colour-only indicators carry their data in accessible context;
    // a visible column has no number, so preserve the descriptive band.
    const first=cell.querySelector('[aria-label]');
    return label||first?.getAttribute('aria-label')||cell.getAttribute('data-ux-sort-value')||'';
   });
   if(cells.length)rows.push(cells);
  }
 });
 if(!tables.length){
  rows.push([],['Summary','Value']);
  const cards=[...(main?.querySelectorAll('.kpi,.quick-tile,.leader-stat,.leader-daily-priority,.metric')||[])].filter(visible);
  cards.forEach(card=>{
   const label=flat(card.querySelector('.eyebrow,.leader-stat-heading,.leader-priority-label,.metric-top,.quick-score>span'))||'Summary';
   const value=flat(card.querySelector('strong,.leader-experience-scale,.metric-value'))||
    card.querySelector('[role="img"]')?.getAttribute('aria-label')||'';
   rows.push([label,value]);
  });
 }
 return rows;
}
