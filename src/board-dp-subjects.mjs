/** Official IB May-session subject outcomes, AISG school 001832.
 * Transcribed from AISG 2022–2026 IB School Statistics subject tables.
 * School/world means are specific to the exact subject and level (1–7).
 * Different cohorts across years are NOT matched student growth.
 */
export const DIPLOMA_SUBJECTS=Object.freeze([
 {id:'math-aa-sl',group:'maths',name:'Mathematics: Analysis & Approaches SL',short:'Mathematics AA SL',rows:[[2022,20,6.20,4.99],[2023,24,5.92,4.61],[2024,15,5.73,4.55],[2025,29,5.34,4.50],[2026,25,5.52,4.46]]},
 {id:'math-aa-hl',group:'maths',name:'Mathematics: Analysis & Approaches HL',short:'Mathematics AA HL',rows:[[2022,6,6.67,5.21],[2023,19,5.89,4.88],[2024,8,6.13,4.87],[2025,7,5.14,4.92],[2026,17,5.41,5.00]]},
 {id:'math-ai-sl',group:'maths',name:'Mathematics: Applications & Interpretation SL',short:'Mathematics AI SL',rows:[[2022,19,5.26,4.39],[2023,16,4.25,3.87],[2024,17,5.12,3.92],[2025,9,4.78,3.88],[2026,17,4.88,3.89]]},
 {id:'english-hl',group:'english',name:'English A: Language & Literature HL',short:'English A HL',rows:[[2022,26,5.62,5.03],[2023,20,5.30,4.80],[2024,9,5.22,4.73],[2025,10,5.50,4.83],[2026,17,5.41,4.84]]},
 {id:'english-sl',group:'english',name:'English A: Language & Literature SL',short:'English A SL',rows:[[2022,15,5.20,5.27],[2023,41,5.00,4.89],[2024,26,5.27,4.92],[2025,36,5.17,4.95],[2026,36,5.22,4.98]]},
 {id:'biology-hl',group:'science',name:'Biology HL',short:'Biology HL',rows:[[2022,13,5.46,4.73],[2023,12,5.00,4.41],[2024,13,4.62,4.42],[2025,14,4.93,4.45],[2026,16,5.06,4.49]]},
 {id:'chemistry-hl',group:'science',name:'Chemistry HL',short:'Chemistry HL',rows:[[2022,14,6.21,4.99],[2023,17,4.24,4.57],[2024,18,4.39,4.70],[2025,16,4.19,4.82],[2026,18,5.33,4.95]]},
 {id:'physics-hl',group:'science',name:'Physics HL',short:'Physics HL',rows:[[2022,3,5.67,5.09],[2023,19,5.26,4.81],[2024,9,4.88,4.86],[2025,10,4.10,4.91],[2026,17,4.65,4.97]]},
 {id:'psychology-hl',group:'breadth',name:'Psychology HL',short:'Psychology HL',rows:[[2022,13,5.08,5.07],[2023,21,5.19,4.79],[2024,20,5.60,4.74],[2025,12,5.42,4.74],[2026,14,5.86,4.82]]},
 {id:'chinese-b-sl',group:'breadth',name:'Chinese B: Mandarin SL',short:'Chinese B SL',rows:[[2022,9,6.33,5.80],[2023,17,6.59,5.73],[2024,10,6.60,5.68],[2025,10,5.90,5.69],[2026,10,6.10,5.71]]},
 {id:'visual-arts-hl',group:'breadth',name:'Visual Arts HL',short:'Visual Arts HL',rows:[[2022,6,5.50,4.45],[2023,11,5.18,4.40],[2024,9,5.22,4.25],[2025,9,5.11,4.26],[2026,7,5.57,4.30]]}
].map(s=>Object.freeze({...s,rows:Object.freeze(s.rows.map(([year,n,school,world])=>Object.freeze({year,n,school,world})))}))));
export const DP_SUBJECT_GROUPS=Object.freeze([
 {id:'maths',label:'Mathematics'},{id:'english',label:'English A'},
 {id:'science',label:'Sciences'},{id:'breadth',label:'Beyond STEM'}
]);
export const DP_SUBJECT_DEFAULT='math-aa-sl';
export const dpSubject=id=>DIPLOMA_SUBJECTS.find(s=>s.id===id)||DIPLOMA_SUBJECTS[0];
export const dpSubjectDetails=id=>{
 const s=dpSubject(id),current=s.rows.at(-1),previous=s.rows.at(-2);
 return {subject:s,current,previous,above:s.rows.filter(r=>r.school>r.world).length,
  gap:Number((current.school-current.world).toFixed(2)),
  yearChange:Number((current.school-previous.school).toFixed(2))};
};
const safe=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const plus=v=>(v>0?'+':'')+v.toFixed(2);
const score=v=>Number(v).toFixed(2);
function chart(subject){
 const W=780,H=238,left=46,right=25,top=24,bottom=191;
 const xp=i=>left+(W-left-right)*i/4,yp=v=>bottom-(v/7)*(bottom-top);
 const path=k=>subject.rows.map((r,i)=>(i?'L':'M')+xp(i)+' '+yp(r[k]).toFixed(1)).join(' ');
 const grid=[0,2,4,6,7].map(v=>'<line x1="'+left+'" x2="'+(W-right)+'" y1="'+yp(v)+'" y2="'+yp(v)+'" class="dp-subject-grid"/>'+
  '<text x="'+(left-12)+'" y="'+(yp(v)+4)+'" text-anchor="end" class="dp-subject-tick">'+v+'</text>').join('');
 const years=subject.rows.map((r,i)=>{
  const x=xp(i);
  const point=k=>'<circle cx="'+x+'" cy="'+yp(r[k]).toFixed(1)+'" r="5" class="dp-subject-'+k+'-dot">'+
   '<title>'+safe(r.year+' '+(k==='school'?'AISG':'Worldwide')+': '+score(r[k])+' / 7; '+r.n+' AISG subject entries')+'</title></circle>';
  return point('world')+point('school')+'<text x="'+x+'" y="218" text-anchor="middle" class="dp-subject-year">'+r.year+'</text>';
 }).join('');
 return '<div class="dp-subject-chart-wrap"><svg viewBox="0 0 '+W+' '+H+'" class="dp-subject-chart" role="img" aria-label="'+
  safe(subject.name)+': AISG and worldwide average grades from 2022 to 2026 on a full zero-to-seven scale">'+
  grid+'<path d="'+path('world')+'" class="dp-subject-world-line"/>'+
  '<path d="'+path('school')+'" class="dp-subject-school-line"/>'+years+'</svg></div>';
}
function subjectHighlights(){
 const spotlight=[
  {id:'math-aa-sl',title:'Mathematics AA SL',message:'Five consecutive years above the worldwide course average'},
  {id:'english-hl',title:'English A HL',message:'Five consecutive years above the worldwide course average'},
  {id:'biology-hl',title:'Biology HL',message:'Five consecutive years above the worldwide course average'}
 ];
 return '<div class="dp-subject-highlights">'+spotlight.map(h=>{
  const d=dpSubjectDetails(h.id);return '<article class="dp-subject-highlight">'+
   '<span class="dp-subject-eyebrow">MAY 2026 · SUBJECT STRENGTH</span>'+
   '<strong>'+safe(h.title)+'</strong>'+
   '<div class="dp-subject-highlight-value">'+plus(d.gap)+' <small>grade points vs worldwide</small></div>'+
   '<p>'+safe(h.message)+'</p>'+
   '<span class="dp-subject-coverage">2026: '+d.current.n+' subject entries · AISG '+score(d.current.school)+' / World '+score(d.current.world)+'</span></article>';
 }).join('')+'</div>';
}
export function renderDiplomaSubjectSection(state={}){
 const {subject,current,previous,above,gap,yearChange}=dpSubjectDetails(state.boardDpSubject||DP_SUBJECT_DEFAULT);
 const group=subject.group;
 const tabs=DP_SUBJECT_GROUPS.map(g=>'<span class="dp-subject-group-label"'+(g.id===group?' data-current="true"':'')+'>'+safe(g.label)+'</span>'+
 DIPLOMA_SUBJECTS.filter(s=>s.group===g.id).map(s=>'<button type="button" data-board-dp-subject="'+safe(s.id)+
 '" aria-pressed="'+(s.id===subject.id)+'" class="'+(s.id===subject.id?'active':'')+'">'+safe(s.short)+'</button>').join('')).join('');
 const tbody=subject.rows.map(r=>'<tr'+(r.year===2026?' class="dp-subject-current"':'')+'><th scope="row">'+r.year+'</th>'+
 '<td>'+r.n+'</td><td>'+score(r.school)+'</td><td>'+score(r.world)+'</td>'+
 '<td>'+plus(r.school-r.world)+'</td></tr>').join('');
 return '<section class="board-panel dp-subject-section" aria-label="Subject-specific Diploma outcomes">'+
 '<div class="dp-subject-intro"><div>'+
 '<span class="eyebrow">SUBJECT PERFORMANCE · OFFICIAL IB RESULTS 2022–2026</span>'+
 '<h3>Where AISG Students Stand Out</h3>'+
 '<p>Selected higher-level and widely enrolled subjects. Five May examination sessions; each subject is compared with its own worldwide IB average.</p></div>'+
 '<span class="dp-subject-ib-mark">Grades out of 7</span></div>'+
 subjectHighlights()+
 '<div class="dp-subject-explorer">'+
 '<div class="dp-subject-choice"><h4>Explore a Subject</h4><p>Choose a course to compare five years of AISG and worldwide outcomes.</p>'+
 '<div class="dp-subject-options" role="group" aria-label="Select IB Diploma subject">'+tabs+'</div></div>'+
 '<div class="dp-subject-detail">'+
 '<div class="dp-subject-detail-top"><div><span class="dp-subject-eyebrow">FIVE-YEAR COMPARISON · '+safe(group.toUpperCase())+'</span>'+
 '<h4>'+safe(subject.name)+'</h4><p>School and worldwide mean grades · same subject and level · different cohorts each year</p></div>'+
 '<span class="dp-subject-five-year">'+above+' / 5 <small>years above world</small></span></div>'+
 '<div class="dp-subject-score-row"><div><span>AISG · 2026</span><strong>'+score(current.school)+' <small>/ 7</small></strong></div>'+
 '<div><span>Worldwide · 2026</span><strong>'+score(current.world)+' <small>/ 7</small></strong></div>'+
 '<div><span>AISG vs worldwide</span><strong>'+plus(gap)+'</strong></div>'+
 '<div><span>AISG course entries</span><strong>'+current.n+'</strong></div></div>'+
 '<div class="dp-subject-legend"><span><i class="dp-subject-legend-school"></i>AISG</span>'+
 '<span><i class="dp-subject-legend-world"></i>Worldwide IB</span></div>'+chart(subject)+
 '<div class="dp-subject-detail-bottom"><span>2025 to 2026 · AISG mean '+plus(yearChange)+' grade points</span>'+
 '<span>View all years in the table below</span></div>'+
 '<details class="dp-subject-table"><summary>Five-year figures and candidate counts <span>+</span></summary>'+
 '<div class="tablewrap"><table><thead><tr><th>May session</th><th>AISG entries</th><th>AISG average</th>'+
 '<th>Worldwide average</th><th>Difference</th></tr></thead><tbody>'+tbody+'</tbody></table></div></details>'+
 '</div></div>'+
 '<p class="dp-subject-method">Source: International Baccalaureate school statistics for AISG (school 001832), May 2022–2026. Courses are selected to illustrate sustained academic outcomes and curriculum breadth; this is not a ranking of subjects. HL and SL are not combined. Worldwide averages are course-and-level-specific. Entry counts are subject entries, not unique students across courses. Positive and negative years remain visible in each series. Results from different graduating cohorts must not be interpreted as individual student growth.</p>'+
 '</section>';
}
