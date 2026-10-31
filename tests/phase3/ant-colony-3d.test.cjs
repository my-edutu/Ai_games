'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const file=require('node:path').resolve(__dirname,'../../public/ai-ant-colony/colony-3d-core.js');
const C=fs.existsSync(file)?require(file):{};
const fixture=require('../fixtures/ant-3d-fixture.cjs');
function has(name){assert.equal(typeof C[name],'function',`${name} must be implemented`);}
function freeze(x){if(x&&typeof x==='object'){Object.freeze(x);for(const y of Object.values(x))freeze(y);}return x;}
test('validates a supported public snapshot',()=>{has('validateSnapshot');assert.equal(C.validateSnapshot(fixture()),true);});
test('rejects malformed, nonfinite and oversized public frames',()=>{has('validateSnapshot');for(const change of [s=>s.world.width=NaN,s=>s.world.width=1000000,s=>s.world.tiles.pop(),s=>s.ants[0].x=Infinity,s=>s.ants[0].x=-1,s=>s.ants.push({...s.ants[0]}),s=>s.queen.maxHealth=0,s=>s.environment=null,s=>s.revision=-1,s=>s.runToken='',s=>s.predators[0].kind='unknown']){const s=fixture();change(s);assert.equal(C.validateSnapshot(s),false);}});
test('rejects old revisions and old runs while accepting restart',()=>{has('FrameStore');const f=new C.FrameStore(),s=fixture();assert.equal(f.accept(s,0),'accepted');assert.equal(f.accept(s,50),'duplicate');assert.equal(f.accept({...s,revision:0},60),'stale');const next={...s,runToken:'next-run',runIndex:1,revision:1000000000001,tick:0};assert.equal(f.accept(next,100),'accepted');assert.equal(f.accept(s,110),'stale');assert.equal(f.previous,null);});
test('interpolates only adjacent verified motion without extrapolation',()=>{has('FrameStore');const f=new C.FrameStore(),s=fixture();f.accept(s,0);const t=structuredClone(s);t.revision++;t.ants[0].x++;f.accept(t,100);assert.equal(f.entities(150)[0].x,s.ants[0].x+.5);assert.equal(f.entities(9999)[0].x,t.ants[0].x);});
test('snaps teleports instead of animating invented paths',()=>{has('FrameStore');const f=new C.FrameStore(),s=fixture();f.accept(s,0);const t=structuredClone(s);t.revision++;t.ants[0].x+=5;f.accept(t,100);assert.equal(f.entities(120)[0].x,t.ants[0].x);assert.equal(f.entities(120)[0].moving,false);});
test('duplicate frames do not rewind interpolation or keep idle ants walking',()=>{has('FrameStore');const f=new C.FrameStore(),s=fixture();f.accept(s,0);const t=structuredClone(s);t.revision++;t.ants[0].x++;f.accept(t,100);f.accept(t,160);assert.equal(f.entities(200)[0].x,t.ants[0].x);assert.equal(f.entities(200)[0].moving,false);});
test('input remains immutable and history is bounded across runs',()=>{has('FrameStore');const f=new C.FrameStore(),s=freeze(fixture()),before=JSON.stringify(s);for(let i=0;i<30;i++)f.accept({...s,runToken:`run-${i}`,runIndex:i,revision:i*1e12+1},i*150);f.entities(5000);assert.equal(JSON.stringify(s),before);assert.ok(f.retired.size<=16);});
test('rigs have anatomical legs and distinct caste proportions',()=>{has('rig');const worker=C.rig('worker');assert.equal(worker.legs,6);assert.equal(C.rig('spider').legs,8);assert.equal(C.rig('beetle').legs,6);assert.ok(C.rig('queen').scale>worker.scale);assert.ok(C.rig('soldier').head>worker.head);});
test('perspective and look-at matrices remain finite',()=>{has('perspective');has('lookAt');has('multiply');const p=C.perspective(Math.PI/4,16/9,.1,160),v=C.lookAt([2,4,8],[0,0,0],[0,1,0]);assert.equal(p.length,16);assert.ok(C.multiply(p,v).every(Number.isFinite));assert.ok(p[0]>0&&p[5]>0);});
test('surface and nest coordinates are distinct true 3D positions',()=>{has('position');const s=fixture(),a=C.position(s,4,3),b=C.position(s,16,14);assert.equal(a.length,3);assert.notEqual(a[1],b[1]);assert.notEqual(a[2],b[2]);});
test('meshes contain finite vertices, normals and valid triangle indices',()=>{has('mesh');for(const kind of ['sphere','tube','box','leaf']){const m=C.mesh(kind);assert.ok(m.vertices.length>20);assert.ok(m.vertices.every(Number.isFinite));assert.ok(m.indices.every(i=>i>=0&&i<m.vertices.length/6));assert.equal(m.indices.length%3,0);}});
test('instance transforms are bounded and finite, including zero-length beams',()=>{has('Batch');const b=new C.Batch(3);b.add([0,0,0],[1,2,1],[1,.5,.2],0);b.beam([0,0,0],[0,0,0],.1,[1,1,1]);b.add([1,0,0],[1,1,1],[1,1,1]);b.add([2,0,0],[1,1,1],[1,1,1]);b.add([3,0,0],[1,1,1],[1,1,1]);assert.equal(b.count,3);assert.ok([...b.data.subarray(0,b.count*20)].every(Number.isFinite));b.reset();assert.equal(b.count,0);});

test('mesh faces point outward so front-face lighting uses the supplied normals',()=>{
  for(const kind of ['sphere','tube','box','leaf']){
    const m=C.mesh(kind);
    for(let i=0;i<m.indices.length;i+=3){
      const p=[0,1,2].map(j=>Array.from(m.vertices.slice(m.indices[i+j]*6,m.indices[i+j]*6+6)));
      const a=p[1].map((n,k)=>n-p[0][k]),b=p[2].map((n,k)=>n-p[0][k]);
      const face=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const agreement=face.reduce((sum,n,k)=>sum+n*(p[0][k+3]+p[1][k+3]+p[2][k+3]),0);
      assert.ok(agreement>=-1e-6,`${kind} triangle ${i/3} has reversed winding`);
    }
  }
});
