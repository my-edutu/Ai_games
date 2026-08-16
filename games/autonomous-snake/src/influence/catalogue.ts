import type { SnakeEffectId } from './types';
export const EFFECT_IDS:SnakeEffectId[]=['bonus-food','safe-hint','shield-token','speed-shift','fog-field','obstacle-choice','portal-pulse','food-choice','theme-vote','next-challenge'];
export const EFFECT_COOLDOWNS:Record<SnakeEffectId,number>={
  'bonus-food':20,'safe-hint':30,'shield-token':80,'speed-shift':50,'fog-field':60,
  'obstacle-choice':90,'portal-pulse':70,'food-choice':25,'theme-vote':20,'next-challenge':100
};
