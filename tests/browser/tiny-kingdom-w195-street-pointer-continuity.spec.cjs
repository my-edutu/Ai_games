'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W195: actual 1024px and 390px input on the original running 3D village.
// The old capture listener turned 5px+5px into a 15px cumulative yaw change.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W195 real physical street pointer continuity '+viewport.width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {snapshot:JSON.stringify(g.exportSnapshot()),street:g.setStreetWalk(true)};
  });
  expect(before.street.active).toBe(true);
  const rect=await page.locator('#world').boundingBox();
  expect(rect).toBeTruthy();
  const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+5,y+3);await page.mouse.move(x+10,y+6);
  await page.mouse.up();
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {street:g.getStreetWalkState(),snapshot:JSON.stringify(g.exportSnapshot()),
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(after.street.yaw-before.street.yaw).toBeCloseTo(.05,8);
  expect(after.street.tilt-before.street.tilt).toBeCloseTo(-.024,8);
  expect(after.street.position).toEqual(before.street.position);
  expect(after.snapshot).toBe(before.snapshot);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const dir='artifacts/tiny-kingdom-w195';fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(dir+'/'+viewport.width+'-pointer.json',JSON.stringify({
   viewport,yawBefore:before.street.yaw,yawAfter:after.street.yaw,
   tiltBefore:before.street.tilt,tiltAfter:after.street.tilt,
   authorityUnchanged:true,hardwareFpsClaim:false},null,2));
  await page.screenshot({path:dir+'/'+viewport.width+'-street.png'});
 });
}
