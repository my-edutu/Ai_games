# Game 9: visible, correctly animated authored characters

Continue draft PR #49 at 3200f6ed8b10fcb58fbf6ee17e21f6044ff0fabb. The user's approved goal is a complete autonomous 3D dungeon with Diablo IV as the primary visual bar, with Path of Exile 2 and No Rest for the Wicked as supporting references. This is a corrective increment, not a claim that that bar has been reached.

Evidence: Actions run 37869902202 passed authority but failed the browser job. Its retained trace contains repeated CSP rejections of embedded GLB texture blob URLs, and the actual screenshots show white authored rigs. The camera test expected chase while its most recent render diagnostic still said tactical. Model animation source ignores actionTick, allowing a second same-type attack to remain in its completed pose.

Approaches: increasing brightness or tinting white meshes would hide the texture defect; replacing assets would discard existing art without fixing loading; repair and verify the existing material/animation path first. The last approach is the implementation decision.

Constraints: keep the same assets/licences and autonomous authority; no gameplay, paid influence, credentials or external runtime services; restrict the CSP change to local blob image loading, never blob scripts. Reject partially loaded authored art and keep the procedural fallback visible. Change only the active draft branch, never merge. Keep tests and progress honest about the absence of an independent blind review.

Deliverable: material decoding and repeated one-shot regressions; material-readiness diagnostics; asynchronous camera assertions; a portable embedded-image browser regression; a truthful round-16 progress entry. Full character/environment art improvements remain open.
