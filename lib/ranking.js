'use strict';
// 추천 점수 100점: 예산 30 · 위치 25 · 객실 20 · 품질 15 · 선호 10
// 평가 불가 항목은 null 로 두고 평가된 가중치로 재정규화한다. completeness 로 데이터 완전성을 함께 낸다.
const W = { budget: 30, location: 25, room: 20, quality: 15, pref: 10 };
const clamp = (n) => Math.max(0, Math.min(100, n));

function scoreBudget(c) {
  if (c.price == null) return null;
  if (c.budgetNight) {
    const r = c.maxNight / c.budgetNight;
    return r <= 0.6 ? 100 : clamp(100 - ((r - 0.6) / 0.4) * 40);
  }
  if (c.budgetTotal) {
    const r = c.total / c.budgetTotal;
    return r <= 0.6 ? 100 : clamp(100 - ((r - 0.6) / 0.4) * 40);
  }
  if (c.priceRange && c.priceRange.max > c.priceRange.min) {
    return 50 + (50 * (c.priceRange.max - c.total)) / (c.priceRange.max - c.priceRange.min);
  }
  return 75;
}

function scoreLocation(c) {
  if (c.walkMin == null) return null;
  if (c.walkMin <= 3) return 100;
  if (c.walkMin <= 5) return 90;
  if (c.walkMin <= 10) return 70;
  if (c.walkMin <= 15) return 50;
  return 30;
}

function scoreRoom(c) {
  if (c.guests == null) return null;
  const spare = c.capacity - c.guests;
  let s = spare === 0 ? 85 : spare === 1 ? 80 : 70;
  if (c.wantBreakfast && c.breakfast === 'included') s += 10;
  if (c.special.includes('senior') && c.amenities.includes('elevator')) s += 10;
  if (c.children && c.amenities.includes('family-room')) s += 10;
  if (c.bedMatch) s += 5;
  return clamp(s);
}

function scoreQuality(c) {
  return clamp((c.star / 5) * 80 + c.amenities.length * 4);
}

function scorePref(c) {
  const prefs = [];
  if (c.special.includes('cheap') && c.price != null) prefs.push(c.cheapRank);
  if (c.special.includes('near') && c.walkMin != null) prefs.push(c.walkMin <= 5 ? 100 : c.walkMin <= 10 ? 70 : 40);
  if (c.wantBreakfast) prefs.push(c.breakfast === 'included' ? 100 : c.breakfast === 'optional' ? 60 : 0);
  if (c.special.includes('senior')) prefs.push(c.amenities.includes('elevator') ? 100 : 30);
  if (!prefs.length) return null;
  return prefs.reduce((a, b) => a + b, 0) / prefs.length;
}

function score(c) {
  const parts = {
    budget: scoreBudget(c),
    location: scoreLocation(c),
    room: scoreRoom(c),
    quality: scoreQuality(c),
    pref: scorePref(c),
  };
  let num = 0;
  let den = 0;
  for (const k of Object.keys(W)) {
    if (parts[k] != null) {
      num += parts[k] * W[k];
      den += W[k];
    }
  }
  return {
    total: den ? Math.round((num / den) * 10) / 10 : null,
    completeness: den,
    parts,
    unevaluated: Object.keys(W).filter((k) => parts[k] == null),
  };
}

// 동점(1점 이내)이면 직계약 호텔을 우선하되, 고객 총액이 5% 넘게 비싸면 우대하지 않는다.
function compare(a, b) {
  if (a.fit.score == null || b.fit.score == null) return (b.fit.score || 0) - (a.fit.score || 0);
  const d = b.fit.score - a.fit.score;
  if (Math.abs(d) >= 1) return d;
  const pa = a._total;
  const pb = b._total;
  const ad = a._contract === 'direct';
  const bd = b._contract === 'direct';
  if (ad !== bd) {
    const direct = ad ? pa : pb;
    const other = ad ? pb : pa;
    if (direct == null || other == null || direct <= other * 1.05) return ad ? -1 : 1;
  }
  return d;
}

module.exports = { score, compare, W };
