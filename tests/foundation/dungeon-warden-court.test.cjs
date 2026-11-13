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

test('natural seven-cell cleared Warden arena still has original carved enclosing stone',async()=>{
 const {planWardenCourt}=await import('data:text/javascript,'+encodeURIComponent(source));
 const a=Array.from({length:19},()=>Array(19).fill('#'));
 for(let z=6;z<=12;z++)for(let x=6;x<=12;x++)a[z][x]='.';
 const court=planWardenCourt(a.map(row=>row.join('')),{x:9,z:9},1);
 assert.ok(court.tiles.length>0&&court.facades.length>0&&court.facades.length<=14);
 assert.ok(court.facades.every(face=>Number.isFinite(face.x)&&Number.isFinite(face.z)&&Number.isFinite(face.yaw)));
});

test('Warden court keeps its actual 7x7 traversable duel clear of sightline-breaking loose scenery',async()=>{
 const {planWardenCourtNegativeSpace:plan}=await import('data:text/javascript,'+encodeURIComponent(source));
 const rows=Array.from({length:19},()=>Array(19).fill('#'));
 for(let z=6;z<=12;z++)for(let x=6;x<=12;x++)rows[z][x]='.';
 const map=rows.map(r=>r.join('')),exit={x:9,z:9};
 assert.deepEqual(plan(map,exit,9,9),{clearInterior:true,quietPerimeter:true});
 assert.deepEqual(plan(map,exit,12,12),{clearInterior:true,quietPerimeter:true});
 assert.deepEqual(plan(map,exit,13,9),{clearInterior:false,quietPerimeter:true});
 assert.deepEqual(plan(map,exit,14,9),{clearInterior:false,quietPerimeter:false});
 assert.deepEqual(plan(map,{x:0,z:0},9,9),{clearInterior:false,quietPerimeter:false});
 assert.equal(map[9][9],'.','no real walkable court cell is removed');
 const environment=fs.readFileSync('public/ai-dungeon/environment.js','utf8');
 assert.match(environment,/bossCourtLooseClutterSuppressed/);
 assert.match(environment,/bossCourtTallFixturesSuppressed/);
 assert.match(environment,/court\.quietPerimeter/);
 assert.match(environment,/court\.clearInterior/);
});
