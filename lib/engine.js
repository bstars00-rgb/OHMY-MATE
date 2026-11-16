'use strict';
const { STATIONS, CITIES } = require('./demo-data');
const intent = require('./intent');
const { haversineM, estimateWalkMin } = require('./geo');
const ranking = require('./ranking');
const guard = require('./guard');
const knowledge = require('./knowledge');
const config = require('./config');
const { addDays, diffDays } = intent;

const DEFAULT_RADIUS_M = 1500;
const pad = (n) => String(n).padStart(2, '0');

function newSession(id) {
  return { id, slots: {}, lastCards: [], searched: false, history: 0, createdAt: Date.now(), lastActive: Date.now() };
}

const yen = (n, L) => (L === 'en' ? `JPY ${n.toLocaleString('en-US')}` : `${n.toLocaleString('en-US')}엔`);
const md = (s) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;

function mergeSlots(prev, p, today) {
  const s = { ...prev };
  const issues = [];
  for (const k of ['adults', 'children', 'childAges', 'rooms', 'city', 'station', 'landmark', 'maxWalkMin', 'breakfast', 'bed']) {
    if (p[k] !== undefined) s[k] = p[k];
  }
  if (p.station) delete s.landmark;
  if (p.landmark === 'usj' && !s.city) s.city = 'osaka';
  if (p.checkIn && p.checkOut) {
    s.checkIn = p.checkIn;
    s.checkOut = p.checkOut;
  } else if (p.checkIn) {
    s.checkIn = p.checkIn;
    if (s.checkOut && s.checkOut <= s.checkIn) delete s.checkOut;
  }
  if (p._partial) {
    const yr = Number((s.checkIn || today).slice(0, 4));
    const ok = (m, d) => {
      const dt = new Date(Date.UTC(yr, m - 1, d));
      return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    };
    if (p._partial.checkIn) {
      const m = p._partial.checkIn.m || Number((s.checkIn || today).slice(5, 7));
      if (ok(m, p._partial.checkIn.d)) s.checkIn = `${yr}-${pad(m)}-${pad(p._partial.checkIn.d)}`;
      else issues.push('invalidDate');
    }
    if (p._partial.checkOut) {
      const base = s.checkIn || today;
      let m = p._partial.checkOut.m || Number(base.slice(5, 7));
      const d = p._partial.checkOut.d;
      if (ok(m, d)) {
        let out = `${yr}-${pad(m)}-${pad(d)}`;
        if (!p._partial.checkOut.m && s.checkIn && out <= s.checkIn) {
          m = m === 12 ? 1 : m + 1;
          out = `${m === 1 ? yr + 1 : yr}-${pad(m)}-${pad(d)}`;
        }
        s.checkOut = out;
      } else issues.push('invalidDate');
    }
  }
  if (p._nights && s.checkIn && !p.checkOut) s.checkOut = addDays(s.checkIn, p._nights);
  if (p._invalidDate) issues.push('invalidDate');
  if (p.budgetNight) {
    s.budgetNight = p.budgetNight;
    delete s.budgetTotal;
    s.basisAssumed = !!p._basisAssumed;
  }
  if (p.budgetTotal) {
    s.budgetTotal = p.budgetTotal;
    delete s.budgetNight;
    s.basisAssumed = false;
  }
  if (p._special) s.special = [...new Set([...(s.special || []), ...p._special])];
  if (p.guestsConflict) issues.push('guestsConflict');
  return { slots: s, issues };
}

function validate(slots, today, issues) {
  const out = [...issues];
  let datesOk = !!(slots.checkIn && slots.checkOut);
  if (datesOk) {
    if (slots.checkOut <= slots.checkIn) {
      out.push('checkoutBeforeCheckin');
      datesOk = false;
    } else if (slots.checkIn < today) {
      out.push('pastDate');
      datesOk = false;
    } else if (diffDays(slots.checkIn, slots.checkOut) > 30) {
      out.push('tooLong');
      datesOk = false;
    }
  }
  if (out.includes('invalidDate')) datesOk = false;
  if (slots.adults != null && (slots.adults < 1 || slots.adults > 9)) out.push('badGuests');
  if (slots.rooms != null && (slots.rooms < 1 || slots.rooms > 5)) out.push('badRooms');
  return { issues: [...new Set(out)], datesOk };
}

const ISSUE_TEXT = {
  ko: {
    invalidDate: '존재하지 않는 날짜가 있습니다. 체크인·체크아웃 날짜를 다시 알려 주세요.',
    checkoutBeforeCheckin: '체크아웃 날짜가 체크인보다 빠르거나 같습니다. 날짜를 다시 확인해 주세요.',
    pastDate: '이미 지난 날짜입니다. 체크인 날짜를 다시 알려 주세요.',
    tooLong: '30박을 넘는 숙박은 이 화면에서 조회하지 않습니다. 장기 투숙은 직원에게 문의해 주세요.',
    badGuests: '성인 인원은 1~9명 사이로 입력해 주세요. 더 많은 인원은 객실을 나누어 문의해 주세요.',
    badRooms: '객실 수는 1~5개 사이로 입력해 주세요.',
    guestsConflict: '총 인원보다 어린이 수가 많거나 같습니다. 성인과 어린이 인원을 다시 알려 주세요.',
  },
  en: {
    invalidDate: 'One of the dates does not exist. Please give the check-in and check-out dates again.',
    checkoutBeforeCheckin: 'Check-out is on or before check-in. Please check the dates.',
    pastDate: 'That date is in the past. Please give a new check-in date.',
    tooLong: 'Stays over 30 nights are not searched here. Please ask a staff member.',
    badGuests: 'Please enter 1 to 9 adults. For larger groups, ask about splitting rooms.',
    badRooms: 'Please enter 1 to 5 rooms.',
    guestsConflict: 'The number of children is not smaller than the total. Please restate adults and children.',
  },
};

function summarize(slots, L) {
  const parts = [];
  if (slots.checkIn && slots.checkOut) {
    const n = diffDays(slots.checkIn, slots.checkOut);
    parts.push(L === 'ko' ? `${md(slots.checkIn)}~${md(slots.checkOut)}(${n}박)` : `${md(slots.checkIn)}-${md(slots.checkOut)} (${n} nights)`);
  }
  if (slots.adults != null) {
    let g = L === 'ko' ? `성인 ${slots.adults}명` : `${slots.adults} adult(s)`;
    if (slots.children) g += L === 'ko' ? `, 어린이 ${slots.children}명` : `, ${slots.children} child(ren)`;
    parts.push(g);
  }
  if (slots.adults != null) parts.push(L === 'ko' ? `객실 ${slots.rooms || 1}개` : `${slots.rooms || 1} room(s)`);
  if (slots.station) parts.push(L === 'ko' ? `${STATIONS[slots.station].label.ko} 기준` : `near ${STATIONS[slots.station].label.en}`);
  else if (slots.city) parts.push(CITIES[slots.city].label[L]);
  if (slots.budgetNight) parts.push(L === 'ko' ? `1박 ${yen(slots.budgetNight, L)} 이하` : `max ${yen(slots.budgetNight, L)}/night`);
  if (slots.budgetTotal) parts.push(L === 'ko' ? `총액 ${yen(slots.budgetTotal, L)} 이하` : `max ${yen(slots.budgetTotal, L)} total`);
  if (slots.breakfast === true) parts.push(L === 'ko' ? '조식 포함' : 'breakfast included');
  if (slots.maxWalkMin) parts.push(L === 'ko' ? `도보 ${slots.maxWalkMin}분 이내` : `within ${slots.maxWalkMin} min walk`);
  return parts.join(' · ');
}

function cancelInfo(h, slots, today, L) {
  const days = h.cancel.freeUntilDaysBefore;
  if (!days) return { refundable: false, text: L === 'ko' ? '환불 불가' : 'Non-refundable' };
  if (slots.checkIn) {
    const until = addDays(slots.checkIn, -days);
    if (until < today) return { refundable: false, text: L === 'ko' ? '무료 취소 기간이 지났습니다' : 'Free-cancellation period has passed' };
    return { refundable: true, until, text: L === 'ko' ? `${md(until)}까지 무료 취소` : `Free cancellation until ${md(until)}` };
  }
  return { refundable: true, text: L === 'ko' ? `체크인 ${days}일 전까지 무료 취소` : `Free cancellation up to ${days} day(s) before check-in` };
}

async function searchCore(session, adapter, today, L, staff) {
  const slots = session.slots;
  const notices = [];
  const clarify = [];
  const excluded = { unmapped: 0, soldout: 0, capacity: 0, budget: 0, walk: 0, breakfast: 0, radius: 0 };
  const { issues, datesOk } = validate(slots, today, session._issues || []);
  issues.forEach((i) => clarify.push(ISSUE_TEXT[L][i]));

  if (!slots.city && !slots.station) {
    clarify.push(L === 'ko' ? '어느 도시(또는 역)에서 찾을까요?' : 'Which city or station should I search?');
    return { cards: [], excluded, notices, clarify, priceStatus: 'none', asOf: null };
  }
  const city = slots.city;
  if (!CITIES[city].demo) {
    notices.push(L === 'ko' ? `${CITIES[city].label.ko}는 DEMO 데이터에 호텔이 없습니다. 오사카로 먼저 확인해 보세요.` : `No DEMO hotels for ${CITIES[city].label.en}. Try Osaka.`);
    return { cards: [], excluded, notices, clarify, priceStatus: 'none', asOf: null };
  }

  const guestsKnown = slots.adults != null && !issues.includes('badGuests') && !issues.includes('guestsConflict');
  const priceReady = datesOk && guestsKnown;
  let priceStatus = 'ok';
  if (!datesOk || !guestsKnown) {
    priceStatus = !datesOk ? 'needs-dates' : 'needs-guests';
    if (!clarify.length) {
      clarify.push(
        L === 'ko'
          ? '가격은 체크인·체크아웃 날짜와 성인·어린이 인원이 정해져야 확인할 수 있습니다. 알려 주시겠어요?'
          : 'To check prices I need the check-in/out dates and the number of adults and children.'
      );
    }
    if (slots.budgetNight || slots.budgetTotal) {
      notices.push(L === 'ko' ? '예산 조건은 날짜와 인원이 정해진 뒤에 적용합니다. 지금 목록은 가격 확인 전 후보입니다.' : 'The budget is applied once dates and guests are set. This list is pre-price candidates.');
    }
  }

  const anchor = slots.station ? STATIONS[slots.station] : null;
  if (slots.landmark && !anchor) {
    notices.push(
      slots.landmark === 'usj'
        ? L === 'ko'
          ? '유니버설 스튜디오까지의 거리는 데이터가 없어 위치 점수를 평가하지 않았습니다. 가장 가까운 역은 JR 유니버설시티역입니다.'
          : 'No distance data to Universal Studios, so the location score was not evaluated. The nearest station is JR Universal City.'
        : L === 'ko'
        ? '해당 장소까지의 거리는 데이터가 없어 위치 점수를 평가하지 않았습니다.'
        : 'No distance data for that place, so the location score was not evaluated.'
    );
  }
  if (anchor && anchor.ambiguous) {
    notices.push(
      L === 'ko'
        ? '난바역은 난카이·오사카메트로·킨테츠/한신(오사카난바)로 나뉩니다. 이번 거리는 난바 지역 중심 지점 기준이며, 이용할 역이 정해지면 다시 계산하겠습니다.'
        : 'Namba is served by Nankai, Osaka Metro and Kintetsu/Hanshin stations. Distances use a central Namba point; tell me your station to recalculate.'
    );
  }
  if (anchor) notices.push(L === 'ko' ? '도보 시간은 직선거리에서 추정한 값이며 실제 경로로 확인한 값이 아닙니다.' : 'Walking times are estimated from straight-line distance, not verified routes.');

  const hotels = await adapter.searchHotels({ city });
  const rooms = slots.rooms || 1;
  const guests = guestsKnown ? slots.adults + (slots.children || 0) : null;
  const rows = [];
  const asOf = new Date().toISOString();

  for (const h of hotels) {
    if (!h.mapped || !h.b2cHotelId) {
      excluded.unmapped += 1;
      continue;
    }
    let walk = null;
    let straight = null;
    if (anchor) {
      straight = haversineM(anchor, h);
      walk = estimateWalkMin(straight);
      if (slots.maxWalkMin) {
        if (walk > slots.maxWalkMin) {
          excluded.walk += 1;
          continue;
        }
      } else if (straight > DEFAULT_RADIUS_M) {
        excluded.radius += 1;
        continue;
      }
    }
    if (guests != null && guests > h.maxOcc * rooms) {
      excluded.capacity += 1;
      continue;
    }
    if (slots.breakfast === true && h.breakfast !== 'included') {
      excluded.breakfast += 1;
      continue;
    }
    let stay = null;
    if (priceReady) {
      stay = await adapter.getStay(h, slots);
      if (stay.soldOut) {
        excluded.soldout += 1;
        continue;
      }
      const maxNight = Math.max(...stay.nightly.map((x) => x.price));
      const total = stay.nightly.reduce((a, x) => a + x.price, 0) * rooms;
      if (slots.budgetNight && maxNight > slots.budgetNight) {
        excluded.budget += 1;
        continue;
      }
      if (slots.budgetTotal && total > slots.budgetTotal) {
        excluded.budget += 1;
        continue;
      }
      stay = { ...stay, maxNight, total };
    }
    rows.push({ h, walk, straight, stay });
  }

  const totals = rows.filter((r) => r.stay).map((r) => r.stay.total);
  const priceRange = totals.length ? { min: Math.min(...totals), max: Math.max(...totals) } : null;
  const special = slots.special || [];
  const cards = rows.map((r) => {
    const { h, walk, straight, stay } = r;
    const cheapRank = priceRange && priceRange.max > priceRange.min ? (100 * (priceRange.max - stay.total)) / (priceRange.max - priceRange.min) : 50;
    const fit = ranking.score({
      price: stay ? stay.total : null,
      total: stay ? stay.total : null,
      maxNight: stay ? stay.maxNight : null,
      budgetNight: slots.budgetNight,
      budgetTotal: slots.budgetTotal,
      priceRange,
      walkMin: walk,
      guests,
      capacity: h.maxOcc * rooms,
      wantBreakfast: slots.breakfast === true,
      breakfast: h.breakfast,
      amenities: h.amenities,
      children: slots.children || 0,
      special,
      bedMatch: slots.bed ? h.beds.includes(slots.bed) : false,
      star: h.star,
      cheapRank,
    });
    const reasons = [];
    if (anchor) {
      reasons.push(
        L === 'ko'
          ? `${anchor.label.ko}까지 직선 ${straight}m, 예상 도보 약 ${walk}분(경로 미검증)`
          : `${straight} m from ${anchor.label.en}, est. ~${walk} min walk (route not verified)`
      );
    }
    if (stay && slots.budgetNight) reasons.push(L === 'ko' ? `1박 최고 ${yen(stay.maxNight, L)}, 예산 이내` : `Highest night ${yen(stay.maxNight, L)}, within budget`);
    if (stay && slots.budgetTotal) reasons.push(L === 'ko' ? `총액 ${yen(stay.total, L)}, 예산 이내` : `Total ${yen(stay.total, L)}, within budget`);
    if (h.breakfast === 'included') reasons.push(L === 'ko' ? '조식 포함' : 'Breakfast included');
    if (special.includes('senior') && h.amenities.includes('elevator')) reasons.push(L === 'ko' ? '엘리베이터가 있어 이동이 편합니다' : 'Elevator available');
    if (slots.children && h.amenities.includes('family-room')) reasons.push(L === 'ko' ? '가족 객실이 있습니다' : 'Family rooms available');
    if (guests != null) reasons.push(L === 'ko' ? `정원 ${h.maxOcc}명 객실, ${guests}명 투숙 가능` : `Room sleeps ${h.maxOcc}; fits ${guests} guest(s)`);

    const card = {
      id: h.id,
      name: h.name[L] || h.name.en,
      star: h.star,
      starVerified: adapterIsLive(adapter),
      address: h.address,
      station: anchor ? { label: anchor.label[L], straightM: straight, walkMinEstimated: walk, walkVerified: false } : null,
      price: stay
        ? {
            currency: 'JPY',
            nights: stay.nights,
            rooms,
            nightlyFrom: Math.min(...stay.nightly.map((x) => x.price)),
            nightlyMax: stay.maxNight,
            total: stay.total,
            taxIncluded: stay.taxIncluded,
            basis: 'per-room-per-night',
            asOf,
            ttlSec: config.priceTtlSec,
          }
        : null,
      priceStatus: stay ? 'ok' : priceStatus,
      breakfast: h.breakfast,
      breakfastPrice: h.breakfastPrice || null,
      cancel: cancelInfo(h, slots, today, L),
      amenities: h.amenities,
      reasons,
      fit: { score: fit.total, completeness: fit.completeness, unevaluated: fit.unevaluated },
      demo: adapter.mode === 'demo',
      bookable: !!(h.mapped && h.b2cHotelId),
      _total: stay ? stay.total : null,
      _contract: h.contract,
    };
    if (staff) card.staff = { hotelCode: h.id, mapped: h.mapped, b2cHotelId: h.b2cHotelId, contract: h.contract, breakdown: fit.parts };
    return card;
  });

  // 점수 내림차순으로 먼저 정렬한 뒤, 인접한 동점(1점 미만) 쌍에만 직계약 우대 규칙을 한 번 적용한다.
  // 비교 함수가 추이적이지 않으므로 sort 에 직접 넣지 않는다.
  cards.sort((a, b) => (b.fit.score || 0) - (a.fit.score || 0));
  for (let i = 0; i < cards.length - 1; i += 1) {
    if (ranking.compare(cards[i], cards[i + 1]) > 0) [cards[i], cards[i + 1]] = [cards[i + 1], cards[i]];
  }
  const top = cards.slice(0, 5);
  return { cards: top, excluded, notices, clarify, priceStatus, asOf, totalCandidates: cards.length };
}

function adapterIsLive(a) {
  return a.mode === 'live';
}

function publicCard(c) {
  return guard.deepStrip(c);
}

function exclusionText(ex, L) {
  const m = [];
  if (ex.soldout) m.push(L === 'ko' ? `만실 ${ex.soldout}곳` : `${ex.soldout} sold out`);
  if (ex.capacity) m.push(L === 'ko' ? `정원 초과 ${ex.capacity}곳(객실을 나누면 가능할 수 있습니다)` : `${ex.capacity} over capacity (more rooms may work)`);
  if (ex.budget) m.push(L === 'ko' ? `예산 초과 ${ex.budget}곳` : `${ex.budget} over budget`);
  if (ex.walk) m.push(L === 'ko' ? `도보 조건 밖 ${ex.walk}곳` : `${ex.walk} outside walking limit`);
  if (ex.radius) m.push(L === 'ko' ? `기준 역에서 먼 호텔 ${ex.radius}곳` : `${ex.radius} far from the station`);
  if (ex.breakfast) m.push(L === 'ko' ? `조식 미포함 ${ex.breakfast}곳` : `${ex.breakfast} without breakfast`);
  return m.join(', ');
}

function compareTable(cards, L) {
  const rows = [
    [L === 'ko' ? '호텔' : 'Hotel', (c) => c.name],
    [L === 'ko' ? '추천 점수' : 'Fit score', (c) => (c.fit.score == null ? '-' : `${c.fit.score} (${c.fit.completeness}%)`)],
    [L === 'ko' ? '총액' : 'Total', (c) => (c.price ? yen(c.price.total, L) : '-')],
    [L === 'ko' ? '1박(최고)' : 'Per night (max)', (c) => (c.price ? yen(c.price.nightlyMax, L) : '-')],
    [L === 'ko' ? '기준 역과 거리' : 'Distance', (c) => (c.station ? `${c.station.straightM}m / ~${c.station.walkMinEstimated}${L === 'ko' ? '분(예상)' : ' min (est.)'}` : '-')],
    [L === 'ko' ? '조식' : 'Breakfast', (c) => ({ included: L === 'ko' ? '포함' : 'Included', optional: L === 'ko' ? '선택' : 'Optional', none: L === 'ko' ? '없음' : 'None' }[c.breakfast])],
    [L === 'ko' ? '취소' : 'Cancellation', (c) => c.cancel.text],
    [L === 'ko' ? '별 등급' : 'Stars', (c) => `${c.star}${c.starVerified ? '' : ' (DEMO)'}`],
  ];
  return rows.map(([label, f]) => ({ label, values: cards.map(f) }));
}

async function handleMessage(session, rawText, opts) {
  const { adapter, today, staff } = opts;
  const L = opts.lang === 'en' ? 'en' : 'ko';
  session.lastActive = Date.now();
  session.history += 1;
  const base = { demo: adapter.mode === 'demo', dataMode: adapter.mode, notices: [], clarify: [], cards: [], compare: null, actions: [], blocked: false };
  const demoNotice = L === 'ko' ? 'DEMO 데이터입니다. 실제 호텔·가격·예약 가능 여부가 아닙니다.' : 'DEMO data. These are not real hotels, prices or availability.';
  if (adapter.mode === 'demo') base.notices.push(demoNotice);

  const chk = guard.checkInput(rawText);
  if (chk.blocked) {
    return {
      ...base,
      blocked: true,
      blockReason: chk.reason,
      types: [],
      reply:
        L === 'ko'
          ? '내부 운영 정보, 시스템 설정, 다른 고객 정보는 안내할 수 없습니다. 여행과 호텔 상담은 계속 도와드리겠습니다.'
          : 'I cannot share internal operating data, system settings or other customers\' information. I am happy to keep helping with your trip and hotels.',
      slots: slotsView(session.slots),
    };
  }
  const pii = guard.maskPII(rawText);
  if (pii.found.length) {
    base.notices.push(L === 'ko' ? '연락처 등 개인정보는 상담창에 입력하지 마세요. 입력된 부분은 지우고 처리했습니다.' : 'Please do not type personal data here. It was removed before processing.');
  }

  const parsed = intent.parse(pii.text, today);
  const before = JSON.stringify(session.slots);
  const merged = mergeSlots(session.slots, parsed.slots, today);
  session.slots = merged.slots;
  session._issues = merged.issues;
  const slotChanged = before !== JSON.stringify(session.slots);

  let types = parsed.types.slice();
  if (types.includes('F') && types.includes('B') && !/간사이공항|kix|kansai airport/i.test(parsed.raw)) types = types.filter((x) => x !== 'F');
  if (!types.length && slotChanged && session.searched) types.push('B');
  if (!types.length && parsed.ref != null && session.lastCards.length) types.push('G');

  const replyParts = [];
  let result = {};
  const wantsSearch = types.some((x) => ['B', 'C'].includes(x)) || (types.includes('D') && !session.lastCards.length);

  if (types.some((x) => ['A', 'E', 'F'].includes(x))) {
    const k = knowledge.answer(types, parsed.raw, { ...session.slots }, L);
    if (k) {
      replyParts.push(k.text);
      base.notices.push(k.notice);
    }
  }

  try {
    if (types.includes('G')) {
      const idx = parsed.ref != null ? parsed.ref : session.lastCards.length === 1 ? 0 : null;
      const target = idx != null ? session.lastCards[idx] : null;
      if (!target) {
        replyParts.push(
          session.lastCards.length
            ? L === 'ko' ? '몇 번째 호텔로 진행할지 알려 주세요. 예: "두 번째 호텔 예약".' : 'Which hotel? For example "book the second one".'
            : L === 'ko' ? '예약할 호텔이 아직 없습니다. 지역, 날짜, 인원을 알려 주시면 먼저 호텔을 찾아보겠습니다.' : 'No hotel selected yet. Tell me the area, dates and guests and I will search first.'
        );
      } else {
        const hotel = await adapter.getHotel(target.id);
        let fresh = null;
        if (hotel && validate(session.slots, today, []).datesOk && session.slots.adults != null) {
          const stay = await adapter.getStay(hotel, session.slots);
          if (stay.soldOut) {
            replyParts.push(L === 'ko' ? `${target.name}은(는) 방금 다시 조회했더니 해당 날짜에 객실이 없습니다. 다른 호텔을 골라 주세요.` : `${target.name} is no longer available for those dates. Please pick another.`);
          } else {
            const rooms = session.slots.rooms || 1;
            const total = stay.nightly.reduce((a, x) => a + x.price, 0) * rooms;
            fresh = total;
            const changed = target.price && target.price.total !== total;
            result.bookTarget = target.id;
            base.actions.push({ type: 'book', hotelId: target.id });
            replyParts.push(
              L === 'ko'
                ? `${target.name}으로 진행합니다. 예약 전에 가격을 다시 조회했고 총액은 ${yen(total, L)}입니다${changed ? '(앞서 보여드린 금액과 달라졌습니다)' : ''}. 아래 버튼은 OHMYHOTEL 예약 화면으로 이동하는 링크이며, 이동만으로 예약이 확정되지는 않습니다.`
                : `Proceeding with ${target.name}. I re-checked the price before booking: total ${yen(total, L)}${changed ? ' (changed from earlier)' : ''}. The button below only opens the OHMYHOTEL booking page; nothing is confirmed by clicking it.`
            );
            if (changed) base.notices.push(L === 'ko' ? '가격이 조회 시점 사이에 바뀌었습니다.' : 'The price changed between lookups.');
          }
        } else {
          replyParts.push(L === 'ko' ? '예약 링크를 만들려면 체크인·체크아웃 날짜와 인원이 필요합니다.' : 'I need dates and guests to build a booking link.');
        }
        void fresh;
      }
    } else if (wantsSearch || types.includes('D')) {
      if (wantsSearch) {
        result = await searchCore(session, adapter, today, L, staff);
        session.searched = true;
        session.lastCards = result.cards;
      }
      if (types.includes('D')) {
        const pick = session.lastCards.slice(0, 3);
        if (pick.length >= 2) {
          base.compare = { cards: pick.map(publicCard), rows: compareTable(pick, L) };
          replyParts.push(L === 'ko' ? `상위 ${pick.length}곳을 나란히 비교했습니다.` : `Top ${pick.length} compared side by side.`);
        } else {
          replyParts.push(L === 'ko' ? '비교하려면 호텔 후보가 2곳 이상 필요합니다. 조건을 알려 주시면 먼저 찾아보겠습니다.' : 'I need at least two candidates to compare.');
        }
      }
    }
  } catch (e) {
    base.error = { code: e.code || 'ADAPTER_ERROR', retryable: true };
    replyParts.push(
      L === 'ko'
        ? '가격과 재고를 조회하지 못했습니다. 잠시 뒤 다시 시도해 주세요. 확인되지 않은 가격은 보여드리지 않습니다.'
        : 'I could not retrieve prices and availability. Please retry shortly. Unverified prices are never shown.'
    );
    base.actions.push({ type: 'retry' });
    result = {};
  }

  if (wantsSearch && !base.error && result.cards) {
    const sum = summarize(session.slots, L);
    const head = [];
    if (sum) head.push(L === 'ko' ? `${sum} 조건으로 확인했습니다.` : `Checked for: ${sum}.`);
    if (result.cards.length) {
      head.push(
        L === 'ko'
          ? `DEMO 데이터에서 ${result.cards.length}곳을 골랐습니다.${session.slots.basisAssumed ? ' 예산은 1박 기준으로 보았습니다.' : ''}`
          : `${result.cards.length} DEMO hotel(s) selected.${session.slots.basisAssumed ? ' Budget treated as per night.' : ''}`
      );
    } else if (!result.clarify.length && result.totalCandidates === 0) {
      const ex = exclusionText(result.excluded, L);
      head.push(L === 'ko' ? `조건에 맞는 호텔이 없습니다.${ex ? ` (${ex})` : ''} 예산이나 도보 조건을 넓혀 볼까요?` : `No hotel matches.${ex ? ` (${ex})` : ''} Shall I relax the budget or walking limit?`);
    }
    replyParts.unshift(head.join(' '));
    if (result.cards.length && session.slots.breakfast !== true) replyParts.push(L === 'ko' ? '이 중 조식 포함 상품만 다시 비교해 드릴까요?' : 'Want me to compare only the breakfast-included options?');
    base.notices.push(...result.notices);
    base.clarify.push(...result.clarify);
    if (session.slots.children > 0 && !(session.slots.childAges || []).length) {
      base.notices.push(L === 'ko' ? '어린이 나이를 알려 주시면 정원과 요금 기준을 더 정확히 확인할 수 있습니다.' : 'Children\'s ages help confirm occupancy and rate rules.');
    }
  }

  if (!replyParts.length) {
    if (parsed.flags.share) {
      replyParts.push(L === 'ko' ? '화면의 "상담 결과 공유" 버튼으로 링크와 QR을 만들 수 있습니다. 공유 페이지에는 이름이나 연락처 같은 개인정보가 담기지 않습니다.' : 'Use the "Share" button to create a link and QR. The shared page contains no personal data.');
    } else {
      replyParts.push(L === 'ko' ? '여행 일정, 호텔 추천, 가격 확인 중 어떤 도움이 필요하신가요? 지역과 날짜, 인원을 알려 주시면 호텔을 찾아보겠습니다.' : 'How can I help: itinerary, hotel suggestions or prices? Tell me the area, dates and guests and I will search.');
    }
  }
  if (parsed.flags.share) base.actions.push({ type: 'share' });

  const out = {
    ...base,
    types,
    reply: replyParts.filter(Boolean).join('\n\n'),
    slots: slotsView(session.slots),
    cards: (result.cards || []).map(publicCard),
    asOf: result.asOf || null,
    priceStatus: result.priceStatus || null,
  };
  if (staff && result.excluded) out.staff = { excluded: result.excluded };
  out.notices = [...new Set(out.notices)];
  out.clarify = [...new Set(out.clarify)];
  return out;
}

function slotsView(s) {
  const o = {};
  for (const k of ['city', 'station', 'checkIn', 'checkOut', 'adults', 'children', 'rooms', 'budgetNight', 'budgetTotal', 'breakfast', 'maxWalkMin']) {
    if (s[k] !== undefined) o[k] = s[k];
  }
  if (s.checkIn && s.checkOut && s.checkOut > s.checkIn) o.nights = diffDays(s.checkIn, s.checkOut);
  return o;
}

module.exports = { newSession, handleMessage, mergeSlots, validate, slotsView, summarize };
