'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src('public/ai-dungeon/foreground-sightline-plan.js')).toString('base64'));
test('actual Gothic geometry wing blocks animated anatomy even if its root is elsewhere',async()=>{
 const {planForegroundBodyClearance:clear,planForegroundRayBlocked:ray,planForegroundPointRisk:risk}=await load();
 const camera=Object.freeze({x:6,y:2.6,z:0}),subject=Object.freeze({x:0,z:0,visibleActor:true});
 const opaque=Object.freeze([2.7,.1,-.23,3.03,2.63,.26]),rear=Object.freeze([-3,.1,-.23,-2.6,2.6,.26]);
 const untouched=JSON.stringify([camera,subject,opaque,rear]);
 assert.equal(clear(opaque,[subject],camera),true);
 assert.equal(clear(rear,[subject],camera),false);
 assert.equal(clear([2.7,3.3,-.23,3.03,4,.26],[subject],camera),false);
 assert.equal(clear(opaque,[{x:0,z:0}],camera),false,'scenic points cannot erase architecture');
 assert.equal(clear(opaque,[{...subject,visibleActor:false}],camera),false);
 assert.equal(clear(opaque,Array(6).fill(subject),camera),false,'no unbounded crowds');
 assert.equal(ray(opaque,camera,{x:0,y:1.23,z:0}),true);
 assert.equal(risk([rear,opaque],camera,{x:0,y:1.23,z:0},subject),true);
 assert.equal(risk([opaque],camera,{x:0,y:1.23,z:0},{x:0,z:0}),false);
 assert.equal(JSON.stringify([camera,subject,opaque,rear]),untouched);
});
test('floor-captured volumes are indexed, frozen and reject giant or infinite geometry',async()=>{
 const {captureForegroundVolumes:capture,planForegroundRayBlocked:ray}=await load();
 class Box3{setFromObject(o){this.min=o.min;this.max=o.max;return this;}isEmpty(){return !this.min;}}
 const groups=[{updateWorldMatrix(){},min:{x:1,y:0,z:-1},max:{x:2,y:2,z:1}},
  {updateWorldMatrix(){},min:{x:-100,y:0,z:0},max:{x:100,y:2,z:0.1}}];
 const v=capture({Box3},groups);
 assert.deepEqual(v[0],[1,0,-1,2,2,1]);assert.equal(v[1],null);assert.ok(Object.isFrozen(v[0]));
 assert.equal(ray(v[0],{x:5,y:1,z:0},{x:0,y:1,z:0}),true);
 assert.equal(ray(v[0],{x:5,y:1,z:0},{x:4,y:1,z:0}),false);
 const app=src('public/ai-dungeon/app.js'),env=src('public/ai-dungeon/environment.js'),
  camera=src('public/ai-dungeon/physical-camera-director.js');
 assert.match(app,/captureForegroundVolumes\(THREE,world\.userData\.foregroundProps/);
 assert.match(env,/captureForegroundVolumes\(THREE,foregroundGroups\)/);
 assert.match(env,/planForegroundBodyClearance\(foregroundVolumes\[i\]/);
 assert.match(camera,/planForegroundPointRisk\(propVolumes,cam,point,p\)/);
 const assets=src('public/ai-dungeon/model-assets.js');
 assert.match(assets,/function putEnvironment\(world,sceneKey,map,onAssetReady=null\)/);
 assert.match(assets,/group\.add\(source\);[\s\S]*?onAssetReady\(\)/);
 assert.match(app,/const authoredSceneKey=worldFloor/);
 assert.match(app,/sceneKey!==authoredSceneKey\)return/);
 assert.match(app,/authoredPropVolumes=captureForegroundVolumes/);
 assert.match(app,/cameraPropVolumes=\[\.\.\.world\.userData\.foregroundPropVolumes/);
 const host=src('scripts/serve-dungeon-stream.cjs');
 assert.ok(host.includes("['/dungeon/foreground-sightline-plan.js','foreground-sightline-plan.js']"),
  'the new real WebGL module must be publicly served under the strict allowlist');
});


test('physical shot director omits only genuinely receding live-body foreground and keeps rear masonry',async()=>{
 const {planDrawableForegroundVolumes:drawable,planForegroundPointRisk:risk}=await load();
 const camera=Object.freeze({x:6,y:2.6,z:0});
 const actor=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true});
 const near=Object.freeze([2.7,.1,-.23,3.03,2.63,.26]);
 const rear=Object.freeze([-3,.1,-.23,-2.6,2.6,.26]);
 const live=drawable([near,rear],[actor],camera);
 assert.deepEqual(live,[rear],'the camera cannot penalize an arch already hidden by its real render cutaway');
 assert.equal(risk(live,camera,{x:0,y:1.23,z:0},actor),false);
 assert.deepEqual(drawable([near,rear],[{x:0,z:0}],camera),[near,rear],
  'scenic marks without verified skeletal bodies cannot delete foreground');
 assert.deepEqual(drawable(Array(161).fill(near),[actor],camera),[],
  'strict bounded work rejects unbounded imported geometry');
 const physical=src('public/ai-dungeon/physical-camera-director.js');
 assert.match(physical,/planDrawableForegroundVolumes\(propVolumes,eyes,cam\)/);
});
