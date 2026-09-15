# Tournament Presentation

## Principle
Gameplay remains primary. Tournament state should be understandable without turning the experience into a dashboard.

## Existing authority presented
The runtime exposes round number, quota, remaining entrants, qualification state, standings, official event history, champion state and server camera direction. The WebGL arena presents the same authoritative state as the existing fallback renderer.

## Current presentation states
- live round: compact status strip + arena + standings;
- qualification pressure: cut-line camera can focus contested entrants;
- elimination/recovery: event-driven visual effect and official event copy;
- tournament result: champion card plus victory camera directive;
- clean feed: HUD overlays can be hidden while the arena remains rendered.

## Integrity
No presentation layer may select qualifiers, modify finish order, guarantee an elimination, force a comeback or fabricate a champion.

## Incomplete items
A dedicated short intermission scene, richer semifinal/final transition, full podium ceremony, replay snippets and persistent tournament storytelling require further runtime/browser work and are not marked complete.