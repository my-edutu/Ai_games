import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../dist/index.js';
import { decorateBuilding, decorateWorld, decorateRoof, decorateSafehouseCourtyard } from '../web/scene-art.js';
import { decorateActor } from '../web/actor-art.js';
import { decorateSetpieces } from '../web/world-setpieces.js';
import { clearCamera, anchorMobileAction, cameraRoofOccluders, composeMobileDirectorEye, desktopDirectorActionRange } from '../web/camera-rig.js';
import { decorateTacticalWorld } from '../web/world-overlays.js';
import { drawEnvironmentVfx } from '../web/environment-vfx.js';
import { decorateInterior } from '../web/interior-art.js';
import { actionPose } from '../web/animation-pose.js';
import { PackedVertices } from '../web/packed-geometry.js';
import { spatialVolume,eventSound } from '../web/audio-foley.js';
import { partitionHorde,inspectHordeSilhouette } from '../web/instanced-horde.js';
import { drawCharacterRig } from '../web/character-rig.js';
import { createPoseMixer } from '../web/animation-mixer.js';

class GeometryAudit {
  constructor(){this.calls=0;this.colors=new Set();this.byKind=new Map();}
  record(kind,values,color){
    for(const value of values)assert.ok(Number.isFinite(value),'Nonfinite '+kind+' coordinate');
    assert.ok(typeof color==='string'&&/^#[a-fA-F0-9]{6}$/.test(color),'Invalid color '+color);
    this.calls++;
    this.colors.add(color.toLowerCase());
    this.byKind.set(kind,(this.byKind.get(kind)||0)+1);
  }
  tri(a,b,c,n,color){
    for(const p of [a,b,c,n])assert.ok(Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),'Nonfinite organic triangle');
    assert.ok(Array.isArray(color)&&color.length===3&&color.every(v=>Number.isFinite(v)&&v>=0&&v<=1),'Nonfinite rig color');
    this.calls++;
    this.byKind.set('tri',(this.byKind.get('tri')||0)+1);
    this.colors.add('#'+color.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join(''));
  }
  ellipsoid(x,y,z,rx,ry,rz,color){
    assert.ok(rx>0&&ry>0&&rz>0,'Organic anatomy must have valid volumes');
    this.record('ellipsoid',[x,y,z,rx,ry,rz],color);
  }
  box(x,y,z,w,h,d,color,yaw=0){
    assert.ok(w>0&&h>0&&d>0,'Degenerate district geometry');
    this.record('box',[x,y,z,w,h,d,yaw],color);
  }
  cylinder(x,y,z,r,h,color,n=8){
    assert.ok(r>0&&h>0&&n>=3);
    this.record('cylinder',[x,y,z,r,h,n],color);
  }
  ball(x,y,z,r,color){
    assert.ok(r>0);this.record('ball',[x,y,z,r],color);
  }
  bone(start,end,width,color){
    assert.equal(start.length,3);assert.equal(end.length,3);assert.ok(width>0);
    this.record('bone',[...start,...end,width],color);
  }
  contactShadow(x,z,rx,rz,color,height=.115){
    assert.ok(rx>0&&rz>0);this.record('contactShadow',[x,z,rx,rz,height],color);
  }
}
function runCity(state){
  const before=JSON.stringify(state),mesh=new GeometryAudit();
  for(const building of state.buildings)decorateBuilding(mesh,building,state);
  decorateWorld(mesh,state);
  assert.equal(JSON.stringify(state),before,'Renderer must never mutate authoritative simulation');
  return mesh;
}


test('rooftop art adds deterministic, bounded, damage-aware 3D silhouettes without changing authority',()=>{
  const state=createGame({seed:2026,zombieCount:20});
  const b=state.buildings.find(item=>item.kind!=='safehouse'&&item.roofVisible);
  assert.ok(b,'a solid roof must exist in the seeded world');
  const before=JSON.stringify(b);
  const first=new GeometryAudit(),second=new GeometryAudit();
  decorateRoof(first,b);decorateRoof(second,b);
  assert.ok(first.calls>=16&&first.calls<50,'each rooftop must contain readable bounded utility detail');
  assert.equal(first.calls,second.calls);
  assert.deepEqual([...first.colors].sort(),[...second.colors].sort());
  assert.ok(first.colors.has('#263f4c'),'HVAC mass should read against roof concrete');
  assert.equal(JSON.stringify(b),before,'rooftop art must not alter building state');
  const cutaway=new GeometryAudit();
  decorateRoof(cutaway,{...b,roofVisible:false});
  assert.equal(cutaway.calls,0,'open rescue cutaways must stay unobstructed');
  const damaged=new GeometryAudit();
  decorateRoof(damaged,{...b,damage:1});
  assert.ok(damaged.calls>first.calls||b.damage>.16,'damaged rooftops should gain readable repair/debris detail');
});

test('3D city art is rich, deterministic, bounded and never changes the authoritative game',()=>{
  const state=createGame({seed:2026,zombieCount:90});
  const first=runCity(state),again=runCity(state);
  assert.ok(first.calls>600,'City art must include materially distinct architecture and street props');
  assert.ok(first.calls<6000,'City art must be geometry-budgeted');
  assert.equal(again.calls,first.calls);
  assert.deepEqual([...again.colors].sort(),[...first.colors].sort());
  assert.ok(first.colors.size>=17,'Scene palette must not collapse to a dull monochrome world');
  assert.ok(first.colors.has('#48dbdc'),'Safehouse must have luminous signal accents');
  assert.ok(first.byKind.get('contactShadow')>=4,'Environment must have visual grounding');
});

test('interior cutaways and emergency night ambience remain safe and visibly distinct',()=>{
  const state=createGame({seed:99,zombieCount:18});
  const building=state.buildings.find(b=>b.kind!=='safehouse');
  building.roofVisible=false;
  const interior=runCity(state);
  const dayPalette=[...interior.colors].sort();
  state.time.phase='night';
  const night=runCity(state);
  assert.ok(night.calls>500);
  assert.notDeepEqual([...night.colors].sort(),dayPalette,
    'Night should affect world lighting accents rather than only HUD labels');
});

test('extreme roof and weather states cannot produce invalid or unbounded geometry',()=>{
  const state=createGame({seed:709,zombieCount:260});
  state.buildings.forEach((b,i)=>{if(i%2===0&&b.kind!=='safehouse')b.roofVisible=false;});
  state.weather={kind:'storm',intensity:1};
  const mesh=runCity(state);
  assert.ok(mesh.calls>400&&mesh.calls<6000);
});

test('3D survivor classes and infected variants receive distinctive bounded cosmetic equipment',()=>{
  const g=createGame({seed:44,zombieCount:40});
  const survivors=g.survivors.slice(0,6).map(s=>{const m=new GeometryAudit();decorateActor(m,s,false,12,1);return m;});
  assert.ok(survivors.every(m=>m.calls>=12&&m.calls<90));
  assert.ok(survivors.some(m=>m.colors.has('#d55b67')||m.colors.has('#d7ebdf')));
  const zombieVariants=['brute','runner','shambler'].map(archetype=>{
    const m=new GeometryAudit(),original={...g.zombies[0],archetype,health:70};
    decorateActor(m,original,true,1,archetype==='brute'?1.34:1);
    assert.ok(m.calls>=5&&m.calls<60);
    return [...m.colors].sort().join(',');
  });
  assert.equal(new Set(zombieVariants).size,3,'mutant variants require individually readable silhouettes');
});

test('Gauntlet setpieces supply readable unique city silhouettes within finite visual geometry budget',()=>{
  const m=new GeometryAudit();decorateSetpieces(m);
  assert.ok(m.calls>=110&&m.calls<1100,'landmark geometry budget must remain bounded');
  assert.ok(m.colors.has('#ffc65b')&&m.colors.has('#59e8e0')&&m.colors.has('#fa6a57'),
    'Landmarks require distinct warning, rescue and medical hues');
  assert.ok(m.byKind.get('bone')>5,'Industrial skyline should contain three-dimensional latticework');
});

test('third-person camera avoids opaque architecture without touching game state',()=>{
  const buildings=[{x:0,y:5,w:5,h:5,floors:4,roofVisible:true,kind:'apartment'}];
  const focus=[0,1.5,0],eye=[0,7.5,15];
  const camera=clearCamera(focus,eye,buildings);
  assert.ok(camera[2]<eye[2],'Camera must shorten against an occluding building');
  assert.ok(camera[2]>2,'Camera should preserve character framing and not collapse into target');
  assert.deepEqual(clearCamera(focus,eye,[]),eye,'Open view must preserve intended framing');
  assert.deepEqual(clearCamera(focus,eye,[{...buildings[0],roofVisible:false}]),eye,'Cutaways should not obstruct view');
});


test('mobile director defense framing centers a real living survivor without altering authority',()=>{
  const focus={x:0,y:0},survivors=[
    {id:'dead',x:0,y:0,alive:false},
    {id:'mara',x:10,y:4,alive:true},
    {id:'far',x:70,y:70,alive:true}
  ];
  const original=JSON.stringify({focus,survivors});
  const framed=anchorMobileAction(focus,survivors);
  assert.deepEqual(framed,{x:9,y:3.6},'mobile action target must move toward a living actor');
  assert.deepEqual(anchorMobileAction(focus,survivors),framed,'shot selection must be deterministic');
  assert.deepEqual(anchorMobileAction(focus,[survivors[0]]),focus,'dead survivors are never framed');
  assert.deepEqual(anchorMobileAction(focus,[survivors[2]]),focus,'distant survivor must not steal the shot');
  assert.deepEqual(anchorMobileAction(focus,survivors,{blend:0}),focus,'zero blend leaves existing focus intact');
  assert.equal(JSON.stringify({focus,survivors}),original,'camera framing must not mutate the simulation');
});

test('world-space objectives, threatened survivors and rescue signals remain read-only and bounded',()=>{
  const g=createGame({seed:312,zombieCount:180});
  g.survivors[0].health=27;g.survivors[0].infection=58;
  g.barricades[0].hp=g.barricades[0].maxHp*.2;
  const before=JSON.stringify(g);
  const m=new GeometryAudit();
  decorateTacticalWorld(m,g,4,0,0);
  assert.ok(m.calls>20&&m.calls<600,'markers should be visible yet bounded');
  assert.ok(m.colors.has('#ff6d78'),'crisis needs a vivid marker');
  assert.ok(m.colors.has('#ffe397')||m.colors.has('#55ffcf')||m.colors.has('#77d7fc'));
  assert.equal(JSON.stringify(g),before,'World-space UI is presentation-only');
});

test('Loop 45 phone horde warnings stay at ground height without hiding survivor faces',()=>{
  const g={objective:{kind:'fortify',targetId:null},safeHouse:{x:100,y:100},
    survivors:[],civilians:[],barricades:[],loot:[],buildings:[],
    zombies:Array.from({length:36},(_,i)=>({id:'z'+i,x:3*Math.cos(i*.174),y:3*Math.sin(i*.174),health:100}))};
  const before=JSON.stringify(g);
  class ThreatAudit extends GeometryAudit{
    constructor(){super();this.crisisMaxY=-Infinity;this.crisisBones=0;}
    bone(a,b,width,color){super.bone(a,b,width,color);
      if(color==='#ff6d78'){this.crisisBones++;this.crisisMaxY=Math.max(this.crisisMaxY,a[1],b[1]);}}
    ball(x,y,z,r,color){super.ball(x,y,z,r,color);
      if(color==='#ff6d78')this.crisisMaxY=Math.max(this.crisisMaxY,y+r);}
  }
  const desktop=new ThreatAudit(),mobile=new ThreatAudit(),repeat=new ThreatAudit();
  decorateTacticalWorld(desktop,g,2,0,0);
  decorateTacticalWorld(mobile,g,2,0,0,{compactSignals:true});
  decorateTacticalWorld(repeat,g,2,0,0,{compactSignals:true});
  assert.ok(desktop.crisisMaxY>5,'wide-screen threat can retain its tall world beacon');
  assert.ok(mobile.crisisBones>=12&&mobile.crisisBones<=20,'ground warning must remain visible and bounded');
  assert.ok(mobile.crisisMaxY<.5,'phone horde warning must not obscure character bodies');
  assert.equal(mobile.calls,repeat.calls,'mobile marker geometry must be deterministic');
  assert.equal(JSON.stringify(g),before,'phone visual adaptation cannot change authoritative state');
  // The previous fix covered hordes only: real mobile.png still had a tall
  // coral trapped-civilian ring, while large-horde showed a huge cyan mission ring.
  const rescue={...g,objective:{kind:'rescue',targetId:'c1'},
    civilians:[{id:'c1',x:1,y:0,state:'trapped',panic:.6}],zombies:[]};
  const rescueBefore=JSON.stringify(rescue);
  const close=new ThreatAudit(),wide=new ThreatAudit();
  decorateTacticalWorld(close,rescue,2,0,0,{compactSignals:true});
  decorateTacticalWorld(wide,rescue,2,0,0);
  assert.ok(close.crisisBones>=12,'trapped civilian warning must remain visible on phones');
  assert.ok(close.crisisMaxY<.5,'trapped civilian warning must not cross survivor faces');
  assert.ok(wide.crisisMaxY>4,'wide-screen rescue can retain its elevated beacon');
  assert.equal(JSON.stringify(rescue),rescueBefore,'rescue indicators must be read-only');
  const mission={...g,objective:{kind:'fortify',targetId:null},safeHouse:{x:1,y:1},zombies:[]};
  const missionMarker=new GeometryAudit();
  const missionHeights=[];
  const originalBone=missionMarker.bone.bind(missionMarker);
  missionMarker.bone=(a,b,w,color)=>{missionHeights.push(a[1],b[1]);originalBone(a,b,w,color);};
  decorateTacticalWorld(missionMarker,mission,2,0,0,{compactSignals:true});
  assert.ok(missionHeights.length>=24&&Math.max(...missionHeights)<.5,
    'phone objective marker must also be ground-level');
});

test('cinematic burning buildings, damage particles and warning strobes are deterministic presentation only',()=>{
  const g=createGame({seed:118,zombieCount:180});
  const damaged=g.buildings.filter(b=>b.kind!=='safehouse').slice(0,4);
  damaged.forEach(b=>{b.damage=.72;});
  g.time.phase='night';
  const original=JSON.stringify(g);
  const one=new GeometryAudit(),two=new GeometryAudit();
  drawEnvironmentVfx(one,g,12.5,damaged[0].x,damaged[0].y);
  drawEnvironmentVfx(two,g,12.5,damaged[0].x,damaged[0].y);
  assert.ok(one.calls>12&&one.calls<450,'effect mesh must remain finite and bounded');
  assert.equal(one.calls,two.calls);
  assert.ok(one.colors.has('#ffad5c'),'burning ruins should have visible thermal highlights');
  assert.ok(one.colors.has('#44555d'),'damaged structures should have smoldering smoke');
  assert.equal(JSON.stringify(g),original,'visual VFX may not touch authoritative AI/survival state');
});

test('scenario interiors have true role-specific furnishing and never modify civilians or navigation',()=>{
  const state=createGame({seed:2026,zombieCount:20});
  const first=state.buildings.find(b=>b.kind!=='safehouse');
  const variants=['hospital','apartment','supermarket','police','fuel','warehouse'];
  const signatures=[];
  for(const kind of variants){
    const b={...first,kind,roofVisible:false,w:8,h:7};
    const m=new GeometryAudit();
    const before=JSON.stringify(state);
    decorateInterior(m,b,state);
    assert.equal(JSON.stringify(state),before,'interior art must be visual-only');
    assert.ok(m.calls>15&&m.calls<220,'interior detail should be substantial yet bounded');
    signatures.push([...m.colors].sort().join(','));
  }
  assert.ok(new Set(signatures).size>=5,'Hospital, apartment, supermarket and police interiors must read as unique');
});

test('aim, rescue, injured, roaming and running have distinct non-mutating 3D poses',()=>{
  const z={role:'scout',action:'move',health:80,archetype:'runner',variant:4};
  const original=JSON.stringify(z);
  const moving=actionPose(z,false,1.1);
  const again=actionPose(z,false,1.1);
  assert.deepEqual(moving,again,'same simulation time and action must pose identically');
  assert.ok(Math.abs(moving.stride)>.1,'moving character should show leg movement');
  const wounded=actionPose({...z,action:'injured',health:8},false,1.1);
  assert.ok(wounded.crouch>.30,'critical survivor must have readable injury hunch');
  const medic=actionPose({...z,action:'heal',health:85},false,1.1);
  assert.ok(medic.leftHandRaise>.4);
  const recoil=actionPose({...z,action:'attack'},false,1.1);
  assert.ok(recoil.rightHandRaise>.2&&recoil.weaponRecoil>=0);
  const zombie=actionPose({...z,action:'pursue'},true,1.1);
  assert.ok(zombie.headForward>moving.headForward);
  assert.equal(JSON.stringify(z),original,'cosmetic pose must not mutate AI state');
});

test('packed typed WebGL geometry preserves triangle topology without intermediate boxed JS arrays',()=>{
  const packed=new PackedVertices(27);
  const normal=[0,1,0],color=[.4,.6,.8];
  const N=20000;
  for(let i=0;i<N;i++){
    packed.triangle([i,0,0],[i,1,0],[i,0,1],normal,color);
  }
  const vertices=packed.view();
  assert.ok(vertices instanceof Float32Array);
  assert.equal(vertices.length,N*27);
  assert.equal(packed.length,N*27);
  assert.ok(packed.grows>=1&&packed.grows<40);
  assert.equal(vertices[0],0);
  assert.equal(vertices[27*234],234);
  assert.equal(vertices[27*234+4],1);
  assert.ok(Math.abs(vertices[8]-.8)<1e-6);
  assert.equal(vertices.buffer,packed.data.buffer);
  const next=new PackedVertices(27);
  next.triangle([0,0,0],[0,2,0],[1,0,0],normal,color);
  assert.equal(next.view().length,27);
});

test('spatial live zombie sound respects source distance, whitelist and quiet fallbacks',()=>{
  assert.equal(spatialVolume(0,0,0,0),1);
  assert.ok(spatialVolume(8,2,0,0)<1);
  assert.ok(spatialVolume(50,0,0,0)<.07);
  assert.equal(spatialVolume(0,0,0,0),spatialVolume(0,0,0,0));
  assert.deepEqual(eventSound('shot'),{band:'crack',volume:.11,seconds:.15});
  assert.equal(eventSound('nonsense'),null);
  for(const kind of ['horde','near-death','rescue','heal','barricade-hit']){
    const x=eventSound(kind);
    assert.ok(x&&x.volume>0&&x.volume<=.2&&x.seconds>0&&x.seconds<=1);
  }
});
 
test('GPU horde instancing preserves every visible infected exactly once across dense squads',()=>{
  const g=createGame({seed:2026,zombieCount:260});
  const before=JSON.stringify(g.zombies);
  const chosen=partitionHorde(g.zombies,0,0,{detailRadius:13,maxDetailed:18,maxInstances:500});
  const all=[...chosen.detail,...chosen.instanced];
  assert.equal(new Set(all.map(e=>e.actor.id)).size,all.length,'single representation per infected');
  assert.ok(chosen.detail.length<=18);
  assert.ok(chosen.instanced.length>40,'crowds should be instanced, not rebuilt per character');
  assert.ok(chosen.instanced.length<=500);
  const eligible=g.zombies.filter(z=>z.health>0&&Math.hypot(z.x,z.y)<=58);
  assert.equal(all.length,eligible.length,'visible enemies cannot disappear just for frame rate');
  assert.equal(JSON.stringify(g.zombies),before,'GPU LOD must not change simulation state or population order');
  const again=partitionHorde(g.zombies,0,0,{detailRadius:13,maxDetailed:18,maxInstances:500});
  assert.deepEqual(all.map(e=>e.actor.id),[...again.detail,...again.instanced].map(e=>e.actor.id));
});

test('full articulated organic hero rig varies across real AI poses and mutant class silhouettes',()=>{
  const game=createGame({seed:112,zombieCount:40});
  const sample=game.survivors[0];
  const before=JSON.stringify(sample),drawn=[];
  for(const action of ['move','attack','rescue','heal','injured']){
    const actor={...sample,alive:true,action,health:action==='injured'?12:95};
    const m=new GeometryAudit();
    assert.equal(drawCharacterRig(m,actor,false,1.25),true);
    assert.ok(m.calls>=250&&m.calls<=2000,'hero anatomy should have a bounded original triangle budget');
    drawn.push([m.calls,[...m.colors].sort().join(',')]);
  }
  assert.equal(JSON.stringify(sample),before,'rig may not modify game state');
  const zombie=game.zombies[0];
  const m=new GeometryAudit();
  assert.equal(drawCharacterRig(m,{...zombie,health:80,action:'pursue'},true,3),true);
  assert.ok(m.calls>=200&&m.calls<=2000,'mutant anatomical rig geometry budget');
  assert.ok(m.colors.has('#fb746a'),'infected closeups require glowing eyes');
});
 

test('Loop 44 close infected have bounded, deterministic, individually sculpted head and garment profiles',()=>{
  const game=createGame({seed:112,zombieCount:20});
  const source=game.zombies[0],sourceBefore=JSON.stringify(source),signatures=[];
  for(let variant=0;variant<4;variant++){
    const actor={...source,id:'infected-'+variant,archetype:['shambler','runner','brute','shambler'][variant],
      health:80,action:'pursue',facing:.4};
    const before=JSON.stringify(actor),first=new GeometryAudit(),repeat=new GeometryAudit();
    assert.equal(drawCharacterRig(first,actor,true,2.5),true);
    assert.equal(drawCharacterRig(repeat,actor,true,2.5),true);
    assert.ok((first.byKind.get('ellipsoid')||0)>=20,'faces need jaw, ears, cheek and scalp volumes');
    assert.ok((first.byKind.get('tri')||0)>300&&first.calls<850,
      'sculpted characters must remain inside the bounded close-range geometry budget');
    assert.equal(first.calls,repeat.calls,'same actor and frame must yield deterministic geometry');
    assert.deepEqual([...first.colors].sort(),[...repeat.colors].sort());
    assert.ok(first.colors.has('#4a3835'),'infected cheek wounds must be present in near shots');
    signatures.push([...first.colors].sort().join('|'));
    assert.equal(JSON.stringify(actor),before,'face and cloth dressing must not change game authority');
  }
  assert.equal(new Set(signatures).size,4,'infected identity profiles must not be clones');
  assert.equal(JSON.stringify(source),sourceBefore,'authoritative zombie must be unchanged');
});

test('animation blend transitions smoothly between autonomous actions without modifying character AI',()=>{
  const mixer=createPoseMixer({responseSeconds:.14,maxActors:8});
  const actor={id:'survivor-7',role:'medic',action:'move',health:90};
  const before=JSON.stringify(actor);
  const moving=mixer.sample(actor,false,1);
  const changed={...actor,action:'attack'};
  const attack=mixer.sample(changed,false,1.016);
  assert.ok(attack.rightHandRaise<mixer.sample({...changed,id:'fresh'},false,1.016).rightHandRaise,
    'first attack frame must not snap to final gun pose');
  const settled=mixer.sample(changed,false,1.5);
  assert.ok(settled.rightHandRaise>attack.rightHandRaise);
  assert.equal(JSON.stringify(actor),before);
  assert.equal(mixer.size,2);
  mixer.reset();assert.equal(mixer.size,0);
  assert.deepEqual(mixer.sample(actor,false,1),moving);
});
 
test('organic infected head and hero torso normals face outward for cinematic sun and GGX shading',()=>{
  const silhouette=inspectHordeSilhouette();
  let outward=0,checked=0;
  const data=silhouette.data;
  for(let i=0;i<data.length;i+=27){
    const a=[data[i],data[i+1],data[i+2]];
    if(a[1]>2.04&&a[1]<2.48&&a[0]>.12){
      checked++;
      if(data[i+3]>0)outward++;
    }
  }
  assert.ok(checked>=10,'head surface must have inspectable side normals');
  assert.ok(outward/checked>.70,'head normals must point outwards, not inward');
});


test('Loop 49 mobile roof-clear eye chooses a deterministic, unobstructed sightline',()=>{
  const focus=[0,1.5,0],desired=[0,9,18];
  const buildings=[{id:'blocker',x:0,y:8,w:5,h:5,floors:6,roofVisible:true,kind:'apartment'}];
  const before=JSON.stringify({focus,desired,buildings});
  assert.ok(cameraRoofOccluders(focus,desired,buildings)>0,'baseline must genuinely intersect a roof');
  const solved=composeMobileDirectorEye(focus,desired,buildings);
  assert.ok(solved.blockers<solved.baselineBlockers,'camera must find a clearer shot');
  assert.ok(solved.eye.every(Number.isFinite),'camera eye must be finite');
  assert.deepEqual(composeMobileDirectorEye(focus,desired,buildings),solved,'shot selection must be seeded-independent');
  assert.equal(cameraRoofOccluders(focus,desired,[{...buildings[0],roofVisible:false}]),0);
  assert.equal(JSON.stringify({focus,desired,buildings}),before,'presentation must not mutate the world');
});

test('Loop 50 emergency HQ courtyard adds bounded scene-first details without obstructing the squad',()=>{
  const state=createGame({seed:2026,zombieCount:20});
  const b=state.buildings.find(v=>v.kind==='safehouse');
  assert.ok(b,'seeded world must have a safehouse');
  const before=JSON.stringify(state);
  const day=new GeometryAudit(),again=new GeometryAudit(),night=new GeometryAudit();
  decorateSafehouseCourtyard(day,b);
  decorateSafehouseCourtyard(again,b);
  decorateSafehouseCourtyard(night,b,{night:true});
  assert.ok(day.calls>=45&&day.calls<=95,'emergency art must be visible yet bounded');
  assert.equal(day.calls,again.calls,'courtyard must not depend on frame timing');
  assert.deepEqual([...day.colors].sort(),[...again.colors].sort());
  assert.ok(day.colors.has('#ed7972'),'medical corner needs a readable emergency cross');
  assert.ok(day.colors.has('#5dd4d0'),'floodlights should add a cinematic cool accent');
  assert.notDeepEqual([...night.colors].sort(),[...day.colors].sort(),'night staging lights should change');
  assert.equal(JSON.stringify(state),before,'all courtyard geometry must be read-only');
  const other=new GeometryAudit();
  decorateSafehouseCourtyard(other,{...b,kind:'shop'});
  assert.equal(other.calls,0,'ordinary roofs must not receive HQ-only props');
});

test('Loop 52 desktop action framing is bounded, deterministic and presentation-only',()=>{
  const world=createGame({seed:2026,zombieCount:24});
  const before=JSON.stringify(world);
  const desktop={width:1280,height:720};
  assert.equal(desktopDirectorActionRange('squad',21,desktop),15.8);
  assert.equal(desktopDirectorActionRange('defense',22,desktop),17.2);
  assert.equal(desktopDirectorActionRange('survivor-follow',17,desktop),14.5);
  assert.equal(desktopDirectorActionRange('horde-overview',27,desktop),27);
  assert.equal(desktopDirectorActionRange('failure',30,desktop),30);
  assert.equal(desktopDirectorActionRange('squad',21,{width:390,height:844}),21);
  assert.equal(desktopDirectorActionRange('squad',21,{width:900,height:720}),21);
  assert.equal(desktopDirectorActionRange('squad',21,{width:1280,height:480}),21);
  assert.equal(desktopDirectorActionRange('squad',21,desktop),15.8);
  assert.equal(JSON.stringify(world),before,'framing must never change simulation');
});
