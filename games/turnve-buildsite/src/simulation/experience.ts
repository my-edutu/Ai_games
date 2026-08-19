import { scenario } from './scenario';
import type { SimulationStage, StakeholderId, WeatherState } from './types';

export function sanitizeLearnerName(input: string): string {
  const stripped = input
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{M}' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
  if (!stripped) return '';
  return stripped
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase())
    .join(' ');
}

export function weatherForMinute(minute: number): WeatherState {
  if (minute >= 50) return 'rain';
  if (minute >= 25) return 'cloudy';
  return 'clear';
}

export const visibleStakeholderPositions: Partial<Record<StakeholderId, [number, number, number]>> = {
  'site-manager': [-6, 1.4, -10],
  hse: [1, 1.4, -6],
  foreman: [15, 1.4, -2],
  consultant: [7, 1.4, 8],
};

export function nearestVisibleStakeholder(x: number, z: number, maxDistance = 4.6): StakeholderId | null {
  let nearest: StakeholderId | null = null;
  let nearestDistance = maxDistance;
  for (const [id, position] of Object.entries(visibleStakeholderPositions) as [StakeholderId, [number, number, number]][]) {
    const distance = Math.hypot(x - position[0], z - position[2]);
    if (distance < nearestDistance) {
      nearest = id;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export type CommunicationCue = {
  title: string;
  message: string;
  suggestedTopic: string;
};

const defaultTopics: Record<StakeholderId, string> = {
  'site-manager': 'Give a concise readiness update: what you saw, what is blocked, and what needs escalation.',
  hse: 'Report the safety observation, location, evidence, and immediate control.',
  foreman: 'Confirm what work is underway and flag any drawing or site-condition conflict.',
  qs: 'Ask about waiting cost, rework exposure, and what should be recorded.',
  consultant: 'Ask what inspection or approval evidence is still required before the pour.',
  supplier: 'Confirm delivery timing and communicate any hold without authorizing work.',
};

export function communicationHint(stakeholderId: StakeholderId, stage: SimulationStage, learnerName: string): CommunicationCue {
  const person = scenario.stakeholders.find((item) => item.id === stakeholderId);
  const name = learnerName || 'Intern';
  const topic = defaultTopics[stakeholderId];
  let message = `${name}, this is a useful moment to communicate. ${topic}`;

  if (stakeholderId === 'site-manager' && stage === 'site-walk') {
    message = `${name}, Maya expects a short field update: summarize your observations, say whether pour readiness is affected, and identify anything that needs escalation.`;
  } else if (stakeholderId === 'hse') {
    message = `${name}, Ibrahim is the right person for safety observations. State the hazard, location, evidence captured, and what immediate control you recommend.`;
  } else if (stakeholderId === 'foreman' && ['document-review', 'pre-pour'].includes(stage)) {
    message = `${name}, Daniel can confirm what the crew is building from. Ask which drawing revision is in use and explain any mismatch you found.`;
  } else if (stakeholderId === 'consultant' && ['pre-pour', 'crisis'].includes(stage)) {
    message = `${name}, Grace controls the inspection evidence—not you. Ask what inspection or approval remains outstanding before the pour can be authorized.`;
  } else if (stakeholderId === 'qs' && stage === 'crisis') {
    message = `${name}, Ada can quantify the commercial impact. Ask about waiting time, delay cost, and possible rework exposure.`;
  } else if (stakeholderId === 'supplier' && stage === 'crisis') {
    message = `${name}, give the supplier a factual status update and revised timing. Do not imply that you personally approve the pour.`;
  }

  return {
    title: `${person?.name ?? stakeholderId} · ${person?.role ?? 'Site stakeholder'}`,
    message,
    suggestedTopic: topic,
  };
}
