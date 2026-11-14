'use strict';
// W327: source-pinned original LIVE farmland grove / distant-forest VBO
// redistribution. No extra tree, worker, cart, economy or RNG authority.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(begin>=0&&end>begin);
new vm.Script(html.slice(begin+8,end),{filename:'tiny-kingdom-production.js'});
const a=html.indexOf('function forestDetailTier(');
const b=html.indexOf('function coniferNeedleSpray(',a);
assert(a>0&&b>a);
const tier=vm.runInNewContext(html.slice(a,b)+'\nforestDetailTier;');
for(const [x,z,want] of [[0,0,'near'],[22,0,'mid'],[36,0,'far'],
 [20.15,-8.96,'near'],[22.74,-9.65,'near']])
 assert.equal(tier(x,z),want,'fixed site must retain its certified detail');
const crownStart=html.indexOf('function woodlandCrownContour(');
const crownEnd=html.indexOf('function leafBlade(',crownStart);
assert(crownStart>0&&crownEnd>crownStart);
let triangles=0;
const context={Math,Number,Array,Error,forestVisualStats:{broadleafLobes:0,microCrownLobes:0},
 tri:(p,q,r)=>{assert([p,q,r].every(v=>v.every(Number.isFinite)));triangles++}};
vm.createContext(context);
vm.runInContext(html.slice(crownStart,crownEnd)+'\nthis.emitCrown=crownLobe;',context);
const size=t=>{
 triangles=0;context.emitCrown(0,2,0,1,1,1,[.5,.7,.5],.5,false,false,t);
 return triangles;
};
assert.equal(size(false),54,'near trees remain full articulated 3D crowns');
assert.equal(size(true),28,'mid trees preserve previously proven silhouette');
assert.equal(size('far'),20,'distant 3D crown cuts eight subpixel triangles');
const wood=html.slice(html.indexOf('function tree('),
 html.indexOf('// W110:',html.indexOf('function tree(')));
assert.match(wood,/detailTier==='far'\?'far':detailTier!=='near'/);
assert.match(wood,/detailTier==='far'\?34:26/);
assert.match(wood,/workingFieldEdgeNearTrees\+\+/);
assert.match(html,/forestLodStats=\{renderedTrees:0,nearTrees:0,midTrees:0,farTrees:0,\n  workingFieldEdgeNearTrees:0/);
assert.match(html,/farmMarketStreet\(\)/);
assert.match(html,/drawResidentFarmFields\(eye,planes/);
console.log('W327 original production RED-before / GREEN-after: truthful 54/28/20 canopy, real field-edge near forest, no changed authority; real gameplay/Day120/physical GPU NOT PROVEN.');
