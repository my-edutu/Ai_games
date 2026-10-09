// Purpose-built 3D scenery and enemy silhouettes for the tower visual layer.
// Collision, scoring and AI remain governed exclusively by authoritative simulation snapshots.
export function createTowerEntities(THREE,surfaceLibrary=null){
  const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,12,10),
    spikeGeo=new THREE.ConeGeometry(1,1,6),octaGeo=new THREE.OctahedronGeometry(1);
  const mat=(color,metalness=.24,roughness=.72,emissive=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive});
  const stone=mat(0x59697b),edge=mat(0x98b8bd,.78,.32),wood=mat(0x59463d),metal=mat(0xa26e50,.82,.3),
    obsidian=mat(0x262c47,.58,.38),eye=mat(0xffaa77,.3,.27,0xee4422),violet=mat(0x996cee,.35,.38,0x4720a0),
    health=mat(0x5bf2bd,.4,.23,0x116c50),stamina=mat(0x71cbff,.4,.23,0x1750aa),gold=mat(0xffd16e,.65,.22,0xa05f12),
    inactive=mat(0x504d63,.1,.87),danger=mat(0xeb415d,.45,.4,0x9e132d);
  const steelSkin=new THREE.MeshStandardMaterial({color:0x2e4b63,metalness:.67,roughness:.34}),
    inlay=new THREE.MeshStandardMaterial({color:0x789eb3,metalness:.36,roughness:.47}),
    neon=new THREE.MeshBasicMaterial({color:0x67eafa});
  const bevelShape=new THREE.Shape();
  bevelShape.moveTo(-.5,-.5);bevelShape.lineTo(.5,-.5);bevelShape.lineTo(.5,.5);bevelShape.lineTo(-.5,.5);bevelShape.closePath();
  const chevronShape=new THREE.Shape();
  chevronShape.moveTo(-.54,-.42);chevronShape.lineTo(0,.20);
  chevronShape.lineTo(.54,-.42);chevronShape.lineTo(.54,-.15);
  chevronShape.lineTo(0,.49);chevronShape.lineTo(-.54,-.15);chevronShape.closePath();
  const arrowGeometry=new THREE.ShapeGeometry(chevronShape);
  const checkpointHaloGeo=new THREE.TorusGeometry(1.18,.065,7,36);
  const beveledDeck=new THREE.ExtrudeGeometry(bevelShape,{depth:.72,steps:1,
    bevelEnabled:true,bevelThickness:.10,bevelSize:.08,bevelSegments:2,curveSegments:2});
  beveledDeck.translate(0,0,-.36);
  if(surfaceLibrary){
    surfaceLibrary.apply(steelSkin,'forged-alloy');
    surfaceLibrary.apply(inlay,'inlaid-ceramic');
    surfaceLibrary.apply(stone,'hand-hewn-stone');
    surfaceLibrary.apply(wood,'hand-hewn-stone');
  }
  const meshes={stone,edge,metal,obsidian,eye,violet,health,stamina,gold,inactive,danger,steelSkin,inlay,neon};
  const themeColors={
    foundry:{stone:0xb28f76,skin:0x6f7885,inlay:0xefc496,neon:0xffcb7d,edge:0xbfe9ec},
    ruins:{stone:0x93ac8b,skin:0x638879,inlay:0xb4ebd4,neon:0x8bffe0,edge:0xd7ffca},
    clockwork:{stone:0x8c9bb0,skin:0x718498,inlay:0xe6c28e,neon:0xffe895,edge:0xa4eaff},
    storm:{stone:0x839fd1,skin:0x6187b9,inlay:0xa9c9e7,neon:0x8feeff,edge:0xcfe9ff},
    void:{stone:0x9783c0,skin:0x78669d,inlay:0xd1acee,neon:0xf9adff,edge:0xe0c4ff}
  };
  function setTheme(name='foundry'){
    const colors=themeColors[name]||themeColors.foundry;
    stone.color.setHex(colors.stone);steelSkin.color.setHex(colors.skin);
    inlay.color.setHex(colors.inlay);neon.color.setHex(colors.neon);edge.color.setHex(colors.edge);
  }
  setTheme('foundry');
  function shape(parent,geometry,material,x,y,z,sx,sy,sz){
    const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
    o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  const bar=(p,m,x,y,z,w,h,d)=>shape(p,boxGeo,m,x,y,z,w,h,d);
  const orb=(p,m,x,y,z,w,h,d)=>shape(p,sphereGeo,m,x,y,z,w,h,d);
  function platform(data,px,py,width,height){
    const root=new THREE.Group();root.position.set(px,py,0);
    const moving=data.kind==='moving',oneway=data.kind==='oneway',
      crumble=data.kind==='crumbling',wind=data.kind==='wind',
      narrow=data.kind==='narrow',spring=data.kind==='spring',guardian=data.kind==='guardian',wall=data.kind==='wall-climb';
    const surface=crumble?wood:spring?health:wind?stamina:wall?edge:narrow?edge:oneway?edge:stone;
    const safeHeight=Math.max(height,.24);
    const slab=shape(root,beveledDeck,steelSkin,0,0,0,width,safeHeight,4.5);
    slab.name='Chamfered structural steel deck';
    // Two-layer color-treated stone and metallic fascia make the route readable from afar.
    bar(root,surface,0,safeHeight*.5-.10,0,width*.86,.16,3.92);
    bar(root,inlay,0,safeHeight*.5+.01,0,width*.67,.045,3.35);
    bar(root,neon,0,safeHeight*.5+.11,2.04,width*.92,.075,.12);
    // Surface decals are actual geometry, not a CSS pseudo-object.
    const emblem=new THREE.Mesh(arrowGeometry,neon);
    emblem.position.set(0,safeHeight*.5+.115,.5);
    emblem.rotation.x=-Math.PI/2;emblem.scale.set(.9,1.4,1);
    emblem.name='Route-readable climbing chevron';
    root.add(emblem);
    if(Number.isInteger(data.i)&&data.i>0&&data.i%5===0){
      const halo=new THREE.Mesh(checkpointHaloGeo,gold);
      halo.rotation.x=Math.PI/2;halo.position.set(0,safeHeight*.5+.13,0);
      halo.name='Checkpoint victory halo';root.add(halo);
    }
    for(const side of [-1,1]){
      bar(root,inlay,side*width*.26,-safeHeight*.63,2.28,width*.19,.2,.15);
    }
    for(const side of [-1,1]){
      bar(root,neon,side*width*.452,safeHeight*.50+.075,0,.075,.075,3.85);
    }
    // Underside cantilevers and inset luminous edge give each landing real mass.
    bar(root,wood,0,-Math.max(height,.24)*.5-.24,0,width*.85,.23,3.65);
    bar(root,moving?violet:crumble?danger:spring?gold:wind?stamina:metal,0,Math.max(height,.24)*.5+.08,0,width,.16,4.55);
    for(const side of [-1,1]){
      bar(root,obsidian,side*width*.42,-Math.max(height,.24)*.5-.54,.18,.18,.77,3.2);
      const bolt=orb(root,edge,side*width*.44,Math.max(height,.24)*.5+.13,2.32,.1,.1,.1);
      if(moving) {
        bar(root,metal,side*width*.42,1.1,-1.8,.12,2.1,.13);
        orb(root,gold,side*width*.42,2.2,-1.8,.2,.2,.2);
      }
    }
    if(crumble){
      // Offset fault lines provide a clear breakable silhouette, not just recoloring.
      for(let i=0;i<5;i++){
        const stripe=bar(root,obsidian,(i-2)*width/6,.49,-.15,Math.max(.1,width*.13),.05,3.8);
        stripe.rotation.z=Math.sin(i*2.1)*.17;
      }
      for(let side of [-1,1])shape(root,spikeGeo,danger,side*width*.44,.6,1.55,.19,.4,.19);
    }
    if(wind){
      for(let i=0;i<4;i++){
        const vane=bar(root,stamina,(i-1.5)*width*.21,.85,-1.4,.11,.65,1.75);
        vane.rotation.z=(i%2?1:-1)*.33;
      }
      orb(root,stamina,0,.72,1.6,.3,.3,.3);
    }
    if(spring){
      bar(root,obsidian,0,.56,0,width*.55,.25,3.6);
      for(let i=-2;i<=2;i++){
        orb(root,gold,i*width*.08,.77,0,.19,.29,.22);
      }
      bar(root,health,0,1.08,0,width*.42,.17,3.1);
    }
    if(narrow){
      for(const side of [-1,1]){
        bar(root,gold,side*width*.45,.75,-1.5,.13,.7,.18);
        bar(root,gold,side*width*.45,.75,1.5,.13,.7,.18);
      }
    }
    if(wall){
      bar(root,obsidian,0,-3.7,1.4,width*.95,7.4,1.1);
      for(let row=0;row<6;row++)for(const side of [-1,1]){
        const hold=orb(root,row%2?gold:edge,side*width*.21,-6.8+row*1.15,2.07,.35,.18,.26);
        hold.rotation.z=side*(row%2?.18:-.14);
      }
      for(const side of [-1,1])bar(root,metal,side*width*.42,-3.9,1.55,.22,7.7,.34);
    }
    if(guardian){
      for(const side of [-1,1]){
        bar(root,obsidian,side*width*.45,1.6,-1.7,.6,2.3,.65);
        orb(root,eye,side*width*.45,2.85,-1.7,.38,.38,.36);
      }
    }
    root.userData.platform=true;root.userData.kind=data.kind;return root;
  }
  function enemy(data,px,py,rw,rh){
    const root=new THREE.Group();root.position.set(px,py,.6);
    const guardian=data.kind==='guardian',shooter=data.kind==='shooter';
    const suit=guardian?obsidian:shooter?metal:stone,trim=guardian?gold:violet;
    const bodyHeight=Math.max(.7,rh*1.45),bodyWidth=Math.max(.55,rw*1.1);
    const core=orb(root,suit,0,0,0,bodyWidth*.64,bodyHeight*.56,.54);
    bar(root,trim,0,.04,.49,bodyWidth*.7,.12,.12);
    const helm=orb(root,suit,0,bodyHeight*.79,0,bodyWidth*.42,bodyHeight*.32,.39);
    bar(root,eye,0,bodyHeight*.82,.37,bodyWidth*.43,.12,.13);
    for(const side of [-1,1]){
      orb(root,trim,side*bodyWidth*.69,bodyHeight*.27,0,bodyWidth*.37,.25,.45);
      bar(root,suit,side*bodyWidth*.78,-bodyHeight*.24,0,bodyWidth*.29,bodyHeight*.87,.4);
      bar(root,obsidian,side*bodyWidth*.31,-bodyHeight*.78,0,bodyWidth*.36,bodyHeight*.85,.45);
      bar(root,metal,side*bodyWidth*.29,-bodyHeight*1.17,.2,bodyWidth*.48,.18,.68);
    }
    if(guardian){
      const blade=bar(root,metal,bodyWidth*1.2,-.05,.3,.13,bodyHeight*2.6,.15);
      shape(root,spikeGeo,gold,bodyWidth*1.2,bodyHeight*1.36,.3,.22,.4,.22);
      bar(root,gold,-bodyWidth*.9,.15,.7,bodyWidth*.7,bodyHeight*.95,.25);
      for(const side of [-1,1])shape(root,spikeGeo,trim,side*bodyWidth*.65,bodyHeight*.6,0,.34,.55,.34);
      const type=String(data.guardianClass||'warden');
      root.userData.guardianClass=type;
      if(type==='titan'){
        for(const side of [-1,1]){
          const armor=bar(root,obsidian,side*bodyWidth*.8,bodyHeight*.55,-.1,bodyWidth*.9,bodyHeight*.75,.7);
          armor.rotation.z=side*.22;
          const crown=shape(root,spikeGeo,gold,side*bodyWidth*.37,bodyHeight*1.55,.05,.31,.67,.3);
          crown.rotation.z=side*.18;
        }
        orb(root,eye,0,bodyHeight*.1,.65,.31,.38,.22);
        bar(root,metal,bodyWidth*1.45,bodyHeight*.3,.18,.34,bodyHeight*1.9,.38);
      }
      if(type==='stormcaller'){
        for(const side of [-1,1]){
          const coil=new THREE.Mesh(new THREE.TorusGeometry(.38,.09,8,20),stamina);
          coil.position.set(side*bodyWidth*.85,bodyHeight*.44,.72);
          coil.rotation.y=side*.38;root.add(coil);
          orb(root,stamina,side*bodyWidth*.87,bodyHeight*.44,.82,.2,.2,.18);
        }
        const aura=new THREE.Mesh(new THREE.TorusGeometry(bodyWidth*1.06,.055,8,36),violet);
        aura.position.set(0,bodyHeight*.17,-.6);aura.rotation.x=.15;root.add(aura);
      }
    }else if(shooter){
      bar(root,obsidian,bodyWidth*.7,.1,.65,bodyWidth*.85,.26,.24);
      orb(root,eye,bodyWidth*1.2,.1,.65,.17,.17,.17);
    }
    if(data.telegraph){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(Math.max(1,rw*1.6),.075,6,24),danger);
      ring.position.z=.9;root.add(ring);root.userData.telegraph=ring;
    }
    root.userData.enemy=true;return root;
  }
  function hazard(data,px,py,width,height){
    const root=new THREE.Group();root.position.set(px,py,.2);
    const material=data.active?danger:inactive;
    bar(root,obsidian,0,-height*.2,0,width,Math.max(.16,height*.3),3.5);
    const count=Math.max(1,Math.min(16,Math.round(width/.75)));
    for(let i=0;i<count;i++){
      const spike=shape(root,spikeGeo,material,(i+.5-count/2)*width/count,height*.2,.2,.35,height*.85,.35);
      spike.rotation.z=Math.sin(i*2.7)*.08;
    }
    return root;
  }
  function pickup(data,px,py){
    const root=new THREE.Group();root.position.set(px,py,.8);root.userData.pickup=true;
    const material=data.kind==='health'?health:data.kind==='stamina'?stamina:gold;
    shape(root,octaGeo,material,0,0,0,.27,.44,.27);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.045,5,20),material);ring.rotation.x=.25;root.add(ring);
    return root;
  }
  function projectile(data,px,py){
    const root=new THREE.Group();root.position.set(px,py,1);
    const m=data.owner==='player'?stamina:danger;
    orb(root,m,0,0,0,.18,.18,.18);
    const tail=bar(root,m,-.34,0,0,.55,.07,.07);
    root.rotation.z=Math.atan2(Number(data.vy||0),Number(data.vx||1));
    return root;
  }
  // Box, sphere, spikes and octahedra are shared for all visible entities.
  // Unique ring geometries must be released when a streamed floor leaves view.
  const sharedGeometries=new Set([boxGeo,sphereGeo,spikeGeo,octaGeo,beveledDeck,arrowGeometry,checkpointHaloGeo]);
  function release(root){
    let disposed=0;
    root.traverse(node=>{
      if(node.isMesh&&node.geometry&&!sharedGeometries.has(node.geometry)){
        node.geometry.dispose();
        disposed++;
      }
    });
    return disposed;
  }
  return {platform,enemy,hazard,pickup,projectile,release,setTheme,materials:meshes};
}
