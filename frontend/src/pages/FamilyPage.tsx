import { useState } from 'react'
import type { ActivityRecord, ContactItem, UserProfile } from '../types'

interface FamilyPageProps {
  profile: UserProfile
  contacts: ContactItem[]
  records: ActivityRecord[]
  onAddContact: (input: Pick<ContactItem, 'name' | 'relation' | 'phone' | 'priority'>) => Promise<void>
}

const LEVEL_TEXT: Record<ActivityRecord['level'], string> = {
  normal: '普通',
  warning: '关注',
  danger: '紧急',
}

const KIND_TEXT: Record<ActivityRecord['kind'], string> = {
  chat: '对话',
  reminder: '提醒',
  emergency: '应急',
  system: '系统',
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FamilyPage({ profile, contacts, records, onAddContact }: FamilyPageProps) {
  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority)
  const recentRecords = [...records]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12)
  const dangerCount = recentRecords.filter((item) => item.level === 'danger').length
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [priority, setPriority] = useState(1)
  const [message, setMessage] = useState('在这里维护家属、医生、邻里等紧急联系人。')

  async function submitContact() {
    if (!name.trim() || !relation.trim() || !phone.trim()) {
      setMessage('请把联系人信息填写完整。')
      return
    }

    try {
      await onAddContact({
        name: name.trim(),
        relation: relation.trim(),
        phone: phone.trim(),
        priority,
      })
      setName('')
      setRelation('')
      setPhone('')
      setPriority(1)
      setMessage('联系人已保存。')
    } catch {
      setMessage('联系人保存失败，请稍后再试。')
    }
  }

  return (
    <>
      <section className="panel-grid three-up">
        <article className="panel stat-card">
          <p className="section-kicker">老人画像</p>
          <h2 className="section-title">{profile.name}</h2>
          <p className="section-subtitle">
            {profile.age} 岁
            {profile.city ? ` · ${profile.city}` : ''}
          </p>
        </article>

        <article className="panel stat-card">
          <p className="section-kicker">联系人</p>
          <h2 className="section-title">{sortedContacts.length} 位</h2>
          <p className="section-subtitle">优先级越靠前，应急时越先拨打。</p>
        </article>

        <article className="panel stat-card">
          <p className="section-kicker">近期紧急记录</p>
          <h2 className="section-title">{dangerCount} 条</h2>
          <p className="section-subtitle">关键事件会保留在记录区，便于家属回看。</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">画像补充</p>
            <h2 className="section-title">最少必要信息，便于家属快速了解情况。</h2>
          </div>
        </div>

        <article className="profile-card">
          <p className="journey-title">{profile.name}</p>
          <p className="journey-text">
            {profile.city ? `城市：${profile.city}` : '城市未填写'}
            {profile.healthNotes ? ` · 健康备注：${profile.healthNotes}` : ' · 健康备注待补充'}
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">家庭联系人</p>
            <h2 className="section-title">应急拨号顺序和电话一眼可见。</h2>
          </div>
        </div>

        {sortedContacts.length === 0 ? <p className="empty-text">暂无联系人。</p> : null}
        <div className="list-stack">
          {sortedContacts.map((item) => (
            <article key={item.id} className="contact-card">
              <div className="contact-top">
                <div>
                  <p className="journey-title">
                    {item.name}（{item.relation}）
                  </p>
                  <p className="journey-text">{item.phone}</p>
                </div>
                <span className="priority-badge">P{item.priority}</span>
              </div>

              <div className="btn-row compact">
                <a className="btn secondary" href={`tel:${item.phone}`}>
                  直接拨打
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">新增联系人</p>
            <h2 className="section-title">先保证能联系到人，再考虑更多资料。</h2>
          </div>
        </div>

        <p className="inline-feedback">{message}</p>

        <div className="input-grid">
          <div>
            <label className="input-label" htmlFor="contact-name">
              联系人姓名
            </label>
            <input
              id="contact-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：李明"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="contact-relation">
              关系
            </label>
            <input
              id="contact-relation"
              className="input"
              value={relation}
              onChange={(event) => setRelation(event.target.value)}
              placeholder="例如：儿子 / 邻居 / 社区医生"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="contact-phone">
              手机号
            </label>
            <input
              id="contact-phone"
              className="input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="例如：13800138000"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="contact-priority">
              优先级
            </label>
            <input
              id="contact-priority"
              className="input"
              type="number"
              min="1"
              max="9"
              value={priority}
              onChange={(event) => setPriority(Number(event.target.value || 1))}
            />
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => void submitContact()}>
            添加联系人
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">关键记录</p>
            <h2 className="section-title">对话、提醒和应急事件都会形成追溯线索。</h2>
          </div>
        </div>

        {recentRecords.length === 0 ? <p className="empty-text">暂无记录。</p> : null}
        <div className="list-stack">
          {recentRecords.map((item) => (
            <article key={item.id} className="record-card">
              <div className="record-top">
                <div>
                  <p className="journey-title">
                    {KIND_TEXT[item.kind]} ·{' '}
                    <span className={`severity-chip ${item.level}`}>{LEVEL_TEXT[item.level]}</span>
                  </p>
                  <p className="journey-text">{item.summary}</p>
                </div>
                <span className="record-time">{formatDateTime(item.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
