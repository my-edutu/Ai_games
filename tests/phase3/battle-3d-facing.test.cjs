'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('3D actors use bounded pose rotation to face observed opponents or movement',()=>{
 assert.match(source,/function actorHeading\(/);
 assert.match(source,/pushPose\(/);
 assert.match(source,/popPose\(/);
 assert.match(source,/const headings=new Map\(\)/);
 assert.match(source,/headings\.clear\(\)/);
 assert.match(source,/Math\.atan2\(/);
 assert.doesNotMatch(source,/Math\.random\(/);
});
