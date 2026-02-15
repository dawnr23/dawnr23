# 영단어 플래피버드

> **초등학생용 교과 영단어 학습 게임** — 플래피버드를 플레이하며 영단어를 자연스럽게 익힙니다.

**[게임 바로 플레이하기](https://dawnr23.seongsu.workers.dev/)**

---

## 이 프로젝트는 100% Claude Code로 만들어졌습니다

이 프로젝트는 **한 줄의 코드도 직접 작성하지 않고**, [Claude Code](https://claude.ai/claude-code)(Anthropic의 AI 코딩 에이전트)에게 **자연어 지시만으로** 처음부터 끝까지 구현되었습니다.

### 실제 개발 과정

| 단계 | 사람이 한 것 | Claude Code가 한 것 |
|------|-------------|-------------------|
| 프로젝트 셋업 | "플래피버드 영단어 게임 만들어줘" | Cloudflare Workers 프로젝트 생성, HTML/CSS/JS 스캐폴딩 |
| 게임 엔진 | "파이프 통과하면 퀴즈 나오게" | Canvas API 기반 물리엔진, 충돌 감지, 게임 루프 구현 |
| 문제풀 연동 | "알공 API에서 문제 가져와" | Azure Blob Storage 인증 프록시 Worker 구현 |
| 폴백 데이터 | "API 안 되면 내장 데이터 써" | 3~6학년 교과 영단어 내장 데이터 + 자동 전환 로직 |
| 난이도 조절 | "너무 어려워, 쉽게 해줘" | 등속 낙하, HP 3목숨, 점프력 조정, 문제 수 8개 제한 |
| HP 시스템 | "오답 1회 즉사 말고 3번 기회줘" | HP 상태관리, UI 표시, 감소 시 빨간 플래시 + 흔들림 이펙트 |
| 충돌 개선 | "기둥에 닿으면 바로 죽어버려" | 기둥 충돌 시 HP -1 + 반발력으로 대응 시간 확보 |
| 퀴즈 타이밍 | "기둥 사이 중간에서 문제 내줘" | 파이프 간 중간지점 계산 로직 |
| 완주 이펙트 | "클리어하면 축하 이펙트" | 녹색 그라데이션 + 바운스 이모지 애니메이션 |
| 버그 수정 | "화면이 안 보여" | 캔버스 레이아웃 타이밍 버그 진단 및 수정 |
| 테스트 | "제대로 되는지 확인해" | Playwright 스모크 테스트 작성 + 스크린샷 검증 |
| 배포 | "클라우드플레어에 올려줘" | Git push + Cloudflare Workers 배포 |

### 핵심 포인트

- **코드 작성 0줄**: 모든 코드는 Claude Code가 생성, 수정, 디버깅
- **대화형 개발**: "이거 해줘" → 결과 확인 → "이 부분 고쳐줘" 반복
- **즉각적인 반복**: 요구사항 변경 시 즉시 코드 수정 + 테스트 + 배포
- **사용 모델**: Claude Opus 4.6 (claude-opus-4-6)

> **팀원분들에게**: Claude Code는 자연어로 지시하면 프로젝트 셋업부터 배포까지 전 과정을 처리합니다. 코드를 읽고 이해하는 능력이 있다면, AI에게 명확한 지시를 주는 것만으로 실제 서비스 수준의 결과물을 만들 수 있습니다.

---

## 주요 기능

### 게임플레이
- **플래피버드 조작**: 스페이스바 / 화면 터치로 새를 점프
- **영단어 퀴즈**: 파이프 사이 중간지점에서 4지선다 퀴즈 출제
- **HP 시스템**: 하트 3개, 오답 또는 기둥 충돌 시 -1
- **등속 낙하**: 초등학생도 플레이할 수 있는 부드러운 난이도
- **완주 이펙트**: 8문제 모두 정답 시 축하 애니메이션

### 학습 콘텐츠
- **학년 선택**: 3~6학년 초등 교과 영어
- **9개 출판사**: 동아출판, 대교, 천재교육, YBM, 미래엔, 아이스크림 등
- **단원별 문제**: 교과서 커리큘럼에 맞는 영단어
- **폴백 데이터**: API 연결 불가 시 내장 문제풀 자동 전환

### 시각 피드백
- **HP 감소 이펙트**: 빨간 화면 플래시 + 하트 흔들림 애니메이션
- **정답/오답 표시**: 퀴즈 버튼 색상 변경 (초록/빨강)
- **기둥 반발력**: 아래 기둥 충돌 시 강하게 튕겨올림 (대응 시간 확보)

---

## 기술 스택

| 구분 | 기술 | 설명 |
|------|------|------|
| Frontend | Vanilla HTML/CSS/JS | Canvas API 기반 게임 렌더링, 프레임워크 없음 |
| Backend | Cloudflare Workers | Azure Blob Storage 인증 프록시 |
| 문제풀 | Azure Blob Storage | 알공(ARGong) 교과 영단어 데이터 |
| 배포 | Cloudflare Workers | Git 연동 자동 배포 (main 브랜치) |
| 테스트 | Playwright | 스모크 테스트 + 스크린샷 검증 |

---

## 프로젝트 구조

```
dawnr23/
├── README.md                   # 프로젝트 문서 (이 파일)
├── wrangler.toml               # Cloudflare Workers 설정
├── package.json                # 개발 의존성 (Playwright, Wrangler)
├── src/
│   └── worker.js               # Worker: Azure Blob 인증 프록시 + 정적 파일 서빙
├── public/                     # 정적 프론트엔드 파일
│   ├── index.html              # 메인 HTML (시작/게임/게임오버 3화면 구조)
│   ├── styles.css              # 전체 UI 스타일 + 애니메이션
│   ├── app.js                  # 앱 컨트롤러 (화면 전환, 퀴즈 UI, HP 표시)
│   ├── game.js                 # 게임 엔진 (물리, 충돌, 파이프, 퀴즈 트리거)
│   ├── api.js                  # 알공 API 클라이언트 + 폴백 전환
│   └── fallback-data.js        # 오프라인용 내장 문제풀 (3~6학년)
└── tests/
    ├── smoke-test.js           # Playwright 스모크 테스트
    └── screenshots/            # 테스트 스크린샷 출력
```

---

## 아키텍처 상세

### 데이터 흐름

```
[알공 Azure Blob Storage]
        │
        │  SharedKey 인증 (HMAC-SHA256)
        ▼
[Cloudflare Worker - src/worker.js]
        │
        │  GET /api/questions/:publisher/:grade/:lesson
        ▼
[api.js]  ──실패시──▶  [fallback-data.js]
        │
        │  category==="word" && except!==1 필터링
        │  { english, korean } 형식 변환
        ▼
[game.js - FlappyBirdGame]
        │
        │  셔플 → 8문제 선택 → 파이프 통과마다 퀴즈 출제
        ▼
[app.js - 퀴즈 UI + HP 관리]
```

### 게임 엔진 (game.js) 핵심 로직

| 시스템 | 구현 |
|--------|------|
| **물리** | 등속 낙하 (`fallSpeed=3`에 수렴), 점프력 `-5` |
| **파이프** | `pipeSpacing=440` 간격 자동 생성, 랜덤 높이 |
| **충돌** | AABB 히트박스 (5px 여유), 기둥은 물리적 벽으로 작동 |
| **HP** | `maxHp=3`, 기둥 충돌/오답 시 -1, 0이면 gameOver |
| **반발력** | 아래 기둥: `jumpForce*1.5`로 튕김, 위 기둥: `velocity=2`로 밀어냄 |
| **퀴즈 트리거** | 파이프 사이 중간지점 (`midGapX`) 도달 시 출제 |
| **충돌 데미지** | `hitDamaged` 플래그로 같은 파이프에서 1회만 감점 |

### 화면 구조 (index.html)

```
#app
├── #start-screen     시작 화면 (학년/출판사/단원 선택)
├── #game-screen      게임 화면
│   ├── .game-header  점수 | HP(❤️❤️❤️) | 남은 단어
│   ├── #game-canvas  Canvas 게임 렌더링
│   ├── #damage-flash 피격 시 빨간 플래시 오버레이
│   └── #quiz-modal   퀴즈 모달 (4지선다)
└── #gameover-screen  게임오버/클리어 화면
    ├── #clear-effect 클리어 시 🎉🏆🎉 바운스
    ├── 최종 점수/통계
    └── 다시하기/처음으로 버튼
```

### Worker 프록시 (src/worker.js)

- Azure Blob Storage에 SharedKey 인증으로 접근
- HMAC-SHA256 서명 생성 (`x-ms-date`, `Authorization` 헤더)
- `/api/questions/:publisher/:grade/:lesson` 엔드포인트 제공
- 정적 파일은 Cloudflare Assets로 서빙

---

## 문제풀 데이터

### Blob 경로 규칙

```
컨테이너: questionpool-jsons
Blob 경로: activity/{출판사코드}-{학년}-{단원}.json

예시: activity/DK-3-1.json → 동아출판 3학년 1단원
```

### 지원 출판사

| 코드 | 출판사 | 코드 | 출판사 |
|------|--------|------|--------|
| DK | 동아출판 | MN | 미래엔 |
| DA | 대교 | CJL | 천재교육 (이재근) |
| CJ | 천재교육 | CJK | 천재교육 (함) |
| YBMC | YBM (최희경) | IC | 아이스크림 |
| YBMK | YBM (김혜리) | | |

### 문제 데이터 형식

```json
{
  "ID": 1,
  "content": "hello",
  "kor": "안녕",
  "category": "word",
  "Topic": "Greetings",
  "img": "hello.png",
  "audio": "hello.mp3",
  "except": 0
}
```

게임에서는 `category === "word"` 이고 `except !== 1`인 항목만 사용합니다.

---

## 로컬 실행

### 사전 요구사항

- [Node.js](https://nodejs.org/) v18 이상

### 설치 및 실행

```bash
git clone https://github.com/dawnr23/dawnr23.git
cd dawnr23
npm install
npx wrangler dev
```

`http://localhost:8787` 에서 게임이 실행됩니다.

> API 접근 불가 시 `fallback-data.js`의 내장 문제풀로 자동 전환됩니다.

### 테스트 실행

```bash
# wrangler dev 실행 중인 상태에서
node tests/smoke-test.js
```

`tests/screenshots/` 폴더에 각 단계별 스크린샷이 저장됩니다.

---

## 배포

### 자동 배포 (현재 설정)

GitHub `main` 브랜치에 push하면 Cloudflare Workers가 자동으로 빌드 및 배포합니다.

```
git push origin main  →  Cloudflare 자동 빌드  →  https://dawnr23.seongsu.workers.dev/
```

### 수동 배포

```bash
npx wrangler login
npx wrangler deploy
```

---

## 게임 밸런스 설정 (game.js)

현재 초등학생 대상으로 조정된 값입니다. `FlappyBirdGame` 생성 시 `options`로 오버라이드 가능합니다.

| 설정 | 값 | 설명 |
|------|----|------|
| `gravity` | 0.5 | 중력 가속도 |
| `jumpForce` | -5 | 점프력 (음수 = 위로) |
| `fallSpeed` | 3 | 최대 낙하 속도 (등속 수렴) |
| `pipeSpeed` | 2 | 파이프 이동 속도 |
| `pipeGap` | 180 | 파이프 상하 간격 (px) |
| `pipeSpacing` | 440 | 파이프 좌우 간격 (px) |
| `maxHp` | 3 | 최대 HP |
| 문제 수 | 8 | 전체 풀에서 랜덤 선택 |

---

## 라이선스

이 프로젝트는 내부 교육용 프로토타입입니다. 문제풀 데이터의 저작권은 [알공(ARGong)](https://www.argong.ai)에 있습니다.
