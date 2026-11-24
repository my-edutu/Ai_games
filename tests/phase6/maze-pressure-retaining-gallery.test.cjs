'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
async function setup(){
  const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-gallery-'));
  try{
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const name of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',name),path.join(temp,name));
    for(const name of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',name),path.join(temp,'vendor',name));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const source=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,source,world:source.createMazeWorld({balanced:true}),cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(e){fs.rmSync(temp,{recursive:true,force:true});throw e}
}
const cell=(id,over={})=>({cell:id,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false,...over});
const snapshot=(cells,doors=[])=>({runToken:'gallery-test',tick:1,width:3,height:3,currentCell:4,cells,
  visibleCells:cells.map(c=>c.cell),keys:[],doors,inventory:[],threats:[],exitCell:null,result:null});
test('a published trap reconstructs a full actual upper retaining face, never a secret path or false gateway',async()=>{
  const {THREE,source,world,cleanup}=await setup();
  try{
    const publicState=snapshot([cell(4),cell(7,{trap:true})]),original=JSON.stringify(publicState);
    world.update(publicState);
    const budget=world.stats();
    assert.equal(budget.pressureRetainingGalleries,1,'only the real known higher pressure-adjacent solid face gets art');
    const upper=source.cellPosition(4,3,3),base=source.cellHeight(4,3,3);
    const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
    let bays=0,opaqueBacking=0;
    // Count REAL world-space instance transforms. A changed source comment,
    // renamed wall, screenshot crop or fake portal does not pass this gate.
    world.group.traverse(obj=>{
      if(!obj.isInstancedMesh)return;
      const color=obj.material.color?.getHexString();
      if(color!=='5d968e' && color!=='28574f')return;
      for(let i=0;i<obj.count;i++){
        obj.getMatrixAt(i,m);m.decompose(p,q,s);
        if(color==='5d968e'
          &&Math.abs(p.z-(upper.z+1.344))<.006
          &&Math.abs(p.y-(base-.685))<.001
          &&Math.abs(s.x-.34)<.01
          &&Math.abs(s.y-.80)<.01
          && [-.57,0,.57].some(offset=>Math.abs(p.x-(upper.x+offset))<.002))
          bays++;
        if(color==='28574f'
          &&Math.abs(p.x-upper.x)<.002
          &&Math.abs(p.z-(upper.z+1.243))<.006
          &&Math.abs(p.y-(base-.70))<.001
          &&Math.abs(s.x-2.01)<.01
          &&Math.abs(s.y-1.12)<.01)
          opaqueBacking++;
      }
    });
    assert.equal(bays,3,'THREE physically recessed sea-glass bays must replace the former flat facade');
    assert.equal(opaqueBacking,1,'gallery remains solid and opaque behind EVERY bay, never a false route');
    world.animate(0,{explorerPosition:new THREE.Vector3(upper.x,base,upper.z)});
    assert.equal(world.stats().geometryCount,budget.geometryCount,'no new render-frame geometries');
    assert.equal(world.stats().materialCount,budget.materialCount,'no new render-frame materials');
    assert.equal(JSON.stringify(publicState),original,'art never modifies public game authority');
    world.update(snapshot([cell(4),cell(7)]));
    assert.equal(world.stats().pressureRetainingGalleries,0,'private hidden trap cannot reveal future gallery');
    world.update(snapshot([cell(4,{neighbors:[7]}),cell(7,{trap:true,neighbors:[4]})]));
    assert.equal(world.stats().pressureRetainingGalleries,0,'true disclosed reciprocal stair remains open');
    world.update(snapshot([cell(4),cell(7,{trap:true})],[{a:4,b:7,open:false}]));
    assert.equal(world.stats().pressureRetainingGalleries,0,'true disclosed locked gate remains distinct');
    world.update(snapshot([cell(4)]));
    assert.equal(world.stats().pressureRetainingGalleries,0,'unknown lower endpoint cannot be depicted');
    world.update(snapshot([cell(4),cell(7,{trap:true})]));
    assert.equal(world.stats().pressureRetainingGalleries,1);
    world.update({...snapshot([]),runToken:'next-run',visibleCells:[]});
    assert.equal(world.stats().pressureRetainingGalleries,0,'new run resets old revealed architecture');
    assert.ok(world.stats().geometryCount<100,'unchanged strict reset geometry ceiling');
  }finally{world.dispose();cleanup()}
});
