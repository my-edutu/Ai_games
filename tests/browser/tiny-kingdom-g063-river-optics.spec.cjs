'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G063 river shader shades coherent deep channel, silty shallows and flow-relative ripples without changing authority',async({page})=>{
 const waterSource=html.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[1]?.split('}else if(vMaterial>2.5&&vMaterial<3.5)')[0]||'';
 expect(waterSource).toContain('float channelDepth=');
 // G063b first GPU critic: mesh tint banding still looked like candy stripes.
 // A single base tint must be shared by the playable water and tapered ends.
 expect(html).toContain('const riverWaterTint=rgb(0x658c82);');
 expect((html.match(/\btone=riverWaterTint;/g)||[])).toHaveLength(2);
 expect(html).not.toContain('i===0||i===5?rgb(0x719ca0)');
 expect(waterSource).toContain('float sedimentGrain=');
 expect(waterSource).toContain('vec2 riverCurrent=');
 expect(waterSource).toContain('float bankFoam=');
 expect(waterSource).toContain('worldTime');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const data=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const center=g.sampleRiverOptics(0,20);
  const mid=g.sampleRiverOptics(0,20.9);
  const edge=g.sampleRiverOptics(0,21.8);
  const reachX=44,reachZ=20+3*Math.sin(reachX*.13);
  const tapered=g.sampleRiverOptics(reachX,reachZ);
  const geometry=g.getGeometryAudit();
  return {center,mid,edge,tapered,geometry,
   version:g.getMaterialSystem().surfaceShaderVersion,
   snapshotSame:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(data.version).toBe('procedural-063');
 expect(data.center.channelDepth).toBeCloseTo(1,8);
 expect(data.center.bankFoam).toBeCloseTo(0,8);
 expect(data.edge.channelDepth).toBeCloseTo(0,8);
 expect(data.edge.bankFoam).toBeCloseTo(1,8);
 expect(data.mid.channelDepth).toBeGreaterThan(0.3);
 expect(data.mid.channelDepth).toBeLessThan(0.9);
 expect(data.tapered.riverWidth).toBeLessThan(1.8);
 expect(data.tapered.riverWidth).toBeGreaterThan(.08);
 expect(data.tapered.channelDepth).toBeCloseTo(1,8);
 expect(data.geometry.totalTriangles).toBe(159551);
 expect(data.geometry.static.invalidComponents+data.geometry.dynamic.invalidComponents).toBe(0);
 expect(data.snapshotSame).toBe(true);
 expect(errors).toEqual([]);
});
