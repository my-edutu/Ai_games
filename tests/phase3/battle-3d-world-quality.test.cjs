'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const renderer=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/styles.css'),'utf8');
test('Gauntlet world has deterministic cosmetic biome detail and material surface treatment',()=>{
 assert.match(renderer,/function terrainDetails\(/);
 assert.match(renderer,/function fortification\(/);
 assert.match(renderer,/function atmosphericBackdrop\(/);
 assert.match(renderer,/vWorld/);
 assert.match(renderer,/surfaceNoise/);
 assert.doesNotMatch(renderer,/Math\.random\(/);
 assert.doesNotMatch(renderer,/\.step\(/);
});
test('tactical action inset is framed away from lower battlefield and supports responsive layouts',()=>{
 assert.match(renderer,/const frameY=Math\.round\(canvas\.height\*\.65\)/);
 assert.match(css,/battle-3d-focus[^}]*top:/);
 assert.match(css,/battle-3d-focus[^}]*width:27%/);
});
