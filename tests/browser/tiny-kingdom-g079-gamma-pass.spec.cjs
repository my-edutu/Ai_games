'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G079: tone-map every actual ground/roof/skin fragment with a cheaper,
// numerically bounded gamma approximation rather than 3 component pow() calls.
// The exact shader must be compiled and attached by the real WebGL game, and
// the render-only change must never influence civilization authority.
test('G079 approximate filmic gamma is bounded and active without changing world authority',async({page})=>{
 test.setTimeout(90000);
 const source=html.split('const fs=`')[1]?.split('`;')[0]||'';
 expect(source).toContain('vec3 fastFilmicGamma(vec3 x)');
 expect(source).toContain('mapped=fastFilmicGamma(mapped);');
 expect(source).not.toContain('mapped=pow(max(mapped');
 for(let i=50;i<=999;i++){
   const x=i/1000;
   const approx=x+(Math.sqrt(x)-x)*(.135+.14*x);
   expect(Math.abs(approx-Math.pow(x,.88))).toBeLessThan(.0032);
 }
 const faults=[];page.on('pageerror',e=>faults.push(String(e.message)));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.renderStats().lastFrameTriangles>10000));
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const snapshot=JSON.stringify(g.exportSnapshot());
   const canvas=document.getElementById('world');
   const gl=canvas.getContext('webgl');
   let fragmentSource='';
   if(gl){
     const program=gl.getParameter(gl.CURRENT_PROGRAM);
     const fragment=program?(gl.getAttachedShaders(program)||[]).find(shader=>
       gl.getShaderParameter(shader,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
     fragmentSource=fragment?gl.getShaderSource(fragment):'';
   }
   g.setCamera({focus:[11,-5],yaw:1.1,pitch:.52,zoom:20});
   return {gpu:Boolean(gl),compiledApprox:fragmentSource.includes('vec3 fastFilmicGamma(vec3 x)')&&
      fragmentSource.includes('mapped=fastFilmicGamma(mapped);'),
     compiledPow:fragmentSource.includes('mapped=pow(max(mapped'),
     beforeAfterEqual:snapshot===JSON.stringify(g.exportSnapshot()),
     triangles:g.renderStats().lastFrameTriangles};
 });
 expect(result.beforeAfterEqual).toBe(true);
 expect(result.triangles).toBeGreaterThan(10000);
 if(result.gpu){expect(result.compiledApprox).toBe(true);expect(result.compiledPow).toBe(false);}
 expect(faults).toEqual([]);
});
