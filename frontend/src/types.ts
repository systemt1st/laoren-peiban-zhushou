export type AppTab = 'home' | 'chat' | 'reminders' | 'emergency' | 'family'

export interface UserProfile {
  id: string
  name: string
  preferredName: string
  age: number
  gender?: string
  city?: string
  healthNotes?: string
}

export interface ReminderItem {
  id: string
  title: string
  time: string
  enabled: boolean
}

export interface ContactItem {
  id: string
  name: string
  relation: string
  phone: string
  priority: number
}

export interface ActivityRecord {
  id: string
  kind: 'chat' | 'reminder' | 'emergency' | 'system'
  summary: string
  createdAt: string
  level: 'normal' | 'warning' | 'danger'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export interface ChatResponse {
  reply: string
  riskLevel: 'normal' | 'warning' | 'danger'
  shouldEscalate: boolean
}
