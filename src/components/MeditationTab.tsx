import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { QTEntry, UserProfile } from '../types'

interface Props {
  user: UserProfile
}

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${y}년 ${Number(m)}월 ${Number(d)}일 (${days[date.getDay()]})`
}

export default function MeditationTab({ user }: Props) {
  const [todayEntry, setTodayEntry] = useState<QTEntry | null | undefined>(undefined)
  const [entryLoading, setEntryLoading] = useState(true)

  // 작성/수정 폼 상태
  const [editing, setEditing] = useState(false)
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q2Public, setQ2Public] = useState(true)
  const [q3, setQ3] = useState('')
  const [q3Public, setQ3Public] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const today = getTodayString()

  useEffect(() => {
    async function checkTodayEntry() {
      setEntryLoading(true)
      try {
        const q = query(
          collection(db, 'qtEntries'),
          where('userId', '==', user.uid),
          where('date', '==', today)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          const data = snap.docs[0].data()
          setTodayEntry({ id: snap.docs[0].id, ...data } as QTEntry)
        } else {
          setTodayEntry(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setEntryLoading(false)
      }
    }
    checkTodayEntry()
  }, [user.uid, today])

  // 수정 모드 진입
  function startEditing() {
    if (!todayEntry) return
    setQ1(todayEntry.q1.text)
    setQ2(todayEntry.q2.text)
    setQ2Public(todayEntry.q2.isPublic)
    setQ3(todayEntry.q3.text)
    setQ3Public(todayEntry.q3.isPublic)
    setSubmitError('')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setSubmitError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q1.trim()) { setSubmitError('첫 번째 질문에 답해주세요'); return }
    setSubmitError('')
    setSubmitting(true)
    try {
      const payload = {
        q1: { text: q1.trim(), isPublic: true },
        q2: { text: q2.trim(), isPublic: q2Public },
        q3: { text: q3.trim(), isPublic: q3Public },
      }

      if (editing && todayEntry) {
        await updateDoc(doc(db, 'qtEntries', todayEntry.id), payload)
        setTodayEntry({ ...todayEntry, ...payload })
        setEditing(false)
      } else {
        const entry = {
          userId: user.uid,
          username: user.username,
          date: today,
          ...payload,
          submittedAt: serverTimestamp(),
        }
        const ref = await addDoc(collection(db, 'qtEntries'), entry)
        setTodayEntry({ id: ref.id, ...entry, submittedAt: Date.now() } as QTEntry)
      }
    } catch {
      setSubmitError('저장 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (entryLoading) {
    return (
      <div className="scroll-area" style={{ padding: '20px' }}>
        <div className="loading"><div className="spinner" /><span>불러오는 중...</span></div>
      </div>
    )
  }

  return (
    <div className="scroll-area" style={{ padding: '16px', paddingBottom: '24px' }}>
      {/* 오늘의 말씀 링크 */}
      <div style={{ marginBottom: '16px' }}>
        <div className="section-label">오늘의 말씀</div>
        <a
          href="https://sum.su.or.kr:8888/bible/today"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <div className="card" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>{formatDate(today)}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>청소년 매일성경</div>
              <div style={{ fontSize: '12px', opacity: 0.75 }}>sum.su.or.kr:8888/bible/today</div>
            </div>
            <div style={{ fontSize: '24px', opacity: 0.9, marginLeft: '12px' }}>↗</div>
          </div>
        </a>
      </div>

      {/* QT 작성/수정 폼 또는 완료 화면 */}
      {todayEntry && !editing ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div className="success-banner" style={{ margin: 0, flex: 1 }}>✅ 오늘의 QT를 완료했어요!</div>
            <button
              onClick={startEditing}
              style={{
                marginLeft: '10px', flexShrink: 0,
                padding: '8px 14px', background: 'var(--surface2)',
                border: 'none', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)',
              }}
            >
              ✏️ 수정
            </button>
          </div>

          <div className="section-label">내가 쓴 답변</div>

          <div className="question-card">
            <div className="question-text">
              <span className="question-number">1</span>
              오늘 QT를 마음을 다해 묵상했나요?
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{todayEntry.q1.text}</p>
          </div>

          {todayEntry.q2.text && (
            <div className="question-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="question-text" style={{ marginBottom: 0, flex: 1 }}>
                  <span className="question-number">2</span>
                  해석에 나와있는 질문에 대한 답은?
                </div>
                <span className={todayEntry.q2.isPublic ? 'chip chip-public' : 'chip chip-private'} style={{ flexShrink: 0, marginLeft: '8px' }}>
                  {todayEntry.q2.isPublic ? '🌍 공개' : '🔒 비공개'}
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{todayEntry.q2.text}</p>
            </div>
          )}

          {todayEntry.q3.text && (
            <div className="question-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="question-text" style={{ marginBottom: 0, flex: 1 }}>
                  <span className="question-number">3</span>
                  개인적으로 느낀점
                </div>
                <span className={todayEntry.q3.isPublic ? 'chip chip-public' : 'chip chip-private'} style={{ flexShrink: 0, marginLeft: '8px' }}>
                  {todayEntry.q3.isPublic ? '🌍 공개' : '🔒 비공개'}
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{todayEntry.q3.text}</p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="section-label" style={{ marginBottom: 0 }}>
              {editing ? '✏️ 답변 수정' : '오늘의 QT 작성'}
            </div>
            {editing && (
              <button type="button" onClick={cancelEditing}
                style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                취소
              </button>
            )}
          </div>

          {submitError && <div className="error-banner">{submitError}</div>}

          <div className="question-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="question-text" style={{ marginBottom: 0, flex: 1 }}>
                <span className="question-number">1</span>
                오늘 QT를 마음을 다해 묵상했나요?
              </div>
              <span className="chip chip-public" style={{ flexShrink: 0, marginLeft: '8px' }}>🌍 공개</span>
            </div>
            <textarea className="input" rows={3} placeholder="솔직하게 작성해봐요 :)"
              value={q1} onChange={e => setQ1(e.target.value)} />
          </div>

          <div className="question-card">
            <div className="question-text">
              <span className="question-number">2</span>
              해석에 나와있는 질문에 대한 답은?
            </div>
            <div className="privacy-toggle">
              <button type="button" className={`privacy-btn ${q2Public ? 'active-public' : ''}`}
                onClick={() => setQ2Public(true)}>🌍 공개</button>
              <button type="button" className={`privacy-btn ${!q2Public ? 'active-private' : ''}`}
                onClick={() => setQ2Public(false)}>🔒 비공개</button>
            </div>
            <textarea className="input" rows={4} placeholder="해석의 질문에 대한 답을 적어보세요"
              value={q2} onChange={e => setQ2(e.target.value)} />
          </div>

          <div className="question-card">
            <div className="question-text">
              <span className="question-number">3</span>
              묵상을 하며 개인적으로 느낀점이 있다면 자유롭게 적어주세요
            </div>
            <div className="privacy-toggle">
              <button type="button" className={`privacy-btn ${q3Public ? 'active-public' : ''}`}
                onClick={() => setQ3Public(true)}>🌍 공개</button>
              <button type="button" className={`privacy-btn ${!q3Public ? 'active-private' : ''}`}
                onClick={() => setQ3Public(false)}>🔒 비공개</button>
            </div>
            <textarea className="input" rows={5} placeholder="오늘 말씀을 통해 느낀 것, 결단한 것, 기도제목 등 자유롭게..."
              value={q3} onChange={e => setQ3(e.target.value)} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}
            style={{ opacity: submitting ? 0.7 : 1 }}>
            {submitting ? '저장 중...' : editing ? '✅ 수정 완료' : '✅ 오늘의 QT 완료!'}
          </button>
        </form>
      )}
    </div>
  )
}
