'use strict';
// Actual production WebGL source-executed W444 genuine courier/body regression.
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function between(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);
 assert(i>=0&&j>i,'Original production function missing '+a);
 return html.slice(i,j)}
test('authentic food delivery renders actual physical cart once, without second oversized backpack',()=>{
 const drawn={boxes:0,quads:0,ellipsoids:0};
 const env=vm.createContext({Math,Map,
  COURIER_CART_GRIP:{lateral:.35,height:.4,back:.5},
  CART_WHEEL_RADIUS:.2,courierWheelTrails:new Map(),
  compactCitizenAnimation:{lastAnimatedCartWheels:0},
  MATERIAL:{WOOD:1,GENERAL:2},rgb:()=>[.5,.5,.5],
  materialScope:(_id,fn)=>fn(),isMarketUnloading:p=>p.delivery?.stage==='unloading',
  streetCargoWitness:()=>({resource:'food',amount:2}),
  getCourierLoadPresentation:()=>({bodyPackVisible:true,visibleBundles:3}),
  box:()=>drawn.boxes++,quad:()=>drawn.quads++,
  ellipsoid:()=>drawn.ellipsoids++,cylinder:()=>{},limbSegment:()=>{}});
 vm.runInContext(between('function emitStreetCargo(','// A recent real labor event'),env);
 const actor=vm.runInContext('emitStreetCargo',env);
 actor({name:'Bram',job:'farmer',phase:1,delivery:{
  id:'Bram:32',resource:'food',amount:3.024,stage:'travel',escrowed:true}},16,0,1,1);
 assert(drawn.boxes>=6&&drawn.quads>=25,'Original occupied wagon missing');
 assert.equal(vm.runInContext('compactCitizenAnimation.lastAnimatedCartWheels',env),2);
 assert.equal(drawn.ellipsoids,2,'Two axle hubs, no duplicate body-mounted food');
 const old=drawn.ellipsoids;
 actor({name:'Bram',job:'farmer',phase:1,delivery:null},16,0,1,1);
 assert.equal(drawn.ellipsoids,old+1,'Off-delivery authentic workday pack must remain');
});
test('near and compact citizen bodies both attach jaw, shorten wool, expose genuine IK knees',()=>{
 const anatomy=vm.runInNewContext(between('const CITIZEN_HEAD_ANATOMY=Object.freeze(',
  'function rescaleCitizenHead(')+';getCitizenAnatomy();',{Object,Math});
 assert(anatomy.headHorizontalScale<=.7&&anatomy.headVerticalScale>=.52);
 assert(anatomy.neckPivot>=1.2&&anatomy.neckPivot<=1.30);
 const jaw=anatomy.neckPivot+(1.185-anatomy.neckPivot)*anatomy.headVerticalScale;
 assert(jaw<1.24,'Emitted real jaw floats over body instead of meeting neck');
 const person={job:'farmer',phase:0},rig={traveling:false,working:false,legs:[],acting:{lean:0}};
 const profile=new Function('medievalCitizenIdentity',between(
  'function livedAdultGarmentProfile(','// W390 continuous original adult workcoat shading')+
  ';return garmentProfile;')(()=>({name:'real',shoulder:.03,waist:.02,hem:.03}));
 const farmer=profile(person,0,rig),merchant=profile({job:'merchant',phase:0},1,rig);
 assert(farmer.rings[0].y>=.45&&merchant.rings[0].y>=.40);
 assert(farmer.rings[0].rx<.29);
 assert.match(html,/\{y:\.445,rx:fit\.hem,rz:\.221/);
 assert.match(html,/y:\.497,rx:rings\[0\]\.rx/);
 assert.match(html,/\.099\*size,\.073\*size,c,6/);
 assert.match(html,/\.095\*s,\.068\*s,cloth,4/);
});
test('full real playable WebGL JavaScript parses',()=>{
 const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
 assert.doesNotThrow(()=>new vm.Script(js));
});