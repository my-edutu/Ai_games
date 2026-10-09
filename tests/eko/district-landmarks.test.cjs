'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
const fs=require('node:fs');
const path=require('node:path');
test('each of the six neighborhoods has original readable curved landmark identity, away from hazard lane',async()=>{
  const code=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/district-landmarks.js'),'utf8');
  const {buildDistrictLandmarks}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const base=new THREE.BoxGeometry(1,1,1);
  const sphere=new THREE.SphereGeometry(1,8,6);
  const helper=geo=>(parent,w,h,d,x,y,z,color)=>{
    const obj=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color}));
    obj.position.set(x,y,z);obj.scale.set(w,h,d);parent.add(obj);return obj;
  };
  const helpers={
    box:helper(base),
    cylinder:(parent,rTop,rBottom,height,x,y,z,color)=>{
      const obj=new THREE.Mesh(base,new THREE.MeshStandardMaterial({color}));
      obj.position.set(x,y,z);obj.scale.set(rTop,height,rBottom);parent.add(obj);return obj;
    },
    ball:(parent,r,x,y,z,color)=>{
      const obj=new THREE.Mesh(sphere,new THREE.MeshStandardMaterial({color}));
      obj.position.set(x,y,z);obj.scale.setScalar(r);parent.add(obj);return obj;
    },
    material:color=>new THREE.MeshStandardMaterial({color}),
    labelSprite:(parent,text,x,y,z)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial());s.position.set(x,y,z);s.name=text;parent.add(s);return s;}
  };
  const districts=['mainland-morning','market-rush','danfo-junction','rainy-lagos','island-night','bridge-run'];
  const names=[];
  for(const district of districts){
    const terrain=new THREE.Group();
    const model=buildDistrictLandmarks(THREE,{terrain,district,length:170,quality:'high',...helpers});
    assert.equal(model.district,district);
    assert.equal(model.authorityNeutral,true);
    assert.equal(model.stations,2);
    assert.ok(model.meshCount>=30,'landmark should have bespoke non-trivial geometry');
    assert.ok(model.arches>=6,'three curved arches per site');
    assert.ok(model.signs.length>=2);
    names.push(model.signs[0]);
    let meshCount=0;
    terrain.traverse(node=>{
      if(!node.isMesh)return;meshCount++;
      assert.ok(Number.isFinite(node.position.z) && node.position.z<=-5.0,`invalid/street-occluding mesh in ${district}: ${node.name} at ${node.position.z}`);
    });
    assert.ok(meshCount>=35);
  }
  assert.equal(new Set(names).size,6,'every district must carry different place identity');
});
test('the landmarks use a bounded resource budget for giant imaginary routes',async()=>{
  const code=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/district-landmarks.js'),'utf8');
  const {buildDistrictLandmarks}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const terrain=new THREE.Group();
  const obj=buildDistrictLandmarks(THREE,{terrain,district:'bridge-run',length:99999,
    quality:'low',
    box:(group,w,h,d,x,y,z,c)=>{let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:c}));o.position.set(x,y,z);group.add(o);return o;},
    ball:(group,r,x,y,z,c)=>{let o=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial({color:c}));o.position.set(x,y,z);group.add(o);return o;},
    cylinder:(group,r1,r2,h,x,y,z,c)=>{let o=new THREE.Mesh(new THREE.BoxGeometry(.2,h,.2),new THREE.MeshBasicMaterial({color:c}));o.position.set(x,y,z);group.add(o);return o;},
    material:c=>new THREE.MeshBasicMaterial({color:c}),
    labelSprite:(group,txt,x,y,z)=>{let o=new THREE.Sprite(new THREE.SpriteMaterial());o.position.set(x,y,z);group.add(o);return o;}
  });
  assert.ok(obj.stations<=3);
  assert.ok(obj.meshCount<400);
});
