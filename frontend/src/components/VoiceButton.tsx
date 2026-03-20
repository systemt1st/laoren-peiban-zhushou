import { useEffect, useState } from 'react'
import { BrowserSpeechRecognizer } from '../lib/webSpeech'

interface VoiceButtonProps {
  disabled?: boolean
  onTranscript: (text: string) => void
}

export function VoiceButton({ disabled = false, onTranscript }: VoiceButtonProps) {
  const [recognizer] = useState(() => new BrowserSpeechRecognizer())
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('点击按钮后开始说话')

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
      setHint('已停止监听')
      return
    }

    setError('')
    const started = recognizer.start({
      onFinalText(text) {
        setIsListening(false)
        setHint(`已识别：${text}`)
        onTranscript(text)
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

    setHint('正在听，请清晰说话...')
    setIsListening(true)
  }

  return (
    <div className="voice-box">
      <button
        type="button"
        className="voice-btn"
        disabled={disabled}
        onClick={toggleVoiceInput}
      >
        {isListening ? '停止语音输入' : '开始语音输入'}
      </button>
      <p className={`voice-status ${error ? 'error' : ''}`}>{error || hint}</p>
    </div>
  )
}
