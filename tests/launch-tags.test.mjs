import test from 'node:test';
import assert from 'node:assert/strict';
import {hasDemoTag} from '../src/learner-tags.mjs';

const handlers={};
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))};
globalThis.sessionStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))};
const app={innerHTML:'',addEventListener:(key,fn)=>handlers['app-'+key]=fn,querySelector:()=>null};
globalThis.document={getElementById:id=>id==='app'?app:null,activeElement:null};
globalThis.location={hash:'#/home'};
globalThis.window={addEventListener:(key,fn)=>handlers['window-'+key]=fn,scrollTo(){}};
const launch=await import('../src/my-learners-launch.mjs');
const navigate=path=>{globalThis.location.hash=path;handlers['window-hashchange']()};
const clicked=(attr,record)=>({closest:selector=>selector===attr?{dataset:record}:null});

test('teacher class roster shows five clickable fictional support tag categories',()=>{
 navigate('#/class/G7-A');
 for(const tag of ['EAL','SS','IEP','Medical','Behavioural'])
  assert.ok(app.innerHTML.includes('>'+tag+'</'),tag+' badge should be visible');
 assert.match(app.innerHTML,/id="v2-support-filter"/);
 assert.match(app.innerHTML,/data-target-tab="support"/);
 navigate('#/learners');
 assert.match(app.innerHTML,/launch-learner-card-tags/);
 assert.match(app.innerHTML,/data-tag-focus="medical"/);
});
test('clicking a tag opens highlighted guidance and returning retains the class tag filter',()=>{
 const c=launch.data.classes.find(x=>x.id==='G7-A');
 const learner=c.studentIds.map(id=>launch.data.userIndex.get(id)).find(s=>hasDemoTag(s,'iep'));
 assert.ok(learner);
 navigate('#/class/G7-A');
 handlers['app-change']({target:{id:'v2-support-filter',value:'iep'}});
 assert.equal(launch.state.rosterFilter,'iep');
 handlers['app-click']({target:clicked('[data-open-student]',{
  openStudent:learner.id,targetTab:'support',tagFocus:'iep'
 })});
 handlers['window-hashchange']();
 assert.equal(launch.state.supportFocus,'iep');
 assert.equal(globalThis.location.hash,'#/student/'+learner.id+'/support/iep');
 assert.match(app.innerHTML,/data-support-detail="iep"/);
 assert.match(app.innerHTML,/learner-support-detail selected/);
 assert.match(app.innerHTML,/Useful classroom approaches/);
 handlers['app-click']({target:clicked('[data-return-profile]',{})});
 handlers['window-hashchange']();
 assert.equal(globalThis.location.hash,'#/class/G7-A');
 assert.equal(launch.state.rosterFilter,'iep');
});
