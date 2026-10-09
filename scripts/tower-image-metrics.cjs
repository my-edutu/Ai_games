'use strict';
// Dependency-free PNG evaluator for objective Gauntlet evidence. Does not pretend
// image statistics replace side-by-side artistic judgment against Jusant.
const zlib=require('node:zlib');
function analyzePng(buffer,{region=[.16,.12,.84,.88],stride=4}={}){
 if(!Buffer.isBuffer(buffer)||buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Not a PNG image');
 let w=0,h=0,depth=0,color=0,interlace=0,at=8;const chunks=[];
 while(at+12<=buffer.length){
   const n=buffer.readUInt32BE(at),type=buffer.toString('ascii',at+4,at+8),start=at+8;
   if(start+n+4>buffer.length)throw new Error('Truncated PNG');
   if(type==='IHDR'){
     w=buffer.readUInt32BE(start);h=buffer.readUInt32BE(start+4);
     depth=buffer[start+8];color=buffer[start+9];interlace=buffer[start+12];
   }else if(type==='IDAT')chunks.push(buffer.subarray(start,start+n));
   else if(type==='IEND')break;
   at=start+n+4;
 }
 if(!w||!h||w>10000||h>10000||depth!==8||interlace!==0||![2,6].includes(color))throw new Error('Unsupported PNG format');
 const bpp=color===6?4:3,rowBytes=w*bpp,raw=zlib.inflateSync(Buffer.concat(chunks));
 if(raw.length<(rowBytes+1)*h)throw new Error('PNG data length mismatch');
 const histogram=new Set();let sum=0,sum2=0,r=0,g=0,b=0,dark=0,count=0;
 const rows=[new Uint8Array(rowBytes),new Uint8Array(rowBytes)];
 const x0=Math.max(0,Math.floor(region[0]*w)),x1=Math.min(w,Math.ceil(region[2]*w));
 const y0=Math.max(0,Math.floor(region[1]*h)),y1=Math.min(h,Math.ceil(region[3]*h));
 for(let y=0;y<h;y++){
   const dest=rows[y%2],previous=rows[1-y%2],offset=y*(rowBytes+1),filter=raw[offset];
   if(filter>4)throw new Error('PNG filter unsupported');
   for(let i=0;i<rowBytes;i++){
     const cur=raw[offset+1+i],left=i>=bpp?dest[i-bpp]:0,above=y?previous[i]:0,
       upperLeft=y&&i>=bpp?previous[i-bpp]:0;
     let predict=0;
     if(filter===1)predict=left;
     else if(filter===2)predict=above;
     else if(filter===3)predict=Math.floor((left+above)/2);
     else if(filter===4){
       const p=left+above-upperLeft,pa=Math.abs(p-left),pb=Math.abs(p-above),pc=Math.abs(p-upperLeft);
       predict=pa<=pb&&pa<=pc?left:pb<=pc?above:upperLeft;
     }
     dest[i]=(cur+predict)&255;
   }
   if(y<y0||y>=y1||y%stride)continue;
   for(let x=x0;x<x1;x+=stride){
     const i=x*bpp,R=dest[i],G=dest[i+1],B=dest[i+2],lum=.2126*R+.7152*G+.0722*B;
     sum+=lum;sum2+=lum*lum;r+=R;g+=G;b+=B;count++;
     if(lum<12)dark++;
     histogram.add(((R>>4)<<8)|((G>>4)<<4)|(B>>4));
   }
 }
 if(!count)throw new Error('No pixels sampled');
 const mean=sum/count,variance=Math.max(0,sum2/count-mean*mean);
 return {width:w,height:h,samples:count,meanLuminance:+mean.toFixed(2),
   luminanceStdDev:+Math.sqrt(variance).toFixed(2),darkFraction:+(dark/count).toFixed(3),
   uniqueQuantizedColors:histogram.size,meanRGB:[r,g,b].map(x=>+(x/count).toFixed(2))};
}
function assertVisualMinimum(report){
 if(report.meanLuminance<8||report.meanLuminance>246)throw new Error('3D evidence is nearly blank');
 if(report.luminanceStdDev<7)throw new Error('3D evidence has no meaningful scene contrast');
 if(report.uniqueQuantizedColors<24)throw new Error('3D evidence lacks real color detail');
 if(report.darkFraction>.92)throw new Error('3D scene almost entirely black');
 return report;
}
module.exports={analyzePng,assertVisualMinimum};
if(require.main===module){const fs=require('node:fs');const report=analyzePng(fs.readFileSync(process.argv[2]));console.log(JSON.stringify(report,null,2));assertVisualMinimum(report);}
