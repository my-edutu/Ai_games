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

test('D04 evidence decoder may use bounded post-playback provisioning but must never block authentic Chrome',()=>{
 const text=workflow();
 const browserCommand='npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs';
 const playback=text.indexOf(browserCommand);
 assert.ok(playback>0,'Require genuine Dungeon Chrome execution');
 const aptCommands=/\bapt-get\s+(?:update|install)\b/;
 assert.doesNotMatch(text.slice(0,playback),aptCommands,
  'Network-dependent decoder installation must never gate genuine Chrome playback');
 const after=text.slice(playback+browserCommand.length);
 if(aptCommands.test(after)){
  const marker='      - name: Best-effort independent FFmpeg and FFprobe provisioning after playback';
  const stepStart=after.indexOf(marker);
  assert.ok(stepStart>=0,'Any optional apt provisioning must have a dedicated post-playback step');
  const nextStep=/\n      - (?:name|run|uses):/g;
  nextStep.lastIndex=stepStart+marker.length;
  const next=nextStep.exec(after);
  const step=after.slice(stepStart,next?next.index:after.length);
  assert.doesNotMatch(after.replace(step,''),aptCommands,
   'Apt must not occur outside the bounded optional post-playback decoder step');
  assert.match(step,/\n\s*if:\s*always\(\)/,
   'The decoder must run after authentic Chrome even when the strict impact gate fails');
  assert.match(step,/\n\s*timeout-minutes:\s*[1-3]\s*(?:\n|$)/,
   'Optional native decoder installation needs a short absolute job timeout');
  assert.match(step,/timeout\s+\d+s\s+sudo\s+apt-get\s+update/,
   'Network-dependent apt update must have an independent bounded deadline');
  assert.match(step,/timeout\s+\d+s\s+sudo\s+env\s+DEBIAN_FRONTEND=noninteractive\s+apt-get\s+install/,
   'Network-dependent apt install must have an independent bounded deadline');
  assert.match(step,/UNVERIFIED/,
   'Failed decoder provisioning must explicitly preserve an unverified contact verdict');
 }
 assert.match(text,/command -v ffprobe/,
  'Report whether the strict decoder is available without assuming it exists');
 assert.match(text,/command -v ffmpeg/,
  'Report whether the frame decoder is available without blocking real browser smoke');
 assert.match(text,/Decoder unavailable.*UNVERIFIED|UNVERIFIED.*decoder unavailable/i,
  'Missing native decoders must explicitly downgrade evidence instead of claiming a pass');
});

test('D04 host Chrome CI installs the Playwright video encoder without apt or a browser download',()=>{
 const text=workflow();
 const encoderStep=text.indexOf('npx playwright install ffmpeg');
 const browserStep=text.indexOf('npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs');
 assert.ok(encoderStep>=0,'Playwright video recording requires its own ffmpeg-1011 binary even when system Chrome exists');
 assert.ok(browserStep>encoderStep,'Install Playwright media encoder before newPage and actual WebGL capture');
 assert.doesNotMatch(text,/npx playwright install (?:chromium|--with-deps)/,
  'D04 should not reinstall browser/system fonts from an unreliable mirror');
});
