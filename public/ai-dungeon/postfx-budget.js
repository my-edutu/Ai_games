// Presentation-only software/WebGL budget; never participates in simulation.
// Offscreen bloom may drop resolution while direct geometry keeps its DPR.
const MAX_OFFSCREEN_PIXELS=850000;
function positiveBounded(value,max,fallback=1){
  return Number.isFinite(value)&&value>0 ? Math.min(max,Math.floor(value)) : fallback;
}
export function planPostFXBudget(cssWidth,cssHeight,deviceScale){
  const width=positiveBounded(cssWidth,16384),height=positiveBounded(cssHeight,16384);
  const requested=Number.isFinite(deviceScale)&&deviceScale>0?Math.min(deviceScale,4):1;
  const capped=Math.min(requested,1,Math.sqrt(MAX_OFFSCREEN_PIXELS/(width*height)));
  const pixelRatio=Math.max(.001,Math.floor(capped*1000)/1000);
  const renderPixels=Math.max(1,Math.floor(width*pixelRatio))*Math.max(1,Math.floor(height*pixelRatio));
  return {width,height,pixelRatio,renderPixels,maxPixels:MAX_OFFSCREEN_PIXELS};
}
