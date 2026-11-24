import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseLesson } from '../src/lesson-files'
import { pedalAt, pedalSpans, playbackBeats } from '../src/pedal'
import { lessons, playingLessons } from './catalog'

const example = `
id: 87
unit: More practice
title: Pedal and chords
instruction: Hold the chord, then lift the pedal.
tempo: 60
meter: 4
key: C
parts:
  right:
    - 'C4/1+E4/3:2 G4/5:2'
pedal:
  - { measure: 1, beat: 1, action: down }
  - { measure: 2, beat: 1, action: up }
`

test('YAML holds both fingering and score-relative pedal cues', () => {
  const lesson = parseLesson(example)
  assert.equal(lesson.kind, 'playing')
  assert.deepEqual(lesson.events[0].notes, [{ midi: 60, spelling: 'C4', finger: 1 }, { midi: 64, spelling: 'E4', finger: 3 }])
  assert.deepEqual(lesson.pedal, [{ beat: 0, down: true }, { beat: 4, down: false }])
  assert.equal(pedalAt(lesson.pedal, 3.5), true)
  assert.equal(pedalAt(lesson.pedal, 4), false)
  assert.deepEqual(pedalSpans(lesson.pedal, 2, 6), [{ start: 2, end: 4 }])
  assert.equal(playbackBeats(lesson.events[0], lesson.pedal, 4), 4)
  assert.equal(playbackBeats(lesson.events[0], lesson.pedal, 3), 3)
})

test('malformed lesson files report what the author should fix', () => {
  assert.throws(() => parseLesson(example.replace('E4/3', 'E4/1')), /right measure 1: Repeated finger/)
  assert.throws(() => parseLesson(example.replace('G4/5:2', 'G4/5')), /Expected 4 beats, found 3/)
  assert.throws(() => parseLesson(example.replace('G4', 'G5')), /outside C2–F5/)
  assert.throws(() => parseLesson(example.replace('action: up', 'action: down')), /alternate down and up/)
  assert.throws(() => parseLesson(example.replace('measure: 2, beat: 1', 'measure: 2, beat: 2')), /within the score/)
  assert.throws(() => parseLesson(example.replace('tempo:', 'bpm:')), /Unknown field lesson.bpm/)
})

test('the expansion includes credited historical works and pedal studies', () => {
  assert.ok(playingLessons.slice(46, 56).every(lesson => lesson.credit))
  assert.ok(playingLessons.slice(76, 86).every(lesson => lesson.credit))
  assert.equal(playingLessons[74].title, 'First Sustain Pedal')
  assert.ok(playingLessons[74].pedal.length)
  assert.equal(playingLessons[85].title, 'Chopin Prelude in E Minor · opening study')
})

test('music theory lessons teach clefs, durations, rests, and multiple meters with no hand parts', () => {
  const [treble, bass, durations, meter] = lessons.slice(86, 90)
  assert.equal(treble.kind, 'theory')
  assert.equal(bass.kind, 'theory')
  assert.equal(durations.kind, 'theory')
  assert.equal(meter.kind, 'theory')
  assert.ok(treble.examples.some(example => example.visual.type === 'note' &&
    example.visual.pitch === 'C4' && example.visual.clef === 'treble'))
  assert.ok(bass.examples.some(example => example.visual.type === 'note' &&
    example.visual.pitch === 'C4' && example.visual.clef === 'bass'))
  assert.ok(durations.examples.some(example => example.visual.type === 'rest'))
  assert.ok(durations.examples.some(example => example.visual.type === 'note' && example.visual.value === 'dotted-quarter'))
  assert.deepEqual(meter.examples.flatMap(({ visual }) => visual.type === 'meter' ? visual.signature : []), ['2/4', '3/4', '4/4', '6/8', '2/2'])
  assert.ok([treble, bass, durations, meter].every(lesson => !('parts' in lesson)))
})

test('theory validation rejects unsupported visuals, wrong answers, and playing fields', () => {
  const source = readFileSync(new URL('../lessons/087-read-treble-clef/lesson.yaml', import.meta.url), 'utf8')
  assert.throws(() => parseLesson(source.replace('answer: G', 'answer: X')), /answer must match/)
  assert.throws(() => parseLesson(source.replace('clef: treble', 'clef: alto')), /visual.clef/)
  assert.throws(() => parseLesson(source + '\ntempo: 60'), /Unknown field theory lesson.tempo/)
})
