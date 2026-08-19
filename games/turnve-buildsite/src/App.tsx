import { useEffect, useMemo, useState } from 'react';
import { getTariHint } from './ai/mentor';
import { SiteAudio } from './audio/SiteAudio';
import { setConstructionAudioEnabled, unlockConstructionAudio } from './audio/soundscape';
import { ConstructionScene } from './three/ConstructionScene';
import { useSimulationStore } from './state/store';
import { Briefing } from './ui/Briefing';
import { CommunicationCoach } from './ui/CommunicationCoach';
import { CrisisPanel } from './ui/CrisisPanel';
import { FinalReport } from './ui/FinalReport';
import { HUD } from './ui/HUD';
import { NameGate } from './ui/NameGate';
import { PPEInduction } from './ui/PPEInduction';
import { PresenterPanel } from './ui/PresenterPanel';
import { SiteTablet } from './ui/SiteTablet';
import { TouchControls } from './ui/TouchControls';

const nonNavigationStages = ['intro', 'ppe', 'briefing', 'artifacts', 'report'];

export function App() {
  const state = useSimulationStore();
  const [tabletOpen, setTabletOpen] = useState(false);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const isDemo = useMemo(() => new URLSearchParams(window.location.search).get('demo') === 'true', []);

  useEffect(() => {
    if (isDemo && state.learnerName && !useSimulationStore.getState().started) state.dispatch({ type: 'START', mode: 'guided' });
  }, [isDemo, state.learnerName]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.shiftKey && event.code === 'KeyP') { event.preventDefault(); setPresenterOpen((open) => !open); return; }
      if (event.code === 'Tab' && state.started && !['intro', 'ppe', 'briefing', 'report'].includes(state.stage)) { event.preventDefault(); setTabletOpen((open) => !open); }
      if (event.code === 'Escape') { setTabletOpen(false); setPresenterOpen(false); setHint(null); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [state.started, state.stage]);

  useEffect(() => {
    const shouldReleasePointer = tabletOpen || presenterOpen || nonNavigationStages.includes(state.stage);
    if (shouldReleasePointer && document.pointerLockElement) document.exitPointerLock();
  }, [tabletOpen, presenterOpen, state.stage]);

  useEffect(() => {
    if (!state.learnerName || !state.started || tabletOpen || ['intro', 'ppe', 'briefing', 'report'].includes(state.stage)) return;
    const interval = window.setInterval(() => state.dispatch({ type: 'TICK', minutes: 1 }), 2000);
    return () => window.clearInterval(interval);
  }, [state.learnerName, state.started, state.stage, tabletOpen]);

  const enableSound = () => {
    void unlockConstructionAudio().then((enabled) => {
      if (enabled) {
        setConstructionAudioEnabled(true);
        setSoundEnabled(true);
      }
    });
  };
  const toggleSound = () => {
    if (soundEnabled) {
      setConstructionAudioEnabled(false);
      setSoundEnabled(false);
    } else enableSound();
  };
  const showHint = () => { state.dispatch({ type: 'USE_HINT' }); setHint(getTariHint(useSimulationStore.getState())); };
  const start = (mode: 'guided' | 'assessment') => { enableSound(); state.dispatch({ type: 'START', mode }); };
  const finishIntro = () => { enableSound(); state.dispatch({ type: 'FINISH_INTRO' }); };
  const paused = !state.learnerName || tabletOpen || presenterOpen || nonNavigationStages.includes(state.stage);

  return (
    <main className="app-shell">
      <ConstructionScene paused={paused} />
      <SiteAudio enabled={soundEnabled} active={state.started && !paused} />
      {!state.started && <section className="landing"><div className="landing-kicker"><span>TURNVE BUILDSITE</span><b>LIVE WORK SIMULATION</b></div><h1>Your First Day on Site</h1><p>Enter a live construction project as a Construction Project Intern. Inspect real site conditions, review drawings, manage stakeholder pressure, create workplace artifacts and see the consequences of your judgment.</p><div className="landing-proof"><div><b>10–15</b><span>minute guided experience</span></div><div><b>10</b><span>competencies assessed</span></div><div><b>4</b><span>professional artifacts</span></div><div><b>1</b><span>live consequence engine</span></div></div><div className="landing-actions"><button className="primary" onClick={() => start('guided')}>Start Guided Internship</button><button onClick={() => start('assessment')}>Assessment Mode</button></div><div className="mode-note"><span><b>Guided</b> — objective markers, TARI hints and evidence-assisted drafting</span><span><b>Assessment</b> — reduced guidance, independent decisions and stricter scoring</span></div><small>Experience the job before your first day.</small></section>}
      {state.started && state.stage === 'intro' && <div className="cinematic-title"><span>TURNVE BUILDSITE</span><h1>{state.learnerName}, welcome to site.</h1><p>Role: Construction Project Intern · Mission: prepare the slab for a safe, approved and documented concrete pour</p><button onClick={finishIntro}>Skip fly-through</button></div>}
      {state.started && !['intro', 'ppe', 'briefing', 'report'].includes(state.stage) && <HUD onOpenTablet={() => setTabletOpen(true)} onHint={showHint} soundEnabled={soundEnabled} onToggleSound={toggleSound} />}
      <TouchControls active={state.started && !paused} />
      {state.started && !paused && <CommunicationCoach />}
      {state.stage === 'ppe' && state.started && <PPEInduction />}
      {state.stage === 'briefing' && <Briefing />}
      {state.stage === 'crisis' && !tabletOpen && <CrisisPanel />}
      {state.stage === 'artifacts' && !tabletOpen && <div className="artifact-banner"><div><b>Crisis stabilized or handed off.</b><span>{state.learnerName}, your work is not finished until the evidence becomes usable project records.</span></div><button className="primary" onClick={() => setTabletOpen(true)}>Open Artifacts</button></div>}
      {tabletOpen && <SiteTablet onClose={() => setTabletOpen(false)} />}
      {presenterOpen && <PresenterPanel onClose={() => setPresenterOpen(false)} />}
      {hint && <div className="tari-toast"><div><b>TARI</b><span>Turnve Applied Readiness Intelligence</span></div><p>{state.learnerName ? `${state.learnerName}, ${hint}` : hint}</p><button onClick={() => setHint(null)}>Got it</button></div>}
      {state.stage === 'report' && <FinalReport />}
      {!state.learnerName && <NameGate />}
      {isDemo && <div className="demo-badge">PITCH DEMO · Shift+P</div>}
    </main>
  );
}
