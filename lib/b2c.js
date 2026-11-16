'use strict';
// B2C 링크는 검증된 템플릿(환경변수)과 허용 호스트가 모두 있을 때만 만든다. 그렇지 않으면 null.
const config = require('./config');

function buildB2CUrl(hotel, slots, clickId, cfg = config) {
  const tpl = cfg.b2cUrlTemplate;
  if (!tpl || !hotel || !hotel.mapped || !hotel.b2cHotelId) return null;
  if (!slots.checkIn || !slots.checkOut || !slots.adults) return null;
  const vals = {
    hotelId: hotel.b2cHotelId,
    checkIn: slots.checkIn,
    checkOut: slots.checkOut,
    adults: slots.adults,
    children: slots.children || 0,
    rooms: slots.rooms || 1,
    clickId,
  };
  const url = tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vals ? encodeURIComponent(String(vals[k])) : ''));
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (!cfg.b2cAllowedHosts.includes(u.hostname)) return null;
  return u.toString();
}

module.exports = { buildB2CUrl };
