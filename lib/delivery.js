'use strict';
// 상담 결과 전달 채널 목록. 지금 동작하는 것은 client 채널(고객이 자기 기기에서 누르는 방식)뿐이다.
// server 채널(알림톡·이메일·LINE·WhatsApp 등)은 계정·계약·심사가 필요해 연결하지 않았다.
const CHANNELS = [
  { id: 'webshare', type: 'client', ready: true, personalData: false, label: '기기 공유창 (카카오톡·LINE·WhatsApp 등)', note: '고객 휴대폰에서 공유 버튼 → 설치된 메신저 선택. 이름·연락처를 받지 않는다.' },
  { id: 'qr', type: 'client', ready: true, personalData: false, label: 'QR 코드', note: '태블릿 화면의 QR을 고객 휴대폰으로 스캔' },
  { id: 'copy', type: 'client', ready: true, personalData: false, label: '링크 복사', note: '' },
  { id: 'email', type: 'client', ready: true, personalData: false, label: '이메일 앱 열기 (mailto)', note: '메일 주소를 서버로 보내지 않는다.' },
  { id: 'file', type: 'client', ready: true, personalData: false, label: 'HTML 파일 저장', note: '' },
  { id: 'print', type: 'client', ready: true, personalData: false, label: '인쇄·PDF', note: '' },
  { id: 'kakao-share', type: 'client-sdk', ready: false, personalData: false, label: '카카오톡 공유하기 (JS SDK)', requires: ['카카오 디벨로퍼스 앱과 JavaScript 키', '서비스 도메인 등록'], note: '공유하는 사람의 카카오톡 친구에게 보내는 방식이라 고객 본인 휴대폰에서 눌러야 한다.' },
  { id: 'kakao-alimtalk', type: 'server', ready: false, personalData: true, label: '카카오 알림톡', requires: ['카카오톡 비즈니스 채널', '발송 대행사 계약', '템플릿 심사', '전화번호 수집 동의'], note: '정보성 메시지만 가능. 추천·예약 유도 문구는 광고성으로 판단될 수 있다.' },
  { id: 'kakao-brand', type: 'server', ready: false, personalData: true, label: '카카오 브랜드 메시지 (구 친구톡)', requires: ['비즈니스 채널', '발송 대행사 계약', '광고성 정보 수신 동의'], note: '친구톡은 2025-12-31 종료되어 브랜드 메시지로 대체됨.' },
  { id: 'email-server', type: 'server', ready: false, personalData: true, label: '이메일 발송', requires: ['발송 서비스(SMTP 등)', '이메일 수집 동의'], note: '' },
  { id: 'line', type: 'server', ready: false, personalData: true, label: 'LINE 공식 계정', requires: ['LINE 공식 계정', '고객이 계정을 친구 추가'], note: '일본·대만·태국 고객용' },
  { id: 'whatsapp', type: 'server', ready: false, personalData: true, label: 'WhatsApp Business', requires: ['WhatsApp Business 계정', '템플릿 승인', '수신 동의'], note: '동남아·해외 고객용' },
];

function listChannels() {
  return CHANNELS.map((c) => ({ ...c }));
}

module.exports = { listChannels };
