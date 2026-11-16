# OHMY MATE

여행 박람회 상담용 AI 호텔 상담 프로토타입. 현재는 **DEMO 데이터 모드**입니다. 화면의 호텔·가격은 가상이며 예약할 수 없습니다.

## 실행

```bash
node server.js                      # http://localhost:3000
node tests/run.js                   # 자동 테스트 78개
node scripts/build-standalone.js    # dist/OHMY-MATE-demo.html (서버 없이 열리는 단일 파일)
```

`main`에 push하면 GitHub Actions가 테스트를 돌리고 단일 HTML 데모를 GitHub Pages에 배포합니다.
단일 HTML 데모에는 직원 모드와 QR이 없고, 공유는 결과 페이지를 HTML 파일로 저장하는 방식입니다.

## 설정(서버 모드)

- 직원 모드: `OMM_STAFF_PINS=agent:1234,manager:5678 node server.js`
- B2C 링크: 규격이 확정되면 `OMM_B2C_URL_TEMPLATE`, `OMM_B2C_ALLOWED_HOSTS`로 설정합니다. 비어 있으면 링크를 만들지 않습니다.
- 실데이터 연동은 `lib/adapter.js`의 live 구현으로 합니다(고객가 API 준비 후).
