'use strict';
// W489: test first against pre-change source (helper absent, center ray inside
// opaque walls, first-home-only scoring). Original physics, not fabricated film.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function production(name){
 const start=html.indexOf('function '+name+'(');
 if(start<0)throw Error('Missing actual production '+name);
 const body=html.indexOf('{',start);
 let n=0,end=body;
 for(;end<html.length;end++){
  if(html[end]==='{')n++;
  if(html[end]==='}'&&!--n){end++;break;}
 }
 if(n!==0)throw Error('Bad production function '+name);
 return html.slice(start,end);
}
test('W489 real threshold is outside the real cottage wall; absent houses never appear',()=>{
 const city=[[8,14.2,2],[-12,13,1],[-12,1,3]];
 const sandbox={city,terrain:()=>1.5};
 vm.runInNewContext(production('realTradeOccupiedDoorwayPoint')+
  '; result=realTradeOccupiedDoorwayPoint([8,14.2]);'+
  ' missing=realTradeOccupiedDoorwayPoint([90,90]);',sandbox);
 const front=14.2-(2.1+2*.18)*.5-.54;
 expect(Array.from(sandbox.result)).toEqual([8,2.46,front]);
 expect(sandbox.missing).toBe(null);
 expect(html).toContain('doorway=realTradeOccupiedDoorwayPoint(home)');
 expect(html).toContain('entranceBlocked=!doorway||');
 expect(html).not.toContain('doorway=[home[0],terrain(...home)+.85,home[1]]');
});
test('W489 physical bounded camera surveys original first three doors without new actors',()=>{
 const homes=[[8,14.2],[-12,13],[-12,1]];
 const sandbox={canvas:{clientWidth:390},followCameraRoofs:()=>[],
  scoreRealMobileMarketArrival:(view,observation)=>({
   score:1,marketOnscreen:true,marketRayClear:true,
   homeOnscreen:true,homeRayClear:observation.firstHome[0]===-12,
   foregroundSceneCover:.12,visibleActualCitizens:1
  }),result:null};
 vm.runInNewContext(production('planPhysicalTradeQuarterWitness')+
  ';result=planPhysicalTradeQuarterWitness({market:[-1,10.2],'+
  'inspectedHomeLots:[[8,14.2],[-12,13],[-12,1]],'+
  'inspectedHomeIndices:[10,7,5],focus:[-1,10.2],yaw:2.15,realHomes:35});',sandbox);
 const a=sandbox.result;
 expect(a.surveyed).toBe(66);
 expect(a.doorwaysInspected).toBe(3);
 expect(a.readableDoorway).toBeGreaterThan(0);
 expect(a.best.homeIndex).toBe(7);
 expect(Array.from(a.home)).toEqual([-12,13]);
 expect(a.noRemovedStructures).toBe(true);
 expect(a.noCreatedActors).toBe(true);
 expect(a.authorityChanged).toBe(false);
});
