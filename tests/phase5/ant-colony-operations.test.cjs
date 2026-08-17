'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AntColonyOperationsMonitor,
  AntOutputRecoveryWorkflow,
} = require('../../dist/games/ai-ant-colony/src/operations/health.js');
const { runAntColonyPhase5Chaos } = require('../../dist/games/ai-ant-colony/src/operations/chaos.js');

function healthySample(overrides = {}) {
  return {
    nowMs: 10_000,
    simulationProgressSeq: 400,
    lastMeaningfulEventMs: 9_800,
    lastSnapshotMs: 9_900,
    lastFrameChangeMs: 9_950,
    lastAudioMs: 9_900,
    intendedSilence: false,
    luma: 0.4,
    expectedScene: 'active',
    actualScene: 'active',
    queueUtilization: 0.2,
    memorySlopeMbPerHour: 2,
    resourcePressure: 0.2,
    ...overrides,
  };
}

test('operations monitor distinguishes healthy, degraded and unsafe output', () => {
  const monitor = new AntColonyOperationsMonitor();
  const healthy = monitor.observe(healthySample());
  assert.equal(healthy.status, 'healthy');
  assert.equal(healthy.publicCopy, 'Live colony');

  const degraded = monitor.observe(healthySample({
    nowMs: 12_000,
    lastFrameChangeMs: 10_000,
    queueUtilization: 0.86,
  }));
  assert.equal(degraded.status, 'degraded');
  assert.ok(degraded.reasons.includes('frozen-output'));
  assert.ok(degraded.reasons.includes('queue-pressure'));

  const unsafe = monitor.observe(healthySample({
    nowMs: 20_000,
    lastSnapshotMs: 10_000,
    lastFrameChangeMs: 10_000,
    lastAudioMs: 10_000,
    luma: 0,
    actualScene: 'error',
    queueUtilization: 1,
    memorySlopeMbPerHour: 80,
  }));
  assert.equal(unsafe.status, 'unsafe');
  assert.ok(unsafe.actions.some(action => action.type === 'safe-scene'));
  assert.ok(unsafe.actions.some(action => action.type === 'verified-recovery'));
  assert.ok(unsafe.alerts.some(alert => alert.id === 'ant-output-unsafe'));
});

test('output recovery workflow resumes only after verified state and healthy output', () => {
  const monitor = new AntColonyOperationsMonitor();
  const workflow = new AntOutputRecoveryWorkflow(3);
  const unsafe = monitor.observe(healthySample({
    nowMs: 20_000,
    lastSnapshotMs: 10_000,
    lastFrameChangeMs: 10_000,
    lastAudioMs: 10_000,
    luma: 0,
    actualScene: 'error',
  }));
  assert.equal(workflow.begin(unsafe).state, 'safe-scene');
  assert.equal(workflow.advance({ componentRestarted: true }).state, 'restoring');
  assert.equal(workflow.advance({ snapshotVerified: true }).state, 'verifying');
  assert.equal(workflow.advance({ snapshotVerified: true, outputHealthy: true }).state, 'resumed');
});

test('output recovery workflow halts after bounded failed verification attempts', () => {
  const monitor = new AntColonyOperationsMonitor();
  const workflow = new AntOutputRecoveryWorkflow(2);
  workflow.begin(monitor.observe(healthySample({
    nowMs: 20_000,
    lastSnapshotMs: 10_000,
    lastFrameChangeMs: 10_000,
    luma: 0,
    actualScene: 'error',
  })));
  workflow.advance({ componentRestarted: true });
  assert.equal(workflow.advance({ snapshotVerified: false }).state, 'restoring');
  assert.equal(workflow.advance({ snapshotVerified: false }).state, 'halted');
});

test('Phase 5 chaos campaign verifies exact recovery, fencing, bounds and output protection', () => {
  const report = runAntColonyPhase5Chaos('ant-phase5-test');
  assert.equal(report.status, 'pass');
  assert.equal(report.integrityFailures, 0);
  assert.equal(report.duplicateApplications, 0);
  assert.equal(report.duplicateEventIds, 0);
  assert.equal(report.eventSequenceContiguous, true);
  assert.equal(report.recoveryVerified, true);
  assert.equal(report.oldWriterFenced, true);
  assert.equal(report.interactionsDegradedSafely, true);
  assert.equal(report.outputProtected, true);
  assert.ok(report.commands >= 30);
  assert.ok(report.snapshots <= 4);
  assert.ok(report.dedupeEntries <= 32);
  assert.equal(typeof report.checksum, 'string');
  assert.ok(report.checksum.length >= 8);
});
