/** My Learners daily-use enhancements.
 * Additive presentation layer over the existing read-only demonstration.
 * No source scores, scopes, app routes or student records are changed.
 */
import {safeText,compareEvidenceSource,exportCsv,parsePreferences,filteredRecords} from './daily-ux-core.mjs?v=20261031v1';
import {normaliseColumnOrder,moveColumn,normaliseColumnWidths,clampColumnWidth,COLUMN_WIDTHS,widthPreset} from './faculty-column-layout.mjs';
import {facultyGroupTransitions,facultyVisibleTableWidth} from './faculty-roster-headings.mjs?v=20261113workflow1';
import {installFacultyGridNavigation} from './faculty-roster-keyboard.mjs';
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
 const heads=[...table.querySelectorAll('thead th')].map(th=>
  clean(th.dataset.sourceHeading||label(th))).join('|');
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
/** Recalculate subtle boundaries and width from the currently VISIBLE,
 * reordered evidence columns. All IDs remain the original source indices. */
function refreshFacultyPresentation(table,state){
 const headers=[...table.querySelectorAll('thead th')];
 const families=[];
 for(const [position,header] of headers.entries())
  families[sourceIndex(header,position)]=header.dataset.facultyFamily||'other';
 const starts=new Set(facultyGroupTransitions(families,state.columnOrder,state.hidden));
 for(const cell of table.querySelectorAll('thead th,tbody td')){
  const index=Number(cell.dataset.uxOrigin);
  cell.toggleAttribute('data-faculty-group-start',starts.has(index));
 }
 const widths=[];
 for(const [position,col] of [...table.querySelectorAll('colgroup col')].entries()){
  const index=sourceIndex(col,position);
  widths[index]=Number.parseFloat(col.style.width)||124;
 }
 table.style.setProperty('--faculty-roster-table-width',
  facultyVisibleTableWidth(widths,state.hidden)+'px');
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
 const fullHeaders=[...table.querySelectorAll('thead th')].map((th,i)=>
  clean(th.dataset.fullHeading||headers[i]));
 const isFacultyColumns=table.matches('table.faculty-data-wall');
 const key=tableKey(table,index),s=stateFor(key,headers.length,isFacultyColumns);
 const originalWidths=[...table.querySelectorAll('colgroup col')].map(col=>col.style.width);
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
 const fields=headers.map((h,i)=>'<label class="ux-column-filter">'+safe(fullHeaders[i])+
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
  '<details class="ux-menu'+(isFacultyColumns?' ux-columns-menu':'')+'"><summary data-ux-columns>'+(isFacultyColumns?'Arrange / hide columns':'Columns')+'</summary><div class="ux-popover'+(isFacultyColumns?' ux-column-layout-popover':'')+'"><strong>'+(isFacultyColumns?'Arrange, size and hide':'Show columns')+'</strong>'+columns+'</div></details>'+
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
  const content=th.innerHTML,fullName=fullHeaders[i];
  th.innerHTML='<button type="button" class="ux-sort-button" data-ux-sort="'+i+
   '" aria-sort="none" title="'+safe(fullName)+'" aria-label="Sort by '+safe(fullName)+'">'+
   content+'</button>';
  if(isFacultyColumns&&i>0&&i<headers.length-1){
   th.insertAdjacentHTML('beforeend',
    '<button type="button" class="ux-column-grip" draggable="true" data-ux-drag="'+i+
    '" title="Drag to reorder '+safe(fullHeaders[i])+'" aria-label="Drag to reorder '+safe(fullHeaders[i])+'"></button>'+
    '<span class="ux-column-resize" role="separator" tabindex="0" aria-orientation="vertical"'+
    ' data-ux-resize="'+i+'" aria-label="Resize '+safe(fullHeaders[i])+': drag or use arrow keys"></span>');
  }
 });
 if(isFacultyColumns)arrangeFacultyColumns(table,s);
 // The cue lives OUTSIDE the scroller, so it remains reachable when a
 // teacher has navigated horizontally to the last evidence columns.
 const scrollContainer=isFacultyColumns?table.closest('.tablewrap.roster-desktop'):null;
 const gridNavigation=isFacultyColumns?installFacultyGridNavigation(table):null;
 let scrollHint=null;
 function updateLearnerJump(){
  const jump=scrollHint?.querySelector('.faculty-jump-select');
  if(!jump||!gridNavigation)return;
  const previous=jump.value;
  const learners=gridNavigation.visibleLearners();
  jump.replaceChildren();
  const placeholder=document.createElement('option');
  placeholder.value='';placeholder.textContent='Jump to learner…';
  jump.appendChild(placeholder);
  for(const learner of learners){
   const item=document.createElement('option');
   item.value=learner.id;item.textContent=learner.name;jump.appendChild(item);
  }
  jump.value=learners.some(x=>x.id===previous)?previous:'';
 }
 function updateScrollCue(){
  if(!scrollContainer||!scrollHint)return;
  const max=Math.max(0,scrollContainer.scrollWidth-scrollContainer.clientWidth);
  const x=scrollContainer.scrollLeft;
  scrollHint.hidden=false;
  const arrows=scrollHint.querySelector('.faculty-scroll-arrows');
  if(arrows)arrows.hidden=max<=8;
  const label=scrollHint.querySelector('.faculty-scroll-hint-label');
  if(label)label.hidden=max<=8;
  const left=scrollHint.querySelector('[data-faculty-scroll="left"]');
  const right=scrollHint.querySelector('[data-faculty-scroll="right"]');
  if(left)left.disabled=x<=3;
  if(right)right.disabled=x>=max-3;
  if(label)label.textContent=x<=3?'More evidence to the right':
   x>=max-3?'More evidence to the left':'Explore additional columns';
 }
 if(scrollContainer){
  scrollHint=document.createElement('div');
  scrollHint.className='faculty-scroll-hint';
  scrollHint.hidden=true;
  scrollHint.setAttribute('aria-label','Learner and horizontal class evidence navigation');
  scrollHint.innerHTML='<label class="faculty-jump-label" for="faculty-learner-jump">Jump to</label>'+
   '<select id="faculty-learner-jump" class="faculty-jump-select" aria-label="Jump to a learner in this class">'+
   '<option value="">Jump to learner…</option></select>'+
   '<details class="faculty-grid-help"><summary>Keyboard tips</summary>'+
   '<p>Tab into the learner grid. Use arrow keys to move between visible learner evidence cells, Home/End for a row and Ctrl+Home/End for the first/last learner. Press Enter to open a learner.</p></details>'+
   '<span id="faculty-roster-grid-help" class="sr-only">Learner grid: Tab enters; arrow keys move through results; Home and End navigate a row; Ctrl+Home and Ctrl+End jump to the beginning and end. Enter opens the selected result.</span>'+
   '<span class="faculty-scroll-hint-label">More evidence to the right</span>'+
   '<span class="faculty-scroll-arrows"><button type="button" data-faculty-scroll="left" aria-label="Scroll evidence columns left">←</button>'+
   '<button type="button" data-faculty-scroll="right" aria-label="Scroll evidence columns right">→</button></span>';
  scrollContainer.insertAdjacentElement('beforebegin',scrollHint);
  scrollHint.querySelector('.faculty-jump-select')?.addEventListener('change',event=>{
   if(event.target.value)gridNavigation?.focusLearner(event.target.value);
  });
  scrollContainer.addEventListener('scroll',updateScrollCue,{passive:true});
  scrollHint.addEventListener('click',event=>{
   const button=event.target.closest('button[data-faculty-scroll]');
   if(!button||button.disabled)return;
   const direction=button.dataset.facultyScroll==='left'?-1:1;
   const amount=direction*Math.max(240,Math.round(scrollContainer.clientWidth*.7));
   const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   if(typeof scrollContainer.scrollBy==='function')
    scrollContainer.scrollBy({left:amount,behavior:reduced?'auto':'smooth'});
   else scrollContainer.scrollLeft+=amount;
  });
  if(typeof ResizeObserver==='function'){
   const observer=new ResizeObserver(updateScrollCue);
   observer.observe(scrollContainer);observer.observe(table);
  }
  // Shared hover/focus context, even after teacher-driven column reordering.
  let activeOrigin=null;
  const highlight=origin=>{
   if(origin===activeOrigin)return;
   for(const cell of table.querySelectorAll('[data-faculty-active-column]'))
    cell.removeAttribute('data-faculty-active-column');
   activeOrigin=origin;
   if(origin===null||origin===undefined)return;
   for(const cell of table.querySelectorAll(
    'thead th[data-ux-origin="'+origin+'"],tbody td[data-ux-origin="'+origin+'"]'))
    cell.setAttribute('data-faculty-active-column','');
  };
  table.addEventListener('pointerover',event=>{
   const cell=event.target.closest?.('thead th[data-ux-origin],tbody td[data-ux-origin]');
   if(cell&&table.contains(cell))highlight(cell.dataset.uxOrigin);
  });
  table.addEventListener('pointerleave',()=>highlight(null));
  table.addEventListener('focusin',event=>{
   const cell=event.target.closest?.('thead th[data-ux-origin],tbody td[data-ux-origin]');
   if(cell)highlight(cell.dataset.uxOrigin);
  });
  table.addEventListener('focusout',event=>{
   if(!table.contains(event.relatedTarget))highlight(null);
  });
 }
 const render=()=>{
  apply(table,s);
  if(isFacultyColumns){
   refreshFacultyPresentation(table,s);
   gridNavigation?.refresh();
   updateLearnerJump();
   updateScrollCue();
  }
 };
 function syncColumnList(){
  if(!isFacultyColumns)return;
  const list=panel.querySelector('[data-ux-column-list]');
  if(!list)return;
  const mid=s.columnOrder.filter(i=>i>0&&i<headers.length-1);
  list.innerHTML=s.columnOrder.map(i=>{
   const movable=i>0&&i<headers.length-1;
   const at=mid.indexOf(i);
   const size=widthPreset(s.widths[i]);
   const choice=movable?'<select data-ux-column-width="'+i+'" aria-label="Width of '+safe(fullHeaders[i])+'">'+
    '<option value="default"'+(size==='default'?' selected':'')+'>Default</option>'+
    Object.entries(COLUMN_WIDTHS).map(([name,n])=>
     '<option value="'+name+'"'+(size===name?' selected':'')+'>'+name[0].toUpperCase()+name.slice(1)+' ('+n+'px)</option>').join('')+
    (size==='custom'?'<option value="custom" selected>Custom</option>':'')+'</select>':'';
   return '<div class="ux-column-config" data-ux-column-row="'+i+'">'+
    '<label class="ux-column-row"><input type="checkbox" data-ux-column="'+i+'"'+
     (!s.hidden.includes(i)?' checked':'')+(i===0?' disabled':'')+
     '><span>'+safe(fullHeaders[i])+'</span></label>'+
    (movable?'<div class="ux-column-move"><button type="button" data-ux-move-left="'+i+'"'+
     (at===0?' disabled':'')+' aria-label="Move '+safe(fullHeaders[i])+' left">←</button>'+
     '<button type="button" data-ux-move-right="'+i+'"'+
     (at===mid.length-1?' disabled':'')+' aria-label="Move '+safe(fullHeaders[i])+' right">→</button>'+
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
  for(const col of table.querySelectorAll('colgroup col')){
   const index=sourceIndex(col,0);
   col.style.width=originalWidths[index]||'';
  }
  for(const th of table.querySelectorAll('thead th')){
   th.style.width='';th.style.minWidth='';th.style.maxWidth='';
  }
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
   render();recordLayout();
  }else if(e.target.matches('[data-ux-column-width]')&&isFacultyColumns){
   const i=Number(e.target.dataset.uxColumnWidth);
   const preset=e.target.value;
   if(preset==='default')delete s.widths[i];
   else if(Object.hasOwn(COLUMN_WIDTHS,preset))s.widths[i]=COLUMN_WIDTHS[preset];
   else return;
   updateArrangement();
  }else if(e.target.matches('[data-ux-view]')){
   const name=e.target.value;
   if(!name||!saved[key]?.[name])return;
   Object.assign(s,parsePreferences(JSON.stringify(saved[key][name])));
   s.hidden=(Array.isArray(s.hidden)?s.hidden:[]).filter(i=>Number.isInteger(i)&&i>0&&i<headers.length);
   s.fields=(s.fields&&typeof s.fields==='object')?s.fields:{};
   s.order=Number.isInteger(s.order)&&s.order<headers.length?s.order:null;
   if(isFacultyColumns){
    s.columnOrder=normaliseColumnOrder(s.columnOrder,headers.length);
    s.widths=normaliseColumnWidths(s.widths,headers.length);
   }
   panel.querySelector('[data-ux-search]').value=s.search||'';
   for(const el of panel.querySelectorAll('[data-ux-field]'))el.value=s.fields[el.dataset.uxField]||'';
   for(const el of panel.querySelectorAll('[data-ux-column]'))el.checked=!s.hidden.includes(Number(el.dataset.uxColumn));
   panel.querySelector('[data-ux-name]').value=name;
   if(isFacultyColumns)updateArrangement();else render();
  }
 });
 if(isFacultyColumns){
  const head=table.querySelector('thead');
  let dragging=null;
  const clearDrag=()=>{
   dragging=null;
   for(const th of head.querySelectorAll('.ux-column-drag-over,.ux-column-drag-source'))
    th.classList.remove('ux-column-drag-over','ux-column-drag-source');
  };
  head.addEventListener('dragstart',e=>{
   const grip=e.target.closest('[data-ux-drag]');
   if(!grip)return;
   dragging=Number(grip.dataset.uxDrag);
   grip.closest('th')?.classList.add('ux-column-drag-source');
   if(e.dataTransfer){
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain',String(dragging));
   }
  });
  head.addEventListener('dragover',e=>{
   if(dragging===null)return;
   const th=e.target.closest('th[data-ux-origin]');
   if(!th)return;
   const target=Number(th.dataset.uxOrigin);
   if(target<=0||target>=headers.length-1||target===dragging)return;
   e.preventDefault();
   if(e.dataTransfer)e.dataTransfer.dropEffect='move';
   for(const current of head.querySelectorAll('.ux-column-drag-over'))
    current.classList.remove('ux-column-drag-over');
   th.classList.add('ux-column-drag-over');
  });
  head.addEventListener('drop',e=>{
   if(dragging===null)return;
   const th=e.target.closest('th[data-ux-origin]');
   if(!th){clearDrag();return}
   const target=Number(th.dataset.uxOrigin);
   if(target<=0||target>=headers.length-1||target===dragging){clearDrag();return}
   e.preventDefault();
   const rect=th.getBoundingClientRect();
   const after=e.clientX>rect.left+rect.width/2;
   s.columnOrder=moveColumn(s.columnOrder,dragging,target,after);
   clearDrag();updateArrangement();
  });
  head.addEventListener('dragend',clearDrag);
  head.addEventListener('pointerdown',e=>{
   const resizer=e.target.closest('[data-ux-resize]');
   if(!resizer||e.button!==0)return;
   e.preventDefault();
   const id=Number(resizer.dataset.uxResize);
   const th=resizer.closest('th');
   const startX=e.clientX;
   const width=th?.getBoundingClientRect()?.width||COLUMN_WIDTHS.standard;
   const start=Number.isFinite(Number(s.widths[id]))?s.widths[id]:width;
   document.documentElement.classList.add('ux-resizing-columns');
   const move=ev=>{
    s.widths[id]=clampColumnWidth(start+ev.clientX-startX);
    updateColumnWidth(table,id,s.widths[id]);
   };
   const finish=()=>{
    globalThis.removeEventListener('pointermove',move);
    globalThis.removeEventListener('pointerup',finish);
    globalThis.removeEventListener('pointercancel',finish);
    document.documentElement.classList.remove('ux-resizing-columns');
    updateArrangement();
   };
   globalThis.addEventListener('pointermove',move);
   globalThis.addEventListener('pointerup',finish);
   globalThis.addEventListener('pointercancel',finish);
  });
  head.addEventListener('keydown',e=>{
   const resizer=e.target.closest('[data-ux-resize]');
   if(!resizer)return;
   if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;
   e.preventDefault();
   const id=Number(resizer.dataset.uxResize);
   if(e.key==='Home')delete s.widths[id];
   else {
    const original=resizer.closest('th')?.getBoundingClientRect()?.width||COLUMN_WIDTHS.standard;
    const delta=(e.shiftKey?24:8)*(e.key==='ArrowRight'?1:-1);
    s.widths[id]=clampColumnWidth((s.widths[id]||original)+delta);
   }
   updateArrangement();table.querySelector('[data-ux-resize="'+id+'"]')?.focus();
  });
  head.addEventListener('dblclick',e=>{
   const resizer=e.target.closest('[data-ux-resize]');
   if(!resizer)return;
   delete s.widths[Number(resizer.dataset.uxResize)];
   updateArrangement();
  });
 }
 table.querySelector('thead').addEventListener('click',e=>{
  const grip=e.target.closest('[data-ux-drag]');
  if(grip&&isFacultyColumns){
   // Clicking the move handle offers an accessible alternative to dragging.
   const controls=panel.closest('.ux-faculty-table-controls');
   if(controls)controls.open=true;
   const summary=panel.querySelector('[data-ux-columns]');
   if(summary){summary.closest('details').open=true;summary.focus({preventScroll:true})}
   return;
  }
  if(e.target.closest('[data-ux-resize]'))return;
  const btn=e.target.closest('[data-ux-sort]');
  if(!btn)return;
  const i=Number(btn.dataset.uxSort);
  s.desc=s.order===i?!s.desc:false;s.order=i;render();
 });
 panel.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  if(isFacultyColumns&&(btn.hasAttribute('data-ux-move-left')||btn.hasAttribute('data-ux-move-right'))){
   const left=btn.hasAttribute('data-ux-move-left');
   const id=Number(left?btn.dataset.uxMoveLeft:btn.dataset.uxMoveRight);
   const position=s.columnOrder.indexOf(id);
   const target=s.columnOrder[position+(left?-1:1)];
   s.columnOrder=moveColumn(s.columnOrder,id,target,!left);
   updateArrangement();
   panel.querySelector('[data-ux-column-row="'+id+'"] button[data-ux-move-'+(left?'left':'right')+']')?.focus();
  }else if(isFacultyColumns&&btn.hasAttribute('data-ux-restore-columns')){
   s.columnOrder=normaliseColumnOrder(null,headers.length);s.widths={};s.hidden=[];
   updateArrangement();
   panel.querySelector('[data-ux-restore-columns]')?.focus();
  }else if(btn.hasAttribute('data-ux-clear')){
   Object.assign(s,{search:'',fields:{},hidden:[],order:null,desc:false,
    ...(isFacultyColumns?{columnOrder:normaliseColumnOrder(null,headers.length),widths:{}}:{})});
   panel.querySelector('[data-ux-search]').value='';
   for(const input of panel.querySelectorAll('[data-ux-field]'))input.value='';
   for(const input of panel.querySelectorAll('[data-ux-column]'))input.checked=true;
   if(isFacultyColumns)updateArrangement();else render();
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
   const cols=(isFacultyColumns?s.columnOrder:headers.map((_,i)=>i)).filter(i=>!s.hidden.includes(i));
   const body=[...table.querySelectorAll('tbody tr')].filter(tr=>!tr.hidden);
   const csv=exportCsv(cols.map(i=>fullHeaders[i]),body.map(tr=>cols.map(i=>label(sourceCell(tr,i)))));
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
 const info=r==='faculty'?'Faculty preview: school-year labels are shown for issued reports; MAP, IXL and check-ins have distinct scales.':
  r==='leader'?'All individual learner records, support cohorts and experience indices in this view are fictional; dates and eligibility vary by assessment.':
  r==='sss'?'Fictional learner support demonstration only. Specialist records are not securely shared or connected to an authoritative source.':
  'Student preview: no live records. Historical issued grades are not current-year results.';
 strip.innerHTML='<strong>Evidence context</strong><span>As of 8 Oct 2026</span>'+
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
root?.addEventListener('click',e=>{
 if(e.target.closest('[data-role]'))dialog?.open&&dialog.close();
 const arrange=e.target.closest('[data-ux-customize-columns]');
 if(!arrange)return;
 const roster=arrange.closest('.roster-daily');
 const controls=roster?.querySelector('.ux-faculty-table-controls');
 if(!controls)return;
 controls.open=true;
 const summary=controls.querySelector('[data-ux-columns]');
 if(summary){
  summary.closest('details').open=true;
  summary.focus({preventScroll:true});
  controls.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 }
});
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
  e.preventDefault();openFinder();
 }else if(e.key==='Escape'&&dialog?.open)dialog.close();
});
const observer=new MutationObserver(enhance);
if(root)observer.observe(root,{childList:true});
enhance();
