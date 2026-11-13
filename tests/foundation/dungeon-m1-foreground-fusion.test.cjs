'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),THREE=require('three');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/postfx-budget.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const round=x=>Math.round(x*100000)/100000;
function vertices(mesh){
 mesh.updateMatrix();const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
 geo.applyMatrix4(mesh.matrix);
 const a=geo.getAttribute('position'),result=[];
 for(let i=0;i<a.count;i++)result.push([round(a.getX(i)),round(a.getY(i)),round(a.getZ(i))].join(','));
 geo.dispose();return result.sort();
}
test('original pillar collars retain exact triangles/UVs while three native draws become one',async()=>{
 const {fuseOriginalForegroundGroup}=await load();
 const group=new THREE.Group(),iron=new THREE.MeshStandardMaterial({color:0x334455}),brass=new THREE.MeshStandardMaterial({color:0xd1a35b});
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.14,.17,2.12,8),iron);pole.position.y=1.1;group.add(pole);
 for(const y of [.14,1.02,1.99]){
  const collar=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.14,8),brass);
  collar.position.y=y;group.add(collar);
 }
 const before=group.children.filter(m=>m.material===brass).flatMap(vertices).sort();
 const result=fuseOriginalForegroundGroup(THREE,group);
 assert.equal(result.sourceDraws,4);assert.equal(result.outputDraws,2);
 assert.equal(result.drawsSaved,2);assert.equal(result.mergedGroups,1);
 assert.equal(result.sourceTriangles,result.mergedTriangles);
 const merged=group.children.find(c=>c.material===brass);
 assert.deepEqual(vertices(merged),before);
 assert.equal(merged.geometry.getAttribute('uv').count,merged.geometry.getAttribute('position').count);
 group.position.set(4,-3,5);
 assert.deepEqual(vertices(merged),before,'full group cutaway maintains original local geometry');
 for(const g of result.geometries)g.dispose();brass.dispose();iron.dispose();
});
test('original moving torch fire, inner glow and attached practical light remain separate',async()=>{
 const {fuseOriginalForegroundGroup}=await load();
 const g=new THREE.Group(),iron=new THREE.MeshStandardMaterial(),gold=new THREE.MeshStandardMaterial({color:0xa78a47});
 const parts=[
  new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,1.5,9),iron),
  new THREE.Mesh(new THREE.CylinderGeometry(.2,.1,.12,9),iron),
  new THREE.Mesh(new THREE.CylinderGeometry(.038,.038,.31,7),gold),
  new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,.36,8),gold)
 ];
 for(let i=0;i<4;i++){parts[i].position.y=.3+i*.4;g.add(parts[i]);}
 const fire=new THREE.Mesh(new THREE.ConeGeometry(.15,.46,9),new THREE.MeshBasicMaterial({transparent:true,opacity:.8}));
 const inner=new THREE.Mesh(new THREE.ConeGeometry(.065,.26,8),new THREE.MeshBasicMaterial({transparent:true,opacity:.8}));
 const light=new THREE.PointLight(0xffbb88,2.1);
 g.add(fire,inner,light);
 const before=[...parts.filter(m=>m.material===iron).flatMap(vertices),...parts.filter(m=>m.material===gold).flatMap(vertices)].sort();
 const result=fuseOriginalForegroundGroup(THREE,g,{preserve:[fire,inner]});
 assert.equal(result.sourceDraws,6);assert.equal(result.outputDraws,4);
 assert.equal(result.drawsSaved,2);assert.equal(result.mergedGroups,2);
 assert.ok(g.children.includes(fire)&&g.children.includes(inner)&&g.children.includes(light));
 assert.deepEqual(g.children.filter(m=>m.material===iron||m.material===gold).flatMap(vertices).sort(),before);
 fire.scale.y=1.4;g.position.y=-2;
 assert.equal(fire.scale.y,1.4);assert.equal(g.position.y,-2);
 for(const x of result.geometries)x.dispose();
 for(const m of [iron,gold,fire.material,inner.material])m.dispose();
});
test('three-dimensional adult actors, transparent effects and unrelated materials never fuse',async()=>{
 const {fuseOriginalForegroundGroup}=await load();
 const g=new THREE.Group(),m=new THREE.MeshBasicMaterial(),t=new THREE.MeshBasicMaterial({transparent:true,opacity:.5});
 const actor=new THREE.SkinnedMesh(new THREE.BoxGeometry(1,2,1),m);
 const a=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),t),b=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),t);
 g.add(actor,a,b);
 const result=fuseOriginalForegroundGroup(THREE,g);
 assert.equal(result.drawsSaved,0);assert.equal(result.geometries.length,0);
 assert.deepEqual(g.children,[actor,a,b]);
 m.dispose();t.dispose();
});
test('invalid inputs and excessively large original groups do not trigger unsafe fusion',async()=>{
 const {fuseOriginalForegroundGroup}=await load();
 assert.throws(()=>fuseOriginalForegroundGroup(null,new THREE.Group()),TypeError);
 const g=new THREE.Group(),m=new THREE.MeshStandardMaterial();
 for(let i=0;i<49;i++)g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),m));
 const result=fuseOriginalForegroundGroup(THREE,g);
 assert.equal(result.drawsSaved,0);assert.equal(g.children.length,49);
 m.dispose();
});
