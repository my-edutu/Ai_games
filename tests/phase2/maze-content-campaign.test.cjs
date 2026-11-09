'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const{runMazeCampaign}=require('../../dist/games/ai-maze-escape/src/testing/campaign.js');const{validateMazeContent}=require('../../dist/games/ai-maze-escape/src/generation/content.js');const{MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');const{checksum}=require('../../dist/packages/replay/src/index.js');
test('feature-rich generation remains valid across every launch profile',()=>{for(const profile of ['tree','loops','chambers','layers','hunter'])for(let i=0;i<6;i++){const runtime=MazeRuntime.create({width:15,height:13,profile,visibilityRadius:2,keyCount:2,trapCount:5,threatCount:profile==='hunter'?1:0},`content-${profile}-${i}`),validation=validateMazeContent(runtime.state.world,{minimumThreatResponseDistance:3});assert.equal(validation.valid,true,`${profile}-${i}: ${validation.reasons.join(',')}`);assert.equal(validation.solutionExists,true);assert.equal(validation.keyOrderValid,true);assert.equal(validation.safeSpawn,true)}});
test('stratified Phase 2 campaign is deterministic, technically clean and demonstrates dramatic variety',()=>{const options={runsPerProfile:5,profiles:['tree','loops','chambers','layers','hunter'],baseSeed:'phase2-campaign',maxTicks:18000},a=runMazeCampaign(options),b=runMazeCampaign(options);assert.equal(checksum(a),checksum(b));assert.deepEqual(a,b);assert.equal(a.totalRuns,25);assert.equal(a.technicalOutcomes,0);assert.equal(a.invalidContent,0);assert.equal(a.hiddenInformationViolations,0);assert.ok(a.escapes>=15,JSON.stringify(a));assert.ok(a.patterns.length>=3,JSON.stringify(a.patterns));assert.ok(a.profiles.every(profile=>profile.runs===5));assert.match(a.campaignChecksum,/^[0-9a-f]{8}$/)});
test('flagship guardian patrols a real open side corridor beside the required journey, without blocking the route',()=>{
  const{parseMazeConfig}=require('../../dist/games/ai-maze-escape/src/config/schema.js');
  const{passageNeighbors,solveMaze}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
  const config=parseMazeConfig({width:17,height:11,profile:'chambers',level:4,visibilityRadius:3,
    loopChancePermille:170,keyCount:2,trapCount:5,threatCount:1});
  let eligible=0;
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
    const guard=world.threats[0];
    assert.ok(guard,`expected authored watchpost for ${seed}`);
    assert.equal(guard.route.length,2);
    assert.equal(guard.cell,guard.route[0]);
    assert.ok(guard.route.every(cell=>!routeCells.has(cell)),`patrol does not occupy required route for ${seed}`);
    assert.ok(passageNeighbors(world,guard.route[0]).includes(guard.route[1]),'actual retreat passage remains open');
    assert.ok(route.some((approach,index)=>index>=minimum&&index<route.length-2
      &&!unavailable.has(approach)&&passageNeighbors(world,approach).includes(guard.cell)),
      `Pip can naturally witness a physical connected Thornback beside the route: ${seed}`);
  }
  assert.ok(eligible>0,'reference worlds must expose at least one naturally eligible watchpost');
});
test('invalid content is classified as technical quarantine and excluded from fair loss metrics',()=>{const runtime=MazeRuntime.create({width:9,height:9,profile:'tree'},'invalid-content'),world=structuredClone(runtime.state.world);world.passages.fill(0);const validation=validateMazeContent(world);assert.equal(validation.valid,false);assert.equal(validation.solutionExists,false);const report=runMazeCampaign({fixtures:[{seed:'invalid-fixture',world}],profiles:[],runsPerProfile:0,baseSeed:'invalid'});assert.equal(report.technicalOutcomes,1);assert.equal(report.gameFailures,0);assert.equal(report.invalidContent,1)});
