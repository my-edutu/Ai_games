'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
test('each public Lagos hazard has a distinct original silhouette and stable collision center',async()=>{
  const js=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/hazard-sculpt.js'),'utf8');
  const {sculptStreetHazard}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
  const parent=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0xffffff});
  const sphere=new THREE.SphereGeometry(1,8,6);
  const cube=new THREE.BoxGeometry(1,1,1);
  const helper=(geometry)=>(group,w,h,d,x,y,z)=>{
    const mesh=new THREE.Mesh(geometry,mat);
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
    group.add(mesh);return mesh;
  };
  const helpers={
    box:helper(cube),
    ball:helper(sphere),
    cylinder:helper(cube),
    material:(hex)=>new THREE.MeshStandardMaterial({color:hex}),
    labelSprite:(group,text,x,y,z)=>{
      const s=new THREE.Sprite(new THREE.SpriteMaterial());s.name=text;
      s.position.set(x,y,z);group.add(s);return s;
    },
    makeBus:(group)=>{const c=new THREE.Group();group.add(c);return c;},
    makePedestrian:(group)=>{const c=new THREE.Group();group.add(c);return c;},
  };
  const plans=[
    ['pothole',1.1,.25,['jump']],['open-drain',1.35,.35,['jump']],
    ['construction-trench',1.45,.45,['jump']],['flood-puddle',2.4,.18,['slow','jump']],
    ['handcart',1.2,1.15,['slow','wait']],['rolling-object',.7,.7,['jump','wait']],
    ['temporary-block',1.4,.85,['vault']],['crowd-compression',2,1.8,['slow']],
    ['street-disturbance',1.8,1.7,['wait']],['danfo-pull-out',1.8,1.7,['wait']]
  ];
  const detailLevels=new Set();
  for(const [family,width,height,legalResponses] of plans){
    const h={family,width,height,legalResponses,x:12,phase:'warned'};
    const model=sculptStreetHazard(THREE,parent,h,helpers);
    assert.equal(model.artFamily,family);
    assert.ok(model.featureCount>=1);
    assert.ok(model.root.parent===parent,'hazards must not escape their cosmetic scene graph');
    assert.ok(model.marker);
    assert.equal(model.root.position.x,0,'visual model must not shift collision centers');
    assert.match(model.root.name,/hazard-visual/);
    detailLevels.add(model.featureCount);
  }
  assert.ok(detailLevels.size>=5,'hazard families must have meaningfully different silhouettes');
  assert.equal(parent.children.length,plans.length);
  assert.throws(()=>sculptStreetHazard(THREE,parent,{width:NaN,height:1},helpers),TypeError);
});
