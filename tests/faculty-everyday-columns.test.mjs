import test from 'node:test';
import assert from 'node:assert/strict';
import {everydayEvidenceForGrade,validRosterView} from '../src/faculty-everyday-columns.mjs';
test('Faculty landing shows grade-appropriate evidence including MAP RIT',()=>{
 for(const grade of ['PK3','PK4','K','G1','G2','G3','G5','G6','G7','G10','G11','G12']){
  const cols=everydayEvidenceForGrade(grade);
  assert.ok(cols.length>=5&&cols.length<=9,grade);
  assert.equal(new Set(cols.map(x=>x.id)).size,cols.length,grade);
  assert.equal(cols[0].id,'attendance',grade);
  assert.equal(cols[1].id,'screener',grade);
  assert.equal(cols.some(c=>c.kind==='ufli'),grade==='K'||/^G[1-5]$/.test(grade),grade);
  if(!['G3','G5','G6','G7','G10'].includes(grade))assert.ok(cols.some(x=>x.kind==='report'),grade);
 }
});
test('Middle grades see MAP Reading, Math, Language Usage RIT, IXL and Student Experience',()=>{
 const cols=everydayEvidenceForGrade('G7');
 assert.deepEqual(cols.map(x=>x.id),['attendance','screener','mapReading','mapMathematics','mapLanguage','ixl','engagement','belonging']);
 assert.ok(!cols.some(c=>c.kind==='map'));
});
test('Primary and upper Secondary do not show assessments outside eligible grade bands',()=>{
 assert.deepEqual(everydayEvidenceForGrade('K').map(x=>x.id),
  ['attendance','screener','ufli','math','core','fp']);
 assert.deepEqual(everydayEvidenceForGrade('G2').map(x=>x.id),
  ['attendance','screener','ufli','math','core','fp','ixl']);
 assert.deepEqual(everydayEvidenceForGrade('G12').map(x=>x.id),
  ['attendance','screener','math','engagement','belonging','maia']);
 assert.equal(everydayEvidenceForGrade('PK3').some(x=>x.kind==='engagement'),false);
});
test('Unknown layout selection falls back to everyday view',()=>{
 assert.equal(validRosterView(''), 'everyday');
 assert.equal(validRosterView('focused'),'focused');
 assert.equal(validRosterView('arbitrary'),'everyday');
});
