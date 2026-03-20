import { useEffect, useState } from 'react'
import { BrowserSpeechRecognizer } from '../lib/webSpeech'

interface VoiceButtonProps {
  disabled?: boolean
  onTranscript: (text: string) => void | Promise<void>
}

function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15a3.75 3.75 0 0 0 3.75-3.75v-3a3.75 3.75 0 0 0-7.5 0v3A3.75 3.75 0 0 0 12 15Z" />
      <path d="M6.75 11.25a5.25 5.25 0 0 0 10.5 0m-5.25 5.25v3.75m-3.75 0h7.5" />
    </svg>
  )
}

export function VoiceButton({ disabled = false, onTranscript }: VoiceButtonProps) {
  const [recognizer] = useState(() => new BrowserSpeechRecognizer())
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('点击后直接说话，识别完成会自动发送。')

  useEffect(() => {
    return () => {
      recognizer.stop()
    }
  }, [recognizer])

  function toggleVoiceInput() {
    if (!recognizer.isSupported()) {
      setError('当前浏览器不支持语音识别，请改用文字输入。')
      return
    }

    if (isListening) {
      recognizer.stop()
      setIsListening(false)
      setHint('已停止监听，您可以再次点击开始说话。')
      return
    }

    setError('')
    const started = recognizer.start({
      onFinalText(text) {
        setIsListening(false)
        setHint(`已识别：${text}`)
        void onTranscript(text)
      },
      onError(message) {
        setIsListening(false)
        setError(`识别失败：${message}`)
      },
    })

    if (!started) {
      setError('无法启动语音识别，请检查浏览器权限。')
      return
    }

    setHint('正在倾听，请用平稳语速清晰说话。')
    setIsListening(true)
  }

  return (
    <div className={`voice-panel ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        className={`voice-button ${isListening ? 'listening' : ''}`}
        disabled={disabled}
        aria-pressed={isListening}
        aria-label={isListening ? '停止语音输入' : '开始语音输入'}
        onClick={toggleVoiceInput}
      >
        <span className="voice-button-ring" />
        <span className="voice-button-core">
          <MicrophoneIcon />
        </span>
      </button>

      <div className="voice-copy">
        <p className="voice-title">{isListening ? '正在听您说话' : '点一下，直接开口'}</p>
        <p className={`voice-status ${error ? 'error' : ''}`} aria-live="polite">
          {error || hint}
        </p>
      </div>
    </div>
  )
}
