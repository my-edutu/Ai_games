'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripT1Floodplain,reapplyT1Floodplain}=require('../helpers/snake-t1-floodplain-archive.cjs');
const sourcePath=path.resolve(__dirname,'../../public/snake-stream/world.mjs');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const court=w=>{
  const mesh=w.group.children.find(o=>o.isMesh && o.material?.map?.image?.width===1024 && o.material.map.image.height===512);
  assert.ok(mesh,'real merged physical tile court uses the existing original 1024x512 atlas');
  return mesh;
};

test('T1 authentic court replacement remains the exact real predecessor and survives all public cell evidence',async()=>{
  const source=fs.readFileSync(sourcePath,'utf8');
  const previous=stripT1Floodplain(source);
  assert.equal(blob(previous),'fc01f7a55177456ee1cdbfae348a053c932064c6',
    'before is exact verified GitHub daff8c7 world blob, not a synthetic lookalike');
  assert.equal(reapplyT1Floodplain(previous,source),source,'source recovery is perfectly reversible');
  const THREE=await import('three');
  const before=(await import('data:text/javascript;base64,'+Buffer.from(previous).toString('base64'))).createWorld;
  const after=(await import('../../public/snake-stream/world.mjs')).createWorld;
  for(const [width,height] of [[28,16],[8,8],[40,24]]){
    const a=before(THREE,{width,height}),b=after(THREE,{width,height});
    try{
      const oldCourt=court(a),newCourt=court(b);
      const op=oldCourt.material.map.image.data,p=newCourt.material.map.image.data;
      let darkened=0,baseInterior=0,improvedMean=0,oldMean=0,warm=0,cool=0,brightened=0;
      for(let y=0;y<512;y++)for(let x=0;x<1024;x++){
        const i=(y*1024+x)*4,gx=(x+.5)/1024*width,gz=(y+.5)/512*height;
        const border=Math.min(gx,gz,width-gx,height-gz);
        assert.equal(p[i+3],255,'the physical floor remains opaque, not a false transparent gameplay cell');
        if(border>1.6){
          baseInterior++;
          for(let k=0;k<3;k++){
            assert.ok(p[i+k]>=0&&p[i+k]<=255,'finite Uint8 mineral color');
            if(p[i+k]>op[i+k])brightened++;
          }
          const o=(op[i]+op[i+1]+op[i+2])/3,n=(p[i]+p[i+1]+p[i+2])/3;
          oldMean+=o;improvedMean+=n;
          if(o-n>10)darkened++;
          if(p[i+1]>p[i]+10)cool++;
          if(p[i]>p[i+2]+7)warm++;
        }
      }
      if(width===28){
        assert.ok(darkened/baseInterior>.52,'the whole inner courtyard, not a corner pixel, must read differently');
        assert.ok((oldMean-improvedMean)/baseInterior>=24,'large-frame pale limestone dominance materially replaced by deep worn mineral tone');
        assert.ok(cool>baseInterior*.26 && warm>baseInterior*.14,'distinct living moss and warm quarry strata, not a flat monochrome filter');
      }
      assert.equal(brightened,0,'hero/fruit/hazard contrast protected by only darkening pigment');
      for(const key of ['position','normal','uv']){
        const v=oldCourt.geometry.attributes[key].array,u=newCourt.geometry.attributes[key].array;
        assert.equal(Buffer.compare(Buffer.from(v.buffer,v.byteOffset,v.byteLength),Buffer.from(u.buffer,u.byteOffset,u.byteLength)),0,
          'physical tile geometry and original exact gameplay coordinates stay intact: '+key);
      }
      assert.deepEqual(a.stats(),b.stats(),'no extra meshes, textures, passes or resource budget');
      assert.deepEqual(a.cameraOccluders,b.cameraOccluders,'no new phantom camera blocker');
      const publicSnapshot=Object.freeze({food:Object.freeze({cell:2}),portals:Object.freeze([{entry:4,exit:width*height-5}]),hazards:Object.freeze([{cell:8,active:true}]),obstacles:Object.freeze([12])});
      const original=JSON.stringify(publicSnapshot);
      for(const reducedMotion of [false,true]){
        a.update(publicSnapshot,{time:3,reducedMotion});b.update(publicSnapshot,{time:3,reducedMotion});
        assert.deepEqual(a.stats(),b.stats(),'original fruit, portal and hazard runtime cue budget identical');
      }
      assert.equal(JSON.stringify(publicSnapshot),original,'no presentation write into authoritative snapshot');
    }finally{a.dispose();b.dispose();}
  }
});
