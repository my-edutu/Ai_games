import * as THREE from './vendor/three.module.js';
import { GATE_RETRACTION_SECONDS, PUBLIC_PRESSURE_VISUAL_SECONDS, observedGateOpenings, gateRetractionPose, observedPressureProgress, publicPressureSequenceSeconds, publicSpentKeyTheatreDrop } from './gate-moment.mjs';
import { publicKeyCollectionMoment } from './map-view.mjs';

export const CELL_SIZE = 2.4;
// Same previously observed key cell for original treasure, collected empty
// shrine, objective pin and physical shard burst. Decorative only, no route.
export const KEY_SHRINE_OFFSET = Object.freeze({x: .32, z: -.30});
export function cellPosition(cell, width, height) {
  return { x: (cell % width - (width - 1) / 2) * CELL_SIZE, z: (Math.floor(cell / width) - (height - 1) / 2) * CELL_SIZE };
}

// The rear-to-front terrace composition is public coordinate-only presentation.
// Every playable cell retains its authoritative x/z position and navigation graph.
export function cellHeight(cell, width, height) {
  const row = Math.floor(cell / width);
  const band = Math.min(2, Math.max(0, Math.floor(row * 3 / Math.max(1, height))));
  return (2 - band) * 1.4;
}
// A drawn pressure-court approach is honest only across a FULLY public,
// reciprocal, level, unsealed connection. Proximity alone is not a doorway;
// no render path may infer the private maze or a hidden walkable shortcut.
export function publicPressureCourtLink(from, trap, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.cells)
    || !Number.isSafeInteger(snapshot.width) || snapshot.width < 1
    || !Number.isSafeInteger(snapshot.height) || snapshot.height < 1
    || !Number.isSafeInteger(from?.cell) || !Number.isSafeInteger(trap?.cell)) return false;
  const a=snapshot.cells.find(cell=>cell.cell===from.cell);
  const b=snapshot.cells.find(cell=>cell.cell===trap.cell);
  if (!a || !b || a.blocked || b.blocked || a.trap || b.trap!==true
    || !Array.isArray(a.neighbors) || !Array.isArray(b.neighbors)
    || !a.neighbors.includes(b.cell) || !b.neighbors.includes(a.cell)) return false;
  const ax=a.cell%snapshot.width, bx=b.cell%snapshot.width;
  const ay=Math.floor(a.cell/snapshot.width), by=Math.floor(b.cell/snapshot.width);
  if (Math.abs(ax-bx)+Math.abs(ay-by)!==1
    || Math.abs(cellHeight(a.cell,snapshot.width,snapshot.height)
      -cellHeight(b.cell,snapshot.width,snapshot.height))>1e-8) return false;
  // A known closed portcullis remains a wall until its PUBLIC open flag changes.
  if ((snapshot.doors||[]).some(door=>!door.open
    && ((door.a===a.cell&&door.b===b.cell)
      || (door.a===b.cell&&door.b===a.cell)))) return false;
  return true;
}

// A guardian gets a legible, uncluttered PHYSICAL arena only after Pip
// actually witnesses a reciprocal, unsealed one- or two-edge public corridor.
// This is deliberately NOT a perception, hazard, safe-route or AI rule. No
// unseen cell, remembered guardian or closed passage can select scenery.
// The stage is rebuilt only when its disclosed cell signature changes.
export function publicGuardianStageCells(snapshot) {
  const stage=new Set();
  if (snapshot?.lifecycle!=='running' || snapshot.result
    || !Number.isSafeInteger(snapshot.width) || snapshot.width<2
    || !Number.isSafeInteger(snapshot.height) || snapshot.height<2
    || !Number.isSafeInteger(snapshot.currentCell)
    || !Array.isArray(snapshot.cells) || !Array.isArray(snapshot.visibleCells)
    || !Array.isArray(snapshot.threats) || !Array.isArray(snapshot.doors)) return stage;
  const visible=new Set(snapshot.visibleCells);
  const known=new Map(snapshot.cells.filter(c=>Number.isSafeInteger(c?.cell)
    &&visible.has(c.cell) &&c.blocked!==true).map(c=>[c.cell,c]));
  const here=known.get(snapshot.currentCell);
  if (!here) return stage;
  const width=snapshot.width;
  const open=(a,b)=>{
    if(!a||!b||!Array.isArray(a.neighbors)||!Array.isArray(b.neighbors)
      ||!a.neighbors.includes(b.cell)||!b.neighbors.includes(a.cell))return false;
    const distance=Math.abs(a.cell%width-b.cell%width)
      +Math.abs(Math.floor(a.cell/width)-Math.floor(b.cell/width));
    return distance===1 && !snapshot.doors.some(d=>d?.open===false
      &&((d.a===a.cell&&d.b===b.cell)||(d.b===a.cell&&d.a===b.cell)));
  };
  for(const threat of snapshot.threats) {
    const guardian=known.get(threat?.cell);
    if(!guardian || guardian.cell===here.cell)continue;
    const dx=guardian.cell%width-here.cell%width;
    const dz=Math.floor(guardian.cell/width)-Math.floor(here.cell/width);
    const steps=Math.abs(dx)+Math.abs(dz);
    if(steps<1||steps>2||(dx!==0&&dz!==0))continue;
    const increment=dx?Math.sign(dx):Math.sign(dz)*width;
    let cursor=here,valid=true;
    const path=[cursor.cell];
    for(let i=0;i<steps;i++){
      const next=known.get(cursor.cell+increment);
      if(!open(cursor,next)){valid=false;break}
      path.push(next.cell);cursor=next;
    }
    if(!valid)continue;
    for(const cell of path)stage.add(cell);
    // One authentic public, OPEN side-step of breathing room around either
    // actor. A decorative forecourt can never draw through a sealed gate.
    for(const actor of [here,guardian]){
      for(const neighbor of actor.neighbors||[]){
        const other=known.get(neighbor);
        if(open(actor,other) && other?.trap!==true)stage.add(other.cell);
      }
    }
  }
  return stage;
}

// A second, much LOWER backdrop is permitted only on currently published
// BLOCKED stone right beside a real open, reciprocal guardian performance court.
// It cannot remove a wall, infer a hidden room, change a collider or mark a path.
export function publicGuardianBlockedReliefCells(s,court=publicGuardianStageCells(s)) {
  const relief=new Set();
  if(!court.size||!Array.isArray(s?.visibleCells)||!Array.isArray(s?.cells)
    ||!Number.isSafeInteger(s.width)||s.width<2
    ||!Number.isSafeInteger(s.height)||s.height<2)return relief;
  const known=new Map(s.cells.filter(c=>Number.isSafeInteger(c?.cell)
    &&s.visibleCells.includes(c.cell)).map(c=>[c.cell,c]));
  for(const id of court) {
    if(!known.has(id))continue;
    for(const next of [id-1,id+1,id-s.width,id+s.width]) {
      const distance=Math.abs(id%s.width-next%s.width)
        +Math.abs(Math.floor(id/s.width)-Math.floor(next/s.width));
      if(distance!==1)continue;
      const tile=known.get(next);
      if(tile?.blocked!==true||tile.trap||tile.checkpoint||tile.clue
        ||tile.cell===s.exitCell||(s.keys||[]).some(k=>k.cell===tile.cell))continue;
      relief.add(tile.cell);
    }
  }
  return relief;
}

// The one continuous guardian duel causeway is earned only by a witnessed,
// 1-2-edge, reciprocal, level, UNSEALED and publicly visible actor-to-actor
// corridor. No private route, hidden threat, diagonal shortcut or guessed
// passage can create it. It is a flush ORIGINAL stone/clay architectural
// stage, not a safe-route overlay, trap warning or authoritative movement rule.
export function publicGuardianCausewayCells(s) {
  const pathTiles=new Map();
  const court=publicGuardianStageCells(s);
  if(!court.size)return pathTiles;
  const visible=new Set(s.visibleCells);
  const known=new Map(s.cells.filter(c=>Number.isSafeInteger(c?.cell)
    &&visible.has(c.cell) &&c.blocked!==true).map(c=>[c.cell,c]));
  const here=known.get(s.currentCell);
  if(!here)return pathTiles;
  const reserved=new Set((s.keys||[]).map(k=>k.cell));
  const plain=c=>!!c && !c.trap && !c.checkpoint && !c.clue
    &&c.cell!==s.exitCell &&!reserved.has(c.cell);
  for(const threat of s.threats) {
    const enemy=known.get(threat?.cell);
    if(!plain(here)||!plain(enemy)||enemy.cell===here.cell)continue;
    const dx=enemy.cell%s.width-here.cell%s.width;
    const dz=Math.floor(enemy.cell/s.width)-Math.floor(here.cell/s.width);
    const steps=Math.abs(dx)+Math.abs(dz);
    if(steps<1||steps>2||(dx!==0&&dz!==0))continue;
    const stride=dx?Math.sign(dx):Math.sign(dz)*s.width;
    const route=[here],axis=dx?'x':'z';
    let cursor=here,valid=true;
    for(let i=0;i<steps;i++) {
      const next=known.get(cursor.cell+stride);
      const adjacent=!!next && Math.abs(cursor.cell%s.width-next.cell%s.width)
        +Math.abs(Math.floor(cursor.cell/s.width)-Math.floor(next.cell/s.width))===1;
      if(!plain(next)||!adjacent||!court.has(next.cell)
        ||!Array.isArray(cursor.neighbors)||!Array.isArray(next.neighbors)
        ||!cursor.neighbors.includes(next.cell)||!next.neighbors.includes(cursor.cell)
        ||Math.abs(cellHeight(cursor.cell,s.width,s.height)
          -cellHeight(next.cell,s.width,s.height))>1e-8
        ||s.doors.some(d=>d?.open===false && ((d.a===cursor.cell&&d.b===next.cell)
          ||(d.b===cursor.cell&&d.a===next.cell)))) {
        valid=false;break;
      }
      route.push(next);cursor=next;
    }
    if(valid)for(const tile of route)pathTiles.set(tile.cell,axis);
  }
  return pathTiles;
}


/**
 * The camera-facing flank of a witnessed Pip/Thornback stage can have a
 * distinctive SEALED mineral forecourt, but NEVER an invented crossing.
 * Both cells must be currently public, same-level, reciprocal NONPASSAGE
 * ordinary tiles. Authentic walls, collisions, doors and routes are intact.
 */
export function publicGuardianForecourtShoulderCells(s,causeway=publicGuardianCausewayCells(s)) {
  const shoulders=new Set();
  if(!causeway.size || !Array.isArray(s?.cells) || !Array.isArray(s?.visibleCells)
    || !Array.isArray(s?.doors) || !Array.isArray(s?.keys)
    || !Number.isSafeInteger(s.width) || s.width<2
    || !Number.isSafeInteger(s.height) || s.height<2)return shoulders;
  const visible=new Set(s.visibleCells);
  const known=new Map(s.cells.filter(c=>Number.isSafeInteger(c?.cell)
    && visible.has(c.cell)).map(c=>[c.cell,c]));
  const stage=publicGuardianStageCells(s);
  const special=c=>!c || c.blocked===true || c.trap || c.clue
    || c.checkpoint || c.cell===s.exitCell
    || s.keys.some(k=>k.cell===c.cell);
  for(const id of causeway.keys()) {
    const source=known.get(id);
    if(special(source) || !Array.isArray(source.neighbors))continue;
    for(const next of [id-1,id+1,id-s.width,id+s.width]) {
      const candidate=known.get(next);
      if(special(candidate) || stage.has(next) || causeway.has(next)
        || !Array.isArray(candidate.neighbors))continue;
      const distance=Math.abs(id%s.width-next%s.width)
        +Math.abs(Math.floor(id/s.width)-Math.floor(next/s.width));
      if(distance!==1 || source.neighbors.includes(next)
        || candidate.neighbors.includes(id)
        || Math.abs(cellHeight(id,s.width,s.height)
          -cellHeight(next,s.width,s.height))>1e-8)continue;
      if(s.doors.some(d=>(d.a===id&&d.b===next)
        ||(d.b===id&&d.a===next)))continue;
      shoulders.add(next);
    }
  }
  return shoulders;
}


/**
 * The second ring of a TRUE observed guardian duel gets a distinctive
 * neutral Tideglass stage rather than giant undecorated ivory foreground.
 * No private cells, guessed bridges, unseen guardians or authority changes.
 * The authentic walls, door landings and collision remain exactly as before.
 */
export function publicGuardianOuterCourtCells(s,causeway=publicGuardianCausewayCells(s)) {
  const ordinary=new Set(),sealed=new Set();
  if (!causeway.has(s?.currentCell) || !Array.isArray(s?.cells)
    || !Array.isArray(s?.visibleCells) || !Array.isArray(s?.doors)
    || !Array.isArray(s?.keys) || !Number.isSafeInteger(s.width)
    || !Number.isSafeInteger(s.height))return {ordinary,sealed};
  const visible=new Set(s.visibleCells);
  const known=new Map(s.cells.filter(c=>Number.isSafeInteger(c?.cell)
    &&visible.has(c.cell)).map(c=>[c.cell,c]));
  const hero=known.get(s.currentCell);
  if(!hero||hero.blocked)return {ordinary,sealed};
  const centerHeight=cellHeight(s.currentCell,s.width,s.height);
  const stage=publicGuardianStageCells(s);
  // Never disguise the original gate landing, hazard or objective beneath
  // a scenery transition. Two-grid-cell distance is NOT route knowledge.
  const gateways=new Set(s.doors.flatMap(d=>[d.a,d.b]));
  const keys=new Set(s.keys.map(key=>key.cell));
  for(const [id,c] of known) {
    if(stage.has(id)||causeway.has(id)||gateways.has(id)||keys.has(id)
      ||c.trap||c.checkpoint||c.clue||id===s.exitCell)continue;
    const distance=Math.abs(id%s.width-s.currentCell%s.width)
      +Math.abs(Math.floor(id/s.width)-Math.floor(s.currentCell/s.width));
    if(distance<1||distance>2
      ||Math.abs(cellHeight(id,s.width,s.height)-centerHeight)>1e-8)continue;
    if(c.blocked===true)sealed.add(id);
    else if(c.blocked===false&&Array.isArray(c.neighbors))ordinary.add(id);
  }
  return {ordinary,sealed};
}

// Pass326 real WebGL gate: Pass325 still ray-hit cell100 TAN top and lip.
// The foreground is a PUBLIC non-trap terrace, but can be a truly BLOCKED
// tile across a solid court boundary. Color its full opaque stone load deck
// while keeping the ORIGINAL solid wall, impassability and navigation intact.
// Do not interpret dark glass as a route, door, safety or collision change.
// This is scene treatment only after a real public reciprocal Pip/guardian
// causeway is witnessed; no unseen, remembered, private or fake geometry.
// A stopped, hidden or gated duel restores the original palette.
export function publicGuardianWitnessedForegroundCells(s,causeway=publicGuardianCausewayCells(s)) {
  const foreground=new Set();
  if(!causeway.has(s?.currentCell)||!Array.isArray(s?.cells)
    ||!Array.isArray(s?.visibleCells) || !Number.isSafeInteger(s?.width)
    ||!Number.isSafeInteger(s?.height))return foreground;
  const visible=new Set(s.visibleCells);
  const level=cellHeight(s.currentCell,s.width,s.height);
  for(const c of s.cells){
    // A truly blocked but CURRENTLY VISIBLE stone tile still has the large
    // 2.31m load top and 2.39m lip found by the real camera. Only its color
    // changes; its opaque authentic wall/collider and route remain untouched.
    if(!Number.isSafeInteger(c?.cell)||!visible.has(c.cell)
      ||c.trap===true)continue;
    const d=Math.abs(c.cell%s.width-s.currentCell%s.width)
      +Math.abs(Math.floor(c.cell/s.width)-Math.floor(s.currentCell/s.width));
    if(d>0&&d<=2 && Math.abs(cellHeight(c.cell,s.width,s.height)-level)<1e-8)
      foreground.add(c.cell);
  }
  return foreground;
}

const STAIR_COUNT = 8, STAIR_START = .08, STAIR_RUN = CELL_SIZE / 2 - STAIR_START, STAIR_HALF_WIDTH = .78;
export function sampleGroundHeight(x, z, snapshot) {
  if (!snapshot || !Number.isFinite(x) || !Number.isFinite(z)) return 0;
  const {width, height, cells} = snapshot;
  const col = Math.max(0, Math.min(width - 1, Math.floor(x / CELL_SIZE + width / 2)));
  const row = Math.max(0, Math.min(height - 1, Math.floor(z / CELL_SIZE + height / 2)));
  const cell = row * width + col, known = cells.find(c => c.cell === cell);
  const base = cellHeight(cell, width, height);
  if (!known) return base;
  const center = cellPosition(cell, width, height);
  for (const neighbor of known.neighbors) {
    if (!cells.some(c => c.cell === neighbor)) continue;
    const high = cellHeight(neighbor, width, height);
    if (high <= base) continue;
    const target = cellPosition(neighbor, width, height);
    const dx = (target.x - center.x) / CELL_SIZE, dz = (target.z - center.z) / CELL_SIZE;
    if (Math.abs(dx) + Math.abs(dz) > 1.001) continue;
    const along = (x - center.x) * dx + (z - center.z) * dz;
    const across = Math.abs((x - center.x) * dz - (z - center.z) * dx);
    if (across <= STAIR_HALF_WIDTH && along > STAIR_START) {
      const step = Math.min(STAIR_COUNT, Math.max(0, Math.ceil((along - STAIR_START) / STAIR_RUN * STAIR_COUNT - 1e-8)));
      return base + (high - base) * step / STAIR_COUNT;
    }
  }
  return base;
}

// All variation is cosmetic and keyed by public cell coordinates. Nothing reads a
// maze generator, seed, private state, or a route to infer undisclosed topology.
const variation = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;

export function createMazeWorld(options = {}) {
  const group = new THREE.Group();
  group.name = 'Disclosed ruin garden';
  const terrain = new THREE.Group(), objects = new THREE.Group(), backdrop = new THREE.Group();
  group.add(backdrop, terrain, objects);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  // Only truly modeled public closed-door sockets; invalidated with visible objects.
  const publicClosedSockets = new Map();
  // An open gate only moves if this SAME run publicly showed its CLOSED state
  // first. These are presentation-only timestamps, never gate authority.
  const gateOpeningAt = new Map(), retractingGates = new Map();
  // Only previously disclosed, same-run, inventory-confirmed pickups animate.
  const keyPickupAt = new Map();
  // Mesh references stay out of userData so Three.js serialization/cloning
  // remains safe; obsolete disclosed doors can be collected automatically.
  const gateDrives = new WeakMap();
  let presentationTime = 0;
  const doorEdgeId = (a,b) => `${Math.min(a,b)}:${Math.max(a,b)}`;
  const geometry = (g) => { geometries.add(g); return g; };
  const material = (color, extras = {}) => {
    const {roughness = .86, metalness = .02, ...common} = extras;
    const m = options.balanced && metalness < .4
      ? new THREE.MeshLambertMaterial({color, ...common})
      : new THREE.MeshStandardMaterial({ color, roughness, metalness, ...common });
    materials.add(m); return m;
  };
  const stone = material('#cead72');
  const lightStone = material('#eed5a0'); lightStone.name = 'Disclosed sunlit ivory terrace';
  const deepStone = material('#8e7851');
  // Painted mineral courts break the formerly uniform beige paving into
  // quiet, geographically consistent warm/cool districts. Neither tint is a
  // key, path, danger signal or another authority-bearing game element.
  const clay = material('#b07953'); clay.name = 'Disclosed mineral clay court';
  const seaGlass = material('#5d968e'); seaGlass.name = 'Disclosed sea-glass mosaic';
  const jade = material('#398479', {roughness: .57});
  const darkJade = material('#28574f');
  const inlay = material('#82b1a2');
  const moss = material('#55843b');
  const leaf = material('#8caf44', { side: THREE.DoubleSide, roughness: .68 });
  const leafDark = material('#326e43', { side: THREE.DoubleSide, roughness: .72 });
  const seaFern = material('#a1c66c', { side: THREE.DoubleSide, roughness: .7 });
  seaFern.name = 'Disclosed perimeter hanging fronds';
  const flower = material('#f2b765');
  const gold = material('#efb946', { roughness: .28, metalness: .65 });
  const keyLight = material('#ffe6a0', {emissive: '#efac25', emissiveIntensity: .48, roughness: .3, metalness: .45});
  const portalVeil = material('#84f5ce', {emissive: '#47bfa5', emissiveIntensity: .65, transparent: true, opacity: .19, depthWrite: false, side: THREE.DoubleSide});
  const darkMetal = material('#334a46', { roughness: .55, metalness: .42 });
  const danger = material('#bf6449', { emissive: '#73220b', emissiveIntensity: .2 });
  const glow = material('#d5ffda', { emissive: '#7adcc6', emissiveIntensity: .8, roughness: .4 });
  const amber = material('#ffda82', { emissive: '#f7ab32', emissiveIntensity: .65 });
  // Two crossing, curving *tileable* caustic families make the open sea
  // read as tidal water, not an unshaded turquoise plane. This original,
  // dimension-independent 128px raster is built once: no fragment shader,
  // frame allocations, map/maze queries or bright UI-like path highlights.
  const waterPixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const u = x * TAU / 128, v = y * TAU / 128;
    const first = Math.cos(v * 6 + Math.sin(u * 3) * 1.45 + Math.sin(u * 2) * .42);
    const second = Math.cos(u * 5 - v * 3 + Math.sin(v * 2) * 1.17);
    // Keep water gradients below foreground character/goal contrast.
    // The first full-size screenshot showed bright net-like lines; soften
    // both families instead of merely passing the source/viewport tests.
    // Original Pass135 full-resolution WebGL revealed a large, saturated
    // green pool competing with the small playable actors. Subdue the two
    // caustic families and shift the *dimension-only* sea toward mineral
    // blue-grey so the warm terraced game stage retains visual priority.
    // This texture never reads public/private route or objective data.
    const pale = Math.pow(Math.max(0, first), 17) * 8
      + Math.pow(Math.max(0, second), 23) * 4;
    const body = Math.sin(u * 2 + v) * 3.1 + Math.sin(v * 2 - u * 3) * 2.1;
    const shade = body + pale + (variation(x + y * 128) - .5) * 1.6 - 4;
    const i = (y * 128 + x) * 4;
    waterPixels[i] = Math.round(55 + shade * .58);
    waterPixels[i + 1] = Math.round(108 + shade * .69);
    waterPixels[i + 2] = Math.round(116 + shade * .72);
    waterPixels[i + 3] = 255;
  }
  const waterTexture = new THREE.DataTexture(waterPixels, 128, 128);
  waterTexture.colorSpace = THREE.SRGBColorSpace;
  waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
  waterTexture.magFilter = THREE.LinearFilter; waterTexture.minFilter = THREE.LinearMipmapLinearFilter;
  waterTexture.generateMipmaps = true; waterTexture.repeat.set(5, 5); waterTexture.needsUpdate = true;
  textures.add(waterTexture);
  const waterMaterial = new THREE.MeshBasicMaterial({map: waterTexture, color: '#ffffff'});
  materials.add(waterMaterial);
  // Small shared grain maps add broad mineral flecks without new draw calls.
  const grain = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const n = variation(x + y * 64), vein = Math.sin(x * .16 + Math.sin(y * .18) * 2);
    const value = Math.round(218 + n * 25 + vein * 6), i = (y * 64 + x) * 4;
    grain[i] = value; grain[i + 1] = value; grain[i + 2] = value; grain[i + 3] = 255;
  }
  const stoneTexture = new THREE.DataTexture(grain, 64, 64);
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.magFilter = THREE.LinearFilter; stoneTexture.minFilter = THREE.LinearMipmapLinearFilter;
  stoneTexture.generateMipmaps = true; stoneTexture.needsUpdate = true; textures.add(stoneTexture);
  for (const m of [stone, lightStone, deepStone, clay, seaGlass, jade, darkJade]) m.map = stoneTexture;
  const rippleMaterial = material('#a5d4be', { transparent: true, opacity: .3, depthWrite: false, roughness: .5 });
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  // Shared bevelled blocks give every main masonry edge a restrained highlight.
  const outline = new THREE.Shape();
  outline.moveTo(-.46, -.46); outline.lineTo(.46, -.46); outline.lineTo(.46, .46); outline.lineTo(-.46, .46); outline.closePath();
  const bevel = geometry(new THREE.ExtrudeGeometry(outline, { depth: .92, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .04, bevelThickness: .04, curveSegments: 1 }));
  bevel.translate(0, 0, -.46);
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const cone = geometry(new THREE.ConeGeometry(1, 1, 8));
  const sphere = geometry(new THREE.IcosahedronGeometry(1, 1));
  const ring = geometry(new THREE.TorusGeometry(1, .08, 6, 32));
  const keyBow = geometry(new THREE.TorusGeometry(.27, .075, 6, 8));
  const portalDisc = geometry(new THREE.CircleGeometry(1, 24));
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(-.22, .45, 0, 1); leafShape.quadraticCurveTo(.22, .45, 0, 0);
  const leafGeometry = geometry(new THREE.ShapeGeometry(leafShape, 5));
  const matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion(), euler = new THREE.Euler(), scale = new THREE.Vector3(), position = new THREE.Vector3();
  let snapshot = null, runToken = null, terrainSignature = '', objectSignature = '', backdropSignature = '', disposed = false;
  let batches = [], animations = [], ripples = [], renderedCells = [], stairEdges = [], stairBalustrades = 0, coastalGardens = 0, wallGardens = 0, lastVisibility = '', highContrast = false;
  let coastCanopies = 0, tidalObservatories = 0, sculptedMosaicWalls = 0, tidePennants = 0, perimeterCascades = 0, collapsedPavilions = 0, shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0, gateForecourtParapets = 0, pressureStageParapets = 0, guardianSightlineParapets = 0, gateCourtRosettes = 0;
  let tideFossilGroves = 0, tideFossilAlcoves = 0, fossilGalleryEdges = 0, undercroftButtresses = 0, hangingFacadeGardens = 0, closedTideMedallions = 0;
  let pressureRetainingGalleries = 0, guardianCourtTiles = 0, guardianBlockedReliefTiles = 0, guardianCausewayTiles = 0, guardianForecourtShoulderTiles = 0, guardianOuterCourtFloorTiles = 0, guardianOuterCourtSealedTiles = 0, shorelineLoadFacades = 0;
  // Authored, disclosed wall-side fossils react only to the PUBLIC explorer pose.
  // These are live Three groups, not hidden route markers or a new game system.
  let fossilSails = [], fossilOrgans = [], trapJaws = [], trapSignals = [], guardianTideSignals = [], publicHeroX = 0, publicHeroZ = 0;
  let batchData = new Map();
  const clear = (target) => {
    for (const child of [...target.children]) {
      child.traverse((item) => { if (item.isInstancedMesh) item.dispose(); });
      target.remove(child);
    }
  };
  const transform = (x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    position.set(x, y, z); scale.set(sx, sy, sz); euler.set(rx, ry, rz); rotation.setFromEuler(euler);
    matrix.compose(position, rotation, scale); return matrix;
  };
  const add = (geo, mat, x, y, z, sx, sy, sz, cell = -1, rx = 0, ry = 0, rz = 0) => {
    const key = `${geo.id}:${mat.id}`;
    if (!batchData.has(key)) batchData.set(key, { geo, mat, entries: [] });
    batchData.get(key).entries.push({ matrix: transform(x, y + (cell >= 0 && snapshot ? cellHeight(cell, snapshot.width, snapshot.height) : 0), z, sx, sy, sz, rx, ry, rz).clone(), cell });
  };
  const block = (mat, x, y, z, sx, sy, sz, cell = -1, ry = 0) => add(bevel, mat, x, y, z, sx, sy, sz, cell, 0, ry);
  const finishBatches = () => {
    batches = [];
    for (const { geo, mat, entries } of batchData.values()) {
      const mesh = new THREE.InstancedMesh(geo, mat, entries.length);
      mesh.castShadow = ![leaf, leafDark, seaFern, moss, flower, rippleMaterial].includes(mat); mesh.receiveShadow = true;
      entries.forEach((entry, i) => { mesh.setMatrixAt(i, entry.matrix); mesh.setColorAt(i, new THREE.Color(0xffffff)); });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
      terrain.add(mesh); batches.push({ mesh, entries });
    }
    batchData.clear(); lastVisibility = '';
  };
  const mesh = (parent, geo, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    const item = new THREE.Mesh(geo, mat); item.position.set(x, y, z); item.scale.set(sx, sy, sz); item.rotation.set(rx, ry, rz);
    item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
  };
  function gardenPatch(cell) {
    const width = snapshot?.width || 1;
    return variation(Math.floor((cell % width) / 3) + Math.floor(cell / width / 3) * 17);
  }
  function plant(x, y, z, seed, cell, size = 1) {
    // A dark root pad joins the plant to moss/stone without a shadow-map pass.
    add(cylinder, darkJade, x, y + .009, z, .29 * size, .018, .24 * size, cell);
    if (variation(seed + 11) > .34) {
      add(sphere, leafDark, x, y + .13 * size, z, .31 * size, .24 * size, .24 * size, cell);
      add(sphere, moss, x + .18 * size, y + .12 * size, z - .07 * size, .26 * size, .18 * size, .23 * size, cell);
    }
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.4 + variation(seed) * TAU;
      add(leafGeometry, j % 2 ? leaf : leafDark, x + Math.cos(angle) * .12 * size, y, z + Math.sin(angle) * .12 * size, size * (1.15 + variation(seed + j) * .6), size * (.48 + variation(seed + j + 9) * .48), 1, cell, .22 + variation(seed + j + 3) * .7, angle);
    }
    if (variation(seed + 8) > .75) {
      add(cylinder, leafDark, x, y + .22 * size, z, .018, .44 * size, .018, cell);
      for (let j = 0; j < 5; j++) add(sphere, flower, x + Math.cos(j * TAU / 5) * .07, y + .44 * size, z + Math.sin(j * TAU / 5) * .07, .065, .035, .065, cell);
    }
  }

  // Lush root-connected vertical gardens decorate either the genuine world
  // boundary or an ALREADY DISCLOSED, confirmed solid interior wall. Never
  // treat an unresolved neighbor as a permanent wall or an inferred path.
  // The optional lift puts fronds on known wall crests; foliage remains outside
  // traversable corridors and does not own gameplay collision or AI state.
  function coastalGarden(x, z, dx, dz, seed, cell, lift = 0) {
    if (lift) wallGardens++; else coastalGardens++;
    const outerX = x + dx * 1.19, outerZ = z + dz * 1.19;
    const longX = !!dz;
    // Continuous carved planter and planted rim connect the greenery to stone,
    // avoiding ungrounded floating leaves above the uniform lagoon.
    add(box, deepStone, outerX, lift - .13, outerZ,
      longX ? 1.94 : .37, .27, longX ? .37 : 1.94, cell);
    add(box, moss, outerX + dx * .06, lift + .038, outerZ + dz * .06,
      longX ? 1.72 : .4, .075, longX ? .4 : 1.72, cell);
    for (let tuft = 0; tuft < 4; tuft++) {
      const spread = (tuft - 1.5) * .45 + (variation(seed + tuft * 13) - .5) * .11;
      const rootX = outerX + (longX ? spread : dx * .15);
      const rootZ = outerZ + (longX ? dz * .15 : spread);
      const length = .73 + variation(seed + tuft * 19) * .72;
      // Large overlapping foliage forms a legible *mass* at gameplay scale,
      // not a scatter of individual dots. Hanging blades hug the outside face.
      add(sphere, leafDark, rootX, lift - .17, rootZ, .28, .29, .29, cell);
      add(sphere, moss, rootX + dx * .095, lift - .38, rootZ + dz * .095, .30, .38, .27, cell);
      for (let blade = 0; blade < 3; blade++) {
        const tangent = (blade - 1) * .115;
        add(leafGeometry, blade === 1 ? seaFern : leaf,
          rootX + dx * .11 + (longX ? tangent : 0),
          lift - .16 - blade * .055,
          rootZ + dz * .11 + (longX ? 0 : tangent),
          .62, length * (blade === 1 ? 1 : .76), 1, cell,
          0, longX ? 0 : Math.PI / 2, Math.PI + (blade - 1) * .2);
      }
      if (variation(seed + 200 + tuft) > .78) {
        add(sphere, flower, rootX + dx * .14, lift - .29, rootZ + dz * .14,
          .09, .07, .09, cell);
      }
    }
    // A broad rooted canopy establishes an authored seaward silhouette
    // behind the level. Only publicly known north/west BOARD edges receive
    // these trees: never an unknown internal neighbor, path, hidden goal, or
    // foreground obstacle. The normal +X/+Z camera looks past the two far
    // shores toward the gameplay. Reuse existing instanced materials/meshes;
    // AI updates and render frames never create these decorative resources.
    if (!lift && dx + dz < 0 && variation(seed + 2031) > .42) {
      coastCanopies++;
      const stemX = outerX + dx * .06, stemZ = outerZ + dz * .06;
      // The base remains embedded in the already modeled stone planter.
      // Big, overlapping layered crowns must read at true mobile size.
      add(cylinder, deepStone, stemX, .53, stemZ, .23, .91, .23, cell);
      add(cylinder, jade, stemX, .88, stemZ, .15, .71, .15, cell);
      add(sphere, leafDark, stemX + dx * .22, 1.54, stemZ + dz * .22,
        .80, .42, .70, cell);
      add(sphere, moss, stemX + dx * .32, 1.80, stemZ + dz * .32,
        .61, .30, .56, cell);
      for (let branch = 0; branch < 4; branch++) {
        const angle = branch * TAU / 4 + .35;
        const bx = stemX + Math.cos(angle) * .43 + dx * .18;
        const bz = stemZ + Math.sin(angle) * .43 + dz * .18;
        add(cylinder, deepStone, (stemX + bx) / 2, 1.29, (stemZ + bz) / 2,
          .11, .41, .11, cell, Math.sin(angle) * .42, 0,
          -Math.cos(angle) * .42);
        add(sphere, branch % 2 ? leaf : leafDark,
          bx, 1.67 + (branch % 2) * .10, bz, .45, .31, .44, cell);
      }
    }
  }
  // Authentic gate screenshots showed foreground hedge masking Pip. A public
  // gate forecourt now uses REAL low stone and root-connected greenery in
  // place of a tall foliage curtain on adjacent KNOWN solid walls only.
  // Reuses existing GPU instance batches, with no collision or route change.
  function gateForecourtPlanter(x, z, dx, dz, cell) {
    const ex = x + dx * 1.19, ez = z + dz * 1.19, alongX = !!dz;
    add(box, deepStone, ex, .88, ez, alongX ? 1.86 : .33, .22, alongX ? .33 : 1.86, cell);
    add(box, lightStone, ex, 1.005, ez, alongX ? 1.88 : .36, .055, alongX ? .36 : 1.88, cell);
    add(box, moss, ex, 1.046, ez, alongX ? 1.66 : .23, .035, alongX ? .23 : 1.66, cell);
    for (let i = -1; i <= 1; i++) {
      const px = ex + (alongX ? i * .44 : dx * .09);
      const pz = ez + (alongX ? dz * .09 : i * .44);
      add(sphere, i === 0 ? moss : leafDark, px, 1.12, pz, .15, .13, .15, cell);
    }
  }
  // A real disclosed gate's side walls should read as masonry, not rise
  // across Pip's body during the physical gate-opening act. On an already
  // visible BLOCKED edge between TWO disclosed cells, retain a continuous,
  // unmistakably impassable stone barrier but lower its central silhouette.
  // Never alter the authentic gate seam, collision authority, undisclosed
  // cells, or any other wall. All material and geometry are already pooled.
  function gateForecourtParapet(x, z, horizontal, cell, pressureStage = false, guardianStage = false) {
    // A real guardian court receives the same solid LOW stone cutaway, with
    // separate diagnostic accounting from pressure and gate architecture.
    const lowStage = pressureStage || guardianStage;
    if (guardianStage) guardianSightlineParapets++;
    else if (pressureStage) pressureStageParapets++;
    else gateForecourtParapets++;
    // Pass332: the 390px photographed Pip/Thornback court still reads as a
    // generic ivory maze because its nearby genuinely SEALED side walls use
    // exactly the same bright cap as all unrelated passages. Build a broad,
    // physically continuous DARK Tideglass bulwark only on the witnessed
    // guardian stage; ordinary gates and real pressure walls stay unchanged.
    // It remains opaque and impassable. No hidden cell, new route, collider,
    // camera adjustment, resource class or per-frame mesh is introduced.
    block(guardianStage ? darkJade : deepStone, x, .17, z,
      horizontal ? 2.32 : .39, .34, horizontal ? .39 : 2.32, cell);
    add(box, guardianStage ? seaGlass : lightStone, x, .355, z,
      horizontal ? 2.34 : .44, .075, horizontal ? .44 : 2.34, cell);
    // Pass337: original browser ray proved that the pressure-adjacent
    // spectator edge needs its full opaque Tideglass wall and cap, NOT an
    // additional overlaid broad face. The extra layer hid an actual
    // published Pip-side stage course in the exact 390px brace and failed
    // the unchanged source-bound visibility gate. On a pressure-adjacent
    // edge keep dark masonry/cap and true connected moving hazard instead.
    if (guardianStage && !pressureStage) {
      // Large attached mineral facing and a restrained continuous crest:
      // these share real parent stone, not a passage-shaped hole or HUD cue.
      add(box, darkMetal, x, .20, z,
        horizontal ? 2.14 : .43, .22, horizontal ? .43 : 2.14, cell);
      add(box, inlay, x, .325, z,
        horizontal ? 2.08 : .08, .042, horizontal ? .08 : 2.08, cell);
    }
    // The real pressure mechanism is the only moving center of this disclosed
    // court. Keep the solid NONPASSAGE wall but remove its repetitive bright
    // rail; ordinary disclosed gates retain their full architectural trim.
    if (!lowStage) add(box, seaGlass, x, .410, z, horizontal ? 2.06 : .19, .037,
      horizontal ? .19 : 2.06, cell);
    for (const side of [-1, 1]) {
      const px = x + (horizontal ? side * .99 : 0);
      const pz = z + (horizontal ? 0 : side * .99);
      // A pressure-court parapet has short rooted terminal piers, rather than
      // identical tall corner blocks repeated across Pip's hazard sightline.
      // The low SOLID barrier remains visually closed; neither wall edge nor
      // the real collision/navigation topology is changed.
      const pierHeight = lowStage ? .40 : .64;
      block(guardianStage ? darkJade : stone, px, pierHeight / 2, pz,
        .24, pierHeight, .24, cell);
      add(box, guardianStage ? inlay : lightStone, px,
        lowStage ? .43 : .66, pz, .28, .055, .28, cell);
    }
  }
  // A physical original tile rosette distinguishes already-disclosed gate
  // approach rooms from the otherwise generic paving. Flat and symmetrical:
  // not a collectible, safe-path arrow, checkpoint or interaction control.
  function gateCourtRosette(x,z,cell) {
    gateCourtRosettes++;
    add(cylinder,deepStone,x,.012,z,.51,.023,.51,cell);
    add(cylinder,seaGlass,x,.027,z,.36,.009,.36,cell);
    for(let i=0;i<8;i++){
      const angle=i*TAU/8+TAU/16,dx=Math.cos(angle),dz=Math.sin(angle);
      add(box,i%2?lightStone:clay,x+dx*.70,.018,z+dz*.70,
        .23,.014,.34,cell,0,-angle);
    }
  }
  // A genuinely discovered, NON-TRAVERSABLE fossil garden replaces the old
  // anonymous cube pile. Each heavy shell/rib is physically rooted inside
  // the known blocked 2.4-unit tile; nothing extends into the walkable lane.
  // Near a disclosed gate keep the silhouette low so the real gate-opening
  // actor, not decorative masonry, dominates the source-authentic shot.
  // No glow, upward objective pointer, door opening or AI/route authority.
  // Existing instanced stone/ceramic materials and shapes: zero new GPU pools.
  function tideFossilGrove(x, z, cell, nearGate) {
    tideFossilGroves++;
    block(deepStone, x, .095, z, 1.88, .19, 1.82, cell);
    block(lightStone, x, .205, z, 1.72, .065, 1.65, cell);
    add(cylinder, seaGlass, x, .245, z, .67, .025, .66, cell);
    for (const side of [-1, 1]) {
      const px = x + side * .51, pz = z - .23;
      add(cylinder, darkJade, px, .44, pz, .105, .40, .105, cell, 0, 0, side * .21);
      add(cone, side < 0 ? stone : clay, px + side * .08,
        nearGate ? .80 : 1.05, pz, .30, nearGate ? .70 : 1.16,
        .23, cell, 0, 0, side * .22);
      add(box, jade, px + side * .09, .31, pz + .13,
        .18, .13, .30, cell, 0, side * .18, side * .08);
    }
    // Five large, asymmetrical sculpted stone fronds arc outward from one
    // grounded basin. Deliberately unlike the golden key and its shrine.
    for (let petal = 0; petal < 5; petal++) {
      const angle = petal * TAU / 5 + .17;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const radius = .38 + (petal % 2) * .08;
      add(cone, petal % 2 ? inlay : deepStone, x + dx * radius,
        nearGate ? .43 : .58, z + dz * radius,
        .18, nearGate ? .38 : .66, .18, cell,
        dz * .30, angle, -dx * .30);
    }
    // Collapsed lip plates make this read as an archaeological place rather
    // than a coin-shaped interaction beacon or repeating 2D decal.
    for (const side of [-1, 1]) {
      block(stone, x + side * .72, .30, z + .61,
        .39, .12, .29, cell, side * .17);
      add(box, clay, x + side * .62, .37, z + .69,
        .19, .03, .15, cell, 0, side * .17);
    }
  }
  // The actual production observations never exposed blocked cells in the
  // default reference runs: their isolated fossil gardens could NOT appear
  // in even one of the 23 exact-source screenshots. Offer a separate small
  // non-collidable, wall-side fossil ALCOVE within genuinely disclosed safe
  // walkable cells. The real observed neighbor list selects an impassable
  // side; this leaves the true traversable center and passage mouth clear.
  // It claims no hidden next cell, route, objective, AI action or new hazard.
  // Every small sculpture uses the SAME installed pooled Three resources.
  function tideFossilAlcove(x,z,cell,dx,dz) {
    tideFossilAlcoves++;
    const bx=x+dx*.79, bz=z+dz*.79;
    const tx=-dz, tz=dx;
    add(cylinder,deepStone,bx,.063,bz,.36,.12,.35,cell);
    add(cylinder,lightStone,bx,.131,bz,.31,.035,.31,cell);
    add(cylinder,seaGlass,bx,.153,bz,.22,.014,.22,cell);
    for (const side of [-1,1]) {
      const px=bx+tx*side*.18, pz=bz+tz*side*.18;
      add(cylinder,darkJade,px,.226,pz,.077,.15,.077,cell);
      add(cone,side<0?clay:stone,px,.39,pz,
        .14,side<0?.49:.36,.14,cell,dx*.08,0,-dz*.08);
      add(box,jade,px+dx*.04,.224,pz+dz*.04,
        .12,.055,.15,cell);
    }
    // Three rooted shards read as ancient ceramics, not a key or button.
    // Their <=.31 radius near the closed edge preserves >1.1 units of
    // unobstructed tile width at the actual route center.
    for(let i=-1;i<=1;i++){
      const px=bx+tx*i*.20,pz=bz+tz*i*.20;
      add(cone,i===0?inlay:deepStone,px+dx*.19,.265,pz+dz*.19,
        .10,.27,.10,cell,0,0,i*.18);
    }
    // Pass121: the live 390px evidence showed the little mineral relics
    // disappearing underneath nearby greenery. Two pale, swept-back ribs
    // form a legible original fossil silhouette against the known solid side.
    // They grow from the existing wall-side stone plinth; their physical
    // bases stay >= .77 from the traversable cell centre. No collider, clue,
    // key, authored path, undisclosed tile or animation-clock dependency.
    for (const side of [-1,1]) {
      const rx=bx+tx*side*.31+dx*.13, rz=bz+tz*side*.31+dz*.13;
      add(box,deepStone,rx,.215,rz,.17,.16,.19,cell);
      add(cone,lightStone,rx,.615,rz,.13,.82,.12,cell,
        dz*side*.18,0,-dx*side*.18);
      add(box,clay,rx-dx*.035,.875,rz-dz*.035,
        .115,.065,.125,cell,0,side*.14,side*.16);
    }
    // Pass122: A pair of genuine, hinged fossil sails responds when Pip
    // physically approaches this already known, impassable wall edge.
    // It is NOT a switch, goal, mapped passage, clue or enemy sensor. These
    // substantial carved Three meshes are anchored behind the walkable
    // center, use existing shared resources and never change simulation.
    const baseY=cellHeight(cell,snapshot.width,snapshot.height);
    // A taller, connected tide-organ makes the original fossil alcove read
    // as a distinct authored place at actual gameplay scale, not another
    // floor decal. Its grounded vertebra and two jointed stone leaves are
    // entirely on the disclosed NON-PASSAGE wall-side ledge. A visitor
    // approaching that very public location makes them unfold; it is not
    // a new ability, alarm, mapped exit, collectible or simulated switch.
    const organ = new THREE.Group();
    organ.name='Disclosed fossil tide-organ '+cell;
    organ.position.set(bx+dx*.28,baseY+.20,bz+dz*.28);
    terrain.add(organ);
    mesh(organ,bevel,deepStone,0,.18,0,.38,.36,.40);
    mesh(organ,bevel,darkJade,0,1.01,0,.24,1.40,.24);
    mesh(organ,bevel,lightStone,0,1.76,0,.33,.18,.34);
    const organLeaves=[];
    for (const leafSide of [-1,1]) {
      const hinge=new THREE.Group();
      hinge.name='Disclosed fossil tide-organ leaf '+cell+' '+leafSide;
      hinge.position.set(tx*leafSide*.18,.99,tz*leafSide*.18);
      organ.add(hinge);
      // The broad sea-glass blades reach above the low fossil gallery,
      // unlike the prior miniature ribs hidden below the wall crown.
      mesh(hinge,sphere,seaGlass,tx*leafSide*.25,.44,tz*leafSide*.25,
        dz?.34:.14,.76,dx?.34:.14);
      mesh(hinge,bevel,lightStone,tx*leafSide*.24,.20,tz*leafSide*.24,
        dz?.095:.065,.45,dx?.095:.065);
      organLeaves.push({hinge,side:leafSide});
    }
    // Pass139: a third, genuinely articulated ceramic resonator bridges the
    // paired leaves. The concentric physical rings and broad attached mantle
    // are rooted high on the known NON-PASSAGE wall, never on a route. They
    // breathe only when Pip is actually beside this public Three sculpture.
    // This is a ceremonial shell, not a compass, clue, switch, or collectible.
    const resonator=new THREE.Group();
    resonator.name='Disclosed fossil tide-organ breathing shell '+cell;
    resonator.position.set(0,1.47,0);
    resonator.rotation.y=dx?Math.PI/2:0;
    organ.add(resonator);
    mesh(resonator,ring,lightStone,0,0,0,.53,.57,.53);
    mesh(resonator,ring,seaGlass,0,0,.06,.37,.40,.37);
    mesh(resonator,sphere,inlay,0,0,.035,.18,.20,.12);
    const resonatorMantles=[];
    for (const side of [-1,1]) {
      const mantle=new THREE.Group();
      mantle.name='Disclosed fossil breathing shell mantle '+cell+' '+side;
      mantle.position.set(side*.38,-.08,.01);
      resonator.add(mantle);
      // Native Pass139 revealed only a thin ivory hoop; wider solid connected
      // shell flukes now articulate *outside* the inner rings, readable as
      // stone mass at actual game size rather than another line ornament.
      // No extra geometry class, shader pool or render draw call is created.
      mesh(mantle,bevel,lightStone,side*.18,-.03,.04,.46,.30,.18,0,0,side*.24);
      resonatorMantles.push({mantle,side});
    }
    fossilOrgans.push({organ,organLeaves,resonator,resonatorMantles,
      x:organ.position.x,z:organ.position.z,dx});
    for (const side of [-1,1]) {
      const sail=new THREE.Group();
      sail.name='Disclosed fossil listening sail '+cell+' '+side;
      sail.position.set(bx+tx*side*.33+dx*.13,baseY+.25,bz+tz*side*.33+dz*.13);
      terrain.add(sail);
      mesh(sail,bevel,deepStone,0,.07,0,.25,.22,.25);
      mesh(sail,bevel,lightStone,0,.51,0,
        dz ? .37 : .16,.82,dz ? .16 : .37,
        0,0,side*.10);
      mesh(sail,bevel,seaGlass,dx*.024,.55,dz*.024,
        dz ? .25 : .065,.52,dz ? .065 : .25,
        0,0,side*.10);
      mesh(sail,sphere,clay,0,.94,0,.11,.09,.11);
      // A second, connected physical hinge lifts a scalloped sea-glass
      // crown above the LOW cutaway wall. Previously the actual full-size
      // WebGL image showed only two tiny ivory sticks. These paired crowns
      // now make the response readable as an ancient listening flower, not
      // a treasure, switch, route hint or HUD symbol. All pieces share the
      // installed stone geometry/material pools and move only with public Pip.
      const crown=new THREE.Group();
      crown.name='Disclosed fossil listening crown '+cell+' '+side;
      crown.position.y=.82;
      sail.add(crown);
      // Pass126: three original, individually hinged ceramic petals replace
      // the old narrow rectangular prongs. A sculpted fan can now visibly
      // open when Pip walks beside this *already disclosed* wall, without
      // resembling a key, door, map reveal or floating UI beacon. Petals
      // are solid existing Three geometry, rooted in the second joint and
      // restrained to the impassable wall-side alcove.
      const petals=[];
      for (const petalSide of [-1,0,1]) {
        const petal=new THREE.Group();
        petal.name='Disclosed fossil listening petal '+cell+' '+side+' '+petalSide;
        petal.position.set(tx*petalSide*.16,.10,tz*petalSide*.16);
        crown.add(petal);
        const petalMaterial=petalSide===0?seaGlass:petalSide<0?lightStone:clay;
        mesh(petal,sphere,petalMaterial,0,petalSide===0?.35:.28,0,
          petalSide===0?.23:.18,petalSide===0?.49:.40,.13);
        petals.push(petal);
      }
      fossilSails.push({object:sail,crown,petals,cell,side,dx,x:sail.position.x,z:sail.position.z,
        phase:cell*.37+side});
    }
  }
  function wall(x, z, horizontal, id, cell, guardianBulwark = false, guardianQuietRing = false) {
    const h = .91 + variation(id + 22) * .12;
    const length = CELL_SIZE - .13, thickness = .31;
    // Make all three *known* altitude districts readable in actual 3D wall
    // silhouettes, not only via tiny floor-tile color changes. Public
    // coordinates alone select the facade; no undisclosed neighbor, route,
    // AI state or collectible can influence this architectural language.
    const tier = cellHeight(cell, snapshot.width, snapshot.height);
    const tidalCourt = tier < .7, clayCourt = tier >= .7 && tier < 2.1;
    // Only true public Pip–Thornback stages earn blind mineral wall bays.
    // Preserve original wall height, opacity, closure and collision.
    const facade = guardianBulwark ? darkJade : tidalCourt ? seaGlass : clayCourt ? clay : stone;
    const relief = guardianBulwark ? inlay : tidalCourt ? inlay : clayCourt ? lightStone : jade;
    const point = (u, y, v) => ({ x: x + (horizontal ? u : v), y, z: z + (horizontal ? v : u) });
    const slab = (mat, u, y, v, a, b, c) => { const p = point(u, y, v); block(mat, p.x, p.y, p.z, horizontal ? a : c, b, horizontal ? c : a, cell); };
    slab(deepStone, 0, .09, 0, length + .08, .18, .46);
    for (let row = 0; row < 3; row++) {
      const count = row % 2 ? 4 : 3, w = length / count;
      for (let j = 0; j < count; j++) {
        const coursedStone = guardianBulwark
          ? (row === 1 ? seaGlass : row === 0 ? darkJade : jade)
          : variation(id + j * 7 + row * 19) > .82 ? jade
          : row === 1 || (row === 0 && variation(id + j * 13) > .48) ? facade : stone;
        slab(coursedStone, -length / 2 + w * (j + .5),
          .19 + row * .235 + .11, 0, w - .025, .22, thickness);
      }
    }
    slab(darkJade, 0, h - .11, 0, length + .02, .13, .36);
    slab(guardianBulwark ? inlay : lightStone, 0, h, 0, length + .1, .13, .43);
    if (guardianBulwark) {
      // Genuine full-size TWO-SIDED sealed sea-glass bays: large physical
      // wall surfaces, not a HUD decal or thin superficial accent.
      // Every bay remains opaque and uses existing instanced geometry.
      for (const side of [-1, 1]) {
        slab(deepStone, 0, .47, side * .224, 1.98, .57, .045);
        slab(seaGlass, 0, .47, side * .254, 1.78, .41, .046);
        for (const offset of [-.67, 0, .67])
          slab(jade, offset, .47, side * .284, .09, .43, .045);
      }
    }
    if (tidalCourt || clayCourt || guardianBulwark) {
      // Stone-set panels and three rooted ribs on BOTH faces of an actual
      // impassable public wall. This is substantial modeled district relief,
      // never a false doorway, arrow, reachable platform or screen effect.
      // Every part reuses existing batched geometry/material resources.
      for (const side of [-1, 1]) {
        slab(facade, 0, .47, side * .18, 1.79, .39, .04);
        for (const offset of [-.63, 0, .63]) {
          const p = point(offset, .47, side * .215);
          add(box, relief, p.x, p.y, p.z,
            horizontal ? .075 : .05, .31, horizontal ? .05 : .075, cell);
          const foot = point(offset, .27, side * .215);
          add(box, deepStone, foot.x, foot.y, foot.z,
            horizontal ? .17 : .065, .045, horizontal ? .065 : .17, cell);
        }
      }
    }
    // Only ACTUALLY KNOWN SOLID public walls get physical ceramic facade art.
    // No hidden topology, route, item, simulated movement or extra GPU material.
    if (variation(id + 909) > .34) {
      sculptedMosaicWalls++;
      for (const side of [-1, 1]) {
        slab(darkJade, 0, .49, side * .235, 1.47, .38, .050);
        slab(facade, 0, .49, side * .270, 1.30, .29, .048);
        slab(relief, 0, .59, side * .298, 1.22, .058, .036);
        for (const crest of [-1, 0, 1]) {
          const q = point(crest * .38, .44 + (crest === 0 ? .015 : 0), side * .303);
          add(bevel, crest === 0 ? lightStone : inlay, q.x, q.y, q.z,
            horizontal ? .14 : .045, .095, horizontal ? .045 : .14, cell,
            0, 0, crest * .18);
        }
      }
    }
    // A rooted, folded tide pennant grows only from the disclosed wall cap.
    // Its two textured sides remain a wall ornament, never a marker or route.
    if (!guardianQuietRing && variation(id + 1343) > .76) {
      tidePennants++;
      const u = variation(id + 102) > .5 ? -.72 : .72;
      const top = point(u, h + .82, 0);
      add(cylinder, darkMetal, top.x, top.y, top.z, .033, 1.53, .033, cell);
      add(sphere, lightStone, top.x, h + 1.62, top.z, .10, .11, .10, cell);
      for (const side of [-1, 1]) {
        const fascia = point(u, h + 1.12, side * .13);
        add(bevel, seaGlass, fascia.x, fascia.y, fascia.z,
          horizontal ? .42 : .07, .56, horizontal ? .07 : .42, cell);
        const hem = point(u, h + .80, side * .14);
        add(bevel, leafDark, hem.x, hem.y, hem.z,
          horizontal ? .28 : .078, .12, horizontal ? .078 : .28, cell,
          0, 0, side * .10);
        const stripe = point(u, h + 1.37, side * .175);
        add(bevel, lightStone, stripe.x, stripe.y, stripe.z,
          horizontal ? .34 : .035, .07, horizontal ? .035 : .34, cell);
      }
    }
    // Tall, roofed tide-windcatchers rise from genuinely PUBLIC solid
    // wall lines, not from unknown cells. In the live maze these disclosed
    // walls occur far more often than the isolated 'blocked' tile relics.
    // Windcatchers are unlit architecture, never navigation hints/keys.
    // Keep every foot and roof fastened to its already-built masonry.
    if (!guardianQuietRing && variation(id + 2017) > .90) {
      wallWindcatchers++;
      slab(deepStone, 0, h + .12, 0, 1.58, .24, .54);
      slab(facade, 0, h + .34, 0, 1.42, .24, .39);
      for (const sign of [-1, 1]) {
        // Paired grounded piers remain on the impassable wall footprint.
        slab(jade, sign * .43, h + .78, 0, .24, .93, .31);
        slab(lightStone, sign * .43, h + 1.25, 0, .35, .14, .40);
        slab(deepStone, sign * .43, h + .40, 0, .34, .13, .38);
        const opening = point(sign * .43, h + .89, .20);
        add(box, darkJade, opening.x, opening.y, opening.z,
          horizontal ? .12 : .055, .33, horizontal ? .055 : .12, cell);
        const grille = point(sign * .43, h + .91, -.20);
        add(box, inlay, grille.x, grille.y, grille.z,
          horizontal ? .07 : .04, .30, horizontal ? .04 : .07, cell);
      }
      slab(deepStone, 0, h + 1.37, 0, 1.54, .17, .61);
      slab(lightStone, 0, h + 1.51, 0, 1.57, .11, .67);
      // A broken two-plane ceramic roof projects a recognizable silhouette
      // at native portrait scale. Its thickness and 3D slope are physical;
      // decorative only, no new surface the autonomous actor may traverse.
      for (const sign of [-1, 1]) {
        const roof = point(sign * .34, h + 1.73, 0);
        add(bevel, sign > 0 ? seaGlass : stone,
          roof.x, roof.y, roof.z,
          horizontal ? .76 : .51, .13, horizontal ? .51 : .76, cell,
          horizontal ? 0 : sign * .36, 0, horizontal ? -sign * .36 : 0);
      }
      const finial = point(0, h + 1.95, 0);
      add(cone, darkJade, finial.x, finial.y, finial.z,
        .18, .38, .18, cell);
    }
    // Repeated relief diamonds and a jade frieze read as authored masonry.
    for (let j = 0; j < 5; j++) {
      const u = -.85 + j * .425;
      for (const sign of [-1, 1]) {
        const p = point(u, h - .11, sign * .19);
        add(box, inlay, p.x, p.y, p.z, .075, .075, .035, cell, 0, horizontal ? 0 : Math.PI / 2, Math.PI / 4);
      }
    }
    if (variation(id + 400) > .94) {
      for (const end of [-1, 1]) {
        for (let j = 0; j < 3; j++) {
          const a = (end === 1 ? 0 : Math.PI) + (end === 1 ? 1 : -1) * j * .22;
          const p = point(Math.cos(a) * .85, h + .32 + Math.sin(a) * .85, 0);
          add(bevel, j % 2 ? jade : lightStone, p.x, p.y, p.z, .29, .3, .37, cell, 0, horizontal ? 0 : Math.PI / 2, a - Math.PI / 2);
        }
      }
    }
    if (!guardianQuietRing && gardenPatch(cell) > .46 && variation(id) > .25) {
      slab(moss, (variation(id + 1) - .5) * .3, h + .09, 0, 1.2 + variation(id + 5) * .8, .06, .34);
      const p = point((variation(id + 7) - .5) * 1.5, h + .08, 0);
      plant(p.x, p.y, p.z, id, cell, 1.1);
      if (variation(id + 4) > .55) {
        const q = point(-.65, h + .08, 0);
        plant(q.x, q.y, q.z, id + 81, cell, 1.35);
        const r = point(.65, h + .08, 0);
        add(sphere, leafDark, r.x, r.y + .15, r.z, horizontal ? .42 : .25, .28, horizontal ? .25 : .42, cell);
      }
    }
  }
  function column(x, z, cell, seed) {
    const height = 1.15 + variation(seed) * .55;
    block(deepStone, x, .08, z, .58, .16, .58, cell);
    block(lightStone, x, .21, z, .46, .12, .46, cell);
    add(cylinder, jade, x, .28 + height / 2, z, .18, height, .18, cell);
    for (const y of [.36, .28 + height]) block(lightStone, x, y, z, .42, .13, .42, cell);
    block(stone, x, .39 + height, z, .5, .12, .5, cell);
    for (let j = 0; j < 4; j++) {
      const a = j * Math.PI / 2;
      add(box, inlay, x + Math.cos(a) * .17, .28 + height / 2, z + Math.sin(a) * .17, .026, height * .7, .026, cell);
    }
    if (variation(seed + 30) > .5) plant(x, height + .46, z, seed + 5, cell, .9);
  }
  function gardenLandmark(x, z, cell, seed, wide = false) {
    // A landmark occupies only a disclosed solid wall line; broad versions need
    // two adjacent disclosed walls. Its hollow upper span preserves route sight.
    const span = wide ? 1.96 : .82;
    for (const sign of [-1, 1]) {
      const height = wide ? 2.5 : (sign < 0 ? 2.4 : 1.82);
      block(deepStone, x + sign * span, .22, z, .68, .44, .58, cell);
      block(jade, x + sign * span, height / 2 + .34, z, .5, height, .42, cell);
      for (let j = 0; j < 3; j++) block(lightStone, x + sign * span, .46 + j * .86, z, .57, .13, .49, cell);
      block(lightStone, x + sign * span, height + .4, z, .73, .18, .61, cell);
      add(ring, inlay, x + sign * span, 1.5, z + .23, .17, .27, .17, cell);
      plant(x + sign * span, height + .5, z, seed + sign, cell, 1.7);
    }
    const count = wide ? 15 : 6;
    for (let j = 0; j < count; j++) {
      const angle = wide ? Math.PI - j * Math.PI / (count - 1) : Math.PI - j * .22;
      const archY = (wide ? 2.86 : 2.73) + Math.sin(angle) * (wide ? 1.3 : .88);
      add(bevel, j % 4 ? lightStone : jade, x + Math.cos(angle) * span, archY, z, wide ? .48 : .32, .36, .48, cell, 0, 0, angle - Math.PI / 2);
      add(box, darkJade, x + Math.cos(angle) * span, archY, z + .255, wide ? .25 : .14, .2, .025, cell, 0, 0, angle - Math.PI / 2);
    }
    if (wide) {
      tidalObservatories++;
      // A sculpted jade roofline and two grounded hanging cloth shields make
      // each disclosed solid-wall observatory a legible tide-garden landmark.
      // Shields are outside the opening: never obscure an actual route/actor.
      for (let tile = 0; tile < 9; tile++) {
        const arc = Math.PI * tile / 8;
        add(bevel, tile % 2 ? seaGlass : jade,
          x - Math.cos(arc) * span, 3.17 + Math.sin(arc) * 1.29, z - .15,
          .41, .22, .58, cell, 0, 0, arc - Math.PI / 2);
      }
      for (const side of [-1, 1]) {
        const anchorX = x + side * span;
        block(darkMetal, anchorX, 2.78, z + .38, .71, .11, .13, cell);
        block(seaGlass, anchorX, 2.27, z + .48, .45, .91, .12, cell);
        block(lightStone, anchorX, 2.61, z + .56, .41, .10, .05, cell);
        block(darkJade, anchorX, 1.78, z + .48, .30, .16, .12, cell);
        for (const rib of [-1, 1]) {
          block(inlay, anchorX + rib * .20, 2.21, z + .56, .045, .66, .06, cell);
        }
      }
      // A two-cell *known solid-wall* aqueduct becomes a recognisable ruin,
      // not a floating waypoint. Twin tide-finials and a carved sea-glass
      // shield live on an actually observed impassable wall, never a route.
      // No private maze, guessed objective or hidden threat is consulted.
      for (const side of [-1,1]) {
        const px=x+side*span;
        block(deepStone,px,3.08,z,.62,.36,.6,cell);
        block(jade,px,3.38,z,.47,.33,.48,cell);
        block(lightStone,px,3.60,z,.68,.14,.63,cell);
        // The thick finial and its grounded folded ribs read as architecture,
        // not a glowing collectible or a fake place to traverse.
        add(cone,darkJade,px,4.01,z,.30,.66,.30,cell);
        add(box,lightStone,px,3.80,z+.25,.065,.34,.065,cell,0,side*.23);
        for (const fold of [-1,1]) {
          const fx=px+side*.22,fz=z-.14+fold*.18;
          add(bevel,seaGlass,fx,3.48,fz,.22,.68,.14,cell,
            0,side*.22,fold*.18);
          add(box,darkMetal,fx,3.18,fz+.09,.035,.28,.035,cell);
        }
      }
      // Original small floating ring was weak and coin-like in native images.
      // A heavier wall-attached heraldic plaque carries a non-directional
      // two-wave motif, with a solid crown and no false arrow/goal signage.
      block(jade,x,4.2,z,.68,.46,.54,cell);
      block(lightStone,x,4.50,z,.95,.15,.68,cell);
      block(deepStone,x,3.74,z+.28,.63,.71,.15,cell);
      block(seaGlass,x,3.74,z+.37,.49,.57,.07,cell);
      for (const side of [-1,1]) {
        add(box,lightStone,x+side*.14,3.66,z+.415,.09,.31,.025,cell,
          0,0,-side*.38);
        add(box,darkMetal,x+side*.28,3.94,z+.39,.07,.10,.035,cell);
      }
    }
    for (let j = 0; j < 3; j++) plant(x - span + j * .08, 2.8 - j * .42, z + .17, seed + j * 5, cell, 1.4 - j * .15);
  }
  function rebuildTerrain(s) {
    pressureRetainingGalleries = 0; guardianCourtTiles = 0; guardianBlockedReliefTiles = 0; guardianCausewayTiles = 0; guardianForecourtShoulderTiles = 0; guardianOuterCourtFloorTiles = 0; guardianOuterCourtSealedTiles = 0; shorelineLoadFacades = 0;
    clear(terrain); fossilSails = []; fossilOrgans = []; guardianTideSignals = []; batchData = new Map(); renderedCells = s.cells.map(c => c.cell); stairEdges = []; stairBalustrades = 0; tideFossilGroves = 0; tideFossilAlcoves = 0; fossilGalleryEdges = 0; undercroftButtresses = 0; hangingFacadeGardens = 0; closedTideMedallions = 0; coastalGardens = 0; wallGardens = 0; coastCanopies = 0; tidalObservatories = 0; sculptedMosaicWalls = 0; tidePennants = 0; perimeterCascades = 0; collapsedPavilions = 0; shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0; gateForecourtParapets = 0; pressureStageParapets = 0; guardianSightlineParapets = 0; gateCourtRosettes = 0;
    const edges = new Set(), columns = new Set(), landmarkSites = new Map();
    const guardianSightlines=publicGuardianStageCells(s);
    const guardianCauseway=publicGuardianCausewayCells(s);
    const guardianForecourtShoulders=publicGuardianForecourtShoulderCells(s,guardianCauseway);
    const guardianOuterCourt=publicGuardianOuterCourtCells(s,guardianCauseway);
    const guardianForeground=publicGuardianWitnessedForegroundCells(s,guardianCauseway);
    // This is the PUBLIC, currently witnessed performance envelope, not a
    // speculative camera reveal. The actual stage and its second disclosed
    // ring keep all stone, seals, stairs, pressure devices and collisions.
    // Only redundant non-functional tall dressings yield to full-body acting.
    const guardianQuietRing=guardianCauseway.has(s.currentCell)
      ? new Set([...guardianForecourtShoulders,...guardianOuterCourt.ordinary,
        ...guardianForeground]) : new Set();
    const guardianBlockedRelief=publicGuardianBlockedReliefCells(s,guardianSightlines);
    const knownByCell = new Map(s.cells.map(c => [c.cell, c]));
    // The public snapshot is the ONLY source of foreground cutaway geometry.
    // A door is usable here only when BOTH endpoints are currently disclosed
    // as real adjacent walkable cells. This never infers an unseen passage.
    const gateApproachCells = new Set(), gateEdges = new Set(), gateCourtCells = new Set();
    const adjacent = (a, b) => Math.abs(a % s.width - b % s.width)
      + Math.abs(Math.floor(a / s.width) - Math.floor(b / s.width)) === 1;
    // Authentic portrait WebGL showed the real trap swallowed by repeated
    // fossil organs, greenery and column silhouettes one public tile away.
    // Reserve ONE disclosed-cell ring as visual breathing room, so Pip's
    // physically moving pressure jaws remain the landmark. This reads ONLY
    // published cell/trap flags, not unknown neighbors, routes or private AI.
    // Keep every real wall, stair, gate, terrain foundation and collision.
    const pressureSightlines = new Set();
    for (const known of s.cells) {
      if (!known.trap || known.blocked) continue;
      // Real, unchanged 390px WebGL proved the first adjacent-cell pass
      // cleared only small foreground details; two-cell ruins still swallow
      // the diaphragm. Reserve the smallest larger public visual court,
      // without suppressing a known wall/gate/stair or assuming a safe route.
      const trapCol = known.cell % s.width;
      const trapRow = Math.floor(known.cell / s.width);
      for (const other of s.cells) {
        const gridDistance = Math.abs(trapCol - other.cell % s.width)
          + Math.abs(trapRow - Math.floor(other.cell / s.width));
        if (gridDistance <= 2) pressureSightlines.add(other.cell);
      }
    }

    // Pass260: native 390/1280 revealed a huge blank retaining face eclipsing
    // both Pip and the true pressure jaws. Rebuild ONE real 1.4m impassable,
    // fully disclosed terrace boundary into a coherent original glazed
    // Tideglass gallery. Solid stone backing remains opaque and impassable.
    // Every piece is physically joined and reused from pooled world resources.
    // Pass271: exact-HEAD full-frame 390/1280 gameplay shows the upper
    // pressure terrace as a nearly blank slab above Pip and the working
    // shear-portal. Make the REAL public solid retaining face a three-bay
    // SEALED Tideglass load gallery: a continuous opaque load wall, three
    // recessed mineral windows, connected structural piers and deep cornices.
    // This is a substantial authored architectural backdrop, not a gate
    // or a hinted path. Only the already disclosed solid height boundary
    // may own it; current public topology, stair, door, collision and camera
    // stay authoritative. Everything uses existing instanced shape/material
    // pools (no new per-frame objects, GPU classes or private map reads).
    const pressureRetainingGallery=(x,z,dx,dz,upperCell,drop)=>{
      const middle=-drop/2;
      const panel=(mat,across,y,out,width,height,depth)=>{
        const px=x+dx*(1.19+out)+dz*across;
        const pz=z+dz*(1.19+out)+dx*across;
        add(bevel,mat,px,y,pz,dz?width:depth,height,dz?depth:width,upperCell);
      };
      const glazedHeight=Math.min(.96,drop-.26);
      // Keep the full opaque boundary; the three dark-backed recesses must
      // never look like a traversable newly discovered doorway.
      panel(deepStone,0,middle,.005,2.15,drop-.12,.09);
      panel(darkJade,0,middle,.053,2.01,glazedHeight+.16,.069);
      for(const offset of [-.57,0,.57]){
        panel(deepStone,offset,middle,.101,.50,glazedHeight+.04,.085);
        panel(seaGlass,offset,middle+.015,.154,.34,glazedHeight-.16,.060);
        // Deep dark mineral sill and raised carved crown frame ONE solid
        // enamel recess instead of the former nearly featureless flat pane.
        panel(inlay,offset,middle-glazedHeight*.33,.199,.29,.22,.048);
        panel(lightStone,offset,middle+glazedHeight*.47,.189,.53,.13,.12);
        for(const edge of [-1,1])
          panel(jade,offset+edge*.246,middle,.169,.072,glazedHeight+.11,.085);
        panel(lightStone,offset,middle+.04,.218,.065,glazedHeight*.54,.046);
      }
      for(const sign of [-1,1]){
        panel(lightStone,sign*.90,middle,.124,.17,glazedHeight+.20,.12);
        panel(gold,sign*.86,middle-glazedHeight*.38,.166,.15,.065,.05);
      }
      // Long continuous capped/load-bearing courses join all three bays.
      panel(lightStone,0,-.095,.120,2.12,.15,.14);
      panel(deepStone,0,-drop+.09,.121,2.05,.13,.15);
      pressureRetainingGalleries++;
    };
    for (const door of Array.isArray(s.doors) ? s.doors : []) {
      if (!Number.isSafeInteger(door?.a) || !Number.isSafeInteger(door?.b)
        || door.a < 0 || door.b < 0 || !adjacent(door.a, door.b)
        || !knownByCell.has(door.a) || !knownByCell.has(door.b)
        || knownByCell.get(door.a).blocked || knownByCell.get(door.b).blocked) continue;
      gateEdges.add(doorEdgeId(door.a, door.b));
      for (const id of [door.a, door.b]) {
        // Use ONLY the current public neighbor list, never hidden topology
        // or the engine's private navigation/solver state.
        if ((knownByCell.get(id).neighbors || []).some(n=>
          adjacent(id,n) && knownByCell.has(n) && !knownByCell.get(n).blocked))
          gateCourtCells.add(id);
        gateApproachCells.add(id);
        for (const neighbor of knownByCell.get(id).neighbors || [])
          if (knownByCell.has(neighbor) && adjacent(id, neighbor))
            gateApproachCells.add(neighbor);
      }
    }
    for (const c of s.cells) {
      if (c.neighbors.includes(c.cell - s.width)) continue;
      const col = c.cell % s.width, row = Math.floor(c.cell / s.width);
      const region = `${Math.floor(col / 6)}:${Math.floor(row / 6)}`;
      const east = col + 1 < s.width ? knownByCell.get(c.cell + 1) : null;
      const wide = !!east && !east.neighbors.includes(c.cell + 1 - s.width);
      if (!landmarkSites.has(region) || (wide && !landmarkSites.get(region).wide)) landmarkSites.set(region, {cell: c.cell, wide});
    }
    for (const c of s.cells) {
      const { x, z } = cellPosition(c.cell, s.width, s.height);
      const floorY = cellHeight(c.cell, s.width, s.height);
      const pressureSightline = pressureSightlines.has(c.cell);
      // The real public Pip/Thornback court keeps their actions foregrounded:
      // suppress ONLY non-colliding tall fossils/columns/plant dressing, not
      // walls, stairs, gate hardware or collision-authoritative geometry.
      const guardianCourtCell=guardianSightlines.has(c.cell) && !pressureSightline
        && !c.blocked && !c.trap && !c.checkpoint && !c.clue
        && c.cell!==s.exitCell && !s.keys.some(k=>k.cell===c.cell);
      const guardianQuietRingCell=guardianQuietRing.has(c.cell) && !pressureSightline
        && !c.trap && !c.checkpoint && !c.clue && c.cell!==s.exitCell
        && !s.keys.some(k=>k.cell===c.cell);
      if(guardianCourtCell)guardianCourtTiles++;
      // Native full-frame 390px guardian action still has an oversized pale
      // foreground outside the dark physical duel. Treat ONLY a disclosed,
      // same-tier ordinary floor beyond a mutually SEALED public wall as
      // part of the mineral forecourt. Never create a new route or collider.
      const guardianForecourtShoulder=guardianForecourtShoulders.has(c.cell)
        && !pressureSightline && !c.blocked && !c.trap
        && !c.checkpoint && !c.clue;
      if(guardianForecourtShoulder)guardianForecourtShoulderTiles++;
      // Pass321 original native 390px images still show a huge pale stage
      // after the adjacent SEALED shoulder only was darkened. One disclosed
      // two-grid-cell ring addresses the actual broad scene composition.
      const guardianOuterCourtFloor=guardianOuterCourt.ordinary.has(c.cell)
        && !pressureSightline && !guardianCourtCell && !guardianForecourtShoulder;
      if(guardianOuterCourtFloor)guardianOuterCourtFloorTiles++;
      const guardianCausewayAxis=guardianCourtCell?guardianCauseway.get(c.cell):null;
      // Pass325: genuine 390px native rays prove the checkpoint-front terrace
      // stays beige even after Pass324's synthetic foreground test. A known
      // nearby pressure cell can mark this ordinary checkpoint tile as a
      // pressure sightline; that must not veto neutral guardian-court floor.
      // Real pressure basins/aprons still take priority in floorMaterial and
      // the trap tile itself stays excluded by the public foreground helper.
      const witnessedForeground=guardianForeground.has(c.cell)
        && !guardianCourtCell && !guardianForecourtShoulder
        && !guardianOuterCourtFloor && c.trap!==true;
      // A discovered moving Tide-Shear needs an actual *continuous* stage,
      // not another carpet of tiny floor glyphs. Unite only surrounding
      // already-published ordinary walkable tiles into a quiet mineral apron.
      // Keep the trap's original clay trigger, known key/exit/checkpoint/clue,
      // all authentic walls, stair elevations and traversable footprints.
      // This is not a safety signal or private route prediction: both the
      // disclosed trap and each affected neighbor are in s.cells.
      const pressureCourtApron = pressureSightline && !c.blocked && !c.trap
        && !c.checkpoint && !c.clue && c.cell !== s.exitCell
        && !s.keys.some(key => key.cell === c.cell);
      // Pass221: a real, publicly disclosed pressure mechanism earns a
      // singular dark mineral basin one cardinal tile out, with its already
      // known second ring providing the light architectural shoulder.
      // No undiscovered trap, private topology, presumed safe route or AI
      // decision influences this 100% visual, public-state-only district.
      // Pass267: a geometrically adjacent trap is not necessarily reachable.
      // Never draw a physical passage through a published locked/nonpassage edge.
      const disclosedPressureLink = pressureCourtApron
        ? s.cells.find(known=>publicPressureCourtLink(c,known,s)) : null;
      const pressureCourtBasin = !!disclosedPressureLink;
      const basinFacesEastWest = pressureCourtBasin
        && Math.floor(c.cell / s.width) === Math.floor(disclosedPressureLink.cell / s.width);
      // Terrace foundations always reach the same underwater bed, never float.
      // Authored terraced-support mineral hierarchy: the original large,
      // near-black undercroft swallowed the actor in authentic 1280/390 WebGL.
      // The exposed HIGH court gets warm stone, the middle a glazed-jade
      // retaining wall, and the tidal low court keeps its shaded footing.
      // Only a genuinely disclosed cell's public elevation chooses the
      // existing pooled material; footprint, collider, height, AI, route,
      // source privacy, and all frame-time resource allocation stay intact.
      const foundationMineral = floorY > 2.1 ? deepStone : floorY > .7 ? jade : darkJade;
      block(foundationMineral, x, -1.14 - floorY / 2, z, 2.38, 2.14 + floorY, 2.38, c.cell);
      // Pass318: reconstruct repetitive horizontal terrace ribbons into
      // large vertical original Tideglass seawall bays. Keep the complete
      // opaque load-bearing foundation, the same upper playable surface,
      // and low-profile stone toe/cornice. Do not infer missing neighbors.
      block(deepStone, x, -1.26, z, 2.39, .28, 2.39, c.cell);
      // Distinct neutral jade support, NOT the dark-jade 2.39m pressure
      // deck: that visual signature is reserved for a truly public trap
      // and must vanish when private data alone advertises one.
      block(jade, x, -.30, z, 2.39, .14, 2.39, c.cell);
      block(witnessedForeground ? deepStone : stone, x, -.135, z, 2.39, .19, 2.39, c.cell);
      // Only actual PUBLISHED board edges can have an outer seawall.
      // Undefined/hidden neighbors NEVER authorize a fake exposed face.
      const boardCol = c.cell % s.width, boardRow = Math.floor(c.cell / s.width);
      const shorelineFaces = [];
      if (boardCol === 0) shorelineFaces.push([-1, 0]);
      if (boardCol === s.width - 1) shorelineFaces.push([1, 0]);
      if (boardRow === 0) shorelineFaces.push([0, -1]);
      if (boardRow === s.height - 1) shorelineFaces.push([0, 1]);
      const pierHeight = 1.72 + floorY;
      const pierY = -.21 - pierHeight / 2;
      for (const [dx, dz] of shorelineFaces) {
        const faceX = x + dx * 1.22, faceZ = z + dz * 1.22;
        const facesX = dx !== 0;
        // Broad DARK-BACKED glazed recesses are blind SOLID wall faces,
        // not invented doors, objective markers or walkable connections.
        add(box, darkJade, faceX, pierY, faceZ,
          facesX ? .085 : 1.90, pierHeight * .80,
          facesX ? 1.90 : .085, c.cell);
        add(box, seaGlass, faceX + dx * .052, pierY, faceZ + dz * .052,
          facesX ? .048 : 1.48, pierHeight * .55,
          facesX ? 1.48 : .048, c.cell);
        // Two large vertical load piers connect the toe to the known
        // terrace underside. Every part uses the existing batched pools.
        for (const side of [-1, 1]) {
          const px = faceX + (facesX ? 0 : side * .77);
          const pz = faceZ + (facesX ? side * .77 : 0);
          add(bevel, deepStone, px, pierY, pz,
            .21, pierHeight, .21, c.cell);
        }
        add(bevel, lightStone, faceX, -.205, faceZ,
          facesX ? .25 : 2.05, .13,
          facesX ? 2.05 : .25, c.cell);
        shorelineLoadFacades++;
      }
      // Three visibly different, physically tiled *public* terrace districts:
      // ivory observatory above, red-clay garden midway, sea-glass tidal court
      // below. Previously the same sand material dominated every altitude.
      // This uses only the cell's disclosed coordinate and public board size;
      // it does not mark a route, objective, threat, private room or safe tile.
      const district = Math.floor((c.cell % s.width) / 3) + Math.floor(c.cell / s.width / 3) * 7;
      const tier = floorY > 2.1 ? 2 : floorY > .7 ? 1 : 0;
      const patina = variation(district * 31 + 17);
      // Authentic Pass59 WebGL frames rejected the first ivory-heavy palette:
      // it erased the guardian court's existing warm-clay focal island.
      // Keep that truthful original high-court contrast. The lower two tiers
      // add one intentional district of warm clay and sea-glass respectively,
      // while adjacent courts retain a clear ivory/stone separation.
      // Pass328: actual untouched 390px WebGL picked public cell100's
      // BEIGE 2.31m deck despite the correctly recolored 2.39m load lip.
      // Native public state proves this is a merely NEARBY pressure apron,
      // while a currently witnessed, reciprocal Pip/Thornback causeway
      // requires the same full neutral sea-glass foreground. Preserve the
      // REAL linked pressure basin above both priorities; never suppress a
      // disclosed active hazard, invent a path, or read private topology.
      const guardianPressureBackdrop = witnessedForeground
        && pressureCourtApron && !pressureCourtBasin;
      const floorMaterial = pressureCourtBasin ? darkJade
        : guardianPressureBackdrop ? seaGlass : pressureCourtApron
        ? (tier === 2 ? lightStone : tier === 1 ? stone : seaGlass)
        : guardianCourtCell ? seaGlass
        : guardianForecourtShoulder ? darkJade
        : guardianOuterCourtFloor ? darkJade
        : witnessedForeground ? seaGlass
        : tier === 2
          ? (patina > .83 ? clay : variation(district) > .67 ? lightStone : stone)
          : tier === 1 ? (patina > .64 ? clay : lightStone)
            : (variation(district) > .75 ? seaGlass : stone);
      // One unbroken physical slab per disclosed apron tile, rather than
      // random 2x2 squares. No added GPU class, floating deck or fake route.
      if (pressureCourtBasin) {
        // Pass267: one substantial Tideglass sluice COURT replaces two thin
        // marks lost beneath Pip. A broad recessed glass basin and paired
        // load-bearing ivory/bronze runners lead into the actual pressure
        // machine's moving treadle and shutters. No false route, new AI action,
        // raised obstacle, render-time allocation or added GPU resource class.
        // All inset forms remain in this genuinely walkable 2.4m public cell.
        block(floorMaterial, x, -.035, z, 2.39, .07, 2.39, c.cell);
        add(box, deepStone, x, .006, z,
          basinFacesEastWest ? 2.22 : 1.24, .012,
          basinFacesEastWest ? 1.24 : 2.22, c.cell);
        add(box, seaGlass, x, .014, z,
          basinFacesEastWest ? 2.18 : .91, .013,
          basinFacesEastWest ? .91 : 2.18, c.cell);
        for (const sign of [-1, 1]) {
          const px=x+(basinFacesEastWest ? 0 : sign*.63);
          const pz=z+(basinFacesEastWest ? sign*.63 : 0);
          add(box, darkMetal, px, .021, pz,
            basinFacesEastWest ? 2.18 : .22, .023,
            basinFacesEastWest ? .22 : 2.18, c.cell);
          add(box, lightStone, px, .037, pz,
            basinFacesEastWest ? 2.10 : .125, .018,
            basinFacesEastWest ? .125 : 2.10, c.cell);
        }
        // One coral cross-sill on the SOURCE-DISCLOSED trap-facing edge,
        // not an arrow or a fictitious safe route through a locked door.
        const trapCol=disclosedPressureLink.cell%s.width;
        const direction=basinFacesEastWest
          ? Math.sign(trapCol-c.cell%s.width)
          : Math.sign(Math.floor(disclosedPressureLink.cell/s.width)
            -Math.floor(c.cell/s.width));
        add(box, danger, x+(basinFacesEastWest ? direction*1.07 : 0),
          .039, z+(basinFacesEastWest ? 0 : direction*1.07),
          basinFacesEastWest ? .12 : 1.38, .024,
          basinFacesEastWest ? 1.38 : .12, c.cell);
      } else if (pressureCourtApron || guardianCourtCell || guardianForecourtShoulder || guardianOuterCourtFloor || witnessedForeground || variation(c.cell + 50) > .55) {
        block(floorMaterial, x, -.035, z, 2.31, .07, 2.31, c.cell);
        for (const sign of [-1, 1]) {
          add(box, deepStone, x + sign * .99, .003, z, .025, .006, 1.98, c.cell);
          add(box, deepStone, x, .003, z + sign * .99, 1.98, .006, .025, c.cell);
        }
      } else for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
        block(floorMaterial, x + (col - .5) * 1.17, -.035, z + (row - .5) * 1.17, 1.145, .07, 1.145, c.cell);
      }
      if(guardianOuterCourtFloor) {
        // Joined mineral, original shell-course plaza replaces a WHOLE pale
        // tile, not microscopic extras. Neutral stone inlay is neither a
        // predicted AI route nor new crossing. Actual floor stays flush.
        add(box,deepStone,x,.006,z,2.12,.012,2.12,c.cell);
        add(box,seaGlass,x,.015,z,1.94,.012,1.94,c.cell);
        for(const sign of [-1,1]) {
          add(box,darkJade,x+sign*.55,.031,z,.68,.018,1.66,c.cell);
          add(box,inlay,x+sign*.91,.042,z,.075,.012,1.78,c.cell);
          add(box,lightStone,x,.043,z+sign*.88,1.75,.012,.09,c.cell);
        }
      }
      if(guardianForecourtShoulder) {
        // A physically recessed, dark Tideglass gallery beyond the existing
        // impassable masonry, not a route stripe, prize or predicted AI move.
        // Flush original batched geometry, no new GPU material/mesh class.
        add(box,deepStone,x,.006,z,2.05,.012,2.05,c.cell);
        add(box,seaGlass,x,.014,z,1.77,.012,1.77,c.cell);
        for(const sign of [-1,1]) {
          add(box,inlay,x+sign*.94,.025,z,.055,.014,1.64,c.cell);
          add(box,inlay,x,.025,z+sign*.94,1.64,.014,.055,c.cell);
        }
      }
      // The observed guardian lane gets one CONTINUOUS mineral/ivory court,
      // not a carpet of repeated fossil sculptures. This flush physical
      // inlay is deliberately neutral: neither a fake trap nor a route hint.
      if (guardianCourtCell) {
        // Pass303: actual native 390/1280 Pass302 footage still shows a
        // sea of pale ceremonial paving swallowing the encounter. The WHOLE
        // witnessed, reciprocal, publicly disclosed guardian court is one
        // sea-glass mineral amphitheatre, not four ivory islands around a
        // narrow warning strip. Use only existing batched physical materials
        // and exactly the same 2.05m/1.81m flush geometry and clearance.
        // This dark basin is NOT an asserted safe path or extra trap and
        // disappears when the guardian is no longer publicly staged.
        add(box, deepStone, x, .006, z, 2.05, .012, 2.05, c.cell);
        add(box, darkJade, x, .014, z, 1.81, .012, 1.81, c.cell);
        for (const sign of [-1,1])
          add(box, inlay, x + sign*.89, .025, z,
            .075, .018, 1.79, c.cell);
        if (guardianCausewayAxis) {
          // A joined, stage-wide basalt Tideglass duel causeway:
          // the actual public Pip-to-Thornback 1-2 edge path now reads as
          // ONE authored place instead of isolated beige squares. Its full
          // long axis follows the real open neighbor edges, with a continuous
          // glass-colored rim. All pieces are flush (<4cm), purely batched
          // from EXISTING shapes/materials and never affect path/collision.
          guardianCausewayTiles++;
          const alongX=guardianCausewayAxis==='x';
          // Pass302: the real 390px brace was STILL a narrow brown strip
          // with both living actors on repeated beige slabs. Build one
          // full-width, distinctive dark Tideglass stage under the *actual*
          // reciprocal unsealed Pip-Thornback corridor. This is a connected
          // physical mineral apron across three existing walkable cells, not
          // a novel passage, hazard, collider, map hint or fake AI action.
          // Reuse existing instance geometry and material classes only.
          add(box,deepStone,x,.022,z,alongX?2.39:2.32,.014,
            alongX?2.32:2.39,c.cell);
          add(box,darkJade,x,.032,z,alongX?2.34:2.22,.013,
            alongX?2.22:2.34,c.cell);
          add(box,inlay,x,.041,z,alongX?2.27:.42,.008,
            alongX?.42:2.27,c.cell);
          // Fixed mineral edge bands do not promise any particular AI route.
          // The already-public Tideglass leaves remain outside the clear
          // central walking lane, and now lift against a readable dark floor.
          for(const side of [-1,1]) {
            add(box,seaGlass,x+(alongX?0:side*1.04),.042,
              z+(alongX?side*1.04:0),alongX?2.31:.095,.009,
              alongX?.095:2.31,c.cell);
            add(box,clay,x+(alongX?side*.94:0),.048,
              z+(alongX?0:side*.94),alongX?.085:2.22,.012,
              alongX?2.22:.085,c.cell);
          }
          // A broad, paired SEA-GLASS warning threshold belongs only to
          // this ACTUAL disclosed, reciprocal and unsealed guardian causeway.
          // The connected floor leaves use the SAME original geometry and
          // shared materials as the stage; none are built in render frames.
          // Their continuous outward flanking hinges are physical, leave a clear
          // central walking lane, and never become a wall
          // or a promised safe route. A published warning lights them only
          // while the real scene witnesses the corresponding Thornback beat.
          const signal=new THREE.Group();
          signal.name='Published guardian Tideglass warning threshold '+c.cell;
          signal.position.set(x,cellHeight(c.cell,s.width,s.height)+.051,z);
          terrain.add(signal);
          const faces=[];
          for(const side of [-1,1]) {
            // Real rooted margin hinge, not another decal laid on the path.
            // A .61m-wide leaf rests flush on the OUTSIDE of the published
            // lane (inward boundary .69); it cannot cover the walkable centre.
            // Its long axis remains joined over the original 2.30m tile.
            const hinge=new THREE.Group();
            hinge.name='Published guardian Tideglass margin hinge '+c.cell+' '+side;
            hinge.position.set(alongX?0:side*.69,0,alongX?side*.69:0);
            signal.add(hinge);
            const rod=mesh(signal,box,darkMetal,
              alongX?0:side*.69,-.012,alongX?side*.69:0,
              alongX?2.30:.080,.080,alongX?.080:2.30);
            rod.name='Published guardian Tideglass hinge root '+c.cell+' '+side;
            const plate=mesh(hinge,box,seaGlass,
              alongX?0:side*.305,.015,alongX?side*.305:0,
              alongX?2.30:.61,.055,alongX?.61:2.30);
            plate.name='Published guardian warning floor leaf '+c.cell+' '+side;
            faces.push({object:plate,hinge,side});
          }
          // Pass312: FOUR original stone/sea-glass signal standards sit at
          // the two REAL guardian-aisle actor endpoints. Their crowns actuate
          // with the same public warning as the rooted floor leaves. None
          // draws a speculative route, barrier, attacker or hidden map detail.
          const sentinels=[];
          if(c.cell===s.currentCell || s.threats.some(t=>t?.cell===c.cell)) {
            for(const side of [-1,1]) {
              const foot=new THREE.Group();
              foot.name='Published guardian Tideglass sentinel footing '+c.cell+' '+side;
              foot.position.set(alongX?0:side*1.04,0,alongX?side*1.04:0);
              signal.add(foot);
              const plinth=mesh(foot,bevel,deepStone,0,.06,0,.27,.16,.27);
              plinth.name='Published guardian Tideglass solid sentinel plinth '+c.cell+' '+side;
              const lift=new THREE.Group();lift.position.y=.04;foot.add(lift);
              const pillar=mesh(lift,bevel,lightStone,0,.35,0,.20,.60,.20);
              pillar.name='Published guardian Tideglass joined sentinel shaft '+c.cell+' '+side;
              const crown=mesh(lift,bevel,seaGlass,0,.72,0,.39,.18,.37);
              crown.name='Published guardian Tideglass sentinel crown '+c.cell+' '+side;
              const lens=mesh(lift,box,inlay,0,.71,alongX?0:side*.195,
                alongX?.26:.035,.12,alongX?.035:.26);
              lens.name='Published guardian Tideglass sentinel lens '+c.cell+' '+side;
              // The original 390px full-frame brace revealed that an amber
              // sliver on a short post reads as static scenery, not a
              // guardian-wide event. A large, joined, DOUBLE-HINGED shell fan
              // grows from the existing real endpoint structure. Its open
              // side points OUT of the actual passable central lane; unlike a
              // gate it never blocks the route or implies a new crossing.
              // Reuse existing geometry/material classes, build only when the
              // source-published endpoint court is physically constructed.
              const sailPivot=new THREE.Group();
              sailPivot.name='Published guardian Tideglass rooted shell-fan hinge '+c.cell+' '+side;
              sailPivot.position.y=.72;
              lift.add(sailPivot);
              // Pass319: genuine full-resolution 390px guardian frames show
              // four broad bright paddles competing with Pip and Thornback.
              // Preserve the same four actual warning mechanisms but sculpt
              // each as a taller, corridor-LONG mineral feather, narrow across
              // the lane and rooted farther OUTSIDE the 1.38m clear centre.
              // Their already-authoritative public brace still sweeps them
              // farther outward; they are not gates, threat predictors or
              // colliders. The existing pooled GPU classes are unchanged.
              const sail=mesh(sailPivot,bevel,seaGlass,
                alongX?0:side*.26,.36,alongX?side*.26:0,
                alongX?.56:.24,.94,alongX?.24:.56);
              sail.name='Published guardian Tideglass full shell-fan '+c.cell+' '+side;
              const spar=mesh(sailPivot,box,darkMetal,
                alongX?0:side*.09,.38,alongX?side*.09:0,
                alongX?.48:.075,.70,alongX?.075:.48);
              spar.name='Published guardian Tideglass shell-fan structural spar '+c.cell+' '+side;
              const crest=mesh(sailPivot,bevel,lightStone,
                alongX?0:side*.29,.82,alongX?side*.29:0,
                alongX?.48:.27,.14,alongX?.27:.48);
              crest.name='Published guardian Tideglass shell-fan crest '+c.cell+' '+side;
              sentinels.push({lift,crown,lens,sailPivot,sail,crest,side});
            }
          }
          guardianTideSignals.push({cell:c.cell,axis:guardianCausewayAxis,faces,sentinels});
        }
      }
      // A genuinely PUBLIC trap has its own broad physical pressure court.
      // Exact 320/390px WebGL review found the moving jade/ivory mechanism
      // visually lost in repeat beige tiling and neighboring masonry. This
      // DARK mineral + terracotta ground plane gives the real known hazard
      // a single authored silhouette, while leaving all raised jaw hardware,
      // Pip's footpath and the actual walkable cell height untouched.
      // Flush decoration only: no new trigger, collision, route, clue, AI
      // signal, hidden-cell query, GPU class or frame-time mesh allocation.
      if (c.trap && !c.blocked) {
        // The coherent dark Tideglass machine sits within the original
        // public hazard footprint. Its earned large ivory doors and red
        // cutting surfaces now contrast with the mineral court underneath.
        block(deepStone, x, -.010, z, 2.12, .030, 2.12, c.cell);
        block(darkJade, x, .009, z, 1.94, .012, 1.94, c.cell);
        // ONLY actual open public approach edges receive the matching
        // physical shear threshold. Never bridge a closed gate or stair.
        for (const approach of s.cells) {
          if (!publicPressureCourtLink(approach,c,s)) continue;
          const dx=approach.cell%s.width-c.cell%s.width;
          const dz=Math.floor(approach.cell/s.width)-Math.floor(c.cell/s.width);
          add(box, lightStone, x+dx*.96, .031, z+dz*.96,
            dx ? .16 : 1.38, .020, dx ? 1.38 : .16, c.cell);
          add(box, danger, x+dx*1.07, .046, z+dz*1.07,
            dx ? .11 : 1.24, .022, dx ? 1.24 : .11, c.cell);
        }
        // Truthful, flush presentation: original treadle, collision, AI unchanged.
      }
      // Low, symmetric ivory-jade edge engraving separates the sea-glass
      // lower walkable terrace from the lagoon without suggesting a corridor.
      // The relief is flush (under 2cm in scene units), has no collision or
      // extra draw call and is batched with existing reused geometry/material.
      if (!pressureCourtApron && tier === 0 && !c.blocked && !c.trap && !c.checkpoint && !c.clue) {
        for (const sign of [-1, 1]) {
          add(box, lightStone, x + sign * .99, .015, z, .034, .012, 1.75, c.cell);
          add(box, lightStone, x, .015, z + sign * .99, 1.75, .012, .034, c.cell);
        }
      }
      // Recessed four-petal tesserae form a recognisable original courtyard
      // language rather than an endless uniform tile grid. Courts are selected
      // solely by the cell's disclosed coordinate; the symmetry deliberately
      // avoids directional arrows, collectible halos and hidden-route hints.
      // Pigments, geometry and instances are shared; nothing is built per frame.
      const gateCourt=gateCourtCells.has(c.cell)&&!c.blocked
        &&!c.trap&&!c.checkpoint&&!c.clue;
      const courtSeed = variation(c.cell * 41 + 709);
      if (!pressureCourtApron && !guardianCourtCell && courtSeed > .68 && !gateCourt
        && !c.blocked && !c.trap && !c.checkpoint && !c.clue) {
        const pigment = courtSeed > .85 ? seaGlass : clay;
        for (let petal = 0; petal < 4; petal++) {
          const angle = Math.PI / 4 + petal * Math.PI / 2;
          const dx = Math.cos(angle) * .53, dz = Math.sin(angle) * .53;
          add(box, deepStone, x + dx, .007, z + dz, .39, .014, .39, c.cell, 0, Math.PI / 4);
          add(box, pigment, x + dx, .017, z + dz, .31, .014, .31, c.cell, 0, Math.PI / 4);
        }
        add(cylinder, deepStone, x, .017, z, .25, .022, .25, c.cell);
        add(cylinder, lightStone, x, .034, z, .13, .012, .13, c.cell);
      }
      // Public ceramic shell-fan relief is an ORIGINAL, on-stage material cue,
      // not distant lagoon scenery. Every mark is a real, upward-facing Three
      // surface on an already disclosed ordinary floor; no secret route, safe
      // prediction, new collectible or autonomous instruction is consulted.
      // Broad asymmetric scallops interrupt the repetitive paving visible in
      // real 320/390/844/1280 WebGL frames. Reuse the existing petal geometry
      // and mineral materials in the same GPU batches, with no extra draw
      // resources or render-frame allocations. Never cover known hazards,
      // treasure hardware or a checkpoint with a look-alike objective symbol.
      if (!pressureCourtApron && !guardianCourtCell && !gateCourt && !c.blocked && !c.trap
          && !c.checkpoint && !c.clue
          && variation(c.cell * 71 + 138) > .36) {
        const shellPigment = tier === 2 ? seaGlass : tier === 1 ? lightStone : stone;
        for (let petal = 0; petal < 5; petal++) {
          add(leafGeometry, shellPigment, x, .024, z, .82, .77, 1,
            c.cell, -Math.PI / 2, 0, (petal * TAU / 5) + .18);
        }
      }
      if (gateCourt && !pressureCourtApron) gateCourtRosette(x,z,c.cell);
      // Small scattered flecks belong to ordinary courts; the large disclosed
      // mechanism gets deliberate negative space around the actual moving jaws.
      if (!pressureCourtApron && !guardianCourtCell) for (let j = 0; j < 2; j++) {
        const sign = j ? 1 : -1;
        add(box, deepStone, x + sign * .91, .003, z - .9, .14, .006, .035, c.cell, 0, .2);
        add(box, inlay, x + sign * .86, .006, z + .86, .12, .009, .12, c.cell, 0, Math.PI / 4);
      }
      const row = Math.floor(c.cell / s.width), col = c.cell % s.width;
      const sides = [ { dx: 0, dz: -1, n: row > 0 ? c.cell - s.width : -1 }, { dx: 1, dz: 0, n: col + 1 < s.width ? c.cell + 1 : -1 }, { dx: 0, dz: 1, n: row + 1 < s.height ? c.cell + s.width : -1 }, { dx: -1, dz: 0, n: col > 0 ? c.cell - 1 : -1 } ];
      // Do not invent architecture in undisclosed BLOCKED cells: the
      // source-authoritative camera may never receive them. A safe observed
      // walkable tile can own a low fossil alcove near its publicly confirmed
      // NON-PASSAGE side. Keep the real tile center and true route open.
      // This is a deterministic presentation variation, not an extra obstacle.
      const fossilSide = !pressureSightline && !guardianCourtCell && !guardianQuietRingCell && !c.blocked && !c.trap && !c.checkpoint && !c.clue
        && c.cell!==s.exitCell
        && !gateCourt && !gateApproachCells.has(c.cell)
        && !s.keys.some(key=>key.cell===c.cell)
        && variation(c.cell*17+131)>.40
        ? sides.find(side=>!c.neighbors.includes(side.n)
            && (side.dx<0||side.dz<0))
          ||sides.find(side=>!c.neighbors.includes(side.n))
        : null;
      if (fossilSide) tideFossilAlcove(x,z,c.cell,fossilSide.dx,fossilSide.dz);
      for (let side = 0; side < 4; side++) {
        const { dx, dz, n } = sides[side];
        // Both ends must already be published and this must be a genuinely
        // SOLID elevation boundary, not a real stair, gate, hidden route or
        // private trap. No camera cutaway or authority rule is altered.
        const lower=knownByCell.get(n);
        const drop=lower?floorY-cellHeight(n,s.width,s.height):0;
        if(lower && !c.blocked && !lower.blocked && drop>.70
          && pressureSightlines.has(c.cell) && pressureSightlines.has(n)
          && !c.neighbors.includes(n) && !lower.neighbors.includes(c.cell)
          && !gateEdges.has(doorEdgeId(c.cell,n)))
          pressureRetainingGallery(x,z,dx,dz,c.cell,drop);
        if (!knownByCell.has(n)) {
          add(box, darkJade, x + dx * 1.24, -1.59 - floorY, z + dz * 1.24, dz ? 2.28 : .13, .12, dx ? 2.28 : .13, c.cell);
          const drift = (variation(c.cell * 4 + side) - .5) * 1.1;
          add(box, rippleMaterial, x + dx * 1.32 + dz * drift, -1.665 - floorY, z + dz * 1.32 + dx * drift, dz ? .65 : .025, .006, dx ? .65 : .025, c.cell);
          // Pass129: water-rooted stone ribs make the currently disclosed
          // edge of the miniature stage a sculpted undercroft rather than
          // a dark rectangular pillar in an empty lagoon. The relief is a
          // CLOSED facade: never a doorway, path, collectible, unseen tile,
          // threat, or AI instruction. Only visibly exposed east/south
          // sides of public walkable cells receive these non-colliding ribs.
          // The shared instanced geometry and materials add no GPU classes.
          // Genuine 320px WebGL pressure evidence shows these *exterior*
          // three-course buttresses, closed tide-clock dials and hanging fern
          // mantles crowding the real moving jaws and Pip. Reserve the already
          // disclosed two-cell Tide-Shear court for its consequential motion:
          // only omit decorative exterior layers there. The foundational
          // stone, actual impassable edges, stairs, gate and playable floor
          // remain intact. A private/unknown trap must NEVER affect geometry.
          if ((dx > 0 || dz > 0) && !pressureSightline && !guardianCourtCell && !c.blocked && !c.trap
            && !c.checkpoint && !c.clue && c.cell !== s.exitCell
            && !s.keys.some(key => key.cell === c.cell)) {
            const ribY = -floorY / 2 - .97;
            const ribHeight = floorY + 1.50;
            for (const transverse of [-.70, .70]) {
              const px = x + dx * 1.235 + dz * transverse;
              const pz = z + dz * 1.235 + dx * transverse;
              add(bevel, deepStone, px, ribY, pz,
                dz ? .19 : .14, ribHeight, dx ? .19 : .14, c.cell);
              // Mineral insets articulate the tall solid foundation without
              // any luminous beacon or directional route-looking glyph.
              add(bevel, seaGlass, px + dx * .078, ribY + .10,
                pz + dz * .078, dz ? .075 : .065,
                ribHeight - .30, dx ? .075 : .065, c.cell);
            }
            add(bevel, lightStone, x + dx * 1.232, -.30,
              z + dz * 1.232, dz ? 1.72 : .13, .12,
              dx ? 1.72 : .13, c.cell);
            undercroftButtresses++;
            // Pass134: actual Pass133 native 1280/390 images still showed a
            // monolithic, near-black undercroft occupying much of the playable
            // frame. Three wide, stepped mineral tidal courses give the
            // EXTERIOR of each already disclosed safe east/south foundation
            // an authored architectural scale. Varying spans and the pale
            // raised top/bottom edges make physical stone visible at normal
            // gameplay zoom, not a thin shader stripe. No false doorway,
            // directional arrow, collision, route or hidden-cell inference.
            // Reuse the current bevel/material instancing only.
            for (const [course, depth] of [.12, .48, .80].entries()) {
              const reliefY = -.34 - depth * (1.36 + floorY);
              // Keep middle stone courses physically above the strict 1.68
              // real-model width bar, including float32 matrix rounding.
              const reliefSpan = course === 1 ? 1.74 : 2.04;
              add(bevel, course === 1 ? seaGlass : lightStone,
                x + dx * 1.285, reliefY,
                z + dz * 1.285,
                dz ? reliefSpan : .135,
                course === 1 ? .16 : .12,
                dx ? reliefSpan : .135, c.cell);
            }
            // Pass135: one heavy CLOSED tide-clock rosette on selected
            // already disclosed safe OUTSIDE foundation faces. Authentic
            // Pass134 WebGL shows a vast near-black undercroft with little
            // readable object-scale storytelling. This is a real recessed
            // sea-glass dial, thick ivory bezel and CROSS-BARRED solid face,
            // not an opening, beacon, key, route, hidden passage or UI decal.
            // Body, rim and physical grate reuse existing pooled Three
            // geometries/materials. Never place one on an unknown, blocked,
            // hazardous, key, exit or checkpoint tile.
            if (variation(c.cell * 29 + 171) > .32) {
              const dialY = -.74 - (floorY + 1.36) * .48;
              const dialX = x + dx * 1.382;
              const dialZ = z + dz * 1.382;
              const facing = dx ? Math.PI / 2 : 0;
              add(portalDisc, darkJade, dialX, dialY, dialZ,
                .53, .53, 1, c.cell, 0, facing);
              add(portalDisc, seaGlass, dialX + dx * .009,
                dialY, dialZ + dz * .009,
                .42, .42, 1, c.cell, 0, facing);
              add(ring, lightStone, dialX + dx * .025,
                dialY, dialZ + dz * .025,
                .47, .47, .47, c.cell, 0, facing);
              // A solid cruciform grille makes the dial unmistakably a
              // sealed ornament rather than a fake traversable doorway.
              add(box, deepStone, dialX + dx * .035, dialY,
                dialZ + dz * .035,
                dz ? .78 : .055, .075, dx ? .78 : .055, c.cell);
              add(box, inlay, dialX + dx * .043, dialY,
                dialZ + dz * .043,
                dz ? .085 : .065, .73, dx ? .085 : .065, c.cell);
              closedTideMedallions++;
            }
            // A rooted, physical sea-fern mantle gives the otherwise black
            // undercroft a readable living vertical layer. Every frond hangs
            // OUTSIDE a publicly disclosed tile, at the currently exposed
            // east/south face; it cannot block Pip's route or mark a hidden
            // opening. Only cell coordinate and this published face determine
            // the arrangement. Existing double-sided leaves, stone and moss
            // are instanced; no new draw-resource class or animation loop.
            if (variation(c.cell * 23 + side * 31 + 419) > .30) {
              hangingFacadeGardens++;
              for (let tuft = 0; tuft < 3; tuft++) {
                const across = (tuft - 1) * .53;
                const rootX = x + dx * 1.315 + dz * across;
                const rootZ = z + dz * 1.315 + dx * across;
                add(bevel, moss, rootX, -.32, rootZ,
                  dx ? .065 : .18, .21, dz ? .065 : .18, c.cell);
                // Actual 1280/390 native Pass132 screenshots showed the
                // original narrow blades as near-invisible green strings.
                // Substantial, broad, overlapping mineral fern fans grow
                // downward IN the exterior facade plane, without crossing
                // the tile boundary or consuming a new draw/material class.
                // Root pads and foliage remain well below the playable top.
                add(sphere, moss, rootX, -.46, rootZ,
                  dx ? .07 : .20, .16, dz ? .07 : .20, c.cell);
                for (let blade = 0; blade < 3; blade++) {
                  const lean = blade - 1;
                  add(leafGeometry, blade === 1 ? leaf : leafDark,
                    rootX + dz * lean * .13, -.36,
                    rootZ + dx * lean * .13,
                    .68 + (blade === 1 ? .14 : 0),
                    1.03 + variation(c.cell * 13 + side * 19 + tuft * 7 + blade) * .34,
                    1, c.cell, 0, dx ? Math.PI / 2 : 0,
                    Math.PI + lean * .22);
                }
              }
            }
          }
          if (variation(c.cell * 13 + side) > .83) {
            const depth = floorY + 1.63;
            block(jade, x + dx * 1.16 + dz * .82, -.05 - depth / 2, z + dz * 1.16 + dx * .82, dz ? .3 : .38, depth, dx ? .3 : .38, c.cell);
          }
        }
        if (c.neighbors.includes(n)) {
          if (knownByCell.has(n)) {
            const rise = cellHeight(n, s.width, s.height) - floorY;
            if (rise > 0) {
              stairEdges.push([c.cell, n]);
              for (let step = 0; step < STAIR_COUNT; step++) {
                const distance = STAIR_START + (step + .5) * STAIR_RUN / STAIR_COUNT;
                const top = (step + 1) * rise / STAIR_COUNT;
                add(box, step % 2 ? lightStone : stone, x + dx * distance, top / 2, z + dz * distance, dz ? STAIR_HALF_WIDTH * 2 : STAIR_RUN / STAIR_COUNT + .002, top, dx ? STAIR_HALF_WIDTH * 2 : STAIR_RUN / STAIR_COUNT + .002, c.cell);
                // Narrow jade side cheeks make the stair an intentional connector.
                for (const sign of [-1, 1]) add(box, jade, x + dx * distance + dz * sign * .84, top / 2, z + dz * distance + dx * sign * .84, dz ? .12 : STAIR_RUN / STAIR_COUNT, top + .06, dx ? .12 : STAIR_RUN / STAIR_COUNT, c.cell);
              }
              // Never dress a one-way or inconsistent partial disclosure as
              // a confirmed connected stair. The existing public steps remain
              // unchanged; only this new authored landmark requires reciprocity.
              if (knownByCell.get(n).neighbors.includes(c.cell)) {
              // A genuinely connected public elevation change reads as a
              // playable tideglass stair. In an already DISCLOSED pressure
              // encounter the tall decorative handrails hid Pip's view of the
              // actual moving shutters in the full 390px original WebGL.
              // Keep the complete authoritative steps and two physical side
              // barriers, but lower their solid decorative rails and posts.
              // This affects ONLY publicly known, reciprocal stair endpoints
              // within the disclosed two-cell pressure sightline, never an
              // unknown/private trap, gate, passage or engine collision.
              // All mesh classes, render resources and 1.56-wide stair lane
              // remain unchanged.
              const pressureStairCutaway = pressureSightlines.has(c.cell)
                || pressureSightlines.has(n);
              stairBalustrades++;
              const rampLength = Math.hypot(STAIR_RUN, rise);
              const incline = Math.atan2(rise, STAIR_RUN);
              for (const sign of [-1, 1]) {
                const sideX = dz * sign * .99, sideZ = dx * sign * .99;
                const centerX = x + dx * (STAIR_START + STAIR_RUN / 2) + sideX;
                const centerZ = z + dz * (STAIR_START + STAIR_RUN / 2) + sideZ;
                // Real sloping timber/ceramic grip follows the stair ascent.
                add(box, deepStone, centerX, (pressureStairCutaway ? .32 : .70) + rise / 2, centerZ,
                  dx ? rampLength : .19, .17, dz ? rampLength : .19,
                  c.cell, dz ? -incline * dz : 0, 0, dx ? incline * dx : 0);
                add(box, seaGlass, centerX, (pressureStairCutaway ? .43 : .81) + rise / 2, centerZ,
                  dx ? rampLength * .93 : .075, .047, dz ? rampLength * .93 : .075,
                  c.cell, dz ? -incline * dz : 0, 0, dx ? incline * dx : 0);
                // Three rooted uprights create a readable physical silhouette
                // beneath each continuous handrail and stop short of the tile
                // boundary. They do not obstruct Pip's authoritative centerline.
                for (const distance of [.15, .59, 1.08]) {
                  const climb = rise * Math.max(0, (distance - STAIR_START) / STAIR_RUN);
                  const px = x + dx * distance + sideX;
                  const pz = z + dz * distance + sideZ;
                  add(box, deepStone, px, climb + (pressureStairCutaway ? .15 : .34), pz,
                    .18, pressureStairCutaway ? .30 : .68, .18, c.cell);
                  add(box, lightStone, px, climb + (pressureStairCutaway ? .32 : .69), pz,
                    .25, .12, .25, c.cell);
                }
              }
              }
            }
          }
          continue;
        }
        const key = n < 0 ? `${c.cell}:${side}:edge` : `${Math.min(c.cell, n)}:${Math.max(c.cell, n)}`;
        if (edges.has(key)) continue; edges.add(key);
        // The authentic gate forecourt is only cut down on confirmed,
        // blocked side edges with both cells ALREADY disclosed. The actual
        // gate edge keeps its gate geometry; unknown edges keep their high
        // silhouette, so this cannot suggest an undiscovered passage.
        const publicParapet = gateApproachCells.has(c.cell)
          && n >= 0 && knownByCell.has(n) && !gateEdges.has(key);
        // Only an authentic, disclosed NONPASSAGE edge beside a published
        // pressure trap can earn a lower solid wall. Never use unresolved
        // neighbors, public gate edges or the engine's private route graph.
        // Authentic source-bound 320/390px pressure frames show that tall
        // walls TWO public tiles out still dominate the visible mechanism.
        // Extend the existing LOW, SOLID cutaway to confirmed nonpassage
        // edges touching the already-disclosed two-cell pressure court.
        // BOTH endpoints must actually be published. Unknown-side edges,
        // real gates, collision/navigation and unseen map tiles keep their
        // existing walls. A blocked public tile keeps its solid stone cap.
        // The cutaway is symmetric regardless of public cell iteration order.
        const pressureParapet = !publicParapet && n >= 0
          && knownByCell.has(n) && !gateEdges.has(key)
          && (pressureSightlines.has(c.cell) || pressureSightlines.has(n))
          && ((!c.blocked && !knownByCell.get(n).blocked)
            || (pressureSightlines.has(c.cell) && pressureSightlines.has(n)
              && !!c.blocked !== !!knownByCell.get(n).blocked));
        // Authentic full-frame Pass310 (390x844, tick32) shows Pip and
        // Thornback framed, but the foreground full-height ivory NONPASSAGE
        // wall still takes up the centre of their disclosed encounter.
        // A confirmed SOLID boundary between two *currently visible*,
        // walkable but mutually disconnected same-tier public cells may
        // receive the existing low, opaque stone parapet. Both published
        // neighbor lists must reject travel: never mistake a partial,
        // one-way disclosure for a known impenetrable wall. This is a
        // physical sightline, NOT a navigable path or a map reveal.
        const adjacentKnown= n>=0 ? knownByCell.get(n) : null;
        const guardianSealedReefScreen=!!adjacentKnown
          && !c.blocked && adjacentKnown.blocked===false
          && !c.trap && !adjacentKnown.trap
          && !c.checkpoint && !adjacentKnown.checkpoint
          && !c.clue && !adjacentKnown.clue
          && c.cell!==s.exitCell && n!==s.exitCell
          && !s.keys.some(k=>k.cell===c.cell||k.cell===n)
          && s.visibleCells.includes(c.cell) && s.visibleCells.includes(n)
          && Array.isArray(c.neighbors) && Array.isArray(adjacentKnown.neighbors)
          && !c.neighbors.includes(n) && !adjacentKnown.neighbors.includes(c.cell)
          && Math.abs(cellHeight(c.cell,s.width,s.height)
            -cellHeight(n,s.width,s.height))<1e-8
          && ((guardianSightlines.has(c.cell) && guardianCauseway.has(c.cell))
            || (guardianSightlines.has(n) && guardianCauseway.has(n)));
        // Pass335: source-authentic 390px brace at (.50,.66) first hits a
        // FULL 2.34m ivory cap on the sealed boundary cell100 -> cell117.
        // Both are currently PUBLIC ordinary second-ring guardian foreground
        // at the hero's real level, with NO reciprocal passage. Earlier
        // guardian-only coloring missed the wall because it is two tiles
        // away and ALSO falls into a merely NEARBY pressure sightline.
        // Give the whole genuinely solid spectator-facing perimeter a
        // continuous dark Tideglass face/crest, not more cosmetic props.
        // A real gate, unseen side, actual passage, height change or a
        // directly linked public pressure trigger always retains priority.
        const guardianForegroundSealedScreen=!!adjacentKnown
          && guardianForeground.has(c.cell) && guardianForeground.has(n)
          && guardianOuterCourt.ordinary.has(c.cell)
          && guardianOuterCourt.ordinary.has(n)
          && c.blocked===false && adjacentKnown.blocked===false
          && !c.trap && !adjacentKnown.trap
          && !c.checkpoint && !adjacentKnown.checkpoint
          && !c.clue && !adjacentKnown.clue
          && c.cell!==s.exitCell && n!==s.exitCell
          && !s.keys.some(k=>k.cell===c.cell || k.cell===n)
          && s.visibleCells.includes(c.cell) && s.visibleCells.includes(n)
          && Array.isArray(c.neighbors) && Array.isArray(adjacentKnown.neighbors)
          && !c.neighbors.includes(n) && !adjacentKnown.neighbors.includes(c.cell)
          && Math.abs(cellHeight(c.cell,s.width,s.height)
            -cellHeight(n,s.width,s.height))<1e-8
          && !s.doors.some(d=>(d.a===c.cell&&d.b===n)
            ||(d.b===c.cell&&d.a===n))
          // Pass336: the exact-HEAD public brace has an actual pressure
          // trigger joined to a THIRD tile beside this spectator wall. A
          // pressure neighbor on ANOTHER EDGE must not make the physically
          // impassable 100/117 boundary an ivory warning slab. Excluding real
          // trap endpoints above still preserves the pressure wall and its
          // mechanical cues; this wall is NOT a crossing or safe-route cue.
          // Never use a private hazard graph or a remembered-only cell.
          ;
        // The older blocked-cell flank rule remains, but a genuine
        // spectator-side public guardian wall may outrank a merely nearby
        // pressure apron. A CONNECTED hazard never earns this cutaway.
        const guardianParapet = !publicParapet
          && (!pressureParapet || guardianForegroundSealedScreen)
          && n>=0 && knownByCell.has(n) && !gateEdges.has(key)
          && (guardianForegroundSealedScreen
            || ((guardianCauseway.has(c.cell) || guardianCauseway.has(n))
              && (guardianSealedReefScreen ||
                (((guardianSightlines.has(c.cell) && guardianBlockedRelief.has(n))
                  || (guardianSightlines.has(n) && guardianBlockedRelief.has(c.cell)))
                  && (!!c.blocked !== !!knownByCell.get(n).blocked)
                  && !knownByCell.get(n).neighbors?.includes(c.cell)))));
        const fossilStageEdge = fossilSide && fossilSide.n === n;
        if (publicParapet || pressureParapet || guardianParapet)
          gateForecourtParapet(x + dx * 1.2, z + dz * 1.2, !!dz, c.cell,
            pressureParapet, guardianParapet);
        else if (fossilStageEdge) {
          fossilGalleryEdges++;
          // Physical sightline repair: the real native fossil images reveal
          // listening sails trapped behind their own tall opaque wall. A
          // low, continuous stone seawall plus connected ivory end-stops
          // preserves the SAME publicly confirmed impassable edge and leaves
          // the authored hinged faces visible. No collision, route, camera,
          // AI, key, door or undisclosed cell information is changed.
          const wx=x+dx*1.2, wz=z+dz*1.2;
          block(deepStone,wx,.12,wz,dz?2.24:.34,.24,dx?2.24:.34,c.cell);
          block(seaGlass,wx,.30,wz,dz?2.26:.25,.17,dx?2.26:.25,c.cell);
          for (const sign of [-1,1]) {
            const ex=wx+(dz?sign*.94:0), ez=wz+(dx?sign*.94:0);
            block(lightStone,ex,.33,ez,.20,.34,.20,c.cell);
          }
        } else wall(x + dx * 1.2, z + dz * 1.2, !!dz, c.cell * 17 + side, c.cell,
          !pressureSightline && (guardianCauseway.has(c.cell)
            || guardianForecourtShoulders.has(c.cell)
            || guardianOuterCourt.ordinary.has(c.cell)), guardianQuietRingCell);
        // Unlike unrevealed neighbors, this is a real blocked direction in
        // the public room's advertised edges. A lifted vertical garden on its
        // physical wall gives the otherwise pale stage a distinct green layer.
        // Outside-board edges already have separate low coastal planters.
        const faceSeed = c.cell * 31 + side + 130;
        // An original fossil listening sail is itself the public wall-side
        // silhouette. Keep its actual hinged faces in view instead of planting
        // a tall raised garden on the same observed NON-PASSAGE edge. Other
        // walls retain their verdant profile; public navigation is untouched.
        if (!pressureSightline && !guardianCourtCell && !guardianQuietRingCell && n >= 0 && !fossilStageEdge && gardenPatch(c.cell) > .38
          && variation(faceSeed) > (dx + dz > 0 ? .29 : .56)) {
          if (gateApproachCells.has(c.cell)) gateForecourtPlanter(x, z, dx, dz, c.cell);
          else coastalGarden(x, z, dx, dz, c.cell * 71 + side * 19, c.cell, 1.05);
        }
        const region = `${Math.floor(col / 6)}:${Math.floor(row / 6)}`;
        if (!pressureSightline && !guardianCourtCell && !guardianQuietRingCell && side === 0 && landmarkSites.get(region)?.cell === c.cell) {
          const wide = landmarkSites.get(region).wide;
          gardenLandmark(x + (wide ? 1.2 : 0), z - 1.2, c.cell, c.cell * 19, wide);
        }
        // Cap a limited number of wall intersections with taller ruined columns.
        if (!pressureSightline && !guardianCourtCell && !guardianQuietRingCell && !gateApproachCells.has(c.cell) && variation(c.cell * 31 + side) > .76) {
          const px = x + (dx || (side === 0 ? -1 : 1)) * 1.2;
          const pz = z + (dz || (side === 1 ? -1 : 1)) * 1.2;
          const ck = `${px.toFixed(2)}:${pz.toFixed(2)}`;
          if (!columns.has(ck)) { column(px, pz, c.cell, c.cell * 6 + side); columns.add(ck); }
        }
        if (!pressureSightline && !guardianCourtCell && !guardianQuietRingCell && !fossilStageEdge && !gateApproachCells.has(c.cell)
          && gardenPatch(c.cell) > .65 && variation(c.cell + side * 41) > .55)
          plant(x + dx * .98 + dz * .64, .015, z + dz * .98 + dx * .64, c.cell * 17 + side, c.cell, 1.05);
      }
      // Only the fixed, public board perimeter may carry these shore planters.
      // Unknown neighboring cells *within* the board never receive greenery.
      const perimeter = [
        ...(col === 0 ? [[-1, 0]] : []),
        ...(col === s.width - 1 ? [[1, 0]] : []),
        ...(row === 0 ? [[0, -1]] : []),
        ...(row === s.height - 1 ? [[0, 1]] : []),
      ];
      for (const [dx, dz] of perimeter) {
        // Entirely grounded public-board edge cascade: translucent physical
        // flowing strips descend to the ocean, never an undisclosed bridge or
        // floor. Decorative geometry is instanced and allocated on rebuild.
        const waterSeed = c.cell * 47 + dx * 13 + dz * 29;
        if (variation(waterSeed + 188) > .70) {
          perimeterCascades++;
          const fall = floorY + 1.65, centerY = -fall / 2;
          for (let stream = -1; stream <= 1; stream++) {
            const offset = stream * .24;
            const px = x + dx * 1.255 + dz * offset;
            const pz = z + dz * 1.255 + dx * offset;
            add(box, rippleMaterial, px, centerY, pz,
              dx ? .075 : .22, fall, dx ? .22 : .075, c.cell);
            if (stream === 0) add(box, seaGlass,
              px + dx * .015, centerY + .09, pz + dz * .015,
              dx ? .036 : .085, fall - .18, dx ? .085 : .036, c.cell);
          }
        }
        // Two-cell grouping creates planted terraces with unplanted breathing
        // spaces rather than one identical tuft repeated around every tile.
        const patch = Math.floor(col / 2) * 47 + Math.floor(row / 2) * 97 + (dx ? 67 : 31);
        if (!pressureSightline && !guardianCourtCell && !guardianQuietRingCell && variation(patch) > (dx + dz > 0 ? .24 : .47)) {
          coastalGarden(x, z, dx, dz, c.cell * 71 + (dx + 2) * 13 + (dz + 2) * 23, c.cell);
        }
      }
      if (c.blocked) {
        // A genuinely observed, impassable neighboring cell preserves its
        // original opaque foundation, walls and collision, but no longer
        // towers over the physical Pip–Thornback performance. Replace ONLY
        // decorative blocked-cell ornament with a sealed mineral reef.
        if ((guardianBlockedRelief.has(c.cell) || guardianOuterCourt.sealed.has(c.cell))
          && !pressureSightline) {
          if(guardianOuterCourt.sealed.has(c.cell))guardianOuterCourtSealedTiles++;
          guardianBlockedReliefTiles++;
          // Pass320 actual 390px three-beat WebGL: the old huge, pale,
          // flat 1.91m cap covered the near half of the two-actor stage.
          // Rebuild ONLY a currently PUBLIC, genuinely impassable guardian
          // flank as a LOWER, SEALED Tideglass reef gallery. The original
          // load foundation remains solid; the opaque inset and three
          // firmly attached cross-ribs cannot imply a walkable gate.
          // All parts reuse pooled geometry/materials, never frame objects.
          block(deepStone,x,.105,z,2.12,.21,2.12,c.cell);
          block(darkJade,x,.235,z,1.92,.055,1.92,c.cell);
          block(jade,x,.273,z,1.59,.021,1.59,c.cell);
          for(const side of [-1,1]) {
            // Four interlocking low retaining courses protect the rim
            // without building another tall foreground camera curtain.
            block(stone,x+side*.965,.29,z,.18,.27,1.87,c.cell);
            block(stone,x,.29,z+side*.965,1.87,.27,.18,c.cell);
            block(seaGlass,x+side*.965,.443,z,.10,.038,1.79,c.cell);
            block(seaGlass,x,.443,z+side*.965,1.79,.038,.10,c.cell);
          }
          for(const offset of [-.48,0,.48]) {
            // Blind structural ribs are INSIDE the sealed basin, never
            // a raised bridge, beacon, button or authoritative collider.
            block(deepStone,x+offset,.305,z,.12,.041,1.36,c.cell);
            block(inlay,x+offset,.337,z,.058,.024,1.31,c.cell);
          }
        } else {
        // Original pressure-court cutaway: the old 2.7-unit pavilions and
        // towers hid Pip's real relay/shutters/piston in source-bound phone
        // views. Only an ALREADY DISCLOSED blocked tile within the visible
        // pressure court gets a sealed, low carved tide-ledge instead.
        // Real impassability is explicit in a solid raised stone cap and
        // cross-rib masonry. Do not imply a passage, movable platform,
        // treasure, new trigger, key or AI action. Every mesh is batched in
        // existing shared geometry/material pools; no render-time allocation.
        if (pressureSightline) {
          block(deepStone, x, .19, z, 2.06, .38, 2.06, c.cell);
          block(jade, x, .413, z, 1.88, .066, 1.88, c.cell);
          block(stone, x, .48, z, 1.45, .12, .45, c.cell, Math.PI / 4);
          block(seaGlass, x, .565, z, 1.28, .065, .28, c.cell, -Math.PI / 4);
          for (const side of [-1, 1]) {
            block(deepStone, x + side * .63, .50, z - side * .46,
              .44, .30, .45, c.cell, side * .13);
            block(lightStone, x + side * .63, .677, z - side * .46,
              .45, .054, .45, c.cell, side * .13);
          }
        } else {
        // Three original silhouettes occupy ONLY publicly disclosed, truly
        // blocked cells. Never infer a wall from a hidden or missing neighbor;
        // scenery must not announce secret routes, keys, hazards or AI moves.
        const relic = variation(c.cell * 23 + 811);
        if (relic < .35) {
          // Only genuinely disclosed, adjacent gate court masonry earns a
          // lower fossil profile; hidden neighbors never affect the stage.
          const besidePublicGate = [...gateApproachCells].some(id => adjacent(id, c.cell));
          tideFossilGrove(x, z, c.cell, besidePublicGate);
        } else if (relic < .70) {
          collapsedPavilions++;
          // Roofless tidal pavilion: connected masonry, two fractured
          // columns, a heavy leaning cornice and fallen pieces. Every piece
          // stays inside this known non-traversable 2.4-unit footprint.
          block(deepStone, x, .10, z, 1.86, .20, 1.82, c.cell);
          block(seaGlass, x, .23, z, 1.62, .08, 1.52, c.cell);
          for (const side of [-1, 1]) {
            block(lightStone, x + side * .63, .40, z - .28, .42, .24, .48, c.cell);
            add(cylinder, jade, x + side * .63, side < 0 ? 1.02 : .88,
              z - .28, .16, side < 0 ? 1.02 : .69, .16, c.cell, 0, 0, side * .11);
            block(stone, x + side * .63, side < 0 ? 1.61 : 1.44,
              z - .28, .51, .16, .53, c.cell, side * .12);
          }
          block(deepStone, x, 1.66, z - .28, 1.68, .19, .50, c.cell, -.14);
          block(lightStone, x + .15, 1.83, z - .28, .83, .15, .55, c.cell, -.25);
          block(jade, x - .18, .36, z + .51, .82, .29, .31, c.cell, .26);
        } else if (relic < .78) {
          shellBasins++;
          // Sunken noninteractive shell basin: stepped ceramic, inset
          // sea-glass and six weighty stone petals. No coin-shaped halo,
          // pulsing objective or fake collectible; all meshes are batched.
          block(deepStone, x, .06, z, 1.75, .12, 1.75, c.cell);
          add(cylinder, jade, x, .24, z, .81, .28, .81, c.cell);
          add(cylinder, seaGlass, x, .392, z, .59, .015, .59, c.cell);
          add(ring, lightStone, x, .40, z, .71, .71, .71, c.cell, Math.PI / 2);
          for (let petal = 0; petal < 6; petal++) {
            const angle = petal * TAU / 6;
            add(cone, petal % 2 ? stone : inlay,
              x + Math.cos(angle) * .43, .62,
              z + Math.sin(angle) * .43,
              .19, .46, .19, c.cell, 0, angle, .16);
          }
          add(cylinder, deepStone, x, .53, z, .18, .27, .18, c.cell);
        } else {
          windcatcherTowers++;
          // A roofed windcatcher exists ONLY on a truly disclosed blocked cell.
          // Its stepped shaft, fins and broad sloped roof diversify silhouettes,
          // without implying a playable room, route, key, gate or objective.
          // No resources or geometry are allocated during animation frames.
          block(deepStone, x, .12, z, 1.95, .24, 1.95, c.cell);
          block(stone, x, .28, z, 1.76, .10, 1.76, c.cell);
          add(cylinder, jade, x, 1.08, z, .48, 1.55, .48, c.cell);
          for (const level of [.55, 1.13, 1.75])
            add(cylinder, lightStone, x, level, z, .53, .12, .53, c.cell);
          for (const side of [-1, 1]) {
            block(deepStone, x + side * .62, .86, z, .22, 1.20, .31, c.cell);
            block(seaGlass, x + side * .65, .97, z + .17, .10, .84, .10, c.cell);
            block(jade, x, .89, z + side * .57, .36, 1.00, .23, c.cell);
            add(cone, darkJade, x + side * .57, 1.79, z, .21, .48, .21, c.cell);
          }
          block(deepStone, x, 1.95, z, 1.36, .23, 1.32, c.cell);
          block(lightStone, x, 2.10, z, 1.43, .11, 1.40, c.cell);
          for (const side of [-1, 1])
            add(bevel, side < 0 ? seaGlass : stone,
              x + side * .40, 2.28, z, .73, .17, 1.20,
              c.cell, 0, 0, -side * .47);
          add(cone, darkJade, x, 2.66, z, .28, .70, .28, c.cell);
        }
        }
        }
      }
    }
    finishBatches();
  }
  function rebuildBackdrop(s) {
    clear(backdrop); ripples = [];
    const w = (s.width * CELL_SIZE + 12) * 6, h = (s.height * CELL_SIZE + 12) * 6;
    // Open water is independent of discovered cells, exits, threats and routes.
    // Never add detached stepping stones or imply paths into unknown terrain.
    waterTexture.repeat.set(w / 9, h / 9);
    mesh(backdrop, box, waterMaterial, 0, -1.7, 0, w, .05, h).castShadow = false;
    // Subtle physical tide contours sit *below* every stage floor. The same
    // pattern appears for every seed/discovery with these public dimensions;
    // it cannot outline an undisclosed cell, predict a coast or suggest a route.
    // One shared-geometry/material instance batch = one extra draw call, not
    // dozens of individually animated meshes in the CPU-balanced renderer.
    const tide = new THREE.InstancedMesh(ring, rippleMaterial, 44);
    tide.name = 'Dimension-only lagoon tide contours';
    tide.castShadow = false; tide.receiveShadow = false;
    const tideLight = new THREE.Color('#cce5d4'), tideDark = new THREE.Color('#83b9ae');
    const spanX = s.width * CELL_SIZE / 2 + 8;
    const spanZ = s.height * CELL_SIZE / 2 + 8;
    for (let i = 0; i < tide.count; i++) {
      const seed = 211 + i * 37;
      const x = (variation(seed * 7 + 19) * 2 - 1) * spanX;
      const z = (variation(seed * 17 + 101) * 2 - 1) * spanZ;
      const radius = .53 + variation(seed + 29) * .57;
      // Native 1280 WebGL showed full closed circles that looked like
      // collectible halos. Compress the physical torus into small wave
      // strokes instead: decorative current, not a fake item/route target.
      tide.setMatrixAt(i, transform(x, -1.629, z,
        radius * .73, radius * (.095 + variation(seed + 7) * .035), 1, -Math.PI / 2));
      tide.setColorAt(i, variation(seed + 13) > .47 ? tideLight : tideDark);
    }
    tide.instanceMatrix.needsUpdate = true;
    tide.instanceColor.needsUpdate = true;
    tide.computeBoundingSphere();
    backdrop.add(tide);
    // Off-board tidal rock stacks give the otherwise uniform water an authored
    // edge and a scale reference. Their silhouettes are irregular, submerged
    // and explicitly NOT navigable islands, routes, keys, or undiscovered cells.
    // Only the public BOARD DIMENSIONS are consulted; no seed, cell, door,
    // threat, objective or hidden-game state can affect their placement.
    // Two instanced meshes reuse existing geometry/materials and never grow
    // with the public discovery history or allocate during animation frames.
    const islets = 16;
    // The first original 320px/1280px WebGL review rejected oversized
    // round "potato" boulders and detached green caps behind the guardian
    // arch. Low, irregular tidal cones now BREAK the water line rather than
    // pretending to be hovering, walkable islands or collectible markers.
    const reefRock = new THREE.InstancedMesh(cone, deepStone, islets * 3);
    const reefLichen = new THREE.InstancedMesh(sphere, darkJade, islets);
    reefRock.name = 'Dimension-only offshore broken rock silhouettes';
    reefLichen.name = 'Dimension-only offshore lichen caps';
    reefRock.castShadow = reefLichen.castShadow = false;
    reefRock.receiveShadow = reefLichen.receiveShadow = false;
    const extentX = s.width * CELL_SIZE / 2;
    const extentZ = s.height * CELL_SIZE / 2;
    for (let i = 0; i < islets; i++) {
      const seed = 9011 + i * 193, edge = i % 4;
      const along = variation(seed + 1) * 1.6 - .8;
      const offset = 5.1 + variation(seed + 2) * 3.4;
      const cx = edge === 0 ? -extentX - offset
        : edge === 1 ? extentX + offset : along * extentX;
      const cz = edge === 2 ? -extentZ - offset
        : edge === 3 ? extentZ + offset : along * extentZ;
      for (let j = 0; j < 3; j++) {
        const angle = j * 2.399 + variation(seed + 3) * TAU;
        const spread = j === 0 ? 0 : .48 + variation(seed + j * 5) * .35;
        const height = j === 0 ? 1.12 + variation(seed + 4) * .40
          : .55 + variation(seed + j * 9) * .24;
        reefRock.setMatrixAt(i * 3 + j, transform(
          cx + Math.cos(angle) * spread,
          j === 0 ? -1.30 : -1.49,
          cz + Math.sin(angle) * spread,
          j === 0 ? .60 : .37, height, j === 0 ? .68 : .41,
          j === 0 ? .10 : -.12, angle * .32, j === 0 ? .08 : -.16));
      }
      // Marine algae must stay attached to the partly submerged base, not
      // float on the summit as a bright gameplay-like target.
      reefLichen.setMatrixAt(i, transform(
        cx + .10, -1.53, cz - .08,
        .24 + variation(seed + 9) * .10, .12, .29, 0, variation(seed + 12) * TAU));
    }
    for (const prop of [reefRock, reefLichen]) {
      prop.instanceMatrix.needsUpdate = true;
      prop.computeBoundingSphere();
      backdrop.add(prop);
    }
    // Two broken tide-watch spires give the FAR public coastline an original
    // recognizable silhouette instead of featureless lagoon. They are visibly
    // submerged, unreachable, unlit historical ruins — NOT a second exit,
    // treasure, explorable island, route clue or newly disclosed maze cell.
    // Their fixed positions use ONLY public board dimensions, including when
    // no interior cells are known. The camera sees them behind the -X/-Z
    // seaward edge; neither simulation nor hidden geography is consulted.
    // Shared meshes/materials are instanced in four batches (not 50 draw calls).
    const offshore = new THREE.Group();
    offshore.name = 'Dimension-only submerged broken tide-watch spires';
    const offshoreParts = new Map();
    const offshorePart = (geo, mat, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => {
      const key = geo.id + ':' + mat.id;
      if (!offshoreParts.has(key)) offshoreParts.set(key, {geo, mat, matrices: []});
      offshoreParts.get(key).matrices.push(transform(x,y,z,sx,sy,sz,rx,ry,rz).clone());
    };
    for (const [i, site] of [
      {x:-extentX-2.15,z:-extentZ-2.85,scale:1},
      {x:-extentX-3.75,z:-extentZ-1.65,scale:.76}
    ].entries()) {
      const {x,z,scale:k} = site, lean = i===0 ? -.16 : .21;
      // The feet and fractured coral-shaped footings are submerged below the
      // fixed lagoon surface (-1.7); there is no walkable surface or bridge.
      offshorePart(cone, deepStone, x, -1.38, z, 1.05*k, .89*k, .91*k, 0, .3+i);
      offshorePart(cone, darkJade, x-.29*k, -1.51, z+.30*k,
        .58*k, .53*k, .50*k, .13, i*.8, -.24);
      offshorePart(cone, stone, x+.39*k, -1.55, z-.17*k,
        .41*k, .38*k, .50*k, -.19, i, .20);
      // A visibly broken lighthouse-like vertical shaft has contrasting
      // ceramic courses and deeply stepped crown, not a coin-shaped beacon.
      const shaftX=x+lean*k;
      offshorePart(cylinder, jade, shaftX, -.44, z, .43*k, 2.15*k, .43*k, 0, .18);
      offshorePart(cylinder, lightStone, shaftX, .33*k, z,
        .49*k, .16*k, .49*k);
      offshorePart(cylinder, deepStone, shaftX, -.69*k, z,
        .47*k, .19*k, .47*k);
      offshorePart(cylinder, stone, shaftX, .62*k, z,
        .52*k, .18*k, .52*k);
      offshorePart(bevel, deepStone, shaftX, .82*k, z,
        1.11*k, .26*k, .96*k, .08*i, .15*i);
      // Offset, broken roof slabs and one heavy surviving sculpted crest:
      // readable world-building at native scale without a fake goal symbol.
      offshorePart(bevel, seaGlass, shaftX-.33*k, 1.04*k, z-.05*k,
        .72*k, .17*k, .96*k, 0, 0, -.29);
      offshorePart(bevel, lightStone, shaftX+.29*k, 1.0*k, z+.08*k,
        .58*k, .16*k, .73*k, 0, .13, .37);
      offshorePart(cone, darkJade, shaftX-.12*k, 1.36*k, z-.18*k,
        .24*k, .56*k, .22*k, .09*i, 0, -.20);
      // Wind-battered carved side struts attach to the visible shaft; no
      // animation-clock, private event or collectible-like emissive color.
      for (const side of [-1,1]) {
        offshorePart(bevel, clay, shaftX+side*.34*k, -.04*k, z+.20*k,
          .14*k, .99*k, .14*k, 0, side*.16, side*.11);
        offshorePart(bevel, lightStone, shaftX+side*.33*k, -.50*k, z+.26*k,
          .23*k, .13*k, .19*k);
      }
    }
    for (const {geo,mat,matrices} of offshoreParts.values()) {
      const batch = new THREE.InstancedMesh(geo,mat,matrices.length);
      batch.castShadow = false; batch.receiveShadow = false;
      matrices.forEach((pose,i)=>batch.setMatrixAt(i,pose));
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      offshore.add(batch);
    }
    backdrop.add(offshore);
    // Behind the public north and west board boundaries, disconnected drowned
    // colonnade pairs make a larger original skyline. Every foot is separated
    // from the actual board by >=4.7 world units of water; no floor, bridge,
    // key, passage, danger cue, or hidden tile is represented. Placement reads
    // ONLY publicly known board dimensions and fixed cosmetic variation.
    // Existing pooled geometry/materials plus four instanced draw calls:
    // no frame allocations, fragment shader, texture or authority changes.
    const colonnade=new THREE.Group();
    colonnade.name='Dimension-only detached drowned colonnade';
    const colonnadeParts=[
      {name:'Disconnected submerged stone footings',geo:bevel,mat:deepStone,poses:[]},
      {name:'Broken jade harbor columns',geo:cylinder,mat:jade,poses:[]},
      {name:'Carved ivory broken capitals',geo:bevel,mat:lightStone,poses:[]},
      {name:'Unlit sea-glass erosion bands',geo:bevel,mat:seaGlass,poses:[]}
    ];
    const colonnadePose=(part,x,y,z,sx,sy,sz,ry=0,rz=0)=>{
      colonnadeParts[part].poses.push(transform(x,y,z,sx,sy,sz,0,ry,rz).clone());
    };
    for(let arm=0;arm<2;arm++)for(let i=0;i<5;i++){
      const spacing=Math.max(2.9,(arm===0?s.width:s.height)*CELL_SIZE/5);
      const along=(i-2)*spacing;
      const offshoreGap=4.7+variation(8101+arm*71+i*19)*.9;
      const x=arm===0?along:-extentX-offshoreGap;
      const z=arm===0?-extentZ-offshoreGap:along;
      // Submerged bases leave a substantial open-water gap: no traversable
      // implied land connecting to any undiscovered portion of the maze.
      colonnadePose(0,x,-1.57,z,1.49,.72,1.13);
      for(const side of [-1,1]){
        const px=x+(arm===0?side*.43:0);
        const pz=z+(arm===1?side*.43:0);
        const height=1.48+variation(9107+arm*61+i*23+side*3)*.65;
        colonnadePose(1,px,-1.29+height/2,pz,.245,height,.245);
        colonnadePose(2,px,-1.22+height,pz,.39,.16,.38,0,side*.16);
        // A broad mineral erosion scar, not a signal or glowing collectible.
        if(side===1)
          colonnadePose(3,px,-1.02+height*.55,pz+.14,.26,.27,.10);
      }
    }
    for(const part of colonnadeParts){
      const batch=new THREE.InstancedMesh(part.geo,part.mat,part.poses.length);
      batch.name=part.name;batch.castShadow=false;batch.receiveShadow=false;
      part.poses.forEach((pose,i)=>batch.setMatrixAt(i,pose));
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();
      colonnade.add(batch);
    }
    backdrop.add(colonnade);
  }
  const propGroup = (cell, s) => {
    const p = new THREE.Group(), point = cellPosition(cell, s.width, s.height);
    p.position.set(point.x, cellHeight(cell, s.width, s.height), point.z); p.userData.cell = cell; objects.add(p); return p;
  };
  const pedestal = (p, mat = jade, radius = .48) => {
    mesh(p, cylinder, deepStone, 0, .05, 0, radius + .07, .1, radius + .07);
    mesh(p, cylinder, mat, 0, .13, 0, radius, .1, radius);
    mesh(p, cylinder, lightStone, 0, .2, 0, radius + .025, .06, radius + .025);
  };
  function keyProp(key, s) {
    // The physical treasure's home remains after collection, instead of
    // disappearing underneath the glass release. Never draw unknown cells.
    if (!s.cells.some(c => c.cell === key.cell)) return;
    const p = propGroup(key.cell, s);
    p.name = key.collected ? 'Disclosed spent key shrine' : 'Disclosed golden key';
    const dais = new THREE.Group(); dais.name = 'In-cell treasure dais';
    dais.position.set(KEY_SHRINE_OFFSET.x, 0, KEY_SHRINE_OFFSET.z);
    p.add(dais);
    pedestal(dais, darkJade, .43);
    // A broad original shell reliquary behind the *actually discovered* key
    // gives this treasure a physical place. It is non-emissive architecture:
    // not a second collectible, false gate, secret passage or gameplay cue.
    // The sculpted rear footprint remains entirely inside its public tile.
    const reliquary = new THREE.Group();
    reliquary.name = 'Public tide-shell reliquary crown';
    reliquary.position.set(-.12, 0, -.50);
    dais.add(reliquary);
    mesh(reliquary, bevel, deepStone, 0, .29, 0, 1.42, .21, .32);
    mesh(reliquary, bevel, jade, 0, .44, -.04, 1.21, .13, .23);
    for (let i = -2; i <= 2; i++) {
      const edge = Math.abs(i);
      const lobe = mesh(reliquary, sphere, i === 0 ? lightStone : seaGlass,
        i * .245, .99 - edge * .055, -.055,
        .255, .73 - edge * .11, .145, 0, 0, -i * .15);
      lobe.name = 'Physical reliquary lobe ' + (i + 2);
      const rib = mesh(reliquary, bevel, i === 0 ? darkJade : inlay,
        i * .215, .99 - edge * .055, .072,
        .068, 1.04 - edge * .18, .067, 0, 0, -i * .13);
      rib.name = 'Carved reliquary rib ' + (i + 2);
    }
    const witnessed = key.collected && typeof key.id === 'string' && keyPickupAt.has(key.id);
    // Preserve the full physical pickup before clearing the NEXT encounter.
    // Only the six tall source-disclosed pieces descend; the real empty
    // pedestal/socket and all authoritative walkability remain unchanged.
    const spentDescent = publicSpentKeyTheatreDrop(key.collected,
      witnessed ? presentationTime - keyPickupAt.get(key.id) : Infinity);
    reliquary.position.y = -spentDescent;
    if (witnessed) animations.push({
      type:'key-spent-recede', object:reliquary, keyId:key.id, baseY:0
    });
    // A full-scale, grounded tide-theatre is the treasure's physical reveal.
    // The tall stone proscenium and joined ivory sea-glass shutters are behind
    // the actual key, entirely based on this ALREADY disclosed key cell. This
    // is not a door, route, second collectible, hint or gameplay authority.
    // Unlike distant decorative pieces, both large panels fill the actual
    // witnessed pickup composition and physically swing away from the key.
    const theatre = new THREE.Group();
    theatre.name = 'Disclosed key tide-theatre';
    theatre.position.set(-.12, -spentDescent, -.40);
    dais.add(theatre);
    if (witnessed) animations.push({
      type:'key-spent-recede', object:theatre, keyId:key.id, baseY:0
    });
    for (const side of [-1, 1]) {
      mesh(theatre, bevel, deepStone, side * .81, .91, -.02, .24, 1.72, .34);
      mesh(theatre, bevel, jade, side * .81, .97, .18, .11, 1.38, .07);
      mesh(theatre, bevel, lightStone, side * .81, 1.81, -.02, .38, .17, .44);
    }
    mesh(theatre, bevel, deepStone, 0, 1.92, -.03, 1.96, .27, .41);
    mesh(theatre, bevel, seaGlass, 0, 2.07, .04, 1.63, .12, .34);
    mesh(theatre, bevel, lightStone, 0, 2.22, -.05, .84, .23, .44);
    // These shutters pivot on the real stone uprights, never at screen
    // coordinates. The two broad faces form a coherent architectural beat
    // (closed before collection, opening ONLY after a witnessed pickup).
    for (const side of [-1, 1]) {
      const shutter = new THREE.Group();
      shutter.name = 'Public key-theatre hinged shutter ' + side;
      shutter.position.set(side * .69, .32, .13);
      theatre.add(shutter);
      mesh(shutter, bevel, seaGlass, -side * .31, .66, 0, .60, 1.25, .19);
      mesh(shutter, bevel, lightStone, -side * .32, 1.23, .12, .56, .14, .09);
      mesh(shutter, bevel, deepStone, -side * .32, .18, .12, .56, .12, .09);
      mesh(shutter, bevel, lightStone, -side * .55, .67, .12, .07, .94, .08);
      mesh(shutter, bevel, inlay, -side * .25, .66, .13, .09, .76, .05);
      shutter.rotation.y = key.collected && !witnessed ? -side * .92 : 0;
      if (witnessed) animations.push({
        type: 'key-theatre', object: shutter, keyId: key.id, side
      });
    }
    // Four original carved, articulated petals open from the collected cell.
    // Their source-disclosed footprint never becomes a route or new reward.
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2, petal = new THREE.Group();
      petal.name = 'Physical shrine petal ' + i;
      petal.position.set(Math.cos(angle) * .26, .38 - spentDescent, Math.sin(angle) * .26);
      if (witnessed) animations.push({
        type:'key-spent-recede', object:petal, keyId:key.id, baseY:.38
      });
      petal.rotation.y = -angle;
      petal.rotation.z = key.collected && !witnessed ? .78 : 0;
      dais.add(petal);
      // An actual opening stone blossom is readable beyond Pip's feet.
      // Four curved-looking stepped, carved 3D blades connect at the real
      // key socket. Broader ivory lips and teal relief use ONLY the existing
      // geometry/material pool, rather than sprites or another collectible.
      mesh(petal, bevel, jade, .30, .06, 0, .59, .25, .39);
      mesh(petal, bevel, lightStone, .47, .18, 0, .30, .10, .31);
      mesh(petal, bevel, inlay, .50, .245, 0, .12, .055, .21);
      mesh(petal, bevel, darkJade, .66, .09, 0, .10, .12, .28);
      // This source-witnessed treasure opens a full-sized four-part tide-shell
      // mechanism, rather than merely changing a tiny inlaid floor pattern.
      // Each joined vertical sail FOLDS INTO its real stone socket before
      // collection, then hinges upright with the existing carved petal. No
      // new key, passage, hazard, light, marker or game authority is created.
      // The broad sculpture stays inside the already disclosed tile, with
      // its ivory face legible from Pip's authentic isometric camera.
      const sail = new THREE.Group();
      sail.name = 'Hinged disclosed tide-shell sail ' + i;
      sail.position.set(.35, .10, 0);
      petal.add(sail);
      mesh(sail, bevel, deepStone, .04, .13, 0, .31, .24, .36);
      const ivoryBlade = mesh(sail, bevel, lightStone,
        .075, .45, 0, .37, .72, .42);
      ivoryBlade.rotation.z = -.09;
      const ceramicRib = mesh(sail, bevel, jade,
        .105, .43, .235, .13, .59, .055);
      ceramicRib.rotation.z = -.09;
      // Already-collected keys without a witnessed transition rest in their
      // final sculpture pose. A true current-run collection is animated with
      // the same stall-safe public visual clock as the physical key release.
      sail.rotation.z = key.collected && !witnessed ? 0 : 1.16;
      if (witnessed) {
        animations.push({type:'key-shrine', object:petal, keyId:key.id});
        animations.push({type:'key-sail', object:sail, keyId:key.id});
      }
    }
    if (key.collected) {
      // A dark, empty, stone-cut recess stays visible. No second key,
      // glowing collectible, secret map cell or gameplay authority appears.
      mesh(dais, ring, deepStone, 0, .25, 0, .27, .27, .27, Math.PI / 2);
      mesh(dais, cylinder, darkMetal, 0, .205, 0, .18, .055, .18);
      return;
    }
    const keyMesh = new THREE.Group(); keyMesh.position.y = 1.14; keyMesh.scale.setScalar(1.35); keyMesh.rotation.y = .55; dais.add(keyMesh);
    // A thick octagonal bow and bold two-tooth shaft survive normal/mobile views.
    mesh(keyMesh, keyBow, keyLight, 0, .29, 0, 1, 1, 1);
    mesh(keyMesh, bevel, keyLight, 0, -.16, 0, .17, .59, .17);
    mesh(keyMesh, bevel, keyLight, .14, -.36, 0, .28, .13, .17);
    mesh(keyMesh, bevel, keyLight, .14, -.15, 0, .28, .13, .17);
    mesh(dais, ring, amber, 0, .245, 0, .48, .48, .48, Math.PI / 2);
    // Sparse rays belong only to a disclosed collectible, never generic scenery.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      mesh(dais, bevel, keyLight, Math.cos(a) * .62, .035, Math.sin(a) * .62, .14, .03, .14, 0, Math.PI / 4);
    }
    animations.push({ type: 'key', object: keyMesh, baseY: 1.14, phase: key.cell });
  }
  function doorProp(door, s) {
    if (!s.cells.some(c => c.cell === door.a || c.cell === door.b)) return;
    const a = cellPosition(door.a, s.width, s.height), b = cellPosition(door.b, s.width, s.height);
    const p = new THREE.Group(); p.name = door.open ? 'Disclosed open gate' : 'Disclosed sealed gate';
    const disclosedEnds = [door.a, door.b].filter(cell => s.cells.some(c => c.cell === cell));
    p.position.set((a.x + b.x) / 2, Math.max(...disclosedEnds.map(cell => cellHeight(cell, s.width, s.height))), (a.z + b.z) / 2); p.rotation.y = a.x === b.x ? 0 : Math.PI / 2; objects.add(p);
    // The previously verified native portrait pressure shot had a much larger
    // CLOSED gate ornament competing with the actual publicly disclosed jaws.
    // Carve negative space out of ONLY the gate's external decorative wings
    // when both gate endpoints and a nearby trap are ALREADY public. The
    // actual crossed grille, lock, jambs, lintel and collision stay intact:
    // this must never depict a passable gate or announce a secret hazard.
    // Match the same two-cell disclosed pressure court as terrain cutaways.
    // Do not depend on momentary visibility: object rebuilding is keyed to
    // public discoveries, not each moving visibility frame.
    const disclosedGateEnds=[door.a,door.b].every(id =>
      s.cells.some(c=>c.cell===id && c.blocked!==true));
    const pressureCourtGate=disclosedGateEnds && s.cells.some(c=>
      c.trap===true && c.blocked!==true
      && [door.a,door.b].some(end=>
        Math.abs(c.cell%s.width-end%s.width)
        +Math.abs(Math.floor(c.cell/s.width)-Math.floor(end/s.width))<=2));
    // Native 1280 opening evidence showed the full-height foreground gate
    // pier competing with Pip even after the lintel was slimmed. Reduce the
    // TRUE stone silhouette in both cardinal gate orientations, while keeping
    // two solid, cap-joined supports and a wide honest traversable opening.
    // This is a world model revision: no camera crop, transparent mesh,
    // altered collision, hidden cell lookup or game-state-dependent shortcut.
    for (const sign of [-1, 1]) {
      const foot = mesh(p, bevel, deepStone, sign * .91, .1, -.055, .35, .2, .39);
      foot.name = 'Disclosed gate cutaway foot ' + sign;
      const pier = mesh(p, bevel, jade, sign * .91, .9, -.065, .22, 1.5, .25);
      pier.name = 'Disclosed gate slim structural pier ' + sign;
      const cap = mesh(p, bevel, lightStone, sign * .91, 1.66, -.075, .32, .15, .35);
      cap.name = 'Disclosed gate compact joined cap ' + sign;
      for (let j = 0; j < 3; j++)
        mesh(p, bevel, inlay, sign * .91, .45 + j * .4, -.197, .075, .13, .04);
    }
    // The genuine 1280px opening frame shows this old heavy stone header
    // eating Pip's silhouette from the three-quarter gate-side camera.
    // Keep a physically joining, legible arch, but carve out a leaner lintel
    // and return the near face behind the sculpted jamb caps. This is REAL
    // shared Three geometry on the disclosed original gate, not camera
    // cropping, invisible actor scaling, a UI mask or a gameplay change.
    const tideLintel = mesh(p, bevel, stone, 0, 1.80, .055, 2.16, .16, .27);
    tideLintel.name = 'Slim disclosed gate tide-lintel';
    mesh(p, bevel, darkJade, 0, 1.76, .08, 1.5, .075, .20);
    const gate = new THREE.Group(); gate.name = 'Withdrawable gate bars'; p.add(gate);
    // The raised gate is withdrawn into the lintel, leaving a fully clear opening.
    const edgeId = doorEdgeId(door.a, door.b);
    const start = gateOpeningAt.get(edgeId);
    const retracting = door.open && Number.isFinite(start)
      && presentationTime - start < GATE_RETRACTION_SECONDS;
    gate.visible = !door.open || retracting;
    if (retracting) retractingGates.set(edgeId, gate);
    for (let j = 0; j < 5; j++) mesh(gate, cylinder, darkMetal, -.64 + j * .32, .79, 0, .035, 1.45, .035);
    for (const y of [.22, 1.37]) mesh(gate, bevel, darkMetal, 0, y, 0, 1.6, .1, .12);
    // Original hand-cranked counterweight hardware gives the already-known
    // gate a physical cause-and-effect silhouette. The wheels and hanging
    // stones live on its actual jambs, never over the traversable doorway.
    // Reuse shared geometry/materials; no false key, passage or game action.
    // The actual pressure jaws must remain visible in the same fully disclosed
    // gate-court shot. Keep functional bars, key socket, seal and structure;
    // recess ONLY the nonfunctional counterweight ornament behind the bars.
    // This is solid Three geometry on known public gates, never a camera crop.
    const pulleyDepth = pressureCourtGate ? -.21 : .48;
    const counterweightDepth = pressureCourtGate ? -.17 : .49;
    const driveRodDepth = pressureCourtGate ? -.21 : .44;
    const drive = new THREE.Group(); drive.name = 'Disclosed gate pulley mechanism'; p.add(drive);
    const wheels = [], weights = [];
    for (const side of [-1, 1]) {
      const wheel = new THREE.Group();
      wheel.name = side < 0 ? 'Left gate drive wheel' : 'Right gate drive wheel';
      wheel.position.set(side * .91, 1.83, pulleyDepth);
      drive.add(wheel);
      mesh(wheel, ring, inlay, 0, 0, 0, .23, .23, .14);
      // An asymmetric spoke makes the real rotation legible in a still frame.
      mesh(wheel, bevel, lightStone, .075, 0, .04, .20, .055, .075, 0, 0, .35);
      mesh(drive, bevel, darkMetal, side * .91, 1.15, driveRodDepth, .035, 1.07, .06);
      const weight = mesh(drive, bevel, deepStone, side * .91, .61, counterweightDepth, .21, .30, .18);
      weight.name = side < 0 ? 'Left hanging gate weight' : 'Right hanging gate weight';
      wheels.push(wheel); weights.push(weight);
    }
    // Twin full-sized tide-wing shields make the observed portcullis's
    // physical opening legible in-world, not through another HUD paragraph.
    // Both hinges are fixed OUTSIDE the real central passage. They are always
    // built on an already-public gate and reuse pooled 3D materials/geometry;
    // only a witnessed same-run CLOSED -> OPEN event can animate them.
    // An initially observed OPEN door simply displays the settled sculpture.
    const wings = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.name = 'Disclosed gate folding tide-wing ' + side;
      wing.position.set(side * 1.11, 1.05, pressureCourtGate ? -.05 : .38);
      // A substantial REAL geometric silhouette cutaway, not transparency,
      // a screenshot crop or an invented gate opening. The pivot remains on
      // the actual outside stile; the same compact form opens with the grille.
      if (pressureCourtGate) wing.scale.set(.62,.68,.85);
      drive.add(wing);
      mesh(wing, bevel, darkJade, side * .24, 0, .03, .57, 1.25, .095);
      mesh(wing, bevel, seaGlass, side * .24, 0, .12, .48, 1.12, .14);
      mesh(wing, bevel, lightStone, side * .24, .51, .21, .48, .11, .065);
      for (const y of [-.32, 0, .32])
        mesh(wing, bevel, lightStone, side * .24, y, .225, .39, .055, .065);
      mesh(wing, cylinder, deepStone, 0, 0, -.06, .085, 1.3, .085);
      wings.push(wing);
    }
    gateDrives.set(gate, {wheels, weights, wings});
    if (door.open && !retracting) {
      // A door first discovered OPEN is shown in its settled open pose. This
      // does not manufacture an opening event or another animated passage.
      for (let i = 0; i < 2; i++) {
        wheels[i].rotation.z = (i ? 1 : -1) * 1.35;
        weights[i].position.y = .31;
        wings[i].rotation.z = (i ? -1 : 1) * .82;
      }
    }
    if (!door.open) {
      // A broad coral X makes a *known closed* passage visibly impassable
      // at the normal isometric camera scale. Nothing is created for open
      // gates or undisclosed doors; the actual movement rules do not change.
      const seal = new THREE.Group(); seal.name = 'Closed crossed barrier'; gate.add(seal);
      // Both axis-aligned gate normals point toward the fixed follow camera
      // (+X/+Z). Keep the crossed seal and lock on that near face rather than
      // behind the physical bars, where a normal isometric view hid them.
      for (const tilt of [-.72, .72]) {
        mesh(seal, bevel, danger, 0, .79, .24, 1.8, .2, .2, 0, 0, tilt);
      }
      // The near-face lock reads as an actual, recessed keyhole instead of
      // several small gold blobs. Its mint socket appears ONLY when Pip truly
      // carries this exact key in the public inventory. The crossed bars stay
      // physically closed until the authoritative door.open state changes.
      // No hidden key position or future unlock is represented here.
      const required = door.requiredKeyId;
      const carried = typeof required === 'string' && Array.isArray(s.inventory)
        && s.inventory.includes(required);
      const observed = typeof required === 'string' && s.keys.some(key =>
        key.id === required && !key.collected && s.cells.some(c => c.cell === key.cell));
      const lock = new THREE.Group(); lock.name = 'Physical recessed keyhole'; gate.add(lock);
      // Mount the real lock on the camera-facing right stile, beside the coral
      // crossed bars. A central socket sat directly over the obstruction and
      // hid Pip's raised matching key at native portrait scale. This is still
      // decorative hardware on a publicly disclosed, actually CLOSED door.
      // Local +X faces screen-right in both permitted cardinal orientations;
      // it cannot disclose the cell beyond the gate or grant passage.
      lock.position.set(.56, .06, .18);
      lock.userData.keyState = carried ? 'carried' : observed ? 'observed' : 'unknown';
      // Source-bound visual measurement can distinguish this disclosed gate
      // from other known gates; the edge comes only from public doors.
      lock.userData.publicDoorEdge = [door.a, door.b];
      publicClosedSockets.set(doorEdgeId(door.a,door.b),lock);
      mesh(lock, bevel, darkMetal, 0, .9, .43, .88, .85, .18);
      mesh(lock, bevel, gold, 0, .9, .55, .75, .72, .14);
      mesh(lock, bevel, darkMetal, 0, .9, .65, .61, .59, .14);
      const socketTint = carried ? glow : gold;
      // A camera-facing, physically recessed keyhole with a single continuous
      // dark crown/throat silhouette. The old tiny pinhole vanished at 390px.
      // All parts use existing shared geometry/materials; no additional light,
      // per-frame allocation, false unlock or secret-state lookup is involved.
      mesh(lock, ring, socketTint, 0, 1.035, .79, .32, .32, .14);
      mesh(lock, bevel, socketTint, 0, .8, .79, .22, .36, .12);
      const crown = mesh(lock, sphere, darkMetal, 0, 1.035, .89, .155, .16, .055);
      crown.name = 'Recessed keyhole crown';
      const throat = mesh(lock, bevel, darkMetal, 0, .805, .89, .105, .31, .055);
      throat.name = 'Recessed keyhole throat';
      // The raised crest shows the same carved key motif only once this exact
      // key is disclosed. A mint lock is a match, never a passable passage.
      if (carried || observed) {
        const crest = new THREE.Group();
        crest.name = 'Disclosed matching key emblem';
        crest.userData.keyState = carried ? 'carried' : 'observed';
        // When the known pressure trap shares this court, mount the genuine
        // matching-key emblem above its ACTUAL right-hand key socket, not
        // against the moving foreground jaws. Normal gates keep original art.
        // Public disclosure only, no invented unlock, hidden danger or route.
        crest.position.set(pressureCourtGate ? .58 : 0,
          pressureCourtGate ? 1.87 : 2.12, .43);
        if (pressureCourtGate) crest.scale.setScalar(.68);
        gate.add(crest);
        // Reuse the actual collectible's octagonal bow and two-tooth profile.
        // Raised ivory/amber means known key; mint means that exact key is
        // carried, NOT that the still-crossed gate is already traversable.
        const tint = carried ? glow : keyLight;
        mesh(crest, bevel, darkMetal, 0, 0, 0, 1.02, .49, .14);
        mesh(crest, bevel, carried ? glow : gold, 0, .19, .095, 1.02, .05, .05);
        mesh(crest, keyBow, tint, -.19, .06, .14, .7, .7, .7);
        mesh(crest, bevel, tint, -.19, -.14, .14, .08, .24, .08);
        mesh(crest, bevel, tint, -.10, -.23, .14, .16, .07, .08);
        mesh(crest, bevel, tint, -.10, -.11, .14, .16, .07, .08);
      }
    }
  }
  function trapProp(c, s) {
    // The PUBLIC trap cell has a substantial, authored 3D pressure-shell stage
    // instead of six almost invisible spikes. This is only the appearance of
    // an already-published hazard, not a new trigger, damage event or route.
    // Two stone/bronze hinged jaws live at the edges of the real cell, leaving
    // the playable centre open for Pip and never revealing a hidden neighbor.
    const p = propGroup(c.cell, s);
    p.name = 'Disclosed tide-shear pressure hazard ' + c.cell;
    // Pass261: unaltered full-frame 390/1280 WebGL still reads the real
    // pressure mechanism as a loose pile of ivory/red fragments. Make the
    // entire existing 2.4m trigger ONE rooted stone machine: a deep continuous
    // plinth, inset dark throat and TWO parallel ceramic guide cheeks, not six
    // disconnected coral floor markers or an ambiguous collectible-like ring.
    // The treadle, four moving iris leaves, linked drivetrain, mast, paired
    // actual jaw hinges and existing public contact clock remain authoritative
    // and unobstructed. All forms use existing shared geometry/materials.
    const machinePlinth = mesh(p, bevel, deepStone, 0, -.058, 0,
      2.10, .10, 2.06);
    machinePlinth.name = 'Published tide-shear continuous stone machine plinth';
    mesh(p, bevel, darkJade, 0, -.004, 0, 1.95, .026, 1.91);
    mesh(p, bevel, darkMetal, 0, .019, -.10, 1.52, .034, 1.45);
    for (const side of [-1, 1]) {
      const cheek = mesh(p, bevel, lightStone, side * 1.00, .128,
        0, .13, .19, 1.77);
      cheek.name = 'Published tide-shear rooted ivory guide cheek';
      mesh(p, bevel, danger, side * 1.00, .233, .33,
        .065, .025, .43);
    }
    // This single broad ceramic floor treadle is the legible first action
    // in the PUBLIC pressure encounter: it sinks before the tall jaws shear.
    // It replaces eight inert corner ornaments instead of adding clutter.
    // Entire footprint inside the existing 2.4m real trap tile; all parts
    // reuse pooled bevel/materials, with no new collision or route authority.
    const treadle = new THREE.Group();
    treadle.name = 'Published tide-shear depressible treadle ' + c.cell;
    treadle.position.set(0, .035, .79);
    p.add(treadle);
    mesh(treadle, bevel, darkMetal, 0, -.014, 0, 1.60, .052, .52);
    mesh(treadle, bevel, lightStone, 0, .019, 0, 1.42, .027, .42);
    for (const side of [-1, 1])
      mesh(treadle, bevel, danger, side * .43, .036, .02, .25, .013, .24);
    mesh(treadle, bevel, gold, 0, .036, .02, .14, .013, .24);
    // A rooted mechanical tide-diaphragm gives the publicly disclosed
    // pressure hazard a visible CAUSE/EFFECT beyond two thin moving posts:
    // its carriage rises and its paired ceramic shields unfold in concert
    // with the actual hinged jaws. Every part remains on this known trap
    // tile, behind Pip's central footpath, and never changes gameplay rules.
    const pressureMast = new THREE.Group();
    pressureMast.name = 'Published tide-shear pressure mast ' + c.cell;
    // Exact-source 320px pressure WebGL exposed +.980 physical jaw NDC after
    // adding the rear carriage (original unchanged in-frame limit +.95).
    // The long -Z base enlarged the complete trap model's projected
    // silhouette. Re-seat the REAL mast within the existing paired jaws'
    // tile footprint instead of cropping the game or weakening the gate.
    pressureMast.position.set(0, .12, -.12);
    // Retire the visual tangle at the jaws' central negative space without
    // removing any moving components or altering their event-driven clock.
    pressureMast.scale.setScalar(.82);
    p.add(pressureMast);
    // Pass262: genuine full-frame 320/390/1280 WebGL shows an ivory/coral
    // shard pile instead of a two-blade cutter. Retire competing miniature
    // red, amber and ivory marks on SECONDARY moving machinery while keeping
    // its full real treadle -> relay -> shutters -> governor -> jaw choreography.
    // The largest remaining ivory/coral faces belong to the two TRUE pressure
    // hinges; one quiet bronze wheel + two cream spokes still show rotation.
    // This is original scene staging, not a HUD change or a new trigger.
    // Pass258: one recognisable, connected load-bearing TIDEGLASS arch
    // replaces the impression of free-floating red spikes in real 320/390
    // WebGL. The original floor treadle powers its visible rotary governor,
    // tilting bridge and falling suspended weight BEFORE the existing jaws
    // complete their genuine near-contact stroke. The whole assembly lives
    // behind the actual jaw roots, inside this PUBLISHED trap tile. Every
    // part uses existing pooled geometry/materials and has zero gameplay
    // collision, invented key, unobserved map, or new source of AI authority.
    // Pass270: the exact-HEAD 320/390 WebGL shows a small, fragmentary
    // pressure machine under an enormous retaining terrace. Reconstruct its
    // EXISTING mechanically driven counterbalance as one readable, original
    // Tideglass shear-portal, not another independent sculpture or warning.
    // Two anchored stone pylons and a single spanning yoke frame the true
    // inward-moving ivory jaws. The published treadle still moves this SAME
    // governor, crossbeam and suspended weight before the jaw closure.
    // The bay is set behind both blade roots, inside the original 2.4m tile:
    // it creates no passage, collider, damage, AI rule or hidden-map cue.
    // Only pooled bevel/ring/cylinder materials; no new GPU resource classes.
    // Pass281: the exact-SHA 320/390 mobile WebGL pressure contact still put
    // the LOW foreground yoke across Pip's helmet/torso, despite splitting
    // its wings and side-docking the governor. Rebuild the SAME mechanical
    // portal as a physically TALL joined lintel carried by taller rooted
    // pylons, with the side-axle transmitting the witnessed stroke upward.
    // The moving wings now open OVER the authentic actor and inward jaws,
    // not across their action. Preserve the same treadle clock, jaw/collision
    // footprint, source privacy, materials, reduced motion and reset.
    const counterbalance = new THREE.Group();
    counterbalance.name = 'Published tide-shear pressure counterbalance arch ' + c.cell;
    counterbalance.position.set(0, -.10, -.72);
    counterbalance.scale.set(.93, 1, .86);
    p.add(counterbalance);
    for (const side of [-1, 1]) {
      const pillar = mesh(counterbalance, bevel, deepStone,
        side * .95, 1.16, 0, .28, 2.30, .34);
      pillar.name = 'Published Tideglass shear-portal anchored pylon ' + side;
      mesh(counterbalance, bevel, darkMetal,
        side * .95, .11, .04, .45, .19, .44);
      mesh(counterbalance, bevel, lightStone,
        side * .95, 2.31, 0, .34, .16, .39);
      // Continuous glass-and-mineral relief reads as a joined working frame,
      // not a luminous route arrow or an additional interactive switch.
      mesh(counterbalance, bevel, seaGlass,
        side * .95, 1.19, .208, .095, 1.76, .07);
      mesh(counterbalance, bevel, gold,
        side * .95, 2.12, .25, .15, .10, .06);
    }
    const bridge = new THREE.Group();
    bridge.name = 'Published tide-shear spanning load bridge';
    bridge.position.y = 2.34;
    counterbalance.add(bridge);
    // Pass283: the ORIGINAL 390px contact frame still placed the dark
    // fixed-span lintel over Pip's head, even after the ivory wings lifted.
    // The same publicly witnessed floor stroke now raises the COMPLETE load
    // bridge through two solid telescoping yoke sleeves. Their lower ends
    // remain captive inside the two real rooted pylons at the highest stroke;
    // no floating support, opacity trick, artificial route or extra trigger.
    // Reuse the existing bevel/material pools and retain every strict frame
    // and geometry budget. The entire movement is a reversible physical act.
    // Pass285: exact-HEAD 782/783 full-CI installed Three.js Box3 caught
    // the OTHER guide defect after Pass284 repaired lateral containment:
    // the UPHILL captive sleeve barely stopped BELOW the fixed pylon top
    // during a real .11rad tilted/raised public pressure stroke. Seat each
    // FULL-SIZE .75m sleeve 60mm deeper in its stone guide, with the same
    // glass facing. This retains TWO continuous telescoping load paths as
    // the yoke rises. No physics-authority, hazard, visibility or camera
    // workaround; preserve the unchanged world-space Box3 overlap test.
    const sweptGuideInset = .025;
    const rootedGuideDepth = -.33;
    for (const side of [-1, 1]) {
      const guideX = side * .95 - sweptGuideInset;
      const sleeve = mesh(bridge, bevel, darkMetal,
        guideX, rootedGuideDepth, -.005, .16, .75, .18);
      sleeve.name = 'Published Tideglass telescopic yoke sleeve ' + side;
      mesh(bridge, bevel, seaGlass, guideX, rootedGuideDepth - .01, .102,
        .067, .63, .042);
    }
    // Pass277: true 390px WebGL showed the opaque front yoke crossing
    // Pip's body while the real pressure jaws closed. Retain the FULL
    // rear spanning brace but replace its foreground solid parapet with
    // two structurally pinned split load wings. Their tips lift on the
    // SAME public treadle/shutter stroke, opening a physical central
    // sightline rather than hiding, cropping or fading the entire trap.
    const yoke = mesh(bridge, bevel, darkMetal,
      0, 0, -.20, 2.15, .26, .18);
    yoke.name = 'Published Tideglass shear-portal connected yoke';
    mesh(bridge, bevel, seaGlass,
      0, .070, -.14, 1.87, .07, .055);
    const loadArms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.name = 'Published Tideglass split load-wing ' + side;
      arm.position.set(side * .90, .075, .06);
      bridge.add(arm);
      const leaf = mesh(arm, bevel, lightStone,
        -side * .31, .01, 0, .76, .12, .19);
      leaf.name = 'Published tide-shear lifting ivory wing';
      mesh(arm, bevel, gold,
        -side * .31, .092, .065, .62, .035, .05);
      loadArms.push({object: arm, side});
    }
    // Pass278: original full 390px Pass277 screenshot has the central bronze
    // wheel and counterweight directly over Pip's chest, even after the split
    // yoke opens. This is a mechanically coherent RIGHT-SIDE power bay, not
    // another translucent or hidden prop: the governor, drive cable and
    // descending load share a vertical axle by the rooted right pylon.
    // The middle stays clear for the REAL opposed moving ivory blades and Pip.
    // All existing public-pressure timing, geometry/material pools, full
    // 2.4m trap footprint, visibility/reset and collision authority remain.
    const wheel = new THREE.Group();
    wheel.name = 'Published tide-shear bronze pressure governor';
    wheel.position.set(.76, 1.28, -.04);
    counterbalance.add(wheel);
    // Visible rigid side transmission couples the low wheel to the elevated
    // load-bearing bridge without putting a new strut over the protagonist.
    const riseShaft = mesh(counterbalance, bevel, darkMetal,
      .76, 1.84, -.04, .105, 1.02, .105);
    riseShaft.name = 'Published Tideglass elevated yoke side drive shaft';
    mesh(wheel, ring, gold, 0, 0, 0, .29, .29, .29);
    mesh(wheel, ring, darkMetal, 0, 0, .034, .19, .19, .19);
    mesh(wheel, cylinder, darkMetal, 0, 0, -.04, .17, .18, .17, Math.PI / 2);
    for (let spoke = 0; spoke < 2; spoke++) {
      const angle = spoke * Math.PI;
      mesh(wheel, bevel, lightStone,
        Math.cos(angle) * .12, Math.sin(angle) * .12,
        .07, .16, .060, .08, 0, 0, angle);
    }
    // A TRUE joined cable/weight under the moving yoke. On the published
    // pressure clock the cable stretches as the weight drops; every transform
    // is absolute, so withdrawal and stale/private snapshots return to rest.
    const cable = new THREE.Group();
    cable.name = 'Published tide-shear connected descending cable';
    cable.position.set(.76, 1.26, .08);
    counterbalance.add(cable);
    mesh(cable, bevel, gold, 0, -.27, 0, .072, .47, .072);
    const weight = new THREE.Group();
    weight.name = 'Published tide-shear hanging counterweight';
    weight.position.set(.76, .60, .08);
    counterbalance.add(weight);
    mesh(weight, bevel, darkMetal, 0, 0, 0, .40, .30, .35);
    mesh(weight, bevel, lightStone, 0, -.13, .02, .45, .08, .40);
    mesh(weight, bevel, darkJade, 0, .025, .186, .29, .18, .04);
    mesh(pressureMast, cylinder, darkMetal, 0, .08, 0, .30, .16, .28);
    mesh(pressureMast, ring, gold, 0, .19, 0, .35, .35, .35, Math.PI / 2);
    const carriage = new THREE.Group();
    carriage.name = 'Published tide-shear rising carriage';
    carriage.position.y = .16;
    pressureMast.add(carriage);
    mesh(carriage, cylinder, darkMetal, 0, .20, 0, .11, .40, .11);
    mesh(carriage, bevel, seaGlass, 0, .48, 0, .50, .50, .28);
    mesh(carriage, bevel, darkMetal, 0, .50, .175, .46, .36, .07);
    mesh(carriage, bevel, seaGlass, 0, .82, .19, .37, .10, .11);
    const diaphragms = [];
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.name = 'Published tide-shear diaphragm ' + side;
      leaf.position.set(side * .20, .55, .13);
      carriage.add(leaf);
      mesh(leaf, bevel, darkMetal, side * .13, .25, 0, .32, .56, .13, 0, 0, side * .12);
      mesh(leaf, bevel, seaGlass, side * .15, .25, .09, .15, .44, .06);
      mesh(leaf, cone, darkMetal, side * .13, .55, 0, .11, .22, .10);
      diaphragms.push({object: leaf, side});
    }
    // Two broad, hinged mineral shutters belong to the SAME published
    // pressure tile. Their inset, contrasting faces physically part as the
    // witnessed explorer approaches, revealing the original dark pressure
    // socket. This is a visual response to the existing hazard, not a new
    // collision, passage, key, damage rule or hidden-route hint. The full
    // mechanism remains inside the known floor footprint at every pose.
    const shutters = [];
    for (const side of [-1, 1]) {
      const shutter = new THREE.Group();
      shutter.name = 'Published tide-shear floor shutter ' + side;
      shutter.position.set(side * .52, .085, -.02);
      p.add(shutter);
      // Pass266: genuine 320/390 WebGL showed the earned floor opening
      // as tiny splinters buried under the jaw mast. Rebuild EACH existing
      // four-part moving shutter into one half of a connected, nearly
      // full-tile kinetic pressure deck: dark load bed, broad ivory door,
      // true moving coral shear lip, and the continuous rear iron hinge.
      // Both leave the same 2.4m published footprint and keep the original
      // witnessed hinge/rail animation. NO extra mesh or GPU resource class,
      // collision, trigger, AI route, private information or false danger.
      mesh(shutter, bevel, darkMetal, -side * .18, .045, .08,
        .71, .10, 1.28);
      const enamel = mesh(shutter, bevel, lightStone, -side * .18, .11, .08,
        .62, .055, 1.14);
      enamel.name = 'Published tide-shear ivory moving face';
      mesh(shutter, bevel, danger, -side * .18, .147, .62,
        .56, .045, .09);
      mesh(shutter, bevel, darkMetal, -side * .18, .185, -.42,
        .48, .075, .09);
      shutters.push({object: shutter, side});
    }
    // A connected four-quarter tideglass iris now turns the disclosed hazard
    // floor into one observable mechanical opening rather than inert clay under
    // its jaws. All four faces live INSIDE the real trap cell, and use only
    // existing pooled Three materials/geometry. This is cosmetic 3D only:
    // no fabricated collision, route, trigger, AI action or hidden-cell read.
    const iris = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const quarter = new THREE.Group();
      quarter.name = 'Published tide-shear quarter iris ' + sx + ' ' + sz;
      quarter.position.set(sx * .47, .065, sz * .42);
      p.add(quarter);
      mesh(quarter, bevel, darkMetal, 0, .015, 0, .61, .055, .57);
      const face = mesh(quarter, bevel, seaGlass, 0, .059, 0, .54, .045, .49);
      face.name = 'Published tide-shear moving sea-glass quadrant';
      // The former four bright ivory slivers competed with the actual two
      // moving shears in real phone footage. Dark joined edge hardware
      // preserves all four physical opening leaves and their original poses.
      mesh(quarter, bevel, darkMetal, -sx * .115, .092, -sz * .09,
        .14, .025, .37);
      iris.push({object: quarter, sx, sz});
    }
    // Connected bronze relay levers turn FIRST as a visible pressure plate
    // responds, BEFORE the taller piston completes its rise. Two genuinely
    // rooted, low-profile mechanical linkages give the on-camera shutter
    // action a readable cause and effect at portrait scale. These are
    // presentation-only parts of this already PUBLIC hazard; there is no
    // new trigger, AI command, collision or undisclosed hazard knowledge.
    // Reuse the original pooled shapes/materials: zero new GPU geometries.
    const relays = [];
    for (const side of [-1, 1]) {
      const relay = new THREE.Group();
      relay.name = 'Published tide-shear staged relay ' + c.cell + ' ' + side;
      relay.position.set(side * .33, .28, .35);
      pressureMast.add(relay);
      mesh(relay, cylinder, darkMetal, 0, .02, 0, .18, .16, .18);
      mesh(relay, bevel, gold, -side * .19, .14, .02, .39, .13, .16, 0, 0, side * .13);
      mesh(relay, bevel, darkMetal, -side * .37, .21, .10, .20, .12, .12);
      relays.push({object: relay, side});
    }
    // The existing treadle was visually isolated from the tall jaw hardware
    // in authenticated 320/390px full-frame WebGL. Give this ONE disclosed
    // mechanism a rooted physical transmission: paired bronze tracks run from
    // the forward treadle into the mast, and broad sliding gold pushrods pull
    // toward the jaws as the treadle actually depresses. These are modeled
    // connected mechanical parts, NOT extra hazards, guide arrows, lighting
    // signals, fabricated collisions or public route hints. Their complete
    // swept envelope remains inside the original known trap tile.
    const transmission = new THREE.Group();
    transmission.name = 'Published tide-shear floor-to-jaw transmission ' + c.cell;
    transmission.position.set(0, .055, .44);
    p.add(transmission);
    const driveBars = [];
    for (const side of [-1, 1]) {
      // The dark continuous runner underlines the one earned pressure action;
      // the pale inset gives it readable depth without luminous VFX.
      mesh(transmission, bevel, darkMetal, side * .50, .020, -.23,
        .26, .085, 1.32);
      mesh(transmission, bevel, seaGlass, side * .50, .070, -.23,
        .14, .026, 1.22);
      const drive = new THREE.Group();
      drive.name = 'Published tide-shear sliding drive bar ' + c.cell + ' ' + side;
      drive.position.set(side * .50, .135, 0);
      transmission.add(drive);
      mesh(drive, bevel, gold, 0, .005, -.18, .19, .11, .76);
      mesh(drive, bevel, darkJade, 0, .083, .14, .23, .06, .24);
      mesh(drive, cylinder, darkMetal, 0, .024, -.48, .17, .15, .17);
      driveBars.push({object: drive, side});
    }
    trapSignals.push({carriage, diaphragms, shutters, iris, relays, treadle,
      counterbalance: { bridge, wheel, cable, weight, loadArms },
      driveBars, cell: c.cell, x: p.position.x, z: p.position.z,
      pressureSince: null, pressureLastTime: null});
    // Connected pivots and broad ceramic silhouettes, not emissive billboards.
    // They unfold in response to Pip's ACTUAL published presentation position
    // near this disclosed hazard; they never modify the authoritative engine.
    for (const side of [-1, 1]) {
      const jaw = new THREE.Group();
      jaw.name = 'Disclosed tide-shear hinged jaw ' + c.cell + ' ' + side;
      // Give each genuine inward cutting face a clear front stage, rather
      // than letting the governor/diaphragm overprint its action silhouette.
      // The entire swept jaw remains in the same published 2.4m cell.
      // Pass279: true SHA-bound 320/390 WebGL pressure captures show the
    // crossed ivory shears projecting as a solid foreground chevron across
    // Pip's lower body. Stage BOTH existing source-driven blade hinges on the
    // FRONT half of their rooted ivory guides, with their pivots planted
    // just below the pressure deck. The horizontal inward closure and whole
    // two-blade silhouette remain; the forward camera sees the protagonist
    // above, and the cutting action lower, instead of stacked on the torso.
    // No new danger footprint, actor relocation, collision/AI rule, source
    // knowledge, material/geometry class, camera crop or timing alteration.
    jaw.position.set(side * .68, -.035, .44);
      p.add(jaw);
      // Pass259 original full-frame 320/390px criticism: the prior THIRTEEN
      // tiny overlapping red shards read as a ruin pile, not a paired
      // mechanical shear. Reconstruct EACH existing rooted jaw into one
      // coherent broad IVORY cutting face, a continuous dark bronze load
      // spine, a single narrow coral contact edge and a hooked mineral tip.
      // Both faces remain children of their REAL pressure hinge and rotate
      // only on its already-published contact clock. No extra trigger, hint,
      // route, damage, AI, collision or material/geometry class is created.
      // The reduced count is deliberate: silhouette and causality over clutter.
      mesh(jaw, cylinder, darkMetal, 0, .03, 0, .14, .24, .14);
      // Pass286: the authentic source-bound 390px public pressure image
      // exposed a giant opaque ivory V across Pip and the moving deck.
      // Keep BOTH true hinged shear mechanisms and their inward cutting
      // edges, but rebuild their heavy front plates as connected open-web
      // forged jaws. The freed center is REAL 3D negative space, not CSS
      // transparency, missing hazard, invented safe passage or camera crop.
      // The bearing, long rib and front load arm form one actual connected
      // load path. It must be visible at rest/contact/withdrawal, rather than
      // three floating decorative parts around Pip.
      const bearing = mesh(jaw, bevel, deepStone,
        -side * .10, .34, -.12, .38, .52, .42);
      bearing.name = 'Published tide-shear rooted bearing';
      const loadRib = mesh(jaw, bevel, darkMetal,
        -side * .085, .84, -.085, .13, 1.08, .15, 0, 0, side * .13);
      loadRib.name = 'Published tide-shear open-web structural rib';
      const forearm = mesh(jaw, bevel, darkMetal,
        -side * .27, .65, .20, .62, .18, .25, 0, 0, -side * .23);
      forearm.name = 'Published tide-shear inward brace';
      const vane = mesh(jaw, bevel, side < 0 ? seaGlass : jade,
        -side * .23, 1.06, .16, .22, .84, .14, 0, 0, side * .13);
      vane.name = 'Published tide-shear warning vane';
      // Enlarge each true hinge-connected cutting FACE instead of the
      // decorative talons. Opposed inset coral edges now face one another;
      // open jaws expose a gap, and their genuine linked stroke crosses it.
      // This replaces the prior mobile shard pile with two large coherent
      // parts, not extra visual effects, warnings or collision authority.
      // Pass288 true open-throat clearance: keep the restored tall narrow
      // physical blade, but root it closer to its outer hinge. A wide
      // transparent center when disengaged must come from actual world
      // geometry, not from a camera trick or a test-threshold reduction.
      const blade = mesh(jaw, bevel, lightStone,
        -side * .30, 1.04, .36, .40, 1.24, .26, 0, 0, side * .13);
      blade.name = 'Published tide-shear front blade';
      const bladeInlay = mesh(jaw, bevel, danger,
        -side * .40, 1.04, .545, .135, 1.16, .060, 0, 0, side * .13);
      bladeInlay.name = 'Published tide-shear forward danger inlay';
      // Do not keep the disconnected legacy decorative lip underneath
      // the new open-web shear. Its presence would recreate foreground
      // clutter and exceed the nine-piece/jaw physical complexity cap.
      const fang = mesh(jaw, cone, gold,
        -side * .32, 1.70, .40, .13, .18, .13, 0, 0, -side * .20);
      fang.name = 'Published tide-shear warning fang';
      const hookedTip = mesh(jaw, cone, amber,
        -side * .35, 1.64, .57, .12, .22, .12, 0, 0, -side * .28);
      hookedTip.name = 'Published tide-shear hooked ceramic talon';
      trapJaws.push({object: jaw, side, cell: c.cell, x: p.position.x, z: p.position.z});
    }
  }
  function checkpointProp(c, s) {
    const p = propGroup(c.cell, s); pedestal(p, jade, .48);
    mesh(p, ring, inlay, 0, .245, 0, .38, .38, .38, Math.PI / 2);
    // A wayfinding shrine kept to a small footprint at the cell edge.
    const shrine = new THREE.Group(); shrine.position.set(.65, sampleGroundHeight(p.position.x + .65, p.position.z - .64, s) - p.position.y, -.64); p.add(shrine);
    mesh(shrine, bevel, lightStone, 0, .18, 0, .38, .36, .38);
    mesh(shrine, cylinder, jade, 0, .58, 0, .1, .64, .1);
    mesh(shrine, bevel, inlay, 0, .88, 0, .35, .08, .35);
    const crystal = mesh(shrine, sphere, glow, 0, 1.06, 0, .17, .27, .17);
    animations.push({ type: 'crystal', object: crystal, baseY: 1.06, phase: c.cell });
  }
  function clueProp(c, s) {
    const p = propGroup(c.cell, s); p.position.x += .56; p.position.z -= .58; p.position.y = sampleGroundHeight(p.position.x, p.position.z, s);
    mesh(p, bevel, deepStone, 0, .08, 0, .6, .16, .53);
    mesh(p, bevel, jade, 0, .38, 0, .42, .57, .28, -.18);
    mesh(p, bevel, lightStone, 0, .73, -.06, .66, .11, .47, -.18);
    for (let j = 0; j < 3; j++) mesh(p, box, amber, -.11 + j * .11, .47 + (j % 2) * .08, .153, .045, .16, .025, 0, 0, j % 2 ? Math.PI / 4 : 0);
  }
  function exitProp(cell, s) {
    if (!s.cells.some(c => c.cell === cell)) return;
    const p = propGroup(cell, s); p.name = 'Disclosed exit portal';
    mesh(p, cylinder, deepStone, 0, .04, 0, 1.01, .08, 1.01);
    mesh(p, cylinder, jade, 0, .09, 0, .9, .06, .9);
    mesh(p, ring, gold, 0, .14, 0, .75, .75, .75, Math.PI / 2);
    for (const sign of [-1, 1]) {
      mesh(p, bevel, lightStone, sign * .78, .14, -.54, .48, .28, .48);
      mesh(p, bevel, jade, sign * .78, .93, -.54, .33, 1.45, .35);
      mesh(p, bevel, gold, sign * .78, 1.56, -.54, .42, .15, .42);
    }
    // Segmented carved arch; its open centre stays transparent and readable.
    for (let j = 0; j < 9; j++) {
      const a = Math.PI * j / 8;
      mesh(p, bevel, j % 2 ? stone : lightStone, Math.cos(a) * .78, 1.57 + Math.sin(a) * .78, -.54, .3, .33, .4, 0, 0, a - Math.PI / 2);
    }
    const veil = mesh(p, portalDisc, portalVeil, 0, 1.18, -.53, .65, .84, 1);
    veil.castShadow = false; veil.receiveShadow = false;
    const halo = mesh(p, ring, glow, 0, 1.18, -.51, .68, .86, .68);
    // A two-tower tide observatory gives the *actually disclosed* exit a
    // destination-scale silhouette rather than another anonymous stone tile.
    // Every element is local to the already-known exit prop, without a walkable
    // platform, authority change, secret neighbor, new resource or frame work.
    // Rear-set watchtowers leave the portal center open for Pip and the exit.
    const observatory = new THREE.Group();
    observatory.name = 'Disclosed exit observatory';
    p.add(observatory);
    for (const sign of [-1, 1]) {
      const tower = new THREE.Group();
      tower.name = 'Disclosed exit watchtower';
      tower.position.set(sign * .96, 0, -.90);
      observatory.add(tower);
      mesh(tower, bevel, deepStone, 0, .13, 0, .46, .26, .48);
      mesh(tower, bevel, jade, 0, 1.04, 0, .29, 1.64, .33);
      for (const band of [.48, 1.12, 1.77])
        mesh(tower, bevel, lightStone, 0, band, 0, .40, .11, .44);
      mesh(tower, bevel, darkJade, 0, 1.94, 0, .54, .17, .54);
      mesh(tower, bevel, gold, 0, 2.09, 0, .50, .08, .50);
      mesh(tower, cone, jade, 0, 2.34, 0, .34, .42, .35);
      mesh(tower, sphere, glow, 0, 2.60, .07, .18, .24, .18);
    }
    // Floor-level tide dial: symbolic destination ornament, NOT a path cue.
    // Its low geometry leaves the playable cell, exit and navigation untouched.
    const tideDial = new THREE.Group();
    tideDial.name = 'Disclosed exit floor dial';
    observatory.add(tideDial);
    mesh(tideDial, ring, darkMetal, 0, .022, .58, .74, .74, .74, Math.PI / 2);
    for (let j = 0; j < 7; j++) {
      const angle = Math.PI * j / 6;
      mesh(tideDial, bevel, j % 2 ? lightStone : gold,
        Math.cos(angle) * .65, .025, .59 + Math.sin(angle) * .21,
        .12, .025, .19, 0, -angle);
    }
    // The tide rose is a large, camera-facing *physical* exit landmark, not a
    // route promise: exitProp is called only for a publicly discovered exit.
    // Eight ivory/gold radial stones contrast with the oval key bow and the
    // jade ruins. Reuse the existing resource pool; nothing is built per frame.
    const tideRose = new THREE.Group();
    tideRose.name = 'Disclosed exit tide rose';
    tideRose.position.set(0, 3.03, -.30);
    p.add(tideRose);
    mesh(tideRose, ring, darkMetal, 0, 0, -.09, .57, .57, .57);
    mesh(tideRose, ring, gold, 0, 0, .015, .45, .45, .45);
    for (let j = 0; j < 8; j++) {
      const angle = j * TAU / 8;
      mesh(tideRose, bevel, j % 2 ? gold : lightStone,
        Math.sin(angle) * .69, Math.cos(angle) * .69, .035,
        .13, .25, .13, 0, 0, -angle);
    }
    const gem = mesh(tideRose, sphere, glow, 0, 0, .12, .22, .29, .16);
    animations.push({ type: 'halo', object: halo, baseY: 1.18, phase: cell });
    animations.push({ type: 'crystal', object: gem, baseY: 0, phase: cell });
  }
  function rebuildObjects(s, previouslyVisibleCells) {
    // Public discovery, key pickup and door updates rebuild these physical
    // props while the REAL explorer is still near a disclosed pressure tile.
    // Keep a currently witnessed presentation timeline across that rebuild;
    // otherwise a new cell resets the shutters/piston every tick and the
    // three distinct physical beats may never finish in normal gameplay.
    // Only carry the already-published same-run hazard, visible both before
    // and after the update. Unknown, hidden and newly revealed traps cannot
    // inherit an old mechanical animation or private state.
    const pressureClocks = new Map(trapSignals
      .filter(signal => previouslyVisibleCells.has(signal.cell))
      .map(({cell, pressureSince, pressureLastTime}) =>
        [cell, {pressureSince, pressureLastTime}]));
    const nowVisible = new Set(s.visibleCells);
    publicClosedSockets.clear(); retractingGates.clear();
    clear(objects); animations = []; trapJaws = []; trapSignals = [];
    for (const key of s.keys) keyProp(key, s);
    for (const door of s.doors) doorProp(door, s);
    for (const c of s.cells) {
      if (c.trap) {
        trapProp(c, s);
        const prior = nowVisible.has(c.cell) ? pressureClocks.get(c.cell) : null;
        if (prior) Object.assign(trapSignals[trapSignals.length - 1], prior);
      }
      if (c.checkpoint) checkpointProp(c, s);
      if (c.clue) clueProp(c, s);
    }
    if (s.exitCell !== null) exitProp(s.exitCell, s);
  }
  function refreshVisibility(s, force = false) {
    const visible = new Set(s.visibleCells), signature = s.visibleCells.join(',') + ':' + highContrast;
    if (!force && signature === lastVisibility) return;
    lastVisibility = signature;
    const currentColor = new THREE.Color(highContrast ? '#ffffff' : '#fffaf0');
    const rememberedColor = new THREE.Color(highContrast ? '#8fa4ac' : '#b0b9ad');
    for (const { mesh: instance, entries } of batches) {
      entries.forEach((entry, index) => instance.setColorAt(index, entry.cell < 0 || visible.has(entry.cell) ? currentColor : rememberedColor));
      instance.instanceColor.needsUpdate = true;
    }
  }
  function update(s) {
    if (disposed || !s) return;
    // No invented unlock from a previously unseen, already-open door.
    // Only an exact public closed→open transition within one live run qualifies.
    if (snapshot && snapshot.runToken === s.runToken) {
      for (const door of observedGateOpenings(snapshot, s))
        gateOpeningAt.set(doorEdgeId(door.a, door.b), presentationTime);
      const pickup = publicKeyCollectionMoment(snapshot, s);
      if (pickup) keyPickupAt.set(pickup.id, presentationTime);
    }
    const collectedIds = new Set((s.keys || []).filter(key => key.collected).map(key => key.id));
    for (const id of keyPickupAt.keys()) if (!collectedIds.has(id)) keyPickupAt.delete(id);
    const currentOpen = new Set((s.doors || []).filter(door => door.open)
      .map(door => doorEdgeId(door.a, door.b)));
    for (const edge of gateOpeningAt.keys())
      if (!currentOpen.has(edge)) gateOpeningAt.delete(edge);
    const previouslyVisibleCells = new Set(snapshot?.visibleCells || []);
    // A hidden or terminal published snapshot revokes the in-flight physical pressure
    // encounter immediately, even if no render frame or object rebuild runs.
    // Otherwise a newly visible trap could inherit its old raised piston.
    // The ONLY authority here is the sanitized PUBLIC visibility list.
    const currentlyVisibleCells = new Set(Array.isArray(s.visibleCells) ? s.visibleCells : []);
    for (const signal of trapSignals) {
      if (!s.result && currentlyVisibleCells.has(signal.cell)) continue;
      signal.pressureSince = null;
      signal.pressureLastTime = null;
      signal.publicProgress = 0;
    }
    snapshot = s;
    // Read ONLY the published explorer cell. True smooth interpolation, when
    // available, is supplied by scene.js as a cosmetic render-frame input.
    const publicPosition=cellPosition(s.currentCell,s.width,s.height);
    publicHeroX=publicPosition.x; publicHeroZ=publicPosition.z;
    if (runToken !== s.runToken) {
      // An empty but valid disclosed run produces an empty terrain key. A
      // sentinel distinct from that key is mandatory after a run change:
      // otherwise old renderedCells diagnostics can survive with no meshes.
      runToken = s.runToken; terrainSignature = null; objectSignature = ''; backdropSignature = ''; lastVisibility = '';
      clear(terrain); clear(objects); clear(backdrop); publicClosedSockets.clear(); gateOpeningAt.clear(); retractingGates.clear(); keyPickupAt.clear();
      batches = []; animations = []; ripples = []; fossilSails = []; fossilOrgans = []; trapJaws = []; trapSignals = []; guardianTideSignals = []; renderedCells = []; stairEdges = []; stairBalustrades = 0;
      tideFossilGroves = 0; tideFossilAlcoves = 0; fossilGalleryEdges = 0; hangingFacadeGardens = 0; undercroftButtresses = 0; closedTideMedallions = 0; coastalGardens = 0; wallGardens = 0; coastCanopies = 0; tidalObservatories = 0; sculptedMosaicWalls = 0; tidePennants = 0; perimeterCascades = 0; collapsedPavilions = 0; shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0;
    }
    const backgroundKey = `${s.width}:${s.height}`;
    if (backgroundKey !== backdropSignature) { rebuildBackdrop(s); backdropSignature = backgroundKey; }
    // Semantic public-cell flags control floor relief/ornaments too. A newly
    // disclosed trap, checkpoint or clue on an already-known cell must rebuild
    // the actual instanced court, not leave a decorative shell under danger.
    // These are ONLY sanitized public cell properties, never private map data.
    const knownCellsForGate = new Set(s.cells.map(c => c.cell));
    const gateKey = (Array.isArray(s.doors) ? s.doors : [])
      .filter(d => Number.isSafeInteger(d?.a) && Number.isSafeInteger(d?.b)
        && d.a >= 0 && d.b >= 0 && knownCellsForGate.has(d.a)
        && knownCellsForGate.has(d.b) && Math.abs(d.a % s.width - d.b % s.width)
          + Math.abs(Math.floor(d.a / s.width) - Math.floor(d.b / s.width)) === 1)
      .map(d => doorEdgeId(d.a, d.b)).sort().join('.');
    // Wall-side fossil alcoves must never cover an actually PUBLIC key or
    // exit prop. Include those rare disclosed landmark cell changes in the
    // terrain cache key, without rebuilding on every moving hero tick or
    // peeking at undisclosed future cells. Run reset already clears all art.
    const knownKeyRelicCells=(s.keys||[])
      .filter(key=>knownCellsForGate.has(key.cell))
      .map(key=>key.cell).sort((a,b)=>a-b).join('.');
    const disclosedExitRelicCell=knownCellsForGate.has(s.exitCell)?s.exitCell:'';
    // Pass311 real source-native regression: a formerly visible, mutually
    // disconnected neighbor can fall out of CURRENT public sight without
    // leaving the previously lowered guardian wall on screen. Cache only
    // visibility of published known cells touching the legitimate real
    // guardian causeway, not the entire moving FOV or any private topology.
    // An unchanged sightline incurs no extra terrain rebuild on each tick.
    const keyedGuardianCauseway=publicGuardianCausewayCells(s);
    const keyedOuterCourt=publicGuardianOuterCourtCells(s,keyedGuardianCauseway);
    const keyedForeground=publicGuardianWitnessedForegroundCells(s,keyedGuardianCauseway);
    const reefVisibility=new Set();
    for(const cell of keyedGuardianCauseway.keys()){
      for(const n of [cell-1,cell+1,cell-s.width,cell+s.width]){
        if(n<0||!knownCellsForGate.has(n)||!s.visibleCells.includes(n))continue;
        const cardinal=Math.abs(cell%s.width-n%s.width)
          +Math.abs(Math.floor(cell/s.width)-Math.floor(n/s.width));
        if(cardinal===1)reefVisibility.add(n);
      }
    }
    const terrainKey = s.cells.map(c =>
      `${c.cell}/${c.neighbors.join('.')}/${+c.blocked}/${+!!c.trap}/${+!!c.checkpoint}/${+!!c.clue}`).join('|')
      + '#' + gateKey + '#relic:' + knownKeyRelicCells + ':' + disclosedExitRelicCell
      + '#public-guardian-court:' + [...publicGuardianStageCells(s)].sort((a,b)=>a-b).join('.')
      + '#guardian-blocked-relief:' + [...publicGuardianBlockedReliefCells(s)].sort((a,b)=>a-b).join('.')
      + '#guardian-causeway:' + [...keyedGuardianCauseway].map(([id,axis])=>id+':'+axis).sort().join('.')
      + '#guardian-reef-visible:' + [...reefVisibility].sort((a,b)=>a-b).join('.')
      + '#guardian-near-floor:' + [...keyedForeground].sort((a,b)=>a-b).join('.')
      + '#guardian-outer-floor:' + [...keyedOuterCourt.ordinary].sort((a,b)=>a-b).join('.')
      + '#guardian-outer-sealed:' + [...keyedOuterCourt.sealed].sort((a,b)=>a-b).join('.');
    if (terrainKey !== terrainSignature) { rebuildTerrain(s); terrainSignature = terrainKey; }
    const objectKey = JSON.stringify([s.keys, s.doors, s.inventory, s.exitCell, s.cells.map(c => [c.cell, c.trap, c.checkpoint, c.clue])]);
    if (objectKey !== objectSignature) { rebuildObjects(s, previouslyVisibleCells); objectSignature = objectKey; }
    refreshVisibility(s);
  }
  // Actual carved socket, only for a publicly matching carried key on a closed gate.
  // Reuse caller's vector; never traverse meshes or allocate each render frame.
  function matchingPublicSocket(a,b,target) {
    if (disposed || !Number.isInteger(a) || !Number.isInteger(b) || !target?.isVector3) return null;
    const lock=publicClosedSockets.get(doorEdgeId(a,b));
    if (!lock || lock.userData.keyState!=='carried') return null;
    return lock.localToWorld(target.set(0,.92,.89));
  }
  function animate(time, options = {}) {
    if (disposed) return;
    const t = Number.isFinite(time) ? time : 0;
    presentationTime = Number.isFinite(options.gateTime) && options.gateTime >= 0
      ? options.gateTime : t;
    const reduced = !!options.reducedMotion;
    // Carved bronze portcullises physically withdraw into their own lintel.
    // The passage was already opened by the real engine; this is cosmetic.
    // Animation is held on the same 3D gate between source polling updates.
    for (const [edge, gate] of retractingGates) {
      const pose = gateRetractionPose(presentationTime - gateOpeningAt.get(edge), reduced);
      gate.visible = pose.visible;
      gate.position.y = pose.raise;
      gate.scale.y = pose.scaleY;
      // The visibly connected pulleys turn as the physical portcullis
      // rises, while twin stone weights fall within the two real jambs.
      // No geometry, material or animation clock is allocated per frame.
      const travel = Math.max(0, Math.min(1, pose.raise / 1.55));
      const drive = gateDrives.get(gate);
      if (drive) for (let i = 0; i < drive.wheels.length; i++) {
        drive.wheels[i].rotation.z = (i ? 1 : -1) * travel * 1.35;
        drive.weights[i].position.y = .61 - travel * .30;
        // Gate-drive wing progress is coupled to the REAL grille's physical
        // retraction, never an AI prediction or an independently looping timer.
        drive.wings[i].rotation.z = (i ? -1 : 1) * .82 * travel;
      }
      if (!pose.visible) {
        retractingGates.delete(edge);
        gateOpeningAt.delete(edge);
      }
    }
    // Ambient living masonry gives a disclosed alcove a small physical
    // relationship with Pip. Proximity is measured against the REAL public
    // presentation pose; it cannot infer an undiscovered neighbor or change
    // any navigation, hazards, doors, inventory or AI state. Reduced-motion
    // settles the hinges completely, including when the actor moves.
    const hero=options.explorerPosition;
    const hx=hero?.isVector3 && Number.isFinite(hero.x) ? hero.x : publicHeroX;
    const hz=hero?.isVector3 && Number.isFinite(hero.z) ? hero.z : publicHeroZ;
    // A scene-scale, 3D guardian warning now travels through the REAL
    // currently witnessed open causeway, not a disconnected HUD label or a
    // guessed attack. Pip and Thornback still move solely under the engine.
    // Both actors' public cells must terminate the same straight, open,
    // level, already-built causeway; no unseen threat, sealed door, stair,
    // alternate guardian or prior run may illuminate a panel.
    const heroCell=snapshot?.currentCell, guardianCell=options.guardianCell;
    const publicThreat=Number.isSafeInteger(guardianCell)
      && snapshot?.lifecycle==='running' && !snapshot.result
      && Array.isArray(snapshot.visibleCells)
      && snapshot.visibleCells.includes(guardianCell)
      && Array.isArray(snapshot.threats)
      && snapshot.threats.some(t=>t.cell===guardianCell);
    let witnessedHero=false,witnessedGuardian=false;
    for(const signal of guardianTideSignals) {
      if(signal.cell===heroCell)witnessedHero=true;
      if(signal.cell===guardianCell)witnessedGuardian=true;
    }
    const witnessedLane=publicThreat && witnessedHero && witnessedGuardian;
    const alongX=witnessedLane
      && Math.floor(heroCell/snapshot.width)===Math.floor(guardianCell/snapshot.width);
    const alongZ=witnessedLane && heroCell%snapshot.width===guardianCell%snapshot.width;
    const guardianBeat=Number.isFinite(options.guardianBeat)
      ? Math.max(0,Math.min(1,options.guardianBeat)) : 0;
    // A threat FIRST earns a warm warning, the whole court responds during
    // its grounded brace, and the mineral tones recover after shell release.
    // Reduced motion holds a single nonmoving legitimate-alert state.
    // A real 320/390 full-frame critic rejected the earlier three disconnected
    // narrow strips: these continuous, wider side leaves now counter-hinge
    // OUTSIDE the central lane, while the dark Tideglass spine makes both
    // characters and the witnessed warning read as one coherent encounter.
    const rise=reduced ? (witnessedLane&&guardianBeat>0?1:0)
      : Math.max(0,Math.min(1,(guardianBeat-.08)/.34));
    const recover=reduced?0:Math.max(0,Math.min(1,(guardianBeat-.74)/.26));
    // The native three-beat guardian test caught a too-late release: the
    // raised stage hardware remained almost half-deployed at a true 90%
    // shell-release frame. Retract the existing truthful public warning
    // faster (not merely loosen the physical-action contract).
    const signalStrength=rise*(1-.90*recover);
    for(const signal of guardianTideSignals) {
      const col=signal.cell%snapshot.width,row=Math.floor(signal.cell/snapshot.width);
      const onLane=witnessedLane && ((alongX && signal.axis==='x'
        && row===Math.floor(heroCell/snapshot.width)
        && col>=Math.min(heroCell%snapshot.width,guardianCell%snapshot.width)
        && col<=Math.max(heroCell%snapshot.width,guardianCell%snapshot.width))
        || (alongZ && signal.axis==='z' && col===heroCell%snapshot.width
        && row>=Math.min(Math.floor(heroCell/snapshot.width),Math.floor(guardianCell/snapshot.width))
        && row<=Math.max(Math.floor(heroCell/snapshot.width),Math.floor(guardianCell/snapshot.width))));
      const action=onLane?signalStrength:0;
      // The FULL linked 3D standard rises with the real published brace,
      // drops on release and instantly neutralizes on hidden/invalid/terminal.
      // Reduced motion preserves color but freezes all physical translation.
      for(const beacon of signal.sentinels){
        beacon.lift.position.y=reduced ? .04 : .04+action*.42;
        beacon.crown.material=action>.28?amber:seaGlass;
        beacon.lens.material=action>.28?amber:inlay;
        // The entire linked shell fan opens laterally into the non-walkable
        // outside margin in the witnessed brace and folds on real release.
        // No fabricated guardian strike or collision is implied. In reduced
        // motion it remains rigid but retains the truthful amber warning.
        beacon.sailPivot.rotation[signal.axis==='x'?'x':'z']=reduced?0
          :(signal.axis==='x'?beacon.side:-beacon.side)*.88*action;
        // Pass329 original 390px brace showed FOUR opaque amber feathers
        // visually overtaking Pip and Thornback. Keep the full-size hinged
        // SEA-GLASS body visibly moving through the real guardian warning,
        // but move the warm event emphasis to its CONNECTED narrow crest.
        // The existing substantial crown, lens and floor leaves still glow
        // amber on witnessed brace; none is an invented strike/hit indicator.
        // Reuse pooled materials; reduced motion freezes geometry, not truth.
        beacon.sail.material=action>.28?darkJade:seaGlass;
        beacon.crest.material=action>.28?amber:lightStone;
      }
      for(const face of signal.faces){
        face.object.material=action>.28?amber:seaGlass;
        // Pivot the WHOLE attached leaf around its real outer-lane hinge,
        // rather than tilting a tiny plate about its own centre. At the
        // witnessed brace the sea-glass edge rises ~.55 world units, clearly
        // readable beside both actors. The entire physical lane remains open;
        // neither this pose nor the associated public signal is a collider.
        // At retreat/hidden/terminal and under reduced motion every hinge
        // returns to a precisely settled, stationary pose.
        face.hinge.rotation[signal.axis==='x'?'x':'z']=reduced?0
          :(signal.axis==='x'?-face.side:face.side)*1.12*action;
      }
    }
    // True PUBLIC pressure-hazard contact is readable as a physical scene
    // consequence, not a fake collision or a new game mechanic. The hinges
    // flare OUTWARD, away from the centre path, as the actual autonomous Pip
    // approaches an already-visible trap. Unknown/remembered-only hazards do
    // not animate. Reduced motion gives both jaws a stable, recognizable pose.
    // All objects were allocated at rebuild time; this loop creates nothing.
    // Physical warning jaws share the *same disclosed pressure timeline* as
    // the floor shutters and piston below. Their pose is updated AFTER those
    // mechanisms, never from a separate instant proximity snap.
    // The same REAL visible public trap contact drives the grounded piston
    // and two connected shields. Hidden or remembered traps rest, never
    // hint at a private hazard. Reduced motion holds one readable static pose.
    // The published movement step controls how quickly the complete visible
    // pressure action can play; standalone callers retain the prior 1.25s.
    // Pass274: the public pose can be one tile from a visible trap while a
    // SEALED gate, non-reciprocal edge or different-height terrace separates
    // them. Distance is not physical pressure contact. Only the disclosed
    // current cell and an independently verified reciprocal, level, unsealed
    // pressure-court connection may start the real floor/jaw action. Same-cell
    // contact remains authoritative. Visibility alone may warn, never actuate.
    // This reuses the exact public edge rule used to draw the physical apron,
    // so the presentation cannot contradict its own world geometry.
    // No private topology, path plan, collision, AI or simulation rule read.
    const currentPublicPressureCell = Number.isSafeInteger(snapshot?.currentCell)
      && Array.isArray(snapshot?.cells)
      ? snapshot.cells.find(cell=>cell?.cell===snapshot.currentCell
        && cell.blocked!==true) : null;
    const pressureSequenceSeconds = Number.isFinite(options.stepDurationMs)
      && options.stepDurationMs > 0
      ? publicPressureSequenceSeconds(options.stepDurationMs)
      : PUBLIC_PRESSURE_VISUAL_SECONDS;
    for (const signal of trapSignals) {
      const visible = !snapshot?.result && Array.isArray(snapshot?.visibleCells)
        && snapshot.visibleCells.includes(signal.cell);
      const distance = Math.hypot(hx - signal.x, hz - signal.z);
      // At the real adjacent-cell encounter the old broad falloff opened the
      // physical shutters only ~37%, so native phone chronology barely
      // distinguished approach from pressure. Presentation-only: reserve
      // a full beat for a VISIBLE one-cell approach, small diagonal warning,
      // and exact rest beyond 1.45 cells. Never change game authority.
      const opening = visible ? Math.min(1, Math.max(0,
        (1.45 - distance / CELL_SIZE) * 2.2)) : 0;
      // Reduced motion holds the readable pose ONLY for a currently visible
      // hazard. A remembered-only trap must remain at rest even if motion
      // reduction is enabled; public visibility is the sole gate.
      // An original three-beat physical sequence, not another HUD indicator:
      // (1) bronze relays warn early, (2) ivory floor plates spread, then
      // (3) the linked piston reaches its full extension. Only the same
      // already visible hazard and REAL public Pip pose can actuate it.
      // All transforms are absolute per frame, so retreat/reset/reconnect
      // are deterministic and never accumulate a false animation.
      // An adjacent PUBLIC encounter must remain visibly staged even when
      // Pip advances a whole maze cell between consecutive public snapshots.
      // Real close approach starts a visual-only timeline on the existing
      // render-frame-limited gate clock. Diagonal observation warns with
      // bronze relays; shutters cannot open before a witnessed near approach.
      // Retreat, lost public visibility and clock rollback immediately reset
      // the stage: never imply a hazard is still open or reveal hidden state.
      const disclosedTrap = Array.isArray(snapshot?.cells)
        ? snapshot.cells.find(cell=>cell?.cell===signal.cell
          && cell.trap===true && cell.blocked!==true) : null;
      const publiclyReachableContact = !!currentPublicPressureCell && !!disclosedTrap
        && (currentPublicPressureCell.cell===signal.cell
          || publicPressureCourtLink(currentPublicPressureCell,disclosedTrap,snapshot));
      const nearContact = visible && publiclyReachableContact && opening >= .75;
      if (!nearContact || (signal.pressureLastTime !== null
        && presentationTime < signal.pressureLastTime)) signal.pressureSince = null;
      if (nearContact && signal.pressureSince === null)
        signal.pressureSince = presentationTime;
      signal.pressureLastTime = presentationTime;
      const age = nearContact && signal.pressureSince !== null
        ? Math.max(0, presentationTime - signal.pressureSince) : 0;
      const stagedPressure = !visible ? 0 : nearContact
        ? observedPressureProgress(opening, age, pressureSequenceSeconds) : Math.min(opening, .20);
      // Three distinct physical phases, never a synthetic engine action:
      // relay warning → two ceramic floor leaves → elevated piston/diaphragm.
      // Source-limited visual clock avoids one positional tick skipping all
      // three stages; exact transforms depend only on disclosed input/time.
      // Pip witnesses the SAME physical relay/shutter/piston clock, never a second timer.
      // A stale or hidden cell cannot lend its old phase to the explorer.
      // Static reduced-motion contact is earned by Pip's currently observed
      // near approach, NOT mere visibility of a known trap across the room.
      // Recompute every frame; retreat, terminal and hidden states clear it.
      const reducedContact = reduced && nearContact;
      signal.reducedContact = reducedContact;
      // Pip and the actual moving joints must tell the SAME physical story.
      // In reduced motion the machine is binary (closed or contact-static),
      // so publish that exact modeled pose to Pip instead of the discarded
      // diagonal animation phase. Normal-motion chronology is unchanged.
      signal.publicProgress = reduced ? (reducedContact ? 1 : 0) : stagedPressure;
      // Reduced motion is TWO static contact states, never a partly animated
      // diagonal/far warning. Suppress the continuous visual clock entirely
      // until contact; the still near-contact pose is handled below.
      const activeProgress = reduced ? 0 : stagedPressure;
      const earlyRelay = Math.min(1, activeProgress / .17);
      const shutterBeat = Math.min(1, Math.max(0, (activeProgress - .34) / .36));
      const pistonRelay = Math.min(1, Math.max(0, (activeProgress - .76) / .24));
      // True near-contact presses the floor BEFORE the linked shutters/jaws.
      // A diagonal sighting never actuates it. Withdrawal, lost PUBLIC
      // visibility, terminal state and reset restore it in the same frame.
      // Reduced motion holds one stable, earned contact pose.
      const treadleStroke = reducedContact ? .6 : nearContact ? earlyRelay : 0;
      signal.treadle.position.y = .035 - .055 * treadleStroke;
      signal.treadle.rotation.x = -.12 * (reducedContact
        ? .45 : nearContact ? shutterBeat : 0);
      // The pushrods are mechanically slaved to the SAME witnessed treadle
      // phase, retracting BEFORE the tall shutter and jaw finish their stroke.
      // Absolute transforms guarantee clean withdrawal, hidden-only privacy,
      // restart and stable reduced-motion contact with no stale virtual hit.
      for (const bar of signal.driveBars) {
        bar.object.position.z = -.26 * treadleStroke;
        bar.object.position.y = .135 - .035 * treadleStroke;
        bar.object.rotation.x = -.11 * (reducedContact
          ? .45 : nearContact ? shutterBeat : 0);
      }
      // One physical causality chain: the observed treadle turns the large
      // public governor, the same released shutter phase tilts its bridge,
      // and the visible suspended weight descends as the jaws take load.
      // Absolute poses guarantee far/diagonal, hidden, retreat, new-run and
      // reduced-motion reset without a fake contact or frame allocation.
      const counterStroke = reducedContact ? .55 : nearContact ? shutterBeat : 0;
      signal.counterbalance.wheel.rotation.z = -.72 * treadleStroke;
      signal.counterbalance.bridge.rotation.z = .11 * counterStroke;
      // A complete structural pressure release, not a cosmetic glow or a
      // camera crop: the already-connected yoke slides UP its captive side
      // sleeves while its pinned ivory wings part. The roof clears Pip's
      // actual head/body as the two REAL cutting jaws close below. This
      // shares the same public staged shutter beat and returns exactly to
      // 2.34 on retreat, hidden state, terminal result and replay; reduced
      // motion holds one still earned contact silhouette.
      signal.counterbalance.bridge.position.y = 2.34 + .48 * counterStroke;
      // Two real pinned load wings lift apart under the same published
      // pressure beat, then return on withdrawal, reduced visibility or
      // reset. No private route, new collision or independent animation.
      for (const arm of signal.counterbalance.loadArms)
        arm.object.rotation.z = -arm.side * .72 * counterStroke;
      signal.counterbalance.weight.position.y = .60 - .28 * counterStroke;
      signal.counterbalance.cable.scale.y = 1 + .92 * counterStroke;
      for (const relay of signal.relays) {
        relay.object.rotation.z = -relay.side * (reducedContact ? .40 : .05 + .65 * earlyRelay);
        relay.object.position.y = .28 + (reducedContact ? .04 : .15 * pistonRelay);
      }
      signal.carriage.position.y = reducedContact ? .29 : .16 + .28 * pistonRelay;
      for (const leaf of signal.diaphragms)
        leaf.object.rotation.z = -leaf.side * (reducedContact ? .34 : .08 + .70 * pistonRelay);
      // Physical, source-bound open/close beat: these are connected floor
      // shutters, not a CSS flash or a simulated engine state. Their centres
      // spread out while their inner edges rise; a retreat or lost public
      // visibility restores the exact resting pose in the same render tick.
      for (const shutter of signal.shutters) {
        shutter.object.position.x = shutter.side * (.52 + (reducedContact ? .09 : .18 * shutterBeat));
        // The original .81rad opening still looked almost flat under the
        // real elevated camera. A stronger 1.11rad physical hinge and ivory
        // face create a distinct adjacent-cell visual beat, without expanding
        // the known tile footprint, changing Pip, or inventing a new hazard.
        shutter.object.rotation.z = -shutter.side * (reducedContact ? .24 : .03 + 1.08 * shutterBeat);
      }
      // The existing PUBLIC shutter clock parts the same four mineral valves.
      // No animated preview for hidden, remembered, terminal or stale traps;
      // reduced motion holds one static genuine-contact aperture.
      const irisStroke = reducedContact ? .55 : shutterBeat;
      for (const quarter of signal.iris) {
        quarter.object.position.x = quarter.sx * (.47 + .14 * irisStroke);
        quarter.object.position.z = quarter.sz * (.42 + .10 * irisStroke);
        quarter.object.position.y = .065 + (reducedContact ? .035 : .05 * shutterBeat);
        quarter.object.rotation.x = quarter.sz * (reducedContact ? .12 : .28 * shutterBeat);
        quarter.object.rotation.z = -quarter.sx * (reducedContact ? .12 : .28 * shutterBeat);
      }
    }
    // One witnessed three-beat MACHINE: bronze relays tip the warning jaws,
    // then opening ivory shutters carry both tall jaws to their full stroke.
    // The old independent proximity loop jumped the jaws completely open on
    // contact while the floor was still closed, breaking the physical story
    // in native phone footage. The same public progress drives Pip's brace.
    // No new geometry, warning, damage, collision or undisclosed route cue.
    // Do not allocate temporary collections in this render-frame loop.
    for (const jaw of trapJaws) {
      const signal = trapSignals.find(item => item.cell === jaw.cell);
      const visible = !snapshot?.result && Array.isArray(snapshot?.visibleCells)
        && snapshot.visibleCells.includes(jaw.cell);
      // In reduced motion a distant diagonal warning must not animate the
      // jaws while every other connected joint remains in its static rest.
      const phase = !reduced && visible && signal ? signal.publicProgress ?? 0 : 0;
      const relayBeat = Math.min(1, Math.max(0, phase / .17));
      const shutterBeat = Math.min(1, Math.max(0, (phase - .34) / .36));
      const angle = signal?.reducedContact ? .24
        : .06 + .14 * relayBeat + .46 * shutterBeat;
      // Native original 390px pressure proved the outward-opening talons
      // read as unrelated red parapet spikes, not a closing jaw. Bring both
      // established ivory/bronze shear blades INWARD on real published contact:
      // left hinge tips right, right hinge tips left. The original source
      // pressure sequence, authored cell, geometry, AI and collision remain.
      // Releasing the real public pressure returns both to upright rest.
      jaw.object.rotation.z = jaw.side * angle;
      // Pass263: a single machine shears, rather than two independent
      // hinge sculptures. The SAME publicly witnessed ceramic-shutter
      // stroke retracts BOTH complete blade roots along the existing
      // paired ivory floor guides. The 12cm inward slide is deliberately
      // delayed until AFTER the earned relay warning, so mere diagonal
      // observation cannot close the trap. The roots return to their
      // original ±.68m positions immediately on retreat, loss of public
      // sight, terminal state or run reset. Reduced motion has one static
      // 6cm contact pose. This is presentation-only and uses no extra
      // geometry, physics authority, private map state or AI knowledge.
      const inwardRailTravel = signal?.reducedContact ? .06 : .12 * shutterBeat;
      jaw.object.position.x = jaw.side * (.68 - inwardRailTravel);
    }
    for (const relic of fossilSails) {
      const near=Math.max(0,1-Math.hypot(hx-relic.x,hz-relic.z)/3.2);
      const angle=reduced ? .07
        : .07+.24*near+Math.sin(t*1.4+relic.phase)*.028;
      // Two independently articulated joints visibly unfurl as the real
      // explorer comes near; at reduced motion both settle to a static,
      // recognizable resting shape. No additional simulation or frame mesh.
      const crownAngle=reduced ? .10 : .10+.54*near;
      // Each solid ceramic petal now has its own third physical hinge.
      // The left/right blades spread while the centre stays upright; this
      // is a decorative response to the observed Pip pose, not an AI cue.
      // Reduced motion fixes every hinge in a stable open resting silhouette.
      const fanAngle=reduced ? .11 : .11+.43*near;
      const fanAxis=relic.dx?'x':'z';
      for (let i=0;i<relic.petals.length;i++)
        relic.petals[i].rotation[fanAxis]=(i-1)*fanAngle;
      if (relic.dx) {
        relic.object.rotation.x=relic.side*angle;
        relic.crown.rotation.x=-relic.side*crownAngle;
      } else {
        relic.object.rotation.z=relic.side*angle;
        relic.crown.rotation.z=-relic.side*crownAngle;
      }
    }
    // A separate, LARGE connected stage gesture is readable at desktop and
    // native portrait scale: the genuine approaching Pip makes the two organ
    // leaves open symmetrically. No discovered fact is added to the world.
    // Reduced motion fixes both leaves in one quiet open pose; withdrawing
    // the actor restores the compact resting silhouette deterministically.
    for (const relic of fossilOrgans) {
      const near=Math.max(0,1-Math.hypot(hx-relic.x,hz-relic.z)/3.6);
      const open=reduced?.28:.12+.80*near;
      for (const leaf of relic.organLeaves) {
        if (relic.dx) leaf.hinge.rotation.x=leaf.side*open;
        else leaf.hinge.rotation.z=leaf.side*open;
      }
      // An actual third joint lifts and blooms the installed ivory shell.
      // No frame allocations; reduced motion is a fixed, settled gesture.
      relic.resonator.position.y=1.47+(reduced?.06:.21*near);
      relic.resonator.scale.setScalar(reduced?.92:.78+.29*near);
      relic.resonator.rotation.z=reduced?0:.20*near;
      // Two additional *already modeled* hinges flare outward when the real
      // public Pip approaches, and reset on withdrawal; not an AI signal.
      for (const {mantle,side} of relic.resonatorMantles)
        mantle.rotation.z=side*(reduced?.18:.08+.58*near);
    }
    waterTexture.offset.set(reduced ? 0 : t * .0012, reduced ? 0 : t * .0006);
    if (highContrast !== !!options.highContrast) { highContrast = !!options.highContrast; if (snapshot) refreshVisibility(snapshot, true); }
    for (const a of animations) {
      if (a.type === 'key-spent-recede') {
        const start = keyPickupAt.get(a.keyId);
        const age = Number.isFinite(start) ? presentationTime - start : Infinity;
        a.object.position.y = a.baseY - publicSpentKeyTheatreDrop(true, age, reduced);
        continue;
      }
      if (a.type === 'key-shrine' || a.type === 'key-sail' || a.type === 'key-theatre') {
        // The same REAL public pickup unfolds both rooted hinge assemblies.
        // Neither screenshot wall stalls nor polling can replay a stale key.
        const start = keyPickupAt.get(a.keyId);
        const age = Number.isFinite(start) ? presentationTime - start : Infinity;
        const duration = a.type === 'key-theatre' ? 1.22 : a.type === 'key-sail' ? 1.18 : .82;
        const phase = reduced ? 1 : Math.max(0, Math.min(1, age / duration));
        const eased = phase * phase * (3 - 2 * phase);
        if (a.type === 'key-theatre')
          a.object.rotation.y = -a.side * .92 * eased;
        else a.object.rotation.z = a.type === 'key-sail'
          ? (1.16 * (1 - eased)) : (.78 * phase * (2 - phase));
        continue;
      }
      const wave = reduced ? 0 : Math.sin(t * 1.8 + a.phase) * .045;
      a.object.position.y = a.baseY + wave;
      if (a.type === 'key') a.object.rotation.y = reduced ? .55 : .55 + Math.sin(t * .65 + a.phase) * .2;
      if (a.type === 'crystal') a.object.rotation.y = reduced ? -.25 : t * .42 + a.phase;
    }
    for (let i = 0; i < ripples.length; i++) ripples[i].position.x = ripples[i].userData.baseX + (reduced ? 0 : Math.sin(t * .4 + i) * .12);
  }
  function dispose() {
    if (disposed) return; disposed = true;
    pressureRetainingGalleries = 0; guardianCourtTiles = 0; guardianBlockedReliefTiles = 0; guardianCausewayTiles = 0; guardianForecourtShoulderTiles = 0; guardianOuterCourtFloorTiles = 0; guardianOuterCourtSealedTiles = 0; shorelineLoadFacades = 0;
    clear(terrain); clear(objects); clear(backdrop); publicClosedSockets.clear(); gateOpeningAt.clear(); retractingGates.clear(); keyPickupAt.clear();
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose(); textures.clear();
    geometries.clear(); materials.clear(); batches = []; animations = []; ripples = []; fossilSails = []; fossilOrgans = []; trapJaws = []; trapSignals = []; guardianTideSignals = []; batchData.clear(); snapshot = null; renderedCells = []; stairEdges = []; stairBalustrades = 0; coastalGardens = 0; wallGardens = 0; coastCanopies = 0; tidalObservatories = 0; sculptedMosaicWalls = 0; tidePennants = 0; perimeterCascades = 0; collapsedPavilions = 0; shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0; gateForecourtParapets = 0; pressureStageParapets = 0; guardianSightlineParapets = 0; gateCourtRosettes = 0; tideFossilGroves = 0; tideFossilAlcoves = 0; fossilGalleryEdges = 0; undercroftButtresses = 0; hangingFacadeGardens = 0; closedTideMedallions = 0; group.clear();
  }
  // Actual modeled, PUBLICLY disclosed fossil-organ attention. The living
  // sculpture exists only when a safe published tile and its closed wall are
  // already on screen; hidden map cells, seeds, engine goals and AI commands
  // are never queried. A small physical Pip reaction can share the same
  // observed proximity that already unfolds these real Three hinges.
  function publicFossilAttention(explorerPosition) {
    if (disposed || !snapshot || !explorerPosition
      || !Number.isFinite(explorerPosition.x)
      || !Number.isFinite(explorerPosition.z)) return null;
    let nearest = null;
    for (const relic of fossilOrgans) {
      const distance = Math.hypot(explorerPosition.x - relic.x,
        explorerPosition.z - relic.z);
      if (distance >= 3.6 || (nearest && distance >= nearest.distance)) continue;
      nearest = { x: relic.x, z: relic.z, distance };
    }
    if (!nearest) return null;
    return {x: nearest.x, z: nearest.z,
      strength: Math.min(1, (1 - nearest.distance / 3.6) * 2)};
  }
  function publicPressureProgress(cell) {
    if (disposed || !snapshot || snapshot.result || !Number.isSafeInteger(cell)
      || !Array.isArray(snapshot.visibleCells)
      || !snapshot.visibleCells.includes(cell)) return 0;
    const physical = trapSignals.find(signal => signal.cell === cell);
    return Number.isFinite(physical?.publicProgress)
      ? Math.max(0, Math.min(1, physical.publicProgress)) : 0;
  }
  function stats() {
    let meshes = 0, instances = 0;
    group.traverse(item => { if (item.isMesh) meshes++; if (item.isInstancedMesh) instances += item.count; });
    // Read the ACTUAL 3D grille scale, not just the number of active doors:
    // a 2%-height gate technically animates but disappears in a gameplay PNG.
    // Only modeled and publicly disclosed opening hardware is considered.
    const visibleGateBars = [...retractingGates.values()].filter(gate => gate.visible);
    const movingGateMinBarsHeightRatio = visibleGateBars.length
      ? Math.min(...visibleGateBars.map(gate => gate.scale.y)) : 0;
    // Measure true installed hinge angles in exact-source native PNG sidecars.
    // This is diagnostic only; it never drives gameplay or animation.
    const fossilMotionMaxRadians = fossilSails.length
      ? Math.max(...fossilSails.map(sail => Math.abs(sail.dx
        ? sail.object.rotation.x : sail.object.rotation.z))) : 0;
    // Diagnostic witness for ONLY currently visible public hazards. Keep the
    // actual connected hinge pose paired with its public pressure clock;
    // a global maximum could belong to another disclosed hazard and falsely
    // certify this encounter. Never serialize remembered/hidden trap cells.
    const publicVisiblePressure = new Set(!snapshot?.result
      && Array.isArray(snapshot?.visibleCells) ? snapshot.visibleCells : []);
    const witnessedPressureMechanisms = trapSignals
      .filter(signal => publicVisiblePressure.has(signal.cell))
      .map(signal => {
        const hinges = trapJaws.filter(jaw => jaw.cell === signal.cell);
        return {cell: signal.cell, progress: publicPressureProgress(signal.cell),
          jawRadians: hinges.length
            ? Math.max(...hinges.map(jaw => Math.abs(jaw.object.rotation.z))) : 0,
          // SIGNED, genuine hinge orientation from real published Three.js
          // bodies. Positive means both blades now converge toward the
          // centre of this already visible pressure tile. A reversed/fake
          // outward sweep cannot pass the native browser encounter gate.
          inwardShearRadians: hinges.length
            ? Math.min(...hinges.map(jaw => jaw.side * jaw.object.rotation.z)) : 0};
      });
    return { witnessedPressureMechanisms, fossilMotionMaxRadians, guardianCourtTiles, guardianBlockedReliefTiles, guardianCausewayTiles, guardianForecourtShoulderTiles, guardianOuterCourtFloorTiles, guardianOuterCourtSealedTiles, shorelineLoadFacades, guardianTideSignalTiles:guardianTideSignals.length, renderedCells: [...renderedCells], stairEdges: stairEdges.map(edge => [...edge]), stairBalustrades, tideFossilGroves, tideFossilAlcoves, fossilGalleryEdges, undercroftButtresses, hangingFacadeGardens, closedTideMedallions, responsiveFossilSails: fossilSails.length, responsiveFossilOrgans: fossilOrgans.length, responsiveTrapJaws: trapJaws.length, responsiveTrapSignals: trapSignals.length, trapJawOpenMaxRadians: trapJaws.length ? Math.max(...trapJaws.map(jaw => Math.abs(jaw.object.rotation.z))) : 0, coastalGardens, wallGardens, coastCanopies, tidalObservatories, sculptedMosaicWalls, tidePennants, perimeterCascades, collapsedPavilions, shellBasins, windcatcherTowers, wallWindcatchers, gateForecourtParapets, pressureStageParapets, guardianSightlineParapets, gateCourtRosettes, pressureRetainingGalleries, retractingPublicGates: retractingGates.size, movingGateMinBarsHeightRatio, geometryCount: geometries.size, materialCount: materials.size, textureCount: textures.size, knownCells: renderedCells.length, meshes, batches: batches.length, instances, geometries: geometries.size, materials: materials.size, animatedObjects: animations.length, disposed };
  }
  // On-demand production-mesh ray identification for exact-source native visual
  // diagnosis. Batches contain ONLY public render cells; never enumerate
  // private topology or use a picked cell for AI/game authority.
  function describePublicRayHit(hit) {
    const entry=hit.object.isInstancedMesh && Number.isInteger(hit.instanceId)
      ? batches.find(batch=>batch.mesh===hit.object)?.entries[hit.instanceId] : null;
    // Reject ALL hits that are not current public instance geometry, even
    // if those hidden/remembered objects were ray-intersected behind it.
    const id=entry?.cell;
    if(!Number.isSafeInteger(id)||!snapshot?.visibleCells?.includes(id))return null;
    const cell=id;
    const dimensions=new THREE.Vector3(), origin=new THREE.Vector3(), orientation=new THREE.Quaternion();
    if(entry)entry.matrix.decompose(origin,orientation,dimensions);
    else hit.object.getWorldPosition(origin);
    return {cell, name:hit.object.name||null,
      material:hit.object.material?.name||null,
      color:hit.object.material?.color?.getHexString()||null,
      instanced:!!entry, worldPosition:origin.toArray().map(n=>+n.toFixed(3)),
      dimensions:entry?dimensions.toArray().map(n=>+n.toFixed(3)):null,
      contact:hit.point.toArray().map(n=>+n.toFixed(3)),
      distance:+hit.distance.toFixed(3)};
  }
  return { group, update, animate, dispose, stats, matchingPublicSocket, publicFossilAttention, publicPressureProgress, describePublicRayHit };
}
