'use strict';
(() => {
  const WORLD_LAYERS = Object.freeze({ atmosphere: 0, surface: 1, topsoil: 2, subsoil: 3, deep: 4, tunnels: 5, foreground: 6 });
  const MAX_EXCAVATION_TRANSITIONS = 96;
  const MAX_WORLD_DECOR = 180;
  const excavationTransitions = new Map();
  let previousTiles = null;
  let previousRun = '';
  let lastSnapshotRevision = -1;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function hash(value) { let x = (Number(value) || 0) | 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; }
  const hash01 = value => (hash(value) % 10000) / 10000;

  function ensureMetrics() {
    return window.__ANT_RENDER_METRICS__ ||= { frameSamples: [], lod: { near: 0, mid: 0, far: 0 }, activeParticles: 0, excavationTransitions: 0, drawCalls: 0, webgl: false, dpr: 1, worldCells: 0, lastShot: 'overview' };
  }
  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ensureMetrics().dpr = dpr;
    return { rect, dpr };
  }
  function seasonPalette(snapshot) {
    const palettes = {
      spring: { sky: '#88a388', horizon: '#758b66', grass: '#526d3e', topsoil: '#65472e', loam: '#4b3222', clay: '#382319', deep: '#20130f' },
      summer: { sky: '#96aa78', horizon: '#7c8954', grass: '#65703b', topsoil: '#6b4728', loam: '#50321f', clay: '#3b2417', deep: '#22130c' },
      autumn: { sky: '#9b8765', horizon: '#776948', grass: '#695b34', topsoil: '#68442c', loam: '#50301e', clay: '#3a2217', deep: '#21130d' },
      winter: { sky: '#81918f', horizon: '#687875', grass: '#58645b', topsoil: '#5a4d40', loam: '#45382f', clay: '#352922', deep: '#211a17' }
    };
    return palettes[snapshot.environment.season] || palettes.spring;
  }
  function dayPhase(snapshot) {
    const p = clamp(Number(snapshot.environment.dayProgress ?? ((snapshot.tick % 2400) / 2400)), 0, .999999);
    if (p < .16) return 'night'; if (p < .28) return 'dawn'; if (p < .72) return 'day'; if (p < .84) return 'dusk'; return 'night';
  }
  function weatherMaterial(snapshot) {
    const weather = snapshot.environment.weather;
    return { wet: weather === 'rain' || weather === 'storm', dry: weather === 'heat' || weather === 'drought', storm: weather === 'storm', cold: snapshot.environment.season === 'winter' };
  }
  function cameraTransform(snapshot, width, height, view) {
    const zoom = clamp(Number(view?.zoom || 1), 1, 2.5), sx = width / snapshot.world.width * zoom, sy = height / snapshot.world.height * zoom, cx = Number(view?.x ?? snapshot.world.width / 2), cy = Number(view?.y ?? snapshot.world.height / 2);
    return { zoom, sx, sy, tx: width / 2 - cx * sx, ty: height / 2 - cy * sy, worldToScreen(x, y) { return { x: x * sx + this.tx, y: y * sy + this.ty }; } };
  }
  function setWorldTransform(ctx, transform, dpr) { ctx.setTransform(dpr * transform.sx, 0, 0, dpr * transform.sy, dpr * transform.tx, dpr * transform.ty); }

  function drawAtmosphere(ctx, snapshot, width, height, surfaceRow, transform) {
    const phase = dayPhase(snapshot), palette = seasonPalette(snapshot), topLeft = transform.worldToScreen(0, 0), bottom = transform.worldToScreen(0, surfaceRow), y0 = Math.max(-height, topLeft.y), y1 = Math.min(height * 2, bottom.y), dpr = Math.min(2, window.devicePixelRatio || 1), gradient = ctx.createLinearGradient(0, y0 * dpr, 0, y1 * dpr);
    if (phase === 'night') { gradient.addColorStop(0, '#071018'); gradient.addColorStop(1, '#182322'); }
    else if (phase === 'dawn') { gradient.addColorStop(0, '#483f49'); gradient.addColorStop(.55, '#9a6d55'); gradient.addColorStop(1, palette.horizon); }
    else if (phase === 'dusk') { gradient.addColorStop(0, '#40394a'); gradient.addColorStop(.55, '#855751'); gradient.addColorStop(1, '#4d5345'); }
    else { gradient.addColorStop(0, palette.sky); gradient.addColorStop(1, palette.horizon); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = gradient; ctx.fillRect(0, y0 * dpr, width * dpr, Math.max(1, (y1 - y0) * dpr));
    if (phase === 'night') {
      ctx.save(); ctx.globalAlpha = .72; ctx.fillStyle = '#e8ebd7'; ctx.beginPath(); ctx.arc(width * dpr * .82, Math.max(22, y1 * .25) * dpr, 18 * dpr, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 24; i++) { const x = hash01(i * 571 + snapshot.environment.day) * width * dpr, y = hash01(i * 883 + 41) * Math.max(1, y1) * dpr, r = (.6 + hash01(i * 113) * 1.3) * dpr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
  function drawSoilStrata(ctx, snapshot) {
    const palette = seasonPalette(snapshot), { surfaceRow, height, width } = snapshot.world, gradient = ctx.createLinearGradient(0, surfaceRow, 0, height);
    gradient.addColorStop(0, palette.topsoil); gradient.addColorStop(.17, palette.topsoil); gradient.addColorStop(.44, palette.loam); gradient.addColorStop(.72, palette.clay); gradient.addColorStop(1, palette.deep); ctx.fillStyle = gradient; ctx.fillRect(-1, surfaceRow, width + 2, height - surfaceRow + 2);
    ctx.lineWidth = .055; for (let layer = 0; layer < 6; layer++) { const base = surfaceRow + (height - surfaceRow) * (.12 + layer * .155); ctx.strokeStyle = `rgba(236,205,154,${Math.max(.018, .06 - layer * .007)})`; ctx.beginPath(); ctx.moveTo(-1, base); for (let x = 0; x <= width + 1; x += 1.7) ctx.lineTo(x, base + Math.sin(x * .65 + layer * 1.3) * .12); ctx.stroke(); }
    const material = weatherMaterial(snapshot); if (material.wet) { ctx.fillStyle = 'rgba(58,91,90,.11)'; ctx.fillRect(0, surfaceRow, width, Math.max(1, (height - surfaceRow) * .23)); }
    if (material.dry) { ctx.strokeStyle = 'rgba(217,177,116,.14)'; ctx.lineWidth = .045; for (let i = 0; i < 20; i++) { const x = hash01(i * 331 + snapshot.environment.day) * width; ctx.beginPath(); ctx.moveTo(x, surfaceRow); ctx.lineTo(x + (hash01(i * 773) - .5) * .8, surfaceRow + .8 + hash01(i * 997)); ctx.stroke(); } }
  }
  function drawRoots(ctx, snapshot) {
    const { width, height, surfaceRow } = snapshot.world; ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) { const seed = hash(i * 991 + width * 31 + snapshot.environment.season.length * 17), x = hash01(seed) * width, len = 1.5 + hash01(seed + 3) * Math.min(10, (height - surfaceRow) * .45), bend = (hash01(seed + 7) - .5) * 2.8; ctx.strokeStyle = `rgba(64,39,22,${.48 + hash01(seed + 11) * .3})`; ctx.lineWidth = .08 + hash01(seed + 19) * .18; ctx.beginPath(); ctx.moveTo(x, surfaceRow - .1); ctx.bezierCurveTo(x + bend * .15, surfaceRow + len * .25, x - bend, surfaceRow + len * .64, x + bend * .32, surfaceRow + len); ctx.stroke(); if (i % 3 === 0) { ctx.lineWidth *= .55; ctx.beginPath(); ctx.moveTo(x - bend * .18, surfaceRow + len * .48); ctx.lineTo(x - bend * .9, surfaceRow + len * .7); ctx.stroke(); } }
    ctx.restore();
  }
  function drawSurfaceForeground(ctx, snapshot) {
    const palette = seasonPalette(snapshot), { width, surfaceRow } = snapshot.world, seasonProgress = clamp(Number(snapshot.environment.seasonProgress ?? 0), 0, .999999), winterScale = snapshot.environment.season === 'winter' ? .48 : 1, density = Math.min(MAX_WORLD_DECOR, Math.round(76 + seasonProgress * 34));
    ctx.fillStyle = palette.grass; ctx.fillRect(-1, surfaceRow - .16, width + 2, .35); ctx.lineCap = 'round';
    for (let i = 0; i < density; i++) { const seed = hash(i * 733 + width * 19), x = hash01(seed) * width, blade = (.22 + hash01(seed + 2) * .62) * winterScale, lean = (hash01(seed + 3) - .5) * .34; ctx.strokeStyle = snapshot.environment.season === 'autumn' ? 'rgba(155,116,64,.82)' : `rgba(108,146,78,${.62 + hash01(seed + 9) * .25})`; ctx.lineWidth = .035 + hash01(seed + 5) * .055; ctx.beginPath(); ctx.moveTo(x, surfaceRow); ctx.quadraticCurveTo(x + lean * .4, surfaceRow - blade * .55, x + lean, surfaceRow - blade); ctx.stroke(); }
    for (let i = 0; i < 34; i++) { const seed = hash(i * 1171 + snapshot.environment.day * 13), x = hash01(seed) * width, y = surfaceRow + hash01(seed + 1) * .42, r = .08 + hash01(seed + 2) * .18; ctx.fillStyle = i % 4 === 0 ? 'rgba(88,67,45,.92)' : 'rgba(116,90,56,.75)'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r, hash01(seed + 3) * Math.PI, 0, Math.PI * 2); ctx.fill(); }
    if (weatherMaterial(snapshot).wet) { ctx.fillStyle = 'rgba(73,118,126,.28)'; for (let i = 0; i < 7; i++) { const seed = hash(i * 1931 + snapshot.environment.day), x = hash01(seed) * width, r = .35 + hash01(seed + 2) * 1.15; ctx.beginPath(); ctx.ellipse(x, surfaceRow + .12, r, .12 + hash01(seed + 3) * .13, 0, 0, Math.PI * 2); ctx.fill(); } }
  }
  function isOpen(tile) { return tile === 1 || tile === 3; }
  function chamberKind(snapshot, cell) {
    if (cell === snapshot.world.nestCenter) return 'queen';
    const x = cell % snapshot.world.width, y = Math.floor(cell / snapshot.world.width), nx = snapshot.world.nestCenter % snapshot.world.width, ny = Math.floor(snapshot.world.nestCenter / snapshot.world.width), dx = x - nx, dy = y - ny;
    if (snapshot.colony.brood > 0 && dx < 0 && Math.abs(dx) >= Math.abs(dy)) return 'nursery'; if (snapshot.colony.foodStore > 0 && dx > 0 && Math.abs(dx) >= Math.abs(dy)) return 'storage'; if (snapshot.colony.threat > 35 && dy < 0) return 'defense'; if (snapshot.ants.some(ant => ant.task === 'dig' && Math.abs(ant.x - x) + Math.abs(ant.y - y) <= 2)) return 'expansion'; return 'general';
  }
  function drawChamber(ctx, snapshot, cell, x, y) {
    const kind = chamberKind(snapshot, cell), colors = { queen: ['#1b100b','rgba(218,171,101,.35)'], nursery: ['#21170f','rgba(231,210,164,.19)'], storage: ['#21160d','rgba(182,145,76,.2)'], defense: ['#1b1110','rgba(188,90,66,.22)'], expansion: ['#20150e','rgba(173,120,72,.2)'], general: ['#1c120d','rgba(142,99,59,.13)'] }[kind];
    ctx.fillStyle = colors[0]; ctx.strokeStyle = colors[1]; ctx.lineWidth = .07; ctx.beginPath(); ctx.ellipse(x + .5, y + .5, .76, .62, (hash(cell) % 17 - 8) * .01, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (kind === 'storage') { ctx.fillStyle = 'rgba(172,134,70,.65)'; for (let i = 0; i < Math.min(9, 2 + Math.floor(snapshot.colony.foodStore / 22)); i++) { ctx.beginPath(); ctx.ellipse(x + .2 + (i % 3) * .2, y + .38 + Math.floor(i / 3) * .13, .08, .04, .5, 0, Math.PI * 2); ctx.fill(); } }
  }
  function drawTunnelNetwork(ctx, snapshot, now) {
    const { width, height, tiles } = snapshot.world; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(18,11,8,.98)'; ctx.lineWidth = .54;
    for (let cell = 0; cell < tiles.length; cell++) { if (!isOpen(tiles[cell])) continue; const x = cell % width, y = Math.floor(cell / width), right = cell + 1, down = cell + width; if (x + 1 < width && isOpen(tiles[right])) { ctx.beginPath(); ctx.moveTo(x + .5, y + .5); ctx.lineTo(x + 1.5, y + .5); ctx.stroke(); } if (y + 1 < height && isOpen(tiles[down])) { ctx.beginPath(); ctx.moveTo(x + .5, y + .5); ctx.lineTo(x + .5, y + 1.5); ctx.stroke(); } }
    for (let cell = 0; cell < tiles.length; cell++) { const tile = tiles[cell]; if (!isOpen(tile)) continue; const x = cell % width, y = Math.floor(cell / width), transition = excavationTransitions.get(cell), progress = transition ? clamp((now - transition.startedAt) / transition.duration, 0, 1) : 1; if (tile === 3) drawChamber(ctx, snapshot, cell, x, y); else { ctx.fillStyle = 'rgba(17,10,7,.99)'; ctx.beginPath(); ctx.ellipse(x + .5, y + .5, .32 * (.4 + progress * .6), .29 * (.4 + progress * .6), 0, 0, Math.PI * 2); ctx.fill(); } if (transition && progress < 1) { ctx.strokeStyle = `rgba(202,154,96,${.36 * (1 - progress)})`; ctx.lineWidth = .08; ctx.beginPath(); ctx.arc(x + .5, y + .5, .22 + progress * .34, 0, Math.PI * 2); ctx.stroke(); } }
    ctx.restore();
  }
  function drawRocksAndMoisture(ctx, snapshot) {
    const { width, tiles, moisture } = snapshot.world;
    for (let cell = 0; cell < tiles.length; cell++) { const tile = tiles[cell], x = cell % width, y = Math.floor(cell / width); if (tile === 4) { ctx.fillStyle = `rgba(91,82,69,${.55 + hash01(cell) * .25})`; ctx.beginPath(); ctx.ellipse(x + .5, y + .53, .31 + hash01(cell + 4) * .08, .25, hash01(cell + 5) * .7, 0, Math.PI * 2); ctx.fill(); } else if (tile === 5) { ctx.fillStyle = 'rgba(55,112,123,.5)'; ctx.beginPath(); ctx.ellipse(x + .5, y + .62, .38, .2, 0, 0, Math.PI * 2); ctx.fill(); } else if (moisture[cell] > 50 && y > snapshot.world.surfaceRow) { ctx.fillStyle = `rgba(61,98,96,${Math.min(.12, moisture[cell] / 1000)})`; ctx.fillRect(x, y, 1, 1); } }
  }
  function drawFoodSource(ctx, snapshot, cell, amount) {
    const width = snapshot.world.width, x = cell % width + .5, y = Math.floor(cell / width) + .45, size = clamp(.08 + amount / 550, .09, .22), kind = hash(cell) % 3; ctx.save(); ctx.translate(x, y);
    if (kind === 0) { ctx.fillStyle = '#9b753d'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * size * .75, Math.abs(i) * size * .2, size * .55, size, .55, 0, Math.PI * 2); ctx.fill(); } }
    else if (kind === 1) { ctx.fillStyle = '#78924f'; ctx.beginPath(); ctx.ellipse(0, 0, size * 1.7, size, -.4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#50351f'; ctx.lineWidth = .045; ctx.beginPath(); ctx.moveTo(0, -size * .8); ctx.lineTo(.04, -size * 1.6); ctx.stroke(); }
    else { ctx.fillStyle = '#66513b'; ctx.beginPath(); ctx.ellipse(0, 0, size * 1.7, size * .7, .15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(32,21,13,.8)'; ctx.lineWidth = .035; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * size * .35, -size * .45); ctx.lineTo(i * size * .27, size * .45); ctx.stroke(); } }
    ctx.restore();
  }
  function drawSurfaceGameplay(ctx, snapshot) {
    const { width, surfaceRow, food } = snapshot.world; for (let cell = 0; cell < food.length; cell++) { const y = Math.floor(cell / width); if (food[cell] <= 0 || y > surfaceRow + 1) continue; drawFoodSource(ctx, snapshot, cell, food[cell]); }
    const entranceX = snapshot.world.entrance % width + .5; ctx.fillStyle = 'rgba(14,9,6,.98)'; ctx.beginPath(); ctx.ellipse(entranceX, surfaceRow + .12, .48, .2, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(194,152,96,.2)'; ctx.lineWidth = .04; ctx.stroke();
  }
  function pheromoneMode(snapshot, shot) { if (document.body.dataset.observer === 'true') return 'observer'; if (shot === 'foraging' || snapshot.colony.strategy === 'foraging') return 'food'; if (shot === 'queen-danger' || shot === 'combat' || snapshot.colony.threat > 45) return 'alarm'; if (shot === 'excavation' || snapshot.colony.strategy === 'expansion') return 'excavation'; return 'subtle'; }
  function drawPheromoneRoute(ctx, snapshot, shot) {
    const mode = pheromoneMode(snapshot, shot), fields = snapshot.world.pheromones, selected = mode === 'observer' ? [['food',fields.food,'87,178,111'],['alarm',fields.alarm,'203,94,65'],['excavation',fields.excavation,'185,139,79']] : mode === 'food' ? [['food',fields.food,'87,178,111']] : mode === 'alarm' ? [['alarm',fields.alarm,'203,94,65']] : mode === 'excavation' ? [['excavation',fields.excavation,'185,139,79']] : [];
    for (const [, field, rgb] of selected) for (let cell = 0; cell < field.length; cell += mode === 'observer' ? 1 : 2) { const value = Number(field[cell] || 0); if (value < 10) continue; const x = cell % snapshot.world.width + .5, y = Math.floor(cell / snapshot.world.width) + .5; ctx.fillStyle = `rgba(${rgb},${clamp(value / 320, .025, .16)})`; ctx.beginPath(); ctx.arc(x, y, .055 + Math.min(.12, value / 900), 0, Math.PI * 2); ctx.fill(); }
  }
  function drawWeather(ctx, snapshot, width, height, transform, now, reducedMotion, dpr) {
    if (reducedMotion) return; const weather = snapshot.environment.weather, surface = transform.worldToScreen(0, snapshot.world.surfaceRow).y;
    if (weather === 'rain' || weather === 'storm') { ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.strokeStyle = weather === 'storm' ? 'rgba(196,220,225,.42)' : 'rgba(196,220,225,.28)'; ctx.lineWidth = Math.max(1,dpr); const count = weather === 'storm' ? 110 : 72; for (let i=0;i<count;i++) { const x=(hash(i*41)%Math.max(1,Math.floor(width))+now*.12+i*13)%width, y=(hash(i*79)%Math.max(1,Math.floor(surface))+now*.24+i*5)%Math.max(1,surface); ctx.beginPath(); ctx.moveTo(x*dpr,y*dpr); ctx.lineTo((x-5)*dpr,(y+15)*dpr); ctx.stroke(); } ctx.restore(); }
    if (weather === 'heat') { ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.strokeStyle='rgba(244,196,118,.08)'; ctx.lineWidth=dpr; for(let i=0;i<8;i++){const y=surface*(.25+i*.07);ctx.beginPath();for(let x=0;x<=width;x+=15)ctx.lineTo(x*dpr,(y+Math.sin(x*.04+now*.003+i)*2.2)*dpr);ctx.stroke()}ctx.restore(); }
  }
  function updateExcavation(snapshot, now) {
    if (snapshot.runToken !== previousRun) { previousRun = snapshot.runToken; previousTiles = snapshot.world.tiles.slice(); excavationTransitions.clear(); lastSnapshotRevision = snapshot.revision; return; }
    if (snapshot.revision === lastSnapshotRevision) return;
    if (previousTiles) for (let cell = 0; cell < snapshot.world.tiles.length; cell++) if (!isOpen(previousTiles[cell]) && isOpen(snapshot.world.tiles[cell])) { excavationTransitions.set(cell,{startedAt:now,duration:1200+(hash(cell)%700)}); if (excavationTransitions.size > MAX_EXCAVATION_TRANSITIONS) excavationTransitions.delete(excavationTransitions.keys().next().value); }
    previousTiles = snapshot.world.tiles.slice(); lastSnapshotRevision = snapshot.revision;
  }
  function cleanExcavation(now) { for (const [cell, transition] of excavationTransitions) if (now - transition.startedAt > transition.duration + 300) excavationTransitions.delete(cell); ensureMetrics().excavationTransitions = excavationTransitions.size; }
  function drawDeepForeground(ctx, snapshot) { const { width, height } = snapshot.world, gradient = ctx.createLinearGradient(0,height*.62,0,height+2); gradient.addColorStop(0,'rgba(0,0,0,0)'); gradient.addColorStop(1,'rgba(4,2,2,.48)'); ctx.fillStyle=gradient; ctx.fillRect(-2,height*.62,width+4,height*.4+3); }

  function drawFrame(canvas, snapshot, now, options={}) {
    if (!canvas || !snapshot) return; updateExcavation(snapshot,now); cleanExcavation(now);
    const {rect,dpr}=resizeCanvas(canvas), width=Math.max(1,rect.width), height=Math.max(1,rect.height), ctx=canvas.getContext('2d',{alpha:false,desynchronized:true}), view=window.AntCameraDirector?.getView(snapshot,now,{reducedMotion:options.reducedMotion})||{x:snapshot.world.width/2,y:snapshot.world.height/2,zoom:1,shot:'overview'}, transform=cameraTransform(snapshot,width,height,view);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);drawAtmosphere(ctx,snapshot,width,height,snapshot.world.surfaceRow,transform);setWorldTransform(ctx,transform,dpr);drawSoilStrata(ctx,snapshot);drawRoots(ctx,snapshot);drawSurfaceForeground(ctx,snapshot);drawRocksAndMoisture(ctx,snapshot);drawTunnelNetwork(ctx,snapshot,now);drawSurfaceGameplay(ctx,snapshot);drawPheromoneRoute(ctx,snapshot,view.shot);drawDeepForeground(ctx,snapshot);drawWeather(ctx,snapshot,width,height,transform,now,options.reducedMotion,dpr);
    const m=ensureMetrics();m.worldCells=snapshot.world.tiles.length;m.lastShot=view.shot;m.drawCalls=Math.max(m.drawCalls||0,8);return{transform,view,dpr,width,height};
  }
  function start() {
    const canvas=document.getElementById('terrain-canvas');if(!canvas)return;const params=new URLSearchParams(location.search),reducedMotion=params.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches,observer=document.getElementById('observer-panel'),observerToggle=document.getElementById('toggle-observer'),initialObserver=params.get('observer')==='1';document.body.dataset.observer=String(initialObserver);if(observer)observer.setAttribute('aria-hidden',String(!initialObserver));if(observerToggle){observerToggle.setAttribute('aria-expanded',String(initialObserver));observerToggle.addEventListener('click',()=>{const next=document.body.dataset.observer!=='true';document.body.dataset.observer=String(next);observer?.setAttribute('aria-hidden',String(!next));observerToggle.setAttribute('aria-expanded',String(next))})}let stopped=false;const frame=now=>{if(stopped)return;const snapshot=window.__ANT_PUBLIC_STATE__;if(snapshot)drawFrame(canvas,snapshot,now,{reducedMotion});requestAnimationFrame(frame)};requestAnimationFrame(frame);window.addEventListener('pagehide',()=>{stopped=true;excavationTransitions.clear()},{once:true});
  }
  window.AntWorldRenderer=Object.freeze({WORLD_LAYERS,MAX_EXCAVATION_TRANSITIONS,excavationTransitions,drawSurfaceForeground,drawSoilStrata,drawRoots,drawChamber,pheromoneMode,drawPheromoneRoute,drawFrame,start});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
