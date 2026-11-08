/**
 * Original dungeon presentation-context preflight. The known CPU WebGL
 * rasterizers used by genuine browser captures pay a heavy multisample cost;
 * inspect a tiny temporary context BEFORE allocating the real Three.js canvas.
 * A recognisable CPU renderer chooses single-sample direct 3D while preserving
 * every real model, warning tile, material, light and authoritative tick.
 * Hardware or privacy-restricted renderers retain the original antialiasing.
 * This is a performance candidate, never evidence of a measured FPS gain.
 */
const SOFTWARE=/(swiftshader|llvmpipe|softpipe|software rasterizer)/i;
const ORIGINAL=Object.freeze({antialias:true,softwareDetected:false,verified:false});
export function planRendererAntialias(createCanvas){
 if(typeof createCanvas!=='function')return ORIGINAL;
 let context=null;
 try{
  const canvas=createCanvas();
  if(!canvas||typeof canvas.getContext!=='function')return ORIGINAL;
  const options={antialias:false,depth:false,stencil:false,alpha:false,
   preserveDrawingBuffer:false,powerPreference:'high-performance'};
  context=canvas.getContext('webgl2',options)||canvas.getContext('webgl',options);
  if(!context||typeof context.getParameter!=='function')return ORIGINAL;
  const debug=context.getExtension?.('WEBGL_debug_renderer_info');
  const name=String(context.getParameter(debug?.UNMASKED_RENDERER_WEBGL??context.RENDERER)||'');
  const softwareDetected=SOFTWARE.test(name);
  return Object.freeze({antialias:!softwareDetected,softwareDetected,verified:Boolean(name)});
 }catch{return ORIGINAL}
 finally{
  // Dispose ONLY this standalone temporary probe, not the real stage.
  try{context?.getExtension?.('WEBGL_lose_context')?.loseContext?.()}catch{}
 }
}
