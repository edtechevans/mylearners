import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {leaderMapSummary,leaderAcademicCoverage,leaderCheckSnapshot,leaderReportBreakdown} from '../src/leader-summary.mjs';

const DATA=applyFacultyDemo(generateDemoData());
const records=createAcademicDemoRecords(DATA.students);
const grade=g=>DATA.students.filter(s=>s.grade===g);

test('leadership cohort covers PK3–G12 without inventing early MAP outcomes',()=>{
 assert.equal(DATA.students.length,1200);
 const school=leaderMapSummary(DATA.students,DATA.map,'Mathematics');
 assert.equal(school.eligible,640);
 assert.ok(school.compared<=school.eligible);
 assert.ok(school.rate===null||(school.rate>=0&&school.rate<=100));
 const early=leaderMapSummary(grade('G1'),DATA.map,'Reading');
 assert.deepEqual(early,{eligible:0,compared:0,met:0,rate:null});
 const grade12=leaderMapSummary(grade('G12'),DATA.map,'Mathematics');
 assert.equal(grade12.rate,null);
});

test('new measures only report availability for their eligible grades',()=>{
 const school=DATA.students;
 assert.equal(leaderAcademicCoverage(school,records,'report').eligible,1200);
 assert.equal(leaderAcademicCoverage(grade('PK3'),records,'report').available,0);
 assert.equal(leaderAcademicCoverage(grade('G7'),records,'core').eligible,0);
 assert.equal(leaderAcademicCoverage(grade('K'),records,'ixl').eligible,0);
 assert.equal(leaderAcademicCoverage(grade('G3'),records,'ixl').eligible,80);
 assert.equal(leaderAcademicCoverage(grade('G3'),records,'core').eligible,80);
 assert.equal(leaderAcademicCoverage(grade('G3'),records,'fp').eligible,80);
});

test('medians only appear for a single current grade with a recent fictional check',()=>{
 assert.equal(leaderCheckSnapshot(DATA.students,records,'ixl').typical,null);
 assert.match(leaderCheckSnapshot(grade('G7'),records,'ixl').typical,/Median diagnostic level [0-9]+/);
 assert.match(leaderCheckSnapshot(grade('G3'),records,'core').typical,/Median [0-9]+\/50 decoded items/);
 assert.match(leaderCheckSnapshot(grade('G3'),records,'fp').typical,/Median text level/);
 assert.equal(leaderCheckSnapshot(grade('G12'),records,'fp').typical,null);
});

test('report breakdown stays within one issued grade, year and scoring framework',()=>{
 assert.equal(leaderReportBreakdown(DATA.students,records),null);
 assert.deepEqual(leaderReportBreakdown(grade('PK3'),records).rows,[]);
 const g6=leaderReportBreakdown(grade('G6'),records);
 assert.equal(g6.issuedGrade,'G5');
 assert.equal(g6.scale,'descriptors');
 assert.ok(g6.rows.every(r=>r.values.every(v=>v.count>=0)));
 assert.ok(g6.rows.every(r=>r.values.reduce((n,v)=>n+v.count,0)===g6.included));
 const g7=leaderReportBreakdown(grade('G7'),records);
 assert.equal(g7.issuedGrade,'G6');
 assert.equal(g7.scale,'1–7');
 assert.equal(g7.included+g7.excluded,80);
});
