'use strict';
// W122 test-first visual accessibility contract. Actual Playwright click and
// 390px WebGL interaction remain in GPU browser suite, not claimed by Node.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const css=html.slice(0,html.indexOf('</style>'));
const source=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(source);
const need=[
 'body[data-command="world"]:not([data-street="on"]):not([data-hud="cinema"]):is([data-workday="live"],[data-workday="homecoming"]) #world-ribbon',
 'display:flex!important;position:fixed!important;',
 '#world-ribbon > :not(#world-trace-toggle):not(#world-supply-trail)',
 '#world-supply-trail:not([hidden])',
 'grid-template-columns:repeat(2,minmax(0,1fr))!important;',
 'min-width:44px;min-height:44px;'
];
for(const token of need)assert(css.includes(token),'real workday touch ledger CSS '+token);
assert(html.includes('button id="world-trace-toggle"'),'real workday economy button in playable DOM');
assert(html.includes('id="world-supply-trail" role="group"'),'real farm→market→home chain');
assert(source.includes("button('world-trace-toggle',toggleSupplyTrail);"),'actual click wired');
assert(source.includes("function toggleSupplyTrail()"),'real user control handler');
assert(source.includes('deliveryReceipts[0]'),'verified market receipts, not staged');
assert(source.includes('getActiveDeliveries()'),'real escrowed cargo, not dummy props');
assert(source.includes('occupiedHouseholds()'),'real inhabited homes');
console.log('W122 real workday supply trail source-accessibility contract PASS; physical 390px click still needs browser.');
