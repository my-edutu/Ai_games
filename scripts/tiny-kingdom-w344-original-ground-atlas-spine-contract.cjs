'use strict';
// W344: exact-byte, original-world atlas CPU-spine contract. These are not
// experience/physical-GPU acceptance criteria.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('function fillOriginalGroundAtlasBasePixels(');
const stop=html.indexOf('function rebuildGroundAtlas()',start);
assert(start>=0&&stop>start,'W344 missing retained original atlas pixel workstream');
const body=html.slice(start,stop);
const fill=new Function(body+';return fillOriginalGroundAtlasBasePixels;')();
function fnv(bytes){let h=2166136261;for(const b of bytes)h=Math.imul(h^b,16777619)>>>0;return h.toString(16).padStart(8,'0');}
for(const [size,expected] of [[16,'75c8a011'],[128,'a955b62e'],[512,'a22c257f']]){
 const pixels=new Uint8ClampedArray(size*size*4);
 assert.strictEqual(fill(pixels,size,184),pixels,'in-place exact colour buffers only');
 assert.equal(fnv(pixels),expected,'original 3D valley albedo must be byte-identical, size '+size);
}
const atlas=html.slice(html.indexOf('function rebuildGroundAtlas()'),
 html.indexOf('/* G105: spatially packed',html.indexOf('function rebuildGroundAtlas()')));
assert(atlas.includes('fillOriginalGroundAtlasBasePixels(arr,size,GROUND_ATLAS_EXTENT)'),
 'real 512 atlas uses the bounded, exact-byte colour builder');
assert(!atlas.includes('for(let z=0;z<size;z++)for(let x=0;x<size;x++)'),
 'do not silently retain duplicate per-pixel work in the hot build');
assert(html.includes('groundAtlasMs')&&html.includes('groundAtlasLastBuildProfile'),
 'profile authentic atlas time separately from landscape/home/civic/render');
assert(atlas.includes('groundAtlasGpuSkippedUploads'),
 'original occupied housing dirty-region and no-op texture safety must remain');
assert(html.includes('if(!foregroundIndices.has(i))villager(people[i]);'),
 'all genuine people must still have a live rendering fallback');
console.log('W344 PASS: original atlas pixels 16/128/512 exact bytes, scene/ground CPU profile, all real citizens and storage preserved; hardware FPS NOT PROVEN');
