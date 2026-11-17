/**
 * Source-earned corner recoil for original Tideglass floor mechanics.
 * Every returned tile belongs to the PRESENT public snapshot's visible,
 * reciprocal, open, same-elevation ordinary corridor. Never a solver path.
 * The witness comes from an exact consecutive, same-run PUBLIC parry.
 */
export function publicWitnessedGuardianRecoilRoute(s,witness) {
  const route=new Map();
  if(!s || s.lifecycle!=='running' || s.result || !witness
    || witness.runToken!==s.runToken
    || !Number.isSafeInteger(witness.tick) || !Number.isSafeInteger(s.tick)
    || s.tick<witness.tick || !Number.isSafeInteger(s.currentCell)
    || !Number.isSafeInteger(s.width) || s.width<2
    || !Number.isSafeInteger(s.height) || s.height<2
    || !Array.isArray(s.visibleCells) || !Array.isArray(s.cells)
    || !Array.isArray(s.threats) || !Array.isArray(s.doors)
    || !Array.isArray(s.keys))return route;
  const guardian=s.threats.find(t=>t?.id===witness.id
    && t.cell===witness.cell && t.lanternParried===true);
  if(!guardian)return route;
  const visible=new Set(s.visibleCells);
  const special=new Set(s.keys.map(k=>k.cell));
  const known=new Map(s.cells.filter(c=>Number.isSafeInteger(c?.cell)
    &&visible.has(c.cell) && c.blocked===false
    && c.trap!==true && !c.checkpoint && !c.clue
    && c.cell!==s.exitCell && !special.has(c.cell)
    && Array.isArray(c.neighbors)).map(c=>[c.cell,c]));
  if(!known.has(s.currentCell)||!known.has(guardian.cell)
    ||s.currentCell===guardian.cell)return route;
  const level=id=>{
    const row=Math.floor(id/s.width);
    const band=Math.min(2,Math.max(0,Math.floor(row*3/Math.max(1,s.height))));
    return (2-band)*1.4;
  };
  const base=level(s.currentCell);
  const open=(a,b)=>{
    const origin=known.get(a),neighbor=known.get(b);
    if(!origin||!neighbor||!origin.neighbors.includes(b)
      ||!neighbor.neighbors.includes(a))return false;
    if(Math.abs(a%s.width-b%s.width)
      +Math.abs(Math.floor(a/s.width)-Math.floor(b/s.width))!==1
      ||level(b)!==base)return false;
    return !s.doors.some(d=>d?.open===false
      &&((d.a===a&&d.b===b)||(d.b===a&&d.a===b)));
  };
  // At most four actual open edges. An L turn changes only the visual axis.
  const queue=[[s.currentCell]],visited=new Set([s.currentCell]);
  let found=null;
  while(queue.length){
    const path=queue.shift(),last=path[path.length-1];
    if(last===guardian.cell){found=path;break}
    if(path.length>=5)continue;
    for(const next of [last-1,last+1,last-s.width,last+s.width]){
      if(visited.has(next)||!open(last,next))continue;
      visited.add(next);queue.push([...path,next]);
    }
  }
  if(!found||found.length<2)return route;
  found.forEach((id,step)=>{
    const other=step===found.length-1?found[step-1]:found[step+1];
    route.set(id,{axis:Math.floor(other/s.width)===Math.floor(id/s.width)?'x':'z',step});
  });
  return route;
}
