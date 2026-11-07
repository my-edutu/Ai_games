'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G089 distant meadow samples bounded 2D ground colour, keeping near 3D noise and exact authority',async({page})=>{
 test.setTimeout(110000);
 const grass=html.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]
   ?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
 expect(grass).toContain('float groundDistance=length(eyePosition.xz-vWorld.xz);');
 expect(grass).toContain('float farMeadowMix=smoothstep(26.,42.,groundDistance);');
 expect(grass).toContain('if(groundDistance<42.) meadow=noise3(vWorld*vec3(.29,1.1,.29));');
 expect(grass).toContain('if(farMeadowMix>0.){');
 expect(grass).toContain('float distantMeadow=mix(');
 expect(grass).toContain('meadow=mix(meadow,distantMeadow,farMeadowMix);');
 expect(grass).toContain('float detailFade=1.-smoothstep(10.,38.,groundDistance);');
 expect(grass).not.toContain('float meadow=noise3(vWorld*vec3(.29,1.1,.29));');
 // The new far-field mix is exactly zero at 26m and exactly one by 42m,
 // with smooth zero-slope endpoints (no visible hard LOD cutoff).
 const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 for(const d of [0,10,25,26])expect(smoothstep(26,42,d)).toBe(0);
 for(const d of [42,43,55,90])expect(smoothstep(26,42,d)).toBe(1);
 expect(Math.abs(smoothstep(26,42,41.9999)-1)).toBeLessThan(1e-7);
 expect(smoothstep(26,42,26.0001)).toBeLessThan(1e-7);
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const actual=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const gl=document.getElementById('world').getContext('webgl');
  const program=gl?.getParameter(gl.CURRENT_PROGRAM);
  const fragment=program?(gl.getAttachedShaders(program)||[]).find(s=>
   gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
  const src=fragment?gl.getShaderSource(fragment):'';
  const grass=src.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]
    ?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
  g.setCamera({focus:[33,29],yaw:.91,pitch:.52,zoom:24});
  return {hasGpu:!!gl,compiled:grass.includes('float farMeadowMix=smoothstep(26.,42.,groundDistance);')&&
    grass.includes('float distantMeadow=mix('),mesh:g.getGeometryAudit(),
    sameAuthority:before===JSON.stringify(g.exportSnapshot()),
    glError:gl?.getError()||0};
 });
 expect(actual.sameAuthority).toBe(true);
 expect(actual.mesh.totalTriangles).toBeLessThan(160000);
 for(const part of ['static','dynamic']){
  expect(actual.mesh[part].aligned).toBe(true);
  expect(actual.mesh[part].invalidComponents+actual.mesh[part].invalidNormals+
    actual.mesh[part].invalidColors+actual.mesh[part].outOfBounds).toBe(0);
 }
 if(actual.hasGpu)expect(actual.compiled).toBe(true);
 expect(actual.glError).toBe(0);
 expect(faults).toEqual([]);
});
