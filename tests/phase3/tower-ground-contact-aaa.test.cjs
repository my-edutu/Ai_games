'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const file=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/characters.mjs');
const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
let modules;
function load(){
 if(!modules){
  const source=fs.readFileSync(file,'utf8').replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/, `from '${threeURL}'`);
  modules=Promise.all([import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`),import(threeURL)]);
 }
 return modules;
}
test('planted ankle stays on the ground and swing foot clears it',async()=>{
 const [{groundedFootTargets}]=await load();
 for(let i=0;i<120;i++){
  const p=groundedFootTargets(i*Math.PI*2/120,1);
  assert.ok(p.legs.some(x=>x.stance),'at least one planted foot');
  for(const x of p.legs){
   const h=1+p.bodyDip-.4*Math.cos(x.hip)-.39*Math.cos(x.hip+x.knee)-.055*Math.sin(x.hip+x.knee);
   const z=-.4*Math.sin(x.hip)-.39*Math.sin(x.hip+x.knee)+.055*Math.cos(x.hip+x.knee);
   assert.ok(Math.abs(h-(.21+x.lift))<.018,'correct ankle height');
   assert.ok(Math.abs(z-x.forward)<.018,'correct stance location');
   assert.ok(Math.abs(x.hip+x.knee+x.ankle)<1e-6,'flat boot');
  }
 }
});
test('idle, reduced motion and malformed frames do not invent motion',async()=>{
 const [{groundedFootTargets}]=await load();
 for(const [phase,speed,reduced] of [[0,0,false],[42,1,true],[Infinity,NaN,false]]){
  const p=groundedFootTargets(phase,speed,reduced);
  assert.equal(p.bodyDip,0);
  assert.ok(p.legs.every(x=>x.hip===0&&x.knee===0&&x.ankle===0&&x.lift===0));
 }
});
test('real articulated climber and sentinel plant while authority root is untouched',async t=>{
 const [{createClimber,createEnemy},THREE]=await load();
 for(const factory of [createClimber,()=>createEnemy('sentinel')]){
  const actor=factory();t.after(()=>actor.dispose());actor.group.position.set(6,9,-3);
  const root=actor.group.position.clone();let planted=0,lifted=0;
  for(let f=0;f<120;f++){
   actor.animate({state:'standing',vx:3200,vy:0,health:5,maxHealth:5,active:true},1/60,f/60,{});
   actor.group.updateMatrixWorld(true);
   const feet=['-1-ankle','1-ankle'].map(n=>actor.group.getObjectByName(n).getWorldPosition(new THREE.Vector3()));
   const heights=feet.map(p=>p.y-root.y);
   if(heights.some(y=>Math.abs(y-.21)<.05))planted++;
   if(heights.some(y=>y>.30))lifted++;
   assert.ok(actor.group.position.distanceTo(root)<1e-9,'world root stays immutable');
  }
  assert.ok(planted>=100,'grounded during nearly every frame');assert.ok(lifted>5,'swing clears the floor');
 }
});
test('footfall events alternate and stop when airborne or reduced motion',async t=>{
 const [{createClimber}]=await load(),actor=createClimber();t.after(()=>actor.dispose());
 const contacts=[],base={state:'standing',vx:3600,vy:0,health:5,maxHealth:5,active:true};
 for(let f=0;f<180;f++)actor.animate(base,1/60,f/60,{onFootPlant:s=>contacts.push(s)});
 assert.ok(contacts.length>=3&&contacts.length<=16);assert.equal(new Set(contacts).size,2);
 const count=contacts.length;
 for(let f=0;f<90;f++)actor.animate({...base,state:'airborne'},1/60,f/60,{onFootPlant:s=>contacts.push(s)});
 for(let f=0;f<90;f++)actor.animate(base,1/60,f/60,{reducedMotion:true,onFootPlant:s=>contacts.push(s)});
 assert.equal(contacts.length,count,'no footstep without support');
});
