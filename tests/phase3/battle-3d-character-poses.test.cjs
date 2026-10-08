'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

test('character poses depend on public AI intent, with distinct legitimate weapon silhouettes',()=>{
 assert.match(source,/function characterizeWeapon\(/);
 assert.match(source,/function characterPose\(/);
 assert.match(source,/f\.intent==='healing'/);
 assert.match(source,/f\.intent==='attacking'/);
 for(const weapon of ['marksman','scattergun','sidearm','carbine'])assert.match(source,new RegExp(weapon));
 assert.doesNotMatch(source,/f\.weapon==='sniper'/);
 assert.match(source,/reducedMotion/);
});
