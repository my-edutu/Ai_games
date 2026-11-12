'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path'),fs=require('node:fs');
const ROOT=path.resolve(__dirname,'../..');
async function load(){return import(pathToFileURL(path.join(ROOT,'public/ai-dungeon/native-actor-visibility.js')).href)}
class Vec3 {
 constructor(){this.x=0;this.y=0;this.z=0}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}
}
class Matrix4 {multiplyMatrices(a,b){this.a=a;this.b=b;return this}}
class Sphere {constructor(){this.center=new Vec3();this.radius=1}}
class Frustum {
 setFromProjectionMatrix(m){this.matrix=m;return this}
 intersectsSphere(s){return s.center.x+s.radius>=-5&&s.center.x-s.radius<=5&&s.center.z+s.radius>=-5&&s.center.z-s.radius<=5}
}
const THREE={Vector3:Vec3,Matrix4,Sphere,Frustum};
function actor(id,x,z,kind='revenant'){
 const root={visible:true,position:{x,y:0,z},getWorldPosition(v){return v.set(x,0,z)}};
 return {u:{id,kind,faction:kind==='vanguard'?'party':'enemy',hp:60},root,authored:true,assetRoot:{visible:true},nativePresentation:{sourceMeshes:9}};
}
function camera(){return {projectionMatrix:{},matrixWorldInverse:{},position:{x:0,y:4,z:0},updateMatrixWorld(){this.updated=true}}}
test('off-camera original skin meshes stop drawing; gameplay root, AI and mixer remain untouched',async()=>{
 const {createNativeActorVisibilityStage}=await load(),stage=createNativeActorVisibilityStage(THREE);
 const hero=actor('vanguard',0,0,'vanguard'),boss=actor('warden',0,0,'warden');
 const far=actor('far',30,25),mixer={updates:42};far.mixer=mixer;
 const actors=[hero,boss,far],snap=actors.map(a=>JSON.stringify(a.u));
 const r=stage.apply(camera(),actors);
 assert.equal(r.culled,1);assert.equal(r.retained,2);assert.equal(r.sourceMeshesSkipped,9);
 assert.equal(far.assetRoot.visible,false);assert.equal(hero.assetRoot.visible,true);assert.equal(boss.assetRoot.visible,true);
 assert.deepEqual(actors.map(a=>JSON.stringify(a.u)),snap);
 assert.equal(far.root.visible,true);assert.equal(far.mixer,mixer);
});
test('original source rig returns immediately on camera re-entry',async()=>{
 const {createNativeActorVisibilityStage}=await load(),stage=createNativeActorVisibilityStage(THREE);
 const a=actor('revenant',40,0);stage.apply(camera(),[a]);assert.equal(a.assetRoot.visible,false);
 a.root.getWorldPosition=v=>v.set(1,0,0);
 assert.equal(stage.apply(camera(),[a]).culled,0);assert.equal(a.assetRoot.visible,true);
});
test('generous real-world sphere keeps near-edge sword and Warden body visible',async()=>{
 const {createNativeActorVisibilityStage}=await load(),stage=createNativeActorVisibilityStage(THREE);
 const edge=actor('edge',7.9,0),boss=actor('warden',8.9,0,'warden');
 assert.equal(stage.apply(camera(),[edge,boss]).culled,0);
 assert.equal(edge.assetRoot.visible,true);assert.equal(boss.assetRoot.visible,true);
});
test('camera failure, invalid rig transform and retired actor fail open',async()=>{
 const {createNativeActorVisibilityStage}=await load(),stage=createNativeActorVisibilityStage(THREE);
 const a=actor('far',30,30);stage.apply(camera(),[a]);assert.equal(a.assetRoot.visible,false);
 assert.equal(stage.apply(null,[a]).status,'fail-open');assert.equal(a.assetRoot.visible,true);
 a.root.getWorldPosition=()=>{throw Error('stale scene')};
 assert.equal(stage.apply(camera(),[a]).status,'partial-fail-open');assert.equal(a.assetRoot.visible,true);
 a.detached=true;a.root.getWorldPosition=v=>v.set(100,0,100);
 stage.apply(camera(),[a]);assert.equal(a.assetRoot.visible,true);
});
test('bounded diagnostic and resource cleanup restore original GLB visibility',async()=>{
 const {createNativeActorVisibilityStage}=await load(),stage=createNativeActorVisibilityStage(THREE);
 const a=actor('far',30,30);
 for(let i=0;i<100;i++)stage.apply(camera(),[a]);
 assert.equal(stage.stats().culled,1);assert.equal(stage.stats().sourceMeshesSkipped,9);
 assert.equal(stage.dispose([a]),1);assert.equal(a.assetRoot.visible,true);
});
test('production integrates software-only culling after final camera aim, before real GPU submit',()=>{
 const app=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(ROOT,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/softwareWebGL\?createNativeActorVisibilityStage\(THREE\):null/);
 const apply=app.indexOf('nativeActorVisibility?.apply(camera,actors.values())');
 const render=app.indexOf('renderer.render(scene,camera)',apply);
 assert.ok(apply>0&&render>apply,'actual scene culling must precede render, not authority');
 assert.match(server,/\['\/dungeon\/native-actor-visibility\.js','native-actor-visibility\.js'\]/);
});
