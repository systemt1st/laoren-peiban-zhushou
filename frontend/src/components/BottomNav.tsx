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

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {TABS.map((item) => (
        <button
          key={item.tab}
          type="button"
          className={`nav-btn ${activeTab === item.tab ? 'active' : ''}`}
          onClick={() => onChange(item.tab)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
