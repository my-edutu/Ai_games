import { useRef, useState } from 'react';
import { communicationHint } from '../simulation/experience';
import { scenario } from '../simulation/scenario';
import type { StakeholderId } from '../simulation/types';
import { useSimulationStore } from '../state/store';
import { interactableCatalog, scoreWeldingTrace } from '../worksite/workActions';
import type { WeldingStep, WorksiteInteractableId } from '../worksite/workActions';

const weldingSteps: { id: WeldingStep; label: string }[] = [
  { id: 'ppe', label: 'Safety & PPE check' },
  { id: 'prepare', label: 'Prepare practice coupon' },
  { id: 'pass', label: 'Practice travel control' },
  { id: 'inspect', label: 'Inspect practice bead' },
];

const weldingLesson: Partial<Record<WeldingStep, string>> = {
  idle: 'Start with safety. This is a simulated learning bay—not permission to carry out unsupervised live welding.',
  ppe: 'Before any arc, protect your eyes, face, hands and skin, check the work area and keep combustible material clear.',
  prepare: 'A stable practice coupon matters. Check that the piece is secure and the work area is ready before making a pass.',
  pass: 'Practice one steady forward travel. Drag from START to END without stopping short or backtracking; smooth travel produces a stronger score.',
  inspect: 'After the pass, inspect the practice bead for continuity and consistency. Visible irregularity is feedback for the next supervised attempt.',
};

function WeldingTracePractice() {
  const act = useSimulationStore((state) => state.dispatchWorkAction);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const mouseActive = useRef(false);
  const samples = useRef<number[]>([]);
  const completed = useRef(false);
  const [progress, setProgress] = useState(0);

  const positionFromClient = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const completeTrace = () => {
    if (completed.current || samples.current.length < 2) return;
    completed.current = true;
    pointerId.current = null;
    mouseActive.current = false;
    const quality = scoreWeldingTrace(samples.current);
    act({ type: 'WELDING_PASS', quality });
  };

  const record = (clientX: number) => {
    if (completed.current) return 1;
    const value = positionFromClient(clientX);
    samples.current.push(value);
    setProgress(value);
    if (value >= 0.9 && samples.current.length >= 3) completeTrace();
    return value;
  };

  const begin = (clientX: number) => {
    if (completed.current) return;
    samples.current = [];
    setProgress(0);
    record(clientX);
  };

  const finish = (clientX: number) => {
    if (completed.current) return;
    record(clientX);
    completeTrace();
  };

  return (
    <div className="weld-practice">
      <div className="weld-practice-label"><b>Travel-control practice</b><span>one steady swipe</span></div>
      <div
        ref={trackRef}
        className="weld-trace-track"
        role="button"
        tabIndex={0}
        aria-label="Practice welding pass from start to end"
        onPointerDown={(event) => {
          pointerId.current = event.pointerId;
          completed.current = false;
          try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer capture is optional */ }
          begin(event.clientX);
        }}
        onPointerMove={(event) => {
          if (completed.current) return;
          const activePointer = pointerId.current === event.pointerId || (event.buttons & 1) === 1 || event.pointerType === 'touch';
          if (!activePointer) return;
          if (pointerId.current === null) pointerId.current = event.pointerId;
          record(event.clientX);
        }}
        onPointerUp={(event) => {
          if (pointerId.current === event.pointerId && !completed.current) finish(event.clientX);
          pointerId.current = null;
        }}
        onPointerCancel={() => { pointerId.current = null; mouseActive.current = false; samples.current = []; completed.current = false; setProgress(0); }}
        onMouseDown={(event) => {
          if (completed.current) return;
          mouseActive.current = true;
          begin(event.clientX);
        }}
        onMouseMove={(event) => {
          if (completed.current || (!mouseActive.current && (event.buttons & 1) !== 1)) return;
          mouseActive.current = true;
          record(event.clientX);
        }}
        onMouseUp={(event) => {
          if (mouseActive.current && !completed.current) finish(event.clientX);
          mouseActive.current = false;
        }}
        onMouseLeave={(event) => {
          if (mouseActive.current && (event.buttons & 1) === 1 && !completed.current) record(event.clientX);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            completed.current = true;
            act({ type: 'WELDING_PASS', quality: 85 });
          }
        }}
      >
        <span className="weld-start">START</span><i className="weld-guide" /><span className="weld-end">END</span>
        <span className="weld-torch" style={{ left: `${progress * 100}%` }}>✦</span>
      </div>
      <small>Press near START and drag continuously to END. Backtracking and stopping short reduce the practice score.</small>
    </div>
  );
}

function WeldingActions() {
  const work = useSimulationStore((state) => state.workActions);
  const act = useSimulationStore((state) => state.dispatchWorkAction);
  const step = work.weldingStep;
  const button = step === 'idle'
    ? ['Begin guided practice', 'START_WELDING'] as const
    : step === 'ppe'
      ? ['Confirm welding PPE & clear bay', 'WELDING_PPE'] as const
      : step === 'prepare'
        ? ['Secure and check practice coupon', 'WELDING_PREPARE'] as const
        : step === 'inspect'
          ? ['Inspect practice bead', 'WELDING_INSPECT'] as const
          : null;
  const activeIndex = weldingSteps.findIndex((item) => item.id === step);

  return (
    <div className="welding-training">
      <div className="action-score"><span>Practical performance</span><b>{work.weldingScore}/100</b></div>
      <div className="training-sequence">{weldingSteps.map((item, index) => {
        const done = step === 'complete' || index < activeIndex;
        const active = item.id === step;
        return <div key={item.id} className={done ? 'done' : active ? 'active' : ''}><i>{done ? '✓' : index + 1}</i><span>{item.label}</span></div>;
      })}</div>
      {weldingLesson[step] && <p className="welding-lesson">{weldingLesson[step]}</p>}
      {step === 'pass' && <WeldingTracePractice />}
      {button && <button className="primary action-primary" onClick={() => act({ type: button[1] })}>{button[0]}</button>}
      {work.weldingPassQuality !== null && step !== 'pass' && <div className="pass-quality"><span>Travel-control score</span><b>{work.weldingPassQuality}/100</b></div>}
      {work.weldingComplete && <div className="action-complete">✓ Welding practice learning sequence completed with a recorded travel-control score.</div>}
    </div>
  );
}

function BrickActions({ target }: { target: 'source' | 'drop' }) {
  const work = useSimulationStore((state) => state.workActions);
  const act = useSimulationStore((state) => state.dispatchWorkAction);
  const close = useSimulationStore((state) => state.setSelectedInteractable);
  const canPick = target === 'source' && !work.carrying && !work.materialHandlingComplete && work.bricksRemaining > 0;
  const canPlace = target === 'drop' && work.carrying === 'brick' && !work.materialHandlingComplete;
  const pick = () => { act({ type: 'PICK_BRICK' }); close(null); };
  const place = () => { act({ type: 'PLACE_BRICK' }); close(null); };
  return (
    <div className="brick-training">
      <div className="action-score"><span>Material handling</span><b>{work.materialHandlingScore}/100</b></div>
      <div className="brick-progress"><span><b>{work.bricksPlaced}</b>/3 delivered</span><div><i style={{ width: `${Math.min(100, (work.bricksPlaced / 3) * 100)}%` }} /></div></div>
      {work.carrying === 'brick' && <div className="carrying-callout">You are carrying one brick. Move to the marked laydown point.</div>}
      {canPick && <button className="primary action-primary" onClick={pick}>Pick up one brick</button>}
      {canPlace && <button className="primary action-primary" onClick={place}>Place carried brick</button>}
      {target === 'source' && work.carrying && <p className="action-help">Carry the current brick to the marked laydown point before picking up another.</p>}
      {target === 'drop' && !work.carrying && !work.materialHandlingComplete && <p className="action-help">Go to the brick stack, tap it and pick up a single brick first.</p>}
      {work.materialHandlingComplete && <div className="action-complete">✓ Material-handling practice completed with three safe single-brick transfers.</div>}
    </div>
  );
}

function PersonSheet({ id }: { id: StakeholderId }) {
  const state = useSimulationStore();
  const person = scenario.stakeholders.find((item) => item.id === id);
  if (!person) return null;
  const cue = communicationHint(id, state.stage, state.learnerName);
  const relationship = state.stakeholders[id];
  const talk = () => {
    state.dispatch({ type: 'CONTACT_STAKEHOLDER', stakeholderId: id, topic: cue.suggestedTopic });
    state.setSelectedInteractable(null);
  };
  return <>
    <header><div><span className="action-type">PERSON · {person.role}</span><h2>{person.name}</h2></div><button className="sheet-close" aria-label="Close object details" onClick={() => state.setSelectedInteractable(null)}>×</button></header>
    <p>{cue.message}</p>
    <div className="object-meta"><span>Trust <b>{relationship.trust}</b></span><span>Focus <b>{person.caresAbout.slice(0, 2).join(' · ')}</b></span></div>
    <button className="primary action-primary" onClick={talk}>Talk to {person.name.split(' ')[0]}</button>
  </>;
}

function HazardSheet({ id }: { id: string }) {
  const state = useSimulationStore();
  const hazard = scenario.hazards.find((item) => item.id === id);
  if (!hazard) return null;
  const item = state.hazards[id];
  const next = item.status === 'unseen' ? 'Inspect issue' : !item.evidenceCaptured ? 'Capture evidence' : item.status === 'observed' ? 'Report to HSE' : item.status !== 'resolved' ? 'Record correction' : null;
  const run = () => {
    if (item.status === 'unseen') state.dispatch({ type: 'DISCOVER_HAZARD', hazardId: id });
    else if (!item.evidenceCaptured) state.dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: id });
    else if (item.status === 'observed') state.dispatch({ type: 'REPORT_HAZARD', hazardId: id });
    else if (item.status !== 'resolved') state.dispatch({ type: 'RESOLVE_HAZARD', hazardId: id });
  };
  return <>
    <header><div><span className={`action-type risk-${hazard.risk}`}>{hazard.risk.toUpperCase()} · {hazard.category.toUpperCase()}</span><h2>{hazard.label}</h2></div><button className="sheet-close" aria-label="Close object details" onClick={() => state.setSelectedInteractable(null)}>×</button></header>
    <p>{hazard.description}</p>
    <div className="object-meta"><span>Location <b>{hazard.location}</b></span><span>Status <b>{item.status}</b></span></div>
    {next && <button className="primary action-primary" onClick={run}>{next}</button>}
    {item.status === 'resolved' && <div className="action-complete">✓ Issue recorded as corrected.</div>}
  </>;
}

export function ObjectActionSheet() {
  const selected = useSimulationStore((state) => state.selectedInteractable);
  const setSelected = useSimulationStore((state) => state.setSelectedInteractable);
  if (!selected) return null;

  if (selected.startsWith('person:')) return <aside className="object-action-sheet person-sheet"><PersonSheet id={selected.slice(7) as StakeholderId} /></aside>;
  if (selected.startsWith('hazard:')) return <aside className="object-action-sheet hazard-sheet"><HazardSheet id={selected.slice(7)} /></aside>;

  const object = interactableCatalog[selected as WorksiteInteractableId];
  if (!object) return null;
  return (
    <aside className="object-action-sheet">
      <header><div><span className="action-type">{object.category.toUpperCase()}</span><h2>{object.name}</h2></div><button className="sheet-close" aria-label="Close object details" onClick={() => setSelected(null)}>×</button></header>
      <p>{object.description}</p>
      {selected === 'brick-stack' && <BrickActions target="source" />}
      {selected === 'brick-drop' && <BrickActions target="drop" />}
      {selected === 'welding-bay' && <WeldingActions />}
    </aside>
  );
}

export function PracticalStatus() {
  const work = useSimulationStore((state) => state.workActions);
  if (!work.carrying && (work.weldingStep === 'idle' || work.weldingStep === 'complete')) return null;
  return <div className="practical-status" aria-live="polite">{work.carrying === 'brick' ? <><b>Carrying</b><span>1 brick · move to laydown</span></> : <><b>Welding practice</b><span>{work.weldingScore}% complete</span></>}</div>;
}
