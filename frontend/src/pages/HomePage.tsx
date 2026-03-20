import type { AppTab, ContactItem, ReminderItem, UserProfile } from '../types'

interface HomePageProps {
  profile: UserProfile
  reminders: ReminderItem[]
  contacts: ContactItem[]
  onOpenTab: (tab: AppTab) => void
}

export function HomePage({ profile, reminders, contacts, onOpenTab }: HomePageProps) {
  const nextReminder = [...reminders]
    .filter((item) => item.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0]

  const primaryContact = [...contacts].sort((a, b) => a.priority - b.priority)[0]

  return (
    <>
      <section className="panel">
        <h2 className="panel-title">您好，{profile.preferredName}</h2>
        <p className="panel-subtitle">今天也陪您说说话，按下面按钮就能使用。</p>
        <p className="panel-subtitle">
          {profile.age} 岁
          {profile.city ? ` · ${profile.city}` : ''}
          {profile.healthNotes ? ` · ${profile.healthNotes}` : ''}
        </p>

        <div className="quick-grid">
          <button type="button" className="action-btn" onClick={() => onOpenTab('chat')}>
            开始聊天
          </button>
          <button type="button" className="action-btn" onClick={() => onOpenTab('reminders')}>
            查看提醒
          </button>
          <button type="button" className="action-btn" onClick={() => onOpenTab('family')}>
            家属联系人
          </button>
          <button
            type="button"
            className="action-btn warn"
            onClick={() => onOpenTab('emergency')}
          >
            紧急求助
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">今日摘要</h2>
        <ul className="summary-list">
          <li className="summary-item">
            <p>{nextReminder ? `下一条提醒：${nextReminder.title}` : '暂无开启中的提醒'}</p>
            <p>{nextReminder ? `时间：${nextReminder.time}` : '可在提醒页新增'}</p>
          </li>
          <li className="summary-item">
            <p>{primaryContact ? `优先联系人：${primaryContact.name}` : '暂无联系人'}</p>
            <p>{primaryContact ? `${primaryContact.relation} ${primaryContact.phone}` : '请在家属页补充'}</p>
          </li>
        </ul>
      </section>
    </>
  )
}
