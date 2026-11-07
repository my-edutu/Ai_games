'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const blocks=[['IMPORT',''],['STATE','  '],['RENEWAL','      '],
  ['ATTACH','      '],['STATS','      '],['RELEASE','    ']];
function withoutEcology(source) {
  for(const [name,indent] of blocks){
    const begin=indent+'// BEGIN T1 COURTYARD ECOLOGY '+name+'\n';
    const end=indent+'// END T1 COURTYARD ECOLOGY '+name+'\n';
    const a=source.indexOf(begin),b=source.indexOf(end);
    assert.ok(a>=0&&b>a,'unique reversible renderer '+name);
    assert.equal(source.indexOf(begin,a+1),-1);
    source=source.slice(0,a)+source.slice(b+end.length);
  }
  return source;
}
test('RED historic current-head renderer lacks integrated ecological surface, GREEN current composition preserves exact source',()=>{
  const code=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const before=withoutEcology(code);
  assert.equal(gitBlob(before),'95802b5c5b558b7af5e28b01ec83bbaeb1c13944',
    'exact actual a939 predecessor, no invented or weakened baseline');
  assert.doesNotMatch(before,/createCourtyardEcology/);
  assert.match(code,/import \{ createCourtyardEcology \} from '\.\/courtyard-ecology\.mjs'/);
  assert.match(code,/world\.group\.add\(courtyardEcology\.group\)/);
  assert.match(code,/courtyardEcology\.dispose\(\)/);
  assert.match(code,/courtyardEcology:\s*courtyardEcology\?\.stats\?\.\(\)/);
});
test('T1 real continuous stage moss is deterministic 3D, visually distributed and below all unchanged public game cues',async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const a=createCourtyardEcology(THREE,{width,height});
    const b=createCourtyardEcology(THREE,{width,height});
    const world=createWorld(THREE,{width,height});
    const garden=createLivingGarden(THREE,{width,height});
    try{
      const stats=a.stats();
      assert.deepEqual(stats,b.stats(),'reproducible original material and geometry');
      assert.equal(stats.meshCount,1,'one static cached geometry, not per-cell live draws');
      assert.equal(stats.textures,0,'no added textures or foreign assets');
      assert.equal(stats.publicCellsMoved,0);
      assert.ok(stats.braidedSurfaceTriangles>100&&stats.islandSurfaceTriangles>12,
        'continuous cross-board planted catchments plus local weathered islands');
      assert.ok(stats.triangles>200&&stats.triangles<3100,'bounded physical geometry');
      const mesh=a.group.children[0],copy=b.group.children[0];
      assert.ok(mesh?.isMesh&&mesh.userData.staticWorld);
      assert.equal(mesh.castShadow,false);
      assert.equal(mesh.receiveShadow,true);
      assert.equal(mesh.material.vertexColors,true);
      assert.equal(mesh.material.map,null);
      const positions=mesh.geometry.getAttribute('position'),colors=mesh.geometry.getAttribute('color');
      assert.ok(positions&&colors);
      assert.equal(positions.count,colors.count);
      assert.equal(positions.count,stats.triangles*3);
      for(const name of ['position','color','normal'])
        assert.deepEqual(mesh.geometry.getAttribute(name).array,
          copy.geometry.getAttribute(name).array,'deterministic authored '+name);
      const sectors=new Set();
      let centre=0;
      const oldVertices=3*(stats.braidedSurfaceTriangles+stats.islandSurfaceTriangles+stats.reclaimedMosaicTriangles);
      for(let i=0;i<positions.count;i++){
        const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
        assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
        assert.ok(Math.abs(x)<=width/2-.67999&&Math.abs(z)<=height/2-.67999,
          'all decorative relief entirely inside playable scene and coping');
        if(i<oldVertices)assert.ok(y>=.011&&y<=.021,
          'retain every original low-relief triangle beneath contact shadow/body/cues');
        else assert.ok(y>=.011&&y<=.185,'new interstitial foliage bounded below playable occupancy clearance');
        const du=x/(width*.16),dv=z/(height*.20);
        assert.ok(du*du+dv*dv>=.9999,'central landmark remains visibly unobscured');
        if(x< -width*.20)sectors.add('west');
        if(x>width*.20)sectors.add('east');
        if(z< -height*.17)sectors.add('north');
        if(z>height*.17)sectors.add('south');
        for(const key of ['getX','getY','getZ'])
          assert.ok(Number.isFinite(colors[key](i)),'finite and opaque material');
      }
      assert.deepEqual([...sectors].sort(),['east','north','south','west'],
        'organic terrain must reshape the complete 3D courtyard rather than one tiny patch');
      assert.ok(stats.triangles>centre);
      assert.equal(world.stats().staticMeshes,13,'original quarry remains exact and unweakened');
      assert.equal(world.stats().textures,4);
      assert.equal(garden.stats().meshCount,4,'existing four dense shore/ruin/vegetation batches remain');
      assert.ok(garden.stats().triangles<22000,'original strict high-board garden triangle budget unchanged');
      const publicFrame=Object.freeze({
        obstacles:Object.freeze([3]),food:Object.freeze({cell:8}),
        hazards:Object.freeze([Object.freeze({cell:14,active:true})]),
        portals:Object.freeze([Object.freeze({entry:2,exit:width*height-2})])
      });
      const original=JSON.stringify(publicFrame);
      world.update(publicFrame,{time:2,reducedMotion:false});
      world.update(publicFrame,{time:3,reducedMotion:true});
      assert.equal(JSON.stringify(publicFrame),original,'immutable public snapshot');
    }finally{
      a.dispose();a.dispose();b.dispose();garden.dispose();world.dispose();
      assert.equal(a.group.children.length,0,'all scene resources disposed');
      assert.equal(a.stats().disposed,true);
      assert.equal(a.stats().meshCount,0);
    }
  }
});

// T1 whole-court exposure gate: the original b649 stacked material masks
// compressed the central courtyard into a nearly black basin. The new world
// must regrade the actual existing DataTexture once with no new GPU object.
test('T1 baked world stone restores lit mineral stage without changing original material/geometry/cues',async()=>{
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height}),copy=createWorld(THREE,{width,height});
    const locate=w=>{let found;w.group.traverse(o=>{const image=o.material?.map?.image;if(image?.width===1024&&image?.height===512)found=o.material.map;});assert.ok(found);return found;};
    const field=locate(world),duplicate=locate(copy),before=Uint8Array.from(field.image.data);
    const version=field.version,originalStats=world.stats();
    const a=createCourtyardEcology(THREE,{width,height,world});
    const b=createCourtyardEcology(THREE,{width,height,world:copy});
    try{
      assert.deepEqual(field.image.data,duplicate.image.data,'public board yields exact deterministic pigments');
      assert.equal(a.stats().stoneAtlas?.regraded,true,'no silent failure to find the true stone atlas');
      assert.equal(a.stats().stoneAtlas.pixels,524288);
      assert.equal(a.stats().stoneAtlas.textureAdded,0);
      assert.equal(field.version,version+1,'regrade is uploaded only once on world construction');
      assert.deepEqual(world.stats(),originalStats,'no asset material/mesh/texture count removed or added');
      const mean=d=>{let sum=0,n=0;for(let y=128;y<384;y+=4)for(let x=256;x<768;x+=4){const i=(y*1024+x)*4;sum+=d[i]*.3+d[i+1]*.55+d[i+2]*.15;n++;}return sum/n;};
      assert.ok(mean(field.image.data)>mean(before)+25,'warm heart has real exposure, not a black hole');
      assert.equal(a.stats().publicCellsMoved,0);
    }finally{a.dispose();b.dispose();world.dispose();copy.dispose();}
  }
});
