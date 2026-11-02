'use strict';
const BEGIN = '      // BEGIN R50 ORIGINAL QUARRY MINERAL WASH\n';
const END = '      // END R50 ORIGINAL QUARRY MINERAL WASH\n';
const ANCHOR = '      // END R41 COURTYARD ROOT CHANNELS\n';
function section(source) {
  const a = source.indexOf(BEGIN), b = source.indexOf(END);
  if (a < 0 || b <= a || source.indexOf(BEGIN, a + 1) >= 0)
    throw new Error('Expected a single reversible R50 original-mineral section');
  return { a, end: b + END.length, body: source.slice(a, b + END.length) };
}
function stripR50Stone(source) {
  const {a, end} = section(source);
  return source.slice(0, a) + source.slice(end);
}
function reapplyR50Stone(archived, current) {
  if (archived.includes(BEGIN)) throw new Error('Archived original already has R50');
  const {body} = section(current);
  if (archived.split(ANCHOR).length !== 2)
    throw new Error('Archived original is missing its single R41 insertion point');
  return archived.replace(ANCHOR, ANCHOR + body);
}
module.exports = { stripR50Stone, reapplyR50Stone };
