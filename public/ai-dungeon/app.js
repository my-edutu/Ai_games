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
function buildWorld(s){clearWorld();worldFloor=s.run+'-'+s.floor;
 const floors=[],walls=[],trim=[];const size=s.map.length,offset=Math.floor(size/2);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=x-offset,pz=z-offset;
  if(s.map[z][x]==='.'){floors.push([px,-.10,pz]);if((x*13+z*7)%11===0)trim.push([px,-.028,pz])}
  else walls.push([px,1.27,pz]);
 }
 const instance=(geometry,material,data,scale)=>{const mesh=new THREE.InstancedMesh(geometry,material,data.length);const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scaling=new THREE.Vector3(...scale);for(let i=0;i<data.length;i++){position.set(...data[i]);matrix.compose(position,quaternion,scaling);mesh.setMatrixAt(i,matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!reduced;mesh.receiveShadow=true;world.add(mesh)};
 instance(geo.cube,floorMat,floors,[.99,.16,.99]);instance(geo.cube,stone,walls,[1.015,2.6,1.015]);instance(geo.cube,stoneEdge,trim,[.86,.02,.86]);
 // Lit path markers, carved stone columns and modest dynamic lighting budget.
 const corners=[[1,1],[17,1],[1,17],[17,17],[s.exit.x,s.exit.z]];
 corners.forEach(([x,z],i)=>{const px=x-offset,pz=z-offset;column(world,px+.43,pz+.43);const lantern=make(geo.sphere,i===4?tealGlow:dangerGlow,world,px+.43,2.15,pz+.43,.11,.19,.11);lantern.castShadow=false;if(i<3){const light=new THREE.PointLight(i===4?'#4af6e2':'#fd9866',i===4?5:3,8,2);light.position.copy(lantern.position);world.add(light)}});
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
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const scale=boss?1.4:enemy?1.04:1;root.scale.setScalar(scale);
 const torso=make(geo.cylinder,main,body,0,1.03,0,.29,.60,.22);torso.rotation.z=enemy ? .08 : 0;
 make(geo.cube,light,body,0,1.20,-.14,.47,.21,.38);
 const head=make(geo.sphere,light,body,0,1.58,0,.23,.25,.22);
 const helm=make(geo.cylinder,main,body,0,1.77,0,.25,.16,.25);helm.rotation.z=.06;
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
 scene.add(root);return {root,body,leftLeg,rightLeg,leftArm,rightArm,u,at:new THREE.Vector3(u.x-9,0,u.z-9)};
}
function update(s){state=s;received=true;errorAt=0;$('recovery').hidden=true;
 for(const e of s.events){const id=s.run+':'+e.tick+':'+e.kind+':'+e.text;if(!seenEventIds.has(id)){seenEventIds.add(id);if(seenEventIds.size>150)seenEventIds.delete(seenEventIds.values().next().value);cue(e,s)}}
 if(worldFloor!==s.run+'-'+s.floor)buildWorld(s);
 const seen=new Set(s.units.map(u=>u.id));
 for(const [id,a] of actors)if(!seen.has(id)){scene.remove(a.root);a.root.traverse(o=>{if(o.geometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose();if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)if(![stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow].includes(m))m.dispose()}});actors.delete(id)}
 for(const u of s.units){let a=actors.get(u.id);if(!a){a=rig(u);actors.set(u.id,a);a.root.position.set(u.x-9,0,u.z-9)}
  a.u=u;a.at.set(u.x-9,0,u.z-9);a.root.visible=u.hp>0;}
 $('floor').textContent=String(s.floor).padStart(2,'0');$('chapter').textContent=String(s.floor).padStart(2,'0');$('theme').textContent=s.theme;$('chapter-name').textContent=s.theme;$('run').textContent=String(s.run).padStart(3,'0');$('kills').textContent=s.kills;$('gold').textContent=s.gold;$('level').textContent=s.level;$('intent').textContent=s.intent;$('reasoning').textContent=s.intent;
 $('status').textContent=s.phase==='intermission'?'EXPEDITION RESET IN PROGRESS':'AI PARTY EXPLORING IN REAL TIME';
 const party=$('party');party.replaceChildren(...s.units.filter(u=>u.faction==='party').map(u=>{const card=document.createElement('div');card.className='hero-card'+(u.hp===0?' down':'');const icon=document.createElement('div');icon.className='hero-icon';icon.textContent=({vanguard:'⚔',ranger:'🏹',mystic:'✧'})[u.kind];const info=document.createElement('div');info.className='hero-info';const h=document.createElement('div');h.className='hero-heading';const name=document.createElement('b');name.textContent=({vanguard:'ASHEN VANGUARD',ranger:'WILDSHADOW',mystic:'STARWEAVER'})[u.kind];const hp=document.createElement('small');hp.textContent=u.hp+'/'+u.maxHp+' HP';h.append(name,hp);const life=document.createElement('div');life.className='life';const bar=document.createElement('i');bar.style.width=100*u.hp/u.maxHp+'%';life.append(bar);info.append(h,life);card.append(icon,info);return card}));
 const entries=$('events');entries.replaceChildren(...[...s.events].reverse().slice(0,6).map(e=>{const li=document.createElement('li'),meta=document.createElement('small');meta.textContent='TICK '+String(e.tick).padStart(5,'0')+' / '+e.kind.toUpperCase();li.append(meta,document.createTextNode(e.text));return li}));
 window.__DUNGEON_PUBLIC_STATE__=s;
}
let lastFrameTime=0;
function animate(t){requestAnimationFrame(animate);const time=t/1000,dt=Math.min(.05,Math.max(0,time-lastFrameTime));lastFrameTime=time;
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;if(p.life>=p.duration){disposeParticle(p);particles.splice(i,1);continue}
  p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.material.opacity=.75*(1-p.life/p.duration);p.mesh.scale.multiplyScalar(1-.35*dt)}

 const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const leader=actors.get('vanguard')||[...actors.values()].find(a=>a.u.faction==='party'&&a.u.hp>0),target=leader?.at??new THREE.Vector3(0,0,0);
 for(const a of actors.values()){const moving=a.root.position.distanceTo(a.at)>.07;a.root.position.lerp(a.at,reduced?1:.17);const bounce=reduced?0:Math.sin(time*5+a.at.x)*.028;a.body.position.y=bounce;a.leftLeg.rotation.x=moving?Math.sin(time*10)*.35:0;a.rightLeg.rotation.x=-a.leftLeg.rotation.x;a.leftArm.rotation.x=moving?Math.sin(time*10)*.22:0;a.rightArm.rotation.x=-a.leftArm.rotation.x;if(moving){const delta=a.at.clone().sub(a.root.position);a.root.rotation.y=Math.atan2(-delta.x,-delta.z)}}
 if(world.userData.portal&&!reduced)world.userData.portal.rotation.y=time*.26;
 const look=new THREE.Vector3(target.x,0,target.z),cam=new THREE.Vector3(target.x+10,16,target.z+12);camera.position.lerp(cam,reduced?1:.055);camera.lookAt(look.x,0,look.z);
 renderer.render(scene,camera);
}
async function poll(){try{const r=await fetch('/dungeon/state',{cache:'no-store'});if(!r.ok)throw Error('State '+r.status);const data=await r.json();if(data.tick!==lastTick||data.run!==state?.run){lastTick=data.tick;update(data)}}catch(e){errorAt++;if(errorAt>=3){$('recovery').hidden=false;$('status').textContent='VIEW DEGRADED — RETRYING';console.warn('Dungeon view recovery',String(e))}}finally{setTimeout(poll,190)}}
document.body.dataset.reducedMotion=String(reduced);requestAnimationFrame(animate);poll();
