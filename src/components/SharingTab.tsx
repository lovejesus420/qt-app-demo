import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, orderBy, limit, getDocs,
  addDoc, serverTimestamp, where
} from 'firebase/firestore'
import { db } from '../firebase'
import type { QTEntry, Comment, UserProfile } from '../types'

interface Props {
  user: UserProfile
}

interface EntryWithComments extends QTEntry {
  comments: Comment[]
  showComments: boolean
  commentInput: string
}

function formatDateKo(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${y}.${m}.${d} (${days[date.getDay()]})`
}

function Avatar({ name }: { name: string }) {
  return <div className="comment-avatar">{name.charAt(0)}</div>
}

export default function SharingTab({ user }: Props) {
  const [entries, setEntries] = useState<EntryWithComments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      // date 기준 정렬 (자동 인덱스 사용, submittedAt 복합 인덱스 불필요)
      const q = query(
        collection(db, 'qtEntries'),
        orderBy('date', 'desc'),
        limit(50)
      )
      const snap = await getDocs(q)
      const rawEntries = snap.docs.map(d => ({ id: d.id, ...d.data() } as QTEntry))

      // 공개 내용이 하나라도 있는 항목만 포함
      const publicEntries = rawEntries.filter(e =>
        e.q1.text || (e.q2.isPublic && e.q2.text) || (e.q3.isPublic && e.q3.text)
      )

      const withComments: EntryWithComments[] = await Promise.all(
        publicEntries.map(async (entry) => {
          try {
            const cq = query(
              collection(db, 'comments'),
              where('entryId', '==', entry.id),
              orderBy('createdAt', 'asc')
            )
            const cSnap = await getDocs(cq)
            const comments = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))
            return { ...entry, comments, showComments: false, commentInput: '' }
          } catch {
            return { ...entry, comments: [], showComments: false, commentInput: '' }
          }
        })
      )
      setEntries(withComments)
    } catch (e) {
      console.error('SharingTab load error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  function toggleComments(entryId: string) {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, showComments: !e.showComments } : e
    ))
  }

  function setCommentInput(entryId: string, value: string) {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, commentInput: value } : e
    ))
  }

  async function submitComment(entry: EntryWithComments) {
    const text = entry.commentInput.trim()
    if (!text) return
    setSubmittingComment(entry.id)
    try {
      const comment = {
        entryId: entry.id,
        userId: user.uid,
        username: user.username,
        text,
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'comments'), comment)
      const newComment: Comment = { id: ref.id, ...comment, createdAt: Date.now() }
      setEntries(prev => prev.map(e =>
        e.id === entry.id
          ? { ...e, comments: [...e.comments, newComment], commentInput: '' }
          : e
      ))
    } finally {
      setSubmittingComment(null)
    }
  }

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
          <p style={{ marginBottom: '8px' }}>⚠️ 나눔을 불러오지 못했어요</p>
          <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={loadEntries}>다시 시도</button>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="scroll-area" style={{ padding: '20px' }}>
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <p className="empty-state-text">아직 나눔이 없어요.<br />첫 번째 QT를 작성하고 나눠보세요!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scroll-area" style={{ padding: '16px', paddingBottom: '24px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>친구들의 나눔</div>
        <button
          style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          onClick={loadEntries}
        >
          새로고침
        </button>
      </div>

      {entries.map(entry => (
        <div key={entry.id} className="entry-card">
          {/* 헤더: 이름 + 날짜 */}
          <div className="entry-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={entry.username} />
              <div>
                <div className="entry-username">{entry.username}</div>
                <div className="entry-date">{formatDateKo(entry.date)}</div>
              </div>
            </div>
          </div>

          {/* Q1 — 항상 공개 */}
          {entry.q1.text && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span className="entry-answer-label">Q1. 마음을 다해 묵상했나요?</span>
                <span className="chip chip-public" style={{ fontSize: '11px', padding: '2px 8px' }}>공개</span>
              </div>
              <p className="entry-answer-text">{entry.q1.text}</p>
            </div>
          )}

          {/* Q2 — 공개인 경우만 */}
          {entry.q2.isPublic && entry.q2.text && (
            <div style={{ marginBottom: '12px' }}>
              <div className="entry-answer-label">Q2. 해석 질문 답변</div>
              <p className="entry-answer-text">{entry.q2.text}</p>
            </div>
          )}

          {/* Q3 — 공개인 경우만 */}
          {entry.q3.isPublic && entry.q3.text && (
            <div style={{ marginBottom: '12px' }}>
              <div className="entry-answer-label">Q3. 개인적 느낀점</div>
              <p className="entry-answer-text">{entry.q3.text}</p>
            </div>
          )}

          {/* 댓글 */}
          <div className="comments-section">
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600,
                marginBottom: entry.showComments ? '12px' : 0,
              }}
              onClick={() => toggleComments(entry.id)}
            >
              💬 답글 {entry.comments.length > 0 ? `${entry.comments.length}개` : '달기'}
              {entry.showComments ? ' ▲' : ' ▼'}
            </button>

            {entry.showComments && (
              <>
                {entry.comments.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    첫 번째 답글을 달아봐요 :)
                  </p>
                )}
                {entry.comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <Avatar name={c.username} />
                    <div className="comment-bubble">
                      <div className="comment-username">{c.username}</div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  </div>
                ))}
                <div className="comment-input-row">
                  <input
                    className="input"
                    type="text"
                    placeholder="따뜻한 한 마디..."
                    value={entry.commentInput}
                    onChange={e => setCommentInput(entry.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitComment(entry) }}
                  />
                  <button
                    className="comment-submit-btn"
                    onClick={() => submitComment(entry)}
                    disabled={submittingComment === entry.id}
                  >
                    {submittingComment === entry.id ? '...' : '전송'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
