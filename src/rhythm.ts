import type { Event, Hands, Lesson } from './lessons'

function durationText(event: Event): string {
  const name = event.notes.map(note => note.spelling).join(' + ') || 'Rest'
  return `${name} · ${event.duration} ${event.duration === 1 ? 'beat' : 'beats'}`
}

export class RhythmDisplay {
  private readonly pulses: HTMLElement[]
  private readonly lanes: HTMLElement
  private readonly cursor: HTMLElement
  private readonly summary: HTMLElement
  private hands?: Hands
  private measureStart = -1
  private lastPulse = -1
  private lastPosition = -1
  private blocks: { event: Event; element: HTMLElement }[] = []

  constructor(private readonly root: HTMLElement, private readonly lesson: Lesson, private readonly onNotes: (events: Event[]) => void) {
    this.root.style.setProperty('--meter', String(lesson.meter))
    this.root.innerHTML = `
      <div class="rhythm-heading"><h2>Beat & duration</h2><span id="rhythm-summary"></span></div>
      <div class="rhythm-pulses" aria-hidden="true">
        ${Array.from({ length: lesson.meter }, (_, index) => `<span class="rhythm-beat">${index + 1}</span>`).join('')}
      </div>
      <div class="rhythm-timeline" aria-hidden="true"><div class="rhythm-lanes"></div><span class="rhythm-cursor" hidden></span></div>`
    this.pulses = [...root.querySelectorAll<HTMLElement>('.rhythm-beat')]
    this.lanes = root.querySelector('.rhythm-lanes')!
    this.cursor = root.querySelector('.rhythm-cursor')!
    this.summary = root.querySelector('#rhythm-summary')!
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
        lane.append(element)
        this.blocks.push({ event, element })
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
    this.blocks.forEach(block => block.element.classList.remove('sounding'))
    this.summary.textContent = ''
    this.onNotes([])
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
