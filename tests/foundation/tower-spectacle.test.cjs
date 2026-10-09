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
