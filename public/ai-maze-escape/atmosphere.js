// Cinematic environmental motion, driven by public zone profile only.
export function createAtmosphere(THREE){
  const group=new THREE.Group();
  group.name='Decorative atmospherics — zero gameplay authority';
  const mistGeometry=new THREE.BufferGeometry();
  const count=320;
  const positions=new Float32Array(count*3);
  const phases=new Float32Array(count);
  function rand(n,s=0){
    let x=Math.imul((n+s+1)|0,1664525)+1013904223;
    x^=x>>>13;
    return ((x>>>0)%100000)/100000;
  }
  for(let i=0;i<count;i++){
    phases[i]=rand(i,49)*6.283;
    const radius=2+Math.sqrt(rand(i,11))*21;
    const angle=rand(i,12)*Math.PI*2;
    positions[i*3]=Math.cos(angle)*radius;
    positions[i*3+1]=.12+rand(i,63)*5.8;
    positions[i*3+2]=Math.sin(angle)*radius;
  }
  mistGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const lightMaterial=new THREE.PointsMaterial({
    color:0x7bffe1,size:.098,sizeAttenuation:true,
    transparent:true,opacity:.67,depthWrite:false,
    blending:THREE.AdditiveBlending,
  });
  const fireflies=new THREE.Points(mistGeometry,lightMaterial);
  fireflies.frustumCulled=false;
  group.add(fireflies);
  const ringMaterial=new THREE.MeshBasicMaterial({
    color:0x84ffe0,transparent:true,opacity:.17,
    depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  });
  const monumentRing=new THREE.Mesh(new THREE.TorusGeometry(1.18,.012,4,70),ringMaterial);
  monumentRing.rotation.x=Math.PI/2;
  group.add(monumentRing);
  monumentRing.visible=false;
  const beamMaterial=new THREE.MeshBasicMaterial({
    color:0xffd68f,transparent:true,opacity:.08,depthWrite:false,
    side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  });
  const rays=[];
  for(let n=0;n<4;n++){
    const beam=new THREE.Mesh(new THREE.ConeGeometry(.6,4.8,12,1,true),beamMaterial);
    beam.position.set(n*2.2-3.3,2.3,n%2?1.4:-1.5);
    beam.rotation.z=(n-1.5)*.075;
    beam.visible=false;
    group.add(beam);
    rays.push(beam);
  }
  const themes={
    tree:{motes:0xffd58a,beam:0xffca75,ring:0x94ffe1,fog:.014,mode:'embers'},
    loops:{motes:0x89ffdb,beam:0x7fffe0,ring:0x79ffbd,fog:.012,mode:'fireflies'},
    chambers:{motes:0xffca83,beam:0xffb86a,ring:0xffd49d,fog:.010,mode:'dust'},
    layers:{motes:0xc9adff,beam:0x9b94ff,ring:0xbfc6ff,fog:.018,mode:'crystal'},
    hunter:{motes:0xff8a9c,beam:0xff6595,ring:0xff8b9c,fog:.02,mode:'embers'}
  };
  let visual=themes.loops;
  function setTheme(name){
    visual=themes[name]||themes.loops;
    lightMaterial.color.setHex(visual.motes);
    beamMaterial.color.setHex(visual.beam);
    ringMaterial.color.setHex(visual.ring);
    return visual;
  }
  function update(now,delta,position,reduceMotion=false){
    group.position.set(position.x,0,position.z);
    if(reduceMotion){
      fireflies.rotation.set(0,0,0);
      monumentRing.visible=false;
      for(const beam of rays)beam.visible=false;
      return;
    }
    // Faint particles drifting near the player; the game state is never consulted.
    fireflies.rotation.y=now*.000036;
    const buffer=mistGeometry.getAttribute('position');
    for(let i=0;i<count;i++){
      const origin=i*3;
      const initial=phases[i];
      const lift=visual.mode==='embers'?.00045:visual.mode==='fireflies'?.00018:.00011;
      const height=.2+((rand(i,63)*6+now*lift+(Math.sin(now*.001+initial)*.2))%6);
      buffer.array[origin+1]=height;
      buffer.array[origin]+=(Math.sin(now*.0005+initial)*.00022);
      buffer.array[origin+2]+=(Math.cos(now*.00047+initial)*.00022);
    }
    buffer.needsUpdate=true;
    // Subtle atmospheric shafts are near the hero and never indicate unknown exits.
    const opacity=visual.mode==='hunter'?.055:.075;
    beamMaterial.opacity=opacity+(Math.sin(now*.0008)+1)*.009;
    for(let n=0;n<rays.length;n++){
      rays[n].visible=n<2;
      rays[n].position.set((n*2.2-3.3),2.25+Math.sin(now*.0006+n)*.09,n%2?1.4:-1.5);
    }
  }
  function dispose(){
    mistGeometry.dispose();lightMaterial.dispose();ringMaterial.dispose();beamMaterial.dispose();
    monumentRing.geometry.dispose();
    for(const beam of rays)beam.geometry.dispose();
  }
  return {group,setTheme,update,dispose,get preset(){return visual}};
}
