import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {supportStatusForStudent} from '../src/learner-support-status.mjs';
import {demoTagsForStudent} from '../src/learner-tags.mjs';
import {supportBadgeContext,legacyBadgeContext,supportStatusBadges,legacySupportBadges} from '../src/learner-support-status-ui.mjs';
import {positionSupportTooltip,installSupportTagTooltips} from '../src/support-tag-tooltips.mjs';

const data=generateDemoData();
test('every visible support badge has meaningful accessible hover text',()=>{
 let checked=0;
 for(const student of data.students){
  const model=supportStatusForStudent(student);
  const badges=supportStatusBadges(student);
  const visible=(badges.match(/class="support-status-badge has-context/g)||[]).length;
  assert.equal(visible,model.badges.length);
  assert.equal((badges.match(/data-support-tip-description=/g)||[]).length,visible);
  assert.equal((badges.match(/tabindex="0"/g)||[]).length,visible);
  for(const badge of model.badges){
   const tip=supportBadgeContext(badge,model);
   assert.ok(tip.title&&tip.description.length>45&&tip.note);
   assert.ok(!/diagnosis of this learner|patient record/i.test(tip.description));
   checked++;
  }
 }
 assert.ok(checked>100,'demo contains many distinct references');
 const s=data.students.find(x=>supportStatusForStudent(x).badges.length);
 const nested=supportStatusBadges(s,{compact:true,interactive:false});
 assert.doesNotMatch(nested,/tabindex="0"|role="button"/);
 assert.match(nested,/data-support-tip="1"/);
});
test('EAL, SOC, medical, IEP and behavioural contexts preserve important distinctions',()=>{
 const eal={id:'eal-i3',fullName:'Intermediate 3',group:'eal'};
 const tier={id:'tier-2',fullName:'Learning Support Tier 2',group:'learning'};
 const soc={id:'sst-soc',fullName:'SOC',group:'sst'};
 assert.match(supportBadgeContext(eal).description,/English-language development/);
 assert.match(supportBadgeContext(tier).description,/not a measure of learner ability/);
 assert.match(supportBadgeContext(soc).note,/Definition pending/);
 for(const id of ['iep','medical','behavioural']){
  const t=data.students.flatMap(demoTagsForStudent).find(x=>x.id===id);
  assert.ok(t);
  const html=legacySupportBadges([t]);
  assert.match(html,/data-support-tip-description/);
  assert.match(html,/tabindex="0"/);
  assert.match(legacyBadgeContext(t).description,/.{20}/);
  if(t.restricted)assert.match(legacyBadgeContext(t).note,/Restricted category/);
 }
});
test('floating tooltip is clamped to the viewport and moves above tight lower edges',()=>{
 const left=positionSupportTooltip({left:-10,width:25,top:20,bottom:40},
  {width:310,height:150},{width:320,height:500});
 assert.equal(left.left,12);
 assert.equal(left.placement,'below');
 const right=positionSupportTooltip({left:295,width:35,top:20,bottom:45},
  {width:280,height:140},{width:320,height:500});
 assert.ok(right.left+280<=308);
 const bottom=positionSupportTooltip({left:90,width:40,top:480,bottom:508},
  {width:240,height:130},{width:320,height:550});
 assert.equal(bottom.placement,'above');
 assert.ok(bottom.top>=12&&bottom.top+130<=538);
 const narrow=positionSupportTooltip({left:5,width:20,top:20,bottom:40},
  {width:400,height:125},{width:285,height:420});
 assert.equal(narrow.left,12);
});
test('hover, focus, tap and Escape all control the same safe tooltip',()=>{
 const docBefore=globalThis.document,winBefore=globalThis.window;
 const listeners={};
 const mk=tag=>({
  tagName:tag,children:[],attrs:new Map(),style:{},dataset:{},hidden:false,
  appendChild(c){this.children.push(c)},
  setAttribute(k,v){this.attrs.set(k,v)},removeAttribute(k){this.attrs.delete(k)},
  getBoundingClientRect(){return {width:260,height:125,top:0,left:0,right:260,bottom:125}}
 });
 const added=[];
 globalThis.document={
  body:{appendChild(el){added.push(el)}},
  createElement:mk,documentElement:{clientWidth:330,clientHeight:650}
 };
 globalThis.window={innerWidth:330,innerHeight:650,addEventListener(){}};
 const root={addEventListener(type,handler){(listeners[type]??=[]).push(handler)}};
 const badge={
  isConnected:true,
  attrs:new Map(),
  dataset:{
   supportTipTitle:'EAL · Intermediate 3',
   supportTipDescription:'An English-language development reference, not a learning difficulty.',
   supportTipNote:'Demonstration only.'
  },
  closest(selector){return selector==='[data-support-tip]'?this:null},
  contains(target){return target===this},
  setAttribute(key,value){this.attrs.set(key,value)},
  removeAttribute(key){this.attrs.delete(key)},
  getBoundingClientRect(){return {left:296,top:160,width:24,height:25,bottom:185,right:320}}
 };
 const call=(type,event)=>{for(const handler of listeners[type]||[])handler(event)};
 try{
  const controller=installSupportTagTooltips(root);
  call('pointerover',{pointerType:'mouse',target:badge});
  assert.equal(added.length,1);
  assert.equal(added[0].hidden,false);
  assert.equal(added[0].children[0].textContent,'EAL · Intermediate 3');
  assert.ok(parseInt(added[0].style.left,10)<=58,'tip does not clip off the right edge');
  assert.equal(badge.attrs.get('aria-describedby'),'support-tag-tooltip');
  call('pointerout',{target:badge,relatedTarget:null});
  assert.equal(added[0].hidden,true);
  call('focusin',{target:badge});
  assert.equal(added[0].hidden,false);
  call('keydown',{target:badge,key:'Escape'});
  assert.equal(added[0].hidden,true);
  let captured=false;
  call('click',{target:badge,preventDefault(){captured=true},stopPropagation(){}});
  assert.equal(captured,true,'tap is handled before row navigation');
  assert.equal(added[0].hidden,false);
  assert.equal(badge.attrs.get('aria-expanded'),'true');
  call('click',{target:{closest(){return null}},preventDefault(){},stopPropagation(){}});
  assert.equal(added[0].hidden,true);
  controller.hide(true);
 }finally{
  globalThis.document=docBefore;globalThis.window=winBefore;
 }
});
