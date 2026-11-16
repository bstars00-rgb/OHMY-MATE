'use strict';
(function () {
  const S = {
    ko: {
      new: '새 상담', send: '보내기', placeholder: '여행이나 호텔에 대해 편하게 물어보세요', share: '상담 결과 공유', compare: '선택한 호텔 비교',
      demo: 'DEMO · 화면의 호텔과 가격은 가상 데이터이며 실제 예약은 되지 않습니다.', staff: '직원 모드', staffOff: '직원 모드 끄기',
      heroA: '어디로 ', heroB: '떠나시나요?', heroSub: '날짜, 인원, 예산만 말씀해 주세요. 호텔 추천과 비교, 예약 안내까지 도와드립니다.',
      pinTitle: '직원 PIN', pinOk: '확인', pinCancel: '취소', badPin: 'PIN이 맞지 않거나 직원 모드가 꺼져 있습니다.',
      total: '총액', night: '박', maxNight: '1박 최고', taxIn: '세금 포함', taxUnk: '세금 포함 여부 미확인', detail: '호텔 상세', book: 'OHMYHOTEL에서 예약하기',
      pick: '비교 담기', asOf: '가격 조회', stayDates: '날짜와 인원을 알려 주시면 가격을 확인합니다', fit: '적합도', complete: '데이터 완전성', best: '추천 1순위',
      bf: { included: '조식 포함', optional: '조식 선택', none: '조식 없음' }, noPhoto: '사진 없음', walkEst: '예상 도보', unverified: '경로 미검증',
      pickTwo: '비교할 호텔을 2~3곳 선택해 주세요.', shareTitle: '상담 결과 공유', shareNote: '링크에는 이름·연락처가 담기지 않으며 24시간 뒤 만료됩니다.', copy: '링크 복사', copied: '복사했습니다', print: '인쇄', close: '닫기',
      saveHtml: '결과 HTML 저장', saveNote: '이 화면에서 만든 상담 결과 페이지입니다. 저장한 파일을 메일이나 메신저로 전달하세요. 이름·연락처는 담기지 않습니다.',
      linkNone: '아직 연결된 B2C 예약 링크가 없습니다. DEMO 데이터라 실제 예약은 할 수 없습니다.', retry: '다시 시도', err: '연결에 실패했습니다. 잠시 뒤 다시 시도해 주세요.',
      foot: '가격과 재고는 조회 시점 기준이며 예약 전에 다시 확인합니다. 개인정보는 입력하지 마세요. 10분간 입력이 없으면 상담이 초기화됩니다.',
      notes: '확인 사항', hello: '안녕하세요, OHMY MATE입니다. 여행 지역, 날짜, 인원, 예산을 편하게 말씀해 주세요.',
      stats: '통계', reports: '신고 내역', excl: '제외', staffCode: '호텔 코드', staffB2c: 'B2C ID', staffContract: '계약', mapped: '매핑 정상', unmapped: '매핑 오류',
      score: '점수 근거', rep: '오류 신고', repPrice: '가격', repStock: '재고', repMap: '매핑', repDone: '신고를 기록했습니다.', noReports: '접수된 신고가 없습니다.',
      exLabels: { unmapped: '매핑 오류', soldout: '만실', capacity: '정원 초과', budget: '예산 초과', walk: '도보 초과', breakfast: '조식 없음', radius: '역에서 멂' },
      w: { budget: '예산', location: '위치', room: '객실', quality: '품질', pref: '선호' },
      amen: { wifi: '와이파이', elevator: '엘리베이터', laundry: '세탁', luggage: '짐 보관', breakfast: '조식', spa: '스파', gym: '헬스장', 'family-room': '가족 객실' },
      st: { sessions: '상담 세션', messages: '메시지', searches: '호텔 검색', noResult: '결과 없음', errors: '조회 오류', blocked: '차단', clicks: '예약 버튼 클릭', shares: '공유', reports: '오류 신고', avgResponseMs: '평균 응답(ms)', searchToClickRate: '검색 대비 클릭률', failureRate: '오류율' },
      types: { A: '일반 여행 정보', B: '호텔 검색·추천', C: '가격·재고', D: '호텔 비교', E: '일정', F: '교통', G: '예약', H: '기타' },
      quick: ['조식 포함으로 바꿔줘', '도보 5분 이내로 바꿔줘', '호텔 비교해줘', '두 번째 호텔 예약하고 싶어', '이 일정도 추천해줘'],
      chips: [
        '11월 25일부터 27일까지 오사카에 갑니다. 어머니와 둘이 여행하고 난바역에서 가까운 가성비 호텔을 추천해 주세요. 1박 12,000엔 이하로 부탁합니다.',
        '가족 4명(어린이 2명)이 11월 25일부터 27일까지 묵을 난바역 근처 호텔',
        '간사이공항에서 난바역까지 어떻게 이동하나요?', '교토에 당일치기로 다녀올 수 있나요?'
      ],
    },
    en: {
      new: 'New chat', send: 'Send', placeholder: 'Ask anything about your trip or hotels', share: 'Share summary', compare: 'Compare selected',
      demo: 'DEMO · Hotels and prices shown are fictional and cannot be booked.', staff: 'Staff mode', staffOff: 'Turn off staff mode',
      heroA: 'Where are you ', heroB: 'headed?', heroSub: 'Tell me the dates, guests and budget. I will suggest and compare hotels and guide you to booking.',
      pinTitle: 'Staff PIN', pinOk: 'OK', pinCancel: 'Cancel', badPin: 'Wrong PIN, or staff mode is disabled.',
      total: 'Total', night: 'nights', maxNight: 'Highest night', taxIn: 'Tax included', taxUnk: 'Tax inclusion not confirmed', detail: 'Hotel details', book: 'Book on OHMYHOTEL',
      pick: 'Compare', asOf: 'Checked', stayDates: 'Give me dates and guests to check prices', fit: 'Fit', complete: 'Data completeness', best: 'Top pick',
      bf: { included: 'Breakfast included', optional: 'Breakfast optional', none: 'No breakfast' }, noPhoto: 'No photo', walkEst: 'Est. walk', unverified: 'route not verified',
      pickTwo: 'Select 2 to 3 hotels to compare.', shareTitle: 'Share summary', shareNote: 'The link holds no name or contact and expires in 24 hours.', copy: 'Copy link', copied: 'Copied', print: 'Print', close: 'Close',
      saveHtml: 'Save result as HTML', saveNote: 'This is the summary page built here. Save the file and send it by mail or chat. It holds no name or contact.',
      linkNone: 'No B2C booking link is connected yet. This is DEMO data and cannot be booked.', retry: 'Retry', err: 'Connection failed. Please try again shortly.',
      foot: 'Prices and availability are as of the lookup and are rechecked before booking. Do not enter personal data. The chat resets after 10 minutes idle.',
      notes: 'Notes', hello: 'Hello, this is OHMY MATE. Tell me the area, dates, guests and budget.',
      stats: 'Stats', reports: 'Reports', excl: 'Excluded', staffCode: 'Hotel code', staffB2c: 'B2C ID', staffContract: 'Contract', mapped: 'Mapped', unmapped: 'Unmapped',
      score: 'Score basis', rep: 'Report', repPrice: 'Price', repStock: 'Stock', repMap: 'Mapping', repDone: 'Report recorded.', noReports: 'No reports yet.',
      exLabels: { unmapped: 'Unmapped', soldout: 'Sold out', capacity: 'Over capacity', budget: 'Over budget', walk: 'Too far to walk', breakfast: 'No breakfast', radius: 'Far from station' },
      w: { budget: 'Budget', location: 'Location', room: 'Room', quality: 'Quality', pref: 'Prefs' },
      amen: { wifi: 'Wi-Fi', elevator: 'Elevator', laundry: 'Laundry', luggage: 'Luggage storage', breakfast: 'Breakfast', spa: 'Spa', gym: 'Gym', 'family-room': 'Family room' },
      st: { sessions: 'Sessions', messages: 'Messages', searches: 'Hotel searches', noResult: 'No result', errors: 'Lookup errors', blocked: 'Blocked', clicks: 'Booking clicks', shares: 'Shares', reports: 'Reports', avgResponseMs: 'Avg response (ms)', searchToClickRate: 'Search to click', failureRate: 'Error rate' },
      types: { A: 'Travel info', B: 'Hotel search', C: 'Price / stock', D: 'Compare', E: 'Itinerary', F: 'Transport', G: 'Booking', H: 'Other' },
      quick: ['Switch to breakfast included', 'Within 5 min walk', 'Compare the hotels', 'Book the second hotel', 'Suggest an itinerary too'],
      chips: [
        'We travel to Osaka Nov 25 to 27, my mother and I. Budget hotel near Namba Station, max 12,000 yen per night.',
        'Family of 4 (2 children), Nov 25 to 27, hotel near Namba Station',
        'How do I get from Kansai Airport to Namba?', 'Can I do Kyoto as a day trip?'
      ],
    },
  };

  const $ = (id) => document.getElementById(id);
  let lang = 'ko';
  let sessionId = null;
  let staffPin = null;
  let staffView = false;
  let staffRole = null;
  let lastExcluded = null;
  let cards = [];
  let lastMsg = '';
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
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  function icon() {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 48 48');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2.4');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M10 42V12a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v30M30 20h6a2 2 0 0 1 2 2v20M6 42h36M16 18h8M16 26h8M16 34h8');
    s.append(p);
    return s;
  }
  const yen = (n) => (lang === 'en' ? 'JPY ' : '') + n.toLocaleString('en-US') + (lang === 'en' ? '' : '엔');

  function api(path, body, method) {
    const headers = { 'Content-Type': 'application/json' };
    if (staffPin) headers['x-staff-pin'] = staffPin;
    return fetch(path, { method: method || 'POST', headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) }).then((r) => r.json().then((j) => ({ ok: r.ok, status: r.status, json: j })));
  }

  function renderChips(box, list) {
    box.replaceChildren(...list.map((c) => h('button', { type: 'button', onclick: () => ask(c) }, c)));
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
    $('pinTitle').textContent = t().pinTitle;
    $('pinOk').textContent = t().pinOk;
    $('pinCancel').textContent = t().pinCancel;
    $('heroTitle').replaceChildren(t().heroA, h('em', null, t().heroB));
    $('heroSub').textContent = t().heroSub;
    renderChips($('chips'), t().chips);
    renderChips($('quick'), t().quick);
    document.documentElement.lang = lang;
    renderStaffBar();
  }

  function renderStaffBar() {
    const bar = $('staffBar');
    bar.hidden = !staffView;
    if (!staffView) return;
    const ex = lastExcluded
      ? Object.entries(lastExcluded).filter(([, v]) => v > 0).map(([k, v]) => `${t().exLabels[k]} ${v}`).join(' · ')
      : '';
    const items = [
      h('b', null, `${t().staff} · ${staffRole || ''}`),
      h('button', { type: 'button', onclick: showStats }, t().stats),
      h('button', { type: 'button', onclick: showReports }, t().reports),
    ];
    if (ex) items.push(h('span', { class: 'ex' }, `${t().excl}: ${ex}`));
    bar.replaceChildren(...items);
  }

  function bubble(role, content) {
    const b = h('div', { class: 'bubble' }, content);
    $('chat').append(h('div', { class: 'msg ' + role }, b));
    return b;
  }
  function scrollEnd() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function staffPanel(c) {
    const s = c.staff;
    const W = { budget: 30, location: 25, room: 20, quality: 15, pref: 10 };
    const bars = h('div', { class: 'bars' });
    Object.entries(s.breakdown).forEach(([k, v]) => {
      bars.append(h('span', null, `${t().w[k]} (${W[k]})`), h('span', { class: 'bar' }, h('i', { style: `width:${v == null ? 0 : Math.round(v)}%` })), h('span', null, v == null ? 'n/a' : String(Math.round(v))));
    });
    const mk = (kind, label) => h('button', { type: 'button', onclick: () => reportIssue(c, kind) }, label);
    return h('div', { class: 'staffpanel' },
      h('div', { class: 'kv' }, h('span', null, `${t().staffCode} `, h('code', null, s.hotelCode)), h('span', null, `${t().staffB2c} `, h('code', null, s.b2cHotelId || '—')),
        h('span', null, `${t().staffContract} `, h('code', null, s.contract)), h('span', null, s.mapped ? t().mapped : t().unmapped)),
      h('div', null, t().score), bars,
      h('div', { class: 'rep' }, h('span', null, t().rep), mk('price', t().repPrice), mk('inventory', t().repStock), mk('mapping', t().repMap)));
  }

  function cardEl(c, idx) {
    const best = idx === 0;
    const price = c.price
      ? h('div', { class: 'pricebox' }, h('b', null, yen(c.price.total)),
          h('span', null, `${c.price.nights}${t().night} ${t().total} · ${t().maxNight} ${yen(c.price.nightlyMax)} · ${c.price.taxIncluded ? t().taxIn : t().taxUnk}`))
      : h('div', { class: 'pricebox none' }, t().stayDates);
    const tags = h('div', { class: 'tags' },
      h('span', null, t().bf[c.breakfast] + (c.breakfastPrice ? ` (${yen(c.breakfastPrice)})` : '')),
      h('span', { class: c.cancel.refundable ? '' : 'warn' }, c.cancel.text));
    const score = c.fit.score;
    const detail = h('details', { class: 'more' }, h('summary', null, t().detail),
      h('div', null, c.address), h('div', null, c.amenities.map((a) => t().amen[a] || a).join(' · ')),
      c.price ? h('div', null, `${t().asOf} ${new Date(c.price.asOf).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}`) : null);
    return h('article', { class: 'card' + (best ? ' best' : '') },
      h('div', { class: 'thumb' }, icon(), h('span', { class: 'tag' }, c.demo ? `DEMO · ${t().noPhoto}` : t().noPhoto), best ? h('span', { class: 'tag rank' }, t().best) : null),
      h('div', { class: 'body' },
        h('div', { class: 'title' }, h('h3', null, c.name), h('span', { class: 'stars' }, `${c.star}★${c.starVerified ? '' : ' DEMO'}`)),
        c.station ? h('p', { class: 'loc' }, `${c.station.label} · ${c.station.straightM}m · ${t().walkEst} ~${c.station.walkMinEstimated}${lang === 'ko' ? '분' : ' min'}`, h('i', null, t().unverified)) : null,
        price, tags,
        h('ul', { class: 'why' }, c.reasons.slice(0, 3).map((r) => h('li', null, r))),
        score != null ? h('div', { class: 'fitbar' }, `${t().fit} ${score}/100 · ${t().complete} ${c.fit.completeness}%`, h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(score)}%` }))) : null,
        detail,
        c.staff ? staffPanel(c) : null,
        h('div', { class: 'actions' },
          h('label', null, h('input', { type: 'checkbox', onchange: (e) => (e.target.checked ? picked.add(c.id) : picked.delete(c.id)) }), t().pick),
          h('button', { class: 'primary', type: 'button', onclick: () => book(c) }, t().book))));
  }

  function tableFrom(rows, bestCol) {
    return h('table', { class: 'cmp' }, rows.map(([label, vals]) => h('tr', null, h('th', null, label), vals.map((v, i) => h('td', { class: bestCol === i ? 'best' : '' }, v)))));
  }

  function renderCompare(ids) {
    const sel = cards.filter((c) => ids.has(c.id)).slice(0, 3);
    if (sel.length < 2) return bubble('bot', t().pickTwo);
    const rows = [
      [lang === 'ko' ? '호텔' : 'Hotel', sel.map((c) => c.name)],
      [t().total, sel.map((c) => (c.price ? yen(c.price.total) : '-'))],
      [t().maxNight, sel.map((c) => (c.price ? yen(c.price.nightlyMax) : '-'))],
      [lang === 'ko' ? '기준 역' : 'Station', sel.map((c) => (c.station ? `${c.station.straightM}m / ~${c.station.walkMinEstimated}` : '-'))],
      [lang === 'ko' ? '조식' : 'Breakfast', sel.map((c) => t().bf[c.breakfast])],
      [lang === 'ko' ? '취소' : 'Cancel', sel.map((c) => c.cancel.text)],
      [t().fit, sel.map((c) => (c.fit.score == null ? '-' : c.fit.score))],
    ];
    const bi = sel.reduce((a, c, i) => ((c.fit.score || 0) > (sel[a].fit.score || 0) ? i : a), 0);
    bubble('bot', tableFrom(rows, bi)).style.maxWidth = '100%';
    scrollEnd();
  }

  function renderResponse(r) {
    sessionId = r.sessionId || sessionId;
    lastExcluded = r.staff ? r.staff.excluded : lastExcluded;
    const b = bubble('bot', r.reply);
    (r.clarify || []).forEach((c) => b.append(h('div', { class: 'clarify' }, c)));
    const notes = (r.notices || []).filter((n) => !/^DEMO/.test(n));
    if (notes.length) b.append(h('details', { class: 'notes' }, h('summary', null, `${t().notes} (${notes.length})`), h('ul', null, notes.map((n) => h('li', null, n)))));
    if (r.cards && r.cards.length) {
      cards = r.cards;
      picked.clear();
      $('chat').append(h('div', { class: 'cards' }, r.cards.map((c, i) => cardEl(c, i))));
    }
    if (r.compare) {
      cards = r.compare.cards;
      bubble('bot', tableFrom(r.compare.rows.map((row) => [row.label, row.values]), -1)).style.maxWidth = '100%';
    }
    (r.actions || []).forEach((a) => {
      if (a.type === 'share') openShare();
      if (a.type === 'retry') $('chat').append(h('button', { type: 'button', onclick: () => ask(lastMsg) }, t().retry));
      if (a.type === 'book') {
        const c = cards.find((x) => x.id === a.hotelId);
        if (c) $('chat').append(h('div', { class: 'cards' }, cardEl(c, -1)));
      }
    });
    renderStaffBar();
    scrollEnd();
  }

  function enterChat() {
    $('hero').hidden = true;
    $('quick').hidden = false;
  }

  async function ask(text) {
    if (!text.trim()) return;
    lastMsg = text;
    enterChat();
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
      $('shareNote').textContent = t().saveNote;
      $('copyBtn').textContent = t().saveHtml;
    } else {
      $('shareNote').textContent = t().shareNote;
      $('copyBtn').textContent = t().copy;
      if (window.QRCode) new window.QRCode($('qr'), { text: json.url, width: 180, height: 180 });
      else $('qr').textContent = json.url;
    }
    $('shareDlg').showModal();
  }

  async function reportIssue(c, kind) {
    const { ok } = await api('/api/report', { kind, hotelId: c.id, note: 'staff report from card' });
    bubble('bot', ok ? t().repDone : t().badPin);
    scrollEnd();
  }

  async function showStats() {
    const { ok, json } = await api('/api/admin/stats', null, 'GET');
    if (!ok) return bubble('bot', t().badPin);
    const rows = Object.keys(t().st).filter((k) => json[k] != null).map((k) => {
      let v = json[k];
      if (k === 'searchToClickRate' || k === 'failureRate') v = `${Math.round(v * 100)}%`;
      return [t().st[k], [String(v)]];
    });
    const types = Object.entries(json.types || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${t().types[k] || k} ${v}`).join(' · ');
    if (types) rows.push([lang === 'ko' ? '질문 유형' : 'Question types', [types]]);
    bubble('bot', h('table', { class: 'tbl' }, rows.map(([l, v]) => h('tr', null, h('th', null, l), h('td', null, v[0]))))).style.maxWidth = '100%';
    scrollEnd();
  }

  async function showReports() {
    const { ok, json } = await api('/api/admin/reports', null, 'GET');
    if (!ok) return bubble('bot', t().badPin);
    if (!json.reports.length) return bubble('bot', t().noReports);
    bubble('bot', h('table', { class: 'tbl' }, json.reports.map((x) => h('tr', null, h('th', null, new Date(x.t).toLocaleTimeString()), h('td', null, `${x.kind} · ${x.hotelId} · ${x.role}`))))).style.maxWidth = '100%';
    scrollEnd();
  }

  async function reset() {
    if (sessionId) await api('/api/reset', { sessionId }).catch(() => {});
    sessionId = null;
    cards = [];
    lastExcluded = null;
    picked.clear();
    $('chat').replaceChildren();
    $('hero').hidden = false;
    $('quick').hidden = true;
    renderStaffBar();
    window.scrollTo(0, 0);
  }

  function touch() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(reset, 10 * 60 * 1000);
  }

  async function submitPin(e) {
    e.preventDefault();
    staffPin = $('pinInput').value.trim();
    const { ok, json } = await api('/api/staff/check', null, 'GET');
    if (ok) {
      staffView = true;
      staffRole = json.role;
      $('pinDlg').close();
      applyStatic();
    } else {
      staffPin = null;
      $('pinErr').textContent = t().badPin;
      $('pinErr').hidden = false;
      $('pinInput').select();
    }
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
    try {
      await navigator.clipboard.writeText($('shareUrl').value);
      $('copyBtn').textContent = t().copied;
    } catch (e) {
      $('shareUrl').select();
    }
  });
  $('printBtn').addEventListener('click', () => window.open($('shareUrl').value, '_blank', 'noopener'));
  $('closeShare').addEventListener('click', () => $('shareDlg').close());
  $('staffBtn').addEventListener('click', () => {
    if (staffView) {
      staffView = false;
      staffPin = null;
      staffRole = null;
      lastExcluded = null;
      applyStatic();
      return;
    }
    $('pinInput').value = '';
    $('pinErr').hidden = true;
    $('pinDlg').showModal();
    $('pinInput').focus();
  });
  $('pinForm').addEventListener('submit', submitPin);
  $('pinCancel').addEventListener('click', () => $('pinDlg').close());
  ['click', 'keydown'].forEach((ev) => document.addEventListener(ev, touch));

  applyStatic();
  touch();
})();
