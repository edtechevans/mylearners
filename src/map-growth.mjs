/** MAP demonstration helpers.
 * Growth = observed RIT point change between comparable valid tests.
 * Projection = an ILLUSTRATIVE mock value, not official NWEA norms.
 */
export const MAP_SUBJECTS=['Mathematics','Reading','Language Usage'];
export const FALL_WINDOW='F26';
export const FALL_LABEL='Fall 2026';
const valid=(x,subject)=>x?.subject===subject&&x.status==='valid'&&Number.isFinite(x.rit)&&typeof x.date==='string';
export function subjectMapRecords(records,subject='Mathematics'){
 return (records||[]).filter(x=>valid(x,subject)).slice().sort((a,b)=>a.date.localeCompare(b.date));
}
export function mapGrowthSeries(records,subject='Mathematics'){
 const data=subjectMapRecords(records,subject);
 return data.slice(1).map((to,index)=>{
  const from=data[index];
  const actual=to.rit-from.rit;
  const projected=Number.isFinite(to.projection)&&to.projection>0?to.projection:null;
  return {
   from:from.window,to:to.window,fromKey:from.key,toKey:to.key,
   actual,projected,delta:projected===null?null:actual-projected,
   met:projected===null?null:actual>=projected,
   previousRit:from.rit,currentRit:to.rit
  };
 });
}
export function latestMapGrowth(records,subject='Mathematics',window=FALL_WINDOW){
 const data=subjectMapRecords(records,subject);
 const current=data.find(x=>x.key===window);
 const base={subject,window,latest:data.at(-1)||null,current:current||null,previous:null,
  status:'not-assessed',actual:null,projected:null,delta:null,met:null};
 if(!current)return {...base,status:data.length?'missing-current':'not-assessed'};
 const previous=data.filter(x=>x.date<current.date).at(-1);
 if(!previous)return {...base,status:'no-comparison'};
 const actual=current.rit-previous.rit;
 const projected=Number.isFinite(current.projection)&&current.projection>0?current.projection:null;
 return {...base,status:'comparable',previous,actual,projected,
  delta:projected===null?null:actual-projected,
  met:projected===null?null:actual>=projected};
}
export function mapGrowthSummary(studentIds,mapByStudent,subjects=MAP_SUBJECTS){
 let comparable=0,met=0,withCurrent=0;
 for(const id of studentIds){
  for(const subject of subjects){
   const g=latestMapGrowth(mapByStudent[id]||[],subject);
   if(g.current)withCurrent++;
   if(g.status==='comparable'&&g.projected!==null){
    comparable++;if(g.met)met++;
   }
  }
 }
 return {comparable,met,withCurrent,totalPotential:studentIds.length*subjects.length,
  rate:comparable?Math.round(met/comparable*100):null};
}
export function growthFormat(value){
 return value===null||value===undefined?'Not available':(value>0?'+':'')+String(value);
}
