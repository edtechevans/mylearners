import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {createSSSDemoRecords} from '../src/sss-demo-data.mjs';
import {seedSupportDemo,createDraftEntry} from '../src/support-workspace-data.mjs';
import {aggregateStudentSupport,studentSupportLeadershipSummary,
 MIN_LEADERS_GROUP,MIN_LEADERS_SUPPORT} from '../src/leader-support-summary.mjs';
import {renderLeaderSupportSection} from '../src/leader-support-view.mjs';

const data=generateDemoData();
const sss=createSSSDemoRecords(data.students);
const seeded=seedSupportDemo(data.students,sss);
const school=aggregateStudentSupport(data.students,sss,seeded);

test('leadership overview reconciles with same fictional student support records as SSS',()=>{
 assert.equal(school.scopeSize,data.students.length);
 assert.equal(school.cohort,sss.size);
 assert.equal(school.activePlans,sss.size);
 assert.ok(school.reviewsDue<=school.cohort);
 assert.ok(school.actionCompleted+school.actionOpen<=school.actionTotal);
 assert.ok(school.referralPending<=school.referralTotal);
 assert.equal(school.referralStages.reduce((sum,row)=>sum+row.count,0),school.referralTotal);
 assert.ok(school.referralStages.some(x=>x.count>0));
 assert.ok(school.readiness.some(x=>x.label==='Review decision documented'&&x.count>0));
 assert.ok(school.readiness.some(x=>x.label==='Learner perspective captured'&&x.count>0));
});
test('all displayed rates are bounded and come with their denominators',()=>{
 for(const value of [school.cohortRate,school.actionCompletionRate,school.atTargetRate,
 ...school.readiness.map(x=>x.rate),...school.weekly.map(x=>x.share)]){
  assert.ok(value===null||(value>=0&&value<=100));
 }
 assert.equal(school.monitored,school.weekly[0].available);
 assert.equal(school.weekly.length,6);
 assert.equal(school.atTarget,school.weekly[5].atTarget);
});
test('leader role exposes aggregates and prompts but no fictional learner names or case notes',()=>{
 const html=renderLeaderSupportSection({students:data.students,sssRecords:sss,entries:seeded,open:true});
 assert.match(html,/Student Support/);
 assert.match(html,/Upcoming Reviews/);
 assert.match(html,/Monitoring at Sample Target/);
 assert.match(html,/Explore support processes & progress/);
 assert.match(html,/data-leader-panel="support" open/);
 assert.match(html,/Referral Stages|Referral Cycle/);
 assert.match(html,/Support Record Coverage/);
 assert.match(html,/Questions for Leadership Inquiry/);
 assert.doesNotMatch(html,/data-sss-student|data-support-edit|Case Manager ·/);
 for(const person of data.students.slice(0,40))assert.ok(!html.includes(person.name));
});
test('leadership scope respects filters and hides small-group case information',()=>{
 const es=data.students.filter(x=>x.division==='Elementary');
 const sec=data.students.filter(x=>x.division==='Secondary');
 const elementary=aggregateStudentSupport(es,sss,seeded);
 const secondary=aggregateStudentSupport(sec,sss,seeded);
 assert.equal(elementary.cohort+secondary.cohort,school.cohort);
 assert.equal(elementary.reviewsDue+secondary.reviewsDue,school.reviewsDue);
 assert.equal(elementary.atTarget+secondary.atTarget,school.atTarget);
 const small=data.students.slice(0,MIN_LEADERS_GROUP-1);
 assert.equal(aggregateStudentSupport(small,sss,seeded).suppressed,true);
 const smallHtml=renderLeaderSupportSection({students:small,sssRecords:sss,entries:seeded});
 assert.match(smallHtml,/too small for a meaningful aggregate/);
 assert.doesNotMatch(smallHtml,/leader-support-kpis/);
 const insufficient=data.students.filter(x=>sss.has(x.id)).slice(0,MIN_LEADERS_SUPPORT-1);
 assert.equal(aggregateStudentSupport(insufficient,sss,seeded).suppressed,true);
 const schoolBreakdown=studentSupportLeadershipSummary(data.students,sss,seeded);
 assert.equal(schoolBreakdown.divisions.length,2);
});
test('in-session follow-up and review decisions update leadership aggregates',()=>{
 const student=data.students.find(x=>sss.has(x.id));
 assert.ok(student);
 const note=createDraftEntry({type:'action',date:'2026-10-28',title:'Demo task',summary:'Check learning access.',status:'Completed',
   reviewDate:'2026-11-13'},student.id,'sss');
 const review=createDraftEntry({type:'review',date:'2026-10-28',title:'Demo review',summary:'Continue with the current support.',
   decision:'Continue'},student.id,'sss');
 const base=aggregateStudentSupport(data.students,sss,seeded);
 const changed=aggregateStudentSupport(data.students,sss,[...seeded,note,review]);
 assert.equal(changed.actionOpen,base.actionOpen+1);
 assert.equal(changed.actionTotal,base.actionTotal+1);
 assert.equal(changed.reviewDecisions,base.reviewDecisions+1);
});
