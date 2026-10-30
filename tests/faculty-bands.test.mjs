import test from 'node:test';
import assert from 'node:assert/strict';
import {experienceBand,formatIndex,quartileBand} from '../src/faculty-bands.mjs';
test('fixed experience bands respect all four −2 to +2 intervals',()=>{
 for(const [v,band] of [[-2,'band-low'],[-1,'band-mid-low'],[-0.5,'band-mid-low'],[0,'band-mid-high'],[0.5,'band-mid-high'],[1,'band-high'],[2,'band-high']])assert.equal(experienceBand(v),band);
 assert.equal(experienceBand(null),null);
 assert.equal(formatIndex(1.5),'+1.50');
 assert.equal(formatIndex(-0.67),'-0.67');
 assert.equal(formatIndex(0),'0.00');
 assert.equal(formatIndex(null),'—');
});
test('quartiles use same-cohort midranks and suppress small or absent groups',()=>{
 const cohort=Array.from({length:80},(_,i)=>i+1);
 for(const [v,expected] of [[1,'Q1'],[30,'Q2'],[45,'Q3'],[80,'Q4']])assert.equal(quartileBand(v,cohort).label,expected);
 assert.equal(quartileBand(10,[1,2,3,4]),null);
 assert.equal(quartileBand(100,cohort),null);
 assert.equal(quartileBand(null,cohort),null);
 const tied=[...Array(20).fill(1),...Array(20).fill(2),...Array(20).fill(3),...Array(20).fill(4)];
 assert.equal(quartileBand(1,tied).label,'Q1');
 assert.equal(quartileBand(4,tied).label,'Q4');
});
