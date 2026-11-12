'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function plan(){const src=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/wall-profile-plan.js'),'utf8');return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));}
const map=['#############','#...........#','#.##..##.##.#','#.##..##.##.#','#...........#','#.#.##..##..#','#.#.##..##..#','#...........#','#.###.##.##.#','#.###.##.##.#','#...........#','#...........#','#############'];
test('original GLB masonry is attached to one-faced blocked wall and clear of living actors',async()=>{
 const {planWallSeatedAuthoredMasonry:f}=await plan(),sites=f(map,[],5);
 assert.ok(sites.length);assert.deepEqual(f(map,[],5),sites);
 for(const p of sites){assert.equal(map[p.wallZ][p.wallX],'#');assert.equal(map[p.approachZ][p.approachX],'.');assert.equal([[-1,0],[1,0],[0,-1],[0,1]].filter(([dx,dz])=>map[p.wallZ+dz]?.[p.wallX+dx]==='.').length,1);}
 assert.equal(f(map,[{x:sites[0].approachX,z:sites[0].approachZ,hp:10}],5).some(p=>p.wallX===sites[0].wallX&&p.wallZ===sites[0].wallZ),false);
 assert.ok(sites.every((p,i)=>sites.slice(i+1).every(q=>Math.hypot(p.x-q.x,p.z-q.z)>=3)));
 assert.deepEqual(f(['bad'],[],5),[]);
});
test('original GLB height, width, depth fit without distortion or malformed extents',async()=>{
 const {planWallSeatedAssetScale:f}=await plan();
 for(const e of [{x:1.2,y:5,z:1.4},{x:.2,y:2,z:.8},{x:2.4,y:.8,z:.1}]){
 const s=f(e);assert.ok(s>0&&s<=3&&s*e.x<=.72+1e-8&&s*e.y<=1.38+1e-8&&s*e.z<=.72+1e-8);}
 assert.equal(f({x:0,y:2,z:1}),0);assert.equal(f(null),0);
});
