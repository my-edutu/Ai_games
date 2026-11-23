/**
 * Exact full-scene native Three.js static-buffer comparison for Autonomous Snake.
 * Usage:
 *   node scripts/compare-snake-complete-world-attributes.mjs \
 *     /absolute/prior-integrated/public/snake-stream/world.mjs \
 *     /absolute/candidate/public/snake-stream/world.mjs
 *
 * Both paths must be from audited source trees with their dependent modules
 * present. The baseline must be the immediately preceding cumulative T1/T2/T4
 * scene, not an older uncomparable PR. No Chromium/display frame claim is made.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';

const [parentPath,candidatePath] = process.argv.slice(2);
if(!parentPath||!candidatePath)throw new Error('Provide explicit baseline and candidate world.mjs paths');
const parent=await import(pathToFileURL(resolve(parentPath)).href);
const candidate=await import(pathToFileURL(resolve(candidatePath)).href);
const digest=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const samples=[];
for(const [width,height] of [[8,8],[28,16],[40,24]]){
 const older=parent.createWorld(THREE,{width,height});
 const newer=candidate.createWorld(THREE,{width,height});
 try{
  const a=older.group.children.filter(m=>m.isMesh&&m.userData.staticWorld);
  const b=newer.group.children.filter(m=>m.isMesh&&m.userData.staticWorld);
  assert.equal(a.length,b.length,'original static PBR scene mesh count must remain');
  assert.equal(older.stats().drawObjects,newer.stats().drawObjects);
  assert.equal(older.stats().textures,newer.stats().textures);
  assert.equal(older.stats().materials,newer.stats().materials);
  let nError=0,tError=0,bytesBefore=0,bytesAfter=0,indices=0;
  for(let k=0;k<a.length;k++){
   const original=a[k].geometry,optimized=b[k].geometry;
   for(const attribute of ['position','uv'])
     assert.equal(digest(original.getAttribute(attribute).array),
       digest(optimized.getAttribute(attribute).array),
       `${attribute} was not preserved in complete batch ${k}`);
   assert.equal(digest(original.index.array),digest(optimized.index.array),
     `complete triangle indices changed in batch ${k}`);
   indices+=original.index.count;
   assert.equal(a[k].castShadow,b[k].castShadow);
   assert.equal(a[k].receiveShadow,b[k].receiveShadow);
   assert.equal(a[k].userData.visibilityBlocks.length,b[k].userData.visibilityBlocks.length);
   for(const attribute of ['normal','color']){
    const oa=original.getAttribute(attribute),ob=optimized.getAttribute(attribute);
    if(!oa){assert.equal(ob,undefined);continue;}
    assert.equal(oa.count,ob.count);
    assert.equal(oa.itemSize,ob.itemSize);
    bytesBefore+=oa.array.byteLength;bytesAfter+=ob.array.byteLength;
    for(let i=0;i<oa.count;i++)for(let ch=0;ch<oa.itemSize;ch++){
     const delta=Math.abs(oa.getComponent(i,ch)-ob.getComponent(i,ch));
     if(attribute==='normal')nError=Math.max(nError,delta);
     else tError=Math.max(tError,delta);
    }
   }
  }
  assert.ok(bytesAfter<bytesBefore*.56,'missing substantial storage reduction');
  assert.ok(nError<=1/32767+1e-6,'normal reconstruction exceeds precision contract');
  assert.ok(tError<=.5/255+1e-6,'color reconstruction exceeds precision contract');
  samples.push({board:`${width}x${height}`,staticMeshes:b.length,
    drawObjects:newer.stats().drawObjects,textures:newer.stats().textures,
    triangles:indices/3,exactPositionUvIndex:true,
    originalShaderAttributeBytes:bytesBefore,packedShaderAttributeBytes:bytesAfter,
    savedBytes:bytesBefore-bytesAfter,
    savedPercent:Math.round(1e4*(bytesBefore-bytesAfter)/bytesBefore)/100,
    maxNormalError:nError,maxTintError:tError});
 }finally{older.dispose();newer.dispose();}
}
console.log(JSON.stringify({sourceInput:'EXPLICIT SOURCE FILES; NO WEBGL/FPS CLAIM',samples},null,2));
