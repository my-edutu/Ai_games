'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const shader=source.split('const fs=`')[1]?.split('`;')[0]||'';
test('W430 use existing physically truthful atlas for software freight and home roads',()=>{
 const a=shader.indexOf('}else if(vMaterial>2.5&&vMaterial<3.5){'),
  b=shader.indexOf('}else if(vMaterial>3.5&&vMaterial<4.5){',a),
  road=shader.slice(a,b);
 assert.ok(a>=0&&b>a);
 assert.match(road,/if\(groundAtlasFast>\.5\)/);
 assert.match(road,/retainedRoadColor=texture2D\(groundAtlas,roadUV\)/);
 assert.match(road,/roadGrit=hash3/);
 assert.match(road,/\}else\{\s*float dust=noise3/);
 assert.match(road,/float gravel=noise3/);
 assert.match(road,/weatherWetness\*\.67/);
});
test('W430 original foliage hardware surface still exact, software spatially stable',()=>{
 const a=shader.indexOf('}else if(vMaterial>3.5&&vMaterial<4.5){'),
  b=shader.indexOf('}else if(vMaterial>4.5&&vMaterial<5.5){',a),
  foliage=shader.slice(a,b);
 assert.ok(a>=0&&b>a);
 assert.match(foliage,/if\(groundAtlasFast>\.5\)/);
 assert.match(foliage,/leafFleck=hash3/);
 assert.match(foliage,/else c\*=\.75\+\.38\*noise3\(vWorld\*3\.5\)/);
 assert.match(shader,/if\(vMaterial>2\.5&&vMaterial<8\.5\)/);
});
test('W430 rendering evidence never claims hardware FPS or invents work',()=>{
 assert.match(source,/function getSoftwareSceneMaterialAudit\(\)/);
 assert.match(source,/getSoftwareResolutionAudit,getSoftwareSceneMaterialAudit,getHardwareResolutionAudit/);
 assert.match(source,/sourceRoad:'one-retained-world-aligned-ground-atlas-plus-cell-grit'/);
 assert.match(source,/extraGpuTextures:0,extraWorldTriangles:0/);
 assert.match(source,/experienceGate:'NOT PROVEN'/);
 assert.match(source,/function rebuildGroundAtlas\(\)/);
 assert.match(source,/FARM_MARKET_STREET_ORIGIN/);
});
