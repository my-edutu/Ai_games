export function nextRandom(state: number): [number, number] {
  let x = state >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const next = x >>> 0;
  return [next / 4294967296, next || 0x9e3779b9];
}

export function randomRange(state: number, min: number, max: number): [number, number] {
  const [r, next] = nextRandom(state);
  return [min + (max - min) * r, next];
}

export function randomInt(state: number, min: number, maxExclusive: number): [number, number] {
  const [r, next] = nextRandom(state);
  return [min + Math.floor(r * Math.max(1, maxExclusive - min)), next];
}
