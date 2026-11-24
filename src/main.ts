import './style.css'
import { PianoAudio } from './audio'
import { lessons, units } from 'virtual:lesson-catalog'
import { pianoRange, type Event, type Hands, type Lesson } from './lessons'
import { renderScore } from './notation'
import { matchTiming, matchesChord, practiceSteps, releasedEarly, scoreAttempt, timingFeedbackWindow, timingTolerance, type Hit, type Step } from './practice'
import { loadProgress, readKidsMode, saveKidsMode, saveProgress } from './progress'
import { RhythmDisplay } from './rhythm'
import { pedalAt, playbackBeats } from './pedal'
import { handDiagram, hasFingerings } from './fingering'

const app = document.querySelector<HTMLDivElement>('#app')!
let kidsMode = readKidsMode()
const adultProgress = loadProgress(false)
const kidsProgress = loadProgress(true)
let progress = kidsMode ? kidsProgress : adultProgress
let rhythm: RhythmDisplay | undefined
let fingerEvents: Event[] = []
const audio = new PianoAudio()
const held = new Map<string, number>()
const pressed = new Set<number>()
const pressedAt = new Map<number, number>()
const noteHolds = new Map<number, { events: Event[]; started: number; beatMs: number }>()
const freshChord = new Set<number>()
const keys = new Map<number, HTMLButtonElement>()
const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const keyRows = [
  ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'],
  ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u', 'i', '9', 'o', '0', 'p', '['],
]
let lesson: Lesson
let guided: Step[] | undefined
let guidedPrevious: { beat: number; started: number } | undefined
let stepIndex = 0
let timed: {
  start: number
  secondsPerBeat: number
  hits: Hit[]
  context: AudioContext
  steps: Step[]
  claimed: Map<number, Set<number>>
  hands: Hands
  offset: number
} | undefined
let active = false
let followingTempo = false
let generation = 0
let animation = 0
let pitchOffset = 0
const shortcuts = new Map<string, number>()
let keyboardOctave = 3
let highlighted = -1
let hintPitches: ReadonlySet<number> = new Set()
let hintPreference: boolean | undefined
let midiAccess: MIDIAccess | undefined
let midiInput: MIDIInput | undefined
let midiRequestPending = false
let midiStatus = ''
let midiLastNote = ''
let screenPedal = false
const midiPedalChannels = new Set<number>()
let expectedPedal: boolean | undefined

function escapeText(value: string): string {
  return value.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]!)
}

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function status(message: string): void {
  const feedback = element('feedback')
  if (feedback.textContent !== message) feedback.textContent = message
}

function updateSidebar(): void {
  element('completion').textContent = `${Object.keys(progress.completed).length} of ${lessons.length} lessons complete`
  element<HTMLProgressElement>('course-progress').value = Object.keys(progress.completed).length
  document.querySelectorAll<HTMLAnchorElement>('.lesson-link').forEach(link => {
    const id = Number(link.dataset.lesson)
    link.querySelector('.check')!.textContent = progress.completed[id] ? '✓' : ''
  })
  const best = progress.best[lesson.id]
  element('best').textContent = best ? `Best full attempt · ${best.pitch}% pitch · ${best.timing}% timing` : ''
}

function stop(keepRhythm = false): void {
  generation++
  guided = undefined
  guidedPrevious = undefined
  freshChord.clear()
  timed = undefined
  if (!keepRhythm) noteHolds.clear()
  active = false
  followingTempo = false
  updatePedalCue()
  cancelAnimationFrame(animation)
  audio.stopPlayback()
  const stopButton = element<HTMLButtonElement>('stop')
  if (stopButton) stopButton.disabled = true
  highlight(-1)
  setHintPitches(new Set())
  if (rhythm && !keepRhythm) {
    const { hands, first } = settings()
    rhythm.preview(hands, (first - 1) * lesson.meter)
  }
  kidsCue('ready')
}

function kidsCue(cue: 'ready' | 'play' | 'listen' | 'correct' | 'retry' | 'done'): void {
  const indicator = element('kids-cue')
  if (!indicator) return
  const symbols = { ready: '▶︎', play: '👆', listen: '♫', correct: '✓', retry: '↻', done: '★' }
  indicator.textContent = symbols[cue]
  indicator.dataset.cue = cue
}

function highlight(beat: number, sounding?: Event[]): void {
  if (highlighted === beat) return
  highlighted = beat
  document.querySelectorAll('.current-note,.current-measure').forEach(node => node.classList.remove('current-note', 'current-measure'))
  if (beat < 0) return
  const measure = Math.floor(beat / lesson.meter) + 1
  const cell = document.querySelector<HTMLElement>(`[data-measure="${measure}"]`)
  cell?.classList.add('current-measure')
  const selectors = sounding
    ? sounding.map(event => `[data-beat="${event.beat}"][data-hand="${event.hand}"]`)
    : [`[data-beat="${beat}"]`]
  if (selectors.length) cell?.querySelectorAll(selectors.join(',')).forEach(node => node.classList.add('current-note'))
  const strip = element('score')
  if (cell && (cell.offsetLeft < strip.scrollLeft || cell.offsetLeft + cell.offsetWidth > strip.scrollLeft + strip.clientWidth)) {
    strip.scrollTo({ left: cell.offsetLeft, behavior: kidsMode ? 'instant' : 'smooth' })
  }
}

function guidedInterval(from: number, to: number, passageBeats: number): number {
  return to > from ? to - from : to + passageBeats - from
}

function showGuidedStep(): void {
  const step = guided?.[stepIndex]
  if (!step) return
  const beat = step.beat + pitchOffset
  const { hands, bpm, first, last } = settings()
  highlight(beat)
  setHintPitches(step.pitches)
  const previous = guidedPrevious
  rhythm?.showGuided(hands, beat, previous?.beat)
  updatePedalCue(previous?.beat ?? beat)
  if (previous) {
    animateGuidedBar(previous.beat, previous.started, bpm, guidedInterval(previous.beat, beat, (last - first + 1) * lesson.meter))
  }
}

function animateGuidedBar(beat: number, started: number, bpm: number, expectedBeats: number): void {
  cancelAnimationFrame(animation)
  function fill(time: number): void {
    const elapsedBeats = Math.max(0, (time - started) * bpm / 60_000)
    updatePedalCue(beat + Math.min(elapsedBeats, expectedBeats))
    if (rhythm?.guideDuration(beat, elapsedBeats, expectedBeats)) animation = requestAnimationFrame(fill)
    else if (!active) updatePedalCue()
  }
  animation = requestAnimationFrame(fill)
}

function setHintPitches(pitches: ReadonlySet<number>): void {
  hintPitches = pitches
  refreshKeys()
  revealHintPitches()
}

function revealHintPitches(): void {
  if ((!followingTempo && !element<HTMLInputElement>('key-hints')?.checked) || !hintPitches.size) return
  const scroller = element('key-scroll')
  const first = keys.get(Math.min(...hintPitches))
  const last = keys.get(Math.max(...hintPitches))
  if (!first || !last) return

  const left = first.offsetLeft
  const right = last.offsetLeft + last.offsetWidth
  if (left < scroller.scrollLeft || right - left > scroller.clientWidth) {
    scroller.scrollLeft = left
  } else if (right > scroller.scrollLeft + scroller.clientWidth) {
    scroller.scrollLeft = right - scroller.clientWidth
  }
}

function refreshKeys(): void {
  const hints = followingTempo || element<HTMLInputElement>('key-hints')?.checked
  keys.forEach((key, pitch) => {
    key.classList.toggle('held', pressed.has(pitch))
    key.classList.toggle('hint', Boolean(hints && hintPitches.has(pitch)))
  })
}

function trackNoteHold(hands: Hands, beat: number, pitch: number, beatMs: number): void {
  const started = pressedAt.get(pitch)
  if (started === undefined || noteHolds.has(pitch)) return
  const events = lesson.events.filter(event => event.beat === beat &&
    (hands === 'both' || event.hand === hands) && event.notes.some(note => note.midi === pitch))
  if (events.length) noteHolds.set(pitch, { events, started, beatMs })
}

function press(source: string, pitch: number, velocity = 0.72): void {
  if (held.has(source)) return
  held.set(source, pitch)
  if (!pressed.has(pitch)) pressedAt.set(pitch, performance.now())
  pressed.add(pitch)
  void audio.press(pitch, velocity, () => pressed.has(pitch)).catch(() => {
    if (!active) status('Audio is unavailable. You can still use the notation and practice feedback.')
  })
  if (timed) {
    const elapsed = timed.context.currentTime - timed.start
    const hit = { pitch, beat: elapsed / timed.secondsPerBeat }
    if (elapsed >= -timingTolerance) timed.hits.push(hit)
    if (elapsed >= -timingFeedbackWindow) {
      const claimed = timed.claimed.get(pitch) ?? new Set()
      const match = matchTiming(timed.steps, hit, timed.secondsPerBeat, claimed)
      if (match) {
        claimed.add(match.beat)
        timed.claimed.set(pitch, claimed)
        const beat = match.beat + timed.offset
        rhythm?.recordTiming(timed.hands, beat, pitch, match.feedback, match.difference)
        trackNoteHold(timed.hands, beat, pitch, timed.secondsPerBeat * 1000)
      }
    }
  }
  if (guided) {
    freshChord.add(pitch)
    checkGuided()
  }
  refreshKeys()
}

function checkGuided(): void {
  if (!guided) return
  const step = guided[stepIndex]
  if ([...freshChord].some(pitch => !step.pitches.has(pitch))) {
    kidsCue('retry')
    status('That pitch is outside the highlighted note group. Release it and try again.')
    return
  }
  if (!matchesChord(step.pitches, freshChord)) {
    kidsCue('play')
    status('Play the highlighted note or chord to continue.')
    return
  }
  const { loop, full, hands, bpm, first, last } = settings()
  const beat = step.beat + pitchOffset
  const started = performance.now()
  if (guidedPrevious) {
    const elapsedBeats = (started - guidedPrevious.started) * bpm / 60_000
    const interval = guidedInterval(guidedPrevious.beat, beat, (last - first + 1) * lesson.meter)
    rhythm?.recordGuidedTransition(hands, guidedPrevious.beat, elapsedBeats, interval, bpm)
  }
  guidedPrevious = { beat, started }
  followingTempo = false
  for (const pitch of step.pitches) trackNoteHold(hands, beat, pitch, 60_000 / bpm)
  kidsCue('correct')
  freshChord.clear()
  stepIndex++
  if (stepIndex < guided.length) {
    status(`Correct · ${stepIndex} of ${guided.length} note groups`)
    showGuidedStep()
    return
  }
  if (loop) {
    stepIndex = 0
    status('Passage complete. Release the keys and repeat.')
    showGuidedStep()
    return
  }
  if (full) {
    progress.completed[lesson.id] = true
    saveProgress(progress, kidsMode)
    updateSidebar()
  }
  stop(true)
  rhythm?.showGuided(hands, undefined, beat)
  animateGuidedBar(beat, started, bpm, Math.max(...lesson.events
    .filter(event => event.beat === beat && event.notes.length && (hands === 'both' || event.hand === hands))
    .map(event => event.duration)))
  kidsCue('done')
  status(full ? 'Lesson complete. You can replay it or try timed practice.' : 'Practice complete.')
}

function release(source: string, measureHold = true): void {
  const pitch = held.get(source)
  if (pitch === undefined) return
  held.delete(source)
  if (![...held.values()].includes(pitch)) {
    pressed.delete(pitch)
    pressedAt.delete(pitch)
    const noteHold = noteHolds.get(pitch)
    noteHolds.delete(pitch)
    if (noteHold && measureHold) {
      const heldMs = performance.now() - noteHold.started
      for (const event of noteHold.events) {
        const writtenMs = event.duration * noteHold.beatMs
        if (releasedEarly(heldMs, writtenMs)) rhythm?.recordEarlyRelease(event, pitch, heldMs / writtenMs)
      }
    }
    const releasedWrongNote = freshChord.delete(pitch) && !guided?.[stepIndex].pitches.has(pitch)
    audio.release(pitch)
    if (releasedWrongNote && freshChord.size) checkGuided()
  }
  refreshKeys()
}

function settings() {
  const hands = element<HTMLSelectElement>('hands').value as Hands
  const loop = element<HTMLInputElement>('loop').checked
  const first = loop ? Number(element<HTMLSelectElement>('first').value) : 1
  const last = loop ? Number(element<HTMLSelectElement>('last').value) : lesson.measures
  const bpm = Number(element<HTMLInputElement>('tempo').value)
  const full = !loop && (hands === 'both' || lesson.hands.length === 1)
  return { hands, loop, first, last, bpm, full }
}

function countIntoFollowAlong(session: number): void {
  // Unlock audio while the Start guided click still has user activation.
  void audio.start().catch(() => {})
  const deadline = performance.now() + 5000
  let shown = 0
  function count(time: number): void {
    if (generation !== session || guidedPrevious) return
    if (midiInput?.onmidimessage) {
      followingTempo = false
      refreshKeys()
      kidsCue('play')
      status('Play the highlighted note or chord to start the bar.')
      return
    }
    const seconds = Math.ceil((deadline - time) / 1000)
    if (seconds <= 0) {
      void start('follow')
      return
    }
    if (seconds !== shown) {
      shown = seconds
      const cue = element('kids-cue')
      cue.dataset.cue = 'countdown'
      cue.textContent = String(seconds)
      status(`Follow along in ${seconds}… Play the highlighted note to start interactive practice.`)
    }
    animation = requestAnimationFrame(count)
  }
  count(performance.now())
}

async function start(mode: 'guided' | 'timed' | 'demo' | 'follow', allowFollow = true): Promise<void> {
  stop()
  const session = generation
  const { hands, loop, first, last, bpm, full } = settings()
  const steps = practiceSteps(lesson, hands, first, last)
  if (!steps.length) {
    status('There are no notes for that hand in this passage. Select a different range.')
    return
  }
  const offset = (first - 1) * lesson.meter
  pitchOffset = offset
  stepIndex = 0
  active = true
  followingTempo = mode === 'follow'
  element<HTMLButtonElement>('stop').disabled = false
  if (mode === 'guided') {
    kidsCue('play')
    guided = steps
    followingTempo = allowFollow && !midiInput?.onmidimessage
    rhythm?.clearTiming(true)
    status('Play the highlighted note or chord to start the bar. Hold the key while its note fills.')
    showGuidedStep()
    if (followingTempo) countIntoFollowAlong(session)
    return
  }

  let context: AudioContext
  try {
    context = await audio.start()
  } catch {
    if (session === generation) {
      stop()
      status('Audio could not start. Try guided practice or check your browser’s audio settings.')
    }
    return
  }
  if (session !== generation) return
  audio.beginPlayback()
  if (mode === 'demo' || mode === 'follow') kidsCue('listen')
  const secondsPerBeat = 60 / bpm
  const count = mode === 'timed' ? lesson.meter : 0
  const duration = (last - first + 1) * lesson.meter
  const firstBeat = context.currentTime + 0.1 + count * secondsPerBeat
  const events = lesson.events.filter(event => (hands === 'both' || event.hand === hands) &&
    event.beat >= offset && event.beat < offset + duration)
  let roundStart = firstBeat
  let nextRoundScheduled = false
  let lastHintBeat = -1
  let startedPlaying = false
  for (let i = count; i > 0; i--) audio.click(firstBeat - i * secondsPerBeat, i === count)

  function schedule(at: number): void {
    if (mode === 'timed') {
      for (let i = 0; i < duration; i++) audio.click(at + i * secondsPerBeat, i % lesson.meter === 0)
    } else {
      for (const event of events) {
        for (const note of event.notes) audio.play(note.midi, at + (event.beat - offset) * secondsPerBeat, playbackBeats(event, lesson.pedal, offset + duration) * secondsPerBeat)
      }
    }
  }

  schedule(roundStart)
  if (mode === 'timed') {
    timed = { context, secondsPerBeat, start: firstBeat, hits: [], steps, hands, offset, claimed: new Map() }
    rhythm?.clearTiming(true)
  }

  function tick(): void {
    if (session !== generation) return
    const position = (context.currentTime - roundStart) / secondsPerBeat
    if (position < 0) {
      rhythm?.countIn(position + count)
      status(`Get ready · ${Math.min(count, Math.ceil(-position))}`.replace(/ · 0$/, ''))
    } else if (position < duration) {
      if (!startedPlaying) {
        startedPlaying = true
        if (mode === 'timed' || mode === 'follow') kidsCue('play')
      }
      rhythm?.show(hands, offset + position)
      updatePedalCue(offset + position)
      const beat = Math.floor(position * 2) / 2
      if (beat !== lastHintBeat) {
        lastHintBeat = beat
        const pitches = new Set<number>()
        const sounding = events.filter(event => event.beat <= offset + beat && offset + beat < event.beat + event.duration)
        highlight(offset + beat, sounding)
        for (const event of sounding) {
          for (const note of event.notes) pitches.add(note.midi)
        }
        setHintPitches(pitches)
      }
      const prefix = mode === 'follow' ? 'Follow along · ' : ''
      status(mode === 'demo' ? 'Listening to the demonstration' : `${prefix}Measure ${first + Math.floor(position / lesson.meter)} · Beat ${Math.floor(position % lesson.meter) + 1}`)
      if (loop && !nextRoundScheduled && position >= duration - 1) {
        schedule(roundStart + duration * secondsPerBeat)
        nextRoundScheduled = true
      }
    } else {
      const scores = timed && scoreAttempt(steps, timed.hits, secondsPerBeat)
      if (loop) {
        roundStart += duration * secondsPerBeat
        lastHintBeat = -1
        setHintPitches(new Set())
        if (!nextRoundScheduled) schedule(roundStart)
        nextRoundScheduled = false
        if (timed) {
          timed.start = roundStart
          timed.hits = []
          timed.claimed.clear()
          noteHolds.clear()
          rhythm?.clearTiming(true)
          if (scores) element('result').textContent = `Last loop · ${scores.pitch}% pitch · ${scores.timing}% timing`
        }
      } else {
        if (scores && full) {
          const best = progress.best[lesson.id]
          if (!best || scores.pitch + scores.timing > best.pitch + best.timing) progress.best[lesson.id] = scores
          saveProgress(progress, kidsMode)
          updateSidebar()
        }
        stop()
        if (mode === 'demo' && kidsMode) {
          void start('guided', false)
          return
        }
        status(scores ? `Attempt complete · ${scores.pitch}% pitch · ${scores.timing}% timing` : mode === 'follow' ? 'Follow-along complete.' : 'Demonstration complete.')
        return
      }
    }
    animation = requestAnimationFrame(tick)
  }
  tick()
}

function renderFingering(events: Event[]): void {
  fingerEvents = events
  const panel = element('fingering')
  const enabled = hasFingerings(lesson) &&
    (kidsMode || element<HTMLInputElement>('finger-hints').checked)
  const { hands } = settings()
  const diagrams = panel.querySelectorAll<HTMLElement>('.finger-hand')
  diagrams.forEach(diagram => {
    diagram.hidden = hands !== 'both' && diagram.dataset.hand !== hands
    diagram.querySelectorAll('.finger.active').forEach(node => node.classList.remove('active'))
  })
  keys.forEach(key => {
    delete key.dataset.fingerTarget
    key.removeAttribute('aria-description')
  })
  if (enabled) {
    for (const event of events) {
      const diagram = panel.querySelector<HTMLElement>(`[data-hand="${event.hand}"]`)!
      for (const note of event.notes) {
        const finger = note.finger
        if (!finger) continue
        diagram.querySelector(`[data-finger="${finger}"]`)?.classList.add('active')
        const key = keys.get(note.midi)
        if (key) {
          key.dataset.fingerTarget = String(finger)
          key.setAttribute('aria-description', `Suggested finger: ${event.hand} hand ${finger}`)
        }
      }
    }
  }
  panel.hidden = !enabled
  positionHands()
}

function positionHands(): void {
  const panel = element('fingering')
  if (panel.hidden) return
  const viewport = panel.getBoundingClientRect()
  const hands = [...panel.querySelectorAll<HTMLElement>('.finger-hand:not([hidden])')]
  const placements = hands.map(hand => {
    const origin = hand.getBoundingClientRect().left
    const targets: number[] = []
    for (const event of fingerEvents) {
      if (event.hand !== hand.dataset.hand) continue
      for (const note of event.notes) {
        const finger = note.finger
        const tip = hand.querySelector<HTMLElement>(`[data-finger="${finger}"]`)
        const key = keys.get(note.midi)
        if (!tip || !key) continue
        const fingertip = tip.getBoundingClientRect()
        const keyBounds = key.getBoundingClientRect()
        const keyCenter = keyBounds.left + keyBounds.width / 2 - viewport.left
        targets.push(keyCenter - (fingertip.left - origin + fingertip.width / 2))
      }
    }
    const preferred = targets.length ? targets.reduce((sum, target) => sum + target, 0) / targets.length : hand.offsetLeft
    const width = hand.offsetWidth
    const left = Math.max(0, Math.min(viewport.width - width, preferred))
    return { hand, left, width, targeted: targets.length > 0 }
  })
  if (placements.length === 2) {
    const left = placements.find(item => item.hand.dataset.hand === 'left')!
    const right = placements.find(item => item.hand.dataset.hand === 'right')!
    const gap = 5
    if (left.left + left.width + gap > right.left) {
      if (left.targeted || !right.targeted) right.left = Math.min(viewport.width - right.width, left.left + left.width + gap)
      left.left = Math.max(0, Math.min(left.left, right.left - left.width - gap))
      right.left = Math.max(right.left, left.left + left.width + gap)
    }
  }
  for (const { hand, left } of placements) {
    hand.style.setProperty('--hand-shift', `${left - hand.offsetLeft}px`)
  }
}

function makeKeyboard(): void {
  const piano = element('piano')
  const { low, high } = pianoRange
  const whites = Array.from({ length: high - low + 1 }, (_, i) => low + i).filter(pitch => !noteNames[pitch % 12].includes('♯')).length
  piano.style.setProperty('--whites', String(whites))
  keys.clear()
  let whiteIndex = 0
  for (let pitch = low; pitch <= high; pitch++) {
    const name = noteNames[pitch % 12]
    const octave = Math.floor(pitch / 12) - 1
    const black = name.includes('♯')
    const key = document.createElement('button')
    key.type = 'button'
    key.className = black ? 'piano-key black' : 'piano-key white'
    key.style.setProperty('--position', String(black ? whiteIndex - 0.32 : whiteIndex++))
    key.setAttribute('aria-label', `${name}${octave}`)
    key.dataset.pitch = String(pitch)
    if (!black) key.textContent = pitch % 12 === 0 ? `C${octave}` : name
    const currentPitch = pitch
    key.addEventListener('pointerdown', event => {
      event.preventDefault()
      key.setPointerCapture(event.pointerId)
      press(`pointer:${event.pointerId}`, currentPitch)
    })
    key.addEventListener('keydown', event => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault()
        press(`accessible:${currentPitch}`, currentPitch)
      }
    })
    key.addEventListener('keyup', event => {
      if (event.key === ' ' || event.key === 'Enter') release(`accessible:${currentPitch}`)
    })
    key.addEventListener('blur', () => release(`accessible:${currentPitch}`, false))
    piano.append(key)
    keys.set(pitch, key)
  }
  updateOctave()
}

function updateOctave(): void {
  const firstPitch = 12 * (keyboardOctave + 1)
  shortcuts.clear()
  keys.forEach(key => delete key.dataset.shortcut)
  keyRows.forEach((row, index) => row.forEach((shortcut, offset) => {
    const pitch = firstPitch + index * 12 + offset
    if (keys.has(pitch)) shortcuts.set(shortcut, pitch)
  }))
  if (keyboardOctave === 3) {
    shortcuts.set('a', 43)
    shortcuts.set('f', 45)
    shortcuts.set('k', 47)
  }
  shortcuts.forEach((pitch, shortcut) => { keys.get(pitch)!.dataset.shortcut = shortcut })
  const end = keyboardOctave === 2 ? 'F4' : 'F5'
  element('octave-label').textContent = `${keyboardOctave === 3 ? 'G2' : `C${keyboardOctave}`}–${end}`
  element<HTMLButtonElement>('octave-down').disabled = keyboardOctave === 2
  element<HTMLButtonElement>('octave-up').disabled = keyboardOctave === 4
  const target = keys.get(12 * (keyboardOctave + 1))
  if (target) element('key-scroll').scrollLeft = target.offsetLeft
}

function renderPedal(): void {
  const down = screenPedal || midiPedalChannels.size > 0
  audio.setSustain(down)
  const button = element('sustain-pedal')
  if (!button) return
  button.setAttribute('aria-pressed', String(down))
  const cue = element('pedal-cue')
  const showCue = expectedPedal !== undefined && expectedPedal !== down
  cue.hidden = !showCue
  if (showCue) {
    const symbol = expectedPedal ? '↓' : '↑'
    const label = expectedPedal ? 'Press pedal' : 'Lift pedal'
    if (element('pedal-cue-text').textContent !== label) {
      element('pedal-cue-icon').textContent = symbol
      element('pedal-cue-text').textContent = label
    }
  }
}

function updatePedalCue(beat?: number): void {
  const expected = beat !== undefined && lesson.pedal.length ? pedalAt(lesson.pedal, beat) : undefined
  if (expectedPedal === expected) return
  expectedPedal = expected
  renderPedal()
}

function renderMidiStatus(): void {
  element('midi-status').textContent = midiStatus
  element('midi-last-note').textContent = midiLastNote
  element<HTMLButtonElement>('midi-scan').disabled = midiRequestPending
}

function setMidiStatus(message: string): void {
  midiStatus = message
  renderMidiStatus()
}

async function selectMidi(input: MIDIInput | undefined): Promise<void> {
  if (input && midiInput === input) return
  if (midiInput) midiInput.onmidimessage = null
  midiPedalChannels.clear()
  renderPedal()
  for (const source of held.keys()) if (source.startsWith('midi:')) release(source, false)
  midiInput = input
  midiLastNote = ''
  if (!input) {
    setMidiStatus('No MIDI inputs detected. Connect a USB piano or pair a Bluetooth MIDI instrument, then check again.')
    return
  }

  const name = input.name || 'MIDI instrument'
  setMidiStatus(`Opening ${name}…`)
  try {
    await input.open()
  } catch {
    if (midiInput === input) {
      midiInput = undefined
      setMidiStatus(`Could not open ${name}. Reconnect it and check again, or choose another input.`)
    }
    return
  }
  if (midiInput !== input || input.state !== 'connected') return

  input.onmidimessage = event => {
    if (!event.data || event.data.length < 3) return
    const [command, pitch, velocity] = event.data
    const kind = command & 0xf0
    const channel = command & 0x0f
    if (kind === 0xb0 && pitch === 64) {
      if (velocity >= 64) midiPedalChannels.add(channel)
      else midiPedalChannels.delete(channel)
      renderPedal()
      return
    }
    const source = `midi:${command & 0x0f}:${pitch}`
    if (kind === 0x90 && velocity > 0) {
      const octave = Math.floor(pitch / 12) - 1
      midiLastNote = `Last MIDI note: ${noteNames[pitch % 12]}${octave}`
      element('midi-last-note').textContent = midiLastNote
      press(source, pitch, velocity / 127)
    }
    if (kind === 0x80 || (kind === 0x90 && velocity === 0)) release(source)
  }
  setMidiStatus(`Connected · ${name}. Play a note to test the input.`)
}

function refreshMidi(): void {
  if (!midiAccess) return
  const select = element<HTMLSelectElement>('midi-devices')
  const connected = [...midiAccess.inputs.values()].filter(input => input.state === 'connected')
  select.replaceChildren(...connected.map(device => new Option(device.name || 'MIDI instrument', device.id)))
  element('midi-input-row').hidden = !connected.length
  const selected = connected.find(input => input.id === midiInput?.id) ?? connected[0]
  if (selected) select.value = selected.id
  void selectMidi(selected)
}

async function connectMidi(): Promise<void> {
  if (midiRequestPending) return
  if (!window.isSecureContext) {
    setMidiStatus('MIDI requires a secure page. Open Pianoles over HTTPS and try again.')
    return
  }
  if (!navigator.requestMIDIAccess) {
    setMidiStatus('This browser does not support Web MIDI. Try Chrome or Edge on a computer.')
    return
  }

  void audio.start().catch(() => {})
  if (midiAccess) {
    refreshMidi()
    return
  }
  midiRequestPending = true
  setMidiStatus('Requesting MIDI access. Allow it if your browser asks.')
  try {
    midiAccess = await navigator.requestMIDIAccess({ sysex: false })
    midiAccess.onstatechange = refreshMidi
    refreshMidi()
  } catch (error) {
    if (error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name)) {
      setMidiStatus('MIDI access was blocked. Allow MIDI in this site’s browser permissions, then check again.')
    } else {
      setMidiStatus('The browser could not start MIDI. Reconnect your instrument and check again.')
    }
  } finally {
    midiRequestPending = false
    renderMidiStatus()
  }
}

function setMidiPanel(open: boolean): void {
  element('midi-panel').hidden = !open
  element('midi').setAttribute('aria-expanded', String(open))
}

function display(): void {
  stop()
  rhythm = undefined
  const match = /^#\/lesson\/([1-9]\d*)$/.exec(location.hash)
  const home = location.hash === '' || location.hash === '#/'
  const id = home ? Number(progress.last) || 1 : match ? Number(match[1]) : 0
  const chosen = lessons.find(entry => entry.id === id)
  lesson = chosen ?? lessons[0]
  if (home || chosen) {
    progress.last = lesson.id
    saveProgress(progress, kidsMode)
  }
  highlighted = -1
  const unit = units.find(unit => unit.lessons.includes(lesson))!
  const links = units.map(({ title, lessons: entries }) => `
    <section class="lesson-group">
      <h2>${escapeText(title)}</h2>
      ${entries.map(entry => `
        <a class="lesson-link" data-lesson="${entry.id}" href="#/lesson/${entry.id}" ${entry.id === lesson.id ? 'aria-current="page"' : ''}>
          <span class="lesson-number">${String(entry.id).padStart(2, '0')}</span><span>${escapeText(entry.title)}</span><span class="check" aria-hidden="true"></span>
        </a>`).join('')}
    </section>`).join('')
  const bpm = kidsMode ? 48 : lesson.tempo
  const barOptions = Array.from({ length: lesson.measures }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')
  app.classList.toggle('kids-mode', kidsMode)
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/" aria-label="Pianoles home"><span class="brand-mark" aria-hidden="true">♩</span>pianoles<span class="brand-dot">.</span></a>
      <div class="header-actions">
        <button type="button" id="kids-toggle" aria-pressed="${kidsMode}" aria-label="Kids mode">${kidsMode ? 'Exit kids mode' : 'Kids mode'}</button>
        <button type="button" id="catalog" aria-controls="sidebar" aria-expanded="false">Lessons</button>
        <button type="button" id="midi" aria-controls="midi-panel" aria-expanded="false">Connect MIDI</button>
        <section id="midi-panel" aria-labelledby="midi-heading" hidden>
          <div class="midi-panel-head"><h2 id="midi-heading">MIDI devices</h2><button type="button" id="midi-done">Done</button></div>
          <p id="midi-status" role="status"></p>
          <div id="midi-input-row" class="midi-input-row" hidden><label for="midi-devices">MIDI input</label><select id="midi-devices"></select></div>
          <p id="midi-last-note"></p>
          <button type="button" id="midi-scan">Check again</button>
        </section>
      </div>
    </header>
    <div class="layout">
      <aside id="sidebar" aria-label="Lesson catalog">
        <div class="catalog-head">
          <div class="catalog-title"><h2>Lessons</h2><span id="completion"></span></div>
          <progress id="course-progress" aria-label="Course completion" max="${lessons.length}"></progress>
          <form id="jump"><label for="lesson-number">Jump to lesson</label><input id="lesson-number" type="number" min="1" max="${lessons.length}" required placeholder="${lesson.id}" /><button type="submit">Go</button></form>
        </div>
        <nav id="lesson-list" aria-label="Lessons">${links}</nav>
      </aside>
      <main>
        ${!home && !chosen ? '<div class="route-alert" role="status">That lesson could not be found. <a href="#/lesson/1">Open the course catalog</a>.</div>' : ''}
        <section class="intro" aria-labelledby="lesson-title">
          <div class="intro-meta"><span>${escapeText(unit.title)}</span><span class="meta-dot"></span><span>Lesson ${lesson.id} of ${lessons.length}</span></div>
          <div class="title-row"><h1 id="lesson-title">${escapeText(lesson.title)}</h1><nav class="step-nav" aria-label="Neighboring lessons">
            ${lesson.id > 1 ? `<a href="#/lesson/${lesson.id - 1}" aria-label="Previous lesson">←</a>` : '<span aria-hidden="true">←</span>'}
            ${lesson.id < lessons.length ? `<a href="#/lesson/${lesson.id + 1}" aria-label="Next lesson">→</a>` : '<span aria-hidden="true">→</span>'}
          </nav></div>
          ${lesson.credit ? `<p class="lesson-credit">${escapeText(lesson.credit)}</p>` : ''}
          <p class="lesson-instruction">${escapeText(lesson.instruction)}</p>
        </section>
        <section class="studio" aria-label="Practice studio">
          <div class="studio-toolbar">
            <div class="play-controls">
              <button class="primary" id="guided" aria-label="Start guided"><span class="kid-icon" aria-hidden="true">▶&#xfe0e;</span><span class="adult-label">Start guided</span></button><button id="timed" aria-label="Timed practice" title="Timed practice"><span class="kid-icon" aria-hidden="true">◷</span><span class="adult-label">Timed practice</span></button><button id="demo" aria-label="Listen"><span class="kid-icon" aria-hidden="true">♫</span><span class="adult-label"><span aria-hidden="true">▷</span> Listen</span></button><button id="stop" aria-label="Stop" disabled><span class="kid-icon" aria-hidden="true">■</span><span class="adult-label">Stop</span></button>
            </div>
            <div class="tempo"><label for="tempo">Tempo</label><input id="tempo" type="range" min="35" max="150" value="${bpm}" /><output id="bpm" for="tempo">${bpm} BPM</output></div>
          </div>
          <div id="kids-cue" aria-hidden="true" data-cue="ready">▶</div>
          <div id="rhythm" class="rhythm" role="group" aria-label="Visual metronome and note durations"></div>
          <div class="sheet">
            <div class="sheet-header"><h2>Sheet music</h2><span>${lesson.key.endsWith('m') ? lesson.key.slice(0, -1) + ' minor' : lesson.key + ' major'} · ${lesson.meter}/4</span></div>
            <div id="score" tabindex="0" aria-label="Scrollable sheet music"></div>
          </div>
          <div class="feedback-row"><p id="feedback" aria-live="polite">Listen first or start guided practice.</p><span id="result"></span></div>
          <div class="options">
            <label for="hands">Hands</label>
            <select id="hands">${lesson.hands.length === 2 ? '<option value="both">Both hands</option>' : ''}${lesson.hands.map(hand => `<option value="${hand}">${hand === 'left' ? 'Left' : 'Right'} hand</option>`).join('')}</select>
            <label class="checkbox"><input id="loop" type="checkbox" /> Loop measures</label>
            <div id="range" hidden><select id="first" aria-label="First measure">${barOptions}</select><span>–</span><select id="last" aria-label="Last measure">${barOptions}</select></div>
            <label class="checkbox" ${!hasFingerings(lesson) ? 'hidden' : ''}><input id="finger-hints" type="checkbox" checked /> Finger hints</label>
            <label class="checkbox hints"><input id="key-hints" type="checkbox" ${(kidsMode || (hintPreference ?? (lesson.id <= 3 || (lesson.credit && hasFingerings(lesson))))) ? 'checked' : ''} /> Key hints</label>
          </div>
        </section>
        <section class="keyboard${lesson.hands.length === 2 ? ' keyboard-compact' : ''}" aria-labelledby="keyboard-heading">
          <div class="keyboard-head"><div><h2 id="keyboard-heading">Piano keyboard</h2><p>Play with touch or follow the shortcut letters.</p></div>
            <div class="octaves"><button id="octave-down" aria-label="Lower keyboard octave">−</button><span id="octave-label"></span><button id="octave-up" aria-label="Raise keyboard octave">+</button></div>
          </div>
          <div id="key-scroll"><div id="piano"></div></div>
          <div id="fingering" aria-label="Suggested fingers" hidden>${lesson.hands.map(handDiagram).join('')}</div>
          <div class="pedal-control">
            <button type="button" id="sustain-pedal" aria-label="Sustain pedal" aria-pressed="false"><span class="pedal-shape" aria-hidden="true"></span><span>Sustain</span></button>
            <span id="pedal-cue" role="status" hidden><span id="pedal-cue-icon" aria-hidden="true"></span><span id="pedal-cue-text"></span></span>
          </div>
          <div class="keyboard-foot" id="best"></div>
        </section>
      </main>
    </div>`

  element<HTMLSelectElement>('last').value = String(lesson.measures)
  keyboardOctave = 3
  renderScore(element('score'), lesson)
  makeKeyboard()
  renderPedal()
  rhythm = new RhythmDisplay(element('rhythm'), lesson, renderFingering)
  rhythm.preview(settings().hands, 0)
  refreshKeys()
  updateSidebar()
  renderMidiStatus()
  refreshMidi()
  const current = document.querySelector<HTMLElement>('[aria-current="page"]')
  if (current && (current.offsetTop < element('lesson-list').scrollTop || current.offsetTop + current.offsetHeight > element('lesson-list').clientHeight)) {
    element('lesson-list').scrollTop = current.offsetTop - 48
  }
  element('kids-toggle').onclick = () => {
    stop()
    kidsMode = !kidsMode
    saveKidsMode(kidsMode)
    progress = kidsMode ? kidsProgress : adultProgress
    history.replaceState(null, '', `#/lesson/${progress.last}`)
    display()
    element('kids-toggle').focus()
  }
  element('catalog').onclick = () => {
    const open = element('sidebar').classList.toggle('open')
    element('catalog').setAttribute('aria-expanded', String(open))
    if (open && current) element('lesson-list').scrollTop = Math.max(0, current.offsetTop - 48)
  }
  element('jump').onsubmit = event => {
    event.preventDefault()
    location.hash = `/lesson/${element<HTMLInputElement>('lesson-number').value}`
    element('sidebar').classList.remove('open')
    element('catalog').setAttribute('aria-expanded', 'false')
  }
  for (const mode of ['guided', 'timed', 'demo'] as const) element(mode).onclick = () => void start(mode)
  element('stop').onclick = () => { stop(); refreshKeys(); status('Practice stopped.') }
  element('midi').onclick = () => {
    const open = element('midi-panel').hidden
    setMidiPanel(open)
    if (open) void connectMidi()
  }
  element('midi-done').onclick = () => {
    setMidiPanel(false)
    element('midi').focus()
  }
  element('midi-scan').onclick = () => void connectMidi()
  element<HTMLSelectElement>('midi-devices').onchange = event => {
    void selectMidi(midiAccess?.inputs.get((event.target as HTMLSelectElement).value))
  }
  element('sustain-pedal').onclick = () => {
    screenPedal = !screenPedal
    renderPedal()
  }
  element('octave-down').onclick = () => { keyboardOctave--; updateOctave() }
  element('octave-up').onclick = () => { keyboardOctave++; updateOctave() }
  element('tempo').oninput = () => { element('bpm').textContent = `${settings().bpm} BPM` }
  element('key-scroll').onscroll = positionHands
  element('finger-hints').onchange = () => renderFingering(fingerEvents)
  element<HTMLInputElement>('key-hints').onchange = () => {
    hintPreference = element<HTMLInputElement>('key-hints').checked
    refreshKeys()
    revealHintPitches()
  }
  for (const control of ['tempo', 'hands', 'loop', 'first', 'last']) {
    element(control).onchange = () => {
      const { first, last } = settings()
      if (last < first) {
        if (control === 'first') element<HTMLSelectElement>('last').value = String(first)
        else element<HTMLSelectElement>('first').value = String(last)
      }
      element('range').hidden = !settings().loop
      element('result').textContent = ''
      rhythm?.preview(settings().hands, (settings().first - 1) * lesson.meter)
      if (active) {
        stop()
        refreshKeys()
        status('Settings updated. Start practice when ready.')
      }
    }
  }
}

window.addEventListener('hashchange', display)
window.addEventListener('resize', positionHands)
window.addEventListener('pointerup', event => release(`pointer:${event.pointerId}`))
window.addEventListener('pointercancel', event => release(`pointer:${event.pointerId}`, false))
window.addEventListener('lostpointercapture', event => release(`pointer:${event.pointerId}`, false))
window.addEventListener('blur', () => { for (const source of held.keys()) release(source, false) })
window.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
      (event.target instanceof HTMLElement && event.target.matches('input,select,textarea,[contenteditable]'))) return
  const pitch = shortcuts.get(event.key.toLowerCase())
  if (pitch === undefined) return
  event.preventDefault()
  press(`key:${event.code}`, pitch)
})
window.addEventListener('keyup', event => release(`key:${event.code}`))
display()
