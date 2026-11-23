'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=bytes=>crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

test('T1 original 70d2 full-stage substrate remains independently identifiable',()=>{
  const before=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-coastal-gully-70d2.mjs'));
  assert.equal(gitBlob(before),'f8879548903e4c570a4dcd78639ae75320f27d39');
});

test('T1 four outboard shorelines acquire continuous incised river valleys AND hillside profiles without new game obstacles',async()=>{
  const THREE=await import('three');
  const before=(await import('../fixtures/snake-t1-before-coastal-gully-70d2.mjs')).createLivingGarden;
  const {createLivingGarden,shoreValleyRelief}=await import('../../public/snake-stream/living-garden.mjs');
  assert.equal(typeof shoreValleyRelief,'function','real original-shore terrain must expose its deterministic sculptural relief model');
  const shores=[
    {id:'sunlit-foreshore',axis:'x',start:-16.7,end:16.7,near:10.65,far:17.15},
    {id:'shaded-cove',axis:'x',start:-16.7,end:16.7,near:-13.25,far:-19.1},
    {id:'fern-west',axis:'z',start:-10.9,end:11.1,near:-16.75,far:-23.3},
    {id:'reeds-east',axis:'z',start:-10.9,end:11.1,near:16.75,far:23.3},
  ];
  for(const shore of shores){
    const mid=.52,inner=.20,outer=.94;
    const samples=Array.from({length:161},(_,i)=>shoreValleyRelief(shore,shore.start+(shore.end-shore.start)*i/160,mid));
    assert.ok(samples.every(Number.isFinite),'natural outboard relief remains finite');
    assert.ok(Math.max(...samples)-Math.min(...samples)>1.8,'river-cut channels must be physically legible across the real shore');
    assert.ok(Math.min(...samples)<-.45,'river mouth actually drains BELOW surrounding turf, not only darker pigment');
    assert.ok(Math.max(...samples)>1.1 || shore.id==='sunlit-foreshore','the rear and wing shores require truly tall sculptural hillside');
    for(const t of [shore.start,shore.start+(shore.end-shore.start)*.5,shore.end]){
      assert.ok(Math.abs(shoreValleyRelief(shore,t,inner)-shoreValleyRelief(shore,t,outer))<5.8);
    }
  }
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const old=before(THREE,{width,height});const now=createLivingGarden(THREE,{width,height});
    try{
      const a=old.stats(),b=now.stats(),W=width/2,H=height/2;
      assert.equal(b.triangles,a.triangles,'no geometry, materials or visual assets deleted to camouflage performance');
      assert.ok(b.triangles<22000,'unchanged strict full-stage native triangle ceiling');
      for(const key of ['meshCount','textures','canopyTrees','canopyLeaflets','rootRibbons','arcadeArches','plantBlades','waterGardenPads','amphitheatreFerns'])
        assert.equal(b[key],a[key],`all physically authored ${key} remain`);
      let displaced=0,unsafe=0,minY=Infinity,maxY=-Infinity;
      for(let i=0;i<now.group.children.length;i++){
        const prev=old.group.children[i].geometry.getAttribute('position');
        const next=now.group.children[i].geometry.getAttribute('position');
        assert.equal(next.count,prev.count);
        for(let v=0;v<next.count;v++){
          const x=next.getX(v),y=next.getY(v),z=next.getZ(v);
          if(Math.abs(y-prev.getY(v))>.15)displaced++;
          if(![x,y,z].every(Number.isFinite) ||
             !(x<-W-.9 || x>W+.9 || z<-H-.9 || z>H+.9) || y>7.99 || y< -4)unsafe++;
          minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        }
      }
      assert.ok(displaced>210,`landscape must change physically across a substantial real 3D stage: ${displaced}`);
      assert.equal(unsafe,0,'all authored real terrain stays offshore / out of playable cells and bounded');
      const repeat=createLivingGarden(THREE,{width,height});
      try{for(let i=0;i<now.group.children.length;i++)assert.deepEqual(
          now.group.children[i].geometry.getAttribute('position').array,
          repeat.group.children[i].geometry.getAttribute('position').array,
          'identical board and seed generate exact static topology');
      }finally{repeat.dispose();}
    }finally{old.dispose();now.dispose();}
  }
});

test('original complete one-second 17 genuine desktop render gate is unmodified',()=>{
  const browser=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  assert.match(browser,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  assert.match(renderer,/frameGate\.submitted\(\)/);
  assert.match(renderer,/if \(!frameGate\.canDraw\(\)\) return false/);
});
