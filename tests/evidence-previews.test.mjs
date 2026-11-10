import test from 'node:test';
import assert from 'node:assert/strict';
import {PREVIEW_GUIDE,makePreview,previewMarkup,decorateEvidencePreviews} from '../src/evidence-previews.mjs';
test('every school assessment has a restrained explanation',()=>{
 for(const id of ['report','map','ixl','core','fp','engagement','belonging','attendance','flourishing','wida','sss','coverage','mapgrowth','review','ibdp']){
  assert.ok(PREVIEW_GUIDE[id]?.description,id);
 }
});
test('previews escape content, keep values separate and never infer a diagnosis',()=>{
 const view=makePreview({title:'Student <Example>',rows:[['Learning & score','5 / 7'],['Date','2025–26']],note:'No <script>'});
 const html=previewMarkup(view);
 assert.match(html,/Student &lt;Example&gt;/);
 assert.match(html,/Learning &amp; score/);
 assert.ok(!html.includes('<script>'));
 assert.equal(view.rows.length,2);
});
test('previews strictly limit details and reject unsupported categories',()=>{
 const v=makePreview({title:'Example',kind:'javascript',rows:Array.from({length:10},(_,i)=>['Item'+i,i])});
 assert.equal(v.kind,'neutral');assert.equal(v.rows.length,5);
});
test('safe no-op in unit tests without a DOM (app shell is tested separately)',()=>{
 assert.doesNotThrow(()=>decorateEvidencePreviews(null,'faculty'));
 assert.doesNotThrow(()=>decorateEvidencePreviews({},'board'));
});

test('compact progress cards highlight only real windows, without extra narrative',()=>{
 const view=makePreview({title:'Mathematics',subtitle:'Wei Example',kind:'academic',
  trend:{points:[
   {label:'2024–25',value:'5'},{label:'2025–26',value:'6'},
   {label:'2026–27',value:'7'}],
   change:{value:'+1 grade points',from:'2025–26'}},
  note:''});
 const html=previewMarkup(view);
 assert.equal(view.trend.points.length,3);
 assert.match(html,/evidence-preview-progress/);
 assert.equal((html.match(/evidence-preview-period/g)||[]).length,4);
 assert.match(html,/evidence-preview-period is-current/);
 assert.match(html,/\+1 grade points/);
 assert.match(html,/vs 2025–26/);
 assert.doesNotMatch(html,/assessment context|synthetic|not issued|report card thresholds/i);
 assert.doesNotMatch(html,/<p>/);
});
test('timeline sanitisation limits to latest three periods and escapes arbitrary values',()=>{
 const p=makePreview({title:'<Sample>',trend:{points:[
  {label:'Fall 2023',value:'1'},{label:'Fall 2024',value:'2'},
  {label:'Fall 2025',value:'<img src=x>'},{label:'Fall 2026',value:'4'}]}});
 const html=previewMarkup(p);
 assert.equal(p.trend.points.length,3);
 assert.doesNotMatch(html,/Fall 2023/);
 assert.match(html,/&lt;img src=x&gt;/);
 assert.doesNotMatch(html,/<img/);
});
