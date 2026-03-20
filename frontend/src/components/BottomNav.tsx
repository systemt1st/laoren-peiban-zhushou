import type { AppTab } from '../types'

interface BottomNavProps {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
}

const TABS: Array<{ tab: AppTab; label: string }> = [
  { tab: 'home', label: '首页' },
  { tab: 'chat', label: '陪伴' },
  { tab: 'reminders', label: '提醒' },
  { tab: 'emergency', label: '应急' },
  { tab: 'family', label: '家属' },
]

function TabIcon({ tab }: { tab: AppTab }) {
  if (tab === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 10.5 12 4l8.25 6.5v8.25a1.5 1.5 0 0 1-1.5 1.5h-4.5v-5.25h-4.5v5.25h-4.5a1.5 1.5 0 0 1-1.5-1.5z" />
      </svg>
    )
  }

  if (tab === 'chat') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v8.25a1.5 1.5 0 0 1-1.5 1.5H9.621L5.25 19.75V6.75a1.5 1.5 0 0 1 1.5-1.5z" />
      </svg>
    )
  }

  if (tab === 'reminders') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 3.75v2.25m9-2.25v2.25m-10.5 3h12a1.5 1.5 0 0 1 1.5 1.5v7.5a2.25 2.25 0 0 1-2.25 2.25h-10.5A2.25 2.25 0 0 1 4.5 18V10.5A1.5 1.5 0 0 1 6 9m0 0V6.75A1.5 1.5 0 0 1 7.5 5.25h9A1.5 1.5 0 0 1 18 6.75V9" />
      </svg>
    )
  }

  if (tab === 'emergency') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.75 21 19.5H3z" />
        <path d="M12 8.25v5.25m0 3h.008" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 8.25a6 6 0 1 1 12 0z" />
    </svg>
  )
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {TABS.map((item) => (
        <button
          key={item.tab}
          type="button"
          className={`nav-btn ${activeTab === item.tab ? 'active' : ''}`}
          data-urgent={item.tab === 'emergency'}
          onClick={() => onChange(item.tab)}
        >
          <span className="nav-icon">
            <TabIcon tab={item.tab} />
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
