export class PianoAudio {
  private context?: AudioContext
  private output?: GainNode
  private live = new Map<number, () => void>()
  private playback?: GainNode
  private sustain = false
  private sustained = new Map<number, () => void>()

  async start(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext()
      this.output = this.context.createGain()
      this.output.gain.value = 0.55
      const limiter = this.context.createDynamicsCompressor()
      this.output.connect(limiter).connect(this.context.destination)
    }
    await this.context.resume()
    return this.context
  }

  private voice(pitch: number, at: number, duration: number | undefined, output: GainNode, velocity: number): () => void {
    const context = this.context!
    const gain = context.createGain()
    const frequency = 440 * 2 ** ((pitch - 69) / 12)
    const releaseAt = at + (duration ?? 6)
    const level = Math.max(0.02, velocity * 0.24)
    gain.gain.setValueAtTime(0.001, at)
    gain.gain.exponentialRampToValueAtTime(level, at + 0.009)
    gain.gain.setTargetAtTime(level * 0.14, at + 0.025, 0.24)
    gain.gain.setTargetAtTime(0.0001, releaseAt, 0.06)
    gain.connect(output)

    const oscillators = [1, 2.001, 3.004].map((harmonic, index) => {
      const oscillator = context.createOscillator()
      const partial = context.createGain()
      partial.gain.value = [1, 0.25, 0.08][index]
      oscillator.frequency.value = frequency * harmonic
      oscillator.connect(partial).connect(gain)
      oscillator.start(at)
      oscillator.stop(releaseAt + 0.32)
      return oscillator
    })
    oscillators[0].onended = () => gain.disconnect()
    return () => {
      const now = context.currentTime
      gain.gain.cancelAndHoldAtTime(now)
      gain.gain.setTargetAtTime(0.0001, now, 0.035)
      if (now < releaseAt) oscillators.forEach(oscillator => oscillator.stop(now + 0.22))
    }
  }

  async press(pitch: number, velocity: number, isHeld: () => boolean): Promise<void> {
    const context = await this.start()
    if (!isHeld() || this.live.has(pitch)) return
    this.sustained.get(pitch)?.()
    this.sustained.delete(pitch)
    this.live.set(pitch, this.voice(pitch, context.currentTime, undefined, this.output!, velocity))
  }

  release(pitch: number): void {
    const voice = this.live.get(pitch)
    if (!voice) return
    this.live.delete(pitch)
    if (this.sustain) this.sustained.set(pitch, voice)
    else voice()
  }

  setSustain(down: boolean): void {
    this.sustain = down
    if (down) return
    for (const voice of this.sustained.values()) voice()
    this.sustained.clear()
  }

  beginPlayback(): void {
    this.stopPlayback()
    this.playback = this.context!.createGain()
    this.playback.connect(this.output!)
  }

  stopPlayback(): void {
    if (!this.playback) return
    this.playback.disconnect()
    this.playback = undefined
  }

  play(pitch: number, at: number, duration: number): void {
    if (this.playback) this.voice(pitch, at, duration, this.playback, 0.65)
  }

  click(at: number, accent: boolean): void {
    if (this.playback) this.voice(accent ? 93 : 84, at, 0.035, this.playback, 0.42)
  }
}
