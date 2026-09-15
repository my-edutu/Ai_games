# AI Escape Room — Physical Renderer Addendum

**Status:** approved by direct product-owner instruction on 2026-09-15.

This addendum supersedes only the earlier presentation decision that deferred full spatial rendering. The deterministic symbolic puzzle graph, isolated oracle, partial observation boundary, AI planner, replay/recovery model, audience fairness and immutable presentation boundary remain authoritative.

## Presentation decision
The Cipher Vault is now rendered as a physical browser-based WebGL room. The browser consumes `EscapeRenderSnapshot`; it never owns puzzle truth. A safe `mechanismKind` may be exposed for visible presentation, but solution strings, hidden facts, oracle routes, seeds and private run identifiers remain excluded.

## Required visible behavior
The room contains floor, walls, furniture, vault/exit geometry, practical fixtures, physical clues, tools and puzzle mechanisms. Sequence locks, symbol ciphers, shape ordering, tool receptacles, switch networks, balance mechanisms, direction patterns and the final vault have distinct geometry. Solved state produces physical changes rather than toast-only feedback.

Camera modes are room overview and object inspection, with bounded automatic close-ups for discoveries/solves. Viewer/manual interaction is presentation-only: click or keyboard inspection cannot solve a puzzle. Clean feed hides nonessential HUD while preserving the room and captions.

## Reliability
The implementation remains dependency-free at runtime, respects the existing CSP, uses one shared cube vertex buffer, bounds state objects at the existing snapshot cap, and exposes renderer diagnostics for CI. WebGL failure enters the existing safe-scene path rather than inventing state.
