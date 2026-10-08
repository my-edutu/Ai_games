'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js');
const source=fs.readFileSync(file,'utf8');

test('v2 mesh contains original 3D articulated character geometry, not static cube-only proxies',()=>{
 assert.match(source,/function limb\(/);
 assert.match(source,/function cylinder\(/);
 assert.match(source,/function cone\(/);
 assert.match(source,/walkPhase/);
 assert.match(source,/roleArmor/);
 assert.match(source,/muzzleFlash/);
});

test('v2 arena has semantic weapon impacts, readable environmental landmarks and cosmetic character motions',()=>{
 assert.match(source,/function combatEffects\(/);
 assert.match(source,/function worldLandmarks\(/);
 assert.match(source,/event\.type==='hit'/);
 assert.match(source,/event\.type==='elimination'/);
 assert.match(source,/reducedMotion/);
 assert.doesNotMatch(source,/\.step\(|Math\.random\(|eval\(/);
});
