import test from 'node:test';
import assert from 'node:assert/strict';
import {facultyId} from '../src/faculty-demo.mjs';

const handlers={};
const app={innerHTML:'',addEventListener(name,fn){handlers[name]=fn}};
globalThis.document={getElementById(id){return id==='app'?app:null},querySelector(){return null},activeElement:null};
globalThis.localStorage={getItem(){return null},setItem(){}};
globalThis.location={hash:'#/overview'};
globalThis.window={addEventListener(name,fn){handlers[`window-${name}`]=fn},scrollTo(){}};
await import('../src/app.js');
test('dashboard renders supplied AISG logo and 20 fictional learners in default assigned class',()=>{
 assert.match(app.innerHTML,/aisg-logo\.webp/);
 assert.match(app.innerHTML,/My Learners/);
 assert.match(app.innerHTML,/20 learners/);
 assert.match(app.innerHTML,/DEMO DATA/);
});
test('class roster route renders navigable profiles',()=>{
 location.hash='#/classes';handlers['window-hashchange']();
 assert.match(app.innerHTML,/Learner Roster/);
 assert.match(app.innerHTML,/DEMO-/);
 assert.match(app.innerHTML,/View profile/);
});
test('learner profile route exposes all five information tabs and simulated data',()=>{
 location.hash='#/student/DEMO-0721'; // 721 is G7-A, in default teacher scope
 handlers['window-hashchange']();
 assert.match(app.innerHTML,/LEARNER PROFILE/);
 assert.match(app.innerHTML,/MAP Growth/);
 assert.match(app.innerHTML,/Academic Learning/);
 assert.match(app.innerHTML,/Attendance/);
 assert.match(app.innerHTML,/Classroom Support/);
 assert.match(app.innerHTML,/FICTIONAL PROFILE/);
});
test('unassigned learner link does not reveal a student profile',()=>{
 location.hash='#/student/DEMO-0001';handlers['window-hashchange']();
 assert.match(app.innerHTML,/not in the selected teacher/);
 assert.doesNotMatch(app.innerHTML,/Learner at a Glance/);
});
test('MAP, academic, attendance and support tabs render distinct profile content',()=>{
 location.hash='#/student/DEMO-0721';handlers['window-hashchange']();
 const tab=id=>handlers.click({target:{closest(sel){return sel==='[data-tab]'?{dataset:{tab:id}}:null}}});
 tab('map');assert.match(app.innerHTML,/MAP Growth — Progress Over Time/);assert.match(app.innerHTML,/Observed MAP growth/);assert.match(app.innerHTML,/Explore underlying RIT achievement and score history/);assert.match(app.innerHTML,/<polyline/);assert.match(app.innerHTML,/simulated, not official NWEA/i);
 tab('academic');assert.match(app.innerHTML,/Recent classroom assessments/);assert.match(app.innerHTML,/Criterion assessment/);
 tab('attendance');assert.match(app.innerHTML,/Attendance by Month/);
 tab('support');assert.match(app.innerHTML,/Privacy by Design/);
});
test('real AISG faculty names appear in fictional teacher selector',()=>{
 location.hash='#/overview';handlers['window-hashchange']();
 assert.match(app.innerHTML,/Zach Navarro/);
 assert.match(app.innerHTML,/Karen Robb/);
 assert.match(app.innerHTML,/My Observations/);
 assert.match(app.innerHTML,/Their demo classes, all learners and all learning data are fictional/);
 assert.match(app.innerHTML,/MAP Growth ≥ Projection/);
});
test('MAP observed growth is prominent and RIT is supporting information',()=>{
 location.hash='#/student/DEMO-0721';handlers['window-hashchange']();
 handlers.click({target:{closest(sel){return sel==='[data-tab]'?{dataset:{tab:'map'}}:null}}});
 const content=app.innerHTML;
 assert.match(content,/growth-summary/);
 assert.match(content,/Illustrative projected growth/);
 assert.match(content,/Difference from projection/);
 assert.match(content,/growth-period-list/);
 assert.match(content,/<details class="rit-details">/);
 assert.ok(content.indexOf('Observed MAP growth')<content.indexOf('Latest available RIT'));
});
test('switching to PK3 persona replaces current teacher and roster scope',()=>{
 handlers.change({target:{id:'teacher-switch',value:facultyId('Karen Robb')}});
 handlers['window-hashchange']();assert.match(app.innerHTML,/Grade|20 learners/);
 location.hash='#/student/DEMO-0721';handlers['window-hashchange']();assert.match(app.innerHTML,/not in the selected teacher/);
 location.hash='#/student/DEMO-0001';handlers['window-hashchange']();assert.match(app.innerHTML,/FICTIONAL PROFILE/);
});
