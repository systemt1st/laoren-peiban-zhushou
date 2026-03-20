import { useDeferredValue, useState } from 'react'
import { VoiceButton } from '../components/VoiceButton'
import type { ChatMessage } from '../types'

interface ChatPageProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => Promise<void>
  onSpeakLastReply: () => Promise<void>
  onStopSpeak: () => void
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
  const [hint, setHint] = useState('')
  const deferredMessages = useDeferredValue(messages)
  const hasAssistantReply = [...messages].some((item) => item.role === 'assistant')

  async function submitMessage() {
    const text = input.trim()
    if (!text) {
      setError('请先输入或说出内容。')
      return
    }
    setError('')
    setSending(true)
    try {
      await onSendMessage(text)
      setInput('')
    } catch {
      setError('发送失败，请稍后再试。')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <section className="panel">
        <h2 className="panel-title">陪伴对话</h2>
        <p className="panel-subtitle">可以直接语音输入，系统会给出陪伴回复与风险提示。</p>

        <div className="chat-stream">
          {deferredMessages.map((item) => (
            <article key={item.id} className={`chat-item ${item.role}`}>
              <p>{item.text}</p>
              <p className="chat-meta">
                {item.role === 'user' ? '我' : '助手'} ·{' '}
                {new Date(item.createdAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </article>
          ))}
        </div>

        <div className="composer">
          <label className="input-label" htmlFor="chat-input">
            输入内容
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如：今天有点头晕，怎么办？"
          />

          <VoiceButton
            disabled={sending}
            onTranscript={(text) => {
              setInput(text)
              setHint(`已填入语音内容：${text}`)
            }}
          />

          <div className="btn-row">
            <button type="button" className="btn primary" disabled={sending} onClick={submitMessage}>
              {sending ? '发送中...' : '发送'}
            </button>
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

          <p className={`voice-status ${error ? 'error' : ''}`}>{error || hint || '支持连续多轮对话。'}</p>
        </div>
      </section>
    </>
  )
}
