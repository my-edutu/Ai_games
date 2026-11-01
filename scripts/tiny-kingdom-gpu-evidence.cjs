'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const out = path.resolve('artifacts/tiny-kingdom');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let evidence={errors,webglVerified:false};
  try {
    await page.goto('file://'+path.resolve('public/tiny-kingdom/index.html'),{waitUntil:'load',timeout:30000});
    try {
      await page.waitForFunction(()=>Boolean(window.__tinyKingdom),{timeout:10000});
    } catch (error) {
      // The shader/program compilation exception previously hid behind a generic
      // waitForFunction timeout. Preserve pageerrors to expose actual root cause.
      await page.screenshot({path:path.join(out,'bootstrap-failure.png'),fullPage:true,timeout:90000}).catch(()=>{});
      throw Error('Browser bootstrap failed: '+errors.join(' | ')+'; '+String(error.message));
    }
    // In CI, SwiftShader is a software Vulkan/GL implementation and the shader
    // executes millions of procedural noise instructions per HD screenshot.
    // Throttle pixel count and scene updates before the first capture.
    const softwareRendererRenderBudget=await page.evaluate(()=>{
      const game=window.__tinyKingdom;
      const tier=game.renderQuality();
      if(tier.tier!=='hardware-webgl')game.setRenderQuality(.55);
      return game.renderQuality();
    });
    await page.waitForTimeout(1200);
    evidence = await page.evaluate(() => {
      const canvases=[...document.querySelectorAll('canvas')];
      const contexts=canvases.map(c=>{
        // Querying an existing renderer canvas for WebGL is safe only when the engine
        // has already created it; never count a newly allocated probe canvas.
        const gl=c.getContext('webgl2')||c.getContext('webgl');
        if(!gl)return {webgl:false,width:c.width,height:c.height};
        const ext=gl.getExtension('WEBGL_debug_renderer_info');
        return {webgl:true,width:c.width,height:c.height,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};
      });
      return {contexts,metrics:window.__tinyKingdom.metrics(),webglVerified:contexts.some(x=>x.webgl)};
    });

    // G105: record actual scenery triangle submissions, not just total generated meshes.
    // This is a camera/workload-specific software-WebGL observation, not hardware FPS.
    evidence.scenicVisibility=await page.evaluate(()=>window.__tinyKingdom.getScenicVisibilityStats());
    evidence.materials=await page.evaluate(()=>window.__tinyKingdom.getMaterialSystem());
    evidence.materialVertexAttribute=await page.evaluate(()=>{
      const gl=document.getElementById('world').getContext('webgl');
      if(!gl)return -1;
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      return program?gl.getAttribLocation(program,'materialId'):-1;
    });
    if(evidence.webglVerified&&evidence.materialVertexAttribute<0)throw Error('GPU material attribute was optimized away or omitted');
    // G071: preserve the original nine IDs/stride and assert both new emissive
    // glass classes; fixed length nine would reject a valid additive material.
    const expectedMaterials=['GENERAL','GRASS','WATER','ROAD','FOLIAGE','STONE',
      'WOOD','ROOF','PLASTER','WINDOW_GLOW','LANTERN_GLOW'];
    if(evidence.materials.vertexStride!==10||
       JSON.stringify(evidence.materials.materials)!==JSON.stringify(expectedMaterials))
      throw Error('GPU material layout mismatch: '+JSON.stringify(evidence.materials));
    // G079 shader-level acceptance: examine the actual attached fragment
    // program, numerical gamma error, authority isolation and GL state.
    evidence.filmicGamma=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      const gl=document.getElementById('world').getContext('webgl');
      const program=gl?.getParameter(gl.CURRENT_PROGRAM);
      const shader=program?(gl.getAttachedShaders(program)||[]).find(s=>
        gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
      const src=shader?gl.getShaderSource(shader):'';
      let maxError=0;
      for(let i=50;i<=999;i++){
        const x=i/1000,y=x+(Math.sqrt(x)-x)*(.135+.14*x);
        maxError=Math.max(maxError,Math.abs(y-Math.pow(x,.88)));
      }
      return {active:src.includes('vec3 fastFilmicGamma(vec3 x)')&&
           src.includes('mapped=fastFilmicGamma(mapped);'),
        oldPowPresent:src.includes('mapped=pow(max(mapped'),
        maxApproxError:maxError,glError:gl.getError(),
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    if(!evidence.filmicGamma.active||evidence.filmicGamma.oldPowPresent||
       evidence.filmicGamma.maxApproxError>=.0032||
       evidence.filmicGamma.glError!==0||!evidence.filmicGamma.authorityUnchanged)
      throw Error('G079 real WebGL filmic gamma regression: '+JSON.stringify(evidence.filmicGamma));
    // G089: prove the actual attached fragment shader, not a source-only
    // marker, implements near-identical 3D meadow and far 2D coherent samples.
    evidence.meadowFarLod=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      const gl=document.getElementById('world').getContext('webgl');
      const program=gl?.getParameter(gl.CURRENT_PROGRAM);
      const fragment=program?(gl.getAttachedShaders(program)||[]).find(s=>
        gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
      const shader=fragment?gl.getShaderSource(fragment):'';
      const grass=shader.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]
        ?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
      return {
        active:grass.includes('float groundDistance=length(eyePosition.xz-vWorld.xz);')&&
          grass.includes('float farMeadowMix=smoothstep(26.,42.,groundDistance);')&&
          grass.includes('if(groundDistance<42.) meadow=noise3(')&&
          grass.includes('float distantMeadow=mix(')&&
          grass.includes('meadow=mix(meadow,distantMeadow,farMeadowMix);'),
        oldUnconditional:grass.includes('float meadow=noise3('),
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot()),
        glError:gl?.getError()??-1
      };
    });
    if(!evidence.meadowFarLod.active||evidence.meadowFarLod.oldUnconditional||
       !evidence.meadowFarLod.authorityUnchanged||evidence.meadowFarLod.glError!==0)
      throw Error('G089 GPU far-meadow program failed: '+JSON.stringify(evidence.meadowFarLod));
    // G058: inspect the active fragment shader on real SwiftShader, not just
    // the source file or a fake feature flag. The new lighting is grass-only.
    evidence.terrainMicroRelief=await page.evaluate(()=>{
      const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
      const gl=document.getElementById('world').getContext('webgl');
      if(!gl)return {active:false,authorityUnchanged:false};
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      const fragment=(gl.getAttachedShaders(program)||[]).find(s=>
        gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER);
      const src=fragment?gl.getShaderSource(fragment):'';
      const grass=src.slice(src.indexOf('if(vMaterial>0.5&&vMaterial<1.5)'),
        src.indexOf('}else if(vMaterial>1.5&&vMaterial<2.5)'));
      const road=src.slice(src.indexOf('}else if(vMaterial>2.5&&vMaterial<3.5)'),
        src.indexOf('}else if(vMaterial>3.5&&vMaterial<4.5)'));
      return {active:grass.includes('vec3 microNormal=normalize(')&&
        grass.includes('detailFade=1.-smoothstep(')&&
        grass.includes('fineLight/baseLight')&&
        grass.includes('tuftMask=1.-smoothstep(')&&
        grass.includes('hash3(vec3(cellID,11.))')&&
        grass.includes('vWorld.xz')&&
        !grass.includes('strandX=sin(')&&
        !road.includes('microNormal'),
        authorityUnchanged:before===JSON.stringify(game.exportSnapshot())};
    });
    if(!evidence.terrainMicroRelief.active||!evidence.terrainMicroRelief.authorityUnchanged)
      throw Error('G058 active GPU grass normal/fade/isolation gate failed: '+JSON.stringify(evidence.terrainMicroRelief));
    // G060: evidence from the *attached* fragment program on the real GPU.
    // No terrain mesh growth, no changed authoritative snapshot, no stone
    // weathering accidentally bleeding onto footpaths, roofs or plaster.
    evidence.highlandBedrock=await page.evaluate(()=>{
      const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
      const gl=document.getElementById('world').getContext('webgl');
      if(!gl)return {active:false,materialIsolated:false,authorityUnchanged:false};
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      const fragment=(gl.getAttachedShaders(program)||[]).find(shader=>
        gl.getShaderParameter(shader,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER);
      const source=fragment?gl.getShaderSource(fragment):'';
      const grass=source.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
      const road=source.split('}else if(vMaterial>2.5&&vMaterial<3.5)')[1]?.split('}else if(vMaterial>3.5&&vMaterial<4.5)')[0]||'';
      return {active:grass.includes('float rockShelfNoise=')&&
        grass.includes('float mineralBedding=')&&
        grass.includes('float exposedBedrock=')&&
        grass.includes('float screeGrain=')&&
        grass.includes('vec3 exposedStone=')&&
        grass.includes('smoothstep(.035,.15,slope)')&&
        grass.includes('vWorld.y'),
        materialIsolated:!road.includes('rockShelfNoise')&&
          !road.includes('exposedBedrock'),
        authorityUnchanged:before===JSON.stringify(game.exportSnapshot())};
    });
    if(!evidence.highlandBedrock.active||!evidence.highlandBedrock.materialIsolated||
       !evidence.highlandBedrock.authorityUnchanged)
      throw Error('G060 active WebGL highland-bedrock gate failed: '+JSON.stringify(evidence.highlandBedrock));
    // GPU static vertex upload invariant: camera motion must never re-upload
    // dense terrain and village meshes; only moving agents update per frame.
    // G047: stop authoritative clock before checking static GPU upload count.
    // The previous harness raced the night/daylight static-mesh key at dawn
    // and falsely attributed a legitimate sky-stage rebuild to camera motion.
    await page.locator('#pause').click();
    await page.waitForFunction(()=>document.getElementById('pause').textContent.includes('Resume'));
    const freezeClock=await page.evaluate(()=>window.__tinyKingdom.getState().state.t);
    // The render loop samples the atmosphere before the final fixed-step ticks.
    // Ensure its cached dawn/daylight mesh has caught up to the frozen state
    // before evaluating a camera-only invariant; never forgive an actual
    // additional static upload after the synchronized baseline is recorded.
    await page.waitForFunction(()=>{
      const g=window.__tinyKingdom,time=g.getState().state.t;
      const c=g.climateAt(time),sky=g.skyConditions(time);
      const terrain=c.season+':'+(c.season===3&&c.weather==='snow'?1:0);
      // G071 WebGL static geometry no longer bakes day/night lighting.
      // Sunlight and glass emission use time-varying shader uniforms.
      const expected=terrain+':shader-light:'+(g.metrics().buildings-2);
      return g.renderStats().scenicMeshKey===expected&&g.renderStats().staticGpuUploads>=1;
    },null,{timeout:45000});
    evidence.staticGPU=await page.evaluate(()=>window.__tinyKingdom.renderStats());
    await page.evaluate(()=>window.__tinyKingdom.setCamera({zoom:24,pitch:.51,yaw:.82,focus:[0,0]}));
    await page.waitForTimeout(450);
    evidence.staticGPUAfterCamera=await page.evaluate(()=>window.__tinyKingdom.renderStats());
    // G056 real-renderer idle gate: with simulation paused and an unchanged
    // camera, expensive scene regeneration/draws must stop. Count actual
    // completed engine frames (not rAF callbacks) on the same SwiftShader GPU.
    const frozenBaseline=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      return {quality:g.renderQuality(),authority:JSON.stringify(g.exportSnapshot())};
    });
    await page.waitForFunction(previous=>
      window.__tinyKingdom.renderQuality().idleFrames>=previous+6,
      frozenBaseline.quality.idleFrames,{timeout:20000});
    evidence.pausedFrameReuse=await page.evaluate(before=>{
      const g=window.__tinyKingdom,q=g.renderQuality();
      return {idleSkips:q.idleFrames-before.quality.idleFrames,
        submittedFrames:q.framesDrawn-before.quality.framesDrawn,
        authorityUnchanged:before.authority===JSON.stringify(g.exportSnapshot()),
        tier:q.tier};
    },frozenBaseline);
    if(evidence.pausedFrameReuse.idleSkips<6||
       evidence.pausedFrameReuse.submittedFrames>1||
       !evidence.pausedFrameReuse.authorityUnchanged)
      throw Error('G056 frozen-frame GPU performance/replay gate failed: '+
        JSON.stringify(evidence.pausedFrameReuse));
    const stillClock=await page.evaluate(()=>window.__tinyKingdom.getState().state.t);
    if(stillClock!==freezeClock)throw Error('Pausing authority failed during camera-only GPU test');

    if(evidence.webglVerified){
      if(!evidence.staticGPU.dualBufferGPU||evidence.staticGPU.staticGpuUploads<1)
        throw Error('Static GPU vertex buffer was not uploaded');
      if(evidence.staticGPUAfterCamera.staticGpuUploads!==evidence.staticGPU.staticGpuUploads)
        throw Error('Moving camera re-uploaded static world');
    }
    evidence.renderBudget=softwareRendererRenderBudget;
    evidence.geometry=await page.evaluate(()=>window.__tinyKingdom.getGeometryAudit());
    // G055: read the exact live WebGL shadow mesh vertices, not a marker.
    // A zero-interpolation or wrong-material shadow must fail the GPU gate.
    evidence.shadowPenumbra=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      return {...g.getShadowGradientAudit(),
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    if(evidence.shadowPenumbra.triangles<1000||
       evidence.shadowPenumbra.inspected!==evidence.shadowPenumbra.triangles||
       evidence.shadowPenumbra.gradientTriangles<evidence.shadowPenumbra.triangles*.95||
       evidence.shadowPenumbra.wrongMaterials!==0||!evidence.shadowPenumbra.authorityUnchanged)
      throw Error('G055 real GPU gradient shadow/authority gate failed: '+JSON.stringify(evidence.shadowPenumbra));
    // G054b: vertex-level material classification on the same actual SwiftShader
    // buffers used to render the screenshots. This catches stone joints on silk.
    evidence.materialSwatches=await page.evaluate(()=>{
      const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
      return {swatches:game.getMaterialSwatchAudit(),
        authorityUnchanged:before===JSON.stringify(game.exportSnapshot())};
    });
    for(const [name,expected] of [['guildCloth',48],['guildGoldTrim',1],
                                   ['marketCanvas',2],['festivalGoldSilk',1]]){
      const row=evidence.materialSwatches.swatches[name];
      if(!row||row.general<expected||row.stone!==0||row.roof!==0||row.plaster!==0)
        throw Error('G054b real GPU cloth material inherited masonry: '+name+' '+JSON.stringify(row));
    }
    // G054c: timbered houses are lime plaster and exposed timber rather than
    // dark, regularly coursed stone. Foundations remain actual dressed stone.
    for(const name of ['housePlasterCream','housePlasterWarm','houseGablePlaster',
                       'sidePlasterOak','sidePlasterAsh','sidePlasterLime','sidePlasterSand']){
      const row=evidence.materialSwatches.swatches[name];
      if(!row||row.plaster<1||row.general!==0||row.stone!==0||row.roof!==0)
        throw Error('G057 plaster material leaked into general/stone/roof: '+name+' '+JSON.stringify(row));
    }
    if(evidence.materialSwatches.swatches.houseFoundation.stone<1||
       evidence.materialSwatches.swatches.houseFoundation.general!==0||
        evidence.materialSwatches.swatches.houseFoundation.plaster!==0)
      throw Error('G054c foundation is not real stone: '+JSON.stringify(evidence.materialSwatches.swatches.houseFoundation));
    if(evidence.materialSwatches.swatches.guildCloth.total!==48||
       evidence.materialSwatches.swatches.marketCanvas.total!==2||
       !evidence.materialSwatches.authorityUnchanged)
      throw Error('G054b actual GPU colored cloth triangle audit/replay failed: '+JSON.stringify(evidence.materialSwatches));

    for(const mesh of [evidence.geometry.static,evidence.geometry.dynamic]){
      if(!mesh.aligned||mesh.invalidComponents||mesh.invalidNormals||mesh.invalidColors||mesh.outOfBounds)throw Error('Malformed 3D geometry: '+JSON.stringify(mesh));
    }
    // G046: exact emitted side-façade triangles, not just a static file marker.
    // This also keeps the screenshot workload bounded on SwiftShader.
    evidence.cottageFacades=await page.evaluate(()=>{
      const g=window.__tinyKingdom,authority=JSON.stringify(g.exportSnapshot());
      const details=g.getCottageFacadeStats();
      return {...details,registeredDetailedHomes:g.getVillageVisualLod().detailedHomes,
        guildhall:g.getGuildhallVisualStats(),authorityUnchanged:authority===JSON.stringify(g.exportSnapshot())};
    });
    const f=evidence.cottageFacades;
    // The unique civic guildhall is no longer a duplicated cottage façade.
     // Count actual detailed cottages in the runtime instead of hardcoded 13.
     if(f.homes!==f.registeredDetailedHomes||f.styles.length!==4||Math.max(...f.styles.map(style=>style.count))>5||f.plasterPanels!==f.homes*2||
       f.sideWindows!==f.homes*4||f.diagonalBraces<f.homes*4||
       f.meshTriangles<=f.homes*100||f.meshTriangles>=f.homes*450||
       !f.guildhall||f.guildhall.belfries!==1||f.guildhall.triangles<350||
        !f.authorityUnchanged||evidence.geometry.totalTriangles>=160000)
      throw Error('Gauntlet 046 facade geometry budget or identity failed: '+JSON.stringify(f));
    // G047: real emitted boughs and needles, no decorative CSS/metadata substitute.
    // The checks are tied to the actual uploaded static mesh and camera-invariant save.
    evidence.forestVisual=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      return {...g.getForestVisualStats(),
        sourceClearance:g.getFarmTreeClearanceStats(),
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    const forest=evidence.forestVisual;
    // G089B: measure full-detail near trees and independently assert actual
    // VBO geometry headroom, not merely a self-reported LOD counter.
    evidence.forestLod=await page.evaluate(()=>window.__tinyKingdom.getForestLodStats());
    const lod=evidence.forestLod;
    if(forest.conifers<=15||forest.deciduous<=15||forest.renderedTrees!==forest.conifers+forest.deciduous||
       forest.sourceTrees!==forest.sourceClearance.forestSourceCount||
       forest.renderedTrees!==forest.sourceClearance.renderedForestCount||
       lod.renderedTrees!==forest.renderedTrees||
       lod.nearTrees<4||lod.midTrees<4||lod.farTrees<20||
       lod.nearTrees+lod.midTrees+lod.farTrees!==forest.renderedTrees||
       lod.reclaimedTriangles<7500||
       forest.needleBoughs+lod.skippedConiferSprays!==forest.conifers*32||
       forest.needleFanTriangles!==forest.needleBoughs*8||
       forest.branchTriangles!==forest.needleBoughs*8||
       forest.microCrownLobes<forest.deciduous*3||
       forest.rimLeafSprays<forest.deciduous*3||
       forest.individualLeaves<forest.deciduous*15||
// G096 adds an inhabited street and workshop precinct. Keep the real
       // global <160k safety cap with at least 1k buffer; never present
       // G089's old 153.5k engineering sub-budget as the commercial gate.
       forest.crownColors<4||!forest.authorityUnchanged||
       evidence.geometry.totalTriangles>=159000)
      throw Error('G047/G089B tree preservation, real mesh savings, replay or volume failed: '+JSON.stringify({forest,lod,geometry:evidence.geometry.totalTriangles}));
    // G050: the climate-aware material is bound to the ACTUAL active WebGL
    // program and receives precipitation from authoritative climateAt().
    evidence.ecoregions=await page.evaluate(()=>{
      const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      const uniform=program?gl.getUniformLocation(program,'weatherWetness'):null;
      return {
        river:g.getTerrainBiomeSample(0,20,7),upland:g.getTerrainBiomeSample(38,33,7),
        meadow:g.getTerrainBiomeSample(0,-18,7),clear:g.getClimateMaterialProfile(24*2+7),
        shaderUniformActive:!!uniform,
        boundWetness:uniform?gl.getUniform(program,uniform):null
      };
    });
    if(!evidence.ecoregions.shaderUniformActive||
       evidence.ecoregions.boundWetness===null||
       Math.abs(evidence.ecoregions.boundWetness-1)>.11||
       evidence.ecoregions.river.riparianMoisture<.95||
       evidence.ecoregions.upland.highlandExposure<.2||
       evidence.ecoregions.meadow.riparianMoisture>.05)
      throw Error('G050 rainfall/upland terrain shader binding gate failed: '+JSON.stringify(evidence.ecoregions));
    evidence.horizon=await page.evaluate(()=>window.__tinyKingdom.getHorizonStats());
    if(evidence.horizon.triangles!==656||evidence.horizon.outerBands!==2||
       evidence.horizon.extent<91||evidence.horizon.extent>95||
       evidence.geometry.totalTriangles>=160000)
      throw Error('Gauntlet 052 seamless low-LOD horizon budget gate failed: '+JSON.stringify(evidence.horizon));
    // G061: sample the *running* terrain geometry function, not a copied
    // promotional height map. The unchanged central basin is the control;
    // outside it, measurable sculpted crests and gullies must be present.
    evidence.highlandSculpt=await page.evaluate(()=>{
      const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
      const old=(x,z)=>{
        const d=Math.hypot(x,z),e=Math.max(0,Math.min(1,(d-24)/18));
        return .13*Math.sin(x*.32)*Math.cos(z*.24)+
         .7*Math.pow(Math.abs(x)/40,2)+.25*Math.pow(Math.abs(z)/38,2)+
         e*e*(2.8+1.8*Math.sin(x*.18+z*.11)*Math.cos(z*.24));
      };
      let changed=0,minDelta=Infinity,maxDelta=-Infinity;
      for(let x=-42;x<=42;x+=4)for(let z=-42;z<=42;z+=4){
        if(Math.hypot(x,z)<30)continue;
        const delta=game.getTerrainHeight(x,z)-old(x,z);
        if(Math.abs(delta)>.20)changed++;
        minDelta=Math.min(minDelta,delta);maxDelta=Math.max(maxDelta,delta);
      }
      const center=[[-12,7],[0,0],[22,3]].map(([x,z])=>
        Math.abs(game.getTerrainHeight(x,z)-old(x,z)));
      return {changed,minDelta,maxDelta,centerMaxDelta:Math.max(...center),
       authorityUnchanged:before===JSON.stringify(game.exportSnapshot())};
    });
    if(evidence.highlandSculpt.changed<=95||
       evidence.highlandSculpt.maxDelta-evidence.highlandSculpt.minDelta<1.8||
       evidence.highlandSculpt.centerMaxDelta>1e-10||
       !evidence.highlandSculpt.authorityUnchanged)
      throw Error('G061 real world-elevation highland sculpt gate failed: '+
        JSON.stringify(evidence.highlandSculpt));
    evidence.highlandRocks=await page.evaluate(()=>window.__tinyKingdom.getHighlandRockStats());
    if(evidence.highlandRocks.clusters!==32||
       evidence.highlandRocks.stones!==96||
       evidence.highlandRocks.triangles!==2304||
       evidence.highlandRocks.heights.some(h=>!Number.isFinite(h)||h<.84)||
       evidence.geometry.totalTriangles>=160000)
      throw Error('Gauntlet 051 terrain-rock sculpture or full-scene GPU budget gate failed: '+JSON.stringify(evidence.highlandRocks));
    evidence.orchard=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      return {...g.getOrchardVisualStats(),authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    if(evidence.orchard.trees!==9||evidence.orchard.forks!==27||
       evidence.orchard.tipTwigs!==27||evidence.orchard.crownLobes!==36||
       evidence.orchard.fruit!==45||evidence.orchard.meshTriangles!==3726||
       !evidence.orchard.authorityUnchanged||evidence.geometry.totalTriangles>=160000)
      throw Error('Orchard geometry, camera authority or GPU budget regression: '+JSON.stringify(evidence.orchard));
    // G062: assert the active GPU static mesh includes 22 nondegenerate
    // tapered first-ring end-reach sections, under the strict 160k budget.
    evidence.outerRiverReach=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      return {...g.getOuterRiverReachStats(),
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    if(evidence.outerRiverReach.sides!==2||
       evidence.outerRiverReach.segmentsPerSide!==8||
       evidence.outerRiverReach.waterTriangles!==192||
       evidence.outerRiverReach.bankTriangles!==128||
       evidence.outerRiverReach.totalTriangles!==320||
       Math.abs(evidence.outerRiverReach.centerWidth-1.8)>1e-12||
       Math.abs(evidence.outerRiverReach.tipWidth-.08)>1e-10||
       !evidence.outerRiverReach.authorityUnchanged||
       evidence.geometry.totalTriangles>=160000)
      throw Error('G062 real GPU river reach / triangle / replay gate failed: '+
        JSON.stringify(evidence.outerRiverReach));
    evidence.water=await page.evaluate(()=>window.__tinyKingdom.waterStats());
    if(evidence.water.model!=='channel-depth-sediment-fresnel-v2'||evidence.water.waterTriangles!==1260||evidence.water.bankTriangles!==840)
      throw Error('River material or shoreline geometry gate failed');
    // G063: verify compiled/attached SwiftShader water optics, not a source
    // promise or shader version flag. Check CPU sampling and immutable authority.
    evidence.riverOptics=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      const gl=document.getElementById('world').getContext('webgl');
      const program=gl?.getParameter(gl.CURRENT_PROGRAM);
      const fragment=program?(gl.getAttachedShaders(program)||[]).find(shader=>
        gl.getShaderParameter(shader,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER):null;
      const source=fragment?gl.getShaderSource(fragment):'';
      const water=source.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[1]?.split('}else if(vMaterial>2.5&&vMaterial<3.5)')[0]||'';
      const grass=source.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
      const road=source.split('}else if(vMaterial>2.5&&vMaterial<3.5)')[1]?.split('}else if(vMaterial>3.5&&vMaterial<4.5)')[0]||'';
      const center=g.sampleRiverOptics(0,20),bank=g.sampleRiverOptics(0,21.8);
      const x=44,reach=g.sampleRiverOptics(x,20+3*Math.sin(x*.13));
      return {
        active:water.includes('float channelDepth=')&&
          water.includes('float sedimentGrain=noise3(')&&
          water.includes('vec2 riverCurrent=normalize(')&&
          water.includes('float bankFoam=smoothstep(')&&
          water.includes('worldTime*.76')&&water.includes('worldTime*1.24')&&
          water.includes('vec3 deepBed='),
        materialIsolated:!grass.includes('float channelDepth=')&&!road.includes('float channelDepth='),
        center,bank,reach,
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())
      };
    });
    if(!evidence.riverOptics.active||!evidence.riverOptics.materialIsolated||
       !evidence.riverOptics.authorityUnchanged||
       Math.abs(evidence.riverOptics.center.channelDepth-1)>1e-8||
       Math.abs(evidence.riverOptics.bank.bankFoam-1)>1e-8||
       !(evidence.riverOptics.reach.riverWidth<1.8)||
       !(evidence.riverOptics.reach.riverWidth>.08))
      throw Error('G063 active GPU channel-depth/sediment/flow optics gate failed: '+
        JSON.stringify(evidence.riverOptics));
    evidence.garments=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      const profiles=g.getCitizenProfiles().map((_,i)=>g.getGarmentProfile(i));
      return {citizens:profiles.length,distinctProfiles:new Set(profiles.map(p=>p.style+':'+p.rings.map(r=>r.rx.toFixed(3)).join(','))).size,
        panelCount:profiles[0]?.panelCount,trianglesPerCoat:profiles[0]?.surfaceTriangles,
        finite:profiles.every(p=>p.rings.length===5&&p.rings.every(r=>[r.y,r.rx,r.rz,r.z].every(Number.isFinite)))};
    });
    if(evidence.garments.citizens<12||evidence.garments.distinctProfiles<6||
       evidence.garments.panelCount!==8||evidence.garments.trianglesPerCoat!==104||!evidence.garments.finite)
      throw Error('G040 authored garment geometry profile regression: '+JSON.stringify(evidence.garments));
    evidence.faces=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      const profiles=g.getCitizenProfiles().map((_,i)=>g.getFaceProfile(i));
      return {citizens:profiles.length,distinctMorphologies:new Set(profiles.map(p=>
        [p.jawWidth,p.cheekWidth,p.eyeSpacing,p.noseProjection].map(v=>v.toFixed(4)).join(':'))).size,
        segments:profiles[0]?.segments,meshTriangles:profiles[0]?.meshTriangles,
        beardProfiles:profiles.filter(p=>p.beard).length,
        finite:profiles.every(p=>p.rings.length===7&&p.rings.every(r=>
          [r.y,r.rx,r.rz,r.z].every(Number.isFinite)))};
    });
    if(evidence.faces.citizens<12||evidence.faces.distinctMorphologies<12||
       evidence.faces.segments!==12||evidence.faces.meshTriangles!==156||!evidence.faces.finite)
      throw Error('G041 face topology or individuality regression: '+JSON.stringify(evidence.faces));
    // G059: prove the running game exposes finite, continuous facial normals
    // with jaw/crown taper and that this read-only inspection cannot mutate replay.
    evidence.faceSurfaceNormals=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      const citizenCount=g.getCitizenProfiles().length;
      let sampled=0,maxLengthError=0,minAdjacentDot=1,minFrontNormal=1;
      let jawSlope=true,crownSlope=true;
      const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
      for(let idx=0;idx<citizenCount;idx++){
        const profile=g.getFaceProfile(idx),field=g.getFaceNormalProfile(idx);
        if(!Array.isArray(field)||field.length!==profile.rings.length)
          return {error:'missing face normal rings',idx};
        for(const ring of field){
          if(!Array.isArray(ring)||ring.length!==profile.segments)
            return {error:'missing normal sectors',idx};
          for(let j=0;j<ring.length;j++){
            const n=ring[j],next=ring[(j+1)%ring.length];
            if(!Array.isArray(n)||n.length!==3||!n.every(Number.isFinite))
              return {error:'nonfinite normal',idx};
            sampled++;
            maxLengthError=Math.max(maxLengthError,Math.abs(Math.hypot(...n)-1));
            minAdjacentDot=Math.min(minAdjacentDot,dot(n,next));
          }
        }
        jawSlope=jawSlope&&field[0][0][1]<-.05;
        crownSlope=crownSlope&&field.at(-1)[0][1]>.05;
        minFrontNormal=Math.min(minFrontNormal,field[3][0][2]);
      }
      return {citizenCount,sampled,maxLengthError,minAdjacentDot,
        minFrontNormal,jawSlope,crownSlope,
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    if(evidence.faceSurfaceNormals.error||evidence.faceSurfaceNormals.citizenCount<12||
       evidence.faceSurfaceNormals.sampled<1000||
       evidence.faceSurfaceNormals.maxLengthError>1e-5||
       evidence.faceSurfaceNormals.minAdjacentDot<.70||
       evidence.faceSurfaceNormals.minFrontNormal<.7||
       !evidence.faceSurfaceNormals.jawSlope||
       !evidence.faceSurfaceNormals.crownSlope||
       !evidence.faceSurfaceNormals.authorityUnchanged)
      throw Error('G059 live smooth facial normal gate: '+JSON.stringify(evidence.faceSurfaceNormals));
    evidence.meadow=await page.evaluate(()=>window.__tinyKingdom.getMeadowStats());
    evidence.visualHud=await page.evaluate(()=>({
      worldFilter:getComputedStyle(document.querySelector('#world')).filter,
      headingPx:parseFloat(getComputedStyle(document.querySelector('.name')).fontSize),
      panelGradient:getComputedStyle(document.querySelector('.sidebar .panel')).backgroundImage.includes('gradient'),
      scenicChoices:document.querySelectorAll('.tour-btn[data-scenic]').length,
      liveLaborControl:!!document.getElementById('workday-live'),
      workHistoryControl:!!document.getElementById('workday-watch')
    }));
    if(evidence.meadow.clusters<240||evidence.meadow.triangles!==evidence.meadow.clusters*8||!evidence.meadow.cached)
      throw Error('Gauntlet 034 meadow budget or static-cache contract failed');
    if(evidence.visualHud.worldFilter!=='none'||evidence.visualHud.headingPx<25||
       !evidence.visualHud.panelGradient||evidence.visualHud.scenicChoices!==7||
       !evidence.visualHud.liveLaborControl||!evidence.visualHud.workHistoryControl)
      throw Error('Gauntlet 033 visual HUD contract failed');
    evidence.skyDaybreak=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      return {night:g.getSkyPalette(1),dawn:g.getSkyPalette(7),noon:g.getSkyPalette(13)};
    });
    if(evidence.skyDaybreak.dawn.nightStars!==0||
       evidence.skyDaybreak.dawn.horizon[0]<=evidence.skyDaybreak.dawn.horizon[2]||
       evidence.skyDaybreak.noon.zenith[2]<=evidence.skyDaybreak.noon.zenith[0])
      throw Error('Gauntlet 048 sunrise/sky color coherence gate failed');
    evidence.canopyShadows=await page.evaluate(()=>window.__tinyKingdom.sampleCanopyShadow(-25,13));
    if(evidence.canopyShadows.length!==9||
       Math.abs(evidence.canopyShadows[0]-evidence.canopyShadows[8])>1e-5||
       Math.max(...evidence.canopyShadows)-Math.min(...evidence.canopyShadows)<.12)
      throw Error('G049 forest shadow must be irregular and close its outline');
    evidence.errors=errors;
    await page.screenshot({path:path.join(out,'day1.png'),fullPage:true,timeout:90000});
    // Matched camera framing and a deterministic later-day sample are essential
    // to distinguish lighting/geometry progress from a fortunate opening frame.
    await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.setCamera({zoom:14,pitch:0.43,focus:[0,-1]});
    });
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'settlement-close.png'),fullPage:true,timeout:90000});

    // G042: camera-identical wide screenshot of the interactive world-first
    // resource command strip; unlike cinema, pause/camera controls remain shown.
    evidence.worldFirstHud=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      const authority=JSON.stringify(g.exportSnapshot());
      g.setCommandView('world');
      const ribbon=document.querySelector('#world-ribbon').getBoundingClientRect();
      const hidden=['.sidebar','.feed','.atlas'].every(selector=>
        getComputedStyle(document.querySelector(selector)).display==='none');
      const state={
        view:g.getCommandView(),
        ribbonVisible:ribbon.width>100&&ribbon.height>25,
        withinViewport:ribbon.left>=0&&ribbon.right<=innerWidth,
        sidePanelsHidden:hidden,
        primaryControlVisible:getComputedStyle(document.querySelector('#pause')).display!=='none',
        resourceValues:['world-population','world-food','world-wood','world-gold']
          .map(id=>Number(document.getElementById(id).textContent.trim())),
        authorityUnchanged:authority===JSON.stringify(g.exportSnapshot())
      };
      return state;
    });
    if(evidence.worldFirstHud.view!=='world'||!evidence.worldFirstHud.ribbonVisible||
       !evidence.worldFirstHud.withinViewport||!evidence.worldFirstHud.sidePanelsHidden||
       !evidence.worldFirstHud.primaryControlVisible||!evidence.worldFirstHud.authorityUnchanged||
       evidence.worldFirstHud.resourceValues.some(value=>!Number.isFinite(value)||value<0))
      throw Error('G042 world-first UI contract failed: '+JSON.stringify(evidence.worldFirstHud));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'world-first-wide.png'),fullPage:true,timeout:90000});
    await page.evaluate(()=>window.__tinyKingdom.setCommandView('command'));

    // Character-study capture: actual SwiftShader render at a reproducible close
    // camera, without HUD covering the garments. This is evidence, not parity.
    await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      const subject=g.getNavigation()[0].position;
      g.setCamera({focus:subject,zoom:9,pitch:.37,yaw:.78});
      g.setHudMode('cinema');
      g.setReferenceCapture(true);
    });
    await page.waitForTimeout(450);
    await page.screenshot({path:path.join(out,'citizen-study.png'),fullPage:true,timeout:90000});
    // Front-of-face view is aligned to the subject's actual next waypoint,
    // not a flattering arbitrary orbit. A second real GPU image makes eyes,
    // ears, jaw and nose geometry inspectable rather than hidden from behind.
    evidence.faceCamera=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      const candidates=g.getNavigation().map((person,index)=>{
        const point=person.path?.length?person.path[0]:person.target;
        const heading=point?Math.atan2(point[0]-person.position[0],point[1]-person.position[1]):0;
        let clearance=0;
        for(let d=.6;d<=8.5;d+=.45){
          if(!g.walkable([person.position[0]+Math.sin(heading)*d,
                          person.position[1]+Math.cos(heading)*d]))break;
          clearance=d;
        }
        return {person,index,heading,clearance};
      }).sort((a,b)=>b.clearance-a.clearance||a.index-b.index);
      const chosen=candidates[0],subject=chosen.person;
      g.setCamera({focus:subject.position,zoom:9,pitch:.25,yaw:chosen.heading});
      return {subject:subject.name,index:chosen.index,heading:chosen.heading,
        position:subject.position,clearance:chosen.clearance};
    });
    await page.waitForTimeout(450);
    await page.screenshot({path:path.join(out,'face-study.png'),fullPage:true,timeout:90000});

    // G053: real GPU capture of the selected citizen using the in-game Follow
    // control rather than a debug camera. The comparison is source-bound.
    evidence.citizenFollow=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      g.setCamera({focus:[0,0],zoom:43,pitch:.88,yaw:.7});
      document.getElementById('focus').click();
      const plan=g.getCitizenCameraPlan(),camera=g.getCamera();
      const after=JSON.stringify(g.exportSnapshot());
      return {camera,plan,authorityUnchanged:before===after};
    });
    if(!evidence.citizenFollow.authorityUnchanged||!evidence.citizenFollow.camera.follow||
       evidence.citizenFollow.camera.zoom>14||!evidence.citizenFollow.plan||
       evidence.citizenFollow.plan.blockers>evidence.citizenFollow.plan.originalBlockers||
       evidence.citizenFollow.plan.blockers!==0)
       throw Error('G053 real focus camera is obscured or mutates authority: '+JSON.stringify(evidence.citizenFollow));
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(out,'citizen-follow-clear.png'),fullPage:true,timeout:90000});
    await page.evaluate(()=>document.getElementById('focus').click());
    await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
    const replay=await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.reset();
      for(let i=0;i<10*24*30;i++)g.step(1/30);
      return {metrics:g.metrics(),snapshot:JSON.stringify(g.exportSnapshot())};
    });
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'day11-close.png'),fullPage:true,timeout:90000});
    const second=await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.reset();
      for(let i=0;i<10*24*30;i++)g.step(1/30);
      return JSON.stringify(g.exportSnapshot());
    });
    // Render the post-replay study at noon rather than low-contrast dawn.
    // Both ten-day snapshots were already captured above before advancing,
    // so screenshot lighting cannot alter the reproducibility comparison.
    evidence.referenceDaylight=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      for(let i=0;i<5*30;i++)g.step(1/30);
      const hour=g.getState().state.t%24,sky=g.skyConditions(g.getState().state.t);
      return {hour,daylight:sky.daylight};
    });
    if(evidence.referenceDaylight.daylight<.70)
      throw Error('Daylight visual comparison camera unexpectedly dark: '+JSON.stringify(evidence.referenceDaylight));
    await page.waitForTimeout(400);
    // G090: two real-browser views of an actual completed autonomous job.
    // This is a player-facing workday camera, NOT a scripted or fake worker.
    evidence.g090Workday=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      const before=JSON.stringify(g.exportSnapshot());
      const realEvents=g.getWorkdayEvents();
      const selected=g.watchLatestWork();
      const view=g.getWorkdayView();
      return {eventCount:realEvents.length,selected,view,
        sceneStats:g.getWorkdayRenderStats(),
        status:document.getElementById('workday-activity').textContent,
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot()),
        glError:document.querySelector('#world').getContext('webgl')?.getError()||0};
    });
    if(!evidence.g090Workday.selected||
       !evidence.g090Workday.authorityUnchanged||
       !evidence.g090Workday.view.following||
       evidence.g090Workday.selected.citizen!==evidence.g090Workday.view.citizen||
       evidence.g090Workday.glError!==0)
      throw Error('G090 actual-work follow camera failed: '+JSON.stringify(evidence.g090Workday));
    await page.waitForTimeout(500);
    await page.screenshot({path:path.join(out,'g090-workday-follow-UI.png'),fullPage:true,timeout:90000});
    await page.evaluate(()=>{
      window.__tinyKingdom.setHudMode('cinema');
      window.__tinyKingdom.setReferenceCapture(true);
    });
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(out,'g090-workday-follow-world.png'),fullPage:true,timeout:90000});
    await page.evaluate(()=>{
      window.__tinyKingdom.setHudMode('full');
      document.getElementById('focus').click();
    });
    // These are real browser captures, not authored screenshot mockups.
    evidence.forest=await page.evaluate(()=>window.__tinyKingdom.getForestVisualStats());
    if(evidence.forest.broadleafLobes<evidence.forest.deciduous*4||
       evidence.forest.individualLeaves<evidence.forest.deciduous*15||
       evidence.forest.broadleafSpecies.filter(n=>n>0).length!==3||
       evidence.geometry.totalTriangles>=160000)
      throw Error('Gauntlet 047 authored broadleaf forest or GPU budget gate failed: '+JSON.stringify(evidence.forest));
    evidence.farmstead=await page.evaluate(()=>window.__tinyKingdom.getFarmsteadStats());
    if(evidence.farmstead.stalks!==668||evidence.farmstead.rows!==22||
       evidence.farmstead.granaries!==1||evidence.farmstead.bundles!==4)
      throw Error('Gauntlet 044 real 3D farmstead contract failed: '+JSON.stringify(evidence.farmstead));
    evidence.craftDistrict=await page.evaluate(()=>window.__tinyKingdom.getCraftDistrictStats());
    if(evidence.craftDistrict.cartWheels!==4||evidence.craftDistrict.smokePuffs!==3||
       evidence.craftDistrict.pieces<75)throw Error('Craft district scene contract failed: '+JSON.stringify(evidence.craftDistrict));
    evidence.landmarks=await page.evaluate(()=>window.__tinyKingdom.getScenicSites());
    evidence.cinematicScreenshotsUnobstructed=await page.evaluate(()=>{
      window.__tinyKingdom.setHudMode('cinema');
      window.__tinyKingdom.setReferenceCapture(true);
      return getComputedStyle(document.querySelector('.sidebar')).display==='none' &&
        getComputedStyle(document.querySelector('.atlas')).display==='none' &&
        getComputedStyle(document.querySelector('#cinema-exit')).display==='none' &&
        window.__tinyKingdom.getHudMode()==='cinema';
    });
    if(!evidence.cinematicScreenshotsUnobstructed)throw Error('Cinematic screenshot still obscured by HUD');
    for(const shot of [
      {name:'sanctuary-landmark.png',camera:{focus:[29,10],yaw:.75,pitch:.48,zoom:27}},
      {name:'stone-bridge.png',camera:{focus:[-6,18.1],yaw:.84,pitch:.64,zoom:26}},
      {name:'riverbank-close.png',camera:{focus:[-12,19],yaw:.66,pitch:.48,zoom:17}},
      {name:'river-surface-g063.png',camera:{focus:[-12,19],yaw:.66,pitch:.37,zoom:12}},
      {name:'upland-ecoregions.png',camera:{focus:[33,29],yaw:.91,pitch:.52,zoom:24}},
      {name:'ridge-outcrops.png',camera:{focus:[-34,24],yaw:.78,pitch:.50,zoom:22}},
      {name:'river-source-g062.png',camera:{focus:[-44,23],yaw:.78,pitch:.50,zoom:22}},
      {name:'river-outlet-g062.png',camera:{focus:[44,17],yaw:.91,pitch:.52,zoom:22}},
      {name:'guild-forge.png',camera:{focus:[19,-15],yaw:.78,pitch:.57,zoom:23}},
      {name:'cottage-facades.png',camera:{focus:[10,-5],yaw:1.50,pitch:.40,zoom:14}},
      {name:'forest-boughs.png',camera:{focus:[-32,-9],yaw:.65,pitch:.50,zoom:15}},
      {name:'broadleaf-crown.png',camera:{focus:[-29,4],yaw:.95,pitch:.49,zoom:19}},
      {name:'broadleaf-detail.png',camera:{focus:[-29,4],yaw:.95,pitch:.49,zoom:12}},
      {name:'orchard-branch-anatomy.png',camera:{focus:[-27,10],yaw:1.08,pitch:.44,zoom:11}},
      {name:'farmstead-wide.png',camera:{focus:[23,1],yaw:3.86,pitch:.56,zoom:25}},
      {name:'granary-close.png',camera:{focus:[29,-5],yaw:3.05,pitch:.50,zoom:18}},
    ]){
      await page.evaluate(camera=>window.__tinyKingdom.setCamera(camera),shot.camera);
      await page.waitForTimeout(400);
      await page.screenshot({path:path.join(out,shot.name),fullPage:true,timeout:90000});
    }
    evidence.riverGlError=await page.evaluate(()=>document.getElementById('world').getContext('webgl').getError());
    if(evidence.riverGlError!==0)throw Error('WebGL error after river scene capture: '+evidence.riverGlError);
    await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
    if(await page.evaluate(()=>window.__tinyKingdom.getHudMode()!=='full'))
      throw Error('Failed to restore command HUD after cinematic screenshot');
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(300);
    evidence.mobileViewport=await page.evaluate(()=>({
      clientWidth:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      tourWidth:document.querySelector('.world-tour').getBoundingClientRect().width,
    }));
    await page.screenshot({path:path.join(out,'mobile-sanctuary.png'),fullPage:true,timeout:90000});
    evidence.mobileWorldFirst=await page.evaluate(()=>{
      const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
      g.setCommandView('world');
      const rect=document.querySelector('#world-ribbon').getBoundingClientRect();
      return {width:rect.width,inViewport:rect.left>=0&&rect.right<=innerWidth,
        noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
        authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
    });
    if(!evidence.mobileWorldFirst.inViewport||!evidence.mobileWorldFirst.noOverflow||
       !evidence.mobileWorldFirst.authorityUnchanged)
      throw Error('G042 mobile world-first UI regression: '+JSON.stringify(evidence.mobileWorldFirst));
    await page.screenshot({path:path.join(out,'world-first-mobile.png'),fullPage:true,timeout:90000});
    await page.evaluate(()=>window.__tinyKingdom.setCommandView('command'));

    if(evidence.mobileViewport.scrollWidth>evidence.mobileViewport.clientWidth+1)
      throw Error('Mobile visual regression: horizontal page overflow');
    if(evidence.mobileViewport.tourWidth<100)
      throw Error('Mobile visual regression: camera ribbon hidden after cinematic restore');
    evidence.day11=replay.metrics;
    evidence.tenDayReplayIdentical=(replay.snapshot===second);
    if(!evidence.tenDayReplayIdentical)throw Error('10-day replay mismatch');
    if(!evidence.webglVerified)throw Error('No existing game canvas provides WebGL; evidence is not a WebGL capture');
    if(errors.length)throw Error('Uncaught page errors: '+errors.join('; '));
  } catch (error) {
    evidence.failure=String(error.stack||error);
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
