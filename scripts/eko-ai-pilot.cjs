'use strict';
// Lightweight, replayable reactive autopilot. It only reads the public render snapshot
// and emits the exact player input schema; it has no access to route generator internals.
const EMPTY=Object.freeze({axis:1,jumpPressed:false,jumpReleased:false,slide:false,vault:false});
function assertSnapshot(snapshot){
  if(!snapshot || !snapshot.player || !Array.isArray(snapshot.hazards) || !Number.isInteger(snapshot.tick)){
    throw new TypeError('Autopilot requires a valid public Eko Run snapshot');
  }
}
function createReactivePilot(){
  let lastActionId=null,lastActionTick=-999999;
  let decisions=0,actions=0,holds=0;
  function decide(snapshot){
    assertSnapshot(snapshot);
    decisions++;
    if(snapshot.lifecycle!=='running')return {...EMPTY,axis:0};
    const player=snapshot.player;
    const speed=Math.max(0,player.velocity.x);
    const threats=snapshot.hazards.filter(h=>
      h.phase!=='resolved' && h.phase!=='hit' && Number.isFinite(h.x) &&
      h.x+Math.max(0,h.width)*.5 >=player.position.x &&
      h.x-player.position.x<Math.max(5.5,speed*.85+1.8)
    ).sort((a,b)=>(a.x-b.x)||a.id.localeCompare(b.id));
    const h=threats[0];
    if(!h)return {...EMPTY};
    const distance=h.x-player.position.x;
    const grounded=player.movementState==='grounded';
    const legal=h.legalResponses;
    const repeatAction=h.id===lastActionId && snapshot.tick-lastActionTick<24;
    const intent={...EMPTY};
    // A jump started four metres ahead can land on top of a short pothole.
    // Target the center of the physically safe flight arc based on current speed
    // and obstacle width; never use unrevealed hazard-generation parameters.
    const responseLead=Math.max(1.75,Math.min(3.35,1.35+speed*.15+h.width*.36));
    if(grounded && !repeatAction){
      if(legal.includes('jump') && distance<=responseLead && distance>.65){
        intent.jumpPressed=true;
      }else if(legal.includes('slide') && distance<=Math.max(1.8,speed*.32) && distance>.4){
        intent.slide=true;
      }else if(legal.includes('vault') && distance<=1.45 && distance>.45){
        intent.vault=true;
      }
    }
    if(intent.jumpPressed||intent.slide||intent.vault){
      lastActionId=h.id;lastActionTick=snapshot.tick;actions++;
      return intent;
    }
    // Stop or slow for road crossings that cannot be cleared by legal platform actions.
    const mustYield=legal.includes('wait') || legal.includes('slow');
    const actionable=legal.includes('jump')||legal.includes('slide')||legal.includes('vault');
    if(mustYield && !actionable && h.active && distance<=Math.max(2.75,speed*.54+h.width*.36)){
      holds++;
      return {...EMPTY,axis:0};
    }
    return intent;
  }
  return Object.freeze({
    decide,
    reset(){lastActionId=null;lastActionTick=-999999;},
    metrics(){return Object.freeze({decisions,actions,holds});}
  });
}
module.exports={createReactivePilot};
