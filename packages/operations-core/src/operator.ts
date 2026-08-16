import { checksum } from '../../replay/src/index';

export type OperatorRole = 'viewer' | 'operator' | 'admin';
export type OperatorAction =
  | 'safe-scene'
  | 'disable-interactions'
  | 'disable-public-text'
  | 'restart-component'
  | 'request-snapshot'
  | 'verified-restore'
  | 'fresh-run'
  | 'quality-preset'
  | 'emergency-halt';

export interface OperatorCommand {
  id?: string;
  actor: string;
  role: OperatorRole;
  action: OperatorAction;
  reason: string;
  target?: string;
  value?: string;
}

export interface OperatorAuditRecord {
  schemaVersion: 1;
  id: string;
  actor: string;
  role: OperatorRole;
  action: OperatorAction;
  reason: string;
  target: string;
  value: string | null;
  occurredAtMs: number;
  status: 'accepted' | 'denied' | 'duplicate';
}

const permissions: Record<OperatorRole, ReadonlySet<OperatorAction>> = {
  viewer: new Set(),
  operator: new Set(['safe-scene','disable-interactions','disable-public-text','restart-component','request-snapshot','quality-preset']),
  admin: new Set(['safe-scene','disable-interactions','disable-public-text','restart-component','request-snapshot','verified-restore','fresh-run','quality-preset','emergency-halt']),
};

export class OperatorControlService {
  private readonly records: OperatorAuditRecord[] = [];
  private readonly byId = new Map<string, OperatorAuditRecord>();
  constructor(private readonly auditCapacity = 10_000) {
    if (!Number.isInteger(auditCapacity) || auditCapacity < 1) throw new RangeError('auditCapacity');
  }

  execute(command: OperatorCommand, occurredAtMs: number): { status: 'accepted' | 'denied' | 'duplicate'; audit: OperatorAuditRecord } {
    if (!command.actor || !command.reason || !Number.isFinite(occurredAtMs)) throw new RangeError('operator command');
    const id = command.id ?? `op_${checksum({ actor: command.actor, action: command.action, reason: command.reason, target: command.target ?? 'channel', value: command.value ?? null, occurredAtMs }).slice(0,24)}`;
    const existing = this.byId.get(id);
    if (existing) return { status: 'duplicate', audit: structuredClone(existing) };
    const accepted = permissions[command.role].has(command.action);
    const audit: OperatorAuditRecord = Object.freeze({
      schemaVersion: 1,
      id,
      actor: command.actor,
      role: command.role,
      action: command.action,
      reason: command.reason.slice(0, 240),
      target: (command.target ?? 'channel').slice(0, 120),
      value: command.value ? command.value.slice(0, 120) : null,
      occurredAtMs,
      status: accepted ? 'accepted' : 'denied',
    });
    this.records.push(audit);
    this.byId.set(id, audit);
    while (this.records.length > this.auditCapacity) {
      const removed = this.records.shift();
      if (removed) this.byId.delete(removed.id);
    }
    return { status: audit.status, audit: structuredClone(audit) };
  }

  audit(): OperatorAuditRecord[] { return structuredClone(this.records); }
}
