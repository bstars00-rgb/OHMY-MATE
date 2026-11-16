'use strict';
// ELLIS / B2C 연동 경계. 엔진은 이 인터페이스만 안다.
// demo: 가상 데이터. live: 고객가 API가 준비되기 전까지 항상 실패한다(가짜 값을 만들지 않는다).
const { HOTELS } = require('./demo-data');
const { addDays, diffDays } = require('./intent');

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function createDemoAdapter() {
  return {
    mode: 'demo',
    async searchHotels({ city }) {
      return HOTELS.filter((h) => h.city === city).map(clone);
    },
    async getHotel(id) {
      const h = HOTELS.find((x) => x.id === id);
      return h ? clone(h) : null;
    },
    // 객실 1개 기준 1박 요금 목록과 판매 가능 여부
    async getStay(hotel, { checkIn, checkOut }) {
      const nights = diffDays(checkIn, checkOut);
      const list = [];
      let soldOut = false;
      for (let i = 0; i < nights; i += 1) {
        const date = addDays(checkIn, i);
        if (hotel.soldOutDates.includes(date)) soldOut = true;
        const [y, m, d] = date.split('-').map(Number);
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        const up = dow === 5 || dow === 6 ? 1 + (hotel.weekendUpliftPct || 0) / 100 : 1;
        list.push({ date, price: Math.round((hotel.rate * up) / 100) * 100 });
      }
      return { soldOut, nights, nightly: list, taxIncluded: hotel.taxIncluded, currency: 'JPY' };
    },
  };
}

function createLiveAdapter() {
  const fail = async () => {
    const e = new Error('LIVE_NOT_CONFIGURED');
    e.code = 'LIVE_NOT_CONFIGURED';
    throw e;
  };
  return { mode: 'live', searchHotels: fail, getHotel: fail, getStay: fail };
}

function createAdapter(mode) {
  return mode === 'live' ? createLiveAdapter() : createDemoAdapter();
}

module.exports = { createAdapter, createDemoAdapter, createLiveAdapter };
