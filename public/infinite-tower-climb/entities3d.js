// Purpose-built 3D scenery and enemy silhouettes for the tower visual layer.
// Collision, scoring and AI remain governed exclusively by authoritative simulation snapshots.
export function createTowerEntities(THREE){
  const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,12,10),
    spikeGeo=new THREE.ConeGeometry(1,1,6),octaGeo=new THREE.OctahedronGeometry(1);
  const mat=(color,metalness=.24,roughness=.72,emissive=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive});
  const stone=mat(0x59697b),edge=mat(0x98b8bd,.78,.32),wood=mat(0x59463d),metal=mat(0xa26e50,.82,.3),
    obsidian=mat(0x262c47,.58,.38),eye=mat(0xffaa77,.3,.27,0xee4422),violet=mat(0x996cee,.35,.38,0x4720a0),
    health=mat(0x5bf2bd,.4,.23,0x116c50),stamina=mat(0x71cbff,.4,.23,0x1750aa),gold=mat(0xffd16e,.65,.22,0xa05f12),
    inactive=mat(0x504d63,.1,.87),danger=mat(0xeb415d,.45,.4,0x9e132d);
  const meshes={stone,edge,metal,obsidian,eye,violet,health,stamina,gold,inactive,danger};
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
      narrow=data.kind==='narrow',spring=data.kind==='spring',guardian=data.kind==='guardian';
    const surface=crumble?wood:spring?health:wind?stamina:narrow?edge:oneway?edge:stone;
    const slab=bar(root,surface,0,0,0,width,Math.max(height,.24),4.5);
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
  const sharedGeometries=new Set([boxGeo,sphereGeo,spikeGeo,octaGeo]);
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
  return {platform,enemy,hazard,pickup,projectile,release,materials:meshes};
}
