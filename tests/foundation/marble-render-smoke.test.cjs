'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const runtime=path.resolve(__dirname,'../../games/marble-survival/public/complete-runtime');
const rendererSource=fs.readFileSync(path.join(runtime,'renderer3d.js'),'utf8');
const geometrySource=fs.readFileSync(path.join(runtime,'arena-geometry.js'),'utf8');
const QUALITY=['low','balanced','high','ultra'];
const BIOMES=['seeding-sprint','gate-gauntlet','hazard-circuit','final-four','championship'];

function makeSnapshot(stage,champion=false){
  return {
    version:1,tick:312,lifecycle:champion?'tournament-result':'active',
    round:{number:BIOMES.indexOf(stage)+1,index:BIOMES.indexOf(stage),remaining:champion?1:12,qualified:champion?1:3,quota:8},
    arena:{
      id:'visual-smoke-'+stage,archetype:stage,width:20000,height:14000,finishY:1400,
      obstacles:[{id:'test-block',x:4000,y:6500,width:1200,height:700}],
      hazards:[{id:'pit-a',kind:'pit',x:2500,y:4000,width:2500,height:1400}],
      bumpers:[{id:'electric',x:9500,y:8000,radius:420,launchSpeed:300}],
      sweepers:[{id:'moving',baseX:7000,baseY:4000,width:3300,height:250,axis:'x',amplitude:1100,periodTicks:120,phaseTicks:0}],
      ramps:[{id:'ramp',x:8000,y:7000,width:5000,height:2100,axis:'y',startElevation:1600,endElevation:0}],
      windZones:stage==='hazard-circuit'?[{id:'real-wind',x:6000,y:9000,width:8000,height:2000,forceX:-10,forceY:-2}]:[],
    },
    marbles:[
      {id:0,number:1,name:'Astra',archetype:'navigator',x:10000,y:9000,elevation:0,velocityX:150,velocityY:-80,progressPermille:480,palette:'cyan',pattern:'ring',status:champion?'champion':'racing'},
      {id:1,number:2,name:'Sol',archetype:'sprinter',x:11000,y:7000,elevation:700,velocityX:120,velocityY:20,progressPermille:550,palette:'gold',pattern:'split',status:'near-finish'},
      {id:2,number:3,name:'Titan',archetype:'bruiser',x:14000,y:10000,elevation:0,velocityX:60,velocityY:-60,progressPermille:320,palette:'ruby',pattern:'chevron',status:'racing'},
      {id:3,number:4,name:'Verdant',archetype:'survivor',x:11500,y:8000,elevation:-230,velocityX:0,velocityY:0,progressPermille:420,palette:'mint',pattern:'dots',status:'threatened'},
    ],
    camera:{directive:{mode:champion?'victory':'overview',zoomPermille:1000,focusIds:[0]},championId:champion?0:null},
    events:[],
  };
}

function makeMockGL(counters){
  const gl={};
  const methods='createShader shaderSource compileShader deleteShader createProgram attachShader linkProgram deleteProgram createVertexArray deleteVertexArray bindVertexArray createBuffer deleteBuffer bindBuffer bufferData enableVertexAttribArray vertexAttribPointer createTexture bindTexture texParameteri createFramebuffer bindFramebuffer createRenderbuffer bindRenderbuffer renderbufferStorage framebufferTexture2D framebufferRenderbuffer uniform2fv getUniformLocation useProgram enable disable blendFunc cullFace drawElements drawArrays uniformMatrix4fv uniformMatrix3fv uniform3fv uniform1f uniform1i viewport clearColor clear depthMask activeTexture pixelStorei texImage2D'.split(' ');
  for(const name of methods)gl[name]=(...args)=>{
    if(name==='drawElements'){counters.drawElements++;counters.maximumMeshIndices=Math.max(counters.maximumMeshIndices,args[1]);}
    if(name==='drawArrays'){counters.drawArrays++;if(args[0]===gl.POINTS)counters.pointCloudDraws++;}
    if(name==='texImage2D')counters.uploads++;
    if(name==='deleteBuffer')counters.deletedBuffers=(counters.deletedBuffers||0)+1;
    if(name==='deleteVertexArray')counters.deletedVertexArrays=(counters.deletedVertexArrays||0)+1;
    if(name==='createBuffer')counters.createdBuffers=(counters.createdBuffers||0)+1;
    if(name==='createVertexArray')counters.createdVertexArrays=(counters.createdVertexArrays||0)+1;
    return name.startsWith('create')?{name}:null;
  };
  const constants='VERTEX_SHADER FRAGMENT_SHADER COMPILE_STATUS LINK_STATUS ARRAY_BUFFER ELEMENT_ARRAY_BUFFER STATIC_DRAW FLOAT UNSIGNED_SHORT TRIANGLES TRIANGLE_FAN FRAMEBUFFER RENDERBUFFER DEPTH_COMPONENT16 FRAMEBUFFER_COMPLETE DEPTH_ATTACHMENT COLOR_ATTACHMENT0 TEXTURE_2D TEXTURE_MIN_FILTER TEXTURE_MAG_FILTER TEXTURE_WRAP_S TEXTURE_WRAP_T LINEAR CLAMP_TO_EDGE COLOR_BUFFER_BIT DEPTH_BUFFER_BIT TEXTURE0 UNPACK_FLIP_Y_WEBGL RGBA UNSIGNED_BYTE POINTS DEPTH_TEST BLEND CULL_FACE BACK SRC_ALPHA ONE_MINUS_SRC_ALPHA'.split(' ');
  for(const name of constants)gl[name]=name;
  gl.getShaderParameter=()=>true;
  gl.getProgramParameter=()=>true;
  gl.checkFramebufferStatus=()=>gl.FRAMEBUFFER_COMPLETE;
  return gl;
}

async function simulateStage(stage,quality,champion=false){
  const counters={drawElements:0,drawArrays:0,uploads:0,pointCloudDraws:0,maximumMeshIndices:0};
  const gl=makeMockGL(counters);
  const shell={dataset:{},classList:{add(){},remove(){}}};
  const canvas={getContext:()=>gl,getBoundingClientRect:()=>({width:1600,height:900}),width:1600,height:900,addEventListener(){}};
  const ctx={
    createLinearGradient:()=>({addColorStop(){}}),
    clearRect(){},fillRect(){},strokeRect(){},fillText(){},
  };
  const window={
    devicePixelRatio:1,matchMedia:()=>({matches:false}),
    addEventListener(){},
  };
  const qualitySelect={value:quality};
  const document={
    hidden:false,
    querySelector:()=>shell,
    getElementById:id=>id==='arena-webgl'?canvas:id==='quality-select'?qualitySelect:null,
    addEventListener(){},
    createElement:()=>({width:1024,height:256,getContext:()=>ctx}),
  };
  const frames=[];
  let currentStage=stage,currentChampion=champion,requestPoll=()=>{};
  const sandbox={
    window,document,performance:{now:()=>12},
    fetch:async()=>({ok:true,json:async()=>makeSnapshot(currentStage,currentChampion)}),
    requestAnimationFrame:callback=>{frames.push(callback);},
    setInterval(callback){requestPoll=callback;},
    BroadcastChannel:undefined,
    location:{reload(){}},
  };
  vm.runInNewContext(geometrySource,sandbox,{filename:'arena-geometry.js'});
  vm.runInNewContext(rendererSource,sandbox,{filename:'renderer3d.js'});
  // Let the first public snapshot reach the billboard texture and renderer.
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(frames.length>0,'WebGL renderer must request an animation frame');
  frames.shift()(120);
  return {
    counters,shell,frame:sandbox.window.marbleRenderFrame,
    async nextStage(next,officialChampion=false){
      currentStage=next;
      currentChampion=officialChampion;
      requestPoll();
      await new Promise(resolve=>setImmediate(resolve));
      assert.ok(frames.length>0,'scene must keep scheduling render frames');
      frames.shift()(140+BIOMES.indexOf(next)*120);
      return sandbox.window.marbleRenderFrame;
    },
  };
}

for(const biome of BIOMES){
  test('3D arena smoke: '+biome+' with real pit topology and a public LED scoreboard',async()=>{
    const {counters,shell,frame}=await simulateStage(biome,'balanced');
    assert.equal(shell.dataset.renderer,'webgl2');
    assert.equal(shell.dataset.cutoutCount,'1');
    assert.ok(Number(shell.dataset.deckTileCount)>1);
    assert.equal(shell.dataset.ledRound,String(BIOMES.indexOf(biome)+1));
    assert.equal(shell.dataset.stadiumStyle,biome);
    assert.ok(Number(shell.dataset.propContactShadows)>0,
      'industrial machinery must be physically grounded with 3D soft shadows');
    assert.ok(Number(shell.dataset.stadiumModules)>=120,'arena must have genuinely detailed geometry');
    assert.equal(shell.dataset.spotlightVolumes,'6');
    assert.equal(shell.dataset.crowdCount,'320');
    assert.ok(counters.drawElements>50,'3D world must draw actual meshes');
    assert.ok(counters.drawArrays>=3,'sky, in-world LED and living GPU crowd must render');
    assert.equal(counters.pointCloudDraws,1,'hundreds of spectators should cost exactly one draw call');
    assert.equal(Number(shell.dataset.crowdCount),320);
    assert.equal(counters.uploads,2,'public 3D scoreboard and offscreen scene texture upload once');
    assert.equal(shell.dataset.postprocess,'neon-glow',
      'balanced and higher tiers must composite their actual 3D scene');
    assert.ok(counters.drawArrays>=4,'sky, crowd, scoreboard and real GPU glow composite');
    assert.ok(frame?.viewProjection?.length===16);
  });
}

test('low graphics tier removes expensive effects but keeps a real 3D race scene',async()=>{
  const {counters,shell}=await simulateStage('seeding-sprint','low');
  assert.equal(shell.dataset.renderer,'webgl2');
  assert.ok(counters.drawElements>20);
  assert.ok(counters.drawArrays>=2);
  assert.equal(shell.dataset.postprocess,'direct','low tier must skip offscreen effects');
});

test('ultra graphical tier renders more geometry and extra physical LED signage',async()=>{
  const balanced=await simulateStage('final-four','balanced');
  const ultra=await simulateStage('final-four','ultra');
  assert.ok(ultra.counters.drawElements>balanced.counters.drawElements);
  assert.ok(ultra.counters.drawArrays>balanced.counters.drawArrays);
  assert.ok(ultra.counters.maximumMeshIndices>balanced.counters.maximumMeshIndices,'ultra requires genuinely denser marble surface geometry');
  assert.equal(ultra.shell.dataset.crowdCount,'1100');
  assert.equal(balanced.shell.dataset.crowdCount,'320');
});

test('championship 3D scene can render legitimate trophy without a client-picked champion',async()=>{
  const {counters,frame}=await simulateStage('championship','high',true);
  assert.ok(counters.drawElements>50);
  assert.equal(frame?.snapshot?.camera?.championId,0);
  assert.equal(frame?.snapshot?.lifecycle,'tournament-result');
  assert.equal(frame?.snapshot?.camera?.championId,0);
  const verified=await simulateStage('championship','high',true);
  assert.equal(verified.shell.dataset.ceremonyChampion,'0');
  assert.equal(verified.shell.dataset.ceremonyArchitecture,'crown-arches');
});

test('all four character archetypes render physically distinct attachments and a falling contestant casts no false deck shadow',async()=>{
  const result=await simulateStage('hazard-circuit','high');
  assert.equal(result.shell.dataset.renderer,'webgl2');
  assert.ok(result.counters.drawElements>140,'real distinct character geometry and falling hazard visuals must increase the mesh budget');
  assert.equal(result.frame.marbles.length,4);
  assert.deepEqual(result.frame.marbles.map(m=>m.archetype),['navigator','sprinter','bruiser','survivor']);
  assert.ok(result.frame.marbles.some(m=>m.elevation<0));
});

test('real public wind fields render only in the stage where authority declares them',async()=>{
  const wind=await simulateStage('hazard-circuit','balanced');
  const noWind=await simulateStage('seeding-sprint','balanced');
  assert.equal(wind.shell.dataset.publicWindZones,'1');
  assert.equal(noWind.shell.dataset.publicWindZones,'0');
  assert.ok(wind.counters.drawElements>noWind.counters.drawElements,
    'real wind must render genuinely visible 3D stream meshes');
  assert.equal(wind.counters.pointCloudDraws,1);
});
test('minimal-quality audience uses a single point draw and keeps marble geometry cheaper',async()=>{
  const low=await simulateStage('seeding-sprint','low');
  const high=await simulateStage('seeding-sprint','high');
  assert.equal(low.shell.dataset.crowdCount,'64');
  assert.equal(high.shell.dataset.crowdCount,'660');
  assert.equal(low.counters.pointCloudDraws,1);
  assert.equal(high.counters.pointCloudDraws,1);
  assert.ok(high.counters.maximumMeshIndices>low.counters.maximumMeshIndices);
});

test('the audience reacts harder to official championship than a mid-round battle',async()=>{
  const normal=await simulateStage('championship','balanced',false);
  const winner=await simulateStage('championship','balanced',true);
  assert.equal(normal.shell.dataset.crowdCount,'320');
  assert.ok(Number(winner.shell.dataset.crowdExcitement)>Number(normal.shell.dataset.crowdExcitement));
  assert.equal(winner.counters.pointCloudDraws,1,'victory crowd must still stay within one draw call');
});

test('stadium kit scales up at Ultra while respecting one-time body mesh batching',async()=>{
  const low=await simulateStage('seeding-sprint','low');
  const ultra=await simulateStage('seeding-sprint','ultra');
  assert.ok(Number(ultra.shell.dataset.stadiumModules)>Number(low.shell.dataset.stadiumModules));
  assert.equal(low.shell.dataset.stadiumStyle,'seeding-sprint');
  assert.equal(ultra.shell.dataset.stadiumStyle,'seeding-sprint');
  assert.equal(ultra.shell.dataset.spotlightVolumes,'16');
});

test('every stage gets its own monumental 3D skyline, architecture and physics-safe hero landmark',async()=>{
  const stages=['seeding-sprint','gate-gauntlet','hazard-circuit','final-four','championship'];
  const styles=new Set();
  for(const stage of stages){
    const {shell,counters}=await simulateStage(stage,'balanced',false);
    assert.equal(shell.dataset.stadiumStyle,stage);
    assert.equal(shell.dataset.landmarkStyle,stage);
    assert.equal(shell.dataset.spotlightVolumes,'6');
    assert.ok(Number(shell.dataset.stadiumModules)>=300,'arena buildings must contain detailed geometry modules');
    assert.ok(Number(shell.dataset.horizonGeometry)>=300,'far skyline must be a genuine multi-triangle terrain mesh');
    assert.equal(shell.dataset.postprocess,'neon-glow');
    assert.equal(counters.pointCloudDraws,1);
    styles.add(shell.dataset.landmarkStyle);
  }
  assert.equal(styles.size,5,'five arena biomes may not become recoloured clones');
});

test('always-on autonomous stadium releases obsolete stage GPU buffers through complete biome and victory cycles',async()=>{
  const render=await simulateStage('seeding-sprint','high');
  const oldBuffers=render.counters.createdBuffers;
  const oldVaos=render.counters.createdVertexArrays;
  const cycle=['gate-gauntlet','hazard-circuit','final-four','championship','seeding-sprint'];
  for(const biome of cycle){
    const frame=await render.nextStage(biome,biome==='championship');
    assert.equal(frame.snapshot.arena.archetype,biome);
    assert.equal(render.shell.dataset.stadiumStyle,biome);
    assert.equal(render.shell.dataset.landmarkStyle,biome);
    assert.equal(render.shell.dataset.postprocess,'neon-glow');
    assert.equal(render.shell.dataset.crowdCount,'660');
    assert.ok(Number(render.shell.dataset.horizonGeometry)>=300);
  }
  assert.ok(render.counters.createdBuffers>oldBuffers,
    'distinct stages must upload actual separate mesh geometries');
  assert.ok(render.counters.createdVertexArrays>oldVaos);
  assert.ok(render.counters.deletedBuffers>=15,
    'stale stadium/skyline GPU buffers must be explicitly freed on stage changes');
  assert.ok(render.counters.deletedVertexArrays>=10,
    'old geometry vertex-array handles cannot accumulate across tournaments');
});
