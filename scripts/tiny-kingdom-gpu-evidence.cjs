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

    evidence.materials=await page.evaluate(()=>window.__tinyKingdom.getMaterialSystem());
    evidence.materialVertexAttribute=await page.evaluate(()=>{
      const gl=document.getElementById('world').getContext('webgl');
      if(!gl)return -1;
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      return program?gl.getAttribLocation(program,'materialId'):-1;
    });
    if(evidence.webglVerified&&evidence.materialVertexAttribute<0)throw Error('GPU material attribute was optimized away or omitted');
    if(evidence.materials.vertexStride!==10||evidence.materials.materials.length!==8)
      throw Error('GPU material layout mismatch');
    // GPU static vertex upload invariant: camera motion must never re-upload
    // dense terrain and village meshes; only moving agents update per frame.
    evidence.staticGPU=await page.evaluate(()=>window.__tinyKingdom.renderStats());
    await page.evaluate(()=>window.__tinyKingdom.setCamera({zoom:24,pitch:.51,yaw:.82,focus:[0,0]}));
    await page.waitForTimeout(450);
    evidence.staticGPUAfterCamera=await page.evaluate(()=>window.__tinyKingdom.renderStats());
    if(evidence.webglVerified){
      if(!evidence.staticGPU.dualBufferGPU||evidence.staticGPU.staticGpuUploads<1)
        throw Error('Static GPU vertex buffer was not uploaded');
      if(evidence.staticGPUAfterCamera.staticGpuUploads!==evidence.staticGPU.staticGpuUploads)
        throw Error('Moving camera re-uploaded static world');
    }
    evidence.renderBudget=softwareRendererRenderBudget;
    evidence.geometry=await page.evaluate(()=>window.__tinyKingdom.getGeometryAudit());
    for(const mesh of [evidence.geometry.static,evidence.geometry.dynamic]){
      if(!mesh.aligned||mesh.invalidComponents||mesh.invalidNormals||mesh.invalidColors||mesh.outOfBounds)throw Error('Malformed 3D geometry: '+JSON.stringify(mesh));
    }
    evidence.water=await page.evaluate(()=>window.__tinyKingdom.waterStats());
    if(evidence.water.model!=='fresnel-ripple-shorefoam-v1'||evidence.water.waterTriangles!==1260||evidence.water.bankTriangles!==840)
      throw Error('River material or shoreline geometry gate failed');
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
    evidence.meadow=await page.evaluate(()=>window.__tinyKingdom.getMeadowStats());
    evidence.visualHud=await page.evaluate(()=>({
      worldFilter:getComputedStyle(document.querySelector('#world')).filter,
      headingPx:parseFloat(getComputedStyle(document.querySelector('.name')).fontSize),
      panelGradient:getComputedStyle(document.querySelector('.sidebar .panel')).backgroundImage.includes('gradient'),
      navigationChoices:document.querySelectorAll('.tour-btn').length
    }));
    if(evidence.meadow.clusters<240||evidence.meadow.triangles!==evidence.meadow.clusters*8||!evidence.meadow.cached)
      throw Error('Gauntlet 034 meadow budget or static-cache contract failed');
    if(evidence.visualHud.worldFilter!=='none'||evidence.visualHud.headingPx<25||
       !evidence.visualHud.panelGradient||evidence.visualHud.navigationChoices!==6)
      throw Error('Gauntlet 033 visual HUD contract failed');
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
    // Inspect both original high-detail civic landmarks at fixed, repeatable cameras.
    // These are real browser captures, not authored screenshot mockups.
    evidence.landmarks=await page.evaluate(()=>window.__tinyKingdom.getScenicSites());
    evidence.cinematicScreenshotsUnobstructed=await page.evaluate(()=>{
      window.__tinyKingdom.setHudMode('cinema');
      return getComputedStyle(document.querySelector('.sidebar')).display==='none' &&
        getComputedStyle(document.querySelector('.atlas')).display==='none' &&
        window.__tinyKingdom.getHudMode()==='cinema';
    });
    if(!evidence.cinematicScreenshotsUnobstructed)throw Error('Cinematic screenshot still obscured by HUD');
    for(const shot of [
      {name:'sanctuary-landmark.png',camera:{focus:[29,10],yaw:.75,pitch:.48,zoom:27}},
      {name:'stone-bridge.png',camera:{focus:[-6,18.1],yaw:.84,pitch:.64,zoom:26}},
      {name:'riverbank-close.png',camera:{focus:[-12,19],yaw:.66,pitch:.48,zoom:17}},
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
