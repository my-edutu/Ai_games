'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=src.indexOf('function marketReceivingCourt(){'),b=src.indexOf('// W87:',a);
assert(a>=0&&b>a,'original receiving-court production source exists');
const code=src.slice(a,b);
assert(!code.includes('for(let row=0;row<6;row++)for(let col=0;col<7;col++)'),
 'reject checkerboard six-by-seven physical tile rows');
assert.match(code,/receivingCourtPattern='w292-separated-flagstones-on-continuous-clay'/);
assert(!/state\.(food|wood|gold|t)\s*[+\-*/]?=/.test(code),'no authoritative state writes');
const quads=[],mesh=[],stats={entryPathStones:0};
const ctx={data:mesh,marketQuarterStats:stats,MATERIAL:{ROAD:1},rgb:n=>n,
 terrain:(x,z)=>.3+.06*Math.sin(x*.4)+.04*Math.sin(z*.5),
 biomeHash:n=>{const v=Math.sin(n*127.137+78.233)*43758.5453;return v-Math.floor(v);},
 grainwardTransferNode:()=>({source:'real-market'}),materialScope:(_m,fn)=>fn(),
 quad:(...args)=>{const pts=args.slice(0,4);
  for(const p of pts)assert(Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),'finite original world geometry');
  quads.push(pts);for(let i=0;i<60;i++)mesh.push(0);}
};
vm.createContext(ctx);new vm.Script(code+'\nmarketReceivingCourt();').runInContext(ctx);
assert.equal(stats.receivingSoilPanels,24,'complete earth mesh, not a huge broken triangle fan');
assert.equal(stats.entryPathStones,42,'same 42 original market receiving stones');
assert.equal(stats.receivingDrainSegments,14,'same fourteen original market drains');
assert.equal(stats.receivingCourtTriangles,160,'bounded original civic geometry');
assert(stats.receivingStoneCandidates<=420&&stats.receivingStoneMinimumSeparation>=.35-1e-9);
const stoneQuads=quads.slice(24,66);
const centers=stoneQuads.map(q=>[q.reduce((s,p)=>s+p[0],0)/4,q.reduce((s,p)=>s+p[2],0)/4]);
assert(new Set(centers.map(p=>p[1].toFixed(2))).size>24,'no six-row aligned checkerboard');
for(let i=0;i<centers.length;i++){
 assert(centers[i][0]>=-3.65&&centers[i][0]<=1.14,'real courtyard width');
 assert(centers[i][1]>=11.15&&centers[i][1]<=13.74,'real courtyard depth');
 for(let j=0;j<i;j++)assert(Math.hypot(centers[i][0]-centers[j][0],centers[i][1]-centers[j][1])>.34,'nonoverlapping physical stone centers');
}
console.log('W292 PASS: original 42 irregular receiving stones, 14 real drains, terrain following, no economic writes');