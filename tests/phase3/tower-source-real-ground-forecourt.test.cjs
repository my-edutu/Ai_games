const test=require('node:test'),a=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{resolve}=require('node:path');
const {readFileSync}=require('node:fs');
const src=()=>import(pathToFileURL(resolve(__dirname,'../../public/infinite-tower-climb/visuals/source-real-ground-forecourt.mjs')));
const ground={id:'f9:ground',x:0,width:480000};
const cap={id:'f8:cap',x:115200,width:249600};
test('real f9 ground panels cover exactly one existing walkable roof',async()=>{
 const {sourceRealGroundForecourtSections:s}=await src();
 const bands=s(ground,480000,304896,cap);
 a.ok(bands?.length>=5);
 a.equal(bands[0].startX,0);a.equal(bands.at(-1).endX,480000);
 a.ok(Math.abs(bands.reduce((total,v)=>total+v.angle,0)-2.2)<1e-10);
 a.ok(bands.every((v,k)=>v.endX>v.startX&&
   (k===0||v.startX===bands[k-1].endX)));
 a.deepEqual([...new Set(bands.filter(v=>v.wing).map(v=>v.wing))],
   ['before','after']);
 for(const invalid of [null,{...cap,id:'f7:cap'},
   {...cap,width:0},{...cap,x:0}])
   a.equal(s(ground,480000,304896,invalid),null);
 a.equal(s({...ground,id:'f9:p2'},480000,304896,cap),null);
});
test('the source hero and near-future authentic route override outer roof culling',async()=>{
 const {sourceRealRoofWingExposure:s}=await src();
 const v={floor:9,theme:'void',lifecycle:'running',runToken:'r',
   player:{x:304896,halfWidth:4000,health:5}};
 const h={floor:9,oldCapId:'f8:cap',runToken:'r',oldCapX:115200,
   oldCapWidth:249600,guardianGateRetained:true,
   originalGatewayOpacity:1,submittedFrames:2,visibleSeconds:.15};
 a.equal(s(v,h,'before'),.16);a.equal(s(v,h,'after'),.16);
 a.equal(s({...v,player:{...v.player,x:330000}},h,'after'),1);
 a.equal(s({...v,player:{...v.player,x:128000}},h,'before'),1);
 a.equal(s(v,{...h,submittedFrames:16,visibleSeconds:1.5},'after'),1);
 a.equal(s(v,{...h,guardianGateRetained:false},'after'),1);
 a.equal(s({...v,runToken:'other'},h,'before'),1);
});
test('wing palette follows real roof parent and immediately retires on changed source',async()=>{
 const {syncSourceRealRoofWingMaterials:s}=await src();
 class C{constructor(v){this.v=v}copy(o){this.v=o.v;return this}}
 const parent={color:new C(55),emissive:new C(33)};
 const material={color:new C(0),emissive:new C(0),opacity:.16,
   transparent:true,depthWrite:false};
 const palette={roofJoin:{wingMaterials:[{material,parent,wing:'before'}]}};
 a.equal(s(palette,{floor:8},null),true);
 a.equal(material.opacity,1);a.equal(material.color.v,55);
 a.equal(material.emissive.v,33);a.equal(material.transparent,false);
 a.equal(material.depthWrite,true);
});
test('real F9 walking, rim and beam use source wing geometry; authority untouched',()=>{
 const w=readFileSync(resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 for(const v of ['sourceRealGroundForecourtSections(p,width',
   'sourceRoofWing(baseMaterial,band)','sourceRoofWing(edge,band)',
   'sourceRoofWing(beam,band)','syncSourceRealRoofWingMaterials(arrivalRoutePalette,snapshot,retainedEarnedCap)'])
   a.ok(w.includes(v),v);
 a.ok(!w.includes("platforms.set('ActualF9GroundOuterWing"));
});
