'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const camera=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

test('Pass308 native 390 public guardian performance moves its physical lens only across authentic notice, brace and release',async()=>{
 const {publicGuardianDuelCameraElevation:e}=await camera();
 const aspect=390/844,strength=.818181818;
 const first=e(aspect,strength,.00198,false),brace=e(aspect,strength,.48889,false),release=e(aspect,strength,.89953,false);
 assert.equal(first,21,'first public warning uses original high view');
 assert.ok(brace<18.3&&brace>15.2,'real planted foreclaws earn a visible profile shot');
 assert.ok(release<15.1&&release>14.7,'real shell opening holds a still lower profile');
 assert.ok(first-brace>2&&brace-release>2,'not three near-identical overhead frames');
 assert.equal(e(aspect,strength,1,false),release,'release holds a stable final shot');
 assert.equal(e(aspect,strength,.89953,false),release,'same original public beat replays deterministically');
});
test('unknown clock, withheld warning, reduced motion, desktop and landscape retain the original complete view',async()=>{
 const {publicGuardianDuelCameraElevation:e}=await camera();
 const a=390/844;
 for(const b of [undefined,null,NaN,Infinity,-Infinity,-1,0,1.01,'0.5'])
   assert.equal(e(a,.82,b,false),21,'no imagined unrevealed scene');
 for(const strength of [0,.35,.70,NaN,Infinity,-1])
   assert.equal(e(a,strength,.8,false),21,'weak/invalid attention does not stage new threat');
 for(const x of [320/740,390/844])
   assert.equal(e(x,.82,.8,true),21,'reduced motion keeps stable proven lens');
 for(const x of [844/390,1280/900,.2,.61,NaN,Infinity])
   assert.equal(e(x,.82,.8,false),21,'other camera classes retain prior framing');
 assert.ok(e(a,.75,.8,false)>e(a,.82,.8,false),'no discontinuous low-attention camera cut');
});
test('the live lens consumes only the source authenticated Follow guardian encounter, not engine truth',()=>{
 assert.match(scene,/publicGuardianDuelCameraElevation\(\s*aspect,closestThreat\.strength,closestThreat\.encounterBeat,\s*settings\.reducedMotion\)/);
 assert.match(scene,/if \(!result && closestThreat\?\.strength\) \{/);
 assert.match(scene,/portraitEncounterOrbit=publicPortraitGuardianOrbitAngle\(/);
 assert.match(scene,/portraitEncounterOrbit \? portraitCameraOffset/);
 assert.doesNotMatch(scene,/privateMaze.*publicGuardianDuelCameraElevation|secretRoute.*duetElevation/);
});

test('explicit public stream asset allowlist serves the real 3D guardian cinematic module',()=>{
 const server=fs.readFileSync(path.join(root,'scripts/serve-maze-stream.cjs'),'utf8');
 assert.match(server,/PUBLIC_ASSETS = \[[^\]]*'guardian-duel-camera\.mjs'/,
   'WebGL live server must serve every imported module, not silently fall back to 2D');
 assert.match(server,/const routes=new Map\(PUBLIC_ASSETS\.map\(/,
   'explicit route security boundary must remain intact');
 assert.doesNotMatch(server,/\.\.\/\.\.\//,'no broad path traversal fallback for module repair');
});
