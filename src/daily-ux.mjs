/** My Learners daily-use enhancements.
 * Additive presentation layer over the existing read-only demonstration.
 * No source scores, scopes, app routes or student records are changed.
 */
import {safeText,compareEvidenceSource,exportCsv,parsePreferences,filteredRecords} from './daily-ux-core.mjs?v=20261031v1';
import {normaliseColumnOrder,moveColumn,normaliseColumnWidths,clampColumnWidth,COLUMN_WIDTHS,widthPreset} from './faculty-column-layout.mjs';
const root=document.getElementById('app');
const states=new Map();
const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
const label=x=>clean(x?.textContent);
const role=()=>{const s=root?.querySelector('.roles [data-role][aria-pressed="true"]');return s?.dataset.role||'faculty'};
const preferenceKey='mylearners-ux-v1';
let saved={};
try{saved=parsePreferences(localStorage.getItem(preferenceKey)||'{}')}catch{}
function save(){
 try{localStorage.setItem(preferenceKey,JSON.stringify(saved))}catch{}
}
const automaticKey='mylearners-faculty-columns-v1';
let automatic={};
try{automatic=parsePreferences(localStorage.getItem(automaticKey)||'{}')}catch{}
function persistLayout(key,s){
 automatic[key]={columnOrder:[...(s.columnOrder||[])],hidden:[...s.hidden],widths:{...s.widths}};
 try{localStorage.setItem(automaticKey,JSON.stringify(automatic))}catch{}
}
function tableKey(table,i){
 const context=table.closest('.roster-daily')?'faculty-roster':
  table.closest('.leader-detail')?'leader-evidence':
  table.closest('.board-view')?'board-evidence':role()+'-table';
 const heads=[...table.querySelectorAll('thead th')].map(label).join('|');
 if(table.matches('table.faculty-data-wall')){
  // Same teacher + same subjects share a layout, even across multiple classes.
  const teacher=root.querySelector('[data-select="teacher"]')?.value||'demo';
  return ['faculty-columns',teacher,heads].join(':').slice(0,500);
 }
 return [context,i,heads].join(':').slice(0,280);
}
function textRows(table){
 const headers=[...table.querySelectorAll('thead th')].map(th=>label(th));
 const rows=[...table.querySelectorAll('tbody tr')];
 return {headers,rows};
}
function stateFor(key,count,isFacultyColumns=false){
 if(!states.has(key)){
  const original={search:'',fields:{},order:null,desc:false,hidden:[],name:'',view:''};
  const previous=isFacultyColumns?automatic[key]:null;
  if(previous&&typeof previous==='object'){
   original.hidden=Array.isArray(previous.hidden)?previous.hidden:[];
   original.columnOrder=previous.columnOrder;
   original.widths=previous.widths;
  }
  states.set(key,original);
 }
 const s=states.get(key);
 s.hidden=(Array.isArray(s.hidden)?s.hidden:[]).filter(i=>Number.isInteger(i)&&i>0&&i<count);
 if(isFacultyColumns){
  s.columnOrder=normaliseColumnOrder(s.columnOrder,count);
  s.widths=normaliseColumnWidths(s.widths,count);
 }
 return s;
}
const sourceIndex=(cell,fallback)=>Number.isInteger(Number(cell?.dataset?.uxOrigin))?
 Number(cell.dataset.uxOrigin):fallback;
const sourceCell=(row,index)=>row?.querySelector('[data-ux-origin="'+index+'"]')||row?.cells?.[index]||null;
function updateColumnWidth(table,index,width){
 const value=clampColumnWidth(width);
 const col=table.querySelector('colgroup col[data-ux-origin="'+index+'"]');
 const th=table.querySelector('thead th[data-ux-origin="'+index+'"]');
 if(col)col.style.width=value+'px';
 if(th){th.style.width=value+'px';th.style.minWidth=value+'px';th.style.maxWidth=value+'px'}
}
function arrangeFacultyColumns(table,s){
 const order=normaliseColumnOrder(s.columnOrder,table.querySelectorAll('thead th').length);
 s.columnOrder=order;
 const sequences=[...table.querySelectorAll('thead tr, tbody tr')];
 const cols=table.querySelector('colgroup');
 if(cols)sequences.push(cols);
 for(const parent of sequences){
  const elements=[...parent.children];
  if(elements.length!==order.length)continue;
  const byId=new Map(elements.map((el,i)=>[sourceIndex(el,i),el]));
  for(const index of order){const el=byId.get(index);if(el)parent.appendChild(el)}
 }
 for(const [index,width] of Object.entries(s.widths||{}))updateColumnWidth(table,Number(index),width);
}
function apply(table,s){
 const {rows,headers}=textRows(table);
 const query=clean(s.search).toLocaleLowerCase();
 const filters=Object.entries(s.fields).filter(([,v])=>clean(v));
 let matches=0;
 const body=table.tBodies?.[0];
 if(body && Number.isInteger(s.order)){
  const col=s.order;
  const source=cell=>cell?.hasAttribute('data-ux-sort-value')?cell.getAttribute('data-ux-sort-value'):null;
  rows.sort((a,b)=>compareEvidenceSource(sourceCell(a,col)?.textContent,sourceCell(b,col)?.textContent,
   source(sourceCell(a,col)),source(sourceCell(b,col)),s.desc)).forEach(row=>body.appendChild(row));
 }
 const visibleRows=[...table.querySelectorAll('tbody tr')];
 for(const tr of visibleRows){
  const all=label(tr).toLocaleLowerCase();
  const match=(!query||all.includes(query))&&filters.every(([index,v])=>
   clean(sourceCell(tr,Number(index))?.textContent).toLocaleLowerCase().includes(clean(v).toLocaleLowerCase()));
  tr.classList.toggle('ux-hidden',!match);
  tr.hidden=!match;
  if(match)matches++;
  [...tr.cells].forEach((cell,j)=>{if(s.hidden.includes(sourceIndex(cell,j)))cell.dataset.uxColumnHidden='';else delete cell.dataset.uxColumnHidden});
 }
 [...table.querySelectorAll('thead th')].forEach((th,i)=>{
  if(s.hidden.includes(sourceIndex(th,i)))th.dataset.uxColumnHidden='';else delete th.dataset.uxColumnHidden;
  const button=th.querySelector('[data-ux-sort]');
  if(button)button.setAttribute('aria-sort',s.order===sourceIndex(th,i)?(s.desc?'descending':'ascending'):'none');
 });
 [...table.querySelectorAll('colgroup col')].forEach((col,i)=>{
  if(s.hidden.includes(sourceIndex(col,i)))col.dataset.uxColumnHidden='';
  else delete col.dataset.uxColumnHidden;
 });
 const shell=table.closest('.ux-table-shell');
 const count=shell?.querySelector('[data-ux-count]');
 if(count)count.textContent=matches+' of '+visibleRows.length+' records';
 const empty=shell?.querySelector('[data-ux-no-results]');
 if(empty)empty.hidden=matches!==0;
}
function currentSettings(s){return {search:s.search,fields:{...s.fields},order:s.order,desc:s.desc,hidden:[...s.hidden],
 columnOrder:Array.isArray(s.columnOrder)?[...s.columnOrder]:null,widths:{...s.widths}}}
function toolButton(name,text){return '<button type="button" class="ux-action" data-ux-'+name+'>'+text+'</button>'}
function decorate(table,index){
 if(table.closest('.ux-table-shell')||!table.querySelector('thead th')||!table.querySelector('tbody tr'))return;
 const {headers}=textRows(table);
 if(!headers.length||headers.length>20)return;
 const isFacultyColumns=table.matches('table.faculty-data-wall');
 const key=tableKey(table,index),s=stateFor(key,headers.length,isFacultyColumns);
 if(isFacultyColumns){
  [...table.querySelectorAll('thead th')].forEach((cell,i)=>{cell.dataset.uxOrigin=String(i)});
  for(const tr of table.querySelectorAll('tbody tr'))
   [...tr.cells].forEach((cell,i)=>{cell.dataset.uxOrigin=String(i)});
  [...table.querySelectorAll('colgroup col')].forEach((col,i)=>{col.dataset.uxOrigin=String(i)});
 }
 const shell=document.createElement('div');
 shell.className='ux-table-shell';
 shell.dataset.uxTableKey=key;
 table.parentNode.insertBefore(shell,table);
 shell.appendChild(table);
 const panel=document.createElement('div');
 panel.className='ux-data-tools';
 const safe=(v)=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 const choices=(saved[key]&&typeof saved[key]==='object')?Object.keys(saved[key]):[];
 const fields=headers.map((h,i)=>'<label class="ux-column-filter">'+safe(h)+
   '<input data-ux-field="'+i+'" value="'+safe(s.fields[i]||'')+'" placeholder="Filter…"></label>').join('');
 const columns=isFacultyColumns?
  '<p class="ux-column-guide">Drag a subject header to move it. Drag its right edge to resize. Or use the arrows and width choices below.</p>'+
  '<div class="ux-column-manage" data-ux-column-list></div>'+
  '<button type="button" class="ux-action ux-column-restore" data-ux-restore-columns>Restore default columns</button>':
  headers.map((h,i)=>'<label class="ux-column-row"><input type="checkbox" data-ux-column="'+i+'" '+
  (!s.hidden.includes(i)?'checked ':'')+(i===0?'disabled ':'')+'><span>'+safe(h)+'</span></label>').join('');
 panel.innerHTML='<div class="ux-tool-main"><label class="ux-filter-label"><span class="sr-only">Search visible table</span>'+
  '<input class="ux-search-input" data-ux-search type="search" value="'+safe(s.search)+'" placeholder="Search these records" aria-label="Search records in this table"></label>'+
  '<details class="ux-menu"><summary>Column filters</summary><div class="ux-popover"><strong>Filter by values</strong><div class="ux-field-grid">'+fields+'</div></div></details>'+
  '<details class="ux-menu"><summary data-ux-columns>'+(isFacultyColumns?'Arrange / hide columns':'Columns')+'</summary><div class="ux-popover'+(isFacultyColumns?' ux-column-layout-popover':'')+'"><strong>'+(isFacultyColumns?'Arrange, size and hide':'Show columns')+'</strong>'+columns+'</div></details>'+
  toolButton('clear','Reset')+
  ((role()==='faculty'||role()==='board')?toolButton('export','Export visible CSV'):'')+
  '</div><div class="ux-view-row"><label>Saved layout</label><select class="ux-view-picker" data-ux-view aria-label="Select saved table layout">'+
  '<option value="">Select view…</option>'+choices.map(n=>'<option value="'+safe(n)+'">'+safe(n)+'</option>').join('')+'</select>'+
  '<input class="ux-save-name" data-ux-name placeholder="Name this layout" maxlength="48" aria-label="Saved view name">'+
  toolButton('save','Save layout')+toolButton('remove','Delete selected')+'</div>';
 const caption=document.createElement('div');
 caption.className='ux-table-caption';
 caption.innerHTML='<output data-ux-count aria-live="polite"></output><span>'+(isFacultyColumns?'Drag a heading to move it, or its right edge to resize.':'Click a column header to sort.')+' Layouts save presentation preferences only, not student data.</span>';
 if(isFacultyColumns)caption.insertAdjacentHTML('beforeend','<output class="ux-layout-announcement sr-only" data-ux-layout-announcement aria-live="polite"></output>');
 const empty=document.createElement('p');
 empty.className='ux-table-caption';
 empty.dataset.uxNoResults='';
 empty.textContent='No matching records. Try resetting the filters.';
 empty.hidden=true;
 shell.insertBefore(panel,table);
 if(role()==='board'||(role()==='faculty'&&table.closest('.roster-daily'))){
  const controls=document.createElement('details');
  const faculty=role()==='faculty';
  controls.className=faculty?'ux-faculty-table-controls':'ux-board-table-controls';
  const heading=document.createElement('summary');
  heading.textContent=faculty?'Table tools · filters, columns and saved views':
   'Table tools · search, columns and export';
  controls.appendChild(heading);
  panel.parentNode.insertBefore(controls,panel);
  controls.appendChild(panel);
  // Expose active filters rather than hiding an applied setting.
  if(faculty&&(s.search||Object.values(s.fields).some(clean)||(!isFacultyColumns&&s.hidden.length)))controls.open=true;
 }
 shell.appendChild(caption);shell.appendChild(empty);
 [...table.querySelectorAll('thead th')].forEach((th,i)=>{
  if(th.querySelector('[data-ux-sort]'))return;
  const content=th.innerHTML;
  th.innerHTML='<button type="button" class="ux-sort-button" data-ux-sort="'+i+'" aria-sort="none" aria-label="Sort by '+safe(headers[i])+'">'+content+'</button>';
  if(isFacultyColumns&&i>0&&i<headers.length-1){
   th.insertAdjacentHTML('beforeend',
    '<button type="button" class="ux-column-grip" draggable="true" data-ux-drag="'+i+
    '" title="Drag to reorder '+safe(headers[i])+'" aria-label="Drag to reorder '+safe(headers[i])+'">⠿</button>'+
    '<span class="ux-column-resize" role="separator" tabindex="0" aria-orientation="vertical"'+
    ' data-ux-resize="'+i+'" aria-label="Resize '+safe(headers[i])+': drag or use arrow keys"></span>');
  }
 });
 if(isFacultyColumns)arrangeFacultyColumns(table,s);
 const render=()=>apply(table,s);
 function syncColumnList(){
  if(!isFacultyColumns)return;
  const list=panel.querySelector('[data-ux-column-list]');
  if(!list)return;
  const mid=s.columnOrder.filter(i=>i>0&&i<headers.length-1);
  list.innerHTML=s.columnOrder.map(i=>{
   const movable=i>0&&i<headers.length-1;
   const at=mid.indexOf(i);
   const size=widthPreset(s.widths[i]);
   const choice=movable?'<select data-ux-column-width="'+i+'" aria-label="Width of '+safe(headers[i])+'">'+
    Object.entries(COLUMN_WIDTHS).map(([name,n])=>
     '<option value="'+name+'"'+(size===name?' selected':'')+'>'+name[0].toUpperCase()+name.slice(1)+' ('+n+'px)</option>').join('')+
    (size==='custom'?'<option value="custom" selected>Custom</option>':'')+'</select>':'';
   return '<div class="ux-column-config" data-ux-column-row="'+i+'">'+
    '<label class="ux-column-row"><input type="checkbox" data-ux-column="'+i+'"'+
     (!s.hidden.includes(i)?' checked':'')+(i===0?' disabled':'')+
     '><span>'+safe(headers[i])+'</span></label>'+
    (movable?'<div class="ux-column-move"><button type="button" data-ux-move-left="'+i+'"'+
     (at===0?' disabled':'')+' aria-label="Move '+safe(headers[i])+' left">←</button>'+
     '<button type="button" data-ux-move-right="'+i+'"'+
     (at===mid.length-1?' disabled':'')+' aria-label="Move '+safe(headers[i])+' right">→</button>'+
     choice+'</div>':'<span class="ux-column-fixed">'+(i===0?'Fixed first':'Fixed last')+'</span>')+
    '</div>';
  }).join('');
 }
 function recordLayout(){
  if(!isFacultyColumns)return;
  persistLayout(key,s);
  const note=table.closest('.ux-table-shell')?.querySelector('[data-ux-layout-announcement]');
  if(note)note.textContent='Column layout updated and saved on this device.';
 }
 function updateArrangement(){
  if(!isFacultyColumns)return;
  arrangeFacultyColumns(table,s);
  syncColumnList();render();recordLayout();
 }
 syncColumnList();
 panel.addEventListener('input',e=>{
  if(e.target.matches('[data-ux-search]'))s.search=e.target.value;
  else if(e.target.matches('[data-ux-field]'))s.fields[e.target.dataset.uxField]=e.target.value;
  else return;
  render();
 });
 panel.addEventListener('change',e=>{
  if(e.target.matches('[data-ux-column]')){
   const i=Number(e.target.dataset.uxColumn);
   s.hidden=e.target.checked?s.hidden.filter(x=>x!==i):[...s.hidden.filter(x=>x!==i),i];
   render();
  }else if(e.target.matches('[data-ux-view]')){
   const name=e.target.value;
   if(!name||!saved[key]?.[name])return;
   Object.assign(s,parsePreferences(JSON.stringify(saved[key][name])));
   s.hidden=(Array.isArray(s.hidden)?s.hidden:[]).filter(i=>Number.isInteger(i)&&i>0&&i<headers.length);
   s.fields=(s.fields&&typeof s.fields==='object')?s.fields:{};
   s.order=Number.isInteger(s.order)&&s.order<headers.length?s.order:null;
   panel.querySelector('[data-ux-search]').value=s.search||'';
   for(const el of panel.querySelectorAll('[data-ux-field]'))el.value=s.fields[el.dataset.uxField]||'';
   for(const el of panel.querySelectorAll('[data-ux-column]'))el.checked=!s.hidden.includes(Number(el.dataset.uxColumn));
   panel.querySelector('[data-ux-name]').value=name;
   render();
  }
 });
 table.querySelector('thead').addEventListener('click',e=>{
  const btn=e.target.closest('[data-ux-sort]');
  if(!btn)return;
  const i=Number(btn.dataset.uxSort);
  s.desc=s.order===i?!s.desc:false;s.order=i;render();
 });
 panel.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  if(btn.hasAttribute('data-ux-clear')){
   Object.assign(s,{search:'',fields:{},hidden:[],order:null,desc:false});
   panel.querySelector('[data-ux-search]').value='';
   for(const input of panel.querySelectorAll('[data-ux-field]'))input.value='';
   for(const input of panel.querySelectorAll('[data-ux-column]'))input.checked=true;
   render();
  }else if(btn.hasAttribute('data-ux-save')){
   const name=clean(panel.querySelector('[data-ux-name]').value).slice(0,48);
   if(!name){panel.querySelector('[data-ux-name]').focus();return}
   if(!saved[key])saved[key]={};
   saved[key][name]=currentSettings(s);save();
   const picker=panel.querySelector('[data-ux-view]');
   if(![...picker.options].some(o=>o.value===name)){
    const opt=document.createElement('option');opt.value=name;opt.textContent=name;picker.appendChild(opt);
   }picker.value=name;
  }else if(btn.hasAttribute('data-ux-remove')){
   const picker=panel.querySelector('[data-ux-view]');
   const n=picker.value;
   if(n&&saved[key]?.[n]){
    delete saved[key][n];save();picker.querySelectorAll('option').forEach(o=>{if(o.value===n)o.remove()});
    picker.value='';panel.querySelector('[data-ux-name]').value='';
   }
  }else if(btn.hasAttribute('data-ux-export')){
   if(!['faculty','board'].includes(role()))return;
   const cols=headers.map((_,i)=>i).filter(i=>!s.hidden.includes(i));
   const body=[...table.querySelectorAll('tbody tr')].filter(tr=>!tr.hidden);
   const csv=exportCsv(cols.map(i=>headers[i]),body.map(tr=>cols.map(i=>label(tr.cells[i]))));
   const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download='my-learners-'+role()+'-visible-demo.csv';
   document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
 });
 render();
}
function sourceStrip(){
 const heading=root.querySelector('.heading:not(.board-heading)');
 if(!heading||heading.nextElementSibling?.classList.contains('ux-source-strip'))return;
 const r=role();
 const strip=document.createElement('section');
 strip.className='ux-source-strip';
 strip.setAttribute('aria-label','Evidence source and reporting context');
 const info=r==='faculty'?'Faculty evidence is fictional. Issued reports show their school year; MAP, IXL and check-ins have distinct scales.':
  r==='leader'?'All individual learner records, support cohorts and experience indices in this view are fictional; dates and eligibility vary by assessment.':
  r==='sss'?'Fictional learner support demonstration only. Specialist records are not securely shared or connected to an authoritative source.':
  'Student learning evidence is fictional. Historical issued grades are not current-year results.';
 strip.innerHTML='<strong>Evidence context</strong><span>Demonstration · 8 Oct 2026</span>'+
 '<details><summary>What am I viewing?</summary><p>'+info+
 ' Missing results are not zeros. Use the source, date and scale noted beside each measure.</p></details>';
 heading.insertAdjacentElement('afterend',strip);
}
function boardUtility(){
 const heading=root.querySelector('.board-heading');
 if(!heading||root.querySelector('.ux-board-utility'))return;
 const block=document.createElement('div');block.className='ux-board-utility';
 block.innerHTML='<p>Aggregated school evidence · refer to each chart’s source and reporting window.</p>'+
 '<button type="button" class="ux-action" data-ux-print>Print this view</button>';
 heading.insertAdjacentElement('afterend',block);
 block.querySelector('[data-ux-print]').addEventListener('click',()=>globalThis.print?.());
}
function sssContext(){
 const target=root.querySelector('.sss-view .sss-boundary');
 if(!target||root.querySelector('.ux-sss-note'))return;
 const node=document.createElement('p');node.className='ux-sss-note';
 node.innerHTML='<strong>Evidence workspace:</strong> The operational SharePoint version should link to the authorised plan or case record rather than storing independent copies of sensitive support information.';
 target.insertAdjacentElement('afterend',node);
}
function nav(){
 const links=root?.querySelector('nav.roles');
 if(!links||links.querySelector('[data-ux-find]'))return;
 const b=document.createElement('button');
 b.type='button';b.className='ux-nav-button';b.dataset.uxFind='';b.innerHTML='Find <span class="ux-nav-shortcut">⌘ / Ctrl + K</span>';
 links.appendChild(b);
 b.addEventListener('click',()=>openFinder());
}
let dialog;
function openFinder(){
 if(!dialog||!dialog.isConnected)return;
 dialog.showModal?.();
 const input=dialog.querySelector('input');
 input.value='';populateFinder('');input.focus();
}
function buildFinder(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='ux-command';
 dialog.setAttribute('aria-label','Find a dashboard or assigned learner');
 dialog.innerHTML='<div class="ux-command-head"><h2>Go to…</h2><button type="button" class="ux-command-close" aria-label="Close search">Close</button></div>'+
 '<input type="search" aria-label="Find a dashboard or visible learner" placeholder="Dashboard, class or learner…">'+
 '<p>Search the current permitted view or switch dashboard. Live data access will follow SharePoint permissions.</p><div class="ux-command-results"></div>';
 document.body.appendChild(dialog);
 dialog.querySelector('.ux-command-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('input').addEventListener('input',e=>populateFinder(e.target.value));
 dialog.addEventListener('click',e=>{
  const b=e.target.closest('[data-ux-go]');
  if(!b)return;
  dialog.close();
  if(b.dataset.uxGo==='role'){root.querySelector('[data-role="'+b.dataset.target+'"]')?.click()}
  else if(b.dataset.uxGo==='student'){root.querySelector('[data-student="'+b.dataset.target+'"]')?.click()}
  else if(b.dataset.uxGo==='sss'){root.querySelector('[data-sss-student="'+b.dataset.target+'"]')?.click()}
 });
}
function populateFinder(q){
 const target=dialog?.querySelector('.ux-command-results');
 if(!target)return;
 const escaped=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 const roles=[['faculty','Faculty'],['student','Student'],['sss','Student Support Services'],['leader','Leaders'],['board','Board']];
 const items=roles.map(([id,name])=>({kind:'role',id,name:name+' dashboard'}));
 if(role()==='faculty'){
  for(const b of root.querySelectorAll('.roster-desktop [data-student]')){
   items.push({kind:'student',id:b.dataset.student,name:label(b)});
  }
 }else if(role()==='sss'){
  for(const b of root.querySelectorAll('[data-sss-student]'))items.push({kind:'sss',id:b.dataset.sssStudent,name:label(b).slice(0,85)});
 }
 const seen=new Set();
 const hits=items.filter(x=>{
  const id=x.kind+':'+x.id;
  if(seen.has(id))return false;seen.add(id);
  return !q||x.name.toLowerCase().includes(clean(q).toLowerCase());
 }).slice(0,25);
 target.innerHTML=hits.length?hits.map(x=>'<button type="button" data-ux-go="'+x.kind+
  '" data-target="'+escaped(x.id)+'">'+escaped(x.name)+'</button>').join(''):'<p>No matching dashboard or visible learner.</p>';
}
function enhance(){
 if(!root)return;
 nav();sourceStrip();boardUtility();sssContext();
 let i=0;
 const selected=role();
 const scopes=selected==='faculty'?root.querySelectorAll('.roster-desktop table'):
  selected==='leader'?root.querySelectorAll('.leader-detail table'):
  selected==='board'?root.querySelectorAll('.board-view table'):[];
 for(const table of scopes)decorate(table,i++);
}
buildFinder();
root?.addEventListener('click',e=>{if(e.target.closest('[data-role]'))dialog?.open&&dialog.close()});
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
  e.preventDefault();openFinder();
 }else if(e.key==='Escape'&&dialog?.open)dialog.close();
});
const observer=new MutationObserver(enhance);
if(root)observer.observe(root,{childList:true});
enhance();
