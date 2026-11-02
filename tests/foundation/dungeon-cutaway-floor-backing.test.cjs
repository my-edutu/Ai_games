'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planFile=path.join(root,'public/ai-dungeon/cutaway-floor-plan.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(planFile,'utf8')).toString('base64'))}
test('wall cutaway reveals continuous real masonry floor instead of a black empty grid tile',async()=>{
 const {planCutawayFloorBacking}=await load();
 const map=['#####','#...#','#.#.#','#...#','#####'];
 const result=planCutawayFloorBacking(map,1);
 assert.deepEqual(result,[{x:0,z:0,yaw:result[0].yaw}]);
 assert.ok([0,Math.PI/2,Math.PI,Math.PI*1.5].includes(result[0].yaw));
 assert.deepEqual(result,planCutawayFloorBacking(map,1),'cosmetic placement must replay exactly');
 assert.ok(Object.isFrozen(result)&&Object.isFrozen(result[0]));
 assert.equal(planCutawayFloorBacking(['###','#.#','###'],1).length,0,'border masonry never adds offscreen infill');
 const dense=['#######','#.#.#.#','##..###','#...#.#','###.###','#...#.#','#######'];
 const closed=dense.slice(1,-1).reduce((sum,row)=>sum+[...row.slice(1,-1)].filter(c=>c==='#').length,0);
 assert.equal(planCutawayFloorBacking(dense,2).length,closed,'every interior opaque tile is covered without doubling an open tile');
 assert.notDeepEqual(planCutawayFloorBacking(dense,1),planCutawayFloorBacking(dense,2),'floor identity may rotate the textured surface');
});
test('cutaway planner validates malformed maps and never changes gameplay truth',async()=>{
 const {planCutawayFloorBacking}=await load();
 for(const value of [null,undefined,[],[[]],['#'],['##','##'],['###','##','###'],['###','#x#','###'],Array(67).fill('#'.repeat(67))])
  assert.deepEqual(planCutawayFloorBacking(value,1),[]);
 assert.deepEqual(planCutawayFloorBacking(['###','#.#','###'],NaN),[]);
 assert.deepEqual(planCutawayFloorBacking(['###','#.#','###'],0),[]);
 const map=['#####','#.#.#','#####','#...#','#####'],before=JSON.stringify(map);
 planCutawayFloorBacking(map,3);assert.equal(JSON.stringify(map),before);
 const source=fs.readFileSync(planFile,'utf8');
 assert.doesNotMatch(source,/Math\.random|Date\.|performance\.|fetch\(|requestAnimationFrame|DungeonRuntime/);
});
test('camera cutaway shrinks a blocking wall to rubble while keeping normal wall and near-wall identity',async()=>{
 const {planCutawayWallTransform}=await load();
 assert.deepEqual(planCutawayWallTransform('sightline',2.6),{height:.16,footprint:.36});
 assert.deepEqual(planCutawayWallTransform('nearby',2.6),{height:.42,footprint:1.015});
 assert.deepEqual(planCutawayWallTransform('none',2.6),{height:2.6,footprint:1.015});
 assert.deepEqual(planCutawayWallTransform('none',NaN),{height:2.6,footprint:1.015});
});
test('real Three.js world uses the under-wall textured batch and compact sightline rubble, not a mockup',()=>{
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(env,/import \{planCutawayFloorBacking(?:,planCutawayCapTransform)?\} from '\/dungeon\/cutaway-floor-plan\.js'/);
 assert.match(env,/planCutawayFloorBacking\(map,floor\)/);
 assert.match(env,/cutawayFloorBackings:/);
 assert.match(app,/import \{planCutawayWallTransform(?:,planCutawayFoundationTransform,planCutawayParapetTransform)?\} from '\/dungeon\/cutaway-floor-plan\.js'/);
 assert.match(app,/planCutawayWallTransform\(reveal,/);
 assert.match(app,/cachedScale\.set\(cutaway\.footprint,cutaway\.height,cutaway\.footprint\)/);
 assert.ok(host.includes("['/dungeon/cutaway-floor-plan.js','cutaway-floor-plan.js']"));
});


test('wall capstones follow the same sightline and near-party clearance as their parent stone facades',async()=>{
 const {planCutawayCapTransform}=await load();
 const cap=Object.freeze([2.511,2.42,-3.511,.72,.115,.09]);
 assert.deepEqual(planCutawayCapTransform('none',cap),[2.511,2.42,-3.511,.72,.115,.09]);
 assert.deepEqual(planCutawayCapTransform('sightline',cap),[2.511,.015,-3.511,.001,.001,.001]);
 assert.deepEqual(planCutawayCapTransform('nearby',cap),[2.511,.015,-3.511,.001,.001,.001]);
 assert.deepEqual(cap,[2.511,2.42,-3.511,.72,.115,.09],'camera operations never mutate wall source');
 for(const invalid of [null,[],[0,1,2],[0,0,0,0,1,1],[Infinity,1,1,1,1,1],[0,-1,0,1,1,1],[65,1,0,1,1,1]])
  assert.equal(planCutawayCapTransform('none',invalid),null,'malformed or unbounded capstones must be rejected');
 assert.equal(planCutawayCapTransform('unrecognized',cap),null,'unknown visibility is not silently treated as a normal wall');
 const source=fs.readFileSync(planFile,'utf8');
 assert.doesNotMatch(source,/Math\.random|Date\.|performance\.|fetch\(|requestAnimationFrame|DungeonRuntime/);
});

test('real Three.js capstone batch maps every cap to its parent exposed face and avoids repeated GPU uploads',()=>{
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(env,/columnCapParents\.push\(wallFaces\.length-1\)/);
 assert.match(env,/const columnCapMesh=batched\(/);
 assert.match(env,/shouldUploadCutawayBand\(capBands,/);
 assert.match(env,/planCutawayCapTransform\(/);
 assert.match(env,/columnCapMesh\.setMatrixAt\(/);
 assert.match(env,/if\(capMatrixWrites\)columnCapMesh\.instanceMatrix\.needsUpdate=true/);
 assert.match(env,/clearedCapstones:/);
 assert.match(env,/columnCapstones:/);
 assert.match(env,/sceneMetrics\.matrixWrites\.capstone=capMatrixWrites/);
});


test('camera-cleared stone foundation and parapet profiles stop drawing opaque square floor roofs',async()=>{
 const {planCutawayFoundationTransform,planCutawayParapetTransform}=await load();
 assert.deepEqual(planCutawayFoundationTransform('none'),{y:.1,height:.21,footprint:1.035});
 for(const reveal of ['sightline','nearby'])
  assert.deepEqual(planCutawayFoundationTransform(reveal),{y:.035,height:.055,footprint:.24});
 assert.deepEqual(planCutawayParapetTransform(false,2.53),{y:2.53,height:.12,footprint:1.04});
 assert.deepEqual(planCutawayParapetTransform(true,2.53),{y:.045,height:.035,footprint:.30});
 assert.equal(planCutawayFoundationTransform('wrong'),null);
 assert.equal(planCutawayParapetTransform('yes',2.53),null);
 assert.equal(planCutawayParapetTransform(false,Infinity),null);
 assert.equal(planCutawayParapetTransform(false,-1),null);
 assert.equal(planCutawayParapetTransform(false,11),null);
});

test('actual instanced foundation uses its parent wall-band cache and compact parapets, not extra simulation rules',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/foundationBrickWallIndices/);
 assert.match(app,/wallBands\[footWallIndex\]/);
 assert.match(app,/shouldUploadCutawayBand\(foundationBands,/);
 assert.match(app,/foundationMesh\.setMatrixAt\(/);
 assert.match(app,/foundationMatrixWrites/);
 assert.match(app,/clearedFoundationBricks/);
 assert.match(app,/planCutawayFoundationTransform\(/);
 assert.match(app,/planCutawayParapetTransform\(/);
 assert.match(app,/cachedScale\.set\(parapet\.footprint,parapet\.height,parapet\.footprint\)/);
});
