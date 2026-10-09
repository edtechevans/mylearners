/**
 * AISG My Learners — first release presentation.
 * A calm, read-only view of classes and student essentials.
 * All learner records, groups, assessments, attendance, support and photos are fictional.
 * Real faculty names have fictional teaching-group assignments.
 */
import {portrait} from './portraits.mjs';
import {todayStatus,DEMO_DAY} from './pulse-data.mjs';
import {latestMapGrowth,mapGrowthSummary,growthFormat} from './map-growth.mjs';
import {gradeNumber} from './data.mjs';
import {demoTagsForStudent,hasDemoTag,TAG_IDS,SUPPORT_TAGS} from './learner-tags.mjs';
import {supportTagChips} from './learner-tags-ui.mjs';
import {icon,esc,prettyDate,shortGrade,stageBadge,sectionTitle,emptyState} from './v2-ui.mjs';

const studentPhoto=s=>'<img loading="lazy" class="v2-avatar" src="'+portrait(s.portraitSeed)+'" alt="Illustrated portrait of fictional learner '+esc(s.name)+'">';
const asClassName=c=>c.name||shortGrade(c.grade)+' · '+c.section;
const yearLabels=['Mathematics','Reading','Language Usage'];
function mapCell(ctx,s){
 const g=latestMapGrowth(ctx.data.map[s.id]||[],'Mathematics');
 if(g.status==='comparable')return '<span class="launch-map-change"><b>'+esc(growthFormat(g.actual))+' pts growth</b><small>vs '+esc(growthFormat(g.projected))+' projected</small></span>';
 if(g.status==='missing-current')return '<span class="v2-muted">No Fall result</span>';
 if(g.status==='no-comparison')return '<span class="v2-muted">No previous test</span>';
 return '<span class="v2-muted">Not assessed</span>';
}
function latestAssessment(ctx,s){
 const rows=ctx.data.assessments[s.id]||[];
 return rows.find(a=>a.status==='Published')||null;
}
function classroomSummary(ctx,c){
 const ss=c.studentIds.map(id=>ctx.data.userIndex.get(id));
 const statuses=ss.map(s=>todayStatus(ctx.data,s.id));
 const recorded=statuses.filter(x=>x.status!=='not-recorded').length;
 const present=statuses.filter(x=>x.status==='present'||x.status==='late').length;
 const absence=statuses.filter(x=>x.status==='absent').length;
 const late=statuses.filter(x=>x.status==='late').length;
 const support=ss.filter(s=>demoTagsForStudent(s).length>0).length;
 const map=mapGrowthSummary(c.studentIds,ctx.data.map,['Mathematics']);
 return {recorded,present,absence,late,support,map,students:ss};
}
function classCard(ctx,c){
 const summary=classroomSummary(ctx,c);
 const n=gradeNumber(c.grade);
 return '<button type="button" class="launch-class-card" data-open-class="'+esc(c.id)+'">'+
 '<span class="launch-card-top"><span class="launch-class-icon">'+icon(n<=0?'book':n<=5?'users':'layers',21)+'</span><span class="launch-class-arrow">'+icon('arrow',18)+'</span></span>'+
 '<span class="launch-class-name">'+esc(asClassName(c))+'</span>'+
 '<span class="launch-class-sub">'+esc(c.campus)+' Campus · '+c.studentIds.length+' learners</span>'+
 '<span class="launch-card-divider"></span>'+
 '<span class="launch-card-detail">'+icon('calendar',15)+' Attendance recorded: '+summary.recorded+'/'+c.studentIds.length+'</span>'+
 (summary.map.comparable>0?'<span class="launch-card-detail">'+icon('chart',15)+' MAP Math growth: '+summary.map.met+'/'+summary.map.comparable+' met projection</span>':
 '<span class="launch-card-detail">'+icon('book',15)+' Learning evidence and profiles available</span>')+
 '<span class="launch-card-link">Open class '+icon('chevron',15)+'</span></button>';
}
export function renderLaunchHome(ctx){
 const cs=ctx.classes;
 const ss=ctx.students;
 const total=cs.reduce((sum,c)=>sum+classroomSummary(ctx,c).recorded,0);
 const first=cs[0];
 return sectionTitle('AISG | MY LEARNERS','Home','Your classes and essential student information, all in one place.',
   '<span class="v2-day-pill">'+icon('calendar',14)+' Fictional records · '+prettyDate(DEMO_DAY)+'</span>')+
 '<section class="launch-hero"><div class="launch-hero-copy"><span class="launch-eyebrow">YOUR TEACHING SPACE</span>'+
 '<h2>Find what you need. Get back to teaching.</h2>'+
 '<p>Open a class, find a learner, or explore assessment information and MAP growth.</p>'+
 '<div class="launch-hero-links"><button class="v2-button light" data-nav="class">'+icon('layers',16)+' My Classes '+icon('arrow',15)+'</button>'+
 '<button class="launch-hero-secondary" data-nav="learners">'+icon('search',16)+' Find a learner</button></div></div>'+
 '<div class="launch-hero-mark" aria-hidden="true"><span>A</span><span>I</span><span>S</span><span>G</span></div></section>'+
 '<div class="launch-summary-row">'+
 '<div><span>'+icon('layers',17)+' Teaching groups</span><strong>'+cs.length+'</strong></div>'+
 '<div><span>'+icon('users',17)+' Learner profiles</span><strong>'+ss.length+'</strong></div>'+
 '<div><span>'+icon('calendar',17)+' Attendance entries</span><strong>'+total+' <small>/ '+ss.length+'</small></strong></div>'+
 '</div>'+
 '<div class="launch-section-heading"><div><span class="v2-eyebrow">QUICK ACCESS</span><h2>My Classes</h2>'+
 '<p>Select a teaching group to see its roster, assessments, attendance and learning guidance.</p></div>'+
 '<button class="v2-button ghost" data-nav="growth">'+icon('chart',16)+' MAP Growth</button></div>'+
 (cs.length?'<div class="launch-class-grid">'+cs.map(c=>classCard(ctx,c)).join('')+'</div>':
 emptyState('No classes in this demonstration view','Select another AISG faculty demo persona.'))+
 '<div class="launch-home-foot">'+icon('info',16)+
 '<span>Demo only: actual faculty names are used, but class assignments, student profiles, photos and results are entirely fictional. No school systems are connected.</span></div>';
}
const filterLabels={all:'All learners',attendance:'Absent or late',support:'Any support tag'};
function filterRoster(ctx,c){
 const q=(ctx.state.rosterQuery||'').trim().toLowerCase(),filter=ctx.state.rosterFilter;
 return c.studentIds.map(id=>ctx.data.userIndex.get(id)).filter(s=>{
  const matches=!q||s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q);
  const attendance=todayStatus(ctx.data,s.id);
  return matches&&(filter==='all'||filter==='attendance'&&['absent','late'].includes(attendance.status)||
   filter==='support'&&demoTagsForStudent(s).length>0||TAG_IDS.includes(filter)&&hasDemoTag(s,filter));
 });
}
export function renderLaunchClass(ctx){
 const c=ctx.currentClass||ctx.classes[0];
 if(!c)return emptyState('No assigned teaching group','Select another demo teacher to explore the class roster.');
 const sm=classroomSummary(ctx,c);
 const rows=filterRoster(ctx,c);
 const back=ctx.state.classOrigin?.teacherId===ctx.teacher.id&&ctx.state.classOrigin.page==='growth'?
 '<button class="v2-back" data-return-class="1">'+icon('back',15)+' Back to MAP Growth</button>':'';
 return back+sectionTitle('YOUR TEACHING GROUPS','My Classes','A clear view of learners, recent academic evidence and essential information.')+
 '<div class="v2-class-toolbar launch-class-toolbar"><label>SELECT A CLASS<select id="v2-class-select">'+ctx.classes.map(x=>
 '<option value="'+esc(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+esc(asClassName(x))+'</option>').join('')+
 '</select></label><span class="launch-toolbar-spacer"></span>'+
 '<button class="v2-button ghost" data-nav="growth">'+icon('chart',16)+' MAP Growth</button></div>'+
 '<div class="launch-class-heading"><div><span class="v2-eyebrow">'+esc(c.campus.toUpperCase())+' CAMPUS</span>'+
 '<h2>'+esc(asClassName(c))+'</h2><p>'+c.studentIds.length+' fictional learners · 2026–27 School Year</p></div>'+
 '<span class="launch-as-of">'+icon('clock',14)+' Attendance as of '+prettyDate(DEMO_DAY)+'</span></div>'+
 '<div class="launch-class-stats">'+
 '<div><strong>'+sm.present+' <span>/ '+c.studentIds.length+'</span></strong><small>Present or late</small></div>'+
 '<div><strong>'+sm.absence+'</strong><small>Absent</small></div>'+
 '<div><strong>'+sm.late+'</strong><small>Late arrivals</small></div>'+
 '<div><strong>'+sm.support+'</strong><small>With support tags</small></div></div>'+
 '<section class="v2-card v2-card-roomy launch-roster"><div class="v2-card-head"><div><span class="v2-eyebrow">CLASS ROSTER</span>'+
 '<h2>Students & learning information</h2><p>Support tags are fictional examples. Select one to view practical classroom guidance.</p></div>'+
 '<span class="v2-mini-count">'+rows.length+' / '+c.studentIds.length+'</span></div>'+
 '<div class="v2-class-filters launch-roster-filters"><div class="v2-filter-options">'+Object.entries(filterLabels).map(([id,label])=>
 '<button class="v2-filter-chip '+(ctx.state.rosterFilter===id?'active':'')+'" data-roster-filter="'+id+
 '" aria-pressed="'+(ctx.state.rosterFilter===id)+'">'+label+'</button>').join('')+'</div>'+
 '<label class="launch-support-select">FILTER BY TAG <select id="v2-support-filter" aria-label="Filter learners by support tag">'+
 '<option value="all" '+(!TAG_IDS.includes(ctx.state.rosterFilter)?'selected':'')+'>All tag types</option>'+
 SUPPORT_TAGS.map(tag=>'<option value="'+esc(tag.id)+'" '+(ctx.state.rosterFilter===tag.id?'selected':'')+'>'+esc(tag.label)+'</option>').join('')+'</select></label>'+
 '<label class="v2-roster-search">'+icon('search',16)+
 '<input id="v2-roster-search" value="'+esc(ctx.state.rosterQuery||'')+'" placeholder="Search this class..." aria-label="Search learners in this class"></label></div>'+
 '<div class="v2-table-scroll"><table class="v2-table launch-roster-table"><caption class="v2-visually-hidden">Class roster with daily attendance, published assessment, Mathematics MAP growth and fictional support tags</caption>'+
 '<thead><tr><th scope="col">Learner</th><th scope="col">Attendance</th><th scope="col">Recent assessment</th>'+
 '<th scope="col">MAP Mathematics growth</th><th scope="col">Support tags</th><th scope="col"></th></tr></thead><tbody>'+
 rows.map(s=>{
  const att=todayStatus(ctx.data,s.id);
  const last=latestAssessment(ctx,s);
  return '<tr><td><button class="v2-student-name" data-open-student="'+esc(s.id)+'">'+studentPhoto(s)+
  '<span><strong>'+esc(s.name)+'</strong><small>'+esc(s.id)+'</small></span></button></td>'+
  '<td>'+stageBadge(att.status)+'</td>'+
  '<td>'+(last?'<span class="launch-assessment"><b>'+esc(last.subject)+'</b><small>'+esc(last.title)+' · '+esc(last.outcome)+'</small></span>':
     '<span class="v2-muted">No published result</span>')+'</td>'+
  '<td>'+mapCell(ctx,s)+'</td>'+
  '<td>'+supportTagChips(s,'roster')+'</td>'+
  '<td><button class="v2-text-link" data-open-student="'+esc(s.id)+'">Profile '+icon('chevron',14)+'</button></td></tr>';
 }).join('')+'</tbody></table>'+
 (!rows.length?emptyState('No matching learners','Try a different search or filter.'):'')+
 '</div><div class="v2-card-foot"><span class="v2-provenance">'+icon('info',13)+
 ' All student support tags, assessments and attendance are synthetic demonstration records, never real confidential data.</span></div></section>';
}
