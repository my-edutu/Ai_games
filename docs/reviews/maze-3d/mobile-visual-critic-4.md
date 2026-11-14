# Mobile visual critique 4 — blind A/B review

## Verdict

**Choose B.** This preference was fixed after inspecting only the four supplied images, before accessing any repository file or prior review. I did not inspect implementation, version identity, browser state, or earlier reports.

The two anonymous game renders were viewed at their supplied **390 × 844 portrait size**:

- `/tmp/maze-blind-mobile/A.png`
- `/tmp/maze-blind-mobile/B.png`

The fixed quality references were:

- `/tmp/maze-benchmark/toad-scene.jpg`
- `/tmp/maze-benchmark/toad-maze.jpg`

The recognizable Captain Toad/Nintendo references cannot be perfectly blinded. Their identity may influence expectations. The A/B preference itself was blind; I do not know which render represents the newer implementation.

This is a still-image judgment. Motion quality, autonomous behavior, animation, audio, frame rate, actual touch hit areas, and functional correctness were not tested.

## Why B wins at native mobile size

### The adventure gets substantially more of the screen

B's scene runs from approximately y=66 to y=586, compared with y=66 to y=486 in A. That is about **100 additional vertical pixels**, or roughly a quarter more scene height. The larger view makes the explorer, stairs, key shape, vegetation, and stone surfaces easier to distinguish without enlarging the screenshot.

The explorer is visibly larger in B. Its helmet, pale face/eyes, teal torso, arms, and boots separate more clearly at a glance. A contains the same basic visual information, but its character reads more like a small marker amid the architecture.

### The HUD fits a portrait screen more successfully

B presents “Find the key” on one line, then groups time, discovery, and the key count into a compact horizontal status area. The current intention, “Following a key,” remains visible beneath it. This creates a clear sequence: scene, objective, status, intention.

In A, the two-line objective sits beside a second status column, followed by a keyring column and a large boxed intention card. Those separate regions pull attention away from the character and consume much of the lower screen. The steps counter contributes another competing number. The result feels more like monitoring a dashboard than watching the expedition.

B's lower-right “Map” control is a cleaner mobile affordance than A's permanently visible minimap panel. A's minimap covers a conspicuous part of the scene while its tiny passages and marks are difficult to interpret at native size. B's button has a readable word, map icon, and disclosure indicator. Its opening behavior remains untested.

### The visible language is more finished

B's field note, “A locked passage opened,” describes an event in the world. A's “Route unlocked: door-1” exposes an internal-looking identifier. B is more coherent with the fantasy expedition tone.

A does preserve two useful pieces of context that B could retain in a lighter form: the location name “The lost gardens” and the explanatory line beneath the next-move heading. Those are small advantages of A, but they do not outweigh B's substantially better allocation of portrait space.

## Character readability

Both renders show an original-looking, volumetric explorer with a recognizable helmet, teal outfit/body, contrasting face/eye area, arms, and boots. It is visibly a constructed 3D character rather than an abstract pawn. B gives those features enough pixels to read appreciably better.

The remaining gap is personality. From these stills, the explorer has a fairly neutral, camera-facing appearance. The eyes and face occupy a small area and do not communicate a distinctive emotion or a clear response to the nearby objective. The materials and shapes remain quite simple. The supplied Captain Toad scene gives its protagonist a strong silhouette, distinctive headgear, a readable face, backpack, and a specific action context. Its enemies also have expressive faces and contrasting silhouettes. Neither candidate offers comparable visible character interaction or a distinctive encounter in the submitted frame.

For the next round, keep B's minimum on-screen character size and strengthen an original silhouette, facial readability, and attention pose. A head/body orientation or gaze toward the active target would help the still frame explain intent. Verify any animation separately; these screenshots provide no basis for crediting or criticizing animation quality.

## World readability and the Captain Toad quality bar

Both candidates have a coherent visual foundation: warm pale masonry, dark green/teal structural bands, turquoise water, restrained greenery, stepped elevations, and strong dimensional shadows. The raised garden architecture has an identifiable aesthetic. B makes the stairs and changes of height easier to read locally.

The largest gap is **a scene that visibly communicates a particular adventure and its immediate cause-and-effect**. Much of each render consists of similar cream corridors and parapets. Their repetition and the tight crop make it difficult to reconstruct the larger route or identify a memorable destination. The frame contains attractive architecture, but few strongly differentiated landmarks, obstacles, or character encounters.

The first Captain Toad reference presents a compact stage whose major elements have distinct visual roles: gold reward, blue ladders, green block mass, archways, switches, and expressive moving-obstacle characters. The second reference makes the protagonist, small platform, water channel, grass bank, tower doorway, and coin-bearing platform spatially distinct. Even in a still, each image suggests a concrete traversal or puzzle situation.

In B, a gold key-shaped object is visible left of the explorer, but its pale gold sits close to the pale stone palette. It has less immediate contrast than the reference rewards. The next desired movement is not legible from the character and environment alone. “Find the key” and “Following a key” explain the category of action without identifying the exact next waypoint or why this route matters.

There is **no evidence of Captain Toad parity**. B is the stronger mobile presentation of the two, but its current character performance, encounter staging, reward separation, landmark hierarchy, and surface richness remain visibly less developed than the supplied references. The reference images are larger landscape captures, so this review does not equate raw pixel sharpness across them; the comparison concerns composition, distinctiveness, legibility, and visible design relationships.

## Mobile controls and information issues

- **Top controls:** The four icon buttons have visually generous, separated frames, approximately 44 pixels high. Speaker and fullscreen are relatively familiar; the stacked-layers and sliders icons are less self-explanatory. The screenshot does not establish actual hit target dimensions or behavior.
- **Autonomous viewing controls:** No plainly labeled pause/resume or playback-speed control is visible in either render. Such controls might exist behind an icon, but the stills do not communicate that. A compact, visible “Pause” and speed indicator would make the watching experience more immediately understandable.
- **Small text:** B's metric labels and some secondary text remain small at 390 pixels wide. A's supporting copy is also small. Increase the most consequential secondary labels before adding further information.
- **Goal progress:** Both show “Find the key” while also reporting one key collected. The frame does not explain whether another key is needed, how many remain, or whether the collected key has already opened a passage. Make the current goal and inventory relationship explicit using the game's actual state.
- **Intent:** B's “Following a key” is concise but mostly repeats the objective. Its “Path notes” affordance suggests extra explanation, while the currently visible line does little to connect the explorer to a particular object or route.
- **Map:** B's labeled control is preferable to A's tiny always-open minimap. Preserve access without restoring a large permanent scene overlay. Verify the open-map layout on a real portrait viewport in a separate interaction check.

## Concrete next builder round

1. **Use B as the mobile layout baseline.** Preserve the enlarged scene, single-line objective, compact metrics, and concise natural-language field note.
2. **Stage one unmistakable local objective.** Give the active key/door/exit stronger color or light separation, and connect it to the explorer with a restrained target cue or readable pose. Avoid making every decorative object equally prominent.
3. **Add a distinctive scene event or obstacle.** A clearly identifiable guardian, traversal mechanism, or landmark should make this section recognizable beyond its repeated corridor pattern. Show how it changes the explorer's route in the composition.
4. **Develop the original explorer's identity.** Improve silhouette and face readability at the size shown in B; give the current action an intentional pose or gaze. Do not substitute a larger generic body for personality.
5. **Clarify the next action in the HUD.** Use the actual target and progress state, such as which remaining key or newly opened route the explorer is pursuing, instead of repeating the broad goal.
6. **Expose essential watching controls.** Show a discoverable pause/resume affordance and speed state without shrinking the scene or rebuilding A's dense lower dashboard.

The highest-value next improvement is not more status information. It is a stronger visible relationship among **explorer, immediate objective, distinctive obstacle, and route**, while retaining B's mobile framing.
