/** Presentation-only performance samples. No state, timers, randomness or rule writes. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const POSES=Object.freeze({
 idle:     [.16,1,    1,    0, -.18, 0,    0],
 walk:     [.34,1,    .88,  0, -.58, -.04, .03],
 run:      [.67,.93,  .70,  0, -.85, -.09, .07],
 wait:     [.23,.84,  .53,  0, -.24, .10, -.06],
 jump:     [.06,1.08, .78,  0, -1.0, -.16, .06],
 land:     [.29,.77,  .68,  0, -.35, .08, -.04],
 hit:      [.82,.40,  .82,  1, -.12, .25, -.12],
 recover:  [.46,.68,  .65,  1, -.20, .18, -.08],
 celebrate:[.02,1.12, 1.32, 0, -.52,-.12, .10],
});
export function samplePerformance(action,time,reduced=false,motion={}) {
 const pose=POSES[action]||POSES.idle,t=reduced?0:finite(time),ambient=reduced?0:1;
 const [curl,eye,mouth,frown,scarf,pitch,bank]=pose;
 const look=clamp(finite(motion?.lookYaw),-.42,.42);
 const rewardAge=finite(motion?.rewardAge,Infinity);
 const reward=rewardAge>=0&&rewardAge<.8?Math.sin(Math.PI*rewardAge/.8):0;
 const phase=((t%5.2)+5.2)%5.2;
 const blink=ambient&&phase>5.04?Math.max(.08,Math.abs(phase-5.12)/.08):1;
 return {
  gaze:look+(action==='wait'&&!look?-.16:0),
  breath:ambient*Math.sin(t*2.1)*.009,
  torsoTwist:ambient*(action==='walk'||action==='run'?Math.sin(t*(action==='run'?13:9))*.065:Math.sin(t*.65)*.015),
  eyeScale:eye*blink,
  mouthWidth:mouth,
  mouthFrown:frown,
  fingerCurl:curl,
  scarfBase:scarf+ambient*Math.sin(t*4.1)*.045,
  scarfMid:ambient*Math.sin(t*4.1-.65)*.12,
  scarfTip:ambient*Math.sin(t*4.1-1.25)*.18,
  companionPitch:pitch,
  companionBank:bank+ambient*Math.sin(t*1.7)*.035,
  companionBob:ambient*Math.sin(t*2.3)*.025,
  companionEye:action==='hit'?.30:action==='recover'?.62:1+reward*.15,
  companionFin:(action==='celebrate'?.45:action==='jump'?.30:.13)+ambient*Math.sin(t*5)*.07,
  rewardLift:reduced?0:reward*.025,
 };
}

/** A small reproducible surface field, shared by clothing or copper parts. */
export function characterSurface(kind,size=64) {
 if(!Number.isInteger(size)||size<8||size>128)throw new RangeError('Character surface size must be 8–128');
 const pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=((x*73+y*151+(x*y*17))%31)/30;
  const value=kind==='cloth'?175+((x+y)%4<2?26:-18)+(x%4===0?12:0):155+(y%7)*6+grain*18;
  const i=(y*size+x)*4;
  pixels[i]=pixels[i+1]=pixels[i+2]=Math.round(value);pixels[i+3]=255;
 }
 return pixels;
}
