interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor
  webkitSpeechRecognition?: SpeechRecognitionCtor
}

export interface VoiceStartOptions {
  lang?: string
  onFinalText: (text: string) => void
  onError?: (message: string) => void
}

function getSpeechRecognitionCtor() {
  const speechWindow = window as SpeechWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}

export class BrowserSpeechRecognizer {
  private recognition: SpeechRecognitionLike | null = null
  private listening = false

  isSupported() {
    return Boolean(getSpeechRecognitionCtor())
  }

  isListening() {
    return this.listening
  }

  start(options: VoiceStartOptions) {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      return false
    }

    this.stop()
    const recognition = new Ctor()
    recognition.lang = options.lang ?? 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0]?.transcript ?? ''
        }
      }
      if (finalText.trim().length > 0) {
        options.onFinalText(finalText.trim())
      }
    }

    recognition.onerror = (event) => {
      this.listening = false
      const reason = event.error ?? '语音识别失败'
      options.onError?.(reason)
    }

    recognition.onend = () => {
      this.listening = false
    }

    this.recognition = recognition
    recognition.start()
    this.listening = true
    return true
  }

  stop() {
    if (!this.recognition) {
      return
    }
    this.recognition.stop()
    this.listening = false
  }
}

export function supportsSpeechSynthesis() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function cancelSpeak() {
  if (!supportsSpeechSynthesis()) {
    return
  }
  window.speechSynthesis.cancel()
}

export function speakText(text: string, lang = 'zh-CN') {
  if (!supportsSpeechSynthesis()) {
    return Promise.reject(new Error('SpeechSynthesis is unsupported'))
  }

  cancelSpeak()

  return new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95
    utterance.pitch = 1

    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('语音播报失败'))

    window.speechSynthesis.speak(utterance)
  })
}
