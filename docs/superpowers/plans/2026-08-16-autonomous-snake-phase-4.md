# Autonomous Snake Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an R3 interaction candidate where verified provider-neutral audience events become moderated, privacy-safe, idempotent votes and bounded Snake effects, including a deterministic Chat vs AI loop that cannot buy or force a terminal outcome.

**Architecture:** Provider adapters authenticate/normalize untrusted envelopes into shared `AudienceInput` records. A gateway applies identity tokenization, fixed-token parsing, moderation, rate limits, dedupe and entitlement caps before inputs enter deterministic vote or request services. The Event Director selects only prevalidated Snake effect candidates; commands are scheduled at safe ticks and applied by a dedicated influence reducer before AI observation, with all state included in snapshot/replay checksums. Presentation consumes public interaction state but never receives provider IDs, raw chat or exact payment data.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16, Node crypto, Node test runner, Playwright 1.55, existing seeded RNG/replay/presentation packages, faithful YouTube Live Chat and Twitch EventSub fixtures.

## Global Constraints

- No provider SDK type or raw provider payload enters the Snake package.
- Twitch webhook signatures use HMAC-SHA256 over message ID + timestamp + raw body and compare in constant time.
- Twitch delivery is treated as at-least-once; message ID and normalized idempotency dedupe are mandatory.
- YouTube messages are accepted only through an authorized-client boundary; service-account authentication is not supported.
- Only fixed declared vote tokens become executable input; arbitrary chat text never becomes a command.
- Provider user IDs are replaced by scoped HMAC identity references before leaving the gateway.
- Exact payment amounts, billing data, access tokens, email and raw profile data are excluded from normalized/game/public state.
- Entitlement weighting is capped at three total vote units per identity and cannot guarantee an option or terminal outcome.
- Authoritative paid-eligible effects fail closed when verification, moderation policy, audit reservation or idempotency state is uncertain.
- Every authoritative command has one idempotency key, one schedule decision and at most one application result.
- No effect may cause immediate unavoidable collision, rewrite a resolved result, guarantee victory/death/record, or bypass moderation/cooldown/cap/conflict policy.
- Simulation continues normally with all audience/provider features disabled or degraded.
- All queues, maps, vote windows, public names, text, audit records and effect durations are bounded.
- All behavior follows red-green-refactor and retains the complete Phase 1–3 regression suite.

---

### Task 1: Shared Audience Contracts and Faithful Provider Adapters

**Files:**
- Create: `packages/audience-contracts/src/index.ts`
- Create: `packages/audience-gateway/src/identity.ts`
- Create: `packages/audience-gateway/src/providers/twitch.ts`
- Create: `packages/audience-gateway/src/providers/youtube.ts`
- Create: `fixtures/providers/twitch/*.json`
- Create: `fixtures/providers/youtube/*.json`
- Test: `tests/phase4/provider-adapters.test.cjs`

**Interfaces:**

```ts
export type AudienceProvider = 'twitch' | 'youtube' | 'fixture';
export type AudienceInputKind = 'vote' | 'support' | 'membership' | 'gift' | 'moderation' | 'reversal';
export type EntitlementBand = 'none' | 'supporter' | 'premium' | 'gift';
export interface AudienceInput {
  schemaVersion: 1;
  provider: AudienceProvider;
  providerEventId: string;
  occurredAtMs: number;
  receivedAtMs: number;
  channelRef: string;
  viewerRef: string | null;
  displayName: string | null;
  kind: AudienceInputKind;
  fixedToken: string | null;
  entitlementBand: EntitlementBand;
  entitlementWeight: 1 | 2 | 3;
  rawDigest: string;
  reversalOf: string | null;
  idempotencyKey: string;
}
export interface TwitchWebhookHeaders {
  messageId: string;
  messageTimestamp: string;
  messageSignature: string;
  messageType: string;
}
export function verifyTwitchWebhook(rawBody: string, headers: TwitchWebhookHeaders, secret: string, nowMs: number): void;
export function normalizeTwitchEvent(rawBody: string, headers: TwitchWebhookHeaders, context: AdapterContext): AudienceInput[];
export function normalizeYouTubeMessage(message: unknown, context: AdapterContext): AudienceInput[];
```

- [ ] **Step 1: Write provider fixture tests that fail before adapters exist**

Test valid Twitch chat, cheer, subscription and gift events; YouTube text, Super Chat, new member, membership gifting, gift received and gift events. Assert no normalized object contains exact amount, provider user ID, raw body, token or email.

- [ ] **Step 2: Write Twitch authentication failures**

Test valid signature, forged signature, timestamp older than ten minutes, future timestamp beyond the declared skew, empty secret, malformed hex and duplicate message ID behavior.

- [ ] **Step 3: Implement minimal contracts, identity tokenization and adapters**

Use HMAC-SHA256 identity references scoped by provider/channel, bounded display names, SHA-256 raw digests and stable idempotency keys. Unknown/beta event types fail closed or normalize as non-authoritative support only when explicitly declared.

- [ ] **Step 4: Run focused provider tests and commit**

```bash
npm run build
node --test tests/phase4/provider-adapters.test.cjs
```

Expected: all provider fixtures pass; forged/replayed/expired cases fail with typed reason codes.

### Task 2: Gateway Dedupe, Moderation, Rate Limits and Audit Decisions

**Files:**
- Create: `packages/audience-gateway/src/errors.ts`
- Create: `packages/audience-gateway/src/dedupe.ts`
- Create: `packages/audience-gateway/src/rate-limit.ts`
- Create: `packages/audience-gateway/src/moderation.ts`
- Create: `packages/audience-gateway/src/gateway.ts`
- Create: `packages/audience-gateway/src/index.ts`
- Test: `tests/phase4/gateway.test.cjs`

**Interfaces:**

```ts
export type GatewayReason =
  | 'accepted' | 'duplicate' | 'invalid-token' | 'late' | 'rate-limited'
  | 'sanctioned' | 'moderation-unavailable' | 'audit-unavailable'
  | 'entitlement-unverified' | 'queue-full' | 'reversal-recorded';
export interface GatewayDecision {
  decisionId: string;
  inputIdempotencyKey: string;
  status: 'accepted' | 'rejected' | 'duplicate' | 'reversed';
  reason: GatewayReason;
  publicDisplayName: string | null;
  audienceInput?: AudienceInput;
}
export class AudienceGateway {
  constructor(options: GatewayOptions);
  process(input: AudienceInput, context: GatewayContext): GatewayDecision;
  reverse(input: AudienceInput, context: GatewayContext): GatewayDecision;
  snapshot(): GatewaySnapshot;
}
```

- [ ] **Step 1: Write failing dedupe and original-decision replay tests**

The same provider event, normalized key or retry returns the original decision and never emits a second accepted input.

- [ ] **Step 2: Write moderation/privacy/rate tests**

Cover unsafe names, fixed-token validation, arbitrary commands, sanction state, moderation outage, free-vote continuation policy, paid-event fail-closed policy, per-viewer/channel/global buckets, queue cap and bounded snapshot state.

- [ ] **Step 3: Implement bounded in-memory Phase 4 gateway**

Use deterministic fixed-window limits and FIFO expiry. The Phase 4 store is explicitly non-production durability; Phase 5 replaces it behind the same contract.

- [ ] **Step 4: Verify gateway state contains only privacy-safe bounded data**

```bash
node --test tests/phase4/gateway.test.cjs
```

### Task 3: Deterministic Vote Windows and Chat vs AI Round State

**Files:**
- Create: `packages/interaction-core/src/votes.ts`
- Create: `packages/interaction-core/src/rounds.ts`
- Create: `packages/interaction-core/src/index.ts`
- Test: `tests/phase4/votes-rounds.test.cjs`

**Interfaces:**

```ts
export interface VoteOption { id: string; label: string; effectId: string; candidateId: string; }
export interface VoteWindow {
  schemaVersion: 1;
  id: string;
  runToken: string;
  startTick: number;
  endTick: number;
  options: VoteOption[];
  votesByViewer: Record<string, { optionId: string; weight: 1 | 2 | 3; inputKey: string }>;
  status: 'open' | 'resolved' | 'expired' | 'quarantined';
  result?: VoteResult;
}
export function submitVote(window: VoteWindow, input: AudienceInput, tokenToOption: Record<string,string>): VoteDecision;
export function resolveVote(window: VoteWindow, rng: NamedRng): VoteResult;
export interface ChatVsAiState {
  enabled: boolean;
  pressure: number;
  pressureCap: number;
  roundsCompleted: number;
  cooldownUntilTick: number;
  currentWindow: VoteWindow | null;
  recentChoiceSets: string[];
}
```

- [ ] **Step 1: Write deterministic vote tests**

Test one vote per identity, capped weights, duplicate retries, invalid token, late vote, reconnect order, fixed-priority and named-stream ties, reversal before resolution, immutable resolved result and privacy-safe public tally.

- [ ] **Step 2: Write Chat vs AI pressure/cooldown tests**

Pressure cannot exceed its cap, rounds cannot overlap, terminal/recovery scenes suppress new windows, and no-audience mode returns to cooldown without blocking the game.

- [ ] **Step 3: Implement pure vote and round reducers**

No wall clock or provider order influences authoritative result. All ordering uses tick, stable IDs and `audience-tiebreaks` only.

- [ ] **Step 4: Verify replay determinism**

Resolve the same recorded vote window twice from the same RNG snapshot and compare complete result checksums.

### Task 4: Snake Effect Catalogue, Eligibility and Authoritative Influence Reducer

**Files:**
- Create: `games/autonomous-snake/src/influence/types.ts`
- Create: `games/autonomous-snake/src/influence/catalogue.ts`
- Create: `games/autonomous-snake/src/influence/candidates.ts`
- Create: `games/autonomous-snake/src/influence/apply.ts`
- Modify: `games/autonomous-snake/src/state/types.ts`
- Modify: `games/autonomous-snake/src/index.ts`
- Modify: `games/autonomous-snake/src/rules/step.ts`
- Modify: `games/autonomous-snake/src/ai/production.ts`
- Modify: `games/autonomous-snake/src/runtime/run.ts`
- Modify: `games/autonomous-snake/src/persistence/snapshot.ts`
- Test: `tests/phase4/effects.test.cjs`

**Interfaces:**

```ts
export type SnakeEffectId =
  | 'bonus-food' | 'safe-hint' | 'shield-token' | 'speed-shift'
  | 'fog-field' | 'obstacle-choice' | 'portal-pulse' | 'food-choice'
  | 'theme-vote' | 'next-challenge';
export interface InfluenceCommand {
  schemaVersion: 1;
  id: string;
  idempotencyKey: string;
  source: 'vote' | 'support' | 'operator-fixture';
  effectId: SnakeEffectId;
  candidateId: string;
  scheduledTick: number;
  expiresAtTick: number;
  recordCategory: 'standard' | 'assisted' | 'chat-vs-ai';
}
export interface InfluenceRuntimeState {
  queued: InfluenceCommand[];
  applied: Record<string, InfluenceResult>;
  cooldowns: Record<string, number>;
  shieldCharges: number;
  shieldExpiresAtTick: number;
  safeHintUntilTick: number;
  speedPermille: number;
  speedUntilTick: number;
  fogUntilTick: number;
  portalPulseUntilTick: number;
  themeId: string;
  nextChallengeProfile: BoardProfile | null;
  recordCategory: 'standard' | 'assisted' | 'chat-vs-ai';
  chatVsAi: ChatVsAiState;
}
export function generateEffectCandidates(state: SnakeState, effectId: SnakeEffectId): EffectCandidate[];
export function checkEffectEligibility(state: SnakeState, command: InfluenceCommand): EligibilityResult;
export function applyDueInfluence(state: SnakeState, rng: NamedRng): InfluenceStepOutput;
```

- [ ] **Step 1: Write failing candidate and prohibited-outcome tests for all ten effects**

Each placement candidate must be free, reachable, nonlethal on the next move, capacity-preserving, bounded and deterministic. Theme/next-challenge effects must not mutate current gameplay.

- [ ] **Step 2: Write cooldown/conflict/cap/expiry/idempotency tests**

Duplicate command application remains zero. Expired or terminal-state commands reject with stable reasons. Record category changes are explicit.

- [ ] **Step 3: Implement authoritative influence state and reducer**

Apply due commands before AI observation at a deterministic step boundary. Expire timed modifiers in the same ordered boundary. Emit queued/applied/rejected/expired/shield-used semantic events.

- [ ] **Step 4: Integrate real bounded mechanics**

- `bonus-food`: replace current objective with a reachable bonus candidate and expiry.
- `safe-hint`: temporarily increases safe-search preference/confidence without choosing a move.
- `shield-token`: consumes one charge only on an eligible active-hazard collision; cannot protect wall/obstacle/self collision.
- `speed-shift`: sets a bounded public simulation-speed hint of 750–1500 permille; never reduces AI budget.
- `fog-field`: hides noncritical public intent and lowers optional route information for a fixed duration.
- `obstacle-choice`: adds one prevalidated obstacle with no immediate unavoidable collision or invalid partition.
- `portal-pulse`: activates one prevalidated pair for a bounded window.
- `food-choice`: selects one already-valid standard/bonus objective candidate.
- `theme-vote`: changes presentation theme only.
- `next-challenge`: records an eligible next-run profile only.

- [ ] **Step 5: Run effect tests and full replay regressions**

### Task 5: Event Director, Public Interaction State and Browser Vote Experience

**Files:**
- Create: `games/autonomous-snake/src/influence/director.ts`
- Create: `games/autonomous-snake/src/influence/orchestrator.ts`
- Modify: `games/autonomous-snake/src/presentation/snapshot.ts`
- Modify: `games/autonomous-snake/src/presentation/scene.ts`
- Modify: `games/autonomous-snake/src/presentation/semantic.ts`
- Modify: `scripts/serve-snake-stream.cjs`
- Modify: `public/snake-stream/index.html`
- Modify: `public/snake-stream/styles.css`
- Modify: `public/snake-stream/app.js`
- Test: `tests/phase4/director-presentation.test.cjs`
- Test: `tests/browser/snake-interaction.spec.cjs`

**Interfaces:**

```ts
export interface DirectorDecision {
  decisionId: string;
  status: 'open-vote' | 'schedule' | 'cooldown' | 'no-op';
  reason: string;
  candidates: string[];
  window?: VoteWindow;
  command?: InfluenceCommand;
}
export function directInteraction(state: SnakeState, inputs: AudienceInput[], rng: NamedRng): DirectorDecision;
export interface PublicInteractionState {
  mode: 'disabled' | 'autonomous' | 'chat-vs-ai' | 'provider-degraded';
  pressure: number;
  pressureCap: number;
  cooldownUntilTick: number;
  vote: PublicVoteWindow | null;
  lastAcknowledgement: PublicAcknowledgement | null;
}
```

- [ ] **Step 1: Write director exclusion and deterministic-selection tests**

Terminal, recovery, high danger, effect-density, cooldown, conflict, audit/provider uncertainty and no-candidate cases must safely no-op. Identical state/history/inputs/RNG must choose identically.

- [ ] **Step 2: Write public-state privacy and acknowledgement tests**

Only aggregate tallies, bounded pre-authored labels and generic/sanitized acknowledgements enter the render snapshot. Provider IDs, viewer refs, exact amounts, raw text and internal rejection details remain excluded.

- [ ] **Step 3: Implement vote card and consequence UI**

The browser source shows HUMANS vs AI, pressure, option bounds, countdown, aggregate tally, selected effect, queued/applied/rejected/expired state and consequence caption. Critical collision/result/recovery remains higher priority.

- [ ] **Step 4: Add faithful fixture endpoints and browser verification**

The local host may inject signed fixture events through test-only endpoints guarded by an explicit fixture flag. Production builds have no unauthenticated raw-injection endpoint.

### Task 6: Campaigns, Security Review, Evidence and R3 Gate

**Files:**
- Create: `tests/phase4/campaign.test.cjs`
- Create: `scripts/run-snake-interaction-campaign.cjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`
- Create: `evidence/autonomous-snake/r3-phase-04/phase-04/*`
- Modify: `games/autonomous-snake/phases/PHASE-04-AUDIENCE-INTERACTION.md`
- Modify: `games/autonomous-snake/README.md`

- [ ] **Step 1: Run zero, typical and maximum-pressure deterministic campaigns**

Minimum corpus: 150 runs split across no audience, typical free votes, capped entitlement weighting, maximum allowed pressure, duplicate/reconnect bursts, moderation outage, audit outage and provider outage.

- [ ] **Step 2: Require campaign invariants**

Zero duplicate command applications; zero prohibited terminal commands; zero provider IDs/exact payment values in game/public snapshots; zero tick blocking; deterministic rerun; bounded queues; autonomous completion with providers disabled.

- [ ] **Step 3: Run browser interaction capture**

Capture phone/desktop vote, result, degraded and consequence states with no console errors, overflow or critical-scene obstruction.

- [ ] **Step 4: Perform separate specification, security/privacy and engineering reviews**

Resolve every P0/P1 before merge. Faithful fixtures may support the R3 implementation candidate, but live credentialed production-provider verification remains a Phase 6 blocker and must not be claimed.

- [ ] **Step 5: Seal evidence and merge only after final green CI**

Record exact commit, workflow run, fixture versions, official-provider assumptions, test/campaign results, captures, resolved findings, limitations and highest truthful readiness.
