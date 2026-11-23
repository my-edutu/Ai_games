// Pure presentation transforms. No authoritative object is modified here.
const distance = (a, b, width) => Math.abs(a % width - b % width) + Math.abs(Math.floor(a / width) - Math.floor(b / width));
export function cellPoint(cell, width, height) {
  return { x: cell % width - (width - 1) / 2, z: Math.floor(cell / width) - (height - 1) / 2 };
}

export function buildMotion(snapshot, previous, fraction = 1) {
  const { width, height, snake = [] } = snapshot;
  const alpha = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 1;
  const consecutive = previous && previous.runToken === snapshot.runToken
    && previous.width === width && previous.height === height
    && snapshot.movementStep === previous.movementStep + 1;
  const paths = [];
  const fragmentStarts = [];
  let currentPath;
  let direction = { x: 1, z: 0 };
  for (let i = 0; i < snake.length; i++) {
    const cell = snake[i].cell;
    const point = cellPoint(cell, width, height);
    const oldCell = previous?.snake?.[i]?.cell;
    if (consecutive && Number.isInteger(oldCell) && distance(oldCell, cell, width) <= 1) {
      const old = cellPoint(oldCell, width, height);
      point.x = old.x + (point.x - old.x) * alpha;
      point.z = old.z + (point.z - old.z) * alpha;
    }
    const isBreak = i === 0 || distance(cell, snake[i - 1].cell, width) !== 1;
    if (isBreak) { currentPath = []; paths.push(currentPath); fragmentStarts.push(i); }
    const last = currentPath[currentPath.length - 1];
    if (!last || Math.hypot(last.x - point.x, last.z - point.z) > 0.0001) currentPath.push(point);
  }
  if (snake.length > 1 && distance(snake[0].cell, snake[1].cell, width) === 1) {
    const head = cellPoint(snake[0].cell, width, height);
    const neck = cellPoint(snake[1].cell, width, height);
    direction = { x: head.x - neck.x, z: head.z - neck.z };
  } else if (consecutive && snake.length && previous.snake?.length && distance(snake[0].cell, previous.snake[0].cell, width) === 1) {
    const head = cellPoint(snake[0].cell, width, height);
    const old = cellPoint(previous.snake[0].cell, width, height);
    direction = { x: head.x - old.x, z: head.z - old.z };
  }
  // A portal may leave a one-cell head on the far bank. The old east-facing
  // default was invented, not inferred from public motion: preserve the
  // previous contiguous head/neck heading within this SAME movement/run.
  // No direction or position is ever interpolated across the portal itself.
  const oldCells = consecutive ? previous?.snake : null;
  function publicHeadward(front, back) {
    const a = oldCells?.[front]?.cell, b = oldCells?.[back]?.cell;
    if (!Number.isInteger(a) || !Number.isInteger(b) || distance(a, b, width) !== 1) return null;
    const headward = cellPoint(a, width, height), tailward = cellPoint(b, width, height);
    return { x: headward.x - tailward.x, z: headward.z - tailward.z };
  }
  if (paths[0]?.length === 1) {
    const previousHeading = publicHeadward(0, 1);
    if (previousHeading) direction = previousHeading;
  }
  // A long snake can straddle several portal fragments. Each isolated stub
  // has its own preceding public-body tangent; using the HEAD direction for
  // every stub made detached segments point towards imaginary connections.
  const fragmentDirections = paths.map((path, pathIndex) => {
    if (path.length > 1) {
      const a = path[0], b = path[1];
      const dx = a.x - b.x, dz = a.z - b.z, n = Math.hypot(dx, dz);
      return n > 0.0001 ? {x:dx/n, z:dz/n} : direction;
    }
    const index = fragmentStarts[pathIndex];
    return publicHeadward(index - 1, index)
      || publicHeadward(index, index + 1)
      || direction;
  });
  return { paths, direction, fragmentDirections };
}
