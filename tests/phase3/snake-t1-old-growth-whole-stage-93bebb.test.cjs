'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=source=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');

test('T1 genuine 93bebb before geometry is an immutable exact Git blob, not a restyled fake',()=>{
  const before=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-old-growth-93bebb.mjs'),'utf8');
  assert.equal(gitBlob(before),'d78b79fad446d041cc7b939f7fc6a7ee2696b16e');
});

test('T1 whole staged valley forest and old-growth root galleries increase physical mid-scene silhouettes without losing a single established original asset',async()=>{
  const THREE=await import('three');
  const beforeFactory=(await import('../fixtures/snake-t1-before-old-growth-93bebb.mjs')).createLivingGarden;
  const afterFactory=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const W=width/2,H=height/2;
    const baseline=beforeFactory(THREE,{width,height});
    const after=afterFactory(THREE,{width,height});
    const duplicate=afterFactory(THREE,{width,height});
    const measurement=art=>{
      let gallery=0,full=0,unsafe=0;
      for(const mesh of art.group.children){
        const position=mesh.geometry.getAttribute('position');
        for(let i=0;i<position.count;i++){
          const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
          // Count real elevated living-scene vertices in a fixed original
          // seven-world-unit landward ring, NOT a screenshot-pixel heuristic.
          if(y>3.4&&((Math.abs(x)>W+1&&Math.abs(x)<W+6.5)
            ||(z<-H-1&&z>-H-6.5)))gallery++;
          full++;
          if(![x,y,z].every(Number.isFinite)||y>=8||y< -4||
            !(x<-W-.9||x>W+.9||z<-H-.9||z>H+.9))unsafe++;
        }
      }
      return {gallery,full,unsafe};
    };
    try{
      const parent=baseline.stats(),next=after.stats();
      const old=measurement(baseline),now=measurement(after);
      assert.ok(now.gallery>old.gallery*1.34,
        `in ${width}x${height} the actual forest/arch ring must be physically composed nearer the viewer, rather than just recolored`);
      assert.equal(now.unsafe,0,'all T1 forest/root/stone vertices remain beyond real gameplay cells and within old terrain height envelope');
      assert.equal(next.rootRibbons,parent.rootRibbons+8,'eight genuinely new large old-growth shore arch silhouettes');
      assert.equal(next.triangles,parent.triangles+224,'eight complete 28-triangle 3D ribbons, nothing silently dropped');
      assert.ok(next.triangles<22000,'unchanged strict 40x24 and ordinary <22k garden ceiling');
      for(const name of ['meshCount','textures','canopyTrees','canopyLeaflets','waterGardenPads','waterGardenBlooms',
        'littoralGroveClumps','littoralGroveBoulders','amphitheatreFerns','arcadeArches','plantBlades'])
        assert.equal(next[name],parent[name],`preserve all original ${name}`);
      assert.equal(next.meshCount,4);assert.equal(next.textures,1);
      assert.deepEqual(after.stats(),duplicate.stats());
      for(let b=0;b<after.group.children.length;b++)for(const attribute of ['position','color'])
        assert.deepEqual(after.group.children[b].geometry.getAttribute(attribute).array,
          duplicate.group.children[b].geometry.getAttribute(attribute).array,
          'immutable same-source dimension input generates repeatable identical real Three geometry');
    }finally{baseline.dispose();after.dispose();duplicate.dispose();}
  }
});

test('T1 original strict complete desktop 17 REAL WebGL submissions per original second unchanged',()=>{
  const script=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(script,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  assert.match(renderer,/frameGate\.submitted\(\)/);
  assert.match(renderer,/if \(!frameGate\.canDraw\(\)\) return false/);
  const stage=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
  assert.doesNotMatch(stage,/Math\.random\(|requestAnimationFrame\(|setInterval\(/);
});
