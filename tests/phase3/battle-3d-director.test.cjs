'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const renderer=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
const style=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/styles.css'),'utf8');
test('3D broadcast offers an independently directed tactical closeup without changing world rules',()=>{
 assert.match(renderer,/function spectatorCloseup\(/);
 assert.match(renderer,/gl\.scissor\(/);
 assert.match(renderer,/SCISSOR_TEST/);
 assert.match(renderer,/snapshot\.recentEvents/);
 assert.match(renderer,/\.setAttribute\('aria-label','Live action closeup'\)/);
 assert.match(style,/battle-3d-focus/);
 assert.doesNotMatch(renderer,/\.step\(/);
});
