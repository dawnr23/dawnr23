# CLAUDE.md - 프로젝트 컨텍스트

## 프로젝트 개요
- 초등학생용 영단어 플래피버드 학습 게임
- 100% Claude Code로 자연어 지시만으로 구현
- 라이브: https://dawnr23.seongsu.workers.dev/

## 기술 스택
- Frontend: Vanilla HTML/CSS/JS (Canvas API), 프레임워크 없음
- Backend: Cloudflare Workers (src/worker.js)
- 문제풀: Azure Blob Storage (알공 API) + fallback-data.js
- 배포: GitHub main push → Cloudflare 자동 빌드/배포
- 테스트: Playwright (tests/smoke-test.js)

## 프로젝트 경로
- 루트: C:\Users\dawnr\dawnr23
- 로컬 서버: `npx wrangler dev` → http://localhost:8787
- 스모크 테스트: `node tests/smoke-test.js` (wrangler dev 실행 중 필요)

## 주요 파일
| 파일 | 역할 |
|------|------|
| public/game.js | 게임 엔진 (물리, 충돌, HP, 퀴즈 트리거) |
| public/app.js | 앱 컨트롤러 (화면 전환, 퀴즈 UI, HP 표시, 이펙트) |
| public/index.html | 3화면 구조 (시작/게임/게임오버) |
| public/styles.css | UI 스타일 + 애니메이션 (HP 흔들림, 빨간 플래시, 바운스) |
| public/api.js | 알공 API 클라이언트 + 폴백 전환 |
| public/fallback-data.js | 오프라인용 내장 문제풀 (3~6학년) |
| src/worker.js | Azure Blob 인증 프록시 (SharedKey, 시크릿 하드코딩됨) |

## 현재 게임 밸런스
- gravity: 0.5, jumpForce: -5, fallSpeed: 3
- pipeSpeed: 2, pipeGap: 180, pipeSpacing: 440
- HP: 3목숨, 문제 수: 8개 (랜덤 선택)
- 아래 기둥 충돌 시 jumpForce*1.5 반발력

## 보안 주의
- src/worker.js에 Azure Access Key 하드코딩되어 있음
- 레포는 Private 유지, 팀원은 Collaborator 개별 초대

## 배포
- `git push origin main` → Cloudflare 자동 배포
- Production branch: main
- Workers URL: dawnr23.seongsu.workers.dev

## 개발 규칙
- 변경 후 항상 `node tests/smoke-test.js`로 스모크 테스트
- 콘솔 에러 0건 확인
- 스크린샷은 tests/screenshots/에 저장됨
