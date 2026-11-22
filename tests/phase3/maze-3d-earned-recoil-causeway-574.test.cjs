'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const base=path.resolve(__dirname,'../../public/ai-maze-escape');
const moduleURL=file=>pathToFileURL(path.resolve(base,file)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
 .replace("'./vendor/three.module.js'",JSON.stringify(pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href))
 .replace("'./gate-moment.mjs'",JSON.stringify(moduleURL('gate-moment.mjs')))
 .replace("'./map-view.mjs'",JSON.stringify(moduleURL('map-view.mjs')))).toString('base64'));
function snapshot(){
 const ids=[6,7,8,9];
 return {runToken:'earned-public-aisle',lifecycle:'running',result:null,
   width:5,height:5,currentCell:6,visibleCells:[...ids],
   cells:ids.map((cell,i)=>({cell,blocked:false,
     neighbors:[...(i?[ids[i-1]]:[]),...(i<ids.length-1?[ids[i+1]]:[])]})),
   keys:[],doors:[],inventory:[],exitCell:24,
   threats:[{id:'thornback',cell:9,lanternParried:true}]};
}
test('earned long Tideglass court exists only for a presently published 3-4-edge reciprocal open flat recoil',async()=>{
 const {publicGuardianEarnedRecoilCausewayCells:earned}=await load();
 const s=snapshot(),truth=JSON.stringify(s);
 assert.deepEqual([...earned(s)],[[6,'x'],[7,'x'],[8,'x'],[9,'x']]);
 assert.equal(JSON.stringify(s),truth);
 assert.deepEqual([...earned({...s,threats:[{id:'thornback',cell:9,lanternParried:false}]})],[]);
 assert.deepEqual([...earned({...s,visibleCells:[6,7,9]})],[]);
 assert.deepEqual([...earned({...s,doors:[{a:7,b:8,open:false}]})],[]);
 assert.deepEqual([...earned({...s,doors:[{a:7,b:8,open:true}]})],[],
   'a real door remains a door rather than an authored open-corridor mineral course');
 assert.deepEqual([...earned({...s,cells:s.cells.map(c=>c.cell===8?{...c,neighbors:[9]}:c)})],[]);
 assert.deepEqual([...earned({...s,cells:s.cells.map(c=>c.cell===8?{...c,trap:true}:c)})],[]);
 assert.deepEqual([...earned({...s,keys:[{id:'key',cell:7}]})],[]);
 assert.deepEqual([...earned({...s,exitCell:8})],[]);
 assert.deepEqual([...earned({...s,result:{reason:'escape'}})],[]);
 assert.deepEqual([...earned({...s,lifecycle:'ended'})],[]);
 assert.deepEqual([...earned({...s,threats:[{id:'thornback',cell:14,lanternParried:true}]})],[]);
 assert.deepEqual([...earned({...s,privateMaze:{cells:[{cell:8,neighbors:[]}]},
   secretPath:[6,7,8,9]})],[[6,'x'],[7,'x'],[8,'x'],[9,'x']]);
});
test('real installed-Three world joins the post-counter court without inventing cells or GPU resources',async()=>{
 const {publicGuardianEarnedRecoilCausewayCells:earned,createMazeWorld}=await load();
 const s=snapshot(),truth=JSON.stringify(s),world=createMazeWorld({balanced:true});
 const baseline=world.stats();
 world.update(s);
 const now=world.stats();
 assert.equal(now.guardianCausewayTiles,4,'all four connected public recoil tiles form one actual physical Tideglass court');
 assert.equal(now.guardianCourtTiles,4,'the four current publicly verified cells are all physically authored');
 assert.equal(now.guardianTideSignalTiles,4,'a real grounded consequence follows the whole public aisle');
 assert.equal(now.renderedCells.length,4);
 assert.equal(now.geometryCount,baseline.geometryCount);
 assert.equal(now.materialCount,baseline.materialCount);
 assert.equal(JSON.stringify(s),truth);
 world.update({...s,visibleCells:[6,7,9]});
 assert.equal(world.stats().guardianCausewayTiles,0);
 for(let i=0;i<6;i++){
   world.update({...s,runToken:'recoil-resets-'+i});
   assert.equal(world.stats().guardianCausewayTiles,4);
   assert.ok(world.stats().geometryCount<100,'unchanged strict six-reset geometry budget');
 }
 assert.equal(earned(s).size,4);
 world.dispose();
 assert.equal(world.stats().geometryCount,0);
 assert.equal(world.stats().materialCount,0);
});
