// One original stone source is shared by all stone materials in one world.
// Browser loading is optional so geometry and disposal tests need no DOM.
export function createStoneSurfaceAsset(THREE, adapters = {}) {
  const browser = typeof document !== 'undefined';
  const request = adapters.request ?? (browser && typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const decode = adapters.decode ?? (browser && typeof createImageBitmap === 'function' ? createImageBitmap.bind(globalThis) : null);
  const texture = new THREE.Texture();
  texture.name = 'tower-original-weathered-stone';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  const available = { value: 0 };
  const controller = request && decode ? new AbortController() : null;
  let disposed = false, bitmap = null, state = controller ? 'loading' : 'unavailable';
  let width = 0, height = 0, timer = null;
  async function load() {
    if (!controller) return false;
    try {
      timer = setTimeout(() => controller.abort(), 10000);
      const response = await request('/tower/visuals/assets/weathered-stone-v1.webp', {
        signal: controller.signal, credentials: 'same-origin', cache: 'force-cache',
      });
      if (disposed) return false;
      if (!response.ok) throw new Error('Stone surface unavailable');
      const blob = await response.blob();
      clearTimeout(timer); timer = null;
      if (disposed || controller.signal.aborted) {
        if (!disposed) state = 'failed';
        return false;
      }
      const loaded = await decode(blob, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      if (disposed || controller.signal.aborted) {
        loaded.close?.();
        if (!disposed) state = 'failed';
        return false;
      }
      if (!(loaded.width > 0 && loaded.height > 0)) {
        loaded.close?.();
        throw new Error('Invalid stone surface');
      }
      bitmap = loaded; width = loaded.width; height = loaded.height;
      texture.image = bitmap;
      texture.needsUpdate = true;
      available.value = 1; state = 'ready';
      return true;
    } catch {
      if (!disposed) state = 'failed';
      return false;
    } finally {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }
  }
  const settled = load();
  return {
    texture, available, settled,
    diagnostics: () => ({ state, ownedTextures: disposed ? 0 : 1, width, height }),
    dispose() {
      if (disposed) return;
      disposed = true; state = 'disposed'; available.value = 0;
      controller?.abort();
      if (timer !== null) clearTimeout(timer);
      timer = null;
      texture.dispose();
      bitmap?.close?.(); bitmap = null; texture.image = null;
    },
  };
}

// Triplanar coordinates use each rigid batch's world-unit geometry. A moving
// deck carries its own pattern; texture motion never slides across its tread.
export function applyStoneSurface(material, asset, { scale = .085, strength = .72, relief = .028 } = {}) {
  material.onBeforeCompile = shader => {
    shader.uniforms.towerStoneMap = { value: asset.texture };
    shader.uniforms.towerStoneAvailable = asset.available;
    shader.uniforms.towerStoneScale = { value: scale };
    shader.uniforms.towerStoneStrength = { value: strength };
    shader.uniforms.towerStoneRelief = { value: relief };
    shader.vertexShader = 'varying vec3 vTowerStonePosition;\nvarying vec3 vTowerStoneNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 stonePosition = vec4(position, 1.0);
      vec3 stoneNormal = normal;
      #ifdef USE_INSTANCING
        stonePosition = instanceMatrix * stonePosition;
        mat3 stoneInstance = mat3(instanceMatrix);
        stoneNormal /= vec3(dot(stoneInstance[0],stoneInstance[0]), dot(stoneInstance[1],stoneInstance[1]), dot(stoneInstance[2],stoneInstance[2]));
        stoneNormal = stoneInstance * stoneNormal;
      #endif
      vTowerStonePosition = stonePosition.xyz;
      vTowerStoneNormal = normalize(stoneNormal);`);
    shader.fragmentShader = `varying vec3 vTowerStonePosition;
      varying vec3 vTowerStoneNormal;
      uniform sampler2D towerStoneMap;
      uniform float towerStoneAvailable;
      uniform float towerStoneScale;
      uniform float towerStoneStrength;
      uniform float towerStoneRelief;
      vec3 towerStoneSample(vec3 point, vec3 surfaceNormal) {
        vec3 weights = pow(abs(normalize(surfaceNormal)), vec3(5.0));
        weights /= max(dot(weights, vec3(1.0)), 0.0001);
        vec3 a = texture2D(towerStoneMap, point.yz * towerStoneScale + vec2(.17,.41)).rgb;
        vec3 b = texture2D(towerStoneMap, point.xz * towerStoneScale + vec2(.53,.11)).rgb;
        vec3 c = texture2D(towerStoneMap, point.xy * towerStoneScale + vec2(.31,.67)).rgb;
        return a * weights.x + b * weights.y + c * weights.z;
      }
      vec3 towerStoneNormal(vec3 point, vec3 surfaceNormal, float height, float side) {
        vec3 dx = dFdx(point), dy = dFdy(point);
        vec3 xBasis = cross(dy, surfaceNormal), yBasis = cross(surfaceNormal, dx);
        float determinant = dot(dx, xBasis) * side;
        vec3 gradient = sign(determinant) * (dFdx(height) * xBasis + dFdy(height) * yBasis);
        return normalize(max(abs(determinant), 0.000001) * surfaceNormal - gradient);
      }
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float towerStoneLuminance = .59;
      if (towerStoneAvailable > .5) {
        vec3 mineral = towerStoneSample(vTowerStonePosition, vTowerStoneNormal);
        towerStoneLuminance = dot(mineral, vec3(.2126,.7152,.0722));
        float mineralValue = clamp(1.0 + (towerStoneLuminance - .59) * 1.7, .62, 1.24);
        diffuseColor.rgb *= mix(1.0, mineralValue, towerStoneStrength);
      }`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + (.59 - towerStoneLuminance) * .12 * towerStoneStrength, .1, 1.0);`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      if (towerStoneAvailable > .5) {
        normal = towerStoneNormal(-vViewPosition, normal, towerStoneLuminance * towerStoneRelief, faceDirection);
      }`);
  };
  material.customProgramCacheKey = () => 'tower-original-triplanar-stone-v1';
  return material;
}
