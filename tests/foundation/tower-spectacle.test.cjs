'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),THREE=require('three');
const root=path.resolve(__dirname,'../../public/infinite-tower-climb');
function fromFile(name,fn){
  const source=fs.readFileSync(path.join(root,name),'utf8').replace(/\bexport\s+function\b/g,'function');
  return new Function(source+';return '+fn+';')();
}
test('monumental setpieces visibly replace the same simple recolored environment',()=>{
  const scene=new THREE.Scene();
  const create=fromFile('spectacle3d.js','createTowerSpectacle');
  const spectacle=create(THREE,scene);
  assert.equal(spectacle.signature,'signature-monumental-biomes-v1');
  assert.ok(spectacle.instancedMeshes>=4,'static decorations should be batched');
  assert.equal(Object.keys(spectacle.sets).length,5);
  const shapes=[];
  for(const biome of ['foundry','ruins','clockwork','storm','void']){
    spectacle.setTheme(biome);
    spectacle.update(2.3,152,false);
    const visible=Object.values(spectacle.sets).filter(g=>g.visible);
    assert.equal(visible.length,1,'only the correct biome may be visible');
    assert.strictEqual(visible[0],spectacle.sets[biome]);
    const children=visible[0].children.length;
    assert.ok(children>=6,biome+' requires sculpted details beyond a single shape');
    const volume=new THREE.Box3().setFromObject(visible[0]);
    assert.ok(volume.max.x-volume.min.x>20,biome+' must be monumental in width');
    assert.ok(volume.max.y-volume.min.y>45,biome+' must have several stories');
    shapes.push([biome,children]);
  }
  assert.ok(scene.children.includes(spectacle.root));
  assert.ok(Math.abs(spectacle.root.position.y-180)<.00001,'landmarks must follow the climber in an origin-shifted world');
  const ringGroups=[];
  spectacle.sets.clockwork.traverse(n=>{if(n.isGroup&&n!==spectacle.sets.clockwork)ringGroups.push(n)});
  assert.ok(ringGroups.length>=4,'clockwork must include individually animated orrery mechanisms');
});
test('beveled platform families have luminous route edges and biome-specific color skins',()=>{
  const entities=fromFile('entities3d.js','createTowerEntities')(THREE);
  const colors=[];
  for(const theme of ['foundry','ruins','clockwork','storm','void']){
    entities.setTheme(theme);
    colors.push(entities.materials.neon.color.getHex());
  }
  assert.equal(new Set(colors).size,5);
  const deck=entities.platform({kind:'moving'},0,0,7.8,1);
  const meshes=[];deck.traverse(o=>{if(o.isMesh)meshes.push(o)});
  assert.ok(meshes.some(m=>m.geometry.type==='ExtrudeGeometry'),'platforms need a genuine beveled extruded deck');
  assert.ok(meshes.some(m=>m.material===entities.materials.neon),'route should be brightly signposted');
  const disposed=entities.release(deck);
  assert.equal(disposed,0,'cached beveled platform geometry must not be released when a floor streams out');
});
test('new colorful HUD supports live biome states without losing essential game controls',()=>{
  const html=fs.readFileSync(path.join(root,'volumetric.html'),'utf8');
  const css=fs.readFileSync(path.join(root,'volumetric.css'),'utf8');
  const js=fs.readFileSync(path.join(root,'volumetric.js'),'utf8');
  for(const id of ['volumetric-canvas','floor','height','biome','biome-description','story-line','intent',
    'status','boss-alert','boss-title','boss-health','milestone-progress','health-bar-fill','grip-bar-fill',
    'grip-percent','health-percent','capture-still','record-clip','audio-control','game-mode']){
    assert.ok(html.includes('id="'+id+'"'),'missing new HUD hook '+id);
  }
  for(const biome of ['foundry','ruins','clockwork','storm','void']){
    assert.ok(css.includes('body[data-biome="'+biome+'"]'),'missing vivid CSS palette '+biome);
  }
  assert.ok(js.includes('document.body.dataset.biome=biome'),'changing biome must update UI palette');
  assert.ok(js.includes("bossPanel.hidden=!livingGuardian"),'boss alert is not connected to simulation');
  assert.ok(js.includes('heroWarm.position.set'),'cinematic key light must follow the hero');
  assert.ok(css.includes('@media(max-width:740px)'),'mobile responsive HUD is required');
  assert.ok(css.includes('prefers-reduced-motion'),'reduced motion preference should be respected');
});

test('original material atlas supplies three reusable PBR maps with valid finite normals',()=>{
  const create=fromFile('material3d.js','createTowerSurfaceLibrary');
  const library=create(THREE);
  assert.equal(library.size,256);
  assert.equal(Object.keys(library.textures).length,3);
  for(const kind of ['forged-alloy','hand-hewn-stone','inlaid-ceramic']){
    const maps=library.textures[kind];
    for(const channel of ['albedo','roughness','normal']){
      const texture=maps[channel];
      assert.ok(texture.isDataTexture,'PBR '+kind+'/'+channel+' must be first-party GPU texture');
      assert.equal(texture.image.width,256);
      assert.equal(texture.image.height,256);
      assert.equal(texture.image.data.length,256*256*4);
    }
    const values=maps.normal.image.data;
    for(let i=0;i<values.length;i+=2048){
      assert.ok(values[i]>=0&&values[i]<=255);
      assert.ok(values[i+2]>126,'normal map must point outwards from the material');
    }
    const testMaterial=new THREE.MeshStandardMaterial({roughness:.7});
    assert.equal(library.apply(testMaterial,kind),testMaterial);
    assert.strictEqual(testMaterial.normalMap,maps.normal);
  }
  const entities=fromFile('entities3d.js','createTowerEntities')(THREE,library);
  assert.ok(entities.materials.steelSkin.normalMap,'the gameplay deck must actually consume the map');
  assert.ok(entities.materials.stone.roughnessMap,'the gameplay stone must use roughness');
});

test('biome weather produces colored atmospheric GPU particles with no per-frame allocations',()=>{
  const scene=new THREE.Scene();
  const create=fromFile('weather3d.js','createTowerWeather'),weather=create(THREE,scene);
  assert.equal(weather.count,520);
  assert.equal(weather.root.geometry.getAttribute('position').count,520);
  assert.ok(weather.root.isPoints);
  const points=weather.root,geometry=points.geometry,material=points.material;
  const combinations=[];
  for(const biome of ['foundry','ruins','clockwork','storm','void']){
    weather.setTheme(biome);
    weather.update(12.4,{x:5,y:155,z:2},false);
    combinations.push(material.uniforms.uColor.value.getHex());
    assert.equal(weather.theme,biome);
    assert.strictEqual(points.geometry,geometry,'GPU positions must be reused');
    assert.strictEqual(points.material,material,'one draw call and shader material per biome');
    assert.equal(points.position.x,5);
    assert.equal(points.position.y,180);
    assert.equal(points.position.z,2);
  }
  assert.equal(new Set(combinations).size,5);
  weather.update(99,{y:155},true);
  assert.equal(material.uniforms.uTime.value,0,'accessibility mode must freeze particle drift');
});

test('foreground 3D floor fading is camera-specific, reversible and never changes the physical platform',()=>{
  const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
  const create=fromFile('occlusion3d.js','createTowerOcclusion');
  const manager=create(THREE,root);
  const original=new THREE.MeshStandardMaterial({color:0x1b567b});
  const landing=new THREE.Group();landing.userData.platform=true;
  const slab=new THREE.Mesh(new THREE.BoxGeometry(12,1.4,5),original);
  landing.add(slab);root.add(landing);
  const camera=new THREE.PerspectiveCamera(54,16/9,.1,300);
  camera.position.set(0,8,15);
  // A suspended upper landing is between the climber and cinematic lens.
  landing.position.set(0,4,6);
  const hero={x:0,y:0,z:0};
  let visible=manager.update(camera,hero,1);
  assert.ok(visible>=1,'real foreground overhang should be identified');
  assert.notStrictEqual(slab.material,original);
  assert.ok(slab.material.transparent&&slab.material.opacity<.5);
  const originalGeometry=slab.geometry;
  landing.position.set(40,4,6);
  visible=manager.update(camera,hero,8);
  assert.equal(visible,0);
  assert.strictEqual(slab.material,original,'material must be restored when obstruction clears');
  assert.strictEqual(slab.geometry,originalGeometry,'art fading must never replace game collision/render topology');
  manager.dispose();
});
