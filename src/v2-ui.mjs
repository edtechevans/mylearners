/** Shared AISG My Learners 2.0 display primitives. */
const shapes={
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/>',
  compass:'<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.3 6.1-6.1 2.3 2.3-6.1z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2"/>',
  flag:'<path d="M5 21V4m0 0c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  spark:'<path d="M12 3 9 9l-6 3 6 3 3 6 3-6 6-3-6-3z"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  layers:'<rect x="3" y="3" width="18" height="6" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2m0 4v-4h-4"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 20h16"/>',
  moon:'<path d="M20 15.5A8.3 8.3 0 0 1 8.5 4a8.3 8.3 0 1 0 11.5 11.5z"/>',
  note:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  question:'<circle cx="12" cy="12" r="10"/><path d="M9.3 9a3 3 0 1 1 4.9 2.3c-1 .7-2.2 1.2-2.2 2.7M12 17h.01"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 12h6M9 16h4"/>',
  trending:'<path d="M3 17 9 11l4 4 8-8M15 7h6v6"/>',
  activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  share:'<path d="M14 3h7v7m0-7L10 14"/><path d="M20 13v7H4V4h7"/>'
};
export function icon(name,size=18){
 return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[name]||shapes.info)+'</svg>';
}
export const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const prettyDate=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export const smallDate=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
export const initials=name=>String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w.charAt(0).toUpperCase()).join('');
export const shortGrade=g=>g.startsWith('G')?'Grade '+g.slice(1):g==='K'?'Kindergarten':g;
export function stageBadge(status){
 const labels={present:'Present',absent:'Absent',late:'Late',missing:'Missing',submitted:'Submitted',pending:'Pending',
   revisit:'Revisit',developing:'Developing',secure:'Secure',extend:'Extend',
   open:'In progress',completed:'Reviewed'};
 const key=String(status||'').toLowerCase().replaceAll(' ','-');
 return '<span class="v2-status '+esc(key)+'">'+esc(labels[key]||status||'Not recorded')+'</span>';
}
export function stat(label,value,detail,kind='neutral'){
 return '<article class="v2-stat '+esc(kind)+'"><span class="v2-stat-label">'+esc(label)+'</span><strong>'+esc(value)+'</strong><span class="v2-stat-foot">'+esc(detail)+'</span></article>';
}
export const sectionTitle=(kicker,title,desc='',other='')=>
 '<div class="v2-section-head"><div><span class="v2-kicker">'+esc(kicker)+'</span><h2>'+esc(title)+'</h2>'+
 (desc?'<p>'+esc(desc)+'</p>':'')+'</div>'+other+'</div>';
export const provenance=label=>'<span class="v2-provenance">'+icon('info',12)+' '+esc(label)+'</span>';
export const emptyState=(title,copy)=>'<div class="v2-empty">'+icon('info',26)+'<strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p></div>';
