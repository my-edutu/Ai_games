# Game 7 — Marble Survival Tournament

## Phases 1–6 completion record

Game 7 is an autonomous, deterministic marble-survival tournament designed for long-running browser-source broadcasts. This completion layer preserves the established fixed-authority foundation and adds the campaign, presentation, audience, operations, and release systems required for a reviewable software candidate.

## Run locally

```bash
node --test games/marble-survival/tests/complete/game7.test.cjs
node games/marble-survival/scripts/verify-complete-runtime.cjs
node games/marble-survival/scripts/serve-complete-runtime.cjs --self-test
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

Open `http://localhost:4317`. Add `?clean=1` for the clean OBS/browser-source feed.

Set a non-default operator token outside local development:

```bash
GAME7_OPERATOR_TOKEN='replace-with-secret-manager-value' \
GAME7_SEED='broadcast-2026-08-18' \
PORT=4317 \
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

## Phase 1 — deterministic foundation

**Delivered**

- Thirty-two immutable competitors distributed evenly across navigator, sprinter, bruiser, and survivor archetypes.
- Pattern-based identities as well as colour-based identities.
- Seeded, named deterministic random streams.
- Bounded integer traits and local observations.
- Five valid arenas, including explicitly mirrored championship geometry.
- Checksums and invariant validation.

**Gate**

The same seed must produce the same roster, arenas, bracket, champion, and campaign checksum. The authority module rejects ambient randomness and wall-clock time.

## Phase 2 — AI campaign

**Delivered**

- Bounded actions: integer steer `[-2, 2]`, thrust `[0, 3]`, and an allow-listed intent.
- Decisions use only local observations such as nearby features, crowding, lane, and progress.
- Five rounds: Qualifier, Hazard Gauntlet, Moving Gates, Duel Lanes, and Championship.
- Exact elimination bracket: `32 → 16 → 8 → 4 → 2 → 1`.
- Replay verification and a multi-seed archetype corpus.

**Gate**

Every campaign validates its entrant and qualification counts, prevents duplicate/non-entrant qualification, and reproduces its checksum on replay.

## Phase 3 — broadcast presentation

**Delivered**

- Responsive desktop, mobile, and clean-feed layouts.
- Canvas arena with hazards, gates, sweepers, boosts, finish line, patterned marbles, qualification glow, leaderboard, metrics, event pulse, and champion reveal.
- Public snapshot contains only sanitized presentation state; authority seed, RNG internals, credentials, and operator audit data are excluded.
- Deterministic camera directives and stale-snapshot rejection.
- Semantic synthesized audio is capped and begins only after viewer opt-in.
- Reduced-motion support, keyboard focus visibility, live regions, non-colour identity, and a skip link.

**Gate**

The server self-test verifies the browser shell, snapshot sanitization, health endpoint, influence path, and denied/accepted operator requests.

## Phase 4 — bounded audience influence

**Delivered**

Exactly six fixed influence families:

1. Wind vote
2. Gate tempo
3. Shield orb
4. Cheer pulse
5. Theme vote
6. Next arena

Each family has fixed options. Submissions enforce eligibility, idempotency, per-user cooldown, global rate limiting, a hard queue cap, bounded deduplication, and deterministic tie resolution. The browser exposes only the current fixed vote surface; it cannot submit arbitrary physics or authority mutations.

**Gate**

Malformed, duplicated, ineligible, invalid, over-rate, cooldown, and queue-overflow submissions are rejected with a bounded reason.

## Phase 5 — operations and recovery

**Delivered**

- Checksummed snapshot ring with fallback from a corrupt latest snapshot.
- Health classification for authority stop, snapshot loss, tick lag, and stream disconnect.
- Bearer-authenticated allow-listed operator commands: restart, pause, resume, and clean feed.
- Constant-work token comparison and bounded audit history.
- Security headers, no-store API responses, request-body size limits, traversal-safe static serving, health and Prometheus-style metrics endpoints.
- Declared chaos checks for replay, corruption fallback, duplicate influence, and lag degradation.

**Gate**

A candidate fails when recovery cannot restore the latest valid snapshot, health cannot classify known faults, operator authentication can be bypassed, audit storage grows without a bound, or any chaos check fails.

## Phase 6 — release review

**Delivered**

- Repository build baseline.
- Syntax checks for authority, operations, release runner, and browser client.
- Eighteen phase-focused Node tests.
- Ninety-six-seed campaign/replay corpus.
- Browser-source self-test.
- Authority nondeterminism scan.
- Browser asset/accessibility-hook checks.
- Generated release report uploaded by CI.

### Honest readiness boundary

Passing the software checks may qualify the branch as an **R4 software candidate**. It does **not** qualify the system as R5 production-ready.

R5 stays false until all of the following genuine external evidence is attached and reviewed:

- 72-hour endurance run;
- seven-day canary;
- credentialed production streaming-provider session;
- independent security review;
- independent accessibility review;
- witnessed recovery drill;
- production capacity proof.

The release validator is deliberately unable to infer or fabricate those proofs from unit tests or documentation.
