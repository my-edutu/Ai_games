'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const slice=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'W217 missing original roof section '+start);
 return source.slice(a,b);
};
const detailed=slice('function house(x,z,','function cottageSideFacades(');
const compact=slice('function compactHouse(x,z,','function compactAtlasStoneCourses(');
const roof=slice('function originalClayRoofCourses(','function getRoofCoursingAudit(');
const skyline=slice('function getInhabitedSkylineAudit()','let streetMorphologyStats');
assert.match(source,/function isHippedHouseRoof\(x,z,variant\)/,
 'W217 one coordinate-stable roof grammar must cover genuine founding and grown homes');
assert.match(roof,/function originalHipRoofCourses\(/,
 'W217 hipped end slopes require retained physically modelled clay courses');
for(const [name,section] of [['founding',detailed],['grown',compact]]){
 assert.match(section,/isHippedHouseRoof\(x,z,variant\)/,name+' roof form must derive from actual original home');
 assert.match(section,/originalHipRoofCourses\(/,name+' must tile sloping hip geometry');
 assert.match(section,/MATERIAL.ROOF/,name+' end slopes must retain original roof shader');
}
assert.match(skyline,/hippedHomeCount:/,'W217 audit must count original complete hipped roofs');
assert.match(skyline,/roofForm:/,'W217 audit must distinguish hip from gable');
assert.match(source,/const HOME_STATIC_GEOMETRY_KEY_VERSION='w\\d+-[a-z0-9-]+';/,
 'W217 roof topology and newer original occupied-home geometries must retain explicit versioned resident cache invalidation');
console.log('W217 source contracts PASS; experience and hardware need real WebGL evidence.');
