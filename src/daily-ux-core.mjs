/** Presentation-only helpers. No student data, network requests or AI inference. */
export function safeText(value){return String(value==null?'':value).trim();}
export function normaliseNumber(value){
 const raw=safeText(value).replace(/,/g,'');
 if(!raw||raw==='—'||/not available|not collected|no (current|comparable|issued)|^n\/a$/i.test(raw))return null;
 const match=raw.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:%|\/\s*\d+|RIT)?(?:\b|$)/i);
 return match?Number(match[1]):null;
}
export function compareEvidence(a,b){
 const na=normaliseNumber(a),nb=normaliseNumber(b);
 if(na!==null&&nb!==null)return na-nb;
 if(na!==null)return -1;
 if(nb!==null)return 1;
 return safeText(a).localeCompare(safeText(b),undefined,{numeric:true,sensitivity:'base'});
}
export function csvEscape(value){
 const text=safeText(value).replace(/\s+/g,' ');
 return /[",\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;
}
export function exportCsv(headers,rows){
 return '\uFEFF'+[headers,...rows].map(row=>row.map(csvEscape).join(',')).join('\r\n')+'\r\n';
}
export function filteredRecords(records,search='',fields={}){
 const q=safeText(search).toLocaleLowerCase();
 return records.filter(record=>{
  const all=record.join(' ').toLocaleLowerCase();
  if(q&&!all.includes(q))return false;
  return Object.entries(fields).every(([index,needle])=>!safeText(needle)||
   safeText(record[Number(index)]).toLocaleLowerCase().includes(safeText(needle).toLocaleLowerCase()));
 });
}
export function sanitisePreference(value,allowed){
 return allowed.includes(value)?value:allowed[0];
}
export function parsePreferences(json){
 try{
  const result=JSON.parse(json);
  return result&&typeof result==='object'&&!Array.isArray(result)?result:{};
 }catch{return {}}
}
export function sortEvidenceRows(rows,col,descending=false){
 return rows.map((row,i)=>({row,i})).sort((a,b)=>{
  const cmp=compareEvidence(a.row[col],b.row[col])*(descending?-1:1);
  return cmp||a.i-b.i;
 }).map(x=>x.row);
}
