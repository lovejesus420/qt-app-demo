import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const ADMIN_USERNAME = '관리자'
const ADMIN_PASSWORD = '09840984'

// 한국어 이름 포함 모든 사용자명을 유효한 이메일로 변환
function usernameToEmail(username: string): string {
  const encoded = btoa(unescape(encodeURIComponent(username.trim())))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${encoded}@qt-church.app`
}

export async function signUp(username: string, password: string): Promise<void> {
  const trimmed = username.trim()
  if (!trimmed) throw new Error('이름을 입력해주세요')
  if (trimmed === ADMIN_USERNAME) throw new Error('사용할 수 없는 이름이에요')
  if (password.length < 6) throw new Error('비밀번호는 6자 이상이어야 해요')

  // 이미 사용 중인 이름인지 확인
  const usernameDoc = await getDoc(doc(db, 'usernames', trimmed))
  if (usernameDoc.exists()) throw new Error('이미 사용 중인 이름이에요')

  const email = usernameToEmail(trimmed)

  const userCred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(userCred.user, { displayName: trimmed })

  // Firestore에 사용자 정보 저장
  await setDoc(doc(db, 'usernames', trimmed), { uid: userCred.user.uid })
  await setDoc(doc(db, 'users', userCred.user.uid), {
    uid: userCred.user.uid,
    username: trimmed,
    createdAt: serverTimestamp(),
    isAdmin: false,
  })
}

/** 관리자 계정을 최초 1회 자동 생성 */
async function ensureAdminAccount(): Promise<void> {
  const email = usernameToEmail(ADMIN_USERNAME)
  try {
    // 계정 생성 시도 (이미 있으면 에러 발생 → 무시)
    const userCred = await createUserWithEmailAndPassword(auth, email, ADMIN_PASSWORD)
    await updateProfile(userCred.user, { displayName: ADMIN_USERNAME })
    await setDoc(doc(db, 'usernames', ADMIN_USERNAME), { uid: userCred.user.uid })
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      username: ADMIN_USERNAME,
      createdAt: serverTimestamp(),
      isAdmin: true,
    })
  } catch {
    // 이미 계정이 있는 경우 — 정상적으로 무시
  }
}

export async function signIn(username: string, password: string): Promise<void> {
  const trimmed = username.trim()
  if (!trimmed) throw new Error('이름을 입력해주세요')

  // 관리자 계정: 최초 로그인 시 자동 생성
  if (trimmed === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    await ensureAdminAccount()
  }

  const email = usernameToEmail(trimmed)
  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch {
    throw new Error('이름 또는 비밀번호가 맞지 않아요')
  }
}
