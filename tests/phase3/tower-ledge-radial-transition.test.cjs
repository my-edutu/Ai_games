'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {createSession,advance}=require('../../scripts/serve-tower-stream.cjs');
const scene=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
function shipped(name,args){
  const match=scene.match(new RegExp('^function '+name+'\\('+args+'\\) \\{[\\s\\S]*?^\\}','m'));
  assert.ok(match,'require actual '+name+' production implementation');
  return vm.runInNewContext(match[0]+'\n'+name);
}
const landing=shipped('intendedLanding','snapshot');
const approach=shipped('climbApproachRadius','snapshot, platform');
const frameSeries=()=>{
  const session=createSession(),observations=[];
  for(let i=0;i<320;i++){
    const frame=session.controller.frame(390,844,{reducedMotion:true,muted:true});
    const snap=frame.snapshot;
    if(snap.tick>=296 && snap.tick<=318){
      const target=landing(snap);
      observations.push({tick:snap.tick,checksum:snap.publicChecksum,
        state:snap.player.state,vy:snap.player.vy,platform:target?.id||null,
        radius:approach(snap,target)});
    }
    advance(session);
  }
  return observations;
};
test('authentic upper-rim crossing retracts the visual root into the genuine walking-band after helmet clearance',()=>{
  const entries=frameSeries(),byTick=new Map(entries.map(o=>[o.tick,o]));
  assert.equal(byTick.get(298).checksum,'13941b9e','pin the same real first ledge contact as G40 GPU evidence');
  for(let t=300;t<=308;t++){
    assert.equal(byTick.get(t).state,'airborne');
    assert.equal(byTick.get(t).platform,'f1:p1');
  }
  // At real tick 298 the helmet still intersects deck height: keep the
  // body beyond the physical 27.18 rim while the fingertip holds it.
  assert.ok(byTick.get(298).radius>27.95,'actual gripped crown must not enter opaque stone');
  // At tick 300 the player's true *soles* meet that slab's collision top,
  // but the old radius 28.05 keeps BOTH boots suspended beyond its edge.
  // Bring the rig root inside the actual 22.4..27.18 walking band only as soles
  // clear its height, then push off again at tick 301. An actual posed toe
  // still requires GPU contact review; radius alone proves only placement.
  assert.ok(byTick.get(299).radius>27.2 && byTick.get(299).radius<28.04,
    'start weight transfer only after the real fingertip has cleared');
  assert.ok(byTick.get(300).radius>=26.95 && byTick.get(300).radius<=27.18,
    'true tick-300 visual root must enter the source-derived upper deck band');
  assert.ok(byTick.get(301).radius<byTick.get(300).radius,
    'free-leap extension should move off the rim toward the inside lane');
  const lengths=[];
  for(let t=299;t<=308;t++) lengths.push(Math.abs(byTick.get(t).radius-byTick.get(t-1).radius));
  assert.ok(Math.max(...lengths)<.85,'no >.85-world-unit one-tick radial snap through actual transition: '+lengths.join(','));
  for(let t=299;t<=308;t++)assert.ok(byTick.get(t).radius <= byTick.get(t-1).radius+1e-8,
    'release should travel inward progressively while still airborne');
  assert.ok(byTick.get(303).radius>25.3&&byTick.get(303).radius<27.5,'middle of mantle must actually interpolate');
  assert.ok(Math.abs(byTick.get(308).radius-25)<.001,'reach the true 25-radius lane before descent');
  assert.equal(byTick.get(318).radius,25,'land at the existing authoritative walking lane');
});
test('release is driven only by immutable actual target height and remains bounded off-route',()=>{
  const platform={id:'p',x:110000,y:415000,height:5000,width:40000};
  const player={x:130000,y:434000,halfHeight:14000,halfWidth:9000,vy:10200,
    state:'airborne',health:5,attacking:false};
  const snapshot={player}; const before=JSON.stringify({snapshot,platform});
  const atGrip=approach({player:{...player,y:412400}},platform);
  const atPlant=approach(snapshot,platform);
  const part=approach({player:{...player,y:452000}},platform);
  const clear=approach({player:{...player,y:472400}},platform);
  assert.ok(atGrip>27.95&&part>25&&part<atPlant,
    'release moves from outside the gripped rim, onto the deck and inward before clearing');
  assert.ok(atPlant>=26.95&&atPlant<=27.18,
    'at real collision-height crossing the displayed root overlaps solid deck radial band');
  assert.equal(clear,25,'fully clear the platform before the return to normal walking lane');
  assert.equal(approach({player:{...player,state:'standing'}},platform),25);
  assert.equal(approach({player:{...player,vy:-1000}},platform),25);
  assert.equal(approach({player:{...player,x:500000}},platform),25);
  assert.equal(approach({player:{...player,attacking:true}},platform),25);
  assert.equal(JSON.stringify({snapshot,platform}),before,'must not mutate authority or platform geometry');
});

test('authentic upper-deck ascent receives a bounded source-derived mantle keyframe, never a phantom grip',()=>{
  const mantle=shipped('ledgeMantlePose','snapshot, platform');
  const session=createSession(),sample=new Map();
  for(let i=0;i<=310;i++){
    const frame=session.controller.frame(390,844,{reducedMotion:true,muted:true});
    const snapshot=frame.snapshot, before=JSON.stringify(snapshot);
    if(snapshot.tick>=296 && snapshot.tick<=310){
      const target=landing(snapshot);
      sample.set(snapshot.tick,{pose:mantle(snapshot,target),state:snapshot.player.state,
        vy:snapshot.player.vy,checksum:snapshot.publicChecksum});
      assert.equal(JSON.stringify(snapshot),before,'keyframe selection cannot alter authority');
    }
    advance(session);
  }
  assert.equal(sample.get(298).checksum,'13941b9e','same authentic G41 GPU contact');
  assert.equal(sample.get(296).pose,null,'standing before takeoff has no mantle');
  assert.ok(sample.get(299).pose?.weight>.6,'launch must show a push from the real deck');
  assert.ok(sample.get(301).pose?.progress>sample.get(299).pose?.progress,'pose progression follows real clearance');
  assert.ok(sample.get(302).pose?.weight>.9,'upper-deck transition should stay visible, not float with idle airborne legs');
  assert.ok(sample.get(306).pose?.weight<sample.get(302).pose?.weight,'pose must release gradually after clear');
  assert.equal(sample.get(310).pose,null,'falling jump cannot claim an ascending mantle');
  const p={x:130000,y:434000,halfHeight:14000,halfWidth:9000,vy:10200,health:5,state:'airborne',attacking:false};
  const deck={id:'f1:p1',x:120000,y:415000,height:5000,width:40000};
  const valid=mantle({player:p},deck);
  assert.ok(valid&&valid.progress>=0&&valid.progress<=1&&valid.weight>0&&valid.weight<=1);
  for(const change of [{state:'standing'},{vy:-1},{attacking:true},{health:0},{x:1000}]){
    assert.equal(mantle({player:{...p,...change}},deck),null,'ineligible snapshots cannot manufacture a mantle');
  }
  assert.equal(mantle({player:p},null),null);
});
