'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const THREE=require('three');
const base=path.resolve(__dirname,'../../public/ai-dungeon');
function code(name){return fs.readFileSync(path.join(base,name),'utf8')}
const asUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
async function loadRitual(){
 let src=code('warden-ritual.js').replace("'/dungeon/vendor/three.module.js'",JSON.stringify(pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href));
 src=src.replace("'/dungeon/warden-chapter-plan.js'",JSON.stringify(asUrl(code('warden-chapter-plan.js'))));
 src=src.replace("'/dungeon/warden-tell-plan.js'",JSON.stringify(asUrl(code('warden-tell-plan.js'))));
 return import(asUrl(src));
}
function world(){return new THREE.Group()}
function totalCalls(root){let count=0;root.traverse(node=>{if(node.isMesh&&node.visible)count++});return count}
const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>x>0&&x<18&&z>0&&z<18?'.':'#').join(''));
const exit={x:9,z:9};
function boss(guard){return {tick:1,map,units:[{id:'warden',kind:'warden',faction:'enemy',hp:100,maxHp:100,x:9,z:9,action:'idle',actionTick:0}],guardianWard:guard,bossPhase:'SENTINEL',bossWarning:null,bossRecovery:null}}
test('M1 living Warden ceremony uses six dynamic 3D instance batches and keeps truthful guardian retreat',async()=>{
 const {createWardenRitual}=await loadRitual(),scene=world(),r=createWardenRitual(scene,exit,{map,reducedMotion:true});
 const court=scene.children.find(x=>x.name==='Original immovable Warden cathedral');
 const piles=court.children.filter(x=>/^Warden ceremonial /.test(x.name));
 assert.equal(piles.length,4,'four original material/geometry batches replace 24 stand-alone draw calls');
 assert.ok(piles.every(x=>x.isInstancedMesh&&x.count===6));
 const parts=[{y:.12,z:0,scale:[1,1,1],roll:false,turn:0},
  {y:.49,z:0,scale:[1,.72,1],roll:false,turn:0},
  {y:.85,z:0,scale:[1,1,1],roll:true,turn:0},
  {y:.53,z:-.128,scale:[.7,.7,.7],roll:false,turn:Math.PI/2}];
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3+.18,original=new THREE.Object3D();
  original.position.set(Math.cos(angle)*2.5,0,Math.sin(angle)*2.5);
  original.rotation.y=-angle;original.updateMatrix();
  for(let j=0;j<parts.length;j++){
   const spec=parts[j],child=new THREE.Object3D(),got=new THREE.Matrix4(),expect=new THREE.Matrix4();
   child.position.set(0,spec.y,spec.z);
   child.rotation.set(0,spec.turn,spec.roll?(i%2?-.06:.06):0);
   child.scale.set(...spec.scale);child.updateMatrix();
   expect.multiplyMatrices(original.matrix,child.matrix);piles[j].getMatrixAt(i,got);
   for(let k=0;k<16;k++)assert.ok(Math.abs(got.elements[k]-expect.elements[k])<1e-6,
    `same original Warden pylon authored transform ${i}/${j}/${k}`);
  }
 }
 const reveal=piles[0],p0=new THREE.Matrix4(),p1=new THREE.Matrix4();
 r.accept(boss(true));r.animate(0,.016);reveal.getMatrixAt(0,p0);assert.equal(r.metrics().retractedPlinths,0);
 r.accept({...boss(false),tick:2});r.animate(.1,.016);reveal.getMatrixAt(0,p1);
 assert.ok(p1.elements[13]<p0.elements[13]-.8,'real guardian ward drop moves original six 3D pylons');
 assert.equal(r.metrics().retractedPlinths,6);
 const before=p1.clone();r.setSightlines([{x:1.7,z:.5}],new THREE.Vector3(4.9,5,.5));r.animate(.2,.016);
 reveal.getMatrixAt(0,p1);
 assert.ok(r.metrics().hiddenPlinths>=1,'real sightline hides a near-side court pylon');
 assert.ok(Math.abs(p1.elements[0])<Math.abs(before.elements[0])*.001,'concealed geometry is scaled out without new draw calls');
 assert.equal(r.metrics().fixedCeremonialPlinths,6);
 assert.ok(court.children.every(x=>!/^Ritual plinth /.test(x.name)));
 assert.ok(totalCalls(scene)<75,'retain full physical ritual without dozens of repeated static meshes');
 r.dispose();assert.equal(scene.children.length,0);
});
test('M1 original 12 paired carved floor inlays share two real scene draw calls, not loose meshes',async()=>{
 const {createWardenRitual}=await loadRitual(),scene=world(),r=createWardenRitual(scene,exit,{map,reducedMotion:true});
 const tiles=scene.children[0].children.filter(x=>/^Warden concentric /.test(x.name));
 assert.equal(tiles.length,2);
 assert.ok(tiles.every(x=>x.isInstancedMesh&&x.count===12));
 assert.equal(r.metrics().originalBasaltReliefs,12);
 r.dispose();
});
test('M1 ordinary-motion guardian transitions stay smooth, with Warden warning tiles and safe scene teardown',async()=>{
 const {createWardenRitual}=await loadRitual(),scene=world(),r=createWardenRitual(scene,exit,{map,reducedMotion:false});
 r.accept(boss(true));r.animate(.05,.016);assert.equal(r.metrics().retractedPlinths,0);
 r.accept({...boss(false),tick:2,bossWarning:{warning:true,shape:'NOVA',turnsUntilImpact:2,attackTick:4,cells:[{x:9,z:9},{x:10,z:9}]}});
 for(let step=0;step<12;step++)r.animate(step*.016,.05);
 assert.ok(r.metrics().retractedPlinths>0,'real ward opening gradually clears original fighting lane');
 assert.equal(r.metrics().warningTiles,2,'all genuine danger remains, not downgraded for rendering');
 r.accept({...boss(true),tick:3,bossWarning:null});
 for(let step=0;step<48;step++)r.animate(step*.016,.05);
 assert.equal(r.metrics().retractedPlinths,0,'closing authentic guardian ward restores the actual same plinths');
 r.dispose();assert.equal(scene.children.length,0);
});

test('M1 original Gothic wall niches are four retained draws with exact transforms and truthful body cutaway',async()=>{
 const {createWardenRitual}=await loadRitual(),rows=map.map(x=>x.split(''));
 for(const [x,z] of [[13,8],[13,10],[11,13],[8,14]])rows[z][x]='#';
 const scene=world(),r=createWardenRitual(scene,exit,{map:rows.map(row=>row.join('')),reducedMotion:true});
 const court=scene.children.find(x=>x.name==='Original immovable Warden cathedral');
 const sites=court.children.filter(x=>x.name==='Warden cathedral wall buttress');
 const draws=court.children.filter(x=>/^Warden batched cathedral /.test(x.name));
 assert.ok(sites.length>=1&&sites.length<=4);
 assert.equal(draws.length,4);
 assert.ok(draws.every(x=>x.isInstancedMesh&&x.count===sites.length));
 assert.equal(r.metrics().cathedralWallBatches,4);
 assert.equal(r.metrics().cathedralSourceDraws,sites.length*4);
 const part=draws[2],i=0,local=new THREE.Object3D(),actual=new THREE.Matrix4(),expected=new THREE.Matrix4();
 const {WARDEN_WALL_BUTTRESS_PROFILE:profile}=await import(asUrl(code('warden-chapter-plan.js')));
 assert.ok(profile.maxTopMeters<=1.2,'the rebuilt original wall relief has a bounded vertical silhouette');
 assert.ok(profile.shaftY+profile.shaftHeight/2<=profile.maxTopMeters);
 assert.ok(profile.capY+profile.capHeight/2<=profile.maxTopMeters);
 assert.ok(profile.archY+profile.archRadius+profile.archTube<=profile.maxTopMeters+.000001);
 assert.ok(profile.finialY+profile.finialRadius<=profile.maxTopMeters);
 assert.equal(draws[0].geometry.parameters.height,profile.shaftHeight,'actual drawn shaft is low relief');
 assert.equal(draws[1].geometry.parameters.height,profile.capHeight,'actual drawn cap is low relief');
 sites[i].updateMatrix();local.position.set(0,profile.archY,-.08);local.rotation.z=Math.PI;local.updateMatrix();
 expected.multiplyMatrices(sites[i].matrix,local.matrix);part.getMatrixAt(i,actual);
 for(let k=0;k<16;k++)assert.ok(Math.abs(actual.elements[k]-expected.elements[k])<.000001,
  'original pointed Gothic crown matrix '+k);
 const px=court.position.x+sites[i].position.x,pz=court.position.z+sites[i].position.z;
 r.setSightlines([{x:px+.45,z:pz}],new THREE.Vector3(px,2,pz));
 part.getMatrixAt(i,actual);
 assert.ok(r.metrics().hiddenWallButtresses>=1);
 assert.ok(Math.abs(actual.elements[0])<Math.abs(expected.elements[0])*.001);
 r.setSightlines([],new THREE.Vector3(px,2,pz));part.getMatrixAt(i,actual);
 assert.ok(Math.abs(actual.elements[0]-expected.elements[0])<.000001);
 r.dispose();assert.equal(scene.children.length,0);
});
test('M1 authentic breaking guardian ward keeps all twelve original shard trajectories in one instanced draw',async()=>{
 const {createWardenRitual}=await loadRitual();
 for(const reducedMotion of [false,true]){
  const scene=world(),r=createWardenRitual(scene,exit,{map,reducedMotion});
  const mesh=scene.children[0].children.find(x=>x.name==='Warden authentic breaking-ward fragments');
  assert.ok(mesh?.isInstancedMesh);assert.equal(mesh.count,0);
  r.accept(boss(true));r.accept({...boss(false),tick:2});r.animate(.1,.05);
  assert.equal(mesh.count,12);assert.equal(r.metrics().shatterDrawBatches,1);
  assert.equal(r.metrics().shatterSourcePieces,12);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),t=.05/1.05;
  mesh.getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);
  assert.ok(Math.abs(position.x-(.78+(reducedMotion?.14:t*.9)))<.000001);
  assert.ok(Math.abs(position.y-(1.1+(reducedMotion?0:.65*t*t)))<.000001);
  assert.ok(Math.abs(position.z)<.000001);
  for(let i=0;i<25;i++)r.animate(.15+i*.05,.05);
  assert.equal(mesh.count,0,'expired fracture is not drawn');
  r.dispose();assert.equal(scene.children.length,0);
 }
});
