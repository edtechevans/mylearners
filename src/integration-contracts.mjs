/** AISG My Learners — production integration contract (no live connections).
 * GitHub Pages always serves synthetic data. Never insert credentials in a bundle.
 * Implement these contracts in a secure, AISG-approved backend service only.
 */
export const PUBLIC_DEMO_ONLY=true;
export const LIVE_CONNECTORS_ENABLED=false;
export const DATA_CLASSIFICATION=Object.freeze({
  roster:'student-personal',
  timetable:'student-personal',
  attendance:'student-personal',
  assessment:'student-personal',
  growth:'student-personal',
  support:'highly-sensitive',
  studentVoice:'aggregated-with-privacy-threshold',
  observationFeedback:'restricted-employee-data'
});
export const SOURCE_CONTRACTS=Object.freeze({
  PowerSchool:{
   service:'SIS',roles:['assigned-teacher','advisory','approved-leader'],
   required:['studentId','sectionId','academicYear','teacherId','grade','attendanceDate','attendanceCode'],
   authoritativeFor:['student identity','active enrolment','teaching groups','attendance','punctuality'],
   targetFreshnessMinutes:30,authorisation:'server-side staff-section-student joins',
   dataResidency:'requires AISG approval',enabled:false
  },
  ManageBac:{
   service:'LMS',roles:['assigned-teacher','approved-learning-support','approved-leader'],
   required:['studentId','courseId','assessmentId','submittedAt','publishedAt','criteria','status','feedback'],
   authoritativeFor:['published assessment','submission states','curriculum criteria','learning evidence'],
   targetFreshnessMinutes:60,authorisation:'source permissions plus AISG server-side scope',
   dataResidency:'requires AISG approval',enabled:false
  },
  NWEAMAP:{
   service:'assessment',roles:['assigned-teacher','approved-leader'],
   required:['studentId','testTerm','testDate','subject','rit','growthNorm','validTestStatus'],
   authoritativeFor:['tested achievement','observed growth','official norms','valid projections'],
   targetFreshnessMinutes:1440,authorisation:'approved assessment access and report licensing',
   dataResidency:'requires AISG approval',enabled:false
  },
  StudentSupport:{
   service:'specialist',roles:['explicitly-approved-care-provider'],
   required:['studentId','approvedActionText','effectiveDate','reviewDate','accessScope'],
   authoritativeFor:['approved classroom guidance only'],
   targetFreshnessMinutes:15,authorisation:'separate entitlement, audit, purpose limitation',
   dataResidency:'requires AISG approval',enabled:false
  },
  StudentVoice:{
   service:'climate',roles:['authorised-aggregated-view'],
   required:['cohortId','responseCount','eligiblePopulation','measure','collectionDate'],
   authoritativeFor:['approved aggregated climate signals'],
   targetFreshnessMinutes:1440,authorisation:'minimum group size and no free-text leak',
   dataResidency:'requires AISG approval',enabled:false
  }
});
export const FRESHNESS_RULES=Object.freeze({
  mustDisplaySource:true,mustDisplayUpdatedAt:true,
  staleDataRequiresWarning:true,unavailableNeverEqualsZero:true,
  noAutomatedLearnerDiagnosis:true,educationNeedToKnowOnly:true
});
export const PERMISSION_MATRIX=Object.freeze({
  'subject-teacher':['assigned-roster','assigned-attendance','assigned-academic','assigned-map','approved-classroom-guidance'],
  'advisory-teacher':['assigned-advisory-roster','assigned-advisory-attendance','approved-learning-summary','approved-classroom-guidance'],
  'eal-inclusion':['assigned-caseload','approved-classroom-guidance','relevant-learning-evidence'],
  'divisional-leader':['authorised-division-aggregate','authorised-student-scope'],
  'health-counsellor':['specialist-source-system-only'],
  'data-administrator':['configuration','audited-operations'],
  'public-demo':['synthetic-data-only']
});
export function assertPublicDemoBoundary(payload={}){
 if(!PUBLIC_DEMO_ONLY||LIVE_CONNECTORS_ENABLED)throw Error('The GitHub Pages demo must never enable live student data');
 if(payload?.liveIntegration===true||payload?.credentials||payload?.accessToken)
   throw Error('No production integration, credential or student information may be loaded in a public client');
 return true;
}
export async function connectProductionSource(_name){
 throw Error('Live AISG student systems are intentionally disconnected. Configure a reviewed, access-controlled backend; do not connect them from GitHub Pages.');
}
export function sourceState(){
 return Object.entries(SOURCE_CONTRACTS).map(([name,config])=>({
   name,status:'not connected',role:config.service,
   freshnessTargetMinutes:config.targetFreshnessMinutes
 }));
}
