'use strict';
// Reconstruct the exact pre-R54 renderer without touching earlier R53/R51
// startup or submitted-frame acceptance assertions.
const start='      // BEGIN R54 SHADOW FIRST-PAINT\n';
const end='      // END R54 SHADOW FIRST-PAINT\n';
function stripR54ShadowStartup(source){
  const count=source.split(start).length-1;
  if(count===0){
    if(source.includes('END R54 SHADOW FIRST-PAINT'))throw Error('R54 closing marker without opening marker');
    return source;
  }
  if(count!==1 || source.split(end).length!==2)throw Error('R54 archive markers are incomplete or repeated');
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  if(a<0||b<a||source.includes('BEGIN R54 SHADOW FIRST-PAINT',a+start.length,b))
    throw Error('R54 archive marker sequence is invalid');
  return source.slice(0,a)+source.slice(b+end.length);
}
module.exports={stripR54ShadowStartup};
