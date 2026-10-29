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
