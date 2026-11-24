import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fingerFor, lastLessonWithFingerings } from '../src/fingering'
import { lessons } from '../src/lessons'

test('authored fingerings cover beginner notes without reusing a finger in a chord', () => {
  for (const lesson of lessons.slice(0, lastLessonWithFingerings)) {
    for (const event of lesson.events) {
      const fingers = event.notes.map(note => fingerFor(lesson, event, note.spelling))
      assert.ok(fingers.every(finger => finger !== undefined), `Lesson ${lesson.id}, beat ${event.beat}`)
      assert.equal(new Set(fingers).size, fingers.length)
    }
  }
})

test('fingering follows the hand and a change of position', () => {
  const bass = lessons[3]
  assert.equal(fingerFor(bass, bass.events[0], 'C3'), 5)
  const shift = lessons[11]
  const notes = shift.events.filter(event => event.notes[0]?.spelling === 'G4')
  assert.deepEqual(notes.map(event => fingerFor(shift, event, 'G4')), [5, 1, 1, 1])
})
