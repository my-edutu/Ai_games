'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {parseMazeConfig}=require('../../dist/games/ai-maze-escape/src/config/schema.js');
const {populateMazeContent}=require('../../dist/games/ai-maze-escape/src/generation/content.js');
const {solveMaze,passageNeighbors}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
const {MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');

function realReciprocalFixture(){
  const width=9,height=9,passages=new Array(width*height).fill(0);
  const connect=(a,b)=>{
    if(b===a+1&&Math.floor(a/width)===Math.floor(b/width)){
      passages[a]|=2;passages[b]|=8;
    }else if(b===a-width){
      passages[a]|=1;passages[b]|=4;
    }else if(b===a+width){
      passages[a]|=4;passages[b]|=1;
    }else throw Error('fixture connection is not cardinal');
  };
  for(let cell=36;cell<44;cell++)connect(cell,cell+1);
  connect(39,30); // first optional pressure alcove on the main journey
  connect(40,31);connect(31,22); // actual two-step moving guardian patrol
  connect(41,32); // separate pressure alcove beside the guardian approach
  return {schemaVersion:1,width,height,passages,start:36,exit:44,
    doors:[],keys:[],traps:[],clues:[],checkpoints:[],threats:[],
    blockedCells:[],profile:'tree'};
}

test('second genuine pressure mechanism joins an existing guardian stretch without inventing a passage',()=>{
  const input=realReciprocalFixture(),before=JSON.stringify(input);
  const config=parseMazeConfig({width:9,height:9,profile:'tree',
    visibilityRadius:1,keyCount:0,trapCount:2,threatCount:1});
  let staged=0;
  for(let index=0;index<24;index++){
    const seed='guardian-pressure-court-'+index;
    const world=populateMazeContent(input,config,NamedRng.fromSeed(seed));
    const repeat=populateMazeContent(input,config,NamedRng.fromSeed(seed));
    assert.deepEqual(world,repeat,'stage stays deterministic and seed replayable');
    assert.deepEqual(solveMaze(world,{start:36,goal:44}),
      [36,37,38,39,40,41,42,43,44],'the mandatory exit route is unchanged');
    assert.equal(world.traps.includes(30),true,'first optional pressure beat is retained');
    assert.ok(world.traps.every(cell=>!Array.from({length:9},(_,i)=>36+i).includes(cell)),
      'neither pressure machine may become mandatory');
    if(!world.threats.length)continue; // one unlucky random hazard occupied the patrol
    staged++;
    const guardian=world.threats[0];
    assert.deepEqual(guardian.route,[31,22],
      'original moving guardian stays on a real two-edge side corridor');
    assert.ok(world.traps.includes(32),
      'a separate real pressure alcove joins the guardian stretch');
    assert.ok(!world.traps.some(cell=>guardian.route.includes(cell)),
      'pressure cannot overwrite either guardian patrol position');
    assert.ok(passageNeighbors(world,41).includes(32)
      &&passageNeighbors(world,32).includes(41),
      'new hazard is a genuine reciprocal public-discoverable side passage');
  }
  assert.ok(staged>=16,'most supported fixed seeds should stage the coherent sequence');
  assert.equal(JSON.stringify(input),before,
    'planning cannot rewrite original topology or mutate its input');
});

test('without a spare trap there is no invented companion or forced guardian route',()=>{
  const source=realReciprocalFixture();
  const config=parseMazeConfig({width:9,height:9,visibilityRadius:1,
    keyCount:0,trapCount:1,threatCount:1});
  for(const seed of ['one','two','three']){
    const world=populateMazeContent(source,config,NamedRng.fromSeed(seed));
    assert.deepEqual(world.traps,[30],
      'one-trap profile keeps only its existing early optional pressure beat');
    assert.deepEqual(solveMaze(world,{start:36,goal:44}),
      [36,37,38,39,40,41,42,43,44]);
  }
});

test('complete seed generation remains valid and deterministic with paired pressure and moving guardian',()=>{
  const config={width:17,height:11,profile:'chambers',level:4,
    visibilityRadius:3,loopChancePermille:170,keyCount:2,
    trapCount:5,threatCount:1};
  const {validateMazeContent}=require('../../dist/games/ai-maze-escape/src/generation/content.js');
  for(const seed of ['maze-visual-reference-13','maze-visual-reference-3',
    'guardian-partner-seed-0','guardian-partner-seed-1']){
    const a=MazeRuntime.create(config,seed),b=MazeRuntime.create(config,seed);
    assert.deepEqual(a.state.world,b.state.world,'real worlds replay by seed');
    assert.equal(validateMazeContent(a.state.world).valid,true,
      'real key, gate, trap, patrol and exit remain valid');
    const route=solveMaze(a.state.world,{start:a.state.world.start,goal:a.state.world.exit});
    const main=new Set(route);
    assert.ok(a.state.world.traps.every(cell=>!main.has(cell)),
      'required key-and-gate route remains navigable without touching a trap');
  }
});
