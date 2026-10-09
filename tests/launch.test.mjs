import test from 'node:test';
import assert from 'node:assert/strict';
const handlers={};
const backing=new Map();
const store={getItem:k=>backing.get(k)||null,setItem:(k,v)=>backing.set(k,String(v)),removeItem:k=>backing.delete(k)};
const app={innerHTML:'',addEventListener:(name,fn)=>{handlers['app-'+name]=fn},querySelector:()=>null};
globalThis.localStorage=store;globalThis.sessionStorage=store;
globalThis.document={getElementById:id=>id==='app'?app:null,activeElement:null};
globalThis.location={hash:'#/home'};
globalThis.window={addEventListener:(name,fn)=>{handlers['window-'+name]=fn},scrollTo(){}};
const launch=await import('../src/my-learners-launch.mjs');
const routeTo=hash=>{globalThis.location.hash=hash;handlers['window-hashchange']()};
const target=(attr,data)=>({closest:query=>query===attr?{dataset:data}:null});
test('first release starts at calm Home and exposes four information destinations only',()=>{
 assert.match(app.innerHTML,/Find what you need\. Get back to teaching\./);
 assert.match(app.innerHTML,/MY WORKSPACE/);
 assert.match(app.innerHTML,/My Classes/);
 assert.match(app.innerHTML,/My Learners/);
 assert.match(app.innerHTML,/MAP Growth/);
 assert.doesNotMatch(app.innerHTML,/(Today’s Learning Pulse|Notice → Respond → Revisit|My Actions|Flexible groups|data-create-action|data-insight)/);
 assert.equal((app.innerHTML.match(/class="v2-nav-item/g)||[]).length,4);
 assert.match(app.innerHTML,/aisg-logo\.webp/);
 assert.match(app.innerHTML,/fictional/i);
});
test('class page gives read-only student roster, recent assessments, MAP and support guidance',()=>{
 routeTo('#/class/G7-A');
 assert.match(app.innerHTML,/CLASS ROSTER/);
 assert.match(app.innerHTML,/Recent assessment/);
 assert.match(app.innerHTML,/MAP Mathematics growth/);
 assert.match(app.innerHTML,/Support tags/);
 assert.match(app.innerHTML,/data-target-tab="support"/);
 assert.match(app.innerHTML,/Attendance/);
 assert.match(app.innerHTML,/DEMO-0721/);
 assert.doesNotMatch(app.innerHTML,/(Flexible groups|data-group-student|data-create-action|DECISION RULE)/);
});
test('launch student profile has academic evidence and guidance without action prompts',()=>{
 routeTo('#/student/DEMO-0721');
 assert.match(app.innerHTML,/Recent learning timeline/);
 assert.match(app.innerHTML,/ACADEMIC SNAPSHOT/);
 assert.match(app.innerHTML,/Classroom guidance/);
 assert.doesNotMatch(app.innerHTML,/(Learning follow-ups|New follow-up|Record teaching response|data-create-action)/);
 routeTo('#/student/DEMO-0721/map');
 assert.match(app.innerHTML,/Observed MAP growth/);
 assert.match(app.innerHTML,/RIT achievement/);
 routeTo('#/student/DEMO-0721/attendance');
 assert.match(app.innerHTML,/Attendance and punctuality timeline/);
 routeTo('#/student/DEMO-0721/support');
 assert.match(app.innerHTML,/Practical guidance/);
});
test('MAP growth retains subject select and progress-first comparison',()=>{
 routeTo('#/growth');
 assert.match(app.innerHTML,/Progress before position/);
 assert.match(app.innerHTML,/Met \/ exceeded projection/);
 assert.match(app.innerHTML,/Mathematics/);
 assert.match(app.innerHTML,/Growth by teaching group/);
 assert.doesNotMatch(app.innerHTML,/data-create-action/);
});
test('legacy Pulse and Actions routes return to Home without revealing archived features',()=>{
 routeTo('#/today');assert.match(app.innerHTML,/Find what you need/);
 routeTo('#/actions');assert.match(app.innerHTML,/Find what you need/);
 assert.doesNotMatch(app.innerHTML,/v2-action-card/);
});
test('changing teacher demo persona keeps students scoped to selected imaginary groups',()=>{
 const other=launch.data.teachers.find(t=>t.name==='Karen Robb');
 handlers['app-change']({target:{id:'v2-faculty',value:other.id}});
 routeTo('#/home');assert.match(app.innerHTML,/Karen Robb/);
 routeTo('#/student/DEMO-0721');assert.match(app.innerHTML,/Outside current demo scope/);
});
