'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

const loaded = import('../../public/infinite-tower-climb/visuals/landing-approach.mjs');

function sample() {
  const deck = { id:'f2:ledge-2', x:100000, y:80000, width:70000, height:5000, kind:'moving' };
  const snapshot = {
    lifecycle:'running', runToken:'expedition-12', floor:2, tick:124,
    chunkBaseY:0, worldWidth:480000,
    intent:{mode:'air-control', targetPlatformId:deck.id, summary:'Steering for a clear landing lane'},
    player:{x:102000, y:62000, halfWidth:5000, halfHeight:10000,
      state:'airborne', health:4, maxHealth:4, attacking:false},
    platforms:[deck], hazards:[], enemies:[],
  };
  return {snapshot,deck};
}

test('the actual selected deck owns the source-pinned architectural threshold', async () => {
  const { observedLandingApproach } = await loaded;
  const {snapshot,deck} = sample();
  const result = observedLandingApproach(snapshot,deck,125000);
  assert.equal(result.targetId,deck.id);
  assert.equal(result.tick,snapshot.tick);
  assert.equal(result.x,125000);
  assert.ok(result.left > deck.x && result.right < deck.x + deck.width);
  assert.ok(result.right-result.left >= 14000);
  assert.equal(result.observedOnly,true);
  assert.equal(result.pressured,false);
});

test('changing current source deck position moves the threshold without guessing the carriage future', async () => {
  const { observedLandingApproach } = await loaded;
  const {snapshot,deck} = sample();
  const before=observedLandingApproach(snapshot,deck,125000);
  const moved={...deck,x:deck.x+15000};
  const later={...snapshot,tick:snapshot.tick+1,platforms:[moved]};
  const after=observedLandingApproach(later,moved,140000);
  assert.equal(after.x-before.x,15000);
  assert.equal(after.tick,before.tick+1);
  assert.equal(after.targetId,before.targetId);
});

test('present hazards and living enemies change the pressure signal, not the selected route', async () => {
  const { observedLandingApproach } = await loaded;
  const {snapshot,deck} = sample();
  const hazard={id:'hot-plate',active:true,x:121000,y:84000,width:12000,height:10000};
  const alert=observedLandingApproach({...snapshot,hazards:[hazard]},deck,125000);
  assert.equal(alert.pressured,true);
  assert.equal(alert.x,125000);
  assert.equal(observedLandingApproach({...snapshot,hazards:[{...hazard,active:false}]},deck,125000).pressured,false);
  const enemy={id:'raider',active:true,telegraph:false,x:126000,y:93000,halfWidth:6000,halfHeight:10000};
  assert.equal(observedLandingApproach({...snapshot,enemies:[enemy]},deck,125000).pressured,true);
});

test('danger, terminal states, health recovery and completed landings outrank decorative guidance', async () => {
  const { observedLandingApproach } = await loaded;
  const {snapshot,deck} = sample();
  const get=(s,d=deck)=>observedLandingApproach(s,d,125000);
  assert.equal(get({...snapshot,lifecycle:'result'}),null);
  assert.equal(get({...snapshot,runToken:''}),null);
  assert.equal(get({...snapshot,tick:-1}),null);
  assert.equal(get({...snapshot,intent:{mode:'collecting-resource',targetPlatformId:deck.id}}),null);
  assert.equal(get({...snapshot,intent:{mode:'engaging-enemy',targetPlatformId:deck.id}}),null);
  assert.equal(get({...snapshot,player:{...snapshot.player,attacking:true}}),null);
  assert.equal(get({...snapshot,enemies:[{id:'g',active:true,telegraph:true}]}),null);
  assert.equal(get({...snapshot,intent:{...snapshot.intent,targetPlatformId:'f2:wrong'}}),null);
  assert.equal(get({...snapshot,player:{...snapshot.player,
    state:'standing',x:125000,y:deck.y+deck.height+snapshot.player.halfHeight}}),null);
  assert.equal(get({...snapshot,platforms:[]}),null);
});

test('twelve source-positioned dock pieces form a visible arrival silhouette and retire on stale/restart', async () => {
  const { createTowerLandingApproach } = await loaded;
  class Geo { dispose(){this.disposed=true;} }
  class Material { constructor(p){Object.assign(this,p);} dispose(){this.disposed=true;} }
  class Color { set(v){this.value=v;return this;} clone(){const c=new Color();c.value=this.value;return c;} }
  class Object3D {
    constructor(){ this.position={set:(...v)=>{this.p=v;}};
      this.rotation={set:(...v)=>{this.r=v;}};
      this.scale={set:(...v)=>{this.s=v;}};this.matrix={}; }
    updateMatrix(){this.matrix={p:this.p,r:this.r,s:this.s};}
  }
  class InstancedMesh {
    constructor(g,m,n){this.geometry=g;this.material=m;this.count=n;this.matrices=[];
      this.instanceMatrix={setUsage(){},needsUpdate:false};this.instanceColor={needsUpdate:false};}
    setColorAt(i,color){this.colors||=[];this.colors[i]=color.value;}
    setMatrixAt(i,matrix){this.matrices[i]={...matrix};}
  }
  class Group { constructor(){this.children=[];this.visible=true;} add(x){this.children.push(x);} clear(){this.children.length=0;} }
  const THREE={BoxGeometry:Geo,MeshStandardMaterial:Material,Color,Object3D,InstancedMesh,Group,DynamicDrawUsage:1};
  const stage=createTowerLandingApproach(THREE);
  const {snapshot,deck}=sample();
  assert.equal(stage.diagnostics().visible,false);
  stage.update(snapshot,deck,125000);
  assert.equal(stage.diagnostics().visible,true);
  assert.equal(stage.diagnostics().pieces,12);
  const dock = stage.group.children[0];
  assert.ok(dock.matrices[0].s[1] > 2, 'piers remain distinct at a normal viewing distance');
  assert.ok(dock.matrices[11].s[0] > .6, 'crossbar spans the physical entrance');
  const beforeColors = dock.colors.slice();
  const idleBraceAngle = dock.matrices[9].r[2];
  const idleLintelHeight = dock.matrices[11].p[1];
  stage.update({...snapshot,tick:125,player:{...snapshot.player,x:125000,y:deck.y+deck.height+snapshot.player.halfHeight-2000}},deck,125000);
  assert.notDeepEqual(dock.colors,beforeColors, 'present approach distance illuminates additional inset stones');
  assert.equal(stage.diagnostics().drawCalls,1);
  assert.equal(stage.diagnostics().selectedX,125000);
  stage.update({...snapshot,tick:126,hazards:[{id:'spike',active:true,x:122000,y:84000,width:8000,height:10000}]},
    deck,125000);
  assert.equal(stage.diagnostics().pressureObservedNow,true);
  assert.ok(Math.abs(dock.matrices[9].r[2]) > Math.abs(idleBraceAngle)+.2,
    'real threat must unfold the physical 3D warning vanes, not just change their tint');
  assert.ok(dock.matrices[11].p[1] > idleLintelHeight+.1,
    'source-pressured dock has an elevated physical lintel with no new draw');
  stage.update({...snapshot,tick:127,hazards:[{id:'spike',active:false,
    chargeTicksRemaining:5,x:122000,y:84000,width:8000,height:10000}],
    player:{...snapshot.player,vy:-5000}},deck,125000);
  assert.equal(stage.diagnostics().pressureObservedNow,true,
    'genuinely scheduled descending last-six-tick danger uses the same physical warning pose');
  stage.update({...snapshot,tick:128,hazards:[{id:'spike',active:false,
    chargeTicksRemaining:8,x:122000,y:84000,width:8000,height:10000}],
    player:{...snapshot.player,vy:-5000}},deck,125000);
  assert.equal(stage.diagnostics().pressureObservedNow,false,
    'early safe source window must retract the warning vanes');
  stage.update({...snapshot,tick:129},deck,125000,{stale:true});
  assert.equal(stage.diagnostics().visible,false);
  stage.update({...snapshot,lifecycle:'intermission',tick:127},deck,125000);
  assert.equal(stage.diagnostics().pieces,0);
  stage.dispose();stage.dispose();
  assert.equal(stage.group.children.length,0);
}
);
