import test from 'node:test';
import assert from 'node:assert/strict';

const events={},dialogs=[];
const storage=new Map();
const st={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
const root={
 classList:{toggle(){}},
 innerHTML:'',
 addEventListener(name,handler){events[name]=handler},
 querySelector(){return null}
};
const body={
 classList:{toggle(){}},
 appendChild(dialog){dialog.isConnected=true;dialogs.push(dialog);return dialog}
};
globalThis.document={
 body,
 getElementById(id){return id==='app'?root:null},
 querySelector(){return null},
 createElement(tag){
  assert.equal(tag,'dialog');
  const listeners={};
  return {
   className:'',innerHTML:'',isConnected:false,open:false,
   setAttribute(){},addEventListener(name,fn){listeners[name]=fn},
   showModal(){this.open=true},
   close(){this.open=false;listeners.close?.()},
   remove(){this.isConnected=false},
   querySelector(){return {focus(){}}}
  };
 }
};
globalThis.localStorage=st;
globalThis.sessionStorage=st;
globalThis.location={hash:'#/faculty'};
globalThis.window={innerWidth:1440,addEventListener(){},scrollTo(){}};
await import('../src/student-experience-app.mjs');
function emitClick(selector,dataset){
 const item={dataset,isConnected:true,focus(){}};
 events.click({target:{closest(query){return query===selector?item:null}}});
 return dialogs.at(-1);
}
function change(key,value){
 const input={dataset:{select:key},value};
 events.change({target:{closest(query){return query==='[data-select]'?input:null}}});
}
test('Faculty quick tile opens a dialog for current class instead of inserting content below roster',()=>{
 const original=root.innerHTML;
 const dialog=emitClick('[data-action]',{action:'explain:faculty:engagement'});
 assert.ok(dialog.open,'modal opens');
 assert.match(dialog.innerHTML,/How Engagement Is Calculated/);
 assert.match(dialog.innerHTML,/Grade 7 · A/);
 assert.match(dialog.innerHTML,/20 of 20 eligible learners responded/);
 assert.equal((dialog.innerHTML.match(/class="experience-question"/g)||[]).length,3);
 assert.equal(root.innerHTML,original,'click does not cause a page rerender');
});
test('switching Faculty class updates the same popup with the new class data',()=>{
 change('class','G8-A');
 const dialog=emitClick('[data-action]',{action:'explain:faculty:belonging'});
 assert.match(dialog.innerHTML,/How Belonging Is Calculated/);
 assert.match(dialog.innerHTML,/Grade 8 · A/);
 assert.doesNotMatch(dialog.innerHTML,/Grade 7 · A/);
});
test('Faculty can explain individual scores using the selected response window',()=>{
 const id=(root.innerHTML.match(/data-student="([^"]+)"/)||[])[1];
 assert.ok(id,'student link available');
 emitClick('[data-student]',{student:id});
 const dialog=emitClick('[data-action]',{action:'explain:profile:engagement'});
 assert.match(dialog.innerHTML,/Individual fictional check-in/);
 assert.match(dialog.innerHTML,/Response: (Agree|Disagree|Strongly)/);
 assert.equal((dialog.innerHTML.match(/class="experience-question"/g)||[]).length,3);
});
test('Leader cards show distinct Elementary and Secondary question wording',()=>{
 emitClick('[data-role]',{role:'leader'});
 const elementary=emitClick('[data-action]',{action:'explain:elementary:belonging'});
 assert.match(elementary.innerHTML,/Elementary/);
 assert.match(elementary.innerHTML,/Other students are kind to me/);
 const secondary=emitClick('[data-action]',{action:'explain:secondary:engagement'});
 assert.match(secondary.innerHTML,/Secondary/);
 assert.match(secondary.innerHTML,/I am engaged during my classes/);
});
