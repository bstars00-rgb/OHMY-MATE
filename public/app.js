'use strict';
(function () {
  const S = {
    ko: {
      new: '새로운 상담', send: '보내기', placeholder: '여행·호텔에 대해 편하게 물어보세요', share: '상담 결과 공유', compare: '선택한 호텔 비교',
      demo: 'DEMO 모드: 화면의 호텔·가격은 가상 데이터이며 실제 예약할 수 없습니다.', staff: '직원 모드', staffOff: '직원 모드 끄기', pin: '직원 PIN을 입력하세요',
      badPin: 'PIN이 맞지 않거나 직원 모드가 꺼져 있습니다.', total: '총액', night: '박', from: '1박 최고', taxIn: '세금 포함', taxUnk: '세금 포함 여부 미확인',
      detail: '호텔 상세', book: 'OHMYHOTEL에서 예약하기', pick: '비교에 담기', asOf: '조회 시각', stayDates: '날짜·인원 확정 후 가격 확인', fit: '적합도',
      complete: '데이터 완전성', bf: { included: '조식 포함', optional: '조식 선택', none: '조식 없음' }, noPhoto: '사진 없음 (DEMO)', walkEst: '예상 도보', unverified: '경로 미검증',
      pickTwo: '비교할 호텔을 2~3곳 선택해 주세요.', shareTitle: '상담 결과 공유', shareNote: '링크에는 이름·연락처가 담기지 않으며 24시간 뒤 만료됩니다.', copy: '링크 복사', copied: '복사했습니다', print: '인쇄', close: '닫기',
      linkNone: '아직 연결된 B2C 예약 링크가 없습니다. DEMO 데이터이므로 실제 예약은 할 수 없습니다.', retry: '다시 시도', err: '연결에 실패했습니다. 잠시 뒤 다시 시도해 주세요.',
      foot: '가격·재고는 조회 시점 기준이며 예약 확정 전에 다시 확인합니다. 개인정보는 입력하지 마세요. 공용 단말은 10분간 입력이 없으면 상담이 초기화됩니다.',
      saveHtml: '결과 HTML 저장', saveNote: '이 화면에서 만든 상담 결과 페이지입니다. 저장한 파일을 메일이나 메신저로 전달하세요. 이름·연락처는 담기지 않습니다.',
      report: '오류 신고', reported: '신고했습니다', staffNote: '직원 전용', chips: [
        '11월 25일부터 27일까지 오사카에 갑니다. 어머니와 둘이 여행하고 난바역에서 가까운 가성비 호텔을 추천해 주세요. 1박 12,000엔 이하로 부탁합니다.',
        '조식 포함으로 바꿔줘', '방금 추천한 호텔 중 두 번째 호텔을 예약하고 싶어', '간사이공항에서 난바역까지 어떻게 이동하나요?', '교토에 당일치기로 다녀올 수 있나요?', '호텔 비교해줘'
      ],
    },
    en: {
      new: 'New consultation', send: 'Send', placeholder: 'Ask anything about your trip or hotels', share: 'Share summary', compare: 'Compare selected',
      demo: 'DEMO mode: hotels and prices shown are fictional and cannot be booked.', staff: 'Staff mode', staffOff: 'Turn off staff mode', pin: 'Enter staff PIN',
      badPin: 'Wrong PIN, or staff mode is disabled.', total: 'Total', night: 'nights', from: 'Highest night', taxIn: 'Tax included', taxUnk: 'Tax inclusion not confirmed',
      detail: 'Hotel details', book: 'Book on OHMYHOTEL', pick: 'Add to compare', asOf: 'Checked at', stayDates: 'Price after dates and guests are set', fit: 'Fit',
      complete: 'Data completeness', bf: { included: 'Breakfast included', optional: 'Breakfast optional', none: 'No breakfast' }, noPhoto: 'No photo (DEMO)', walkEst: 'Est. walk', unverified: 'route not verified',
      pickTwo: 'Select 2 to 3 hotels to compare.', shareTitle: 'Share summary', shareNote: 'The link holds no name or contact and expires in 24 hours.', copy: 'Copy link', copied: 'Copied', print: 'Print', close: 'Close',
      linkNone: 'No B2C booking link is connected yet. This is DEMO data and cannot be booked.', retry: 'Retry', err: 'Connection failed. Please try again shortly.',
      foot: 'Prices and availability are as of the lookup and are rechecked before booking. Do not enter personal data. Shared terminals reset after 10 minutes idle.',
      saveHtml: 'Save result as HTML', saveNote: 'This is the summary page built here. Save the file and send it by mail or chat. It holds no name or contact.',
      report: 'Report issue', reported: 'Reported', staffNote: 'Staff only', chips: [
        'We travel to Osaka Nov 25 to 27, my mother and I. Budget hotel near Namba Station, max 12,000 yen per night.',
        'Switch to breakfast included', 'Book the second hotel', 'How do I get from Kansai Airport to Namba?', 'Can I do Kyoto as a day trip?', 'Compare the hotels'
      ],
    },
  };

  const $ = (id) => document.getElementById(id);
  let lang = 'ko';
  let sessionId = null;
  let staffPin = null;
  let staffView = false;
  let cards = [];
  const picked = new Set();
  let idleTimer = null;
  const t = () => S[lang];

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const yen = (n) => (lang === 'en' ? 'JPY ' : '') + n.toLocaleString('en-US') + (lang === 'en' ? '' : '엔');

  function api(path, body, method) {
    const headers = { 'Content-Type': 'application/json' };
    if (staffPin) headers['x-staff-pin'] = staffPin;
    return fetch(path, { method: method || 'POST', headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) }).then((r) => r.json().then((j) => ({ ok: r.ok, status: r.status, json: j })));
  }

  function applyStatic() {
    $('newBtn').textContent = t().new;
    $('sendBtn').textContent = t().send;
    $('msg').placeholder = t().placeholder;
    $('shareBtn').textContent = t().share;
    $('compareBtn').textContent = t().compare;
    $('demoBar').textContent = t().demo;
    $('staffBtn').textContent = staffView ? t().staffOff : t().staff;
    $('foot').textContent = t().foot;
    $('shareTitle').textContent = t().shareTitle;
    $('shareNote').textContent = t().shareNote;
    $('copyBtn').textContent = t().copy;
    $('printBtn').textContent = t().print;
    $('closeShare').textContent = t().close;
    const chips = $('chips');
    chips.replaceChildren(...t().chips.map((c) => h('button', { type: 'button', onclick: () => ask(c) }, c.length > 40 ? c.slice(0, 38) + '…' : c)));
    document.documentElement.lang = lang;
    renderStaffBar();
  }

  function renderStaffBar() {
    const bar = $('staffBar');
    bar.hidden = !staffView;
    if (!staffView) return;
    bar.replaceChildren(h('b', null, t().staff), h('span', null, t().staffNote));
  }

  function bubble(role, text) {
    const wrap = h('div', { class: 'msg ' + role }, h('div', { class: 'bubble' }, text));
    $('chat').append(wrap);
    return wrap.firstChild;
  }

  function cardEl(c) {
    const price = c.price
      ? h('div', { class: 'price' }, yen(c.price.total), h('small', null, ` ${t().total} · ${c.price.nights}${t().night}`), h('br'),
          h('small', null, `${t().from} ${yen(c.price.nightlyMax)} · ${c.price.taxIncluded ? t().taxIn : t().taxUnk}`))
      : h('div', { class: 'fit' }, t().stayDates);
    const btnBook = h('button', { class: 'primary', type: 'button', onclick: () => book(c) }, t().book);
    const detail = h('div', { class: 'fit', hidden: '' }, c.address, ' · ', c.amenities.join(', '));
    const el = h('div', { class: 'card' },
      h('div', { class: 'photo' }, t().noPhoto),
      h('div', { class: 'in' },
        h('h3', null, c.name, c.demo ? h('span', { class: 'badge' }, 'DEMO') : null),
        h('div', { class: 'fit' }, `${c.star}★${c.starVerified ? '' : ' (DEMO)'}`),
        c.station ? h('div', null, `${c.station.label} · ${c.station.straightM}m · ${t().walkEst} ~${c.station.walkMinEstimated}${lang === 'ko' ? '분' : ' min'} (${t().unverified})`) : null,
        price,
        h('div', null, `${t().bf[c.breakfast]}${c.breakfastPrice ? ' (' + yen(c.breakfastPrice) + ')' : ''} · ${c.cancel.text}`),
        h('ul', { class: 'reasons' }, c.reasons.map((r) => h('li', null, r))),
        c.fit.score != null ? h('div', { class: 'fit' }, `${t().fit} ${c.fit.score}/100 · ${t().complete} ${c.fit.completeness}%`) : null,
        c.price ? h('div', { class: 'fit' }, `${t().asOf} ${new Date(c.price.asOf).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}`) : null,
        detail,
        c.staff ? h('div', { class: 'staffinfo' }, `${t().staffNote}: ${c.staff.hotelCode} / ${c.staff.b2cHotelId || 'unmapped'} / ${Object.entries(c.staff.breakdown).map(([k, v]) => k + '=' + (v == null ? 'n/a' : Math.round(v))).join(' ')} `, h('button', { type: 'button', onclick: () => reportIssue(c, 'price') }, t().report)) : null,
        h('div', { class: 'btns' },
          h('button', { type: 'button', onclick: () => detail.toggleAttribute('hidden') }, t().detail),
          h('label', null, h('input', { type: 'checkbox', onchange: (e) => (e.target.checked ? picked.add(c.id) : picked.delete(c.id)) }), ' ', t().pick),
          btnBook)));
    return el;
  }

  function renderCompare(ids) {
    const sel = cards.filter((c) => ids.has(c.id)).slice(0, 3);
    if (sel.length < 2) return bubble('bot', t().pickTwo);
    const rows = [
      [lang === 'ko' ? '호텔' : 'Hotel', (c) => c.name],
      [t().total, (c) => (c.price ? yen(c.price.total) : '-')],
      [t().from, (c) => (c.price ? yen(c.price.nightlyMax) : '-')],
      [lang === 'ko' ? '기준 역' : 'Station', (c) => (c.station ? `${c.station.straightM}m / ~${c.station.walkMinEstimated}` : '-')],
      [lang === 'ko' ? '조식' : 'Breakfast', (c) => t().bf[c.breakfast]],
      [lang === 'ko' ? '취소' : 'Cancel', (c) => c.cancel.text],
      [t().fit, (c) => (c.fit.score == null ? '-' : c.fit.score)],
    ];
    const best = sel.reduce((a, b) => ((b.fit.score || 0) > (a.fit.score || 0) ? b : a));
    const tbl = h('table', { class: 'cmp' }, rows.map(([label, f]) => h('tr', null, h('th', null, label), sel.map((c) => h('td', null, (c.id === best.id ? '★ ' : '') + f(c))))));
    $('chat').append(h('div', { class: 'msg' }, h('div', { class: 'bubble', style: 'max-width:100%;overflow:auto' }, tbl)));
    window.scrollTo(0, document.body.scrollHeight);
  }

  function renderResponse(r) {
    sessionId = r.sessionId || sessionId;
    const b = bubble('bot', r.reply);
    (r.clarify || []).forEach((c) => b.parentNode.firstChild.append(h('div', { class: 'clarify' }, c)));
    (r.notices || []).filter((n) => !/^DEMO/.test(n)).forEach((n) => b.append(h('div', { class: 'notice' }, n)));
    if (r.cards && r.cards.length) {
      cards = r.cards;
      picked.clear();
      $('chat').append(h('div', { class: 'cards' }, r.cards.map(cardEl)));
    }
    if (r.compare) {
      cards = r.compare.cards;
      $('chat').append(h('div', { class: 'msg' }, h('div', { class: 'bubble', style: 'max-width:100%;overflow:auto' },
        h('table', { class: 'cmp' }, r.compare.rows.map((row) => h('tr', null, h('th', null, row.label), row.values.map((v) => h('td', null, v))))))));
    }
    (r.actions || []).forEach((a) => {
      if (a.type === 'share') openShare();
      if (a.type === 'retry') $('chat').append(h('button', { type: 'button', onclick: () => ask(lastMsg) }, t().retry));
      if (a.type === 'book') {
        const c = cards.find((x) => x.id === a.hotelId);
        if (c) $('chat').append(h('div', { class: 'cards' }, cardEl(c)));
      }
    });
    window.scrollTo(0, document.body.scrollHeight);
  }

  let lastMsg = '';
  async function ask(text) {
    if (!text.trim()) return;
    lastMsg = text;
    bubble('user', text);
    $('msg').value = '';
    touch();
    try {
      const { json } = await api('/api/chat', { sessionId, message: text, lang, staffView });
      renderResponse(json);
    } catch (e) {
      bubble('bot', t().err);
    }
  }

  async function book(c) {
    try {
      const { json } = await api('/api/click', { sessionId, hotelId: c.id });
      if (json.url) window.open(json.url, '_blank', 'noopener');
      else bubble('bot', t().linkNone);
    } catch (e) {
      bubble('bot', t().err);
    }
  }

  async function openShare() {
    if (!sessionId) return;
    const { ok, json } = await api('/api/share', { sessionId });
    if (!ok) return;
    $('shareUrl').value = json.url;
    $('qr').replaceChildren();
    if (window.OMM_STANDALONE) {
      // 단일 HTML 버전: 서버가 없으므로 결과 페이지를 파일로 저장해 전달한다. QR 은 만들지 않는다.
      $('shareNote').textContent = t().saveNote;
      $('copyBtn').textContent = t().saveHtml;
    } else if (window.QRCode) new window.QRCode($('qr'), { text: json.url, width: 180, height: 180 });
    else $('qr').textContent = json.url;
    $('shareDlg').showModal();
  }

  async function reportIssue(c, kind) {
    const { ok } = await api('/api/report', { kind, hotelId: c.id, note: 'staff report from card' });
    bubble('bot', ok ? t().reported : t().badPin);
  }

  async function reset() {
    if (sessionId) await api('/api/reset', { sessionId }).catch(() => {});
    sessionId = null;
    cards = [];
    picked.clear();
    $('chat').replaceChildren();
    bubble('bot', lang === 'ko' ? '안녕하세요, OHMY MATE입니다. 여행 지역, 날짜, 인원, 예산을 편하게 말씀해 주세요.' : 'Hello, this is OHMY MATE. Tell me the area, dates, guests and budget.');
  }

  function touch() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(reset, 10 * 60 * 1000);
  }

  $('form').addEventListener('submit', (e) => { e.preventDefault(); ask($('msg').value); });
  $('newBtn').addEventListener('click', reset);
  $('shareBtn').addEventListener('click', openShare);
  $('compareBtn').addEventListener('click', () => renderCompare(picked));
  $('lang').addEventListener('change', (e) => { lang = e.target.value; applyStatic(); });
  $('copyBtn').addEventListener('click', async () => {
    if (window.OMM_STANDALONE) {
      const a = h('a', { href: $('shareUrl').value, download: 'OHMY-MATE-consultation.html' });
      document.body.append(a);
      a.click();
      a.remove();
      return;
    }
    try { await navigator.clipboard.writeText($('shareUrl').value); $('copyBtn').textContent = t().copied; } catch (e) { $('shareUrl').select(); } });
  $('printBtn').addEventListener('click', () => window.open($('shareUrl').value, '_blank', 'noopener'));
  $('closeShare').addEventListener('click', () => $('shareDlg').close());
  $('staffBtn').addEventListener('click', async () => {
    if (staffView) { staffView = false; staffPin = null; applyStatic(); return; }
    const pin = window.prompt(t().pin);
    if (!pin) return;
    staffPin = pin;
    const { ok } = await api('/api/staff/check', null, 'GET');
    if (ok) staffView = true; else { staffPin = null; bubble('bot', t().badPin); }
    applyStatic();
  });
  ['click', 'keydown'].forEach((ev) => document.addEventListener(ev, touch));

  applyStatic();
  reset();
  touch();
})();
