'use strict';

const crypto = require('node:crypto');
const COOKIE = 'game7_session';
const SESSION_MS = 60 * 60 * 1000;

/** A browser session is not a verified person or a paid-provider entitlement. */
function createHttpSession(clock, secureCookies = false) {
  const secret = crypto.randomBytes(32);
  const sign = value => crypto.createHmac('sha256', secret).update(value).digest('hex');
  function identity(request) {
    const cookie = String(request.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`));
    const value = cookie?.slice(COOKIE.length + 1) || '';
    if (!/^[a-f0-9]{48}\.[0-9]{1,15}\.[a-f0-9]{64}$/.test(value)) return null;
    const [nonce, issued, provided] = value.split('.');
    const age = clock() - Number(issued);
    if (age < 0 || age >= SESSION_MS) return null;
    const expected = sign(`${nonce}.${issued}`);
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex')) ? nonce : null;
  }
  function ensure(request, response) {
    if (identity(request)) return;
    const payload = `${crypto.randomBytes(24).toString('hex')}.${Math.floor(clock())}`;
    response.setHeader('set-cookie', `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600${secureCookies ? '; Secure' : ''}`);
  }
  function allowOrigin(request) {
    if (request.headers['sec-fetch-site'] === 'cross-site') return false;
    if (!request.headers.origin) return true;
    try { return new URL(request.headers.origin).host === request.headers.host; }
    catch { return false; }
  }
  // Only the normalized identity and command key leave the HTTP boundary.
  function commandId(session, id) { return sign(`${session}:${id}`); }
  return { identity, ensure, allowOrigin, commandId };
}

module.exports = { createHttpSession };
