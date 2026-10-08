'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('result cinematic obeys authoritative game winner and distinguishes technical failure',()=>{
 assert.match(source,/function victorySequence\(/);
 assert.match(source,/snapshot\.result\.kind!=='game'/);
 assert.match(source,/snapshot\.result\.winnerId/);
 assert.match(source,/snapshot\.scene==='result'/);
 assert.match(source,/reducedFlash/);
});
