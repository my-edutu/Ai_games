import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGlb,applyEmbeddedTextureColors } from '../web/gltf-assets.js';
import { CC0_MODELS,drawCc0Model } from '../web/cc0-models.js';

function fixtureGlb({badIndex=false}={}){
  const data={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],
    nodes:[{mesh:0,translation:[1,0,0]}],
    meshes:[{primitives:[{attributes:{POSITION:0},indices:1,material:0}]}],
    materials:[{pbrMetallicRoughness:{baseColorFactor:[.8,.4,.2,1]}}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:8}],
    accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'},
      {bufferView:1,componentType:5123,count:3,type:'SCALAR'}]};
  let json=JSON.stringify(data);
  json+=' '.repeat((4-json.length%4)%4);
  const encoded=new TextEncoder().encode(json);
  const bin=new Uint8Array(44);
  new Float32Array(bin.buffer,0,9).set([0,0,0,1,0,0,0,2,0]);
  new Uint16Array(bin.buffer,36,3).set([0,1,badIndex?99:2]);
  const bytes=new Uint8Array(12+8+encoded.length+8+bin.length),v=new DataView(bytes.buffer);
  v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);
  v.setUint32(12,encoded.length,true);v.setUint32(16,0x4e4f534a,true);bytes.set(encoded,20);
  v.setUint32(20+encoded.length,bin.length,true);v.setUint32(24+encoded.length,0x004e4942,true);
  bytes.set(bin,28+encoded.length);
  return bytes;
}

test('GLB intake handles embedded indexed mesh material, node translation and normals',()=>{
  const model=parseGlb(fixtureGlb());
  assert.equal(model.sourceTriangleCount,1);
  assert.deepEqual(model.bounds.min,[1,0,0]);
  assert.deepEqual(model.bounds.max,[2,2,0]);
  assert.deepEqual(model.triangles[0].color,[.8,.4,.2]);
  assert.equal(model.triangles[0].a[0],1);
  assert.ok(Math.abs(model.triangles[0].n[2]-1)<1e-6);
});

test('GLB payloads fail closed on invalid headers, broken indices and tiny triangle budgets',()=>{
  const original=fixtureGlb();
  const corrupted=Uint8Array.from(original);
  corrupted[0]=0;
  assert.throws(()=>parseGlb(corrupted),/header/);
  assert.throws(()=>parseGlb(fixtureGlb({badIndex:true})),/vertex reference/);
  assert.throws(()=>parseGlb(original,{maxTriangles:0}),/budget/);
  assert.throws(()=>parseGlb(original,{maxBytes:32}),/budget/);
});

test('pinned CC0 real asset URLs have stable provenance and no executable content',()=>{
  const list=Object.values(CC0_MODELS);
  assert.equal(list.length,3);
  for(const url of list){
    assert.match(url,/^https:\/\/raw\.githubusercontent\.com\/Ariescar\/gobkit-free-assets\/0d654ab3306515b1b63621a5c6548554034482dc\/minion\/[a-z0-9-]+\.glb$/);
  }
});

test('real imported mesh is transformable and drawn with a strict budget without changing gameplay',()=>{
  const model=parseGlb(fixtureGlb());
  const actor={x:11,y:-8,facing:.7,archetype:'brute',variant:1};
  const before=JSON.stringify(actor),tris=[];
  const mesh={tri(...t){tris.push(t);}};
  assert.equal(drawCc0Model(mesh,model,actor,1.3,{maxTriangles:1}),true);
  assert.equal(tris.length,1);
  for(const [a,b,c,n,color] of tris){
    for(const v of [...a,...b,...c,...n,...color])assert.ok(Number.isFinite(v));
    assert.ok(a[0]>6&&a[0]<16);
    assert.ok(a[2]>-12&&a[2]<-4);
  }
  assert.equal(JSON.stringify(actor),before);
});

test('embedded glTF UV atlas material colors can be hydrated independently of the game',async()=>{
  const previousBitmap=globalThis.createImageBitmap,previousCanvas=globalThis.OffscreenCanvas;
  const fakePixels=Uint8ClampedArray.from([110,210,165,255,250,10,40,255,70,115,200,255,40,15,180,255]);
  globalThis.createImageBitmap=async()=>({width:2,height:2,close(){}});
  globalThis.OffscreenCanvas=class{
    constructor(w,h){this.width=w;this.height=h;}
    getContext(){return {drawImage(){},getImageData:()=>({data:fakePixels})};}
  };
  try{
    const tri={uv:[.25,.25],imageId:0,color:[.8,.6,.4],a:[0,0,0],b:[1,0,0],c:[0,1,0],n:[0,0,1]};
    const data={triangles:[tri],embeddedImages:[{bytes:new ArrayBuffer(4),mimeType:'image/png'}]};
    const out=await applyEmbeddedTextureColors(data);
    assert.equal(out,data);
    assert.ok(out.triangles[0].color.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    assert.notDeepEqual(out.triangles[0].color,[.8,.6,.4],'actual sampled UV pixels must influence imported GLB materials');
    assert.deepEqual(out.triangles[0].color,[.8*70/255,.6*115/255,.4*200/255]);
  }finally{
    if(previousBitmap===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=previousBitmap;
    if(previousCanvas===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=previousCanvas;
  }
});
