'use strict';
// Synthetic public-schema fixture, never used by the production page.
module.exports = function fixture() {
  const width=32,height=24,surfaceRow=7,n=width*height,center=16+14*width;
  const tiles=Array(n).fill(0), discovered=Array(n).fill(1), food=Array(n).fill(0);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    if(y<=surfaceRow)tiles[y*width+x]=2;
    if(y>surfaceRow&&((Math.abs(x-16)<2&&y<19)||((x-16)**2+(y-14)**2<36)||((x-8)**2+(y-18)**2<9)))tiles[y*width+x]=1;
    if((x-16)**2+(y-14)**2<16)tiles[y*width+x]=3;
  }
  food[3*width+6]=70;food[5*width+26]=90;
  const ants=Array.from({length:40},(_,i)=>({id:i+1,role:['worker','scout','nurse','digger','soldier'][i%5],x:i<30?12+i%9:3+(i%10)*2,y:i<30?12+Math.floor(i/9):5,health:100,energy:80,carryingFood:i%7===0?1:0,task:i%7===0?'return':'forage',intent:'Collect food for the colony',confidence:90}));
  return {schemaVersion:1,presentationVersion:'ant-presentation-v1',revision:10001,runToken:'fixture-run-0',runIndex:0,tick:1,lifecycle:'active',scene:'colony',headline:'Build a Thriving Ant Civilization',goal:{label:'Reach ecological ascension',population:40,targetPopulation:180,progress:40/180,band:'growing'},environment:{day:1,season:'spring',weather:'clear',dayProgress:.45,seasonProgress:.2},queen:{health:100,maxHealth:100,eggsLaid:38},colony:{population:40,brood:24,broodByStage:{egg:10,larva:8,pupa:6},foodStore:180,waterStore:140,tunnelsDug:45,foodDelivered:62,strategy:'foraging',strategyReason:'Build reserves while the perimeter is calm',threat:12},world:{width,height,surfaceRow,entrance:16+surfaceRow*width,nestCenter:center,tiles,food,moisture:Array(n).fill(30),discovered,pheromones:{home:Array(n).fill(0),food:Array(n).fill(0),alarm:Array(n).fill(0),excavation:Array(n).fill(0)}},ants,predators:[{id:900,kind:'beetle',x:28,y:4,health:100,intent:'Seek food'}],audience:{enabled:false,emergencyDisabled:false,pendingEffects:0,activeEffectCount:0},recentEvents:[],captions:['Workers are gathering food for the queen and brood.']};
};
