'use strict';
// 상담 결과 저장 동의 문구. 문구가 바뀌면 VERSION 을 올려 어떤 문구에 동의했는지 기록에 남긴다.
// 체크박스는 기본 해제 상태로 두고, 저장 목적을 구체적으로 적는다(막연한 "마케팅 동의" 표현 금지).
const VERSION = '2026-11-v1';

function text(lang, days) {
  return lang === 'en'
    ? `I agree that the consultation result (search conditions, recommended hotels, prices and the time they were checked) is stored for ${days} days so it can be sent to me and reopened. My name and contact details are not stored. I can delete it at any time. This is not marketing consent.`
    : `상담 결과(검색 조건, 추천 호텔, 가격과 조회 시각)를 ${days}일간 저장해 제게 전달하고 다시 열어 보는 데 동의합니다. 이름·연락처는 저장하지 않으며 언제든 삭제할 수 있습니다. 마케팅 수신 동의가 아닙니다.`;
}

module.exports = { VERSION, text };
