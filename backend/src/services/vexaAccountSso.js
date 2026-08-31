const axios = require('axios');
const crypto = require('crypto');

const DEFAULT_URL = 'https://api-vexaaccount.onrender.com';
const DEFAULT_FRONTEND = 'https://vexastore.onrender.com';
let cache;

function config() {
  if (cache) return cache;
  let raw = String(process.env.VEXA_ACCOUNT_SSO_CONFIG || '').trim();
  let cfg = {};
  if (raw) {
    try { cfg = JSON.parse(raw); } catch { throw new Error('VEXA_ACCOUNT_SSO_CONFIG must be valid JSON'); }
  }
  cache = {
    url: String(cfg.url || DEFAULT_URL).replace(/\/$/, ''),
    clientId: String(cfg.clientId || '').trim(),
    clientSecret: String(cfg.clientSecret || '').trim(),
    redirectUri: String(cfg.redirectUri || '').trim(),
    timeout: Number(cfg.timeoutMs || 10000),
    frontend: String(cfg.frontendUrl || process.env.VEXASTORE_FRONTEND_USER_URL || DEFAULT_FRONTEND).replace(/\/$/, '')
  };
  return cache;
}

function requireConfig() {
  const c = config();
  if (!c.clientId || !c.clientSecret || !c.redirectUri) throw new Error('VexaAccount SSO requires clientId, clientSecret and redirectUri in VEXA_ACCOUNT_SSO_CONFIG');
  return c;
}

function stateSecret() {
  const c = config();
  const value = String(process.env.VEXA_ACCOUNT_SSO_STATE_SECRET || process.env.JWT_SECRET || '').trim();
  if (!value) throw new Error('VexaAccount SSO state secret is not configured');
  return value;
}

function sign(value) { return crypto.createHmac('sha256', stateSecret()).update(value).digest('base64url'); }
function makeState() { return crypto.randomBytes(32).toString('base64url'); }
function makeVerifier() { return crypto.randomBytes(32).toString('base64url'); }
function challenge(verifier) { return crypto.createHash('sha256').update(verifier).digest('base64url'); }

function authorizationUrl(state, verifier) {
  const c = requireConfig();
  const url = new URL(`${c.url}/api/sso/authorize`);
  url.searchParams.set('client_id', c.clientId);
  url.searchParams.set('redirect_uri', c.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid profile email account session applications notifications');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

async function exchange(code, verifier) {
  const c = requireConfig();
  const { data } = await axios.post(`${c.url}/api/sso/token`, {
    grant_type: 'authorization_code', client_id: c.clientId, client_secret: c.clientSecret,
    redirect_uri: c.redirectUri, code, code_verifier: verifier
  }, { timeout: c.timeout });
  return data;
}

async function userInfo(accessToken) {
  const c = config();
  const { data } = await axios.get(`${c.url}/api/sso/userinfo`, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: c.timeout });
  return data;
}

module.exports = { config, requireConfig, stateSecret, sign, makeState, makeVerifier, authorizationUrl, exchange, userInfo };
