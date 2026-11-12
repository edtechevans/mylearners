/** Role-scoped Leaders view of fictional universal screener percentages. */
import {gradeNumber} from './data.mjs';
import {SCREENER_BANDS,SCREENER_BAND_KEYS,SCREENER_PAGE_SIZE,
 universalScreenerSummary,renderUniversalScreenerTile} from './universal-screener.mjs';
import {esc} from './v2-ui.mjs';
const safe=v=>esc(String(v??''));
export function renderLeaderUniversalScreener({
 students=[],bandFilter='all',gradeFilter='All',expanded=false,scopeLabel='Selected learners'
}={}){
 const grades=[...new Set(students.map(s=>s.grade))].sort((a,b)=>gradeNumber(a)-gradeNumber(b));
 const grade=grades.includes(gradeFilter)?gradeFilter:'All';
 const cohort=students.filter(s=>grade==='All'||s.grade===grade);
 const summary=universalScreenerSummary(cohort);
 const band=SCREENER_BAND_KEYS.includes(bandFilter)?bandFilter:'all';
 const matched=summary.entries.filter(x=>band==='all'||x.band===band)
  .sort((a,b)=>gradeNumber(a.student.grade)-gradeNumber(b.student.grade)||
    a.student.name.localeCompare(b.student.name)||a.student.id.localeCompare(b.student.id));
 const visible=expanded?matched:matched.slice(0,SCREENER_PAGE_SIZE);
 const bandButton=(key,label,count)=>'<button type="button" class="us-band-filter'+
  (band===key?' is-active':'')+'" data-leader-screener-band="'+key+'" aria-pressed="'+
  (band===key)+'" aria-label="Show '+safe(label)+', '+count+' learners">'+
  (key==='all'?'<i class="us-all-mark" aria-hidden="true">%</i>':
   '<i class="us-swatch us-band-'+key+'" aria-hidden="true"></i>')+
  '<span>'+safe(label)+'</span><strong>'+count+'</strong></button>';
 const gradeSelect='<label class="us-grade-select">Grade <select data-leader-screener-grade aria-label="Universal Screener grade">'+
  '<option value="All"'+(grade==='All'?' selected':'')+'>All grades</option>'+
  grades.map(g=>'<option value="'+safe(g)+'"'+(grade===g?' selected':'')+'>'+safe(g)+'</option>').join('')+
  '</select></label>';
 const rows=visible.map(row=>
  '<tr><th scope="row"><button type="button" class="us-learner-link" data-leader-screener-student="'+
   safe(row.student.id)+'">'+safe(row.student.name)+'</button></th>'+
   '<td>'+safe(row.student.grade)+'</td><td>'+safe(row.student.classId)+'</td>'+
   '<td>'+renderUniversalScreenerTile(row.student,{compact:true})+'</td>'+
   '<td><button type="button" class="us-view-learner" data-leader-screener-student="'+
   safe(row.student.id)+'" aria-label="View '+safe(row.student.name)+' learner evidence">View learner</button></td></tr>'
 ).join('');
 return '<section id="leader-universal-screener" class="us-leader-panel" aria-labelledby="leader-us-title">'+
  '<div class="us-panel-heading"><div><span class="us-overline">ADDITIONAL ACADEMIC DATA · DEMO</span>'+
  '<h2 id="leader-us-title">Universal Screener</h2>'+
  '<p>'+safe(scopeLabel)+' · A fictional 0–100% result for each learner. The colours are display bands, not validated screening thresholds.</p></div>'+
  '<div class="us-average"><span>Group average · demo</span><strong>'+
   (summary.average===null?'—':summary.average+'%')+'</strong>'+
  '<small>'+summary.available+' / '+summary.total+' with results</small></div></div>'+
  '<div class="us-filters"><div class="us-band-filters" role="group" aria-label="Universal Screener percentage bands">'+
  bandButton('all','All',summary.available)+
  SCREENER_BANDS.map(b=>bandButton(b.key,b.label,summary.counts[b.key])).join('')+
  '</div>'+gradeSelect+'</div>'+
  '<div class="us-results-meta" aria-live="polite">Showing '+visible.length+' of '+matched.length+
   ' matching learners · 2026–27 demo percentage</div>'+
  '<div class="us-results-scroll"><table class="us-results-table">'+
   '<thead><tr><th scope="col">Learner</th><th scope="col">Grade</th><th scope="col">Class</th>'+
   '<th scope="col">Screener</th><th scope="col">Profile</th></tr></thead>'+
   '<tbody>'+rows+'</tbody></table></div>'+
  (matched.length>SCREENER_PAGE_SIZE?'<button type="button" class="us-expand" data-leader-screener-expand>'+
   (expanded?'Show first '+SCREENER_PAGE_SIZE:'Show all '+matched.length+' matching learners')+'</button>':'')+
  '<p class="us-disclaimer">Entirely synthetic percentages generated from fictional learner IDs for design testing. The four colours match the MYP grade palette but do not imply an MYP grade, screening interpretation, diagnosis or support decision.</p>'+
  '</section>';
}
