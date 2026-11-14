'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const s=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
assert.match(s,/FARM_STREET_WEAVE_MAX_PANELS=38/);
assert.match(s,/FARM_STREET_WEAVE_MAX_TRIANGLES=760/);
assert.match(s,/function renderFarmServiceStreetBoundary\(points\)/);
assert.match(s,/renderRealRoadsideMicroterrain\(points\);\s*renderFarmServiceStreetBoundary\(points\);/);
assert.match(s,/roadsideEcotoneClear\(p\.x,p\.z\)/);
assert.match(s,/boundary:\{\.\.\.farmStreetWeaveStats\}/);
assert.match(s,/stats\.triangles!==stats\.panels\*20/);
const part=s.slice(s.indexOf('function renderFarmServiceStreetBoundary('),
 s.indexOf('// W128: one bounded, low-height ROAD VERGE'));
assert.doesNotMatch(part,/\b(?:state\.[a-zA-Z_$]+\s*=|people\.push|city\.push|rand\s*\()/);
console.log('W210 bounded actual-road source PASS; hardware/visual still unproven');
