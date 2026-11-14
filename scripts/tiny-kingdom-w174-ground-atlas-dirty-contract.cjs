'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new vm.Script(script,{filename:'tiny-kingdom-inline.js'}));
const start=script.indexOf('function planGroundAtlasDirtyRegions(');
assert.ok(start>=0,'W174 RED: ground atlas must calculate exact dirty regions before touching GPU');
const end=script.indexOf('\n}\n',start);
assert.ok(end>start);
const plan=vm.runInNewContext(script.slice(start,end+2)+'\nplanGroundAtlasDirtyRegions');
const size=64,tile=16,blank=new Uint8ClampedArray(size*size*4);
const copy=()=>new Uint8ClampedArray(blank);
const paint=(p,x,y)=>{const i=(y*size+x)*4;p[i]=42;p[i+1]=139;p[i+2]=27;p[i+3]=255;};
let old=copy(),now=copy();
let a=plan(old,now,size,tile,12);
assert.equal(a.full,false);assert.equal(a.rects.length,0);
paint(now,1,1);
a=plan(old,now,size,tile,12);
assert.equal(a.full,false);assert.equal(a.changedTiles,1);
assert.equal(a.rects.length,1);
assert.deepEqual([a.rects[0].x,a.rects[0].y,a.rects[0].width,a.rects[0].height],[0,0,16,16]);
const observed=()=>{const out=copy();for(const r of a.rects)
 for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
  const i=(y*size+x)*4;out.set(now.subarray(i,i+4),i);
 }return out;};
assert.deepEqual(observed(),now,'partial upload must reproduce full atlas pixel-for-pixel');
old=now;now=copy();paint(now,60,60);
a=plan(old,now,size,tile,12);
assert.equal(a.full,false);
assert.ok(a.rects.every(r=>r.width>0&&r.height>0&&r.x>=0&&r.y>=0));
const restored=copy();restored.set(old);
for(const r of a.rects)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
 const i=(y*size+x)*4;restored.set(now.subarray(i,i+4),i);
}
assert.deepEqual(restored,now,'restored or demolished homes must not leave texture ghosts');
const full=copy();full.fill(255);
a=plan(blank,full,size,tile,12);
assert.equal(a.full,true);assert.equal(a.rects.length,1);
assert.equal(a.rects[0].width,size);
a=plan(null,blank,size,tile,12);
assert.equal(a.full,true);
assert.match(script,/gl\.texSubImage2D\(gl\.TEXTURE_2D,0,/,'growth uses retained texture storage');
assert.match(script,/groundAtlasGpuPartialUploads/);
assert.match(script,/getGroundAtlasDirtyAudit/);
console.log('W174 PASS: pixel-exact sparse growth, demolition/restore and full-upload fallback; this is NOT measured FPS or visual acceptance.');
