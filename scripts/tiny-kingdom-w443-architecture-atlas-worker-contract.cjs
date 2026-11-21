// Contract W443 — identical-original-medieval-materials worker spine.
// Run via node --test. Green source parsing and golden 2,097,152 byte image
// cannot stand in for measured hardware GPU or genuine moving-game footage.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
test('original atlas is produced from a pure worker-transferable pipeline',()=>{
 const start=source.indexOf('const ARCH_ATLAS_WIDTH=');
 const end=source.indexOf('const ARCH_ATLAS_PREFLIGHT_MAX_MS',start);
 assert(start>=0&&end>start);
 const context=vm.createContext({Uint8ClampedArray,Math,Array,Object});
 const pixels=vm.runInContext(source.slice(start,end)+
  '\n buildOriginalArchitectureAtlasPixels();',context,{timeout:15000});
 assert.equal(pixels.bytes.length,1024*512*4);
 let hash=2166136261>>>0;
 for(const v of pixels.bytes)hash=Math.imul(hash^v,16777619)>>>0;
 assert.equal(hash.toString(16),'fabba436',
  'Every original stone/oak/roof/road/foliage/lime pixel must survive bitwise');
 assert.deepEqual(Object.keys(pixels.samples).sort(),
  ['canopy','foliage','metal','plaster','road','roof','stone','timber']);
 assert.deepEqual([...pixels.samples.road],[196,175,140]);
 assert.deepEqual([...pixels.samples.roof],[208,171,144]);
});
test('first real WebGL frame waits for exact atlas or bounded fallback',()=>{
 const script=source.slice(source.indexOf('<script>')+8,source.lastIndexOf('</script>'));
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(script,/framesDrawn===0&&architectureAtlasWorkerState==='building'/);
 assert.match(script,/fallbackOriginalArchitectureAtlas\('preflight-timeout'\)/);
 assert.match(script,/new Worker\(architectureAtlasWorkerUrl\)/);
 assert.match(script,/postMessage\(result,\[result.bytes.buffer\]\)/);
 assert.match(script,/getArchitectureAtlasWorkerAudit/);
 assert.match(script,/if\(!gpuAvailable\)return;/);
});
