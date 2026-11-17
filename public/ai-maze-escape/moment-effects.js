// Cinematic *presentation-only* effects driven exclusively by public maze snapshots.
// Pooled/capped meshes prevent unbounded GPU growth in a 24/7 autonomous stream.
export function createMomentEffects(THREE) {
  const group=new THREE.Group();
  group.name='Public-event effects';
  const ringGeometry=new THREE.TorusGeometry(1,.032,7,52);
  const shardGeometry=new THREE.OctahedronGeometry(.12,0);
  const flareGeometry=new THREE.SphereGeometry(1,12,8);
  const palettes={
    key:0xffcc69,
    clue:0x69dcff,
    exit:0x78ffd2,
    triumph:0xa8ffbf,
    danger:0xff7690,
    setback:0xb886ff
  };
  const particles=[];
  const emitters=[];
  let runToken=null,latest=null;
  let recentEvents=[];
  function sanitize(snapshot){
    // No solver, world, hiddenMap, true route or undiscovered location field is read.
    if(!snapshot)return null;
    return {
      runToken:snapshot.runToken,
      currentCell:snapshot.currentCell,
      width:snapshot.width,
      keys:Array.isArray(snapshot.inventory)?[...snapshot.inventory]:[],
      clues:Array.isArray(snapshot.cells)?snapshot.cells.filter(c=>c.clue&&c.visible).map(c=>c.cell):[],
      exitCell:Number.isInteger(snapshot.exitCell)?snapshot.exitCell:null,
      threats:Array.isArray(snapshot.threats)?snapshot.threats.map(t=>({id:t.id,cell:t.cell})):[],
      lifecycle:snapshot.lifecycle,
      result:snapshot.result?.reason||null
    };
  }
  function createRing(kind,point,size){
    const mat=new THREE.MeshBasicMaterial({
      color:palettes[kind]||0xafffdd,transparent:true,opacity:.79,
      blending:THREE.AdditiveBlending,depthWrite:false
    });
    const mesh=new THREE.Mesh(ringGeometry,mat);
    mesh.rotation.x=Math.PI/2;
    mesh.position.set(point.x,.065,point.z);
    mesh.scale.setScalar(size);
    group.add(mesh);
    emitters.push({mesh,kind,age:0,life:1.5,size});
    return mesh;
  }
  function addBurst(kind,point,count){
    for(let n=0;n<count;n++){
      const mat=new THREE.MeshBasicMaterial({
        color:palettes[kind]||0xaaffdd,transparent:true,opacity:.9,
        blending:THREE.AdditiveBlending,depthWrite:false
      });
      const mesh=new THREE.Mesh(shardGeometry,mat);
      mesh.position.set(point.x,.3,point.z);
      mesh.scale.setScalar(.45+n%3*.25);
      const theta=(n/count)*Math.PI*2;
      const speed=.6+(n%4)*.18;
      group.add(mesh);
      particles.push({
        mesh,age:0,life:.95+(n%4)*.15,
        velocity:new THREE.Vector3(Math.cos(theta)*speed,.7+(n%3)*.25,Math.sin(theta)*speed)
      });
    }
  }
  function clear(){
    for(const o of [...emitters,...particles]){
      group.remove(o.mesh);
      o.mesh.material.dispose();
    }
    emitters.length=0;particles.length=0;recentEvents=[];
  }
  function trigger(kind,point,quiet=false){
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return;
    while(emitters.length>=8){const old=emitters.shift();group.remove(old.mesh);old.mesh.material.dispose();}
    createRing(kind,point,kind==='exit'||kind==='triumph'?1.4:.65);
    if(!quiet){
      while(particles.length>48){const old=particles.shift();group.remove(old.mesh);old.mesh.material.dispose();}
      addBurst(kind,point,kind==='triumph'?15:kind==='key'?10:7);
    }
    recentEvents.push(kind);
    if(recentEvents.length>8)recentEvents.shift();
  }
  function observe(snapshot,resolvePublicCell,{reducedMotion=false}={}){
    const incoming=sanitize(snapshot);
    if(!incoming)return;
    if(runToken!==incoming.runToken){
      runToken=incoming.runToken;latest=incoming;clear();
      return;
    }
    if(!latest){latest=incoming;return;}
    const hero=resolvePublicCell(incoming.currentCell,incoming.width);
    if(incoming.keys.length>latest.keys.length)trigger('key',hero,reducedMotion);
    if(incoming.clues.some(id=>!latest.clues.includes(id)))trigger('clue',hero,reducedMotion);
    if(incoming.exitCell!==null&&latest.exitCell===null)
      trigger('exit',resolvePublicCell(incoming.exitCell,incoming.width),reducedMotion);
    const newcomers=incoming.threats.filter(t=>!latest.threats.some(prev=>prev.id===t.id));
    if(newcomers.length)trigger('danger',resolvePublicCell(newcomers[0].cell,incoming.width),reducedMotion);
    if(incoming.lifecycle==='result'&&latest.lifecycle!=='result'){
      trigger(incoming.result==='escape'?'triumph':'setback',hero,reducedMotion);
    }
    latest=incoming;
  }
  function update(seconds,reducedMotion=false){
    if(!Number.isFinite(seconds)||seconds<0)return;
    for(let i=emitters.length-1;i>=0;i--){
      const o=emitters[i];
      o.age+=seconds*(reducedMotion?2.8:1);
      const t=Math.min(1,o.age/o.life);
      o.mesh.scale.setScalar(o.size*(1+t*3));
      o.mesh.material.opacity=(1-t)*.6;
      if(t>=1){
        group.remove(o.mesh);o.mesh.material.dispose();emitters.splice(i,1);
      }
    }
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=seconds*(reducedMotion?4:1);
      const t=Math.min(1,p.age/p.life);
      p.mesh.position.addScaledVector(p.velocity,seconds);
      p.velocity.y-=seconds*1.6;
      p.mesh.rotation.x+=seconds*4;p.mesh.rotation.z+=seconds*2;
      p.mesh.material.opacity=(1-t)*.86;
      if(t>=1){
        group.remove(p.mesh);p.mesh.material.dispose();particles.splice(i,1);
      }
    }
  }
  function dispose(){clear();ringGeometry.dispose();shardGeometry.dispose();flareGeometry.dispose()}
  return {group,observe,update,dispose,get recentEvents(){return [...recentEvents]},get activeObjects(){return emitters.length+particles.length}};
}
