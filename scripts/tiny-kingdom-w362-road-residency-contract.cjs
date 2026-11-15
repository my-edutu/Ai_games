const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin='// W362 ROUTE-RESIDENCY BEGIN',end='// W362 ROUTE-RESIDENCY END';
assert(html.includes(begin)&&html.includes(end),'production source must contain retained route policy');
assert.match(html,/const route=retainedResidentRoadRoute\(origin,h\);/);
assert.match(html,/function renderRealInhabitedLaneNetwork\(\)\{\s*beginRetainedResidentRoadBuild\(\);/);
new vm.Script(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')));
const city=[[1,0,0]];let blocked=false,calls=0,noWalk=false;
const ctx={city,REAL_HOME_LANE_MAX_HOMES:40,
 walkable:(x,z)=>!noWalk&&Number.isFinite(x)&&Number.isFinite(z),
 clearSegment:(a,b)=>!(blocked&&a[1]===0&&b[1]===0&&a[0]<=2&&b[0]>=5),
 routeBetween:(x,z,tx,tz)=>{calls++;return blocked?[[2,2],[tx,tz]]:[[tx,tz]]}};
vm.runInNewContext(html.slice(html.indexOf(begin),html.indexOf(end)+end.length)+
 '\n;globalThis.api={beginRetainedResidentRoadBuild,retainedResidentRoadRoute,getResidentRoadRouteResidencyAudit}',ctx);
const {beginRetainedResidentRoadBuild:beginBuild,retainedResidentRoadRoute:getRoute,
 getResidentRoadRouteResidencyAudit:audit}=ctx.api;
const origin=[0,0],home={index:0,dest:[5,0]},norm=x=>JSON.stringify(x);
beginBuild();assert.equal(norm(getRoute(origin,home)),norm([[5,0]]));
assert.equal(calls,1);
city.push([12,12,1]);beginBuild();getRoute(origin,home);
assert.equal(calls,1,'append-only growth must preserve safe route');
blocked=true;assert.equal(norm(getRoute(origin,home)),norm([[2,2],[5,0]]));
assert.equal(calls,2,'new wall must force original A* reroute');
city[1]=[13,13,1];beginBuild();getRoute(origin,home);
assert.equal(calls,3,'same-count restore must reset');
blocked=false;for(let i=2;i<48;i++)city.push([i*3,i*2,0]);beginBuild();
for(let i=0;i<48;i++)getRoute(origin,{index:i,dest:[5+i,2+i]});
assert(audit().entries<=40,'no unbounded persistent routes');
assert(audit().retained>=1&&audit().invalidations>=1&&audit().resets>=1);
assert.equal(audit().authorityChanged,false);assert.equal(audit().navigationChanged,false);
noWalk=true;const before=calls;getRoute(origin,{index:47,dest:[52,49]});
assert.equal(calls,before+1,'unsafe cached path cannot be silently reused');
console.log('W362 PASS: production integration, full script syntax, append reuse, wall invalidation, same-count restore, bounded cache, unchanged authority. No FPS claim.');
