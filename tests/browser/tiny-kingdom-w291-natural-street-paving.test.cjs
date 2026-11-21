const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function extract(name){
 const start=source.indexOf('function '+name+'(');
 assert(start>=0,'missing '+name);
 const open=source.indexOf('{',start);let depth=0,finish=-1;
 for(let i=open;i<source.length;i++){
  if(source[i]==='{')depth++;
  if(source[i]==='}'&&!--depth){finish=i+1;break;}
 }
 assert(finish>open,'unterminated '+name);
 return source.slice(start,finish);
}
const biomeHash=n=>{const v=Math.sin(n*127.137+78.233)*43758.5453;return v-Math.floor(v)};
function runCourt(){
 let count=0;const points=[];
 const env={MARKET_SQUARE:{cx:-1,cz:4.9,rx:7.55,rz:7.05},data:[],
  marketQuarterStats:{pavingStones:0,mortarTriangles:0,raisedStoneDetails:0},
  MATERIAL:{ROAD:3},materialScope:(_,fn)=>fn(),
  rgb:n=>[n/16777216,n/16777216,n/16777216],
  terrain:()=>0,biomeHash,
  tri:()=>{count++;for(let i=0;i<30;i++)env.data.push(0)},
  quad:(...p)=>{count+=2;points.push(p.slice(0,4));for(let i=0;i<60;i++)env.data.push(0)}
 };
 vm.runInNewContext(extract('marketCobblestoneSquare')+';marketCobblestoneSquare();',env);
 return {audit:JSON.parse(JSON.stringify(env.marketQuarterStats)),
  points:JSON.parse(JSON.stringify(points)),triangles:count};
}
test('authentic market court keeps bounded non-grid separated stones and open wheelway',()=>{
 const r=runCourt(),a=r.audit;
 assert.equal(a.surfaceModel,'w208-natural-clay-market-and-freight-wagonway');
 assert.equal(a.stoneDistribution,'w291-low-discrepancy-separated-court');
 assert(a.pavingStones>=90&&a.pavingStones<=165);
 assert(a.marketWheelPassages===22&&a.marketDrainSegments===22);
 assert(a.stoneMinimumSpacing>=.58);
 assert(a.stoneCandidatesConsidered>a.pavingStones);
 assert(a.surfaceTriangles<=1000);
 assert.equal(r.triangles,a.surfaceTriangles);
});
test('market stone geometry is deterministic without game RNG',()=>{
 assert.deepEqual(runCourt(),runCourt());
});
function runHomeStreet(){
 const spans=[];let triangles=0;
 const env={MATERIAL:{ROAD:3},
  highStreetStats:{connectedLanes:0,pavingStones:0,laneStoneWeathered:0,wheelwaySegments:0},
  materialScope:(_,fn)=>fn(),terrain:(x,z)=>.09*Math.sin(x*.17)+.06*Math.cos(z*.12),
  rgb:n=>n,biomeHash,quad:(...args)=>{triangles+=2;spans.push(args.slice(0,4))}};
 vm.runInNewContext(extract('highStreetLane')+';highStreetLane([[-4,-13],[-4,-4],[-4,3],[0,9]]);',env);
 return {stats:JSON.parse(JSON.stringify(env.highStreetStats)),
  spans:JSON.parse(JSON.stringify(spans)),triangles};
}
test('original home street keeps complete clay corridor and physically irregular stone shoulders',()=>{
 const r=runHomeStreet(),a=r.stats;
 assert.equal(a.connectedLanes,1);
 assert(a.pavingStones>0);
 assert.equal(a.pavingStones,2*a.wheelwaySegments);
 assert.equal(a.laneStoneWeathered,a.pavingStones);
 assert.equal(r.triangles,2*(a.pavingStones+a.wheelwaySegments));
 const stones=r.spans.filter((_,index)=>index%3!==0);
 assert.equal(stones.length,a.pavingStones);
 assert(stones.some(([v0,v1,v2,v3])=>Math.abs(
  Math.hypot(v0[0]-v3[0],v0[2]-v3[2])-
  Math.hypot(v1[0]-v2[0],v1[2]-v2[2]))>.02));
 assert.deepEqual(runHomeStreet(),r);
});
