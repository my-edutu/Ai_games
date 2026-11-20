const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const url=pathToFileURL(resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/original-gateway-camera-ray-contract.mjs')).href;
const sample=()=>({
  deckView:{active:true,score:0,bodyBlockedRays:0,gatewayBlockedRays:0},
  steel:{sourceBound:true,projectedMetalArea:.028,projectedPanes:4},
  heroNdc:[.32,-.07,.97,.15],
  gateNdc:[-.10,.06,.97,.10],
  walkableNdc:[.1,-.30,.97]
});
test('safe original-gateway three-subject lens avoids a second expensive 3D orbit',async()=>{
  const {sourceGatewayNeedsExpensiveOpticalSearch:needs}=await import(url);
  assert.equal(needs(sample()),false);
});
test('cropped, collapsed, small, source-less, or missing real roof forces full camera search',async()=>{
  const {sourceGatewayNeedsExpensiveOpticalSearch:needs}=await import(url);
  const s=sample();
  assert.equal(needs({}),true);
  assert.equal(needs({...s,walkableNdc:null}),true);
  assert.equal(needs({...s,heroNdc:[.92,0,.97,.15]}),true);
  assert.equal(needs({...s,heroNdc:[-.05,.07,.97,.15]}),true);
  assert.equal(needs({...s,heroNdc:[.32,-.07,.97,.03]}),true);
  assert.equal(needs({...s,gateNdc:[-.10,.06,.97,.025]}),true);
  assert.equal(needs({...s,steel:{...s.steel,projectedMetalArea:.006}}),true);
  assert.equal(needs({...s,steel:null}),true);
});
test('any real platform / gateway triangle blocker preserves all physical rescue trials',async()=>{
  const {sourceGatewayNeedsExpensiveOpticalSearch:needs}=await import(url);
  const s=sample();
  for(const deckView of [
    null,{...s.deckView,score:1,bodyBlockedRays:1},
    {...s.deckView,score:2,gatewayBlockedRays:1},
    {...s.deckView,active:false},
    {...s.deckView,score:NaN},
  ]) assert.equal(needs({...s,deckView}),true);
});
