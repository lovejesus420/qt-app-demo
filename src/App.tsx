import { useState, useEffect } from 'react'
import { auth, db, _onAuthStateChanged as onAuthStateChanged } from './firebase'
import Auth from './components/Auth'
import TabBar from './components/TabBar'
import MeditationTab from './components/MeditationTab'
import SharingTab from './components/SharingTab'
import MyTab from './components/MyTab'
import AdminPage from './components/AdminPage'
import type { UserProfile } from './types'

type Tab = 'meditation' | 'sharing' | 'my'

export default function App() {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<Tab>('meditation')

  useEffect(() => {
    // 데모 모드에서는 firebase.ts에서 래핑된 onAuthStateChanged가 가짜 유저를 반환합니다.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          username: firebaseUser.username || '데모 사용자',
          createdAt: Date.now(),
          isAdmin: firebaseUser.isAdmin === true,
        })
      } else {
        setUser(null)
      }
    })
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])

  if (user === undefined) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6366f1', color: '#fff' }}>
        🕊️ 불러오는 중...
      </div>
    )
  }

  if (!user) return <Auth />
  if (user.isAdmin) return <AdminPage />

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="header-title">
            {activeTab === 'meditation' ? '🕊️ 오늘의 묵상' : activeTab === 'sharing' ? '💬 나눔' : '👤 마이페이지'}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: activeTab === 'meditation' ? 'block' : 'none', height: '100%' }}>
          <MeditationTab user={user} />
        </div>
        <div style={{ display: activeTab === 'sharing' ? 'block' : 'none', height: '100%' }}>
          <SharingTab user={user} />
        </div>
        <div style={{ display: activeTab === 'my' ? 'block' : 'none', height: '100%' }}>
          <MyTab user={user} />
        </div>
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
