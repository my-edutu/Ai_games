'use strict';
// Keep historical provenance intact: only the six November T1 insertion blocks
// are reversible. Older tests must not change their original SHA assertions.
const labels=['IMPORT','STATE','RENEWAL','ATTACH','STATS','RELEASE'];
function stripT1LivingGarden(source){
  let result=source;
  for(const label of labels){
    const begin='// BEGIN T1 LIVING GARDEN '+label;
    const end='// END T1 LIVING GARDEN '+label;
    const first=result.indexOf(begin),last=result.indexOf(end);
    if(first<0||last<first||result.indexOf(begin,first+1)!==-1||result.indexOf(end,last+1)!==-1)
      throw new Error('Missing/duplicated T1 renderer provenance: '+label);
    const start=result.lastIndexOf('\n',first-1)+1;
    const finish=result.indexOf('\n',last);
    if(finish<0)throw new Error('Missing end newline: '+label);
    result=result.slice(0,start)+result.slice(finish+1);
  }
  return result;
}
// Date-specific renderer checks hash their authentic old code, never the
// November 1 T1 additions. Keep all six strict T1 source markers intact in
// the before/after WebGL variants; only dated SHA assertions strip them.
function historicalRendererGitBlob(source) {
  const crypto = require('node:crypto');
  const historical = source.includes('// BEGIN T1 LIVING GARDEN IMPORT')
    ? stripT1LivingGarden(source) : source;
  return crypto.createHash('sha1')
    .update('blob ' + Buffer.byteLength(historical) + '\0')
    .update(historical).digest('hex');
}
module.exports={stripT1LivingGarden,historicalRendererGitBlob};
