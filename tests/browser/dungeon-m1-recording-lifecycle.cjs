'use strict';
/**
 * Finalise the REAL browser's WebM disk stream even when a naturally reached
 * checkpoint was not rendered. No fabricated frame, authority tick or result.
 */
async function finalizeOriginalJourneyRecording({stop,close,persist}){
 for(const [name,fn] of Object.entries({stop,close,persist}))
  if(typeof fn!=='function')throw new TypeError('Missing recording lifecycle step: '+name);
 let recording={status:'UNAVAILABLE',reason:'Recorder stop not attempted'};
 const errors=[];
 try{recording=await stop()}catch(err){
  errors.push('stop: '+String(err));
  recording={status:'UNAVAILABLE',reason:'Browser recorder could not stop cleanly'};
 }
 try{await close()}catch(err){errors.push('close: '+String(err))}
 const result={recording,finalizationErrors:errors};
 try{await persist(result)}catch(err){errors.push('persist: '+String(err))}
 return result;
}
module.exports={finalizeOriginalJourneyRecording};
