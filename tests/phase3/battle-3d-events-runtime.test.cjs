'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
function createHarness(){
  const fakeGl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
    DEPTH_TEST:5,LEQUAL:6,CULL_FACE:7,COLOR_BUFFER_BIT:8,DEPTH_BUFFER_BIT:16,
    ARRAY_BUFFER:20,DYNAMIC_DRAW:21,STATIC_DRAW:22,TRIANGLES:23,FLOAT:24,SCISSOR_TEST:25,
    createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),
    getShaderParameter:()=>true,getProgramParameter:()=>true,
    getAttribLocation:()=>0,getUniformLocation:()=>0,isContextLost:()=>false
  };
  for(const fn of ['shaderSource','compileShader','deleteShader','attachShader','linkProgram',
    'enable','depthFunc','disable','clearColor','viewport','scissor','useProgram','uniform3f',
    'uniform2f','uniform1f','bindBuffer','bufferData','enableVertexAttribArray',
    'vertexAttribPointer','clear','drawArrays'])fakeGl[fn]=()=>{};
  let now=100;
  const canvas={dataset:{},style:{},width:200,height:100,setAttribute(){},
    addEventListener(){},getContext:()=>fakeGl,remove(){}};
  const host={appendChild(){},getBoundingClientRect:()=>({width:1150,height:700})};
  const document={
    querySelector:()=>({parentElement:host}),
    createElement:tag=>tag==='canvas'?canvas:{setAttribute(){},textContent:'',className:''},
    body:{dataset:{}}
  };
  const window={devicePixelRatio:1};
  vm.runInNewContext(src,{
    document,window,location:{search:''},URLSearchParams,
    matchMedia:()=>({matches:false}),devicePixelRatio:1,
    performance:{now:()=>now},requestAnimationFrame:()=>1
  },{timeout:1000});
  return {render:window.BattleArena3D.render,
    status:window.BattleArena3D.status,
    setTime:value=>{now=value}
  };
}
const base={
  runToken:'run-x',tick:5,scene:'battle',
  arena:{width:12,height:10,obstacles:[2,3],cover:[4,5],loot:[],theme:'ember'},
  zone:{centerCell:55,radius:5},
  combatants:[
    {id:'a',name:'A',cell:21,alive:true,archetype:'vanguard',intent:'attacking',weapon:'carbine',
      health:90,maxHealth:100,shield:20,maxShield:100},
    {id:'b',name:'B',cell:34,alive:true,archetype:'ranger',intent:'pursuing',weapon:'marksman',
      health:70,maxHealth:100,shield:10,maxShield:100}
  ],
  focus:{id:'a'},recentEvents:[]
};
test('impact animations de-duplicate by event sequence and expire after a short bounded lifetime',()=>{
  const context=createHarness();
  assert.equal(context.render(base),true);
  assert.equal(context.status.activeEffects,0);
  const event={sequence:42,tick:5,type:'hit',importance:4,actorId:'a',targetId:'b',cell:34};
  const shot={...base,tick:6,recentEvents:[event]};
  context.setTime(200);
  assert.equal(context.render(shot),true);
  assert.equal(context.status.activeEffects,1);
  context.setTime(400);
  assert.equal(context.render(shot),true);
  assert.equal(context.status.activeEffects,1,'an old event must not produce repeated bursts');
  context.setTime(2000);
  assert.equal(context.render(shot),true);
  assert.equal(context.status.activeEffects,0,'all old hit tracers must disappear');
  context.setTime(2400);
  const newRun={...shot,runToken:'run-y'};
  assert.equal(context.render(newRun),true);
  assert.equal(context.status.activeEffects,1,'new matches must accept their own event sequences');
});
test('new character render poses remain presentation-only and immutable',()=>{
  const context=createHarness();
  const freeze=Object.freeze({...base,combatants:Object.freeze(base.combatants.map(x=>Object.freeze({...x, intent:'healing',weapon:'sidearm'})))});
  assert.equal(context.render(freeze),true);
  assert.equal(context.status.contenders,2);
  assert.equal(context.status.mode,'webgl2');
});
