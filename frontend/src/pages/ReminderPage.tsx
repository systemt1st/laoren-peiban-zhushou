import { useState } from 'react'
import type { ReminderItem } from '../types'

interface ReminderPageProps {
  reminders: ReminderItem[]
  onCreateReminder: (title: string, time: string) => Promise<void>
  onToggleReminder: (id: string, enabled: boolean) => Promise<void>
}

export function ReminderPage({
  reminders,
  onCreateReminder,
  onToggleReminder,
}: ReminderPageProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('按需新增用药、喝水、复诊提醒。')
  const [error, setError] = useState('')

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
      <section className="panel">
        <h2 className="panel-title">提醒管理</h2>
        <p className="panel-subtitle">{error || message}</p>

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

          <button type="button" className="btn primary" disabled={saving} onClick={submitReminder}>
            {saving ? '保存中...' : '新增提醒'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">我的提醒列表</h2>
        {reminders.length === 0 ? <p className="empty-text">暂无提醒。</p> : null}
        {[...reminders]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((item) => (
            <article key={item.id} className="reminder-item">
              <div className="reminder-head">
                <p>{item.title}</p>
                <strong>{item.time}</strong>
              </div>
              <p className="item-sub">状态：{item.enabled ? '已开启' : '已暂停'}</p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    void onToggleReminder(item.id, !item.enabled)
                  }}
                >
                  {item.enabled ? '暂停' : '开启'}
                </button>
              </div>
            </article>
          ))}
      </section>
    </>
  )
}
