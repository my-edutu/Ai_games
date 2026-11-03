'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Tiny Kingdom solar shader uses the same precision in both WebGL1 stages',()=>{
 const vertex=html.split('const vs=`')[1]?.split('`;')[0]||'';
 const fragment=html.split('const fs=`')[1]?.split('`;')[0]||'';
 const declaration=source=>source.match(/uniform\\s+(?:(lowp|mediump|highp)\\s+)?float\\s+sunStrength\\s*;/)?.[1]||'default';
 expect(declaration(vertex)).toBe('default');
 expect(declaration(fragment)).toBe('highp');
 // Vertex WebGL1 defaults float uniforms to highp. Fragment mediump
 // defaults cannot be linked to the same uniform name without this.
 expect(vertex).toContain('uniform float sunStrength;');
 expect(fragment).toContain('uniform highp float sunStrength;');
});

// This test protects the visual treatment and real rendered UI; the visual
// TRANSFORMATION verdict still requires genuine same-seed A/B recordings.
test('Tiny Kingdom art direction: warm/cool atmosphere, readable 390px UI, real WebGL',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 const evidence=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  const day=g.getSkyPalette(12),night=g.getSkyPalette(23);
  return {day,night,ink:getComputedStyle(document.documentElement).getPropertyValue('--tk-art-ink').trim(),
   paper:getComputedStyle(document.documentElement).getPropertyValue('--tk-art-paper').trim(),
   worldFilter:getComputedStyle(document.getElementById('world')).filter,
   overflow:document.documentElement.scrollWidth-innerWidth,
   triangles:g.renderStats().lastFrameTriangles,
   snapshotUnchanged:before===JSON.stringify(g.exportSnapshot()),
   renderer:g.renderer(),
   glError:document.getElementById('world').getContext('webgl')?.getError()};
 });
 expect(evidence.paper).toBe('#f4ebd8');
 expect(evidence.ink).toBe('#1d2928');
 expect(evidence.day.zenith[2]).toBeLessThan(.71);
 expect(evidence.day.zenith[2]).toBeGreaterThan(evidence.night.zenith[2]);
 expect(evidence.worldFilter).toBe('none');
 expect(evidence.overflow).toBeLessThanOrEqual(0);
 expect(evidence.renderer).toBe('webgl');
 expect(evidence.triangles).toBeGreaterThan(0);
 expect(evidence.snapshotUnchanged).toBe(true);
 expect(evidence.glError).toBe(0);
 expect(errors).toEqual([]);
 fs.mkdirSync(path.resolve(__dirname,'../../artifacts/tiny-kingdom'),{recursive:true});
 await page.screenshot({path:path.resolve(__dirname,'../../artifacts/tiny-kingdom/visual-direction-390.png')});
});
