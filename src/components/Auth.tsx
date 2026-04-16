import { useState } from 'react'
import { signIn, signUp } from '../utils/auth'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(username, password)
      } else {
        await signIn(username, password)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo area */}
      <div style={{ textAlign: 'center', marginBottom: '32px', color: '#fff' }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          margin: '0 auto 16px',
          backdropFilter: 'blur(10px)',
        }}>
          🕊️
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>QT 묵상</h1>
        <p style={{ fontSize: '14px', opacity: 0.85, marginTop: '6px' }}>
          오늘도 말씀 안에서 하루를 시작해요
        </p>
      </div>

      {/* Form card */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: '#fff',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div className="input-label">이름</div>
            <input
              className="input"
              type="text"
              placeholder="예: 홍길동"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <div className="input-label">비밀번호</div>
            <input
              className="input"
              type="password"
              placeholder={mode === 'signup' ? '6자 이상' : '비밀번호 입력'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ marginTop: '4px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '잠시만요...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            className="btn-ghost btn"
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
          >
            {mode === 'login' ? '아직 계정이 없어요 → 회원가입' : '이미 계정이 있어요 → 로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}
