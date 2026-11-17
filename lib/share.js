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

// opts: { url, token, saved, expiresAt } — 서버가 만든 페이지에만 넘긴다(공유·삭제 버튼 표시).
function sharePage(snap, opts = {}) {
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
  const T = ko
    ? { share: '공유하기', copied: '링크를 복사했습니다', del: '저장된 내 상담 결과 삭제', deleted: '삭제했습니다. 이 링크는 더 이상 열리지 않습니다.', failed: '삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.', keep: '저장 기간', until: '까지 보관 후 자동 삭제' }
    : { share: 'Share', copied: 'Link copied', del: 'Delete my saved summary', deleted: 'Deleted. This link no longer works.', failed: 'Could not delete. Please try again.', keep: 'Stored', until: ' then deleted automatically' };
  const hasActions = !!opts.url;
  const actions = hasActions
    ? `<p class="noprint"><button id="sh" type="button">${e(T.share)}</button> <button onclick="print()" type="button">${ko ? '인쇄' : 'Print'}</button>${opts.saved ? ` <button id="del" type="button" class="danger">${e(T.del)}</button>` : ''}</p>
<p id="msg" class="noprint" role="status"></p>${opts.saved && opts.expiresAt ? `<p class="small">${e(T.keep)}: ${e(new Date(opts.expiresAt).toISOString().slice(0, 10))}${e(T.until)}</p>` : ''}
<script>
(function(){var url=${JSON.stringify(opts.url)},token=${JSON.stringify(opts.token || '')},m=document.getElementById('msg');
function ev(c){if(token)fetch('/api/consult/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token,channel:c})}).catch(function(){});}
document.getElementById('sh').onclick=function(){if(navigator.share){navigator.share({title:document.title,url:url}).then(function(){ev('webshare')}).catch(function(){});}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){m.textContent=${JSON.stringify(T.copied)};ev('copy')});}};
var d=document.getElementById('del');if(d)d.onclick=function(){fetch('/api/consult/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token})}).then(function(r){m.textContent=r.ok?${JSON.stringify(T.deleted)}:${JSON.stringify(T.failed)};if(r.ok)document.querySelectorAll('article').forEach(function(a){a.remove()});});};})();
</script>`
    : `<p class="noprint"><button onclick="print()" type="button">${ko ? '인쇄' : 'Print'}</button></p>`;
  return `<!doctype html><html lang="${ko ? 'ko' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>OHMY MATE ${ko ? '상담 결과' : 'Summary'}</title><style>body{font:18px/1.6 system-ui,sans-serif;margin:0;background:#f7f6f4;color:#1f2430}main{max-width:760px;margin:0 auto;padding:16px}
.demo{background:#fff6e0;border:1px solid #f0c26b;padding:10px 14px;border-radius:10px}article{background:#fff;border-radius:16px;padding:14px 18px;margin:14px 0;box-shadow:0 1px 4px #0002}h2{font-size:20px;margin:0}small{color:#667085}.small{font-size:14px;color:#667085}
button{font:inherit;min-height:44px;border-radius:999px;border:1px solid #d95a12;background:#d95a12;color:#fff;padding:6px 20px;cursor:pointer}button.danger{background:#fff;color:#b42318;border-color:#b42318}
@media print{.noprint{display:none}}</style></head><body><main>
<h1>OHMY MATE ${ko ? '상담 결과' : 'Consultation summary'}</h1>
${snap.demo ? `<p class="demo">${ko ? 'DEMO 화면입니다. 표시된 호텔·가격은 실제가 아니며 예약할 수 없습니다.' : 'DEMO page. Hotels and prices shown are not real and cannot be booked.'}</p>` : ''}
<p>${e(engineSummary(s, ko))}</p>${snap.asOf ? `<p>${ko ? '가격 조회 시각' : 'Prices checked'}: ${e(snap.asOf)} (${ko ? '예약 전에 다시 확인합니다' : 'rechecked before booking'})</p>` : ''}
${cards || `<p>${ko ? '공유할 호텔이 없습니다.' : 'No hotels to share.'}</p>`}
${actions}</main></body></html>`;
}
function engineSummary(s, ko) {
  return engine.summarize(s, ko ? 'ko' : 'en');
}

module.exports = { shareSnapshot, sharePage };
