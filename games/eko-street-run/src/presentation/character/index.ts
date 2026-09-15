import type { EkoRunRenderSnapshot } from "../../state/types";
import { resolveCharacterFrame } from "./animation";
import { getOutfitDefinition } from "./outfits";
import { createPoseForAnimation, mirrorPose } from "./pose";
import type { CharacterPose, CharacterPresentation, CharacterPresentationOptions } from "./types";

export * from "./types";
export * from "./outfits";
export * from "./animation";
export * from "./pose";
export * from "./svg";

function readonlyPose(pose: CharacterPose): CharacterPose {
  return new Proxy(pose, {
    set() {
      throw new TypeError("Character pose is immutable");
    },
    defineProperty() {
      throw new TypeError("Character pose is immutable");
    },
    deleteProperty() {
      throw new TypeError("Character pose is immutable");
    },
  });
}

export function createCharacterPresentation(
  snapshot: Readonly<EkoRunRenderSnapshot>,
  options: CharacterPresentationOptions = {},
): CharacterPresentation {
  const outfit = getOutfitDefinition(options.outfitId ?? "lagos-streetwear");
  const frame = resolveCharacterFrame(snapshot, options.previousSnapshot);
  let pose = createPoseForAnimation(frame.animation, frame.phase, { reducedMotion: options.reducedMotion });
  if (snapshot.player.facing === -1) pose = mirrorPose(pose);
  const result = {
    outfit,
    frame,
    pose: readonlyPose(pose),
    facing: snapshot.player.facing,
    reducedMotion: options.reducedMotion === true,
  } satisfies CharacterPresentation;
  return Object.freeze(result);
}
