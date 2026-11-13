'use strict';
const assert = require('node:assert/strict');
const {test, after} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-vista-'));
after(() => fs.rmSync(scratch, {recursive:true, force:true}));
const threeURL = pathToFileURL(path.join(ROOT,'node_modules/three/build/three.module.js')).href;
const localURL = file => pathToFileURL(path.join(ROOT,file)).href;
const raw = fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
const source = raw.replace("'/tower/vendor/three.module.js'", JSON.stringify(threeURL))
  .replace("'./coordinates.mjs'", JSON.stringify(localURL('public/infinite-tower-climb/visuals/coordinates.mjs')))
  .replace("'./crossfloor-arrival.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs')).href))
  .replace("'./source-physical-arrival-palette.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs')).href))
  .replace("'./guardian-passage.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href))
  .replace("'./world-surface.mjs'", JSON.stringify(localURL('public/infinite-tower-climb/visuals/world-surface.mjs')))
  .replace("'./guardian-transmission-layout.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs')).href))
  .replace("'./mesh-provenance.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href))
  .replace("'./scene-hierarchy.mjs'", JSON.stringify(localURL('public/infinite-tower-climb/visuals/scene-hierarchy.mjs')));
const modulePath = path.join(scratch,'world.mjs');fs.writeFileSync(modulePath,source);
const loaded = Promise.all([import(threeURL),import(pathToFileURL(modulePath).href)]);
const themes = ['foundry','ruins','storm','clockwork','void'];
function fixture(theme,floor=0){return Object.freeze({runToken:'vista-contract',floor,theme,
  chunkBaseY:floor*360000,chunkHeight:360000,worldWidth:480000,
  platforms:[],hazards:[]});}

test('three original geological distance strata wrap all five biomes with finite bounded geometry',async()=>{
  const [THREE,{createVistaLayerGeometry,VISTA_PALETTES}]=await loaded;
  assert.deepEqual(Object.keys(VISTA_PALETTES),themes);
  const counts=[15,20,25];let firstColors=[];
  for(const theme of themes){
    const layers=[];
    for(let layer=0;layer<3;layer++){
      const g=createVistaLayerGeometry(THREE,theme,layer,36);
      try{
        const a=g.getAttribute('position'),c=g.getAttribute('color');
        assert.equal(a.count,counts[layer]*8*9*6);
        assert.equal(c.count,a.count);
        assert.ok(a.count<=11000,'individual layer vertex budget');
        for(let i=0;i<a.count;i++){
          const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
          assert.ok([x,y,z,c.getX(i),c.getY(i),c.getZ(i)].every(Number.isFinite));
          assert.ok(Math.hypot(x,z)>201, 'even maximum-zoom overview remains inside distant world');
          assert.ok(y>=-180&&y<=180,'distance structures stay within bounded atmospheric horizon');
        }
        layers.push(Array.from(a.array.slice(0,24)).join(','));
        if(layer===0)firstColors.push(Array.from(c.array.slice(0,9)).join(','));
        const repeated=createVistaLayerGeometry(THREE,theme,layer,36);
        try{assert.deepEqual(repeated.getAttribute('position').array,a.array,'same biome/snapshot has stable vistas');}
        finally{repeated.dispose();}
      }finally{g.dispose();}
    }
    assert.equal(new Set(layers).size,3,'parallax layers must not be copies');
  }
  assert.equal(new Set(firstColors).size,5,'biomes require different authored distance palettes');
  assert.throws(()=>createVistaLayerGeometry(THREE,'invalid',1,36),/Invalid tower vista/);
});

test('floor-owned vista renders as one shadow-free depth-tested draw, outside collision and camera paths',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();let priorMesh=null;
  try{
    for(let floor=0;floor<themes.length;floor++){
      const before=fixture(themes[floor],floor);const unchanged=JSON.stringify(before);
      world.update(before,0,0,{quality:'low',reducedMotion:true});
      const vista=world.group.getObjectByName('tower-canyon-vista');
      assert.ok(vista,'all biomes need authored atmospheric scale');
      assert.equal(vista.children.length,1,'three depth strata share exactly one floor draw');
      const cliff=vista.children[0];
      assert.equal(cliff.name,'tower-vista-cliffs');
      assert.equal(cliff.material.name,'tower-vista-atmosphere');
      assert.equal(cliff.material.vertexColors,true);
      assert.equal(cliff.material.depthTest,true);
      assert.equal(cliff.castShadow,false);
      assert.equal(cliff.receiveShadow,false);
      const d=world.diagnostics();
      assert.equal(d.vistaLayers,3);
      assert.equal(d.vistaTriangles,8640);
      assert.ok(d.meshes+d.shadowCasterMeshes<=100,'keep original world submission budget');
      for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        const origin=new THREE.Vector3(Math.sin(angle)*197,32,Math.cos(angle)*197);
        const target=new THREE.Vector3(Math.sin(angle)*25,26,Math.cos(angle)*25);
        const direction=target.clone().sub(origin),length=direction.length();
        assert.equal(new THREE.Raycaster(origin,direction.normalize(),0,length).intersectObject(vista,true).length,0,
          'no background cliff may cross the camera-to-real-gameplay line');
      }
      assert.equal(JSON.stringify(before),unchanged,'atmosphere cannot change authority');
      assert.ok(priorMesh===null||!world.group.getObjectById(priorMesh.id),'previous floor vista removed from the active scene');
      priorMesh=cliff;
    }
  }finally{world.dispose();}
  assert.equal(world.diagnostics().vistaLayers,0,'complete teardown retires the panorama');
});

// Real-frame portrait readability regression, not a transform quality vote.
// The clock case and its gear share the same already-existing private alloy
// opacity so this protection includes the backing, not merely open spokes.
test('portrait giant foreground clockwork is subordinated to the real climber while gameplay geometry remains opaque',async()=>{
  const [,{observedPortraitGearDominance}]=await loaded;
  const witnessed={
    aspect:390/844,
    gear:{x:.1,y:.15,z:0}, radius:1.25,gearDepth:35,
    actor:{x:.1,y:.1,z:0},actorDepth:70
  };
  const near=observedPortraitGearDominance(witnessed);
  assert.ok(near>=.18-1e-9 && near<=.20,
    'source-front giant dial must yield to hero with the new stronger full-stack opacity budget');
  const middle=observedPortraitGearDominance({...witnessed,radius:.8});
  assert.ok(middle>near&&middle<1,
    'fade smoothly with actual apparent perspective size');
  assert.equal(observedPortraitGearDominance({...witnessed,aspect:960/600}),1,
    'keep desktop clockwork staging and depth materials');
  assert.equal(observedPortraitGearDominance({...witnessed,gearDepth:80}),1,
    'do not erase decor which lies BEHIND the player');
  assert.equal(observedPortraitGearDominance({
    ...witnessed,gear:{x:7,y:.1,z:0}
  }),1,'do not erase peripheral architecture');
  assert.equal(observedPortraitGearDominance({...witnessed,radius:.22}),1,
    'retain small detail that does not visually overwhelm');
  assert.equal(observedPortraitGearDominance({...witnessed,actorDepth:NaN}),1,
    'stale/corrupt projections may not unlock a synthetic fade');
  assert.match(raw,/const dominance=observedPortraitGearDominance\(/,
    'the shipped scene must consume the composition contract');
  assert.match(raw,/const protectedClockFace=syncClockFaceSightline\(entry\)/,
    'both gear teeth and decorative backing must share the actual fade');
});
