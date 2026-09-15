'use strict';

// Presentation-only pass three. This file intentionally consumes only the public
// snapshot and renderer helpers established by app.js; it never mutates authority.
const PASS3_LOCAL_RENDER_RADIUS=2;
const PASS3_EXPLORER_SCALE=1.24;
const PASS3_ROOM_IDENTITY_LAYERS=3;
const PASS3_ARCHITECTURAL_SILHOUETTE='stepped-ruin-arches';
const PASS3_COMPOSITION_PROFILE='character-forward-close';

const pass3BaseBuildMazeWorld=buildMazeWorld;
const pass3BaseDrawWallPrism=drawWallPrism;
const pass3BaseDrawRoomDressing=drawRoomDressing;
const pass3BaseDrawCellArchitecture=drawCellArchitecture;
const pass3BaseDrawExplorer=drawExplorer;
const pass3BaseRender=MazeWorldRenderer.prototype.render;

buildMazeWorld=function(snapshot,view){
  const world=pass3BaseBuildMazeWorld(snapshot,view);
  const cells=world.cells.filter(cell=>cellGridDistance(snapshot,cell.cell,snapshot.currentCell)<=PASS3_LOCAL_RENDER_RADIUS);
  return{...world,cells,localIds:new Set(cells.map(cell=>cell.cell))};
};

function pass3WallBox(batch,p,side,y,height,length,depth,color,offset=0){
  if(side==='north')batch.box(p.x+offset,y,p.z-.5,length,height,depth,color);
  if(side==='south')batch.box(p.x+offset,y,p.z+.5,length,height,depth,color);
  if(side==='west')batch.box(p.x-.5,y,p.z+offset,depth,height,length,color);
  if(side==='east')batch.box(p.x+.5,y,p.z+offset,depth,height,length,color);
}

drawWallPrism=function(batch,snapshot,cell,side,color){
  const p=cellWorld(snapshot,cell.cell),cutaway=side==='south'||side==='east',variation=seedUnit(snapshot,cell.cell,7),fullHeight=cutaway?.54+variation*.08:1.08+variation*.26;
  const body=cutaway?mixColor(color,PALETTE.foundation,.24):color,base=mixColor(PALETTE.stoneDark,body,.34),cap=mixColor(PALETTE.stoneLight,body,.38),retrofit=mixColor(PALETTE.metalDark,PALETTE.oxidized,.40);
  pass3WallBox(batch,p,side,.08,.20,1.10,.20,base);
  pass3WallBox(batch,p,side,.22+fullHeight*.29,fullHeight*.56,1.02,.15,body);
  if(cutaway){
    pass3WallBox(batch,p,side,.24+fullHeight*.59,.13,1.08,.19,cap);
    return;
  }
  const crownY=.23+fullHeight*.61;
  pass3WallBox(batch,p,side,crownY,.18,.28,.19,cap,-.36);
  pass3WallBox(batch,p,side,crownY+.03,.24,.24,.19,mixColor(cap,PALETTE.stoneDark,.10),.36);
  pass3WallBox(batch,p,side,crownY+.12,.40,.30,.19,mixColor(cap,PALETTE.stoneLight,.10),0);
  if(presentationSeed(snapshot,cell.cell,side.charCodeAt(0)+211)%3!==0)pass3WallBox(batch,p,side,.55,.07,.58,.205,retrofit,(seedUnit(snapshot,cell.cell,223)-.5)*.16);
};

function pass3DrawPassageArch(batch,snapshot,cell,side,material){
  const p=cellWorld(snapshot,cell.cell),stone=mixColor(material,PALETTE.stoneLight,.18),dark=mixColor(material,PALETTE.stoneDark,.30),metal=mixColor(PALETTE.metalDark,PALETTE.oxidized,.32);
  if(side==='north'||side==='south'){
    const z=p.z+(side==='north'?-.49:.49);
    batch.box(p.x-.38,.39,z,.12,.72,.17,dark);batch.box(p.x+.38,.39,z,.12,.72,.17,stone);
    batch.box(p.x-.24,.79,z,.24,.13,.18,stone);batch.box(p.x+.24,.79,z,.24,.13,.18,stone);batch.box(p.x,.89,z,.25,.17,.19,mixColor(stone,PALETTE.stoneLight,.12));
    batch.box(p.x,.66,z-.015,.38,.045,.205,metal);
  }else{
    const x=p.x+(side==='west'?-.49:.49);
    batch.box(x,.39,p.z-.38,.17,.72,.12,dark);batch.box(x,.39,p.z+.38,.17,.72,.12,stone);
    batch.box(x,.79,p.z-.24,.18,.13,.24,stone);batch.box(x,.79,p.z+.24,.18,.13,.24,stone);batch.box(x,.89,p.z,.19,.17,.25,mixColor(stone,PALETTE.stoneLight,.12));
    batch.box(x-.015,.66,p.z,.205,.045,.38,metal);
  }
  return 6;
}

drawRoomDressing=function(batch,snapshot,cell,type,material){
  let count=pass3BaseDrawRoomDressing(batch,snapshot,cell,type,material);
  const p=cellWorld(snapshot,cell.cell),facility=type.includes('lab')||type.includes('research')||type.includes('machine')||type.includes('service'),accent=facility?mixColor(PALETTE.cyan,PALETTE.metalDark,.52):mixColor(PALETTE.torch,PALETTE.stoneDark,.58),trim=facility?mixColor(PALETTE.oxidized,PALETTE.metalDark,.36):mixColor(PALETTE.stoneLight,PALETTE.stoneDark,.40);
  // Layer 1: readable floor signature.
  batch.box(p.x,-.014,p.z,.52,.018,.065,mixColor(accent,PALETTE.floor,.38));
  batch.box(p.x,-.012,p.z,.065,.020,.52,mixColor(accent,PALETTE.floor,.48));
  // Layer 2: asymmetric vertical landmark so adjacent rooms do not read as copies.
  const flip=presentationSeed(snapshot,cell.cell,307)%2===0?-1:1;
  batch.box(p.x+flip*.37,.28,p.z-flip*.31,.10,.50,.10,trim);
  // Layer 3: archetype beacon / relic / control light.
  batch.box(p.x+flip*.37,.57,p.z-flip*.31,.13,.07,.13,mixColor(accent,facility?PALETTE.cyan:PALETTE.torch,.20));
  count+=4;
  return clamp(count,4,14);
};

drawCellArchitecture=function(batch,world,cell){
  let count=pass3BaseDrawCellArchitecture(batch,world,cell);
  const {snapshot,localIds}=world,type=selectRoomArchetype(cell,snapshot),material=archetypeMaterial(type,snapshot,cell.cell),row=Math.floor(cell.cell/snapshot.width),col=cell.cell%snapshot.width,neighbors=new Set(cell.neighbors);
  const dirs=[['north',cell.cell-snapshot.width,row>0],['east',cell.cell+1,col<snapshot.width-1],['south',cell.cell+snapshot.width,row<snapshot.height-1],['west',cell.cell-1,col>0]];
  for(const [side,id,inside] of dirs){
    if(!inside||!neighbors.has(id)||!localIds.has(id)||cell.cell>id)continue;
    if(presentationSeed(snapshot,cell.cell,id+401)%3===0||cell.checkpoint||cell.clue){count+=pass3DrawPassageArch(batch,snapshot,cell,side,material);break}
  }
  return clamp(count,4,14);
};

drawExplorer=function(batch,snapshot){
  const p=cellWorld(snapshot,snapshot.currentCell),s=PASS3_EXPLORER_SCALE,moving=(snapshot.intent?.mode??'').includes('route')||(snapshot.intent?.mode??'').includes('search'),confidence=clamp(snapshot.intent?.confidence??.5,0,1),gait=settings.reducedMotion?0:(moving?Math.sin(animationTime*.012)*.075:Math.sin(animationTime*.004)*.016),cautious=confidence<.45?.06:0;
  const suit=mixColor(PALETTE.suit,PALETTE.suitArmor,.18),armor=mixColor(PALETTE.suitArmor,PALETTE.stoneDark,.16),dark=PALETTE.suitDark;
  const Y=value=>.055+(value-.055)*s, X=value=>value*s, D=value=>value*s;
  batch.box(p.x,Y(.58-cautious),p.z,D(.34),D(.44),D(.26),suit);batch.box(p.x,Y(.78-cautious),p.z-.005,D(.30),D(.18),D(.28),armor);batch.box(p.x,Y(.96-cautious),p.z-.01,D(.27),D(.25),D(.27),mixColor(dark,PALETTE.suitArmor,.32));
  batch.box(p.x+X(-.13),Y(.27+gait),p.z,D(.105),D(.39),D(.115),dark);batch.box(p.x+X(.13),Y(.27-gait),p.z,D(.105),D(.39),D(.115),dark);
  batch.box(p.x+X(-.25),Y(.58-gait*.50),p.z-.01,D(.09),D(.38),D(.105),suit);batch.box(p.x+X(.25),Y(.58+gait*.50),p.z-.01,D(.09),D(.38),D(.105),suit);
  batch.box(p.x,Y(.58),p.z+D(.16),D(.24),D(.34),D(.12),PALETTE.pack);batch.box(p.x,Y(.96-cautious),p.z-D(.145),D(.18),D(.07),D(.035),mixColor(PALETTE.visor,PALETTE.suitDark,.18));batch.box(p.x+X(.16),Y(.77),p.z-D(.15),D(.055),D(.055),D(.16),mixColor(PALETTE.torch,PALETTE.suitArmor,.12));
};

MazeWorldRenderer.prototype.render=function(snapshot,scene,camera){
  const aspect=canvas.width/Math.max(1,canvas.height),baseDistance=scene==='result'||scene==='intermission'?6.40:(aspect<1.9?6.25:5.95),targetDistance=scene==='result'||scene==='intermission'?5.55:(aspect<1.9?5.42:5.25),existingZoom=Number(camera?.zoom)||1,cameraBoost=baseDistance/targetDistance;
  pass3BaseRender.call(this,snapshot,scene,{...(camera??{}),zoom:existingZoom*cameraBoost});
  const effectiveDistance=targetDistance/existingZoom;
  this.lastStats={...this.lastStats,cameraDistance:Number(effectiveDistance.toFixed(3)),localRenderRadius:PASS3_LOCAL_RENDER_RADIUS,compositionProfile:PASS3_COMPOSITION_PROFILE,explorerScale:PASS3_EXPLORER_SCALE,roomIdentityLayers:PASS3_ROOM_IDENTITY_LAYERS,architecturalSilhouette:PASS3_ARCHITECTURAL_SILHOUETTE};
  window.__MAZE_RENDER_STATS__=Object.freeze({...this.lastStats});
};

window.__MAZE_COMPOSITION_PASS__=Object.freeze({version:3,authorityTouched:false,localRenderRadius:PASS3_LOCAL_RENDER_RADIUS,explorerScale:PASS3_EXPLORER_SCALE,roomIdentityLayers:PASS3_ROOM_IDENTITY_LAYERS,architecturalSilhouette:PASS3_ARCHITECTURAL_SILHOUETTE});
