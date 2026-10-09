// Loop 55: low-cost, scene-readable lighting for software WebGL only.
// The cinematic hardware shader keeps its complete GGX/wet-weather/shadow path.
// This is presentation-only; authoritative AI and geometry are unchanged.
export function selectMaterialShaderPath(rendererLabel=''){
  return /swiftshader|llvmpipe|software|softpipe|swrast/i.test(String(rendererLabel))
    ? 'low-spec' : 'cinematic';
}
export const lowSpecFragmentSource=[
  '#version 300 es',
  'precision highp float;',
  'in vec3 vColor; in vec3 vNormal; in vec3 vPosition;',
  'uniform vec3 uEye; uniform vec3 uFogColor; uniform vec3 uLight;',
  'uniform float uFog; uniform float uNight; uniform float uWeatherFlash;',
  'out vec4 fragColor;',
  'void main(){',
  'vec3 N=normalize(vNormal);',
  'vec3 L=normalize(uLight);',
  'float key=max(dot(N,L),0.0);',
  'float fill=max(N.y,0.0);',
  'float ambient=mix(.65,.46,uNight)+fill*.15;',
  'vec3 lightColor=mix(vec3(1.09,1.02,.92),vec3(.65,.79,1.07),uNight);',
  'vec3 color=vColor*(ambient+key*.46)*lightColor;',
  'float refuge=clamp(1.0-(abs(vPosition.x)+abs(vPosition.z))*.045,0.0,1.0);',
  'color+=vColor*vec3(.09,.20,.23)*refuge*uNight;',
  'color+=vec3(.64,.68,.85)*uWeatherFlash*.26;',
  'vec3 delta=uEye-vPosition;',
  'float haze=clamp(dot(delta,delta)*uFog*uFog*.70,0.0,.64);',
  'vec3 graded=clamp((color-.08)*1.18+.055,0.0,1.0);',
  'fragColor=vec4(mix(graded,uFogColor,haze),1.0);',
  '}'
].join('\n');
