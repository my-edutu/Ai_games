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
    },
    marbles:[
      {id:0,number:1,name:'Astra',x:10000,y:9000,elevation:0,velocityX:150,velocityY:-80,progressPermille:480,palette:'cyan',pattern:'ring',status:champion?'champion':'racing'},
      {id:1,number:2,name:'Sol',x:11000,y:7000,elevation:700,velocityX:120,velocityY:20,progressPermille:550,palette:'gold',pattern:'split',status:'near-finish'},
    ],
    camera:{directive:{mode:champion?'victory':'overview',zoomPermille:1000,focusIds:[0]},championId:champion?0:null},
    events:[],
  };
}

function makeMockGL(counters){
  const gl={};
  const methods='createShader shaderSource compileShader deleteShader createProgram attachShader linkProgram deleteProgram createVertexArray bindVertexArray createBuffer bindBuffer bufferData enableVertexAttribArray vertexAttribPointer createTexture bindTexture texParameteri getUniformLocation useProgram enable disable blendFunc cullFace drawElements drawArrays uniformMatrix4fv uniformMatrix3fv uniform3fv uniform1f uniform1i viewport clearColor clear depthMask activeTexture pixelStorei texImage2D'.split(' ');
  for(const name of methods)gl[name]=(...args)=>{
    if(name==='drawElements')counters.drawElements++;
    if(name==='drawArrays')counters.drawArrays++;
    if(name==='texImage2D')counters.uploads++;
    return name.startsWith('create')?{name}:null;
  };
  const constants='VERTEX_SHADER FRAGMENT_SHADER COMPILE_STATUS LINK_STATUS ARRAY_BUFFER ELEMENT_ARRAY_BUFFER STATIC_DRAW FLOAT UNSIGNED_SHORT TRIANGLES TRIANGLE_FAN TEXTURE_2D TEXTURE_MIN_FILTER TEXTURE_MAG_FILTER TEXTURE_WRAP_S TEXTURE_WRAP_T LINEAR CLAMP_TO_EDGE COLOR_BUFFER_BIT DEPTH_BUFFER_BIT TEXTURE0 UNPACK_FLIP_Y_WEBGL RGBA UNSIGNED_BYTE DEPTH_TEST BLEND CULL_FACE BACK SRC_ALPHA ONE_MINUS_SRC_ALPHA'.split(' ');
  for(const name of constants)gl[name]=name;
  gl.getShaderParameter=()=>true;
  gl.getProgramParameter=()=>true;
  return gl;
}

async function simulateStage(stage,quality,champion=false){
  const counters={drawElements:0,drawArrays:0,uploads:0};
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
  const sandbox={
    window,document,performance:{now:()=>12},
    fetch:async()=>({ok:true,json:async()=>makeSnapshot(stage,champion)}),
    requestAnimationFrame:callback=>{frames.push(callback);},
    setInterval(){},
    BroadcastChannel:undefined,
    location:{reload(){}},
  };
  vm.runInNewContext(geometrySource,sandbox,{filename:'arena-geometry.js'});
  vm.runInNewContext(rendererSource,sandbox,{filename:'renderer3d.js'});
  // Let the first public snapshot reach the billboard texture and renderer.
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(frames.length>0,'WebGL renderer must request an animation frame');
  frames.shift()(120);
  return {counters,shell,frame:sandbox.window.marbleRenderFrame};
}

for(const biome of BIOMES){
  test('3D arena smoke: '+biome+' with real pit topology and a public LED scoreboard',async()=>{
    const {counters,shell,frame}=await simulateStage(biome,'balanced');
    assert.equal(shell.dataset.renderer,'webgl2');
    assert.equal(shell.dataset.cutoutCount,'1');
    assert.ok(Number(shell.dataset.deckTileCount)>1);
    assert.equal(shell.dataset.ledRound,String(BIOMES.indexOf(biome)+1));
    assert.ok(counters.drawElements>50,'3D world must draw actual meshes');
    assert.ok(counters.drawArrays>=2,'sky and stadium billboard must be drawn');
    assert.equal(counters.uploads,1,'text billboard should upload once per initial snapshot');
    assert.ok(frame?.viewProjection?.length===16);
  });
}

test('low graphics tier removes expensive effects but keeps a real 3D race scene',async()=>{
  const {counters,shell}=await simulateStage('seeding-sprint','low');
  assert.equal(shell.dataset.renderer,'webgl2');
  assert.ok(counters.drawElements>20);
  assert.ok(counters.drawArrays>=2);
});

test('ultra graphical tier renders more geometry and extra physical LED signage',async()=>{
  const balanced=await simulateStage('final-four','balanced');
  const ultra=await simulateStage('final-four','ultra');
  assert.ok(ultra.counters.drawElements>balanced.counters.drawElements);
  assert.ok(ultra.counters.drawArrays>balanced.counters.drawArrays);
});

test('championship 3D scene can render legitimate trophy without a client-picked champion',async()=>{
  const {counters,frame}=await simulateStage('championship','high',true);
  assert.ok(counters.drawElements>50);
  assert.equal(frame?.snapshot?.camera?.championId,0);
  assert.equal(frame?.snapshot?.lifecycle,'tournament-result');
});
