import type {
  ActivityRecord,
  AppTab,
  ContactItem,
  ReminderItem,
  UserProfile,
} from '../types'

interface HomePageProps {
  profile: UserProfile
  reminders: ReminderItem[]
  contacts: ContactItem[]
  records: ActivityRecord[]
  onOpenTab: (tab: AppTab) => void
}

const QUICK_COMMANDS = [
  '今天天气怎么样',
  '提醒我下午四点吃药',
  '我有点头晕怎么办',
  '给我讲讲最近的新闻',
]

export function HomePage({ profile, reminders, contacts, records, onOpenTab }: HomePageProps) {
  const enabledReminders = [...reminders].filter((item) => item.enabled)
  const nextReminder = enabledReminders.sort((a, b) => a.time.localeCompare(b.time))[0]
  const primaryContact = [...contacts].sort((a, b) => a.priority - b.priority)[0]
  const latestRecord = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <>
      <section className="showcase-card">
        <div className="panel-head">
          <div>
            <p className="section-kicker">首页主动作</p>
            <h2 className="section-title">先开始语音陪伴，其余功能都在下一步里完成。</h2>
          </div>
        </div>

        <p className="section-subtitle">
          {profile.preferredName}
          ，您可以直接说想聊的话、想问的事，或者把吃药、喝水、复诊这些事情交给助手来提醒。
        </p>

        <div className="showcase-actions">
          <button type="button" className="btn primary large" onClick={() => onOpenTab('chat')}>
            开始语音陪伴
          </button>
          <button type="button" className="btn danger large" onClick={() => onOpenTab('emergency')}>
            我现在不舒服
          </button>
        </div>

        <div className="command-list" aria-label="常用语音示例">
          {QUICK_COMMANDS.map((command) => (
            <span key={command} className="command-chip">
              “{command}”
            </span>
          ))}
        </div>
      </section>

      <section className="panel-grid two-up">
        <article className="panel stat-card">
          <p className="section-kicker">今日提醒</p>
          <h2 className="section-title">{nextReminder ? nextReminder.time : '还未安排'}</h2>
          <p className="section-subtitle">
            {nextReminder ? nextReminder.title : '去提醒页增加吃药、喝水、复诊等日程。'}
          </p>
          <p className="detail-line">已开启 {enabledReminders.length} 条提醒</p>
        </article>

        <article className="panel stat-card">
          <p className="section-kicker">求助准备</p>
          <h2 className="section-title">{primaryContact ? primaryContact.name : '待补充联系人'}</h2>
          <p className="section-subtitle">
            {primaryContact
              ? `${primaryContact.relation} · ${primaryContact.phone}`
              : '建议至少补充 1 位家属或社区联系人。'}
          </p>
          <p className="detail-line">{primaryContact ? '紧急模式可一键呼叫' : '去家属页补充信息'}</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">安心机制</p>
            <h2 className="section-title">陪伴、提醒、应急与留痕形成闭环。</h2>
          </div>
        </div>

        <div className="journey-list">
          <article className="journey-item">
            <p className="journey-title">语音优先</p>
            <p className="journey-text">老人只需要开口说话，不必先理解复杂界面。</p>
          </article>
          <article className="journey-item">
            <p className="journey-title">高风险先求助</p>
            <p className="journey-text">胸痛、呼吸困难、摔倒等场景会优先引导拨打电话。</p>
          </article>
          <article className="journey-item">
            <p className="journey-title">关键记录可追溯</p>
            <p className="journey-text">
              {latestRecord ? `最近一条记录：${latestRecord.summary}` : '系统会持续保留最近的关键事件。'}
            </p>
          </article>
        </div>

        <div className="btn-row compact">
          <button type="button" className="btn secondary" onClick={() => onOpenTab('reminders')}>
            管理提醒
          </button>
          <button type="button" className="btn ghost" onClick={() => onOpenTab('family')}>
            查看家属与记录
          </button>
        </div>
      </section>
    </>
  )
}
