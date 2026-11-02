'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G085: the second eight-corner meadow noise field is finer than the
// projected footprint of distant terrain. Preserve the original near
// blades exactly, but replace it with a stable neutral value when the
// existing 10–38m grass fade reaches zero. This must not touch authority.
test('G085 far meadow avoids high-frequency noise while retaining original near detail and replay',async({page})=>{
 test.setTimeout(90000);
 const shader=html.split('const fs=`')[1]?.split('`;')[0]||'';
 const grass=shader.split('if(vMaterial>0.5&&vMaterial<1.5){')[1]?.split('}else if(vMaterial>1.5')[0]||'';
 const fade='float detailFade=1.-smoothstep(10.,38.,groundDistance);';
 expect(grass).toContain('float groundDistance=length(eyePosition.xz-vWorld.xz);');
 expect(grass.split(fade)).toHaveLength(2);
 expect(grass.indexOf(fade)).toBeGreaterThan(-1);
 expect(grass.indexOf(fade)).toBeLessThan(grass.indexOf('float blades=.5;'));
 expect(grass).toContain('float blades=.5;');
 expect(grass).toContain('if(detailFade>0.) blades=mix(.5,noise3(vWorld*vec3(5.2,1.4,5.2)),detailFade);');
 expect(grass).not.toContain('float blades=noise3(vWorld*vec3(5.2,1.4,5.2));');
 expect(grass).toContain('if(detailFade>0.){');
 // Verify that near-field grass is mathematically unchanged, that the
 // fade is continuous in the transition band and far fragments do not
 // need the expensive high-frequency noise3 call.
 const fadeAt=d=>{const t=Math.max(0,Math.min(1,(d-10)/28));return 1-t*t*(3-2*t);};
 const bladeAt=(d,noise)=>.5+(noise-.5)*fadeAt(d);
 for(const noise of [0,.23,.5,.81,1]){
  expect(bladeAt(0,noise)).toBeCloseTo(noise,12);
  expect(bladeAt(10,noise)).toBeCloseTo(noise,12);
  expect(bladeAt(38,noise)).toBe(.5);
  expect(bladeAt(70,noise)).toBe(.5);
  expect(bladeAt(24,noise)).toBeGreaterThanOrEqual(Math.min(noise,.5));
  expect(bladeAt(24,noise)).toBeLessThanOrEqual(Math.max(noise,.5));
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>10000);
 await page.locator('#pause').click();
 const audit=await page.evaluate(()=>{
  const game=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  const program=gl?.getParameter(gl.CURRENT_PROGRAM);
  const fragment=program?(gl.getAttachedShaders(program)||[]).find(s=>gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
  const src=fragment?gl.getShaderSource(fragment):'';
  const before=JSON.stringify(game.exportSnapshot());
  const geom=game.getGeometryAudit();
  return {webgl:Boolean(gl),shaderGate:src.includes('if(detailFade>0.) blades=mix(.5,noise3('),
   snapshotStable:before===JSON.stringify(game.exportSnapshot()),
   aligned:geom.static.aligned&&geom.dynamic.aligned,
   triangles:geom.totalTriangles,invalid:geom.static.invalidComponents+geom.dynamic.invalidComponents,
   glError:gl?.getError()||0};
 });
 expect(audit.webgl).toBe(true);
 expect(audit.shaderGate).toBe(true);
 expect(audit.snapshotStable).toBe(true);
 expect(audit.aligned).toBe(true);
 expect(audit.invalid).toBe(0);
 expect(audit.triangles).toBeLessThan(160000);
 expect(audit.glError).toBe(0);
 expect(errors).toEqual([]);
});
