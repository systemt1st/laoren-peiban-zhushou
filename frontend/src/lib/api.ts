import type {
  ActivityRecord,
  ChatResponse,
  ContactItem,
  ReminderItem,
  UserProfile,
} from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(
  /\/+$/,
  '',
)

const REQUEST_TIMEOUT = 12000
const USER_ID_STORAGE_KEY = 'laoren-peiban-user-id'

interface BackendUserProfile {
  id: string
  name: string
  age: number
  gender: string
  city: string | null
  health_notes: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface BackendReminder {
  id: string
  title: string
  note: string | null
  remind_at: string
  repeat_rule: 'none' | 'daily' | 'weekly' | 'monthly'
  status: 'pending' | 'done' | 'cancelled'
}

interface BackendContact {
  id: string
  name: string
  relation: string
  phone: string
  priority: number
}

interface BackendChatRecord {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

interface BackendChatReply {
  reply: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  emergency_mode: boolean
  event_id: string | null
}

interface BackendEmergencyEvent {
  id: string
  trigger_text: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'resolved'
  created_at: string
}

let ensuredUserIdPromise: Promise<string> | null = null

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  const headers = new Headers(init?.headers ?? {})

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })

    const rawText = await response.text()
    const payload = rawText ? (JSON.parse(rawText) as unknown) : null

    if (!response.ok) {
      const detail =
        typeof payload === 'object' &&
        payload !== null &&
        'detail' in payload &&
        typeof payload.detail === 'string'
          ? payload.detail
          : `请求失败(${response.status})`
      throw new Error(detail)
    }

    return payload as T
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function getStoredUserId() {
  return window.localStorage.getItem(USER_ID_STORAGE_KEY)
}

function setStoredUserId(userId: string) {
  window.localStorage.setItem(USER_ID_STORAGE_KEY, userId)
}

function toPreferredName(name: string) {
  if (name.length <= 2) {
    return name
  }
  return name.slice(-2)
}

function mapRiskLevel(riskLevel: string): ActivityRecord['level'] {
  if (riskLevel === 'high' || riskLevel === 'critical') {
    return 'danger'
  }
  if (riskLevel === 'low' || riskLevel === 'medium') {
    return 'warning'
  }
  return 'normal'
}

function mapProfile(profile: BackendUserProfile): UserProfile {
  return {
    id: profile.id,
    name: profile.name,
    preferredName: toPreferredName(profile.name),
    age: profile.age,
    gender: profile.gender,
    city: profile.city ?? '',
    healthNotes: profile.health_notes ?? '',
  }
}

function mapReminder(reminder: BackendReminder): ReminderItem {
  return {
    id: reminder.id,
    title: reminder.title,
    time: new Date(reminder.remind_at).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    enabled: reminder.status === 'pending',
  }
}

function buildReminderDateTime(time: string) {
  const [hour, minute] = time.split(':').map((item) => Number(item))
  const nextTime = new Date()
  nextTime.setHours(hour, minute, 0, 0)
  if (nextTime.getTime() < Date.now() - 60_000) {
    nextTime.setDate(nextTime.getDate() + 1)
  }
  return nextTime.toISOString()
}

async function createDefaultUser() {
  const payload = await request<BackendUserProfile>('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: '张阿姨',
      age: 68,
      gender: '女',
      city: '上海',
      health_notes: '高血压，注意按时服药',
      preferences: {
        topics: ['戏曲', '孙辈', '天气'],
      },
    }),
  })
  setStoredUserId(payload.id)
  return payload.id
}

async function ensureUserId() {
  if (ensuredUserIdPromise) {
    return ensuredUserIdPromise
  }

  ensuredUserIdPromise = (async () => {
    const storedUserId = getStoredUserId()
    if (storedUserId) {
      try {
        await request<BackendUserProfile>(`/users/${storedUserId}`)
        return storedUserId
      } catch {
        window.localStorage.removeItem(USER_ID_STORAGE_KEY)
      }
    }

    return createDefaultUser()
  })()

  try {
    return await ensuredUserIdPromise
  } catch (error) {
    ensuredUserIdPromise = null
    throw error
  }
}

export async function fetchProfile() {
  const userId = await ensureUserId()
  const profile = await request<BackendUserProfile>(`/users/${userId}`)
  return mapProfile(profile)
}

export async function fetchReminders() {
  const userId = await ensureUserId()
  const reminders = await request<BackendReminder[]>(`/users/${userId}/reminders`)
  return reminders.map(mapReminder)
}

export async function createReminder(input: Pick<ReminderItem, 'title' | 'time'>) {
  const userId = await ensureUserId()
  const reminder = await request<BackendReminder>(`/users/${userId}/reminders`, {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      note: null,
      remind_at: buildReminderDateTime(input.time),
      repeat_rule: 'daily',
      status: 'pending',
    }),
  })
  return mapReminder(reminder)
}

export async function updateReminderStatus(id: string, enabled: boolean) {
  const reminder = await request<BackendReminder>(`/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: enabled ? 'pending' : 'cancelled' }),
  })
  return mapReminder(reminder)
}

export async function fetchContacts() {
  const userId = await ensureUserId()
  const contacts = await request<BackendContact[]>(`/users/${userId}/contacts`)
  return contacts
}

export async function createContact(input: Pick<ContactItem, 'name' | 'relation' | 'phone' | 'priority'>) {
  const userId = await ensureUserId()
  return request<ContactItem>(`/users/${userId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchRecords() {
  const userId = await ensureUserId()
  const [chatRecords, emergencyEvents] = await Promise.all([
    request<BackendChatRecord[]>(`/users/${userId}/chat/history?limit=20`),
    request<BackendEmergencyEvent[]>(`/users/${userId}/events`),
  ])

  const records: ActivityRecord[] = [
    ...chatRecords.map((item) => ({
      id: `chat-${item.id}`,
      kind: (item.role === 'assistant' || item.role === 'user' ? 'chat' : 'system') as
        | 'chat'
        | 'system',
      summary: `${item.role === 'assistant' ? '助手' : item.role === 'user' ? '用户' : '系统'}：${item.content.slice(0, 40)}`,
      createdAt: item.created_at,
      level: mapRiskLevel(item.risk_level),
    })),
    ...emergencyEvents.map((item) => ({
      id: `event-${item.id}`,
      kind: 'emergency' as const,
      summary: `${item.trigger_text} · ${item.status === 'resolved' ? '已处理' : '待处理'}`,
      createdAt: item.created_at,
      level: mapRiskLevel(item.severity),
    })),
  ]

  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function sendChatMessage(input: { text: string; userId: string }) {
  const userId = input.userId === 'local-user' ? await ensureUserId() : input.userId
  const payload = await request<BackendChatReply>(`/users/${userId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message: input.text }),
  })
  return {
    reply: payload.reply,
    riskLevel: mapRiskLevel(payload.risk_level),
    shouldEscalate: payload.emergency_mode,
  } satisfies ChatResponse
}

export async function createEmergencyEvent(input: { symptom: string; notes: string }) {
  const userId = await ensureUserId()
  const payload = await request<BackendChatReply>(`/users/${userId}/chat`, {
    method: 'POST',
    body: JSON.stringify({
      message: `${input.symptom}${input.notes ? `，${input.notes}` : ''}`,
    }),
  })
  return { id: payload.event_id ?? `local-${Date.now()}` }
}
