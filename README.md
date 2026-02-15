# 영단어 플래피버드

초등학교 영단어 학습용 플래피버드 게임의 바이브코딩 프로토타입입니다.

플래피버드 게임을 플레이하면서 파이프를 통과할 때마다 영단어 퀴즈가 출제되고, 정답을 맞히면 점수를 획득하며 게임이 계속됩니다. 틀리거나 장애물에 부딪히면 게임이 종료됩니다.

## 주요 기능

- **학년/교과서/단원 선택** — 3~6학년, 9개 교과서 출판사, 단원별 문제풀 지원
- **플래피버드 게임플레이** — 스페이스바 또는 터치로 새를 조작하며 파이프 통과
- **영단어 퀴즈** — 파이프 통과 시 영어 단어가 출제되고, 4지선다로 한국어 뜻을 선택
- **폴백 데이터** — API 연결 실패 시 내장된 기본 문제풀로 게임 진행 가능

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Vanilla HTML/CSS/JavaScript (Canvas API) |
| Backend | Cloudflare Workers |
| 문제풀 저장소 | Azure Blob Storage |
| 배포 | Cloudflare (Wrangler CLI) |

## 프로젝트 구조

```
├── wrangler.toml          # Cloudflare Workers 설정
├── src/
│   └── worker.js          # Worker 프록시 (Azure Blob → API 엔드포인트)
└── public/
    ├── index.html          # 메인 HTML (시작/게임/게임오버 화면)
    ├── styles.css          # UI 스타일
    ├── app.js              # 앱 초기화 및 화면 전환 로직
    ├── api.js              # 알공 문제풀 API 클라이언트
    ├── game.js             # 플래피버드 게임 엔진 (Canvas)
    └── fallback-data.js    # 오프라인용 기본 문제풀 데이터
```

## 문제풀 데이터 구조

문제풀 데이터는 [알공](https://www.argong.ai) 서비스에서 관리하는 Azure Blob Storage에 등록되어 있습니다.

### 데이터 흐름

```
[알공 Azure Blob Storage]
        │
        │  SharedKey 인증
        ▼
[Cloudflare Worker (src/worker.js)]   ← 프록시 역할
        │
        │  /api/questions/:publisher/:grade/:lesson
        ▼
[Frontend (api.js)]
        │
        │  word 카테고리 필터링 → 게임 포맷 변환
        ▼
[게임 엔진 (game.js)]
```

### Blob 경로 규칙

```
컨테이너: questionpool-jsons (베트남 출판사는 questionpool-jsons-vn)
Blob 경로: activity/{출판사코드}-{학년}-{단원}.json

예시: activity/DK-3-1.json → 동아출판 3학년 1단원
```

### 지원 출판사

| 코드 | 출판사 |
|------|--------|
| DK | 동아출판 |
| DA | 대교 |
| CJ | 천재교육 |
| YBMC | YBM (최영준) |
| YBMK | YBM (김혜리) |
| MN | 미래엔 |
| CJL | 천재교육 (이재근) |
| CJK | 천재교육 (함) |
| IC | 아이스크림 |

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

게임에서는 `category === "word"` 이고 `except !== 1`인 항목만 필터링하여 사용합니다.

## 로컬 실행

### 사전 요구사항

- [Node.js](https://nodejs.org/) (v18 이상)

### 설치 및 실행

```bash
# 레포 클론
git clone https://github.com/dawnr23/dawnr23.git
cd dawnr23

# 의존성 설치
npm install wrangler --save-dev

# 로컬 개발 서버 실행
npx wrangler dev
```

`http://localhost:8787` 에서 게임이 실행됩니다.

> **참고:** 로컬 실행 시에도 Worker가 Azure Blob Storage에 접근하여 문제풀을 가져옵니다. API 접근이 불가능한 환경에서는 `fallback-data.js`에 내장된 기본 문제풀로 자동 전환됩니다.

## 배포

```bash
# Cloudflare 로그인
npx wrangler login

# 프로덕션 배포
npx wrangler deploy
```

## 게임 플레이 방법

1. 학년, 교과서(출판사), 단원을 선택
2. **게임 시작** 버튼 클릭
3. **스페이스바** 또는 **화면 터치**로 새를 위로 점프
4. 파이프 사이를 통과하면 영단어 퀴즈 출제
5. 올바른 한국어 뜻을 선택하면 +10점, 게임 계속
6. 오답 선택 또는 장애물 충돌 시 게임 종료
7. 모든 단어를 맞히면 스테이지 클리어
