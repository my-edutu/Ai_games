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
    if (isBreak) { currentPath = []; paths.push(currentPath); }
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
  return { paths, direction };
}
