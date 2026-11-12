import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperienceRecords,experienceFor,EXPERIENCE_SCALE} from '../src/experience-data.mjs';
import {buildExperienceQuestionPreview} from '../src/experience-question-preview.mjs';
import {makePreview,previewMarkup} from '../src/evidence-previews.mjs';

const students=[
 {id:'test-g3-a',name:'Example G3',grade:'G3',division:'Elementary'},
 {id:'test-g4-b',name:'Example G4',grade:'G4',division:'Elementary'},
 {id:'test-g7-a',name:'Example G7',grade:'G7',division:'Secondary'},
 {id:'test-g8-b',name:'Example G8',grade:'G8',division:'Secondary'},
 {id:'test-g10-c',name:'Example G10',grade:'G10',division:'Secondary'}
];
const records=createExperienceRecords(students);

test('Individual hover uses each exact recorded question, label and point value',()=>{
 const student=students.find(s=>experienceFor(records,s.id,'engagement','F26'));
 assert.ok(student);
 const preview=buildExperienceQuestionPreview(records,[student],'engagement','F26',
  {individual:true,scopeLabel:student.name});
 const items=experienceFor(records,student.id,'engagement','F26').items;
 assert.equal(preview.individual,true);
 assert.equal(preview.n,1);
 assert.deepEqual(preview.groups[0].questions.map(q=>q.label),items.map(q=>q.label));
 assert.deepEqual(preview.groups[0].questions.map(q=>q.points),items.map(q=>q.points));
 const html=previewMarkup(makePreview({title:'Engagement',kind:'experience',experienceDetail:preview}));
 assert.match(html,/Response:/);
 for(const item of items)assert.ok(html.includes(item.question));
});

test('Group hover reports exact response-option counts, without student identities',()=>{
 const preview=buildExperienceQuestionPreview(records,students.filter(s=>s.division==='Secondary'),
  'belonging','F26',{scopeLabel:'Secondary'});
 assert.equal(preview.individual,false);
 assert.equal(preview.groups.length,1);
 for(const question of preview.groups[0].questions){
  assert.deepEqual(question.choices.map(x=>x.label),EXPERIENCE_SCALE.map(x=>x.label));
  assert.equal(question.choices.reduce((sum,x)=>sum+x.count,0),question.n);
  assert.ok(question.favorable===null||question.favorable>=0&&question.favorable<=100);
 }
 const html=previewMarkup(makePreview({title:'Belonging',kind:'experience',experienceDetail:preview}));
 assert.match(html,/Strongly disagree/);
 assert.match(html,/Strongly agree/);
 assert.doesNotMatch(html,/Example G7|Example G8|Example G10/);
});

test('Mixed school population separates Elementary and Secondary question wording',()=>{
 const preview=buildExperienceQuestionPreview(records,students,'belonging','F26',
  {scopeLabel:'Whole school'});
 assert.deepEqual(preview.groups.map(x=>x.label),['Elementary','Secondary']);
 assert.match(preview.groups[0].questions[1].question,/kind to me/);
 assert.match(preview.groups[1].questions[1].question,/respect/);
 const html=previewMarkup(makePreview({title:'Belonging',kind:'experience',experienceDetail:preview}));
 assert.match(html,/Elementary/);
 assert.match(html,/Secondary/);
 assert.match(html,/Separate question sets/);
});

test('Missing records are not treated as zero responses',()=>{
 const preview=buildExperienceQuestionPreview(records,[students[0]],'engagement','F25',
  {individual:true});
 assert.equal(preview.value,null);
 assert.equal(preview.n,0);
 assert.ok(preview.groups[0].questions.every(q=>q.label==='Not recorded'));
 assert.equal(buildExperienceQuestionPreview(records,students,'invalid'),null);
});
