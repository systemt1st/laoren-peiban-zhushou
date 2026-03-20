import { startTransition, useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import {
  createContact,
  createEmergencyEvent,
  createReminder,
  fetchContacts,
  fetchProfile,
  fetchRecords,
  fetchReminders,
  sendChatMessage,
  updateReminderStatus,
} from './lib/api'
import { cancelSpeak, speakText } from './lib/webSpeech'
import { ChatPage } from './pages/ChatPage'
import { EmergencyPage } from './pages/EmergencyPage'
import { FamilyPage } from './pages/FamilyPage'
import { HomePage } from './pages/HomePage'
import { ReminderPage } from './pages/ReminderPage'
import type {
  ActivityRecord,
  AppTab,
  ChatMessage,
  ContactItem,
  ReminderItem,
  UserProfile,
} from './types'

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: '张阿姨',
  preferredName: '阿姨',
  age: 68,
}

const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: 'r-1', title: '早饭后服降压药', time: '08:30', enabled: true },
  { id: 'r-2', title: '下午散步 20 分钟', time: '16:30', enabled: true },
  { id: 'r-3', title: '晚饭后喝温水', time: '19:00', enabled: false },
]

const DEFAULT_CONTACTS: ContactItem[] = [
  { id: 'c-1', name: '李明', relation: '儿子', phone: '13800000001', priority: 1 },
  { id: 'c-2', name: '王娟', relation: '社区医生', phone: '13900000002', priority: 2 },
]

const DEFAULT_RECORDS: ActivityRecord[] = [
  {
    id: 'record-welcome',
    kind: 'system',
    summary: '系统已启动，可进行语音对话、提醒管理和应急求助。',
    createdAt: new Date().toISOString(),
    level: 'normal',
  },
]

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    text: '您好，我是老人陪伴助手。您可以直接说“今天吃药提醒”或“我有点胸闷”。',
    createdAt: new Date().toISOString(),
  },
]

const TAB_META: Record<
  AppTab,
  {
    eyebrow: string
    title: (preferredName: string) => string
    subtitle: string
  }
> = {
  home: {
    eyebrow: '日常陪伴总览',
    title: (preferredName) => `${preferredName}，一句话就能开始今天的陪伴`,
    subtitle: '把语音作为主入口，把提醒、联系人和风险留痕整合成一个老人友好的日常面板。',
  },
  chat: {
    eyebrow: '语音陪伴对话',
    title: () => '开口即聊，文字只是备用',
    subtitle: '优先使用语音对话；当识别到风险表达时，系统会自动引导进入应急模式。',
  },
  reminders: {
    eyebrow: '用药与生活提醒',
    title: () => '把该记住的事情，变成看得见的日程',
    subtitle: '围绕吃药、喝水、复诊和散步建立稳定节律，减少遗忘与漏做。',
  },
  emergency: {
    eyebrow: '高风险求助指挥界面',
    title: () => '先求助，再说明情况',
    subtitle: '此页面只做应急引导与留痕，不做医疗诊断；电话呼救始终排在第一优先级。',
  },
  family: {
    eyebrow: '家属与后台追溯',
    title: () => '联系人、画像与关键记录一屏可查',
    subtitle: '让家属和后台快速看到谁可联系、最近发生了什么、哪些内容需要持续关注。',
  },
}

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const nowIso = () => new Date().toISOString()

function getNoticeTone(notice: string, activeTab: AppTab, isBootstrapping: boolean) {
  if (activeTab === 'emergency' || notice.includes('风险') || notice.includes('应急')) {
    return 'danger'
  }
  if (isBootstrapping || notice.includes('离线') || notice.includes('失败') || notice.includes('不稳定')) {
    return 'warning'
  }
  return 'normal'
}

function getConnectionTone(notice: string, isBootstrapping: boolean) {
  if (isBootstrapping) {
    return 'warning'
  }
  if (notice.includes('离线') || notice.includes('失败') || notice.includes('不稳定')) {
    return 'warning'
  }
  return 'ok'
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [reminders, setReminders] = useState<ReminderItem[]>(DEFAULT_REMINDERS)
  const [contacts, setContacts] = useState<ContactItem[]>(DEFAULT_CONTACTS)
  const [records, setRecords] = useState<ActivityRecord[]>(DEFAULT_RECORDS)
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES)
  const [notice, setNotice] = useState('正在连接服务...')
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    void (async () => {
      setIsBootstrapping(true)
      const result = await Promise.allSettled([
        fetchProfile(),
        fetchReminders(),
        fetchContacts(),
        fetchRecords(),
      ])

      let failed = 0
      const [profileResult, reminderResult, contactResult, recordResult] = result

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value)
      } else {
        failed += 1
      }

      if (reminderResult.status === 'fulfilled') {
        setReminders(reminderResult.value)
      } else {
        failed += 1
      }

      if (contactResult.status === 'fulfilled') {
        setContacts(contactResult.value)
      } else {
        failed += 1
      }

      if (recordResult.status === 'fulfilled') {
        setRecords(recordResult.value.slice(0, 20))
      } else {
        failed += 1
      }

      setNotice(failed > 0 ? '部分服务离线，已切换本地模式。' : '服务连接正常。')
      setIsBootstrapping(false)
    })()
  }, [])

  function appendRecord(kind: ActivityRecord['kind'], summary: string, level: ActivityRecord['level']) {
    const record: ActivityRecord = {
      id: createId(),
      kind,
      summary,
      createdAt: nowIso(),
      level,
    }
    setRecords((prev) => [record, ...prev].slice(0, 50))
  }

  async function handleSendMessage(text: string) {
    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      text,
      createdAt: nowIso(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await sendChatMessage({ text, userId: profile.id })
      const assistantReply =
        response.reply.trim().length > 0 ? response.reply : '我在，您慢慢说。'

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: assistantReply,
        createdAt: nowIso(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      appendRecord('chat', `对话摘要：${text.slice(0, 24)}`, response.riskLevel)

      if (response.shouldEscalate || response.riskLevel === 'danger') {
        setNotice('检测到风险信号，请立即查看应急区。')
        startTransition(() => {
          setActiveTab('emergency')
        })
      } else {
        setNotice('已完成一轮陪伴对话。')
      }
    } catch {
      const localReply =
        '网络暂不可用，我会继续陪您。若身体不适，请点“应急”并尽快联系家属或 120。'
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: 'assistant', text: localReply, createdAt: nowIso() },
      ])
      appendRecord('system', '对话服务离线，已给出本地兜底回复。', 'warning')
      setNotice('网络不稳定，当前为离线陪伴模式。')
    }
  }

  async function handleCreateReminder(title: string, time: string) {
    try {
      const created = await createReminder({ title, time })
      setReminders((prev) => [created, ...prev])
      appendRecord('reminder', `新增提醒：${title} ${time}`, 'normal')
      setNotice('提醒已保存。')
    } catch {
      const localItem: ReminderItem = { id: createId(), title, time, enabled: true }
      setReminders((prev) => [localItem, ...prev])
      appendRecord('reminder', `离线新增提醒：${title} ${time}`, 'warning')
      setNotice('提醒已离线保存，待网络恢复后同步。')
    }
  }

  async function handleToggleReminder(id: string, nextEnabled: boolean) {
    setReminders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item)),
    )
    try {
      await updateReminderStatus(id, nextEnabled)
      appendRecord('reminder', `提醒状态变更：${nextEnabled ? '开启' : '暂停'}`, 'normal')
      setNotice(`提醒已${nextEnabled ? '开启' : '暂停'}。`)
    } catch {
      setReminders((prev) =>
        prev.map((item) => (item.id === id ? { ...item, enabled: !nextEnabled } : item)),
      )
      setNotice('提醒状态更新失败，请稍后重试。')
    }
  }

  async function handleEmergency(symptom: string, notes: string) {
    try {
      await createEmergencyEvent({ symptom, notes })
      appendRecord('emergency', `应急求助：${symptom}`, 'danger')
      setNotice('应急记录已保存，请立即联系家属或 120。')
    } catch {
      appendRecord('emergency', `离线应急求助：${symptom}`, 'danger')
      setNotice('应急事件已本地留痕，请立即电话求助。')
    }
  }

  async function handleAddContact(input: Pick<ContactItem, 'name' | 'relation' | 'phone' | 'priority'>) {
    const contact = await createContact(input)
    setContacts((prev) => [...prev, contact].sort((a, b) => a.priority - b.priority))
    appendRecord('system', `已添加紧急联系人：${input.name}`, 'normal')
    setNotice('联系人已保存。')
  }

  async function handleSpeakLastReply() {
    const lastAssistant = [...messages].reverse().find((item) => item.role === 'assistant')
    if (!lastAssistant) {
      setNotice('暂无可播报内容。')
      return
    }
    try {
      await speakText(lastAssistant.text)
      setNotice('正在语音播报。')
    } catch {
      setNotice('当前设备不支持语音播报。')
    }
  }

  function handleStopSpeak() {
    cancelSpeak()
    setNotice('已停止语音播报。')
  }

  function openTab(tab: AppTab) {
    setActiveTab(tab)
  }

  const todayText = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const primaryContact = [...contacts].sort((a, b) => a.priority - b.priority)[0]
  const nextReminder = [...reminders]
    .filter((item) => item.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0]
  const latestDangerRecord = records.find((item) => item.level === 'danger')
  const currentMeta = TAB_META[activeTab]
  const noticeTone = getNoticeTone(notice, activeTab, isBootstrapping)
  const connectionTone = getConnectionTone(notice, isBootstrapping)

  let page = (
    <HomePage
      profile={profile}
      reminders={reminders}
      contacts={contacts}
      records={records}
      onOpenTab={openTab}
    />
  )

  if (activeTab === 'chat') {
    page = (
      <ChatPage
        messages={messages}
        onSendMessage={handleSendMessage}
        onSpeakLastReply={handleSpeakLastReply}
        onStopSpeak={handleStopSpeak}
      />
    )
  }

  if (activeTab === 'reminders') {
    page = (
      <ReminderPage
        reminders={reminders}
        onCreateReminder={handleCreateReminder}
        onToggleReminder={handleToggleReminder}
      />
    )
  }

  if (activeTab === 'emergency') {
    page = (
      <EmergencyPage
        primaryContact={primaryContact}
        onEmergency={handleEmergency}
        onOpenTab={openTab}
      />
    )
  }

  if (activeTab === 'family') {
    page = (
      <FamilyPage
        profile={profile}
        contacts={contacts}
        records={records}
        onAddContact={handleAddContact}
      />
    )
  }

  return (
    <div className={`app-shell ${activeTab === 'emergency' ? 'emergency-mode' : ''}`}>
      <header className="app-header">
        <div className="header-topbar">
          <div>
            <p className="brand-kicker">语音陪伴与生活助手</p>
            <p className="brand-name">老人陪伴助手</p>
          </div>

          <div className="topbar-actions">
            <span className={`status-pill ${connectionTone}`}>
              {isBootstrapping ? '同步中' : notice.includes('离线') ? '离线兜底' : '服务在线'}
            </span>
            <button
              type="button"
              className={`topbar-button ${activeTab === 'emergency' ? 'ghost' : 'danger'}`}
              onClick={() => openTab(activeTab === 'emergency' ? 'home' : 'emergency')}
            >
              {activeTab === 'emergency' ? '返回首页' : '紧急模式'}
            </button>
          </div>
        </div>

        <section className={`hero-card ${activeTab === 'emergency' ? 'emergency' : ''}`}>
          <div className="hero-copy">
            <p className="hero-eyebrow">{currentMeta.eyebrow}</p>
            <h1 className="hero-title">{currentMeta.title(profile.preferredName)}</h1>
            <p className="hero-subtitle">{currentMeta.subtitle}</p>

            <div className="hero-tags">
              <span className="hero-tag">{todayText}</span>
              <span className="hero-tag">
                {profile.age} 岁
                {profile.city ? ` · ${profile.city}` : ''}
              </span>
              <span className="hero-tag">{activeTab === 'emergency' ? '电话优先' : '语音优先'}</span>
            </div>
          </div>

          <div className="hero-metrics">
            <article className="metric-card">
              <p className="metric-label">下一条提醒</p>
              <p className="metric-value">{nextReminder ? nextReminder.time : '未设置'}</p>
              <p className="metric-note">{nextReminder ? nextReminder.title : '去提醒页补充日程'}</p>
            </article>

            <article className="metric-card">
              <p className="metric-label">第一联系人</p>
              <p className="metric-value">{primaryContact ? primaryContact.name : '未设置'}</p>
              <p className="metric-note">
                {primaryContact
                  ? `${primaryContact.relation} · ${primaryContact.phone}`
                  : '去家属页添加紧急联系人'}
              </p>
            </article>

            <article className="metric-card">
              <p className="metric-label">安全状态</p>
              <p className="metric-value">{latestDangerRecord ? '近期有风险留痕' : '当前平稳'}</p>
              <p className="metric-note">
                {latestDangerRecord
                  ? latestDangerRecord.summary
                  : isBootstrapping
                    ? '正在同步服务与记录'
                    : '可随时进入应急区求助'}
              </p>
            </article>
          </div>
        </section>

        <p className={`notice-banner ${noticeTone}`} aria-live="polite">
          {notice}
        </p>
      </header>

      <main className="app-main">
        {isBootstrapping ? <p className="boot-note">正在同步用户画像、提醒与联系人...</p> : null}
        {page}
      </main>

      <BottomNav activeTab={activeTab} onChange={openTab} />
    </div>
  )
}

export default App
