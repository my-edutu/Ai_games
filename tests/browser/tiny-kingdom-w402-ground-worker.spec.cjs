'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const original=html.slice(html.indexOf('function fillOriginalGroundAtlasBasePixels('),
 html.indexOf('// W402: prepare exact original fixed-coordinate valley pigment'));
test('W402 original RGBA source is finite, pure and independent of the saved-world economy',()=>{
 assert.ok(original.startsWith('function fillOriginalGroundAtlasBasePixels('));
 const sandbox={Math,Uint8ClampedArray,Float64Array,Int32Array,Number,Error};
 vm.createContext(sandbox);vm.runInContext(original,sandbox,{timeout:2000});
 const size=64,arr=new Uint8ClampedArray(size*size*4);
 assert.equal(sandbox.fillOriginalGroundAtlasBasePixels(arr,size,184),arr);
 assert.equal(arr.length,16384);
 for(let i=3;i<arr.length;i+=4)assert.equal(arr[i],255);
 for(const forbidden of ['state.','people.','city.','Math.random','postMessage'])
  assert.equal(original.includes(forbidden),false,forbidden);
});
test('W402 async transfer, cleanup, bounded original synchronous fallback and evidence hook',()=>{
 const source=html.slice(html.indexOf('const GROUND_BASE_PREFLIGHT_MAX_MS='),
  html.indexOf('// W356: wear, verge and wheel ruts'));
 assert.match(source,/new Worker\(groundBaseWorkerUrl\)/);
 assert.match(source,/postMessage\(\{buffer:bytes\.buffer\},\[bytes\.buffer\]\)/);
 assert.match(source,/groundBaseWorkerPixels=new Uint8ClampedArray\(buffer\)/);
 assert.match(source,/groundBaseWorkerState='ready'/);
 assert.match(source,/cleanupGroundBaseWorker\(\)/);
 assert.match(html,/if\(framesDrawn===0&&groundBaseWorkerState==='building'\)/);
 assert.match(html,/groundBaseWorkerState='timeout'/);
 assert.match(html,/groundBaseWorkerSyncFallbacks\+\+;\s*fillOriginalGroundAtlasBasePixels/);
 assert.match(html,/window\.__tinyKingdom=\{getGroundBaseWorkerAudit,/);
});
test('W402 only active authentic documentaries hide duplicate floating world overlays',()=>{
 assert.match(html,/body\[data-command="world"\] #world-ribbon\{display:flex\}/);
 assert.match(html,/body\[data-command="world"\]\[data-village-documentary="on"\] #world-ribbon/);
 assert.match(html,/body\[data-command="world"\]\[data-village-documentary="on"\] #world-actor-tag\{display:none!important\}/);
});
