'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('biomes include capped original 3D terrain props without registering simulated obstacles',()=>{
 assert.match(source,/function environmentProps\(/);
 assert.match(source,/arena\.theme==='arctic'/);
 assert.match(source,/arena\.theme==='neon'/);
 assert.match(source,/arena\.theme==='ember'/);
 assert.match(source,/worldStatic\(/);
 assert.doesNotMatch(source,/Math\.random\(/);
 assert.doesNotMatch(source,/runtime\.step\(/);
});
