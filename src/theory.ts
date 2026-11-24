import { Accidental, Dot, Formatter, Renderer, Stave, StaveNote } from 'vexflow'
import type { PianoAudio } from './audio'
import type { TheoryLesson, TheoryValue, TheoryVisual } from './lessons'

const values: Record<TheoryValue, { notation: string; beats: number; appearance: string; rest: string }> = {
  sixteenth: { notation: '16', beats: 0.25, appearance: 'filled note head with a stem and two flags', rest: 'rest with two hooks' },
  eighth: { notation: '8', beats: 0.5, appearance: 'filled note head with a stem and one flag', rest: 'rest with one hook' },
  quarter: { notation: '4', beats: 1, appearance: 'filled note head with a stem', rest: 'zigzag rest symbol' },
  'dotted-quarter': { notation: '4', beats: 1.5, appearance: 'filled note head with a stem and a dot', rest: 'zigzag rest with a dot' },
  half: { notation: '2', beats: 2, appearance: 'hollow note head with a stem', rest: 'small block sitting on a staff line' },
  'dotted-half': { notation: '2', beats: 3, appearance: 'hollow note head with a stem and a dot', rest: 'small block sitting on a staff line with a dot' },
  whole: { notation: 'w', beats: 4, appearance: 'hollow note head without a stem', rest: 'small block hanging beneath a staff line' },
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  if (className) node.className = className
  return node
}

function staffPosition(pitch: string, clef: 'treble' | 'bass'): string {
  const letters = 'CDEFGAB'
  const step = Number(pitch.at(-1)) * 7 + letters.indexOf(pitch[0]) - (clef === 'treble' ? 30 : 18)
  if (step >= 0 && step <= 8) return step % 2 ? `space ${(step + 1) / 2} from the bottom` : `line ${step / 2 + 1} from the bottom`
  const distance = step < 0 ? -step : step - 8
  const side = step < 0 ? 'below' : 'above'
  return distance % 2 ? `in a space ${side} the staff, ${Math.floor(distance / 2)} ledger lines away` :
    `on ledger line ${distance / 2} ${side} the staff`
}

function drawNotation(visual: TheoryVisual): HTMLElement {
  const box = element('div', undefined, 'theory-notation')
  box.setAttribute('role', 'img')
  const clef = visual.type === 'note' ? visual.clef : 'treble'
  const renderer = new Renderer(box, Renderer.Backends.SVG)
  renderer.resize(176, 117)
  const context = renderer.getContext()
  const stave = new Stave(9, 0, 157).addClef(clef)
  if (visual.type === 'meter') {
    stave.addTimeSignature(visual.signature)
    box.setAttribute('aria-label', `Time signature ${visual.signature.replace('/', ' over ')}`)
  } else if (visual.type === 'note') {
    box.setAttribute('aria-label', `${clef} clef, ${staffPosition(visual.pitch, clef)}, ${values[visual.value].appearance}`)
  } else {
    box.setAttribute('aria-label', values[visual.value].rest)
  }
  stave.setContext(context).draw()
  if (visual.type !== 'meter') {
    const pitch = visual.type === 'note' ? visual.pitch : 'b4'
    const dotted = visual.value.startsWith('dotted-')
    const duration = values[visual.value].notation + (visual.type === 'rest' ? 'r' : '')
    const key = `${pitch.slice(0, -1).toLowerCase()}/${pitch.at(-1)}`
    const note = new StaveNote({ clef, keys: [key], duration, dots: dotted ? 1 : 0 })
    const accidental = pitch.slice(1, -1)
    if (accidental) note.addModifier(new Accidental(accidental), 0)
    if (dotted) Dot.buildAndAttach([note], { all: true })
    Formatter.FormatAndDraw(context, stave, [note])
  }
  const svg = box.querySelector('svg')!
  svg.setAttribute('viewBox', '0 0 176 117')
  svg.setAttribute('aria-hidden', 'true')
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  return box
}

export function renderTheory(root: HTMLElement, lesson: TheoryLesson, audio: PianoAudio, complete: () => void): () => void {
  const examples = element('section', undefined, 'theory-examples')
  const grid = element('div', undefined, 'theory-grid')
  const overview = element('div', undefined, 'theory-section-heading')
  const jump = element('button', 'Go to questions')
  overview.append(element('h2', 'Look and listen'), jump)
  examples.append(overview, grid)
  const quiz = element('section', undefined, 'theory-quiz')
  quiz.setAttribute('aria-label', 'Check your reading')
  jump.onclick = () => quiz.querySelector('h2')?.focus()
  root.append(examples, quiz)

  let activeButton: HTMLButtonElement | undefined
  let activePulses: HTMLElement[] = []
  let frame = 0
  let generation = 0

  function stop(): void {
    generation++
    cancelAnimationFrame(frame)
    audio.stopPlayback()
    if (activeButton) {
      activeButton.textContent = 'Hear example'
      activeButton.setAttribute('aria-pressed', 'false')
    }
    activeButton = undefined
    activePulses.forEach(pulse => pulse.classList.remove('pulse-current'))
    activePulses = []
  }

  for (const { label, explanation, visual } of lesson.examples) {
    const card = element('article', undefined, 'theory-card')
    const meter = visual.type === 'meter' ? visual.signature.split('/').map(Number) : undefined
    const count = meter ? meter[0] : 4
    const beats = visual.type === 'meter' ? count : values[visual.value].beats
    const beatSeconds = meter ? 0.66 * 4 / meter[1] : 0.66
    const markers = element('div', undefined, 'theory-example-beats')
    markers.style.setProperty('--beat-count', String(count))
    markers.setAttribute('aria-hidden', 'true')
    const duration = element('span', undefined, 'theory-example-duration')
    duration.style.width = `${beats / count * 100}%`
    markers.append(duration)
    const pulses = Array.from({ length: count }, (_, index) => {
      const pulse = element('span', String(index + 1), 'theory-pulse')
      if (index === 0 || (visual.type === 'meter' && visual.signature === '6/8' && index === 3)) pulse.classList.add('accent')
      markers.append(pulse)
      return pulse
    })
    const hear = element('button', 'Hear example')
    hear.type = 'button'
    hear.setAttribute('aria-pressed', 'false')
    hear.onclick = async () => {
      if (activeButton === hear) {
        stop()
        return
      }
      stop()
      const current = generation
      activeButton = hear
      activePulses = pulses
      hear.textContent = 'Stop example'
      hear.setAttribute('aria-pressed', 'true')
      try {
        const context = await audio.start()
        if (generation !== current) return
        audio.beginPlayback()
        const start = context.currentTime + 0.08
        if (visual.type === 'note') audio.play(visual.midi, start, beats * beatSeconds)
        for (let i = 0; i < Math.ceil(beats); i++) {
          audio.click(start + i * beatSeconds, pulses[i].classList.contains('accent'))
        }
        function tick(): void {
          if (generation !== current) return
          const elapsed = (context.currentTime - start) / beatSeconds
          pulses.forEach((pulse, index) => pulse.classList.toggle('pulse-current', index === Math.floor(elapsed)))
          if (elapsed < beats + 0.1) frame = requestAnimationFrame(tick)
          else stop()
        }
        tick()
      } catch {
        if (generation === current) stop()
      }
    }
    card.append(element('h3', label), drawNotation(visual), markers, element('p', explanation), hear)
    grid.append(card)
  }

  let index = 0
  function showQuestion(focus = false): void {
    const question = lesson.questions[index]
    const heading = element('h2', 'Check your reading')
    heading.tabIndex = -1
    if (!question) {
      complete()
      const retry = element('button', 'Try again')
      retry.onclick = () => { index = 0; showQuestion(true) }
      quiz.replaceChildren(heading, element('p', '✓ Lesson complete.', 'theory-success'), retry)
    } else {
      const prompt = element('p', question.prompt, 'theory-prompt')
      const selection = element('div', undefined, 'theory-choices')
      const feedback = element('p', '', 'theory-feedback')
      feedback.setAttribute('role', 'status')
      const next = element('button', index + 1 === lesson.questions.length ? 'Finish lesson' : 'Next question')
      next.hidden = true
      next.onclick = () => { index++; showQuestion(true) }
      for (const option of question.choices) {
        const button = element('button', option)
        button.onclick = () => {
          if (option !== question.answer) {
            feedback.textContent = '↻ Try again.'
            feedback.dataset.result = 'retry'
            return
          }
          feedback.textContent = `✓ ${question.explanation}`
          feedback.dataset.result = 'correct'
          for (const choice of selection.querySelectorAll('button')) choice.disabled = true
          button.classList.add('theory-correct')
          next.hidden = false
          next.focus()
        }
        selection.append(button)
      }
      const counter = element('p', `Question ${index + 1} of ${lesson.questions.length}`, 'theory-counter')
      quiz.replaceChildren(heading, counter, prompt, ...(question.visual ? [drawNotation(question.visual)] : []), selection, feedback, next)
    }
    if (focus) heading.focus()
  }
  showQuestion()
  return stop
}
