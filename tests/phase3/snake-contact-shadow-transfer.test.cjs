'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test}=require('node:test');
const {restorePreR46}=require('../helpers/snake-r46-cache-archive.cjs');
const {stripR49Contact}=require('../helpers/snake-r49-contact-archive.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const sourcePath=path.resolve(__dirname,'../../public/snake-stream/renderer.mjs');
const blob = historicalRendererGitBlob;
const oldLoop=[
  '    contacts.count = 0;',
  '    for (const path of motion.paths) for (const point of path) {',
  '      if (contacts.count === 2048) break;',
  '      contactTransform.position.set(point.x + 0.07, 0.022, point.z + 0.08);',
  '      contactTransform.updateMatrix();',
  '      contacts.setMatrixAt(contacts.count++, contactTransform.matrix);',
  '    }',
  '    contacts.instanceMatrix.needsUpdate = true;',
  ''
].join('\n');

function stripLaterR43(source){
  let content=source;
  for(const name of ['WATER SAMPLING HELPER','WATER SAMPLING ADAPT','WATER SAMPLING INIT','WATER SAMPLING STATS']){
    const begin='// BEGIN R43 '+name+'\n',end='// END R43 '+name+'\n';
    const a=content.indexOf(begin),b=content.indexOf(end);
    if(a<0||b<a||content.indexOf(begin,a+1)>=0)throw new Error('invalid reversible later R43 '+name);
    const lineStart=content.lastIndexOf('\n',a-1)+1;
    content=content.slice(0,lineStart)+content.slice(b+end.length);
  }
  return content;
}

function predecessor(source){
  let content=source;
  for(const name of ['CONTACT HELPER','CONTACT COUNTERS','CONTACT STATS']){
    const rule=new RegExp('^.*// BEGIN R38 '+name+'\\n[\\s\\S]*?^.*// END R38 '+name+'\\n','gm');
    assert.equal((content.match(rule)||[]).length,1,'exact one reversible '+name+' block');
    content=content.replace(rule,'');
  }
  const call=/^.*\/\/ BEGIN R38 CONTACT SUBRANGE\n[\s\S]*?^.*\/\/ END R38 CONTACT SUBRANGE\n/gm;
  assert.equal((content.match(call)||[]).length,1);
  content=content.replace(call,oldLoop);
  assert.equal(blob(restorePreR46(stripLaterR43(content))),'14d5f7dc3e344e9850ac325b768928eba9546c60','exact R38 Git blob before later R46 composition');
  return content;
}
test('Round38 actual Three.js contact matrices match the exact predecessor while uploads stay within the used prefix',async()=>{
  const THREE=await import('three');
  // R38 historical comparison intentionally excludes later R49 no-op gating.
  const source=stripR49Contact(fs.readFileSync(sourcePath,'utf8'));
  const prior=predecessor(source);
  assert.equal(prior.includes('export function syncContactShadowInstances'),false,'prior has no optimized contact helper');
  const context=vm.createContext({});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/^export (?=function )/gm,'')+'\nthis.sync = syncContactShadowInstances;',context);
  assert.equal(typeof context.sync,'function');
  const legacy=Function('contacts','contactTransform','motion',oldLoop);
  const make=()=>new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial(),2048);
  const old=make(),current=make();
  const a=new THREE.Object3D(),b=new THREE.Object3D();
  a.rotation.x=b.rotation.x=-Math.PI/2;
  const fixtures=[
    [[{x:1,z:2},{x:1.5,z:2.5}],[{x:-4,z:7}]],
    [[{x:1.25,z:2.1}],[],[{x:-9,z:-2},{x:-8,z:-2}]],
    [],
    [[{x:0,z:0}]],
    [Array.from({length:2100},(_,i)=>Object.freeze({x:i/7,z:i/17})),[{x:999,z:999}]],
    [[{x:0,z:0},{x:0.25,z:1.25}],[{x:4,z:8}]],
  ].map(paths=>Object.freeze(paths.map(p=>Object.freeze(p.map(Object.freeze)))));
  const frozen=JSON.stringify(fixtures);
  try{
    const capacityBytes=current.instanceMatrix.array.byteLength;
    assert.equal(capacityBytes,2048*16*4,'full long-snake capacity still allocated once');
    for(const [i,paths] of fixtures.entries()){
      const version=current.instanceMatrix.version;
      old.instanceMatrix.clearUpdateRanges(); current.instanceMatrix.clearUpdateRanges();
      legacy(old,a,{paths});
      const requested=context.sync(current,b,paths);
      assert.equal(current.count,old.count,'identical visible instances, case '+i);
      const bytes=current.count*16*4;
      assert.equal(requested,bytes,'only visible prefix requested, case '+i);
      assert.equal(Buffer.compare(Buffer.from(old.instanceMatrix.array.buffer,0,bytes),
        Buffer.from(current.instanceMatrix.array.buffer,0,bytes)),0,'exact copied matrix transforms and portal separation, case '+i);
      if(bytes){
        assert.equal(current.instanceMatrix.version,version+1,'one bounded buffer update per visible motion frame');
        assert.equal(current.instanceMatrix.updateRanges.length,1);
        assert.equal(current.instanceMatrix.updateRanges[0].start,0);
        assert.equal(current.instanceMatrix.updateRanges[0].count,current.count*16);
        assert.equal(old.instanceMatrix.updateRanges.length,0,'old implementation requests full-buffer update');
      }else{
        assert.equal(current.instanceMatrix.version,version,'empty public path does not upload');
        assert.equal(current.instanceMatrix.updateRanges.length,0);
      }
      assert.ok(requested<=capacityBytes,'bounded even at max capacity');
    }
    assert.equal(current.count,3);
    assert.equal(current.instanceMatrix.array.byteLength,capacityBytes,'unchanged GPU allocation cap');
    assert.equal(JSON.stringify(fixtures),frozen,'immutable public motion fixtures unchanged');
    assert.ok(3*16*4<capacityBytes/100,'typical 3-cell animation requests under 1% of existing buffer');
  }finally{
    for(const mesh of [old,current]){mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();}
  }
});
