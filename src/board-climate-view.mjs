/** AISG Board · celebratory Climate & Wellbeing survey story. */
import {CLIMATE_METRICS,CLIMATE_SOURCE,climatePercentage,climateSummary,climateIsSafeToPublish} from './board-climate-data.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
function tile(id,featured=false){
 if(!climateIsSafeToPublish(id))return '';
 const v=climateSummary(id),{metric,latest,percentage,change}=v;
 const upward=change>0;
 const delta=change!==null&&upward?'<span class="cw-change" aria-label="Increase of '+change.toFixed(1)+' percentage points since the previous survey">+'+change.toFixed(1)+' pp <small>since '+esc(v.previous.window)+'</small></span>':'';
 return '<article class="cw-tile'+(featured?' cw-tile-featured':'')+'">'+
 '<span class="cw-audience">'+esc(metric.audience)+'</span>'+
 '<strong class="cw-value">'+pct(percentage)+'</strong>'+
 '<h3>'+esc(metric.statement)+'</h3>'+
 '<div class="cw-tile-end">'+(delta||'<span class="cw-window">Fall 2026</span>')+'</div>'+
 '</article>';
}
function trend(id){
 if(!climateIsSafeToPublish(id))return '';
 const metric=CLIMATE_METRICS[id],entries=metric.points.map(p=>({...p,value:climatePercentage(p)}));
 const latest=entries.at(-1),min=60,max=100;
 const xx=i=>50+i*(entries.length>2?145:240);
 const yy=value=>160-(value-min)/(max-min)*120;
 const points=entries.map((p,i)=>xx(i)+','+yy(p.value).toFixed(1)).join(' ');
 const title=esc(metric.statement);
 return '<article class="cw-trend-card"><div class="cw-trend-title"><div><span class="cw-audience">'+esc(metric.audience)+'</span><h3>'+title+'</h3></div>'+
 '<strong>'+pct(latest.value)+'</strong></div>'+
 '<svg class="cw-spark" viewBox="0 0 390 204" role="img" aria-label="'+title+': '+entries.map(p=>esc(p.window)+' '+pct(p.value)).join(', ')+'">'+
 [80,100].map(v=>'<line x1="42" y1="'+yy(v)+'" x2="365" y2="'+yy(v)+'" stroke="currentColor" opacity=".13" stroke-dasharray="3 5"/>'+
 '<text x="4" y="'+(yy(v)+4)+'" fill="currentColor" font-size="11">'+v+'%</text>').join('')+
 '<polyline fill="none" stroke="var(--cw-accent,#a52a43)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" points="'+points+'"/>'+
 entries.map((p,i)=>'<circle cx="'+xx(i)+'" cy="'+yy(p.value)+'" r="5.5" fill="var(--cw-accent,#a52a43)" stroke="white" stroke-width="2"/>'+
 '<text x="'+xx(i)+'" y="'+Math.max(15,yy(p.value)-13)+'" text-anchor="middle" font-size="12" fill="currentColor" font-weight="700">'+pct(p.value)+'</text>'+
 '<text x="'+xx(i)+'" y="190" text-anchor="middle" font-size="10.5" fill="currentColor">'+(p.window==='Fall 2025'?'Fall 25':p.window==='Spring 2026'?'Spring 26':'Fall 26')+'</text>').join('')+'</svg>'+
 '<p class="cw-trend-caption">Positive responses · latest '+latest.favourable+' of '+latest.respondents+' unique respondents</p></article>';
}
const section=(label,title,description,cards)=>'<section class="cw-section"><div class="cw-section-heading"><div><span class="eyebrow">'+label+'</span><h2>'+title+'</h2><p>'+description+'</p></div></div><div class="cw-grid">'+cards.map(x=>tile(x)).join('')+'</div></section>';
export function renderBoardClimate(){
 return '<div class="cw-dashboard">'+
 '<div class="cw-hero"><span class="eyebrow">FALL 2026 · CLIMATE & WELLBEING</span>'+
 '<h2>A Community Where Learning and Belonging Thrive</h2>'+
 '<p>Celebrating the voices of our students, faculty and caregivers. Selected favourable survey indicators show connection, engagement and a strong culture of support across AISG.</p>'+
 '<span class="cw-hero-tag">Selected strengths · Fall 2026 survey</span></div>'+
 '<section class="cw-section cw-headline" aria-label="Reasons to celebrate"><div class="cw-section-heading"><div><span class="eyebrow">AT A GLANCE</span><h2>Reasons to Celebrate</h2></div></div>'+
 '<div class="cw-grid cw-grid-headline">'+['g35Belong','g612Trusted','fGrowth','cWelcome'].map(x=>tile(x,true)).join('')+'</div></section>'+
 section('STUDENT VOICE','Belonging & Engagement','Student responses, shown separately for Elementary and Secondary because the survey questions differ.',
 ['g612Belong','g35Excited','g612Interested','g35TeacherRespect','g612TeacherRespect','g35Trusted'])+
 section('FACULTY VOICE','A Culture of Professional Growth','Faculty celebrate professional support and respectful relationships.',
 ['fRespect','fStudentSupport'])+
 section('CAREGIVER VOICE','Welcoming Our Community','Caregivers report strong relationships with the school and opportunities for their children.',
 ['cBelong','cChildSafe','cActivities'])+
 '<section class="cw-section cw-trends"><div class="cw-section-heading"><div><span class="eyebrow">GROWTH OVER TIME</span><h2>Positive Momentum</h2>'+
 '<p>Tracking the same survey statement across comparable survey windows; these are repeated snapshots, not matched individuals.</p></div></div>'+
 '<div class="cw-trend-grid">'+['g35Belong','g612Trusted','g612Interested','fGrowth'].map(trend).join('')+'</div></section>'+
 '<details class="cw-method"><summary>Survey methodology & interpretation <span aria-hidden="true">+</span></summary>'+
 '<div><p><strong>Source:</strong> '+esc(CLIMATE_SOURCE)+'. Source export supplied 4 November 2026. Figures are drawn from exact items, not a composite wellbeing index.</p>'+
 '<p><strong>Calculation:</strong> Percent answering Somewhat Agree or Strongly Agree among valid four-point-scale responses. Each email is counted once per question/window. Duplicate answers with conflicting sentiment, unexpected response scales, and blanks are excluded rather than guessed. Percentages rounded to one decimal place.</p>'+
 '<p><strong>Comparability:</strong> Grades 3–5 and 6–12 use distinct question wording and are not combined. Faculty and caregiver items are separate perceptions, not direct measures of student wellbeing. Fall 2025 caregiver trend comparisons are excluded because of mixed answer scales. The anomalous Fall 2025 G3–5 trusted-adult item is not included in trend reporting.</p>'+
 '<p><strong>Coverage:</strong> Fall 2026 includes 211 unique G3–5 student respondents, 339 G6–12 student respondents, 65 faculty and 93 caregivers in this extract. Item denominators may be smaller. Without confirmed eligible populations these are response counts, not participation rates.</p>'+
 '<p><strong>Interpretation:</strong> This curated Board view intentionally highlights favourable results; it is not a complete climate audit. Please consult the full confidential analysis for emerging concerns and follow-up priorities. Comparisons across survey windows involve different respondent cohorts; movement is descriptive, not statistically tested.</p>'+
 '<p><strong>Privacy:</strong> Only aggregated question-level percentages are published. No respondent emails, names, written answers, student-level records or small-group breakdowns appear in this public prototype.</p></div></details>'+
 '</div>';
}
