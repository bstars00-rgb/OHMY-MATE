'use strict';
// 서버 없이 열리는 단일 HTML 파일을 만든다.  실행: node scripts/build-standalone.js
// 엔진·DEMO 데이터·화면·로고를 한 파일에 묶고, 브라우저 안에서 /api 요청을 엔진이 직접 처리한다.
// 직원 모드 PIN(0000)은 이 DEMO 파일에만 들어간다. 가상 데이터만 있는 시연용이며 보안 장치가 아니다.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const MODULES = ['geo', 'config', 'demo-data', 'intent', 'adapter', 'ranking', 'guard', 'knowledge', 'b2c', 'engine', 'share'];

const bundle = MODULES.map((m) => `__def(${JSON.stringify(m)}, function (module, exports, require, process, __dirname) {\n${read(`lib/${m}.js`)}\n});`).join('\n');

const runtime = `
var __defs = {}, __cache = {};
function __def(n, f) { __defs[n] = f; }
function __req(name) {
  if (name === 'path') return { join: function () { return Array.prototype.join.call(arguments, '/'); } };
  var n = name.replace(/^\\.\\//, '').replace(/^.*\\//, '');
  if (__cache[n]) return __cache[n].exports;
  var m = { exports: {} };
  __cache[n] = m;
  __defs[n](m, m.exports, __req, { env: {} }, '');
  return m.exports;
}
`;

const shim = `
(function () {
  window.OMM_STANDALONE = true;
  var engine = __req('engine'), share = __req('share'), guard = __req('guard');
  var adapter = __req('adapter').createAdapter('demo');
  var sessions = {}, reports = [];
  var stats = { sessions: 0, messages: 0, searches: 0, noResult: 0, errors: 0, blocked: 0, clicks: 0, shares: 0, types: {}, ms: 0 };
  var DEMO_PIN = '0000';
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function rid() { return Math.random().toString(16).slice(2, 10) + Date.now().toString(16); }
  function reply(status, obj) { return new Response(JSON.stringify(obj), { status: status, headers: { 'Content-Type': 'application/json' } }); }
  function roleOf(opts) { var hd = (opts && opts.headers) || {}; return hd['x-staff-pin'] === DEMO_PIN ? 'manager' : null; }
  window.fetch = async function (url, opts) {
    var u = String(url);
    if (u.indexOf('/api/') !== 0) return realFetch(url, opts);
    var body = {};
    try { body = opts && opts.body ? JSON.parse(opts.body) : {}; } catch (e) { return reply(400, { error: 'BAD_JSON' }); }
    var role = roleOf(opts);
    if (u === '/api/chat') {
      var text = String(body.message || '').slice(0, 1000);
      if (!text.trim()) return reply(400, { error: 'empty' });
      var s = sessions[body.sessionId];
      if (!s) { s = engine.newSession(rid()); sessions[s.id] = s; stats.sessions += 1; }
      s.lang = body.lang === 'en' ? 'en' : 'ko';
      var t0 = Date.now();
      var out = await engine.handleMessage(s, text, { adapter: adapter, today: today(), lang: s.lang, staff: !!role && body.staffView === true });
      stats.messages += 1; stats.ms += Date.now() - t0;
      out.types.forEach(function (x) { stats.types[x] = (stats.types[x] || 0) + 1; });
      if (out.blocked) stats.blocked += 1;
      if (out.error) stats.errors += 1;
      if (out.types.some(function (x) { return x === 'B' || x === 'C'; })) { stats.searches += 1; if (!out.cards.length && !out.error) stats.noResult += 1; }
      return reply(200, Object.assign({ sessionId: s.id }, out));
    }
    if (u === '/api/reset') { delete sessions[body.sessionId]; return reply(200, { ok: true }); }
    if (u === '/api/click') { stats.clicks += 1; return reply(200, { clickId: rid(), url: null, reason: 'demo' }); }
    if (u === '/api/share') {
      var ss = sessions[body.sessionId];
      if (!ss) return reply(404, { error: 'no_session' });
      stats.shares += 1;
      var html = share.sharePage(share.shareSnapshot(ss, role, adapter.mode));
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return reply(200, { url: URL.createObjectURL(blob), html: true });
    }
    if (u === '/api/staff/check') return role ? reply(200, { role: role }) : reply(401, { error: 'unauthorized' });
    if (u === '/api/report') {
      if (!role) return reply(403, { error: 'forbidden' });
      var kind = ['mapping', 'inventory', 'price', 'other'].indexOf(body.kind) >= 0 ? body.kind : 'other';
      reports.push({ t: new Date().toISOString(), role: role, kind: kind, hotelId: String(body.hotelId || '').slice(0, 20), note: guard.maskPII(String(body.note || '').slice(0, 300)).text });
      return reply(200, { ok: true });
    }
    if (u === '/api/admin/reports') return role ? reply(200, { reports: reports.slice(-50).reverse() }) : reply(403, { error: 'forbidden' });
    if (u === '/api/admin/stats') {
      if (!role) return reply(403, { error: 'forbidden' });
      var m = stats.messages || 1;
      return reply(200, Object.assign({}, stats, { reports: reports.length, avgResponseMs: Math.round(stats.ms / m),
        searchToClickRate: stats.searches ? stats.clicks / stats.searches : null, failureRate: stats.messages ? stats.errors / stats.messages : null }));
    }
    return reply(404, { error: 'not_found' });
  };
})();
`;

const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'public/img/omh-logo.jpeg')).toString('base64');
let html = read('public/index.html');
html = html.replace('<link rel="stylesheet" href="/style.css">', `<style>\n${read('public/style.css')}\n</style>`);
html = html.replace(/<script src="https:\/\/cdnjs[^>]*><\/script>\n?/, '');
html = html.replace('<script src="/app.js"></script>', `<script>\n${safe(runtime + bundle + shim)}\n</script>\n<script>\n${safe(read('public/app.js'))}\n</script>`);
html = html.replace('<title>OHMY MATE</title>', '<title>OHMY MATE (DEMO)</title>');
html = html.split('/img/omh-logo.jpeg').join(logo);

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'OHMY-MATE-demo.html');
fs.writeFileSync(out, html);
console.log(`built ${out} (${Math.round(html.length / 1024)} KB)`);
