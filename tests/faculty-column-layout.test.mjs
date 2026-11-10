import test from 'node:test';
import assert from 'node:assert/strict';
import {COLUMN_WIDTHS,MIN_COLUMN_WIDTH,MAX_COLUMN_WIDTH,normaliseColumnOrder,
 moveColumn,clampColumnWidth,normaliseColumnWidths,widthPreset}
 from '../src/faculty-column-layout.mjs';

test('default positions keep learner fixed first and support last',()=>{
 assert.deepEqual(normaliseColumnOrder(null,6),[0,1,2,3,4,5]);
 assert.deepEqual(normaliseColumnOrder([3,2,3,999,-1,1,0,5],6),[0,3,2,1,4,5]);
 assert.deepEqual(normaliseColumnOrder([4,1],6),[0,4,1,2,3,5]);
 assert.deepEqual(normaliseColumnOrder(null,1),[0]);
});
test('moving a subject preserves every original data-column identity',()=>{
 const original=[0,1,2,3,4,5];
 assert.deepEqual(moveColumn(original,2,4,true),[0,1,3,4,2,5]);
 assert.deepEqual(moveColumn(original,4,2,false),[0,1,4,2,3,5]);
 assert.deepEqual(moveColumn(original,3,3,false),original);
 assert.deepEqual(moveColumn(original,0,2),original);
 assert.deepEqual(moveColumn(original,2,0),original);
 assert.deepEqual(moveColumn(original,2,5),original);
 assert.deepEqual(moveColumn(original,5,2),original);
 assert.deepEqual(new Set(moveColumn(original,4,1)),new Set(original));
});
test('width presets and persisted custom widths are bounded',()=>{
 assert.equal(widthPreset(undefined),'default');
 assert.equal(widthPreset(96),'compact');
 assert.equal(widthPreset(124),'standard');
 assert.equal(widthPreset(180),'wide');
 assert.equal(widthPreset(147),'custom');
 assert.equal(clampColumnWidth(70),MIN_COLUMN_WIDTH);
 assert.equal(clampColumnWidth(1200),MAX_COLUMN_WIDTH);
 assert.equal(clampColumnWidth('160'),160);
 assert.deepEqual(normaliseColumnWidths({'0':200,'2':'80','3':'164','4':300,'5':100,'x':190},6),
  {'2':MIN_COLUMN_WIDTH,'3':164,'4':MAX_COLUMN_WIDTH});
 assert.deepEqual(normaliseColumnWidths(null,8),{});
});
