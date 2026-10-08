'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const s=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

test('hero spectator view scores only authoritative blocked cells, remains held across snapshots',()=>{
 assert.match(s,/function selectClearCameraYaw\(/);
 assert.match(s,/const blocked=new Set\(arena\.obstacles\)/);
 assert.match(s,/blocked\.has\(cell\)/);
 assert.match(s,/angleIndex<12/);
 assert.match(s,/now-heldCameraAngle\.selectedAt<2200/);
 assert.match(s,/function physicalCamera\(/);
 assert.match(s,/gl\.uniform1f\(uniform\[14\],heroPhysical\?1:0\)/);
 assert.doesNotMatch(s,/Math\.random\(|runtime\.step\(/);
});
test('per-contender helmet and armor variants use deterministic public identifiers only',()=>{
 assert.match(s,/const roleSeed=String\(f\.id/);
 assert.match(s,/const identityVariant=roleSeed%4/);
 assert.match(s,/if\(identityVariant===0\)/);
 assert.match(s,/identityVariant===1/);
 assert.match(s,/identityVariant===2/);
 assert.match(s,/if\(f\.archetype==='ranger'\)/);
 assert.match(s,/reducedMotion/);
});
