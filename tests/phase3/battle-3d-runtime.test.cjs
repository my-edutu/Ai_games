'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

function harness(search=''){
  let drawCalls=0;
  const listeners={};
  const gl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
    DEPTH_TEST:5,LEQUAL:6,CULL_FACE:7,COLOR_BUFFER_BIT:8,DEPTH_BUFFER_BIT:16,
    ARRAY_BUFFER:20,DYNAMIC_DRAW:21,TRIANGLES:22,FLOAT:23,
    createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,
    getShaderInfoLog:()=>'',deleteShader(){},createProgram:()=>({}),attachShader(){},
    linkProgram(){},deleteProgram(){},getProgramParameter:()=>true,
    getAttribLocation:()=>0,getUniformLocation:()=>0,createBuffer:()=>({}),
    enable(){},depthFunc(){},disable(){},clearColor(){},isContextLost:()=>false,
    viewport(){},useProgram(){},uniform3f(){},uniform2f(){},bindBuffer(){},
    bufferData(){},enableVertexAttribArray(){},vertexAttribPointer(){},clear(){},
    drawArrays(_mode,_first,count){drawCalls+=1; assert.ok(count>200)}
  };
  const canvas={
    dataset:{},style:{},width:300,height:150,setAttribute(){},
    addEventListener(name,fn){listeners[name]=fn},
    getContext:()=>gl,remove(){}
  };
  const host={appendChild(){},getBoundingClientRect:()=>({width:1280,height:720})};
  const document={querySelector:()=>({parentElement:host}),createElement:()=>canvas,body:{dataset:{}}};
  const window={devicePixelRatio:1};
  let now=100;
  vm.runInNewContext(source,{
    document,window,location:{search},devicePixelRatio:1,
    URLSearchParams,matchMedia:()=>({matches:false}),performance:{now:()=>now},
    requestAnimationFrame:()=>1
  },{timeout:1000});
  return {window,canvas,listeners,document,stepClock:()=>{now+=110},draws:()=>drawCalls};
}
const fighter=Object.freeze({id:'actor-1',cell:99,archetype:'ranger',alive:true,
  health:100,maxHealth:100,shield:30,maxShield:100});
const match=Object.freeze({
  runToken:'demo',tick:1,scene:'battle',combatants:Object.freeze([fighter]),
  arena:Object.freeze({width:24,height:18,theme:'neon',obstacles:Object.freeze([1,2]),
    cover:Object.freeze([3]),loot:Object.freeze([{cell:45,kind:'supply'}])}),
  zone:Object.freeze({centerCell:120,radius:8}),
  focus:Object.freeze({id:'actor-1'}),recentEvents:Object.freeze([])
});

test('3D renderer consumes immutable public state and emits real vertex draw commands',()=>{
  const context=harness();
  assert.equal(context.window.BattleArena3D.render(match),true);
  assert.ok(context.draws()>0);
  assert.ok(context.window.BattleArena3D.status.triangles>100);
  assert.equal(context.window.BattleArena3D.status.contenders,1);
  assert.equal(typeof fighter.visual,'undefined');
  assert.equal(context.canvas.dataset.renderer,'webgl2');
  context.stepClock();
  const second=Object.freeze({...match,tick:2,combatants:Object.freeze([Object.freeze({...fighter,cell:100})])});
  assert.equal(context.window.BattleArena3D.render(second),true);
  assert.ok(context.window.BattleArena3D.status.p95SubmitMs>=0);
});

test('2D-only mode does not create a WebGL renderer',()=>{
  const context=harness('?visual=2d');
  assert.equal(context.window.BattleArena3D.status.mode,'forced-2d');
  assert.equal(context.window.BattleArena3D.render(match),false);
  assert.equal(context.draws(),0);
});

test('WebGL context loss falls back without stopping the battle and can restore',()=>{
  const context=harness();
  assert.equal(context.window.BattleArena3D.render(match),true);
  context.listeners.webglcontextlost({preventDefault(){}});
  assert.equal(context.window.BattleArena3D.status.mode,'context-lost');
  assert.equal(context.window.BattleArena3D.render(match),false);
  context.listeners.webglcontextrestored();
  assert.equal(context.window.BattleArena3D.status.mode,'webgl2');
  assert.equal(context.window.BattleArena3D.render(match),true);
});
