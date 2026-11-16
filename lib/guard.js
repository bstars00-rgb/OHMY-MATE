'use strict';
// 입력 방어(프롬프트 인젝션·내부정보 요청·개인정보)와 출력 방어(내부 필드 제거)

const INJECTION = [
  /ignore (?:all |any )?(?:previous|prior|above) (?:instructions|rules|prompt)/i,
  /이전\s*(?:지시|명령|규칙|프롬프트)(?:를|을)?\s*(?:무시|잊)/,
  /시스템\s*프롬프트/,
  /system\s*prompt/i,
  /developer\s*mode|개발자\s*모드|jailbreak|탈옥/i,
  /you are now|지금부터\s*너는|지금부터 당신은/i,
  /reveal (?:your|the) (?:instructions|prompt|rules)/i,
];

const INTERNAL = [
  /원가|매입가|공급가|공급사\s*(?:정산|가격|단가)|정산가|마진|수수료율?|크레딧\s*한도|커미션/,
  /net\s*(?:rate|price)|cost price|supplier (?:price|cost)|margin|commission|markup/i,
  /\b_cost\b|\b_margin\b|\b_supplier\b/,
];

const OTHER_CUSTOMER = [
  /다른\s*(?:고객|손님)(?:의|이)?\s*(?:상담|예약|이름|연락처|정보)/,
  /(?:other|another) (?:customer|guest)'?s? (?:booking|reservation|name|phone|email|info)/i,
  /예약자\s*(?:명단|목록|이름|연락처)/,
];

function checkInput(text) {
  const s = String(text || '');
  if (INJECTION.some((r) => r.test(s))) return { blocked: true, reason: 'injection' };
  if (INTERNAL.some((r) => r.test(s))) return { blocked: true, reason: 'internal-info' };
  if (OTHER_CUSTOMER.some((r) => r.test(s))) return { blocked: true, reason: 'other-customer' };
  return { blocked: false };
}

const PII = [
  { name: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { name: 'phone', re: /(?:\+?\d{1,3}[-\s]?)?0?\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}/g },
  { name: 'card', re: /\b(?:\d[ -]?){13,19}\b/g },
  { name: 'passport', re: /\b[A-Z]{1,2}\d{7,8}\b/g },
];

function maskPII(text) {
  let out = String(text || '');
  const found = [];
  for (const p of PII) {
    if (p.re.test(out)) {
      found.push(p.name);
      out = out.replace(p.re, '[개인정보 삭제]');
    }
    p.re.lastIndex = 0;
  }
  return { text: out, found };
}

// 응답에 허용된 필드만 통과시킨다(화이트리스트). _로 시작하는 키, cost/margin/supplier 류는 어디에 있든 제거.
const FORBIDDEN_KEY = /^_|cost|margin|supplier|commission|netrate|markup|credit|settle/i;

function deepStrip(v) {
  if (Array.isArray(v)) return v.map(deepStrip);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      if (FORBIDDEN_KEY.test(k)) continue;
      o[k] = deepStrip(x);
    }
    return o;
  }
  return v;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { checkInput, maskPII, deepStrip, escapeHtml };
