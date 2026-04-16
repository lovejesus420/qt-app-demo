import { useState, useEffect } from 'react'

import { doc, getDoc } from 'firebase/firestore'
import { auth, db, _onAuthStateChanged as onAuthStateChanged } from './firebase'
import Auth from './components/Auth'
import TabBar from './components/TabBar'
import MeditationTab from './components/MeditationTab'
import SharingTab from './components/SharingTab'
import MyTab from './components/MyTab'
import AdminPage from './components/AdminPage'
import type { UserProfile } from './types'

type Tab = 'meditation' | 'sharing' | 'my'

const TAB_LABELS: Record<Tab, string> = {
  meditation: 'ë¬µìƒ',
  sharing: '?˜ëˆ”',
  my: 'MY',
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<Tab>('meditation')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            username: userDoc.data().username,
            createdAt: userDoc.data().createdAt?.seconds * 1000 || Date.now(),
            isAdmin: userDoc.data().isAdmin === true,
          })
        } else {
          // Fallback: use displayName
          setUser({
            uid: firebaseUser.uid,
            username: firebaseUser.displayName || '?¬ìš©??,
            createdAt: Date.now(),
          })
        }
      } else {
        setUser(null)
      }
    })
    return unsubscribe
  }, [])

  // Loading
  if (user === undefined) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #6366f1 0%, #8b5cf6 100%)',
        flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '30px',
        }}>?•Šï¸?/div>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!user) return <Auth />

  // ê´€ë¦¬ì ?„ìš© ?˜ì´ì§€
  if (user.isAdmin) return <AdminPage />

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="header-title">
              {activeTab === 'meditation' ? '?•Šï¸??¤ëŠ˜??ë¬µìƒ' : activeTab === 'sharing' ? '?’¬ ?˜ëˆ”' : `?‘¤ ${user.username}`}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: activeTab === 'meditation' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <MeditationTab user={user} />
        </div>
        <div style={{ display: activeTab === 'sharing' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <SharingTab user={user} />
        </div>
        <div style={{ display: activeTab === 'my' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <MyTab user={user} />
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
