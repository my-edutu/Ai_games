'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=source.indexOf('function emitStreetCargo(');
const end=source.indexOf('// A recent real labor event',start);
assert.ok(start>0&&end>start,'real courier freight renderer exists');
const excerpt=source.slice(start,end);
assert.match(excerpt,/p\.delivery/);
assert.match(excerpt,/getCourierLoadPresentation/);
assert.match(excerpt,/courierWheelTrails\.get\(p\.delivery\.id\)/);
assert.match(excerpt,/for\(let ring=0;ring<8;ring\+\+\)/);
assert.match(excerpt,/for\(let spoke=0;spoke<5;spoke\+\+\)/);
assert.match(excerpt,/materialScope\(MATERIAL\.GENERAL/);
assert.ok(!/Math\.random\(|state\s*\.|deliveryReceipts\.(push|splice)/.test(excerpt),
 'cargo mesh cannot invent real-world transactions or random draws');
const data=[],points=[],stats={boxes:0,quad:0,segments:0,cylinders:0};
const add=triangles=>{for(let i=0;i<triangles*30;i++)data.push(0)};
const vec=v=>{assert.ok(Array.isArray(v)&&v.length===3&&v.every(Number.isFinite));
 points.push(v.slice());return v};
let realVisibleBundles=3;
const context={
 data,Math,COURIER_CART_GRIP:{lateral:.28,height:.76,back:.37},
 CART_WHEEL_RADIUS:.20,DELIVERY_UNLOAD_HOURS:1,
 compactCitizenAnimation:{lastAnimatedCartWheels:0},
 MATERIAL:{GENERAL:0,WOOD:6},
 materialScope:(_m,fn)=>fn(),
 rgb:n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255],
 box:(x,y,z,w,h,d)=>{assert.ok([x,y,z,w,h,d].every(Number.isFinite));
 assert.ok(w>0&&h>0&&d>0);stats.boxes++;add(12)},
 quad:(a,b,c,d)=>{vec(a);vec(b);vec(c);vec(d);stats.quad++;add(2)},
 limbSegment:(a,b,r,_c,sides=7)=>{vec(a);vec(b);assert.ok(r>0);
 stats.segments++;add(sides*2)},
 ellipsoid:(x,y,z,a,b,c,_col,sides=6)=>{assert.ok([x,y,z,a,b,c].every(Number.isFinite));add(sides*10)},
 cylinder:(x,y,z,r,h,_col,sides=6)=>{assert.ok([x,y,z,r,h].every(Number.isFinite));stats.cylinders++;add(sides*4)},
 isMarketUnloading:p=>p.delivery?.stage==='unloading',
 streetCargoWitness:()=>null,
 getCourierLoadPresentation:()=>({visibleBundles:realVisibleBundles,bodyPackVisible:true}),
 courierWheelTrails:new Map([['Bram:32',{distance:9.4}]]),
};
vm.runInNewContext(excerpt,context,{filename:'W288-authentic-courier-renderer.js'});
const worker={name:'Bram',job:'farmer',phase:2.14,workTimer:0,
 delivery:{id:'Bram:32',resource:'food',stage:'travel',amount:3.024,escrowed:true}};
context.emitStreetCargo(worker,18,.2,1,1);
const loadedTris=data.length/30;
assert.ok(loadedTris>150&&loadedTris<900,'original loaded handcart bounded');
assert.equal(context.compactCitizenAnimation.lastAnimatedCartWheels,2);
assert.ok(points.every(v=>v.every(Number.isFinite)),'all geometric vertices finite');
assert.ok(stats.boxes>=6&&stats.quad>=60,'complete chassis, wheels, physical sacks');
realVisibleBundles=0;
context.emitStreetCargo({...worker,delivery:{...worker.delivery,stage:'unloading'}},18,.2,1,1);
const unloadedTris=data.length/30-loadedTris;
assert.ok(unloadedTris<loadedTris,'original handcart visibly sheds actual escrow-backed parcels');
assert.equal(context.compactCitizenAnimation.lastAnimatedCartWheels,4);
const prev=data.length;
context.emitStreetCargo({name:'Nobody',job:'farmer',phase:0,delivery:null},18,.2,1,1);
assert.equal(data.length,prev,'no fake handcart for a citizen with no real consignment');
for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
 if(match[1].trim())new vm.Script(match[1],{filename:'tiny-kingdom-inline-production.js'});
}
console.log('W288 genuine courier joinery and cargo rendering PASS; loaded triangles='+
 loadedTris+', empty-cart triangles='+unloadedTris+
 '; actual source-executed geometry only; no browser, FPS or experience PASS');
