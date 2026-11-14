'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
/** A genuine immutable historical Git blob, never a made-up ancestor
 * reconstructed by deleting one feature from today's accumulated game.
 * Only checks archive provenance; all browser A/B/WebGL/cue/resource tests
 * must still run, and none of their real visual assertions are relaxed.
 */
function originalGitBlob(sha){
  if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Historic SHA required');
  const src=fs.readFileSync(path.resolve(__dirname,'../fixtures/snake-history/git-'+sha+'.mjs'),'utf8');
  const actual=crypto.createHash('sha1').update('blob '+Buffer.byteLength(src)+'\0').update(src).digest('hex');
  if(actual!==sha)throw Error('Original Git blob mismatch: '+sha+' '+actual);
  return actual;
}
module.exports={originalGitBlob};
