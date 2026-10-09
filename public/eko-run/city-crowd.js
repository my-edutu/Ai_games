// Eko Run original Lagos street crowd — lightweight cosmetic visual life.
// Instanced limbs/heads/costumes, not authoritative players or physical obstacles.
export function createCityCrowd(THREE,scene,{capacity=32}={}){
  const MAX=Math.min(48,Math.max(4,capacity|0));
  const root=new THREE.Group();root.name='Eko sidewalk community';scene.add(root);
  const geometries={
    torso:new THREE.CylinderGeometry(.30,.37,.82,8,1),
    head:new THREE.SphereGeometry(.28,10,8),
    arm:new THREE.CapsuleGeometry(.075,.44,3,6),
    leg:new THREE.CapsuleGeometry(.108,.43,3,6),
    hair:new THREE.SphereGeometry(.30,10,8),
    hat:new THREE.CylinderGeometry(.28,.30,.16,10),
    accessory:new THREE.BoxGeometry(.29,.38,.20),
    shoe:new THREE.BoxGeometry(.29,.14,.19),
  };
  const materials={};
  const parts={};
  const keys=['torso','head','hair','hat','armLeft','armRight','legLeft','legRight','shoeLeft','shoeRight','accessory'];
  const geometryOf={torso:'torso',head:'head',hair:'hair',hat:'hat',
    armLeft:'arm',armRight:'arm',legLeft:'leg',legRight:'leg',
    shoeLeft:'shoe',shoeRight:'shoe',accessory:'accessory'};
  for(const key of keys){
    const material=new THREE.MeshStandardMaterial({roughness:.88,metalness:.03});
    const mesh=new THREE.InstancedMesh(geometries[geometryOf[key]],material,MAX);
    mesh.name='Community '+key;mesh.castShadow=false;mesh.receiveShadow=false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
    root.add(mesh);parts[key]=mesh;materials[key]=material;
  }
  const capsules=[];
  const rgb={skin:[0x7a492f,0x996443,0x553525,0xbd8867,0x65432e],
    dress:[0x14aba0,0xff9e47,0x2b7cbb,0xb34d82,0xffc259,0x6850ac,0x1b7280],
    bottoms:[0x254355,0x3e476b,0x4e665a,0x7a5540,0x34353e]};
  const temp=new THREE.Object3D();
  let positions=[],active=0,updated=0,viewX=0,district='';
  const h=n=>{let x=Math.imul((n|0)+113,2654435761)>>>0;x^=x>>>15;x=Math.imul(x,2246822519)>>>0;return (x>>>0)/4294967295;};
  const choose=(a,s)=>a[Math.floor(h(s)*a.length)%a.length];
  function paint(mesh,id,color){mesh.setColorAt(id,new THREE.Color(color));}
  function layout(districtId,length){
    district=districtId;
    const limit=Math.max(8,Math.floor(Math.min(length,180)/4.7));
    active=Math.min(MAX,limit);
    positions=[];
    for(let i=0;i<MAX;i++){
      const onStage=i<active,along=(i+.5)*length/Math.max(active,1);
      positions.push({x:along+(h(i+303)-.5)*2.3,z:-4.73-(i%4)*.22,
        phase:h(i+411)*Math.PI*2,energy:.75+h(i+622)*.30,
        speed:.22+h(i+744)*.22,scale:.86+h(i+895)*.22,active:onStage});
      const tone=choose(rgb.skin,i+88),shirt=choose(rgb.dress,i+211);
      paint(parts.torso,i,shirt);paint(parts.head,i,tone);
      paint(parts.armLeft,i,tone);paint(parts.armRight,i,tone);
      paint(parts.legLeft,i,choose(rgb.bottoms,i+31));
      paint(parts.legRight,i,choose(rgb.bottoms,i+31));
      paint(parts.hair,i,choose([0x171c24,0x262027,0x372a2b],i+14));
      paint(parts.hat,i,choose(rgb.dress,i+94));
      paint(parts.shoeLeft,i,choose([0xf2dbb7,0x182c36,0xb0bbc6],i+22));
      paint(parts.shoeRight,i,choose([0xf2dbb7,0x182c36,0xb0bbc6],i+22));
      paint(parts.accessory,i,choose(rgb.dress,i+174));
    }
    for(const mesh of Object.values(parts)){
      mesh.count=active;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    }
    return Object.freeze({characters:active,instancedDrawCalls:keys.length});
  }
  const up=new THREE.Vector3(0,0,1);
  function set(key,index,x,y,z,sx,sy,sz,angle=0){
    temp.position.set(x,y,z);temp.scale.set(sx,sy,sz);
    temp.rotation.set(0,0,angle);temp.updateMatrix();
    parts[key].setMatrixAt(index,temp.matrix);
  }
  function animate(now,quality='high'){
    for(let i=0;i<active;i++){
      const p=positions[i];
      const phase=now*.001*2.3*p.energy+p.phase;
      const walking=quality==='low'?0:Math.sin(phase);
      const bob=Math.abs(walking)*.035;
      const x=p.x+Math.sin(now*.001*p.speed+p.phase)*.65;
      const z=p.z,scale=p.scale;
      const r=walking*.28;
      set('torso',i,x,1.18*scale+bob,z,.91*scale,1.00*scale,.93*scale,r*.05);
      set('head',i,x,1.87*scale+bob,z,.91*scale,.91*scale,.91*scale);
      set('hair',i,x-.03,2.09*scale+bob,z,.91*scale,.38*scale,.91*scale);
      set('hat',i,x-.03,2.18*scale+bob,z,.84*scale,(i%3===0?.80:.12)*scale,.86*scale);
      set('armLeft',i,x-.33*scale,1.29*scale+bob,z,.93*scale,.78*scale,.93*scale,r);
      set('armRight',i,x+.33*scale,1.29*scale+bob,z,.93*scale,.78*scale,.93*scale,-r);
      set('legLeft',i,x-.16*scale,.48*scale,z,.98*scale,1.02*scale,.98*scale,-r);
      set('legRight',i,x+.16*scale,.48*scale,z,.98*scale,1.02*scale,.98*scale,r);
      set('shoeLeft',i,x-.16*scale,.10*scale,z,.95*scale,.91*scale,1.05*scale);
      set('shoeRight',i,x+.16*scale,.10*scale,z,.95*scale,.91*scale,1.05*scale);
      set('accessory',i,x+.41*scale,1.11*scale+bob,z+.21*scale,.84*scale,.80*scale,.84*scale,-r*.12);
    }
    for(const mesh of Object.values(parts))mesh.instanceMatrix.needsUpdate=true;
    updated++;
  }
  function dispose(){
    scene.remove(root);
    for(const mesh of Object.values(parts))mesh.dispose();
    for(const material of Object.values(materials))material.dispose();
    for(const geometry of Object.values(geometries))geometry.dispose();
  }
  return Object.freeze({root,layout,animate,dispose,
    metrics(){return Object.freeze({avatars:active,drawCalls:keys.length,frames:updated,district});}
  });
}
