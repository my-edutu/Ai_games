// Original volumetric tower architecture and atmospheric art; all shapes are real 3D meshes.
// Geometry/materials are allocated once and persist across deterministic game-state updates.
export function createTowerEnvironment(THREE,scene) {
  const root=new THREE.Group();root.name='Monumental tower';scene.add(root);
  const sandstone=new THREE.MeshStandardMaterial({color:0x506475,metalness:0.08,roughness:0.95});
  const shadowStone=new THREE.MeshStandardMaterial({color:0x28374e,metalness:0.12,roughness:0.9});
  const edgeStone=new THREE.MeshStandardMaterial({color:0x80939a,metalness:0.38,roughness:0.66});
  const bronze=new THREE.MeshStandardMaterial({color:0x9f7850,metalness:0.82,roughness:0.31});
  const glow=new THREE.MeshStandardMaterial({color:0xf7cf98,emissive:0xe5a559,emissiveIntensity:1.3,metalness:0.45,roughness:0.4});
  // Procedural cracked limestone albedo: texture is deterministic and bundled in source.
  function masonryTexture(){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext('2d');
    let seed=20261008;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    ctx.fillStyle='#e8e6db';ctx.fillRect(0,0,512,512);
    const rowH=64;
    for(let row=0;row<8;row++){
      const offset=(row%2)*38;
      for(let col=-1;col<9;col++){
        const x=col*76-offset, y=row*rowH,shade=Math.floor(188+rand()*55);
        ctx.fillStyle='rgb('+shade+','+Math.min(255,shade+1)+','+Math.min(255,shade+4)+')';
        ctx.fillRect(x+2,y+2,72,60);
        ctx.strokeStyle='rgba(53,46,40,.3)';ctx.lineWidth=2;ctx.strokeRect(x+2,y+2,72,60);
        for(let n=0;n<16;n++){
          const xx=x+rand()*73,yy=y+rand()*60;
          ctx.fillStyle=rand()>.5?'rgba(20,25,29,.06)':'rgba(255,250,230,.13)';
          ctx.fillRect(xx,yy,2+rand()*9,1+rand()*5);
        }
      }
    }
    ctx.lineWidth=1.3;ctx.strokeStyle='rgba(45,40,44,.24)';
    for(let i=0;i<24;i++){
      const x=rand()*512,y=rand()*512;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*27-13,y+rand()*18);ctx.lineTo(x+rand()*35-17,y+rand()*33);ctx.stroke();
    }
    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    return texture;
  }
  const stoneDetail=masonryTexture();sandstone.map=stoneDetail;shadowStone.map=stoneDetail;edgeStone.map=stoneDetail;
  const materials=[sandstone,shadowStone,edgeStone,bronze,glow];
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const geoCache=new Map();
  const cylinderGeometry=(top,bottom,height,segments)=>{const key=[top,bottom,height,segments].join(':');if(!geoCache.has(key))geoCache.set(key,new THREE.CylinderGeometry(top,bottom,height,segments));return geoCache.get(key)};
  function block(parent,x,y,z,w,h,d,mat=sandstone) {
    const m=new THREE.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);
    m.receiveShadow=true;parent.add(m);return m;
  }
  function cylinder(parent,x,y,z,rTop,rBottom,h,mat,segments=12) {
    const m=new THREE.Mesh(cylinderGeometry(rTop,rBottom,h,segments),mat);
    m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;
  }
  function arch(parent,x,y,z,width,height,material=sandstone) {
    // Square base with semicircular crown. Open center reveals deep background.
    block(parent,x-width/2+.35,y+height*.35,z,.7,height*.7,1.25,material);
    block(parent,x+width/2-.35,y+height*.35,z,.7,height*.7,1.25,material);
    const points=[];for(let i=0;i<=14;i++){const a=Math.PI*i/14;points.push(new THREE.Vector3(x+Math.cos(a)*(width/2-.3),y+height*.7+Math.sin(a)*width*.24,z));}
    const curve=new THREE.CatmullRomCurve3(points);
    const crown=new THREE.Mesh(new THREE.TubeGeometry(curve,38,.28,6,false),edgeStone);
    parent.add(crown);return crown;
  }
  // The background is built from depth-separated castle layers, not a textured 2D backdrop.
  block(root,0,0,-28,86,290,2,shadowStone);
  for(let tier=-11;tier<=11;tier++){
    const y=tier*12;
    // Basalt stone buttresses and windowed vaulted masonry.
    for(let col=-5;col<=5;col++){
      const x=col*6;
      if(col!==0){
        block(root,x,y,-21,5.8,11.5,1.35,(tier+col)%3===0?shadowStone:sandstone);
        block(root,x,y+5.5,-20.1,5.9,.34,1.7,edgeStone);
        for(let brick=0;brick<3;brick++)
          block(root,x-1.1+(brick%2)*1.5,y-3.5+brick*3,-19.35,1.8,.08,.13,shadowStone);
      }
    }
    // Repeated vaulted openings suggest a real interior behind the climbable spaces.
    for(const x of [-12,0,12]){
      block(root,x,y,-21.0,5.2,8.9,.11,shadowStone);
      arch(root,x,y-5,-19.8,5.5,9.7,edgeStone);
      cylinder(root,x,y-1.2,-19.5,.1,.1,4,bronze,7);
    }
    block(root,0,y-5.8,-18.4,70,.45,1.3,bronze);
    block(root,0,y-5.45,-18.2,69.6,.15,1.25,edgeStone);
    for(const x of [-23,-11,11,23]){
      const light=cylinder(root,x,y+3,-17.8,.34,.34,1.4,bronze,8);
      block(root,x,y+3.5,-16.9,.68,.28,.68,glow);
      block(root,x,y+2.6,-16.9,.75,.15,.75,bronze);
    }
  }
  for(const x of [-29,-16,16,29]){
    block(root,x,0,-13,3.2,295,3.5,shadowStone);
    for(let tier=-12;tier<=12;tier++){
      block(root,x,tier*12,-12.5,4.3,.72,4.3,edgeStone);
      const capital=cylinder(root,x,tier*12+.42,-12.4,2.15,1.7,.66,bronze,8);
      capital.rotation.y=Math.PI/8;
    }
  }
  // Giant cross-beams are physically placed in front of the rear wall.
  for(let tier=-8;tier<=8;tier++){
    const y=tier*15+5;
    block(root,0,y,-10.8,66,.5,1.4,shadowStone);
    for(let x=-24;x<=24;x+=8){
      const rune=block(root,x,y,-9.95,1.15,.15,.16,glow);
      rune.rotation.z=(tier%2)*.13;
    }
  }
  // A few foreground pillars create parallax, scale and believable depth.
  for(const x of [-37,37]){
    cylinder(root,x,0,6,2.5,3.15,300,sandstone,10);
    for(let y=-130;y<=130;y+=11){
      cylinder(root,x,y,6,3.25,2.5,.8,edgeStone,10);
      block(root,x,y+.4,7.8,1.5,.16,.1,bronze);
    }
  }
  // Batch repeated 3D stonework into instanced meshes to keep GPU draw calls bounded.
  const groups=new Map();
  for (const object of [...root.children]){
    if (!object.isMesh)continue;
    const key=object.geometry.uuid+'/'+object.material.uuid;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(object);
  }
  for(const group of groups.values()){
    if(group.length<3)continue;
    const instanced=new THREE.InstancedMesh(group[0].geometry,group[0].material,group.length);
    instanced.name='Batched stonework';instanced.receiveShadow=true;
    group.forEach((object,i)=>{object.updateMatrix();instanced.setMatrixAt(i,object.matrix);root.remove(object)});
    instanced.instanceMatrix.needsUpdate=true;root.add(instanced);
  }
  // Dust motes are real 3D points distributed throughout the shaft.
  const count=560,verts=new Float32Array(count*3);
  let seed=248201;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<count;i++){
    verts[i*3]=(rand()-.5)*60;verts[i*3+1]=(rand()-.5)*260;verts[i*3+2]=rand()*18-13;
  }
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(verts,3));
  const dustMaterial=new THREE.PointsMaterial({color:0xffd9ad,size:0.065,transparent:true,opacity:.32,depthWrite:false});
  const motes=new THREE.Points(dustGeo,dustMaterial);root.add(motes);
  const palette={
    foundry:{stone:0x625a5c,shadow:0x292b3f,bronze:0xaf6c43,glow:0xffa857,fog:0x1c2131},
    ruins:{stone:0x74806a,shadow:0x2b3c32,bronze:0x9a815b,glow:0xa9d5a1,fog:0x1c302b},
    clockwork:{stone:0x4c5d70,shadow:0x2a3445,bronze:0xc19a52,glow:0xffc879,fog:0x252739},
    storm:{stone:0x697083,shadow:0x27273e,bronze:0xb0a3a0,glow:0xb6c9ff,fog:0x252339},
    void:{stone:0x61547b,shadow:0x29243f,bronze:0x9d81ad,glow:0xbb87ff,fog:0x1b1530}
  };
  let current='';
  function setTheme(name){
    const theme=String(name||'foundry').toLowerCase();
    if(theme===current)return;
    current=theme;const p=palette[theme]||palette.foundry;
    sandstone.color.setHex(p.stone);shadowStone.color.setHex(p.shadow);
    bronze.color.setHex(p.bronze);glow.color.setHex(p.glow);glow.emissive.setHex(p.glow);
    dustMaterial.color.setHex(p.glow);
    if(scene.fog)scene.fog.color.setHex(p.fog);scene.background.setHex(p.fog);
  }
  function animate(time,reduced=false){
    if(!reduced){motes.rotation.y=Math.sin(time*.1)*.025;dustMaterial.opacity=.28+Math.sin(time*.7)*.05;}
  }
  setTheme('foundry');
  return {root,materials,setTheme,animate,signature:'monumental-vaulted-tower-v2-instanced'};
}
