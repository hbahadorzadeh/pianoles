import { classicalStudies, familiarMelodies } from './repertoire'

export type Hand = 'left' | 'right'
export type Hands = Hand | 'both'
export type Note = { midi: number; spelling: string }
export type Event = { hand: Hand; beat: number; duration: number; notes: Note[] }
export type Lesson = {
  id: number
  title: string
  instruction: string
  tempo: number
  meter: number
  key: string
  measures: number
  hands: Hand[]
  events: Event[]
  credit?: string
}

const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function readNote(spelling: string): Note {
  const match = /^([A-G])([#b]?)([0-8])$/.exec(spelling)
  if (!match) throw new Error(`Invalid note ${spelling}`)
  const [, letter, accidental, octave] = match
  return {
    midi: 12 * (Number(octave) + 1) + semitones[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0),
    spelling,
  }
}

function readPart(part: string, hand: Hand, meter: number): Event[] {
  return part.split('|').flatMap((bar, measure) => {
    let beat = measure * meter
    const events = bar.trim().split(/\s+/).map(token => {
      const [pitches, beats = '1'] = token.split(':')
      const duration = Number(beats)
      if (![0.5, 1, 1.5, 2, 3, 4].includes(duration)) throw new Error(`Invalid duration ${beats}`)
      const event = { hand, beat, duration, notes: pitches === '-' ? [] : pitches.split('+').map(readNote) }
      beat += duration
      return event
    })
    if (beat !== (measure + 1) * meter) throw new Error(`Invalid measure: ${bar}`)
    return events
  })
}

export type Exercise = [title: string, instruction: string, tempo: number, right: string, left?: string, meter?: number, key?: string, credit?: string]

const course: Exercise[] = [
  ['Find middle C', 'Find a group of two black keys. Middle C is the white key immediately to the left of that group near the center of a piano. Play with your right thumb.', 56, 'C4:2 C4:2|C4 C4 C4:2'],
  ['The white keys', 'Keep your right thumb on C. Use fingers 2 and 3 for D and E. The notes step upward on the staff as your fingers move right.', 58, 'C4 D4 E4:2|E4 D4 C4:2'],
  ['Reading the treble staff', 'The treble clef curls around the G line. Put your fifth finger on G and notice how F sits in the space just below.', 60, 'E4 F4 G4:2|G4 F4 E4 D4|C4:4'],
  ['The bass clef', 'The bass clef dots surround the F line. Place left fingers 5, 4, and 3 on C, D, and E below middle C.', 58, '', 'C3 D3 E3:2|E3 D3 C3:2'],
  ['Count the note values', 'Count four steady beats per measure. A quarter note takes one beat, a half note two, and a whole note four.', 64, 'C4:4|D4:2 E4:2|F4 E4 D4 C4|C4:4'],
  ['Reading rests', 'Count silently during rests. Try timed mode to hear the beat continue through the silence.', 66, 'C4 - D4 -|E4:2 -:2|G4 - E4 D4|C4:4'],
  ['A right-hand melody', 'Keep one finger per key from C through G. Aim for an even sound when the melody turns back down.', 70, 'C4 D4 E4 G4|G4:2 E4:2|F4 E4 D4 E4|C4:4'],
  ['A left-hand melody', 'Put your left thumb on G and your little finger on C. Notice the descending melody moves toward finger 5.', 68, '', 'G3 E3 F3 G3|E3:2 D3:2|C3 D3 E3 D3|C3:4'],
  ['Two notes in one beat', 'Count “one and two and” for pairs of eighth notes. Keep both halves of the beat equally spaced.', 70, 'C4:0.5 D4:0.5 E4 D4:0.5 E4:0.5 F4|G4:2 E4:2|F4:0.5 E4:0.5 D4 E4:0.5 D4:0.5 C4|C4:4'],
  ['Sharps and flats', 'Find F-sharp to the right of F and B-flat to the left of B. A natural sign cancels an accidental in the same measure.', 68, 'E4 F#4 F4 G4|A4 Bb4 B4 C5|C5 Bb4 A4 G4|F#4 G4:3'],
  ['The G major signature', 'The sharp beside the clef applies to every F in this exercise. Start the right thumb on G.', 72, 'G4 A4 B4 C5|D5:2 B4:2|A4 B4 F#4 G4|G4:4', '', 4, 'G'],
  ['Move your hand position', 'Play C through G with one finger per key. During the rest, shift your whole hand to start on G.', 74, 'C4 D4 E4 F4|G4:2 -:2|G4 A4 B4 C5|D5:2 B4 G4|G4:4'],
  ['A conversation between hands', 'Play each answer with the hand shown on the staff. Prepare the next hand while the other one plays.', 64, 'C4 D4 E4:2|-:4|E4 F4 G4:2|-:4', '-:4|C3 D3 E3:2|-:4|G3 E3 C3:2'],
  ['Play together', 'Start both notes on the same beat. Hold the left note while the right moves on.', 62, 'C4 D4 E4:2|E4 F4 G4:2|G4 F4 E4 D4|C4:4', 'C3:4|F3:4|G3:4|C3:4'],
  ['First chords', 'Place the fingers for each chord before playing. Aim to sound all notes of the chord together.', 60, 'C4+E4:2 E4+G4:2|C4+F4:2 D4+G4:2|E4+G4:2 D4+F4:2|C4+E4+G4:4', 'C3:2 C3:2|F3:2 G3:2|C3:2 G3:2|C3:4'],
  ['Bass on beats one and three', 'Keep the bass steady on beats one and three as the right hand plays different note lengths.', 69, 'C4 E4:2 G4|A4 G4 F4:2|D4:2 F4 E4|C4:4', 'C3:2 G3:2|F3:2 C3:2|G3:2 D3:2|C3:2 G3:2'],
  ['Waltz pulse', 'Count three beats per measure. Play the low first beat gently and let the two upper bass notes follow.', 75, 'E4:2 G4|F4:2 A4|G4 F4 D4|C4:3', 'C3 G3 G3|F3 A3 A3|G3 B3 B3|C3 G3 C3', 3],
  ['Independent entrances', 'Count through each rest and keep listening for the next entrance. Try each hand before combining them.', 74, '- E4 G4:2|A4:2 - G4|F4 E4:2 D4|C4:4', 'C3:2 - G3|F3 - C3:2|G3 A3 B3:2|C3:4'],
  ['Morning Steps', 'Play the opening four measures as a question and the final four as the answer. Keep the bass lighter than the melody.', 80, 'E4 G4 A4 G4|E4 D4 C4:2|F4 A4 C5 A4|G4 F4 D4:2|E4 G4 C5 G4|A4:2 F4:2|D4 F4 E4 D4|C4:4', 'C3:2 G3:2|C3:2 E3:2|F3:2 C4:2|G3:2 B3:2|C3:2 G3:2|F3:2 A3:2|G3:2 F3:2|C3:4'],
  ['Window Waltz', 'Let the melody stretch across the bar while the left hand keeps all three beats even. Loop measures 5–7 to practice the position changes.', 90, 'G4:2 E4|C4 E4 G4|A4:2 F4|G4:3|C5 B4 A4|G4 E4 F4|D4:2 B3|C4:3', 'C3 E3 G3|C3 E3 G3|F3 A3 C4|C3 E3 G3|F3 A3 C4|C3 E3 G3|G2 B2 F3|C3 G3 C4', 3],
  ['River Arpeggios', 'Let the left hand roll through each broken chord. Keep it quiet enough to hear the longer melody notes clearly.', 78, 'E4:2 G4:2|A4:2 C5:2|B4 A4 G4:2|E4:4|F4:2 A4:2|G4 E4 D4:2|F4 E4 D4 B3|C4:4', 'C3 G3 E3 G3|F3 C4 A3 C4|G3 D4 B3 D4|C3 G3 E3 G3|F3 C4 A3 C4|C3 G3 E3 G3|G2 D3 B2 D3|C3 G3 E3 C3'],
  ['Offbeat Lanterns', 'Count eighth-note subdivisions. Enter after the beat on the “and,” while your left hand keeps the quarter-note pulse.', 76, '-:0.5 E4:1.5 G4 A4|-:0.5 C5:1.5 A4 G4|F4:0.5 G4:1.5 A4 F4|G4:2 D4:2|-:0.5 E4:1.5 G4 C5|A4:0.5 G4:1.5 F4 E4|D4:0.5 F4:1.5 E4 D4|C4:4', 'C3 G3 E3 G3|F3 C4 A3 C4|F3 C4 A3 C4|G3 D4 B3 D4|C3 G3 E3 G3|F3 A3 C4 A3|G3 D4 B3 F3|C3:4'],
  ['Across the Valley', 'Look ahead before each wide bass shift. Practice measures 3–6 slowly and listen for the melody above the chord voicings.', 82, 'G4 B4 D5:2|C5 B4 A4 G4|B4+D5:2 A4+C5:2|G4+B4:2 F#4+A4:2|G4:0.5 A4:0.5 B4 D5:2|E5 D5 C5 B4|A4+C5:2 F#4+A4:2|G4+B4+D5:4', 'G2 D3 G3 D3|C3 E3 G3 E3|G2:2 D3:2|E3:2 D3:2|G2 B2 D3 G3|C3 G3 C4 G3|D3 A3 F#3 A3|G2:4', 4, 'G'],
  ['Evening Duet', 'Give each hand its own musical shape. Work in four-measure phrases and bring the tempo up after each phrase feels steady.', 88, 'E4 G4:0.5 A4:0.5 C5:2|B4:1.5 A4:0.5 G4 E4|F4 A4 C5:0.5 D5:0.5 E5|D5:2 B4:2|C5 E5:0.5 D5:0.5 C5 A4|B4:1.5 C5:0.5 D5 F5|E5:2 D5:0.5 C5:0.5 B4|C5:4|A4+C5:2 D5 E5|G4+B4:2 F5 E5|D5:0.5 C5:0.5 B4 A4 G4|C5+E5:4', 'C3:2 E3 G3|E3:0.5 F3:0.5 G3:1.5 E3:0.5 D3|F3:2 A3 C4|G3:0.5 F3:0.5 E3 D3 G2|A2 E3:2 C4|G2 D3:0.5 E3:0.5 F3:2|C3:2 G2 B2|C3:2 E3:0.5 F3:0.5 G3|F3 C4:2 A3|G2:2 D3 F3|G3:0.5 F3:0.5 E3 D3 B2|C3+G3:4'],
]

function createLesson([title, instruction, tempo, right, left, meter = 4, key = 'C', credit]: Exercise, id: number): Lesson {
  const hands: Hand[] = []
  if (right) hands.push('right')
  if (left) hands.push('left')
  const measures = (right || left || '').split('|').length
  if (right && left && right.split('|').length !== left.split('|').length) throw new Error(`Uneven parts: ${title}`)
  return {
    id, title, instruction, tempo, meter, key, measures, hands, credit,
    events: [...(right ? readPart(right, 'right', meter) : []), ...(left ? readPart(left, 'left', meter) : [])],
  }
}

const sections = [
  { title: 'Keyboard & notation', exercises: course.slice(0, 6) },
  { title: 'One hand at a time', exercises: course.slice(6, 12) },
  { title: 'Hands together', exercises: course.slice(12, 18) },
  { title: 'Repertoire', exercises: course.slice(18) },
  { title: 'Familiar melodies', exercises: familiarMelodies },
  { title: 'Classical & traditional studies', exercises: classicalStudies },
]
let nextId = 1
export const units = sections.map(({ title, exercises }) => ({
  title,
  lessons: exercises.map(exercise => createLesson(exercise, nextId++)),
}))
export const lessons = units.flatMap(unit => unit.lessons)
