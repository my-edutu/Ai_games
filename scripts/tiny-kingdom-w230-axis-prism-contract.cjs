'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const segment=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'missing renderer marker '+a);return html.slice(i,j);};
const writer=segment('function packedFlatQuad(','const PACKED_RING_MAX=');
const optimized=segment('let axisBoxEmissions=','function cylinder(');
assert.match(optimized,/function packedAxisQuad\(/);
assert.match(optimized,/axisBoxFallbackEmissions\+\+/);
const reference=`function box(x,y,z,w,h,d,col){
 const xa=x-w/2,xb=x+w/2,za=z-d/2,zb=z+d/2,ya=y,yb=y+h;
 packedFlatQuad(xa,ya,za,xa,yb,za,xb,yb,za,xb,ya,za,col);
 packedFlatQuad(xb,ya,zb,xb,yb,zb,xa,yb,zb,xa,ya,zb,col);
 packedFlatQuad(xa,ya,zb,xa,yb,zb,xa,yb,za,xa,ya,za,col);
 packedFlatQuad(xb,ya,za,xb,yb,za,xb,yb,zb,xb,ya,zb,col);
 packedFlatQuad(xa,yb,za,xa,yb,zb,xb,yb,zb,xb,yb,za,col);
 packedFlatQuad(xa,ya,zb,xa,ya,za,xb,ya,za,xb,ya,zb,col);
}
`;
function compile(body){
 const get=new Function('let data=[],currentMaterial=7;'+writer+body+
  'return {box,data,counts:()=>[typeof axisBoxEmissions==="undefined"?0:axisBoxEmissions,typeof axisBoxFallbackEmissions==="undefined"?0:axisBoxFallbackEmissions]}');
 return get();
}
const a=compile(reference),b=compile(optimized);
const samples=[];
for(let n=0;n<80;n++)samples.push([n*.37-18,2+n*.023,n*.28-12,.2+n*.02,.4+n*.03,.15+n*.025,[n/100,.55,1-n/100]]);
samples.push([0,0,0,0,2,3,[.5,.4,.3]],[1,1,1,2,-1,3,[.5,.4,.3]],
 [1,1,1,2,3,-1,[.5,.4,.3]],[1,1,1,2,0,3,[.5,.4,.3]],
 [NaN,1,2,1,2,3,[.5,.4,.3]]);
for(const sample of samples){a.box(...sample);b.box(...sample)}
assert.equal(a.data.length,b.data.length);
for(let i=0;i<a.data.length;i++)
 assert.ok(Object.is(a.data[i],b.data[i]),'original prism vertex/normal changed at '+i);
assert.deepEqual(b.counts(),[80,5]);
assert.equal(a.data.length/30,samples.length*12);
assert.ok(html.includes('function farmMarketStreet(')&&html.includes('function marketQuarter('));
console.log('W230 original prism exact vertex/normal/material parity:',samples.length,
 'prisms; optimized 80, original fallback 5, authority unchanged');
