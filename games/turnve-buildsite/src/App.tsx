import { useEffect, useMemo, useState } from 'react';
import { getTariHint } from './ai/mentor';
import { SiteAudio } from './audio/SiteAudio';
import { setConstructionAudioEnabled, unlockConstructionAudio } from './audio/soundscape';
import { setVoiceEnabled, speakVoice } from './audio/voice';
import { ConstructionScene } from './three/ConstructionScene';
import { useSimulationStore } from './state/store';
import { Briefing } from './ui/Briefing';
import { CommunicationCoach } from './ui/CommunicationCoach';
import { CrisisPanel } from './ui/CrisisPanel';
import { FinalReport } from './ui/FinalReport';
import { HUD } from './ui/HUD';
import { NameGate } from './ui/NameGate';
import { ObjectActionSheet, PracticalStatus } from './ui/ObjectActionSheet';
import { PPEInduction } from './ui/PPEInduction';
import { PresenterPanel } from './ui/PresenterPanel';
import { SiteTablet } from './ui/SiteTablet';
import { SkillCoach } from './ui/SkillCoach';
import { SkillMentorPrompt } from './ui/SkillMentorPrompt';
import { TouchControls } from './ui/TouchControls';
import { VoiceGuide } from './ui/VoiceGuide';

const nonNavigationStages = ['intro', 'ppe', 'briefing', 'artifacts', 'report'];

export function App() {
  const state = useSimulationStore();
  const [tabletOpen, setTabletOpen] = useState(false);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDemo = params.get('demo') === 'true';
  const automationLiteRender = Boolean(typeof navigator !== 'undefined' && navigator.webdriver && params.get('render') === 'lite');
  const skillLessonActive = state.skillMentor.phase !== 'idle';

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.shiftKey && event.code === 'KeyP' && !skillLessonActive) { event.preventDefault(); state.setSelectedInteractable(null); setPresenterOpen((open) => !open); return; }
      if (event.code === 'Tab' && state.started && !skillLessonActive && !['intro', 'ppe', 'briefing', 'report'].includes(state.stage)) { event.preventDefault(); state.setSelectedInteractable(null); setTabletOpen((open) => !open); }
      if (event.code === 'Escape') {
        state.setSelectedInteractable(null);
        setTabletOpen(false);
        setPresenterOpen(false);
        setHint(null);
        if (skillLessonActive) state.dispatchSkillMentor({ type: 'EXIT_SKILL' });
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [state.started, state.stage, state.setSelectedInteractable, state.dispatchSkillMentor, skillLessonActive]);

  useEffect(() => {
    const shouldReleasePointer = tabletOpen || presenterOpen || skillLessonActive || nonNavigationStages.includes(state.stage);
    if (shouldReleasePointer && document.pointerLockElement) document.exitPointerLock();
  }, [tabletOpen, presenterOpen, skillLessonActive, state.stage]);

  useEffect(() => {
    if (!state.learnerName || !state.started || tabletOpen || skillLessonActive || ['intro', 'ppe', 'briefing', 'report'].includes(state.stage)) return;
    const interval = window.setInterval(() => state.dispatch({ type: 'TICK', minutes: 1 }), 2000);
    return () => window.clearInterval(interval);
  }, [state.learnerName, state.started, state.stage, tabletOpen, skillLessonActive]);

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
  const handleNameEntered = (name: string) => {
    setVoiceEnabled(true);
    enableSound();
    speakVoice(`Welcome to Turnve BuildSite, ${name}. Choose Guided Internship or Assessment Mode when you are ready to enter the site.`);
  };
  const showHint = () => { state.dispatch({ type: 'USE_HINT' }); setHint(getTariHint(useSimulationStore.getState())); };
  const start = (mode: 'guided' | 'assessment') => { enableSound(); state.dispatch({ type: 'START', mode }); };
  const finishIntro = () => { enableSound(); state.dispatch({ type: 'FINISH_INTRO' }); };
  const openTablet = () => { state.setSelectedInteractable(null); setTabletOpen(true); };
  const paused = !state.learnerName || tabletOpen || presenterOpen || skillLessonActive || nonNavigationStages.includes(state.stage);
  const navigationActive = state.started && !paused;
  const siteAudioActive = Boolean(state.learnerName && state.started && !tabletOpen && !presenterOpen && !['intro', 'ppe', 'briefing', 'report'].includes(state.stage));

  return (
    <main className={`app-shell ${skillLessonActive ? 'skill-lesson-active' : ''}`}>
      {automationLiteRender ? (
        <div
          className="scene-shell scene-shell-lite"
          aria-label="3D construction site"
          data-look-control="drag"
          data-weather={state.weather}
          data-skill-focus="none"
          data-render-quality="mobile"
          data-render-mode="automation-lite"
          data-realism="enhanced"
        >
          <div className="drag-look-hint" aria-hidden="true">Drag to look · WASD to move · Tap objects to interact</div>
        </div>
      ) : <ConstructionScene paused={paused} />}
      <SiteAudio enabled={soundEnabled} active={siteAudioActive} />
      <VoiceGuide enabled={soundEnabled} />
      {!state.started && <section className="landing"><div className="landing-kicker"><span>TURNVE BUILDSITE</span><b>LIVE WORK SIMULATION</b></div><h1>Your First Day on Site</h1><p>Enter a live construction project as a Construction Project Intern. Move through the site, talk to people, learn from skilled workers, perform practical work, manage risk and turn your decisions into professional evidence.</p><div className="landing-proof"><div><b>Move</b><span>explore the live site</span></div><div><b>Talk</b><span>meet the project team</span></div><div><b>Learn</b><span>train with site mentors</span></div><div><b>Prove</b><span>build readiness evidence</span></div></div><div className="landing-actions"><button className="primary" onClick={() => start('guided')}>Start Guided Internship</button><button onClick={() => start('assessment')}>Assessment Mode</button></div><div className="mode-note"><span><b>Guided</b> — voice onboarding, skill mentors, contextual hints and evidence-assisted drafting</span><span><b>Assessment</b> — reduced guidance and independent decisions</span></div><small>Experience the job before your first day.</small></section>}
      {state.started && state.stage === 'intro' && <div className="cinematic-title"><span>TURNVE BUILDSITE</span><h1>{state.learnerName}, welcome to site.</h1><p>Construction Project Intern · Prepare the slab for a safe, approved and documented concrete pour.</p><button onClick={finishIntro}>Skip fly-through</button></div>}
      {state.started && !['intro', 'ppe', 'briefing', 'report'].includes(state.stage) && !skillLessonActive && <HUD onOpenTablet={openTablet} onHint={showHint} soundEnabled={soundEnabled} onToggleSound={toggleSound} />}
      <TouchControls active={navigationActive} />
      {navigationActive && !state.selectedInteractable && !state.nearbySkillMentor && <CommunicationCoach />}
      {navigationActive && !state.selectedInteractable && <SkillMentorPrompt />}
      {navigationActive && <PracticalStatus />}
      {navigationActive && <ObjectActionSheet />}
      {skillLessonActive && <SkillCoach />}
      {state.stage === 'ppe' && state.started && <PPEInduction />}
      {state.stage === 'briefing' && <Briefing />}
      {state.stage === 'crisis' && !tabletOpen && !skillLessonActive && <CrisisPanel />}
      {state.stage === 'artifacts' && !tabletOpen && !skillLessonActive && <div className="artifact-banner"><div><b>Field decision handed off.</b><span>{state.learnerName}, finish the shift by turning your evidence into usable project records.</span></div><button className="primary" onClick={openTablet}>Open Work</button></div>}
      {tabletOpen && <SiteTablet onClose={() => setTabletOpen(false)} />}
      {presenterOpen && <PresenterPanel onClose={() => setPresenterOpen(false)} />}
      {hint && <div className="tari-toast"><div><b>TARI</b><span>Turnve Applied Readiness Intelligence</span></div><p>{state.learnerName ? `${state.learnerName}, ${hint}` : hint}</p><button onClick={() => setHint(null)}>Got it</button></div>}
      {state.stage === 'report' && <FinalReport />}
      {!state.learnerName && <NameGate onEnter={handleNameEntered} />}
      {isDemo && <div className="demo-badge">PITCH DEMO · Shift+P</div>}
    </main>
  );
}