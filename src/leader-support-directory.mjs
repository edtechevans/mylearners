/**
 * Leaders-only demonstration directory.
 * All records, support labels and assignments are synthetic. The public role
 * selector is NOT a security boundary; real deployment requires server-side
 * identity, authorisation and assignment-scoped data access.
 */
import {GRADES} from './data.mjs';
import {matchesSupportStatus,SUPPORT_STATUS_FILTERS,supportStatusCounts,supportStatusForStudent} from './learner-support-status.mjs';
import {supportStatusBadges} from './learner-support-status-ui.mjs?v=20261112supporttips1';
import {esc} from './v2-ui.mjs';

const safe=v=>esc(String(v??''));
export const LEADER_DIRECTORY_INITIAL=Object.freeze({
 division:'All',grade:'All',status:'has-support',query:'',expanded:false
});
export const LEADER_DIRECTORY_PAGE_SIZE=30;
export const leaderDirectoryOptions=Object.freeze(SUPPORT_STATUS_FILTERS.map(([id,label])=>[id,label]));
const rank=grade=>{const x=GRADES.indexOf(grade);return x<0?GRADES.length:x};
const sorting=(a,b)=>rank(a.grade)-rank(b.grade)||
 String(a.last||a.name).localeCompare(String(b.last||b.name))||
 String(a.first||'').localeCompare(String(b.first||''))||a.id.localeCompare(b.id);

export function leaderSupportDirectoryModel(students,filters={}){
 const q=String(filters.query||'').trim().toLocaleLowerCase();
 const division=['All','Elementary','Secondary'].includes(filters.division)?filters.division:'All';
 const eligible=(students||[]).filter(s=>supportStatusForStudent(s));
 const divisional=eligible.filter(s=>division==='All'||s.division===division);
 const grades=GRADES.filter(g=>divisional.some(s=>s.grade===g));
 const grade=grades.includes(filters.grade)?filters.grade:'All';
 const status=leaderDirectoryOptions.some(([id])=>id===filters.status)?filters.status:'has-support';
 const matches=divisional.filter(s=>(grade==='All'||s.grade===grade)&&
  matchesSupportStatus(s,status)&&(!q||[s.name,s.first,s.last,s.grade,s.classId].some(v=>String(v||'').toLocaleLowerCase().includes(q)))).sort(sorting);
 const expanded=filters.expanded===true;
 return {division,grade,status,query:q,grades,matches,
  shown:expanded?matches:matches.slice(0,LEADER_DIRECTORY_PAGE_SIZE),
  total:matches.length,available:divisional.length,expanded,
  counts:supportStatusCounts(matches)};
}
const choice=(value,label,chosen)=>'<option value="'+safe(value)+'"'+(value===chosen?' selected':'')+'>'+safe(label)+'</option>';
const field=(name,label,html)=>'<label class="leader-dir-field"><span>'+safe(label)+'</span>'+html+'</label>';
export function renderLeaderSupportDirectory({students=[],filters={},showDivision=true}={}){
 const model=leaderSupportDirectoryModel(students,filters);
 const divisions=[['All','All divisions'],['Elementary','Elementary'],['Secondary','Secondary']];
 const gradeChoices=[['All','All grades'],...model.grades.map(g=>[g,g==='K'?'Kindergarten':g])];
 const selection=leaderDirectoryOptions;
 const option=(items,selected)=>items.map(([id,label])=>choice(id,label,selected)).join('');
 const search=field('query','Find a learner',
  '<input type="search" data-leader-directory-search aria-label="Search support directory by learner name or class" value="'+safe(filters.query||'')+
  '" placeholder="Search student or class…" autocomplete="off">');
 const divisionControl=showDivision?field('division','Division','<select data-leader-directory-filter="division" aria-label="Support directory division">'+
  option(divisions,model.division)+'</select>'):'';
 const gradeControl=field('grade','Grade','<select data-leader-directory-filter="grade" aria-label="Support directory grade">'+
  option(gradeChoices,model.grade)+'</select>');
 const statusControl=field('status','Support information','<select data-leader-directory-filter="status" aria-label="Support directory status">'+
  option(selection,model.status)+'</select>');
 const count=model.counts;
 const kpis=[
  ['Matching learners',model.total],['Learning Support',count.learning],
  ['Active EAL',count.ealActive],['EAL monitoring',count.ealMonitoring],
  ['SST monitoring',count.sstMonitoring],['Intervention',count.intervention]
 ];
 const counts='<div class="leader-directory-kpis">'+kpis.map(([label,n])=>
  '<div class="leader-directory-kpi"><span>'+safe(label)+'</span><strong>'+n+'</strong></div>').join('')+'</div>';
 const rows=model.shown.map(s=>{
  const status=supportStatusForStudent(s);
  return '<tr><th scope="row"><button type="button" class="leader-directory-name" data-leader-directory-student="'+safe(s.id)+
   '" aria-label="Open learner evidence for '+safe(s.name)+'">'+safe(s.name)+'</button></th>'+
   '<td>'+safe(s.grade)+'</td><td>'+safe(s.classId)+'</td>'+
   '<td><div class="leader-directory-tags">'+supportStatusBadges(s,{compact:true})+'</div></td>'+
   '<td><button type="button" class="leader-directory-open" data-leader-directory-student="'+safe(s.id)+
   '" aria-label="Review '+safe(s.name)+' profile">View profile <span aria-hidden="true">→</span></button></td></tr>';
 }).join('');
 const results=model.total?'<div class="leader-directory-table-wrap"><table class="leader-directory-table">'+
  '<thead><tr><th scope="col">Student</th><th scope="col">Grade</th><th scope="col">Class</th>'+
  '<th scope="col">Support information</th><th scope="col">Profile</th></tr></thead>'+
  '<tbody>'+rows+'</tbody></table></div>':
  '<div class="leader-directory-empty">No students match these filters. Try a different grade, support status or name.</div>';
 const remainder=model.total>LEADER_DIRECTORY_PAGE_SIZE?
  '<button type="button" data-leader-directory-expand class="leader-directory-expand" aria-expanded="'+model.expanded+'">'+
  (model.expanded?'Show first '+LEADER_DIRECTORY_PAGE_SIZE+' students':
    'Show all '+model.total+' matching students')+'</button>':'';
 return '<section class="leader-support-directory" id="leader-support-directory" aria-labelledby="leader-support-directory-title">'+
  '<div class="leader-directory-heading"><div><span class="leader-directory-kicker">LEADERS · STUDENT SUPPORT</span>'+
  '<h2 id="leader-support-directory-title">Support Student Directory</h2>'+
  '<p>Find learners by grade, Learning Support, EAL or SST reference. Select a student to review their academic and assessment context.</p></div>'+
  '<span class="leader-directory-demo">Demonstration data</span></div>'+
  '<div class="leader-directory-controls">'+divisionControl+gradeControl+statusControl+search+'</div>'+
  '<div class="leader-directory-count-line"><span>Showing '+model.shown.length+' of '+model.total+
  ' matching learners</span><button type="button" data-leader-directory-reset>Clear filters</button></div>'+
  counts+results+remainder+
  '<p class="leader-directory-footnote">All learner names, support statuses and associations are fictional. EAL is a language-development reference, not a learning difficulty. This public demo does not contain genuine student support records. Production access requires school-approved SSO and server-enforced role and student-level permissions.</p>'+
  '</section>';
}
