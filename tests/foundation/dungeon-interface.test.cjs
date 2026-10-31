'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const file=require('node:path').resolve(__dirname,'../../public/ai-dungeon/spectator-ui.js');
async function load(){assert.ok(fs.existsSync(file),'spectator UI module must exist');return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'))}
test('boss encounter target converts grid to world coordinates exactly once',async()=>{const {encounterTarget}=await load();const p=encounterTarget({x:-8,z:-8},{x:3,z:4},19,true);assert.ok(Math.abs(p.x-(-7.44))<1e-9);assert.ok(Math.abs(p.z-(-7.16))<1e-9)});
test('no nearby boss leaves the focused position unchanged',async()=>{const {encounterTarget}=await load();assert.deepEqual(encounterTarget({x:2,z:-3},{x:17,z:17},19,false),{x:2,z:-3});assert.deepEqual(encounterTarget({x:2,z:-3},null,19,true),{x:2,z:-3})});
test('camera projection supports another odd map size without a magic offset',async()=>{const {encounterTarget}=await load();assert.deepEqual(encounterTarget({x:0,z:0},{x:10,z:10},21,true),{x:0,z:0})});
test('only high-priority events become intrusive scene alerts',async()=>{const {isSceneAlert}=await load();for(const kind of ['loot','kill','guard','disarm','block','evade','combat','healing'])assert.equal(isSceneAlert({kind}),false,kind);for(const kind of ['telegraph','phase','defeat'])assert.equal(isSceneAlert({kind}),true,kind)});
