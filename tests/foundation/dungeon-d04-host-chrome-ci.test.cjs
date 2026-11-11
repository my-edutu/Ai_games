'use strict';
// D04-only CI contracts. Do not change shared browser launch configuration.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const workflow=()=>fs.readFileSync(path.join(root,'.github/workflows/dungeon-d04-foley-identity.yml'),'utf8');
const configPath=path.join(root,'tests/browser/dungeon-d04.playwright.config.cjs');
function loadConfig(channel){
 const previous=process.env.D04_BROWSER_CHANNEL;
 try{
  if(channel===undefined)delete process.env.D04_BROWSER_CHANNEL;
  else process.env.D04_BROWSER_CHANNEL=channel;
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
 }finally{
  delete require.cache[require.resolve(configPath)];
  if(previous===undefined)delete process.env.D04_BROWSER_CHANNEL;
  else process.env.D04_BROWSER_CHANNEL=previous;
 }
}
test('D04 browser CI cannot block on optional apt font packages',()=>{
 const text=workflow();
 assert.doesNotMatch(text,/playwright\s+install\s+--with-deps/i,
  'Ubuntu mirror DNS failure must not prevent authentic D04 browser playback');
 assert.match(text,/command -v google-chrome/,
  'CI must fail explicitly if the preinstalled browser is absent');
 assert.match(text,/D04_BROWSER_CHANNEL:\s*chrome/,
  'Chrome must be selected only in the isolated D04 real-preview job');
});
test('D04 CI uses system Chrome only when explicitly enabled',()=>{
 const defaultConfig=loadConfig(undefined);
 const withChrome=loadConfig('chrome');
 const withOther=loadConfig('something-else');
 assert.notEqual(defaultConfig.use?.channel,'chrome',
  'Ordinary local D04 preview must retain Playwright default Chromium');
 assert.equal(withChrome.use?.channel,'chrome',
  'Runner must launch preinstalled Chrome without Playwright apt install');
 assert.deepEqual(withOther.use,defaultConfig.use,
  'Unknown selectors must not silently alter local browser behavior');
 assert.deepEqual(withChrome.use?.launchOptions,defaultConfig.use?.launchOptions,
  'Preserve genuine WebGL software-rendering launch flags');
 assert.deepEqual(withChrome.use?.viewport,defaultConfig.use?.viewport,
  'Preserve desktop capture dimensions');
});

test('D04 evidence decoder must be optional and may not hide live playback behind apt mirrors',()=>{
 const text=workflow();
 assert.doesNotMatch(text,/sudo\s+apt-get|\bapt-get\s+(?:install|update)/,
  'Network-dependent apt install must not prevent authentic Dungeon browser playback');
 assert.match(text,/command -v ffprobe/,
  'Report whether strict decoder is available without assuming it exists');
 assert.match(text,/command -v ffmpeg/,
  'Report whether frame decoder is available without blocking real browser smoke');
 assert.match(text,/Decoder unavailable.*UNVERIFIED|UNVERIFIED.*decoder unavailable/i,
  'Missing native decoder must explicitly downgrade evidence instead of claiming a pass');
});
