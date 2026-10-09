// Eko Run cosmetic broadcast direction. Side and 3/4 street perspectives
// share the same authoritative 2D route/hazard model; no steering effects.
const styles=Object.freeze(['broadcast','street-cinema']);
function finite(v,name){if(!Number.isFinite(v))throw new TypeError('camera '+name+' must be finite');}
export function computeCameraShot({playerX,playerY=0,portrait=false,style='broadcast'}={}){
  finite(playerX,'playerX');finite(playerY,'playerY');
  if(!styles.includes(style))throw new RangeError('unsupported camera style');
  if(style==='street-cinema'){
    const cam=portrait?
      {x:playerX-6.1,y:5.1,z:14.8,targetX:playerX+1.9,targetY:1.25,targetZ:0}:
      {x:playerX-6.8,y:4.85,z:10.7,targetX:playerX+3.8,targetY:1.3,targetZ:0};
    cam.y+=playerY*.18;cam.targetY+=playerY*.12;
    return Object.freeze({...cam,style,portrait});
  }
  const targetX=playerX+(portrait?.85:2.55);
  return Object.freeze({
    x:targetX-2.1,y:(portrait?4.70:4.38)+playerY*.18,z:portrait?15.5:11.5,
    targetX,targetY:1.2,targetZ:0,style,portrait
  });
}
export function nextCameraStyle(current){
  return current==='broadcast'?'street-cinema':'broadcast';
}
export const AVAILABLE_CAMERA_STYLES=styles;
