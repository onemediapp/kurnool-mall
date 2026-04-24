// Browser-only audio helpers. Uses an HTMLAudioElement when /sounds/order-alert.mp3
// exists and falls back to a Web Audio beep otherwise.

let cachedAudio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (cachedAudio) return cachedAudio
  try {
    cachedAudio = new Audio('/sounds/order-alert.mp3')
    cachedAudio.preload = 'auto'
    cachedAudio.volume = 0.7
  } catch {
    cachedAudio = null
  }
  return cachedAudio
}

function beepFallback(durationMs = 600, frequency = 880): void {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctx = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    /* no-op */
  }
}

export function playOrderAlert(): void {
  const audio = getAudio()
  if (!audio) {
    beepFallback()
    return
  }
  try {
    audio.currentTime = 0
    const p = audio.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => beepFallback())
    }
  } catch {
    beepFallback()
  }
}
