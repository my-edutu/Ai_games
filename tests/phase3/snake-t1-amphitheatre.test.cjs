'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
function remove(s,a,b){const i=s.indexOf(a),j=s.indexOf(b);
 assert.ok(i>=0&&j>i&&s.indexOf(a,i+1)<0&&s.indexOf(b,j+1)<0,'unique exact-source landmark');
 return s.slice(0,i)+s.slice(j+b.length);}
const oldSource=remove(remove(src,'  // BEGIN T1 ESCARPMENT AMPHITHEATRE\n',
 '  // END T1 ESCARPMENT AMPHITHEATRE\n'),
 '      // BEGIN T1 AMPHITHEATRE STATS\n','      // END T1 AMPHITHEATRE STATS\n');
test('T1 integrated amphitheatre is RED against exact old garden and GREEN on authored real topology',async()=>{
 assert.equal(blob(oldSource),'05f09d6f4a114c426ad7d96fa6670f93295b93c4',
  'reconstruct EXACT immutable 1b73d621 production garden before');
 const old=(await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'))).createLivingGarden;
 const current=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 const THREE=await import('three');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const previous=old(THREE,{width,height});
  const after=current(THREE,{width,height});
  const repeat=current(THREE,{width,height});
  try{
   const before=previous.stats(),now=after.stats();
   assert.equal(before.terracedPromontories,undefined,'real previous source has no authored escarpments');
   assert.equal(before.canopyTrees,8);
   assert.equal(now.terracedPromontories,8,'two larger distinct headlands per physical shoreline, not repeating stone cones');
   assert.equal(now.amphitheatreFerns,8,'grounded botanical silhouettes integrated on all enlarged shoreland masses');
   assert.equal(now.amphitheatreRoots,4,'each bank joins stone and roots');
   assert.equal(now.foregroundCanopies,2,'two large new original multi-branch tree crowns');
   assert.equal(now.canopyTrees,10,'all trees accounted for without falsifying source counts');
   assert.ok(now.amphitheatreTriangles>=1900,'substantial real extra authored 3D geometry');
   assert.equal(now.triangles-before.triangles,now.amphitheatreTriangles);
   assert.ok(now.triangles<22000,'retain original strict whole-garden geometric quality budget');
   assert.equal(now.meshCount,4,'keep original four static garden material batches');
   assert.equal(now.textures,1,'reuse original one procedural texture');
   assert.deepEqual(now,repeat.stats(),'geometry is deterministic for public board dimensions');
   for(const mesh of after.group.children){
    assert.equal(mesh.castShadow,false,'no per-frame decorative shadow pass');
    const position=mesh.geometry.getAttribute('position'),color=mesh.geometry.getAttribute('color');
    for(let i=0;i<position.count;i++){
     const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
     assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
     assert.ok(Number.isFinite(color.getX(i))&&Number.isFinite(color.getY(i))&&Number.isFinite(color.getZ(i)));
     assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,
      'all new natural terrain leaves playable game cells, portals and hazards untouched');
     assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,
      'the entire outdoor silhouette remains inside bounded fog/camera clipping');
    }
   }
  }finally{previous.dispose();after.dispose();repeat.dispose();}
  assert.equal(after.stats().disposed,true,'all static resources released');
 }
});
