import { useEffect, useRef, useState } from 'react';
import { buildOnboardingVoice, buildSkillMentorIntro, buildSkillStepVoice, buildStakeholderGreeting, setVoiceEnabled, speakVoice, stopVoice } from '../audio/voice';
import type { StakeholderId } from '../simulation/types';
import { skillDefinitions } from '../skillMentor/skills';
import type { SkillId } from '../skillMentor/types';
import { useSimulationStore } from '../state/store';

export function VoiceGuide({ enabled }: { enabled: boolean }) {
  const learnerName = useSimulationStore((state) => state.learnerName);
  const started = useSimulationStore((state) => state.started);
  const stage = useSimulationStore((state) => state.stage);
  const nearbyStakeholder = useSimulationStore((state) => state.nearbyStakeholder);
  const nearbySkillMentor = useSimulationStore((state) => state.nearbySkillMentor);
  const skillMentor = useSimulationStore((state) => state.skillMentor);
  const spokenStages = useRef(new Set<string>());
  const greeted = useRef(new Set<StakeholderId>());
  const greetedMentors = useRef(new Set<SkillId>());
  const spokenSkillMoments = useRef(new Set<string>());
  const [caption, setCaption] = useState('');

  useEffect(() => {
    setVoiceEnabled(enabled);
    if (!enabled) {
      stopVoice();
      setCaption('');
    }
  }, [enabled]);

  useEffect(() => () => stopVoice(), []);

  useEffect(() => {
    if (!enabled || !started || !learnerName || skillMentor.phase !== 'idle') return;
    const key = `${stage}:${learnerName}`;
    const text = buildOnboardingVoice(stage, learnerName);
    if (!text || spokenStages.current.has(key)) return;
    spokenStages.current.add(key);
    speakVoice(text, { onStart: setCaption, onEnd: () => setCaption('') });
  }, [enabled, learnerName, skillMentor.phase, stage, started]);

  useEffect(() => {
    if (!enabled || !started || !learnerName || skillMentor.phase !== 'idle' || !nearbySkillMentor || greetedMentors.current.has(nearbySkillMentor)) return;
    greetedMentors.current.add(nearbySkillMentor);
    const skill = skillDefinitions[nearbySkillMentor];
    const learner = learnerName.trim().split(/\s+/)[0] || 'Intern';
    const mentor = skill.mentor.split(' ')[0];
    const text = `Hello ${learner}. I'm ${mentor}, ${skill.mentorRole}. I can teach you ${skill.title.toLowerCase()} here on the live site. Tap Learn this job when you're ready.`;
    speakVoice(text, { onStart: setCaption, onEnd: () => setCaption('') });
  }, [enabled, learnerName, nearbySkillMentor, skillMentor.phase, started]);

  useEffect(() => {
    if (!enabled || !started || !learnerName || skillMentor.phase !== 'idle' || !nearbyStakeholder || nearbySkillMentor || greeted.current.has(nearbyStakeholder)) return;
    greeted.current.add(nearbyStakeholder);
    const text = buildStakeholderGreeting(nearbyStakeholder, learnerName);
    speakVoice(text, { onStart: setCaption, onEnd: () => setCaption('') });
  }, [enabled, learnerName, nearbySkillMentor, nearbyStakeholder, skillMentor.phase, started]);

  useEffect(() => {
    if (!enabled || !started || !learnerName || !skillMentor.activeSkillId || skillMentor.phase === 'idle') return;
    const skill = skillDefinitions[skillMentor.activeSkillId];
    const moment = `${skill.id}:${skillMentor.phase}:${skillMentor.stepIndex}`;
    if (spokenSkillMoments.current.has(moment)) return;
    spokenSkillMoments.current.add(moment);

    let text = '';
    if (skillMentor.phase === 'focus') text = buildSkillMentorIntro(skill, learnerName);
    else if (skillMentor.phase === 'practice') {
      const step = skill.steps[skillMentor.stepIndex];
      if (step) text = buildSkillStepVoice(skill, step, learnerName);
    } else if (skillMentor.phase === 'complete') {
      const result = skillMentor.results[skill.id];
      const learner = learnerName.trim().split(/\s+/)[0] || 'Intern';
      text = `${learner}, skill practice complete. You scored ${result?.score ?? 0} out of 100 in ${skill.title}. Your learning evidence is saved to this BuildSite run.`;
    }
    if (text) speakVoice(text, { onStart: setCaption, onEnd: () => setCaption('') });
  }, [enabled, learnerName, skillMentor, started]);

  if (!caption) return null;
  return <div className="voice-caption" role="status" aria-live="polite"><span>VOICE GUIDE</span><p>{caption}</p></div>;
}
