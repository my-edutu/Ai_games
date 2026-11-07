'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripR52Canopy,reapplyR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {reapplyT1Floodplain}=require('../helpers/snake-t1-floodplain-archive.cjs');
const worldPath=path.resolve(__dirname,'../../public/snake-stream/world.mjs');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
function court(world){
  const mesh=world.group.children.find(obj=>obj.isMesh&&obj.material?.map?.image?.width===1024&&obj.material.map.image.height===512);
  assert.ok(mesh,'the physical court must own the original single RGBA atlas');
  return mesh;
}
test('R52 grove shadow is original, exact-parent, genuinely interior, legible and cue/geometry/resource-safe',async()=>{
  const source=fs.readFileSync(worldPath,'utf8'),oldSource=stripR52Canopy(source);
  assert.equal(blob(oldSource),'14d4190dc05801e9698c4b7de76365a1eb9e3910',
    'unmodified R51 Git world blob reproduced exactly');
  assert.equal(oldSource.includes('BEGIN R52 GROVE CANOPY SHADE'),false);
  assert.equal(reapplyR52Canopy(oldSource,source),source,'isolated R52 source block round-trips without touching earlier art');
  const THREE=await import('three');
  const oldWithCurrentFloor=reapplyT1Floodplain(oldSource,source);
  const {createWorld:previous}=await import('data:text/javascript;base64,'+Buffer.from(oldWithCurrentFloor).toString('base64'));
  const {createWorld:current}=await import('../../public/snake-stream/world.mjs');
  for(const [width,height] of [[28,16],[8,8],[40,24]]){
    const old=previous(THREE,{width,height}),fresh=current(THREE,{width,height});
    try{
      const a=court(old),b=court(fresh),oldPixels=a.material.map.image.data,pixels=b.material.map.image.data;
      let shaded=0,untouched=0,nonInteriorChanged=0,brightened=0;
      for(let y=0;y<512;y++)for(let x=0;x<1024;x++){
        const i=(y*1024+x)*4,gx=(x+.5)/1024*width,gz=(y+.5)/512*height;
        const border=Math.min(gx,gz,width-gx,height-gz);
        const changed=oldPixels[i]!==pixels[i]||oldPixels[i+1]!==pixels[i+1]||oldPixels[i+2]!==pixels[i+2];
        assert.equal(pixels[i+3],255,'no transparent counterfeit obstacle');
        if(changed){
          shaded++;
          if(border<=1.9)nonInteriorChanged++;
          if(pixels[i]>oldPixels[i]||pixels[i+1]>oldPixels[i+1]||pixels[i+2]>oldPixels[i+2])brightened++;
        }else untouched++;
      }
      assert.ok(shaded>800,'repeated natural shadows visibly break up flat center: '+shaded);
      assert.ok(untouched>shaded,'shadows cannot blanket the traversable garden');
      assert.equal(nonInteriorChanged,0,'outer game cues and collectible contrast stay intact');
      assert.equal(brightened,0,'plant canopy only softens direct sun, never mimics reward light');
      for(const key of ['position','normal','uv']){
        const p=a.geometry.attributes[key].array,q=b.geometry.attributes[key].array;
        assert.equal(Buffer.compare(Buffer.from(p.buffer,p.byteOffset,p.byteLength),
          Buffer.from(q.buffer,q.byteOffset,q.byteLength)),0,'same true 3D court '+key);
      }
      assert.deepEqual(fresh.stats(),old.stats(),'no geometry, material, texture or draw budget change');
      assert.deepEqual(fresh.cameraOccluders,old.cameraOccluders,'all original camera sightlines still valid');
      const snapshot={obstacles:[3],food:{cell:12},portals:[{entry:9,exit:width*height-3}],
        hazards:[{cell:5,active:true,phase:3}]},frozen=JSON.stringify(snapshot);
      for(const reducedMotion of [false,true]){
        old.update(snapshot,{time:4,reducedMotion});
        fresh.update(snapshot,{time:4,reducedMotion});
        assert.deepEqual(fresh.stats(),old.stats(),'live hazards/portals/cues still agree');
      }
      assert.equal(JSON.stringify(snapshot),frozen,'presentation cannot mutate public authority');
    }finally{old.dispose();fresh.dispose();}
  }
});
