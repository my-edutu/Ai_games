// Bounded 3D visual-only particles; no effect on deterministic gameplay or decisions.
export function createTowerVfx(THREE,scene){
  const LIMIT=240,positions=new Float32Array(LIMIT*3),colors=new Float32Array(LIMIT*3),
    velocity=new Float32Array(LIMIT*3),life=new Float32Array(LIMIT);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.PointsMaterial({size:.6,vertexColors:true,transparent:true,opacity:.75,
    blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
  const field=new THREE.Points(geometry,material);field.frustumCulled=false;scene.add(field);
  let index=0,seed=0x4175923,elapsed=0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  function emit(x,y,z,vx,vy,vz,color,ttl=1.4){
    const i=index++%LIMIT,j=i*3;
    positions[j]=x;positions[j+1]=y;positions[j+2]=z;
    velocity[j]=vx;velocity[j+1]=vy;velocity[j+2]=vz;
    colors[j]=color.r;colors[j+1]=color.g;colors[j+2]=color.b;life[i]=ttl;
  }
  const amber=new THREE.Color(0xffba76),azure=new THREE.Color(0x82e4ff),violet=new THREE.Color(0xbb89ff),
    moss=new THREE.Color(0xace8ba),blood=new THREE.Color(0xff5b72);
  function update(dt,player,theme='foundry',danger=0,reduced=false){
    const step=Math.max(0,Math.min(dt||0,.06));elapsed+=step;
    const smoke=theme==='void'?violet:theme==='storm'?azure:theme==='ruins'?moss:amber;
    const x=player?.x||0,y=player?.y||0,z=player?.z||1;
    const moving=Math.abs(player?.dx||0)+Math.abs(player?.dy||0)>.06;
    if(player&&!reduced){
      const rate=moving?4:1;
      for(let n=0;n<rate;n++){
        const rx=rand()*9-4.5,rz=rand()*5-2.5;
        emit(x+rx,y-8+rand()*5,z+rz,(rand()-.5)*8,1+rand()*7,(rand()-.5)*5,
          danger>.7&&rand()>.5?blood:smoke,.45+rand()*1.4);
      }
    }
    for(let i=0;i<LIMIT;i++){
      if(life[i]<=0)continue;
      life[i]-=step;const j=i*3;
      positions[j]+=velocity[j]*step;positions[j+1]+=velocity[j+1]*step;
      positions[j+2]+=velocity[j+2]*step;
      velocity[j]*=.985;velocity[j+1]-=2.2*step;
      if(life[i]<.25){colors[j]*=.96;colors[j+1]*=.96;colors[j+2]*=.96;}
      if(life[i]<=0){positions[j+1]=-2000;}
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.attributes.color.needsUpdate=true;
  }
  for(let i=0;i<LIMIT;i++)positions[i*3+1]=-2000;
  geometry.attributes.position.needsUpdate=true;
  return {update,count:LIMIT,signature:'bounded-world-particle-trails-v1'};
}
