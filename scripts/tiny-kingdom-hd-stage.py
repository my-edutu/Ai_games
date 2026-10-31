from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[1]
p=root/'public/tiny-kingdom/index.html'
BASE='f7ae295be845aaa45d885e80d75b3820d69ca3838acd81f2ac4c425f0988c44a'
TARGET='b729a47541cf68509420bb685a9bdff4045f5a4461767d80f42b90a2d194d4e5'
actual=hashlib.sha256(p.read_bytes()).hexdigest()
if actual==TARGET:
 print('Exact HD candidate already applied');raise SystemExit(0)
if actual!=BASE:raise RuntimeError('Refusing unfamiliar source: '+actual)
s=p.read_text()
def change(a,b):
 global s
 if a not in s:raise RuntimeError('Missing anchor '+a[:120])
 s=s.replace(a,b,1)
a=s.index('const vs=`');b=s.index('function shader(',a);s=s[:a]+(root/'scripts/tiny-kingdom-hd/shaders.js').read_text()+s[b:]
change('bindGeometry(buffer);\n\n// Gauntlet 027',"bindGeometry(buffer);\n"+(root/'scripts/tiny-kingdom-hd/shadows.js').read_text()+"\n// Gauntlet 027")
change("eyePosition:gl.getUniformLocation(program,'eyePosition')", "eyePosition:gl.getUniformLocation(program,'eyePosition'),lightViewProjection:gl.getUniformLocation(program,'lightViewProjection'),daylight:gl.getUniformLocation(program,'daylight'),sunDepth:gl.getUniformLocation(program,'sunDepth'),shadowEnabled:gl.getUniformLocation(program,'shadowEnabled'),shadowTexel:gl.getUniformLocation(program,'shadowTexel')")
change('function shadow(x,z,rx,rz){const y=', 'function shadow(x,z,rx,rz){if(sunMap.supported)return;const y=')
change('directionalCastShadows(state.t);', 'if(!sunMap.supported)directionalCastShadows(state.t);else castShadowTriangles=0;')
old='if(gpuAvailable){bindGeometry(staticBuffer);gl.drawArrays(gl.TRIANGLES,0,scenicMeshCache.length/10);}\nbindGeometry(buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,data.length/10);'
new='''bindGeometry(buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);
if(gpuAvailable){
 drawSunMap(scenicMeshCache.length/10,data.length/10,atmosphere);
 gl.uniformMatrix4fv(uniforms.lightViewProjection,false,sunMap.matrix);
 gl.uniform1f(uniforms.daylight,atmosphere.daylight);
 gl.uniform1f(uniforms.shadowEnabled,sunMap.supported?1:0);gl.uniform1f(uniforms.shadowTexel,sunMap.size?1/sunMap.size:0);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sunMap.supported?sunMap.depth:null);gl.uniform1i(uniforms.sunDepth,0);
 bindGeometry(staticBuffer);gl.drawArrays(gl.TRIANGLES,0,scenicMeshCache.length/10);
}
bindGeometry(buffer);gl.drawArrays(gl.TRIANGLES,0,data.length/10);'''
change(old,new)
# Restore the scene program before uploading uniforms after a depth pass; the pass
# itself also restores it. No simulation or saved-state code is changed.
change('surfaceShaderVersion:\'procedural-023\'', "surfaceShaderVersion:'linear-shadow-043'")
change('renderQuality,setRenderQuality,shadowStats:', 'getLightingStats:lightingStats,renderQuality,setRenderQuality,shadowStats:')
# A coherent handmade terracotta range replaces alternating tan checkerboard tiles.
change('const roofTileColors=[rgb(0xa96d50),rgb(0xb27c56),rgb(0x825143),rgb(0xc18b61),rgb(0x97634b)];', 'const roofTileColors=[rgb(0x995e46),rgb(0xa36349),rgb(0x925b46),rgb(0xaa694d),rgb(0x9b6048)];')
# House plaster should not inherit the stone masonry shader from the whole district.
change('box(x,y+.19*scale,z,w,h-.19*scale,d,variant%2?rgb(0xe1c7a0):rgb(0xd1bc97));', 'materialScope(MATERIAL.GENERAL,()=>box(x,y+.19*scale,z,w,h-.19*scale,d,variant%2?rgb(0xe1c7a0):rgb(0xd1bc97)));')
change('tri([xx,y+h,zy],[x,y+ridge,zy],[xr,y+h,zy],rgb(0xd1bf9e));tri([xr,y+h,zz],[x,y+ridge,zz],[xx,y+h,zz],rgb(0xd1bf9e));', 'materialScope(MATERIAL.GENERAL,()=>{tri([xx,y+h,zy],[x,y+ridge,zy],[xr,y+h,zy],rgb(0xd1bf9e));tri([xr,y+h,zz],[x,y+ridge,zz],[xx,y+h,zz],rgb(0xd1bf9e));});')

print('applied renderer',len(s))
# Replace accumulated decorative HUD patches with a single responsive stylesheet.
a=s.index('<style>');b=s.index('</style>',a);s=s[:a]+'<style>\n'+(root/'scripts/tiny-kingdom-hd/interface.css').read_text()+s[b:]
a=s.index('requestAnimationFrame(render);window.__tinyKingdom=');s=s[:a]+(root/'scripts/tiny-kingdom-hd/interface.js').read_text()+'\ninitPresentation();\n'+s[a:]
s=s.replace('getLightingStats:lightingStats,renderQuality,','getPresentationStats:presentationStats,setInspector,setGraphicsPreset,getLightingStats:lightingStats,renderQuality,',1)
s=s.replace('updateWorldRibbon()}}','updateWorldRibbon();const r=document.getElementById("render-readout");if(r)r.textContent=canvas.width+" × "+canvas.height+" · "+(swiftGpu?"Software WebGL":gpuAvailable?"WebGL":"Fallback renderer")}}',1)
s=s.replace('updateWorldRibbon();return commandView;','updateWorldRibbon();if(document.getElementById("panel-nav"))setInspector(next===\'world\'?\'none\':\'overview\');return commandView;',1)
s=s.replace('max(.00018,.00072*','max(.00055,.0014*',1)

print('applied unified HUD',len(s))
# Correct inward cylinder/cone winding exposed by directional light and depth maps.
s=s.replace('quad(v,w,ww,vv,col);tri([x,y+h,z],vv,ww,col)','quad(v,vv,ww,w,col);tri([x,y+h,z],ww,vv,col)',1)
s=s.replace('tri([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x,y+h,z],col)', 'tri([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],col)',1)
a=s.index('function villageGarden(');s=s[:a]+(root/'scripts/tiny-kingdom-hd/district.js').read_text()+'\n'+s[a:]
s=s.replace('data=terrainCache.slice();currentMaterial=MATERIAL.WATER;', 'data=terrainCache.slice();districtStats.plantedBorders=0;districtStats.plants=0;distantLandscape();currentMaterial=MATERIAL.WATER;',1)
s=s.replace('house(x,z,1,k);cottageDetails(x,z,1,k)}hall(0,-1);cottageDetails(0,-1,1.85,2);','house(x,z,1,k);cottageDetails(x,z,1,k);cottageFinish(x,z,1,k)}hall(0,-1);cottageDetails(0,-1,1.85,2);cottageFinish(0,-1,1.85,2);',1)
a=s.index('function vibrantMarket(');b=s.index('function villageFlowerBeds(',a);s=s[:a]+'function vibrantMarket(x,z){marketCanopy(x,z)}\n'+s[b:]
# Remove the old rigid peaked roof below the continuous fabric canopy.
a=s.index('const tent=rgb(0xcaa768)',s.index('function market(x,z)'));b=s.index('for(let i=0;i<4;i++)',a);s=s[:a]+s[b:]
s=s.replace('getLightingStats:lightingStats,','getDistrictStats:()=>({...districtStats}),getLightingStats:lightingStats,',1)
print('applied world finishing',len(s))
s=s.replace('gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);drawAtmosphere(atmosphere);', '''const readout=document.getElementById('render-readout');if(readout){const text=canvas.width+' × '+canvas.height+' · '+(swiftGpu?'Software WebGL':gpuAvailable?'WebGL':'Fallback renderer');if(readout.textContent!==text)readout.textContent=text;}
gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);drawAtmosphere(atmosphere);''',1)
s=s.replace("const sunMap={supported:false,complete:false,size:0,passes:0,key:'',matrix:new Float32Array(16),reason:'WebGL unavailable'};", "const sunMap={supported:false,complete:false,size:0,passes:0,key:'',matrix:new Float32Array(16),reason:gpuAvailable?'Depth texture extension unavailable':'WebGL unavailable'};",1)
s=s.replace('vec3(.035,.055,.09)','vec3(.065,.085,.13)',1)
s=s.replace('#system-panel{display:none;position:fixed;', '#system-panel{display:none;overflow:auto;position:fixed;',1)
print('applied resize and fallback review fixes',len(s))

result=hashlib.sha256(s.encode()).hexdigest()
if result!=TARGET:raise RuntimeError('Generated source differs from tested candidate: '+result)
p.write_text(s)
print('Applied verified HD source '+result)
