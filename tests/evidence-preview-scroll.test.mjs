import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installEvidencePreviewController,makePreview} from '../src/evidence-previews.mjs';

const css=readFileSync(new URL('../src/evidence-previews.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('all evidence popups have a bounded scroll viewport and visible overflow cue',()=>{
 assert.match(css,/\.evidence-preview-scroll-pane\s*\{/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/overscroll-behavior:contain/);
 assert.match(css,/touch-action:pan-y/);
 assert.match(css,/\.evidence-preview-scroll-cue\[hidden\]\{display:none!important\}/);
 assert.match(css,/max-height:min\(760px,calc\(100dvh - 24px\)\)/);
 assert.match(index,/evidence-previews\.css\?v=20261112scroll1/);
});
test('internal scrolling keeps Q3 accessible; keyboard, focus and external dismissal still work',()=>{
 const rootEvents={},docEvents={},windowEvents={};
 const paneEvents={},popupEvents={},attrs=new Map();
 const pane={
  innerHTML:'',scrollTop:0,scrollHeight:1400,clientHeight:300,
  addEventListener(type,fn){paneEvents[type]=fn},
  setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},
  contains(target){return target===this}
 };
 const cue={hidden:true};
 let removed=false;
 const popup={
  className:'',id:'',style:{},offsetHeight:590,offsetWidth:430,
  innerHTML:'',setAttribute(k,v){attrs.set(k,v)},
  removeAttribute(k){attrs.delete(k)},
  addEventListener(type,fn){popupEvents[type]=fn},
  querySelector(selector){return selector==='.evidence-preview-scroll-pane'?pane:
   selector==='.evidence-preview-scroll-cue'?cue:null},
  contains(target){return target===this||target===pane||target===cue},
  remove(){removed=true}
 };
 const anchor={
  dataset:{evidencePreview:'experience-summary'},
  getBoundingClientRect(){return {top:270,bottom:320,left:200,width:210}},
  closest(selector){return selector==='[data-evidence-preview]'?this:null},
  contains(target){return target===this},
  setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},
  focus(){this.focused=true}
 };
 const root={addEventListener(type,fn){rootEvents[type]=fn}};
 globalThis.document={
  activeElement:null,
  body:{appendChild(){return popup}},
  createElement(type){assert.equal(type,'div');return popup},
  addEventListener(type,fn){docEvents[type]=fn}
 };
 globalThis.window={innerWidth:1280,innerHeight:720,
  addEventListener(type,fn){windowEvents[type]=fn}};
 const details={
  windowLabel:'Fall 2026',individual:false,n:50,eligible:55,value:.46,
  groups:[{label:'Secondary',value:.46,n:50,eligible:55,
   questions:[1,2,3].map(i=>({
    question:'Question '+i,n:50,favorable:60,choices:[
     {label:'Strongly disagree',count:1},
     {label:'Disagree',count:14},
     {label:'Agree',count:25},
     {label:'Strongly agree',count:10}]
   }))}]
 };
 const control=installEvidencePreviewController(root,
  ()=>makePreview({title:'Engagement',kind:'experience',experienceDetail:details}));
 rootEvents.focusin({target:anchor});
 assert.match(pane.innerHTML,/Question 3/,'Third question remains in the markup');
 assert.equal(attrs.get('role'),'region');
 assert.equal(pane.tabindex,'0');
 assert.equal(cue.hidden,false,'Overflow is signposted');
 assert.equal(anchor['aria-describedby'],'evidence-preview-active');
 assert.ok(Number.parseFloat(popup.style.top)>=8,'Viewport-safe positioning');
 // A nested scroll event also bubbles to the window capture listener: it
 // MUST NOT dismiss the popup, as previously happened on question three.
 pane.scrollTop=200;
 paneEvents.scroll({target:pane});
 windowEvents.scroll({target:pane});
 assert.equal(removed,false);
 assert.equal(anchor['aria-describedby'],'evidence-preview-active');
 rootEvents.focusout({target:anchor,relatedTarget:pane});
 popupEvents.focusin({target:pane});
 assert.equal(removed,false,'Tabbing into the scroll pane keeps it open');
 let prevented=false;
 docEvents.keydown({key:'PageDown',target:pane,preventDefault(){prevented=true}});
 assert.ok(prevented);
 assert.ok(pane.scrollTop>200);
 pane.scrollTop=1100;
 paneEvents.scroll({target:pane});
 assert.equal(cue.hidden,true,'Cue hides after the final question');
 pane.scrollTop=0;
 docEvents.keydown({key:'End',target:anchor,preventDefault(){}});
 assert.equal(cue.hidden,true,'Keyboard End reaches the bottom');
 // Only scrolling elsewhere on the dashboard dismisses an unpinned popup.
 windowEvents.scroll({target:root});
 assert.equal(removed,true);
 control.dismiss();
});
