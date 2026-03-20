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

export function FamilyPage({ profile, contacts, records, onAddContact }: FamilyPageProps) {
  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority)
  const recentRecords = [...records]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [priority, setPriority] = useState(1)
  const [message, setMessage] = useState('可在这里维护紧急联系人。')

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
      <section className="panel">
        <h2 className="panel-title">老人画像</h2>
        <article className="record-item">
          <div className="record-head">
            <p>{profile.name}</p>
            <strong>{profile.age} 岁</strong>
          </div>
          <p className="item-sub">
            {profile.city ? `城市：${profile.city}` : '城市未填写'}
            {profile.healthNotes ? ` · ${profile.healthNotes}` : ''}
          </p>
        </article>
      </section>

      <section className="panel">
        <h2 className="panel-title">家庭联系人</h2>
        {sortedContacts.length === 0 ? <p className="empty-text">暂无联系人。</p> : null}
        {sortedContacts.map((item) => (
          <article key={item.id} className="contact-item">
            <div className="contact-head">
              <p>
                {item.name}（{item.relation}）
              </p>
              <strong>P{item.priority}</strong>
            </div>
            <p className="item-sub">{item.phone}</p>
            <div className="btn-row">
              <a className="btn secondary" href={`tel:${item.phone}`}>
                直接拨打
              </a>
            </div>
          </article>
        ))}

        <div className="input-grid">
          <p className="panel-subtitle">{message}</p>
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
              placeholder="例如：儿子"
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
          <button type="button" className="btn primary" onClick={() => void submitContact()}>
            添加联系人
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">关键记录摘要</h2>
        {recentRecords.length === 0 ? <p className="empty-text">暂无记录。</p> : null}
        {recentRecords.map((item) => (
          <article key={item.id} className="record-item">
            <div className="record-head">
              <p>
                {KIND_TEXT[item.kind]} ·{' '}
                <span className={`record-level-${item.level}`}>{LEVEL_TEXT[item.level]}</span>
              </p>
              <strong>
                {new Date(item.createdAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
            <p className="item-sub">{item.summary}</p>
          </article>
        ))}
      </section>
    </>
  )
}
