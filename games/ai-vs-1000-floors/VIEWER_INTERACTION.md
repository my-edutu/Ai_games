# Viewer interaction

The current application is a local spectator experience. It exposes pause, 1×/2×/4× playback, follow/wide/orbit camera, optional audio and settings. Playback speed executes more fixed simulation ticks; it does not stretch the physics step. Camera and quality changes affect presentation only.

Settings include reduced motion, lower scene quality, clean feed, explicit checkpoint recovery and a confirmed fresh start. Invalid saved data is kept while the application offers a fresh start. Review URLs disclose that progress is not saved. Storage denial is surfaced as temporary progress.

Controls use native buttons, a native settings dialog and labelled form inputs. Loading/error states make the game HUD inert. Sound requires a viewer gesture and can be muted. Document visibility changes suspend sound; page exit requests a save.

No chat, payment, account, voting or audience-provider integration is present in this candidate. Such integration requires the catalogue gateway and its separate authentication, eligibility, moderation, idempotency and fairness evidence before being offered to viewers.
