'use strict';
// Remove only R53 presentation startup additions to reconstruct the exact
// pre-R53 renderer Git blob. Older R38/R43/R46/R49/R51 SHA gates stay strict.
const names=['STARTUP RASTER HELPER','STARTUP RASTER RESIZE'];
function stripR53Startup(source){
  const counts=names.map(name=>source.split('// BEGIN R53 '+name+'\n').length-1);
  if(counts.every(n=>n===0))return source;
  if(counts.some(n=>n!==1))throw Error('Incomplete R53 renderer archive');
  let result=source;
  for(const name of names){
    const start='// BEGIN R53 '+name+'\n',end='// END R53 '+name+'\n';
    const a=result.indexOf(start),b=result.indexOf(end,a);
    if(a<0||b<a||result.indexOf(end,b+1)>=0)throw Error('R53 source markers mismatched: '+name);
    const lineStart=result.lastIndexOf('\n',a-1)+1;
    result=result.slice(0,lineStart)+result.slice(b+end.length);
  }
  return result;
}
module.exports={stripR53Startup};
