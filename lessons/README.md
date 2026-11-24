# Contributing a Pianoles lesson

Each lesson lives in its own folder, such as `037-echo-steps/lesson.yaml`. The app discovers and validates these files during the build. You can add a lesson without editing TypeScript.

## Add a lesson

1. Find the highest lesson ID and use the next number. Give the folder that ID, padded to three digits, followed by a lowercase, hyphenated slug. Keep published IDs stable because lesson links and saved progress use them.
2. Copy the example below into `lesson.yaml`. Set `unit` to the last published unit to extend it, or start a new unit. A unit occupies a continuous range of IDs.
3. After `npm ci`, run `npm test` and `npm run build` from the repository root. Errors identify the file and, for note problems, the hand and measure. Use `npm run dev` and open `/pianoles/#/lesson/<id>` to check notation, playback, and practice.

```yaml
id: 89
unit: More practice
title: Two simple chords
instruction: Play each chord together and hold it while the bar fills.
tempo: 64
meter: 4
key: C
parts:
  right:
    - 'C4/1+E4/3:2 G4/5:2'
    - 'D4/2+F4/4:2 C4/1:2'
  left:
    - 'C3/5:4'
    - 'G3/1:2 C3/5:2'
pedal:
  - { measure: 1, beat: 1, action: down }
  - { measure: 1, beat: 4.5, action: up }
  - { measure: 2, beat: 1, action: down }
  - { measure: 3, beat: 1, action: up }
```

## Fields and notation

| Field | What to write |
| --- | --- |
| `id`, `unit`, `title` | The stable lesson number, catalog group, and display title. |
| `instruction` | A short practice goal with concrete guidance. Use a literal block (`|-`) to separate teaching steps across a few paragraphs. |
| `tempo` | Quarter notes per minute from 35 to 150. |
| `meter` | Quarter-note beats per measure. Use 2, 3, or 4. |
| `key` | `C`, `Am`, `G`, `Em`, `D`, `Bm`, `F`, `Dm`, `Bb`, `Gm`, `Eb`, or `Cm`. Spell accidentals in the notes even when they are in the key signature. |
| `parts` | A `right` and/or `left` list. Each list item is one measure and both parts must have the same number of measures. |
| `credit` | Optional for original exercises. For a public-domain arrangement, name the composer or tradition, the source work or tune, and mark any excerpt, transposition, or adaptation. |
| `pedal` | Optional sustain cues. Count measures and beats from 1, with half beats accepted. Cues must alternate `down` and `up`. A final lift can be at beat 1 of the measure after the last bar. |

Write notes as pitch plus octave, with middle C written `C4`. The playable range is `C2` through `F5`. Write sharps with `#` and flats with `b`. Separate events with spaces and join notes of a chord with `+`. A slash adds optional fingering, from `/1` for thumb to `/5` for little finger. For example, `C4/1+E4/3:2` is a two-beat chord.

An event without a duration lasts one beat. Append `:0.5` for an eighth note, `:1.5` for a dotted quarter, `:2` for a half note, `:3` for a dotted half, or `:4` for a whole note. Use `-` for a rest, such as `-:2` for two beats of silence. The durations must fill every measure exactly. Quote measure strings to keep YAML punctuation unambiguous.

For repertoire, transcribe a public-domain composition or write your own arrangement of it. Use public-domain source editions and leave out modern arrangements, recordings, and other assets you lack permission to share.
