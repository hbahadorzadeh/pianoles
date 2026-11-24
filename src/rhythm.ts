import type { Event, Hands, Lesson } from './lessons'
import type { TimingFeedback } from './practice'

function durationText(event: Event): string {
  const name = event.notes.map(note => note.spelling).join(' + ') || 'Rest'
  return `${name} · ${event.duration} ${event.duration === 1 ? 'beat' : 'beats'}`
}

export class RhythmDisplay {
  private readonly pulses: HTMLElement[]
  private readonly lanes: HTMLElement
  private readonly cursor: HTMLElement
  private readonly summary: HTMLElement
  private readonly feedback: HTMLElement
  private readonly timing = new Map<Event, { feedback: TimingFeedback; difference: number }>()
  private hands?: Hands
  private measureStart = -1
  private lastPulse = -1
  private lastPosition = -1
  private blocks: { event: Event; element: HTMLElement; fill: HTMLElement }[] = []

  constructor(private readonly root: HTMLElement, private readonly lesson: Lesson, private readonly onNotes: (events: Event[]) => void) {
    this.root.style.setProperty('--meter', String(lesson.meter))
    this.root.innerHTML = `
      <div class="rhythm-heading"><h2>Beat & duration</h2><span id="rhythm-summary"></span></div>
      <div class="rhythm-pulses" aria-hidden="true">
        ${Array.from({ length: lesson.meter }, (_, index) => `<span class="rhythm-beat">${index + 1}</span>`).join('')}
      </div>
      <div class="rhythm-timeline" aria-hidden="true"><div class="rhythm-lanes"></div><span class="rhythm-cursor" hidden></span></div>
      <p id="rhythm-feedback" role="status" hidden></p>`
    this.pulses = [...root.querySelectorAll<HTMLElement>('.rhythm-beat')]
    this.lanes = root.querySelector('.rhythm-lanes')!
    this.cursor = root.querySelector('.rhythm-cursor')!
    this.summary = root.querySelector('#rhythm-summary')!
    this.feedback = root.querySelector('#rhythm-feedback')!
  }

  private pulse(index: number): void {
    if (index === this.lastPulse) return
    this.pulses[this.lastPulse]?.classList.remove('on-beat')
    this.pulses[index]?.classList.add('on-beat')
    this.lastPulse = index
  }

  private measure(hands: Hands, beat: number): void {
    const start = Math.floor(beat / this.lesson.meter) * this.lesson.meter
    if (start === this.measureStart && hands === this.hands) return
    this.hands = hands
    this.measureStart = start
    this.lastPosition = -1
    this.blocks = []
    const lanes = this.lesson.hands.filter(hand => hands === 'both' || hand === hands).map(hand => {
      const lane = document.createElement('div')
      lane.className = `rhythm-lane ${hand}`
      for (const event of this.lesson.events) {
        if (event.hand !== hand || event.beat < start || event.beat >= start + this.lesson.meter) continue
        const element = document.createElement('span')
        element.className = event.notes.length ? 'rhythm-note' : 'rhythm-note rhythm-rest'
        element.style.setProperty('--start', `${(event.beat - start) / this.lesson.meter * 100}%`)
        element.style.setProperty('--length', `${event.duration / this.lesson.meter * 100}%`)
        element.title = durationText(event)
        const fill = document.createElement('span')
        fill.className = 'rhythm-fill'
        element.append(fill)
        lane.append(element)
        this.blocks.push({ event, element, fill })
        const timing = this.timing.get(event)
        if (timing) element.dataset.timing = timing.feedback
      }
      return lane
    })
    this.lanes.replaceChildren(...lanes)
  }

  preview(hands: Hands, beat: number): void {
    this.measure(hands, beat)
    this.pulse(-1)
    this.cursor.hidden = true
    this.lastPosition = -1
    this.clearTiming()
    this.blocks.forEach(({ element, fill }) => {
      element.classList.remove('sounding')
      fill.style.transform = 'scaleX(0)'
    })
    this.summary.textContent = ''
    this.onNotes([])
  }

  clearTiming(keepSpace = false): void {
    this.timing.clear()
    this.blocks.forEach(({ element }) => delete element.dataset.timing)
    this.feedback.textContent = ''
    delete this.feedback.dataset.timing
    this.feedback.hidden = !keepSpace
  }

  recordTiming(
    hands: Hands, beat: number, pitch: number, feedback: TimingFeedback, difference: number,
  ): void {
    for (const event of this.lesson.events) {
      if (event.beat !== beat || (hands !== 'both' && event.hand !== hands) ||
        !event.notes.some(note => note.midi === pitch)) continue
      const previous = this.timing.get(event)
      if (previous && Math.abs(previous.difference) > Math.abs(difference)) continue
      this.timing.set(event, { feedback, difference })
      const block = this.blocks.find(block => block.event === event)
      if (block) block.element.dataset.timing = feedback
    }
    const messages = { early: '↑ Early', 'on-beat': '✓ On beat', late: '↓ Late' }
    this.feedback.dataset.timing = feedback
    this.feedback.textContent = messages[feedback]
    this.feedback.hidden = false
  }

  guideDuration(beat: number, elapsedBeats: number): boolean {
    let filling = false
    for (const { event, fill } of this.blocks) {
      if (event.beat !== beat || !event.notes.length) continue
      const fraction = Math.min(1, elapsedBeats / event.duration)
      fill.style.transform = `scaleX(${fraction})`
      filling ||= fraction < 1
    }
    return filling
  }

  countIn(position: number): void {
    this.pulse(position < 0 ? -1 : Math.floor(position) % this.lesson.meter)
  }

  show(hands: Hands, beat: number, startingOnly = false): void {
    this.measure(hands, beat)
    const position = beat - this.measureStart
    this.pulse(Math.floor(position))
    this.cursor.hidden = false
    this.cursor.style.left = `${position / this.lesson.meter * 100}%`
    for (const { event, fill } of this.blocks) {
      const fraction = startingOnly ? 0 : Math.min(1, Math.max(0, (beat - event.beat) / event.duration))
      fill.style.transform = `scaleX(${fraction})`
    }
    const subdivision = Math.floor(beat * 2)
    if (subdivision === this.lastPosition) return
    this.lastPosition = subdivision
    const labels = []
    const notes = []
    for (const { event, element } of this.blocks) {
      const sounding = event.beat <= beat && beat < event.beat + event.duration
      element.classList.toggle('sounding', sounding)
      if (sounding) {
        labels.push(durationText(event))
        if (event.notes.length && (!startingOnly || event.beat === beat)) notes.push(event)
      }
    }
    this.summary.textContent = labels.join(' / ')
    this.onNotes(notes)
  }
}
