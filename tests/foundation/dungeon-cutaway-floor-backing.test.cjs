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
 assert.deepEqual(planCutawayWallTransform('nearby',2.6),{height:.88,footprint:1.015});
 assert.deepEqual(planCutawayWallTransform('none',2.6),{height:2.6,footprint:1.015});
 assert.deepEqual(planCutawayWallTransform('none',NaN),{height:2.6,footprint:1.015});
});
test('real Three.js world uses the under-wall textured batch and compact sightline rubble, not a mockup',()=>{
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(env,/import \{planCutawayFloorBacking\} from '\/dungeon\/cutaway-floor-plan\.js'/);
 assert.match(env,/planCutawayFloorBacking\(map,floor\)/);
 assert.match(env,/cutawayFloorBackings:/);
 assert.match(app,/import \{planCutawayWallTransform\} from '\/dungeon\/cutaway-floor-plan\.js'/);
 assert.match(app,/planCutawayWallTransform\(reveal,/);
 assert.match(app,/cachedScale\.set\(cutaway\.footprint,cutaway\.height,cutaway\.footprint\)/);
 assert.ok(host.includes("['/dungeon/cutaway-floor-plan.js','cutaway-floor-plan.js']"));
});
