# Camera Director

The camera is a bounded spectator system. It never changes simulation outcomes.

## Shot priority

1. Queen danger / queen attacked
2. Active predator
3. Excavation / tunnel completion
4. Milestone
5. Food carrier / foraging
6. Colony overview

Server-provided semantic camera state remains an input. The browser documentary director adds dwell and cooldown rules so the view does not jitter between events. High-priority crises may interrupt a lower-priority shot; ordinary events wait for dwell/cooldown.

## Motion

Framing translates/zooms the existing world renderer around a real authoritative cell/entity. Reduced-motion mode suppresses cinematic zoom/shake. The clean feed preserves camera behavior while removing overlays.

## Truthfulness

The director selects what the viewer sees; it cannot spawn predators, move ants, complete tunnels, alter food, damage the queen, force milestones or create fake events.