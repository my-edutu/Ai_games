'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('the focused dungeon test command includes this regression suite',()=>{
 const p=JSON.parse(read('package.json'));
 assert.match(p.scripts['dungeon:test'],/tests\/foundation\/dungeon-authored-ornaments\.test\.cjs/);
});


test('authored model hides procedural-only root halo and satellites; fallback can restore them',()=>{
 const characters=read('public/ai-dungeon/characters.js');
 const assets=read('public/ai-dungeon/model-assets.js');
 assert.match(characters,/const proceduralOrnaments=\[\.\.\.aura,\.\.\.articulatedOrbs\]/);
 assert.match(characters,/setAuthored\(enabled\)/);
 assert.match(characters,/ornament\.visible=!enabled/);
 assert.match(characters,/get hiddenProceduralOrnamentCount\(\)/);
 assert.match(assets,/actor\.detail\?\.setAuthored\?\.\(true\)/,'GLB attach suppresses only duplicate fallback art');
 assert.match(assets,/actor\.detail\?\.setAuthored\?\.\(false\)/,'GLB disposal restores procedural fallback art');
 assert.match(assets,/hiddenFallbackOrnamentMeshes:/,'real renderer reports actual hidden ornament mesh count');
 assert.match(assets,/hiddenFallbackOrnamentActors:/,'real renderer exposes how many GLB characters have duplicate art suppressed');
});

test('the suppression stays cosmetic and retains real authoritative boss warnings',()=>{
 const assets=read('public/ai-dungeon/model-assets.js');
 const characters=read('public/ai-dungeon/characters.js');
 const app=read('public/ai-dungeon/app.js');
 assert.match(app,/a\.telegraph\.visible=u\.hp>0/,'authoritative boss warning remains in the actual runtime');
 assert.match(characters,/const haloA=ring\(root/);
 assert.match(characters,/const haloB=ring\(root/);
 assert.match(characters,/for\(let i=0;i<3;i\+\+\).*articulatedOrbs\.push\(orb\)/);
 assert.doesNotMatch(assets,/DungeonRuntime|Math\.random\(/);
});
