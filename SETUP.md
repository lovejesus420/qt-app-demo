# QT 묵상 앱 설정 가이드

## 1단계: Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `qt-church-app`)
4. Google Analytics는 선택사항 (비활성화 가능)

## 2단계: 웹 앱 등록

1. Firebase 콘솔 홈에서 **</> (웹)** 아이콘 클릭
2. 앱 닉네임 입력 후 등록
3. 표시된 `firebaseConfig` 값들을 복사해 `.env` 파일 생성:

```
# qt-app 폴더 안에 .env 파일 생성
VITE_FIREBASE_API_KEY=여기에_붙여넣기
VITE_FIREBASE_AUTH_DOMAIN=여기에_붙여넣기
VITE_FIREBASE_PROJECT_ID=여기에_붙여넣기
VITE_FIREBASE_STORAGE_BUCKET=여기에_붙여넣기
VITE_FIREBASE_MESSAGING_SENDER_ID=여기에_붙여넣기
VITE_FIREBASE_APP_ID=여기에_붙여넣기
```

## 3단계: Firebase 기능 활성화

### Authentication
1. 콘솔 왼쪽 메뉴 → **Authentication** → **시작하기**
2. **Sign-in method** 탭 → **이메일/비밀번호** 활성화

### Firestore Database
1. 콘솔 왼쪽 메뉴 → **Firestore Database** → **데이터베이스 만들기**
2. **테스트 모드로 시작** 선택 (나중에 규칙 적용)
3. 지역: `asia-northeast3 (서울)` 선택

### Firestore 보안 규칙 설정
1. Firestore → **규칙** 탭
2. `firestore.rules` 파일 내용을 복사해 붙여넣기
3. **게시** 클릭

## 4단계: 아이콘 만들기

1. `generate-icons.html` 파일을 브라우저에서 열기
2. **아이콘 생성 및 다운로드** 버튼 클릭
3. 다운로드된 `icon-192.png`, `icon-512.png`를 `public/icons/` 폴더에 넣기

## 5단계: 개발 서버 실행

```bash
cd qt-app
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 6단계: 배포 (Vercel 추천)

1. https://vercel.com 가입
2. GitHub에 코드 올리기 (또는 Vercel CLI 사용)
3. **New Project** → 폴더 선택
4. **Environment Variables**에 `.env` 값들 모두 입력
5. **Deploy** 클릭

### Vercel CLI로 배포
```bash
npm install -g vercel
vercel
```

## 7단계: 홈 화면에 추가

### 안드로이드 (Chrome)
1. 앱 URL을 Chrome에서 열기
2. 주소창 오른쪽 메뉴 (⋮) → **홈 화면에 추가**

### 아이폰 (Safari)
1. 앱 URL을 Safari에서 열기
2. 하단 공유 버튼 → **홈 화면에 추가**

---

## Firestore 인덱스 (필요시)

앱 실행 후 콘솔에 인덱스 오류가 뜨면, 오류 메시지의 링크를 클릭해 인덱스를 자동 생성할 수 있습니다.

필요한 인덱스:
- `qtEntries` 컬렉션: `userId ASC, submittedAt DESC`
- `comments` 컬렉션: `entryId ASC, createdAt ASC`
