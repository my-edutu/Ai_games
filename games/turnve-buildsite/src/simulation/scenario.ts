import { z } from 'zod';
import type { ArtifactType, StakeholderId } from './types';

const hazardSchema = z.object({
  id: z.string(),
  label: z.string(),
  location: z.string(),
  category: z.enum(['safety', 'quality', 'logistics']),
  risk: z.enum(['medium', 'high', 'critical']),
  position: z.tuple([z.number(), z.number(), z.number()]),
  description: z.string(),
});

const stakeholderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  caresAbout: z.array(z.string()),
});

const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  role: z.string(),
  hazards: z.array(hazardSchema),
  stakeholders: z.array(stakeholderSchema),
});

export const scenario = scenarioSchema.parse({
  id: 'concrete-pour-decision',
  title: 'The Concrete Pour Decision',
  role: 'Construction Project Intern',
  hazards: [
    { id: 'fall-protection', label: 'Missing fall protection', location: 'Open-edge work area', category: 'safety', risk: 'critical', position: [12, 0.15, 6], description: 'A worker is close to an open edge without the correct fall-protection setup.' },
    { id: 'blocked-route', label: 'Blocked emergency access', location: 'Temporary access route', category: 'safety', risk: 'high', position: [-8, 0.15, -4], description: 'Pallets partially block the marked emergency route.' },
    { id: 'wet-cement', label: 'Moisture-exposed cement', location: 'Materials storage', category: 'quality', risk: 'medium', position: [-12, 0.15, 8], description: 'Cement bags are stored without adequate weather protection.' },
    { id: 'water-cable', label: 'Water beside temporary electrical cable', location: 'Slab access', category: 'safety', risk: 'critical', position: [4, 0.15, -8], description: 'A temporary power cable runs beside standing water.' },
    { id: 'formwork', label: 'Incomplete formwork section', location: 'Pour zone', category: 'quality', risk: 'high', position: [10, 0.15, -10], description: 'A visible formwork edge is incomplete at the slab perimeter.' },
  ],
  stakeholders: [
    { id: 'site-manager', name: 'Maya Okafor', role: 'Assistant Site Manager', caresAbout: ['schedule', 'coordination', 'documentation', 'judgment'] },
    { id: 'hse', name: 'Ibrahim Bello', role: 'HSE Officer', caresAbout: ['safety', 'prevention', 'reporting', 'compliance'] },
    { id: 'foreman', name: 'Daniel Mensah', role: 'Site Foreman', caresAbout: ['productivity', 'coordination', 'idle time'] },
    { id: 'qs', name: 'Ada Nwosu', role: 'Quantity Surveyor', caresAbout: ['cost exposure', 'waiting charges', 'records'] },
    { id: 'consultant', name: 'Grace Adebayo', role: 'Consultant Site Inspector', caresAbout: ['quality', 'drawings', 'inspection evidence', 'approval'] },
    { id: 'supplier', name: 'Concrete Supplier Dispatcher', role: 'Supplier', caresAbout: ['timing', 'waiting charges', 'truck availability'] },
  ],
});

export const requiredPpe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

export const checklistItems = [
  { id: 'latest-drawing', label: 'Latest approved drawing available' },
  { id: 'formwork-complete', label: 'Formwork completed' },
  { id: 'reinforcement-inspected', label: 'Reinforcement inspected' },
  { id: 'service-penetrations', label: 'Service penetrations verified' },
  { id: 'access-clear', label: 'Access route clear' },
  { id: 'barriers-installed', label: 'Safety barriers installed' },
  { id: 'consultant-inspection', label: 'Consultant inspection complete' },
  { id: 'delivery-confirmed', label: 'Concrete delivery confirmed' },
  { id: 'weather-reviewed', label: 'Weather risk reviewed' },
  { id: 'team-briefed', label: 'Pour team briefed' },
];

export const artifactDefinitions: Record<ArtifactType, { title: string; fields: { key: string; label: string; placeholder: string }[] }> = {
  'safety-observation': {
    title: 'Safety Observation Report',
    fields: [
      ['observation', 'Observation', 'Describe what you observed.'],
      ['location', 'Location', 'Where on site?'],
      ['riskLevel', 'Risk level', 'Medium / High / Critical'],
      ['immediateAction', 'Immediate action', 'What was made safe or paused?'],
      ['personNotified', 'Person notified', 'Who did you tell?'],
      ['evidence', 'Supporting evidence', 'Reference captured evidence.'],
      ['followUp', 'Recommended follow-up', 'What should happen next?'],
    ].map(([key, label, placeholder]) => ({ key, label, placeholder })),
  },
  rfi: {
    title: 'Draft Request for Information',
    fields: [
      ['drawingReference', 'Drawing reference', 'Ground-floor slab — Rev 02 / Rev 03'],
      ['discrepancy', 'Revision discrepancy', 'Describe the changed reinforcement detail.'],
      ['question', 'Specific question', 'What confirmation is required?'],
      ['impact', 'Potential impact', 'Safety, quality, schedule, cost.'],
      ['requiredResponseTime', 'Required response time', 'When is clarification needed?'],
      ['attachments', 'Attachments', 'Drawing/evidence references.'],
    ].map(([key, label, placeholder]) => ({ key, label, placeholder })),
  },
  'site-diary': {
    title: 'Site Diary Entry',
    fields: [
      ['time', 'Date / simulated time', '08:00 onward'],
      ['work', 'Work completed', 'Observed work and preparation.'],
      ['labour', 'Labour / equipment', 'Crew and equipment observed.'],
      ['weather', 'Weather', 'Clear / cloudy / rain.'],
      ['deliveries', 'Deliveries', 'Concrete truck status.'],
      ['delays', 'Delays', 'Cause and duration.'],
      ['safety', 'Safety events', 'What was found/reported?'],
      ['quality', 'Quality events', 'Drawing/inspection issues.'],
      ['instructions', 'Instructions received', 'Who instructed what?'],
      ['outstanding', 'Outstanding actions', 'Open follow-ups.'],
    ].map(([key, label, placeholder]) => ({ key, label, placeholder })),
  },
  'supervisor-update': {
    title: 'Supervisor Status Update',
    fields: [
      ['situation', 'Current situation', 'What is happening now?'],
      ['risk', 'Risk / blocker', 'What prevents a safe approved pour?'],
      ['action', 'Action already taken', 'What have you done?'],
      ['decision', 'Decision / support required', 'What do you need from your supervisor?'],
      ['nextUpdate', 'Next update time', 'When will you report back?'],
    ].map(([key, label, placeholder]) => ({ key, label, placeholder })),
  },
};

export const stakeholderIds = scenario.stakeholders.map((stakeholder) => stakeholder.id as StakeholderId);
