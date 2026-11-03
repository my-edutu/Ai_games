'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('public/ai-dungeon/warden-court-plan.js','utf8');
test('original court is bounded, seeded, and physically confined to existing walkable cells',async()=>{
 const {planWardenCourt}=await import('data:text/javascript,'+encodeURIComponent(source));
 const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>
  x===0||z===0||x===18||z===18||((x+z)%9===0)?'#':'.').join(''));
 const exit={x:15,z:14},a=planWardenCourt(map,exit,4);
 assert.deepEqual(a,planWardenCourt(map,exit,4));
 assert.ok(a.tiles.length>4&&a.tiles.length<=32);
 assert.ok(a.facades.length<=14);
 for(const tile of a.tiles){
  const x=tile.x+a.origin,z=tile.z+a.origin;
  assert.equal(map[z][x],'.');
  const d=Math.abs(exit.x-x)+Math.abs(exit.z-z);assert.ok(d>=2&&d<=4);
 }
 assert.deepEqual(planWardenCourt(map,{x:0,z:0},4).tiles,[]);
});
test('new chapter responds only to public boss truth and remains spectator-only',()=>{
 const code=fs.readFileSync('public/ai-dungeon/warden-court.js','utf8');
 assert.match(code,/u\.kind==='warden'&&u\.faction==='enemy'&&u\.hp>0/);
 assert.match(code,/bossWarning\?\.cells/);
 assert.match(code,/binding\.visible=active/);
 assert.doesNotMatch(code,/Math\.random|game\.step\(|fetch\(|localStorage/);
 const server=fs.readFileSync('scripts/serve-dungeon-stream.cjs','utf8');
 assert.match(server,/\/dungeon\/warden-court\.js/);
 const app=fs.readFileSync('public/ai-dungeon/app.js','utf8');
 assert.match(app,/enrichEnvironment\(world,s\.map,s\.floor,vaultedSites,s\.exit\)/);
});
