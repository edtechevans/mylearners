import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const brand=readFileSync(new URL('../src/aisg-brand-duotone.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const evidence=readFileSync(new URL('../src/sitewide-palette.css',import.meta.url),'utf8');

function luminance(hex){
 const channels=hex.replace('#','').match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255)
  .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}
function contrast(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('AISG red and navy tokens load after the existing design system',()=>{
 assert.match(brand,/--aisg-brand-red:#a71f35/);
 assert.match(brand,/--aisg-brand-navy:#10324e/);
 assert.match(brand,/--aisg-brand-navy-deep:#0b263e/);
 assert.ok(html.includes('aisg-brand-duotone.css?v=20261102r1'));
 assert.ok(html.indexOf('vision-ui.css')<html.indexOf('aisg-brand-duotone.css'));
});
test('Brand navigation and Board editorial hero feature red and navy, not more navy tiles',()=>{
 assert.match(brand,/#app \.top nav\.roles button\.selected/);
 assert.match(brand,/#app\[data-workspace="board"\] \.board-heading/);
 assert.match(brand,/#app\[data-workspace="board"\] \.board-strength-card:first-child/);
 assert.match(brand,/#app\[data-workspace="board"\] \.board-strength-card:nth-child\(2\)/);
 assert.match(brand,/#app\[data-workspace="board"\] \.board-nav-tabs button\.active/);
 assert.match(brand,/linear-gradient\(110deg/);
 assert.match(brand,/background:var\(--aisg-brand-red\)!important/);
});
test('Brand colour never overrides the four performance bands or support classifications',()=>{
 assert.doesNotMatch(brand,/\.index-band-|\.band-(?:low|mid|high)|\.evidence-cell-open|\.faculty-data-wall|\.sss-support-flag|\.student-status/);
 for(const token of ['low','mid-low','mid-high','high'])assert.match(evidence,new RegExp('--aisg-evidence-'+token+':'));
 assert.match(brand,/retain their established, independent meanings/);
});
test('Red brand text on light surfaces and white text on red/navy reach WCAG AA contrast',()=>{
 for(const [foreground,background] of [
  ['#ffffff','#a71f35'],['#ffffff','#0b263e'],
  ['#a71f35','#ffffff'],['#a71f35','#fff4f4'],['#ffffff','#88182d']
 ])assert.ok(contrast(foreground,background)>=4.5,
  'Insufficient text contrast: '+foreground+' on '+background+' ('+contrast(foreground,background).toFixed(2)+':1)');
});
