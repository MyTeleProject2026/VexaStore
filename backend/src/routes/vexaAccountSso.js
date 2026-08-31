const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { config, requireConfig, stateSecret, sign, makeState, makeVerifier, authorizationUrl, exchange, userInfo } = require('../services/vexaAccountSso');

const router = express.Router();
const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();
const COOKIE_NAME = 'vexastore_sso_tx';
const SESSION_COOKIE = 'vexastore_session';
const secure = process.env.NODE_ENV === 'production';

function setStateCookie(res, state, verifier) {
  const issuedAt = Date.now();
  const payload = `${state}.${verifier}.${issuedAt}`;
  const value = `${payload}.${sign(payload)}`;
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure ? '; Secure' : ''}`);
}
function readState(req) {
  const header = req.headers.cookie || '';
  const raw = header.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  const value = decodeURIComponent(raw.slice(COOKIE_NAME.length + 1));
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const [state, verifier, issuedAt, signature] = parts;
  const payload = `${state}.${verifier}.${issuedAt}`;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  if (!Number.isFinite(Number(issuedAt)) || Date.now() - Number(issuedAt) > 10 * 60 * 1000) return null;
  return { state, verifier };
}
function clearCookies(res) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`,
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
  ]);
}
function sessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`);
}

router.get('/start', (req, res) => {
  try {
    if (!JWT_SECRET) return res.status(503).json({ success: false, message: 'JWT_SECRET must be configured' });
    const state = makeState();
    const verifier = makeVerifier();
    setStateCookie(res, state, verifier);
    res.json({ success: true, state, authorization_url: authorizationUrl(state, verifier) });
  } catch (error) { res.status(503).json({ success: false, message: error.message || 'VexaAccount SSO unavailable' }); }
});

router.get('/login', (req, res) => {
  try {
    if (!JWT_SECRET) return res.status(503).send('VexaStore SSO is not configured');
    const state = makeState();
    const verifier = makeVerifier();
    setStateCookie(res, state, verifier);
    res.redirect(authorizationUrl(state, verifier));
  } catch (error) { res.status(503).send(error.message || 'VexaAccount SSO unavailable'); }
});

async function finish(req, res, code, state) {
  try {
    const tx = readState(req);
    if (!code || !state || !tx || tx.state !== state) { clearCookies(res); return res.status(400).send('Invalid or expired VexaAccount SSO transaction'); }
    const tokens = await exchange(code, tx.verifier);
    if (!tokens?.access_token) throw new Error('VexaAccount did not return an access token');
    const profile = await userInfo(tokens.access_token);
    const accountId = String(profile?.sub || '').trim();
    const email = String(profile?.email || '').trim().toLowerCase();
    if (!accountId || !email) throw new Error('VexaAccount profile is missing required identity fields');
    const [existing] = await pool.query('SELECT * FROM store_users WHERE email=? LIMIT 1', [email]);
    let user = existing[0];
    if (user) {
      await pool.query('UPDATE store_users SET is_verified=1,is_active=1,name=COALESCE(?,name),avatar_url=COALESCE(?,avatar_url),country=COALESCE(?,country) WHERE id=?', [profile.name || null, profile.picture || null, profile.country || null, user.id]);
      const [fresh] = await pool.query('SELECT * FROM store_users WHERE id=?', [user.id]);
      user = fresh[0];
    } else {
      const [result] = await pool.query('INSERT INTO store_users (email,password,name,is_verified,is_active,avatar_url,country) VALUES (?,?,?,?,1,?,?)', [email, '', profile.name || email.split('@')[0], 1, profile.picture || null, profile.country || null]);
      const [created] = await pool.query('SELECT * FROM store_users WHERE id=?', [result.insertId]);
      user = created[0];
    }
    const token = jwt.sign({ id: user.id, sub: accountId, email: user.email, role: 'user', vexa_account: true }, JWT_SECRET, { expiresIn: '7d', issuer: 'vexastore' });
    sessionCookie(res, token);
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`);
    const frontend = config().frontend;
    res.redirect(`${frontend}/?sso=success`);
  } catch (error) {
    clearCookies(res);
    console.error('VexaStore VexaAccount SSO callback failed:', error.message);
    res.status(error.response?.status || 502).send('VexaAccount SSO callback failed');
  }
}

router.get('/callback', (req, res) => finish(req, res, req.query.code, req.query.state));
router.post('/callback', express.json(), (req, res) => finish(req, res, req.body?.code, req.body?.state));

router.get('/config-check', (req, res) => {
  try { const c = requireConfig(); res.json({ success: true, configured: true, url: c.url, clientId: c.clientId, redirectUri: c.redirectUri }); }
  catch (error) { res.status(503).json({ success: false, configured: false, message: error.message }); }
});

module.exports = router;
