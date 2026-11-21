'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Tiny Kingdom solar shader uses the same precision in both WebGL1 stages',()=>{
 const vertex=html.split('const vs=`')[1]?.split('`;')[0]||'';
 const fragment=html.split('const fs=`')[1]?.split('`;')[0]||'';
 const declaration=source=>source.match(/uniform\s+(?:(lowp|mediump|highp)\s+)?float\s+sunStrength\s*;/)?.[1]||'default';
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
  const dawn=g.getLightingProfile(7),dusk=g.getLightingProfile(18.4),noon=g.getLightingProfile(12);
  return {day,night,dawn,dusk,noon,ink:getComputedStyle(document.documentElement).getPropertyValue('--tk-art-ink').trim(),
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
 expect(evidence.dawn.ambientBlend).toBeGreaterThan(.59);
 expect(evidence.dusk.ambientBlend).toBeGreaterThan(.35);
 expect(evidence.noon.ambientBlend).toBeGreaterThan(evidence.dawn.ambientBlend);
 expect(evidence.day.zenith[2]).toBeLessThan(.71);
 expect(evidence.day.zenith[2]).toBeGreaterThan(evidence.night.zenith[2]);
 expect(evidence.worldFilter).toBe('none');
 expect(evidence.overflow).toBeLessThanOrEqual(0);
 expect(evidence.renderer).toBe('webgl');
 expect(evidence.triangles).toBeGreaterThan(0);
 expect(evidence.snapshotUnchanged).toBe(true);
 expect(evidence.glError).toBe(0);
 const mobile=await page.evaluate(()=>{
   const visible=id=>{
     const el=document.getElementById(id),style=getComputedStyle(el);
     return {display:style.display,fontSize:parseFloat(style.fontSize),
      height:el.getBoundingClientRect().height};
   };
   const tour=document.querySelector('.world-tour .tour-btn');
   return {mode:document.body.dataset.command,
    resume:visible('pause'),command:visible('command-toggle'),
    tour:{fontSize:parseFloat(getComputedStyle(tour).fontSize),
     height:tour.getBoundingClientRect().height},
    fullCommandPresent:Boolean(document.getElementById('world-open-command'))};
 });
 expect(mobile.mode).toBe('world');
 for(const control of [mobile.resume,mobile.command,mobile.tour]){
   expect(control.fontSize).toBeGreaterThanOrEqual(11);
   expect(control.height).toBeGreaterThanOrEqual(39);
 }
 expect(mobile.fullCommandPresent).toBe(true);
 expect(errors).toEqual([]);
 fs.mkdirSync(path.resolve(__dirname,'../../artifacts/tiny-kingdom'),{recursive:true});
 await page.screenshot({path:path.resolve(__dirname,'../../artifacts/tiny-kingdom/visual-direction-390.png')});
});

test('Tiny Kingdom 1024px command desk stays one row without clipping actual actions',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 // W03 opens in the actual world, not the full old command desk. Exercise the
 // user's accessible Command desk action before asserting its complete rail.
 await page.locator('#world-open-command').click();
 await expect(page.locator('#command-toggle')).toHaveAttribute('aria-pressed','false');
 const measured=await page.evaluate(()=>{
   const desk=document.querySelector('.bottom');
   const before={height:desk.getBoundingClientRect().height,
    wrap:getComputedStyle(desk).flexWrap,viewport:document.documentElement.clientWidth,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    scrollExtent:desk.scrollWidth,clientWidth:desk.clientWidth,
    hasSave:Boolean(document.getElementById('save')),
    hasRestore:Boolean(document.getElementById('restore')),
    hasRestart:Boolean(document.getElementById('restart'))};
   desk.scrollLeft=desk.scrollWidth;
   const last=document.getElementById('restart'),d=desk.getBoundingClientRect(),c=last.getBoundingClientRect();
   return {...before,restartInView:c.left>=d.left-1&&c.right<=d.right+1,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
 });
 expect(measured.wrap).toBe('nowrap');
 expect(measured.height).toBeLessThanOrEqual(64);
 expect(measured.overflow).toBeLessThanOrEqual(0);
 expect(measured.hasSave&&measured.hasRestore&&measured.hasRestart).toBe(true);
 expect(measured.restartInView).toBe(true);
 expect(measured.glError).toBe(0);
 expect(errors).toEqual([]);
});
