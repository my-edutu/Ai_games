'use strict';
// Executes the actual ESM 3D art code without needing a GPU, browser or authoring engine.
// This is independent of the authoritative maze solver and cannot access its world truth.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const THREE=require('three');
const root=path.resolve(__dirname,'..','..');
async function loadModule(name){
  const contents=await fs.readFile(path.join(root,'public','ai-maze-escape',name),'utf8');
  const url='data:text/javascript;base64,'+Buffer.from(contents).toString('base64');
  return import(url);
}
function observedCells(){
  return Array.from({length:25},(_,cell)=>({
    cell,visible:true,blocked:false,neighbors:[],visits:cell%4,
    checkpoint:cell===2,clue:cell===5,trap:cell===6
  }));
}
test('five uniquely colored biomes instantiate genuine 3D landscape, architectural details and glyphs',async()=>{
  const {makeWorldCraft}=await loadModule('world-craft.js');
  const art=makeWorldCraft(THREE);
  const world=new THREE.Group();
  const cells=observedCells();
  const profileSamples=[];
  for(const profile of ['tree','loops','chambers','layers','hunter']){
    world.clear();
    art.setTheme(profile);
    let instanced=0;
    let sculpted=0;
    const queue=(geometry,material,position,scale=[])=>{
      assert.ok(geometry instanceof THREE.BufferGeometry);
      assert.ok(material instanceof THREE.Material);
      assert.equal(position.length,3);
      assert.ok(position.every(Number.isFinite));
      instanced++;
    };
    const put=(geometry,material,parent,position,scale)=>{
      assert.ok(geometry instanceof THREE.BufferGeometry);
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.set(...position);
      if(scale)mesh.scale.set(...scale);
      parent.add(mesh);
      sculpted++;
      return mesh;
    };
    const snapshot=new Proxy({width:5,height:5},{get(target,key){
      if(key==='width'||key==='height')return target[key];
      throw new Error('Procedural 3D art must not inspect hidden game authority: '+String(key));
    }});
    const options={world,snapshot,cells,queue,put,
      point:(i,width)=>new THREE.Vector3(i%width*2.5,0,Math.floor(i/width)*2.5),
      grid:2.5,glow(){}};
    art.populate(options);
    art.decorateWall({world,x:0,z:0,id:0,kind:'NS',queue,put,height:2.8,glow(){}});
    art.decorateWall({world,x:0,z:0,id:0,kind:'EW',queue,put,height:2.8,glow(){}});
    assert.equal(world.userData.artStats.biome,profile);
    assert.equal(world.userData.artStats.skyline,18);
    assert.ok(world.userData.artStats.monumentalProps>0);
    assert.ok(world.userData.artStats.clusters>0);
    assert.ok(instanced>150);
    assert.ok(sculpted>15);
    profileSamples.push({profile,instanced,sculpted});
  }
  assert.ok(new Set(profileSamples.map(v=>v.profile)).size===5);
});
test('original Wayfinder and Hollow Sentinel have articulated meshes rather than placeholder cylinders',async()=>{
  const {makeCharacterArt}=await loadModule('character-art.js');
  const art=makeCharacterArt(THREE);
  const explorer=art.explorer(),wraith=art.wraith();
  const count=root=>{let n=0;root.traverse(child=>{if(child.isMesh)n++});return n};
  assert.ok(count(explorer)>=25,'rich explorer mesh must be visible');
  assert.ok(count(wraith)>=16,'wraith must have a meaningful silhouette');
  assert.equal(explorer.userData.limbs.length,2);
  assert.ok(explorer.userData.lantern);
  assert.ok(explorer.userData.head);
  assert.ok(explorer.userData.capeRig);
  assert.ok(wraith.userData.shrouds.length>=6);
  // Animation APIs used by the scene must be available on real Three.js objects.
  for(const limb of explorer.userData.limbs){
    limb.leg.rotation.x=.25;limb.arm.rotation.x=-.2;
  }
  for(const shroud of wraith.userData.shrouds)shroud.mesh.rotation.z=shroud.rest+.1;
});
test('biome atmosphere updates real particle buffers and disposes its GPU data',async()=>{
  const {createAtmosphere}=await loadModule('atmosphere.js');
  const atmosphere=createAtmosphere(THREE);
  assert.ok(atmosphere.group.children.length>=3);
  for(const profile of ['tree','loops','chambers','layers','hunter']){
    const preset=atmosphere.setTheme(profile);
    assert.ok(preset.fog>0);
    atmosphere.update(9000,1/60,new THREE.Vector3(9,0,11),false);
    assert.equal(atmosphere.group.position.x,9);
    assert.equal(atmosphere.group.position.z,11);
    atmosphere.update(10000,1/60,new THREE.Vector3(),true);
  }
  atmosphere.dispose();
});
