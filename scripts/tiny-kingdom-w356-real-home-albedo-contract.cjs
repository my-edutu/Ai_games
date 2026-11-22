'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function paintRealResidentStreetAlbedo('),
 end=html.indexOf('function rebuildGroundAtlas(){',start);
assert(start>0&&end>start,'W356 original road atlas material painter');
const paint=vm.runInNewContext('const REAL_HOME_LANE_BUDGET=3600;\n'+html.slice(start,end)+'\npaintRealResidentStreetAlbedo;');
let strokes=[],pathMoves=[];
const ctx={beginPath(){pathMoves=[]},moveTo(x,z){pathMoves.push(['M',x,z])},
 lineTo(x,z){pathMoves.push(['L',x,z])},
 stroke(){strokes.push({path:pathMoves.slice(),width:this.lineWidth})}};
const routes=[{a:[0,0],b:[1,0],halfWidth:.99,homeIndex:12},
 {a:[1,0],b:[2,0],halfWidth:.42,homeIndex:18}],unchanged=JSON.stringify(routes);
const audit=paint(ctx,n=>n*3,512,184,routes);
assert.equal(audit.paintedSections,2);
assert.equal(audit.wideSections,1);assert.equal(audit.narrowSections,1);
assert.equal(audit.materialPasses,7);assert.equal(strokes.length,7);
assert.equal(audit.extraTriangles,0);assert.equal(audit.extraGpuTextures,0);
assert.equal(JSON.stringify(routes),unchanged);
assert.throws(()=>paint(ctx,n=>n,512,184,[{a:[0,0],b:[1,0],halfWidth:2}]),/invalid actual/);
assert.throws(()=>paint(ctx,n=>n,512,184,Array.from({length:601},()=>routes[0])),/unbounded/);
const before=html.indexOf('refreshIndependentHousing(nextTerrainKey,staticKey);'),
 composed=html.indexOf('groundAtlasHomeRoadKey!==civicActiveKey'),
 dynamic=html.indexOf('const frameDynamicStart=performance.now();');
assert(before>0&&composed>before&&dynamic>composed,'3D civic source before same atlas upload');
assert(html.includes('realHomeLaneSections.push({a:edge[0],b:edge[1]'));
assert(html.includes('realHomeRoads:realHomeLaneSections.map('));
assert(html.includes('getRealHomeLaneAlbedoAudit,getGroundSurfaceStats:'));
console.log('W356 PASS: exact authentic section->atlas + construction order contracts; moving game NOT PROVEN');
