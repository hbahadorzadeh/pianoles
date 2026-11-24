import './style.css'
import { PianoAudio } from './audio'
import { lessons, units, type Hands, type Lesson } from './lessons'
import { renderScore } from './notation'
import { matchesChord, practiceSteps, scoreAttempt, type Hit, type Step } from './practice'
import { loadProgress, saveProgress } from './progress'

const app = document.querySelector<HTMLDivElement>('#app')!
const progress = loadProgress()
const audio = new PianoAudio()
const held = new Map<string, number>()
const pressed = new Set<number>()
const freshChord = new Set<number>()
const keys = new Map<number, HTMLButtonElement>()
const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const keyRows = [
  ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'],
  ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u', 'i', '9', 'o', '0', 'p'],
]
let lesson: Lesson
let guided: Step[] | undefined
let stepIndex = 0
let timed: { start: number; secondsPerBeat: number; hits: Hit[]; context: AudioContext } | undefined
let active = false
let generation = 0
let animation = 0
let pitchOffset = 0
let keyboardOctave = 3
let highlighted = -1
let midiAccess: MIDIAccess | undefined
let midiInput: MIDIInput | undefined

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function status(message: string): void {
  const feedback = element('feedback')
  if (feedback.textContent !== message) feedback.textContent = message
}

function updateSidebar(): void {
  element('completion').textContent = `${Object.keys(progress.completed).length} of 24 lessons complete`
  element<HTMLProgressElement>('course-progress').value = Object.keys(progress.completed).length
  document.querySelectorAll<HTMLAnchorElement>('.lesson-link').forEach(link => {
    const id = Number(link.dataset.lesson)
    link.querySelector('.check')!.textContent = progress.completed[id] ? '✓' : ''
  })
  const best = progress.best[lesson.id]
  element('best').textContent = best ? `Best full attempt · ${best.pitch}% pitch · ${best.timing}% timing` : ''
}

function stop(): void {
  generation++
  guided = undefined
  freshChord.clear()
  timed = undefined
  active = false
  cancelAnimationFrame(animation)
  audio.stopPlayback()
  const stopButton = element<HTMLButtonElement>('stop')
  if (stopButton) stopButton.disabled = true
  highlight(-1)
}

function highlight(beat: number): void {
  if (highlighted === beat) return
  highlighted = beat
  document.querySelectorAll('.current-note,.current-measure').forEach(node => node.classList.remove('current-note', 'current-measure'))
  if (beat < 0) return
  const measure = Math.floor(beat / lesson.meter) + 1
  const cell = document.querySelector<HTMLElement>(`[data-measure="${measure}"]`)
  cell?.classList.add('current-measure')
  cell?.querySelectorAll(`[data-beat="${beat}"]`).forEach(node => node.classList.add('current-note'))
  const strip = element('score')
  if (cell && (cell.offsetLeft < strip.scrollLeft || cell.offsetLeft + cell.offsetWidth > strip.scrollLeft + strip.clientWidth)) {
    strip.scrollTo({ left: cell.offsetLeft, behavior: 'smooth' })
  }
}

function showGuidedStep(): void {
  const step = guided?.[stepIndex]
  if (!step) return
  highlight(step.beat + pitchOffset)
  if (element<HTMLInputElement>('key-hints').checked) {
    const firstKey = keys.get(Math.min(...step.pitches))
    const scroller = element('key-scroll')
    if (firstKey && (firstKey.offsetLeft < scroller.scrollLeft || firstKey.offsetLeft + firstKey.offsetWidth > scroller.scrollLeft + scroller.clientWidth)) {
      scroller.scrollLeft = Math.max(0, firstKey.offsetLeft - 28)
    }
  }
  refreshKeys()
}

function refreshKeys(): void {
  const expected = guided?.[stepIndex]?.pitches
  const hints = element<HTMLInputElement>('key-hints')?.checked
  keys.forEach((key, pitch) => {
    key.classList.toggle('held', pressed.has(pitch))
    key.classList.toggle('hint', Boolean(hints && expected?.has(pitch)))
  })
}

function press(source: string, pitch: number, velocity = 0.72): void {
  if (held.has(source)) return
  held.set(source, pitch)
  pressed.add(pitch)
  void audio.press(pitch, velocity, () => pressed.has(pitch)).catch(() => {
    if (!active) status('Audio is unavailable. You can still use the notation and practice feedback.')
  })
  if (timed) {
    const elapsed = timed.context.currentTime - timed.start
    if (elapsed >= -0.18) timed.hits.push({ pitch, beat: elapsed / timed.secondsPerBeat })
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
    status('That pitch is outside the highlighted note group. Release it and try again.')
    return
  }
  if (!matchesChord(step.pitches, freshChord)) {
    status('Play the highlighted note or chord to continue.')
    return
  }
  freshChord.clear()
  stepIndex++
  if (stepIndex < guided.length) {
    status(`Correct · ${stepIndex} of ${guided.length} note groups`)
    showGuidedStep()
    return
  }
  const { loop, full } = settings()
  if (loop) {
    stepIndex = 0
    status('Passage complete. Release the keys and repeat.')
    showGuidedStep()
    return
  }
  if (full) {
    progress.completed[lesson.id] = true
    saveProgress(progress)
    updateSidebar()
  }
  stop()
  status(full ? 'Lesson complete. You can replay it or try timed practice.' : 'Practice complete.')
}

function release(source: string): void {
  const pitch = held.get(source)
  if (pitch === undefined) return
  held.delete(source)
  if (![...held.values()].includes(pitch)) {
    pressed.delete(pitch)
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

async function start(mode: 'guided' | 'timed' | 'demo'): Promise<void> {
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
  element<HTMLButtonElement>('stop').disabled = false
  if (mode === 'guided') {
    guided = steps
    status('Play the highlighted note or chord to continue.')
    showGuidedStep()
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
  const secondsPerBeat = 60 / bpm
  const count = mode === 'timed' ? lesson.meter : 0
  const duration = (last - first + 1) * lesson.meter
  const firstBeat = context.currentTime + 0.1 + count * secondsPerBeat
  const events = lesson.events.filter(event => (hands === 'both' || event.hand === hands) &&
    event.beat >= offset && event.beat < offset + duration)
  let roundStart = firstBeat
  let nextRoundScheduled = false
  for (let i = count; i > 0; i--) audio.click(firstBeat - i * secondsPerBeat, i === count)

  function schedule(at: number): void {
    if (mode === 'timed') {
      for (let i = 0; i < duration; i++) audio.click(at + i * secondsPerBeat, i % lesson.meter === 0)
    } else {
      for (const event of events) {
        for (const note of event.notes) audio.play(note.midi, at + (event.beat - offset) * secondsPerBeat, event.duration * secondsPerBeat * 0.91)
      }
    }
  }

  schedule(roundStart)
  if (mode === 'timed') timed = { context, secondsPerBeat, start: firstBeat, hits: [] }

  function tick(): void {
    if (session !== generation) return
    const position = (context.currentTime - roundStart) / secondsPerBeat
    if (position < 0) {
      status(`Get ready · ${Math.min(count, Math.ceil(-position))}`.replace(/ · 0$/, ''))
    } else if (position < duration) {
      const beat = Math.floor(position * 2) / 2
      highlight(offset + beat)
      status(mode === 'demo' ? 'Listening to the demonstration' : `Measure ${first + Math.floor(position / lesson.meter)} · Beat ${Math.floor(position % lesson.meter) + 1}`)
      if (loop && !nextRoundScheduled && position >= duration - 1) {
        schedule(roundStart + duration * secondsPerBeat)
        nextRoundScheduled = true
      }
    } else {
      const scores = timed && scoreAttempt(steps, timed.hits, secondsPerBeat)
      if (loop) {
        roundStart += duration * secondsPerBeat
        if (!nextRoundScheduled) schedule(roundStart)
        nextRoundScheduled = false
        if (timed) {
          timed.start = roundStart
          timed.hits = []
          if (scores) element('result').textContent = `Last loop · ${scores.pitch}% pitch · ${scores.timing}% timing`
        }
      } else {
        if (scores && full) {
          const best = progress.best[lesson.id]
          if (!best || scores.pitch + scores.timing > best.pitch + best.timing) progress.best[lesson.id] = scores
          saveProgress(progress)
          updateSidebar()
        }
        stop()
        status(scores ? `Attempt complete · ${scores.pitch}% pitch · ${scores.timing}% timing` : 'Demonstration complete.')
        return
      }
    }
    animation = requestAnimationFrame(tick)
  }
  tick()
}

function makeKeyboard(): void {
  const piano = element('piano')
  const low = 36
  const high = 77
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
    key.addEventListener('blur', () => release(`accessible:${currentPitch}`))
    piano.append(key)
    keys.set(pitch, key)
  }
  updateOctave()
}

function updateOctave(): void {
  element('octave-label').textContent = `C${keyboardOctave}–E${keyboardOctave + 2}`
  keys.forEach(key => delete key.dataset.shortcut)
  keyRows.forEach((row, index) => row.forEach((shortcut, pitch) => {
    const key = keys.get(12 * (keyboardOctave + 1 + index) + pitch)
    if (key) key.dataset.shortcut = shortcut
  }))
  element<HTMLButtonElement>('octave-down').disabled = keyboardOctave === 2
  element<HTMLButtonElement>('octave-up').disabled = keyboardOctave === 4
  const target = keys.get(12 * (keyboardOctave + 1))
  if (target) element('key-scroll').scrollLeft = target.offsetLeft
}

function selectMidi(id: string): void {
  if (midiInput) midiInput.onmidimessage = null
  for (const source of held.keys()) if (source.startsWith('midi:')) release(source)
  midiInput = midiAccess?.inputs.get(id)
  if (!midiInput || midiInput.state === 'disconnected') {
    midiInput = undefined
    element('midi-status').textContent = 'No MIDI device connected'
    return
  }
  midiInput.onmidimessage = event => {
    if (!event.data || event.data.length < 3) return
    const [command, pitch, velocity] = event.data
    const kind = command & 0xf0
    const source = `midi:${command & 0x0f}:${pitch}`
    if (kind === 0x90 && velocity > 0) press(source, pitch, velocity / 127)
    if (kind === 0x80 || (kind === 0x90 && velocity === 0)) release(source)
  }
  element('midi-status').textContent = `Connected · ${midiInput.name || 'MIDI instrument'}`
}

function refreshMidi(): void {
  const select = element<HTMLSelectElement>('midi-devices')
  select.replaceChildren(new Option('Choose MIDI input', ''))
  for (const device of midiAccess?.inputs.values() ?? []) {
    if (device.state === 'connected') select.add(new Option(device.name || 'MIDI instrument', device.id))
  }
  select.hidden = select.options.length === 1
  if (midiInput && midiInput.state === 'connected') {
    select.value = midiInput.id
    element('midi-status').textContent = `Connected · ${midiInput.name || 'MIDI instrument'}`
    return
  }
  const firstInput = select.options[1]?.value ?? ''
  select.value = firstInput
  selectMidi(firstInput)
}

async function connectMidi(): Promise<void> {
  if (!navigator.requestMIDIAccess) {
    element('midi-status').textContent = 'Web MIDI is unavailable in this browser. Touch and computer keys are ready.'
    return
  }
  try {
    midiAccess ??= await navigator.requestMIDIAccess()
    midiAccess.onstatechange = refreshMidi
    refreshMidi()
    void audio.start().catch(() => {})
  } catch {
    element('midi-status').textContent = 'MIDI access failed or was denied. Touch and computer keys are ready.'
  }
}

function display(): void {
  stop()
  const match = /^#\/lesson\/([1-9]\d*)$/.exec(location.hash)
  const home = location.hash === '' || location.hash === '#/'
  const id = home ? Number(progress.last) || 1 : match ? Number(match[1]) : 0
  const chosen = lessons.find(entry => entry.id === id)
  lesson = chosen ?? lessons[0]
  if (home || chosen) {
    progress.last = lesson.id
    saveProgress(progress)
  }
  highlighted = -1
  const unit = Math.floor((lesson.id - 1) / 6)
  const links = units.map((title, index) => `
    <section class="lesson-group">
      <h2>${title}</h2>
      ${lessons.slice(index * 6, index * 6 + 6).map(entry => `
        <a class="lesson-link" data-lesson="${entry.id}" href="#/lesson/${entry.id}" ${entry.id === lesson.id ? 'aria-current="page"' : ''}>
          <span class="lesson-number">${String(entry.id).padStart(2, '0')}</span><span>${entry.title}</span><span class="check" aria-hidden="true"></span>
        </a>`).join('')}
    </section>`).join('')
  const barOptions = Array.from({ length: lesson.measures }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/" aria-label="Pianoles home"><span class="brand-mark" aria-hidden="true">♩</span>pianoles<span class="brand-dot">.</span></a>
      <div class="header-actions">
        <button type="button" id="catalog" aria-controls="sidebar" aria-expanded="false">Lessons</button>
        <button type="button" id="midi">Connect MIDI</button>
      </div>
    </header>
    <div class="layout">
      <aside id="sidebar" aria-label="Lesson catalog">
        <div class="catalog-head">
          <div class="catalog-title"><h2>Lessons</h2><span id="completion"></span></div>
          <progress id="course-progress" aria-label="Course completion" max="24"></progress>
          <form id="jump"><label for="lesson-number">Jump to lesson</label><input id="lesson-number" type="number" min="1" max="24" required placeholder="${lesson.id}" /><button type="submit">Go</button></form>
        </div>
        <nav id="lesson-list" aria-label="Lessons">${links}</nav>
      </aside>
      <main>
        ${!home && !chosen ? '<div class="route-alert" role="status">That lesson could not be found. <a href="#/lesson/1">Open the course catalog</a>.</div>' : ''}
        <section class="intro" aria-labelledby="lesson-title">
          <div class="intro-meta"><span>${units[unit]}</span><span class="meta-dot"></span><span>Lesson ${lesson.id} of 24</span></div>
          <div class="title-row"><h1 id="lesson-title">${lesson.title}</h1><nav class="step-nav" aria-label="Neighboring lessons">
            ${lesson.id > 1 ? `<a href="#/lesson/${lesson.id - 1}" aria-label="Previous lesson">←</a>` : '<span aria-hidden="true">←</span>'}
            ${lesson.id < 24 ? `<a href="#/lesson/${lesson.id + 1}" aria-label="Next lesson">→</a>` : '<span aria-hidden="true">→</span>'}
          </nav></div>
          <p>${lesson.instruction}</p>
        </section>
        <section class="studio" aria-label="Practice studio">
          <div class="studio-toolbar">
            <div class="play-controls">
              <button class="primary" id="guided">Start guided</button><button id="timed">Timed practice</button><button id="demo"><span aria-hidden="true">▷</span> Listen</button><button id="stop" disabled>Stop</button>
            </div>
            <div class="tempo"><label for="tempo">Tempo</label><input id="tempo" type="range" min="35" max="150" value="${lesson.tempo}" /><output id="bpm" for="tempo">${lesson.tempo} BPM</output></div>
          </div>
          <div class="sheet">
            <div class="sheet-header"><h2>Sheet music</h2><span>${lesson.key} major · ${lesson.meter}/4</span></div>
            <div id="score" tabindex="0" aria-label="Scrollable sheet music"></div>
          </div>
          <div class="feedback-row"><p id="feedback" aria-live="polite">Listen first or start guided practice.</p><span id="result"></span></div>
          <div class="options">
            <label for="hands">Hands</label>
            <select id="hands">${lesson.hands.length === 2 ? '<option value="both">Both hands</option>' : ''}${lesson.hands.map(hand => `<option value="${hand}">${hand === 'left' ? 'Left' : 'Right'} hand</option>`).join('')}</select>
            <label class="checkbox"><input id="loop" type="checkbox" /> Loop measures</label>
            <div id="range" hidden><select id="first" aria-label="First measure">${barOptions}</select><span>–</span><select id="last" aria-label="Last measure">${barOptions}</select></div>
            <label class="checkbox hints"><input id="key-hints" type="checkbox" ${lesson.id <= 3 ? 'checked' : ''} /> Key hints</label>
          </div>
        </section>
        <section class="keyboard" aria-labelledby="keyboard-heading">
          <div class="keyboard-head"><div><h2 id="keyboard-heading">Piano keyboard</h2><p>Play with touch or use Z and Q keyboard rows.</p></div>
            <div class="octaves"><button id="octave-down" aria-label="Lower keyboard octave">−</button><span id="octave-label"></span><button id="octave-up" aria-label="Raise keyboard octave">+</button></div>
          </div>
          <div id="key-scroll"><div id="piano"></div></div>
          <div class="keyboard-foot"><div class="midi-state"><span id="midi-status" aria-live="polite">No MIDI device connected</span><select id="midi-devices" aria-label="MIDI input" hidden></select></div><div id="best"></div></div>
        </section>
      </main>
    </div>`

  element<HTMLSelectElement>('last').value = String(lesson.measures)
  keyboardOctave = lesson.events.some(event => event.notes.some(note => note.midi < 48)) ? 2 : 3
  renderScore(element('score'), lesson)
  makeKeyboard()
  refreshKeys()
  updateSidebar()
  refreshMidi()
  const current = document.querySelector<HTMLElement>('[aria-current="page"]')
  if (current && (current.offsetTop < element('lesson-list').scrollTop || current.offsetTop + current.offsetHeight > element('lesson-list').clientHeight)) {
    element('lesson-list').scrollTop = current.offsetTop - 48
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
  element('midi').onclick = () => void connectMidi()
  element<HTMLSelectElement>('midi-devices').onchange = event => selectMidi((event.target as HTMLSelectElement).value)
  element('octave-down').onclick = () => { keyboardOctave--; updateOctave() }
  element('octave-up').onclick = () => { keyboardOctave++; updateOctave() }
  element('tempo').oninput = () => { element('bpm').textContent = `${settings().bpm} BPM` }
  element('key-hints').onchange = refreshKeys
  for (const control of ['tempo', 'hands', 'loop', 'first', 'last']) {
    element(control).onchange = () => {
      const { first, last } = settings()
      if (last < first) {
        if (control === 'first') element<HTMLSelectElement>('last').value = String(first)
        else element<HTMLSelectElement>('first').value = String(last)
      }
      element('range').hidden = !settings().loop
      element('result').textContent = ''
      if (active) {
        stop()
        refreshKeys()
        status('Settings updated. Start practice when ready.')
      }
    }
  }
}

window.addEventListener('hashchange', display)
window.addEventListener('pointerup', event => release(`pointer:${event.pointerId}`))
window.addEventListener('pointercancel', event => release(`pointer:${event.pointerId}`))
window.addEventListener('lostpointercapture', event => release(`pointer:${event.pointerId}`))
window.addEventListener('blur', () => { for (const source of held.keys()) release(source) })
window.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
      (event.target instanceof HTMLElement && event.target.matches('input,select,textarea,[contenteditable]'))) return
  const key = event.key.toLowerCase()
  const row = keyRows.findIndex(keys => keys.includes(key))
  if (row < 0) return
  event.preventDefault()
  press(`key:${event.code}`, 12 * (keyboardOctave + 1 + row) + keyRows[row].indexOf(key))
})
window.addEventListener('keyup', event => release(`key:${event.code}`))
display()
