'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G071: a real sunrise OR sunset chosen from current paused simulation time.
// Playwright/SwiftShader startup may take several simulated hours: do not
// assume initial clock=7. The renderer must not rebuild its 130k scenic mesh
// merely because lighting crosses the day/night threshold.
test('G071 daylight transition preserves scenic VBO and replay with emissive glass',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.renderQuality().idleFrames>0);
 // Advance canonical simulation to ONE tick before a lighting threshold.
 // A builder may legitimately add cottages over the preceding hours; record
 // the cached baseline only *after* those autonomous city revisions render.
 const prephase=await page.evaluate(()=>{
  const g=window.__tinyKingdom,lit=t=>g.getLightingProfile(t).solar>=.4375;
  // Read the frame counter in the SAME task, before changing authority.
  // Otherwise rAF can render the only required frame between evaluate calls,
  // leaving a paused, clean scene and causing waitForFunction to time out.
  const frameBeforeAdvance=g.getFrameProfile().totalFrames;
  let steps=0;
  while(steps<720){
   const t=g.getState().state.t;
   if(lit(t)!==lit(t+1/30))break;
   g.step(1/30);steps++;
  }
  const t=g.getState().state.t;
  return {steps,willCross:lit(t)!==lit(t+1/30),time:t,frameBeforeAdvance};
 });
 expect(prephase.steps).toBeLessThan(720);
 expect(prephase.willCross).toBe(true);
 // A paused scene intentionally renders only once per mutation. The baseline
 // count must predate the mutation even on a fast event loop.
 await page.waitForFunction(prev=>window.__tinyKingdom.getFrameProfile().totalFrames>prev,
   prephase.frameBeforeAdvance,{timeout:30000});
 const before=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  const program=gl?.getParameter(gl.CURRENT_PROGRAM);
  const vertex=program?(gl.getAttachedShaders(program)||[]).find(s=>
    gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.VERTEX_SHADER):null;
  return {time:g.getState().state.t,lighting:g.getLightingProfile(g.getState().state.t),
    cache:g.renderStats(),geometry:g.getGeometryAudit(),profile:g.getFrameProfile(),
    snapshot:g.exportSnapshot(),materials:g.getMaterialSystem().materials,
    activeVertexShader:vertex?gl.getShaderSource(vertex):'',
    gl:Boolean(gl)};
 });
 // A new material ID is invalid until the real mesh auditor accepts it;
 // zero malformed components is a hard GPU and 120-day resource invariant.
 for(const mesh of [before.geometry.static,before.geometry.dynamic]){
  expect(mesh.invalidComponents).toBe(0);
  expect(mesh.invalidNormals).toBe(0);
  expect(mesh.invalidColors).toBe(0);
 }
 expect(before.materials).toContain('WINDOW_GLOW');
 expect(before.materials).toContain('LANTERN_GLOW');
 if(before.gl){
  expect(before.activeVertexShader).toContain('materialId>8.5&&materialId<10.5');
  expect(before.activeVertexShader).toContain('float afterDusk=');
 }
 const crossed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const initiallyLit=g.getLightingProfile(g.getState().state.t).solar>=.4375;
  g.step(1/30);
  return {steps:1,initiallyLit,finallyLit:
    g.getLightingProfile(g.getState().state.t).solar>=.4375};
 });
 expect(crossed.finallyLit).not.toBe(crossed.initiallyLit);
 await page.waitForFunction(prev=>window.__tinyKingdom.getFrameProfile().totalFrames>prev,
   before.profile.totalFrames,{timeout:30000});
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {time:g.getState().state.t,lighting:g.getLightingProfile(g.getState().state.t),
    cache:g.renderStats(),geometry:g.getGeometryAudit(),snapshot:g.exportSnapshot(),
    glError:gl?.getError()??0};
 });
 expect(after.time-before.time).toBeCloseTo(crossed.steps/30,5);
 if(before.gl){
  // The WebGL presentation shader owns light and should not upload scenery.
  expect(after.cache.scenicMeshKey).toBe(before.cache.scenicMeshKey);
  expect(after.cache.scenicMeshRebuilds).toBe(before.cache.scenicMeshRebuilds);
  expect(after.cache.staticGpuUploads).toBe(before.cache.staticGpuUploads);
 }else{
  // Canvas2D cannot execute GPU material shaders and intentionally preserves
  // the original baked day/night glass palette and scene invalidation.
  expect(after.cache.scenicMeshKey).not.toBe(before.cache.scenicMeshKey);
  expect(after.cache.scenicMeshRebuilds).toBeGreaterThan(before.cache.scenicMeshRebuilds);
 }
 expect(after.geometry.totalTriangles).toBe(before.geometry.totalTriangles);
 expect(after.geometry.totalTriangles).toBeLessThan(160000);
 for(const mesh of [after.geometry.static,after.geometry.dynamic]){
  expect(mesh.invalidComponents).toBe(0);
  expect(mesh.invalidNormals).toBe(0);
  expect(mesh.invalidColors).toBe(0);
 }
 expect(after.glError).toBe(0);
 await page.evaluate(s=>window.__tinyKingdom.restoreSnapshot(s),before.snapshot);
 await page.evaluate(n=>{for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30);},crossed.steps);
 const replay=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 expect(JSON.stringify(replay)).toBe(JSON.stringify(after.snapshot));
 expect(errors).toEqual([]);
});
