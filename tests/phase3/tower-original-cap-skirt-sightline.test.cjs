'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const loaded=import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs')).href);
const three=import('three');

test('real original F8 cap non-walkable skirts clear the live F9 climber/gateway without hiding the original walkable top or successor deck',async()=>{
  const THREE=await three;
  const {protectSourceSuccessorUndercroft:protect}=await loaded;
  for(const aspect of [960/600,390/844]){
    const root=new THREE.Group(),scene=new THREE.Scene();
    const topMaterial=new THREE.MeshStandardMaterial({color:0x936f42});
    const top=new THREE.Mesh(new THREE.BoxGeometry(8,.15,4),topMaterial);
    top.position.set(0,5,2.6);
    root.add(top);
    const before={runToken:'real-guardian-crossing',lifecycle:'running',
      floor:9,theme:'void',tick:478,player:{health:4,halfWidth:9000,halfHeight:14000}};
    const held={runToken:before.runToken,floor:9,sourceTick:475,
      guardianGateRetained:true,oldCapId:'f8:cap',
      thresholdX:310000,oldRoofY:345000};
    const entries=[],dispose=[];
    for(const x of [-.5,.5]){
      const tint=new THREE.MeshStandardMaterial({color:0x825b3b});
      const material=tint.clone();
      const geometry=new THREE.BoxGeometry(.9,3.2,1);
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.set(x,2.2,2.8);
      root.add(mesh);
      entries.push({mesh,material,tint});dispose.push(geometry,material,tint);
    }
    // The next-floor decks occupy the SAME optical scene but are not
    // automatically made transparent by a blocked OLD cap skirt.
    const f9Entries=[];
    for(let i=0;i<4;i++){
      const geometry=new THREE.BoxGeometry(.6,.4,.8);
      const tint=new THREE.MeshStandardMaterial({color:0x68557e});
      const mat=tint.clone(),mesh=new THREE.Mesh(geometry,mat);
      mesh.position.set(17+i,2,2.8);root.add(mesh);
      f9Entries.push({mesh,material:mat,tint});
      dispose.push(geometry,tint,mat);
    }
    scene.add(root);scene.updateMatrixWorld(true);
    const camera=new THREE.PerspectiveCamera(55,aspect,.1,100);
    camera.position.set(0,2,6);camera.updateMatrixWorld(true);
    const opts={source:before,held,camera,
      body:new THREE.Vector3(0,2,0),bodyHalfHeight:1.2,
      gate:new THREE.Vector3(0,2,0),entries:[...f9Entries,...entries],
      raycaster:new THREE.Raycaster(),direction:new THREE.Vector3(),
      point:new THREE.Vector3(),hits:[],dt:1/25};
    const unchanged=JSON.stringify([before,held]);
    try {
      const result=protect(opts);
      assert.equal(result.active,true);
      assert.equal(result.meshes,6);
      assert.ok(result.softened>0);
      assert.ok(result.rays<=36,'six original 3D panels with six source rays each');
      assert.ok(entries.some(entry=>entry.material.opacity<=.035),
        'the real old-cap foreground, not a synthetic proxy, can clear');
      assert.equal(top.material.opacity,1);
      assert.equal(top.material.depthWrite,true);
      assert.ok(f9Entries.every(entry=>entry.material.opacity===1));
      assert.equal(JSON.stringify([before,held]),unchanged);
      opts.source={...before,tick:600};
      assert.equal(protect(opts).active,false);
      assert.ok(entries.every(entry=>entry.material.opacity===1 &&
        entry.material.depthWrite===true));
    } finally {
      top.geometry.dispose();topMaterial.dispose();
      for(const resource of dispose)resource.dispose();
    }
  }
});

test('source retains exact F8 platform skirt triangles and isolates only its material owner from rigid batching',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/guardianCap && p\.id==='f8:cap'/);
  assert.match(world,/originalCapSkirtOwner\.add\(outerUnder,innerUnder\)/);
  assert.match(world,/p\.gearVisual,p\.originalCapSkirtOwner\]\.filter\(Boolean\)/);
  assert.match(world,/originalCapUndercroft\.push\(\{mesh:skirt,material,tint\}\)/);
  assert.match(world,/originalCapUnder\)undercroftEntries\.push\(\.\.\.originalCapUnder\)/);
  assert.match(world,/candidates\.slice\(0,originalCapUnder\?2:3\)/);
  assert.match(world,/originalCapUndercroft,\s*originalGalleryTriangles/);
  assert.match(world,/originalCapSightlineRoot:root/);
  assert.match(world,/originalDeckSurface:bronzeSurface/);
});
