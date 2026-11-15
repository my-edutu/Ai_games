'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const physical=import('../../public/infinite-tower-climb/visuals/physical-threshold-shot.mjs');
const sightline=import('../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs');

function vector(x=0,y=0,z=0) {
  return {x,y,z,
    copy(a){this.x=a.x;this.y=a.y;this.z=a.z;return this;},
    sub(a){this.x-=a.x;this.y-=a.y;this.z-=a.z;return this;},
    length(){return Math.hypot(this.x,this.y,this.z);},
    multiplyScalar(n){this.x*=n;this.y*=n;this.z*=n;return this;}};
}
function currentFrame() {
  const source={floor:9,theme:'void',lifecycle:'running',
    runToken:'earned-old-gateway',tick:480,
    player:{health:5,halfWidth:9000,halfHeight:14000}};
  const held={floor:9,guardianGateRetained:true,
    runToken:source.runToken,sourceTick:475};
  const camera=vector(0,0,5),body=vector(0,0,0),gate=vector(1.5,0,0);
  const point=vector(),direction=vector(),hits=[],root={
    isGroup:true,visible:true,updateWorldMatrix(){}};
  const drawnMesh={isMesh:true,visible:true,parent:root,
    material:{visible:true,transparent:false,opacity:1}};
  const samples=[];
  const raycaster={near:0,far:0,set(_from,_to){},
    intersectObject(_root,_deep,results){
      samples.push({x:point.x,y:point.y,z:point.z});
      if(Math.abs(point.x)>.35 && point.y>.2 ||
         point.x>1.3 && point.y>1.1)
        results.push({object:drawnMesh});
      return results;
    }};
  return {source,held,camera,body,gate,point,direction,hits,root,
    raycaster,samples};
}

test('source-backed actual skinned shoulders and opened guardian gate lip are separately checked against real platform triangles',async()=>{
  const {measureAuthoritativeDeckSightline:measure}=await sightline;
  const setup=currentFrame();
  const initial=JSON.stringify(setup.source);
  const result=measure({...setup,bodyHalfHeight:1.4,
    platformRoots:[setup.root]});
  assert.equal(result.active,true);
  assert.ok(result.bodyBlockedRays>=1,
    'source-owned shoulder rays must detect real deck obstruction invisible to centre, helmet and soles');
  assert.ok(result.gatewayBlockedRays>=1,
    'original opened gateway upper lip must remain in the same 3D visibility objective');
  assert.ok(setup.samples.some(p=>Math.abs(p.x)>.35 && p.x<1.3),
    'must sample the true skinned width, not invent future travel');
  assert.ok(setup.samples.some(p=>p.x===1.5 && p.y>1),
    'must sample the actual retained gate lip');
  assert.ok(result.rays<=9,'seven body and two gate samples; no unbounded camera rays');
  assert.equal(JSON.stringify(setup.source),initial,'presentation cannot change authoritative state');
});

test('camera search escalates in 3D and only for observed source-blocking body or gate rays in BOTH viewports',async()=>{
  const {sourceDeckGatewayClearanceCandidates:plan}=await physical;
  const bodyBlocked={active:true,bodyBlockedRays:2,gatewayBlockedRays:0};
  const gateBlocked={active:true,bodyBlockedRays:0,gatewayBlockedRays:1};
  for(const aspect of [960/600,390/844]){
    const candidates=plan(aspect,bodyBlocked), gatePlan=plan(aspect,gateBlocked);
    assert.equal(candidates.length,8);
    assert.strictEqual(candidates,gatePlan,'either authentic subject can require the same bounded clearance');
    assert.ok(candidates.some(([yaw,y,r])=>Math.abs(yaw)>.10 && y>2.5 && r>3),
      'a nearly frontal 2-degree camera nudge is insufficient around true structural posts');
    assert.ok(candidates.every(([yaw,y,r])=>
      Math.abs(yaw)<=.25 && Math.abs(y)<=4.1 && r<=6.6),
      'do not make an unbounded cinematic teleport');
    assert.ok(Object.isFrozen(candidates));
  }
  for(const witness of [null,{active:false,bodyBlockedRays:2,gatewayBlockedRays:1},
    {active:true,bodyBlockedRays:0,gatewayBlockedRays:0},
    {active:true,bodyBlockedRays:NaN,gatewayBlockedRays:1}])
    assert.equal(plan(390/844,witness),null);
  assert.equal(plan(10,bodyBlocked),null);
});

test('composed game camera never trades a visible full-body climber for a prettier doorway',()=>{
  const text=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(text,/sourceDeckGatewayClearanceCandidates\(\s*camera\.aspect,existingDeckView\)/);
  assert.match(text,/existingDeckView\?\.active && existingDeckView\.score>0/);
  assert.match(text,/candidate\.bodyBlockedRays<=existingDeckView\.bodyBlockedRays/);
  assert.match(text,/candidate\.gatewayBlockedRays<=existingDeckView\.gatewayBlockedRays/);
  assert.match(text,/bestScore===0\)break/);
  assert.ok(text.indexOf('    // FIRST SUCCESSOR-DECK PHYSICAL CAMERA OCCLUSION:') <
    text.indexOf('    // POST-DIRECTOR PHYSICAL CROSSING:'));
  assert.doesNotMatch(text,/snapshot\.player\.(?:x|y)\s*=/);
});
