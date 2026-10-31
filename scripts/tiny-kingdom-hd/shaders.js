const vs=`attribute vec3 position;attribute vec3 normal;attribute vec3 color;attribute float materialId;
uniform mat4 viewProjection;uniform mat4 lightViewProjection;
varying vec3 vColor;varying vec3 vWorld;varying vec3 vNormal;varying float vFog;varying float vMaterial;varying vec4 vShadow;
void main(){
 vec4 world=vec4(position,1.);vec4 p=viewProjection*world;gl_Position=p;
 vColor=color;vWorld=position;vNormal=normalize(normal);vMaterial=materialId;
 vShadow=lightViewProjection*world;
 vFog=1.-exp(-max(0.,p.w-32.)*.006);
}`;
// Original world-space materials, linear lighting and a bounded 3x3 PCF sun map.
// This is not a claim of a photogrammetry/PBR asset pipeline.
const fs=`precision highp float;
varying vec3 vColor;varying vec3 vWorld;varying vec3 vNormal;varying float vFog;varying float vMaterial;varying vec4 vShadow;
uniform vec3 fogColor;uniform vec3 sunDirection;uniform vec3 sunTint;uniform vec3 eyePosition;
uniform float worldTime;uniform float daylight;uniform sampler2D sunDepth;
uniform float shadowEnabled;uniform float shadowTexel;
float hash3(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float visibility(vec3 n,vec3 sun){
 if(shadowEnabled<.5)return 1.;
 vec3 q=vShadow.xyz/vShadow.w*.5+.5;
 if(q.x<=.001||q.x>=.999||q.y<=.001||q.y>=.999||q.z<=0.||q.z>=1.)return 1.;
 float bias=max(.00018,.00072*(1.-max(dot(n,sun),0.)));float lit=0.;
 for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
  float d=texture2D(sunDepth,q.xy+vec2(float(x),float(y))*shadowTexel).r;
  lit+=step(q.z-bias,d);
 }
 return lit/9.;
}
float lamp(vec3 p,vec3 n){vec3 delta=p-vWorld;float d=length(delta);float fall=max(0.,1.-d/5.);return fall*fall*max(.06,dot(n,normalize(delta)))*4.;}
vec3 filmic(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 vec3 base=max(vColor,vec3(.001));vec3 n=normalize(vNormal),sun=normalize(sunDirection),view=normalize(eyePosition-vWorld);
 float rough=.9;
 if(vMaterial>.5&&vMaterial<1.5){
  float patches=noise3(vWorld*.42),grain=noise3(vWorld*8.);
  base*=mix(.78,1.13,patches)*mix(.90,1.08,grain);
  base=mix(base,base*vec3(1.12,.98,.70),smoothstep(.58,.85,patches)*.42);
  n=normalize(n+vec3((noise3(vWorld*4.)-.5)*.10,0.,(noise3(vWorld.zyx*4.)-.5)*.10));
 }else if(vMaterial>1.5&&vMaterial<2.5){
  float a=vWorld.x*2.45+vWorld.z*1.09-worldTime*.86,b=vWorld.z*5.25-vWorld.x*1.61+worldTime*1.33;
  n=normalize(vec3(-.078*cos(a)-.042*cos(b),1.,-.041*cos(a)+.075*cos(b)));rough=.12;
  float fresnel=.025+.975*pow(1.-max(dot(n,view),0.),5.);
  base=mix(base*vec3(.62,.84,.91),mix(fogColor,vec3(.50,.65,.74),.45),.16+fresnel*.76);
  float shore=abs(vWorld.z-(20.+3.*sin(vWorld.x*.13)));
  base=mix(base,vec3(.65,.76,.73),smoothstep(1.3,1.8,shore)*smoothstep(.1,.8,sin(a)*.3+sin(b)*.25+.45)*.22);
 }else if(vMaterial>2.5&&vMaterial<3.5){
  float gravel=noise3(vWorld*8.);base*=.82+.25*gravel;
  base*=1.-step(.84,gravel)*.18;
 }else if(vMaterial>3.5&&vMaterial<4.5){
  base*=.82+.25*noise3(vWorld*4.);
 }else if(vMaterial>4.5&&vMaterial<5.5){
  vec2 uv=abs(n.y)>.67?vWorld.xz:(abs(n.x)>abs(n.z)?vWorld.zy:vWorld.xy);
  vec2 brick=uv*vec2(1.3,2.4);brick.x+=floor(brick.y)*.5;
  float seam=smoothstep(.46,.497,max(abs(fract(brick.x)-.5),abs(fract(brick.y)-.5)));
  base*=mix(1.,.64,seam)*(.91+.15*noise3(vWorld*9.));
 }else if(vMaterial>5.5&&vMaterial<6.5){
  float fiber=.5+.5*sin(vWorld.y*55.+noise3(vWorld*2.8)*4.);base*=.89+.17*fiber;
 }else if(vMaterial>6.5&&vMaterial<7.5){base*=.89+.16*noise3(vWorld*7.);rough=.72;}
 else{base*=.95+.08*noise3(vWorld*9.);}
 float visible=visibility(n,sun),hemi=.5+.5*n.y;
 float day=smoothstep(.20,.85,daylight);
 vec3 ambient=mix(vec3(.035,.055,.09),mix(vec3(.12,.13,.12),vec3(.30,.39,.49),hemi),day);
 float direct=max(dot(n,sun),0.)*visible*mix(.06,1.7,day);
 vec3 linear=pow(base,vec3(2.2))*(ambient+direct*sunTint);
 if(vMaterial>3.5&&vMaterial<4.5)linear+=pow(base,vec3(2.2))*vec3(.08,.17,.055)*pow(max(dot(-view,sun),0.),3.)*day;
 float spec=pow(max(dot(n,normalize(sun+view)),0.),mix(100.,12.,rough));
 linear+=spec*visible*day*(1.-rough)*.22*sunTint;
 float night=1.-smoothstep(.24,.62,daylight);
 float lamps=lamp(vec3(-5.,1.9,-7.),n)+lamp(vec3(6.,1.8,9.),n)+lamp(vec3(2.,1.9,6.),n)+lamp(vec3(-14.,1.8,6.),n);
 linear+=pow(base,vec3(2.2))*vec3(1.,.48,.16)*lamps*night;
 // Only the actual amber lamp/window glass palette emits, not the entire facade.
 float glass=step(.95,vColor.r)*step(.85,vColor.g)*(1.-step(.60,vColor.b));
 linear+=vec3(1.5,.62,.13)*glass*night;
 linear=mix(linear,pow(fogColor,vec3(2.2))*.75,vFog);
 gl_FragColor=vec4(pow(filmic(linear),vec3(1./2.2)),1.);
}`;
