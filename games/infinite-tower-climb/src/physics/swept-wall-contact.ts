// Fixed-step side-face contact with the body HEIGHT at the actual X encounter.
// A rapid diagonal fall may cross a platform's upper plane BEFORE reaching its
// side; conversely a rise may cross a ceiling BEFORE entering its horizontal
// lane. Looking only at the start-of-step Y lets both bodies tunnel or land
// through a solid corner. Use the two PRESENT authoritative tick endpoints;
// moving platforms use their actual tick and tick+1 poses, not a forecast.
// Historical/unflagged physics never calls this source-only helper.
export interface TowerSweptWallProbe {
  fromX:number; toX:number; fromY:number; toY:number;
  halfWidth:number; halfHeight:number;
  wallStartX:number; wallEndX:number;
  wallStartY:number; wallEndY:number;
  wallWidth:number; wallHeight:number;
  direction:-1|1;
}
export function sweptWallContact(p:TowerSweptWallProbe):
  {time:number;contactX:number}|undefined {
  const dir=p.direction;
  const startPlane=p.wallStartX+(dir===-1?p.wallWidth:0);
  const endPlane=p.wallEndX+(dir===-1?p.wallWidth:0);
  const gapAtStart=dir*(startPlane-(p.fromX+dir*p.halfWidth));
  const gapAtEnd=dir*(endPlane-(p.toX+dir*p.halfWidth));
  // Already interpenetrating is not a new side entry. A receding wall
  // cannot create a collision, and standing face-to-face is not a new hit.
  if(gapAtStart<0||gapAtEnd>0||gapAtStart===gapAtEnd)return undefined;
  const t=gapAtStart/(gapAtStart-gapAtEnd);
  if(t<0||t>1||!Number.isFinite(t))return undefined;
  const heroY=p.fromY+(p.toY-p.fromY)*t;
  const wallY=p.wallStartY+(p.wallEndY-p.wallStartY)*t;
  if(heroY+p.halfHeight<=wallY||
    heroY-p.halfHeight>=wallY+p.wallHeight)return undefined;
  const touchingPlane=startPlane+(endPlane-startPlane)*t;
  // After touch, an approaching moving face can push the body; one moving
  // away cannot drag the body into empty space. Keep the existing wall-stop
  // velocity rule and the independent vertical landing/head solver.
  const physicalPlane=dir===1?
    Math.min(touchingPlane,endPlane):Math.max(touchingPlane,endPlane);
  return {time:t,contactX:physicalPlane-dir*p.halfWidth};
}
