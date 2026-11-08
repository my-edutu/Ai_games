'use strict';
// W129 geometry-property test: genuine terrain-contact / sky-facing square.
// A static source count alone would not catch the old 7m ground wedges.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function marketCobblestoneSquare(){'),
 end=html.indexOf('function marketTimberCart(',start);
assert(start>=0&&end>start);
const src=html.slice(start,end);
const terrain=(x,z)=>.13*Math.sin(x*.32)*Math.cos(z*.24)+
 .015*Math.sin(z*.41+x*.17);
const faces=[],data=[],stats={pavingStones:0,mortarTriangles:0,entryPathStones:0};
const accept=(points)=>{
 if(stats.mortarTriangles<224){
  const polygons=points.length===3?[points]:
   [[points[0],points[1],points[2]],[points[0],points[2],points[3]]];
  for(const polygon of polygons)faces.push(polygon);
 }
 for(let i=0;i<(points.length-2)*30;i++)data.push(0);
};
const c={data,MARKET_SQUARE:{cx:-1,cz:4.9,rx:7.55,rz:7.05},
 terrain,biomeHash:n=>{const f=Math.sin(n*12.9898)*43758.5453;return f-Math.floor(f)},
 rgb:n=>n,marketQuarterStats:stats,materialScope:(_,fn)=>fn(),MATERIAL:{ROAD:3},
 tri:(a,b,d)=>accept([a,b,d]),quad:(a,b,d,e)=>accept([a,b,d,e])};
vm.createContext(c);vm.runInContext(src+'\nmarketCobblestoneSquare();',c);
assert.equal(stats.mortarTriangles,224);
assert.equal(faces.length,224);
let maxSink=0,invalid=0,downward=0;
for(const p of faces){
 const cx=(p[0][0]+p[1][0]+p[2][0])/3,
  cz=(p[0][2]+p[1][2]+p[2][2])/3,
  y=(p[0][1]+p[1][1]+p[2][1])/3;
 const below=terrain(cx,cz)-y;
 if(!Number.isFinite(y)||p.some(q=>q.some(n=>!Number.isFinite(n))))invalid++;
 maxSink=Math.max(maxSink,below);
 const [a,b,d]=p;
 const ny=(b[2]-a[2])*(d[0]-a[0])-(b[0]-a[0])*(d[2]-a[2]);
 if(ny<=1e-7)downward++;
}
assert.equal(invalid,0);
assert.equal(downward,0,'every plaza face must survive upward WebGL backface culling');
assert.ok(maxSink<=.02,'plaza ground embeds in nonlinear terrain by '+maxSink);
assert.ok(data.length/30<800,'terrain contact surface remains bounded');
console.log('W129 actual curved-terrain geometry PASS '+JSON.stringify({
 faces:faces.length,paving:stats.pavingStones,maxSink,upwardFaces:faces.length}));
