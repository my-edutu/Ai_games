import * as THREE from '/dungeon/vendor/three.module.js';
const $=id=>document.getElementById(id),canvas=$('world'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!reduced;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
const scene=new THREE.Scene();scene.background=new THREE.Color('#070d18');scene.fog=new THREE.FogExp2('#090f1a',.041);
const camera=new THREE.PerspectiveCamera(44,1,.1,110);
const ambient=new THREE.HemisphereLight('#7191bf','#111526',1.9);scene.add(ambient);
const moon=new THREE.DirectionalLight('#a6c6ff',2.0);moon.position.set(-7,17,5);moon.castShadow=!reduced;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-17;moon.shadow.camera.right=17;moon.shadow.camera.top=17;moon.shadow.camera.bottom=-17;scene.add(moon);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:'#080e17',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.17;scene.add(ground);
const actors=new Map(),world=new THREE.Group();scene.add(world);
const floorThemes=[
 {sky:'#080e1b',fog:'#0c1520',torch:'#ff9964',accent:'#b28e5b',fill:'#43566e'},
 {sky:'#1c0d15',fog:'#21111b',torch:'#ffa45a',accent:'#dc835c',fill:'#795060'},
 {sky:'#0b1323',fog:'#10192d',torch:'#8ce2dc',accent:'#79c5bd',fill:'#3b5b78'},
 {sky:'#130e23',fog:'#1b1230',torch:'#c4a3ff',accent:'#aa95c5',fill:'#4b426b'}
];let lastCutawayKey='';
const cachedVec=new THREE.Vector3(),cachedQuat=new THREE.Quaternion(),cachedScale=new THREE.Vector3(),cachedMatrix=new THREE.Matrix4();
function cutawayWalls(target){
 const key=Math.round(target.x)+':'+Math.round(target.z);if(key===lastCutawayKey)return;lastCutawayKey=key;
 const mesh=world.userData.walls,positions=world.userData.wallPositions;if(!mesh||!positions)return;
 for(let i=0;i<positions.length;i++){const p=positions[i];const near=Math.abs(p[0]-target.x)+Math.abs(p[1]-target.z)<=2.8;
  const inFront=p[0]+p[1]>target.x+target.z-.9;
  const height=near&&inFront?.36:2.6;
  cachedVec.set(p[0],height/2-.03,p[1]);cachedScale.set(1.015,height,1.015);
  cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);mesh.setMatrixAt(i,cachedMatrix);
 }mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
}
const particles=[],MAX_PARTICLES=72;const seenEventIds=new Set();
const particleGeo=new THREE.OctahedronGeometry(.07,0);
function disposeParticle(p){scene.remove(p.mesh);p.mesh.material.dispose()}
function cue(event,s){
 if(reduced)return;
 const colors={kill:'#ffe3a0',combat:'#e99159',danger:'#ef5864',healing:'#58ebba',loot:'#66d7e5',floor:'#d7bbff'};
 const color=colors[event.kind];if(!color)return;
 const target=event.kind==='danger'?s.units.find(u=>u.faction==='party'&&u.hp>0):event.kind==='kill'?s.units.find(u=>u.kind==='warden'&&u.hp>0):s.units.find(u=>u.id==='mystic')||s.units[0];
 const x=(target?.x??s.exit.x)-9,z=(target?.z??s.exit.z)-9;
 const count=event.kind==='floor'?15:8;
 for(let i=0;i<count;i++){if(particles.length>=MAX_PARTICLES)disposeParticle(particles.shift());
  const angle=i*2.399963+event.tick*.25,velocity=.4+(i%4)*.15;
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false});
  const mesh=new THREE.Mesh(particleGeo,material);mesh.position.set(x,1.2+(i%3)*.09,z);mesh.scale.setScalar(.55+(i%3)*.27);scene.add(mesh);
  particles.push({mesh,life:0,duration:.45+(i%3)*.18,vx:Math.cos(angle)*velocity,vy:.5+(i%5)*.16,vz:Math.sin(angle)*velocity});
 }
}
let state=null,worldFloor='',received=false,lastTick=-1,errorAt=0;
const palette={vanguard:['#4a87a8','#bed8df','#eab967'],ranger:['#527c58','#bdd19f','#d2b178'],mystic:['#65508f','#c2abf0','#76d8e0'],revenant:['#54656e','#b3c4bd','#dfb76f'],cultist:['#743e4c','#b18a89','#f0636b'],warden:['#483552','#c79a62','#ec7f42']};
const mat=(color,metalness=.1,roughness=.75)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const stone=mat('#26303d',.1,.95),stoneEdge=mat('#404957',.15,.88),floorMat=mat('#28313b',.05,.95),gold=mat('#c9a366',.7,.33),black=mat('#111724',.2,.8);
const tealGlow=new THREE.MeshStandardMaterial({color:'#53aebc',emissive:'#228a98',emissiveIntensity:2.2,roughness:.2});
const dangerGlow=new THREE.MeshStandardMaterial({color:'#e67f50',emissive:'#bd4f18',emissiveIntensity:2.3});
const geo={cube:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,12,8),cylinder:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,10)};
const make=(geometry,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=!reduced;o.receiveShadow=true;parent.add(o);return o};
function column(parent,x,z){make(geo.cylinder,stoneEdge,parent,x,.95,z,.26,1.95,.26);make(geo.cylinder,gold,parent,x,1.93,z,.4,.12,.4);make(geo.cylinder,stoneEdge,parent,x,.12,z,.37,.24,.37)}
function clearWorld(){while(world.children.length){const obj=world.children[0];world.remove(obj);obj.traverse(o=>{if(o.geometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose();if(o.material&&!Object.values({stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow}).includes(o.material)){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.dispose()}})}for(const a of actors.values())scene.remove(a.root);actors.clear()}
function buildWorld(s){clearWorld();worldFloor=s.run+'-'+s.floor;lastCutawayKey='';
 const theme=floorThemes[(s.floor-1)%floorThemes.length];scene.background=new THREE.Color(theme.sky);scene.fog.color.set(theme.fog);moon.color.set(theme.fill);ambient.intensity=1.7;
 const floors=[],walls=[],trim=[];const size=s.map.length,offset=Math.floor(size/2);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=x-offset,pz=z-offset;
  if(s.map[z][x]==='.'){floors.push([px,-.10,pz]);if((x*13+z*7)%11===0)trim.push([px,-.028,pz])}
  else walls.push([px,1.27,pz]);
 }
 const instance=(geometry,material,data,scale)=>{const mesh=new THREE.InstancedMesh(geometry,material,data.length);const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scaling=new THREE.Vector3(...scale);for(let i=0;i<data.length;i++){position.set(...data[i]);matrix.compose(position,quaternion,scaling);mesh.setMatrixAt(i,matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!reduced;mesh.receiveShadow=true;world.add(mesh)};
 instance(geo.cube,floorMat,floors,[.99,.16,.99]);
 instance(geo.cube,stone,walls,[1.015,2.6,1.015]);world.userData.walls=world.children[world.children.length-1];world.userData.wallPositions=walls.map(([x,,z])=>[x,z]);
 instance(geo.cube,stoneEdge,trim,[.86,.02,.86]);
 // Multiple architecturally distinct layers: foundation courses, arches, broken stone tiles and inlaid runes.
 const topBricks=[],footBricks=[],runes=[],stonePavers=[],shards=[],caps=[];
 const fracture=(x,z)=>((x*73+z*139+s.floor*41+4096)&1023);
 for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++){
  const wx=x-offset,wz=z-offset,f=fracture(x,z);
  if(s.map[z][x]==='#'){
   if(f%3===0)topBricks.push([wx,2.53,wz]);
   if(f%4===0)footBricks.push([wx,.1,wz]);
   if(s.map[z-1][x]==='.'&&f%7===0)caps.push([wx,2.6,wz-.34]);
  }else{
   if(f%4===0)stonePavers.push([wx,-.005,wz]);
   if(f%17===0)runes.push([wx,.008,wz]);
   if(f%11===0)shards.push([wx+.26,.10,wz-.22]);
  }
 }
 const ornament=mat(theme.accent,.5,.5),blackStone=mat('#171c29',.15,.98),runeMat=new THREE.MeshStandardMaterial({color:theme.torch,emissive:theme.torch,emissiveIntensity:1.6,roughness:.35});
 const garnish=(material,data,scale)=>{if(!data.length)return;const mesh=new THREE.InstancedMesh(geo.cube,material,data.length);const m=new THREE.Matrix4(),p=new THREE.Vector3(),sc=new THREE.Vector3(...scale),rot=new THREE.Quaternion();
  for(let i=0;i<data.length;i++){p.set(...data[i]);m.compose(p,rot,sc);mesh.setMatrixAt(i,m)}mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;world.add(mesh)};
 garnish(stoneEdge,topBricks,[1.04,.12,1.04]);garnish(blackStone,footBricks,[1.035,.21,1.035]);
 garnish(stoneEdge,stonePavers,[.86,.025,.86]);garnish(runeMat,runes,[.52,.009,.10]);
 garnish(ornament,caps,[.30,.23,.35]);garnish(blackStone,shards,[.16,.17,.20]);
 // Decorated arches are constructed only at certain long corridors; avoid hiding characters.
 for(let z=2;z<size-2;z++)for(let x=2;x<size-2;x++){
   if(s.map[z][x]!==' .'&&s.map[z][x]!=='.')continue;
   if(fracture(x,z)%19!==0)continue;
   const horizontal=s.map[z][x-1]==='.'&&s.map[z][x+1]==='.';
   const vertical=s.map[z-1][x]==='.'&&s.map[z+1][x]==='.';
   if(!horizontal&&!vertical)continue;
   const ax=x-offset,az=z-offset,arch=new THREE.Group();arch.position.set(ax,0,az);
   if(horizontal)arch.rotation.y=Math.PI/2;
   make(geo.cube,stoneEdge,arch,-.43,.95,0,.16,1.9,.18);
   make(geo.cube,stoneEdge,arch,.43,.95,0,.16,1.9,.18);
   make(geo.cube,ornament,arch,0,1.88,0,.98,.22,.20);
   make(geo.cube,gold,arch,0,2.02,0,.22,.06,.23);
   world.add(arch);
 }

 // Lit path markers, carved stone columns and modest dynamic lighting budget.
 const corners=[[1,1],[17,1],[1,17],[17,17],[s.exit.x,s.exit.z]];
 corners.forEach(([x,z],i)=>{const px=x-offset,pz=z-offset;column(world,px+.43,pz+.43);const lantern=make(geo.sphere,i===4?tealGlow:dangerGlow,world,px+.43,2.15,pz+.43,.11,.19,.11);lantern.castShadow=false;if(i<3){const light=new THREE.PointLight(i===4?'#4af6e2':theme.torch,i===4?5:3,9,2);light.position.copy(lantern.position);world.add(light)}});
 // Ruined altars and relic vaults are used sparingly to preserve navigational readability.
 const openCells=floors.filter(([x,,z])=>(Math.abs(x)+Math.abs(z))>3&&Math.abs(x)+Math.abs(z)<22);
 let placed=0;
 for(const [px,,pz] of openCells){if(placed>=10)break;const k=fracture(px+offset,pz+offset);
  if(k%47!==0)continue;placed++;
  const shrine=new THREE.Group();shrine.position.set(px,.02,pz);
  make(geo.cylinder,stoneEdge,shrine,0,.13,0,.24,.24,.24);
  make(geo.cylinder,gold,shrine,0,.27,0,.20,.045,.20);
  const gem=make(geo.cone,k%2?tealGlow:dangerGlow,shrine,0,.49,0,.12,.37,.12);gem.rotation.z=.1;world.add(shrine);
 }

 const pos=new THREE.Vector3(s.exit.x-offset,.05,s.exit.z-offset);
 const dais=make(geo.cylinder,stoneEdge,world,pos.x,.02,pos.z,.64,.15,.64);dais.castShadow=false;
 const portal=new THREE.Group();portal.position.set(pos.x,.28,pos.z);const ring=new THREE.Mesh(new THREE.TorusGeometry(.47,.075,9,40),tealGlow);ring.rotation.x=Math.PI/2;portal.add(ring);
 const inner=new THREE.Mesh(new THREE.CircleGeometry(.43,32),new THREE.MeshBasicMaterial({color:'#27f0cc',transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));inner.rotation.x=-Math.PI/2;portal.add(inner);world.add(portal);world.userData.portal=portal;
 s.relics.forEach((r,i)=>{const gem=make(new THREE.OctahedronGeometry(.19,0),tealGlow,world,r.x-offset,.4,r.z-offset,.8,1.2,.8);gem.userData.relic=i});
 // Procedural decorative vaulted gate framing the final encounter.
 const gx=pos.x+.9,gz=pos.z;column(world,gx,gz-.8);column(world,gx,gz+.8);
 make(geo.cube,gold,world,gx,2.2,gz,.32,.22,1.9);
}
function rig(u){const colors=palette[u.kind],main=mat(colors[0],.5,.4),light=mat(colors[1],.45,.4),accent=mat(colors[2],.55,.3),enemy=u.faction==='enemy',boss=u.kind==='warden';
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const scale=boss?1.55:enemy?1.04:1;root.scale.setScalar(scale);
 const torso=make(geo.cylinder,main,body,0,1.03,0,.29,.60,.22);torso.rotation.z=enemy ? .08 : 0;
 make(geo.cube,light,body,0,1.20,-.14,.47,.21,.38);
 // Individually recognisable silhouettes: armoured knight, leather ranger, robed spellcaster, and towering boss.
 for(const side of [-1,1]){
   const shoulder=make(geo.sphere,light,body,side*.37,1.33,0,.24,.16,.23);shoulder.rotation.z=side*.26;
   const shoulderRim=make(geo.cube,accent,body,side*.37,1.31,-.19,.26,.09,.08);shoulderRim.rotation.z=side*.22;
   make(geo.cylinder,main,body,side*.16,.86,0,.14,.13,.14);
 }
 const belt=make(geo.cube,gold,body,0,.84,-.16,.50,.085,.31);belt.castShadow=false;
 if(u.kind==='mystic'||u.kind==='cultist'){
   const mantle=make(geo.cone,main,body,0,.62,0,.39,.91,.32);
   mantle.rotation.z=.02;make(geo.sphere,accent,body,0,1.21,-.28,.11,.12,.06);
 }
 if(u.kind==='vanguard'||boss){make(geo.cube,accent,body,0,1.35,-.272,.22,.22,.035);}
 if(u.kind==='ranger'){const hood=make(geo.cone,main,body,0,1.81,.055,.30,.37,.32);hood.rotation.x=.18;}

 const head=make(geo.sphere,light,body,0,1.58,0,.23,.25,.22);
 const helm=make(geo.cylinder,main,body,0,1.77,0,.25,.16,.25);helm.rotation.z=.06;
 const crown=make(geo.cone,accent,body,0,1.97,.01,boss?.23:.09,boss?.46:.27,boss?.23:.09);
 if(boss){for(const side of [-1,1]){const blade=make(geo.cone,accent,body,side*.24,1.95,0,.10,.52,.10);blade.rotation.z=-side*.26}
  const shoulderSpikes=make(geo.cone,accent,body,-.40,1.64,0,.14,.39,.14);shoulderSpikes.rotation.z=.35;
 }

 const face=make(geo.cube,enemy?dangerGlow:tealGlow,body,0,1.59,-.212,.25,.055,.065);face.castShadow=false;
 const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.15,.73,0);rightLeg.position.set(.15,.73,0);body.add(leftLeg,rightLeg);
 make(geo.cylinder,main,leftLeg,0,-.3,0,.105,.59,.12);make(geo.cylinder,main,rightLeg,0,-.3,0,.105,.59,.12);
 const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.35,1.27,0);rightArm.position.set(.35,1.27,0);body.add(leftArm,rightArm);
 make(geo.cylinder,light,leftArm,0,-.25,0,.12,.51,.12);make(geo.cylinder,light,rightArm,0,-.25,0,.12,.51,.12);
 if(enemy){const horn=mat(colors[2],.25,.75);for(const side of [-1,1]){const h=make(geo.cone,horn,body,side*.18,1.99,0,.10,.34,.10);h.rotation.z=-side*.27}}
 if(u.kind==='vanguard'||u.kind==='warden'){const blade=make(geo.cube,accent,rightArm,.10,-.55,-.08,.07,.73,.14);blade.rotation.z=-.28;make(geo.cube,gold,rightArm,.10,-.33,-.08,.31,.055,.16);make(geo.cube,main,leftArm,-.1,-.48,-.25,.35,.4,.10)}
 if(u.kind==='mystic'||u.kind==='cultist'){make(geo.cylinder,gold,rightArm,.06,-.57,-.2,.035,.99,.035);const staff=make(geo.sphere,tealGlow,rightArm,.06,-1.05,-.2,.14,.19,.14);staff.castShadow=false}
 if(u.kind==='ranger'){const bow=new THREE.Mesh(new THREE.TorusGeometry(.41,.038,6,18,Math.PI),gold);bow.rotation.y=Math.PI/2;bow.rotation.z=.3;bow.position.set(.12,-.5,-.15);rightArm.add(bow)}
 // A sculpted cloth panel gives each character a readable silhouette from the stream camera.
 const cloak=make(geo.cube,main,body,0,.82,.18,.55,.96,.1);cloak.rotation.x=-.11;
 const base=new THREE.Mesh(new THREE.CircleGeometry(.38,20),new THREE.MeshBasicMaterial({color:enemy?'#c04a53':'#43b3a7',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;base.position.y=.018;root.add(base);
 let telegraph=null;
 if(boss){telegraph=new THREE.Mesh(new THREE.RingGeometry(1.85,2.03,56),new THREE.MeshBasicMaterial({color:'#ff7049',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));telegraph.rotation.x=-Math.PI/2;telegraph.position.y=.025;telegraph.visible=false;root.add(telegraph);}
 scene.add(root);return {root,body,leftLeg,rightLeg,leftArm,rightArm,telegraph,u,at:new THREE.Vector3(u.x-9,0,u.z-9)};
}
const timeNow=()=>performance.now()/1000;
// Broadcast command centre: projections never mutate simulation state.
const minimap=$('minimap'),mini=minimap.getContext('2d',{alpha:false}),mapPalette={wall:'#273653',floor:'#15233e',traced:'#477091',hero:'#5bf9e2',enemy:'#ff6f9c',exit:'#65baff',loot:'#ffd277'};
let previousEventKey='',alertTimer=null,ambience=null;
const classMeta={vanguard:{name:'ASHEN VANGUARD',title:'FRONT-LINE KNIGHT',icon:'⚔'},ranger:{name:'WILDSHADOW',title:'PHANTOM ARCHER',icon:'➶'},mystic:{name:'STARWEAVER',title:'ARCANE HEALER',icon:'✧'}};
function drawMinimap(s){
 const N=s.map.length,W=minimap.width,H=minimap.height,cell=W/N,margin=0;
 mini.fillStyle='#0d1529';mini.fillRect(0,0,W,H);
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const solid=s.map[z][x]!=='#',px=Math.floor(x*cell),pz=Math.floor(z*cell);
  mini.fillStyle=solid?((x+z)%3===0?'#223952':mapPalette.floor):mapPalette.wall;
  mini.fillRect(px,pz,Math.ceil(cell),Math.ceil(cell));
  if(solid){mini.strokeStyle='#476d9050';mini.lineWidth=.35;mini.strokeRect(px+.3,pz+.3,cell-.6,cell-.6)}
 }
 const cx=x=>x*cell+cell/2,cz=z=>z*cell+cell/2;
 mini.fillStyle='#45ffe2';mini.shadowBlur=13;mini.shadowColor='#45ffe2';
 mini.beginPath();mini.arc(cx(s.exit.x),cz(s.exit.z),cell*.36,0,Math.PI*2);mini.fill();mini.shadowBlur=0;
 mini.fillStyle=mapPalette.loot;for(const r of s.relics){mini.fillRect(cx(r.x)-2,cz(r.z)-2,4,4)}
 for(const u of s.units){if(u.hp<=0)continue;mini.beginPath();mini.fillStyle=u.faction==='party'?mapPalette.hero:mapPalette.enemy;mini.strokeStyle=u.faction==='party'?'#d9fffd':'#ffd2d9';mini.lineWidth=1.2;mini.arc(cx(u.x)+(u.id==='ranger'?2:u.id==='mystic'?-2:0),cz(u.z),u.kind==='warden'?cell*.46:cell*.29,0,Math.PI*2);mini.fill();mini.stroke()}
 mini.strokeStyle='#72d5e860';mini.lineWidth=1;mini.strokeRect(.5,.5,W-1,H-1);
}
function notifyDungeon(event){
 if(!['telegraph','floor','kill','defeat','loot'].includes(event.kind))return;
 const banner=$('alert-flash');clearTimeout(alertTimer);banner.hidden=false;
 banner.textContent=event.kind==='telegraph'?'⚠  '+event.text.toUpperCase():event.kind==='floor'?'✦  '+event.text.toUpperCase():event.kind==='defeat'?'☠  '+event.text.toUpperCase():event.text.toUpperCase();
 banner.dataset.kind=event.kind;
 alertTimer=setTimeout(()=>{banner.hidden=true},event.kind==='telegraph'?1400:1900);
}
function playEffect(kind){
 if(!ambience)return;const ctx=ambience;if(ctx.state!=='running')return;
 const hz={floor:524,loot:880,kill:340,healing:660,telegraph:195,danger:142}[kind];if(!hz)return;
 const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=kind==='danger'?'sawtooth':'sine';o.frequency.setValueAtTime(hz,now);o.frequency.exponentialRampToValueAtTime(hz*.7,now+.19);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.052,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+.23);o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+.25);
}
$('audio-toggle').addEventListener('click',async()=>{
 const button=$('audio-toggle');
 if(!ambience){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){button.title='Audio unavailable in this browser';return}ambience=new Audio()}
 if(ambience.state==='running'){await ambience.suspend();button.setAttribute('aria-pressed','false');button.querySelector('span').textContent='AUDIO OFF';}
 else{await ambience.resume();button.setAttribute('aria-pressed','true');button.querySelector('span').textContent='AUDIO ON';playEffect('floor')}
});
function renderDashboard(s){
 const heroes=s.units.filter(u=>u.faction==='party'),alive=heroes.filter(u=>u.hp>0).length,foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0);
 const boss=s.units.find(u=>u.kind==='warden'),nearBoss=boss&&boss.hp>0&&heroes.some(h=>h.hp>0&&Math.abs(h.x-boss.x)+Math.abs(h.z-boss.z)<6);
 $('floor').textContent=String(s.floor).padStart(2,'0');$('chapter').textContent=String(s.floor).padStart(2,'0');
 $('theme').textContent=s.theme;$('run').textContent=String(s.run).padStart(3,'0');$('tick').textContent='TICK '+String(s.tick).padStart(5,'0');
 $('kills').textContent=s.kills.toLocaleString();$('gold').textContent=s.gold.toLocaleString();$('level').textContent=s.level;
 $('intent').textContent=s.intent;$('reasoning').textContent=s.intent;
 $('party-count').textContent=alive+' / '+heroes.length;$('party-condition').textContent=alive===heroes.length?'READY':alive?'COMPROMISED':'FALLEN';
 $('status').textContent=s.phase==='intermission'?'THE NEXT EXPEDITION IS FORMING':'AI HEROES EXPLORING THE UNKNOWN';
 $('floor-status').textContent=s.phase==='intermission'?'REASSEMBLING':nearBoss?'GUARDIAN BATTLE':foes.length?'CLEARING THE CRYPT':'PORTAL UNLOCKED';
 const remaining=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
 $('depth-fill').style.width=Math.max(8,Math.min(100,100-(remaining/(s.units.filter(u=>u.faction==='enemy').length||1)*92)))+'%';
 const bossStrip=$('boss-strip');bossStrip.hidden=!nearBoss;
 if(boss){const percent=Math.max(0,Math.round(boss.hp/boss.maxHp*100));$('boss-hp').textContent=percent+'%';$('boss-bar').style.width=percent+'%';$('boss-phase').textContent=s.tick%6>=4?'ARCANE WARNING':'ENGAGED'}
 $('scene-weather').textContent=s.theme.includes('EMBER')?'FIRELIT // ASH':s.theme.includes('OBSIDIAN')?'ARCANE // MIST':s.theme.includes('HOLLOW')?'ETHEREAL // VOID':'MOONLIT // CRYPT';
 const party=$('party');party.replaceChildren(...heroes.map(u=>{
  const meta=classMeta[u.kind],card=document.createElement('article');card.className='hero-card'+(u.hp===0?' down':'');card.dataset.class=u.kind;
  const icon=document.createElement('div');icon.className='hero-icon';icon.setAttribute('aria-hidden','true');icon.textContent=meta.icon;
  const info=document.createElement('div');info.className='hero-info';const head=document.createElement('div');head.className='hero-heading';
  const name=document.createElement('b');name.textContent=meta.name;const hp=document.createElement('small');hp.textContent=u.hp+'/'+u.maxHp+' HP';
  head.append(name,hp);const sub=document.createElement('div');sub.className='hero-sub';const job=document.createElement('span');job.textContent=meta.title;const action=document.createElement('b');action.textContent=(u.action||'idle').toUpperCase();sub.append(job,action);
  const bar=document.createElement('div');bar.className='life';const fill=document.createElement('i');fill.style.width=(u.hp/u.maxHp*100)+'%';bar.append(fill);info.append(head,sub,bar);card.append(icon,info);return card;
 }));
 const entries=$('events');entries.replaceChildren(...[...s.events].reverse().slice(0,3).map(e=>{
  const li=document.createElement('li');li.style.setProperty('--event-color',({danger:'#ff7f9e',telegraph:'#ffc178',kill:'#ffe28f',healing:'#77ffc6',floor:'#b9a4ff',loot:'#78deff'}[e.kind]||'#8bbfff'));
  const time=document.createElement('small');time.textContent='T+'+String(e.tick).padStart(5,'0')+' · '+e.kind.toUpperCase();li.append(time,document.createTextNode(e.text));return li
 }));
 $('map-cells').textContent=s.map.reduce((n,row)=>n+[...row].filter(ch=>ch==='.').length,0)+' TILES';
 drawMinimap(s);
}

function update(s){state=s;received=true;errorAt=0;$('recovery').hidden=true;
 for(const e of s.events){const id=s.run+':'+e.tick+':'+e.kind+':'+e.text;if(!seenEventIds.has(id)){seenEventIds.add(id);if(seenEventIds.size>150)seenEventIds.delete(seenEventIds.values().next().value);cue(e,s);notifyDungeon(e);playEffect(e.kind)}}
 if(worldFloor!==s.run+'-'+s.floor)buildWorld(s);
 const seen=new Set(s.units.map(u=>u.id));
 for(const [id,a] of actors)if(!seen.has(id)){scene.remove(a.root);a.root.traverse(o=>{if(o.geometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose();if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)if(![stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow].includes(m))m.dispose()}});actors.delete(id)}
 for(const u of s.units){let a=actors.get(u.id);if(!a){a=rig(u);actors.set(u.id,a);a.root.position.set(u.x-9,0,u.z-9)}
  if(a.u.actionTick!==u.actionTick||a.u.action!==u.action){a.actionStarted=timeNow();}a.u=u;a.at.set(u.x-9,0,u.z-9);a.root.visible=u.hp>0;if(a.telegraph)a.telegraph.visible=u.hp>0&&[4,5].includes(s.tick%6);}
 renderDashboard(s);
 window.__DUNGEON_PUBLIC_STATE__=s;
}
let lastFrameTime=0;
function animate(t){requestAnimationFrame(animate);const time=t/1000,dt=Math.min(.05,Math.max(0,time-lastFrameTime));lastFrameTime=time;
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;if(p.life>=p.duration){disposeParticle(p);particles.splice(i,1);continue}
  p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.material.opacity=.75*(1-p.life/p.duration);p.mesh.scale.multiplyScalar(1-.35*dt)}

 const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const leader=actors.get('vanguard')||[...actors.values()].find(a=>a.u.faction==='party'&&a.u.hp>0),target=leader?.at??new THREE.Vector3(0,0,0);
 for(const a of actors.values()){const moving=a.root.position.distanceTo(a.at)>.07;a.root.position.lerp(a.at,reduced?1:.17);const bounce=reduced?0:Math.sin(time*5+a.at.x)*.028;a.body.position.y=bounce;a.leftLeg.rotation.x=moving?Math.sin(time*10)*.35:0;a.rightLeg.rotation.x=-a.leftLeg.rotation.x;a.leftArm.rotation.x=moving?Math.sin(time*10)*.22:0;a.rightArm.rotation.x=-a.leftArm.rotation.x;
  const since=time-(a.actionStarted??time),phase=Math.max(0,Math.min(1,since/.32));
  if(a.u.action==='attack'&&since<.32){a.rightArm.rotation.x=-1.5*Math.sin(phase*Math.PI);a.body.rotation.z=.16*Math.sin(phase*Math.PI)}
  else if(a.u.action==='cast'&&since<.45){a.rightArm.rotation.x=-1.55*Math.sin(Math.min(1,since/.45)*Math.PI);a.leftArm.rotation.x=-.85;a.body.rotation.z=0}
  else if(a.u.action==='hurt'&&since<.30){a.body.rotation.z=.16*Math.sin(phase*Math.PI*2);a.body.position.y+=.10*Math.sin(phase*Math.PI)}
  else a.body.rotation.z*=.65;
  if(a.telegraph)a.telegraph.material.opacity=.42+.2*Math.sin(time*9);
  if(moving){const delta=a.at.clone().sub(a.root.position);a.root.rotation.y=Math.atan2(-delta.x,-delta.z)}}
 if(world.userData.portal&&!reduced)world.userData.portal.rotation.y=time*.26;
 cutawayWalls(target);
 const look=new THREE.Vector3(target.x,0,target.z),cam=new THREE.Vector3(target.x+10,16,target.z+12);camera.position.lerp(cam,reduced?1:.055);camera.lookAt(look.x,0,look.z);
 renderer.render(scene,camera);if(state)window.__DUNGEON_RENDER_DIAGNOSTICS__={frame:renderer.info.render.frame,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,activeUnits:[...actors.values()].filter(x=>x.root.visible).length,webgl:true,theme:state.theme};
}
async function poll(){try{const r=await fetch('/dungeon/state',{cache:'no-store'});if(!r.ok)throw Error('State '+r.status);const data=await r.json();if(data.tick!==lastTick||data.run!==state?.run){lastTick=data.tick;update(data)}}catch(e){errorAt++;if(errorAt>=3){$('recovery').hidden=false;$('status').textContent='VIEW DEGRADED — RETRYING';console.warn('Dungeon view recovery',String(e))}}finally{setTimeout(poll,190)}}
document.body.dataset.reducedMotion=String(reduced);requestAnimationFrame(animate);poll();
