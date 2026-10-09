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
import {createTowerEffectsDirector} from '/tower/effects-v6.js';
import {compactRigDraws} from '/tower/rig-batch-v17.js';
import {createTowerLedge} from '/tower/ledge-v18.js';
import {mountTowerAtmosphere,animateTowerAtmosphere} from '/tower/atmosphere-v8.js';
import {selectVisibleLedge,applyContactPose} from '/tower/grip-v10.js';

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
    child.traverse(obj=>{if(obj.isMesh||obj.isPoints){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>{if(!m.userData?.pooled)m.dispose()});else if(!obj.material?.userData?.pooled)obj.material?.dispose()}});
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
  mat.userData.pooled=true;vistaCache.set(theme,mat);return mat;
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
  material.userData.pooled=true;masonry.set(name,material);return material;
}

export function mountTower3D({host,getFrame,reducedMotion=false,highContrast=false,heroCamera=false,quality='auto',inspectCharacters=false}){
  const canvas=document.createElement('canvas');
  canvas.id='tower-3d-canvas';canvas.dataset.testid='tower-3d-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  host.appendChild(canvas);
  let renderer,softwareRenderer=false,lowPower=quality==='low'||(quality==='auto'&&window.innerWidth<850);
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:!lowPower,alpha:false,powerPreference:'high-performance'});
    try{
      const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
      const hardware=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||'');
      softwareRenderer=/swiftshader|llvmpipe|software rasterizer|softpipe/i.test(hardware);
    }catch{}
    lowPower=lowPower||softwareRenderer;
    // Four production rigs are expensive to rasterize under CI's SwiftShader.
    // The opt-in inspection gallery trades pixel density for a responsive real WebGL frame.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,inspectCharacters&&softwareRenderer?.65:lowPower?1:1.45));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.34;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
  }catch(error){canvas.remove();throw error}
  const scene=new THREE.Scene(),fog=new THREE.FogExp2(0x987c6e,.00075);scene.fog=fog;
  const camera=new THREE.PerspectiveCamera(37,16/9,.3,1400);
  const backdrop=new THREE.Group(),structures=new THREE.Group(),actors=new THREE.Group(),effects=new THREE.Group();
  scene.add(backdrop,structures,actors,effects);
  const actionEffects=createTowerEffectsDirector(effects);
  const hemi=new THREE.HemisphereLight(0xffedd6,0x43455d,1.65);scene.add(hemi);
  // Soft, directional shadowing anchors the playable platforms without changing collision.
  renderer.shadowMap.enabled=!lowPower;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const key=new THREE.DirectionalLight(0xffddb0,3.4);key.position.set(-45,120,135);key.castShadow=!lowPower;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-300;key.shadow.camera.right=300;key.shadow.camera.top=300;key.shadow.camera.bottom=-300;key.shadow.camera.near=1;key.shadow.camera.far=650;key.shadow.bias=-.0003;scene.add(key,key.target);
  const rim=new THREE.DirectionalLight(0x9edce2,2.9);rim.position.set(80,55,-30);scene.add(rim,rim.target);
  const player=createTowerCharacter({tint:0xf7a65d,kind:'climber'});
  // Shadows on every minute rivet and tiny finger segment multiply draw calls.
  // Keep only the largest 22 Wayfinder surfaces shadow-casting in cinematics.
  const shadowCandidates=[];
  player.traverse(o=>{if(o.isMesh){o.castShadow=false;shadowCandidates.push(o)}});
  // Only render large body-part shadows; tiny visor seams / rivets add nothing at gameplay scale.
  shadowCandidates.slice(0,18).forEach(o=>o.castShadow=true);
  actors.add(player);
  // This quality-review turntable reuses exactly the same production character assets.
  // It does not alter game authority or the live snapshot and is opt-in only.
  const inspector=new THREE.Group();inspector.visible=inspectCharacters;actors.add(inspector);
  if(inspectCharacters){
    // A lightweight, deliberately isolated studio presents the SAME animated
    // production rigs without drawing an entire procedural level behind them.
    // The regular game retains every biome, hazard and gameplay snapshot.
    const card=document.createElement('canvas');card.width=256;card.height=256;
    const pen=card.getContext('2d');
    const gradient=pen.createLinearGradient(0,0,0,256);
    gradient.addColorStop(0,'#546c88');gradient.addColorStop(.55,'#253d56');gradient.addColorStop(1,'#13263d');
    pen.fillStyle=gradient;pen.fillRect(0,0,256,256);
    for(let i=0;i<4;i++){
      const x=32+i*64;pen.fillStyle='rgba(241,204,149,.065)';pen.fillRect(x-19,0,38,256);
      pen.strokeStyle='rgba(248,221,180,.18)';pen.strokeRect(x-26,16,52,220);
    }
    const map=new THREE.CanvasTexture(card);map.colorSpace=THREE.SRGBColorSpace;
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(490,310),new THREE.MeshBasicMaterial({map,depthWrite:false}));
    panel.position.set(0,0,-115);inspector.add(panel);
    const pedestalMat=new THREE.MeshStandardMaterial({color:0x38556a,metalness:.3,roughness:.56});
    const trimMat=new THREE.MeshBasicMaterial({color:0xecc58e});
    for(let i=0;i<4;i++){
      const x=(i-1.5)*49;
      const plinth=new THREE.Mesh(new THREE.CylinderGeometry(21,24,3,16),pedestalMat);
      plinth.position.set(x,-29,-5);inspector.add(plinth);
      const edge=new THREE.Mesh(new THREE.TorusGeometry(21,1.1,5,24),trimMat);
      edge.position.set(x,-27,-5);edge.rotation.x=Math.PI/2;inspector.add(edge);
    }
  }
  const inspectors=inspectCharacters?[
    ['WAYFINDER','climber',0xf7a65d,false],
    ['SENTINEL','sentinel',0x659e7e,false],
    ['SHOOTER','shooter',0xed6559,false],
    ['GUARDIAN','guardian',0xe8bd78,true]
  ].map(([name,kind,tint,guardian])=>{
    const character=createTowerCharacter({kind,tint,guardian});
    const rigReduction=compactRigDraws(character);
    character.userData.galleryBatch=rigReduction;
    const title=document.createElement('canvas');title.width=256;title.height=64;
    const pen=title.getContext('2d');pen.fillStyle='rgba(36,24,30,.86)';pen.fillRect(0,0,256,64);
    pen.strokeStyle='#f8d9a0';pen.lineWidth=3;pen.strokeRect(2,2,252,60);
    pen.fillStyle='#fff1d4';pen.font='bold 26px sans-serif';pen.textAlign='center';pen.fillText(name,128,42);
    const tex=new THREE.CanvasTexture(title);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
    label.scale.set(37,9,1);character.add(label);label.position.set(0,37,1);
    inspector.add(character);return{character,name,kind};
  }):[];
  const glow=new THREE.PointLight(0xffc273,66,150,2);actors.add(glow);
  const dynamic=new Map(),platformMeshes=new Map();
  let floor=-1,theme='',lastChecksum='',latest=null,frame=null,running=true,lastAt=performance.now(),ornament=null,landmarks=null,atmosphere=null;
  let cameraY=35,cameraX=240,worldWidth=480,observedFrames=0,visualX=null,visualY=null,visualRun='',visualFloor=-1;
  let frameTotalMs=0,slowFrames=0,frameSampleCount=0;
  const perf={frames:0,drawCalls:0,triangles:0,entityCount:0,phase:'initialized',bootError:null,softwareRenderer,lowPower};window.__TOWER_3D_DIAGNOSTICS__=perf;

  function buildBackdrop(s){
    clearGroup(backdrop);clearGroup(structures);platformMeshes.clear();for(const [id,obj] of dynamic){actors.remove(obj);clearGroup(obj);dynamic.delete(id)}
    floor=s.floor;theme=s.theme;worldWidth=coord(s.worldWidth);
    if(inspectCharacters){
      scene.background=new THREE.Color(0x1c3046);scene.fog=null;
      perf.inspectionScene='isolated-production-rigs';
      return;
    }
    const standard=palettes[theme]||palettes.foundry;
    const p=highContrast?{...standard,stone:0x59616b,rim:0xffffff,glow:0xffe2a5,haze:0x21212b,accent:0xffffff}:standard;
    scene.background=new THREE.Color(p.haze);fog.color.setHex(p.haze);scene.fog=highContrast?null:fog;
    key.color.setHex(p.accent);
    const bounce={foundry:0x8cdaea,ruins:0x7de1af,storm:0xaff6ff,clockwork:0xb4d5ef,void:0xe1a7ff};
    rim.color.setHex(bounce[theme]||0xb5d9e6);
    renderer.toneMappingExposure=theme==='void'?1.44:theme==='ruins'?1.39:1.34;
    const stone=stoneworkMaterial(theme,p.stone),trim=matte(p.rim,.64,.44),dark=matte(0x131923,.96,.08),light=emissive(p.glow,1.9);
    const centerY=coord(s.chunkBaseY+s.chunkHeight*.5);
    // The v4 visual pass removes the grid-like wall responsible for the flat blue prototype look.
    // Monument silhouettes, landscape horizons, open galleries and warm sunlight now define the world.
    buildPainterlyTowerBackdrop({group:backdrop,snapshot:s,theme,palette:p,worldWidth});
    landmarks=buildBiomeLandmarks({group:backdrop,snapshot:s,palette:p,worldWidth});
    atmosphere=mountTowerAtmosphere({group:backdrop,snapshot:s,quality});
    // Colored environmental dust is now batched by the V8 atmosphere director.
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
    ornament=(s.floor>0&&s.floor%8===0)?decorateTowerEnvironment({group:backdrop,snapshot:s,theme,palette:p,worldWidth}):null;
    // Actual snapshot geometry, not an invented obstacle course.
    for(const platform of s.platforms){
      // Chipped ledge silhouettes inherit only immutable authoritative collision
      // dimensions; decorative cracks never enlarge physical platform bounds.
      const group=createTowerLedge({platform,theme});
      group.position.set(coord(platform.x+platform.width/2),coord(platform.y+platform.height/2),5);
      structures.add(group);
      platformMeshes.set(platform.id,group);
    }
    // Every visible traversable horizontal shape above is authoritative.
    // Removed six always-on floating lamps/boxes that formerly cluttered the
    // collision-readable silhouette in every tower screenshot.
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
    if(inspectCharacters){perf.entityCount=0;return;}
    actionEffects.ingest(s);
    // Exact moving platform coordinates come from the same fixed-step physics tick
    // used for collisions, replay and the Wayfinder's visible handhold selection.
    for(const platform of s.platforms){
      const visual=platformMeshes.get(platform.id);if(!visual)continue;
      visual.position.set(coord(platform.x+platform.width/2),coord(platform.y+platform.height/2),5);
    }
    perf.ledgeModels=platformMeshes.size;
    perf.ledgeSyncError=s.platforms.reduce((max,p)=>{
      const visual=platformMeshes.get(p.id);
      if(!visual)return Math.max(max,9999);
      return Math.max(max,
        Math.abs(visual.position.x-coord(p.x+p.width/2)),
        Math.abs(visual.position.y-coord(p.y+p.height/2)));
    },0);
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
      g.userData.authoritativeY=coord(pickup.y);
      g.position.set(coord(pickup.x),g.userData.authoritativeY,36);
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
    perf.movingPlatforms=s.platforms.filter(p=>p.kind==='moving').length;
  }

  function resize(){
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    const aspect=w/h;
    camera.aspect=aspect;
    camera.fov=inspectCharacters?43:heroCamera?34:(aspect<1.2?47:37);
    camera.updateProjectionMatrix();
  }
  function fallback3D(error){
    if(!running)return;
    running=false;
    window.removeEventListener('resize',resize);
    try{actionEffects.dispose()}catch{}
    try{renderer.dispose()}catch{}
    canvas.remove();
    document.body.dataset.towerRenderer='2d-fallback';
    window.__TOWER_3D_ACTIVE__=false;
    if(error){perf.fallbackReason=String(error);perf.fallbackStack=error?.stack?.slice(0,1800)||null;console.warn('Tower 3D context recovered to 2D fallback:',String(error));}
  }
  function draw(now){
    if(!running)return;
    requestAnimationFrame(draw);
    try{
    const data=getFrame();if(!data?.snapshot)return;
    const s=data.snapshot;
    perf.phase='synchronizing';
    if(lastChecksum!==s.publicChecksum)sync(s);
    perf.phase='animation';
    const rawMs=now-lastAt,dt=clamp(rawMs/1000,0,.1);lastAt=now;resize();
    if(rawMs>0&&Number.isFinite(rawMs)){frameTotalMs+=rawMs;frameSampleCount++;if(rawMs>33.3)slowFrames++;}
    const authoritativeX=coord(s.player.x),authoritativeY=coord(s.player.y);
    const cameraNeedsSnap=visualRun!==s.runToken||visualX===null||visualFloor!==s.floor;
    if(cameraNeedsSnap){visualX=authoritativeX;visualY=authoritativeY;visualRun=s.runToken;visualFloor=s.floor}
    const follow=reducedMotion?1:1-Math.exp(-dt*13);
    visualX+=(authoritativeX-visualX)*follow;visualY+=(authoritativeY-visualY)*follow;
    const targetX=visualX,targetY=inspectCharacters?visualY+7:heroCamera?visualY+2:coord(data.camera?.centerY??s.player.y);
    // Smooth tracking affects presentation only, never the simulation.
    const motion=reducedMotion?1:1-Math.exp(-dt*4.2);
    // Cinematic close-ups must center the *actual* hero, including at a new
    // floor/run. The regular camera keeps its world-boundary composition.
    const desiredX=heroCamera?targetX:clamp(targetX,80,worldWidth-80);
    if(cameraNeedsSnap){cameraX=desiredX;cameraY=targetY}
    else{cameraX+=(desiredX-cameraX)*motion;cameraY+=(targetY-cameraY)*motion;}
    const shake=!reducedMotion&&s.dangerPermille>800?Math.sin(now*.037)*1.5:0;
    // Re-anchor directional light targets at the current floor. The old setup kept
    // its shadow frustum near floor zero, making later floors appear flat.
    key.position.set(cameraX-72,cameraY+130,155);
    key.target.position.set(cameraX,cameraY,0);
    key.target.updateMatrixWorld();
    rim.position.set(cameraX+87,cameraY+66,-54);
    rim.target.position.set(cameraX,cameraY,0);
    rim.target.updateMatrixWorld();
    const depth=inspectCharacters?225:heroCamera?174:214;
    camera.position.set(cameraX+(heroCamera?0:31)+shake,cameraY+(heroCamera?0:16)+shake*.6,depth);
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
    const grip=inspectCharacters?null:selectVisibleLedge(s,{
      actorX:visualX,actorY:visualY,scale:collisionScale,facing:s.player.facing
    });
    const visuallyGripping=applyContactPose(player,grip,{reducedMotion});
    perf.visibleHandhold=visuallyGripping?grip.platformId:null;
    perf.armIKActive=visuallyGripping;
    for(const [id,g] of dynamic){
      if(id.startsWith('enemy:')&&g.visible)poseTowerCharacter(g,{time:now*.001+id.length,vx:1800,state:'standing',telegraph:g.userData.telegraph,reducedMotion});
      else if(id.startsWith('pickup:')){g.rotation.y=reducedMotion?0:now*.0016;g.position.y=g.userData.authoritativeY+(reducedMotion?0:Math.sin(now*.002+g.position.x)*.8)}
    }
    // Keep observed performance measurable for the independent critic.
    if(!inspectCharacters){
      animateTowerEnvironment(ornament,now*.001,reducedMotion);
      animateBiomeLandmarks(landmarks,now*.001,reducedMotion);
      animateTowerAtmosphere(atmosphere,now,reducedMotion);
      actionEffects.frame(dt,s,visualX,visualY,reducedMotion);
    }
    perf.phase='rendering';
    renderer.render(scene,camera);observedFrames++;
    perf.phase='presenting';
    perf.renderedFrames=observedFrames;
    perf.lastFrameTick=s.tick;
    perf.drawCalls=renderer.info.render.calls;
    perf.triangles=renderer.info.render.triangles;
    if(heroCamera&&player.visible&&(observedFrames===1||observedFrames%60===0)){
      const bounds=new THREE.Box3().setFromObject(player);
      const projected=[];
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])projected.push(new THREE.Vector3(x,y,z).project(camera));
      perf.heroFraming={left:(1-Math.max(...projected.map(v=>v.x)))/2,right:(1-Math.min(...projected.map(v=>v.x)))/2,top:(1-Math.max(...projected.map(v=>v.y)))/2,bottom:(1-Math.min(...projected.map(v=>v.y)))/2};
    }
    if(observedFrames===1||observedFrames%60===0){perf.frames=observedFrames;perf.drawCalls=renderer.info.render.calls;perf.triangles=renderer.info.render.triangles;perf.heroParts=(()=>{let count=0;player.traverse(o=>{if(o.isMesh)count++});return count})();perf.heroSculpt=player.userData.sculpt||null;perf.renderMode='webgl-3d';perf.state=s.player.state;perf.heroCamera=heroCamera;perf.lens='perspective';perf.inspectCharacters=inspectCharacters;perf.inspectionModels=inspectors.length;perf.inspectionDrawsSaved=inspectors.reduce((sum,figure)=>sum+(figure.character.userData.galleryBatch?.reduced||0),0);perf.biomeLandmarks=landmarks?.world?.children.length||0;perf.atmosphere=atmosphere?.metrics||null;perf.actionFx=actionEffects.metrics();perf.highContrast=highContrast;perf.averageFps=frameTotalMs>0?Math.round(1000*frameSampleCount/frameTotalMs):0;perf.slowFrames=slowFrames;perf.sampledFrames=frameSampleCount;perf.pixelRatio=renderer.getPixelRatio();perf.effects=actionEffects.metrics();}
    }catch(error){fallback3D(error)}
  }
  const onLost=event=>{event.preventDefault();fallback3D('webglcontextlost')};
  canvas.addEventListener('webglcontextlost',onLost,{once:true});
  window.addEventListener('resize',resize);
  document.body.dataset.towerRenderer='three-dimensional';
  window.__TOWER_3D_ACTIVE__=true;
  resize();requestAnimationFrame(draw);
  return{destroy(){fallback3D()}};
}
