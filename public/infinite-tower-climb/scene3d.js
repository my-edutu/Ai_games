/* Infinite Tower Climb: presentation-only 3D scene.
 * All game authority remains in the deterministic server snapshot.
 * No simulation state is modified by this renderer.
 */
import * as THREE from '/tower/three.module.js';
import {createTowerCharacter,poseTowerCharacter} from '/tower/character3d.js';
import {decorateTowerEnvironment,animateTowerEnvironment} from '/tower/environment3d.js';
import {VISUAL_PALETTES,buildPainterlyTowerBackdrop} from '/tower/biome-v4.js';
import {createTowerHazard3D,updateTowerHazard3D} from '/tower/hazards-v4.js';
import {buildBiomeLandmarks,animateBiomeLandmarks} from '/tower/landmarks-v5.js';

const SCALE = 1 / 1000;
const palettes=VISUAL_PALETTES;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const coord = n => n * SCALE;
const matte = (color, roughness=.7, metalness=.2) => new THREE.MeshStandardMaterial({color, roughness, metalness});
const emissive = (color, strength=2) => new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:strength, roughness:.32, metalness:.25});
const box = (w,h,d,mat) => new THREE.Mesh(new THREE.BoxGeometry(Math.max(.2,w),Math.max(.2,h),Math.max(.2,d)),mat);
const ball = (r,mat,segments=14) => new THREE.Mesh(new THREE.SphereGeometry(r,segments,10),mat);
function add(group,mesh,x,y,z){mesh.position.set(x,y,z);group.add(mesh);return mesh}
function limb(group,mat,radius,height,x,y,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius*.88,radius,height,9),mat);add(group,m,x,y,z);return m}
function clearGroup(group){
  for(const child of [...group.children]){
    child.traverse(obj=>{if(obj.isMesh||obj.isPoints){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose()}});
    group.remove(child);
  }
}
function seeded(n){const t=Math.sin(n*84.17+19.67)*43758.5453;return t-Math.floor(t)}
// Small original weathered-masonry canvas textures. Deterministic and bounded (five variants).
const masonry=new Map();
const vistaCache=new Map();
function skylineMaterial(theme){
  if(vistaCache.has(theme))return vistaCache.get(theme);
  const cvs=document.createElement('canvas');cvs.width=192;cvs.height=384;
  const ctx=cvs.getContext('2d');
  const colors={
    foundry:['#17274a','#936653','#e2ab6e'],
    ruins:['#102e39','#306b6e','#d0d7b3'],
    storm:['#10213f','#4d779b','#bbdafa'],
    clockwork:['#241a2d','#906b4b','#e9bd71'],
    void:['#0d0924','#514083','#b38dec']
  }[theme]||['#0f2032','#4e738b','#c3dce9'];
  const sky=ctx.createLinearGradient(0,0,0,cvs.height);
  colors.forEach((color,i)=>sky.addColorStop(i/2,color));
  ctx.fillStyle=sky;ctx.fillRect(0,0,cvs.width,cvs.height);
  const moonX=135,moonY=94;
  const halo=ctx.createRadialGradient(moonX,moonY,0,moonX,moonY,82);
  halo.addColorStop(0,'rgba(255,252,227,.58)');
  halo.addColorStop(.23,'rgba(244,234,201,.19)');
  halo.addColorStop(1,'rgba(244,234,201,0)');
  ctx.fillStyle=halo;ctx.fillRect(0,0,192,220);
  ctx.fillStyle=theme==='void'?'#e9b9ff':'#f2ead2';
  ctx.beginPath();ctx.arc(moonX,moonY,theme==='storm'?13:9,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<4;layer++){
    const baseline=215+layer*46,amp=21+layer*7;
    ctx.beginPath();ctx.moveTo(0,384);ctx.lineTo(0,baseline);
    for(let x=0;x<=192;x+=12){
      const yy=baseline-Math.abs(Math.sin(x*.028+layer*.9))*amp-seeded(x+layer*33)*14;
      ctx.lineTo(x,yy);
    }
    ctx.lineTo(192,384);ctx.closePath();
    ctx.fillStyle=theme==='ruins'?['#26464e','#173c40','#183236','#0b252e'][layer]:
      theme==='void'?['#392e65','#2c2455','#201a42','#15152f'][layer]:
      ['#425772','#2b425c','#20344c','#172942'][layer];
    ctx.fill();
  }
  for(let i=0;i<42;i++){
    const x=seeded(i*17)*192,y=seeded(i*33)*180;
    ctx.fillStyle='rgba(255,255,255,'+(.18+seeded(i*3)*.46)+')';
    ctx.fillRect(x,y,.5+seeded(i*7)*1.2,.5+seeded(i*5)*1.2);
  }
  const texture=new THREE.CanvasTexture(cvs);texture.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false});
  vistaCache.set(theme,mat);return mat;
}
function stoneworkMaterial(name,color){
  if(masonry.has(name))return masonry.get(name);
  const tile=document.createElement('canvas');tile.width=256;tile.height=256;
  const pen=tile.getContext('2d'),base=new THREE.Color(color);
  pen.fillStyle='#'+base.getHexString();pen.fillRect(0,0,256,256);
  for(let i=0;i<1300;i++){
    const x=seeded(i*7+name.length*11)*256,y=seeded(i*17+name.length*7)*256;
    const w=.5+seeded(i*31)*13,h=.4+seeded(i*23)*4,light=seeded(i*43)>.43;
    pen.fillStyle=light?'rgba(237,234,220,.055)':'rgba(4,11,24,.085)';
    pen.fillRect(x,y,w,h);
  }
  // Hand-drawn fine veins and stone fractures keep the surface from reading as plain blocks.
  pen.lineWidth=.7;
  for(let i=0;i<19;i++){
    let x=seeded(i*13+name.length)*256,y=seeded(i*47+name.length)*256;
    pen.beginPath();pen.moveTo(x,y);
    for(let j=0;j<5;j++){
      x+=-8+seeded(i*29+j*3)*16;y+=3+seeded(i*23+j*11)*16;
      pen.lineTo(x,y);
    }
    pen.strokeStyle=i%3?'rgba(0,0,0,.19)':'rgba(234,241,251,.08)';
    pen.stroke();
  }
  for(let i=0;i<9;i++){
    const x=seeded(i*9+name.length)*256,y=seeded(i*27+name.length)*256;
    pen.fillStyle='rgba(3,8,20,.12)';pen.fillRect(x,y,20+seeded(i*9)*35,.7);
  }
  const map=new THREE.CanvasTexture(tile);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(2,3);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=4;
  const material=new THREE.MeshStandardMaterial({map,roughness:.91,metalness:.06});
  masonry.set(name,material);return material;
}

export function mountTower3D({host,getFrame,reducedMotion=false,highContrast=false,heroCamera=false,quality='auto',inspectCharacters=false}){
  const canvas=document.createElement('canvas');
  canvas.id='tower-3d-canvas';canvas.dataset.testid='tower-3d-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  host.appendChild(canvas);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    const lowPower=quality==='low'||(quality==='auto'&&window.innerWidth<850);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,lowPower?1:1.65));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.52;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
  }catch(error){canvas.remove();throw error}
  const scene=new THREE.Scene(),fog=new THREE.FogExp2(0x987c6e,.00075);scene.fog=fog;
  const camera=new THREE.PerspectiveCamera(37,16/9,.3,1400);
  const backdrop=new THREE.Group(),structures=new THREE.Group(),actors=new THREE.Group(),effects=new THREE.Group();
  scene.add(backdrop,structures,actors,effects);
  const hemi=new THREE.HemisphereLight(0xffeacf,0x4c5363,2.65);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffddb0,4.0);key.position.set(-45,120,135);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffc49a,2.0);rim.position.set(80,55,-30);scene.add(rim);
  const player=createTowerCharacter({tint:0xf7a65d,kind:'climber'});actors.add(player);
  // This quality-review turntable reuses exactly the same production character assets.
  // It does not alter game authority or the live snapshot and is opt-in only.
  const inspector=new THREE.Group();inspector.visible=inspectCharacters;actors.add(inspector);
  const inspectors=inspectCharacters?[
    ['WAYFINDER','climber',0xf7a65d,false],
    ['SENTINEL','sentinel',0x659e7e,false],
    ['SHOOTER','shooter',0xed6559,false],
    ['GUARDIAN','guardian',0xe8bd78,true]
  ].map(([name,kind,tint,guardian])=>{
    const character=createTowerCharacter({kind,tint,guardian});
    const title=document.createElement('canvas');title.width=256;title.height=64;
    const pen=title.getContext('2d');pen.fillStyle='rgba(36,24,30,.86)';pen.fillRect(0,0,256,64);
    pen.strokeStyle='#f8d9a0';pen.lineWidth=3;pen.strokeRect(2,2,252,60);
    pen.fillStyle='#fff1d4';pen.font='bold 26px sans-serif';pen.textAlign='center';pen.fillText(name,128,42);
    const tex=new THREE.CanvasTexture(title);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
    label.scale.set(37,9,1);character.add(label);label.position.set(0,37,1);
    inspector.add(character);return{character,name,kind};
  }):[];
  const glow=new THREE.PointLight(0xffc273,66,150,2);actors.add(glow);
  const dynamic=new Map();
  let floor=-1,theme='',lastChecksum='',latest=null,frame=null,running=true,lastAt=performance.now(),ornament=null,landmarks=null;
  let cameraY=35,cameraX=240,worldWidth=480,observedFrames=0,visualX=null,visualY=null,visualRun='',visualFloor=-1;
  let frameTotalMs=0,slowFrames=0,frameSampleCount=0;
  const perf={frames:0,drawCalls:0,triangles:0,entityCount:0};window.__TOWER_3D_DIAGNOSTICS__=perf;

  function buildBackdrop(s){
    clearGroup(backdrop);clearGroup(structures);for(const [id,obj] of dynamic){actors.remove(obj);clearGroup(obj);dynamic.delete(id)}
    floor=s.floor;theme=s.theme;worldWidth=coord(s.worldWidth);
    const standard=palettes[theme]||palettes.foundry;
    const p=highContrast?{...standard,stone:0x59616b,rim:0xffffff,glow:0xffe2a5,haze:0x21212b,accent:0xffffff}:standard;
    scene.background=new THREE.Color(p.haze);fog.color.setHex(p.haze);scene.fog=highContrast?null:fog;
    key.color.setHex(p.accent);rim.color.setHex(p.glow);
    const stone=stoneworkMaterial(theme,p.stone),trim=matte(p.rim,.64,.44),dark=matte(0x131923,.96,.08),light=emissive(p.glow,1.9);
    const centerY=coord(s.chunkBaseY+s.chunkHeight*.5);
    // The v4 visual pass removes the grid-like wall responsible for the flat blue prototype look.
    // Monument silhouettes, landscape horizons, open galleries and warm sunlight now define the world.
    buildPainterlyTowerBackdrop({group:backdrop,snapshot:s,theme,palette:p,worldWidth});
    landmarks=buildBiomeLandmarks({group:backdrop,snapshot:s,palette:p,worldWidth});
    // Hundreds of particles rendered as ONE draw call instead of one sphere per dust mote.
    const motePositions=[];
    for(let i=0;i<210;i++){
      motePositions.push(12+seeded(i+floor*113)*(worldWidth-24));
      motePositions.push(coord(s.chunkBaseY)+seeded(i*3+floor*17)*coord(s.chunkHeight));
      motePositions.push(-12-seeded(i*11+floor)*80);
    }
    const moteGeometry=new THREE.BufferGeometry();
    moteGeometry.setAttribute('position',new THREE.Float32BufferAttribute(motePositions,3));
    const motes=new THREE.Points(moteGeometry,new THREE.PointsMaterial({
      color:p.glow,size:1.05,transparent:true,opacity:.62,sizeAttenuation:true,
      depthWrite:false,blending:THREE.AdditiveBlending
    }));
    backdrop.add(motes);
    // Visual set dressing changes with the procedural level theme; it is not collision geometry.
    if(theme==='clockwork'){
      for(let i=0;i<5;i++){
        const gear=new THREE.Mesh(new THREE.TorusGeometry(20,3.3,8,12),trim);
        add(backdrop,gear,55+i*90,coord(s.chunkBaseY)+33+i*65,-43);
        for(let spoke=0;spoke<8;spoke++){
          const r=spoke*Math.PI/4;
          const tooth=box(12,3,5,stone);
          tooth.rotation.z=r;
          add(backdrop,tooth,gear.position.x+Math.cos(r)*20,gear.position.y+Math.sin(r)*20,-43);
        }
      }
    }else if(theme==='ruins'){
      const vines=matte(0x285f4b,.97,.02);
      for(let i=0;i<18;i++){
        const x=seeded(i*7+floor)*worldWidth,y=coord(s.chunkBaseY)+seeded(i*13+floor)*coord(s.chunkHeight);
        const branch=add(backdrop,box(1.4,13+seeded(i)*20,1.2,vines),x,y,-37);
        branch.rotation.z=(seeded(i*3)-.5)*.8;
      }
    }else if(theme==='storm'){
      for(let i=0;i<13;i++){
        const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(2.5+seeded(i+floor)*4),emissive(0x8dcfff,1.35));
        crystal.rotation.z=i*.31;
        add(backdrop,crystal,seeded(i*17+floor)*worldWidth,coord(s.chunkBaseY)+seeded(i*13)*coord(s.chunkHeight),-34);
      }
    }else if(theme==='void'){
      for(let i=0;i<5;i++){
        const portal=new THREE.Mesh(new THREE.TorusGeometry(15,2.2,9,42),emissive(0x9c66ff,2));
        add(backdrop,portal,worldWidth*(.14+i*.18),coord(s.chunkBaseY)+45+i*59,-36);
      }
    }else if(theme==='foundry'){
      for(let i=0;i<7;i++){
        const vent=add(backdrop,box(26,5,15,trim),worldWidth*(.12+(i%4)*.25),coord(s.chunkBaseY)+33+i*48,-40);
        add(backdrop,box(21,2.2,17,emissive(0xff8143,1.75)),vent.position.x,vent.position.y+3,-39);
      }
    }
    ornament=decorateTowerEnvironment({group:backdrop,snapshot:s,theme,palette:p,worldWidth});
    // Actual snapshot geometry, not an invented obstacle course.
    for(const platform of s.platforms){
      const cx=coord(platform.x+platform.width/2),cy=coord(platform.y+platform.height/2),w=coord(platform.width);
      const group=new THREE.Group();
      // Layered 3D traversable ledges with carved stone, contact highlights, and visible supports.
      add(group,box(w,coord(platform.height)+4,30,stone),cx,cy,5);
      add(group,box(w+2,3.6,37,trim),cx,cy+coord(platform.height)/2+2,6);
      add(group,box(w-4,.8,38,light),cx,cy+coord(platform.height)/2+4.2,6.5);
      add(group,box(w-8,3,38,matte(p.shadow,.95,.16)),cx,cy-5,6);
      for(const d of [-1,1]){
        const x=cx+d*(w/2-5);
        add(group,box(7,9,38,trim),x,cy-6,5);
        add(group,new THREE.Mesh(new THREE.CylinderGeometry(4,4,3,8),trim),x,cy+8,7);
      }
      if(w>65){
        for(let bolt=0;bolt<Math.min(6,Math.floor(w/28));bolt++){
          add(group,ball(1.2,light,8),cx-w/2+15+bolt*24,cy+5,26);
        }
      }
      if(platform.kind==='moving'){
        const glyph=add(group,new THREE.Mesh(new THREE.TorusGeometry(7,1.8,8,24),emissive(p.glow,1.3)),cx,cy-7,30);
        glyph.rotation.y=Math.PI/5;
      }
      structures.add(group);
    }
    // Hanging environmental silhouettes make each vertical climb feel monumental.
    for(let i=0;i<6;i++){
      const x=worldWidth*(.1+(i%3)*.4);
      const y=coord(s.chunkBaseY)+i*61+34;
      add(backdrop,box(6,44,7,stone),x,y,-40);
      add(backdrop,ball(8,trim,9),x,y-25,-36);
      add(backdrop,ball(3,light),x,y-25,-24);
    }
  }

  function upsert(id,kind,construct){
    const existing=dynamic.get(id);
    if(existing&&existing.userData.kind===kind)return existing;
    if(existing){actors.remove(existing);clearGroup(existing)}
    const group=construct();group.userData.kind=kind;dynamic.set(id,group);actors.add(group);return group;
  }
  function sync(s){
    if(floor!==s.floor||theme!==s.theme)buildBackdrop(s);
    if(lastChecksum===s.publicChecksum)return;
    lastChecksum=s.publicChecksum;latest=s;
    const allowed=new Set();
    const palette=palettes[s.theme]||palettes.foundry;
    for(const h of s.hazards){
      const id='hazard:'+h.id;allowed.add(id);
      const g=upsert(id,'hazard',()=>createTowerHazard3D(h,palette));
      g.position.set(coord(h.x+h.width/2),coord(h.y+h.height/2),15);
      updateTowerHazard3D(g,h.active,performance.now()*.001,reducedMotion);
    }
    for(const e of s.enemies){
      const id='enemy:'+e.id;allowed.add(id);
      const guardian=e.kind==='guardian';
      const g=upsert(id,e.kind,()=>{
        const g=createTowerCharacter({tint:guardian?0xe8bd78:e.kind==='shooter'?0xed6559:0x689e88,guardian,kind:e.kind});
        if(guardian){const crown=add(g,box(17,4,12,emissive(0xffbc52,2.8)),0,26,0);crown.rotation.z=.17}
        return g;
      });
      g.position.set(coord(e.x),coord(e.y),35);
      g.scale.setScalar(clamp(coord(e.halfHeight)/26,.3,1.7));
      g.visible=e.active;
      g.userData.telegraph=e.telegraph;
    }
    for(const pickup of s.pickups){
      const id='pickup:'+pickup.id;allowed.add(id);
      const g=upsert(id,pickup.kind,()=>{
        const g=new THREE.Group();
        const color=pickup.kind==='health'?0x70ffc3:pickup.kind==='stamina'?0x55ddff:0xffd36c;
        const ring=new THREE.Mesh(new THREE.TorusGeometry(5,1.7,9,20),emissive(color,2.5));
        g.add(ring);add(g,ball(2,emissive(color,2)),0,0,0);
        return g;
      });
      g.position.set(coord(pickup.x),coord(pickup.y),36);
    }
    for(const projectile of s.projectiles){
      const id='projectile:'+projectile.id;allowed.add(id);
      const g=upsert(id,projectile.owner,()=>{
        const g=new THREE.Group();
        add(g,ball(2.7,emissive(projectile.owner==='player'?0x66ffff:0xff456a,3.3)),0,0,0);
        return g;
      });
      g.position.set(coord(projectile.x),coord(projectile.y),43);
    }
    for(const [id,g] of dynamic)if(!allowed.has(id)){actors.remove(g);clearGroup(g);dynamic.delete(id)}
    perf.entityCount=allowed.size;
  }

  function resize(){
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    const aspect=w/h;
    camera.aspect=aspect;
    camera.fov=inspectCharacters?43:heroCamera?24:(aspect<1.2?47:37);
    camera.updateProjectionMatrix();
  }
  function draw(now){
    if(!running)return;
    requestAnimationFrame(draw);
    const data=getFrame();if(!data?.snapshot)return;
    const s=data.snapshot;
    if(lastChecksum!==s.publicChecksum)sync(s);
    const rawMs=now-lastAt,dt=clamp(rawMs/1000,0,.1);lastAt=now;resize();
    if(rawMs>0&&Number.isFinite(rawMs)){frameTotalMs+=rawMs;frameSampleCount++;if(rawMs>33.3)slowFrames++;}
    const authoritativeX=coord(s.player.x),authoritativeY=coord(s.player.y);
    if(visualRun!==s.runToken||visualX===null||visualFloor!==s.floor){visualX=authoritativeX;visualY=authoritativeY;visualRun=s.runToken;visualFloor=s.floor}
    const follow=reducedMotion?1:1-Math.exp(-dt*13);
    visualX+=(authoritativeX-visualX)*follow;visualY+=(authoritativeY-visualY)*follow;
    const targetX=visualX,targetY=inspectCharacters?visualY+7:heroCamera?visualY+8:coord(data.camera?.centerY??s.player.y);
    // Smooth tracking affects presentation only, never the simulation.
    const motion=reducedMotion?1:1-Math.exp(-dt*4.2);
    cameraX+=(clamp(targetX,80,worldWidth-80)-cameraX)*motion;
    cameraY+=(targetY-cameraY)*motion;
    const shake=!reducedMotion&&s.dangerPermille>800?Math.sin(now*.037)*1.5:0;
    const depth=inspectCharacters?225:heroCamera?134:214;
    camera.position.set(cameraX+(heroCamera?10:31)+shake,cameraY+(heroCamera?6:16)+shake*.6,depth);
    camera.lookAt(cameraX,cameraY,-18);
    player.position.set(visualX,visualY,36);
    const collisionScale=clamp(coord(s.player.halfHeight)/26,.3,1.6);
    player.scale.set((s.player.facing===-1?-1:1)*collisionScale,collisionScale,collisionScale);
    player.visible=!inspectCharacters&&s.player.health>0;
    inspector.position.set(visualX,visualY,46);
    for(let i=0;i<inspectors.length;i++){
      const figure=inspectors[i];figure.character.position.set((i-1.5)*49,0,0);
      figure.character.scale.setScalar(i===3?1.18:1.05);
      poseTowerCharacter(figure.character,{time:now*.001+i*.33,vx:1800,state:i===0?'airborne':'standing',vy:i===0?7000:0,telegraph:i===2,reducedMotion});
    }
    glow.position.set(visualX,visualY+14,36);
    poseTowerCharacter(player,{time:now*.001,state:s.player.state,vx:s.player.vx,vy:s.player.vy,mode:s.intent.mode,reducedMotion});
    for(const [id,g] of dynamic){
      if(id.startsWith('enemy:')&&g.visible)poseTowerCharacter(g,{time:now*.001+id.length,vx:1800,state:'standing',telegraph:g.userData.telegraph,reducedMotion});
      else if(id.startsWith('pickup:')){g.rotation.y=reducedMotion?0:now*.0016;g.position.y+=reducedMotion?0:Math.sin(now*.002+g.position.x)*dt*.8}
    }
    // Keep observed performance measurable for the independent critic.
    animateTowerEnvironment(ornament,now*.001,reducedMotion);
    animateBiomeLandmarks(landmarks,now*.001,reducedMotion);
    renderer.render(scene,camera);observedFrames++;
    if(observedFrames%60===0){perf.frames=observedFrames;perf.drawCalls=renderer.info.render.calls;perf.triangles=renderer.info.render.triangles;perf.heroParts=(()=>{let count=0;player.traverse(o=>{if(o.isMesh)count++});return count})();perf.renderMode='webgl-3d';perf.state=s.player.state;perf.heroCamera=heroCamera;perf.lens='perspective';perf.inspectCharacters=inspectCharacters;perf.inspectionModels=inspectors.length;perf.biomeLandmarks=landmarks?.world?.children.length||0;perf.highContrast=highContrast;perf.averageFps=frameTotalMs>0?Math.round(1000*frameSampleCount/frameTotalMs):0;perf.slowFrames=slowFrames;perf.sampledFrames=frameSampleCount;perf.pixelRatio=renderer.getPixelRatio();}
  }
  const onLost=event=>{event.preventDefault();running=false;renderer.dispose();canvas.remove();document.body.dataset.towerRenderer='2d-fallback';window.__TOWER_3D_ACTIVE__=false};
  canvas.addEventListener('webglcontextlost',onLost,{once:true});
  window.addEventListener('resize',resize);
  document.body.dataset.towerRenderer='three-dimensional';
  window.__TOWER_3D_ACTIVE__=true;
  resize();requestAnimationFrame(draw);
  return{destroy(){running=false;window.removeEventListener('resize',resize);renderer.dispose();canvas.remove();window.__TOWER_3D_ACTIVE__=false;document.body.dataset.towerRenderer='2d-fallback'}};
}
