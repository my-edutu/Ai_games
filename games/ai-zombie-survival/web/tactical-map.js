// Tactical map driven exclusively by the same authoritative snapshot as the 3D world.
export function drawTacticalMap(canvas,game,focusX=0,focusZ=0){
  if(!canvas)return 0;
  const c=canvas.getContext('2d');if(!c)return 0;
  const w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.fillStyle='#10243a';c.fillRect(0,0,w,h);
  const px=x=>(x+70)/140*w,pz=z=>(z+56)/112*h,sx=w/140,sz=h/112;
  for(const d of game.districts){
    c.fillStyle=({residential:'#224d54',commercial:'#405063',industrial:'#374958',medical:'#265960',civic:'#30536b',outskirts:'#244f53'})[d.kind]||'#274450';
    c.fillRect(px(d.x-d.w/2),pz(d.y-d.h/2),d.w*sx,d.h*sz);
  }
  c.fillStyle='#6d7b79';
  for(const z of [-8,26])c.fillRect(px(-56),pz(z-3.5),112*sx,7*sz);
  for(const x of [-17,17])c.fillRect(px(x-3.5),pz(-31),7*sx,78*sz);
  for(const building of game.buildings){
    if(building.kind==='safehouse')continue;
    c.fillStyle='#9c9b82';
    c.fillRect(px(building.x-building.w/2),pz(building.y-building.h/2),Math.max(2,building.w*sx),Math.max(2,building.h*sz));
  }
  c.fillStyle='#ffca69';c.shadowColor='#ffca69';c.shadowBlur=9;
  c.fillRect(px(game.safeHouse.x)-5,pz(game.safeHouse.y)-5,10,10);c.shadowBlur=0;
  let counted=0;
  for(const z of game.zombies){
    if(z.health<=0)continue;
    c.fillStyle=z.archetype==='brute'?'#ffb36e':'#ff526b';
    c.fillRect(px(z.x)-.7,pz(z.y)-.7,2,2);counted++;
  }
  for(const s of game.survivors)if(s.alive){
    c.fillStyle='#33fbde';c.shadowColor='#47ffec';c.shadowBlur=7;
    c.fillRect(px(s.x)-2.5,pz(s.y)-2.5,5,5);
  }
  c.shadowBlur=0;
  c.strokeStyle='#c5f5eb8d';c.lineWidth=1;
  c.strokeRect(px(focusX)-11,pz(focusZ)-6,22,12);
  return counted;
}
