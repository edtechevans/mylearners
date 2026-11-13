/** Read-only Faculty legend: real curriculum references versus synthetic data.
 * The summary gives essential interpretation without pushing learners down.
 * Full source, purpose, snapshot and limitations are available on demand.
 */
import {esc} from './v2-ui.mjs';
import {UFLI_SOURCE_URL} from './ufli-demo.mjs';
export function renderFacultyMeasureContext(columns=[],snapshot=''){
 const kinds=new Set((columns||[]).map(x=>x.kind));
 const screener=kinds.has('screener'),ufli=kinds.has('ufli');
 if(!screener&&!ufli)return '';
 const date=String(snapshot||'2026–27 demo snapshot');
 const dataDate=/^\d{4}-\d{2}-\d{2}$/.test(date)?date+' (demo snapshot)':date;
 const screenerCard=screener?
  '<section aria-label="Universal Screener data context"><h4>Universal Screener · demo %</h4>'+
  '<dl><div><dt>Source</dt><dd>Locally generated synthetic percentages; no assessment vendor or administered test data</dd></div>'+
  '<div><dt>Purpose</dt><dd>Prototype percentage display, sorting and four visual bands</dd></div>'+
  '<div><dt>Date</dt><dd>'+esc(dataDate)+' · illustrative 2026–27 school year; not a testing date</dd></div>'+
  '<div><dt>Interpretation</dt><dd>0–24, 25–49, 50–74 and 75–100 are presentation groups, not validated screening benchmarks, risk levels or MYP grades</dd></div></dl></section>':'';
 const ufliCard=ufli?
  '<section aria-label="UFLI Foundations data context"><h4>UFLI Foundations · demo lesson</h4>'+
  '<dl><div><dt>Source</dt><dd><a href="'+UFLI_SOURCE_URL+
   '" rel="noopener noreferrer" target="_blank">Official UFLI Foundations K–2 scope &amp; sequence</a> for lesson topics; individual placements are synthetic</dd></div>'+
  '<div><dt>Purpose</dt><dd>Visualise how a lesson placement could be displayed alongside other learner evidence</dd></div>'+
  '<div><dt>Date</dt><dd>'+esc(dataDate)+' · not a phonics assessment administration date</dd></div>'+
  '<div><dt>Interpretation</dt><dd>Lesson numbers 1–128 indicate position in a teaching sequence, not mastery or reading level. Grades 3–5 are intervention-display examples only</dd></div></dl></section>':'';
 return '<details class="faculty-data-context"><summary>'+
  '<strong>Evidence context</strong><span class="faculty-context-inline">'+
  (screener?'Screener: simulated %, not a risk score':'')+
  (screener&&ufli?' · ':'')+
  (ufli?'UFLI: demo lesson, not reading proficiency':'')+
  '</span><span class="faculty-context-expand">Source, date &amp; meaning</span></summary>'+
  '<div class="faculty-context-cards">'+screenerCard+ufliCard+'</div></details>';
}
