import test from 'node:test';
import assert from 'node:assert/strict';
import {renderStudentPhoto,photoPreviewPosition,installStudentPhotoPreview} from '../src/student-photo-preview.mjs';

const student={
 id:'DEMO-0012',name:"Alex O'Connor & Friends <test>",
 grade:'G7',classId:'G7-A',portraitSeed:'DEMO-0012'
};
test('Shared photo trigger reuses existing fictional portrait and escapes learner data',()=>{
 const html=renderStudentPhoto(student,'leader');
 assert.match(html,/type="button" class="student-photo-trigger photo-leader"/);
 assert.match(html,/data-photo-preview="DEMO-0012"/);
 assert.match(html,/Alex O&#39;Connor &amp; Friends &lt;test&gt;/);
 assert.match(html,/data-photo-grade="G7"/);
 assert.match(html,/data-photo-class="G7-A"/);
 assert.match(html,/aria-label="Enlarge portrait of/);
 assert.match(html,/src="data:image\/svg\+xml/);
 assert.doesNotMatch(html,/<img[^>]+alt="[^"]*Alex/,'button, not a nested image label, is accessible focus target');
 assert.doesNotMatch(html,/ title=/,'no competing native browser tooltip');
});
test('Missing learner renders no photo; invalid size defaults to small',()=>{
 assert.equal(renderStudentPhoto(null),'');
 assert.match(renderStudentPhoto(student,'unknown'),/photo-small/);
});
test('Portrait overlay prefers below the source when enough room',()=>{
 assert.deepEqual(photoPreviewPosition({left:220,width:34,top:170,bottom:206},
  {width:236,height:300},{width:900,height:700}),{left:119,top:216});
});
test('Portrait overlay moves above near bottom and clamps against viewport sides',()=>{
 assert.deepEqual(photoPreviewPosition({left:875,width:32,top:650,bottom:687},
  {width:236,height:300},{width:900,height:700}),{left:652,top:340});
 assert.deepEqual(photoPreviewPosition({left:0,width:26,top:25,bottom:58},
  {width:236,height:300},{width:900,height:700}),{left:12,top:68});
});
test('Portrait controller can be safely imported in headless unit-test environments',()=>{
 const controller=installStudentPhotoPreview(null);
 assert.equal(typeof controller.dismiss,'function');
 assert.doesNotThrow(()=>controller.dismiss());
});
