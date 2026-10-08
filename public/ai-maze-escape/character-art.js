// Stylised cinematic character art. All models are original procedurally sculpted 3D meshes.
// No remote assets, texture downloads, or hidden maze data are involved.
export function makeCharacterArt(THREE){
  const geo={
    sphere:new THREE.SphereGeometry(1,24,16),
    boot:new THREE.SphereGeometry(1,16,12),
    cylinder:new THREE.CylinderGeometry(1,1,1,16),
    disk:new THREE.CylinderGeometry(1,1,.08,22),
    plane:new THREE.PlaneGeometry(1,1),
    capePlane:new THREE.PlaneGeometry(1,1,12,14),
    cone:new THREE.ConeGeometry(1,1,16),
    cube:new THREE.BoxGeometry(1,1,1),
    icosa:new THREE.IcosahedronGeometry(1,1),
    torus:new THREE.TorusGeometry(1,.11,9,32),
    triangle:new THREE.TetrahedronGeometry(1,0)
  };
  const mat={
    cloak:new THREE.MeshStandardMaterial({color:0x237ed0,roughness:.81,metalness:.04,side:THREE.DoubleSide}),
    robe:new THREE.MeshStandardMaterial({color:0x194067,roughness:.92,side:THREE.DoubleSide}),
    turquoise:new THREE.MeshStandardMaterial({color:0x38ebde,emissive:0x186b7c,emissiveIntensity:.45,roughness:.52}),
    mantle:new THREE.MeshStandardMaterial({color:0x7d3ed5,roughness:.86,side:THREE.DoubleSide}),
    royalTrim:new THREE.MeshStandardMaterial({color:0xffe1a0,metalness:.65,roughness:.26,side:THREE.DoubleSide}),
    leather:new THREE.MeshStandardMaterial({color:0x482f34,roughness:.94}),
    chest:new THREE.MeshStandardMaterial({color:0x47637a,metalness:.3,roughness:.49}),
    hair:new THREE.MeshStandardMaterial({color:0x1e2238,roughness:.91}),
    skin:new THREE.MeshStandardMaterial({color:0xe4ab8f,roughness:.84}),
    eyes:new THREE.MeshBasicMaterial({color:0xc9fff4}),
    glowing:new THREE.MeshBasicMaterial({color:0x87fff3}),
    shadow:new THREE.MeshStandardMaterial({color:0x2a1c37,roughness:.91,side:THREE.DoubleSide}),
    shadowTrim:new THREE.MeshStandardMaterial({color:0x5b305b,metalness:.2,roughness:.64,side:THREE.DoubleSide}),
    shadowEyes:new THREE.MeshBasicMaterial({color:0xff6485}),
    shadowCore:new THREE.MeshStandardMaterial({color:0x882d59,emissive:0x711d50,emissiveIntensity:1.5,roughness:.36}),
    shadowGold:new THREE.MeshStandardMaterial({color:0xba7a9d,metalness:.65,roughness:.24}),
  };
  const longRobeProfile=[
    [0,0.02],[.39,.03],[.51,.11],[.50,.22],[.43,.37],
    [.39,.55],[.38,.88],[.31,1.22],[.29,1.43],[.12,1.49],[0,1.49]
  ].map(([x,y])=>new THREE.Vector2(x,y));
  const shadowProfile=[
    [0,.01],[.65,.03],[.78,.18],[.6,.38],[.51,.6],[.38,1.13],
    [.43,1.54],[.26,1.73],[0,1.82]
  ].map(([x,y])=>new THREE.Vector2(x,y));
  const robeGeo=new THREE.LatheGeometry(longRobeProfile,32);
  const shadowGeo=new THREE.LatheGeometry(shadowProfile,30);
  const foldGeo=new THREE.CylinderGeometry(.47,.61,.49,13,3,true);
  function obj(parent,geometry,material,pos=[0,0,0],scale=[1,1,1]){
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.castShadow=true;mesh.receiveShadow=true;
    parent.add(mesh);
    return mesh;
  }
  function clothMesh(width,height,color){
    // A genuinely curved, pleated surface instead of a rigid rectangular cape.
    const nx=12,ny=14,verts=[],uv=[],indices=[];
    for(let y=0;y<=ny;y++){
      const t=y/ny;
      for(let x=0;x<=nx;x++){
        const across=x/nx*2-1;
        const w=width*(.36+.52*t);
        const folds=Math.sin(across*Math.PI*5)*(.05+.09*t);
        const xPos=across*w;
        const zPos= -.12-t*t*.38+folds;
        verts.push(xPos,-t*height,zPos);
        uv.push(x/nx,t);
      }
    }
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
      const v=y*(nx+1)+x;
      indices.push(v,v+1,v+nx+1,v+1,v+nx+2,v+nx+1);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return obj(new THREE.Group(),g,color);
  }
  function explorer(){
    const hero=new THREE.Group();
    hero.name='The Wayfinder — Autonomous Explorer';
    obj(hero,robeGeo,mat.cloak,[0,.23,0],[1,1,1]);
    obj(hero,foldGeo,mat.robe,[0,.44,-.06],[.78,.76,.82]);
    // Inlaid travel armour, layered double straps and a hand-carved belt buckle.
    obj(hero,geo.sphere,mat.chest,[0,1.23,.05],[.37,.4,.26]);
    obj(hero,geo.cylinder,mat.royalTrim,[0,.87,0],[.41,.07,.36]);
    obj(hero,geo.icosa,mat.turquoise,[0,1.19,.28],[.13,.2,.06]);
    obj(hero,geo.cube,mat.royalTrim,[0,.87,.33],[.19,.13,.07]);
    for(const sign of [-1,1]){
      const belt=obj(hero,geo.cube,mat.leather,[sign*.17,1.19,.25],[.08,.68,.06]);
      belt.rotation.z=sign*.3;
      obj(hero,geo.sphere,mat.royalTrim,[sign*.31,1.4,-.04],[.22,.11,.28]);
    }
    // Packed supplies and metal clasp make the silhouette readable in camera shots.
    obj(hero,geo.cube,mat.leather,[0,1.12,-.38],[.57,.57,.28]);
    obj(hero,geo.cube,mat.royalTrim,[0,1.1,-.53],[.40,.08,.05]);
    const neck=obj(hero,geo.cylinder,mat.skin,[0,1.54,.05],[.14,.24,.13]);
    neck.rotation.z=.1;
    const head=new THREE.Group();
    head.position.set(0,1.72,.06);
    hero.add(head);hero.userData.head=head;
    obj(head,geo.sphere,mat.skin,[0,.05,.04],[.26,.31,.25]);
    obj(head,geo.sphere,mat.hair,[0,.18,-.09],[.31,.31,.31]);
    // Brow and eyebrows produce a face at screenshot resolution.
    obj(head,geo.sphere,mat.skin,[0,.06,.20],[.24,.205,.14]);
    obj(head,geo.sphere,mat.leather,[0,-.09,.335],[.10,.027,.024]);
    for(const sign of [-1,1]){
      obj(head,geo.sphere,mat.eyes,[sign*.11,.105,.338],[.051,.034,.02]);
      obj(head,geo.sphere,mat.hair,[sign*.11,.157,.332],[.095,.028,.021]);
    }
    // Actual pivoted limbs, not rotating an in-place cylinder at its centre.
    const limbs=[];
    for(const side of [-1,1]){
      const shoulder=new THREE.Group();
      shoulder.position.set(side*.39,1.43,.03);
      hero.add(shoulder);
      obj(shoulder,geo.sphere,mat.cloak,[0,-.19,0],[.20,.35,.22]);
      obj(shoulder,geo.sphere,mat.chest,[0,-.42,.05],[.17,.21,.17]);
      obj(shoulder,geo.sphere,mat.royalTrim,[0,-.40,.17],[.07,.08,.07]);
      obj(shoulder,geo.sphere,mat.skin,[0,-.60,.04],[.15,.16,.16]);
      const hip=new THREE.Group();
      hip.position.set(side*.22,.68,0);
      hero.add(hip);
      obj(hip,geo.sphere,mat.leather,[0,-.28,0],[.19,.35,.18]);
      obj(hip,geo.boot,mat.leather,[0,-.53,.18],[.20,.18,.33]);
      obj(hip,geo.cube,mat.royalTrim,[0,-.41,.29],[.30,.05,.05]);
      limbs.push({arm:shoulder,leg:hip,side});
    }
    hero.userData.limbs=limbs;
    // Cloth is a curved two-sided surface with an embroidered lower hem.
    const capeRig=new THREE.Group();
    capeRig.position.set(0,1.50,-.19);
    const cape=clothMesh(.61,1.33,mat.mantle);capeRig.add(cape); 
    const hem=clothMesh(.61,.12,mat.royalTrim);
    hem.position.y=-1.16;
    hem.scale.set(1,.18,1);
    capeRig.add(hem);
    hero.add(capeRig);hero.userData.capeRig=capeRig;
    // Lantern physically belongs to the wrist and is tracked by the scene's moving point light.
    const lantern=new THREE.Group();
    lantern.position.set(.63,.59,.25);
    hero.add(lantern);
    obj(lantern,geo.cylinder,mat.royalTrim,[0,0,0],[.14,.42,.14]);
    obj(lantern,geo.icosa,mat.turquoise,[0,.02,0],[.16,.20,.16]);
    obj(lantern,geo.torus,mat.royalTrim,[0,.28,0],[.18,.18,.18]).rotation.x=Math.PI/2;
    obj(lantern,geo.disk,mat.royalTrim,[0,-.24,0],[.16,1,.16]);
    hero.userData.lantern=lantern;
    return hero;
  }
  function wraith(){
    const group=new THREE.Group();
    group.name='The Hollow Sentinel — Hunting Wraith';
    obj(group,shadowGeo,mat.shadow,[0,.28,0],[1,1,1]);
    // Overlapping trailing strips give a skeletal, wind-torn creature silhouette.
    for(let n=0;n<8;n++){
      const t=n*Math.PI/4,r=.47;
      const rag=obj(group,geo.cone,n%3===0?mat.shadowTrim:mat.shadow,
        [Math.cos(t)*r,.28,Math.sin(t)*r],[.22,.68+(n%3)*.17,.20]);
      rag.rotation.z=Math.cos(t)*.2;
    }
    const torso=obj(group,geo.sphere,mat.shadowTrim,[0,1.46,0],[.43,.54,.34]);
    obj(group,geo.icosa,mat.shadowCore,[0,1.49,.33],[.17,.25,.1]);
    const crown=new THREE.Group();crown.position.set(0,1.85,0);group.add(crown);
    obj(crown,geo.sphere,mat.shadow,[0,0,0],[.42,.43,.42]);
    for(let n=-2;n<=2;n++){
      const horn=obj(crown,geo.cone,n%2?mat.shadowGold:mat.shadowTrim,
        [n*.18,.49-(Math.abs(n)*.11),-.08],[.11,.39,.11]);
      horn.rotation.z=n*.16;
    }
    for(const sign of [-1,1]){
      obj(crown,geo.sphere,mat.shadowEyes,[sign*.18,.02,.375],[.115,.10,.065]);
      const arm=obj(group,geo.cone,mat.shadow,
        [sign*.5,.86,-.10],[.16,.92,.17]);arm.rotation.z=sign*.28;
      obj(group,geo.icosa,mat.shadowGold,[sign*.47,1.36,.05],[.2,.24,.25]);
    }
    return group;
  }
  return {explorer,wraith,geometries:{...geo,robeGeo,shadowGeo},materials:mat};
}
