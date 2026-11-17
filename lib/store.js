'use strict';
// 상담 결과 저장소(JSON 파일). 운영에서는 같은 인터페이스로 DB 로 바꾼다.
// 저장하는 것: 조건, 추천 결과 카드, 가격 조회 시각, 동의 기록, 전달 이벤트.
// 저장하지 않는 것: 질문 원문, 이름, 연락처.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DELIVERY_CHANNELS = ['webshare', 'copy', 'email', 'file', 'print', 'qr'];

function createStore({ dir, retentionDays = 30, now = () => Date.now() }) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'consults.json');
  let rows = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(parsed)) rows = parsed;
  } catch (e) {
    rows = [];
  }
  const persist = () => {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(rows));
    fs.renameSync(tmp, file);
  };
  const purge = () => {
    const t = now();
    const before = rows.length;
    rows = rows.filter((r) => r.expiresAt > t);
    if (rows.length !== before) persist();
    return before - rows.length;
  };

  return {
    retentionDays,
    purge,
    create({ snap, consent, createdBy }) {
      purge();
      const t = now();
      const rec = {
        id: 'c_' + crypto.randomBytes(5).toString('hex'),
        token: crypto.randomBytes(16).toString('hex'),
        createdAt: t,
        expiresAt: t + retentionDays * 86400000,
        createdBy,
        consent,
        snap,
        deliveries: [],
      };
      rows.push(rec);
      persist();
      return rec;
    },
    getByToken(token) {
      purge();
      return rows.find((r) => r.token === token) || null;
    },
    get(id) {
      purge();
      return rows.find((r) => r.id === id) || null;
    },
    list() {
      purge();
      return rows.slice().sort((a, b) => b.createdAt - a.createdAt);
    },
    remove(id) {
      const n = rows.length;
      rows = rows.filter((r) => r.id !== id);
      if (rows.length !== n) persist();
      return rows.length !== n;
    },
    removeByToken(token) {
      const n = rows.length;
      rows = rows.filter((r) => r.token !== token);
      if (rows.length !== n) persist();
      return rows.length !== n;
    },
    // 전달 "이벤트" 기록. 사용자가 공유 버튼을 눌렀다는 뜻이며 실제 수신을 보장하지 않는다.
    addDelivery(token, channel) {
      if (!DELIVERY_CHANNELS.includes(channel)) return false;
      const rec = rows.find((r) => r.token === token);
      if (!rec || rec.expiresAt <= now()) return false;
      rec.deliveries.push({ channel, at: now() });
      persist();
      return true;
    },
  };
}

module.exports = { createStore, DELIVERY_CHANNELS };
