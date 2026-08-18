import { useEffect, useMemo, useState } from 'react';
import { getTariHint } from './ai/mentor';
import { ConstructionScene } from './three/ConstructionScene';
import { useSimulationStore } from './state/store';
import { Briefing } from './ui/Briefing';
import { CrisisPanel } from './ui/CrisisPanel';
import { FinalReport } from './ui/FinalReport';
import { HUD } from './ui/HUD';
import { PPEInduction } from './ui/PPEInduction';
import { PresenterPanel } from './ui/PresenterPanel';
import { SiteTablet } from './ui/SiteTablet';

export function App() {
  const state = useSimulationStore();
  const [tabletOpen, setTabletOpen] = useState(false);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const isDemo = useMemo(() => new URLSearchParams(window.location.search).get('demo') === 'true', []);

  useEffect(() => {
    if (isDemo && !useSimulationStore.getState().started) state.dispatch({ type: 'START', mode: 'guided' });
  }, [isDemo]);

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
    if (!state.started || tabletOpen || ['intro', 'ppe', 'briefing', 'report'].includes(state.stage)) return;
    const interval = window.setInterval(() => state.dispatch({ type: 'TICK', minutes: 1 }), 2000);
    return () => window.clearInterval(interval);
  }, [state.started, state.stage, tabletOpen]);

  const showHint = () => { state.dispatch({ type: 'USE_HINT' }); setHint(getTariHint(useSimulationStore.getState())); };
  const start = (mode: 'guided' | 'assessment') => state.dispatch({ type: 'START', mode });
  const paused = tabletOpen || presenterOpen || state.stage === 'ppe' || state.stage === 'briefing' || state.stage === 'report';

  return (
    <main className="app-shell">
      <ConstructionScene paused={paused} />
      {!state.started && <section className="landing"><div className="landing-logo">TURNVE <span>BUILDSITE</span></div><h1>Your First Day on Site</h1><p>Enter a live construction project as a Construction Project Intern. Observe. Document. Communicate. Escalate. Deliver.</p><div className="landing-actions"><button className="primary" onClick={() => start('guided')}>Start Guided Internship</button><button onClick={() => start('assessment')}>Assessment Mode</button></div><small>Experience the job before your first day.</small></section>}
      {state.started && state.stage === 'intro' && <div className="cinematic-title"><span>TURNVE BUILDSITE</span><h1>Your First Day on Site</h1><p>Role: Construction Project Intern</p><button onClick={() => state.dispatch({ type: 'FINISH_INTRO' })}>Skip fly-through</button></div>}
      {state.started && !['intro', 'ppe', 'briefing', 'report'].includes(state.stage) && <HUD onOpenTablet={() => setTabletOpen(true)} onHint={showHint} />}
      {state.stage === 'ppe' && state.started && <PPEInduction />}
      {state.stage === 'briefing' && <Briefing />}
      {state.stage === 'crisis' && !tabletOpen && <CrisisPanel />}
      {state.stage === 'artifacts' && !tabletOpen && <div className="artifact-banner"><b>Crisis stabilized or handed off.</b><span>Open the Site Tablet and submit all four required artifacts.</span><button className="primary" onClick={() => setTabletOpen(true)}>Open Artifacts</button></div>}
      {tabletOpen && <SiteTablet onClose={() => setTabletOpen(false)} />}
      {presenterOpen && <PresenterPanel onClose={() => setPresenterOpen(false)} />}
      {hint && <div className="tari-toast"><div><b>TARI</b><span>Turnve Applied Readiness Intelligence</span></div><p>{hint}</p><button onClick={() => setHint(null)}>Got it</button></div>}
      {state.stage === 'report' && <FinalReport />}
      {isDemo && <div className="demo-badge">PITCH DEMO · Shift+P</div>}
    </main>
  );
}
