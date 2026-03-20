import { useDeferredValue, useState } from 'react'
import { VoiceButton } from '../components/VoiceButton'
import type { ChatMessage } from '../types'

interface ChatPageProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => Promise<void>
  onSpeakLastReply: () => Promise<void>
  onStopSpeak: () => void
}

const QUICK_TOPICS = [
  '陪我聊聊今天的心情',
  '提醒我下午喝水',
  '我有点胸闷，怎么办',
  '给我讲个轻松点的话题',
]

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatPage({
  messages,
  onSendMessage,
  onSpeakLastReply,
  onStopSpeak,
}: ChatPageProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('支持连续多轮对话，也支持直接说出提醒或不适症状。')
  const deferredMessages = useDeferredValue(messages)
  const hasAssistantReply = [...messages].some((item) => item.role === 'assistant')

  async function submitMessage(prefilled?: string) {
    const text = (prefilled ?? input).trim()
    if (!text) {
      setError('请先输入或说出内容。')
      return
    }

    setError('')
    setSending(true)
    try {
      await onSendMessage(text)
      setInput('')
      setHint(`已发送：${text}`)
    } catch {
      setError('发送失败，请稍后再试。')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <section className="voice-stage">
        <div className="panel-head">
          <div>
            <p className="section-kicker">陪伴页主动作</p>
            <h2 className="section-title">直接点语音，不必先输入文字。</h2>
          </div>
        </div>

        <p className="section-subtitle">
          识别完成后会自动发送。如果说到身体不适、胸痛、呼吸困难等高风险内容，系统会优先引导到应急区。
        </p>

        <VoiceButton
          disabled={sending}
          onTranscript={(text) => {
            setInput(text)
            setHint(`已识别：${text}`)
            return submitMessage(text)
          }}
        />

        <div className="btn-row compact">
          <button
            type="button"
            className="btn secondary"
            disabled={!hasAssistantReply}
            onClick={() => {
              void onSpeakLastReply()
            }}
          >
            播报助手回复
          </button>
          <button type="button" className="btn ghost" onClick={onStopSpeak}>
            停止播报
          </button>
        </div>

        <p className={`inline-feedback ${error ? 'error' : ''}`} aria-live="polite">
          {error || hint}
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">常见话题</p>
            <h2 className="section-title">不会说什么时，点一句就能开始。</h2>
          </div>
        </div>

        <div className="command-list" aria-label="常见陪伴话题">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              className="command-chip button-chip"
              disabled={sending}
              onClick={() => {
                setInput(topic)
                void submitMessage(topic)
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="panel conversation-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">对话记录</p>
            <h2 className="section-title">最近的内容会保留，便于回顾和追溯。</h2>
          </div>
        </div>

        <div className="chat-stream">
          {deferredMessages.map((item) => (
            <article key={item.id} className={`chat-item ${item.role}`}>
              <p className="chat-role">{item.role === 'user' ? '我说' : '助手回复'}</p>
              <p className="chat-text">{item.text}</p>
              <p className="chat-meta">{formatTime(item.createdAt)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">文字备用输入</p>
            <h2 className="section-title">如果语音不方便，再用文字补充。</h2>
          </div>
        </div>

        <label className="input-label" htmlFor="chat-input">
          输入内容
        </label>
        <textarea
          id="chat-input"
          className="input textarea chat-textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如：我今天有点头晕，应该先做什么？"
        />

        <div className="btn-row">
          <button type="button" className="btn primary" disabled={sending} onClick={() => void submitMessage()}>
            {sending ? '发送中...' : '发送文字内容'}
          </button>
        </div>
      </section>
    </>
  )
}
