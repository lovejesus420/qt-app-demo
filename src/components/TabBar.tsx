type Tab = 'meditation' | 'sharing' | 'my'

interface TabBarProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-bar-item ${active === 'meditation' ? 'active' : ''}`}
        onClick={() => onChange('meditation')}
      >
        <svg viewBox="0 0 24 24" fill={active === 'meditation' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        묵상
      </button>

      <button
        className={`tab-bar-item ${active === 'sharing' ? 'active' : ''}`}
        onClick={() => onChange('sharing')}
      >
        <svg viewBox="0 0 24 24" fill={active === 'sharing' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        나눔
      </button>

      <button
        className={`tab-bar-item ${active === 'my' ? 'active' : ''}`}
        onClick={() => onChange('my')}
      >
        <svg viewBox="0 0 24 24" fill={active === 'my' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        MY
      </button>
    </nav>
  )
}
