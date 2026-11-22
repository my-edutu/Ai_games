'use strict';
// W126E real software WebGL aerial, human and river captures; no FPS proxy.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W126E original populated environment '+viewport.width,async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:170000});
  const source=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {state:JSON.stringify(g.exportSnapshot()),
    names:g.getState().people.map(p=>p.name),
    ecology:g.getEcotoneVisualStats(),
    valley:g.getValleySurfaceBuildAudit(),reeds:g.getRiverReedVisualAudit(),
    ground:g.getGroundSurfaceStats(),
    geometry:g.getGeometryAudit(),
    profile:g.getFrameProfile(),
    triangles:g.renderStats().lastFrameTriangles,
    storage:g.getScenicMeshStorage(),
    glError:document.getElementById('world').getContext('webgl')?.getError()??null};
  });
  expect(source.ecology.riverBankClumps).toBeGreaterThan(45);
  expect(source.ecology.fieldMarginClumps).toBeGreaterThan(20);
  expect(source.ecology.triangles).toBeLessThan(1500);
  expect(source.ecology.extraBuffers).toBe(0);
  expect(source.valley.tiles).toBe(1681);
  expect(source.valley.triangles).toBe(6724);
  expect(source.valley.uniqueSamples).toBe(3445);
  expect(source.reeds.stems).toBe(207);
  expect(source.reeds.triangles).toBe(1242);
  expect(source.reeds.extraBuffers).toBe(0);
  expect(source.ground.roadSegments).toBeGreaterThan(0);
  expect(source.geometry.totalTriangles).toBeLessThan(160000);
  expect(source.glError).toBe(0);
  for(const shot of [
   {name:'farm-overhead',focus:[24,0],yaw:.68,pitch:.92,zoom:28},
   {name:'farm-human-scale',focus:[29,-5],yaw:.62,pitch:.36,zoom:10},
   {name:'river-overhead',focus:[10,20],yaw:.48,pitch:.88,zoom:31}
  ]){
   const frame=await page.evaluate(shot=>{
    const g=window.__tinyKingdom;
    g.setCamera({focus:shot.focus,yaw:shot.yaw,pitch:shot.pitch,zoom:shot.zoom});
    return g.getFrameProfile().totalFrames;
   },shot);
   await page.waitForFunction(f=>window.__tinyKingdom.getFrameProfile().totalFrames>f,
    frame,{timeout:140000});
   await info.attach('W126E-'+shot.name+'-'+viewport.width,
    {body:await page.screenshot(),contentType:'image/png'});
  }
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;return {
    state:JSON.stringify(g.exportSnapshot()),
    names:g.getState().people.map(p=>p.name),
    ecology:g.getEcotoneVisualStats(),
    valley:g.getValleySurfaceBuildAudit(),reeds:g.getRiverReedVisualAudit(),
    glError:document.getElementById('world').getContext('webgl')?.getError()??null};
  });
  expect(after.state).toBe(source.state);
  expect(after.names).toEqual(source.names);
  expect(after.ecology).toEqual(source.ecology);
  expect(after.valley).toEqual(source.valley);
  expect(after.reeds).toEqual(source.reeds);
  expect(after.glError).toBe(0);
  expect(errors).toEqual([]);
  await info.attach('W126E-environment-audit-'+viewport.width,
   {body:Buffer.from(JSON.stringify({source,after},null,2)),
    contentType:'application/json'});
 });
}
