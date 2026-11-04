import test from 'node:test';
import assert from 'node:assert/strict';
import {CLIMATE_METRICS,climatePercentage,climateSummary,climateIsSafeToPublish} from '../src/board-climate-data.mjs';
import {renderBoardClimate} from '../src/board-climate-view.mjs';

test('only aggregate, adequately sized results are published',()=>{
 for(const [id,metric] of Object.entries(CLIMATE_METRICS)){
  assert.ok(climateIsSafeToPublish(id),id);
  for(const row of metric.points){
   assert.ok(row.respondents>=20);
   assert.ok(row.favourable<=row.respondents);
   assert.ok(climatePercentage(row)>=0&&climatePercentage(row)<=100);
  }
 }
});
test('deduplicated highlights calculate correctly',()=>{
 assert.equal(climateSummary('g35Belong').percentage,91.8);
 assert.equal(climateSummary('g612Trusted').percentage,93.2);
 assert.equal(climateSummary('fGrowth').percentage,98.5);
 assert.equal(climateSummary('cWelcome').percentage,100);
 assert.equal(climateSummary('g612Trusted').change,6.9);
});
test('Fall 2025 caregiver trend excluded and anomalous item not charted',()=>{
 assert.equal(CLIMATE_METRICS.cWelcome.points.length,2);
 assert.equal(CLIMATE_METRICS.g35Trusted.points.length,2);
});
test('board climate view is aggregated, celebratory and transparent',()=>{
 const html=renderBoardClimate();
 for(const label of ['Reasons to Celebrate','Positive Momentum','Survey methodology','Selected strengths','93.2%','98.5%'])assert.ok(html.includes(label),label);
 for(const field of ['@aisgz.org','@qq.com','16songt','313716296'])assert.ok(!html.includes(field),field);
 assert.ok(html.includes('not a complete climate audit'));
});
