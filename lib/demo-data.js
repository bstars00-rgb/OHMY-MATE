'use strict';
// DEMO 전용 가상 데이터. 실제 호텔·가격·재고가 아니다.
// _cost, _margin, _supplier 는 "내부 필드가 응답에 새지 않는지" 테스트하기 위한 가짜 값이다.

const STATIONS = {
  namba: {
    names: ['난바', 'namba', '難波', 'なんば', '难波', 'nanba'],
    label: { ko: '난바역', en: 'Namba Station' },
    city: 'osaka',
    lat: 34.6659,
    lng: 135.5013,
    ambiguous: true, // 난카이·오사카메트로·킨테츠/한신(오사카난바)로 나뉜다
  },
  umeda: {
    names: ['우메다', 'umeda', '梅田', '오사카역', 'osaka station'],
    label: { ko: '우메다(오사카역)', en: 'Umeda (Osaka Station)' },
    city: 'osaka',
    lat: 34.7055,
    lng: 135.4983,
    ambiguous: false,
  },
  tennoji: {
    names: ['덴노지', 'tennoji', '天王寺'],
    label: { ko: '덴노지역', en: 'Tennoji Station' },
    city: 'osaka',
    lat: 34.6459,
    lng: 135.5139,
    ambiguous: false,
  },
};

const CITIES = {
  osaka: { names: ['오사카', 'osaka', '大阪'], label: { ko: '오사카', en: 'Osaka' }, demo: true },
  kyoto: { names: ['교토', 'kyoto', '京都'], label: { ko: '교토', en: 'Kyoto' }, demo: false },
  tokyo: { names: ['도쿄', '동경', 'tokyo', '東京'], label: { ko: '도쿄', en: 'Tokyo' }, demo: false },
};

const H = (o) => Object.assign({ city: 'osaka', mapped: true, soldOutDates: [], weekendUpliftPct: 0, contract: '3rd-party', taxIncluded: true }, o);

const HOTELS = [
  H({
    id: 'D001', b2cHotelId: 'DEMO-B2C-001',
    name: { ko: '[DEMO] 난바 버짓 인', en: '[DEMO] Namba Budget Inn' },
    star: 2.5, lat: 34.6668, lng: 135.5025, address: 'DEMO 주소 (실제 아님)',
    rate: 8800, breakfast: 'none', maxOcc: 2, beds: ['twin', 'double'],
    amenities: ['wifi', 'elevator', 'laundry'], cancel: { freeUntilDaysBefore: 3 },
    _cost: 6200, _margin: 2600, _supplier: 'SUP-X',
  }),
  H({
    id: 'D002', b2cHotelId: 'DEMO-B2C-002',
    name: { ko: '[DEMO] 도톤보리 스테이', en: '[DEMO] Dotonbori Stay' },
    star: 3.0, lat: 34.6685, lng: 135.5018, address: 'DEMO 주소 (실제 아님)',
    rate: 11200, breakfast: 'optional', breakfastPrice: 1000, maxOcc: 3, beds: ['twin', 'double'],
    amenities: ['wifi', 'elevator', 'luggage'], cancel: { freeUntilDaysBefore: 2 },
    weekendUpliftPct: 20, contract: 'direct',
    _cost: 8000, _margin: 3200, _supplier: 'SUP-Y',
  }),
  H({
    id: 'D003', b2cHotelId: 'DEMO-B2C-003',
    name: { ko: '[DEMO] 센니치마에 비즈니스', en: '[DEMO] Sennichimae Business' },
    star: 3.0, lat: 34.6650, lng: 135.5040, address: 'DEMO 주소 (실제 아님)',
    rate: 9900, breakfast: 'included', maxOcc: 2, beds: ['twin'],
    amenities: ['wifi', 'elevator', 'breakfast'], cancel: { freeUntilDaysBefore: 0 },
    _cost: 7000, _margin: 2900, _supplier: 'SUP-Z',
  }),
  H({
    id: 'D004', b2cHotelId: 'DEMO-B2C-004',
    name: { ko: '[DEMO] 난바 패밀리 스위트', en: '[DEMO] Namba Family Suites' },
    star: 3.5, lat: 34.6672, lng: 135.4990, address: 'DEMO 주소 (실제 아님)',
    rate: 18500, breakfast: 'included', maxOcc: 4, beds: ['twin', 'double', 'triple'],
    amenities: ['wifi', 'elevator', 'breakfast', 'laundry', 'family-room'], cancel: { freeUntilDaysBefore: 5 },
    weekendUpliftPct: 15, contract: 'direct',
    _cost: 14000, _margin: 4500, _supplier: 'SUP-X',
  }),
  H({
    id: 'D005', b2cHotelId: 'DEMO-B2C-005',
    name: { ko: '[DEMO] 신사이바시 가든', en: '[DEMO] Shinsaibashi Garden' },
    star: 3.5, lat: 34.6745, lng: 135.5010, address: 'DEMO 주소 (실제 아님)',
    rate: 13800, breakfast: 'included', maxOcc: 3, beds: ['twin', 'double'],
    amenities: ['wifi', 'elevator', 'breakfast', 'spa'], cancel: { freeUntilDaysBefore: 3 },
    _cost: 10200, _margin: 3600, _supplier: 'SUP-Y',
  }),
  H({
    id: 'D006', b2cHotelId: 'DEMO-B2C-006',
    name: { ko: '[DEMO] 난바 만실 호텔', en: '[DEMO] Namba Sold-out Hotel' },
    star: 3.0, lat: 34.6662, lng: 135.5020, address: 'DEMO 주소 (실제 아님)',
    rate: 7000, breakfast: 'none', maxOcc: 2, beds: ['twin'],
    amenities: ['wifi'], cancel: { freeUntilDaysBefore: 1 },
    soldOutDates: ['2026-11-25', '2026-11-26', '2026-11-27'],
    _cost: 5000, _margin: 2000, _supplier: 'SUP-Z',
  }),
  H({
    id: 'D007', b2cHotelId: 'DEMO-B2C-007',
    name: { ko: '[DEMO] 덴노지 밸류 호텔', en: '[DEMO] Tennoji Value Hotel' },
    star: 3.0, lat: 34.6462, lng: 135.5136, address: 'DEMO 주소 (실제 아님)',
    rate: 7800, breakfast: 'none', maxOcc: 3, beds: ['twin', 'double'],
    amenities: ['wifi', 'elevator'], cancel: { freeUntilDaysBefore: 2 },
    _cost: 5600, _margin: 2200, _supplier: 'SUP-X',
  }),
  H({
    id: 'D008', b2cHotelId: 'DEMO-B2C-008',
    name: { ko: '[DEMO] 우메다 센트럴', en: '[DEMO] Umeda Central' },
    star: 4.0, lat: 34.7058, lng: 135.4990, address: 'DEMO 주소 (실제 아님)',
    rate: 15200, breakfast: 'optional', breakfastPrice: 1500, maxOcc: 3, beds: ['twin', 'double'],
    amenities: ['wifi', 'elevator', 'gym', 'spa'], cancel: { freeUntilDaysBefore: 3 },
    _cost: 11500, _margin: 3700, _supplier: 'SUP-Y',
  }),
  H({
    id: 'D009', b2cHotelId: null, mapped: false,
    name: { ko: '[DEMO] 난바 매핑오류 호텔', en: '[DEMO] Namba Unmapped Hotel' },
    star: 3.0, lat: 34.6664, lng: 135.5011, address: 'DEMO 주소 (실제 아님)',
    rate: 6500, breakfast: 'none', maxOcc: 2, beds: ['twin'],
    amenities: ['wifi'], cancel: { freeUntilDaysBefore: 1 },
    _cost: 4800, _margin: 1700, _supplier: 'SUP-Z',
  }),
  H({
    id: 'D010', b2cHotelId: 'DEMO-B2C-010',
    name: { ko: '[DEMO] 교토역 호텔', en: '[DEMO] Kyoto Station Hotel' },
    city: 'kyoto', star: 3.0, lat: 34.9858, lng: 135.7588, address: 'DEMO 주소 (실제 아님)',
    rate: 9500, breakfast: 'none', maxOcc: 2, beds: ['twin'],
    amenities: ['wifi'], cancel: { freeUntilDaysBefore: 2 },
    _cost: 7000, _margin: 2500, _supplier: 'SUP-X',
  }),
];

module.exports = { STATIONS, CITIES, HOTELS };
