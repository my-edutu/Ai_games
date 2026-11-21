'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const{runMazeCampaign}=require('../../dist/games/ai-maze-escape/src/testing/campaign.js');const{validateMazeContent}=require('../../dist/games/ai-maze-escape/src/generation/content.js');const{MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');const{checksum}=require('../../dist/packages/replay/src/index.js');
test('feature-rich generation remains valid across every launch profile',()=>{for(const profile of ['tree','loops','chambers','layers','hunter'])for(let i=0;i<6;i++){const runtime=MazeRuntime.create({width:15,height:13,profile,visibilityRadius:2,keyCount:2,trapCount:5,threatCount:profile==='hunter'?1:0},`content-${profile}-${i}`),validation=validateMazeContent(runtime.state.world,{minimumThreatResponseDistance:3});assert.equal(validation.valid,true,`${profile}-${i}: ${validation.reasons.join(',')}`);assert.equal(validation.solutionExists,true);assert.equal(validation.keyOrderValid,true);assert.equal(validation.safeSpawn,true)}});
test('stratified Phase 2 campaign is deterministic, technically clean and demonstrates dramatic variety',()=>{const options={runsPerProfile:5,profiles:['tree','loops','chambers','layers','hunter'],baseSeed:'phase2-campaign',maxTicks:18000},a=runMazeCampaign(options),b=runMazeCampaign(options);assert.equal(checksum(a),checksum(b));assert.deepEqual(a,b);assert.equal(a.totalRuns,25);assert.equal(a.technicalOutcomes,0);assert.equal(a.invalidContent,0);assert.equal(a.hiddenInformationViolations,0);assert.ok(a.escapes>=15,JSON.stringify(a));assert.ok(a.patterns.length>=3,JSON.stringify(a.patterns));assert.ok(a.profiles.every(profile=>profile.runs===5));assert.match(a.campaignChecksum,/^[0-9a-f]{8}$/)});
test('flagship guardian patrols a real open side corridor beside the required journey, without blocking the route',()=>{
  const{parseMazeConfig}=require('../../dist/games/ai-maze-escape/src/config/schema.js');
  const{passageNeighbors,solveMaze}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
  const config=parseMazeConfig({width:17,height:11,profile:'chambers',level:4,visibilityRadius:3,
    loopChancePermille:170,keyCount:2,trapCount:5,threatCount:1});
  let eligible=0,straightEligible=0;
  for(const seed of [3,13,5,0,1,2].map(index=>`maze-visual-reference-${index}`)){
    const first=MazeRuntime.create(config,seed),again=MazeRuntime.create(config,seed);
    const world=first.state.world;
    assert.deepEqual(world,again.state.world,'new world generation must remain deterministic for its seed');
    const route=solveMaze(world,{start:world.start,goal:world.exit});
    assert.ok(route,'the main route must remain traversable');
    const routeCells=new Set(route);
    const unavailable=new Set([world.start,world.exit,...world.traps,
      ...world.keys.map(key=>key.cell),...world.doors.flatMap(door=>[door.a,door.b])]);
    const minimum=Math.max(3,config.visibilityRadius+1);
    const hasSideCorridor=route.some((approach,index)=>index>=Math.max(2,minimum)
      &&index<route.length-2&&!unavailable.has(approach)
      &&passageNeighbors(world,approach).some(spawn=>!unavailable.has(spawn)&&!routeCells.has(spawn)
        &&(solveMaze(world,{start:world.start,goal:spawn})?.length??0)-1>=minimum
        &&passageNeighbors(world,spawn).some(retreat=>!unavailable.has(retreat)&&!routeCells.has(retreat))));
    if(!hasSideCorridor)continue; // preserve genuine topology; never cut a fake link
    eligible++;
    // Test the exact physical two-link line required by the real WebGL
    // recognition/brace/release gate, not mere Euclidean closeness.
    const straight=(approach,spawn,retreat)=>{
      const row=cell=>Math.floor(cell/world.width),col=cell=>cell%world.width;
      return row(retreat)-row(spawn)===row(spawn)-row(approach)
        &&col(retreat)-col(spawn)===col(spawn)-col(approach);
    };
    const eligibleStraight=route.some((approach,index)=>index>=Math.max(2,minimum)
      &&index<route.length-2&&!unavailable.has(approach)
      &&passageNeighbors(world,approach).some(spawn=>!unavailable.has(spawn)
        &&!routeCells.has(spawn)&&passageNeighbors(world,spawn).includes(approach)
        &&(solveMaze(world,{start:world.start,goal:spawn})?.length??0)-1>=minimum
        &&passageNeighbors(world,spawn).some(retreat=>!unavailable.has(retreat)
          &&!routeCells.has(retreat)&&passageNeighbors(world,retreat).includes(spawn)
          &&straight(approach,spawn,retreat))));
    if(eligibleStraight)straightEligible++;
    const guard=world.threats[0];
    assert.ok(guard,`expected authored watchpost for ${seed}`);
    assert.equal(guard.route.length,2);
    assert.equal(guard.cell,guard.route[0]);
    assert.ok(guard.route.every(cell=>!routeCells.has(cell)),`patrol does not occupy required route for ${seed}`);
    assert.ok(passageNeighbors(world,guard.route[0]).includes(guard.route[1]),'actual retreat passage remains open');
    assert.ok(route.some((approach,index)=>index>=minimum&&index<route.length-2
      &&!unavailable.has(approach)&&passageNeighbors(world,approach).includes(guard.cell)),
      `Pip can naturally witness a physical connected Thornback beside the route: ${seed}`);
    if(eligibleStraight)assert.ok(route.some((approach,index)=>index>=minimum
      &&index<route.length-2&&!unavailable.has(approach)
      &&passageNeighbors(world,approach).includes(guard.route[0])
      &&passageNeighbors(world,guard.route[0]).includes(approach)
      &&passageNeighbors(world,guard.route[0]).includes(guard.route[1])
      &&passageNeighbors(world,guard.route[1]).includes(guard.route[0])
      &&straight(approach,guard.route[0],guard.route[1])),
      `An available straight two-cell public encounter MUST outrank a bend: ${seed}`);
  }
  assert.ok(eligible>0,'reference worlds must expose at least one naturally eligible watchpost');
  assert.ok(straightEligible>0,'real sampled seeds must exercise a naturally aligned patrol; otherwise this improvement is unproven');
});
test('real early pressure court is an optional reciprocal passage visible during original AI play',()=>{
  const{parseMazeConfig}=require('../../dist/games/ai-maze-escape/src/config/schema.js');
  const{passageNeighbors,solveMaze}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
  const{buildMazeRenderSnapshot}=require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
  const config=parseMazeConfig({width:17,height:11,profile:'chambers',level:4,visibilityRadius:3,
    loopChancePermille:170,keyCount:2,trapCount:5,threatCount:1});
  let eligible=0,publicEncounters=0;
  for(const seed of [3,13,5,0,1,2].map(index=>`maze-visual-reference-${index}`)){
    const runtime=MazeRuntime.create(config,seed,{policy:'partial-observation'});
    const world=runtime.state.world,route=solveMaze(world,{start:world.start,goal:world.exit});
    assert.ok(route,'pressure court must preserve a real exit route');
    const routeCells=new Set(route);
    const reserved=new Set([world.start,world.exit,...world.keys.map(key=>key.cell),
      ...world.doors.flatMap(door=>[door.a,door.b])]);
    const minimum=Math.max(3,config.visibilityRadius+1);
    const sidePassages=route.flatMap((approach,index)=>{
      if(index<minimum||index>=route.length-2||reserved.has(approach))return [];
      return passageNeighbors(world,approach)
        .filter(cell=>!routeCells.has(cell)&&!reserved.has(cell)
          &&passageNeighbors(world,cell).includes(approach))
        .map(cell=>({approach,cell}));
    });
    assert.ok(world.traps.every(cell=>!routeCells.has(cell)),
      'never make a lethal trap unavoidable on the mandatory route');
    if(!sidePassages.length)continue;
    eligible++;
    assert.ok(world.traps.some(cell=>sidePassages.some(side=>side.cell===cell)),
      `a physically reciprocal optional corridor must host one real pressure trap: ${seed}`);
    for(let step=0;step<1400;step++){
      const state=buildMazeRenderSnapshot(runtime.state);
      if(state.lifecycle==='running'&&!state.result&&!state.threats.length){
        const heroCol=state.currentCell%state.width,heroRow=Math.floor(state.currentCell/state.width);
        if(state.cells.some(cell=>cell.trap&&state.visibleCells.includes(cell.cell)
          &&Math.abs(cell.cell%state.width-heroCol)
            +Math.abs(Math.floor(cell.cell/state.width)-heroRow)===1)){
          publicEncounters++;
          break;
        }
      }
      if(runtime.state.result)break;
      runtime.step();
    }
  }
  assert.ok(eligible>0,'reference topologies must offer a real optional side branch');
  assert.ok(publicEncounters>0,'at least one natural AI run must visibly encounter an adjacent physical trap without a warden');
});
test('invalid content is classified as technical quarantine and excluded from fair loss metrics',()=>{const runtime=MazeRuntime.create({width:9,height:9,profile:'tree'},'invalid-content'),world=structuredClone(runtime.state.world);world.passages.fill(0);const validation=validateMazeContent(world);assert.equal(validation.valid,false);assert.equal(validation.solutionExists,false);const report=runMazeCampaign({fixtures:[{seed:'invalid-fixture',world}],profiles:[],runsPerProfile:0,baseSeed:'invalid'});assert.equal(report.technicalOutcomes,1);assert.equal(report.gameFailures,0);assert.equal(report.invalidContent,1)});
