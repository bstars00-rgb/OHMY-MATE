'use strict';
// 직선거리와 예상 도보시간. 경로 서비스가 없으므로 결과는 항상 "예상"이며 검증값이 아니다.
const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

function haversineM(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

// 직선거리에 도로 보정 1.3, 보행속도 80m/분을 적용한 추정치
function estimateWalkMin(straightM) {
  return Math.max(1, Math.round((straightM * 1.3) / 80));
}

module.exports = { haversineM, estimateWalkMin };
