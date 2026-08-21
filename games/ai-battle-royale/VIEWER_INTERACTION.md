# Viewer Interaction — AI Battle Royale

Viewers act as arena strategists, not executioners. They vote among pre-authored global effects. Provider adapters normalize and authenticate externally; game code receives only bounded provider-neutral inputs.

## Fixed-choice policy

- one ballot per tokenized viewer per logical window;
- free weight one, paid-eligible weight capped at two;
- deterministic tie resolution;
- no contender targeting, arbitrary text or raw payment data;
- global disable and provider-outage fallback preserve autonomous play;
- accepted, rejected, queued, applied, expired and reversed states use stable reason codes;
- processed IDs, ballots, audit and scheduled effects are bounded.

## Prohibited powers

The audience cannot guarantee victory, death, prize, record, collision, final placement or unavoidable damage; alter resolved combat; expose hidden AI information; bypass moderation or cooldowns; or write arbitrary text to the stream.
