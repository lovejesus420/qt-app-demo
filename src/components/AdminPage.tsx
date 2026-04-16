import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

import { db, auth, _signOut as signOut } from '../firebase'
import type { UserProfile, QTEntry } from '../types'

interface MemberRow {
  user: UserProfile
  entries: QTEntry[]
  expanded: boolean
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['??, '??, '??, '??, 'ëª?, 'ê¸?, '??]
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${Number(m)}/${Number(d)}(${days[date.getDay()]})`
}

function formatFullDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['??, '??, '??, '??, 'ëª?, 'ê¸?, '??]
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${y}??${Number(m)}??${Number(d)}??(${days[date.getDay()]})`
}

export default function AdminPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<QTEntry | null>(null)

  useEffect(() => {
    async function load() {
      // 1. ?„ì²´ ?¬ìš©??ê°€?¸ì˜¤ê¸?(ê´€ë¦¬ì ?œì™¸)
      const usersSnap = await getDocs(collection(db, 'users'))
      const users: UserProfile[] = usersSnap.docs
        .map((d) => d.data() as UserProfile)
        .filter((u) => !u.isAdmin)

      // 2. ê°??¬ìš©?ì˜ QT ê¸°ë¡ ê°€?¸ì˜¤ê¸?      const rows: MemberRow[] = await Promise.all(
        users.map(async (user) => {
          const q = query(
            collection(db, 'qtEntries'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
          )
          const snap = await getDocs(q)
          const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QTEntry))
          return { user, entries, expanded: false }
        })
      )

      // ?´ë¦„ ???•ë ¬
      rows.sort((a, b) => a.user.username.localeCompare(b.user.username, 'ko'))
      setMembers(rows)
      setLoading(false)
    }
    load()
  }, [])

  function toggleExpand(uid: string) {
    setMembers((prev) =>
      prev.map((row) => (row.user.uid === uid ? { ...row, expanded: !row.expanded } : row))
    )
  }

  const totalEntries = members.reduce((sum, m) => sum + m.entries.length, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="header-title">?› ï¸?ê´€ë¦¬ì ?˜ì´ì§€</div>
          </div>
          <button
            onClick={() => signOut(auth)}
            style={{
              fontSize: '13px', color: 'var(--text-muted)', background: 'none',
              border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
            }}
          >
            ë¡œê·¸?„ì›ƒ
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="scroll-area" style={{ padding: '16px', paddingBottom: '24px' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /><span>ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span></div>
        ) : (
          <>
            {/* ?”ì•½ ì¹´ë“œ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{members.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>?„ì²´ ?Œì›</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{totalEntries}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>ì´?QT ê¸°ë¡</div>
              </div>
            </div>

            {/* ?Œì› ëª©ë¡ */}
            <div className="section-label">?Œì› ëª©ë¡</div>
            {members.length === 0 && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                ?±ë¡???Œì›???†ì–´??              </div>
            )}
            {members.map((row) => (
              <div key={row.user.uid} className="card" style={{ marginBottom: '10px', padding: 0, overflow: 'hidden' }}>
                {/* ?Œì› ?¤ë” */}
                <button
                  onClick={() => toggleExpand(row.user.uid)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '14px 16px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '16px', fontWeight: 700,
                    }}>
                      {row.user.username[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                        {row.user.username}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        QT {row.entries.length}???„ë£Œ
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '18px', transition: 'transform 0.2s', transform: row.expanded ? 'rotate(180deg)' : 'none' }}>
                    ??                  </div>
                </button>

                {/* QT ê¸°ë¡ ëª©ë¡ */}
                {row.expanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {row.entries.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        ?„ì§ ?‘ì„±??QTê°€ ?†ì–´??                      </div>
                    ) : (
                      row.entries.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', padding: '12px 16px',
                            background: selectedEntry?.id === entry.id ? 'rgba(99,102,241,0.06)' : 'none',
                            border: 'none', borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                              {formatDate(entry.date)}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.q1.text || '(?´ìš© ?†ìŒ)'}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}>
                            {selectedEntry?.id === entry.id ? '?«ê¸°' : 'ë³´ê¸°'}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ?ì„¸ ?µë? ëª¨ë‹¬ */}
      {selectedEntry && (
        <div
          onClick={() => setSelectedEntry(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '20px 16px 40px', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            {/* ?¸ë“¤ */}
            <div style={{ width: '40px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 16px' }} />

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {members.find((m) => m.entries.some((e) => e.id === selectedEntry.id))?.user.username}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              {formatFullDate(selectedEntry.date)} QT
            </div>

            {/* Q1 */}
            <div className="question-card" style={{ marginBottom: '10px' }}>
              <div className="question-text">
                <span className="question-number">1</span>
                ?¤ëŠ˜ QTë¥?ë§ˆìŒ???¤í•´ ë¬µìƒ?ˆë‚˜??
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{selectedEntry.q1.text || '(ë¯¸ì‘??'}</p>
            </div>

            {/* Q2 */}
            {selectedEntry.q2.text && (
              <div className="question-card" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div className="question-text" style={{ marginBottom: 0, flex: 1 }}>
                    <span className="question-number">2</span>
                    ?´ì„???˜ì??ˆëŠ” ì§ˆë¬¸???€???µì??
                  </div>
                  <span className={selectedEntry.q2.isPublic ? 'chip chip-public' : 'chip chip-private'} style={{ flexShrink: 0, marginLeft: '8px' }}>
                    {selectedEntry.q2.isPublic ? '?Œ ê³µê°œ' : '?”’ ë¹„ê³µê°?}
                  </span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{selectedEntry.q2.text}</p>
              </div>
            )}

            {/* Q3 */}
            {selectedEntry.q3.text && (
              <div className="question-card" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div className="question-text" style={{ marginBottom: 0, flex: 1 }}>
                    <span className="question-number">3</span>
                    ê°œì¸?ìœ¼ë¡??ë???                  </div>
                  <span className={selectedEntry.q3.isPublic ? 'chip chip-public' : 'chip chip-private'} style={{ flexShrink: 0, marginLeft: '8px' }}>
                    {selectedEntry.q3.isPublic ? '?Œ ê³µê°œ' : '?”’ ë¹„ê³µê°?}
                  </span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{selectedEntry.q3.text}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedEntry(null)}
              className="btn"
              style={{ width: '100%', marginTop: '8px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              ?«ê¸°
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
