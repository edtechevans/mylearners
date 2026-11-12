/** UFLI Foundations lesson placement - SYNTHETIC demo data only.
 * Based on the official "Scope & Sequence At-a-Glance: All Concepts (K-2)".
 * UFLI publishes lessons 1-128, not a proficiency "level" scale.
 * Grades 3-5 are demonstration-only extension/intervention examples.
 */
import {gradeNumber,hash,rng} from './data.mjs';
import {esc} from './v2-ui.mjs';
export const UFLI_SOURCE_URL='https://ufli.education.ufl.edu/wp-content/uploads/2022/06/UFLI-Scope2.pdf';
export const UFLI_LESSON_MIN=1,UFLI_LESSON_MAX=128;
export const UFLI_GROUPS=Object.freeze([
 Object.freeze({id:'letters',start:1,end:34,label:'Letters & CVC words',color:'#1e6885',ink:'#ffffff'}),
 Object.freeze({id:'patterns',start:35,end:68,label:'Digraphs & word patterns',color:'#6b4a98',ink:'#ffffff'}),
 Object.freeze({id:'vowels',start:69,end:98,label:'Vowels & spellings',color:'#e7af61',ink:'#182f3d'}),
 Object.freeze({id:'affixes',start:99,end:128,label:'Affixes & advanced spellings',color:'#227158',ink:'#ffffff'})
]);
/** Official topical sections - do not imply a 1-128 lesson score is mastery. */
export const UFLI_PHASES=Object.freeze([
 [1,34,'Alphabet (including CVC words)'],
 [35,41,'Alphabet review & longer words'],
 [42,53,'Digraphs'],
 [54,62,'Vowel-consonant-e (VCe)'],
 [63,68,'Reading longer words'],
 [69,76,'Ending spelling patterns'],
 [77,83,'R-controlled vowels'],
 [84,88,'Long vowel teams'],
 [89,94,'Other vowel teams'],
 [95,97,'Diphthongs'],
 [98,98,'Silent letters'],
 [99,106,'Suffixes & prefixes'],
 [107,110,'Suffix spelling changes'],
 [111,118,'Low-frequency spellings'],
 [119,128,'Additional affixes']
].map(([start,end,label])=>Object.freeze({start,end,label})));
export function ufliLessonGroup(lesson){
 if(!Number.isInteger(lesson)||lesson<UFLI_LESSON_MIN||lesson>UFLI_LESSON_MAX)return null;
 return UFLI_GROUPS.find(group=>lesson>=group.start&&lesson<=group.end)||null;
}
export function ufliLessonPhase(lesson){
 if(!ufliLessonGroup(lesson))return null;
 return UFLI_PHASES.find(phase=>lesson>=phase.start&&lesson<=phase.end)||null;
}
export function ufliLessonFor(student){
 if(!student||typeof student.id!=='string'||!student.id)return null;
 if(!/^(K|G[1-5])$/.test(String(student.grade||'')))return null;
 const g=gradeNumber(student.grade);
 if(!Number.isFinite(g)||g<0||g>5)return null;
 // Stable per fictional student ID and intentionally independent of grade
 // to avoid inventing normative or placement assumptions.
 const lesson=UFLI_LESSON_MIN+Math.floor(rng(hash('ufli-demo-lesson-v1|'+student.id))()*UFLI_LESSON_MAX);
 const group=ufliLessonGroup(lesson),phase=ufliLessonPhase(lesson);
 return Object.freeze({lesson,code:'L'+String(lesson).padStart(3,'0'),group,phase,isDemo:true});
}
export function renderUfliLessonTile(student,{compact=false}={}){
 const placement=ufliLessonFor(student);
 if(!placement)return '';
 return '<span class="ufli-lesson-tile ufli-stage-'+placement.group.id+(compact?' ufli-compact':'')+
  '" aria-label="UFLI Foundations lesson '+placement.lesson+
  ' of 128, '+esc(placement.phase.label)+', fictional demonstration"><strong>'+
  placement.code+'</strong></span>';
}
export function renderUfliLegend(){
 return '<aside class="ufli-roster-legend" aria-label="UFLI lesson colour group legend">'+
  '<div class="ufli-legend-heading"><strong>UFLI Foundations · lesson groups</strong>'+
  '<span>Random demo placements · K–5 only · not achievement bands</span></div>'+
  '<div class="ufli-legend-bands">'+UFLI_GROUPS.map(group=>
   '<span class="ufli-legend-chip ufli-stage-'+group.id+'"><b>'+
   group.start+'–'+group.end+'</b><span>'+esc(group.label)+'</span></span>').join('')+'</div>'+
  '<small>Colours group nearby lessons in the official sequence; they do not indicate reading proficiency. '+
  'The published scope describes K–2 instruction; Grades 3–5 here illustrate potential intervention placements. '+
  '<a href="'+UFLI_SOURCE_URL+'" target="_blank" rel="noopener noreferrer">View UFLI scope & sequence</a>.</small></aside>';
}
