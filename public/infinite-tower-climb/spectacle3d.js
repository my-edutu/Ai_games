// Original authored monumental 3D set pieces for the five Infinite Tower biomes.
// Spectacle is visual-only. Never mutates deterministic game state.
// Architecture streams around the player, with material/geometry reuse and capped animation.
export function createTowerSpectacle(THREE,scene){
  const root=new THREE.Group();root.name='Tower signature landmarks';scene.add(root);
  const sets={},animated=[],materials={};
  const box=new THREE.BoxGeometry(1,1,1),orb=new THREE.IcosahedronGeometry(1,1);
  const cone=new THREE.ConeGeometry(1,1,9),cylinder=new THREE.CylinderGeometry(1,1,1,12);
  const torusCache=new Map();
  function ringGeo(radius,tube,segments=32){
    const key=radius+':'+tube+':'+segments;
    if(!torusCache.has(key))torusCache.set(key,new THREE.TorusGeometry(radius,tube,8,segments));
    return torusCache.get(key);
  }
  const metal=(color,metalness=.65,roughness=.32)=>new THREE.MeshStandardMaterial({
    color,metalness,roughness,side:THREE.DoubleSide
  });
  const glow=(color,strength=2)=>new THREE.MeshBasicMaterial({color,transparent:false,side:THREE.DoubleSide});
  const glass=(color,opacity=.4)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,
    side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const palette={
    foundry:{shell:metal(0x51506a),dark:metal(0x252939),trim:metal(0xf5a96a),glow:glow(0xff753d),secondary:glow(0xffe38e),aura:glass(0xff743e,.11)},
    ruins:{shell:metal(0x465f59,.26,.83),dark:metal(0x203e46,.25,.7),trim:metal(0xaaf17b,.2,.5),glow:glow(0x64ffd2),secondary:glow(0xe2ff9e),aura:glass(0x59f8c9,.11)},
    clockwork:{shell:metal(0x4a5e76),dark:metal(0x25344a),trim:metal(0xffd077),glow:glow(0x4de1fa),secondary:glow(0xffdf7e),aura:glass(0x5cbbff,.12)},
    storm:{shell:metal(0x667899),dark:metal(0x2b3d68),trim:metal(0xa6bfff),glow:glow(0x58daff),secondary:glow(0xf9ffff),aura:glass(0x5e8cff,.1)},
    void:{shell:metal(0x4f417a),dark:metal(0x271c4a),trim:metal(0xdba8ff),glow:glow(0xec78ff),secondary:glow(0x67ffe6),aura:glass(0xdd66ff,.12)}
  };
  Object.assign(materials,palette);
  const attach=(group,geo,material,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{
    const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
    m.receiveShadow=true;group.add(m);return m;
  };
  function bar(group,mat,x,y,z,w,h,d){return attach(group,box,mat,x,y,z,w,h,d)}
  function sphere(group,mat,x,y,z,rx=1,ry=rx,rz=rx){return attach(group,orb,mat,x,y,z,rx,ry,rz)}
  function pillar(group,mat,x,y,z,r,h){return attach(group,cylinder,mat,x,y,z,r,h,r)}
  function ring(group,mat,x,y,z,r,t=.18){return attach(group,ringGeo(r,t),mat,x,y,z)}
  function halo(group,mat,x,y,z,r){
    const ringObject=ring(group,mat,x,y,z,r,.08);
    const beam=attach(group,new THREE.PlaneGeometry(2*r,2*r),mat,x,y,z-.7);
    beam.userData.glowCorona=true;return {ring:ringObject,plane:beam};
  }
  const makeSet=name=>{
    const group=new THREE.Group();group.name=name+' majestic landmark cluster';
    group.visible=false;root.add(group);sets[name]=group;return group;
  };
  for(const name of Object.keys(palette))makeSet(name);
  for(const side of [-1,1]){
    for(let tier=-1;tier<=1;tier++){
      const x=side*15.7,y=tier*30,z=-9;
      const foundry=sets.foundry,p=palette.foundry;
      // FORGE: two-storey smelters, molten light wells, exhaust chimneys and suspension chains.
      bar(foundry,p.dark,x,y-4,z,8.8,14,4);
      bar(foundry,p.shell,x,y-4,z+2.25,9.2,14.5,.6);
      const aperture=bar(foundry,p.glow,x,y-5.5,z+2.61,4.6,7.1,.19);
      bar(foundry,p.dark,x,y-4.8,z+2.72,2.15,5.2,.22);
      for(const t of [-1,1]){
        pillar(foundry,p.trim,x+t*4.7,y+2,z+1.8,.7,15.5);
        pillar(foundry,p.shell,x+t*3.3,y+7,z-1.5,.94,15.5);
        for(let n=0;n<9;n++)sphere(foundry,p.secondary,x+t*3.8,y+6-n*1.35,z+2.65,.14,.16,.12);
      }
      bar(foundry,p.trim,x,y+4.5,z+2.6,10,.44,1.2);
      for(let n=0;n<5;n++){
        bar(foundry,p.glow,x+(n-2)*1.05,y-7.9,z+2.7,.5,2.4,.15);
        sphere(foundry,p.secondary,x+(n-2)*1.08,y-9.1,z+2.9,.45,.62,.23);
      }
      // RUINS: ancient terraces with split stone arch, broad canopy and suspended turquoise falls.
      const ruins=sets.ruins,q=palette.ruins;
      for(const t of [-1,1]){
        pillar(ruins,q.shell,x+t*4.4,y,z,1.1,17.5);
        sphere(ruins,q.trim,x+t*4.4,y+9,z,1.5,1.1,1.5);
        for(let n=0;n<9;n++){
          const a=n*2.39996+side+ tier,leafX=x+t*3.2+Math.sin(a)*2.15,leafY=y+6+Math.cos(a*.7)*5;
          sphere(ruins,n%3?q.secondary:q.trim,leafX,leafY,z+1.4+Math.cos(a)*2.6,.6,1.5,.9);
        }
      }
      ring(ruins,q.trim,x,y+7,z+1.5,5.4,.55);
      for(let f=0;f<3;f++){
        const cascade=bar(ruins,q.aura,x+(f-1)*2.5,y-5.1,z+3+f*.13,1.1,12,.04);
        cascade.rotation.z=Math.sin(f+side)*.045;
        sphere(ruins,q.glow,x+(f-1)*2.5,y-11,z+3.8,.9,.45,.6);
      }
      bar(ruins,q.shell,x,y-11.7,z+2,12,1,3.8);
      // CLOCKWORK: monumental gear-trains with rings, spokes, tick marks and gemstone hubs.
      const clockwork=sets.clockwork,a=palette.clockwork;
      bar(clockwork,a.dark,x,y-3,z,10,17,3.2);
      const orrery=new THREE.Group();
      orrery.position.set(x,y+2,z+2.7);clockwork.add(orrery);
      ring(orrery,a.trim,0,0,0,5.7,.38);ring(orrery,a.glow,0,0,.15,4.55,.055);
      ring(orrery,a.shell,0,0,.33,2.8,.31);
      sphere(orrery,a.secondary,0,0,.55,1.04,1.04,.9);
      for(let tick=0;tick<16;tick++){
        const phase=tick*Math.PI/8;
        const tooth=bar(orrery,tick%4===0?a.glow:a.trim,Math.cos(phase)*5.75,Math.sin(phase)*5.75,0,.55,.9,.55);
        tooth.rotation.z=phase;
        const marker=bar(orrery,a.glow,Math.cos(phase)*3.7,Math.sin(phase)*3.7,.39,.14,.38,.21);
        marker.rotation.z=phase;
      }
      for(let s=0;s<6;s++){
        const phase=s*Math.PI/3;
        const spoke=bar(orrery,a.shell,Math.cos(phase)*1.65,Math.sin(phase)*1.65,.2,3.35,.23,.28);
        spoke.rotation.z=phase;
      }
      animated.push({object:orrery,kind:'clockwork',speed:side*.14,baseY:orrery.position.y});
      bar(clockwork,a.trim,x,y-7,z+3.1,9,.4,1);
      // STORM: electrified lightning spires, exposed coils and refracting glass fins.
      const storm=sets.storm,b=palette.storm;
      pillar(storm,b.dark,x,y,z,1.5,21);
      for(let t=-1;t<=1;t++){
        const antenna=attach(storm,cone,b.trim,x+t*2.7,y+9,z+1.2,.9,6,1);
        antenna.rotation.z=t*.27;
        sphere(storm,b.glow,x+t*2.5,y+6.1,z+2.1,.39,.44,.38);
        ring(storm,b.glow,x+t*2.6,y+3.5,z+1.9,1.4,.14);
      }
      bar(storm,b.shell,x,y+2,z+2.6,8,1.3,.45);
      for(let k=0;k<7;k++){
        const shard=sphere(storm,k%2?b.trim:b.secondary,x+(k-3)*.9,y-4.4+Math.sin(k*1.3)*2.3,z+2.9,.33,.89,.32);
        shard.rotation.z=Math.sin(k*.73)*.38;
      }
      // VOID: impossible triple gateways, hovering monoliths and luminous orbiting runes.
      const voidSet=sets.void,v=palette.void;
      const portal=new THREE.Group();portal.position.set(x,y,z+2.2);voidSet.add(portal);
      const outer=ring(portal,v.trim,0,0,0,6.2,.43),middle=ring(portal,v.glow,0,0,.2,4.7,.17),
        inner=ring(portal,v.secondary,0,0,.24,2.95,.08);
      outer.rotation.z=tier*.2;
      sphere(portal,v.aura,0,0,-.15,4.6,4.6,.18);
      for(let j=0;j<9;j++){
        const angle=j*2*Math.PI/9;
        const shard=attach(portal,cone,j%2?v.glow:v.secondary,Math.cos(angle)*5,Math.sin(angle)*5,.8,.65,2.15,.65);
        shard.rotation.z=angle+.7;
      }
      for(const t of [-1,1]){
        const obelisk=attach(voidSet,cone,v.shell,x+t*6.1,y+1.5,z+1.1,1.65,11,1.6);
        obelisk.rotation.z=t*.2;
        sphere(voidSet,v.secondary,x+t*6.1,y+7.4,z+1.2,.55,.55,.55);
      }
      animated.push({object:portal,kind:'void',speed:side*.22,baseY:portal.position.y});
      animated.push({object:middle,kind:'void-ring',speed:-side*.18});
      animated.push({object:inner,kind:'void-ring',speed:side*.45});
    }
  }
  // Instancing keeps repeated decorative geometry cheap; never batch moving orbits.
  let instancedMeshes=0;
  for(const set of Object.values(sets)){
    const batches=new Map();
    for(const child of [...set.children]){
      if(!child.isMesh)continue;
      const key=child.geometry.uuid+':'+child.material.uuid;
      if(!batches.has(key))batches.set(key,[]);
      batches.get(key).push(child);
    }
    for(const collection of batches.values()){
      if(collection.length<3)continue;
      const instanced=new THREE.InstancedMesh(collection[0].geometry,collection[0].material,collection.length);
      instanced.name='Batched landmark ornament';instanced.receiveShadow=true;
      for(let k=0;k<collection.length;k++){
        const obj=collection[k];obj.updateMatrix();instanced.setMatrixAt(k,obj.matrix);set.remove(obj);
      }
      instanced.instanceMatrix.needsUpdate=true;
      set.add(instanced);instancedMeshes++;
    }
  }
  let current='';
  function setTheme(theme){
    current=Object.hasOwn(sets,theme)?theme:'foundry';
    for(const [name,group] of Object.entries(sets))group.visible=name===current;
  }
  function update(time=0,playerY=0,reduced=false){
    const center=Math.round(Number(playerY||0)/60)*60;
    root.position.y=center;
    if(reduced)return;
    for(const item of animated){
      if(item.kind!==current&&!((item.kind==='void-ring')&&current==='void'))continue;
      item.object.rotation.z=time*item.speed;
      if(item.kind==='void')item.object.position.y=item.baseY+Math.sin(time*.6)*.5;
    }
  }
  setTheme('foundry');
  return {root,sets,setTheme,update,materials,instancedMeshes,
    signature:'signature-monumental-biomes-v1'};
}
