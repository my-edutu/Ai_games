'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const s=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('3D arena has physically extended original landscape underneath the tactical platform',()=>{
 assert.match(s,/function surroundingTerrain\(/);
 assert.match(s,/surroundingTerrain\(b,a,t\)/);
 assert.match(s,/quality==='low'/);
 assert.match(s,/worldStatic\(/);
 assert.doesNotMatch(s,/Math\.random\(|runtime\.step\(/);
});
