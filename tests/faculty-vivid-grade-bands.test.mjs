import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reportGradeBand,mypBestFitMarker} from '../src/report-card-signals.mjs';

const style=readFileSync(new URL('../src/evidence-legibility-sitewide.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

function luminance(hex){
 const x=hex.slice(1).match(/.{2}/g).map(c=>parseInt(c,16)/255)
  .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return .2126*x[0]+.7152*x[1]+.0722*x[2];
}
function ratio(foreground,background){
 const [a,b]=[luminance(foreground),luminance(background)].sort((x,y)=>y-x);
 return (a+.05)/(b+.05);
}
test('Every MYP band keeps the bright legend colours and readable ink',()=>{
 const bands=[
  {score:2,band:'band-low',fill:'#a6373f',ink:'#ffffff'},
  {score:4,band:'band-mid-low',fill:'#e4a15f',ink:'#172f38'},
  {score:5,band:'band-mid-high',fill:'#a6bd88',ink:'#172f38'},
  {score:6,band:'band-mid-high',fill:'#a6bd88',ink:'#172f38'},
  {score:7,band:'band-high',fill:'#246b4f',ink:'#ffffff'}
 ];
 for(const v of bands){
  assert.equal(reportGradeBand(v.score,'1–7'),v.band);
  assert.ok(ratio(v.ink,v.fill)>=4.5, 'Text contrast for grade '+v.score);
  const token=new RegExp('evidence-report-grade\\.'+v.band+'\\s*\\{[^}]*'+v.fill.replace('#','\\#'),'m');
  assert.match(style,token,'Missing bright background for '+v.band);
  assert.ok(style.includes('--landing-grade-ink:'+v.ink));
 }
 assert.equal(reportGradeBand('Developing','E/P/D/B'),null,'PYP grades do not receive MYP colours');
 assert.match(mypBestFitMarker({mypBestFit:true,provisional:true}),/myp-best-fit-marker/);
});
test('Solid colours apply to every Faculty everyday class and never other metrics or focused views',()=>{
 assert.match(app, /class-evidence-result evidence-report-grade/);
 assert.match(style,/data-workspace="faculty"/);
 assert.match(style,/data-roster-layout="everyday".*?\.evidence-report-grade\.band-low/s);
 assert.match(style,/\.evidence-cell-open \.class-evidence-result\.evidence-report-grade\.evidence-heat/);
 assert.doesNotMatch(style,/data-roster-layout="focused"[^{]*\.evidence-report-grade/);
 assert.ok(index.includes('evidence-legibility-sitewide.css?v=20261112vivid2'));
 assert.ok(index.includes('evidence-previews.css?v=20261112scroll1'));
});
