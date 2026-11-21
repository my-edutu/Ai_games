'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

// Inspect the exact Three.DataTexture used by the real public WebGL world.
// A source grep or CSS tint alone cannot establish the image palette.
async function actualWorld() {
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-water-grade-'));
  try {
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const name of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',name),path.join(tmp,name));
    for(const name of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',name),path.join(tmp,'vendor',name));
    return {module:await import(pathToFileURL(path.join(tmp,'world.js')).href),
      done:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  } catch(error) {fs.rmSync(tmp,{recursive:true,force:true});throw error;}
}
const cell=(id)=>({cell:id,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false});
const shot=(cells,extras={})=>({runToken:'public-sea',tick:1,width:7,height:7,
  currentCell:22,cells,visibleCells:cells.map(c=>c.cell),doors:[],keys:[],inventory:[],threats:[],exitCell:null,
  result:null,...extras});
function realSeaPixels(world) {
  const ocean=world.group.children[0].children.find(m=>m.isMesh&&m.material?.map?.isDataTexture);
  assert.ok(ocean,'the actual lagoon must remain a physical, textured Three mesh');
  assert.ok(ocean.material.map.image.width===128&&ocean.material.map.image.height===128,
    'the shared 128px tileable sea remains bounded');
  return ocean.material.map.image.data;
}
test('the original physical sea is quieter than the gameplay stage and cannot encode private routes',async()=>{
  const {module,done}=await actualWorld();
  const world=module.createMazeWorld({balanced:true});
  const replay=module.createMazeWorld({balanced:true});
  try {
    const publicShot=shot([cell(22)]), original=JSON.stringify(publicShot);
    world.update(publicShot);
    replay.update(shot([cell(22)],{
      runToken:'another-run',tick:942,hiddenRoute:[14,13,19],
      privateCells:[cell(11),cell(12)],privateExitCell:11,privateKeyCells:[9]}));
    const pixels=realSeaPixels(world), again=realSeaPixels(replay);
    assert.equal(pixels.length,128*128*4);
    assert.deepEqual(Buffer.from(pixels),Buffer.from(again),
      'sea texture cannot reveal private map, route, keys, run time or the AI plan');
    let minGreen=255,maxGreen=0,totals=[0,0,0];
    for(let i=0;i<pixels.length;i+=4){
      const red=pixels[i],green=pixels[i+1],blue=pixels[i+2];
      assert.equal(pixels[i+3],255,'no missing water pixels or blending seams');
      assert.ok(blue>=green+5,'muted mineral-blue water, not saturated turquoise signal paint');
      minGreen=Math.min(minGreen,green);maxGreen=Math.max(maxGreen,green);
      totals[0]+=red;totals[1]+=green;totals[2]+=blue;
    }
    const count=128*128,mean=totals.map(x=>x/count);
    assert.ok(mean[0]>47&&mean[0]<63&&mean[1]>99&&mean[1]<116
      &&mean[2]>107&&mean[2]<124,'warm stage stays dominant over blue-grey open water');
    assert.ok(maxGreen-minGreen<=26,
      'tiled caustics should not form bright path-like waves around undisclosed terrain');
    assert.ok(world.stats().textureCount<=3&&world.stats().geometryCount<=16,
      'the palette change must not allocate extra render resources');
    assert.equal(JSON.stringify(publicShot),original,'presentation never edits the public AI snapshot');
  } finally {world.dispose();replay.dispose();done();}
});
