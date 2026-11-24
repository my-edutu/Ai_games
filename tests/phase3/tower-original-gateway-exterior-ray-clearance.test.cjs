'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const moduleFile=import('../../public/infinite-tower-climb/visuals/guardian-clear-sightline-frame.mjs');

// Recorded from the UNEDITED 1x candidate portrait WebM + associated actual
// current-Three geometry rays at source F9 tick479 (d0ca8ff7). These are
// camera/ray witnesses, not native pixels or independent reviewer acceptance.
const actualRay={
  sourceExitX:304896,worldWidth:480000,
  camera:[11.62,4.14,44.28],
  openedGateCentre:[7.107,.4,23.185],
  openedGateLip:[7.107,1.6,23.185],
  roofWorldY:-2.8
};
function rayHitsGateBlock(eye,target,block) {
  const a=(actualRay.sourceExitX/actualRay.worldWidth-.5)*2.2;
  const ox=Math.sin(a)*24.25, oz=Math.cos(a)*24.25;
  const local=p=>{
    const x=p[0]-ox,z=p[2]-oz;
    return [-Math.sin(a)*x-Math.cos(a)*z,
      p[1]-actualRay.roofWorldY,
      Math.cos(a)*x-Math.sin(a)*z];
  };
  const p=local(eye),q=local(target),direction=q.map((x,i)=>x-p[i]);
  let near=0,far=1;
  const centre=[block.x,block.y,block.z];
  const half=[block.width/2,block.height/2,block.depth/2];
  for(let j=0;j<3;j++){
    const lower=centre[j]-half[j],upper=centre[j]+half[j];
    if(Math.abs(direction[j])<1e-10){
      if(p[j]<lower||p[j]>upper)return false;
    } else {
      let t1=(lower-p[j])/direction[j],t2=(upper-p[j])/direction[j];
      if(t1>t2)[t1,t2]=[t2,t1];
      near=Math.max(near,t1);far=Math.min(far,t2);
      if(near>far)return false;
    }
  }
  return far>=0&&near<=1;
}
test('original gate centre and lip rays hit prior exterior pier but clear new connected structural frame',async()=>{
  const {originalGuardianGatewayClearSightlineFrame}=await moduleFile;
  const frame=originalGuardianGatewayClearSightlineFrame();
  const outboard=frame.piers.find(x=>x.side===-1);
  const old={x:-4.15,y:2.58,z:-.42,width:.34,height:5.16,depth:.42};
  const relocated={...outboard,y:2.58,width:.34,height:5.16,depth:.42};
  for(const endpoint of [actualRay.openedGateCentre,actualRay.openedGateLip]){
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,old),true,
      'old observed pier intersection must be reproducible');
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,relocated),false,
      'new actual outboard load pier must not hide the source-open doorway');
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,frame.upperOuterTie),false,
      'new connected overhead tie cannot become another portal obstruction');
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,frame.crown),false);
  }
  assert.deepEqual(frame.piers.find(x=>x.side===1),{side:1,x:4.15,z:-.42});
  assert.equal(frame.upperOuterTie.x,outboard.x);
  assert.ok(frame.upperOuterTie.z-frame.upperOuterTie.depth/2<=outboard.z+.21);
  assert.ok(frame.upperOuterTie.z+frame.upperOuterTie.depth/2>=frame.crown.z-.23);
});
test('original guardian world uses source-built masonry plan without bypassing guardian HP defeat or authority',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(code,/originalGuardianGatewayClearSightlineFrame\(theme==='clockwork'&&p\.id==='f8:cap'\)/);
  assert.match(code,/for\(const pier of gatewayFrame\.piers\)/);
  assert.match(code,/guardianGate=\{frame,wings,crest,counterweights,conduit/);
  assert.match(code,/const unlocked=guardian\.active===false/);
});


test('the physical F8 entrance transfers both fixed bearings and the outer bronze upright into one connected core cantilever',async()=>{
 const {originalGuardianGatewayClearSightlineFrame:frame}=await moduleFile;
 const {sourceOriginalGuardianThresholdSignature:signature}=await import('../../public/infinite-tower-climb/visuals/source-original-guardian-threshold-signature.mjs');
 const core=frame(true);
 const legacy=frame();
 assert.equal(legacy.piers[0].x,-4.15,'other floor presentation unchanged');
 assert.deepEqual(core.piers.map(p=>[p.x,p.z]),[[4.15,-3.3],[4.15,-.42]]);
 assert.equal(core.upperOuterTie.x,4.15);
 assert.ok(core.upperOuterTie.z-core.upperOuterTie.depth/2<=core.piers[0].z+.21);
 assert.ok(core.upperOuterTie.z+core.upperOuterTie.depth/2>=core.crown.z-.23);
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const plan=signature({platform:cap,worldWidth:480000,guardianExitX:304896});
 assert.equal(plan.members.length,11,'same bounded count of permanent original gate beams');
 for(const m of plan.members){
   const minimumY=Math.min(m.from[1],m.to[1])-m.radius;
   if(minimumY<5)assert.ok(Math.min(m.from[0],m.to[0])-m.radius>0,
     'no permanent foreground post in the outer half of the physical gate');
 }
 assert.ok(plan.members.some(m=>m.name==='original-portal-cantilever-left'&&m.from[0]>0&&m.to[0]<0),
   'new upper beam connects the rear bearing to the full existing arch span');
});

test('actual batched Floor8 gate clears the two sampled camera-to-body ray groups through its reconstructed fixed steel',async()=>{
 const {resolveTowerWorldFixtureImports}=require('../helpers/tower-world-fixture-imports.cjs');
 const os=require('node:os'),{pathToFileURL}=require('node:url');
 const root=path.resolve(__dirname,'../..');
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'tower-core-cantilever-'));
 const threeURL=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
 const worldPath=path.join(scratch,'world.mjs');
 const code=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8')
   .replace("'/tower/vendor/three.module.js'",JSON.stringify(threeURL));
 fs.writeFileSync(worldPath,resolveTowerWorldFixtureImports(code,{root,fixtureDir:scratch}));
 let world;
 try{
   const [THREE,{createTowerWorld}]=await Promise.all([import(threeURL),import(pathToFileURL(worldPath).href)]);
   world=createTowerWorld();
   const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
   const source={runToken:'fixed-core-cantilever-fixture',floor:8,theme:'clockwork',tick:283,lifecycle:'running',
     worldWidth:480000,chunkBaseY:2880000,chunkHeight:360000,guardianExitX:304896,
     platforms:[cap],hazards:[],pickups:[],projectiles:[],
     enemies:[{id:'f8:guardian',kind:'guardian',active:true,health:4,maxHealth:8,x:235000,y:3250000,halfHeight:18000}],
     player:{health:3,x:295896,y:3238000,halfWidth:9000,halfHeight:14000,grounded:true,groundedPlatformId:'f8:cap',vy:0}};
   const unchanged=JSON.stringify(source);
   world.update(source,.05,0,{quality:'low'});
   world.group.updateWorldMatrix(true,true);
   const gate=world.group.getObjectByName('AuthoritativeGuardianGate');
   assert.ok(gate?.isGroup);
   const fixed=gate.children.filter(m=>m.isMesh&&m.name==='rigid-material-batch');
   assert.ok(fixed.length>=2,'real permanent fixed metal is still rendered');
   const rays=[
     [[16.43,40.97,40.86],[6.315,35.8,24.189]],
     [[16.43,40.97,40.86],[6.315,36.864,24.189]],
     [[16.43,40.97,40.86],[6.315,34.4,24.189]],
     [[14.06,37.58,42.25],[3.163,35.8,24.799]],
     [[14.06,37.58,42.25],[3.163,36.864,24.799]],
     [[14.06,37.58,42.25],[3.163,34.4,24.799]]
   ];
   for(const [eye,body] of rays){
     const origin=new THREE.Vector3(...eye),delta=new THREE.Vector3(...body).sub(origin),length=delta.length();
     const hits=new THREE.Raycaster(origin,delta.normalize(),0,length-.05).intersectObjects(fixed,false);
     // Dynamic bronze grilles and unrelated world meshes are separate;
     // this test is strictly the two fixed owners measured in the film.
     assert.equal(hits.length,0,'recorded camera-to-body ray no longer crosses fixed gate metal');
   }
   for(const side of ['Left','Right'])assert.equal(gate.getObjectByName('GuardianSealBronzeLattice'+side).count,6);
   assert.equal(world.diagnostics().guardianGates[0].unlocked,false);
   assert.equal(JSON.stringify(source),unchanged);
 }finally{world?.dispose();fs.rmSync(scratch,{recursive:true,force:true});}
});
