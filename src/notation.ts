import { Accidental, Beam, Dot, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow'
import type { Event, Lesson } from './lessons'

const durations = new Map([[0.5, '8'], [1, '4'], [1.5, '4'], [2, '2'], [3, '2'], [4, 'w']])

function drawNote(event: Event, clef: string, accidentals: Map<string, string>, key: string): StaveNote {
  const rest = event.notes.length === 0
  const keys = rest ? [clef === 'treble' ? 'b/4' : 'd/3'] :
    event.notes.map(({ spelling }) => `${spelling.slice(0, -1).toLowerCase()}/${spelling.at(-1)}`)
  const duration = durations.get(event.duration)!
  const dotted = event.duration === 1.5 || event.duration === 3
  const note = new StaveNote({ clef, keys, duration: rest ? duration + 'r' : duration, dots: dotted ? 1 : 0 })
  if (dotted) Dot.buildAndAttach([note], { all: true })
  event.notes.forEach(({ spelling }, index) => {
    const position = spelling[0] + spelling.at(-1)
    const accidental = spelling.slice(1, -1) || 'n'
    const signatureAccidental = key === 'G' && spelling[0] === 'F' ? '#' : key === 'F' && spelling[0] === 'B' ? 'b' : 'n'
    const previous = accidentals.get(position) ?? signatureAccidental
    if (accidental !== previous) note.addModifier(new Accidental(accidental), index)
    accidentals.set(position, accidental)
  })
  return note
}

export function renderScore(container: HTMLElement, lesson: Lesson): void {
  container.replaceChildren()
  const grand = lesson.hands.length === 2
  for (let measure = 0; measure < lesson.measures; measure++) {
    const start = measure * lesson.meter
    const cell = document.createElement('div')
    cell.className = 'measure'
    cell.dataset.measure = String(measure + 1)
    const number = document.createElement('span')
    number.textContent = String(measure + 1)
    const score = document.createElement('div')
    cell.append(number, score)
    container.append(cell)

    const width = 310
    const height = grand ? 211 : 126
    const renderer = new Renderer(score, Renderer.Backends.SVG)
    renderer.resize(width, height)
    const context = renderer.getContext()
    const parts = lesson.hands.map((hand, index) => {
      const clef = hand === 'right' ? 'treble' : 'bass'
      const stave = new Stave(17, index * 105 + 3, width - 25)
      stave.addClef(clef)
      if (lesson.key !== 'C') stave.addKeySignature(lesson.key)
      if (measure === 0) stave.addTimeSignature(`${lesson.meter}/4`)
      stave.setContext(context).draw()
      const events = lesson.events.filter(event => event.hand === hand && event.beat >= start && event.beat < start + lesson.meter)
      const accidentals = new Map<string, string>()
      const notes = events.map(event => drawNote(event, clef, accidentals, lesson.key))
      const voice = new Voice({ numBeats: lesson.meter, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes)
      return { stave, voice, notes, events, beams: Beam.generateBeams(notes) }
    })
    if (grand) new StaveConnector(parts[0].stave, parts[1].stave).setType(StaveConnector.type.BRACE).setContext(context).draw()
    const noteStart = Math.max(...parts.map(part => part.stave.getNoteStartX()))
    const formatter = new Formatter()
    parts.forEach(part => {
      part.stave.setNoteStartX(noteStart)
      formatter.joinVoices([part.voice])
    })
    formatter.format(parts.map(part => part.voice), width - noteStart - 28)
    parts.forEach(({ stave, voice, notes, events, beams }) => {
      voice.draw(context, stave)
      beams.forEach(beam => beam.setContext(context).draw())
      notes.forEach((note, index) => {
        const element = note.getSVGElement()
        if (element) {
          element.dataset.beat = String(events[index].beat)
          element.dataset.hand = events[index].hand
        }
      })
    })
    const svg = score.querySelector('svg')!
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.setAttribute('aria-hidden', 'true')
  }
}
