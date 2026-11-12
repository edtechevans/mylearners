import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {facultyRosterEvidenceColumns} from '../src/report-card-signals.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {
 FACULTY_SUBJECT_SHORT_NAMES,facultyHeaderInfo,facultyHeaderWidth,facultyRosterTableWidth
} from '../src/faculty-roster-headings.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/student-experience-app.mjs');
const css=read('src/faculty-roster-headings.css');
const ux=read('src/daily-ux.mjs');
const html=read('index.html');

test('Six Faculty subject headings are shortened with exact full hover wording',()=>{
 const expected=[
  ['Language & Literature','L&L','Language & Literature'],
  ['Language Acquisition','LA','Language Acquisition'],
  ['Mathematics','Math','Mathematics'],
  ['Individuals & Societies','I&S','Individuals & Societies'],
  ['Physical & Health Education','PHE','Physical & Health Education'],
  ['Arts','VPA','Visual & Performing Arts']
 ];
 assert.equal(Object.keys(FACULTY_SUBJECT_SHORT_NAMES).length,expected.length);
 for(const [subject,short,full] of expected){
  const info=facultyHeaderInfo({kind:'report',subject,label:subject});
  assert.deepEqual(info,{display:short,full,original:subject,abbreviated:true,singleWord:true});
  assert.ok(facultyHeaderWidth({kind:'report',subject,label:subject})>=100);
 }
});
test('Full report data labels remain unchanged in MYP roster, including Design',()=>{
 const demo=applyFacultyDemo(generateDemoData());
 const student=demo.students.find(s=>s.grade==='G7');
 assert.ok(student);
 const records=createAcademicDemoRecords(demo.students);
 const columns=facultyRosterEvidenceColumns(
  demo.students.filter(s=>s.classId===student.classId),records,everydayEvidenceForGrade('G7'));
 for(const subject of ['Language & Literature','Language Acquisition','Mathematics',
  'Individuals & Societies','Physical & Health Education','Arts']){
  const col=columns.find(c=>c.subject===subject&&c.kind==='report');
  assert.ok(col,subject+' source subject still present');
  assert.equal(col.label,subject,'Underlying source column must not be renamed');
  assert.ok(facultyHeaderInfo(col).abbreviated);
 }
 const design=columns.find(c=>c.subject==='Design');
 assert.ok(design);
 assert.equal(facultyHeaderInfo(design).display,'Design');
 assert.equal(facultyHeaderInfo({kind:'engagement',label:'Engagement · check-in'}).display,'Engagement');
 assert.equal(facultyHeaderInfo({kind:'belonging',label:'Belonging · check-in'}).display,'Belonging');
});
test('No single-word headers can split and table width accommodates all class subjects',()=>{
 for(const grade of ['K','G1','G4','G7','G10','G12']){
  const base=everydayEvidenceForGrade(grade);
  const roster=base;
  const total=facultyRosterTableWidth(roster);
  assert.ok(Number.isInteger(total)&&total>=1200);
  const subtotal=210+122+172+roster.slice(1).reduce((n,c)=>n+facultyHeaderWidth(c),0);
  assert.ok(total>=subtotal);
 }
 assert.ok(facultyHeaderWidth({kind:'engagement'})>=140);
 assert.ok(facultyHeaderWidth({kind:'belonging'})>=130);
 assert.match(css,/word-break:normal!important/);
 assert.match(css,/overflow-wrap:normal!important/);
 assert.match(css,/hyphens:none!important/);
 assert.match(css,/\.faculty-heading-text\.is-single-word\{\s*white-space:nowrap!important/);
 assert.match(css,/min-width:var\(--faculty-roster-table-width,1200px\)!important/);
 assert.match(app,/facultyRosterTableWidth\(everydayColumns\)/);
 assert.match(app,/facultyHeaderWidth\(column\)/);
 assert.match(app,/faculty-heading-text/);
});
test('Sort buttons and mouse/keyboard tooltip reveal original full name, preserving layout keys',()=>{
 assert.match(app,/data-full-heading/);
 assert.match(app,/data-source-heading/);
 assert.match(app,/title="'\+safe\(info.full\)/);
 assert.match(ux,/dataset\.sourceHeading\|\|label\(th\)/);
 assert.match(ux,/dataset\.fullHeading\|\|headers\[i\]/);
 assert.match(ux,/title="'\+safe\(fullName\)/);
 assert.match(ux,/aria-label="Sort by '\+safe\(fullName\)/);
 assert.match(ux,/exportCsv\(cols\.map\(i=>fullHeaders\[i\]\)/);
 assert.match(css,/th\.faculty-subject-abbr:hover::before/);
 assert.match(css,/th\.faculty-subject-abbr:focus-within::before/);
 assert.match(html,/faculty-roster-headings\.css\?v=20261113headings1/);
 assert.match(html,/student-experience-app\.mjs\?v=20261113headings1/);
 assert.match(html,/daily-ux\.mjs\?v=20261113headings1/);
});
