import { OutputHealthMonitor, type HealthResult } from '../../../games/autonomous-snake/src/presentation/health';

export interface OperationalHealthLimits {
  staleAfterMs: number;
  frozenAfterMs: number;
  silenceAfterMs: number;
  blackLumaThreshold: number;
  queueWarnRatio: number;
  memorySlopeWarnMbPerHour: number;
}

export interface OperationalHealthSample {
  nowMs: number;
  lastSnapshotMs: number;
  lastFrameChangeMs: number;
  luma: number;
  expectedScene: string;
  actualScene: string;
  lastAudioMs: number;
  intendedSilence: boolean;
  queueUtilization: number;
  memorySlopeMbPerHour: number;
}

export type OperationalHealthReason = HealthResult['reasons'][number] | 'queue-pressure' | 'memory-slope';

export type OperationalHealthResult = Omit<HealthResult, 'reasons'> & {
  reasons: OperationalHealthReason[];
  publicCopy: string;
  operations: Array<'reduce-quality' | 'rebuild-renderer' | 'activate-safe-scene' | 'verify-output'>;
};

export class OperationalOutputHealth {
  private readonly base: OutputHealthMonitor;
  constructor(private readonly limits: OperationalHealthLimits) {
    for (const [name,value] of Object.entries(limits)) if (!Number.isFinite(value) || value <= 0) throw new RangeError(name);
    if (limits.queueWarnRatio > 1) throw new RangeError('queueWarnRatio');
    this.base = new OutputHealthMonitor(limits);
  }

  check(sample: OperationalHealthSample): OperationalHealthResult {
    if (!Number.isFinite(sample.queueUtilization) || sample.queueUtilization < 0 || sample.queueUtilization > 1) throw new RangeError('queueUtilization');
    if (!Number.isFinite(sample.memorySlopeMbPerHour)) throw new RangeError('memorySlopeMbPerHour');
    const core = this.base.check(sample);
    const reasons: OperationalHealthReason[] = [...core.reasons];
    const operations: OperationalHealthResult['operations'] = [];
    if (sample.queueUtilization >= this.limits.queueWarnRatio) { reasons.push('queue-pressure'); operations.push('reduce-quality'); }
    if (sample.memorySlopeMbPerHour >= this.limits.memorySlopeWarnMbPerHour) { reasons.push('memory-slope'); if (!operations.includes('reduce-quality')) operations.push('reduce-quality'); }
    if (core.action === 'rebuild') operations.push('rebuild-renderer','verify-output');
    if (core.action === 'safe-slate') operations.push('activate-safe-scene','rebuild-renderer','verify-output');
    const status: HealthResult['status'] = core.status === 'unsafe' ? 'unsafe' : reasons.length ? 'degraded' : 'healthy';
    return {
      status,
      reasons,
      action: core.action,
      publicCopy: status === 'healthy' ? 'Live' : status === 'degraded' ? 'Restoring live game view' : 'Live output temporarily protected',
      operations,
    };
  }
}

export type RecoveryWorkflowState='monitoring'|'safe-scene'|'restarting'|'rebuilding'|'verifying'|'resumed'|'halted';
export interface RecoveryWorkflowSnapshot { state: RecoveryWorkflowState; attempts: number; reasons: string[]; }
export interface RecoveryAdvance { componentRestarted?: boolean; snapshotVerified?: boolean; outputHealthy?: boolean; }

export class OutputRecoveryWorkflow {
  private current: RecoveryWorkflowState='monitoring';
  private attempts=0;
  private reasons:string[]=[];
  constructor(private readonly options:{maxAttempts:number}){
    if(!Number.isInteger(options.maxAttempts)||options.maxAttempts<1)throw new RangeError('maxAttempts');
  }
  begin(result:{status:HealthResult['status']; reasons:ReadonlyArray<string>; action:HealthResult['action']}):RecoveryWorkflowSnapshot{
    this.reasons=[...result.reasons];this.attempts=0;
    this.current=result.status==='unsafe'?'safe-scene':result.status==='degraded'?'rebuilding':'resumed';
    return this.snapshot();
  }
  advance(signal:RecoveryAdvance):RecoveryWorkflowSnapshot{
    if(this.current==='halted'||this.current==='resumed')return this.snapshot();
    if(this.current==='safe-scene'){
      this.current=signal.componentRestarted?'rebuilding':'restarting';
      return this.snapshot();
    }
    if(this.current==='restarting'){
      if(signal.componentRestarted)this.current='rebuilding';
      return this.snapshot();
    }
    if(signal.snapshotVerified&&signal.outputHealthy){this.current='resumed';return this.snapshot()}
    this.attempts++;
    this.current=this.attempts>=this.options.maxAttempts?'halted':'verifying';
    return this.snapshot();
  }
  snapshot():RecoveryWorkflowSnapshot{return{state:this.current,attempts:this.attempts,reasons:[...this.reasons]}}
}
