'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function shouldBuildUncachedTerrainBase(');
const finish=html.indexOf('function getTerrainBaseResidencyAudit()',begin);
assert.ok(begin>=0&&finish>begin,'resident-first terrain helper');
const helper=html.slice(begin,finish);
const check=new Function('terrainCache','terrainCacheKey','climateKey','resident',
 helper+';return shouldBuildUncachedTerrainBase(climateKey,resident)');
for(const [cache,oldKey,nextKey,resident,expected] of [
 [null,'','0:0',false,true],
 [[], '0:0','0:0',false,false],
 [[], '0:0','1:0',false,true],
 [[], '0:0','1:0',true,false],
 [null, '', '3:1',true,false]
])assert.equal(check(cache,oldKey,nextKey,resident),expected);
const lookup=html.indexOf('const landscapeReady=Boolean');
const build=html.indexOf('buildValleySurface();',lookup);
const scene=html.indexOf('const staticKey=stationarySceneKey',lookup);
assert.ok(lookup>=0&&lookup<build&&build<scene,'landscape lookup before cold base');
assert.match(html,/getValleySurfaceBuildAudit,getTerrainBaseResidencyAudit,/);
const inline=html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
assert.ok(inline,'inline game');
assert.doesNotThrow(()=>new Function(inline[1]));
console.log('W149 warm season source residency contracts passed; not a live FPS measurement');
