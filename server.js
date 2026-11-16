'use strict';
// OHMY MATE 서버. 의존성 없이 Node 내장 모듈만 쓴다. 비밀값은 환경변수에서만 읽고 브라우저로 보내지 않는다.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./lib/config');
const engine = require('./lib/engine');
const guard = require('./lib/guard');
const { createAdapter } = require('./lib/adapter');
const { buildB2CUrl } = require('./lib/b2c');
const { shareSnapshot, sharePage } = require('./lib/share');

const PUBLIC = path.join(__dirname, 'public');
const adapter = createAdapter(config.dataMode);
const sessions = new Map();
const shares = new Map();
const clicks = new Map(); // clickId -> {sessionAnon, hotelId, at}
const stats = { sessions: 0, messages: 0, searches: 0, noResult: 0, errors: 0, blocked: 0, clicks: 0, shares: 0, types: {}, byCountry: {}, respMsTotal: 0 };
const rate = new Map();
const reports = []; // 직원 오류 신고(메모리). 운영에서는 티켓 시스템으로 보낸다.

fs.mkdirSync(config.logDir, { recursive: true });
function audit(event, data) {
  const line = JSON.stringify({ t: new Date().toISOString(), event, ...data });
  fs.appendFile(path.join(config.logDir, 'audit.log'), line + '\n', () => {});
}

const rid = (n = 16) => crypto.randomBytes(n).toString('hex');
const anon = (id) => crypto.createHash('sha256').update(id).digest('hex').slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

function getSession(id) {
  const now = Date.now();
  for (const [k, s] of sessions) if (now - s.lastActive > config.sessionTtlMs) sessions.delete(k);
  if (id && sessions.has(id)) return sessions.get(id);
  const s = engine.newSession(rid(12));
  sessions.set(s.id, s);
  stats.sessions += 1;
  return s;
}

function staffRole(req) {
  const pin = String(req.headers['x-staff-pin'] || '');
  if (!pin) return null;
  for (const [role, p] of Object.entries(config.staffPins)) {
    const a = Buffer.from(p);
    const b = Buffer.from(pin);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return role;
  }
  return null;
}
const PERMS = { agent: ['staff-view', 'share', 'report'], manager: ['staff-view', 'share', 'report', 'stats'], admin: ['staff-view', 'share', 'report', 'stats', 'logs'] };
const can = (role, perm) => !!role && (PERMS[role] || []).includes(perm);

function limited(req) {
  const ip = req.socket.remoteAddress || 'x';
  const now = Date.now();
  const arr = (rate.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  rate.set(ip, arr);
  return arr.length > 60;
}

function send(res, code, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(code, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    ...extra,
  });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 16 * 1024) {
        reject(new Error('TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (e) {
        reject(new Error('BAD_JSON'));
      }
    });
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png' };
function serveStatic(req, res, urlPath) {
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep) && file !== PUBLIC) return send(res, 403, { error: 'forbidden' });
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, { error: 'not_found' });
    send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream', {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'",
    });
  });
}

async function route(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (req.method === 'GET' && p === '/api/health') return send(res, 200, { ok: true, dataMode: adapter.mode, staffEnabled: Object.keys(config.staffPins).length > 0, b2cLinkConfigured: !!config.b2cUrlTemplate });
  if (req.method === 'GET' && p.startsWith('/s/')) {
    const sh = shares.get(p.slice(3));
    if (!sh || sh.expires < Date.now()) return send(res, 404, '<p>Link expired</p>', 'text/html; charset=utf-8');
    return send(res, 200, sharePage(sh.snap), 'text/html; charset=utf-8', { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" });
  }
  if (req.method === 'GET' && p.startsWith('/api/share/')) {
    const sh = shares.get(p.slice(11));
    if (!sh || sh.expires < Date.now()) return send(res, 404, { error: 'expired' });
    return send(res, 200, sh.snap);
  }
  if (req.method === 'GET' && !p.startsWith('/api/')) return serveStatic(req, res, p);

  if (limited(req)) return send(res, 429, { error: 'rate_limited' });
  let body = {};
  if (req.method === 'POST') {
    try {
      body = await readBody(req);
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
  }
  const role = staffRole(req);

  if (req.method === 'POST' && p === '/api/chat') {
    const text = String(body.message || '').slice(0, 1000);
    if (!text.trim()) return send(res, 400, { error: 'empty' });
    const session = getSession(body.sessionId);
    session.lang = body.lang === 'en' ? 'en' : 'ko';
    const t0 = Date.now();
    const out = await engine.handleMessage(session, text, { adapter, today: todayStr(), lang: session.lang, staff: can(role, 'staff-view') && body.staffView === true });
    const ms = Date.now() - t0;
    stats.messages += 1;
    stats.respMsTotal += ms;
    out.types.forEach((t) => (stats.types[t] = (stats.types[t] || 0) + 1));
    if (out.blocked) stats.blocked += 1;
    if (out.error) stats.errors += 1;
    if (out.types.some((t) => ['B', 'C'].includes(t))) {
      stats.searches += 1;
      if (!out.cards.length && !out.error) stats.noResult += 1;
    }
    audit('chat', { s: anon(session.id), types: out.types, blocked: out.blocked, error: out.error ? out.error.code : null, cards: out.cards.length, ms, len: text.length });
    return send(res, 200, { sessionId: session.id, ...out });
  }
  if (req.method === 'POST' && p === '/api/reset') {
    if (body.sessionId) sessions.delete(body.sessionId);
    audit('reset', { s: body.sessionId ? anon(String(body.sessionId)) : null });
    return send(res, 200, { ok: true });
  }
  if (req.method === 'POST' && p === '/api/click') {
    const s = sessions.get(body.sessionId);
    if (!s) return send(res, 404, { error: 'no_session' });
    const card = s.lastCards.find((c) => c.id === body.hotelId);
    if (!card) return send(res, 404, { error: 'no_hotel' });
    const hotel = await adapter.getHotel(card.id).catch(() => null);
    const clickId = rid(8);
    const url2 = buildB2CUrl(hotel, s.slots, clickId);
    clicks.set(clickId, { s: anon(s.id), hotelId: card.id, at: Date.now() });
    stats.clicks += 1;
    audit('b2c_click', { s: anon(s.id), hotelId: card.id, clickId, linked: !!url2 });
    return send(res, 200, { clickId, url: url2, reason: url2 ? null : adapter.mode === 'demo' ? 'demo' : 'link-not-configured' });
  }
  if (req.method === 'POST' && p === '/api/share') {
    const s = sessions.get(body.sessionId);
    if (!s) return send(res, 404, { error: 'no_session' });
    const token = rid(16);
    shares.set(token, { snap: shareSnapshot(s, role, adapter.mode), expires: Date.now() + config.shareTtlMs });
    stats.shares += 1;
    audit('share', { s: anon(s.id) });
    const base = config.publicBaseUrl || `http://${req.headers.host}`;
    return send(res, 200, { token, url: `${base}/s/${token}`, expiresInHours: config.shareTtlMs / 3600000 });
  }
  if (req.method === 'POST' && p === '/api/report') {
    if (!can(role, 'report')) return send(res, 403, { error: 'forbidden' });
    const kind = ['mapping', 'inventory', 'price', 'other'].includes(body.kind) ? body.kind : 'other';
    const rep = { t: new Date().toISOString(), role, kind, hotelId: String(body.hotelId || '').slice(0, 20), note: guard.maskPII(String(body.note || '').slice(0, 300)).text };
    reports.push(rep);
    if (reports.length > 200) reports.shift();
    audit('issue_report', rep);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'GET' && p === '/api/admin/reports') {
    if (!can(role, 'stats')) return send(res, 403, { error: 'forbidden' });
    return send(res, 200, { reports: reports.slice(-50).reverse() });
  }
  if (req.method === 'GET' && p === '/api/staff/check') return send(res, can(role, 'staff-view') ? 200 : 401, { role });
  if (req.method === 'GET' && p === '/api/admin/stats') {
    if (!can(role, 'stats')) return send(res, 403, { error: 'forbidden' });
    const m = stats.messages || 1;
    return send(res, 200, {
      ...stats,
      reports: reports.length,
      avgResponseMs: Math.round(stats.respMsTotal / m),
      aiHandledRate: stats.messages ? 1 - stats.blocked / stats.messages : null,
      searchToClickRate: stats.searches ? stats.clicks / stats.searches : null,
      failureRate: stats.messages ? stats.errors / stats.messages : null,
      note: 'B2C 예약 전환율은 예약 데이터에 omm_click_id 가 연결된 뒤에 측정할 수 있습니다.',
    });
  }
  return send(res, 404, { error: 'not_found' });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    audit('server_error', { msg: String(e && e.message).slice(0, 200) });
    send(res, 500, { error: 'server_error' });
  });
});

if (require.main === module) {
  server.listen(config.port, () => console.log(`OHMY MATE (${adapter.mode}) http://localhost:${config.port}`));
}
module.exports = { server };
