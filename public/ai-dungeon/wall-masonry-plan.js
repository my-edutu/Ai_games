/**
 * Original CPU-generated stone albedo for the actual instanced dungeon walls.
 * Pure, bounded and floor-keyed. No authority, network, clock or RNG access.
 * Each texel is a modestly lit, opaque mortar/brick surface; WebGL PBR lights
 * still determine the scene's real shading (this is not an emissive shortcut).
 */
const PALETTES=Object.freeze([
 Object.freeze([139,120,101]), // sunken crypt: ochre-grey weathered limestone; blue remains for the obsidian vault
 Object.freeze([134,109,101]), // ember cathedral: fired sandstone
 Object.freeze([106,120,145]), // obsidian vault: cold mineral blue
 Object.freeze([126,112,145])  // hollow sanctum: violet limestone
]);
function stoneHash(x,y,f){
 let n=Math.imul(x+71,374761393)^Math.imul(y+131,668265263)^Math.imul(f+29,1442695041);
 n=Math.imul(n^(n>>>13),1274126177);
 return(n^(n>>>16))>>>0;
}
/** 32–256px RGBA, alpha 255, empty on invalid input, <= 256 KiB. */
export function makeWallMasonryPixels(floor=1,size=128){
 if(!Number.isInteger(floor)||floor<1||floor>10000||
    !Number.isInteger(size)||size<32||size>256)return new Uint8ClampedArray(0);
 const pixels=new Uint8ClampedArray(size*size*4);
 const base=PALETTES[(floor-1)%PALETTES.length];
 for(let y=0;y<size;y++){
  const course=Math.floor(y/31),mortarY=y%31;
  const stagger=(course%2)*22;
  for(let x=0;x<size;x++){
   const brickX=(x+stagger)%44;
   const mortar=mortarY<2||brickX<2;
   const grain=stoneHash(x,y,floor);
   const courseTone=(stoneHash(Math.floor((x+stagger)/44),course,floor)%19)-9;
   const fleck=(grain%31===0)?-21:(grain%29===0?12:0);
   const chipped=(grain%127===0)?-26:0;
   const highlight=mortarY===3?11:0;
   const p=(y*size+x)*4;
   for(let channel=0;channel<3;channel++){
    const value=mortar
     ?[35,39,45][channel]+((grain>>>channel*5)&7)
     :base[channel]+courseTone+((grain>>>channel*5)&11)-5+fleck+chipped+highlight;
    pixels[p+channel]=Math.max(0,Math.min(255,value));
   }
   pixels[p+3]=255;
  }
 }
 return pixels;
}
