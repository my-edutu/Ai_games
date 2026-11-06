// Only a real unlocked cap threshold may request this optional camera escort.
// Pure, source-independent framing veto: never touches authority or input.
export function gatewayScreenError(ndc) {
  if (!Array.isArray(ndc) || ndc.length !== 3 ||
      !ndc.every(Number.isFinite) || ndc[2] < -1 || ndc[2] > 1)
    return Infinity;
  return Math.max(0, Math.abs(ndc[0]) / .78 - 1,
    Math.abs(ndc[1]) / .76 - 1);
}
function readableBody(body) {
  return Array.isArray(body) && body.length === 4 &&
    body.every(Number.isFinite) && body[2] >= -1 && body[2] <= 1 &&
    body[3] >= .035 && Math.abs(body[0]) <= .77 &&
    Math.abs(body[1]) + body[3] <= .76;
}
export function acceptEarnedGatewayEscort({
  gateBefore, gateAfter, actorBefore, actorAfter,
  actorCoreClear, gatewayCoreClear,
}) {
  const before = gatewayScreenError(gateBefore);
  const after = gatewayScreenError(gateAfter);
  if (!actorCoreClear || !gatewayCoreClear ||
      !readableBody(actorBefore) || !readableBody(actorAfter) ||
      !Number.isFinite(before) || !Number.isFinite(after) ||
      before <= .035 || after > before - .018) return 0;
  return before - after;
}
