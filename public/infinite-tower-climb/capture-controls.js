'use strict';
(function(){
  const still=document.getElementById('capture-still'),record=document.getElementById('record-clip'),
    feedback=document.getElementById('capture-feedback');
  const say=text=>{if(feedback)feedback.textContent=text;};
  const audio=document.getElementById('audio-control');
  audio?.addEventListener('click',async()=>{
    if(typeof window.__TOWER_AUDIO_TOGGLE__!=='function'){say('Audio engine not ready');return;}
    try{
      const enabled=await window.__TOWER_AUDIO_TOGGLE__();
      audio.textContent=enabled?'MUTE AUDIO ♪':'ENABLE AUDIO ♪';
      say(enabled?'Original ambient ascent music enabled.':'Sound muted.');
    }catch(error){say('Audio unavailable: '+String(error?.message||error))}
  });
  still?.addEventListener('click',async()=>{
    if(typeof window.__TOWER_EVIDENCE_CAPTURE__!=='function'){say('3D renderer not ready');return;}
    still.disabled=true;say('Capturing actual WebGL pixels...');
    try{
      const result=await window.__TOWER_EVIDENCE_CAPTURE__();
      say(result?'Saved real screenshot · '+Math.round(result.bytes/1024)+' KB':'Screenshot unavailable; try again');
    }catch(error){say('Screenshot failed: '+String(error?.message||error))}
    finally{still.disabled=false;}
  });
  record?.addEventListener('click',async()=>{
    if(typeof window.__TOWER_EVIDENCE_RECORD__!=='function'){say('3D renderer not ready');return;}
    record.disabled=true;say('Recording 8 seconds of actual gameplay...');
    try{
      const result=await window.__TOWER_EVIDENCE_RECORD__();
      say(result?.kind==='video'?'Saved gameplay clip · '+Math.round(result.bytes/1024)+' KB':
        'Recording unavailable');
    }catch(error){say('Video recording failed: '+String(error?.message||error))}
    finally{record.disabled=false;}
  });
})();
