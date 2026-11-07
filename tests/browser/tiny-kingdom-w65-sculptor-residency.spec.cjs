'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function ellipsoid(x,y,z,rx,ry,rz,col,segments=9){');
const end=html.indexOf('// Gauntlet 040:',begin);
const production=begin<0||end<0?'':html.slice(begin,end).trim();

// W65 integrated Living Valley frame-time workstream. This test deliberately
// fails on the old per-call trigonometric tessellation. It prohibits a speedup
// purchased by changing citizen silhouettes, material order, physical world,
// authoritative work decisions, or population/triangle visibility.
test('W65 ellipsoid shell reuses bounded polar topology and emits exact legacy triangles',()=>{
 expect(production).toContain('._shellCache');
 expect(production).toContain('._shellAudit');
 const actual=[],reference=[];
 const candidate=vm.runInNewContext('('+production+')',{data:actual,currentMaterial:6});
 const old=(x,y,z,rx,ry,rz,col,segments=9)=>{
  if(!(rx>0&&ry>0&&rz>0)||!Number.isInteger(segments)||segments<3)return;
  const vertex=(st,ct,ca,sa)=>{
   const normal=[st*ca/rx,ct/ry,st*sa/rz],size=Math.hypot(...normal)||1;
   return {p:[x+st*ca*rx,y+ct*ry,z+st*sa*rz],n:normal.map(v=>v/size)};
  };
  const emit=(a,b,c)=>{
   for(const p of [a,b,c])reference.push(...p.p,...p.n,...col,6);
  };
  for(let ring=0;ring<5;ring++){
   const lat0=Math.PI*ring/5,lat1=Math.PI*(ring+1)/5;
   const st0=lat0===0||lat0===Math.PI?0:Math.sin(lat0);
   const st1=lat1===0||lat1===Math.PI?0:Math.sin(lat1);
   const ct0=Math.cos(lat0),ct1=Math.cos(lat1);
   for(let slice=0;slice<segments;slice++){
    const az0=slice*Math.PI*2/segments,az1=(slice+1)*Math.PI*2/segments;
    const ca0=Math.cos(az0),sa0=Math.sin(az0),ca1=Math.cos(az1),sa1=Math.sin(az1);
    const a=vertex(st0,ct0,ca0,sa0),b=vertex(st0,ct0,ca1,sa1);
    const c=vertex(st1,ct1,ca0,sa0),d=vertex(st1,ct1,ca1,sa1);
    if(ring===0)emit(a,d,c);
    else if(ring===4)emit(a,b,c);
    else {emit(a,b,d);emit(a,d,c);}
   }
  }
 };
 for(const segments of [3,4,6,7,8,9,12,24,26]){
  for(let j=0;j<3;j++){
   const coords=[j*.07-2,j*.29+1,j*.047-5,.13+j*.04,.12+j*.07,.09+j*.03,[.17,.43,.89]];
   old(...coords,segments);candidate(...coords,segments);
  }
 }
 for(const dimensions of [[0,.3,.4],[-.1,.2,.3],[.2,0,.5]]){
  old(0,0,0,...dimensions,[1,1,1]);candidate(0,0,0,...dimensions,[1,1,1]);
 }
 expect(actual.length).toBeGreaterThan(10000);
 expect(actual).toStrictEqual(reference);
 const audit=candidate._shellAudit;
 expect(audit.hits).toBeGreaterThan(0);
 expect(audit.builds).toBeLessThan(27);
 expect(candidate._shellCache.size).toBeLessThanOrEqual(16);
 expect([...candidate._shellCache.keys()].every(s=>s<=24)).toBe(true);
});

for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W65 real moving citizen shell, saved-world truth and canvas '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>140000,
   null,{timeout:110000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const result=await page.evaluate(()=>{
   const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
   const shell=game.getEllipsoidShellAudit();
   const scene=game.getGeometryAudit(),metrics=game.metrics(),
    frame=game.getFrameProfile(),after=JSON.stringify(game.exportSnapshot());
   return {before,after,shell,scene,metrics,frame,
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(result.before).toBe(result.after);
  expect(result.metrics.citizens).toBeGreaterThanOrEqual(12);
  expect(result.shell.cachedVariants).toBeGreaterThan(0);
  expect(result.shell.cachedVariants).toBeLessThanOrEqual(16);
  expect(result.shell.hits).toBeGreaterThan(0);
  expect(result.shell.usesAuthorityRandomness).toBe(false);
  expect(result.scene.totalTriangles).toBeLessThan(160000);
  for(const part of ['static','dynamic']){
   expect(result.scene[part].aligned).toBe(true);
   for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
    expect(result.scene[part][key]).toBe(0);
  }
  expect(result.gl).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  expect(result.frame.kind).toBe('cpu-wall-submission');
  fs.mkdirSync('artifacts/tiny-kingdom-w65',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w65/'+viewport.width+'-actual-world.png'});
 });
}