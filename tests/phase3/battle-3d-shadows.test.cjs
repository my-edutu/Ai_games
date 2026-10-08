'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('static cover and dynamically posed fighters create bounded directional ground shadows',()=>{
 assert.match(src,/function groundShadow\(/);
 assert.match(src,/groundShadow\(b,x,z/);
 assert.match(src,/groundShadow\(b,p\.x,p\.z/);
 assert.match(src,/function fortification\(/);
 assert.match(src,/function contender\(/);
 assert.doesNotMatch(src,/Math\.random\(|runtime\.step\(/);
});
