import { useEffect, useRef, useState } from 'react';
import { buildOnboardingVoice, buildStakeholderGreeting, setVoiceEnabled, speakVoice, stopVoice } from '../audio/voice';
import type { StakeholderId } from '../simulation/types';
import { useSimulationStore } from '../state/store';

export function VoiceGuide({ enabled }: { enabled: boolean }) {
  const learnerName = useSimulationStore((state) => state.learnerName);
  const started = useSimulationStore((state) => state.started);
  const stage = useSimulationStore((state) => state.stage);
  const nearbyStakeholder = useSimulationStore((state) => state.nearbyStakeholder);
  const spokenStages = useRef(new Set<string>());
  const greeted = useRef(new Set<StakeholderId>());
  const [caption, setCaption] = useState('');

  useEffect(() => {
    setVoiceEnabled(enabled);
    if (!enabled) {
      stopVoice();
      setCaption('');
    }
    return () => setVoiceEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !started || !learnerName) return;
    const key = `${stage}:${learnerName}`;
    const text = buildOnboardingVoice(stage, learnerName);
    if (!text || spokenStages.current.has(key)) return;
    spokenStages.current.add(key);
    speakVoice(text, { onStart: setCaption, onEnd: () => setCaption('') });
  }, [enabled, learnerName, stage, started]);

  useEffect(() => {
    if (!enabled || !started || !learnerName || !nearbyStakeholder || greeted.current.has(nearbyStakeholder)) return;
    greeted.current.add(nearbyStakeholder);
    const text = buildStakeholderGreeting(nearbyStakeholder, learnerName);
    speakVoice(text, { onStart: setCaption, onEnd: () => setCaption('') });
  }, [enabled, learnerName, nearbyStakeholder, started]);

  if (!caption) return null;
  return <div className="voice-caption" role="status" aria-live="polite"><span>VOICE GUIDE</span><p>{caption}</p></div>;
}
