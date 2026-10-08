import * as THREE from '/vendor/three.module.js';

// Presentation-only renderer. The Node simulation owns all movement, collision and rewards.
const $ = id => document.getElementById(id);
const canvas = $('game');
const ui = {
  district: $('district'), distance: $('distance'), tokens: $('tokens'), state: $('state'),
  cycle: $('cycle'), banner: $('banner'), event: $('event'), detail: $('detail'),
  mode: $('mode'), quality: $('quality'), outfit: $('outfit'), signal: $('signal'), fps: $('fps')
};
const DISTRICTS = {
  'mainland-morning': { name:'MAINLAND MORNING', sky:0x92c5cd, fog:0xc4d5ce, ground:0x545e61, warm:0xf7c470, skyLight:1.65 },
  'market-rush': { name:'MARKET RUSH', sky:0xf1c6a2, fog:0xdfb69a, ground:0x625a54, warm:0xffcc79, skyLight:1.7 },
  'danfo-junction': { name:'DANFO JUNCTION', sky:0xc0d7df, fog:0xcbd9d9, ground:0x4f5559, warm:0xffd07d, skyLight:1.55 },
  'rainy-lagos': { name:'RAINY LAGOS', sky:0x627985, fog:0x84949d, ground:0x364652, warm:0xc0d5e7, skyLight:0.85 },
  'island-night': { name:'ISLAND NIGHT', sky:0x111d36, fog:0x29324c, ground:0x232a39, warm:0xffc78a, skyLight:0.52 },
  'bridge-run': { name:'BRIDGE RUN', sky:0x91b5bc, fog:0xb6c9c4, ground:0x525e67, warm:0xffd6a5, skyLight:1.4 },
};
const OUTFITS = {
  'lagos-streetwear': [0xf7bb2d,0x14394a,0x18b6a5],
  'yoruba-agbada-fila': [0x174b76,0xe8dbc2,0xd7a83d],
  'igbo-isi-agu-red-cap': [0x2b2528,0xcba668,0xce364b],
  'hausa-baban-riga-cap': [0x16766b,0xf1dbab,0xd48a45]
};
const matCache = new Map();
const geomCache = new Map();
const material = (hex, metalness=0, roughness=0.79) => {
  const key = [hex, metalness, roughness].join(':');
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({color:hex, metalness,roughness}));
  return matCache.get(key);
};
function box(parent, w,h,d, x,y,z, color, cast=true) {
  const key = [w,h,d].join(':');
  if (!geomCache.has(key)) geomCache.set(key, new THREE.BoxGeometry(w,h,d));
  const mesh = new THREE.Mesh(geomCache.get(key), material(color));
  mesh.position.set(x,y,z); mesh.castShadow = cast; mesh.receiveShadow = !cast;
  parent.add(mesh);
  return mesh;
}
function ball(parent, size, x,y,z, color) {
  const key='sphere-'+size;
  if (!geomCache.has(key)) geomCache.set(key,new THREE.IcosahedronGeometry(size,2));
  const mesh=new THREE.Mesh(geomCache.get(key), material(color));
  mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function cylinder(parent,rTop,rBottom,height,x,y,z,color,segments=10) {
  const key=[rTop,rBottom,height,segments].join(':');
  if(!geomCache.has(key))geomCache.set(key,new THREE.CylinderGeometry(rTop,rBottom,height,segments));
  const mesh=new THREE.Mesh(geomCache.get(key),material(color));
  mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function labelSprite(parent,text,x,y,z,{color='#fff2cf',bg='#1d3947',scale=1}={}) {
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(8,8,496,112,16);ctx.fill();
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 54px Arial, sans-serif';ctx.fillText(text,256,67,470);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.position.set(x,y,z);sprite.scale.set(scale*4,scale,1);parent.add(sprite);
  sprite.userData.ownTexture=texture;
  return sprite;
}
function disposeGroup(group){
  group.traverse(object=>{if(object.userData.ownTexture)object.userData.ownTexture.dispose();if(object.isSprite)object.material.dispose();});
  group.parent?.remove(group);
}
function numberHash(n){let x=(Math.imul(n+1,0x9e3779b1)>>>0);x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;return (x>>>0)/4294967295;}
function pick(items,n){return items[Math.floor(numberHash(n)*items.length)%items.length];}

let renderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
} catch(error) {
  $('fallback').hidden=false;$('fallback').textContent='3D graphics could not start on this device. '+error.message;
  throw error;
}
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(52,1,.15,220);
const hemi=new THREE.HemisphereLight(0xecfaff,0x647261,1.2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe0a3,3.1);sun.position.set(-9,17,13);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;
sun.shadow.camera.top=20;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=0.5;sun.shadow.camera.far=70;scene.add(sun);
const terrain=new THREE.Group();scene.add(terrain);
const hazards=new THREE.Group();scene.add(hazards);
const hero=new THREE.Group();scene.add(hero);
const ambient=new THREE.Group();scene.add(ambient);
const worldState={district:'',finish:0,quality:'high',hazardIds:'',outfit:'',mode:'ai',lastEventTick:-1,frame:null,alive:false};
let latest=null;
let lastPacket=0;
let frames=0, fpsStamp=performance.now();

function makeShop(parent,x,z,seed,night=false){
  const width=2.7+numberHash(seed+7)*1.8, depth=2.8, height=3.0+numberHash(seed+9)*2.5;
  const tone=pick([0xd88e62,0xcab18b,0x9ebdb5,0xc1a0a5,0xe4c79c,0xa5b6c9],seed+15);
  box(parent,width,height,depth,x,height/2,z,tone);
  box(parent,width+.18,.27,depth+.1,x,height+.06,z,0x695953);
  box(parent,width*.84,.14,0.38,x,2.30,z-depth/2-.25,pick([0xf3a947,0x16a5a0,0x9b4877],seed+27));
  box(parent,width*.75,1.16,.05,x,1.20,z-depth/2-.04,0x354b59);
  for(let i=0;i<3;i++){
    const wx=x+(i-1)*width*.24;
    box(parent,width*.18,.66,.06,wx,height-1.15,z-depth/2-.045,night?0xffda8a:0x345b66,false);
    box(parent,.07,.72,.10,wx,height-1.15,z-depth/2-.09,0xe3d7b9,false);
  }
  box(parent,width+.34,.16,.65,x,2.37,z-depth/2-.55,0x335566);
  if(seed%4===0)labelSprite(parent,pick(['JOLLOF STOP','OJA MART','EKO TECH','SUYA SPOT','FRESH MARKET','PHONE HUB'],seed+3),x,2.81,z-depth/2-.68,{scale:.45,bg:'#154456'});
}
function makeBus(parent,x,z,variant=0){
  const b=new THREE.Group();parent.add(b);b.position.set(x,0,z);
  const yellow=variant%2?0xf5b528:0xffcd36;
  box(b,2.7,1.45,1.35,0,1.11,0,yellow);
  box(b,2.55,.65,1.4,-.04,1.79,0,0xffd649);
  box(b,.18,1.10,1.15,1.43,1.11,0,0x312e2d);
  for(const side of [-1,1]) {
    box(b,1.84,.50,.04,-.22,1.60,side*.698,0x31566a,false);
    for(let i=0;i<3;i++)box(b,.065,.58,.08,-.86+i*.64,1.6,side*.73,0xe5ddad,false);
    for(const wx of [-.79,.84]){
      const wheel=cylinder(b,.36,.36,.18,wx,.41,side*.71,0x232a31,12);wheel.rotation.x=Math.PI/2;
      const hub=cylinder(b,.15,.15,.185,wx,.41,side*.81,0xaab3b4,12);hub.rotation.x=Math.PI/2;
    }
  }
  box(b,.10,.28,.3,1.40,.78,-.39,0xf6f0bd,false);
  box(b,.10,.28,.3,1.40,.78,.39,0xf6f0bd,false);
  b.userData.bus=true;return b;
}
function makeTree(parent,x,z,seed){
  cylinder(parent,.10,.17,3.2,x,1.6,z,0x725848,8);
  for(let j=0;j<5;j++){
    const a=j*2*Math.PI/5+numberHash(seed)*.5;
    const crown=ball(parent,.95,x+Math.cos(a)*.54,3.45+numberHash(j+seed)*.24,z+Math.sin(a)*.54,0x3e8d62);
    crown.scale.set(1.25,.75,.9);
  }
}
function makePedestrian(parent,x,z,seed){
  const g=new THREE.Group();parent.add(g);g.position.set(x,0,z);
  const skin=pick([0x865235,0x9a6245,0x603a2a,0xb37e54],seed);
  const cloth=pick([0x2d827b,0xbd654d,0x314e8c,0xdbb063,0x865f80],seed+2);
  cylinder(g,.19,.27,.72,0,1.0,0,cloth);
  ball(g,.22,0,1.65,0,skin);
  box(g,.16,.7,.16,-.15,.36,0,0x303c46);
  box(g,.16,.7,.16,.15,.36,0,0x303c46);
  box(g,.12,.58,.12,0,1.1,.25,skin);
  g.userData.walkOffset=seed;return g;
}
function makeLamp(parent,x,z,night){
  cylinder(parent,.065,.085,5.0,x,2.5,z,0x47515b);
  box(parent,1,.10,.22,x+.44,5.00,z,0x47515b);
  box(parent,.56,.06,.40,x+.90,4.92,z,night?0xffe4a7:0xb7c6c3,false);
  if(night){
    const light=new THREE.PointLight(0xffbd78,6,7);
    light.position.set(x+.90,4.70,z);parent.add(light);
  }
}
function buildWorld(snapshot) {
  // Ambient and terrain children use shared geometry, so remove nodes without disposing shared meshes.
  while(terrain.children.length) { const obj=terrain.children[0];disposeGroup(obj); if(obj.parent===terrain)terrain.remove(obj); }
  while(ambient.children.length) { const obj=ambient.children[0];disposeGroup(obj); if(obj.parent===ambient)ambient.remove(obj); }
  const district=snapshot.progression?.districtId||'mainland-morning';
  const style=DISTRICTS[district]||DISTRICTS['mainland-morning'];
  scene.background=new THREE.Color(style.sky);scene.fog=new THREE.FogExp2(style.fog,.009);
  hemi.intensity=style.skyLight;sun.color.setHex(style.warm);
  sun.intensity=district==='island-night'?1.2:2.45;
  const night=district==='island-night';
  const length=Math.min(140,Math.max(38,snapshot.route.finishX+12));
  const road=box(terrain,length,.25,6.8,length/2-4,-.18,0,style.ground,false);
  road.receiveShadow=true;
  for(const side of [-1,1]){
    box(terrain,length,.25,1.1,length/2-4,.06,side*4.05,0xc6ad91,false);
    box(terrain,length,.25,.28,length/2-4,-.17,side*3.42,0x303e42,false);
  }
  for(let x=-3;x<length-5;x+=4.2){
    box(terrain,1.85,.026,.085,x,.006,-1.05,0xece0bd,false);
    box(terrain,1.85,.026,.085,x,.006,1.04,0xece0bd,false);
  }
  for(let i=0;i<Math.ceil(length/5);i++){
    const x=i*5-5.0;
    if(i%2===0) {
      makeShop(terrain,x+1,7.05,i+12,night);
      if(worldState.quality!=='low')makeShop(terrain,x+1,-7.05,i+71,night);
    }
    if(i%3===0) makeTree(terrain,x+.4,4.95,i+4);
    if(i%4===0) makeLamp(terrain,x,-4.40,night);
    if(i%4===1) makeBus(terrain,x+1.0,-2.42,i);
    if(worldState.quality!=='low' && i%3===2) {
      const npc=makePedestrian(ambient,x+2.0,4.55,i+32);
      npc.userData.baseX=x+2.0;
    }
  }
  for(const x of snapshot.route.checkpointXs){
    box(terrain,.16,3.8,.16,x,1.9,-3.10,0xf4bd45);
    labelSprite(terrain,'CHECKPOINT',x,3.88,-3.15,{scale:.7,bg:'#236b66'});
  }
  box(terrain,.24,4.6,.24,snapshot.route.finishX,2.30,-3.02,0xffc857);
  labelSprite(terrain,'FINISH LINE',snapshot.route.finishX,4.48,-3,{scale:1,bg:'#173d4c'});
  worldState.district=district;worldState.finish=snapshot.route.finishX;
}
const bodyParts={};
function buildHero(){
  const character=new THREE.Group();hero.add(character);bodyParts.root=character;
  const skin=material(0x805039),shoe=material(0xf0eee7),dark=material(0x263b4d);
  const jacket=box(character,.70,.75,.48,0,1.37,0,0xf7bb2d);bodyParts.jacket=jacket;
  const trim=box(character,.10,.68,.50,.05,1.37,0,0x18b6a5);bodyParts.trim=trim;
  const pack=box(character,.18,.57,.50,-.40,1.33,0,0x193747);pack.rotation.z=-.12;
  const neck=cylinder(character,.15,.15,.18,0,1.84,0,0x805039);
  const head=ball(character,.34,.07,2.12,0,0x805039);head.scale.set(.92,1,.87);
  ball(character,.25,0,2.39,0,0x24242a);
  ball(character,.12,.32,2.17,.11,0x805039);
  ball(character,.055,.35,2.20,.2,0xffffff);
  ball(character,.022,.40,2.21,.23,0x16252a);
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(-.02,1.68,side*.35);character.add(arm);
    box(arm,.20,.48,.21,0,-.23,0,0xf7bb2d);
    ball(arm,.12,0,-.53,0,0x805039);
    bodyParts[side===-1?'armL':'armR']=arm;
    const leg=new THREE.Group();leg.position.set(0,1.03,side*.19);character.add(leg);
    box(leg,.25,.63,.27,0,-.29,0,0x14394a);
    box(leg,.26,.36,.26,.05,-.71,0,0x14394a);
    box(leg,.39,.14,.30,.15,-.94,0,0xf1f3ef);
    bodyParts[side===-1?'legL':'legR']=leg;
  }
  bodyParts.head=head;bodyParts.neck=neck;bodyParts.shoe=shoe;bodyParts.dark=dark;bodyParts.skin=skin;
}
buildHero();
function outfitUpdate(outfit) {
  if(worldState.outfit===outfit)return;
  const colors=OUTFITS[outfit]||OUTFITS['lagos-streetwear'];
  bodyParts.jacket.material=material(colors[0]);
  bodyParts.trim.material=material(colors[2]);
  bodyParts.armL.children[0].material=material(colors[0]);
  bodyParts.armR.children[0].material=material(colors[0]);
  for(const leg of [bodyParts.legL,bodyParts.legR]){
    leg.children[0].material=material(colors[1]);
    leg.children[1].material=material(colors[1]);
  }
  worldState.outfit=outfit;
}
function makeHazard(h){
  const g=new THREE.Group();
  g.position.set(h.x,0,0);
  if(h.family.includes('danfo')||h.family.includes('molue')) {
    const bus=makeBus(g,0,0,0);bus.scale.set(h.family.includes('molue')?1.35:.95,.80,1.0);
  } else if(h.family.includes('crowd') || h.family.includes('disturbance')) {
    makePedestrian(g,-.3,0,2);makePedestrian(g,.3,0,3);
  } else {
    const danger=box(g,Math.max(.55,h.width),Math.max(.14,h.height*.84),.8,0,Math.max(.10,h.height*.40),0,h.family.includes('puddle')?0x52bac2:0xe07439);
    danger.castShadow=true;
  }
  const marker=ball(g,.17,0,2.7,0,0xf9d551);marker.scale.set(1.3,1.3,1.3);
  const cylinderMesh=cylinder(g,.42,.42,.025,0,.05,0,0xffd166);cylinderMesh.material=material(0xfbbf44);
  g.userData.marker=marker;
  hazards.add(g);return g;
}
const hazardMeshes=new Map();
function updateHazards(snapshot){
  const present=new Set();
  for(const h of snapshot.hazards){
    if(h.phase==='resolved'||h.phase==='hit')continue;
    if(!h.active && h.phase==='unseen')continue;
    present.add(h.id);
    let g=hazardMeshes.get(h.id);
    if(!g){g=makeHazard(h);hazardMeshes.set(h.id,g);}
    g.position.x=h.x;
    g.visible=h.active;
    g.userData.marker.position.y=2.65+Math.sin(performance.now()/230)*.13;
  }
  for(const [id,g] of hazardMeshes)if(!present.has(id)){disposeGroup(g);hazardMeshes.delete(id);}
}
function updateSnapshot(packet){
  if(!packet || !packet.snapshot || (latest&&packet.snapshot.tick<latest.snapshot.tick))return;
  latest=packet;lastPacket=performance.now();
  const s=packet.snapshot, p=s.progression;
  ui.district.textContent=DISTRICTS[p?.districtId]?.name||'MAINLAND MORNING';
  ui.distance.textContent=String(Math.round((p?.totalDistance||0)+s.progress)).padStart(4,'0')+' M';
  ui.tokens.textContent=String(s.resources?.ekoTokens||0).padStart(2,'0');
  ui.cycle.textContent='CYCLE '+String((p?.cycle||0)+1).padStart(2,'0');
  ui.state.textContent=s.lifecycle==='running'?'RUN LIVE':s.lifecycle.toUpperCase();
  ui.signal.textContent=packet.error?'INTEGRITY HOLD':packet.mode==='ai'?'AI PILOT ACTIVE':'PLAYER CONTROL';
  ui.mode.textContent=packet.mode==='ai'?'SWITCH TO PLAYER':'SWITCH TO AI';
  ui.outfit.value=packet.outfit;
  worldState.mode=packet.mode;
  if(worldState.district!==(p?.districtId||'mainland-morning') || worldState.finish!==s.route.finishX) {
    buildWorld(s);
    for(const g of hazardMeshes.values())disposeGroup(g);
    hazardMeshes.clear();
  }
  outfitUpdate(packet.outfit);
  updateHazards(s);
  if(s.recentEvents?.length){
    const event=s.recentEvents[s.recentEvents.length-1];
    if(event.tick>worldState.lastEventTick && event.type!=='command.rejected'){
      worldState.lastEventTick=event.tick;
      const text=({
        'checkpoint.reached':'CHECKPOINT SECURED',
        'player.jumped':'CLEAN JUMP',
        'player.vaulted':'VAULT!',
        'player.slid':'LOW SLIDE',
        'hazard.warned':'WATCH THE ROAD',
        'hazard.resolved':'DANGER CLEARED',
        'hazard.hit':'HAZARD CONTACT',
        'token.collected':'EKO TOKEN +1',
        'district.completed':'DISTRICT COMPLETE',
        'district.started':'NEXT DISTRICT',
        'run.failed':'RUN ENDED',
        'run.restarted':'BACK ON THE STREET'
      })[event.type];
      if(text){ui.event.textContent=text;ui.event.classList.remove('pop');void ui.event.offsetWidth;ui.event.classList.add('pop');}
    }
  }
  ui.banner.hidden=s.lifecycle==='running';
  ui.banner.textContent=s.lifecycle==='failed'?'RUN OVER · RESTARTING':s.lifecycle==='intermission'?'DISTRICT CLEARED · NEXT UP':s.lifecycle==='running'?'':s.lifecycle.toUpperCase();
  ui.detail.textContent=packet.error?'Gameplay paused due to an integrity error.':'60Hz AUTHORITATIVE SIMULATION · LAGOS, NIGERIA';
}
const keys=new Set();
const pending={jumpPressed:false,jumpReleased:false,slide:false,vault:false};
function keyAction(code,down){
  if(down&&!keys.has(code)){
    if(code==='Space'||code==='ArrowUp')pending.jumpPressed=true;
    if(code==='ArrowDown'||code==='KeyS')pending.slide=true;
    if(code==='KeyV')pending.vault=true;
  }
  if(!down&&keys.has(code)&&['Space','ArrowUp'].includes(code))pending.jumpReleased=true;
  if(down)keys.add(code);else keys.delete(code);
}
window.addEventListener('keydown',ev=>{if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.code))ev.preventDefault();keyAction(ev.code,true);});
window.addEventListener('keyup',ev=>keyAction(ev.code,false));
for(const b of document.querySelectorAll('[data-control]')){
  const code=b.dataset.control;
  b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);keyAction(code,true);});
  for(const e of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(e,()=>keyAction(code,false));
}
function postControl(body){
  return fetch('/eko/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>null);
}
$('mode').addEventListener('click',()=>postControl({mode:worldState.mode==='ai'?'player':'ai'}));
$('outfit').addEventListener('change',ev=>postControl({outfit:ev.target.value}));
$('quality').addEventListener('click',()=>{
  worldState.quality=worldState.quality==='high'?'low':'high';
  renderer.shadowMap.enabled=worldState.quality==='high';
  renderer.setPixelRatio(Math.min(devicePixelRatio,worldState.quality==='high'?1.6:1));
  ui.quality.textContent=worldState.quality==='high'?'QUALITY HIGH':'QUALITY LOW';
  if(latest)buildWorld(latest.snapshot);
});
let pendingRequest=false;
setInterval(async()=>{
  if(worldState.mode!=='player'||pendingRequest)return;
  pendingRequest=true;
  const axis=keys.has('ArrowLeft')||keys.has('KeyA')?-1:keys.has('ArrowRight')||keys.has('KeyD')?1:0;
  const command={axis,...pending};
  for(const k of Object.keys(pending))pending[k]=false;
  await postControl({input:command});pendingRequest=false;
},65);
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,worldState.quality==='high'?1.6:1));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?56:50;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);resize();
let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(latest){
    const s=latest.snapshot, player=s.player;
    if(!worldState.alive){hero.position.set(player.position.x,player.position.y,0);worldState.alive=true;}
    const smoothing=1-Math.exp(-dt*16);
    hero.position.x=THREE.MathUtils.lerp(hero.position.x,player.position.x,smoothing);
    hero.position.y=THREE.MathUtils.lerp(hero.position.y,player.position.y,smoothing);
    const running=player.movementState==='grounded'&&Math.abs(player.velocity.x)>.6;
    const airborne=['rising','falling','airborne'].includes(player.movementState);
    const motion=running?Math.sin(s.tick*.25):0;
    bodyParts.legL.rotation.z=running?motion*.58:airborne?-.25:0;
    bodyParts.legR.rotation.z=running?-motion*.58:airborne?.5:0;
    bodyParts.armL.rotation.z=running?-motion*.5:airborne?-.55:0;
    bodyParts.armR.rotation.z=running?motion*.5:airborne?-.55:0;
    bodyParts.root.rotation.z=player.movementState==='sliding'?-0.35:airborne?0.12:0;
    bodyParts.root.position.y=running?Math.abs(motion)*.055:0;
    bodyParts.root.scale.y=player.movementState==='sliding'?.72:1;
    const portrait=camera.aspect<.8;
    const targetX=player.position.x+(portrait?2.1:3.45);
    const camX=targetX-3.1;
    const camZ=portrait?24.5:17;
    const camY=portrait?6.1:5.5;
    camera.position.x=THREE.MathUtils.lerp(camera.position.x,camX,1-Math.exp(-dt*4.5));
    camera.position.y=THREE.MathUtils.lerp(camera.position.y,camY+player.position.y*.18,1-Math.exp(-dt*4));
    camera.position.z=camZ;
    camera.lookAt(targetX,1.2,0);
    sun.position.x=player.position.x-8;
    sun.target.position.set(player.position.x,0,0);sun.target.updateMatrixWorld();
    for(const pedestrian of ambient.children)if(pedestrian.userData.baseX!==undefined)pedestrian.position.x=pedestrian.userData.baseX+Math.sin(now/1200+pedestrian.userData.walkOffset)*.30;
  }
  const connected=performance.now()-lastPacket<3500;
  $('connection').textContent=connected?'● CONNECTED':'● RECONNECTING';
  $('connection').classList.toggle('lost',!connected);
  renderer.render(scene,camera);
  frames++;
  if(now-fpsStamp>1000){ui.fps.textContent=Math.round(frames*1000/(now-fpsStamp))+' FPS';fpsStamp=now;frames=0;}
}
requestAnimationFrame(animate);
const stream=new EventSource('/eko/stream');
stream.onmessage=ev=>{try{updateSnapshot(JSON.parse(ev.data));}catch(error){console.error('Render snapshot rejected:',error);}};
stream.onerror=()=>{ui.signal.textContent='RECONNECTING TO AUTHORITY';};
window.addEventListener('pagehide',()=>stream.close());
