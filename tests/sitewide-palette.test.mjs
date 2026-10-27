import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const stylesheet=readFileSync(new URL('../src/sitewide-palette.css',import.meta.url),'utf8');
const boardStyle=readFileSync(new URL('../src/student-experience-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function luminance(hex){
 const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255)
  .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
const contrast=(fg,bg)=>{const l=[luminance(fg),luminance(bg)].sort((a,b)=>b-a);return (l[0]+.05)/(l[1]+.05)};
test('Shared site palette directly matches the Board’s sky, mint and lilac tile washes',()=>{
 for(const color of ['#dff1fa','#dff4ee','#ebe5fc']){
  assert.match(boardStyle,new RegExp(color,'i'));
  assert.match(stylesheet,new RegExp(color,'i'));
 }
 assert.match(stylesheet,/--aisg-wash-sky/);
 assert.match(stylesheet,/--aisg-wash-mint/);
 assert.match(stylesheet,/--aisg-wash-lilac/);
 assert.ok(html.indexOf('board-dp-evidence.css')<html.indexOf('sitewide-palette.css'));
});
test('The three light tile backgrounds retain readable navy labels and values',()=>{
 for(const color of ['#dff1fa','#dff4ee','#ebe5fc','#ffffff']){
  assert.ok(contrast('#123b59',color)>=7,
    'Contrast must exceed WCAG AAA 7:1 for small navy text on '+color);
 }
});
test('Only summary surfaces receive Board-inspired gradients, not data tables or learner labels',()=>{
 for(const role of ['faculty-daily-summary','leader-learning-grid','sss-count-grid','student-landing-grid']){
  assert.ok(stylesheet.includes('.'+role+'>'),role+' summary surface');
 }
 assert.match(stylesheet,/--tile-tint/);
 assert.match(stylesheet,/radial-gradient/);
 assert.match(stylesheet,/pointer-events:none/);
 assert.match(stylesheet,/@media\(max-width:760px\)/);
 assert.match(stylesheet,/@media print/);
 assert.match(stylesheet,/\.roster-daily,\s*#app \.leader-detail/);
 assert.doesNotMatch(stylesheet,/\b(?:risk|low-achieving|failing-student)-red\b/i);
});
