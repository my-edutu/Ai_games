'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('arena geometry is cached by source arena and loaded in one GPU buffer',()=>{
 assert.match(source,/function worldStatic\(/);
 assert.match(source,/function worldDynamic\(/);
 assert.match(source,/staticCache/);
 assert.match(source,/STATIC_DRAW/);
 assert.match(source,/sceneBuilds/);
 assert.match(source,/function drawScene\(/);
 assert.doesNotMatch(source,/Math\.random\(/);
});
