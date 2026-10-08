/** AISG My Learners 2.0 pages.
 * Renders entirely fictional school-day data. Only names/PLCs are drawn from
 * the working faculty directory, and those class links remain simulated.
 */
import {attendanceSummary, gradeNumber, formatPct} from './data.mjs';
import {portrait} from './portraits.mjs';
import {latestMapGrowth,mapGrowthSummary,growthFormat} from './map-growth.mjs';
import {renderGrowthProfile} from './map-growth-ui.mjs';
import {DEMO_DAY,DAILY_PROVENANCE,SKILL_STATES,gradeBand,skillsForGrade,studentTimeline,
 pulseForClass,teacherSchedule,classInsights,flexibleGroups,classRecentWork,attendanceTrend} from './pulse-data.mjs';
import {actionCounts,ACTION_STAGE_LABELS,readGroupOverrides} from './pulse-actions.mjs';
import {icon,esc,prettyDate,smallDate,shortGrade,stat,stageBadge,sectionTitle,provenance,emptyState} from './v2-ui.mjs';

const letter=(x)=>String(x||'').slice(0,1);
const growthLabel=g=>g.status==='comparable'?
 growthFormat(g.actual)+' pts':'Not comparable';
const shortName=s=>esc(s.preferred||s.first)+' '+esc(s.last);
const studentImg=(s,size='normal')=>'<img loading="lazy" class="v2-avatar '+(size==='large'?'large':'')+'" src="'+portrait(s.portraitSeed)+'" alt="Fictional illustrated portrait of '+esc(s.name)+'"/>';
const pill=(v,label)=>'<span class="v2-tiny">'+esc(v)+' <span>'+esc(label)+'</span></span>';
const actionBtn=(c,text='Record response',studentId='',evidence='Teacher reflection')=>
 '<button class="v2-button secondary" data-create-action="'+esc(c)+'" data-action-student="'+esc(studentId)+'" data-action-evidence="'+esc(evidence)+'">'+icon('plus',15)+' '+esc(text)+'</button>';

export function renderToday(ctx){
 const {data,pulse,teacher,classes,actions}=ctx;
 const schedule=teacherSchedule(data,teacher);
 const next=ctx.currentClass||schedule.nextLesson||classes[0];
 if(!next)return emptyState('No demo classes','Select another demonstration teacher.');
 const cp=pulseForClass(data,pulse,next);
 const insights=classInsights(cp);
 const counts=actionCounts(actions);
 const other=classes.slice(0,5);
 const insightMarkup=insights.slice(0,4).map((s,i)=>
 '<article class="v2-signal"><span class="v2-signal-icon '+(s.type==='learning'?'teal':s.type==='completion'?'amber':'blue')+'">'+icon(s.type==='participation'?'calendar':s.type==='completion'?'clipboard':s.type==='challenge'?'spark':'chart')+'</span>'+
 '<div><span class="v2-signal-label">'+esc(s.type.toUpperCase())+' · '+esc(s.updated)+'</span><h3>'+esc(s.title)+'</h3><p>'+esc(s.description)+'</p>'+
 '<div class="v2-signal-actions"><button class="v2-inline" data-insight="'+esc(s.id)+'">'+icon('eye',14)+' View evidence</button><button class="v2-inline" data-insight-action="'+esc(s.id)+'">'+icon('plus',14)+' Plan a response</button></div></div></article>').join('');
 const openCount=cp.revisit+cp.developing;
 return sectionTitle('TEACHER WORKSPACE','Today’s Learning Pulse','Your next class, recent changes and evidence to consider before teaching.',
   '<span class="v2-day-pill">'+icon('calendar',15)+' Demo day · '+prettyDate(DEMO_DAY)+'</span>')+
 '<div class="v2-day-hero"><div class="v2-hero-main"><span class="v2-hero-eyebrow">PREPARE FOR YOUR NEXT LESSON</span>'+
 '<div class="v2-hero-time"><span>'+esc(schedule.lessons.find(l=>l.c.id===next.id)?.time||'08:10')+'</span> <span class="v2-hero-sep">·</span> '+esc(shortGrade(next.grade))+' '+esc(next.section)+'</div>'+
 '<h2>'+esc(next.name)+'</h2><p>'+esc(schedule.lessons.find(l=>l.c.id===next.id)?.focus||'Inquiry and responsive teaching')+' · '+next.studentIds.length+' fictional learners</p>'+
 '<div class="v2-hero-actions"><button class="v2-button light" data-open-class="'+esc(next.id)+'">'+icon('layers',16)+' Open Class Pulse '+icon('arrow',14)+'</button>'+
 actionBtn(next.id,'Plan teaching response','','Demo recent formative evidence')+'</div></div>'+
 '<div class="v2-hero-context"><div><span>RECENT LEARNING EVIDENCE</span><strong>'+openCount+' / '+cp.rows.length+'</strong><small>Worth exploring for additional teaching support</small></div>'+
 '<div><span>FOLLOW-UP ACTIONS</span><strong>'+counts.open+counts.revisit+'</strong><small>Your locally saved demonstration actions</small></div></div></div>'+
 '<div class="v2-stats-grid">'+
 stat('Attendance today',cp.attendance.present+cp.attendance.late+' / '+cp.rows.length,'Present or late in selected class','blue')+
 stat('Responses to check',cp.missing+cp.pending,'Missing or awaiting submission','amber')+
 stat('Learning to revisit',openCount,'From latest formative evidence','teal')+
 stat('Extension opportunities',cp.extend,'Recent evidence of readiness','neutral')+'</div>'+
 '<div class="v2-main-grid"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">WHAT CHANGED</span><h2>Signals for your next lesson</h2><p>Questions grounded in recent evidence, never automatic student judgements.</p></div><span class="v2-date-stamp">7–8 OCT</span></div>'+
 (insightMarkup||emptyState('No new signals','There are no recent changes requiring review in this demonstration cohort.'))+
 '<div class="v2-trace-note">'+icon('shield',15)+' All signals are deterministic and traceable to fictional evidence.</div></section>'+
 '<div class="v2-right-stack"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">YOUR TEACHING DAY</span><h2>Classes at a glance</h2></div></div>'+
 '<div class="v2-schedule">'+(schedule.lessons.length?schedule.lessons.map((l,i)=>
 '<button class="v2-schedule-row '+(l.c.id===next.id?'selected':'')+'" data-open-class="'+esc(l.c.id)+'"><span class="v2-sched-time">'+esc(l.time)+'</span>'+
 '<span class="v2-sched-desc"><strong>'+esc(l.c.name)+'</strong><small>'+esc(l.focus)+'</small></span>'+icon('chevron',16)+'</button>').join(''):other.map(c=>
 '<button class="v2-schedule-row" data-open-class="'+esc(c.id)+'">'+esc(c.name)+'</button>').join(''))+'</div>'+
 '<p class="v2-caption">Fictional lesson times and teaching assignments; no timetable integration is active.</p></section>'+
 '<section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">YOUR NEXT MOVE</span><h2>Notice → Respond → Revisit</h2></div></div>'+
 '<p class="v2-explain">Turn one observation into a short instructional adjustment. Revisit the evidence after teaching.</p>'+
 '<div class="v2-action-steps"><span>1 · Notice</span><span>2 · Respond</span><span>3 · Revisit</span></div>'+
 '<button class="v2-button full" data-nav="actions">'+icon('clipboard',17)+' Open My Actions '+icon('arrow',15)+'</button></section></div></div>'+
 '<div class="v2-bottom-grid"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">CLASS LEARNING</span><h2>A quick look at the evidence</h2></div><button class="v2-inline" data-open-class="'+esc(next.id)+'">Explore class '+icon('arrow',14)+'</button></div>'+
 renderEvidenceBands(cp)+
 '<p class="v2-caption">Latest fictional formative evidence, not a fixed grouping of student ability.</p></section>'+
 '<section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">A LONGER VIEW</span><h2>MAP Growth context</h2></div><button class="v2-inline" data-nav="growth">Explore growth '+icon('arrow',14)+'</button></div>'+
 renderGrowthMini(ctx,next)+'</section></div>';
}
function renderEvidenceBands(p){
 const total=p.rows.length||1;
 return '<div class="v2-evidence-stack">'+SKILL_STATES.map(st=>{
   const n=p.levels[st.id];
   return '<div class="v2-evidence-line"><span>'+esc(st.label)+'</span><div class="v2-progress"><i class="'+esc(st.id)+'" style="width:'+(100*n/total).toFixed(1)+'%"></i></div><strong>'+n+'</strong></div>';
 }).join('')+'</div>';
}
function renderGrowthMini(ctx,c){
 const ids=c.studentIds;
 const ms=mapGrowthSummary(ids,ctx.data.map,['Mathematics']);
 if(ms.comparable===0)return '<div class="v2-quiet">'+icon('book',24)+'<strong>Different evidence is more meaningful here.</strong><p>Use class checks, formative assessment and portfolio learning when MAP is not assessed or no comparable window is available.</p></div>';
 return '<div class="v2-mini-growth"><strong>'+ms.rate+'%</strong><div><b>'+ms.met+' / '+ms.comparable+' comparable results</b><p>Observed Mathematics growth met or exceeded the illustrative projection.</p></div></div>'+
 '<p class="v2-caption">Termly context · Fall 2026 · Synthetic MAP data · RIT scores available in profiles.</p>';
}
function selectedClass(ctx){return ctx.currentClass||ctx.classes[0]}
function studentStateLabel(level){return SKILL_STATES[level]?.label||'Evidence pending'}
function rosterRows(ctx,cp){
 const q=ctx.state.studentQuery.trim().toLowerCase();
 const filter=ctx.state.rosterFilter;
 let rows=cp.rows.filter(r=>!q||r.student.name.toLowerCase().includes(q)||r.student.id.toLowerCase().includes(q));
 rows=rows.filter(r=>filter==='all'
  ||filter==='revisit'&&r.evidence.formative.level<=1
  ||filter==='missing'&&r.evidence.task.status!=='Submitted'
  ||filter==='extend'&&r.evidence.formative.level===3
  ||filter==='support'&&r.supportCount>0
  ||filter==='attendance'&&['absent','late'].includes(r.attendance.status));
 return rows;
}
export function renderClass(ctx){
 const c=selectedClass(ctx);if(!c)return emptyState('No class available','Choose another fictional teaching persona.');
 const cp=pulseForClass(ctx.data,ctx.pulse,c);
 const items=classInsights(cp);const rows=rosterRows(ctx,cp);
 const mode=ctx.state.classMode;
 const filter=ctx.state.rosterFilter;
 const filterNames={all:'All learners',revisit:'Revisit / practise',missing:'Submission follow-up',extend:'Ready to extend',support:'Support guidance',attendance:'Attendance changes'};
 return sectionTitle('CLASSROOM VIEW','Class Pulse','Recent classroom evidence, temporary groups and learning opportunities.')+
 '<div class="v2-class-toolbar"><div><label for="v2-class-select">TEACHING GROUP</label><select id="v2-class-select">'+ctx.classes.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+esc(x.name)+' · '+esc(x.section)+'</option>').join('')+'</select></div>'+
 '<div class="v2-toolbar-actions">'+actionBtn(c.id)+
 '<button class="v2-button ghost" data-nav="growth">'+icon('chart',16)+' Growth & Evidence</button></div></div>'+
 '<div class="v2-stats-grid">'+
 stat('Today’s attendance',cp.attendance.present+cp.attendance.late+' / '+cp.rows.length,'Present or late · 8 Oct','blue')+
 stat('Formative evidence',cp.revisit+cp.developing,'Explore recent learning · 7 Oct','teal')+
 stat('Responses to follow up',cp.missing+cp.pending,'Assignment statuses · 7 Oct','amber')+
 stat('Extension opportunities',cp.extend,'Recent formative check','neutral')+'</div>'+
 '<div class="v2-class-grid"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">LEARNER ROSTER</span><h2>Every learner. The latest evidence.</h2><p>Use filters to explore students with a shared learning need, not to assign permanent labels.</p></div><span class="v2-mini-count">'+rows.length+' of '+cp.rows.length+'</span></div>'+
 '<div class="v2-tabs" role="tablist" aria-label="Class view"><button class="'+(mode==='roster'?'active':'')+'" data-class-mode="roster" role="tab" aria-selected="'+(mode==='roster')+'">'+icon('list',16)+' Learner matrix</button>'+
 '<button class="'+(mode==='groups'?'active':'')+'" data-class-mode="groups" role="tab" aria-selected="'+(mode==='groups')+'">'+icon('users',16)+' Flexible groups</button></div>'+
 (mode==='groups'?renderGroups(ctx,cp):
 '<div class="v2-class-filters"><div class="v2-filter-options">'+Object.entries(filterNames).map(([key,label])=>
 '<button type="button" class="v2-filter-chip '+(filter===key?'active':'')+'" data-roster-filter="'+esc(key)+'">'+esc(label)+'</button>').join('')+'</div>'+
 '<label class="v2-roster-search">'+icon('search',15)+' <input id="v2-roster-search" value="'+esc(ctx.state.studentQuery)+'" placeholder="Search learners..." aria-label="Find a learner"/></label></div>'+
 '<div class="v2-table-scroll"><table class="v2-table"><thead><tr><th>Learner</th><th>Today</th><th>Recent learning</th><th>Submission</th><th>MAP growth</th><th>Support</th><th></th></tr></thead><tbody>'+
 rows.map(r=>'<tr><td><button class="v2-student-name" data-open-student="'+esc(r.student.id)+'">'+studentImg(r.student)+
 '<span><strong>'+shortName(r.student)+'</strong><small>'+esc(r.student.id)+'</small></span></button></td>'+
 '<td>'+stageBadge(r.attendance.status)+'</td>'+
 '<td><span class="v2-learning-chip level-'+r.evidence.formative.level+'">'+esc(studentStateLabel(r.evidence.formative.level))+'</span><small class="v2-row-sub">'+esc(r.evidence.skill)+'</small></td>'+
 '<td>'+stageBadge(r.evidence.task.status.toLowerCase().replaceAll(' ','-'))+'</td>'+
 '<td>'+growthMatrixCell(r.map)+'</td>'+
 '<td>'+(r.supportCount?'<span class="v2-help-dot">'+icon('shield',14)+' Guidance</span>':'<span class="v2-muted">—</span>')+'</td>'+
 '<td><button class="v2-text-link" data-open-student="'+esc(r.student.id)+'">Profile '+icon('chevron',14)+'</button></td></tr>').join('')+
 '</tbody></table>'+(!rows.length?emptyState('No matching learners','Try adjusting the filters or search.'):'')+'</div>')+
 '<div class="v2-card-foot">'+provenance(DAILY_PROVENANCE.assessments)+' '+provenance(DAILY_PROVENANCE.attendance)+'</div></section>'+
 '<aside class="v2-class-side"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">CLASS PATTERNS</span><h2>Latest learning check</h2></div></div>'+
 renderEvidenceBands(cp)+'<p class="v2-caption">All 20 fictional learners · check recorded 7 Oct 2026.</p>'+
 '<button class="v2-button ghost full" data-class-mode="groups">'+icon('users',16)+' Review suggested groups</button></section>'+
 '<section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">STUDENT VOICE</span><h2>Class experience</h2></div></div>'+
 renderVoice(cp)+'<p class="v2-caption">Aggregate sample only; not individual student data.</p></section>'+
 '<section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">QUESTIONS TO INVESTIGATE</span><h2>Evidence-aware prompts</h2></div></div>'+
 items.slice(0,3).map(x=>'<article class="v2-small-insight"><strong>'+esc(x.title)+'</strong><p>'+esc(x.description)+'</p><button class="v2-inline" data-insight="'+esc(x.id)+'">Why am I seeing this? '+icon('arrow',13)+'</button></article>').join('')+
 '<div class="v2-card-foot">'+provenance('Rule-based · no AI service connected')+'</div></section></aside></div>';
}
function growthMatrixCell(g){
 if(g.status==='comparable')return '<span class="v2-map-mini"><strong>'+esc(growthFormat(g.actual))+' pts</strong><small>vs '+esc(growthFormat(g.projected))+' projected</small></span>';
 if(g.status==='no-comparison')return '<span class="v2-muted">No prior test</span>';
 if(g.status==='missing-current')return '<span class="v2-muted">No Fall result</span>';
 return '<span class="v2-muted">Not assessed</span>';
}
function renderVoice(cp){
 if(cp.voice.suppressed)return emptyState('Small sample','The illustrative voice pulse is hidden because fewer than 10 learners responded.');
 return '<div class="v2-voice-stat"><strong>'+cp.voice.positive+'%</strong><span>positive class responses</span></div>'+
 '<p class="v2-voice-question">“'+esc(cp.voice.question)+'”</p>'+
 '<p class="v2-voice-denominator">'+cp.voice.count+' of '+cp.voice.cohort+' fictional students responded · 30 Sep 2026</p>';
}
function renderGroups(ctx,cp){
 const groups=flexibleGroups(cp);
 const overrides=readGroupOverrides(ctx.teacher.id,cp.c.id);
 const lookup=Object.fromEntries(groups.map(g=>[g.id,{...g,learners:[]}]));
 for(const row of cp.rows){
  const selected=overrides[row.student.id]||SKILL_STATES[row.evidence.formative.level].id;
  (lookup[selected]||lookup.secure).learners.push(row.student);
 }
 return '<div class="v2-group-intro">'+icon('info',17)+' Suggested from one fictional formative check. These groups are temporary, editable and must be reviewed by the teacher. They are not fixed learner ability categories.</div>'+
 '<div class="v2-groups-grid">'+groups.map(g=>{
  const member=lookup[g.id].learners;
  return '<section class="v2-group-card group-'+g.id+'"><div class="v2-group-head"><span class="v2-group-marker"></span><h3>'+esc(g.label)+'</h3><b>'+member.length+'</b></div>'+
  '<p>'+esc(g.description)+'</p><div class="v2-group-members">'+member.map(s=>
    '<div class="v2-group-member">'+studentImg(s)+
    '<span>'+shortName(s)+'</span><select data-group-student="'+esc(s.id)+'" data-group-class="'+esc(cp.c.id)+'" aria-label="Group for '+esc(s.name)+'">'+
    groups.map(opt=>'<option value="'+esc(opt.id)+'" '+(opt.id===g.id?'selected':'')+'>'+esc(opt.label)+'</option>').join('')+
    '</select></div>').join('')+'</div></section>';
 }).join('')+'</div>'+
 '<div class="v2-group-footer"><button class="v2-button ghost" data-reset-groups="'+esc(cp.c.id)+'">'+icon('refresh',14)+' Reset suggestions</button>'+
 actionBtn(cp.c.id,'Record group teaching plan','','Demo formative checks · 7 Oct 2026')+'</div>';
}
export function renderLearners(ctx){
 const q=ctx.state.studentQuery.trim().toLowerCase();
 let learners=ctx.students.filter(s=>!q||s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q)||s.grade.toLowerCase().includes(q));
 const filteredClass=ctx.state.studentClassFilter;
 if(filteredClass!=='all')learners=learners.filter(s=>s.classId===filteredClass);
 return sectionTitle('YOUR STUDENTS','My Learners','Every profile brings recent evidence, longitudinal growth and classroom support into context.')+
 '<div class="v2-class-toolbar"><label class="v2-wide-field">FIND A LEARNER <input id="v2-learner-search" placeholder="Search name, ID or grade..." value="'+esc(ctx.state.studentQuery)+'"/></label>'+
 '<label>CLASS <select id="v2-learner-class"><option value="all">All assigned classes</option>'+ctx.classes.map(c=>
 '<option value="'+esc(c.id)+'" '+(filteredClass===c.id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'+
 '<span class="v2-result-note">'+learners.length+' fictional learners</span></div>'+
 (learners.length?'<div class="v2-learners-grid">'+learners.slice(0,160).map(s=>{
   const sig=ctx.pulse.byStudent[s.id],today=pulseForClass(ctx.data,ctx.pulse,ctx.data.classIndex.get(s.classId)).rows.find(r=>r.student.id===s.id);
   return '<button class="v2-learner-card" data-open-student="'+esc(s.id)+'">'+studentImg(s,'large')+
   '<span class="v2-learner-card-text"><strong>'+shortName(s)+'</strong><small>'+esc(shortGrade(s.grade))+' · '+esc(s.classId)+'</small>'+
   '<span class="v2-learner-meta">'+stageBadge(today?.attendance.status||'not-recorded')+' <span class="v2-light-small">· '+esc(SKILL_STATES[sig.formative.level].short)+'</span></span></span>'+icon('chevron',17)+'</button>';
 }).join('')+'</div>':emptyState('No learners found','Try a different name or class.'))+
 '<p class="v2-caption">This is a demonstration roster. Teacher-class assignments are invented, even though faculty names are real.</p>';
}
function growthSummaryByClass(ctx,c,subject){
 const eligible=c.studentIds.map(id=>latestMapGrowth(ctx.data.map[id]||[],subject));
 const comparable=eligible.filter(g=>g.status==='comparable'&&g.projected!==null);
 const met=comparable.filter(g=>g.met).length;
 const actual=comparable.reduce((a,g)=>a+g.actual,0);
 return {c,eligible:eligible.length,comparable:comparable.length,met,rate:comparable.length?Math.round(100*met/comparable.length):null,
  avg:comparable.length?Math.round(10*actual/comparable.length)/10:null,
  missing:eligible.filter(g=>g.status==='missing-current').length,
  first:eligible.filter(g=>g.status==='no-comparison').length};
}
export function renderGrowth(ctx){
 const subject=ctx.state.subject;
 const groups=ctx.classes.map(c=>growthSummaryByClass(ctx,c,subject));
 const comparable=groups.reduce((a,x)=>a+x.comparable,0),met=groups.reduce((a,x)=>a+x.met,0);
 const rate=comparable?Math.round(100*met/comparable):null;
 const avg=comparable?Math.round(10*groups.reduce((a,x)=>a+x.avg*x.comparable,0)/comparable)/10:null;
 const noMap=groups.every(g=>g.comparable===0);
 return sectionTitle('LONGITUDINAL EVIDENCE','Growth & Evidence','MAP growth where valid, alongside more recent classroom learning evidence.')+
 '<div class="v2-growth-banner"><div><span class="v2-eyebrow">MAP GROWTH PHILOSOPHY</span><h3>Progress before position.</h3><p>See observed change between valid testing windows, consider the projection, and return to classroom evidence for what to do next.</p></div>'+
 '<span class="v2-banner-icon">'+icon('trending',36)+'</span></div>'+
 '<div class="v2-class-toolbar"><label>MAP SUBJECT <select id="v2-subject-select">'+['Mathematics','Reading','Language Usage'].map(x=>'<option '+(x===subject?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'+
 '<p class="v2-quiet-description">Fall 2026 · Illustrative NWEA-like data · missing or noncomparable tests excluded</p></div>'+
 (noMap?'<section class="v2-card v2-card-roomy"><h2>Learning evidence that fits the age and programme</h2>'+
 '<p>Comparable MAP Growth results are not available for your current fictional groups. This is appropriate for PK–Grade 2 and Grades 11–12 in this demonstration. Use recent classroom assessments, descriptive evidence, developmental records or programme criteria instead.</p>'+
 '<div class="v2-evidence-shift">'+icon('book',24)+' Meaningful progress evidence differs between early years, elementary, MYP and DP.</div>'+
 '<button class="v2-button secondary" data-nav="classes">Open formative Class Pulse '+icon('arrow',15)+'</button></section>':
 '<div class="v2-stats-grid">'+
 stat('Met / exceeded projection',rate===null?'—':rate+'%',met+' of '+comparable+' comparable subject results','teal')+
 stat('Average observed growth',avg===null?'—':growthFormat(avg)+' pts','Comparably assessed learners only','blue')+
 stat('Growth comparisons',comparable,'Across your assigned fictional cohorts','neutral')+
 stat('Not comparable',groups.reduce((a,x)=>a+x.eligible-x.comparable,0),'Not assessed, missing or first tests','amber')+'</div>'+
 '<div class="v2-main-grid"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">YOUR CLASS COHORTS</span><h2>Growth by teaching group</h2><p>Observed growth is the RIT-point difference, not a percentage increase.</p></div></div>'+
 '<div class="v2-growth-classes">'+groups.map(g=>{
  const width=g.rate??0;
  return '<button class="v2-growth-row" data-open-class="'+esc(g.c.id)+'"><span class="v2-growth-row-name">'+esc(g.c.name)+'</span>'+
  '<span class="v2-growth-row-bar"><i style="width:'+width+'%"></i></span>'+
  '<strong>'+(g.rate===null?'N/A':g.rate+'%')+'</strong><small>'+g.met+' / '+g.comparable+' valid</small>'+icon('chevron',15)+'</button>';
 }).join('')+'</div><p class="v2-caption">Based on fictional observed growth versus simulated projection, not official NWEA normative reports.</p></section>'+
 '<aside class="v2-right-stack"><section class="v2-card v2-card-roomy"><span class="v2-eyebrow">INTERPRET WITH CARE</span><h2>What growth tells us—and what it doesn’t</h2>'+
 '<div class="v2-caution-list"><p><strong>What:</strong> how scores changed between comparable testing windows.</p>'+
 '<p><strong>What it cannot establish:</strong> a cause, a fixed learner label, or whether one strategy produced the change.</p>'+
 '<p><strong>What to explore next:</strong> recent formative evidence, student experience and teaching context.</p></div></section>'+
 '<section class="v2-card v2-card-roomy"><span class="v2-eyebrow">INSTRUCTIONAL QUESTION</span><h2>From MAP to daily teaching</h2><p>Which recent classroom evidence might help explain the pattern—and what more do you need to know?</p>'+
 '<button class="v2-button ghost full" data-nav="classes">Review Class Pulse '+icon('arrow',14)+'</button></section></aside></div>')+
 '<section class="v2-card v2-card-roomy v2-growth-students"><div class="v2-card-head"><div><span class="v2-eyebrow">STUDENT EVIDENCE</span><h2>Explore individual MAP growth</h2></div></div>'+
 renderGrowthStudentTable(ctx,subject)+'</section>');
}
function renderGrowthStudentTable(ctx,subject){
 const students=ctx.students.filter(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10);
 if(!students.length)return emptyState('Not assessed in these grades','Use the Class Pulse for current learning evidence.');
 return '<div class="v2-table-scroll"><table class="v2-table"><thead><tr><th>Learner</th><th>Group</th><th>Observed growth</th><th>Illustrative projection</th><th>Current test</th><th></th></tr></thead><tbody>'+
 students.slice(0,100).map(s=>{
  const g=latestMapGrowth(ctx.data.map[s.id],subject);
  return '<tr><td>'+studentImg(s)+' <strong>'+shortName(s)+'</strong></td><td>'+esc(s.classId)+'</td><td>'+esc(g.status==='comparable'?growthFormat(g.actual)+' pts':'No comparable result')+'</td>'+
  '<td>'+esc(g.projected===null?'—':growthFormat(g.projected)+' pts')+'</td><td>'+esc(g.current?.window||'Not available')+'</td>'+
  '<td><button class="v2-text-link" data-open-student="'+esc(s.id)+'" data-target-tab="map">Explore '+icon('chevron',13)+'</button></td></tr>';
 }).join('')+'</tbody></table></div>';
}
function ritHistoryChart(rows){
 if(!rows.length)return emptyState('No RIT history','There is no comparable RIT evidence.');
 const w=640,h=205,px=45,py=34;
 const min=Math.min(...rows.map(r=>r.rit))-9,max=Math.max(...rows.map(r=>r.rit))+9;
 const x=i=>px+(w-px-30)*(rows.length===1?.5:i/(rows.length-1));
 const y=v=>py+(h-py-33)*(1-(v-min)/(max-min||1));
 const pts=rows.map((r,i)=>x(i)+','+y(r.rit)).join(' ');
 return '<div class="v2-rit-chart"><svg viewBox="0 0 640 205" role="img" aria-label="Simulated MAP RIT history">'+
 '<polyline points="'+pts+'" fill="none" stroke="#1c679a" stroke-width="3" stroke-linejoin="round"/>'+
 rows.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(r.rit)+'" r="5" fill="white" stroke="#1c679a" stroke-width="3"><title>'+
 esc(r.window)+' '+r.rit+' RIT</title></circle><text x="'+x(i)+'" y="'+(y(r.rit)-13)+'" text-anchor="middle" font-size="11" fill="#244560">'+r.rit+'</text>'+
 '<text x="'+x(i)+'" y="'+(h-10)+'" text-anchor="middle" font-size="10" fill="#627e93">'+esc(r.window.replace('Fall ','F').replace('Spring ','S'))+'</text>').join('')+'</svg></div>';
}
function renderStudentNav(ctx,s){
 const items=[['overview','Overview'],['learning','Recent learning'],['map','MAP Growth'],['attendance','Attendance'],['support','Classroom guidance']];
 return '<div class="v2-profile-tabs" role="tablist" aria-label="Learner information">'+items.map(([key,label])=>
 '<button role="tab" aria-selected="'+(ctx.state.studentTab===key)+'" class="'+(ctx.state.studentTab===key?'active':'')+'" data-student-tab="'+key+'">'+label+'</button>').join('')+'</div>';
}
export function renderStudent(ctx,studentId){
 const s=ctx.students.find(x=>x.id===studentId);
 if(!s)return sectionTitle('ACCESS SCOPE','Learner unavailable','Only profiles in this fictional teacher’s assigned classes can be viewed.')+
 emptyState('Outside current demo scope','Change the teacher persona or choose a learner from My Learners.');
 const daily=ctx.pulse.byStudent[s.id],events=studentTimeline(ctx.data,ctx.pulse,s);
 const status=ctx.data.attendance[s.id].at(-1);
 const attendance=attendanceTrend(ctx.data,s);
 const g=latestMapGrowth(ctx.data.map[s.id]||[],'Mathematics');
 const currentActions=ctx.actions.filter(a=>a.studentId===s.id||a.classId===s.classId&&a.studentId==='');
 const section=ctx.state.studentTab;
 let body='';
 if(section==='overview')body=
 '<div class="v2-stats-grid">'+stat('Today’s attendance',status?.status==='absent'?'Absent':status?.status==='late'?'Late':'Present','8 Oct · fictional','blue')+
 stat('Latest formative evidence',SKILL_STATES[daily.formative.level].short,smallDate(daily.formative.recorded)+' · skill check','teal')+
 stat('MAP Mathematics growth',g.status==='comparable'?growthFormat(g.actual)+' pts':'N/A',g.status==='comparable'?'vs '+growthFormat(g.projected)+' projected':'No comparable result','neutral')+
 stat('Learning follow-ups',currentActions.filter(a=>a.status!=='completed').length,'Teacher-owned demo actions','amber')+'</div>'+
 '<div class="v2-main-grid"><section class="v2-card v2-card-roomy"><div class="v2-card-head"><div><span class="v2-eyebrow">CONNECTED EVIDENCE</span><h2>Recent learning timeline</h2><p>See what changed, and open the underlying category for context.</p></div></div>'+
 '<div class="v2-timeline">'+events.map(ev=>'<div class="v2-timeline-item"><span class="v2-timeline-dot"></span><div><small>'+esc(prettyDate(ev.date))+' · '+esc(ev.kind.toUpperCase())+'</small><h3>'+esc(ev.title)+'</h3><p>'+esc(ev.description)+'</p><span class="v2-mini-source">'+esc(ev.source)+'</span></div></div>').join('')+'</div></section>'+
 '<aside class="v2-right-stack"><section class="v2-card v2-card-roomy"><span class="v2-eyebrow">KNOW THE LEARNER</span><h2>Profile context</h2>'+
 '<div class="v2-info-pairs"><div><span>Grade</span><strong>'+esc(shortGrade(s.grade))+'</strong></div><div><span>Homeroom</span><strong>'+esc(s.homeroom)+'</strong></div>'+
 '<div><span>Campus</span><strong>'+esc(s.campus)+'</strong></div><div><span>Home language</span><strong>'+esc(s.primaryLanguage)+'</strong></div>'+
 '<div><span>Years at AISG</span><strong>'+esc(s.yearsAtAISG)+'</strong></div></div></section>'+
 '<section class="v2-card v2-card-roomy"><span class="v2-eyebrow">YOUR NEXT MOVE</span><h2>Respond with purpose</h2><p>Current evidence suggests: '+esc(daily.classroomNext)+'. Use your judgement and other observations before deciding.</p>'+
 actionBtn(s.classId,'Record teaching response',s.id,'Demo formative check · 7 Oct 2026')+'</section></aside></div>';
 else if(section==='learning'){
  const latest=ctx.data.assessments[s.id].slice(0,7);
  body='<div class="v2-main-grid"><section class="v2-card v2-card-roomy"><span class="v2-eyebrow">RECENT CLASSROOM LEARNING</span><h2>Current formative check</h2>'+
  '<div class="v2-learning-highlight"><span class="v2-learning-chip level-'+daily.formative.level+'">'+esc(SKILL_STATES[daily.formative.level].label)+'</span>'+
  '<h3>'+esc(daily.skill)+'</h3><p>Recorded on '+smallDate(daily.formative.recorded)+'. Suggested next move: '+esc(daily.classroomNext)+'.</p></div>'+
  '<h3 class="v2-subtitle">Recent assignments and published results</h3><div class="v2-table-scroll"><table class="v2-table"><thead><tr><th>Assessment</th><th>Subject</th><th>When</th><th>Status</th><th>Outcome</th></tr></thead><tbody>'+
  latest.map(a=>'<tr><td>'+esc(a.title)+'</td><td>'+esc(a.subject)+'</td><td>'+esc(a.date)+'</td><td>'+stageBadge(a.status.toLowerCase())+'</td><td>'+esc(a.status==='Published'?a.outcome:'Not available')+'</td></tr>').join('')+
  '</tbody></table></div></section><aside class="v2-right-stack"><section class="v2-card v2-card-roomy"><span class="v2-eyebrow">SUBMISSION PULSE</span><h2>Recent learning evidence</h2>'+
  '<p><strong>'+esc(daily.task.status)+'</strong> · '+esc(daily.task.title)+'</p><p class="v2-caption">Source: fictional ManageBac-like learning records. Outcomes reflect MYP/DP/elementary approaches rather than forced percentage grades.</p></section></aside></div>';
 }else if(section==='map')body=renderGrowthProfile(ctx.data.map[s.id]||[],ctx.state.subject,ritHistoryChart);
 else if(section==='attendance'){
  const rows=ctx.data.attendance[s.id];
  const events=rows.filter(r=>r.status!=='present').slice(-12).reverse();
  body='<div class="v2-stats-grid">'+stat('Year attendance',formatPct(attendanceSummary(rows).rate),'Demo daily attendance','blue')+
  stat('Last 10 school days',formatPct(attendance.rate),'Recent participation context','teal')+
  stat('Absent (last 10)',attendance.absent,'No inference about cause','neutral')+
  stat('Late (last 10)',attendance.late,'Context before conclusions','amber')+'</div>'+
  '<section class="v2-card v2-card-roomy"><span class="v2-eyebrow">PARTICIPATION</span><h2>Attendance and punctuality timeline</h2>'+
  '<p class="v2-caption">Daily records are illustrative. Excused and unexcused absence codes are distinct; a missing day is not treated as absence.</p>'+
  (events.length?'<div class="v2-timeline">'+events.map(e=>
  '<div class="v2-timeline-item"><span class="v2-timeline-dot"></span><div><small>'+esc(prettyDate(e.date))+'</small><h3>'+esc(e.status==='late'?'Late arrival':e.excused?'Excused absence':'Absence')+'</h3>'+
  '<p>Recorded demonstration attendance event.</p></div></div>').join('')+'</div>':
  emptyState('No recent exceptions','No absences or late arrivals were recorded in this fictional period.'))+'</section>';
 }else{
  const items=ctx.data.support[s.id]||[];
  body='<div class="v2-main-grid"><section class="v2-card v2-card-roomy"><span class="v2-eyebrow">CLASSROOM SUPPORT</span><h2>Practical guidance</h2>'+
  '<p class="v2-caption">Action-focused, fictional learning guidance. Full medical, counselling and safeguarding records never appear here.</p>'+
  (items.length?items.map(i=>'<article class="v2-guidance"><span>'+icon('shield',18)+'</span><div><small>'+esc(i.kind)+'</small><h3>'+esc(i.title)+'</h3><p>'+esc(i.detail)+'</p></div></article>').join(''):
  emptyState('No additional guidance recorded','Continue using purposeful, inclusive Tier 1 teaching strategies.'))+
  '</section><aside class="v2-right-stack"><section class="v2-card v2-card-roomy"><span class="v2-eyebrow">PRIVACY BY DESIGN</span><h2>Access only what helps</h2>'+
  '<p>Only essential classroom guidance should appear in a production system. Genuine health or student-support records require school-approved source permissions and audited backend access.</p>'+
  '</section></aside></div>';
 }
 return '<button class="v2-back" data-nav="learners">'+icon('back',15)+' Back to My Learners</button>'+
 '<div class="v2-profile-hero">'+studentImg(s,'large')+'<div><span class="v2-eyebrow">FICTIONAL LEARNER PROFILE</span><h1>'+esc(s.name)+'</h1>'+
 '<p>'+esc(shortGrade(s.grade))+' · '+esc(s.classId)+' · '+esc(s.campus)+' Campus · '+esc(s.id)+'</p>'+
 '<div class="v2-tagline"><span>'+esc(s.primaryLanguage)+'</span><span>'+esc(s.yearsAtAISG)+' years at AISG</span></div></div>'+
 '<div class="v2-profile-action">'+actionBtn(s.classId,'New follow-up',s.id,'Teacher observation · fictional profile')+'</div></div>'+
 renderStudentNav(ctx,s)+body+
 '<p class="v2-caption">All learner identities, grades, academic records, survey information, attendance and support guidance are synthetic.</p>';
}
export function renderActions(ctx){
 const counts=actionCounts(ctx.actions);
 const filter=ctx.state.actionFilter;
 const rows=ctx.actions.filter(a=>filter==='all'||a.status===filter);
 return sectionTitle('REFLECTION INTO PRACTICE','My Actions','Notice → Respond → Revisit. Brief, teacher-owned instructional follow-ups—not formal safeguarding or MTSS records.',
 actionBtn(ctx.currentClass?.id||ctx.classes[0]?.id,'New response'))+
 '<div class="v2-stats-grid">'+stat('Total follow-ups',counts.total,'This demonstration teacher','neutral')+
 stat('Notice & respond',counts.open,'Ready for initial instructional action','blue')+
 stat('Ready to revisit',counts.revisit,'Recheck learning impact','amber')+
 stat('Reviewed',counts.completed,'Reflection recorded','teal')+'</div>'+
 '<div class="v2-tabs v2-action-filters">'+[['all','All actions'],['open','Open'],['revisit','Revisit'],['completed','Reviewed']].map(([k,label])=>
 '<button class="'+(filter===k?'active':'')+'" data-action-filter="'+k+'">'+esc(label)+'</button>').join('')+'</div>'+
 '<div class="v2-actions-list">'+(rows.length?rows.map(a=>{
  const c=ctx.data.classIndex.get(a.classId);
  return '<article class="v2-card v2-action-card"><div class="v2-action-top"><span class="v2-eyebrow">'+esc(c?.name||a.classId)+' · '+esc(a.evidence)+'</span>'+
  '<span class="v2-action-state">'+esc(ACTION_STAGE_LABELS[a.status])+'</span></div>'+
  '<h2>'+esc(a.title)+'</h2><p>'+esc(a.strategy)+'</p>'+
  '<div class="v2-action-foot"><span>'+icon('calendar',15)+' Revisit '+smallDate(a.due)+'</span>'+
  '<div><button class="v2-inline" data-review-action="'+esc(a.id)+'">'+icon('note',14)+' Review / update</button>'+
  '<button class="v2-inline muted" data-delete-action="'+esc(a.id)+'">Remove</button></div></div>'+
  (a.outcome?'<div class="v2-action-outcome"><strong>What happened when revisited?</strong><p>'+esc(a.outcome)+'</p></div>':'')+'</article>';
 }).join(''):emptyState('Nothing in this view','Choose another status or create a short instructional response.'))+'</div>'+
 '<div class="v2-privacy-note">'+icon('shield',18)+' Demo actions are saved only in this browser for the selected fictional persona. Do not enter real student information. Production actions require identity, audit and retention controls.</div>';
}
export function renderInsightDrawer(ctx){
 const item=ctx.activeInsight;
 if(!item)return '';
 const c=ctx.data.classIndex.get(item.classId);
 return '<div class="v2-drawer-shade" data-close-insight="1"></div>'+
 '<aside class="v2-drawer" role="dialog" aria-modal="true" aria-label="Evidence trail"><div class="v2-drawer-top"><span class="v2-eyebrow">WHY THIS APPEARS</span>'+
 '<button class="v2-icon-button" data-close-insight="1" aria-label="Close evidence">'+icon('close',19)+'</button></div>'+
 '<h2>'+esc(item.title)+'</h2><p>'+esc(item.description)+'</p>'+
 '<div class="v2-drawer-evidence"><span>CLASS CONTEXT</span><strong>'+esc(c?.name||item.classId)+'</strong></div>'+
 '<div class="v2-drawer-evidence"><span>GROUNDING EVIDENCE</span><strong>'+esc(item.source)+'</strong></div>'+
 '<div class="v2-drawer-evidence"><span>SUMMARY</span><strong>'+esc(item.metric)+'</strong></div>'+
 '<div class="v2-drawer-evidence"><span>DECISION RULE</span><p>A transparent threshold applied to recently generated demo events. This is not an AI-generated judgement, diagnosis or formal intervention recommendation.</p></div>'+
 '<div class="v2-drawer-bottom">'+actionBtn(item.classId,'Plan a response','',item.source)+
 '<button class="v2-button ghost" data-close-insight="1">Back to dashboard</button></div></aside>';
}
export function renderActionModal(ctx){
 const editing=ctx.editingAction;
 if(!ctx.state.actionModal&&!editing)return '';
 const c=ctx.currentClass||ctx.classes[0];
 const selected=ctx.state.modalClassId||editing?.classId||c?.id;
 return '<div class="v2-modal-scrim" data-close-modal="1"></div>'+
 '<section class="v2-modal" role="dialog" aria-modal="true" aria-label="'+(editing?'Review instructional follow-up':'Create instructional follow-up')+'">'+
 '<div class="v2-modal-head"><div><span class="v2-eyebrow">TEACHER REFLECTION</span><h2>'+(editing?'Revisit your instructional response':'Notice → Respond → Revisit')+'</h2></div>'+
 '<button class="v2-icon-button" data-close-modal="1" aria-label="Close dialog">'+icon('close',20)+'</button></div>'+
 '<p class="v2-modal-intro">Keep the note brief and focused on teaching. Demo data is stored locally; do not use actual student information.</p>'+
 (ctx.state.formError?'<p class="v2-form-error" role="alert">'+esc(ctx.state.formError)+'</p>':'')+
 (editing?'<form id="v2-review-form"><input type="hidden" name="id" value="'+esc(editing.id)+'"/>'+
 '<label>TEACHING RESPONSE<textarea name="strategy" rows="3" required maxlength="500">'+esc(editing.strategy)+'</textarea></label>'+
 '<label>WHAT DID YOU NOTICE WHEN YOU REVISITED THE LEARNING?<textarea name="outcome" rows="4" maxlength="600" placeholder="What changed? What evidence do you have?">'+esc(editing.outcome||'')+'</textarea></label>'+
 '<div class="v2-form-row"><label>STAGE<select name="status">'+[['open','Notice & respond'],['revisit','Ready to revisit'],['completed','Reviewed']].map(([key,label])=>
 '<option value="'+key+'" '+(editing.status===key?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
 '<label>REVISIT DATE<input type="date" name="due" value="'+esc(editing.due)+'" required/></label></div>'+
 '<div class="v2-form-actions"><button class="v2-button ghost" type="button" data-close-modal="1">Cancel</button><button class="v2-button primary" type="submit">'+icon('check',16)+' Save reflection</button></div></form>':
 '<form id="v2-create-form"><label>CLASS / TEACHING GROUP<select name="classId" required>'+ctx.classes.map(x=>
 '<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'+
 '<label>WHAT HAVE YOU NOTICED?<input maxlength="130" name="title" placeholder="A learning question or pattern..." value="'+esc(ctx.state.modalTitle||'')+'" required/></label>'+
 '<label>WHAT MIGHT YOU TRY?<textarea name="strategy" rows="4" maxlength="500" placeholder="One purposeful instructional adjustment..." required>'+esc(ctx.state.modalStrategy||'')+'</textarea></label>'+
 '<label>RELATED EVIDENCE<input maxlength="180" name="evidence" value="'+esc(ctx.state.modalEvidence||'Teacher observation · fictional demo')+'"/></label>'+
 '<div class="v2-form-row"><label>REVISIT DATE<input type="date" name="due" required value="2026-10-12"/></label>'+
 '<label>LEARNER (OPTIONAL)<select name="studentId"><option value="">Whole class / teaching group</option>'+
 ctx.students.filter(s=>s.classId===selected).map(s=>
 '<option value="'+esc(s.id)+'" '+(ctx.state.modalStudentId===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label></div>'+
 '<div class="v2-form-actions"><button class="v2-button ghost" type="button" data-close-modal="1">Cancel</button>'+
 '<button class="v2-button primary" type="submit">'+icon('plus',16)+' Save demo follow-up</button></div></form>')+'</section>';
}
