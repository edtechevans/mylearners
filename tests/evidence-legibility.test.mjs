import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor,facultyDemoReport} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {evidenceValue,evidenceRosterColumn} from '../src/class-evidence.mjs';
import {resolveEvidencePreview} from '../src/evidence-preview-context.mjs';

const css=readFileSync(new URL('../src/evidence-legibility-sitewide.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

function rgb(hex){
 const v=hex.replace('#','');
 return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>
  x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4));
}
function contrast(a,b){
 const l=v=>{const [r,g,b]=rgb(v);return r*.2126+g*.7152+b*.0722};
 const [hi,lo]=[l(a),l(b)].sort((x,y)=>y-x);
 return (hi+.05)/(lo+.05);
}
const theme={
 low:{bg:'#fff0f2',detail:'#783642'},
 'mid-low':{bg:'#fff3e5',detail:'#61472c'},
 'mid-high':{bg:'#f1f8e9',detail:'#365a40'},
 high:{bg:'#e6f4ed',detail:'#355849'}
};
test('Every evidence band meets WCAG AA normal-text contrast on its wash',()=>{
 for(const [band,{bg,detail}] of Object.entries(theme)){
  assert.ok(contrast('#172f3e',bg)>=4.5,band+' main text');
  assert.ok(contrast(detail,bg)>=4.5,band+' secondary text');
  assert.match(css,new RegExp('evidence-heat\\.band-'+band+'\\s*\\{[^}]*'+bg,'m'),band+' surface');
  assert.ok(css.includes(detail),band+' secondary ink');
 }
});
test('Sitewide correction loads after the former competing stylesheets',()=>{
 const pos=html.indexOf('evidence-legibility-sitewide.css?v=20261112legibility1');
 assert.ok(pos>html.indexOf('leader-support-directory.css'));
 assert.match(css,/\.class-evidence-result\.evidence-heat strong:not\(\.evidence-visually-hidden\)/);
 assert.match(css,/class-evidence-result\.evidence-heat small/);
 assert.match(css,/data-roster-layout="focused"/);
 assert.match(css,/data-roster-layout="everyday"/);
 assert.match(css,/prefers-reduced-motion/);
});
test('MAP and IXL status colours remain source-specific, with opaque legible labels',()=>{
 assert.match(css,/\.map-rit-tile :is\(strong,small\)/);
 assert.match(css,/\.ixl-diagnostic-tile :is\(strong,small\)/);
 assert.match(css,/opacity:1!important/);
});
test('Focused MYP report grade keeps the best-fit asterisk and full original evidence',()=>{
 const data=applyFacultyDemo(generateDemoData());
 const academic=createAcademicDemoRecords(data.students);
 const students=data.students.filter(s=>s.grade==='G7');
 const found=students.map(student=>{
  const report=facultyDemoReport(academicFor(academic,student.id));
  const item=report?.subjects?.find(x=>x.provisional&&x.mypBestFit);
  return item?{student,item}:null;
 }).find(Boolean);
 assert.ok(found,'Expected demo MYP learner with partial criteria');
 const ctx={academic,mode:'report',subject:found.item.subject,window:'F26'};
 const cell=evidenceRosterColumn(found.student,ctx);
 const detail=evidenceValue(found.student,ctx).detail;
 const small=(cell.match(/<small>([\s\S]*?)<\/small>/)||[])[1];
 assert.match(cell,/myp-best-fit-marker/);
 assert.match(small,/Current Best Fit .*\/4 criteria/);
 assert.doesNotMatch(small,/projected|not issued/);
 assert.ok(cell.includes('data-evidence-detail="'));
 assert.ok(cell.includes(detail),'Original evidence remains in accessible metadata');
 const teacher=data.teachers.find(t=>t.classIds.includes(found.student.classId));
 const preview=resolveEvidencePreview({
  dataset:{evidencePreview:'academic',previewStudent:found.student.id,
   previewMeasure:'report',evidenceSubject:found.item.subject,evidenceDetail:detail},
  querySelector(selector){return selector==='strong'?{textContent:String(found.item.value)}:null}
 },{role:'faculty',data,academic,experience:createExperienceRecords(data.students),
  allowedStudentIds:data.students.filter(s=>teacher.classIds.includes(s.classId)).map(s=>s.id),
  allowedClassIds:teacher.classIds,state:{studentId:found.student.id,academicSubject:found.item.subject}});
 assert.equal(preview.note,detail);
 assert.match(preview.rows[0][1],/^\d/);
});
test('Student experience summary is concise but preserves its check-in window',()=>{
 const data=applyFacultyDemo(generateDemoData());
 const student=data.students.find(s=>s.grade==='G7');
 const ctx={academic:createAcademicDemoRecords(data.students),
  experience:createExperienceRecords(data.students),mode:'engagement',window:'F26'};
 const cell=evidenceRosterColumn(student,ctx);
 assert.match(cell,/Fall 2026 · student voice index/);
 assert.match(cell,/data-evidence-detail=/);
});
