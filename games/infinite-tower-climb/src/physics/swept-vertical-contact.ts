// Source-tick vertical-plane crossing for actual moving and one-way decks.
// Never infer support from end-of-tick overlap alone; keep the historical
// unflagged solver untouched for frozen replay checksums.
export interface TowerSweptVerticalProbe{
  fromX:number;toX:number;fromY:number;toY:number;
  halfWidth:number;halfHeight:number;
  platformStartX:number;platformEndX:number;
  platformStartY:number;platformEndY:number;
  platformWidth:number;platformHeight:number;oneway:boolean;
}
export type TowerVerticalHit={kind:'land'|'head';time:number};
export function sweptVerticalContact(p:TowerSweptVerticalProbe):
  TowerVerticalHit|undefined{
  const overlapsAt=(t:number)=>{
    const heroX=p.fromX+(p.toX-p.fromX)*t;
    const deckX=p.platformStartX+(p.platformEndX-p.platformStartX)*t;
    return heroX+p.halfWidth>deckX&&
      heroX-p.halfWidth<deckX+p.platformWidth;
  };
  const startTop=p.platformStartY+p.platformHeight;
  const endTop=p.platformEndY+p.platformHeight;
  const startAbove=p.fromY-p.halfHeight-startTop;
  const endAbove=p.toY-p.halfHeight-endTop;
  if(startAbove>=-1&&endAbove<=0&&endAbove<startAbove){
    const time=Math.max(0,startAbove/(startAbove-endAbove));
    // A real contact must also leave actual support at tick end. Otherwise
    // the hero has already dashed off a short deck before this step ends.
    if(Number.isFinite(time)&&time<=1&&overlapsAt(time)&&overlapsAt(1))
      return{kind:'land',time};
  }
  if(!p.oneway){
    const startBelow=p.platformStartY-(p.fromY+p.halfHeight);
    const endBelow=p.platformEndY-(p.toY+p.halfHeight);
    if(startBelow>=0&&endBelow<=0&&endBelow<startBelow){
      const time=startBelow/(startBelow-endBelow);
      if(Number.isFinite(time)&&time>=0&&time<=1&&overlapsAt(time))
        return{kind:'head',time};
    }
  }
  return undefined;
}
