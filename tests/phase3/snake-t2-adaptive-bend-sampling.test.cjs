'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').resolve(__dirname,'../../public/snake-stream/serpent.mjs'),'utf8');
const {restoreBendParent}=require('../fixtures/snake-t2-restore-bend-parent.cjs');
test('T2 exact-parent RED -> GREEN: true body curves spend unchanged original ring/triangle budget at public corners, never across portals',async()=>{
  const {createSerpent,distributeSerpentBendRings}=await import('../../public/snake-stream/serpent.mjs');
  const THREE=await import('three');
  const turns=[{x:0,z:0},{x:1,z:0},{x:2,z:0},{x:3,z:0},{x:3,z:1},{x:3,z:2},
    {x:3,z:3},{x:2,z:3},{x:1,z:3},{x:0,z:3},{x:0,z:4},{x:0,z:5},
    {x:0,z:6},{x:1,z:6},{x:2,z:6},{x:3,z:6}];
  const straight=Array.from({length:42},(_,i)=>({x:i,z:0}));
  for(const path of [turns,straight]){
    const rings=distributeSerpentBendRings(path);
    assert.equal(rings.reduce((n,v)=>n+v,0),3*(path.length-1));
    assert.ok(rings.every(n=>n>=2&&n<=6));
    assert.deepEqual(distributeSerpentBendRings(path),rings);
    assert.deepEqual(distributeSerpentBendRings(path,false),Array(path.length-1).fill(7));
  }
  const sampled=distributeSerpentBendRings(turns);
  assert.ok(Math.min(...[2,3,5,6,8,9,11,12].map(i=>sampled[i]))>
    Math.min(...[0,1,4,7,10,13,14].map(i=>sampled[i])));
  const {createSerpent:baseline}=await import('data:text/javascript;base64,'+Buffer.from(restoreBendParent(source)).toString('base64'));
  const previous=baseline(THREE),candidate=createSerpent(THREE);
  try{
    for(const detail of ['low','high']){
      const o={detail,reducedMotion:true,runToken:'same-seed',time:4,delta:1/60,direction:{x:1,z:0}};
      previous.update([turns],o);candidate.update([turns],o);
      for(const k of ['bodyRings','bodyVertices','bodyTriangles','geometries','materials','textures','bufferBytes','paths','maxBodyRings','truncated'])
        assert.equal(candidate.stats()[k],previous.stats()[k],'original full-quality resource budget: '+k);
      const positions=x=>x.group.getObjectByName('Continuous sculpted serpent body').geometry.getAttribute('position').array;
      const old=Array.from(positions(previous).slice(0,previous.stats().bodyVertices*3));
      const now=Array.from(positions(candidate).slice(0,candidate.stats().bodyVertices*3));
      if(detail==='low')assert.notDeepEqual(now,old,'actual full-body bent 3D vertices must change');
      else assert.deepEqual(now,old,'original high-detail serpent must remain byte-identical');
    }
    candidate.update([turns,[{x:8,z:4},{x:8,z:5},{x:8,z:6}]],{detail:'low',time:5,delta:1/60});
    assert.equal(candidate.stats().paths,2,'original portal breaks stay broken');
    assert.equal(candidate.stats().truncated,false);
  }finally{previous.dispose();candidate.dispose();}
});
