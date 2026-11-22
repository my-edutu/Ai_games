'use strict';
// W295 original rendering-spine contract: covers complete background terrain
// + deterministic tree LOD without touching authoritative paths or RNG.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function originalSourceFunction(name){
 const start=html.indexOf('function '+name+'(');
 if(start<0)throw Error('Missing production '+name);
 const brace=html.indexOf('{',start);
 let depth=0,end=brace;
 for(;end<html.length;end++){
  if(html[end]==='{')depth++;
  if(html[end]==='}'&&!--depth){end++;break;}
 }
 if(depth!==0)throw Error('Unbalanced original function '+name);
 return html.slice(start,end);
}
test('W295 joins every real valley tile and keeps detailed farm-market ground',()=>{
 const sandbox={
  HORIZON_MIN:-43,HORIZON_STEP:2.1,HORIZON_SEGMENTS:41,
  data:[],valleySurfaceBuildStats:null,
  shadeValleySurfaceVertex:(x,z)=>[x,Math.sin(x*.05+z*.03),z,0,1,0,.5,.5,.5,0]
 };
 vm.runInNewContext(originalSourceFunction('buildValleySurface')+'; buildValleySurface()',sandbox);
 const audit=sandbox.valleySurfaceBuildStats;
 expect(audit.tiles).toBe(41*41);
 expect(audit.fineTiles).toBeGreaterThan(180);
 expect(audit.coarseTiles).toBeGreaterThan(1200);
 expect(audit.fineTiles+audit.coarseTiles).toBe(audit.tiles);
 expect(audit.allTerrainTilesPreserved).toBe(true);
 expect(audit.fullResolutionFarmAndMarket).toBe(true);
 expect(audit.sharedWorldEdges).toBe(true);
 expect(audit.changesAuthority).toBe(false);
 expect(audit.changesNavigation).toBe(false);
 expect(audit.extraBuffers).toBe(0);
 expect(audit.triangles).toBe(4*audit.fineTiles+2*audit.coarseTiles);
 expect(audit.triangles).toBeLessThan(4100);
 expect(sandbox.data.length).toBe(audit.triangles*30);
 expect(sandbox.data.every(Number.isFinite)).toBe(true);
 // Every tile retains both triangles, including distant ridge and river bank.
 const trianglesPerCell=audit.triangles/audit.tiles;
 expect(trianglesPerCell).toBeGreaterThanOrEqual(2);
});
test('W295 retains connected far/middle/near original conifer crowns and jobs',()=>{
 const tree=originalSourceFunction('tree');
 expect(tree).toContain('for(let tier=0;tier<4;tier++)');
 expect(tree).toContain("coniferTierCanopy(centerX,baseY-.20*s,centerZ,");
 expect(tree).toContain("const spokes=detailTier==='far'?2:detailTier==='mid'?4:8;");
 expect(tree).toContain('taperedBranch(branchRoot,branchTip');
 expect(tree).toContain('coniferNeedleSpray(branchRoot,branchTip');
 expect(tree).not.toMatch(/Math\.random\s*\(/);
 expect(html).toContain('allTreesPreserved:true,additionalCanopyTriangles:0');
 // These are still the original two distinct forest tiers, not deleting trees.
 expect(originalSourceFunction('forestDetailTier')).toContain("r<19?'near':r<29?'mid':'far'");
});