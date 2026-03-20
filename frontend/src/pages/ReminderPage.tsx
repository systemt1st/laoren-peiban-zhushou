import { useState } from 'react'
import type { ReminderItem } from '../types'

interface ReminderPageProps {
  reminders: ReminderItem[]
  onCreateReminder: (title: string, time: string) => Promise<void>
  onToggleReminder: (id: string, enabled: boolean) => Promise<void>
}

function sortByTime(items: ReminderItem[]) {
  return [...items].sort((a, b) => a.time.localeCompare(b.time))
}

export function ReminderPage({
  reminders,
  onCreateReminder,
  onToggleReminder,
}: ReminderPageProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('按需新增用药、喝水、复诊和运动提醒。')
  const [error, setError] = useState('')

  const activeReminders = sortByTime(reminders.filter((item) => item.enabled))
  const pausedReminders = sortByTime(reminders.filter((item) => !item.enabled))
  const nextReminder = activeReminders[0]

  async function submitReminder() {
    if (!title.trim()) {
      setError('提醒内容不能为空。')
      return
    }
    if (!time) {
      setError('请选择提醒时间。')
      return
    }

    setError('')
    setSaving(true)
    try {
      await onCreateReminder(title.trim(), time)
      setTitle('')
      setTime('')
      setMessage('提醒已保存。')
    } catch {
      setError('保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="panel-grid three-up">
        <article className="panel stat-card">
          <p className="section-kicker">已开启</p>
          <h2 className="section-title">{activeReminders.length} 条</h2>
          <p className="section-subtitle">保持稳定执行，降低遗忘风险。</p>
        </article>

        <article className="panel stat-card">
          <p className="section-kicker">下一条提醒</p>
          <h2 className="section-title">{nextReminder ? nextReminder.time : '未设置'}</h2>
          <p className="section-subtitle">
            {nextReminder ? nextReminder.title : '新增一条日常提醒，让今天更有节律。'}
          </p>
        </article>

        <article className="panel stat-card">
          <p className="section-kicker">管理方式</p>
          <h2 className="section-title">简洁可控</h2>
          <p className="section-subtitle">先做到最少必要信息，再按需暂停或恢复。</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">新增提醒</p>
            <h2 className="section-title">先写内容，再选时间，不需要复杂配置。</h2>
          </div>
        </div>

        <p className={`inline-feedback ${error ? 'error' : ''}`}>{error || message}</p>

        <div className="input-grid">
          <div>
            <label className="input-label" htmlFor="reminder-title">
              提醒内容
            </label>
            <input
              id="reminder-title"
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：午饭后吃药"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="reminder-time">
              提醒时间
            </label>
            <input
              id="reminder-time"
              className="input"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={saving} onClick={() => void submitReminder()}>
            {saving ? '保存中...' : '保存提醒'}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">执行中的提醒</p>
            <h2 className="section-title">当前最重要的是让每条提醒都容易看懂。</h2>
          </div>
        </div>

        {activeReminders.length === 0 ? <p className="empty-text">暂无已开启的提醒。</p> : null}
        <div className="list-stack">
          {activeReminders.map((item) => (
            <article key={item.id} className="reminder-card">
              <div className="reminder-top">
                <div>
                  <p className="journey-title">{item.title}</p>
                  <p className="journey-text">建议保持固定时间，减少遗忘。</p>
                </div>
                <div className="reminder-side">
                  <strong>{item.time}</strong>
                  <span className="status-badge">已开启</span>
                </div>
              </div>

              <div className="btn-row compact">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    void onToggleReminder(item.id, false)
                  }}
                >
                  暂停提醒
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">已暂停</p>
            <h2 className="section-title">需要时再恢复，不保留多余复杂设置。</h2>
          </div>
        </div>

        {pausedReminders.length === 0 ? <p className="empty-text">暂无暂停中的提醒。</p> : null}
        <div className="list-stack">
          {pausedReminders.map((item) => (
            <article key={item.id} className="reminder-card muted">
              <div className="reminder-top">
                <div>
                  <p className="journey-title">{item.title}</p>
                  <p className="journey-text">恢复后会重新进入日常节律。</p>
                </div>
                <div className="reminder-side">
                  <strong>{item.time}</strong>
                  <span className="status-badge off">已暂停</span>
                </div>
              </div>

              <div className="btn-row compact">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    void onToggleReminder(item.id, true)
                  }}
                >
                  重新开启
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
