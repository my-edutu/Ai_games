'use strict';
// First-party image validation for exact browser screenshots. No external packages.
// Implements PNG RGB/RGBA8 scanline filters, records objectively measurable
// visual regression indicators without pretending they establish AAA parity.
const zlib=require('node:zlib');
function decodePng(bytes){
  const png=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
  if(png.length<33||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
    throw Error('Invalid PNG signature');
  let width=0,height=0,channels=0,bitDepth=0,interlace=0;
  const chunks=[];
  for(let offset=8;offset+12<=png.length;){
    const n=png.readUInt32BE(offset),name=png.toString('ascii',offset+4,offset+8);
    if(offset+12+n>png.length)throw Error('Truncated PNG '+name);
    const part=png.subarray(offset+8,offset+8+n);
    if(name==='IHDR'){
      width=part.readUInt32BE(0);height=part.readUInt32BE(4);
      bitDepth=part[8];channels=part[9]===2?3:part[9]===6?4:0;
      interlace=part[12];
    }
    if(name==='IDAT')chunks.push(part);
    offset+=12+n;
    if(name==='IEND')break;
  }
  if(!width||!height||width*height>10_000_000||bitDepth!==8||
    !channels||interlace!==0)throw Error('Unsupported PNG bitmap');
  const packed=zlib.inflateSync(Buffer.concat(chunks));
  const stride=width*channels,expected=(stride+1)*height;
  if(packed.length!==expected)throw Error('Unexpected PNG bytes '+packed.length);
  const data=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const input=y*(stride+1),output=y*stride,filter=packed[input];
    if(filter>4)throw Error('Unsupported PNG scanline filter');
    for(let x=0;x<stride;x++){
      const v=packed[input+1+x],a=x>=channels?data[output+x-channels]:0;
      const b=y>0?data[output-stride+x]:0;
      const c=y>0&&x>=channels?data[output-stride+x-channels]:0;
      let predictor=0;
      if(filter===1)predictor=a;
      else if(filter===2)predictor=b;
      else if(filter===3)predictor=Math.floor((a+b)/2);
      else if(filter===4){
        const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
        predictor=da<=db&&da<=dc?a:db<=dc?b:c;
      }
      data[output+x]=(v+predictor)&255;
    }
  }
  return {width,height,channels,data};
}
function measureFrame(buffer,frame={left:.17,top:.12,right:.85,bottom:.87}){
  const png=decodePng(buffer);
  const x0=Math.round(frame.left*png.width),x1=Math.round(frame.right*png.width);
  const y0=Math.round(frame.top*png.height),y1=Math.round(frame.bottom*png.height);
  let lum=0,dark=0,sat=0,sum=0,highlight=0,valid=0;
  for(let y=y0;y<y1;y+=2){
    for(let x=x0;x<x1;x+=2){
      const i=(y*png.width+x)*png.channels;
      const r=png.data[i]/255,g=png.data[i+1]/255,b=png.data[i+2]/255;
      if(png.channels===4&&png.data[i+3]<200)continue;
      const max=Math.max(r,g,b),min=Math.min(r,g,b);
      lum+=.2126*r+.7152*g+.0722*b;
      sat+=(max-min)/Math.max(.001,max);
      dark+=Number(max<.17);
      highlight+=Number(max>.78);
      valid++;
    }
  }
  if(!valid)throw Error('Empty PNG quality region');
  const round=x=>Number(x.toFixed(4));
  return{width:png.width,height:png.height,
    meanLuminance:round(lum/valid),darkFraction:round(dark/valid),
    meanSaturation:round(sat/valid),highlightFraction:round(highlight/valid),
    samplingPixels:valid};
}
module.exports={decodePng,measureFrame};
if(require.main===module){
  const fs=require('node:fs');
  for(const file of process.argv.slice(2))
    process.stdout.write(JSON.stringify({file,...measureFrame(fs.readFileSync(file))})+'\n');
}
