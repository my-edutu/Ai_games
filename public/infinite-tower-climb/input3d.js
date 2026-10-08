// Manual accessibility input for the exact same deterministic 3D simulation.
// Default remains permanently autonomous; manual mode uses keyboard, touch and gamepad.
export function createTowerInput(params){
  const manual=params.get('manual')==='1';
  const held=new Set(),touch=new Set();
  const state={left:false,right:false,forward:false,back:false,jump:false};
  const map={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',
    KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',
    Space:'jump',KeyJ:'jump',Gamepad0:'jump'};
  let lastPadJump=false,gestureJump=false;
  const onKey=(event)=>{
    const value=map[event.code];
    if(!manual||!value||event.ctrlKey||event.metaKey||event.altKey)return;
    event.preventDefault();
    if(event.type==='keydown')held.add(value);
    else held.delete(value);
  };
  const onBlur=()=>{held.clear();touch.clear();gestureJump=false};
  addEventListener('keydown',onKey);
  addEventListener('keyup',onKey);
  addEventListener('blur',onBlur);
  const controls=document.querySelectorAll('[data-tower-control]');
  for(const control of controls){
    const name=control.getAttribute('data-tower-control');
    control.hidden=!manual;
    if(!manual)continue;
    control.setAttribute('aria-label',name==='jump'?'Jump up': 'Move '+name);
    control.style.touchAction='none';
    control.addEventListener('pointerdown',e=>{e.preventDefault();control.setPointerCapture(e.pointerId);touch.add(name);
      if(name==='jump')gestureJump=true;});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      control.addEventListener(type,()=>touch.delete(name));
  }
  const modeLink=document.getElementById('game-mode');
  if(modeLink){
    modeLink.textContent=manual?'RETURN TO AUTONOMY ↗':'PLAY MANUALLY ↗';
    modeLink.href=manual?'/tower/volumetric':'/tower/volumetric?manual=1';
  }
  function sample(){
    if(!manual)return undefined;
    for(const name of ['left','right','forward','back'])state[name]=held.has(name)||touch.has(name);
    let padJump=false;
    const pads=navigator.getGamepads?.()||[];
    for(const pad of pads){
      if(!pad||!pad.connected)continue;
      const x=pad.axes?.[0]||0,y=pad.axes?.[1]||0;
      state.left=state.left||x<-.27;
      state.right=state.right||x>.27;
      state.forward=state.forward||y<-.27;
      state.back=state.back||y>.27;
      padJump=padJump||Boolean(pad.buttons?.[0]?.pressed);
    }
    state.jump=held.has('jump')||gestureJump||(padJump&&!lastPadJump);
    lastPadJump=padJump;
    gestureJump=false;
    return {...state};
  }
  function dispose(){
    removeEventListener('keydown',onKey);
    removeEventListener('keyup',onKey);
    removeEventListener('blur',onBlur);
  }
  return {manual,sample,dispose};
}
