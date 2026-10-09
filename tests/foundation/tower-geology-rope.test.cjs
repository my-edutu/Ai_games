'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('three');
const dir=path.resolve(__dirname,'../../public/infinite-tower-climb');
function factory(file,name){
 const source=fs.readFileSync(path.join(dir,file),'utf8').replace(/\bexport\s+function\b/g,'function');
 return new Function(source+';return '+name+';')();
}
test('sculpted 3D canyon has genuine displaced geometry, not sprites and flat backdrops',()=>{
 const scene=new THREE.Scene();
 const world=factory('geology3d.js','createTowerGeology')(THREE,scene);
 assert.ok(world.rocks.length>=10,'both sides of the canyon need depth-separated surfaces');
 const ySamples=[];
 let vertices=0,uniqueDepths=new Set();
 for(const rock of world.rocks){
   assert.ok(rock.isMesh);
   assert.ok(rock.geometry.getAttribute('normal'));
   const p=rock.geometry.getAttribute('position');
   vertices+=p.count;
   for(let i=0;i<p.count;i+=67){uniqueDepths.add(Math.round(p.getZ(i)*100)/100);ySamples.push(p.getY(i))}
 }
 assert.ok(vertices>12000,'substantial terrain tessellation required');
 assert.ok(uniqueDepths.size>40,'surface needs true sculpted depth relief');
 assert.ok(Math.min(...ySamples)<-15 && Math.max(...ySamples)>15);
 assert.ok(world.root.children.some(o=>o.isInstancedMesh),'distant stones must use a GPU instanced draw');
 for(const theme of ['foundry','ruins','clockwork','storm','void']){
   world.setTheme(theme);
   const col=world.rocks[0].geometry.getAttribute('color');
   assert.ok(col.array.every(x=>Number.isFinite(x)));
   assert.ok(col.version>=0);
 }
 world.update(158);
 assert.equal(world.root.position.y,159);
});
test('GPU instanced real climbing rope supports tense wall and moving player anchors',()=>{
 const scene=new THREE.Scene();
 const rope=factory('rope3d.js','createClimbingRope')(THREE,scene);
 assert.ok(rope.root.isInstancedMesh);
 assert.equal(rope.root.count,22);
 let before=null;
 for(let n=0;n<80;n++)rope.update(1/60,{x:n*.08,y:10+n*.045,z:1},{x:1,y:8,z:-2},'WALL CLIMBING');
 const matrix=new THREE.Matrix4();rope.root.getMatrixAt(0,matrix);
 before=matrix.elements.slice();
 rope.update(.016,{x:20,y:25,z:3},{x:5,y:16,z:0},'FALL');
 rope.root.getMatrixAt(0,matrix);
 assert.notDeepEqual(matrix.elements,before);
 assert.ok(matrix.elements.every(Number.isFinite));
 assert.ok(rope.piton.visible);
});
