'use strict';
// W421 original, deterministic market-architecture and 4-material atlas contract
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const s=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=s.match(/<script[^>]*>([\s\S]*?)<\/script>/);assert.ok(script);new vm.Script(script[1]);
for(const n of ['w421HandQuarried','w421OakHeartwood','w421ClayRoof','w421Limewash','originalMarketCasementCount'])
 assert.ok(s.includes(n),'Original scene upgrade missing: '+n);
const a=s.indexOf('function grainwardTradehouseEnvelope('),b=s.indexOf('// W257:',a);
assert.ok(a>=0&&b>a);const facade=s.slice(a,b);
assert.match(facade,/originalMarketCasementCount\+=4/);
assert.match(facade,/for\(const hinge of \[-1,1\]\)/);
assert.match(facade,/box\(leafX,y\+2\.56,front/);
assert.match(facade,/no forged stock, agents or roads/);
assert.match(s,/originalMarketCasementCount:0/);
assert.match(s,/function marketStallStockPlan\(/);
assert.match(s,/function getDeliveryEconomyAudit\(/);
// W501: mipmap creation lives in the REAL upload owner, not the async
// worker coordinator. Assert that the original WebGL1 upload retains its
// texture, minification and complete mipmap semantics.
const x=s.indexOf('function uploadOriginalArchitecturePixels('),
 y=s.indexOf('function fallbackOriginalArchitectureAtlas(',x);
assert.ok(x>0&&y>x);const atlas=s.slice(x,y);
assert.match(atlas,/gl\.texImage2D\(gl\.TEXTURE_2D/);
assert.match(atlas,/gl\.texParameteri\(gl\.TEXTURE_2D,gl\.TEXTURE_MIN_FILTER,gl\.LINEAR_MIPMAP_LINEAR\)/);
assert.match(atlas,/gl\.generateMipmap\(gl\.TEXTURE_2D\)/);
assert.doesNotMatch(atlas,/Math.random|people.push|state\.food\s*=/);
const buildStart=s.indexOf('function rebuildArchitectureAtlas(){'),
 buildEnd=s.indexOf('function getArchitectureAtlasWorkerAudit()',buildStart);
assert.ok(buildStart>0&&buildEnd>buildStart);
assert.match(s.slice(buildStart,buildEnd),/uploadOriginalArchitecturePixels\(result\.bytes,result\.samples\)/);
console.log('W421 original one-atlas stone/oak/clay/lime and four genuine shop windows PASS');
