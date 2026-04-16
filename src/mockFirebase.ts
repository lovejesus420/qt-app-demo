
import type { UserProfile, QTEntry, Comment } from './types'

/**
 * 데모 모드용 가상 Firebase 서비스
 * 모든 데이터를 브라우저의 localStorage에 저장하여 서버 없이도 기능이 작동하도록 합니다.
 */

const STORAGE_KEYS = {
  USER: 'qt_demo_user',
  ENTRIES: 'qt_demo_entries',
  COMMENTS: 'qt_demo_comments'
}

// 초기 데이터 (나눔 탭이 비어 보이지 않게 하기 위함)
const INITIAL_ENTRIES: QTEntry[] = [
  {
    id: 'demo-1',
    userId: 'user-2',
    username: '김하늘',
    date: new Date().toISOString().split('T')[0],
    q1: { text: '오늘 말씀이 정말 위로가 되었어요.', isPublic: true },
    q2: { text: '하나님은 우리를 결코 포기하지 않으시는 분임을 깨달았습니다.', isPublic: true },
    q3: { text: '학업 때문에 힘들었는데 다시 힘을 얻네요!', isPublic: true },
    submittedAt: Date.now() - 3600000
  },
  {
    id: 'demo-2',
    userId: 'user-3',
    username: '이루다',
    date: new Date().toISOString().split('T')[0],
    q1: { text: '마음을 다해 묵상했습니다!', isPublic: true },
    q2: { text: '작은 일에도 감사하는 마음을 가져야겠어요.', isPublic: true },
    q3: { text: '친구들에게 더 친절하게 대하기로 결단했습니다.', isPublic: true },
    submittedAt: Date.now() - 7200000
  }
]

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'c-1',
    entryId: 'demo-1',
    userId: 'user-3',
    username: '이루다',
    text: '하늘님 힘내세요! 기도할게요 :)',
    createdAt: Date.now() - 1800000
  }
]

// LocalStorage 헬퍼
const storage = {
  get: <T>(key: string, fallback: T): T => {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

// --- Mock Auth ---
export const mockAuth = {
  currentUser: storage.get<UserProfile | null>(STORAGE_KEYS.USER, null),
  onAuthStateChanged: (authOrCallback: any, maybeCallback?: (user: any) => void) => {
    // 실제 Firebase처럼 (auth, callback) 형태로도, (callback) 형태로도 호출 가능
    const callback = typeof authOrCallback === 'function' ? authOrCallback : maybeCallback!
    const user = storage.get<UserProfile | null>(STORAGE_KEYS.USER, null)
    // 데모 모드에서는 접속 즉시 익명 사용자로 로그인된 것처럼 처리
    if (!user) {
      const demoUser: UserProfile = {
        uid: 'demo-user-123',
        username: '데모 사용자',
        createdAt: Date.now(),
        isAdmin: false
      }
      storage.set(STORAGE_KEYS.USER, demoUser)
      setTimeout(() => callback(demoUser), 500)
    } else {
      setTimeout(() => callback(user), 500)
    }
    return () => {}
  },
  signOut: async () => {
    localStorage.removeItem(STORAGE_KEYS.USER)
    window.location.reload()
  }
}

// --- Mock Firestore ---
export const mockDb = {
  // 실제 Firestore API와 유사하게 구현
  collection: (name: string) => name,
  
  // 데이터 가져오기 (SharingTab용)
  getDocs: async (q: any) => {
    if (q.collectionName === 'qtEntries') {
      const entries = storage.get<QTEntry[]>(STORAGE_KEYS.ENTRIES, INITIAL_ENTRIES)
      return {
        docs: entries
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(e => ({ id: e.id, data: () => e }))
      }
    }
    if (q.collectionName === 'comments') {
      const comments = storage.get<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS)
      return {
        docs: comments
          .filter(c => c.entryId === q.entryId)
          .map(c => ({ id: c.id, data: () => c }))
      }
    }
    return { docs: [] }
  },

  // 단일 문서 가져오기 (MeditationTab용)
  getDoc: async (docRef: any) => {
    if (docRef.collectionName === 'users') {
      return { exists: () => true, data: () => storage.get(STORAGE_KEYS.USER, {}) }
    }
    return { exists: () => false }
  },

  // 데이터 추가
  addDoc: async (collectionName: string, data: any) => {
    const id = Math.random().toString(36).substring(7)
    if (collectionName === 'qtEntries') {
      const entries = storage.get<QTEntry[]>(STORAGE_KEYS.ENTRIES, INITIAL_ENTRIES)
      const newEntry = { id, ...data, submittedAt: Date.now() }
      storage.set(STORAGE_KEYS.ENTRIES, [newEntry, ...entries])
      return { id }
    }
    if (collectionName === 'comments') {
      const comments = storage.get<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS)
      const newComment = { id, ...data, createdAt: Date.now() }
      storage.set(STORAGE_KEYS.COMMENTS, [...comments, newComment])
      return { id }
    }
    return { id }
  },

  // 데이터 수정
  updateDoc: async (docRef: any, data: any) => {
    if (docRef.collectionName === 'qtEntries') {
      const entries = storage.get<QTEntry[]>(STORAGE_KEYS.ENTRIES, INITIAL_ENTRIES)
      const updated = entries.map(e => e.id === docRef.id ? { ...e, ...data } : e)
      storage.set(STORAGE_KEYS.ENTRIES, updated)
    }
  }
}

// Firestore Query Mock Helpers
export const query = (col: any, ...constraints: any[]) => {
  const q: any = { collectionName: col }
  constraints.forEach(c => {
    if (c.type === 'where' && c.field === 'entryId') q.entryId = c.value
    if (c.type === 'where' && c.field === 'userId') q.userId = c.value
    if (c.type === 'where' && c.field === 'date') q.date = c.value
  })
  return q
}
export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value })
export const orderBy = (field: string, dir: string) => ({ type: 'orderBy', field, dir })
export const limit = (n: number) => ({ type: 'limit', n })
export const doc = (db: any, col: string, id: string) => ({ collectionName: col, id })
export const collection = (db: any, name: string) => name
export const serverTimestamp = () => Date.now()
