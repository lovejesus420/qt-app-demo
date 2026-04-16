import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { 
  getFirestore, collection, query, where, getDocs, 
  addDoc, updateDoc, doc, serverTimestamp, orderBy, limit, getDoc 
} from 'firebase/firestore'
import * as mock from './mockFirebase'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId
const app = hasConfig ? initializeApp(firebaseConfig) : null

export const auth = (isDemoMode || !app) ? (mock.mockAuth as any) : getAuth(app!)
export const db = (isDemoMode || !app) ? (mock.mockDb as any) : getFirestore(app!)

// 로그인 관련 함수 래핑
export const _onAuthStateChanged = (isDemoMode || !app) 
  ? (mock.mockAuth.onAuthStateChanged as any) 
  : (onAuthStateChanged as any)
export const _signOut = (isDemoMode || !app) 
  ? (mock.mockAuth.signOut as any) 
  : (signOut as any)

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
