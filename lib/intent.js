'use strict';
const { STATIONS, CITIES } = require('./demo-data');

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function validDate(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function addDays(isoStr, n) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function diffDays(a, b) {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

// 연도가 없으면 오늘 이후 가장 가까운 날짜로 본다
function resolveMD(m, d, today) {
  const ty = Number(today.slice(0, 4));
  if (!validDate(ty, m, d)) return null;
  let s = iso(ty, m, d);
  if (s < today) s = iso(ty + 1, m, d);
  return validDate(Number(s.slice(0, 4)), m, d) ? s : null;
}

function parseDates(t, today) {
  const out = {};
  const isos = t.match(/\d{4}-\d{1,2}-\d{1,2}/g);
  if (isos && isos.length >= 1) {
    const f = (s) => {
      const [y, m, d] = s.split('-').map(Number);
      return validDate(y, m, d) ? iso(y, m, d) : null;
    };
    const a = f(isos[0]);
    const b = isos[1] ? f(isos[1]) : null;
    if (a) out.checkIn = a;
    if (b) out.checkOut = b;
    if (a && !b) {
      const n = t.match(/(\d+)\s*박/);
      if (n) out.checkOut = addDays(a, Number(n[1]));
    }
    return out;
  }
  let m = t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?\s*(?:부터|~|-|–|에서|to)\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일?/);
  if (!m) m = t.match(/(\d{1,2})\/(\d{1,2})\s*(?:~|-|–|to)\s*(?:(\d{1,2})\/)?(\d{1,2})/);
  if (!m) {
    const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const em = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|–|until|through|~)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{1,2})/i);
    if (em) m = [em[0], MON[em[1].toLowerCase()], em[2], em[3] ? MON[em[3].toLowerCase()] : undefined, em[4]];
  }
  if (m) {
    const m1 = Number(m[1]);
    const d1 = Number(m[2]);
    const a = resolveMD(m1, d1, today);
    if (a) {
      const ay = Number(a.slice(0, 4));
      let m2 = m[3] ? Number(m[3]) : m1;
      const d2 = Number(m[4]);
      if (!m[3] && d2 <= d1) m2 = m1 === 12 ? 1 : m1 + 1;
      const y2 = m2 < m1 ? ay + 1 : ay;
      if (validDate(y2, m2, d2)) {
        out.checkIn = a;
        out.checkOut = iso(y2, m2, d2);
      } else {
        out.checkIn = a;
        out.invalidDate = true;
      }
    } else {
      out.invalidDate = true;
    }
    return out;
  }
  const ci = t.match(/체크\s*인\s*(?:을|는|은|이)?\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일/);
  const co = t.match(/체크\s*아웃\s*(?:을|는|은|이)?\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일/);
  if (ci || co) {
    out.partial = {};
    if (ci) out.partial.checkIn = { m: ci[1] ? Number(ci[1]) : null, d: Number(ci[2]) };
    if (co) out.partial.checkOut = { m: co[1] ? Number(co[1]) : null, d: Number(co[2]) };
    return out;
  }
  const one = t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (one) {
    const a = resolveMD(Number(one[1]), Number(one[2]), today);
    if (a) {
      out.checkIn = a;
      const n = t.match(/(\d+)\s*박/);
      if (n) out.checkOut = addDays(a, Number(n[1]));
    } else out.invalidDate = true;
  }
  return out;
}

function parseYenValue(str) {
  const s = str.replace(/,/g, '');
  const man = s.match(/^(\d+(?:\.\d+)?)\s*만\s*(?:(\d+(?:\.\d+)?)\s*천)?\s*(\d+)?$/);
  if (man) {
    return Math.round(Number(man[1]) * 10000 + (man[2] ? Number(man[2]) * 1000 : 0) + (man[3] ? Number(man[3]) : 0));
  }
  const cheon = s.match(/^(\d+(?:\.\d+)?)\s*천$/);
  if (cheon) return Math.round(Number(cheon[1]) * 1000);
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseBudget(t) {
  const re = /((?:\d[\d,]*(?:\.\d+)?)\s*(?:만\s*(?:\d+(?:\.\d+)?\s*천)?\s*\d*|천)?)\s*(?:엔|円|yen|jpy)/i;
  const m = t.match(re);
  if (!m) return null;
  const value = parseYenValue(m[1].trim());
  if (!value) return null;
  const idx = m.index;
  const win = t.slice(Math.max(0, idx - 14), idx + m[0].length + 6);
  let basis = 'unknown';
  if (/총액|전체|합계|총\s*\d|총\s*예산|total/i.test(win)) basis = 'total';
  else if (/1\s*박|박당|하룻밤|per\s*night|\/\s*night|a night/i.test(win)) basis = 'night';
  return { value, basis };
}

function parseGuests(t) {
  const out = {};
  let s = t;
  const ch = s.match(/(?:어린이|아이|아동|children|kids?|child)\s*(\d+)\s*(?:명|인|人)?/i);
  if (ch) {
    out.children = Number(ch[1]);
    s = s.replace(ch[0], ' ');
  } else if (/아이\s*없|어린이\s*없|no\s*children/i.test(s)) {
    out.children = 0;
  }
  const ages = [...t.matchAll(/(\d{1,2})\s*(?:살|세)/g)].map((x) => Number(x[1])).filter((a) => a <= 17);
  if (ages.length) out.childAges = ages;
  const ad = s.match(/(?:성인|adults?)\s*(\d+)/i) || s.match(/(\d+)\s*(?:adults?)/i);
  if (ad) out.adults = Number(ad[1]);
  else {
    const tot = s.match(/(\d+)\s*(?:명|인(?!천)|人|people|persons?|pax|guests?)/i);
    if (tot) {
      const total = Number(tot[1]);
      out.adults = out.children ? Math.max(1, total - out.children) : total;
      if (out.children && total <= out.children) out.guestsConflict = true;
    } else if (/혼자|1인|solo/i.test(s)) out.adults = 1;
    else if (/둘이|두\s*분|부부|couple|둘만/i.test(s)) out.adults = 2;
    else if (/셋이|세\s*명/.test(s)) out.adults = 3;
    else if (/넷이|네\s*명/.test(s)) out.adults = 4;
  }
  const rm = t.match(/(?:방|객실|룸)\s*(\d+)\s*(?:개|실)?|(\d+)\s*(?:개의?\s*(?:방|객실|룸)|실|rooms?)/i);
  if (rm) out.rooms = Number(rm[1] || rm[2]);
  return out;
}

function findIn(map, t) {
  const low = t.toLowerCase();
  for (const [key, v] of Object.entries(map)) {
    if (v.names.some((n) => low.includes(n.toLowerCase()))) return key;
  }
  return null;
}

const LANDMARKS = [
  { key: 'usj', names: ['유니버설', 'usj', 'universal studio', 'ユニバーサル'], label: { ko: '유니버설 스튜디오', en: 'Universal Studios Japan' } },
  { key: 'kix', names: ['간사이공항', '간사이 공항', 'kix', 'kansai airport', '関西空港'], label: { ko: '간사이공항', en: 'Kansai Airport' } },
];

const ORD = { 첫: 0, 두: 1, 세: 2, 네: 3, 다섯: 4, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
const ORD_EN = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4 };

function parseRef(t) {
  let m = t.match(/(첫|두|세|네|다섯|[1-5])\s*번째/);
  if (m) return ORD[m[1]];
  m = t.match(/([1-5])\s*번\s*호텔/);
  if (m) return Number(m[1]) - 1;
  m = t.match(/\b(first|second|third|fourth|fifth)\b/i);
  if (m) return ORD_EN[m[1].toLowerCase()];
  return null;
}

function parse(raw, today) {
  const t = String(raw || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const slots = {};
  const dates = parseDates(t, today);
  const flags = { share: false };

  Object.assign(slots, parseGuests(t));
  if (dates.checkIn) slots.checkIn = dates.checkIn;
  if (dates.checkOut) slots.checkOut = dates.checkOut;
  if (dates.partial) slots._partial = dates.partial;
  if (dates.invalidDate) slots._invalidDate = true;

  const nightsOnly = t.match(/(\d+)\s*박/);
  if (nightsOnly && !slots.checkOut) slots._nights = Number(nightsOnly[1]);

  const b = parseBudget(t);
  if (b) {
    if (b.basis === 'total') slots.budgetTotal = b.value;
    else {
      slots.budgetNight = b.value;
      if (b.basis === 'unknown') slots._basisAssumed = true;
    }
  }

  const st = findIn(STATIONS, t);
  if (st) {
    slots.station = st;
    slots.city = STATIONS[st].city;
  }
  const city = findIn(CITIES, t);
  if (city && !st) slots.city = city;
  const lm = LANDMARKS.find((l) => l.names.some((n) => t.toLowerCase().includes(n.toLowerCase())));
  if (lm) slots.landmark = lm.key;

  const walk = t.match(/(?:도보|걸어서|walk\w*)\s*(\d+)\s*(?:분|min)/i) || (/도보|걸어/.test(t) && t.match(/(\d+)\s*(?:분|min)\s*(?:이내|안에|within)/i));
  if (walk) slots.maxWalkMin = Number(walk[1]);

  if (/조식\s*(?:없|제외)|no breakfast/i.test(t)) slots.breakfast = false;
  else if (/조식|breakfast|아침\s*(?:식사|포함)/i.test(t)) slots.breakfast = true;

  if (/트윈|twin/i.test(t)) slots.bed = 'twin';
  else if (/더블|double/i.test(t)) slots.bed = 'double';

  const special = [];
  if (/어머니|어머님|아버지|부모|노약자|할머니|할아버지|senior|mother|parents|elderly/i.test(t)) special.push('senior');
  if (/가성비|저렴|싼|cheap|budget|affordable/i.test(t)) special.push('cheap');
  if (/가까운|가까이|근처|near|close|편한|편리/i.test(t)) special.push('near');
  if (special.length) slots._special = special;

  const types = new Set();
  if (/비교|compare|\bvs\b|차이/i.test(t)) types.add('D');
  if (/예약|book|reserve|결제/i.test(t)) types.add('G');
  if (/가격|얼마|요금|재고|빈\s*방|price|cost|how much|엔|yen|예산|이하|총액/i.test(t)) types.add('C');
  if (/호텔|숙소|숙박|묵|hotel|accommodation|room|stay|추천해/i.test(t)) types.add('B');
  if (/일정|코스|itinerary|스케줄/i.test(t)) types.add('E');
  if (/어떻게\s*(?:가|이동)|가는\s*법|교통|지하철|전철|how (?:do|can|to)|get from|access|공항.*(?:에서|→|->)|에서.*공항/i.test(t)) types.add('F');
  if (/여행|관광|당일치기|날씨|맛집|식당|먹을|입장료|운영시간|weather|sightseeing|day trip|restaurant/i.test(t)) types.add('A');
  if (/카카오|공유|QR|전달|share|보내/i.test(t)) flags.share = true;

  return { raw: t, slots, types: [...types], ref: parseRef(t), flags };
}

module.exports = { parse, addDays, diffDays, LANDMARKS, iso };
