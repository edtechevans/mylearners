import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reportGradeBand,mypBestFitMarker} from '../src/report-card-signals.mjs';
import {makePreview,previewMarkup,installEvidencePreviewController} from '../src/evidence-previews.mjs';

const style=readFileSync(new URL('../src/evidence-legibility-sitewide.css',import.meta.url),'utf8');
const popupStyle=readFileSync(new URL('../src/evidence-previews.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

function luminance(hex){
 const x=hex.slice(1).match(/.{2}/g).map(c=>parseInt(c,16)/255)
  .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return .2126*x[0]+.7152*x[1]+.0722*x[2];
}
function ratio(foreground,background){
 const [a,b]=[luminance(foreground),luminance(background)].sort((x,y)=>y-x);
 return (a+.05)/(b+.05);
}
test('Every MYP band keeps the bright legend colours and readable ink',()=>{
 const bands=[
  {score:2,band:'band-low',fill:'#a6373f',ink:'#ffffff'},
  {score:4,band:'band-mid-low',fill:'#e4a15f',ink:'#172f38'},
  {score:5,band:'band-mid-high',fill:'#a6bd88',ink:'#172f38'},
  {score:6,band:'band-mid-high',fill:'#a6bd88',ink:'#172f38'},
  {score:7,band:'band-high',fill:'#246b4f',ink:'#ffffff'}
 ];
 for(const v of bands){
  assert.equal(reportGradeBand(v.score,'1–7'),v.band);
  assert.ok(ratio(v.ink,v.fill)>=4.5, 'Text contrast for grade '+v.score);
  const token=new RegExp('evidence-report-grade\\.'+v.band+'\\s*\\{[^}]*'+v.fill.replace('#','\\#'),'m');
  assert.match(style,token,'Missing bright background for '+v.band);
  assert.ok(style.includes('--landing-grade-ink:'+v.ink));
 }
 assert.equal(reportGradeBand('Developing','E/P/D/B'),null,'PYP grades do not receive MYP colours');
 assert.match(mypBestFitMarker({mypBestFit:true,provisional:true}),/myp-best-fit-marker/);
});
test('Solid colours apply to every Faculty everyday class and never other metrics or focused views',()=>{
 assert.match(app, /class-evidence-result evidence-report-grade/);
 assert.match(style,/data-workspace="faculty"/);
 assert.match(style,/data-roster-layout="everyday".*?\.evidence-report-grade\.band-low/s);
 assert.match(style,/\.evidence-cell-open \.class-evidence-result\.evidence-report-grade\.evidence-heat/);
 assert.doesNotMatch(style,/data-roster-layout="focused"[^{]*\.evidence-report-grade/);
 assert.ok(index.includes('evidence-legibility-sitewide.css?v=20261112vivid1'));
 assert.ok(index.includes('evidence-previews.css?v=20261112q3scroll1'));
});
test('All three questions render even when scroll area is viewport-constrained',()=>{
 const detail={windowLabel:'Fall 2026',individual:false,value:.46,n:539,eligible:560,
  groups:[{label:'Secondary',value:.46,n:539,eligible:560,
   questions:['Q1','Q2','Q3'].map((q,i)=>({question:q+' statement',n:539,favorable:65+i,
    choices:[{label:'Strongly disagree',count:10},{label:'Disagree',count:180},
     {label:'Agree',count:260},{label:'Strongly agree',count:89}]}))}]};
 const markup=previewMarkup(makePreview({title:'Engagement',kind:'experience',
  trend:{points:[{label:'Fall 2025',value:'-0.08'},{label:'Fall 2026',value:'+0.46'}]},
  experienceDetail:detail}));
 for(const question of ['Q1','Q2','Q3']) assert.ok(markup.includes(question+' statement'));
 assert.match(popupStyle,/overscroll-behavior:contain/);
 assert.match(popupStyle,/scrollbar-color:#678ba2/);
});
test('Scrolling a long question popup does not close it; page scrolling still dismisses',()=>{
 const onRoot={},onWindow={},onDoc={},attrs=new Map(),classes=new Set(),inserted=[];
 let dismissed=false,focused=false;
 const popup={
  id:'',style:{},offsetWidth:420,offsetHeight:610,scrollHeight:800,clientHeight:500,
  scrollTop:0,
  classList:{
   toggle(name,value){if(value)classes.add(name);else classes.delete(name)},
   contains(name){return classes.has(name)}
  },
  addEventListener(){},
  setAttribute(name,value){attrs.set(name,value)},
  removeAttribute(name){attrs.delete(name)},
  remove(){dismissed=true},
  querySelector(selector){return selector==='.evidence-preview-questions'?
   {prepend(child){inserted.push(child)}}:null},
  contains(el){return el===popup||inserted.includes(el)},
  focus(){focused=true}
 };
 const body={appendChild(){return popup}};
 globalThis.document={
  body,createElement(tag){return tag==='p'?{textContent:'',className:''}:popup},
  addEventListener(name,handler){onDoc[name]=handler}
 };
 globalThis.window={
  innerWidth:1200,innerHeight:780,
  addEventListener(name,handler){onWindow[name]=handler}
 };
 const root={addEventListener(name,handler){onRoot[name]=handler}};
 const item={dataset:{evidencePreview:'leader-experience'},setAttribute(){},
  removeAttribute(){},
  getBoundingClientRect(){return {left:420,top:230,width:160,height:75,bottom:305}},
  contains(n){return n===item}};
 const ctrl=installEvidencePreviewController(root,()=>makePreview({
  title:'Engagement',kind:'experience',
  experienceDetail:{groups:[{questions:[{question:'1'},{question:'2'},{question:'3'}]}]}
 }));
 onRoot.focusin({target:{closest(){return item}}});
 assert.ok(classes.has('is-question-scrollable'));
 assert.equal(attrs.get('role'),'region');
 assert.equal(inserted.length,1,'Overlong content gets a visible scroll hint');
 onWindow.scroll({target:popup});
 assert.equal(dismissed,false,'Internal popup scroll must not dismiss the preview');
 const key={key:'F2',target:item,preventDefault(){this.prevented=true}};
 onRoot.keydown(key);
 assert.equal(focused,true,'F2 lets keyboard users focus the scroll region');
 assert.equal(key.prevented,true);
 onWindow.scroll({target:globalThis.document});
 assert.equal(dismissed,false,'Pinned keyboard reading keeps the popup open');
 onDoc.keydown({key:'Escape'});
 assert.equal(dismissed,true,'Escape dismisses the focused preview');
 ctrl.dismiss();
});
