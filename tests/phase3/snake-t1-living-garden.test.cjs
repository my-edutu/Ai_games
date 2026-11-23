'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripT1LivingGarden}=require('../helpers/snake-t1-living-archive.cjs');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 red/green: current renderer contains the new original scene, exact predecessor did not',()=>{
  const source=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const original=stripT1LivingGarden(source);
  assert.equal(gitBlob(original),'ae42da49444ae250d98e1e0181e3b2c2ae195dfa',
    'unchanged November 1 T0 renderer restored byte-for-byte');
  assert.ok(!original.includes("createLivingGarden("),
    'original exact-head NEGATIVE CONTROL has no living shoreline');
  assert.match(source,/livingGarden = createLivingGarden\(THREE, \{ width: snapshot\.width, height: snapshot\.height \}\)/);
  assert.match(source,/world\.group\.add\(livingGarden\.group\)/,
    'production whole-game real WebGL renderer must compose and cache the original scene');
  assert.match(source,/livingGarden\.dispose\(\)/,
    'board reconfiguration and context disposal clean up all garden resources');
});

test('T1 cohesive four-sector shoreline, ruins and vegetation are 3D, bounded, original, deterministic and game-cell clear',async()=>{
  const THREE=await import('three');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const first=createLivingGarden(THREE,{width,height});
    const repeated=createLivingGarden(THREE,{width,height});
    const world=createWorld(THREE,{width,height});
    try{
      const stats=first.stats();
      assert.equal(stats.shoreSections,4);
      assert.equal(stats.meshCount,4,'all leaves, masonry, ground and cliff are four static material batches');
      assert.equal(stats.textures,1,'exactly one original shared weathering map');
      assert.ok(stats.triangles>1500&&stats.triangles<26000,'real nontrivial scene topology but bounded workload: '+stats.triangles);
      assert.ok(stats.plantBlades>150,'multiple dense green silhouettes around all shore sectors');
      assert.ok(stats.ruinBlocks>45,'genuine 3D eroded ruins, not a flat painted backdrop');
      assert.ok(stats.waterlineSegments>45,'the old hard rectangle gains a weighted contoured bank');
      assert.deepEqual(stats,repeated.stats());
      assert.equal(world.stats().staticMeshes,13,'historical playable court batches unchanged');
      assert.equal(world.stats().textures,4,'historical world texture allocations unchanged');
      const sectors=new Set(),colors=new Set();
      for(let k=0;k<first.group.children.length;k++){
        const mesh=first.group.children[k],other=repeated.group.children[k];
        assert.ok(mesh.isMesh&&mesh.userData.staticWorld,'garden shares the original frozen-scene cache');
        assert.equal(mesh.castShadow,false,'no extra expensive decorative shadow-map redraw');
        assert.equal(mesh.receiveShadow,true);
        assert.equal(mesh.geometry.index,null,'authored surface remains a real triangle mesh');
        for(const attribute of ['position','normal','uv','color']){
          const a=mesh.geometry.getAttribute(attribute),b=other.geometry.getAttribute(attribute);
          assert.ok(a&&b);
          assert.deepEqual(a.array,b.array,'same public dimensions yield bit-identical '+attribute);
        }
        const p=mesh.geometry.getAttribute('position'),c=mesh.geometry.getAttribute('color');
        for(let i=0;i<p.count;i++){
          const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
          assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z),'finite 3D material');
          assert.ok(Number.isFinite(c.getX(i))&&Number.isFinite(c.getY(i))&&Number.isFinite(c.getZ(i)),
            'every living-garden triangle vertex must have a finite RGB tint: '+width+'×'+height+' vertex '+i);
          assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,
            'new scenic geometry never occupies the actual gameplay board or its near coping');
          assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,
            'bounded close-camera/fog geometry envelope');
          if(x<-width/2-3)sectors.add('west');
          if(x>width/2+3)sectors.add('east');
          if(z<-height/2-6)sectors.add('north');
          if(z>height/2+4)sectors.add('south');
          if(i%23===0)colors.add([c.getX(i).toFixed(2),c.getY(i).toFixed(2),c.getZ(i).toFixed(2)].join(','));
        }
      }
      assert.deepEqual([...sectors].sort(),['east','north','south','west']);
      assert.ok(colors.size>=8,'art-directed plant/soil/stone value families vary in the actual 3D meshes');
      const frozen=JSON.stringify({food:{cell:12},portals:[{entry:3,exit:width*height-2}],hazards:[{cell:5,active:true}]});
      assert.equal(JSON.stringify({food:{cell:12},portals:[{entry:3,exit:width*height-2}],hazards:[{cell:5,active:true}]}),frozen);
    }finally{first.dispose();repeated.dispose();world.dispose();}
    assert.equal(first.stats().disposed,true);
    assert.equal(repeated.stats().disposed,true);
    assert.equal(first.group.children.length,0);
  }
});
