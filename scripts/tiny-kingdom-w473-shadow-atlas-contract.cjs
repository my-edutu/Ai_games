'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
test('W473 native static shadows use a bounded persistent texture and not per-frame ring geometry',()=>{
 assert.match(html,/const SOLAR_ATLAS_SIZE=384,SOLAR_ATLAS_EXTENT=48/);
 assert.match(html,/function prepareSolarShadowAtlas\(time,sun\)/);
 assert.match(html,/solarAtlasKey=key;solarAtlasUploads\+\+;solarAtlasBuilds\+\+/);
 assert.match(html,/gl\.texSubImage2D\(gl\.TEXTURE_2D/);
 assert.match(html,/staticShadowGeometrySubmitted:solarShadowAtlasEnabled\(\)\?0/);
 assert.match(html,/if\(useGroundAtlas\)\{[\s\S]*?for\(const p of people\)[\s\S]*?shadowPatch\(p\.x,p\.z/);
 assert.match(html,/if\(sun\.strength<=\.01\)\{solarShadowPrior=null;solarShadowTransition=0;return;\}/);
 assert.match(html,/if\(!solarShadowAtlasEnabled\(\)\)\{[\s\S]*?solarShadowAtlasActive,0/);
});
test('W473 retains real seeded static casters, moving feet and the original software route',()=>{
 const section=html.slice(html.indexOf('function stampSolarAtlasCaster('),html.indexOf('function directionalCastShadows('));
 assert.match(section,/for\(const \[x,z,k\] of city\)/);
 assert.match(section,/for\(const tree of trees\)/);
 assert.match(section,/Math\.hypot\(tree\.x-29,tree\.z-10\)<8/);
 assert.match(section,/stampSolarAtlasCaster\(0,-1/);
 assert.match(section,/stampSolarAtlasCaster\(-27,-18/);
 assert.match(section,/stampSolarAtlasCaster\(29,10/);
 assert.doesNotMatch(section,/Math\.random|people\.push\(|city\.push\(|state\.[a-z]+\s*=/);
 assert.match(html,/function solarShadowAtlasEnabled\(\)\{[\s\S]*?solarAtlasOverride===null\?!swiftGpu:solarAtlasOverride/);
 assert.match(html,/window\.__tinyKingdom=\{getSolarShadowAtlasAudit,setSolarShadowAtlasForTesting,/);
});
test('W473 shader uses world-anchored ground and road shadow factor, never roofs or actors',()=>{
 assert.match(html,/uniform sampler2D solarShadowAtlas;uniform float solarShadowAtlasActive;/);
 assert.match(html,/if\(solarShadowAtlasActive>\.5 &&\s*\(\(vMaterial>\.5&&vMaterial<1\.5\)\|\|\(vMaterial>2\.5&&vMaterial<3\.5\)\)\)/);
 assert.match(html,/clamp\(\(vWorld\.xz\+vec2\(48\.\)\)\/96\./);
 assert.match(html,/c\*=staticGroundShade/);
 assert.match(html,/gl\.uniform1i\(uniforms\.solarShadowAtlas,2\)/);
 assert.match(html,/gl\.uniform1i\(u\.solarShadowAtlas,2\)/);
 assert.match(html,/gl\.uniform1f\(u\.solarShadowAtlasActive,solarShadowAtlasEnabled\(\)\?1:0\)/);
 assert.match(html,/'architectureAtlas','solarShadowAtlas','solarShadowAtlasActive'/);
});
