'use strict';
// W244: test-first original-living-village farm-gate sightline and near/mid
// forest silhouette resource contract. The new open gate must be the genuine
// navigation gate, and all trees/citizens/homes must remain in the world.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=src.indexOf('<script>'),end=src.lastIndexOf('</script>');
assert(start>=0&&end>start,'production world script must exist');
new vm.Script(src.slice(start+8,end),{filename:'tiny-kingdom-production.js'});
const forestStart=src.indexOf('function forestDetailTier(');
const forestEnd=src.indexOf('function coniferNeedleSpray(',forestStart);
assert(forestStart>0&&forestEnd>forestStart);
const tier=vm.runInNewContext(src.slice(forestStart,forestEnd)+'\nforestDetailTier;');
assert.equal(tier(0,0),'near');
assert.equal(tier(22,0),'mid','central near wood remains expressive, mid wood keeps 3D canopy');
assert.equal(tier(36,0),'far');
const trees=src.slice(src.indexOf('function tree('),src.indexOf('// W110:',src.indexOf('function tree(')));
assert.match(trees,/detailTier!=='near'/,'middle-distance crowns need bounded 3D roofline silhouette policy');
assert.match(trees,/detailTier==='near'\?2:0/,'far/mid decorative tiny crown satellites should not cost frames');
assert.match(trees,/false,true,detailTier!=='near'/,'main and center crown keep complete 3D surfaces');
assert.match(trees,/detailTier==='near'\?5:3/,'visible near leaves retain richer wind-responsive blade anatomy');
assert.match(trees,/forestVisualStats\.deciduous\+\+/);
assert.match(trees,/forestVisualStats\.conifers\+\+/);
const gateStart=src.indexOf('let farmFencePresentationAudit=');
const gateEnd=src.indexOf('function well(',gateStart);
assert(gateStart>0&&gateEnd>gateStart,'real field-gate geometry must belong to the existing static civic buffer');
const boxes=[],slabs=[],woven=[],context={
 MATERIAL:{STONE:2,WOOD:3},rgb:()=>[.5,.4,.3],
 terrain:(x,z)=>.12*Math.sin(x*.1+z*.15),walkable:()=>true,
 materialScope:(_type,fn)=>fn(),
 box:(x,y,z,w,h,d)=>{assert([x,y,z,w,h,d].every(Number.isFinite));boxes.push({x,y,z,w,h,d})},
 quad:(a,b,c,d)=>{assert([a,b,c,d].every(v=>v.every(Number.isFinite)));woven.push([a,b,c,d])},
 upwardRoadQuad:(a,b,c,d)=>{assert([a,b,c,d].every(p=>p.every(Number.isFinite)));slabs.push([a,b,c,d])}
};
vm.createContext(context);
vm.runInContext(src.slice(gateStart,gateEnd)+'\nthis.emitFence=fenceLine;this.inspectGate=getFarmFencePresentationAudit;',context);
context.emitFence(16,-2,6,false,[21.7,-2.45]);
const audit=context.inspectGate();
assert.equal(audit.open,true,'genuine field-to-granary gate must be optically open');
assert.equal(audit.openSpanMetres,3,'unobstructed opening must fit a loaded real courier');
assert.equal(audit.addedActors,0);assert.equal(audit.changesNavigation,false);
assert.equal(woven.length,48,'four surviving genuine sections have 24 triangles each');
assert(slabs.length>=5&&slabs.length<=12,'flush genuine road threshold should be bounded');
assert(!boxes.some(b=>b.w>1.4&&b.x>20.5&&b.x<23.5&&b.z===-2),
 'old full opaque fence bars cannot bisect a filmed genuine worker');
assert(!boxes.some(b=>b.w<.2&&b.x>20.5&&b.x<23.5&&b.z===-2),
 'no floating center post in the actual open 3-metre cart gate');
boxes.length=0;slabs.length=0;woven.length=0;
context.emitFence(16,4,6);
assert.equal(boxes.length,7,'all seven original fence posts remain intact');
assert.equal(woven.length,72,'all six original sections remain; three double-sided woven courses have exactly 24 triangles/section');
assert.equal(slabs.length,0,'no invented gate at any unlinked boundary');
assert.match(src,/fenceLine\(16,-2,6,false,FIELD_TO_GRANARY_GATE\)/,
 'original actual field gate must connect to the existing farm plot fence');
console.log('W244 production farm-gate and mid-distance 3D forestry contract PASSED (source/geometry only; WebGL, Day120 and physical FPS still required)');
