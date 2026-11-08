'use strict';
// Visual-change accounting of EXISTING WebM clips; no synthetic frames and no
// assumptions that CFR 25-fps samples are distinct newly rendered frames.
const fs=require('node:fs');
const {spawn,execFileSync}=require('node:child_process');
const W=160,H=90,FRAME_BYTES=W*H;
async function auditVideo(file,{threshold=0.45}={}){
  if(!fs.statSync(file).isFile())throw TypeError('Expected WebM file');
  const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries',
    'stream=width,height,avg_frame_rate','-show_entries','format=duration','-of','json',file],{encoding:'utf8'}));
  const proc=spawn('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-i',file,
    '-vf',`scale=${W}:${H},format=gray`,'-f','rawvideo','-pix_fmt','gray','pipe:1'],{stdio:['ignore','pipe','pipe']});
  let previous=null,buffer=Buffer.alloc(0),frames=0,nearStatic=0,visibleChanges=0,strongChanges=0,changes=[];
  let stderr='';proc.stderr.on('data',b=>{if(stderr.length<2048)stderr+=b.toString()});
  for await (const chunk of proc.stdout){
    buffer=Buffer.concat([buffer,chunk]);
    while(buffer.length>=FRAME_BYTES){
      const frame=buffer.subarray(0,FRAME_BYTES);buffer=buffer.subarray(FRAME_BYTES);
      if(previous){let difference=0;
        for(let i=0;i<FRAME_BYTES;i++)difference+=Math.abs(frame[i]-previous[i]);
        difference/=FRAME_BYTES;
        if(difference<=threshold)nearStatic++;else visibleChanges++;
        if(difference>1)strongChanges++;
        if(changes.length<1600)changes.push(Number(difference.toFixed(3)));
      }
      previous=Buffer.from(frame);frames++;
      if(frames>3600){proc.kill();throw Error('Frame audit capped at 3600 decoded frames')}
    }
  }
  const code=await new Promise(resolve=>proc.once('close',resolve));
  if(code!==0)throw Error('ffmpeg failed: '+stderr.slice(0,512));
  return {input:file, encodedWidth:meta.streams[0]?.width, encodedHeight:meta.streams[0]?.height,
    nominalEncodedFrameRate:meta.streams[0]?.avg_frame_rate,
    encodedDurationSeconds:Number(meta.format?.duration)||null,
    decodedFrames:frames,adjacentPairs:Math.max(0,frames-1),
    nearStaticPairs:nearStatic,visibleChangePairs:visibleChanges,strongChangePairs:strongChanges,
    visualChangeFraction:frames>1?Number((visibleChanges/(frames-1)).toFixed(4)):null,
    grayscaleDownsample:[W,H],differenceThreshold:threshold,
    attribution:'Adjacent visual-change heuristic only. Static camera/scene, lossy encoding and subtle motion affect this metric. It cannot identify how many source frames were rendered.'};
}
if(require.main===module){const file=process.argv[2];if(!file){console.error('Usage: node video-frame-audit.cjs original.webm');process.exitCode=2}
 else auditVideo(file).then(v=>console.log(JSON.stringify(v,null,2))).catch(e=>{console.error(e.stack);process.exitCode=1})}
module.exports={auditVideo};
