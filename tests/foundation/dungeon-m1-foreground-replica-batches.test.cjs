const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/postfx-budget.js'),'utf8')).toString('base64'));
function original(parent,materialA,materialB,x,z){
 const root=new THREE.Group();root.position.set(x,0,z);parent.add(root);
 const make=(geometry,material,y)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;root.add(mesh);return mesh};
 make(new THREE.CylinderGeometry(.14,.17,2.12,8),materialA,1.1);
 make(new THREE.CylinderGeometry(.22,.22,.14,8),materialB,1.99);
 return root;
}
function worldPosition(mesh,index,at=[0,0,0]){
 const instance=new THREE.Matrix4(),position=new THREE.Vector3(...at);
 mesh.getMatrixAt(index,instance);return position.applyMatrix4(instance).toArray();
}
test('original multi-part foreground replicas retain their 3D transforms, cutaway and shared resources in two GPU draws',async()=>{
 const {createRetainedForegroundReplicaBatches}=await load();
 const parent=new THREE.Group(),bronze=new THREE.MeshStandardMaterial(),stone=new THREE.MeshStandardMaterial();
 const roots=[original(parent,bronze,stone,1,2),original(parent,bronze,stone,-2,3),original(parent,bronze,stone,3,-4)];
 const before=roots.map(root=>new THREE.Box3().setFromObject(root).clone());
 const batch=createRetainedForegroundReplicaBatches(THREE,parent,roots);
 assert.equal(batch.sourceDrawCalls,6);assert.equal(batch.drawCalls,2);assert.equal(batch.savedDrawCalls,4);
 assert.equal(batch.meshes.length,2);assert.equal(batch.sync().matrixWrites,0,'static originals upload only once');
 for(const [actual,expected] of [[worldPosition(batch.meshes[0],0),[1,1.1,2]],[worldPosition(batch.meshes[1],0),[1,1.99,2]]])
  assert(actual.every((v,i)=>Math.abs(v-expected[i])<1e-5));
 assert(roots.every(root=>root.children.every(mesh=>mesh.visible===false)));
 assert(roots.every((root,i)=>new THREE.Box3().setFromObject(root).equals(before[i])), 'original physical sightline volumes remain');
 roots[1].position.y=-2.4;roots[1].rotation.y=Math.PI/2;
 const changed=batch.sync();assert.equal(changed.matrixWrites,2);
 const rotated=worldPosition(batch.meshes[0],1);assert(Math.abs(rotated[0]+2)<1e-6);assert(Math.abs(rotated[1]+1.3)<1e-6);
 roots[2].visible=false;assert.equal(batch.sync().matrixWrites,2);
 const hidden=batch.meshes[0].getMatrixAt(2,new THREE.Matrix4());assert.equal(hidden.determinant(),0,'receded hidden pillar renders no fragments');
 roots[2].visible=true;roots[2].position.y=-.6;assert.equal(batch.sync().matrixWrites,2);
 batch.dispose();batch.dispose();assert.equal(parent.children.filter(n=>n.isInstancedMesh).length,0);
 assert(roots.every(root=>root.children.every(mesh=>mesh.visible===true)), 'rollback restores original physical meshes');
 assert.equal(bronze.version,0,'the shared source material is not modified');
});
test('different author geometry or materials must fail closed with every source prop still visible',async()=>{
 const {createRetainedForegroundReplicaBatches}=await load();
 const parent=new THREE.Group(),bronze=new THREE.MeshStandardMaterial(),stone=new THREE.MeshStandardMaterial();
 const a=original(parent,bronze,stone,1,0),b=original(parent,bronze,stone,3,0);
 b.children[0].geometry=new THREE.CylinderGeometry(.9,.9,2.12,8);
 const rejected=createRetainedForegroundReplicaBatches(THREE,parent,[a,b]);
 assert.equal(rejected.savedDrawCalls,0);assert.equal(rejected.drawCalls,4);
 assert(a.children.every(m=>m.visible)&&b.children.every(m=>m.visible));assert.equal(parent.children.filter(n=>n.isInstancedMesh).length,0);
 rejected.dispose();
 assert.equal(createRetainedForegroundReplicaBatches(THREE,parent,[a]).drawCalls,2);
});

test('rendered multi-ray source proof clears only nearer physical stone, not scenic rear props',async()=>{
 const {createRetainedForegroundReplicaBatches,planRenderedForegroundStageHitOwners}=await load();
 const parent=new THREE.Group(),a=new THREE.MeshStandardMaterial(),b=new THREE.MeshStandardMaterial();
 const roots=[original(parent,a,b,-1,2),original(parent,a,b,1,2)];
 const batch=createRetainedForegroundReplicaBatches(THREE,parent,roots);
 assert.equal(batch.meshes[0].userData.dungeonForegroundSourceRoots,roots);
 const living=[{visibleActor:true,x:-1,z:0},{visibleActor:true,x:1,z:0}];
 const cam={x:0,y:6,z:6};
 const hit=(i,d)=>({object:batch.meshes[0],instanceId:i,distance:d});
 const out=planRenderedForegroundStageHitOwners([[hit(1,3.5)],[hit(1,3.7)],[hit(0,20)]],living,cam);
 assert.equal(out.verifiedOwners,1);assert(out.roots.has(roots[1]));
 assert(!out.roots.has(roots[0]));
 assert.equal(roots[1].position.y,0,'selector cannot mutate source geometry or authority');
 assert.equal(planRenderedForegroundStageHitOwners([[hit(1,3)]],living,cam).verifiedOwners,0,'one pixel never hides Gothic stone');
 assert.equal(planRenderedForegroundStageHitOwners([[hit(1,3)],[hit(1,4)]],
  [{visibleActor:false,x:-1,z:0},{visibleActor:true,x:1,z:0}],cam).verifiedOwners,0,'absent actors may not clear scenery');
 assert.equal(planRenderedForegroundStageHitOwners([[hit(1,20)],[hit(1,20)]],living,cam).verifiedOwners,0,'rear architecture retains depth');
 batch.dispose();
});
