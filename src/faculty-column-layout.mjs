/** Stable, presentation-only ordering and sizing of Faculty table columns.
 *  All indices refer to original source columns, never the current visual order.
 *  Learner remains first and Support information remains last.
 */
export const COLUMN_WIDTHS=Object.freeze({compact:96,standard:124,wide:180});
export const MIN_COLUMN_WIDTH=88;
export const MAX_COLUMN_WIDTH=280;
export function normaliseColumnOrder(value,count){
 const n=Number.isInteger(count)?Math.max(0,count):0;
 const original=Array.from({length:n},(_,i)=>i);
 if(n<3)return original;
 const middle=original.slice(1,-1);
 const seen=new Set();
 const ordered=[];
 for(const index of Array.isArray(value)?value:[]){
  if(!middle.includes(index)||seen.has(index))continue;
  ordered.push(index);seen.add(index);
 }
 for(const index of middle)if(!seen.has(index))ordered.push(index);
 return [0,...ordered,n-1];
}
export function moveColumn(order,source,target,after=false){
 const current=normaliseColumnOrder(order,Array.isArray(order)?order.length:0);
 if(current.length<3||source===target||source===0||source===current.length-1||
   target===0||target===current.length-1||
   !current.includes(source)||!current.includes(target))return current;
 const middle=current.slice(1,-1).filter(index=>index!==source);
 const at=middle.indexOf(target);
 middle.splice(at+(after?1:0),0,source);
 return [0,...middle,current.length-1];
}
export function clampColumnWidth(value){
 const n=Number(value);
 if(!Number.isFinite(n))return COLUMN_WIDTHS.standard;
 return Math.round(Math.max(MIN_COLUMN_WIDTH,Math.min(MAX_COLUMN_WIDTH,n)));
}
export function normaliseColumnWidths(value,count){
 const result={};
 if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const [raw,n] of Object.entries(value)){
  const index=Number(raw);
  if(!Number.isInteger(index)||index<=0||index>=count-1||!Number.isFinite(Number(n)))continue;
  result[index]=clampColumnWidth(n);
 }
 return result;
}
export function widthPreset(value){
 const n=Number(value);
 for(const [name,width] of Object.entries(COLUMN_WIDTHS)){
  if(n===width)return name;
 }
 return Number.isFinite(n)?'custom':'standard';
}
