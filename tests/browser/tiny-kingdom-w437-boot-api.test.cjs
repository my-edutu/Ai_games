'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('window.__tinyKingdom={');
const end=source.indexOf('};\n})();',start);
test('W437 live runtime API binds the actual granary and inhabited loft audits',()=>{
 assert.ok(start>=0&&end>start,'original running game exposes API after renderer startup');
 assert.match(source,/function granarySupplyAudit\(\)/,'real grain totals are sourced from the authoritative granary');
 assert.match(source,/function getCompactUpperLoftAudit\(\)/,'real tall-house GPU audit exists');
 const api=source.slice(start,end);
 assert.match(api,/(?:^|,)getGranarySupplyAudit:granarySupplyAudit,/,'live granary function has a defined export');
 assert.match(api,/,getCompactOccupiedRoomAudit,getCompactUpperLoftAudit,/,'upper-loft audit is not incorrectly aliased to grain inventory');
 assert.doesNotMatch(api,/(?:^|,)getGranarySupplyAudit(?:,|$)/,'undefined shorthand API export must never abort the whole game script');
 assert.doesNotMatch(api,/getCompactUpperLoftAudit:granarySupplyAudit/,'architecture must not report inventory as a loft audit');
});
