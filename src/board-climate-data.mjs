/**
 * AISG Board Climate & Wellbeing — curated, school-level survey aggregates.
 * Source: AISG_SurveyData (48)(1).xlsx, supplied 4 November 2026.
 * No respondent names, emails, free-text answers, or individual records.
 *
 * Calculation: for each window, respondent (case-insensitive trimmed email), and
 * exact survey question, count one valid response polarity. "Somewhat Agree" and
 * "Strongly Agree" are favourable; "Somewhat Disagree" and "Strongly Disagree"
 * are not. Repeated responses in the same polarity count once; contradictory
 * polarities and answers outside the four-point scale are excluded.
 * Historical Fall 2025 caregiver items are deliberately not used: that export
 * mixes incompatible response scales for the same question.
 */
const W = Object.freeze({f25:'Fall 2025',s26:'Spring 2026',f26:'Fall 2026'});
const point=(window,favourable,respondents)=>Object.freeze({window:W[window],favourable,respondents});
const item=(id,audience,statement,question,rows)=>Object.freeze({
 id,audience,statement,question,points:Object.freeze(rows.map(([w,f,n])=>point(w,f,n)))
});
export const CLIMATE_METRICS=Object.freeze({
 g35Belong:item('g35Belong','G3–5 students','Feel they belong at AISG',
  'I feel like I belong at AISG.',[['f25',155,183],['s26',186,212],['f26',191,208]]),
 g612Belong:item('g612Belong','G6–12 students','Feel a sense of belonging',
  'I feel a sense of belonging at AISG.',[['f25',375,434],['s26',302,341],['f26',301,338]]),
 g612Trusted:item('g612Trusted','G6–12 students','Have a trusted adult for support',
  'I have an adult at AISG I can go to for support. (Trusted Adult.)',
  [['f25',285,433],['s26',294,341],['f26',313,336]]),
 g35Trusted:item('g35Trusted','G3–5 students','Have an adult they can ask for help',
  'I have an adult at AISG I can go to if I need help.',
  [['s26',188,212],['f26',187,211]]),
 g35Excited:item('g35Excited','G3–5 students','Are excited about their learning',
  'I feel excited about my learning at AISG.',
  [['f25',144,183],['s26',184,213],['f26',188,211]]),
 g612Interested:item('g612Interested','G6–12 students','Are interested in their classes',
  'I am interested in my classes.',
  [['f25',280,434],['s26',270,340],['f26',276,334]]),
 g35TeacherRespect:item('g35TeacherRespect','G3–5 students','Feel respected by their teachers',
  'My teachers treat me with respect.',
  [['f25',170,183],['s26',204,213],['f26',205,211]]),
 g612TeacherRespect:item('g612TeacherRespect','G6–12 students','Feel respected by their teachers',
  'My teachers treat me with respect.',
  [['f25',396,434],['s26',317,341],['f26',314,337]]),
 fGrowth:item('fGrowth','Faculty','Feel supported in their professional growth',
  'AISG supports my growth as a teacher.',
  [['f25',84,93],['s26',88,91],['f26',64,65]]),
 fRespect:item('fRespect','Faculty','See respectful student–teacher relationships',
  'Relationships between teachers and students are respectful.',
  [['f25',80,92],['s26',87,91],['f26',62,63]]),
 fStudentSupport:item('fStudentSupport','Faculty','See students supporting one another',
  'Students support each other positively in their interactions.',
  [['f25',67,92],['s26',79,91],['f26',58,65]]),
 cWelcome:item('cWelcome','Caregivers','Feel welcomed by AISG',
  'AISG is welcoming to caregivers.',
  [['s26',137,138],['f26',93,93]]),
 cBelong:item('cBelong','Caregivers','Feel a sense of community belonging',
  'I feel a sense of belonging within the AISG community.',
  [['s26',134,138],['f26',89,93]]),
 cChildSafe:item('cChildSafe','Caregivers','Say their child feels safe at AISG',
  'My child feels safe at AISG.',
  [['s26',134,136],['f26',93,93]]),
 cActivities:item('cActivities','Caregivers','Feel activities match their child’s interests',
  'The activities offered at AISG match my child’s interests.',
  [['s26',129,136],['f26',92,93]])
});
export const CLIMATE_SOURCE='AISG Climate & Wellbeing Survey · Fall 2025, Spring 2026, Fall 2026';
export function climatePercentage(response){
 return response&&response.respondents>0?Math.round(response.favourable/response.respondents*1000)/10:null;
}
export function climateSummary(id){
 const m=CLIMATE_METRICS[id];
 if(!m)return null;
 const latest=m.points.at(-1),previous=m.points.length>1?m.points.at(-2):null;
 const percentage=climatePercentage(latest),previousPercentage=climatePercentage(previous);
 const change=percentage!==null&&previousPercentage!==null?
  Math.round((percentage-previousPercentage)*10)/10:null;
 return {metric:m,latest,previous,percentage,previousPercentage,change};
}
export function climateIsSafeToPublish(id){
 const metric=CLIMATE_METRICS[id];
 return !!metric&&metric.points.every(p=>Number.isInteger(p.favourable)&&
  Number.isInteger(p.respondents)&&p.respondents>=20&&
  p.favourable>=0&&p.favourable<=p.respondents);
}
