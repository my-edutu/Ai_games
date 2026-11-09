/** Native canvas evidence: one request per genuinely completed WebGL frame. */
export function createRenderedFrameCapture({readFrame,requestFrame,schedule,cancel}={}){
 if([readFrame,requestFrame,schedule,cancel].some(f=>typeof f!=='function'))
  throw new TypeError('Rendered-frame capture requires four callable adapters');
 let active=false,scheduled=null,lastFrame=null,requests=0,failure=null;
 function pulse(){
  scheduled=null;if(!active)return;
  try{
   const frame=readFrame();
   if(Number.isSafeInteger(frame)&&frame>=0&&frame!==lastFrame){
    requestFrame();lastFrame=frame;requests++;
   }
  }catch(error){failure=String(error);active=false;return}
  if(active)scheduled=schedule(pulse);
 }
 function stats(){return Object.freeze({active,requestedFrames:requests,lastFrame,failure})}
 function stop(){active=false;if(scheduled!==null){cancel(scheduled);scheduled=null}return stats()}
 function start(){
  if(failure||active)return stats();
  active=true;scheduled=schedule(pulse);return stats();
 }
 return Object.freeze({start,stop,stats});
}
