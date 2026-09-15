# Inspection Camera

Camera modes are `room` and `inspect`.

Room mode uses a fixed cinematic perspective that reads the floor plane, back vault wall, side architecture, furniture and distributed puzzle props. Inspect mode moves smoothly toward the selected authoritative object and aims directly at its world position. Reduced-motion mode snaps rather than eases.

Discovery, puzzle-solved and item-combination events may trigger a bounded automatic inspect beat before returning to the room. Manual click/`I` inspection remains until `Escape` or another room reset. Escape events return to room mode and retarget toward the final door for the exit reveal.

Camera motion is cosmetic and never changes legal actions, AI belief, timer, puzzle state or checksum.
