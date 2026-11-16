'use strict';
// 상담 결과 공유 스냅샷과 페이지. 서버와 단일 HTML 빌드가 함께 쓴다.
const engine = require('./engine');
const guard = require('./guard');

function shareSnapshot(session, role, mode) {
  const L = session.lang || 'ko';
  return {
    lang: L,
    demo: mode === 'demo',
    slots: engine.slotsView(session.slots),
    cards: session.lastCards.map((c) => guard.deepStrip({ ...c, staff: undefined })),
    asOf: session.lastCards[0] && session.lastCards[0].price ? session.lastCards[0].price.asOf : null,
    createdBy: role ? 'staff' : 'customer',
  };
}

function sharePage(snap) {
  const e = guard.escapeHtml;
  const ko = snap.lang !== 'en';
  const s = snap.slots;
  const cards = snap.cards
    .map(
      (c) => `<article><h2>${e(c.name)} <small>${e(c.star)}★${c.starVerified ? '' : ' DEMO'}</small></h2>
<p>${c.station ? e(`${c.station.label}: ${c.station.straightM}m, ${ko ? '예상 도보' : 'est. walk'} ~${c.station.walkMinEstimated}${ko ? '분(경로 미검증)' : ' min (route not verified)'}`) : ''}</p>
<p>${c.price ? e(`${ko ? '총액' : 'Total'} ${c.price.total.toLocaleString('en-US')} JPY (${c.price.nights}${ko ? '박' : ' nights'}, ${ko ? '객실' : 'rooms'} ${c.price.rooms})`) : e(ko ? '가격: 날짜·인원 확정 후 확인' : 'Price: after dates and guests are set')}</p>
<p>${e(c.cancel.text)}</p><ul>${c.reasons.map((r) => `<li>${e(r)}</li>`).join('')}</ul></article>`
    )
    .join('');
  return `<!doctype html><html lang="${ko ? 'ko' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>OHMY MATE ${ko ? '상담 결과' : 'Summary'}</title><style>body{font:18px/1.6 system-ui,sans-serif;margin:0;background:#f6f7fb;color:#1b1f2a}main{max-width:760px;margin:0 auto;padding:16px}
.demo{background:#fff3cd;border:2px solid #e0a800;padding:12px;border-radius:10px;font-weight:700}article{background:#fff;border-radius:14px;padding:14px 18px;margin:14px 0;box-shadow:0 1px 4px #0002}h2{font-size:20px;margin:0}small{color:#666}
@media print{.noprint{display:none}}</style></head><body><main>
<h1>OHMY MATE ${ko ? '상담 결과' : 'Consultation summary'}</h1>
${snap.demo ? `<p class="demo">${ko ? 'DEMO 화면입니다. 표시된 호텔·가격은 실제가 아니며 예약할 수 없습니다.' : 'DEMO page. Hotels and prices shown are not real and cannot be booked.'}</p>` : ''}
<p>${e(engineSummary(s, ko))}</p>${snap.asOf ? `<p>${ko ? '가격 조회 시각' : 'Prices checked'}: ${e(snap.asOf)} (${ko ? '예약 전에 다시 확인합니다' : 'rechecked before booking'})</p>` : ''}
${cards || `<p>${ko ? '공유할 호텔이 없습니다.' : 'No hotels to share.'}</p>`}
<p class="noprint"><button onclick="print()">${ko ? '인쇄' : 'Print'}</button></p></main></body></html>`;
}
function engineSummary(s, ko) {
  return engine.summarize(s, ko ? 'ko' : 'en');
}

module.exports = { shareSnapshot, sharePage };
