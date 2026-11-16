'use strict';
// 모든 설정은 서버 환경변수에서만 읽는다. 프런트엔드로 내려가지 않는다.
function parsePins(raw) {
  const out = {};
  String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const i = pair.indexOf(':');
      if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1);
    });
  return out;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  // demo 만 동작한다. live 는 ELLIS 고객가·링크 API가 준비된 뒤 lib/adapter.js 에서 구현한다.
  dataMode: process.env.OMM_DATA_MODE || 'demo',
  // 예: agent:1234,manager:5678,admin:9012  (비어 있으면 직원 모드 비활성)
  staffPins: parsePins(process.env.OMM_STAFF_PINS),
  // OHMYHOTEL B2C 링크 규격이 확정되면 템플릿으로 설정한다. 비어 있으면 예약 링크를 만들지 않는다.
  // 자리표시자: {hotelId} {checkIn} {checkOut} {adults} {children} {rooms} {clickId}
  b2cUrlTemplate: process.env.OMM_B2C_URL_TEMPLATE || '',
  b2cAllowedHosts: String(process.env.OMM_B2C_ALLOWED_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  publicBaseUrl: process.env.OMM_PUBLIC_BASE_URL || '',
  sessionTtlMs: 30 * 60 * 1000,
  shareTtlMs: 24 * 60 * 60 * 1000,
  priceTtlSec: 300,
  logDir: process.env.OMM_LOG_DIR || require('path').join(__dirname, '..', 'logs'),
};
