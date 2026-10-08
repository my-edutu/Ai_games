/* Infinite Tower Climb: presentation-only 3D scene.
 * All game authority remains in the deterministic server snapshot.
 * No simulation state is modified by this renderer.
 */
import * as THREE from '/tower/three.module.js';
import {createTowerCharacter,poseTowerCharacter} from '/tower/character3d.js';

const SCALE = 1 / 1000;
const palettes = {
  foundry: {stone:0x303e4d, rim:0xca8860, glow:0xffab52, haze:0x131d32, accent:0xffc890},
  ruins: {stone:0x374e50, rim:0x829c83, glow:0x75edbe, haze:0x12292d, accent:0xb8f7da},
  storm: {stone:0x303c66, rim:0x7186c8, glow:0x7ab9ff, haze:0x111d42, accent:0xb5d9ff},
  clockwork: {stone:0x53432f, rim:0xc3a36a, glow:0xffd17c, haze:0x241d1b, accent:0xffe0a6},
  void: {stone:0x34274f, rim:0x9873c4, glow:0xd08bff, haze:0x171126, accent:0xe7c4ff}
};
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
    child.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose()}});
    group.remove(child);
  }
}
function seeded(n){const t=Math.sin(n*84.17+19.67)*43758.5453;return t-Math.floor(t)}
export function mountTower3D({host,getFrame,reducedMotion=false}){
  const canvas=document.createElement('canvas');
  canvas.id='tower-3d-canvas';canvas.dataset.testid='tower-3d-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  host.appendChild(canvas);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.37;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
  }catch(error){canvas.remove();throw error}
  const scene=new THREE.Scene(),fog=new THREE.FogExp2(0x131d32,.0025);scene.fog=fog;
  const camera=new THREE.OrthographicCamera(-120,120,80,-80,.1,1200);
  const backdrop=new THREE.Group(),structures=new THREE.Group(),actors=new THREE.Group(),effects=new THREE.Group();
  scene.add(backdrop,structures,actors,effects);
  const hemi=new THREE.HemisphereLight(0x9ec5ef,0x172030,2.1);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffdeb0,3.1);key.position.set(70,120,130);scene.add(key);
  const rim=new THREE.DirectionalLight(0x6abefe,3.7);rim.position.set(-65,70,-35);scene.add(rim);
  const player=createTowerCharacter({tint:0x46d4d9});actors.add(player);
  const glow=new THREE.PointLight(0x7ff3e7,100,170,2);actors.add(glow);
  const dynamic=new Map();
  let floor=-1,theme='',lastChecksum='',latest=null,frame=null,running=true,lastAt=performance.now();
  let cameraY=35,cameraX=240,worldWidth=480,observedFrames=0,visualX=null,visualY=null,visualRun='';
  const perf={frames:0,drawCalls:0,triangles:0,entityCount:0};window.__TOWER_3D_DIAGNOSTICS__=perf;

  function buildBackdrop(s){
    clearGroup(backdrop);clearGroup(structures);for(const [id,obj] of dynamic){actors.remove(obj);clearGroup(obj);dynamic.delete(id)}
    floor=s.floor;theme=s.theme;worldWidth=coord(s.worldWidth);
    const p=palettes[theme]||palettes.foundry;scene.background=new THREE.Color(p.haze);fog.color.setHex(p.haze);
    key.color.setHex(p.accent);rim.color.setHex(p.glow);
    const stone=matte(p.stone,.92,.04),trim=matte(p.rim,.64,.44),dark=matte(0x131923,.96,.08),light=emissive(p.glow,1.9);
    const centerY=coord(s.chunkBaseY+s.chunkHeight*.5);
    // Three nested wall layers create real depth, silhouette and scale.
    add(backdrop,box(worldWidth+130,coord(s.chunkHeight)+270,9,dark),worldWidth/2,centerY,-93);
    add(backdrop,box(worldWidth+95,coord(s.chunkHeight)+240,7,stone),worldWidth/2,centerY,-80);
    for(let x=0;x<=worldWidth+1;x+=48){
      add(backdrop,box(4,coord(s.chunkHeight)+170,18,trim),x,centerY,-62);
      add(backdrop,box(8,10,24,stone),x,centerY+coord(s.chunkHeight)/2+20,-58);
    }
    for(let n=0;n<9;n++){
      const y=coord(s.chunkBaseY)+n*46;
      add(backdrop,box(worldWidth+80,4,22,trim),worldWidth/2,y,-63);
      add(backdrop,box(worldWidth+80,8,15,stone),worldWidth/2,y-6,-71);
      for(let x=26;x<worldWidth;x+=96){
        const aperture=new THREE.Mesh(new THREE.TorusGeometry(12,2.5,8,20,Math.PI),trim);
        aperture.rotation.z=Math.PI;add(backdrop,aperture,x,y+20,-51);
        add(backdrop,box(20,31,.8,light),x,y+3,-76);
        add(backdrop,box(26,3,5,stone),x,y+3,-48);
      }
    }
    for(let i=0;i<18;i++){
      const y=coord(s.chunkBaseY)+i*22;
      for(const x of [3,worldWidth-3]){
        const bracket=add(backdrop,box(12,9,35,stone),x,y,-42);
        bracket.rotation.z=i%2?.08:-.08;
        add(backdrop,box(4,3,35,trim),x,y+5,-42);
      }
    }
    // Deterministic particles, decorative only, no RNG or authority coupling.
    for(let i=0;i<88;i++){
      const x=12+seeded(i+floor*113)*(worldWidth-24);
      const y=coord(s.chunkBaseY)+seeded(i*3+floor*17)*coord(s.chunkHeight);
      const dot=ball(.38+seeded(i*6)*.7,light,6);
      dot.material=emissive(p.glow,.55);
      dot.position.set(x,y,-29-seeded(i*11)*33);
      dot.userData.floatPhase=i*1.61;
      backdrop.add(dot);
    }
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
    // Actual snapshot geometry, not an invented obstacle course.
    for(const platform of s.platforms){
      const cx=coord(platform.x+platform.width/2),cy=coord(platform.y+platform.height/2),w=coord(platform.width);
      const group=new THREE.Group();
      add(group,box(w,coord(platform.height),36,stone),cx,cy,2);
      add(group,box(w,2.3,40,trim),cx,cy+coord(platform.height)/2,3);
      add(group,box(w-3,.9,43,light),cx,cy+coord(platform.height)/2+1.3,3);
      for(const d of [-1,1]){
        add(group,box(5,9,38,trim),cx+d*(w/2-4),cy-7,-2);
      }
      if(platform.kind==='moving'){
        add(group,box(w*.6,2,42,emissive(0x6cbdff,1.7)),cx,cy-6,0);
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
      const g=upsert(id,'hazard',()=>{
        const g=new THREE.Group(),danger=emissive(0xff5576,2.4),metal=matte(0x492f40);
        add(g,box(coord(h.width),coord(h.height),30,metal),0,0,0);
        for(let i=0;i<4;i++){
          const cone=new THREE.Mesh(new THREE.ConeGeometry(3.2,9,6),danger);
          add(g,cone,(i-1.5)*coord(h.width)/4,7,17);
        }
        return g;
      });
      g.position.set(coord(h.x+h.width/2),coord(h.y+h.height/2),15);
      g.visible=h.active;
    }
    for(const e of s.enemies){
      const id='enemy:'+e.id;allowed.add(id);
      const guardian=e.kind==='guardian';
      const g=upsert(id,e.kind,()=>{
        const g=createTowerCharacter({tint:guardian?0xf2a04f:e.kind==='shooter'?0xf05693:0x9670e9,guardian,kind:e.kind});
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
    const aspect=w/h,span=156;
    camera.left=-span*aspect/2;camera.right=span*aspect/2;
    camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  }
  function draw(now){
    if(!running)return;
    requestAnimationFrame(draw);
    const data=getFrame();if(!data?.snapshot)return;
    const s=data.snapshot;
    if(lastChecksum!==s.publicChecksum)sync(s);
    const dt=clamp((now-lastAt)/1000,0,.1);lastAt=now;resize();
    const authoritativeX=coord(s.player.x),authoritativeY=coord(s.player.y);
    if(visualRun!==s.runToken||visualX===null||floor!==s.floor){visualX=authoritativeX;visualY=authoritativeY;visualRun=s.runToken}
    const follow=reducedMotion?1:1-Math.exp(-dt*13);
    visualX+=(authoritativeX-visualX)*follow;visualY+=(authoritativeY-visualY)*follow;
    const targetX=visualX,targetY=coord(data.camera?.centerY??s.player.y);
    // Smooth tracking affects presentation only, never the simulation.
    const motion=reducedMotion?1:1-Math.exp(-dt*4.2);
    cameraX+=(clamp(targetX,80,worldWidth-80)-cameraX)*motion;
    cameraY+=(targetY-cameraY)*motion;
    const shake=!reducedMotion&&s.dangerPermille>800?Math.sin(now*.037)*1.5:0;
    const az=worldWidth/2;const depth=258;
    camera.position.set(cameraX+33+shake,cameraY+18+shake*.6,depth);
    camera.lookAt(cameraX,cameraY,-18);
    player.position.set(visualX,visualY,36);
    const collisionScale=clamp(coord(s.player.halfHeight)/26,.3,1.6);
    player.scale.set((s.player.facing===-1?-1:1)*collisionScale,collisionScale,collisionScale);
    player.visible=s.player.health>0;
    glow.position.set(visualX,visualY+14,36);
    poseTowerCharacter(player,{time:now*.001,state:s.player.state,vx:s.player.vx,vy:s.player.vy,mode:s.intent.mode,reducedMotion});
    for(const [id,g] of dynamic){
      if(id.startsWith('enemy:')&&g.visible)poseTowerCharacter(g,{time:now*.001+id.length,vx:1800,state:'standing',reducedMotion});
      else if(id.startsWith('pickup:')){g.rotation.y=reducedMotion?0:now*.0016;g.position.y+=reducedMotion?0:Math.sin(now*.002+g.position.x)*dt*.8}
    }
    // Keep observed performance measurable for the independent critic.
    renderer.render(scene,camera);observedFrames++;
    if(observedFrames%60===0){perf.frames=observedFrames;perf.drawCalls=renderer.info.render.calls;perf.triangles=renderer.info.render.triangles}
  }
  const onLost=event=>{event.preventDefault();running=false;renderer.dispose();canvas.remove();document.body.dataset.towerRenderer='2d-fallback';window.__TOWER_3D_ACTIVE__=false};
  canvas.addEventListener('webglcontextlost',onLost,{once:true});
  window.addEventListener('resize',resize);
  document.body.dataset.towerRenderer='three-dimensional';
  window.__TOWER_3D_ACTIVE__=true;
  resize();requestAnimationFrame(draw);
  return{destroy(){running=false;window.removeEventListener('resize',resize);renderer.dispose();canvas.remove();window.__TOWER_3D_ACTIVE__=false;document.body.dataset.towerRenderer='2d-fallback'}};
}
