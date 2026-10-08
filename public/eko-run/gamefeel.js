// Eko Run | bounded semantic game-feel composer.
// 110 pooled points (one draw call), event-driven, no physics or random authority.
export function createEkoGameFeel(THREE,scene){
  const CAP=110;
  const positions=new Float32Array(CAP*3),colors=new Float32Array(CAP*3),ages=new Float32Array(CAP);
  const vx=new Float32Array(CAP),vy=new Float32Array(CAP),vz=new Float32Array(CAP);
  const maxAge=new Float32Array(CAP),size=new Float32Array(CAP);
  const baseColor=new Array(CAP);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
  const mat=new THREE.PointsMaterial({
    size:.22,vertexColors:true,transparent:true,opacity:.86,depthWrite:false,
    blending:THREE.AdditiveBlending,sizeAttenuation:true
  });
  const node=new THREE.Points(geo,mat);
  node.name='Eko event-driven particle signals';
  node.frustumCulled=false;scene.add(node);
  let cursor=0,produced=0,enabled=true,lastRunId='',keys=new Set(),keyHistory=[];
  const seeds=(n)=>{let x=Math.imul((n|0)^0x71ee33,0x9e3779b9)>>>0;x^=x>>>14;x=Math.imul(x,2246822507)>>>0;return (x>>>0)/4294967295};
  function emit(type,at,number,seed){
    const groups={
      'player.jumped':{base:0x6ffff1,up:3.8,side:2.5,lifetime:.35},
      'player.landed':{base:0xffd17e,up:1.2,side:3.2,lifetime:.54},
      'player.slid':{base:0xffb263,up:1.3,side:2.7,lifetime:.48},
      'player.vaulted':{base:0xa0fff4,up:4.2,side:2.6,lifetime:.56},
      'hazard.warned':{base:0xff8568,up:3.0,side:2.6,lifetime:.62},
      'hazard.hit':{base:0xff6f69,up:4.0,side:3.6,lifetime:.62},
      'hazard.resolved':{base:0x80f5c0,up:2.3,side:2.7,lifetime:.48},
      'token.collected':{base:0xffe386,up:4.5,side:4.1,lifetime:.76},
      'checkpoint.reached':{base:0xf7ce58,up:6.6,side:4.5,lifetime:1.00},
      'district.completed':{base:0xc795ff,up:7.2,side:6.1,lifetime:1.15}
    };
    const settings=groups[type];if(!settings||!enabled)return;
    const color=new THREE.Color(settings.base);
    for(let j=0;j<number;j++){
      const i=(cursor++)%CAP,p=i*3,ix=seed+j*41;
      ages[i]=.001;maxAge[i]=settings.lifetime*(.55+.8*seeds(ix+15));
      positions[p]=at.x+(seeds(ix+22)-.5)*.55;
      positions[p+1]=at.y+.35+seeds(ix+92)*.9;
      positions[p+2]=(seeds(ix+111)-.5)*.65;
      vx[i]=(seeds(ix+89)-.5)*settings.side;
      vy[i]=.9+seeds(ix+310)*settings.up;
      vz[i]=(seeds(ix+456)-.5)*settings.side;
      baseColor[i]=color;
      colors[p]=color.r;colors[p+1]=color.g;colors[p+2]=color.b;
      produced++;
    }
    geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
  }
  function ingest(events,player,runId){
    if(runId!==lastRunId){keys.clear();keyHistory=[];lastRunId=runId}
    if(!Array.isArray(events))return;
    for(const event of events){
      if(!event || !Number.isInteger(event.sequence))continue;
      const key=runId+':'+event.sequence;
      if(keys.has(key))continue;
      keys.add(key);keyHistory.push(key);
      while(keyHistory.length>160)keys.delete(keyHistory.shift());
      const x=Number.isFinite(event.data?.x)?event.data.x:player.position.x;
      const y=Number.isFinite(event.data?.y)?event.data.y:player.position.y;
      const many=['checkpoint.reached','district.completed'].includes(event.type)?35:
        ['hazard.hit','token.collected'].includes(event.type)?20:10;
      emit(event.type,{x,y},many,event.sequence*31+event.tick*17);
    }
  }
  function update(dt,reducedMotion=false,quality='high'){
    const allow=enabled&&!reducedMotion;
    const limit=quality==='high'?CAP:46;
    let touched=false;
    for(let i=0;i<CAP;i++){
      if(ages[i]<=0)continue;
      const p=i*3;
      const age=ages[i]+dt;
      if(!allow||i>=limit||age>=maxAge[i]){
        ages[i]=0;
        positions[p+1]=-2000;
        colors[p]=colors[p+1]=colors[p+2]=0;
        touched=true;continue;
      }
      ages[i]=age;
      const energy=1-age/maxAge[i];
      positions[p]+=vx[i]*dt;positions[p+1]+=vy[i]*dt;
      positions[p+2]+=vz[i]*dt;
      vy[i]-=7.4*dt;
      const base=baseColor[i];
      colors[p]=base.r*energy;colors[p+1]=base.g*energy;colors[p+2]=base.b*energy;
      touched=true;
    }
    if(touched){
      geo.attributes.position.needsUpdate=true;
      geo.attributes.color.needsUpdate=true;
    }
  }
  return Object.freeze({
    ingest,update,
    setEnabled(value){enabled=Boolean(value);},
    stats(){return {capacity:CAP,emitted:produced,active:ages.filter(x=>x>0).length};},
    dispose(){scene.remove(node);geo.dispose();mat.dispose();}
  });
}
