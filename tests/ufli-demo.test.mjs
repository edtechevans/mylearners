import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {UFLI_GROUPS,UFLI_PHASES,UFLI_SOURCE_URL,ufliLessonGroup,ufliLessonPhase,
 ufliLessonFor,renderUfliLessonTile,renderUfliLegend} from '../src/ufli-demo.mjs';
import {resolveEvidencePreview} from '../src/evidence-preview-context.mjs';
const data=generateDemoData();
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=get('src/student-experience-app.mjs'),css=get('src/ufli-demo.css'),html=get('index.html');

function lum(value){
 const channels=value.slice(1).match(/.{2}/g).map(c=>parseInt(c,16)/255)
  .map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4));
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
const ratio=(a,b)=>{const [hi,lo]=[lum(a),lum(b)].sort((a,b)=>b-a);return (hi+.05)/(lo+.05)};

test('Official lesson scope is 1-128 with exact topic boundaries and no gaps',()=>{
 assert.deepEqual(UFLI_GROUPS.map(x=>[x.start,x.end]),[[1,34],[35,68],[69,98],[99,128]]);
 assert.equal(UFLI_PHASES[0].start,1);
 assert.equal(UFLI_PHASES.at(-1).end,128);
 assert.equal(UFLI_PHASES.length,15);
 for(let n=1;n<=128;n++){
  assert.equal(UFLI_PHASES.filter(x=>n>=x.start&&n<=x.end).length,1,'topic '+n);
  assert.equal(UFLI_GROUPS.filter(x=>n>=x.start&&n<=x.end).length,1,'group '+n);
  assert.ok(ufliLessonPhase(n)?.label);
  assert.ok(ufliLessonGroup(n)?.label);
 }
 for(const invalid of [0,129,3.5,null,'42',NaN,-2]){
  assert.equal(ufliLessonGroup(invalid),null);
  assert.equal(ufliLessonPhase(invalid),null);
 }
 assert.equal(ufliLessonPhase(42).label,'Digraphs');
 assert.equal(ufliLessonPhase(54).label,'Vowel-consonant-e (VCe)');
 assert.equal(ufliLessonPhase(84).label,'Long vowel teams');
 assert.equal(ufliLessonPhase(99).label,'Suffixes & prefixes');
});
test('K-5 each have a reproducible fictional UFLI lesson; PK and G6+ have none',()=>{
 const eligible=data.students.filter(s=>s.grade==='K'||/^G[1-5]$/.test(s.grade));
 const notEligible=data.students.filter(s=>!eligible.includes(s));
 assert.ok(eligible.length>200);
 for(const s of eligible){
  const a=ufliLessonFor(s),b=ufliLessonFor(s);
  assert.deepEqual(a,b);
  assert.ok(a.lesson>=1&&a.lesson<=128);
  assert.match(a.code,/^L\d{3}$/);
  assert.equal(a.group,ufliLessonGroup(a.lesson));
  assert.equal(a.phase,ufliLessonPhase(a.lesson));
  assert.match(renderUfliLessonTile(s),new RegExp(a.code));
 }
 for(const s of notEligible)assert.equal(ufliLessonFor(s),null,s.grade);
 for(const bad of [null,{}, {id:'demo',grade:''},{id:'demo',grade:'G10'}])
  assert.equal(ufliLessonFor(bad),null);
 assert.ok(new Set(eligible.map(s=>ufliLessonFor(s).group.id)).size===4,'All four group colours shown in demo');
});
test('Every K-5 Faculty class gets the UFLI column; no PK or secondary columns',()=>{
 for(const grade of ['K','G1','G2','G3','G4','G5']){
  const cols=everydayEvidenceForGrade(grade);
  assert.equal(cols.filter(c=>c.kind==='ufli').length,1,grade);
  assert.equal(cols[2].id,'ufli',grade);
  assert.equal(cols[0].id,'attendance');
  assert.equal(cols[1].id,'screener');
 }
 for(const grade of ['PK3','PK4','G6','G7','G10','G12'])
  assert.equal(everydayEvidenceForGrade(grade).some(c=>c.kind==='ufli'),false,grade);
 assert.match(app,/column.kind==='ufli'/);
 assert.match(app,/ufliLessonFor\(student\)\?\.lesson/);
 assert.match(app,/data-evidence-preview="ufli"/);
 assert.match(app,/renderUfliLegend\(\)/);
 assert.match(app,/renderUfliLessonTile\(s,\{compact:true\}\)/);
 assert.match(app,/roster-col-ufli/);
 assert.match(html,/ufli-demo\.css\?v=20261113ufli1/);
});
test('Four categorical colours meet WCAG AA and have explanatory legend with primary source',()=>{
 for(const group of UFLI_GROUPS){
  assert.ok(ratio(group.ink,group.color)>=4.5,group.label);
  assert.match(css,new RegExp('ufli-stage-'+group.id));
 }
 const legend=renderUfliLegend();
 assert.match(legend,/not achievement bands/);
 assert.match(legend,/K–2/);
 assert.match(legend,/Grades 3–5/);
 assert.match(legend,/View UFLI scope & sequence/);
 assert.ok(legend.includes(UFLI_SOURCE_URL));
 assert.ok(UFLI_SOURCE_URL.endsWith('/UFLI-Scope2.pdf'));
});
test('Role-scoped hover reveals exact lesson topic with synthetic-data caution',()=>{
 const student=data.students.find(s=>s.grade==='G3');
 const ctx={role:'faculty',data,allowedStudentIds:[student.id],
  allowedClassIds:[student.classId],state:{classId:student.classId}};
 const preview=resolveEvidencePreview({dataset:{evidencePreview:'ufli',previewStudent:student.id}},ctx);
 const lesson=ufliLessonFor(student);
 assert.equal(preview.title,'UFLI Foundations · '+lesson.code);
 assert.deepEqual(preview.rows.map(x=>x[1]),[
  lesson.lesson+' of 128',lesson.phase.label,
  lesson.group.label+' · '+lesson.group.start+'–'+lesson.group.end,
  'UFLI Foundations K–2 sequence; placement fictional',
  '2026–27 demo snapshot, not a test date'
 ]);
 assert.match(preview.note,/not a reading proficiency level/);
 assert.equal(resolveEvidencePreview(
  {dataset:{evidencePreview:'ufli',previewStudent:student.id}},
  {...ctx,allowedStudentIds:[]}),null);
 assert.equal(resolveEvidencePreview(
  {dataset:{evidencePreview:'ufli',previewStudent:student.id}},
  {...ctx,role:'leader'}),null);
});
