import test from 'node:test';
import assert from 'node:assert/strict';
import {experienceDialogContent} from '../src/experience-explain-modal.mjs';
test('class explanation shows exact selected scope, responses, three questions and methodology',()=>{
 const html=experienceDialogContent({metric:'engagement',scopeLabel:'Grade 7 · A',windowLabel:'Fall 2026',
  summary:{value:0.62,n:20,eligible:20},questions:[
   {question:'I am engaged during my classes.',value:0.60,favorable:65,n:20},
   {question:'I am interested in my classes.',value:0.65,favorable:70,n:20},
   {question:'I feel excited to participate in my classes.',value:0.61,favorable:60,n:20}
  ]});
 for(const text of ['How Engagement Is Calculated','+0.62</div>','20 of 20 eligible learners',
  'Strongly disagree','Disagree','Agree','Strongly agree',
  'mean of their three question scores','group index is the mean','65% answered Agree or Strongly agree',
  'Grade 7 · A','Fall 2026','not</strong> the percentage','data-experience-close']){
  assert.ok(html.includes(text),text);
 }
 assert.equal((html.match(/class="experience-question"/g)||[]).length,3);
});
test('learner explanation displays the exact individual response and does not invent favorable percentages',()=>{
 const html=experienceDialogContent({metric:'belonging',scopeLabel:'Demo learner',windowLabel:'Spring 2026',
  individual:true,summary:{value:0.33,n:1,eligible:1},questions:[
   {question:'I feel a sense of belonging.',points:1,label:'Agree'},
   {question:'Other students treat me with respect.',points:-1,label:'Disagree'},
   {question:'I feel supported.',points:1,label:'Agree'}
  ]});
 assert.match(html,/How Belonging Is Calculated/);
 assert.match(html,/Response: Disagree/);
 assert.doesNotMatch(html,/% answered Agree or Strongly agree/);
 assert.match(html,/Individual fictional check-in/);
});
test('HTML escapes learner-supplied text and rejects unknown metrics',()=>{
 const html=experienceDialogContent({scopeLabel:'<script>alert(1)</script>',
  questions:[{question:'Me & you <3',value:0,n:0}]});
 assert.ok(!html.includes('<script>'));
 assert.match(html,/Me &amp; you &lt;3/);
 assert.throws(()=>experienceDialogContent({metric:'risk'}),/Unknown/);
});
test('unavailable response cases show a dash rather than treating missing as zero',()=>{
 const html=experienceDialogContent({summary:{value:null,n:0,eligible:20},questions:[]});
 assert.match(html,/Not|0 of 20/);
 assert.match(html,/—<\/div>/);
});
