import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {facultyRosterEvidenceColumns} from '../src/report-card-signals.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {renderFacultyMeasureContext} from '../src/faculty-evidence-context.mjs';
import {renderUfliLegend} from '../src/ufli-demo.mjs';
import {facultyHeaderInfo,facultyHeaderWidth} from '../src/faculty-roster-headings.mjs';
import {installFacultyGridNavigation} from '../src/faculty-roster-keyboard.mjs';

const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=get('src/student-experience-app.mjs');
const ux=get('src/daily-ux.mjs');
const panel=get('src/class-evidence.mjs');
const style=get('src/faculty-workflow-polish.css');
const html=get('index.html');

test('All Faculty grades have concise but genuinely informative demo measure metadata',()=>{
 const data=applyFacultyDemo(generateDemoData());
 const records=createAcademicDemoRecords(data.students);
 for(const grade of ['PK3','K','G1','G2','G3','G5','G7','G10','G12']){
  const sample=data.students.filter(s=>s.grade===grade).slice(0,20);
  const columns=facultyRosterEvidenceColumns(sample,records,everydayEvidenceForGrade(grade));
  const markup=renderFacultyMeasureContext(columns,'2026-10-08');
  assert.match(markup,/class="faculty-data-context"/,grade);
  assert.match(markup,/Screener: % bands, not a risk score/,grade);
  assert.match(markup,/Source, date &amp; meaning/,grade);
  assert.match(markup,/2026-10-08 \(demo snapshot\)/,grade);
  assert.match(markup,/<dt>Source<\/dt>/,grade);
  assert.match(markup,/<dt>Purpose<\/dt>/,grade);
  assert.match(markup,/<dt>Date<\/dt>/,grade);
  assert.match(markup,/<dt>Interpretation<\/dt>/,grade);
  assert.match(markup,/no assessment vendor or administered test data/,grade);
  assert.match(markup,/not validated screening benchmarks/,grade);
  if(grade==='K'||/^G[1-5]$/.test(grade)){
   assert.match(markup,/UFLI Foundations · demo lesson/,grade);
   assert.match(markup,/K–2 scope &amp; sequence/,grade);
   assert.match(markup,/lesson numbers 1–128/i,grade);
   assert.match(markup,/ufli-roster-legend/,grade);
  }else assert.doesNotMatch(markup,/UFLI Foundations · demo lesson/,grade);
 }
});
test('UFLI colour key uses an accessible collapsed disclosure rather than a large open banner',()=>{
 const markup=renderUfliLegend();
 assert.match(markup,/^<details class="ufli-roster-legend"/);
 assert.match(markup,/<summary>/);
 assert.doesNotMatch(markup,/^<details[^>]+ open/);
 assert.match(markup,/ufli-legend-mini/);
 assert.match(markup,/ufli-legend-content/);
 assert.match(markup,/not achievement bands/);
 assert.match(markup,/K–2/);
 assert.match(markup,/Grades 3–5/);
 assert.match(markup,/https:\/\/ufli.education.ufl.edu\/wp-content\/uploads\/2022\/06\/UFLI-Scope2.pdf/);
});
test('Filters explicitly identify when incomplete MYP criteria can yield provisional grades',()=>{
 assert.match(panel,/mayIncludeProvisional=students\.some/);
 assert.match(panel,/including provisional MYP best-fit grades/);
 assert.match(panel,/fewer than four criteria are assessed/);
 assert.match(panel,/data-faculty-low-filter="3"/);
 assert.match(panel,/data-faculty-low-filter="2"/);
 assert.match(app,/mayIncludeProvisional=ss\.some/);
 assert.match(app,/faculty-provisional-note/);
 assert.match(app,/All values are demo test data, not issued grades/);
});
test('Source subject Arts / Elective gets consistent VPA prefix but preserves its record key',()=>{
 const info=facultyHeaderInfo({kind:'report',subject:'Arts / Elective',label:'Arts / Elective'});
 assert.equal(info.display,'VPA / Elective');
 assert.equal(info.full,'Visual & Performing Arts / Elective');
 assert.equal(info.original,'Arts / Elective');
 assert.equal(info.abbreviated,true);
 assert.ok(facultyHeaderWidth({kind:'report',subject:'Arts / Elective'})>=160);
});
test('Horizontal controls and learner navigation live above rather than below the scroll region',()=>{
 assert.match(ux,/scrollContainer\.insertAdjacentElement\('beforebegin',scrollHint\)/);
 assert.doesNotMatch(ux,/scrollContainer\.insertAdjacentElement\('afterend',scrollHint\)/);
 assert.match(ux,/faculty-jump-select/);
 assert.match(ux,/gridNavigation\.visibleLearners\(\)/);
 assert.match(ux,/gridNavigation\?\.focusLearner/);
 assert.match(ux,/data-faculty-scroll="right"/);
 assert.match(ux,/gridNavigation\?\.refresh\(\)/);
 assert.match(style,/position:sticky/);
 assert.match(style,/\.faculty-scroll-hint/);
});
test('Roving data-cell keyboard navigation is installed, scoped and preserves native buttons',()=>{
 assert.equal(typeof installFacultyGridNavigation,'function');
 const module=get('src/faculty-roster-keyboard.mjs');
 for(const token of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End',
  'faculty-roster-grid-help','tabIndex=0','focusLearner','visibleLearners'])
  assert.ok(module.includes(token),'Missing '+token);
 assert.match(module,/button\.student-link/);
 assert.match(module,/button\.evidence-cell-open/);
 assert.match(module,/if\(!table\|\|table\.dataset\.facultyGridNavigation/);
 assert.match(ux,/installFacultyGridNavigation\(table\)/);
 assert.match(style,/faculty-jump-select/);
 assert.match(style,/:focus-visible/);
});
test('Compact styling affects Faculty only and keeps original score palettes',()=>{
 assert.match(html,/faculty-workflow-polish\.css\?v=20261113workflow1/);
 assert.match(html,/student-experience-app\.mjs\?v=20261113guides1/);
 assert.match(html,/daily-ux\.mjs\?v=20261113copy1/);
 assert.ok(html.indexOf('faculty-workflow-polish.css')>html.indexOf('faculty-ui-consistency.css'));
 assert.match(style,/#app\[data-workspace="faculty"\]/);
 assert.match(style,/class-evidence-panel/);
 assert.match(style,/faculty-evidence-legend/);
 assert.match(style,/ufli-roster-legend/);
 assert.match(style,/faculty-data-context/);
 assert.doesNotMatch(style,/--landing-grade-fill:\s*#/);
 assert.doesNotMatch(style,/--rit-(?:low|avg|high):\s*#/);
 assert.doesNotMatch(style,/--ufli-fill:\s*#/);
});
