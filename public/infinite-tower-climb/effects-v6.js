/* Presentation-only effects director, triggered exclusively by public tower snapshots.
   Bounded GPU buffers and deterministic visual jitter; no simulation changes. */
import * as THREE from '/tower/three.module.js';
const MAX=96,rand=n=>{const x=Math.sin(n*93.253+41.13)*29384.342;return x-Math.floor(x)};
const COLOR={foundry:0xffc26b,ruins:0x91ffbf,storm:0x85f4ff,clockwork:0xffe09c,void:0xf4a6f4};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function createTowerEffectsDirector(scene){
  const sparks=new THREE.BufferGeometry();
  const positions=new Float32Array(MAX*3),colors=new Float32Array(MAX*3);
  const positionAttr=new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage);
  const colorAttr=new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage);
  sparks.setAttribute('position',positionAttr);sparks.setAttribute('color',colorAttr);
  const glow=new THREE.PointsMaterial({size:3.1,vertexColors:true,transparent:true,opacity:.86,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
  const points=new THREE.Points(sparks,glow);points.frustumCulled=false;scene.add(points);
  const trailPositions=new Float32Array(18*3);const trailGeometry=new THREE.BufferGeometry();
  trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3).setUsage(THREE.DynamicDrawUsage));
  const trailMaterial=new THREE.LineBasicMaterial({color:0xffd695,transparent:true,opacity:.61,depthWrite:false,blending:THREE.AdditiveBlending});
  const trail=new THREE.Line(trailGeometry,trailMaterial);trail.frustumCulled=false;scene.add(trail);
  const parts=[],history=[];let previous=null,burstCount=0,hitCount=0,lastRun='';
  const flash=new THREE.PointLight(0xffbb69,0,90,2);scene.add(flash);
  function burst(x,y,z,type,tick,theme,size=12){
    const color=new THREE.Color(type==='hit'?0xff7766:type==='guardian'?0xffd77c:COLOR[theme]||0xffc26b);
    const count=Math.min(size,MAX-parts.length);
    for(let i=0;i<count;i++){
      const seed=tick*131+i*17+type.length*11,angle=rand(seed)*Math.PI*2;
      const velocity=3+rand(seed+15)*14;
      parts.push({x,y,z,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity+3,vz:(rand(seed+28)-.5)*7,
        life:.35+rand(seed+99)*.42,age:0,color});
    }
    burstCount++;
    if(type==='hit')hitCount++;
    flash.color.copy(color);flash.position.set(x,y,z);flash.intensity=5;
  }
  function ingest(s){
    if(!s)return;
    const token=s.runToken;
    if(lastRun!==token){previous=null;lastRun=token;parts.length=0;history.length=0}
    if(!previous){previous={tick:s.tick,floor:s.floor,health:s.player.health,state:s.player.state,progress:s.progress.floorProgressPermille};return}
    if(s.tick===previous.tick)return;
    const x=s.player.x/1000,y=s.player.y/1000,z=41;
    if(s.floor!==previous.floor)burst(x,y,z,'floor',s.tick,s.theme,32);
    if(s.player.health<previous.health)burst(x,y,z,'hit',s.tick,s.theme,36);
    else if(s.player.state==='dashing'&&previous.state!=='dashing')burst(x,y,z,'dash',s.tick,s.theme,17);
    else if(s.player.state==='airborne'&&previous.state==='standing')burst(x,y-8,z,'jump',s.tick,s.theme,12);
    if(s.enemies?.some(e=>e.active&&e.kind==='guardian'&&e.telegraph)&&s.tick%8===0){
      const e=s.enemies.find(e=>e.active&&e.kind==='guardian'&&e.telegraph);
      if(e)burst(e.x/1000,e.y/1000,40,'guardian',s.tick,s.theme,7);
    }
    previous={tick:s.tick,floor:s.floor,health:s.player.health,state:s.player.state,progress:s.progress.floorProgressPermille};
  }
  function frame(dt,s,visualX,visualY,reducedMotion=false){
    dt=clamp(dt,0,.05);if(!s)return;
    const cameraX=Number.isFinite(visualX)?visualX:s.player.x/1000;
    const cameraY=Number.isFinite(visualY)?visualY:s.player.y/1000;
    // Motion streak gives dash a physically directional feel without claiming any collision.
    if(s.player.state==='dashing'&&!reducedMotion){
      history.push([cameraX,cameraY,42]);if(history.length>18)history.shift();
    }else if(history.length){history.shift()}
    const anchor=history[0]||[cameraX,cameraY,42];
    for(let i=0;i<18;i++){
      const p=history[Math.min(i,history.length-1)]||anchor;
      trailPositions[i*3]=p[0];trailPositions[i*3+1]=p[1];trailPositions[i*3+2]=p[2];
    }
    trailGeometry.attributes.position.needsUpdate=true;trail.visible=history.length>3&&!reducedMotion;
    const color=new THREE.Color(COLOR[s.theme]||COLOR.foundry);trailMaterial.color.copy(color);
    trailMaterial.opacity=s.player.state==='dashing'?.63:.24;
    let index=0;
    if(!reducedMotion){
      for(let i=parts.length-1;i>=0;i--){
        const p=parts[i];p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=7*dt;
        if(p.age>=p.life){parts.splice(i,1);continue}
        if(index<MAX){
          positions[index*3]=p.x;positions[index*3+1]=p.y;positions[index*3+2]=p.z;
          const fade=1-p.age/p.life;
          colors[index*3]=p.color.r*fade;colors[index*3+1]=p.color.g*fade;colors[index*3+2]=p.color.b*fade;
          index++;
        }
      }
    }else parts.length=0;
    for(let i=index;i<MAX;i++){
      positions[i*3]=cameraX;positions[i*3+1]=-100000;positions[i*3+2]=-999;
      colors[i*3]=0;colors[i*3+1]=0;colors[i*3+2]=0;
    }
    positionAttr.needsUpdate=true;colorAttr.needsUpdate=true;
    flash.intensity=Math.max(0,flash.intensity-dt*23);
    points.visible=index>0;
    return{activeParticles:index,burstCount,hitCount,trailNodes:history.length};
  }
  function dispose(){
    scene.remove(points,trail,flash);sparks.dispose();trailGeometry.dispose();glow.dispose();trailMaterial.dispose();
  }
  return{ingest,frame,dispose,metrics:()=>({activeParticles:parts.length,burstCount,hitCount,trailNodes:history.length})};
}
