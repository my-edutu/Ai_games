"""Local real-WebGL checks against a labelled synthetic public-state fixture.
This does not claim to execute the authoritative TypeScript game server.
"""
import json, pathlib, subprocess, re, base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'evidence/ant-colony-3d'; OUT.mkdir(parents=True, exist_ok=True)
fixture=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./tests/fixtures/ant-3d-fixture.cjs')()))"],cwd=ROOT))
state={'snapshot':fixture,'status':{'paused':False,'simulationFault':False,'lastStepAgeMs':20}}
# Navigation to localhost is blocked by the managed Chromium policy. Load the
# unchanged production scripts/styles into an isolated document instead.
# Only the network boundary is replaced by this explicit synthetic fixture.
def load(page, payload):
    html=(ROOT/'public/ai-ant-colony/colony-3d.html').read_text()
    html=re.sub(r'<script[^>]*>.*?</script>|<link[^>]*>', '', html, flags=re.S)
    page.set_content(html)
    page.add_style_tag(content=(ROOT/'public/ai-ant-colony/colony-3d.css').read_text())
    page.evaluate("""payload => {window.fixture=payload;window.fixtureRequests=0;
      window.fetch=async () => {window.fixtureRequests++;return {ok:true,text:async()=>JSON.stringify(window.fixture)}};}""", payload)
    for name in ['colony-3d-core.js','colony-3d-renderer.js','colony-3d-app.js']:
        page.add_script_tag(content=(ROOT/'public/ai-ant-colony'/name).read_text())
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name); print('PASS',name,flush=True)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        load(page,state);check('production 3D page loads in isolated fixture',page.locator('canvas').count()==1)
        page.wait_for_function('window.__ANT3D_METRICS__?.frames > 2',timeout=30000)
        check('WebGL2 produces a scene',page.evaluate('window.__ANT3D_METRICS__.triangles > 10000'))
        check('render batches are bounded',page.evaluate('window.__ANT3D_METRICS__.drawCalls <= 16 && window.__ANT3D_METRICS__.dropped === 0'))
        check('all fixture ants are rendered',page.evaluate('window.__ANT3D_METRICS__.ants === 40'))
        check('snapshot input not mutated',page.evaluate('window.__ANT3D_STATE__.ants[0].x')==fixture['ants'][0]['x'])
        page.screenshot(path=str(OUT/'desktop-nest.png'))
        page.get_by_role('button',name='Forest',exact=True).click();page.wait_for_timeout(300)
        page.screenshot(path=str(OUT/'desktop-forest.png'))
        check('camera selection is accessible',page.get_by_role('button',name='Forest',exact=True).get_attribute('aria-pressed')=='true')
        page.get_by_role('button',name='World',exact=True).click();page.wait_for_timeout(300)
        page.screenshot(path=str(OUT/'desktop-world.png'))
        page.get_by_role('button',name='Nest',exact=True).click()
        page.get_by_role('button',name='Reduce motion',exact=True).click();check('motion toggle updates preference',page.locator('body').get_attribute('data-reduced-motion')=='true')
        state['status']['paused']=True;page.evaluate('s=>window.fixture=s',state);page.wait_for_timeout(450)
        check('pause is not called live', 'paused' in page.locator('#connection').inner_text().lower())
        state['status']['paused']=False
        before=state['snapshot'];state['snapshot']={'invalid':True};page.evaluate('s=>window.fixture=s',state);page.wait_for_timeout(500)
        check('invalid frame preserves last confirmed state',page.evaluate('window.__ANT3D_STATE__.ants.length')==40)
        check('invalid frame is visibly disclosed','verified' in page.locator('#connection').inner_text().lower())
        state['snapshot']=before;page.evaluate('s=>window.fixture=s',state);page.wait_for_timeout(400)
        page.get_by_role('button',name='Forest',exact=True).click()
        page.evaluate("window.__lostExt=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.__lostExt.loseContext()")
        page.wait_for_timeout(300);check('context loss offers fallback',page.locator('#render-fallback').is_visible())
        page.evaluate('window.__lostExt.restoreContext()');page.wait_for_timeout(1000)
        check('context restoration resumes drawing',not page.locator('#render-fallback').is_visible())
        check('camera label survives context restoration',page.get_by_role('button',name='Forest',exact=True).get_attribute('aria-pressed')=='true')
        page.evaluate("window.dispatchEvent(new PageTransitionEvent('pagehide'))");page.wait_for_timeout(300);count=page.evaluate('window.fixtureRequests');page.wait_for_timeout(400)
        check('pagehide stops polling',page.evaluate('window.fixtureRequests')==count)
        page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow'))");page.wait_for_timeout(400)
        check('pageshow resumes polling',page.evaluate('window.fixtureRequests')>count)
        check('no JavaScript errors',not errors)
        metrics=page.evaluate('window.__ANT3D_METRICS__')
        mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce')
        load(mobile,state);mobile.wait_for_function('window.__ANT3D_METRICS__?.frames > 1',timeout=30000)
        check('system reduced motion is respected',mobile.locator('body').get_attribute('data-reduced-motion')=='true')
        check('mobile has no horizontal overflow',mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        check('camera controls meet touch size',all(b.bounding_box()['height']>=44 for b in mobile.locator('[data-shot]').all()))
        mobile.screenshot(path=str(OUT/'mobile-nest.png'))
        noGL=browser.new_page(viewport={'width':800,'height':600});noGL.evaluate("() => { const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}; }")
        load(noGL,state);noGL.wait_for_timeout(400)
        check('unsupported WebGL has usable classic link',noGL.locator('#render-fallback a').is_visible())
        progress=browser.new_page(viewport={'width':1100,'height':1200})
        html=(ROOT/'public/ai-ant-colony/gauntlet.html').read_text()
        html=re.sub(r'<script[^>]*>.*?</script>|<link[^>]*>', '', html, flags=re.S)
        for image in ['before','after']:
            raw=base64.b64encode((ROOT/f'public/ai-ant-colony/gauntlet-{image}.jpg').read_bytes()).decode()
            html=html.replace(f'/ant/gauntlet-{image}.jpg',f'data:image/jpeg;base64,{raw}')
        progress.set_content(html)
        progress.add_style_tag(content=(ROOT/'public/ai-ant-colony/gauntlet.css').read_text())
        progress.evaluate('s=>{window.record=s;window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(window.record)});}',json.loads((ROOT/'public/ai-ant-colony/gauntlet-status.json').read_text()))
        progress.add_script_tag(content=(ROOT/'public/ai-ant-colony/gauntlet.js').read_text())
        progress.wait_for_timeout(200)
        check('progress page retains a truthful failing benchmark verdict',progress.locator('#verdict').inner_text()=='NOT PASSED')
        check('progress page renders all recorded iterations',progress.locator('#rounds article').count()==3)
        check('progress page includes actual before/after thumbnails',progress.locator('img').evaluate_all('(imgs)=>imgs.every(i=>i.complete&&i.naturalWidth===320)'))
        progress.screenshot(path=str(OUT/'progress-page.png'),full_page=True)
        browser.close()
        report={'fixture':'synthetic public-schema fixture; not authoritative runtime','browser':'Chromium / SwiftShader software WebGL2; isolated inline document, synthetic fetch boundary; CSP and live host not verified','checks':checks,'passed':len(checks),'metrics':metrics,'pageErrors':errors}
        (OUT/'browser-results.json').write_text(json.dumps(report,indent=2))
        print(json.dumps({'passed':len(checks),'checks':checks,'metrics':{k:v for k,v in metrics.items() if k!='frameTimes'}},indent=2))
finally:pass
