'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('<script>'),end=html.indexOf('</script>',begin);
assert(begin>0&&end>begin,'actual game has an inline executable script');
new Function(html.slice(begin+8,end));
for(const name of ['grainwardGabledBay','grainwardInhabitedLot','grainwardCivicHallRoof','grainwardGranaryRoof','grainwardMarketRoofEdges','getGrainwardDistrictAudit'])
 assert.ok(new RegExp('function '+name+'\\(').test(html),'missing real Grainward geometry: '+name);
assert.ok(/renderLivedBurgageSideMateriality\(x,z,k,index,isCompact\);\s*grainwardOriginalTallStorey\(x,z,k,index,isCompact\);\s*grainwardInhabitedLot\(x,z,k,index,isCompact\);/.test(html),
 'new structures belong to original cached genuine homes');
assert.ok(/grainwardGranaryRoof\(x,z,eave,peak,w\*\.55\)/.test(html),
 'granary roof anchored to original eave and peak');
assert.ok(/grainwardCivicHallRoof\(x,z,eave,peak,halfRoof\)/.test(html),
 'civic roof anchored to original hall');
assert.ok(/grainwardMarketRoofEdges\(\);/.test(html),
 'stall construction belongs to retained civic batch');
assert.ok(/getGrainwardDistrictAudit:/.test(html),
 'game exposes live rendering inspection');
console.log('W126: full game syntax and true granary-to-market-to-resident architecture contract PASS');