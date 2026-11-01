'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const cast=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/characters.mjs'),'utf8');
function shippedFunction(source,name,signature){
  const match=source.match(new RegExp('^function '+name+'\\('+signature+'\\) \\{[\\s\\S]*?^\\}','m'));
  assert.ok(match,'actual shipped source must contain '+name);
  return vm.runInNewContext(match[0]+'\n'+name);
}
const ledgeContactPoint=shippedFunction(scene,'ledgeContactPoint','snapshot, platform');
const solveLedgeReach=shippedFunction(cast,'solveLedgeReach','shoulder, tip');
const player={x:120000,y:200000,halfHeight:14000,halfWidth:9000,facing:1,vy:6000,health:5,state:'airborne',attacking:false};
const deck={id:'real-platform',x:123000,y:206000,width:40000,height:0};
test('only a rising live climber near a real platform receives a ledge point',()=>{
  const target=ledgeContactPoint({player},deck);
  assert.deepEqual([target.x,target.y],[125850,206000]);
  for(const override of [{state:'standing'},{vy:-1},{health:0},{attacking:true}]){
    assert.equal(ledgeContactPoint({player:{...player,...override}},deck),null);
  }
  assert.equal(ledgeContactPoint({player},{...deck,x:300000}),null);
  assert.equal(ledgeContactPoint({player},{...deck,y:280000}),null);
  assert.equal(ledgeContactPoint({player},{...deck,width:0}),null);
  assert.equal(ledgeContactPoint({player},{...deck,x:NaN}),null);
});
test('contact follows tick-adjusted deck coordinates, not a fabricated fixed ledge',()=>{
  const before=ledgeContactPoint({player},deck);
  const after=ledgeContactPoint({player},{...deck,x:127000,y:207000});
  assert.ok(after && before && after.x!==before.x && after.y!==before.y);
  assert.equal(player.x,120000);
  assert.equal(deck.y,206000);
});
test('analytic two-link solution preserves actual arm and fingertip lengths',()=>{
  const shoulder={x:.66,y:1.79,z:0},tip={x:.56,y:2.33,z:.22};
  const solved=solveLedgeReach(shoulder,tip);
  assert.ok(solved);
  assert.ok(Math.abs(Math.hypot(solved.elbow.x-shoulder.x,solved.elbow.y-shoulder.y,solved.elbow.z-shoulder.z)-.38)<1e-8);
  assert.ok(Math.abs(Math.hypot(solved.elbow.x-tip.x,solved.elbow.y-tip.y,solved.elbow.z-tip.z)-Math.hypot(.802,.108))<1e-8);
  assert.equal(solveLedgeReach(shoulder,{x:5,y:5,z:5}),null);
  assert.equal(solveLedgeReach(shoulder,{x:.66,y:.2,z:0}),null);
});
test('real scene passes source-truth deck top into character bones without new authority',()=>{
  assert.match(scene,/const ledgeContact = ledgeContactPoint\(snapshot, targetPlatform\)/);
  // G37 hoists the same real platform point so both the rig and contact
  // diagnostic read exactly one immutable target; test the mapping and its use.
  assert.match(scene,/const ledgeTarget = ledgeContact \? pointFor\(ledgeContact\.x, ledgeContact\.y,/);
  assert.match(scene,/\n\s+ledgeTarget,\n/);
  assert.match(cast,/body\.worldToLocal\(ledgeWorld\)/);
  assert.match(cast,/arm\.lower\.quaternion\.setFromUnitVectors\(fingertipRest,ledgeAim\)/);
});
test('real Three rig fingertip aligns with deck target without root movement',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/, "from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [api,THREE]=await Promise.all([import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)]);
  const rig=api.createClimber();t.after(()=>rig.dispose());
  rig.group.position.set(3,7,-4);rig.group.rotation.y=.35;rig.group.scale.setScalar(1.13);
  rig.group.updateMatrixWorld(true);
  const destination=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  const rootBefore=[...rig.group.position,...rig.group.quaternion,...rig.group.scale];
  const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false,ledgeTarget:{x:destination.x,y:destination.y,z:destination.z}};
  rig.animate(air,1/60,1.0,{reducedMotion:true});
  const rightElbow=rig.group.getObjectByName('1-elbow');
  assert.ok(rightElbow?.isBone);
  rightElbow.updateWorldMatrix(true,false);
  const fingertip=rightElbow.localToWorld(new THREE.Vector3(0,-.802,.108));
  assert.ok(fingertip.distanceTo(destination)<1e-5,'fingertip aligns with actual platform target');
  assert.deepEqual([...rig.group.position,...rig.group.quaternion,...rig.group.scale],rootBefore,'root authority unchanged');
  rig.animate({...air,ledgeTarget:null},1/60,1.2,{reducedMotion:true});
  rightElbow.updateWorldMatrix(true,false);
  const released=rightElbow.localToWorld(new THREE.Vector3(0,-.802,.108));
  assert.ok(released.distanceTo(destination)>.01,'no phantom grip after target disappears');
});

test('approaching the authentic one-way ledge moves only the visual climber outside the solid deck',()=>{
  // Deliberately uses the shipped scene helper, not an independently reimplemented formula.
  const approach=shippedFunction(scene,'climbApproachRadius','snapshot, platform');
  const immutable=JSON.stringify({player,deck});
  const radius=approach({player},deck);
  assert.ok(radius>=27.95 && radius<=28.2,
    'ascent helmet/body must stay beyond the 27.18-radius solid outer deck before reaching');
  assert.equal(approach({player:{...player,y:150000}},deck),25,'distant approach must not displace visuals');
  assert.equal(approach({player:{...player,state:'standing'}},deck),25,'landed feet stay at authoritative lane');
  assert.equal(approach({player:{...player,vy:-100}},deck),25,'falling path unchanged');
  assert.equal(approach({player:{...player,attacking:true}},deck),25,'attacks cannot fake ledge approach');
  assert.equal(approach({player},{...deck,x:300000}),25,'other platform never moves the hero');
  assert.equal(approach({player},null),25,'missing destination leaves the hero alone');
  assert.equal(JSON.stringify({player,deck}),immutable,'presentation may not mutate snapshot objects');
});
test('near-ledge scene uses the exterior radial corridor and real outer lip as the reach target',()=>{
  assert.match(scene,/const approachRadius = climbApproachRadius\(snapshot, targetPlatform\)/);
  assert.match(scene,/pointFor\(p\.x, p\.y - p\.halfHeight, snapshot\.chunkBaseY, snapshot\.worldWidth, approachRadius\)/);
  assert.match(scene,/const ledgeTarget = ledgeContact \? pointFor\(ledgeContact\.x, ledgeContact\.y,\s*snapshot\.chunkBaseY, snapshot\.worldWidth, 27\.1/);
});

test('real ledge grip curls both boots clear of the lower deck, then releases the pose',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'", "from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [api,THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),
    import(threeURL)
  ]);
  const rig=api.createClimber(); t.after(()=>rig.dispose());
  rig.group.position.set(3,7,-4);rig.group.rotation.y=.35;rig.group.scale.setScalar(1.13);
  rig.group.updateMatrixWorld(true);
  const target=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false};
  const view={reducedMotion:true};
  const ankleHeight=()=>{
    rig.group.updateMatrixWorld(true);
    return Math.min(...[-1,1].map(side=>{
      const ankle=rig.group.getObjectByName(side+'-ankle');
      assert.ok(ankle?.isBone,'actual animated boot joint must exist');
      return ankle.getWorldPosition(new THREE.Vector3()).y;
    }));
  };
  for(let i=0;i<16;i++)rig.animate({...air,ledgeTarget:null},1/60,i/60,view);
  const unsupported=ankleHeight();
  for(let i=0;i<16;i++)rig.animate({...air,ledgeTarget:target},1/60,(i+16)/60,view);
  const gripping=ankleHeight();
  assert.ok(gripping-unsupported>.12,
    'during authentic hand contact both ankle joints must lift clear of the lower deck');
  const elbow=rig.group.getObjectByName('1-elbow');
  elbow.updateWorldMatrix(true,false);
  assert.ok(elbow.localToWorld(new THREE.Vector3(0,-.802,.108)).distanceTo(target)<1e-5,
    'boot motion must not break authentic fingertip contact');
  for(let i=0;i<24;i++)rig.animate({...air,ledgeTarget:null},1/60,(i+32)/60,view);
  assert.ok(Math.abs(ankleHeight()-unsupported)<.05,
    'released hand contact must restore the ordinary airborne leg silhouette');
});

test('shipped skinned climber visibly pushes over a genuine ledge and restores ordinary air motion',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)
  ]);
  const rig=createClimber();t.after(()=>rig.dispose());
  const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false};
  const options={reducedMotion:true};
  rig.animate(air,1/60,1,options);
  const body=rig.group.getObjectByName('articulated-body');
  const knee=rig.group.getObjectByName('-1-knee');
  assert.ok(body?.isBone&&knee?.isBone,'test the actual skinned body and leg bones');
  const neutral={body:body.rotation.x,knee:knee.rotation.x},root=rig.group.position.clone();
  rig.animate({...air,ledgeMantle:{progress:.68,weight:1}},1/60,1.017,options);
  assert.ok(body.rotation.x>neutral.body+.18,'torso must lean into a visibly distinct deck-vault pose');
  assert.ok(Math.abs(knee.rotation.x-neutral.knee)>.12,'knee must contribute to deck push instead of idling airborne');
  assert.ok(rig.group.position.equals(root),'animation cannot move authoritative root');
  rig.animate({...air,ledgeMantle:null},1/60,1.034,options);
  assert.ok(Math.abs(body.rotation.x-neutral.body)<1e-5,'unsupported mantle must release without a phantom hold');
  assert.ok(Math.abs(knee.rotation.x-neutral.knee)<1e-5,'boots restore normal airborne articulation');
  rig.group.position.set(3,7,-4);rig.group.rotation.y=.35;rig.group.scale.setScalar(1.13);
  rig.group.updateMatrixWorld(true);
  const goal=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  rig.animate({...air,ledgeTarget:{x:goal.x,y:goal.y,z:goal.z},
    ledgeMantle:{progress:.04,weight:.45}},1/60,1.05,options);
  const elbow=rig.group.getObjectByName('1-elbow');
  elbow.updateWorldMatrix(true,false);
  const fingertip=elbow.localToWorld(new THREE.Vector3(0,-.802,.108));
  assert.ok(fingertip.distanceTo(goal)<1e-5,'new body pose cannot break the real initial hand contact');
});

test('real fingertip IK is invariant under opposite oblique camera reach choice during a mantle',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)
  ]);
  const rig=createClimber();t.after(()=>rig.dispose());
  rig.group.position.set(3,7,-4);rig.group.rotation.y=.35;rig.group.scale.setScalar(1.13);
  rig.group.updateMatrixWorld(true);
  const goal=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false,
    ledgeTarget:{x:goal.x,y:goal.y,z:goal.z},
    ledgeMantle:{progress:.04,weight:.45}};
  for(const viewAzimuth of [-Math.PI/4,Math.PI/4]){
    rig.animate(air,1/60,1.1,{reducedMotion:true,viewAzimuth});
    const elbow=rig.group.getObjectByName('1-elbow');
    elbow.updateWorldMatrix(true,false);
    const actual=elbow.localToWorld(new THREE.Vector3(0,-.802,.108));
    assert.ok(actual.distanceTo(goal)<1e-5,
      'camera-facing reach selection cannot break a true IK grip at azimuth '+viewAzimuth);
  }
});

test('authentic fingertip contact keeps the curled boot silhouette when a mantle cue overlaps',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)
  ]);
  const gripped=createClimber(),overlapped=createClimber();
  t.after(()=>{gripped.dispose();overlapped.dispose();});
  const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false};
  const options={reducedMotion:true,viewAzimuth:-Math.PI/4};
  for(const rig of [gripped,overlapped]){
    rig.group.position.set(3,7,-4);
    rig.group.rotation.y=.35;
    rig.group.scale.setScalar(1.13);
    rig.group.updateMatrixWorld(true);
  }
  const goal=gripped.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  const ledgeTarget={x:goal.x,y:goal.y,z:goal.z};
  for(let i=0;i<16;i++){
    gripped.animate({...air,ledgeTarget},1/60,(i+1)/60,options);
    overlapped.animate({...air,ledgeTarget,ledgeMantle:{progress:.05,weight:.9}},1/60,(i+1)/60,options);
  }
  for(const side of [-1,1]){
    const joint=side+'-knee';
    const untouched=gripped.group.getObjectByName(joint),cuing=overlapped.group.getObjectByName(joint);
    assert.ok(untouched?.isBone&&cuing?.isBone,'real lower-leg joints are required');
    assert.ok(Math.abs(untouched.rotation.x-cuing.rotation.x)<1e-6,
      'a cosmetic mantle hint must not uncurl a boot while the hand is truly gripping: '+joint);
  }
  const elbow=overlapped.group.getObjectByName('1-elbow');
  elbow.updateWorldMatrix(true,false);
  assert.ok(elbow.localToWorld(new THREE.Vector3(0,-.802,.108)).distanceTo(goal)<1e-5,
    'protect the measured real fingertip contact as well as the knees');
});

test('real upper-rim fingertip releases into a continuous shoulder arc, then relinquishes the hold',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)
  ]);
  // The G42 exact-tick screenshot has authentic fingertip contact at 298,
  // followed by an *airborne* release at 299; a camera-facing mantle arm must
  // not teleport the real gripping forearm between those adjacent states.
  for(const viewAzimuth of [Math.PI/4,-Math.PI/4]){
    const rig=createClimber(),neutral=createClimber();
    t.after(()=>{rig.dispose();neutral.dispose();});
    for(const r of [rig,neutral]){
      r.group.position.set(3,7,-4);r.group.rotation.y=.35;r.group.scale.setScalar(1.13);
      r.group.updateMatrixWorld(true);
    }
    const goal=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
    const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false,
      runToken:'real-ledger-run',ledgePlatformId:'f1:p1'};
    const options={reducedMotion:true,viewAzimuth};
    const held={...air,tick:298,ledgeTarget:{x:goal.x,y:goal.y,z:goal.z},
      ledgeMantle:{progress:.21,weight:1}};
    rig.animate(held,1/60,1,options);
    const elbow=rig.group.getObjectByName('1-elbow'),upper=elbow?.parent;
    assert.ok(elbow?.isBone&&upper?.isBone,'compare the actual gripping arm bones');
    elbow.updateWorldMatrix(true,false);
    assert.ok(elbow.localToWorld(new THREE.Vector3(0,-.802,.108)).distanceTo(goal)<1e-5,
      'first-frame true deck contact must still be exact');
    const gripUpper=upper.quaternion.clone(),gripForearm=elbow.quaternion.clone();
    const root=rig.group.position.clone();
    const released={...air,tick:299,ledgeTarget:null,ledgeMantle:{progress:.34,weight:1}};
    rig.animate(released,1/60,1+1/60,options);
    assert.ok(upper.quaternion.angleTo(gripUpper)<.27,
      'first contact-to-flight tick must not snap the gripping shoulder: '+viewAzimuth);
    assert.ok(elbow.quaternion.angleTo(gripForearm)<.27,
      'first contact-to-flight tick must not snap the gripping forearm: '+viewAzimuth);
    assert.ok(rig.group.position.equals(root),'only pose may transition, never authoritative root');
    const clear={...air,tick:303,ledgeTarget:null,ledgeMantle:{progress:.88,weight:1}};
    rig.animate(clear,1/60,1+5/60,options);
    neutral.animate(clear,1/60,1+5/60,options);
    const recovered=rig.group.getObjectByName('1-elbow'),reference=neutral.group.getObjectByName('1-elbow');
    assert.ok(recovered.parent.quaternion.angleTo(reference.parent.quaternion)<1e-5,
      'arm must fully return to the source-defined free-flight mantle after clearance');
    assert.ok(recovered.quaternion.angleTo(reference.quaternion)<1e-5,
      'forearm must fully return to the source-defined free-flight mantle');
    // A renderer still showing an old grip must never attach it to a new run.
    rig.animate(held,1/60,2,options);
    const newRun={...released,runToken:'different-run'};
    rig.animate(newRun,1/60,2+1/60,options);
    neutral.animate(newRun,1/60,2+1/60,options);
    assert.ok(rig.group.getObjectByName('1-elbow').parent.quaternion.angleTo(
      neutral.group.getObjectByName('1-elbow').parent.quaternion)<1e-5,
      'stale hand contact must not survive an authoritative run-token change');
  }
});

test('actual ascent boots keep one physical push-off leg when camera crosses the tower',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber}]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64'))
  ]);
  // Same immutable authority, only follow-camera azimuth changes. A real boot
  // must not jump from the push-off side to the other side of the body merely
  // because a portrait camera moves behind the climber.
  for(const facing of [-1,1]){
    for(const pose of [null,{progress:.58,weight:1},{progress:.78,weight:1}]){
      const a=createClimber(),b=createClimber();
      t.after(()=>{a.dispose();b.dispose();});
      const state={state:'airborne',vx:facing*3200,vy:10200,facing,health:5,
        attacking:false,ledgeMantle:pose};
      a.animate(state,1/60,1,{reducedMotion:true,viewAzimuth:Math.PI/4});
      b.animate(state,1/60,1,{reducedMotion:true,viewAzimuth:-Math.PI/4});
      for(const side of [-1,1])for(const joint of ['hip','knee','ankle']){
        const name=side+'-'+joint;
        const one=a.group.getObjectByName(name),other=b.group.getObjectByName(name);
        assert.ok(one?.isBone&&other?.isBone,'inspect the real '+name+' skinned joint');
        assert.ok(one.quaternion.angleTo(other.quaternion)<1e-6,
          `the ${name} must not camera-flip at physical facing=${facing}, mantle=${pose?.progress??'none'}`);
      }
    }
  }
});

test('upper-deck boot visibly loads the actual walking surface only during a real rising rim crossing',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),
    import(threeURL)
  ]);
  const old=createClimber(),planted=createClimber(),wrongDeck=createClimber();
  t.after(()=>{old.dispose();planted.dispose();wrongDeck.dispose();});
  const state={state:'airborne',vx:3200,vy:10200,facing:1,health:5,attacking:false,
    runToken:'real-run',tick:300,ledgePlatformId:'f1:p1',ledgeMantle:{progress:.48,weight:1}};
  const opts={reducedMotion:true,viewAzimuth:-Math.PI/4};
  const sole=rig=>{
    const foot=rig.group.getObjectByName('1-ankle');
    assert.ok(foot?.isBone);
    foot.updateWorldMatrix(true,false);
    return foot.localToWorld(new THREE.Vector3(0,-.205,.07));
  };
  for(const rig of [old,planted,wrongDeck])rig.group.position.set(0,6,25);
  old.animate(state,1/60,1,opts);
  const soleOffset=sole(old).y-6;
  // Reposition just the test fixture so the *actual modeled sole* is 8cm
  // above a real slab. No fake contact position is sent to the rig.
  for(const rig of [old,planted,wrongDeck])rig.group.position.y-=soleOffset-.08;
  const surface={platformId:'f1:p1',y:6,innerRadius:22.4,outerRadius:27.18};
  planted.animate({...state,ledgeSurface:surface},1/60,1,opts);
  wrongDeck.animate({...state,ledgeSurface:{...surface,platformId:'f1:other'}},1/60,1,opts);
  const oldSole=sole(old),newSole=sole(planted),wrongSole=sole(wrongDeck);
  assert.ok(Math.abs(oldSole.y-6-.08)<.001,'fixture must start with a true 8cm floating sole');
  assert.ok(Math.abs(newSole.y-6)<.045,
    'a genuine deck should pull the modeled sole to its top, not let it float 8cm');
  assert.ok(newSole.y>=5.97,'cosmetic contact must not visibly tunnel through a solid deck');
  assert.ok(Math.abs(wrongSole.y-oldSole.y)<1e-6,'another platform cannot plant this boot');
  assert.ok(planted.group.getObjectByName('articulated-body').position.y
    <old.group.getObjectByName('articulated-body').position.y-.01,
    'body mass should visibly compress over the planted boot');
  assert.equal(planted.group.position.y,old.group.position.y,
    'no apparent contact may edit authoritative actor placement');
});

test('the live scene derives boot-loading height from its real intended platform, not a guessed floor',()=>{
  assert.match(scene,/const ledgeSurface = ledgeMantle && targetPlatform \? \{/);
  assert.match(scene,/platformId: targetPlatform\.id,/);
  assert.match(scene,/y: pointFor\(targetPlatform\.x, targetPlatform\.y\+targetPlatform\.height,/);
  assert.match(scene,/ledgeTarget,\s*ledgeMantle,\s*ledgeSurface,/);
});


test('real lead boot plants BOTH heel and toe on the actual supporting upper deck without tunnelling',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)
  ]);
  const state={state:'airborne',vx:3200,vy:10200,facing:1,health:5,attacking:false,
    runToken:'real-run',tick:300,ledgePlatformId:'f1:p1',ledgeMantle:{progress:.48,weight:1}};
  const surface={platformId:'f1:p1',y:6,innerRadius:22.4,outerRadius:27.18};
  for(const viewAzimuth of [-Math.PI/4,Math.PI/4]){
    const floating=createClimber(),planted=createClimber();
    t.after(()=>{floating.dispose();planted.dispose();});
    const opts={reducedMotion:true,viewAzimuth};
    const probes=rig=>{
      const boot=rig.group.getObjectByName('1-ankle');
      assert.ok(boot?.isBone,'measure the actual skinned leading boot');
      boot.updateWorldMatrix(true,false);
      return [-.17,.07,.31].map(z=>boot.localToWorld(new THREE.Vector3(0,-.205,z)));
    };
    for(const rig of [floating,planted])rig.group.position.set(0,6,25);
    floating.animate(state,1/60,1,opts);
    const offset=probes(floating)[1].y-6;
    for(const rig of [floating,planted])rig.group.position.y-=offset-.08;
    planted.animate({...state,ledgeSurface:surface},1/60,1,opts);
    const [heel,mid,toe]=probes(planted);
    for(const p of [heel,mid,toe]){
      assert.ok(Math.hypot(p.x,p.z)>=surface.innerRadius-.01 &&
        Math.hypot(p.x,p.z)<=surface.outerRadius+.01,
        'fixture must place the physical boot over the supporting stone');
      assert.ok(p.y>=surface.y-.025,
        'a boot contact cannot bury any modeled sole edge through the deck: '+p.y);
      assert.ok(p.y<=surface.y+.035,
        'heel and toe must actually bear weight instead of only one imaginary center point: '+p.y);
    }
    assert.ok(planted.group.position.distanceTo(floating.group.position)<1e-8,
      'only pose bones may compress; keep authoritative actor root unchanged');
  }
});


test('an authentic heel-to-toe deck load decompresses through the next rising tick without a phantom second landing',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace("from '/tower/vendor/three.module.js'","from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [{createClimber},THREE]=await Promise.all([
    import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)
  ]);
  const surface={platformId:'f1:p1',y:6,innerRadius:22.4,outerRadius:27.18};
  const base={state:'airborne',vx:3200,vy:10200,facing:1,health:5,attacking:false,
    runToken:'authentic-climb',tick:300,ledgePlatformId:'f1:p1',
    ledgeMantle:{progress:.48,weight:1}};
  for(const viewAzimuth of [-Math.PI/4,Math.PI/4]){
    const loaded=createClimber(),free=createClimber(),anotherRun=createClimber();
    t.after(()=>{loaded.dispose();free.dispose();anotherRun.dispose();});
    const opts={reducedMotion:true,viewAzimuth};
    const body=rig=>{
      const joint=rig.group.getObjectByName('articulated-body');
      assert.ok(joint?.isBone,'measure the actual articulated torso');
      return joint;
    };
    const soleY=rig=>{
      const foot=rig.group.getObjectByName('1-ankle');
      assert.ok(foot?.isBone);
      foot.updateWorldMatrix(true,false);
      return foot.localToWorld(new THREE.Vector3(0,-.205,.07)).y;
    };
    for(const rig of [loaded,free,anotherRun])rig.group.position.set(0,6,25);
    free.animate(base,1/60,1,opts);
    // Match the existing authentic-sole regression: approach floats 8cm over
    // the real top surface before a platform-matched contact is allowed.
    const shift=soleY(free)-surface.y-.08;
    for(const rig of [loaded,free,anotherRun])rig.group.position.y-=shift;
    const planted={...base,ledgeSurface:surface};
    for(const rig of [loaded,anotherRun])rig.animate(planted,1/60,1,opts);
    const compression=body(free).position.y-body(loaded).position.y;
    assert.ok(compression>.05,'contact must have actual load to release: '+compression);
    const upward={...base,tick:301,vy:9000,
      ledgeMantle:{progress:.62,weight:1},ledgeSurface:surface};
    for(const rig of [loaded,free,anotherRun]){
      rig.group.position.y+=.9; // genuine next authoritative ascent, not a cosmetic root change
      const rootBefore=rig.group.position.clone();
      rig.animate(rig===anotherRun?{...upward,runToken:'different-run'}:upward,1/60,1+1/60,opts);
      assert.ok(rig.group.position.equals(rootBefore),'animation does not edit the authoritative root');
    }
    const retained=body(free).position.y-body(loaded).position.y;
    assert.ok(retained>.025&&retained<.135,
      'the first airborne push-off must retain a small bounded fraction of the real load, not snap its torso by the entire compression: '+retained);
    assert.ok(Math.abs(body(anotherRun).position.y-body(free).position.y)<1e-6,
      'the old run must not transfer compression into the next run');
    const departed={...upward,tick:302,vy:7800,ledgeMantle:{progress:.75,weight:1}};
    for(const rig of [loaded,free]){
      rig.group.position.y+=.78;
      rig.animate(departed,1/60,1+2/60,opts);
    }
    assert.ok(Math.abs(body(loaded).position.y-body(free).position.y)<1e-6,
      'the pose must completely release after two actual advancing ticks');
  }
});
