const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const loaded = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/rendered-guardian-center.mjs')).href);
const living = {id:'f8:guardian',kind:'guardian',active:true,health:3,maxHealth:8,
  x:220000,y:3340000,halfHeight:28000};
function setup(overrides={}) {
  const output={x:-999,y:-999,z:-999,set(x,y,z){this.x=x;this.y=y;this.z=z;return this}};
  let calls=0;
  const root={visible:true,getWorldPosition(target){calls++;return target.set(12,26,27)}};
  const entry={initialized:true,state:{...living},model:{group:root},...overrides};
  return {output,root,entry,entries:new Map([[living.id,entry]]),calls:()=>calls};
}
test('the actual posed/interpolated rig root wins over source xyz in current guardian framing', async()=>{
  const {readRenderedGuardianCenter}=await loaded;
  const {output,entries,calls}=setup();
  const before=JSON.stringify(living);
  assert.equal(readRenderedGuardianCenter(living,entries,output,10000),true);
  assert.deepEqual([output.x,output.y,output.z],[12,28.8,27]);
  assert.equal(calls(),1,'only one existing Three world-transform read');
  assert.equal(JSON.stringify(living),before,'camera cannot mutate immutable source');
});
test('no stale, dead, hidden, missing or non-guardian model can become a camera subject',async()=>{
  const {readRenderedGuardianCenter}=await loaded;
  const cases=[
    [{...living,health:0},{}], [{...living,active:false},{}],
    [{...living,kind:'sentinel'},{}],
    [living,{initialized:false}],
    [living,{state:{...living,id:'old-run:guardian'}}],
    [living,{model:{group:{visible:false,getWorldPosition(t){return t.set(1,2,3)}}}}],
    [living,{model:{group:{visible:true}}}],
  ];
  for(const [guardian,overrides] of cases){
    const {output,entries}=setup(overrides);
    assert.equal(readRenderedGuardianCenter(guardian,entries,output,10000),false);
    assert.deepEqual([output.x,output.y,output.z],[-999,-999,-999]);
  }
});
test('invalid transforms and scale never inject NaN into an active camera shot',async()=>{
  const {readRenderedGuardianCenter}=await loaded;
  const {output,entries}=setup({model:{group:{visible:true,getWorldPosition(t){return t.set(NaN,2,3)}}}});
  assert.equal(readRenderedGuardianCenter(living,entries,output,10000),false);
  const ok=setup();
  assert.equal(readRenderedGuardianCenter(living,ok.entries,ok.output,0),false);
});
test('real camera and foreground route read the same render-space guardian witness',()=>{
  const scene=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/guardianDrawnSourceTick = readRenderedGuardianCenter\(/);
  assert.match(scene,/world\.protectRouteSightlines\(camera,[\s\S]*?protectLiveRoute&&sourceGuardian\?guardianRescuePoint:null/);
  assert.match(scene,/guardianDrawNdc: drawnGuardianNdc/);
  assert.ok((scene.match(/currentGuardianDrawPoint \|\| pointFor\(sourceGuardian/g)||[]).length>=8,
    'rescue, full bodies, crossfire and physical sightlines must share drawn location');
});
