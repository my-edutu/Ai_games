'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

function inspect(theme='neon',quality='high'){
  const shaders=[],uploads=[];
  const gl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
    DEPTH_TEST:5,LEQUAL:6,CULL_FACE:7,COLOR_BUFFER_BIT:8,DEPTH_BUFFER_BIT:16,
    ARRAY_BUFFER:20,STATIC_DRAW:21,DYNAMIC_DRAW:22,TRIANGLES:23,FLOAT:24,SCISSOR_TEST:25,
    createShader:type=>({type}),shaderSource(shader,text){shaders.push({type:shader.type,text})},
    createProgram:()=>({}),createBuffer:()=>({}),
    getShaderParameter:()=>true,getProgramParameter:()=>true,
    getAttribLocation:()=>0,getUniformLocation:()=>0,isContextLost:()=>false
  };
  for(const name of ['compileShader','deleteShader','attachShader','linkProgram',
    'deleteProgram','enable','depthFunc','disable','clearColor','viewport','scissor',
    'useProgram','uniform3f','uniform2f','uniform1f','bindBuffer',
    'enableVertexAttribArray','vertexAttribPointer','clear','drawArrays'])
      gl[name]=()=>{};
  gl.bufferData=(_type,geometry,drawType)=>uploads.push({vertices:geometry.length/9,mode:drawType});
  const canvas={dataset:{},style:{},width:150,height:100,
    setAttribute(){},addEventListener(){},remove(){},getContext:()=>gl};
  const host={appendChild(){},getBoundingClientRect:()=>({width:1340,height:760})};
  const makeDiv=()=>({className:'',dataset:{},style:{},textContent:'',
    children:[],setAttribute(){},appendChild(){},
    replaceChildren(...nodes){this.children=nodes}});
  const document={querySelector:()=>({parentElement:host}),
    createElement:type=>type==='canvas'?canvas:makeDiv(),body:{dataset:{}},hidden:false};
  const window={devicePixelRatio:1};
  vm.runInNewContext(source,{
    document,window,location:{search:'?quality='+quality},devicePixelRatio:1,
    URLSearchParams,matchMedia:()=>({matches:false}),
    performance:{now:()=>500},requestAnimationFrame:()=>1
  },{timeout:1800});
  const fighters=Object.freeze([
    Object.freeze({id:'alpha',name:'Alpha',archetype:'ranger',cell:125,
      alive:true,intent:'attacking',weapon:'marksman',health:91,maxHealth:100,
      shield:20,maxShield:100}),
    Object.freeze({id:'beta',name:'Beta',archetype:'scavenger',cell:165,
      alive:true,intent:'healing',weapon:'carbine',health:73,maxHealth:100,
      shield:14,maxShield:100})
  ]);
  const arena=Object.freeze({width:24,height:18,theme,
    obstacles:Object.freeze([30,52,83]),cover:Object.freeze([90,104]),
    loot:Object.freeze([])});
  const frame=Object.freeze({runToken:'art-review',tick:51,scene:'battle',arena,
    zone:Object.freeze({centerCell:214,radius:7,phase:2,ticksUntilShrink:9}),
    combatants:fighters,focus:Object.freeze({id:'alpha'}),recentEvents:Object.freeze([])});
  assert.equal(window.BattleArena3D.render(frame),true,'headless GL geometry submit should succeed');
  return {shaders,uploads,status:window.BattleArena3D.status,frame};
}

test('real shader sources use GLSL newlines rather than literal backslash-n tokens',()=>{
  const {shaders}=inspect();
  assert.equal(shaders.length,2);
  for(const shader of shaders){
    assert.ok(shader.text.startsWith('#version 300 es\n'));
    assert.ok(shader.text.split('\n').length>14);
    assert.equal(shader.text.includes('\\n'),false,'GLSL cannot parse literal \\n separators');
  }
  assert.match(shaders[1].text,/float specular/);
  assert.match(shaders[1].text,/float grainFine/);
  assert.match(shaders[1].text,/vec3 finalColor/);
});

test('sculpted high fidelity biomes preserve immutable simulation and cost less in low GPU mode',()=>{
  for(const theme of ['ember','neon','arctic']){
    const high=inspect(theme,'high'),low=inspect(theme,'low');
    assert.ok(high.status.triangles>low.status.triangles*2,
      theme+' rich environment should have real 3D geometry absent on low tier');
    assert.ok(high.status.triangles<95000,'geometry budget must remain bounded');
    assert.equal(high.status.sceneBuilds,1);
    assert.equal(low.status.sceneBuilds,1);
    assert.equal(high.status.contenders,2);
    assert.equal(low.status.contenders,2);
    assert.equal(high.frame.combatants[0].visual,undefined);
  }
});
