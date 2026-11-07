'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const OLD='aef0270e789aa58b7cffbd43c620b0259370397c';
const LIVE=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const BEFORE=execFileSync('git',['show',OLD+':public/tiny-kingdom/index.html'],{encoding:'utf8',maxBuffer:16*1024*1024});
function extract(src,begin,end){
 const a=src.indexOf(begin),b=src.indexOf(end,a);
 if(a<0||b<0)throw Error('Missing original actor geometry '+begin);
 return src.slice(a,b).trim();
}
const ellipsoidStart='function ellipsoid(x,y,z,rx,ry,rz,col,segments=9){';
const garmentStart='function tailoredGarment(x,y,z,size,cloth,trim,profile){';
const compactStart='function renderRealVillageWorkwear(p,index,x,y,z,size,rig,cloth,compact){';
test('W66 resident sculptor preserves every original exact W65 emitted float and bounded shell',()=>{
 const actualSource=extract(LIVE,ellipsoidStart,'// Gauntlet 040:');
 const oldSource=extract(BEFORE,ellipsoidStart,'// Gauntlet 040:');
 expect(actualSource).toContain('scratch');
 expect(actualSource).toContain('triangleIndices');
 const sample=(code)=>{
  const data=[],shape=vm.runInNewContext('('+code+')',{data,currentMaterial:7});
  for(const segments of [3,4,6,7,8,9,12,24,26]){
   for(let k=0;k<8;k++)
    shape(-2.7+k*.13,.23+k*.09,3-k*.17,.08+k*.021,.13+k*.034,.11+k*.012,
      [k/11,(k+2)/15,(k+1)/13],segments);
  }
  for(const invalid of [[0,.1,.2],[-1,.1,.2],[.1,0,.2]])
   shape(1,2,3,...invalid,[.2,.4,.6],6);
  return {data:Array.from(data),audit:shape._shellAudit,cache:shape._shellCache};
 };
 const old=sample(oldSource),next=sample(actualSource);
 expect(next.data.length).toBeGreaterThan(90000);
 expect(next.data).toStrictEqual(old.data);
 expect(next.cache.size).toBeLessThanOrEqual(16);
 expect([...next.cache.keys()].every(n=>n<=24)).toBe(true);
 expect(next.audit.vertexTransforms).toBe(old.audit.vertexTransforms);
 expect(next.audit.emittedTriangles).toBe(old.audit.emittedTriangles);
});
test('W66 authentic wool silhouette, hems, belt and job aprons preserve W65 geometry',()=>{
 const compare=(start,end,runs,setup)=>{
  const oldSrc=extract(BEFORE,start,end),newSrc=extract(LIVE,start,end);
  const record=(source)=>{
   const operations=[];
   const context={
    data:[],MATERIAL:{GENERAL:1},currentMaterial:1,
    rgb:v=>[v/16777215,v/16777215,v/16777215],
    materialScope:(_,fn)=>fn(),
    quad:(...args)=>{operations.push(JSON.stringify(['quad',...args]));context.data.push(1);},
    tri:(...args)=>{operations.push(JSON.stringify(['tri',...args]));context.data.push(1);},
    box:(...args)=>{operations.push(JSON.stringify(['box',...args]));context.data.push(1);},
    villageClothStats:{compactResidents:0,detailedResidents:0,compactHemPanels:0,workAprons:0,geometryTriangles:0,roles:new Set()}
   };
   const fn=vm.runInNewContext('('+source+')',context);
   for(const args of runs)fn(...args);
   return {operations,stats:{...context.villageClothStats,roles:[...context.villageClothStats.roles]}};
  };
  const old=record(oldSrc),candidate=record(newSrc);
  expect(candidate.operations).toStrictEqual(old.operations);
  expect(candidate.stats).toStrictEqual(old.stats);
 };
 const profile={
  panelCount:8,rings:[
   {y:.42,rx:.32,rz:.255,z:.013},{y:.62,rx:.24,rz:.20,z:.007},
   {y:.79,rx:.23,rz:.19,z:.003},{y:1.02,rx:.29,rz:.205,z:0},
   {y:1.145,rx:.17,rz:.148,z:0}
  ]
 };
 compare(garmentStart,'// W63:',[
  [-2,1,4,1.07,[.5,.41,.31],[.9,.72,.58],profile],
  [4,.8,-3,.89,[.28,.48,.39],[.52,.44,.31],profile]
 ]);
 compare(compactStart,'function getVillageClothAudit',[
  [{job:'farmer',phase:2.9},1,2,1,2,.94,{traveling:true,working:false,acting:{lean:0}},[.5,.4,.3],true],
  [{job:'builder',phase:7.1},3,-2,1,4,1.04,{traveling:false,working:true,acting:{lean:.4}},[.4,.5,.3],true],
  [{job:'gatherer',phase:1.4},2,1,1,-2,.91,{traveling:true,working:false,acting:{lean:0}},[.3,.5,.6],false]
 ]);
});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W66 actual inhabited town and real animated residents '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(LIVE);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>140000,
   null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const authority=JSON.stringify(g.exportSnapshot()),mesh=g.getGeometryAudit();
   const cloth=g.getVillageClothAudit(),sculpt=g.getEllipsoidShellAudit();
   return {authorityPreserved:authority===JSON.stringify(g.exportSnapshot()),
    citizens:g.metrics().citizens,clothed:cloth.totalResidents,sculpt,
    mesh,profile:g.getFrameProfile(),overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(result.authorityPreserved).toBe(true);
  expect(result.clothed).toBe(result.citizens);
  expect(result.sculpt.cachedVariants).toBeGreaterThan(0);
  expect(result.mesh.totalTriangles).toBeLessThan(160000);
  for(const kind of ['static','dynamic']){
   expect(result.mesh[kind].aligned).toBe(true);
   for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
    expect(result.mesh[kind][key]).toBe(0);
  }
  expect(result.gl).toBe(0);expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w66',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w66/'+viewport.width+'-real-residents.png'});
 });
}
