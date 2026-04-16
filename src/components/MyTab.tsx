import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'
import type { QTEntry, UserProfile } from '../types'

interface Props {
  user: UserProfile
}

function formatDateKo(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${y}.${m}.${d} (${days[date.getDay()]})`
}

function calculateStreak(entries: QTEntry[]): number {
  if (entries.length === 0) return 0
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  let streak = 0
  let current = new Date(todayStr)
  for (const date of dates) {
    const check = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
    if (date === check) { streak++; current.setDate(current.getDate() - 1) }
    else break
  }
  return streak
}

interface EditState {
  entry: QTEntry
  q1: string
  q2: string
  q2Public: boolean
  q3: string
  q3Public: boolean
  saving: boolean
  error: string
}

export default function MyTab({ user }: Props) {
  const [entries, setEntries] = useState<QTEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState<QTEntry | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'qtEntries'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as QTEntry)))
      } catch (e) {
        console.error('MyTab load error:', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.uid])

  function openDetail(entry: QTEntry) {
    setDetail(entry)
    setEditState(null)
  }

  function openEdit(entry: QTEntry) {
    setEditState({
      entry,
      q1: entry.q1.text,
      q2: entry.q2.text,
      q2Public: entry.q2.isPublic,
      q3: entry.q3.text,
      q3Public: entry.q3.isPublic,
      saving: false,
      error: '',
    })
    setDetail(null)
  }

  async function saveEdit() {
    if (!editState) return
    if (!editState.q1.trim()) {
      setEditState(s => s ? { ...s, error: '첫 번째 질문에 답해주세요' } : s)
      return
    }
    setEditState(s => s ? { ...s, saving: true, error: '' } : s)
    try {
      const payload = {
        q1: { text: editState.q1.trim(), isPublic: true },
        q2: { text: editState.q2.trim(), isPublic: editState.q2Public },
        q3: { text: editState.q3.trim(), isPublic: editState.q3Public },
      }
      await updateDoc(doc(db, 'qtEntries', editState.entry.id), payload)
      const updated = { ...editState.entry, ...payload }
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      setEditState(null)
    } catch {
      setEditState(s => s ? { ...s, saving: false, error: '저장 중 오류가 발생했어요' } : s)
    }
  }

  const streak = calculateStreak(entries)
  const total = entries.length

  if (loading) {
    return (
      <div className="scroll-area" style={{ padding: '20px' }}>
        <div className="loading"><div className="spinner" /><span>불러오는 중...</span></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="scroll-area" style={{ padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>⚠️ 기록을 불러오지 못했어요</p>
          <p style={{ fontSize: '13px' }}>잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="scroll-area" style={{ padding: '16px', paddingBottom: '24px' }}>
        {/* 프로필 */}
        <div className="card" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 700,
            }}>
              {user.username.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700 }}>{user.username}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>총 {total}일 묵상 완료</div>
            </div>
          </div>
          <button
            style={{ padding: '8px 14px', background: 'var(--surface2)', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={() => signOut(auth)}
          >
            로그아웃
          </button>
        </div>

        {/* 스트릭 */}
        <div className="streak-badge" style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '36px' }}>🔥</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="streak-count">{streak}</span>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>일</span>
            </div>
            <div className="streak-label">연속 묵상 중이에요!</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{total}</div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>총 묵상</div>
          </div>
        </div>

        {/* 기록 목록 */}
        <div className="section-label">나의 묵상 기록</div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <p className="empty-state-text">아직 묵상 기록이 없어요.<br />첫 QT를 작성해보세요!</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="my-entry-card" onClick={() => openDetail(entry)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="my-entry-date">{formatDateKo(entry.date)}</div>
                <button
                  onClick={e => { e.stopPropagation(); openEdit(entry) }}
                  style={{ padding: '4px 10px', background: 'var(--surface2)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}
                >
                  ✏️ 수정
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className="chip chip-public">Q1 공개</span>
                <span className={entry.q2.isPublic ? 'chip chip-public' : 'chip chip-private'}>
                  Q2 {entry.q2.isPublic ? '공개' : '비공개'}
                </span>
                <span className={entry.q3.isPublic ? 'chip chip-public' : 'chip chip-private'}>
                  Q3 {entry.q3.isPublic ? '공개' : '비공개'}
                </span>
              </div>
              {entry.q1.text && <div className="my-entry-preview">{entry.q1.text}</div>}
            </div>
          ))
        )}
      </div>

      {/* 상세 보기 모달 */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                {formatDateKo(detail.date)}
              </div>
              <button
                onClick={() => { openEdit(detail) }}
                style={{ padding: '6px 12px', background: 'var(--surface2)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✏️ 수정
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Q1. 오늘 QT를 마음을 다해 묵상했나요?
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7 }}>{detail.q1.text || '—'}</p>
            </div>

            <div className="divider" />

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Q2. 해석에 나와있는 질문에 대한 답은?</div>
                <span className={detail.q2.isPublic ? 'chip chip-public' : 'chip chip-private'}>{detail.q2.isPublic ? '공개' : '비공개'}</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7 }}>{detail.q2.text || '—'}</p>
            </div>

            <div className="divider" />

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Q3. 개인적으로 느낀점</div>
                <span className={detail.q3.isPublic ? 'chip chip-public' : 'chip chip-private'}>{detail.q3.isPublic ? '공개' : '비공개'}</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7 }}>{detail.q3.text || '—'}</p>
            </div>

            <button className="btn btn-secondary" onClick={() => setDetail(null)}>닫기</button>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editState && (
        <div className="modal-overlay" onClick={() => setEditState(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>✏️ 답변 수정</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDateKo(editState.entry.date)}</div>
            </div>

            {editState.error && <div className="error-banner">{editState.error}</div>}

            {/* Q1 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Q1. 마음을 다해 묵상했나요?</div>
                <span className="chip chip-public" style={{ fontSize: '11px' }}>🌍 공개</span>
              </div>
              <textarea className="input" rows={3}
                value={editState.q1}
                onChange={e => setEditState(s => s ? { ...s, q1: e.target.value } : s)}
              />
            </div>

            {/* Q2 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Q2. 해석 질문 답변</div>
              <div className="privacy-toggle" style={{ marginBottom: '8px' }}>
                <button type="button" className={`privacy-btn ${editState.q2Public ? 'active-public' : ''}`}
                  onClick={() => setEditState(s => s ? { ...s, q2Public: true } : s)}>🌍 공개</button>
                <button type="button" className={`privacy-btn ${!editState.q2Public ? 'active-private' : ''}`}
                  onClick={() => setEditState(s => s ? { ...s, q2Public: false } : s)}>🔒 비공개</button>
              </div>
              <textarea className="input" rows={4}
                value={editState.q2}
                onChange={e => setEditState(s => s ? { ...s, q2: e.target.value } : s)}
              />
            </div>

            {/* Q3 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Q3. 개인적으로 느낀점</div>
              <div className="privacy-toggle" style={{ marginBottom: '8px' }}>
                <button type="button" className={`privacy-btn ${editState.q3Public ? 'active-public' : ''}`}
                  onClick={() => setEditState(s => s ? { ...s, q3Public: true } : s)}>🌍 공개</button>
                <button type="button" className={`privacy-btn ${!editState.q3Public ? 'active-private' : ''}`}
                  onClick={() => setEditState(s => s ? { ...s, q3Public: false } : s)}>🔒 비공개</button>
              </div>
              <textarea className="input" rows={5}
                value={editState.q3}
                onChange={e => setEditState(s => s ? { ...s, q3: e.target.value } : s)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setEditState(null)} style={{ flex: 1 }}>
                취소
              </button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={editState.saving}
                style={{ flex: 2, opacity: editState.saving ? 0.7 : 1 }}>
                {editState.saving ? '저장 중...' : '✅ 수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
