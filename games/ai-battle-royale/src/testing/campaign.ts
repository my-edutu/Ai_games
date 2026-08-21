import type { BattleArchetype, BattleConfig } from '../state/types';
import { BattleRoyaleRuntime } from '../runtime/runtime';

export interface BattleCampaignReport {
  runs: number;
  terminalRuns: number;
  integrityFailures: number;
  technicalResults: number;
  maxTicks: number;
  minTicks: number;
  averageTicks: number;
  resultReasons: Record<string, number>;
  archetypeWins: Record<BattleArchetype, number>;
  totalEliminations: number;
  totalFallbacks: number;
}

export function runBattleCampaign(config: BattleConfig, seeds: readonly string[]): BattleCampaignReport {
  const report: BattleCampaignReport = {
    runs: seeds.length,
    terminalRuns: 0,
    integrityFailures: 0,
    technicalResults: 0,
    maxTicks: 0,
    minTicks: seeds.length > 0 ? Number.MAX_SAFE_INTEGER : 0,
    averageTicks: 0,
    resultReasons: {},
    archetypeWins: { vanguard: 0, ranger: 0, scavenger: 0, tactician: 0 },
    totalEliminations: 0,
    totalFallbacks: 0,
  };
  let ticks = 0;
  for (let index = 0; index < seeds.length; index += 1) {
    try {
      const runtime = new BattleRoyaleRuntime(config, seeds[index], `campaign-${index}`);
      runtime.runToResult(config.maxTicks + 2);
      const result = runtime.state.result;
      if (result) {
        report.terminalRuns += 1;
        report.resultReasons[result.reason] = (report.resultReasons[result.reason] ?? 0) + 1;
        if (result.kind === 'technical') report.technicalResults += 1;
        if (result.winnerId) {
          const winner = runtime.state.combatants.find((candidate) => candidate.id === result.winnerId);
          if (winner) report.archetypeWins[winner.archetype] += 1;
        }
      }
      report.maxTicks = Math.max(report.maxTicks, runtime.state.tick);
      report.minTicks = Math.min(report.minTicks, runtime.state.tick);
      ticks += runtime.state.tick;
      report.totalEliminations += runtime.state.combatants.reduce((sum, combatant) => sum + combatant.eliminations, 0);
      report.totalFallbacks += runtime.state.combatants.reduce((sum, combatant) => sum + combatant.fallbackCount, 0);
    } catch {
      report.integrityFailures += 1;
    }
  }
  report.averageTicks = seeds.length > 0 ? Math.round(ticks / seeds.length) : 0;
  if (report.minTicks === Number.MAX_SAFE_INTEGER) report.minTicks = 0;
  return report;
}
