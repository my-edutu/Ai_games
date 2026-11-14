'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Real installed Three.js world: a visible trap beyond a sealed gate must NOT
// close its physical jaws just because Pip stands within 2.4 world units.
async function load() {
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-real-pressure-contact-'));
  try {
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const name of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',name),path.join(tmp,name));
    for(const name of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',name),path.join(tmp,'vendor',name));
    const THREE=await import(pathToFileURL(path.join(tmp,'vendor/three.module.js')).href);
    const source=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    return {THREE,source,world:source.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  }catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e}
}
const cell=(cell,more={})=>({cell,neighbors:[],blocked:false,trap:false,
  checkpoint:false,clue:false,...more});
const state=(token,from,trap,doors=[])=>({
  runToken:token,tick:1,width:3,height:3,currentCell:from,
  cells:from===trap.cell?[trap]:[trap,cell(from,{neighbors:[trap.cell]})],
  visibleCells:from===trap.cell?[trap.cell]:[trap.cell,from],
  keys:[],doors,inventory:[],threats:[],exitCell:null,result:null
});
test('only publicly connected pressure approach can actuate physical floor and two jaws',async()=>{
  const {THREE,source,world,cleanup}=await load();
  try {
    const trap=cell(4,{trap:true,neighbors:[5]});
    const scenarios=[
      {name:'sealed portcullis',from:5,trap,doors:[{a:4,b:5,open:false}],active:false},
      {name:'nonreciprocal known edge',from:5,trap:cell(4,{trap:true}),active:false},
      {name:'fully disclosed open corridor',from:5,trap,doors:[{a:4,b:5,open:true}],active:true},
      {name:'genuine published trap-cell contact',from:4,trap,active:true},
      {name:'reciprocal but raised terrace',from:1,
        trap:cell(4,{trap:true,neighbors:[1]}),active:false}
    ];
    let budget=null;
    for(let i=0;i<scenarios.length;i++){
      const x=scenarios[i];
      const s=state('pressure-contact-'+i,x.from,x.trap,x.doors||[]);
      const original=JSON.stringify(s);
      world.update(s);
      const pos=source.cellPosition(x.from,3,3);
      const pip=new THREE.Vector3(pos.x,0,pos.z);
      const shutter=world.group.getObjectByName('Published tide-shear floor shutter 1');
      const jaws=[-1,1].map(side=>world.group.getObjectByName(
        'Disclosed tide-shear hinged jaw 4 '+side));
      assert.ok(shutter?.isGroup && jaws.every(j=>j?.isGroup),x.name+': real public Three objects');
      world.animate(i*10,{explorerPosition:pip,reducedMotion:false});
      world.animate(i*10+.9,{explorerPosition:pip,reducedMotion:false});
      if(x.active){
        assert.ok(Math.abs(shutter.rotation.z)>.25,
          x.name+': real pressure stroke must actuate an authentic floor shutter');
        assert.ok(jaws.every(j=>Math.abs(j.rotation.z)>.30),
          x.name+': both genuine jaws must follow their connected clock');
      }else{
        assert.ok(Math.abs(Math.abs(shutter.rotation.z)-.03)<1e-9,
          x.name+': visual plate must remain closed');
        assert.ok(jaws.every(j=>Math.abs(j.rotation.z)<=.201),
          x.name+': no false cutting contact through a wall or elevation');
      }
      const stats=world.stats();
      if(!budget) budget={geometryCount:stats.geometryCount,materialCount:stats.materialCount,
        textureCount:stats.textureCount};
      assert.ok(stats.geometryCount<100,'retain unchanged strict six-run geometry ceiling');
      assert.equal(JSON.stringify(s),original,'public snapshot and AI authority are immutable');
    }
    world.update({...state('privacy-reset',4,trap),cells:[],visibleCells:[]});
    assert.equal(world.group.getObjectByName('Published tide-shear floor shutter 1'),undefined);
  }finally{world.dispose();cleanup()}
});
