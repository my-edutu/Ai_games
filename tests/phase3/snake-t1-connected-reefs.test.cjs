'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const begin='    // BEGIN T1 CONNECTED COASTAL RIDGES\n',end='    // END T1 CONNECTED COASTAL RIDGES\n';
const a=source.indexOf(begin),b=source.indexOf(end);

test('T1 connected coastal ridges are genuinely transformed from exact 43a5e04 source without changing gameplay clearance or material/garden budgets',async()=>{
  assert.ok(a>=0&&b>a&&source.indexOf(begin,a+1)<0&&source.indexOf(end,b+1)<0,'new original connected-ridge source is uniquely bounded');
  const predecessor=source.slice(0,a)+source.slice(b+end.length);
  assert.equal(blob(predecessor),'ab20ddc7db0eecbc0726d26beb3c12ea32649a93','parent garden must be exact immutable Git source');
  const original=(await import('data:text/javascript;base64,'+Buffer.from(predecessor).toString('base64'))).createLivingGarden;
  const current=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
  const THREE=await import('three');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const before=original(THREE,{width,height}),after=current(THREE,{width,height}),repeat=current(THREE,{width,height});
    try{
      assert.deepEqual(after.stats(),before.stats(),'do not raise actual geometry, material, texture or static mesh budgets');
      assert.deepEqual(after.stats(),repeat.stats());
      assert.ok(after.stats().triangles<22000,'strict original 40x24 geometry budget remains in place');
      assert.equal(after.stats().meshCount,4);
      assert.equal(after.stats().textures,1);
      let changed=0,longitudinal=0;
      const cells={left:0,right:0,top:0,bottom:0};
      for(let j=0;j<after.group.children.length;j++){
        const old=before.group.children[j].geometry.getAttribute('position');
        const now=after.group.children[j].geometry.getAttribute('position');
        assert.equal(now.count,old.count);
        for(let k=0;k<now.count;k++){
          const x=now.getX(k),y=now.getY(k),z=now.getZ(k),dx=x-old.getX(k),dy=y-old.getY(k),dz=z-old.getZ(k);
          assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
          assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,'never touch playable collision/portal/fruit/hazard cells');
          assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,'stay inside original geometry and camera safety bounds');
          if(Math.hypot(dx,dy,dz)>.10){
            changed++;
            if(Math.abs(dx)>1.1||Math.abs(dz)>1.1)longitudinal++;
            if(x<-width/2-1)cells.left++;
            if(x>width/2+1)cells.right++;
            if(z<-height/2-1)cells.top++;
            if(z>height/2+1)cells.bottom++;
          }
        }
      }
      assert.ok(changed>360,'change hundreds of actual landscape vertices, not only a decal');
      assert.ok(longitudinal>220,'long connected shoreline silhouettes instead of isolated round artificial cone stacks');
      for(const [side,count] of Object.entries(cells))assert.ok(count>20,'real full-four-coast relief '+side);
    }finally{before.dispose();after.dispose();repeat.dispose();}
  }
});
