'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G080: far-away grass should not execute fine tuft hashes and per-pixel
// micro-normal math after its existing 38-unit visual fade reaches zero.
// Near-field grass must retain its original shader treatment and authority
// must remain untouched (including pause, replay and all citizens).
test('G080 distance-gated grass micro-relief retains near detail and skips far work',async({page})=>{
 test.setTimeout(90000);
 const shader=html.split('const fs=`')[1]?.split('`;')[0]||'';
 expect(shader).toContain('float groundDistance=length(eyePosition.xz-vWorld.xz);');
 expect(shader).toContain('float detailFade=1.-smoothstep(10.,38.,groundDistance);');
 expect(shader).toContain('if(detailFade>0.){');
 const begin=shader.indexOf('if(detailFade>0.){');
 const end=shader.indexOf('float damp=',begin);
 const gated=shader.slice(begin,end);
 expect(gated).toContain('vec2 cellUV=vWorld.xz*4.1;');
 expect(gated).toContain('hash3(vec3(cellID,11.))');
 expect(gated).toContain('hash3(vec3(cellID,17.))');
 expect(gated).toContain('float seedHead=');
 expect(gated).toContain('c*=1.-detailFade*seedHead*.095;');
 // Document the exact current smoothstep support: the optimized range may
 // never silently erase visible detail within the original 10–38m band.
 const fade=d=>{const t=Math.max(0,Math.min(1,(d-10)/28));return 1-t*t*(3-2*t)};
 for(const d of [0,9,10,17,25,37])expect(fade(d)).toBeGreaterThan(0);
 for(const d of [38,50,90])expect(fade(d)).toBe(0);
 const faults=[];page.on('pageerror',e=>faults.push(String(e.message)));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.renderStats().lastFrameTriangles>10000));
 await page.locator('#pause').click();
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const baseline=JSON.stringify(g.exportSnapshot());
  const triangles=g.renderStats().lastFrameTriangles;
  const before=g.getGeometryAudit();
  const gl=document.getElementById('world').getContext('webgl');
  const program=gl?.getParameter(gl.CURRENT_PROGRAM);
  const fragment=program?(gl.getAttachedShaders(program)||[]).find(s=>gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
  const compiled=fragment?gl.getShaderSource(fragment):'';
  g.setCamera({focus:[0,0],yaw:.85,pitch:.52,zoom:23});
  return {webgl:Boolean(gl),compiledGate:compiled.includes('if(detailFade>0.){'),
   compiledNear:compiled.includes('vec2 cellUV=vWorld.xz*4.1;'),
   unchanged:baseline===JSON.stringify(g.exportSnapshot()),triangles,
   aligned:before.static.aligned&&before.dynamic.aligned,
   invalid:before.static.invalidComponents+before.dynamic.invalidComponents,
   glError:gl?.getError()||0};
 });
 expect(proof.webgl).toBe(true);
 expect(proof.compiledGate).toBe(true);
 expect(proof.compiledNear).toBe(true);
 expect(proof.unchanged).toBe(true);
 expect(proof.triangles).toBeGreaterThan(10000);
 expect(proof.aligned).toBe(true);
 expect(proof.invalid).toBe(0);
 expect(proof.glError).toBe(0);
 expect(faults).toEqual([]);
});
