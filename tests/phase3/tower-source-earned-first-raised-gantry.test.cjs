'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const load=()=>import('../../public/infinite-tower-climb/visuals/source-earned-bearing-run.mjs');
const ground={id:'f9:ground',kind:'solid',x:0,y:3212000,width:480000,height:12000};
const step={id:'f9:gateway-step',kind:'oneway',x:263596,y:3290000,width:115000,height:10000};
const p2={id:'f9:p2',kind:'oneway',x:268800,y:3370000,width:125000,height:10000};
const held={runToken:'authentic-guardian-run',floor:9,oldCapId:'f8:cap',
  guardianGateRetained:true,verifiedObservedFloorAdvance:true,
  thresholdX:304896,oldRoofY:3224000,oldCapX:115200,oldCapWidth:249600};
const source={runToken:held.runToken,floor:9,theme:'void',lifecycle:'running',
  tick:475,worldWidth:480000,chunkBaseY:3240000,
  player:{health:4},platforms:[ground,step,p2],lastGuardianCrossing:null};

test('real first raised f9:p2 continues the source-earned gateway-step architecture into one same-run physical ascent',async()=>{
  const {plannedEarnedClockworkVoidBearings,plannedEarnedFirstRaisedRouteContinuation,
    plannedSourceEarnedSuspendedBearingSections}=await load();
  const before=JSON.stringify(source);
  const base=plannedEarnedClockworkVoidBearings(source,held);
  assert.equal(base.nodes.length,3);
  const more=plannedEarnedFirstRaisedRouteContinuation(source,held,base);
  assert.equal(more.sourceBound,true);
  assert.equal(more.raisedId,'f9:p2');
  assert.equal(more.nodes.length,2);
  assert.equal(more.nodes[1].x,p2.x+Math.floor(p2.width/2));
  assert.equal(more.nodes[1].sceneY,(p2.y+p2.height-source.chunkBaseY)/10000);
  assert.ok(more.nodes[0].sceneY>base.nodes[2].sceneY);
  assert.ok(more.nodes[1].sceneY>more.nodes[0].sceneY);
  const extended=plannedSourceEarnedSuspendedBearingSections([...base.nodes,...more.nodes]);
  assert.equal(extended.length,5);
  assert.deepEqual(extended.map(b=>b.length),[7,12,12,12,12]);
  assert.ok(extended.flat().length<=60,'same 3 instanced batches, under 60 source-grounded rigid steel members');
  assert.ok(extended.slice(3).flat().every(p=>p.p.every(Number.isFinite)&&p.s.every(x=>Number.isFinite(x)&&x>0)));
  assert.equal(JSON.stringify(source),before,'visual source planner cannot change game state');
});

test('first raised gantry cannot invent p2, reroute a moving platform, survive foreign runs or violate actual landing geometry',async()=>{
  const {plannedEarnedClockworkVoidBearings,plannedEarnedFirstRaisedRouteContinuation:f}=await load();
  const base=plannedEarnedClockworkVoidBearings(source,held);
  const invalid=[
    {...source,platforms:[ground,step]},
    {...source,platforms:[ground,step,{...p2,id:'f9:p3'}]},
    {...source,platforms:[ground,step,{...p2,kind:'moving'}]},
    {...source,platforms:[ground,step,{...p2,y:step.y}]},
    {...source,platforms:[ground,step,{...p2,y:oldRoofTop()+220000}]},
    {...source,platforms:[ground,step,{...p2,x:480000}]},
    {...source,platforms:[ground,step,{...p2,x:12000}]},
    {...source,runToken:'other-run'},
    {...source,floor:8},
    {...source,player:{health:0}},
    {...source,lastGuardianCrossing:{runToken:'untrusted',
      fromFloor:8,toFloor:9,cap:{id:'f8:cap'},
      guardian:{kind:'guardian',active:false,health:0},sourceTick:475}}
  ];
  for(const bad of invalid)assert.equal(f(bad,held,base),null);
  function oldRoofTop(){return held.oldRoofY;}
  assert.equal(f(source,{...held,guardianGateRetained:false},base),null);
  assert.equal(f(source,held,{...base,nodes:[...base.nodes.slice(0,2),{...base.nodes[2],sceneY:33}]}),null);
});

test('genuinely raised upper load transfer keeps all approach-height supports behind core and outward arms overhead',async()=>{
  const THREE=require('three');
  const {plannedEarnedClockworkVoidBearings,plannedEarnedFirstRaisedRouteContinuation,
    plannedSourceEarnedSuspendedBearingSections}=await load();
  const base=plannedEarnedClockworkVoidBearings(source,held);
  const more=plannedEarnedFirstRaisedRouteContinuation(source,held,base);
  const sections=plannedSourceEarnedSuspendedBearingSections([...base.nodes,...more.nodes]);
  for(const part of sections.slice(3).flat()){
    const radius=Math.hypot(part.p[0],part.p[2]);
    if(radius>24)assert.ok(part.p[1]-part.s[1]/2>base.nodes[2].sceneY,
      'outboard steel must clear the source step where the climber jumps');
    if(part.s[1]>3 && Math.abs(part.r[2])<.001)
      assert.ok(radius<22.4 || part.p[1]-part.s[1]/2>base.nodes[2].sceneY,
        'no newly painted eye-level exterior piers');
  }
  const box=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshBasicMaterial();
  const objects=sections.slice(3).flat().map(part=>{
    const object=new THREE.Mesh(box,material);
    object.position.set(...part.p);object.rotation.set(...part.r);
    object.scale.set(...part.s);object.updateMatrixWorld(true);return object;
  });
  try{
    // Source-pinned original F9 doorway camera/shoulder from the predecessor
    // campaign, never invented as an independent full-motion quality review.
    const camera=new THREE.Vector3(12.24,3.62,40.14);
    const shoulder=new THREE.Vector3(9.273,-.872,23.312);
    const ray=new THREE.Raycaster(camera,
      shoulder.clone().sub(camera).normalize(),0,camera.distanceTo(shoulder)-.25);
    assert.equal(ray.intersectObjects(objects,false).length,0,
      'extra real p2 rear trusses must not reconstruct old portrait shoulder curtain');
  } finally {box.dispose();material.dispose();}
});

test('extended real F9 p2 gantry is World-bound at first post-guardian rebuild, never an HUD or physics replacement',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/plannedEarnedFirstRaisedRouteContinuation\(\s*snapshot,retainedEarnedCap,plan\)/);
  assert.match(world,/sourceEarnedPhysicalContinuation=!!raisedSections/);
  assert.match(world,/sections\[2\],\.\.\.raisedSections\[3\],\.\.\.raisedSections\[4\]/);
  assert.match(world,/instanced\(supportRoot,rounded\(\),material,items\)/);
  assert.ok(!/snapshot\.player\.x\s*=|snapshot\.floor\s*=\s*9/.test(world));
});
