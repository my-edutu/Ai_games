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
      assert.ok(result.rays<=60,'at most ten current source-owned full-body/door rays for six authentic panels');
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


test('unedited 390px guardian crossing: an opaque old-cap skirt covering only the original full-body sole is removed from depth, not its walkable roof',async()=>{
  const THREE=await three;
  const {protectSourceSuccessorUndercroft:protect}=await loaded;
  const source={runToken:'original-full-sole-passage',lifecycle:'running',floor:9,
    theme:'void',tick:479,player:{health:4,halfWidth:9000,halfHeight:14000}};
  const held={runToken:source.runToken,floor:9,sourceTick:475,
    guardianGateRetained:true,oldCapId:'f8:cap',
    thresholdX:310000,oldRoofY:345000};
  const scene=new THREE.Scene();
  const root=new THREE.Group();scene.add(root);
  const roofMaterial=new THREE.MeshStandardMaterial({color:0x936f42});
  const roof=new THREE.Mesh(new THREE.BoxGeometry(8,.12,4),roofMaterial);
  roof.position.set(0,5,2.7);root.add(roof);
  // With camera z=6 and body z=0, the original near-sole ray reaches
  // y~1.51 at z=2.8, but the true sole ray reaches y~1.36. This existing
  // bronze underside was recorded in front of the portrait climber's shoes
  // while the previous 76%-sole test missed it entirely.
  const tint=new THREE.MeshStandardMaterial({color:0x825b3b});
  const material=tint.clone();
  const skirt=new THREE.Mesh(new THREE.BoxGeometry(.6,.07,.12),material);
  skirt.position.set(0,1.36,2.8);root.add(skirt);
  const camera=new THREE.PerspectiveCamera(55,390/844,.1,100);
  camera.position.set(0,2,6);camera.updateMatrixWorld(true);
  scene.updateMatrixWorld(true);
  const opts={source,held,camera,body:new THREE.Vector3(0,2,0),
    bodyHalfHeight:1.2,entries:[{mesh:skirt,material,tint}],
    raycaster:new THREE.Raycaster(),direction:new THREE.Vector3(),
    point:new THREE.Vector3(),hits:[],dt:1/25};
  try{
    const before=JSON.stringify([source,held]);
    // Verify the actual original panel intersects ONLY the genuine foot ray,
    // rather than creating a test that any existing shoulder check could pass.
    const ray=new THREE.Raycaster(camera.position,
      new THREE.Vector3(0,-.64,-3.2).normalize(),0,20);
    assert.ok(ray.intersectObject(skirt,false).length>0,
      'the full-body skinned sole has a real source-mesh ray obstruction');
    ray.set(camera.position,new THREE.Vector3(0,-.4864,-3.2).normalize());
    assert.equal(ray.intersectObject(skirt,false).length,0,
      'the old shortened 76%-sole sampler genuinely missed this real skirt');
    const result=protect(opts);
    assert.equal(result.active,true);
    assert.equal(result.softened,1);
    assert.ok(result.rays<=8);
    assert.equal(material.opacity,.035);
    assert.equal(material.depthWrite,false);
    assert.equal(roofMaterial.opacity,1);
    assert.equal(roofMaterial.depthWrite,true);
    assert.equal(JSON.stringify([source,held]),before);
    opts.source={...source,runToken:'different-run'};
    assert.equal(protect(opts).active,false,
      'a different episode cannot retain the original garment clearance');
    assert.equal(material.opacity,1);
    assert.equal(material.depthWrite,true);
  }finally{
    roof.geometry.dispose();roofMaterial.dispose();
    skirt.geometry.dispose();tint.dispose();material.dispose();
  }
});

test('source retains exact F8 platform skirt triangles and isolates only its material owner from rigid batching',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/guardianCap && p\.id==='f8:cap'/);
  assert.match(world,/originalCapSkirtOwner\.add\(outerUnder,innerUnder\)/);
  assert.match(world,/p\.gearVisual,p\.originalCapSkirtOwner,p\.originalCapCanopy\]\.filter\(Boolean\)/);
  assert.match(world,/if\(p.originalCapCanopy\)batchRigid\(p.originalCapCanopy\)/);
  assert.match(world,/originalCapUndercroft\.push\(\{mesh:skirt,material,tint,sourceSkirtPairId:'f8:cap'\}\)/);
  assert.match(world,/sourceSkirtPairId:p\.id/);
  assert.match(world,/originalCapUnder\)undercroftEntries\.push\(\.\.\.originalCapUnder\)/);
  assert.match(world,/candidates\.slice\(0,originalCapUnder\?2:3\)/);
  assert.match(world,/originalCapUndercroft,\s*originalCapCanopy:sourceEntry\.originalCapCanopy\?\?null/);
  assert.match(world,/originalCapSightlineRoot:root/);
  assert.match(world,/originalDeckSurface:bronzeSurface/);
});


test('same source F8 cap undercroft pair clears together only after one real physical-ray intersection, and restores on expired crossing',async()=>{
  const THREE=await three;
  const {protectSourceSuccessorUndercroft:protect}=await loaded;
  const runToken='physical-returned-guardian-cap-pair';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',
    tick:479,player:{health:4,halfWidth:9000,halfHeight:14000}};
  const held={runToken,floor:9,sourceTick:475,
    guardianGateRetained:true,oldCapId:'f8:cap',
    thresholdX:310000,oldRoofY:345000};
  const root=new THREE.Group(),scene=new THREE.Scene();
  scene.add(root);
  const roofMaterial=new THREE.MeshStandardMaterial({color:0x936f42});
  const roof=new THREE.Mesh(new THREE.BoxGeometry(8,.12,4),roofMaterial);
  roof.position.set(0,5,2.8);root.add(roof);
  const entries=[],resources=[roof.geometry,roofMaterial];
  for(const x of [0,3]){
    const tint=new THREE.MeshStandardMaterial({color:0x825b3b});
    const material=tint.clone();
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.6,.07,.12),material);
    mesh.position.set(x,1.36,2.8);root.add(mesh);
    entries.push({mesh,material,tint,sourceSkirtPairId:'f8:cap'});
    resources.push(mesh.geometry,material,tint);
  }
  const camera=new THREE.PerspectiveCamera(55,390/844,.1,100);
  camera.position.set(0,2,6);
  camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  const opts={source,held,camera,body:new THREE.Vector3(0,2,0),
    bodyHalfHeight:1.2,entries,raycaster:new THREE.Raycaster(),
    direction:new THREE.Vector3(),point:new THREE.Vector3(),hits:[]};
  const immutable=JSON.stringify([source,held]);
  try {
    // Only x=0 intersects the unmodified current-source sole ray.
    const ray=new THREE.Raycaster(camera.position,
      new THREE.Vector3(0,-.64,-3.2).normalize(),0,20);
    assert.ok(ray.intersectObject(entries[0].mesh,false).length>0);
    assert.equal(ray.intersectObject(entries[1].mesh,false).length,0);
    const coupled=protect(opts);
    assert.equal(coupled.active,true);
    assert.equal(coupled.softened,2,
      'paired real F8 cap inner/outer skirt must not retain one opaque sole silhouette');
    assert.ok(entries.every(e=>e.material.opacity===.035 &&
      e.material.transparent && !e.material.depthWrite));
    assert.equal(roofMaterial.opacity,1,'genuine walkable roof stays fully opaque');
    assert.equal(roofMaterial.depthWrite,true);
    assert.equal(JSON.stringify([source,held]),immutable);
    // A second panel with a different owner cannot inherit clearance.
    entries[1].sourceSkirtPairId='f9:forged';
    const uncoupled=protect(opts);
    assert.equal(uncoupled.softened,1);
    assert.equal(entries[0].material.opacity,.035);
    assert.equal(entries[1].material.opacity,1);
    // No stale source may leave ghost metal behind after genuine crossing.
    opts.source={...source,runToken:'restarted'};
    assert.equal(protect(opts).active,false);
    assert.ok(entries.every(e=>e.material.opacity===1 &&
      !e.material.transparent && e.material.depthWrite));
  }finally{for(const r of resources)r.dispose();}
});
