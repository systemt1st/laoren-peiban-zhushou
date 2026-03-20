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

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const nowIso = () => new Date().toISOString()

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

  const primaryContact = contacts[0]

  let page = (
    <HomePage profile={profile} reminders={reminders} contacts={contacts} onOpenTab={openTab} />
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
    page = <FamilyPage profile={profile} contacts={contacts} records={records} onAddContact={handleAddContact} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-date">{todayText}</p>
        <h1 className="app-title">老人陪伴助手</h1>
        <p className="app-subtitle">开口就能用，关键时刻有指引、有留痕。</p>
        <p className="banner">{notice}</p>
      </header>

      <main className="app-main">
        {isBootstrapping ? <p className="loading-tip">正在同步数据...</p> : null}
        {page}
      </main>

      <BottomNav activeTab={activeTab} onChange={openTab} />
    </div>
  )
}

export default App
