import test from 'node:test';
import assert from 'node:assert/strict';
const listeners={};
const app={innerHTML:'',addEventListener(name,handler){listeners['app-'+name]=handler}};
const saved=new Map();
globalThis.localStorage={getItem(k){return saved.has(k)?saved.get(k):null},setItem(k,v){saved.set(k,String(v))},removeItem(k){saved.delete(k)}};
globalThis.document={
 getElementById(id){return id==='app'?app:null},
 activeElement:null
};
globalThis.location={hash:'#/today'};
globalThis.window={
 addEventListener(name,handler){listeners['window-'+name]=handler},
 scrollTo(){},confirm(){return true}
};
const appModule=await import('../src/my-learners-v2.mjs');
const changeRoute=(hash)=>{globalThis.location.hash=hash;listeners['window-hashchange']()};
const selectTarget=(selector,data)=>({closest(query){return query===selector?{dataset:data}:null}});
test('new app boots into daily learning pulse with AISG logo and real faculty selector',()=>{
 assert.match(app.innerHTML,/aisg-logo\.webp/);
 assert.match(app.innerHTML,/Today’s Learning Pulse/);
 assert.match(app.innerHTML,/PREPARE FOR YOUR NEXT LESSON/);
 assert.match(app.innerHTML,/Zach Navarro/);
 assert.match(app.innerHTML,/DEMO/);
 assert.match(app.innerHTML,/class assignments/i);
});
test('Class Pulse navigation, student matrix, temporary groups and teacher-scoped pages work',()=>{
 changeRoute('#/class');
 assert.match(app.innerHTML,/Class Pulse/);
 assert.match(app.innerHTML,/Learner matrix/);
 listeners['app-click']({target:selectTarget('[data-class-mode]',{classMode:'groups'})});
 assert.match(app.innerHTML,/Reset suggestions/);
 changeRoute('#/learners');
 assert.match(app.innerHTML,/My Learners/);
 changeRoute('#/student/DEMO-0721');
 assert.match(app.innerHTML,/FICTIONAL LEARNER PROFILE/);
 assert.match(app.innerHTML,/Recent learning timeline/);
});
test('Growth and Evidence page leads with growth and other stages of learning',()=>{
 changeRoute('#/growth');
 assert.match(app.innerHTML,/Progress before position/);
 assert.match(app.innerHTML,/Growth by teaching group/);
 changeRoute('#/student/DEMO-0721');
 listeners['app-click']({target:selectTarget('[data-student-tab]',{studentTab:'map'})});
 assert.match(app.innerHTML,/Observed MAP growth/);
 assert.match(app.innerHTML,/Explore underlying RIT achievement/);
 listeners['app-click']({target:selectTarget('[data-subject]',{subject:'Reading'})});
 assert.match(app.innerHTML,/Reading/);
});
test('Action modal opens from class and records an evidence-backed instructional note',()=>{
 changeRoute('#/actions');
 assert.match(app.innerHTML,/Notice → Respond → Revisit/);
 changeRoute('#/class');
 listeners['app-click']({target:selectTarget('[data-create-action]',{createAction:'G7-A',actionStudent:'',actionEvidence:'Demo formative check'})});
 assert.match(app.innerHTML,/v2-create-form/);
 assert.match(app.innerHTML,/TEACHER REFLECTION/);
 const fields={classId:'G7-A',studentId:'',title:'Revisit fractions',strategy:'Use small-group modelling and check for understanding.',due:'2026-10-12',evidence:'Demo check'};
 const fakeForm={id:'v2-create-form',elements:{namedItem(name){return {value:fields[name]}}}};
 listeners['app-submit']({target:fakeForm,preventDefault(){}});
 changeRoute('#/actions');
 assert.match(app.innerHTML,/Revisit fractions/);
 assert.match(app.innerHTML,/In progress/);
});
test('teacher switching changes fictional assigned scope and denies unrelated learner profile',()=>{
 listeners['app-change']({target:{id:'v2-faculty',value:appModule.data.teachers.find(t=>t.name==='Karen Robb').id}});
 changeRoute('#/today');
 assert.match(app.innerHTML,/Karen Robb/);
 changeRoute('#/student/DEMO-0721');
 assert.match(app.innerHTML,/Outside current demo scope/);
 assert.doesNotMatch(app.innerHTML,/Recent learning timeline/);
});