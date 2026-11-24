const {test}=require('node:test');
const fixtures=[
  {
    "previousCamera": [
      37.6595,
      27.3276,
      49.6965
    ],
    "previousFocus": [
      -1.3485,
      18.5823,
      23.8369
    ],
    "desiredCamera": [
      25.6188,
      26.1787,
      47.7876
    ],
    "desiredFocus": [
      -3.9681,
      18.9128,
      23.9544
    ],
    "heroMovement": 2.2913,
    "previousTick": 580,
    "tick": 582,
    "dt": 0.1333
  },
  {
    "previousCamera": [
      -12.5779,
      35.1157,
      52.9639
    ],
    "previousFocus": [
      6.7409,
      28.5589,
      24.6347
    ],
    "desiredCamera": [
      -5.69,
      34.8191,
      52.1946
    ],
    "desiredFocus": [
      7.029,
      29.4169,
      24.437
    ],
    "heroMovement": 0.289,
    "previousTick": 618,
    "tick": 620,
    "dt": 0.0667
  },
  {
    "previousCamera": [
      -2.207,
      36.0941,
      52.1604
    ],
    "previousFocus": [
      6.1518,
      31.0972,
      24.6326
    ],
    "desiredCamera": [
      3.239,
      36.4902,
      52.0624
    ],
    "desiredFocus": [
      6.0106,
      31.3657,
      24.6611
    ],
    "heroMovement": 0.0088,
    "previousTick": 622,
    "tick": 622,
    "dt": 0.0334
  },
  {
    "previousCamera": [
      9.5218,
      23.4114,
      44.7929
    ],
    "previousFocus": [
      -1.9456,
      18.723,
      23.5576
    ],
    "desiredCamera": [
      -0.3933,
      23.2285,
      45.4874
    ],
    "desiredFocus": [
      -5.5231,
      18.8878,
      23.7327
    ],
    "heroMovement": 4.636,
    "previousTick": 579,
    "tick": 583,
    "dt": 0.2
  }
];
function verify(envelope,valid,fixtures){
  const assert=(condition,label)=>{if(!condition)throw new Error(label);};
  const receipt={runToken:'2f1206a5',oldCapId:'f8:cap',crossingTick:475,returnedTick:520};
  const results=[];
  for(const f of fixtures){
    const source={floor:9,theme:'void',lifecycle:'running',player:{health:4},runToken:receipt.runToken,tick:f.tick};
    const input={...f,source,receipt,lastRendered:{floor:9,runToken:source.runToken,tick:f.previousTick},cameraMode:'follow',stale:false,reducedMotion:false,orbit:0,zoom:1};
    const r=envelope(input);assert(r&&r.boundedMovement<=r.budget+1e-8&&r.boundedMovement<r.requestedMovement,'bounded recorded move');
    assert(Math.hypot(r.camera[0],r.camera[2])>=23.5,'exterior arc');
    for(const invalid of [{stale:true},{reducedMotion:true},{orbit:.1},{zoom:1.5},{cameraMode:'overview'},{receipt:null},{source:{...source,runToken:'restart'}},{source:{...source,tick:700}},{lastRendered:{...input.lastRendered,tick:f.tick+1}}])assert(envelope({...input,...invalid})===null,'invalid proposal');
    assert(envelope({...input,desiredCamera:f.previousCamera})===null,'ordinary tracking unchanged');
    assert(!valid(source,{...receipt,returnedTick:f.tick+1}),'future receipt rejected');
    results.push({ticks:[f.previousTick,f.tick],requested:+r.requestedMovement.toFixed(4),bounded:+r.boundedMovement.toFixed(4),budget:+r.budget.toFixed(4)});
  }
  return results;
}
test('recorded post-retirement camera cuts use a single bounded exterior envelope',async()=>{
  const {sourcePostGatewayCameraEnvelope,validRetiredGatewayCameraReceipt}=await import('../../public/infinite-tower-climb/visuals/post-gateway-camera-envelope.mjs');
  verify(sourcePostGatewayCameraEnvelope,validRetiredGatewayCameraReceipt,fixtures);
});

test('retained and retired first F9 camera share route-aware exterior policy without borrowing an old owner',async()=>{
 const {sourceFloorNineTraversalPlan,validRetainedTraversalCameraReceipt}=await import('../../public/infinite-tower-climb/visuals/post-gateway-camera-envelope.mjs');
 verifyTraversal(sourceFloorNineTraversalPlan,validRetainedTraversalCameraReceipt);
});
function verifyTraversal(plan,valid){
 const assert=(condition,label)=>{if(!condition)throw new Error(label);};
 const cap={id:'f8:cap',x:0,y:100,width:100,height:20};
 const receipt={owner:'retained',runToken:'actual-run',oldCapId:cap.id,crossingTick:475,returnedTick:520,thresholdX:76,oldRoofY:120,oldCapX:0,oldCapWidth:100};
 const crossing={runToken:receipt.runToken,fromFloor:8,toFloor:9,sourceTick:475,exitX:76,crossingX:78,halfWidth:2,halfHeight:4,cap,guardian:{kind:'guardian',active:false,health:0}};
 const cases=[
  {ticks:[521,533],camera:[14.9696,7.8005,43.7898],desired:[17.8762,17.5226,41.1341],hero:7.7038,dt:.3378},
  {ticks:[555,568],camera:[17.4379,15.8231,40.3537],desired:[11.1265,17.4606,43.0156],hero:4.5787,dt:.1768},
  {ticks:[570,576],camera:[10.0346,17.7936,43.3701],desired:[13.5874,23.6587,42.4063],hero:7.616,dt:.3157}
 ];
 const result=[];
 for(const c of cases){
  // Exact returned camera endpoints; focus, route geometry and source
  // receipt are explicit synthetic policy context, not a runtime replay.
  const source={floor:9,theme:'void',lifecycle:'running',player:{health:4,halfWidth:2,halfHeight:4},runToken:receipt.runToken,tick:c.ticks[1],lastGuardianCrossing:crossing,platforms:[{id:'f9:ground',x:0,width:200,y:100,height:20}]};
  const input={source,receipt:{...receipt,returnedTick:c.ticks[0]},lastRendered:{floor:9,runToken:source.runToken,tick:c.ticks[0]},previousCamera:c.camera,desiredCamera:c.desired,previousFocus:[8,8,24],desiredFocus:[8,12,24],body:[8,9,24],landing:[9,13,24],heroMovement:c.hero,dt:c.dt,cameraMode:'follow',stale:false,reducedMotion:false,orbit:0,zoom:1,routeMissing:true};
  assert(valid(source,input.receipt),'retained source receipt');
  const r=plan(input);assert(r?.owner==='retained'&&r.cut&&r.candidates[0]?.kind==='route-lead','retained cut selects anticipatory route');
  for(const candidate of r.candidates){
   const travel=Math.hypot(...candidate.camera.map((v,i)=>v-c.camera[i]));
   assert(travel<=r.budget+1e-8&&Math.hypot(candidate.camera[0],candidate.camera[2])>=23.5,'bounded exterior shot');
  }
  for(const invalid of [{receipt:{...input.receipt,runToken:'old'}},{receipt:{...input.receipt,returnedTick:source.tick+1}},{source:{...source,lastGuardianCrossing:{...crossing,guardian:{...crossing.guardian,health:1}}}},{source:{...source,tick:700}},{reducedMotion:true},{cameraMode:'overview'},{stale:true},{orbit:.1}])assert(plan({...input,...invalid})===null,'reject invalid authority or manual/reduced motion');
  const proactive=plan({...input,desiredCamera:c.camera});assert(proactive&&!proactive.cut&&proactive.candidates[0].kind==='route-lead','prepare real landing before a cut');
  assert(plan({...input,desiredCamera:c.camera,routeMissing:false})===null,'leave ordinary tracking alone');
  const retired=plan({...input,receipt:{runToken:source.runToken,oldCapId:'f8:cap',crossingTick:475,returnedTick:520}});
  assert(retired?.owner==='retired','retirement retains route policy');
  const historical={...input,source:{...source,lastGuardianCrossing:null},receipt:{...input.receipt,crossingProof:crossing}};
  assert(plan(historical)?.owner==='retained','same returned owner can outlive publication of crossing event');
  assert(plan({...historical,receipt:{...historical.receipt,crossingProof:null}})===null,'missing prior proof not inferred');
  assert(plan({...historical,source:{...source,lastGuardianCrossing:{...crossing,guardian:{...crossing.guardian,health:1}}}})===null,'conflicting live record cannot use historical receipt');
  result.push({ticks:c.ticks,requested:+r.requestedMovement.toFixed(4),budget:+r.budget.toFixed(4),candidates:r.candidates.map(x=>({kind:x.kind,metres:+Math.hypot(...x.camera.map((v,i)=>v-c.camera[i])).toFixed(4)}))});
 }
 return result;
}

test('portrait traversal anticipates optical pressure without unbounded lens or ratchet',async()=>{
 const {sourceTraversalOpticalFrame}=await import('../../public/infinite-tower-climb/visuals/post-gateway-camera-envelope.mjs');
 verifyRouteOptics(sourceTraversalOpticalFrame);
});
function verifyRouteOptics(frame){
 const assert=(condition,label)=>{if(!condition)throw new Error(label);};
 const base={aspect:390/844,currentFov:42,previousFov:42,dt:.06,
   points:[[-.45,.3,.8],[-.48,-.3,.8],[.92,.32,.8]]};
 const a=frame(base);
 assert(a.needsPreparation&&a.target>42&&a.fov>42&&a.fov<=43.2,'prepare with bounded lens');
 const scaled=base.points.map(p=>[p[0]*Math.tan(42*Math.PI/360)/Math.tan(50*Math.PI/360),p[1]*Math.tan(42*Math.PI/360)/Math.tan(50*Math.PI/360),p[2]]);
 const b=frame({...base,currentFov:50,previousFov:50,points:scaled});
 assert(Math.abs(a.target-b.target)<1e-8,'same actual route pressure cannot ratchet');
 const ordinary=frame({...base,previousFov:50,points:[[.1,.1,.8],[.2,-.2,.8],[.3,.3,.8]]});
 assert(ordinary.target===42&&ordinary.fov<50&&ordinary.fov>=48.8,'bounded restore');
 for(const invalid of [{aspect:1.6},{previousFov:null},{dt:0},{points:[[0,0,2],[0,0,0],[0,0,0]]}])
   assert(frame({...base,...invalid})===null,'reject invalid/depth/desktop inputs');
 return {target:a.target,firstStep:a.fov,restored:ordinary.fov};
}
