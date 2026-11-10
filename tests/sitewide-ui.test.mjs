import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const events={};
let navFoci=0,mainFoci=0,mainScrolls=0,pageScrolls=0;
const node={
 classList:{toggle(){}},
 innerHTML:'',
 addEventListener(name,fn){events[name]=fn},
 querySelector(selector){
  if(selector==='#main')return {
   focus(){mainFoci++},scrollIntoView(){mainScrolls++}
  };
  if(selector.startsWith('[data-role="'))return {focus(){navFoci++}};
  return null;
 }
};
const prefs=new Map();
const store={
 getItem(key){return prefs.get(key)||null},
 setItem(key,value){prefs.set(key,String(value))}
};
globalThis.document={
 getElementById(id){return id==='app'?node:null},
 body:{classList:{toggle(){}}},
 querySelector(){return null}
};
globalThis.localStorage=store;
globalThis.sessionStorage=store;
globalThis.location={hash:'#/faculty'};
globalThis.window={
 addEventListener(name,fn){events['window-'+name]=fn},
 scrollTo(){pageScrolls++},innerWidth:1440
};
await import('../src/student-experience-app.mjs');

function click(selector,dataset={}){
 events.click({target:{closest(query){
  return query===selector?{dataset}:null;
 }}});
}
test('all five views use a labelled semantic navigation with a single active dashboard',()=>{
 assert.match(node.innerHTML,/<nav class="roles" aria-label="Dashboard views">/);
 assert.match(node.innerHTML,/data-skip-main/);
 assert.match(node.innerHTML,/<main class="container" id="main" tabindex="-1">/);
 for(const role of ['faculty','student','sss','leader','board'])
  assert.match(node.innerHTML,new RegExp('data-role="'+role+'"'));
 assert.match(node.innerHTML,/data-role="sss" aria-pressed="false" aria-label="Open Student Support Services \(SSS\) demonstration dashboard"/);
 assert.match(node.innerHTML,/data-role="leader" aria-pressed="false" aria-label="Open Leaders dashboard"/);
 assert.equal((node.innerHTML.match(/data-role="[^"]+" aria-pressed="true"/g)||[]).length,1);
});
test('dashboard switching preserves location, restores focus and starts from top',()=>{
 const previous=pageScrolls;
 click('[data-role]',{role:'sss'});
 assert.match(node.innerHTML,/Student Support Services/);
 assert.match(node.innerHTML,/data-role="sss" aria-pressed="true"/);
 assert.equal(globalThis.location.hash,'#/sss');
 assert.ok(navFoci>0);
 assert.ok(pageScrolls>previous);
 for(const [role,headline] of [
  ['leader','Leadership Overview'],['board','AISG AGGREGATED DATA'],
  ['student','My learning'],['faculty','My Students']
 ]){
  click('[data-role]',{role});
  assert.match(node.innerHTML,new RegExp(headline));
  assert.equal((node.innerHTML.match(/data-role="[^"]+" aria-pressed="true"/g)||[]).length,1);
 }
});
test('skip to content works without changing the hash-based route',()=>{
 const before=globalThis.location.hash;
 click('[data-skip-main]');
 assert.ok(mainFoci>0);
 assert.ok(mainScrolls>0);
 assert.equal(globalThis.location.hash,before);
});
test('sitewide polish keeps accessible system fallback and scope of data-safe visuals',()=>{
 const css=readFileSync(new URL('../src/sitewide-polish.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
 assert.match(css,/font-family:'Noto Sans','Segoe UI'/);
 assert.match(css,/\.skip-link:focus-visible/);
 assert.match(css,/\.roster-daily th\{font-size:12px/);
 assert.match(css,/\.student-today-tile small\{color:var\(--ui-muted\)/);
 assert.match(css,/\.board-view \.board-nav-tabs/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/sitewide-polish\.css/);
 assert.match(js,/return profileStart\+header\+profileKpis\+academics\+wellbeing\+maiaFaculty\+/);
  assert.match(js,/renderFacultySupportPanel\(s,supportEntries\(\),SSS_RECORDS\.get\(s\.id\)\)\+guidance/);
 assert.match(js,/SSS_RECORDS=createSSSDemoRecords\(DATA\.students\)/);
});


test('Leaders begin with an aggregated whole-school landing and explicit division choices',()=>{
 click('[data-role]',{role:'leader'});
 assert.match(node.innerHTML,/Leadership Overview/);
 assert.match(node.innerHTML,/WHOLE SCHOOL · START HERE/);
 assert.match(node.innerHTML,/data-select="division"/);
 assert.match(node.innerHTML,/data-leader-division="Elementary"/);
 assert.match(node.innerHTML,/data-leader-division="Secondary"/);
 assert.match(node.innerHTML,/leader-school-voice-grid/);
 assert.equal((node.innerHTML.match(/class="leader-experience-scale/g)||[]).length,4,
  'The two divisions each retain separate Engagement and Belonging indices');
 assert.doesNotMatch(node.innerHTML,/leader-report-followup/);
 assert.doesNotMatch(node.innerHTML,/data-leader-student=/,'No individual learner on whole-school screen');
 assert.match(node.innerHTML,/DEMONSTRATION/);
});
test('Secondary shows the daily review, Grade 12 uses DP evidence, and supports learner drilldown',()=>{
 click('[data-leader-division]',{leaderDivision:'Secondary'});
 assert.match(node.innerHTML,/Secondary daily lens/);
 assert.match(node.innerHTML,/leader-daily-priorities/);
 assert.match(node.innerHTML,/Subject results ≤2/);
 assert.match(node.innerHTML,/data-leader-review-filter="academic2"/);
 assert.match(node.innerHTML,/data-leader-grade="G12"/);
 assert.match(node.innerHTML,/data-leader-panel="support"/);
 assert.match(node.innerHTML,/data-leader-panel="academics"/);
 assert.match(node.innerHTML,/data-leader-panel="patterns"/);
 click('[data-leader-grade]',{leaderGrade:'G12'});
 assert.match(node.innerHTML,/Grade 12 · priorities and progress/);
 assert.match(node.innerHTML,/DP subject results ≤2/);
 assert.doesNotMatch(node.innerHTML,/MAP Mathematics growth/,
  'Grade 12 must not show an unavailable MAP growth tile');
 assert.match(node.innerHTML,/leader-subject-detail/);
 assert.match(node.innerHTML,/data-leader-report-threshold="3" aria-pressed="true"/);
 click('[data-leader-report-threshold]',{leaderReportThreshold:'2'});
 assert.match(node.innerHTML,/Students with 2 or below/);
 click('[data-leader-review-filter]',{leaderReviewFilter:'academic2'});
 assert.match(node.innerHTML,/data-leader-review-filter="academic2" aria-pressed="true"/);
 const studentId=node.innerHTML.match(/data-leader-student="([^"]+)"/)?.[1];
 assert.ok(studentId,'Grade 12 needs an actionable learner investigation');
 click('[data-leader-student]',{leaderStudent:studentId});
 assert.match(node.innerHTML,/leader-learner-profile/);
 assert.match(node.innerHTML,/data-leader-back/);
 assert.match(node.innerHTML,/Current subject results/);
 assert.doesNotMatch(node.innerHTML,/data-sss-student|data-support-new/);
 click('[data-leader-back]');
 assert.match(node.innerHTML,/leader-review-table/);
});
test('Elementary has a distinct literacy and attendance workflow and a saved grade view',()=>{
 click('[data-leader-division]',{leaderDivision:'Elementary'});
 assert.match(node.innerHTML,/Elementary daily lens/);
 assert.match(node.innerHTML,/Literacy checks/);
 assert.match(node.innerHTML,/Attendance and early learning review/);
 assert.doesNotMatch(node.innerHTML,/leader-report-followup/);
 assert.doesNotMatch(node.innerHTML,/data-leader-review-filter="academic2"/);
 click('[data-leader-grade]',{leaderGrade:'G4'});
 assert.match(node.innerHTML,/Grade 4 · priorities and progress/);
 click('[data-leader-save-view]');
 assert.match(node.innerHTML,/Saved: Elementary · Grade 4/);
 click('[data-leader-division]',{leaderDivision:'All'});
 assert.match(node.innerHTML,/WHOLE SCHOOL · START HERE/);
 assert.match(node.innerHTML,/data-leader-open-saved/);
 click('[data-leader-open-saved]');
 assert.match(node.innerHTML,/Grade 4 · priorities and progress/);
});

test('Faculty review controls switch All, orange 3-or-below and red 2-or-below',()=>{
 click('[data-role]',{role:'faculty'});
 assert.match(node.innerHTML,/data-faculty-low-filter="all"/);
 assert.match(node.innerHTML,/<div class="faculty-concern-filter"/);
 assert.match(node.innerHTML,/Filter students/);
 assert.match(node.innerHTML,/class-roster-view-switch[\s\S]*?<div class="faculty-concern-filter"/);
 assert.match(node.innerHTML,/All students <b>20<\/b>/);
 assert.match(node.innerHTML,/data-faculty-low-filter="3" aria-pressed="false"/);
 assert.match(node.innerHTML,/data-faculty-low-filter="2" aria-pressed="false"/);
 const count3=Number(node.innerHTML.match(/3 or below <b>(\d+)<\/b>/)?.[1]);
 const count2=Number(node.innerHTML.match(/2 or below <b>(\d+)<\/b>/)?.[1]);
 assert.ok(count2>0&&count2<=count3&&count3<=20);
 const before=(node.innerHTML.match(/<button class="student-link"/g)||[]).length;
 click('[data-faculty-low-filter]',{facultyLowFilter:'3'});
 const three=(node.innerHTML.match(/<button class="student-link"/g)||[]).length;
 assert.ok(three>0&&three<=before,'3-or-below selects the appropriate subset');
 assert.match(node.innerHTML,/data-faculty-low-filter="3" aria-pressed="true"/);
 click('[data-faculty-low-filter]',{facultyLowFilter:'2'});
 const two=(node.innerHTML.match(/<button class="student-link"/g)||[]).length;
 assert.ok(two>0&&two<=three,'2-or-below is a subset of 3-or-below');
 assert.match(node.innerHTML,/data-faculty-low-filter="2" aria-pressed="true"/);
 assert.match(node.innerHTML,/data-faculty-low-filter="3" aria-pressed="false"/);
 click('[data-faculty-low-filter]',{facultyLowFilter:'all'});
 assert.equal((node.innerHTML.match(/<button class="student-link"/g)||[]).length,before);

});

test('Faculty summary shows two colour-only scales and Faculty learner profiles retain detailed gauges',()=>{
 click('[data-role]',{role:'faculty'});
 assert.equal((node.innerHTML.match(/class="quick-tile quick-score faculty-index-gauge/g)||[]).length,2);
 assert.equal((node.innerHTML.match(/class="leader-experience-scale/g)||[]).length,2);
 assert.doesNotMatch(node.innerHTML,/faculty-summary-colour-mark|<strong[^>]*>●<\/strong>/);
 assert.match(node.innerHTML,/data-action="explain:faculty:engagement"/);
 assert.match(node.innerHTML,/data-action="explain:faculty:belonging"/);
 const id=node.innerHTML.match(/class="student-link" data-student="([^"]+)"/)?.[1];
 assert.ok(id,'Faculty table should include learners');
 click('[data-student]',{student:id});
 assert.equal((node.innerHTML.match(/class="metric experience-metric-card/g)||[]).length,2);
 assert.equal((node.innerHTML.match(/class="leader-experience-scale/g)||[]).length,2);
});
test('Student landing and expanded personal check-in cards share the scale without replacing learning tiles',()=>{
 click('[data-role]',{role:'student'});
 assert.match(node.innerHTML,/student-landing-grid/);
 assert.match(node.innerHTML,/student-checkin-preview-grid/);
 assert.equal((node.innerHTML.match(/class="student-checkin-preview-tile/g)||[]).length,2);
 assert.equal((node.innerHTML.match(/class="metric experience-metric-card/g)||[]).length,2);
 assert.equal((node.innerHTML.match(/class="leader-experience-scale/g)||[]).length,4);
 assert.match(node.innerHTML,/class="student-today-tile student-today-celebrate"/);
 assert.match(node.innerHTML,/class="student-today-tile student-today-progress"/);
 assert.match(node.innerHTML,/class="student-today-tile student-today-goal"/);
 assert.match(node.innerHTML,/These colours describe my experience, not my ability or a school grade/);
 events.change({target:{closest(query){
  return query==='[data-select]'?{dataset:{select:'student-grade'},value:'G2'}:null;
 }}});
 assert.doesNotMatch(node.innerHTML,/student-checkin-preview-grid|metric experience-metric-card/);
 assert.match(node.innerHTML,/check-ins begin in Grade 3/);
});
