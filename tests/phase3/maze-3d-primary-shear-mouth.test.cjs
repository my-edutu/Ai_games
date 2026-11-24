'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
// Installed production Three.js and actual public Maze model, not a fake
// screenshot, private trigger, edited camera, or weakened renderer budget.
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const moment=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const mod=import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(moment))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const published={runToken:'joined-shears',tick:4,width:7,height:9,currentCell:24,
  cells:[{cell:24,neighbors:[],trap:true,blocked:false}],visibleCells:[24],
  discoveredCells:[24],doors:[],keys:[],inventory:[],threats:[],exitCell:null};
test('full-scale paired cutting faces visibly cross the real jaw gap while the secondary drive recedes',async()=>{
  const {createMazeWorld}=await mod;
  const {Box3,Vector3}=await import(three);
  const world=createMazeWorld({balanced:true});
  try {
    world.update(published);
    const court=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    assert.ok(court,'only the publicly disclosed trap gets built');
    const drive=court.getObjectByName('Published tide-shear pressure counterbalance arch 24');
    // Previous Pass262 exact local .75/.78 scale is no longer a useful
    // silhouette contract: a complete, still-source-driven rear portal now
    // frames the blades. Preserve the STRICT physical requirement: its yoke
    // and both pylons are joined, behind the actual blade faces, and inside
    // the original known 2.4m tile. Never accept a foreground duplicate jaw.
    const portalYoke=drive?.getObjectByName('Published Tideglass shear-portal connected yoke');
    const portalPylons=[-1,1].map(side=>drive?.getObjectByName(
      'Published Tideglass shear-portal anchored pylon '+side));
    assert.ok(drive?.isGroup&&portalYoke?.isMesh&&portalPylons.every(p=>p?.isMesh)
      &&drive.position.z<=-.64,
      'functional grounded rear Tideglass portal frames the two cutting faces');
    const jaws=[-1,1].map(side=>court.getObjectByName('Disclosed tide-shear hinged jaw 24 '+side));
    assert.ok(jaws.every(Boolean));
    const blades=jaws.map(jaw=>jaw.getObjectByName('Published tide-shear front blade'));
    const edges=jaws.map(jaw=>jaw.getObjectByName('Published tide-shear forward danger inlay'));
    court.updateMatrixWorld(true);
    const yokeBounds=new Box3().setFromObject(portalYoke);
    const trueBladeForwardZ=Math.min(...blades.map(b=>
      b.getWorldPosition(new Vector3()).z));
    assert.ok(yokeBounds.max.z<trueBladeForwardZ-.50,
      'the moving load arch remains physically BEHIND the actual paired front blades');
    const courtOrigin=court.getWorldPosition(new Vector3());
    const portalBounds=new Box3().setFromObject(drive);
    assert.ok(portalBounds.min.x>courtOrigin.x-1.2&&portalBounds.max.x<courtOrigin.x+1.2
      &&portalBounds.min.z>courtOrigin.z-1.2&&portalBounds.max.z<courtOrigin.z+1.2,
      'the whole non-colliding rear gantry stays inside the disclosed trap cell');
    assert.ok(blades.every(b=>b?.isMesh&&b.scale.x>=.34&&b.scale.x<=.42
      &&b.scale.y>=1.20&&b.scale.z<=.27),
      'one full-height narrow ivory cutter per jaw, leaving genuine negative space around Pip');
    assert.ok(jaws.every(jaw=>{
      const rib=jaw.getObjectByName('Published tide-shear open-web structural rib');
      const bearing=jaw.getObjectByName('Published tide-shear rooted bearing');
      return rib?.isMesh&&bearing?.isMesh&&rib.parent===jaw&&bearing.parent===jaw
        &&rib.scale.x<=.15&&rib.position.z<jaw.getObjectByName('Published tide-shear front blade').position.z-.30;
    }),'both cutters keep rooted rear structural ribs behind their authentic striking faces');
    assert.ok(edges.every(Boolean)&&edges[0].position.x>0&&edges[1].position.x<0,
      'coral contact edges face the physical throat rather than reading as separate props');
    assert.ok(jaws.every(jaw=>jaw.getObjectByName('Published tide-shear warning vane')
      &&jaw.getObjectByName('Published tide-shear inward brace')),
      'legacy warning and rooted braces remain functional');
    const resources=world.stats();
    const origin=court.getWorldPosition(new Vector3());
    const far=new Vector3(origin.x+30,0,origin.z+30);
    const near=new Vector3(origin.x,0,origin.z);
    const centers=()=>{world.group.updateMatrixWorld(true);
      return blades.map(b=>b.getWorldPosition(new Vector3()).x-origin.x);};
    const contactCenters=()=>{world.group.updateMatrixWorld(true);
      return edges.map(e=>e.getWorldPosition(new Vector3()).x-origin.x);};
    world.animate(1,{explorerPosition:far,reducedMotion:false});
    const open=centers(),openContacts=contactCenters();
    assert.ok(open[0]<-.28&&open[1]>.28,
      'the authentic wide-open physical cutters preserve an unobstructed center, stricter than the old .25 threshold');
    assert.ok(openContacts[0]<-.18&&openContacts[1]>.18,
      'both original coral contact edges also leave the central open throat unobstructed');
    world.animate(2,{explorerPosition:near,reducedMotion:false});
    world.animate(3.4,{explorerPosition:near,reducedMotion:false});
    const closed=centers();
    assert.ok(closed[0]>0&&closed[1]<0,
      'true public treadle and shutter pressure makes BOTH cutting faces cross the gap');
    for(const jaw of jaws){
      const bounds=new Box3().setFromObject(jaw);
      assert.ok(bounds.min.x>origin.x-1.2&&bounds.max.x<origin.x+1.2
        &&bounds.min.z>origin.z-1.2&&bounds.max.z<origin.z+1.2,
        'the complete closing blade stays inside its disclosed 2.4m cell');
    }
    world.animate(4,{explorerPosition:far,reducedMotion:false});
    const released=centers();
    assert.ok(released[0]<-.28&&released[1]>.28,
      'genuine withdrawal restores the same complete open physical throat');
    assert.ok(contactCenters()[0]<-.18&&contactCenters()[1]>.18,
      'withdrawal visibly restores the coral cutting-edge clearance too');
    world.update({...published,visibleCells:[]});
    world.animate(5,{explorerPosition:near,reducedMotion:false});
    assert.ok(centers()[0]<-.25,'remembered-only trap does not reveal an earned closing stroke');
    assert.equal(world.stats().geometryCount,resources.geometryCount,'no frame geometry allocation');
    assert.equal(world.stats().materialCount,resources.materialCount,'no frame material allocation');
    assert.equal(world.stats().textureCount,resources.textureCount,'no frame texture allocation');
  } finally{
    world.dispose();
    for(const k of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[k],0,'dispose releases '+k);
  }
});
