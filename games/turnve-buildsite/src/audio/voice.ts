import { scenario } from '../simulation/scenario';
import type { SimulationStage, StakeholderId } from '../simulation/types';
import type { SkillDefinition, SkillStep } from '../skillMentor/types';
import { setConstructionVoiceDucking } from './soundscape';

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Intern';
}

export function buildOnboardingVoice(stage: SimulationStage, learnerName: string): string {
  const name = firstName(learnerName);
  if (stage === 'intro') return `Good morning, ${name}. Welcome to Turnve BuildSite. Today you are joining the project as a construction project intern.`;
  if (stage === 'ppe') return `${name}, before you enter the active site, complete your PPE check. Protect your head, eyes, body and feet before moving into the work area.`;
  if (stage === 'briefing') return `${name}, your supervisor Maya is about to brief you. Listen for your task, your authority limits and the people you may need to speak with.`;
  if (stage === 'site-walk') return `${name}, you are clear to move around the site. Drag to look, move through the work area and tap people, equipment or materials to identify them and see available actions.`;
  if (stage === 'document-review') return `${name}, compare what is on site with the latest approved information before anyone relies on it.`;
  if (stage === 'pre-pour') return `${name}, build the readiness picture now. Confirm evidence, inspection status and any blockers before the delivery window closes.`;
  if (stage === 'crisis') return `${name}, pressure is increasing. Protect safety and quality, communicate clearly and stay inside your intern authority.`;
  if (stage === 'artifacts') return `${name}, turn what happened into usable project records before you close out the shift.`;
  return '';
}

export function buildStakeholderGreeting(stakeholderId: StakeholderId, learnerName: string): string {
  const person = scenario.stakeholders.find((item) => item.id === stakeholderId);
  const name = firstName(learnerName);
  if (!person) return `Hello ${name}.`;
  const first = firstName(person.name);
  const extra: Partial<Record<StakeholderId, string>> = {
    'site-manager': 'Tell me what you find on the walk.',
    hse: 'Let me know immediately if you see a safety issue.',
    foreman: 'Ask me what the crew is working from if you need to confirm the site setup.',
    qs: 'I can help you understand cost and delay exposure.',
    consultant: 'Ask me what inspection evidence or approval is still required.',
    supplier: 'Keep me updated if the delivery timing changes.',
  };
  return `Hello ${name}. I'm ${first}, ${person.role}. ${extra[stakeholderId] ?? ''}`.trim();
}

export function buildSkillMentorIntro(skill: SkillDefinition, learnerName: string): string {
  const learner = firstName(learnerName);
  const mentor = firstName(skill.mentor);
  return `Hello ${learner}. I'm ${mentor}, your ${skill.trade.toLowerCase()} mentor for this practice. ${skill.intro} ${skill.safetyNote}`;
}

export function buildSkillStepVoice(skill: SkillDefinition, step: SkillStep, learnerName: string): string {
  const learner = firstName(learnerName);
  const mentor = firstName(skill.mentor);
  return `${learner}, ${mentor} here. ${step.title}. ${step.instruction}`;
}

export type VoiceCallbacks = {
  onStart?: (text: string) => void;
  onEnd?: () => void;
};

let enabled = true;
let fallbackTimer: number | null = null;

export function setVoiceEnabled(value: boolean) {
  enabled = value;
  if (!value && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  if (!value) setConstructionVoiceDucking(false);
}

export function speakVoice(text: string, callbacks: VoiceCallbacks = {}) {
  const clean = text.trim();
  if (!enabled || !clean || typeof window === 'undefined') return false;
  callbacks.onStart?.(clean);

  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    fallbackTimer = window.setTimeout(() => callbacks.onEnd?.(), Math.min(6500, 1800 + clean.length * 32));
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => /^en-(NG|GB|ZA)/i.test(voice.lang)) ?? voices.find((voice) => /^en/i.test(voice.lang));
  if (preferred) utterance.voice = preferred;
  utterance.lang = preferred?.lang ?? 'en-GB';
  utterance.rate = 0.94;
  utterance.pitch = 1;
  utterance.volume = 0.92;

  const finish = () => {
    setConstructionVoiceDucking(false);
    callbacks.onEnd?.();
  };
  utterance.onstart = () => setConstructionVoiceDucking(true);
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  if (fallbackTimer !== null && typeof window !== 'undefined') window.clearTimeout(fallbackTimer);
  fallbackTimer = null;
  setConstructionVoiceDucking(false);
}
