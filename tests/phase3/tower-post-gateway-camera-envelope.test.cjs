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
