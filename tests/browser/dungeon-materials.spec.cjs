'use strict';
const {test,expect}=require('@playwright/test');

// These are renderer/material gates, not a visual-quality score. Do not treat a
// loaded GLB with missing textures as an authored-art success.
test('authored characters decode embedded colour maps under the real server policy',async({page,request})=>{
 const source=await request.get('/dungeon');
 expect(source.ok()).toBe(true);
 const policy=source.headers()['content-security-policy'];
 expect(policy).toMatch(/connect-src[^;]*blob:/);
 expect(policy).toMatch(/img-src[^;]*blob:/);
 const failures=[];
 page.on('console',message=>{
  const text=message.text();
  if(/Couldn't load texture|incomplete textures|Refused to (connect|load).*blob:/i.test(text))failures.push(text);
 });
 page.on('pageerror',error=>failures.push(String(error)));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:45000}).toBeGreaterThanOrEqual(3);
 const diagnostics=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__.authored3D);
 expect(diagnostics.incompleteAssets).toBe(0);
 expect(diagnostics.missingAssets).toBe(0);
 expect(diagnostics.decodedColorMaps).toBeGreaterThanOrEqual(3);
 expect(failures).toEqual([]);
 await test.info().attach('decoded-material-diagnostics',{body:Buffer.from(JSON.stringify(diagnostics,null,2)),contentType:'application/json'});
});

test('camera selection reaches the actual renderer before the next switch',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/dungeon');
 const modes=['cinematic','tactical','chase','cinematic'];
 for(let index=0;index<modes.length;index++){
  const mode=modes[index];
  if(index>0)await page.locator('#view-toggle').click();
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.camera),{timeout:30000}).toBe(mode);
 }
});

// Small, independently reproducible browser check: real GLB bytes and the real
// server policy, without paying for a full renderer or accepting white meshes.
test('embedded GLB image decodes in both browser texture loading paths',async({page,request})=>{
 const documentResponse=await request.get('/dungeon');
 const modelResponse=await request.get('/dungeon/assets/player/player_swordsman.glb');
 expect(documentResponse.ok()).toBe(true);expect(modelResponse.ok()).toBe(true);
 const policy=documentResponse.headers()['content-security-policy'];
 expect(policy).toBeTruthy();
 const escaped=policy.replaceAll('&','&amp;').replaceAll('"','&quot;');
 await page.setContent('<meta http-equiv="Content-Security-Policy" content="'+escaped+'">');
 const bytes=[...await modelResponse.body()];
 const dimensions=await page.evaluate(async bytes=>{
  const data=new Uint8Array(bytes),view=new DataView(data.buffer);
  if(view.getUint32(0,true)!==0x46546c67)throw Error('Not a GLB asset');
  let definition=null,binary=null;
  for(let offset=12;offset<data.length;){
   const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true);
   const chunk=data.slice(offset+8,offset+8+length);offset+=8+length;
   if(type===0x4e4f534a)definition=JSON.parse(new TextDecoder().decode(chunk));
   if(type===0x004e4942)binary=chunk;
  }
  const source=definition?.images?.find(image=>Number.isInteger(image.bufferView));
  if(!source||!binary)throw Error('Model has no embedded image');
  const range=definition.bufferViews[source.bufferView],offset=range.byteOffset||0;
  const url=URL.createObjectURL(new Blob([binary.slice(offset,offset+range.byteLength)],{type:source.mimeType}));
  try{
   const response=await fetch(url),bitmap=await createImageBitmap(await response.blob());
   const image=new Image();image.src=url;await image.decode();
   const result={bitmap:[bitmap.width,bitmap.height],image:[image.naturalWidth,image.naturalHeight]};
   bitmap.close();return result;
  }finally{URL.revokeObjectURL(url)}
 },bytes);
 expect(dimensions.bitmap[0]).toBeGreaterThan(0);
 expect(dimensions.bitmap[1]).toBeGreaterThan(0);
 expect(dimensions.image).toEqual(dimensions.bitmap);
 await test.info().attach('embedded-image-decode',{body:Buffer.from(JSON.stringify(dimensions)),contentType:'application/json'});
});

test('actual live 3D masonry base walls use a shared stone albedo and bounded bump map',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wallMasonry?.mapped??false),{timeout:45000}).toBe(true);
 const evidence=await page.evaluate(()=>({
  wallMasonry:window.__DUNGEON_RENDER_DIAGNOSTICS__?.wallMasonry,
  wallProfiles:window.__DUNGEON_RENDER_DIAGNOSTICS__?.wallProfiles,
  webgl:window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl,
  drawCalls:window.__DUNGEON_RENDER_DIAGNOSTICS__?.drawCalls,
  triangles:window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles
 }));
 expect(evidence.webgl).toBe(true);
 expect(evidence.wallMasonry).toMatchObject({size:128,mapped:true,bump:true,bumpScale:.04});
 expect(evidence.wallProfiles?.totalWalls).toBeGreaterThan(0);
 expect(evidence.drawCalls).toBeGreaterThan(0);
 expect(evidence.triangles).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 // Genuine running WebGL frame, not a mockup or synthetic image.
 await page.locator('#world').screenshot({path:'artifacts/dungeon-wall-masonry-round41-world-only.png',timeout:60000});
 await test.info().attach('round41-masonry-live-diagnostics',{body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
});

test('actual seeded crypt renders earthy neutral masonry, bounded hero lights, and real WebGL pixels',async({page})=>{
 test.setTimeout(120000);
 const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let tick=0;tick<18;tick++)game.step();
 const snapshot=game.publicState();
 expect(snapshot.floor).toBe(1);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),
  {timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.stoneGrade?.wallTint??null),
  {timeout:30000}).toBe('f3e0c7');
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diag.webgl).toBe(true);
 expect(diag.stoneGrade).toMatchObject({
  biome:'SUNKEN CRYPT',wallTint:'f3e0c7',floorTint:'50463c',
  trimTint:'7c6d5b',keyFill:'cfbda5',partyFill:'9bd8ba',wallTextureMapped:true
 });
 expect(diag.stoneGrade.partyIntensity).toBeGreaterThanOrEqual(.8);
 expect(diag.stoneGrade.partyIntensity).toBeLessThanOrEqual(1.3);
 expect(diag.composition.visibleHeroes).toBeGreaterThanOrEqual(3);
 expect(diag.authored3D.missingAssets).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-round55-crypt-stone-grade-real-WebGL.png',timeout:60000});
 await test.info().attach('real-crypt-stone-grade-audit',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,groundTruth:'actual DungeonRuntime public snapshot',
  stoneGrade:diag.stoneGrade,drawCalls:diag.drawCalls,triangles:diag.triangles,composition:diag.composition
 },null,2)),contentType:'application/json'});
});
