'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=data=>crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');

test('T1 actual 7d1 forest and courtyard source are independently byte-locked',()=>{
  const garden=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-folded-canopy-7d1.mjs'));
  const courtyard=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-mineral-field-7d1.mjs'));
  assert.equal(gitBlob(garden),'b3bece718beba994dd7eb50e13b96675aafb34c4');
  assert.equal(gitBlob(courtyard),'8c25517a65f926578878f4b0770fd743296f8a1f');
});

test('T1 re-forms ALL ten actual 3D crowns without discarding any original leaf, resource, collision clearance or determinism',async()=>{
  const THREE=await import('three');
  const original=(await import('../fixtures/snake-t1-before-folded-canopy-7d1.mjs')).createLivingGarden;
  const current=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const before=original(THREE,{width,height}),after=current(THREE,{width,height});
    try{
      const a=before.stats(),b=after.stats(),W=width/2,H=height/2;
      assert.equal(b.meshCount,4);
      assert.equal(b.textures,1);
      assert.equal(b.triangles,a.triangles,'entire former full-scene budget retained');
      assert.ok(b.triangles<22000,'existing strict scene triangle ceiling retained');
      for(const key of ['plantBlades','canopyTrees','canopyLeaflets','rootRibbons',
        'arcadeArches','ruinBlocks','waterGardenPads','amphitheatreTriangles']){
        assert.equal(b[key],a[key],'retain '+key);
      }
      let significant=0,unsafe=0;
      for(let m=0;m<after.group.children.length;m++){
        const newer=after.group.children[m].geometry.getAttribute('position');
        const older=before.group.children[m].geometry.getAttribute('position');
        assert.equal(newer.count,older.count);
        for(let i=0;i<newer.count;i++){
          const x=newer.getX(i),y=newer.getY(i),z=newer.getZ(i);
          if(Math.hypot(x-older.getX(i),y-older.getY(i),z-older.getZ(i))>.20)significant++;
          if(![x,y,z].every(Number.isFinite) ||
            !(x<-W-.9||x>W+.9||z<-H-.9||z>H+.9) || y>7.99 || y< -4)unsafe++;
        }
      }
      assert.ok(significant>900,'whole canopy architecture must be genuinely resculpted: '+significant);
      assert.equal(unsafe,0,'visible static 3D garden remains outboard of all public cells');
      const repeat=current(THREE,{width,height});
      try{
        for(let i=0;i<after.group.children.length;i++)
          assert.deepEqual(after.group.children[i].geometry.getAttribute('position').array,
            repeat.group.children[i].geometry.getAttribute('position').array);
      }finally{repeat.dispose();}
    }finally{before.dispose();after.dispose();}
  }
});

test('T1 mineral field regrades ONLY original owned stone atlas, remains deterministic, preserves original geometry and no new GPU textures',async()=>{
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const former=(await import('../fixtures/snake-t1-before-mineral-field-7d1.mjs')).createCourtyardEcology;
  const current=(await import('../../public/snake-stream/courtyard-ecology.mjs')).createCourtyardEcology;
  const make=fn=>{
    const world=createWorld(THREE,{width:28,height:16});
    const ecology=fn(THREE,{width:28,height:16,world});
    let atlas=null;
    world.group.traverse(o=>{
      if(atlas||!o.isMesh)return;
      for(const m of Array.isArray(o.material)?o.material:[o.material]){
        const t=m?.map;
        if(t?.image?.width===1024&&t.image.height===512&&t.image.data instanceof Uint8Array){
          atlas=t;break;
        }
      }
    });
    return {world,ecology,atlas};
  };
  const old=make(former),now=make(current),repeat=make(current);
  try{
    assert.ok(old.atlas&&now.atlas&&repeat.atlas,'original owned atlas must exist');
    assert.equal(now.ecology.stats().triangles,old.ecology.stats().triangles);
    assert.equal(now.ecology.stats().meshCount,old.ecology.stats().meshCount);
    const oldData=old.atlas.image.data,newData=now.atlas.image.data,repeatData=repeat.atlas.image.data;
    assert.equal(newData.length,1024*512*4);
    let altered=0;
    for(let i=0;i<newData.length;i+=4){
      if(newData[i]!==oldData[i]||newData[i+1]!==oldData[i+1]||
        newData[i+2]!==oldData[i+2])altered++;
    }
    assert.ok(altered>6000,'meaningful original full-board material field must change: '+altered);
    assert.deepEqual(newData,repeatData,'owned original atlas reproducibly authored');
  }finally{
    for(const item of [old,now,repeat]){item.ecology.dispose();item.world.dispose();}
  }
});

test('Strict existing >=17 genuine full-desktop render submissions per original second remains mandatory',()=>{
  const browser=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  assert.match(browser,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  assert.match(renderer,/frameGate\.submitted\(\)/);
  assert.match(renderer,/if \(!frameGate\.canDraw\(\)\) return false/);
});
