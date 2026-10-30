# Viewer interaction

This build provides local controls. It has no Twitch, YouTube, chat, payment or remote user integration, and no account or personal data collection.

## Authoritative commands

- `set-demand`: normalized demand from 0.25 to 2.
- `set-policy`: `adaptive` or `fixed`.
- `toggle-incident`: toggle the eastbound central roadworks speed restriction.
- `reset`: begin a new run with a validated seed.

Commands are validated, rate-bounded and recorded with logical tick/sequence. Invalid commands fail visibly without partially changing state. Pausing and simulation speed affect scheduling, not the fixed simulation step. Camera, day/night, overlays and mute are presentation controls.

Roadworks slow traffic on the specified central link; they do not promise a full lane closure. UI copy and road furniture must show the same effect as the authority.

Future audience integration must use the catalogue's authenticated, moderated and idempotent gateway. It must disclose bounds and cannot guarantee a particular outcome. Those providers remain outside this implementation's verified scope.
