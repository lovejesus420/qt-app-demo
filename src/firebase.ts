import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { 
  getFirestore, collection, query, where, getDocs, 
  addDoc, updateDoc, doc, serverTimestamp, orderBy, limit, getDoc 
} from 'firebase/firestore'
import * as mock from './mockFirebase'

// 데모 모드 여부 확인 (환경 변수가 없거나 'true'일 경우 데모 모드 활성화 가능)
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// 실제 Firebase 초기화 (설정값이 있을 때만)
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId
const app = hasConfig ? initializeApp(firebaseConfig) : null

// 모드에 따라 내보낼 객체 결정
export const auth = (isDemoMode || !app) ? (mock.mockAuth as any) : getAuth(app!)
export const db = (isDemoMode || !app) ? (mock.mockDb as any) : getFirestore(app!)

// Firestore 함수들도 모드에 따라 내보냄
export const _collection = (isDemoMode || !app) ? mock.collection : collection
export const _query = (isDemoMode || !app) ? mock.query : query
export const _where = (isDemoMode || !app) ? mock.where : where
export const _getDocs = (isDemoMode || !app) ? (mock.mockDb.getDocs as any) : getDocs
export const _getDoc = (isDemoMode || !app) ? (mock.mockDb.getDoc as any) : getDoc
export const _addDoc = (isDemoMode || !app) ? (mock.mockDb.addDoc as any) : addDoc
export const _updateDoc = (isDemoMode || !app) ? (mock.mockDb.updateDoc as any) : updateDoc
export const _doc = (isDemoMode || !app) ? mock.doc : doc
export const _serverTimestamp = (isDemoMode || !app) ? mock.serverTimestamp : serverTimestamp
export const _orderBy = (isDemoMode || !app) ? mock.orderBy : orderBy
export const _limit = (isDemoMode || !app) ? mock.limit : limit

export { onAuthStateChanged, signOut }
