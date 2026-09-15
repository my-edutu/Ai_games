# Character Animation

## Explorer representation
The public browser no longer represents the explorer as a circle. `drawExplorer` builds a readable humanoid silhouette from torso, head, legs, arms, pack and forward light geometry.

## Presentation states
Current implementation derives bounded presentation from public intent/confidence:
- idle: subtle breathing motion;
- moving/searching: alternating gait motion;
- cautious/low confidence: lowered body posture;
- directional awareness: camera look-ahead follows the public planned route.

These motions are visual only. The explorer remains anchored to `snapshot.currentCell`; authoritative pathing and movement timing are unchanged.

## Reduced motion
When reduced-motion mode is active, gait/bobbing and other periodic movement are suppressed while state readability remains intact.

## Next evidence gate
Browser screenshots must confirm that the silhouette is readable at 1080p and landscape/mobile broadcast sizes. More elaborate turn, pickup, door, hit, fall and victory animation should not be claimed complete until running-game evidence demonstrates them.
