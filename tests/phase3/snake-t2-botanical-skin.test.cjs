'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');

/** The gold markings must read as individual organic dorsal leaves, not bars. */
test('T2 provisional botanical serpent: jade owns the living back; gilded leaf islands remain directional and the belly stays cream',async()=>{
  const THREE=await import('three');
  const {createSerpent}=await import('../../public/snake-stream/serpent.mjs');
  const serpent=createSerpent(THREE);
  try{
    const body=serpent.group.getObjectByName('Continuous sculpted serpent body');
    const head=serpent.group.getObjectByName('Continuous tapered skull and neck');
    assert.ok(body&&head);
    const data=body.material.map.image.data,width=1024,height=512;
    let gold=0,jade=0,count=0;
    for(let y=Math.floor(height*.09);y<height*.46;y+=4)for(let x=0;x<width;x+=4){
      const i=(y*width+x)*4,r=data[i],g=data[i+1];
      gold+=r>180&&r>g+13;jade+=g>r+8;count++;
      assert.equal(data[i+3],255);
    }
    assert.ok(gold/count>.065,'the two recognizable genuine gold dorsal motifs have not vanished: '+gold/count);
    assert.ok(gold/count<.16,'no high-contrast candy stripes dominating the living jade back: '+gold/count);
    assert.ok(jade/count>.77,'majority of back and both shoulders remain jade scales: '+jade/count);
    const at=(u,v)=>{const i=(Math.floor(v*height)*width+Math.floor(u*width))*4;return [...data.subarray(i,i+4)];};
    for(const u of [.25,.75]){
      const crown=at(u,.25),flank=at(u,0),belly=at(u,.75),gap=at((u+.2)%1,.25);
      assert.ok(crown[0]>175&&crown[1]>145,'organic sunlight motif still identifiable at the spine');
      assert.ok(flank[1]>flank[0]&&crown[0]>flank[0]+65,'sun gold never wraps the flanks');
      assert.ok(gap[1]>gap[0]+12,'between leaf-motifs the animal returns to continuous jade');
      assert.ok(belly[0]>215&&belly[1]>190,'warm ventral scutes remain cream');
    }
    const before=serpent.stats(),old=Buffer.from(data),skull=Buffer.from(head.material.map.image.data);
    for(const detail of ['high','low'])serpent.update([[{x:0,z:0},{x:1,z:0},{x:1,z:1},{x:2,z:1}]],{
      time:3,delta:1/60,detail,reducedMotion:false,direction:{x:1,z:0},runToken:'skin-audit',danger:.5,eating:.5,
    });
    assert.deepEqual(Buffer.from(data),old,'live articulation cannot repaint established skin');
    assert.deepEqual(Buffer.from(head.material.map.image.data),skull,'head detail cannot repaint skin');
    for(const key of ['textures','materials','geometries','bufferBytes'])assert.equal(serpent.stats()[key],before[key],'no growing GPU skin resources '+key);
  }finally{serpent.dispose();}
});
