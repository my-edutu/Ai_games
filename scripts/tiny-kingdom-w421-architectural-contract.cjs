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
const x=s.indexOf('function rebuildArchitectureAtlas(){'),y=s.indexOf('rebuildArchitectureAtlas();',x);
assert.ok(x>0&&y>x);const atlas=s.slice(x,y);
assert.match(atlas,/gl.generateMipmap\(gl.TEXTURE_2D\)/);
assert.doesNotMatch(atlas,/Math.random|people.push|state\.food\s*=/);
console.log('W421 original one-atlas stone/oak/clay/lime and four genuine shop windows PASS');
