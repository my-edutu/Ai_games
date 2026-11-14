'use strict';
const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source
 .replace("'./vendor/three.module.js'",JSON.stringify(three))
 .replace("'./gate-moment.mjs'",JSON.stringify(gate))
 .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const snapshot=(cells,runToken='edge-test')=>({runToken,width:7,height:9,lifecycle:'running',
 result:null,currentCell:cells[0]?.cell??0,cells,visibleCells:cells.map(c=>c.cell),
 discoveredCells:cells.map(c=>c.cell),doors:[],keys:[],threats:[],exitCell:null});
test('published ocean boundary has substantial rooted load galleries, without geometry leaks',async()=>{
 const {createMazeWorld,cellPosition,cellHeight}=await modulePromise;
 const {Matrix4,Vector3,Quaternion}=await import(three);
 const world=createMazeWorld({balanced:true}),resources=world.stats();
 const corner={cell:0,neighbors:[]},inside={cell:24,neighbors:[]};
 const s=snapshot([corner,inside]),unchanged=JSON.stringify(s);
 world.update(s);
 assert.equal(world.stats().shorelineLoadFacades,2,'two exterior faces on published corner only');
 for(const k of ['geometryCount','materialCount','textureCount'])assert.equal(world.stats()[k],resources[k]);
 const {x,z}=cellPosition(0,7,9),height=1.72+cellHeight(0,7,9);
 const y=cellHeight(0,7,9)-.21-height/2;
 const m=new Matrix4(),p=new Vector3(),q=new Quaternion(),sz=new Vector3(),found=[];
 for(const batch of world.group.children[1].children) {
  if(!batch.isInstancedMesh)continue;
  for(let i=0;i<batch.count;i++){
   batch.getMatrixAt(i,m);m.decompose(p,q,sz);
   if(Math.abs(sz.x-.21)<1e-5&&Math.abs(sz.y-height)<1e-5&&
      Math.abs(sz.z-.21)<1e-5&&Math.abs(p.y-y)<1e-5)found.push([p.x,p.z]);
  }
 }
 for(const [px,pz] of [[x-1.22,z-.77],[x-1.22,z+.77],[x-.77,z-1.22],[x+.77,z-1.22]])
  assert.ok(found.some(([a,b])=>Math.abs(a-px)<1e-5&&Math.abs(b-pz)<1e-5),
   'full-height grounded stone piers must exist at actual board edges');
 assert.equal(JSON.stringify(s),unchanged,'public state was not modified');
 world.update(snapshot([inside]));
 assert.equal(world.stats().shorelineLoadFacades,0,'never expose a missing/secret neighbor');
 world.update(snapshot([corner],'next-run'));
 assert.equal(world.stats().shorelineLoadFacades,2);
 for(const k of ['geometryCount','materialCount','textureCount'])assert.equal(world.stats()[k],resources[k]);
 world.dispose();assert.equal(world.stats().shorelineLoadFacades,0);
 for(const k of ['geometryCount','materialCount','textureCount'])assert.equal(world.stats()[k],0);
});
