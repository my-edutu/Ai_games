# Viewer interaction

Enabled interactions are presentation-only: contender selection, director/follow/tactical camera, camera orbit/zoom, audio mute, reduced motion, lower graphics tier and clean feed. They do not send authoritative commands.

The host accepts GET and HEAD. Mutating methods return 405. There is no chat, payment, voting, authentication or provider SDK. New authoritative audience features must pass the shared gateway and fairness contracts before being enabled; this build makes no claim to support them.

Each contender has a keyboard-accessible selection button with an accessible full name. Camera buttons expose pressed state. Settings expose their expanded state, and keyboard shortcuts retain normal input-field behavior. Audio is optional and every essential state is visible.
