import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {facultyRosterEvidenceColumns} from '../src/report-card-signals.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {
 facultyEvidenceFamily,facultyGroupTransitions,facultyVisibleTableWidth,
 facultyHeaderWidth,facultyRosterTableWidth
} from '../src/faculty-roster-headings.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/student-experience-app.mjs');
const ux=read('src/daily-ux.mjs');
const css=read('src/faculty-ui-consistency.css');
const index=read('index.html');

test('All Faculty grades PK–12 share the new evidence presentation rules',()=>{
 const data=applyFacultyDemo(generateDemoData());
 const records=createAcademicDemoRecords(data.students);
 for(const grade of ['PK3','PK4','K','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12']){
  const students=data.students.filter(s=>s.grade===grade).slice(0,20);
  assert.ok(students.length>0,'Missing demo fixture for '+grade);
  const columns=facultyRosterEvidenceColumns(students,records,everydayEvidenceForGrade(grade));
  assert.ok(columns.length>=4,'Too few columns '+grade);
  assert.equal(columns[0].kind,'attendance',grade);
  assert.ok(columns.every(c=>facultyHeaderWidth(c)>=110),'Width too small for '+grade);
  assert.ok(facultyRosterTableWidth(columns)>=1200,grade);
  const families=columns.map(facultyEvidenceFamily);
  assert.ok(families.includes('attendance'));
  assert.ok(families.includes('screener'));
  assert.ok(families.includes('report'));
  if(grade==='K'||/^G[1-5]$/.test(grade))assert.ok(families.includes('lesson'),grade);
  if(/^G(?:[3-9]|1[0-2])$/.test(grade))assert.ok(families.includes('experience')||grade==='G11'||grade==='G12');
 }
});
test('Visual evidence grouping responds to hidden and rearranged source columns',()=>{
 const families=['identity','report','report','assessment','experience','support'];
 const original=[0,1,2,3,4,5];
 assert.deepEqual(facultyGroupTransitions(families,original),[1,3,4,5]);
 assert.deepEqual(facultyGroupTransitions(families,original,[1]),[2,3,4,5]);
 assert.deepEqual(facultyGroupTransitions(families,[0,4,1,2,3,5]),[4,1,3,5]);
 assert.deepEqual(facultyGroupTransitions(families,original,[1,2,3,4]),[5]);
 assert.deepEqual(facultyGroupTransitions(families,[0,1,2,3,4,5],[1,2,3,4,5]),[]);
});
test('Visible widths shrink when hidden and grow when a user resizes',()=>{
 const tracks=[210,122,110,110,126,146,172];
 assert.equal(facultyVisibleTableWidth(tracks),996);
 assert.equal(facultyVisibleTableWidth(tracks,[2,3]),776);
 assert.equal(facultyVisibleTableWidth(tracks,[2,3,4,5]),640);
 assert.equal(facultyVisibleTableWidth([210,122,180,110,126,146,172]),1066);
 assert.equal(facultyVisibleTableWidth(tracks,[1,2,3,4,5,6]),640);
});
test('Consistency layer is the final CSS rulebook, preserving data colours',()=>{
 const cssPos=index.indexOf('faculty-ui-consistency.css?v=20261113polish1');
 assert.ok(cssPos>index.indexOf('faculty-roster-headings.css?v=20261113headings1'));
 assert.ok(cssPos<index.indexOf('</head>'));
 assert.match(css,/--faculty-cell-height:58px/);
 for(const key of ['.class-evidence-result','.map-rit-tile','.map-rit-missing',
  '.ixl-diagnostic-tile','.us-tile','.ufli-lesson-tile'])
  assert.ok(css.includes(key),'Missing shared geometry: '+key);
 assert.match(css,/data-faculty-group-start/);
 assert.match(css,/data-faculty-active-column/);
 assert.match(css,/prefers-reduced-motion/);
 // Do not redefine any source-specific grade or assessment background colours.
 assert.doesNotMatch(css,/--us-red:|--rit-high:|--ufli-fill:#|--landing-grade-fill:#/);
});
test('Role scopes, original column preferences and keyboard controls remain intact',()=>{
 assert.match(app,/data-faculty-family/);
 assert.match(app,/facultyEvidenceFamily\(everydayColumns\[i\]\)/);
 assert.match(ux,/facultyGroupTransitions\(families,state\.columnOrder,state\.hidden\)/);
 assert.match(ux,/facultyVisibleTableWidth\(widths,state\.hidden\)/);
 assert.match(ux,/className='faculty-scroll-hint'/);
 assert.match(ux,/data-faculty-scroll="right"/);
 assert.match(ux,/aria-label="Scroll evidence columns left"/);
 assert.match(ux,/if\(isFacultyColumns\)\{\s*refreshFacultyPresentation\(table,s\);\s*gridNavigation\?\.refresh\(\);[\s\S]*?updateScrollCue\(\)\s*\}/);
 assert.match(ux,/data-faculty-active-column/);
 assert.match(ux,/data-ux-restore-columns/);
 assert.match(ux,/mylearners-faculty-columns-v1/);
 assert.match(index,/daily-ux\.mjs\?v=20261113workflow1/);
 assert.match(index,/student-experience-app\.mjs\?v=20261113workflow1/);
 assert.doesNotMatch(app,/['"]https?:\/\/[^'"]+\/api\/[^'"]+/);
});
