'use strict';
// W255 regression contract: genuinely loaded grain -> physical market hand -> credited stock.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function extract(name){
 const from=src.indexOf('function '+name+'(');
 assert.ok(from>=0,'Missing actual production function '+name);
 const end=src.indexOf('\n}',from);
 assert.ok(end>from,'Cannot delimit actual production '+name);
 return src.slice(from,end+2);
}
const sack=extract('emitLivedCanvasSack');
const draws=[];
const sink={data:[],MATERIAL:{GENERAL:0,WOOD:1},rgb:c=>c,
 materialScope:(_material,callback)=>callback(),
 ellipsoid:(...a)=>draws.push(['body',...a]),
 cylinder:(...a)=>draws.push(['neck',...a]),
 limbSegment:(...a)=>draws.push(['seam',...a]),
 box:(...a)=>draws.push(['base',...a])};
vm.runInNewContext(sack,sink);
const body=sink.emitLivedCanvasSack(0,1.2,0,.26,.29,.26,2);
assert.ok(draws.some(d=>d[0]==='body'),'Physically modeled full sack missing');
assert.ok(draws.some(d=>d[0]==='neck'),'Tied upper neck missing');
assert.ok(draws.filter(d=>d[0]==='seam').length>=4,'Articulated cloth seam/wrapping absent');
assert.ok(draws.length<=22,'Per-bag source must remain bounded');
assert.ok(draws.every(d=>JSON.stringify(d).indexOf('null')===-1),'Nonfinite sack geometry');
assert.ok(body&&body.authoritativeInventoryUnchanged===true,'Render must never book a trade');
const focus=extract('realReceiptCameraFocus');
const env={getMarketParcelDeliveryPose:()=>({citizen:'Bram',escrowed:true,
 wrist:[.15,.92,10.23],citizenFacingRadians:0,parcels:[
 {contact:'cart-to-hand',position:[.7,.9,10.25],index:0},
 {contact:'wrist-to-dock',position:[.5,.8,10.85],index:1}]}),
 isMarketUnloading:p=>p.delivery?.stage==='unloading',
 terrain:()=>.1,Math};
vm.runInNewContext(focus,env);
assert.equal(env.realReceiptCameraFocus({name:'Bram',delivery:{stage:'travel',id:'Bram:1',escrowed:true}}),null,
 'Never direct a market-unloading shot without real unloading');
assert.equal(env.realReceiptCameraFocus({name:'Bram'}),null,'No invented consignment');
const actor={name:'Bram',x:.15,z:10.20,delivery:{stage:'unloading',id:'Bram:1',escrowed:true}};
const view=env.realReceiptCameraFocus(actor);
assert.ok(view&&view.contact==='wrist-to-dock'&&view.deliveryId==='Bram:1','Cannot follow actual hand-to-dock transfer');
assert.ok(view.target.every(Number.isFinite)&&Math.hypot(view.target[0]-actor.x,view.target[2]-actor.z)<2.5,
 'Camera aims far away from the worker');
assert.equal(view.authorityModified,false,'No presentation mutation of source truth');
assert.match(src,/const realMarketAim=unloading\?realReceiptCameraFocus\(citizen\):null;/,
 'Physical documentary lens must use real market contact');
assert.match(src,/unloading\?\(portraitLens\?\[[^\]]+\]:\[3\.8,4\.4,5\.1,5\.7,6\.8\]\)/,
 'Near market orbit must remain physically collision surveyed');
const calls=(src.match(/emitLivedCanvasSack\(/g)||[]).length;
assert.ok(calls>=5,'Farm, granary, market inventory, unloading and receipt must share original 3D cloth');
console.log('W255 PASS shared original grain fabric, physically evidenced parcel documentary lens and bounded geometry');