'use strict';
// W365: exercise ACTUAL in-game courier cart and back-harness renderer; this
// isolated source harness cannot claim running visual parity or mobile FPS.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const scriptStart=html.indexOf('<script>'),scriptEnd=html.indexOf('</script>',scriptStart);
assert(scriptStart>=0&&scriptEnd>scriptStart,'original game script markers missing');
const game=html.slice(scriptStart+8,scriptEnd);
assert(game,'true kingdom production renderer missing');
new Function(game);
const begin=game.indexOf('function emitStreetCargo(');
const end=game.indexOf(String.fromCharCode(10)+'}',begin)+2;
assert(begin>=0&&end>begin,'actual physical courier asset source missing');
const source=game.slice(begin,end);
assert(source.includes('W365 physical courier reconstruction'));
assert(!source.includes('box(cx,cy,cz,.38*size,.49*size,.13*size,brown)'),
 'reject old rigid torso-height wooden prototype cargo plate');
let state={food:200,wood:90,gold:40},city=[[0,0,0]];
const calls={box:[],quad:[],limb:[],taper:[],ellipsoid:[],cylinder:[]};
const reset=()=>{for(const k in calls)calls[k].length=0};
const color=n=>n,mat={WOOD:6,GENERAL:0};
const originalDelivery={id:'shipment-1',resource:'food',amount:3};
const person={name:'Genuine farmer',phase:1.1,job:'farmer',delivery:originalDelivery,workTimer:0};
let unloading=false;
const make=new Function('isMarketUnloading','getCourierLoadPresentation',
 'streetCargoWitness','DELIVERY_UNLOAD_HOURS','rgb','MATERIAL','materialScope',
 'box','limbSegment','quad','ellipsoid','cylinder','taperedMedievalLimb',
 'COURIER_CART_GRIP','CART_WHEEL_RADIUS','courierWheelTrails','compactCitizenAnimation',
 source+';return emitStreetCargo');
let escrow={bodyPackVisible:true,visibleBundles:2};
const show=make(()=>unloading,()=>escrow,()=>null,.6,color,mat,
 (_,fn)=>fn(),(...a)=>calls.box.push(a),(...a)=>calls.limb.push(a),
 (...a)=>calls.quad.push(a),(...a)=>calls.ellipsoid.push(a),
 (...a)=>calls.cylinder.push(a),(...a)=>calls.taper.push(a),
 {lateral:.28,height:.77,back:-.18},.21,new Map([['shipment-1',{distance:1.54}]]),
 {lastAnimatedCartWheels:0});
const initial=JSON.stringify({state,city,person});
show(person,3,0,4,1);
assert(calls.box.length>=6,'real timber cart retains physical floor/frame');
assert(calls.quad.length>=40,'real iron-shod cart wheels, sacks and fabric retained');
assert(calls.taper.length>=4,'four shaped leather shoulder-harness sections');
assert(calls.ellipsoid.length>0,'real food must remain in the courier pack');
assert(!calls.box.some(a=>a[3]>=.37&&a[3]<=.39&&a[4]>=.48&&a[4]<=.50&&a[5]>=.12&&a[5]<=.14),
 'no old rigid wooden slab on the worker');
assert.equal(JSON.stringify({state,city,person}),initial);
reset();unloading=true;escrow={bodyPackVisible:false,visibleBundles:0};
show(person,3,0,4,1);
assert.equal(calls.taper.length,0,'after actual unloading the body harness is not falsely loaded');
assert(calls.box.length>0,'genuine wooden cart still exists during unloading');
assert.equal(JSON.stringify({state,city,person}),initial);
reset();unloading=false;person.delivery={id:'shipment-2',resource:'wood',amount:3};
escrow={bodyPackVisible:true,visibleBundles:2};
show(person,3,0,4,1);
assert(calls.limb.length>10,'actual timber logs remain carried and tied to the real courier');
assert.equal(JSON.stringify(state),JSON.stringify({food:200,wood:90,gold:40}));
console.log('W365 source contract PASS: cart, wheel, cargo, fitted harness and unloaded-body suppression; live appearance and hardware FPS NOT PROVEN');
