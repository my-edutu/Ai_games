# Current Provider Validation Sources

**Last checked:** August 16, 2026  
**Purpose:** Define the authoritative live-validation checklist for Autonomous Snake Phase 6. Fixture and adapter tests prove implementation compatibility; they do not replace credentialed production-equivalent evidence.

## Twitch EventSub Webhooks

Official source: https://dev.twitch.tv/docs/eventsub/handling-webhook-events/

Validation requirements:

- Preserve the exact raw HTTP request body for signature verification.
- Build the signed message from the EventSub message ID, message timestamp, and raw body in the documented order.
- Compute HMAC-SHA256 using the subscription secret and compare without timing leakage.
- Reject malformed, forged, stale, or implausibly future envelopes before normalization.
- Treat EventSub delivery as at-least-once and deduplicate by message ID plus normalized idempotency key.
- Store only privacy-safe normalized evidence; do not persist provider secrets or raw payment data in game/public state.

## Twitch EventSub WebSockets

Official source: https://dev.twitch.tv/docs/eventsub/handling-websocket-events

Validation requirements:

- Handle welcome, keepalive, reconnect, notification and revocation messages.
- On reconnect instructions, establish the replacement connection using the supplied reconnect URL before retiring the old connection.
- Verify subscription/token ownership and scope boundaries.
- Prove clean disconnect/reconnect behavior, duplicate handling, revoked subscription behavior and no-authority-loss degradation.
- Record that lost WebSocket notifications are not silently reconstructed as if the provider replayed them; the game must continue autonomously while interaction availability is degraded.

## YouTube Live Chat Messages

Official source: https://developers.google.com/youtube/v3/live/docs/liveChatMessages

Validation requirements:

- Use supported Live Chat message resources and methods for the active broadcast.
- Normalize declared message families only, including ordinary text, Super Chat/Super Sticker, new membership/sponsor, membership gifting and received gift events where available.
- Reject unknown or unsupported message types as executable input.
- Preserve provider event IDs for dedupe while replacing channel/user identities with scoped privacy-safe references.
- Exact payment amounts, billing data, access tokens and raw profiles must remain outside authoritative and public state.

## YouTube OAuth 2.0 for Server-Side Applications

Official source: https://developers.google.com/youtube/v3/live/guides/auth/server-side-web-apps

Validation requirements:

- Use an authorized user OAuth flow and the minimum required scopes.
- Do not use service-account authentication for user-owned YouTube channels where it is unsupported.
- Exercise authorization, token refresh, revoked consent, expired credentials, scope failure and credential rotation/revocation.
- Keep refresh/access tokens in managed secret storage; never log or expose them in browser snapshots, metrics or game events.

## Evidence Required for Phase 6 Provider Gate

For both YouTube and Twitch, the release bundle requires evidence tied to the exact frozen candidate checksum and containing:

1. credentialed production-equivalent environment identity;
2. authentication/signature or OAuth success and expected rejection cases;
3. reconnect/disconnect behavior;
4. at-least-once duplicate/idempotency behavior;
5. reversal/refund or entitlement correction policy where applicable;
6. rate-limit and burst behavior;
7. outage/degradation behavior with uninterrupted autonomous play;
8. privacy/redaction confirmation;
9. primary logs/traces or capture digest;
10. collection timestamp, expiry, owner and independent witness/reviewer.

CI fixtures remain valuable regression evidence but are deliberately classified as `not-credentialed`, `not-production-equivalent`, and `not-external-signed` by the R5 assessor.