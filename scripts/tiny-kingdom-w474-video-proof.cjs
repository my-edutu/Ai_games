'use strict';
// Actual recording dimensions, not webpage screenshots or CSS viewport guesses.
// The old page-fixture WebMs were 800x450 and CROPPED the 390x844 scene.
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
for(const [width,height] of [[390,844],[1024,768]]){
 const file=path.resolve(__dirname,'../artifacts/tiny-kingdom-w473/'+width+'-actual-playable.webm');
 if(!fs.existsSync(file))throw Error('Missing real '+width+' browser recording');
 let probe;
 try{
  probe=JSON.parse(execFileSync('ffprobe',[
   '-v','error','-select_streams','v:0','-show_entries',
   'stream=width,height','-of','json',file],{encoding:'utf8',timeout:30000}));
 }catch(err){throw Error('Cannot verify actual video dimensions: '+err.message)}
 const stream=probe.streams?.[0];
 if(stream?.width!==width||stream?.height!==height)
  throw Error('CROPPED recording: '+width+' CSS viewport needs '+width+'x'+height+
   ' real video, received '+stream?.width+'x'+stream?.height);
 console.log('PASS real uncropped '+width+'x'+height+' recording: '+file);
}
