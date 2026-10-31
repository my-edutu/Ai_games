"""UI-only browser contract tests. Campaign, audio and WebGL are NOT exercised.

Run: python tests/ui/test_thousand_floors_interface.py
Test-only requirements: Python 3.10+, playwright, Chromium (CHROMIUM_PATH optional).
The HTML/CSS/module are real. Runtime modules are omitted and app-owned output
nodes are set by fixtures. No simulation, GPU or gameplay correctness claim.
"""
import argparse, os, re, unittest
from shutil import which
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--target', default='public/ai-vs-1000-floors')
args, remaining = parser.parse_known_args()
TARGET = ROOT / args.target

class InterfaceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or which('chromium'), headless=True, args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width':1440,'height':900})
        # Explicit UI harness: no claim to execute the simulation or renderer.
        self.page = self.context.new_page()
        self.errors=[]
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        html=(TARGET/'index.html').read_text()
        html=re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)
        css=(TARGET/'styles.css').read_text() if (TARGET/'styles.css').exists() else ''
        html=html.replace('<link rel="stylesheet" href="./styles.css">','<style>'+css+'</style>')
        self.page.set_content(html)
        if (TARGET/'interface.js').exists():
            self.page.add_script_tag(type='module',content=(TARGET/'interface.js').read_text())
        self.page.evaluate('''() => {
          document.querySelector('#loading-state').hidden=true;
          document.querySelector('#hud').inert=false;
          document.querySelector('#pause-button').disabled=false;
          window.receivedShortcuts=[];
          window.addEventListener('keydown',event=>{
            if (!document.querySelector('#settings-dialog').open && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName) && ['Space','KeyC','KeyM'].includes(event.code))
              window.receivedShortcuts.push(event.code);
          });
          document.querySelector('#settings-button').addEventListener('click',()=>document.querySelector('#settings-dialog').showModal());
          document.querySelector('#clean-feed').addEventListener('change', e=>document.body.classList.toggle('clean-feed',e.target.checked));
        }''')
        self.page.wait_for_timeout(60)

    def tearDown(self):
        self.assertEqual(self.errors, [], 'No browser module exceptions')
        self.context.close()

    def journey(self):
        self.assertEqual(self.page.locator('#journey-button').count(),1,'Journey entry is missing')
        self.page.locator('#journey-button').click()
        self.assertTrue(self.page.locator('#journey-dialog').evaluate('d=>d.open'))

    def test_existing_runtime_contract(self):
        for element in ['game-canvas', 'hud', 'run-state', 'district-index', 'floor-number', 'district-name', 'progress-fill', 'checkpoint-label', 'milestone', 'intent-caption', 'intent', 'pause-button', 'pause-icon', 'pause-label', 'speed-button', 'speed-label', 'camera-button', 'camera-label', 'sound-button', 'sound-waves', 'sound-label', 'settings-button', 'save-note', 'loading-state', 'state-title', 'state-message', 'retry-button', 'fresh-button', 'settings-dialog', 'settings-title', 'reduced-motion', 'quality-select', 'clean-feed', 'recovery-description', 'recover-button', 'restart-button', 'restart-confirmation', 'cancel-restart', 'confirm-restart']:
            self.assertEqual(self.page.locator('#'+element).count(),1,element)
        self.assertEqual(self.page.locator('[role=progressbar][aria-label="Floors cleared"]').count(),1)

    def test_journey_reads_current_progress_and_checkpoint(self):
        self.journey()
        self.page.evaluate('''() => {
          document.querySelector('#floor-number').textContent='417';
          document.querySelector('#district-name').textContent='Coral Archive';
          document.querySelector('#district-index').textContent='05 — 10';
          document.querySelector('#checkpoint-label').textContent='Checkpoint · Floor 401';
          document.querySelector('.progress-track').setAttribute('aria-valuenow','416');
        }''')
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.locator('#journey-floor').inner_text(),'417')
        self.assertEqual(self.page.locator('#journey-cleared').inner_text(),'416')
        self.assertEqual(self.page.locator('#journey-district').inner_text(),'Coral Archive')
        self.assertIn('401', self.page.locator('#journey-checkpoint').inner_text())
        self.assertEqual(self.page.locator('#journey-percent').inner_text(),'41.6%')
        self.assertEqual(self.page.locator('#district-route [data-state=cleared]').count(),4)
        self.assertEqual(self.page.locator('#district-route [aria-current=step]').count(),1)

    def test_modal_shortcuts_are_isolated_and_escape_restores_focus(self):
        self.journey()
        self.page.keyboard.press('c'); self.page.keyboard.press('m')
        self.assertEqual(self.page.evaluate('window.receivedShortcuts'),[])
        self.page.keyboard.press('Escape')
        self.assertFalse(self.page.locator('#journey-dialog').evaluate('d=>d.open'))
        self.assertEqual(self.page.evaluate('document.activeElement.id'),'journey-button')
        self.page.locator('#journey-button').evaluate('b=>b.blur()')
        self.page.keyboard.press('c')
        self.assertEqual(self.page.evaluate('window.receivedShortcuts'),['KeyC'])

    def test_completion_is_based_on_cleared_not_arrival(self):
        self.page.evaluate('''() => {
          document.querySelector('#floor-number').textContent='1000';
          document.querySelector('.progress-track').setAttribute('aria-valuenow','999');
        }''')
        self.journey()
        self.assertEqual(self.page.locator('#journey-percent').inner_text(),'99.9%')
        self.assertNotIn('complete',self.page.locator('#journey-summary').inner_text().lower())
        self.page.locator('.progress-track').evaluate("n=>n.setAttribute('aria-valuenow','1000')")
        self.page.wait_for_timeout(60)
        self.assertEqual(self.page.locator('#journey-percent').inner_text(),'100%')
        self.assertIn('complete',self.page.locator('#journey-summary').inner_text().lower())
        self.assertEqual(self.page.locator('#district-route [data-state=cleared]').count(),10)
        self.assertEqual(self.page.locator('#district-route [aria-current=step]').count(),0)

    def test_failure_closes_journey_and_disables_entry(self):
        self.journey()
        self.page.evaluate('''() => {
          document.querySelector('#loading-state').hidden=false;
          document.querySelector('#hud').inert=true;
          document.querySelector('#pause-button').disabled=true;
          document.querySelector('#retry-button').hidden=false;
          document.querySelector('#retry-button').focus();
        }''')
        self.page.wait_for_timeout(60)
        self.assertFalse(self.page.locator('#journey-dialog').evaluate('d=>d.open'))
        self.assertTrue(self.page.locator('#journey-button').is_disabled())
        self.assertTrue(self.page.locator('#retry-button').is_visible())
        self.assertEqual(self.page.evaluate('document.activeElement.id'),'retry-button')

    def test_missing_progress_is_unavailable_not_zero(self):
        self.page.locator('.progress-track').evaluate("n=>n.removeAttribute('aria-valuenow')")
        self.journey()
        self.assertEqual(self.page.locator('#journey-percent').inner_text(),'—')
        self.assertEqual(self.page.locator('#journey-cleared').inner_text(),'—')
        self.assertEqual(self.page.locator('#district-route [data-state=cleared]').count(),0)

    def test_responsive_layout_has_no_overflow_or_small_controls(self):
        for width,height in [(320,568),(390,844),(844,390),(568,320),(1440,900)]:
            with self.subTest(viewport=(width,height)):
                self.page.set_viewport_size({'width':width,'height':height})
                self.page.evaluate('''() => {
                  document.querySelector('#district-name').textContent='A very long district name that must remain legible on a phone';
                  document.querySelector('#intent').textContent='Waiting for the next safe crossing before the explorer advances toward the next checkpoint.';
                  document.querySelector('#save-note').textContent='Progress is temporary · storage unavailable';
                }''')
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
                for id in ['pause-button','speed-button','camera-button','sound-button','settings-button','journey-button']:
                    box=self.page.locator('#'+id).bounding_box()
                    self.assertIsNotNone(box,id)
                    self.assertGreaterEqual(box['width'],44,id)
                    self.assertGreaterEqual(box['height'],44,id)
                    self.assertGreaterEqual(box['x'],0,id)
                    self.assertLessEqual(box['x']+box['width'],width+.1,id)
                    self.assertLessEqual(box['y']+box['height'],height+.1,id)
                progress=self.page.locator('.progress').bounding_box()
                controls=self.page.locator('.controls').bounding_box()
                self.assertLessEqual(progress['y']+progress['height'],height*.46)
                self.assertGreaterEqual(controls['y'],height*.64)
                note=self.page.locator('#save-note').bounding_box()
                intent=self.page.locator('.intent-block').bounding_box()
                overlap=not (note['x']+note['width']<=intent['x'] or intent['x']+intent['width']<=note['x'] or note['y']+note['height']<=intent['y'] or intent['y']+intent['height']<=note['y'])
                self.assertFalse(overlap,'Save warning and intent must not overlap')

    def test_clean_feed_keeps_settings_reachable(self):
        self.page.locator('#settings-button').click()
        self.page.locator('#clean-feed').check()
        self.page.get_by_role('button',name='Close settings',exact=True).click()
        self.assertFalse(self.page.locator('.progress').is_visible())
        self.assertFalse(self.page.locator('#journey-button').is_visible())
        self.assertTrue(self.page.locator('#settings-button').is_visible())
        self.page.locator('#settings-button').click()
        self.page.locator('#clean-feed').uncheck()
        self.page.get_by_role('button',name='Close settings',exact=True).click()
        self.assertTrue(self.page.locator('.progress').is_visible())

    def test_accessible_settings_switches_and_modal_button_keyboard(self):
        self.page.locator('#settings-button').click()
        for id in ['reduced-motion','clean-feed']:
            control=self.page.locator('#'+id)
            self.assertEqual(control.get_attribute('role'),'switch')
            control.focus(); self.page.keyboard.press('Space')
            self.assertTrue(control.is_checked())
            self.page.keyboard.press('Space')
            self.assertFalse(control.is_checked())
        self.page.keyboard.press('Escape')
        self.journey()
        self.page.get_by_role('button',name='Close journey',exact=True).focus()
        self.page.keyboard.press('Space')
        self.assertFalse(self.page.locator('#journey-dialog').evaluate('d=>d.open'))
        self.assertEqual(self.page.evaluate('window.receivedShortcuts'),[])

    def test_reduced_motion_and_dialog_small_height(self):
        self.page.emulate_media(reduced_motion='reduce')
        self.page.set_viewport_size({'width':568,'height':320})
        self.journey()
        self.assertEqual(self.page.locator('.live-dot').evaluate('n=>getComputedStyle(n).animationName'),'none')
        box=self.page.locator('#journey-dialog').bounding_box()
        self.assertGreaterEqual(box['y'],0)
        self.assertLessEqual(box['y']+box['height'],320)
        self.assertTrue(self.page.get_by_role('button',name='Close journey',exact=True).is_visible())

if __name__=='__main__':
    unittest.main(argv=['test_ui.py']+remaining,verbosity=2)
