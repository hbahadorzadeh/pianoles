import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lessons } from '../src/lessons'
import { matchTiming, matchesChord, practiceSteps, releasedEarly, scoreAttempt } from '../src/practice'

test('curriculum has 24 ordered, complete lessons within the playable keyboard', () => {
  assert.deepEqual(lessons.map(lesson => lesson.id), Array.from({ length: 24 }, (_, i) => i + 1))
  for (const lesson of lessons) {
    for (const hand of lesson.hands) {
      const events = lesson.events.filter(event => event.hand === hand)
      let beat = 0
      for (const event of events) {
        assert.equal(event.beat, beat)
        beat += event.duration
        assert.ok(beat <= (Math.floor(event.beat / lesson.meter) + 1) * lesson.meter)
        for (const note of event.notes) assert.ok(note.midi >= 36 && note.midi <= 77)
      }
      assert.equal(beat, lesson.meter * lesson.measures)
    }
  }
  assert.deepEqual(lessons[23].hands, ['right', 'left'])
  assert.equal(lessons[23].measures, 12)
})

test('guided steps merge hands, skip rests and preserve repeated notes', () => {
  const first = practiceSteps(lessons[0], 'right', 1, 2)
  assert.deepEqual(first.map(step => step.beat), [0, 2, 4, 5, 6])
  assert.deepEqual(practiceSteps(lessons[5], 'right', 1, 1).map(step => step.beat), [0, 2])
  const both = practiceSteps(lessons[14], 'both', 1, 1)
  assert.ok(matchesChord(both[0].pitches, new Set([48, 60, 64])))
  assert.ok(!matchesChord(both[0].pitches, new Set([48, 60])))
  assert.ok(!matchesChord(both[0].pitches, new Set([48, 60, 64, 65])))
  const isolated = practiceSteps(lessons[12], 'left', 2, 2)
  assert.deepEqual(isolated.map(step => step.beat), [0, 1, 2])
})

test('timed scoring distinguishes wrong pitch, timing and extra strikes', () => {
  const steps = [{ beat: 0, pitches: new Set([60, 64]) }, { beat: 1, pitches: new Set([60]) }]
  assert.deepEqual(scoreAttempt(steps, [
    { pitch: 60, beat: 0.08 }, { pitch: 64, beat: 0.32 }, { pitch: 60, beat: 1.1 }, { pitch: 55, beat: 1.2 },
  ], 1), { pitch: 75, timing: 50 })
  assert.deepEqual(scoreAttempt(steps, [], 1), { pitch: 0, timing: 0 })
})

test('a stray early repeat does not displace later on-time strikes', () => {
  const steps = [{ beat: 1, pitches: new Set([60]) }, { beat: 2, pitches: new Set([60]) }]
  const hits = [{ pitch: 60, beat: 0.5 }, { pitch: 60, beat: 1 }, { pitch: 60, beat: 2 }]
  assert.deepEqual(scoreAttempt(steps, hits, 1), { pitch: 67, timing: 67 })
})


test('live timing distinguishes early, on-beat and late hits and ignores unrelated notes', () => {
  const steps = [
    { beat: 0, pitches: new Set([60, 64]) },
    { beat: 1, pitches: new Set([60]) },
  ]
  const claimed = new Set<number>()
  assert.equal(matchTiming(steps, { pitch: 60, beat: -0.25 }, 1, claimed)?.feedback, 'early')
  assert.equal(matchTiming(steps, { pitch: 60, beat: 0.1 }, 1, claimed)?.feedback, 'on-beat')
  assert.equal(matchTiming(steps, { pitch: 64, beat: 0.24 }, 1, claimed)?.feedback, 'late')
  assert.equal(matchTiming(steps, { pitch: 61, beat: 0 }, 1, claimed), undefined)
  claimed.add(0)
  assert.equal(matchTiming(steps, { pitch: 60, beat: 0.22 }, 1, claimed), undefined)
  assert.equal(matchTiming(steps, { pitch: 60, beat: 0.75 }, 1, claimed)?.beat, 1)
  assert.equal(matchTiming(steps, { pitch: 60, beat: 0.75 }, 0.5, claimed)?.feedback, 'on-beat')
})

test('short holds allow a small gap and still detect early releases at fast tempos', () => {
  assert.equal(releasedEarly(700, 1000), true)
  assert.equal(releasedEarly(820, 1000), false)
  assert.equal(releasedEarly(149, 200), true)
  assert.equal(releasedEarly(150, 200), false)
})
