'use strict';
// W509: real escrowed courier keeps ONE authentic GPU-skinned sculpt and
// ONE continuously live physical handcart; never a staged actor or stock.
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(begin>=0&&end>begin,'playable source exists');
new Function(html.slice(begin+8,end));
function extract(name){
 const i=html.indexOf('function '+name+'(');
 assert(i>=0,'missing source function '+name);
 const open=html.indexOf('{',i);let depth=0,j=open;
 do {if(html[j]==='{')depth++;else if(html[j]==='}')depth--;j++}
 while(depth&&j<html.length);
 assert.equal(depth,0,'unbalanced function '+name);
 return html.slice(i,j);
}
const admission=extract('isOriginalGpuCourierBodyCandidate');
for(const token of ['isLoadedCourierOnRoad(p)','isMarketUnloading(p)',
 'nearPeople.has(i)','projectRealCitizenDetail(p,frame)',
 'p.delivery?.escrowed','heightFraction'])
 assert(admission.includes(token),'real delivery/optical admission: '+token);
const body=extract('villager');
assert(body.includes('omitLiveCart=false'));
assert(body.includes('if(!omitLiveCart)emitStreetCargo(p,x,y,z,size);'),
 'GPU body must NOT include duplicated cart when split is admitted');
const cart=extract('renderOriginalLiveCourierCart');
for(const token of ['isLoadedCourierOnRoad(p)','emitStreetCargo(p,x,y,z,size)',
 'rotateOriginalCourierCartVertices'])
 assert(cart.includes(token),'live cart is bound to real delivery: '+token);
const foreground=extract('prepareForegroundResidents');
for(const token of ['isOriginalGpuCourierBodyCandidate(p,i,nearPeople,frame)',
 'villager(p,courierSkin)','separateLiveCart:courierSkin'])
 assert(foreground.includes(token),'resident real sculpt cannot duplicate cart: '+token);
assert(html.includes('if(entry.separateLiveCart)renderOriginalLiveCourierCart(p);'),
 'only admitted real GPU bodies receive separate, genuinely rolling carts');
assert(html.includes('getOriginalLiveCourierSkinAudit,'),
 'read-only audit must be exported for actual running game');
const rotate=extract('rotateOriginalCourierCartVertices');
const fn=new Function(rotate+';return rotateOriginalCourierCartVertices;')();
const initial=new Float32Array(30);
for(let v=0;v<3;v++){
 const o=v*10;initial[o]=3+v;initial[o+1]=.35;initial[o+2]=7;
 initial[o+3]=1;initial[o+4]=0;initial[o+5]=0;
 initial[o+6]=.45;initial[o+7]=.4;initial[o+8]=.3;initial[o+9]=1;
}
const copy=initial.slice();
assert.equal(fn(copy,0,3,7,0),3,'one real triangle, no invisible deletion');
assert.deepEqual(Array.from(copy),Array.from(initial),'zero rotation exact');
const turned=initial.slice();
assert.equal(fn(turned,0,3,7,Math.PI/2),3);
for(let v=0;v<3;v++){
 const o=v*10;
 assert(Math.abs(turned[o]-3)<1e-5,'cart world x tied to real root');
 assert(Math.abs(turned[o+2]-(7-v))<1e-5,'cart world z uses real facing');
 assert(Math.abs(turned[o+3])<1e-5,'cart normal rotates with real object');
 assert(Math.abs(turned[o+5]+1)<1e-5,'cart normal z rotates');
 assert.equal(turned[o+1],initial[o+1],'actual wheel heights preserved');
}
assert.throws(()=>fn(new Float32Array(13),0,0,0,0),/triangle/);
// The loaded original body must retain the SAME torso lean/crouch as the
// CPU villager while each GPU bone moves the real hauling wrists. A GPU
// upright bind would visibly disconnect fingers from live cart shafts.
const detailed=extract('workSkinDetailedPoint');
const detailedPoint=new Function(detailed+';return workSkinDetailedPoint;')();
const rig={working:false,hauling:true,acting:{lean:.20,crouch:.08}};
const body={spineShift:0,forwardLean:0,rise:0};
const bind={x:18,z:1,ground:.5,angle:0,scale:1};
const q=[.3,1.05,.2],raised=q[1]-.44;
const expected=[18+.3,.5+q[1]-.08*Math.min(1,raised/.65),
 1+q[2]+raised*.20];
const actual=detailedPoint(q,rig,body,bind);
for(let i=0;i<3;i++)assert(Math.abs(actual[i]-expected[i])<1e-7,
 'real hauling wrist/torso must match original CPU lean at component '+i);
const nonunit=initial.slice();nonunit[3]=3;
fn(nonunit,0,3,7,Math.PI/2);
assert(Math.abs(nonunit[5]+1)<1e-5,
 'original CPU cart normals must be normalized after facing');

console.log('W509 source+3D cargo transform PASS. Real WebGL video, native FPS and blind critic remain separately gated.');
