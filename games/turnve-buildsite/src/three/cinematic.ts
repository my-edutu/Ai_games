export type CinematicPose = {
  position: [number, number, number];
  target: [number, number, number];
};

export const PRESTART_CINEMATIC_DURATION = 24;

const PRESTART_SHOTS: CinematicPose[] = [
  { position: [-25, 8.2, 25], target: [-6, 1.5, 10] },
  { position: [-13, 5.6, 18], target: [-2, 1.4, 10] },
  { position: [20, 5.5, 15], target: [10, 1.25, 0] },
  { position: [22, 4.4, -13], target: [8, 1.25, -5] },
  { position: [-2, 8.7, -26], target: [5, 2, 0] },
  { position: [-25, 8.2, 25], target: [-6, 1.5, 10] },
];

function smoothstep(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function lerpTuple(
  from: [number, number, number],
  to: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

export function preStartCinematicPose(elapsedSeconds: number): CinematicPose {
  const duration = PRESTART_CINEMATIC_DURATION;
  const wrapped = ((elapsedSeconds % duration) + duration) % duration;
  const segmentCount = PRESTART_SHOTS.length - 1;
  const segmentFloat = (wrapped / duration) * segmentCount;
  const segment = Math.min(segmentCount - 1, Math.floor(segmentFloat));
  const local = smoothstep(segmentFloat - segment);
  const from = PRESTART_SHOTS[segment];
  const to = PRESTART_SHOTS[segment + 1];

  return {
    position: lerpTuple(from.position, to.position, local),
    target: lerpTuple(from.target, to.target, local),
  };
}
