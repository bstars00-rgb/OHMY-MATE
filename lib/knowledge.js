'use strict';
// 일반 여행 정보(유형 A·E·F). 최신 정보 조회 도구가 없으므로 시간표·운임·운영시간은 확정하지 않는다.
const NOTE = {
  ko: '시간표·운임·운영시간은 바뀔 수 있고, 지금은 최신 정보를 조회할 도구가 연결되어 있지 않아 확정해서 말씀드리지 않았습니다. 공식 사이트에서 확인해 주세요.',
  en: 'Timetables, fares and opening hours change, and no live lookup tool is connected, so none are stated here. Please check the official sources.',
};

function answer(types, text, slots, lang) {
  const t = text.toLowerCase();
  const L = lang === 'en' ? 'en' : 'ko';
  const parts = [];
  const hit = (re) => re.test(t);

  if (hit(/교토|kyoto/) && hit(/당일|day trip|다녀/)) {
    parts.push(
      L === 'ko'
        ? '오사카에서 교토는 JR·한큐·게이한 등 여러 노선이 있어 당일 왕복이 가능한 거리로 알려져 있습니다. 소요시간과 운임은 노선과 열차 종류에 따라 다릅니다. 가고 싶은 곳과 출발 시각을 알려 주시면 이동 순서를 같이 짜겠습니다.'
        : 'Kyoto is commonly done as a day trip from Osaka by JR, Hankyu or Keihan lines. Travel time and fares depend on the line and train type. Tell me where you want to go and I can sketch the order.'
    );
  }
  if (types.includes('F') && (hit(/간사이공항|kix|kansai airport|공항/) && hit(/난바|namba/))) {
    parts.push(
      L === 'ko'
        ? '간사이공항에서 난바까지는 난카이 전철이 직접 연결합니다. 열차 종류(공항급행·특급 등)에 따라 요금과 시간이 다르고, 특급은 좌석 지정이 필요한 경우가 있습니다.'
        : 'Nankai Railway links Kansai Airport directly with Nankai Namba. Fare and time depend on the train type, and limited express services may need a seat reservation.'
    );
  } else if (types.includes('F')) {
    parts.push(
      L === 'ko'
        ? '출발지와 도착지, 이동 시각을 알려 주시면 이용할 만한 노선 종류를 안내하겠습니다.'
        : 'Tell me the origin, destination and time and I will outline the route options.'
    );
  }
  if (types.includes('E')) {
    const mother = slots._special && slots._special.includes('senior');
    parts.push(
      L === 'ko'
        ? `일반적인 제안입니다(운영시간 미확인).${mother ? ' 어머님과 함께라 이동을 줄이는 쪽으로 잡았습니다.' : ''}\n1일차: 도착 후 호텔 체크인, 난바·도톤보리 가볍게 산책\n2일차: 오사카성 방문 후 우메다 쇼핑 (또는 교토 당일 이동)\n3일차: 아침 식사 후 쇼핑, 공항 이동\n원하시는 관심사와 걷는 시간을 알려 주시면 맞춰 고치겠습니다.`
        : `A general suggestion (opening hours unchecked).\nDay 1: arrive, check in, easy walk around Namba and Dotonbori\nDay 2: Osaka Castle, then Umeda shopping (or a Kyoto day trip)\nDay 3: breakfast, shopping, airport transfer\nTell me your interests and how much walking suits you and I will adjust.`
    );
  }
  // 호텔 검색과 함께 온 "여행" 단어만으로는 일반 안내문을 붙이지 않는다.
  if (types.includes('A') && !parts.length && !types.some((x) => x === 'B' || x === 'C')) {
    parts.push(
      L === 'ko'
        ? '어떤 지역과 시기를 생각하시는지 알려 주시면 그에 맞춰 안내하겠습니다.'
        : 'Tell me the area and season and I will tailor the answer.'
    );
  }
  if (!parts.length) return null;
  return { text: parts.join('\n\n'), notice: NOTE[L] };
}

module.exports = { answer, NOTE };
