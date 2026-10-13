/**
 * 极简音效：用 WebAudio 合成，无需外部音频资源。
 * 需在用户手势（如点击）触发的调用链中首次播放，以符合浏览器自动播放策略。
 */

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

function beep(freq: number, duration: number, type: OscillatorType, volume: number): void {
  const audio = getContext()
  if (!audio) return
  if (audio.state === 'suspended') {
    audio.resume().catch(() => undefined)
  }
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const now = audio.currentTime
  oscillator.type = type
  oscillator.frequency.value = freq
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(now)
  oscillator.stop(now + duration)
}

/** 掷骰：两声上行提示音。 */
export function playDice(): void {
  beep(320, 0.12, 'triangle', 0.1)
  window.setTimeout(() => beep(480, 0.16, 'triangle', 0.1), 90)
}

/** 落子：一声轻点。 */
export function playMove(): void {
  beep(220, 0.08, 'sine', 0.07)
}
