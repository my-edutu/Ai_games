'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,
 '../../public/ai-dungeon/d04-combat-pcm-worklet.js'),'utf8');
function fixture(frameLimit=2048){
 let registered=null;
 const events=[];
 const port={postMessage(data,transfer){events.push({data,transfer})},onmessage:null};
 const scope={AudioWorkletProcessor:class{constructor(){this.port=port}},
  registerProcessor(name,Type){assert.equal(name,'d04-original-foley-pcm');registered=Type},
  currentFrame:0};
 vm.runInNewContext(source,scope,{filename:'d04-combat-pcm-worklet.js'});
 const processor=new registered({processorOptions:{frames:frameLimit}});
 const process=(frame,amplitude=.12)=>{
  scope.currentFrame=frame;
  const input=new Float32Array(128).fill(amplitude);
  const output=new Float32Array(128).fill(1);
  const ongoing=processor.process([[input]],[[output]],{});
  assert.ok(output.every(v=>v===0),'read-only PCM must not add any speaker output');
  return ongoing;
 };
 return {processor,process,events,port,scope};
}
test('D04 audio render-thread PCM collects a bounded AudioContext frame timeline without main-thread callbacks',()=>{
 const f=fixture();
 for(let at=0;at<2048;at+=128)
  assert.equal(f.process(at),true,'completion remains live until main-thread stop');
 assert.equal(f.events.length,1);
 const result=f.events[0].data;
 assert.equal(result.frames,2048);
 assert.equal(result.firstFrame,0);
 assert.equal(result.blocks,16);
 assert.equal(result.invalidClocks,0);
 assert.equal(result.discontinuities,0);
 assert.equal(result.buffer.byteLength,4096);
 assert.equal(f.events[0].transfer[0],result.buffer);
 const pcm=new Int16Array(result.buffer);
 assert.ok(pcm[0]>3000&&pcm[0]<5000);
 assert.equal(f.process(2048),true,'completed PCM awaits delivery acknowledgement');
 f.port.onmessage({data:{type:'stop'}});
 assert.equal(f.process(2176),false,'acknowledged processor stops');
});
test('D04 completed PCM waits silently across main-thread stalls without duplicate buffers',()=>{
 const f=fixture();
 for(let at=0;at<2048;at+=128)f.process(at);
 assert.equal(f.events.length,1,'one bounded transferable completion');
 const original=f.events[0].data;
 for(let i=0;i<32;i++)assert.equal(f.process(2048+i*128),true,
  'render thread stays live pending main-thread acknowledgement');
 assert.equal(f.events.length,1,'stalls never replay or extend recorded PCM');
 assert.equal(original.frames,2048);
 assert.equal(original.blocks,16,'post-completion quanta are not recorded');
 f.port.onmessage({data:{type:'stop'}});
 assert.equal(f.process(6144),false,'mute/teardown still retires the worklet');
});

test('D04 audio render thread reports skipped quanta instead of fabricating contiguous PCM',()=>{
 const f=fixture();
 for(let i=0;i<16;i++)f.process(i*128+(i>=8?128:0));
 assert.equal(f.events[0].data.discontinuities,1);
 assert.equal(f.events[0].data.firstFrame,0);
});
test('D04 mute/teardown stops its capture without publishing an incomplete WAV',()=>{
 const f=fixture();
 f.process(0);
 f.port.onmessage({data:{type:'stop'}});
 assert.equal(f.process(128),false);
 assert.equal(f.events.length,0);
});
test('D04 worklet cannot synthesize authority, sound, private audio or imported samples',()=>{
 assert.doesNotMatch(source,/createOscillator|fetch\(|new Audio\(|getUserMedia|DungeonRuntime|WebGLRenderer/);
 assert.match(source,/registerProcessor\('d04-original-foley-pcm'/);
});
